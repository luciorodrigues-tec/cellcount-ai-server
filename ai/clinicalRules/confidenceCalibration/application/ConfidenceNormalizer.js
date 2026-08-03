export class ConfidenceNormalizer {
  normalize(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return Math.max(0, Math.min(1, Number(fallback) || 0));
    }
    return Math.max(0, Math.min(1, numeric));
  }

  normalizeSigned(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return Math.max(-1, Math.min(1, Number(fallback) || 0));
    }
    return Math.max(-1, Math.min(1, numeric));
  }
}
