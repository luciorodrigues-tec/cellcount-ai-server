import {
  BayesianDiagnosticConfidenceEngine,
} from "./application/BayesianDiagnosticConfidenceEngine.js";

import {
  BayesianEvidenceBuilder,
} from "./application/BayesianEvidenceBuilder.js";

import {
  BayesianHypothesisProfileRepository,
} from "./repository/BayesianHypothesisProfileRepository.js";

export function createBayesianDiagnosticConfidenceLibrary({
  profiles = [],
  policy = {},
} = {}) {
  const profileRepository =
    new BayesianHypothesisProfileRepository();

  for (const profile of profiles) {
    profileRepository.register(profile);
  }

  return Object.freeze({
    profileRepository,
    evidenceBuilder:
      new BayesianEvidenceBuilder(),
    engine:
      new BayesianDiagnosticConfidenceEngine({
        profileRepository,
        policy,
      }),
    profiles:
      profileRepository.list(),
  });
}
