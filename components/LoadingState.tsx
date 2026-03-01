"use client";

import { useState, useEffect } from "react";

const STATUS_MESSAGES = [
  "consulting historical records...",
  "cross-referencing with known chaos agents...",
  "measuring unhinged energy levels...",
  "drafting your psychological profile...",
  "preparing your verdict...",
];

const CYCLE_INTERVAL = 800;

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        setIsVisible(true);
      }, 200);
    }, CYCLE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col items-start gap-6"
      style={{
        animation: "fadeSlideUp 0.3s var(--ease-out) forwards",
      }}
    >
      <h2
        className="font-heading text-lg font-bold uppercase text-text-primary"
        style={{ letterSpacing: "0.05em" }}
      >
        Analyzing Your Life Choices
      </h2>

      <div className="w-full h-1 rounded-full bg-elevated overflow-hidden">
        <div
          className="h-full rounded-full animate-[shimmer_2s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #27272A 0%, #FF3B3B 30%, #FFB800 50%, #FF3B3B 70%, #27272A 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      <p
        className="font-body text-sm text-text-muted transition-opacity duration-200 ease-out min-h-[2.5rem]"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {STATUS_MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
