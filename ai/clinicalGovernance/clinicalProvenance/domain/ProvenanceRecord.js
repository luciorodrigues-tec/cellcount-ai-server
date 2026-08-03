import {
  createEvidenceGraph,
} from "./EvidenceGraph.js";

export const PROVENANCE_RECORD_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export class ProvenanceRecord {
  constructor({
    provenanceId,
    caseId,
    graph = null,
    transformations = [],
    pipelineSteps = [],
    lineages = [],
    createdAt,
    metadata = {},
  } = {}) {
    if (!provenanceId) {
      throw new TypeError(
        "ProvenanceRecord.provenanceId is required.",
      );
    }

    if (!caseId || !String(caseId).trim()) {
      throw new TypeError(
        "ProvenanceRecord.caseId is required.",
      );
    }

    if (!createdAt) {
      throw new TypeError(
        "ProvenanceRecord.createdAt is required.",
      );
    }

    this.schemaVersion =
      PROVENANCE_RECORD_SCHEMA_VERSION;
    this.provenanceId = provenanceId;
    this.caseId = String(caseId).trim();
    this.graph =
      graph ||
      createEvidenceGraph({
        nodes: [],
        edges: [],
      });
    this.transformations =
      Object.freeze([...transformations]);
    this.pipelineSteps =
      Object.freeze([...pipelineSteps]);
    this.lineages =
      Object.freeze([...lineages]);
    this.createdAt = String(createdAt);
    this.metadata = Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    });

    Object.freeze(this);
  }
}
