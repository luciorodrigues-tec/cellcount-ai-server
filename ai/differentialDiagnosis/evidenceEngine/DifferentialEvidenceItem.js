export function createDifferentialEvidenceItem({
  id,
  featureId,
  group,
  role,
  favors,
  confidence = 0,
  coverage = 0,
  diagnosticFactor = 0,
  weight = 0,
  strength = "NONE",
  observed = false,
  conflicting = false,
  missing = false,
  statement = "",
  metadata = {},
} = {}) {
  return Object.freeze({
    id:
      id ||
      `${group}:${featureId}`,
    featureId:
      String(featureId || ""),
    group:
      String(group || ""),
    role:
      String(role || ""),
    favors:
      favors || null,
    confidence:
      Number(confidence || 0),
    coverage:
      Number(coverage || 0),
    diagnosticFactor:
      Number(
        diagnosticFactor || 0,
      ),
    weight:
      Number(weight || 0),
    strength:
      String(strength || "NONE"),
    observed:
      observed === true,
    conflicting:
      conflicting === true,
    missing:
      missing === true,
    statement:
      String(statement || ""),
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
