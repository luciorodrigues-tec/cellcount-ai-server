import {
  ExplainableClinicalReportGenerator,
} from "./application/ExplainableClinicalReportGenerator.js";

import {
  ClinicalReportRenderer,
} from "./application/ClinicalReportRenderer.js";

export function createExplainableClinicalReportLibrary({
  clock,
  idFactory,
  policy = {},
} = {}) {
  return Object.freeze({
    generator:
      new ExplainableClinicalReportGenerator({
        clock,
        idFactory,
        policy,
      }),
    renderer:
      new ClinicalReportRenderer(),
  });
}
