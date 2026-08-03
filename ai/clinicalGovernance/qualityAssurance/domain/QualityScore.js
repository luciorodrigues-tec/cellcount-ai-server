export const QUALITY_SCORE_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export class QualityScore {
  constructor(value) {
    const numeric = Number(value);

    if (
      !Number.isFinite(numeric) ||
      numeric < 0 ||
      numeric > 100
    ) {
      throw new TypeError(
        "QualityScore must be between 0 and 100.",
      );
    }

    this.value = Number(numeric.toFixed(4));
    Object.freeze(this);
  }
}
