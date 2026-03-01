"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getScoreColor, getScoreGlow } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  const color = getScoreColor(displayScore);
  const glow = getScoreGlow(displayScore);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setDisplayScore(score);
        setIsComplete(true);
      });
      return;
    }

    const duration = 800;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = Math.round(easedProgress * score);

      setDisplayScore(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setIsComplete(true);
      }
    }

    animationRef.current = requestAnimationFrame(tick);
  }, [score]);

  useEffect(() => {
    animate();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animate]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Radial glow behind score */}
        <div
          className="absolute w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-full blur-2xl"
          style={{
            backgroundColor: color,
            opacity: 0.2,
          }}
        />
        <span
          className={`relative font-heading text-[72px] md:text-[80px] lg:text-[96px] font-bold leading-none ${
            isComplete ? "animate-[scorePulse_0.25s_var(--ease-out)]" : ""
          }`}
          style={{
            color,
            textShadow: glow,
          }}
        >
          {displayScore}
        </span>
      </div>
      <span
        className="font-heading text-xs font-medium uppercase text-text-muted"
        style={{
          letterSpacing: "0.1em",
          animation: "fadeSlideUp 0.3s var(--ease-out) 0.2s both",
        }}
      >
        Unhinged Level
      </span>
    </div>
  );
}
