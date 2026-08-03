import {
  QualityAssuranceSerializer,
} from "./QualityAssuranceSerializer.js";

export const QUALITY_ASSURANCE_EXPORTER_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityAssuranceExporter {
  constructor({
    serializer =
      new QualityAssuranceSerializer(),
  } = {}) {
    this.serializer = serializer;
  }

  exportJson(aggregate, options = {}) {
    return Object.freeze({
      mimeType: "application/json",
      fileName:
        `${aggregate.qualityAssuranceId.toString()}.json`,
      content:
        this.serializer.serialize(
          aggregate,
          options,
        ),
    });
  }
}
