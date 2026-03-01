// Shared utilities
// TODO: Input sanitization helpers
// TODO: Score formatting helpers

export function sanitizeInput(input: string): string {
  return input.trim();
}

export function formatScore(score: number): string {
  return `${Math.round(score)}`;
}
