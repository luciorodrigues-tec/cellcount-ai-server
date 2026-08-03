export const CLINICAL_REPORT_SECTION_SCHEMA_VERSION =
  "CRR-000013-v1";

export const CLINICAL_REPORT_SECTION_TYPES =
  Object.freeze([
    "EXECUTIVE_SUMMARY",
    "PRIMARY_HYPOTHESIS",
    "DIFFERENTIAL_DIAGNOSES",
    "MORPHOLOGIC_INTERPRETATION",
    "CLINICAL_REASONING",
    "SCIENTIFIC_EVIDENCE",
    "CONFIDENCE_ANALYSIS",
    "SAFETY_ANALYSIS",
    "RECOMMENDATIONS",
    "AUDIT_TRAIL",
    "CUSTOM",
  ]);

function freezeArray(values = []) {
  return Object.freeze([
    ...(Array.isArray(values) ? values : []),
  ]);
}

export function createClinicalReportSection({
  id,
  type,
  title,
  content = null,
  items = [],
  severity = "INFO",
  order = 0,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    type,
    title,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `ClinicalReportSection.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type)
    .trim()
    .toUpperCase();

  if (
    !CLINICAL_REPORT_SECTION_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported report section type: ${normalizedType}`,
    );
  }

  const normalizedOrder = Number(order);

  if (
    !Number.isInteger(normalizedOrder) ||
    normalizedOrder < 0
  ) {
    throw new TypeError(
      "ClinicalReportSection.order must be a non-negative integer.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_REPORT_SECTION_SCHEMA_VERSION,
    id: String(id).trim(),
    type: normalizedType,
    title: String(title).trim(),
    content,
    items: freezeArray(items),
    severity: String(severity)
      .trim()
      .toUpperCase(),
    order: normalizedOrder,
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
