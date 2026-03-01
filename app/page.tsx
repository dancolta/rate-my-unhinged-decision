"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InputForm from "@/components/InputForm";
import LoadingState from "@/components/LoadingState";
import ScoreDisplay from "@/components/ScoreDisplay";
import ResultCard from "@/components/ResultCard";
import ShareButton from "@/components/ShareButton";
import ErrorBoundary from "@/components/ErrorBoundary";
import type {
  AnalyzeResponse,
  ApiError,
  RateLimitInfo,
} from "@/lib/types";

type AppState = "input" | "loading" | "result";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("input");
  const [resultData, setResultData] = useState<AnalyzeResponse | null>(null);
  const [errorData, setErrorData] = useState<ApiError | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (input: string) => {
    setAppState("loading");
    setErrorData(null);

    try {
      const [response] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        }),
        sleep(2000),
      ]);

      // Extract rate limit headers from any response
      const remaining = parseInt(
        response.headers.get("X-RateLimit-Remaining") ?? "10"
      );
      const reset = parseInt(
        response.headers.get("X-RateLimit-Reset") ?? "0"
      );
      setRateLimitInfo({ remaining, reset });

      if (!response.ok) {
        const errorBody: ApiError = await response.json();

        // For rate limit errors, extract retryAfter from response
        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get("Retry-After") ?? "60"
          );
          errorBody.retryAfter = retryAfter;
        }

        setErrorData(errorBody);
        setAppState("input");
        return;
      }

      const data: AnalyzeResponse = await response.json();
      setResultData(data);
      setAppState("result");
    } catch {
      setErrorData({
        error: "NETWORK_ERROR",
        message:
          "Could not reach the judgment tribunal. Check your internet connection and try again.",
        retryable: true,
      });
      setAppState("input");
    }
  }, []);

  const handleRetry = useCallback(() => {
    setErrorData(null);
  }, []);

  const handleTryAgain = useCallback(() => {
    setResultData(null);
    setErrorData(null);
    setAppState("input");
  }, []);

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-[480px] px-4 md:px-6 pt-8 md:pt-12 lg:pt-20 flex flex-1 flex-col">
        {/* Header -- always visible */}
        <div
          className="opacity-0"
          style={{
            animation: "fadeSlideUp 0.5s var(--ease-out) forwards",
          }}
        >
          <Header />
        </div>

        {/* Content area */}
        <div className="mt-6 md:mt-8 lg:mt-10 flex-1">
          {/* INPUT STATE */}
          {appState === "input" && (
            <div
              className="flex flex-col gap-6 opacity-0"
              style={{
                animation: "fadeSlideUp 0.5s var(--ease-out) 0.2s forwards",
              }}
            >
              {errorData && (
                <ErrorBoundary error={errorData} onRetry={handleRetry} />
              )}
              <InputForm
                onSubmit={handleSubmit}
                disabled={false}
                rateLimitInfo={rateLimitInfo}
              />
            </div>
          )}

          {/* LOADING STATE */}
          {appState === "loading" && (
            <div className="mt-8 md:mt-12">
              <LoadingState />
            </div>
          )}

          {/* RESULT STATE */}
          {appState === "result" && resultData && (
            <div className="flex flex-col gap-6 md:gap-9 lg:gap-12">
              {/* Score */}
              <div
                className="opacity-0"
                style={{
                  animation:
                    "fadeSlideUp 0.4s var(--ease-out) forwards",
                }}
              >
                <ScoreDisplay score={resultData.score} />
              </div>

              {/* Verdict card */}
              <div
                className="rounded-2xl border border-white/8 bg-surface p-4 md:p-6 border-l-4 border-l-primary opacity-0"
                style={{
                  animation:
                    "fadeSlideUp 0.4s var(--ease-out) 0.6s forwards",
                }}
              >
                <span
                  className="font-heading text-xs font-medium uppercase text-text-muted block"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Verdict
                </span>
                <VerdictTypewriter
                  text={resultData.verdict}
                  delay={600}
                />
              </div>

              {/* Psychological profile */}
              <div
                className="opacity-0"
                style={{
                  animation:
                    "fadeSlideUp 0.4s var(--ease-out) 1.4s forwards",
                }}
              >
                <span
                  className="font-heading text-xs font-medium uppercase text-text-muted block mb-3"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Psychological Profile
                </span>
                <p className="font-body text-base text-text-secondary leading-relaxed">
                  {resultData.profile}
                </p>
              </div>

              {/* Comparisons */}
              <div
                className="opacity-0"
                style={{
                  animation:
                    "fadeSlideUp 0.4s var(--ease-out) 1.8s forwards",
                }}
              >
                <span
                  className="font-heading text-xs font-medium uppercase text-text-muted block mb-3"
                  style={{ letterSpacing: "0.1em" }}
                >
                  You Are Compared To
                </span>
                <div className="flex flex-col gap-3">
                  {resultData.comparisons.map((comp, index) => (
                    <div
                      key={comp.name}
                      className="rounded-xl border border-white/8 bg-surface p-3 md:p-4 opacity-0"
                      style={{
                        animation: `fadeSlideUp 0.3s var(--ease-out) ${1.9 + index * 0.1}s forwards`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading text-base font-medium text-text-primary">
                          {comp.name}
                        </span>
                        <span className="font-heading text-base font-bold text-tertiary">
                          {comp.percentage}%
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full bg-tertiary"
                          style={
                            {
                              "--percentage": `${comp.percentage}%`,
                              width: "0%",
                              animation: `barFill 0.6s var(--ease-out) ${2.0 + index * 0.1}s forwards`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                      <p className="mt-2 font-body text-sm text-text-muted italic">
                        {comp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div
                className="opacity-0"
                style={{
                  animation:
                    "fadeSlideUp 0.3s var(--ease-out) 2.4s forwards",
                }}
              >
                <span
                  className="font-heading text-xs font-medium uppercase text-text-muted block mb-3"
                  style={{ letterSpacing: "0.1em" }}
                >
                  Recommendation
                </span>
                <div
                  className="rounded-2xl border-l-4 bg-surface p-4 md:p-6"
                  style={{
                    borderLeftStyle: "dashed",
                    borderLeftColor: "var(--color-warning)",
                  }}
                >
                  <p className="font-body text-base text-text-secondary leading-relaxed">
                    {resultData.recommendation}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div
                className="opacity-0"
                style={{
                  animation:
                    "fadeSlideUp 0.3s var(--ease-out) 2.8s forwards",
                }}
              >
                <div className="flex flex-col gap-2">
                  <ShareButton
                    resultData={resultData}
                    cardRef={cardRef}
                  />
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="w-full min-h-[48px] lg:min-h-[52px] rounded-xl border border-white/15 bg-transparent font-heading text-base font-bold uppercase tracking-[0.1em] text-text-primary transition-all duration-150 ease-out hover:bg-white/5 hover:border-white/30 active:scale-[0.97] active:duration-[50ms]"
                    style={{ padding: "14px 28px" }}
                  >
                    try again
                  </button>
                </div>
              </div>

              {/* Hidden ResultCard for image generation */}
              <ResultCard ref={cardRef} data={resultData} />
            </div>
          )}
        </div>

        {/* Footer -- always visible */}
        <Footer />
      </div>
    </main>
  );
}

/* ==========================================
   VERDICT TYPEWRITER SUB-COMPONENT
   ========================================== */

function VerdictTypewriter({
  text,
  delay,
}: {
  text: string;
  delay: number;
}) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplayText(text);
      setIsComplete(true);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeout = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i++;
        setDisplayText(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId !== undefined) clearInterval(intervalId);
          setIsComplete(true);
        }
      }, 30);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [text, delay]);

  return (
    <p className="mt-2 font-heading text-lg font-bold text-text-primary leading-snug">
      {displayText || "\u00A0"}
      {!isComplete && (
        <span className="inline-block w-[2px] h-[1.1em] bg-primary align-middle ml-0.5 animate-[blink_0.6s_step-end_infinite]" />
      )}
    </p>
  );
}
