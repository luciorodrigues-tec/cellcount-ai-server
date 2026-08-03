CELLCOUNT — CI-001B
BACKEND SPECIMEN GATE & BONE MARROW ROUTING V1

BASED ON
--------
server(17).js supplied by the user.

DELIVERY
--------
server.js
tests/ci001b_smoke_test.mjs

WHAT CHANGED
------------
1. Added POST /classify-specimen.
2. Added mandatory specimenDecision gate for visual/hybrid analysis.
3. Manual-only mode remains permitted without image specimen classification.
4. specimenType now drives analysisType.
5. BONE_MARROW_ASPIRATE, BONE_MARROW_BIOPSY and
   HEMODILUTED_BONE_MARROW route to bone_marrow.
6. INADEQUATE and INDETERMINATE are blocked.
7. analyzeWithOpenAI now receives analysisType/specimenType/decision.
8. Bone marrow output contract was expanded.
9. Bone marrow language guard removes peripheral-blood global conclusions.
10. Hemodiluted marrow forces explicit limitations and human review.
11. specimen metadata is preserved in the final response.

INSTALL
-------
Back up the current backend server.js.
Replace it with the delivered server.js.

VALIDATE
--------
node --check server.js
node tests/ci001b_smoke_test.mjs
npm test
npm start

ENDPOINT TEST
-------------
POST /classify-specimen
Authorization: Bearer <API_TOKEN>
multipart field: image (1 to 4 files)

IMPORTANT
---------
The Flutter frontend already sends:
- specimenDecision
- specimenType
- specimenConfidence
- specimenDecisionStatus

This server consumes those fields directly.
