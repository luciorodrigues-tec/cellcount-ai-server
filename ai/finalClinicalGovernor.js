// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.17 — EVIDENCE PRESERVATION + SINGLE BLAST PRIORITY GOVERNOR
// FINAL CLINICAL GOVERNOR V2
//
// PRINCIPLE
// ---------
// The governor controls CLASSIFICATION, RISK and INFERENCE SCOPE.
// It may qualify or restrict conclusions, but it MUST NOT erase, rewrite,
// downgrade or replace direct local morphology evidence.
//
// localMorphologyEvidence = READ-ONLY clinical evidence.
// LIMITED_FIELD != NO_MORPHOLOGICAL_EVIDENCE
// NOT_OBSERVED_IN_FIELD != GLOBALLY_ABSENT
// ============================================================================

function safeBool(value) {
  return value === true;
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function cloneJson(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function restoreSnapshot(target, key, snapshot) {
  if (snapshot === undefined) return;
  target[key] = cloneJson(snapshot);
}

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isGenericLimitedText(value = "") {
  const text = normalizeText(value);
  if (!text) return true;

  const limitedTerms = [
    "campo limitado",
    "campo microscopico limitado",
    "baixa representatividade",
    "representatividade limitada",
    "insuficiente para conclusao",
    "insuficiente para conclusão",
  ];

  const morphologyTerms = [
    "observ",
    "nucleo",
    "nuclear",
    "cromatin",
    "nucleol",
    "citoplasm",
    "granul",
    "eritroc",
    "hemacia",
    "leucoc",
    "linfoc",
    "neutrofil",
    "monocit",
    "eosinofil",
    "basofil",
    "plaquet",
    "atip",
    "reativ",
    "blasto",
    "anisoc",
    "poiquiloc",
    "hipocrom",
    "esquizoc",
  ];

  return (
    limitedTerms.some((term) => text.includes(normalizeText(term))) &&
    !morphologyTerms.some((term) => text.includes(term))
  );
}

function firstMeaningfulText(candidates = []) {
  for (const candidate of candidates) {
    const text = String(candidate || "").trim();
    if (!text) continue;
    if (isGenericLimitedText(text)) continue;
    return text;
  }
  return "";
}

function collectLocalEvidenceText(result = {}) {
  const local = asObject(result.localMorphologyEvidence);
  const field = asObject(local.field);
  const rbc = asObject(local.erythrocytes);
  const wbc = asObject(local.leukocytes);
  const plt = asObject(local.platelets);
  const academic = asObject(local.academicReasoning);

  const academicWhatISee = Array.isArray(academic.whatISee)
    ? academic.whatISee.join(" ")
    : academic.whatISee;

  return firstMeaningfulText([
    // BE-FIX-005.6: the principal finding should prefer directly observed
    // cellular morphology. Representativity belongs to scope/governance and
    // must not displace the visible RBC/WBC/PLT description.
    wbc.description,
    rbc.description,
    plt.description,
    academicWhatISee,
    field.description,
    result?.morphologyAnalysis?.leukocyteReview,
    result?.morphologyAnalysis?.summary,
    result?.morphologyAnalysis?.overview,
    result?.whatAISees?.dominantFinding,
    result?.whatAISees?.freeNarrative,
    result?.interpretiveSynthesis,
  ]);
}

function hasLocalMorphologyEvidence(result = {}) {
  const local = asObject(result.localMorphologyEvidence);

  if (local.evidenceAvailable === true) return true;
  if (local.evidenceAvailable === false) return false;

  return Boolean(collectLocalEvidenceText(result));
}

function ensureObjects(result) {
  result.findings = asObject(result.findings);
  result.overallAssessment = asObject(result.overallAssessment);
  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.structuredReport = asObject(result.structuredReport);
  result.confidenceAnalysis = asObject(result.confidenceAnalysis);
  result.blockNormalReason = Array.isArray(result.blockNormalReason)
    ? result.blockNormalReason
    : [];

  return result;
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function captureProtectedEvidence(result = {}) {
  return {
    localMorphologyEvidence: cloneJson(result.localMorphologyEvidence),
    observedMorphology: cloneJson(result.observedMorphology),
    academicInterpretation: cloneJson(result.academicInterpretation),
    whatAISees: cloneJson(result.whatAISees),
    hematologicReasoning: cloneJson(result.hematologicReasoning),
    patternRecognition: cloneJson(result.patternRecognition),
  };
}

function restoreProtectedEvidence(result, snapshot) {
  restoreSnapshot(
    result,
    "localMorphologyEvidence",
    snapshot.localMorphologyEvidence,
  );
  restoreSnapshot(result, "observedMorphology", snapshot.observedMorphology);
  restoreSnapshot(
    result,
    "academicInterpretation",
    snapshot.academicInterpretation,
  );
  restoreSnapshot(result, "whatAISees", snapshot.whatAISees);
  restoreSnapshot(
    result,
    "hematologicReasoning",
    snapshot.hematologicReasoning,
  );
  restoreSnapshot(result, "patternRecognition", snapshot.patternRecognition);

  return result;
}

export function applyFinalClinicalGovernor(result = {}) {
  if (!result || typeof result !== "object") {
    return result;
  }

  // Capture evidence BEFORE any governance mutation.
  // These namespaces are read-only from the governor's perspective.
  const protectedEvidence = captureProtectedEvidence(result);

  // Clone the top-level and mutable governance namespaces so the governor does
  // not mutate the upstream object by reference.
  const final = ensureObjects({
    ...result,
    findings: { ...asObject(result.findings) },
    overallAssessment: { ...asObject(result.overallAssessment) },
    morphologyAnalysis: { ...asObject(result.morphologyAnalysis) },
    structuredReport: { ...asObject(result.structuredReport) },
    confidenceAnalysis: { ...asObject(result.confidenceAnalysis) },
    blockNormalReason: Array.isArray(result.blockNormalReason)
      ? [...result.blockNormalReason]
      : [],
  });

  const f = final.findings;
  const field = asObject(final.fieldAdequacy);
  const lymphoid = asObject(final.lymphoidPatternAnalysis);

  const visibleLeukocytes = Number(field.visibleLeukocytes || 0);
  const adequatePopulation =
    field.adequateForPopulationAssessment === true ||
    field.populationInferenceAllowed === true;

  const localEvidenceAvailable = hasLocalMorphologyEvidence(final);

  const reactivePattern =
    safeBool(f.reactiveLymphocytes) ||
    safeBool(f.mononucleosisSuspicion) ||
    safeBool(f.downeyLikeCells) ||
    lymphoid.lymphoidPattern === "REACTIVE_LYMPHOID_PATTERN" ||
    lymphoid.forceDowngrade === true;

  const criticalMorphology = asObject(final.localMorphologyEvidence?.criticalMorphology);
  const blastSentinel = asObject(final.singleBlastSentinel);
  const blastEvidenceState =
    String(
      blastSentinel.evidenceState ||
      criticalMorphology.blastLikeMorphology ||
      f.blastEvidenceState ||
      "",
    ).trim();

  const observedBlastEvidence =
    blastEvidenceState === "OBSERVED" ||
    blastSentinel.confirmedMorphologicObservation === true ||
    Number(criticalMorphology.observedBlastLikeCount || 0) >= 1;

  const suspiciousBlastEvidence =
    observedBlastEvidence ||
    blastEvidenceState === "SUSPICIOUS_INDETERMINATE" ||
    blastSentinel.active === true ||
    safeBool(f.blastSuspicion);

  // BE-FIX-005.17: reactive morphology can coexist with blast evidence, but it
  // can never suppress or downgrade it.
  const strongBlastEvidence = suspiciousBlastEvidence;

  const highNeoplasticEvidence =
    safeBool(f.plasmablasts) &&
    safeBool(f.monomorphicPopulation) &&
    !reactivePattern;

  const sustainedAtypicalPopulation =
    adequatePopulation &&
    visibleLeukocytes >= 8 &&
    !reactivePattern &&
    (
      safeBool(f.largeMononuclearCells) ||
      safeBool(f.atypicalLymphocytes) ||
      safeBool(f.plasmacytoidCells) ||
      safeBool(f.plasmocytes) ||
      safeBool(f.monomorphicPopulation)
    );

  const limitedField =
    field.adequateForPopulationAssessment === false ||
    field.populationInferenceAllowed === false ||
    field.limitedField === true ||
    final?.adequacyAssessment?.classification === "LIMITED_FIELD";

  let finalClass = "CLASS_0_NORMAL";
  let riskLevel = "Sem alterações morfológicas relevantes";
  let mainFinding =
    "Campo sem alterações morfológicas relevantes no material analisado.";
  let requiresHumanReview = false;

  if (strongBlastEvidence) {
    finalClass = "CLASS_4_BLAST_SUSPICION";
    riskLevel = observedBlastEvidence
      ? "ALERTA CRÍTICO — blasto/blastoide observado"
      : "ALTO RISCO — suspeita de blasto/blastoide";
    mainFinding = observedBlastEvidence
      ? "Pelo menos um elemento com morfologia blástica/blastoide foi observado. Achado crítico que requer revisão microscópica imediata e correlação com hemograma."
      : "Pelo menos um elemento apresenta morfologia suspeita de blasto/blastoide. Requer revisão microscópica prioritária e correlação com hemograma.";
    requiresHumanReview = true;
  } else if (highNeoplasticEvidence) {
    finalClass = "CLASS_5_HIGH_NEOPLASTIC_SUSPICION";
    riskLevel = "Alta suspeita morfológica";
    mainFinding =
      "Padrão monomórfico/plasmoblástico sustentado no material analisado. Requer revisão hematológica especializada.";
    requiresHumanReview = true;
  } else if (reactivePattern) {
    finalClass = "CLASS_2_ATYPICAL_REACTIVE_PATTERN";
    riskLevel = "Possível padrão linfoide reacional";
    mainFinding =
      "Achados compatíveis com possível reatividade linfoide no campo analisado, sem elementos suficientes para caracterizar população linfoide atípica sustentada ou suspeita blástica.";
    requiresHumanReview = true;
  } else if (sustainedAtypicalPopulation) {
    finalClass = "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION";
    riskLevel = "População mononuclear atípica sustentada";
    mainFinding =
      "População mononuclear atípica sustentada no campo analisado, sem critérios definitivos de blasto.";
    requiresHumanReview = true;
  } else if (limitedField) {
    finalClass = "CLASS_1_LIMITED_FIELD";
    riskLevel = "Campo limitado";

    const observedMorphology = collectLocalEvidenceText(final);

    mainFinding =
      localEvidenceAvailable && observedMorphology
        ? observedMorphology
        : "Campo microscópico limitado para conclusão populacional confiável. Recomenda-se avaliação de múltiplos campos.";

    requiresHumanReview = true;
  }

  final.finalClassification = finalClass;
  final.morphologicRiskClass = finalClass;
  final.riskLevel = riskLevel;
  final.mainFinding = mainFinding;
  final.primaryFinding = mainFinding;
  final.finalConclusion = mainFinding;
  final.normalityBlocked = finalClass !== "CLASS_0_NORMAL";
  final.requiresHumanReview = requiresHumanReview;

  final.overallAssessment.requiresHumanReview = requiresHumanReview;
  final.overallAssessment.riskCategory = finalClass;
  final.overallAssessment.mainImpression = mainFinding;

  // Classification governs risk and inference scope — never the evidence text.
  // Only fill missing narrative slots. Existing morphology survives unchanged.
  if (!final.morphologyAnalysis.summary) {
    final.morphologyAnalysis.summary = mainFinding;
  }

  if (!final.morphologyAnalysis.leukocyteReview) {
    final.morphologyAnalysis.leukocyteReview =
      finalClass === "CLASS_0_NORMAL"
        ? "Série leucocitária sem alterações relevantes no campo analisado."
        : mainFinding;
  }

  final.structuredReport.conclusion = mainFinding;

  final.structuredReport.hematologicMeaning =
    limitedField
      ? "A representatividade do campo limita inferências populacionais globais. Achados morfológicos positivos observados permanecem válidos no escopo do campo e devem ser correlacionados com hemograma completo, múltiplos campos e revisão microscópica profissional."
      : finalClass === "CLASS_0_NORMAL"
        ? "A interpretação deve ser correlacionada com hemograma completo e contexto clínico."
        : "Achado morfológico educacionalmente relevante. Requer correlação com hemograma completo, contexto clínico e revisão microscópica profissional.";

  final.structuredReport.recommendation =
    requiresHumanReview
      ? "Correlacionar com hemograma completo, avaliação de múltiplos campos e revisão microscópica profissional."
      : "Correlação clínico-laboratorial conforme contexto.";

  final.clinicalMeaning =
    final.clinicalMeaning || final.structuredReport.hematologicMeaning;

  final.interpretiveSynthesis =
    final.interpretiveSynthesis || mainFinding;

  final.blockNormalReason = final.normalityBlocked
    ? uniqueStrings([
        ...final.blockNormalReason,
        limitedField
          ? "Representatividade insuficiente para afirmar normalidade hematológica global."
          : mainFinding,
      ])
    : [];

  // Dedicated governance metadata: consumers can distinguish evidence from
  // inference restriction without parsing clinical prose.
  final.evidenceGovernance = {
    version: "EPG-1.0",
    localMorphologyEvidenceProtected: true,
    localMorphologyEvidenceAvailable: localEvidenceAvailable,
    limitedField,
    populationInferenceAllowed: !limitedField && adequatePopulation,
    globalNormalityAssertionAllowed:
      !limitedField && field.globalNormalityAssertionAllowed !== false,
    globalNegativeExclusionAllowed:
      !limitedField && field.globalNegativeExclusionAllowed !== false,
    morphologyDescriptionAllowed:
      localEvidenceAvailable || field.morphologyDescriptionAllowed === true,
    evidenceScope: limitedField ? "FIELD_SCOPED" : "POPULATION_ASSESSABLE",
  };

  // Hard invariant: restore protected evidence byte-for-byte equivalent to the
  // upstream snapshot after governance has completed.
  restoreProtectedEvidence(final, protectedEvidence);

  return final;
}

export default applyFinalClinicalGovernor;
