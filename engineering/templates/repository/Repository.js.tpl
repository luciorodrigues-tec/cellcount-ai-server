export class {{CLASS_NAME}} {
  #items = new Map();

  register(id, value) {
    const key =
      String(id || "").trim();

    if (!key) {
      throw new TypeError(
        "id is required.",
      );
    }

    if (this.#items.has(key)) {
      throw new Error(
        `Duplicate id: ${key}`,
      );
    }

    this.#items.set(
      key,
      Object.freeze(value),
    );

    return this.get(key);
  }

  get(id) {
    return this.#items.get(
      String(id),
    ) || null;
  }

  snapshot() {
    return Object.freeze(
      [...this.#items.entries()],
    );
  }
}
