import {
  assertGuidelineStatus,
} from "./GuidelineStatus.js";

export const CLINICAL_GUIDELINE_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export class ClinicalGuideline {
  constructor({
    guidelineId,
    name,
    description = null,
    status = "DRAFT",
    version,
    scope,
    priority,
    entryNodeId,
    nodes = [],
    conditions = [],
    branches = [],
    recommendations = [],
    references = [],
    outcomes = [],
    steps = [],
    createdAt,
    updatedAt = null,
    metadata = {},
  } = {}) {
    if (!guidelineId || !name || !version || !scope || !priority) {
      throw new TypeError(
        "ClinicalGuideline requires guidelineId, name, version, scope and priority.",
      );
    }

    if (!entryNodeId || !createdAt) {
      throw new TypeError(
        "ClinicalGuideline requires entryNodeId and createdAt.",
      );
    }

    const ensureUnique = (values, selector, label) => {
      const ids = values.map(selector);
      if (new Set(ids).size !== ids.length) {
        throw new Error(
          `ClinicalGuideline contains duplicate ${label}.`,
        );
      }
    };

    ensureUnique(nodes, (item) => item.nodeId, "node ids");
    ensureUnique(conditions, (item) => item.conditionId, "condition ids");
    ensureUnique(branches, (item) => item.branchId, "branch ids");
    ensureUnique(recommendations, (item) => item.recommendationId, "recommendation ids");
    ensureUnique(outcomes, (item) => item.outcomeId, "outcome ids");
    ensureUnique(steps, (item) => item.stepId, "step ids");

    const nodeIds = new Set(nodes.map((item) => item.nodeId));
    if (!nodeIds.has(String(entryNodeId))) {
      throw new Error(
        "ClinicalGuideline.entryNodeId must reference an existing node.",
      );
    }

    for (const branch of branches) {
      if (!nodeIds.has(branch.targetNodeId)) {
        throw new Error(
          `Guideline branch references unknown node: ${branch.branchId}`,
        );
      }
    }

    this.schemaVersion =
      CLINICAL_GUIDELINE_SCHEMA_VERSION;
    this.guidelineId = guidelineId;
    this.name = String(name).trim();
    this.description =
      description === null ? null : String(description).trim();
    this.status = assertGuidelineStatus(status);
    this.version = version;
    this.scope = scope;
    this.priority = priority;
    this.entryNodeId = String(entryNodeId).trim();
    this.nodes = Object.freeze([...nodes]);
    this.conditions = Object.freeze([...conditions]);
    this.branches = Object.freeze(
      [...branches].sort((a, b) => a.priority - b.priority),
    );
    this.recommendations = Object.freeze([...recommendations]);
    this.references = Object.freeze([...references]);
    this.outcomes = Object.freeze([...outcomes]);
    this.steps = Object.freeze(
      [...steps].sort((a, b) => a.order - b.order),
    );
    this.createdAt = String(createdAt);
    this.updatedAt =
      updatedAt === null ? null : String(updatedAt);
    this.metadata = Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    });

    Object.freeze(this);
  }

  isActive() {
    return this.status === "ACTIVE";
  }
}
