export const CONFIDENCE_CALIBRATION_RESULT_SCHEMA_VERSION =
  "CRR-000030-v1";

export function createConfidenceCalibrationResult({
  caseId,
  finalConfidenceScore,
  confidenceLevel,
  calibrationStatus,
  overconfidenceDetected,
  underconfidenceDetected,
  residualConflictDetected,
  abstentionDetected,
  requiresHumanReview,
  automationAllowed,
  confidenceFactors = [],
  positiveFactors = [],
  negativeFactors = [],
  auditTrail = {},
  explanation = {},
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !createdAt) {
    throw new TypeError(
      "ConfidenceCalibrationResult requires caseId and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion: CONFIDENCE_CALIBRATION_RESULT_SCHEMA_VERSION,
    caseId: String(caseId),
    finalConfidenceScore: Number(finalConfidenceScore),
    confidenceLevel: String(confidenceLevel),
    calibrationStatus: String(calibrationStatus),
    overconfidenceDetected: Boolean(overconfidenceDetected),
    underconfidenceDetected: Boolean(underconfidenceDetected),
    residualConflictDetected: Boolean(residualConflictDetected),
    abstentionDetected: Boolean(abstentionDetected),
    requiresHumanReview: Boolean(requiresHumanReview),
    automationAllowed: Boolean(automationAllowed),
    confidenceFactors: Object.freeze([...confidenceFactors]),
    positiveFactors: Object.freeze([...positiveFactors]),
    negativeFactors: Object.freeze([...negativeFactors]),
    auditTrail: Object.freeze({ ...auditTrail }),
    explanation: Object.freeze({ ...explanation }),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
    safetyStatement:
      "Calibrated confidence is clinical decision support and does not establish a definitive diagnosis.",
  });
}
