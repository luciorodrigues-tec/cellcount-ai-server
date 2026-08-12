// ============================================================================
// CELLCOUNT HEMATOLOGY ENTERPRISE
// CRA-001.1 — Expert Hematology Narrative Projection
//
// Narrative is downstream of truth. It cannot create or upgrade evidence.
// ============================================================================

import {
  ClinicalEvidenceState,
  ClinicalSeverity,
} from "./clinicalEvidenceState.js";

function compact(value) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function unique(values = []) {
  return [...new Set(
    values.map(compact).filter(Boolean)
  )];
}

function qualityStatement(truth) {
  const q = truth.quality || {};
  const scope = truth.scope || {};

  if (q.visualAcquisitionComplete === false) {
    return "A aquisição de evidência visual foi incompleta; a interpretação deve permanecer indeterminada e requer revisão humana.";
  }

  if (scope.limitedField === true) {
    return "O campo analisado tem representatividade limitada para inferências populacionais e exclusões globais; os achados morfológicos diretamente observados permanecem válidos no escopo local.";
  }

  return "O campo é utilizável para descrição morfológica no escopo informado, mantendo-se a necessidade de correlação com a lâmina completa e os dados hematimétricos.";
}

export function buildExpertHematologyNarrative(truth = {}, source = {}) {
  const blast = truth.criticalFindings?.blastLike;
  const parasite = truth.parasiteArtifact?.parasite;
  const reactive = truth.patternInterpretation?.reactiveLymphoid;
  const mono = truth.patternInterpretation?.mononucleosisPattern;

  const priorityFindings = [];

  if (blast?.state === ClinicalEvidenceState.OBSERVED) {
    priorityFindings.push(
      "Sinal blástico/blastoide identificado no campo analisado. Por segurança, um único elemento positivo é suficiente para acionar revisão hematológica prioritária; a imagem isolada não define linhagem nem diagnóstico.",
    );
  } else if (blast?.state === ClinicalEvidenceState.NOT_ASSESSABLE) {
    priorityFindings.push(
      "A pesquisa de elementos blásticos não é suficientemente avaliável neste material/campo; não deve ser exibida como ausência.",
    );
  }

  if (parasite?.state === ClinicalEvidenceState.OBSERVED) {
    priorityFindings.push(
      "Há evidência estruturada positiva de forma parasitária no campo analisado, devendo ser confirmada por revisão microscópica e método laboratorial apropriado.",
    );
  } else if (
    truth.parasiteArtifact?.unusualStructureObserved === true &&
    truth.parasiteArtifact?.artifactLikelihood === "FAVORED"
  ) {
    priorityFindings.push(
      "Foi observada estrutura incomum com características favorecendo artefato técnico/óptico; não há base estruturada para promovê-la a hemoparasita.",
    );
  }

  if (reactive?.supported === true) {
    priorityFindings.push(
      mono?.supported === true
        ? "Há padrão linfoide reacional sustentado; eventual correlação com síndrome mononucleósica permanece hipótese educacional dependente de dados clínico-laboratoriais."
        : "Há padrão linfoide reacional sustentado por evidência morfológica, sem inferência etiológica específica.",
    );
  }

  const wbc = compact(truth.lineages?.leukocytes?.description);
  const rbc = compact(truth.lineages?.erythrocytes?.description);
  const plt = compact(truth.lineages?.platelets?.description);

  let executiveSynthesis = "";
  if (truth.risk?.severity === ClinicalSeverity.CRITICAL) {
    executiveSynthesis =
      "Achado morfológico crítico no campo analisado, com necessidade de revisão hematológica prioritária. A classificação final permanece limitada à evidência visual e não constitui diagnóstico etiológico.";
  } else if (priorityFindings.length > 0) {
    executiveSynthesis =
      "O campo apresenta achados morfológicos que requerem interpretação dirigida, preservando a distinção entre evidência positiva, ausência restrita ao campo e elementos não avaliáveis.";
  } else if (truth.scope?.limitedField === true) {
    executiveSynthesis =
      "Avaliação morfológica de campo limitado: a descrição celular local é preservada, mas não há suporte para generalização populacional ou afirmação de normalidade global.";
  } else {
    executiveSynthesis =
      "Avaliação morfológica estruturada do campo analisado, sem promoção de achados além da evidência visual disponível.";
  }

  const integratedInterpretation = unique([
    priorityFindings[0],
    truth.scope?.limitedField === true
      ? "A representatividade restringe inferências sobre frequência e distribuição dos achados na lâmina."
      : "",
    truth.patternInterpretation?.clonalityConcern?.supported === true
      ? "Há preocupação morfológica populacional que exige revisão especializada; a imagem isolada não estabelece clonalidade."
      : "",
  ]).join(" ");

  const nextSteps = unique([
    truth.review?.required === true
      ? "Revisão microscópica por profissional habilitado."
      : "",
    "Correlação com hemograma completo e contagem diferencial.",
    truth.scope?.limitedField === true
      ? "Avaliação de múltiplos campos representativos da lâmina."
      : "",
    blast?.state === ClinicalEvidenceState.OBSERVED
      ? "Considerar investigação hematológica complementar conforme revisão profissional, incluindo imunofenotipagem quando indicada."
      : "",
    parasite?.state === ClinicalEvidenceState.OBSERVED
      ? "Confirmar a suspeita parasitária com metodologia laboratorial apropriada."
      : "",
  ]);

  return {
    executiveSynthesis,
    priorityFindings: unique(priorityFindings),
    leukocyteMorphology: wbc,
    erythrocyteMorphology: rbc,
    plateletMorphology: plt,
    integratedInterpretation,
    qualityAndConfidence: qualityStatement(truth),
    recommendedNextSteps: nextSteps,
  };
}
