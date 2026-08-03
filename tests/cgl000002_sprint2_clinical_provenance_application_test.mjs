import assert from "node:assert/strict";
import test from "node:test";

import {
  createEvidenceNode,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceNode.js";

import {
  createEvidenceEdge,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceEdge.js";

import {
  createPipelineStep,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/PipelineStep.js";

import {
  ClinicalProvenanceEngine,
} from "../ai/clinicalGovernance/clinicalProvenance/application/ClinicalProvenanceEngine.js";

import {
  TransformationTracker,
} from "../ai/clinicalGovernance/clinicalProvenance/application/TransformationTracker.js";

import {
  EvidenceWeightCalculator,
} from "../ai/clinicalGovernance/clinicalProvenance/application/EvidenceWeightCalculator.js";

import {
  EvidenceConfidencePropagator,
} from "../ai/clinicalGovernance/clinicalProvenance/application/EvidenceConfidencePropagator.js";

import {
  EvidenceIntegrityCalculator,
} from "../ai/clinicalGovernance/clinicalProvenance/application/EvidenceIntegrityCalculator.js";

import {
  ProvenanceSerializer,
} from "../ai/clinicalGovernance/clinicalProvenance/application/ProvenanceSerializer.js";

import {
  ProvenanceExporter,
} from "../ai/clinicalGovernance/clinicalProvenance/application/ProvenanceExporter.js";

const fixedClock = () =>
  new Date("2026-07-29T18:00:00.000Z");

test("engine creates provenance record", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const record = engine.create({
    provenanceId: "PROV-APP-0001",
    caseId: "CASE-1",
  });

  assert.equal(record.caseId, "CASE-1");
});

test("engine adds node immutably", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const record = engine.create({
    provenanceId: "PROV-APP-0002",
    caseId: "CASE-2",
  });

  const updated = engine.addNode(
    record,
    createEvidenceNode({
      nodeId: "N-1",
      type: "SOURCE",
      label: "Image",
    }),
  );

  assert.equal(record.graph.nodes.length, 0);
  assert.equal(updated.graph.nodes.length, 1);
});

test("engine adds edge with valid endpoints", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const n1 = createEvidenceNode({
    nodeId: "N-1",
    type: "SOURCE",
    label: "Image",
  });

  const n2 = createEvidenceNode({
    nodeId: "N-2",
    type: "FEATURE",
    label: "Feature",
  });

  let record = engine.create({
    provenanceId: "PROV-APP-0003",
    caseId: "CASE-3",
    nodes: [n1, n2],
  });

  record = engine.addEdge(
    record,
    createEvidenceEdge({
      edgeId: "E-1",
      fromNodeId: "N-1",
      toNodeId: "N-2",
      relationship: "DERIVED_FROM",
    }),
  );

  assert.equal(record.graph.edges.length, 1);
});

test("transformation tracker starts and completes", () => {
  const tracker =
    new TransformationTracker({
      clock: fixedClock,
    });

  const started = tracker.start({
    transformationId: "T-1",
    name: "Detect",
    engineId: "YOLO",
    engineVersion: "1.0.0",
    inputNodeIds: ["N-1"],
  });

  const completed = tracker.complete(
    started,
    {
      outputNodeIds: ["N-2"],
    },
  );

  assert.equal(
    completed.outputNodeIds[0],
    "N-2",
  );
  assert.ok(completed.completedAt);
});

test("weight calculator returns bounded value", () => {
  const weight =
    new EvidenceWeightCalculator()
      .calculate({
        sourceReliability: 1,
        transformationReliability: 0.8,
        freshness: 0.6,
        consistency: 0.8,
      });

  assert.equal(weight.value, 0.8);
});

test("confidence propagator combines parents", () => {
  const confidence =
    new EvidenceConfidencePropagator()
      .propagate({
        parentConfidences: [0.8, 0.6],
        relationshipWeights: [1, 1],
        transformationReliability: 0.9,
      });

  assert.equal(confidence.value, 0.63);
});

test("integrity calculator is deterministic", () => {
  const calculator =
    new EvidenceIntegrityCalculator();

  assert.equal(
    calculator.calculate({ b: 2, a: 1 }).hash,
    calculator.calculate({ a: 1, b: 2 }).hash,
  );
});

test("integrity calculator detects tampering", () => {
  const calculator =
    new EvidenceIntegrityCalculator();

  const integrity =
    calculator.calculate({ value: 1 });

  assert.equal(
    calculator.verify(
      { value: 2 },
      integrity,
    ),
    false,
  );
});

test("engine builds lineage", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const nodes = [
    createEvidenceNode({
      nodeId: "N-1",
      type: "SOURCE",
      label: "Image",
    }),
    createEvidenceNode({
      nodeId: "N-2",
      type: "FEATURE",
      label: "Feature",
    }),
    createEvidenceNode({
      nodeId: "N-3",
      type: "DECISION",
      label: "Decision",
    }),
  ];

  const edges = [
    createEvidenceEdge({
      edgeId: "E-1",
      fromNodeId: "N-1",
      toNodeId: "N-2",
      relationship: "DERIVED_FROM",
    }),
    createEvidenceEdge({
      edgeId: "E-2",
      fromNodeId: "N-2",
      toNodeId: "N-3",
      relationship: "SUPPORTS",
    }),
  ];

  let record = engine.create({
    provenanceId: "PROV-APP-0004",
    caseId: "CASE-4",
    nodes,
    edges,
  });

  record = engine.buildLineage(
    record,
    "N-3",
  );

  assert.equal(
    record.lineages[0].ancestorNodeIds.includes("N-1"),
    true,
  );
});

test("engine adds pipeline step", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  let record = engine.create({
    provenanceId: "PROV-APP-0005",
    caseId: "CASE-5",
  });

  record = engine.addPipelineStep(
    record,
    createPipelineStep({
      stepId: "S-1",
      order: 1,
      name: "Detection",
    }),
  );

  assert.equal(record.pipelineSteps.length, 1);
});

test("serializer round-trips record", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const record = engine.create({
    provenanceId: "PROV-APP-0006",
    caseId: "CASE-6",
  });

  const serializer =
    new ProvenanceSerializer();

  const restored =
    serializer.deserialize(
      serializer.serialize(record),
    );

  assert.equal(
    restored.provenanceId.toString(),
    record.provenanceId.toString(),
  );
});

test("exporter creates JSON payload", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const record = engine.create({
    provenanceId: "PROV-APP-0007",
    caseId: "CASE-7",
  });

  const exported =
    new ProvenanceExporter()
      .exportJson(record);

  assert.equal(
    exported.mimeType,
    "application/json",
  );
});

test("duplicate node is rejected", () => {
  const engine =
    new ClinicalProvenanceEngine({
      clock: fixedClock,
    });

  const node =
    createEvidenceNode({
      nodeId: "N-1",
      type: "SOURCE",
      label: "Image",
    });

  let record = engine.create({
    provenanceId: "PROV-APP-0008",
    caseId: "CASE-8",
    nodes: [node],
  });

  assert.throws(
    () => engine.addNode(record, node),
    /already exists/,
  );
});
