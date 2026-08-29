// ============================================================================
// CELLCOUNT — CLEANUP-001.1 R1 SECURITY BOUNDARY TEST
// ============================================================================

import assert from "node:assert/strict";
import test from "node:test";

import {
  loadSecurityConfig,
} from "../security/securityConfig.js";
import {
  createCompositeAuth,
  createCorsOptions,
} from "../security/securityMiddleware.js";
import {
  createSessionTokenService,
} from "../security/sessionTokenService.js";
import {
  createHttpFoundation,
} from "../bootstrap/httpFoundation.js";

const SECRET =
  "0123456789abcdef0123456789abcdef-cck-cleanup";

function createMockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    removeHeader(name) {
      delete this.headers[String(name).toLowerCase()];
    },
  };
}

test("production requires SESSION_SIGNING_SECRET", () => {
  assert.throws(
    () =>
      loadSecurityConfig({
        NODE_ENV: "production",
        API_TOKEN: "legacy-token",
        CORS_ALLOWED_ORIGINS: "https://example.test",
      }),
    /SESSION_SIGNING_SECRET/,
  );
});

test("production disables legacy API token by default", () => {
  const config =
    loadSecurityConfig({
      NODE_ENV: "production",
      API_TOKEN: "legacy-token",
      SESSION_SIGNING_SECRET: SECRET,
      CORS_ALLOWED_ORIGINS: "https://example.test",
    });

  assert.equal(config.allowLegacyApiToken, false);
  assert.equal(config.sessionTokenTtlSeconds, 900);
  assert.equal(config.sessionIssueMaxRequests, 12);
});

test("development preserves legacy compatibility by default", () => {
  const config =
    loadSecurityConfig({
      API_TOKEN: "legacy-token",
    });

  assert.equal(config.allowLegacyApiToken, true);
  assert.ok(config.sessionSigningSecret.length >= 32);
});

test("session token is device-bound and tamper-resistant", () => {
  let clock = 1_700_000_000_000;

  const service =
    createSessionTokenService({
      signingSecret: SECRET,
      ttlSeconds: 900,
      now: () => clock,
    });

  const issued =
    service.issue({
      deviceId: "device-A",
    });

  const valid =
    service.verify(
      issued.token,
      { deviceId: "device-A" },
    );

  assert.equal(valid.valid, true);
  assert.equal(valid.kind, "session");
  assert.equal(valid.deviceId, "device-A");

  const wrongDevice =
    service.verify(
      issued.token,
      { deviceId: "device-B" },
    );

  assert.equal(wrongDevice.valid, false);
  assert.equal(
    wrongDevice.reason,
    "DEVICE_BINDING_MISMATCH",
  );

  const tampered =
    `${issued.token.slice(0, -1)}x`;

  assert.equal(
    service.verify(
      tampered,
      { deviceId: "device-A" },
    ).valid,
    false,
  );

  clock += 901_000;

  assert.equal(
    service.verify(
      issued.token,
      { deviceId: "device-A" },
    ).reason,
    "TOKEN_EXPIRED",
  );
});

test("composite auth accepts session token", () => {
  const service =
    createSessionTokenService({
      signingSecret: SECRET,
    });

  const issued =
    service.issue({
      deviceId: "device-A",
    });

  const auth =
    createCompositeAuth({
      apiToken: "legacy-token",
      allowLegacyApiToken: false,
      sessionTokenService: service,
    });

  const req = {
    headers: {
      authorization: `Bearer ${issued.token}`,
      "x-device-id": "device-A",
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  auth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.auth.kind, "session");
});

test("legacy API token is controlled by migration flag", () => {
  const service =
    createSessionTokenService({
      signingSecret: SECRET,
    });

  const disabled =
    createCompositeAuth({
      apiToken: "legacy-token",
      allowLegacyApiToken: false,
      sessionTokenService: service,
    });

  const reqDisabled = {
    headers: {
      authorization: "Bearer legacy-token",
    },
  };
  const resDisabled = createMockResponse();

  disabled(
    reqDisabled,
    resDisabled,
    () => assert.fail("legacy token must be rejected"),
  );

  assert.equal(resDisabled.statusCode, 401);

  const enabled =
    createCompositeAuth({
      apiToken: "legacy-token",
      allowLegacyApiToken: true,
      sessionTokenService: service,
    });

  const reqEnabled = {
    headers: {
      authorization: "Bearer legacy-token",
    },
  };
  const resEnabled = createMockResponse();
  let nextCalled = false;

  enabled(reqEnabled, resEnabled, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(reqEnabled.auth.kind, "legacy-api-token");
});

test("CORS permits x-device-id", () => {
  const options =
    createCorsOptions([
      "https://example.test",
    ]);

  assert.ok(
    options.allowedHeaders.includes(
      "x-device-id",
    ),
  );
});

test("HTTP foundation exposes short-lived session issuance endpoint", async () => {
  const securityConfig =
    loadSecurityConfig({
      NODE_ENV: "test",
      API_TOKEN: "legacy-token",
      SESSION_SIGNING_SECRET: SECRET,
      ALLOW_LEGACY_API_TOKEN: "true",
    });

  const { app } =
    createHttpFoundation({
      securityConfig,
    });

  const server =
    await new Promise((resolve) => {
      const instance =
        app.listen(
          0,
          "127.0.0.1",
          () => resolve(instance),
        );
    });

  try {
    const address = server.address();

    const response =
      await fetch(
        `http://127.0.0.1:${address.port}/auth/session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": "test-device-001",
          },
          body: "{}",
        },
      );

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("cache-control"),
      "no-store",
    );

    const body =
      await response.json();

    assert.equal(body.success, true);
    assert.equal(body.tokenType, "Bearer");
    assert.equal(
      typeof body.accessToken,
      "string",
    );
    assert.ok(body.accessToken.length > 40);
    assert.equal(body.expiresIn, 900);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) =>
        error ? reject(error) : resolve(),
      ),
    );
  }
});
