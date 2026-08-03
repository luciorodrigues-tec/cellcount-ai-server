import {
  EvidenceConfidence,
} from "../domain/EvidenceConfidence.js";

export const EVIDENCE_CONFIDENCE_PROPAGATOR_VERSION =
  "CGL-000002-S2-v1.0.0";

export class EvidenceConfidencePropagator {
  propagate({
    parentConfidences = [],
    relationshipWeights = [],
    transformationReliability = 1,
  } = {}) {
    if (parentConfidences.length === 0) {
      return new EvidenceConfidence(0);
    }

    const weighted = parentConfidences.map(
      (confidence, index) => {
        const value =
          Number(confidence?.value ?? confidence);
        const weight =
          Number(
            relationshipWeights[index] ?? 1,
          );

        return {
          value: Math.max(0, Math.min(1, value)),
          weight: Math.max(0, Math.min(1, weight)),
        };
      },
    );

    const totalWeight =
      weighted.reduce(
        (total, item) => total + item.weight,
        0,
      ) || 1;

    const mean =
      weighted.reduce(
        (total, item) =>
          total + item.value * item.weight,
        0,
      ) / totalWeight;

    const propagated =
      mean *
      Math.max(
        0,
        Math.min(
          1,
          Number(transformationReliability),
        ),
      );

    return new EvidenceConfidence(
      Number(propagated.toFixed(8)),
    );
  }
}
