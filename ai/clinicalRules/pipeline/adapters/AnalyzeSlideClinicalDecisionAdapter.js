import {
  createClinicalDecisionRequest,
} from "../domain/ClinicalDecisionRequest.js";

export class AnalyzeSlideClinicalDecisionAdapter {
  constructor({ pipeline } = {}) {
    if (!pipeline) {
      throw new TypeError(
        "AnalyzeSlideClinicalDecisionAdapter requires a pipeline.",
      );
    }

    this.pipeline = pipeline;
  }

  async execute({
    requestId,
    body = {},
    files = [],
    metadata = {},
  } = {}) {
    const request =
      createClinicalDecisionRequest({
        requestId,
        input: {
          body,
          files,
        },
        images: files,
        manualCounts:
          body.manualCounts || null,
        morphology:
          body.morphology || null,
        patientContext:
          body.patientContext || null,
        metadata,
      });

    return this.pipeline.execute(request);
  }
}
