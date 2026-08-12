import test from "node:test";
import assert from "node:assert/strict";

import {
  CRA_001_1_VERSION,
  ClinicalEvidenceState,
  buildCanonicalClinicalTruth,
  validateCanonicalClinicalTruth,
  projectClinicalResultV2,
} from "../ai/clinicalResultV2/index.js";

function baseResult(overrides = {}) {
  return {
    analysisSource: "ai_visual",
    specimenType: "PERIPHERAL_BLOOD",
    fieldAdequacy: {
      visibleLeukocytes: 6,
      adequateForLeukocyteAnalysis: true,
      adequateForBlastScreening: true,
      adequateForPopulationAssessment: false,
      limitedField: true,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
      limitationReason: "Campo limitado.",
    },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: true,
      field: { description: "Campo periférico limitado." },
      erythrocytes: { description: "Hemácias visíveis no campo." },
      leukocytes: { description: "Seis células nucleadas visíveis." },
      platelets: { description: "Plaquetas dispersas." },
      positiveEvidence: [],
    },
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      atypicalLymphocytes: false,
      largeMononuclearCells: false,
      reactiveLymphocytes: false,
      parasiteSuspected: false,
    },
    overallAssessment: {
      requiresHumanReview: true,
    },
    normalityBlocked: true,
    blockNormalReason: ["Campo microscópico limitado"],
    confidenceAnalysis: {
      globalConfidenceScore: 68,
    },
    visualMorphologyEvidenceAcquisition: {
      complete: true,
    },
    ...overrides,
  };
}

test("PASS 0 — CRA-001.1 version is registered", () => {
  assert.equal(CRA_001_1_VERSION, "CRA-001.1");
});

test("PASS 1 — limited field never allows global negative exclusion", () => {
  const truth = buildCanonicalClinicalTruth(baseResult());
  assert.equal(truth.scope.limitedField, true);
  assert.equal(truth.scope.globalNegativeExclusionAllowed, false);
  assert.equal(validateCanonicalClinicalTruth(truth).valid, true);
});

test("PASS 2 — one positive blast-like signal forces critical review", () => {
  const truth = buildCanonicalClinicalTruth(baseResult({
    singleBlastSentinel: {
      triggered: true,
      observedCount: 1,
      confidence: 0.8,
      evidence: ["Uma célula com sinal blastoide."],
    },
  }));

  assert.equal(
    truth.criticalFindings.blastLike.state,
    ClinicalEvidenceState.OBSERVED,
  );
  assert.equal(truth.review.required, true);
  assert.equal(truth.review.urgency, "URGENT");
});

test("PASS 3 — blast not assessable is never converted to no blasts", () => {
  const truth = buildCanonicalClinicalTruth(baseResult({
    fieldAdequacy: {
      visibleLeukocytes: 0,
      adequateForLeukocyteAnalysis: false,
      adequateForBlastScreening: false,
      adequateForPopulationAssessment: false,
      limitedField: true,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: false,
    },
    findings: {},
  }));

  assert.equal(
    truth.criticalFindings.blastLike.state,
    ClinicalEvidenceState.NOT_ASSESSABLE,
  );
});

test("PASS 4 — artifact-favored unusual structure cannot promote parasite", () => {
  const truth = buildCanonicalClinicalTruth(baseResult({
    parasiteEvidenceAssessment: {
      explicitPositiveParasiteEvidence: false,
      artifactLikely: true,
      unusualStructureObserved: true,
      artifactEvidence: ["Reflexo/artefato óptico."],
    },
    findings: {
      parasiteSuspected: false,
      unusualStructureSuspected: true,
    },
  }));

  assert.notEqual(
    truth.parasiteArtifact.parasite.state,
    ClinicalEvidenceState.OBSERVED,
  );
  assert.equal(truth.parasiteArtifact.parasiteSuspicionAllowed, false);
  assert.equal(truth.parasiteArtifact.organismCandidate, null);
});

test("PASS 5 — explicit structured parasite evidence remains positive", () => {
  const truth = buildCanonicalClinicalTruth(baseResult({
    parasiteEvidenceAssessment: {
      explicitPositiveParasiteEvidence: true,
      artifactLikely: false,
      parasiteEvidence: ["Forma parasitária estruturada."],
    },
    findings: {
      parasiteSuspected: true,
    },
    parasiteAnalysis: {
      suspected: true,
      parasiteName: "Hemoparasita não definido",
    },
  }));

  assert.equal(
    truth.parasiteArtifact.parasite.state,
    ClinicalEvidenceState.OBSERVED,
  );
  assert.equal(truth.parasiteArtifact.parasiteSuspicionAllowed, true);
});

test("PASS 6 — large mononuclear cell alone does not establish reactive pattern", () => {
  const truth = buildCanonicalClinicalTruth(baseResult({
    findings: {
      largeMononuclearCells: true,
      atypicalLymphocytes: true,
      reactiveLymphocytes: false,
      blastSuspicion: false,
      parasiteSuspected: false,
    },
    reactiveLymphoidEvidenceAssessment: {
      reactivePatternSupported: false,
      mononucleosisPatternSupported: false,
    },
  }));

  assert.equal(
    truth.patternInterpretation.reactiveLymphoid.supported,
    false,
  );
  assert.equal(
    truth.patternInterpretation.mononucleosisPattern.supported,
    false,
  );
});

test("PASS 7 — mononucleosis cannot exist without supported reactive morphology", () => {
  const truth = buildCanonicalClinicalTruth(baseResult());
  truth.patternInterpretation.mononucleosisPattern.supported = true;
  truth.patternInterpretation.reactiveLymphoid.supported = false;

  const validation = validateCanonicalClinicalTruth(truth);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.some(
      (item) => item.code === "CCT_MONONUCLEOSIS_WITHOUT_REACTIVE_PATTERN",
    ),
  );
});

test("PASS 8 — projector produces the additive Clinical Result V2 contract", () => {
  const result = projectClinicalResultV2(baseResult());
  assert.equal(result.contract, "CELLCOUNT-CLINICAL-RESULT-2.0");
  assert.equal(result.validation.valid, true);
  assert.equal(typeof result.narrative.executiveSynthesis, "string");
  assert.ok(Array.isArray(result.narrative.recommendedNextSteps));
});

test("PASS 9 — narrative keeps artifact and parasite semantics separated", () => {
  const result = projectClinicalResultV2(baseResult({
    parasiteEvidenceAssessment: {
      explicitPositiveParasiteEvidence: false,
      artifactLikely: true,
      unusualStructureObserved: true,
    },
    findings: {
      parasiteSuspected: false,
      unusualStructureSuspected: true,
    },
  }));

  const narrative = result.narrative.priorityFindings.join(" ").toLowerCase();
  assert.match(narrative, /artefato/);
  assert.match(narrative, /não há base estruturada/);
});

test("PASS 10 — server integration is ordered after 005.15 and final negative rebuild", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

  const p15 = source.indexOf("applyReactiveLymphoidEvidenceSentinel");
  const pFinalNeg = source.lastIndexOf("applyFieldScopedNegativeFindings");
  const pCra = source.indexOf("attachClinicalResultV2(", pFinalNeg);

  assert.ok(p15 >= 0);
  assert.ok(pFinalNeg > p15);
  assert.ok(pCra > pFinalNeg);
});
