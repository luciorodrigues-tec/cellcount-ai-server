import {
  randomUUID,
} from "node:crypto";

import {
  createClinicalReport,
} from "../domain/ClinicalReport.js";

import {
  createClinicalReportSection,
} from "../domain/ClinicalReportSection.js";

import {
  mergeClinicalReportPolicy,
} from "../domain/ClinicalReportPolicy.js";

export const EXPLAINABLE_CLINICAL_REPORT_GENERATOR_VERSION =
  "CRR-000013-v1.0.0";

function section(
  id,
  type,
  title,
  content,
  order,
  items = [],
  metadata = {},
) {
  return createClinicalReportSection({
    id,
    type,
    title,
    content,
    items,
    order,
    metadata,
  });
}

export class ExplainableClinicalReportGenerator {
  constructor({
    clock = () => new Date(),
    idFactory = randomUUID,
    policy = {},
  } = {}) {
    this.clock = clock;
    this.idFactory = idFactory;
    this.policy =
      mergeClinicalReportPolicy(policy);
  }

  generate(clinicalDecisionResult) {
    if (!clinicalDecisionResult?.requestId) {
      throw new TypeError(
        "ExplainableClinicalReportGenerator requires a clinical decision result.",
      );
    }

    const output =
      clinicalDecisionResult.structuredOutput || {};
    const orchestration =
      clinicalDecisionResult.orchestration || {};
    const ranking =
      orchestration.finalRanking || {};
    const sections = [];

    const push = (value) => {
      if (
        this.policy.includeEmptySections ||
        value.content ||
        value.items.length > 0
      ) {
        sections.push(value);
      }
    };

    push(
      section(
        "executive-summary",
        "EXECUTIVE_SUMMARY",
        "Resumo executivo",
        output.interpretiveSynthesis ||
          "Síntese interpretativa não disponível.",
        10,
      ),
    );

    const leading =
      ranking?.synthesis?.leadingHypothesis ||
      ranking?.rankedHypotheses?.[0] ||
      null;

    push(
      section(
        "primary-hypothesis",
        "PRIMARY_HYPOTHESIS",
        "Hipótese principal",
        leading
          ? {
              id: leading.hypothesisId,
              label: leading.hypothesisLabel,
              score:
                leading.normalizedScore ??
                leading.compositeScore ??
                null,
              status: leading.status,
            }
          : null,
        20,
      ),
    );

    push(
      section(
        "differential-diagnoses",
        "DIFFERENTIAL_DIAGNOSES",
        "Diagnósticos diferenciais ranqueados",
        null,
        30,
        [
          ...(
            ranking?.rankedHypotheses ||
            output.rankedHypotheses ||
            []
          ),
        ].slice(
          0,
          this.policy.maximumDifferentialItems,
        ),
      ),
    );

    push(
      section(
        "morphologic-interpretation",
        "MORPHOLOGIC_INTERPRETATION",
        "Interpretação morfológica",
        {
          morphologicRiskClass:
            output.morphologicRiskClass ||
            "UNSPECIFIED",
          patternRecognition:
            output.patternRecognition || null,
        },
        40,
      ),
    );

    push(
      section(
        "clinical-reasoning",
        "CLINICAL_REASONING",
        "Raciocínio clínico",
        output.hematologicReasoning ||
          output.clinicalMeaning ||
          null,
        50,
        orchestration.stages || [],
      ),
    );

    push(
      section(
        "scientific-evidence",
        "SCIENTIFIC_EVIDENCE",
        "Evidência científica",
        null,
        60,
        (
          orchestration.stages || []
        ).filter((stage) =>
          [
            "RULE_EVIDENCE_ENRICHMENT",
            "CONSENSUS_DIAGNOSTIC",
          ].includes(stage.name),
        ),
      ),
    );

    push(
      section(
        "confidence-analysis",
        "CONFIDENCE_ANALYSIS",
        "Análise de confiança",
        {
          riskCategory:
            output.riskCategory ||
            "UNSPECIFIED",
          requiresHumanReview:
            clinicalDecisionResult
              .requiresHumanReview === true,
        },
        70,
        (
          orchestration.stages || []
        ).filter((stage) =>
          [
            "BAYESIAN_CONFIDENCE",
            "MULTI_EVIDENCE_FUSION",
            "DIAGNOSTIC_HYPOTHESIS_RANKING",
          ].includes(stage.name),
        ),
      ),
    );

    push(
      section(
        "safety-analysis",
        "SAFETY_ANALYSIS",
        "Análise de segurança e limitações",
        {
          requiresHumanReview:
            clinicalDecisionResult
              .requiresHumanReview === true,
          pipelineStatus:
            clinicalDecisionResult.status,
          safetyStatement:
            clinicalDecisionResult
              .safetyStatement,
        },
        80,
        [
          ...(clinicalDecisionResult.warnings || []),
          ...(clinicalDecisionResult.errors || []),
        ],
      ),
    );

    push(
      section(
        "recommendations",
        "RECOMMENDATIONS",
        "Recomendações",
        output.educationalImpact ||
          "Correlacionar com dados clínicos, laboratoriais e revisão especializada.",
        90,
        [
          ...(output.alerts || []),
        ].slice(
          0,
          this.policy.maximumAlerts,
        ),
      ),
    );

    if (this.policy.includeAuditTrail) {
      push(
        section(
          "audit-trail",
          "AUDIT_TRAIL",
          "Trilha de auditoria",
          {
            requestId:
              clinicalDecisionResult.requestId,
            executionId:
              clinicalDecisionResult.executionId,
            reportGeneratedAt:
              this.clock().toISOString(),
          },
          100,
          orchestration.stages || [],
          {
            orchestratorVersion:
              orchestration
                .orchestratorVersion ||
              null,
          },
        ),
      );
    }

    const engineVersions = {};

    if (this.policy.includeEngineVersions) {
      for (
        const stage of
        orchestration.stages || []
      ) {
        const version =
          stage.payload?.engineVersion ||
          stage.payload?.orchestratorVersion ||
          null;

        if (version) {
          engineVersions[stage.name] = version;
        }
      }
    }

    return createClinicalReport({
      reportId: this.idFactory(),
      requestId:
        clinicalDecisionResult.requestId,
      executionId:
        clinicalDecisionResult.executionId,
      sections,
      summary:
        output.interpretiveSynthesis ||
        null,
      requiresHumanReview:
        clinicalDecisionResult
          .requiresHumanReview === true ||
        (
          this.policy
            .requireHumanReviewOnMissingRanking &&
          !leading
        ) ||
        (
          this.policy
            .requireHumanReviewOnPipelineError &&
          (
            clinicalDecisionResult.errors ||
            []
          ).length > 0
        ),
      warnings:
        clinicalDecisionResult.warnings || [],
      createdAt:
        this.clock().toISOString(),
      engineVersions,
      metadata: {
        generatorVersion:
          EXPLAINABLE_CLINICAL_REPORT_GENERATOR_VERSION,
      },
    });
  }
}
