import {
  GuidelineSerializer,
} from "./GuidelineSerializer.js";

export const GUIDELINE_EXPORTER_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineExporter {
  constructor({
    serializer =
      new GuidelineSerializer(),
  } = {}) {
    this.serializer = serializer;
  }

  exportJson(guideline, options = {}) {
    return Object.freeze({
      mimeType: "application/json",
      fileName:
        `${guideline.guidelineId.toString()}-${guideline.version.version}.json`,
      content:
        this.serializer.serialize(
          guideline,
          options,
        ),
    });
  }
}
