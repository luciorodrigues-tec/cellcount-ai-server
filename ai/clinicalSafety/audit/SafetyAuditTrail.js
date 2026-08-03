export class SafetyAuditTrail {
  constructor() {
    this.entries = [];
  }

  add({
    rule,
    severity = "info",
    field = "",
    before = null,
    after = null,
    reason = "",
    action = "observe",
  }) {
    this.entries.push({
      rule,
      severity,
      field,
      before,
      after,
      reason,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  toJSON() {
    return [...this.entries];
  }
}
