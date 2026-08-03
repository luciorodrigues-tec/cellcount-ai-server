export class DiseaseOntologyEngine {
  constructor({
    graphEngine,
  } = {}) {
    if (!graphEngine) {
      throw new TypeError(
        "DiseaseOntologyEngine requires a graph engine.",
      );
    }

    this.graphEngine = graphEngine;
  }

  diseaseProfile(diseaseEntityId) {
    const entity =
      this.graphEngine.repository.getEntity(
        diseaseEntityId,
      );

    if (!entity || entity.type !== "DISEASE") {
      throw new Error(
        "Disease entity is required.",
      );
    }

    const relations =
      this.graphEngine.repository.outgoingRelations(
        diseaseEntityId,
      );

    const collect = (relationType) =>
      Object.freeze(
        relations
          .filter(
            (relation) =>
              relation.type === relationType,
          )
          .map((relation) =>
            this.graphEngine.repository.getEntity(
              relation.targetEntityId,
            ),
          )
          .filter(Boolean),
      );

    return Object.freeze({
      disease: entity,
      morphologicFindings:
        collect("HAS_FINDING"),
      immunophenotype:
        collect("HAS_IMMUNOPHENOTYPE"),
      cytogenetics:
        collect("HAS_CYTOGENETIC_FINDING"),
      molecularVariants:
        collect("HAS_VARIANT"),
      confirmatoryTests:
        collect("CONFIRMED_BY"),
      requiredTests:
        collect("REQUIRES_TEST"),
      classifications:
        collect("CLASSIFIED_BY"),
      differentialDiagnoses:
        collect("DIFFERENTIAL_OF"),
      safetyStatement:
        "Ontology profile is structured knowledge support and not a definitive diagnosis.",
    });
  }

  compareDiseases(
    leftDiseaseEntityId,
    rightDiseaseEntityId,
  ) {
    const left =
      this.diseaseProfile(
        leftDiseaseEntityId,
      );
    const right =
      this.diseaseProfile(
        rightDiseaseEntityId,
      );

    const ids = (items) =>
      new Set(items.map((item) => item.id));

    const intersect = (a, b) =>
      Object.freeze(
        [...a].filter((value) => b.has(value)),
      );

    const leftFindings =
      ids(left.morphologicFindings);
    const rightFindings =
      ids(right.morphologicFindings);

    const leftTests =
      ids(left.confirmatoryTests);
    const rightTests =
      ids(right.confirmatoryTests);

    return Object.freeze({
      leftDisease:
        left.disease,
      rightDisease:
        right.disease,
      sharedMorphologicFindingIds:
        intersect(
          leftFindings,
          rightFindings,
        ),
      sharedConfirmatoryTestIds:
        intersect(
          leftTests,
          rightTests,
        ),
      distinctLeftMorphologicFindingIds:
        Object.freeze(
          [...leftFindings].filter(
            (id) => !rightFindings.has(id),
          ),
        ),
      distinctRightMorphologicFindingIds:
        Object.freeze(
          [...rightFindings].filter(
            (id) => !leftFindings.has(id),
          ),
        ),
    });
  }
}
