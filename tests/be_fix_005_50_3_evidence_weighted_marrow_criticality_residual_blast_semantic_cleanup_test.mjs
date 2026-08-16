import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyMarrowMyeloproliferativePatternCriticality,
  evaluateMarrowMyeloproliferativePatternCriticality,
  MARROW_EVIDENCE_WEIGHTED_CRITICALITY_VERSION,
  MARROW_CORE_MYELOID_SALIENCE_CALIBRATION_VERSION,
} from "../ai/boneMarrow/marrowMyeloproliferativePatternCriticalityEngine.js";

import {
  applyMarrowResidualBlastSemanticCleanup,
  evaluateMarrowResidualBlastSemanticCleanup,
  MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
  MARROW_IMMATURITY_MATURATION_SEMANTIC_SEPARATION_VERSION,
} from "../ai/boneMarrow/marrowResidualBlastSemanticCleanupEngine.js";

function goldenLmcMorphology() {
  return {
    finalClassification: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    morphologicRiskClass: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    finalMarrowAuthority: {
      protectedExpansion: true,
      structuredBlast: {
        observed: false,
        suspicious: false,
        structured: false,
        evidenceState: "NOT_ASSESSABLE",
      },
    },
    marrowPathologicMaturationContinuumLock: {
      active: true,
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      blastoidPopulationSupported: false,
    },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      expansionScore: 7,
      immatureCellBurden: "multiple",
      maturationContinuum: true,
      structuredMaturationPresent: true,
      matureFormsPresent: true,
      broadMaturationSpectrum: true,
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
        erythroidRelativeReduction: false,
        basophilEosinophilEnrichment: false,
        denseMyeloidField: true,
      },
      blastArchitecture: {
        evidenceState:
          "POSITIVE_MORPHOLOGIC_SUSPICION_FOR_REPEATED_IMMATURE_BLASTOID_CELLS",
        distinct: false,
        coherent: false,
        repeated: true,
        monomorphic: false,
        architectureScore: 1,
        structuredPathologicSubset: false,
      },
      structuredPathologicSubset: false,
    },
    findings: {
      blastSuspicion: true,
      immatureCells: true,
      blastEvidenceState:
        "POSITIVE_MORPHOLOGIC_SUSPICION_FOR_REPEATED_IMMATURE_BLASTOID_CELLS",
      myeloidExpansionPattern: true,
    },
    blastAssessment: {
      evidenceState:
        "POSITIVE_MORPHOLOGIC_SUSPICION_FOR_REPEATED_IMMATURE_BLASTOID_CELLS",
      approximateBlastLikeCells: 0,
      globalAbsenceAllowed: false,
    },
    marrowBlastPopulationEvidence: {
      evidenceState:
        "POSITIVE_MORPHOLOGIC_SUSPICION_FOR_REPEATED_IMMATURE_BLASTOID_CELLS",
      suspiciousPopulation: true,
      observedPopulation: false,
      structuredPathologicSubset: false,
    },
    localMorphologyEvidence: {
      marrow: {
        blastPopulationEvidence: {
          evidenceState:
            "POSITIVE_MORPHOLOGIC_SUSPICION_FOR_REPEATED_IMMATURE_BLASTOID_CELLS",
          suspiciousPopulation: true,
          observedPopulation: false,
          positive: true,
          repeated: true,
          approximateBlastLikeCells: 0,
        },
      },
    },
    fieldAdequacy: {
      visibleLeukocytes: 3,
      limitedField: true,
      adequateForPopulationAssessment: false,
      adequateForBlastScreening: false,
      globalNegativeExclusionAllowed: false,
    },
    marrowAdequacyMorphologyAxis: {
      morphologyClassification:
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      limitedField: true,
    },
    globalPattern: {
      dominantPattern: "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      marrowPositiveBlastEvidence: true,
      blastAssessmentIndeterminate: true,
    },
    confidenceAnalysis: {
      globalConfidenceScore: 58,
      confidenceHierarchy: {
        morphologyLevel: 62,
        diagnosticLevel: 20,
        global: 58,
      },
      hematologicRisk: { level: "moderate", score: 45 },
      calibration: { limitedFieldLock: true },
    },
    overallAssessment: { requiresHumanReview: true },
    structuredReport: {},
  };
}

test("PASS 0 — 005.50.3 identities are registered", () => {
  assert.equal(MARROW_EVIDENCE_WEIGHTED_CRITICALITY_VERSION, "BE-FIX-005.50.3");
  assert.equal(MARROW_CORE_MYELOID_SALIENCE_CALIBRATION_VERSION, "BE-FIX-005.50.3");
  assert.equal(MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION, "BE-FIX-005.50.3");
  assert.equal(MARROW_IMMATURITY_MATURATION_SEMANTIC_SEPARATION_VERSION, "BE-FIX-005.50.3");
});

test("PASS 1 — real-world score-7 complete core morphology is recognized as critical after residual cleanup", () => {
  const cleaned = applyMarrowResidualBlastSemanticCleanup(goldenLmcMorphology());
  const decision = evaluateMarrowMyeloproliferativePatternCriticality(cleaned);

  assert.equal(cleaned.marrowResidualBlastSemanticCleanup.active, true);
  assert.equal(decision.coreMyeloidSignalCount, 7);
  assert.equal(decision.completeCoreMyeloidSignature, true);
  assert.equal(decision.highSalienceCriticalSignature, true);
  assert.equal(decision.severityLevel, "CRITICAL");
  assert.ok(decision.severityScore >= 85);
});

test("PASS 2 — optional erythroid/basophil modifiers are not mandatory for critical morphology", () => {
  const cleaned = applyMarrowResidualBlastSemanticCleanup(goldenLmcMorphology());
  const decision = evaluateMarrowMyeloproliferativePatternCriticality(cleaned);

  assert.equal(decision.evidence.erythroidRelativeReduction, false);
  assert.equal(decision.evidence.basophilEosinophilEnrichment, false);
  assert.equal(decision.highSalienceSupportiveModifiers, 0);
  assert.equal(decision.severityLevel, "CRITICAL");
});

test("PASS 3 — semantic cleanup clears stale population blast suspicion but preserves immature cytology provenance", () => {
  const cleaned = applyMarrowResidualBlastSemanticCleanup(goldenLmcMorphology());

  assert.equal(cleaned.findings.blastSuspicion, false);
  assert.equal(cleaned.findings.immatureCells, false);
  assert.equal(
    cleaned.findings.blastEvidenceState,
    "IMMATURE_CYTOLOGY_WITHIN_PATHOLOGIC_MYELOID_MATURATION",
  );
  assert.equal(
    cleaned.marrowBlastPopulationEvidence.suspiciousPopulation,
    false,
  );
  assert.equal(
    cleaned.localMorphologyEvidence.marrow.blastPopulationEvidence
      .residualImmatureCytologyPreserved,
    true,
  );
  assert.equal(cleaned.marrowResidualBlastSemanticCleanup.cytologyPreserved, true);
});

test("PASS 4 — cleanup never fabricates global blast-negative exclusion", () => {
  const cleaned = applyMarrowResidualBlastSemanticCleanup(goldenLmcMorphology());

  assert.equal(
    cleaned.marrowResidualBlastSemanticCleanup.globalBlastNegativeExclusionAllowed,
    false,
  );
  assert.equal(cleaned.blastAssessment.globalAbsenceAllowed, false);
  assert.equal(cleaned.globalPattern.globalBlastNegativeExclusionAllowed, false);
});

test("PASS 5 — true structured suspicious blast population outranks cleanup and expansion criticality", () => {
  const input = goldenLmcMorphology();
  input.finalMarrowAuthority.structuredBlast = {
    observed: false,
    suspicious: true,
    structured: true,
    evidenceState: "SUSPICIOUS_POPULATION",
  };
  input.marrowBlastPopulationEvidence = {
    evidenceState: "SUSPICIOUS_POPULATION",
    suspiciousPopulation: true,
    observedPopulation: false,
    structuredPathologicSubset: true,
  };
  input.marrowMyeloidExpansionDiscrimination.blastArchitecture = {
    evidenceState: "SUSPICIOUS_POPULATION",
    distinct: true,
    coherent: true,
    repeated: true,
    monomorphic: true,
    architectureScore: 4,
    structuredPathologicSubset: true,
  };

  const cleanupDecision = evaluateMarrowResidualBlastSemanticCleanup(input);
  const cleaned = applyMarrowResidualBlastSemanticCleanup(input);
  const criticality = evaluateMarrowMyeloproliferativePatternCriticality(cleaned);

  assert.equal(cleanupDecision.active, false);
  assert.equal(cleaned.findings.blastSuspicion, true);
  assert.equal(criticality.active, false);
  assert.notEqual(criticality.severityLevel, "CRITICAL");
});

test("PASS 6 — incomplete core morphology does not become critical merely because score is near threshold", () => {
  const input = goldenLmcMorphology();
  input.findings.blastSuspicion = false;
  input.findings.immatureCells = false;
  input.findings.blastEvidenceState = "NOT_ASSESSABLE";
  input.marrowBlastPopulationEvidence.suspiciousPopulation = false;
  input.marrowBlastPopulationEvidence.evidenceState = "NOT_ASSESSABLE";
  input.localMorphologyEvidence.marrow.blastPopulationEvidence.suspiciousPopulation = false;
  input.localMorphologyEvidence.marrow.blastPopulationEvidence.evidenceState = "NOT_ASSESSABLE";
  input.marrowMyeloidExpansionDiscrimination.expansionSignals.denseMyeloidField = false;

  const decision = evaluateMarrowMyeloproliferativePatternCriticality(input);
  assert.equal(decision.completeCoreMyeloidSignature, false);
  assert.notEqual(decision.severityLevel, "CRITICAL");
});

test("PASS 7 — limited field keeps diagnostic confidence conservative while morphology becomes critical", () => {
  const cleaned = applyMarrowResidualBlastSemanticCleanup(goldenLmcMorphology());
  const out = applyMarrowMyeloproliferativePatternCriticality(cleaned);

  assert.equal(out.clinicalCriticality.level, "CRITICAL");
  assert.equal(out.clinicalCriticality.adequacyIndependent, true);
  assert.equal(out.confidenceAnalysis.confidenceHierarchy.diagnosticLevel, 20);
  assert.equal(out.fieldAdequacy.limitedField, true);
});

test("PASS 8 — 005.50.3 remains morphology-only and never diagnoses CML", () => {
  const cleaned = applyMarrowResidualBlastSemanticCleanup(goldenLmcMorphology());
  const out = applyMarrowMyeloproliferativePatternCriticality(cleaned);

  assert.equal(out.marrowMyeloproliferativePatternCorrelation.morphologyOnlyDiagnosisAllowed, false);
  assert.equal(out.marrowMyeloproliferativePatternCorrelation.cmlDiagnosisEmitted, false);
  assert.equal(
    out.marrowMyeloproliferativePatternCorrelation.bcrAbl1RecommendationGate,
    "CONSIDER_IF_CLINICOLABORATORY_CONTEXT_CORROBORATES",
  );
});

test("PASS 9 — server applies cleanup after 005.46 and before 005.49/CRA and exposes 005.50.3 fingerprints", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  const authority = server.indexOf("BE-FIX-005.46 — FINAL MARROW AUTHORITY / POST-LEGACY RECONCILIATION");
  const cleanup = server.indexOf("BE-FIX-005.50.3 — RESIDUAL BLAST SEMANTIC CLEANUP");
  const criticality = server.indexOf("BE-FIX-005.49 — MARROW MYELOPROLIFERATIVE PATTERN / SEVERITY-CRITICALITY");
  const cra = server.indexOf("attachClinicalResultV2");

  assert.ok(authority >= 0);
  assert.ok(cleanup > authority);
  assert.ok(criticality > cleanup);
  assert.ok(cra >= 0);
  assert.match(server, /marrowEvidenceWeightedCriticalityVersion/);
  assert.match(server, /marrowCoreMyeloidSalienceCalibrationVersion/);
  assert.match(server, /marrowResidualBlastSemanticCleanupVersion/);
  assert.match(server, /marrowImmaturityMaturationSemanticSeparationVersion/);
  assert.match(server, /terminalClinicalCriticalityAuthorityVersion:\s*\n\s*"BE-FIX-005\.50\.3"/);
});
