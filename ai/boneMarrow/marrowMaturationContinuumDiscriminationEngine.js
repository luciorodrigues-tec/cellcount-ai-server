// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.37 — PHYSIOLOGIC MARROW MATURATION CONTINUUM VS PATHOLOGIC
// BLAST POPULATION DISCRIMINATION
// ============================================================================

export const MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION = "BE-FIX-005.37";
export const MARROW_PHYSIOLOGIC_IMMATURITY_CONTAINMENT_VERSION = "BE-FIX-005.37";

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
function txt(v){return typeof v==="string"?v.trim():"";}
function norm(v){return txt(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function countTrue(a){return a.filter(v=>v===true).length;}

function marrowScope(result={}){
  const raw=obj(result.rawResponse);
  const t=txt(
    result.specimenType ||
    obj(result.specimenAssessment).specimenType ||
    obj(raw.specimenAssessment).specimenType
  ).toUpperCase();
  return t.includes("BONE_MARROW")||t.includes("MEDULA")||
    Object.keys(obj(result.marrowAdequacy)).length>0||
    Object.keys(obj(raw.marrowAdequacy)).length>0;
}

function maturationNarrative(result={}){
  const raw=obj(result.rawResponse);
  const my={...obj(raw.myeloidSeries),...obj(result.myeloidSeries)};
  const er={...obj(raw.erythroidSeries),...obj(result.erythroidSeries)};
  const bl={...obj(raw.blastAssessment),...obj(result.blastAssessment)};
  const ctx={...obj(obj(raw.blastAssessment).precursorContext),...obj(bl.precursorContext)};
  return norm([
    my.maturation,my.summary,my.findings,
    er.maturation,er.summary,er.findings,
    ctx.summary,ctx.interpretation,
    bl.summary,bl.morphologicInterpretation
  ].flat(Infinity).filter(Boolean).join(" "));
}

export function evaluateMarrowMaturationContinuum(result={}){
  const raw=obj(result.rawResponse);
  const assessment={...obj(raw.blastAssessment),...obj(result.blastAssessment)};
  const support={...obj(obj(raw.blastAssessment).morphologySupport),...obj(assessment.morphologySupport)};
  const cyt={...obj(obj(raw.blastAssessment).immatureCellCytology),...obj(assessment.immatureCellCytology)};
  const sub={...obj(obj(raw.blastAssessment).blastoidSubpopulationContext),...obj(assessment.blastoidSubpopulationContext)};
  const ctx={...obj(obj(raw.blastAssessment).precursorContext),...obj(assessment.precursorContext)};
  const narrative=maturationNarrative(result);

  const maturationHeterogeneity =
    ctx.maturationHeterogeneity===true ||
    /heterogeneidade maturativa|diversidade maturativa|diferentes estagios|varios estagios|multiplos estagios/.test(narrative);
  const maturationContinuum =
    ctx.maturationContinuum===true ||
    /continuum maturativo|maturacao progressiva|maturacao preservada|maturacao ordenada|maturacao sequencial/.test(narrative);
  const matureFormsPresent =
    ctx.matureFormsPresent===true ||
    /formas maduras|segmentad|metamieloc|mieloc|neutrofil|granulocit/.test(narrative);
  const lineageDiversity =
    ctx.lineageDiversity===true ||
    ((Object.keys(obj(result.myeloidSeries)).length>0 || Object.keys(obj(raw.myeloidSeries)).length>0) &&
     (Object.keys(obj(result.erythroidSeries)).length>0 || Object.keys(obj(raw.erythroidSeries)).length>0));
  const nonMonomorphicBackground =
    ctx.nonMonomorphicBackground===true ||
    support.monomorphism===false ||
    /nao monomorf|sem monomorf|heterogene/.test(narrative);

  const physiologicSignals={
    maturationHeterogeneity,maturationContinuum,matureFormsPresent,
    lineageDiversity,nonMonomorphicBackground,
  };
  const physiologicScore=countTrue(Object.values(physiologicSignals));

  const distinct =
    sub.distinctFromMaturationContinuum===true ||
    cyt.distinctFromMaturationContinuum===true;
  const coherent =
    sub.morphologicallyCoherent===true ||
    sub.coherentBlastoidSubsetObserved===true ||
    cyt.morphologicallyCoherent===true;
  const repeated =
    sub.repeatedSubsetAcrossField===true ||
    sub.repeatedCellsWithSimilarFeatures===true ||
    cyt.repeatedSubsetAcrossField===true ||
    support.repeatedAcrossField===true ||
    ["repeated","dominant"].includes(norm(assessment.populationPattern));
  const monomorphic =
    support.monomorphism===true ||
    /true|partial|monomorfic/.test(norm(cyt.monomorphism));

  const architectureScore=countTrue([distinct,coherent,repeated,monomorphic]);
  const cytologyScore=countTrue([
    cyt.highNCRatio===true||support.highNCRatio===true,
    cyt.openFineChromatin===true||support.openFineChromatin===true,
    cyt.nucleoli===true||support.nucleoli===true,
    cyt.scantBasophilicCytoplasm===true||support.scantBasophilicCytoplasm===true,
  ]);

  const observed =
    assessment.observed===true ||
    txt(assessment.evidenceState).toUpperCase()==="OBSERVED_POPULATION";
  const structuredPathologicSubset =
    observed ||
    (distinct && coherent && repeated && architectureScore>=3);

  const pathologicMaturationContinuumLock =
    obj(result.marrowPathologicMaturationContinuumLock).active===true ||
    obj(obj(result.rawResponse).marrowPathologicMaturationContinuumLock).active===true;

  const strongPhysiologicContinuum =
    marrowScope(result) &&
    physiologicScore>=3 &&
    maturationContinuum &&
    !pathologicMaturationContinuumLock &&
    !structuredPathologicSubset;

  const isolatedImmaturityTraits =
    cytologyScore>0 &&
    architectureScore<3 &&
    !distinct;

  const falseBlastPromotionRisk =
    strongPhysiologicContinuum &&
    isolatedImmaturityTraits &&
    !structuredPathologicSubset;

  return {
    version:MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION,
    marrow:marrowScope(result),
    physiologicSignals,physiologicScore,
    cytologyScore,architectureScore,
    distinctFromMaturationContinuum:distinct,
    morphologicallyCoherent:coherent,
    repeatedSubset:repeated,
    monomorphicSubset:monomorphic,
    observedStructuredPopulation:observed,
    structuredPathologicSubset,
    pathologicMaturationContinuumLock,
    strongPhysiologicContinuum,
    isolatedImmaturityTraits,
    falseBlastPromotionRisk,
    classification:structuredPathologicSubset
      ?"PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED"
      :strongPhysiologicContinuum
        ?"PHYSIOLOGIC_MATURATION_CONTINUUM"
        :"INDETERMINATE_MATURATION_VS_BLASTOID",
  };
}

export function applyMarrowMaturationContinuumDiscrimination(result={}){
  if(!result||typeof result!=="object")return result;
  const e=evaluateMarrowMaturationContinuum(result);
  if(!e.marrow)return result;

  result.marrowMaturationContinuumDiscrimination=e;
  if(!e.falseBlastPromotionRisk)return result;

  const a=obj(result.blastAssessment);
  const prior=txt(a.evidenceState).toUpperCase();

  a.evidenceState="PHYSIOLOGIC_PRECURSOR_PATTERN";
  a.candidateEvidenceState="PHYSIOLOGIC_MATURATION_CONTINUUM";
  a.observed=false;
  a.globalAbsenceAllowed=false;
  a.cytologyResolutionRequired=false;
  a.cytologyRecoveryRequired=false;
  a.positiveEvidenceLock={
    ...obj(a.positiveEvidenceLock),
    active:false,
    suppressedBy:MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION,
  };

  result.blastAssessment=a;
  result.marrowPhysiologicMaturationContinuumLock={
    version:MARROW_PHYSIOLOGIC_IMMATURITY_CONTAINMENT_VERSION,
    active:true,
    priorEvidenceState:prior||null,
    finalEvidenceState:a.evidenceState,
    reason:"Strong heterogeneous marrow maturation continuum without a distinct/coherent/repeated blastoid subpopulation.",
    positiveBlastPopulationSuppressed:true,
    negativeBlastExclusionAllowed:false,
  };

  if(result.marrowPositiveBlastEvidenceLock){
    result.marrowPositiveBlastEvidenceLock={
      ...obj(result.marrowPositiveBlastEvidenceLock),
      active:false,
      positiveEvidencePresent:false,
      positiveEvidencePreserved:false,
      suppressedBy:MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION,
    };
  }

  return result;
}
export default applyMarrowMaturationContinuumDiscrimination;
