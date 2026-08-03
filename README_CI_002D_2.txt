CELLCOUNT — CI-002D.2
DIFFERENTIAL PAIR BUILDER V1

BASE
----
Built on the approved CI-002D.1 Differential Rule Library.

NEW MODULE
----------
ai/differentialDiagnosis/pairBuilder/
  DifferentialPairPolicy.js
  DifferentialPair.js
  DifferentialPairEligibility.js
  DifferentialPairSource.js
  DifferentialPairBuilder.js
  createDifferentialPairBuilderEngine.js
  index.js

PURPOSE
-------
Build deterministic differential pairs between the morphology winner and
eligible alternatives produced by the ranking/explanation pipeline.

INPUT
-----
- winner
- runner-up
- ranked alternatives
- optional rejected candidates
- specimen type
- differential rule repository

ELIGIBILITY
-----------
A pair is eligible when:
- winner and alternative exist;
- cells are different;
- a registered rule exists;
- specimen type is compatible;
- alternative normalized score is sufficient;
- margin from the winner is not excessive;
- pair is not duplicated.

OUTPUT
------
- all evaluated pairs
- eligible pairs
- rejected pairs
- registered rule and rule id
- reverse-orientation flag
- rejection reasons
- pair source
- statistics
- applied policy

NEW ENDPOINT
------------
POST /knowledge/morphology/build-differential-pairs

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
node --check ai\differentialDiagnosis\pairBuilder\index.js
node tests\ci002d2_pair_builder_test.mjs
node tests\ci002d2_registered_rule_test.mjs
node tests\ci002d2_reverse_orientation_test.mjs
node tests\ci002d2_unregistered_pair_test.mjs
node tests\ci002d2_specimen_compatibility_test.mjs
node tests\ci002d2_threshold_test.mjs
node tests\ci002d2_deduplication_test.mjs
node tests\ci002d2_regression_test.mjs
node tests\ci002d2_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
DIFFERENTIAL PAIR BUILDER: 12 registered pair rules

NEXT
----
CI-002D.3 — Differential Similarity Calculator
