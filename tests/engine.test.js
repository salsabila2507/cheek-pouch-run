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
