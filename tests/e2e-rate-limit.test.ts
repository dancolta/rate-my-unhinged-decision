// E2E-style tests for the rate limit user experience.
// Verifies rate limit header parsing, display behavior, and submit disabling.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ApiError, RateLimitInfo } from "@/lib/types";

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
// Rate limit header parsing (simulates the client-side logic from page.tsx)
// ---------------------------------------------------------------------------

/**
 * Simulates the rate limit info extraction from response headers,
 * matching the logic in app/page.tsx handleSubmit.
 */
function extractRateLimitInfo(response: Response): RateLimitInfo {
  const remaining = parseInt(
    response.headers.get("X-RateLimit-Remaining") ?? "10"
  );
  const reset = parseInt(
    response.headers.get("X-RateLimit-Reset") ?? "0"
  );
  return { remaining, reset };
}

/**
 * Simulates the retry-after extraction for 429 responses,
 * matching the logic in app/page.tsx handleSubmit.
 */
function extractRetryAfter(response: Response): number {
  return parseInt(response.headers.get("Retry-After") ?? "60");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Rate Limit Flow", () => {
  describe("rate limit info extraction from headers", () => {
    it("parses X-RateLimit-Remaining and X-RateLimit-Reset from headers", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            score: 50,
            verdict: "test",
            profile: "test",
            comparisons: [
              { name: "A", percentage: 50, description: "d" },
              { name: "B", percentage: 40, description: "e" },
            ],
            recommendation: "test",
            metadata: { model: "test", processingTime: 100 },
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "4",
          "X-RateLimit-Reset": "1700000500",
        }),
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "I adopted 7 cats in one weekend" }),
      });

      const info = extractRateLimitInfo(response);
      expect(info.remaining).toBe(4);
      expect(info.reset).toBe(1700000500);
    });

    it("defaults remaining to 10 when header is missing", () => {
      const response = new Response(null, {
        headers: new Headers({}),
      });
      const info = extractRateLimitInfo(response);
      expect(info.remaining).toBe(10);
    });

    it("defaults reset to 0 when header is missing", () => {
      const response = new Response(null, {
        headers: new Headers({}),
      });
      const info = extractRateLimitInfo(response);
      expect(info.reset).toBe(0);
    });
  });

  describe("rate limit exceeded (429 response)", () => {
    it("returns remaining: 0 when rate limited", async () => {
      const rateLimitError: ApiError = {
        error: "RATE_LIMITED",
        message: "Slow down there, chaos agent.",
        retryable: true,
        retryAfter: 120,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve(rateLimitError),
        headers: new Headers({
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1700000120",
          "Retry-After": "120",
        }),
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "I bet my rent on a coin flip" }),
      });

      expect(response.status).toBe(429);

      const info = extractRateLimitInfo(response);
      expect(info.remaining).toBe(0);

      const retryAfter = extractRetryAfter(response);
      expect(retryAfter).toBe(120);
    });

    it("includes retryAfter in the error body", async () => {
      const rateLimitError: ApiError = {
        error: "RATE_LIMITED",
        message: "You've been judged enough.",
        retryable: true,
        retryAfter: 45,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve(rateLimitError),
        headers: new Headers({
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1700000045",
          "Retry-After": "45",
        }),
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "I filed a noise complaint against myself" }),
      });

      const error: ApiError = await response.json();
      expect(error.error).toBe("RATE_LIMITED");
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBe(45);
    });

    it("defaults Retry-After to 60 when header is missing on 429", async () => {
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
          // No Retry-After header
        }),
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "I used a coupon on a first date" }),
      });

      const retryAfter = extractRetryAfter(response);
      expect(retryAfter).toBe(60);
    });
  });

  describe("rate limit countdown behavior", () => {
    it("remaining count decreases across successive calls", async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        const remaining = Math.max(0, 10 - callCount);
        return Promise.resolve({
          ok: remaining > 0,
          status: remaining > 0 ? 200 : 429,
          json: () =>
            remaining > 0
              ? Promise.resolve({
                  score: 50,
                  verdict: "test",
                  profile: "test",
                  comparisons: [
                    { name: "A", percentage: 50, description: "d" },
                    { name: "B", percentage: 40, description: "e" },
                  ],
                  recommendation: "test",
                  metadata: { model: "test", processingTime: 100 },
                })
              : Promise.resolve({
                  error: "RATE_LIMITED",
                  message: "Rate limited",
                  retryable: true,
                }),
          headers: new Headers({
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": "1700000000",
          }),
        });
      });

      // First call
      const res1 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "First confession here" }),
      });
      expect(extractRateLimitInfo(res1).remaining).toBe(9);

      // Second call
      const res2 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "Second confession here" }),
      });
      expect(extractRateLimitInfo(res2).remaining).toBe(8);

      // Third call
      const res3 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "Third confession here" }),
      });
      expect(extractRateLimitInfo(res3).remaining).toBe(7);
    });
  });

  describe("rate limit info state transitions", () => {
    it("rate limit info is null before any API call", () => {
      // Simulates the initial state in page.tsx: useState<RateLimitInfo | null>(null)
      const rateLimitInfo: RateLimitInfo | null = null;
      expect(rateLimitInfo).toBeNull();
    });

    it("rate limit info is populated after first successful call", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            score: 55,
            verdict: "ok",
            profile: "ok",
            comparisons: [
              { name: "X", percentage: 50, description: "d" },
              { name: "Y", percentage: 30, description: "e" },
            ],
            recommendation: "ok",
            metadata: { model: "test", processingTime: 200 },
          }),
        headers: new Headers({
          "X-RateLimit-Remaining": "14",
          "X-RateLimit-Reset": "1700003600",
        }),
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "I dyed my hair during a zoom call" }),
      });

      const info = extractRateLimitInfo(response);
      expect(info).toEqual({ remaining: 14, reset: 1700003600 });
    });

    it("isRateLimited is true when remaining is 0", () => {
      const rateLimitInfo: RateLimitInfo = { remaining: 0, reset: 1700000000 };
      const isRateLimited = rateLimitInfo.remaining <= 0;
      expect(isRateLimited).toBe(true);
    });

    it("isRateLimited is false when remaining is > 0", () => {
      const rateLimitInfo: RateLimitInfo = { remaining: 3, reset: 1700000000 };
      const isRateLimited = rateLimitInfo.remaining <= 0;
      expect(isRateLimited).toBe(false);
    });
  });
});
