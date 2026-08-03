import {
  ClinicalPolicyEngine,
} from "./application/ClinicalPolicyEngine.js";

import {
  PolicyConditionEvaluator,
} from "./application/PolicyConditionEvaluator.js";

import {
  PolicyScopeResolver,
} from "./application/PolicyScopeResolver.js";

import {
  PolicyThresholdEvaluator,
} from "./application/PolicyThresholdEvaluator.js";

import {
  PolicyOverrideResolver,
} from "./application/PolicyOverrideResolver.js";

import {
  PolicyDecisionResolver,
} from "./application/PolicyDecisionResolver.js";

import {
  PolicyConflictResolver,
} from "./application/PolicyConflictResolver.js";

import {
  PolicyValidationService,
} from "./application/PolicyValidationService.js";

import {
  PolicySerializer,
} from "./application/PolicySerializer.js";

import {
  PolicyExporter,
} from "./application/PolicyExporter.js";

import {
  ClinicalPolicyRepository,
} from "./repository/ClinicalPolicyRepository.js";

import {
  ClinicalPolicyContextMapper,
} from "./integration/ClinicalPolicyContextMapper.js";

import {
  ClinicalPolicyAuditAdapter,
} from "./integration/ClinicalPolicyAuditAdapter.js";

import {
  ClinicalPolicyProvenanceAdapter,
} from "./integration/ClinicalPolicyProvenanceAdapter.js";

import {
  ClinicalPolicyIntegrationService,
} from "./integration/ClinicalPolicyIntegrationService.js";

export function createClinicalPolicyLibrary({
  clock = () => new Date(),
} = {}) {
  const conditionEvaluator =
    new PolicyConditionEvaluator();

  const scopeResolver =
    new PolicyScopeResolver();

  const overrideResolver =
    new PolicyOverrideResolver();

  const decisionResolver =
    new PolicyDecisionResolver();

  const validationService =
    new PolicyValidationService();

  const engine =
    new ClinicalPolicyEngine({
      conditionEvaluator,
      scopeResolver,
      overrideResolver,
      decisionResolver,
      validationService,
      clock,
    });

  const repository =
    new ClinicalPolicyRepository();

  const conflictResolver =
    new PolicyConflictResolver();

  const contextMapper =
    new ClinicalPolicyContextMapper();

  const auditAdapter =
    new ClinicalPolicyAuditAdapter();

  const provenanceAdapter =
    new ClinicalPolicyProvenanceAdapter();

  const integrationService =
    new ClinicalPolicyIntegrationService({
      policyEngine: engine,
      repository,
      contextMapper,
      conflictResolver,
      auditAdapter,
      provenanceAdapter,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    integrationService,
    conditionEvaluator,
    scopeResolver,
    thresholdEvaluator:
      new PolicyThresholdEvaluator(),
    overrideResolver,
    decisionResolver,
    conflictResolver,
    validationService,
    serializer:
      new PolicySerializer(),
    exporter:
      new PolicyExporter(),
    contextMapper,
    auditAdapter,
    provenanceAdapter,
  });
}
