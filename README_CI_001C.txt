CELLCOUNT — CI-001C
DUAL PIPELINE STABILIZATION V1

BASE
----
Built on the approved CI-001B.5 package.

NEW MODULE
----------
ai/dualPipeline/
  SpecimenPipelineRegistry.js
  DualPipelineStabilizer.js
  index.js

PURPOSE
-------
Create one final specimen-aware stabilization layer after:
- specimen gate
- marrow output contract
- marrow clinical reasoning
- marrow safety governor

BEHAVIOR
--------
Peripheral blood:
- must not contain marrow-only fields
- marrow leakage blocks delivery

Bone marrow:
- must contain marrow contract
- must contain marrow reasoning
- must pass marrow safety
- incompleteness blocks delivery

Manual:
- allowed without visual specimen pipeline

Unknown/indeterminate:
- blocked

NEW OUTPUT
----------
dualPipelineValidation:
  version
  passed
  deliveryAllowed
  pipeline
  isolationPassed
  completenessPassed
  marrowSafetyPassed
  leakedFields
  missingFields

VALIDATE
--------
node --check server.js
node --check ai\dualPipeline\DualPipelineStabilizer.js
node tests\ci001c_pipeline_registry_test.mjs
node tests\ci001c_pipeline_isolation_test.mjs
node tests\ci001c_blocking_test.mjs

E2E
---
npm start

In another terminal:

node tests\ci001b2_e2e.mjs "C:\Users\ubuntu\Desktop\sangue_periferico.jpeg" "C:\Users\ubuntu\Desktop\medula_ossea.jpeg" "reports\ci001b2_e2e_report.json"

node tests\ci001b3_strict_e2e_report_test.mjs "reports\ci001b2_e2e_report.json"
node tests\ci001b4_strict_e2e_reasoning_test.mjs "reports\ci001b2_e2e_report.json"
node tests\ci001b5_strict_e2e_safety_test.mjs "reports\ci001b2_e2e_report.json"
node tests\ci001c_strict_e2e_test.mjs "reports\ci001b2_e2e_report.json"
