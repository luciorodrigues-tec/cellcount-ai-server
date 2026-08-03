export const AUDIT_METRICS_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditMetrics({
  startedAt,
  completedAt = null,
  durationMs = null,
  stepDurations = {},
  resourceUsage = {},
} = {}) {
  if (!startedAt) {
    throw new TypeError(
      "AuditMetrics.startedAt is required.",
    );
  }

  if (
    durationMs !== null &&
    (
      !Number.isFinite(Number(durationMs)) ||
      Number(durationMs) < 0
    )
  ) {
    throw new TypeError(
      "AuditMetrics.durationMs must be non-negative.",
    );
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_METRICS_SCHEMA_VERSION,
    startedAt: String(startedAt),
    completedAt:
      completedAt === null ? null : String(completedAt),
    durationMs:
      durationMs === null ? null : Number(durationMs),
    stepDurations: Object.freeze({ ...stepDurations }),
    resourceUsage: Object.freeze({ ...resourceUsage }),
  });
}
