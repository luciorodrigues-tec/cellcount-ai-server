export const DIAGNOSTIC_RECOMMENDATION_REPOSITORY_VERSION =
  "CRR-000022-v1.0.0";

export class DiagnosticRecommendationRepository {
  constructor({
    version = DIAGNOSTIC_RECOMMENDATION_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._recommendations = new Map();
  }

  registerRecommendation(
    recommendation,
    { replace = false } = {},
  ) {
    if (
      this._recommendations.has(recommendation.id) &&
      !replace
    ) {
      throw new Error(
        `Diagnostic recommendation already registered: ${recommendation.id}`,
      );
    }

    this._recommendations.set(
      recommendation.id,
      recommendation,
    );

    return recommendation;
  }

  getRecommendation(id) {
    return (
      this._recommendations.get(String(id)) ||
      null
    );
  }

  listRecommendations({
    hypothesisId = null,
    type = null,
    priority = null,
    status = null,
  } = {}) {
    return Object.freeze(
      [...this._recommendations.values()].filter(
        (item) =>
          (!hypothesisId ||
            item.hypothesisId === String(hypothesisId)) &&
          (!type ||
            item.type === String(type).trim().toUpperCase()) &&
          (!priority ||
            item.priority === String(priority).trim().toUpperCase()) &&
          (!status ||
            item.status === String(status).trim().toUpperCase()),
      ),
    );
  }
}
