import {
  cellKnowledgeLibrary,
} from "../../catalog/cellKnowledgeLibrary.js";

import {
  createCriteriaDefinitionFromCell,
} from "../CriteriaDefinitionFactory.js";

export const cellCriteriaDefinitions =
  Object.freeze(
    cellKnowledgeLibrary.map(
      (cell) =>
        createCriteriaDefinitionFromCell(
          cell,
        ),
    ),
  );
