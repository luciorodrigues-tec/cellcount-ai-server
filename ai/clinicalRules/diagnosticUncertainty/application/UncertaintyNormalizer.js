export class UncertaintyNormalizer {
  clamp(value, fallback = 0) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return Math.max(
        0,
        Math.min(
          1,
          Number(fallback) || 0,
        ),
      );
    }

    return Math.max(
      0,
      Math.min(1, numeric),
    );
  }

  inverseConfidence(confidence) {
    return Number(
      (
        1 -
        this.clamp(confidence, 0)
      ).toFixed(8),
    );
  }
}
