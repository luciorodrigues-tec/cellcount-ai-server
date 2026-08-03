export const EVIDENCE_LEVEL_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export const EVIDENCE_LEVELS = Object.freeze([
  "A",
  "B",
  "C",
  "D",
  "EXPERT_CONSENSUS",
  "NOT_SPECIFIED",
]);

export class EvidenceLevel {
  constructor(value) {
    const normalized =
      String(value || "").trim().toUpperCase();

    if (!EVIDENCE_LEVELS.includes(normalized)) {
      throw new TypeError(
        `Unsupported evidence level: ${normalized}`,
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }
}
