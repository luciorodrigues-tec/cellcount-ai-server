import test from "node:test";
import assert from "node:assert/strict";

import {
  bootstrapRuntime,
} from "../bootstrap/runtimeBootstrap.js";

import {
  createHttpFoundation,
} from "../bootstrap/httpFoundation.js";

const TEST_SECURITY_CONFIG = Object.freeze({
  apiToken: "test-token",
  allowedOrigins: Object.freeze([
    "http://localhost:8080",
  ]),
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 60,
  aiRateLimitMaxRequests: 12,
});

test(
  "runtime bootstrap loads env once and returns a frozen snapshot",
  () => {
    let loadCalls = 0;
    const logs = [];

    const runtime = bootstrapRuntime({
      env: {
        API_TOKEN: "test-token",
        OPENAI_API_KEY: "openai-key",
        OPENAI_MODEL: "gpt-test",
        PORT: "4100",
      },
      loadEnv: () => {
        loadCalls += 1;
      },
      securityConfigLoader: () => TEST_SECURITY_CONFIG,
      logger: {
        log: (...values) => logs.push(values),
      },
    });

    assert.equal(loadCalls, 1);
    assert.equal(runtime.port, "4100");
    assert.equal(runtime.openAIApiKey, "openai-key");
    assert.equal(runtime.openAIModel, "gpt-test");
    assert.equal(runtime.securityConfig, TEST_SECURITY_CONFIG);
    assert.equal(Object.isFrozen(runtime), true);
    assert.equal(logs.length, 2);
  },
);

test(
  "runtime bootstrap preserves default model and port",
  () => {
    const runtime = bootstrapRuntime({
      env: {
        API_TOKEN: "test-token",
      },
      loadEnv: () => {},
      securityConfigLoader: () => TEST_SECURITY_CONFIG,
      logger: {
        log: () => {},
      },
    });

    assert.equal(runtime.port, 3000);
    assert.equal(runtime.openAIModel, "gpt-4.1");
    assert.equal(runtime.openAIApiKey, undefined);
  },
);

test(
  "HTTP foundation requires validated security configuration",
  () => {
    assert.throws(
      () => createHttpFoundation(),
      /securityConfig is required/,
    );
  },
);

test(
  "HTTP foundation returns app, parsers, upload and auth composition services",
  () => {
    const foundation = createHttpFoundation({
      securityConfig: TEST_SECURITY_CONFIG,
    });

    assert.equal(typeof foundation.app.use, "function");
    assert.equal(typeof foundation.app.listen, "function");
    assert.equal(typeof foundation.upload.array, "function");
    assert.equal(typeof foundation.auth, "function");
    assert.equal(typeof foundation.jsonBodyParser, "function");
    assert.equal(Object.isFrozen(foundation), true);
  },
);

test(
  "HTTP foundation registers general and AI rate-limit layers",
  () => {
    const { app } = createHttpFoundation({
      securityConfig: TEST_SECURITY_CONFIG,
    });

    const routePatterns = app._router.stack
      .map((layer) => layer.regexp?.toString() || "")
      .join("\n");

    assert.match(routePatterns, /knowledge/);
    assert.match(routePatterns, /classify-specimen/);
    assert.match(routePatterns, /analyze-slide/);
    assert.match(routePatterns, /hema-ask/);
  },
);


test(
  "route JSON parser is created by the HTTP foundation",
  () => {
    const foundation = createHttpFoundation({
      securityConfig: TEST_SECURITY_CONFIG,
    });

    const parser = foundation.jsonBodyParser({
      limit: "1mb",
    });

    assert.equal(typeof parser, "function");
  },
);
