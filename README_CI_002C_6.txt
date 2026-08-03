CELLCOUNT — CI-002C.6
MORPHOLOGIC CONFIDENCE ENGINE V1

BASE
----
Built on the approved CI-002C.5 Ranking Engine.

NEW MODULE
----------
ai/confidence/morphologyConfidence/
  ConfidencePolicy.js
  ConfidenceFactors.js
  ConfidencePenalty.js
  ConfidenceNormalizer.js
  ConfidenceExplanation.js
  ConfidenceSummary.js
  ConfidenceEngine.js
  createMorphologyConfidenceEngine.js
  index.js

PURPOSE
-------
Convert ranking quality into calibrated confidence without changing the winner
or candidate order.

POSITIVE FACTORS
----------------
winner normalized score: 35%
criteria coverage: 25%
winner margin: 20%
required criteria coverage: 20%

PENALTIES
---------
ambiguity
tie
low dominance
field/image limitations
negative evidence
exclusion evidence
missing required evidence
weak winner
existing ranking review recommendation

CONFIDENCE LEVELS
-----------------
VERY_HIGH: >= 0.90
HIGH: >= 0.75
MODERATE: >= 0.55
LOW: >= 0.35
VERY_LOW: < 0.35
UNAVAILABLE: no eligible winner

HUMAN REVIEW
------------
Recommended when:
- confidence is unavailable;
- confidence is below 0.55;
- ranking already recommended review;
- material penalties are substantial.

NEW ENDPOINT
------------
POST /knowledge/morphology/calculate-confidence

Body:
{
  "specimenType": "BONE_MARROW_ASPIRATE",
  "features": {
    "fine_chromatin": 1,
    "visible_nucleoli": 1,
    "high_nc_ratio": 1
  }
}

IMPORTANT
---------
CI-002C.6 never changes the winner or ranking order. It only calibrates and
explains confidence. Full decision explanation remains deferred to CI-002C.7.

VALIDATE
--------
node --check server.js
node --check ai\confidence\morphologyConfidence\index.js
node tests\ci002c6_confidence_test.mjs
node tests\ci002c6_margin_weight_test.mjs
node tests\ci002c6_penalty_test.mjs
node tests\ci002c6_level_test.mjs
node tests\ci002c6_human_review_test.mjs
node tests\ci002c6_no_winner_test.mjs
node tests\ci002c6_ranking_regression_test.mjs
node tests\ci002c6_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC CONFIDENCE ENGINE: 15 confidence-enabled definitions
