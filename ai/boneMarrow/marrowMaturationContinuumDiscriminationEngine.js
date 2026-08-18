// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.37 — PHYSIOLOGIC MARROW MATURATION CONTINUUM VS PATHOLOGIC
// BLAST POPULATION DISCRIMINATION
// ============================================================================

export const MARROW_MATURATION_CONTINUUM_DISCRIMINATION_VERSION = "BE-FIX-005.37";
export const MARROW_PHYSIOLOGIC_IMMATURITY_CONTAINMENT_VERSION = "BE-FIX-005.37";
export const MARROW_MATURATION_EVIDENCE_PROJECTION_VERSION = "BE-FIX-005.41";
export const MARROW_UNRESOLVED_IMMATURE_CANDIDATE_CONTINUUM_SAFETY_GATE_VERSION = "BE-FIX-005.50.14";

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
    my.maturation,my.maturationSpectrum,my.morphologicNotes,my.summary,my.findings,
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
  const my={...obj(raw.myeloidSeries),...obj(result.myeloidSeries)};
  const exp={...obj(obj(raw.myeloidSeries).expansionContext),...obj(my.expansionContext)};
  const structuredMaturationPresent =
    my.maturation===true ||
    ["present","preserved","progressive","orderly","maturing"].includes(norm(my.maturation)) ||
    exp.broadMaturationSpectrum===true ||
    exp.matureNeutrophilicFormsPresent===true ||
    exp.leftShiftedMaturationSpectrum===true ||
    /maturation present|maturacao presente|maturacao granulocit|granulocytic maturation|segmented|band forms|formas maduras|formas em maturacao/.test(narrative);

  const maturationHeterogeneity =
    ctx.maturationHeterogeneity===true ||
    /heterogeneidade maturativa|diversidade maturativa|diferentes estagios|varios estagios|multiplos estagios/.test(narrative);
  const maturationContinuum =
    ctx.maturationContinuum===true ||
    structuredMaturationPresent ||
    /continuum maturativo|maturacao progressiva|maturacao preservada|maturacao ordenada|maturacao sequencial/.test(narrative);
  const matureFormsPresent =
    ctx.matureFormsPresent===true ||
    exp.matureNeutrophilicFormsPresent===true ||
    /formas maduras|segmentad|metamieloc|mieloc|neutrofil|granulocit|band forms/.test(narrative);
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
  const repairArchitectureProvenance = obj(result.marrowRepairEvidenceMerge);
  const repairAttempted =
    obj(result.visualMorphologyEvidenceAcquisition).repairAttempted===true ||
    Object.keys(repairArchitectureProvenance).length>0;
  const singlePassArchitectureCore =
    repairArchitectureProvenance.singlePassArchitectureCore===true;
  const architectureProvenanceQualified =
    !repairAttempted || singlePassArchitectureCore;
  const structuredPathologicSubset =
    observed ||
    (
      architectureProvenanceQualified &&
      distinct && coherent && repeated && architectureScore>=3
    );

  const pathologicMaturationContinuumLock =
    obj(result.marrowPathologicMaturationContinuumLock).active===true ||
    obj(obj(result.rawResponse).marrowPathologicMaturationContinuumLock).active===true;

  // BE-FIX-005.50.14 — unresolved immature-candidate continuum safety gate.
  // A repeated immature population whose discriminative cytology remains
  // uncharacterized after acquisition/repair must not be resolved as
  // physiologic solely because mature forms and a maturation continuum coexist.
  // This gate is deliberately non-promotional: it only preserves indeterminacy.
  const vme=obj(result.visualMorphologyEvidenceAcquisition);
  const vmeRecovery=obj(vme.immatureCellCytologyRecovery);
  const recovery=obj(result.marrowImmatureCellCytologyRecovery);
  const consistency=obj(result.marrowPositiveCytologyConsistency);
  const candidateState=txt(
    assessment.candidateEvidenceState ||
    recovery.candidateState ||
    recovery.finalEvidenceState ||
    consistency.state
  ).toUpperCase();
  const acquisitionRepeatedImmature =
    vmeRecovery.repeatedImmatureCells===true ||
    recovery.repeatedImmature===true;
  const acquisitionMultipleImmature =
    vmeRecovery.multipleImmatureCells===true ||
    recovery.multipleImmature===true;
  const acquiredCharacterizedCytology = Number(
    vmeRecovery.characterizedBlastCytologyCount ??
    recovery.characterizedCytologyCount
  );
  const acquiredPositiveCytology = Number(
    vmeRecovery.positiveBlastCytologyCount ??
    recovery.positiveCytologyCount
  );
  const repairAttemptedForCandidate =
    vme.repairAttempted===true || repairAttempted===true;
  const unresolvedByState =
    candidateState==="IMMATURE_POPULATION_REQUIRES_DISCRIMINATION" ||
    candidateState==="UNRESOLVED_BLASTOID_CYTOLOGY" ||
    assessment.cytologyRecoveryRequired===true ||
    assessment.cytologyResolutionRequired===true ||
    recovery.unresolvedCandidate===true ||
    consistency.unresolvedPositiveCytology===true;
  const unresolvedByAcquisition =
    acquisitionMultipleImmature &&
    acquisitionRepeatedImmature &&
    Number.isFinite(acquiredCharacterizedCytology) &&
    acquiredCharacterizedCytology<=1 &&
    (!Number.isFinite(acquiredPositiveCytology) || acquiredPositiveCytology===0);
  const unresolvedImmatureCandidateAfterAcquisition =
    marrowScope(result) &&
    !observed &&
    !structuredPathologicSubset &&
    (unresolvedByState || unresolvedByAcquisition);

  const strongPhysiologicContinuum =
    marrowScope(result) &&
    physiologicScore>=3 &&
    maturationContinuum &&
    !pathologicMaturationContinuumLock &&
    !structuredPathologicSubset &&
    !unresolvedImmatureCandidateAfterAcquisition;

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
    maturationHeterogeneity,
    maturationContinuum,
    matureFormsPresent,
    physiologicSignals,physiologicScore,
    structuredMaturationPresent,
    maturationEvidenceProjectionVersion:MARROW_MATURATION_EVIDENCE_PROJECTION_VERSION,
    cytologyScore,architectureScore,
    distinctFromMaturationContinuum:distinct,
    morphologicallyCoherent:coherent,
    repeatedSubset:repeated,
    monomorphicSubset:monomorphic,
    observedStructuredPopulation:observed,
    repairArchitectureProvenanceVersion:
      repairArchitectureProvenance.repairArchitectureProvenanceVersion || null,
    repairAttempted,singlePassArchitectureCore,architectureProvenanceQualified,
    structuredPathologicSubset,
    pathologicMaturationContinuumLock,
    unresolvedImmatureCandidateContinuumSafetyGateVersion:
      MARROW_UNRESOLVED_IMMATURE_CANDIDATE_CONTINUUM_SAFETY_GATE_VERSION,
    unresolvedImmatureCandidateAfterAcquisition,
    unresolvedCandidateSignals:{
      candidateState:candidateState||null,
      acquisitionMultipleImmature,
      acquisitionRepeatedImmature,
      acquiredCharacterizedCytology:Number.isFinite(acquiredCharacterizedCytology)?acquiredCharacterizedCytology:null,
      acquiredPositiveCytology:Number.isFinite(acquiredPositiveCytology)?acquiredPositiveCytology:null,
      repairAttempted:repairAttemptedForCandidate,
      unresolvedByState,
      unresolvedByAcquisition,
    },
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
