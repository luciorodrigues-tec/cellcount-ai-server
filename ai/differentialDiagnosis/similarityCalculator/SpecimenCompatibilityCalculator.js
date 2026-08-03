export function calculateSpecimenCompatibility(
  pair,
  specimenType,
) {
  const specimenTypes =
    pair?.rule?.specimenTypes || [];

  if (
    !specimenType ||
    specimenTypes.length === 0
  ) {
    return Object.freeze({
      score: 1,
      compatible: true,
      reason:
        "No specimen restriction.",
    });
  }

  const compatible =
    specimenTypes.includes(
      specimenType,
    );

  return Object.freeze({
    score:
      compatible ? 1 : 0,
    compatible,
    reason:
      compatible
        ? "Specimen is compatible with the registered differential rule."
        : "Specimen is not compatible with the registered differential rule.",
  });
}
