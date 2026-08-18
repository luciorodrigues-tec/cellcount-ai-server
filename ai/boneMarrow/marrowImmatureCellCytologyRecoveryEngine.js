export const MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION = "BE-FIX-005.33";
export const MARROW_BLASTOID_CANDIDATE_PRESERVATION_VERSION = "BE-FIX-005.33";
export const MARROW_CROSS_PASS_IMMATURE_CYTOMORPHOLOGY_RECOVERY_VERSION = "BE-FIX-005.50.15";
export const MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_RECOVERY_VERSION = "BE-FIX-005.50.15.1";
export const MARROW_RECOVERED_IMMATURE_CARDINALITY_UNRESOLVED_LOCK_VERSION = "BE-FIX-005.50.15.1";
export const MARROW_SEMANTIC_UNRESOLVED_IMMATURITY_PROPAGATION_VERSION = "BE-FIX-005.50.15.3";
export const MARROW_CELL_LEVEL_CYTOMORPHOLOGY_RECOVERY_VERSION = "BE-FIX-005.50.16";
export const MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_PRESERVATION_VERSION = "BE-FIX-005.50.16";

function obj(v){return v&&typeof v==="object"&&!Array.isArray(v)?v:{};}
function text(v){return typeof v==="string"?v.trim():"";}
function finite(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function upper(v){return text(v).toUpperCase();}

export function evaluateMarrowImmatureCellCytologyGap(result = {}) {
  const raw=obj(result.rawResponse);
  const specimenType=upper(result.specimenType||obj(raw.specimenAssessment).specimenType||obj(result.specimenAssessment).specimenType);
  const marrow=specimenType.includes("BONE_MARROW")||specimenType.includes("MEDULA")||
    Object.keys(obj(result.marrowAdequacy)).length>0||Object.keys(obj(raw.marrowAdequacy)).length>0;
  const assessment={...obj(raw.blastAssessment),...obj(result.blastAssessment)};
  const crossPass=obj(
    result.marrowCrossPassImmatureCytomorphologyEvidence ||
    raw.marrowCrossPassImmatureCytomorphologyEvidence
  );
  const support=obj(assessment.morphologySupport);
  const cytology=obj(assessment.immatureCellCytology);
  const subpopulation=obj(assessment.blastoidSubpopulationContext);
  const immatureCount=finite(
    assessment.approximateImmatureCellCount ??
    assessment.approximateImmatureCellCountInProvidedFields
  );
  const blastLikeCount=finite(
    assessment.approximateBlastLikeCells ??
    assessment.approximateBlastLikeCellCountInProvidedFields ??
    assessment.approximateBlastLikeCellCount
  );
  const burden=text(assessment.immatureCellBurden).toLowerCase();
  const distribution=text(assessment.spatialDistribution).toLowerCase();
  const crossPassMaximumImmatureCount=finite(
    crossPass.maximumImmatureCellCount
  );
  const multipleImmature=
    crossPass.multipleImmatureAnyPass===true ||
    crossPass.recoveredMultipleUncharacterizedImmaturity===true ||
    (crossPassMaximumImmatureCount!==null&&crossPassMaximumImmatureCount>=3) ||
    (immatureCount!==null&&immatureCount>=3) ||
    ["multiple","numerous","dominant","increased"].includes(burden);
  const repeatedImmature=
    crossPass.repeatedImmatureAnyPass===true ||
    distribution.includes("repeated")||distribution.includes("across_field")||
    text(assessment.populationPattern).toLowerCase().includes("repeated")||
    support.repeatedAcrossField===true||subpopulation.repeatedSubsetAcrossField===true||
    subpopulation.repeatedCellsWithSimilarFeatures===true||
    cytology.repeatedSubsetAcrossField===true;
  const cytologySignals=[
    cytology.highNCRatio ?? support.highNCRatio,
    cytology.openFineChromatin ?? support.openFineChromatin,
    cytology.nucleoli ?? support.nucleoli,
    cytology.scantBasophilicCytoplasm ?? support.scantBasophilicCytoplasm
  ];
  const characterizedCytologyCount=cytologySignals.filter(v=>typeof v==="boolean").length;
  const positiveCytologyCount=cytologySignals.filter(v=>v===true).length;
  const architecture=[
    subpopulation.distinctFromMaturationContinuum,
    subpopulation.morphologicallyCoherent,
    subpopulation.repeatedSubsetAcrossField,
    subpopulation.disproportionateImmatureSubset,
  ];
  const characterizedArchitectureCount=architecture.filter(v=>typeof v==="boolean").length;
  const evidenceState=upper(assessment.evidenceState);
  const positiveEvidenceState=["OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION"].includes(evidenceState)||
    evidenceState.includes("POSITIVE")||evidenceState.includes("BLASTLIKECELLS");
  const directPositiveProtected=
    crossPass.positiveEvidenceStatePreserved===true ||
    positiveEvidenceState ||
    assessment.observed===true ||
    (blastLikeCount!==null&&blastLikeCount>=1) ||
    positiveCytologyCount>=2;
  const vme=obj(result.visualMorphologyEvidenceAcquisition);
  const vmeRecovery=obj(vme.immatureCellCytologyRecovery);
  const cellLevelUnresolvedImmaturity =
    vmeRecovery.cellLevelUnresolvedImmaturity===true ||
    vmeRecovery.cellLevelCytomorphologyState==="UNRESOLVED_IMMATURE";
  const semanticUnresolvedImmaturity =
    cellLevelUnresolvedImmaturity ||
    crossPass.semanticUnresolvedImmaturity===true ||
    crossPass.unresolvedEvidenceStatePreserved===true ||
    crossPass.recoveredMultipleUncharacterizedImmaturity===true;
  const crossPassUnresolvedSemantic = semanticUnresolvedImmaturity;

  const uncharacterizedCytology=
    multipleImmature &&
    characterizedCytologyCount<=1 &&
    positiveCytologyCount===0;

  // BE-FIX-005.50.15.1 — if a valid stability repair recovers several immature
  // cells but cannot characterize their discriminative cytology, preserve an
  // unresolved candidate even when repetition could not be established.
  // This is non-promotional and does not create blast positivity.
  const unresolvedCandidate=
    marrow &&
    !directPositiveProtected &&
    (
      (multipleImmature && uncharacterizedCytology && (repeatedImmature || crossPassUnresolvedSemantic)) ||
      cellLevelUnresolvedImmaturity
    );
  return {
    version:MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION,marrow,immatureCount,blastLikeCount,
    immatureCellBurden:burden||null,spatialDistribution:distribution||null,multipleImmature,repeatedImmature,
    characterizedCytologyCount,characterizedArchitectureCount,positiveCytologyCount,uncharacterizedCytology,
    directPositiveProtected,unresolvedCandidate,
    crossPassRecoveryVersion:
      MARROW_CROSS_PASS_IMMATURE_CYTOMORPHOLOGY_RECOVERY_VERSION,
    unresolvedImmaturitySemanticRecoveryVersion:
      MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_RECOVERY_VERSION,
    recoveredImmatureCardinalityUnresolvedLockVersion:
      MARROW_RECOVERED_IMMATURE_CARDINALITY_UNRESOLVED_LOCK_VERSION,
    crossPassEvidenceAvailable:Object.keys(crossPass).length>0,
    crossPassMaximumImmatureCount,
    crossPassUnresolvedSemantic,
    semanticUnresolvedImmaturity,
    semanticUnresolvedImmaturityPropagationVersion:
      MARROW_SEMANTIC_UNRESOLVED_IMMATURITY_PROPAGATION_VERSION,
    cellLevelCytomorphologyRecoveryVersion: MARROW_CELL_LEVEL_CYTOMORPHOLOGY_RECOVERY_VERSION,
    cellLevelUnresolvedImmaturityPreservationVersion: MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_PRESERVATION_VERSION,
    cellLevelUnresolvedImmaturity,
    candidateState:unresolvedCandidate?(cellLevelUnresolvedImmaturity?"FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY":"IMMATURE_POPULATION_REQUIRES_DISCRIMINATION"):null
  };
}

export function applyMarrowImmatureCellCytologyRecovery(result = {}) {
  if(!result||typeof result!=="object")return result;
  const e=evaluateMarrowImmatureCellCytologyGap(result);
  if(!e.marrow)return result;
  result.marrowImmatureCellCytologyRecovery=e;
  result.blastAssessment=obj(result.blastAssessment);
  if(!e.unresolvedCandidate)return result;
  const a=result.blastAssessment;
  const prior=upper(a.evidenceState);
  if(a.approximateBlastLikeCells===0)a.approximateBlastLikeCells=null;
  a.candidateEvidenceState="IMMATURE_POPULATION_REQUIRES_DISCRIMINATION";
  a.cytologyRecoveryRequired=true;
  a.globalAbsenceAllowed=false;
  if(
    prior==="NOT_OBSERVED_IN_EVALUABLE_FIELD" ||
    prior==="NOT_ASSESSABLE" ||
    prior==="LIMITEDMORPHOLOGICEVIDENCE" ||
    prior==="LIMITED_MORPHOLOGIC_EVIDENCE" ||
    !prior
  ){
    a.evidenceState=e.cellLevelUnresolvedImmaturity
      ? "FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY"
      : "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION";
  }
  a.summary=[text(a.summary),
    e.cellLevelUnresolvedImmaturity
      ? "BE-FIX-005.50.16: há imaturidade celular visível em campo rico em precursores, mas a citomorfologia discriminativa permaneceu não resolvida após reobservação focal. Preservar candidato focal indeterminado; não promover para população blastoide e não reduzir automaticamente a padrão fisiológico."
      : "BE-FIX-005.33: múltiplas células imaturas repetidas permanecem como população candidata indeterminada porque a citologia blastoide discriminativa não foi suficientemente caracterizada. Não promover para blastos e não reduzir automaticamente a padrão fisiológico até discriminação focal."
  ].filter(Boolean).join(" ");
  result.blastAssessment=a;
  result.marrowImmatureCellCytologyRecovery={...e,active:true,priorEvidenceState:prior||null,
    finalEvidenceState:a.evidenceState,candidatePreserved:true,positiveBlastEvidenceFabricated:false};
  return result;
}
export default applyMarrowImmatureCellCytologyRecovery;
