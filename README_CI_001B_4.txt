CELLCOUNT — CI-001B.4
BONE MARROW CLINICAL REASONING ENGINE V1

BASE
----
Built incrementally on the approved CI-001B.3 server.

NEW MODULE
----------
ai/boneMarrow/boneMarrowClinicalReasoningEngine.js

PRESERVED MODULE
----------------
ai/boneMarrow/boneMarrowOutputContract.js

REPLACEMENT
-----------
server.js

NEW TESTS
---------
tests/ci001b4_bone_marrow_reasoning_test.mjs
tests/ci001b4_peripheral_regression_test.mjs
tests/ci001b4_strict_e2e_reasoning_test.mjs

REASONING DOMAINS
-----------------
- adequacy, representativity and hemodilution
- cellularity safety
- myeloid lineage
- erythroid lineage
- megakaryocytic lineage
- blasts and immature cells
- plasma cells
- dysplasia
- infiltration
- integrated concern and explainability

SAFETY
------
- no global marrow normality from isolated images
- no global blast exclusion
- no global dysplasia exclusion
- no global infiltration exclusion
- no global cellularity estimate unless explicitly allowed
- peripheral blood output is unchanged

INSTALL
-------
Back up the current backend server.js.

Extract the package into:
C:\CELLCOUNT_V1.0.0-beta.4\backend

VALIDATE
--------
node --check server.js
node --check ai\boneMarrow\boneMarrowClinicalReasoningEngine.js
node tests\ci001b4_bone_marrow_reasoning_test.mjs
node tests\ci001b4_peripheral_regression_test.mjs

START
-----
npm start

E2E
---
node tests\ci001b2_e2e.mjs "C:\Users\ubuntu\Desktop\sangue_periferico.jpeg" "C:\Users\ubuntu\Desktop\medula_ossea.jpeg" "reports\ci001b2_e2e_report.json"

node tests\ci001b3_strict_e2e_report_test.mjs "reports\ci001b2_e2e_report.json"

node tests\ci001b4_strict_e2e_reasoning_test.mjs "reports\ci001b2_e2e_report.json"

EXPECTED
--------
- peripheral blood PASS
- marrow PASS
- CI-001B.3 strict contract PASS
- CI-001B.4 strict reasoning contract PASS
