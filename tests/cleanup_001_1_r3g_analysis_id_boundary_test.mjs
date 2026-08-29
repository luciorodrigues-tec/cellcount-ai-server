import test from "node:test";
import assert from "node:assert/strict";
import { isValidAnalysisId, validateAnalysisIdBoundary } from "../security/analysisIdBoundary.js";

test("R3G accepts canonical UUID v4 analysis identifiers", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal(isValidAnalysisId(id), true);
  const result = validateAnalysisIdBoundary(id);
  assert.equal(result.valid, true);
  assert.equal(result.analysisId, id);
});

test("R3G trims a valid UUID before accepting it", () => {
  const result = validateAnalysisIdBoundary(" 550e8400-e29b-41d4-a716-446655440000 ");
  assert.equal(result.valid, true);
  assert.equal(result.analysisId, "550e8400-e29b-41d4-a716-446655440000");
});

test("R3G rejects malformed analysis identifiers", () => {
  for (const value of ["", "cleanup-r3-nonexistent", "550e8400-e29b-11d4-a716-446655440000", "550e8400-e29b-41d4-7716-446655440000", "550e8400e29b41d4a716446655440000"]) {
    const result = validateAnalysisIdBoundary(value);
    assert.equal(result.valid, false);
    assert.equal(result.errorCode, "INVALID_ANALYSIS_ID");
  }
});

test("R3G rejects non-string identifiers", () => {
  for (const value of [null, undefined, 123, {}, []]) {
    assert.equal(validateAnalysisIdBoundary(value).valid, false);
  }
});
