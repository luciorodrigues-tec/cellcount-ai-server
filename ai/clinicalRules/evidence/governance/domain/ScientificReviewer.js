export const SCIENTIFIC_REVIEWER_SCHEMA_VERSION =
  "CRR-000004-v1";

export const REVIEWER_ROLES = Object.freeze([
  "AUTHOR",
  "SCIENTIFIC_REVIEWER",
  "CLINICAL_REVIEWER",
  "APPROVER",
  "AUDITOR",
]);

function uniqueStrings(values = []) {
  return Object.freeze([
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map(String)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]);
}

export function createScientificReviewer({
  id,
  displayName,
  roles = [],
  organization = null,
  credentials = [],
  active = true,
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("ScientificReviewer.id is required.");
  }

  if (!displayName || !String(displayName).trim()) {
    throw new TypeError(
      "ScientificReviewer.displayName is required.",
    );
  }

  const normalizedRoles = uniqueStrings(
    roles.map((role) => String(role).toUpperCase()),
  );

  for (const role of normalizedRoles) {
    if (!REVIEWER_ROLES.includes(role)) {
      throw new TypeError(
        `Unsupported reviewer role: ${role}`,
      );
    }
  }

  return Object.freeze({
    schemaVersion: SCIENTIFIC_REVIEWER_SCHEMA_VERSION,
    id: String(id).trim(),
    displayName: String(displayName).trim(),
    roles: normalizedRoles,
    organization:
      organization === null
        ? null
        : String(organization).trim(),
    credentials: uniqueStrings(credentials),
    active: Boolean(active),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
