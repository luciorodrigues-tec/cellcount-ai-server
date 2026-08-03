import {
  DiagnosticNarrativeIntelligenceEngine,
} from "./application/DiagnosticNarrativeIntelligenceEngine.js";

import {
  DiagnosticNarrativeRenderer,
} from "./application/DiagnosticNarrativeRenderer.js";

export function createDiagnosticNarrativeLibrary({
  policy = {},
  clock,
} = {}) {
  return Object.freeze({
    engine:
      new DiagnosticNarrativeIntelligenceEngine({
        policy,
        clock,
      }),
    renderer:
      new DiagnosticNarrativeRenderer(),
  });
}
