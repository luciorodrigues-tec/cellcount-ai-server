import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateMarrowPositiveBlastEvidenceSemanticSupersession,
  applyMarrowPositiveBlastEvidenceSemanticSupersession,
  MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
  MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION,
} from "../ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";

import {
  evaluateMarrowBlastPopulationEvidence,
  applyMarrowBlastPopulationGovernance,
} from "../ai/boneMarrow/marrowBlastPopulationSentinel.js";

import {
  applyMarrowPositiveBlastEvidencePreservation,
} from "../ai/boneMarrow/marrowPositiveBlastEvidencePreservationEngine.js";

import analyzeGlobalPattern from "../ai/globalPatternEngine.js";

function focalExpansionCase() {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    findings: {
      blastSuspicion: true,
      immatureCells: true,
      myeloidExpansionPattern: true,
    },
    rawResponse: {
      blastAssessment: {
        evidenceState: "FOCAL_SUSPICION",
        approximateBlastLikeCells: 2,
        populationPattern: "focal",
        morphologySupport: {
          highNCRatio: true,
          openFineChromatin: true,
          nucleoli: false,
          scantBasophilicCytoplasm: false,
          monomorphism: false,
          repeatedAcrossField: false,
        },
        blastoidSubpopulationContext: {
          distinctFromMaturationContinuum: false,
          morphologicallyCoherent: false,
          repeatedSubsetAcrossField: false,
        },
      },
    },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      structuredPathologicSubset: false,
      blastArchitecture: {
        evidenceState: "FOCAL_SUSPICION",
        distinct: false,
        coherent: false,
        repeated: false,
        architectureScore: 0,
        structuredPathologicSubset: false,
      },
    },
    marrowPathologicMaturationContinuumLock: {
      active: true,
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      blastoidPopulationSupported: false,
    },
    marrowRecoveredCytologyProjection: {
      evidenceState: "FOCAL_SUSPICION",
      blastLikeCount: 2,
      architectureQualified: false,
      structuredPositive: false,
      distinctFromMaturationContinuum: false,
    },
    marrowPrecursorDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionProtected: true,
      protectedObservedBlastoid: false,
      protectedSuspiciousBlastoid: false,
      coherentBlastoidSubpopulation: false,
      strongBlastoidPattern: false,
      blastArchitectureScore: 0,
      explicitlyNotDistinctFromContinuum: true,
      dualAxis: {
        observedEscalation: false,
        suspiciousEscalation: false,
      },
      blastoidSubpopulationSignals: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
        structuredPathologicSubset: false,
      },
    },
    localMorphologyEvidence: {
      evidenceAvailable: true,
      marrow: {
        blastPopulationEvidence: {
          evidenceState: "FOCAL_SUSPICION",
          positive: true,
          repeated: false,
          approximateBlastLikeCells: 2,
          precursorDiscrimination: {
            classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
            pathologicMyeloidExpansionProtected: true,
            protectedObservedBlastoid: false,
            protectedSuspiciousBlastoid: false,
            coherentBlastoidSubpopulation: false,
            strongBlastoidPattern: false,
            blastArchitectureScore: 0,
            explicitlyNotDistinctFromContinuum: true,
            dualAxis: {
              observedEscalation: false,
              suspiciousEscalation: false,
            },
            blastoidSubpopulationSignals: {
              distinctFromMaturationContinuum: false,
              morphologicallyCoherent: false,
              repeatedSubsetAcrossField: false,
              structuredPathologicSubset: false,
            },
          },
        },
      },
    },
    fieldAdequacy: {
      adequateForPopulationAssessment: false,
      limitedField: true,
      positiveBlastEvidenceOverride: {
        active: true,
      },
    },
    mainFinding:
      "Expansão relativa da série mieloide/granulocítica com amplo espectro maturativo e coexistência de formas precursoras e maduras, sem subpopulação blastoide distinta, coerente e repetida sustentada neste campo.",
    morphologyAnalysis: {
      overview:
        "Campo medular com representação mieloide/granulocítica aumentada e diversidade de estágios maturativos.",
    },
  };
}

test("PASS 0 — 005.44 identities are registered", () => {
  assert.equal(
    MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
    "BE-FIX-005.44",
  );
  assert.equal(MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION, "BE-FIX-005.44");
});

test("PASS 1 — focal legacy positive is semantically superseded in protected expansion", () => {
  const decision =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(
      focalExpansionCase(),
    );

  assert.equal(decision.active, true);
  assert.equal(decision.populationPositiveAllowed, false);
  assert.equal(decision.focalCytologyPreserved, true);
});

test("PASS 2 — supersession preserves focal cytology but clears population blast suspicion", () => {
  const out =
    applyMarrowPositiveBlastEvidenceSemanticSupersession(
      focalExpansionCase(),
    );

  assert.equal(out.findings.blastSuspicion, false);
  assert.equal(out.findings.immatureCells, false);
  assert.equal(out.findings.focalImmatureCytologyObserved, true);
  assert.equal(
    out.localMorphologyEvidence.marrow.blastPopulationEvidence.positive,
    false,
  );
});

test("PASS 3 — blast population governance cannot resurrect focal suspicion", () => {
  const out =
    applyMarrowBlastPopulationGovernance(
      focalExpansionCase(),
    );

  assert.equal(out.marrowBlastPopulationEvidence.focalSuspicion, false);
  assert.equal(out.marrowBlastPopulationEvidence.positivePopulationFinding, false);
});

test("PASS 4 — 005.29 preservation honors 005.44 semantic supersession", () => {
  const out =
    applyMarrowPositiveBlastEvidencePreservation(
      focalExpansionCase(),
    );

  assert.equal(
    out.marrowPositiveBlastEvidencePreservation.active,
    false,
  );
  assert.equal(
    out.marrowPositiveBlastEvidencePreservation.semanticSupersessionActive,
    true,
  );
  assert.equal(out.findings.blastSuspicion, false);
});

test("PASS 5 — global pattern resolves to myeloid expansion rather than positive blastoid population", () => {
  const out = analyzeGlobalPattern(focalExpansionCase());

  assert.equal(out.marrowPositiveBlastEvidence, false);
  assert.equal(out.pathologicMyeloidExpansionPattern, true);
  assert.equal(
    out.dominantPattern,
    "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
  );
});

test("PASS 6 — OBSERVED blast population is never superseded", () => {
  const data = focalExpansionCase();
  data.rawResponse.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  data.rawResponse.blastAssessment.observed = true;
  data.rawResponse.blastAssessment.approximateBlastLikeCells = 6;

  const decision =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(data);

  assert.equal(decision.active, false);
  assert.equal(decision.observedQualified, true);
});

test("PASS 7 — qualified suspicious architecture is never superseded", () => {
  const data = focalExpansionCase();
  data.rawResponse.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  data.marrowPrecursorDiscrimination.dualAxis.suspiciousEscalation = true;
  data.marrowPrecursorDiscrimination.blastoidSubpopulationSignals = {
    distinctFromMaturationContinuum: true,
    morphologicallyCoherent: true,
    repeatedSubsetAcrossField: true,
    structuredPathologicSubset: true,
  };

  const decision =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(data);

  assert.equal(decision.active, false);
  assert.equal(decision.suspiciousArchitectureQualified, true);
});

test("PASS 8 — 005.44 never fabricates global blast-negative exclusion", () => {
  const out =
    applyMarrowPositiveBlastEvidenceSemanticSupersession(
      focalExpansionCase(),
    );

  assert.equal(
    out.marrowPositiveBlastEvidenceSemanticSupersession
      .negativeBlastExclusionAllowed,
    false,
  );
  assert.equal(
    out.marrowFinalBlastProjectionLock.globalBlastExclusionAllowed,
    false,
  );
});

test("PASS 9 — server exposes 005.44 runtime fingerprints and production application", async () => {
  const { readFile } = await import("node:fs/promises");
  const server = await readFile(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

  assert.match(
    server,
    /marrowPositiveBlastEvidenceSemanticSupersessionVersion/,
  );
  assert.match(server, /MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION/);
  assert.match(server, /marrowFinalBlastProjectionLockVersion/);
  assert.match(server, /applyMarrowPositiveBlastEvidenceSemanticSupersession/);
});
