// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.30 — MARROW PHYSIOLOGIC PRECURSOR ANTI-ESCALATION
// & GLOBAL PATTERN COHERENCE
//
// Invariants:
//   1. A physiologic marrow precursor pattern may contain immature cells.
//      Immaturity alone must never become positive blast evidence.
//   2. BE-FIX-005.29 remains authoritative for genuinely supported positive
//      blastoid populations; 005.30 only suppresses downstream/legacy
//      re-escalation when 005.27/005.27.2 establishes physiologic dominance.
//   3. LIMITED FIELD is an adequacy qualifier, not a blast-positive class.
//   4. GLOBAL_UNREMARKABLE_PATTERN is forbidden when global normality is
//      blocked or blast assessment remains not assessable.
// ============================================================================

import {
  evaluateMarrowPrecursorDiscrimination,
} from "./marrowPrecursorDiscriminationEngine.js";

export const MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION = "BE-FIX-005.30";
export const MARROW_PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION_VERSION = "BE-FIX-005.30";
export const MARROW_GLOBAL_PATTERN_COHERENCE_VERSION = "BE-FIX-005.30";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickDiscrimination(result = {}) {
  const candidates = [
    obj(result.marrowPrecursorDiscrimination),
    obj(result.marrowBlastPopulationEvidence?.precursorDiscrimination),
    obj(result.localMorphologyEvidence?.marrow?.precursorDiscrimination),
    obj(result.blastAssessment?.precursorDiscrimination),
    obj(result.rawResponse?.blastAssessment?.precursorDiscrimination),
  ];

  for (const candidate of candidates) {
    if (
      candidate.classification ||
      candidate.strongPhysiologicPattern === true ||
      candidate.strongBlastoidPattern === true
    ) {
      return candidate;
    }
  }

  return evaluateMarrowPrecursorDiscrimination(result);
}

function isPhysiologicDominant(discrimination = {}) {
  const d = obj(discrimination);
  const dual = obj(d.dualAxis);
  return (
    d.classification === "PHYSIOLOGIC_PRECURSOR_PATTERN" &&
    d.strongPhysiologicPattern === true &&
    d.suppressBlastPromotion === true &&
    d.strongBlastoidPattern !== true &&
    d.protectedObservedBlastoid !== true &&
    d.protectedSuspiciousBlastoid !== true &&
    d.coherentBlastoidSubpopulation !== true &&
    dual.observedEscalation !== true &&
    dual.suspiciousEscalation !== true &&
    dual.subpopulationCore !== true
  );
}

function isLimited(result = {}) {
  return (
    result.finalClassification === "CLASS_1_LIMITED_FIELD" ||
    result.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
    result.fieldAdequacy?.limitedField === true ||
    result.fieldAdequacy?.adequateForPopulationAssessment === false
  );
}

function blastAssessabilityState(result = {}) {
  const state = text(result.fieldAdequacy?.blastAssessability?.state).toUpperCase();
  if (state) return state;
  if (result.fieldAdequacy?.adequateForBlastScreening === true) return "EVALUABLE";
  return "NOT_ASSESSABLE";
}

function stripFalseBlastPositiveReasons(items = []) {
  const forbidden = [
    /evid[eê]ncia medular positiva de popula[cç][aã]o blastoide/i,
    /campo limitado n[aã]o pode converter evid[eê]ncia positiva/i,
    /assessabilidade de blastos .* apagamento positivo/i,
    /suspeita de c[eé]lulas imaturas\/bl[aá]sticas/i,
    /n[aã]o classificar como campo limitado simples/i,
    /suspeita morfol[oó]gica blastoide\/imatura/i,
    /representatividade limitada n[aã]o autoriza apagar achado positivo/i,
    /presen[cç]a de pelo menos um elemento blastoide suspeito/i,
    /presen[cç]a de pelo menos um blasto\/blastoide observado/i,
  ];

  return arr(items).filter((item) => {
    const value = text(item);
    return value && !forbidden.some((pattern) => pattern.test(value));
  });
}

function stripFalseBlastPositiveItems(items = []) {
  return arr(items).filter((item) => {
    const value = text(item);
    if (!value) return false;
    return !/popula[cç][aã]o blastoide\/imatura (observada|suspeita)|elemento blastoide/i.test(value);
  });
}

function coherentPattern(result = {}, limited = false) {
  const assessability = blastAssessabilityState(result);
  if (limited || assessability === "NOT_ASSESSABLE") {
    return "MARROW_PHYSIOLOGIC_MATURATION_LIMITED_PATTERN";
  }
  return "MARROW_PHYSIOLOGIC_MATURATION_PATTERN";
}

export function applyMarrowPhysiologicPrecursorCoherence(result = {}) {
  if (!result || typeof result !== "object") return result;

  const discrimination = pickDiscrimination(result);
  const pathologicMyeloidExpansion =
    obj(result.marrowPathologicMaturationContinuumLock).active === true ||
    obj(obj(result.rawResponse).marrowPathologicMaturationContinuumLock).active === true ||
    discrimination.pathologicMyeloidExpansionProtected === true;
  const physiologicDominance =
    !pathologicMyeloidExpansion &&
    isPhysiologicDominant(discrimination);

  if (!physiologicDominance) {
    return {
      ...result,
      marrowPhysiologicPrecursorCoherence: {
        version: MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION,
        active: false,
        physiologicDominance: false,
        pathologicMyeloidExpansion,
        positiveBlastEvidenceSuppressed: false,
      },
    };
  }

  const limited = isLimited(result);
  const assessability = blastAssessabilityState(result);
  const pattern = coherentPattern(result, limited);
  const blastState = assessability === "EVALUABLE"
    ? "NOT_OBSERVED_IN_EVALUABLE_FIELD"
    : "NOT_ASSESSABLE";

  const mainFinding =
    "Padrão de maturação medular heterogênea com continuidade maturativa e formas precursoras/maduras coexistentes. A presença de precursores fisiológicos, isoladamente, não sustenta promoção para população blastoide.";

  const out = {
    ...result,
    findings: { ...obj(result.findings) },
    fieldAdequacy: { ...obj(result.fieldAdequacy) },
    morphologyAnalysis: { ...obj(result.morphologyAnalysis) },
    whatAISees: { ...obj(result.whatAISees) },
    overallAssessment: { ...obj(result.overallAssessment) },
    structuredReport: { ...obj(result.structuredReport) },
    patternRecognition: { ...obj(result.patternRecognition) },
    globalPattern: { ...obj(result.globalPattern) },
    localMorphologyEvidence: { ...obj(result.localMorphologyEvidence) },
  };

  out.findings.blastSuspicion = false;
  out.findings.immatureCells = false;
  out.findings.monomorphicPopulation = false;
  out.findings.blastEvidenceState = blastState;
  delete out.findings.observedBlastLikeCount;

  out.marrowBlastPopulationEvidence = {
    ...obj(out.marrowBlastPopulationEvidence),
    observedPopulation: false,
    suspiciousPopulation: false,
    focalSuspicion: false,
    positivePopulationFinding: false,
    physiologicPrecursorPattern: true,
    precursorDiscrimination: discrimination,
  };

  out.marrowPositiveBlastEvidencePreservation = {
    ...obj(out.marrowPositiveBlastEvidencePreservation),
    version:
      obj(out.marrowPositiveBlastEvidencePreservation).version || "BE-FIX-005.29",
    active: false,
    positiveEvidencePresent: false,
    physiologicAntiEscalationVersion:
      MARROW_PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION_VERSION,
    suppressedDerivedPositiveEvidence: true,
    negativeOnlyAssessabilityGate: true,
  };

  out.fieldAdequacy.positiveBlastEvidenceOverride = {
    ...obj(out.fieldAdequacy.positiveBlastEvidenceOverride),
    active: false,
    physiologicAntiEscalationVersion:
      MARROW_PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION_VERSION,
  };

  out.fieldAdequacy.blastAssessability = {
    ...obj(out.fieldAdequacy.blastAssessability),
    state: assessability,
    positiveEvidencePresent: false,
    positiveEvidencePreserved: false,
    physiologicAntiEscalationVersion:
      MARROW_PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION_VERSION,
  };

  const lme = obj(out.localMorphologyEvidence);
  const lmeMarrow = obj(lme.marrow);
  out.localMorphologyEvidence = {
    ...lme,
    marrow: {
      ...lmeMarrow,
      precursorDiscrimination: discrimination,
      blastPopulationEvidence: {
        ...obj(lmeMarrow.blastPopulationEvidence),
        positive: false,
        observedPopulation: false,
        suspiciousPopulation: false,
        focalSuspicion: false,
        positivePopulationFinding: false,
        precursorDiscrimination: discrimination,
      },
    },
    criticalMorphology: {
      ...obj(lme.criticalMorphology),
      blastLikeMorphology: blastState,
      observedBlastLikeCount: null,
      blastEvidenceGovernanceVersion:
        MARROW_PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION_VERSION,
    },
  };

  out.normalityBlocked = true;
  out.requiresHumanReview = true;
  out.finalClassification = limited
    ? "CLASS_1_LIMITED_FIELD"
    : "MARROW_PHYSIOLOGIC_MATURATION_PATTERN";
  out.morphologicRiskClass = out.finalClassification;
  out.riskLevel = limited
    ? "Campo limitado — sem alerta blastoide sustentado"
    : "Sem alerta blastoide sustentado — maturação medular heterogênea";
  out.mainFinding = mainFinding;
  out.primaryFinding = mainFinding;
  out.finalConclusion = mainFinding;

  out.blockNormalReason = [
    ...new Set([
      ...stripFalseBlastPositiveReasons(out.blockNormalReason),
      ...(limited ? ["Campo microscópico limitado"] : []),
      "Material medular não deve ser classificado globalmente como normal por imagem isolada.",
    ]),
  ];

  out.positiveFindings = stripFalseBlastPositiveItems(out.positiveFindings);

  out.morphologyAnalysis.summary = mainFinding;
  out.morphologyAnalysis.overview =
    "Campo medular com diversidade de estágios maturativos e ausência de subpopulação blastoide estruturada sustentada.";
  out.morphologyAnalysis.leukocyteReview =
    "A coexistência de precursores e formas maduras, com heterogeneidade e continuidade maturativa, favorece maturação hematopoética medular em vez de população blastoide distinta.";

  out.whatAISees.dominantFinding =
    "Maturação medular heterogênea sem subpopulação blastoide estruturada sustentada.";

  out.patternRecognition.overallPattern = pattern;
  out.globalPattern = {
    ...out.globalPattern,
    dominantPattern: pattern,
    physiologicAppearance: false,
    normalityBlocked: true,
    marrowPositiveBlastEvidence: false,
    blastAssessmentIndeterminate: assessability !== "EVALUABLE",
    blastAssessmentState: assessability,
    globalPatternCoherenceVersion: MARROW_GLOBAL_PATTERN_COHERENCE_VERSION,
    globalSummary: limited
      ? "Padrão medular maturativo heterogêneo em campo de representatividade limitada; sem evidência estruturada suficiente para alerta blastoide e sem autorização para afirmar normalidade global."
      : "Padrão medular maturativo heterogêneo sem evidência estruturada suficiente para alerta blastoide; interpretação global permanece dependente de representatividade e correlação.",
  };

  out.overallAssessment.requiresHumanReview = true;
  out.overallAssessment.riskCategory = out.finalClassification;
  out.overallAssessment.mainImpression = mainFinding;
  out.structuredReport.conclusion = mainFinding;
  out.structuredReport.hematologicMeaning =
    "A presença de elementos precursores em medula pode integrar a hematopoese fisiológica. Neste campo, a arquitetura maturativa heterogênea não sustenta promoção blastoide; a representatividade limitada impede conclusões globais.";

  out.singleBlastSentinel = {
    ...obj(out.singleBlastSentinel),
    active: false,
    alertLevel: "NONE",
    evidenceState: null,
    certainty: "PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION",
    physiologicAntiEscalationVersion:
      MARROW_PHYSIOLOGIC_PRECURSOR_ANTI_ESCALATION_VERSION,
  };

  out.marrowPhysiologicPrecursorCoherence = {
    version: MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION,
    active: true,
    physiologicDominance: true,
    classification: discrimination.classification,
    suppressBlastPromotion: true,
    coherentBlastoidSubpopulation: false,
    positiveBlastEvidenceSuppressed: true,
    blastAssessabilityState: assessability,
    globalPattern: pattern,
    preserves00529ForTruePositiveEvidence: true,
  };

  return out;
}

export default applyMarrowPhysiologicPrecursorCoherence;
