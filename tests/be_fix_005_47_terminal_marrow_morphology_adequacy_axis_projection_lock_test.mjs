import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyMarrowMorphologyAdequacyProjectionLock,
  evaluateMarrowMorphologyAdequacyProjectionLock,
  MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
  MARROW_LIMITED_FIELD_AXIS_NON_OVERRIDE_VERSION,
} from "../ai/boneMarrow/marrowMorphologyAdequacyProjectionLockEngine.js";

import {
  buildConfidenceAnalysis,
} from "../ai/confidenceEngine.js";

function protectedLimitedExpansion() {
  return {
    finalClassification: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    morphologicRiskClass: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    riskLevel: "Expansão mieloide/granulocítica relevante com maturação preservada",
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      myeloidExpansionPattern: true,
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },
    marrowAdequacyMorphologyAxis: {
      morphologyClassification:
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      limitedField: true,
    },
    finalMarrowAuthority: {
      applyExpansionAuthority: true,
      morphologyClassification:
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      structuredBlast: {
        observed: false,
        suspicious: false,
      },
    },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      structuredPathologicSubset: false,
    },
    marrowPathologicMaturationContinuumLock: {
      active: true,
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      blastoidPopulationSupported: false,
    },
    globalPattern: {
      dominantPattern:
        "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      marrowPositiveBlastEvidence: false,
      pathologicMyeloidExpansionPattern: true,
    },
    overallAssessment: {
      riskCategory: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    },
    confidenceAnalysis: {},
  };
}

function trueBlastLimited() {
  const r = protectedLimitedExpansion();
  r.finalClassification = "MARROW_BLASTOID_POPULATION_SUSPICIOUS";
  r.morphologicRiskClass = "MARROW_BLASTOID_POPULATION_SUSPICIOUS";
  r.finalMarrowAuthority = {
    ...r.finalMarrowAuthority,
    applyExpansionAuthority: false,
    morphologyClassification: "MARROW_BLASTOID_POPULATION_SUSPICIOUS",
    structuredBlast: {
      observed: false,
      suspicious: true,
    },
  };
  r.marrowBlastPopulationEvidence = {
    observedPopulation: false,
    suspiciousPopulation: true,
  };
  return r;
}

test("PASS 0 — 005.47 identities are registered", () => {
  assert.equal(
    MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
    "BE-FIX-005.47",
  );
  assert.equal(
    MARROW_LIMITED_FIELD_AXIS_NON_OVERRIDE_VERSION,
    "BE-FIX-005.47",
  );
});

test("PASS 1 — limited field with protected expansion activates axis projection lock", () => {
  const d =
    evaluateMarrowMorphologyAdequacyProjectionLock(
      protectedLimitedExpansion(),
    );
  assert.equal(d.active, true);
  assert.equal(d.protectedExpansion, true);
  assert.equal(d.adequacyClassification, "CLASS_1_LIMITED_FIELD");
});

test("PASS 2 — morphology classification survives limited-field projection", () => {
  const out =
    applyMarrowMorphologyAdequacyProjectionLock(
      protectedLimitedExpansion(),
    );
  assert.equal(
    out.finalClassification,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
  assert.equal(
    out.morphologicRiskClass,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
});

test("PASS 3 — CLASS_1 remains adequacy metadata instead of morphology class", () => {
  const out =
    applyMarrowMorphologyAdequacyProjectionLock(
      protectedLimitedExpansion(),
    );
  assert.equal(
    out.marrowAdequacyMorphologyAxis.adequacyClassification,
    "CLASS_1_LIMITED_FIELD",
  );
  assert.equal(
    out.evidenceGovernance.adequacyClassification,
    "CLASS_1_LIMITED_FIELD",
  );
  assert.equal(
    out.marrowAdequacyMorphologyAxis.morphologyOverridesAdequacy,
    true,
  );
});

test("PASS 4 — limited-field restrictions remain strict", () => {
  const out =
    applyMarrowMorphologyAdequacyProjectionLock(
      protectedLimitedExpansion(),
    );
  assert.equal(out.evidenceGovernance.limitedField, true);
  assert.equal(out.evidenceGovernance.evidenceScope, "FIELD_SCOPED");
  assert.equal(out.evidenceGovernance.populationInferenceAllowed, false);
  assert.equal(out.evidenceGovernance.globalNegativeExclusionAllowed, false);
});

test("PASS 5 — true structured blast morphology also survives limited field", () => {
  const out =
    applyMarrowMorphologyAdequacyProjectionLock(
      trueBlastLimited(),
    );
  assert.equal(
    out.finalClassification,
    "MARROW_BLASTOID_POPULATION_SUSPICIOUS",
  );
  assert.equal(
    out.morphologicRiskClass,
    "MARROW_BLASTOID_POPULATION_SUSPICIOUS",
  );
  assert.equal(
    out.marrowAdequacyMorphologyAxis.adequacyClassification,
    "CLASS_1_LIMITED_FIELD",
  );
});

test("PASS 6 — confidence engine recognizes limited adequacy without morphology collapse", () => {
  const analysis = protectedLimitedExpansion();
  const c = buildConfidenceAnalysis({ analysis });
  assert.equal(c.globalConfidenceScore, 58);
  assert.equal(
    c.calibration.strategy,
    "limited_field_preserve_positive_marrow_pattern_without_etiologic_overcall",
  );
});

test("PASS 7 — morphology/risk axis stays expansion while confidence stays conservative", () => {
  const analysis = protectedLimitedExpansion();
  const out =
    applyMarrowMorphologyAdequacyProjectionLock(analysis);
  const c = buildConfidenceAnalysis({ analysis: out });

  assert.equal(
    out.overallAssessment.riskCategory,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
  assert.ok(c.globalConfidenceScore < 100);
});

test("PASS 8 — no global blast-negative exclusion is fabricated", () => {
  const out =
    applyMarrowMorphologyAdequacyProjectionLock(
      protectedLimitedExpansion(),
    );
  assert.equal(
    out.evidenceGovernance.globalNegativeExclusionAllowed,
    false,
  );
  assert.equal(out.findings.blastSuspicion, false);
});

test("PASS 9 — server gates both late limited-field writers and exposes 005.47 runtime fingerprints", async () => {
  const server = await readFile(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

  assert.match(server, /shouldPreserveTerminalMarrowMorphology/);
  assert.match(server, /applyMarrowMorphologyAdequacyProjectionLock/);
  assert.match(
    server,
    /marrowTerminalMorphologyAdequacyProjectionLockVersion/,
  );
  assert.match(server, /marrowLimitedFieldAxisNonOverrideVersion/);
  assert.match(
    server,
    /BE-FIX-005\.47 — TERMINAL MARROW MORPHOLOGY \/ ADEQUACY AXIS PROJECTION LOCK/,
  );

  const genericAssignments =
    server.match(/finalResult\.morphologicRiskClass = "CLASS_1_LIMITED_FIELD"/g) || [];
  assert.ok(genericAssignments.length >= 1);

  assert.match(
    server,
    /if \(preserveTerminalMarrowMorphology\)[\s\S]*?applyMarrowMorphologyAdequacyProjectionLock/,
  );
});
