import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyMarrowMyeloproliferativePatternCriticality,
  evaluateMarrowMyeloproliferativePatternCriticality,
  MARROW_MYELOPROLIFERATIVE_PATTERN_CORRELATION_VERSION,
  MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
  MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION,
  MARROW_BCR_ABL1_RECOMMENDATION_GATE_VERSION,
} from "../ai/boneMarrow/marrowMyeloproliferativePatternCriticalityEngine.js";

function expansionCase({
  expansionScore = 8,
  basophil = false,
  erythroidReduction = true,
  limitedField = true,
} = {}) {
  return {
    finalClassification:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    morphologicRiskClass:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    riskLevel:
      "Expansão mieloide/granulocítica relevante com maturação preservada",
    findings: {
      blastSuspicion: false,
      myeloidExpansionPattern: true,
    },
    fieldAdequacy: {
      limitedField,
      adequateForPopulationAssessment: !limitedField,
      populationInferenceAllowed: !limitedField,
    },
    marrowAdequacyMorphologyAxis: {
      morphologyClassification:
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
      adequacyClassification:
        limitedField ? "CLASS_1_LIMITED_FIELD" : "POPULATION_ASSESSABLE",
      limitedField,
      morphologyOverridesAdequacy: true,
    },
    finalMarrowAuthority: {
      protectedExpansion: true,
      structuredBlast: {
        observed: false,
        suspicious: false,
        structured: false,
      },
    },
    marrowPathologicMaturationContinuumLock: {
      active: true,
      blastoidPopulationSupported: false,
    },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      expansionScore,
      disproportionateAxis: true,
      expansionBurdenAxis: true,
      maturationAxis: true,
      expansionSignals: {
        relativeMyeloidPredominance: true,
        disproportionateMyeloidRepresentation: true,
        numerousGranulocyticPrecursors: true,
        broadMaturationSpectrum: true,
        matureFormsPresent: true,
        leftShiftedMaturationSpectrum: true,
        erythroidRelativeReduction: erythroidReduction,
        basophilEosinophilEnrichment: basophil,
        denseMyeloidField: true,
      },
    },
    overallAssessment: {
      requiresHumanReview: true,
      riskCategory:
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    },
    structuredReport: {
      conclusion:
        "Expansão mieloide/granulocítica com amplo espectro maturativo.",
      hematologicMeaning: "",
      recommendation:
        "Correlacionar com hemograma completo e revisão microscópica.",
    },
    confidenceAnalysis: {
      globalConfidenceScore: 58,
      hematologicRisk: {
        level: "moderate",
        score: 45,
        label:
          "PADRÃO MORFOLÓGICO MEDULAR RELEVANTE — EXPANSÃO MIELOIDE COM MATURAÇÃO",
      },
      confidenceHierarchy: {
        morphologyLevel: 62,
        diagnosticLevel: 20,
        global: 58,
      },
      calibration: {
        limitedFieldLock: limitedField,
      },
    },
    clinicalCorrelationNeeds: [],
    possibleClinicalCorrelations: [],
    associatedEducationalHypotheses: [],
  };
}

test("PASS 0 — 005.49 identities are registered", () => {
  assert.equal(
    MARROW_MYELOPROLIFERATIVE_PATTERN_CORRELATION_VERSION,
    "BE-FIX-005.49",
  );
  assert.equal(
    MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
    "BE-FIX-005.49",
  );
  assert.equal(
    MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION,
    "BE-FIX-005.49",
  );
  assert.equal(
    MARROW_BCR_ABL1_RECOMMENDATION_GATE_VERSION,
    "BE-FIX-005.49",
  );
});

test("PASS 1 — severe protected expansion is calibrated as critical morphology", () => {
  const decision =
    evaluateMarrowMyeloproliferativePatternCriticality(
      expansionCase(),
    );

  assert.equal(decision.active, true);
  assert.equal(decision.severityLevel, "CRITICAL");
  assert.ok(decision.severityScore >= 85);
});

test("PASS 2 — limited field does not downgrade positive morphology severity", () => {
  const limited =
    evaluateMarrowMyeloproliferativePatternCriticality(
      expansionCase({ limitedField: true }),
    );
  const assessable =
    evaluateMarrowMyeloproliferativePatternCriticality(
      expansionCase({ limitedField: false }),
    );

  assert.equal(limited.severityScore, assessable.severityScore);
  assert.equal(limited.severityLevel, assessable.severityLevel);
  assert.equal(limited.limitedField, true);
  assert.equal(assessable.limitedField, false);
});

test("PASS 3 — diagnostic confidence remains conservative while criticality rises", () => {
  const out =
    applyMarrowMyeloproliferativePatternCriticality(
      expansionCase(),
    );

  assert.equal(
    out.confidenceAnalysis.confidenceHierarchy.diagnosticLevel,
    20,
  );
  assert.equal(out.confidenceAnalysis.globalConfidenceScore, 58);
  assert.equal(out.confidenceAnalysis.hematologicRisk.level, "critical");
  assert.ok(out.confidenceAnalysis.hematologicRisk.score >= 85);
  assert.equal(
    out.confidenceAnalysis.calibration
      .limitedFieldDoesNotDowngradePositiveMorphologySeverity,
    true,
  );
});

test("PASS 4 — morphology class is preserved while riskLevel becomes proportional", () => {
  const out =
    applyMarrowMyeloproliferativePatternCriticality(
      expansionCase(),
    );

  assert.equal(
    out.finalClassification,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
  assert.equal(
    out.morphologicRiskClass,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
  assert.match(out.riskLevel, /CRITICIDADE MUITO ALTA/);
  assert.equal(out.clinicalCriticality.level, "CRITICAL");
});

test("PASS 5 — high-salience pattern opens conditional myeloproliferative/BCR::ABL1 correlation gate", () => {
  const out =
    applyMarrowMyeloproliferativePatternCriticality(
      expansionCase(),
    );

  assert.equal(
    out.marrowMyeloproliferativePatternCorrelation
      .myeloproliferativePatternSupported,
    true,
  );
  assert.equal(
    out.marrowMyeloproliferativePatternCorrelation
      .bcrAbl1RecommendationGate,
    "CONSIDER_IF_CLINICOLABORATORY_CONTEXT_CORROBORATES",
  );
  assert.match(
    out.structuredReport.recommendation,
    /BCR::ABL1/,
  );
});

test("PASS 6 — 005.49 never diagnoses CML from morphology alone", () => {
  const out =
    applyMarrowMyeloproliferativePatternCriticality(
      expansionCase(),
    );

  assert.equal(
    out.marrowMyeloproliferativePatternCorrelation
      .morphologyOnlyDiagnosisAllowed,
    false,
  );
  assert.equal(
    out.marrowMyeloproliferativePatternCorrelation.cmlDiagnosisEmitted,
    false,
  );
  assert.match(
    out.structuredReport.recommendation,
    /não pode ser feita pela imagem isolada/i,
  );
});

test("PASS 7 — milder expansion is not automatically critical or molecularly escalated", () => {
  const result = expansionCase({
    expansionScore: 4,
    erythroidReduction: false,
    basophil: false,
  });
  result.marrowMyeloidExpansionDiscrimination.expansionSignals
    .leftShiftedMaturationSpectrum = false;
  result.marrowMyeloidExpansionDiscrimination.expansionSignals
    .denseMyeloidField = false;
  result.marrowMyeloidExpansionDiscrimination.expansionSignals
    .numerousGranulocyticPrecursors = false;

  const out =
    applyMarrowMyeloproliferativePatternCriticality(result);

  assert.notEqual(out.clinicalCriticality?.level, "CRITICAL");
  assert.equal(
    out.marrowMyeloproliferativePatternCorrelation
      .bcrAbl1RecommendationGate,
    "NOT_TRIGGERED",
  );
});

test("PASS 8 — true structured blastoid authority outranks 005.49 expansion calibration", () => {
  const result = expansionCase();
  result.finalMarrowAuthority.structuredBlast = {
    observed: true,
    suspicious: true,
    structured: true,
  };
  result.marrowBlastPopulationEvidence = {
    observedPopulation: true,
    suspiciousPopulation: true,
  };

  const out =
    applyMarrowMyeloproliferativePatternCriticality(result);

  assert.equal(out.marrowMyeloproliferativePatternCorrelation.active, false);
  assert.equal(out.riskLevel, result.riskLevel);
  assert.equal(out.clinicalCriticality, undefined);
});

test("PASS 9 — server applies 005.49 after 005.46 and before CRA with runtime fingerprints", async () => {
  const server = await readFile(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

  const p46 =
    server.indexOf(
      "BE-FIX-005.46 — FINAL MARROW AUTHORITY / POST-LEGACY RECONCILIATION",
    );
  const p49 =
    server.indexOf(
      "BE-FIX-005.49 — MARROW MYELOPROLIFERATIVE PATTERN / SEVERITY-CRITICALITY",
    );
  const cra =
    server.indexOf(
      "CRA-001.1 — CANONICAL CLINICAL TRUTH FOUNDATION",
      p49,
    );

  assert.ok(p46 >= 0);
  assert.ok(p49 > p46);
  assert.ok(cra > p49);

  assert.match(
    server,
    /marrowMyeloproliferativePatternCorrelationVersion/,
  );
  assert.match(
    server,
    /marrowSeverityCriticalityCalibrationVersion/,
  );
  assert.match(
    server,
    /marrowConfidenceCriticalityAxisSeparationVersion/,
  );
  assert.match(
    server,
    /marrowBcrAbl1RecommendationGateVersion/,
  );
});
