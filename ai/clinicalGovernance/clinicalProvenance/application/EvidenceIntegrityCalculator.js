import crypto from "node:crypto";

import {
  createEvidenceIntegrity,
} from "../domain/EvidenceIntegrity.js";

import {
  ProvenanceCanonicalizer,
} from "./ProvenanceCanonicalizer.js";

export const EVIDENCE_INTEGRITY_CALCULATOR_VERSION =
  "CGL-000002-S2-v1.0.0";

export class EvidenceIntegrityCalculator {
  constructor({
    algorithm = "sha256",
    canonicalizer =
      new ProvenanceCanonicalizer(),
  } = {}) {
    this.algorithm =
      String(algorithm).toLowerCase();
    this.canonicalizer = canonicalizer;
  }

  calculate(value) {
    const hash = crypto
      .createHash(this.algorithm)
      .update(
        this.canonicalizer.canonicalize(value),
      )
      .digest("hex");

    return createEvidenceIntegrity({
      algorithm: this.algorithm,
      hash,
      verified: false,
    });
  }

  verify(value, integrity) {
    if (!integrity?.hash) return false;
    return (
      this.calculate(value).hash ===
      integrity.hash
    );
  }
}
