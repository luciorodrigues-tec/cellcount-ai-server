import {
  Identifier,
} from "./Identifier.js";

export class Entity {
  #id;

  constructor({
    id,
  } = {}) {
    this.#id =
      id instanceof Identifier
        ? id
        : new Identifier(id);
  }

  get id() {
    return this.#id;
  }

  equals(other) {
    if (this === other) {
      return true;
    }

    return (
      other instanceof Entity &&
      this.#id.equals(other.#id)
    );
  }

  toJSON() {
    return Object.freeze({
      id:
        this.#id.toJSON(),
    });
  }
}
