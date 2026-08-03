import {
  DiagnosticConfidenceCalibrationEngine,
} from "./application/DiagnosticConfidenceCalibrationEngine.js";

import {
  ConfidenceCalibrationRepository,
} from "./repository/ConfidenceCalibrationRepository.js";

export function createDiagnosticConfidenceCalibrationLibrary({
  policy = {},
  clock,
} = {}) {
  const repository =
    new ConfidenceCalibrationRepository();

  const engine =
    new DiagnosticConfidenceCalibrationEngine({
      policy,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    calibrateAndStore(
      input,
      { replace = false } = {},
    ) {
      const result = engine.calibrate(input);
      repository.save(result, { replace });
      return result;
    },
  });
}
