import {
  AggregateRoot,
  DomainResult,
  ValueObject,
} from "../index.js";

class Coordinates extends ValueObject {}

class ExampleAggregate extends AggregateRoot {
  move(latitude, longitude) {
    const position =
      new Coordinates({
        latitude,
        longitude,
      });

    this.incrementVersion();

    this.addDomainEvent({
      type:
        "example.position.changed",
      payload: {
        position:
          position.toJSON(),
      },
    });

    return DomainResult.success(
      position,
    );
  }
}

const aggregate =
  new ExampleAggregate();

const result =
  aggregate.move(
    -3.73,
    -38.52,
  );

console.log(
  JSON.stringify({
    aggregate:
      aggregate.toJSON(),
    result:
      result.toJSON(),
    events:
      aggregate.pullDomainEvents()
        .map(
          (event) =>
            event.toJSON(),
        ),
  }, null, 2),
);
