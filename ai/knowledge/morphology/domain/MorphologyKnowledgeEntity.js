import {
  MorphologyEntityKind,
  MorphologyKnowledgeStatus,
} from "./MorphologyEnums.js";

const ENTITY_KINDS =
  new Set(Object.values(MorphologyEntityKind));

const STATUSES =
  new Set(Object.values(MorphologyKnowledgeStatus));

function freezeArray(value = []) {
  return Object.freeze([...(Array.isArray(value) ? value : [])]);
}

export function createMorphologyKnowledgeEntity({
  id,
  version = "1.0.0",
  kind = MorphologyEntityKind.cell,
  status = MorphologyKnowledgeStatus.draft,
  displayName,
  aliases = [],
  definition = "",
  specimenTypes = [],
  lineage = "",
  positiveCriteria = [],
  negativeCriteria = [],
  exclusionCriteria = [],
  limitationCriteria = [],
  minimumEvidence = {
    minimumPositiveCriteria: 1,
    minimumWeightedScore: 1,
  },
  lookAlikes = [],
  confidenceModifiers = [],
  references = [],
  tags = [],
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("MorphologyKnowledgeEntity.id is required.");
  }

  if (!displayName || !String(displayName).trim()) {
    throw new TypeError(
      "MorphologyKnowledgeEntity.displayName is required.",
    );
  }

  if (!ENTITY_KINDS.has(kind)) {
    throw new TypeError(`Invalid entity kind: ${kind}`);
  }

  if (!STATUSES.has(status)) {
    throw new TypeError(`Invalid entity status: ${status}`);
  }

  const minPositive =
    Number(minimumEvidence?.minimumPositiveCriteria ?? 1);

  const minScore =
    Number(minimumEvidence?.minimumWeightedScore ?? 1);

  if (
    !Number.isFinite(minPositive) ||
    minPositive < 0 ||
    !Number.isFinite(minScore) ||
    minScore < 0
  ) {
    throw new TypeError(
      "minimumEvidence values must be non-negative numbers.",
    );
  }

  return Object.freeze({
    id: String(id).trim(),
    version: String(version).trim(),
    kind,
    status,
    displayName: String(displayName).trim(),
    aliases: freezeArray(
      [...new Set(aliases.map(String))],
    ),
    definition: String(definition || "").trim(),
    specimenTypes: freezeArray(
      [...new Set(specimenTypes.map(String))],
    ),
    lineage: String(lineage || "").trim(),
    positiveCriteria: freezeArray(positiveCriteria),
    negativeCriteria: freezeArray(negativeCriteria),
    exclusionCriteria: freezeArray(exclusionCriteria),
    limitationCriteria: freezeArray(limitationCriteria),
    minimumEvidence: Object.freeze({
      minimumPositiveCriteria: minPositive,
      minimumWeightedScore: minScore,
    }),
    lookAlikes: freezeArray(
      [...new Set(lookAlikes.map(String))],
    ),
    confidenceModifiers: freezeArray(confidenceModifiers),
    references: freezeArray(references),
    tags: freezeArray(
      [...new Set(tags.map(String))],
    ),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
