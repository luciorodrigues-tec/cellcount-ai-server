export const DASHBOARD_ID_VERSION =
  "CGL-000006-S1-v1.0.0";

export class DashboardId {
  constructor(value) {
    const normalized = String(value || "").trim();

    if (!/^CGD-[A-Z0-9-]{8,}$/.test(normalized)) {
      throw new TypeError(
        "DashboardId must match CGD-[A-Z0-9-]{8,}.",
      );
    }

    this.value = normalized;
    Object.freeze(this);
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return other instanceof DashboardId &&
      other.value === this.value;
  }
}
