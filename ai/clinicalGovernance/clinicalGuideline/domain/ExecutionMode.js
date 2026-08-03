export const EXECUTION_MODE_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export const EXECUTION_MODES = Object.freeze([
  "AUTOMATIC",
  "ASSISTED",
  "MANUAL",
]);

export class ExecutionMode {
  constructor(value) {
    const normalized =
      String(value || "").trim().toUpperCase();

    if (!EXECUTION_MODES.includes(normalized)) {
      throw new TypeError(
        `Unsupported execution mode: ${normalized}`,
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }
}
