CELLCOUNT — CI-002C.5
MORPHOLOGIC RANKING ENGINE V1

BASE
----
Built on the approved CI-002C.4 Candidate Generator.

NEW MODULE
----------
ai/ranking/morphologyRanking/
  RankingPolicy.js
  RankingComparator.js
  RankedCandidate.js
  RankingMetrics.js
  RankingSummary.js
  RankingEngine.js
  createMorphologyRankingEngine.js
  index.js

PURPOSE
-------
Convert eligible morphology candidates into a deterministic formal ranking.

OUTPUT
------
- formal rank positions
- winner
- runner-up
- absolute margin
- relative margin
- dominance
- ambiguity
- tie status
- winner strength
- human review recommendation
- review reasons

DEFAULT POLICY
--------------
dominanceHighThreshold: 0.15
dominanceModerateThreshold: 0.05
ambiguityThreshold: 0.03
minimumWinnerNormalizedScore: 0.25
minimumWinnerScore: 1.0
minimumWinnerCoverage: 0.40

DOMINANCE
---------
HIGH:
absolute margin >= 0.15

MODERATE:
absolute margin >= 0.05 and < 0.15

LOW:
absolute margin > 0 and < 0.05

NONE:
tie or no margin

HUMAN REVIEW
------------
Recommended when:
- no eligible candidate exists;
- top candidates are ambiguous;
- winner does not meet minimum strength.

NEW ENDPOINT
------------
POST /knowledge/morphology/rank-candidates

Body:
{
  "specimenType": "BONE_MARROW_ASPIRATE",
  "features": {
    "fine_chromatin": 0.98,
    "visible_nucleoli": 0.95,
    "high_nc_ratio": 0.97
  }
}

IMPORTANT
---------
CI-002C.5 ranks candidates but does not yet calculate calibrated classification
confidence. Confidence remains deferred to CI-002C.6.

VALIDATE
--------
node --check server.js
node --check ai\ranking\morphologyRanking\index.js
node tests\ci002c5_ranking_test.mjs
node tests\ci002c5_winner_runnerup_test.mjs
node tests\ci002c5_margin_dominance_test.mjs
node tests\ci002c5_ambiguity_test.mjs
node tests\ci002c5_tie_test.mjs
node tests\ci002c5_no_candidate_test.mjs
node tests\ci002c5_sort_regression_test.mjs
node tests\ci002c5_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC RANKING ENGINE: 15 rankable definitions
