export function createMatchEvidence({
  cellId,
  featureId,
  role,
  expected = true,
  detected = false,
  detectedFeatureId = null,
  confidence = 0,
  similarity = 0,
  weight = 0,
  matched = false,
  sourceCriterionId = "",
  label = "",
} = {}) {
  return Object.freeze({
    cellId,
    featureId,
    role,
    expected,
    detected,
    detectedFeatureId,
    confidence,
    similarity,
    weight,
    matched,
    sourceCriterionId,
    label,
  });
}
