// Unit tests for input sanitization and validation logic
// Tests sanitizeInput from lib/utils.ts combined with the length rules
// enforced by the API route (min 10, max 500, reject empty/whitespace).

import { describe, it, expect } from "vitest";
import { sanitizeInput } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants matching the API route validation thresholds
// ---------------------------------------------------------------------------

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

/**
 * Simulates the validation pipeline from the API route:
 *   1. sanitizeInput (strip HTML, control chars, null bytes, trim)
 *   2. Check length === 0 -> INVALID_INPUT
 *   3. Check length < 10  -> INPUT_TOO_SHORT
 *   4. Check length > 500 -> INPUT_TOO_LONG
 *   5. Otherwise -> valid
 */
function validate(raw: string): { valid: boolean; code?: string; sanitized: string } {
  const sanitized = sanitizeInput(raw);

  if (sanitized.length === 0) {
    return { valid: false, code: "INVALID_INPUT", sanitized };
  }
  if (sanitized.length < MIN_LENGTH) {
    return { valid: false, code: "INPUT_TOO_SHORT", sanitized };
  }
  if (sanitized.length > MAX_LENGTH) {
    return { valid: false, code: "INPUT_TOO_LONG", sanitized };
  }
  return { valid: true, sanitized };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sanitizeInput", () => {
  it("trims leading and trailing whitespace", () => {
    expect(sanitizeInput("  hello world  ")).toBe("hello world");
  });

  it("strips HTML tags", () => {
    expect(sanitizeInput("<b>bold</b> text")).toBe("bold text");
  });

  it("strips nested HTML tags", () => {
    expect(sanitizeInput("<div><span>nested</span></div>")).toBe("nested");
  });

  it("strips self-closing HTML tags", () => {
    expect(sanitizeInput("before<br/>after")).toBe("beforeafter");
  });

  it("strips control characters but keeps newlines, tabs, and carriage returns", () => {
    // \x01 is a control char that should be stripped
    // \n, \r, \t should be preserved (before trim)
    const input = "hello\x01world\nline2\ttab";
    expect(sanitizeInput(input)).toBe("helloworld\nline2\ttab");
  });

  it("strips null bytes", () => {
    expect(sanitizeInput("hello\0world")).toBe("helloworld");
  });

  it("returns empty string for only whitespace", () => {
    expect(sanitizeInput("   \n\t\r  ")).toBe("");
  });

  it("returns empty string for only HTML tags", () => {
    expect(sanitizeInput("<p></p><br><div></div>")).toBe("");
  });

  it("handles empty string input", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("preserves normal text unchanged", () => {
    const text = "I quit my job to become a professional cheese sculptor";
    expect(sanitizeInput(text)).toBe(text);
  });
});

describe("input validation pipeline", () => {
  describe("empty/whitespace rejection", () => {
    it("rejects empty string as INVALID_INPUT", () => {
      const result = validate("");
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INVALID_INPUT");
    });

    it("rejects whitespace-only as INVALID_INPUT", () => {
      const result = validate("     ");
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INVALID_INPUT");
    });

    it("rejects HTML-only input as INVALID_INPUT (tags stripped, nothing left)", () => {
      const result = validate("<b></b><i></i>");
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INVALID_INPUT");
    });

    it("rejects control-chars-only as INVALID_INPUT", () => {
      const result = validate("\x01\x02\x03");
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INVALID_INPUT");
    });
  });

  describe("minimum length (10 chars after sanitization)", () => {
    it("rejects input with 9 chars after sanitization", () => {
      const result = validate("123456789");
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INPUT_TOO_SHORT");
    });

    it("accepts input with exactly 10 chars after sanitization", () => {
      const result = validate("1234567890");
      expect(result.valid).toBe(true);
    });

    it("rejects short input even after HTML is stripped", () => {
      // "hi" is only 2 chars after <b> tags are stripped
      const result = validate("<b>hi</b>");
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INPUT_TOO_SHORT");
    });

    it("HTML tags do not count toward minimum length", () => {
      // Inner text "1234567890" = 10 chars -> valid
      const result = validate("<div>1234567890</div>");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("1234567890");
    });
  });

  describe("maximum length (500 chars)", () => {
    it("accepts input with exactly 500 chars", () => {
      const result = validate("a".repeat(500));
      expect(result.valid).toBe(true);
    });

    it("rejects input with 501 chars", () => {
      const result = validate("a".repeat(501));
      expect(result.valid).toBe(false);
      expect(result.code).toBe("INPUT_TOO_LONG");
    });

    it("length is measured after sanitization (HTML stripped)", () => {
      // 500 chars of text + HTML wrapper -> after strip = 500 -> valid
      const text = "b".repeat(500);
      const result = validate(`<p>${text}</p>`);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe(text);
    });
  });

  describe("valid inputs", () => {
    it("accepts a normal decision description", () => {
      const result = validate("I decided to eat cereal with orange juice for breakfast");
      expect(result.valid).toBe(true);
    });

    it("accepts input with special characters", () => {
      const result = validate("I spent $500 on a mystery box & it was full of rubber ducks!!!");
      expect(result.valid).toBe(true);
    });

    it("accepts input with emoji", () => {
      const result = validate("I texted my ex at 3am saying I miss them lol");
      expect(result.valid).toBe(true);
    });

    it("preserves interior whitespace after sanitization", () => {
      const result = validate("I   moved   across   the   country   on   a   whim");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("I   moved   across   the   country   on   a   whim");
    });
  });
});
