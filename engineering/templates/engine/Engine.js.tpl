export class {{CLASS_NAME}} {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      Object.freeze({
        ...policy,
      });
  }

  analyze(input) {
    if (
      input == null ||
      typeof input !== "object"
    ) {
      throw new TypeError(
        "input must be an object.",
      );
    }

    return Object.freeze({
      success: true,
      input,
    });
  }
}
