import {
  createAuditSnapshot,
} from "../domain/AuditSnapshot.js";

import {
  AuditIntegrityCalculator,
} from "./AuditIntegrityCalculator.js";

export const AUDIT_SNAPSHOT_BUILDER_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditSnapshotBuilder {
  constructor({
    integrityCalculator =
      new AuditIntegrityCalculator(),
    clock = () => new Date(),
  } = {}) {
    this.integrityCalculator =
      integrityCalculator;
    this.clock = clock;
  }

  build({
    snapshotId,
    sequence,
    state,
  } = {}) {
    const integrity =
      this.integrityCalculator.calculate(state);

    return createAuditSnapshot({
      snapshotId,
      createdAt:
        this.clock().toISOString(),
      sequence,
      state,
      stateHash: integrity.hash,
    });
  }
}
