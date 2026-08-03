export class ConfidenceAuditBuilder {
  build({
    input,
    weightedResult,
    policy,
    factors,
  }) {
    return Object.freeze({
      caseId: input.caseId,
      sourceFactorIds: Object.freeze(
        factors.map((factor) => factor.id),
      ),
      weightedResult,
      policyVersion: policy.version,
      inputSchemaVersion: input.schemaVersion,
    });
  }
}
