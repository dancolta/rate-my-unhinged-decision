// IP rate limiting via Upstash Redis
// TODO: Implement sliding window rate limiter
// TODO: 10 requests per IP per hour
// TODO: Return remaining count and reset time

import { RateLimitInfo } from './types';

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  // TODO: Implement Upstash rate limiter
  throw new Error('Not implemented');
}
