// Groq API wrapper for AI calls
// - Model fallback (Llama 3.3 70B -> Mixtral 8x7B on 429)
// - 15-second timeout per call
// - Zod schema validation on parsed response
// - Typed errors for the route handler to catch

import Groq from "groq-sdk";
import {
  APIConnectionTimeoutError,
  RateLimitError,
  APIError,
} from "groq-sdk/error";
import { AI_CONFIG, SYSTEM_PROMPT } from "./prompts";
import { AIResponseSchema, type AIResponsePayload } from "./types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 15_000, // 15-second timeout per call
});

/**
 * Error subclass for AI-specific failures so the route handler
 * can distinguish between timeout, rate-limit, service, parse,
 * and schema errors.
 */
export class AIError extends Error {
  constructor(
    public readonly code:
      | "AI_TIMEOUT"
      | "AI_RATE_LIMITED"
      | "AI_SERVICE_ERROR"
      | "AI_PARSE_ERROR"
      | "AI_SCHEMA_ERROR"
      | "EMPTY_AI_RESPONSE",
    message: string,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Call Groq with the given model. Returns the validated AI payload
 * (without metadata -- the route handler adds that).
 */
async function callGroq(
  input: string,
  model: string
): Promise<AIResponsePayload> {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
    ],
    temperature: AI_CONFIG.temperature,
    max_tokens: AI_CONFIG.maxTokens,
    top_p: AI_CONFIG.topP,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new AIError("EMPTY_AI_RESPONSE", "Groq returned an empty response");
  }

  // Parse JSON -- may throw SyntaxError
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AIError(
      "AI_PARSE_ERROR",
      "Groq returned invalid JSON"
    );
  }

  // Validate against Zod schema
  const result = AIResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AIError(
      "AI_SCHEMA_ERROR",
      `Schema validation failed: ${result.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  return result.data;
}

/**
 * Wraps Groq SDK errors into our typed AIError so the route handler
 * can map them to the correct HTTP status and error code.
 */
function wrapGroqError(err: unknown): never {
  if (err instanceof AIError) {
    throw err;
  }
  if (err instanceof APIConnectionTimeoutError) {
    throw new AIError(
      "AI_TIMEOUT",
      "Groq API call timed out after 15 seconds"
    );
  }
  if (err instanceof RateLimitError) {
    throw new AIError(
      "AI_RATE_LIMITED",
      "Groq API rate limit exceeded"
    );
  }
  if (err instanceof APIError) {
    throw new AIError(
      "AI_SERVICE_ERROR",
      `Groq API error: ${err.status} ${err.message}`
    );
  }
  // Unknown error -- wrap as service error
  throw new AIError(
    "AI_SERVICE_ERROR",
    err instanceof Error ? err.message : "Unknown Groq error"
  );
}

/**
 * Primary entry point. Calls the primary model first.
 * If the primary model returns a 429, automatically retries with the
 * fallback model. All other errors propagate as typed AIErrors.
 *
 * Returns the model name used alongside the payload so the route handler
 * can include it in metadata.
 */
export async function analyzeDecision(
  input: string,
  model?: string
): Promise<AIResponsePayload & { _model: string }> {
  const targetModel = model ?? AI_CONFIG.model;

  try {
    const payload = await callGroq(input, targetModel);
    return { ...payload, _model: targetModel };
  } catch (err) {
    // If the primary model got rate-limited, try the fallback
    if (
      !model && // only auto-fallback on the first call (not when already using fallback)
      (err instanceof RateLimitError ||
        (err instanceof AIError && err.code === "AI_RATE_LIMITED"))
    ) {
      try {
        const payload = await callGroq(input, AI_CONFIG.fallbackModel);
        return { ...payload, _model: AI_CONFIG.fallbackModel };
      } catch (fallbackErr) {
        wrapGroqError(fallbackErr);
      }
    }

    wrapGroqError(err);
  }
}
