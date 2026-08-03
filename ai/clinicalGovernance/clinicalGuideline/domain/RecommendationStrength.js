export const RECOMMENDATION_STRENGTH_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export const RECOMMENDATION_STRENGTHS = Object.freeze([
  "STRONG",
  "CONDITIONAL",
  "OPTIONAL",
  "NOT_SPECIFIED",
]);

export class RecommendationStrength {
  constructor(value) {
    const normalized =
      String(value || "").trim().toUpperCase();

    if (!RECOMMENDATION_STRENGTHS.includes(normalized)) {
      throw new TypeError(
        `Unsupported recommendation strength: ${normalized}`,
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }
}
