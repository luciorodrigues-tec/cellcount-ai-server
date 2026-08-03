CELLCOUNT — CI-002C.8
MORPHOLOGIC EVIDENCE GRAPH V1

BASE
----
Built on the approved CI-002C.7 Explanation Engine.

NEW MODULE
----------
ai/graph/morphologyEvidence/
  EvidenceGraphPolicy.js
  EvidenceGraphNode.js
  EvidenceGraphEdge.js
  EvidenceGraph.js
  EvidenceGraphBuilder.js
  EvidenceGraphQuery.js
  createMorphologyEvidenceGraphEngine.js
  index.js

PURPOSE
-------
Convert the full morphology decision into an explicit, navigable graph.

NODE TYPES
----------
DECISION
CELL
FEATURE
CRITERION
EVIDENCE
CONFIDENCE
PENALTY
SPECIMEN
HUMAN_REVIEW

EDGE TYPES
----------
SUPPORTS
CONTRADICTS
EXCLUDES
LIMITS
REQUIRES
MATCHED_BY
RANKED_ABOVE
ALTERNATIVE_TO
CONTRIBUTES_TO
PENALIZES
CLASSIFIED_AS
DERIVED_FROM
REQUIRES_REVIEW
APPLIES_TO_SPECIMEN

CAPABILITIES
------------
- explicit winner and alternative relationships;
- feature-to-cell evidence links;
- feature-to-criterion links;
- confidence factor and penalty links;
- rejected candidate representation;
- specimen applicability;
- human review safety node;
- node and edge deduplication;
- graph queries by id, type and neighborhood;
- immutable snapshot output;
- no mutation of upstream explanation data.

NEW ENDPOINT
------------
POST /knowledge/morphology/build-evidence-graph

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
node --check ai\graph\morphologyEvidence\index.js
node tests\ci002c8_graph_build_test.mjs
node tests\ci002c8_feature_relation_test.mjs
node tests\ci002c8_alternative_relation_test.mjs
node tests\ci002c8_penalty_graph_test.mjs
node tests\ci002c8_query_test.mjs
node tests\ci002c8_deduplication_test.mjs
node tests\ci002c8_regression_test.mjs
node tests\ci002c8_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC EVIDENCE GRAPH: 15 graph-enabled definitions

NEXT
----
CI-002D — Differential Diagnosis Engine
