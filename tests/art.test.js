import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {drawScene,drawHamster} from '../src/art.js';
import {createRun,checkpoint} from '../src/engine.js';
test('original pixel hamster paints a substantial sprite, not an emoji',()=>{
 const c=createCanvas(160,120);drawHamster(c.getContext('2d'),50,90,{scale:3,pouch:30,time:1});
 const pixels=c.getContext('2d').getImageData(0,0,160,120).data;assert.ok([...pixels].filter((v,i)=>i%4===3&&v>0).length>500);
});
test('desktop and portrait forest scenes paint completely without invalid coordinates',()=>{
 for(const [width,height]of [[960,450],[390,440]]){
 const c=createCanvas(width,height),s=createRun('practice',width,1);checkpoint(s,'2');s.entities.push({kind:'owl',x:width*.7,alt:29,width:45,height:24},{kind:'mushroom',x:width*.55,alt:0,width:32,height:35});
 drawScene(c.getContext('2d'),width,height,s,{phase:'running',rpm:75},2,{lobby:false});
 const pixels=c.getContext('2d').getImageData(0,0,width,height).data;assert.equal(pixels[3],255);assert.ok(new Set(pixels).size>40);
 }
});

test('ZOOMIES has an unmistakable static gold trail even with reduced motion',()=>{
 const width=800,height=420,s=createRun('live',width,1),ground=Math.round(height*.77);
 const normal=createCanvas(width,height),boost=createCanvas(width,height);
 drawScene(normal.getContext('2d'),width,height,s,{phase:'running',rpm:50},0,{reducedMotion:true});
 drawScene(boost.getContext('2d'),width,height,s,{phase:'running',rpm:75},0,{reducedMotion:true});
 const region=c=>c.getContext('2d').getImageData(s.x-60,ground-35,25,20).data;
 assert.notDeepEqual(region(boost),region(normal),'gold scarf trail is visible behind the hamster');
});
test('an overstuffed pressure warning is drawn above the player',()=>{
 const s=createRun('live',800,1);s.pouch=40;const low=createCanvas(800,420),high=createCanvas(800,420);
 drawScene(low.getContext('2d'),800,420,s,{phase:'running',rpm:50},0);s.pressure=.8;
 drawScene(high.getContext('2d'),800,420,s,{phase:'running',rpm:50},0);
 const region=c=>c.getContext('2d').getImageData(s.x-10,Math.round(420*.77)-80,20,20).data;
 assert.notDeepEqual(region(high),region(low));
});
