export const AUDIT_TIMELINE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditTimeline(events = []) {
  const sorted = [...events].sort(
    (a, b) => a.sequence - b.sequence,
  );

  const seen = new Set();
  for (const event of sorted) {
    if (seen.has(event.sequence)) {
      throw new Error(
        `Duplicate audit event sequence: ${event.sequence}`,
      );
    }
    seen.add(event.sequence);
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_TIMELINE_SCHEMA_VERSION,
    events: Object.freeze(sorted),
    firstOccurredAt:
      sorted[0]?.occurredAt || null,
    lastOccurredAt:
      sorted.at(-1)?.occurredAt || null,
  });
}
