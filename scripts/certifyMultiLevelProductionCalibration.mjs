import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runOne, summarizeStage } from './certifyHighVolumeBackpressure.mjs';
import { collectOperationalSamples } from './certifyProductionCapacityCalibration.mjs';
import { summarizeProductionCalibration } from '../services/productionCapacityCalibration.js';
import { MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION, REQUIRED_LEVELS, evaluateMultiLevelAutoscalingPolicy } from '../services/multiLevelAutoscalingPolicyLock.js';

export const MULTI_LEVEL_CONFIRMATION = 'I_UNDERSTAND_25_50_100_PRODUCTION_CALIBRATION';
const required = (name) => { const v = String(process.env[name] || '').trim(); if (!v) throw new Error(`${name} is required`); return v; };
const positiveInt = (v, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => { const n = Number(v); return Number.isInteger(n) && n >= min ? Math.min(n, max) : fallback; };
const base = (v) => String(v || 'https://api.rodrigueslucio.com').trim().replace(/\/+$/, '');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function json(response, label) { const text = await response.text(); let out={}; try { out=text?JSON.parse(text):{}; } catch { throw new Error(`${label}: HTTP ${response.status} non-JSON`); } if(!response.ok) throw new Error(`${label}: HTTP ${response.status}: ${out?.error||out?.errorCode||'request failed'}`); return out; }

export async function main() {
  const baseUrl = base(process.env.CELLCOUNT_MULTI_CALIBRATION_BASE_URL);
  const apiToken = required('CELLCOUNT_MULTI_CALIBRATION_API_TOKEN');
  const imagePath = path.resolve(required('CELLCOUNT_MULTI_CALIBRATION_IMAGE'));
  const specimenType = String(process.env.CELLCOUNT_MULTI_CALIBRATION_SPECIMEN_TYPE || 'PERIPHERAL_BLOOD').trim().toUpperCase();
  if (String(process.env.CELLCOUNT_MULTI_CALIBRATION_CONFIRM || '').trim() !== MULTI_LEVEL_CONFIRMATION) throw new Error(`Set CELLCOUNT_MULTI_CALIBRATION_CONFIRM=${MULTI_LEVEL_CONFIRMATION}`);
  const expectedWorkers = positiveInt(process.env.CELLCOUNT_MULTI_CALIBRATION_EXPECTED_WORKERS, 4, { max: 32 });
  const sampleIntervalMs = positiveInt(process.env.CELLCOUNT_MULTI_CALIBRATION_SAMPLE_INTERVAL_MS, 1500, { min: 500, max: 10000 });
  const pollMs = positiveInt(process.env.CELLCOUNT_MULTI_CALIBRATION_POLL_MS, 1500, { min: 500, max: 10000 });
  const pollRequestTimeoutMs = positiveInt(process.env.CELLCOUNT_MULTI_CALIBRATION_POLL_REQUEST_TIMEOUT_MS, 15000, { min: 1000, max: 60000 });
  const timeoutMs = positiveInt(process.env.CELLCOUNT_MULTI_CALIBRATION_STAGE_TIMEOUT_MS, 1800000, { min: 60000, max: 7200000 });
  const cooldownMs = positiveInt(process.env.CELLCOUNT_MULTI_CALIBRATION_COOLDOWN_MS, 30000, { min: 0, max: 300000 });
  const image = await fs.readFile(imagePath); assert.ok(image.length > 0);
  const runtime = await json(await fetch(`${baseUrl}/runtime-version`), 'runtime-version');
  assert.equal(runtime.analysisExecutionMode, 'queued'); assert.equal(runtime.distributedAnalysisWorkerPool?.running, true);
  assert.equal(Number(runtime.distributedAnalysisWorkerPool?.concurrency || 0), expectedWorkers);
  assert.equal(runtime.adaptiveAdmissionControl?.recommendationOnly, true); assert.equal(runtime.automaticScalingAllowed, false);
  const maxQueueDepth = Number(runtime.distributedAnalysisWorkerPool?.maxQueueDepth || 100);
  console.log(`[${MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION}] target=${baseUrl}`);
  console.log(`[${MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION}] levels=${REQUIRED_LEVELS.join(',')} workers=${expectedWorkers} maxQueueDepth=${maxQueueDepth} policy=LOCKED_SAFE`);
  const calibrations=[];
  for (let index=0; index<REQUIRED_LEVELS.length; index += 1) {
    const level=REQUIRED_LEVELS[index]; console.log(`[${MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION}] STAGE level=${level} starting`);
    const stopSignal={stopped:false}; const sampler=collectOperationalSamples({baseUrl,apiToken,intervalMs:sampleIntervalMs,stopSignal});
    const startedAtMs=Date.now(); const stageId=`${startedAtMs}-${expectedWorkers}w-${level}-2he`;
    const records=await Promise.all(Array.from({length:level},(_,i)=>runOne({baseUrl,apiToken,image,imagePath,specimenType,pollMs,timeoutMs,pollRequestTimeoutMs,stageId,ordinal:i+1})));
    const endedAtMs=Date.now(); stopSignal.stopped=true; const telemetry=await sampler;
    const stage=summarizeStage({level,startedAt:startedAtMs,endedAt:endedAtMs,records,maxQueueDepth});
    const calibration=summarizeProductionCalibration({samples:telemetry.samples,startedAtMs,endedAtMs,accepted:stage.accepted,completed:stage.completed,admissionControlled:stage.admissionControlled,observedThroughputPerMinute:stage.throughputCompletedPerMinute,softQueuePressure:Number(runtime.adaptiveAdmissionControl?.softQueuePressure||0.75)});
    const item={level,success:Boolean(stage.pass&&calibration.pass),stage,telemetry:{sampleCount:telemetry.samples.length,transportErrors:telemetry.transportErrors},calibration}; calibrations.push(item);
    console.log(JSON.stringify({stage:item},null,2)); if(!item.success) break; if(index<REQUIRED_LEVELS.length-1&&cooldownMs>0) await sleep(cooldownMs);
  }
  const policy=evaluateMultiLevelAutoscalingPolicy({calibrations});
  const result={certificationVersion:MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION,success:policy.pass,autoscalingPolicyStatus:policy.autoscalingPolicyStatus,automaticScalingAllowed:false,runtime:{workerConcurrency:expectedWorkers,maxQueueDepth,recommendationOnly:true,mutatesWorkerCount:false},levelsRequested:[...REQUIRED_LEVELS],levelsExecuted:calibrations.map(x=>x.level),calibrations,policy};
  console.log(JSON.stringify(result,null,2)); if(!result.success) process.exitCode=1;
}
const isEntrypoint=process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href;
if(isEntrypoint) main().catch((error)=>{console.error(`[${MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION}] FATAL`,error);process.exitCode=1;});
