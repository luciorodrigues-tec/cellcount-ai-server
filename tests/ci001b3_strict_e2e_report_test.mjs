import fs from "node:fs";
import assert from "node:assert/strict";

const reportPath =
  process.argv[2] ||
  "reports/ci001b2_e2e_report.json";

if (!fs.existsSync(reportPath)) {
  throw new Error(
    `Relatório E2E não encontrado: ${reportPath}`,
  );
}

const report =
  JSON.parse(
    fs.readFileSync(reportPath, "utf8"),
  );

const marrowCase =
  report.cases?.find(
    (item) =>
      String(item.name || "")
        .toLowerCase()
        .includes("medula"),
  );

assert.ok(
  marrowCase,
  "Caso de medula ausente no relatório.",
);

const analysis = marrowCase.analysis || {};

const required = [
  "specimenAssessment",
  "marrowAdequacy",
  "spiculeAssessment",
  "hemodilutionAssessment",
  "cellularityAssessment",
  "myeloidSeries",
  "erythroidSeries",
  "megakaryocyticSeries",
  "plasmaCellAssessment",
  "blastAssessment",
  "dysplasiaAssessment",
  "infiltrationAssessment",
  "marrowLimitations",
];

for (const field of required) {
  assert.notEqual(
    analysis[field],
    undefined,
    `Campo medular ausente: ${field}`,
  );
}

assert.equal(
  analysis.boneMarrowOutputContract?.complete,
  true,
  "Contrato medular não foi marcado como completo.",
);

console.log(
  "CI-001B.3 strict E2E report contract passed.",
);
