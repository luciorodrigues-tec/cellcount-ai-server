export const RULE_EVIDENCE_ENGINE_VERSION =
  "CRR-000003-v1.0.0";

export class RuleEvidenceEngine {
  constructor({ repository } = {}) {
    if (!repository) {
      throw new TypeError(
        "RuleEvidenceEngine requires a repository.",
      );
    }

    this.repository = repository;
  }

  enrichRule(rule) {
    if (!rule || typeof rule !== "object") {
      throw new TypeError(
        "RuleEvidenceEngine.enrichRule requires a rule.",
      );
    }

    const evidence = this.repository.resolve(
      rule.id,
      rule.version,
    );

    return Object.freeze({
      ruleId: rule.id,
      ruleVersion: rule.version,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      evidence,
    });
  }

  enrichTrace(trace) {
    if (!trace || typeof trace !== "object") {
      throw new TypeError(
        "RuleEvidenceEngine.enrichTrace requires a trace.",
      );
    }

    const evidence = this.repository.resolve(
      trace.ruleId,
      trace.ruleVersion,
    );

    return Object.freeze({
      ...trace,
      evidence: Object.freeze({
        repositoryVersion:
          evidence.repositoryVersion,
        level: evidence.evidenceLevel,
        status: evidence.status,
        completeness: evidence.completeness,
        rationale: evidence.rationale,
        limitations: evidence.limitations,
        sourceCount: evidence.sources.length,
        sources: Object.freeze(
          evidence.sources.map((source) =>
            Object.freeze({
              id: source.id,
              title: source.title,
              sourceType: source.sourceType,
              citation: source.citation,
              year: source.year,
              doi: source.doi,
              pmid: source.pmid,
              url: source.url,
              status: source.status,
            }),
          ),
        ),
      }),
    });
  }

  enrichExecution(execution) {
    if (!execution || !Array.isArray(execution.traces)) {
      throw new TypeError(
        "RuleEvidenceEngine.enrichExecution requires an execution.",
      );
    }

    const traces = execution.traces.map(
      (trace) => this.enrichTrace(trace),
    );

    return Object.freeze({
      ...execution,
      evidenceEngineVersion:
        RULE_EVIDENCE_ENGINE_VERSION,
      evidenceRepositoryVersion:
        this.repository.version,
      traces: Object.freeze(traces),
    });
  }

  buildCoverageReport(rules = []) {
    return this.repository.coverageForRules(rules);
  }
}
