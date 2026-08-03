CELLCOUNT — CI-002C.1
CRITERIA DEFINITION ENGINE V1

BASE
----
Built on CI-002B.1 Cell Knowledge Library.

IMPORTANT COMPATIBILITY NOTE
----------------------------
The full CI-002B.2 standalone Feature Library was not present in the approved
runtime package. CI-002C.1 therefore creates a strict FeatureReferenceCatalog
from the feature keys already validated inside the 15 CI-002B.1 cell entities.

This prevents invented or broken feature references and provides a compatible
bridge for the future expanded Feature Library.

NEW DOMAIN
----------
ai/knowledge/morphology/criteria/
  CriteriaDefinition.js
  CriteriaDefinitionFactory.js
  FeatureReferenceCatalog.js
  loadCriteriaEngine.js
  definitions/
    cellCriteriaDefinitions.js
  registry/
    CriteriaRegistry.js
  validation/
    CriteriaDefinitionValidator.js
  index.js

CAPABILITIES
------------
- formal required/supportive/negative/exclusion/limitation rules
- weighted feature references
- specimen-aware definitions
- per-cell thresholds
- duplicate protection
- cell-reference validation
- feature-reference validation
- semantic version validation
- immutable definitions
- registry lookup by definition or cell

DEFINITIONS
-----------
15 formal criteria definitions are generated from the approved cell library.

NEW ENDPOINT
------------
GET /knowledge/morphology/criteria/status

EXPECTED
--------
definitionCount: 15
status: criteria_definition_ready

VALIDATE
--------
node --check server.js
node --check ai\knowledge\morphology\criteria\index.js
node tests\ci002c1_definition_integrity_test.mjs
node tests\ci002c1_registry_test.mjs
node tests\ci002c1_feature_reference_test.mjs
node tests\ci002c1_weight_test.mjs
node tests\ci002c1_duplicate_test.mjs
node tests\ci002c1_server_contract_test.mjs

START
-----
npm start

EXPECTED LOG
------------
MORPHOLOGIC CRITERIA ENGINE: 15 definitions
