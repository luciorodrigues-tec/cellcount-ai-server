export const GUIDELINE_ID_VERSION =
  "CGL-000004-S1-v1.0.0";

export class GuidelineId {
  constructor(value) {
    const normalized = String(value || "").trim();

    if (!/^GLN-[A-Z0-9-]{8,}$/.test(normalized)) {
      throw new TypeError(
        "GuidelineId must match GLN-[A-Z0-9-]{8,}.",
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof GuidelineId &&
      other.value === this.value;
  }
}
