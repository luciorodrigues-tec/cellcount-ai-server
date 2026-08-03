CELLCOUNT — CI-002C.2
FEATURE MATCHER V1

BASE
----
Built on the approved CI-002C.1 Criteria Definition Engine.

NEW MODULE
----------
ai/matching/featureMatcher/
  FeatureAliasRegistry.js
  FeatureNormalizer.js
  FeatureSimilarity.js
  MatchEvidence.js
  CoverageCalculator.js
  MatchResult.js
  FeatureMatcher.js
  createFeatureMatcher.js
  index.js

PURPOSE
-------
Transform detected visual features into structured evidence for every eligible
cell criteria definition.

INPUT
-----
Object form:
{
  "fine_chromatin": 0.91,
  "visible_nucleoli": 0.82
}

Array form:
[
  {
    "featureId": "fine_chromatin",
    "confidence": 0.91
  }
]

OUTPUT PER CELL
---------------
- requiredMatched / requiredTotal
- supportiveMatched / supportiveTotal
- negativeMatched / negativeTotal
- exclusionMatched / exclusionTotal
- limitationMatched / limitationTotal
- requiredCoverage
- supportiveCoverage
- negativeCoverage
- exclusionCoverage
- overallCoverage
- structured evidence
- unmatched required features
- exclusion flag

NEW ENDPOINT
------------
POST /knowledge/morphology/match-features

Body:
{
  "specimenType": "BONE_MARROW_ASPIRATE",
  "features": {
    "Cromatina delicada": 0.91,
    "Nucléolos visíveis": 0.82
  }
}

IMPORTANT
---------
CI-002C.2 does not score or rank candidates. It only matches features and
calculates evidence coverage. Scoring remains deferred to CI-002C.3.

VALIDATE
--------
node --check server.js
node --check ai\matching\featureMatcher\index.js
node tests\ci002c2_normalizer_test.mjs
node tests\ci002c2_similarity_test.mjs
node tests\ci002c2_matcher_test.mjs
node tests\ci002c2_negative_exclusion_test.mjs
node tests\ci002c2_coverage_test.mjs
node tests\ci002c2_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC FEATURE MATCHER: 15 candidate definitions
