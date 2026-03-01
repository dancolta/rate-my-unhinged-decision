// POST /api/analyze - Main AI analysis endpoint
// Validates input, rate limits, calls Groq with retry, returns structured response.
// See docs/ARCHITECTURE.md for the full specification.

import { NextRequest, NextResponse } from "next/server";
import { rateLimiter, getClientIP } from "@/lib/limits";
import { analyzeDecision, AIError } from "@/lib/ai";
import { sanitizeInput } from "@/lib/utils";
import type { AnalyzeResponse, ApiError } from "@/lib/types";

export const runtime = "nodejs"; // Groq SDK requires Node.js runtime

// ---------------------------------------------------------------------------
// Error response helper
// ---------------------------------------------------------------------------

function errorResponse(
  status: number,
  code: string,
  message: string,
  retryable: boolean,
  retryAfter?: number,
  extraHeaders?: Record<string, string>
): NextResponse<ApiError> {
  const body: ApiError = { error: code, message, retryable };
  if (retryAfter !== undefined) {
    body.retryAfter = retryAfter;
  }

  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

// ---------------------------------------------------------------------------
// Error matrix mapping
// ---------------------------------------------------------------------------

function mapAIError(err: unknown): NextResponse<ApiError> {
  if (err instanceof AIError) {
    switch (err.code) {
      case "AI_TIMEOUT":
        return errorResponse(
          504,
          "AI_TIMEOUT",
          "The analyst stared into the abyss of your decision for too long and got lost. Try again.",
          true
        );
      case "AI_RATE_LIMITED":
        return errorResponse(
          502,
          "AI_RATE_LIMITED",
          "The analyst's queue is full -- too many people making questionable decisions today. Try again in a minute.",
          true,
          60
        );
      case "AI_SERVICE_ERROR":
        return errorResponse(
          502,
          "AI_SERVICE_ERROR",
          "The analyst called in sick today. Even chaos professionals need mental health days. Try again shortly.",
          true
        );
      case "AI_PARSE_ERROR":
        return errorResponse(
          502,
          "AI_PARSE_ERROR",
          "The analyst's verdict was so unhinged even WE couldn't read it. Trying again...",
          true
        );
      case "AI_SCHEMA_ERROR":
        return errorResponse(
          502,
          "AI_SCHEMA_ERROR",
          "The analyst went off-script. We're sending them back to training. Try again.",
          true
        );
      case "EMPTY_AI_RESPONSE":
        return errorResponse(
          502,
          "AI_SERVICE_ERROR",
          "The analyst opened their mouth and nothing came out. Unprecedented. Try again.",
          true
        );
    }
  }

  console.error("Unhandled error in /api/analyze:", err);
  return errorResponse(
    500,
    "INTERNAL_ERROR",
    "Something broke and honestly, that's on us. The analyst is recalibrating.",
    true
  );
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // 1. Parse body
  let body: { input?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "Send JSON, not whatever that was. The tribunal requires a properly formatted confession.",
      false
    );
  }

  // 2. Sanitize
  if (typeof body.input !== "string") {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "You submitted... nothing. The void stares back and it's unimpressed. Type something.",
      false
    );
  }
  const input = sanitizeInput(body.input);

  // 3. Validate
  if (input.length === 0) {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "You submitted... nothing. The void stares back and it's unimpressed. Type something.",
      false
    );
  }
  if (input.length < 10) {
    return errorResponse(
      400,
      "INPUT_TOO_SHORT",
      "That's barely a sentence. The tribunal requires at least 10 characters of chaos to render judgment.",
      false
    );
  }
  if (input.length > 500) {
    return errorResponse(
      400,
      "INPUT_TOO_LONG",
      "Even your confession is unhinged -- 500 characters max. Edit down to the most incriminating bits.",
      false
    );
  }

  // 4. Rate limit
  const ip = getClientIP(request);
  let remaining: number;
  let reset: number;

  try {
    const rateResult = await rateLimiter.limit(ip);
    remaining = rateResult.remaining;
    reset = rateResult.reset;

    if (!rateResult.success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return errorResponse(
        429,
        "RATE_LIMITED",
        "Slow down, chaos agent. The tribunal needs a recess. Try again in a few minutes.",
        true,
        retryAfter,
        {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
        }
      );
    }
  } catch (rateLimitErr) {
    // If Upstash is down, log and continue (fail open for availability)
    console.error("Rate limit check failed:", rateLimitErr);
    remaining = -1;
    reset = 0;
  }

  // 5. Call AI (with 1 retry on failure)
  let result: Awaited<ReturnType<typeof analyzeDecision>>;
  try {
    result = await analyzeDecision(input);
  } catch (firstErr) {
    // Retry once on parse/schema errors (handles ~5% malformed JSON from LLMs)
    if (
      firstErr instanceof AIError &&
      (firstErr.code === "AI_PARSE_ERROR" || firstErr.code === "AI_SCHEMA_ERROR")
    ) {
      try {
        result = await analyzeDecision(input);
      } catch (retryErr) {
        return mapAIError(retryErr);
      }
    } else {
      return mapAIError(firstErr);
    }
  }

  // 6. Build response
  const { _model, ...payload } = result;
  const response: AnalyzeResponse = {
    ...payload,
    metadata: {
      model: _model,
      processingTime: Date.now() - startTime,
    },
  };

  const responseHeaders: Record<string, string> = {
    "Cache-Control": "no-store",
  };
  if (remaining >= 0) {
    responseHeaders["X-RateLimit-Remaining"] = String(remaining);
    responseHeaders["X-RateLimit-Reset"] = String(Math.ceil(reset / 1000));
  }

  return NextResponse.json(response, {
    status: 200,
    headers: responseHeaders,
  });
}
