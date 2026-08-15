export const MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION = "BE-FIX-005.33";
export const MARROW_BLASTOID_CANDIDATE_PRESERVATION_VERSION = "BE-FIX-005.33";

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
  const support=obj(assessment.morphologySupport);
  const subpopulation=obj(assessment.blastoidSubpopulationContext);
  const immatureCount=finite(assessment.approximateImmatureCellCount);
  const blastLikeCount=finite(assessment.approximateBlastLikeCells);
  const burden=text(assessment.immatureCellBurden).toLowerCase();
  const distribution=text(assessment.spatialDistribution).toLowerCase();
  const multipleImmature=(immatureCount!==null&&immatureCount>=3)||["multiple","numerous","increased"].includes(burden);
  const repeatedImmature=distribution.includes("repeated")||distribution.includes("across_field")||
    support.repeatedAcrossField===true||subpopulation.repeatedSubsetAcrossField===true;
  const cytology=[support.highNCRatio,support.openFineChromatin,support.nucleoli,support.scantBasophilicCytoplasm];
  const characterizedCytologyCount=cytology.filter(v=>typeof v==="boolean").length;
  const positiveCytologyCount=cytology.filter(v=>v===true).length;
  const architecture=[
    subpopulation.distinctFromMaturationContinuum,
    subpopulation.morphologicallyCoherent,
    subpopulation.repeatedSubsetAcrossField,
    subpopulation.disproportionateImmatureSubset,
  ];
  const characterizedArchitectureCount=architecture.filter(v=>typeof v==="boolean").length;
  const positiveEvidenceState=["OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION"].includes(upper(assessment.evidenceState));
  const directPositiveProtected=positiveEvidenceState||assessment.observed===true||
    (blastLikeCount!==null&&blastLikeCount>=1)||positiveCytologyCount>=2;
  const uncharacterizedCytology=multipleImmature&&characterizedCytologyCount<=1&&positiveCytologyCount===0;
  const unresolvedCandidate=marrow&&multipleImmature&&repeatedImmature&&uncharacterizedCytology&&!directPositiveProtected;
  return {
    version:MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION,marrow,immatureCount,blastLikeCount,
    immatureCellBurden:burden||null,spatialDistribution:distribution||null,multipleImmature,repeatedImmature,
    characterizedCytologyCount,characterizedArchitectureCount,positiveCytologyCount,uncharacterizedCytology,
    directPositiveProtected,unresolvedCandidate,
    candidateState:unresolvedCandidate?"IMMATURE_POPULATION_REQUIRES_DISCRIMINATION":null
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
  if(prior==="NOT_OBSERVED_IN_EVALUABLE_FIELD"||prior==="NOT_ASSESSABLE"||!prior){
    a.evidenceState="IMMATURE_POPULATION_REQUIRES_DISCRIMINATION";
  }
  a.summary=[text(a.summary),
    "BE-FIX-005.33: múltiplas células imaturas repetidas permanecem como população candidata indeterminada porque a citologia blastoide discriminativa não foi suficientemente caracterizada. Não promover para blastos e não reduzir automaticamente a padrão fisiológico até discriminação focal."
  ].filter(Boolean).join(" ");
  result.blastAssessment=a;
  result.marrowImmatureCellCytologyRecovery={...e,active:true,priorEvidenceState:prior||null,
    finalEvidenceState:a.evidenceState,candidatePreserved:true,positiveBlastEvidenceFabricated:false};
  return result;
}
export default applyMarrowImmatureCellCytologyRecovery;
