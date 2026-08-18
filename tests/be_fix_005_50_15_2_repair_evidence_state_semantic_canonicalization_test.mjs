import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  mergeVisualMorphologyRepair,
  MARROW_REPAIR_EVIDENCE_STATE_SEMANTIC_CANONICALIZATION_VERSION,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

const base = (state = "NOT_ASSESSABLE") => ({
  specimenAssessment: { status: "indeterminate", summary: "aspirado medular" },
  marrowAdequacy: { status: "indeterminate", summary: "campo limitado" },
  myeloidSeries: { status: "present", summary: "série mieloide" },
  erythroidSeries: { status: "present", summary: "série eritroide" },
  megakaryocyticSeries: { status: "notObserved", summary: "não observada" },
  blastAssessment: {
    status: "indeterminate",
    observed: null,
    evidenceState: state,
    approximateBlastLikeCells: 0,
    approximateImmatureCellCount: null,
    immatureCellBurden: "indeterminate",
    spatialDistribution: "indeterminate",
    morphologySupport: {
      highNCRatio: null,
      openFineChromatin: null,
      nucleoli: null,
      scantBasophilicCytoplasm: null,
      repeatedAcrossField: true,
    },
  },
});

test("PASS 0 — 005.50.15.2 version is registered", () => {
  assert.equal(
    MARROW_REPAIR_EVIDENCE_STATE_SEMANTIC_CANONICALIZATION_VERSION,
    "BE-FIX-005.50.15.2",
  );
});

test("PASS 1 — descriptive positive repair state outranks NOT_ASSESSABLE", () => {
  const repair = base("positiveMorphologicSuspicionInLimitedField");
  repair.blastAssessment.approximateImmatureCellCount = 8;
  repair.blastAssessment.morphologySupport.highNCRatio = true;
  repair.blastAssessment.morphologySupport.openFineChromatin = true;
  repair.blastAssessment.morphologySupport.nucleoli = true;

  const merged = mergeVisualMorphologyRepair(base(), repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });

  assert.equal(merged.blastAssessment.evidenceState, "FOCAL_SUSPICION");
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence.finalEvidenceState,
    "FOCAL_SUSPICION",
  );
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence.maximumPositiveCytologyCount,
    3,
  );
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence.positiveEvidenceStatePreserved,
    true,
  );
});

test("PASS 2 — limited-field positive morphology stays focal, never population-level", () => {
  const merged = mergeVisualMorphologyRepair(
    base(),
    { blastAssessment: { evidenceState: "positiveMorphologicSuspicionInLimitedField" } },
  );
  assert.equal(merged.blastAssessment.evidenceState, "FOCAL_SUSPICION");
  assert.notEqual(merged.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.notEqual(merged.blastAssessment.evidenceState, "OBSERVED_POPULATION");
});

test("PASS 3 — canonical positive state remains monotonic against later non-assessable state", () => {
  const merged = mergeVisualMorphologyRepair(
    base("FOCAL_SUSPICION"),
    { blastAssessment: { evidenceState: "NOT_ASSESSABLE" } },
  );
  assert.equal(merged.blastAssessment.evidenceState, "FOCAL_SUSPICION");
});

test("PASS 4 — unknown repair state cannot erase a known stronger primary state", () => {
  const merged = mergeVisualMorphologyRepair(
    base("UNRESOLVED_BLASTOID_CYTOLOGY"),
    { blastAssessment: { evidenceState: "unrecognizedState" } },
  );
  assert.equal(merged.blastAssessment.evidenceState, "UNRESOLVED_BLASTOID_CYTOLOGY");
});

test("PASS 5 — provenance exposes 005.50.15.2", () => {
  const merged = mergeVisualMorphologyRepair(
    base(),
    { blastAssessment: { evidenceState: "positiveMorphologicSuspicionInLimitedField" } },
  );
  assert.equal(
    merged.marrowRepairEvidenceMerge.repairEvidenceStateSemanticCanonicalizationVersion,
    "BE-FIX-005.50.15.2",
  );
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence.repairEvidenceStateSemanticCanonicalizationVersion,
    "BE-FIX-005.50.15.2",
  );
});

test("PASS 6 — server imports and exposes the new runtime fingerprint", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /MARROW_REPAIR_EVIDENCE_STATE_SEMANTIC_CANONICALIZATION_VERSION/);
  assert.match(server, /marrowRepairEvidenceStateSemanticCanonicalizationVersion/);
});
