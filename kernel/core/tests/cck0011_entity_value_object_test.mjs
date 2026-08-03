import assert from "node:assert/strict";

import {
  Entity,
  ValueObject,
} from "../index.js";

class ExampleEntity extends Entity {}
class Coordinates extends ValueObject {}
class OtherCoordinates extends ValueObject {}

const first =
  new ExampleEntity({
    id: "ENTITY-1",
  });

const second =
  new ExampleEntity({
    id: "ENTITY-1",
  });

assert.equal(
  first.equals(second),
  true,
);

const valueA =
  new Coordinates({
    y: 2,
    x: 1,
    nested: {
      active: true,
    },
  });

const valueB =
  new Coordinates({
    nested: {
      active: true,
    },
    x: 1,
    y: 2,
  });

assert.equal(
  valueA.equals(valueB),
  true,
);

assert.equal(
  valueA.equals(
    new OtherCoordinates(
      valueA.toJSON(),
    ),
  ),
  false,
);

assert.equal(
  Object.isFrozen(
    valueA.props.nested,
  ),
  true,
);

console.log(
  "CCK-001.1 Entity and ValueObject passed.",
);
