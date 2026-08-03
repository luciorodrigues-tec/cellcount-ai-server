import {
  QualityAssuranceId,
} from "../domain/QualityAssuranceId.js";

import {
  QualityAssurance,
} from "../domain/QualityAssurance.js";

export const QUALITY_ASSURANCE_SERIALIZER_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityAssuranceSerializer {
  serialize(aggregate, { pretty = false } = {}) {
    return JSON.stringify(
      aggregate,
      null,
      pretty ? 2 : 0,
    );
  }

  deserialize(serialized) {
    const data =
      typeof serialized === "string"
        ? JSON.parse(serialized)
        : serialized;

    return new QualityAssurance({
      ...data,
      qualityAssuranceId:
        data.qualityAssuranceId instanceof
          QualityAssuranceId
          ? data.qualityAssuranceId
          : new QualityAssuranceId(
              data.qualityAssuranceId?.value ||
              data.qualityAssuranceId,
            ),
    });
  }
}
