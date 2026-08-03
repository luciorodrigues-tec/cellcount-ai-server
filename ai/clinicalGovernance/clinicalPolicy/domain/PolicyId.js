export const POLICY_ID_VERSION =
  "CGL-000003-S1-v1.0.0";

export class PolicyId {
  constructor(value) {
    const normalized = String(value || "").trim();

    if (!/^POL-[A-Z0-9-]{8,}$/.test(normalized)) {
      throw new TypeError(
        "PolicyId must match POL-[A-Z0-9-]{8,}.",
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof PolicyId &&
      other.value === this.value;
  }
}
