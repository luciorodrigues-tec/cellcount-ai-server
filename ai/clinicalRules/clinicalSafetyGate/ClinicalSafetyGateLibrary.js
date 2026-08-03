import {
  ClinicalSafetyGateEngine,
} from "./application/ClinicalSafetyGateEngine.js";

import {
  ClinicalSafetyGateRepository,
} from "./repository/ClinicalSafetyGateRepository.js";

export function createClinicalSafetyGateLibrary({
  policy = {},
  clock,
} = {}) {
  const repository =
    new ClinicalSafetyGateRepository();

  const engine =
    new ClinicalSafetyGateEngine({
      policy,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    evaluateAndStore(
      input,
      { replace = false } = {},
    ) {
      const result =
        engine.evaluate(input);

      repository.save(
        result,
        { replace },
      );

      return result;
    },
  });
}
