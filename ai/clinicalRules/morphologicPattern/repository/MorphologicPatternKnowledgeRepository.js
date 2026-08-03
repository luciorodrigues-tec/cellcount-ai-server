export const MORPHOLOGIC_PATTERN_KNOWLEDGE_REPOSITORY_VERSION =
  "CRR-000026-v1.0.0";

export class MorphologicPatternKnowledgeRepository {
  constructor({
    version =
      MORPHOLOGIC_PATTERN_KNOWLEDGE_REPOSITORY_VERSION,
    policy = {},
  } = {}) {
    this.version = String(version);
    this.policy = policy;
    this._patterns = new Map();
    this._relations = new Map();
    this._aliasIndex = new Map();
  }

  registerPattern(pattern, { replace = false } = {}) {
    if (
      this._patterns.has(pattern.id) &&
      !replace
    ) {
      throw new Error(
        `Morphologic pattern already registered: ${pattern.id}`,
      );
    }

    if (
      pattern.parentPatternId &&
      this.policy.rejectUnknownParents !== false &&
      !this._patterns.has(pattern.parentPatternId)
    ) {
      throw new Error(
        `Unknown parent morphologic pattern: ${pattern.parentPatternId}`,
      );
    }

    this._patterns.set(pattern.id, pattern);

    for (const term of [
      pattern.preferredName,
      ...pattern.aliases,
    ]) {
      this._aliasIndex.set(
        String(term).trim().toLowerCase(),
        pattern.id,
      );
    }

    return pattern;
  }

  registerRelation(relation, { replace = false } = {}) {
    if (
      this._relations.has(relation.id) &&
      !replace
    ) {
      throw new Error(
        `Morphologic pattern relation already registered: ${relation.id}`,
      );
    }

    if (
      this.policy.rejectUnknownRelationEndpoints !== false &&
      (
        !this._patterns.has(relation.sourcePatternId) ||
        !this._patterns.has(relation.targetPatternId)
      )
    ) {
      throw new Error(
        "Morphologic pattern relation endpoints must be registered.",
      );
    }

    if (
      this.policy.allowSelfRelations === false &&
      relation.sourcePatternId === relation.targetPatternId
    ) {
      throw new Error(
        "Morphologic pattern self relations are not allowed.",
      );
    }

    this._relations.set(relation.id, relation);
    return relation;
  }

  getPattern(id) {
    return this._patterns.get(String(id)) || null;
  }

  resolveTerm(term) {
    const id = this._aliasIndex.get(
      String(term).trim().toLowerCase(),
    );
    return id ? this.getPattern(id) : null;
  }

  listPatterns({
    type = null,
    status = null,
  } = {}) {
    return Object.freeze(
      [...this._patterns.values()].filter(
        (item) =>
          (!type ||
            item.type ===
              String(type).trim().toUpperCase()) &&
          (!status ||
            item.status ===
              String(status).trim().toUpperCase()),
      ),
    );
  }

  listRelations({ type = null } = {}) {
    return Object.freeze(
      [...this._relations.values()].filter(
        (item) =>
          !type ||
          item.type ===
            String(type).trim().toUpperCase(),
      ),
    );
  }

  childrenOf(patternId) {
    return Object.freeze(
      [...this._patterns.values()].filter(
        (item) =>
          item.parentPatternId === String(patternId),
      ),
    );
  }
}
