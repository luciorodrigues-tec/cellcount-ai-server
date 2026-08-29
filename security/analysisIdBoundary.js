const ANALYSIS_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidAnalysisId(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return normalized.length === 36 && ANALYSIS_ID_PATTERN.test(normalized);
}

export function validateAnalysisIdBoundary(value) {
  const analysisId = typeof value === "string" ? value.trim() : "";
  if (!isValidAnalysisId(analysisId)) {
    return { valid: false, analysisId: null, errorCode: "INVALID_ANALYSIS_ID", error: "analysisId inválido." };
  }
  return { valid: true, analysisId, errorCode: null, error: null };
}
