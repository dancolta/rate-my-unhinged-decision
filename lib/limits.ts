// IP rate limiting via Upstash Redis
// Sliding window: 15 requests per IP per rolling hour

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "1 h"), // 15 requests per IP per rolling hour
  analytics: true,                               // Track usage in Upstash dashboard
  prefix: "rmud",                                // Key prefix: "rmud:<ip>"
});

/**
 * Extract the real client IP from the request.
 *
 * On Vercel, x-forwarded-for is set by the edge network and cannot be
 * spoofed by the client. On other platforms this header CAN be spoofed --
 * use a platform-specific trusted header if deploying elsewhere.
 */
export function getClientIP(request: Request): string {
  // Vercel sets x-forwarded-for with the real client IP as the first value
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }

  // Vercel also sets x-real-ip
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Local development fallback
  return "127.0.0.1";
}
