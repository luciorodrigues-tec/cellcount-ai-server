import {
  GuidelineId,
} from "../domain/GuidelineId.js";

import {
  ClinicalGuideline,
} from "../domain/ClinicalGuideline.js";

export const GUIDELINE_SERIALIZER_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineSerializer {
  serialize(guideline, { pretty = false } = {}) {
    return JSON.stringify(
      guideline,
      null,
      pretty ? 2 : 0,
    );
  }

  deserialize(serialized) {
    const data =
      typeof serialized === "string"
        ? JSON.parse(serialized)
        : serialized;

    return new ClinicalGuideline({
      ...data,
      guidelineId:
        data.guidelineId instanceof GuidelineId
          ? data.guidelineId
          : new GuidelineId(
              data.guidelineId?.value ||
              data.guidelineId,
            ),
    });
  }
}
