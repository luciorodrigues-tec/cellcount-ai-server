import {
  Identifier,
} from "./Identifier.js";

export class DomainEvent {
  constructor({
    type,
    aggregateId,
    payload = {},
    occurredAt = new Date(),
    eventId,
    metadata = {},
  } = {}) {
    const normalizedType =
      String(type || "").trim();

    if (!normalizedType) {
      throw new TypeError(
        "Domain event type is required.",
      );
    }

    this.eventId =
      eventId instanceof Identifier
        ? eventId
        : new Identifier(eventId);

    this.type =
      normalizedType;

    this.aggregateId =
      aggregateId instanceof Identifier
        ? aggregateId
        : new Identifier(aggregateId);

    this.payload =
      Object.freeze(
        structuredClone(payload),
      );

    this.occurredAt =
      occurredAt instanceof Date
        ? new Date(
            occurredAt.getTime(),
          )
        : new Date(occurredAt);

    if (
      Number.isNaN(
        this.occurredAt.getTime(),
      )
    ) {
      throw new TypeError(
        "Domain event occurredAt must be a valid date.",
      );
    }

    this.metadata =
      Object.freeze(
        structuredClone(metadata),
      );

    Object.freeze(this);
  }

  toJSON() {
    return Object.freeze({
      eventId:
        this.eventId.toJSON(),
      type:
        this.type,
      aggregateId:
        this.aggregateId.toJSON(),
      payload:
        this.payload,
      occurredAt:
        this.occurredAt.toISOString(),
      metadata:
        this.metadata,
    });
  }
}
