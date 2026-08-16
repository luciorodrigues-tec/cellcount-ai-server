// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.34 — MARROW RECOVERED CYTOLOGY PROJECTION & POSITIVE BLAST-EVIDENCE E2E LOCK
// ============================================================================
export const MARROW_RECOVERED_CYTOLOGY_PROJECTION_VERSION = "BE-FIX-005.34";
export const MARROW_POSITIVE_BLAST_E2E_LOCK_VERSION = "BE-FIX-005.34";

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
function txt(v){return typeof v==="string"?v.trim():"";}
function up(v){return txt(v).toUpperCase();}
function num(...values){
  for(const v of values){const n=Number(v);if(Number.isFinite(n))return n;}
  return null;
}
function bool(...values){
  for(const v of values){if(typeof v==="boolean")return v;}
  return null;
}
function positiveState(v){
  const s=up(v);
  return ["OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION",
    "LIMITEDBUTPOSITIVEFORIMMATUREBLASTLIKECELLS",
    "LIMITED_BUT_POSITIVE_FOR_IMMATURE_BLAST_LIKE_CELLS",
    "POSITIVE_EVIDENCE_PRESERVED"].includes(s.replace(/\s+/g,"_")) ||
    s.includes("POSITIVE") || s.includes("BLASTLIKECELLS");
}
function marrowScope(result={}){
  const raw=obj(result.rawResponse);
  const t=up(result.specimenType||obj(result.specimenAssessment).specimenType||
    obj(raw.specimenAssessment).specimenType);
  return t.includes("BONE_MARROW")||t.includes("MEDULA")||
    Object.keys(obj(result.marrowAdequacy)).length>0||
    Object.keys(obj(raw.marrowAdequacy)).length>0;
}

export function readRecoveredMarrowBlastEvidence(result={}){
  const raw=obj(result.rawResponse);
  const direct=obj(result.blastAssessment);
  const rawBlast=obj(raw.blastAssessment);
  const b=Object.keys(direct).length?direct:rawBlast;
  const cyt=obj(b.immatureCellCytology);
  const support=obj(b.morphologySupport);
  const sub=obj(b.blastoidSubpopulationContext);

  const blastLikeCount=num(
    b.approximateBlastLikeCells,
    b.approximateBlastLikeCellCountInProvidedFields,
    b.approximateBlastLikeCellCount,
    rawBlast.approximateBlastLikeCells,
    rawBlast.approximateBlastLikeCellCountInProvidedFields,
  );
  const immatureCount=num(
    b.approximateImmatureCellCount,
    b.approximateImmatureCellCountInProvidedFields,
    rawBlast.approximateImmatureCellCount,
  );
  const highNCRatio=bool(cyt.highNCRatio,support.highNCRatio);
  const openFineChromatin=bool(cyt.openFineChromatin,support.openFineChromatin);
  const nucleoli=bool(cyt.nucleoli,support.nucleoli);
  const scantBasophilicCytoplasm=bool(cyt.scantBasophilicCytoplasm,support.scantBasophilicCytoplasm);
  const morphologicallyCoherent=bool(cyt.morphologicallyCoherent,sub.morphologicallyCoherent,sub.coherentBlastoidSubsetObserved);
  const repeatedSubsetAcrossField=bool(cyt.repeatedSubsetAcrossField,sub.repeatedSubsetAcrossField,sub.repeatedCellsWithSimilarFeatures);
  const distinctFromMaturationContinuum=bool(cyt.distinctFromMaturationContinuum,sub.distinctFromMaturationContinuum);

  const cytology=[highNCRatio,openFineChromatin,nucleoli,scantBasophilicCytoplasm];
  const positiveCytologyCount=cytology.filter(v=>v===true).length;
  const characterizedCytologyCount=cytology.filter(v=>typeof v==="boolean").length;
  const featureCount=num(b.morphologicFeatureCount,b.morphologicalFeatureCount,positiveCytologyCount);
  const repeatedPattern=
    repeatedSubsetAcrossField===true ||
    up(b.populationPattern).includes("REPEATED") ||
    up(b.spatialDistribution).includes("REPEATED") ||
    up(b.spatialDistribution).includes("ACROSS_FIELD");
  const coherentSubset=morphologicallyCoherent===true ||
    sub.coherentBlastoidSubsetObserved===true;
  const structuredPositive =
    positiveState(b.evidenceState) ||
    (blastLikeCount!==null&&blastLikeCount>=1&&positiveCytologyCount>=2) ||
    (blastLikeCount!==null&&blastLikeCount>=1&&featureCount!==null&&featureCount>=2&&repeatedPattern) ||
    (positiveCytologyCount>=3&&repeatedPattern&&coherentSubset);

  return {
    version:MARROW_RECOVERED_CYTOLOGY_PROJECTION_VERSION,
    marrow:marrowScope(result),
    evidenceState:b.evidenceState||null,
    blastLikeCount,immatureCount,featureCount,
    highNCRatio,openFineChromatin,nucleoli,scantBasophilicCytoplasm,
    morphologicallyCoherent,repeatedSubsetAcrossField,distinctFromMaturationContinuum,
    positiveCytologyCount,characterizedCytologyCount,repeatedPattern,coherentSubset,
    structuredPositive,
  };
}

export function applyMarrowRecoveredCytologyProjection(result={}){
  if(!result||typeof result!=="object")return result;
  const e=readRecoveredMarrowBlastEvidence(result);
  if(!e.marrow)return result;
  result.marrowRecoveredCytologyProjection=e;
  if(!e.structuredPositive)return result;

  const a=obj(result.blastAssessment);
  a.approximateBlastLikeCells=e.blastLikeCount ?? a.approximateBlastLikeCells ?? null;
  a.approximateBlastLikeCellCountInProvidedFields=
    e.blastLikeCount ?? a.approximateBlastLikeCellCountInProvidedFields ?? null;
  a.morphologySupport={
    ...obj(a.morphologySupport),
    highNCRatio:e.highNCRatio,
    openFineChromatin:e.openFineChromatin,
    nucleoli:e.nucleoli,
    scantBasophilicCytoplasm:e.scantBasophilicCytoplasm,
    repeatedAcrossField:e.repeatedPattern,
  };
  a.blastoidSubpopulationContext={
    ...obj(a.blastoidSubpopulationContext),
    morphologicallyCoherent:e.morphologicallyCoherent,
    repeatedSubsetAcrossField:e.repeatedPattern,
    distinctFromMaturationContinuum:e.distinctFromMaturationContinuum,
    coherentBlastoidSubsetObserved:e.coherentSubset,
    repeatedCellsWithSimilarFeatures:e.repeatedPattern,
  };
  if(!positiveState(a.evidenceState)){
    a.evidenceState="SUSPICIOUS_POPULATION";
  }
  a.observed=true;
  a.globalAbsenceAllowed=false;
  a.positiveEvidenceLock={
    version:MARROW_POSITIVE_BLAST_E2E_LOCK_VERSION,
    active:true,
    source:"RECOVERED_STRUCTURED_IMMATURE_CELL_CYTOLOGY",
    fieldAdequacyScope:"NEGATIVE_EXCLUSION_ONLY",
  };
  result.blastAssessment=a;
  result.findings={...obj(result.findings),immatureCells:true,blastSuspicion:true};
  result.marrowPositiveBlastEvidenceLock={
    version:MARROW_POSITIVE_BLAST_E2E_LOCK_VERSION,
    active:true,
    positiveEvidencePresent:true,
    positiveEvidencePreserved:true,
    blastLikeCount:e.blastLikeCount,
    positiveCytologyCount:e.positiveCytologyCount,
    repeatedPattern:e.repeatedPattern,
    coherentSubset:e.coherentSubset,
  };
  result.requiresHumanReview=true;
  result.normalityBlocked=true;
  return result;
}
export default applyMarrowRecoveredCytologyProjection;
