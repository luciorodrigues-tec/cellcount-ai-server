const HUMAN_REVIEW_SEVERITIES = new Set([
  "critical",
  "blocking",
]);

function sentence(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

export function buildClinicalRuleExplanation({
  rule,
  matched,
  applied,
  field = null,
  reason = null,
  error = null,
} = {}) {
  if (!rule || typeof rule !== "object") {
    throw new TypeError(
      "Clinical rule is required for explainability.",
    );
  }

  const requiresHumanReview =
    HUMAN_REVIEW_SEVERITIES.has(rule.severity) ||
    rule.metadata?.requiresHumanReview === true;

  let outcome;

  if (error) {
    outcome =
      "A regra não pôde ser avaliada e requer revisão técnica.";
  } else if (!matched) {
    outcome =
      "Os critérios desta regra não foram satisfeitos.";
  } else if (applied) {
    outcome =
      "A regra foi acionada e sua transformação foi aplicada.";
  } else {
    outcome =
      "A regra foi acionada em modo de avaliação, sem alterar o resultado.";
  }

  const rationaleParts = [
    sentence(
      rule.description,
      `Regra clínica ${rule.id}.`,
    ),
  ];

  if (field) {
    rationaleParts.push(
      `Campo auditado: ${String(field)}.`,
    );
  }

  if (reason) {
    rationaleParts.push(
      `Condição registrada: ${String(reason)}.`,
    );
  }

  const evidenceStatement =
    rule.evidenceLevel === "UNSPECIFIED"
      ? "O nível de evidência ainda não foi estruturado nesta baseline."
      : `Nível de evidência declarado: ${rule.evidenceLevel}.`;

  return Object.freeze({
    headline: `${rule.id} — ${rule.title}`,
    outcome,
    rationale: rationaleParts.join(" "),
    evidenceStatement,
    requiresHumanReview,
    safetyStatement: requiresHumanReview
      ? "Este resultado exige revisão humana antes de uso clínico."
      : "Interpretar em conjunto com o contexto clínico e laboratorial.",
  });
}
