// Component tests for ResultCard
// Verifies that the shareable image card (1080x1920, inline styles) renders
// the score, verdict, confession, comparisons, labels, and footer URL.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import ResultCard from "@/components/ResultCard";
import type { AnalyzeResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockData: AnalyzeResponse = {
  score: 67,
  verdict: "Test verdict here",
  profile: "Test profile",
  comparisons: [
    { name: "Figure One", percentage: 80, description: "Desc one" },
    { name: "Figure Two", percentage: 50, description: "Desc two" },
    { name: "Figure Three", percentage: 30, description: "Desc three" },
  ],
  recommendation: "Test recommendation",
  metadata: { model: "test", processingTime: 500 },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ResultCard", () => {
  // ── Score rendering ────────────────────────────────────────────────────

  it("renders the score number", () => {
    render(<ResultCard data={mockData} />);
    expect(screen.getByText("67")).toBeInTheDocument();
  });

  it("renders '/ 100' text", () => {
    render(<ResultCard data={mockData} />);
    // The "/ 100" and "UNHINGED" are in the same element but UNHINGED is in a nested span
    expect(screen.getByText(/\/ 100/)).toBeInTheDocument();
  });

  it("renders 'UNHINGED' text", () => {
    render(<ResultCard data={mockData} />);
    expect(screen.getByText("UNHINGED")).toBeInTheDocument();
  });

  // ── Verdict ────────────────────────────────────────────────────────────

  it("renders the verdict in quotes", () => {
    render(<ResultCard data={mockData} userInput="A distinct confession" />);
    // When userInput is provided, the verdict appears only once (in the verdict section).
    // Using userInput avoids the fallback where verdict appears in both confession + verdict.
    expect(screen.getByText(/Test verdict here/)).toBeInTheDocument();
  });

  // ── Confession ─────────────────────────────────────────────────────────

  it("renders 'I confessed' label", () => {
    render(<ResultCard data={mockData} />);
    expect(screen.getByText("I confessed")).toBeInTheDocument();
  });

  it("renders userInput as confession text when provided", () => {
    render(<ResultCard data={mockData} userInput="My custom confession" />);
    expect(screen.getByText(/My custom confession/)).toBeInTheDocument();
  });

  it("falls back to verdict as confession when userInput is not provided", () => {
    render(<ResultCard data={mockData} />);
    // Without userInput, confession = data.verdict = "Test verdict here"
    // The verdict appears twice: once in the confession section and once in the verdict section
    const matches = screen.getAllByText(/Test verdict here/);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  // ── Comparisons ────────────────────────────────────────────────────────

  it("renders up to 3 comparison figures with name, percentage, and description", () => {
    render(<ResultCard data={mockData} />);

    expect(screen.getByText("Figure One")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Desc one")).toBeInTheDocument();

    expect(screen.getByText("Figure Two")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Desc two")).toBeInTheDocument();

    expect(screen.getByText("Figure Three")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("Desc three")).toBeInTheDocument();
  });

  it("renders at most 3 comparisons even when more are provided", () => {
    const dataWith4 = {
      ...mockData,
      comparisons: [
        ...mockData.comparisons,
        { name: "Figure Four", percentage: 10, description: "Desc four" },
      ],
    };
    render(<ResultCard data={dataWith4} />);

    expect(screen.getByText("Figure One")).toBeInTheDocument();
    expect(screen.getByText("Figure Two")).toBeInTheDocument();
    expect(screen.getByText("Figure Three")).toBeInTheDocument();
    // The 4th should NOT render (slice(0, 3))
    expect(screen.queryByText("Figure Four")).not.toBeInTheDocument();
  });

  // ── Labels ─────────────────────────────────────────────────────────────

  it("renders 'My energy matches' label", () => {
    render(<ResultCard data={mockData} />);
    expect(screen.getByText("My energy matches")).toBeInTheDocument();
  });

  it("renders meter labels 'Sane' and 'Absolutely Unhinged'", () => {
    render(<ResultCard data={mockData} />);
    expect(screen.getByText("Sane")).toBeInTheDocument();
    expect(screen.getByText("Absolutely Unhinged")).toBeInTheDocument();
  });

  // ── Footer ─────────────────────────────────────────────────────────────

  it("renders 'ratemyunhinged.app' footer URL", () => {
    render(<ResultCard data={mockData} />);
    expect(screen.getByText("ratemyunhinged.app")).toBeInTheDocument();
  });

  // ── forwardRef ─────────────────────────────────────────────────────────

  it("forwardRef attaches to outer div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ResultCard ref={ref} data={mockData} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("outer div has fixed position and 1080x1920 dimensions", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ResultCard ref={ref} data={mockData} />);
    const el = ref.current!;
    expect(el.style.width).toBe("1080px");
    expect(el.style.height).toBe("1920px");
    expect(el.style.position).toBe("fixed");
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  it("renders a score of 0 correctly", () => {
    const zeroData = { ...mockData, score: 0 };
    render(<ResultCard data={zeroData} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders a score of 100 correctly", () => {
    const maxData = { ...mockData, score: 100 };
    render(<ResultCard data={maxData} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});
