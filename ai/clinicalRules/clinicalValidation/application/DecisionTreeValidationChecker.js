import {
  createClinicalValidationIssue,
} from "../domain/ClinicalValidationIssue.js";

export class DecisionTreeValidationChecker {
  validate(input, policy) {
    const issues = [];
    const tree = input.decisionTreeResult;

    if (!tree) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-NO-TREE",
          code: "DECISION_TREE_MISSING",
          severity: "WARNING",
          source: "DECISION_TREE",
          message:
            "No explainable decision tree is available.",
          recommendation:
            "Generate the decision tree before final clinical release.",
        }),
      );
      return Object.freeze(issues);
    }

    if (
      tree.cycleDetected &&
      policy.blockOnDecisionTreeCycle
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-TREE-CYCLE",
          code: "DECISION_TREE_CYCLE",
          severity: "BLOCKING",
          source: "DECISION_TREE",
          message:
            "The explainable decision tree contains a cycle.",
          blocking: true,
          recommendation:
            "Correct the graph before release.",
        }),
      );
    }

    if (
      tree.disconnectedOutcome &&
      policy.blockOnDisconnectedDecisionTree
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-TREE-DISCONNECTED",
          code: "DECISION_TREE_OUTCOME_DISCONNECTED",
          severity: "BLOCKING",
          source: "DECISION_TREE",
          message:
            "The decision tree outcome is disconnected from the root.",
          blocking: true,
          recommendation:
            "Rebuild the graph and verify all decision links.",
        }),
      );
    }

    return Object.freeze(issues);
  }
}
