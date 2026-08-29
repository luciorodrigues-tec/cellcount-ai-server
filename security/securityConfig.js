// ============================================================================
// CELLCOUNT ENTERPRISE — SECURITY CONFIGURATION
// MP-SEC-000001A + CLEANUP-001.1 R1
// ============================================================================

const DEFAULT_DEVELOPMENT_ORIGINS = Object.freeze([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
]);

const DEVELOPMENT_SESSION_SIGNING_SECRET =
  "development-only-session-signing-secret-change-me-0001";

function parsePositiveInteger(value, fallback, name) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }

  return parsed;
}

function parseBoolean(value, fallback, name) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(
    `${name} deve ser booleano (true/false, 1/0, yes/no ou on/off).`,
  );
}

export function parseAllowedOrigins(rawValue, nodeEnv = "development") {
  const configured = String(rawValue || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.includes("*")) {
    throw new Error(
      'CORS_ALLOWED_ORIGINS não pode conter "*". Use uma allowlist explícita.',
    );
  }

  if (configured.length > 0) {
    return Object.freeze([...new Set(configured)]);
  }

  if (nodeEnv === "production") {
    throw new Error(
      "CORS_ALLOWED_ORIGINS é obrigatório em produção.",
    );
  }

  return DEFAULT_DEVELOPMENT_ORIGINS;
}

export function loadSecurityConfig(env = process.env) {
  const nodeEnv = String(env.NODE_ENV || "development").trim().toLowerCase();
  const apiToken = String(env.API_TOKEN || "").trim();

  if (!apiToken) {
    throw new Error(
      "API_TOKEN é obrigatório durante a janela de migração. Configure-o como variável de ambiente.",
    );
  }

  const configuredSessionSigningSecret = String(
    env.SESSION_SIGNING_SECRET || "",
  ).trim();

  const sessionSigningSecret =
    configuredSessionSigningSecret ||
    (nodeEnv === "production"
      ? ""
      : DEVELOPMENT_SESSION_SIGNING_SECRET);

  if (!sessionSigningSecret) {
    throw new Error(
      "SESSION_SIGNING_SECRET é obrigatório em produção.",
    );
  }

  if (Buffer.byteLength(sessionSigningSecret, "utf8") < 32) {
    throw new Error(
      "SESSION_SIGNING_SECRET deve possuir pelo menos 32 bytes.",
    );
  }

  return Object.freeze({
    nodeEnv,
    apiToken,
    sessionSigningSecret,
    sessionTokenTtlSeconds: parsePositiveInteger(
      env.SESSION_TOKEN_TTL_SECONDS,
      900,
      "SESSION_TOKEN_TTL_SECONDS",
    ),
    sessionIssueMaxRequests: parsePositiveInteger(
      env.SESSION_ISSUE_MAX_REQUESTS,
      12,
      "SESSION_ISSUE_MAX_REQUESTS",
    ),
    allowLegacyApiToken: parseBoolean(
      env.ALLOW_LEGACY_API_TOKEN,
      nodeEnv !== "production",
      "ALLOW_LEGACY_API_TOKEN",
    ),
    allowedOrigins: parseAllowedOrigins(
      env.CORS_ALLOWED_ORIGINS,
      nodeEnv,
    ),
    rateLimitWindowMs: parsePositiveInteger(
      env.RATE_LIMIT_WINDOW_MS,
      60_000,
      "RATE_LIMIT_WINDOW_MS",
    ),
    rateLimitMaxRequests: parsePositiveInteger(
      env.RATE_LIMIT_MAX_REQUESTS,
      60,
      "RATE_LIMIT_MAX_REQUESTS",
    ),
    aiRateLimitMaxRequests: parsePositiveInteger(
      env.AI_RATE_LIMIT_MAX_REQUESTS,
      12,
      "AI_RATE_LIMIT_MAX_REQUESTS",
    ),
  });
}
