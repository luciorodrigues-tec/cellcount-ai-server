export function createDiagnosticConflictResult({
  version,
  exclusiveFeatureResult,
  evidenceAnalysis,
  severity,
  probabilities,
  resolution,
  summary,
  metadata = {},
} = {}) {
  return Object.freeze({
    version,
    pairId:
      exclusiveFeatureResult
        ?.pairId || null,
    primaryCell:
      exclusiveFeatureResult
        ?.primaryCell || null,
    alternativeCell:
      exclusiveFeatureResult
        ?.alternativeCell || null,
    conflictDetected:
      evidenceAnalysis
        .conflicts
        .length > 0,
    conflicts:
      evidenceAnalysis.conflicts,
    severity,
    probabilities,
    resolution,
    summary,
    statistics:
      Object.freeze({
        totalConflicts:
          evidenceAnalysis
            .conflicts
            .length,
        winnerFeatures:
          evidenceAnalysis
            .winnerFeatures
            .length,
        alternativeFeatures:
          evidenceAnalysis
            .alternativeFeatures
            .length,
        sharedFeatures:
          evidenceAnalysis
            .sharedFeatures
            .length,
        missingFeatures:
          evidenceAnalysis
            .missingFeatures
            .length,
        winnerMaintained:
          resolution
            .winnerMaintained,
        winnerChanged:
          resolution
            .winnerChanged,
        diagnosticTie:
          resolution
            .diagnosticTie,
        insufficientEvidence:
          resolution
            .insufficientEvidence,
      }),
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
