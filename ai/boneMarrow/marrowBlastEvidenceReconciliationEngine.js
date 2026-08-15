// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.28 — MARROW BLAST EVIDENCE ACQUISITION REINFORCEMENT
// & NARRATIVE-TO-STRUCTURED EVIDENCE RECONCILIATION
// ============================================================================

export const MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION = "BE-FIX-005.28";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function txt(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(txt).filter(Boolean).join(" ");
  return "";
}

function norm(value) {
  return txt(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text, patterns = []) {
  return patterns.some((pattern) => pattern.test(text));
}

function collectMarrowNarrative(result = {}) {
  const blast = obj(result.blastAssessment);
  const myeloid = obj(result.myeloidSeries);
  const visual = obj(result.visualExtraction);
  const sees = obj(result.whatAISees);
  const morphology = obj(result.morphologyAnalysis);
  const raw = obj(result.rawResponse);
  const rawBlast = obj(raw.blastAssessment);
  const rawMyeloid = obj(raw.myeloidSeries);
  const rawSees = obj(raw.whatAISees);
  const rawMorph = obj(raw.morphologyAnalysis);

  return norm([
    blast.summary,
    myeloid.summary,
    myeloid.maturation,
    visual.summary,
    sees.globalField,
    sees.leukocytes,
    sees.dominantFinding,
    sees.freeNarrative,
    morphology.overview,
    morphology.leukocyteReview,
    morphology.summary,
    rawBlast.summary,
    rawMyeloid.summary,
    rawMyeloid.maturation,
    rawSees.globalField,
    rawSees.leukocytes,
    rawSees.dominantFinding,
    rawSees.freeNarrative,
    rawMorph.overview,
    rawMorph.leukocyteReview,
    rawMorph.summary,
  ].filter(Boolean).join(" "));
}

const SIGNALS = Object.freeze({
  immatureBlastoidPopulation: [
    /multiplas? celulas? (?:imaturas?|blastoides?)/,
    /diversas? celulas? (?:imaturas?|blastoides?)/,
    /celulas? (?:imaturas?|blastoides?) repetid/,
    /populacao (?:imatura|blastoide)/,
    /subpopulacao (?:imatura|blastoide)/,
    /predominio de celulas? imaturas?/,
    /conjunto de celulas? imaturas?/,
  ],
  repeated: [
    /repetid(?:a|as|o|os)/,
    /ao longo do campo/,
    /em diferentes (?:regioes|areas) do campo/,
    /multiplas? celulas? (?:imaturas?|blastoides?)/,
    /diversas? celulas? (?:imaturas?|blastoides?)/,
  ],
  highNC: [
    /relacao n\s*:?\s*c (?:elevada|alta|aumentada)/,
    /alta relacao nucleo.?citoplasma/,
    /elevada relacao nucleo.?citoplasma/,
  ],
  openChromatin: [
    /cromatina (?:fina|aberta|frouxa|delicada|relativamente fina|relativamente aberta)/,
    /cromatina pouco condensada/,
  ],
  nucleoli: [
    /nucleolos? (?:visiveis?|evidentes?|proeminentes?)/,
    /nucleolo (?:visivel|evidente|proeminente)/,
  ],
  basophilicScantCytoplasm: [
    /citoplasma (?:escasso|reduzido|basofilico)/,
    /escasso citoplasma/,
    /citoplasma basofilico/,
  ],
  monomorphism: [
    /monomorf(?:ismo|ica|ico)/,
    /morfologia semelhante entre as celulas/,
    /populacao relativamente uniforme/,
  ],
  distinctSubset: [
    /subpopulacao distinta/,
    /subconjunto distinto/,
    /nao se (?:encaixa|integra) (?:no|ao) continuum maturativo/,
    /separad[ao] do continuum maturativo/,
  ],
  physiologicContinuum: [
    /continu(?:um|idade) maturativ/,
    /maturacao (?:progressiva|ordenada|preservada)/,
    /diferentes estagios maturativos/,
    /formas precursoras? e maduras? coexist/,
    /diversidade maturativa/,
  ],
  explicitNoBlastoidSubset: [
    /sem subpopulacao blastoide/,
    /nao ha subpopulacao blastoide/,
    /nao se identifica subpopulacao blastoide/,
    /ausencia de subpopulacao blastoide/,
  ],
});

function featureEvidence(text) {
  return {
    highNCRatio: hasAny(text, SIGNALS.highNC),
    openFineChromatin: hasAny(text, SIGNALS.openChromatin),
    nucleoli: hasAny(text, SIGNALS.nucleoli),
    scantBasophilicCytoplasm: hasAny(text, SIGNALS.basophilicScantCytoplasm),
    monomorphism: hasAny(text, SIGNALS.monomorphism),
  };
}

function countTrue(objValue = {}) {
  return Object.values(objValue).filter((v) => v === true).length;
}

export function assessMarrowNarrativeStructuredDiscordance(result = {}) {
  const blast = obj(result.blastAssessment);
  const support = obj(blast.morphologySupport);
  const sub = obj(blast.blastoidSubpopulationContext);
  const narrative = collectMarrowNarrative(result);
  const narrativeFeatures = featureEvidence(narrative);

  const populationLanguage = hasAny(narrative, SIGNALS.immatureBlastoidPopulation);
  const repeatedLanguage = hasAny(narrative, SIGNALS.repeated);
  const distinctLanguage = hasAny(narrative, SIGNALS.distinctSubset);
  const physiologicContinuumLanguage = hasAny(narrative, SIGNALS.physiologicContinuum);
  const explicitNoBlastoidSubset = hasAny(narrative, SIGNALS.explicitNoBlastoidSubset);
  const narrativeFeatureCount = countTrue(narrativeFeatures);

  const contradictions = [];
  const compare = [
    ["highNCRatio", support.highNCRatio, narrativeFeatures.highNCRatio],
    ["openFineChromatin", support.openFineChromatin, narrativeFeatures.openFineChromatin],
    ["nucleoli", support.nucleoli, narrativeFeatures.nucleoli],
    ["scantBasophilicCytoplasm", support.scantBasophilicCytoplasm, narrativeFeatures.scantBasophilicCytoplasm],
    ["monomorphism", support.monomorphism, narrativeFeatures.monomorphism],
  ];

  for (const [key, structuredValue, narrativeValue] of compare) {
    if (narrativeValue === true && structuredValue !== true) contradictions.push(key);
  }

  if (populationLanguage && repeatedLanguage && support.repeatedAcrossField !== true) {
    contradictions.push("repeatedAcrossField");
  }

  const strongNarrativeBlastoidEvidence =
    populationLanguage &&
    repeatedLanguage &&
    narrativeFeatureCount >= 2 &&
    explicitNoBlastoidSubset !== true;

  const structuredIsNegativeOrIndeterminate =
    ["", "NOT_ASSESSABLE", "NOT_OBSERVED_IN_EVALUABLE_FIELD", "FOCAL_SUSPICION"]
      .includes(String(blast.evidenceState || "").toUpperCase()) ||
    blast.approximateBlastLikeCells == null;

  const conflict =
    strongNarrativeBlastoidEvidence &&
    (contradictions.length > 0 || structuredIsNegativeOrIndeterminate);

  return {
    version: MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION,
    narrativeAvailable: narrative.length > 0,
    populationLanguage,
    repeatedLanguage,
    distinctLanguage,
    physiologicContinuumLanguage,
    explicitNoBlastoidSubset,
    narrativeFeatures,
    narrativeFeatureCount,
    contradictions: [...new Set(contradictions)],
    acquisitionEvidenceConflict: conflict,
    structuredNarrativeDiscordance: conflict,
    requiresBlastEvidenceReconciliation: conflict,
    strongNarrativeBlastoidEvidence,
  };
}

export function reconcileMarrowBlastEvidence(result = {}) {
  if (!result || typeof result !== "object") return result;

  const output = { ...result };
  output.blastAssessment = { ...obj(result.blastAssessment) };
  output.blastAssessment.morphologySupport = {
    ...obj(output.blastAssessment.morphologySupport),
  };
  output.blastAssessment.blastoidSubpopulationContext = {
    ...obj(output.blastAssessment.blastoidSubpopulationContext),
  };

  const discordance = assessMarrowNarrativeStructuredDiscordance(output);
  output.blastAssessment.evidenceReconciliation = discordance;
  output.marrowBlastEvidenceReconciliation = discordance;

  if (!discordance.requiresBlastEvidenceReconciliation) {
    return output;
  }

  const support = output.blastAssessment.morphologySupport;
  const sub = output.blastAssessment.blastoidSubpopulationContext;
  const nf = discordance.narrativeFeatures;

  // Reconcile only morphology explicitly described in the model's own
  // observation narrative. This is not free-text diagnosis promotion.
  for (const key of [
    "highNCRatio",
    "openFineChromatin",
    "nucleoli",
    "scantBasophilicCytoplasm",
    "monomorphism",
  ]) {
    if (nf[key] === true && support[key] !== true) support[key] = true;
  }

  if (discordance.repeatedLanguage === true) {
    support.repeatedAcrossField = true;
  }

  if (discordance.distinctLanguage === true) {
    sub.distinctFromMaturationContinuum = true;
  } else if (sub.distinctFromMaturationContinuum !== true) {
    // Unknown is safer than a false negative when the narrative and structure
    // conflict. The downstream dual-axis engine still needs architecture plus
    // multiple cytologic criteria before escalation.
    sub.distinctFromMaturationContinuum = null;
  }

  if (discordance.populationLanguage && discordance.repeatedLanguage) {
    if (sub.morphologicallyCoherent !== true && discordance.narrativeFeatureCount >= 2) {
      sub.morphologicallyCoherent = true;
    }
    sub.repeatedSubsetAcrossField = true;
  }

  output.blastAssessment.populationPattern =
    ["dominant", "repeated"].includes(String(output.blastAssessment.populationPattern || "").toLowerCase())
      ? output.blastAssessment.populationPattern
      : "repeated";

  const currentState = String(output.blastAssessment.evidenceState || "NOT_ASSESSABLE").toUpperCase();
  if (!["OBSERVED_POPULATION", "SUSPICIOUS_POPULATION"].includes(currentState)) {
    output.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  }

  output.blastAssessment.acquisitionEvidenceConflict = true;
  output.blastAssessment.structuredNarrativeDiscordance = true;
  output.blastAssessment.requiresBlastEvidenceReconciliation = false;
  output.blastAssessment.reconciledFromObservationNarrative = true;
  output.blastAssessment.reconciliationVersion = MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION;

  return output;
}

export default reconcileMarrowBlastEvidence;
