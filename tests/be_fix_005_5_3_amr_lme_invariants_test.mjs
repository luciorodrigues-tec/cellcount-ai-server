import assert from "node:assert/strict";

import {
  createLocalMorphologyEvidence,
  attachLocalMorphologyEvidence,
  enrichLocalMorphologyEvidenceWithEngines,
  localMorphologyEvidenceContractStatus,
} from "../ai/localMorphologyEvidenceContract.js";

import {
  evaluateFieldAdequacy,
  applyFieldAdequacyRules,
} from "../ai/fieldAdequacyEngine.js";

import {
  applyFinalClinicalGovernor,
} from "../ai/finalClinicalGovernor.js";

import {
  applyFieldScopedNegativeFindings,
} from "../ai/fieldScopedNegativeFindings.js";

import {
  createAcademicMorphologyReasoning,
  attachAcademicMorphologyReasoning,
  academicMorphologyReasoningContractStatus,
} from "../ai/academicMorphologyReasoningContract.js";

function clone(value) {
  return structuredClone(value);
}

function buildVisionFixture() {
  return {
    localMorphologyEvidence: {
      field: {
        description:
          "Campo único com numerosas hemácias e múltiplas células nucleadas morfologicamente avaliáveis.",
        technicalQuality:
          "Iluminação heterogênea e artefatos ópticos periféricos.",
        technicalLimitations: [
          "Campo isolado e qualidade técnica heterogênea.",
        ],
      },
      erythrocytes: {
        evaluable: true,
        description:
          "Hemácias visíveis com irregularidades de contorno em parte das células.",
        anisocytosis: "discreta variação aparente de tamanho",
        poikilocytosis: "irregularidade de forma em parte das hemácias",
        observations: [
          "Há hemácias morfologicamente avaliáveis no campo.",
        ],
      },
      leukocytes: {
        evaluable: true,
        observedCellCount: 6,
        description:
          "Múltiplas células nucleadas com heterogeneidade morfológica local.",
        heterogeneity: "heterogênea",
        nuclearMorphology:
          "configuração nuclear variável entre as células avaliáveis",
        chromatin:
          "padrões de cromatina distinguíveis em parte das células",
        cytoplasm: "citoplasma avaliável em parte das células",
        nucleoli: "",
        observations: [
          "Há múltiplos elementos nucleados avaliáveis.",
        ],
      },
      platelets: {
        evaluable: true,
        description:
          "Pequenos elementos plaquetários são observáveis no campo.",
        distribution:
          "dispersão local avaliável; estimativa global não permitida",
        observations: [
          "Elementos plaquetários estão presentes no campo.",
        ],
      },
      criticalMorphology: {
        blastLikeMorphology: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
        auerRod: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
      },
      positiveEvidence: [
        "Múltiplas células nucleadas são visualizadas.",
        "Hemácias apresentam irregularidades morfológicas locais.",
      ],
      uncertainties: [
        "A imagem isolada não permite inferência populacional global.",
      ],
      academicReasoning: {
        whatISee: [],
        whatItResembles: [
          "Padrão morfológico local indeterminado; considerar alterações reacionais apenas se sustentadas por outros campos.",
        ],
        evidenceFor: [
          "Heterogeneidade morfológica entre os elementos nucleados avaliáveis.",
        ],
        evidenceAgainst: [],
        differentialMorphology: [
          "Alteração reacional versus outra população mononuclear atípica, sem conclusão definitiva pela imagem isolada.",
        ],
        cannotConfirm: [],
        teachingPoints: [],
      },
    },
    morphologyAnalysis: {
      overview: "Campo com material morfológico localmente avaliável.",
      erythrocyteReview:
        "Hemácias com irregularidades de contorno observáveis.",
      leukocyteReview:
        "Múltiplos elementos nucleados morfologicamente avaliáveis.",
      plateletReview:
        "Elementos plaquetários observáveis no campo.",
    },
    whatAISees: {
      globalField: "Campo com hemácias e múltiplas células nucleadas.",
      erythrocytes:
        "Hemácias com irregularidades locais observáveis.",
      leukocytes: "Múltiplas células nucleadas avaliáveis.",
      platelets: "Elementos plaquetários observáveis.",
    },
    fieldAdequacy: {
      visibleLeukocytes: 6,
    },
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      monomorphicPopulation: false,
    },
  };
}

function buildPipeline(input) {
  const vision = clone(input);

  let lme = createLocalMorphologyEvidence({
    visionResponse: vision,
    analysisSource: "ai_visual",
  });

  assert.equal(
    localMorphologyEvidenceContractStatus(lme).valid,
    true,
    "LME-1.0 contract invalid",
  );

  let result = attachLocalMorphologyEvidence(clone(vision), lme);

  // 005.2
  const originalLme = clone(result.localMorphologyEvidence);
  const originalMorphology = clone(result.morphologyAnalysis);
  result = applyFieldAdequacyRules(result);

  assert.deepEqual(
    result.localMorphologyEvidence,
    originalLme,
    "Field Adequacy modified canonical LME",
  );

  for (const key of [
    "overview",
    "erythrocyteReview",
    "leukocyteReview",
    "plateletReview",
  ]) {
    assert.equal(
      result.morphologyAnalysis[key],
      originalMorphology[key],
      `Field Adequacy overwrote direct morphology: ${key}`,
    );
  }

  lme = enrichLocalMorphologyEvidenceWithEngines(lme, {
    erythrocyteAnalysis: {
      findings: ["Irregularidade eritrocitária local observável."],
    },
    leukocyteAnalysis: {
      findings: ["Elementos nucleados morfologicamente avaliáveis."],
    },
    plateletAnalysis: {
      findings: ["Elementos plaquetários observáveis."],
    },
  });

  result = attachLocalMorphologyEvidence(result, lme);

  // 005.5
  let amr = createAcademicMorphologyReasoning({
    localMorphologyEvidence: result.localMorphologyEvidence,
    fieldAdequacy: result.fieldAdequacy,
    evidenceGovernance: result.evidenceGovernance,
  });

  assert.equal(
    academicMorphologyReasoningContractStatus(amr).valid,
    true,
    "AMR-1.0 contract invalid before governor",
  );

  result = attachAcademicMorphologyReasoning(result, amr);

  // 005.3
  const lmeBeforeGovernor = clone(result.localMorphologyEvidence);
  result = applyFinalClinicalGovernor(result);

  assert.deepEqual(
    result.localMorphologyEvidence,
    lmeBeforeGovernor,
    "Final Clinical Governor modified canonical LME",
  );

  // 005.4
  result = applyFieldScopedNegativeFindings(result);

  // 005.5.2 final lock: rebuild AMR from protected evidence after all governors.
  amr = createAcademicMorphologyReasoning({
    localMorphologyEvidence: result.localMorphologyEvidence,
    fieldAdequacy: result.fieldAdequacy,
    evidenceGovernance: result.evidenceGovernance,
  });

  result = attachAcademicMorphologyReasoning(result, amr);

  return result;
}

// 0 — VERSION/PREFLIGHT CONTRACT
{
  const adequacy = evaluateFieldAdequacy(buildVisionFixture());

  assert.equal(
    adequacy.contractVersion,
    "FA-4.0",
    "PRECHECK FAILED: fieldAdequacyEngine is not BE-FIX-005.2 / FA-4.0",
  );
  assert.equal(
    adequacy.populationInferenceAllowed,
    false,
    "PRECHECK FAILED: populationInferenceAllowed is missing or incorrect",
  );
  assert.equal(
    adequacy.morphologyDescriptionAllowed,
    true,
    "PRECHECK FAILED: morphologyDescriptionAllowed is missing or incorrect",
  );

  console.log("PASS 0 — expected 005.2/005.3/005.4/005.5 contracts are present");
}

// 1 — LIMITED_FIELD + MORPHOLOGY_PRESENT
{
  const result = buildPipeline(buildVisionFixture());

  assert.equal(result.fieldAdequacy.limitedField, true);
  assert.equal(result.fieldAdequacy.populationInferenceAllowed, false);
  assert.equal(result.fieldAdequacy.morphologyDescriptionAllowed, true);

  assert.equal(result.localMorphologyEvidence.evidenceAvailable, true);
  assert.ok(result.localMorphologyEvidence.erythrocytes.description);
  assert.ok(result.localMorphologyEvidence.leukocytes.description);
  assert.ok(result.localMorphologyEvidence.platelets.description);

  assert.equal(
    result.academicMorphologyReasoning.reasoningScope,
    "FIELD_SCOPED",
  );
  assert.ok(result.academicMorphologyReasoning.whatISee.length > 0);
  assert.ok(result.academicMorphologyReasoning.cannotConfirm.length > 0);

  console.log("PASS 1 — limited field preserves LME and AMR");
}

// 2 — NO SYNTHETIC MORPHOLOGY
{
  const result = buildPipeline(buildVisionFixture());
  const features = result.academicMorphologyReasoning.morphologicFeatures;

  assert.equal(
    features.some(
      (item) =>
        item.feature === "nucleoli" &&
        String(item.observation || "").trim().length > 0,
    ),
    false,
    "AMR synthesized a nucleolar finding absent from LME",
  );

  assert.equal(
    result.academicMorphologyReasoning.provenance.syntheticMorphologyForbidden,
    true,
  );

  console.log("PASS 2 — AMR does not synthesize unobserved morphology");
}

// 3 — POSITIVE BLAST MUST NOT BECOME NEGATIVE
{
  const fixture = buildVisionFixture();
  fixture.findings.blastSuspicion = true;
  fixture.findings.immatureCells = true;
  fixture.localMorphologyEvidence.criticalMorphology = {
    blastLikeMorphology: "OBSERVED_OR_SUSPECTED",
  };

  const result = buildPipeline(fixture);
  const blast = result.negativeFindingScope.items.find(
    (item) => item.key === "blasts",
  );

  assert.equal(blast.status, "OBSERVED_OR_SUSPECTED");
  assert.equal(
    result.negativeFindingsStructured.some((item) =>
      /Blastos inequívocos/i.test(item),
    ),
    false,
    "Positive blast evidence was emitted as a negative finding",
  );

  console.log("PASS 3 — positive blast evidence never becomes negative");
}

// 4 — NEGATIVES REMAIN FIELD-SCOPED
{
  const result = buildPipeline(buildVisionFixture());

  assert.equal(
    result.negativeFindingScope.globalNegativeExclusionAllowed,
    false,
  );

  for (const item of result.negativeFindingScope.items) {
    if (item.status === "NOT_OBSERVED_IN_EVALUABLE_FIELD") {
      assert.match(item.statement, /neste campo/i);
      assert.match(item.statement, /não permite exclusão global/i);
    }
  }

  console.log("PASS 4 — negative findings remain field-scoped");
}

// 5 — NOT_ASSESSABLE REMAINS INDETERMINATE
{
  const result = applyFieldScopedNegativeFindings({
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
    },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: false,
    },
    findings: {},
  });

  const blast = result.negativeFindingScope.items.find(
    (item) => item.key === "blasts",
  );

  assert.equal(blast.status, "NOT_ASSESSABLE");
  assert.match(blast.statement, /não avaliáveis com segurança/i);

  console.log("PASS 5 — NOT_ASSESSABLE remains indeterminate");
}

// 6 — AMR DOES NOT MUTATE LME
{
  const lme = createLocalMorphologyEvidence({
    visionResponse: buildVisionFixture(),
    analysisSource: "ai_visual",
  });
  const before = clone(lme);

  createAcademicMorphologyReasoning({
    localMorphologyEvidence: lme,
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
    },
  });

  assert.deepEqual(lme, before);

  console.log("PASS 6 — AMR derivation leaves canonical LME immutable");
}

// 7 — GOVERNOR RESTRICTS INFERENCE, NOT EVIDENCE
{
  const result = buildPipeline(buildVisionFixture());

  assert.equal(result.finalClassification, "CLASS_1_LIMITED_FIELD");
  assert.equal(result.evidenceGovernance.limitedField, true);
  assert.equal(result.evidenceGovernance.populationInferenceAllowed, false);
  assert.equal(
    result.evidenceGovernance.globalNegativeExclusionAllowed,
    false,
  );
  assert.equal(
    result.evidenceGovernance.morphologyDescriptionAllowed,
    true,
  );

  assert.match(
    result.localMorphologyEvidence.leukocytes.description,
    /Múltiplas células nucleadas/i,
  );

  console.log("PASS 7 — governor restricts inference without erasing evidence");
}

// 8 — AMR CANNOT BE EMPTY WHEN EVIDENCE EXISTS
{
  const result = buildPipeline(buildVisionFixture());
  const status = academicMorphologyReasoningContractStatus(
    result.academicMorphologyReasoning,
  );

  assert.equal(status.valid, true);
  assert.ok(result.academicMorphologyReasoning.whatISee.length > 0);
  assert.ok(result.academicMorphologyReasoning.cannotConfirm.length > 0);

  console.log("PASS 8 — AMR is populated when morphology evidence exists");
}

console.log("");
console.log("================================================================");
console.log("BE-FIX-005.5.3 — AMR/LME END-TO-END INVARIANTS: ALL PASSED");
console.log("================================================================");
