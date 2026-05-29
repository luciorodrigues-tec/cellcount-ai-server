// ============================================================================
// CELLCOUNT ENTERPRISE
// BLAST MORPHOLOGY ENGINE V1 HOSPITAL SAFE
// ============================================================================
export function analyzeBlastMorphology(input = {}) {

  const evidenceOnly = {

    visualExtraction:
      input?.visualExtraction || {},

    morphologyAnalysis:
      input?.morphologyAnalysis || {},

    leukocyteFindings:
      input?.leukocyteFindings || {},

    imageQuality:
      input?.imageQuality || {},
  };

  const text =
    normalizeText(

      typeof evidenceOnly === "string"

        ? evidenceOnly

        : JSON.stringify(
            evidenceOnly
          )
    );

  const criteria = {
    highNC: scoreTerms(text, [
      "alta relacao nucleo citoplasma",
      "high n c ratio",
      "high nucleus cytoplasm ratio",
      "nucleo citoplasma elevado",
    ]),

    fineChromatin: scoreTerms(text, [
      "cromatina fina",
      "cromatina frouxa",
      "chromatina frouxa",
      "fine chromatin",
      "open chromatin",
      "delicate chromatin",
    ]),

    nucleoli: hasPositiveFinding(text, [
      "nucleolo",
      "nucleolos",
      "nucleoli",
      "nucleolus",
      "nucleolo evidente",
    ]),

    immatureCell: scoreTerms(text, [
      "celula imatura",
      "celulas imaturas",
      "immature cell",
      "immature cells",
      "morfologia imatura",
      "immature morphology",
    ]),

    absentSegmentation: scoreTerms(text, [
      "ausencia de segmentacao",
      "sem segmentacao",
      "not segmented",
      "absence of segmentation",
    ]),

    scantGranulation: scoreTerms(text, [
      "granulacao ausente",
      "pouca granulacao",
      "agranular",
      "scant granulation",
      "absent granulation",
    ]),

    blastMention: scoreTerms(text, [
      "blasto",
      "blastos",
      "blast",
      "blasts",
      "blastos suspeitos",
      "blast suspicion",
    ]),
  };

  const suppressors = {
    maturePattern: scoreTerms(text, [
      "celulas maduras",
      "neutrofilo maduro",
      "cromatina condensada",
      "mature chromatin",
      "segmented neutrophil",
      "segmentado",
    ]),

    poorImage: scoreTerms(text, [
      "baixa qualidade",
      "desfocado",
      "poor focus",
      "low resolution",
      "artefato",
      "artifact",
      "compressao",
    ]),

    noLeukocytes: scoreTerms(text, [
      "sem leucocitos",
      "ausencia de leucocitos",
      "nao foram observados leucocitos",
      "serie branca nao avaliada",
    ]),
  };

  let rawScore = 0;

  rawScore += criteria.highNC * 16;
  rawScore += criteria.fineChromatin * 18;
  rawScore += criteria.nucleoli * 18;
  rawScore += criteria.immatureCell * 14;
  rawScore += criteria.absentSegmentation * 10;
  rawScore += criteria.scantGranulation * 8;
  rawScore += criteria.blastMention * 8;

  rawScore -= suppressors.maturePattern * 12;
  rawScore -= suppressors.poorImage * 10;
  rawScore -= suppressors.noLeukocytes * 35;

  const morphologyCriteriaCount = [
    criteria.highNC,
    criteria.fineChromatin,
    criteria.nucleoli,
    criteria.immatureCell,
    criteria.absentSegmentation,
  ].filter((v) => v > 0).length;

  if (morphologyCriteriaCount >= 3) rawScore += 18;
  if (morphologyCriteriaCount >= 4) rawScore += 12;

  const confidence = clamp(rawScore);

  let blastRisk = "low";
  let evidenceLevel = "baixa evidência morfológica";

  if (confidence >= 70 && morphologyCriteriaCount >= 3) {
    blastRisk = "high";
    evidenceLevel = "alta evidência morfológica";
  } else if (confidence >= 45 && morphologyCriteriaCount >= 2) {
    blastRisk = "moderate";
    evidenceLevel = "moderada evidência morfológica";
  } else if (confidence >= 25) {
    blastRisk = "minimal";
    evidenceLevel = "baixa evidência morfológica";
  }

  const present =
    blastRisk === "high" ||
    blastRisk === "moderate";

  return {
    engine: "BLAST_MORPHOLOGY_ENGINE_V1",
    present,
    blastRisk,
    confidence,
    evidenceLevel,
    morphologyCriteriaCount,
    criteria,
    suppressors,
    safety: {
      diagnosticConclusionAllowed: false,
      wording:
        present
          ? "Suspeita morfológica de células imaturas; requer revisão hematológica."
          : "Sem sustentação morfológica suficiente para suspeita blástica robusta.",
      requiresHumanReview: present || confidence >= 25,
    },
  };
}

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function scoreTerms(text, terms = []) {
  let score = 0;

  for (const term of terms) {
    const normalized = normalizeText(term);
    if (text.includes(normalized)) {
      score++;
    }
  }

  return score;
}

function clamp(value) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(value) || 0),
    ),
  );
}

function hasPositiveFinding(text, terms = []) {

  const negativePatterns = [

    "nao observado",
    "nao observados",
    "nao observada",
    "nao observadas",

    "não observado",
    "não observados",
    "não observada",
    "não observadas",

    "not observed",
    "absent",
    "ausente",

    "sem evidencia",
    "sem suspeita",
  ];

  for (const term of terms) {

    const normalizedTerm =
      normalizeText(term);

    if (!text.includes(normalizedTerm)) {
      continue;
    }

    const index =
      text.indexOf(normalizedTerm);

    const window =
      text.slice(

        Math.max(0, index - 45),

        index +
        normalizedTerm.length +
        45,
      );

    if (

      negativePatterns.some((negative) =>

        window.includes(
          normalizeText(negative)
        )
      )

    ) {
      continue;
    }

    return 1;
  }

  return 0;
}