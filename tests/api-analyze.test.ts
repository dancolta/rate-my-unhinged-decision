// Integration tests for POST /api/analyze route handler
// Mocks: @/lib/ai (analyzeDecision), @/lib/limits (rateLimiter, getClientIP)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks — must be declared before the module under test is imported
// ---------------------------------------------------------------------------

const mockAnalyzeDecision = vi.fn();
const mockRateLimiterLimit = vi.fn();
const mockGetClientIP = vi.fn();

vi.mock("@/lib/ai", () => ({
  analyzeDecision: (...args: unknown[]) => mockAnalyzeDecision(...args),
  AIError: class AIError extends Error {
    code: string;
    retryable: boolean;
    constructor(code: string, message: string, retryable = true) {
      super(message);
      this.name = "AIError";
      this.code = code;
      this.retryable = retryable;
    }
  },
}));

vi.mock("@/lib/limits", () => ({
  rateLimiter: { limit: (...args: unknown[]) => mockRateLimiterLimit(...args) },
  getClientIP: (...args: unknown[]) => mockGetClientIP(...args),
}));

// Import the route handler AFTER mocks are in place
import { POST } from "@/app/api/analyze/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_AI_RESPONSE = {
  score: 67,
  verdict: "Test verdict",
  profile: "Test profile",
  comparisons: [
    { name: "Test Figure 1", percentage: 80, description: "Test desc 1" },
    { name: "Test Figure 2", percentage: 50, description: "Test desc 2" },
    { name: "Test Figure 3", percentage: 30, description: "Test desc 3" },
  ],
  recommendation: "Test recommendation",
  _model: "test-model",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();

  // Default: development mode (rate limiting skipped)
  vi.stubEnv("NODE_ENV", "development");

  // Default happy-path mocks
  mockAnalyzeDecision.mockResolvedValue(VALID_AI_RESPONSE);
  mockGetClientIP.mockReturnValue("127.0.0.1");
  mockRateLimiterLimit.mockResolvedValue({
    success: true,
    remaining: 14,
    reset: Date.now() + 3_600_000,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/analyze", () => {
  // -----------------------------------------------------------------------
  // Input validation
  // -----------------------------------------------------------------------

  describe("input validation", () => {
    it("returns 400 INVALID_INPUT for missing input field", async () => {
      const res = await POST(makeRequest({}));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INVALID_INPUT for non-string input (number)", async () => {
      const res = await POST(makeRequest({ input: 42 }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INVALID_INPUT for non-string input (array)", async () => {
      const res = await POST(makeRequest({ input: ["a", "b"] }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INVALID_INPUT for non-string input (null)", async () => {
      const res = await POST(makeRequest({ input: null }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INVALID_INPUT for empty string", async () => {
      const res = await POST(makeRequest({ input: "" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INVALID_INPUT for whitespace-only string", async () => {
      const res = await POST(makeRequest({ input: "   \n\t  " }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INPUT_TOO_SHORT for input shorter than 10 chars", async () => {
      const res = await POST(makeRequest({ input: "short" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INPUT_TOO_SHORT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INPUT_TOO_SHORT for input exactly 9 chars", async () => {
      const res = await POST(makeRequest({ input: "123456789" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INPUT_TOO_SHORT");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INPUT_TOO_LONG for input longer than 500 chars", async () => {
      const longInput = "a".repeat(501);
      const res = await POST(makeRequest({ input: longInput }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INPUT_TOO_LONG");
      expect(json.retryable).toBe(false);
    });

    it("returns 400 INVALID_INPUT for invalid JSON body", async () => {
      // Construct a request with invalid JSON
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json at all",
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe("INVALID_INPUT");
      expect(json.retryable).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // All error responses have a retryable field
  // -----------------------------------------------------------------------

  describe("error response structure", () => {
    it("all error responses include error, message, and retryable fields", async () => {
      // INVALID_INPUT
      const res1 = await POST(makeRequest({}));
      const json1 = await res1.json();
      expect(json1).toHaveProperty("error");
      expect(json1).toHaveProperty("message");
      expect(json1).toHaveProperty("retryable");

      // INPUT_TOO_SHORT
      const res2 = await POST(makeRequest({ input: "short" }));
      const json2 = await res2.json();
      expect(json2).toHaveProperty("error");
      expect(json2).toHaveProperty("message");
      expect(json2).toHaveProperty("retryable");

      // INPUT_TOO_LONG
      const res3 = await POST(makeRequest({ input: "x".repeat(501) }));
      const json3 = await res3.json();
      expect(json3).toHaveProperty("error");
      expect(json3).toHaveProperty("message");
      expect(json3).toHaveProperty("retryable");
    });
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  describe("successful analysis", () => {
    it("returns 200 with valid response for valid input", async () => {
      const res = await POST(makeRequest({ input: "I quit my job to become a full-time clown" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.score).toBe(67);
      expect(json.verdict).toBe("Test verdict");
      expect(json.profile).toBe("Test profile");
      expect(json.recommendation).toBe("Test recommendation");
    });

    it("response includes all expected fields", async () => {
      const res = await POST(makeRequest({ input: "I ate cereal with orange juice this morning" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toHaveProperty("score");
      expect(json).toHaveProperty("verdict");
      expect(json).toHaveProperty("profile");
      expect(json).toHaveProperty("comparisons");
      expect(json).toHaveProperty("recommendation");
      expect(json).toHaveProperty("metadata");
    });

    it("response metadata includes model and processingTime", async () => {
      const res = await POST(makeRequest({ input: "I moved to a new city knowing nobody" }));
      const json = await res.json();

      expect(json.metadata.model).toBe("test-model");
      expect(typeof json.metadata.processingTime).toBe("number");
      expect(json.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("response includes exactly 3 comparisons from mock", async () => {
      const res = await POST(makeRequest({ input: "I adopted seven cats in one weekend" }));
      const json = await res.json();

      expect(json.comparisons).toHaveLength(3);
      expect(json.comparisons[0].name).toBe("Test Figure 1");
      expect(json.comparisons[1].name).toBe("Test Figure 2");
      expect(json.comparisons[2].name).toBe("Test Figure 3");
    });

    it("accepts input at exactly 10 chars (minimum)", async () => {
      const res = await POST(makeRequest({ input: "1234567890" }));
      expect(res.status).toBe(200);
    });

    it("accepts input at exactly 500 chars (maximum)", async () => {
      const res = await POST(makeRequest({ input: "a".repeat(500) }));
      expect(res.status).toBe(200);
    });

    it("passes sanitized input to analyzeDecision", async () => {
      await POST(makeRequest({ input: "  I did something <b>wild</b> today  " }));

      expect(mockAnalyzeDecision).toHaveBeenCalledOnce();
      // sanitizeInput strips HTML and trims
      expect(mockAnalyzeDecision).toHaveBeenCalledWith("I did something wild today");
    });

    it("does not include _model in the response body (moved to metadata)", async () => {
      const res = await POST(makeRequest({ input: "I bought a boat I cannot afford" }));
      const json = await res.json();

      expect(json).not.toHaveProperty("_model");
      expect(json.metadata.model).toBe("test-model");
    });
  });

  // -----------------------------------------------------------------------
  // Rate limiting
  // -----------------------------------------------------------------------

  describe("rate limiting", () => {
    it("skips rate limiting in development (NODE_ENV=development)", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const res = await POST(makeRequest({ input: "I volunteered to present first" }));

      expect(res.status).toBe(200);
      expect(mockRateLimiterLimit).not.toHaveBeenCalled();
    });

    it("applies rate limiting in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mockRateLimiterLimit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 3_600_000,
      });

      const res = await POST(makeRequest({ input: "I signed up for a marathon tomorrow" }));

      expect(res.status).toBe(200);
      expect(mockRateLimiterLimit).toHaveBeenCalledOnce();
    });

    it("returns 429 RATE_LIMITED when rate limit exceeded", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mockRateLimiterLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 60_000,
      });

      const res = await POST(makeRequest({ input: "I texted my ex at 3am again" }));
      const json = await res.json();

      expect(res.status).toBe(429);
      expect(json.error).toBe("RATE_LIMITED");
      expect(json.retryable).toBe(true);
      expect(res.headers.get("Retry-After")).toBeTruthy();
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("continues with analysis if rate limiter throws (fail open)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      mockRateLimiterLimit.mockRejectedValue(new Error("Redis is down"));

      const res = await POST(makeRequest({ input: "I ate the last slice of pizza" }));

      expect(res.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // Cache-Control header
  // -----------------------------------------------------------------------

  describe("response headers", () => {
    it("sets Cache-Control: no-store on success", async () => {
      const res = await POST(makeRequest({ input: "I dyed my hair neon green" }));

      expect(res.headers.get("Cache-Control")).toBe("no-store");
    });

    it("sets Cache-Control: no-store on error", async () => {
      const res = await POST(makeRequest({}));

      expect(res.headers.get("Cache-Control")).toBe("no-store");
    });
  });
});
