export const GUIDELINE_VERSION_MANAGER_VERSION =
  "CRR-000005-v1.0.0";

export class GuidelineVersionManager {
  constructor({
    repository,
    governanceEngine = null,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "GuidelineVersionManager requires a repository.",
      );
    }

    this.repository = repository;
    this.governanceEngine = governanceEngine;
  }

  resolveActiveGuideline({
    family,
    at = new Date(),
  } = {}) {
    if (!family) {
      throw new TypeError(
        "Guideline family is required.",
      );
    }

    const guideline =
      this.repository.latestActiveForFamily(
        family,
        at,
      );

    if (!guideline) {
      return Object.freeze({
        resolved: false,
        reason: "NO_ACTIVE_GUIDELINE",
        family: String(family).toUpperCase(),
      });
    }

    return Object.freeze({
      resolved: true,
      reason: "ACTIVE_GUIDELINE_RESOLVED",
      family: guideline.family,
      guideline,
      bindings:
        this.repository.listBindingsForGuideline(
          guideline.id,
          guideline.version,
        ),
    });
  }

  compareVersions({
    guidelineId,
    fromVersion,
    toVersion,
  } = {}) {
    const from = this.repository.getGuideline(
      guidelineId,
      fromVersion,
    );
    const to = this.repository.getGuideline(
      guidelineId,
      toVersion,
    );

    if (!from || !to) {
      throw new Error(
        "Both guideline versions must be registered.",
      );
    }

    const fromBindings =
      this.repository.listBindingsForGuideline(
        guidelineId,
        fromVersion,
      );
    const toBindings =
      this.repository.listBindingsForGuideline(
        guidelineId,
        toVersion,
      );

    const fromMap = new Map(
      fromBindings.map((binding) => [
        binding.ruleId,
        binding,
      ]),
    );
    const toMap = new Map(
      toBindings.map((binding) => [
        binding.ruleId,
        binding,
      ]),
    );

    const added = [];
    const removed = [];
    const changed = [];
    const unchanged = [];

    for (const [ruleId, binding] of toMap) {
      const previous = fromMap.get(ruleId);

      if (!previous) {
        added.push(binding);
      } else if (
        previous.ruleVersion !== binding.ruleVersion ||
        previous.status !== binding.status ||
        previous.rationale !== binding.rationale
      ) {
        changed.push(
          Object.freeze({
            ruleId,
            from: previous,
            to: binding,
          }),
        );
      } else {
        unchanged.push(binding);
      }
    }

    for (const [ruleId, binding] of fromMap) {
      if (!toMap.has(ruleId)) {
        removed.push(binding);
      }
    }

    return Object.freeze({
      managerVersion:
        GUIDELINE_VERSION_MANAGER_VERSION,
      guidelineId,
      fromVersion,
      toVersion,
      added: Object.freeze(added),
      removed: Object.freeze(removed),
      changed: Object.freeze(changed),
      unchanged: Object.freeze(unchanged),
      summary: Object.freeze({
        added: added.length,
        removed: removed.length,
        changed: changed.length,
        unchanged: unchanged.length,
      }),
    });
  }

  buildMigrationPlan({
    guidelineId,
    fromVersion,
    toVersion,
  } = {}) {
    const comparison = this.compareVersions({
      guidelineId,
      fromVersion,
      toVersion,
    });

    return Object.freeze({
      migrationId:
        `${guidelineId}:${fromVersion}->${toVersion}`,
      createdAt: new Date().toISOString(),
      comparison,
      actions: Object.freeze([
        ...comparison.added.map((binding) =>
          Object.freeze({
            type: "ADD_RULE_BINDING",
            ruleId: binding.ruleId,
            targetRuleVersion:
              binding.ruleVersion,
          }),
        ),
        ...comparison.changed.map((entry) =>
          Object.freeze({
            type: "UPDATE_RULE_BINDING",
            ruleId: entry.ruleId,
            fromRuleVersion:
              entry.from.ruleVersion,
            toRuleVersion:
              entry.to.ruleVersion,
          }),
        ),
        ...comparison.removed.map((binding) =>
          Object.freeze({
            type: "RETIRE_RULE_BINDING",
            ruleId: binding.ruleId,
            sourceRuleVersion:
              binding.ruleVersion,
          }),
        ),
      ]),
    });
  }

  canUseGuidelineRule({
    guidelineId,
    guidelineVersion,
    ruleId,
    ruleVersion,
    at = new Date(),
  } = {}) {
    const guideline =
      this.repository.getGuideline(
        guidelineId,
        guidelineVersion,
      );

    if (!guideline) {
      return Object.freeze({
        allowed: false,
        reason: "GUIDELINE_NOT_FOUND",
      });
    }

    const active =
      guideline.status === "ACTIVE" &&
      (!guideline.effectiveFrom ||
        at.getTime() >=
          Date.parse(guideline.effectiveFrom)) &&
      (!guideline.effectiveUntil ||
        at.getTime() <=
          Date.parse(guideline.effectiveUntil));

    if (!active) {
      return Object.freeze({
        allowed: false,
        reason: "GUIDELINE_NOT_ACTIVE",
      });
    }

    const binding =
      this.repository
        .listBindingsForGuideline(
          guidelineId,
          guidelineVersion,
        )
        .find(
          (item) =>
            item.ruleId === ruleId &&
            item.ruleVersion === ruleVersion &&
            item.status === "ACTIVE",
        );

    if (!binding) {
      return Object.freeze({
        allowed: false,
        reason: "RULE_NOT_BOUND_TO_GUIDELINE",
      });
    }

    if (this.governanceEngine) {
      const governance =
        this.governanceEngine.canUseRule(
          ruleId,
          ruleVersion,
          at,
        );

      if (!governance.allowed) {
        return Object.freeze({
          allowed: false,
          reason:
            "SCIENTIFIC_GOVERNANCE_BLOCKED",
          governance,
        });
      }
    }

    return Object.freeze({
      allowed: true,
      reason: "GUIDELINE_RULE_ALLOWED",
      guideline,
      binding,
    });
  }
}
