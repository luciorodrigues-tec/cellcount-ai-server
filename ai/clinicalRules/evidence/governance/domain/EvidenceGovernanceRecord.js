export const EVIDENCE_GOVERNANCE_SCHEMA_VERSION =
  "CRR-000004-v1";

export const GOVERNANCE_STATUSES = Object.freeze([
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
  "RETIRED",
]);

function nullableString(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

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

export function createEvidenceGovernanceRecord({
  id,
  ruleId,
  ruleVersion,
  evidenceBindingKey,
  status = "DRAFT",
  submittedBy,
  submittedAt,
  reviewerIds = [],
  approverIds = [],
  decision = null,
  decisionRationale = "",
  decidedAt = null,
  supersedes = null,
  effectiveFrom = null,
  effectiveUntil = null,
  changeRequestId = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    ruleId,
    ruleVersion,
    evidenceBindingKey,
    submittedBy,
    submittedAt,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `EvidenceGovernanceRecord.${field} is required.`,
      );
    }
  }

  const normalizedStatus = String(status)
    .trim()
    .toUpperCase();

  if (!GOVERNANCE_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported governance status: ${normalizedStatus}`,
    );
  }

  return Object.freeze({
    schemaVersion: EVIDENCE_GOVERNANCE_SCHEMA_VERSION,
    id: String(id).trim(),
    ruleId: String(ruleId).trim(),
    ruleVersion: String(ruleVersion).trim(),
    evidenceBindingKey: String(evidenceBindingKey).trim(),
    status: normalizedStatus,
    submittedBy: String(submittedBy).trim(),
    submittedAt: String(submittedAt).trim(),
    reviewerIds: uniqueStrings(reviewerIds),
    approverIds: uniqueStrings(approverIds),
    decision: nullableString(decision),
    decisionRationale: String(
      decisionRationale || "",
    ).trim(),
    decidedAt: nullableString(decidedAt),
    supersedes: nullableString(supersedes),
    effectiveFrom: nullableString(effectiveFrom),
    effectiveUntil: nullableString(effectiveUntil),
    changeRequestId: nullableString(changeRequestId),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
