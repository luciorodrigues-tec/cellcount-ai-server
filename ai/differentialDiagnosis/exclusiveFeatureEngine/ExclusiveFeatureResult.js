export function createExclusiveFeatureResult({
  featureId,
  group,
  favors,
  specificity = 0,
  sensitivity = 0,
  evidenceWeight = 0,
  confidence = 0,
  crossLineagePenalty = 0,
  discriminationScore = 0,
  classification = "NON_DISCRIMINATIVE",
  observed = false,
  missing = false,
  pathognomonic = false,
  sourceEvidence = null,
  metadata = {},
} = {}) {
  return Object.freeze({
    featureId:
      String(featureId || ""),
    group:
      String(group || ""),
    favors:
      favors || null,
    specificity:
      Number(specificity || 0),
    sensitivity:
      Number(sensitivity || 0),
    evidenceWeight:
      Number(
        evidenceWeight || 0,
      ),
    confidence:
      Number(confidence || 0),
    crossLineagePenalty:
      Number(
        crossLineagePenalty || 0,
      ),
    discriminationScore:
      Number(
        discriminationScore || 0,
      ),
    classification:
      String(
        classification ||
        "NON_DISCRIMINATIVE",
      ),
    observed:
      observed === true,
    missing:
      missing === true,
    pathognomonic:
      pathognomonic === true,
    sourceEvidence,
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
