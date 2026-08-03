export const DIAGNOSTIC_NARRATIVE_TEMPLATES_VERSION =
  "CRR-000024-v1.0.0";

const PT_BR = Object.freeze({
  title: "Narrativa clínica explicável",
  noHypothesis:
    "Não foi possível estabelecer uma hipótese principal com base nos dados estruturados disponíveis.",
  noClassification:
    "Nenhuma classificação estruturada foi selecionada.",
  noMorphology:
    "A síntese morfológica estruturada não estava disponível.",
  noEvidence:
    "Não havia escore de evidência suficiente para sustentar interpretação quantitativa.",
  noRecommendations:
    "Nenhuma recomendação estruturada foi gerada.",
  review:
    "O caso requer revisão humana antes de qualquer conclusão clínica.",
  blocked:
    "A automação foi bloqueada por condição de segurança.",
});

const EN_US = Object.freeze({
  title: "Explainable clinical narrative",
  noHypothesis:
    "A leading hypothesis could not be established from the available structured data.",
  noClassification:
    "No structured classification was selected.",
  noMorphology:
    "Structured morphologic synthesis was unavailable.",
  noEvidence:
    "There was insufficient evidence scoring for quantitative interpretation.",
  noRecommendations:
    "No structured recommendation was generated.",
  review:
    "The case requires human review before any clinical conclusion.",
  blocked:
    "Automation was blocked by a safety condition.",
});

export function getDiagnosticNarrativeTemplates(locale) {
  return String(locale) === "en-US"
    ? EN_US
    : PT_BR;
}
