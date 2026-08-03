export function createEvidenceGraphEdge({
  id,
  source,
  target,
  type,
  weight = 0,
  data = {},
} = {}) {
  if (!source || !target) {
    throw new TypeError(
      "Evidence graph edge requires source and target.",
    );
  }

  if (!type) {
    throw new TypeError(
      "Evidence graph edge type is required.",
    );
  }

  const safeId =
    id ||
    `${source}::${type}::${target}`;

  return Object.freeze({
    id:
      String(safeId),
    source:
      String(source),
    target:
      String(target),
    type:
      String(type),
    weight:
      Number.isFinite(
        Number(weight),
      )
        ? Number(weight)
        : 0,
    data:
      Object.freeze({
        ...(data &&
        typeof data === "object"
          ? data
          : {}),
      }),
  });
}
