// TypeScript interfaces & Zod schemas for Rate My Unhinged Decision

import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const ComparisonFigureSchema = z.object({
  name: z.string().min(1),
  percentage: z.number().int().min(0).max(100),
  description: z.string().min(1),
});

/**
 * Validates the raw AI JSON response (before metadata is attached).
 * Allows 2-4 comparisons -- the prompt requests exactly 3, but we give
 * the model slight flexibility so a valid, funny response isn't rejected
 * because it returned 2 instead of 3.
 */
export const AIResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.string().min(1),
  profile: z.string().min(1),
  comparisons: z.array(ComparisonFigureSchema).min(2).max(4),
  recommendation: z.string().min(1),
});

/** The shape that comes back from the AI, before we add metadata. */
export type AIResponsePayload = z.infer<typeof AIResponseSchema>;

// ---------------------------------------------------------------------------
// TypeScript Interfaces
// ---------------------------------------------------------------------------

export interface AnalyzeRequest {
  input: string;
}

export interface ComparisonFigure {
  name: string;
  percentage: number;
  description: string;
}

export interface AnalyzeResponse {
  score: number; // 0-100 unhinged scale
  verdict: string; // Short one-liner verdict
  profile: string; // Psychological profile description
  comparisons: ComparisonFigure[]; // 2-4 figure comparisons
  recommendation: string; // Humorous recommendation
  metadata: {
    model: string;
    processingTime: number;
  };
}

export interface RateLimitInfo {
  remaining: number;
  reset: number; // timestamp
}

export interface ApiError {
  error: string;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}
