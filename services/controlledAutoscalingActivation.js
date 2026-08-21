export const AUTOSCALING_ACTIVATION_SAFETY_GATE_VERSION = 'INF-SCALE-001.2H-F';
export const AUTOSCALING_ROLLOUT_STATUS = Object.freeze({
  LOCKED: 'LOCKED_SAFE',
  ARMED: 'ARMED_SCALE_OUT_ONLY',
  ACTIVE: 'ACTIVE_SCALE_OUT_ONLY',
  KILLED: 'KILL_SWITCH_ACTIVE',
});

function bool(v, fallback=false) {
  if (v === undefined || v === null || v === '') return fallback;
  return ['1','true','yes','on'].includes(String(v).trim().toLowerCase());
}
function int(v, fallback, min, max) {
  const n=Number(v); return Number.isInteger(n) && n>=min && n<=max ? n : fallback;
}
export function resolveControlledAutoscalingConfig(env=process.env, workerPoolConfig={}) {
  const baseline=int(workerPoolConfig.concurrency,4,1,32);
  const minWorkers=int(env.CELLCOUNT_AUTOSCALING_MIN_WORKERS,baseline,1,32);
  const maxWorkers=Math.max(minWorkers,int(env.CELLCOUNT_AUTOSCALING_MAX_WORKERS,6,minWorkers,32));
  return Object.freeze({
    enabled: bool(env.CELLCOUNT_AUTOSCALING_ENABLED,false),
    killSwitch: bool(env.CELLCOUNT_AUTOSCALING_KILL_SWITCH,true),
    certificationPass: bool(env.CELLCOUNT_AUTOSCALING_2H_E_CERTIFIED,false),
    minWorkers, maxWorkers,
    maxStepUp:int(env.CELLCOUNT_AUTOSCALING_MAX_STEP_UP,1,1,2),
    cooldownMs:int(env.CELLCOUNT_AUTOSCALING_COOLDOWN_MS,180000,30000,3600000),
    requiredStableSamples:int(env.CELLCOUNT_AUTOSCALING_REQUIRED_STABLE_SAMPLES,3,2,20),
    telemetryMaxAgeMs:int(env.CELLCOUNT_AUTOSCALING_TELEMETRY_MAX_AGE_MS,15000,1000,120000),
    evaluationIntervalMs:int(env.CELLCOUNT_AUTOSCALING_EVALUATION_INTERVAL_MS,5000,1000,60000),
    scaleInEnabled:false,
  });
}

export class ControlledAutoscalingActivation {
  constructor({ workerPool, admissionController, config, logger=console, now=()=>Date.now() }={}) {
    if (!workerPool || typeof workerPool.scaleOutTo !== 'function') throw new Error('INF-SCALE-001.2H-F: resizable workerPool required.');
    if (!admissionController || typeof admissionController.operationalSnapshot !== 'function') throw new Error('INF-SCALE-001.2H-F: admissionController required.');
    this.workerPool=workerPool; this.admissionController=admissionController; this.config=config;
    this.logger=logger; this.now=now; this.timer=null; this.running=false; this.lastActionAt=0;
    this.stableScaleOutSamples=0; this.lastSnapshotAt=0;
    this.audit={ evaluations:0, scaleOutActions:0, blockedActions:0, errors:0, lastDecision:'NOT_EVALUATED', lastReason:null, lastActionAt:null };
  }
  get automaticScalingAllowed() {
    return this.config.enabled && !this.config.killSwitch && this.config.certificationPass;
  }
  get status() {
    if (this.config.killSwitch) return AUTOSCALING_ROLLOUT_STATUS.KILLED;
    if (!this.automaticScalingAllowed) return AUTOSCALING_ROLLOUT_STATUS.LOCKED;
    return this.audit.scaleOutActions>0 ? AUTOSCALING_ROLLOUT_STATUS.ACTIVE : AUTOSCALING_ROLLOUT_STATUS.ARMED;
  }
  get metadata() {
    return Object.freeze({
      version:AUTOSCALING_ACTIVATION_SAFETY_GATE_VERSION, status:this.status,
      automaticScalingAllowed:this.automaticScalingAllowed, scaleOutOnly:true, scaleInEnabled:false,
      minWorkers:this.config.minWorkers,maxWorkers:this.config.maxWorkers,maxStepUp:this.config.maxStepUp,
      cooldownMs:this.config.cooldownMs,requiredStableSamples:this.config.requiredStableSamples,
      telemetryMaxAgeMs:this.config.telemetryMaxAgeMs,currentWorkers:this.workerPool.currentConcurrency,
      audit:Object.freeze({...this.audit}),
    });
  }
  start() {
    if (this.running) return;
    this.running=true;
    if (!this.automaticScalingAllowed) return;
    this.timer=setInterval(()=>this.evaluate().catch(e=>{
      this.audit.errors+=1; this.logger?.error?.('INF-SCALE-001.2H-F autoscaling evaluation error',{message:String(e?.message||e)});
    }),this.config.evaluationIntervalMs);
    this.timer.unref?.();
  }
  stop() { this.running=false; if(this.timer) clearInterval(this.timer); this.timer=null; }
  async evaluate() {
    this.audit.evaluations+=1;
    if (!this.automaticScalingAllowed) return this.#blocked('SAFETY_GATE_LOCKED');
    const snapshot=await this.admissionController.operationalSnapshot();
    const observedAt=this.now(); this.lastSnapshotAt=observedAt;
    const stable=String(snapshot?.autoscaling?.hysteresis?.stableRecommendation||'HOLD');
    const recommended=Number(snapshot?.autoscaling?.recommendedWorkers||this.workerPool.currentConcurrency);
    if (stable !== 'SCALE_OUT') { this.stableScaleOutSamples=0; return this.#hold('NO_STABLE_SCALE_OUT'); }
    this.stableScaleOutSamples+=1;
    if (this.stableScaleOutSamples < this.config.requiredStableSamples) return this.#hold('SUSTAINED_PRESSURE_NOT_YET_CONFIRMED');
    const current=this.workerPool.currentConcurrency;
    if (current >= this.config.maxWorkers) return this.#blocked('HARD_MAX_REACHED');
    if (observedAt-this.lastActionAt < this.config.cooldownMs) return this.#blocked('COOLDOWN_ACTIVE');
    const target=Math.min(this.config.maxWorkers,current+this.config.maxStepUp,Math.max(current+1,recommended));
    const result=await this.workerPool.scaleOutTo(target,{maxStepUp:this.config.maxStepUp,hardMax:this.config.maxWorkers});
    if(result.changed){
      this.lastActionAt=observedAt; this.stableScaleOutSamples=0; this.audit.scaleOutActions+=1;
      this.audit.lastDecision='SCALE_OUT'; this.audit.lastReason='SUSTAINED_CERTIFIED_PRESSURE'; this.audit.lastActionAt=observedAt;
    }
    return Object.freeze({decision:result.changed?'SCALE_OUT':'HOLD',reason:this.audit.lastReason,result,metadata:this.metadata});
  }
  #blocked(reason){this.audit.blockedActions+=1;this.audit.lastDecision='BLOCKED';this.audit.lastReason=reason;return Object.freeze({decision:'BLOCKED',reason,metadata:this.metadata});}
  #hold(reason){this.audit.lastDecision='HOLD';this.audit.lastReason=reason;return Object.freeze({decision:'HOLD',reason,metadata:this.metadata});}
}
export function createControlledAutoscalingActivation(options){return new ControlledAutoscalingActivation(options);}
