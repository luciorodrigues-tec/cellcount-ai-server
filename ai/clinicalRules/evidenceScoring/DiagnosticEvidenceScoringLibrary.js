import {
  DiagnosticEvidenceScoringEngine,
} from "./application/DiagnosticEvidenceScoringEngine.js";

export function createDiagnosticEvidenceScoringLibrary({
  policy = {},
} = {}) {
  return Object.freeze({
    engine:
      new DiagnosticEvidenceScoringEngine({
        policy,
      }),
  });
}
