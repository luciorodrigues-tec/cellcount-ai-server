// ============================================================================
// CELLCOUNT HEMATOLOGY ENTERPRISE
// CRCE-1.3 — CANONICAL PRESENTATION LOCK
//
// Downstream of canonical clinical truth. This module separates:
//   morphologyClass != riskTier != representativity != reviewStatus
// and provides one presentation authority for Flutter and PDF.
// ============================================================================

import {
  ClinicalEvidenceState,
  ClinicalSeverity,
} from "./clinicalEvidenceState.js";

export const CLINICAL_RESULT_COHERENCE_ENGINE_VERSION = "CRCE-1.3";

function clean(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function unique(values = []) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function evidenceLabel(item) {
  switch (item?.state) {
    case ClinicalEvidenceState.OBSERVED:
      return "OBSERVED";
    case ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD:
      return "NOT_OBSERVED_IN_EVALUABLE_FIELD";
    default:
      return "NOT_ASSESSABLE";
  }
}

function morphologyClass(truth) {
  const blast = truth.criticalFindings?.blastLike;
  const parasite = truth.parasiteArtifact?.parasite;
  const reactive = truth.patternInterpretation?.reactiveLymphoid;
  const clonality = truth.patternInterpretation?.clonalityConcern;
  const signals = truth.morphologySignals || {};

  if (blast?.state === ClinicalEvidenceState.OBSERVED) {
    return {
      code: "CRITICAL_BLAST_LIKE_FINDING",
      label: "Achado blástico/blastoide",
      category: "CRITICAL_FINDING",
      severity: ClinicalSeverity.CRITICAL,
    };
  }

  if (parasite?.state === ClinicalEvidenceState.OBSERVED) {
    return {
      code: "STRUCTURED_PARASITE_EVIDENCE",
      label: "Evidência parasitária estruturada",
      category: "CRITICAL_FINDING",
      severity: ClinicalSeverity.HIGH,
    };
  }

  if (clonality?.supported === true) {
    return {
      code: "SUSTAINED_ATYPICAL_POPULATION",
      label: "População mononuclear atípica sustentada",
      category: "POPULATION_PATTERN",
      severity: ClinicalSeverity.HIGH,
    };
  }

  if (reactive?.supported === true) {
    return {
      code: "SUPPORTED_REACTIVE_LYMPHOID_PATTERN",
      label: "Padrão linfoide reacional sustentado",
      category: "POPULATION_PATTERN",
      severity: ClinicalSeverity.REVIEW,
    };
  }

  if (signals.focalMononuclearAtypia === true) {
    return {
      code: "FOCAL_MONONUCLEAR_ATYPIA",
      label: "Atipia mononuclear focal",
      category: "LOCAL_MORPHOLOGY",
      severity: ClinicalSeverity.REVIEW,
    };
  }

  if (truth.scope?.limitedField === true) {
    return {
      code: "LIMITED_FIELD_MORPHOLOGY",
      label: "Morfologia de campo limitado",
      category: "FIELD_SCOPE",
      severity: ClinicalSeverity.REVIEW,
    };
  }

  return {
    code: "FIELD_MORPHOLOGY_ASSESSED",
    label: "Morfologia avaliada no campo analisado",
    category: "FIELD_SCOPE",
    severity: truth.risk?.severity || ClinicalSeverity.NONE,
  };
}

function highestSeverity(truth, morphology) {
  if (morphology.code === "CRITICAL_BLAST_LIKE_FINDING") return ClinicalSeverity.CRITICAL;
  if (
    morphology.code === "STRUCTURED_PARASITE_EVIDENCE" ||
    morphology.code === "SUSTAINED_ATYPICAL_POPULATION"
  ) {
    return ClinicalSeverity.HIGH;
  }

  if (
    truth.review?.required === true ||
    truth.scope?.limitedField === true ||
    morphology.code === "SUPPORTED_REACTIVE_LYMPHOID_PATTERN" ||
    morphology.code === "FOCAL_MONONUCLEAR_ATYPIA"
  ) {
    return ClinicalSeverity.REVIEW;
  }

  return truth.risk?.severity || ClinicalSeverity.NONE;
}

function canonicalRiskBand(severity) {
  switch (severity) {
    case ClinicalSeverity.CRITICAL:
      return {
        level: "CRITICAL",
        label: "Crítico",
        colorToken: "RED",
        priority: 5,
      };
    case ClinicalSeverity.HIGH:
      return {
        level: "HIGH",
        label: "Alto risco",
        colorToken: "ORANGE",
        priority: 4,
      };
    case ClinicalSeverity.INTERMEDIATE:
    case ClinicalSeverity.REVIEW:
    case ClinicalSeverity.INDETERMINATE:
      return {
        level: "REVIEW",
        label: "Atenção / revisão",
        colorToken: "YELLOW",
        priority: 3,
      };
    case ClinicalSeverity.INFORMATIONAL:
      return {
        level: "LOW",
        label: "Baixo risco",
        colorToken: "GREEN",
        priority: 2,
      };
    case ClinicalSeverity.NONE:
    default:
      return {
        level: "NO_ALERT",
        label: "Sem alerta morfológico relevante",
        colorToken: "BLUE",
        priority: 1,
      };
  }
}

function representativity(truth) {
  if (truth.scope?.limitedField === true) {
    return {
      level: "LIMITED",
      label: "Representatividade limitada",
      colorToken: "YELLOW",
      populationInferenceAllowed: false,
    };
  }
  return {
    level: "ADEQUATE_FOR_FIELD_ASSESSMENT",
    label: "Representatividade adequada ao escopo informado",
    colorToken: "BLUE",
    populationInferenceAllowed:
      truth.scope?.populationInferenceAllowed === true,
  };
}

function reviewStatus(truth, riskTier) {
  const required = truth.review?.required === true || riskTier.level !== "NO_ALERT";
  const urgency = truth.review?.urgency || (
    riskTier.level === "CRITICAL" ? "URGENT" :
    riskTier.level === "HIGH" ? "PRIORITY" :
    required ? "RECOMMENDED" : "ROUTINE"
  );

  return {
    required,
    urgency,
    label:
      urgency === "URGENT"
        ? "Revisão urgente"
        : urgency === "PRIORITY"
          ? "Revisão prioritária"
          : required
            ? "Revisão recomendada"
            : "Revisão de rotina",
    colorToken: riskTier.colorToken,
  };
}

function criticalNegatives(truth) {
  const labels = {
    blastLike: "Blastos/blastoides inequívocos",
    auerRods: "Bastonetes de Auer",
    schistocytes: "Esquizócitos clinicamente relevantes",
    parasites: "Hemoparasitas com evidência estruturada",
  };

  const items = [];
  for (const [key, label] of Object.entries(labels)) {
    if (
      truth.criticalFindings?.[key]?.state ===
      ClinicalEvidenceState.NOT_OBSERVED_IN_EVALUABLE_FIELD
    ) {
      items.push(label);
    }
  }
  return items;
}

function lineageProjection(lineage, fallback) {
  const description = clean(lineage?.description);
  return {
    state: evidenceLabel(lineage?.assessment),
    description: description || fallback,
    requiresReview: lineage?.assessment?.requiresReview === true,
  };
}

function canonicalExecutiveConclusion(truth, morphology, riskTier) {
  const limited = truth.scope?.limitedField === true;

  switch (morphology.code) {
    case "CRITICAL_BLAST_LIKE_FINDING":
      return "Sinal blástico/blastoide identificado no campo analisado; revisão hematológica prioritária é necessária, sem atribuição de linhagem pela imagem isolada.";

    case "STRUCTURED_PARASITE_EVIDENCE":
      return "Evidência parasitária estruturada identificada no campo analisado; confirmação microscópica e laboratorial é necessária.";

    case "SUSTAINED_ATYPICAL_POPULATION":
      return "População mononuclear atípica sustentada no material avaliável, requerendo revisão hematológica especializada.";

    case "SUPPORTED_REACTIVE_LYMPHOID_PATTERN":
      return limited
        ? "Padrão linfoide reacional sustentado nos elementos avaliáveis, em campo de representatividade limitada para inferência global."
        : "Padrão linfoide reacional sustentado pela morfologia observada, sem inferência etiológica específica.";

    case "FOCAL_MONONUCLEAR_ATYPIA":
      return limited
        ? "Atipia mononuclear focal em campo de representatividade limitada; caracterização populacional não estabelecida."
        : "Atipia mononuclear focal observada, sem elementos suficientes para caracterizar padrão populacional sustentado.";

    case "LIMITED_FIELD_MORPHOLOGY":
      return "Avaliação morfológica de campo limitado; a descrição celular local é válida, mas não sustenta generalização populacional ou exclusão global.";

    default:
      return riskTier.level === "NO_ALERT"
        ? "Morfologia avaliada no campo analisado, sem alerta morfológico relevante na evidência disponível."
        : "Avaliação morfológica estruturada do campo analisado, com necessidade de correlação e revisão conforme o nível de risco canônico.";
  }
}

function canonicalIntegratedInterpretation(truth, morphology) {
  const limited = truth.scope?.limitedField === true;

  if (morphology.code === "FOCAL_MONONUCLEAR_ATYPIA") {
    return [
      "Foram observados elementos mononucleares aumentados/atípicos no escopo local.",
      "Esse achado focal pode ocorrer em contextos reacionais, mas não estabelece por si só padrão linfoide reacional populacional.",
      limited
        ? "A representatividade do campo é insuficiente para inferir distribuição, frequência ou comportamento populacional na lâmina."
        : "",
    ].filter(Boolean).join(" ");
  }

  if (morphology.code === "SUPPORTED_REACTIVE_LYMPHOID_PATTERN") {
    return "A evidência morfológica sustenta padrão linfoide reacional; a imagem não determina etiologia e requer correlação clínico-laboratorial.";
  }

  if (morphology.code === "CRITICAL_BLAST_LIKE_FINDING") {
    return "A identificação de sinal blástico/blastoide tem prioridade sobre inferências reacionais e exige revisão especializada do esfregaço.";
  }

  if (morphology.code === "STRUCTURED_PARASITE_EVIDENCE") {
    return "A suspeita parasitária decorre exclusivamente de evidência estruturada positiva e não de menções textuais, artefatos ou estruturas incomuns inespecíficas.";
  }

  if (limited) {
    return "Os achados morfológicos positivos permanecem válidos no campo analisado; a representatividade limitada impede extrapolação populacional e exclusões globais.";
  }

  return "A interpretação é restrita à evidência morfológica estruturada disponível, sem promoção além do que foi diretamente sustentado.";
}

export function buildClinicalResultCoherenceProjection(truth = {}, narrative = {}) {
  const morphology = morphologyClass(truth);
  const riskTier = canonicalRiskBand(highestSeverity(truth, morphology));
  const representation = representativity(truth);
  const review = reviewStatus(truth, riskTier);
  const negatives = criticalNegatives(truth);

  const parasite = truth.parasiteArtifact?.parasite;
  const blast = truth.criticalFindings?.blastLike;

  const executiveConclusion =
    canonicalExecutiveConclusion(truth, morphology, riskTier);
  const integratedInterpretation =
    canonicalIntegratedInterpretation(truth, morphology);

  return {
    version: CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
    authority: "CLINICAL_RESULT_V2",

    // CRCE-1.2: semânticas independentes.
    morphologyClass: morphology,
    classification: morphology, // compatibility alias
    riskTier,
    canonicalRisk: riskTier, // compatibility alias
    representativity: representation,
    reviewStatus: review,

    executiveConclusion,
    integratedInterpretation,

    // Narrative compression: priority items stay short and unique.
    priorityFindings: unique([
      ...(narrative.priorityFindings || []),
    ]).slice(0, 3),

    lineages: {
      erythrocytes: lineageProjection(
        truth.lineages?.erythrocytes,
        "Morfologia eritrocitária não suficientemente caracterizada neste campo.",
      ),
      leukocytes: lineageProjection(
        truth.lineages?.leukocytes,
        "Morfologia leucocitária não suficientemente caracterizada neste campo.",
      ),
      platelets: lineageProjection(
        truth.lineages?.platelets,
        "Morfologia plaquetária não suficientemente caracterizada neste campo.",
      ),
    },

    criticalFindings: {
      blastLike: evidenceLabel(blast),
      parasites: evidenceLabel(parasite),
      parasiteSuspicionAllowed:
        truth.parasiteArtifact?.parasiteSuspicionAllowed === true &&
        parasite?.state === ClinicalEvidenceState.OBSERVED,
      artifactLikelihood:
        truth.parasiteArtifact?.artifactLikelihood || "INDETERMINATE",
    },

    patternInterpretation: {
      focalMononuclearAtypia:
        truth.morphologySignals?.focalMononuclearAtypia === true,
      reactiveLymphoidSupported:
        truth.patternInterpretation?.reactiveLymphoid?.supported === true,
      mononucleosisPatternSupported:
        truth.patternInterpretation?.mononucleosisPattern?.supported === true,
      clonalityConcernSupported:
        truth.patternInterpretation?.clonalityConcern?.supported === true,
    },

    scope: {
      limitedField: truth.scope?.limitedField === true,
      populationInferenceAllowed:
        truth.scope?.populationInferenceAllowed === true,
      globalNegativeExclusionAllowed:
        truth.scope?.globalNegativeExclusionAllowed === true,
    },

    criticalNegatives: {
      items: negatives,
      qualifier: negatives.length > 0
        ? "A não identificação desses elementos restringe-se ao campo suficientemente avaliável e não permite exclusão global em outras áreas da lâmina."
        : "",
    },

    // Keep technical quality separated from morphology/risk.
    qualityAndConfidence: clean(narrative.qualityAndConfidence),
    confidence: truth.quality?.confidence ?? 0,

    recommendedNextSteps: unique(narrative.recommendedNextSteps || []).slice(0, 4),
    review: truth.review || {},
  };
}
