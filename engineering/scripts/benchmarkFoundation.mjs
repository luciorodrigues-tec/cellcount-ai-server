import { performance } from "node:perf_hooks";

import {
  loadEngineeringConfig,
} from "./engineeringConfig.js";

const iterations =
  10000;

const started =
  performance.now();

for (
  let index = 0;
  index < iterations;
  index += 1
) {
  loadEngineeringConfig();
}

const elapsed =
  performance.now() - started;

console.log(
  JSON.stringify({
    benchmark:
      "CCK-000.1 config loading",
    iterations,
    elapsedMs:
      Number(elapsed.toFixed(3)),
    averageMicroseconds:
      Number(
        (
          elapsed *
          1000 /
          iterations
        ).toFixed(3),
      ),
  }),
);
