import {
  DEFAULT_SCIENTIFIC_GOVERNANCE_POLICY,
} from "../domain/ScientificGovernancePolicy.js";

export const SCIENTIFIC_GOVERNANCE_ENGINE_VERSION =
  "CRR-000004-v1.0.0";

function reviewerHasRole(repository, reviewerId, role) {
  const reviewer = repository.getReviewer(reviewerId);

  return Boolean(
    reviewer?.active &&
    reviewer.roles.includes(role),
  );
}

export class ScientificGovernanceEngine {
  constructor({
    repository,
    evidenceRepository,
    policy =
      DEFAULT_SCIENTIFIC_GOVERNANCE_POLICY,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "ScientificGovernanceEngine requires a governance repository.",
      );
    }

    if (!evidenceRepository) {
      throw new TypeError(
        "ScientificGovernanceEngine requires an evidence repository.",
      );
    }

    this.repository = repository;
    this.evidenceRepository = evidenceRepository;
    this.policy = policy;
  }

  evaluate(record) {
    const errors = [];
    const warnings = [];

    const submitter = this.repository.getReviewer(
      record.submittedBy,
    );

    if (!submitter?.active) {
      errors.push(
        "Submitter must be an active registered reviewer.",
      );
    }

    const reviewers = record.reviewerIds
      .map((id) => this.repository.getReviewer(id))
      .filter(Boolean);

    const approvers = record.approverIds
      .map((id) => this.repository.getReviewer(id))
      .filter(Boolean);

    if (
      reviewers.length <
      this.policy.minimumReviewerCount
    ) {
      errors.push(
        `At least ${this.policy.minimumReviewerCount} reviewers are required.`,
      );
    }

    if (
      approvers.length <
      this.policy.minimumApproverCount
    ) {
      errors.push(
        `At least ${this.policy.minimumApproverCount} approver is required.`,
      );
    }

    for (
      const role of
      this.policy.requiredReviewerRoles
    ) {
      if (
        !record.reviewerIds.some((reviewerId) =>
          reviewerHasRole(
            this.repository,
            reviewerId,
            role,
          ),
        )
      ) {
        errors.push(
          `Missing required reviewer role: ${role}`,
        );
      }
    }

    for (
      const role of
      this.policy.requiredApproverRoles
    ) {
      if (
        !record.approverIds.some((approverId) =>
          reviewerHasRole(
            this.repository,
            approverId,
            role,
          ),
        )
      ) {
        errors.push(
          `Missing required approver role: ${role}`,
        );
      }
    }

    if (
      !this.policy.allowSelfApproval &&
      record.approverIds.includes(
        record.submittedBy,
      )
    ) {
      errors.push(
        "Self-approval is not allowed.",
      );
    }

    const evidence =
      this.evidenceRepository.resolve(
        record.ruleId,
        record.ruleVersion,
      );

    if (
      this.policy
        .requireStructuredSourcesForNonUnspecifiedEvidence &&
      evidence.evidenceLevel !== "UNSPECIFIED" &&
      evidence.sources.length === 0
    ) {
      errors.push(
        "Structured sources are required for specified evidence levels.",
      );
    }

    if (
      record.status === "APPROVED" &&
      this.policy.requireDecisionRationale &&
      !record.decisionRationale
    ) {
      errors.push(
        "Approval requires a decision rationale.",
      );
    }

    if (
      record.status === "APPROVED" &&
      this.policy.requireEffectiveFromForApproval &&
      !record.effectiveFrom
    ) {
      errors.push(
        "Approval requires effectiveFrom.",
      );
    }

    if (
      evidence.evidenceLevel === "UNSPECIFIED"
    ) {
      warnings.push(
        "Rule remains without structured scientific evidence.",
      );
    }

    return Object.freeze({
      valid: errors.length === 0,
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      ruleId: record.ruleId,
      ruleVersion: record.ruleVersion,
      evidenceLevel: evidence.evidenceLevel,
      sourceCount: evidence.sources.length,
      reviewerCount: reviewers.length,
      approverCount: approvers.length,
    });
  }

  approve(record) {
    const evaluation = this.evaluate(record);

    if (!evaluation.valid) {
      throw new Error(
        `Governance approval rejected: ${evaluation.errors.join(" | ")}`,
      );
    }

    if (record.status !== "APPROVED") {
      throw new Error(
        "Only APPROVED records can be approved.",
      );
    }

    this.repository.registerRecord(record);

    return Object.freeze({
      approved: true,
      record,
      evaluation,
      governanceVersion:
        SCIENTIFIC_GOVERNANCE_ENGINE_VERSION,
    });
  }

  canUseRule(ruleId, ruleVersion, at = new Date()) {
    const record = this.repository.latestForRule(
      ruleId,
      ruleVersion,
    );

    if (!record || record.status !== "APPROVED") {
      return Object.freeze({
        allowed: false,
        reason: "NO_APPROVED_GOVERNANCE_RECORD",
      });
    }

    const now = at.getTime();
    const from = record.effectiveFrom
      ? Date.parse(record.effectiveFrom)
      : Number.NEGATIVE_INFINITY;
    const until = record.effectiveUntil
      ? Date.parse(record.effectiveUntil)
      : Number.POSITIVE_INFINITY;

    if (now < from) {
      return Object.freeze({
        allowed: false,
        reason: "NOT_YET_EFFECTIVE",
      });
    }

    if (now > until) {
      return Object.freeze({
        allowed: false,
        reason: "EXPIRED",
      });
    }

    return Object.freeze({
      allowed: true,
      reason: "APPROVED_AND_EFFECTIVE",
      governanceRecordId: record.id,
    });
  }
}
