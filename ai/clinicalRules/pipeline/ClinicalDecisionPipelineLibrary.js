import {
  AnalyzeSlideClinicalDecisionAdapter,
} from "./adapters/AnalyzeSlideClinicalDecisionAdapter.js";

import {
  ClinicalDecisionPipeline,
} from "./application/ClinicalDecisionPipeline.js";

export function createClinicalDecisionPipelineLibrary({
  orchestrator,
  outputMapper,
  clock,
  idFactory,
  policy = {},
} = {}) {
  const pipeline =
    new ClinicalDecisionPipeline({
      orchestrator,
      outputMapper,
      clock,
      idFactory,
      policy,
    });

  return Object.freeze({
    pipeline,
    analyzeSlideAdapter:
      new AnalyzeSlideClinicalDecisionAdapter({
        pipeline,
      }),
  });
}
