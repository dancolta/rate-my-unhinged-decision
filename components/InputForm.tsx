"use client";

import { useState, useCallback } from "react";
import type { RateLimitInfo } from "@/lib/types";

const MAX_CHARS = 500;
const WARN_CHARS = 450;
const MIN_CHARS = 10;

const EXAMPLE_PILLS = [
  "quit via carrier pigeon",
  "tattooed my Wi-Fi password",
  "proposed at their wedding",
  "bought a horse on impulse",
];

interface InputFormProps {
  onSubmit: (input: string) => void;
  disabled: boolean;
  rateLimitInfo: RateLimitInfo | null;
}

export default function InputForm({
  onSubmit,
  disabled,
  rateLimitInfo,
}: InputFormProps) {
  const [text, setText] = useState("");
  const [validationError, setValidationError] = useState("");
  const [shakeError, setShakeError] = useState(false);

  const charCount = text.length;
  const isOverWarn = charCount >= WARN_CHARS;
  const isAtMax = charCount >= MAX_CHARS;
  const canSubmit = charCount >= MIN_CHARS && charCount <= MAX_CHARS && !disabled;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CHARS) {
        setText(value);
        if (value.length >= MIN_CHARS) {
          setValidationError("");
        }
      }
    },
    []
  );

  const handlePillClick = useCallback(
    (example: string) => {
      if (!disabled) {
        setText(example);
        setValidationError("");
      }
    },
    [disabled]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim().length < MIN_CHARS) {
        setValidationError(
          "tell us more -- at least 10 characters to judge properly"
        );
        setShakeError(true);
        setTimeout(() => setShakeError(false), 300);
        return;
      }
      onSubmit(text.trim());
    },
    [text, onSubmit]
  );

  const counterColor = isAtMax
    ? "text-error"
    : isOverWarn
      ? "text-warning"
      : "text-text-muted";

  const isRateLimited =
    rateLimitInfo !== null && rateLimitInfo.remaining <= 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="I proposed to my ex at their wedding to someone else..."
          className={`w-full min-h-[120px] md:min-h-[140px] max-h-[200px] resize-y rounded-xl border bg-surface p-4 font-body text-base leading-relaxed text-text-primary placeholder:text-text-muted transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            validationError
              ? "border-error shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
              : "border-white/10 focus:border-primary focus:shadow-[0_0_0_3px_rgba(255,59,59,0.15)]"
          } ${shakeError ? "animate-[errorShake_0.3s_ease-out]" : ""}`}
        />
        <div className="flex justify-end mt-1">
          <span className={`font-body text-xs ${counterColor}`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
        {validationError && (
          <p
            className={`mt-1 font-body text-sm text-error ${shakeError ? "animate-[errorShake_0.3s_ease-out]" : ""}`}
          >
            {validationError}
          </p>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {EXAMPLE_PILLS.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handlePillClick(example)}
            disabled={disabled}
            className="shrink-0 rounded-full border border-white/8 bg-elevated px-3 py-1.5 font-body text-sm text-text-secondary transition-colors duration-150 hover:border-white/30 hover:text-text-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isRateLimited}
        className="w-full min-h-[48px] lg:min-h-[52px] rounded-xl bg-primary font-heading text-base font-bold uppercase tracking-[0.1em] text-text-primary transition-all duration-150 ease-out hover:bg-[#E63535] hover:-translate-y-px hover:shadow-[0_4px_24px_rgba(255,59,59,0.3)] active:translate-y-0 active:scale-[0.97] active:shadow-none active:duration-[50ms] disabled:bg-elevated disabled:text-text-muted disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        style={{ padding: "14px 28px" }}
      >
        JUDGE ME
      </button>

      {rateLimitInfo !== null && rateLimitInfo.remaining > 0 && (
        <p
          className={`text-center font-body text-xs ${
            rateLimitInfo.remaining <= 2
              ? "text-warning"
              : "text-text-muted"
          }`}
        >
          {rateLimitInfo.remaining} judgment
          {rateLimitInfo.remaining !== 1 ? "s" : ""} remaining
        </p>
      )}
    </form>
  );
}
