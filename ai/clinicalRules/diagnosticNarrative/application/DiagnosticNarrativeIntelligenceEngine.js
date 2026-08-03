import {
  createDiagnosticNarrativeResult,
} from "../domain/DiagnosticNarrativeResult.js";

import {
  mergeDiagnosticNarrativePolicy,
} from "../domain/DiagnosticNarrativePolicy.js";

import {
  getDiagnosticNarrativeTemplates,
} from "./DiagnosticNarrativeTemplates.js";

export const DIAGNOSTIC_NARRATIVE_INTELLIGENCE_ENGINE_VERSION =
  "CRR-000024-v1.0.0";

function hypothesisLabel(value) {
  return (
    value?.hypothesisLabel ||
    value?.label ||
    value?.hypothesisId ||
    value?.candidateId ||
    null
  );
}

function scoreText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? numeric.toFixed(4)
    : null;
}

export class DiagnosticNarrativeIntelligenceEngine {
  constructor({
    policy = {},
    clock = () => new Date(),
  } = {}) {
    this.policy =
      mergeDiagnosticNarrativePolicy(policy);
    this.clock = clock;
  }

  generate(context) {
    if (!context?.caseSynthesis?.caseId) {
      throw new TypeError(
        "DiagnosticNarrativeIntelligenceEngine requires a valid narrative context.",
      );
    }

    const synthesis = context.caseSynthesis;
    const locale =
      this.policy.supportedLocales.includes(
        context.locale,
      )
        ? context.locale
        : this.policy.defaultLocale;

    const templates =
      getDiagnosticNarrativeTemplates(locale);

    const leading =
      synthesis.leadingHypothesis || null;
    const leadingLabel =
      hypothesisLabel(leading);

    const classification =
      synthesis.selectedClassification || null;

    const morphology =
      synthesis.morphologySummary || null;

    const evidence =
      synthesis.evidenceSummary || null;

    const recommendations =
      synthesis.recommendationSummary || null;

    const isPtBr = locale === "pt-BR";

    const executiveSummary = leadingLabel
      ? (
          isPtBr
            ? `A síntese estruturada identificou como hipótese principal: ${leadingLabel}.`
            : `The structured synthesis identified the leading hypothesis as: ${leadingLabel}.`
        )
      : templates.noHypothesis;

    const morphologicInterpretation = morphology
      ? (
          isPtBr
            ? `A avaliação morfológica foi sintetizada com classe de risco ${morphology.riskClass || "não especificada"}${morphology.patternRecognition ? ` e padrão descrito como ${morphology.patternRecognition}` : ""}.`
            : `Morphologic assessment was synthesized with risk class ${morphology.riskClass || "unspecified"}${morphology.patternRecognition ? ` and pattern described as ${morphology.patternRecognition}` : ""}.`
        )
      : templates.noMorphology;

    const leadingEvidence =
      evidence?.leading || null;

    const leadingScore = scoreText(
      leadingEvidence?.normalizedScore,
    );

    const diagnosticReasoning = leadingLabel
      ? (
          isPtBr
            ? `A hipótese foi priorizada a partir da integração entre classificação, critérios, evidências e recomendações estruturadas.`
            : `The hypothesis was prioritized through integration of classification, criteria, evidence, and structured recommendations.`
        )
      : templates.noHypothesis;

    const evidenceInterpretation = evidence
      ? (
          isPtBr
            ? `Foram consolidados ${evidence.total} resultado(s) de evidência: ${evidence.supported} favorável(is), ${evidence.opposed} contrário(s), ${evidence.conflicted} conflitante(s) e ${evidence.abstained} com abstenção.${leadingScore ? ` O maior escore normalizado foi ${leadingScore}.` : ""}`
            : `${evidence.total} evidence result(s) were consolidated: ${evidence.supported} supportive, ${evidence.opposed} opposing, ${evidence.conflicted} conflicted, and ${evidence.abstained} abstained.${leadingScore ? ` The highest normalized score was ${leadingScore}.` : ""}`
        )
      : templates.noEvidence;

    const classificationInterpretation =
      this.policy.includeClassification
        ? (
            classification
              ? (
                  isPtBr
                    ? `A classificação selecionada foi ${hypothesisLabel(classification) || "não nomeada"}, preservando a versão e a rastreabilidade do motor classificatório.`
                    : `The selected classification was ${hypothesisLabel(classification) || "unnamed"}, preserving versioning and classification traceability.`
                )
              : templates.noClassification
          )
        : "";

    const conflictCount =
      synthesis.conflicts?.length || 0;

    const conflictInterpretation =
      conflictCount > 0
        ? (
            isPtBr
              ? `Foram identificados ${conflictCount} conflito(s) estruturado(s), exigindo revisão especializada antes de qualquer conclusão.`
              : `${conflictCount} structured conflict(s) were identified, requiring specialist review before any conclusion.`
          )
        : (
            isPtBr
              ? "Não foram registrados conflitos estruturados relevantes na síntese."
              : "No relevant structured conflicts were recorded in the synthesis."
          );

    const recommendationNarrative =
      this.policy.includeRecommendations
        ? (
            recommendations
              ? (
                  isPtBr
                    ? `Foram consolidadas ${recommendations.total} recomendação(ões), com prioridade máxima ${recommendations.highestPriority || "não definida"}.`
                    : `${recommendations.total} recommendation(s) were consolidated, with highest priority ${recommendations.highestPriority || "undefined"}.`
                )
              : templates.noRecommendations
          )
        : "";

    const limitations = [];

    if (!leadingLabel) {
      limitations.push(
        isPtBr
          ? "Ausência de hipótese principal estruturada."
          : "No structured leading hypothesis.",
      );
    }

    if (!classification) {
      limitations.push(
        isPtBr
          ? "Classificação estruturada não selecionada."
          : "No structured classification selected.",
      );
    }

    if (!evidence || evidence.total === 0) {
      limitations.push(
        isPtBr
          ? "Evidência quantitativa ausente ou insuficiente."
          : "Quantitative evidence was absent or insufficient.",
      );
    }

    if (conflictCount > 0) {
      limitations.push(
        isPtBr
          ? "Conflitos estruturados permanecem não resolvidos."
          : "Structured conflicts remain unresolved.",
      );
    }

    if (synthesis.alerts?.length > 0) {
      limitations.push(
        isPtBr
          ? "Há alertas clínico-laboratoriais que exigem correlação."
          : "Clinical-laboratory alerts require correlation.",
      );
    }

    if (synthesis.requiresHumanReview) {
      limitations.push(templates.review);
    }

    if (synthesis.automationBlocked) {
      limitations.push(templates.blocked);
    }

    const limitedLimitations =
      limitations.slice(
        0,
        this.policy.maximumLimitations,
      );

    const conclusionParts = [
      executiveSummary,
      conflictInterpretation,
    ];

    if (synthesis.requiresHumanReview) {
      conclusionParts.push(templates.review);
    }

    if (synthesis.automationBlocked) {
      conclusionParts.push(templates.blocked);
    }

    const conclusion =
      conclusionParts.join(" ");

    const sections = Object.freeze([
      Object.freeze({
        id: "executive-summary",
        title:
          isPtBr
            ? "Resumo executivo"
            : "Executive summary",
        content: executiveSummary,
      }),
      Object.freeze({
        id: "morphology",
        title:
          isPtBr
            ? "Interpretação morfológica"
            : "Morphologic interpretation",
        content: morphologicInterpretation,
      }),
      Object.freeze({
        id: "reasoning",
        title:
          isPtBr
            ? "Raciocínio diagnóstico"
            : "Diagnostic reasoning",
        content: diagnosticReasoning,
      }),
      Object.freeze({
        id: "evidence",
        title:
          isPtBr
            ? "Interpretação das evidências"
            : "Evidence interpretation",
        content: evidenceInterpretation,
      }),
      Object.freeze({
        id: "classification",
        title:
          isPtBr
            ? "Interpretação classificatória"
            : "Classification interpretation",
        content: classificationInterpretation,
      }),
      Object.freeze({
        id: "conflicts",
        title:
          isPtBr
            ? "Conflitos e segurança"
            : "Conflicts and safety",
        content: conflictInterpretation,
      }),
      Object.freeze({
        id: "recommendations",
        title:
          isPtBr
            ? "Recomendações"
            : "Recommendations",
        content: recommendationNarrative,
      }),
    ]);

    return createDiagnosticNarrativeResult({
      caseId: synthesis.caseId,
      title: templates.title,
      executiveSummary,
      morphologicInterpretation,
      diagnosticReasoning,
      evidenceInterpretation,
      classificationInterpretation,
      conflictInterpretation,
      recommendationNarrative,
      limitations: limitedLimitations,
      conclusion,
      sections,
      requiresHumanReview:
        synthesis.requiresHumanReview === true ||
        (
          conflictCount > 0 &&
          this.policy.requireHumanReviewOnConflict
        ) ||
        (
          synthesis.status === "ABSTAINED" &&
          this.policy.requireHumanReviewOnAbstention
        ),
      automationBlocked:
        synthesis.automationBlocked === true,
      createdAt:
        this.clock().toISOString(),
      metadata: {
        engineVersion:
          DIAGNOSTIC_NARRATIVE_INTELLIGENCE_ENGINE_VERSION,
        locale,
        audience: context.audience,
      },
    });
  }
}
