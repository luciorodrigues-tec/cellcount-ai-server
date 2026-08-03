import {
  assertValidCriteriaDefinition,
} from "../validation/CriteriaDefinitionValidator.js";

export const CRITERIA_REGISTRY_VERSION =
  "CI-002C.1-v1";

export class CriteriaRegistry {
  constructor({
    cellRegistry,
    featureCatalog,
    version =
      CRITERIA_REGISTRY_VERSION,
  } = {}) {
    this.version = version;
    this.cellRegistry =
      cellRegistry || null;
    this.featureCatalog =
      featureCatalog || null;
    this._definitions =
      new Map();
    this._byCell =
      new Map();
  }

  register(
    definition,
    {
      replace = false,
    } = {},
  ) {
    assertValidCriteriaDefinition(
      definition,
      {
        cellRegistry:
          this.cellRegistry,
        featureCatalog:
          this.featureCatalog,
      },
    );

    if (
      this._definitions.has(
        definition.id,
      ) &&
      !replace
    ) {
      throw new Error(
        `Criteria definition already registered: ${definition.id}`,
      );
    }

    const existingForCell =
      this._byCell.get(
        definition.cellId,
      );

    if (
      existingForCell &&
      existingForCell !== definition.id &&
      !replace
    ) {
      throw new Error(
        `Cell already has criteria definition: ${definition.cellId}`,
      );
    }

    this._definitions.set(
      definition.id,
      definition,
    );

    this._byCell.set(
      definition.cellId,
      definition.id,
    );

    return definition;
  }

  registerMany(
    definitions = [],
    options = {},
  ) {
    return definitions.map(
      (definition) =>
        this.register(
          definition,
          options,
        ),
    );
  }

  get(id) {
    return (
      this._definitions.get(id) ||
      null
    );
  }

  getByCellId(cellId) {
    const id =
      this._byCell.get(cellId);

    return id
      ? this.get(id)
      : null;
  }

  has(id) {
    return this._definitions.has(id);
  }

  hasCell(cellId) {
    return this._byCell.has(cellId);
  }

  list({
    specimenType,
  } = {}) {
    return [
      ...this._definitions.values(),
    ].filter(
      (definition) =>
        !specimenType ||
        definition.specimenTypes
          .includes(specimenType),
    );
  }

  snapshot() {
    return Object.freeze({
      version: this.version,
      size:
        this._definitions.size,
      definitions:
        Object.freeze(
          [
            ...this._definitions
              .values(),
          ],
        ),
    });
  }
}
