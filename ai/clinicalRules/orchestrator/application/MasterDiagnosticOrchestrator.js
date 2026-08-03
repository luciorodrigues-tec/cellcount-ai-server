import {
  mergeMasterOrchestratorPolicy,
} from "../domain/MasterOrchestratorPolicy.js";

export const MASTER_DIAGNOSTIC_ORCHESTRATOR_VERSION =
  "CRR-000011-v1.0.0";

function stageResult(name, status, payload, error = null) {
  return Object.freeze({
    name,
    status,
    payload,
    error,
  });
}

export class MasterDiagnosticOrchestrator {
  constructor({
    clinicalRuleExecutionService = null,
    ruleEvidenceEngine = null,
    consensusEngine = null,
    differentialEngine = null,
    bayesianEngine = null,
    fusionEngine = null,
    rankingEngine = null,
    synthesisAdapter = null,
    policy = {},
  } = {}) {
    this.services = Object.freeze({
      clinicalRuleExecutionService,
      ruleEvidenceEngine,
      consensusEngine,
      differentialEngine,
      bayesianEngine,
      fusionEngine,
      rankingEngine,
      synthesisAdapter,
    });

    this.policy =
      mergeMasterOrchestratorPolicy(policy);
  }

  async execute(context) {
    if (!context?.executionId) {
      throw new TypeError(
        "MasterDiagnosticOrchestrator requires a valid context.",
      );
    }

    const stages = [];
    const errors = [];

    const runStage = async (
      name,
      service,
      operation,
    ) => {
      if (!service) {
        stages.push(
          stageResult(
            name,
            "SKIPPED",
            null,
          ),
        );
        return null;
      }

      try {
        const payload =
          await operation(service);

        stages.push(
          stageResult(
            name,
            "COMPLETED",
            payload,
          ),
        );

        return payload;
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : String(cause);

        errors.push(
          Object.freeze({
            stage: name,
            message,
          }),
        );

        stages.push(
          stageResult(
            name,
            "FAILED",
            null,
            message,
          ),
        );

        if (this.policy.failFast) {
          throw cause;
        }

        return null;
      }
    };

    const ruleExecution =
      await runStage(
        "CLINICAL_RULE_EXECUTION",
        this.services
          .clinicalRuleExecutionService,
        (service) =>
          service.apply(context.input),
      );

    const evidenceExecution =
      await runStage(
        "RULE_EVIDENCE_ENRICHMENT",
        this.services.ruleEvidenceEngine,
        (service) =>
          ruleExecution
            ? service.enrichExecution(
                ruleExecution,
              )
            : null,
      );

    const consensus =
      await runStage(
        "CONSENSUS_DIAGNOSTIC",
        this.services.consensusEngine,
        (service) =>
          service.evaluateAll({
            execution:
              evidenceExecution ||
              ruleExecution,
          }),
      );

    const differential =
      await runStage(
        "DIFFERENTIAL_REASONING",
        this.services.differentialEngine,
        (service) =>
          service.rank({
            consensus,
          }),
      );

    const bayesian =
      await runStage(
        "BAYESIAN_CONFIDENCE",
        this.services.bayesianEngine,
        (service) =>
          service.evaluateAll({
            evidence:
              context.metadata
                ?.bayesianEvidence ||
              [],
          }),
      );

    const fusion =
      await runStage(
        "MULTI_EVIDENCE_FUSION",
        this.services.fusionEngine,
        (service) =>
          service.fuseAll({
            signals:
              context.metadata
                ?.fusionSignals ||
              null,
          }),
      );

    const ranking =
      await runStage(
        "DIAGNOSTIC_HYPOTHESIS_RANKING",
        this.services.rankingEngine,
        (service) =>
          service.rank({
            fusionResults:
              fusion?.rankedResults ||
              [],
            bayesianResults:
              bayesian?.rankedResults ||
              [],
            differentialResults:
              differential
                ?.rankedCandidates ||
              [],
            consensusResults:
              consensus?.results || [],
          }),
      );

    const synthesis =
      await runStage(
        "CLINICAL_SYNTHESIS",
        this.services.synthesisAdapter,
        (service) =>
          service.synthesize({
            context,
            ruleExecution,
            evidenceExecution,
            consensus,
            differential,
            bayesian,
            fusion,
            ranking,
          }),
      );

    const abstentionDetected =
      stages.some((stage) =>
        JSON.stringify(stage.payload || {})
          .includes('"ABSTAINED"'),
      );

    const conflictDetected =
      stages.some((stage) =>
        JSON.stringify(stage.payload || {})
          .includes('"CONFLICTED"'),
      );

    const requiresHumanReview =
      (
        this.policy
          .requireHumanReviewOnAnyStageError &&
        errors.length > 0
      ) ||
      (
        this.policy
          .requireHumanReviewOnAnyAbstention &&
        abstentionDetected
      ) ||
      (
        this.policy
          .requireHumanReviewOnAnyConflict &&
        conflictDetected
      ) ||
      stages.some(
        (stage) =>
          stage.payload
            ?.requiresHumanReview === true,
      );

    return Object.freeze({
      schemaVersion:
        "CRR-ORCHESTRATION-1",
      orchestratorVersion:
        MASTER_DIAGNOSTIC_ORCHESTRATOR_VERSION,
      executionId:
        context.executionId,
      status:
        errors.length === 0
          ? "COMPLETED"
          : "COMPLETED_WITH_ERRORS",
      requiresHumanReview,
      stageCount: stages.length,
      completedStageCount:
        stages.filter(
          (stage) =>
            stage.status === "COMPLETED",
        ).length,
      failedStageCount:
        stages.filter(
          (stage) =>
            stage.status === "FAILED",
        ).length,
      skippedStageCount:
        stages.filter(
          (stage) =>
            stage.status === "SKIPPED",
        ).length,
      errors: Object.freeze(errors),
      stages: Object.freeze(stages),
      finalRanking: ranking,
      synthesis,
      safetyStatement:
        "This orchestrated output is clinical decision support and not a definitive diagnosis.",
    });
  }
}
