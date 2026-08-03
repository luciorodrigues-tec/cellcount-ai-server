import assert from "node:assert/strict";
import test from "node:test";

import {
  createDashboardScope,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardScope.js";

import {
  createDashboardPeriod,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/domain/DashboardPeriod.js";

import {
  ClinicalGovernanceDashboardRepository,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/repository/ClinicalGovernanceDashboardRepository.js";

import {
  DashboardAuditAdapter,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/integration/DashboardAuditAdapter.js";

import {
  DashboardProvenanceAdapter,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/integration/DashboardProvenanceAdapter.js";

import {
  createClinicalGovernanceDashboardLibrary,
} from "../ai/clinicalGovernance/clinicalGovernanceDashboard/ClinicalGovernanceDashboardLibrary.js";

const fixedClock = () =>
  new Date("2026-07-30T15:00:00.000Z");

const period =
  createDashboardPeriod({
    startedAt:
      "2026-07-01T00:00:00.000Z",
    endedAt:
      "2026-07-31T23:59:59.000Z",
  });

const createDashboard = (
  library,
  {
    id = "CGD-INT-0001",
    scope =
      createDashboardScope({ type: "GLOBAL" }),
    safetyResults = [],
    qualityRecords = [],
  } = {},
) =>
  library.integrationService.buildAndStore({
    dashboardId: id,
    name: "Governance Dashboard",
    scope,
    period,
    auditRecords: [{}],
    provenanceRecords: [{}],
    policyResults: [{}],
    guidelineResults: [{}],
    safetyResults,
    qualityRecords,
    operationalMetrics: {
      uptime: 99.9,
    },
  });

test("repository saves and retrieves dashboard", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result = createDashboard(library);

  assert.equal(
    library.repository.getByDashboardId(
      "CGD-INT-0001",
    ),
    result.dashboard,
  );
});

test("repository rejects duplicate dashboard", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  createDashboard(library);

  assert.throws(
    () => createDashboard(library),
    /already exists/,
  );
});

test("repository finds by scope", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  createDashboard(library, {
    id: "CGD-INT-0002",
    scope:
      createDashboardScope({
        type: "LABORATORY",
        targetId: "LAB-1",
      }),
  });

  assert.equal(
    library.repository.findByScope(
      "LABORATORY",
      "LAB-1",
    ).length,
    1,
  );
});

test("repository finds by period", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  createDashboard(library, {
    id: "CGD-INT-0003",
  });

  assert.equal(
    library.repository.findByPeriod({
      startedAt:
        "2026-07-15T00:00:00.000Z",
      endedAt:
        "2026-07-20T00:00:00.000Z",
    }).length,
    1,
  );
});

test("dashboard with snapshots cannot be deleted", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  createDashboard(library, {
    id: "CGD-INT-0004",
  });

  assert.throws(
    () =>
      library.repository.delete(
        "CGD-INT-0004",
      ),
    /snapshots cannot be deleted/,
  );
});

test("integration builds and stores dashboard", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result =
    createDashboard(library, {
      id: "CGD-INT-0005",
    });

  assert.equal(
    result.dashboard.metrics.length > 0,
    true,
  );

  assert.equal(
    library.repository.count(),
    1,
  );
});

test("integration aggregates critical quality alert", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result =
    createDashboard(library, {
      id: "CGD-INT-0006",
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
    result.dashboard.hasCriticalAlert(),
    true,
  );
});

test("repository finds critical dashboards", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  createDashboard(library, {
    id: "CGD-INT-0007",
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
    library.repository.findWithCriticalAlerts().length,
    1,
  );
});

test("audit adapter creates payload", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result =
    createDashboard(library, {
      id: "CGD-INT-0008",
    });

  const payload =
    new DashboardAuditAdapter()
      .toAuditPayload(
        result.dashboard,
      );

  assert.equal(
    payload.dashboardId,
    "CGD-INT-0008",
  );
});

test("provenance adapter creates nodes", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result =
    createDashboard(library, {
      id: "CGD-INT-0009",
    });

  const payload =
    new DashboardProvenanceAdapter()
      .toProvenancePayload(
        result.dashboard,
      );

  assert.equal(
    payload.dashboardNode.type,
    "REPORT",
  );

  assert.equal(
    payload.metricNodes.length > 0,
    true,
  );
});

test("library exposes exporter and repository", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result =
    createDashboard(library, {
      id: "CGD-INT-0010",
    });

  const exported =
    library.exporter.exportJson(
      result.dashboard,
    );

  assert.equal(
    exported.mimeType,
    "application/json",
  );

  assert.equal(
    library.repository.count(),
    1,
  );
});

test("replace updates existing dashboard", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  createDashboard(library, {
    id: "CGD-INT-0011",
  });

  const replaced =
    library.integrationService.buildAndStore({
      dashboardId: "CGD-INT-0011",
      name: "Governance Dashboard Updated",
      scope:
        createDashboardScope({
          type: "GLOBAL",
        }),
      period,
      replace: true,
    });

  assert.equal(
    replaced.dashboard.name,
    "Governance Dashboard Updated",
  );
});

test("integration propagates safety alert", () => {
  const library =
    createClinicalGovernanceDashboardLibrary({
      clock: fixedClock,
    });

  const result =
    createDashboard(library, {
      id: "CGD-INT-0012",
      safetyResults: [
        {
          releaseAllowed: false,
          requiresHumanReview: true,
        },
      ],
    });

  assert.equal(
    result.dashboard.alerts.length,
    1,
  );
});
