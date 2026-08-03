import {
  ProvenanceSerializer,
} from "./ProvenanceSerializer.js";

export const PROVENANCE_EXPORTER_VERSION =
  "CGL-000002-S2-v1.0.0";

export class ProvenanceExporter {
  constructor({
    serializer =
      new ProvenanceSerializer(),
  } = {}) {
    this.serializer = serializer;
  }

  exportJson(record, options = {}) {
    return Object.freeze({
      mimeType: "application/json",
      fileName:
        `${record.provenanceId.toString()}.json`,
      content:
        this.serializer.serialize(
          record,
          options,
        ),
    });
  }
}
