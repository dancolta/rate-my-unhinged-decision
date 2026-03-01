// Unit tests for getClientIP from lib/limits.ts
// The rateLimiter itself is an Upstash Ratelimit instance — we only unit-test
// the pure getClientIP function (no Redis dependency).

import { describe, it, expect, vi } from "vitest";

// Mock the Upstash modules so importing lib/limits.ts doesn't require
// real environment variables or a Redis connection.
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow() {
      return {};
    }
    constructor() {
      // noop
    }
    limit = vi.fn();
  },
}));

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    constructor() {
      // noop
    }
  },
}));

import { getClientIP } from "@/lib/limits";

// ---------------------------------------------------------------------------
// Helper to create a minimal Request with specific headers
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getClientIP", () => {
  it("returns first IP from x-forwarded-for when present", () => {
    const req = makeRequest({ "x-forwarded-for": "203.0.113.50" });
    expect(getClientIP(req)).toBe("203.0.113.50");
  });

  it("handles multiple IPs in x-forwarded-for (takes first)", () => {
    const req = makeRequest({
      "x-forwarded-for": "203.0.113.50, 70.41.3.18, 150.172.238.178",
    });
    expect(getClientIP(req)).toBe("203.0.113.50");
  });

  it("returns x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-real-ip": "198.51.100.42" });
    expect(getClientIP(req)).toBe("198.51.100.42");
  });

  it("returns 127.0.0.1 when no IP headers are set", () => {
    const req = makeRequest();
    expect(getClientIP(req)).toBe("127.0.0.1");
  });

  it("falls back to x-real-ip when x-forwarded-for is empty string", () => {
    const req = makeRequest({
      "x-forwarded-for": "",
      "x-real-ip": "198.51.100.42",
    });
    expect(getClientIP(req)).toBe("198.51.100.42");
  });

  it("trims whitespace from the extracted IP", () => {
    const req = makeRequest({ "x-forwarded-for": "  203.0.113.50  " });
    expect(getClientIP(req)).toBe("203.0.113.50");
  });

  it("trims whitespace from first IP when multiple are present", () => {
    const req = makeRequest({
      "x-forwarded-for": "  10.0.0.1 , 10.0.0.2",
    });
    expect(getClientIP(req)).toBe("10.0.0.1");
  });

  it("returns 127.0.0.1 when x-forwarded-for is empty and x-real-ip is absent", () => {
    const req = makeRequest({ "x-forwarded-for": "" });
    expect(getClientIP(req)).toBe("127.0.0.1");
  });

  it("prefers x-forwarded-for over x-real-ip when both are set", () => {
    const req = makeRequest({
      "x-forwarded-for": "203.0.113.50",
      "x-real-ip": "198.51.100.42",
    });
    expect(getClientIP(req)).toBe("203.0.113.50");
  });

  it("handles IPv6 addresses in x-forwarded-for", () => {
    const req = makeRequest({
      "x-forwarded-for": "2001:db8::1, 2001:db8::2",
    });
    expect(getClientIP(req)).toBe("2001:db8::1");
  });

  it("handles IPv6 address in x-real-ip", () => {
    const req = makeRequest({ "x-real-ip": "::1" });
    expect(getClientIP(req)).toBe("::1");
  });
});
