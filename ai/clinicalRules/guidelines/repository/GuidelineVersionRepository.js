function guidelineKey(id, version) {
  return `${String(id)}@${String(version)}`;
}

function familyKey(family) {
  return String(family).trim().toUpperCase();
}

export const GUIDELINE_REPOSITORY_VERSION =
  "CRR-000005-v1.0.0";

export class GuidelineVersionRepository {
  constructor({
    version = GUIDELINE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._guidelines = new Map();
    this._byFamily = new Map();
    this._bindings = new Map();
  }

  registerGuideline(
    guideline,
    { replace = false } = {},
  ) {
    const key = guidelineKey(
      guideline.id,
      guideline.version,
    );

    if (this._guidelines.has(key) && !replace) {
      throw new Error(
        `Guideline version already registered: ${key}`,
      );
    }

    this._guidelines.set(key, guideline);

    const family = familyKey(guideline.family);
    const keys = this._byFamily.get(family) || [];

    if (!keys.includes(key)) {
      keys.push(key);
    }

    this._byFamily.set(family, keys);
    return guideline;
  }

  registerBinding(binding, { replace = false } = {}) {
    const guideline = this.getGuideline(
      binding.guidelineId,
      binding.guidelineVersion,
    );

    if (!guideline) {
      throw new Error(
        `Unknown guideline version: ${binding.guidelineId}@${binding.guidelineVersion}`,
      );
    }

    const key =
      `${binding.guidelineId}@${binding.guidelineVersion}` +
      `::${binding.ruleId}@${binding.ruleVersion}`;

    if (this._bindings.has(key) && !replace) {
      throw new Error(
        `Guideline rule binding already registered: ${key}`,
      );
    }

    this._bindings.set(key, binding);
    return binding;
  }

  getGuideline(id, version) {
    return (
      this._guidelines.get(
        guidelineKey(id, version),
      ) || null
    );
  }

  listByFamily(family) {
    const keys = this._byFamily.get(
      familyKey(family),
    ) || [];

    return Object.freeze(
      keys
        .map((key) => this._guidelines.get(key))
        .filter(Boolean),
    );
  }

  listGuidelines({ status = null } = {}) {
    return Object.freeze(
      [...this._guidelines.values()].filter(
        (guideline) =>
          !status ||
          guideline.status ===
            String(status).trim().toUpperCase(),
      ),
    );
  }

  listBindingsForGuideline(id, version) {
    const prefix = `${id}@${version}::`;

    return Object.freeze(
      [...this._bindings.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([, binding]) => binding),
    );
  }

  latestActiveForFamily(
    family,
    at = new Date(),
  ) {
    const candidates = this.listByFamily(family)
      .filter(
        (guideline) =>
          guideline.status === "ACTIVE",
      )
      .filter((guideline) => {
        const now = at.getTime();
        const from = guideline.effectiveFrom
          ? Date.parse(guideline.effectiveFrom)
          : Number.NEGATIVE_INFINITY;
        const until = guideline.effectiveUntil
          ? Date.parse(guideline.effectiveUntil)
          : Number.POSITIVE_INFINITY;

        return now >= from && now <= until;
      })
      .sort((a, b) =>
        b.version.localeCompare(
          a.version,
          undefined,
          { numeric: true },
        ),
      );

    return candidates[0] || null;
  }
}
