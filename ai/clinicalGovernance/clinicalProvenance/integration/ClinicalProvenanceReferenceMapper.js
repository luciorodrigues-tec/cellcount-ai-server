import {
  createDataOrigin,
} from "../domain/DataOrigin.js";

import {
  createSourceReference,
} from "../domain/SourceReference.js";

import {
  EvidenceWeight,
} from "../domain/EvidenceWeight.js";

import {
  EvidenceConfidence,
} from "../domain/EvidenceConfidence.js";

import {
  createEvidenceVersion,
} from "../domain/EvidenceVersion.js";

import {
  createEvidenceNode,
} from "../domain/EvidenceNode.js";

import {
  createEvidenceEdge,
} from "../domain/EvidenceEdge.js";

import {
  createTransformation,
} from "../domain/Transformation.js";

import {
  createPipelineStep,
} from "../domain/PipelineStep.js";

export const CLINICAL_PROVENANCE_REFERENCE_MAPPER_VERSION =
  "CGL-000002-S3-v1.0.0";

export class ClinicalProvenanceReferenceMapper {
  mapSources(sources = []) {
    return Object.freeze(
      (Array.isArray(sources) ? sources : []).map(
        (source, index) => {
          const origin = createDataOrigin({
            originId:
              source.originId ||
              source.id ||
              `ORIGIN-${index + 1}`,
            type:
              source.originType ||
              source.type ||
              "OTHER",
            source:
              source.source ||
              source.uri ||
              "UNKNOWN",
            acquiredAt:
              source.acquiredAt || null,
            hash:
              source.hash || null,
            metadata:
              source.metadata || {},
          });

          const sourceReference =
            createSourceReference({
              sourceId:
                source.sourceId ||
                source.id ||
                `SOURCE-${index + 1}`,
              sourceType:
                source.sourceType ||
                source.type ||
                "OTHER",
              uri:
                source.uri || null,
              version:
                source.version || null,
              checksum:
                source.checksum ||
                source.hash ||
                null,
              metadata:
                source.metadata || {},
            });

          return createEvidenceNode({
            nodeId:
              source.nodeId ||
              `NODE-SOURCE-${index + 1}`,
            type: "SOURCE",
            label:
              source.label ||
              source.name ||
              `Source ${index + 1}`,
            origin,
            sourceReference,
            weight:
              source.weight == null
                ? null
                : new EvidenceWeight(source.weight),
            confidence:
              source.confidence == null
                ? null
                : new EvidenceConfidence(source.confidence),
            version:
              source.version
                ? createEvidenceVersion({
                    version: source.version,
                    modelVersion:
                      source.modelVersion || null,
                    ruleVersion:
                      source.ruleVersion || null,
                    createdAt:
                      source.createdAt || null,
                  })
                : null,
            metadata:
              source.metadata || {},
          });
        },
      ),
    );
  }

  mapEvidenceItems(evidenceItems = []) {
    return Object.freeze(
      (Array.isArray(evidenceItems) ? evidenceItems : []).map(
        (item, index) =>
          createEvidenceNode({
            nodeId:
              item.nodeId ||
              item.evidenceId ||
              item.id ||
              `NODE-EVIDENCE-${index + 1}`,
            type:
              item.nodeType ||
              item.type ||
              "OBSERVATION",
            label:
              item.label ||
              item.summary ||
              item.explanation?.summary ||
              `Evidence ${index + 1}`,
            weight:
              item.weight == null
                ? null
                : new EvidenceWeight(item.weight),
            confidence:
              item.confidence == null
                ? null
                : new EvidenceConfidence(item.confidence),
            metadata: {
              hypothesisId:
                item.hypothesisId || null,
              status:
                item.status || null,
              score:
                item.normalizedScore ??
                item.score ??
                null,
              ...(
                item.metadata &&
                typeof item.metadata === "object"
                  ? item.metadata
                  : {}
              ),
            },
          }),
      ),
    );
  }

  mapHypothesis({
    hypothesisId,
    label = null,
    confidence = null,
    metadata = {},
  } = {}) {
    if (!hypothesisId) {
      throw new TypeError(
        "ClinicalProvenanceReferenceMapper.hypothesisId is required.",
      );
    }

    return createEvidenceNode({
      nodeId: String(hypothesisId),
      type: "HYPOTHESIS",
      label: label || String(hypothesisId),
      confidence:
        confidence == null
          ? null
          : new EvidenceConfidence(confidence),
      metadata: {
        hypothesisId: String(hypothesisId),
        ...metadata,
      },
    });
  }

  mapDecision({
    caseId,
    decision,
    selectedHypothesisId = null,
    safetyScore = null,
    metadata = {},
  } = {}) {
    if (!caseId || !decision) {
      throw new TypeError(
        "ClinicalProvenanceReferenceMapper requires caseId and decision.",
      );
    }

    return createEvidenceNode({
      nodeId: `DECISION-${caseId}`,
      type: "DECISION",
      label: String(decision),
      confidence:
        safetyScore == null
          ? null
          : new EvidenceConfidence(safetyScore),
      metadata: {
        selectedHypothesisId,
        ...metadata,
      },
    });
  }

  mapRelationships(relationships = []) {
    return Object.freeze(
      (Array.isArray(relationships) ? relationships : []).map(
        (relationship, index) =>
          createEvidenceEdge({
            edgeId:
              relationship.edgeId ||
              relationship.id ||
              `EDGE-${index + 1}`,
            fromNodeId:
              relationship.fromNodeId ||
              relationship.from,
            toNodeId:
              relationship.toNodeId ||
              relationship.to,
            relationship:
              relationship.relationship ||
              relationship.type ||
              "OTHER",
            weight:
              relationship.weight == null
                ? null
                : new EvidenceWeight(relationship.weight),
            transformationId:
              relationship.transformationId || null,
            metadata:
              relationship.metadata || {},
          }),
      ),
    );
  }

  mapTransformations(transformations = []) {
    return Object.freeze(
      (Array.isArray(transformations) ? transformations : []).map(
        (item, index) =>
          createTransformation({
            transformationId:
              item.transformationId ||
              item.id ||
              `TRANSFORMATION-${index + 1}`,
            name:
              item.name ||
              `Transformation ${index + 1}`,
            engineId:
              item.engineId ||
              "UNKNOWN",
            engineVersion:
              item.engineVersion ||
              "UNKNOWN",
            inputNodeIds:
              item.inputNodeIds || [],
            outputNodeIds:
              item.outputNodeIds || [],
            startedAt:
              item.startedAt || null,
            completedAt:
              item.completedAt || null,
            parameters:
              item.parameters || {},
            metadata:
              item.metadata || {},
          }),
      ),
    );
  }

  mapPipelineSteps(steps = []) {
    return Object.freeze(
      (Array.isArray(steps) ? steps : []).map(
        (step, index) =>
          createPipelineStep({
            stepId:
              step.stepId ||
              step.id ||
              `STEP-${index + 1}`,
            order:
              step.order ||
              index + 1,
            name:
              step.name ||
              `Step ${index + 1}`,
            transformationIds:
              step.transformationIds || [],
            nodeIds:
              step.nodeIds || [],
          }),
      ),
    );
  }
}
