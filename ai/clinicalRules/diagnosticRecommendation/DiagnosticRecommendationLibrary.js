import {
  DiagnosticRecommendationRepository,
} from "./repository/DiagnosticRecommendationRepository.js";

import {
  DiagnosticRecommendationEngine,
} from "./application/DiagnosticRecommendationEngine.js";

export function createDiagnosticRecommendationLibrary({
  recommendations = [],
  policy = {},
} = {}) {
  const repository =
    new DiagnosticRecommendationRepository();

  for (const recommendation of recommendations) {
    repository.registerRecommendation(
      recommendation,
    );
  }

  return Object.freeze({
    repository,
    engine:
      new DiagnosticRecommendationEngine({
        repository,
        policy,
      }),
    recommendations:
      repository.listRecommendations(),
  });
}
