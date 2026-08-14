import test from "node:test";
import assert from "node:assert/strict";

import {
  buildClinicalResultCoherenceProjection,
  CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
  CRITICAL_BLAST_PRESENTATION_GOVERNANCE_VERSION,
} from "../ai/clinicalResultV2/clinicalResultCoherenceEngine.js";
import { buildExpertHematologyNarrative } from "../ai/clinicalResultV2/expertHematologyNarrative.js";
import {
  ClinicalEvidenceState,
  ClinicalSeverity,
} from "../ai/clinicalResultV2/clinicalEvidenceState.js";

function truthForBlast(state, { limitedField = true } = {}) {
  return {
    criticalFindings: {
      blastLike: {
        state,
        confidence: 0.82,
        evidence: ["Elemento com morfologia blástica/blastoide."],
        requiresReview: true,
        severity:
          state === ClinicalEvidenceState.OBSERVED
            ? ClinicalSeverity.CRITICAL
            : ClinicalSeverity.HIGH,
        observedCount: state === ClinicalEvidenceState.OBSERVED ? 1 : null,
      },
      auerRods: { state: ClinicalEvidenceState.INDETERMINATE },
      schistocytes: { state: ClinicalEvidenceState.INDETERMINATE },
      parasites: { state: ClinicalEvidenceState.NOT_ASSESSABLE },
    },
    parasiteArtifact: {
      parasite: { state: ClinicalEvidenceState.NOT_ASSESSABLE },
    },
    patternInterpretation: {},
    morphologySignals: {},
    scope: {
      limitedField,
      populationInferenceAllowed: !limitedField,
      globalNegativeExclusionAllowed: false,
    },
    risk: {
      severity:
        state === ClinicalEvidenceState.OBSERVED
          ? ClinicalSeverity.CRITICAL
          : ClinicalSeverity.HIGH,
    },
    // Deliberately stale/legacy priority to prove CRITICAL cannot be downgraded.
    review: { required: true, urgency: "PRIORITY" },
    quality: { confidence: 0.82 },
    lineages: {},
  };
}

test("PASS 0 — 005.18 presentation governance is registered without changing CRCE identity", () => {
  assert.equal(CLINICAL_RESULT_COHERENCE_ENGINE_VERSION, "CRCE-1.7");
  assert.equal(CRITICAL_BLAST_PRESENTATION_GOVERNANCE_VERSION, "BE-FIX-005.18");
});

test("PASS 1 — one observed blast is CRITICAL even in a limited field", () => {
  const truth = truthForBlast(ClinicalEvidenceState.OBSERVED, { limitedField: true });
  const narrative = buildExpertHematologyNarrative(truth, {});
  const p = buildClinicalResultCoherenceProjection(truth, narrative);

  assert.equal(p.morphologyClass.code, "CRITICAL_BLAST_LIKE_FINDING");
  assert.equal(p.riskTier.level, "CRITICAL");
  assert.equal(p.reviewStatus.urgency, "URGENT");
  assert.equal(p.reviewStatus.label, "Revisão urgente");
});

test("PASS 2 — limited representativity never leads the confirmed-blast executive conclusion", () => {
  const truth = truthForBlast(ClinicalEvidenceState.OBSERVED, { limitedField: true });
  const narrative = buildExpertHematologyNarrative(truth, {});
  const p = buildClinicalResultCoherenceProjection(truth, narrative);

  assert.match(p.executiveConclusion, /^ALERTA HEMATOLÓGICO CRÍTICO:/i);
  assert.match(p.executiveConclusion, /blasto\/blastoide observado/i);
  assert.match(p.executiveConclusion, /(representatividade limitada|limitação de representatividade).*não invalida/i);
  assert.match(p.executiveConclusion, /revisão hematológica urgente/i);
});

test("PASS 3 — confirmed blast has absolute clinical priority in presentation governance", () => {
  const truth = truthForBlast(ClinicalEvidenceState.OBSERVED, { limitedField: true });
  const narrative = buildExpertHematologyNarrative(truth, {});
  const p = buildClinicalResultCoherenceProjection(truth, narrative);

  assert.equal(
    p.presentationGovernance.criticalBlastPresentationGovernanceVersion,
    "BE-FIX-005.18",
  );
  assert.equal(p.presentationGovernance.clinicalPriority, "CRITICAL_BLAST_CONFIRMED");
  assert.match(p.presentationGovernance.slideJudgement, /^ALERTA HEMATOLÓGICO CRÍTICO:/i);
});

test("PASS 4 — expert narrative makes confirmed blast urgent, not merely priority review", () => {
  const truth = truthForBlast(ClinicalEvidenceState.OBSERVED, { limitedField: true });
  const narrative = buildExpertHematologyNarrative(truth, {});

  assert.match(narrative.executiveSynthesis, /^ALERTA HEMATOLÓGICO CRÍTICO:/i);
  assert.match(narrative.executiveSynthesis, /revisão hematológica urgente/i);
  assert.match(narrative.priorityFindings.join(" "), /um único elemento positivo/i);
  assert.doesNotMatch(narrative.executiveSynthesis, /^Campo de representatividade limitada/i);
});

test("PASS 5 — suspicion remains HIGH/PRIORITY and is never upgraded to confirmed critical blast", () => {
  const truth = truthForBlast(ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE, {
    limitedField: true,
  });
  const narrative = buildExpertHematologyNarrative(truth, {});
  const p = buildClinicalResultCoherenceProjection(truth, narrative);

  assert.equal(p.morphologyClass.code, "SUSPICIOUS_BLAST_LIKE_FINDING");
  assert.equal(p.riskTier.level, "HIGH");
  assert.equal(p.reviewStatus.urgency, "PRIORITY");
  assert.equal(p.presentationGovernance.clinicalPriority, "BLAST_SUSPICION_PRIORITY");
  assert.doesNotMatch(p.executiveConclusion, /^ALERTA HEMATOLÓGICO CRÍTICO:/i);
});

test("PASS 6 — confirmed blast interpretation explicitly states that limited field cannot erase the positive finding", () => {
  const truth = truthForBlast(ClinicalEvidenceState.OBSERVED, { limitedField: true });
  const narrative = buildExpertHematologyNarrative(truth, {});
  const p = buildClinicalResultCoherenceProjection(truth, narrative);

  assert.match(p.integratedInterpretation, /prioridade clínica absoluta/i);
  assert.match(p.integratedInterpretation, /não pode rebaixar ou apagar o achado observado/i);
});
