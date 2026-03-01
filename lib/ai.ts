// Groq API wrapper for AI calls
// TODO: Implement Groq SDK client
// TODO: Add timeout handling (10s max)
// TODO: Add retry logic for transient failures

import { AnalyzeResponse } from './types';

export async function analyzeDecision(input: string): Promise<AnalyzeResponse> {
  // TODO: Implement Groq API call with system prompt from prompts.ts
  throw new Error('Not implemented');
}
