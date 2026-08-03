function asText(value) {
  return typeof value === "string"
    ? value
    : "";
}

function deepText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(deepText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(deepText).join(" ");
  }

  return String(value);
}

function replaceText(value, patterns, replacement) {
  if (typeof value === "string") {
    let output = value;
    for (const pattern of patterns) {
      output = output.replace(pattern, replacement);
    }
    return output;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      replaceText(item, patterns, replacement),
    );
  }

  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, item] of Object.entries(value)) {
      clone[key] = replaceText(
        item,
        patterns,
        replacement,
      );
    }
    return clone;
  }

  return value;
}

export const boneMarrowSafetyRules = [
  {
    id: "BM-001",
    severity: "critical",
    description:
      "Blastos suspeitos não podem coexistir com conclusão de ausência de blastos.",
    applies(result) {
      return (
        result.boneMarrowClinicalReasoning?.blast?.concern === true &&
        /sem blastos|ausência de blastos|blastos ausentes/i.test(
          deepText(result),
        )
      );
    },
    apply(result) {
      const replacement =
        "A ausência global de blastos não pode ser afirmada; há sinal que exige revisão especializada.";
      return replaceText(
        result,
        [
          /sem blastos/gi,
          /ausência de blastos/gi,
          /blastos ausentes/gi,
        ],
        replacement,
      );
    },
    field: "structuredReport.conclusion",
    reason:
      "boneMarrowClinicalReasoning.blast.concern=true",
  },
  {
    id: "BM-002",
    severity: "critical",
    description:
      "Displasia suspeita não pode coexistir com exclusão global de displasia.",
    applies(result) {
      return (
        result.boneMarrowClinicalReasoning?.dysplasia?.suspected === true &&
        /sem displasia|ausência de displasia|displasia ausente/i.test(
          deepText(result),
        )
      );
    },
    apply(result) {
      return replaceText(
        result,
        [
          /sem displasia/gi,
          /ausência de displasia/gi,
          /displasia ausente/gi,
        ],
        "Displasia não pode ser excluída globalmente; há sinais que exigem revisão.",
      );
    },
    field: "structuredReport.conclusion",
    reason:
      "boneMarrowClinicalReasoning.dysplasia.suspected=true",
  },
  {
    id: "BM-003",
    severity: "critical",
    description:
      "Infiltração suspeita não pode coexistir com exclusão global.",
    applies(result) {
      return (
        result.boneMarrowClinicalReasoning?.infiltration?.suspected === true &&
        /sem infiltração|ausência de infiltração|infiltração ausente/i.test(
          deepText(result),
        )
      );
    },
    apply(result) {
      return replaceText(
        result,
        [
          /sem infiltração/gi,
          /ausência de infiltração/gi,
          /infiltração ausente/gi,
        ],
        "Infiltração não pode ser excluída globalmente; há sinal que exige revisão.",
      );
    },
    field: "structuredReport.conclusion",
    reason:
      "boneMarrowClinicalReasoning.infiltration.suspected=true",
  },
  {
    id: "BM-004",
    severity: "critical",
    description:
      "Amostra não avaliável não pode autorizar estimativa global de celularidade.",
    applies(result) {
      return (
        result.boneMarrowClinicalReasoning?.adequacy?.assessable === false &&
        (
          result.cellularityAssessment?.globalEstimateAllowed === true ||
          result.boneMarrowClinicalReasoning?.cellularity?.globalEstimateAllowed === true
        )
      );
    },
    apply(result) {
      return {
        ...result,
        cellularityAssessment: {
          ...(result.cellularityAssessment || {}),
          globalEstimateAllowed: false,
          estimate: null,
        },
        boneMarrowClinicalReasoning: {
          ...(result.boneMarrowClinicalReasoning || {}),
          cellularity: {
            ...(result.boneMarrowClinicalReasoning?.cellularity || {}),
            globalEstimateAllowed: false,
            estimate: null,
            interpretation:
              "A celularidade global não pode ser estimada em amostra limitada ou não representativa.",
          },
        },
      };
    },
    field: "cellularityAssessment.globalEstimateAllowed",
    reason:
      "adequacy.assessable=false",
  },
  {
    id: "BM-005",
    severity: "warning",
    description:
      "Hemodiluição exige limitação explícita das linhagens.",
    applies(result) {
      const hemodiluted =
        result.specimenType === "HEMODILUTED_BONE_MARROW" ||
        result.hemodilutionAssessment?.suspected === true;

      const claimsPreserved =
        /linhagens preservadas|maturação preservada|maturacao preservada/i.test(
          deepText({
            myeloid: result.myeloidSeries,
            erythroid: result.erythroidSeries,
            megakaryocytic: result.megakaryocyticSeries,
            report: result.structuredReport,
          }),
        );

      return hemodiluted && claimsPreserved;
    },
    apply(result) {
      return replaceText(
        result,
        [
          /linhagens preservadas/gi,
          /maturação preservada/gi,
          /maturacao preservada/gi,
        ],
        "A avaliação das linhagens é limitada pela hemodiluição e não permite afirmar preservação global.",
      );
    },
    field: "lineages",
    reason:
      "hemodilutionAssessment.suspected=true",
  },
  {
    id: "BM-006",
    severity: "critical",
    description:
      "População monomórfica não pode ser classificada como baixo risco.",
    applies(result) {
      const monomorphic =
        result.findings?.monomorphicPopulation === true;

      const lowRisk =
        /low|baixo|class_0_normal|normal/i.test(
          [
            result.marrowClinicalPriority,
            result.marrowClinicalCategory,
            result.overallAssessment?.riskCategory,
          ].join(" "),
        );

      return monomorphic && lowRisk;
    },
    apply(result) {
      return {
        ...result,
        marrowClinicalPriority:
          "specialist_review_required",
        marrowClinicalCategory:
          "MARROW_ATYPICAL_OR_INFILTRATIVE_PATTERN",
        overallAssessment: {
          ...(result.overallAssessment || {}),
          requiresHumanReview: true,
          riskCategory:
            "MARROW_ATYPICAL_OR_INFILTRATIVE_PATTERN",
        },
      };
    },
    field: "overallAssessment.riskCategory",
    reason:
      "findings.monomorphicPopulation=true",
  },
  {
    id: "BM-007",
    severity: "critical",
    description:
      "Material medular limitado não pode ser descrito como normal.",
    applies(result) {
      return (
        result.boneMarrowClinicalReasoning?.adequacy?.assessable === false &&
        /medula normal|morfologia medular normal|sem alterações medulares/i.test(
          deepText(result.structuredReport),
        )
      );
    },
    apply(result) {
      return replaceText(
        result,
        [
          /medula normal/gi,
          /morfologia medular normal/gi,
          /sem alterações medulares/gi,
        ],
        "A amostra medular é limitada ou não representativa e não permite conclusão global de normalidade.",
      );
    },
    field: "structuredReport.conclusion",
    reason:
      "adequacy.assessable=false",
  },
  {
    id: "BM-008",
    severity: "warning",
    description:
      "Material medular deve manter revisão humana obrigatória.",
    applies(result) {
      return (
        result.requiresHumanReview !== true ||
        result.overallAssessment?.requiresHumanReview !== true
      );
    },
    apply(result) {
      return {
        ...result,
        requiresHumanReview: true,
        overallAssessment: {
          ...(result.overallAssessment || {}),
          requiresHumanReview: true,
        },
      };
    },
    field: "requiresHumanReview",
    reason:
      "bone marrow pipeline policy",
  },
  {
    id: "BM-009",
    severity: "warning",
    description:
      "Limitações medulares obrigatórias devem estar presentes.",
    applies(result) {
      return !Array.isArray(result.marrowLimitations) ||
        result.marrowLimitations.length === 0;
    },
    apply(result) {
      return {
        ...result,
        marrowLimitations: [
          "A interpretação está limitada às imagens e aos campos fornecidos.",
          "Ausência de achado no campo não equivale à ausência global na medula óssea.",
        ],
      };
    },
    field: "marrowLimitations",
    reason:
      "mandatory marrow limitations",
  },
  {
    id: "BM-010",
    severity: "blocking",
    description:
      "Contrato medular incompleto bloqueia entrega.",
    applies(result) {
      return (
        result.boneMarrowOutputContract?.complete !== true ||
        !result.boneMarrowClinicalReasoning
      );
    },
    apply(result) {
      return {
        ...result,
        deliveryBlocked: true,
        blockingReason:
          "Contrato ou raciocínio clínico medular incompleto.",
      };
    },
    field: "boneMarrowOutputContract",
    reason:
      "missing mandatory marrow contract/reasoning",
  },
];

export function snapshotField(result, path) {
  const parts = asText(path).split(".");
  let current = result;

  for (const part of parts) {
    if (!part) continue;
    current = current?.[part];
  }

  return current ?? null;
}
