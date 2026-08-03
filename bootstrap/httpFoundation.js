import express from "express";
import cors from "cors";
import multer from "multer";

import {
  createBearerAuth,
  createCorsOptions,
  createRateLimiter,
  securityHeaders,
} from "../security/securityMiddleware.js";

/**
 * Builds the HTTP foundation without registering business routes.
 *
 * Security, CORS, body parsing, upload limits and route-class rate limiting
 * live here so server.js can remain the platform composition root.
 */
export function createHttpFoundation({
  securityConfig,
} = {}) {
  if (!securityConfig) {
    throw new TypeError(
      "securityConfig is required to create the HTTP foundation.",
    );
  }

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

  const auth =
    createBearerAuth(
      securityConfig.apiToken,
    );

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
