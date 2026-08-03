import {
  ClinicalAuditEngine,
} from "./application/ClinicalAuditEngine.js";

import {
  AuditIntegrityCalculator,
} from "./application/AuditIntegrityCalculator.js";

import {
  AuditSnapshotBuilder,
} from "./application/AuditSnapshotBuilder.js";

import {
  AuditTimelineBuilder,
} from "./application/AuditTimelineBuilder.js";

import {
  AuditValidationService,
} from "./application/AuditValidationService.js";

import {
  AuditReplayEngine,
} from "./application/AuditReplayEngine.js";

import {
  AuditSerializer,
} from "./application/AuditSerializer.js";

import {
  AuditExporter,
} from "./application/AuditExporter.js";

import {
  AuditQueryService,
} from "./application/AuditQueryService.js";

import {
  ClinicalAuditRepository,
} from "./repository/ClinicalAuditRepository.js";

import {
  ClinicalAuditReferenceMapper,
} from "./integration/ClinicalAuditReferenceMapper.js";

import {
  ClinicalAuditIntegrationService,
} from "./integration/ClinicalAuditIntegrationService.js";

export function createClinicalAuditLibrary({
  clock = () => new Date(),
} = {}) {
  const timelineBuilder =
    new AuditTimelineBuilder();

  const integrityCalculator =
    new AuditIntegrityCalculator();

  const snapshotBuilder =
    new AuditSnapshotBuilder({
      integrityCalculator,
      clock,
    });

  const validationService =
    new AuditValidationService();

  const engine =
    new ClinicalAuditEngine({
      timelineBuilder,
      integrityCalculator,
      snapshotBuilder,
      validationService,
      clock,
    });

  const repository =
    new ClinicalAuditRepository();

  const referenceMapper =
    new ClinicalAuditReferenceMapper();

  const integrationService =
    new ClinicalAuditIntegrationService({
      auditEngine: engine,
      repository,
      referenceMapper,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    integrationService,
    referenceMapper,
    replayEngine:
      new AuditReplayEngine(),
    serializer:
      new AuditSerializer(),
    exporter:
      new AuditExporter(),
    queryService:
      new AuditQueryService(),
  });
}
