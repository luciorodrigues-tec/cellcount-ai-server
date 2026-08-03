import {
  MultiEvidenceFusionEngine,
} from "./application/MultiEvidenceFusionEngine.js";

import {
  MultiEvidenceSignalBuilder,
} from "./application/MultiEvidenceSignalBuilder.js";

import {
  FusionSignalRepository,
} from "./repository/FusionSignalRepository.js";

export function createMultiEvidenceFusionLibrary({
  signals = [],
  policy = {},
} = {}) {
  const signalRepository =
    new FusionSignalRepository();

  for (const signal of signals) {
    signalRepository.register(signal);
  }

  return Object.freeze({
    signalRepository,
    signalBuilder:
      new MultiEvidenceSignalBuilder(),
    engine:
      new MultiEvidenceFusionEngine({
        signalRepository,
        policy,
      }),
    signals: signalRepository.list(),
  });
}
