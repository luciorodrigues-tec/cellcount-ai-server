export const QUALITY_ASSURANCE_PROVENANCE_ADAPTER_VERSION =
  "CGL-000005-S3-v1.0.0";

export class QualityAssuranceProvenanceAdapter {
  toProvenancePayload(record) {
    if (!record) {
      throw new TypeError(
        "QualityAssuranceProvenanceAdapter.record is required.",
      );
    }

    const qualityNode = Object.freeze({
      nodeId:
        `QUALITY-${record.qualityAssuranceId.toString()}`,
      type: "OBSERVATION",
      label: "Quality assurance evaluation",
      metadata: Object.freeze({
        caseId: record.caseId,
        trend:
          record.trend?.direction ?? null,
      }),
    });

    const metricNodes =
      Object.freeze(
        record.metrics.map(
          (metric) =>
            Object.freeze({
              nodeId:
                `QUALITY-METRIC-${metric.metricId}`,
              type: "FEATURE",
              label:
                metric.name,
              metadata:
                Object.freeze({
                  category:
                    metric.category,
                  value:
                    metric.value,
                  unit:
                    metric.unit,
                  source:
                    metric.source,
                }),
            }),
        ),
      );

    const findingNodes =
      Object.freeze(
        record.findings.map(
          (finding) =>
            Object.freeze({
              nodeId:
                `QUALITY-FINDING-${finding.findingId}`,
              type: "OBSERVATION",
              label:
                finding.title,
              metadata:
                Object.freeze({
                  severity:
                    finding.severity,
                  category:
                    finding.category,
                }),
            }),
        ),
      );

    const reportNode =
      record.reports[0]
        ? Object.freeze({
            nodeId:
              `QUALITY-REPORT-${record.reports[0].reportId}`,
            type: "REPORT",
            label:
              record.reports[0].title,
            metadata:
              Object.freeze({
                summary:
                  record.reports[0].summary,
                score:
                  record.reports[0].score.value,
              }),
          })
        : null;

    return Object.freeze({
      qualityNode,
      metricNodes,
      findingNodes,
      reportNode,
    });
  }
}
