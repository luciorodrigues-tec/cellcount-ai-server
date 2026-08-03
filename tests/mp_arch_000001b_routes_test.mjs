import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import {
  registerSystemRoutes,
} from "../routes/systemRoutes.js";

function startTestServer(register) {
  const app = express();
  register(app);

  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
    server.once("error", reject);
  });
}

async function withServer(register, callback) {
  const { server, baseUrl } = await startTestServer(register);
  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("system route registration requires an Express-compatible app", () => {
  assert.throws(
    () => registerSystemRoutes({ model: "gpt-test" }),
    /app with get\(\) is required/,
  );
});

test("system route registration requires a model", () => {
  assert.throws(
    () => registerSystemRoutes({ app: express() }),
    /model is required/,
  );
});

test("root route preserves the public platform contract", async () => {
  await withServer(
    (app) => registerSystemRoutes({ app, model: "gpt-test" }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        success: true,
        app: "CELLCOUNT ELITE HOSPITAL",
        model: "gpt-test",
        status: "online",
        version: "V6_SAFE_HYBRID",
      });
    },
  );
});

test("health route preserves runtime observability fields", async () => {
  const memory = Object.freeze({ rss: 100, heapUsed: 50 });
  const instant = new Date("2026-07-29T00:00:00.000Z");

  await withServer(
    (app) => registerSystemRoutes({
      app,
      model: "gpt-test",
      uptimeProvider: () => 42.5,
      memoryProvider: () => memory,
      nowProvider: () => instant,
    }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        success: true,
        uptime: 42.5,
        memory,
        model: "gpt-test",
        timestamp: "2026-07-29T00:00:00.000Z",
      });
    },
  );
});
