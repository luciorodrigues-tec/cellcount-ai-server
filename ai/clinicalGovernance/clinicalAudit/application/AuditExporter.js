import {
  AuditSerializer,
} from "./AuditSerializer.js";

export const AUDIT_EXPORTER_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditExporter {
  constructor({
    serializer =
      new AuditSerializer(),
  } = {}) {
    this.serializer = serializer;
  }

  exportJson(record, options = {}) {
    return Object.freeze({
      mimeType: "application/json",
      fileName:
        `${record.auditId.toString()}.json`,
      content:
        this.serializer.serialize(
          record,
          options,
        ),
    });
  }
}
