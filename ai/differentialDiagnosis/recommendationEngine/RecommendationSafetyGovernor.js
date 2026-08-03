const FORBIDDEN =
  Object.freeze([
    /diagn[oó]stico confirmado/i,
    /conclus[aã]o definitiva/i,
    /o paciente possui/i,
    /confirma-se/i,
  ]);

export function validateRecommendationSafety(
  text,
) {
  const source =
    String(text || "");

  const violations =
    FORBIDDEN
      .filter(
        (pattern) =>
          pattern.test(source),
      )
      .map(
        (pattern) =>
          pattern.toString(),
      );

  return Object.freeze({
    safe:
      violations.length === 0,
    violations:
      Object.freeze(violations),
  });
}

export function sanitizeRecommendationLanguage(
  text,
) {
  return String(text || "")
    .replace(
      /diagn[oó]stico confirmado/gi,
      "perfil morfológico sugestivo",
    )
    .replace(
      /conclus[aã]o definitiva/gi,
      "interpretação morfológica predominante",
    )
    .replace(
      /o paciente possui/gi,
      "os achados são compatíveis com",
    )
    .replace(
      /confirma-se/gi,
      "os achados favorecem",
    );
}
