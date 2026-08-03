const FORBIDDEN = [
  /diagn[oó]stico confirmado/i,
  /conclus[aã]o definitiva/i,
  /o paciente possui/i,
  /confirma-se/i,
];

export function validateFinalDiagnosisSafety({
  primaryCell,
  overallConfidence,
  overallConsistency,
  executiveSummary,
  recommendations,
} = {}) {
  const text =
    JSON.stringify({
      executiveSummary,
      recommendations,
    });

  const violations =
    FORBIDDEN
      .filter((pattern) => pattern.test(text))
      .map((pattern) => pattern.toString());

  const probabilityValid =
    Number(overallConfidence) >= 0 &&
    Number(overallConfidence) <= 1;

  const consistencyValid =
    Number(overallConsistency) >= 0 &&
    Number(overallConsistency) <= 1;

  const hasPrimary =
    Boolean(primaryCell);

  return Object.freeze({
    safe:
      violations.length === 0 &&
      probabilityValid &&
      consistencyValid &&
      hasPrimary,
    violations:
      Object.freeze(violations),
    checks:
      Object.freeze({
        hasPrimary,
        probabilityValid,
        consistencyValid,
        nonDefinitiveLanguage:
          violations.length === 0,
      }),
    safetyStatement:
      "Resultado destinado a apoio à decisão morfológica; requer correlação clínica, laboratorial e revisão profissional.",
  });
}
