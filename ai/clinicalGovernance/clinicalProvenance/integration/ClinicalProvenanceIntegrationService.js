import {
  createEvidenceEdge,
} from "../domain/EvidenceEdge.js";

import {
  ClinicalProvenanceReferenceMapper,
} from "./ClinicalProvenanceReferenceMapper.js";

export const CLINICAL_PROVENANCE_INTEGRATION_SERVICE_VERSION =
  "CGL-000002-S3-v1.0.0";

export class ClinicalProvenanceIntegrationService {
  constructor({
    provenanceEngine,
    repository,
    auditRepository = null,
    referenceMapper =
      new ClinicalProvenanceReferenceMapper(),
  } = {}) {
    if (!provenanceEngine) {
      throw new TypeError(
        "ClinicalProvenanceIntegrationService.provenanceEngine is required.",
      );
    }

    if (!repository) {
      throw new TypeError(
        "ClinicalProvenanceIntegrationService.repository is required.",
      );
    }

    this.provenanceEngine = provenanceEngine;
    this.repository = repository;
    this.auditRepository = auditRepository;
    this.referenceMapper = referenceMapper;
  }

  captureClinicalCase({
    provenanceId,
    caseId,
    sources = [],
    evidenceItems = [],
    relationships = [],
    transformations = [],
    pipelineSteps = [],
    selectedHypothesis = null,
    safetyGateResult,
    auditId = null,
    metadata = {},
    replace = false,
  } = {}) {
    if (!safetyGateResult) {
      throw new TypeError(
        "ClinicalProvenanceIntegrationService.safetyGateResult is required.",
      );
    }

    const sourceNodes =
      this.referenceMapper.mapSources(sources);

    const evidenceNodes =
      this.referenceMapper.mapEvidenceItems(evidenceItems);

    const nodes = [
      ...sourceNodes,
      ...evidenceNodes,
    ];

    if (selectedHypothesis?.hypothesisId) {
      nodes.push(
        this.referenceMapper.mapHypothesis(
          selectedHypothesis,
        ),
      );
    }

    const decisionNode =
      this.referenceMapper.mapDecision({
        caseId,
        decision:
          safetyGateResult.decision ||
          "HELD",
        selectedHypothesisId:
          selectedHypothesis?.hypothesisId ||
          safetyGateResult.selectedHypothesisId ||
          null,
        safetyScore:
          safetyGateResult.safetyScore ??
          null,
        metadata: {
          releaseAllowed:
            safetyGateResult.releaseAllowed === true,
          automationAllowed:
            safetyGateResult.automationAllowed === true,
          requiresHumanReview:
            safetyGateResult.requiresHumanReview === true,
        },
      });

    nodes.push(decisionNode);

    const mappedEdges =
      this.referenceMapper.mapRelationships(
        relationships,
      );

    const edges = [...mappedEdges];

    if (selectedHypothesis?.hypothesisId) {
      edges.push(
        createEvidenceEdge({
          edgeId:
            `EDGE-HYPOTHESIS-DECISION-${caseId}`,
          fromNodeId:
            selectedHypothesis.hypothesisId,
          toNodeId:
            decisionNode.nodeId,
          relationship:
            "SUPPORTS",
        }),
      );
    }

    let record =
      this.provenanceEngine.create({
        provenanceId,
        caseId,
        nodes,
        edges,
        transformations:
          this.referenceMapper.mapTransformations(
            transformations,
          ),
        pipelineSteps:
          this.referenceMapper.mapPipelineSteps(
            pipelineSteps,
          ),
        metadata: {
          auditId,
          ...metadata,
        },
      });

    record =
      this.provenanceEngine.buildLineage(
        record,
        decisionNode.nodeId,
      );

    this.repository.save(
      record,
      { replace },
    );

    if (
      auditId &&
      this.auditRepository
    ) {
      const audit =
        this.auditRepository.getByAuditId(
          auditId,
        );

      if (!audit) {
        throw new Error(
          `Linked audit record not found: ${auditId}`,
        );
      }
    }

    return record;
  }
}
