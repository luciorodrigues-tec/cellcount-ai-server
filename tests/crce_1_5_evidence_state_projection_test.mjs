import test from "node:test";
import assert from "node:assert/strict";

import {
  projectClinicalResultV2,
} from "../ai/clinicalResultV2/clinicalResultV2Projector.js";

function buildBaseAnalysis(overrides = {}) {
  const base = {
    analysisSource: "ai_visual",

    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      adequateForBlastScreening: true,
      adequateForLeukocyteAnalysis: true,
      visibleLeukocytes: 7,
    },

    findings: {},

    localMorphologyEvidence: {
      evidenceAvailable: true,
      contractVersion: "LME-1.0",

      leukocytes: {
        description:
          "Sete células nucleadas visíveis.",
      },

      erythrocytes: {
        description:
          "Hemácias visíveis.",
      },

      platelets: {
        description:
          "Plaquetas visíveis.",
      },
    },

    observedMorphology: {},

    overallAssessment: {
      requiresHumanReview: true,
    },

    confidenceAnalysis: {
      globalConfidenceScore: 68,
    },
  };

  return {
    ...base,
    ...overrides,

    fieldAdequacy: {
      ...base.fieldAdequacy,
      ...(overrides.fieldAdequacy ?? {}),
    },

    findings: {
      ...base.findings,
      ...(overrides.findings ?? {}),
    },

    localMorphologyEvidence: {
      ...base.localMorphologyEvidence,
      ...(overrides.localMorphologyEvidence ?? {}),
    },

    overallAssessment: {
      ...base.overallAssessment,
      ...(overrides.overallAssessment ?? {}),
    },

    confidenceAnalysis: {
      ...base.confidenceAnalysis,
      ...(overrides.confidenceAnalysis ?? {}),
    },
  };
}

function project(overrides = {}) {
  return projectClinicalResultV2(
    buildBaseAnalysis(overrides),
  );
}

/* -------------------------------------------------------------------------- */
/* SUSPICIOUS BLASTOID EVIDENCE                                               */
/* -------------------------------------------------------------------------- */

test(
  "PASS 0 — suspicious blast-like evidence remains suspicious and never enters negatives",
  () => {
    const v2 = project({
      findings: {
        blastSuspicion: true,
        blastEvidenceState:
          "SUSPICIOUS_INDETERMINATE",
      },
    });

    assert.equal(
      v2.criticalFindings.blastLike.state,
      "SUSPICIOUS_INDETERMINATE",
    );

    assert.ok(
      v2.presentation.evidenceGroups.suspicious.includes(
        "Blastos/blastoides",
      ),
    );

    assert.ok(
      !v2.presentation.criticalNegatives.items.includes(
        "Blastos/blastoides",
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* NOT ASSESSABLE BLASTOID EVIDENCE                                           */
/* -------------------------------------------------------------------------- */

test(
  "PASS 1 — not assessable blast screening is preserved and never rendered as negative",
  () => {
    const v2 = project({
      fieldAdequacy: {
        adequateForBlastScreening: false,
      },

      findings: {
        blastSuspicion: false,
        blastEvidenceState:
          "NOT_ASSESSABLE",
      },
    });

    assert.equal(
      v2.criticalFindings.blastLike.state,
      "NOT_ASSESSABLE",
    );

    assert.ok(
      v2.presentation.evidenceGroups.notAssessable.includes(
        "Blastos/blastoides",
      ),
    );

    assert.ok(
      !v2.presentation.criticalNegatives.items.includes(
        "Blastos/blastoides",
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* TRUE FIELD-SCOPED BLAST NEGATIVE                                           */
/* -------------------------------------------------------------------------- */

test(
  "PASS 2 — explicit evaluable blast negative remains a field-scoped negative",
  () => {
    const v2 = project({
      findings: {
        blastSuspicion: false,
        blastEvidenceState:
          "NOT_OBSERVED_IN_EVALUABLE_FIELD",
      },
    });

    assert.equal(
      v2.criticalFindings.blastLike.state,
      "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    );

    assert.ok(
      v2.presentation.criticalNegatives.items.includes(
        "Blastos/blastoides",
      ),
    );

    assert.ok(
      !v2.presentation.evidenceGroups.suspicious.includes(
        "Blastos/blastoides",
      ),
    );

    assert.ok(
      !v2.presentation.evidenceGroups.notAssessable.includes(
        "Blastos/blastoides",
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* INDETERMINATE CRITICAL FINDINGS                                            */
/* -------------------------------------------------------------------------- */

test(
  "PASS 3 — unproven Auer rods and schistocytes remain indeterminate",
  () => {
    const v2 = project();

    assert.equal(
      v2.criticalFindings.auerRods.state,
      "INDETERMINATE",
    );

    assert.equal(
      v2.criticalFindings.schistocytes.state,
      "INDETERMINATE",
    );

    assert.ok(
      v2.presentation.evidenceGroups.indeterminate.includes(
        "Bastonetes de Auer",
      ),
    );

    assert.ok(
      v2.presentation.evidenceGroups.indeterminate.includes(
        "Esquizócitos clinicamente relevantes",
      ),
    );

    assert.ok(
      !v2.presentation.criticalNegatives.items.includes(
        "Bastonetes de Auer",
      ),
    );

    assert.ok(
      !v2.presentation.criticalNegatives.items.includes(
        "Esquizócitos clinicamente relevantes",
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* PARASITE FALSE-NEGATIVE PROTECTION                                         */
/* -------------------------------------------------------------------------- */

test(
  "PASS 4 — legacy parasiteSuspected=false cannot create a structured parasite negative",
  () => {
    const v2 = project({
      findings: {
        parasiteSuspected: false,
      },
    });

    assert.notEqual(
      v2.criticalFindings.parasites.state,
      "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    );

    assert.ok(
      !v2.presentation.criticalNegatives.items.includes(
        "Hemoparasitas com evidência estruturada",
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* NEGATIVE GROUP INTEGRITY                                                   */
/* -------------------------------------------------------------------------- */

test(
  "PASS 5 — critical negatives contain only true evaluable negatives",
  () => {
    const v2 = project({
      findings: {
        blastEvidenceState:
          "NOT_OBSERVED_IN_EVALUABLE_FIELD",
      },
    });

    const negatives =
      v2.presentation.criticalNegatives.items;

    assert.ok(
      negatives.includes(
        "Blastos/blastoides",
      ),
    );

    assert.ok(
      !negatives.includes(
        "Bastonetes de Auer",
      ),
    );

    assert.ok(
      !negatives.includes(
        "Esquizócitos clinicamente relevantes",
      ),
    );

    assert.ok(
      !negatives.includes(
        "Hemoparasitas com evidência estruturada",
      ),
    );
  },
);

/* -------------------------------------------------------------------------- */
/* PRESENTATION GROUP EXCLUSIVITY                                              */
/* -------------------------------------------------------------------------- */

test(
  "PASS 6 — one finding cannot simultaneously be suspicious and negative",
  () => {
    const v2 = project({
      findings: {
        blastSuspicion: true,
        blastEvidenceState:
          "SUSPICIOUS_INDETERMINATE",
      },
    });

    const suspicious =
      v2.presentation.evidenceGroups.suspicious;

    const negatives =
      v2.presentation.criticalNegatives.items;

    assert.ok(
      suspicious.includes(
        "Blastos/blastoides",
      ),
    );

    assert.ok(
      !negatives.includes(
        "Blastos/blastoides",
      ),
    );
  },
);