export const DIFFERENTIAL_CANDIDATE_SCHEMA_VERSION = "CRR-000007-v1";
const unique = (values = []) => Object.freeze([...new Set((Array.isArray(values) ? values : []).map(String).map(v => v.trim()).filter(Boolean))]);
export function createDifferentialCandidate({id,label,category="DIFFERENTIAL_DIAGNOSIS",prerequisiteHypothesisIds=[],excludedByHypothesisIds=[],mutuallyExclusiveCandidateIds=[],metadata={}}={}) {
  if (!id || !String(id).trim()) throw new TypeError("DifferentialCandidate.id is required.");
  if (!label || !String(label).trim()) throw new TypeError("DifferentialCandidate.label is required.");
  return Object.freeze({schemaVersion:DIFFERENTIAL_CANDIDATE_SCHEMA_VERSION,id:String(id).trim(),label:String(label).trim(),category:String(category).trim().toUpperCase(),prerequisiteHypothesisIds:unique(prerequisiteHypothesisIds),excludedByHypothesisIds:unique(excludedByHypothesisIds),mutuallyExclusiveCandidateIds:unique(mutuallyExclusiveCandidateIds),metadata:Object.freeze({...metadata})});
}
