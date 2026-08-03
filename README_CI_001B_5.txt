CELLCOUNT — CI-001B.5
BONE MARROW SAFETY GOVERNOR V1

BASE
----
Built incrementally on the approved CI-001B.4 package.

NEW FRAMEWORK
-------------
ai/clinicalSafety/
  ClinicalSafetyGovernor.js
  index.js
  audit/SafetyAuditTrail.js
  validators/SafetyValidator.js
  rules/boneMarrowSafetyRules.js
  governors/BoneMarrowSafetyGovernor.js

PURPOSE
-------
Audit the final marrow output after:
- output contract
- clinical reasoning
- language guard

The governor corrects contradictions, scores safety, records an audit trail and
blocks delivery when mandatory marrow structures are absent.

INITIAL RULE PACK
-----------------
BM-001 blast contradiction
BM-002 dysplasia contradiction
BM-003 infiltration contradiction
BM-004 adequacy versus cellularity
BM-005 hemodilution versus lineage preservation
BM-006 monomorphic population versus low risk
BM-007 limited material versus normal marrow
BM-008 mandatory human review
BM-009 mandatory limitations
BM-010 incomplete contract/reasoning blocking rule

VALIDATE
--------
node --check server.js
node --check ai\clinicalSafety\ClinicalSafetyGovernor.js
node tests\ci001b5_bone_marrow_safety_test.mjs
node tests\ci001b5_blocking_test.mjs
node tests\ci001b5_peripheral_regression_test.mjs

E2E
---
npm start

In another terminal:

node tests\ci001b2_e2e.mjs "C:\Users\ubuntu\Desktop\sangue_periferico.jpeg" "C:\Users\ubuntu\Desktop\medula_ossea.jpeg" "reports\ci001b2_e2e_report.json"

node tests\ci001b3_strict_e2e_report_test.mjs "reports\ci001b2_e2e_report.json"
node tests\ci001b4_strict_e2e_reasoning_test.mjs "reports\ci001b2_e2e_report.json"
node tests\ci001b5_strict_e2e_safety_test.mjs "reports\ci001b2_e2e_report.json"
