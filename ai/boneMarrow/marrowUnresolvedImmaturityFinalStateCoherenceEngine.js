// ============================================================================
// BE-FIX-005.50.17 — Marrow Unresolved Immaturity Final-State Coherence
//                     & Presentation Lock
//
// Purpose
// -------
// Preserve the epistemic middle state created by BE-FIX-005.50.16 through
// global-pattern, terminal marrow authority, CRA and clinical presentation.
// This engine is deliberately NON-PROMOTIONAL:
//   - unresolved focal immaturity is not a blast population;
//   - it does not authorize blast percentage inference;
//   - it cannot be rewritten as a reassuring physiologic/unremarkable state;
//   - internal BE-FIX identifiers are removed from user-facing narrative only.
// ============================================================================

export const MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION =
  "BE-FIX-005.50.17";
export const MARROW_UNRESOLVED_IMMATURITY_GLOBAL_PATTERN_LOCK_VERSION =
  "BE-FIX-005.50.17";
export const MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION =
  "BE-FIX-005.50.17";
export const CLINICAL_INTERNAL_VERSION_TAG_SANITIZATION_VERSION =
  "BE-FIX-005.50.17";

const UNRESOLVED_STATE = "FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY";
const UNRESOLVED_PATTERN = "MARROW_UNRESOLVED_IMMATURE_CYTOLOGY_PATTERN";

const obj = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const arr = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === "string" ? value.trim() : "");
const state = (value) => text(value).toUpperCase();

function uniqueStrings(values = []) {
  return [...new Set(values.map((v) => text(v)).filter(Boolean))];
}

function isStructuredPositiveMarrowBlast(result = {}) {
  const authority = obj(result.finalMarrowAuthority);
  const structured = obj(authority.structuredBlast);
  const population = obj(result.marrowBlastPopulationEvidence);
  const recovered = obj(result.marrowRecoveredCytologyProjection);
  const positiveLock = obj(result.marrowPositiveBlastEvidenceLock);
  const direct = obj(result.blastAssessment);
  const raw = obj(result.rawResponse?.blastAssessment);
  const lme = obj(result.localMorphologyEvidence?.marrow?.blastPopulationEvidence);

  const states = [
    direct.evidenceState,
    raw.evidenceState,
    population.evidenceState,
    lme.evidenceState,
  ].map(state);

  return (
    structured.observed === true ||
    structured.suspicious === true ||
    structured.structured === true ||
    population.observedPopulation === true ||
    population.suspiciousPopulation === true ||
    recovered.structuredPositive === true ||
    positiveLock.active === true ||
    states.includes("OBSERVED_POPULATION") ||
    states.includes("SUSPICIOUS_POPULATION")
  );
}

function readUnresolvedSignals(result = {}) {
  const direct = obj(result.blastAssessment);
  const raw = obj(result.rawResponse?.blastAssessment);
  const recovery = obj(result.marrowImmatureCellCytologyRecovery);
  const maturation = obj(result.marrowMaturationContinuumDiscrimination);
  const vme = obj(result.visualMorphologyEvidenceAcquisition);
  const vmeRecovery = obj(vme.immatureCellCytologyRecovery);
  const supersession = obj(result.marrowPositiveBlastEvidenceSemanticSupersession);

  const directState = state(direct.evidenceState);
  const rawState = state(raw.evidenceState);
  const recoveryState = state(recovery.finalEvidenceState || recovery.candidateState);
  const maturationClass = state(maturation.classification);

  return {
    directState,
    rawState,
    recoveryState,
    maturationClass,
    directUnresolved: directState === UNRESOLVED_STATE,
    rawUnresolved: rawState === UNRESOLVED_STATE,
    recoveryUnresolved:
      recoveryState === UNRESOLVED_STATE ||
      recovery.unresolvedCandidate === true ||
      recovery.cellLevelUnresolvedImmaturity === true,
    acquisitionUnresolved:
      vme.semanticUnresolvedImmaturity === true ||
      vmeRecovery.semanticUnresolvedImmaturity === true ||
      vmeRecovery.cellLevelUnresolvedImmaturity === true ||
      state(vmeRecovery.cellLevelCytomorphologyState) === "UNRESOLVED_IMMATURE",
    maturationUnresolved:
      maturation.unresolvedImmatureCandidateAfterAcquisition === true ||
      maturationClass === "INDETERMINATE_MATURATION_VS_BLASTOID",
    supersessionUnresolved:
      supersession.unresolvedImmatureCandidateAfterAcquisition === true ||
      state(supersession.priorEvidenceState) === UNRESOLVED_STATE ||
      state(supersession.effectivePopulationEvidenceState) === UNRESOLVED_STATE,
  };
}

function isLimitedField(result = {}) {
  return (
    result.fieldAdequacy?.limitedField === true ||
    result.fieldAdequacy?.adequateForPopulationAssessment === false ||
    result.evidenceGovernance?.limitedField === true ||
    result.marrowAdequacyMorphologyAxis?.adequacyClassification ===
      "CLASS_1_LIMITED_FIELD"
  );
}

export function evaluateMarrowUnresolvedImmaturityFinalStateCoherence(
  result = {},
) {
  const signals = readUnresolvedSignals(result);
  const structuredPositive = isStructuredPositiveMarrowBlast(result);
  const unresolved = Object.entries(signals)
    .filter(([key]) => key.endsWith("Unresolved"))
    .some(([, value]) => value === true);
  const limitedField = isLimitedField(result);

  return {
    version: MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
    globalPatternLockVersion:
      MARROW_UNRESOLVED_IMMATURITY_GLOBAL_PATTERN_LOCK_VERSION,
    presentationLockVersion:
      MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
    internalVersionTagSanitizationVersion:
      CLINICAL_INTERNAL_VERSION_TAG_SANITIZATION_VERSION,
    active: unresolved && !structuredPositive,
    unresolvedImmaturity: unresolved,
    structuredPositiveBlastPopulation: structuredPositive,
    limitedField,
    evidenceState: unresolved && !structuredPositive ? UNRESOLVED_STATE : null,
    globalPattern: unresolved && !structuredPositive ? UNRESOLVED_PATTERN : null,
    populationPositiveAllowed: structuredPositive,
    blastPercentageInferenceAllowed: structuredPositive,
    negativeBlastExclusionAllowed: false,
    signals,
  };
}

export function sanitizeClinicalInternalVersionTags(value = "") {
  if (typeof value !== "string") return value;

  return value
    // Remove an internal patch label used as a prose prefix.
    .replace(
      /\bBE(?:\/FE)?-FIX-\d+(?:\.\d+)*(?:\.[A-Za-z0-9]+)?\s*:\s*/gi,
      "",
    )
    // Remove remaining internal patch identifiers without deleting the prose.
    .replace(
      /\bBE(?:\/FE)?-FIX-\d+(?:\.\d+)*(?:\.[A-Za-z0-9]+)?\b/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function sanitizeNarrativeTree(value) {
  if (typeof value === "string") {
    return sanitizeClinicalInternalVersionTags(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeNarrativeTree);
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, child] of Object.entries(value)) {
      // Provenance/debug identifiers remain untouched.
      if (
        /version|contractVersion|authorityVersion|provenance|fingerprint/i.test(key)
      ) {
        output[key] = child;
      } else {
        output[key] = sanitizeNarrativeTree(child);
      }
    }
    return output;
  }

  return value;
}

function applyUserFacingNarrativeSanitization(result = {}) {
  const scalarKeys = [
    "summary",
    "riskLevel",
    "observations",
    "mainFinding",
    "primaryFinding",
    "finalConclusion",
    "finalRecommendation",
    "clinicalMeaning",
    "interpretiveSynthesis",
    "educationalImpact",
  ];

  for (const key of scalarKeys) {
    if (typeof result[key] === "string") {
      result[key] = sanitizeClinicalInternalVersionTags(result[key]);
    }
  }

  const objectKeys = [
    "morphologyAnalysis",
    "whatAISees",
    "overallAssessment",
    "structuredReport",
    "blastSuspicion",
    "executiveSummary",
    "patternRecognition",
    "hematologicReasoning",
    "clinicalPresentation",
  ];

  for (const key of objectKeys) {
    if (result[key] && typeof result[key] === "object") {
      result[key] = sanitizeNarrativeTree(result[key]);
    }
  }

  if (result.clinicalResultV2 && typeof result.clinicalResultV2 === "object") {
    result.clinicalResultV2 = {
      ...result.clinicalResultV2,
      presentation: sanitizeNarrativeTree(result.clinicalResultV2.presentation),
    };
  }

  return result;
}

function applyUnresolvedClinicalProjection(result = {}, evaluation = {}) {
  const limited = evaluation.limitedField === true;

  const mainFinding =
    "Imaturidade celular focal permanece citomorfologicamente indeterminada no campo analisado; o achado não estabelece população blastoide.";
  const interpretation =
    "Há células imaturas/precursoras cuja discriminação entre maturação hematopoética e morfologia blastoide não pôde ser resolvida com segurança. A evidência deve permanecer focal e indeterminada, sem inferência de população ou percentual de blastos.";
  const limitation = limited
    ? "Campo de representatividade limitada. A ausência de uma população blastoide demonstrável neste campo não autoriza exclusão global, e a imaturidade focal indeterminada não permite estimar frequência populacional."
    : "A citomorfologia das células imaturas permanece indeterminada; esse estado não autoriza inferência de população blastoide nem estimativa percentual.";
  const recommendation =
    "Recomenda-se revisão microscópica dirigida em múltiplos campos, com correlação ao hemograma, contagem diferencial e demais dados clínico-laboratoriais pertinentes.";

  result.normalityBlocked = true;
  result.requiresHumanReview = true;
  result.blockNormalReason = uniqueStrings([
    ...arr(result.blockNormalReason),
    "Imaturidade celular focal com discriminação citomorfológica não resolvida",
    "Não reduzir estado indeterminado a padrão fisiológico ou normalidade global",
    "Não inferir população ou percentual de blastos a partir de evidência focal não resolvida",
  ]);

  result.findings = {
    ...obj(result.findings),
    blastSuspicion: false,
    blastEvidenceState: UNRESOLVED_STATE,
    unresolvedImmatureCytology: true,
  };

  result.blastAssessment = {
    ...obj(result.blastAssessment),
    status: "indeterminate",
    observed: null,
    estimatedPercentage: null,
    globalAbsenceAllowed: false,
    evidenceState: UNRESOLVED_STATE,
    summary: mainFinding,
  };

  result.blastSuspicion = {
    ...obj(result.blastSuspicion),
    status: "indeterminate",
    summary:
      "A discriminação citomorfológica das células imaturas permanece indeterminada; não há base para afirmar população blastoide nem ausência global de blastos.",
  };

  const previousGlobal = obj(result.globalPattern);
  result.globalPattern = {
    ...previousGlobal,
    dominantPattern: UNRESOLVED_PATTERN,
    physiologicAppearance: false,
    normalityBlocked: true,
    normalityReason: uniqueStrings([
      ...arr(previousGlobal.normalityReason),
      "Imaturidade celular focal permanece não resolvida após aquisição/reobservação.",
    ]),
    marrowPositiveBlastEvidence: false,
    physiologicPrecursorPattern: false,
    blastAssessmentIndeterminate: true,
    blastAssessmentState: "UNRESOLVED_IMMATURE_CYTOLOGY",
    globalSummary: mainFinding,
    globalInterpretation: interpretation,
    unresolvedImmaturityFinalStateCoherenceVersion:
      MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
  };

  const maturation = obj(result.marrowMaturationContinuumDiscrimination);
  if (Object.keys(maturation).length > 0) {
    result.marrowMaturationContinuumDiscrimination = {
      ...maturation,
      strongPhysiologicContinuum: false,
      unresolvedImmatureCandidateAfterAcquisition: true,
      classification: "INDETERMINATE_MATURATION_VS_BLASTOID",
      cellLevelUnresolvedImmaturityContinuumGateVersion:
        maturation.cellLevelUnresolvedImmaturityContinuumGateVersion ||
        "BE-FIX-005.50.16",
      finalStateCoherenceVersion:
        MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
    };
  }

  const supersession = obj(result.marrowPositiveBlastEvidenceSemanticSupersession);
  result.marrowPositiveBlastEvidenceSemanticSupersession = {
    ...supersession,
    unresolvedImmatureCandidateAfterAcquisition: true,
    populationPositiveAllowed: false,
    negativeBlastExclusionAllowed: false,
    ...(limited ? { populationInferenceAllowed: false } : {}),
    unresolvedImmaturityPopulationScopeBlocked: true,
    unresolvedImmaturityFinalStateCoherenceVersion:
      MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
  };

  result.evidenceGovernance = {
    ...obj(result.evidenceGovernance),
    negativeBlastExclusionAllowed: false,
    blastPopulationInferenceAllowed: false,
    blastPercentageInferenceAllowed: false,
    unresolvedImmatureCytology: true,
    unresolvedImmaturityFinalStateCoherenceVersion:
      MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
    ...(limited
      ? {
          limitedField: true,
          populationInferenceAllowed: false,
          globalNegativeExclusionAllowed: false,
        }
      : {}),
  };

  result.morphologyAnalysis = {
    ...obj(result.morphologyAnalysis),
    summary: mainFinding,
    leukocyteReview: interpretation,
    biologicalInterpretation:
      "O achado representa um estado morfológico indeterminado em nível celular. Ele exige discriminação adicional, mas não constitui evidência suficiente de população blastoide.",
  };

  result.whatAISees = {
    ...obj(result.whatAISees),
    dominantFinding: mainFinding,
    leukocytes: interpretation,
    freeNarrative: interpretation,
  };

  result.patternRecognition = {
    ...obj(result.patternRecognition),
    leukocytePattern: "Unresolved focal immature-cell cytomorphology",
    overallPattern: "Imaturidade celular focal indeterminada",
  };

  result.executiveSummary = {
    ...obj(result.executiveSummary),
    mainFinding,
    pattern: "Imaturidade celular focal indeterminada",
    humanReview: "Revisão microscópica dirigida recomendada",
  };

  result.overallAssessment = {
    ...obj(result.overallAssessment),
    status: "reviewRequired",
    requiresHumanReview: true,
    mainImpression: mainFinding,
  };

  result.structuredReport = {
    ...obj(result.structuredReport),
    conclusion: mainFinding,
    hematologicMeaning: interpretation,
    recommendation,
  };

  result.mainFinding = mainFinding;
  result.primaryFinding = mainFinding;
  result.finalConclusion = mainFinding;
  result.interpretiveSynthesis = interpretation;
  result.clinicalMeaning =
    "A imaturidade celular focal não resolvida exige revisão microscópica adicional. A imagem isolada não permite estabelecer população blastoide, estimar percentual de blastos ou excluir globalmente células blásticas.";

  if (typeof result.hematologicReasoning === "string") {
    result.hematologicReasoning =
      "A aquisição identificou imaturidade celular, porém os critérios citomorfológicos discriminativos permaneceram insuficientes para separar com segurança precursor em maturação de célula blastoide. O estado deve permanecer indeterminado e focal, sem promoção populacional.";
  } else {
    result.hematologicReasoning = {
      ...obj(result.hematologicReasoning),
      whatISee:
        "Células imaturas/precursoras presentes com caracterização citomorfológica incompleta.",
      whatItResembles:
        "Estado intermediário entre precursor em maturação e morfologia blastoide, sem critérios suficientes para resolução segura.",
      whatICannotConfirm:
        "Não é possível confirmar população blastoide, percentual de blastos ou ausência global de blastos pela imagem analisada.",
      finalInterpretation: interpretation,
    };
  }

  if (result.clinicalResultV2 && typeof result.clinicalResultV2 === "object") {
    const v2 = result.clinicalResultV2;
    v2.review = {
      ...obj(v2.review),
      required: true,
    };
    v2.scope = {
      ...obj(v2.scope),
      blastPercentageInferenceAllowed: false,
      blastPopulationInferenceAllowed: false,
    };
    v2.presentation = {
      ...obj(v2.presentation),
      unresolvedImmaturity: {
        active: true,
        evidenceState: UNRESOLVED_STATE,
        title: "Imaturidade celular focal indeterminada",
        summary: mainFinding,
        populationPositiveAllowed: false,
        blastPercentageInferenceAllowed: false,
        version: MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
      },
    };
  }

  if (result.clinicalPresentation && typeof result.clinicalPresentation === "object") {
    const existing = obj(result.clinicalPresentation);
    const existingPositive = arr(existing.positiveFindings).filter(
      (finding) => finding?.key !== "focal_blastoid_immaturity",
    );

    result.clinicalPresentation = {
      ...existing,
      headline: {
        ...obj(existing.headline),
        title: "Imaturidade celular focal indeterminada",
        subtitle:
          "Achado focal não resolvido — não estabelece população blastoide nem percentual de blastos.",
        requiresHumanReview: true,
      },
      positiveFindings: existingPositive,
      interpretation,
      limitation,
      recommendation,
      presentationPolicy: {
        ...obj(existing.presentationPolicy),
        focalBlastoidFindingDoesNotEstablishPopulation: true,
        unresolvedImmaturityDoesNotEstablishBlastPopulation: true,
        blastPercentageInferenceAllowed: false,
        populationPositiveAllowed: false,
        negativeBlastExclusionAllowed: false,
        unresolvedImmaturityPresentationLockVersion:
          MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
      },
      unresolvedImmaturity: {
        active: true,
        evidenceState: UNRESOLVED_STATE,
        populationPositiveAllowed: false,
        blastPercentageInferenceAllowed: false,
        version: MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
      },
    };

    if (result.clinicalResultV2 && typeof result.clinicalResultV2 === "object") {
      result.clinicalResultV2.presentation = {
        ...obj(result.clinicalResultV2.presentation),
        canonical: result.clinicalPresentation,
        unresolvedImmaturity: {
          ...obj(result.clinicalResultV2.presentation?.unresolvedImmaturity),
          active: true,
          evidenceState: UNRESOLVED_STATE,
          populationPositiveAllowed: false,
          blastPercentageInferenceAllowed: false,
          version: MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
        },
      };
    }
  }

  return result;
}

export function applyMarrowUnresolvedImmaturityFinalStateCoherence(
  result = {},
) {
  if (!result || typeof result !== "object") return result;

  const evaluation =
    evaluateMarrowUnresolvedImmaturityFinalStateCoherence(result);

  result.marrowUnresolvedImmaturityFinalStateCoherence = evaluation;

  if (evaluation.active === true) {
    applyUnresolvedClinicalProjection(result, evaluation);
  }

  applyUserFacingNarrativeSanitization(result);

  return result;
}

export default applyMarrowUnresolvedImmaturityFinalStateCoherence;
