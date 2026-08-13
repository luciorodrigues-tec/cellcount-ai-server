// ============================================================================
// CELLCOUNT HEMATOLOGY ENTERPRISE
// CRA-001.1 — Canonical Clinical Truth Builder
//
// IMPORTANT:
// - Input MUST already have passed BE-FIX-005.11, 005.13, 005.14 and 005.15.
// - This module does not create visual evidence.
// - It reconciles structured evidence into the single V2 clinical truth.
// ============================================================================

import {
  CLINICAL_RESULT_V2_CONTRACT,
  ClinicalEvidenceState,
  ClinicalSeverity,
  createEvidenceItem,
  normalizeConfidence,
} from "./clinicalEvidenceState.js";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values) {
  for (const value of values) {
    const candidate = text(value);
    if (candidate) return candidate;
  }
  return "";
}

function normalizeToken(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function stateFromCanonicalStatus(value, {
  observedBooleans = [],
  notObservedBooleans = [],
  assessable = true,
} = {}) {
  const token = normalizeToken(value);

  if (["OBSERVED", "PRESENT", "POSITIVE", "DETECTED"].includes(token)) {
    return ClinicalEvidenceState.OBSERVED;
  }

  if (
    [
      "NOT_OBSERVED",
      "NOTOBSERVED",
      "ABSENT_IN_FIELD",
      "NEGATIVE",
      "NOT_DETECTED",
      "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    ].includes(token)
  ) {
    return ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD;
  }

  if (
    [
      "NOT_ASSESSABLE",
      "NOTASSESSABLE",
      "INDETERMINATE",
      "UNKNOWN",
      "UNEVALUABLE",
      "NOT_EVALUABLE",
    ].includes(token)
  ) {
    return ClinicalEvidenceState.NOT_ASSESSABLE;
  }

  if (observedBooleans.some((value) => value === true)) {
    return ClinicalEvidenceState.OBSERVED;
  }

  if (assessable === false) {
    return ClinicalEvidenceState.NOT_ASSESSABLE;
  }

  if (notObservedBooleans.some((value) => value === true)) {
    return ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD;
  }

  return ClinicalEvidenceState.NOT_ASSESSABLE;
}

function findStructuredItem(result, keys = []) {
  const containers = [
    asObject(result.criticalFindings),
    asObject(result.findings),
    asObject(result.localMorphologyEvidence?.criticalFindings),
    asObject(result.localMorphologyEvidence?.specialFindings),
    asObject(result.localMorphologyEvidence?.leukocytes),
    asObject(result.localMorphologyEvidence?.erythrocytes),
    asObject(result.localMorphologyEvidence?.platelets),
    asObject(result.parasiteAnalysis),
    asObject(result.rawResponse?.criticalFindings),
    asObject(result.rawResponse?.findings),
    asObject(result.rawResponse?.positiveFindings),
  ];

  for (const container of containers) {
    for (const key of keys) {
      if (container[key] !== undefined) return container[key];
    }
  }

  return undefined;
}

function evidenceStrings(...values) {
  const output = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      output.push(...value.map((item) =>
        typeof item === "string" ? item : JSON.stringify(item)
      ));
    } else if (typeof value === "string" && value.trim()) {
      output.push(value.trim());
    } else if (value && typeof value === "object") {
      const description =
        text(value.description) ||
        text(value.summary) ||
        text(value.label) ||
        text(value.evidence);
      if (description) output.push(description);
    }
  }

  return [...new Set(output.filter(Boolean))];
}

function buildBlastTruth(result) {
  const sentinel = asObject(result.singleBlastSentinel);
  const lme = asObject(result.localMorphologyEvidence);
  const leuk = asObject(lme.leukocytes);
  const finding = findStructuredItem(result, [
    "blastLike",
    "blasts",
    "blastSuspicion",
    "blastLikeCells",
  ]);

  const findingObject = asObject(finding);

  const observed =
    sentinel.triggered === true ||
    sentinel.alert === true ||
    result.findings?.blastSuspicion === true ||
    result.findings?.immatureCells === true && result.finalClassification === "CLASS_4_BLAST_SUSPICION" ||
    finding === true ||
    findingObject.observed === true ||
    normalizeToken(findingObject.state || findingObject.status) === "OBSERVED";

  const adequate =
    result.fieldAdequacy?.adequateForBlastScreening === true ||
    result.fieldAdequacy?.visibleLeukocytes >= 1 ||
    lme.evidenceAvailable === true;

  const explicitNotObserved =
    finding === false ||
    findingObject.observed === false ||
    ["NOT_OBSERVED", "NOT_OBSERVED_IN_EVALUABLE_FIELD"].includes(
      normalizeToken(findingObject.state || findingObject.status),
    );

  const state = stateFromCanonicalStatus(
    findingObject.state || findingObject.status,
    {
      observedBooleans: [observed],
      notObservedBooleans: [explicitNotObserved],
      assessable: adequate,
    },
  );

  return createEvidenceItem({
    state,
    confidence: firstText(
      sentinel.confidence,
      findingObject.confidence,
      result.confidenceAnalysis?.globalConfidenceScore,
    ) || 0,
    evidence: evidenceStrings(
      sentinel.evidence,
      findingObject.evidence,
      leuk.blastLikeFeatures,
      lme.positiveEvidence,
    ),
    scope: "FIELD_LOCAL",
    requiresReview: state === ClinicalEvidenceState.OBSERVED,
    severity:
      state === ClinicalEvidenceState.OBSERVED
        ? ClinicalSeverity.CRITICAL
        : state === ClinicalEvidenceState.NOT_ASSESSABLE
          ? ClinicalSeverity.INDETERMINATE
          : ClinicalSeverity.NONE,
    observedCount:
      sentinel.observedCount ??
      findingObject.observedCount ??
      findingObject.count ??
      null,
  });
}

function buildParasiteTruth(result) {
  const assessment = asObject(result.parasiteEvidenceAssessment);
  const sentinel = asObject(result.parasiteEvidenceSentinel);
  const parasite = asObject(result.parasiteAnalysis);
  const lme = asObject(result.localMorphologyEvidence);
  const structured = findStructuredItem(result, [
    "parasite",
    "parasites",
    "hemoparasite",
    "hemoparasites",
  ]);
  const structuredObject = asObject(structured);

  const observed =
    assessment.explicitPositiveParasiteEvidence === true ||
    sentinel.explicitPositiveParasiteEvidence === true ||
    parasite.suspected === true && result.findings?.parasiteSuspected === true ||
    structured === true ||
    structuredObject.observed === true ||
    normalizeToken(structuredObject.state || structuredObject.status) === "OBSERVED";

  const artifactLikely =
    assessment.artifactLikely === true ||
    sentinel.artifactLikely === true ||
    result.parasiteAnalysis?.artifactLikely === true ||
    result.findings?.artifactLikely === true;

  const explicitNotObserved =
    structured === false ||
    structuredObject.observed === false ||
    ["NOT_OBSERVED", "NOT_OBSERVED_IN_EVALUABLE_FIELD"].includes(
      normalizeToken(structuredObject.state || structuredObject.status),
    ) ||
    (!observed && result.findings?.parasiteSuspected === false);

  const assessable =
    lme.evidenceAvailable === true ||
    result.fieldAdequacy?.adequateForLeukocyteAnalysis === true ||
    result.observedMorphology != null;

  let state = stateFromCanonicalStatus(
    structuredObject.state || structuredObject.status,
    {
      observedBooleans: [observed],
      notObservedBooleans: [explicitNotObserved],
      assessable,
    },
  );

  // 005.14 invariant: artifact-favored evidence never promotes parasite.
  if (artifactLikely && !observed) {
    state = assessable
      ? ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD
      : ClinicalEvidenceState.NOT_ASSESSABLE;
  }

  return {
    parasite: createEvidenceItem({
      state,
      confidence:
        structuredObject.confidence ??
        parasite.confidence ??
        assessment.confidence ??
        0,
      evidence: evidenceStrings(
        structuredObject.evidence,
        assessment.parasiteEvidence,
        sentinel.parasiteEvidence,
      ),
      scope: "FIELD_LOCAL",
      requiresReview: state === ClinicalEvidenceState.OBSERVED,
      severity:
        state === ClinicalEvidenceState.OBSERVED
          ? ClinicalSeverity.HIGH
          : state === ClinicalEvidenceState.NOT_ASSESSABLE
            ? ClinicalSeverity.INDETERMINATE
            : ClinicalSeverity.NONE,
    }),
    unusualStructureObserved:
      result.findings?.unusualStructureSuspected === true ||
      assessment.unusualStructureObserved === true ||
      asArray(lme.unusualStructures).length > 0,
    artifactLikelihood: artifactLikely
      ? "FAVORED"
      : assessment.artifactLikely === false
        ? "NOT_FAVORED"
        : "INDETERMINATE",
    artifactEvidence: evidenceStrings(
      assessment.artifactEvidence,
      sentinel.artifactEvidence,
      result.observedMorphology?.artifacts,
      lme.artifacts,
    ),
    organismCandidate:
      state === ClinicalEvidenceState.OBSERVED
        ? firstText(
            parasite.parasiteName,
            parasite.parasiteType,
            structuredObject.organismCandidate,
          ) || null
        : null,
    parasiteSuspicionAllowed:
      state === ClinicalEvidenceState.OBSERVED,
  };
}

function buildReactiveTruth(result) {
  const sentinel = asObject(result.reactiveLymphoidEvidenceSentinel);
  const assessment = asObject(result.reactiveLymphoidEvidenceAssessment);
  // CRCE-1.3 — once the evidence sentinel/assessment exists, legacy flags are
  // no longer allowed to re-promote a reactive population pattern downstream.
  const hasGovernedReactiveEvidence =
    Object.keys(sentinel).length > 0 || Object.keys(assessment).length > 0;

  const supported = hasGovernedReactiveEvidence
    ? sentinel.reactivePatternSupported === true ||
      assessment.reactivePatternSupported === true
    : result.reactiveLymphoidPattern === true ||
      result.lymphoidPatternAnalysis?.lymphoidPattern === "LYMPHOID_REACTIVE";

  const monoSupported = hasGovernedReactiveEvidence
    ? sentinel.mononucleosisPatternSupported === true ||
      assessment.mononucleosisPatternSupported === true
    : result.mononucleosisSuspicion === true;

  const evidence = evidenceStrings(
    sentinel.evidence,
    assessment.evidence,
    result.academicMorphologyReasoning?.evidenceFor,
  );

  return {
    reactiveLymphoid: {
      supported,
      confidence: normalizeConfidence(
        sentinel.confidence ??
        assessment.confidence ??
        result.confidenceAnalysis?.globalConfidenceScore ??
        0,
      ),
      evidence,
    },
    mononucleosisPattern: {
      supported: supported && monoSupported,
      confidence: supported && monoSupported
        ? normalizeConfidence(sentinel.confidence ?? assessment.confidence ?? 0)
        : 0,
      evidence: supported && monoSupported ? evidence : [],
    },
    clonalityConcern: {
      supported:
        result.findings?.monomorphicPopulation === true &&
        result.fieldAdequacy?.adequateForPopulationAssessment === true,
      confidence: normalizeConfidence(
        result.confidenceAnalysis?.globalConfidenceScore ?? 0,
      ),
      evidence: evidenceStrings(
        result.lymphoidPatternAnalysis?.evidence,
        result.localMorphologyEvidence?.positiveEvidence,
      ),
    },
  };
}

function buildLineage({
  description,
  assessable,
  positive = false,
  confidence = 0,
  evidence = [],
}) {
  return {
    assessment: createEvidenceItem({
      state: assessable
        ? positive
          ? ClinicalEvidenceState.OBSERVED
          : ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD
        : ClinicalEvidenceState.NOT_ASSESSABLE,
      confidence,
      evidence,
      scope: "FIELD_LOCAL",
      requiresReview: positive,
      severity: positive ? ClinicalSeverity.REVIEW : ClinicalSeverity.NONE,
    }),
    description: text(description),
  };
}

function dedupe(values = []) {
  return [...new Set(asArray(values).map((value) => String(value).trim()).filter(Boolean))];
}

export function buildCanonicalClinicalTruth(result = {}, {
  specimenType = null,
  analysisSource = null,
} = {}) {
  const field = asObject(result.fieldAdequacy);
  const lme = asObject(result.localMorphologyEvidence);
  const observed = asObject(result.observedMorphology);
  const confidence = normalizeConfidence(
    result.confidenceAnalysis?.globalConfidenceScore ??
    result.confidenceAnalysis?.confidenceHierarchy?.global ??
    0,
  );

  const blastLike = buildBlastTruth(result);
  const parasiteArtifact = buildParasiteTruth(result);
  const patternInterpretation = buildReactiveTruth(result);

  const fieldLimited =
    field.limitedField === true ||
    field.adequateForPopulationAssessment === false;

  const rbcDescription = firstText(
    lme.erythrocytes?.description,
    observed.erythrocytes?.description,
    result.morphologyAnalysis?.erythrocyteReview,
  );
  const wbcDescription = firstText(
    lme.leukocytes?.description,
    observed.leukocytes?.description,
    result.morphologyAnalysis?.leukocyteReview,
  );
  const pltDescription = firstText(
    lme.platelets?.description,
    observed.platelets?.description,
    result.morphologyAnalysis?.plateletReview,
  );

  const erythrocytes = buildLineage({
    description: rbcDescription,
    assessable: Boolean(rbcDescription),
    positive:
      asArray(lme.erythrocytes?.specificForms).length > 0 ||
      Boolean(lme.erythrocytes?.anisocytosis && !/absent|ausent|not observed/i.test(String(lme.erythrocytes.anisocytosis))) ||
      Boolean(lme.erythrocytes?.poikilocytosis && !/absent|ausent|not observed/i.test(String(lme.erythrocytes.poikilocytosis))),
    confidence,
    evidence: evidenceStrings(rbcDescription, lme.erythrocytes?.specificForms),
  });

  const leukocytes = buildLineage({
    description: wbcDescription,
    assessable:
      field.adequateForLeukocyteAnalysis === true ||
      Boolean(wbcDescription),
    positive:
      blastLike.state === ClinicalEvidenceState.OBSERVED ||
      result.findings?.atypicalLymphocytes === true ||
      result.findings?.largeMononuclearCells === true ||
      result.findings?.reactiveLymphocytes === true ||
      result.findings?.immatureCells === true,
    confidence,
    evidence: evidenceStrings(wbcDescription, lme.leukocytes?.atypia, lme.leukocytes?.blastLikeFeatures),
  });

  const platelets = buildLineage({
    description: pltDescription,
    assessable: Boolean(pltDescription),
    positive:
      result.findings?.plateletAggregates === true ||
      /aggregate|agregado|giant|gigante/i.test(pltDescription),
    confidence,
    evidence: evidenceStrings(pltDescription),
  });

  const requiresReview =
    result.requiresHumanReview === true ||
    result.overallAssessment?.requiresHumanReview === true ||
    blastLike.requiresReview === true ||
    parasiteArtifact.parasite.requiresReview === true ||
    fieldLimited;

  const morphologySignals = {
    focalMononuclearAtypia:
      result.findings?.atypicalLymphocytes === true ||
      result.findings?.largeMononuclearCells === true,
    atypicalLymphocytesObserved:
      result.findings?.atypicalLymphocytes === true,
    largeMononuclearCellsObserved:
      result.findings?.largeMononuclearCells === true,
    reactiveLymphocytesObserved:
      result.findings?.reactiveLymphocytes === true,
    immatureCellsObserved:
      result.findings?.immatureCells === true,
    monomorphicPopulationObserved:
      result.findings?.monomorphicPopulation === true,
  };

  const severity =
    blastLike.state === ClinicalEvidenceState.OBSERVED
      ? ClinicalSeverity.CRITICAL
      : parasiteArtifact.parasite.state === ClinicalEvidenceState.OBSERVED
        ? ClinicalSeverity.HIGH
        : result.morphologicRiskClass === "CLASS_5_HIGH_NEOPLASTIC_SUSPICION"
          ? ClinicalSeverity.HIGH
          : result.morphologicRiskClass === "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION"
            ? ClinicalSeverity.INTERMEDIATE
            : requiresReview
              ? ClinicalSeverity.REVIEW
              : ClinicalSeverity.NONE;

  return {
    contract: CLINICAL_RESULT_V2_CONTRACT,
    scope: {
      specimenType:
        specimenType ||
        result.specimenType ||
        result.specimenClassification?.predictedType ||
        "INDETERMINATE",
      analysisSource:
        analysisSource ||
        result.analysisSource ||
        "ai_visual",
      fieldScope: "FIELD_LOCAL",
      visibleLeukocytes:
        Number.isFinite(Number(field.visibleLeukocytes))
          ? Number(field.visibleLeukocytes)
          : null,
      limitedField: fieldLimited,
      populationInferenceAllowed:
        field.populationInferenceAllowed === true ||
        field.adequateForPopulationAssessment === true,
      globalNegativeExclusionAllowed:
        field.globalNegativeExclusionAllowed === true,
    },
    quality: {
      visualAcquisitionComplete:
        result.visualEvidenceAcquisitionIncomplete !== true &&
        result.visualMorphologyEvidenceAcquisition?.complete !== false,
      imageQuality: asObject(result.imageQuality),
      fieldAdequacy: field,
      confidence,
      limitations: dedupe([
        field.limitationReason,
        result.whatAISees?.imageLimitations,
        ...asArray(result.limitations),
      ]),
    },
    criticalFindings: {
      blastLike,
      auerRods: createEvidenceItem({
        state:
          field.adequateForBlastScreening === true
            ? ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD
            : ClinicalEvidenceState.NOT_ASSESSABLE,
        confidence,
        scope: "FIELD_LOCAL",
      }),
      schistocytes: createEvidenceItem({
        state:
          erythrocytes.description
            ? ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD
            : ClinicalEvidenceState.NOT_ASSESSABLE,
        confidence,
        scope: "FIELD_LOCAL",
      }),
      parasites: parasiteArtifact.parasite,
    },
    lineages: {
      erythrocytes,
      leukocytes,
      platelets,
    },
    parasiteArtifact,
    patternInterpretation,
    morphologySignals,
    risk: {
      severity,
      legacyClass:
        result.finalClassification ||
        result.morphologicRiskClass ||
        null,
      legacyLabel: result.riskLevel || null,
      normalityBlocked: result.normalityBlocked === true,
      blockNormalReason: dedupe(result.blockNormalReason),
    },
    review: {
      required: requiresReview,
      urgency:
        severity === ClinicalSeverity.CRITICAL
          ? "URGENT"
          : severity === ClinicalSeverity.HIGH
            ? "PRIORITY"
            : requiresReview
              ? "RECOMMENDED"
              : "ROUTINE",
      reasons: dedupe([
        ...(result.blockNormalReason || []),
        blastLike.requiresReview ? "Sinal blástico/blastoide positivo no campo analisado." : "",
        parasiteArtifact.parasite.requiresReview ? "Evidência parasitária estruturada positiva." : "",
        fieldLimited ? "Representatividade limitada para inferência populacional global." : "",
      ]),
    },
    provenance: {
      craVersion: "CRA-001.1",
      sourcePipeline: result.pipeline?.version || "V8_TURBO_ENTERPRISE",
      lmeContract: lme.contractVersion || null,
      amrContract:
        result.academicMorphologyReasoning?.contractVersion ||
        result.academicMorphologyReasoningContract?.contractVersion ||
        "AMR-1.0",
      evidenceConsistentMorphologySynthesis:
        result.evidenceConsistentMorphologySynthesisVersion ||
        "BE-FIX-005.11",
      singleBlastSentinel: "BE-FIX-005.13",
      parasiteEvidenceSentinel: "BE-FIX-005.14",
      reactiveLymphoidEvidenceSentinel: "BE-FIX-005.15",
      generatedAt: new Date().toISOString(),
    },
  };
}
