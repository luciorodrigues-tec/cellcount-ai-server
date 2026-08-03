import {
  boneMarrowSafetyRules,
  snapshotField,
} from "../rules/boneMarrowSafetyRules.js";

import {
  SafetyAuditTrail,
} from "../audit/SafetyAuditTrail.js";

import {
  buildSafetyScore,
  highestSeverity,
} from "../validators/SafetyValidator.js";

export const BONE_MARROW_SAFETY_VERSION = "CI-001B.5-v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

export function applyBoneMarrowSafetyGovernor(
  result = {},
) {
  let output = clone(result);
  const audit = new SafetyAuditTrail();
  const triggered = [];
  const blockedStatements = [];
  const forcedChanges = [];

  for (const rule of boneMarrowSafetyRules) {
    if (!rule.applies(output)) {
      continue;
    }

    const before =
      snapshotField(output, rule.field);

    const next =
      rule.apply(output);

    const after =
      snapshotField(next, rule.field);

    triggered.push({
      rule: rule.id,
      severity: rule.severity,
    });

    audit.add({
      rule: rule.id,
      severity: rule.severity,
      field: rule.field,
      before,
      after,
      reason: rule.reason,
      action:
        rule.severity === "blocking"
          ? "block"
          : "correct",
    });

    if (before !== after) {
      forcedChanges.push(rule.id);
    }

    if (
      rule.severity === "critical" ||
      rule.severity === "blocking"
    ) {
      blockedStatements.push(rule.id);
    }

    output = next;
  }

  const blocking =
    triggered.some(
      (item) => item.severity === "blocking",
    );

  const severity =
    highestSeverity(
      triggered.map((item) => item.severity),
    );

  const validation = {
    version: BONE_MARROW_SAFETY_VERSION,
    passed: !blocking,
    deliveryAllowed: !blocking,
    score: buildSafetyScore({
      triggered,
      blocking,
    }),
    severity,
    rulesExecuted:
      boneMarrowSafetyRules.length,
    rulesTriggered:
      triggered.length,
    triggeredRules:
      triggered,
    corrected:
      [...new Set(forcedChanges)],
    blockedStatements:
      [...new Set(blockedStatements)],
    forcedChanges:
      [...new Set(forcedChanges)],
    auditTrail:
      audit.toJSON(),
  };

  return {
    ...output,
    marrowSafetyValidation:
      validation,
    clinicalSafety: {
      ...(output.clinicalSafety || {}),
      specimen: "bone_marrow",
      version:
        BONE_MARROW_SAFETY_VERSION,
      passed:
        validation.passed,
      score:
        validation.score,
      severity:
        validation.severity,
    },
  };
}
