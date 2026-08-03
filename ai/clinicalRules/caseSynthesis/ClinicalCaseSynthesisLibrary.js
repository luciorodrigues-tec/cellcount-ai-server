import {
  ClinicalCaseSynthesisEngine,
} from "./application/ClinicalCaseSynthesisEngine.js";

export function createClinicalCaseSynthesisLibrary({
  policy = {},
  clock,
} = {}) {
  return Object.freeze({
    engine:
      new ClinicalCaseSynthesisEngine({
        policy,
        clock,
      }),
  });
}
