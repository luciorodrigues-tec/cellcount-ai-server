import {
  ClinicalRuleRepository,
} from "./repository/ClinicalRuleRepository.js";

import {
  boneMarrowSafetyClinicalRules,
} from "./catalog/boneMarrowSafetyCatalog.js";

export function createClinicalRuleLibrary() {
  const repository = new ClinicalRuleRepository();

  repository.registerMany(
    boneMarrowSafetyClinicalRules,
  );

  return Object.freeze({
    repository,
    rules: repository.list({
      activeOnly: false,
    }),
    summary: repository.summary(),
  });
}
