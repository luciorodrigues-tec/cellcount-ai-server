export const FUSION_SIGNAL_REPOSITORY_VERSION =
  "CRR-000009-v1.0.0";

export class FusionSignalRepository {
  constructor({
    version =
      FUSION_SIGNAL_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._signals = new Map();
  }

  register(signal, { replace = false } = {}) {
    if (!signal?.id) {
      throw new TypeError(
        "Fusion signal with id is required.",
      );
    }

    if (this._signals.has(signal.id) && !replace) {
      throw new Error(
        `Fusion signal already registered: ${signal.id}`,
      );
    }

    this._signals.set(signal.id, signal);
    return signal;
  }

  get(id) {
    return this._signals.get(String(id)) || null;
  }

  list() {
    return Object.freeze([
      ...this._signals.values(),
    ]);
  }

  listByTarget(targetId) {
    return Object.freeze(
      this.list().filter(
        (signal) =>
          signal.targetId === String(targetId),
      ),
    );
  }
}
