// E2E-style tests for error handling and recovery flows.
// Verifies that API errors (502, 429, network failure) return the correct
// error structure and that the client can determine retryability.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ApiError, AnalyzeResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// Helpers — mirror the error handling logic from app/page.tsx handleSubmit
// ---------------------------------------------------------------------------

interface SubmitResult {
  state: "result" | "input";
  data?: AnalyzeResponse;
  error?: ApiError;
  rateLimitInfo: { remaining: number; reset: number };
}

/**
 * Simulates the full handleSubmit flow from page.tsx:
 *   1. Call fetch
 *   2. Parse rate limit headers
 *   3. If !ok, parse error body and set retryAfter for 429
 *   4. If ok, parse response body
 *   5. If fetch rejects, return NETWORK_ERROR
 */
async function simulateSubmit(input: string): Promise<SubmitResult> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const remaining = parseInt(
      response.headers.get("X-RateLimit-Remaining") ?? "10"
    );
    const reset = parseInt(
      response.headers.get("X-RateLimit-Reset") ?? "0"
    );
    const rateLimitInfo = { remaining, reset };

    if (!response.ok) {
      const errorBody: ApiError = await response.json();
      if (response.status === 429) {
        errorBody.retryAfter = parseInt(
          response.headers.get("Retry-After") ?? "60"
        );
      }
      return { state: "input", error: errorBody, rateLimitInfo };
    }

    const data: AnalyzeResponse = await response.json();
    return { state: "result", data, rateLimitInfo };
  } catch {
    return {
      state: "input",
      error: {
        error: "NETWORK_ERROR",
        message:
          "Could not reach the judgment tribunal. Check your internet connection and try again.",
        retryable: true,
      },
      rateLimitInfo: { remaining: 10, reset: 0 },
    };
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Error Recovery Flow", () => {
  // ── 502 Server Error ───────────────────────────────────────────────────

  describe("API returns 502 (server error)", () => {
    it("returns retryable error with AI_SERVICE_ERROR code", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () =>
          Promise.resolve({
            error: "AI_SERVICE_ERROR",
            message: "Our AI had a meltdown. Try again in a moment.",
            retryable: true,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "8",
          "X-RateLimit-Reset": "1700000000",
        }),
      });

      const result = await simulateSubmit("I showed up to the wrong funeral");

      expect(result.state).toBe("input");
      expect(result.error).toBeDefined();
      expect(result.error!.error).toBe("AI_SERVICE_ERROR");
      expect(result.error!.retryable).toBe(true);
      expect(result.error!.message).toBeTypeOf("string");
      expect(result.error!.message.length).toBeGreaterThan(0);
    });

    it("preserves rate limit info even on server error", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () =>
          Promise.resolve({
            error: "AI_SERVICE_ERROR",
            message: "Server broke",
            retryable: true,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "6",
          "X-RateLimit-Reset": "1700001000",
        }),
      });

      const result = await simulateSubmit("I challenged my boss to arm wrestling");

      expect(result.rateLimitInfo.remaining).toBe(6);
      expect(result.rateLimitInfo.reset).toBe(1700001000);
    });

    it("user can retry after 502 and get a successful response", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: 502
          return Promise.resolve({
            ok: false,
            status: 502,
            json: () =>
              Promise.resolve({
                error: "AI_SERVICE_ERROR",
                message: "Server temporarily unavailable",
                retryable: true,
              }),
            headers: new Headers({
              "X-RateLimit-Remaining": "9",
              "X-RateLimit-Reset": "1700000000",
            }),
          });
        }
        // Second call: success
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              score: 88,
              verdict: "Truly unhinged",
              profile: "Chaos incarnate",
              comparisons: [
                { name: "Loki", percentage: 90, description: "God of mischief vibes" },
                { name: "Dennis Rodman", percentage: 75, description: "Unpredictable energy" },
              ],
              recommendation: "Embrace the chaos",
              metadata: { model: "llama-3.3-70b-versatile", processingTime: 800 },
            }),
          headers: new Headers({
            "X-RateLimit-Remaining": "8",
            "X-RateLimit-Reset": "1700000000",
          }),
        });
      });

      // First attempt fails
      const result1 = await simulateSubmit("I let autocorrect send my resignation");
      expect(result1.state).toBe("input");
      expect(result1.error!.retryable).toBe(true);

      // Retry succeeds
      const result2 = await simulateSubmit("I let autocorrect send my resignation");
      expect(result2.state).toBe("result");
      expect(result2.data).toBeDefined();
      expect(result2.data!.score).toBe(88);
    });
  });

  // ── 429 Rate Limited ───────────────────────────────────────────────────

  describe("API returns 429 (rate limited)", () => {
    it("returns rate limit error with retryAfter from header", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: "RATE_LIMITED",
            message: "You've been judged enough for now.",
            retryable: true,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1700000120",
          "Retry-After": "120",
        }),
      });

      const result = await simulateSubmit("I microwaved fish in the office kitchen");

      expect(result.state).toBe("input");
      expect(result.error).toBeDefined();
      expect(result.error!.error).toBe("RATE_LIMITED");
      expect(result.error!.retryable).toBe(true);
      expect(result.error!.retryAfter).toBe(120);
      expect(result.rateLimitInfo.remaining).toBe(0);
    });

    it("defaults retryAfter to 60 when Retry-After header is missing", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () =>
          Promise.resolve({
            error: "RATE_LIMITED",
            message: "Slow down.",
            retryable: true,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1700000060",
          // No Retry-After
        }),
      });

      const result = await simulateSubmit("I wore crocs to a black tie event");

      expect(result.error!.retryAfter).toBe(60);
    });
  });

  // ── Network Failure ────────────────────────────────────────────────────

  describe("Network failure", () => {
    it("returns NETWORK_ERROR with retryable flag", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(
        new TypeError("Failed to fetch")
      );

      const result = await simulateSubmit("I taught my parrot to swear at guests");

      expect(result.state).toBe("input");
      expect(result.error).toBeDefined();
      expect(result.error!.error).toBe("NETWORK_ERROR");
      expect(result.error!.retryable).toBe(true);
      expect(result.error!.message).toContain("internet connection");
    });

    it("does not modify rate limit info on network failure", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(
        new TypeError("Network request failed")
      );

      const result = await simulateSubmit("I invested savings in a lemonade stand");

      // Rate limit info should use defaults since no response was received
      expect(result.rateLimitInfo.remaining).toBe(10);
      expect(result.rateLimitInfo.reset).toBe(0);
    });

    it("user can retry after network failure and succeed", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new TypeError("Failed to fetch"));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              score: 42,
              verdict: "Mildly chaotic",
              profile: "Controlled chaos",
              comparisons: [
                { name: "Jack Sparrow", percentage: 65, description: "Stumbling into success" },
                { name: "The Joker", percentage: 40, description: "Calculated randomness" },
              ],
              recommendation: "Keep being you, but maybe less so",
              metadata: { model: "llama-3.3-70b-versatile", processingTime: 600 },
            }),
          headers: new Headers({
            "X-RateLimit-Remaining": "9",
            "X-RateLimit-Reset": "1700000000",
          }),
        });
      });

      // First attempt: network failure
      const result1 = await simulateSubmit("I brought a resume to Thanksgiving dinner");
      expect(result1.state).toBe("input");
      expect(result1.error!.error).toBe("NETWORK_ERROR");

      // Retry: success
      const result2 = await simulateSubmit("I brought a resume to Thanksgiving dinner");
      expect(result2.state).toBe("result");
      expect(result2.data!.score).toBe(42);
    });
  });

  // ── Other error codes ──────────────────────────────────────────────────

  describe("AI-specific errors", () => {
    it("AI_TIMEOUT returns retryable error", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: () =>
          Promise.resolve({
            error: "AI_TIMEOUT",
            message: "The AI took too long to judge you. Try again.",
            retryable: true,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "7",
          "X-RateLimit-Reset": "1700000000",
        }),
      });

      const result = await simulateSubmit("I asked for a divorce via PowerPoint");

      expect(result.state).toBe("input");
      expect(result.error!.error).toBe("AI_TIMEOUT");
      expect(result.error!.retryable).toBe(true);
    });

    it("AI_PARSE_ERROR returns retryable error", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: "AI_PARSE_ERROR",
            message: "The AI's response was incomprehensible. Even for us.",
            retryable: true,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "5",
          "X-RateLimit-Reset": "1700000000",
        }),
      });

      const result = await simulateSubmit("I emailed HR about a dream I had");

      expect(result.state).toBe("input");
      expect(result.error!.error).toBe("AI_PARSE_ERROR");
      expect(result.error!.retryable).toBe(true);
    });

    it("INVALID_INPUT returns non-retryable error", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: "INVALID_INPUT",
            message: "That's not something we can work with.",
            retryable: false,
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "9",
          "X-RateLimit-Reset": "1700000000",
        }),
      });

      const result = await simulateSubmit("   ");

      expect(result.state).toBe("input");
      expect(result.error!.error).toBe("INVALID_INPUT");
      expect(result.error!.retryable).toBe(false);
    });
  });

  // ── State machine transitions ──────────────────────────────────────────

  describe("state machine transitions on error", () => {
    it("returns to 'input' state on any error", async () => {
      const errorCases = [
        { status: 400, error: "INPUT_TOO_SHORT" },
        { status: 429, error: "RATE_LIMITED" },
        { status: 500, error: "INTERNAL_ERROR" },
        { status: 502, error: "AI_SERVICE_ERROR" },
        { status: 504, error: "AI_TIMEOUT" },
      ];

      for (const { status, error: errorCode } of errorCases) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          json: () =>
            Promise.resolve({
              error: errorCode,
              message: `Error: ${errorCode}`,
              retryable: status >= 500,
            }),
          headers: new Headers({
            "X-RateLimit-Remaining": "5",
            "X-RateLimit-Reset": "1700000000",
            ...(status === 429 ? { "Retry-After": "60" } : {}),
          }),
        });

        const result = await simulateSubmit("I got a face tattoo on a dare");
        expect(result.state).toBe("input");
        expect(result.error).toBeDefined();
        expect(result.error!.error).toBe(errorCode);
      }
    });

    it("transitions to 'result' state only on success", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            score: 91,
            verdict: "Absolutely legendary",
            profile: "Peak chaos energy",
            comparisons: [
              { name: "Evel Knievel", percentage: 92, description: "Death-defying" },
              { name: "Nikola Tesla", percentage: 78, description: "Brilliant but reckless" },
              { name: "Guy Fieri", percentage: 65, description: "Flavor town energy" },
            ],
            recommendation: "You're beyond help. We salute you.",
            metadata: { model: "llama-3.3-70b-versatile", processingTime: 1100 },
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "3",
          "X-RateLimit-Reset": "1700000000",
        }),
      });

      const result = await simulateSubmit("I proposed at someone else's wedding");
      expect(result.state).toBe("result");
      expect(result.data).toBeDefined();
      expect(result.data!.score).toBe(91);
      expect(result.error).toBeUndefined();
    });
  });
});
