export const DIFFERENTIAL_REASONING_POLICY_VERSION = "CRR-000007-v1.0.0";
export const DEFAULT_DIFFERENTIAL_REASONING_POLICY = Object.freeze({version:DIFFERENTIAL_REASONING_POLICY_VERSION,supportScore:1,conflictPenalty:0.75,exclusionPenalty:2,abstentionPenalty:1,insufficientEvidencePenalty:0.5,minimumRankableScore:0.25,maximumCandidates:10,normalizeScores:true,requireHumanReviewOnTopTie:true});
export const mergeDifferentialReasoningPolicy = (overrides={}) => Object.freeze({...DEFAULT_DIFFERENTIAL_REASONING_POLICY,...overrides});
