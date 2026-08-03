CELLCOUNT — CI-002C.4
MORPHOLOGIC CANDIDATE GENERATOR V1

BASE
----
Built on the approved CI-002C.3 Score Calculator.

NEW MODULE
----------
ai/candidate/morphologyCandidate/
  CandidateThresholds.js
  Candidate.js
  CandidateFilter.js
  CandidateComparator.js
  CandidateFactory.js
  CandidateStatistics.js
  CandidateList.js
  CandidateGenerator.js
  createMorphologyCandidateEngine.js
  index.js

PURPOSE
-------
Transform all morphology score results into a deterministic set of eligible
and rejected hypotheses.

DEFAULT ELIGIBILITY
-------------------
minimumCandidateScore: 1.0
minimumNormalizedScore: 0.25
minimumCoverage: 0.40
requireRequiredSatisfied: true
requireMinimumScoreSatisfied: false
allowExcluded: false
allowBlocked: false

REJECTION REASONS
-----------------
BLOCKED
EXCLUDED
MISSING_REQUIRED_CRITERIA
BELOW_MINIMUM_SCORE
BELOW_MINIMUM_NORMALIZED_SCORE
BELOW_MINIMUM_COVERAGE
MINIMUM_WEIGHTED_SCORE_NOT_SATISFIED

OUTPUT
------
- eligible candidates
- rejected candidates
- deterministic preliminary order
- complete selection statistics
- applied thresholds
- original score result for audit

NEW ENDPOINT
------------
POST /knowledge/morphology/generate-candidates

IMPORTANT
---------
CI-002C.4 filters candidates and gives them a deterministic preliminary order.
It does not yet calculate winner, runner-up, ambiguity, dominance or formal
rank positions. Those belong to CI-002C.5.

VALIDATE
--------
node --check server.js
node --check ai\candidate\morphologyCandidate\index.js
node tests\ci002c4_candidate_generation_test.mjs
node tests\ci002c4_threshold_test.mjs
node tests\ci002c4_blocking_exclusion_test.mjs
node tests\ci002c4_required_coverage_test.mjs
node tests\ci002c4_statistics_test.mjs
node tests\ci002c4_sort_test.mjs
node tests\ci002c4_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC CANDIDATE GENERATOR: 15 candidate definitions
