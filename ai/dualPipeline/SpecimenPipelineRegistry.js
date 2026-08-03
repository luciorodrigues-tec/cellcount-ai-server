export const DUAL_PIPELINE_VERSION = "CI-001C-v1";

export const SpecimenPipeline = Object.freeze({
  peripheralBlood: "peripheral_blood",
  boneMarrow: "bone_marrow",
  manual: "manual",
  blocked: "blocked",
});

const BONE_MARROW_TYPES = new Set([
  "BONE_MARROW_ASPIRATE",
  "BONE_MARROW_BIOPSY",
  "HEMODILUTED_BONE_MARROW",
]);

export function resolveSpecimenPipeline({
  specimenType = "",
  analysisSource = "ai_visual",
} = {}) {
  const normalizedType =
    String(specimenType).trim().toUpperCase();

  const normalizedSource =
    String(analysisSource).trim().toLowerCase();

  if (normalizedSource === "manual") {
    return SpecimenPipeline.manual;
  }

  if (normalizedType === "PERIPHERAL_BLOOD") {
    return SpecimenPipeline.peripheralBlood;
  }

  if (BONE_MARROW_TYPES.has(normalizedType)) {
    return SpecimenPipeline.boneMarrow;
  }

  return SpecimenPipeline.blocked;
}

export function isBoneMarrowPipeline(value) {
  return value === SpecimenPipeline.boneMarrow;
}

export function isPeripheralBloodPipeline(value) {
  return value === SpecimenPipeline.peripheralBlood;
}
