import {
  DUAL_PIPELINE_VERSION,
  SpecimenPipeline,
  resolveSpecimenPipeline,
} from "./SpecimenPipelineRegistry.js";

function isObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value),
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function assertPeripheralIsolation(result) {
  const forbidden = [
    "boneMarrowOutputContract",
    "boneMarrowClinicalReasoning",
    "marrowSafetyValidation",
    "marrowClinicalCategory",
    "marrowClinicalPriority",
  ];

  const leaked = forbidden.filter(
    (field) => result[field] !== undefined,
  );

  return {
    passed: leaked.length === 0,
    leakedFields: leaked,
  };
}

function assertBoneMarrowCompleteness(result) {
  const required = [
    "boneMarrowOutputContract",
    "boneMarrowClinicalReasoning",
    "marrowSafetyValidation",
  ];

  const missing = required.filter(
    (field) => result[field] === undefined,
  );

  return {
    passed: missing.length === 0,
    missingFields: missing,
  };
}

export function stabilizeDualPipelineResult(
  result = {},
  {
    specimenGate = {},
    analysisSource = "ai_visual",
  } = {},
) {
  const safe = isObject(result)
    ? clone(result)
    : {};

  const specimenType =
    specimenGate.specimenType ||
    safe.specimenType ||
    safe.specimenDecision?.effectiveType ||
    "";

  const pipeline =
    resolveSpecimenPipeline({
      specimenType,
      analysisSource,
    });

  if (pipeline === SpecimenPipeline.blocked) {
    return {
      ...safe,
      dualPipelineValidation: {
        version: DUAL_PIPELINE_VERSION,
        passed: false,
        deliveryAllowed: false,
        pipeline,
        reason:
          "Tipo de espécime não possui pipeline clínico autorizado.",
      },
    };
  }

  if (pipeline === SpecimenPipeline.manual) {
    return {
      ...safe,
      dualPipelineValidation: {
        version: DUAL_PIPELINE_VERSION,
        passed: true,
        deliveryAllowed: true,
        pipeline,
        isolationPassed: true,
      },
    };
  }

  if (pipeline === SpecimenPipeline.peripheralBlood) {
    const isolation =
      assertPeripheralIsolation(safe);

    return {
      ...safe,
      dualPipelineValidation: {
        version: DUAL_PIPELINE_VERSION,
        passed: isolation.passed,
        deliveryAllowed: isolation.passed,
        pipeline,
        isolationPassed: isolation.passed,
        leakedFields: isolation.leakedFields,
      },
    };
  }

  const completeness =
    assertBoneMarrowCompleteness(safe);

  const marrowSafetyPassed =
    safe.marrowSafetyValidation
      ?.deliveryAllowed === true;

  const passed =
    completeness.passed &&
    marrowSafetyPassed;

  return {
    ...safe,
    dualPipelineValidation: {
      version: DUAL_PIPELINE_VERSION,
      passed,
      deliveryAllowed: passed,
      pipeline,
      isolationPassed: true,
      completenessPassed:
        completeness.passed,
      marrowSafetyPassed,
      missingFields:
        completeness.missingFields,
    },
  };
}
