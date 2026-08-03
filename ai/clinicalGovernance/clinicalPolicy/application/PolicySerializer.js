import {
  PolicyId,
} from "../domain/PolicyId.js";

import {
  ClinicalPolicy,
} from "../domain/ClinicalPolicy.js";

export const POLICY_SERIALIZER_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicySerializer {
  serialize(policy, { pretty = false } = {}) {
    return JSON.stringify(
      policy,
      null,
      pretty ? 2 : 0,
    );
  }

  deserialize(serialized) {
    const data =
      typeof serialized === "string"
        ? JSON.parse(serialized)
        : serialized;

    return new ClinicalPolicy({
      ...data,
      policyId:
        data.policyId instanceof PolicyId
          ? data.policyId
          : new PolicyId(
              data.policyId?.value ||
              data.policyId,
            ),
    });
  }
}
