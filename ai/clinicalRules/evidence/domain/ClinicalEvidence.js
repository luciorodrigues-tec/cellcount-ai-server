export const CLINICAL_EVIDENCE_SCHEMA_VERSION =
  "CRR-000003-v1";

export const EVIDENCE_LEVELS = Object.freeze([
  "UNSPECIFIED",
  "EXPERT_CONSENSUS",
  "OBSERVATIONAL",
  "VALIDATED_COHORT",
  "SYSTEMATIC_REVIEW",
  "GUIDELINE",
  "REGULATORY",
]);

export const EVIDENCE_STATUSES = Object.freeze([
  "DRAFT",
  "ACTIVE",
  "SUPERSEDED",
  "RETRACTED",
  "EXPIRED",
]);

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/i;
const PMID_PATTERN = /^\d{1,9}$/;
const YEAR_PATTERN = /^(19|20)\d{2}$/;

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

export function createEvidenceSource({
  id,
  title,
  sourceType,
  citation,
  authors = [],
  year = null,
  doi = null,
  pmid = null,
  url = null,
  publisher = null,
  status = "ACTIVE",
  validFrom = null,
  validUntil = null,
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("EvidenceSource.id is required.");
  }

  if (!title || !String(title).trim()) {
    throw new TypeError("EvidenceSource.title is required.");
  }

  if (!sourceType || !String(sourceType).trim()) {
    throw new TypeError(
      "EvidenceSource.sourceType is required.",
    );
  }

  if (!citation || !String(citation).trim()) {
    throw new TypeError(
      "EvidenceSource.citation is required.",
    );
  }

  const normalizedStatus = String(status)
    .trim()
    .toUpperCase();

  if (!EVIDENCE_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported evidence status: ${normalizedStatus}`,
    );
  }

  const normalizedYear =
    year === null || year === undefined
      ? null
      : String(year).trim();

  if (
    normalizedYear !== null &&
    !YEAR_PATTERN.test(normalizedYear)
  ) {
    throw new TypeError(
      "EvidenceSource.year must be a four-digit year.",
    );
  }

  const normalizedDoi = nullableString(doi);

  if (
    normalizedDoi !== null &&
    !DOI_PATTERN.test(normalizedDoi)
  ) {
    throw new TypeError(
      "EvidenceSource.doi has an invalid format.",
    );
  }

  const normalizedPmid = nullableString(pmid);

  if (
    normalizedPmid !== null &&
    !PMID_PATTERN.test(normalizedPmid)
  ) {
    throw new TypeError(
      "EvidenceSource.pmid has an invalid format.",
    );
  }

  return Object.freeze({
    schemaVersion: CLINICAL_EVIDENCE_SCHEMA_VERSION,
    id: String(id).trim(),
    title: String(title).trim(),
    sourceType: String(sourceType).trim().toUpperCase(),
    citation: String(citation).trim(),
    authors: uniqueStrings(authors),
    year: normalizedYear,
    doi: normalizedDoi,
    pmid: normalizedPmid,
    url: nullableString(url),
    publisher: nullableString(publisher),
    status: normalizedStatus,
    validFrom: nullableString(validFrom),
    validUntil: nullableString(validUntil),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}

export function createRuleEvidenceBinding({
  ruleId,
  ruleVersion,
  evidenceLevel = "UNSPECIFIED",
  sourceIds = [],
  rationale = "",
  limitations = [],
  validFrom = null,
  validUntil = null,
  status = "ACTIVE",
  reviewedBy = null,
  reviewedAt = null,
  metadata = {},
} = {}) {
  if (!ruleId || !String(ruleId).trim()) {
    throw new TypeError(
      "RuleEvidenceBinding.ruleId is required.",
    );
  }

  if (!ruleVersion || !String(ruleVersion).trim()) {
    throw new TypeError(
      "RuleEvidenceBinding.ruleVersion is required.",
    );
  }

  const normalizedLevel = String(evidenceLevel)
    .trim()
    .toUpperCase();

  if (!EVIDENCE_LEVELS.includes(normalizedLevel)) {
    throw new TypeError(
      `Unsupported evidence level: ${normalizedLevel}`,
    );
  }

  const normalizedStatus = String(status)
    .trim()
    .toUpperCase();

  if (!EVIDENCE_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported evidence status: ${normalizedStatus}`,
    );
  }

  return Object.freeze({
    schemaVersion: CLINICAL_EVIDENCE_SCHEMA_VERSION,
    ruleId: String(ruleId).trim(),
    ruleVersion: String(ruleVersion).trim(),
    evidenceLevel: normalizedLevel,
    sourceIds: uniqueStrings(sourceIds),
    rationale: String(rationale || "").trim(),
    limitations: uniqueStrings(limitations),
    validFrom: nullableString(validFrom),
    validUntil: nullableString(validUntil),
    status: normalizedStatus,
    reviewedBy: nullableString(reviewedBy),
    reviewedAt: nullableString(reviewedAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
