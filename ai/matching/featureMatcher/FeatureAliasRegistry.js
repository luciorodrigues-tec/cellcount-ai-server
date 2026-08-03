function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export class FeatureAliasRegistry {
  constructor() {
    this._canonical = new Set();
    this._aliases = new Map();
  }

  registerCanonical(featureId) {
    const canonical =
      normalizeText(featureId);

    if (!canonical) {
      throw new TypeError(
        "Canonical feature id is required.",
      );
    }

    this._canonical.add(canonical);
    this._aliases.set(
      canonical,
      canonical,
    );

    return canonical;
  }

  registerAlias(alias, featureId) {
    const normalizedAlias =
      normalizeText(alias);

    const canonical =
      this.registerCanonical(featureId);

    if (!normalizedAlias) {
      throw new TypeError(
        "Feature alias is required.",
      );
    }

    const previous =
      this._aliases.get(normalizedAlias);

    if (
      previous &&
      previous !== canonical
    ) {
      throw new Error(
        `Alias already mapped: ${alias}`,
      );
    }

    this._aliases.set(
      normalizedAlias,
      canonical,
    );

    return canonical;
  }

  resolve(value) {
    const normalized =
      normalizeText(value);

    return (
      this._aliases.get(normalized) ||
      normalized ||
      null
    );
  }

  has(value) {
    const normalized =
      normalizeText(value);

    return this._aliases.has(normalized);
  }

  snapshot() {
    return Object.freeze({
      canonicalCount:
        this._canonical.size,
      aliasCount:
        this._aliases.size,
      aliases: Object.freeze(
        Object.fromEntries(
          this._aliases.entries(),
        ),
      ),
    });
  }
}

export function createDefaultFeatureAliasRegistry() {
  const registry =
    new FeatureAliasRegistry();

  const aliases = {
    fine_chromatin: [
      "delicate chromatin",
      "cromatina delicada",
      "cromatina fina",
      "open chromatin",
    ],
    visible_nucleoli: [
      "visible nucleolus",
      "prominent nucleoli",
      "nucleolos visiveis",
      "nucléolos visíveis",
      "nucleolo evidente",
      "nucléolo evidente",
    ],
    high_nc_ratio: [
      "high n/c ratio",
      "alta relacao nucleo citoplasma",
      "alta relação núcleo citoplasma",
      "high nucleus cytoplasm ratio",
    ],
    scant_cytoplasm: [
      "citoplasma escasso",
      "low cytoplasm",
    ],
    abundant_basophilic_cytoplasm: [
      "citoplasma basofilico abundante",
      "citoplasma basofílico abundante",
    ],
    monomorphic_population: [
      "populacao monomorfica",
      "população monomórfica",
    ],
    primary_azurophilic_granules: [
      "granulacao primaria azurofila",
      "granulação primária azurófila",
    ],
    specific_granules: [
      "granulacao especifica",
      "granulação específica",
    ],
    segmented_nucleus: [
      "nucleo segmentado",
      "núcleo segmentado",
    ],
    auer_rod: [
      "bastonete de auer",
      "auer rods",
    ],
    eccentric_nucleus: [
      "nucleo excentrico",
      "núcleo excêntrico",
    ],
    clock_face_chromatin: [
      "cromatina em roda de carro",
      "clock face",
    ],
    perinuclear_hof: [
      "halo perinuclear",
      "hof perinuclear",
    ],
    reticular_chromatin: [
      "cromatina reticulada",
    ],
    folded_kidney_nucleus: [
      "nucleo reniforme",
      "núcleo reniforme",
      "folded nucleus",
    ],
    coarse_eosinophilic_granules: [
      "granulacao eosinofilica grosseira",
      "granulação eosinofílica grosseira",
    ],
    coarse_basophilic_granules: [
      "granulacao basofilica grosseira",
      "granulação basofílica grosseira",
    ],
    round_central_nucleus: [
      "nucleo central arredondado",
      "núcleo central arredondado",
    ],
    very_large_cell: [
      "celula muito grande",
      "célula muito grande",
    ],
    large_multilobulated_nucleus: [
      "nucleo grande multilobulado",
      "núcleo grande multilobulado",
    ],
    limited_field: [
      "campo limitado",
      "limited image field",
    ],
    low_resolution: [
      "baixa resolucao",
      "baixa resolução",
      "low image resolution",
    ],
  };

  for (
    const [featureId, values]
    of Object.entries(aliases)
  ) {
    registry.registerCanonical(
      featureId,
    );

    for (const alias of values) {
      registry.registerAlias(
        alias,
        featureId,
      );
    }
  }

  return registry;
}
