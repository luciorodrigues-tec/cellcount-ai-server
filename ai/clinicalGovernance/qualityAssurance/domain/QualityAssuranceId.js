export const QUALITY_ASSURANCE_ID_VERSION =
  "CGL-000005-S1-v1.0.0";

export class QualityAssuranceId {
  constructor(value) {
    const normalized = String(value || "").trim();

    if (!/^QAE-[A-Z0-9-]{8,}$/.test(normalized)) {
      throw new TypeError(
        "QualityAssuranceId must match QAE-[A-Z0-9-]{8,}.",
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof QualityAssuranceId &&
      other.value === this.value;
  }
}
