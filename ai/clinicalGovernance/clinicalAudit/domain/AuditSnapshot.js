export const AUDIT_SNAPSHOT_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditSnapshot({
  snapshotId,
  createdAt,
  sequence,
  state,
  stateHash = null,
} = {}) {
  for (const [field, value] of Object.entries({
    snapshotId,
    createdAt,
    sequence,
  })) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      throw new TypeError(
        `AuditSnapshot.${field} is required.`,
      );
    }
  }

  if (!state || typeof state !== "object") {
    throw new TypeError(
      "AuditSnapshot.state is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_SNAPSHOT_SCHEMA_VERSION,
    snapshotId: String(snapshotId).trim(),
    createdAt: String(createdAt),
    sequence: Number(sequence),
    state: Object.freeze({ ...state }),
    stateHash:
      stateHash === null ? null : String(stateHash).trim(),
  });
}
