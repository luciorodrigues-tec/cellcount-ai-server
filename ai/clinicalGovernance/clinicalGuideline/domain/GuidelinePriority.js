export const GUIDELINE_PRIORITY_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export class GuidelinePriority {
  constructor(value) {
    const numeric = Number(value);

    if (
      !Number.isInteger(numeric) ||
      numeric < 1 ||
      numeric > 1000
    ) {
      throw new TypeError(
        "GuidelinePriority must be an integer between 1 and 1000.",
      );
    }

    this.value = numeric;
    Object.freeze(this);
  }
}
