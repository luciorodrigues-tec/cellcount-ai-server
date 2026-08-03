import {
  ClinicalValidationEngine,
} from "./application/ClinicalValidationEngine.js";

import {
  ClinicalValidationRepository,
} from "./repository/ClinicalValidationRepository.js";

export function createClinicalValidationLibrary({
  policy = {},
  clock,
} = {}) {
  const repository =
    new ClinicalValidationRepository();

  const engine =
    new ClinicalValidationEngine({
      policy,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    validateAndStore(
      input,
      { replace = false } = {},
    ) {
      const result =
        engine.validate(input);

      repository.save(
        result,
        { replace },
      );

      return result;
    },
  });
}
