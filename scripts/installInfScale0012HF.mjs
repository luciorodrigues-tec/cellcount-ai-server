import fs from 'node:fs';

const file = 'server.js';
let s = fs.readFileSync(file, 'utf8');

function requireMatch(regex, message) {
  if (!regex.test(s)) throw new Error(message);
}

function replaceOnce(regex, replacement, message) {
  if (!regex.test(s)) throw new Error(message);
  s = s.replace(regex, replacement);
}

const adaptiveImportRegex =
  /import\s*\{[\s\S]*?createAdaptiveAnalysisAdmissionController,[\s\S]*?\}\s*from\s*["']\.\/services\/adaptiveAnalysisAdmissionController\.js["'];/;

requireMatch(
  adaptiveImportRegex,
  '2H-F installer: adaptive admission import marker not found.',
);

if (!s.includes('./services/controlledAutoscalingActivation.js')) {
  s = s.replace(
    adaptiveImportRegex,
    (match) => `${match}

import {
  AUTOSCALING_ACTIVATION_SAFETY_GATE_VERSION,
  createControlledAutoscalingActivation,
  resolveControlledAutoscalingConfig,
} from "./services/controlledAutoscalingActivation.js";`,
  );
}

const workerConfigRegex =
  /const\s+analysisWorkerPoolConfig\s*=\s*resolveAnalysisWorkerPoolConfig\(\);/;

requireMatch(
  workerConfigRegex,
  '2H-F installer: worker pool config marker not found.',
);

if (!s.includes('const controlledAutoscalingConfig =')) {
  s = s.replace(
    workerConfigRegex,
    (match) => `${match}

const controlledAutoscalingConfig =
  resolveControlledAutoscalingConfig(process.env, analysisWorkerPoolConfig);

let controlledAutoscalingActivation = null;`,
  );
}

const workerStartBlockRegex =
  /if\s*\(\s*analysisWorkerPool\s*\)\s*\{\s*analysisWorkerPool\.start\(\);\s*\}/;

requireMatch(
  workerStartBlockRegex,
  '2H-F installer: worker pool start block not found.',
);

if (!s.includes('controlledAutoscalingActivation =\n    createControlledAutoscalingActivation({')) {
  s = s.replace(
    workerStartBlockRegex,
    `if (analysisWorkerPool) {
  analysisWorkerPool.start();

  controlledAutoscalingActivation =
    createControlledAutoscalingActivation({
      workerPool: analysisWorkerPool,
      admissionController: adaptiveAnalysisAdmissionController,
      config: controlledAutoscalingConfig,
    });

  controlledAutoscalingActivation.start();
}`,
  );
}

const policyVersionRegex =
  /multiLevelAutoscalingPolicyLockVersion:\s*\n\s*MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION,/g;

const policyMatches = [...s.matchAll(policyVersionRegex)];
if (policyMatches.length < 2) {
  throw new Error(
    `2H-F installer: expected operational + runtime policy markers; found ${policyMatches.length}.`,
  );
}

if (!s.includes('autoscalingActivationSafetyGateVersion:')) {
  s = s.replace(
    policyVersionRegex,
    (match) => `${match}
    autoscalingActivationSafetyGateVersion:
      AUTOSCALING_ACTIVATION_SAFETY_GATE_VERSION,
    controlledAutoscaling:
      controlledAutoscalingActivation?.metadata ?? {
        version: AUTOSCALING_ACTIVATION_SAFETY_GATE_VERSION,
        status: controlledAutoscalingConfig.killSwitch
          ? "KILL_SWITCH_ACTIVE"
          : "LOCKED_SAFE",
        automaticScalingAllowed: false,
        scaleOutOnly: true,
        scaleInEnabled: false,
      },`,
  );
}

const lockedPolicyRegex =
  /autoscalingPolicyStatus:\s*"LOCKED_SAFE",\s*automaticScalingAllowed:\s*false,/g;

const lockedMatches = [...s.matchAll(lockedPolicyRegex)];
if (lockedMatches.length < 2 && !s.includes('controlledAutoscalingActivation?.status')) {
  throw new Error(
    `2H-F installer: expected operational + runtime LOCKED_SAFE markers; found ${lockedMatches.length}.`,
  );
}

if (!s.includes('controlledAutoscalingActivation?.status')) {
  s = s.replace(
    lockedPolicyRegex,
    `autoscalingPolicyStatus:
      controlledAutoscalingActivation?.status ?? "LOCKED_SAFE",
    automaticScalingAllowed:
      controlledAutoscalingActivation?.automaticScalingAllowed ?? false,`,
  );
}

fs.writeFileSync(file, s);

console.log(
  'INF-SCALE-001.2H-F server.js integration patch applied successfully.',
);
