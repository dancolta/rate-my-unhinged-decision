// E2E-style integration tests for the full analysis happy path.
// Mocks the fetch API and verifies the request/response contract
// between the client and /api/analyze.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AnalyzeResponse, ApiError } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock response data
// ---------------------------------------------------------------------------

const mockResponse: AnalyzeResponse = {
  score: 73,
  verdict: "You've achieved a rare feat of social chaos",
  profile: "You exhibit classic impulse-driven behavior with a flair for the dramatic",
  comparisons: [
    {
      name: "Icarus",
      percentage: 85,
      description: "Flew too close to the sun, but at least looked cool doing it",
    },
    {
      name: "Michael Scott",
      percentage: 72,
      description: "Good intentions, questionable execution, maximum cringe",
    },
    {
      name: "Florida Man",
      percentage: 60,
      description: "Chaotic energy with a headline-worthy outcome",
    },
  ],
  recommendation: "Next time, maybe sleep on it. Or at least wait until after lunch.",
  metadata: { model: "llama-3.3-70b-versatile", processingTime: 1200 },
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // Reset fetch mock before each test
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("Full Analysis Flow", () => {
  it("sends input and receives structured response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      headers: new Headers({
        "X-RateLimit-Remaining": "9",
        "X-RateLimit-Reset": "1234567890",
      }),
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "I quit my job via carrier pigeon" }),
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data: AnalyzeResponse = await response.json();

    // Verify response structure
    expect(data.score).toBeTypeOf("number");
    expect(data.score).toBeGreaterThanOrEqual(0);
    expect(data.score).toBeLessThanOrEqual(100);
    expect(data.verdict).toBeTypeOf("string");
    expect(data.verdict.length).toBeGreaterThan(0);
    expect(data.profile).toBeTypeOf("string");
    expect(data.profile.length).toBeGreaterThan(0);
    expect(data.recommendation).toBeTypeOf("string");
    expect(data.recommendation.length).toBeGreaterThan(0);
    expect(data.comparisons).toBeInstanceOf(Array);
    expect(data.comparisons.length).toBeGreaterThanOrEqual(2);
    expect(data.comparisons.length).toBeLessThanOrEqual(4);

    // Verify comparison structure
    for (const comp of data.comparisons) {
      expect(comp.name).toBeTypeOf("string");
      expect(comp.percentage).toBeTypeOf("number");
      expect(comp.percentage).toBeGreaterThanOrEqual(0);
      expect(comp.percentage).toBeLessThanOrEqual(100);
      expect(comp.description).toBeTypeOf("string");
    }

    // Verify metadata
    expect(data.metadata).toBeDefined();
    expect(data.metadata.model).toBeTypeOf("string");
    expect(data.metadata.processingTime).toBeTypeOf("number");
  });

  it("sends the correct request shape", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      headers: new Headers({
        "X-RateLimit-Remaining": "8",
        "X-RateLimit-Reset": "1234567890",
      }),
    });
    globalThis.fetch = mockFetch;

    const input = "I told my landlord I was a professional clown";
    await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
  });

  it("extracts rate limit info from response headers", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      headers: new Headers({
        "X-RateLimit-Remaining": "5",
        "X-RateLimit-Reset": "1700000000",
      }),
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "I ate gas station sushi twice" }),
    });

    const remaining = parseInt(
      response.headers.get("X-RateLimit-Remaining") ?? "10"
    );
    const reset = parseInt(
      response.headers.get("X-RateLimit-Reset") ?? "0"
    );

    expect(remaining).toBe(5);
    expect(reset).toBe(1700000000);
  });

  it("returns a score matching the mock data", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      headers: new Headers(),
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "I started a cult accidentally" }),
    });

    const data = await response.json();
    expect(data.score).toBe(73);
    expect(data.verdict).toBe("You've achieved a rare feat of social chaos");
  });
});

// ---------------------------------------------------------------------------
// Error scenarios
// ---------------------------------------------------------------------------

describe("Error Scenarios", () => {
  it("rate limit exceeded returns 429 with error structure", async () => {
    const rateLimitError: ApiError = {
      error: "RATE_LIMITED",
      message: "You've been judged enough for now. Take a breather.",
      retryable: true,
      retryAfter: 60,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve(rateLimitError),
      headers: new Headers({
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1700000060",
        "Retry-After": "60",
      }),
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "Another unhinged confession" }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(429);

    const error: ApiError = await response.json();
    expect(error.error).toBe("RATE_LIMITED");
    expect(error.message).toBeTypeOf("string");
    expect(error.retryable).toBe(true);

    const retryAfter = parseInt(
      response.headers.get("Retry-After") ?? "60"
    );
    expect(retryAfter).toBeGreaterThan(0);
  });

  it("invalid input returns 400 with error structure", async () => {
    const inputError: ApiError = {
      error: "INPUT_TOO_SHORT",
      message: "Give us more to work with — at least 10 characters.",
      retryable: false,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve(inputError),
      headers: new Headers({
        "X-RateLimit-Remaining": "9",
        "X-RateLimit-Reset": "1700000000",
      }),
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "short" }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);

    const error: ApiError = await response.json();
    expect(error.error).toBe("INPUT_TOO_SHORT");
    expect(error.retryable).toBe(false);
  });

  it("server error returns 502 with retryable error structure", async () => {
    const serverError: ApiError = {
      error: "AI_SERVICE_ERROR",
      message: "Our AI analyst had a meltdown. Try again in a moment.",
      retryable: true,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve(serverError),
      headers: new Headers({
        "X-RateLimit-Remaining": "8",
        "X-RateLimit-Reset": "1700000000",
      }),
    });

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "I showed up to the wrong funeral" }),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(502);

    const error: ApiError = await response.json();
    expect(error.error).toBe("AI_SERVICE_ERROR");
    expect(error.retryable).toBe(true);
    expect(error.message).toBeTypeOf("string");
  });

  it("network failure rejects the promise", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "I tried to bribe a parking meter" }),
      })
    ).rejects.toThrow("Failed to fetch");
  });
});
