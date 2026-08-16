import {
  applyMarrowPositiveBlastEvidenceSemanticSupersession,
  evaluateMarrowPositiveBlastEvidenceSemanticSupersession,
  MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
} from "./marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";

// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.29 — MARROW POSITIVE BLAST EVIDENCE END-TO-END PRESERVATION
// & NEGATIVE-ONLY ASSESSABILITY GATE
//
// Invariant:
//   blast assessability limits NEGATIVE EXCLUSION only.
//   It may never erase a structured positive marrow blast signal.
// ============================================================================

export const MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION = "BE-FIX-005.29";
export const MARROW_NEGATIVE_ONLY_ASSESSABILITY_GATE_VERSION = "BE-FIX-005.29";

const POSITIVE_STATES = new Set([
  "OBSERVED_POPULATION",
  "SUSPICIOUS_POPULATION",
  "FOCAL_SUSPICION",
]);

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function stateRank(state = "") {
  const normalized = asText(state).toUpperCase();
  if (normalized === "OBSERVED_POPULATION") return 3;
  if (normalized === "SUSPICIOUS_POPULATION") return 2;
  if (normalized === "FOCAL_SUSPICION") return 1;
  return 0;
}

function strongestState(...states) {
  return states
    .map((state) => asText(state).toUpperCase())
    .sort((a, b) => stateRank(b) - stateRank(a))[0] || "";
}

function extractPositiveMarrowBlastEvidence(result = {}) {
  const raw = asObject(result.rawResponse);
  const currentBlast = asObject(result.blastAssessment);
  const rawBlast = asObject(raw.blastAssessment);
  const lmeMarrow = asObject(asObject(result.localMorphologyEvidence).marrow);
  const lmePopulation = asObject(lmeMarrow.blastPopulationEvidence);
  const projected = asObject(result.marrowBlastPopulationEvidence);
  const governance = asObject(result.marrowBlastPopulationGovernance);
  const reconciled = asObject(raw.marrowBlastEvidenceReconciliation);

  const state = strongestState(
    currentBlast.evidenceState,
    rawBlast.evidenceState,
    lmePopulation.evidenceState,
    projected.evidenceState,
    governance.evidenceState,
  );

  const explicitPositive =
    POSITIVE_STATES.has(state) ||
    lmePopulation.positive === true ||
    projected.observedPopulation === true ||
    projected.suspiciousPopulation === true ||
    projected.focalSuspicion === true ||
    governance.positiveEvidencePriorityLockVersion === "BE-FIX-005.26" &&
      lmePopulation.positive === true;

  const physiologicSuppression =
    asObject(currentBlast.precursorDiscrimination).strongPhysiologicPattern === true ||
    asObject(rawBlast.precursorDiscrimination).strongPhysiologicPattern === true;

  // A structured positive state takes precedence over negative-screen
  // assessability. Physiologic suppression is allowed only if there is no
  // explicit positive population state.
  const positive = explicitPositive && (
    POSITIVE_STATES.has(state) || physiologicSuppression !== true
  );

  return {
    positive,
    state,
    observed: state === "OBSERVED_POPULATION" || projected.observedPopulation === true,
    suspicious:
      state === "SUSPICIOUS_POPULATION" || projected.suspiciousPopulation === true,
    focal: state === "FOCAL_SUSPICION" || projected.focalSuspicion === true,
    approximateBlastLikeCells:
      Number.isFinite(Number(currentBlast.approximateBlastLikeCells))
        ? Number(currentBlast.approximateBlastLikeCells)
        : Number.isFinite(Number(rawBlast.approximateBlastLikeCells))
          ? Number(rawBlast.approximateBlastLikeCells)
          : Number.isFinite(Number(lmePopulation.approximateBlastLikeCells))
            ? Number(lmePopulation.approximateBlastLikeCells)
            : null,
    source: POSITIVE_STATES.has(asText(currentBlast.evidenceState).toUpperCase())
      ? "blastAssessment"
      : POSITIVE_STATES.has(asText(rawBlast.evidenceState).toUpperCase())
        ? "rawResponse.blastAssessment"
        : lmePopulation.positive === true
          ? "LME-1.0"
          : "marrowBlastPopulationEvidence",
    reconciledBy00528:
      reconciled.reconciled === true ||
      rawBlast.reconciledFromObservationNarrative === true,
  };
}

function stripContradictoryBlastNegatives(text = "") {
  if (typeof text !== "string") return text;

  const sentences = text
    .split(/(?<=[.!?;])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const forbidden = [
    /blastos?.*(nao|não) (foram )?(identificados|observados|evidenciados)/i,
    /populacao blastica significativa.*(nao|não) (foi )?(estabelecida|observada|identificada)/i,
    /celulas? imaturas criticas.*(nao|não) (foram )?(identificadas|observadas|evidenciadas)/i,
    /ausencia .*blastos/i,
    /sem .*blastos/i,
  ];

  return sentences
    .filter((sentence) => !forbidden.some((pattern) => pattern.test(sentence)))
    .join(" ")
    .trim();
}

function stripContradictoryNegativeArray(items = []) {
  return asArray(items).filter((item) => {
    const text = asText(item);
    if (!text) return false;
    return ![
      /blastos?.*(nao|não) (foram )?(identificados|observados|evidenciados)/i,
      /populacao blastica significativa.*(nao|não) (foi )?(estabelecida|observada|identificada)/i,
      /celulas? imaturas criticas.*(nao|não) (foram )?(identificadas|observadas|evidenciadas)/i,
      /ausencia .*blastos/i,
    ].some((pattern) => pattern.test(text));
  });
}

export function applyMarrowPositiveBlastEvidencePreservation(result = {}) {
  if (!result || typeof result !== "object") return result;

  const semanticSupersession =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(result);

  if (semanticSupersession.active === true) {
    const reconciled =
      applyMarrowPositiveBlastEvidenceSemanticSupersession(result);

    return {
      ...reconciled,
      marrowPositiveBlastEvidencePreservation: {
        version: MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
        active: false,
        positiveEvidencePresent: false,
        negativeOnlyAssessabilityGate: true,
        semanticSupersessionActive: true,
        semanticSupersessionVersion:
          MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
        priorEvidenceState:
          semanticSupersession.priorEvidenceState,
        focalCytologyPreserved:
          semanticSupersession.focalCytologyPreserved,
      },
    };
  }

  const evidence = extractPositiveMarrowBlastEvidence(result);
  if (!evidence.positive) {
    return {
      ...result,
      marrowPositiveBlastEvidencePreservation: {
        version: MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
        active: false,
        positiveEvidencePresent: false,
        negativeOnlyAssessabilityGate: true,
      },
    };
  }

  const out = {
    ...result,
    findings: { ...asObject(result.findings) },
    fieldAdequacy: { ...asObject(result.fieldAdequacy) },
    morphologyAnalysis: { ...asObject(result.morphologyAnalysis) },
    whatAISees: { ...asObject(result.whatAISees) },
    overallAssessment: { ...asObject(result.overallAssessment) },
    structuredReport: { ...asObject(result.structuredReport) },
    patternRecognition: { ...asObject(result.patternRecognition) },
    localMorphologyEvidence: { ...asObject(result.localMorphologyEvidence) },
  };

  out.fieldAdequacy.blastAssessability = {
    ...asObject(out.fieldAdequacy.blastAssessability),
    assessabilityScope: "NEGATIVE_EXCLUSION_ONLY",
    negativeOnlyGateVersion: MARROW_NEGATIVE_ONLY_ASSESSABILITY_GATE_VERSION,
    positiveEvidencePresent: true,
    positiveEvidencePreserved: true,
    // A limited field may still make a negative exclusion illegal.
    negativeBlastConclusionAllowed:
      asObject(out.fieldAdequacy.blastAssessability).negativeBlastConclusionAllowed === true,
  };
  out.fieldAdequacy.positiveBlastEvidenceOverride = {
    ...asObject(out.fieldAdequacy.positiveBlastEvidenceOverride),
    version: MARROW_NEGATIVE_ONLY_ASSESSABILITY_GATE_VERSION,
    active: true,
    principle:
      "NEGATIVE_SCREEN_ASSESSABILITY_MAY_LIMIT_EXCLUSION_BUT_MAY_NOT_ERASE_STRUCTURED_POSITIVE_MARROW_BLAST_EVIDENCE",
  };

  out.findings.blastSuspicion = true;
  out.findings.immatureCells = true;
  out.findings.blastEvidenceState = evidence.observed
    ? "OBSERVED"
    : "SUSPICIOUS_INDETERMINATE";

  const lme = asObject(out.localMorphologyEvidence);
  out.localMorphologyEvidence = {
    ...lme,
    criticalMorphology: {
      ...asObject(lme.criticalMorphology),
      blastLikeMorphology: evidence.observed
        ? "OBSERVED"
        : "SUSPICIOUS_INDETERMINATE",
      blastEvidenceGovernanceVersion:
        MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
    },
  };

  out.normalityBlocked = true;
  out.requiresHumanReview = true;

  const finalClass = evidence.observed
    ? "MARROW_BLASTOID_POPULATION_OBSERVED"
    : evidence.suspicious
      ? "MARROW_BLASTOID_POPULATION_SUSPICIOUS"
      : "MARROW_BLASTOID_FOCAL_SUSPICION";

  const riskLevel = evidence.observed
    ? "Achado medular crítico — população blastoide/imatura"
    : evidence.suspicious
      ? "Alta prioridade — suspeita de população blastoide/imatura"
      : "Prioridade de revisão — suspeita focal blastoide/imatura";

  const mainFinding = evidence.observed
    ? "POPULAÇÃO BLASTOIDE/IMATURA OBSERVADA: evidência medular positiva estruturada preservada. A representatividade limita quantificação global, não o achado positivo."
    : evidence.suspicious
      ? "SUSPEITA DE POPULAÇÃO BLASTOIDE/IMATURA: evidência medular positiva estruturada preservada. Campo limitado restringe estimativa global, mas não invalida a suspeita."
      : "SUSPEITA FOCAL DE ELEMENTO BLASTOIDE/IMATURO: evidência positiva preservada e dependente de revisão especializada.";

  out.finalClassification = finalClass;
  out.morphologicRiskClass = finalClass;
  out.riskLevel = riskLevel;
  out.mainFinding = mainFinding;
  out.primaryFinding = mainFinding;
  out.finalConclusion = mainFinding;

  out.blockNormalReason = [
    ...new Set([
      ...asArray(out.blockNormalReason),
      "Evidência medular positiva de população blastoide/imatura",
      "Campo limitado não pode converter evidência positiva em NOT_ASSESSABLE",
      "Assessabilidade de blastos é gate de exclusão negativa, não de apagamento positivo",
    ]),
  ];

  out.morphologyAnalysis.absentFindings =
    stripContradictoryBlastNegatives(out.morphologyAnalysis.absentFindings) ||
    "Bastonetes de Auer não claramente identificados; a presença de evidência blastoide positiva impede afirmar ausência de blastos/células imaturas no campo.";
  out.morphologyAnalysis.negativeFindings =
    stripContradictoryNegativeArray(out.morphologyAnalysis.negativeFindings);
  out.morphologyAnalysis.summary = mainFinding;
  out.morphologyAnalysis.overview =
    out.morphologyAnalysis.overview || mainFinding;

  out.whatAISees.negativeFindings =
    stripContradictoryBlastNegatives(out.whatAISees.negativeFindings) ||
    "Não afirmar ausência de blastos ou células imaturas diante de evidência medular positiva estruturada.";
  out.whatAISees.dominantFinding = mainFinding;

  out.negativeFindingsStructured =
    stripContradictoryNegativeArray(out.negativeFindingsStructured);
  out.positiveFindings = [
    ...new Set([
      ...asArray(out.positiveFindings),
      evidence.observed
        ? "População blastoide/imatura observada no campo medular"
        : "População blastoide/imatura suspeita no campo medular",
    ]),
  ];

  out.patternRecognition.overallPattern = evidence.observed
    ? "MARROW_BLASTOID_POPULATION_OBSERVED"
    : evidence.suspicious
      ? "MARROW_BLASTOID_POPULATION_SUSPICIOUS"
      : "MARROW_BLASTOID_FOCAL_SUSPICION";

  out.globalPattern = {
    ...asObject(out.globalPattern),
    dominantPattern: out.patternRecognition.overallPattern,
    blastAssessmentState: evidence.observed
      ? "OBSERVED"
      : "SUSPICIOUS_INDETERMINATE",
    blastPositiveEvidencePreserved: true,
    negativeBlastScreeningAssessability:
      asObject(out.fieldAdequacy.blastAssessability).state || "NOT_ASSESSABLE",
  };

  out.overallAssessment.requiresHumanReview = true;
  out.overallAssessment.riskCategory = finalClass;
  out.overallAssessment.mainImpression = mainFinding;
  out.structuredReport.conclusion = mainFinding;
  out.structuredReport.recommendation =
    out.structuredReport.recommendation ||
    "Revisão microscópica hematológica especializada, avaliação de múltiplos campos e correlação com hemograma; imunofenotipagem se clinicamente indicada.";

  out.marrowPositiveBlastEvidencePreservation = {
    version: MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
    active: true,
    positiveEvidencePresent: true,
    evidenceState: evidence.state,
    source: evidence.source,
    approximateBlastLikeCells: evidence.approximateBlastLikeCells,
    reconciledBy00528: evidence.reconciledBy00528,
    negativeOnlyAssessabilityGate: true,
    negativeAssessabilityMayDowngradePositiveEvidence: false,
  };

  return out;
}

export function marrowPositiveBlastEvidencePreservationStatus(result = {}) {
  return asObject(result.marrowPositiveBlastEvidencePreservation);
}

export default applyMarrowPositiveBlastEvidencePreservation;
