import {
  DiagnosticUncertaintyEngine,
} from "./application/DiagnosticUncertaintyEngine.js";

import {
  DiagnosticUncertaintyRepository,
} from "./repository/DiagnosticUncertaintyRepository.js";

export function createDiagnosticUncertaintyLibrary({
  policy = {},
  clock,
} = {}) {
  const repository =
    new DiagnosticUncertaintyRepository();

  const engine =
    new DiagnosticUncertaintyEngine({
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
