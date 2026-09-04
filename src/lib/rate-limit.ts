type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - existing.windowStart) };
  }

  existing.count += 1;
  return { ok: true };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
