export class ConfidenceSafetyValidator {
  validate({
    score,
    residualConflictDetected,
    abstentionDetected,
    overconfidenceDetected,
    policy,
  }) {
    const requiresHumanReview =
      (
        residualConflictDetected &&
        policy.requireHumanReviewOnConflict
      ) ||
      (
        abstentionDetected &&
        policy.requireHumanReviewOnAbstention
      ) ||
      (
        overconfidenceDetected &&
        policy.requireHumanReviewOnOverconfidence
      ) ||
      score < policy.minimumReviewScore;

    const automationBlocked =
      (
        abstentionDetected &&
        policy.blockAutomationOnAbstention
      ) ||
      (
        residualConflictDetected &&
        policy.blockAutomationOnConflict
      ) ||
      (
        score < policy.minimumAutomationScore &&
        policy.blockAutomationBelowThreshold
      );

    return Object.freeze({
      requiresHumanReview,
      automationAllowed: !automationBlocked,
    });
  }
}
