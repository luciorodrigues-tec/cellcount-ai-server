CELLCOUNT — CI-002C.7
MORPHOLOGIC EXPLANATION ENGINE V1

BASE
----
Built on the approved CI-002C.6 Confidence Engine.

NEW MODULE
----------
ai/explanation/morphologyExplanation/
  ExplanationPolicy.js
  EvidenceNarrative.js
  AlternativeExplanation.js
  RejectedCandidateExplanation.js
  DecisionNarrative.js
  ExplanationSummary.js
  ExplanationEngine.js
  createMorphologyExplanationEngine.js
  index.js

PURPOSE
-------
Transform ranking, scores, evidence and confidence into a structured,
deterministic and auditable explanation.

OUTPUT
------
- winner and runner-up
- decision headline
- conclusion
- rationale
- safety statement
- supporting evidence
- contradictory evidence
- missing required evidence
- alternative candidates
- rejected candidates and rejection reasons
- human-review recommendation
- preservation checks for ranking and confidence
- execution metrics and policy

PRINCIPLES
----------
The Explanation Engine:
- never changes the winner;
- never changes ranking order;
- never changes confidence;
- does not issue diagnosis;
- preserves human-review recommendations;
- retains audit links to feature and criterion identifiers.

NEW ENDPOINT
------------
POST /knowledge/morphology/explain-decision

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
node --check ai\explanation\morphologyExplanation\index.js
node tests\ci002c7_explanation_test.mjs
node tests\ci002c7_supporting_evidence_test.mjs
node tests\ci002c7_contradiction_test.mjs
node tests\ci002c7_alternative_test.mjs
node tests\ci002c7_no_winner_test.mjs
node tests\ci002c7_rejected_candidate_test.mjs
node tests\ci002c7_regression_test.mjs
node tests\ci002c7_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC EXPLANATION ENGINE: 15 explainable definitions
