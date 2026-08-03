import {
  PolicyConflictResolver,
} from "../application/PolicyConflictResolver.js";

import {
  ClinicalPolicyContextMapper,
} from "./ClinicalPolicyContextMapper.js";

import {
  ClinicalPolicyAuditAdapter,
} from "./ClinicalPolicyAuditAdapter.js";

import {
  ClinicalPolicyProvenanceAdapter,
} from "./ClinicalPolicyProvenanceAdapter.js";

export const CLINICAL_POLICY_INTEGRATION_SERVICE_VERSION =
  "CGL-000003-S3-v1.0.0";

export class ClinicalPolicyIntegrationService {
  constructor({
    policyEngine,
    repository,
    contextMapper =
      new ClinicalPolicyContextMapper(),
    conflictResolver =
      new PolicyConflictResolver(),
    auditAdapter =
      new ClinicalPolicyAuditAdapter(),
    provenanceAdapter =
      new ClinicalPolicyProvenanceAdapter(),
    clock = () => new Date(),
  } = {}) {
    if (!policyEngine) {
      throw new TypeError(
        "ClinicalPolicyIntegrationService.policyEngine is required.",
      );
    }

    if (!repository) {
      throw new TypeError(
        "ClinicalPolicyIntegrationService.repository is required.",
      );
    }

    this.policyEngine =
      policyEngine;
    this.repository =
      repository;
    this.contextMapper =
      contextMapper;
    this.conflictResolver =
      conflictResolver;
    this.auditAdapter =
      auditAdapter;
    this.provenanceAdapter =
      provenanceAdapter;
    this.clock = clock;
  }

  evaluate({
    caseContext = {},
    organizationId = null,
    laboratoryId = null,
    departmentId = null,
    workflowId = null,
    engineId = null,
    safetyGateResult = null,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    auditRecord = null,
    provenanceRecord = null,
    metadata = {},
  } = {}) {
    const context =
      this.contextMapper.map({
        caseContext,
        organizationId,
        laboratoryId,
        departmentId,
        workflowId,
        engineId,
        safetyGateResult,
        confidenceCalibrationResult,
        uncertaintyResult,
        auditRecord,
        provenanceRecord,
        metadata,
      });

    const activePolicies =
      this.repository.findActive({
        at: this.clock(),
      });

    const evaluations =
      activePolicies
        .map((policy) => ({
          policy,
          result:
            this.policyEngine.evaluate(
              policy,
              context,
            ),
        }))
        .filter(
          (entry) =>
            entry.result.applicable,
        );

    const selectedDecision =
      this.conflictResolver.resolve(
        evaluations.map(
          (entry) =>
            entry.result.decision,
        ),
      );

    const selectedEntry =
      selectedDecision
        ? evaluations.find(
            (entry) =>
              entry.result.decision ===
              selectedDecision,
          ) || null
        : null;

    return Object.freeze({
      context,
      applicablePolicyCount:
        evaluations.length,
      evaluations:
        Object.freeze(evaluations),
      decision:
        selectedDecision,
      selectedPolicyId:
        selectedEntry
          ?.policy.policyId.toString() ??
        null,
      auditPayload:
        selectedEntry
          ? this.auditAdapter.toAuditPayload({
              policy:
                selectedEntry.policy,
              result:
                selectedEntry.result,
            })
          : null,
      provenancePayload:
        selectedEntry
          ? this.provenanceAdapter.toProvenancePayload({
              policy:
                selectedEntry.policy,
              result:
                selectedEntry.result,
            })
          : null,
    });
  }
}
