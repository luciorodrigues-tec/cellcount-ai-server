import assert from "node:assert/strict";

import {
  Identifier,
} from "../index.js";

const generated =
  Identifier.random();

assert.ok(
  generated.toString().length > 0,
);

assert.equal(
  new Identifier(" A ")
    .equals(
      new Identifier("A"),
    ),
  true,
);

assert.equal(
  new Identifier({
    partB: 2,
    partA: 1,
  }).equals(
    new Identifier({
      partA: 1,
      partB: 2,
    }),
  ),
  true,
);

assert.throws(
  () => new Identifier(" "),
  /cannot be empty/i,
);

console.log(
  "CCK-001.1 Identifier passed.",
);
