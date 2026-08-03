import {
  RuleEvidenceRepository,
} from "../repository/RuleEvidenceRepository.js";

import {
  ScientificEvidenceCatalogService,
} from "./application/ScientificEvidenceCatalogService.js";

import {
  ScientificGovernanceEngine,
} from "./application/ScientificGovernanceEngine.js";

import {
  mergeScientificGovernancePolicy,
} from "./domain/ScientificGovernancePolicy.js";

import {
  ScientificGovernanceRepository,
} from "./repository/ScientificGovernanceRepository.js";

export function createScientificGovernanceLibrary({
  evidenceRepository = new RuleEvidenceRepository(),
  policy = {},
  reviewers = [],
  records = [],
} = {}) {
  const governanceRepository =
    new ScientificGovernanceRepository();

  for (const reviewer of reviewers) {
    governanceRepository.registerReviewer(
      reviewer,
    );
  }

  for (const record of records) {
    governanceRepository.registerRecord(record);
  }

  const governanceEngine =
    new ScientificGovernanceEngine({
      repository: governanceRepository,
      evidenceRepository,
      policy: mergeScientificGovernancePolicy(
        policy,
      ),
    });

  const catalogService =
    new ScientificEvidenceCatalogService({
      evidenceRepository,
      governanceRepository,
      governanceEngine,
    });

  return Object.freeze({
    evidenceRepository,
    governanceRepository,
    governanceEngine,
    catalogService,
  });
}
