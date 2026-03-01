// TypeScript interfaces for Rate My Unhinged Decision

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
  comparisons: ComparisonFigure[]; // 2-3 figure comparisons
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
