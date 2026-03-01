"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { getScoreColor } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function getScoreReaction(score: number): { emoji: string; word: string } {
  if (score <= 15) return { emoji: "😐", word: "meh" };
  if (score <= 30) return { emoji: "😬", word: "oof" };
  if (score <= 50) return { emoji: "😳", word: "BOLD" };
  if (score <= 70) return { emoji: "🫣", word: "UNHINGED" };
  if (score <= 85) return { emoji: "💀", word: "LEGENDARY" };
  return { emoji: "🚨", word: "CRIMINALLY UNHINGED" };
}

function fireConfetti(score: number) {
  const intensity = Math.min(score / 100, 1);
  const count = Math.round(60 + intensity * 140);

  confetti({
    particleCount: count,
    spread: 70 + intensity * 40,
    origin: { y: 0.6, x: 0.5 },
    colors: ["#FF2D55", "#FF9500", "#AF52DE", "#FFD60A", "#30D158"],
    disableForReducedMotion: true,
  });

  if (score > 60) {
    setTimeout(() => {
      confetti({
        particleCount: Math.round(count * 0.4),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ["#FF2D55", "#AF52DE"],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: Math.round(count * 0.4),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ["#FF9500", "#FFD60A"],
        disableForReducedMotion: true,
      });
    }, 200);
  }
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [phase, setPhase] = useState<"counting" | "slam" | "settled">(
    "counting"
  );
  const animationRef = useRef<number | null>(null);

  const color = getScoreColor(displayScore);
  const reaction = getScoreReaction(score);

  // Single effect — no hasAnimated ref, no useCallback.
  // Cleans up properly under React Strict Mode double-fire.
  useEffect(() => {
    // Reset for each run (handles strict-mode re-invocation)
    setDisplayScore(0);
    setPhase("counting");

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplayScore(score);
      setPhase("settled");
      return;
    }

    const duration = 600;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      setDisplayScore(Math.round(easedProgress * score));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        // SLAM phase
        setPhase("slam");
        fireConfetti(score);

        if (score > 70) {
          document.body.style.animation = "screenShake 0.5s ease-out";
          setTimeout(() => {
            document.body.style.animation = "";
          }, 500);
        }

        setTimeout(() => setPhase("settled"), 600);
      }
    }

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [score]);

  return (
    <div className="flex flex-col items-center py-6">
      {/* Reaction emoji + word — appears after slam */}
      <div
        className="flex items-center gap-2 mb-4"
        style={{
          opacity: phase !== "counting" ? 1 : 0,
          transform: phase === "slam" ? "scale(1.2)" : "scale(1)",
          transition: "all 0.4s var(--ease-spring)",
        }}
      >
        <span className="text-4xl">{reaction.emoji}</span>
        <span
          className="font-heading text-sm font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {reaction.word}
        </span>
      </div>

      {/* Giant score */}
      <div className="relative flex items-center justify-center">
        {/* Glow */}
        <div
          className="absolute w-[200px] h-[200px] rounded-full"
          style={{
            backgroundColor: color,
            opacity: phase !== "counting" ? 0.2 : 0.1,
            filter: "blur(50px)",
            transition: "opacity 0.5s ease",
            animation:
              phase === "settled" ? "glowPulse 3s ease-in-out infinite" : "none",
          }}
        />
        <span
          className="relative font-heading font-bold leading-none tabular-nums"
          style={{
            fontSize: "min(40vw, 200px)",
            color,
            transform:
              phase === "slam"
                ? "scale(1.15)"
                : phase === "settled"
                  ? "scale(1)"
                  : "scale(0.8)",
            opacity: phase === "counting" && displayScore === 0 ? 0.5 : 1,
            transition: "transform 0.4s var(--ease-bounce), opacity 0.3s ease",
          }}
        >
          {displayScore}
        </span>
      </div>

      {/* Label */}
      <span className="font-heading text-sm font-medium text-text-muted uppercase tracking-widest mt-3">
        / 100 unhinged
      </span>
    </div>
  );
}
