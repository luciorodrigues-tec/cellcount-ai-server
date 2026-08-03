import crypto from "node:crypto";

import {
  createAuditSignature,
} from "../domain/AuditSignature.js";

import {
  AuditCanonicalizer,
} from "./AuditCanonicalizer.js";

export const AUDIT_SIGNATURE_GENERATOR_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditSignatureGenerator {
  constructor({
    algorithm = "sha256",
    secret,
    signerId = "CELLCOUNT-SYSTEM",
    canonicalizer = new AuditCanonicalizer(),
    clock = () => new Date(),
  } = {}) {
    if (!secret || !String(secret)) {
      throw new TypeError(
        "AuditSignatureGenerator.secret is required.",
      );
    }

    this.algorithm = String(algorithm).toLowerCase();
    this.secret = String(secret);
    this.signerId = String(signerId);
    this.canonicalizer = canonicalizer;
    this.clock = clock;
  }

  generate({
    signatureId,
    value,
  } = {}) {
    if (!signatureId) {
      throw new TypeError(
        "AuditSignatureGenerator.signatureId is required.",
      );
    }

    const canonical =
      this.canonicalizer.canonicalize(value);

    const signature = crypto
      .createHmac(this.algorithm, this.secret)
      .update(canonical)
      .digest("hex");

    return createAuditSignature({
      signatureId,
      signerId: this.signerId,
      algorithm: `HMAC-${this.algorithm}`,
      value: signature,
      signedAt: this.clock().toISOString(),
    });
  }

  verify(value, signature) {
    if (!signature?.value) {
      return false;
    }

    const canonical =
      this.canonicalizer.canonicalize(value);

    const expected = crypto
      .createHmac(this.algorithm, this.secret)
      .update(canonical)
      .digest("hex");

    const expectedBuffer =
      Buffer.from(expected, "utf8");

    const actualBuffer =
      Buffer.from(signature.value, "utf8");

    if (
      expectedBuffer.length !==
      actualBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expectedBuffer,
      actualBuffer,
    );
  }
}
