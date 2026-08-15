// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.32 — ASSESSABILITY-CONSISTENT NEGATIVE FINDINGS &
// MARROW FINAL RESULT COHERENCE
// ============================================================================

export const MARROW_FINAL_RESULT_COHERENCE_VERSION = "BE-FIX-005.32";
export const ASSESSABILITY_CONSISTENT_NEGATIVE_FINDINGS_VERSION = "BE-FIX-005.32";

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asArray(value) {
  return Array.isArray(value) ? value : [];
}
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
function uniqueStrings(values = []) {
  return [...new Set(values.map((v) => String(v || "").trim()).filter(Boolean))];
}
function status(value) {
  return String(value || "").trim().toUpperCase();
}
function hasPositiveAssessment(assessment = {}) {
  const s = String(assessment?.status || "").trim().toLowerCase();
  return s === "present" || s === "observed" ||
    assessment?.observed === true || assessment?.suspected === true;
}
function collectPositiveItems(result = {}) {
  const raw = asObject(result.rawResponse);
  const out = [];
  const sources = [
    result.positiveFindings,
    asObject(raw.positiveFindings).items,
    raw.positiveFindings,
    asObject(raw.whatAISees).positiveFindings,
    asObject(raw.observedMorphology).positiveEvidence,
  ];
  for (const src of sources) {
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === "object" && Array.isArray(src.items)) out.push(...src.items);
  }
  if (String(raw.myeloidSeries?.status || "").toLowerCase() === "present") {
    out.push(text(raw.myeloidSeries?.summary));
  }
  if (String(raw.erythroidSeries?.status || "").toLowerCase() === "present") {
    out.push(text(raw.erythroidSeries?.summary));
  }
  if (String(raw.megakaryocyticSeries?.status || "").toLowerCase() === "present") {
    out.push(text(raw.megakaryocyticSeries?.summary));
  }
  return uniqueStrings(out);
}
function blastAssessabilityState(result = {}) {
  const lme = asObject(result.localMorphologyEvidence);
  const critical = asObject(lme.criticalMorphology);
  const field = asObject(result.fieldAdequacy);
  const assessability = asObject(field.blastAssessability);
  return status(
    result.findings?.blastEvidenceState ||
    critical.blastLikeMorphology ||
    assessability.state ||
    result.rawResponse?.blastAssessment?.evidenceState
  );
}
function scrubNotAssessableBlastNegatives(result = {}) {
  const blastState = blastAssessabilityState(result);
  if (blastState !== "NOT_ASSESSABLE") return { blastState, scrubbed: false };

  const patterns = [
    /blastos? inequ[ií]vocos? n[aã]o (?:identificados|evidenciados|observados)/i,
    /popula[cç][aã]o bl[aá]stica significativa n[aã]o (?:estabelecida|identificada|evidenciada|observada)/i,
    /c[eé]lulas? imaturas? cr[ií]ticas? n[aã]o (?:identificadas|evidenciadas|observadas)/i,
    /aus[eê]ncia de blastos?/i,
  ];
  const remove = (v) => patterns.some((p) => p.test(String(v || "")));

  result.negativeFindingsStructured = asArray(result.negativeFindingsStructured).filter((x) => !remove(x));
  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.whatAISees = asObject(result.whatAISees);

  if (Array.isArray(result.morphologyAnalysis.negativeFindings)) {
    result.morphologyAnalysis.negativeFindings =
      result.morphologyAnalysis.negativeFindings.filter((x) => !remove(x));
  }

  const qualifier =
    "Blastos/células imaturas: não avaliáveis com segurança para exclusão neste campo; não converter não visualização em ausência.";

  const remaining = uniqueStrings([...result.negativeFindingsStructured, qualifier]);
  result.negativeFindingsStructured = remaining;
  result.morphologyAnalysis.negativeFindings = [...remaining];
  result.morphologyAnalysis.absentFindings = remaining.join("\n");
  result.whatAISees.negativeFindingsStructured = [...remaining];
  result.whatAISees.negativeFindings = remaining.join("\n");

  return { blastState, scrubbed: true };
}
function removeUnsupportedSuspicionReasons(result = {}) {
  const raw = asObject(result.rawResponse);
  const dysplasiaPositive =
    hasPositiveAssessment(result.dysplasiaAssessment) ||
    hasPositiveAssessment(raw.dysplasiaAssessment);
  const infiltrationPositive =
    hasPositiveAssessment(result.infiltrationAssessment) ||
    hasPositiveAssessment(raw.infiltrationAssessment);

  result.blockNormalReason = uniqueStrings(asArray(result.blockNormalReason).filter((reason) => {
    const n = String(reason || "").toLowerCase().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (!dysplasiaPositive &&
        (n.includes("sinais possiveis de displasia") ||
         n.includes("possivel displasia") ||
         n.includes("sinal de displasia"))) return false;
    if (!infiltrationPositive &&
        (n.includes("sinal possivel de infiltracao") ||
         n.includes("possivel infiltracao") ||
         (n.includes("populacao anormal") && n.includes("infiltr")))) return false;
    return true;
  }));

  return { dysplasiaPositive, infiltrationPositive };
}

export function applyMarrowFinalResultCoherence(result = {}) {
  if (!result || typeof result !== "object") return result;

  const specimen = String(
    result.specimenType ||
    result.rawResponse?.specimenAssessment?.specimenType ||
    result.visualMorphologyEvidenceAcquisition?.specimenScope ||
    "",
  ).toUpperCase();

  const marrowLike =
    specimen.includes("BONE_MARROW") ||
    specimen.includes("MEDULA") ||
    result.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.marrowLike === true;

  if (!marrowLike) return result;

  result.findings = asObject(result.findings);
  result.morphologyAnalysis = asObject(result.morphologyAnalysis);
  result.whatAISees = asObject(result.whatAISees);

  const negative = scrubNotAssessableBlastNegatives(result);
  const disease = removeUnsupportedSuspicionReasons(result);

  result.positiveFindings = collectPositiveItems(result);
  result.whatAISees.positiveFindings = [...result.positiveFindings];

  const blastPositive =
    result.findings.blastSuspicion === true ||
    ["OBSERVED", "OBSERVED_POPULATION", "SUSPICIOUS_INDETERMINATE", "SUSPICIOUS_POPULATION"]
      .includes(status(result.findings.blastEvidenceState)) ||
    result.marrowPositiveBlastEvidencePreservation?.active === true;

  if (blastPositive) {
    result.requiresHumanReview = true;
    result.normalityBlocked = true;
  }

  result.marrowFinalResultCoherence = {
    version: MARROW_FINAL_RESULT_COHERENCE_VERSION,
    assessabilityConsistentNegativeFindingsVersion:
      ASSESSABILITY_CONSISTENT_NEGATIVE_FINDINGS_VERSION,
    blastEvidenceState: negative.blastState || null,
    blastNegativeScrubbedForNotAssessable: negative.scrubbed,
    positiveFindingsPreserved: result.positiveFindings.length,
    unsupportedDysplasiaSuspicionRemoved: disease.dysplasiaPositive !== true,
    unsupportedInfiltrationSuspicionRemoved: disease.infiltrationPositive !== true,
    truePositiveBlastPathProtected: blastPositive,
    preserves00529: true,
    preserves00530: true,
    preserves00531: true,
  };

  return result;
}

export default applyMarrowFinalResultCoherence;
