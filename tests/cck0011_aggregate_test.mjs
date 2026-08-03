import assert from "node:assert/strict";

import {
  AggregateRoot,
  DomainEvent,
} from "../kernel/core/index.js";

class ExampleAggregate extends AggregateRoot {}

const aggregate =
  new ExampleAggregate({
    id: "AGG-1",
  });

assert.equal(
  aggregate.version,
  0,
);

aggregate.incrementVersion();

const event =
  aggregate.addDomainEvent({
    type:
      "example.changed",
    payload: {
      value: 1,
    },
  });

assert.ok(
  event instanceof DomainEvent,
);

assert.equal(
  aggregate.domainEvents.length,
  1,
);

const pulled =
  aggregate.pullDomainEvents();

assert.equal(
  pulled.length,
  1,
);

assert.equal(
  aggregate.domainEvents.length,
  0,
);

assert.throws(
  () =>
    aggregate.addDomainEvent({
      type: "wrong.aggregate",
      aggregateId:
        "AGG-2",
    }),
  /must match/i,
);

console.log(
  "CCK-001.1 AggregateRoot passed.",
);
