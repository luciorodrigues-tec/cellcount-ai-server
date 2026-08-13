import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExpertHematologyNarrative,
} from "../ai/clinicalResultV2/expertHematologyNarrative.js";

import {
  buildClinicalResultCoherenceProjection,
  CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
} from "../ai/clinicalResultV2/clinicalResultCoherenceEngine.js";

import {
  ClinicalEvidenceState,
  ClinicalSeverity,
} from "../ai/clinicalResultV2/clinicalEvidenceState.js";

const EXPECTED_CRCE_VERSION = "CRCE-1.7";

const BLAST_LABEL = "Blastos/blastoides";

function buildSuspiciousBlastTruth(overrides = {}) {
  const base = {
    criticalFindings: {
      blastLike: {
        state:
          ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE,
        confidence: 0.68,
        evidence: [
          "Célula mononuclear com características de imaturidade/blastoidia.",
        ],
        requiresReview: true,
        severity: ClinicalSeverity.HIGH,
      },

      auerRods: {
        state: ClinicalEvidenceState.INDETERMINATE,
      },

      schistocytes: {
        state: ClinicalEvidenceState.INDETERMINATE,
      },

      parasites: {
        state:
          ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
    },

    parasiteArtifact: {
      parasite: {
        state:
          ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
    },

    patternInterpretation: {},

    morphologySignals: {
      focalMononuclearAtypia: true,
    },

    scope: {
      limitedField: true,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },

    risk: {
      severity: ClinicalSeverity.HIGH,
    },

    review: {
      required: true,
      urgency: "PRIORITY",
    },

    quality: {
      confidence: 0.68,
    },

    lineages: {},
  };

  return {
    ...base,
    ...overrides,

    criticalFindings: {
      ...base.criticalFindings,
      ...(overrides.criticalFindings ?? {}),
    },

    parasiteArtifact: {
      ...base.parasiteArtifact,
      ...(overrides.parasiteArtifact ?? {}),
    },

    patternInterpretation: {
      ...base.patternInterpretation,
      ...(overrides.patternInterpretation ?? {}),
    },

    morphologySignals: {
      ...base.morphologySignals,
      ...(overrides.morphologySignals ?? {}),
    },

    scope: {
      ...base.scope,
      ...(overrides.scope ?? {}),
    },

    risk: {
      ...base.risk,
      ...(overrides.risk ?? {}),
    },

    review: {
      ...base.review,
      ...(overrides.review ?? {}),
    },

    quality: {
      ...base.quality,
      ...(overrides.quality ?? {}),
    },

    lineages: {
      ...base.lineages,
      ...(overrides.lineages ?? {}),
    },
  };
}

function buildScenario(overrides = {}) {
  const truth =
    buildSuspiciousBlastTruth(overrides);

  const narrative =
    buildExpertHematologyNarrative(
      truth,
      {},
    );

  const projection =
    buildClinicalResultCoherenceProjection(
      truth,
      narrative,
    );

  return {
    truth,
    narrative,
    projection,
  };
}

function assertBlastNeverNegative(projection) {
  const negatives =
    projection?.criticalNegatives?.items ?? [];

  assert.ok(
    !negatives.some(
      (item) =>
        /blasto/i.test(
          String(item || ""),
        ),
    ),
    "Suspicious blast-like evidence must never be projected as a critical negative.",
  );
}

/* -------------------------------------------------------------------------- */
/* VERSION                                                                    */
/* -------------------------------------------------------------------------- */

test(
  "PASS 0 — CRCE-1.7 version is registered",
  () => {
    assert.equal(
      CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
      EXPECTED_CRCE_VERSION,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* MORPHOLOGY CLASS                                                           */
/* -------------------------------------------------------------------------- */

test(
  "PASS 1 — suspicious blast-like evidence becomes the authoritative morphology class",
  () => {
    const { projection } =
      buildScenario();

    assert.equal(
      projection.morphologyClass.code,
      "SUSPICIOUS_BLAST_LIKE_FINDING",
    );

    assert.equal(
      projection.criticalFindings.blastLike,
      "SUSPICIOUS_INDETERMINATE",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* RISK GOVERNANCE                                                            */
/* -------------------------------------------------------------------------- */

test(
  "PASS 2 — suspicious blast-like evidence escalates risk and review priority",
  () => {
    const { projection } =
      buildScenario();

    assert.equal(
      projection.riskTier.level,
      "HIGH",
    );

    assert.equal(
      projection.reviewStatus.required,
      true,
    );

    assert.equal(
      projection.reviewStatus.urgency,
      "PRIORITY",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* EXECUTIVE SYNTHESIS                                                        */
/* -------------------------------------------------------------------------- */

test(
  "PASS 3 — executive conclusion expresses blastoid suspicion as a clinical judgment",
  () => {
    const { projection } =
      buildScenario();

    assert.match(
      projection.executiveConclusion,
      /imaturidade\/blastoidia/i,
    );

    assert.match(
      projection.executiveConclusion,
      /revisão hematológica prioritária/i,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* POSITIVE EVIDENCE MUST SURVIVE LIMITED FIELD                               */
/* -------------------------------------------------------------------------- */

test(
  "PASS 4 — limited field cannot downgrade suspicious blast-like evidence to not assessable",
  () => {
    const { projection } =
      buildScenario();

    assert.doesNotMatch(
      projection.executiveConclusion,
      /não suficientemente avaliável/i,
    );

    assert.doesNotMatch(
      projection.executiveConclusion,
      /não avaliável/i,
    );

    assert.equal(
      projection.criticalFindings.blastLike,
      "SUSPICIOUS_INDETERMINATE",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* INTEGRATED INTERPRETATION                                                  */
/* -------------------------------------------------------------------------- */

test(
  "PASS 5 — integrated interpretation preserves suspicion semantics",
  () => {
    const { projection } =
      buildScenario();

    assert.match(
      projection.integratedInterpretation,
      /suspeit/i,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* EXPERT NARRATIVE                                                           */
/* -------------------------------------------------------------------------- */

test(
  "PASS 6 — expert synthesis contains the actual blastoid judgment",
  () => {
    const { narrative } =
      buildScenario();

    assert.match(
      narrative.executiveSynthesis,
      /imaturidade\/blastoidia/i,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* EVIDENCE GROUPING                                                          */
/* -------------------------------------------------------------------------- */

test(
  "PASS 7 — suspicious blast-like evidence is grouped under suspicious findings",
  () => {
    const { projection } =
      buildScenario();

    assert.ok(
      Array.isArray(
        projection.evidenceGroups?.suspicious,
      ),
    );

    assert.ok(
      projection.evidenceGroups.suspicious.includes(
        BLAST_LABEL,
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* NEGATIVE SAFETY                                                            */
/* -------------------------------------------------------------------------- */

test(
  "PASS 8 — suspicious blast-like evidence never enters critical negatives",
  () => {
    const { projection } =
      buildScenario();

    assertBlastNeverNegative(
      projection,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* FIELD REPRESENTATIVITY INVARIANT                                           */
/* -------------------------------------------------------------------------- */

test(
  "PASS 9 — suspicious positive evidence coexists with limited representativity",
  () => {
    const {
      truth,
      projection,
    } = buildScenario();

    assert.equal(
      truth.scope.limitedField,
      true,
    );

    assert.equal(
      truth.scope.populationInferenceAllowed,
      false,
    );

    assert.equal(
      projection.criticalFindings.blastLike,
      "SUSPICIOUS_INDETERMINATE",
    );

    assert.equal(
      projection.reviewStatus.required,
      true,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* FALSE NEGATIVE REGRESSION GUARD                                            */
/* -------------------------------------------------------------------------- */

test(
  "PASS 10 — blast suspicion cannot be simultaneously suspicious and negative",
  () => {
    const { projection } =
      buildScenario();

    const suspicious =
      projection.evidenceGroups?.suspicious ?? [];

    const negatives =
      projection.criticalNegatives?.items ?? [];

    assert.ok(
      suspicious.includes(
        BLAST_LABEL,
      ),
    );

    assert.ok(
      !negatives.includes(
        BLAST_LABEL,
      ),
    );
  },
);