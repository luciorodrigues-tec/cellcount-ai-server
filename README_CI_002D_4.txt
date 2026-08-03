CELLCOUNT — CI-002D.4
DIFFERENTIAL EVIDENCE ENGINE V1

BASE
----
Built on the approved CI-002D.3 Differential Similarity Calculator.

NEW MODULE
----------
ai/differentialDiagnosis/evidenceEngine/
  DifferentialEvidencePolicy.js
  DifferentialEvidenceItem.js
  EvidenceWeightCalculator.js
  DifferentialEvidenceOrientation.js
  DifferentialEvidenceCollectors.js
  DifferentialEvidenceSummary.js
  DifferentialEvidenceResult.js
  DifferentialEvidenceEngine.js
  createDifferentialEvidenceEngine.js
  index.js

PURPOSE
-------
Convert differential similarity into structured, weighted and auditable
evidence for each competing morphologic hypothesis.

EVIDENCE GROUPS
---------------
SHARED_EVIDENCE
WINNER_EVIDENCE
ALTERNATIVE_EVIDENCE
MISSING_EVIDENCE
CONFLICT_EVIDENCE

EACH EVIDENCE ITEM CONTAINS
---------------------------
- feature id
- evidence group
- semantic role
- favored hypothesis
- observed confidence
- differential coverage
- diagnostic factor
- final evidence weight
- qualitative strength
- observed/missing/conflicting flags
- deterministic statement
- metadata

ORIENTATION
-----------
Reverse differential rules are automatically reoriented so winner-specific,
alternative-specific and exclusion features always refer to the current
ranking direction.

OUTPUT
------
- shared evidence
- winner evidence
- alternative evidence
- missing evidence
- conflicting evidence
- weighted evidence summary
- evidence balance
- evidence statistics
- engine metadata

NEW ENDPOINT
------------
POST /knowledge/morphology/build-differential-evidence

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
node --check ai\differentialDiagnosis\evidenceEngine\index.js
node tests\ci002d4_shared_evidence_test.mjs
node tests\ci002d4_winner_alternative_test.mjs
node tests\ci002d4_missing_evidence_test.mjs
node tests\ci002d4_conflict_test.mjs
node tests\ci002d4_weight_test.mjs
node tests\ci002d4_reverse_orientation_test.mjs
node tests\ci002d4_e2e_test.mjs
node tests\ci002d4_regression_test.mjs
node tests\ci002d4_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
DIFFERENTIAL EVIDENCE ENGINE: 12 evidence-enabled rules

NEXT
----
CI-002D.5 — Exclusive Feature Engine
