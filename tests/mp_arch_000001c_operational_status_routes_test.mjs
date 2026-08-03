import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import {
  registerOperationalStatusRoutes,
} from "../routes/operationalStatusRoutes.js";

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

const auth = (_req, _res, next) => next();
const morphologyKnowledgeRegistry = {
  snapshot: () => ({
    version: "knowledge-v1",
    size: 2,
    entities: [{ id: "CELL-A" }, { id: "CELL-B" }],
  }),
};
const morphologyCriteriaEngine = {
  criteriaRegistry: {
    snapshot: () => ({
      version: "criteria-v1",
      size: 2,
      definitions: [{ cellId: "CELL-A" }, { cellId: "CELL-B" }],
    }),
  },
  featureCatalog: { size: 9 },
};
const differentialRuleLibrary = {
  repository: {
    snapshot: () => ({
      version: "differential-v1",
      size: 2,
      rules: [{ id: "RULE-1" }, { id: "RULE-2" }],
    }),
  },
};

function register(app) {
  registerOperationalStatusRoutes({
    app,
    auth,
    morphologyKnowledgeRegistry,
    morphologyCriteriaEngine,
    differentialRuleLibrary,
  });
}

test("operational status route registration requires an app", () => {
  assert.throws(
    () => registerOperationalStatusRoutes({ auth }),
    /app with get\(\) is required/,
  );
});

test("operational status route registration requires auth", () => {
  assert.throws(
    () => registerOperationalStatusRoutes({ app: express() }),
    /auth middleware is required/,
  );
});

test("knowledge morphology status preserves contract", async () => {
  await withServer(register, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/knowledge/morphology/status`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      knowledgeEngine: {
        version: "knowledge-v1",
        entityCount: 2,
        entityIds: ["CELL-A", "CELL-B"],
        status: "cell_library_ready",
      },
    });
  });
});

test("criteria status preserves contract", async () => {
  await withServer(register, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/knowledge/morphology/criteria/status`,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      criteriaEngine: {
        version: "criteria-v1",
        definitionCount: 2,
        featureReferenceCount: 9,
        cellDefinitionIds: ["CELL-A", "CELL-B"],
        status: "criteria_definition_ready",
      },
    });
  });
});

test("differential rule status preserves contract", async () => {
  await withServer(register, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/knowledge/morphology/differential-rules/status`,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      success: true,
      differentialRuleLibrary: {
        version: "differential-v1",
        pairCount: 2,
        ruleIds: ["RULE-1", "RULE-2"],
        status: "differential_rule_library_ready",
      },
    });
  });
});
