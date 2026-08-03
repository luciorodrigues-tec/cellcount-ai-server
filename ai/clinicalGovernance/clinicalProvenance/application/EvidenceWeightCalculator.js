import {
  EvidenceWeight,
} from "../domain/EvidenceWeight.js";

export const PROVENANCE_EVIDENCE_WEIGHT_CALCULATOR_VERSION =
  "CGL-000002-S2-v1.0.0";

export class EvidenceWeightCalculator {
  calculate({
    sourceReliability = 1,
    transformationReliability = 1,
    freshness = 1,
    consistency = 1,
  } = {}) {
    const values = [
      sourceReliability,
      transformationReliability,
      freshness,
      consistency,
    ].map((value) =>
      Math.max(0, Math.min(1, Number(value))),
    );

    const weight =
      values.reduce(
        (total, value) => total + value,
        0,
      ) / values.length;

    return new EvidenceWeight(
      Number(weight.toFixed(8)),
    );
  }
}
