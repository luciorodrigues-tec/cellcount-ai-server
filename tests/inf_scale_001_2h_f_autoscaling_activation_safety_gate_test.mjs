import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveControlledAutoscalingConfig, createControlledAutoscalingActivation } from '../services/controlledAutoscalingActivation.js';

test('2H-F defaults fail closed',()=> {
  const c=resolveControlledAutoscalingConfig({}, {concurrency:4});
  assert.equal(c.enabled,false); assert.equal(c.killSwitch,true); assert.equal(c.scaleInEnabled,false);
});
test('2H-F requires explicit certification and kill switch off',()=> {
  const pool={currentConcurrency:4,scaleOutTo:async()=>({changed:true,current:5})};
  const admission={operationalSnapshot:async()=>({autoscaling:{recommendedWorkers:5,hysteresis:{stableRecommendation:'SCALE_OUT'}}})};
  const config=resolveControlledAutoscalingConfig({
    CELLCOUNT_AUTOSCALING_ENABLED:'true',CELLCOUNT_AUTOSCALING_KILL_SWITCH:'false',
    CELLCOUNT_AUTOSCALING_2H_E_CERTIFIED:'false'
  },{concurrency:4});
  const x=createControlledAutoscalingActivation({workerPool:pool,admissionController:admission,config});
  assert.equal(x.automaticScalingAllowed,false);
});
test('2H-F scales only one worker after sustained samples',async()=> {
  let workers=4;
  const pool={get currentConcurrency(){return workers;},scaleOutTo:async(t)=>{const p=workers;workers=Math.min(t,workers+1);return {changed:workers>p,previous:p,current:workers};}};
  const admission={operationalSnapshot:async()=>({autoscaling:{recommendedWorkers:6,hysteresis:{stableRecommendation:'SCALE_OUT'}}})};
  const config=resolveControlledAutoscalingConfig({
    CELLCOUNT_AUTOSCALING_ENABLED:'true',CELLCOUNT_AUTOSCALING_KILL_SWITCH:'false',
    CELLCOUNT_AUTOSCALING_2H_E_CERTIFIED:'true',CELLCOUNT_AUTOSCALING_REQUIRED_STABLE_SAMPLES:'3',
    CELLCOUNT_AUTOSCALING_COOLDOWN_MS:'30000'
  },{concurrency:4});
  let now=100000;
  const x=createControlledAutoscalingActivation({workerPool:pool,admissionController:admission,config,now:()=>now});
  assert.equal((await x.evaluate()).decision,'HOLD');
  assert.equal((await x.evaluate()).decision,'HOLD');
  assert.equal((await x.evaluate()).decision,'SCALE_OUT');
  assert.equal(workers,5);
});
