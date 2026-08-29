// ============================================================================
// CELLCOUNT ENTERPRISE — SHORT-LIVED SESSION TOKEN SERVICE
// CLEANUP-001.1 R1
// ============================================================================

import crypto from "crypto";

const TOKEN_VERSION = 1;
const TOKEN_PREFIX = "ccs1";
const DEFAULT_SCOPES = Object.freeze([
  "analysis:read",
  "analysis:write",
  "hema:ask",
  "knowledge:read",
]);

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function timingSafeStringEquals(left, right) {
  const a = Buffer.from(String(left || ""), "utf8");
  const b = Buffer.from(String(right || ""), "utf8");

  if (a.length === 0 || a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function normalizeDeviceId(value) {
  const deviceId = String(value || "").trim();

  if (!deviceId || deviceId.length > 200) {
    throw new Error("DEVICE_ID_INVALID");
  }

  return deviceId;
}

function normalizeScopes(scopes) {
  const values = Array.isArray(scopes) ? scopes : DEFAULT_SCOPES;
  const normalized = [...new Set(
    values
      .map((scope) => String(scope || "").trim())
      .filter(Boolean),
  )];

  if (normalized.length === 0 || normalized.length > 32) {
    throw new Error("SCOPES_INVALID");
  }

  return Object.freeze(normalized);
}

export function createSessionTokenService({
  signingSecret,
  ttlSeconds = 900,
  now = () => Date.now(),
  randomBytes = crypto.randomBytes,
} = {}) {
  const secret = String(signingSecret || "");

  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error(
      "session signing secret deve possuir pelo menos 32 bytes.",
    );
  }

  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error("ttlSeconds deve ser um inteiro positivo.");
  }

  function sign(encodedPayload) {
    return crypto
      .createHmac("sha256", secret)
      .update(`${TOKEN_PREFIX}.${encodedPayload}`)
      .digest("base64url");
  }

  function issue({ deviceId, scopes = DEFAULT_SCOPES } = {}) {
    const normalizedDeviceId = normalizeDeviceId(deviceId);
    const normalizedScopes = normalizeScopes(scopes);
    const issuedAt = Math.floor(now() / 1000);
    const expiresAt = issuedAt + ttlSeconds;

    const payload = {
      v: TOKEN_VERSION,
      sid: randomBytes(18).toString("base64url"),
      did: normalizedDeviceId,
      iat: issuedAt,
      exp: expiresAt,
      scopes: normalizedScopes,
    };

    const encodedPayload = encodeBase64Url(
      JSON.stringify(payload),
    );
    const signature = sign(encodedPayload);

    return Object.freeze({
      token: `${TOKEN_PREFIX}.${encodedPayload}.${signature}`,
      tokenType: "Bearer",
      expiresIn: ttlSeconds,
      expiresAt,
      scopes: normalizedScopes,
    });
  }

  function verify(token, {
    deviceId,
    requiredScopes = [],
  } = {}) {
    try {
      const normalizedDeviceId = normalizeDeviceId(deviceId);
      const parts = String(token || "").split(".");

      if (
        parts.length !== 3 ||
        parts[0] !== TOKEN_PREFIX
      ) {
        return Object.freeze({
          valid: false,
          reason: "TOKEN_FORMAT_INVALID",
        });
      }

      const [, encodedPayload, receivedSignature] = parts;
      const expectedSignature = sign(encodedPayload);

      if (
        !timingSafeStringEquals(
          receivedSignature,
          expectedSignature,
        )
      ) {
        return Object.freeze({
          valid: false,
          reason: "TOKEN_SIGNATURE_INVALID",
        });
      }

      const payload = JSON.parse(
        decodeBase64Url(encodedPayload),
      );

      if (
        payload?.v !== TOKEN_VERSION ||
        typeof payload?.sid !== "string" ||
        typeof payload?.did !== "string" ||
        !Number.isSafeInteger(payload?.iat) ||
        !Number.isSafeInteger(payload?.exp) ||
        !Array.isArray(payload?.scopes)
      ) {
        return Object.freeze({
          valid: false,
          reason: "TOKEN_PAYLOAD_INVALID",
        });
      }

      if (
        !timingSafeStringEquals(
          payload.did,
          normalizedDeviceId,
        )
      ) {
        return Object.freeze({
          valid: false,
          reason: "DEVICE_BINDING_MISMATCH",
        });
      }

      const currentTime = Math.floor(now() / 1000);

      if (payload.exp <= currentTime) {
        return Object.freeze({
          valid: false,
          reason: "TOKEN_EXPIRED",
        });
      }

      const required = normalizeScopes(
        requiredScopes.length > 0
          ? requiredScopes
          : payload.scopes,
      );

      const grantedScopes = new Set(
        payload.scopes.map((scope) => String(scope)),
      );

      if (
        requiredScopes.length > 0 &&
        required.some((scope) => !grantedScopes.has(scope))
      ) {
        return Object.freeze({
          valid: false,
          reason: "SCOPE_DENIED",
        });
      }

      return Object.freeze({
        valid: true,
        kind: "session",
        sessionId: payload.sid,
        deviceId: payload.did,
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        scopes: Object.freeze([...payload.scopes]),
      });
    } catch {
      return Object.freeze({
        valid: false,
        reason: "TOKEN_INVALID",
      });
    }
  }

  return Object.freeze({
    issue,
    verify,
    ttlSeconds,
  });
}
