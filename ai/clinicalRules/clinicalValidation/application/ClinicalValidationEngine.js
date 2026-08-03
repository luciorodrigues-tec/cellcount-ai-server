import {
  createClinicalValidationResult,
} from "../domain/ClinicalValidationResult.js";

import {
  mergeClinicalValidationPolicy,
} from "../domain/ClinicalValidationPolicy.js";

import {
  ClinicalConsistencyChecker,
} from "./ClinicalConsistencyChecker.js";

import {
  ConfidenceUncertaintyValidator,
} from "./ConfidenceUncertaintyValidator.js";

import {
  EvidenceSupportValidator,
} from "./EvidenceSupportValidator.js";

import {
  DecisionTreeValidationChecker,
} from "./DecisionTreeValidationChecker.js";

export const CLINICAL_VALIDATION_ENGINE_VERSION =
  "CRR-000033-v1.0.0";

export class ClinicalValidationEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeClinicalValidationPolicy(policy);
    this.clock = clock;
    this.consistencyChecker =
      new ClinicalConsistencyChecker();
    this.confidenceUncertaintyValidator =
      new ConfidenceUncertaintyValidator();
    this.evidenceSupportValidator =
      new EvidenceSupportValidator();
    this.decisionTreeChecker =
      new DecisionTreeValidationChecker();
  }

  validate(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "ClinicalValidationEngine requires a valid input.",
      );
    }

    const consistency =
      this.consistencyChecker.check(
        input,
        this.policy,
      );

    const issues = [
      ...consistency.issues,
      ...this.confidenceUncertaintyValidator.validate(
        input,
        this.policy,
      ),
      ...this.evidenceSupportValidator.validate(
        input,
        consistency.selectedHypothesisId,
        this.policy,
      ),
      ...this.decisionTreeChecker.validate(
        input,
        this.policy,
      ),
    ].slice(0, this.policy.maximumIssues);

    if (
      this.policy.requireReviewPropagation &&
      (
        input.reasoningResult?.requiresHumanReview === true ||
        input.consensusResult?.requiresHumanReview === true ||
        input.confidenceCalibrationResult?.requiresHumanReview === true ||
        input.uncertaintyResult?.requiresHumanReview === true ||
        input.decisionTreeResult?.requiresHumanReview === true
      )
    ) {
      const alreadyPresent = issues.some(
        (issue) =>
          issue.code === "UPSTREAM_REVIEW_REQUIRED",
      );

      if (!alreadyPresent) {
        issues.push(
          Object.freeze({
            schemaVersion: "CRR-000033-v1",
            id: "ISSUE-UPSTREAM-REVIEW",
            code: "UPSTREAM_REVIEW_REQUIRED",
            severity: "WARNING",
            source: "WORKFLOW",
            message:
              "At least one upstream engine requires human review.",
            blocking: false,
            recommendation:
              "Preserve expert review in the final workflow.",
            metadata: Object.freeze({}),
          }),
        );
      }
    }

    const warnings =
      issues.filter(
        (issue) =>
          issue.severity === "WARNING",
      );

    const errors =
      issues.filter(
        (issue) =>
          issue.severity === "ERROR",
      );

    const blockingIssues =
      issues.filter(
        (issue) =>
          issue.blocking ||
          issue.severity === "BLOCKING",
      );

    const scorePenalty =
      warnings.length *
        this.policy.warningIssueWeight +
      errors.length *
        this.policy.errorIssueWeight +
      blockingIssues.length *
        this.policy.blockingIssueWeight;

    const validationScore = Number(
      Math.max(
        0,
        Math.min(
          1,
          1 - scorePenalty,
        ),
      ).toFixed(8),
    );

    const clinicallyCoherent =
      errors.length === 0 &&
      blockingIssues.length === 0;

    const requiresHumanReview =
      warnings.length > 0 ||
      errors.length > 0 ||
      blockingIssues.length > 0;

    const automationAllowed =
      blockingIssues.length === 0 &&
      input.confidenceCalibrationResult?.automationAllowed !== false &&
      input.uncertaintyResult?.automationAllowed !== false;

    const releaseAllowed =
      clinicallyCoherent &&
      !requiresHumanReview &&
      automationAllowed;

    const status =
      blockingIssues.length > 0
        ? "BLOCKED"
        : errors.length > 0
          ? "FAILED"
          : warnings.length > 0
            ? "REVIEW_REQUIRED"
            : "VALIDATED";

    return createClinicalValidationResult({
      caseId: input.caseId,
      status,
      validationScore,
      clinicallyCoherent,
      requiresHumanReview,
      automationAllowed,
      releaseAllowed,
      issues,
      warnings,
      errors,
      blockingIssues,
      validatedHypothesisId:
        consistency.selectedHypothesisId,
      explanation: {
        summary:
          `Clinical validation status is ${status} with score ${validationScore.toFixed(4)}.`,
        rationale:
          `Issues ${issues.length}; warnings ${warnings.length}; errors ${errors.length}; blocking ${blockingIssues.length}.`,
        safetyStatement:
          "Clinical validation supports expert release decisions and does not establish a definitive diagnosis.",
      },
      auditTrail: {
        engineVersion:
          CLINICAL_VALIDATION_ENGINE_VERSION,
        policyVersion:
          this.policy.version,
        issueCodes:
          Object.freeze(
            issues.map(
              (issue) => issue.code,
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
