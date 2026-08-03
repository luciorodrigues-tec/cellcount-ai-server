export const EVIDENCE_WEIGHT_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export class EvidenceWeight {
  constructor(value) {
    const numeric = Number(value);

    if (
      !Number.isFinite(numeric) ||
      numeric < 0 ||
      numeric > 1
    ) {
      throw new TypeError(
        "EvidenceWeight must be between 0 and 1.",
      );
    }

    this.value = numeric;
    Object.freeze(this);
  }
}
