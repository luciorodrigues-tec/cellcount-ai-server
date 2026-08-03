import assert from "node:assert/strict";
import test from "node:test";

import {
  createDashboardScope,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardScope.js";

import {
  createDashboardPeriod,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardPeriod.js";

import {
  createDashboardFilter,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardFilter.js";

import {
  DashboardMetricAggregator,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardMetricAggregator.js";

import {
  DashboardAlertAggregator,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardAlertAggregator.js";

import {
  DashboardWidgetFactory,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardWidgetFactory.js";

import {
  DashboardFilterEngine,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardFilterEngine.js";

import {
  DashboardSnapshotBuilder,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardSnapshotBuilder.js";

import {
  DashboardValidationService,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardValidationService.js";

import {
  DashboardSerializer,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardSerializer.js";

import {
  DashboardExporter,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/DashboardExporter.js";

import {
  ClinicalGovernanceDashboardEngine,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/application/ClinicalGovernanceDashboardEngine.js";

const fixedClock = () =>
  new Date("2026-07-30T12:00:00.000Z");

const period =
  createDashboardPeriod({
    startedAt:
      "2026-07-01T00:00:00.000Z",
    endedAt:
      "2026-07-31T23:59:59.000Z",
  });

const engine = () =>
  new ClinicalGovernanceDashboardEngine({
    metricAggregator:
      new DashboardMetricAggregator(),
    alertAggregator:
      new DashboardAlertAggregator(),
    widgetFactory:
      new DashboardWidgetFactory(),
    snapshotBuilder:
      new DashboardSnapshotBuilder(),
    validationService:
      new DashboardValidationService(),
    clock: fixedClock,
  });

test("metric aggregator creates governance metrics", () => {
  const metrics =
    new DashboardMetricAggregator()
      .aggregate({
        auditRecords: [{}],
        provenanceRecords: [{}],
      });

  assert.equal(
    metrics.some(
      (metric) =>
        metric.metricId ===
        "CGD-AUDIT-COUNT",
    ),
    true,
  );
});

test("metric aggregator calculates quality mean", () => {
  const metrics =
    new DashboardMetricAggregator()
      .aggregate({
        qualityRecords: [
          {
            evaluations: [
              { score: { value: 80 } },
            ],
          },
          {
            evaluations: [
              { score: { value: 100 } },
            ],
          },
        ],
      });

  assert.equal(
    metrics.find(
      (metric) =>
        metric.metricId ===
        "CGD-QUALITY-MEAN",
    ).value,
    90,
  );
});

test("alert aggregator maps quality alerts", () => {
  const alerts =
    new DashboardAlertAggregator()
      .aggregate({
        qualityRecords: [
          {
            alerts: [
              {
                alertId: "A-1",
                code: "HIGH",
                message: "Issue",
                severity: "HIGH",
                active: true,
              },
            ],
          },
        ],
        createdAt: fixedClock(),
      });

  assert.equal(alerts.length, 1);
});

test("widget factory creates default widgets", () => {
  const metrics =
    new DashboardMetricAggregator()
      .aggregate({});

  const widgets =
    new DashboardWidgetFactory()
      .createDefaultWidgets(
        metrics,
        [],
      );

  assert.equal(
    widgets.length >= 3,
    true,
  );
});

test("filter engine filters metrics", () => {
  const metrics =
    new DashboardMetricAggregator()
      .aggregate({});

  const filtered =
    new DashboardFilterEngine()
      .applyMetrics(
        metrics,
        [
          createDashboardFilter({
            filterId: "F-1",
            field: "category",
            operator: "EQ",
            value: "QUALITY",
          }),
        ],
      );

  assert.equal(
    filtered.every(
      (metric) =>
        metric.category === "QUALITY",
    ),
    true,
  );
});

test("snapshot builder generates checksum", () => {
  const snapshot =
    new DashboardSnapshotBuilder()
      .build({
        snapshotId: "S-1",
        metrics: [],
        alerts: [],
        generatedAt: fixedClock(),
      });

  assert.match(
    snapshot.checksum,
    /^[a-f0-9]{64}$/,
  );
});

test("validation accepts valid dashboard", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0001",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
    });

  const result =
    new DashboardValidationService()
      .validate(dashboard);

  assert.equal(result.valid, true);
});

test("engine builds dashboard aggregate", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0002",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      auditRecords: [{}],
    });

  assert.equal(
    dashboard.metrics.length > 0,
    true,
  );

  assert.equal(
    dashboard.snapshots.length,
    1,
  );
});

test("engine propagates safety alerts", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0003",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      safetyResults: [
        {
          releaseAllowed: false,
          requiresHumanReview: true,
        },
      ],
    });

  assert.equal(
    dashboard.alerts.length,
    1,
  );
});

test("serializer round-trips dashboard", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0004",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
    });

  const serializer =
    new DashboardSerializer();

  const restored =
    serializer.deserialize(
      serializer.serialize(dashboard),
    );

  assert.equal(
    restored.dashboardId.toString(),
    "CGD-APP-0004",
  );
});

test("exporter creates JSON payload", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0005",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
    });

  const exported =
    new DashboardExporter()
      .exportJson(dashboard);

  assert.equal(
    exported.mimeType,
    "application/json",
  );
});

test("dashboard detects critical quality alert", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0006",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      qualityRecords: [
        {
          alerts: [
            {
              alertId: "A-CRIT",
              code: "CRITICAL",
              message: "Critical issue",
              severity: "CRITICAL",
              active: true,
            },
          ],
        },
      ],
    });

  assert.equal(
    dashboard.hasCriticalAlert(),
    true,
  );
});

test("operational metrics are included", () => {
  const dashboard =
    engine().build({
      dashboardId: "CGD-APP-0007",
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      operationalMetrics: {
        uptime: 99.9,
      },
    });

  assert.equal(
    dashboard.metrics.some(
      (metric) =>
        metric.metricId ===
        "CGD-OP-UPTIME",
    ),
    true,
  );
});
