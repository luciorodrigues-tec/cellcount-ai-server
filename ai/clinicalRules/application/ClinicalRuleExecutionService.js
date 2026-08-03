import { randomUUID } from "node:crypto";

import {
  buildClinicalRuleExplanation,
} from "../explainability/ClinicalRuleExplanation.js";

import {
  createClinicalRuleTrace,
} from "../trace/ClinicalRuleTrace.js";

import {
  cloneAuditValue,
  readPath,
  stableFingerprint,
} from "../trace/ClinicalRuleTraceUtils.js";

const HUMAN_REVIEW_SEVERITIES = new Set([
  "critical",
  "blocking",
]);

export const CLINICAL_RULE_EXECUTION_VERSION =
  "CRR-000002-v1.0.0";

export class ClinicalRuleExecutionService {
  constructor({
    repository,
    clock = () => new Date(),
    idFactory = randomUUID,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "ClinicalRuleExecutionService requires a repository.",
      );
    }

    if (typeof clock !== "function") {
      throw new TypeError("clock must be a function.");
    }

    if (typeof idFactory !== "function") {
      throw new TypeError("idFactory must be a function.");
    }

    this.repository = repository;
    this.clock = clock;
    this.idFactory = idFactory;
  }

  evaluate(input, query = {}) {
    return this.#execute(input, query, false);
  }

  apply(input, query = {}) {
    return this.#execute(input, query, true);
  }

  #execute(input, query, applyTransformations) {
    const executionId = this.idFactory();
    const executionStartedAt = this.clock();
    const inputFingerprint = stableFingerprint(input);

    let output = input;
    const traces = [];

    const rules = this.repository.query(query);

    for (const [index, rule] of rules.entries()) {
      const startedAt = this.clock();
      const field = rule.metadata?.field || null;
      const reason = rule.metadata?.reason || null;
      const before = cloneAuditValue(
        readPath(output, field),
      );

      let matched = false;
      let applied = false;
      let error = null;

      try {
        matched = Boolean(rule.applies(output));

        if (matched && applyTransformations) {
          output = rule.apply(output);
          applied = true;
        }
      } catch (cause) {
        error = cause instanceof Error
          ? cause.message
          : String(cause);
      }

      const after = cloneAuditValue(
        readPath(output, field),
      );
      const completedAt = this.clock();

      const explanation = buildClinicalRuleExplanation({
        rule,
        matched,
        applied,
        field,
        reason,
        error,
      });

      traces.push(
        createClinicalRuleTrace({
          traceId: this.idFactory(),
          executionId,
          sequence: index + 1,
          ruleId: rule.id,
          ruleVersion: rule.version,
          category: rule.category,
          severity: rule.severity,
          matched,
          applied,
          startedAt: startedAt.toISOString(),
          completedAt: completedAt.toISOString(),
          durationMs: Math.max(
            0,
            completedAt.getTime() - startedAt.getTime(),
          ),
          field,
          before,
          after,
          reason,
          error,
          explanation,
          references: rule.references,
          evidenceLevel: rule.evidenceLevel,
          metadata: {
            repositoryVersion: this.repository.version,
            sourceModule:
              rule.metadata?.sourceModule || null,
          },
        }),
      );
    }

    const executionCompletedAt = this.clock();
    const matched = traces.filter(
      (trace) => trace.matched,
    );
    const applied = traces.filter(
      (trace) => trace.applied,
    );
    const errors = traces.filter(
      (trace) => trace.error,
    );

    const result = {
      schemaVersion: "CRR-EXECUTION-1",
      executionVersion: CLINICAL_RULE_EXECUTION_VERSION,
      executionId,
      repositoryVersion: this.repository.version,
      mode: applyTransformations ? "APPLY" : "EVALUATE",
      startedAt: executionStartedAt.toISOString(),
      completedAt: executionCompletedAt.toISOString(),
      durationMs: Math.max(
        0,
        executionCompletedAt.getTime() -
          executionStartedAt.getTime(),
      ),
      inputFingerprint,
      outputFingerprint: stableFingerprint(output),
      evaluatedCount: traces.length,
      matchedCount: matched.length,
      appliedCount: applied.length,
      errorCount: errors.length,
      requiresHumanReview: matched.some(
        (trace) =>
          HUMAN_REVIEW_SEVERITIES.has(trace.severity) ||
          trace.explanation.requiresHumanReview === true,
      ),
      traces: Object.freeze(traces),
      output,
    };

    return Object.freeze({
      ...result,
      toAuditJSON() {
        return {
          schemaVersion: result.schemaVersion,
          executionVersion: result.executionVersion,
          executionId: result.executionId,
          repositoryVersion: result.repositoryVersion,
          mode: result.mode,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          durationMs: result.durationMs,
          inputFingerprint: result.inputFingerprint,
          outputFingerprint: result.outputFingerprint,
          evaluatedCount: result.evaluatedCount,
          matchedCount: result.matchedCount,
          appliedCount: result.appliedCount,
          errorCount: result.errorCount,
          requiresHumanReview:
            result.requiresHumanReview,
          traces: result.traces,
        };
      },
    });
  }
}
