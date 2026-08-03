export const AUDIT_ID_VERSION = "CGL-000001-S1-v1.0.0";

export class AuditId {
  constructor(value) {
    const normalized = String(value || "").trim();

    if (!/^AUD-[A-Z0-9-]{8,}$/.test(normalized)) {
      throw new TypeError(
        "AuditId must match AUD-[A-Z0-9-]{8,}.",
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof AuditId &&
      other.value === this.value;
  }
}
