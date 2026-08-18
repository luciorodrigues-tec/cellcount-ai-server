// ============================================================================
// CELLCOUNT ELITE HOSPITAL AI
// CELLCOUNT HEMATOLOGY ENTERPRISE SERVER V6 SAFE HYBRID
// ============================================================================

import {
  enforceBoneMarrowOutputContract,
} from "./ai/boneMarrow/boneMarrowOutputContract.js";

import {
  applyBoneMarrowClinicalReasoning,
} from "./ai/boneMarrow/boneMarrowClinicalReasoningEngine.js";

import {
  MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
  MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
  applyMarrowBlastPopulationGovernance,
} from "./ai/boneMarrow/marrowBlastPopulationSentinel.js";

import {
  MARROW_PRECURSOR_DISCRIMINATION_VERSION,
  MARROW_PRECURSOR_REBALANCING_VERSION,
  MARROW_DUAL_AXIS_SCORING_VERSION,
  MARROW_ARCHITECTURE_GATED_BLAST_ESCALATION_VERSION,
  MARROW_SCOPE_PROPAGATION_RECOVERY_VERSION,
  applyMarrowPrecursorDiscrimination,
} from "./ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";

import {
  MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION,
  reconcileMarrowBlastEvidence,
} from "./ai/boneMarrow/marrowBlastEvidenceReconciliationEngine.js";

import {
  MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION,
  MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION,
  resolveMarrowNarrativeStructureContradiction,
} from "./ai/boneMarrow/marrowNarrativeStructureContradictionResolutionEngine.js";

import {
  MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
  applyMarrowPositiveBlastEvidencePreservation,
} from "./ai/boneMarrow/marrowPositiveBlastEvidencePreservationEngine.js";

import {
  MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION,
  MARROW_GLOBAL_PATTERN_COHERENCE_VERSION,
  applyMarrowPhysiologicPrecursorCoherence,
} from "./ai/boneMarrow/marrowPhysiologicPrecursorCoherenceEngine.js";

import {
  MARROW_FINAL_RESULT_COHERENCE_VERSION,
  ASSESSABILITY_CONSISTENT_NEGATIVE_FINDINGS_VERSION,
  applyMarrowFinalResultCoherence,
} from "./ai/boneMarrow/marrowFinalResultCoherenceEngine.js";

import {
  MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION,
  MARROW_BLASTOID_CANDIDATE_PRESERVATION_VERSION,
  MARROW_CROSS_PASS_IMMATURE_CYTOMORPHOLOGY_RECOVERY_VERSION,
  MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_RECOVERY_VERSION,
  MARROW_RECOVERED_IMMATURE_CARDINALITY_UNRESOLVED_LOCK_VERSION,
  MARROW_CELL_LEVEL_CYTOMORPHOLOGY_RECOVERY_VERSION,
  MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_PRESERVATION_VERSION,
  applyMarrowImmatureCellCytologyRecovery,
} from "./ai/boneMarrow/marrowImmatureCellCytologyRecoveryEngine.js";

import {
  MARROW_RECOVERED_CYTOLOGY_PROJECTION_VERSION,
  MARROW_POSITIVE_BLAST_E2E_LOCK_VERSION,
  MARROW_FOCAL_CYTOLOGY_CONTEXTUALIZATION_VERSION,
  applyMarrowRecoveredCytologyProjection,
} from "./ai/boneMarrow/marrowRecoveredCytologyProjectionEngine.js";

import {
  MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION,
  MARROW_PHYSIOLOGIC_IMMATURITY_CONTAINMENT_VERSION,
  MARROW_MATURATION_EVIDENCE_PROJECTION_VERSION,
  MARROW_POST_RECOVERY_MATURATION_CONTINUUM_REEVALUATION_VERSION,
  MARROW_POSITIVE_RECOVERED_BLASTOID_CYTOLOGY_CONTINUUM_LOCK_VERSION,
  MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_CONTINUUM_GATE_VERSION,
  applyMarrowMaturationContinuumDiscrimination,
} from "./ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";

import {
  MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION,
  MARROW_PATHOLOGIC_MATURATION_CONTINUUM_VERSION,
  MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION,
  MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION,
  MARROW_POPULATION_INFERENCE_REPRESENTATIVITY_GATE_VERSION,
  applyMarrowMyeloidExpansionDiscrimination,
} from "./ai/boneMarrow/marrowMyeloidExpansionDiscriminationEngine.js";

import {
  MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
  MARROW_PRECURSOR_BLAST_SEMANTIC_SEPARATION_VERSION,
  MARROW_GLOBAL_PATTERN_RECONCILIATION_VERSION,
  applyMarrowDominantPatternStateReconciliation,
} from "./ai/boneMarrow/marrowDominantPatternStateReconciliationEngine.js";

import {
  applyMarrowPositiveBlastEvidenceSemanticSupersession,
  MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
  MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION,
} from "./ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";

import {
  applyFinalMarrowAuthority,
  MARROW_FINAL_CLINICAL_AUTHORITY_VERSION,
  MARROW_POST_LEGACY_RECONCILIATION_VERSION,
  MARROW_ADEQUACY_MORPHOLOGY_AXIS_SEPARATION_VERSION,
} from "./ai/boneMarrow/marrowFinalClinicalAuthorityEngine.js";

import {
  applyMarrowMorphologyAdequacyProjectionLock,
  MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
  MARROW_LIMITED_FIELD_AXIS_NON_OVERRIDE_VERSION,
} from "./ai/boneMarrow/marrowMorphologyAdequacyProjectionLockEngine.js";

import {
  applyMarrowMyeloproliferativePatternCriticality,
  MARROW_MYELOPROLIFERATIVE_PATTERN_CORRELATION_VERSION,
  MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
  MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION,
  MARROW_BCR_ABL1_RECOMMENDATION_GATE_VERSION,
  MARROW_HIGH_SALIENCE_CRITICALITY_LOCK_VERSION,
  MARROW_EVIDENCE_WEIGHTED_CRITICALITY_VERSION,
  MARROW_CORE_MYELOID_SALIENCE_CALIBRATION_VERSION,
  MARROW_POPULATION_CRITICALITY_REPRESENTATIVITY_GATE_VERSION,
} from "./ai/boneMarrow/marrowMyeloproliferativePatternCriticalityEngine.js";

import {
  applyMarrowResidualBlastSemanticCleanup,
  MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
  MARROW_IMMATURITY_MATURATION_SEMANTIC_SEPARATION_VERSION,
} from "./ai/boneMarrow/marrowResidualBlastSemanticCleanupEngine.js";

import {
  applyMarrowUnresolvedImmaturityFinalStateCoherence,
  MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
  MARROW_UNRESOLVED_IMMATURITY_GLOBAL_PATTERN_LOCK_VERSION,
  MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
  CLINICAL_INTERNAL_VERSION_TAG_SANITIZATION_VERSION,
} from "./ai/boneMarrow/marrowUnresolvedImmaturityFinalStateCoherenceEngine.js";

import {
  MARROW_POSITIVE_CYTOLOGY_CONSISTENCY_VERSION,
  MARROW_ACQUISITION_DISCORDANCE_RECOVERY_VERSION,
  MARROW_PRIMARY_OR_RECOVERED_POSITIVE_BLASTOID_CYTOLOGY_PRESERVATION_VERSION,
  applyMarrowPositiveCytologyConsistency,
} from "./ai/boneMarrow/marrowPositiveCytologyConsistencyEngine.js";

import {
  applyClinicalSafetyGovernor,
} from "./ai/clinicalSafety/index.js";

import {
  stabilizeDualPipelineResult,
} from "./ai/dualPipeline/index.js";

import {
  createCellKnowledgeRegistry,
  createCriteriaEngineRegistry,
} from "./ai/knowledge/morphology/index.js";

import {
  createFeatureMatcher,
} from "./ai/matching/featureMatcher/index.js";

import {
  createMorphologyScoringEngine,
} from "./ai/scoring/morphologyScore/index.js";

import {
  createMorphologyCandidateEngine,
} from "./ai/candidate/morphologyCandidate/index.js";

import {
  createMorphologyRankingEngine,
} from "./ai/ranking/morphologyRanking/index.js";

import {
  createMorphologyConfidenceEngine,
} from "./ai/confidence/morphologyConfidence/index.js";

import {
  createMorphologyExplanationEngine,
} from "./ai/explanation/morphologyExplanation/index.js";

import {
  createMorphologyEvidenceGraphEngine,
} from "./ai/graph/morphologyEvidence/index.js";

import {
  createDifferentialRuleLibrary,
} from "./ai/differentialDiagnosis/ruleLibrary/index.js";

import {
  createDifferentialPairBuilderEngine,
} from "./ai/differentialDiagnosis/pairBuilder/index.js";

import {
  createDifferentialSimilarityEngine,
} from "./ai/differentialDiagnosis/similarityCalculator/index.js";

import {
  createDifferentialEvidenceEngine,
} from "./ai/differentialDiagnosis/evidenceEngine/index.js";

import {
  createExclusiveFeatureEngine,
} from "./ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

import {
  createDiagnosticConflictEngine,
} from "./ai/differentialDiagnosis/conflictEngine/index.js";

import {
  createDifferentialRecommendationEngine,
} from "./ai/differentialDiagnosis/recommendationEngine/index.js";

import {
  createFinalDifferentialDiagnosisEngine,
} from "./ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

import applyFinalClinicalGovernor, {
  MARROW_FINAL_GOVERNOR_AXIS_SEPARATION_VERSION,
} from "./ai/finalClinicalGovernor.js";

import validateConsistency
  from "./utils/validateConsistency.js";

import {
  applyFieldAdequacyRules,
} from "./ai/fieldAdequacyEngine.js";

import OpenAI from "openai";
import crypto from "crypto";

import {
  bootstrapRuntime,
} from "./bootstrap/runtimeBootstrap.js";

import {
  createHttpFoundation,
} from "./bootstrap/httpFoundation.js";

import {
  registerSystemRoutes,
} from "./routes/systemRoutes.js";

import {
  registerOperationalStatusRoutes,
} from "./routes/operationalStatusRoutes.js";

import {
  performance,
} from "perf_hooks";

import {
  correlateHematology,
} from './services/medicalCorrelationEngine.js';

// ============================================================================
// ENGINES
// ============================================================================

import {
  analyzeErythrocytes,
} from "./ai/erythrocyteEngine.js";

import {
  analyzeLeukocytes,
} from "./ai/leukocyteEngine.js";

import {
  analyzePlatelets,
} from "./ai/plateletEngine.js";

import {
  attachLocalMorphologyEvidence,
  createLocalMorphologyEvidence,
  enrichLocalMorphologyEvidenceWithEngines,
  localMorphologyEvidenceContractStatus,
} from "./ai/localMorphologyEvidenceContract.js";

import {
  attachAcademicMorphologyReasoning,
  createAcademicMorphologyReasoning,
  academicMorphologyReasoningContractStatus,
} from "./ai/academicMorphologyReasoningContract.js";

import {
  applyFieldScopedNegativeFindings,
} from "./ai/fieldScopedNegativeFindings.js";

import {
  applyEvidenceConsistentFinalMorphologySynthesis,
  EVIDENCE_CONSISTENT_MORPHOLOGY_SYNTHESIS_VERSION,
} from "./ai/evidenceConsistentMorphologySynthesis.js";

import {
  applySingleBlastSentinel,
  SINGLE_BLAST_SENTINEL_VERSION,
} from "./ai/singleBlastSentinel.js";

import {
  PARASITE_EVIDENCE_SENTINEL_VERSION,
  HEMOPARASITE_HIGH_SALIENCE_SENTINEL_VERSION,
  applyParasiteEvidenceSentinel,
  evaluateParasiteArtifactEvidence,
} from "./ai/parasiteEvidenceSentinel.js";

import {
  applyPeripheralPositiveMorphologyArbitration,
  PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION,
  PERIPHERAL_POLYCHROMASIA_PRESERVATION_VERSION,
  PERIPHERAL_POLYCHROMASIA_CONTRADICTION_GUARD_VERSION,
  PERIPHERAL_HEMATOPOIETIC_PARASITE_ARBITRATION_VERSION,
  PERIPHERAL_LIMITED_FIELD_NON_SUPPRESSION_VERSION,
  PERIPHERAL_FOCAL_CARDINALITY_SIGNAL_VERSION,
} from "./ai/peripheralBloodPositiveMorphologyArbitrationEngine.js";

import {
  applyPeripheralBlastoidCytologyAuthority,
  applyPeripheralNegativeFindingAuthorityControl,
  applyPeripheralFocalBlastoidCardinalityAuthority,
  PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
  PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION,
  PERIPHERAL_FOCAL_VS_POPULATION_SEPARATION_VERSION,
  PERIPHERAL_FOCAL_BLASTOID_CARDINALITY_AUTHORITY_VERSION,
  PERIPHERAL_FOCAL_BLASTOID_PRESENTATION_LOCK_VERSION,
} from "./ai/peripheralBlastoidCytologyAuthorityEngine.js";

import {
  applyPeripheralFocalHematopoieticCytomorphologyResolution,
  PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
  PERIPHERAL_MATURATION_STATE_RESOLUTION_VERSION,
  PERIPHERAL_CELL_FEATURE_PROVENANCE_VERSION,
  PERIPHERAL_FOCAL_CYTOMORPHOLOGY_CALIBRATION_VERSION,
  PERIPHERAL_MATURITY_POSITIVE_SUPPORT_GATE_VERSION,
  PERIPHERAL_UNRESOLVED_FEATURE_DOWNGRADE_VERSION,
} from "./ai/peripheralFocalHematopoieticCytomorphologyEngine.js";

import {
  REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
  applyReactiveLymphoidEvidenceSentinel,
  evaluateReactiveLymphoidEvidence,
} from "./ai/reactiveLymphoidEvidenceSentinel.js";

import {
  CRA_001_1_VERSION,
  CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
  attachClinicalResultV2,
} from "./ai/clinicalResultV2/index.js";

import {
  applyCanonicalClinicalPresentationAuthority,
  CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
} from "./ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js";

import {
  PRODUCTION_VME_ENFORCEMENT_VERSION,
  PERIPHERAL_FOCAL_EVIDENCE_CALIBRATION_ACQUISITION_VERSION,
  LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
  assessVisualMorphologyEvidenceAcquisition,
  buildPrimaryVisualMorphologyAcquisitionPrompt,
  buildVisualMorphologyAcquisitionResponseFormat,
  buildVisualMorphologyRepairPrompt,
  buildIncompleteVisualAcquisitionResponse,
  mergeVisualMorphologyRepair,
  shouldAttemptVisualMorphologyRepair,
  visualMorphologyEvidenceAcquisitionContractStatus,
  assessBoneMarrowVisualEvidenceAcquisition,
  buildBoneMarrowVisualRepairPrompt,
  buildBoneMarrowCompactAcquisitionPrompt,
  buildBoneMarrowLengthRecoveryPrompt,
  VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION,
  MARROW_REPAIR_EVIDENCE_MERGE_VERSION,
  MARROW_POSITIVE_CYTOLOGY_CARDINALITY_PRESERVATION_VERSION,
  MARROW_REPAIR_ARCHITECTURE_PROVENANCE_VERSION,
  MARROW_CYTOLOGY_TO_ARCHITECTURE_ANTIFABRICATION_VERSION,
  MARROW_IMMATURE_CYTOMORPHOLOGY_ACQUISITION_STABILITY_VERSION,
  MARROW_CROSS_PASS_EVIDENCE_PRESERVATION_VERSION,
  MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_TRIGGER_VERSION,
  MARROW_STABILITY_RECOVERY_UNRESOLVED_LOCK_VERSION,
  MARROW_PRIMARY_POSITIVE_CYTOLOGY_STABILITY_RECOVERY_VERSION,
  MARROW_IMMATURE_BLASTOID_CELL_LEVEL_CYTOMORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
  MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_LOCK_VERSION,
  MARROW_REPAIR_EVIDENCE_STATE_SEMANTIC_CANONICALIZATION_VERSION,
  BONE_MARROW_COMPACT_ACQUISITION_VERSION,
  BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION,
} from "./ai/visualMorphologyEvidenceAcquisitionContract.js";

import {
  buildDiagnosticCorrelation,
} from "./ai/diagnosticCorrelationEngine.js";

import {
  buildConfidenceAnalysis,
  MARROW_FINAL_CONFIDENCE_RECONCILIATION_VERSION,
  MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION as CONFIDENCE_MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
} from "./ai/confidenceEngine.js";

import {
  calculateReactiveLymphocyteScore,
} from "./ai/reactiveLymphocyteEngine.js";

import {
  calculateBlastMimicRisk,
} from "./ai/blastMimicEngine.js";

import {
  classifyLymphoidPattern,
} from './ai/lymphoidPatternEngine.js';

import analyzeGlobalPattern, {
  MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
} from './ai/globalPatternEngine.js';

import {
  sanitizeHematologyLanguage,
} from "./ai/hematologySemanticGuard.js";

import {
  applyAntiOvercallingRules,
} from "./ai/antiOvercallingEngine.js";

import {
  validateHematologyAnalysis,
} from "./ai/hematologySafetyEngine.js";

import {
  buildHematologyConsensus,
} from "./ai/hematologyConsensusEngine.js";

// ============================================================================
// IMAGE ENGINE
// ============================================================================

import {
  enhanceMicroscopyImage,
  buildGPTImagePayload,
} from "./ai/imageEnhancer.js";

// ============================================================================
// RUNTIME + HTTP COMPOSITION
// ============================================================================

const runtime =
  bootstrapRuntime();

const {
  port: PORT,
  openAIApiKey,
  openAIModel: OPENAI_MODEL,
  securityConfig,
} = runtime;

const {
  app,
  auth,
  jsonBodyParser,
  upload,
} = createHttpFoundation({
  securityConfig,
});

// ============================================================================
// OPENAI
// ============================================================================

const openai = new OpenAI({
  apiKey: openAIApiKey,
});


const morphologyKnowledgeRegistry =
  createCellKnowledgeRegistry();

console.log(
  "🧬 MORPHOLOGIC KNOWLEDGE FOUNDATION:",
  `${morphologyKnowledgeRegistry.snapshot().size} entities`,
);


const morphologyCriteriaEngine =
  createCriteriaEngineRegistry();

console.log(
  "🧩 MORPHOLOGIC CRITERIA ENGINE:",
  `${morphologyCriteriaEngine.criteriaRegistry.snapshot().size} definitions`,
  `${morphologyCriteriaEngine.featureCatalog.size} feature references`,
);


const morphologyFeatureMatcher =
  createFeatureMatcher();

console.log(
  "🔎 MORPHOLOGIC FEATURE MATCHER:",
  `${morphologyFeatureMatcher.criteriaEngine.criteriaRegistry.snapshot().size} candidate definitions`,
);


const morphologyScoringEngine =
  createMorphologyScoringEngine();

console.log(
  "🧮 MORPHOLOGIC SCORE CALCULATOR:",
  `${morphologyScoringEngine.criteriaEngine.criteriaRegistry.snapshot().size} scorable definitions`,
);


const morphologyCandidateEngine =
  createMorphologyCandidateEngine();

console.log(
  "🧬 MORPHOLOGIC CANDIDATE GENERATOR:",
  `${morphologyCandidateEngine.scoringEngine.criteriaEngine.criteriaRegistry.snapshot().size} candidate definitions`,
);


const morphologyRankingEngine =
  createMorphologyRankingEngine();

console.log(
  "🏆 MORPHOLOGIC RANKING ENGINE:",
  `${morphologyRankingEngine.candidateEngine.scoringEngine.criteriaEngine.criteriaRegistry.snapshot().size} rankable definitions`,
);


const morphologyConfidenceEngine =
  createMorphologyConfidenceEngine();

console.log(
  "🎯 MORPHOLOGIC CONFIDENCE ENGINE:",
  `${morphologyConfidenceEngine.rankingEngine.candidateEngine.scoringEngine.criteriaEngine.criteriaRegistry.snapshot().size} confidence-enabled definitions`,
);


const morphologyExplanationEngine =
  createMorphologyExplanationEngine();

console.log(
  "🧾 MORPHOLOGIC EXPLANATION ENGINE:",
  `${morphologyExplanationEngine.confidenceEngine.rankingEngine.candidateEngine.scoringEngine.criteriaEngine.criteriaRegistry.snapshot().size} explainable definitions`,
);


const morphologyEvidenceGraphEngine =
  createMorphologyEvidenceGraphEngine();

console.log(
  "🕸️ MORPHOLOGIC EVIDENCE GRAPH:",
  `${morphologyEvidenceGraphEngine.explanationEngine.confidenceEngine.rankingEngine.candidateEngine.scoringEngine.criteriaEngine.criteriaRegistry.snapshot().size} graph-enabled definitions`,
);


const differentialRuleLibrary =
  createDifferentialRuleLibrary();

console.log(
  "🧭 DIFFERENTIAL RULE LIBRARY:",
  `${differentialRuleLibrary.repository.snapshot().size} differential pairs`,
);


const differentialPairBuilderEngine =
  createDifferentialPairBuilderEngine();

console.log(
  "🔗 DIFFERENTIAL PAIR BUILDER:",
  `${differentialPairBuilderEngine.ruleLibrary.repository.snapshot().size} registered pair rules`,
);


const differentialSimilarityEngine =
  createDifferentialSimilarityEngine();

console.log(
  "📐 DIFFERENTIAL SIMILARITY CALCULATOR:",
  `${differentialSimilarityEngine.pairBuilderEngine.ruleLibrary.repository.snapshot().size} similarity-enabled rules`,
);


const differentialEvidenceEngine =
  createDifferentialEvidenceEngine();

console.log(
  "🧩 DIFFERENTIAL EVIDENCE ENGINE:",
  `${differentialEvidenceEngine.similarityEngine.pairBuilderEngine.ruleLibrary.repository.snapshot().size} evidence-enabled rules`,
);


const exclusiveFeatureEngine =
  createExclusiveFeatureEngine();

console.log(
  "🔬 EXCLUSIVE FEATURE ENGINE:",
  `${exclusiveFeatureEngine.differentialEvidenceEngine.similarityEngine.pairBuilderEngine.ruleLibrary.repository.snapshot().size} discriminative rules`,
);


const diagnosticConflictEngine =
  createDiagnosticConflictEngine();

console.log(
  "⚖️ DIAGNOSTIC CONFLICT ENGINE:",
  `${diagnosticConflictEngine.exclusiveFeaturePipeline.differentialEvidenceEngine.similarityEngine.pairBuilderEngine.ruleLibrary.repository.snapshot().size} conflict-enabled rules`,
);


const differentialRecommendationEngine =
  createDifferentialRecommendationEngine();

console.log(
  "🧠 DIFFERENTIAL RECOMMENDATION ENGINE:",
  `${differentialRecommendationEngine.conflictPipeline.exclusiveFeaturePipeline.differentialEvidenceEngine.similarityEngine.pairBuilderEngine.ruleLibrary.repository.snapshot().size} recommendation-enabled rules`,
);


const finalDifferentialDiagnosisEngine =
  createFinalDifferentialDiagnosisEngine();

console.log(
  "🏁 FINAL DIFFERENTIAL DIAGNOSIS ENGINE:",
  `${finalDifferentialDiagnosisEngine.recommendationPipeline.conflictPipeline.exclusiveFeaturePipeline.differentialEvidenceEngine.similarityEngine.pairBuilderEngine.ruleLibrary.repository.snapshot().size} final-diagnosis rules`,
);


// ============================================================================
// USERS
// ============================================================================

const users = new Map();

// ============================================================================
// LOGGER
// ============================================================================

function logStep(
  requestId,
  step,
  start,
) {

  const elapsed =
    Math.round(
      performance.now() - start,
    );

  console.log(
    `🧠 [${requestId}] ${step} - ${elapsed}ms`,
  );

  return elapsed;
}

// ============================================================================
// REQUEST ID
// ============================================================================

function generateRequestId() {

  return crypto.randomUUID();
}

// ============================================================================
// SAFE JSON PARSE
// ============================================================================

function safeJsonParse(
  text = "{}",
) {

  try {

    return JSON.parse(text);

  } catch (error) {

    console.error(
      "SAFE JSON PARSE ERROR:",
      error,
    );

    return {};
  }
}

// ============================================================================
// NORMALIZE RESPONSE
// ============================================================================

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;

  if (value === null || value === undefined) return false;

  const text = String(value).toLowerCase().trim();

  if (
    [
      "true",
      "yes",
      "sim",
      "present",
      "presente",
      "detected",
      "detectado",
      "suspected",
      "suspeito",
      "positive",
      "positivo",
    ].includes(text)
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// SANITIZE NARRATIVE REPETITION
// ============================================================================

function cleanRepeatedSentences(text = "") {
  if (typeof text !== "string") return text;

  const sentences =
    text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const seen = new Set();

  const cleaned = sentences.filter((sentence) => {
    const key =
      sentence
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  return cleaned.join(" ");
}

function softenRepetitiveTerms(text = "") {
  if (typeof text !== "string") return text;

  return text
    .replaceAll(
      "população celular atípica população celular atípica",
      "população celular atípica",
    )
    .replaceAll(
      "População celular atípica. População celular atípica.",
      "População celular atípica.",
    )
    .replaceAll(
      "população mononuclear atípica população mononuclear atípica",
      "população mononuclear atípica",
    )
    .replaceAll(
      "requer correlação. Requer correlação.",
      "requer correlação.",
    );
}

function sanitizeNarrativeText(text = "") {
  if (typeof text !== "string") return text;

  let cleaned = text.trim();

  cleaned = softenRepetitiveTerms(cleaned);
  cleaned = cleanRepeatedSentences(cleaned);

  return cleaned;
}

function sanitizeNarrativeRepetition(result = {}) {
  if (!result || typeof result !== "object") return result;

  const cloned = {
    ...result,
    morphologyAnalysis: {
      ...(result.morphologyAnalysis || {}),
    },
    structuredReport: {
      ...(result.structuredReport || {}),
    },
    overallAssessment: {
      ...(result.overallAssessment || {}),
    },
  };

  cloned.clinicalMeaning =
    sanitizeNarrativeText(cloned.clinicalMeaning);

  cloned.interpretiveSynthesis =
    sanitizeNarrativeText(cloned.interpretiveSynthesis);

  if (typeof cloned.hematologicReasoning === "string") {
    cloned.hematologicReasoning =
      sanitizeNarrativeText(cloned.hematologicReasoning);
  }

  if (
    cloned.hematologicReasoning &&
    typeof cloned.hematologicReasoning === "object"
  ) {
    cloned.hematologicReasoning = {
      ...cloned.hematologicReasoning,
      whatISee:
        sanitizeNarrativeText(cloned.hematologicReasoning.whatISee),
      whatItResembles:
        sanitizeNarrativeText(cloned.hematologicReasoning.whatItResembles),
      whatICannotConfirm:
        sanitizeNarrativeText(cloned.hematologicReasoning.whatICannotConfirm),
      finalInterpretation:
        sanitizeNarrativeText(cloned.hematologicReasoning.finalInterpretation),
    };
  }

  cloned.morphologyAnalysis.overview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.overview);

  cloned.morphologyAnalysis.erythrocyteReview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.erythrocyteReview);

  cloned.morphologyAnalysis.leukocyteReview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.leukocyteReview);

  cloned.morphologyAnalysis.plateletReview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.plateletReview);

  cloned.morphologyAnalysis.biologicalInterpretation =
    sanitizeNarrativeText(cloned.morphologyAnalysis.biologicalInterpretation);

  cloned.morphologyAnalysis.differentialDiagnosis =
    sanitizeNarrativeText(cloned.morphologyAnalysis.differentialDiagnosis);

  cloned.morphologyAnalysis.summary =
    sanitizeNarrativeText(cloned.morphologyAnalysis.summary);

  cloned.morphologyAnalysis.absentFindings =
    sanitizeNarrativeText(cloned.morphologyAnalysis.absentFindings);

  cloned.morphologyAnalysis.negativeFindings =
    Array.isArray(cloned.morphologyAnalysis.negativeFindings)
      ? [...new Set(cloned.morphologyAnalysis.negativeFindings)]
      : cloned.morphologyAnalysis.negativeFindings;

  cloned.structuredReport.conclusion =
    sanitizeNarrativeText(cloned.structuredReport.conclusion);

  cloned.structuredReport.hematologicMeaning =
    sanitizeNarrativeText(cloned.structuredReport.hematologicMeaning);

  cloned.structuredReport.recommendation =
    sanitizeNarrativeText(cloned.structuredReport.recommendation);

  cloned.overallAssessment.mainImpression =
    sanitizeNarrativeText(cloned.overallAssessment.mainImpression);

  return cloned;
}


// ============================================================================
// BE/FE-FIX-004 — IMMUTABLE MORPHOLOGY EVIDENCE LAYER
// Governors may constrain interpretation, but may not erase direct visual
// evidence produced by the vision model.
// ============================================================================

function nonEmptyText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function compactObservationParts(parts = []) {
  return parts
    .map(([label, value]) => {
      const text = String(value || "").trim();
      return text ? `${label}: ${text}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

function buildStructuredSeriesDescription(series = {}, kind = "") {
  const value = asPlainObject(series);

  if (kind === "erythrocyte") {
    return compactObservationParts([
      ["Tamanho", value.size],
      ["Forma", value.shape],
      ["Cromia", value.chromia],
      ["Distribuição", value.distribution],
      ["Anisocitose", value.anisocytosis],
      ["Poiquilocitose", value.poikilocytosis],
      ["Formas específicas", Array.isArray(value.specificForms) ? value.specificForms.join(", ") : ""],
      ["Inclusões", Array.isArray(value.inclusions) ? value.inclusions.join(", ") : ""],
    ]);
  }

  if (kind === "leukocyte") {
    return compactObservationParts([
      ["Heterogeneidade", value.heterogeneity],
      ["Morfologia nuclear", value.nuclearMorphology],
      ["Cromatina", value.chromatin],
      ["Nucléolos", value.nucleoli],
      ["Relação N:C", value.ncRatio],
      ["Citoplasma", value.cytoplasm],
      ["Granulação", value.granulation],
      ["Maturação", value.maturation],
      ["Atipia", value.atypia],
      ["Características blastoides", value.blastLikeFeatures],
    ]);
  }

  if (kind === "platelet") {
    return compactObservationParts([
      ["Distribuição", value.distribution],
      ["Tamanho", value.size],
      ["Agregados", value.aggregates],
      ["Morfologia", value.morphology],
    ]);
  }

  return "";
}

function buildObservedMorphologyEvidence(result = {}) {
  const canonical = asPlainObject(result.localMorphologyEvidence);
  const canonicalRbc = asPlainObject(canonical.erythrocytes);
  const canonicalWbc = asPlainObject(canonical.leukocytes);
  const canonicalPlt = asPlainObject(canonical.platelets);
  const canonicalField = asPlainObject(canonical.field);
  const raw = asPlainObject(result.rawResponse);
  const explicit = asPlainObject(
    result.observedMorphology || raw.observedMorphology,
  );
  const rawMorphology = asPlainObject(raw.morphologyAnalysis);
  const currentMorphology = asPlainObject(result.morphologyAnalysis);
  const rawSeeing = asPlainObject(raw.whatAISees);
  const currentSeeing = asPlainObject(result.whatAISees);
  const field = asPlainObject(result.fieldAdequacy || raw.fieldAdequacy);

  const erythro = asPlainObject(explicit.erythrocytes);
  const leuk = asPlainObject(explicit.leukocytes);
  const platelets = asPlainObject(explicit.platelets);

  const observed = {
    ...explicit,
    globalField:
      canonicalField.description ||
      explicit.globalField ||
      rawSeeing.globalField ||
      currentSeeing.globalField ||
      rawMorphology.overview ||
      currentMorphology.overview ||
      "",
    technicalQuality:
      canonicalField.technicalQuality ||
      explicit.technicalQuality ||
      raw.imageQuality?.description ||
      raw.imageQuality?.summary ||
      result.imageQuality?.description ||
      result.imageQuality?.summary ||
      "",
    representativity:
      explicit.representativity ||
      field.limitationReason ||
      rawSeeing.imageLimitations ||
      currentSeeing.imageLimitations ||
      "",
    erythrocytes: {
      ...erythro,
      ...canonicalRbc,
      description:
        canonicalRbc.description ||
        buildStructuredSeriesDescription(canonicalRbc, "erythrocyte") ||
        erythro.description ||
        rawMorphology.erythrocyteReview ||
        rawSeeing.erythrocytes ||
        currentMorphology.erythrocyteReview ||
        currentSeeing.erythrocytes ||
        "",
    },
    leukocytes: {
      ...leuk,
      ...canonicalWbc,
      approximateVisibleCells:
        leuk.approximateVisibleCells !== null &&
        leuk.approximateVisibleCells !== undefined &&
        leuk.approximateVisibleCells !== "" &&
        Number.isFinite(Number(leuk.approximateVisibleCells))
          ? Number(leuk.approximateVisibleCells)
          : (
              field.visibleLeukocytes !== null &&
              field.visibleLeukocytes !== undefined &&
              field.visibleLeukocytes !== "" &&
              Number.isFinite(Number(field.visibleLeukocytes))
                ? Number(field.visibleLeukocytes)
                : null
            ),
      description:
        canonicalWbc.description ||
        buildStructuredSeriesDescription(canonicalWbc, "leukocyte") ||
        leuk.description ||
        rawMorphology.leukocyteReview ||
        rawSeeing.leukocytes ||
        currentMorphology.leukocyteReview ||
        currentSeeing.leukocytes ||
        "",
    },
    platelets: {
      ...platelets,
      ...canonicalPlt,
      description:
        canonicalPlt.description ||
        buildStructuredSeriesDescription(canonicalPlt, "platelet") ||
        platelets.description ||
        rawMorphology.plateletReview ||
        rawSeeing.platelets ||
        currentMorphology.plateletReview ||
        currentSeeing.platelets ||
        "",
    },
    artifacts: Array.isArray(explicit.artifacts) ? explicit.artifacts : [],
    positiveEvidence: Array.isArray(explicit.positiveEvidence)
      ? explicit.positiveEvidence
      : [],
    uncertainty: Array.isArray(explicit.uncertainty)
      ? explicit.uncertainty
      : [],
  };

  return observed;
}

function buildAcademicInterpretation(result = {}, observed = {}) {
  const raw = asPlainObject(result.rawResponse);
  const explicit = asPlainObject(
    result.academicInterpretation || raw.academicInterpretation,
  );
  const reasoning = asPlainObject(raw.hematologicReasoning || result.hematologicReasoning);

  return {
    ...explicit,
    morphologicSynthesis:
      explicit.morphologicSynthesis ||
      raw.interpretiveSynthesis ||
      result.interpretiveSynthesis ||
      observed.globalField ||
      "",
    erythrocyteReasoning:
      explicit.erythrocyteReasoning ||
      asPlainObject(observed.erythrocytes).description ||
      "",
    leukocyteReasoning:
      explicit.leukocyteReasoning ||
      reasoning.whatISee ||
      asPlainObject(observed.leukocytes).description ||
      "",
    plateletReasoning:
      explicit.plateletReasoning ||
      asPlainObject(observed.platelets).description ||
      "",
    differentialConsiderations: Array.isArray(explicit.differentialConsiderations)
      ? explicit.differentialConsiderations
      : [],
    pathophysiology: explicit.pathophysiology || "",
    teachingPoints: Array.isArray(explicit.teachingPoints)
      ? explicit.teachingPoints
      : [],
    confirmationNeeds: Array.isArray(explicit.confirmationNeeds)
      ? explicit.confirmationNeeds
      : [],
  };
}


function projectAcademicMorphologyReasoningCompatibility(
  result = {},
  reasoning = {},
) {
  if (!result || typeof result !== "object") return result;

  const amr =
    reasoning &&
    typeof reasoning === "object" &&
    !Array.isArray(reasoning)
      ? reasoning
      : {};

  const joinLines = (value) =>
    Array.isArray(value)
      ? value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
          .join("\n")
      : String(value || "").trim();

  const isAdequacyOnlyNarrative = (value) => {
    const text = normalizeSemanticText(String(value || ""));
    if (!text) return true;

    const adequacySignals = [
      "campo limitado",
      "baixa representatividade",
      "limitada pela representatividade",
      "limitado para avaliacao populacional",
      "nao permite caracterizacao populacional",
      "nao posso confirmar normalidade global",
      "imagem isolada nao permite",
      "campo microscopico limitado",
    ];

    const morphologySignals = [
      "cromatina", "nucleolo", "citoplasma", "segment", "granul",
      "anisocit", "poiquilocit", "hipocrom", "normocrom",
      "linfocit", "neutrofil", "monocit", "eosinofil", "basofil",
      "reativ", "atipic", "blasto", "plaquet",
    ];

    const hasAdequacy = adequacySignals.some((signal) => text.includes(signal));
    const hasMorphology = morphologySignals.some((signal) => text.includes(signal));

    return hasAdequacy && !hasMorphology;
  };

  const preserved = {
    ...result,
    hematologicReasoning:
      result.hematologicReasoning &&
      typeof result.hematologicReasoning === "object" &&
      !Array.isArray(result.hematologicReasoning)
        ? { ...result.hematologicReasoning }
        : {
            whatISee: "",
            whatItResembles: "",
            whatICannotConfirm: "",
            finalInterpretation:
              typeof result.hematologicReasoning === "string"
                ? result.hematologicReasoning
                : "",
          },
    academicInterpretation:
      result.academicInterpretation &&
      typeof result.academicInterpretation === "object" &&
      !Array.isArray(result.academicInterpretation)
        ? { ...result.academicInterpretation }
        : {},
  };

  const amrWhatISee = joinLines(amr.whatISee);
  const amrResembles = joinLines(amr.whatItResembles);
  const amrCannotConfirm = joinLines(amr.cannotConfirm);
  const amrEvidenceFor = joinLines(amr.evidenceFor);
  const amrEvidenceAgainst = joinLines(amr.evidenceAgainst);
  const amrDifferentials = joinLines(amr.differentialMorphology);
  const amrTeachingPoints = Array.isArray(amr.teachingPoints)
    ? [...amr.teachingPoints]
    : [];

  // BE-FIX-005.6 — Compatibility bridge for the current Flutter UI.
  // Real morphology remains authoritative; adequacy-only prose is not allowed
  // to occupy morphology slots when AMR contains preserved local evidence.
  if (
    amrWhatISee &&
    (
      !String(preserved.hematologicReasoning.whatISee || "").trim() ||
      isAdequacyOnlyNarrative(preserved.hematologicReasoning.whatISee)
    )
  ) {
    preserved.hematologicReasoning.whatISee = amrWhatISee;
  }

  if (
    amrResembles &&
    (
      !String(preserved.hematologicReasoning.whatItResembles || "").trim() ||
      isAdequacyOnlyNarrative(preserved.hematologicReasoning.whatItResembles)
    )
  ) {
    preserved.hematologicReasoning.whatItResembles = amrResembles;
  }

  // Boundary/limitation language belongs here, so only fill when absent.
  if (!String(preserved.hematologicReasoning.whatICannotConfirm || "").trim()) {
    preserved.hematologicReasoning.whatICannotConfirm = amrCannotConfirm;
  }

  if (!String(preserved.academicInterpretation.evidenceFor || "").trim()) {
    preserved.academicInterpretation.evidenceFor = amrEvidenceFor;
  }

  if (!String(preserved.academicInterpretation.evidenceAgainst || "").trim()) {
    preserved.academicInterpretation.evidenceAgainst = amrEvidenceAgainst;
  }

  if (
    !Array.isArray(preserved.academicInterpretation.differentialConsiderations) ||
    preserved.academicInterpretation.differentialConsiderations.length === 0
  ) {
    preserved.academicInterpretation.differentialConsiderations =
      Array.isArray(amr.differentialMorphology)
        ? [...amr.differentialMorphology]
        : [];
  }

  if (
    !Array.isArray(preserved.academicInterpretation.teachingPoints) ||
    preserved.academicInterpretation.teachingPoints.length === 0
  ) {
    preserved.academicInterpretation.teachingPoints = amrTeachingPoints;
  }

  if (
    !Array.isArray(preserved.academicInterpretation.confirmationNeeds) ||
    preserved.academicInterpretation.confirmationNeeds.length === 0
  ) {
    preserved.academicInterpretation.confirmationNeeds =
      Array.isArray(amr.cannotConfirm)
        ? [...amr.cannotConfirm]
        : [];
  }

  if (
    amrWhatISee &&
    (
      !String(preserved.academicInterpretation.morphologicSynthesis || "").trim() ||
      isAdequacyOnlyNarrative(preserved.academicInterpretation.morphologicSynthesis)
    )
  ) {
    preserved.academicInterpretation.morphologicSynthesis = amrWhatISee;
  }

  if (!String(preserved.academicInterpretation.differentialReasoning || "").trim()) {
    preserved.academicInterpretation.differentialReasoning =
      [amrResembles, amrEvidenceFor, amrEvidenceAgainst, amrDifferentials]
        .filter(Boolean)
        .join("\n");
  }

  return preserved;
}

function applyMorphologyEvidencePreservation(result = {}) {
  if (!result || typeof result !== "object") return result;

  const preserved = { ...result };
  const observed = buildObservedMorphologyEvidence(preserved);
  const academic = buildAcademicInterpretation(preserved, observed);

  preserved.observedMorphology = observed;
  preserved.academicInterpretation = academic;
  preserved.morphologyAnalysis = {
    ...asPlainObject(preserved.morphologyAnalysis),
  };
  preserved.whatAISees = {
    ...asPlainObject(preserved.whatAISees),
  };

  // Prefer the direct-observation layer for series descriptions. These fields
  // describe what is visible in the submitted field and therefore remain valid
  // even when representativity is limited.
  if (nonEmptyText(observed.globalField)) {
    preserved.morphologyAnalysis.overview = observed.globalField;
    preserved.whatAISees.globalField = observed.globalField;
  }

  if (nonEmptyText(observed.erythrocytes?.description)) {
    preserved.morphologyAnalysis.erythrocyteReview =
      observed.erythrocytes.description;
    preserved.whatAISees.erythrocytes = observed.erythrocytes.description;
  }

  if (nonEmptyText(observed.leukocytes?.description)) {
    preserved.morphologyAnalysis.leukocyteReview =
      observed.leukocytes.description;
    preserved.whatAISees.leukocytes = observed.leukocytes.description;
  }

  if (nonEmptyText(observed.platelets?.description)) {
    preserved.morphologyAnalysis.plateletReview =
      observed.platelets.description;
    preserved.whatAISees.platelets = observed.platelets.description;
  }

  if (nonEmptyText(observed.representativity)) {
    preserved.whatAISees.imageLimitations = observed.representativity;
  }

  return preserved;
}

// ============================================================================
// LIMITED FIELD FINAL LOCK V4 — HEMOPARASITE SAFE GOVERNOR
// Bloqueia falso normal em campo limitado e força segurança para estruturas
// extracelulares/intraeritrocitárias suspeitas.
// ============================================================================

function isLimitedFieldResult(result = {}) {
  return (
    result?.finalClassification === "CLASS_1_LIMITED_FIELD" ||
    result?.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
    result?.morphologicRiskClass === "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
    result?.fieldAdequacy?.adequateForPopulationAssessment === false ||
    result?.fieldAdequacy?.limitedField === true
  );
}

function detectHemoparasitePattern(result = {}) {
  // BE-FIX-005.14 — free-text scanning is forbidden as a positive parasite
  // source. Canonical LME-1.0 structured evidence is authoritative.
  const assessment = evaluateParasiteArtifactEvidence(result);

  if (!assessment.explicitPositiveParasiteEvidence) {
    return {
      suspected: false,
      type: "NONE",
      confidence: "low",
      blockPlasmodium: false,
      label: assessment.artifactLikely
        ? "Estrutura incomum favorecendo artefato técnico/óptico; sem evidência estruturada positiva de hemoparasita."
        : "",
      artifactLikely: assessment.artifactLikely,
    };
  }

  const trypanosomatidLike = assessment.trypanosomatidLike === true;
  return {
    suspected: true,
    type: trypanosomatidLike ? "TRYPANOSOMA_SUSPECT" : "HEMOPARASITE_SUSPECT",
    confidence: trypanosomatidLike ? "high" : "moderate",
    blockPlasmodium: trypanosomatidLike,
    label: trypanosomatidLike
      ? "Formas extracelulares com morfologia compatível com tripanossomatídeos observadas no campo; requer confirmação laboratorial e não permite identificação de espécie pela imagem isolada."
      : "Evidência visual estruturada positiva para forma parasitária no campo analisado; requer confirmação laboratorial.",
    artifactLikely: assessment.artifactLikely,
  };
}

function shouldPreserveTerminalMarrowMorphology(result = {}) {
  const axis = result?.marrowAdequacyMorphologyAxis || {};
  const authority = result?.finalMarrowAuthority || {};
  const expansion = result?.marrowMyeloidExpansionDiscrimination || {};
  const globalPattern = result?.globalPattern || {};

  const morphologyClassification =
    axis.morphologyClassification ||
    authority.morphologyClassification ||
    result?.finalClassification ||
    null;

  const protectedExpansion =
    morphologyClassification ===
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN" ||
    expansion.classification ===
      "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" ||
    globalPattern.dominantPattern ===
      "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION";

  const trueBlastoid =
    authority?.structuredBlast?.observed === true ||
    authority?.structuredBlast?.suspicious === true ||
    result?.marrowBlastPopulationEvidence?.observedPopulation === true ||
    result?.marrowBlastPopulationEvidence?.suspiciousPopulation === true;

  return (
    trueBlastoid ||
    protectedExpansion ||
    (
      typeof morphologyClassification === "string" &&
      morphologyClassification.startsWith("MARROW_")
    )
  );
}

function applyLimitedFieldFinalLock(result = {}) {
  if (!result || typeof result !== "object") return result;

  const parasite = detectHemoparasitePattern(result);
  const isLimited = isLimitedFieldResult(result);

    const rawPositiveFindings =
      result.rawResponse?.positiveFindings || {};

    const hasCriticalBlastFinding =
      result.findings?.blastSuspicion === true ||
      result.findings?.immatureCells === true ||
      result.findings?.monomorphicPopulation === true ||
      result.findings?.plasmablasts === true ||
      rawPositiveFindings.blastSuspicion === true ||
      rawPositiveFindings.immatureCells === true ||
      rawPositiveFindings.monomorphicPopulation === true ||
      result.rawResponse?.blastSuspicion === true;

    if (hasCriticalBlastFinding) {
      const locked = {
        ...result,
        findings: { ...(result.findings || {}) },
        morphologyAnalysis: { ...(result.morphologyAnalysis || {}) },
        whatAISees: { ...(result.whatAISees || {}) },
        structuredReport: { ...(result.structuredReport || {}) },
        overallAssessment: { ...(result.overallAssessment || {}) },
        confidenceAnalysis: { ...(result.confidenceAnalysis || {}) },
      };

      locked.findings.blastSuspicion = true;
      locked.findings.immatureCells =
        locked.findings.immatureCells === true ||
        rawPositiveFindings.immatureCells === true;

      locked.findings.monomorphicPopulation =
        locked.findings.monomorphicPopulation === true ||
        rawPositiveFindings.monomorphicPopulation === true;

      locked.normalityBlocked = true;
      locked.requiresHumanReview = true;
      locked.finalClassification = "CLASS_4_BLAST_SUSPICION";
      locked.morphologicRiskClass = "CLASS_4_BLAST_SUSPICION";
      locked.riskLevel = "Suspeita de população imatura/blástica";

      locked.blockNormalReason = [
        ...new Set([
          ...(Array.isArray(locked.blockNormalReason)
            ? locked.blockNormalReason
            : []),
          "Suspeita de células imaturas/blásticas",
          "Não classificar como campo limitado simples",
          "Necessária revisão hematológica especializada",
        ]),
      ];

      const blastConclusion =
        "População mononuclear imatura/atípica suspeita. Não classificar como campo limitado simples. Requer revisão hematológica especializada.";

      locked.mainFinding = blastConclusion;
      locked.primaryFinding = blastConclusion;
      locked.finalConclusion = blastConclusion;

      locked.morphologyAnalysis.summary = blastConclusion;
      locked.morphologyAnalysis.overview =
        "Campo com predomínio de células mononucleares grandes/atípicas, com suspeita de população imatura/blástica.";
      locked.morphologyAnalysis.leukocyteReview =
        "Presença de células mononucleares grandes/atípicas. A hipótese de população imatura/blástica não deve ser descartada pela imagem isolada.";
      locked.morphologyAnalysis.absentFindings =
        "Bastonetes de Auer não claramente identificados; ausência global de blastos não pode ser afirmada.";

      locked.whatAISees.leukocytes =
        "Células mononucleares grandes/atípicas com suspeita de imaturidade.";
      locked.whatAISees.dominantFinding =
        "População mononuclear imatura/atípica suspeita.";
      locked.whatAISees.negativeFindings =
        "Não afirmar ausência global de blastos pela imagem isolada.";

      locked.clinicalMeaning =
        "Achado morfológico crítico. Requer correlação com hemograma, revisão microscópica profissional e, se indicado, imunofenotipagem.";
      locked.interpretiveSynthesis =
        "Não afirmar ausência de blastos. A imagem contém achados compatíveis com população celular imatura/atípica.";

      locked.structuredReport.conclusion = blastConclusion;
      locked.structuredReport.hematologicMeaning = locked.clinicalMeaning;
      locked.structuredReport.recommendation =
        "Revisão hematológica especializada, hemograma completo e imunofenotipagem se indicada.";

      locked.overallAssessment.requiresHumanReview = true;
      locked.overallAssessment.riskCategory = "CLASS_4_BLAST_SUSPICION";
      locked.overallAssessment.mainImpression = blastConclusion;

      return locked;
    }

  if (!isLimited && !parasite.suspected) return result;

  const locked = {
    ...result,
    findings: { ...(result.findings || {}) },
    morphologyAnalysis: { ...(result.morphologyAnalysis || {}) },
    whatAISees: { ...(result.whatAISees || {}) },
    patternRecognition: { ...(result.patternRecognition || {}) },
    structuredReport: { ...(result.structuredReport || {}) },
    overallAssessment: { ...(result.overallAssessment || {}) },
    confidenceAnalysis: { ...(result.confidenceAnalysis || {}) },
  };

  locked.normalityBlocked = true;
  locked.requiresHumanReview = true;

  locked.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(locked.blockNormalReason) ? locked.blockNormalReason : []),
      ...(isLimited
        ? [
            "Campo microscópico limitado",
            "Baixa representatividade celular",
            "Não afirmar normalidade global pela imagem isolada",
          ]
        : []),
      ...(parasite.suspected
        ? [
            "Estrutura incomum suspeita para hemoparasita ou artefato",
            "Não afirmar normalidade global diante de estrutura parasitária suspeita",
          ]
        : []),
    ]),
  ];

  if (parasite.suspected) {
    locked.finalClassification = isLimited
      ? "CLASS_1_LIMITED_FIELD_HEMOPARASITE_SUSPECT"
      : "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";

    locked.morphologicRiskClass = locked.finalClassification;
    locked.riskLevel = "Estrutura hemoparasitária suspeita";
    locked.mainFinding = parasite.label;
    locked.primaryFinding = parasite.label;
    locked.finalConclusion = parasite.label;

    locked.findings.parasiteSuspected = true;
    locked.findings.unusualStructureSuspected = true;
    locked.findings.parasiteType = parasite.type;
    locked.findings.blockPlasmodiumDiagnosis = parasite.blockPlasmodium;
    locked.findings.plasmodiumSuspected = parasite.type === "PLASMODIUM_SUSPECT";

    locked.parasiteAnalysis = {
      suspected: true,
      parasiteType: parasite.type,
      parasiteName:
        parasite.type === "PLASMODIUM_SUSPECT"
          ? "Plasmodium spp."
          : parasite.type === "BABESIA_SUSPECT"
            ? "Babesia spp."
            : parasite.type === "TRYPANOSOMA_SUSPECT"
              ? "Morfologia compatível com tripanossomatídeo"
              : parasite.type === "MICROFILARIA_SUSPECT"
                ? "Microfilária suspeita"
                : "Hemoparasita ou artefato não definido",
      blockPlasmodiumDiagnosis: parasite.blockPlasmodium,
      interpretation: parasite.blockPlasmodium
        ? "Há estrutura incomum/hemoparasitária suspeita, porém o padrão não sustenta classificação automática como Plasmodium spp."
        : "Há estruturas intraeritrocitárias suspeitas para Plasmodium spp.; requer confirmação laboratorial.",
      recommendation:
        "Confirmar por revisão microscópica profissional, avaliação de múltiplos campos, gota espessa/esfregaço seriado e métodos complementares conforme protocolo.",
    };

    locked.morphologyAnalysis.summary = parasite.label;
    locked.morphologyAnalysis.overview =
      "Campo microscópico com estrutura hemoparasitária/extracelular incomum suspeita. A imagem isolada não permite diagnóstico definitivo, identificação de espécie ou quantificação.";
    locked.morphologyAnalysis.erythrocyteReview =
      "Hemácias visíveis no campo, com avaliação global limitada. A presença de estrutura incomum exige exclusão de hemoparasita ou artefato.";
    locked.morphologyAnalysis.leukocyteReview =
      "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas.";
    locked.morphologyAnalysis.plateletReview =
      "Plaquetas podem ser visualizadas, porém a avaliação quantitativa global permanece limitada pela imagem isolada.";
    locked.morphologyAnalysis.biologicalInterpretation =
      "Achado hemoparasitário/estrutura incomum suspeita. A interpretação deve permanecer educacional e dependente de confirmação microscópica.";
    locked.morphologyAnalysis.differentialDiagnosis =
      "Diferenciais educacionais: hemoparasita extracelular, Trypanosoma spp., microfilária, Babesia/Plasmodium conforme padrão intraeritrocitário, ou artefato de lâmina/corante.";

    locked.whatAISees.dominantFinding = parasite.label;
    locked.whatAISees.unusualStructures = parasite.label;
    locked.whatAISees.imageLimitations =
      "Imagem/campo isolado; não permite diagnóstico definitivo, identificação de espécie ou quantificação parasitária.";
    locked.whatAISees.freeNarrative =
      "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas."
    locked.patternRecognition.overallPattern =
      "Estrutura hemoparasitária suspeita em campo limitado";
    locked.patternRecognition.artifactPattern =
      "Artefato permanece no diferencial até confirmação microscópica.";

    locked.clinicalMeaning =
      "Achado suspeito para hemoparasita ou estrutura incomum. A imagem isolada não permite diagnóstico definitivo, identificação de espécie, parasitemia ou gravidade. Requer confirmação laboratorial e revisão microscópica profissional.";

    locked.interpretiveSynthesis =
      `${parasite.label}. A confirmação exige correlação clínico-laboratorial, revisão parasitológica adequada e avaliação de múltiplos campos.`;

    locked.hematologicReasoning = {
      whatISee: parasite.label,
      whatItResembles:
        "Estrutura extracelular/intraeritrocitária incomum que pode representar hemoparasita ou artefato.",
      whatICannotConfirm:
        "Não é possível confirmar espécie, parasitemia, gravidade, origem artefatual ou diagnóstico definitivo apenas pela imagem.",
      finalInterpretation:
        "Achado parasitário/estrutura incomum suspeita; requer confirmação laboratorial e revisão microscópica profissional.",
    };

    locked.structuredReport.conclusion = parasite.label;
    locked.structuredReport.hematologicMeaning = locked.clinicalMeaning;
    locked.structuredReport.recommendation =
      "Confirmar por revisão microscópica profissional, gota espessa/esfregaço seriado e métodos complementares conforme protocolo.";

    locked.overallAssessment.requiresHumanReview = true;
    locked.overallAssessment.riskCategory =
      "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";
    locked.overallAssessment.mainImpression = parasite.label;

    locked.confidenceAnalysis.globalConfidenceScore = Math.min(
      Number(locked.confidenceAnalysis.globalConfidenceScore || 40),
      40,
    );

    locked.confidenceAnalysis.summary =
      "Campo com estrutura hemoparasitária suspeita. A confiança global não deve ser interpretada como normalidade hematológica.";

    return locked;
  }

  // BE-FIX-005.47 — adequacy cannot replace a terminal positive marrow
  // morphology. Preserve the morphology axis and project CLASS_1 only into
  // adequacy metadata.
  if (isLimited && shouldPreserveTerminalMarrowMorphology(locked)) {
    const projected =
      applyMarrowMorphologyAdequacyProjectionLock(locked);

    projected.normalityBlocked = true;
    projected.requiresHumanReview = true;
    projected.evidenceGovernance = {
      ...(projected.evidenceGovernance || {}),
      limitedField: true,
      evidenceScope: "FIELD_SCOPED",
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    };

    projected.confidenceAnalysis = {
      ...(projected.confidenceAnalysis || {}),
    };

    return projected;
  }

  // Generic limited field remains a valid final class only when no positive
  // terminal marrow morphology has been established.
  locked.finalClassification = "CLASS_1_LIMITED_FIELD";
  locked.morphologicRiskClass = "CLASS_1_LIMITED_FIELD";
  locked.riskLevel = "Campo limitado";

  const limitedConclusion =
    "Campo microscópico limitado para conclusão populacional global. Os achados morfológicos observados permanecem válidos para o campo analisado e não devem ser generalizados para toda a lâmina.";

  locked.mainFinding = locked.mainFinding || limitedConclusion;
  locked.primaryFinding = locked.primaryFinding || locked.mainFinding;
  locked.finalConclusion = locked.finalConclusion || locked.mainFinding;

  locked.morphologyAnalysis.overview =
    locked.morphologyAnalysis.overview || limitedConclusion;
  locked.morphologyAnalysis.summary =
    locked.morphologyAnalysis.summary || locked.mainFinding;
  locked.morphologyAnalysis.absentFindings =
    locked.morphologyAnalysis.absentFindings ||
    "A não visualização de um elemento neste campo não permite sua exclusão global na lâmina.";

  locked.whatAISees.imageLimitations =
    locked.whatAISees.imageLimitations ||
    "Representatividade limitada: preservar achados observados e evitar inferências globais.";
  locked.whatAISees.negativeFindings =
    "A ausência de um elemento neste campo não permite sua exclusão global na lâmina.";

  locked.clinicalMeaning = locked.clinicalMeaning ||
    "Campo limitado. Os achados morfológicos observados devem ser correlacionados com hemograma completo, múltiplos campos e revisão microscópica profissional.";
  locked.interpretiveSynthesis = locked.interpretiveSynthesis ||
    "A representatividade limitada reduz a força das conclusões populacionais sem apagar evidências morfológicas positivas observadas.";

  locked.overallAssessment.requiresHumanReview = true;
  locked.overallAssessment.riskCategory = "CLASS_1_LIMITED_FIELD";
  locked.overallAssessment.mainImpression =
    locked.overallAssessment.mainImpression || locked.mainFinding;

  locked.structuredReport.conclusion =
    locked.structuredReport.conclusion || locked.mainFinding;
  locked.structuredReport.hematologicMeaning =
    locked.structuredReport.hematologicMeaning || locked.clinicalMeaning;
  locked.structuredReport.recommendation =
    locked.structuredReport.recommendation ||
    "Correlacionar com hemograma completo, avaliação de múltiplos campos e revisão microscópica profissional.";

  // Confidence remains constrained by limited representativity, but morphology is preserved.
  locked.confidenceAnalysis.globalConfidenceScore = Math.min(
    Number(locked.confidenceAnalysis.globalConfidenceScore || 40),
    40,
  );

  return locked;
}

function normalizeMedicalResponse(
  data = {},
) {

  const findings =
    data.findings || {};

  const defaultAbsentFindings =
    "A avaliabilidade dos achados negativos depende do domínio morfológico correspondente; elementos não avaliáveis não devem ser descritos como ausentes.";

  const atypicalLymphocyteSubtype =
    findings.atypicalLymphocyteSubtype ||
    data.atypicalLymphocyteSubtype ||
    "none";

    const downeyLikeCells =
      Boolean(
        findings.downeyLikeCells ||
        data.downeyLikeCells
      );

    const downeyType =
      findings.downeyType ||
      data.downeyType ||
      "none";

    const monocytoidAtypicalLymphocytes =
      Boolean(
        findings.monocytoidAtypicalLymphocytes ||
        data.monocytoidAtypicalLymphocytes ||
        atypicalLymphocyteSubtype === "monocytoid"
      );

    const lymphocytoidAtypicalLymphocytes =
      Boolean(
        findings.lymphocytoidAtypicalLymphocytes ||
        data.lymphocytoidAtypicalLymphocytes ||
        atypicalLymphocyteSubtype === "lymphocytoid"
      );

    const immunoblastoidCells =
      Boolean(
        findings.immunoblastoidCells ||
        data.immunoblastoidCells ||
        atypicalLymphocyteSubtype === "immunoblastoid"
      );

  // BE-FIX-005.15 — large/atypical mononuclear cells alone do not
  // authorize a reactive lymphoid population pattern.
  const reactiveEvidenceAssessment =
    evaluateReactiveLymphoidEvidence({
      ...data,
      findings,
      visualEvidence:
        data.visualEvidence ||
        data.rawResponse?.visualEvidence ||
        {},
    });

  const reactiveLymphoidPattern =
    reactiveEvidenceAssessment.reactivePatternSupported === true;

  const mononucleosisSuspicion =
    reactiveEvidenceAssessment.mononucleosisPatternSupported === true;

  const normalityBlocked =
    Boolean(
      data.normalityBlocked ||
      reactiveLymphoidPattern ||
      findings.monomorphicPopulation
    );

  const blockNormalReason =
    Array.isArray(data.blockNormalReason)
      ? [...data.blockNormalReason]
      : [];

  if (reactiveLymphoidPattern) {
    blockNormalReason.push(
      "Linfócitos atípicos, linfócitos reativos ou células mononucleares ativadas impedem classificação como normal."
    );
  }

  const visualEvidence =
    typeof data.visualEvidence === "object" &&
    data.visualEvidence !== null
      ? data.visualEvidence
      : (
          typeof data.rawResponse?.visualEvidence === "object" &&
          data.rawResponse.visualEvidence !== null
            ? data.rawResponse.visualEvidence
            : {}
        );

  const positiveFindings =
    Array.isArray(data.positiveFindings)
      ? [...data.positiveFindings]
      : [];

  const negativeFindingsStructured =
    Array.isArray(data.negativeFindingsStructured)
      ? [...data.negativeFindingsStructured]
      : [];

  // BE-FIX-005.25 — no negative morphology may be synthesized from an
  // acquisition that explicitly failed to produce visual evidence.
  const zeroEvidenceAcquisition =
    data?.visualMorphologyEvidenceAcquisition?.complete === false ||
    data?.visualMorphologyEvidenceAcquisition?.zeroEvidence === true ||
    data?.visualEvidenceAcquisitionIncomplete === true;

  if (
    findings?.reactiveLymphocytes === true
  ) {
    positiveFindings.push(
      "Linfócitos reativos observados"
    );
  }

  if (
    findings?.atypicalLymphocytes === true
  ) {
    positiveFindings.push(
      "Linfócitos atípicos observados"
    );
  }

  if (
    findings?.largeMononuclearCells === true
  ) {
    positiveFindings.push(
      "Células mononucleares aumentadas"
    );
  }

  if (
    findings?.plasmacytoidCells === true
  ) {
    positiveFindings.push(
      "Células plasmocitoides observadas"
    );
  }

  if (
    findings?.plasmocytes === true
  ) {
    positiveFindings.push(
      "Plasmócitos observados"
    );
  }

  if (
    findings?.plasmablasts === true
  ) {
    positiveFindings.push(
      "Plasmoblastos observados"
    );
  }

  if (
    findings?.monomorphicPopulation === true
  ) {
    positiveFindings.push(
      "População monomórfica observada"
    );
  }

  const blastEvidenceState = String(findings?.blastEvidenceState || data?.blastEvidenceState || '').toUpperCase();

  if (
    zeroEvidenceAcquisition !== true &&
    findings?.blastSuspicion !== true &&
    blastEvidenceState === 'NOT_OBSERVED_IN_EVALUABLE_FIELD'
  ) {
    negativeFindingsStructured.push(
      "Blastos inequívocos não identificados entre as células suficientemente avaliáveis neste campo. Esta observação não permite exclusão global na lâmina."
    );
  }

  if (
    zeroEvidenceAcquisition !== true &&
    findings?.immatureCells !== true &&
    blastEvidenceState === 'NOT_OBSERVED_IN_EVALUABLE_FIELD'
  ) {
    negativeFindingsStructured.push(
      "Células imaturas críticas não identificadas entre as células suficientemente avaliáveis neste campo. Esta observação não permite exclusão global na lâmina."
    );
  }

  if (zeroEvidenceAcquisition !== true) {
    negativeFindingsStructured.push(
      "Bastonetes de Auer não identificados entre as células suficientemente avaliáveis neste campo. Esta observação não permite exclusão global na lâmina."
    );

    negativeFindingsStructured.push(
      "Agregados plaquetários não identificados entre os elementos suficientemente avaliáveis neste campo. Esta observação não permite exclusão global na lâmina."
    );
  }

  const uniquePositiveFindings =
    [...new Set(positiveFindings)]
      .filter((item) => String(item || "").trim().length > 0);

  const executiveSummary =
    typeof data.executiveSummary === "object" &&
    data.executiveSummary !== null
      ? { ...data.executiveSummary }
      : {};

  executiveSummary.mainFinding =
    executiveSummary.mainFinding ||
    data?.morphologyAnalysis?.summary ||
    data?.overallAssessment?.mainImpression ||
    "Achado principal não definido.";

  executiveSummary.riskLevel =
    executiveSummary.riskLevel ||
    data?.riskLevel ||
    data?.morphologicRiskClass ||
    "Risco não definido.";

  executiveSummary.confidence =
    executiveSummary.confidence ||
    `${data?.confidenceAnalysis?.globalConfidenceScore || 0}%`;

  executiveSummary.pattern =
    executiveSummary.pattern ||
    data?.patternRecognition?.overallPattern ||
    "Padrão morfológico não definido.";

  executiveSummary.humanReview =
    executiveSummary.humanReview ||
    (
      data?.overallAssessment?.requiresHumanReview === true ||
      data?.normalityBlocked === true
        ? "Revisão humana recomendada"
        : "Revisão humana conforme contexto clínico"
    );

  const uniqueNegativeFindings =
    [...new Set(negativeFindingsStructured)]
      .filter((item) => String(item || "").trim().length > 0);

  return {

    normalityBlocked,

    blockNormalReason:
      [...new Set(blockNormalReason)],

    morphologicRiskClass:
      mononucleosisSuspicion

        ? "CLASS_2_REACTIVE_MONONUCLEOSIS_PATTERN"

        : normalityBlocked

          ? (
              data.morphologicRiskClass ===
                  "CLASS_0_NORMAL" ||
              !data.morphologicRiskClass

                ? "CLASS_2_ATYPICAL_POPULATION"

                : data.morphologicRiskClass
            )

          : (
              data.morphologicRiskClass ||
              "CLASS_0_NORMAL"
            ),

    reactiveLymphoidPattern,

    mononucleosisSuspicion,

    downeyCellSuspicion:
      Boolean(
        data.downeyCellSuspicion ||
        downeyLikeCells ||
        downeyType === "II" ||
        downeyType === "III"
      ),

    summary:
      data.summary || "",

    riskLevel:
      reactiveLymphoidPattern
        ? "Alteração morfológica linfoide reacional"
        : (data.riskLevel || "Indefinido"),

    observations:
      data.observations || "",

    alerts:
      Array.isArray(data.alerts)
        ? data.alerts
        : [],

    morphologies:
      Array.isArray(data.morphologies)
        ? data.morphologies
        : [],

    counts:
      typeof data.counts === "object" &&
      data.counts !== null
        ? data.counts
        : {},

    findings: {

      reactiveLymphocytes:
        Boolean(findings.reactiveLymphocytes),

      largeMononuclearCells:
        Boolean(findings.largeMononuclearCells),

      plasmacytoidCells:
        Boolean(findings.plasmacytoidCells),

      plasmocytes:
        Boolean(findings.plasmocytes),

      plasmablasts:
        Boolean(findings.plasmablasts),

      atypicalLymphocytes:
        Boolean(findings.atypicalLymphocytes),

      atypicalLymphocyteSubtype,

      downeyLikeCells,

      downeyType,

      monocytoidAtypicalLymphocytes,

      lymphocytoidAtypicalLymphocytes,

      immunoblastoidCells,

      monomorphicPopulation:
        Boolean(findings.monomorphicPopulation),

      immatureCells:
        Boolean(findings.immatureCells),

      blastSuspicion:
        normalizeBoolean(findings.blastSuspicion),

      blastEvidenceState:
        String(findings.blastEvidenceState || data.blastEvidenceState || '').trim().toUpperCase() ||
        (normalizeBoolean(findings.blastSuspicion) ? 'SUSPICIOUS_INDETERMINATE' : 'NOT_ASSESSABLE'),
    },

    morphologyAnalysis: {

      visualMorphologyDescription:
        data?.morphologyAnalysis?.visualMorphologyDescription || {},

      cellMorphology:
        data?.morphologyAnalysis?.cellMorphology || {},

      populationPatternAnalysis:
        data?.morphologyAnalysis?.populationPatternAnalysis || {},

      negativeFindings:
        Array.isArray(data?.morphologyAnalysis?.negativeFindings)
          ? data.morphologyAnalysis.negativeFindings
          : [],

      overview:
        reactiveLymphoidPattern
          ? "Achado morfológico linfoide reacional/atípico identificado. A amostra não deve ser classificada como morfologia preservada."
          : (data?.morphologyAnalysis?.overview || ""),

      erythrocyteReview:
        data?.morphologyAnalysis?.erythrocyteReview || "",

      leukocyteReview:
        reactiveLymphoidPattern
          ? "Presença de padrão compatível com ativação linfoide reacional, incluindo linfócitos atípicos/reativos ou células mononucleares ativadas."
          : (data?.morphologyAnalysis?.leukocyteReview || ""),

      plateletReview:
        data?.morphologyAnalysis?.plateletReview || "",

      absentFindings:
        data?.morphologyAnalysis?.absentFindings ||
        defaultAbsentFindings,

      biologicalInterpretation:
        reactiveLymphoidPattern
          ? "O padrão pode estar associado a resposta imunológica reacional, incluindo síndrome mononucleósica, EBV, CMV ou outras viroses, sempre exigindo correlação clínica e laboratorial."
          : (data?.morphologyAnalysis?.biologicalInterpretation || ""),

      differentialDiagnosis:
        reactiveLymphoidPattern
          ? "Hipóteses educacionais: síndrome mononucleósica, mononucleose infecciosa por EBV, infecção por CMV ou resposta viral/reacional."
          : (data?.morphologyAnalysis?.differentialDiagnosis || ""),

      summary:
        reactiveLymphoidPattern
          ? "Ativação linfoide reacional / população mononuclear atípica."
          : (data?.morphologyAnalysis?.summary || ""),
    },

    educationalPearls:
      Array.isArray(data.educationalPearls)
        ? data.educationalPearls
        : [],

    heatmapRegions:
      Array.isArray(data.heatmapRegions)
        ? data.heatmapRegions
        : [],

    imageQuality:
      typeof data.imageQuality === "object" &&
      data.imageQuality !== null
        ? data.imageQuality
        : {},

    visualEvidence,

    positiveFindings:
      uniquePositiveFindings,

    negativeFindingsStructured:
      uniqueNegativeFindings,

    executiveSummary,

    whatAISees: {
      globalField:
        data?.whatAISees?.globalField ||
        data?.morphologyAnalysis?.overview ||
        '',

      cellularity:
        data?.whatAISees?.cellularity ||
        'Campo limitado para avaliação quantitativa.',

      erythrocytes:
        data?.whatAISees?.erythrocytes ||
        data?.morphologyAnalysis?.erythrocyteReview ||
        '',

      leukocytes:
        data?.whatAISees?.leukocytes ||
        data?.morphologyAnalysis?.leukocyteReview ||
        '',

      platelets:
        data?.whatAISees?.platelets ||
        data?.morphologyAnalysis?.plateletReview ||
        '',

      dominantFinding:
        data?.whatAISees?.dominantFinding ||
        data?.morphologyAnalysis?.summary ||
        '',

      unusualStructures:
        data?.whatAISees?.unusualStructures ||
        '',

      negativeFindings:
        data?.whatAISees?.negativeFindings ||
        data?.morphologyAnalysis?.absentFindings ||
        '',

      imageLimitations:
        data?.whatAISees?.imageLimitations ||
        'Análise limitada ao campo enviado.',

      freeNarrative:
        data?.whatAISees?.freeNarrative ||
        data?.morphologyAnalysis?.summary ||
        '',

      positiveFindings:
        uniquePositiveFindings || [],

      negativeFindingsStructured:
        uniqueNegativeFindings || [],
    },

    patternRecognition: {

      erythrocytePattern:
        data?.patternRecognition?.erythrocytePattern || "",

      leukocytePattern:
        reactiveLymphoidPattern
          ? "Reactive lymphoid activation"
          : (data?.patternRecognition?.leukocytePattern || ""),

      plateletPattern:
        data?.patternRecognition?.plateletPattern || "",

      artifactPattern:
        data?.patternRecognition?.artifactPattern || "",

      overallPattern:
        reactiveLymphoidPattern
          ? "Reactive lymphoid activation / atypical mononuclear population"
          : (data?.patternRecognition?.overallPattern || ""),
    },

    interpretiveSynthesis:
      reactiveLymphoidPattern
        ? "Há achados morfológicos que impedem a classificação como normal. O padrão linfoide observado sugere ativação imunológica reacional, com hipótese educacional de síndrome mononucleósica, dependente de correlação clínica, hemograma e sorologias."
        : (data?.interpretiveSynthesis || ""),

    clinicalMeaning:
      reactiveLymphoidPattern
        ? "Achado educacionalmente relevante: padrão linfoide reacional/atípico."
        : (data?.clinicalMeaning || ""),

    hematologicReasoning:
      data?.hematologicReasoning || "",

    educationalImpact:
      data?.educationalImpact || "",

    erythrocyteFindings:
      typeof data.erythrocyteFindings === "object" &&
      data.erythrocyteFindings !== null
        ? data.erythrocyteFindings
        : {},

    leukocyteFindings:
      typeof data.leukocyteFindings === "object" &&
      data.leukocyteFindings !== null
        ? data.leukocyteFindings
        : {},

    plateletFindings:
      typeof data.plateletFindings === "object" &&
      data.plateletFindings !== null
        ? data.plateletFindings
        : {},

    blastSuspicion:
      typeof data.blastSuspicion === "object" &&
      data.blastSuspicion !== null
        ? data.blastSuspicion
        : {},

    overallAssessment:
      typeof data.overallAssessment === "object" &&
      data.overallAssessment !== null
        ? {
            ...data.overallAssessment,
            requiresHumanReview:
              normalityBlocked ||
              data.overallAssessment?.requiresHumanReview === true,

            riskCategory:
              reactiveLymphoidPattern
                ? "CLASS_2_ATYPICAL_POPULATION"
                : data.overallAssessment?.riskCategory,
          }
        : {
            requiresHumanReview: normalityBlocked,
            riskCategory:
              normalityBlocked
                ? "CLASS_2_ATYPICAL_POPULATION"
                : "CLASS_0_NORMAL",
          },

    structuredReport:
      typeof data.structuredReport === "object" &&
      data.structuredReport !== null
        ? data.structuredReport
        : {},

    differentialDiagnosis:
      reactiveLymphoidPattern
        ? [
            "Síndrome mononucleósica",
            "Mononucleose infecciosa por EBV",
            "Infecção por CMV",
            "Resposta imunológica reacional",
            ...(
              Array.isArray(data.differentialDiagnosis)
                ? data.differentialDiagnosis
                : []
            ),
          ]
        : (
            Array.isArray(data.differentialDiagnosis)
              ? data.differentialDiagnosis
              : []
          ),

    criticalFlags:
      Array.isArray(data.criticalFlags)
        ? data.criticalFlags
        : [],

    analysisSource:
      data.analysisSource || "ai_visual",

    manualCounts:
      typeof data.manualCounts === "object" &&
      data.manualCounts !== null
        ? data.manualCounts
        : {},

    aiDetectedCounts:
      typeof data.aiDetectedCounts === "object" &&
      data.aiDetectedCounts !== null
        ? data.aiDetectedCounts
        : {},

    hybridValidation:
      typeof data.hybridValidation === "object" &&
      data.hybridValidation !== null
        ? data.hybridValidation
        : {},

    rawResponse: data,
  };
}
// ============================================================================
// USER
// ============================================================================

function getUser(req) {

  const userId =
    req.headers["x-user-id"] ||
    "anonymous_device";

  if (!users.has(userId)) {

    users.set(userId, {

      totalUses: 0,

      plan: "hospital",

      educationalOnly: true,
    });
  }

  return {

    userId,

    data:
      users.get(userId),
  };
}

// ============================================================================
// TEXT NORMALIZER
// ============================================================================

function normalizeSemanticText(
  value = "",
) {

  return String(value)

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      "",
    )

    .replace(
      /[^a-zA-Z0-9\s]/g,
      " ",
    )

    .replace(
      /\s+/g,
      " ",
    )

    .toLowerCase()

    .trim();
}

// ============================================================================
// ANALYSIS SOURCE
// ============================================================================

function normalizeAnalysisSource(
  source = "",
) {

  const normalized =
    String(source)
      .toLowerCase()
      .trim();

  if (
    normalized === "manual"
  ) {

    return "manual";
  }

  if (
    normalized === "hybrid"
  ) {

    return "hybrid";
  }

  return "ai_visual";
}

function buildSafeManualMetadata({

  analysisSource,

  manualCounts = {},
}) {

  const hasManualData =
    Object.keys(
      manualCounts,
    ).length > 0;

  return {

    analysisSource,

    manualMode:
      analysisSource ===
      "manual",

    hybridMode:
      analysisSource ===
      "hybrid",

    aiVisualMode:
      analysisSource ===
      "ai_visual",

    hasManualData,
  };
}

// ============================================================================
// SEMANTIC EXTRACTION
// ============================================================================

function buildSemanticText(
  parsed = {},
) {

  const blocks = [

    parsed.summary,

    parsed.observations,

    parsed.riskLevel,

    parsed.morphologicInterpretation,

    parsed.hematologicCorrelation,

    parsed.educationalConclusion,

    parsed.plainTextReport,

    parsed.mainImpression,

    parsed.morphologySummary,

    parsed.structuredReport
      ?.morphologySummary,

    parsed.structuredReport
      ?.educationalConclusion,

    parsed.structuredReport
      ?.plainTextReport,

    parsed.overallAssessment
      ?.mainImpression,

    parsed.overallAssessment
      ?.recommendedCorrelation,

    parsed.imageQuality
      ?.limitations,

    parsed.imageQuality
      ?.artifacts,

    parsed.erythrocyteFindings
      ?.summary,

    parsed.erythrocyteFindings
      ?.findings,

    parsed.erythrocyteFindings
      ?.suspectedPatterns,

    parsed.leukocyteFindings
      ?.summary,

    parsed.leukocyteFindings
      ?.findings,

    parsed.leukocyteFindings
      ?.leftShift,

    parsed.leukocyteFindings
      ?.toxicChanges,

    parsed.leukocyteFindings
      ?.dysplasiaSuspicion,

    parsed.blastSuspicion
      ?.morphologicReasons,

    parsed.blastSuspicion
      ?.againstBlast,

    parsed.plateletFindings
      ?.summary,

    parsed.plateletFindings
      ?.findings,

    parsed.differentialDiagnosis,

    parsed.criticalFlags,

    parsed.educationalPearls,

    parsed.morphologies,

    parsed.alerts,

    parsed.heatmapRegions,

    parsed.rawResponseText,

    parsed.analise,
  ];

  return normalizeSemanticText(

    blocks

      .flat(Infinity)

      .filter(Boolean)

      .map((item) => {

        if (
          typeof item ===
          "string"
        ) {

          return item;
        }

        return JSON.stringify(
          item,
        );
      })

      .join(" "),
  );
}

// ============================================================================
// HEMATOLOGY PIPELINE PROMPT V7
// CELLCOUNT ELITE HOSPITAL AI
// ============================================================================

const hospitalPrompt = `

VOCÊ É UMA IA HEMATOLÓGICA HOSPITALAR DE ALTA COMPLEXIDADE.

ESPECIALIZAÇÕES:
- hematologia clínica
- hematopatologia
- morfologia hematológica
- citologia hematológica
- microscopia digital
- sangue periférico
- medula óssea
- revisão microscópica educacional
- análise morfológica avançada

MISSÃO:
Executar análise hematológica EDUCACIONAL altamente segura, estruturada e semelhante à revisão microscópica hospitalar real.

====================================================================
REGRAS ABSOLUTAS
====================================================================

NUNCA:

- emitir diagnóstico definitivo
- confirmar leucemia
- confirmar malignidade
- afirmar neoplasia hematológica
- afirmar blastose verdadeira
- substituir hematologista
- inventar células
- inferir estruturas não visualizadas
- ignorar limitações técnicas
- extrapolar achados
- gerar linguagem conclusiva
- utilizar linguagem alarmista
- interpretar contagem manual como evidência visual

PROIBIDO USAR:

- “diagnóstico de”
- “confirmado”
- “compatível definitivamente”
- “leucemia”
- “neoplasia confirmada”
- “maligno”
- “blastos confirmados”

UTILIZAR SOMENTE:

- suspeita morfológica
- hipótese educacional
- requer correlação
- sugestivo de
- achado não conclusivo
- possível presença
- baixa evidência visual
- moderada evidência visual
- revisão microscópica recomendada

====================================================================
REGRA MAIS IMPORTANTE
====================================================================

PRIMEIRO:
DESCREVER O QUE ESTÁ VISUALMENTE PRESENTE.

DEPOIS:
VALIDAR MORFOLOGIA.

DEPOIS:
CALCULAR EVIDÊNCIA.

DEPOIS:
VALIDAR SEGURANÇA.

SOMENTE NO FINAL:
GERAR CORRELAÇÃO EDUCACIONAL.

NUNCA INTERPRETAR ANTES DA ANÁLISE VISUAL.

====================================================================
MODO IA VISUAL ISOLADA — PADRÃO ESPECIALISTA
====================================================================

Quando analysisSource === "ai_visual":

Atuar como hematologista especialista em microscopia.

NÃO informar apenas achados simples.

Para cada alteração observada explicar:

1. O QUE FOI OBSERVADO
- tipo celular predominante
- maturação nuclear
- cromatina
- citoplasma
- granulações
- alterações eritrocitárias
- plaquetas

2. SIGNIFICADO MORFOLÓGICO
Explicar o possível significado biológico.

Usar:
"pode estar associado"
"pode ser observado em"
"é compatível morfologicamente com"

Nunca:
"diagnostica"
"confirma"

3. RACIOCÍNIO HEMATOLÓGICO

Explicar:
- por que aquele padrão ocorre
- quais mecanismos celulares podem justificar
- quais achados aumentariam suspeição
- quais achados tranquilizam

4. CORRELAÇÕES POSSÍVEIS

Gerar correlações baseadas na literatura:

Exemplos:
neutrofilia madura:
- resposta inflamatória
- infecção bacteriana
- estresse fisiológico
- corticoterapia

linfócitos reacionais:
- resposta viral
- ativação imunológica

blastos:
- necessidade de investigação hematológica urgente

anisocitose:
- deficiência nutricional
- regeneração eritroide
- alterações eritrocitárias diversas

Sempre deixar claro:
"Sugestões educacionais, dependentes de confirmação clínica e laboratorial."

5. PROFUNDIDADE

Cada campo textual deve conter no mínimo:
500 caracteres.

Evitar respostas genéricas.

====================================================================
MODO MANUAL
====================================================================

SE analysisSource === "manual":

- NÃO assumir presença real de blastos
- NÃO interpretar como leucemia
- NÃO concluir proliferação
- reduzir agressividade diagnóstica
- informar que contagem foi digitada manualmente
- recomendar revisão microscópica real

SE analysisSource === "hybrid":

- diferenciar claramente:
  - achado visual IA
  - contagem manual
  - correlação híbrida

====================================================================
PIPELINE OBRIGATÓRIO
====================================================================

ETAPA 1 — IMAGE QUALITY

Avaliar:

- foco
- nitidez
- coloração
- iluminação
- artefatos
- compressão
- sobreposição celular
- resolução
- distorções
- áreas inadequadas

====================================================================

ETAPA 2 — VISUAL EXTRACTION

Descrever SOMENTE estruturas VISUALMENTE observadas:

- neutrófilos
- linfócitos
- monócitos
- eosinófilos
- basófilos
- blastos suspeitos
- células imaturas
- eritroblastos
- plaquetas
- agregados
- artefatos

NÃO interpretar ainda.

====================================================================

ETAPA 3 — ADVANCED MORPHOLOGY ANALYSIS V8

====================================================================

OBJETIVO

Executar análise morfológica hematológica equivalente a revisão realizada por hematologista, hematopatologista e especialista em microscopia digital.

PRIMEIRO DESCREVER.

DEPOIS INTERPRETAR.

NUNCA INTERPRETAR ANTES DA DESCRIÇÃO.

====================================================================

VISÃO GLOBAL DO CAMPO

Descrever obrigatoriamente:

- celularidade observada
- distribuição celular
- qualidade do esfregaço
- qualidade da coloração
- nitidez
- preservação celular
- artefatos presentes
- representatividade do campo
- limitações técnicas

====================================================================

SÉRIE ERITROCITÁRIA

Avaliar:

TAMANHO

- normocitose
- microcitose
- macrocitose
- dimorfismo eritrocitário

COLORAÇÃO

- normocromia
- hipocromia
- policromasia

DISTRIBUIÇÃO

- anisocitose
- poiquilocitose

PESQUISAR OBRIGATORIAMENTE

- esquizócitos
- codócitos
- drepanócitos
- dacriócitos
- acantócitos
- equinócitos
- eliptócitos
- ovalócitos
- estomatócitos
- esferócitos
- queratócitos
- hemácias em lápis
- rouleaux
- aglutinação eritrocitária
- corpos de Howell-Jolly
- pontilhado basofílico
- anéis de Cabot
- inclusões eritrocitárias

Descrever presença OU ausência.

====================================================================

SÉRIE LEUCOCITÁRIA

Avaliar:

- heterogeneidade celular
- monomorfismo celular
- população predominante

NEUTRÓFILOS

Avaliar:

- segmentação
- hipersegmentação
- hipossegmentação
- granulações tóxicas
- vacuolização
- corpúsculos de Döhle

LINFÓCITOS

Avaliar:

- maturação
- reatividade
- atipias

MONÓCITOS

Avaliar:

- morfologia
- maturação

EOSINÓFILOS

Avaliar:

- quantidade
- morfologia

BASÓFILOS

Avaliar:

- quantidade
- morfologia

PESQUISAR OBRIGATORIAMENTE

- blastos
- mieloblastos
- monoblastos
- promielócitos
- plasmócitos
- plasmoblastos
- imunoblastos
- eritroblastos
- células pilosas
- células plasmocitoides
- células linfomatosas
- células atípicas

====================================================================

ANÁLISE NUCLEAR

Descrever:

- relação núcleo/citoplasma
- padrão de cromatina
- nucléolos
- irregularidades nucleares
- lobulação
- excentricidade nuclear
- maturação nuclear

====================================================================

ANÁLISE CITOPLASMÁTICA

Descrever:

- basofilia
- granulações
- vacuolização
- halo perinuclear
- inclusões
- projeções citoplasmáticas

====================================================================

SÉRIE PLAQUETÁRIA

Avaliar:

- quantidade aparente
- agregação
- gigantismo
- anisoplaquetose
- alterações morfológicas

====================================================================

ACHADOS IMPORTANTES NÃO IDENTIFICADOS

Criar obrigatoriamente seção específica contendo:

- ausência de bastonetes de Auer
- ausência de blastos inequívocos
- ausência de esquizócitos
- ausência de rouleaux
- ausência de displasia marcante

Somente quando realmente ausentes.

====================================================================

INTERPRETAÇÃO BIOLÓGICA

Explicar:

- significado dos achados
- possíveis mecanismos celulares envolvidos
- relevância hematológica

Utilizar:

- pode estar associado a
- pode ser observado em
- pode sugerir

NUNCA:

- confirma
- diagnostica
- representa definitivamente

====================================================================

DIAGNÓSTICO DIFERENCIAL EDUCACIONAL

Construir ranking:

1. hipótese morfológica mais provável
2. hipótese intermediária
3. hipótese menos provável

Justificar cada uma.

Utilizar exclusivamente linguagem educacional.

====================================================================

IMPRESSÃO MORFOLÓGICA

Produzir resumo integrado semelhante a revisão hematopatológica.

Obrigatoriamente incluir:

- principais achados observados
- principais achados ausentes
- relevância morfológica
- limitações da imagem

Mínimo 1200 caracteres.

====================================================================

PROFUNDIDADE OBRIGATÓRIA

Responder como:

- hematologista
- hematopatologista
- professor universitário
- pesquisador PhD
- especialista em morfologia hematológica

Evitar respostas superficiais.

Descrever:

O QUE ESTÁ PRESENTE

O QUE ESTÁ AUSENTE

O SIGNIFICADO DOS ACHADOS

AS LIMITAÇÕES DA IMAGEM

========================================================================================================================================

====================================================================

ETAPA 4 — VISUAL EVIDENCE ENGINE

OBRIGATÓRIO:

Calcular:

- visualEvidenceScore (0-100)
- evidenceLevel
- morphologyConfidence
- imageReliability
- artifactInterference

CLASSIFICAÇÃO:

0-39:
baixa evidência visual

40-69:
moderada evidência visual

70-100:
alta evidência visual

====================================================================

ETAPA 5 — BLAST VALIDATION

CRÍTICO:

NUNCA afirmar leucemia.

SE blastos suspeitos:

VALIDAR:

- cromatina
- nucléolos
- relação N/C
- padrão citoplasmático
- qualidade da imagem
- artefatos
- sobreposição celular

SE visualEvidenceScore < 70:

PROIBIDO:
- usar “leucemia”
- usar “blastose”
- usar “malignidade”

SUBSTITUIR POR:

- células imaturas suspeitas
- achado inconclusivo
- suspeita morfológica limitada
- revisão hematológica recomendada

====================================================================

ETAPA 6 — SAFETY VALIDATION

VALIDAR:

- contradições internas
- exagero diagnóstico
- inferências indevidas
- limitações técnicas
- qualidade insuficiente
- inconsistência morfológica

SE inconsistência detectada:

REDUZIR:
- confidence
- agressividade diagnóstica

====================================================================

ETAPA 7 — CONSENSUS ENGINE

Comparar:

- visual findings
- morphology analysis
- evidence engine
- safety validation

VALIDAR:

- coerência hematológica
- coerência visual
- coerência morfológica
- coerência de confiança

====================================================================

ETAPA 8 — CLINICAL CORRELATION

SOMENTE AGORA:

Gerar:
- hipóteses educacionais
- possibilidades morfológicas
- recomendações
- necessidade de revisão

NUNCA:
- diagnóstico definitivo
- confirmação clínica

====================================================================
IMPRESSÃO HEMATOLÓGICA EDUCACIONAL — overallAssessment.mainImpression
====================================================================

Gerar obrigatoriamente overallAssessment.mainImpression.

Criar uma conclusão educacional final semelhante a uma revisão hematológica.

Deve conter:

1. RESUMO MORFOLÓGICO
- principais células observadas
- padrão predominante
- alterações celulares relevantes

2. INTERPRETAÇÃO EDUCACIONAL
Explicar:
- possível significado dos achados
- contexto hematológico provável
- relevância da alteração

Usar:
"pode sugerir"
"pode estar associado"
"deve ser correlacionado"

3. LIMITAÇÕES

Informar:
- análise baseada apenas nas imagens enviadas
- necessidade de hemograma completo
- revisão microscópica profissional quando indicada

NUNCA:
- fechar diagnóstico
- substituir laudo laboratorial
- afirmar doença

Texto mínimo:
400 caracteres.

====================================================================
SIGNIFICADO DOS ACHADOS — clinicalMeaning
====================================================================

Gerar obrigatoriamente o campo clinicalMeaning.

Objetivo:
explicar o significado prático dos achados observados.

Usar linguagem segura:
- "pode ser sugestivo de"
- "pode estar associado a"
- "requer correlação com"
- "não permite diagnóstico isolado"

Nunca afirmar diagnóstico.

Sempre correlacionar com:
- hemograma completo
- dados clínicos
- revisão microscópica profissional

====================================================================
RESPOSTA OBRIGATÓRIA
====================================================================

RESPONDER SOMENTE JSON VÁLIDO.

ESTRUTURA OBRIGATÓRIA:

{
  "imageQuality": {},
  "visualExtraction": {},

  "morphologyAnalysis": {
    "overview": "",
    "erythrocyteReview": "",
    "leukocyteReview": "",
    "plateletReview": "",
    "absentFindings": "",
    "biologicalInterpretation": "",
    "differentialDiagnosis": "",
    "summary": ""
  },

  "patternRecognition": {
    "erythrocytePattern": "",
    "leukocytePattern": "",
    "plateletPattern": "",
    "artifactPattern": "",
    "overallPattern": ""
  },

  "interpretiveSynthesis":
  "Texto acadêmico avançado obrigatório. Descrever em detalhes os achados morfológicos observados, linhagens celulares envolvidas, maturação nuclear, características citoplasmáticas e interpretação hematológica educacional.",

  "clinicalMeaning":
  "Texto obrigatório com no mínimo 500 caracteres. Explicar o significado dos achados encontrados, possíveis mecanismos fisiológicos associados e correlação clínico-laboratorial necessária. Nunca afirmar diagnóstico.",

  "hematologicReasoning":
  "Texto obrigatório com no mínimo 500 caracteres. Explicar raciocínio hematológico especialista considerando morfologia celular, maturação, alterações reacionais, sinais de alerta e limitações da imagem.",

  "educationalImpact":
  "Texto obrigatório explicando valor educacional, limitações e quais exames ou dados complementares poderiam auxiliar.",

  "visualEvidence": {},
  "confidenceAnalysis": {},
  "safetyValidation": {},
  "consensusAnalysis": {},
  "clinicalCorrelation": {},
  "erythrocyteFindings": {},
  "leukocyteFindings": {},
  "plateletFindings": {},
  "blastSuspicion": {},
  "overallAssessment": {},
  "structuredReport": {},
  "criticalFlags": [],
  "educationalPearls": [],
  "limitations": [],
  "recommendedCorrelation": [],
  "heatmapRegions": []
}

====================================================================
ESTILO
====================================================================

Utilizar:
- linguagem hospitalar
- linguagem acadêmica
- terminologia hematológica real
- descrição objetiva
- segurança clínica máxima

====================================================================
PRINCÍPIO FUNDAMENTAL
====================================================================

NUNCA CONCLUIR ALÉM DA EVIDÊNCIA VISUAL DISPONÍVEL.

PRIORIZE SEGURANÇA CLÍNICA SOBRE SENSACIONALISMO.

`;


// ============================================================================
// CI-001B — SPECIMEN GATE & BONE MARROW ROUTING
// ============================================================================

const SPECIMEN_TYPES = new Set([
  "PERIPHERAL_BLOOD",
  "BONE_MARROW_ASPIRATE",
  "BONE_MARROW_BIOPSY",
  "HEMODILUTED_BONE_MARROW",
  "INADEQUATE",
  "INDETERMINATE",
]);

const SPECIMEN_ALLOWED_STATUSES = new Set([
  "accepted",
  "reviewRequired",
]);

function clampConfidence(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
}

function normalizeSpecimenType(value = "") {
  const normalized = String(value).trim().toUpperCase();
  return SPECIMEN_TYPES.has(normalized)
    ? normalized
    : "INDETERMINATE";
}

function parseSpecimenDecision(req) {
  try {
    const raw = req.body?.specimenDecision;
    if (!raw) return null;
    return typeof raw === "string"
      ? JSON.parse(raw)
      : raw;
  } catch {
    return null;
  }
}

function validateSpecimenGate(req, { allowManualWithoutSpecimen = true } = {}) {
  const analysisSource = normalizeAnalysisSource(req.body?.analysisSource);

  if (allowManualWithoutSpecimen && analysisSource === "manual") {
    return {
      valid: true,
      analysisSource,
      specimenType: "INDETERMINATE",
      analysisType: "manual",
      decision: null,
      reviewRequired: true,
    };
  }

  const decision = parseSpecimenDecision(req);

  if (!decision || typeof decision !== "object") {
    return {
      valid: false,
      status: 422,
      error:
        "SpecimenDecision obrigatório antes da análise clínica de imagens.",
    };
  }

  const status = String(
    decision.status ||
    req.body?.specimenDecisionStatus ||
    "",
  ).trim();

  if (!SPECIMEN_ALLOWED_STATUSES.has(status)) {
    return {
      valid: false,
      status: 422,
      error:
        "A decisão do tipo de material bloqueou o pipeline clínico.",
    };
  }

  const specimenType = normalizeSpecimenType(
    decision.effectiveType ||
    req.body?.specimenType,
  );

  if (
    specimenType === "INADEQUATE" ||
    specimenType === "INDETERMINATE"
  ) {
    return {
      valid: false,
      status: 422,
      error:
        "Material inadequado ou indeterminado não pode seguir para interpretação clínica.",
    };
  }

  const analysisType =
    specimenType === "BONE_MARROW_ASPIRATE" ||
    specimenType === "HEMODILUTED_BONE_MARROW" ||
    specimenType === "BONE_MARROW_BIOPSY"
      ? "bone_marrow"
      : "peripheral_blood";

  return {
    valid: true,
    analysisSource,
    specimenType,
    analysisType,
    decision,
    reviewRequired: status === "reviewRequired",
  };
}

function buildSpecimenContext({
  specimenType,
  decision,
  reviewRequired,
}) {
  const confidence =
    clampConfidence(
      decision?.classification?.confidence ??
      decision?.confidence ??
      0,
    );

  return `
CI-001B — CONTEXTO OBRIGATÓRIO DO ESPÉCIME

SPECIMEN TYPE: ${specimenType}
SPECIMEN CONFIDENCE: ${confidence}
SPECIMEN DECISION STATUS: ${decision?.status || "unknown"}
REVIEW REQUIRED: ${reviewRequired === true}

REGRAS ABSOLUTAS:
- Utilize exclusivamente o motor correspondente ao tipo de material validado.
- Nunca reinterpretar sangue periférico como medula óssea.
- Nunca interpretar medula óssea como esfregaço periférico.
- Não ocultar conflito, incerteza ou necessidade de revisão.
- Se REVIEW REQUIRED for true, declarar revisão humana obrigatória.

REGRAS PARA MEDULA ÓSSEA:
- Avaliar representatividade antes de inferir celularidade.
- Ausência de espículas em uma imagem não exclui origem medular.
- Campo único não permite estimar celularidade global com segurança.
- Avaliar separadamente séries mieloide, eritroide e megacariocítica.
- Avaliar plasmócitos, células imaturas/blásticas, displasia e infiltração.
- Não usar como conclusão global:
  "esfregaço de sangue periférico normal",
  "hemácias normocíticas e normocrômicas",
  "plaquetas em quantidade adequada".
- Não afirmar ausência global de blastos por imagem isolada.
- Medula hemodiluída deve manter alerta explícito de hemodiluição.
`;
}

function normalizeSpecimenClassification(raw = {}) {
  const predictedType = normalizeSpecimenType(raw.predictedType);
  const alternativeType = normalizeSpecimenType(raw.alternativeType);

  return {
    predictedType,
    confidence: clampConfidence(raw.confidence),
    alternativeType,
    alternativeConfidence: clampConfidence(
      raw.alternativeConfidence,
    ),
    modelVersion:
      String(raw.modelVersion || "specimen-classifier-v1"),
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence.slice(0, 12).map((item) => ({
          kind: String(item?.kind || "other"),
          description: String(item?.description || ""),
          supports: normalizeSpecimenType(
            item?.supports || predictedType,
          ),
          weight: clampConfidence(item?.weight),
          confidence: clampConfidence(item?.confidence),
        }))
      : [],
  };
}

function applySpecimenMetadata(result = {}, specimenGate = {}) {
  const output = {
    ...result,
    specimenType:
      specimenGate.specimenType || "INDETERMINATE",
    specimenDecision:
      specimenGate.decision || {},
    specimenClassification:
      specimenGate.decision?.classification || {},
    specimenRouting: {
      analysisType:
        specimenGate.analysisType || "unknown",
      reviewRequired:
        specimenGate.reviewRequired === true,
      version: "CI-001B-v1",
    },
  };

  if (
    specimenGate.specimenType ===
    "HEMODILUTED_BONE_MARROW"
  ) {
    output.normalityBlocked = true;
    output.requiresHumanReview = true;
    output.blockNormalReason = [
      ...new Set([
        ...(Array.isArray(output.blockNormalReason)
          ? output.blockNormalReason
          : []),
        "Amostra medular hemodiluída; representatividade e celularidade global limitadas.",
      ]),
    ];
    output.marrowLimitations = [
      ...new Set([
        ...(Array.isArray(output.marrowLimitations)
          ? output.marrowLimitations
          : []),
        "Hemodiluição pode reduzir a representatividade dos compartimentos medulares.",
      ]),
    ];
  }

  return output;
}

function applyBoneMarrowLanguageGuard(result = {}) {
  if (!result || typeof result !== "object") return result;

  const forbidden = [
    /esfregaço de sangue periférico normal/gi,
    /esfregaço sanguíneo normal/gi,
    /hemácias normocíticas e normocrômicas/gi,
    /plaquetas (presentes )?em quantidade adequada/gi,
    /morfologia periférica preservada/gi,
  ];

  const replacement =
    "A imagem medular deve ser interpretada conforme representatividade, qualidade, distribuição das linhagens e limitações do campo.";

  const sanitize = (value) => {
    if (typeof value !== "string") return value;
    let output = value;
    for (const pattern of forbidden) {
      output = output.replace(pattern, replacement);
    }
    return output;
  };

  const cloned = JSON.parse(JSON.stringify(result));

  const walk = (value) => {
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) {
        value[key] = walk(value[key]);
      }
      return value;
    }
    return sanitize(value);
  };

  return walk(cloned);
}

// ============================================================================
// BE-FIX-005.21 — VME LENGTH-EXHAUSTION RECOVERY & STRUCTURED OUTPUT BUDGET
// ============================================================================
const VME_LENGTH_EXHAUSTION_RECOVERY_VERSION = "BE-FIX-005.21";
const VME_REASONING_COMPATIBILITY_VERSION = "BE-FIX-005.21.1";
const VME_EFFECTIVE_REASONING_ENFORCEMENT_VERSION =
  VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION;

const FINAL_RESULT_INITIALIZATION_ORDER_HOTFIX_VERSION =
  "BE-FIX-005.47.1";

// ============================================================================
// OPENAI ANALYSIS
// ============================================================================

// ============================================================================
// OPENAI MULTI-STAGE ANALYSIS V7
// ============================================================================

async function analyzeWithOpenAI({
  images,
  analysisSource = "ai_visual",
  manualCounts = {},
  analysisType = "peripheral_blood",
  specimenType = "PERIPHERAL_BLOOD",
  specimenDecision = null,
  specimenReviewRequired = false,
}) {
  const requestId = generateRequestId();
  const pipelineStart = performance.now();

  try {
    const imageStart = performance.now();
    const imagesPayload = [];
    const imageMetadata = [];

    // BE/FE-FIX-004 — process independent microscopy images concurrently.
    // This removes avoidable sequential preprocessing latency while preserving
    // the exact same enhancement/payload behavior for each image.
    const enhancedImages = await Promise.all(
      images.map((file) => enhanceMicroscopyImage(file.buffer)),
    );

    for (const enhanced of enhancedImages) {
      if (enhanced?.metadata) {
        imageMetadata.push(enhanced.metadata);
      }

      const payload = buildGPTImagePayload(enhanced, "image/jpeg", {
        maxTiles:
          analysisType === "bone_marrow"
            ? Number(process.env.GPT_IMAGE_TILES || 1)
            : Number(process.env.VME_PRIMARY_TILES || 0),
        includeCenterCrop:
          analysisType === "bone_marrow"
            ? true
            : String(process.env.VME_INCLUDE_CENTER_CROP || "false")
                .toLowerCase() === "true",
        detail:
          analysisType === "bone_marrow"
            ? String(process.env.GPT_IMAGE_DETAIL || "auto")
            : String(process.env.VME_IMAGE_DETAIL || "high"),
      });

      imagesPayload.push(...payload);
    }

    const imageTiming = logStep(requestId, "IMAGE ENHANCEMENT TURBO", imageStart);

    const manualMetadata = buildSafeManualMetadata({
      analysisSource,
      manualCounts,
    });

    const contextualPrompt = `
ANALYSIS SOURCE: ${analysisSource}
MANUAL COUNTS: ${JSON.stringify(manualCounts)}

${buildSpecimenContext({
  specimenType,
  decision: specimenDecision,
  reviewRequired: specimenReviewRequired,
})}

MODOS DE ANÁLISE:

ai_visual:
- Super IA independente.
- Avaliar exclusivamente a imagem enviada.
- Não exigir contagem diferencial.
- Não gerar erro por ausência de valores manuais.
- Focar em morfologia celular e qualidade da lâmina.

hybrid:
- Super IA + calculadora diferencial.
- Integrar achados visuais com os valores informados.
- Diferenciar claramente:
  achado observado pela IA
  versus
  dado informado pelo usuário.

manual:
- Dados inseridos pelo usuário.
- Não assumir que representam achados visuais.

REGRA PRINCIPAL:
A calculadora diferencial é opcional.
A Super IA deve funcionar completamente sem ela.

Execute o pipeline completo em UMA resposta JSON única, preservando:
imageQuality, visualExtraction, whatAISees, positiveFindings, negativeFindingsStructured, executiveSummary, morphologyAnalysis, visualEvidence,
erythrocyteFindings, leukocyteFindings, plateletFindings, blastSuspicion,
overallAssessment, structuredReport, possibleClinicalCorrelations,
associatedEducationalHypotheses, clinicalCorrelationNeeds, clinicalMeaning,
educationalImpact, interpretiveSynthesis, hematologicReasoning,
visualMorphologyDescription, cellMorphology, populationPatternAnalysis,
negativeFindings.
`;

const compactHospitalPrompt = `
Você é uma IA hematológica educacional especializada em morfologia de sangue periférico.

Você deve raciocinar como um hematologista com experiência em hematologia clínica, citomorfologia e hematopatologia.

Sua primeira responsabilidade NÃO é classificar.

Sua primeira responsabilidade é OBSERVAR.

Antes de interpretar qualquer achado:

1. Descreva o campo microscópico.
2. Descreva a celularidade.
3. Descreva a população predominante.
4. Descreva heterogeneidade ou monomorfismo.
5. Descreva características nucleares.
6. Descreva características citoplasmáticas.
7. Descreva o fundo eritrocitário.
8. Descreva a representatividade plaquetária.

Somente depois realize interpretação hematológica.

Nunca iniciar a análise pela conclusão.

Sempre iniciar pela observação morfológica.

Responda SOMENTE JSON válido em português do Brasil.

    Nunca emitir diagnóstico definitivo.
    Nunca confirmar leucemia, linfoma, neoplasia ou malignidade.
    Usar linguagem segura: possível, sugestivo, pode estar associado, requer correlação.

    Nunca chamar de normal se houver:
    linfócito reativo, linfócito atípico, célula mononuclear grande, célula imatura, plasmocitoide, plasmócito, plasmoblasto, monomorfismo ou suspeita blástica.

    Se houver sinal reacional/atípico:
    normalityBlocked=true.

    Se houver apenas célula mononuclear/linfócito atípico isolado:
    morphologicRiskClass="CLASS_1_LIMITED_FIELD_ATYPICAL_CELL".
    reactiveLymphocytePattern="isolated_cell".
    Não usar termos populacionais como linfocitose, ativação linfoide populacional ou padrão mononucleósico.

    Se houver população linfoide reacional sustentada:
    morphologicRiskClass="CLASS_2_ATYPICAL_POPULATION".
    reactiveLymphocytePattern="population_pattern".

    Se houver suspeita blástica:
    morphologicRiskClass="CLASS_4_BLAST_SUSPICION".

    CLASSIFICAÇÃO DE LINFÓCITOS REATIVOS / ATÍPICOS:

    1. REACTIVE_LYMPHOCYTE_TYPICAL:
    citoplasma amplo, basofilia periférica, bordas irregulares, moldagem às hemácias, núcleo maduro, sem nucléolo evidente.

    2. DOWNEY_TYPE_I:
    linfócito pequeno a médio, citoplasma discretamente basofílico, núcleo relativamente maduro, reatividade discreta.

    3. DOWNEY_TYPE_II:
    célula grande, citoplasma abundante, basofilia intensa, contorno citoplasmático irregular, moldagem às hemácias, núcleo oval ou irregular.

    4. DOWNEY_TYPE_III_IMMUNOBLASTOID:
    célula grande, citoplasma basofílico, núcleo grande, cromatina mais frouxa, nucléolo possível. Pode simular blasto, mas não confirmar blasto sem critérios inequívocos.

    5. PLASMACYTOID_LYMPHOCYTE:
    citoplasma intensamente basofílico, núcleo excêntrico, halo perinuclear possível, aspecto intermediário entre linfócito e plasmócito.

    6. ATYPICAL_LYMPHOCYTE_UNCLASSIFIED:
    célula mononuclear atípica sem elementos suficientes para subtipo seguro, especialmente em campo limitado.

    DIFERENCIAÇÃO CONTRA BLASTO — REGRA DE SEGURANÇA:
    Avaliar explicitamente cada célula mononuclear atípica contra blasto/blastoide.
    Usar blastEvidenceState com exatamente um destes valores:
    OBSERVED, SUSPICIOUS_INDETERMINATE, NOT_OBSERVED_IN_EVALUABLE_FIELD, NOT_ASSESSABLE.
    OBSERVED: morfologia blástica/blastoide diretamente sustentada.
    SUSPICIOUS_INDETERMINATE: há traços imaturos/blastoides ou a distinção entre linfócito reacional/atípico e blasto não é segura, inclusive quando cromatina, nucléolos, relação N:C ou maturação não são plenamente avaliáveis.
    NOT_OBSERVED_IN_EVALUABLE_FIELD: somente quando as células relevantes estão suficientemente avaliáveis e não há sinal blástico/blastoide nem dúvida morfológica pertinente.
    NOT_ASSESSABLE: qualidade/representatividade não permite pesquisa adequada.
    blastSuspicion=true para OBSERVED ou SUSPICIOUS_INDETERMINATE.
    Nunca converter dúvida blástica em blastSuspicion=false. Nunca usar ATYPICAL_LYMPHOCYTE_UNCLASSIFIED para apagar um diferencial blástico ainda aberto.

    Avaliar:
    1. Qualidade da imagem.

    DESCRIÇÃO MORFOLÓGICA OBRIGATÓRIA

    A IA deve produzir uma descrição semelhante à de um hematologista observando a lâmina.

    Responder obrigatoriamente:

    - Como o campo se apresenta globalmente.
    - Se há hipercelularidade ou hipocelularidade relativa.
    - Qual população domina o campo.
    - Se existe diversidade celular.
    - Se existe repetição de um mesmo tipo celular.
    - Se existe monomorfismo.
    - Se existe heterogeneidade.
    - Como se apresentam os núcleos.
    - Como se apresenta a cromatina.
    - Como se apresenta o citoplasma.
    - Como se apresenta o fundo eritrocitário.
    - Como se apresentam as plaquetas.

    Evitar conclusões precoces.

    Primeiro descrever.
    Depois interpretar.

    2. Eritrócitos: tamanho, cor, anisocitose, poiquilocitose, esquizócitos.
    3. Leucócitos: neutrófilos, linfócitos, monócitos, células reativas, atípicas ou imaturas.
    4. Plaquetas: quantidade, agregados, gigantismo.
    5. Elementos de alerta não evidenciados.

    ELEMENTOS DE ALERTA NÃO EVIDENCIADOS:
    Blastos inequívocos; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.

    Retorne obrigatoriamente JSON com:

    whatAISees contendo obrigatoriamente:
    - globalField
    - cellularity
    - erythrocytes
    - leukocytes
    - platelets
    - dominantFinding
    - unusualStructures
    - negativeFindings
    - imageLimitations
    - freeNarrative

    positiveFindings,
    negativeFindingsStructured,

    imageQuality,
    visualExtraction,

    fieldAdequacy contendo obrigatoriamente:
    - visibleLeukocytes: número aproximado de leucócitos/células nucleadas leucocitárias realmente visíveis no conjunto de imagens; não contar menções textuais
    - adequateForLeukocyteAnalysis: boolean
    - adequateForBlastScreening: boolean
    - adequateForPopulationAssessment: boolean; usar true somente quando houver representatividade visual suficiente
    - limitedField: boolean
    - limitationReason: string

    IMPORTANTE SOBRE REPRESENTATIVIDADE:
    Campo limitado não significa ausência de morfologia analisável. Descrever obrigatoriamente RBC/WBC/PLT e toda evidência positiva observável mesmo quando limitedField=true. A limitação deve reduzir inferências populacionais e impedir exclusões globais, nunca apagar achados visuais.

    CAMADA DE EVIDÊNCIA MORFOLÓGICA IMUTÁVEL — OBRIGATÓRIA

    Preencher observedMorphology ANTES de qualquer interpretação. Este objeto deve conter apenas descrição visual sustentada pela imagem e não pode ser substituído por frases genéricas de segurança:

    observedMorphology: {
      "globalField": "descrição objetiva do campo",
      "technicalQuality": "foco, iluminação, coloração, contraste, artefatos de aquisição/preparo",
      "representativity": "o que o campo permite ou não generalizar",
      "erythrocytes": {
        "description": "descrição detalhada das hemácias visíveis",
        "size": "tamanho e variação aparente",
        "chromia": "cromia aparente quando avaliável",
        "anisocytosis": "presente/ausente/não avaliável + justificativa",
        "poikilocytosis": "presente/ausente/não avaliável + justificativa",
        "specificForms": [],
        "artifactConsiderations": "distinguir alteração biológica de crenação, secagem, borda de esfregaço ou aquisição"
      },
      "leukocytes": {
        "description": "descrição detalhada dos elementos nucleados visíveis",
        "approximateVisibleCells": 0,
        "heterogeneity": "heterogêneo/monomórfico/indeterminado",
        "nuclearMorphology": "forma, segmentação, relação N:C",
        "chromatin": "condensada/intermediária/frouxa/indeterminada",
        "nucleoli": "visíveis/não evidentes/não avaliáveis",
        "cytoplasm": "volume, basofilia, granulação, vacuolização, bordas",
        "maturation": "madura/reativa/atípica/imaturo suspeito/indeterminada",
        "atypia": "descrição sem overcalling",
        "blastLikeFeatures": "critérios presentes e ausentes; não concluir blasto por tamanho isolado"
      },
      "platelets": {
        "description": "descrição das plaquetas/elementos púrpura visíveis",
        "distribution": "dispersas/agregadas/indeterminada",
        "size": "habitual/aumentada/indeterminada",
        "aggregates": "presentes/não evidentes/não avaliáveis"
      },
      "artifacts": [],
      "positiveEvidence": [],
      "uncertainty": []
    }

    CAMADA ACADÊMICA AVANÇADA — OBRIGATÓRIA

    Preencher academicInterpretation em nível de residência, especialização e pós-graduação, mantendo caráter educacional e não diagnóstico:

    academicInterpretation: {
      "morphologicSynthesis": "integração objetiva do que foi observado",
      "erythrocyteReasoning": "raciocínio morfológico eritrocitário e diferenciação de artefatos",
      "leukocyteReasoning": "raciocínio citomorfológico: tamanho relativo, N:C, cromatina, nucléolo, citoplasma, maturação e diferenciais",
      "plateletReasoning": "raciocínio plaquetário e limitações quantitativas",
      "differentialConsiderations": [],
      "pathophysiology": "explicação biológica/fisiopatológica apenas quando sustentada pelos achados",
      "teachingPoints": [],
      "confirmationNeeds": []
    }

    REGRAS PARA NÍVEL ACADÊMICO:
    - Não usar "campo limitado" como substituto de descrição morfológica.
    - Separar explicitamente observação, interpretação e representatividade.
    - Quando uma característica não puder ser avaliada, escrever "não avaliável" e explicar por quê.
    - Não inventar índices hematimétricos, contagens ou diagnósticos a partir da fotografia.
    - Diferenciar alteração provável de artefato de preparo/aquisição.
    - Para leucócitos, descrever primeiro cada padrão morfológico visual e só depois discutir diferenciais.
    - Para blastos, registrar critérios citomorfológicos presentes e ausentes; na ausência de conjunto convincente, não classificar como blasto.
    - Cada seção deve acrescentar conhecimento e evitar repetição textual.

    normalityBlocked,
    blockNormalReason,
    morphologicRiskClass,
    reactiveLymphocytePattern,
    findings,
    visualEvidence,

    morphologyAnalysis contendo obrigatoriamente:
    - visualMorphologyDescription
    - cellMorphology
    - populationPatternAnalysis
    - negativeFindings
    - overview
    - erythrocyteReview
    - leukocyteReview
    - plateletReview
    - biologicalInterpretation
    - differentialDiagnosis
    - summary

    patternRecognition,
    interpretiveSynthesis,
    clinicalMeaning,

    hematologicReasoning em 4 camadas:
    - whatISee
    - whatItResembles
    - whatICannotConfirm
    - finalInterpretation

    educationalImpact,
    overallAssessment,
    structuredReport.

    Quando houver linfócito reativo, linfócito atípico,
    célula mononuclear grande, célula plasmocitoide
    ou imunoblastoide, preencher visualEvidence com:

    {
      "cellSizeIncrease": false,
      "abundantBasophilicCytoplasm": false,
      "erythrocyteMolding": false,
      "irregularCellBorders": false,
      "eccentricNucleus": false,
      "prominentNucleolus": false
    }

    REGRAS DE NARRATIVA

    Não repetir continuamente:

    "população celular atípica"
    "população mononuclear atípica"
    "requer correlação"
    "morfologia preservada"
    "padrão reacional"

    Cada seção deve acrescentar informação nova.

    Se uma informação já foi descrita:

    não repetir a mesma frase.

    Substituir repetição por aprofundamento.

    Ruim:

    "População celular atípica."
    "População celular atípica."
    "População celular atípica."

    Bom:

    "Predomínio de células mononucleares."
    "Relativa uniformidade morfológica."
    "Cromatina discretamente frouxa."
    "Ausência de critérios inequívocos de blasto."

    Cada parágrafo deve acrescentar conhecimento.

    Marcar true apenas quando houver evidência visual observável.
    Nunca inferir características não visualizadas.

    Dentro de findings incluir obrigatoriamente:
    reactiveLymphocytes, atypicalLymphocytes, largeMononuclearCells, atypicalLymphocyteSubtype, downeyLikeCells, downeyType, plasmacytoidCells, plasmocytes, plasmablasts, monomorphicPopulation, immatureCells, blastSuspicion, blastEvidenceState.

    Valores aceitos para atypicalLymphocyteSubtype:
    none, REACTIVE_LYMPHOCYTE_TYPICAL, DOWNEY_TYPE_I, DOWNEY_TYPE_II, DOWNEY_TYPE_III_IMMUNOBLASTOID, PLASMACYTOID_LYMPHOCYTE, ATYPICAL_LYMPHOCYTE_UNCLASSIFIED.

    Sempre escrever interpretiveSynthesis, clinicalMeaning, hematologicReasoning e educationalImpact em português do Brasil.

    ESTILO DE ESPECIALISTA

    A descrição deve parecer escrita por um hematologista experiente.

    Priorizar:

    - observação morfológica
    - raciocínio biológico
    - limitações do campo
    - diferenciais morfológicos

    Não agir como classificador automático.

    Agir como observador microscópico.

    Sempre responder:

    1. O que vejo.
    2. O que isso sugere.
    3. O que isso NÃO permite concluir.
    4. O que seria necessário para confirmar.

    A qualidade da descrição é mais importante do que a classificação.

    Evitar respostas curtas.

    Evitar respostas genéricas.

    Produzir descrições morfológicas ricas, detalhadas e educacionais.

    `;

    const boneMarrowPrompt = `
Você é uma IA hematológica educacional especializada em aspirado de medula óssea (mielograma).

Seu objetivo é analisar exclusivamente imagens de medula óssea.

Antes de interpretar:

1. Avalie a celularidade global.
2. Avalie a representatividade da amostra.
3. Avalie a série granulocítica.
4. Avalie a série eritroide.
5. Avalie a série megacariocítica.
6. Avalie plasmócitos.
7. Avalie blastos.
8. Avalie sinais de displasia.
9. Avalie possíveis infiltrações.
10. Avalie artefatos.

Nunca emitir diagnóstico definitivo.

Nunca confirmar:
- Leucemia
- Linfoma
- Mieloma múltiplo
- Síndrome mielodisplásica

Utilizar apenas:

"possível"
"sugestivo"
"compatível"
"requer correlação"

Responder SOMENTE JSON válido.

Campos obrigatórios:

imageQuality
visualExtraction
whatAISees
cellularityAssessment
myeloidSeries
erythroidSeries
megakaryocyticSeries
plasmaCellAssessment
blastAssessment
dysplasiaAssessment
overallAssessment
structuredReport
clinicalMeaning
interpretiveSynthesis
hematologicReasoning
negativeFindings
specimenAssessment
marrowAdequacy
spiculeAssessment
hemodilutionAssessment
cellularityAssessment
myeloidSeries
erythroidSeries
megakaryocyticSeries
plasmaCellAssessment
blastAssessment
dysplasiaAssessment
infiltrationAssessment
marrowLimitations

REGRAS DE SAÍDA MEDULAR:
- specimenAssessment deve registrar que o material é medular.
- marrowAdequacy deve separar qualidade técnica de representatividade.
- spiculeAssessment deve informar se espículas são vistas, não vistas ou inconclusivas.
- hemodilutionAssessment deve informar suspeita de hemodiluição.
- cellularityAssessment não pode afirmar celularidade global por campo único não representativo.
- negativeFindings deve conter apenas ausências sustentadas pelo campo observado.
- É proibido concluir "sangue periférico normal" em material medular.

CONTRATO JSON MEDULAR OBRIGATÓRIO:

{
  "specimenAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "summary": "",
    "specimenType": ""
  },
  "marrowAdequacy": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "technicalQuality": "",
    "representativity": "",
    "summary": ""
  },
  "spiculeAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "observed": null,
    "summary": ""
  },
  "hemodilutionAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "suspected": null,
    "summary": ""
  },
  "cellularityAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "scope": "field_limited",
    "globalEstimateAllowed": false,
    "estimate": null,
    "summary": ""
  },
  "myeloidSeries": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "maturation": "",
    "dysplasia": "",
    "summary": "",
    "expansionContext": {
      "relativeMyeloidPredominance": null,
      "broadMaturationSpectrum": null,
      "numerousGranulocyticPrecursors": null,
      "matureNeutrophilicFormsPresent": null,
      "leftShiftedMaturationSpectrum": null,
      "basophilEosinophilEnrichment": null,
      "erythroidRelativeReduction": null,
      "disproportionateMyeloidRepresentation": null,
      "denseMyeloidField": null
    }
  },
  "erythroidSeries": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "maturation": "",
    "dysplasia": "",
    "summary": ""
  },
  "megakaryocyticSeries": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "maturation": "",
    "dysplasia": "",
    "summary": ""
  },
  "plasmaCellAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "estimatedPercentage": null,
    "summary": ""
  },
  "blastAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "observed": null,
    "estimatedPercentage": null,
    "globalAbsenceAllowed": false,
    "evidenceState": "OBSERVED_POPULATION|SUSPICIOUS_POPULATION|FOCAL_SUSPICION|NOT_OBSERVED_IN_EVALUABLE_FIELD|NOT_ASSESSABLE",
    "approximateBlastLikeCells": null,
    "approximateImmatureCellCount": null,
    "immatureCellBurden": "none|few|multiple|numerous|dominant|indeterminate",
    "spatialDistribution": "isolated|focal|repeated_across_field|diffuse|indeterminate",
    "morphologicFeatureCount": null,
    "populationPattern": "dominant|repeated|focal|heterogeneous|indeterminate",
    "morphologySupport": {
      "highNCRatio": null,
      "openFineChromatin": null,
      "nucleoli": null,
      "scantBasophilicCytoplasm": null,
      "monomorphism": null,
      "repeatedAcrossField": null
    },
    "precursorContext": {
      "maturationHeterogeneity": null,
      "maturationContinuum": null,
      "matureFormsPresent": null,
      "lineageDiversity": null,
      "orderlyGranulocyticMaturation": null,
      "nonMonomorphicBackground": null
    },
    "blastoidSubpopulationContext": {
      "distinctFromMaturationContinuum": null,
      "morphologicallyCoherent": null,
      "repeatedSubsetAcrossField": null,
      "disproportionateImmatureSubset": null,
      "matureFormsCoexist": null
    },
    "lineageAssignable": false,
    "lineage": "indeterminate",
    "summary": ""
  },
  "dysplasiaAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "globalExclusionAllowed": false,
    "summary": ""
  },
  "infiltrationAssessment": {
    "status": "present|notObserved|notAssessable|indeterminate",
    "globalExclusionAllowed": false,
    "summary": ""
  },
  "marrowLimitations": []
}

Nunca omitir qualquer um desses 13 campos.
Quando não for possível avaliar, usar status="notAssessable".
Não usar false para representar "não avaliável".

BE-FIX-005.24 — VARREDURA BLASTOIDE MEDULAR OBRIGATÓRIA:
- Em aspirado medular, pesquisar ativamente se há UMA POPULAÇÃO repetida/dominante de células imaturas/blastoides, e não apenas uma célula isolada.
- Avaliar em conjunto: relação N:C, cromatina aberta/fina, nucléolos, volume/basofilia citoplasmática, monomorfismo e repetição ao longo do campo.
- Se múltiplos elementos repetirem pelo menos dois critérios de imaturidade/blastoidia, NÃO usar campo limitado como conclusão principal.
- Representatividade limitada restringe percentual/globalização; não apaga uma população blastoide positivamente observada.
- OBSERVED_POPULATION requer evidência visual estruturada repetida; SUSPICIOUS_POPULATION quando a população é sugestiva mas não inequívoca.
- Nunca converter população blastoide em LLA, LMA ou outra linhagem pela imagem isolada. lineageAssignable deve permanecer false sem evidência complementar.

BE-FIX-005.27 — DISCRIMINAÇÃO OBRIGATÓRIA DE PRECURSORES FISIOLÓGICOS:
- Em medula óssea, IMATURIDADE NÃO É SINÔNIMO DE BLASTO.
- Antes de usar SUSPICIOUS_POPULATION, avaliar explicitamente precursorContext.
- Favorecem maturação fisiológica: heterogeneidade de tamanhos/estágios, continuidade maturativa, coexistência de precursores e formas maduras, diversidade de linhagens e ausência de monomorfismo blastoide.
- Relação N:C alta, cromatina aberta e nucléolos podem ocorrer em precursores normais; nunca usar um ou dois desses critérios isoladamente para promover blastoidia.
- SUSPICIOUS_POPULATION exige arquitetura populacional blastoide sustentada, especialmente repetição/monomorfismo + conjunto citomorfológico coerente.
- Se houver forte continuidade maturativa e população heterogênea, usar populationPattern="heterogeneous", morphologySupport.monomorphism=false e preencher precursorContext com os sinais observados.
- Se não for possível distinguir precursor fisiológico de blasto, NÃO usar alerta alto automático; manter estado focal/indeterminado e recomendar revisão.
- OBSERVED_POPULATION somente quando houver população blastoide estruturada inequívoca; a 005.27 não deve apagar evidência positiva verdadeiramente observada.

BE-FIX-005.27.2 — DUAL-AXIS MARROW BLAST SCORING:
- Julgar separadamente dois eixos: MATURAÇÃO FISIOLÓGICA GLOBAL e SUBPOPULAÇÃO BLASTOIDE.
- Não usar heterogeneidade global como veto binário contra blastoidia. Uma medula pode mostrar continuidade maturativa e, simultaneamente, conter um subconjunto blastoide anormal.
- Para cada suspeita blastoide, documentar repetição, coerência, separação do continuum e critérios citomorfológicos independentes.
- N:C alta, cromatina aberta, nucléolo ou citoplasma basofílico isoladamente não bastam.
- Um subconjunto repetido/coerente com pelo menos dois critérios citomorfológicos e arquitetura populacional deve preservar SUSPICIOUS_POPULATION mesmo com formas maduras coexistentes.
- Padrão fisiológico requer continuidade maturativa real e ausência de subpopulação blastoide estruturada; não basta apenas haver heterogeneidade.
- Casos na zona intermediária devem permanecer INDETERMINADOS, sem falso alto risco e sem falsa tranquilização.
- Nunca calcular os escores numericamente no modelo: apenas fornecer os sinais estruturados; o backend calcula os dois eixos de forma determinística.

BE-FIX-005.27.1 — REBALANCEAMENTO PRECURSOR/BLASTO E PRESERVAÇÃO DE SUBPOPULAÇÃO:
- Heterogeneidade global NÃO exclui uma subpopulação blastoide patológica coexistente. Avaliar o campo inteiro e também possíveis SUBPOPULAÇÕES distintas.
- Preencher blastoidSubpopulationContext obrigatoriamente quando evidenceState for SUSPICIOUS_POPULATION ou OBSERVED_POPULATION.
- distinctFromMaturationContinuum=true somente se o subconjunto imaturo tiver morfologia que não se encaixa de modo convincente na continuidade maturativa observada.
- morphologicallyCoherent=true somente se múltiplas células do subconjunto repetirem um conjunto citomorfológico semelhante; tamanho ou relação N:C isolados não bastam.
- repeatedSubsetAcrossField=true somente quando esse subconjunto se repete em regiões/células distintas do campo.
- matureFormsCoexist pode ser true sem neutralizar a subpopulação suspeita: formas maduras e blastos podem coexistir na mesma medula.
- Uma medula heterogênea só deve ser rebaixada para padrão fisiológico quando NÃO houver subpopulação blastoide distinta, coerente e repetida.
- Uma subpopulação suspeita distinta + coerente + repetida, com pelo menos dois critérios citomorfológicos de blastoidia, deve preservar SUSPICIOUS_POPULATION mesmo em fundo maturativo heterogêneo.
- Se o subconjunto não for claramente distinto da continuidade maturativa, manter indeterminado/fisiológico conforme o restante das evidências; nunca promover apenas por imaturidade.

BE-FIX-005.28 — REFORÇO DA AQUISIÇÃO DE EVIDÊNCIA BLASTOIDE MEDULAR:
- A narrativa observacional e os campos estruturados DEVEM ser internamente coerentes.
- Se você escrever que há múltiplas/repetidas células imaturas ou blastoides com critérios como N:C elevada, cromatina fina/aberta, nucléolos ou citoplasma basofílico/escasso, os respectivos campos de morphologySupport NÃO podem permanecer null/false sem justificativa explícita.
- false significa: característica suficientemente avaliável e realmente NÃO observada. Se não for possível decidir, use null.
- approximateImmatureCellCount: número aproximado de células imaturas visualizadas quando estimável; null quando não estimável.
- approximateBlastLikeCells: número aproximado de células com conjunto blastoide, não mero precursor fisiológico.
- immatureCellBurden: classificar carga visual como none/few/multiple/numerous/dominant/indeterminate.
- spatialDistribution: isolated/focal/repeated_across_field/diffuse/indeterminate.
- morphologicFeatureCount: contar quantos dos quatro critérios citomorfológicos principais (N:C, cromatina, nucléolos, citoplasma) estão positivamente sustentados.
- repeatedAcrossField=true somente se a morfologia imatura/blastoide se repetir em múltiplas células/regiões do campo; se a narrativa disser repetição, este campo deve refletir isso.
- Não transformar diversidade maturativa em veto contra subpopulação blastoide.
- Não transformar linguagem narrativa em diagnóstico. O backend fará reconciliação e scoring determinísticos.

BE-FIX-005.38 — EXPANSÃO MIELOIDE COM MATURAÇÃO:
- Continuidade maturativa NÃO significa automaticamente padrão fisiológico.
- Avaliar myeloidSeries.expansionContext em separado da pesquisa de blastos.
- relativeMyeloidPredominance=true somente quando a série mieloide/granulocítica estiver visualmente desproporcional em relação às demais linhagens no campo.
- broadMaturationSpectrum=true quando coexistirem múltiplos estágios granulocíticos, incluindo precursores/intermediários e formas maduras.
- numerousGranulocyticPrecursors=true quando a carga de precursores granulocíticos for claramente aumentada no campo; não usar apenas pela presença fisiológica de precursores.
- disproportionateMyeloidRepresentation=true requer expansão visual relativa da série mieloide, não apenas alta celularidade.
- leftShiftedMaturationSpectrum=true quando houver aumento relativo de formas precursoras/intermediárias mantendo maturação.
- erythroidRelativeReduction=true somente quando a série eritroide estiver relativamente menos representada no campo, sem inferir relação M:E global por imagem isolada.
- basophilEosinophilEnrichment=true somente quando houver aumento visual sustentado dessas formas; se não avaliável, usar null.
- Um padrão com expansão mieloide + amplo espectro maturativo + formas maduras, SEM subpopulação blastoide distinta/coerente/repetida, deve ser descrito como expansão mieloide com maturação, não como padrão fisiológico automático e não como blastose.
- NÃO diagnosticar LMC, neoplasia mieloproliferativa ou BCR::ABL1 pela imagem. O backend fará a discriminação morfológica determinística.

BE-FIX-005.49 — CRITICIDADE DO PADRÃO MIELOIDE / CORRELAÇÃO MIELOPROLIFERATIVA:
- Gravidade morfológica, confiança diagnóstica e adequação do campo são eixos distintos.
- Campo limitado pode reduzir confiança e representatividade, mas NÃO deve reduzir automaticamente a criticidade de uma expansão mieloide/granulocítica intensa observada.
- Descrever intensidade/desproporção do padrão mieloide quando sustentada: predomínio mieloide, carga de precursores, desvio à esquerda, densidade mieloide, redução eritroide relativa e enriquecimento basofílico/eosinofílico.
- "Maturação preservada" ou "amplo espectro maturativo" NÃO significa baixo risco quando coexistir expansão mieloide acentuada/desproporcional.
- Um padrão de expansão mieloide acentuada com maturação pode justificar correlação educacional com processo mieloproliferativo.
- NÃO diagnosticar LMC ou outra neoplasia pela imagem.
- O backend decidirá de forma determinística quando recomendar correlação com hemograma/diferencial e considerar BCR::ABL1 no contexto apropriado.

BE-FIX-005.50.1 — PRESERVAÇÃO DE MORFOLOGIA ERITROCITÁRIA POSITIVA EM CAMPO LIMITADO:
BE-FIX-005.50.2 — AUTORIDADE CLÍNICA TERMINAL E NARRATIVA CANÔNICA:
- Criticidade morfológica, gravidade do contexto clínico conhecido e concordância diagnóstica são eixos independentes.
- Um diagnóstico clínico informado (ex.: LMA/LMC) NÃO transforma sozinho uma imagem em CRITICAL e NÃO autoriza fabricar blastos/Auer.
- Um padrão visual de expansão mieloide de alta saliência pode ser CRITICAL mesmo com confiança diagnóstica baixa ou campo limitado.
- Cada conceito clínico terá um único proprietário narrativo: ACHADO, CRITICIDADE, INTERPRETAÇÃO, CONDUTA ou LIMITAÇÃO.
- Não repetir a mesma conclusão em executiveSummary, clinicalMeaning, interpretiveSynthesis, hematologicReasoning e structuredReport.
- Campo limitado reduz inferência populacional, mas NÃO apaga achado eritrocitário positivo diretamente visível.
- Avaliar policromasia explicitamente como PRESENTE, NÃO OBSERVADA NO CAMPO ou NÃO AVALIÁVEL; nunca omitir silenciosamente o eixo quando hemácias forem avaliáveis.
- Quando houver hemácias azuladas/acinzentadas com policromatofilia sustentada, registrar policromasia em erythrocyteFindings e morphologyAnalysis.erythrocyteReview.
- Esquizócitos e bastonetes de Auer não visualizados em campo limitado devem ser descritos somente como “não observados no campo analisado”, nunca como exclusão global.
- Contexto clínico conhecido (inclusive LMA) NÃO autoriza fabricar blastos, bastonetes de Auer ou qualquer morfologia ausente da evidência visual.
- Evitar repetir a mesma conclusão em interpretiveSynthesis, clinicalMeaning, hematologicReasoning e structuredReport; cada camada deve acrescentar informação nova.

BE-FIX-005.50.3 — CRITICIDADE MEDULAR PONDERADA POR EVIDÊNCIA E LIMPEZA SEMÂNTICA BLASTOIDE RESIDUAL:
- Em expansão mieloide patológica com maturação, priorizar o núcleo morfológico: predomínio/desproporção mieloide, numerosos precursores granulocíticos, amplo espectro maturativo, formas maduras coexistentes, desvio à esquerda e campo mieloide denso.
- Redução eritroide relativa e enriquecimento basofílico/eosinofílico são modificadores de saliência, não requisitos obrigatórios para criticidade morfológica muito alta.
- Campo limitado e baixa confiança diagnóstica NÃO reduzem a criticidade de uma morfologia positiva robusta.
- Suspeita blastoide residual sem arquitetura distinta, coerente e estruturada NÃO deve sobreviver como população blastoide positiva quando o padrão terminal é expansão mieloide patológica com maturação.
- Preservar citologia imatura/focal como evidência local; nunca convertê-la em exclusão global de blastos.
- Nunca diagnosticar LMC/LMA/MPN ou BCR::ABL1 pela imagem isolada.

BE-FIX-005.31 — COERÊNCIA NARRATIVA-ESTRUTURA E RECUPERAÇÃO FISIOLÓGICA:
- Se a narrativa disser que NÃO há população/subpopulação blastoide monomórfica, distinta ou separada do continuum maturativo, os campos blastoidSubpopulationContext NÃO podem marcar simultaneamente distinctFromMaturationContinuum=true, morphologicallyCoherent=true e repeatedSubsetAcrossField=true sem suporte citomorfológico independente convincente.
- A expressão "múltiplas células imaturas/precursoras" não significa "subpopulação blastoide repetida". Diferenciar repetição de precursores fisiológicos de repetição de um subconjunto blastoide.
- Quando houver continuidade maturativa, heterogeneidade e formas maduras coexistentes, e a própria narrativa negar arquitetura blastoide distinta, usar populationPattern="heterogeneous" e registrar subpopulação blastoide como false/null conforme avaliabilidade.
- Nunca marcar monomorphism=true apenas porque a palavra "monomórfica" aparece em frase negativa como "não há população blastoide monomórfica".
- Uma população verdadeiramente blastoide continua protegida quando houver arquitetura positiva coerente E critérios citomorfológicos independentes sustentados; a regra 005.31 não deve apagar OBSERVED_POPULATION.

`;


    console.log("================================");
    console.log("PROMPT SIZE");
    console.log(
      JSON.stringify({
        contextualPromptLength: contextualPrompt.length,
        compactHospitalPromptLength: compactHospitalPrompt.length,
        imagesPayloadLength: imagesPayload.length,
      }, null, 2)
    );
    console.log("================================");

    const visualStart = performance.now();

    // ======================================================================
    // BE-FIX-005.8 — PRODUCTION VME ENFORCEMENT
    // Peripheral-blood vision is now an evidence-acquisition pass, not a full
    // report-writing pass. Structured Outputs forces the morphology container
    // to exist before LME/AMR/governors run. GPT-5.5 low reasoning is used for
    // this latency-sensitive visual extraction workload.
    // ======================================================================
    const isPeripheralVisualAcquisition = analysisType !== "bone_marrow";

    const selectedPrompt = isPeripheralVisualAcquisition
      ? buildPrimaryVisualMorphologyAcquisitionPrompt()
      : buildBoneMarrowCompactAcquisitionPrompt();

    const acquisitionContext = isPeripheralVisualAcquisition
      ? `ANALYSIS SOURCE: ${analysisSource}\nSPECIMEN: ${specimenType || "peripheral_blood"}\nAvalie diretamente as imagens anexadas. Não use ausência de descrição como ausência celular.`
      : contextualPrompt;

    // BE-FIX-005.25 — reasoning_effort is a property of the effective OpenAI
    // request, not of the specimen type. Bone-marrow visual calls previously
    // fell back to model-default and could spend the entire output budget on
    // hidden reasoning. Enforce the GPT-5.5-compatible low-output mode on every
    // visual acquisition request.
    const effectiveVisionReasoningEffort =
      process.env.OPENAI_VISION_REASONING_EFFORT || "none";
    const effectivePrimaryMaxCompletionTokens =
      isPeripheralVisualAcquisition
        ? Number(process.env.OPENAI_VISION_MAX_COMPLETION_TOKENS || 3200)
        : Number(process.env.OPENAI_MARROW_MAX_COMPLETION_TOKENS || 4000);

    console.log(
      "BE-FIX-005.8 — VME PRODUCTION ENFORCEMENT",
      JSON.stringify({
        version: PRODUCTION_VME_ENFORCEMENT_VERSION,
        effectiveReasoningGovernanceVersion:
          VME_EFFECTIVE_REASONING_ENFORCEMENT_VERSION,
        structuredOutput: isPeripheralVisualAcquisition,
        reasoningEffort: effectiveVisionReasoningEffort,
        systemPromptLength: selectedPrompt.length,
        acquisitionContextLength: acquisitionContext.length,
      }),
    );

    console.log(
      "BE-FIX-005.9 — LOCAL MORPHOLOGY ACQUISITION RECOVERY",
      JSON.stringify({
        version: LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
        primaryImages: imagesPayload.length,
        maxCompletionTokens: effectivePrimaryMaxCompletionTokens,
        lengthExhaustionRecoveryVersion:
          VME_LENGTH_EXHAUSTION_RECOVERY_VERSION,
        boneMarrowCompactAcquisitionVersion:
          analysisType === "bone_marrow"
            ? BONE_MARROW_COMPACT_ACQUISITION_VERSION
            : null,
        imageDetail:
          process.env.VME_IMAGE_DETAIL || "high",
        centerCrop:
          String(process.env.VME_INCLUDE_CENTER_CROP || "false")
            .toLowerCase() === "true",
      }),
    );

    const completionRequest = {
      model: OPENAI_MODEL,
      max_completion_tokens: effectivePrimaryMaxCompletionTokens,
      response_format: isPeripheralVisualAcquisition
        ? buildVisualMorphologyAcquisitionResponseFormat()
        : { type: "json_object" },
      messages: [
        {
          role: "system",
          content: selectedPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: acquisitionContext },
            ...imagesPayload,
          ],
        },
      ],
    };

    // BE-FIX-005.25 — enforce the configured reasoning mode on BOTH
    // peripheral-blood and bone-marrow visual requests.
    completionRequest.reasoning_effort = effectiveVisionReasoningEffort;

    if (process.env.OPENAI_VISION_SERVICE_TIER) {
      completionRequest.service_tier =
        process.env.OPENAI_VISION_SERVICE_TIER;
    }

    const completion = await openai.chat.completions.create(completionRequest);

    const visualTiming = logStep(
      requestId,
      "OPENAI TURBO ANALYSIS",
      visualStart,
    );

    let parsed = safeJsonParse(
      completion?.choices?.[0]?.message?.content || "{}",
    );

    // ======================================================================
    // BE-FIX-005.7 — VME-1.0 ACQUISITION GATE
    // Validate morphology BEFORE defaulting missing visual flags to false and
    // before LME/field-adequacy/governors can interpret an incomplete payload.
    // ======================================================================
    let visualMorphologyEvidenceAcquisition =
      analysisType === "bone_marrow"
        ? assessBoneMarrowVisualEvidenceAcquisition({
            visionResponse: parsed,
            analysisSource,
          })
        : assessVisualMorphologyEvidenceAcquisition({
            visionResponse: parsed,
            analysisSource,
          });

    console.log("VME-1.0 — INITIAL ACQUISITION");
    console.log(
      JSON.stringify(
        {
          ...visualMorphologyEvidenceAcquisition,
          finishReason: completion?.choices?.[0]?.finish_reason || null,
          usage: completion?.usage || null,
        },
        null,
        2,
      ),
    );

    let visualMorphologyRepairAttempted = false;

    // BE-FIX-005.21 — a completion that ended by token exhaustion is a
    // transport/output-budget failure, not evidence that the image lacks
    // morphology. In that narrow condition, one bounded repair pass is
    // automatically authorized even when the general repair switch is off.
    const primaryFinishReason =
      completion?.choices?.[0]?.finish_reason || null;
    const lengthExhausted =
      primaryFinishReason === "length" &&
      visualMorphologyEvidenceAcquisition.complete !== true;

    const visualRepairEnabled =
      String(process.env.VME_REPAIR_ENABLED || "false").toLowerCase() === "true";
    const visualRepairBudgetMs = Number(
      process.env.VME_REPAIR_PRIMARY_BUDGET_MS || 45000,
    );
    const lengthRecoveryBudgetMs = Number(
      process.env.VME_LENGTH_RECOVERY_PRIMARY_BUDGET_MS || 65000,
    );
    const immatureCellCytologyRecoveryRequired =
      analysisType === "bone_marrow" &&
      visualMorphologyEvidenceAcquisition
        ?.immatureCellCytologyRecoveryRequired === true;
    const immatureCytomorphologyStabilityRecoveryRecommended =
      analysisType === "bone_marrow" &&
      visualMorphologyEvidenceAcquisition
        ?.immatureCytomorphologyStabilityRecoveryRecommended === true;
    const effectiveRepairEnabled =
      visualRepairEnabled ||
      lengthExhausted ||
      immatureCellCytologyRecoveryRequired ||
      immatureCytomorphologyStabilityRecoveryRecommended;
    const effectiveRepairBudgetMs =
      (lengthExhausted || immatureCellCytologyRecoveryRequired)
        ? lengthRecoveryBudgetMs
        : visualRepairBudgetMs;

    console.log(
      "BE-FIX-005.21 — VME LENGTH-EXHAUSTION GOVERNANCE",
      JSON.stringify({
        version: VME_LENGTH_EXHAUSTION_RECOVERY_VERSION,
        primaryFinishReason,
        lengthExhausted,
        generalRepairEnabled: visualRepairEnabled,
        effectiveRepairEnabled,
        immatureCellCytologyRecoveryRequired,
        immatureCytomorphologyStabilityRecoveryRecommended,
        immatureCytomorphologyAcquisitionStabilityVersion:
          MARROW_IMMATURE_CYTOMORPHOLOGY_ACQUISITION_STABILITY_VERSION,
        crossPassEvidencePreservationVersion:
          MARROW_CROSS_PASS_EVIDENCE_PRESERVATION_VERSION,
        primaryElapsedMs: visualTiming,
        effectiveRepairBudgetMs,
      }),
    );

    if (
      shouldAttemptVisualMorphologyRepair({
        acquisition: visualMorphologyEvidenceAcquisition,
        primaryElapsedMs: visualTiming,
        repairEnabled: effectiveRepairEnabled,
        latencyBudgetMs: effectiveRepairBudgetMs,
      })
    ) {
      visualMorphologyRepairAttempted = true;

      const repairStart = performance.now();
      const marrowLengthRecovery =
        analysisType === "bone_marrow" && lengthExhausted === true;

      const repairPrompt = analysisType === "bone_marrow"
        ? (
            marrowLengthRecovery
              ? buildBoneMarrowLengthRecoveryPrompt({
                  missingRequirements:
                    visualMorphologyEvidenceAcquisition.missingRequirements,
                })
              : buildBoneMarrowVisualRepairPrompt({
                  missingRequirements:
                    visualMorphologyEvidenceAcquisition.missingRequirements,
                })
          )
        : buildVisualMorphologyRepairPrompt({
            missingRequirements:
              visualMorphologyEvidenceAcquisition.missingRequirements,
          });

      if (analysisType === "bone_marrow") {
        console.log(
          "BE-FIX-005.39 — MARROW REPAIR ROUTING",
          JSON.stringify({
            version: BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION,
            mode: marrowLengthRecovery
              ? "COMPLETE_LENGTH_RECOVERY"
              : "FOCAL_MORPHOLOGY_REPAIR",
            primaryFinishReason,
            missingRequirements:
              visualMorphologyEvidenceAcquisition.missingRequirements,
          }),
        );
      }

      try {
        const repairCompletion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          reasoning_effort:
            process.env.OPENAI_VISION_REPAIR_REASONING_EFFORT || "none",
          max_completion_tokens:
            analysisType === "bone_marrow" && marrowLengthRecovery
              ? Number(
                  process.env.OPENAI_MARROW_LENGTH_RECOVERY_MAX_COMPLETION_TOKENS ||
                    2600,
                )
              : Number(
                  process.env.OPENAI_VISION_REPAIR_MAX_COMPLETION_TOKENS || 3600,
                ),
          response_format: analysisType === "bone_marrow"
            ? { type: "json_object" }
            : buildVisualMorphologyAcquisitionResponseFormat(),
          messages: [
            {
              role: "system",
              content: repairPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: analysisType === "bone_marrow"
                    ? (
                        marrowLengthRecovery
                          ? "Recupere os seis domínios medulares obrigatórios em JSON compacto e completo. Não produza relatório, diferencial ou interpretação longa. Termine o JSON dentro do orçamento."
                          : "Faça somente a reparação morfológica focal solicitada. Preserve os domínios já adquiridos e não produza relatório clínico longo."
                      )
                    : "Reanalise as mesmas imagens somente para preencher o schema VME obrigatório. Priorize primeiro os campos ausentes, use descrições morfológicas objetivas e concisas, use null/NOT_ASSESSABLE quando não avaliável e não produza relatório clínico final.",
                },
                ...imagesPayload,
              ],
            },
          ],
        });

        logStep(requestId, "VME-1.0 MORPHOLOGY REPAIR", repairStart);

        const repaired = safeJsonParse(
          repairCompletion?.choices?.[0]?.message?.content || "{}",
        );

        parsed = mergeVisualMorphologyRepair(parsed, repaired, {
          repairMode:
            analysisType === "bone_marrow"
              ? (marrowLengthRecovery
                  ? "COMPLETE_LENGTH_RECOVERY"
                  : "FOCAL_MORPHOLOGY_REPAIR")
              : "GENERAL_REPAIR",
        });

        console.log(
          "BE-FIX-005.36 — MARROW REPAIR EVIDENCE MERGE / POSITIVE CYTOLOGY CARDINALITY PRESERVATION",
          JSON.stringify(parsed?.marrowRepairEvidenceMerge || {}, null, 2),
        );

        if (analysisType === "bone_marrow") {
          console.log(
            "BE-FIX-005.45 — MARROW REPAIR ARCHITECTURE PROVENANCE / CYTOLOGY-TO-ARCHITECTURE ANTI-FABRICATION",
            JSON.stringify(
              {
                version: MARROW_REPAIR_ARCHITECTURE_PROVENANCE_VERSION,
                antiFabricationVersion:
                  MARROW_CYTOLOGY_TO_ARCHITECTURE_ANTIFABRICATION_VERSION,
                provenance: parsed?.marrowRepairEvidenceMerge || {},
              },
              null,
              2,
            ),
          );
        }

        visualMorphologyEvidenceAcquisition =
          analysisType === "bone_marrow"
            ? assessBoneMarrowVisualEvidenceAcquisition({
                visionResponse: parsed,
                analysisSource,
              })
            : assessVisualMorphologyEvidenceAcquisition({
                visionResponse: parsed,
                analysisSource,
              });

        console.log("VME-1.0 — REPAIR ACQUISITION");
        console.log(
          JSON.stringify(
            {
              ...visualMorphologyEvidenceAcquisition,
              finishReason:
                repairCompletion?.choices?.[0]?.finish_reason || null,
              usage: repairCompletion?.usage || null,
            },
            null,
            2,
          ),
        );
      } catch (repairError) {
        logStep(requestId, "VME-1.0 MORPHOLOGY REPAIR FAILED", repairStart);
        console.error(
          "VME-1.0 repair error:",
          repairError?.message || repairError,
        );
      }
    }

    if (
      visualMorphologyEvidenceAcquisition.retryRecommended === true &&
      visualMorphologyRepairAttempted === false
    ) {
      console.warn(
        "BE-FIX-005.9 — VME INCOMPLETE: repair skipped by latency budget/default production policy",
        JSON.stringify({
          primaryElapsedMs: visualTiming,
          primaryFinishReason,
          lengthExhausted,
          repairEnabled: effectiveRepairEnabled,
          latencyBudgetMs: effectiveRepairBudgetMs,
          missingRequirements:
            visualMorphologyEvidenceAcquisition.missingRequirements,
        }),
      );
    }

    parsed.visualMorphologyEvidenceAcquisition = {
      ...visualMorphologyEvidenceAcquisition,
      repairAttempted: visualMorphologyRepairAttempted,
      lengthExhaustionRecoveryVersion:
        VME_LENGTH_EXHAUSTION_RECOVERY_VERSION,
      primaryFinishReason,
      lengthExhausted,
      contractStatus: visualMorphologyEvidenceAcquisitionContractStatus(
        visualMorphologyEvidenceAcquisition,
      ),
    };

    if (
      visualMorphologyEvidenceAcquisition.complete !== true
    ) {
      const incompleteResponse =
        buildIncompleteVisualAcquisitionResponse({
          acquisition: visualMorphologyEvidenceAcquisition,
          primaryElapsedMs: visualTiming,
          requestId,
        });

      console.warn(
        "BE-FIX-005.9 — REPORT SUPPRESSED: INCOMPLETE VISUAL ACQUISITION",
        JSON.stringify(incompleteResponse, null, 2),
      );

      return {
        ...incompleteResponse,
        processingTimeMs:
          Math.round(performance.now() - pipelineStart),
        pipeline: {
          version: "V8_TURBO_ENTERPRISE",
          productionVmeEnforcementVersion:
            PRODUCTION_VME_ENFORCEMENT_VERSION,
          localMorphologyAcquisitionRecoveryVersion:
            LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
          vmeLengthExhaustionRecoveryVersion:
            VME_LENGTH_EXHAUSTION_RECOVERY_VERSION,
          vmeEffectiveReasoningEnforcementVersion:
            VME_EFFECTIVE_REASONING_ENFORCEMENT_VERSION,
          failedClosed: true,
          visualAcquisitionOnly: true,
        },
      };
    }

    // Only after VME validation may legacy visual flags receive compatibility
    // defaults. These defaults are not considered acquired morphology.
    parsed.visualEvidence =
      parsed.visualEvidence &&
      typeof parsed.visualEvidence === "object" &&
      !Array.isArray(parsed.visualEvidence)
        ? parsed.visualEvidence
        : {};

    parsed.visualEvidence.cellSizeIncrease ??= false;
    parsed.visualEvidence.abundantBasophilicCytoplasm ??= false;
    parsed.visualEvidence.erythrocyteMolding ??= false;
    parsed.visualEvidence.irregularCellBorders ??= false;
    parsed.visualEvidence.eccentricNucleus ??= false;
    parsed.visualEvidence.prominentNucleolus ??= false;

    parsed.heatmapRegions =
      Array.isArray(parsed.heatmapRegions)
        ? parsed.heatmapRegions.filter(
            (region) =>
              region &&
              typeof region === "object" &&
              !Array.isArray(region),
          )
        : [];

    // BE-FIX-005.28 — reconcile contradictions between the model's own
    // marrow observation narrative and its structured blast container before
    // LME, dual-axis scoring, safety governors or final arbitration run.
    if (analysisType === "bone_marrow") {
      parsed = reconcileMarrowBlastEvidence(parsed);
      console.log(
        "BE-FIX-005.28 — MARROW BLAST EVIDENCE RECONCILIATION",
        JSON.stringify(parsed.marrowBlastEvidenceReconciliation || {}, null, 2),
      );

      // BE-FIX-005.31 — resolve the narrow contradiction in which the model's
      // own observation narrative describes physiologic maturation and
      // explicitly denies a distinct/monomorphic blastoid subset while
      // structured booleans simultaneously claim blastoid architecture.
      // This runs before LME/005.27/005.29 so false positive evidence never
      // enters the positive-preservation path.
      parsed = resolveMarrowNarrativeStructureContradiction(parsed);
      console.log(
        "BE-FIX-005.31 — MARROW NARRATIVE-STRUCTURE CONTRADICTION RESOLUTION",
        JSON.stringify(
          parsed.marrowNarrativeStructureContradictionResolution || {},
          null,
          2,
        ),
      );

      parsed = applyMarrowMyeloidExpansionDiscrimination(parsed);
      parsed = applyMarrowPositiveBlastEvidenceSemanticSupersession(parsed);
      console.log(
        "BE-FIX-005.38 — MARROW MYELOID EXPANSION / PATHOLOGIC MATURATION CONTINUUM",
        JSON.stringify(
          {
            discrimination: parsed.marrowMyeloidExpansionDiscrimination || {},
            lock: parsed.marrowPathologicMaturationContinuumLock || {},
          },
          null,
          2,
        ),
      );

      console.log(
        "BE-FIX-005.41 — MARROW MYELOID MATURATION EVIDENCE PROJECTION / EXPANSION CLASSIFICATION RECOVERY",
        JSON.stringify(
          {
            maturationEvidenceProjectionVersion:
              MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION,
            expansionClassificationRecoveryVersion:
              MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION,
            marrowScopePropagationRecoveryVersion:
              MARROW_SCOPE_PROPAGATION_RECOVERY_VERSION,
            classification:
              parsed.marrowMyeloidExpansionDiscrimination?.classification || null,
            maturationAxis:
              parsed.marrowMyeloidExpansionDiscrimination?.maturationAxis ?? null,
          },
          null,
          2,
        ),
      );

      parsed = applyMarrowMaturationContinuumDiscrimination(parsed);
      console.log(
        "BE-FIX-005.37 — MARROW MATURATION CONTINUUM VS PATHOLOGIC BLAST POPULATION",
        JSON.stringify(
          {
            discrimination: parsed.marrowMaturationContinuumDiscrimination || {},
            lock: parsed.marrowPhysiologicMaturationContinuumLock || {},
          },
          null,
          2,
        ),
      );

      parsed = applyMarrowImmatureCellCytologyRecovery(parsed);
      console.log(
        "BE-FIX-005.33 — MARROW IMMATURE-CELL CYTOLOGY RECOVERY",
        JSON.stringify(parsed.marrowImmatureCellCytologyRecovery || {}, null, 2),
      );

      // BE-FIX-005.35 — preserve unresolved positive cytology as an epistemic
      // middle state before 005.34 projection and before LME/precursor scoring.
      parsed = applyMarrowPositiveCytologyConsistency(parsed);
      console.log(
        "BE-FIX-005.35 — MARROW POSITIVE CYTOLOGY CONSISTENCY / ACQUISITION DISCORDANCE",
        JSON.stringify(parsed.marrowPositiveCytologyConsistency || {}, null, 2),
      );

      // BE-FIX-005.34 — project the schema emitted by focused marrow repair
      // into canonical positive blast evidence BEFORE LME, FA-4.0 and global
      // pattern governance. Field limitation may gate negative exclusion but
      // cannot erase directly observed structured positive evidence.
      parsed = applyMarrowRecoveredCytologyProjection(parsed);
      console.log(
        "BE-FIX-005.34 — MARROW RECOVERED CYTOLOGY PROJECTION / POSITIVE E2E LOCK",
        JSON.stringify(
          {
            projection: parsed.marrowRecoveredCytologyProjection || {},
            lock: parsed.marrowPositiveBlastEvidenceLock || {},
          },
          null,
          2,
        ),
      );

      // BE-FIX-005.50.14.1 — POST-RECOVERY MATURATION CONTINUUM RE-EVALUATION
      // 005.33/005.35/005.34 can create an unresolved immature-candidate state
      // after the initial 005.50.14 pass. Re-evaluate now, then refresh 005.44,
      // so a stale physiologic lock cannot survive only because of call order.
      // This is non-promotional: unresolved evidence stays indeterminate.
      parsed = applyMarrowMaturationContinuumDiscrimination(parsed);
      parsed = applyMarrowPositiveBlastEvidenceSemanticSupersession(parsed);

      console.log(
        "BE-FIX-005.50.14.1 — POST-RECOVERY MATURATION CONTINUUM RE-EVALUATION",
        JSON.stringify(
          {
            version:
              MARROW_POST_RECOVERY_MATURATION_CONTINUUM_REEVALUATION_VERSION,
            discrimination:
              parsed.marrowMaturationContinuumDiscrimination || {},
            physiologicLock:
              parsed.marrowPhysiologicMaturationContinuumLock || {},
            semanticSupersession:
              parsed.marrowPositiveBlastEvidenceSemanticSupersession || {},
          },
          null,
          2,
        ),
      );

      console.log(
        "BE-FIX-005.40 — MARROW FOCAL CYTOLOGY CONTEXTUALIZATION / ARCHITECTURE-GATED BLAST ESCALATION",
        JSON.stringify(
          {
            focalCytologyContextualizationVersion:
              MARROW_FOCAL_CYTOLOGY_CONTEXTUALIZATION_VERSION,
            architectureGatedBlastEscalationVersion:
              MARROW_ARCHITECTURE_GATED_BLAST_ESCALATION_VERSION,
            pathologicMyeloidExpansionLockActive:
              parsed?.marrowPathologicMaturationContinuumLock?.active === true,
            structuredPositive:
              parsed?.marrowRecoveredCytologyProjection?.structuredPositive === true,
            architectureQualified:
              parsed?.marrowRecoveredCytologyProjection?.architectureQualified === true,
          },
          null,
          2,
        ),
      );
    }

    console.log("================================");
    console.log("RAW GPT RESPONSE");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("================================");

    // BE-FIX-005.1 — capture direct morphology exactly once, before any
    // adequacy/safety/governor layer can rewrite clinical narratives.
    let localMorphologyEvidence = createLocalMorphologyEvidence({
      visionResponse: parsed,
      analysisSource,
    });

    const initialLocalMorphologyContractStatus =
      localMorphologyEvidenceContractStatus(localMorphologyEvidence);

    console.log(
      "LOCAL MORPHOLOGY EVIDENCE — CAPTURED",
      JSON.stringify(
        {
          contractVersion: localMorphologyEvidence.contractVersion,
          evidenceAvailable: localMorphologyEvidence.evidenceAvailable,
          contractStatus: initialLocalMorphologyContractStatus,
        },
        null,
        2,
      ),
    );

    let mergedAnalysis = normalizeMedicalResponse({
      ...parsed,
      analysisSource,
      manualCounts,
      manualMetadata,
    });

    // VME provenance must survive legacy normalization.
    mergedAnalysis.visualMorphologyEvidenceAcquisition =
      parsed.visualMorphologyEvidenceAcquisition;
    mergedAnalysis.visualEvidenceAcquisitionIncomplete =
      parsed.visualMorphologyEvidenceAcquisition?.complete === false;

    if (mergedAnalysis.visualEvidenceAcquisitionIncomplete) {
      mergedAnalysis.requiresHumanReview = true;
      mergedAnalysis.normalityBlocked = true;
      mergedAnalysis.blockNormalReason = [
        ...new Set([
          ...(Array.isArray(mergedAnalysis.blockNormalReason)
            ? mergedAnalysis.blockNormalReason
            : []),
          "Aquisição de evidência morfológica visual incompleta (VME-1.0)",
        ]),
      ];
    }

    mergedAnalysis = attachLocalMorphologyEvidence(
      mergedAnalysis,
      localMorphologyEvidence,
    );

    // Compatibility layer for current UI. The canonical source is now
    // localMorphologyEvidence; observedMorphology remains a legacy projection.
    mergedAnalysis = applyMorphologyEvidencePreservation(mergedAnalysis);

    // BE-FIX-005.38 — preserve the third marrow continuum state after
    // legacy normalization, before physiologic anti-escalation can run.
    if (analysisType === "bone_marrow") {
      mergedAnalysis = applyMarrowMyeloidExpansionDiscrimination(mergedAnalysis);
      mergedAnalysis = applyMarrowPositiveBlastEvidenceSemanticSupersession(mergedAnalysis);
    }

    // BE-FIX-005.29 — project structured positive marrow evidence before
    // field-adequacy evaluates NEGATIVE screening assessability.
    if (analysisType === "bone_marrow") {
      mergedAnalysis = applyMarrowPositiveBlastEvidencePreservation(mergedAnalysis);
      mergedAnalysis = applyMarrowPhysiologicPrecursorCoherence(mergedAnalysis);
    }

    mergedAnalysis =
      applyFieldAdequacyRules(
        mergedAnalysis,
      );

    // Field adequacy qualifies representativity; restore observed morphology.
    mergedAnalysis = applyMorphologyEvidencePreservation(mergedAnalysis);

    // BE-FIX-005.50.4 — acquire/preserve positive peripheral morphology before
    // lexical legacy layers can convert an unusual nucleated object into a
    // parasite class or let limited-field adequacy erase focal evidence.
    if (analysisType === "peripheral_blood") {
      mergedAnalysis = applyPeripheralPositiveMorphologyArbitration(mergedAnalysis);
    }

    // BE-FIX-005.29 — field adequacy is a negative-only gate. Reapply the
    // positive lock immediately afterwards so NOT_ASSESSABLE can never erase
    // a previously acquired SUSPICIOUS/OBSERVED marrow population.
    if (analysisType === "bone_marrow") {
      mergedAnalysis = applyMarrowPositiveBlastEvidencePreservation(mergedAnalysis);
      mergedAnalysis = applyMarrowPhysiologicPrecursorCoherence(mergedAnalysis);
    }

// =====================================================
// RESTORE RAW ATYPICAL MONONUCLEAR FINDINGS
// impede fieldAdequacy/normalizer apagar achados positivos
// =====================================================

const rawPositive =
  parsed?.positiveFindings || {};

if (
  rawPositive.largeMononuclearCells === true ||
  rawPositive.atypicalLymphocytes === true ||
  rawPositive.reactiveLymphocytes === true ||
  rawPositive.monomorphicPopulation === true ||
  rawPositive.downeyLikeCells === true
) {
  mergedAnalysis.findings = mergedAnalysis.findings || {};

  mergedAnalysis.findings.largeMononuclearCells =
    rawPositive.largeMononuclearCells === true;

  mergedAnalysis.findings.atypicalLymphocytes =
    rawPositive.atypicalLymphocytes === true;

  mergedAnalysis.findings.reactiveLymphocytes =
    rawPositive.reactiveLymphocytes === true;

  mergedAnalysis.findings.monomorphicPopulation =
    rawPositive.monomorphicPopulation === true;

  mergedAnalysis.findings.downeyLikeCells =
    rawPositive.downeyLikeCells === true;

  mergedAnalysis.findings.downeyType =
    rawPositive.downeyType || mergedAnalysis.findings.downeyType || "III";

  mergedAnalysis.findings.atypicalLymphocyteSubtype =
    rawPositive.atypicalLymphocyteSubtype ||
    mergedAnalysis.findings.atypicalLymphocyteSubtype ||
    "DOWNEY_TYPE_III_IMMUNOBLASTOID";

  mergedAnalysis.normalityBlocked = true;
  mergedAnalysis.requiresHumanReview = true;

  mergedAnalysis.morphologicRiskClass =
    "CLASS_2_ATYPICAL_POPULATION";

  mergedAnalysis.riskLevel =
    "População mononuclear atípica";

  mergedAnalysis.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(mergedAnalysis.blockNormalReason)
        ? mergedAnalysis.blockNormalReason
        : []),
      "Células mononucleares grandes/atípicas",
      "População mononuclear predominante",
      "Não classificar como campo limitado simples",
    ]),
  ];
}

    mergedAnalysis =
      sanitizeNarrativeRepetition(
        mergedAnalysis,
      );

    if (analysisType === "bone_marrow") {
      mergedAnalysis =
        applyMarrowPositiveBlastEvidenceSemanticSupersession(
          mergedAnalysis,
        );
    }

    let globalPattern =
      analyzeGlobalPattern(
        mergedAnalysis,
      );

    mergedAnalysis.globalPattern =
      globalPattern;

    // BE-FIX-005.50.17 — unresolved immature-cell evidence is an epistemic
    // middle state. It must not appear as GLOBAL_UNREMARKABLE_PATTERN or a
    // physiologic marrow pattern simply because structured blast positivity
    // was correctly withheld by 005.50.15.5/005.50.16.
    if (analysisType === "bone_marrow") {
      mergedAnalysis =
        applyMarrowUnresolvedImmaturityFinalStateCoherence(mergedAnalysis);
      globalPattern = mergedAnalysis.globalPattern || globalPattern;
    }

    if (analysisType === "bone_marrow") {
      mergedAnalysis =
        applyMarrowPositiveBlastEvidenceSemanticSupersession(
          mergedAnalysis,
        );
      mergedAnalysis = applyMarrowPositiveBlastEvidencePreservation(mergedAnalysis);
      mergedAnalysis = applyMarrowPhysiologicPrecursorCoherence(mergedAnalysis);
    }

    mergedAnalysis.morphologyAnalysis =
      mergedAnalysis.morphologyAnalysis || {};

    if (
      typeof mergedAnalysis.morphologyAnalysis
        ?.visualMorphologyDescription === 'string'
    ) {

      mergedAnalysis.morphologyAnalysis
        .visualMorphologyDescription = {

        globalView:
          mergedAnalysis.morphologyAnalysis
            .visualMorphologyDescription,

        dominantPopulation: '',

        cellularity: '',

        nuclearFeatures: '',

        cytoplasmicFeatures: '',

        populationHeterogeneity: '',

        erythrocyteBackground: '',

        plateletBackground: '',

        criticalNegativeFindings: '',

        overallImpression: '',
      };
    }

    mergedAnalysis.morphologyAnalysis.visualMorphologyDescription =
      mergedAnalysis.morphologyAnalysis.visualMorphologyDescription || {

        globalView:
          'Campo microscópico avaliado com descrição global limitada pela resposta visual disponível.',

        dominantPopulation:
          mergedAnalysis.globalPattern?.dominantPattern ||
          'Não definida',

        cellularity:
          'Celularidade estimada a partir do campo analisado.',

        nuclearFeatures: '',

        cytoplasmicFeatures: '',

        populationHeterogeneity: '',

        erythrocyteBackground: '',

        plateletBackground: '',

        criticalNegativeFindings: '',

        overallImpression:
          mergedAnalysis.globalPattern?.globalSummary ||
          'Requer correlação com múltiplos campos.',
      };

    const existingVisualDescription =
      mergedAnalysis.morphologyAnalysis.visualMorphologyDescription;

    const hasValidVisualDescription =
      existingVisualDescription &&
      typeof existingVisualDescription === "object" &&
      Object.values(existingVisualDescription).some(
        (value) => String(value || "").trim().length > 0,
      );

    if (!hasValidVisualDescription) {
      mergedAnalysis.morphologyAnalysis.visualMorphologyDescription = {
        globalView:
          mergedAnalysis.whatAISees?.globalField ||
          "Campo microscópico avaliado com descrição global limitada pela resposta visual disponível.",

        dominantPopulation:
          mergedAnalysis.whatAISees?.dominantFinding ||
          mergedAnalysis.globalPattern?.dominantPattern ||
          "Não definida",

        cellularity:
          mergedAnalysis.whatAISees?.cellularity ||
          "Celularidade estimada a partir do campo analisado.",

        nuclearFeatures: "",

        cytoplasmicFeatures: "",

        populationHeterogeneity: "",

        erythrocyteBackground:
          mergedAnalysis.whatAISees?.erythrocytes || "",

        plateletBackground:
          mergedAnalysis.whatAISees?.platelets || "",

        criticalNegativeFindings:
          mergedAnalysis.whatAISees?.negativeFindings || "",

        overallImpression:
          mergedAnalysis.whatAISees?.freeNarrative ||
          mergedAnalysis.globalPattern?.globalSummary ||
          "Requer correlação com múltiplos campos.",
      };
    }

    console.log("================================");
    console.log("GLOBAL PATTERN");
    console.log(JSON.stringify(globalPattern, null, 2));
    console.log("================================");

    console.log("================================");
    console.log("NORMALIZED RESPONSE");
    console.log("FIELD ADEQUACY");
    console.log(
      JSON.stringify(
        mergedAnalysis.fieldAdequacy,
        null,
        2,
      ),
    );
    console.log(JSON.stringify(mergedAnalysis, null, 2));
    console.log("================================");
    console.log("MORPHOLOGY ANALYSIS");
    console.log(
      JSON.stringify(
        mergedAnalysis.morphologyAnalysis,
        null,
        2,
      ),
    );
    console.log("================================");

    console.log("🔥 NORMALIZED RESPONSE:");
    console.log(
      JSON.stringify(
        {
          morphologyAnalysis: mergedAnalysis.morphologyAnalysis,
          patternRecognition: mergedAnalysis.patternRecognition,
          structuredReport: mergedAnalysis.structuredReport,
          overallAssessment: mergedAnalysis.overallAssessment,
          interpretiveSynthesis: mergedAnalysis.interpretiveSynthesis,
          clinicalMeaning: mergedAnalysis.clinicalMeaning,
          hematologicReasoning: mergedAnalysis.hematologicReasoning,
        },
        null,
        2,
      ),
    );

    // Campos avançados sempre presentes para evitar cards vazios no Flutter.
    mergedAnalysis.possibleClinicalCorrelations =
      Array.isArray(mergedAnalysis.possibleClinicalCorrelations) &&
      mergedAnalysis.possibleClinicalCorrelations.length > 0
        ? mergedAnalysis.possibleClinicalCorrelations
        : [
            "Correlação com hemograma completo e revisão microscópica profissional.",
            "Padrão morfológico indeterminado quando o campo for limitado.",
            "Necessidade de avaliar múltiplos campos antes de inferir padrão reacional ou clonal.",
            "Achados devem ser interpretados conforme distribuição, repetição celular e contexto clínico.",
          ]


    mergedAnalysis.associatedEducationalHypotheses =
      Array.isArray(mergedAnalysis.associatedEducationalHypotheses) &&
      mergedAnalysis.associatedEducationalHypotheses.length > 0
        ? mergedAnalysis.associatedEducationalHypotheses
        : [
            "Hipótese morfológica indeterminada dependente de correlação com hemograma.",
            "Possível alteração reacional ou atípica, conforme repetição em múltiplos campos.",
            "Necessidade de distinguir achado isolado de população celular sustentada.",
            "Possíveis respostas adaptativas da medula óssea conforme contexto clínico-laboratorial.",
            "Limitação por imagem isolada, artefatos ou representatividade do campo.",
          ];


    mergedAnalysis.clinicalCorrelationNeeds = Array.isArray(mergedAnalysis.clinicalCorrelationNeeds)
      ? mergedAnalysis.clinicalCorrelationNeeds
      : ["Hemograma completo", "Quadro clínico", "Revisão microscópica profissional"];
    mergedAnalysis.clinicalMeaning =
      mergedAnalysis.clinicalMeaning ||
      mergedAnalysis.clinicalCorrelation?.summary ||
      mergedAnalysis.overallAssessment?.recommendedCorrelation ||
      "Os achados morfológicos identificados devem ser interpretados considerando sua relevância biológica. Alterações celulares podem refletir respostas fisiológicas, processos reacionais ou outras condições hematológicas que necessitam avaliação conjunta com hemograma completo, parâmetros quantitativos, histórico clínico e revisão microscópica profissional.";

    mergedAnalysis.interpretiveSynthesis =
      mergedAnalysis.interpretiveSynthesis ||
      mergedAnalysis.structuredReport?.morphologySummary ||
      mergedAnalysis.structuredReport?.plainTextReport ||
      mergedAnalysis.leukocyteFindings?.summary ||
      mergedAnalysis.erythrocyteFindings?.summary ||
      mergedAnalysis.overallAssessment?.mainImpression ||
      "A avaliação morfológica digital descreve características celulares observáveis na imagem analisada, incluindo padrões de maturação, alterações nucleares, citoplasmáticas e distribuição celular. A interpretação deve considerar qualidade da amostra, limitações técnicas e correlação com dados laboratoriais complementares.";
    mergedAnalysis.hematologicReasoning =
      mergedAnalysis.hematologicReasoning ||
      "A avaliação hematológica considera inicialmente a linhagem celular predominante, características nucleares, padrão de cromatina, relação núcleo/citoplasma, alterações citoplasmáticas e maturação celular. Esses elementos auxiliam na diferenciação entre padrões reacionais, fisiológicos ou alterações que necessitam investigação complementar. A análise digital deve sempre ser correlacionada com hemograma completo, histórico clínico e revisão microscópica profissional.";

    mergedAnalysis =
      applyLimitedFieldFinalLock(
        mergedAnalysis,
      );

    const extractedText =
      buildSemanticText({
        ...mergedAnalysis,
        rawResponse:
          mergedAnalysis.rawResponse || {},

        rawResponseText:
          JSON.stringify(
            mergedAnalysis.rawResponse || {},
          ),
      });

// ============================================================================
// SAFE SEMANTIC FINDINGS — não promove achados críticos por texto livre
// ============================================================================

const rawFindings =
  mergedAnalysis.rawResponse?.findings ||
  mergedAnalysis.rawResponse?.positiveFindings ||
  {};

const safeSemanticFindings = {
  largeMononuclearCells:
    rawFindings.largeMononuclearCells === true,

  reactiveLymphocytes:
    rawFindings.reactiveLymphocytes === true,

  atypicalLymphocytes:
    rawFindings.atypicalLymphocytes === true,

  plasmacytoidCells:
    rawFindings.plasmacytoidCells === true,

  plasmocytes:
    rawFindings.plasmocytes === true,

  plasmablasts:
    rawFindings.plasmablasts === true &&
    (
      rawFindings.blastSuspicion === true ||
      rawFindings.monomorphicPopulation === true
    ),

  monomorphicPopulation:
    rawFindings.monomorphicPopulation === true,

  blastSuspicion:
    rawFindings.blastSuspicion === true ||
    rawFindings.immatureCells === true,
};

console.log(
  'SEMANTIC FINDINGS',
  JSON.stringify(safeSemanticFindings, null, 2),
);

mergedAnalysis.findings = {
  ...mergedAnalysis.findings,

  largeMononuclearCells:
    safeSemanticFindings.largeMononuclearCells,

  reactiveLymphocytes:
    safeSemanticFindings.reactiveLymphocytes,

  atypicalLymphocytes:
    safeSemanticFindings.atypicalLymphocytes,

  plasmacytoidCells:
    safeSemanticFindings.plasmacytoidCells,

  plasmocytes:
    safeSemanticFindings.plasmocytes,

  plasmablasts:
    safeSemanticFindings.plasmablasts,

  monomorphicPopulation:
    safeSemanticFindings.monomorphicPopulation,

  blastSuspicion:
    safeSemanticFindings.blastSuspicion,
};

// ============================================================================
// ANTI FALSE NORMAL — REACTIVE / ATYPICAL LYMPHOID GATE
// ============================================================================

const hasReactiveOrAtypicalSignal =
  mergedAnalysis.findings?.reactiveLymphocytes === true ||
  mergedAnalysis.findings?.atypicalLymphocytes === true ||
  mergedAnalysis.findings?.largeMononuclearCells === true ||
  mergedAnalysis.findings?.monocytoidAtypicalLymphocytes === true ||
  mergedAnalysis.findings?.downeyLikeCells === true ||
  /linf[oó]cito reativo|linf[oó]citos reativos|c[eé]lula mononuclear isolada|atipia\/reatividade|reatividade/i
    .test(extractedText);

if (hasReactiveOrAtypicalSignal) {
  mergedAnalysis.normalityBlocked = true;

  mergedAnalysis.morphologicRiskClass =
    mergedAnalysis.morphologicRiskClass === "CLASS_0_NORMAL"
      ? "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL"
      : mergedAnalysis.morphologicRiskClass;

  mergedAnalysis.riskLevel =
    "Achado celular isolado / possível reatividade linfoide";

  mergedAnalysis.blockNormalReason =
    Array.isArray(mergedAnalysis.blockNormalReason)
      ? mergedAnalysis.blockNormalReason
      : [];

  mergedAnalysis.blockNormalReason.push(
    "Célula mononuclear isolada com possível reatividade/atipia impede classificação como morfologia preservada."
  );

  mergedAnalysis.blockNormalReason = [
    ...new Set(mergedAnalysis.blockNormalReason),
  ];

  mergedAnalysis.overallAssessment =
    mergedAnalysis.overallAssessment || {};

  mergedAnalysis.overallAssessment.requiresHumanReview = true;

  mergedAnalysis.overallAssessment.riskCategory =
    mergedAnalysis.morphologicRiskClass;

  mergedAnalysis.overallAssessment.mainImpression =
    "Campo limitado para caracterização leucocitária conclusiva. Há célula mononuclear isolada com possível aspecto reacional/atípico, sem critérios para blastos inequívocos ou população monomórfica neste campo.";

  mergedAnalysis.interpretiveSynthesis =
    "A imagem demonstra campo limitado com célula mononuclear isolada de possível reatividade/atipia. Esse padrão não permite afirmar ativação linfoide populacional, mas também não deve ser classificado como morfologia preservada. A interpretação deve permanecer conservadora, sem inferir processo neoplásico, e requer correlação com hemograma completo e avaliação de múltiplos campos.";

  mergedAnalysis.clinicalMeaning =
    "A presença de célula mononuclear isolada com possível reatividade pode representar resposta imunológica inespecífica, especialmente quando não há blastos, bastonetes de Auer ou células imaturas críticas. Por se tratar de campo limitado, o significado hematológico depende da frequência desse padrão em outros campos, dos dados do hemograma e do contexto clínico.";

  mergedAnalysis.hematologicReasoning =
    "O raciocínio hematológico deve diferenciar uma célula mononuclear reacional isolada de uma população atípica sustentada. Neste campo não há elementos suficientes para caracterizar população linfoide atípica, monomorfismo ou suspeita blástica. Ainda assim, a identificação de possível reatividade impede a conclusão de morfologia plenamente preservada e justifica recomendação de correlação microscópica e hematimétrica.";
}

    const engineStart = performance.now();
    const [erythrocyteAnalysis, leukocyteAnalysis, plateletAnalysis] = await Promise.all([
      analyzeErythrocytes(extractedText),
      analyzeLeukocytes(extractedText),
      analyzePlatelets(extractedText),
    ]);
    const engineTiming = logStep(requestId, "HEMATOLOGY ENGINES", engineStart);

    // Engine findings are attached as secondary evidence. They may support or
    // challenge interpretation, but never overwrite direct visual observations.
    localMorphologyEvidence = enrichLocalMorphologyEvidenceWithEngines(
      localMorphologyEvidence,
      {
        erythrocyteAnalysis,
        leukocyteAnalysis,
        plateletAnalysis,
      },
    );

    mergedAnalysis = attachLocalMorphologyEvidence(
      mergedAnalysis,
      localMorphologyEvidence,
    );

    const enrichedLocalMorphologyContractStatus =
      localMorphologyEvidenceContractStatus(localMorphologyEvidence);

    // ========================================================================
    // BE-FIX-005.5.2 — AMR PIPELINE INTEGRATION
    // AMR is derived only from the canonical LME after engine enrichment.
    // ========================================================================
    let academicMorphologyReasoning =
      createAcademicMorphologyReasoning({
        localMorphologyEvidence,
        fieldAdequacy:
          mergedAnalysis.fieldAdequacy || {},
        evidenceGovernance:
          mergedAnalysis.evidenceGovernance || {},
      });

    const academicMorphologyReasoningContract =
      academicMorphologyReasoningContractStatus(
        academicMorphologyReasoning,
      );

    mergedAnalysis =
      attachAcademicMorphologyReasoning(
        mergedAnalysis,
        academicMorphologyReasoning,
      );

    mergedAnalysis =
      projectAcademicMorphologyReasoningCompatibility(
        mergedAnalysis,
        academicMorphologyReasoning,
      );

    console.log(
      "ACADEMIC MORPHOLOGY REASONING — AMR-1.0",
      JSON.stringify(
        {
          evidenceSource:
            academicMorphologyReasoning.evidenceSource,
          evidenceAvailable:
            academicMorphologyReasoning.evidenceAvailable,
          reasoningScope:
            academicMorphologyReasoning.reasoningScope,
          whatISeeCount:
            academicMorphologyReasoning.whatISee?.length || 0,
          featureCount:
            academicMorphologyReasoning.morphologicFeatures?.length || 0,
          cannotConfirmCount:
            academicMorphologyReasoning.cannotConfirm?.length || 0,
          contract:
            academicMorphologyReasoningContract,
        },
        null,
        2,
      ),
    );

    const safetyStart = performance.now();
    const safetyValidation = validateHematologyAnalysis({
      analysis: mergedAnalysis,
      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      diagnosticCorrelation: {},
      confidenceAnalysis: {},
      analysisSource,
    });
    const safetyTiming = logStep(requestId, "SAFETY ENGINE", safetyStart);

    const consensusStart = performance.now();
    const consensusAnalysis = buildHematologyConsensus({
      analysis: mergedAnalysis,
      leukocyteAnalysis,
      erythrocyteAnalysis,
      plateletAnalysis,
      confidenceAnalysis: {},
      diagnosticCorrelation: {},
      safetyValidation,
      analysisSource,
    });
    const consensusTiming = logStep(requestId, "CONSENSUS ENGINE", consensusStart);

    let diagnosticCorrelation = buildDiagnosticCorrelation({
      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      consensusAnalysis,
      analysisSource,
    });

    if (safetyValidation?.safeDiagnosticGate === true && process.env.ENABLE_ADVANCED_CORRELATION === "true") {
      try {
        const advancedCorrelation = await Promise.race([
          correlateHematology({
            manualMetadata,
            extractedText,
            visualExtraction: mergedAnalysis.visualExtraction || {},
            morphologyAnalysis: mergedAnalysis.morphologyAnalysis || {},
            evidenceAnalysis: mergedAnalysis.visualEvidence || {},
            erythrocyteAnalysis,
            leukocyteAnalysis,
            plateletAnalysis,
            consensusAnalysis,
            analysisSource,
          }),
          new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 8000)),
        ]);
        diagnosticCorrelation = { ...diagnosticCorrelation, advancedCorrelation };
      } catch (error) {
        diagnosticCorrelation = {
          ...diagnosticCorrelation,
          advancedCorrelation: { skipped: true, reason: error.message },
        };
      }
    }

    const reactiveLymphocyteAnalysis =
      calculateReactiveLymphocyteScore({
        findings: mergedAnalysis.findings || {},
        visualEvidence: mergedAnalysis.visualEvidence || {},
      });

    mergedAnalysis.reactiveLymphocyteAnalysis =
      reactiveLymphocyteAnalysis;

    const blastMimicAnalysis =
      calculateBlastMimicRisk({
        findings: mergedAnalysis.findings || {},
        visualEvidence: mergedAnalysis.visualEvidence || {},
      });

    mergedAnalysis.blastMimicAnalysis =
      blastMimicAnalysis;

    const antiOvercallingAnalysis =
      applyAntiOvercallingRules({
        findings: mergedAnalysis.findings || {},
        reactiveLymphocyteAnalysis,
        blastMimicAnalysis,
        visualEvidence: mergedAnalysis.visualEvidence || {},
      });

    mergedAnalysis.findings =
      antiOvercallingAnalysis.adjustedFindings;

    mergedAnalysis.antiOvercallingAnalysis =
      antiOvercallingAnalysis;

// ============================================================================
// PLASMABLAST / MONOMORPHISM SAFETY LOCK
// ============================================================================

if (
  mergedAnalysis.findings?.plasmablasts === true &&
  mergedAnalysis.findings?.monomorphicPopulation !== true &&
  mergedAnalysis.findings?.blastSuspicion !== true
) {
  mergedAnalysis.findings.plasmablasts = false;

  mergedAnalysis.morphologicRiskClass =
    "CLASS_2_REACTIVE_MONONUCLEOSIS_PATTERN";

  mergedAnalysis.riskLevel =
    "Padrão reacional/atípico sem evidência de população blástica";

  mergedAnalysis.blockNormalReason =
    Array.isArray(mergedAnalysis.blockNormalReason)
      ? mergedAnalysis.blockNormalReason
      : [];

  mergedAnalysis.blockNormalReason.push(
    "Plasmoblasto não sustentado por monomorfismo ou suspeita blástica inequívoca."
  );

  mergedAnalysis.blockNormalReason =
    [...new Set(mergedAnalysis.blockNormalReason)];
}

    const lymphoidPatternAnalysis =
      classifyLymphoidPattern({
        findings: mergedAnalysis.findings || {},
        visualEvidence: mergedAnalysis.visualEvidence || {},
        fieldAdequacy: mergedAnalysis.fieldAdequacy || {},
      });

    mergedAnalysis.lymphoidPatternAnalysis =
      lymphoidPatternAnalysis;

    if (
      lymphoidPatternAnalysis.forceDowngrade === true
    ) {
      mergedAnalysis.findings.monomorphicPopulation = false;

      if (
        mergedAnalysis.morphologicRiskClass ===
          "CLASS_5_HIGH_NEOPLASTIC_SUSPICION" ||
        mergedAnalysis.morphologicRiskClass ===
          "CLASS_3_POSSIBLE_CLONALITY"
      ) {
        mergedAnalysis.morphologicRiskClass =
          lymphoidPatternAnalysis.riskCeiling;
      }

      mergedAnalysis.riskLevel =
        "Padrão linfoide atípico/indeterminado com necessidade de correlação";

      mergedAnalysis.overallAssessment =
        mergedAnalysis.overallAssessment || {};

      mergedAnalysis.overallAssessment.requiresHumanReview = true;

      mergedAnalysis.overallAssessment.riskCategory =
        mergedAnalysis.morphologicRiskClass;
    }

    const confidenceStart = performance.now();

    console.log(
      "VISUAL EVIDENCE CHECK",
      JSON.stringify(
        {
          raw: mergedAnalysis?.rawResponse?.visualEvidence,
          normalized: mergedAnalysis?.visualEvidence,
        },
        null,
        2,
      ),
    );

    const confidenceAnalysis = buildConfidenceAnalysis({
      analysis: mergedAnalysis,

      visualEvidence:
        mergedAnalysis.visualEvidence ||
        mergedAnalysis.rawResponse?.visualEvidence ||
        {},

      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      diagnosticCorrelation,
      consensusResult: consensusAnalysis,
      analysisSource,
    });
    const confidenceTiming = logStep(requestId, "CONFIDENCE ENGINE", confidenceStart);

    if (analysisType === "bone_marrow") {
      mergedAnalysis.confidenceAnalysis = confidenceAnalysis;
      mergedAnalysis.executiveSummary = {
        ...(mergedAnalysis.executiveSummary || {}),
        confidence:
          `${Number(confidenceAnalysis?.globalConfidenceScore || 0)}%`,
      };
    }

    let finalStructuredReport = mergedAnalysis?.structuredReport || {};

    const riskClass =
      mergedAnalysis?.morphologicRiskClass || '';

    finalStructuredReport = {
      ...finalStructuredReport,

      conclusion:
        mergedAnalysis?.overallAssessment?.mainImpression ||
        mergedAnalysis?.riskLevel ||
        'Achado hematológico inespecífico.',

      hematologicMeaning:
        mergedAnalysis?.clinicalMeaning ||
        'A interpretação depende de correlação clínico-laboratorial.',

      recommendation:
        mergedAnalysis?.overallAssessment
          ?.recommendedCorrelation ||
        'Correlacionar com hemograma completo e avaliação microscópica profissional.',
    };

    const currentRiskClass =
      mergedAnalysis?.morphologicRiskClass || '';

    if (
      currentRiskClass ===
      'CLASS_1_LIMITED_FIELD_ATYPICAL_CELL'
    ) {
      finalStructuredReport = {
        ...finalStructuredReport,

        conclusion:
          'Campo microscópico limitado com célula mononuclear isolada de possível natureza reacional. Não foram observados elementos inequívocos de blastos ou população neoplásica neste campo analisado.',

        hematologicMeaning:
          'Achado focal e isolado, insuficiente para caracterização de processo proliferativo. Recomenda-se correlação clínica e avaliação de múltiplos campos da lâmina.',

        recommendation:
          'Correlacionar com hemograma completo, quadro clínico e revisão microscópica profissional.',
      };
    }

    if (!safetyValidation?.safeDiagnosticGate) {
      finalStructuredReport = {
        ...finalStructuredReport,
        recommendation: finalStructuredReport?.recommendation ||
          "Revisão microscópica manual recomendada.",
      };

      mergedAnalysis.overallAssessment = {
        ...(mergedAnalysis.overallAssessment || {}),
        requiresHumanReview: true,
        safeMode: true,
        recommendedCorrelation:
          mergedAnalysis.overallAssessment?.recommendedCorrelation ||
          "Correlação hematológica presencial recomendada.",
      };
    }

    const totalPipelineTime = logStep(requestId, "TOTAL PIPELINE TURBO", pipelineStart);

    return {

      ...mergedAnalysis,
      processingTimeMs: totalPipelineTime,
      structuredReport: finalStructuredReport,
      manualMetadata,
      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      diagnosticCorrelation,
      confidenceAnalysis,
      reactiveLymphocyteAnalysis,
      blastMimicAnalysis,
      antiOvercallingAnalysis,
      lymphoidPatternAnalysis,
      consensusAnalysis,
      safetyValidation,
      localMorphologyEvidence,
      localMorphologyEvidenceContract: enrichedLocalMorphologyContractStatus,
      academicMorphologyReasoning,
      academicMorphologyReasoningContract,
      pipeline: {
        version: "V8_TURBO_ENTERPRISE",
        academicMorphologyReasoningVersion: "AMR-1.0",
        academicMorphologyReasoningIntegrated: true,
        source: analysisSource,
        multiStagePipeline: true,
        turboSingleOpenAICall: true,
        visualExtraction: true,
        morphologyValidation: true,
        evidenceEngine: true,
        safetyGate: true,
        consensusValidation: true,
        clinicalCorrelation: safetyValidation?.safeDiagnosticGate === true,
        safeClinicalMode: !safetyValidation?.safeDiagnosticGate || consensusAnalysis?.safeClinicalMode || false,
        manualMode: analysisSource === "manual",
        hybridMode: analysisSource === "hybrid",
        aiVisualMode: analysisSource === "ai_visual",
      },
      metadata: {
        requestId,
        model: OPENAI_MODEL,
        pipelineVersion: "V8_TURBO_ENTERPRISE",
        academicMorphologyReasoningVersion: "AMR-1.0",
        architecture: "turbo_semantic_hematology_engine",
        hospitalGrade: true,
        educationalMode: true,
        images: images.length,
        imageMetadata,
        visualEvidenceScore: safetyValidation?.visualEvidenceScore || 0,
        morphologyCoherence: safetyValidation?.morphologyCoherence || 0,
        falsePositiveRisk: safetyValidation?.falsePositiveRisk || 0,
        diagnosticReliability: safetyValidation?.diagnosticReliability || 0,
        artifactProbability: safetyValidation?.artifactProbability || 0,
        safeDiagnosticGate: safetyValidation?.safeDiagnosticGate || false,
        analysisSource,
        performance: {
          imageTiming,
          visualTiming,
          engineTiming,
          safetyTiming,
          consensusTiming,
          confidenceTiming,
          totalPipelineTime,
        },
      },
    };
  } catch (error) {
    console.error("TURBO PIPELINE ERROR:", error);

    // ======================================================================
    // BE-FIX-005.21.1 — GPT-5.5 REASONING COMPATIBILITY & HARD FAILURE
    // A technical failure before valid VME acquisition is not morphology.
    // Never allow it to continue through clinical normalization/governors.
    // ======================================================================
    return {
      success: false,
      errorCode: "VISUAL_ACQUISITION_TECHNICAL_FAILURE",
      error:
        "A aquisição morfológica visual foi interrompida por uma falha técnica antes da formação de evidência válida.",
      requiresRetry: true,
      requiresHumanReview: true,
      visualEvidenceAcquisitionIncomplete: true,
      safetyValidation: { safeDiagnosticGate: false },
      metadata: {
        requestId,
        safeFailureMode: true,
        reportSuppressed: true,
        reasoningCompatibilityVersion:
          VME_REASONING_COMPATIBILITY_VERSION,
        upstreamErrorCode:
          error?.code || error?.error?.code || null,
        upstreamErrorParam:
          error?.param || error?.error?.param || null,
      },
      pipeline: {
        failed: true,
        failedClosed: true,
        visualAcquisitionOnly: true,
        version: "V8_TURBO_ENTERPRISE",
        vmeLengthExhaustionRecoveryVersion:
          VME_LENGTH_EXHAUSTION_RECOVERY_VERSION,
        vmeReasoningCompatibilityVersion:
          VME_REASONING_COMPATIBILITY_VERSION,
      },
    };
  }
}


// ============================================================================
// VALIDATION
// ============================================================================

function validateAIResult(
  result,
) {

  if (!result) {

    return {

      valid: false,

      error:
        "Resultado vazio.",
    };
  }

  if (!result.counts) {
    result.counts = {};
  }

  if (!result.morphologies) {
    result.morphologies = [];
  }

  if (!result.alerts) {
    result.alerts = [];
  }

  if (!result.observations) {
    result.observations = "";
  }

  if (!result.summary) {
    result.summary = "";
  }

  if (!result.riskLevel) {

    result.riskLevel =
      "Indefinido";
  }

  const atypicalFlags = [
    result?.findings?.reactiveLymphocytes,
    result?.findings?.atypicalLymphocytes,
    result?.findings?.largeMononuclearCells,
    result?.findings?.monocytoidAtypicalLymphocytes,
    result?.findings?.downeyLikeCells,
  ].some((v) => v === true);

  if (atypicalFlags) {
    result.normalityBlocked = true;

    result.overallAssessment =
      result.overallAssessment || {};

    result.overallAssessment.requiresHumanReview = true;

    if (
      result.morphologicRiskClass === "CLASS_0_NORMAL" ||
      !result.morphologicRiskClass
    ) {
      result.morphologicRiskClass =
        "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";
    }

    result.riskLevel =
      result.riskLevel === "Indefinido"
        ? "Achado celular isolado / possível reatividade linfoide"
        : result.riskLevel;

    result.blockNormalReason =
      Array.isArray(result.blockNormalReason)
        ? result.blockNormalReason
        : [];

    result.blockNormalReason.push(
      "Sinal de reatividade/atipia celular impede classificação como morfologia preservada."
    );

    result.blockNormalReason =
      [...new Set(result.blockNormalReason)];
  }

  return {

    valid: true,

    result,
  };
}

function ensurePipelineObjects(result) {
  const safeResult =
    result && typeof result === "object"
      ? result
      : {};

  // =====================================================
  // HEMATOLOGIC REASONING
  // =====================================================

  const originalReasoning =
    safeResult.hematologicReasoning;

  if (
    typeof originalReasoning === "string"
  ) {
    safeResult.hematologicReasoning = {
      whatISee: "",
      whatItResembles: "",
      whatICannotConfirm: "",
      finalInterpretation:
        originalReasoning,
    };
  } else if (
    !originalReasoning ||
    typeof originalReasoning !== "object" ||
    Array.isArray(originalReasoning)
  ) {
    safeResult.hematologicReasoning = {
      whatISee: "",
      whatItResembles: "",
      whatICannotConfirm: "",
      finalInterpretation: "",
    };
  } else {
    safeResult.hematologicReasoning = {
      whatISee:
        String(
          originalReasoning.whatISee || "",
        ),
      whatItResembles:
        String(
          originalReasoning.whatItResembles || "",
        ),
      whatICannotConfirm:
        String(
          originalReasoning.whatICannotConfirm || "",
        ),
      finalInterpretation:
        String(
          originalReasoning.finalInterpretation || "",
        ),
    };
  }

  // =====================================================
  // STRUCTURED REPORT
  // =====================================================

  const originalReport =
    safeResult.structuredReport;

  if (
    typeof originalReport === "string"
  ) {
    safeResult.structuredReport = {
      conclusion: originalReport,
      hematologicMeaning: "",
      recommendation: "",
    };
  } else if (
    !originalReport ||
    typeof originalReport !== "object" ||
    Array.isArray(originalReport)
  ) {
    safeResult.structuredReport = {
      conclusion: "",
      hematologicMeaning: "",
      recommendation: "",
    };
  }

  // =====================================================
  // OVERALL ASSESSMENT
  // =====================================================

  const originalAssessment =
    safeResult.overallAssessment;

  if (
    typeof originalAssessment === "string"
  ) {
    safeResult.overallAssessment = {
      requiresHumanReview: true,
      riskCategory:
        safeResult.morphologicRiskClass || "",
      mainImpression:
        originalAssessment,
    };
  } else if (
    !originalAssessment ||
    typeof originalAssessment !== "object" ||
    Array.isArray(originalAssessment)
  ) {
    safeResult.overallAssessment = {
      requiresHumanReview: true,
      riskCategory:
        safeResult.morphologicRiskClass || "",
      mainImpression: "",
    };
  }

  // =====================================================
  // MORPHOLOGY ANALYSIS
  // =====================================================

  const originalMorphology =
    safeResult.morphologyAnalysis;

  if (
    typeof originalMorphology === "string"
  ) {
    safeResult.morphologyAnalysis = {
      overview: originalMorphology,
      erythrocyteReview: "",
      leukocyteReview: "",
      plateletReview: "",
      biologicalInterpretation: "",
      differentialDiagnosis: "",
      summary: originalMorphology,
    };
  } else if (
    !originalMorphology ||
    typeof originalMorphology !== "object" ||
    Array.isArray(originalMorphology)
  ) {
    safeResult.morphologyAnalysis = {};
  }

  // =====================================================
  // FINDINGS AND ARRAYS
  // =====================================================

  if (
    !safeResult.findings ||
    typeof safeResult.findings !== "object" ||
    Array.isArray(safeResult.findings)
  ) {
    safeResult.findings = {};
  }

  if (
    !Array.isArray(
      safeResult.blockNormalReason,
    )
  ) {
    safeResult.blockNormalReason = [];
  }

  if (!Array.isArray(safeResult.alerts)) {
    safeResult.alerts = [];
  }

  if (
    !Array.isArray(
      safeResult.morphologies,
    )
  ) {
    safeResult.morphologies = [];
  }

  if (
    !safeResult.counts ||
    typeof safeResult.counts !== "object" ||
    Array.isArray(safeResult.counts)
  ) {
    safeResult.counts = {};
  }

  return safeResult;
}


// ============================================================================
// CI-002C.2 — FEATURE MATCHER
// ============================================================================

app.post(
  "/knowledge/morphology/match-features",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const results =
      morphologyFeatureMatcher
        .matcher
        .match(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      featureMatcher: {
        version:
          "CI-002C.2-v1",
        candidateCount:
          results.length,
        specimenType,
        results,
      },
    });
  },
);


// ============================================================================
// CI-002C.3 — MORPHOLOGIC SCORE CALCULATOR
// ============================================================================

app.post(
  "/knowledge/morphology/score-features",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      morphologyScoringEngine
        .score(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      scoreEngine: {
        version:
          "CI-002C.3-v1",
        specimenType,
        candidateCount:
          result.scores.length,
        scores:
          result.scores,
      },
    });
  },
);


// ============================================================================
// CI-002C.4 — MORPHOLOGIC CANDIDATE GENERATOR
// ============================================================================

app.post(
  "/knowledge/morphology/generate-candidates",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      morphologyCandidateEngine
        .generate(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      candidateEngine: {
        version:
          "CI-002C.4-v1",
        specimenType,
        eligibleCount:
          result.candidates
            .eligible.length,
        rejectedCount:
          result.candidates
            .rejected.length,
        candidates:
          result.candidates,
      },
    });
  },
);


// ============================================================================
// CI-002C.5 — MORPHOLOGIC RANKING ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/rank-candidates",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      morphologyRankingEngine
        .rankFeatures(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      rankingEngine: {
        version:
          "CI-002C.5-v1",
        specimenType,
        candidateCount:
          result.ranking
            .ranking.length,
        winner:
          result.ranking
            .winner,
        runnerUp:
          result.ranking
            .runnerUp,
        summary:
          result.ranking
            .summary,
        ranking:
          result.ranking
            .ranking,
      },
    });
  },
);


// ============================================================================
// CI-002C.6 — MORPHOLOGIC CONFIDENCE ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/calculate-confidence",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      morphologyConfidenceEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      confidenceEngine: {
        version:
          "CI-002C.6-v1",
        specimenType,
        winner:
          result.ranked
            .ranking
            .winner,
        ranking:
          result.ranked
            .ranking
            .ranking,
        confidence:
          result.confidence,
      },
    });
  },
);


// ============================================================================
// CI-002C.7 — MORPHOLOGIC EXPLANATION ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/explain-decision",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      morphologyExplanationEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      explanationEngine: {
        version:
          "CI-002C.7-v1",
        specimenType,
        winner:
          result.explanation
            .winner,
        runnerUp:
          result.explanation
            .runnerUp,
        confidence:
          result.explanation
            .confidence,
        narrative:
          result.explanation
            .narrative,
        evidence:
          result.explanation
            .evidence,
        alternatives:
          result.explanation
            .alternatives,
        rejectedCandidates:
          result.explanation
            .rejectedCandidates,
        humanReviewRecommended:
          result.explanation
            .humanReviewRecommended,
        reviewReasons:
          result.explanation
            .reviewReasons,
        rankingPreserved:
          result.explanation
            .rankingPreserved,
        confidencePreserved:
          result.explanation
            .confidencePreserved,
      },
    });
  },
);


// ============================================================================
// CI-002C.8 — MORPHOLOGIC EVIDENCE GRAPH
// ============================================================================

app.post(
  "/knowledge/morphology/build-evidence-graph",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      morphologyEvidenceGraphEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      evidenceGraphEngine: {
        version:
          "CI-002C.8-v1",
        specimenType,
        winner:
          result.explained
            .explanation
            .winner,
        confidence:
          result.explained
            .explanation
            .confidence,
        graph:
          result.graph,
      },
    });
  },
);


// ============================================================================
// CI-002D.1 — DIFFERENTIAL RULE LIBRARY
// ============================================================================

app.get(
  "/knowledge/morphology/differential-rules/pair",
  auth,
  (req, res) => {
    const firstCell =
      String(
        req.query?.firstCell || "",
      ).trim();

    const secondCell =
      String(
        req.query?.secondCell || "",
      ).trim();

    if (
      !firstCell ||
      !secondCell
    ) {
      return res.status(400).json({
        success: false,
        error:
          "firstCell and secondCell are required.",
      });
    }

    const rule =
      differentialRuleLibrary
        .repository
        .getByPair(
          firstCell,
          secondCell,
        );

    if (!rule) {
      return res.status(404).json({
        success: false,
        error:
          "Differential pair not found.",
      });
    }

    return res.json({
      success: true,
      differentialRule: rule,
    });
  },
);


// ============================================================================
// CI-002D.2 — DIFFERENTIAL PAIR BUILDER
// ============================================================================

app.post(
  "/knowledge/morphology/build-differential-pairs",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      differentialPairBuilderEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      differentialPairBuilder: {
        version:
          "CI-002D.2-v1",
        specimenType,
        winner:
          result.pairs
            .winner,
        statistics:
          result.pairs
            .statistics,
        eligiblePairs:
          result.pairs
            .eligiblePairs,
        rejectedPairs:
          result.pairs
            .rejectedPairs,
      },
    });
  },
);


// ============================================================================
// CI-002D.3 — DIFFERENTIAL SIMILARITY CALCULATOR
// ============================================================================

app.post(
  "/knowledge/morphology/calculate-differential-similarity",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      differentialSimilarityEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      differentialSimilarityCalculator: {
        version:
          "CI-002D.3-v1",
        specimenType,
        pairStatistics:
          result.pairAnalysis
            .pairs
            .statistics,
        similarityCount:
          result.similarities.length,
        similarities:
          result.similarities,
      },
    });
  },
);


// ============================================================================
// CI-002D.4 — DIFFERENTIAL EVIDENCE ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/build-differential-evidence",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      differentialEvidenceEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      differentialEvidenceEngine: {
        version:
          "CI-002D.4-v1",
        specimenType,
        evidenceCount:
          result.evidence.length,
        evidence:
          result.evidence,
      },
    });
  },
);


// ============================================================================
// CI-002D.5 — EXCLUSIVE FEATURE ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/analyze-exclusive-features",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      exclusiveFeatureEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      exclusiveFeatureEngine: {
        version:
          "CI-002D.5-v1",
        specimenType,
        resultCount:
          result.exclusiveFeatures.length,
        results:
          result.exclusiveFeatures,
      },
    });
  },
);


// ============================================================================
// CI-002D.6 — DIAGNOSTIC CONFLICT ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/analyze-diagnostic-conflicts",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      diagnosticConflictEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      diagnosticConflictEngine: {
        version:
          "CI-002D.6-v1",
        specimenType,
        conflictCount:
          result.conflicts.length,
        conflicts:
          result.conflicts,
      },
    });
  },
);


// ============================================================================
// CI-002D.7 — DIFFERENTIAL RECOMMENDATION ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/recommend-differential",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      differentialRecommendationEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      differentialRecommendationEngine: {
        version:
          "CI-002D.7-v1",
        specimenType,
        recommendationCount:
          result.recommendations.length,
        recommendations:
          result.recommendations,
      },
    });
  },
);


// ============================================================================
// CI-002D.8 — FINAL DIFFERENTIAL DIAGNOSIS ENGINE
// ============================================================================

app.post(
  "/knowledge/morphology/final-differential",
  auth,
  jsonBodyParser({
    limit: "1mb",
  }),
  (req, res) => {
    const features =
      req.body?.features || {};

    const specimenType =
      req.body?.specimenType || null;

    const result =
      finalDifferentialDiagnosisEngine
        .analyze(
          features,
          {
            specimenType,
          },
        );

    return res.json({
      success: true,
      finalDifferentialDiagnosis:
        result,
    });
  },
);

// ============================================================================
// SYSTEM ROUTES
// ============================================================================

registerSystemRoutes({
  app,
  model: OPENAI_MODEL,
});

registerOperationalStatusRoutes({
  app,
  auth,
  morphologyKnowledgeRegistry,
  morphologyCriteriaEngine,
  differentialRuleLibrary,
});


// ============================================================================
// BE-FIX-005.9 — PUBLIC RUNTIME FINGERPRINT
// ============================================================================
app.get("/runtime-version", (_req, res) => {
  return res.json({
    success: true,
    product: "CELLCOUNT HEMATOLOGY ENTERPRISE",
    pipeline: "V8_TURBO_ENTERPRISE",
    productionVmeEnforcementVersion:
      PRODUCTION_VME_ENFORCEMENT_VERSION,
    localMorphologyAcquisitionRecoveryVersion:
      LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
    vmeLengthExhaustionRecoveryVersion:
      VME_LENGTH_EXHAUSTION_RECOVERY_VERSION,
    vmeReasoningCompatibilityVersion:
      VME_REASONING_COMPATIBILITY_VERSION,
    vmeEffectiveReasoningEnforcementVersion:
      VME_EFFECTIVE_REASONING_ENFORCEMENT_VERSION,
    finalAnalysisAssemblyRecoveryVersion: "BE-FIX-005.10",
    evidenceConsistentMorphologySynthesisVersion:
      EVIDENCE_CONSISTENT_MORPHOLOGY_SYNTHESIS_VERSION,
    singleBlastSentinelVersion:
      SINGLE_BLAST_SENTINEL_VERSION,
    parasiteEvidenceSentinelVersion:
      PARASITE_EVIDENCE_SENTINEL_VERSION,
    hemoparasiteHighSalienceVersion:
      HEMOPARASITE_HIGH_SALIENCE_SENTINEL_VERSION,
    marrowBlastPopulationGovernanceVersion:
      MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
    marrowPositiveEvidencePriorityLockVersion:
      MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
    marrowPrecursorDiscriminationVersion:
      MARROW_PRECURSOR_DISCRIMINATION_VERSION,
    marrowPrecursorRebalancingVersion:
      MARROW_PRECURSOR_REBALANCING_VERSION,
    marrowDualAxisBlastScoringVersion:
      MARROW_DUAL_AXIS_SCORING_VERSION,
    marrowArchitectureGatedBlastEscalationVersion:
      MARROW_ARCHITECTURE_GATED_BLAST_ESCALATION_VERSION,
    marrowMyeloidMaturationEvidenceProjectionVersion:
      MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION,
    marrowExpansionClassificationRecoveryVersion:
      MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION,
    marrowPopulationInferenceRepresentativityGateVersion:
      MARROW_POPULATION_INFERENCE_REPRESENTATIVITY_GATE_VERSION,
    marrowDominantPatternStateReconciliationVersion:
      MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
    marrowPrecursorBlastSemanticSeparationVersion:
      MARROW_PRECURSOR_BLAST_SEMANTIC_SEPARATION_VERSION,
    marrowGlobalPatternReconciliationVersion:
      MARROW_GLOBAL_PATTERN_RECONCILIATION_VERSION,
    marrowFinalConfidenceReconciliationVersion:
      MARROW_FINAL_CONFIDENCE_RECONCILIATION_VERSION,
    marrowFinalGlobalPatternCoherenceVersion:
      MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
    marrowPositiveBlastEvidenceSemanticSupersessionVersion:
      MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
    marrowFinalBlastProjectionLockVersion:
      MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION,
    marrowFinalClinicalAuthorityVersion:
      MARROW_FINAL_CLINICAL_AUTHORITY_VERSION,
    marrowPostLegacyReconciliationVersion:
      MARROW_POST_LEGACY_RECONCILIATION_VERSION,
    marrowAdequacyMorphologyAxisSeparationVersion:
      MARROW_ADEQUACY_MORPHOLOGY_AXIS_SEPARATION_VERSION,
    marrowFinalGovernorAxisSeparationVersion:
      MARROW_FINAL_GOVERNOR_AXIS_SEPARATION_VERSION,
    marrowTerminalMorphologyAdequacyProjectionLockVersion:
      MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
    marrowLimitedFieldAxisNonOverrideVersion:
      MARROW_LIMITED_FIELD_AXIS_NON_OVERRIDE_VERSION,
    confidenceMarrowTerminalMorphologyAdequacyProjectionLockVersion:
      CONFIDENCE_MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
    finalResultInitializationOrderHotfixVersion:
      FINAL_RESULT_INITIALIZATION_ORDER_HOTFIX_VERSION,
    marrowMyeloproliferativePatternCorrelationVersion:
      MARROW_MYELOPROLIFERATIVE_PATTERN_CORRELATION_VERSION,
    marrowSeverityCriticalityCalibrationVersion:
      MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
    marrowConfidenceCriticalityAxisSeparationVersion:
      MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION,
    marrowBcrAbl1RecommendationGateVersion:
      MARROW_BCR_ABL1_RECOMMENDATION_GATE_VERSION,
    marrowHighSalienceCriticalityLockVersion:
      MARROW_HIGH_SALIENCE_CRITICALITY_LOCK_VERSION,
    terminalClinicalCriticalityAuthorityVersion:
      "BE-FIX-005.50.3",
    canonicalNarrativeAuthorityVersion:
      "BE-FIX-005.50.2",
    positiveRbcMorphologyPreservationVersion:
      "BE-FIX-005.50.2",
    canonicalClinicalPresentationAuthorityVersion:
      CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    canonicalClinicalNarrativeDeduplicationVersion:
      CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    marrowEvidenceWeightedCriticalityVersion:
      MARROW_EVIDENCE_WEIGHTED_CRITICALITY_VERSION,
    marrowCoreMyeloidSalienceCalibrationVersion:
      MARROW_CORE_MYELOID_SALIENCE_CALIBRATION_VERSION,
    marrowPopulationCriticalityRepresentativityGateVersion:
      MARROW_POPULATION_CRITICALITY_REPRESENTATIVITY_GATE_VERSION,
    marrowResidualBlastSemanticCleanupVersion:
      MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
    marrowImmaturityMaturationSemanticSeparationVersion:
      MARROW_IMMATURITY_MATURATION_SEMANTIC_SEPARATION_VERSION,
    marrowMaturationEvidenceProjectionVersion:
      MARROW_MATURATION_EVIDENCE_PROJECTION_VERSION,
    marrowPostRecoveryMaturationContinuumReevaluationVersion:
      MARROW_POST_RECOVERY_MATURATION_CONTINUUM_REEVALUATION_VERSION,
    marrowPositiveRecoveredBlastoidCytologyContinuumLockVersion:
      MARROW_POSITIVE_RECOVERED_BLASTOID_CYTOLOGY_CONTINUUM_LOCK_VERSION,
    marrowScopePropagationRecoveryVersion:
      MARROW_SCOPE_PROPAGATION_RECOVERY_VERSION,
    marrowBlastEvidenceReconciliationVersion:
      MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION,
    marrowNarrativeStructureContradictionVersion:
      MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION,
    marrowPhysiologicDominanceRecoveryVersion:
      MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION,
    marrowPositiveBlastE2EPreservationVersion:
      MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
    marrowPhysiologicPrecursorCoherenceVersion:
      MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION,
    marrowGlobalPatternCoherenceVersion:
      MARROW_GLOBAL_PATTERN_COHERENCE_VERSION,
    marrowFinalResultCoherenceVersion:
      MARROW_FINAL_RESULT_COHERENCE_VERSION,
    assessabilityConsistentNegativeFindingsVersion:
      ASSESSABILITY_CONSISTENT_NEGATIVE_FINDINGS_VERSION,
    marrowImmatureCellCytologyRecoveryVersion:
      MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION,
    marrowBlastoidCandidatePreservationVersion:
      MARROW_BLASTOID_CANDIDATE_PRESERVATION_VERSION,
    marrowImmatureCytomorphologyAcquisitionStabilityVersion:
      MARROW_IMMATURE_CYTOMORPHOLOGY_ACQUISITION_STABILITY_VERSION,
    marrowCrossPassEvidencePreservationVersion:
      MARROW_CROSS_PASS_EVIDENCE_PRESERVATION_VERSION,
    marrowCrossPassImmatureCytomorphologyRecoveryVersion:
      MARROW_CROSS_PASS_IMMATURE_CYTOMORPHOLOGY_RECOVERY_VERSION,
    marrowUnresolvedImmaturitySemanticTriggerVersion:
      MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_TRIGGER_VERSION,
    marrowStabilityRecoveryUnresolvedLockVersion:
      MARROW_STABILITY_RECOVERY_UNRESOLVED_LOCK_VERSION,
    marrowPrimaryPositiveCytologyStabilityRecoveryVersion:
      MARROW_PRIMARY_POSITIVE_CYTOLOGY_STABILITY_RECOVERY_VERSION,
    marrowImmatureBlastoidCellLevelCytomorphologyAcquisitionRecoveryVersion:
      MARROW_IMMATURE_BLASTOID_CELL_LEVEL_CYTOMORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
    marrowCellLevelUnresolvedImmaturityLockVersion:
      MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_LOCK_VERSION,
    marrowCellLevelCytomorphologyRecoveryVersion:
      MARROW_CELL_LEVEL_CYTOMORPHOLOGY_RECOVERY_VERSION,
    marrowCellLevelUnresolvedImmaturityPreservationVersion:
      MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_PRESERVATION_VERSION,
    marrowCellLevelUnresolvedImmaturityContinuumGateVersion:
      MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_CONTINUUM_GATE_VERSION,
    marrowUnresolvedImmaturityFinalStateCoherenceVersion:
      MARROW_UNRESOLVED_IMMATURITY_FINAL_STATE_COHERENCE_VERSION,
    marrowUnresolvedImmaturityGlobalPatternLockVersion:
      MARROW_UNRESOLVED_IMMATURITY_GLOBAL_PATTERN_LOCK_VERSION,
    marrowUnresolvedImmaturityPresentationLockVersion:
      MARROW_UNRESOLVED_IMMATURITY_PRESENTATION_LOCK_VERSION,
    clinicalInternalVersionTagSanitizationVersion:
      CLINICAL_INTERNAL_VERSION_TAG_SANITIZATION_VERSION,
    marrowRepairEvidenceStateSemanticCanonicalizationVersion:
      MARROW_REPAIR_EVIDENCE_STATE_SEMANTIC_CANONICALIZATION_VERSION,
    marrowUnresolvedImmaturitySemanticRecoveryVersion:
      MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_RECOVERY_VERSION,
    marrowRecoveredImmatureCardinalityUnresolvedLockVersion:
      MARROW_RECOVERED_IMMATURE_CARDINALITY_UNRESOLVED_LOCK_VERSION,
    marrowRecoveredCytologyProjectionVersion:
      MARROW_RECOVERED_CYTOLOGY_PROJECTION_VERSION,
    marrowPositiveBlastE2ELockVersion:
      MARROW_POSITIVE_BLAST_E2E_LOCK_VERSION,
    marrowFocalCytologyContextualizationVersion:
      MARROW_FOCAL_CYTOLOGY_CONTEXTUALIZATION_VERSION,
    marrowPositiveCytologyConsistencyVersion:
      MARROW_POSITIVE_CYTOLOGY_CONSISTENCY_VERSION,
    marrowAcquisitionDiscordanceRecoveryVersion:
      MARROW_ACQUISITION_DISCORDANCE_RECOVERY_VERSION,
    marrowPrimaryOrRecoveredPositiveBlastoidCytologyPreservationVersion:
      MARROW_PRIMARY_OR_RECOVERED_POSITIVE_BLASTOID_CYTOLOGY_PRESERVATION_VERSION,
    marrowRepairEvidenceMergeVersion:
      MARROW_REPAIR_EVIDENCE_MERGE_VERSION,
    marrowPositiveCytologyCardinalityPreservationVersion:
      MARROW_POSITIVE_CYTOLOGY_CARDINALITY_PRESERVATION_VERSION,
    marrowRepairArchitectureProvenanceVersion:
      MARROW_REPAIR_ARCHITECTURE_PROVENANCE_VERSION,
    marrowCytologyToArchitectureAntiFabricationVersion:
      MARROW_CYTOLOGY_TO_ARCHITECTURE_ANTIFABRICATION_VERSION,
    marrowMaturationContinuumDiscriminationVersion:
      MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION,
    marrowPhysiologicImmaturityContainmentVersion:
      MARROW_PHYSIOLOGIC_IMMATURITY_CONTAINMENT_VERSION,
    marrowMyeloidExpansionDiscriminationVersion:
      MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION,
    marrowPathologicMaturationContinuumVersion:
      MARROW_PATHOLOGIC_MATURATION_CONTINUUM_VERSION,
    boneMarrowCompactAcquisitionVersion:
      BONE_MARROW_COMPACT_ACQUISITION_VERSION,
    boneMarrowCompleteLengthRecoveryVersion:
      BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION,
    reactiveLymphoidEvidenceSentinelVersion:
      REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
    peripheralBloodPositiveMorphologyArbitrationVersion:
      PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION,
    peripheralPolychromasiaPreservationVersion:
      PERIPHERAL_POLYCHROMASIA_PRESERVATION_VERSION,
    peripheralPolychromasiaContradictionGuardVersion:
      PERIPHERAL_POLYCHROMASIA_CONTRADICTION_GUARD_VERSION,
    peripheralHematopoieticParasiteArbitrationVersion:
      PERIPHERAL_HEMATOPOIETIC_PARASITE_ARBITRATION_VERSION,
    peripheralLimitedFieldNonSuppressionVersion:
      PERIPHERAL_LIMITED_FIELD_NON_SUPPRESSION_VERSION,
    peripheralBlastoidCytologyAuthorityVersion:
      PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
    peripheralNegativeFindingAuthorityControlVersion:
      PERIPHERAL_NEGATIVE_FINDING_AUTHORITY_CONTROL_VERSION,
    peripheralFocalVsPopulationSeparationVersion:
      PERIPHERAL_FOCAL_VS_POPULATION_SEPARATION_VERSION,
    peripheralFocalBlastoidCardinalityAuthorityVersion:
      PERIPHERAL_FOCAL_BLASTOID_CARDINALITY_AUTHORITY_VERSION,
    peripheralFocalBlastoidPresentationLockVersion:
      PERIPHERAL_FOCAL_BLASTOID_PRESENTATION_LOCK_VERSION,
    peripheralFocalCardinalitySignalVersion:
      PERIPHERAL_FOCAL_CARDINALITY_SIGNAL_VERSION,
    peripheralFocalCellCytomorphologyVersion:
      PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
    peripheralMaturationStateResolutionVersion:
      PERIPHERAL_MATURATION_STATE_RESOLUTION_VERSION,
    peripheralCellFeatureProvenanceVersion:
      PERIPHERAL_CELL_FEATURE_PROVENANCE_VERSION,
    peripheralFocalCytomorphologyCalibrationVersion:
      PERIPHERAL_FOCAL_CYTOMORPHOLOGY_CALIBRATION_VERSION,
    peripheralMaturityPositiveSupportGateVersion:
      PERIPHERAL_MATURITY_POSITIVE_SUPPORT_GATE_VERSION,
    peripheralUnresolvedFeatureDowngradeVersion:
      PERIPHERAL_UNRESOLVED_FEATURE_DOWNGRADE_VERSION,
    peripheralFocalEvidenceCalibrationAcquisitionVersion:
      PERIPHERAL_FOCAL_EVIDENCE_CALIBRATION_ACQUISITION_VERSION,
    canonicalClinicalResultArchitectureVersion:
      CRA_001_1_VERSION,
    clinicalResultCoherenceEngineVersion:
      CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
    vmeContract: "VME-1.0",
    model: OPENAI_MODEL,
    defaults: {
      reasoningEffort:
        process.env.OPENAI_VISION_REASONING_EFFORT || "none",
      boneMarrowReasoningEffort:
        process.env.OPENAI_VISION_REASONING_EFFORT || "none",
      maxCompletionTokens:
        Number(process.env.OPENAI_VISION_MAX_COMPLETION_TOKENS || 3200),
      boneMarrowMaxCompletionTokens:
        Number(process.env.OPENAI_MARROW_MAX_COMPLETION_TOKENS || 4000),
      repairReasoningEffort:
        process.env.OPENAI_VISION_REPAIR_REASONING_EFFORT || "none",
      repairMaxCompletionTokens:
        Number(process.env.OPENAI_VISION_REPAIR_MAX_COMPLETION_TOKENS || 3600),
      boneMarrowLengthRecoveryMaxCompletionTokens:
        Number(
          process.env.OPENAI_MARROW_LENGTH_RECOVERY_MAX_COMPLETION_TOKENS || 2600,
        ),
      lengthRecoveryPrimaryBudgetMs:
        Number(process.env.VME_LENGTH_RECOVERY_PRIMARY_BUDGET_MS || 65000),
      primaryTiles:
        Number(process.env.VME_PRIMARY_TILES || 0),
      includeCenterCrop:
        String(process.env.VME_INCLUDE_CENTER_CROP || "false")
          .toLowerCase() === "true",
      imageDetail:
        process.env.VME_IMAGE_DETAIL || "high",
      repairEnabled:
        String(process.env.VME_REPAIR_ENABLED || "false")
          .toLowerCase() === "true",
      serviceTier:
        process.env.OPENAI_VISION_SERVICE_TIER || "default",
    },
    timestamp: new Date().toISOString(),
  });
});


// ============================================================================
// CI-001B — CLASSIFY SPECIMEN
// ============================================================================

app.post(
  "/classify-specimen",
  auth,
  upload.array("image", 4),
  async (req, res) => {
    try {
      const files = req.files || [];

      if (!files.length) {
        return res.status(400).json({
          success: false,
          error: "Nenhuma imagem enviada.",
        });
      }

      const imagesPayload = [];

      for (const file of files) {
        const enhanced =
          await enhanceMicroscopyImage(file.buffer);

        const payload =
          buildGPTImagePayload(
            enhanced,
            "image/jpeg",
            {
              maxTiles:
                Number(
                  process.env.GPT_IMAGE_TILES ||
                  1,
                ),
            },
          );

        imagesPayload.push(...payload);
      }

      const specimenPrompt = `
Você é um classificador de tipo de material hematológico.
Sua única tarefa é diferenciar:
PERIPHERAL_BLOOD,
BONE_MARROW_ASPIRATE,
BONE_MARROW_BIOPSY,
HEMODILUTED_BONE_MARROW,
INADEQUATE,
INDETERMINATE.

Não diagnosticar doenças.
Não interpretar risco, normalidade ou blastos.
Avaliar apenas o tipo de material e a qualidade para classificação.

Evidências favoráveis a sangue periférico:
- forte predomínio eritrocitário;
- células circulantes predominantemente maduras;
- distribuição típica de esfregaço periférico.

Evidências favoráveis a aspirado medular:
- diversidade maturativa;
- precursores hematopoéticos;
- alta densidade de células nucleadas;
- megacariócitos;
- espículas ou fragmentos medulares.

Ausência de espículas isoladamente não exclui medula.
Se houver padrão medular com forte contaminação periférica,
usar HEMODILUTED_BONE_MARROW.
Se a evidência for insuficiente, usar INDETERMINATE.
Se a imagem for tecnicamente inviável, usar INADEQUATE.

Retorne somente JSON:
{
  "predictedType": "INDETERMINATE",
  "confidence": 0.0,
  "alternativeType": "INDETERMINATE",
  "alternativeConfidence": 0.0,
  "modelVersion": "specimen-classifier-v1",
  "evidence": [
    {
      "kind": "other",
      "description": "",
      "supports": "INDETERMINATE",
      "weight": 0.0,
      "confidence": 0.0
    }
  ]
}
`;

      const completion =
        await openai.chat.completions.create({
          model: OPENAI_MODEL,
          max_completion_tokens: 1200,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: specimenPrompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Classifique o tipo de material das imagens sem realizar interpretação clínica.",
                },
                ...imagesPayload,
              ],
            },
          ],
        });

      const parsed =
        safeJsonParse(
          completion?.choices?.[0]
            ?.message?.content ||
          "{}",
        );

      const classification =
        normalizeSpecimenClassification(parsed);

      return res.json({
        success: true,
        specimenClassification:
          classification,
        metadata: {
          images: files.length,
          model: OPENAI_MODEL,
          version: "CI-001B-v1",
          timestamp:
            new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "CLASSIFY SPECIMEN ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        error:
          "Erro ao classificar o tipo de material.",
        detail: error.message,
      });
    }
  },
);

// ============================================================================
// ANALYZE
// ============================================================================

app.post(

  "/analyze-slide",

  auth,

  upload.array(
    "image",
    4,
  ),

  async (
    req,
    res,
  ) => {

    try {

      const {
        userId,
        data,
      } = getUser(req);

      const uploadedFiles =
        req.files || [];

      if (
        !uploadedFiles.length
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Nenhuma imagem enviada.",
        });
      }

      // ====================================================================
      // ANALYSIS SOURCE
      // ====================================================================

      const analysisSource =
        normalizeAnalysisSource(
          req.body?.analysisSource,
        );

      const specimenGate =
        validateSpecimenGate(req);

      if (!specimenGate.valid) {
        return res
          .status(specimenGate.status)
          .json({
            success: false,
            error: specimenGate.error,
          });
      }

      const analysisType =
        specimenGate.analysisType;

      const specimenType =
        specimenGate.specimenType;

      // ====================================================================
      // MANUAL COUNTS
      // ====================================================================

      let manualCounts = {};

      try {
        manualCounts =
          typeof req.body?.manualCounts === "string"
            ? JSON.parse(req.body.manualCounts)
            : req.body?.manualCounts || {};

      } catch {

        manualCounts = {};
      }

      console.log(
        `🔬 ${uploadedFiles.length} imagens recebidas`,
      );

      console.log(
        `🧠 SOURCE: ${analysisSource}`,
      );

      // ====================================================================
      // AI ANALYSIS
      // ====================================================================

      const structured =
        await analyzeWithOpenAI({

          images:
            uploadedFiles,

          analysisSource,

          manualCounts,

          analysisType,

          specimenType,

          specimenDecision:
            specimenGate.decision,

          specimenReviewRequired:
            specimenGate.reviewRequired,
        });

      // ====================================================================
      // BE-FIX-005.9 — SAFE ACQUISITION FAILURE DELIVERY
      // ====================================================================

      if (
        structured?.success === false &&
        (
          structured?.errorCode === "INCOMPLETE_VISUAL_EVIDENCE" ||
          structured?.errorCode === "VISUAL_ACQUISITION_TECHNICAL_FAILURE"
        )
      ) {
        // BE-FIX-005.21.1 — failed acquisition cannot enter clinical governors.
        return res.status(422).json(structured);
      }

      // ====================================================================
      // VALIDATION
      // ====================================================================

      const validation =
        validateAIResult(
          structured,
        );

      if (
        !validation.valid
      ) {

        return res.status(500).json({

          success: false,

          error:
            validation.error,
        });
      }

      validation.result =
        validateConsistency(
          validation.result,
        );

      validation.result =
        ensurePipelineObjects(
          validation.result,
        );

      validation.result =
        applySpecimenMetadata(
          validation.result,
          specimenGate,
        );

      validation.result =
        ensurePipelineObjects(
          validation.result,
        );

      if (
        specimenGate.analysisType ===
        "bone_marrow"
      ) {
        validation.result =
          enforceBoneMarrowOutputContract(
            validation.result,
            {
              rawResult:
                validation.result.rawResponse ||
                structured?.rawResponse ||
                structured ||
                {},
              specimenGate,
            },
          );

        validation.result =
          applyBoneMarrowClinicalReasoning(
            validation.result,
            {
              specimenGate,
            },
          );

        validation.result =
          applyBoneMarrowLanguageGuard(
            validation.result,
          );

        validation.result =
          ensurePipelineObjects(
            validation.result,
          );

        validation.result =
          enforceBoneMarrowOutputContract(
            validation.result,
            {
              rawResult:
                validation.result.rawResponse ||
                structured?.rawResponse ||
                structured ||
                {},
              specimenGate,
            },
          );

        validation.result =
          applyBoneMarrowClinicalReasoning(
            validation.result,
            {
              specimenGate,
            },
          );

        validation.result =
          applyMarrowPositiveBlastEvidencePreservation(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );

        validation.result =
          applyMarrowPrecursorDiscrimination(
            validation.result,
          );

        validation.result =
          applyMarrowBlastPopulationGovernance(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );

        validation.result =
          applyClinicalSafetyGovernor(
            validation.result,
            {
              specimenGate,
            },
          );

        validation.result =
          applyMarrowPositiveBlastEvidencePreservation(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );

        validation.result =
          applyMarrowPrecursorDiscrimination(
            validation.result,
          );

        validation.result =
          applyMarrowBlastPopulationGovernance(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );

        if (
          validation.result
            .marrowSafetyValidation
            ?.deliveryAllowed === false
        ) {
          return res.status(422).json({
            success: false,
            error:
              "A validação de segurança medular bloqueou a entrega do resultado.",
            marrowSafetyValidation:
              validation.result
                .marrowSafetyValidation,
          });
        }
      }

      validation.result =
        stabilizeDualPipelineResult(
          validation.result,
          {
            specimenGate,
            analysisSource,
          },
        );

      if (specimenGate.analysisType === "bone_marrow") {
        validation.result =
          applyMarrowPositiveBlastEvidencePreservation(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );
        validation.result =
          applyMarrowPrecursorDiscrimination(
            validation.result,
          );
        validation.result =
          applyMarrowBlastPopulationGovernance(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );
        validation.result =
          applyMarrowPositiveBlastEvidencePreservation(
            validation.result,
          );
        validation.result =
          applyMarrowPhysiologicPrecursorCoherence(
            validation.result,
          );
      }

      if (
        validation.result
          .dualPipelineValidation
          ?.deliveryAllowed === false
      ) {
        return res.status(422).json({
          success: false,
          error:
            "A estabilização do pipeline clínico bloqueou a entrega do resultado.",
          dualPipelineValidation:
            validation.result
              .dualPipelineValidation,
        });
      }

      if (
        validation.result.morphologicRiskClass ===
          "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
        validation.result.findings?.reactiveLymphocytes === true ||
        validation.result.findings?.atypicalLymphocytes === true
      ) {
        validation.result.normalityBlocked = true;

        validation.result.overallAssessment
          .requiresHumanReview = true;

        validation.result.overallAssessment
          .riskCategory =
            validation.result.morphologicRiskClass ||
            "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";

        validation.result.blockNormalReason.push(
          "Célula mononuclear isolada com possível padrão reacional/atípico "
            + "impede classificação como morfologia preservada.",
        );

        validation.result.blockNormalReason = [
          ...new Set(
            validation.result.blockNormalReason,
          ),
        ];
      }

      const finalFindings =
        validation.result.findings || {};

      const finalLymphoidPattern =
        validation.result.lymphoidPatternAnalysis ||
        classifyLymphoidPattern({
          findings: finalFindings,
          visualEvidence: validation.result.visualEvidence || {},
          fieldAdequacy: validation.result.fieldAdequacy || {},
        });

      validation.result.lymphoidPatternAnalysis =
        finalLymphoidPattern;

      if (
        finalFindings.blastSuspicion === true
      ) {
        validation.result.morphologicRiskClass =
          "CLASS_4_BLAST_SUSPICION";
      }

      else if (
        finalLymphoidPattern.lymphoidPattern ===
          "LYMPHOID_MONOMORPHIC" &&
        finalFindings.plasmablasts === true &&
        finalFindings.monomorphicPopulation === true
      ) {
        validation.result.morphologicRiskClass =
          "CLASS_5_HIGH_NEOPLASTIC_SUSPICION";
      }

      else if (
        finalLymphoidPattern.forceDowngrade === true
      ) {
        validation.result.findings.monomorphicPopulation = false;

        validation.result.morphologicRiskClass =
          finalLymphoidPattern.riskCeiling ||
          "CLASS_2_ATYPICAL_REACTIVE_PATTERN";

        validation.result.riskLevel =
          "Padrão linfoide atípico/indeterminado com necessidade de correlação";

        validation.result.overallAssessment =
          validation.result.overallAssessment || {};

        validation.result.overallAssessment.requiresHumanReview = true;

        validation.result.overallAssessment.riskCategory =
          validation.result.morphologicRiskClass;
      }

// ====================================================================
// CLASS_3 — POPULAÇÃO MONONUCLEAR ATÍPICA SUSTENTADA
// ====================================================================

const visibleLeukocytes =
  validation.result.fieldAdequacy?.visibleLeukocytes || 0;

const currentRiskClass =
  validation.result.morphologicRiskClass || "";

const reactivePattern =
  currentRiskClass ===
    "CLASS_2_ATYPICAL_REACTIVE_PATTERN" ||
  currentRiskClass ===
    "CLASS_2_REACTIVE_MONONUCLEOSIS_PATTERN" ||
  validation.result.findings?.reactiveLymphocytes === true ||
  validation.result.findings?.mononucleosisSuspicion === true ||
  validation.result.findings?.downeyLikeCells === true;

const hasAtypicalPopulationSignal =
  finalFindings.largeMononuclearCells === true ||
  finalFindings.atypicalLymphocytes === true ||
  finalFindings.plasmacytoidCells === true ||
  finalFindings.plasmocytes === true ||
  finalFindings.plasmablasts === true ||
  finalFindings.monomorphicPopulation === true;

if (
  hasAtypicalPopulationSignal === true &&
  visibleLeukocytes >= 8 &&
  !reactivePattern &&
  validation.result.morphologicRiskClass !== "CLASS_4_BLAST_SUSPICION" &&
  validation.result.morphologicRiskClass !== "CLASS_5_HIGH_NEOPLASTIC_SUSPICION"
) {
  validation.result.normalityBlocked = true;

  validation.result.morphologicRiskClass =
    "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION";

  validation.result.riskLevel =
    "População mononuclear atípica sustentada";

  validation.result.overallAssessment =
    validation.result.overallAssessment || {};

  validation.result.overallAssessment.requiresHumanReview = true;

  validation.result.overallAssessment.riskCategory =
    "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION";

  validation.result.blockNormalReason =
    Array.isArray(validation.result.blockNormalReason)
      ? validation.result.blockNormalReason
      : [];

  validation.result.blockNormalReason.push(
    "Múltiplas células mononucleares atípicas sustentadas no campo impedem classificação como achado isolado."
  );

  validation.result.blockNormalReason =
    [...new Set(validation.result.blockNormalReason)];
}

// ====================================================================
// RISK COHERENCE OVERRIDE — FIELD-AWARE
// ====================================================================

const visibleLeukocytesRisk =
  validation.result.fieldAdequacy?.visibleLeukocytes || 0;

const adequatePopulationRisk =
  validation.result.fieldAdequacy?.adequateForPopulationAssessment === true;

const hasAtypicalPopulation =
  adequatePopulationRisk === true &&
  visibleLeukocytesRisk >= 8 &&
  !reactivePattern &&
  (
    currentRiskClass === "CLASS_2_ATYPICAL_POPULATION" ||
    currentRiskClass === "CLASS_2_ATYPICAL_REACTIVE_PATTERN" ||
    currentRiskClass === "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION" ||
    validation.result.findings?.monomorphicPopulation === true ||
    validation.result.findings?.plasmacytoidCells === true ||
    validation.result.findings?.plasmablasts === true ||
    validation.result.findings?.plasmocytes === true ||
    validation.result.findings?.largeMononuclearCells === true
  );

if (hasAtypicalPopulation) {
  validation.result.normalityBlocked = true;

  validation.result.riskLevel =
    "Alteração morfológica relevante — padrão indeterminado";

  validation.result.overallAssessment =
    validation.result.overallAssessment || {};

  validation.result.overallAssessment.requiresHumanReview = true;

  validation.result.overallAssessment.riskCategory =
    "Alteração morfológica relevante";

  validation.result.confidenceAnalysis =
    validation.result.confidenceAnalysis || {};

  validation.result.confidenceAnalysis.hematologicRisk =
    validation.result.confidenceAnalysis.hematologicRisk || {};

  validation.result.confidenceAnalysis.hematologicRisk.level =
    "intermediate";

  validation.result.confidenceAnalysis.hematologicRisk.label =
    "RISCO INTERMEDIÁRIO";

  validation.result.confidenceAnalysis.hematologicRisk.score =
    Math.max(
      Number(validation.result.confidenceAnalysis.hematologicRisk.score || 0),
      45,
    );

  validation.result.blockNormalReason =
    Array.isArray(validation.result.blockNormalReason)
      ? validation.result.blockNormalReason
      : [];

  validation.result.blockNormalReason.push(
    "População celular atípica sustentada impede classificação como baixo risco morfológico."
  );

  validation.result.blockNormalReason =
    [...new Set(validation.result.blockNormalReason)];
}

// ====================================================================
// REMOVE OVERCALLING TERMS WHEN CONFIDENCE IS LIMITED
// ====================================================================

const limitedConfidence =
  Number(validation.result.confidenceAnalysis?.globalConfidenceScore || 0) < 70;

if (limitedConfidence) {
  const forbiddenTerms = [
    "monomórfica/plasmoblástica",
    "monomórfica",
    "plasmoblástica",
    "clonal",
    "neoplásica",
  ];

  const replacement =
    "mononuclear atípica indeterminada";

  const cleanText = (text) => {
    if (typeof text !== "string") return text;

    let cleaned = text;

    for (const term of forbiddenTerms) {
      cleaned = cleaned.replaceAll(term, replacement);
    }

    return cleaned;
  };

  validation.result.mainFinding =
    cleanText(validation.result.mainFinding);

  validation.result.primaryFinding =
    cleanText(validation.result.primaryFinding);

  validation.result.clinicalMeaning =
    cleanText(validation.result.clinicalMeaning);

  validation.result.interpretiveSynthesis =
    cleanText(validation.result.interpretiveSynthesis);

  validation.result.hematologicReasoning =
    cleanText(validation.result.hematologicReasoning);

  if (validation.result.morphologyAnalysis) {
    validation.result.morphologyAnalysis.summary =
      cleanText(validation.result.morphologyAnalysis.summary);

    validation.result.morphologyAnalysis.overview =
      cleanText(validation.result.morphologyAnalysis.overview);

    validation.result.morphologyAnalysis.leukocyteReview =
      cleanText(validation.result.morphologyAnalysis.leukocyteReview);
  }
}

// ====================================================================
// ATYPICAL POPULATION LANGUAGE SAFETY — FIELD-AWARE
// ====================================================================

const globalConfidence =
  Number(
    validation.result.confidenceAnalysis?.globalConfidenceScore ||
    validation.result.confidenceAnalysis?.confidenceHierarchy?.global ||
    0,
  );

const visibleLeukocytesLanguage =
  validation.result.fieldAdequacy?.visibleLeukocytes || 0;

const adequatePopulationLanguage =
  validation.result.fieldAdequacy?.adequateForPopulationAssessment === true;

const hasStrongAtypia =
  validation.result.findings?.monomorphicPopulation === true ||
  validation.result.findings?.plasmablasts === true ||
  validation.result.findings?.plasmacytoidCells === true;

const hasSupportiveAtypia =
  validation.result.findings?.largeMononuclearCells === true ||
  validation.result.findings?.plasmocytes === true;

const isAtypicalPopulation =
  adequatePopulationLanguage === true &&
  visibleLeukocytesLanguage >= 12 &&
  (
    hasStrongAtypia ||
    (
      hasSupportiveAtypia &&
      globalConfidence >= 70
    )
  );

if (isAtypicalPopulation) {
  validation.result.normalityBlocked = true;

  validation.result.riskLevel =
    "Alteração morfológica relevante — padrão indeterminado";

  validation.result.overallAssessment =
    validation.result.overallAssessment || {};

  validation.result.overallAssessment.requiresHumanReview = true;

  validation.result.overallAssessment.riskCategory =
    "Alteração morfológica relevante";

  validation.result.confidenceAnalysis =
    validation.result.confidenceAnalysis || {};

  validation.result.confidenceAnalysis.riskClassification =
    "Padrão indeterminado — revisão especializada recomendada";

  const safeMainFinding =
    globalConfidence < 70
      ? "Sugere-se alteração mononuclear atípica em campo com representatividade suficiente, porém sem confirmação de natureza reacional, clonal ou imatura pela imagem isolada."
      : "Observa-se alteração mononuclear atípica em campo com representatividade suficiente, sem critérios para diagnóstico definitivo pela imagem isolada.";

  validation.result.mainFinding = safeMainFinding;
  validation.result.primaryFinding = safeMainFinding;

  validation.result.morphologyAnalysis =
    validation.result.morphologyAnalysis || {};

  validation.result.morphologyAnalysis.summary =
    safeMainFinding;

  validation.result.morphologyAnalysis.overview =
    "Alteração morfológica mononuclear observada em campo representativo. A classificação exige correlação com múltiplos campos e hemograma.";

  validation.result.morphologyAnalysis.leukocyteReview =
    "Há alteração leucocitária/mononuclear em campo com representatividade suficiente. A ausência global de blastos não pode ser afirmada apenas pela imagem isolada.";
}

      validation.result =
        sanitizeNarrativeRepetition(
          validation.result,
        );

      validation.result =
        sanitizeHematologyLanguage(
          validation.result,
        );

      console.log("================================");

      console.log("================================");
     
      // BE-FIX-005.47.1 — FINAL RESULT INITIALIZATION ORDER HOTFIX
      // Do not access finalResult here. At this stage only validation.result
      // exists; finalResult is initialized immediately after FINAL VALIDATED
      // RESULT by applyFinalClinicalGovernor(validation.result).
      // The 005.47 morphology/adequacy projection lock remains applied later,
      // after finalResult has been initialized.

      console.log("FINAL VALIDATED RESULT");
      console.log(
        JSON.stringify(
          {
            normalityBlocked:
              validation.result.normalityBlocked,

            morphologicRiskClass:
              validation.result.morphologicRiskClass,

            riskLevel:
              validation.result.riskLevel,

            requiresHumanReview:
              validation.result.overallAssessment?.requiresHumanReview,

            findings:
              validation.result.findings,

            blockNormalReason:
              validation.result.blockNormalReason,

            confidenceAnalysis:
              validation.result.confidenceAnalysis,
          },
          null,
          2,
        ),
      );
      console.log("================================");

// ============================================================================
// FINAL CLINICAL GOVERNOR — única autoridade final
// ============================================================================

let finalResult =
  applyFinalClinicalGovernor(
    validation.result,
  );

// BE-FIX-005.26 — the generic final governor may qualify representativity,
// but it cannot be the last writer over structured positive marrow evidence.
if (specimenGate.analysisType === "bone_marrow") {
  finalResult = applyMarrowPositiveBlastEvidencePreservation(finalResult);
  finalResult = applyMarrowPrecursorDiscrimination(finalResult);
  finalResult = applyMarrowBlastPopulationGovernance(finalResult);
  finalResult = applyMarrowPositiveBlastEvidencePreservation(finalResult);
  finalResult = applyMarrowPhysiologicPrecursorCoherence(finalResult);
}

// BE-FIX-005.7 — preserve acquisition provenance through final governor and
// validator layers. An incomplete VME response may be safely limited, but it
// must never be represented as complete negative morphology.
// BE-FIX-005.10 — Final Analysis Assembly & Response Recovery
// Preserve VME provenance from values that are in scope in /analyze-slide:
// prefer the validated result and fall back to the structured AI result.
finalResult.visualMorphologyEvidenceAcquisition =
  validation.result.visualMorphologyEvidenceAcquisition ??
  structured.visualMorphologyEvidenceAcquisition;
finalResult.visualEvidenceAcquisitionIncomplete =
  validation.result.visualEvidenceAcquisitionIncomplete === true ||
  structured.visualEvidenceAcquisitionIncomplete === true;

if (finalResult.visualEvidenceAcquisitionIncomplete) {
  finalResult.requiresHumanReview = true;
  finalResult.normalityBlocked = true;
  finalResult.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(finalResult.blockNormalReason)
        ? finalResult.blockNormalReason
        : []),
      "Aquisição de evidência morfológica visual incompleta (VME-1.0)",
    ]),
  ];
}

finalResult =
  sanitizeNarrativeRepetition(
    finalResult,
  );

finalResult =
  sanitizeHematologyLanguage(
    finalResult,
  );

// =====================================================
// RAW POSITIVE FINDINGS FINAL RESTORE — V47
// =====================================================

const rawPositiveFinal =
  finalResult.rawResponse?.positiveFindings || {};

const rawHasAtypicalMononuclearPopulation =
  rawPositiveFinal.largeMononuclearCells === true ||
  rawPositiveFinal.atypicalLymphocytes === true ||
  rawPositiveFinal.reactiveLymphocytes === true ||
  rawPositiveFinal.monomorphicPopulation === true ||
  rawPositiveFinal.immatureCells === true;

if (rawHasAtypicalMononuclearPopulation) {
  finalResult.findings = finalResult.findings || {};
  finalResult.morphologyAnalysis = finalResult.morphologyAnalysis || {};
  finalResult.structuredReport = finalResult.structuredReport || {};
  finalResult.overallAssessment = finalResult.overallAssessment || {};
  finalResult.hematologicReasoning = finalResult.hematologicReasoning || {};
  finalResult.whatAISees = finalResult.whatAISees || {};

  finalResult.findings.largeMononuclearCells =
    rawPositiveFinal.largeMononuclearCells === true;

  finalResult.findings.atypicalLymphocytes =
    rawPositiveFinal.atypicalLymphocytes === true;

  finalResult.findings.reactiveLymphocytes =
    rawPositiveFinal.reactiveLymphocytes === true;

  finalResult.findings.monomorphicPopulation =
    rawPositiveFinal.monomorphicPopulation === true;

  finalResult.findings.immatureCells =
    rawPositiveFinal.immatureCells === true;

  finalResult.findings.blastSuspicion =
    rawPositiveFinal.blastSuspicion === true;

  finalResult.normalityBlocked = true;
  finalResult.requiresHumanReview = true;

  finalResult.finalClassification =
    rawPositiveFinal.blastSuspicion === true
      ? "CLASS_4_BLAST_SUSPICION"
      : rawPositiveFinal.monomorphicPopulation === true
        ? "CLASS_3_POSSIBLE_CLONALITY"
        : "CLASS_2_ATYPICAL_POPULATION";

  finalResult.morphologicRiskClass =
    finalResult.finalClassification;

  finalResult.riskLevel =
    rawPositiveFinal.blastSuspicion === true
      ? "Suspeita de população imatura/blástica"
      : rawPositiveFinal.monomorphicPopulation === true
        ? "População mononuclear atípica/monomórfica"
        : "População mononuclear atípica";

  const restoredSummary =
    "Campo com predomínio de células mononucleares grandes/atípicas. A imagem não deve ser classificada como campo limitado simples. Requer revisão hematológica especializada e correlação com hemograma.";

  finalResult.mainFinding = restoredSummary;
  finalResult.primaryFinding = restoredSummary;
  finalResult.finalConclusion = restoredSummary;

  finalResult.morphologyAnalysis.overview = restoredSummary;
  finalResult.morphologyAnalysis.summary = restoredSummary;
  finalResult.morphologyAnalysis.leukocyteReview =
    "Presença de células mononucleares grandes/atípicas, com padrão populacional relevante. Não afirmar ausência global de blastos pela imagem isolada.";
  finalResult.morphologyAnalysis.absentFindings =
    "Bastonetes de Auer não claramente identificados; ausência global de blastos não pode ser afirmada pela imagem isolada.";

  finalResult.structuredReport.conclusion = restoredSummary;
  finalResult.overallAssessment.mainImpression = restoredSummary;
  finalResult.overallAssessment.riskCategory =
    finalResult.finalClassification;

  finalResult.whatAISees.leukocytes =
    "Células mononucleares grandes/atípicas.";
  finalResult.whatAISees.dominantFinding =
    "População mononuclear atípica.";
  finalResult.whatAISees.negativeFindings =
    "Não afirmar ausência global de blastos pela imagem isolada.";

  if (
    typeof finalResult.hematologicReasoning !== "object" ||
    finalResult.hematologicReasoning === null
  ) {
    finalResult.hematologicReasoning = {
      whatISee: "",
      whatItResembles: "",
      whatICannotConfirm: "",
      finalInterpretation: "",
    };
  }

    finalResult.interpretiveSynthesis =
      restoredSummary;

    finalResult.hematologicReasoning.finalInterpretation =
      finalResult.interpretiveSynthesis ||
      finalResult.mainFinding ||
      "";

    finalResult.clinicalMeaning =
      "Achado morfológico relevante. Requer correlação com hemograma, revisão microscópica profissional e, se indicado, imunofenotipagem.";
  }
// =====================================================
// RAW GPT POSITIVE FINDINGS RECOVERY — BE/FE-FIX-003
// Preserve explicit positive evidence without promoting atypia to blast.
// =====================================================

const rawPositiveFindings =
  finalResult.rawResponse?.positiveFindings || {};

const rawBlastSuspicion =
  rawPositiveFindings.blastSuspicion === true ||
  finalResult.rawResponse?.blastSuspicion === true;

const rawImmatureCells =
  rawPositiveFindings.immatureCells === true;

const rawMonomorphicPopulation =
  rawPositiveFindings.monomorphicPopulation === true;

const rawLargeMononuclearCells =
  rawPositiveFindings.largeMononuclearCells === true;

const rawAtypicalLymphocytes =
  rawPositiveFindings.atypicalLymphocytes === true;

finalResult.findings = finalResult.findings || {};

finalResult.findings.blastSuspicion =
  rawBlastSuspicion || finalResult.findings.blastSuspicion === true;
finalResult.findings.immatureCells =
  rawImmatureCells || finalResult.findings.immatureCells === true;
finalResult.findings.monomorphicPopulation =
  rawMonomorphicPopulation || finalResult.findings.monomorphicPopulation === true;
finalResult.findings.largeMononuclearCells =
  rawLargeMononuclearCells || finalResult.findings.largeMononuclearCells === true;
finalResult.findings.atypicalLymphocytes =
  rawAtypicalLymphocytes || finalResult.findings.atypicalLymphocytes === true;

const explicitBlastEvidence =
  finalResult.findings.blastSuspicion === true &&
  (
    finalResult.visualEvidence?.prominentNucleolus === true ||
    finalResult.visualEvidence?.highNuclearCytoplasmicRatio === true ||
    finalResult.visualEvidence?.cellSizeIncrease === true ||
    finalResult.rawResponse?.visualEvidence?.prominentNucleolus === true
  );

const explicitImmaturePopulationEvidence =
  finalResult.findings.immatureCells === true &&
  finalResult.fieldAdequacy?.adequateForBlastScreening === true;

// Single final predicate used by every downstream blast safety decision.
const shouldClassifyAsBlast =
  explicitBlastEvidence || explicitImmaturePopulationEvidence;

if (
  rawLargeMononuclearCells ||
  rawAtypicalLymphocytes ||
  rawMonomorphicPopulation
) {
  finalResult.normalityBlocked = true;
  finalResult.requiresHumanReview = true;
}

finalResult.findings = finalResult.findings || {};
finalResult.morphologyAnalysis = finalResult.morphologyAnalysis || {};
finalResult.whatAISees = finalResult.whatAISees || {};
finalResult.overallAssessment = finalResult.overallAssessment || {};
finalResult.structuredReport = finalResult.structuredReport || {};
finalResult.confidenceAnalysis = finalResult.confidenceAnalysis || {};
finalResult.patternRecognition = finalResult.patternRecognition || {};

const finalVisibleLeukocytesRaw =
  finalResult.visibleLeukocytes ??
  finalResult.fieldAdequacy?.visibleLeukocytes ??
  finalResult.rawResponse?.fieldAdequacy?.visibleLeukocytes ??
  null;

const finalVisibleLeukocytes =
  finalVisibleLeukocytesRaw !== null &&
  finalVisibleLeukocytesRaw !== undefined &&
  finalVisibleLeukocytesRaw !== "" &&
  Number.isFinite(Number(finalVisibleLeukocytesRaw))
    ? Number(finalVisibleLeukocytesRaw)
    : null;

const isLimitedFieldFinal =
  finalVisibleLeukocytes === null ||
  finalVisibleLeukocytes < 8 ||
  finalResult.finalClassification === "CLASS_1_LIMITED_FIELD" ||
  finalResult.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
  finalResult.morphologicRiskClass === "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
  finalResult.fieldAdequacy?.adequateForPopulationAssessment === false ||
  finalResult.fieldAdequacy?.limitedField === true;

const limitedConclusion =
  "Campo microscópico limitado e insuficiente para avaliação populacional confiável. A ausência de alterações críticas não pode ser afirmada com segurança a partir deste campo isolado.";

const limitedRecommendation =
  "Recomenda-se análise de múltiplos campos da lâmina, correlação com hemograma completo e revisão por profissional habilitado antes de qualquer conclusão diagnóstica.";

const hasCriticalHematologicFinding =
  finalResult.findings?.blastSuspicion === true ||
  finalResult.findings?.immatureCells === true ||
  finalResult.findings?.monomorphicPopulation === true ||
  finalResult.findings?.plasmablasts === true ||
  finalResult.findings?.largeMononuclearCells === true ||
  finalResult.findings?.atypicalLymphocytes === true ||
  finalResult.findings?.parasiteSuspected === true;

// =====================================================
// BLAST SAFETY LOCK — EVIDENCE BASED
// Never infer blasts from free-text cautions such as
// "não permite excluir células imaturas".
// =====================================================

const blastLock = shouldClassifyAsBlast === true;

if (blastLock) {

  finalResult.normalityBlocked = true;
  finalResult.requiresHumanReview = true;

  finalResult.finalClassification =
    "CLASS_4_BLAST_SUSPICION";

  finalResult.morphologicRiskClass =
    "CLASS_4_BLAST_SUSPICION";

  finalResult.riskLevel =
    "Suspeita de população imatura/blástica";

  finalResult.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(finalResult.blockNormalReason)
        ? finalResult.blockNormalReason
        : []),
      "Suspeita de células imaturas/blásticas",
      "Necessária revisão hematológica especializada",
    ]),
  ];

  finalResult.mainFinding =
    "População mononuclear imatura/atípica suspeita. A morfologia exige revisão hematológica especializada.";

  finalResult.primaryFinding =
    finalResult.mainFinding;

  finalResult.finalConclusion =
    finalResult.mainFinding;

  finalResult.morphologyAnalysis.summary =
    finalResult.mainFinding;

  finalResult.morphologyAnalysis.overview =
    finalResult.mainFinding;

  finalResult.clinicalMeaning =
    "Achado morfológico de alta relevância. A imagem sugere população celular imatura/atípica, não devendo ser classificada como campo limitado simples.";

  finalResult.interpretiveSynthesis =
    "Não afirmar ausência de blastos. Recomenda-se revisão microscópica profissional imediata e correlação com hemograma, contagem diferencial e, se indicado, imunofenotipagem.";

}

if (
  isLimitedFieldFinal &&
  !hasCriticalHematologicFinding
) {
  const preserveTerminalMarrowMorphology =
    shouldPreserveTerminalMarrowMorphology(finalResult);

  if (preserveTerminalMarrowMorphology) {
    // BE-FIX-005.47 — terminal morphology/adequacy axis lock.
    finalResult =
      applyMarrowMorphologyAdequacyProjectionLock(finalResult);

    finalResult.normalityBlocked = true;
    finalResult.requiresHumanReview = true;
    finalResult.evidenceGovernance = {
      ...(finalResult.evidenceGovernance || {}),
      limitedField: true,
      evidenceScope: "FIELD_SCOPED",
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    };
  } else {
    // Generic limited field is still valid when no positive terminal marrow
    // morphology exists.
    finalResult.finalClassification = "CLASS_1_LIMITED_FIELD";
    finalResult.morphologicRiskClass = "CLASS_1_LIMITED_FIELD";
    finalResult.riskLevel = "Campo limitado";
  finalResult.normalityBlocked = true;
  finalResult.requiresHumanReview = true;

  finalResult.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(finalResult.blockNormalReason)
        ? finalResult.blockNormalReason
        : []),
      "Campo microscópico limitado",
      "Baixa representatividade celular",
      "Não afirmar normalidade global pela imagem isolada",
      "Não converter não visualização em exclusão global",
    ]),
  ];

  finalResult.confidenceAnalysis.globalConfidenceScore = Math.min(
    Number(finalResult.confidenceAnalysis.globalConfidenceScore || 40),
    40,
  );
  finalResult.confidenceAnalysis.summary =
    finalResult.confidenceAnalysis.summary ||
    "Representatividade limitada. A confiança descreve os achados observados e não equivale a normalidade global.";

  // Preserve morphology cards and AI observations already generated upstream.
  finalResult.morphologyAnalysis.overview =
    finalResult.morphologyAnalysis.overview || limitedConclusion;
  finalResult.morphologyAnalysis.summary =
    finalResult.morphologyAnalysis.summary || limitedConclusion;
  finalResult.morphologyAnalysis.absentFindings =
    finalResult.morphologyAnalysis.absentFindings ||
    "A não visualização de um elemento neste campo não permite sua exclusão global na lâmina.";

  finalResult.whatAISees.imageLimitations =
    finalResult.whatAISees.imageLimitations ||
    "Campo único/limitado; os achados observados não devem ser generalizados para toda a lâmina.";
  finalResult.whatAISees.negativeFindings =
    "A ausência de um elemento neste campo não permite sua exclusão global na lâmina.";

  finalResult.mainFinding = finalResult.mainFinding || limitedConclusion;
  finalResult.primaryFinding = finalResult.primaryFinding || finalResult.mainFinding;
  finalResult.finalConclusion = finalResult.finalConclusion || finalResult.mainFinding;
  finalResult.finalRecommendation =
    finalResult.finalRecommendation || limitedRecommendation;

  finalResult.clinicalMeaning = finalResult.clinicalMeaning ||
    "Campo limitado. Preservar os achados morfológicos observados e correlacioná-los com hemograma completo, múltiplos campos e revisão microscópica profissional.";
  finalResult.interpretiveSynthesis = finalResult.interpretiveSynthesis ||
    "A representatividade limitada reduz a força das inferências populacionais sem apagar evidências morfológicas positivas observadas.";

  finalResult.structuredReport.conclusion =
    finalResult.structuredReport.conclusion || finalResult.mainFinding;
  finalResult.structuredReport.hematologicMeaning =
    finalResult.structuredReport.hematologicMeaning || finalResult.clinicalMeaning;
  finalResult.structuredReport.recommendation =
    finalResult.structuredReport.recommendation || limitedRecommendation;
  finalResult.structuredReport.limitacoes =
    finalResult.structuredReport.limitacoes ||
    "Campo limitado. Necessária avaliação de múltiplos campos, hemograma completo e revisão microscópica profissional.";

  finalResult.overallAssessment.mainImpression =
    finalResult.overallAssessment.mainImpression || finalResult.mainFinding;
  finalResult.overallAssessment.requiresHumanReview = true;
  finalResult.overallAssessment.riskCategory = "CLASS_1_LIMITED_FIELD";

  // Do not force positive findings to false. Unknown/not observed remains unknown.
  finalResult.clinicalCorrelationNeeds = [
    ...new Set([
      ...(Array.isArray(finalResult.clinicalCorrelationNeeds)
        ? finalResult.clinicalCorrelationNeeds
        : []),
      "Hemograma completo",
      "Revisão microscópica profissional",
      "Avaliação de múltiplos campos da lâmina",
    ]),
  ];
  }
}


if (specimenGate.analysisType === "bone_marrow") {
  finalResult =
    applyMarrowMorphologyAdequacyProjectionLock(finalResult);

  console.log(
    "BE-FIX-005.47 — TERMINAL MARROW MORPHOLOGY / ADEQUACY AXIS PROJECTION LOCK",
    JSON.stringify(
      {
        projectionLock:
          finalResult.marrowTerminalMorphologyAdequacyProjectionLock || {},
        axis:
          finalResult.marrowAdequacyMorphologyAxis || {},
        finalClassification: finalResult.finalClassification,
        morphologicRiskClass: finalResult.morphologicRiskClass,
        riskCategory: finalResult.overallAssessment?.riskCategory,
      },
      null,
      2,
    ),
  );
}

if (
  shouldClassifyAsBlast === true &&
  (
    finalResult.finalClassification === "CLASS_4_BLAST_SUSPICION" ||
    finalResult.morphologicRiskClass === "CLASS_4_BLAST_SUSPICION" ||
    finalResult.findings?.blastSuspicion === true ||
    finalResult.rawResponse?.positiveFindings?.blastSuspicion === true
  )
) {
  const finalCriticalText =
    "População mononuclear imatura/atípica suspeita. Não classificar como campo limitado simples. Requer revisão hematológica especializada, correlação com hemograma e, se indicado, imunofenotipagem.";

  finalResult.finalClassification = "CLASS_4_BLAST_SUSPICION";
  finalResult.morphologicRiskClass = "CLASS_4_BLAST_SUSPICION";
  finalResult.riskLevel = "Suspeita de população imatura/blástica";
  finalResult.normalityBlocked = true;
  finalResult.requiresHumanReview = true;

  finalResult.findings = finalResult.findings || {};
  finalResult.findings.blastSuspicion = true;
  finalResult.findings.immatureCells = true;
  finalResult.findings.monomorphicPopulation =
    finalResult.rawResponse?.positiveFindings?.monomorphicPopulation === true ||
    finalResult.findings.monomorphicPopulation === true;

  finalResult.mainFinding = finalCriticalText;
  finalResult.primaryFinding = finalCriticalText;
  finalResult.finalConclusion = finalCriticalText;

  finalResult.morphologyAnalysis = finalResult.morphologyAnalysis || {};
  finalResult.morphologyAnalysis.overview =
    "Campo com predomínio de células mononucleares grandes/atípicas, com suspeita de população imatura/blástica.";
  finalResult.morphologyAnalysis.summary = finalCriticalText;
  finalResult.morphologyAnalysis.leukocyteReview =
    "Presença de células mononucleares grandes/atípicas. A hipótese de população imatura/blástica não deve ser descartada pela imagem isolada.";
  finalResult.morphologyAnalysis.absentFindings =
    "Bastonetes de Auer não claramente identificados; ausência global de blastos não pode ser afirmada pela imagem isolada.";

  finalResult.structuredReport = finalResult.structuredReport || {};
  finalResult.structuredReport.conclusion = finalCriticalText;
  finalResult.structuredReport.hematologicMeaning =
    "Achado morfológico crítico/relevante. A imagem não deve ser interpretada como campo limitado simples.";
  finalResult.structuredReport.recommendation =
    "Revisão hematológica especializada, hemograma completo e imunofenotipagem se indicada.";

  finalResult.overallAssessment = finalResult.overallAssessment || {};
  finalResult.overallAssessment.requiresHumanReview = true;
  finalResult.overallAssessment.riskCategory = "CLASS_4_BLAST_SUSPICION";
  finalResult.overallAssessment.mainImpression = finalCriticalText;

  finalResult.hematologicReasoning = finalResult.hematologicReasoning || {};
  finalResult.hematologicReasoning.whatISee =
    "Células mononucleares grandes/atípicas com padrão populacional relevante.";
  finalResult.hematologicReasoning.whatItResembles =
    "População imatura/blástica ou atípica; requer confirmação por revisão profissional.";
  finalResult.hematologicReasoning.whatICannotConfirm =
    "Não é possível confirmar linhagem, clonalidade ou diagnóstico definitivo apenas pela imagem isolada.";
  finalResult.hematologicReasoning.finalInterpretation = finalCriticalText;

  finalResult.whatAISees = finalResult.whatAISees || {};
  finalResult.whatAISees.leukocytes =
    "Células mononucleares grandes/atípicas.";
  finalResult.whatAISees.dominantFinding =
    "População mononuclear imatura/atípica suspeita.";
  finalResult.whatAISees.negativeFindings =
    "Não afirmar ausência global de blastos pela imagem isolada.";

  finalResult.clinicalMeaning =
    "Achado morfológico crítico. Requer correlação com hemograma, revisão microscópica profissional e, se indicado, imunofenotipagem.";

  finalResult.interpretiveSynthesis = finalCriticalText;

  finalResult.confidenceAnalysis = finalResult.confidenceAnalysis || {};
  finalResult.confidenceAnalysis.hematologicRisk = {
    level: "high",
    score: 90,
    label: "ALTO RISCO MORFOLÓGICO",
  };
  finalResult.confidenceAnalysis.summary =
    "Achado crítico/atípico detectado. A confiança não deve ser interpretada como baixo risco.";
}

  console.log("🦠 PARASITE FINAL CHECK");
  console.log(
    JSON.stringify(
      {
        parasiteAnalysis: finalResult.parasiteAnalysis,
        parasiteSuspected: finalResult.findings?.parasiteSuspected,
        plasmodiumSuspected: finalResult.findings?.plasmodiumSuspected,
        mainFinding: finalResult.mainFinding,
        summary: finalResult.morphologyAnalysis?.summary,
      },
      null,
      2,
    ),
  );

console.log("FINAL GOVERNED RESULT");
console.log(
  JSON.stringify(
    {
      finalClassification: finalResult.finalClassification,
      morphologicRiskClass: finalResult.morphologicRiskClass,
      riskLevel: finalResult.riskLevel,
      visibleLeukocytes: finalVisibleLeukocytes,
      hideEducationalHypotheses: finalResult.hideEducationalHypotheses,
      hideClinicalCorrelations: finalResult.hideClinicalCorrelations,
      mainFinding: finalResult.mainFinding,
      overview: finalResult.morphologyAnalysis?.overview,
      clinicalMeaning: finalResult.clinicalMeaning,
    },
    null,
    2,
  ),
);
console.log("================================");

// BE/FE-FIX-003 — Clinical Result Pipeline Recovery
// Preserve educational and correlation payloads produced upstream.
// Visibility is now derived from actual content instead of being forcibly disabled.
finalResult.associatedEducationalHypotheses = Array.isArray(
  finalResult.associatedEducationalHypotheses,
)
  ? finalResult.associatedEducationalHypotheses.filter(Boolean)
  : [];

finalResult.possibleClinicalCorrelations = Array.isArray(
  finalResult.possibleClinicalCorrelations,
)
  ? finalResult.possibleClinicalCorrelations.filter(Boolean)
  : [];

finalResult.clinicalCorrelationNeeds = Array.isArray(
  finalResult.clinicalCorrelationNeeds,
)
  ? finalResult.clinicalCorrelationNeeds.filter(Boolean)
  : [];

finalResult.hideEducationalHypotheses =
  finalResult.associatedEducationalHypotheses.length == 0;
finalResult.hideClinicalCorrelations =
  finalResult.possibleClinicalCorrelations.length == 0 &&
  finalResult.clinicalCorrelationNeeds.length == 0;

// BE/FE-FIX-004 — the immutable observation layer is the final authority for
// descriptive morphology. Safety governors remain authoritative for risk,
// representativity and what cannot be concluded.
finalResult = applyMorphologyEvidencePreservation(finalResult);

finalResult =
  applyNarrativeConsistencyLock(
    finalResult
  );

finalResult = applyMorphologyEvidencePreservation(finalResult);

if (
  finalResult.finalClassification === "CLASS_4_BLAST_SUSPICION" ||
  finalResult.morphologicRiskClass === "CLASS_4_BLAST_SUSPICION"
) {
  const criticalText =
    "População mononuclear imatura/atípica suspeita. Não classificar como campo limitado simples. Requer revisão hematológica especializada, correlação com hemograma e, se indicado, imunofenotipagem.";

  finalResult.mainFinding = criticalText;
  finalResult.primaryFinding = criticalText;
  finalResult.finalConclusion = criticalText;

  finalResult.morphologyAnalysis = finalResult.morphologyAnalysis || {};
  finalResult.morphologyAnalysis.summary = criticalText;
  finalResult.morphologyAnalysis.overview =
    "Campo com predomínio de células mononucleares grandes/atípicas, com suspeita de população imatura/blástica.";
  finalResult.morphologyAnalysis.leukocyteReview =
    "Presença de células mononucleares grandes/atípicas. A hipótese de população imatura/blástica não deve ser descartada pela imagem isolada.";
  finalResult.morphologyAnalysis.absentFindings =
    "Bastonetes de Auer não claramente identificados; ausência global de blastos não pode ser afirmada pela imagem isolada.";

  finalResult.structuredReport = finalResult.structuredReport || {};
  finalResult.structuredReport.conclusion = criticalText;

  finalResult.overallAssessment = finalResult.overallAssessment || {};
  finalResult.overallAssessment.mainImpression = criticalText;
  finalResult.overallAssessment.requiresHumanReview = true;
  finalResult.overallAssessment.riskCategory = "CLASS_4_BLAST_SUSPICION";

  finalResult.clinicalMeaning =
    "Achado morfológico crítico. Requer correlação com hemograma, revisão microscópica profissional e, se indicado, imunofenotipagem.";

  finalResult.interpretiveSynthesis = criticalText;
}

// ============================================================================
// BE-FIX-005.4 — FINAL FIELD-SCOPED NEGATIVE FINDINGS LOCK
// Must run after all legacy recovery/governor/narrative layers.
// ============================================================================
finalResult =
  applyFieldScopedNegativeFindings(
    finalResult,
  );

// ============================================================================
// BE-FIX-005.5.2 — FINAL AMR EVIDENCE LOCK
// Rebuild from protected LME after all legacy governors and narrative locks.
// LIMITED_FIELD may change scope, but may not erase academic morphology.
// ============================================================================
const finalAcademicMorphologyReasoning =
  createAcademicMorphologyReasoning({
    localMorphologyEvidence:
      finalResult.localMorphologyEvidence || {},
    fieldAdequacy:
      finalResult.fieldAdequacy || {},
    evidenceGovernance:
      finalResult.evidenceGovernance || {},
  });

const finalAcademicMorphologyReasoningContract =
  academicMorphologyReasoningContractStatus(
    finalAcademicMorphologyReasoning,
  );

finalResult =
  attachAcademicMorphologyReasoning(
    finalResult,
    finalAcademicMorphologyReasoning,
  );

finalResult =
  projectAcademicMorphologyReasoningCompatibility(
    finalResult,
    finalAcademicMorphologyReasoning,
  );

// ============================================================================
// BE-FIX-005.11 — FINAL EVIDENCE-CONSISTENT MORPHOLOGY SYNTHESIS
// Canonical LME-1.0 is projected after all legacy narrative/governor layers.
// ============================================================================
finalResult =
  applyEvidenceConsistentFinalMorphologySynthesis(
    finalResult,
  );

if (specimenGate.analysisType === "peripheral_blood") {
  finalResult = applyPeripheralPositiveMorphologyArbitration(finalResult);
  console.log(
    "BE-FIX-005.50.4 — PERIPHERAL POSITIVE MORPHOLOGY / PRE-SENTINEL ARBITRATION",
    JSON.stringify(finalResult.peripheralPositiveMorphologyArbitration || {}, null, 2),
  );
}

if (specimenGate.analysisType === "peripheral_blood") {
  finalResult =
    applyPeripheralFocalHematopoieticCytomorphologyResolution(finalResult);
  console.log(
    "BE-FIX-005.50.10 — FOCAL CYTOMORPHOLOGY CALIBRATION / PRE-SENTINEL",
    JSON.stringify(
      finalResult.peripheralFocalHematopoieticCytomorphology || {},
      null,
      2,
    ),
  );
}

if (specimenGate.analysisType === "peripheral_blood") {
  finalResult = applyPeripheralBlastoidCytologyAuthority(finalResult);
  console.log(
    "BE-FIX-005.50.5 — PERIPHERAL BLASTOID CYTOLOGY AUTHORITY / PRE-SENTINEL",
    JSON.stringify(finalResult.peripheralBlastoidCytologyAuthority || {}, null, 2),
  );
}

// ============================================================================
// BE-FIX-005.13 — SINGLE BLAST SENTINEL
// One positive blast/blast-like signal is sufficient to activate the critical
// review pathway. Run after the final morphology synthesis so reactive/limited
// field layers cannot suppress it, then rebuild field-scoped negatives.
// ============================================================================
if (specimenGate.analysisType === "bone_marrow") {
  finalResult = applyMarrowPrecursorDiscrimination(finalResult);
  finalResult = applyMarrowPhysiologicPrecursorCoherence(finalResult);
}

finalResult =
  applySingleBlastSentinel(
    finalResult,
  );

// ============================================================================
// BE-FIX-005.14 — PARASITE EVIDENCE SENTINEL & ARTIFACT DISCRIMINATION
// Runs after the blast sentinel. It may remove false parasite promotion but
// never downgrades a positive blast alert.
// ============================================================================
finalResult =
  applyParasiteEvidenceSentinel(
    finalResult,
  );

if (specimenGate.analysisType === "peripheral_blood") {
  finalResult = applyPeripheralPositiveMorphologyArbitration(finalResult);
  console.log(
    "BE-FIX-005.50.4 — COMPETING HEMATOPOIETIC / PARASITE SENTINEL ARBITRATION",
    JSON.stringify(finalResult.peripheralPositiveMorphologyArbitration || {}, null, 2),
  );
}

// ============================================================================
// BE-FIX-005.15 — EVIDENCE-GROUNDED REACTIVE LYMPHOID SENTINEL
// Removes unsupported reactive/viral population inference while preserving
// observed atypical mononuclear morphology. Blast and parasite sentinels retain
// higher priority.
// ============================================================================
finalResult =
  applyReactiveLymphoidEvidenceSentinel(
    finalResult,
  );

// BE-FIX-005.26 — FINAL MARROW POSITIVE-EVIDENCE PRIORITY LOCK.
// Runs after generic blast/parasite/reactive sentinels. It preserves the
// medullary evidence class while allowing field adequacy to remain a separate
// representativity qualifier.
if (specimenGate.analysisType === "bone_marrow") {
  finalResult = applyMarrowPrecursorDiscrimination(finalResult);
  finalResult = applyMarrowBlastPopulationGovernance(finalResult);
  finalResult = applyMarrowPhysiologicPrecursorCoherence(finalResult);
}

finalResult =
  applyFieldScopedNegativeFindings(
    finalResult,
  );

if (specimenGate.analysisType === "peripheral_blood") {
  finalResult =
    applyPeripheralFocalHematopoieticCytomorphologyResolution(finalResult);
  finalResult = applyPeripheralBlastoidCytologyAuthority(finalResult);
  finalResult = applyPeripheralNegativeFindingAuthorityControl(finalResult);
  console.log(
    "BE-FIX-005.50.10 — FOCAL CELL MATURATION CALIBRATION / TERMINAL PROJECTION",
    JSON.stringify(
      finalResult.peripheralFocalHematopoieticCytomorphology || {},
      null,
      2,
    ),
  );
  console.log(
    "BE-FIX-005.50.5 — PERIPHERAL BLASTOID / NEGATIVE-FINDING TERMINAL AUTHORITY",
    JSON.stringify(
      {
        blastoid: finalResult.peripheralBlastoidCytologyAuthority || {},
        negativeAuthority: finalResult.negativeFindingAuthority || {},
      },
      null,
      2,
    ),
  );

  // ========================================================================
  // BE/FE-FIX-005.50.9 — FOCAL BLASTOID CARDINALITY AUTHORITY
  // One focal blastoid cell remains a positive focal finding, but may not be
  // promoted to a blast population, blast percentage or diagnosis unless a
  // separate structured population-evidence gate is established.
  // ========================================================================
  finalResult =
    applyPeripheralFocalBlastoidCardinalityAuthority(finalResult);

  console.log(
    "BE-FIX-005.50.9 — FOCAL BLASTOID CARDINALITY AUTHORITY",
    JSON.stringify(
      finalResult.peripheralFocalBlastoidCardinalityAuthority || {},
      null,
      2,
    ),
  );
}

// BE-FIX-005.32 — final marrow result coherence lock.
if (specimenGate.analysisType === "bone_marrow") {
  finalResult = applyMarrowFinalResultCoherence(finalResult);
}

if (specimenGate.analysisType === "bone_marrow") {
  finalResult = applyMarrowPrecursorDiscrimination(finalResult);
  finalResult = applyMarrowBlastPopulationGovernance(finalResult);
  finalResult = applyMarrowPhysiologicPrecursorCoherence(finalResult);

  // BE-FIX-005.38 — final third-axis lock. It may recover a pathologic
  // myeloid-expansion pattern from legacy "immatureCells => blast" or
  // "continuum => physiologic" coupling, but never suppresses a structured
  // blastoid subpopulation.
  finalResult = applyMarrowMyeloidExpansionDiscrimination(finalResult);

  // BE-FIX-005.44 — legacy focal positive evidence is contextualized after
  // the protected myeloid-expansion state is known, without erasing focal
  // cytology and without creating a global blast-negative conclusion.
  finalResult =
    applyMarrowPositiveBlastEvidenceSemanticSupersession(
      finalResult,
    );

  // BE-FIX-005.42 — reconcile all dependent marrow states only after the
  // protected 005.38/005.41 dominant pattern has been established.
  finalResult = applyMarrowDominantPatternStateReconciliation(finalResult);
  finalResult =
    applyMarrowPositiveBlastEvidenceSemanticSupersession(
      finalResult,
    );
  console.log(
    "BE-FIX-005.42 — MARROW DOMINANT PATTERN STATE RECONCILIATION",
    JSON.stringify(finalResult.marrowDominantPatternStateReconciliation || {}, null, 2),
  );

  console.log(
    "BE-FIX-005.44 — MARROW POSITIVE BLAST EVIDENCE SEMANTIC SUPERSESSION / FINAL PROJECTION LOCK",
    JSON.stringify(
      {
        semanticSupersession:
          finalResult.marrowPositiveBlastEvidenceSemanticSupersession || {},
        finalProjectionLock:
          finalResult.marrowFinalBlastProjectionLock || {},
      },
      null,
      2,
    ),
  );
}

// ============================================================================
// BE-FIX-005.46 — FINAL MARROW AUTHORITY / POST-LEGACY RECONCILIATION
// This is the terminal marrow writer after every legacy raw restore, generic
// safety lock, sentinel and 005.42/005.44 reconciliation. CRA consumes this
// reconciled state. Limited-field adequacy remains a separate axis.
// ============================================================================
if (specimenGate.analysisType === "bone_marrow") {
  finalResult = applyFinalMarrowAuthority(finalResult);

  console.log(
    "BE-FIX-005.46 — FINAL MARROW AUTHORITY / POST-LEGACY RECONCILIATION",
    JSON.stringify(
      {
        authority: finalResult.finalMarrowAuthority || {},
        adequacyMorphologyAxis:
          finalResult.marrowAdequacyMorphologyAxis || {},
        finalClassification: finalResult.finalClassification,
        morphologicRiskClass: finalResult.morphologicRiskClass,
        blastSuspicion: finalResult.findings?.blastSuspicion,
        dominantPattern: finalResult.globalPattern?.dominantPattern,
      },
      null,
      2,
    ),
  );
}

// ============================================================================
// BE-FIX-005.50.3 — RESIDUAL BLAST SEMANTIC CLEANUP
// Runs after terminal marrow authority and before criticality calibration.
// It clears stale population-level blast suspicion only when terminal evidence
// supports pathologic myeloid expansion with maturation and lacks qualified
// distinct/coherent/structured blastoid architecture. Local immature cytology
// is preserved and global blast-negative exclusion remains forbidden.
// ============================================================================
if (specimenGate.analysisType === "bone_marrow") {
  finalResult =
    applyMarrowResidualBlastSemanticCleanup(finalResult);

  console.log(
    "BE-FIX-005.50.3 — RESIDUAL BLAST SEMANTIC CLEANUP",
    JSON.stringify(
      finalResult.marrowResidualBlastSemanticCleanup || {},
      null,
      2,
    ),
  );
}

// ============================================================================
// BE-FIX-005.49 — MARROW MYELOPROLIFERATIVE PATTERN CORRELATION
//                 & SEVERITY-CRITICALITY CALIBRATION
// Runs after terminal marrow authority and before CRA so the canonical result
// receives morphology severity/criticality independently from field adequacy
// and diagnostic confidence.
// ============================================================================
if (specimenGate.analysisType === "bone_marrow") {
  finalResult =
    applyMarrowMyeloproliferativePatternCriticality(finalResult);

  console.log(
    "BE-FIX-005.49 — MARROW MYELOPROLIFERATIVE PATTERN / SEVERITY-CRITICALITY",
    JSON.stringify(
      {
        correlation:
          finalResult.marrowMyeloproliferativePatternCorrelation || {},
        severity:
          finalResult.marrowSeverityCriticality || {},
        clinicalCriticality:
          finalResult.clinicalCriticality || {},
        evidenceWeightedCore: {
          version:
            finalResult.marrowMyeloproliferativePatternCorrelation
              ?.evidenceWeightedCriticalityVersion || null,
          coreMyeloidSignalCount:
            finalResult.marrowMyeloproliferativePatternCorrelation
              ?.coreMyeloidSignalCount ?? null,
          completeCoreMyeloidSignature:
            finalResult.marrowMyeloproliferativePatternCorrelation
              ?.completeCoreMyeloidSignature ?? false,
          highSalienceCriticalSignature:
            finalResult.marrowMyeloproliferativePatternCorrelation
              ?.highSalienceCriticalSignature ?? false,
        },
        finalClassification:
          finalResult.finalClassification,
        morphologicRiskClass:
          finalResult.morphologicRiskClass,
        riskLevel:
          finalResult.riskLevel,
        diagnosticConfidence:
          finalResult.confidenceAnalysis?.confidenceHierarchy?.diagnosticLevel ??
          null,
        adequacy:
          finalResult.marrowAdequacyMorphologyAxis?.adequacyClassification ??
          null,
      },
      null,
      2,
    ),
  );
}

// ============================================================================
// BE-FIX-005.50.17 — UNRESOLVED IMMATURE-CELL FINAL-STATE COHERENCE
// Runs after terminal marrow authority/criticality and before CRA. The state
// remains focal + indeterminate, never population-positive, never physiologic
// by default, and never authorizes blast-percentage inference.
// ============================================================================
if (specimenGate.analysisType === "bone_marrow") {
  finalResult =
    applyMarrowUnresolvedImmaturityFinalStateCoherence(finalResult);

  console.log(
    "BE-FIX-005.50.17 — MARROW UNRESOLVED IMMATURE-CELL FINAL-STATE COHERENCE",
    JSON.stringify(
      finalResult.marrowUnresolvedImmaturityFinalStateCoherence || {},
      null,
      2,
    ),
  );
}

// ============================================================================
// CRA-001.1 — CANONICAL CLINICAL TRUTH FOUNDATION
// Runs only after 005.11 → 005.13 → 005.14 → 005.15 and the final field-
// scoped negative rebuild. The legacy payload is preserved for compatibility;
// clinicalResultV2 is the new additive canonical contract.
// ============================================================================
try {
  finalResult =
    attachClinicalResultV2(
      finalResult,
      {
        specimenType,
        analysisSource,
      },
    );
} catch (craError) {
  console.error(
    "CRA-001.1 CANONICAL TRUTH BLOCKED DELIVERY:",
    craError?.validation || craError,
  );

  return res.status(422).json({
    success: false,
    error:
      "A validação canônica do resultado clínico bloqueou a entrega por inconsistência interna.",
    errorCode:
      craError?.code || "CRA_CANONICAL_TRUTH_INVALID",
    clinicalResultV2Validation:
      craError?.validation || null,
  });
}

// ============================================================================
// BE-FIX-005.50.2 — TERMINAL CLINICAL CRITICALITY AUTHORITY (compatibility invariant)
// BE-FIX-005.50.3 — TERMINAL CLINICAL CRITICALITY / CANONICAL PRESENTATION LOCK
// Runs after CRA projection so no late presentation writer can downgrade the
// calibrated clinical criticality.
// ============================================================================
if (specimenGate.analysisType === "bone_marrow") {
  const clinicalCriticality =
    finalResult.clinicalCriticality &&
    typeof finalResult.clinicalCriticality === "object"
      ? finalResult.clinicalCriticality
      : {};

  const level =
    String(
      clinicalCriticality.level ||
      finalResult.marrowSeverityCriticality?.level ||
      "",
    ).trim().toUpperCase();

  const v2 =
    finalResult.clinicalResultV2 &&
    typeof finalResult.clinicalResultV2 === "object"
      ? finalResult.clinicalResultV2
      : null;

  if (v2 && (level === "CRITICAL" || level === "HIGH")) {
    v2.risk = {
      ...(v2.risk || {}),
      severity: level,
      clinicalCriticalityLevel: level,
      clinicalCriticalityScore:
        Number.isFinite(Number(clinicalCriticality.score))
          ? Number(clinicalCriticality.score)
          : null,
      terminalClinicalCriticalityAuthorityVersion: "BE-FIX-005.50.3",
    };

    v2.presentation = {
      ...(v2.presentation || {}),
      clinicalCriticality: {
        ...(v2.presentation?.clinicalCriticality || {}),
        level,
        score:
          Number.isFinite(Number(clinicalCriticality.score))
            ? Number(clinicalCriticality.score)
            : null,
        label:
          clinicalCriticality.label ||
          finalResult.marrowSeverityCriticality?.label ||
          null,
        colorToken: level === "CRITICAL" ? "RED" : "ORANGE",
        urgency:
          clinicalCriticality.urgency ||
          (level === "CRITICAL"
            ? "PRIORITY_HEMATOLOGY_REVIEW"
            : "EXPEDITED_HEMATOLOGY_REVIEW"),
        terminalClinicalCriticalityAuthorityVersion: "BE-FIX-005.50.3",
      },
      terminalClinicalCriticalityAuthorityVersion: "BE-FIX-005.50.3",
    };
  }

  console.log(
    "BE-FIX-005.50.3 — TERMINAL CLINICAL CRITICALITY AUTHORITY",
    JSON.stringify(
      {
        level,
        score: clinicalCriticality.score ?? null,
        v2Severity: v2?.risk?.severity ?? null,
        v2PresentationLevel:
          v2?.presentation?.clinicalCriticality?.level ?? null,
        colorToken:
          v2?.presentation?.clinicalCriticality?.colorToken ?? null,
        positivePolychromasia:
          v2?.lineages?.erythrocytes?.positiveMorphology?.polychromasia ??
          false,
      },
      null,
      2,
    ),
  );
}

// ============================================================================
// BE/FE-FIX-005.50.9 — CANONICAL CLINICAL PRESENTATION / FOCAL CARDINALITY LOCK
// Presentation-only projection. It must not rewrite morphology, evidence,
// maturation state, negative-finding authority or clinical criticality.
// ============================================================================
finalResult =
  applyCanonicalClinicalPresentationAuthority(
    finalResult,
  );

// BE-FIX-005.50.17 — presentation is the last user-facing writer. Reapply the
// unresolved-immaturity lock after 005.50.9 so no canonical presentation can
// re-enable blast percentage inference, emit a reassuring normal pattern, or
// expose internal BE-FIX labels in clinical prose.
if (specimenGate.analysisType === "bone_marrow") {
  finalResult =
    applyMarrowUnresolvedImmaturityFinalStateCoherence(finalResult);
}

console.log(
  "BE-FIX-005.50.9 — CANONICAL CLINICAL PRESENTATION",
  JSON.stringify(finalResult.clinicalPresentation || {}, null, 2),
);

finalResult.academicMorphologyReasoningContract =
  finalAcademicMorphologyReasoningContract;

console.log(
  "FINAL AMR-1.0",
  JSON.stringify(
    {
      contract:
        finalAcademicMorphologyReasoningContract,
      evidenceAvailable:
        finalAcademicMorphologyReasoning.evidenceAvailable,
      reasoningScope:
        finalAcademicMorphologyReasoning.reasoningScope,
      whatISee:
        finalAcademicMorphologyReasoning.whatISee,
      whatItResembles:
        finalAcademicMorphologyReasoning.whatItResembles,
      cannotConfirm:
        finalAcademicMorphologyReasoning.cannotConfirm,
      teachingPoints:
        finalAcademicMorphologyReasoning.teachingPoints,
    },
    null,
    2,
  ),
);

return res.json({

  success: true,

  analysis:
    finalResult,

  metadata: {

    model:
      OPENAI_MODEL,

    vmeProductionEnforcement:
      PRODUCTION_VME_ENFORCEMENT_VERSION,

    timestamp:
      new Date()
        .toISOString(),

    images:
      uploadedFiles.length,

    userId,

    totalUses:
      data.totalUses,

    analysisSource,
  },
});

    } catch (error) {

      console.error(
        "ANALYZE-SLIDE ERROR:",
        error,
      );

      return res.status(500).json({

        success: false,

        error:
          "Erro ao analisar lâmina.",

        detail:
          error.message,
      });
    }
  }
);

// ============================================================================
// HEMA ASK
// ============================================================================

app.post(
  "/hema-ask",

  auth,

  upload.array(
    "files",
    4,
  ),

  async (req, res) => {

    try {

      const {
        question = "",
      } = req.body || {};


      const uploadedFiles =
        req.files || [];


      const content = [
        {
          type: "text",

          text: `

Você é o HemaAsk AI Enterprise V11.

Sistema avançado de educação hematológica, morfologia celular, hematopatologia, correlação clínico-laboratorial e interpretação microscópica assistida por inteligência artificial.

════════════════════════════════════════════════════

MISSÃO

Ensinar hematologia em nível universitário, hospitalar e de pós-graduação.

Atuar simultaneamente como:

• Professor universitário de Hematologia
• Hematologista clínico
• Hematopatologista
• Especialista em morfologia celular
• Especialista em medicina laboratorial
• Consultor em análises clínicas
• Tutor acadêmico avançado

Seu objetivo é ensinar raciocínio hematológico.

Não responder como chatbot.

Responder como especialista experiente.

════════════════════════════════════════════════════

IDIOMA

Detecte automaticamente o idioma da pergunta.

Responda integralmente no mesmo idioma utilizado pelo usuário.

Nunca misturar idiomas.

Caso o usuário solicite explicitamente outro idioma, respeitar sua solicitação.

Manter nomenclaturas internacionais quando relevante:

Blast
Myeloblast
Lymphoblast
Schistocyte
Auer Rod
Howell-Jolly Body
CD34
CD117
MPO
FLT3
NPM1
BCR-ABL1
JAK2

════════════════════════════════════════════════════

NÍVEL DE RESPOSTA

Responder em nível compatível com:

• Medicina
• Biomedicina
• Farmácia
• Residência Médica
• Hematologia
• Patologia Clínica
• Pós-graduação em Análises Clínicas

Priorizar:

• fisiopatologia
• correlação clínico-laboratorial
• mecanismos celulares
• interpretação prática
• raciocínio diagnóstico
• morfologia microscópica
• medicina baseada em evidências

Evitar:

• respostas superficiais
• definições de dicionário
• respostas excessivamente curtas
• respostas genéricas

Sempre explicar:

• o que é
• por que acontece
• qual a importância
• qual o impacto clínico
• quais as possíveis correlações
• quais os diferenciais
• quais exames ajudam na investigação

════════════════════════════════════════════════════

SE HOUVER IMAGEM, FOTO OU DOCUMENTO

Responder obrigatoriamente nesta ordem:

1. O que é visível
2. Descrição morfológica
3. Interpretação educacional
4. Possíveis correlações
5. Limitações da análise
6. Necessidade de validação profissional

Nunca inverter essa ordem.

Nunca afirmar diagnóstico baseado apenas na imagem.

════════════════════════════════════════════════════

ESTRUTURA OBRIGATÓRIA

# 🔬 O QUE ESTOU OBSERVANDO

Descrever claramente o conceito, achado ou estrutura identificada.

Se houver imagem:
descrever exatamente o que está visível.

════════════════════════════════════════════════════

# 🧬 ORIGEM E FISIOPATOLOGIA

Explicar:

• origem celular
• linhagem hematopoética
• mecanismos biológicos envolvidos
• processos de maturação
• alterações fisiopatológicas relevantes

════════════════════════════════════════════════════

# 🔎 MORFOLOGIA MICROSCÓPICA

Descrever:

• tamanho celular
• relação núcleo/citoplasma
• cromatina
• nucléolos
• citoplasma
• granulações
• segmentação
• inclusões celulares
• alterações estruturais

Utilizar linguagem microscópica profissional.

════════════════════════════════════════════════════

# 🧫 IMUNOFENOTIPAGEM E MARCADORES

Quando aplicável:

• CD34
• CD117
• MPO
• CD13
• CD33
• CD19
• CD10
• CD7
• HLA-DR

ou outros marcadores relevantes.

Explicar seu significado.

════════════════════════════════════════════════════

# 📊 SIGNIFICADO HEMATOLÓGICO

Responder ao:

"E daí?"

Explicar:

• por que o achado importa
• relevância hematológica
• consequências biológicas
• implicações clínicas potenciais

════════════════════════════════════════════════════

# 🏥 IMPACTO CLÍNICO

Explicar o que esse achado pode representar na prática clínica.

Descrever possíveis repercussões:

• anemia
• neutropenia
• trombocitopenia
• hemólise
• falência medular
• inflamação
• infecção
• neoplasias hematológicas

Quando aplicável.

════════════════════════════════════════════════════

# ⚠️ POSSÍVEIS ASSOCIAÇÕES CLÍNICAS

Utilizar exclusivamente:

• pode sugerir
• pode estar associado a
• pode ocorrer em
• pode ser observado em

NUNCA:

• diagnosticar
• confirmar doença
• fechar laudo
• afirmar neoplasia

════════════════════════════════════════════════════

# 🧠 DIAGNÓSTICOS DIFERENCIAIS EDUCACIONAIS

Listar condições que podem produzir achados semelhantes.

Explicar como diferenciá-las.

Sempre deixar claro:

"não representam diagnóstico definitivo."

════════════════════════════════════════════════════

# 🧪 EXAMES CORRELATOS

Listar apenas exames relevantes.

Exemplos:

• Hemograma
• Esfregaço periférico
• Reticulócitos
• LDH
• Bilirrubinas
• Haptoglobina
• Ferritina
• Mielograma
• Biópsia de medula óssea
• Citometria de fluxo
• Citogenética
• Biologia molecular

Explicar por que cada exame pode ser útil.

════════════════════════════════════════════════════

# 🖼️ ATLAS HEMATOLÓGICO RELACIONADO

Descrever os achados morfológicos clássicos observados em atlas hematológicos.

Exemplos:

• cromatina frouxa
• nucléolos evidentes
• esquizócitos fragmentados
• granulações tóxicas
• corpúsculos de Howell-Jolly

Relacionar com o atlas educacional quando pertinente.

════════════════════════════════════════════════════

# 🎓 RACIOCÍNIO EDUCACIONAL

Conectar:

morfologia
→ fisiopatologia
→ laboratório
→ clínica
→ investigação

Explicar como um professor experiente.

════════════════════════════════════════════════════

# 📚 PÉROLAS PARA PROVAS E CONCURSOS

Fornecer de 3 a 5 pontos clássicos frequentemente cobrados em:

• Residência Médica
• Hematologia
• Concursos
• Universidades

════════════════════════════════════════════════════

# ❓ QUESTÃO COMENTADA

Criar uma questão objetiva inédita com:

A)
B)
C)
D)
E)

Explicar detalhadamente a alternativa correta.

════════════════════════════════════════════════════

# 👨‍⚕️ VALIDAÇÃO PROFISSIONAL

Informar obrigatoriamente:

• finalidade educacional
• não constitui diagnóstico
• não substitui laudo
• não substitui avaliação médica
• requer correlação clínico-laboratorial
• requer interpretação por profissional habilitado

════════════════════════════════════════════════════

# 📚 NÍVEL DE EVIDÊNCIA EDUCACIONAL

Classificar:

★★★★★ Muito Alta
★★★★ Alta
★★★ Moderada

Basear explicações em referências reconhecidas:

• WHO Classification
• ICC Classification
• Williams Hematology
• Wintrobe's Clinical Hematology
• Hoffbrand's Essential Haematology

════════════════════════════════════════════════════

REGRAS DE SEGURANÇA

Nunca emitir diagnóstico definitivo.

Nunca substituir avaliação médica.

Nunca afirmar doença baseada apenas em imagem.

Nunca afirmar leucemia, linfoma ou outra neoplasia apenas por morfologia isolada.

Priorizar especificidade sobre sensibilidade.

Em caso de dúvida:

explicar as limitações da análise.

════════════════════════════════════════════════════

Pergunta:

${question}

`,
        },
      ];

      for (const file of uploadedFiles) {

        const base64 =
          file.buffer.toString("base64");

        content.push({

          type: "image_url",

          image_url: {

            url:
              `data:${file.mimetype};base64,${base64}`,
          },
        });
      }

      const completion =
        await openai.chat.completions.create({
          model: OPENAI_MODEL,

          messages: [
            {
              role: "user",
              content,
            },
          ],
        });

      const answer =
        completion
          ?.choices?.[0]
          ?.message
          ?.content ||
        "Não foi possível gerar resposta.";

      return res.json({

        success: true,

        answer,

        attachments:
          uploadedFiles.length,
      });

    } catch (error) {

      console.error(
        "HEMA ASK ERROR:",
        error,
      );

      return res.status(500).json({

        success:
          false,

        error:
          error.message,
      });
    }
  },
);

// ============================================================================
// START SERVER
// ============================================================================

app.listen(

  PORT,

  "0.0.0.0",

  () => {

    console.log(
      `🔥 CELLCOUNT ELITE HOSPITAL rodando na porta ${PORT}`,
    );

    console.log(
      `🧠 Modelo: ${OPENAI_MODEL}`,
    );

    console.log(
      "🩸 IA hematológica online",
    );

    console.log(
      "🚀 PIPELINE ENTERPRISE V6 SAFE HYBRID ONLINE",
      ` | ${PRODUCTION_VME_ENFORCEMENT_VERSION} / VME-1.0 | ${LOCAL_MORPHOLOGY_ACQUISITION_RECOVERY_VERSION}`,
    );
  },
);

// ============================================================================
// NARRATIVE CONSISTENCY LOCK
// ============================================================================

function applyNarrativeConsistencyLock(
  analysis = {}
) {

  const findings =
    analysis.findings || {};

  const morph =
    analysis.morphologyAnalysis || {};

  const raw =
    JSON.stringify(analysis)
      .toLowerCase();

  const atypicalPopulation =
    findings.atypicalLymphocytes === true ||
    findings.largeMononuclearCells === true ||
    findings.reactiveLymphocytes === true ||
    findings.plasmacytoidCells === true ||
    findings.plasmocytes === true ||
    findings.plasmablasts === true ||
    findings.monomorphicPopulation === true;

  if (!atypicalPopulation)
    return analysis;

  const forbiddenExpressions = [

    "sem alterações",
    "sem alteracoes",

    "morfologia preservada",

    "normalidade hematológica",
    "normalidade hematologica",

    "ausência de blastos",
    "ausencia de blastos",

    "sem blastos",

    "sem evidência de blastos",
    "sem evidencia de blastos",

    "estado hematológico estável",
    "estado hematologico estavel"
  ];

  const cleanText = (text) => {

    if (!text)
      return text;

    let result = text;

    forbiddenExpressions.forEach(exp => {

      const regex =
        new RegExp(exp, "gi");

      result =
        result.replace(regex, "");
    });

    return result
      .replace(/\s+/g, " ")
      .trim();
  };

  morph.overview =
    cleanText(morph.overview);

  morph.summary =
    cleanText(morph.summary);

  morph.leukocyteReview =
    cleanText(morph.leukocyteReview);

  morph.biologicalInterpretation =
    cleanText(
      morph.biologicalInterpretation
    );

  analysis.clinicalMeaning =
    cleanText(
      analysis.clinicalMeaning
    );

  analysis.interpretiveSynthesis =
    cleanText(
      analysis.interpretiveSynthesis
    );

  if (
    atypicalPopulation &&
    !morph.summary?.includes(
      "população linfoide reacional"
    )
  ) {

    morph.summary =
      `
Foram identificadas células mononucleares atípicas compatíveis com ativação linfoide reacional.

Os achados não permitem classificação definitiva apenas por imagem isolada e requerem correlação com hemograma, contexto clínico e avaliação microscópica completa.
      `.trim();
  }

  analysis.morphologyAnalysis =
    morph;

  return analysis;
}