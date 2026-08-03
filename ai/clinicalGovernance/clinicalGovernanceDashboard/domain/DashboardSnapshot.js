export const DASHBOARD_SNAPSHOT_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export function createDashboardSnapshot({
  snapshotId,
  metricIds = [],
  alertIds = [],
  generatedAt,
  checksum = null,
} = {}) {
  if (!snapshotId || !generatedAt) {
    throw new TypeError(
      "DashboardSnapshot requires snapshotId and generatedAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: String(snapshotId),
    metricIds:
      Object.freeze([...metricIds]),
    alertIds:
      Object.freeze([...alertIds]),
    generatedAt:
      new Date(generatedAt).toISOString(),
    checksum:
      checksum === null ? null : String(checksum),
  });
}
