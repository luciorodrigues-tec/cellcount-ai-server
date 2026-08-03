export const GUIDELINE_CONDITION_EVALUATOR_VERSION =
  "CGL-000004-S2-v1.0.0";

function resolvePath(context, path) {
  return String(path)
    .split(".")
    .reduce(
      (value, key) =>
        value == null ? undefined : value[key],
      context,
    );
}

export class GuidelineConditionEvaluator {
  evaluate(condition, context = {}) {
    const expression =
      String(condition?.expression || condition || "").trim();

    if (!expression) {
      return Object.freeze({
        matched: false,
        reason: "Empty expression.",
        evaluatedExpression: expression,
      });
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
        expression.includes(candidate),
      );

    if (!operator) {
      const matched =
        Boolean(resolvePath(context, expression));

      return Object.freeze({
        matched,
        reason:
          matched
            ? "Context path resolved to truthy."
            : "Context path resolved to falsy.",
        evaluatedExpression: expression,
      });
    }

    const [leftRaw, rightRaw] =
      expression.split(operator);

    const left =
      resolvePath(context, leftRaw.trim());

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

    let matched = false;

    switch (operator) {
      case "!==":
        matched = left !== right;
        break;
      case "===":
        matched = left === right;
        break;
      case "==":
        matched = left == right;
        break;
      case "!=":
        matched = left != right;
        break;
      case ">=":
        matched = Number(left) >= Number(right);
        break;
      case "<=":
        matched = Number(left) <= Number(right);
        break;
      case ">":
        matched = Number(left) > Number(right);
        break;
      case "<":
        matched = Number(left) < Number(right);
        break;
      default:
        matched = false;
    }

    return Object.freeze({
      matched,
      reason:
        `Expression evaluated to ${matched}.`,
      evaluatedExpression: expression,
      left,
      operator,
      right,
    });
  }
}
