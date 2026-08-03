import {
  createQualityMetric,
} from "../domain/QualityMetric.js";

import {
  createQualityThreshold,
} from "../domain/QualityThreshold.js";

export const QUALITY_ASSURANCE_CONTEXT_MAPPER_VERSION =
  "CGL-000005-S3-v1.0.0";

export class QualityAssuranceContextMapper {
  mapMetrics({
    reasoningResult = null,
    consensusResult = null,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    validationResult = null,
    safetyGateResult = null,
    auditRecord = null,
    provenanceRecord = null,
    policyResult = null,
    guidelineResult = null,
    operationalMetrics = {},
  } = {}) {
    const metrics = [];

    const pushMetric = ({
      metricId,
      name,
      category,
      value,
      unit = null,
      threshold = null,
      source,
      metadata = {},
    }) => {
      if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
      ) {
        return;
      }

      metrics.push(
        createQualityMetric({
          metricId,
          name,
          category,
          value: Number(value),
          unit,
          threshold,
          source,
          metadata,
        }),
      );
    };

    pushMetric({
      metricId: "QA-CONFIDENCE",
      name: "Calibrated confidence",
      category: "AI",
      value:
        confidenceCalibrationResult
          ?.finalConfidenceScore,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-CONFIDENCE-MIN",
          operator: "GTE",
          value: 0.65,
          severity: "HIGH",
        }),
      source: "CRR-000030",
    });

    pushMetric({
      metricId: "QA-UNCERTAINTY",
      name: "Diagnostic uncertainty",
      category: "AI",
      value:
        uncertaintyResult
          ?.totalUncertaintyScore,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-UNCERTAINTY-MAX",
          operator: "LTE",
          value: 0.35,
          severity: "HIGH",
        }),
      source: "CRR-000031",
    });

    pushMetric({
      metricId: "QA-CONSENSUS",
      name: "Consensus score",
      category: "CLINICAL",
      value:
        consensusResult?.consensusScore ??
        consensusResult?.score,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-CONSENSUS-MIN",
          operator: "GTE",
          value: 0.70,
          severity: "MEDIUM",
        }),
      source: "CRR-000029",
    });

    pushMetric({
      metricId: "QA-VALIDATION",
      name: "Clinical validation passed",
      category: "CLINICAL",
      value:
        validationResult
          ? validationResult.validated === true ||
            validationResult.isValid === true
            ? 1
            : 0
          : null,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-VALIDATION-REQUIRED",
          operator: "EQ",
          value: 1,
          severity: "CRITICAL",
        }),
      source: "CRR-000033",
    });

    pushMetric({
      metricId: "QA-SAFETY-RELEASE",
      name: "Safety release allowed",
      category: "SAFETY",
      value:
        safetyGateResult
          ? safetyGateResult.releaseAllowed === true
            ? 1
            : 0
          : null,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-SAFETY-RELEASE-REQUIRED",
          operator: "EQ",
          value: 1,
          severity: "CRITICAL",
        }),
      source: "CRR-000034",
    });

    pushMetric({
      metricId: "QA-AUDIT-PRESENT",
      name: "Audit record present",
      category: "COMPLIANCE",
      value:
        auditRecord ? 1 : 0,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-AUDIT-REQUIRED",
          operator: "EQ",
          value: 1,
          severity: "HIGH",
        }),
      source: "CGL-000001",
    });

    pushMetric({
      metricId: "QA-PROVENANCE-PRESENT",
      name: "Provenance record present",
      category: "COMPLIANCE",
      value:
        provenanceRecord ? 1 : 0,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-PROVENANCE-REQUIRED",
          operator: "EQ",
          value: 1,
          severity: "HIGH",
        }),
      source: "CGL-000002",
    });

    pushMetric({
      metricId: "QA-POLICY-APPLIED",
      name: "Clinical policy applied",
      category: "COMPLIANCE",
      value:
        policyResult?.decision ? 1 : 0,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-POLICY-REQUIRED",
          operator: "EQ",
          value: 1,
          severity: "MEDIUM",
        }),
      source: "CGL-000003",
    });

    pushMetric({
      metricId: "QA-GUIDELINE-EXECUTED",
      name: "Clinical guideline executed",
      category: "COMPLIANCE",
      value:
        guidelineResult
          ?.primaryExecutionResult
          ? 1
          : 0,
      threshold:
        createQualityThreshold({
          thresholdId:
            "QA-GUIDELINE-REQUIRED",
          operator: "EQ",
          value: 1,
          severity: "MEDIUM",
        }),
      source: "CGL-000004",
    });

    for (const [key, value] of Object.entries(
      operationalMetrics,
    )) {
      pushMetric({
        metricId:
          `QA-OP-${String(key).toUpperCase()}`,
        name: String(key),
        category: "OPERATIONAL",
        value,
        source: "RUNTIME",
      });
    }

    return Object.freeze(metrics);
  }
}
