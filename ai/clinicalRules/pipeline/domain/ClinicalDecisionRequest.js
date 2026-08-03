export const CLINICAL_DECISION_REQUEST_SCHEMA_VERSION =
  "CRR-000012-v1";

function freezeArray(values = []) {
  return Object.freeze(
    (Array.isArray(values) ? values : []).map(
      (value) =>
        value && typeof value === "object"
          ? Object.freeze({ ...value })
          : value,
    ),
  );
}

export function createClinicalDecisionRequest({
  requestId,
  input,
  images = [],
  manualCounts = null,
  morphology = null,
  patientContext = null,
  metadata = {},
} = {}) {
  if (!requestId || !String(requestId).trim()) {
    throw new TypeError(
      "ClinicalDecisionRequest.requestId is required.",
    );
  }

  if (input === undefined) {
    throw new TypeError(
      "ClinicalDecisionRequest.input is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_DECISION_REQUEST_SCHEMA_VERSION,
    requestId: String(requestId).trim(),
    input,
    images: freezeArray(images),
    manualCounts:
      manualCounts && typeof manualCounts === "object"
        ? Object.freeze({ ...manualCounts })
        : null,
    morphology:
      morphology && typeof morphology === "object"
        ? Object.freeze({ ...morphology })
        : null,
    patientContext:
      patientContext &&
      typeof patientContext === "object"
        ? Object.freeze({ ...patientContext })
        : null,
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
