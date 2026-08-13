// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.13 — SINGLE BLAST SENTINEL / ZERO-TOLERANCE BLAST ALERT
// ============================================================================
// Clinical safety invariant
// -------------------------
// A single explicitly observed/suspected blast-like element is sufficient to
// activate a critical blast review pathway. This mirrors the manual counter's
// clinical sensitivity without converting visual suspicion into a definitive
// diagnosis.
//
// 1 OBSERVED/SUSPECTED BLAST-LIKE CELL != CONFIRMED BLAST DIAGNOSIS
// 1 OBSERVED/SUSPECTED BLAST-LIKE CELL => BLAST ALERT + HUMAN REVIEW
// ============================================================================

export const SINGLE_BLAST_SENTINEL_VERSION = "BE-FIX-005.13";
export const BLAST_ASSESSABILITY_SENTINEL_VERSION = "BE-FIX-005.16";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalize(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isPositivePresence(value) {
  if (value === true) return true;
  const text = normalize(value);
  return [
    "observed",
    "present",
    "presente",
    "identificado",
    "identificada",
    "identificados",
    "identificadas",
    "suspected",
    "suspeito",
    "suspeita",
  ].includes(text);
}

function readManualBlastCount(result = {}) {
  const counts = asObject(result.counts);
  const manual = asObject(result.manualCounts);
  const raw = asObject(result.rawResponse);
  const rawCounts = asObject(raw.counts);

  const candidates = [
    counts.Blasto,
    counts.blasto,
    counts.blast,
    counts.blasts,
    manual.Blasto,
    manual.blasto,
    manual.blast,
    manual.blasts,
    rawCounts.Blasto,
    rawCounts.blasto,
    rawCounts.blast,
    rawCounts.blasts,
  ];

  for (const value of candidates) {
    const n = finiteNumber(value);
    if (n !== null) return Math.max(0, Math.trunc(n));
  }

  return null;
}

function detectSingleBlastSignal(result = {}) {
  const findings = asObject(result.findings);
  const lme = asObject(result.localMorphologyEvidence);
  const critical = asObject(lme.criticalMorphology);
  const raw = asObject(result.rawResponse);
  const rawPositive = asObject(raw.positiveFindings);
  const visualExtraction = asObject(result.visualExtraction);
  const leukocyteFindings = asObject(result.leukocyteFindings);
  const yoloFusion = asObject(result.yoloFusion);
  const blastSpatial = asObject(yoloFusion.blastSpatialSignal);

  const manualBlastCount = readManualBlastCount(result);
  if (manualBlastCount !== null && manualBlastCount >= 1) {
    return {
      active: true,
      source: "MANUAL_OR_HYBRID_COUNT",
      observedCount: manualBlastCount,
      certainty: "USER_RECORDED_BLAST",
      evidenceState: "OBSERVED",
    };
  }

  if (critical.blastLikeMorphology === "OBSERVED") {
    return {
      active: true,
      source: "LME_CRITICAL_MORPHOLOGY",
      observedCount: 1,
      minimumObservedCount: 1,
      certainty: "VISUAL_BLAST_LIKE_MORPHOLOGY",
      evidenceState: "OBSERVED",
    };
  }

  if (findings.blastSuspicion === true || rawPositive.blastSuspicion === true) {
    return {
      active: true,
      source: findings.blastSuspicion === true
        ? "FINAL_FINDINGS_BLAST_SUSPICION"
        : "RAW_POSITIVE_BLAST_SUSPICION",
      observedCount: null,
      minimumObservedCount: 1,
      certainty: "VISUAL_BLAST_SUSPICION",
      evidenceState: "SUSPICIOUS_INDETERMINATE",
    };
  }

  if (
    isPositivePresence(visualExtraction.suspectedBlasts) ||
    isPositivePresence(visualExtraction.blastosSuspeitos) ||
    isPositivePresence(leukocyteFindings.suspectedBlasts) ||
    isPositivePresence(leukocyteFindings.blastosSuspeitos)
  ) {
    return {
      active: true,
      source: "STRUCTURED_VISUAL_BLAST_SIGNAL",
      observedCount: null,
      minimumObservedCount: 1,
      certainty: "VISUAL_BLAST_SUSPICION",
      evidenceState: "SUSPICIOUS_INDETERMINATE",
    };
  }

  const yoloBlastCount = finiteNumber(blastSpatial.yoloBlastCount);
  if (blastSpatial.present === true && yoloBlastCount !== null && yoloBlastCount >= 1) {
    return {
      active: true,
      source: "YOLO_BLAST_SPATIAL_SIGNAL",
      observedCount: Math.trunc(yoloBlastCount),
      minimumObservedCount: 1,
      certainty: "COMPUTER_VISION_BLAST_SUSPICION",
      evidenceState: "SUSPICIOUS_INDETERMINATE",
    };
  }

  return {
    active: false,
    source: null,
    observedCount: manualBlastCount,
    minimumObservedCount: 0,
    certainty: "NO_POSITIVE_BLAST_SIGNAL",
    evidenceState: null,
  };
}

export function applySingleBlastSentinel(result = {}) {
  if (!result || typeof result !== "object") return result;

  const signal = detectSingleBlastSignal(result);
  const critical = asObject(result.localMorphologyEvidence?.criticalMorphology);
  const fieldGate = asObject(result.fieldAdequacy?.blastAssessability);
  const lmeGate = asObject(critical.blastAssessability);

  const blastAssessable =
    fieldGate.adequateForBlastScreening === true ||
    lmeGate.adequateForBlastScreening === true ||
    result.fieldAdequacy?.adequateForBlastScreening === true;

  const blastNegativeState =
    signal.active
      ? signal.evidenceState
      : (
          critical.blastLikeMorphology === "NOT_OBSERVED_IN_EVALUABLE_FIELD" &&
          blastAssessable
            ? "NOT_OBSERVED_IN_EVALUABLE_FIELD"
            : "NOT_ASSESSABLE"
        );

  result.singleBlastSentinel = {
    version: SINGLE_BLAST_SENTINEL_VERSION,
    active: signal.active,
    source: signal.source,
    observedCount: signal.observedCount,
    minimumObservedCount: signal.minimumObservedCount ?? 0,
    certainty: signal.certainty,
    evidenceState: signal.evidenceState,
    rule: "ONE_BLAST_OR_BLAST_LIKE_SIGNAL_TRIGGERS_ALERT",
    diagnosticConclusionAllowed: false,
    assessabilityVersion: BLAST_ASSESSABILITY_SENTINEL_VERSION,
    blastAssessable,
    negativeEvidenceState: blastNegativeState,
    negativeBlastConclusionAllowed:
      !signal.active &&
      blastAssessable &&
      blastNegativeState === "NOT_OBSERVED_IN_EVALUABLE_FIELD",
  };

  if (!signal.active) {
    if (!blastAssessable) {
      result.requiresHumanReview = true;
      result.normalityBlocked = true;
      result.blockNormalReason = Array.isArray(result.blockNormalReason)
        ? result.blockNormalReason
        : [];
      result.blockNormalReason = [
        ...new Set([
          ...result.blockNormalReason,
          "Triagem morfológica de blastos não avaliável com segurança neste campo",
        ]),
      ];
    }
    return result;
  }

  result.findings = asObject(result.findings);
  result.findings.blastSuspicion = true;
  result.findings.immatureCells = true;

  result.normalityBlocked = true;
  result.requiresHumanReview = true;
  result.finalClassification = "CLASS_4_BLAST_SUSPICION";
  result.morphologicRiskClass = "CLASS_4_BLAST_SUSPICION";
  result.riskLevel = "ALERTA CRÍTICO — suspeita de célula blástica/imatura";

  const manualConfirmed = signal.certainty === "USER_RECORDED_BLAST";
  const countText = signal.observedCount && signal.observedCount >= 1
    ? `${signal.observedCount}`
    : "pelo menos 1";

  const criticalText = manualConfirmed
    ? `${countText} blasto(s) informado(s) na contagem manual/híbrida. Achado crítico que requer revisão microscópica imediata e correlação com hemograma.`
    : `Pelo menos 1 elemento com morfologia blastoide/suspeita de blasto foi identificado no campo analisado. O achado deve ser sinalizado mesmo em campo limitado e requer revisão microscópica imediata e correlação com hemograma.`;

  result.mainFinding = criticalText;
  result.primaryFinding = criticalText;
  result.finalConclusion = criticalText;
  result.interpretiveSynthesis = criticalText;

  result.overallAssessment = asObject(result.overallAssessment);
  result.overallAssessment.requiresHumanReview = true;
  result.overallAssessment.riskCategory = "CLASS_4_BLAST_SUSPICION";
  result.overallAssessment.mainImpression = criticalText;

  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.morphologyAnalysis.summary = criticalText;
  result.morphologyAnalysis.overview =
    "Alerta crítico por presença de pelo menos um elemento blastoide/suspeito de blasto no campo analisado.";
  result.morphologyAnalysis.leukocyteReview =
    "Elemento(s) blastoide(s)/imaturo(s) suspeito(s) observado(s). A hipótese blástica não pode ser suprimida por padrão reacional concomitante nem por baixa representatividade do campo.";

  result.structuredReport = asObject(result.structuredReport);
  result.structuredReport.conclusion = criticalText;

  result.whatAISees = asObject(result.whatAISees);
  result.whatAISees.dominantFinding =
    "Elemento blastoide/suspeito de blasto identificado — alerta crítico.";

  result.clinicalMeaning =
    "Achado morfológico crítico: qualquer elemento blastoide/suspeito de blasto deve ser destacado e submetido a revisão microscópica profissional; a imagem isolada não estabelece diagnóstico definitivo.";

  result.blockNormalReason = Array.isArray(result.blockNormalReason)
    ? result.blockNormalReason
    : [];
  result.blockNormalReason = [
    ...new Set([
      ...result.blockNormalReason,
      "Presença de pelo menos um elemento blastoide/suspeito de blasto",
    ]),
  ];

  return result;
}

export default applySingleBlastSentinel;
