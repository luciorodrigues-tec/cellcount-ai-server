import {
  assertQualitySeverity,
} from "./QualitySeverity.js";

export const QUALITY_FINDING_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityFinding({
  findingId,
  title,
  description,
  severity,
  category,
  metricIds = [],
  detectedAt,
  metadata = {},
} = {}) {
  if (
    !findingId ||
    !title ||
    !description ||
    !detectedAt
  ) {
    throw new TypeError(
      "QualityFinding requires findingId, title, description and detectedAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_FINDING_SCHEMA_VERSION,
    findingId: String(findingId),
    title: String(title),
    description: String(description),
    severity:
      assertQualitySeverity(severity),
    category:
      String(category).trim().toUpperCase(),
    metricIds:
      Object.freeze([...metricIds]),
    detectedAt:
      new Date(detectedAt).toISOString(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
