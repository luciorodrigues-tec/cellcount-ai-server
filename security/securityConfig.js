// ============================================================================
// CELLCOUNT ENTERPRISE — SECURITY CONFIGURATION
// MP-SEC-000001A
// ============================================================================

const DEFAULT_DEVELOPMENT_ORIGINS = Object.freeze([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
]);

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
      "API_TOKEN é obrigatório. Configure-o como variável de ambiente.",
    );
  }

  return Object.freeze({
    nodeEnv,
    apiToken,
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
