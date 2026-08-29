// ============================================================================
// CELLCOUNT — CLEANUP-001.1 R1.1 ARCHITECTURE COMPATIBILITY GUARD
// ============================================================================

import assert from "node:assert/strict";
import test from "node:test";

import {
  createHttpFoundation,
} from "../bootstrap/httpFoundation.js";

test("historical MP-ARCH securityConfig shape remains composition-compatible", () => {
  const foundation =
    createHttpFoundation({
      securityConfig: {
        apiToken: "legacy-test-token",
        allowedOrigins: [
          "http://localhost:3000",
        ],
        rateLimitWindowMs: 60_000,
        rateLimitMaxRequests: 60,
        aiRateLimitMaxRequests: 12,
      },
    });

  assert.ok(foundation.app);
  assert.equal(
    typeof foundation.auth,
    "function",
  );
  assert.equal(
    typeof foundation.jsonBodyParser,
    "function",
  );
  assert.ok(foundation.upload);
});

test("production direct composition still requires session signing secret", () => {
  assert.throws(
    () =>
      createHttpFoundation({
        securityConfig: {
          nodeEnv: "production",
          apiToken: "legacy-test-token",
          allowedOrigins: [
            "https://example.test",
          ],
          rateLimitWindowMs: 60_000,
          rateLimitMaxRequests: 60,
          aiRateLimitMaxRequests: 12,
        },
      }),
    /sessionSigningSecret/,
  );
});
