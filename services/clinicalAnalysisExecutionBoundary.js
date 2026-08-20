export const CLINICAL_ANALYSIS_EXECUTION_BOUNDARY_VERSION = 'INF-SCALE-001.2A';

function requireFunction(value, name) {
  if (typeof value !== 'function') {
    throw new TypeError(`${name} must be a function`);
  }
}

function normalizedContext(context = {}) {
  return Object.freeze({
    analysisId: context.analysisId ? String(context.analysisId) : null,
    userId: context.userId ? String(context.userId) : null,
    attempt: Number.isInteger(context.attempt) ? context.attempt : null,
    leaseTokenPresent: Boolean(context.leaseToken),
    source: context.source ? String(context.source) : 'analyze-slide',
  });
}

export class ClinicalAnalysisExecutionBoundary {
  constructor({ executor, onStart = null, onFinish = null } = {}) {
    requireFunction(executor, 'executor');
    if (onStart != null) requireFunction(onStart, 'onStart');
    if (onFinish != null) requireFunction(onFinish, 'onFinish');
    this.executor = executor;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.version = CLINICAL_ANALYSIS_EXECUTION_BOUNDARY_VERSION;
  }

  async execute({ input, context = {} } = {}) {
    const executionContext = normalizedContext(context);
    const startedAtMs = Date.now();
    if (this.onStart) {
      await this.onStart({ version: this.version, context: executionContext });
    }
    try {
      const result = await this.executor(input);
      if (this.onFinish) {
        await this.onFinish({
          version: this.version,
          context: executionContext,
          ok: true,
          durationMs: Date.now() - startedAtMs,
        });
      }
      return result;
    } catch (error) {
      if (this.onFinish) {
        await this.onFinish({
          version: this.version,
          context: executionContext,
          ok: false,
          durationMs: Date.now() - startedAtMs,
          errorCode: error?.code ? String(error.code) : null,
        });
      }
      throw error;
    }
  }

  get scalabilityMetadata() {
    return Object.freeze({
      architectureVersion: this.version,
      httpDecouplingBoundary: true,
      queueTechnologyBound: false,
      clinicalMutation: false,
      workerReusable: true,
    });
  }
}

export function createClinicalAnalysisExecutionBoundary(options) {
  return new ClinicalAnalysisExecutionBoundary(options);
}
