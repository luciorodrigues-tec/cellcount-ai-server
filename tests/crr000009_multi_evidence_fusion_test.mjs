import assert from "node:assert/strict";
import test from "node:test";

import {
  FusionSignalRepository,
  MultiEvidenceFusionEngine,
  createFusionSignal,
  createMultiEvidenceFusionLibrary,
} from "../ai/clinicalRules/index.js";

const signal = (overrides = {}) =>
  createFusionSignal({
    id: "SIG-001",
    targetId: "TARGET-001",
    sourceId: "SOURCE-001",
    sourceType: "CLINICAL_RULE",
    direction: "SUPPORT",
    strength: 1,
    confidence: 1,
    reliability: 1,
    ...overrides,
  });

test("fusion signal is immutable", () => {
  const value = signal();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.metadata), true);
});

test("fusion signal rejects unsupported source type", () => {
  assert.throws(
    () => signal({ sourceType: "UNKNOWN" }),
    /Unsupported fusion source type/,
  );
});

test("repository rejects duplicate signal ids", () => {
  const repository = new FusionSignalRepository();
  repository.register(signal());
  assert.throws(
    () => repository.register(signal()),
    /already registered/,
  );
});

test("single support signal supports target", () => {
  const repository = new FusionSignalRepository();
  repository.register(signal());

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.status, "SUPPORTED");
  assert.equal(result.supportRatio, 1);
});

test("single oppose signal opposes target", () => {
  const repository = new FusionSignalRepository();
  repository.register(
    signal({
      id: "SIG-OPPOSE",
      direction: "OPPOSE",
    }),
  );

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.status, "OPPOSED");
  assert.equal(result.opposeRatio, 1);
});

test("balanced support and oppose creates conflict", () => {
  const repository = new FusionSignalRepository();
  repository.register(signal());
  repository.register(
    signal({
      id: "SIG-002",
      sourceId: "SOURCE-002",
      direction: "OPPOSE",
    }),
  );

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.status, "CONFLICTED");
  assert.equal(result.requiresHumanReview, true);
});

test("blocking signal forces abstention", () => {
  const repository = new FusionSignalRepository();
  repository.register(
    signal({
      blocking: true,
      direction: "ABSTAIN",
    }),
  );

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.status, "ABSTAINED");
  assert.equal(
    result.reason,
    "BLOCKING_SIGNAL_PRESENT",
  );
});

test("guideline source receives configured higher weight", () => {
  const repository = new FusionSignalRepository();
  repository.register(
    signal({
      id: "SIG-GUIDE",
      sourceType: "GUIDELINE",
    }),
  );

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.supportWeight, 1.3);
});

test("deduplication keeps strongest signal from same source", () => {
  const repository = new FusionSignalRepository();
  repository.register(
    signal({
      id: "SIG-WEAK",
      strength: 0.5,
    }),
  );
  repository.register(
    signal({
      id: "SIG-STRONG",
      strength: 2,
    }),
  );

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.signalCount, 1);
  assert.equal(result.supportWeight, 2);
});

test("provenance preserves source identity", () => {
  const repository = new FusionSignalRepository();
  repository.register(signal());

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseTarget({
    targetId: "TARGET-001",
  });

  assert.equal(result.provenance.length, 1);
  assert.equal(
    result.provenance[0].sourceId,
    "SOURCE-001",
  );
});

test("fuseAll ranks supported targets first", () => {
  const repository = new FusionSignalRepository();
  repository.register(signal());
  repository.register(
    signal({
      id: "SIG-002",
      targetId: "TARGET-002",
      direction: "OPPOSE",
      sourceId: "SOURCE-002",
    }),
  );

  const result = new MultiEvidenceFusionEngine({
    signalRepository: repository,
  }).fuseAll();

  assert.equal(result.totalTargets, 2);
  assert.equal(
    result.rankedResults[0].targetId,
    "TARGET-001",
  );
});

test("library exposes repository builder and engine", () => {
  const library =
    createMultiEvidenceFusionLibrary({
      signals: [signal()],
    });

  assert.ok(library.signalRepository);
  assert.ok(library.signalBuilder);
  assert.ok(library.engine);
  assert.equal(library.signals.length, 1);
});
