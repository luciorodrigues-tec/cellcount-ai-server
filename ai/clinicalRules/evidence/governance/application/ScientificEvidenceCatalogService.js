export const SCIENTIFIC_EVIDENCE_CATALOG_VERSION =
  "CRR-000004-v1.0.0";

export class ScientificEvidenceCatalogService {
  constructor({
    evidenceRepository,
    governanceRepository,
    governanceEngine,
  } = {}) {
    if (
      !evidenceRepository ||
      !governanceRepository ||
      !governanceEngine
    ) {
      throw new TypeError(
        "ScientificEvidenceCatalogService requires evidence and governance components.",
      );
    }

    this.evidenceRepository = evidenceRepository;
    this.governanceRepository =
      governanceRepository;
    this.governanceEngine = governanceEngine;
  }

  catalogEntryForRule(
    ruleId,
    ruleVersion,
    at = new Date(),
  ) {
    const evidence =
      this.evidenceRepository.resolve(
        ruleId,
        ruleVersion,
      );
    const governance =
      this.governanceRepository.latestForRule(
        ruleId,
        ruleVersion,
      );
    const usability =
      this.governanceEngine.canUseRule(
        ruleId,
        ruleVersion,
        at,
      );

    return Object.freeze({
      catalogVersion:
        SCIENTIFIC_EVIDENCE_CATALOG_VERSION,
      ruleId: String(ruleId),
      ruleVersion: String(ruleVersion),
      evidence,
      governance,
      usability,
    });
  }

  buildCatalog(rules = [], at = new Date()) {
    const entries = rules.map((rule) =>
      this.catalogEntryForRule(
        rule.id,
        rule.version,
        at,
      ),
    );

    return Object.freeze({
      catalogVersion:
        SCIENTIFIC_EVIDENCE_CATALOG_VERSION,
      totalRules: entries.length,
      approvedAndUsable: entries.filter(
        (entry) => entry.usability.allowed,
      ).length,
      pendingOrBlocked: entries.filter(
        (entry) => !entry.usability.allowed,
      ).length,
      entries: Object.freeze(entries),
    });
  }
}
