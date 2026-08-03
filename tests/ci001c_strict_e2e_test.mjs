import fs from "node:fs";
import assert from "node:assert/strict";

const reportPath =
  process.argv[2] ||
  "reports/ci001b2_e2e_report.json";

const report =
  JSON.parse(
    fs.readFileSync(
      reportPath,
      "utf8",
    ),
  );

const peripheral =
  report.cases?.find(
    (item) =>
      String(item.name || "")
        .toLowerCase()
        .includes("sangue"),
  );

const marrow =
  report.cases?.find(
    (item) =>
      String(item.name || "")
        .toLowerCase()
        .includes("medula"),
  );

assert.ok(peripheral);
assert.ok(marrow);

assert.equal(
  peripheral.analysis
    ?.dualPipelineValidation
    ?.pipeline,
  "peripheral_blood",
);

assert.equal(
  peripheral.analysis
    ?.dualPipelineValidation
    ?.deliveryAllowed,
  true,
);

assert.equal(
  marrow.analysis
    ?.dualPipelineValidation
    ?.pipeline,
  "bone_marrow",
);

assert.equal(
  marrow.analysis
    ?.dualPipelineValidation
    ?.deliveryAllowed,
  true,
);

console.log(
  "CI-001C strict E2E dual pipeline passed.",
);
