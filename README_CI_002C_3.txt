CELLCOUNT — CI-002C.3
MORPHOLOGIC SCORE CALCULATOR V1

BASE
----
Built on the approved CI-002C.2 Feature Matcher.

NEW MODULE
----------
ai/scoring/morphologyScore/
  ScoreContribution.js
  ScoreResult.js
  ScorePolicy.js
  ScoreCalculator.js
  createMorphologyScoringEngine.js
  index.js

PURPOSE
-------
Convert feature-match evidence into deterministic weighted scores.

FORMULA
-------
Positive evidence:
confidence × similarity × weight × role multiplier

Penalties:
negative evidence
exclusion evidence
limitation evidence
missing required criteria

OUTPUT
------
For each candidate:
- positiveScore
- negativePenalty
- exclusionPenalty
- limitationPenalty
- requiredPenalty
- rawScore
- finalScore
- normalizedScore
- maximumPositiveScore
- requiredSatisfied
- minimumScoreSatisfied
- excluded
- blocked
- contribution audit trail

DEFAULT POLICY
--------------
requiredMultiplier: 1.2
supportiveMultiplier: 1.0
negativePenaltyMultiplier: 1.0
exclusionPenaltyMultiplier: 2.0
limitationPenaltyMultiplier: 0.25
limitationBaseWeight: 1
missingRequiredPenaltyMultiplier: 0.75
exclusionBlocks: true

NEW ENDPOINT
------------
POST /knowledge/morphology/score-features

Body:
{
  "specimenType": "BONE_MARROW_ASPIRATE",
  "features": {
    "fine_chromatin": 0.95,
    "visible_nucleoli": 0.90,
    "high_nc_ratio": 0.92
  }
}

IMPORTANT
---------
CI-002C.3 scores all eligible candidates but does not yet rank or select a
preferred cell. Candidate generation and ranking remain deferred to CI-002C.4
and CI-002C.5.

VALIDATE
--------
node --check server.js
node --check ai\scoring\morphologyScore\index.js
node tests\ci002c3_positive_score_test.mjs
node tests\ci002c3_penalty_test.mjs
node tests\ci002c3_exclusion_block_test.mjs
node tests\ci002c3_missing_required_penalty_test.mjs
node tests\ci002c3_normalization_test.mjs
node tests\ci002c3_contribution_audit_test.mjs
node tests\ci002c3_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC SCORE CALCULATOR: 15 scorable definitions
