export class ConfidenceWeightCalculator {
  calculate(factors = []) {
    const active = (Array.isArray(factors) ? factors : [])
      .filter((factor) => factor.direction !== "NEUTRAL");

    const totalWeight = active.reduce(
      (total, factor) => total + Number(factor.weight || 0),
      0,
    );

    if (totalWeight <= 0) {
      return Object.freeze({
        score: 0,
        totalWeight: 0,
        positiveWeight: 0,
        negativeWeight: 0,
      });
    }

    let positiveWeight = 0;
    let negativeWeight = 0;

    for (const factor of active) {
      const contribution =
        Number(factor.value || 0) *
        Number(factor.weight || 0);

      if (factor.direction === "POSITIVE") {
        positiveWeight += contribution;
      } else if (factor.direction === "NEGATIVE") {
        negativeWeight += contribution;
      }
    }

    const score = Math.max(
      0,
      Math.min(
        1,
        (positiveWeight - negativeWeight) / totalWeight,
      ),
    );

    return Object.freeze({
      score: Number(score.toFixed(8)),
      totalWeight: Number(totalWeight.toFixed(8)),
      positiveWeight: Number(positiveWeight.toFixed(8)),
      negativeWeight: Number(negativeWeight.toFixed(8)),
    });
  }
}
