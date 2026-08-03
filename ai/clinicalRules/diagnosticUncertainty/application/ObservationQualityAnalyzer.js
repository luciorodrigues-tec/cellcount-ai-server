export const OBSERVATION_QUALITY_ANALYZER_VERSION =
  "CRR-000031-v1.0.0";

export class ObservationQualityAnalyzer {
  analyze({
    imageQualityScore = null,
    multiImageConsistencyScore = null,
    policy,
  } = {}) {
    let uncertainty = 0;
    const limitations = [];

    if (
      imageQualityScore !== null
    ) {
      const quality = Math.max(
        0,
        Math.min(
          1,
          Number(imageQualityScore),
        ),
      );

      if (
        quality <
        policy.lowImageQualityThreshold
      ) {
        uncertainty = Math.max(
          uncertainty,
          1 - quality,
        );
        limitations.push(
          "Low image quality limits morphologic interpretation.",
        );
      }
    }

    if (
      multiImageConsistencyScore !== null
    ) {
      const consistency = Math.max(
        0,
        Math.min(
          1,
          Number(
            multiImageConsistencyScore,
          ),
        ),
      );

      if (
        consistency <
        policy.lowConsistencyThreshold
      ) {
        uncertainty = Math.max(
          uncertainty,
          1 - consistency,
        );
        limitations.push(
          "Low agreement between images increases observational uncertainty.",
        );
      }
    }

    return Object.freeze({
      uncertaintyScore:
        Number(
          uncertainty.toFixed(8),
        ),
      limitations:
        Object.freeze(limitations),
    });
  }
}
