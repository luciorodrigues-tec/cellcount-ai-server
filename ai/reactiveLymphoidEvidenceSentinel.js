// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.15 — EVIDENCE-GROUNDED REACTIVE LYMPHOID SENTINEL
// ============================================================================
// Core invariants
// ---------------
// 1. Large mononuclear cell alone != reactive lymphoid pattern.
// 2. Atypical lymphocyte alone != reactive lymphoid pattern.
// 3. Reactive classification requires direct structured visual evidence.
// 4. Mononucleosis/EBV/CMV language requires stronger morphology than a
//    generic "reactiveLymphocytes=true" flag.
// 5. Blast and parasite sentinels have higher priority and are never downgraded.
// ============================================================================

export const REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION = "BE-FIX-005.15";
export const REACTIVE_BLAST_ASSESSABILITY_GATE_VERSION = "BE-FIX-005.16";

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

function countTrue(values = []) {
  return values.filter((value) => value === true).length;
}

function rawFindingsOf(result = {}) {
  const raw = asObject(result.rawResponse);
  return asObject(raw.findings);
}

function visualEvidenceOf(result = {}) {
  const raw = asObject(result.rawResponse);
  return {
    ...asObject(raw.visualEvidence),
    ...asObject(result.visualEvidence),
  };
}

function directMorphologyOf(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const leukocytes = asObject(lme.leukocytes);
  return leukocytes;
}

function hasDirectReactiveText(result = {}) {
  const leukocytes = directMorphologyOf(result);
  const text = normalize([
    leukocytes.atypia,
    leukocytes.cytoplasm,
    leukocytes.description,
    leukocytes.nuclearMorphology,
  ].filter(Boolean).join(" | "));

  return [
    "reativ",
    "basofilia periferica",
    "citoplasma basofilico abundante",
    "moldagem",
    "bordas irregulares",
  ].some((term) => text.includes(normalize(term)));
}

function hasDowneyOrImmunoblastoidEvidence(result = {}) {
  const f = {
    ...rawFindingsOf(result),
    ...asObject(result.findings),
  };

  return (
    f.downeyLikeCells === true ||
    f.monocytoidAtypicalLymphocytes === true ||
    f.immunoblastoidCells === true ||
    ["DOWNEY_TYPE_II", "DOWNEY_TYPE_III_IMMUNOBLASTOID"]
      .includes(String(f.atypicalLymphocyteSubtype || "").trim())
  );
}

export function evaluateReactiveLymphoidEvidence(result = {}) {
  const rawFindings = rawFindingsOf(result);
  const finalFindings = asObject(result.findings);
  const visual = visualEvidenceOf(result);

  // Direct structured flags: raw vision evidence is preferred because later
  // legacy normalizers may synthesize reactive flags.
  const explicitReactive =
    rawFindings.reactiveLymphocytes === true ||
    (
      Object.keys(rawFindings).length === 0 &&
      finalFindings.reactiveLymphocytes === true
    );

  const explicitAtypical =
    rawFindings.atypicalLymphocytes === true ||
    finalFindings.atypicalLymphocytes === true;

  const largeMononuclear =
    rawFindings.largeMononuclearCells === true ||
    finalFindings.largeMononuclearCells === true;

  const reactiveFeatureCount = countTrue([
    visual.abundantBasophilicCytoplasm,
    visual.erythrocyteMolding,
    visual.irregularCellBorders,
  ]);

  const cellSizeSupport =
    visual.cellSizeIncrease === true;

  const directReactiveMorphology =
    hasDirectReactiveText(result);

  const downeyOrImmunoblastoid =
    hasDowneyOrImmunoblastoidEvidence(result);

  // A single model boolean is not enough. Require one additional morphology
  // support, or explicit Downey/immunoblastoid evidence.
  const reactivePatternSupported =
    downeyOrImmunoblastoid ||
    (
      explicitReactive &&
      (
        reactiveFeatureCount >= 1 ||
        directReactiveMorphology
      )
    );

  // EBV/CMV/mononucleosis language receives a higher bar.
  const mononucleosisPatternSupported =
    downeyOrImmunoblastoid ||
    (
      explicitReactive &&
      reactiveFeatureCount >= 2 &&
      cellSizeSupport
    );

  const isolatedAtypicalMononuclearSignal =
    !reactivePatternSupported &&
    (
      largeMononuclear ||
      explicitAtypical
    );

  const blastAssessability =
    asObject(result.fieldAdequacy?.blastAssessability);

  const blastAssessable =
    blastAssessability.adequateForBlastScreening === true ||
    result.fieldAdequacy?.adequateForBlastScreening === true ||
    result.localMorphologyEvidence?.criticalMorphology
      ?.blastAssessability?.adequateForBlastScreening === true;

  // BE-FIX-005.16: reactive morphology may be described, but a reactive
  // population classification must not become an implicit blast exclusion
  // when fine nuclear detail is not assessable.
  const reactiveClassificationAllowed =
    reactivePatternSupported && blastAssessable;

  return {
    version: REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
    explicitReactive,
    explicitAtypical,
    largeMononuclear,
    reactiveFeatureCount,
    cellSizeSupport,
    directReactiveMorphology,
    downeyOrImmunoblastoid,
    reactivePatternSupported,
    mononucleosisPatternSupported,
    isolatedAtypicalMononuclearSignal,
    blastAssessabilityGateVersion:
      REACTIVE_BLAST_ASSESSABILITY_GATE_VERSION,
    blastAssessable,
    reactiveClassificationAllowed,
  };
}

function stripUnsupportedMononucleosisDifferentials(items = []) {
  const forbidden = [
    "mononucleose",
    "ebv",
    "epstein",
    "cmv",
    "citomegalovirus",
    "sindrome mononucleosica",
    "síndrome mononucleósica",
  ];

  return asArray(items).filter((item) => {
    const text = normalize(item);
    return !forbidden.some((term) => text.includes(normalize(term)));
  });
}

function safeTextForUnsupportedReactive(result = {}) {
  const limited =
    result.fieldAdequacy?.limitedField === true ||
    result.fieldAdequacy?.adequateForPopulationAssessment === false;

  return limited
    ? "Campo limitado com célula(s) mononuclear(es) aumentada(s)/atípica(s) observada(s), sem evidência morfológica estruturada suficiente para promover padrão linfoide reacional populacional."
    : "Alteração mononuclear atípica observada, sem evidência morfológica estruturada suficiente para promover padrão linfoide reacional.";
}

function replaceReactiveNarrative(value, replacement) {
  const text = String(value || "");
  if (!text.trim()) return text;

  const n = normalize(text);
  const hasUnsupportedReactiveLanguage =
    [
      "ativacao linfoide reacional",
      "padrão linfoide reacional",
      "padrao linfoide reacional",
      "resposta viral",
      "mononucleose",
      "ebv",
      "cmv",
      "citomegalovirus",
      "sindrome mononucleosica",
    ].some((term) => n.includes(normalize(term)));

  return hasUnsupportedReactiveLanguage ? replacement : text;
}

export function applyReactiveLymphoidEvidenceSentinel(result = {}) {
  if (!result || typeof result !== "object") return result;

  const assessment = evaluateReactiveLymphoidEvidence(result);
  result.reactiveLymphoidEvidenceSentinel = assessment;

  // Higher-priority critical pathways are immutable here.
  const blastActive =
    result.singleBlastSentinel?.active === true ||
    result.findings?.blastSuspicion === true ||
    result.finalClassification === "CLASS_4_BLAST_SUSPICION" ||
    result.morphologicRiskClass === "CLASS_4_BLAST_SUSPICION";

  const parasiteActive =
    result.parasiteEvidenceSentinel?.explicitPositiveParasiteEvidence === true ||
    result.findings?.parasiteSuspected === true;

  if (blastActive || parasiteActive) {
    return result;
  }

  result.findings = asObject(result.findings);
  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.patternRecognition = asObject(result.patternRecognition);
  result.overallAssessment = asObject(result.overallAssessment);
  result.structuredReport = asObject(result.structuredReport);

  if (
    assessment.reactivePatternSupported &&
    assessment.reactiveClassificationAllowed
  ) {
    result.reactiveLymphoidPattern = true;

    if (!assessment.mononucleosisPatternSupported) {
      result.mononucleosisSuspicion = false;
      result.downeyCellSuspicion =
        assessment.downeyOrImmunoblastoid === true;

      result.differentialDiagnosis =
        stripUnsupportedMononucleosisDifferentials(
          result.differentialDiagnosis,
        );

      result.morphologyAnalysis.differentialDiagnosis =
        replaceReactiveNarrative(
          result.morphologyAnalysis.differentialDiagnosis,
          "Padrão linfoide reacional sustentado morfologicamente; etiologia específica não pode ser inferida pela imagem isolada.",
        );
    }

    return result;
  }

  // BE-FIX-005.16: morphology can look reactive while blast exclusion remains
  // non-assessable. Keep the observation, but do not promote a population-level
  // reactive classification that could falsely reassure downstream consumers.
  if (
    assessment.reactivePatternSupported &&
    !assessment.reactiveClassificationAllowed
  ) {
    result.reactiveLymphoidPattern = false;
    result.mononucleosisSuspicion = false;
    result.normalityBlocked = true;
    result.requiresHumanReview = true;
    result.overallAssessment = asObject(result.overallAssessment);
    result.overallAssessment.requiresHumanReview = true;
    result.blastAssessabilityReactiveGate = {
      version: REACTIVE_BLAST_ASSESSABILITY_GATE_VERSION,
      active: true,
      reason:
        "Morfologia reacional possível, porém detalhe nuclear insuficiente para exclusão morfológica segura de blastos.",
    };

    result.patternRecognition = asObject(result.patternRecognition);
    result.patternRecognition.leukocytePattern =
      "Reactive-appearing atypical mononuclear morphology with blast assessment indeterminate";
    result.patternRecognition.overallPattern =
      "Atypical/reactive-appearing mononuclear finding with blast assessment indeterminate";

    const gatedText =
      "Morfologia mononuclear com características reacionais pode estar presente, porém o campo não é avaliável com segurança para exclusão morfológica de blastos; requer revisão microscópica de múltiplos campos.";

    result.interpretiveSynthesis = gatedText;
    result.clinicalMeaning = gatedText;
    result.mainFinding = gatedText;
    result.primaryFinding = gatedText;
    result.finalConclusion = gatedText;

    result.structuredReport = asObject(result.structuredReport);
    result.structuredReport.conclusion = gatedText;
    result.structuredReport.hematologicMeaning = gatedText;

    if (
      !result.finalClassification ||
      result.finalClassification === "CLASS_0_NORMAL" ||
      String(result.finalClassification).includes("REACTIVE")
    ) {
      result.finalClassification =
        "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL_BLAST_INDETERMINATE";
    }
    if (
      !result.morphologicRiskClass ||
      result.morphologicRiskClass === "CLASS_0_NORMAL" ||
      String(result.morphologicRiskClass).includes("REACTIVE")
    ) {
      result.morphologicRiskClass =
        "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL_BLAST_INDETERMINATE";
    }
    result.overallAssessment.riskCategory = result.morphologicRiskClass;
    return result;
  }

  // Unsupported reactive inference: preserve observed atypia but remove the
  // etiologic/reactive population overcall.
  result.reactiveLymphoidPattern = false;
  result.mononucleosisSuspicion = false;
  result.downeyCellSuspicion = false;
  result.findings.reactiveLymphocytes = false;

  const replacement = safeTextForUnsupportedReactive(result);

  result.differentialDiagnosis =
    stripUnsupportedMononucleosisDifferentials(
      result.differentialDiagnosis,
    );

  result.patternRecognition.leukocytePattern =
    assessment.isolatedAtypicalMononuclearSignal
      ? "Atypical mononuclear finding"
      : "";

  result.patternRecognition.overallPattern =
    assessment.isolatedAtypicalMononuclearSignal
      ? "Atypical mononuclear finding without supported reactive population pattern"
      : result.patternRecognition.overallPattern;

  result.morphologyAnalysis.biologicalInterpretation =
    replaceReactiveNarrative(
      result.morphologyAnalysis.biologicalInterpretation,
      replacement,
    );

  result.morphologyAnalysis.differentialDiagnosis =
    replaceReactiveNarrative(
      result.morphologyAnalysis.differentialDiagnosis,
      "Etiologia específica não pode ser inferida pela imagem isolada.",
    );

  result.morphologyAnalysis.summary =
    replaceReactiveNarrative(
      result.morphologyAnalysis.summary,
      replacement,
    );

  result.interpretiveSynthesis =
    replaceReactiveNarrative(
      result.interpretiveSynthesis,
      replacement,
    );

  result.clinicalMeaning =
    replaceReactiveNarrative(
      result.clinicalMeaning,
      "O achado mononuclear deve ser correlacionado com hemograma e revisão de múltiplos campos; a imagem isolada não sustenta etiologia viral ou síndrome mononucleósica.",
    );

  result.mainFinding =
    replaceReactiveNarrative(
      result.mainFinding,
      replacement,
    );

  result.primaryFinding =
    replaceReactiveNarrative(
      result.primaryFinding,
      replacement,
    );

  result.finalConclusion =
    replaceReactiveNarrative(
      result.finalConclusion,
      replacement,
    );

  result.structuredReport.conclusion =
    replaceReactiveNarrative(
      result.structuredReport.conclusion,
      replacement,
    );

  result.structuredReport.hematologicMeaning =
    replaceReactiveNarrative(
      result.structuredReport.hematologicMeaning,
      "Achado mononuclear atípico/indeterminado; requer correlação morfológica e hematimétrica.",
    );

  result.overallAssessment.mainImpression =
    replaceReactiveNarrative(
      result.overallAssessment.mainImpression,
      replacement,
    );

  // Field-aware classification: large mononuclear cells alone remain
  // clinically relevant but do not become a reactive population.
  if (assessment.isolatedAtypicalMononuclearSignal) {
    result.normalityBlocked = true;
    result.requiresHumanReview = true;
    result.overallAssessment.requiresHumanReview = true;

    const limited =
      result.fieldAdequacy?.limitedField === true ||
      result.fieldAdequacy?.adequateForPopulationAssessment === false;

    const nextClass = limited
      ? "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL"
      : "CLASS_2_ATYPICAL_POPULATION";

    const reactiveClasses = new Set([
      "CLASS_2_ATYPICAL_REACTIVE_PATTERN",
      "CLASS_2_REACTIVE_MONONUCLEOSIS_PATTERN",
      "CLASS_2_ATYPICAL_POPULATION",
    ]);

    if (
      reactiveClasses.has(result.finalClassification) ||
      !result.finalClassification
    ) {
      result.finalClassification = nextClass;
    }

    if (
      reactiveClasses.has(result.morphologicRiskClass) ||
      !result.morphologicRiskClass
    ) {
      result.morphologicRiskClass = nextClass;
    }

    result.overallAssessment.riskCategory =
      result.morphologicRiskClass || nextClass;

    result.riskLevel = limited
      ? "Achado mononuclear atípico em campo limitado"
      : "Alteração mononuclear atípica";
  }

  return result;
}

export default applyReactiveLymphoidEvidenceSentinel;
