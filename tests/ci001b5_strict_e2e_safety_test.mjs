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

const marrow =
  report.cases?.find(
    (item) =>
      String(item.name || "")
        .toLowerCase()
        .includes("medula"),
  );

assert.ok(
  marrow,
  "Caso medular ausente.",
);

const analysis =
  marrow.analysis || {};

const safety =
  analysis.marrowSafetyValidation;

assert.ok(
  safety,
  "marrowSafetyValidation ausente.",
);

assert.equal(
  safety.deliveryAllowed,
  true,
  "Safety Governor bloqueou o resultado E2E.",
);

assert.equal(
  typeof safety.score,
  "number",
);

assert.ok(
  Array.isArray(safety.auditTrail),
);

assert.equal(
  analysis.clinicalSafety?.specimen,
  "bone_marrow",
);

console.log(
  "CI-001B.5 strict E2E safety contract passed.",
);
