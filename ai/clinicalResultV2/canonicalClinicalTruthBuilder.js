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

  if (["SUSPICIOUS", "SUSPECTED", "POSSIBLE", "SUSPICIOUS_INDETERMINATE"].includes(token)) {
    return ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE;
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

  if (["INDETERMINATE", "UNKNOWN"].includes(token)) {
    return assessable === false
      ? ClinicalEvidenceState.NOT_ASSESSABLE
      : ClinicalEvidenceState.INDETERMINATE;
  }

  if (
    [
      "NOT_ASSESSABLE",
      "NOTASSESSABLE",
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

  return assessable
    ? ClinicalEvidenceState.INDETERMINATE
    : ClinicalEvidenceState.NOT_ASSESSABLE;
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


function buildStructuredCriticalTruth(result, {
  keys = [],
  assessable = false,
  confidence = 0,
  label = "",
} = {}) {
  const finding = findStructuredItem(result, keys);
  const findingObject = asObject(finding);
  const status = findingObject.state || findingObject.status;

  const observed =
    finding === true ||
    findingObject.observed === true ||
    ["OBSERVED", "PRESENT", "POSITIVE", "DETECTED"].includes(
      normalizeToken(status),
    );

  const suspicious =
    ["SUSPICIOUS", "SUSPECTED", "POSSIBLE", "SUSPICIOUS_INDETERMINATE"].includes(
      normalizeToken(status),
    );

  const notObserved =
    finding === false ||
    findingObject.observed === false ||
    [
      "NOT_OBSERVED",
      "NOTOBSERVED",
      "ABSENT_IN_FIELD",
      "NEGATIVE",
      "NOT_DETECTED",
      "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    ].includes(normalizeToken(status));

  let state;
  if (observed) {
    state = ClinicalEvidenceState.OBSERVED;
  } else if (suspicious) {
    state = ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE;
  } else if (notObserved && assessable) {
    state = ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD;
  } else if (normalizeToken(status) === "INDETERMINATE" && assessable) {
    state = ClinicalEvidenceState.INDETERMINATE;
  } else if (finding === undefined && assessable) {
    // CRCE-1.5 invariant: assessability alone never creates a negative.
    state = ClinicalEvidenceState.INDETERMINATE;
  } else {
    state = ClinicalEvidenceState.NOT_ASSESSABLE;
  }

  return createEvidenceItem({
    state,
    confidence: findingObject.confidence ?? confidence,
    evidence: evidenceStrings(
      findingObject.evidence,
      findingObject.description,
      findingObject.summary,
    ),
    scope: "FIELD_LOCAL",
    requiresReview: [
      ClinicalEvidenceState.OBSERVED,
      ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE,
      ClinicalEvidenceState.INDETERMINATE,
    ].includes(state),
    severity:
      state === ClinicalEvidenceState.OBSERVED
        ? ClinicalSeverity.HIGH
        : state === ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE
          ? ClinicalSeverity.HIGH
          : state === ClinicalEvidenceState.INDETERMINATE
            ? ClinicalSeverity.INDETERMINATE
            : ClinicalSeverity.NONE,
    notes: label ? [label] : [],
  });
}

function buildBlastTruth(result) {
  const sentinel = asObject(result.singleBlastSentinel);
  const lme = asObject(result.localMorphologyEvidence);
  const leuk = asObject(lme.leukocytes);
  const finding = findStructuredItem(result, [
    "blastLike",
    "blasts",
    "blastLikeCells",
  ]);

  const findingObject = asObject(finding);

  // BE-FIX-005.16 — do not collapse suspicion into confirmed observation.
  const sentinelState = normalizeToken(sentinel.evidenceState);
  const observed =
    sentinelState === "OBSERVED" ||
    sentinel.certainty === "USER_RECORDED_BLAST" ||
    sentinel.certainty === "VISUAL_BLAST_LIKE_MORPHOLOGY" ||
    finding === true ||
    findingObject.observed === true ||
    normalizeToken(findingObject.state || findingObject.status) === "OBSERVED";

  const suspicious =
    sentinelState === "SUSPICIOUS_INDETERMINATE" ||
    result.findings?.blastSuspicion === true ||
    result.blastSuspicion === true ||
    ["SUSPICIOUS", "SUSPECTED", "POSSIBLE", "SUSPICIOUS_INDETERMINATE"].includes(
      normalizeToken(
        findingObject.state ||
        findingObject.status ||
        result.findings?.blastEvidenceState ||
        result.blastEvidenceState,
      ),
    );

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

  const state = observed
    ? ClinicalEvidenceState.OBSERVED
    : suspicious
      ? ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE
      : stateFromCanonicalStatus(
          findingObject.state || findingObject.status || result.findings?.blastEvidenceState || result.blastEvidenceState,
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
    requiresReview: [ClinicalEvidenceState.OBSERVED, ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE].includes(state),
    severity:
      state === ClinicalEvidenceState.OBSERVED
        ? ClinicalSeverity.CRITICAL
        : state === ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE
          ? ClinicalSeverity.HIGH
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
    );

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

function positivePolychromasiaEvidence(result = {}, lme = {}) {
  const erythrocytes = asObject(lme.erythrocytes);
  const structured = asObject(result.erythrocyteFindings);

  const corpus = evidenceStrings(
    erythrocytes.description,
    erythrocytes.chromia,
    erythrocytes.polychromasiaEvidence,
    erythrocytes.observations,
    erythrocytes.positiveFindings,
    structured.polychromasiaEvidence,
    structured.summary,
    structured.findings,
    result.positiveMorphology?.erythrocytes?.polychromasia?.evidence,
    result.morphologyAnalysis?.erythrocyteReview,
  ).join(" ");

  const explicitObserved =
    String(erythrocytes.polychromasiaState || "").toUpperCase() === "OBSERVED" ||
    structured.polychromasia === true ||
    String(structured.polychromasiaState || "").toUpperCase() === "OBSERVED" ||
    result.positiveMorphology?.erythrocytes?.polychromasia?.observed === true;

  const positive = explicitObserved || (
    /\bpolychromasia\b|\bpolicromasia\b|policromatofilia|hem[aá]cias?\s+(?:mais\s+)?(?:azuladas|acinzentadas)|bluish erythrocytes/i.test(corpus) &&
    !/(?:sem|aus[eê]ncia de|n[aã]o observad[ao]s?|not observed|absent)\s+(?:de\s+)?(?:polychromasia|policromasia)/i.test(corpus)
  );

  return {
    positive,
    evidence: positive
      ? dedupe([
          ...evidenceStrings(
            erythrocytes.chromia,
            erythrocytes.polychromasiaEvidence,
            erythrocytes.positiveFindings,
            erythrocytes.description,
            structured.summary,
            result.morphologyAnalysis?.erythrocyteReview,
          ),
          "Policromasia presente no campo analisado.",
        ])
      : [],
  };
}

function canonicalClinicalCriticality(result = {}) {
  const criticality = asObject(result.clinicalCriticality);
  const level = text(
    criticality.level ||
    result.marrowSeverityCriticality?.level ||
    result.confidenceAnalysis?.hematologicRisk?.level,
  ).toUpperCase();

  if (level === "CRITICAL") return ClinicalSeverity.CRITICAL;
  if (level === "HIGH") return ClinicalSeverity.HIGH;
  return null;
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
  const polychromasia =
    positivePolychromasiaEvidence(result, lme);
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
      polychromasia.positive ||
      asArray(lme.erythrocytes?.specificForms).length > 0 ||
      Boolean(lme.erythrocytes?.anisocytosis && !/absent|ausent|not observed/i.test(String(lme.erythrocytes.anisocytosis))) ||
      Boolean(lme.erythrocytes?.poikilocytosis && !/absent|ausent|not observed/i.test(String(lme.erythrocytes.poikilocytosis))),
    confidence,
    evidence: dedupe([
      ...evidenceStrings(rbcDescription, lme.erythrocytes?.specificForms),
      ...polychromasia.evidence,
    ]),
  });

  const leukocytes = buildLineage({
    description: wbcDescription,
    assessable:
      field.adequateForLeukocyteAnalysis === true ||
      Boolean(wbcDescription),
    positive:
      [ClinicalEvidenceState.OBSERVED, ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE].includes(blastLike.state) ||
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

  const explicitClinicalCriticality =
    canonicalClinicalCriticality(result);

  const severity =
    blastLike.state === ClinicalEvidenceState.OBSERVED
      ? ClinicalSeverity.CRITICAL
      : explicitClinicalCriticality === ClinicalSeverity.CRITICAL
        ? ClinicalSeverity.CRITICAL
        : blastLike.state === ClinicalEvidenceState.SUSPICIOUS_INDETERMINATE
          ? ClinicalSeverity.HIGH
          : explicitClinicalCriticality === ClinicalSeverity.HIGH
            ? ClinicalSeverity.HIGH
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
      auerRods: buildStructuredCriticalTruth(result, {
        keys: ["auerRods", "auerRod", "auerSticks"],
        assessable: field.adequateForBlastScreening === true,
        confidence,
        label: "Bastonetes de Auer",
      }),
      schistocytes: buildStructuredCriticalTruth(result, {
        keys: ["schistocytes", "schistocyte", "clinicallyRelevantSchistocytes"],
        assessable: Boolean(erythrocytes.description),
        confidence,
        label: "Esquizócitos clinicamente relevantes",
      }),
      parasites: parasiteArtifact.parasite,
    },
    lineages: {
      erythrocytes: {
        ...erythrocytes,
        positiveMorphology: {
          polychromasia: polychromasia.positive,
          evidence: polychromasia.evidence,
          fieldScoped: true,
          globalExclusionAllowed: false,
        },
      },
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
