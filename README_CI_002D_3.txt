CELLCOUNT — CI-002D.3
DIFFERENTIAL SIMILARITY CALCULATOR V1

BASE
----
Built on the approved CI-002D.2 Differential Pair Builder.

NEW MODULE
----------
ai/differentialDiagnosis/similarityCalculator/
  DifferentialSimilarityPolicy.js
  ObservedFeatureIndex.js
  FeatureAgreementCalculator.js
  FeatureConflictCalculator.js
  DifferentialCoverageCalculator.js
  RankingSupportCalculator.js
  ConfidenceSupportCalculator.js
  SpecimenCompatibilityCalculator.js
  DifferentialSimilarityResult.js
  DifferentialSimilarityCalculator.js
  createDifferentialSimilarityEngine.js
  index.js

PURPOSE
-------
Calculate contextual similarity for each eligible differential pair.

INPUT FACTORS
-------------
- baseline similarity from the differential rule;
- observed shared-feature agreement;
- exclusive-feature and exclusion conflicts;
- evaluable rule coverage;
- ranking support;
- confidence support;
- specimen compatibility.

DEFAULT POSITIVE WEIGHTS
------------------------
baseline: 25%
shared agreement: 25%
ranking support: 15%
confidence support: 15%
coverage: 10%
specimen compatibility: 10%

CONFLICTS
---------
Observed features that favor the alternative or exclude the winner reduce
final similarity. Features that favor the winner or exclude the alternative
are retained as primary-support evidence.

OUTPUT
------
- baseline similarity
- shared agreement
- oriented feature conflicts
- primary support
- coverage
- ranking support
- confidence support
- specimen compatibility
- positive score
- total conflict
- final normalized similarity
- confidence interval
- insufficient-evidence flag
- engine metadata

NEW ENDPOINT
------------
POST /knowledge/morphology/calculate-differential-similarity

Body:
{
  "specimenType": "BONE_MARROW_ASPIRATE",
  "features": {
    "fine_chromatin": 1,
    "visible_nucleoli": 1,
    "high_nc_ratio": 1
  }
}

VALIDATE
--------
node --check server.js
node --check ai\differentialDiagnosis\similarityCalculator\index.js
node tests\ci002d3_shared_agreement_test.mjs
node tests\ci002d3_conflict_test.mjs
node tests\ci002d3_reverse_orientation_test.mjs
node tests\ci002d3_coverage_test.mjs
node tests\ci002d3_ranking_confidence_test.mjs
node tests\ci002d3_normalization_test.mjs
node tests\ci002d3_e2e_test.mjs
node tests\ci002d3_regression_test.mjs
node tests\ci002d3_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
DIFFERENTIAL SIMILARITY CALCULATOR: 12 similarity-enabled rules

NEXT
----
CI-002D.4 — Differential Evidence Engine
