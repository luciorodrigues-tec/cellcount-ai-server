import {
  ProvenanceId,
} from "../domain/ProvenanceId.js";

import {
  ProvenanceRecord,
} from "../domain/ProvenanceRecord.js";

import {
  createEvidenceGraph,
} from "../domain/EvidenceGraph.js";

import {
  EvidenceGraphBuilder,
} from "./EvidenceGraphBuilder.js";

import {
  EvidenceLineageBuilder,
} from "./EvidenceLineageBuilder.js";

export const CLINICAL_PROVENANCE_ENGINE_VERSION =
  "CGL-000002-S2-v1.0.0";

export class ClinicalProvenanceEngine {
  constructor({
    graphBuilder =
      new EvidenceGraphBuilder(),
    lineageBuilder =
      new EvidenceLineageBuilder(),
    clock = () => new Date(),
  } = {}) {
    this.graphBuilder = graphBuilder;
    this.lineageBuilder = lineageBuilder;
    this.clock = clock;
  }

  create({
    provenanceId,
    caseId,
    nodes = [],
    edges = [],
    transformations = [],
    pipelineSteps = [],
    metadata = {},
  } = {}) {
    const id =
      provenanceId instanceof ProvenanceId
        ? provenanceId
        : new ProvenanceId(provenanceId);

    const graph =
      this.graphBuilder.build({
        nodes,
        edges,
      });

    return new ProvenanceRecord({
      provenanceId: id,
      caseId,
      graph,
      transformations,
      pipelineSteps,
      lineages: [],
      createdAt:
        this.clock().toISOString(),
      metadata,
    });
  }

  addNode(record, node) {
    const graph =
      this.graphBuilder.addNode(
        record.graph,
        node,
      );

    return new ProvenanceRecord({
      ...record,
      graph,
    });
  }

  addEdge(record, edge) {
    const graph =
      this.graphBuilder.addEdge(
        record.graph,
        edge,
      );

    return new ProvenanceRecord({
      ...record,
      graph,
    });
  }

  addTransformation(
    record,
    transformation,
  ) {
    return new ProvenanceRecord({
      ...record,
      transformations: [
        ...record.transformations,
        transformation,
      ],
    });
  }

  addPipelineStep(record, step) {
    return new ProvenanceRecord({
      ...record,
      pipelineSteps: [
        ...record.pipelineSteps,
        step,
      ],
    });
  }

  buildLineage(record, targetNodeId) {
    const lineage =
      this.lineageBuilder.build(
        record.graph,
        targetNodeId,
      );

    return new ProvenanceRecord({
      ...record,
      lineages: [
        ...record.lineages,
        lineage,
      ],
    });
  }
}
