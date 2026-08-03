export const AUDIT_REPLAY_ENGINE_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditReplayEngine {
  replay(record, {
    untilSequence = null,
    reducer = (state, event) => ({
      ...state,
      lastEventType: event.type,
      eventCount:
        Number(state.eventCount || 0) + 1,
    }),
    initialState = {},
  } = {}) {
    const events = [...(record?.events || [])]
      .sort(
        (a, b) =>
          a.sequence - b.sequence,
      )
      .filter(
        (event) =>
          untilSequence === null ||
          event.sequence <= untilSequence,
      );

    let state = { ...initialState };
    const frames = [];

    for (const event of events) {
      state = reducer(state, event);

      frames.push(
        Object.freeze({
          sequence: event.sequence,
          eventId: event.eventId,
          eventType: event.type,
          state: Object.freeze({
            ...state,
          }),
        }),
      );
    }

    return Object.freeze({
      auditId:
        record.auditId.toString(),
      eventCount: events.length,
      finalState:
        Object.freeze({ ...state }),
      frames:
        Object.freeze(frames),
    });
  }
}
