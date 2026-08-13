import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import analyzeGlobalPattern from "../ai/globalPatternEngine.js";

import {
  REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
  REACTIVE_BLAST_ASSESSABILITY_GATE_VERSION,
  evaluateReactiveLymphoidEvidence,
  applyReactiveLymphoidEvidenceSentinel,
} from "../ai/reactiveLymphoidEvidenceSentinel.js";

const here =
  path.dirname(
    fileURLToPath(import.meta.url),
  );

const root =
  path.resolve(here, "..");

const server =
  fs.readFileSync(
    path.join(root, "server.js"),
    "utf8",
  );

const EXPECTED_REACTIVE_SENTINEL_VERSION =
  "BE-FIX-005.15";

const EXPECTED_ASSESSABILITY_GATE_VERSION =
  "BE-FIX-005.16";

const EXPECTED_GLOBAL_PATTERN_VERSION =
  "GLOBAL_PATTERN_ENGINE_V2_BE_FIX_005_16";

/* -------------------------------------------------------------------------- */
/* FIXTURE                                                                    */
/* -------------------------------------------------------------------------- */

function base({
  blastAssessable = false,
  limitedField = true,
  populationAssessable = false,
  visibleLeukocytes = 7,
} = {}) {
  return {
    rawResponse: {
      findings: {
        reactiveLymphocytes: false,
        atypicalLymphocytes: false,
        largeMononuclearCells: false,
        blastSuspicion: false,
      },

      visualEvidence: {
        abundantBasophilicCytoplasm: false,
        cellSizeIncrease: false,
        erythrocyteMolding: false,
        irregularCellBorders: false,
        prominentNucleolus: false,
      },

      fieldAdequacy: {
        limitedField,
        adequateForPopulationAssessment:
          populationAssessable,
        adequateForBlastScreening:
          blastAssessable,
        visibleLeukocytes,
      },
    },

    findings: {
      reactiveLymphocytes: false,
      atypicalLymphocytes: false,
      largeMononuclearCells: false,
      blastSuspicion: false,
    },

    visualEvidence: {},

    fieldAdequacy: {
      limitedField,

      adequateForPopulationAssessment:
        populationAssessable,

      adequateForBlastScreening:
        blastAssessable,

      visibleLeukocytes,

      blastAssessability: {
        version:
          EXPECTED_ASSESSABILITY_GATE_VERSION,

        state:
          blastAssessable
            ? "EVALUABLE"
            : "NOT_ASSESSABLE",

        adequateForBlastScreening:
          blastAssessable,

        negativeBlastConclusionAllowed:
          blastAssessable,

        reason:
          blastAssessable
            ? "Campo explicitamente avaliável para triagem morfológica de blastos."
            : "Detalhes nucleares insuficientes para exclusão morfológica segura de blastos.",
      },
    },

    localMorphologyEvidence: {
      criticalMorphology: {
        blastLikeMorphology:
          blastAssessable
            ? "NOT_OBSERVED_IN_EVALUABLE_FIELD"
            : "NOT_ASSESSABLE",

        blastAssessability: {
          version:
            EXPECTED_ASSESSABILITY_GATE_VERSION,

          state:
            blastAssessable
              ? "EVALUABLE"
              : "NOT_ASSESSABLE",

          adequateForBlastScreening:
            blastAssessable,

          negativeBlastConclusionAllowed:
            blastAssessable,
        },
      },

      leukocytes: {
        description: "",
        atypia: "",
        cytoplasm: "",
        nuclearMorphology: "",
        chromatin: "",
        nucleoli: "",
        ncRatio: "",
      },
    },

    morphologyAnalysis: {},
    patternRecognition: {},
    overallAssessment: {},
    structuredReport: {},
    differentialDiagnosis: [],
  };
}

function enableReactiveMorphology(
  result,
  {
    strong = false,
  } = {},
) {
  result.rawResponse.findings
    .reactiveLymphocytes = true;

  result.findings
    .reactiveLymphocytes = true;

  result.rawResponse.visualEvidence
    .abundantBasophilicCytoplasm = true;

  result.rawResponse.visualEvidence
    .irregularCellBorders = true;

  if (strong) {
    result.rawResponse.visualEvidence
      .erythrocyteMolding = true;

    result.rawResponse.visualEvidence
      .cellSizeIncrease = true;
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* VERSION                                                                    */
/* -------------------------------------------------------------------------- */

test(
  "PASS 0 — 005.15 sentinel and 005.16 assessability gate are registered",
  () => {
    assert.equal(
      REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
      EXPECTED_REACTIVE_SENTINEL_VERSION,
    );

    assert.equal(
      REACTIVE_BLAST_ASSESSABILITY_GATE_VERSION,
      EXPECTED_ASSESSABILITY_GATE_VERSION,
    );

    assert.match(
      server,
      /reactiveLymphoidEvidenceSentinelVersion/,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* LARGE MONONUCLEAR                                                          */
/* -------------------------------------------------------------------------- */

test(
  "PASS 1 — large mononuclear cell alone is not reactive",
  () => {
    const r = base();

    r.rawResponse.findings
      .largeMononuclearCells = true;

    r.findings
      .largeMononuclearCells = true;

    r.rawResponse.visualEvidence
      .cellSizeIncrease = true;

    const e =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      e.reactivePatternSupported,
      false,
    );

    assert.equal(
      e.isolatedAtypicalMononuclearSignal,
      true,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* ATYPICAL LYMPHOCYTE                                                        */
/* -------------------------------------------------------------------------- */

test(
  "PASS 2 — atypical lymphocyte alone is not automatically reactive",
  () => {
    const r = base();

    r.rawResponse.findings
      .atypicalLymphocytes = true;

    r.findings
      .atypicalLymphocytes = true;

    const e =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      e.reactivePatternSupported,
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* RAW REACTIVE MORPHOLOGY                                                    */
/* -------------------------------------------------------------------------- */

test(
  "PASS 3 — reactive flag plus morphology support establishes reactive morphology evidence",
  () => {
    const r =
      enableReactiveMorphology(
        base(),
      );

    const e =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      e.reactivePatternSupported,
      true,
    );

    // Important distinction introduced by 005.16:
    // morphology support != authorization for final reactive classification.
    assert.equal(
      e.blastAssessable,
      false,
    );

    assert.equal(
      e.reactiveClassificationAllowed,
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* MONONUCLEOSIS BAR                                                          */
/* -------------------------------------------------------------------------- */

test(
  "PASS 4 — EBV/CMV language requires stronger evidence",
  () => {
    const r = base();

    r.rawResponse.findings
      .reactiveLymphocytes = true;

    r.rawResponse.visualEvidence
      .abundantBasophilicCytoplasm = true;

    const e =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      e.reactivePatternSupported,
      true,
    );

    assert.equal(
      e.mononucleosisPatternSupported,
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* UNSUPPORTED REACTIVE OVERCALL                                              */
/* -------------------------------------------------------------------------- */

test(
  "PASS 5 — unsupported reactive narrative is removed but atypia preserved",
  () => {
    const r = base();

    r.rawResponse.findings
      .largeMononuclearCells = true;

    r.findings
      .largeMononuclearCells = true;

    r.reactiveLymphoidPattern = true;

    r.morphologicRiskClass =
      "CLASS_2_ATYPICAL_REACTIVE_PATTERN";

    r.finalClassification =
      "CLASS_2_ATYPICAL_REACTIVE_PATTERN";

    r.riskLevel =
      "Padrão linfoide reacional/atípico";

    r.interpretiveSynthesis =
      "O padrão linfoide observado sugere ativação imunológica reacional e EBV.";

    r.clinicalMeaning =
      "Pode estar associado a síndrome mononucleósica.";

    r.morphologyAnalysis.summary =
      "Ativação linfoide reacional / população mononuclear atípica.";

    r.differentialDiagnosis = [
      "Mononucleose infecciosa por EBV",
      "Infecção por CMV",
      "Resposta imunológica reacional",
    ];

    const out =
      applyReactiveLymphoidEvidenceSentinel(r);

    assert.equal(
      out.reactiveLymphoidPattern,
      false,
    );

    assert.equal(
      out.findings.largeMononuclearCells,
      true,
    );

    assert.equal(
      out.morphologicRiskClass,
      "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
    );

    assert.doesNotMatch(
      out.interpretiveSynthesis,
      /EBV|ativação linfoide reacional/i,
    );

    assert.equal(
      out.differentialDiagnosis.some(
        (item) =>
          /EBV|CMV|mononucleose/i.test(
            item,
          ),
      ),
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* GLOBAL PATTERN — NON-ASSESSABLE BLAST SCREENING                            */
/* -------------------------------------------------------------------------- */

test(
  "PASS 6 — large mononuclear atypia remains blast-indeterminate when blast screening is not assessable",
  () => {
    const r =
      base({
        blastAssessable: false,
      });

    r.rawResponse.findings
      .largeMononuclearCells = true;

    r.findings
      .largeMononuclearCells = true;

    const g =
      analyzeGlobalPattern(r);

    assert.equal(
      g.dominantPattern,
      "ATYPICAL_MONONUCLEAR_PATTERN_BLAST_ASSESSMENT_INDETERMINATE",
    );

    assert.equal(
      g.blastAssessmentIndeterminate,
      true,
    );

    assert.equal(
      g.ruleVersion,
      EXPECTED_GLOBAL_PATTERN_VERSION,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* GLOBAL PATTERN — TRUE REACTIVE, BLAST-ASSESSABLE                           */
/* -------------------------------------------------------------------------- */

test(
  "PASS 7 — evidence-supported reactive pattern remains valid when blast screening is evaluable",
  () => {
    const r =
      enableReactiveMorphology(
        base({
          blastAssessable: true,
        }),
      );

    const evidence =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      evidence.reactivePatternSupported,
      true,
    );

    assert.equal(
      evidence.blastAssessable,
      true,
    );

    assert.equal(
      evidence.reactiveClassificationAllowed,
      true,
    );

    const g =
      analyzeGlobalPattern(r);

    assert.equal(
      g.dominantPattern,
      "REACTIVE_LYMPHOID_PATTERN",
    );

    assert.equal(
      g.blastAssessmentIndeterminate,
      false,
    );

    assert.equal(
      g.ruleVersion,
      EXPECTED_GLOBAL_PATTERN_VERSION,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* NEW 005.16 BOUNDARY                                                        */
/* -------------------------------------------------------------------------- */

test(
  "PASS 8 — reactive-looking morphology cannot become reassuring reactive classification when blast screening is not assessable",
  () => {
    const r =
      enableReactiveMorphology(
        base({
          blastAssessable: false,
        }),
        {
          strong: true,
        },
      );

    const evidence =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      evidence.reactivePatternSupported,
      true,
    );

    assert.equal(
      evidence.blastAssessable,
      false,
    );

    assert.equal(
      evidence.reactiveClassificationAllowed,
      false,
    );

    const out =
      applyReactiveLymphoidEvidenceSentinel(r);

    assert.equal(
      out.reactiveLymphoidPattern,
      false,
    );

    assert.equal(
      out.requiresHumanReview,
      true,
    );

    assert.equal(
      out.normalityBlocked,
      true,
    );

    assert.equal(
      out.blastAssessabilityReactiveGate?.active,
      true,
    );

    assert.match(
      out.interpretiveSynthesis,
      /não é avaliável|não é avaliavel|exclusão morfológica de blastos|exclusao morfologica de blastos/i,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* MONONUCLEOSIS REQUIRES BOTH STRONG MORPHOLOGY + ASSESSABILITY              */
/* -------------------------------------------------------------------------- */

test(
  "PASS 9 — strong reactive morphology may support mononucleosis morphology but final promotion still requires blast assessability",
  () => {
    const r =
      enableReactiveMorphology(
        base({
          blastAssessable: false,
        }),
        {
          strong: true,
        },
      );

    const e =
      evaluateReactiveLymphoidEvidence(r);

    assert.equal(
      e.mononucleosisPatternSupported,
      true,
    );

    assert.equal(
      e.reactiveClassificationAllowed,
      false,
    );

    const out =
      applyReactiveLymphoidEvidenceSentinel(r);

    assert.equal(
      out.mononucleosisSuspicion,
      false,
    );

    assert.equal(
      out.reactiveLymphoidPattern,
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* BLAST PRIORITY                                                             */
/* -------------------------------------------------------------------------- */

test(
  "PASS 10 — blast sentinel priority is preserved",
  () => {
    const r = base();

    r.singleBlastSentinel = {
      active: true,
    };

    r.findings.blastSuspicion = true;

    r.finalClassification =
      "CLASS_4_BLAST_SUSPICION";

    r.morphologicRiskClass =
      "CLASS_4_BLAST_SUSPICION";

    r.interpretiveSynthesis =
      "Suspeita blástica.";

    const out =
      applyReactiveLymphoidEvidenceSentinel(r);

    assert.equal(
      out.finalClassification,
      "CLASS_4_BLAST_SUSPICION",
    );

    assert.equal(
      out.findings.blastSuspicion,
      true,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* PARASITE PRIORITY                                                          */
/* -------------------------------------------------------------------------- */

test(
  "PASS 11 — parasite sentinel priority is preserved",
  () => {
    const r = base();

    r.parasiteEvidenceSentinel = {
      explicitPositiveParasiteEvidence: true,
    };

    r.findings.parasiteSuspected = true;

    r.finalClassification =
      "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";

    const out =
      applyReactiveLymphoidEvidenceSentinel(r);

    assert.equal(
      out.findings.parasiteSuspected,
      true,
    );

    assert.equal(
      out.finalClassification,
      "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* PIPELINE ORDER                                                             */
/* -------------------------------------------------------------------------- */

test(
  "PASS 12 — reactive sentinel runs after parasite sentinel and before negative rebuild",
  () => {
    const parasite =
      server.lastIndexOf(
        "applyParasiteEvidenceSentinel(",
      );

    const reactive =
      server.lastIndexOf(
        "applyReactiveLymphoidEvidenceSentinel(",
      );

    const negatives =
      server.lastIndexOf(
        "applyFieldScopedNegativeFindings(",
      );

    assert.ok(
      parasite >= 0,
      "Parasite sentinel call not found.",
    );

    assert.ok(
      reactive > parasite,
      "Reactive sentinel must run after parasite sentinel.",
    );

    assert.ok(
      negatives > reactive,
      "Negative findings rebuild must run after reactive sentinel.",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* NORMALIZER REGRESSION                                                      */
/* -------------------------------------------------------------------------- */

test(
  "PASS 13 — normalizer no longer equates large mononuclear cell with reactive population",
  () => {
    const start =
      server.indexOf(
        "function normalizeMedicalResponse",
      );

    const end =
      server.indexOf(
        "// ============================================================================\n// USER",
        start,
      );

    const block =
      server.slice(
        start,
        end,
      );

    assert.match(
      block,
      /evaluateReactiveLymphoidEvidence/,
    );

    assert.doesNotMatch(
      block,
      /const reactiveLymphoidPattern[\s\S]{0,500}findings\.largeMononuclearCells/,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* GLOBAL VERSION REGRESSION                                                  */
/* -------------------------------------------------------------------------- */

test(
  "PASS 14 — global pattern engine is registered as BE-FIX-005.16",
  () => {
    const r =
      analyzeGlobalPattern(
        base(),
      );

    assert.equal(
      r.ruleVersion,
      EXPECTED_GLOBAL_PATTERN_VERSION,
    );
  },
);