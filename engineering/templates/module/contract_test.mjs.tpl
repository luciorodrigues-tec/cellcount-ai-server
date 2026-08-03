import assert from "node:assert/strict";

import {
  MODULE_ID,
  MODULE_VERSION,
} from "../index.js";

assert.equal(
  MODULE_ID,
  "{{MODULE_ID}}",
);

assert.equal(
  MODULE_VERSION,
  "{{MODULE_VERSION}}",
);

console.log(
  "{{MODULE_ID}} contract passed.",
);
