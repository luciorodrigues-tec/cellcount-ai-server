CELLCOUNT — CI-002A
MORPHOLOGIC KNOWLEDGE FOUNDATION V1

BASE
----
Built on the approved CI-001C package.

NEW DOMAIN
----------
ai/knowledge/morphology/
  domain/
    MorphologyEnums.js
    MorphologyCriterion.js
    MorphologyReference.js
    MorphologyKnowledgeEntity.js
    index.js
  registry/
    MorphologyKnowledgeRegistry.js
    index.js
  validation/
    MorphologyKnowledgeValidator.js
  catalog/
    foundationCatalog.js
    loadFoundationCatalog.js
    index.js
  index.js

FOUNDATION CAPABILITIES
-----------------------
- immutable morphology knowledge entities
- reusable criteria
- explicit polarity and evidence strength
- specimen-aware knowledge
- semantic versioning
- references
- minimum evidence thresholds
- look-alikes and tags
- registry, search, filtering and snapshot
- validation and duplicate protection

SEED CATALOG
------------
- CELL-BLAST
- CELL-REACTIVE-LYMPHOCYTE
- CELL-PLASMA-CELL

The seed catalog exists to validate the foundation. The full library will be
expanded in CI-002B.

NEW ENDPOINT
------------
GET /knowledge/morphology/status
Authorization: Bearer <API_TOKEN>

VALIDATE
--------
node --check server.js
node --check ai\knowledge\morphology\index.js
node tests\ci002a_domain_test.mjs
node tests\ci002a_registry_test.mjs
node tests\ci002a_validation_test.mjs
node tests\ci002a_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC KNOWLEDGE FOUNDATION: 3 entities
