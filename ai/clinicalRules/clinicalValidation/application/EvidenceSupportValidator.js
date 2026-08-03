import {
  createClinicalValidationIssue,
} from "../domain/ClinicalValidationIssue.js";

export class EvidenceSupportValidator {
  validate(input, selectedHypothesisId, policy) {
    const issues = [];

    if (!selectedHypothesisId) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-NO-HYPOTHESIS",
          code: "NO_SELECTED_HYPOTHESIS",
          severity: "WARNING",
          source: "EVIDENCE",
          message:
            "No selected hypothesis is available for clinical validation.",
          recommendation:
            "Complete reasoning and consensus before release.",
        }),
      );
      return Object.freeze(issues);
    }

    const evidence =
      input.evidenceScores.find(
        (item) =>
          item.hypothesisId === selectedHypothesisId,
      ) || null;

    if (!evidence) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-NO-EVIDENCE",
          code: "NO_EVIDENCE_FOR_SELECTED_HYPOTHESIS",
          severity: "ERROR",
          source: "EVIDENCE",
          message:
            "The selected hypothesis has no corresponding evidence score.",
          recommendation:
            "Score supporting and opposing evidence before release.",
        }),
      );
      return Object.freeze(issues);
    }

    if (evidence.status === "ABSTAINED") {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-EVIDENCE-ABSTENTION",
          code: "EVIDENCE_ABSTENTION",
          severity: "BLOCKING",
          source: "EVIDENCE",
          message:
            "Evidence scoring abstained for the selected hypothesis.",
          blocking: true,
          recommendation:
            "Obtain additional evidence and require expert review.",
        }),
      );
    } else if (evidence.status === "CONFLICTED") {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-EVIDENCE-CONFLICT",
          code: "EVIDENCE_CONFLICT",
          severity: "ERROR",
          source: "EVIDENCE",
          message:
            "Evidence for the selected hypothesis remains conflicted.",
          recommendation:
            "Resolve conflicting evidence before release.",
        }),
      );
    } else if (
      Number.isFinite(Number(evidence.normalizedScore)) &&
      Number(evidence.normalizedScore) <
        policy.minimumEvidenceForSelectedHypothesis
    ) {
      issues.push(
        createClinicalValidationIssue({
          id: "ISSUE-EVIDENCE-LOW",
          code: "LOW_EVIDENCE_SUPPORT",
          severity: "WARNING",
          source: "EVIDENCE",
          message:
            "Evidence support for the selected hypothesis is below policy threshold.",
          recommendation:
            "Acquire stronger corroborating evidence.",
        }),
      );
    }

    return Object.freeze(issues);
  }
}
