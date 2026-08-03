export class ConfidenceExplainer {
  explain({
    score,
    level,
    factorCount,
    positiveCount,
    negativeCount,
    residualConflictDetected,
    abstentionDetected,
    overconfidenceDetected,
    underconfidenceDetected,
  }) {
    return Object.freeze({
      summary:
        `Final calibrated confidence is ${level} (${score.toFixed(4)}).`,
      rationale:
        `Factors ${factorCount}; positive ${positiveCount}; negative ${negativeCount}; conflict ${residualConflictDetected}; abstention ${abstentionDetected}; overconfidence ${overconfidenceDetected}; underconfidence ${underconfidenceDetected}.`,
      safetyStatement:
        "Confidence calibration supports expert review and does not establish a definitive diagnosis.",
    });
  }
}
