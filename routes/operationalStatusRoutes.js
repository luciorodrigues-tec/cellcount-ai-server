/**
 * Registers authenticated operational status routes for clinical knowledge
 * components.
 *
 * The route module receives initialized engines explicitly and does not create
 * or mutate them. This keeps the HTTP composition layer deterministic while
 * preserving all public JSON contracts.
 */
export function registerOperationalStatusRoutes({
  app,
  auth,
  morphologyKnowledgeRegistry,
  morphologyCriteriaEngine,
  differentialRuleLibrary,
} = {}) {
  if (!app || typeof app.get !== "function") {
    throw new TypeError("app with get() is required");
  }

  if (typeof auth !== "function") {
    throw new TypeError("auth middleware is required");
  }

  if (!morphologyKnowledgeRegistry ||
      typeof morphologyKnowledgeRegistry.snapshot !== "function") {
    throw new TypeError("morphologyKnowledgeRegistry is required");
  }

  if (!morphologyCriteriaEngine?.criteriaRegistry ||
      typeof morphologyCriteriaEngine.criteriaRegistry.snapshot !== "function" ||
      !morphologyCriteriaEngine.featureCatalog) {
    throw new TypeError("morphologyCriteriaEngine is required");
  }

  if (!differentialRuleLibrary?.repository ||
      typeof differentialRuleLibrary.repository.snapshot !== "function") {
    throw new TypeError("differentialRuleLibrary is required");
  }

  app.get(
    "/knowledge/morphology/status",
    auth,
    (_req, res) => {
      const snapshot = morphologyKnowledgeRegistry.snapshot();

      return res.json({
        success: true,
        knowledgeEngine: {
          version: snapshot.version,
          entityCount: snapshot.size,
          entityIds: snapshot.entities.map((entity) => entity.id),
          status: "cell_library_ready",
        },
      });
    },
  );

  app.get(
    "/knowledge/morphology/criteria/status",
    auth,
    (_req, res) => {
      const criteriaSnapshot =
        morphologyCriteriaEngine.criteriaRegistry.snapshot();

      return res.json({
        success: true,
        criteriaEngine: {
          version: criteriaSnapshot.version,
          definitionCount: criteriaSnapshot.size,
          featureReferenceCount: morphologyCriteriaEngine.featureCatalog.size,
          cellDefinitionIds: criteriaSnapshot.definitions.map(
            (definition) => definition.cellId,
          ),
          status: "criteria_definition_ready",
        },
      });
    },
  );

  app.get(
    "/knowledge/morphology/differential-rules/status",
    auth,
    (_req, res) => {
      const snapshot = differentialRuleLibrary.repository.snapshot();

      return res.json({
        success: true,
        differentialRuleLibrary: {
          version: snapshot.version,
          pairCount: snapshot.size,
          ruleIds: snapshot.rules.map((rule) => rule.id),
          status: "differential_rule_library_ready",
        },
      });
    },
  );

  return app;
}
