import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
  evaluateMarrowBlastPopulationEvidence,
  applyMarrowBlastPopulationGovernance,
} from "../ai/boneMarrow/marrowBlastPopulationSentinel.js";

import {
  enforceBoneMarrowOutputContract,
  MARROW_BLAST_POPULATION_CONTRACT_VERSION,
} from "../ai/boneMarrow/boneMarrowOutputContract.js";

import {
  applyBoneMarrowClinicalReasoning,
  MARROW_BLAST_POPULATION_REASONING_VERSION,
} from "../ai/boneMarrow/boneMarrowClinicalReasoningEngine.js";

const specimenGate = {
  specimenType: "BONE_MARROW_ASPIRATE",
  analysisType: "bone_marrow",
  reviewRequired: false,
  decision: { status: "accepted", effectiveType: "BONE_MARROW_ASPIRATE" },
};

function marrow(overrides = {}) {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    findings: {},
    blastAssessment: {
      status: "present",
      observed: true,
      evidenceState: "OBSERVED_POPULATION",
      approximateBlastLikeCells: 18,
      populationPattern: "dominant",
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        monomorphism: true,
        repeatedAcrossField: true,
      },
      summary: "Múltiplos elementos blastoides no campo medular.",
    },
    fieldAdequacy: { limitedField: true, adequateForPopulationAssessment: false },
    overallAssessment: {},
    structuredReport: {},
    morphologyAnalysis: {},
    hematologicReasoning: {},
    whatAISees: {},
    ...overrides,
  };
}

test("PASS 0 — 005.24 versions are registered", () => {
  assert.equal(MARROW_BLAST_POPULATION_GOVERNANCE_VERSION, "BE-FIX-005.24");
  assert.equal(MARROW_BLAST_POPULATION_CONTRACT_VERSION, "BE-FIX-005.24");
  assert.equal(MARROW_BLAST_POPULATION_REASONING_VERSION, "BE-FIX-005.24");
});

test("PASS 1 — repeated structured marrow blastoid morphology becomes observed population", () => {
  const evidence = evaluateMarrowBlastPopulationEvidence(marrow());
  assert.equal(evidence.observedPopulation, true);
  assert.equal(evidence.positivePopulationFinding, true);
});

test("PASS 2 — limited representativity cannot erase observed marrow blastoid population", () => {
  const governed = applyMarrowBlastPopulationGovernance(marrow());
  assert.equal(governed.finalClassification, "MARROW_BLASTOID_POPULATION_OBSERVED");
  assert.match(governed.mainFinding, /^POPULAÇÃO BLASTOIDE\/IMATURA OBSERVADA:/);
  assert.match(governed.mainFinding, /limitação de representatividade não invalida/i);
  assert.equal(governed.requiresHumanReview, true);
});

test("PASS 3 — finding-first governance outranks generic limited-field wording", () => {
  const governed = applyMarrowBlastPopulationGovernance(marrow({
    mainFinding: "Campo microscópico limitado.",
    finalConclusion: "Campo limitado.",
  }));
  assert.doesNotMatch(governed.mainFinding, /^Campo/i);
  assert.match(governed.mainFinding, /POPULAÇÃO BLASTOIDE/i);
});

test("PASS 4 — observed blastoid population never assigns ALL/AML lineage from morphology alone", () => {
  const governed = applyMarrowBlastPopulationGovernance(marrow());
  assert.equal(governed.blastAssessment?.lineageAssignable === true, false);
  assert.doesNotMatch(governed.mainFinding, /diagnóstico de LLA|diagnóstico de LMA|leucemia confirmada/i);
  assert.match(governed.hematologicReasoning.whatICannotConfirm, /não confirma LLA, LMA/i);
});

test("PASS 5 — suspicious population is HIGH/priority and not upgraded to observed", () => {
  const input = marrow();
  input.blastAssessment.observed = null;
  input.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  const governed = applyMarrowBlastPopulationGovernance(input);
  assert.equal(governed.finalClassification, "MARROW_BLASTOID_POPULATION_SUSPICIOUS");
  assert.match(governed.riskLevel, /Alta prioridade/i);
});

test("PASS 6 — a single unsupported cell does not become a blastoid population", () => {
  const input = marrow();
  input.blastAssessment.evidenceState = "FOCAL_SUSPICION";
  input.blastAssessment.observed = null;
  input.blastAssessment.approximateBlastLikeCells = 1;
  input.blastAssessment.populationPattern = "focal";
  input.blastAssessment.morphologySupport = { highNCRatio: true };
  const evidence = evaluateMarrowBlastPopulationEvidence(input);
  assert.equal(evidence.observedPopulation, false);
  assert.equal(evidence.suspiciousPopulation, false);
  assert.equal(evidence.focalSuspicion, true);
});

test("PASS 7 — bone marrow contract preserves structured blast-population evidence", () => {
  const input = marrow();
  const contracted = enforceBoneMarrowOutputContract(input, { rawResult: input, specimenGate });
  assert.equal(contracted.blastAssessment.evidenceState, "OBSERVED_POPULATION");
  assert.equal(contracted.blastAssessment.approximateBlastLikeCells, 18);
  assert.equal(contracted.blastAssessment.lineageAssignable, false);
  assert.equal(contracted.blastAssessment.governanceVersion, "BE-FIX-005.24");
});

test("PASS 8 — marrow reasoning recognizes repeated blastoid population before representativity qualifier", () => {
  const input = marrow();
  const contracted = enforceBoneMarrowOutputContract(input, { rawResult: input, specimenGate });
  const reasoned = applyBoneMarrowClinicalReasoning(contracted, { specimenGate });
  assert.equal(reasoned.boneMarrowClinicalReasoning.blast.observedPopulation, true);
  assert.equal(reasoned.boneMarrowClinicalReasoning.blast.findingFirstPriority, "CRITICAL");
  assert.match(reasoned.boneMarrowClinicalReasoning.blast.interpretation, /^População blastoide\/imatura/i);
});

test("PASS 9 — server registers 005.24 prompt, runtime fingerprint and post-safety governance", () => {
  const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(source, /MARROW_BLAST_POPULATION_GOVERNANCE_VERSION/);
  assert.match(source, /marrowBlastPopulationGovernanceVersion/);
  assert.match(source, /BE-FIX-005\.24 — VARREDURA BLASTOIDE MEDULAR OBRIGATÓRIA/);
  assert.match(source, /applyMarrowBlastPopulationGovernance/);
});
