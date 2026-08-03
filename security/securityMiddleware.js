// ============================================================================
// CELLCOUNT ENTERPRISE — SECURITY MIDDLEWARE
// MP-SEC-000001A
// ============================================================================

import crypto from "crypto";

function normalizeBearerToken(headerValue) {
  if (typeof headerValue !== "string") {
    return "";
  }

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export function constantTimeTokenEquals(received, expected) {
  const receivedBuffer = Buffer.from(String(received || ""), "utf8");
  const expectedBuffer = Buffer.from(String(expected || ""), "utf8");

  if (
    receivedBuffer.length === 0 ||
    receivedBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function createBearerAuth(apiToken) {
  if (!apiToken) {
    throw new Error("createBearerAuth requer um API token configurado.");
  }

  return function bearerAuth(req, res, next) {
    const receivedToken = normalizeBearerToken(req.headers.authorization);

    if (!constantTimeTokenEquals(receivedToken, apiToken)) {
      return res.status(401).json({
        success: false,
        error: "Não autorizado.",
      });
    }

    return next();
  };
}

export function createCorsOptions(allowedOrigins) {
  const originSet = new Set(allowedOrigins);

  return Object.freeze({
    origin(origin, callback) {
      // Requisições nativas, CLI, health checks internos e server-to-server
      // normalmente não enviam o header Origin.
      if (!origin || originSet.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origem não autorizada pela política CORS."));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
    credentials: false,
    maxAge: 600,
  });
}

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.removeHeader("X-Powered-By");
  next();
}

export function createRateLimiter({
  windowMs,
  maxRequests,
  keyGenerator = (req) => req.ip || req.socket?.remoteAddress || "unknown",
  now = () => Date.now(),
} = {}) {
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new Error("windowMs deve ser um inteiro positivo.");
  }

  if (!Number.isSafeInteger(maxRequests) || maxRequests <= 0) {
    throw new Error("maxRequests deve ser um inteiro positivo.");
  }

  const buckets = new Map();

  return function rateLimiter(req, res, next) {
    const currentTime = now();
    const key = String(keyGenerator(req));
    const current = buckets.get(key);

    const bucket = !current || current.resetAt <= currentTime
      ? { count: 0, resetAt: currentTime + windowMs }
      : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, maxRequests - bucket.count);
    res.setHeader("RateLimit-Limit", String(maxRequests));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
      res.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))),
      );

      return res.status(429).json({
        success: false,
        error: "Muitas requisições. Tente novamente em instantes.",
      });
    }

    // Limpeza oportunista para evitar crescimento ilimitado do Map.
    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets.entries()) {
        if (value.resetAt <= currentTime) {
          buckets.delete(bucketKey);
        }
      }
    }

    return next();
  };
}
