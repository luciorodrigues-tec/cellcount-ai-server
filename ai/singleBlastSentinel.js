// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.17 — SINGLE BLAST CONFIRMATION & CRITICAL ALERT GOVERNANCE
// ============================================================================
// Invariants
// 1. One OBSERVED blast/blast-like cell => CRITICAL alert + mandatory review.
// 2. One SUSPICIOUS blast-like signal => HIGH-priority alert + mandatory review.
// 3. Limited field never suppresses a positive focal blast finding.
// 4. Reactive morphology never downgrades blast evidence.
// 5. NOT_ASSESSABLE is never converted into a negative blast conclusion.
// ============================================================================

export const SINGLE_BLAST_SENTINEL_VERSION = "BE-FIX-005.13";
export const SINGLE_BLAST_CONFIRMATION_GOVERNANCE_VERSION = "BE-FIX-005.17";
export const BLAST_ASSESSABILITY_SENTINEL_VERSION = "BE-FIX-005.16";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function normalize(value = "") {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function isPositivePresence(value) {
  if (value === true) return true;
  return ["observed","present","presente","identificado","identificada","suspected","suspeito","suspeita"].includes(normalize(value));
}
function readManualBlastCount(result = {}) {
  const counts = asObject(result.counts); const manual = asObject(result.manualCounts);
  const rawCounts = asObject(asObject(result.rawResponse).counts);
  for (const value of [counts.Blasto,counts.blasto,counts.blast,counts.blasts,manual.Blasto,manual.blasto,manual.blast,manual.blasts,rawCounts.Blasto,rawCounts.blasto,rawCounts.blast,rawCounts.blasts]) {
    const n = finiteNumber(value); if (n !== null) return Math.max(0, Math.trunc(n));
  }
  return null;
}
function classifySignal(result = {}) {
  const findings = asObject(result.findings);
  const critical = asObject(result.localMorphologyEvidence?.criticalMorphology);
  const visualExtraction = asObject(result.visualExtraction);
  const leukocyteFindings = asObject(result.leukocyteFindings);
  const blastSpatial = asObject(asObject(result.yoloFusion).blastSpatialSignal);
  const manualCount = readManualBlastCount(result);
  if (manualCount !== null && manualCount >= 1) return {active:true,state:"OBSERVED",source:"MANUAL_OR_HYBRID_COUNT",observedCount:manualCount,certainty:"USER_RECORDED_BLAST"};
  const lmeCount = finiteNumber(critical.observedBlastLikeCount);
  if (critical.blastLikeMorphology === "OBSERVED" || (lmeCount !== null && lmeCount >= 1)) return {active:true,state:"OBSERVED",source:"LME_CRITICAL_MORPHOLOGY",observedCount:lmeCount ?? 1,certainty:"VISUAL_BLAST_LIKE_MORPHOLOGY"};
  if (critical.blastLikeMorphology === "SUSPICIOUS_INDETERMINATE" || findings.blastEvidenceState === "SUSPICIOUS_INDETERMINATE" || findings.blastSuspicion === true) return {active:true,state:"SUSPICIOUS_INDETERMINATE",source:"STRUCTURED_BLAST_SUSPICION",observedCount:null,certainty:"VISUAL_BLAST_SUSPICION"};
  if (isPositivePresence(visualExtraction.suspectedBlasts) || isPositivePresence(visualExtraction.blastosSuspeitos) || isPositivePresence(leukocyteFindings.suspectedBlasts) || isPositivePresence(leukocyteFindings.blastosSuspeitos)) return {active:true,state:"SUSPICIOUS_INDETERMINATE",source:"STRUCTURED_VISUAL_BLAST_SIGNAL",observedCount:null,certainty:"VISUAL_BLAST_SUSPICION"};
  const yoloCount = finiteNumber(blastSpatial.yoloBlastCount);
  if (blastSpatial.present === true && yoloCount !== null && yoloCount >= 1) return {active:true,state:"SUSPICIOUS_INDETERMINATE",source:"YOLO_BLAST_SPATIAL_SIGNAL",observedCount:Math.trunc(yoloCount),certainty:"COMPUTER_VISION_BLAST_SUSPICION"};
  return {active:false,state:null,source:null,observedCount:manualCount,certainty:"NO_POSITIVE_BLAST_SIGNAL"};
}
function pushUnique(arr, value) { return [...new Set([...(Array.isArray(arr)?arr:[]), value])]; }

export function applySingleBlastSentinel(result = {}) {
  if (!result || typeof result !== "object") return result;
  const signal = classifySignal(result);
  const critical = asObject(result.localMorphologyEvidence?.criticalMorphology);
  const fieldGate = asObject(result.fieldAdequacy?.blastAssessability);
  const lmeGate = asObject(critical.blastAssessability);
  const blastAssessable = fieldGate.adequateForBlastScreening === true || lmeGate.adequateForBlastScreening === true || result.fieldAdequacy?.adequateForBlastScreening === true;
  const negativeState = signal.active ? signal.state : (critical.blastLikeMorphology === "NOT_OBSERVED_IN_EVALUABLE_FIELD" && blastAssessable ? "NOT_OBSERVED_IN_EVALUABLE_FIELD" : "NOT_ASSESSABLE");
  const observed = signal.state === "OBSERVED";
  const suspicious = signal.state === "SUSPICIOUS_INDETERMINATE";
  result.singleBlastSentinel = {
    version:SINGLE_BLAST_SENTINEL_VERSION, governanceVersion:SINGLE_BLAST_CONFIRMATION_GOVERNANCE_VERSION, active:signal.active, source:signal.source, observedCount:signal.observedCount, minimumObservedCount:signal.active?1:0, certainty:signal.certainty, evidenceState:signal.state,
    alertLevel: observed ? "CRITICAL" : suspicious ? "HIGH" : "NONE", confirmedMorphologicObservation: observed, diagnosticConclusionAllowed:false,
    rule:"ONE_OBSERVED_BLAST_TRIGGERS_CRITICAL_ALERT; ONE_SUSPICIOUS_BLAST_TRIGGERS_HIGH_PRIORITY_REVIEW", assessabilityVersion:BLAST_ASSESSABILITY_SENTINEL_VERSION, blastAssessable, negativeEvidenceState:negativeState,
    negativeBlastConclusionAllowed:!signal.active && blastAssessable && negativeState === "NOT_OBSERVED_IN_EVALUABLE_FIELD",
  };
  if (!signal.active) {
    if (!blastAssessable) { result.requiresHumanReview=true; result.normalityBlocked=true; result.blockNormalReason=pushUnique(result.blockNormalReason,"Triagem morfológica de blastos não avaliável com segurança neste campo"); }
    return result;
  }
  result.findings=asObject(result.findings); result.findings.blastSuspicion=true; result.findings.immatureCells=true; result.findings.blastEvidenceState=signal.state;
  if (observed) result.findings.observedBlastLikeCount=Math.max(1, signal.observedCount || 1);
  result.normalityBlocked=true; result.requiresHumanReview=true; result.finalClassification="CLASS_4_BLAST_SUSPICION"; result.morphologicRiskClass="CLASS_4_BLAST_SUSPICION";
  result.riskLevel=observed ? "ALERTA CRÍTICO — blasto/blastoide observado" : "ALTO RISCO — suspeita de célula blástica/blastoide";
  const countText = observed ? String(Math.max(1, signal.observedCount || 1)) : "Pelo menos 1";
  const criticalText = observed
    ? `${countText} blasto/blastoide observado — ${countText} elemento(s) com morfologia blástica/blastoide foi(ram) observado(s). Achado crítico: requer revisão microscópica imediata e correlação com hemograma; a imagem isolada não define etiologia.`
    : "Pelo menos 1 elemento com morfologia suspeita de blasto/blastoide foi identificado. Achado de alta prioridade: requer revisão microscópica imediata; suspeita visual não equivale a confirmação diagnóstica.";
  result.mainFinding=criticalText; result.primaryFinding=criticalText; result.finalConclusion=criticalText; result.interpretiveSynthesis=criticalText;
  result.overallAssessment=asObject(result.overallAssessment); result.overallAssessment.requiresHumanReview=true; result.overallAssessment.riskCategory="CLASS_4_BLAST_SUSPICION"; result.overallAssessment.mainImpression=criticalText;
  result.morphologyAnalysis=asObject(result.morphologyAnalysis); result.morphologyAnalysis.summary=criticalText; result.morphologyAnalysis.overview=observed ? "Alerta crítico por elemento blástico/blastoide observado no campo analisado." : "Alerta de alta prioridade por elemento blastoide suspeito no campo analisado.";
  result.morphologyAnalysis.leukocyteReview="A evidência blástica focal tem prioridade sobre classificações reacionais e não pode ser suprimida por baixa representatividade do campo.";
  result.structuredReport=asObject(result.structuredReport); result.structuredReport.conclusion=criticalText;
  result.whatAISees=asObject(result.whatAISees); result.whatAISees.dominantFinding=observed ? "Blasto/blastoide observado — alerta crítico." : "Elemento blastoide suspeito — revisão prioritária.";
  result.clinicalMeaning=observed ? "Achado morfológico crítico. Um único blasto/blastoide observado já exige sinalização e revisão profissional imediata." : "Achado morfológico de alta prioridade. Suspeita blastoide requer confirmação por revisão microscópica profissional.";
  result.blockNormalReason=pushUnique(result.blockNormalReason, observed ? "Presença de pelo menos um blasto/blastoide observado" : "Presença de pelo menos um elemento blastoide suspeito");
  return result;
}
export default applySingleBlastSentinel;
