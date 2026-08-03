export const QUALITY_SEVERITY_VERSION =
  "CGL-000005-S1-v1.0.0";

export const QUALITY_SEVERITIES = Object.freeze([
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export function assertQualitySeverity(value) {
  const normalized =
    String(value || "").trim().toUpperCase();

  if (!QUALITY_SEVERITIES.includes(normalized)) {
    throw new TypeError(
      `Unsupported quality severity: ${normalized}`,
    );
  }

  return normalized;
}
