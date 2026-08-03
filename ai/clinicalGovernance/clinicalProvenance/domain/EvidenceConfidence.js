export const EVIDENCE_CONFIDENCE_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export class EvidenceConfidence {
  constructor(value) {
    const numeric = Number(value);

    if (
      !Number.isFinite(numeric) ||
      numeric < 0 ||
      numeric > 1
    ) {
      throw new TypeError(
        "EvidenceConfidence must be between 0 and 1.",
      );
    }

    this.value = numeric;
    Object.freeze(this);
  }
}
