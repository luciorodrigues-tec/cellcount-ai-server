// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.14 — PARASITE EVIDENCE SENTINEL & ARTIFACT DISCRIMINATION
// ============================================================================

export const PARASITE_EVIDENCE_SENTINEL_VERSION = "BE-FIX-005.14";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasAny(text = "", terms = []) {
  const n = normalize(text);
  return terms.some((t) => n.includes(normalize(t)));
}

function parasiteTriState(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const critical = asObject(lme.criticalMorphology);
  const state = critical.parasites;
  return [
    "OBSERVED",
    "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    "NOT_ASSESSABLE",
  ].includes(state)
    ? state
    : "NOT_ASSESSABLE";
}

function explicitParasiteObserved(result = {}) {
  if (parasiteTriState(result) === "OBSERVED") return true;

  const raw = asObject(result.rawResponse);
  const explicit = asObject(raw.localMorphologyEvidence);
  const critical = asObject(explicit.criticalMorphology);

  return critical.parasites === "OBSERVED";
}

function collectArtifactEvidence(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const field = asObject(lme.field);
  const rbc = asObject(lme.erythrocytes);
  const observed = asObject(result.observedMorphology);
  const rawObserved = asObject(asObject(result.rawResponse).observedMorphology);

  return [
    ...asArray(field.artifacts),
    ...asArray(observed.artifacts),
    ...asArray(rawObserved.artifacts),
    rbc.artifactConsiderations,
    result.patternRecognition?.artifactPattern,
    result.whatAISees?.unusualStructures,
  ]
    .filter(Boolean)
    .map(String);
}

function classifyArtifact(result = {}) {
  const evidence = collectArtifactEvidence(result);
  const joined = evidence.join(" | ");

  const likelyArtifact = hasAny(joined, [
    "artefato",
    "artifact",
    "precipitado",
    "precipitate",
    "corante",
    "stain",
    "sujeira",
    "debris",
    "fibra",
    "fiber",
    "crenacao",
    "crenação",
    "sobreposicao",
    "sobreposição",
    "overlap",
    "compressao",
    "compressão",
    "fora de foco",
    "out of focus",
    "reflexo",
    "glare",
    "borda da lamina",
    "borda da lâmina",
    "smear edge",
  ]);

  return {
    likelyArtifact,
    evidence,
    confidence: likelyArtifact ? "moderate" : "low",
  };
}

function stripParasiteReasons(values = []) {
  return asArray(values).filter((item) => {
    const t = normalize(item);
    return !hasAny(t, [
      "hemoparasita",
      "plasmodium",
      "babesia",
      "trypanosoma",
      "tripanossoma",
      "microfilaria",
      "microfilária",
      "parasita",
    ]);
  });
}

function cleanseFalseParasiteProjection(result = {}, artifact = {}) {
  result.findings = asObject(result.findings);
  result.findings.parasiteSuspected = false;
  result.findings.plasmodiumSuspected = false;
  result.findings.parasiteType = "NONE";
  result.findings.blockPlasmodiumDiagnosis = false;

  if (result.fieldAdequacy && typeof result.fieldAdequacy === "object") {
    result.fieldAdequacy.parasiteSignal = false;
  }

  result.parasiteAnalysis = {
    suspected: false,
    parasiteType: "NONE",
    parasiteName: "",
    blockPlasmodiumDiagnosis: false,
    interpretation: artifact.likelyArtifact
      ? "Estrutura incomum favorece artefato técnico/óptico; não há evidência visual estruturada positiva suficiente para suspeita de hemoparasita."
      : "Não há evidência visual estruturada positiva suficiente para suspeita de hemoparasita.",
    recommendation:
      "Se persistir dúvida morfológica, revisar múltiplos campos e confirmar por microscopia profissional.",
  };

  result.blockNormalReason = stripParasiteReasons(result.blockNormalReason);

  const parasiteClasses = new Set([
    "CLASS_1_LIMITED_FIELD_HEMOPARASITE_SUSPECT",
    "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE",
    "CLASS_2_HEMOPARASITE_SUSPICION",
  ]);

  const blastActive =
    result.singleBlastSentinel?.active === true ||
    result.findings.blastSuspicion === true;

  if (parasiteClasses.has(result.finalClassification) && !blastActive) {
    result.finalClassification =
      result.fieldAdequacy?.limitedField === true
        ? "CLASS_1_LIMITED_FIELD"
        : "CLASS_2_UNUSUAL_STRUCTURE";
  }

  if (parasiteClasses.has(result.morphologicRiskClass) && !blastActive) {
    result.morphologicRiskClass =
      result.fieldAdequacy?.limitedField === true
        ? "CLASS_1_LIMITED_FIELD"
        : "CLASS_2_UNUSUAL_STRUCTURE";
  }

  if (
    !blastActive &&
    /hemoparasit|parasitar/i.test(String(result.riskLevel || ""))
  ) {
    result.riskLevel = artifact.likelyArtifact
      ? "Estrutura incomum/artefato a esclarecer"
      : "Estrutura incomum sem evidência parasitária confirmatória";
  }

  if (blastActive) return result;

  const artifactText = artifact.likelyArtifact
    ? "Estrutura incomum com características favorecendo artefato técnico/óptico; sem evidência estruturada positiva de hemoparasita."
    : "Estrutura incomum sem evidência estruturada positiva suficiente para suspeita de hemoparasita.";

  const sanitize = (value) => {
    const t = String(value || "");
    if (!t.trim()) return t;
    return /hemoparasit|plasmodium|babesia|trypanos|microfilar|parasitar/i.test(t)
      ? artifactText
      : t;
  };

  result.mainFinding = sanitize(result.mainFinding);
  result.primaryFinding = sanitize(result.primaryFinding);
  result.finalConclusion = sanitize(result.finalConclusion);

  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.whatAISees = asObject(result.whatAISees);
  result.structuredReport = asObject(result.structuredReport);
  result.overallAssessment = asObject(result.overallAssessment);

  result.morphologyAnalysis.summary = sanitize(result.morphologyAnalysis.summary);
  result.morphologyAnalysis.overview = sanitize(result.morphologyAnalysis.overview);
  result.morphologyAnalysis.biologicalInterpretation =
    sanitize(result.morphologyAnalysis.biologicalInterpretation);
  result.morphologyAnalysis.differentialDiagnosis =
    sanitize(result.morphologyAnalysis.differentialDiagnosis);

  result.whatAISees.dominantFinding = sanitize(result.whatAISees.dominantFinding);
  result.whatAISees.unusualStructures = artifactText;

  result.structuredReport.conclusion = sanitize(result.structuredReport.conclusion);
  result.structuredReport.hematologicMeaning =
    sanitize(result.structuredReport.hematologicMeaning);

  result.overallAssessment.mainImpression =
    sanitize(result.overallAssessment.mainImpression);

  if (parasiteClasses.has(result.overallAssessment.riskCategory)) {
    result.overallAssessment.riskCategory =
      result.fieldAdequacy?.limitedField === true
        ? "CLASS_1_LIMITED_FIELD"
        : "CLASS_2_UNUSUAL_STRUCTURE";
  }

  return result;
}

export function evaluateParasiteArtifactEvidence(result = {}) {
  const state = parasiteTriState(result);
  const observed = explicitParasiteObserved(result);
  const artifact = classifyArtifact(result);

  return {
    version: PARASITE_EVIDENCE_SENTINEL_VERSION,
    parasiteTriState: state,
    explicitPositiveParasiteEvidence: observed,
    artifactLikely: artifact.likelyArtifact,
    artifactConfidence: artifact.confidence,
    artifactEvidence: artifact.evidence,
    parasitePromotionAllowed: observed,
  };
}

export function applyParasiteEvidenceSentinel(result = {}) {
  if (!result || typeof result !== "object") return result;

  const assessment = evaluateParasiteArtifactEvidence(result);
  result.parasiteEvidenceSentinel = assessment;

  if (assessment.explicitPositiveParasiteEvidence) {
    result.findings = asObject(result.findings);
    result.findings.parasiteSuspected = true;
    result.parasiteAnalysis = {
      ...asObject(result.parasiteAnalysis),
      suspected: true,
      evidenceAuthority: "LME-1.0",
      parasiteTriState: "OBSERVED",
    };
    result.normalityBlocked = true;
    result.requiresHumanReview = true;
    return result;
  }

  return cleanseFalseParasiteProjection(result, {
    likelyArtifact: assessment.artifactLikely,
    evidence: assessment.artifactEvidence,
  });
}

export default applyParasiteEvidenceSentinel;
