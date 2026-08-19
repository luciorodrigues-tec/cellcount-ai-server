// BE/FE-FIX-005.50.9 — Focal Blastoid Clinical Presentation Consolidation
export const CANONICAL_CLINICAL_PRESENTATION_BASE_VERSION = "BE/FE-FIX-005.50.8";
export const CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION = "BE/FE-FIX-005.50.9";

export const CANONICAL_CLINICAL_PRESENTATION_GATE_INHERITANCE_VERSION =
  "BE-FIX-005.50.22";
export const CANONICAL_CLINICAL_PRESENTATION_LAST_WRITER_VERSION =
  "BE-FIX-005.50.22";
export const CANONICAL_CLINICAL_PRESENTATION_FOCAL_PROVENANCE_VERSION =
  "BE-FIX-005.50.23";

const text = (v) => (typeof v === "string" ? v.trim() : "");
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

function norm(v) {
  return text(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function sameMeaning(a, b) {
  const x = norm(a); const y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const xs = new Set(x.split(" ").filter((w) => w.length > 3));
  const ys = new Set(y.split(" ").filter((w) => w.length > 3));
  if (!xs.size || !ys.size) return false;
  let common = 0; for (const w of xs) if (ys.has(w)) common++;
  return common / Math.min(xs.size, ys.size) >= 0.72;
}
function firstUnique(candidates, used = []) {
  for (const candidate of candidates) {
    const value = text(candidate);
    if (!value) continue;
    if (used.some((u) => sameMeaning(value, u))) continue;
    return value;
  }
  return "";
}
function blastState(v2) { return text(v2?.criticalFindings?.blastLike?.state).toUpperCase(); }

function boolOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function firstBoolean(values = []) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

function evidenceState(value) {
  return text(value).toUpperCase();
}

function readMarrowPresentationScope(result = {}) {
  const provenance = obj(
    result.marrowFocalBlastoidAuthorityProvenance ||
    result.rawResponse?.marrowFocalBlastoidAuthorityProvenance,
  );
  const terminal = obj(result.marrowFocalBlastoidTerminalAuthority);
  const lock = obj(result.marrowPositiveCellLevelBlastoidScopeLock);
  const governance = obj(result.evidenceGovernance);
  const globalPattern = obj(result.globalPattern);
  const recovery = obj(result.marrowTrueAmlPositiveCytomorphologyRecovery);
  const population = obj(result.marrowBlastPopulationEvidence);
  const rawBlast = obj(result.rawResponse?.blastAssessment);
  const directBlast = obj(result.blastAssessment);

  const marrowContext =
    Object.keys(provenance).length > 0 ||
    Object.keys(terminal).length > 0 ||
    Object.keys(lock).length > 0 ||
    Object.keys(recovery).length > 0 ||
    Object.keys(population).length > 0 ||
    result.specimenType === "BONE_MARROW_ASPIRATE" ||
    result.specimenType === "BONE_MARROW_BIOPSY" ||
    result.specimenType === "HEMODILUTED_BONE_MARROW";

  if (!marrowContext) {
    return {
      marrowContext: false,
      focal: false,
      cellLevelPositive: false,
      populationInferenceAllowed: null,
      populationPositiveAllowed: null,
      blastPercentageInferenceAllowed: null,
      populationEvidenceEstablished: false,
      source: null,
    };
  }

  const rawState = evidenceState(rawBlast.evidenceState);
  const directState = evidenceState(directBlast.evidenceState);
  const projectedState = evidenceState(population.evidenceState);

  const independentPopulationEvidence =
    rawState === "OBSERVED_POPULATION" ||
    rawState === "SUSPICIOUS_POPULATION" ||
    directState === "OBSERVED_POPULATION" ||
    directState === "SUSPICIOUS_POPULATION" ||
    population.observedPopulation === true ||
    (
      projectedState === "SUSPICIOUS_POPULATION" &&
      population.suspiciousPopulation === true
    );

  const trustedRecoveryFocal =
    recovery.active === true &&
    recovery.directCellLevelPositive === true &&
    recovery.cellLevelPositiveCytology === true &&
    evidenceState(recovery.recoveredEvidenceState) === "FOCAL_SUSPICION" &&
    recovery.preExistingArchitectureQualified !== true &&
    recovery.populationPositiveFabricated === false &&
    recovery.populationPromotionAllowedByThisEngine === false &&
    !independentPopulationEvidence;

  const focal =
    (provenance.locked === true && provenance.focalCellLevelPositive === true) ||
    terminal.active === true ||
    lock.active === true ||
    globalPattern.focalBlastoidScopeAuthority?.active === true ||
    trustedRecoveryFocal;

  const cellLevelPositive =
    (provenance.locked === true && provenance.focalCellLevelPositive === true) ||
    terminal.cellLevelPositiveBlastoidCytology === true ||
    lock.cellLevelPositiveBlastoidCytology === true ||
    globalPattern.marrowPositiveBlastoidCytology === true ||
    recovery.cellLevelPositiveCytology === true ||
    result.findings?.cellLevelPositiveBlastoidCytology === true;

  if (focal) {
    return {
      marrowContext: true,
      focal: true,
      cellLevelPositive: true,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      populationEvidenceEstablished: false,
      source:
        provenance.locked === true && provenance.focalCellLevelPositive === true
          ? "BE-FIX-005.50.23_MONOTONIC_PROVENANCE"
          : terminal.active === true
            ? "TERMINAL_AUTHORITY"
          : lock.active === true
            ? "FOCAL_SCOPE_LOCK"
            : globalPattern.focalBlastoidScopeAuthority?.active === true
              ? "GLOBAL_PATTERN_SCOPE_AUTHORITY"
              : "TRUSTED_005_50_18_CELL_LEVEL_RECOVERY",
    };
  }

  if (independentPopulationEvidence) {
    return {
      marrowContext: true,
      focal: false,
      cellLevelPositive,
      populationInferenceAllowed:
        firstBoolean([
          terminal.populationInferenceAllowed,
          lock.populationInferenceAllowed,
          globalPattern.populationInferenceAllowed,
          governance.populationInferenceAllowed,
        ]) ?? true,
      populationPositiveAllowed:
        firstBoolean([
          terminal.populationPositiveAllowed,
          lock.populationPositiveAllowed,
          globalPattern.populationPositiveAllowed,
          governance.populationPositiveAllowed,
        ]) ?? true,
      blastPercentageInferenceAllowed:
        firstBoolean([
          terminal.blastPercentageInferenceAllowed,
          lock.blastPercentageInferenceAllowed,
          globalPattern.blastPercentageInferenceAllowed,
          governance.blastPercentageInferenceAllowed,
        ]) ?? true,
      populationEvidenceEstablished: true,
      source: "INDEPENDENT_QUALIFIED_POPULATION_EVIDENCE",
    };
  }

  // Absence of focality is NOT evidence that population inference is allowed.
  // For marrow, permissions must be earned by qualified population evidence.
  return {
    marrowContext: true,
    focal: false,
    cellLevelPositive,
    populationInferenceAllowed: false,
    populationPositiveAllowed: false,
    blastPercentageInferenceAllowed: false,
    populationEvidenceEstablished: false,
    source: "NO_QUALIFIED_POPULATION_AUTHORITY",
  };
}

export function buildCanonicalClinicalPresentation(result = {}) {
  const v2 = obj(result.clinicalResultV2);
  const presentation = obj(v2.presentation);
  const criticality = obj(presentation.clinicalCriticality);
  const severity = text(criticality.level || v2.risk?.severity || result.clinicalCriticality?.level).toUpperCase();
  const blast = blastState(v2);
  const blastPositive = blast === "OBSERVED" || blast === "SUSPICIOUS_INDETERMINATE";
  const focalCardinality = obj(result.peripheralFocalBlastoidCardinalityAuthority);
  const marrowFocalScopeLock = obj(result.marrowPositiveCellLevelBlastoidScopeLock);
  const marrowTerminalFocalAuthority = obj(result.marrowFocalBlastoidTerminalAuthority);
  const marrowPresentationScope = readMarrowPresentationScope(result);
  const focalBlastoidOnly =
    marrowPresentationScope.focal === true ||
    (focalCardinality.active === true &&
      focalCardinality.focalOnly === true &&
      focalCardinality.populationEvidenceEstablished !== true);
  const polychromasia = v2.lineages?.erythrocytes?.positiveMorphology?.polychromasia === true;
  const limited = v2.scope?.limitedField === true || result.fieldAdequacy?.limitedField === true;

  let title = "Análise hematológica";
  let subtitle = "Resultado morfológico disponível para revisão.";
  if (blastPositive) {
    title = focalBlastoidOnly
      ? (blast === "OBSERVED"
          ? "Elemento blástico / blastoide focal"
          : "Suspeita focal para blasto / blastoide")
      : "Suspeita blástica / blastoide";
    subtitle = focalBlastoidOnly
      ? "Achado celular focal — não estabelece população blástica nem percentual."
      : blast === "OBSERVED"
        ? "Achado morfológico prioritário — revisão hematológica urgente."
        : "Achado morfológico prioritário — revisão hematológica recomendada.";
  } else if (severity === "CRITICAL") {
    title = "Alerta hematológico de criticidade muito alta";
    subtitle = "Revisão hematológica prioritária.";
  } else if (severity === "HIGH") {
    title = "Achado hematológico de alta criticidade";
    subtitle = "Revisão hematológica prioritária.";
  }

  const positiveFindings = [];
  if (blastPositive) {
    positiveFindings.push({
      key: "focal_blastoid_immaturity",
      domain: "LEUKOCYTE",
      label: focalBlastoidOnly
        ? (blast === "OBSERVED"
            ? "Elemento blástico/blastoide focal"
            : "Célula focal suspeita para blasto/blastoide")
        : "Imaturidade / blastoidia focal",
      description: firstUnique([
        focalBlastoidOnly ? focalCardinality.presentationText : "",
        result.morphologyAnalysis?.cellMorphology?.focalHematopoieticCell?.summary,
        v2.criticalFindings?.blastLike?.evidence?.[0],
        result.morphologyAnalysis?.leukocyteReview,
      ]) || "Célula hematopoiética focal com características de imaturidade/blastoidia.",
      findingSeverity: blast === "OBSERVED" ? "CRITICAL" : "HIGH",
      presentationAuthority: "PRIMARY_POSITIVE",
    });
  }
  if (polychromasia) {
    positiveFindings.push({
      key: "polychromasia",
      domain: "ERYTHROCYTE",
      label: "Policromasia",
      description: "Policromasia presente no campo avaliado.",
      findingSeverity: "MORPHOLOGIC_POSITIVE",
      presentationAuthority: "POSITIVE_FINDING",
    });
  }

  const used = [title, subtitle, ...positiveFindings.map((f) => f.description)];
  const interpretation = firstUnique([
    focalBlastoidOnly
      ? "A morfologia focal sustenta um achado suspeito/positivo para blasto ou blastoide em nível celular. Esse achado não estabelece população blástica, blastose, percentual de blastos ou diagnóstico pela imagem isolada."
      : blastPositive && limited
        ? "A morfologia focal sustenta suspeição de imaturidade/blastoidia, mas a representatividade do campo não permite inferência populacional nem classificação diagnóstica pela imagem isolada."
        : "",
    result.interpretiveSynthesis,
    result.morphologyAnalysis?.biologicalInterpretation,
    result.clinicalMeaning,
  ], used);
  if (interpretation) used.push(interpretation);

  const limitation = limited
    ? "Campo de representatividade limitada; achados não visualizados não podem ser excluídos globalmente. O achado blástico/blastoide descrito permanece focal e não autoriza inferência de frequência populacional."
    : focalBlastoidOnly
      ? "A cardinalidade do achado blástico/blastoide é focal; não há base estruturada para inferir população ou percentual."
      : firstUnique(arr(v2.quality?.limitations), used);
  if (limitation) used.push(limitation);

  const recommendation = firstUnique([
    result.structuredReport?.recommendation,
    blastPositive ? "Revisão microscópica de múltiplos campos e correlação com hemograma e dados clínicos." : "",
    result.recommendation,
  ], used) || (v2.review?.required === true
    ? "Correlacionar com hemograma, múltiplos campos e revisão microscópica profissional."
    : "");

  return {
    contractVersion: CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    headline: {
      title,
      subtitle,
      criticality: severity || "NONE",
      requiresHumanReview: v2.review?.required === true || result.requiresHumanReview === true,
    },
    positiveFindings,
    interpretation,
    limitation,
    recommendation,
    presentationPolicy: {
      singleHeadline: true,
      singleInterpretation: true,
      singleLimitation: true,
      singleRecommendation: true,
      findingSeverityIndependentFromGlobalCriticality: true,
      focalBlastoidFindingDoesNotEstablishPopulation:
        marrowPresentationScope.marrowContext
          ? marrowPresentationScope.focal
          : focalBlastoidOnly,
      blastPercentageInferenceAllowed:
        marrowPresentationScope.marrowContext
          ? marrowPresentationScope.blastPercentageInferenceAllowed
          : (focalBlastoidOnly ? false : true),
      populationInferenceAllowed:
        marrowPresentationScope.marrowContext
          ? marrowPresentationScope.populationInferenceAllowed
          : (focalBlastoidOnly ? false : true),
      populationPositiveAllowed:
        marrowPresentationScope.marrowContext
          ? marrowPresentationScope.populationPositiveAllowed
          : (focalBlastoidOnly ? false : true),
      cellLevelPositiveBlastoidCytology:
        marrowPresentationScope.marrowContext
          ? (marrowPresentationScope.cellLevelPositive || undefined)
          : (marrowFocalScopeLock.active === true || undefined),
      populationEvidenceEstablished:
        marrowPresentationScope.marrowContext
          ? marrowPresentationScope.populationEvidenceEstablished
          : undefined,
      marrowScopeAuthoritySource:
        marrowPresentationScope.marrowContext
          ? marrowPresentationScope.source
          : undefined,
      gateInheritanceVersion:
        CANONICAL_CLINICAL_PRESENTATION_GATE_INHERITANCE_VERSION,
      lastWriterVersion:
        CANONICAL_CLINICAL_PRESENTATION_LAST_WRITER_VERSION,
      focalProvenanceVersion:
        CANONICAL_CLINICAL_PRESENTATION_FOCAL_PROVENANCE_VERSION,
      legacyFieldsRetainedForCompatibility: true,
    },
    provenance: {
      source: "clinicalResultV2",
      craVersion: v2.provenance?.craVersion || "CRA-001.1",
      authorityVersion: CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
      baseAuthorityVersion: CANONICAL_CLINICAL_PRESENTATION_BASE_VERSION,
      focalCardinalityAuthorityVersion:
        focalCardinality.version || null,
      marrowFocalBlastoidScopeLockVersion:
        marrowFocalScopeLock.version || null,
      marrowFocalBlastoidTerminalAuthorityVersion:
        marrowTerminalFocalAuthority.version || null,
      gateInheritanceVersion:
        CANONICAL_CLINICAL_PRESENTATION_GATE_INHERITANCE_VERSION,
      lastWriterVersion:
        CANONICAL_CLINICAL_PRESENTATION_LAST_WRITER_VERSION,
      focalProvenanceVersion:
        CANONICAL_CLINICAL_PRESENTATION_FOCAL_PROVENANCE_VERSION,
    },
  };
}

export function applyCanonicalClinicalPresentationAuthority(result = {}) {
  if (!result || typeof result !== "object") return result;
  const clinicalPresentation = buildCanonicalClinicalPresentation(result);
  result.clinicalPresentation = clinicalPresentation;
  if (result.clinicalResultV2 && typeof result.clinicalResultV2 === "object") {
    result.clinicalResultV2.presentation = {
      ...(result.clinicalResultV2.presentation || {}),
      canonical: clinicalPresentation,
      canonicalClinicalPresentationAuthorityVersion: CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    };
  }
  return result;
}
