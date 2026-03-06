"use client";

import { useState, useCallback, useEffect } from "react";
import type { RateLimitInfo } from "@/lib/types";

const MAX_CHARS = 500;
const WARN_CHARS = 450;
const MIN_CHARS = 10;

const ALL_SUGGESTIONS = [
  "quit via carrier pigeon",
  "tattooed my Wi-Fi password",
  "proposed at their wedding",
  "bought a horse on impulse",
  "moved to a country I can't spell",
  "ghosted my own birthday party",
  "texted my boss 'I quit' at 3am",
  "adopted 7 cats in one weekend",
  "dyed my hair during a zoom call",
  "sold my car to buy crypto",
  "got a face tattoo on a dare",
  "ate gas station sushi... twice",
  "lied on my resume about being a pilot",
  "proposed on the first date",
  "quit my job to become a DJ",
  "named my kid after a WiFi router",
  "road trip with no gas money",
  "bet my rent on a coin flip",
  "told my in-laws the truth",
  "brought a sword to a job interview",
  "replied all to the entire company",
  "wore a wedding dress to their wedding",
  "DMed my ex at their engagement party",
  "started a cult... accidentally",
  "paid rent in Bitcoin",
  "faked my own surprise party",
  "argued with a judge... and won",
  "ate a whole cake out of spite",
  "learned taxidermy on YouTube",
  "gave my landlord a 1-star review",
  "bought a boat with no ocean nearby",
  "showed up to the wrong funeral",
  "challenged my boss to arm wrestling",
  "let autocorrect send my resignation",
  "microwaved fish in the office kitchen",
  "brought my dog to a no-dogs wedding",
  "quit therapy to 'figure it out myself'",
  "invested savings in a lemonade stand",
  "got a matching tattoo with a stranger",
  "applied to be my own replacement",
  "emailed HR about a dream I had",
  "asked for a divorce via PowerPoint",
  "showed up to a date at the wrong place",
  "tried to bribe a parking meter",
  "filed a noise complaint against myself",
  "used a coupon on a first date",
  "taught my parrot to swear at guests",
  "wore crocs to a black tie event",
  "made a LinkedIn post about heartbreak",
  "brought a resume to Thanksgiving dinner",
];

function shuffleAndPick(arr: string[], count: number): string[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

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

  const [pills, setPills] = useState<string[]>(() => ALL_SUGGESTIONS.slice(0, 4));
  useEffect(() => {
    setPills(shuffleAndPick(ALL_SUGGESTIONS, 4));
  }, []);

  const charCount = text.length;
  const isOverWarn = charCount >= WARN_CHARS;
  const isAtMax = charCount >= MAX_CHARS;
  const canSubmit =
    charCount >= MIN_CHARS && charCount <= MAX_CHARS && !disabled;
  const showMinHint = charCount > 0 && charCount < MIN_CHARS;

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="I told my boss I was at a funeral but I was actually at Coachella..."
          className={`w-full min-h-[110px] md:min-h-[140px] max-h-[200px] resize-y rounded-2xl glass p-4 md:p-5 font-body text-base leading-relaxed text-text-primary placeholder:text-text-muted/50 transition-all duration-200 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            validationError
              ? "!border-error shadow-[0_0_0_3px_rgba(255,69,58,0.2)]"
              : "focus:!border-primary/50 focus:shadow-[0_0_0_3px_rgba(255,45,85,0.15)]"
          } ${shakeError ? "animate-[errorShake_0.3s_ease-out]" : ""}`}
        />
        <div className="flex justify-between items-center mt-1.5 px-1">
          {showMinHint ? (
            <span
              className="font-body text-xs text-secondary font-medium"
              style={{ animation: "hintPulse 2s ease-in-out infinite" }}
            >
              min {MIN_CHARS} characters
            </span>
          ) : (
            <span />
          )}
          <span className={`font-body text-xs tabular-nums ${counterColor}`}>
            {charCount} / {MAX_CHARS}
          </span>
        </div>
        {validationError && (
          <p
            className={`mt-1.5 font-body text-sm text-error ${shakeError ? "animate-[errorShake_0.3s_ease-out]" : ""}`}
          >
            {validationError}
          </p>
        )}
      </div>

      {/* Suggestion pills — wrapped, centered */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-2">
        {pills.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handlePillClick(example)}
            disabled={disabled}
            className="min-h-[36px] flex items-center rounded-full glass px-3 font-body text-xs md:text-sm text-text-secondary transition-all duration-150 hover:!border-primary/40 hover:text-text-primary hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            &ldquo;{example}&rdquo;
          </button>
        ))}
      </div>

      <button
        type="submit"
        disabled={!canSubmit || isRateLimited}
        className="w-full min-h-[48px] rounded-2xl bg-primary font-heading text-base font-bold uppercase tracking-wide text-white shadow-lg transition-all duration-150 ease-out hover:shadow-[0_4px_30px_rgba(255,45,85,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:shadow-none active:duration-[50ms] disabled:bg-white/10 disabled:text-text-muted disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none lg:max-w-[320px] lg:mx-auto"
        style={{ padding: "12px 28px" }}
      >
        🔥 JUDGE ME
      </button>

      {rateLimitInfo !== null && rateLimitInfo.remaining > 0 && (
        <p
          className={`text-center font-body text-xs ${
            rateLimitInfo.remaining <= 2 ? "text-warning" : "text-text-muted"
          }`}
        >
          {rateLimitInfo.remaining} judgment
          {rateLimitInfo.remaining !== 1 ? "s" : ""} remaining
        </p>
      )}
    </form>
  );
}
