import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateFieldAdequacy,
  BLAST_ASSESSABILITY_GATE_VERSION,
} from "../ai/fieldAdequacyEngine.js";
import {
  createLocalMorphologyEvidence,
} from "../ai/localMorphologyEvidenceContract.js";
import {
  applySingleBlastSentinel,
} from "../ai/singleBlastSentinel.js";
import {
  evaluateReactiveLymphoidEvidence,
  applyReactiveLymphoidEvidenceSentinel,
} from "../ai/reactiveLymphoidEvidenceSentinel.js";
import {
  analyzeGlobalPattern,
} from "../ai/globalPatternEngine.js";

test("PASS 0 — 005.16 blast assessability gate is registered", () => {
  assert.equal(BLAST_ASSESSABILITY_GATE_VERSION, "BE-FIX-005.16");
});

test("PASS 1 — visible leukocytes alone never authorize negative blast screening", () => {
  const a = evaluateFieldAdequacy({
    fieldAdequacy: { visibleLeukocytes: 6 },
  });
  assert.equal(a.visibleLeukocytes, 6);
  assert.equal(a.adequateForBlastScreening, false);
  assert.equal(a.blastAssessability.state, "NOT_ASSESSABLE");
});

test("PASS 2 — explicit model false for blast screening is preserved", () => {
  const a = evaluateFieldAdequacy({
    fieldAdequacy: {
      visibleLeukocytes: 6,
      adequateForBlastScreening: false,
      limitationReason:
        "Resolução insuficiente para detalhes nucleares finos; nucléolos não avaliáveis.",
    },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      leukocytes: {
        chromatin: "cromatina parcialmente visível",
        nucleoli: "não avaliáveis",
        ncRatio: "não avaliável",
      },
    },
  });
  assert.equal(a.adequateForBlastScreening, false);
  assert.equal(a.blastAssessability.negativeBlastConclusionAllowed, false);
});

test("PASS 3 — evaluable detailed nuclear morphology can authorize field-scoped negative", () => {
  const a = evaluateFieldAdequacy({
    fieldAdequacy: { visibleLeukocytes: 4 },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      leukocytes: {
        chromatin: "cromatina condensada e bem definida",
        nucleoli: "nucléolos não proeminentes, avaliáveis",
        ncRatio: "relação N:C baixa a intermediária",
      },
    },
  });
  assert.equal(a.adequateForBlastScreening, true);
  assert.equal(a.blastAssessability.state, "EVALUABLE");
});

test("PASS 4 — LME converts false blast flag to NOT_ASSESSABLE when field is not blast-assessable", () => {
  const lme = createLocalMorphologyEvidence({
    visionResponse: {
      fieldAdequacy: {
        visibleLeukocytes: 6,
        adequateForBlastScreening: false,
      },
      findings: { blastSuspicion: false },
      localMorphologyEvidence: {
        leukocytes: { description: "Células mononucleares visíveis." },
      },
    },
  });
  assert.equal(lme.criticalMorphology.blastLikeMorphology, "NOT_ASSESSABLE");
  assert.equal(
    lme.criticalMorphology.blastAssessability.negativeBlastConclusionAllowed,
    false,
  );
});

test("PASS 5 — positive blast signal remains critical even when assessability is limited", () => {
  const r = applySingleBlastSentinel({
    fieldAdequacy: {
      adequateForBlastScreening: false,
      blastAssessability: { adequateForBlastScreening: false },
    },
    localMorphologyEvidence: {
      criticalMorphology: { blastLikeMorphology: "OBSERVED" },
    },
  });
  assert.equal(r.singleBlastSentinel.active, true);
  assert.equal(r.finalClassification, "CLASS_4_BLAST_SUSPICION");
});

test("PASS 6 — no positive blast plus non-assessable field blocks reassuring normality", () => {
  const r = applySingleBlastSentinel({
    fieldAdequacy: {
      adequateForBlastScreening: false,
      blastAssessability: { adequateForBlastScreening: false },
    },
    localMorphologyEvidence: {
      criticalMorphology: { blastLikeMorphology: "NOT_ASSESSABLE" },
    },
  });
  assert.equal(r.singleBlastSentinel.active, false);
  assert.equal(r.singleBlastSentinel.negativeEvidenceState, "NOT_ASSESSABLE");
  assert.equal(r.normalityBlocked, true);
  assert.equal(r.requiresHumanReview, true);
});

test("PASS 7 — reactive morphology is not promoted to reactive population when blast exclusion is non-assessable", () => {
  const base = {
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      adequateForBlastScreening: false,
      blastAssessability: { adequateForBlastScreening: false },
    },
    rawResponse: {
      findings: { reactiveLymphocytes: true },
      visualEvidence: {
        abundantBasophilicCytoplasm: true,
        erythrocyteMolding: true,
        cellSizeIncrease: true,
      },
    },
    findings: {
      reactiveLymphocytes: true,
      atypicalLymphocytes: true,
    },
  };

  const e = evaluateReactiveLymphoidEvidence(structuredClone(base));
  assert.equal(e.reactivePatternSupported, true);
  assert.equal(e.blastAssessable, false);
  assert.equal(e.reactiveClassificationAllowed, false);

  const r = applyReactiveLymphoidEvidenceSentinel(structuredClone(base));
  assert.equal(r.reactiveLymphoidPattern, false);
  assert.equal(r.requiresHumanReview, true);
  assert.equal(r.blastAssessabilityReactiveGate.active, true);
});

test("PASS 8 — global pattern remains indeterminate instead of falsely reassuring reactive", () => {
  const r = analyzeGlobalPattern({
    fieldAdequacy: {
      adequateForBlastScreening: false,
      blastAssessability: { adequateForBlastScreening: false },
    },
    rawResponse: {
      findings: { reactiveLymphocytes: true },
      visualEvidence: { abundantBasophilicCytoplasm: true },
    },
    findings: {
      reactiveLymphocytes: true,
      atypicalLymphocytes: true,
    },
  });
  assert.equal(
    r.dominantPattern,
    "ATYPICAL_MONONUCLEAR_PATTERN_BLAST_ASSESSMENT_INDETERMINATE",
  );
  assert.equal(r.blastAssessmentIndeterminate, true);
});

test("PASS 9 — evaluable negative remains a legal field-scoped negative", () => {
  const lme = createLocalMorphologyEvidence({
    visionResponse: {
      fieldAdequacy: {
        visibleLeukocytes: 5,
        adequateForBlastScreening: true,
      },
      findings: { blastSuspicion: false },
      localMorphologyEvidence: {
        leukocytes: {
          description: "Leucócitos avaliáveis.",
          chromatin: "condensada",
          nucleoli: "não proeminentes",
          ncRatio: "baixo a intermediário",
        },
      },
    },
  });
  assert.equal(
    lme.criticalMorphology.blastLikeMorphology,
    "NOT_OBSERVED_IN_EVALUABLE_FIELD",
  );
});
