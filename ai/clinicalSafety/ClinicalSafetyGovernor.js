import {
  applyBoneMarrowSafetyGovernor,
} from "./governors/BoneMarrowSafetyGovernor.js";

const MARROW_TYPES = new Set([
  "BONE_MARROW_ASPIRATE",
  "BONE_MARROW_BIOPSY",
  "HEMODILUTED_BONE_MARROW",
]);

export function applyClinicalSafetyGovernor(
  result = {},
  {
    specimenGate = {},
  } = {},
) {
  const specimenType =
    String(
      specimenGate.specimenType ||
      result.specimenType ||
      result.specimenDecision?.effectiveType ||
      "",
    ).toUpperCase();

  if (MARROW_TYPES.has(specimenType)) {
    return applyBoneMarrowSafetyGovernor(
      result,
    );
  }

  return result;
}
