import {
  ProvenanceId,
} from "../domain/ProvenanceId.js";

import {
  ProvenanceRecord,
} from "../domain/ProvenanceRecord.js";

export const PROVENANCE_SERIALIZER_VERSION =
  "CGL-000002-S2-v1.0.0";

export class ProvenanceSerializer {
  serialize(record, { pretty = false } = {}) {
    return JSON.stringify(
      record,
      null,
      pretty ? 2 : 0,
    );
  }

  deserialize(serialized) {
    const data =
      typeof serialized === "string"
        ? JSON.parse(serialized)
        : serialized;

    return new ProvenanceRecord({
      ...data,
      provenanceId:
        data.provenanceId instanceof ProvenanceId
          ? data.provenanceId
          : new ProvenanceId(
              data.provenanceId?.value ||
              data.provenanceId,
            ),
    });
  }
}
