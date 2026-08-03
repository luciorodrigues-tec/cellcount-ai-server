export const CONFIDENCE_LEVEL_VERSION = "CRR-000030-v1.0.0";

export const CONFIDENCE_LEVELS = Object.freeze([
  "VERY_LOW",
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY_HIGH",
]);

export function confidenceLevelFromScore(score) {
  const value = Number(score);

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new TypeError(
      "confidenceLevelFromScore requires a score between 0 and 1.",
    );
  }

  if (value < 0.2) return "VERY_LOW";
  if (value < 0.4) return "LOW";
  if (value < 0.65) return "MODERATE";
  if (value < 0.85) return "HIGH";
  return "VERY_HIGH";
}
