"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiError } from "@/lib/types";

interface ErrorBoundaryProps {
  error: ApiError;
  onRetry: () => void;
}

export default function ErrorBoundary({ error, onRetry }: ErrorBoundaryProps) {
  const [countdown, setCountdown] = useState<number | null>(
    error.retryAfter ?? null
  );

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const handleRetry = useCallback(() => {
    onRetry();
  }, [onRetry]);

  const isRateLimit = error.error === "RATE_LIMITED";
  const canRetry = error.retryable && (!isRateLimit || countdown === 0);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTitle = (): string => {
    if (isRateLimit) return "SLOW DOWN, CHAOS AGENT";
    if (
      error.error === "AI_TIMEOUT" ||
      error.error === "AI_SERVICE_ERROR" ||
      error.error === "AI_RATE_LIMITED" ||
      error.error === "AI_PARSE_ERROR" ||
      error.error === "AI_SCHEMA_ERROR" ||
      error.error === "INTERNAL_ERROR"
    ) {
      return "EVEN AI CAN'T HANDLE THIS";
    }
    return "SOMETHING WENT WRONG";
  };

  const getTitleColor = (): string => {
    if (isRateLimit) return "text-warning";
    return "text-error";
  };

  const getBorderColor = (): string => {
    if (isRateLimit) return "border-l-warning";
    return "border-l-error";
  };

  return (
    <div
      className="flex flex-col gap-4"
      style={{
        animation: "fadeSlideUp 0.3s var(--ease-out) forwards",
      }}
    >
      <div
        className={`glass rounded-2xl p-4 md:p-5 border-l-4 ${getBorderColor()} animate-[errorShake_0.3s_ease-out]`}
      >
        <h2
          className={`font-heading text-lg font-bold uppercase ${getTitleColor()}`}
          style={{ letterSpacing: "0.05em" }}
        >
          {getTitle()}
        </h2>
        <p className="mt-3 font-body text-base text-text-secondary leading-relaxed">
          {error.message}
        </p>
        {isRateLimit && countdown !== null && countdown > 0 && (
          <p className="mt-3 font-body text-base text-text-primary">
            Tribunal reconvenes in{" "}
            <span className="font-bold text-warning">
              {formatCountdown(countdown)}
            </span>
          </p>
        )}
      </div>

      {error.retryable && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={!canRetry}
          className={`w-full min-h-[48px] rounded-2xl font-heading text-base font-bold uppercase tracking-wide text-white transition-all duration-150 ease-out ${
            canRetry
              ? "bg-primary hover:shadow-[0_4px_30px_rgba(255,45,85,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] active:shadow-none active:duration-[50ms]"
              : "bg-elevated text-text-muted cursor-not-allowed"
          }`}
          style={{ padding: "14px 28px" }}
        >
          {isRateLimit ? "TRY AGAIN LATER" : "TRY AGAIN"}
        </button>
      )}

      {!error.retryable && (
        <p
          className="text-center font-heading text-xs font-medium uppercase text-text-muted"
          style={{ letterSpacing: "0.1em" }}
        >
          Fix and resubmit
        </p>
      )}
    </div>
  );
}
