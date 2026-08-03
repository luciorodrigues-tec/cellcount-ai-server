export function createEvidenceGraphNode({
  id,
  type,
  label,
  data = {},
  tags = [],
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError(
      "Evidence graph node id is required.",
    );
  }

  if (!type || !String(type).trim()) {
    throw new TypeError(
      "Evidence graph node type is required.",
    );
  }

  return Object.freeze({
    id:
      String(id).trim(),
    type:
      String(type).trim(),
    label:
      String(label || id),
    data:
      Object.freeze({
        ...(data &&
        typeof data === "object"
          ? data
          : {}),
      }),
    tags:
      Object.freeze([
        ...new Set(
          (tags || [])
            .map(String)
            .filter(Boolean),
        ),
      ]),
  });
}
