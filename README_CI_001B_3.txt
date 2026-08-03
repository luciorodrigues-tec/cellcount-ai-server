CELLCOUNT — CI-001B.3
BONE MARROW OUTPUT CONTRACT ENFORCEMENT V1

BASE
----
Generated from the user-supplied current server(18).js.

NEW MODULE
----------
ai/boneMarrow/boneMarrowOutputContract.js

REPLACEMENT
-----------
server.js

NEW TESTS
---------
tests/ci001b3_bone_marrow_contract_test.mjs
tests/ci001b3_strict_e2e_report_test.mjs

WHAT IT DOES
------------
- Preserves or creates all 13 required marrow fields.
- Uses tri-state/indeterminate observation statuses.
- Separates notObserved from notAssessable.
- Blocks global cellularity estimates from isolated fields.
- Blocks global absence claims for blasts, dysplasia and infiltration.
- Preserves raw marrow fields returned by OpenAI.
- Applies a marrow-specific language governor.
- Forces human review and normality blocking for marrow image analysis.
- Adds a versioned boneMarrowOutputContract object.

INSTALL
-------
1. Back up the current backend server.js.
2. Copy the delivered server.js to the backend root.
3. Copy the ai/boneMarrow folder.
4. Copy the tests.

VALIDATE
--------
node --check server.js
node --check ai\boneMarrow\boneMarrowOutputContract.js
node tests\ci001b3_bone_marrow_contract_test.mjs
npm start

E2E
---
Run the existing E2E:

node tests\ci001b2_e2e.mjs "C:\Users\ubuntu\Desktop\sangue_periferico.jpeg" "C:\Users\ubuntu\Desktop\medula_ossea.jpeg" "reports\ci001b2_e2e_report.json"

Then enforce strict contract:

node tests\ci001b3_strict_e2e_report_test.mjs "reports\ci001b2_e2e_report.json"

EXPECTED
--------
- Peripheral blood PASS
- Bone marrow PASS
- Zero missing marrow-field warnings
- CI-001B.3 strict E2E report contract passed
