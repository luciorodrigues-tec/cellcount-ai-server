import {
  createAuditEvent,
} from "../domain/AuditEvent.js";

import {
  createAuditTimeline,
} from "../domain/AuditTimeline.js";

export const AUDIT_TIMELINE_BUILDER_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditTimelineBuilder {
  build(events = []) {
    return createAuditTimeline(events);
  }

  append({
    events = [],
    eventId,
    type,
    occurredAt,
    actor,
    payload = {},
    metadata = {},
  } = {}) {
    const nextSequence =
      events.reduce(
        (max, event) =>
          Math.max(max, Number(event.sequence || 0)),
        0,
      ) + 1;

    const event = createAuditEvent({
      eventId,
      type,
      occurredAt,
      sequence: nextSequence,
      actor,
      payload,
      metadata,
    });

    return Object.freeze({
      event,
      events: Object.freeze([...events, event]),
      timeline: createAuditTimeline([...events, event]),
    });
  }
}
