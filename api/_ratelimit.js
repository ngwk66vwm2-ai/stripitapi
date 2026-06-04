import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let burstLimiter = null;
let dailyLimiter = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN
  });

  burstLimiter = new Ratelimit({
    redis,
    prefix: "stripit:ratelimit:burst",
    limiter: Ratelimit.slidingWindow(20, "1 m")
  });

  dailyLimiter = new Ratelimit({
    redis,
    prefix: "stripit:ratelimit:daily",
    limiter: Ratelimit.slidingWindow(100, "1 d")
  });
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) {
    return String(fwd).split(",")[0].trim();
  }
  return "anonymous";
}

export async function checkRateLimit(req) {
  // Fail open: if Upstash isn't configured, never block real users.
  if (!burstLimiter || !dailyLimiter) {
    return { allowed: true };
  }

  try {
    const ip = getClientIp(req);
    const [burst, daily] = await Promise.all([
      burstLimiter.limit(ip),
      dailyLimiter.limit(ip)
    ]);
    if (!burst.success || !daily.success) {
      return { allowed: false };
    }
    return { allowed: true };
  } catch (e) {
    // Fail open on any store glitch.
    console.warn("Rate limit check failed, allowing request:", e.message);
    return { allowed: true };
  }
}
