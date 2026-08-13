import test from "node:test";
import assert from "node:assert/strict";

import {
  ClinicalEvidenceState,
  buildCanonicalClinicalTruth,
  buildClinicalResultCoherenceProjection,
  CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
} from "../ai/clinicalResultV2/index.js";

const EXPECTED_CRCE_VERSION = "CRCE-1.7";

const LABELS = Object.freeze({
  BLASTS: "Blastos/blastoides",
  AUER_RODS: "Bastonetes de Auer",
  SCHISTOCYTES: "Esquizócitos clinicamente relevantes",
  PARASITES: "Hemoparasitas com evidência estruturada",
});

const STATES = ClinicalEvidenceState;

function buildBaseTruth(overrides = {}) {
  const base = {
    scope: {
      limitedField: true,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },

    criticalFindings: {
      blastLike: {
        state: STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
      auerRods: {
        state: STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
      schistocytes: {
        state: STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
      parasites: {
        state: STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
    },

    parasiteArtifact: {
      parasite: {
        state: STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
      },
      parasiteSuspicionAllowed: false,
      artifactLikelihood: "FAVORED",
    },

    patternInterpretation: {
      reactiveLymphoid: {
        supported: false,
      },
      mononucleosisPattern: {
        supported: false,
      },
      clonalityConcern: {
        supported: false,
      },
    },

    lineages: {
      erythrocytes: {
        assessment: {
          state: STATES.OBSERVED,
        },
        description:
          "Contornos crenados em parte das hemácias visíveis.",
      },

      leukocytes: {
        assessment: {
          state: STATES.OBSERVED,
        },
        description:
          "Célula mononuclear grande isolada, sem padrão populacional sustentado.",
      },

      platelets: {
        assessment: {
          state: STATES.NOT_ASSESSABLE,
        },
        description:
          "Avaliação plaquetária limitada.",
      },
    },

    risk: {
      severity: "REVIEW",
    },

    review: {
      required: true,
      urgency: "RECOMMENDED",
    },
  };

  return {
    ...base,
    ...overrides,

    scope: {
      ...base.scope,
      ...(overrides.scope ?? {}),
    },

    criticalFindings: {
      ...base.criticalFindings,
      ...(overrides.criticalFindings ?? {}),
    },

    parasiteArtifact: {
      ...base.parasiteArtifact,
      ...(overrides.parasiteArtifact ?? {}),
      parasite: {
        ...base.parasiteArtifact.parasite,
        ...(overrides.parasiteArtifact?.parasite ?? {}),
      },
    },

    patternInterpretation: {
      ...base.patternInterpretation,
      ...(overrides.patternInterpretation ?? {}),
      reactiveLymphoid: {
        ...base.patternInterpretation.reactiveLymphoid,
        ...(overrides.patternInterpretation?.reactiveLymphoid ?? {}),
      },
      mononucleosisPattern: {
        ...base.patternInterpretation.mononucleosisPattern,
        ...(overrides.patternInterpretation?.mononucleosisPattern ?? {}),
      },
      clonalityConcern: {
        ...base.patternInterpretation.clonalityConcern,
        ...(overrides.patternInterpretation?.clonalityConcern ?? {}),
      },
    },

    lineages: {
      ...base.lineages,
      ...(overrides.lineages ?? {}),
    },

    risk: {
      ...base.risk,
      ...(overrides.risk ?? {}),
    },

    review: {
      ...base.review,
      ...(overrides.review ?? {}),
    },
  };
}

const canonicalNarrative = Object.freeze({
  executiveSynthesis:
    "Avaliação morfológica de campo limitado, sem promoção de achados além da evidência disponível.",

  priorityFindings: Object.freeze([
    "Estrutura incomum favorecendo artefato; sem base estruturada para hemoparasita.",
  ]),

  integratedInterpretation:
    "Campo limitado para inferência populacional.",

  qualityAndConfidence:
    "Representatividade limitada.",

  recommendedNextSteps: Object.freeze([
    "Revisão microscópica por profissional habilitado.",
  ]),
});

function project(truthOverrides = {}) {
  return buildClinicalResultCoherenceProjection(
    buildBaseTruth(truthOverrides),
    canonicalNarrative,
  );
}

function assertNotNegative(projection, pattern, message) {
  assert.ok(
    !projection.criticalNegatives.items.some((item) =>
      pattern.test(String(item || "")),
    ),
    message,
  );
}

function assertCanonicalRiskPresentation(
  projection,
  {
    level,
    colorToken,
    representativity,
    reviewRequired,
  },
) {
  assert.equal(projection.riskTier.level, level);
  assert.equal(projection.riskTier.colorToken, colorToken);
  assert.equal(projection.representativity.level, representativity);
  assert.equal(projection.reviewStatus.required, reviewRequired);
}

/* -------------------------------------------------------------------------- */
/* VERSION                                                                    */
/* -------------------------------------------------------------------------- */

test("PASS 0 — CRCE-1.6 version is registered", () => {
  assert.equal(
    CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
    EXPECTED_CRCE_VERSION,
  );
});

/* -------------------------------------------------------------------------- */
/* PARASITE / ARTIFACT GOVERNANCE                                             */
/* -------------------------------------------------------------------------- */

test("PASS 1 — artifact cannot promote parasite", () => {
  const projection = project();

  assert.equal(
    projection.criticalFindings.parasiteSuspicionAllowed,
    false,
  );

  assert.equal(
    projection.criticalFindings.parasites,
    STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
  );
});

/* -------------------------------------------------------------------------- */
/* REACTIVE LYMPHOID GOVERNANCE                                               */
/* -------------------------------------------------------------------------- */

test(
  "PASS 2 — atypical isolated cell does not become reactive pattern",
  () => {
    const projection = project();

    assert.equal(
      projection.patternInterpretation.reactiveLymphoidSupported,
      false,
    );

    assert.equal(
      projection.patternInterpretation.mononucleosisPatternSupported,
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* FIELD REPRESENTATIVITY                                                     */
/* -------------------------------------------------------------------------- */

test(
  "PASS 3 — limited field remains limited despite positive local morphology",
  () => {
    const projection = project();

    assert.equal(projection.scope.limitedField, true);
    assert.equal(projection.scope.populationInferenceAllowed, false);
    assert.equal(projection.scope.globalNegativeExclusionAllowed, false);
  },
);

/* -------------------------------------------------------------------------- */
/* LINEAGE AUTHORITY                                                          */
/* -------------------------------------------------------------------------- */

test("PASS 4 — lineage descriptions come from canonical truth", () => {
  const projection = project();

  assert.match(
    projection.lineages.erythrocytes.description,
    /crenados/i,
  );

  assert.doesNotMatch(
    projection.lineages.erythrocytes.description,
    /normocíticas e normocrômicas/i,
  );
});

/* -------------------------------------------------------------------------- */
/* CRITICAL NEGATIVE QUALIFICATION                                            */
/* -------------------------------------------------------------------------- */

test("PASS 5 — critical negatives use one global qualifier", () => {
  const projection = project();

  assert.equal(
    projection.criticalNegatives.items.length,
    4,
  );

  assert.match(
    projection.criticalNegatives.qualifier,
    /não permite exclusão global/i,
  );
});

/* -------------------------------------------------------------------------- */
/* BLAST PRIORITY                                                             */
/* -------------------------------------------------------------------------- */

test("PASS 6 — one observed blast-like signal becomes critical", () => {
  const projection = project({
    criticalFindings: {
      blastLike: {
        state: STATES.OBSERVED,
      },
    },
  });

  assert.equal(
    projection.classification.code,
    "CRITICAL_BLAST_LIKE_FINDING",
  );

  assert.equal(
    projection.classification.severity,
    "CRITICAL",
  );
});

/* -------------------------------------------------------------------------- */
/* STRUCTURED PARASITE EVIDENCE                                               */
/* -------------------------------------------------------------------------- */

test("PASS 7 — structured parasite OBSERVED remains allowed", () => {
  const projection = project({
    parasiteArtifact: {
      parasite: {
        state: STATES.OBSERVED,
      },
      parasiteSuspicionAllowed: true,
      artifactLikelihood: "NOT_FAVORED",
    },

    criticalFindings: {
      parasites: {
        state: STATES.OBSERVED,
      },
    },
  });

  assert.equal(
    projection.criticalFindings.parasiteSuspicionAllowed,
    true,
  );

  assert.equal(
    projection.classification.code,
    "STRUCTURED_PARASITE_EVIDENCE",
  );
});

/* -------------------------------------------------------------------------- */
/* FOCAL MONONUCLEAR ATYPIA                                                   */
/* -------------------------------------------------------------------------- */

test(
  "PASS 8 — focal mononuclear atypia is not promoted to reactive pattern",
  () => {
    const projection = project({
      morphologySignals: {
        focalMononuclearAtypia: true,
        atypicalLymphocytesObserved: true,
        largeMononuclearCellsObserved: true,
      },
    });

    assert.equal(
      projection.morphologyClass.code,
      "FOCAL_MONONUCLEAR_ATYPIA",
    );

    assert.equal(
      projection.patternInterpretation.reactiveLymphoidSupported,
      false,
    );

    assert.match(
      projection.executiveConclusion,
      /atipia mononuclear focal/i,
    );

    assert.doesNotMatch(
      projection.executiveConclusion,
      /padrão linfoide reacional sustentado/i,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* INDEPENDENT CLINICAL AXES                                                  */
/* -------------------------------------------------------------------------- */

test(
  "PASS 9 — morphology, risk, representativity and review are independent axes",
  () => {
    const projection = project({
      morphologySignals: {
        focalMononuclearAtypia: true,
      },
    });

    assert.equal(
      projection.morphologyClass.code,
      "FOCAL_MONONUCLEAR_ATYPIA",
    );

    assertCanonicalRiskPresentation(projection, {
      level: "REVIEW",
      colorToken: "YELLOW",
      representativity: "LIMITED",
      reviewRequired: true,
    });
  },
);

/* -------------------------------------------------------------------------- */
/* RISK PRESENTATION SAFETY                                                   */
/* -------------------------------------------------------------------------- */

test(
  "PASS 10 — limited field can never render green low-risk presentation",
  () => {
    const projection = project();

    assert.equal(
      projection.scope.limitedField,
      true,
    );

    assertCanonicalRiskPresentation(projection, {
      level: "REVIEW",
      colorToken: "YELLOW",
      representativity: "LIMITED",
      reviewRequired: true,
    });

    assert.notEqual(
      projection.riskTier.colorToken,
      "GREEN",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* CANONICAL NARRATIVE                                                        */
/* -------------------------------------------------------------------------- */

test(
  "PASS 11 — canonical narrative is compressed and avoids risk-label conflation",
  () => {
    const projection = project({
      morphologySignals: {
        focalMononuclearAtypia: true,
      },
    });

    assert.notEqual(
      projection.morphologyClass.label,
      projection.riskTier.label,
    );

    assert.ok(
      projection.priorityFindings.length <= 3,
    );

    assert.ok(
      projection.recommendedNextSteps.length <= 4,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* GOVERNED REACTIVE SENTINEL                                                 */
/* -------------------------------------------------------------------------- */

test(
  "PASS 12 — governed reactive sentinel cannot be overridden by legacy flags",
  () => {
    const canonical = buildCanonicalClinicalTruth({
      fieldAdequacy: {
        limitedField: true,
        populationInferenceAllowed: false,
      },

      reactiveLymphoidEvidenceSentinel: {
        reactivePatternSupported: false,
        mononucleosisPatternSupported: false,
        evidence: [],
      },

      reactiveLymphoidPattern: true,
      mononucleosisSuspicion: true,

      lymphoidPatternAnalysis: {
        lymphoidPattern: "LYMPHOID_REACTIVE",
      },

      findings: {
        atypicalLymphocytes: true,
        largeMononuclearCells: true,
      },
    });

    assert.equal(
      canonical.patternInterpretation.reactiveLymphoid.supported,
      false,
    );

    assert.equal(
      canonical.patternInterpretation.mononucleosisPattern.supported,
      false,
    );
  },
);

/* -------------------------------------------------------------------------- */
/* SUSPICIOUS BLAST-LIKE EVIDENCE                                             */
/* -------------------------------------------------------------------------- */

test(
  "PASS 13 — suspicious blast-like evidence is preserved, escalated and never rendered as negative",
  () => {
    const canonical = buildCanonicalClinicalTruth({
      fieldAdequacy: {
        limitedField: true,
        adequateForBlastScreening: true,
        visibleLeukocytes: 6,
      },

      findings: {
        atypicalLymphocytes: true,
        largeMononuclearCells: true,
        blastSuspicion: true,
        blastEvidenceState:
          "SUSPICIOUS_INDETERMINATE",
      },

      singleBlastSentinel: {
        active: true,
        certainty: "VISUAL_BLAST_SUSPICION",
        evidenceState:
          "SUSPICIOUS_INDETERMINATE",
      },

      requiresHumanReview: true,
    });

    assert.equal(
      canonical.criticalFindings.blastLike.state,
      STATES.SUSPICIOUS_INDETERMINATE,
    );

    assert.equal(
      canonical.criticalFindings.blastLike.requiresReview,
      true,
    );

    const projection =
      buildClinicalResultCoherenceProjection(
        canonical,
        canonicalNarrative,
      );

    assert.equal(
      projection.criticalFindings.blastLike,
      "SUSPICIOUS_INDETERMINATE",
    );

    assert.equal(
      projection.morphologyClass.code,
      "SUSPICIOUS_BLAST_LIKE_FINDING",
    );

    assert.equal(
      projection.riskTier.level,
      "HIGH",
    );

    assert.equal(
      projection.reviewStatus.required,
      true,
    );

    assertNotNegative(
      projection,
      /blasto/i,
      "Suspicious blast-like evidence must never be rendered inside critical negatives.",
    );
  },
);

/* -------------------------------------------------------------------------- */
/* TRUE NEGATIVE BLAST STATE                                                  */
/* -------------------------------------------------------------------------- */

test(
  "PASS 14 — explicit evaluable negative remains negative when no suspicion exists",
  () => {
    const canonical = buildCanonicalClinicalTruth({
      fieldAdequacy: {
        adequateForBlastScreening: true,
        visibleLeukocytes: 6,
      },

      findings: {
        blastSuspicion: false,
        blastEvidenceState:
          "NOT_OBSERVED_IN_EVALUABLE_FIELD",
      },
    });

    assert.equal(
      canonical.criticalFindings.blastLike.state,
      STATES.NOT_OBSERVED_IN_EVALUABLE_FIELD,
    );

    assert.notEqual(
      canonical.criticalFindings.blastLike.state,
      STATES.SUSPICIOUS_INDETERMINATE,
    );
  },
);
