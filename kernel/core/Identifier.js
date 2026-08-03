import { randomUUID } from "node:crypto";

function deepFreeze(value) {
  if (
    value == null ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) {
    return value;
  }

  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

function stableSerialize(value) {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries =
      Object.entries(value)
        .sort(([first], [second]) =>
          first.localeCompare(second),
        )
        .map(
          ([key, nested]) =>
            `${JSON.stringify(key)}:${stableSerialize(nested)}`,
        );

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function normalizeIdentifierValue(value) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    const normalized =
      String(value).trim();

    if (!normalized) {
      throw new TypeError(
        "Identifier value cannot be empty.",
      );
    }

    return normalized;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const keys =
      Object.keys(value);

    if (keys.length === 0) {
      throw new TypeError(
        "Composite identifier cannot be empty.",
      );
    }

    return deepFreeze(
      structuredClone(value),
    );
  }

  throw new TypeError(
    "Identifier value must be a string, number, bigint or composite object.",
  );
}

export class Identifier {
  #value;
  #canonical;

  constructor(value = randomUUID()) {
    this.#value =
      normalizeIdentifierValue(value);

    this.#canonical =
      stableSerialize(this.#value);

    Object.freeze(this);
  }

  static create(value) {
    return new Identifier(value);
  }

  static random() {
    return new Identifier();
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return (
      other instanceof Identifier &&
      this.#canonical ===
        other.#canonical
    );
  }

  toString() {
    return typeof this.#value === "string"
      ? this.#value
      : this.#canonical;
  }

  toJSON() {
    return this.#value;
  }
}
