// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.7 — FOCAL HEMATOPOIETIC CELL DEEP CYTOMORPHOLOGY ACQUISITION
//                   & MATURATION-STATE RESOLUTION
// ============================================================================

export const PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION = "BE-FIX-005.50.7";
export const PERIPHERAL_MATURATION_STATE_RESOLUTION_VERSION = "BE-FIX-005.50.7";
export const PERIPHERAL_CELL_FEATURE_PROVENANCE_VERSION = "BE-FIX-005.50.7";

const POSITIVE = "OBSERVED";
const NEGATIVE = "NOT_OBSERVED_IN_EVALUABLE_CELL";
const UNKNOWN = "NOT_ASSESSABLE";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asArray(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.trim() : ""; }
function upper(value) { return text(value).toUpperCase(); }
function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function state(value) {
  const v = upper(value);
  return [POSITIVE, NEGATIVE, UNKNOWN].includes(v) ? v : UNKNOWN;
}
function isPositive(value) { return state(value) === POSITIVE; }
function isNegative(value) { return state(value) === NEGATIVE; }
function unique(values = []) {
  return [...new Set(values.map((v) => text(v)).filter(Boolean))];
}

const FEATURE_KEYS = [
  "largeCellSize",
  "highNCRatio",
  "openFineChromatin",
  "visibleNucleoli",
  "irregularNuclearContour",
  "segmentedOrLobulatedNucleus",
  "condensedChromatin",
  "scantCytoplasm",
  "basophilicCytoplasm",
  "cytoplasmicGranules",
  "cytoplasmicInclusions",
];

function sourceOf(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const lmeWbc = asObject(lme.leukocytes);
  const rawWbc = asObject(asObject(asObject(result.rawResponse).observedMorphology).leukocytes);
  const currentWbc = asObject(asObject(result.observedMorphology).leukocytes);
  const deep = {
    ...asObject(rawWbc.focalCellCytomorphology),
    ...asObject(currentWbc.focalCellCytomorphology),
    ...asObject(lmeWbc.focalCellCytomorphology),
  };
  return { lme, lmeWbc, rawWbc, currentWbc, deep };
}

function featureMap(deep = {}) {
  const out = {};
  for (const key of FEATURE_KEYS) out[key] = state(deep[key]);
  return out;
}

export function evaluatePeripheralFocalHematopoieticCytomorphology(result = {}) {
  const { lmeWbc, rawWbc, currentWbc, deep } = sourceOf(result);
  const hematopoieticCandidate =
    lmeWbc.hematopoieticCellCandidate === true ||
    rawWbc.hematopoieticCellCandidate === true ||
    currentWbc.hematopoieticCellCandidate === true;

  const cellCount =
    finite(deep.cellCount) ??
    finite(lmeWbc.observedCellCount) ??
    finite(rawWbc.approximateVisibleCells) ??
    finite(currentWbc.approximateVisibleCells);

  const deepObserved = upper(deep.state) === "OBSERVED";
  const features = featureMap(deep);
  const evaluatedFeatureCount = Object.values(features).filter((v) => v !== UNKNOWN).length;

  // Core nuclear immaturity. High N:C or scant cytoplasm alone are common in
  // mature small lymphocytes and therefore never authorize blastoid suspicion.
  const nuclearImmaturity = [features.openFineChromatin, features.visibleNucleoli]
    .filter((v) => v === POSITIVE).length;
  const otherImmaturity = [
    features.highNCRatio,
    features.scantCytoplasm,
    features.basophilicCytoplasm,
    features.largeCellSize,
  ].filter((v) => v === POSITIVE).length;
  const immatureFeatureCount = nuclearImmaturity + otherImmaturity;

  const matureFeatureCount = [
    features.condensedChromatin,
    features.segmentedOrLobulatedNucleus,
  ].filter((v) => v === POSITIVE).length + [
    features.openFineChromatin,
    features.visibleNucleoli,
  ].filter((v) => v === NEGATIVE).length;

  const coreNuclearAssessable =
    features.openFineChromatin !== UNKNOWN &&
    features.visibleNucleoli !== UNKNOWN &&
    features.condensedChromatin !== UNKNOWN;

  const immatureOrBlastoidSupported =
    hematopoieticCandidate &&
    deepObserved &&
    nuclearImmaturity >= 1 &&
    immatureFeatureCount >= 2;

  const matureSupported =
    hematopoieticCandidate &&
    deepObserved &&
    coreNuclearAssessable &&
    matureFeatureCount >= 3 &&
    nuclearImmaturity === 0;

  let maturationState = "INDETERMINATE";
  if (immatureOrBlastoidSupported) maturationState = "IMMATURE_OR_BLASTOID_SUSPECTED";
  else if (matureSupported) maturationState = "MATURE_SUPPORTED";

  const insufficientDeepCytomorphology =
    hematopoieticCandidate &&
    (!deepObserved || evaluatedFeatureCount < 5 || !coreNuclearAssessable);

  const provenance = {};
  for (const key of FEATURE_KEYS) {
    provenance[key] = {
      state: features[key],
      source: "focal_hematopoietic_cell_1",
      evidence: text(deep[`${key}Evidence`]),
    };
  }

  const descriptions = {
    relativeSize: text(deep.relativeSizeDescription),
    nucleus: text(deep.nuclearDescription),
    chromatin: text(deep.chromatinDescription),
    nucleoli: text(deep.nucleoliDescription),
    cytoplasm: text(deep.cytoplasmDescription),
    granulation: text(deep.granulationDescription),
    inclusions: text(deep.inclusionDescription),
  };

  return {
    version: PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
    hematopoieticCandidate,
    cellCount,
    deepObserved,
    evaluatedFeatureCount,
    coreNuclearAssessable,
    immatureFeatureCount,
    matureFeatureCount,
    immatureOrBlastoidSupported,
    matureSupported,
    maturationState,
    insufficientDeepCytomorphology,
    modelMaturationImpression: upper(deep.modelMaturationImpression) || "INDETERMINATE",
    descriptions,
    features,
    provenance,
    evidenceSummary: text(deep.evidenceSummary),
    populationInferenceAllowed: false,
    diagnosisAllowed: false,
  };
}

function projectBlastoidCytology(result, resolution) {
  const lme = asObject(result.localMorphologyEvidence);
  lme.leukocytes = asObject(lme.leukocytes);
  const old = asObject(lme.leukocytes.focalBlastoidCytology);
  const oldState = upper(old.effectiveState || old.state);
  const oldPositive = ["OBSERVED", "SUSPICIOUS_INDETERMINATE"].includes(oldState);

  // Never downgrade directly acquired positive blastoid evidence from 005.50.5/6.
  if (!oldPositive) {
    const f = resolution.features;
    if (resolution.immatureOrBlastoidSupported) {
      const projected = {
        highNCRatio: f.highNCRatio === POSITIVE ? "OBSERVED" : "NOT_ASSESSABLE",
        openFineChromatin: f.openFineChromatin === POSITIVE ? "OBSERVED" : "NOT_ASSESSABLE",
        nucleoli: f.visibleNucleoli === POSITIVE ? "OBSERVED" : "NOT_ASSESSABLE",
        scantBasophilicCytoplasm:
          f.scantCytoplasm === POSITIVE && f.basophilicCytoplasm === POSITIVE
            ? "OBSERVED"
            : "NOT_ASSESSABLE",
        largeCellSize: f.largeCellSize === POSITIVE ? "OBSERVED" : "NOT_ASSESSABLE",
      };
      const featureCount = Object.values(projected).filter((v) => v === "OBSERVED").length;
      lme.leukocytes.focalBlastoidCytology = {
        ...old,
        ...projected,
        state: featureCount >= 2 ? "SUSPICIOUS_INDETERMINATE" : "NOT_ASSESSABLE",
        featureCount,
        cellCount: resolution.cellCount,
        evidence: resolution.evidenceSummary || "Citomorfologia focal estruturada com traços de imaturidade.",
        deepCytomorphologyVersion: PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
      };
      lme.leukocytes.focalImmatureCellState =
        featureCount >= 2 ? "SUSPICIOUS_INDETERMINATE" : "NOT_ASSESSABLE";
    } else if (resolution.maturationState === "INDETERMINATE") {
      lme.leukocytes.focalBlastoidCytology = {
        ...old,
        state: "NOT_ASSESSABLE",
        featureCount: 0,
        cellCount: resolution.cellCount,
        evidence: resolution.evidenceSummary || "Citomorfologia focal incompletamente avaliável; negativo blastoide não autorizado.",
        deepCytomorphologyVersion: PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
      };
      lme.leukocytes.focalImmatureCellState = "NOT_ASSESSABLE";
    }
  }

  result.localMorphologyEvidence = lme;
  return result;
}

function buildCellSummary(resolution) {
  const d = resolution.descriptions;
  return unique([
    d.relativeSize,
    d.nucleus,
    d.chromatin,
    d.nucleoli,
    d.cytoplasm,
    d.granulation,
    d.inclusions,
  ]).join(" ");
}

export function applyPeripheralFocalHematopoieticCytomorphologyResolution(result = {}) {
  if (!result || typeof result !== "object") return result;

  const resolution = evaluatePeripheralFocalHematopoieticCytomorphology(result);
  result.peripheralFocalHematopoieticCytomorphology = resolution;
  projectBlastoidCytology(result, resolution);

  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.morphologyAnalysis.cellMorphology = asObject(result.morphologyAnalysis.cellMorphology);

  if (resolution.hematopoieticCandidate) {
    result.morphologyAnalysis.cellMorphology.focalHematopoieticCell = {
      version: PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
      cellCount: resolution.cellCount,
      maturationState: resolution.maturationState,
      evaluatedFeatureCount: resolution.evaluatedFeatureCount,
      coreNuclearAssessable: resolution.coreNuclearAssessable,
      descriptions: resolution.descriptions,
      features: resolution.features,
      provenance: resolution.provenance,
      evidenceSummary: resolution.evidenceSummary,
      populationInferenceAllowed: false,
    };

    result.findings = asObject(result.findings);
    result.findings.focalHematopoieticCellObserved = true;
    result.findings.focalCellMaturationState = resolution.maturationState;

    const summary = buildCellSummary(resolution);
    if (summary) {
      const existing = text(result.morphologyAnalysis.leukocyteReview);
      if (!existing.includes(summary)) {
        result.morphologyAnalysis.leukocyteReview = [existing, summary].filter(Boolean).join(" ");
      }
    }

    if (resolution.maturationState === "INDETERMINATE") {
      // Do not fabricate blast suspicion. Do prevent the legacy pipeline from
      // calling the same incompletely characterized cell definitively mature.
      result.findings.focalImmatureCellState = "NOT_ASSESSABLE";
      if (upper(result.findings.blastEvidenceState) === "NOT_OBSERVED_IN_EVALUABLE_FIELD") {
        result.findings.blastEvidenceState = "NOT_ASSESSABLE";
      }
      result.normalityBlocked = true;
      result.requiresHumanReview = true;
      result.blockNormalReason = unique([
        ...asArray(result.blockNormalReason),
        "Célula hematopoiética focal com citomorfologia nuclear/citoplasmática incompletamente resolvida.",
      ]);
    }
  }

  return result;
}

export default applyPeripheralFocalHematopoieticCytomorphologyResolution;
