import {
  Entity,
} from "./Entity.js";

import {
  DomainEvent,
} from "./DomainEvent.js";

export class AggregateRoot extends Entity {
  #version;
  #domainEvents = [];

  constructor({
    id,
    version = 0,
  } = {}) {
    super({
      id,
    });

    if (
      !Number.isInteger(version) ||
      version < 0
    ) {
      throw new TypeError(
        "Aggregate version must be a non-negative integer.",
      );
    }

    this.#version =
      version;
  }

  get version() {
    return this.#version;
  }

  get domainEvents() {
    return Object.freeze([
      ...this.#domainEvents,
    ]);
  }

  incrementVersion() {
    this.#version += 1;
    return this.#version;
  }

  addDomainEvent(event) {
    const normalized =
      event instanceof DomainEvent
        ? event
        : new DomainEvent({
            ...event,
            aggregateId:
              event?.aggregateId ??
              this.id,
          });

    if (
      !normalized.aggregateId.equals(
        this.id,
      )
    ) {
      throw new Error(
        "Domain event aggregateId must match the aggregate.",
      );
    }

    this.#domainEvents.push(
      normalized,
    );

    return normalized;
  }

  pullDomainEvents() {
    const events =
      Object.freeze([
        ...this.#domainEvents,
      ]);

    this.#domainEvents = [];

    return events;
  }

  clearDomainEvents() {
    this.#domainEvents = [];
  }

  toJSON() {
    return Object.freeze({
      ...super.toJSON(),
      version:
        this.#version,
    });
  }
}
