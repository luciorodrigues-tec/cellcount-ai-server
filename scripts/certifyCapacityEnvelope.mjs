import { CAPACITY_ENVELOPE_CERTIFICATION_VERSION, resolveAdaptiveAdmissionConfig, deriveAutoscalingReadiness, evaluateAdmissionSnapshot, ADMISSION_DECISIONS } from '../services/adaptiveAnalysisAdmissionController.js';

const config = resolveAdaptiveAdmissionConfig(process.env, { concurrency: Number(process.env.ANALYSIS_WORKER_CONCURRENCY || 4), maxQueueDepth: Number(process.env.ANALYSIS_QUEUE_MAX_DEPTH || 100) });
const scenarios = [
  ['LOW_LOAD',{waiting:0,processing:0,active:0,saturated:false,oldestWaitingAgeMs:0},['SCALE_IN_CANDIDATE','HOLD']],
  ['NORMAL_LOAD',{waiting:8,processing:4,active:12,saturated:false,oldestWaitingAgeMs:20000},['HOLD']],
  ['RISING_PRESSURE',{waiting:48,processing:4,active:52,saturated:false,oldestWaitingAgeMs:200000},['SCALE_OUT']],
  ['HIGH_PRESSURE',{waiting:72,processing:4,active:76,saturated:false,oldestWaitingAgeMs:240000},['SCALE_OUT','AT_MAX_CAPACITY']],
  ['AT_CAPACITY',{waiting:96,processing:4,active:100,saturated:true,oldestWaitingAgeMs:300000},['SCALE_OUT','AT_MAX_CAPACITY']],
];
const results = scenarios.map(([name,snapshot,allowed]) => {
  const autoscaling=deriveAutoscalingReadiness({...snapshot,maxQueueDepth:config.maxQueueDepth},config);
  const admission=evaluateAdmissionSnapshot({...snapshot,maxQueueDepth:config.maxQueueDepth},config);
  const bounds=autoscaling.recommendedWorkers>=config.autoscaleMinWorkers && autoscaling.recommendedWorkers<=config.autoscaleMaxWorkers;
  const pass=allowed.includes(autoscaling.recommendation)&&bounds&&(name!=='AT_CAPACITY'||admission.decision===ADMISSION_DECISIONS.backpressure);
  return {name,pass,admission:admission.decision,recommendation:autoscaling.recommendation,currentWorkers:autoscaling.currentWorkers,recommendedWorkers:autoscaling.recommendedWorkers,...autoscaling.signals};
});
const success=results.every(x=>x.pass);
console.log(JSON.stringify({certificationVersion:CAPACITY_ENVELOPE_CERTIFICATION_VERSION,success,recommendationOnly:true,mutatesWorkerCount:false,config:{minWorkers:config.autoscaleMinWorkers,maxWorkers:config.autoscaleMaxWorkers,targetActivePerWorker:config.autoscaleTargetActivePerWorker},results},null,2));
process.exitCode=success?0:1;
