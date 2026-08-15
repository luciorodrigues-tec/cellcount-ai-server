import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MARROW_FINAL_RESULT_COHERENCE_VERSION,
  applyMarrowFinalResultCoherence,
} from "../ai/boneMarrow/marrowFinalResultCoherenceEngine.js";

import { applyFieldScopedNegativeFindings } from "../ai/fieldScopedNegativeFindings.js";

function baseMarrow() {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    normalityBlocked: true,
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      blastEvidenceState: "NOT_ASSESSABLE",
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      globalNegativeExclusionAllowed: false,
      blastAssessability: { state: "NOT_ASSESSABLE" },
    },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: true,
      criticalMorphology: {
        blastLikeMorphology: "NOT_ASSESSABLE",
        auerRod: "NOT_ASSESSABLE",
        schistocytes: "NOT_ASSESSABLE",
      },
      platelets: { evaluable: true },
      marrow: { blastPopulationEvidence: { marrowLike: true } },
    },
    morphologyAnalysis: {
      absentFindings:
        "Blastos inequívocos não identificados. Células imaturas críticas não identificadas.",
      negativeFindings: [],
    },
    whatAISees: {},
    negativeFindingsStructured: [],
    positiveFindings: [],
    blockNormalReason: [
      "Material medular não deve ser classificado globalmente como normal por imagem isolada.",
      "Sinais possíveis de displasia.",
      "Sinal possível de infiltração ou população anormal.",
    ],
    rawResponse: {
      positiveFindings: {
        status: "present",
        items: [
          "Células hematopoéticas nucleadas presentes.",
          "Série granulocítica presente com formas maduras e precursoras.",
        ],
      },
      myeloidSeries: {
        status: "present",
        summary: "Série granulocítica presente com maturação observável no campo.",
      },
      erythroidSeries: {
        status: "present",
        summary: "Série eritroide aparentemente presente, avaliação limitada.",
      },
      dysplasiaAssessment: { status: "indeterminate", globalExclusionAllowed: false },
      infiltrationAssessment: { status: "indeterminate", globalExclusionAllowed: false },
      blastAssessment: { evidenceState: "NOT_ASSESSABLE" },
    },
  };
}

test("PASS 0 — 005.32 identity is registered", () => {
  assert.equal(MARROW_FINAL_RESULT_COHERENCE_VERSION, "BE-FIX-005.32");
});
test("PASS 1 — domain-specific NOT_ASSESSABLE does not become a negative blast finding", () => {
  const result = applyFieldScopedNegativeFindings(baseMarrow());
  assert.match(result.morphologyAnalysis.absentFindings, /não avaliáveis com segurança/i);
  assert.doesNotMatch(result.morphologyAnalysis.absentFindings, /Blastos inequívocos não identificados/i);
});
test("PASS 2 — 005.32 scrubs stale blast-negative prose when screening is NOT_ASSESSABLE", () => {
  const result = applyMarrowFinalResultCoherence(baseMarrow());
  assert.equal(result.marrowFinalResultCoherence.blastNegativeScrubbedForNotAssessable, true);
  assert.doesNotMatch(result.morphologyAnalysis.absentFindings, /Blastos inequívocos não identificados/i);
});
test("PASS 3 — inability to exclude dysplasia is not positive dysplasia suspicion", () => {
  const result = applyMarrowFinalResultCoherence(baseMarrow());
  assert.equal(result.blockNormalReason.some((x) => /displasia/i.test(x)), false);
});
test("PASS 4 — inability to exclude infiltration is not positive infiltration suspicion", () => {
  const result = applyMarrowFinalResultCoherence(baseMarrow());
  assert.equal(result.blockNormalReason.some((x) => /infiltra/i.test(x)), false);
});
test("PASS 5 — raw positive marrow observations survive final coherence", () => {
  const result = applyMarrowFinalResultCoherence(baseMarrow());
  assert.ok(result.positiveFindings.includes("Células hematopoéticas nucleadas presentes."));
  assert.ok(result.positiveFindings.some((x) => /Série granulocítica presente/i.test(x)));
  assert.deepEqual(result.whatAISees.positiveFindings, result.positiveFindings);
});
test("PASS 6 — evaluable negative blast state remains a field-scoped negative", () => {
  const input = baseMarrow();
  input.findings.blastEvidenceState = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  input.fieldAdequacy.blastAssessability.state = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  input.localMorphologyEvidence.criticalMorphology.blastLikeMorphology =
    "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  const result = applyFieldScopedNegativeFindings(input);
  assert.match(result.morphologyAnalysis.absentFindings, /Blastos inequívocos não identificados/i);
});
test("PASS 7 — true positive blast path is protected", () => {
  const input = baseMarrow();
  input.findings.blastSuspicion = true;
  input.findings.blastEvidenceState = "SUSPICIOUS_INDETERMINATE";
  input.marrowPositiveBlastEvidencePreservation = { active: true };
  const result = applyMarrowFinalResultCoherence(input);
  assert.equal(result.findings.blastSuspicion, true);
  assert.equal(result.marrowFinalResultCoherence.truePositiveBlastPathProtected, true);
  assert.equal(result.requiresHumanReview, true);
});
test("PASS 8 — 005.32 metadata preserves 005.29/005.30/005.31", () => {
  const result = applyMarrowFinalResultCoherence(baseMarrow());
  assert.equal(result.marrowFinalResultCoherence.preserves00529, true);
  assert.equal(result.marrowFinalResultCoherence.preserves00530, true);
  assert.equal(result.marrowFinalResultCoherence.preserves00531, true);
});
test("PASS 9 — server integrates 005.32 after final field-scoped negative lock", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /MARROW_FINAL_RESULT_COHERENCE_VERSION/);
  assert.match(server, /assessabilityConsistentNegativeFindingsVersion/);
  const lastField = server.lastIndexOf("applyFieldScopedNegativeFindings(");
  const coherence = server.lastIndexOf("applyMarrowFinalResultCoherence(finalResult)");
  assert.ok(coherence > lastField);
});
