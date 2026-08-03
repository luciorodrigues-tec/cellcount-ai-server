import {
  DashboardId,
} from "../domain/DashboardId.js";

import {
  ClinicalGovernanceDashboard,
} from "../domain/ClinicalGovernanceDashboard.js";

export const DASHBOARD_SERIALIZER_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardSerializer {
  serialize(dashboard, { pretty = false } = {}) {
    return JSON.stringify(
      dashboard,
      null,
      pretty ? 2 : 0,
    );
  }

  deserialize(serialized) {
    const data =
      typeof serialized === "string"
        ? JSON.parse(serialized)
        : serialized;

    return new ClinicalGovernanceDashboard({
      ...data,
      dashboardId:
        data.dashboardId instanceof DashboardId
          ? data.dashboardId
          : new DashboardId(
              data.dashboardId?.value ||
              data.dashboardId,
            ),
    });
  }
}
