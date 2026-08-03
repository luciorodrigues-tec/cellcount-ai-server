import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

for (
  const rule
  of library.repository.list()
) {
  const groups = {
    shared:
      rule.sharedFeatures,
    primaryExclusive:
      rule.primaryExclusiveFeatures,
    differentialExclusive:
      rule.differentialExclusiveFeatures,
    primaryExclusion:
      rule.primaryExclusionFeatures,
    differentialExclusion:
      rule.differentialExclusionFeatures,
  };

  for (
    const [groupName, features]
    of Object.entries(groups)
  ) {
    assert.equal(
      new Set(features).size,
      features.length,
      `${rule.id}: duplicate inside ${groupName}`,
    );

    for (const featureId of features) {
      assert.equal(
        library.featureCatalog
          .has(featureId),
        true,
        `${rule.id}: ${featureId}`,
      );
    }
  }

  const shared =
    new Set(groups.shared);

  const primarySide =
    new Set([
      ...groups.primaryExclusive,
      ...groups.differentialExclusion,
    ]);

  const differentialSide =
    new Set([
      ...groups.differentialExclusive,
      ...groups.primaryExclusion,
    ]);

  for (const featureId of shared) {
    assert.equal(
      primarySide.has(featureId),
      false,
      `${rule.id}: shared/primary conflict ${featureId}`,
    );

    assert.equal(
      differentialSide.has(featureId),
      false,
      `${rule.id}: shared/differential conflict ${featureId}`,
    );
  }

  for (const featureId of primarySide) {
    assert.equal(
      differentialSide.has(featureId),
      false,
      `${rule.id}: bilateral conflict ${featureId}`,
    );
  }
}

console.log(
  "CI-002D.1 feature consistency passed.",
);
