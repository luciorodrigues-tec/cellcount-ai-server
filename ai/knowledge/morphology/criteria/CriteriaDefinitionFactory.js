import {
  CriteriaRole,
  createCriteriaDefinition,
} from "./CriteriaDefinition.js";

function firstFeatureId(criterion) {
  return (
    criterion?.featureKeys?.[0] ||
    criterion?.id ||
    ""
  );
}

function toRule(
  criterion,
  role,
) {
  return {
    featureId:
      firstFeatureId(criterion),
    role,
    weight:
      Number(criterion?.weight ?? 1),
    required:
      criterion?.required === true,
    label:
      criterion?.label || "",
    sourceCriterionId:
      criterion?.id || "",
    evidenceStrength:
      criterion?.evidenceStrength || "",
    notes:
      criterion?.notes || "",
  };
}

export function createCriteriaDefinitionFromCell(
  cell,
) {
  if (
    !cell ||
    typeof cell !== "object"
  ) {
    throw new TypeError(
      "Cell knowledge entity is required.",
    );
  }

  const positive =
    cell.positiveCriteria || [];

  const explicitlyRequired =
    positive.filter(
      (criterion) =>
        criterion.required === true,
    );

  const requiredSource =
    explicitlyRequired.length > 0
      ? explicitlyRequired
      : positive.slice(
          0,
          Math.min(
            positive.length,
            Number(
              cell.minimumEvidence
                ?.minimumPositiveCriteria || 0,
            ),
          ),
        );

  const requiredIds =
    new Set(
      requiredSource.map(
        (criterion) => criterion.id,
      ),
    );

  const required =
    requiredSource.map(
      (criterion) =>
        toRule(
          criterion,
          CriteriaRole.required,
        ),
    );

  const supportive =
    positive
      .filter(
        (criterion) =>
          !requiredIds.has(criterion.id),
      )
      .map(
        (criterion) =>
          toRule(
            criterion,
            CriteriaRole.supportive,
          ),
      );

  return createCriteriaDefinition({
    id:
      `CRITERIA-${cell.id}`,
    version: cell.version || "1.0.0",
    cellId: cell.id,
    specimenTypes:
      cell.specimenTypes || [],
    required,
    supportive,
    negative:
      (cell.negativeCriteria || [])
        .map(
          (criterion) =>
            toRule(
              criterion,
              CriteriaRole.negative,
            ),
        ),
    exclusion:
      (cell.exclusionCriteria || [])
        .map(
          (criterion) =>
            toRule(
              criterion,
              CriteriaRole.exclusion,
            ),
        ),
    limitation:
      (cell.limitationCriteria || [])
        .map(
          (criterion) =>
            toRule(
              criterion,
              CriteriaRole.limitation,
            ),
        ),
    thresholds: {
      minimumRequiredMatches:
        required.length,
      minimumPositiveMatches:
        Number(
          cell.minimumEvidence
            ?.minimumPositiveCriteria || 1,
        ),
      minimumWeightedScore:
        Number(
          cell.minimumEvidence
            ?.minimumWeightedScore || 1,
        ),
      exclusionBlockScore: 1,
      confidenceFloor: 0.15,
    },
    metadata: {
      sourceCellVersion:
        cell.version || "",
      generatedFrom:
        "CI-002B.1 Cell Knowledge Library",
    },
  });
}
