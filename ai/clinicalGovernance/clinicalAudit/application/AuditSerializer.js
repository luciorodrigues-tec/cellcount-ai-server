import {
  AuditId,
} from "../domain/AuditId.js";

import {
  AuditRecord,
} from "../domain/AuditRecord.js";

export const AUDIT_SERIALIZER_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditSerializer {
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

    return new AuditRecord({
      ...data,
      auditId:
        data.auditId instanceof AuditId
          ? data.auditId
          : new AuditId(
              data.auditId?.value ||
              data.auditId,
            ),
    });
  }
}
