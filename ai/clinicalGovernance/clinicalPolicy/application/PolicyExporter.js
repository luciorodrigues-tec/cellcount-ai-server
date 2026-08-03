import {
  PolicySerializer,
} from "./PolicySerializer.js";

export const POLICY_EXPORTER_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyExporter {
  constructor({
    serializer =
      new PolicySerializer(),
  } = {}) {
    this.serializer = serializer;
  }

  exportJson(policy, options = {}) {
    return Object.freeze({
      mimeType: "application/json",
      fileName:
        `${policy.policyId.toString()}-${policy.version.version}.json`,
      content:
        this.serializer.serialize(
          policy,
          options,
        ),
    });
  }
}
