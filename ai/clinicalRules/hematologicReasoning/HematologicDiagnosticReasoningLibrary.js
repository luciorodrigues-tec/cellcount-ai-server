import {
  HematologicDiagnosticReasoningEngine,
} from "./application/HematologicDiagnosticReasoningEngine.js";

export function createHematologicDiagnosticReasoningLibrary({
  policy = {},
} = {}) {
  return Object.freeze({
    engine:
      new HematologicDiagnosticReasoningEngine({
        policy,
      }),
  });
}
