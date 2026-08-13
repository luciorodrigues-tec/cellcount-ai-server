import test from "node:test";
import assert from "node:assert/strict";
import {
  ClinicalEvidenceState,
  buildClinicalResultCoherenceProjection,
  CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
  buildCanonicalClinicalTruth,
} from "../ai/clinicalResultV2/index.js";

function truth(overrides = {}) {
  return {
    scope: { limitedField: true, populationInferenceAllowed: false, globalNegativeExclusionAllowed: false },
    criticalFindings: {
      blastLike: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
      auerRods: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
      schistocytes: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
      parasites: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
    },
    parasiteArtifact: {
      parasite: { state: ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD },
      parasiteSuspicionAllowed: false,
      artifactLikelihood: "FAVORED",
    },
    patternInterpretation: {
      reactiveLymphoid: { supported: false },
      mononucleosisPattern: { supported: false },
      clonalityConcern: { supported: false },
    },
    lineages: {
      erythrocytes: { assessment: { state: ClinicalEvidenceState.OBSERVED }, description: "Contornos crenados em parte das hemácias visíveis." },
      leukocytes: { assessment: { state: ClinicalEvidenceState.OBSERVED }, description: "Célula mononuclear grande isolada, sem padrão populacional sustentado." },
      platelets: { assessment: { state: ClinicalEvidenceState.NOT_ASSESSABLE }, description: "Avaliação plaquetária limitada." },
    },
    risk: { severity: "REVIEW" },
    review: { required: true, urgency: "RECOMMENDED" },
    ...overrides,
  };
}
const narrative = {
  executiveSynthesis: "Avaliação morfológica de campo limitado, sem promoção de achados além da evidência disponível.",
  priorityFindings: ["Estrutura incomum favorecendo artefato; sem base estruturada para hemoparasita."],
  integratedInterpretation: "Campo limitado para inferência populacional.",
  qualityAndConfidence: "Representatividade limitada.",
  recommendedNextSteps: ["Revisão microscópica por profissional habilitado."],
};

test("PASS 0 — CRCE version registered", () => assert.equal(CLINICAL_RESULT_COHERENCE_ENGINE_VERSION, "CRCE-1.4"));
test("PASS 1 — artifact cannot promote parasite", () => {
  const p = buildClinicalResultCoherenceProjection(truth(), narrative);
  assert.equal(p.criticalFindings.parasiteSuspicionAllowed, false);
  assert.equal(p.criticalFindings.parasites, "NOT_OBSERVED_IN_EVALUABLE_FIELD");
});
test("PASS 2 — atypical isolated cell does not become reactive pattern", () => {
  const p = buildClinicalResultCoherenceProjection(truth(), narrative);
  assert.equal(p.patternInterpretation.reactiveLymphoidSupported, false);
  assert.equal(p.patternInterpretation.mononucleosisPatternSupported, false);
});
test("PASS 3 — limited field remains limited despite positive local morphology", () => {
  const p = buildClinicalResultCoherenceProjection(truth(), narrative);
  assert.equal(p.scope.limitedField, true);
  assert.equal(p.scope.populationInferenceAllowed, false);
});
test("PASS 4 — lineage descriptions come from canonical truth", () => {
  const p = buildClinicalResultCoherenceProjection(truth(), narrative);
  assert.match(p.lineages.erythrocytes.description, /crenados/i);
  assert.doesNotMatch(p.lineages.erythrocytes.description, /normocíticas e normocrômicas/i);
});
test("PASS 5 — critical negatives use one global qualifier", () => {
  const p = buildClinicalResultCoherenceProjection(truth(), narrative);
  assert.equal(p.criticalNegatives.items.length, 4);
  assert.match(p.criticalNegatives.qualifier, /não permite exclusão global/i);
});
test("PASS 6 — one blast becomes critical classification", () => {
  const t = truth();
  t.criticalFindings.blastLike = { state: ClinicalEvidenceState.OBSERVED };
  const p = buildClinicalResultCoherenceProjection(t, narrative);
  assert.equal(p.classification.code, "CRITICAL_BLAST_LIKE_FINDING");
  assert.equal(p.classification.severity, "CRITICAL");
});
test("PASS 7 — structured parasite OBSERVED remains allowed", () => {
  const t = truth();
  t.parasiteArtifact = { parasite: { state: ClinicalEvidenceState.OBSERVED }, parasiteSuspicionAllowed: true, artifactLikelihood: "NOT_FAVORED" };
  t.criticalFindings.parasites = { state: ClinicalEvidenceState.OBSERVED };
  const p = buildClinicalResultCoherenceProjection(t, narrative);
  assert.equal(p.criticalFindings.parasiteSuspicionAllowed, true);
  assert.equal(p.classification.code, "STRUCTURED_PARASITE_EVIDENCE");
});


test("PASS 8 — focal mononuclear atypia is not promoted to reactive pattern", () => {
  const t = truth({
    morphologySignals: {
      focalMononuclearAtypia: true,
      atypicalLymphocytesObserved: true,
      largeMononuclearCellsObserved: true,
    },
  });
  const p = buildClinicalResultCoherenceProjection(t, narrative);
  assert.equal(p.morphologyClass.code, "FOCAL_MONONUCLEAR_ATYPIA");
  assert.equal(p.patternInterpretation.reactiveLymphoidSupported, false);
  assert.match(p.executiveConclusion, /atipia mononuclear focal/i);
  assert.doesNotMatch(p.executiveConclusion, /padrão linfoide reacional sustentado/i);
});

test("PASS 9 — morphology, risk, representativity and review are independent axes", () => {
  const t = truth({
    morphologySignals: { focalMononuclearAtypia: true },
  });
  const p = buildClinicalResultCoherenceProjection(t, narrative);
  assert.equal(p.morphologyClass.code, "FOCAL_MONONUCLEAR_ATYPIA");
  assert.equal(p.riskTier.level, "REVIEW");
  assert.equal(p.riskTier.colorToken, "YELLOW");
  assert.equal(p.representativity.level, "LIMITED");
  assert.equal(p.reviewStatus.required, true);
});

test("PASS 10 — limited field can never render green low-risk presentation", () => {
  const p = buildClinicalResultCoherenceProjection(truth(), narrative);
  assert.equal(p.scope.limitedField, true);
  assert.equal(p.riskTier.level, "REVIEW");
  assert.equal(p.riskTier.colorToken, "YELLOW");
});

test("PASS 11 — canonical narrative is compressed and avoids legacy risk-label conflation", () => {
  const t = truth({
    morphologySignals: { focalMononuclearAtypia: true },
  });
  const p = buildClinicalResultCoherenceProjection(t, narrative);
  assert.notEqual(p.morphologyClass.label, p.riskTier.label);
  assert.ok(p.priorityFindings.length <= 3);
  assert.ok(p.recommendedNextSteps.length <= 4);
});


test("PASS 12 — governed reactive sentinel cannot be overridden by legacy reactive flags", () => {
  const canonical = buildCanonicalClinicalTruth({
    fieldAdequacy: { limitedField: true, populationInferenceAllowed: false },
    reactiveLymphoidEvidenceSentinel: {
      reactivePatternSupported: false,
      mononucleosisPatternSupported: false,
      evidence: [],
    },
    reactiveLymphoidPattern: true,
    mononucleosisSuspicion: true,
    lymphoidPatternAnalysis: { lymphoidPattern: "LYMPHOID_REACTIVE" },
    findings: { atypicalLymphocytes: true, largeMononuclearCells: true },
  });
  assert.equal(canonical.patternInterpretation.reactiveLymphoid.supported, false);
  assert.equal(canonical.patternInterpretation.mononucleosisPattern.supported, false);
});

test("PASS 13 — suspicious blast-like evidence is preserved and never rendered as negative", () => {
  const canonical = buildCanonicalClinicalTruth({
    fieldAdequacy: { limitedField: true, adequateForBlastScreening: true, visibleLeukocytes: 6 },
    findings: {
      atypicalLymphocytes: true,
      largeMononuclearCells: true,
      blastSuspicion: true,
      blastEvidenceState: "SUSPICIOUS_INDETERMINATE",
    },
    singleBlastSentinel: {
      active: true,
      certainty: "VISUAL_BLAST_SUSPICION",
      evidenceState: "SUSPICIOUS_INDETERMINATE",
    },
    requiresHumanReview: true,
  });
  assert.equal(canonical.criticalFindings.blastLike.state, ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE);
  assert.equal(canonical.criticalFindings.blastLike.requiresReview, true);
  const p = buildClinicalResultCoherenceProjection(canonical, narrative);
  assert.equal(p.criticalFindings.blastLike, "SUSPICIOUS_INDETERMINATE");
  assert.equal(p.morphologyClass.code, "SUSPICIOUS_BLAST_LIKE_FINDING");
  assert.equal(p.riskTier.level, "HIGH");
  assert.ok(!p.criticalNegatives.items.some((item) => /blasto/i.test(item)));
});

test("PASS 14 — explicit evaluable negative remains negative when no suspicion exists", () => {
  const canonical = buildCanonicalClinicalTruth({
    fieldAdequacy: { adequateForBlastScreening: true, visibleLeukocytes: 6 },
    findings: {
      blastSuspicion: false,
      blastEvidenceState: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    },
  });
  assert.equal(canonical.criticalFindings.blastLike.state, ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD);
});
