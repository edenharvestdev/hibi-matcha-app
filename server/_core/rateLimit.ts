/**
 * Process-local rate limiter — best-effort abuse mitigation.
 *
 * Limitations:
 * - Resets on server restart.
 * - Only effective on a single-instance deployment. Replace with Redis or
 *   a DB-backed bucket if scaled out.
 *
 * Used for: login brute-force, OTP requests, public form spam, etc.
 */

interface Bucket { count: number; firstAt: number }

const buckets = new Map<string, Bucket>();

// Periodic cleanup of expired buckets (every 5 minutes) to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  buckets.forEach((b, key) => {
    // Conservative TTL: drop buckets older than 1 hour
    if (now - b.firstAt > 60 * 60 * 1000) buckets.delete(key);
  });
}, CLEANUP_INTERVAL_MS).unref?.();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the bucket resets (0 if ok=true) */
  resetSec: number;
  /** Remaining attempts in the current window (0 if ok=false) */
  remaining: number;
}

/**
 * Check + increment a rate-limit bucket.
 *
 * @param key      Unique key (e.g. `"login:08xxxxxxxx"`, `"otp:08xxxxxxxx"`)
 * @param max      Maximum attempts within window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.firstAt > windowMs) {
    buckets.set(key, { count: 1, firstAt: now });
    return { ok: true, resetSec: 0, remaining: max - 1 };
  }
  if (b.count >= max) {
    return { ok: false, resetSec: Math.ceil((windowMs - (now - b.firstAt)) / 1000), remaining: 0 };
  }
  b.count++;
  return { ok: true, resetSec: 0, remaining: max - b.count };
}

/** Manually clear a bucket (e.g. after successful login). */
export function rateLimitReset(key: string) {
  buckets.delete(key);
}
