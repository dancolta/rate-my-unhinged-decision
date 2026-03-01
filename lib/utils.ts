// Shared utilities for Rate My Unhinged Decision

import type { AnalyzeResponse } from "./types";

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags, control characters (keeping \n, \r, \t), and null bytes.
 * Applied before any validation checks -- silently strips, never errors.
 */
export function sanitizeInput(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")                        // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip control chars (keep \n, \r, \t)
    .replace(/\0/g, "")                              // Strip null bytes
    .trim();
}

// ---------------------------------------------------------------------------
// Score Color Gradient
// ---------------------------------------------------------------------------

interface GradientStop {
  score: number;
  r: number;
  g: number;
  b: number;
}

/** Gradient stops: green -> lime -> yellow -> orange -> red */
const GRADIENT_STOPS: GradientStop[] = [
  { score: 0,   r: 34,  g: 197, b: 94  }, // green
  { score: 25,  r: 132, g: 204, b: 22  }, // lime
  { score: 50,  r: 234, g: 179, b: 8   }, // yellow
  { score: 75,  r: 249, g: 115, b: 22  }, // orange
  { score: 100, r: 239, g: 68,  b: 68  }, // red
];

/**
 * Returns a CSS rgb() color interpolated between gradient stops based on score.
 * Score 0 = green, Score 100 = red, with lime/yellow/orange in between.
 */
export function getScoreColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));

  // Find the two stops we're between
  let lower = GRADIENT_STOPS[0];
  let upper = GRADIENT_STOPS[GRADIENT_STOPS.length - 1];

  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    if (clamped >= GRADIENT_STOPS[i].score && clamped <= GRADIENT_STOPS[i + 1].score) {
      lower = GRADIENT_STOPS[i];
      upper = GRADIENT_STOPS[i + 1];
      break;
    }
  }

  // Interpolate
  const range = upper.score - lower.score;
  const t = range === 0 ? 0 : (clamped - lower.score) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * t);
  const g = Math.round(lower.g + (upper.g - lower.g) * t);
  const b = Math.round(lower.b + (upper.b - lower.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns a CSS box-shadow string for a glow effect based on the score color.
 * Used for the score display and card accents.
 */
export function getScoreGlow(score: number): string {
  const color = getScoreColor(score);
  // Replace 'rgb(' with 'rgba(' and add alpha for the glow
  const rgbaInner = color.replace("rgb(", "rgba(").replace(")", ", 0.4)");
  const rgbaOuter = color.replace("rgb(", "rgba(").replace(")", ", 0.2)");
  return `0 0 20px ${rgbaInner}, 0 0 60px ${rgbaOuter}`;
}

// ---------------------------------------------------------------------------
// Sleep utility
// ---------------------------------------------------------------------------

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Canned Fallback Response
// ---------------------------------------------------------------------------

/**
 * Hardcoded funny AnalyzeResponse for when the AI completely fails.
 * This ensures the user always gets SOMETHING entertaining, even if
 * Groq is down, the JSON is malformed, and all retries are exhausted.
 */
export const CANNED_FALLBACK_RESPONSE: AnalyzeResponse = {
  score: 42,
  verdict: "The AI broke trying to judge you. That's honestly impressive.",
  profile:
    "Your decision was so unhinged that our AI analyst had a full existential crisis mid-evaluation. " +
    "The servers are fine. The code is fine. YOUR decision, however, created a paradox that briefly " +
    "divided by zero in the judgment matrix. We've never seen this before, and frankly, we're a " +
    "little afraid of you now.",
  comparisons: [
    {
      name: "Schrodinger's Cat",
      percentage: 88,
      description:
        "Your decision exists in a quantum state of being simultaneously the best and worst idea anyone has ever had -- we simply cannot observe it without it collapsing.",
    },
    {
      name: "The person who crashed the stock market by fat-fingering a trade",
      percentage: 67,
      description:
        "One small action, catastrophic ripple effects, and a room full of professionals staring at screens in disbelief.",
    },
    {
      name: "HAL 9000 (2001: A Space Odyssey)",
      percentage: 54,
      description:
        "You managed to make an AI malfunction through sheer force of chaotic energy -- HAL at least needed a mission conflict.",
    },
  ],
  recommendation:
    "Try again in a minute. And maybe tone down the chaos by 15% so our servers can keep up.",
  metadata: {
    model: "fallback-canned-response",
    processingTime: 0,
  },
};
