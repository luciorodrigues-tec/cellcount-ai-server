import assert from "node:assert/strict";
import test from "node:test";

import {
  loadSecurityConfig,
  parseAllowedOrigins,
} from "../security/securityConfig.js";

import {
  constantTimeTokenEquals,
  createBearerAuth,
  createCorsOptions,
  createRateLimiter,
  securityHeaders,
} from "../security/securityMiddleware.js";

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    payload: null,
    headers,
    setHeader(name, value) {
      headers.set(name, value);
    },
    removeHeader(name) {
      headers.delete(name);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("security config rejects missing API_TOKEN", () => {
  assert.throws(
    () => loadSecurityConfig({ NODE_ENV: "production" }),
    /API_TOKEN é obrigatório/,
  );
});

test("production requires an explicit CORS allowlist", () => {
  assert.throws(
    () => parseAllowedOrigins("", "production"),
    /CORS_ALLOWED_ORIGINS é obrigatório/,
  );
});

test("wildcard CORS is rejected", () => {
  assert.throws(
    () => parseAllowedOrigins("*", "production"),
    /não pode conter/,
  );
});

test("configured origins are trimmed and deduplicated", () => {
  assert.deepEqual(
    parseAllowedOrigins("https://a.test, https://b.test,https://a.test"),
    ["https://a.test", "https://b.test"],
  );
});

test("token comparison accepts only exact values", () => {
  assert.equal(constantTimeTokenEquals("secure-token", "secure-token"), true);
  assert.equal(constantTimeTokenEquals("secure-token-x", "secure-token"), false);
  assert.equal(constantTimeTokenEquals("", "secure-token"), false);
});

test("bearer auth rejects invalid token without leaking details", () => {
  const auth = createBearerAuth("secret-value");
  const req = { headers: { authorization: "Bearer wrong-value" } };
  const res = createResponse();
  let nextCalled = false;

  auth(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, {
    success: false,
    error: "Não autorizado.",
  });
});

test("bearer auth accepts valid token", () => {
  const auth = createBearerAuth("secret-value");
  const req = { headers: { authorization: "Bearer secret-value" } };
  const res = createResponse();
  let nextCalled = false;

  auth(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("CORS accepts allowlisted origin and rejects unknown origin", async () => {
  const options = createCorsOptions(["https://allowed.test"]);

  await new Promise((resolve, reject) => {
    options.origin("https://allowed.test", (error, allowed) => {
      if (error) reject(error);
      assert.equal(allowed, true);
      resolve();
    });
  });

  await new Promise((resolve) => {
    options.origin("https://blocked.test", (error) => {
      assert.match(error.message, /não autorizada/);
      resolve();
    });
  });
});

test("security headers remove framework disclosure", () => {
  const req = {};
  const res = createResponse();
  res.headers.set("X-Powered-By", "Express");
  let nextCalled = false;

  securityHeaders(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(res.headers.has("X-Powered-By"), false);
  assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(res.headers.get("X-Frame-Options"), "DENY");
});

test("rate limiter blocks requests above configured limit", () => {
  let currentTime = 1_000;
  const limiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 2,
    now: () => currentTime,
    keyGenerator: () => "test-client",
  });

  const first = createResponse();
  const second = createResponse();
  const third = createResponse();
  let allowed = 0;

  limiter({}, first, () => { allowed += 1; });
  limiter({}, second, () => { allowed += 1; });
  limiter({}, third, () => { allowed += 1; });

  assert.equal(allowed, 2);
  assert.equal(third.statusCode, 429);
  assert.equal(third.headers.get("Retry-After"), "60");

  currentTime += 60_001;
  const reset = createResponse();
  limiter({}, reset, () => { allowed += 1; });
  assert.equal(allowed, 3);
});
