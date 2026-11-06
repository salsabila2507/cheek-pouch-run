// All sprites and scenery are original code-drawn artwork. No external sprite sheet.
const P={o:'#3f3037',b:'#db8d53',h:'#f1b66c',l:'#ffe0a1',c:'#f09b82',s:'#77b3a0',d:'#467d76',w:'#fff8df',k:'#282a31'};
const HAMSTER=[
'       ooo    ooo      ',
'      obbco  obbco     ',
'      obhhoooohhho     ',
'    ooohhhhhhhhhhoo    ',
'   obbhhhhhhhhhhhhhho  ',
'  obbhhhhhhhhhhhhkkhho ',
' obbhhhhhhhhhhhlhwkhho ',
' obhhhhhhhhhhhllllhhho ',
'obhbhhhhhhhhhlllccchho ',
'obhbhhhhhhhlhlllcccclko',
' obhhhhhhhlllhllllllho ',
'  ohhhhhhlllllllhhho   ',
'  odddddddddddddho     ',
'   oddssssssddho       ',
'   obblllllllbho       ',
'    obboooobbho        ',
'    ooo    ooo         '];
function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function pixelSprite(ctx,rows,x,y,scale,palette){for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row].length;col++){const c=palette[rows[row][col]];if(c)rect(ctx,x+col*scale,y+row*scale,scale,scale,c);}}
export function drawHamster(ctx,x,ground,{scale=2.6,pouch=0,time=0,jump=false,duck=false,sleep=false}={}){
  ctx.save();ctx.translate(Math.round(x-11*scale),Math.round(ground-17*scale));
  if(duck){ctx.translate(0,8*scale);ctx.scale(1.12,.55);}
  pixelSprite(ctx,HAMSTER,0,0,scale,P);
  const cheek=1+Math.floor(pouch/10);rect(ctx,17*scale,8*scale,(3+cheek)*scale,3*scale,P.c);rect(ctx,18*scale,9*scale,2*scale,scale,'#ffc7a0');
  if(!jump&&!sleep&&!duck){const stride=Math.floor(time*11)%2;rect(ctx,(stride?5:7)*scale,16*scale,4*scale,2*scale,P.o);rect(ctx,(stride?14:12)*scale,16*scale,4*scale,2*scale,P.o);}
  if(sleep){rect(ctx,16*scale,5*scale,3*scale,scale,P.h);rect(ctx,16*scale,6*scale,3*scale,scale,P.o);}
  // Tiny mint scarf tails trail behind.
  rect(ctx,-3*scale,12*scale,4*scale,scale,P.s);rect(ctx,-5*scale,11*scale,3*scale,scale,P.d);
  ctx.restore();
}
function pine(ctx,x,base,height,color){
 const unit=height/10;rect(ctx,x-unit*.45,base-height*.36,unit*.9,height*.36,color);
 for(let j=0;j<5;j++){const y=base-height+j*unit*1.45,half=(j+1)*unit*.72;rect(ctx,x-half,y,half*2,unit*1.65,color);}
}
function cloud(ctx,x,y,s,color){rect(ctx,x+12*s,y,38*s,8*s,color);rect(ctx,x,y+8*s,70*s,13*s,color);rect(ctx,x+7*s,y+21*s,55*s,5*s,color);}
function seed(ctx,x,y,gold,time){
 const c=gold?'#ffde79':'#e9bc71';if(gold){ctx.globalAlpha=.16+.05*Math.sin(time*7);rect(ctx,x-13,y-13,26,26,c);ctx.globalAlpha=1;}
 rect(ctx,x-4,y-6,8,12,'#795134');rect(ctx,x-6,y-3,12,6,'#795134');rect(ctx,x-3,y-5,6,10,c);rect(ctx,x-4,y-2,8,4,c);rect(ctx,x-1,y-4,2,5,'#fff1b6');
 if(gold){rect(ctx,x+10,y-10,2,6,'#fff4b8');rect(ctx,x+8,y-8,6,2,'#fff4b8');}
}
function mushroom(ctx,x,base,size=1,danger=false){
 const u=size;rect(ctx,x-7*u,base-17*u,14*u,17*u,'#e3bf8c');rect(ctx,x-20*u,base-28*u,40*u,11*u,'#443b40');rect(ctx,x-16*u,base-36*u,32*u,10*u,'#443b40');
 rect(ctx,x-13*u,base-35*u,26*u,9*u,danger?'#a45f9c':'#e19475');rect(ctx,x-18*u,base-26*u,36*u,7*u,danger?'#8a507d':'#c87962');
 rect(ctx,x-8*u,base-32*u,6*u,4*u,'#f4d4a7');rect(ctx,x+6*u,base-26*u,7*u,4*u,'#f4d4a7');rect(ctx,x-4*u,base-14*u,3*u,11*u,'#f8dfb1');
}
function owl(ctx,x,y,time){
 const wing=Math.sin(time*12)>0?-8:1;
 rect(ctx,x-27,y+wing,14,10,'#514353');rect(ctx,x+14,y+wing,14,10,'#514353');rect(ctx,x-16,y-13,32,27,'#3d3345');rect(ctx,x-12,y-16,24,31,'#9986a1');
 rect(ctx,x-12,y-8,10,11,'#e9c9a7');rect(ctx,x+2,y-8,10,11,'#e9c9a7');rect(ctx,x-8,y-5,3,5,'#3d3345');rect(ctx,x+6,y-5,3,5,'#3d3345');rect(ctx,x-2,y+1,5,5,'#e0a66d');
}
function burrow(ctx,x,base,time){
 rect(ctx,x-47,base-54,94,54,'#39524d');rect(ctx,x-38,base-66,76,15,'#526c56');rect(ctx,x-29,base-75,58,12,'#6a835f');
 rect(ctx,x-25,base-44,50,44,'#202e30');rect(ctx,x-18,base-51,36,12,'#202e30');rect(ctx,x-16,base-39,32,39,'#b77d50');rect(ctx,x-9,base-41,18,41,'#e8b572');
 rect(ctx,x-24,base-6,48,6,'#e5c28c');rect(ctx,x+44,base-82,4,82,'#a57f61');
 rect(ctx,x+28,base-91,47,20,'#ecd7aa');ctx.fillStyle='#3f5347';ctx.font='bold 9px monospace';ctx.fillText('BANK',x+37,base-77);
 rect(ctx,x-50,base-43,4,11,'#ffd989');ctx.globalAlpha=.22+.1*Math.sin(time*3);rect(ctx,x-60,base-53,24,30,'#ffdb86');ctx.globalAlpha=1;
}
export function drawScene(ctx,width,height,s,w,time=0,{lobby=false,reducedMotion=false}={}){
 const ground=Math.round(height*.77),sleep=w.phase==='sleeping',travel=lobby?(reducedMotion?0:time*13):s.travel;
 ctx.imageSmoothingEnabled=false;
 rect(ctx,0,0,width,height,sleep?'#3d4d5d':'#b8c9b2');
 // Stepped setting sun and distant wisps.
 const sunX=width*.76,sunY=height*.25;
 rect(ctx,sunX-39,sunY-30,78,60,sleep?'#d1d6ba':'#f3db9f');rect(ctx,sunX-29,sunY-40,58,80,sleep?'#d1d6ba':'#f3db9f');
 if(sleep)rect(ctx,sunX+1,sunY-39,40,60,'#3d4d5d');
 for(let i=0;i<4;i++){const x=((i*277-travel*.1)%(width+180)+width+180)%(width+180)-90;cloud(ctx,x,55+(i%3)*26,.8,sleep?'#607080':'#d5ddbb');}
 const layers=[{gap:95,height:height*.38,base:ground-20,speed:.13,color:sleep?'#354857':'#829c89'},
 {gap:132,height:height*.52,base:ground,speed:.28,color:sleep?'#2d404b':'#587e71'},
 {gap:224,height:height*.68,base:ground+8,speed:.49,color:sleep?'#243941':'#355e56'}];
 for(const [li,l]of layers.entries())for(let i=-2;i<Math.ceil(width/l.gap)+3;i++){
  const x=i*l.gap-(travel*l.speed)%l.gap;pine(ctx,x,l.base,l.height*(.72+((i+8)%3)*.14),l.color);
  if(li===2)rect(ctx,x+2,ground-l.height*.34,4,l.height*.3,sleep?'#354c4d':'#4a7060');
 }
 // Ground: moss fringe, roots, earth strata.
 rect(ctx,0,ground,width,height-ground,'#344c41');rect(ctx,0,ground,width,9,'#a4b57b');rect(ctx,0,ground+9,width,10,'#657f54');
 for(let i=-1;i<width/24+2;i++){const x=i*24-(travel%24);rect(ctx,x,ground+5,11,11,'#8ea767');rect(ctx,x+8,ground+15,5,8,'#526b4c');}
 rect(ctx,0,ground+27,width,height-ground-27,'#3d3b35');
 for(let i=-2;i<width/67+2;i++){const x=i*67-(travel*.95)%67;rect(ctx,x,ground+35,18,4,'#555044');rect(ctx,x+28,ground+62,8,5,'#6b604a');rect(ctx,x-4,ground+90,27,3,'#4c4a3d');}
 // Branches at the edges frame the clearing.
 rect(ctx,0,0,22,height*.56,'#294d47');rect(ctx,18,65,43,11,'#294d47');rect(ctx,51,52,14,24,'#294d47');
 rect(ctx,width-16,0,16,height*.39,'#294d47');rect(ctx,width-55,38,41,13,'#294d47');
 for(let i=0;i<18;i++){
  const x=(i*83+Math.sin(i*8)*37+width) % width, y=height*.23+(i*43)%(ground*.61);
  ctx.globalAlpha=.18+.3*(.5+.5*Math.sin(time*1.9+i));rect(ctx,x+Math.sin(time+i)*5,y,3,3,'#fff2b0');
 }ctx.globalAlpha=1;
 if(lobby){
  burrow(ctx,width*.16,ground,time);mushroom(ctx,width*.67,ground,1.1);mushroom(ctx,width*.73,ground,.55);mushroom(ctx,width*.91,ground,.8);
  for(let i=0;i<6;i++)seed(ctx,width*.46+i*32,ground-69-Math.sin(i/5*Math.PI)*32,i===5,time);
  // Hero hamster is larger than the gameplay sprite and wears the same mint scarf.
  drawHamster(ctx,width*.36,ground,{scale:width<500?3.2:4.4,pouch:25,time,sleep});
 }else{
  const zooming=w.phase==='running'&&w.rpm>=70;
  if(zooming){
   // A static golden scarf wake remains legible with reduced motion.
   rect(ctx,s.x-58,ground-s.y-28,20,4,'#ffe0a1');rect(ctx,s.x-48,ground-s.y-18,15,3,'#e9bc71');
   if(!reducedMotion)for(let i=3;i>0;i--){ctx.globalAlpha=.07+(3-i)*.035;drawHamster(ctx,s.x-i*17,ground-s.y,{scale:2.6,pouch:s.pouch,time,jump:s.y>0,duck:s.duck});}
   ctx.globalAlpha=1;
  }
  for(const e of s.entities){const y=ground-e.alt;
   if(e.kind==='seed'||e.kind==='gold') {ctx.globalAlpha=sleep?.28:1;seed(ctx,e.x,y,e.kind==='gold',time);ctx.globalAlpha=1;}
   else if(e.kind==='mushroom')mushroom(ctx,e.x,ground,.95,sleep);
   else if(e.kind==='owl')owl(ctx,e.x,y-e.height/2,time);
   else if(e.kind==='burrow'){
    burrow(ctx,e.x,ground,time);
    rect(ctx,e.x-44,ground-113,88,17,'#263e35');ctx.fillStyle='#fff0ce';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('LAND TO BANK',e.x,ground-101);ctx.textAlign='start';
    rect(ctx,e.x-2,ground-93,4,8,'#fff0ce');rect(ctx,e.x-6,ground-88,12,3,'#fff0ce');
   }
  }
  ctx.globalAlpha=s.invulnerable>0 && Math.floor(time*15)%2?.35:1;
  rect(ctx,s.x-24,ground-2,48,4,'#263e38');
  drawHamster(ctx,s.x,ground-s.y,{scale:2.6,pouch:s.pouch,time,jump:s.y>0,duck:s.duck});ctx.globalAlpha=1;
  if(s.pressure>.6){
   rect(ctx,s.x-8,ground-s.y-79,16,19,'#263e35');rect(ctx,s.x-2,ground-s.y-76,4,8,'#ffe0a1');rect(ctx,s.x-2,ground-s.y-65,4,3,'#ffe0a1');
  }
  for(const p of s.particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(ctx,p.x,ground-p.y,4,4,p.color);}ctx.globalAlpha=1;
 }
 // Foreground ferns and pixel flowers.
 for(let i=-1;i<width/150+2;i++){
  const x=i*150-(travel*.6)%150;rect(ctx,x,ground+9,4,17,'#b8c98a');rect(ctx,x-7,ground+13,19,4,'#8da56a');rect(ctx,x-4,ground+8,12,4,'#9bb773');
  if(i%2===0){rect(ctx,x+58,ground-4,3,13,'#5b8058');rect(ctx,x+54,ground-9,11,7,'#dfb99c');rect(ctx,x+58,ground-7,3,3,'#f7dda1');}
 }
 if(!lobby&&w.rpm>=70&&w.phase==='running'&&!reducedMotion){ctx.globalAlpha=.18;for(let i=0;i<7;i++)rect(ctx,(time*400+i*183)%width,80+i*31,24+(i%3)*20,2,'#fff4b2');ctx.globalAlpha=1;}
 if(s.danger>0){ctx.fillStyle=`rgba(72,37,72,${s.danger*.17})`;ctx.fillRect(0,0,width,ground);}
}
