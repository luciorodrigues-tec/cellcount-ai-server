import {
  ClinicalProvenanceEngine,
} from "./application/ClinicalProvenanceEngine.js";

import {
  EvidenceGraphBuilder,
} from "./application/EvidenceGraphBuilder.js";

import {
  EvidenceLineageBuilder,
} from "./application/EvidenceLineageBuilder.js";

import {
  EvidenceIntegrityCalculator,
} from "./application/EvidenceIntegrityCalculator.js";

import {
  EvidenceWeightCalculator,
} from "./application/EvidenceWeightCalculator.js";

import {
  EvidenceConfidencePropagator,
} from "./application/EvidenceConfidencePropagator.js";

import {
  TransformationTracker,
} from "./application/TransformationTracker.js";

import {
  ProvenanceSerializer,
} from "./application/ProvenanceSerializer.js";

import {
  ProvenanceExporter,
} from "./application/ProvenanceExporter.js";

import {
  ClinicalProvenanceRepository,
} from "./repository/ClinicalProvenanceRepository.js";

import {
  ClinicalProvenanceReferenceMapper,
} from "./integration/ClinicalProvenanceReferenceMapper.js";

import {
  ClinicalProvenanceIntegrationService,
} from "./integration/ClinicalProvenanceIntegrationService.js";

export function createClinicalProvenanceLibrary({
  clock = () => new Date(),
  auditRepository = null,
} = {}) {
  const graphBuilder =
    new EvidenceGraphBuilder();

  const lineageBuilder =
    new EvidenceLineageBuilder();

  const engine =
    new ClinicalProvenanceEngine({
      graphBuilder,
      lineageBuilder,
      clock,
    });

  const repository =
    new ClinicalProvenanceRepository();

  const referenceMapper =
    new ClinicalProvenanceReferenceMapper();

  const integrationService =
    new ClinicalProvenanceIntegrationService({
      provenanceEngine: engine,
      repository,
      auditRepository,
      referenceMapper,
    });

  return Object.freeze({
    engine,
    repository,
    integrationService,
    referenceMapper,
    graphBuilder,
    lineageBuilder,
    integrityCalculator:
      new EvidenceIntegrityCalculator(),
    weightCalculator:
      new EvidenceWeightCalculator(),
    confidencePropagator:
      new EvidenceConfidencePropagator(),
    transformationTracker:
      new TransformationTracker({ clock }),
    serializer:
      new ProvenanceSerializer(),
    exporter:
      new ProvenanceExporter(),
  });
}
