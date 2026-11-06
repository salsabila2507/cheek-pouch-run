import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRun,stepRun,checkpoint,bankPouch,speedFor} from '../src/engine.js';
const running={phase:'running',rpm:50,simulated:false};
const asleep={phase:'sleeping',rpm:0,simulated:false};
const tick=(s,w=running,input={})=>stepRun(s,1/60,w,input);
test('runs start with three lives and no fabricated score',()=>{const s=createRun('live',960,1);assert.ok(s);assert.equal(s.lives,3);assert.equal(s.pouch,0);assert.equal(s.banked,0);assert.equal(s.mode,'live');});
test('RPM changes speed with bounded ZOOMIES',()=>{assert.ok(speedFor(running)>0);assert.ok(speedFor({...running,rpm:80})>speedFor(running));assert.ok(speedFor({...running,rpm:500})<500)});
test('lost telemetry freezes physics, elapsed time, distance and scoring',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.pouch=5;const before=JSON.stringify(s);tick(s,{phase:'unknown',rpm:null},{jump:true});assert.equal(JSON.stringify(s),before);
});
test('Live cannot accidentally use a simulated wheel',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');tick(s,{...running,simulated:true});assert.equal(s.elapsed,0);
});
test('jump supports a deliberate second jump, not unlimited flight',()=>{
 const s=createRun('practice',960,1);if(!s)return assert.fail('run missing');tick(s,running,{jump:true});assert.ok(s.y>0);assert.equal(s.jumps,1);tick(s,running,{jump:true});assert.equal(s.jumps,2);tick(s,running,{jump:true});assert.equal(s.jumps,2);
});
test('normal seed collection is doubled only during ZOOMIES',()=>{
 for(const [rpm,expected]of [[50,1],[70,2]]){const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.entities=[{kind:'seed',x:s.x+3,alt:22,r:7,value:1}];tick(s,{...running,rpm});assert.equal(s.pouch,expected);}
});
test('sleep locks seeds and scored distance but increases danger',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.entities=[{kind:'seed',x:s.x+3,alt:22,r:7,value:1}];tick(s,asleep);assert.equal(s.pouch,0);assert.equal(s.distance,0);assert.ok(s.travel>0);assert.ok(s.danger>0);
});
test('one checkpoint per observed block, with no duplicate bursts',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');assert.equal(checkpoint(s,'1141'),true);const count=s.entities.length;assert.equal(checkpoint(s,'1141'),false);assert.equal(s.entities.length,count);assert.equal(s.entities.filter(e=>e.kind==='burrow').length,1);
});
test('landing in a checkpoint banks pouch without ending the run',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.pouch=9;s.entities=[{kind:'burrow',x:s.x+3,width:72,alt:0,height:65,id:'1141'}];tick(s);assert.equal(s.banked,9);assert.equal(s.pouch,0);assert.equal(s.status,'running');
});
test('going home banks existing seeds, including during sleep, without creating new ones',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.pouch=13;tick(s,asleep,{home:true});assert.equal(s.banked,13);assert.equal(s.pouch,0);assert.equal(s.status,'home');bankPouch(s);assert.equal(s.banked,13);
});
test('duck clears an owl and jumping clears ground traps',()=>{
 const duck=createRun('live',960,1);if(!duck)return assert.fail('run missing');duck.entities=[{kind:'owl',x:duck.x+3,alt:29,height:24,width:45}];tick(duck,running,{duck:true});assert.equal(duck.lives,3);
 const jump=createRun('live',960,1);jump.y=70;jump.entities=[{kind:'mushroom',x:jump.x+3,alt:0,height:30,width:32}];tick(jump);assert.equal(jump.lives,3);
});
test('hits spill half a pouch; third hit loses unbanked but keeps banked seeds',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.pouch=20;s.banked=7;
 const hit=()=>{s.invulnerable=0;s.entities=[{kind:'mushroom',x:s.x+3,alt:0,height:38,width:32}];tick(s);};
 hit();assert.equal(s.lives,2);assert.equal(s.pouch,10);hit();hit();assert.equal(s.status,'over');assert.equal(s.pouch,0);assert.equal(s.banked,7);
});
test('seed pouch capacity is finite and terminal states cannot accrue score',()=>{
 const s=createRun('live',960,1);if(!s)return assert.fail('run missing');s.pouch=39;s.entities=[{kind:'gold',x:s.x+3,alt:22,r:9,value:5}];tick(s);assert.equal(s.pouch,40);s.status='over';const before=s.distance;tick(s);assert.equal(s.distance,before);
});

const isolated=(pouch=0)=>{const s=createRun('live',800,17);s.pouch=pouch;s.spawnIn=1000;s.seedIn=1000;return s;};
test('heavy cheeks progressively slow the trail and lower jumps',()=>{
 const light=isolated(),heavy=isolated(40);tick(light,running,{jump:true});tick(heavy,running,{jump:true});
 assert.ok(heavy.travel<light.travel*.85,'full pouch slows speed at least 15%');assert.ok(heavy.y<light.y*.9,'full pouch lowers jump');
});
test('overstuffed cheeks warn before a deterministic stumble spills seeds, not lives',()=>{
 const s=isolated(40);for(let i=0;i<40;i++)stepRun(s,.05,running);
 assert.ok(s.pressure>0);assert.equal(s.pouch,40,'warning gives time to respond');
 let stumbled=false;for(let i=0;i<25;i++){stepRun(s,.05,running);stumbled ||= s.events.some(e=>e.kind==='stumble');}
 assert.equal(stumbled,true);assert.equal(s.pouch,30);assert.equal(s.lives,3);assert.ok(s.stumbleFor>0);
});
test('ducking steadies an overstuffed pouch; banking removes pressure and weight',()=>{
 const s=isolated(38);for(let i=0;i<30;i++)stepRun(s,.05,running);const pressure=s.pressure;
 for(let i=0;i<10;i++)stepRun(s,.05,running,{duck:true});assert.ok(s.pressure<pressure);assert.equal(s.pouch,38);
 bankPouch(s);assert.equal(s.pressure,0);assert.equal(s.pouch,0);assert.equal(s.bankCount,1);assert.ok(s.bankFlash>0);
});
test('banking completes local missions once, without awarding extra seeds',()=>{
 const s=isolated(15);bankPouch(s);assert.equal(s.banked,15);assert.equal(s.missions.completed,1);assert.equal(s.missions.bankTarget,24);
 bankPouch(s);assert.equal(s.missions.completed,1);assert.equal(s.bankCount,1);assert.ok(s.events.some(e=>e.kind==='mission'));
});
test('sleep is playable at a slower pace and has a non-scoring survival objective',()=>{
 const s=isolated();for(let i=0;i<241;i++)stepRun(s,.05,asleep);
 assert.equal(s.distance,0);assert.equal(s.pouch,0);assert.equal(s.banked,0);assert.ok(s.travel>0);assert.equal(s.missions.completed,1);assert.equal(s.missions.sleepTarget,24);
 assert.ok(speedFor(asleep)<speedFor(running));
});
test('ZOOMIES announces entry once and can be re-entered after sleep',()=>{
 const s=isolated();tick(s,{...running,rpm:70});assert.ok(s.events.some(e=>e.kind==='zoomies'));assert.equal(s.zoomies,true);
 tick(s,{...running,rpm:75});assert.equal(s.events.some(e=>e.kind==='zoomies'),false);
 tick(s,asleep);assert.equal(s.zoomies,false);tick(s,{...running,rpm:70});assert.ok(s.events.some(e=>e.kind==='zoomies'));
});
test('sleep objectives and pressure are frozen with unknown or simulated Live telemetry',()=>{
 const s=isolated(40);const before=JSON.stringify(s);tick(s,{phase:'unknown'});assert.equal(JSON.stringify(s),before);
 tick(s,{...asleep,simulated:true});assert.equal(JSON.stringify(s),before);
});

test('day prep stocks nest and a burrow recover spends seeds for a life',()=>{
 const s=isolated(20);s.lives=2;s.entities=[{kind:'burrow',x:s.x+3,width:72,alt:0,height:65,id:'1200'}];
 tick(s,running,{duck:true});
 assert.equal(s.lives,3);assert.equal(s.recoverCount,1);assert.equal(s.pouch,0);assert.equal(s.banked,10);assert.ok(s.nest>=2);
});
test('seed combos stock nest while awake without inventing RPM rewards',()=>{
 const s=isolated();s.spawnIn=1000;s.seedIn=1000;
 for(let i=0;i<5;i++){s.entities=[{kind:'seed',x:s.x+3,alt:22,r:7,value:1}];tick(s,running);}
 assert.equal(s.pouch,5);assert.equal(s.combo,5);assert.ok(s.nest>=2);assert.ok(s.events.some(e=>e.kind==='nest'));
});
test('nest can absorb one sleep hit instead of spending a life',()=>{
 const s=isolated();s.nest=8;s.entities=[{kind:'mushroom',x:s.x+3,alt:0,height:38,width:32}];
 tick(s,asleep);assert.equal(s.lives,3);assert.ok(s.nest<8);assert.ok(s.events.some(e=>e.kind==='nest-save'));
});
