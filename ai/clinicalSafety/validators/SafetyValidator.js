const SEVERITY_ORDER = {
  none: 0,
  info: 1,
  warning: 2,
  critical: 3,
  blocking: 4,
};

export function highestSeverity(values = []) {
  return values.reduce(
    (current, value) =>
      SEVERITY_ORDER[value] > SEVERITY_ORDER[current]
        ? value
        : current,
    "none",
  );
}

export function buildSafetyScore({
  triggered = [],
  blocking = false,
}) {
  if (blocking) {
    return 0;
  }

  let score = 100;

  for (const item of triggered) {
    score -= item.severity === "critical"
      ? 18
      : item.severity === "warning"
        ? 8
        : item.severity === "info"
          ? 2
          : 0;
  }

  return Math.max(0, Math.min(100, score));
}

export function validateSafetyResult(validation = {}) {
  return Boolean(
    validation &&
    typeof validation === "object" &&
    typeof validation.passed === "boolean" &&
    typeof validation.score === "number" &&
    Array.isArray(validation.auditTrail),
  );
}
