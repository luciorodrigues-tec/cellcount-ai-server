export const BAYESIAN_PROFILE_REPOSITORY_VERSION =
  "CRR-000008-v1.0.0";

export class BayesianHypothesisProfileRepository {
  constructor({
    version =
      BAYESIAN_PROFILE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._profiles = new Map();
  }

  register(profile, { replace = false } = {}) {
    if (!profile?.hypothesisId) {
      throw new TypeError(
        "Bayesian hypothesis profile is required.",
      );
    }

    if (
      this._profiles.has(profile.hypothesisId) &&
      !replace
    ) {
      throw new Error(
        `Bayesian hypothesis profile already registered: ${profile.hypothesisId}`,
      );
    }

    this._profiles.set(
      profile.hypothesisId,
      profile,
    );
    return profile;
  }

  get(hypothesisId) {
    return (
      this._profiles.get(
        String(hypothesisId),
      ) || null
    );
  }

  list() {
    return Object.freeze([
      ...this._profiles.values(),
    ]);
  }
}
