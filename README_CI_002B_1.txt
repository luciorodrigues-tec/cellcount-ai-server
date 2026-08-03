CELLCOUNT — CI-002B.1
CELL KNOWLEDGE LIBRARY V1

BASE
----
Built on the approved CI-002A foundation.

LIBRARY
-------
15 validated morphology entities:

Myeloid / neutrophilic:
- CELL-BLAST
- CELL-PROMYELOCYTE
- CELL-MYELOCYTE
- CELL-METAMYELOCYTE
- CELL-BAND
- CELL-SEGMENTED-NEUTROPHIL

Lymphoid / plasmacytic:
- CELL-LYMPHOCYTE
- CELL-REACTIVE-LYMPHOCYTE
- CELL-PLASMA-CELL
- CELL-PLASMABLAST

Monocytic:
- CELL-MONOCYTE

Granulocytic:
- CELL-EOSINOPHIL
- CELL-BASOPHIL

Erythroid:
- CELL-ERYTHROBLAST

Megakaryocytic:
- CELL-MEGAKARYOCYTE

EACH ENTITY INCLUDES
--------------------
- positive criteria
- negative criteria
- exclusion criteria
- limitations
- minimum evidence
- look-alikes
- specimen applicability
- references
- tags and metadata
- anti-overcalling language

SERVER
------
The morphology registry now loads 15 entities at startup.

Expected log:
MORPHOLOGIC KNOWLEDGE FOUNDATION: 15 entities

Endpoint:
GET /knowledge/morphology/status

Expected status:
cell_library_ready

VALIDATE
--------
node --check server.js
node --check ai\knowledge\morphology\cells\index.js
node tests\ci002b1_library_integrity_test.mjs
node tests\ci002b1_registry_test.mjs
node tests\ci002b1_criteria_consistency_test.mjs
node tests\ci002b1_alias_integrity_test.mjs
node tests\ci002b1_server_contract_test.mjs

IMPORTANT
---------
CI-002B.1 adds knowledge only. It does not yet change clinical classification.
The Morphologic Criteria Engine will consume this library in CI-002C.
