import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildPrimaryVisualMorphologyAcquisitionPrompt,
  buildVisualMorphologyAcquisitionResponseFormat,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";
import {
  createLocalMorphologyEvidence,
  PERIPHERAL_BLASTOID_CYTOLOGY_LME_VERSION,
} from "../ai/localMorphologyEvidenceContract.js";
import {
  evaluatePeripheralBlastoidCytologyAuthority,
  applyPeripheralBlastoidCytologyAuthority,
  applyPeripheralNegativeFindingAuthorityControl,
  PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
  PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION,
} from "../ai/peripheralBlastoidCytologyAuthorityEngine.js";
import { applySingleBlastSentinel } from "../ai/singleBlastSentinel.js";
import { applyFieldScopedNegativeFindings } from "../ai/fieldScopedNegativeFindings.js";
import { buildCanonicalClinicalTruth } from "../ai/clinicalResultV2/canonicalClinicalTruthBuilder.js";

function rawPeripheral({
  state = "SUSPICIOUS_INDETERMINATE",
  featureCount = 3,
  highNCRatio = "OBSERVED",
  openFineChromatin = "OBSERVED",
  nucleoli = "OBSERVED",
  scantBasophilicCytoplasm = "NOT_ASSESSABLE",
  largeCellSize = "OBSERVED",
  candidate = true,
} = {}) {
  return {
    observedMorphology: {
      globalField: "Campo periférico limitado com hemácias e uma célula nucleada focal.",
      technicalQuality: "Qualidade moderada.",
      representativity: "Campo limitado.",
      erythrocytes: {
        description: "Hemácias avaliáveis.",
        size: "predominantemente normocíticas",
        chromia: "policromasia focal",
        polychromasiaState: "OBSERVED",
        polychromasiaEvidence: "Algumas hemácias azuladas/acinzentadas.",
        anisocytosis: "discreta",
        poikilocytosis: "não proeminente",
        specificForms: [],
        artifactConsiderations: "",
      },
      leukocytes: {
        description: "Uma célula hematopoiética grande com cromatina menos condensada.",
        approximateVisibleCells: 1,
        countStatus: "OBSERVED_COUNT",
        heterogeneity: "campo limitado",
        nuclearMorphology: "relação N:C aumentada",
        chromatin: "frouxa/fina",
        nucleoli: "nucléolo visível",
        cytoplasm: "escasso a moderado",
        maturation: "imaturo suspeito",
        atypia: "citologia imatura focal",
        blastLikeFeatures: "N:C aumentada, cromatina frouxa, nucléolo",
        hematopoieticCellCandidate: candidate,
        focalImmatureCellState: state,
        focalImmatureCellEvidence: "Célula focal com traços de imaturidade.",
        focalBlastoidCytology: {
          state,
          cellCount: 1,
          highNCRatio,
          openFineChromatin,
          nucleoli,
          scantBasophilicCytoplasm,
          largeCellSize,
          featureCount,
          evidence: "N:C aumentada, cromatina fina/frouxa e nucléolo visível.",
          reactiveMimicFeatures: "Mimetismo reacional não excluível pela imagem isolada.",
        },
      },
      platelets: {
        description: "Plaquetas esparsas.",
        distribution: "dispersas",
        size: "habitual",
        aggregates: "não avaliáveis globalmente",
      },
      parasites: {
        evidenceState: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
        approximateVisibleForms: 0,
        phenotype: "NONE",
        morphology: "",
        extracellular: false,
        elongatedOrCurved: false,
        undulatingMembraneLike: false,
        flagellumLike: false,
        kinetoplastLike: false,
        intracellularForms: false,
        artifactDifferential: "",
        confidence: "low",
      },
      artifacts: [],
      positiveEvidence: [],
      uncertainty: [],
    },
    fieldAdequacy: {
      visibleLeukocytes: 1,
      adequateForLeukocyteAnalysis: true,
      adequateForBlastScreening: true,
      adequateForPopulationAssessment: false,
      limitedField: true,
      limitationReason: "Campo único.",
    },
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      blastEvidenceState: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    },
    imageQuality: { summary: "moderada" },
    visualEvidence: {},
    positiveFindings: [],
    negativeFindingsStructured: [],
    heatmapRegions: [],
  };
}

function resultFromRaw(raw) {
  return {
    rawResponse: raw,
    localMorphologyEvidence: createLocalMorphologyEvidence({
      visionResponse: raw,
      analysisSource: "ai_visual",
    }),
    findings: { ...raw.findings },
    fieldAdequacy: { ...raw.fieldAdequacy },
    morphologyAnalysis: {
      erythrocyteReview: raw.observedMorphology.erythrocytes.description,
      leukocyteReview: raw.observedMorphology.leukocytes.description,
      plateletReview: raw.observedMorphology.platelets.description,
    },
    whatAISees: {},
    overallAssessment: {},
    positiveFindings: [],
  };
}

test("PASS 0 — 005.50.5 identities and VME schema are registered", () => {
  assert.equal(PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION, "BE-FIX-005.50.5");
  assert.equal(PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION, "BE-FIX-005.50.5");
  assert.equal(PERIPHERAL_BLASTOID_CYTOLOGY_LME_VERSION, "BE-FIX-005.50.5");
  assert.match(buildPrimaryVisualMorphologyAcquisitionPrompt(), /focalBlastoidCytology/);
  const schema = JSON.stringify(buildVisualMorphologyAcquisitionResponseFormat());
  assert.match(schema, /focalBlastoidCytology/);
  assert.match(schema, /openFineChromatin/);
});

test("PASS 1 — LME preserves structured focal blastoid cytology", () => {
  const lme = createLocalMorphologyEvidence({
    visionResponse: rawPeripheral(),
    analysisSource: "ai_visual",
  });
  assert.equal(lme.leukocytes.focalBlastoidCytology.state, "SUSPICIOUS_INDETERMINATE");
  assert.equal(lme.leukocytes.focalBlastoidCytology.featureCount, 3);
  assert.equal(lme.leukocytes.blastoidCytologyVersion, "BE-FIX-005.50.5");
});

test("PASS 2 — >=2 independent blastoid features cannot remain hard-negative", () => {
  const result = resultFromRaw(rawPeripheral({
    state: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    featureCount: 2,
    nucleoli: "NOT_ASSESSABLE",
  }));
  const decision = evaluatePeripheralBlastoidCytologyAuthority(result);
  assert.equal(decision.effectiveState, "SUSPICIOUS_INDETERMINATE");
  assert.equal(decision.active, true);
  assert.equal(decision.populationInferenceAllowed, false);
});

test("PASS 3 — unsupported OBSERVED state is downgraded instead of overcalled", () => {
  const result = resultFromRaw(rawPeripheral({
    state: "OBSERVED",
    featureCount: 1,
    openFineChromatin: "NOT_ASSESSABLE",
    nucleoli: "NOT_ASSESSABLE",
    scantBasophilicCytoplasm: "NOT_ASSESSABLE",
    largeCellSize: "NOT_ASSESSABLE",
  }));
  const decision = evaluatePeripheralBlastoidCytologyAuthority(result);
  assert.notEqual(decision.effectiveState, "OBSERVED");
});

test("PASS 4 — qualified focal cytology projects into single-blast sentinel without population claim", () => {
  let result = resultFromRaw(rawPeripheral());
  result = applyPeripheralBlastoidCytologyAuthority(result);
  result = applySingleBlastSentinel(result);
  assert.equal(result.singleBlastSentinel.active, true);
  assert.equal(result.singleBlastSentinel.evidenceState, "SUSPICIOUS_INDETERMINATE");
  assert.equal(result.findings.blastSuspicion, true);
  assert.equal(result.peripheralBlastoidCytologyAuthority.populationInferenceAllowed, false);
  assert.notEqual(result.peripheralMorphologyClassification, "BLAST_POPULATION");
});

test("PASS 5 — positive focal blastoid evidence outranks Auer/schistocyte negative presentation", () => {
  let result = resultFromRaw(rawPeripheral());
  result.localMorphologyEvidence.criticalMorphology.auerRod = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  result.localMorphologyEvidence.criticalMorphology.schistocytes = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  result = applyPeripheralBlastoidCytologyAuthority(result);
  result = applySingleBlastSentinel(result);
  result = applyFieldScopedNegativeFindings(result);
  result = applyPeripheralNegativeFindingAuthorityControl(result);

  assert.equal(result.negativeFindingAuthority.blastPositive, true);
  assert.equal(
    result.negativeFindingAuthority.secondaryItems.some((x) => x.key === "auerRods"),
    true,
  );
  assert.equal(
    result.negativeFindingAuthority.secondaryItems.some((x) => x.key === "schistocytes"),
    true,
  );
  assert.equal(
    result.negativeFindingsStructured.some((x) => /Bastonetes de Auer/.test(x)),
    false,
  );
  assert.equal(
    result.negativeFindingsStructured.some((x) => /Esquizócitos/.test(x)),
    false,
  );
});

test("PASS 6 — canonical truth marks demoted negatives as secondary detail", () => {
  let result = resultFromRaw(rawPeripheral());
  result.localMorphologyEvidence.criticalMorphology.auerRod = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  result.localMorphologyEvidence.criticalMorphology.schistocytes = "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  result = applyPeripheralBlastoidCytologyAuthority(result);
  result = applySingleBlastSentinel(result);
  result = applyFieldScopedNegativeFindings(result);
  result = applyPeripheralNegativeFindingAuthorityControl(result);

  const truth = buildCanonicalClinicalTruth(result, {
    specimenType: "PERIPHERAL_BLOOD",
    analysisSource: "ai_visual",
  });

  assert.equal(truth.criticalFindings.blastLike.presentationAuthority, "PRIMARY_POSITIVE");
  assert.equal(truth.criticalFindings.auerRods.presentationAuthority, "SECONDARY_DETAIL");
  assert.equal(truth.criticalFindings.auerRods.suppressFromExecutiveCriticalList, true);
  assert.equal(truth.criticalFindings.schistocytes.suppressFromExecutiveCriticalList, true);
});

test("PASS 7 — clinical context alone cannot fabricate focal blastoid cytology", () => {
  const raw = rawPeripheral({
    state: "NOT_ASSESSABLE",
    featureCount: 0,
    highNCRatio: "NOT_ASSESSABLE",
    openFineChromatin: "NOT_ASSESSABLE",
    nucleoli: "NOT_ASSESSABLE",
    scantBasophilicCytoplasm: "NOT_ASSESSABLE",
    largeCellSize: "NOT_ASSESSABLE",
    candidate: false,
  });
  raw.clinicalContext = "Paciente com LMA.";
  const result = resultFromRaw(raw);
  const decision = evaluatePeripheralBlastoidCytologyAuthority(result);
  assert.equal(decision.active, false);
  assert.equal(decision.amlDiagnosisAllowed, false);
});

test("PASS 8 — true mature/non-blast morphology stays negative", () => {
  const result = resultFromRaw(rawPeripheral({
    state: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    featureCount: 0,
    highNCRatio: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    openFineChromatin: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    nucleoli: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    scantBasophilicCytoplasm: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    largeCellSize: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
  }));
  const decision = evaluatePeripheralBlastoidCytologyAuthority(result);
  assert.equal(decision.active, false);
  assert.equal(decision.effectiveState, "NOT_OBSERVED_IN_EVALUABLE_FIELD");
});

test("PASS 9 — server orders 005.50.5 before sentinel and after negative scope with runtime fingerprints", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /peripheralBlastoidCytologyAuthorityVersion/);
  assert.match(server, /peripheralNegativeFindingAuthorityControlVersion/);
  assert.match(server, /peripheralFocalVsPopulationSeparationVersion/);

  const pre = server.indexOf("BE-FIX-005.50.5 — PERIPHERAL BLASTOID CYTOLOGY AUTHORITY / PRE-SENTINEL");
  const sentinel = server.indexOf("BE-FIX-005.13 — SINGLE BLAST SENTINEL");
  const terminal = server.indexOf("BE-FIX-005.50.5 — PERIPHERAL BLASTOID / NEGATIVE-FINDING TERMINAL AUTHORITY");
  assert.ok(pre >= 0 && sentinel > pre);
  assert.ok(terminal > sentinel);
});
