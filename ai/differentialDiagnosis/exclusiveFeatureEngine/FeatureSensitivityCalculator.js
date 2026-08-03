import {
  getExclusiveFeatureProfile,
} from "./ExclusiveFeatureLibrary.js";

export function calculateFeatureSensitivity(
  featureId,
) {
  const profile =
    getExclusiveFeatureProfile(
      featureId,
    );

  return Object.freeze({
    featureId,
    sensitivity:
      Number(
        profile.sensitivity || 0,
      ),
    metadata:
      profile.metadata,
  });
}
