import crypto from "node:crypto";

import {
  createAuditIntegrity,
} from "../domain/AuditIntegrity.js";

import {
  AuditCanonicalizer,
} from "./AuditCanonicalizer.js";

export const AUDIT_INTEGRITY_CALCULATOR_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditIntegrityCalculator {
  constructor({
    algorithm = "sha256",
    canonicalizer = new AuditCanonicalizer(),
  } = {}) {
    this.algorithm = String(algorithm).toLowerCase();
    this.canonicalizer = canonicalizer;
  }

  calculate(value, { previousHash = null } = {}) {
    const canonical = this.canonicalizer.canonicalize({
      value,
      previousHash,
    });

    const hash = crypto
      .createHash(this.algorithm)
      .update(canonical)
      .digest("hex");

    return createAuditIntegrity({
      algorithm: this.algorithm,
      hash,
      previousHash,
      verified: false,
    });
  }

  verify(value, integrity) {
    if (!integrity?.hash) {
      return false;
    }

    const recalculated = this.calculate(
      value,
      {
        previousHash: integrity.previousHash,
      },
    );

    return recalculated.hash === integrity.hash;
  }
}
