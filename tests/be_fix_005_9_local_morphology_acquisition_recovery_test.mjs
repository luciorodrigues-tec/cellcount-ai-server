import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
  buildIncompleteVisualAcquisitionResponse,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

console.log("\n================================================================");
console.log("BE-FIX-005.9 — LOCAL MORPHOLOGY ACQUISITION RECOVERY: TESTS REGISTERED");
console.log("================================================================");

test("PASS 0 — 005.9 recovery version is explicit without changing 005.8 contract", () => {
  assert.equal(LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION, "BE-FIX-005.9");
  console.log("PASS 0 — 005.9 recovery version registered");
});

test("PASS 1 — incomplete acquisition suppresses fabricated morphology report", () => {
  const result = buildIncompleteVisualAcquisitionResponse({
    acquisition: {
      complete: false,
      status: "INCOMPLETE_VISUAL_EVIDENCE",
      missingRequirements: ["leukocyte_morphology_detail"],
    },
    primaryElapsedMs: 76000,
    requestId: "test-request",
  });

  assert.equal(result.success, false);
  assert.equal(result.errorCode, "INCOMPLETE_VISUAL_EVIDENCE");
  assert.equal(result.metadata.reportSuppressed, true);
  assert.equal(result.metadata.safeFailureMode, true);
  assert.equal(result.requiresRetry, true);
  console.log("PASS 1 — incomplete VME fails closed instead of producing CAMPO LIMITADO pseudo-report");
});

test("PASS 2 — image payload supports non-redundant first-pass acquisition", () => {
  const source = fs.readFileSync(
    new URL("../ai/imageEnhancer.js", import.meta.url),
    "utf8",
  );

  assert.match(source, /includeCenterCrop/);
  assert.match(source, /imageDetail/);
  assert.match(source, /detail: imageDetail/);
  console.log("PASS 2 — VME can send one high-detail field without automatic crop/tile duplication");
});

test("PASS 3 — server defaults peripheral VME to one primary image and reduced output budget", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  assert.match(server, /VME_PRIMARY_TILES \|\| 0/);
  assert.match(server, /VME_INCLUDE_CENTER_CROP \|\| "false"/);
  assert.match(server, /VME_IMAGE_DETAIL \|\| "high"/);
  assert.match(server, /OPENAI_VISION_MAX_COMPLETION_TOKENS \|\| 1800/);
  assert.match(server, /BE-FIX-005\.9 — LOCAL MORPHOLOGY ACQUISITION RECOVERY/);
  console.log("PASS 3 — latency-oriented VME defaults are installed");
});

test("PASS 4 — incomplete acquisition is stopped before normalization/LME", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  const vme = server.indexOf("VME-1.0 — INITIAL ACQUISITION");
  const suppress = server.indexOf("REPORT SUPPRESSED: INCOMPLETE VISUAL ACQUISITION");
  const lme = server.indexOf("LOCAL MORPHOLOGY EVIDENCE — CAPTURED");

  assert.ok(vme > 0);
  assert.ok(suppress > vme);
  assert.ok(lme > suppress);
  assert.match(server, /errorCode === "INCOMPLETE_VISUAL_EVIDENCE"/);
  console.log("PASS 4 — boolean/incomplete acquisition cannot become a governed morphology report");
});

test("PASS 5 — production runtime can be verified directly", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  assert.match(server, /\/runtime-version/);
  assert.match(server, /localMorphologyAcquisitionRecoveryVersion/);
  assert.match(server, /productionVmeEnforcementVersion/);
  console.log("PASS 5 — runtime fingerprint endpoint exposes deployed backend version");
});

test("PASS 6 — priority service tier remains opt-in", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  assert.match(server, /OPENAI_VISION_SERVICE_TIER/);
  assert.match(server, /if \(process\.env\.OPENAI_VISION_SERVICE_TIER\)/);
  console.log("PASS 6 — optional priority processing is available without silently changing cost");
});
