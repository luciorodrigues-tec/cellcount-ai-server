import {
  getExclusiveFeatureProfile,
} from "./ExclusiveFeatureLibrary.js";

export function calculateFeatureSpecificity(
  featureId,
) {
  const profile =
    getExclusiveFeatureProfile(
      featureId,
    );

  return Object.freeze({
    featureId,
    specificity:
      Number(
        profile.specificity || 0,
      ),
    crossLineagePenalty:
      Number(
        profile
          .crossLineagePenalty || 0,
      ),
    metadata:
      profile.metadata,
  });
}
