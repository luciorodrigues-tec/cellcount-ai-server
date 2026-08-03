CELLCOUNT — CI-002D.1
DIFFERENTIAL RULE LIBRARY V1

BASE
----
Built on the approved CI-002C.8 Morphologic Evidence Graph.

NEW MODULE
----------
ai/differentialDiagnosis/ruleLibrary/
  DifferentialRule.js
  DifferentialRuleValidator.js
  DifferentialRuleRepository.js
  DifferentialRuleLibrary.js
  rules/
    coreDifferentialRules.js
  index.js

PURPOSE
-------
Provide a formal, immutable and validated knowledge base for pairwise
morphologic differential diagnosis.

INITIAL PAIRS
-------------
CELL-BLAST × CELL-PLASMABLAST
CELL-BLAST × CELL-PROMYELOCYTE
CELL-BLAST × CELL-REACTIVE-LYMPHOCYTE
CELL-BLAST × CELL-MONOCYTE
CELL-PROMYELOCYTE × CELL-MYELOCYTE
CELL-MYELOCYTE × CELL-METAMYELOCYTE
CELL-BAND × CELL-SEGMENTED-NEUTROPHIL
CELL-LYMPHOCYTE × CELL-REACTIVE-LYMPHOCYTE
CELL-REACTIVE-LYMPHOCYTE × CELL-PLASMABLAST
CELL-PLASMA-CELL × CELL-PLASMABLAST
CELL-ERYTHROBLAST × CELL-LYMPHOCYTE
CELL-ERYTHROBLAST × CELL-PLASMA-CELL

RULE CONTENT
------------
- primary and differential cells
- baseline similarity
- specimen applicability
- shared features
- exclusive features for each cell
- exclusion features for each cell
- recommended tests
- confidence modifiers
- narrative
- references and metadata

VALIDATION
----------
- valid cell references
- valid feature references
- semantic versioning
- similarity between 0 and 1
- no duplicated pair
- no feature overlap across semantic groups
- immutable repository snapshot

ENDPOINTS
---------
GET /knowledge/morphology/differential-rules/status

GET /knowledge/morphology/differential-rules/pair
  ?firstCell=CELL-BLAST
  &secondCell=CELL-PLASMABLAST

VALIDATE LOCALLY
----------------
node --check server.js
node --check ai\differentialDiagnosis\ruleLibrary\index.js
node tests\ci002d1_library_test.mjs
node tests\ci002d1_validation_test.mjs
node tests\ci002d1_duplicate_pair_test.mjs
node tests\ci002d1_similarity_test.mjs
node tests\ci002d1_recommendation_test.mjs
node tests\ci002d1_feature_consistency_test.mjs
node tests\ci002d1_repository_query_test.mjs
node tests\ci002d1_regression_test.mjs
node tests\ci002d1_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
DIFFERENTIAL RULE LIBRARY: 12 differential pairs

NEXT
----
CI-002D.2 — Differential Pair Builder
