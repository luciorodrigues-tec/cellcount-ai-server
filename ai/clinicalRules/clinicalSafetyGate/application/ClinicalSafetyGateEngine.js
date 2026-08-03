import {
  createClinicalSafetyGateReason,
} from "../domain/ClinicalSafetyGateReason.js";

import {
  createClinicalSafetyGateDecision,
} from "../domain/ClinicalSafetyGateDecision.js";

import {
  mergeClinicalSafetyGatePolicy,
} from "../domain/ClinicalSafetyGatePolicy.js";

export const CLINICAL_SAFETY_GATE_ENGINE_VERSION =
  "CRR-000034-v1.0.0";

function normalizedAlertSeverity(alert) {
  return String(
    alert?.severity ||
    alert?.priority ||
    alert?.level ||
    "INFO",
  )
    .trim()
    .toUpperCase();
}

export class ClinicalSafetyGateEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeClinicalSafetyGatePolicy(policy);
    this.clock = clock;
  }

  evaluate(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "ClinicalSafetyGateEngine requires a valid input.",
      );
    }

    const reasons = [];
    const add = (reason) => {
      if (reasons.length < this.policy.maximumReasons) {
        reasons.push(reason);
      }
    };

    const validation =
      input.clinicalValidationResult;

    if (
      this.policy.requireValidatedStatus &&
      validation.status !== "VALIDATED"
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-VALIDATION-STATUS",
          type: "VALIDATION",
          severity:
            validation.status === "BLOCKED"
              ? "BLOCKING"
              : "ERROR",
          code: "CLINICAL_VALIDATION_NOT_VALIDATED",
          message:
            `Clinical validation status is ${validation.status || "UNKNOWN"}.`,
          blocking:
            validation.status === "BLOCKED" ||
            validation.status === "FAILED",
          recommendation:
            "Resolve validation issues before release.",
        }),
      );
    }

    if (
      this.policy.requireReleaseAllowedFromValidation &&
      validation.releaseAllowed !== true
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-VALIDATION-RELEASE",
          type: "VALIDATION",
          severity: "BLOCKING",
          code: "VALIDATION_RELEASE_NOT_ALLOWED",
          message:
            "Clinical validation did not authorize release.",
          blocking: true,
          recommendation:
            "Keep the case in review until validation authorizes release.",
        }),
      );
    }

    const validationScore =
      Number(validation.validationScore);

    if (
      Number.isFinite(validationScore) &&
      validationScore <
        this.policy.minimumValidationScoreForRelease
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-VALIDATION-SCORE",
          type: "VALIDATION",
          severity: "ERROR",
          code: "LOW_VALIDATION_SCORE",
          message:
            "Clinical validation score is below the release threshold.",
          recommendation:
            "Address validation warnings and errors.",
        }),
      );
    }

    const confidence =
      Number(
        input.confidenceCalibrationResult?.finalConfidenceScore,
      );

    if (
      Number.isFinite(confidence) &&
      confidence <
        this.policy.minimumConfidenceForRelease
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-CONFIDENCE",
          type: "CONFIDENCE",
          severity: "WARNING",
          code: "LOW_CALIBRATED_CONFIDENCE",
          message:
            "Calibrated confidence is below the release threshold.",
          recommendation:
            "Require expert review or acquire additional evidence.",
        }),
      );
    }

    const uncertainty =
      Number(
        input.uncertaintyResult?.totalUncertaintyScore,
      );

    if (
      Number.isFinite(uncertainty) &&
      uncertainty >
        this.policy.maximumUncertaintyForRelease
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-UNCERTAINTY",
          type: "UNCERTAINTY",
          severity: "WARNING",
          code: "HIGH_DIAGNOSTIC_UNCERTAINTY",
          message:
            "Diagnostic uncertainty exceeds the release threshold.",
          recommendation:
            "Resolve uncertainty factors before release.",
        }),
      );
    }

    if (
      input.consensusResult?.divergenceDetected === true &&
      this.policy.blockOnConsensusDivergence
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-CONSENSUS-DIVERGENCE",
          type: "CONSENSUS",
          severity: "BLOCKING",
          code: "CONSENSUS_DIVERGENCE",
          message:
            "Diagnostic consensus remains materially divergent.",
          blocking: true,
          recommendation:
            "Resolve disagreement between diagnostic engines.",
        }),
      );
    }

    const abstentionDetected =
      input.consensusResult?.abstentionDetected === true ||
      input.reasoningResult?.abstentionDetected === true ||
      input.confidenceCalibrationResult?.abstentionDetected === true ||
      input.uncertaintyResult?.abstentionDetected === true;

    if (
      abstentionDetected &&
      this.policy.blockOnAbstention
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-ABSTENTION",
          type: "ABSTENTION",
          severity: "BLOCKING",
          code: "UPSTREAM_ABSTENTION",
          message:
            "At least one upstream engine abstained.",
          blocking: true,
          recommendation:
            "Stop automation and obtain expert review.",
        }),
      );
    }

    if (
      input.decisionTreeResult?.cycleDetected === true &&
      this.policy.blockOnDecisionTreeCycle
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-TREE-CYCLE",
          type: "DECISION_TREE",
          severity: "BLOCKING",
          code: "DECISION_TREE_CYCLE",
          message:
            "The explainable decision tree contains a cycle.",
          blocking: true,
          recommendation:
            "Correct the decision graph before release.",
        }),
      );
    }

    if (
      input.decisionTreeResult?.disconnectedOutcome === true &&
      this.policy.blockOnDisconnectedDecisionTree
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-TREE-DISCONNECTED",
          type: "DECISION_TREE",
          severity: "BLOCKING",
          code: "DECISION_TREE_OUTCOME_DISCONNECTED",
          message:
            "The decision tree outcome is disconnected from the root.",
          blocking: true,
          recommendation:
            "Rebuild the decision tree before release.",
        }),
      );
    }

    for (const alert of input.activeAlerts) {
      const severity = normalizedAlertSeverity(alert);

      if (
        severity === "CRITICAL" &&
        this.policy.blockOnCriticalAlert
      ) {
        add(
          createClinicalSafetyGateReason({
            id:
              `GATE-ALERT-${String(alert.id || alert.code || reasons.length + 1)}`,
            type: "ALERT",
            severity: "BLOCKING",
            code:
              String(
                alert.code ||
                alert.id ||
                "CRITICAL_ALERT",
              ),
            message:
              String(
                alert.message ||
                alert.title ||
                "Critical clinical alert.",
              ),
            blocking: true,
            recommendation:
              "Resolve the critical alert before release.",
          }),
        );
      } else if (
        ["HIGH", "URGENT"].includes(severity) &&
        this.policy.requireHumanReviewOnHighAlert
      ) {
        add(
          createClinicalSafetyGateReason({
            id:
              `GATE-ALERT-${String(alert.id || alert.code || reasons.length + 1)}`,
            type: "ALERT",
            severity: "WARNING",
            code:
              String(
                alert.code ||
                alert.id ||
                "HIGH_ALERT",
              ),
            message:
              String(
                alert.message ||
                alert.title ||
                "High-priority clinical alert.",
              ),
            recommendation:
              "Require human review before release.",
          }),
        );
      }
    }

    const upstreamReviewRequired =
      validation.requiresHumanReview === true ||
      input.confidenceCalibrationResult?.requiresHumanReview === true ||
      input.uncertaintyResult?.requiresHumanReview === true ||
      input.consensusResult?.requiresHumanReview === true ||
      input.reasoningResult?.requiresHumanReview === true ||
      input.decisionTreeResult?.requiresHumanReview === true;

    if (
      upstreamReviewRequired &&
      this.policy.requireHumanReviewOnUpstreamReview
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-UPSTREAM-REVIEW",
          type: "REVIEW",
          severity: "WARNING",
          code: "UPSTREAM_REVIEW_REQUIRED",
          message:
            "At least one upstream engine requires human review.",
          recommendation:
            "Preserve mandatory human review in the final workflow.",
        }),
      );
    }

    const automationConflict =
      validation.automationAllowed === true &&
      (
        input.confidenceCalibrationResult?.automationAllowed === false ||
        input.uncertaintyResult?.automationAllowed === false
      );

    if (
      automationConflict &&
      this.policy.blockOnAutomationConflict
    ) {
      add(
        createClinicalSafetyGateReason({
          id: "GATE-AUTOMATION-CONFLICT",
          type: "AUTOMATION",
          severity: "BLOCKING",
          code: "AUTOMATION_STATE_CONFLICT",
          message:
            "Automation states are inconsistent across upstream engines.",
          blocking: true,
          recommendation:
            "Keep automation blocked until all safety states are reconciled.",
        }),
      );
    }

    const blockingReasons =
      reasons.filter(
        (reason) =>
          reason.blocking ||
          reason.severity === "BLOCKING",
      );

    const warningReasons =
      reasons.filter(
        (reason) =>
          reason.severity === "WARNING",
      );

    const errorReasons =
      reasons.filter(
        (reason) =>
          reason.severity === "ERROR",
      );

    const penalty =
      blockingReasons.length * 1 +
      errorReasons.length * 0.5 +
      warningReasons.length * 0.2;

    const safetyScore = Number(
      Math.max(
        0,
        Math.min(
          1,
          1 - penalty,
        ),
      ).toFixed(8),
    );

    const requiresHumanReview =
      warningReasons.length > 0 ||
      errorReasons.length > 0 ||
      blockingReasons.length > 0;

    const releaseAllowed =
      blockingReasons.length === 0 &&
      reasons.length === 0 &&
      validation.releaseAllowed === true;

    const automationAllowed =
      releaseAllowed &&
      validation.automationAllowed === true &&
      input.confidenceCalibrationResult?.automationAllowed !== false &&
      input.uncertaintyResult?.automationAllowed !== false;

    const decision =
      blockingReasons.length > 0
        ? "BLOCKED"
        : requiresHumanReview
          ? "HUMAN_REVIEW_REQUIRED"
          : releaseAllowed
            ? "RELEASED"
            : "HELD";

    return createClinicalSafetyGateDecision({
      caseId: input.caseId,
      decision,
      releaseAllowed,
      automationAllowed,
      requiresHumanReview,
      safetyScore,
      reasons,
      blockingReasons,
      warningReasons,
      explanation: {
        summary:
          `Clinical safety gate decision is ${decision} with score ${safetyScore.toFixed(4)}.`,
        rationale:
          `Reasons ${reasons.length}; warnings ${warningReasons.length}; errors ${errorReasons.length}; blocking ${blockingReasons.length}.`,
        safetyStatement:
          "The safety gate controls release and automation but does not establish a definitive diagnosis.",
      },
      auditTrail: {
        engineVersion:
          CLINICAL_SAFETY_GATE_ENGINE_VERSION,
        policyVersion:
          this.policy.version,
        reasonCodes:
          Object.freeze(
            reasons.map(
              (reason) => reason.code,
            ),
          ),
      },
      createdAt:
        this.clock().toISOString(),
      metadata: {
        sourceMetadata:
          input.metadata,
      },
    });
  }
}
