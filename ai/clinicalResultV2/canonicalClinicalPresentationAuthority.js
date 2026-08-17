// BE/FE-FIX-005.50.8 — Canonical Clinical Narrative Deduplication & Information Hierarchy
export const CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION = "BE-FIX-005.50.8";

const text = (v) => (typeof v === "string" ? v.trim() : "");
const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

function norm(v) {
  return text(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function sameMeaning(a, b) {
  const x = norm(a); const y = norm(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const xs = new Set(x.split(" ").filter((w) => w.length > 3));
  const ys = new Set(y.split(" ").filter((w) => w.length > 3));
  if (!xs.size || !ys.size) return false;
  let common = 0; for (const w of xs) if (ys.has(w)) common++;
  return common / Math.min(xs.size, ys.size) >= 0.72;
}
function firstUnique(candidates, used = []) {
  for (const candidate of candidates) {
    const value = text(candidate);
    if (!value) continue;
    if (used.some((u) => sameMeaning(value, u))) continue;
    return value;
  }
  return "";
}
function blastState(v2) { return text(v2?.criticalFindings?.blastLike?.state).toUpperCase(); }

export function buildCanonicalClinicalPresentation(result = {}) {
  const v2 = obj(result.clinicalResultV2);
  const presentation = obj(v2.presentation);
  const criticality = obj(presentation.clinicalCriticality);
  const severity = text(criticality.level || v2.risk?.severity || result.clinicalCriticality?.level).toUpperCase();
  const blast = blastState(v2);
  const blastPositive = blast === "OBSERVED" || blast === "SUSPICIOUS_INDETERMINATE";
  const polychromasia = v2.lineages?.erythrocytes?.positiveMorphology?.polychromasia === true;
  const limited = v2.scope?.limitedField === true || result.fieldAdequacy?.limitedField === true;

  let title = "Análise hematológica";
  let subtitle = "Resultado morfológico disponível para revisão.";
  if (blastPositive) {
    title = "Suspeita blástica / blastoide";
    subtitle = blast === "OBSERVED"
      ? "Achado morfológico prioritário — revisão hematológica urgente."
      : "Achado morfológico prioritário — revisão hematológica recomendada.";
  } else if (severity === "CRITICAL") {
    title = "Alerta hematológico de criticidade muito alta";
    subtitle = "Revisão hematológica prioritária.";
  } else if (severity === "HIGH") {
    title = "Achado hematológico de alta criticidade";
    subtitle = "Revisão hematológica prioritária.";
  }

  const positiveFindings = [];
  if (blastPositive) {
    positiveFindings.push({
      key: "focal_blastoid_immaturity",
      domain: "LEUKOCYTE",
      label: "Imaturidade / blastoidia focal",
      description: firstUnique([
        result.morphologyAnalysis?.cellMorphology?.focalHematopoieticCell?.summary,
        v2.criticalFindings?.blastLike?.evidence?.[0],
        result.morphologyAnalysis?.leukocyteReview,
      ]) || "Célula hematopoiética focal com características de imaturidade/blastoidia.",
      findingSeverity: blast === "OBSERVED" ? "CRITICAL" : "HIGH",
      presentationAuthority: "PRIMARY_POSITIVE",
    });
  }
  if (polychromasia) {
    positiveFindings.push({
      key: "polychromasia",
      domain: "ERYTHROCYTE",
      label: "Policromasia",
      description: "Policromasia presente no campo avaliado.",
      findingSeverity: "MORPHOLOGIC_POSITIVE",
      presentationAuthority: "POSITIVE_FINDING",
    });
  }

  const used = [title, subtitle, ...positiveFindings.map((f) => f.description)];
  const interpretation = firstUnique([
    blastPositive && limited
      ? "A morfologia focal sustenta suspeição de imaturidade/blastoidia, mas a representatividade do campo não permite inferência populacional nem classificação diagnóstica pela imagem isolada."
      : "",
    result.interpretiveSynthesis,
    result.morphologyAnalysis?.biologicalInterpretation,
    result.clinicalMeaning,
  ], used);
  if (interpretation) used.push(interpretation);

  const limitation = limited
    ? "Campo de representatividade limitada; achados não visualizados não podem ser excluídos globalmente."
    : firstUnique(arr(v2.quality?.limitations), used);
  if (limitation) used.push(limitation);

  const recommendation = firstUnique([
    result.structuredReport?.recommendation,
    blastPositive ? "Revisão microscópica de múltiplos campos e correlação com hemograma e dados clínicos." : "",
    result.recommendation,
  ], used) || (v2.review?.required === true
    ? "Correlacionar com hemograma, múltiplos campos e revisão microscópica profissional."
    : "");

  return {
    contractVersion: CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    headline: {
      title,
      subtitle,
      criticality: severity || "NONE",
      requiresHumanReview: v2.review?.required === true || result.requiresHumanReview === true,
    },
    positiveFindings,
    interpretation,
    limitation,
    recommendation,
    presentationPolicy: {
      singleHeadline: true,
      singleInterpretation: true,
      singleLimitation: true,
      singleRecommendation: true,
      findingSeverityIndependentFromGlobalCriticality: true,
      legacyFieldsRetainedForCompatibility: true,
    },
    provenance: {
      source: "clinicalResultV2",
      craVersion: v2.provenance?.craVersion || "CRA-001.1",
      authorityVersion: CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    },
  };
}

export function applyCanonicalClinicalPresentationAuthority(result = {}) {
  if (!result || typeof result !== "object") return result;
  const clinicalPresentation = buildCanonicalClinicalPresentation(result);
  result.clinicalPresentation = clinicalPresentation;
  if (result.clinicalResultV2 && typeof result.clinicalResultV2 === "object") {
    result.clinicalResultV2.presentation = {
      ...(result.clinicalResultV2.presentation || {}),
      canonical: clinicalPresentation,
      canonicalClinicalPresentationAuthorityVersion: CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
    };
  }
  return result;
}
