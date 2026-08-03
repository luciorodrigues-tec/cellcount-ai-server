import assert from "node:assert/strict";

import {
  AggregateRoot,
  DomainResult,
  ValueObject,
} from "../kernel/core/index.js";

class Position extends ValueObject {}

class ExampleAggregate extends AggregateRoot {
  updatePosition(
    latitude,
    longitude,
  ) {
    const position =
      new Position({
        latitude,
        longitude,
      });

    this.incrementVersion();

    this.addDomainEvent({
      type:
        "example.position.updated",
      payload: {
        position:
          position.toJSON(),
      },
    });

    return DomainResult.success(
      position,
      {
        aggregateVersion:
          this.version,
      },
    );
  }
}

const aggregate =
  new ExampleAggregate({
    id: "AGG-E2E",
  });

const result =
  aggregate.updatePosition(
    10,
    20,
  );

assert.equal(
  result.isSuccess,
  true,
);

assert.equal(
  result.value.props.latitude,
  10,
);

assert.equal(
  result.metadata
    .aggregateVersion,
  1,
);

assert.equal(
  aggregate.pullDomainEvents()[0]
    .type,
  "example.position.updated",
);

console.log(
  "CCK-001.1 E2E passed.",
);
