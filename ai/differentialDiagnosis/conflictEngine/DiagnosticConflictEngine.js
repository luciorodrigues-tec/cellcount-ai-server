import {
  DIAGNOSTIC_CONFLICT_ENGINE_VERSION,
  mergeConflictPolicy,
} from "./ConflictPolicy.js";

import {
  analyzeConflictEvidence,
} from "./ConflictEvidenceAnalyzer.js";

import {
  calculateConflictSeverity,
} from "./ConflictSeverityCalculator.js";

import {
  balanceConflictProbabilities,
} from "./ConflictProbabilityBalancer.js";

import {
  resolveDiagnosticConflict,
} from "./ConflictResolutionEngine.js";

import {
  buildConflictSummary,
} from "./ConflictSummaryBuilder.js";

import {
  createDiagnosticConflictResult,
} from "./DiagnosticConflictResult.js";

export class DiagnosticConflictEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeConflictPolicy(policy);
  }

  analyze({
    exclusiveFeatureResult,
  } = {}) {
    if (
      !exclusiveFeatureResult ||
      typeof exclusiveFeatureResult !==
        "object"
    ) {
      throw new TypeError(
        "exclusiveFeatureResult is required.",
      );
    }

    const evidenceAnalysis =
      analyzeConflictEvidence(
        exclusiveFeatureResult,
      );

    const severity =
      calculateConflictSeverity(
        evidenceAnalysis,
        exclusiveFeatureResult,
        this.policy,
      );

    const probabilities =
      balanceConflictProbabilities({
        exclusiveFeatureResult,
        evidenceAnalysis,
        severity,
        policy:
          this.policy,
      });

    const resolution =
      resolveDiagnosticConflict({
        probabilities,
        severity,
        exclusiveFeatureResult,
        policy:
          this.policy,
      });

    const summary =
      buildConflictSummary({
        exclusiveFeatureResult,
        evidenceAnalysis,
        severity,
        probabilities,
        resolution,
      });

    return createDiagnosticConflictResult({
      version:
        DIAGNOSTIC_CONFLICT_ENGINE_VERSION,
      exclusiveFeatureResult,
      evidenceAnalysis,
      severity,
      probabilities,
      resolution,
      summary,
      metadata: {
        policy:
          this.policy,
      },
    });
  }

  analyzeMany({
    exclusiveFeatureResults = [],
  } = {}) {
    return Object.freeze(
      exclusiveFeatureResults.map(
        (exclusiveFeatureResult) =>
          this.analyze({
            exclusiveFeatureResult,
          }),
      ),
    );
  }
}
