import assert from "node:assert/strict";
import test from "node:test";

import {
  ProvenanceId,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/ProvenanceId.js";

import {
  createDataOrigin,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/DataOrigin.js";

import {
  EvidenceWeight,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceWeight.js";

import {
  EvidenceConfidence,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceConfidence.js";

import {
  createEvidenceNode,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceNode.js";

import {
  createEvidenceEdge,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceEdge.js";

import {
  createTransformation,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/Transformation.js";

import {
  createPipelineStep,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/PipelineStep.js";

import {
  createEvidenceGraph,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/EvidenceGraph.js";

import {
  createLineage,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/Lineage.js";

import {
  ProvenanceRecord,
} from "../ai/clinicalGovernance/clinicalProvenance/domain/ProvenanceRecord.js";

test("ProvenanceId validates format", () => {
  assert.throws(
    () => new ProvenanceId("invalid"),
    /must match/,
  );

  assert.equal(
    new ProvenanceId("PROV-CASE-0001").toString(),
    "PROV-CASE-0001",
  );
});

test("DataOrigin is immutable", () => {
  const origin =
    createDataOrigin({
      originId: "IMG-1",
      type: "IMAGE",
      source: "upload",
    });

  assert.equal(Object.isFrozen(origin), true);
});

test("DataOrigin rejects unsupported type", () => {
  assert.throws(
    () =>
      createDataOrigin({
        originId: "X",
        type: "UNKNOWN",
        source: "test",
      }),
    /Unsupported data origin type/,
  );
});

test("EvidenceWeight validates range", () => {
  assert.throws(
    () => new EvidenceWeight(2),
    /between 0 and 1/,
  );
});

test("EvidenceConfidence validates range", () => {
  assert.throws(
    () => new EvidenceConfidence(-1),
    /between 0 and 1/,
  );
});

test("EvidenceNode is immutable", () => {
  const node =
    createEvidenceNode({
      nodeId: "N-1",
      type: "SOURCE",
      label: "Image 1",
    });

  assert.equal(Object.isFrozen(node), true);
});

test("EvidenceEdge rejects unsupported relationship", () => {
  assert.throws(
    () =>
      createEvidenceEdge({
        edgeId: "E-1",
        fromNodeId: "N-1",
        toNodeId: "N-2",
        relationship: "UNKNOWN",
      }),
    /Unsupported evidence relationship/,
  );
});

test("Transformation requires engine version", () => {
  assert.throws(
    () =>
      createTransformation({
        transformationId: "T-1",
        name: "Detect",
        engineId: "YOLO",
      }),
    /engineVersion is required/,
  );
});

test("PipelineStep validates order", () => {
  assert.throws(
    () =>
      createPipelineStep({
        stepId: "S-1",
        order: 0,
        name: "Step",
      }),
    /positive integer/,
  );
});

test("EvidenceGraph validates edge endpoints", () => {
  const node =
    createEvidenceNode({
      nodeId: "N-1",
      type: "SOURCE",
      label: "Image",
    });

  const edge =
    createEvidenceEdge({
      edgeId: "E-1",
      fromNodeId: "N-1",
      toNodeId: "N-2",
      relationship: "DERIVED_FROM",
    });

  assert.throws(
    () =>
      createEvidenceGraph({
        nodes: [node],
        edges: [edge],
      }),
    /unknown node/,
  );
});

test("Lineage is immutable", () => {
  const lineage =
    createLineage({
      targetNodeId: "N-3",
      ancestorNodeIds: ["N-1", "N-2"],
      pathEdgeIds: ["E-1", "E-2"],
    });

  assert.equal(Object.isFrozen(lineage), true);
});

test("ProvenanceRecord is immutable", () => {
  const record =
    new ProvenanceRecord({
      provenanceId:
        new ProvenanceId("PROV-CASE-0002"),
      caseId: "CASE-2",
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(Object.isFrozen(record), true);
});

test("ProvenanceRecord requires caseId", () => {
  assert.throws(
    () =>
      new ProvenanceRecord({
        provenanceId:
          new ProvenanceId("PROV-CASE-0003"),
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /caseId is required/,
  );
});
