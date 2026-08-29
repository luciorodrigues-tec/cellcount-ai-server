import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

function routeBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing route marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing route end marker after: ${startMarker}`);
  return source.slice(start, end);
}

test("R3G server imports canonical analysisId boundary", () => {
  assert.match(
    source,
    /validateAnalysisIdBoundary[\s\S]*from "\.\/security\/analysisIdBoundary\.js";/,
  );
});

test("R3G GET analysis session validates before storage access", () => {
  const block = routeBlock(
    '"/analysis-sessions/:analysisId",',
    '"/analysis-sessions/:analysisId/recovery",',
  );
  const validateAt = block.indexOf("validateAnalysisIdBoundary(req.params.analysisId)");
  const storageAt = block.indexOf("analysisSessionStore.get(");
  assert.ok(validateAt >= 0);
  assert.ok(storageAt > validateAt);
  assert.match(block, /status\(400\)[\s\S]*errorCode: analysisIdBoundary\.errorCode/);
  assert.match(block, /analysisSessionStore\.get\(\s*analysisIdBoundary\.analysisId/);
});

test("R3G recovery validates before storage access", () => {
  const block = routeBlock(
    '"/analysis-sessions/:analysisId/recovery",',
    '"/analysis-sessions/:analysisId/retry",',
  );
  const validateAt = block.indexOf("validateAnalysisIdBoundary(req.params.analysisId)");
  const storageAt = block.indexOf("analysisSessionStore.getRecoverySnapshot(");
  assert.ok(validateAt >= 0);
  assert.ok(storageAt > validateAt);
  assert.match(block, /analysisSessionStore\.getRecoverySnapshot\(\s*analysisIdBoundary\.analysisId/);
});

test("R3G retry validates before storage access", () => {
  const block = routeBlock(
    '"/analysis-sessions/:analysisId/retry",',
    "// ============================================================================\n// ANALYZE",
  );
  const validateAt = block.indexOf("validateAnalysisIdBoundary(req.params.analysisId)");
  const storageAt = block.indexOf("analysisSessionStore.prepareRetry(");
  assert.ok(validateAt >= 0);
  assert.ok(storageAt > validateAt);
  assert.match(block, /analysisSessionStore\.prepareRetry\(\s*analysisIdBoundary\.analysisId/);
});

test("R3G analyze-slide validates supplied analysisId before storage access", () => {
  const start = source.indexOf('"/analyze-slide",');
  assert.ok(start >= 0);
  const block = source.slice(start, start + 7000);
  const requestedAt = block.indexOf("const requestedAnalysisId");
  const validateAt = block.indexOf("validateAnalysisIdBoundary(requestedAnalysisId)");
  const storageAt = block.indexOf("analysisSessionStore.get(");
  assert.ok(requestedAt >= 0);
  assert.ok(validateAt > requestedAt);
  assert.ok(storageAt > validateAt);
  assert.match(block, /analysisSessionStore\.get\(\s*analysisIdBoundary\.analysisId/);
});

test("R3G malformed-id response contract is stable", () => {
  const matches = source.match(/errorCode: analysisIdBoundary\.errorCode/g) ?? [];
  assert.equal(matches.length, 4);
  const badRequestMatches = source.match(/return res\.status\(400\)\.json\(\{/g) ?? [];
  assert.ok(badRequestMatches.length >= 4);
});
