import assert from "node:assert/strict";

import {
  DifferentialPairBuilder,
} from "../ai/differentialDiagnosis/pairBuilder/index.js";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const builder =
  new DifferentialPairBuilder({
    ruleRepository:
      library.repository,
  });

const explanation = {
  winner: {
    cellId: "CELL-BLAST",
    normalizedScore: 0.9,
  },
  runnerUp: {
    cellId:
      "CELL-PLASMABLAST",
    normalizedScore: 0.85,
    marginFromWinner: 0.05,
  },
  alternatives: [],
};

const before =
  JSON.stringify(
    explanation,
  );

builder.build({
  explanation,
  specimenType:
    "BONE_MARROW_ASPIRATE",
});

const after =
  JSON.stringify(
    explanation,
  );

assert.equal(
  before,
  after,
);

console.log(
  "CI-002D.2 regression guard passed.",
);
