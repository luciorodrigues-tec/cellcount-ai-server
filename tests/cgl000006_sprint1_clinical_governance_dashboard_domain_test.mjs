import assert from "node:assert/strict";
import test from "node:test";

import {
  DashboardId,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardId.js";

import {
  createDashboardScope,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardScope.js";

import {
  createDashboardPeriod,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardPeriod.js";

import {
  createDashboardMetric,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardMetric.js";

import {
  createDashboardWidget,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardWidget.js";

import {
  createDashboardAlert,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardAlert.js";

import {
  createDashboardSnapshot,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardSnapshot.js";

import {
  createDashboardFilter,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardFilter.js";

import {
  ClinicalGovernanceDashboard,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/ClinicalGovernanceDashboard.js";

const period =
  createDashboardPeriod({
    startedAt:
      "2026-07-01T00:00:00.000Z",
    endedAt:
      "2026-07-31T23:59:59.000Z",
  });

const metric =
  createDashboardMetric({
    metricId: "M-1",
    name: "Quality Score",
    category: "QUALITY",
    value: 95,
    unit: "score",
    sourceModule: "CGL-000005",
  });

test("DashboardId validates format", () => {
  assert.throws(
    () => new DashboardId("invalid"),
    /must match/,
  );

  assert.equal(
    new DashboardId("CGD-CLIN-0001").toString(),
    "CGD-CLIN-0001",
  );
});

test("global scope does not require target", () => {
  const scope =
    createDashboardScope({
      type: "GLOBAL",
    });

  assert.equal(scope.targetId, null);
});

test("non-global scope requires target", () => {
  assert.throws(
    () =>
      createDashboardScope({
        type: "LABORATORY",
      }),
    /targetId is required/,
  );
});

test("dashboard period validates order", () => {
  assert.throws(
    () =>
      createDashboardPeriod({
        startedAt:
          "2026-08-01T00:00:00.000Z",
        endedAt:
          "2026-07-01T00:00:00.000Z",
      }),
    /must not precede/,
  );
});

test("dashboard metric validates category", () => {
  assert.throws(
    () =>
      createDashboardMetric({
        metricId: "M-X",
        name: "Invalid",
        category: "UNKNOWN",
        value: 1,
        sourceModule: "TEST",
      }),
    /Unsupported dashboard metric category/,
  );
});

test("dashboard widget validates position", () => {
  assert.throws(
    () =>
      createDashboardWidget({
        widgetId: "W-1",
        type: "KPI",
        title: "KPI",
        position: 0,
      }),
    /positive integer/,
  );
});

test("dashboard alert validates severity", () => {
  assert.throws(
    () =>
      createDashboardAlert({
        alertId: "A-1",
        code: "X",
        message: "X",
        severity: "UNKNOWN",
        sourceModule: "TEST",
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /Unsupported dashboard alert severity/,
  );
});

test("dashboard snapshot is immutable", () => {
  const snapshot =
    createDashboardSnapshot({
      snapshotId: "S-1",
      generatedAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    Object.isFrozen(snapshot),
    true,
  );
});

test("dashboard filter is immutable", () => {
  const filter =
    createDashboardFilter({
      filterId: "F-1",
      field: "status",
      operator: "EQ",
      value: "ACTIVE",
    });

  assert.equal(
    Object.isFrozen(filter),
    true,
  );
});

test("dashboard rejects duplicate metrics", () => {
  assert.throws(
    () =>
      new ClinicalGovernanceDashboard({
        dashboardId:
          new DashboardId("CGD-CLIN-0002"),
        name: "Dashboard",
        scope:
          createDashboardScope({
            type: "GLOBAL",
          }),
        period,
        metrics: [metric, metric],
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /duplicate metric ids/,
  );
});

test("dashboard rejects widget with unknown metric", () => {
  assert.throws(
    () =>
      new ClinicalGovernanceDashboard({
        dashboardId:
          new DashboardId("CGD-CLIN-0003"),
        name: "Dashboard",
        scope:
          createDashboardScope({
            type: "GLOBAL",
          }),
        period,
        widgets: [
          createDashboardWidget({
            widgetId: "W-1",
            type: "KPI",
            title: "KPI",
            metricIds: ["M-404"],
          }),
        ],
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /unknown metric/,
  );
});

test("dashboard sorts widgets", () => {
  const dashboard =
    new ClinicalGovernanceDashboard({
      dashboardId:
        new DashboardId("CGD-CLIN-0004"),
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      metrics: [metric],
      widgets: [
        createDashboardWidget({
          widgetId: "W-2",
          type: "TABLE",
          title: "Second",
          metricIds: ["M-1"],
          position: 2,
        }),
        createDashboardWidget({
          widgetId: "W-1",
          type: "KPI",
          title: "First",
          metricIds: ["M-1"],
          position: 1,
        }),
      ],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    dashboard.widgets[0].widgetId,
    "W-1",
  );
});

test("dashboard detects critical alert", () => {
  const dashboard =
    new ClinicalGovernanceDashboard({
      dashboardId:
        new DashboardId("CGD-CLIN-0005"),
      name: "Dashboard",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      metrics: [metric],
      alerts: [
        createDashboardAlert({
          alertId: "A-1",
          code: "CRITICAL",
          message: "Critical issue",
          severity: "CRITICAL",
          sourceModule: "CGL-000005",
          createdAt:
            "2026-07-29T00:00:00.000Z",
        }),
      ],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    dashboard.hasCriticalAlert(),
    true,
  );
});
