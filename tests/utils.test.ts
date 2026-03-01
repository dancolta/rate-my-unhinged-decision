import { describe, it, expect, vi } from "vitest";
import {
  sanitizeInput,
  getScoreColor,
  getScoreGlow,
  sleep,
  CANNED_FALLBACK_RESPONSE,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// sanitizeInput
// ---------------------------------------------------------------------------

describe("sanitizeInput", () => {
  it("passes normal text through unchanged", () => {
    expect(sanitizeInput("I quit my job to become a llama farmer")).toBe(
      "I quit my job to become a llama farmer"
    );
  });

  it("strips HTML script tags (tags only, not inner text)", () => {
    // sanitizeInput strips the <script> and </script> tags themselves,
    // but the text content between them remains (it's a tag stripper, not a DOM parser)
    expect(sanitizeInput("<script>alert('xss')</script>hello")).toBe(
      "alert('xss')hello"
    );
  });

  it("strips arbitrary HTML tags", () => {
    expect(sanitizeInput("<b>bold</b> and <i>italic</i>")).toBe(
      "bold and italic"
    );
  });

  it("strips nested HTML tags", () => {
    expect(sanitizeInput("<div><p><span>nested</span></p></div>")).toBe(
      "nested"
    );
  });

  it("strips malformed / unclosed HTML tags", () => {
    expect(sanitizeInput("<div>open<br/>break</div>")).toBe("openbreak");
  });

  it("strips self-closing tags", () => {
    expect(sanitizeInput("before<img src='x' />after")).toBe("beforeafter");
  });

  it("keeps newline characters", () => {
    expect(sanitizeInput("line1\nline2")).toBe("line1\nline2");
  });

  it("keeps carriage return characters", () => {
    expect(sanitizeInput("line1\rline2")).toBe("line1\rline2");
  });

  it("keeps tab characters", () => {
    expect(sanitizeInput("col1\tcol2")).toBe("col1\tcol2");
  });

  it("strips control characters (non \\n, \\r, \\t)", () => {
    // \x01 = SOH, \x02 = STX, \x1F = US — all should be removed
    expect(sanitizeInput("abc\x01\x02\x1Fdef")).toBe("abcdef");
  });

  it("strips null bytes", () => {
    expect(sanitizeInput("hello\0world")).toBe("helloworld");
  });

  it("strips the DEL character (\\x7F)", () => {
    expect(sanitizeInput("hello\x7Fworld")).toBe("helloworld");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeInput("   padded   ")).toBe("padded");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeInput("   ")).toBe("");
  });

  it("returns already clean text unchanged", () => {
    const clean = "Perfectly normal text with no issues";
    expect(sanitizeInput(clean)).toBe(clean);
  });

  it("handles combined HTML + control chars + null bytes + whitespace", () => {
    expect(
      sanitizeInput("  <b>bold\x00</b>\x01clean  ")
    ).toBe("boldclean");
  });
});

// ---------------------------------------------------------------------------
// getScoreColor
// ---------------------------------------------------------------------------

describe("getScoreColor", () => {
  it("returns green for score 0", () => {
    expect(getScoreColor(0)).toBe("rgb(48, 209, 88)");
  });

  it("returns yellow for score 25", () => {
    expect(getScoreColor(25)).toBe("rgb(255, 214, 10)");
  });

  it("returns orange for score 50", () => {
    expect(getScoreColor(50)).toBe("rgb(255, 149, 0)");
  });

  it("returns red-orange for score 75", () => {
    expect(getScoreColor(75)).toBe("rgb(255, 69, 58)");
  });

  it("returns hot pink for score 100", () => {
    expect(getScoreColor(100)).toBe("rgb(255, 45, 85)");
  });

  it("clamps negative scores to 0 (green)", () => {
    expect(getScoreColor(-10)).toBe("rgb(48, 209, 88)");
  });

  it("clamps scores above 100 to 100 (hot pink)", () => {
    expect(getScoreColor(150)).toBe("rgb(255, 45, 85)");
  });

  it("returns a valid rgb() string for a mid-range score", () => {
    const result = getScoreColor(37);
    expect(result).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);
  });

  it("interpolates between green and yellow for score 12", () => {
    const result = getScoreColor(12);
    expect(result).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);
    // At score 12 (roughly halfway 0-25), r should be between 48 and 255
    const match = result.match(/rgb\((\d+), (\d+), (\d+)\)/);
    expect(match).not.toBeNull();
    const r = parseInt(match![1], 10);
    const g = parseInt(match![2], 10);
    const b = parseInt(match![3], 10);
    // r should be between green (48) and yellow (255)
    expect(r).toBeGreaterThanOrEqual(48);
    expect(r).toBeLessThanOrEqual(255);
    // g should be between green (209) and yellow (214)
    expect(g).toBeGreaterThanOrEqual(209);
    expect(g).toBeLessThanOrEqual(214);
  });

  it("returns valid rgb format for every 10th score", () => {
    for (let s = 0; s <= 100; s += 10) {
      expect(getScoreColor(s)).toMatch(/^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/);
    }
  });
});

// ---------------------------------------------------------------------------
// getScoreGlow
// ---------------------------------------------------------------------------

describe("getScoreGlow", () => {
  it("returns a string containing '0 0 20px'", () => {
    expect(getScoreGlow(50)).toContain("0 0 20px");
  });

  it("returns a string containing '0 0 60px'", () => {
    expect(getScoreGlow(50)).toContain("0 0 60px");
  });

  it("contains rgba values with 0.4 alpha (inner glow)", () => {
    expect(getScoreGlow(50)).toContain("0.4)");
  });

  it("contains rgba values with 0.2 alpha (outer glow)", () => {
    expect(getScoreGlow(50)).toContain("0.2)");
  });

  it("uses the correct color for score 0 (green)", () => {
    const glow = getScoreGlow(0);
    expect(glow).toContain("rgba(48, 209, 88, 0.4)");
    expect(glow).toContain("rgba(48, 209, 88, 0.2)");
  });

  it("uses the correct color for score 100 (hot pink)", () => {
    const glow = getScoreGlow(100);
    expect(glow).toContain("rgba(255, 45, 85, 0.4)");
    expect(glow).toContain("rgba(255, 45, 85, 0.2)");
  });

  it("returns the expected full box-shadow format", () => {
    const glow = getScoreGlow(50);
    expect(glow).toMatch(
      /^0 0 20px rgba\(\d+, \d+, \d+, 0\.4\), 0 0 60px rgba\(\d+, \d+, \d+, 0\.2\)$/
    );
  });
});

// ---------------------------------------------------------------------------
// sleep
// ---------------------------------------------------------------------------

describe("sleep", () => {
  it("resolves after the given duration", async () => {
    vi.useFakeTimers();
    let resolved = false;
    const promise = sleep(100).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
    vi.advanceTimersByTime(100);
    await promise;
    expect(resolved).toBe(true);

    vi.useRealTimers();
  });

  it("returns a Promise", () => {
    vi.useFakeTimers();
    const result = sleep(10);
    expect(result).toBeInstanceOf(Promise);
    vi.advanceTimersByTime(10);
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// CANNED_FALLBACK_RESPONSE
// ---------------------------------------------------------------------------

describe("CANNED_FALLBACK_RESPONSE", () => {
  it("has score 42", () => {
    expect(CANNED_FALLBACK_RESPONSE.score).toBe(42);
  });

  it("has exactly 3 comparisons", () => {
    expect(CANNED_FALLBACK_RESPONSE.comparisons).toHaveLength(3);
  });

  it("has a non-empty verdict", () => {
    expect(CANNED_FALLBACK_RESPONSE.verdict).toBeTruthy();
    expect(CANNED_FALLBACK_RESPONSE.verdict.length).toBeGreaterThan(0);
  });

  it("has a non-empty profile", () => {
    expect(CANNED_FALLBACK_RESPONSE.profile).toBeTruthy();
    expect(CANNED_FALLBACK_RESPONSE.profile.length).toBeGreaterThan(0);
  });

  it("has a non-empty recommendation", () => {
    expect(CANNED_FALLBACK_RESPONSE.recommendation).toBeTruthy();
    expect(CANNED_FALLBACK_RESPONSE.recommendation.length).toBeGreaterThan(0);
  });

  it("has metadata with model and processingTime", () => {
    expect(CANNED_FALLBACK_RESPONSE.metadata).toBeDefined();
    expect(CANNED_FALLBACK_RESPONSE.metadata.model).toBe(
      "fallback-canned-response"
    );
    expect(CANNED_FALLBACK_RESPONSE.metadata.processingTime).toBe(0);
  });

  it("each comparison has name, percentage, and description", () => {
    for (const comp of CANNED_FALLBACK_RESPONSE.comparisons) {
      expect(comp.name).toBeTruthy();
      expect(typeof comp.percentage).toBe("number");
      expect(comp.percentage).toBeGreaterThanOrEqual(0);
      expect(comp.percentage).toBeLessThanOrEqual(100);
      expect(comp.description).toBeTruthy();
    }
  });
});
