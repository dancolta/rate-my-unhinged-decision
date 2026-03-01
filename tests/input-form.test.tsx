// Component tests for InputForm
// Tests textarea, character counter, validation, suggestion pills, submit behavior,
// disabled states, and rate limit display.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputForm from "@/components/InputForm";
import type { RateLimitInfo } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderForm(overrides: {
  onSubmit?: (input: string) => void;
  disabled?: boolean;
  rateLimitInfo?: RateLimitInfo | null;
} = {}) {
  const props = {
    onSubmit: overrides.onSubmit ?? vi.fn(),
    disabled: overrides.disabled ?? false,
    rateLimitInfo: overrides.rateLimitInfo ?? null,
  };
  return { ...render(<InputForm {...props} />), props };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InputForm", () => {
  // ── Rendering ──────────────────────────────────────────────────────────

  it("renders textarea and submit button", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText(/I told my boss I was at a funeral/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /judge me/i })
    ).toBeInTheDocument();
  });

  it("shows character count as 0 / 500 initially", () => {
    renderForm();
    expect(screen.getByText("0 / 500")).toBeInTheDocument();
  });

  // ── Disabled state (initial / prop) ────────────────────────────────────

  it("submit button is disabled initially (no text)", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /judge me/i })).toBeDisabled();
  });

  it("submit button is disabled when disabled prop is true", async () => {
    renderForm({ disabled: true });
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    // Even though we type enough characters, disabled prop wins
    await userEvent.type(textarea, "This is long enough to submit");
    expect(screen.getByRole("button", { name: /judge me/i })).toBeDisabled();
  });

  // ── Typing & character counter ─────────────────────────────────────────

  it("typing updates the character counter", async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    await userEvent.type(textarea, "Hello");
    expect(screen.getByText("5 / 500")).toBeInTheDocument();
  });

  it("cannot type past 500 characters", async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    ) as HTMLTextAreaElement;

    const longText = "a".repeat(505);
    // fireEvent.change simulates pasting / setting the value directly
    fireEvent.change(textarea, { target: { value: longText } });

    // The component should cap at 500 — the handleTextChange guard prevents > MAX_CHARS
    expect(textarea.value.length).toBeLessThanOrEqual(500);
    expect(screen.getByText("0 / 500")).toBeInTheDocument(); // value was rejected entirely since > 500
  });

  it("accepts exactly 500 characters", () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    ) as HTMLTextAreaElement;

    const exactText = "b".repeat(500);
    fireEvent.change(textarea, { target: { value: exactText } });
    expect(textarea.value).toBe(exactText);
    expect(screen.getByText("500 / 500")).toBeInTheDocument();
  });

  // ── Min hint ───────────────────────────────────────────────────────────

  it("shows min hint when 1-9 chars typed", async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    await userEvent.type(textarea, "Hey");
    expect(screen.getByText(/min 10 characters/i)).toBeInTheDocument();
  });

  it("hides min hint when 10+ chars typed", async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    await userEvent.type(textarea, "1234567890");
    expect(screen.queryByText(/min 10 characters/i)).not.toBeInTheDocument();
  });

  // ── Validation error ──────────────────────────────────────────────────

  it("submit with < 10 chars shows validation error", async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    // Type fewer than 10 chars, but note button is disabled for < 10 chars.
    // However, submitting the form directly (e.g. pressing Enter) still fires handleSubmit.
    await userEvent.type(textarea, "short");

    // Submit the form via the form element itself
    const form = textarea.closest("form")!;
    fireEvent.submit(form);

    expect(
      screen.getByText(/tell us more -- at least 10 characters/i)
    ).toBeInTheDocument();
  });

  // ── Successful submit ─────────────────────────────────────────────────

  it("successful submit calls onSubmit with trimmed text", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    await userEvent.type(textarea, "  I quit my job via carrier pigeon  ");

    const form = textarea.closest("form")!;
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      "I quit my job via carrier pigeon"
    );
  });

  it("enables submit button when >= 10 chars are typed", async () => {
    renderForm();
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    await userEvent.type(textarea, "1234567890");
    expect(
      screen.getByRole("button", { name: /judge me/i })
    ).not.toBeDisabled();
  });

  // ── Suggestion pills ──────────────────────────────────────────────────

  it("renders exactly 4 suggestion pills", () => {
    renderForm();
    // Pills are buttons that are NOT the submit button
    const allButtons = screen.getAllByRole("button");
    // One is the submit button, the rest are pills
    const pillButtons = allButtons.filter(
      (btn) => btn.getAttribute("type") === "button"
    );
    expect(pillButtons).toHaveLength(4);
  });

  it("clicking a pill fills the textarea", async () => {
    renderForm();
    const allButtons = screen.getAllByRole("button");
    const pillButtons = allButtons.filter(
      (btn) => btn.getAttribute("type") === "button"
    );
    const firstPill = pillButtons[0];

    await userEvent.click(firstPill);

    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    ) as HTMLTextAreaElement;
    // The textarea should now contain the pill text (without the surrounding quotes)
    expect(textarea.value.length).toBeGreaterThan(0);
  });

  // ── Rate limit display ─────────────────────────────────────────────────

  it("shows remaining judgments when rateLimitInfo provided with remaining > 0", () => {
    renderForm({
      rateLimitInfo: { remaining: 7, reset: Date.now() + 60000 },
    });
    expect(screen.getByText(/7 judgments remaining/i)).toBeInTheDocument();
  });

  it("shows singular 'judgment' when remaining is 1", () => {
    renderForm({
      rateLimitInfo: { remaining: 1, reset: Date.now() + 60000 },
    });
    expect(screen.getByText(/1 judgment remaining/i)).toBeInTheDocument();
  });

  it("does not show remaining judgments when rateLimitInfo is null", () => {
    renderForm({ rateLimitInfo: null });
    expect(screen.queryByText(/judgment/i)).not.toBeInTheDocument();
  });

  it("does not show remaining text when remaining is 0", () => {
    renderForm({
      rateLimitInfo: { remaining: 0, reset: Date.now() + 60000 },
    });
    expect(
      screen.queryByText(/judgments remaining/i)
    ).not.toBeInTheDocument();
  });

  it("submit button is disabled when rate limited (remaining: 0)", async () => {
    renderForm({
      rateLimitInfo: { remaining: 0, reset: Date.now() + 60000 },
    });
    const textarea = screen.getByPlaceholderText(
      /I told my boss I was at a funeral/i
    );
    await userEvent.type(textarea, "This should be long enough to submit normally");
    expect(screen.getByRole("button", { name: /judge me/i })).toBeDisabled();
  });
});
