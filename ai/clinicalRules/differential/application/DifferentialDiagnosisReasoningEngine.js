import { mergeDifferentialReasoningPolicy } from "../domain/DifferentialReasoningPolicy.js";
export const DIFFERENTIAL_DIAGNOSIS_REASONING_ENGINE_VERSION = "CRR-000007-v1.0.0";
const score=(r,p)=>r?.status==="SUPPORTED"?p.supportScore*Math.max(Number(r.supportRatio||0),0.0001):r?.status==="CONFLICTED"?-p.conflictPenalty:r?.status==="REJECTED"?-p.exclusionPenalty:r?.status==="ABSTAINED"?-p.abstentionPenalty:-p.insufficientEvidencePenalty;
export class DifferentialDiagnosisReasoningEngine {
  constructor({candidateRepository,policy={}}={}) { if(!candidateRepository) throw new TypeError("DifferentialDiagnosisReasoningEngine requires a candidate repository."); this.repository=candidateRepository; this.policy=mergeDifferentialReasoningPolicy(policy); }
  evaluateCandidate({candidateId,consensus}={}) {
    const c=this.repository.get(candidateId); if(!c) throw new Error(`Unknown differential candidate: ${candidateId}`);
    const map=new Map((consensus?.results||[]).map(r=>[r.hypothesisId,r]));
    const prereq=c.prerequisiteHypothesisIds.map(id=>map.get(id)); const excludes=c.excludedByHypothesisIds.map(id=>map.get(id));
    const missing=c.prerequisiteHypothesisIds.filter(id=>!map.has(id)); const supported=prereq.filter(r=>r?.status==="SUPPORTED"); const supportedExclusions=excludes.filter(r=>r?.status==="SUPPORTED"); const conflicted=[...prereq,...excludes].some(r=>r?.status==="CONFLICTED");
    let raw=prereq.reduce((t,r)=>t+score(r,this.policy),0)-supportedExclusions.length*this.policy.exclusionPenalty;
    let status="INSUFFICIENT_EVIDENCE",reason="NO_SUPPORTED_PREREQUISITE";
    if(supportedExclusions.length){status="EXCLUDED";reason="EXCLUSION_HYPOTHESIS_SUPPORTED";} else if(conflicted){status="CONFLICTED";reason="CONSENSUS_CONFLICT_PRESENT";} else if(missing.length){status="ABSTAINED";reason="MISSING_PREREQUISITE_HYPOTHESIS";} else if(supported.length===c.prerequisiteHypothesisIds.length&&raw>=this.policy.minimumRankableScore){status="SUPPORTED";reason="ALL_PREREQUISITES_SUPPORTED";} else if(supported.length&&raw>=this.policy.minimumRankableScore){status="POSSIBLE";reason="PARTIAL_PREREQUISITE_SUPPORT";}
    return Object.freeze({engineVersion:DIFFERENTIAL_DIAGNOSIS_REASONING_ENGINE_VERSION,candidateId:c.id,candidateLabel:c.label,status,reason,rawScore:Number(raw.toFixed(6)),missingPrerequisiteIds:Object.freeze(missing),mutuallyExclusiveCandidateIds:c.mutuallyExclusiveCandidateIds,requiresHumanReview:["CONFLICTED","ABSTAINED","EXCLUDED"].includes(status)});
  }
  rank({consensus}={}) {
    const evaluated=this.repository.list().map(c=>this.evaluateCandidate({candidateId:c.id,consensus})); const conflicts=[];
    for(const item of evaluated){ if(!["SUPPORTED","POSSIBLE"].includes(item.status)) continue; for(const otherId of item.mutuallyExclusiveCandidateIds){ const other=evaluated.find(x=>x.candidateId===otherId&&["SUPPORTED","POSSIBLE"].includes(x.status)); if(other){const pair=[item.candidateId,other.candidateId].sort();const key=pair.join("::");if(!conflicts.some(x=>x.key===key))conflicts.push(Object.freeze({key,candidateIds:Object.freeze(pair)}));}}}
    const sorted=[...evaluated].sort((a,b)=>b.rawScore-a.rawScore||a.candidateId.localeCompare(b.candidateId)); const total=sorted.filter(x=>x.rawScore>0&&!["EXCLUDED","ABSTAINED"].includes(x.status)).reduce((s,x)=>s+x.rawScore,0);
    const ranked=sorted.slice(0,this.policy.maximumCandidates).map((x,i)=>Object.freeze({...x,rank:i+1,normalizedScore:this.policy.normalizeScores&&total>0&&x.rawScore>0?Number((x.rawScore/total).toFixed(6)):0}));
    const topTie=ranked.length>1&&ranked[0].rawScore===ranked[1].rawScore;
    return Object.freeze({engineVersion:DIFFERENTIAL_DIAGNOSIS_REASONING_ENGINE_VERSION,executionId:consensus?.executionId||null,totalCandidates:evaluated.length,rankedCandidates:Object.freeze(ranked),mutuallyExclusiveConflicts:Object.freeze(conflicts),topTie,requiresHumanReview:ranked.some(x=>x.requiresHumanReview)||conflicts.length>0||(this.policy.requireHumanReviewOnTopTie&&topTie),synthesis:Object.freeze({leadingCandidate:ranked[0]||null,safetyStatement:"The ranking is educational decision support, not a definitive diagnosis."})});
  }
}
