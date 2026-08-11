// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.4 — FIELD-SCOPED NEGATIVE FINDINGS
// NEGATIVE FINDINGS SCOPE ENGINE V1
//
// PRINCIPLE
// ---------
// NOT_OBSERVED_IN_EVALUABLE_FIELD != ABSENT_IN_SPECIMEN
//
// Negative morphology statements are observations about the analyzed field.
// They must never be promoted to global exclusion when representativity is
// limited or globalNegativeExclusionAllowed is false.
// ============================================================================

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

const DEFINITIONS = Object.freeze({
  blasts: Object.freeze({
    positiveFlags: ["blastSuspicion"],
    label: "Blastos inequívocos",
  }),
  auerRods: Object.freeze({
    positiveFlags: ["auerRods", "auerRodObserved"],
    label: "Bastonetes de Auer",
  }),
  immatureCells: Object.freeze({
    positiveFlags: ["immatureCells"],
    label: "Células imaturas críticas",
  }),
  schistocytes: Object.freeze({
    positiveFlags: ["schistocytes", "schistocyteSuspicion"],
    label: "Esquizócitos clinicamente relevantes",
  }),
  hemoparasites: Object.freeze({
    positiveFlags: [
      "parasiteSuspected",
      "hemoparasiteSuspected",
      "plasmodiumSuspected",
    ],
    label: "Hemoparasitas",
  }),
  plateletAggregates: Object.freeze({
    positiveFlags: ["plateletAggregates", "plateletAggregation"],
    label: "Agregados plaquetários",
  }),
});

function readFlag(result, flag) {
  const findings = asObject(result.findings);
  const local = asObject(result.localMorphologyEvidence);
  const critical = asObject(local.criticalMorphology);
  const raw = asObject(result.rawResponse);
  const rawPositive = asObject(raw.positiveFindings);

  return (
    findings[flag] === true ||
    critical[flag] === true ||
    rawPositive[flag] === true ||
    raw[flag] === true
  );
}

function positiveObserved(result, definition) {
  return definition.positiveFlags.some((flag) => readFlag(result, flag));
}

function isLimitedField(result = {}) {
  const field = asObject(result.fieldAdequacy);
  const adequacy = asObject(result.adequacyAssessment);
  const governance = asObject(result.evidenceGovernance);

  return (
    field.limitedField === true ||
    field.adequateForPopulationAssessment === false ||
    field.populationInferenceAllowed === false ||
    field.globalNegativeExclusionAllowed === false ||
    adequacy.classification === "LIMITED_FIELD" ||
    adequacy.globalNegativeExclusionAllowed === false ||
    governance.limitedField === true ||
    governance.globalNegativeExclusionAllowed === false ||
    result.finalClassification === "CLASS_1_LIMITED_FIELD" ||
    result.morphologicRiskClass === "CLASS_1_LIMITED_FIELD"
  );
}

function evidenceAvailable(result = {}) {
  const local = asObject(result.localMorphologyEvidence);
  if (local.evidenceAvailable === true) return true;
  if (local.evidenceAvailable === false) return false;

  return Boolean(
    local.field ||
      local.erythrocytes ||
      local.leukocytes ||
      local.platelets,
  );
}

function scopedSentence(label) {
  return `${label} não identificados entre os elementos suficientemente avaliáveis neste campo. Esta observação não permite exclusão global na lâmina.`;
}

function notAssessableSentence(label) {
  return `${label}: não avaliáveis com segurança neste campo.`;
}

function positiveSentence(label) {
  return `${label}: achado positivo/suspeito no campo analisado; não converter em achado negativo.`;
}

function buildStatus(result, key, definition) {
  if (positiveObserved(result, definition)) {
    return {
      key,
      label: definition.label,
      status: "OBSERVED_OR_SUSPECTED",
      scope: "FIELD",
      globalExclusionAllowed: false,
      statement: positiveSentence(definition.label),
    };
  }

  if (!evidenceAvailable(result)) {
    return {
      key,
      label: definition.label,
      status: "NOT_ASSESSABLE",
      scope: "FIELD",
      globalExclusionAllowed: false,
      statement: notAssessableSentence(definition.label),
    };
  }

  return {
    key,
    label: definition.label,
    status: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    scope: "FIELD",
    globalExclusionAllowed: false,
    statement: scopedSentence(definition.label),
  };
}

function replaceUnsafeNegativeLanguage(value = "", statuses = []) {
  let text = String(value || "");
  if (!text.trim()) return text;

  const replacements = [
    [
      /blastos inequ[ií]vocos n[aã]o evidenciados/gi,
      statuses.find((item) => item.key === "blasts")?.statement,
    ],
    [
      /popula[cç][aã]o bl[aá]stica significativa n[aã]o evidenciada/gi,
      statuses.find((item) => item.key === "blasts")?.statement,
    ],
    [
      /bastonetes? de auer n[aã]o (?:claramente )?(?:identificados|evidenciados)/gi,
      statuses.find((item) => item.key === "auerRods")?.statement,
    ],
    [
      /c[eé]lulas imaturas cr[ií]ticas n[aã]o evidenciadas/gi,
      statuses.find((item) => item.key === "immatureCells")?.statement,
    ],
    [
      /esquiz[oó]citos clinicamente relevantes n[aã]o evidenciados/gi,
      statuses.find((item) => item.key === "schistocytes")?.statement,
    ],
    [
      /hemoparasitas? n[aã]o (?:identificados|evidenciados|observados)/gi,
      statuses.find((item) => item.key === "hemoparasites")?.statement,
    ],
    [
      /agregados plaquet[aá]rios n[aã]o evidenciados/gi,
      statuses.find((item) => item.key === "plateletAggregates")?.statement,
    ],
  ];

  for (const [pattern, replacement] of replacements) {
    if (replacement) text = text.replace(pattern, replacement);
  }

  return text;
}

function sanitizeNegativeNarratives(obj, statuses, protectedKeys = new Set()) {
  if (!obj || typeof obj !== "object") return;

  for (const key of Object.keys(obj)) {
    if (protectedKeys.has(key)) continue;

    const value = obj[key];

    if (typeof value === "string") {
      obj[key] = replaceUnsafeNegativeLanguage(value, statuses);
    } else if (Array.isArray(value)) {
      obj[key] = value.map((item) =>
        typeof item === "string"
          ? replaceUnsafeNegativeLanguage(item, statuses)
          : item,
      );
    } else if (value && typeof value === "object") {
      sanitizeNegativeNarratives(value, statuses, protectedKeys);
    }
  }
}

export function applyFieldScopedNegativeFindings(result = {}) {
  if (!result || typeof result !== "object") return result;

  const limitedField = isLimitedField(result);

  // In BE-FIX-005.4 all negative observations remain field-scoped.
  // Adequate fields may later receive a separate validated population-level
  // exclusion contract, but this engine never creates global absence claims.
  const statuses = Object.entries(DEFINITIONS).map(([key, definition]) =>
    buildStatus(result, key, definition),
  );

  const negativeOnly = statuses.filter(
    (item) =>
      item.status === "NOT_OBSERVED_IN_EVALUABLE_FIELD" ||
      item.status === "NOT_ASSESSABLE",
  );

  result.negativeFindingScope = {
    contractVersion: "NFS-1.0",
    limitedField,
    rule:
      "NOT_OBSERVED_IN_EVALUABLE_FIELD != ABSENT_IN_SPECIMEN",
    globalNegativeExclusionAllowed: false,
    // FA-005.12.1 — presentation-level qualifier. The legacy per-item
    // qualifier remains intact for BE-FIX-005.5.3 contract compatibility.
    globalQualifier:
      "A não identificação desses elementos no campo analisado não permite excluir sua presença em outras áreas da lâmina.",
    items: statuses,
  };

  result.negativeFindingsStructured = negativeOnly.map(
    (item) => item.statement,
  );

  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.whatAISees = asObject(result.whatAISees);

  result.morphologyAnalysis.negativeFindings =
    [...result.negativeFindingsStructured];

  result.morphologyAnalysis.absentFindings =
    result.negativeFindingsStructured.join("\n");

  result.whatAISees.negativeFindingsStructured =
    [...result.negativeFindingsStructured];

  result.whatAISees.negativeFindings =
    result.negativeFindingsStructured.join("\n");

  // Sanitize legacy unsafe wording everywhere except the canonical local
  // evidence namespaces, which remain read-only.
  sanitizeNegativeNarratives(
    result,
    statuses,
    new Set([
      "localMorphologyEvidence",
      "observedMorphology",
      "academicInterpretation",
    ]),
  );

  return result;
}

export default applyFieldScopedNegativeFindings;
