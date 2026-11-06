import {createCanvas} from '@napi-rs/canvas';
import {writeFileSync,mkdirSync} from 'node:fs';
import {drawScene} from '../src/art.js';
import {createRun} from '../src/engine.js';
mkdirSync('artifacts',{recursive:true});
for(const [name,width,height,lobby,sleep]of [['forest-desktop',960,450,true,false],['forest-mobile',390,430,false,false],['forest-sleep',960,450,false,true]]){
 const c=createCanvas(width,height),s=createRun('practice',width,1);s.travel=230;s.pouch=26;
 s.entities=[{kind:'mushroom',x:width*.6,alt:0,width:32,height:35},{kind:'owl',x:width*.85,alt:29,width:45,height:24},...Array.from({length:6},(_,i)=>({kind:'seed',x:width*.38+i*25,alt:60+Math.sin(i/5*Math.PI)*25,r:6,value:1}))];
 drawScene(c.getContext('2d'),width,height,s,{phase:sleep?'sleeping':'running',rpm:sleep?0:74},3,{lobby});writeFileSync(`artifacts/${name}.png`,c.toBuffer('image/png'));
}
