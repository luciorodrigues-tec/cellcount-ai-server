import express from "express";
import cors from "cors";
import multer from "multer";

import {
  createCompositeAuth,
  createCorsOptions,
  createRateLimiter,
  securityHeaders,
} from "../security/securityMiddleware.js";
import {
  createSessionTokenService,
} from "../security/sessionTokenService.js";

const DEVELOPMENT_FALLBACK_SESSION_SECRET =
  "development-only-http-foundation-session-secret-0001";

/**
 * Builds the HTTP foundation without registering business routes.
 *
 * Security, CORS, body parsing, upload limits and route-class rate limiting
 * live here so server.js can remain the platform composition root.
 *
 * CLEANUP-001.1 R1.1:
 * New session-security fields are backward-compatible for callers/tests that
 * still construct the historical MP-ARCH securityConfig shape directly.
 * Production remains strict: a missing session signing secret is rejected.
 */
export function createHttpFoundation({
  securityConfig,
} = {}) {
  if (!securityConfig) {
    throw new TypeError(
      "securityConfig is required to create the HTTP foundation.",
    );
  }

  const nodeEnv =
    String(
      securityConfig.nodeEnv || "development",
    )
      .trim()
      .toLowerCase();

  const sessionSigningSecret =
    String(
      securityConfig.sessionSigningSecret ||
        (nodeEnv === "production"
          ? ""
          : DEVELOPMENT_FALLBACK_SESSION_SECRET),
    );

  if (!sessionSigningSecret) {
    throw new Error(
      "sessionSigningSecret is required in production.",
    );
  }

  const sessionTokenTtlSeconds =
    Number.isSafeInteger(
      securityConfig.sessionTokenTtlSeconds,
    ) &&
    securityConfig.sessionTokenTtlSeconds > 0
      ? securityConfig.sessionTokenTtlSeconds
      : 900;

  const sessionIssueMaxRequests =
    Number.isSafeInteger(
      securityConfig.sessionIssueMaxRequests,
    ) &&
    securityConfig.sessionIssueMaxRequests > 0
      ? securityConfig.sessionIssueMaxRequests
      : (
          Number.isSafeInteger(
            securityConfig.aiRateLimitMaxRequests,
          ) &&
          securityConfig.aiRateLimitMaxRequests > 0
            ? securityConfig.aiRateLimitMaxRequests
            : 12
        );

  const allowLegacyApiToken =
    typeof securityConfig.allowLegacyApiToken === "boolean"
      ? securityConfig.allowLegacyApiToken
      : true;

  const app =
    express();

  const corsOptions =
    createCorsOptions(
      securityConfig.allowedOrigins,
    );

  app.use(
    securityHeaders,
  );

  app.use(
    cors(corsOptions),
  );

  app.options(
    "/*",
    cors(corsOptions),
  );

  app.use(
    express.json({
      limit: "50mb",
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "50mb",
    }),
  );

  const upload =
    multer({
      storage:
        multer.memoryStorage(),
      limits: {
        fileSize:
          25 * 1024 * 1024,
        files: 4,
      },
    });

  const generalRateLimiter =
    createRateLimiter({
      windowMs:
        securityConfig.rateLimitWindowMs,
      maxRequests:
        securityConfig.rateLimitMaxRequests,
    });

  const aiRateLimiter =
    createRateLimiter({
      windowMs:
        securityConfig.rateLimitWindowMs,
      maxRequests:
        securityConfig.aiRateLimitMaxRequests,
    });

  const sessionIssueRateLimiter =
    createRateLimiter({
      windowMs:
        securityConfig.rateLimitWindowMs,
      maxRequests:
        sessionIssueMaxRequests,
      keyGenerator: (req) =>
        `${req.ip || req.socket?.remoteAddress || "unknown"}:${String(
          req.headers["x-device-id"] || "missing",
        ).trim()}`,
    });

  app.use(
    [
      "/knowledge",
      "/classify-specimen",
    ],
    generalRateLimiter,
  );

  app.use(
    [
      "/analyze-slide",
      "/hema-ask",
    ],
    aiRateLimiter,
  );

  const sessionTokenService =
    createSessionTokenService({
      signingSecret:
        sessionSigningSecret,
      ttlSeconds:
        sessionTokenTtlSeconds,
    });

  app.post(
    "/auth/session",
    sessionIssueRateLimiter,
    (req, res) => {
      const deviceId = String(
        req.headers["x-device-id"] || "",
      ).trim();

      if (!deviceId || deviceId.length > 200) {
        res.setHeader("Cache-Control", "no-store");
        return res.status(400).json({
          success: false,
          error: "x-device-id é obrigatório.",
        });
      }

      const issued =
        sessionTokenService.issue({
          deviceId,
        });

      res.setHeader("Cache-Control", "no-store");

      return res.status(200).json({
        success: true,
        accessToken: issued.token,
        tokenType: issued.tokenType,
        expiresIn: issued.expiresIn,
        expiresAt: issued.expiresAt,
        scopes: issued.scopes,
      });
    },
  );

  const auth =
    createCompositeAuth({
      apiToken:
        securityConfig.apiToken,
      allowLegacyApiToken,
      sessionTokenService,
    });

  const jsonBodyParser = ({
    limit = "1mb",
  } = {}) =>
    express.json({
      limit,
    });

  return Object.freeze({
    app,
    auth,
    jsonBodyParser,
    upload,
  });
}
