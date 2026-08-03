import {
  DomainError,
} from "./DomainError.js";

function normalizeError(error) {
  if (error instanceof DomainError) {
    return error;
  }

  if (error instanceof Error) {
    return new DomainError(
      error.message,
      {
        code:
          "UNEXPECTED_ERROR",
        cause:
          error,
      },
    );
  }

  return new DomainError(
    String(error || "Unknown error."),
    {
      code:
        "UNKNOWN_ERROR",
    },
  );
}

export class DomainResult {
  #success;
  #value;
  #errors;
  #metadata;

  constructor({
    success,
    value,
    errors = [],
    metadata = {},
  }) {
    this.#success =
      success === true;

    this.#value =
      value;

    this.#errors =
      Object.freeze(
        errors.map(
          normalizeError,
        ),
      );

    this.#metadata =
      Object.freeze(
        structuredClone(metadata),
      );

    if (
      this.#success &&
      this.#errors.length > 0
    ) {
      throw new TypeError(
        "Successful result cannot contain errors.",
      );
    }

    if (
      !this.#success &&
      this.#errors.length === 0
    ) {
      throw new TypeError(
        "Failed result must contain at least one error.",
      );
    }

    Object.freeze(this);
  }

  static success(
    value,
    metadata = {},
  ) {
    return new DomainResult({
      success: true,
      value,
      metadata,
    });
  }

  static failure(
    errors,
    metadata = {},
  ) {
    const list =
      Array.isArray(errors)
        ? errors
        : [errors];

    return new DomainResult({
      success: false,
      errors: list,
      metadata,
    });
  }

  get isSuccess() {
    return this.#success;
  }

  get isFailure() {
    return !this.#success;
  }

  get value() {
    if (this.isFailure) {
      throw new Error(
        "Cannot access value of a failed result.",
      );
    }

    return this.#value;
  }

  get errors() {
    return this.#errors;
  }

  get metadata() {
    return this.#metadata;
  }

  map(transform) {
    if (this.isFailure) {
      return this;
    }

    try {
      return DomainResult.success(
        transform(this.#value),
        this.#metadata,
      );
    } catch (error) {
      return DomainResult.failure(
        error,
        this.#metadata,
      );
    }
  }

  flatMap(transform) {
    if (this.isFailure) {
      return this;
    }

    try {
      const result =
        transform(this.#value);

      if (
        !(result instanceof DomainResult)
      ) {
        throw new TypeError(
          "flatMap transform must return DomainResult.",
        );
      }

      return result;
    } catch (error) {
      return DomainResult.failure(
        error,
        this.#metadata,
      );
    }
  }

  getOrElse(fallback) {
    return this.isSuccess
      ? this.#value
      : typeof fallback === "function"
        ? fallback(this.#errors)
        : fallback;
  }

  toJSON() {
    return Object.freeze({
      success:
        this.#success,
      value:
        this.#success
          ? this.#value
          : null,
      errors:
        this.#errors.map(
          (error) =>
            error.toJSON(),
        ),
      metadata:
        this.#metadata,
    });
  }
}
