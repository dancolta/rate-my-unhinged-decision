import { describe, it, expect } from "vitest";
import { AIResponseSchema, ComparisonFigureSchema } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helper: a valid comparison figure for reuse in tests
// ---------------------------------------------------------------------------

function validComparison(overrides: Record<string, unknown> = {}) {
  return {
    name: "Napoleon Bonaparte",
    percentage: 75,
    description: "Bold strategic decisions with questionable outcomes",
    ...overrides,
  };
}

function validResponse(overrides: Record<string, unknown> = {}) {
  return {
    score: 42,
    verdict: "Impressively unhinged",
    profile: "You have the impulse control of a caffeinated squirrel.",
    comparisons: [validComparison(), validComparison({ name: "Icarus" })],
    recommendation: "Maybe sleep on it next time.",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ComparisonFigureSchema
// ---------------------------------------------------------------------------

describe("ComparisonFigureSchema", () => {
  it("accepts a valid comparison figure", () => {
    const result = ComparisonFigureSchema.safeParse(validComparison());
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ name: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const { name, ...noName } = validComparison();
    const result = ComparisonFigureSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it("rejects percentage above 100", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ percentage: 101 })
    );
    expect(result.success).toBe(false);
  });

  it("rejects percentage below 0", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ percentage: -1 })
    );
    expect(result.success).toBe(false);
  });

  it("rejects non-integer percentage", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ percentage: 42.5 })
    );
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ description: "" })
    );
    expect(result.success).toBe(false);
  });

  it("accepts boundary percentage 0", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ percentage: 0 })
    );
    expect(result.success).toBe(true);
  });

  it("accepts boundary percentage 100", () => {
    const result = ComparisonFigureSchema.safeParse(
      validComparison({ percentage: 100 })
    );
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AIResponseSchema
// ---------------------------------------------------------------------------

describe("AIResponseSchema", () => {
  it("accepts a valid complete response", () => {
    const result = AIResponseSchema.safeParse(validResponse());
    expect(result.success).toBe(true);
  });

  it("rejects missing score", () => {
    const { score, ...noScore } = validResponse();
    const result = AIResponseSchema.safeParse(noScore);
    expect(result.success).toBe(false);
  });

  it("rejects score below 0", () => {
    const result = AIResponseSchema.safeParse(validResponse({ score: -1 }));
    expect(result.success).toBe(false);
  });

  it("rejects score above 100", () => {
    const result = AIResponseSchema.safeParse(validResponse({ score: 101 }));
    expect(result.success).toBe(false);
  });

  it("rejects non-integer score (e.g., 42.5)", () => {
    const result = AIResponseSchema.safeParse(validResponse({ score: 42.5 }));
    expect(result.success).toBe(false);
  });

  it("accepts score at boundary 0", () => {
    const result = AIResponseSchema.safeParse(validResponse({ score: 0 }));
    expect(result.success).toBe(true);
  });

  it("accepts score at boundary 100", () => {
    const result = AIResponseSchema.safeParse(validResponse({ score: 100 }));
    expect(result.success).toBe(true);
  });

  it("rejects empty verdict", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({ verdict: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing verdict", () => {
    const { verdict, ...noVerdict } = validResponse();
    const result = AIResponseSchema.safeParse(noVerdict);
    expect(result.success).toBe(false);
  });

  it("rejects empty profile", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({ profile: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects empty recommendation", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({ recommendation: "" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects missing comparisons", () => {
    const { comparisons, ...noComps } = validResponse();
    const result = AIResponseSchema.safeParse(noComps);
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 2 comparisons", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({ comparisons: [validComparison()] })
    );
    expect(result.success).toBe(false);
  });

  it("accepts exactly 2 comparisons (minimum)", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({
        comparisons: [
          validComparison(),
          validComparison({ name: "Icarus" }),
        ],
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts exactly 3 comparisons", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({
        comparisons: [
          validComparison(),
          validComparison({ name: "Icarus" }),
          validComparison({ name: "Leroy Jenkins" }),
        ],
      })
    );
    expect(result.success).toBe(true);
  });

  it("accepts exactly 4 comparisons (maximum)", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({
        comparisons: [
          validComparison(),
          validComparison({ name: "Icarus" }),
          validComparison({ name: "Leroy Jenkins" }),
          validComparison({ name: "Florida Man" }),
        ],
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejects more than 4 comparisons", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({
        comparisons: [
          validComparison(),
          validComparison({ name: "Icarus" }),
          validComparison({ name: "Leroy Jenkins" }),
          validComparison({ name: "Florida Man" }),
          validComparison({ name: "The Joker" }),
        ],
      })
    );
    expect(result.success).toBe(false);
  });

  it("strips extra fields not in the schema", () => {
    const input = {
      ...validResponse(),
      extraField: "should be removed",
      anotherExtra: 999,
    };
    const result = AIResponseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("extraField" in result.data).toBe(false);
      expect("anotherExtra" in result.data).toBe(false);
    }
  });

  it("rejects an empty object", () => {
    const result = AIResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects when a comparison has percentage > 100", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({
        comparisons: [
          validComparison(),
          validComparison({ name: "Icarus", percentage: 150 }),
        ],
      })
    );
    expect(result.success).toBe(false);
  });

  it("rejects when a comparison has empty name", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({
        comparisons: [
          validComparison(),
          validComparison({ name: "" }),
        ],
      })
    );
    expect(result.success).toBe(false);
  });

  it("rejects null input", () => {
    const result = AIResponseSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects string input", () => {
    const result = AIResponseSchema.safeParse("not an object");
    expect(result.success).toBe(false);
  });

  it("rejects when score is a string", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({ score: "42" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects when comparisons is not an array", () => {
    const result = AIResponseSchema.safeParse(
      validResponse({ comparisons: "not an array" })
    );
    expect(result.success).toBe(false);
  });
});
