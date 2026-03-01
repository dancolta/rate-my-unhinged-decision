"use client";

import { useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
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
  const [userInput, setUserInput] = useState("");
  const [errorData, setErrorData] = useState<ApiError | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (input: string) => {
    setAppState("loading");
    setUserInput(input);
    setErrorData(null);

    try {
      const [response] = await Promise.all([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        }),
        sleep(3500),
      ]);

      const remaining = parseInt(
        response.headers.get("X-RateLimit-Remaining") ?? "10"
      );
      const reset = parseInt(
        response.headers.get("X-RateLimit-Reset") ?? "0"
      );
      setRateLimitInfo({ remaining, reset });

      if (!response.ok) {
        const errorBody: ApiError = await response.json();

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
    setUserInput("");
    setErrorData(null);
    setAppState("input");
  }, []);

  return (
    <>
      {/* Loading — replaces everything */}
      {appState === "loading" && <LoadingState />}

      <main className={`flex min-h-dvh flex-col ${appState === "loading" ? "hidden" : ""}`}>
        <div className="mx-auto w-full max-w-[480px] lg:max-w-[560px] px-4 md:px-6 pt-14 md:pt-10 lg:pt-16 flex flex-1 flex-col pb-20 md:pb-8">
          {/* Header */}
          <div
            className="opacity-0"
            style={{
              animation: "fadeSlideUp 0.5s var(--ease-out) forwards",
            }}
          >
            <Header />
          </div>

          {/* Content */}
          <div className="mt-6 md:mt-8 lg:mt-10 flex-1">
            {/* INPUT STATE */}
            {appState === "input" && (
              <div
                className="flex flex-col gap-4 opacity-0"
                style={{
                  animation: "fadeSlideUp 0.5s var(--ease-out) 0.15s forwards",
                }}
              >
                {errorData && (
                  <ErrorBoundary error={errorData} onRetry={handleRetry} />
                )}
                <p className="font-body text-sm text-text-muted text-center">
                  Confess. We&apos;ll judge.
                </p>
                <InputForm
                  onSubmit={handleSubmit}
                  disabled={false}
                  rateLimitInfo={rateLimitInfo}
                />
              </div>
            )}

            {/* RESULT STATE */}
            {appState === "result" && resultData && (
              <div className="flex flex-col gap-6">
                {/* Your confession — instant */}
                <div
                  className="opacity-0"
                  style={{
                    animation: "fadeSlideUp 0.3s var(--ease-out) forwards",
                  }}
                >
                  <div className="glass rounded-2xl p-4 border-l-4 border-l-white/20">
                    <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-1">
                      Your confession
                    </p>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">
                      &ldquo;{userInput}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Score — instant */}
                <div
                  className="opacity-0"
                  style={{
                    animation: "fadeSlideUp 0.3s var(--ease-out) forwards",
                  }}
                >
                  <ScoreDisplay score={resultData.score} />
                </div>

                {/* Verdict — 200ms */}
                <div
                  className="opacity-0"
                  style={{
                    animation:
                      "fadeSlideUp 0.3s var(--ease-out) 0.2s forwards",
                  }}
                >
                  <h2 className="font-heading text-lg font-bold text-text-primary mb-3">
                    The Verdict Is In 🔨
                  </h2>
                  <div className="glass-strong rounded-2xl p-5 border-l-4 border-l-primary">
                    <p className="font-heading text-xl font-bold text-text-primary leading-snug">
                      &ldquo;{resultData.verdict}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Psychological profile — 350ms */}
                <div
                  className="opacity-0"
                  style={{
                    animation:
                      "fadeSlideUp 0.3s var(--ease-out) 0.35s forwards",
                  }}
                >
                  <h2 className="font-heading text-lg font-bold text-text-primary mb-3">
                    Your Brain, Explained 🧠
                  </h2>
                  <div className="glass rounded-2xl p-5">
                    <p className="font-body text-sm text-text-secondary leading-relaxed">
                      {resultData.profile}
                    </p>
                  </div>
                </div>

                {/* Comparisons — 450ms + 80ms intervals */}
                <div
                  className="opacity-0"
                  style={{
                    animation:
                      "fadeSlideUp 0.3s var(--ease-out) 0.45s forwards",
                  }}
                >
                  <h2 className="font-heading text-lg font-bold text-text-primary mb-3">
                    You Give Off... 👀
                  </h2>
                  <div className="flex flex-col gap-2.5">
                    {resultData.comparisons.map((comp, index) => {
                      const cardEmoji = ["🎭", "📺", "🃏"][index] ?? "✨";
                      return (
                        <div
                          key={comp.name}
                          className="glass rounded-2xl p-4 opacity-0"
                          style={{
                            animation: `fadeSlideUp 0.3s var(--ease-out) ${0.5 + index * 0.08}s forwards`,
                          }}
                        >
                          {/* Top: emoji + name + percentage */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl shrink-0">{cardEmoji}</span>
                            <h3 className="font-heading text-sm font-bold text-text-primary leading-snug flex-1 min-w-0">
                              {comp.name}
                            </h3>
                            <span className="font-heading text-lg font-bold text-tertiary tabular-nums shrink-0">
                              {comp.percentage}%
                            </span>
                          </div>
                          {/* Description */}
                          <p className="font-body text-xs text-text-muted mt-1.5 leading-relaxed pl-8">
                            {comp.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommendation — 650ms */}
                <div
                  className="opacity-0"
                  style={{
                    animation:
                      "fadeSlideUp 0.3s var(--ease-out) 0.65s forwards",
                  }}
                >
                  <h2 className="font-heading text-lg font-bold text-text-primary mb-3">
                    Professional Advice 💊
                  </h2>
                  <div className="glass rounded-2xl p-5 border-l-4 border-l-secondary">
                    <p className="font-body text-sm text-text-secondary leading-relaxed">
                      {resultData.recommendation}
                    </p>
                  </div>
                </div>

                {/* Action buttons — 750ms */}
                <div
                  className="flex flex-col gap-3 opacity-0"
                  style={{
                    animation:
                      "fadeSlideUp 0.3s var(--ease-out) 0.75s forwards",
                  }}
                >
                  <ShareButton
                    resultData={resultData}
                    cardRef={cardRef}
                  />

                  {/* Try Again */}
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="w-full min-h-[48px] rounded-2xl border border-white/15 bg-transparent font-heading text-base font-bold uppercase tracking-wide text-text-primary transition-all duration-150 ease-out hover:bg-white/5 hover:border-white/30 active:scale-[0.97] active:duration-[50ms]"
                    style={{ padding: "14px 28px" }}
                  >
                    CONFESS AGAIN
                  </button>
                </div>

                {/* Hidden ResultCard for image generation */}
                <ResultCard ref={cardRef} data={resultData} userInput={userInput} />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
