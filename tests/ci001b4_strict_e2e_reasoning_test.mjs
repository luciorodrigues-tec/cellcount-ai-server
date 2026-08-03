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
  "Caso medular não encontrado.",
);

const analysis =
  marrow.analysis || {};

const reasoning =
  analysis.boneMarrowClinicalReasoning;

assert.ok(
  reasoning,
  "boneMarrowClinicalReasoning ausente.",
);

assert.ok(
  reasoning.adequacy,
  "Raciocínio de adequação ausente.",
);

assert.ok(
  reasoning.cellularity,
  "Raciocínio de celularidade ausente.",
);

assert.ok(
  reasoning.lineages?.myeloid,
  "Raciocínio mieloide ausente.",
);

assert.ok(
  reasoning.lineages?.erythroid,
  "Raciocínio eritroide ausente.",
);

assert.ok(
  reasoning.lineages?.megakaryocytic,
  "Raciocínio megacariocítico ausente.",
);

assert.ok(
  reasoning.blast,
  "Raciocínio de blastos ausente.",
);

assert.ok(
  reasoning.plasmaCells,
  "Raciocínio plasmocitário ausente.",
);

assert.ok(
  reasoning.dysplasia,
  "Raciocínio de displasia ausente.",
);

assert.ok(
  reasoning.infiltration,
  "Raciocínio de infiltração ausente.",
);

assert.ok(
  reasoning.finalInterpretation,
  "Interpretação final medular ausente.",
);

assert.equal(
  analysis.requiresHumanReview,
  true,
);

console.log(
  "CI-001B.4 strict E2E reasoning contract passed.",
);
