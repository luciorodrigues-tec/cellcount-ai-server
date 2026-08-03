export const PROVENANCE_ID_VERSION =
  "CGL-000002-S1-v1.0.0";

export class ProvenanceId {
  constructor(value) {
    const normalized = String(value || "").trim();

    if (!/^PROV-[A-Z0-9-]{8,}$/.test(normalized)) {
      throw new TypeError(
        "ProvenanceId must match PROV-[A-Z0-9-]{8,}.",
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof ProvenanceId &&
      other.value === this.value;
  }
}
