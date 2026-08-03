import {
  createClinicalValidationIssue,
} from "../domain/ClinicalValidationIssue.js";

export class ClinicalConsistencyChecker {
  check(input, policy) {
    const issues = [];

    const reasoningId =
      input.reasoningResult?.selectedHypothesis?.diseaseId ||
      null;

    const consensusId =
      input.consensusResult?.selectedConsensus?.hypothesisId ||
      null;

    const classificationId =
      input.classificationResult?.selectedClassification?.diseaseEntityId ||
      input.classificationResult?.selectedClassification?.candidateId ||
      null;

    const outcomeId =
      input.decisionTreeResult?.outcomeNodeId
        ? input.decisionTreeResult.nodes?.find(
            (node) =>
              node.id === input.decisionTreeResult.outcomeNodeId,
          )?.sourceRef || null
        : null;

    if (
      policy.requireConsensusReasoningAlignment &&
      reasoningId &&
      consensusId &&
      reasoningId !== consensusId
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-CONSENSUS-REASONING",
          code: "CONSENSUS_REASONING_MISMATCH",
          severity: "BLOCKING",
          source: "CONSISTENCY",
          message:
            "Diagnostic consensus and hematologic reasoning selected different hypotheses.",
          blocking: true,
          recommendation:
            "Resolve hypothesis mismatch before release.",
        }),
      );
    }

    if (
      policy.requireClassificationReasoningAlignment &&
      classificationId &&
      reasoningId &&
      classificationId !== reasoningId
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-CLASSIFICATION-REASONING",
          code: "CLASSIFICATION_REASONING_MISMATCH",
          severity: "ERROR",
          source: "CONSISTENCY",
          message:
            "Classification and reasoning selected different hypotheses.",
          recommendation:
            "Review criteria and classification precedence.",
        }),
      );
    }

    if (
      policy.requireDecisionTreeOutcomeAlignment &&
      outcomeId &&
      consensusId &&
      outcomeId !== consensusId
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-TREE-OUTCOME",
          code: "DECISION_TREE_OUTCOME_MISMATCH",
          severity: "ERROR",
          source: "DECISION_TREE",
          message:
            "Explainable decision tree outcome does not match selected consensus.",
          recommendation:
            "Rebuild the decision tree from the current clinical state.",
        }),
      );
    }

    return Object.freeze({
      issues: Object.freeze(issues),
      selectedHypothesisId:
        consensusId || reasoningId || classificationId || outcomeId,
    });
  }
}
