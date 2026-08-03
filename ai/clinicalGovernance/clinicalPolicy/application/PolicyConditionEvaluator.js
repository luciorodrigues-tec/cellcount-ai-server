export const POLICY_CONDITION_EVALUATOR_VERSION =
  "CGL-000003-S2-v1.0.0";

function resolvePath(context, path) {
  return String(path)
    .split(".")
    .reduce(
      (value, key) =>
        value == null ? undefined : value[key],
      context,
    );
}

export class PolicyConditionEvaluator {
  evaluate(condition, context = {}) {
    const normalized = String(condition || "").trim();

    if (!normalized) {
      return false;
    }

    const operators = [
      "!==",
      "===",
      ">=",
      "<=",
      "==",
      "!=",
      ">",
      "<",
    ];

    const operator =
      operators.find((candidate) =>
        normalized.includes(candidate),
      );

    if (!operator) {
      return Boolean(resolvePath(context, normalized));
    }

    const [leftRaw, rightRaw] =
      normalized.split(operator);

    const left = resolvePath(
      context,
      leftRaw.trim(),
    );

    const raw = rightRaw.trim();

    let right;

    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      right = raw.slice(1, -1);
    } else if (raw === "true") {
      right = true;
    } else if (raw === "false") {
      right = false;
    } else if (raw === "null") {
      right = null;
    } else if (!Number.isNaN(Number(raw))) {
      right = Number(raw);
    } else {
      right = resolvePath(context, raw);
    }

    switch (operator) {
      case "!==":
        return left !== right;
      case "===":
        return left === right;
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case ">=":
        return Number(left) >= Number(right);
      case "<=":
        return Number(left) <= Number(right);
      case ">":
        return Number(left) > Number(right);
      case "<":
        return Number(left) < Number(right);
      default:
        return false;
    }
  }
}
