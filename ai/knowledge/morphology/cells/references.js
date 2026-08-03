import {
  createMorphologyReference,
} from "../domain/index.js";

export const morphologyReferences = Object.freeze({
  bain: createMorphologyReference({
    id: "REF-BAIN-MORPHOLOGY",
    title:
      "Blood Cells: A Practical Guide",
    organization: "Wiley-Blackwell",
    edition: "5th",
    year: 2015,
    note:
      "Morphologic descriptions and differential considerations.",
  }),

  dacie: createMorphologyReference({
    id: "REF-DACIE-LEWIS",
    title:
      "Dacie and Lewis Practical Haematology",
    organization: "Elsevier",
    edition: "12th",
    year: 2017,
    note:
      "Practical hematology morphology reference.",
  }),

  icsH: createMorphologyReference({
    id: "REF-ICSH-MORPHOLOGY",
    title:
      "ICSH recommendations for blood cell morphology",
    organization: "ICSH",
    year: 2015,
    note:
      "Standardization-oriented morphology reference.",
  }),

  internalSafety: createMorphologyReference({
    id: "REF-CELLCOUNT-SAFETY",
    title:
      "CellCount Morphology Safety Semantics",
    organization: "CellCount",
    edition: "CI-002B.1",
    year: 2026,
    note:
      "Internal anti-overcalling, field-limitation and specimen-safety semantics.",
  }),
});
