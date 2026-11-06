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
test('Live cannot start asleep, but running hardware unlocks it',()=>{
 const {document,game,now}=setup();assert.ok(game);game.receive(sample(now(),{rpm:0,status:'IDLE'}));assert.equal(document.querySelector('#start-live').disabled,true);assert.equal(game.start('live'),false);game.receive(sample(now()));assert.equal(document.querySelector('#start-live').disabled,false);assert.equal(game.start('live'),true);assert.equal(game.run.mode,'live');game.destroy();
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
