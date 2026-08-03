/**
 * Registers low-risk platform routes that expose runtime status only.
 *
 * This module intentionally does not know about clinical engines, AI pipelines,
 * authentication, uploads or persistence. It receives all runtime values as
 * explicit dependencies so route registration remains deterministic and
 * independently testable.
 */
export function registerSystemRoutes({
  app,
  model,
  version = "V6_SAFE_HYBRID",
  applicationName = "CELLCOUNT ELITE HOSPITAL",
  uptimeProvider = () => process.uptime(),
  memoryProvider = () => process.memoryUsage(),
  nowProvider = () => new Date(),
} = {}) {
  if (!app || typeof app.get !== "function") {
    throw new TypeError("app with get() is required");
  }

  if (typeof model !== "string" || !model.trim()) {
    throw new TypeError("model is required");
  }

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      app: applicationName,
      model,
      status: "online",
      version,
    });
  });

  app.get("/health", (_req, res) => {
    const now = nowProvider();

    res.json({
      success: true,
      uptime: uptimeProvider(),
      memory: memoryProvider(),
      model,
      timestamp:
        now instanceof Date
          ? now.toISOString()
          : new Date(now).toISOString(),
    });
  });

  return app;
}
