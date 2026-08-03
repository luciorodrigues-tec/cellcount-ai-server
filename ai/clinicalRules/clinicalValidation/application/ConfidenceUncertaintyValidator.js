import {
  createClinicalValidationIssue,
} from "../domain/ClinicalValidationIssue.js";

export class ConfidenceUncertaintyValidator {
  validate(input, policy) {
    const issues = [];

    const confidence =
      Number(
        input.confidenceCalibrationResult?.finalConfidenceScore,
      );

    const uncertainty =
      Number(
        input.uncertaintyResult?.totalUncertaintyScore,
      );

    if (
      Number.isFinite(confidence) &&
      Number.isFinite(uncertainty) &&
      confidence + uncertainty >
        policy.maximumConfidenceUncertaintySum
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-CONFIDENCE-UNCERTAINTY",
          code: "CONFIDENCE_UNCERTAINTY_INCONSISTENCY",
          severity: "WARNING",
          source: "META_REASONING",
          message:
            "Confidence and uncertainty are jointly higher than expected.",
          recommendation:
            "Review calibration and uncertainty weighting.",
        }),
      );
    }

    if (
      input.confidenceCalibrationResult?.automationAllowed === true &&
      input.uncertaintyResult?.automationAllowed === false &&
      policy.blockOnAutomationConflict
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-AUTOMATION-CONFLICT",
          code: "AUTOMATION_STATE_CONFLICT",
          severity: "BLOCKING",
          source: "SAFETY",
          message:
            "Confidence calibration allows automation while uncertainty blocks it.",
          blocking: true,
          recommendation:
            "Automation must remain blocked until safety states are reconciled.",
        }),
      );
    }

    return Object.freeze(issues);
  }
}
