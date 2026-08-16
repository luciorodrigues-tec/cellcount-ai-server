// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.35 — MARROW POSITIVE CYTOLOGY CONSISTENCY & ACQUISITION
// DISCORDANCE RECOVERY
// ============================================================================
//
// Purpose:
// - preserve the epistemic middle state where repeated immature marrow cells
//   carry >=1 acquired blast-associated cytologic feature, but the acquisition
//   does not establish a coherent/distinct blastoid subpopulation;
// - never convert one isolated cytologic feature into a positive blast call;
// - never allow that unresolved discordance to collapse directly into a
//   physiologic precursor classification before focal discrimination.
// ============================================================================

export const MARROW_POSITIVE_CYTOLOGY_CONSISTENCY_VERSION = "BE-FIX-005.35";
export const MARROW_ACQUISITION_DISCORDANCE_RECOVERY_VERSION = "BE-FIX-005.35";

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
function txt(v){return typeof v==="string"?v.trim():"";}
function upper(v){return txt(v).toUpperCase();}
function finite(...values){
  for(const v of values){const n=Number(v);if(Number.isFinite(n))return n;}
  return null;
}
function marrowScope(result={}){
  const raw=obj(result.rawResponse);
  const t=upper(result.specimenType||obj(result.specimenAssessment).specimenType||
    obj(raw.specimenAssessment).specimenType);
  return t.includes("BONE_MARROW")||t.includes("MEDULA")||
    Object.keys(obj(result.marrowAdequacy)).length>0||
    Object.keys(obj(raw.marrowAdequacy)).length>0;
}

export function evaluateMarrowPositiveCytologyDiscordance(result={}){
  const raw=obj(result.rawResponse);
  const vme=obj(result.visualMorphologyEvidenceAcquisition||raw.visualMorphologyEvidenceAcquisition);
  const vmeRecovery=obj(vme.immatureCellCytologyRecovery);
  const acquired=obj(vme.acquiredDomains);
  const assessment={...obj(raw.blastAssessment),...obj(result.blastAssessment)};
  const cyt=obj(assessment.immatureCellCytology);
  const support=obj(assessment.morphologySupport);
  const sub=obj(assessment.blastoidSubpopulationContext);

  const immatureCount=finite(
    vmeRecovery.approximateImmatureCellCount,
    assessment.approximateImmatureCellCount,
    assessment.approximateImmatureCellCountInProvidedFields
  );
  const multipleImmature =
    vmeRecovery.multipleImmatureCells===true ||
    (immatureCount!==null&&immatureCount>=3);
  const repeatedImmature =
    vmeRecovery.repeatedImmatureCells===true ||
    acquired.narrativeMentionsRepeatedImmature===true ||
    cyt.repeatedSubsetAcrossField===true ||
    sub.repeatedSubsetAcrossField===true ||
    sub.repeatedCellsWithSimilarFeatures===true ||
    support.repeatedAcrossField===true;

  const cytology=[
    cyt.highNCRatio ?? support.highNCRatio,
    cyt.openFineChromatin ?? support.openFineChromatin,
    cyt.nucleoli ?? support.nucleoli,
    cyt.scantBasophilicCytoplasm ?? support.scantBasophilicCytoplasm,
  ];
  const characterizedCytologyCount=finite(
    vmeRecovery.characterizedBlastCytologyCount,
    cytology.filter(v=>typeof v==="boolean").length
  ) ?? 0;
  const positiveCytologyCount=finite(
    vmeRecovery.positiveBlastCytologyCount,
    cytology.filter(v=>v===true).length
  ) ?? 0;

  const narrativeStructuredDiscordance =
    acquired.narrativeStructuredDiscordance===true;
  const structuredRepeat =
    acquired.structuredRepeat===true ||
    cyt.repeatedSubsetAcrossField===true ||
    sub.repeatedSubsetAcrossField===true ||
    support.repeatedAcrossField===true;
  const coherentSubset =
    cyt.morphologicallyCoherent===true ||
    sub.morphologicallyCoherent===true ||
    sub.coherentBlastoidSubsetObserved===true;
  const distinctSubset =
    cyt.distinctFromMaturationContinuum===true ||
    sub.distinctFromMaturationContinuum===true;
  const positiveState=[
    "OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION"
  ].includes(upper(assessment.evidenceState));
  const physiologicContinuumLock =
    obj(result.marrowPhysiologicMaturationContinuumLock).active===true;
  const structuredPositive =
    !physiologicContinuumLock &&
    (
      positiveState ||
      obj(result.marrowPositiveBlastEvidenceLock).active===true ||
      obj(result.marrowRecoveredCytologyProjection).structuredPositive===true
    );

  // Narrow 005.35 state: there is acquired positive cytology in a repeated
  // immature population, but not enough architecture to call blasts.
  const unresolvedPositiveCytology =
    marrowScope(result) &&
    multipleImmature &&
    repeatedImmature &&
    positiveCytologyCount>=1 &&
    !physiologicContinuumLock &&
    !structuredPositive &&
    (!structuredRepeat || !coherentSubset || !distinctSubset ||
      narrativeStructuredDiscordance);

  return {
    version:MARROW_POSITIVE_CYTOLOGY_CONSISTENCY_VERSION,
    marrow:marrowScope(result),
    immatureCount,multipleImmature,repeatedImmature,
    characterizedCytologyCount,positiveCytologyCount,
    narrativeStructuredDiscordance,structuredRepeat,
    coherentSubset,distinctSubset,physiologicContinuumLock,structuredPositive,
    unresolvedPositiveCytology,
    state:unresolvedPositiveCytology
      ?"UNRESOLVED_BLASTOID_CYTOLOGY"
      :structuredPositive
        ?"STRUCTURED_POSITIVE_EVIDENCE"
        :"NO_POSITIVE_CYTOLOGY_DISCORDANCE",
  };
}

export function applyMarrowPositiveCytologyConsistency(result={}){
  if(!result||typeof result!=="object")return result;
  const e=evaluateMarrowPositiveCytologyDiscordance(result);
  if(!e.marrow)return result;

  result.marrowPositiveCytologyConsistency=e;
  if(!e.unresolvedPositiveCytology)return result;

  const a=obj(result.blastAssessment);
  const prior=upper(a.evidenceState);

  // Zero is not a valid resolution of an unresolved positive-cytology state.
  if(a.approximateBlastLikeCells===0)a.approximateBlastLikeCells=null;
  if(a.approximateBlastLikeCellCountInProvidedFields===0)
    a.approximateBlastLikeCellCountInProvidedFields=null;

  a.candidateEvidenceState="UNRESOLVED_BLASTOID_CYTOLOGY";
  a.cytologyRecoveryRequired=true;
  a.cytologyResolutionRequired=true;
  a.globalAbsenceAllowed=false;

  // Preserve indeterminacy; do not fabricate OBSERVED/SUSPICIOUS population.
  if(["","NOT_ASSESSABLE","NOT_OBSERVED_IN_EVALUABLE_FIELD"].includes(prior)){
    a.evidenceState="UNRESOLVED_BLASTOID_CYTOLOGY";
  }

  a.summary=[
    txt(a.summary),
    "BE-FIX-005.35: há sinal citológico blastoide adquirido em população imatura repetida, porém sem arquitetura suficiente para afirmar população blastoide distinta/coerente. O achado permanece indeterminado e requer discriminação citológica focal; não converter para ausência de blastos nem para positividade blastoide automática."
  ].filter(Boolean).join(" ");

  result.blastAssessment=a;
  result.marrowPositiveCytologyConsistency={
    ...e,
    active:true,
    priorEvidenceState:prior||null,
    finalEvidenceState:a.evidenceState,
    positiveCytologyPreserved:true,
    positiveBlastPopulationFabricated:false,
    physiologicAutoCollapseBlocked:true,
    requiresCytologyResolution:true,
  };
  result.requiresHumanReview=true;
  result.normalityBlocked=true;
  return result;
}
export default applyMarrowPositiveCytologyConsistency;
