import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRun,stepRun,checkpoint} from '../src/engine.js';
import {practiceWheel} from '../src/wheel.js';
test('deterministic long-run replays stay bounded and never score through sleep or unknown data',()=>{
 for(const width of [320,390,960])for(let seed=1;seed<=8;seed++){
 const s=createRun('practice',width,seed);let last='1';
 for(let frame=0;frame<7200&&s.status==='running';frame++){
   const w=practiceWheel(s.elapsed);if(w.height!==last){last=w.height;if(w.phase==='running')checkpoint(s,w.height);}
   const obstacle=s.entities.filter(e=>['mushroom','owl'].includes(e.kind)&&e.x>s.x-50).sort((a,b)=>a.x-b.x)[0];
   const near=obstacle&&obstacle.x-s.x<100;const input={jump:!!near&&obstacle.kind==='mushroom'&&s.y===0,duck:!!near&&obstacle.kind==='owl'};
   const before=s.distance,unknown=frame%700===699;stepRun(s,1/60,unknown?{phase:'unknown'}:w,input);
   if(unknown||w.phase==='sleeping')assert.equal(s.distance,before);
   assert.ok(Number.isFinite(s.y)&&Number.isFinite(s.distance));assert.ok(s.pouch>=0&&s.pouch<=40);assert.ok(s.entities.length<80);assert.ok(s.particles.length<=120);
 }
 assert.ok(s.elapsed>15,'a playable run lasts more than the opening stretch with deliberate controls');
 }
});
