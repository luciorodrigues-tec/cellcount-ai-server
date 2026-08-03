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
    return `{${Object.entries(value)
      .sort(([first], [second]) =>
        first.localeCompare(second),
      )
      .map(
        ([key, nested]) =>
          `${JSON.stringify(key)}:${stableSerialize(nested)}`,
      )
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export class ValueObject {
  #props;
  #canonical;

  constructor(props = {}) {
    if (
      props == null ||
      typeof props !== "object" ||
      Array.isArray(props)
    ) {
      throw new TypeError(
        "ValueObject props must be an object.",
      );
    }

    this.#props =
      deepFreeze(
        structuredClone(props),
      );

    this.#canonical =
      stableSerialize(this.#props);

    Object.freeze(this);
  }

  get props() {
    return this.#props;
  }

  equals(other) {
    return (
      other instanceof ValueObject &&
      this.constructor ===
        other.constructor &&
      this.#canonical ===
        other.#canonical
    );
  }

  toJSON() {
    return this.#props;
  }
}
