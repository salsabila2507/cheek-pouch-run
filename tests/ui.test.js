import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {createCanvas} from '@napi-rs/canvas';
import {bootGame} from '../src/game.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function setup({blockedStorage=false}={}){
 const {document,window}=parseHTML(html);let now=Date.parse('2026-11-06T08:00:00Z');
 const canvas=createCanvas(960,450);document.querySelector('canvas').getContext=()=>canvas.getContext('2d');
 window.matchMedia=()=>({matches:false});window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};window.devicePixelRatio=1;window.ResizeObserver=undefined;
 Object.defineProperty(document.querySelector('#stage'),'clientWidth',{value:800});Object.defineProperty(document.querySelector('#stage'),'clientHeight',{value:420});
 const mem=new Map(),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
 if(blockedStorage)Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage blocked')}});
 const options={document,window,clock:()=>now,autoPoll:false,autoFrame:false};if(!blockedStorage)options.storage=storage;
 const game=bootGame(options);
 return {document,game,advance:(ms)=>{now+=ms;},now:()=>now};
}
function sample(now,{rpm=50,status='ACTIVE',height='100'}={}){return {schemaVersion:1,installationId:'hamster',measurement:{freshness:'online',observedAt:new Date(now).toISOString(),receivedAt:new Date(now).toISOString(),staleAfterSeconds:120,counterEpoch:'1',provenance:'hardware',coreStatus:status,rpmMilli:rpm*1000},builder:{status:'available',projected:{blockHeight:height,blockProgress:'0'},anchor:{blockHeight:'99'}},oracle:{state:'accepted'}};}
test('Practice button creates an explicitly simulated run with controls',()=>{
 const {document,game}=setup();assert.ok(game);document.querySelector('#start-practice').click();assert.equal(game.run.mode,'practice');assert.equal(document.querySelector('#lobby-panel').hidden,true);assert.equal(document.querySelector('#touch-controls').hidden,false);assert.match(document.querySelector('#mode-chip').textContent,/SIMULATED/);game.update(1/60);assert.ok(game.run.distance>0);game.destroy();
});
test('Live starts during genuine sleep with survival rules, then follows the waking wheel',()=>{
 const {document,game,now}=setup();game.receive(sample(now(),{rpm:0,status:'IDLE'}));assert.equal(document.querySelector('#start-live').disabled,false);assert.equal(game.start('live'),true);
 game.update(.05);assert.ok(game.run.travel>0);assert.equal(game.run.distance,0);assert.match(document.querySelector('#active-state').textContent,/SLEEP/);assert.match(document.querySelector('#mission-title').textContent,/sleep/i);
 game.receive(sample(now()));game.update(.05);assert.ok(game.run.distance>0);assert.equal(game.run.mode,'live');game.destroy();
});
test('Live timeout displays frozen curtain, stops distance and never catches up on recovery',()=>{
 const {document,game,now,advance}=setup();assert.ok(game);game.receive(sample(now()));game.start('live');game.update(.016);const distance=game.run.distance;
 advance(13000);game.update(.016);assert.equal(game.run.distance,distance);assert.equal(document.querySelector('#curtain').hidden,false);assert.match(document.querySelector('#curtain-title').textContent,/signal/i);
 game.receive(sample(now(),{height:'150'}));game.update(.016);assert.equal(game.run.checkpointCount,0);assert.equal(document.querySelector('#curtain').hidden,true);game.receive(sample(now(),{height:'151'}));assert.equal(game.run.checkpointCount,1);game.destroy();
});
test('menu and paused time never replay a checkpoint; home saves only its own mode',()=>{
 const {document,game,now}=setup();assert.ok(game);game.receive(sample(now()));game.receive(sample(now(),{height:'101'}));game.start('live');assert.equal(game.run.checkpointCount,0);document.querySelector('#pause').click();game.receive(sample(now(),{height:'102'}));assert.equal(game.run.checkpointCount,0);document.querySelector('#resume').click();game.run.pouch=8;document.querySelector('#home').click();game.update(.016);assert.equal(game.run.status,'home');assert.equal(document.querySelector('#best-live').textContent,'8');assert.equal(document.querySelector('#best-practice').textContent,'0');game.destroy();
});
test('keyboard and touch controls jump/duck and respect blur pause',()=>{
 const {document,game}=setup();assert.ok(game);game.start('practice');document.querySelector('#jump').dispatchEvent(new document.defaultView.Event('pointerdown'));game.update(.016);assert.ok(game.run.y>0);const e=new document.defaultView.Event('blur');document.defaultView.dispatchEvent(e);const elapsed=game.run.elapsed;game.update(.016);assert.equal(game.run.elapsed,elapsed);game.destroy();
});

test('blocked localStorage getter does not prevent the game from booting',()=>{const {game}=setup({blockedStorage:true});assert.ok(game);assert.equal(game.start('practice'),true);game.destroy();});

test('keyboard-generated Jump button click is operable without pointer events',()=>{const {document,game}=setup();game.start('practice');const e=new document.defaultView.Event('click');Object.defineProperty(e,'detail',{value:0});document.querySelector('#jump').dispatchEvent(e);game.update(.016);assert.ok(game.run.y>0);game.destroy();});

test('offline Live entry is an honest waiting room, with Practice kept separate',()=>{
 const {document,game,now}=setup();assert.equal(document.querySelector('#start-live').disabled,false);assert.equal(game.start('live'),true);game.update(.05);
 assert.equal(game.run.elapsed,0);assert.equal(game.run.travel,0);assert.equal(document.querySelector('#curtain').hidden,false);assert.match(document.querySelector('#curtain-copy').textContent,/Connecting to the wheel/);
 assert.equal(document.querySelector('#offline-practice').hidden,false);document.querySelector('#offline-practice').click();assert.equal(game.run.mode,'practice');assert.match(document.querySelector('#mode-chip').textContent,/SIMULATED/);
 game.destroy();
});
test('invalid hardware status displays the real reason and recovers into sleep without fake RPM',()=>{
 const {document,game,now}=setup();game.start('live');game.receive({});game.update(.016);assert.match(document.querySelector('#curtain-copy').textContent,/Status unavailable/);assert.equal(document.querySelector('#active-rpm').textContent,'— RPM');
 game.receive(sample(now(),{rpm:0,status:'IDLE'}));game.update(.016);assert.equal(document.querySelector('#curtain').hidden,true);assert.ok(game.run.travel>0);assert.equal(game.run.distance,0);assert.equal(game.run.checkpointCount,0);game.destroy();
});
test('heavy pouch warning, ZOOMIES feedback and bank mission completion are visible',()=>{
 const {document,game,now}=setup();game.receive(sample(now(),{rpm:75}));game.start('live');game.run.pouch=38;game.update(.05);
 assert.match(document.querySelector('#pouch-note').textContent,/stumble|steady/i);assert.match(document.querySelector('#pouch-hud').textContent,/38\/40.*steady/i);assert.equal(document.querySelector('#stage').getAttribute('data-zoomies'),'true');assert.equal(document.querySelector('#zoomies').hidden,false);assert.match(document.querySelector('#toast').textContent,/ZOOMIES/);
 document.querySelector('#home').click();game.update(.016);assert.equal(game.run.banked,38);assert.match(document.querySelector('#mission-count').textContent,/3/);assert.equal(document.querySelector('#result-missions').textContent,'3');assert.equal(document.querySelector('#result-banks').textContent,'1');game.destroy();
});
test('checkpoint banking has persistent safe-seed feedback and keeps the run open',()=>{
 const {document,game,now}=setup();game.receive(sample(now()));game.start('live');game.run.pouch=16;game.run.entities=[{kind:'burrow',x:game.run.x+3,width:72,alt:0,height:65,id:'101'}];game.update(.016);
 assert.equal(game.run.status,'running');assert.equal(document.querySelector('#bank-feedback').hidden,false);assert.match(document.querySelector('#bank-feedback').textContent,/16.*safe/i);assert.match(document.querySelector('#mission-count').textContent,/1/);game.destroy();
});

test('sleep-only runs retain a night-survival best without inventing seeds',()=>{
 const {document,game,now}=setup();game.receive(sample(now(),{rpm:0,status:'IDLE'}));game.start('live');game.run.spawnIn=1000;
 for(let i=0;i<250;i++)game.update(.05);document.querySelector('#home').click();game.update(.016);
 assert.equal(document.querySelector('#best-live-sleep').textContent,'12');assert.equal(document.querySelector('#best-practice-sleep').textContent,'0');assert.equal(document.querySelector('#best-live').textContent,'0');assert.equal(document.querySelector('#result-sleep').textContent,'12');game.destroy();
});
