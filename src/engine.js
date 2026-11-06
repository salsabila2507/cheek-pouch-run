export const CAPACITY=40;
export function createRun(mode,width=960,seed=Date.now()) {
  if(!['live','practice'].includes(mode)) throw new Error('Unknown game mode');
  return {mode,width,x:Math.max(85,width*.2),status:'running',elapsed:0,distance:0,travel:0,pouch:0,banked:0,lives:3,
    y:0,vy:0,jumps:0,duck:false,entities:[],particles:[],events:[],spawnIn:2.8,seedIn:.6,invulnerable:0,danger:0,checkpoints:[],checkpointCount:0,rng:seed>>>0,combo:0,pressure:0,stumbleFor:0,zoomies:false,bankCount:0,bankFlash:0,lastBank:0,
    nest:0,nestFlash:0,recoverCount:0,
    missions:{completed:0,bankTarget:12,sleepSeconds:0,sleepTarget:12}};
}
function random(s){s.rng=(Math.imul(1664525,s.rng)+1013904223)>>>0;return s.rng/4294967296;}
export function loadFor(pouch){return Math.min(1,Math.max(0,(pouch-28)/12));}
export function speedFor(w,pouch=0){
  const base=w.phase==='sleeping'?175:Math.min(395,140+Math.max(0,w.rpm||0)*2.8);
  return base*(1-loadFor(pouch)*.25);
}
export function bankPouch(s) {
  const value=s.pouch;s.banked+=value;s.pouch=0;s.pressure=0;s.stumbleFor=0;
  if(value){
    s.bankCount++;s.bankFlash=2.6;s.lastBank=value;s.events.push({kind:'bank',value});
    while(s.banked>=s.missions.bankTarget){
      s.events.push({kind:'mission',title:`Banked ${s.missions.bankTarget} seeds`});
      s.missions.completed++;s.missions.bankTarget+=12;
    }
  }
  return value;
}

/** Nest stock built while awake softens the next sleep phase. Never fakes RPM. */
export function stockNest(s, amount) {
  const gain = Math.max(0, Math.floor(amount||0));
  if(!gain) return 0;
  s.nest = Math.min(24, s.nest + gain);
  s.nestFlash = 2.2;
  s.events.push({kind:'nest',value:gain});
  return gain;
}
/** Burrow choice: duck = recover a life for 10 seeds then bank the rest; land = bank all. */
export function resolveBurrow(s, {recover=false}={}) {
  if(recover && s.lives<3 && s.pouch>=10){
    s.pouch -= 10; s.lives++; s.recoverCount++; s.invulnerable = Math.max(s.invulnerable, 1.4);
    s.events.push({kind:'recover',value:10});
  }
  const banked = bankPouch(s);
  // Carry a little nest from each real-block bank so day prep matters at night.
  if(banked) stockNest(s, Math.min(6, Math.ceil(banked/5)));
  return banked;
}
/** Local objectives never create seeds or imitate wheel work. */
export function objectiveFor(s,w){
  if(w.phase==='unknown')return {title:'Wait for real wheel data',copy:'Your run is frozen. Practice is a separate simulation.',progress:0,target:1,unit:''};
  if(w.phase==='sleeping')return {title:`Survive ${s.missions.sleepTarget}s of sleep`,copy:s.nest?`Nest stock ${s.nest} softens owls. Jump mushrooms. Duck owls. No new seeds.`:'Jump mushrooms. Duck owls. Stock a nest while awake next time.',progress:s.missions.sleepSeconds,target:s.missions.sleepTarget,unit:'s'};
  const burrow=s.entities.some(e=>e.kind==='burrow'&&e.x>s.x-36);
  return {title:`Bank ${s.missions.bankTarget} seeds`,copy:burrow?'Burrow ahead · land to bank, or Duck+land to spend 10 seeds for +1 life then bank.':'Reach the next block’s burrow. Day banks also stock nest for night.',progress:s.banked,target:s.missions.bankTarget,unit:' seeds'};
}
export function checkpoint(s,id) {
  if(!/^(0|[1-9]\d*)$/.test(String(id)) || s.status!=='running' || s.checkpoints.includes(String(id))) return false;
  s.checkpoints.push(String(id));s.checkpointCount++;
  const start=Math.max(s.width+80,...s.entities.filter(e=>e.kind==='burrow').map(e=>e.x+260));
  // A safe approach lane. The real block creates a gameplay encounter, not a score grant.
  s.entities=s.entities.filter(e=>!['mushroom','owl'].includes(e.kind) || e.x<start-140);
  for(let i=0;i<5;i++)s.entities.push({kind:'gold',x:start-145+i*29,alt:28+Math.sin(i/4*Math.PI)*40,r:9,value:5});
  s.entities.push({kind:'burrow',x:start+40,width:72,height:65,alt:0,id:String(id)});
  s.events.push({kind:'checkpoint',id:String(id)});return true;
}
function burst(s,x,y,color,count=8){for(let i=0;i<count;i++)s.particles.push({x,y,vx:(random(s)-.5)*160,vy:80+random(s)*120,life:.45+random(s)*.4,color});}
function spawn(s,awake) {
  const inCheckpoint=s.entities.some(e=>e.kind==='burrow' && e.x>s.x && e.x<s.width+160);
  if(s.spawnIn<=0 && !inCheckpoint){
    const nestEase=!awake && s.nest>0;
    const owl=random(s)>(awake?.72:(nestEase?.62:.48));s.entities.push({kind:owl?'owl':'mushroom',x:s.width+70,alt:owl?29:0,width:owl?45:32,height:owl?24:35});
    s.spawnIn=(awake?1.65:(nestEase?1.35:1.08))+random(s)*.7;
  }
  if(s.seedIn<=0 && awake){
    const high=random(s)>.55;
    for(let i=0;i<4;i++)s.entities.push({kind:'seed',x:s.width+50+i*24,alt:high?65+Math.sin(i/3*Math.PI)*30:23,r:6,value:1});
    s.seedIn=1.2+random(s)*.8;
  }
}
export function stepRun(s,dt,w,input={}) {
  if(s.status!=='running' || w.phase==='unknown' || (s.mode==='live' && w.simulated))return s;
  dt=Math.min(.05,Math.max(0,dt));s.events=[];
  if(input.home){bankPouch(s);s.status='home';return s;}
  const awake=w.phase==='running',zoomies=awake && w.rpm>=70;
  if(zoomies&&!s.zoomies)s.events.push({kind:'zoomies'});s.zoomies=zoomies;
  s.bankFlash=Math.max(0,s.bankFlash-dt);s.stumbleFor=Math.max(0,s.stumbleFor-dt);
  s.elapsed+=dt;s.invulnerable=Math.max(0,s.invulnerable-dt);s.danger=Math.max(0,Math.min(1,s.danger+(awake?-dt*.4:dt*.18)));
  s.duck=!!input.duck && s.y===0;
  // Greed is a readable, controllable risk, never a random punishment.
  s.pressure=Math.max(0,s.pressure+(s.pouch>=36&&!s.duck?dt/3:-dt*.8));
  if(s.pressure>=1){
    const value=Math.ceil(s.pouch*.25);s.pouch-=value;s.pressure=0;s.stumbleFor=.65;s.combo=0;
    burst(s,s.x,25,'#e9bc71',12);s.events.push({kind:'stumble',value});
  }
  const speed=speedFor(w,s.pouch)*(s.stumbleFor>0?.65:1);s.travel+=speed*dt;if(awake)s.distance+=speed*dt/18;
  if(input.jump && s.jumps<2){s.vy=(s.jumps?390:455)*(1-loadFor(s.pouch)*.16);s.jumps++;s.duck=false;s.events.push({kind:'jump'});burst(s,s.x,s.y,'#f2c47d',4);}
  s.y+=s.vy*dt;s.vy-=1250*dt;
  if(s.y<=0){s.y=0;s.vy=0;s.jumps=0;}
  s.spawnIn-=dt;s.seedIn-=dt;spawn(s,awake);
  const height=s.duck?22:44;
  for(const e of s.entities){
    e.x-=speed*dt;
    if(e.kind==='burrow'){
      if(e.x<=s.x+e.width/2 && e.x>=s.x-e.width/2 && s.y<25){resolveBurrow(s,{recover:!!s.duck});s.invulnerable=Math.max(s.invulnerable,1.2);e.used=true;burst(s,s.x,25,s.duck?'#e9c48a':'#b6d6a2',18);s.events.push({kind:'safe'});}
      continue;
    }
    const close=Math.abs(e.x-s.x)<(e.width||12)/2+16;
    if(!close)continue;
    if(e.kind==='seed' || e.kind==='gold'){
      if(awake && e.alt>=s.y-7 && e.alt<=s.y+height+7 && s.pouch<CAPACITY){
        const gain=Math.min(CAPACITY-s.pouch,(e.value||1)*(zoomies?2:1));s.pouch+=gain;s.combo++;e.used=true;
        if(s.combo>0 && s.combo%5===0)stockNest(s,2);
        burst(s,e.x,e.alt,e.kind==='gold'?'#fff1a3':'#edbc66',4);s.events.push({kind:'seed',value:gain,golden:e.kind==='gold'});
      }
    }else if(s.invulnerable===0 && s.y<e.alt+e.height && s.y+height>e.alt){
      if(!awake && s.nest>=4){
        s.nest-=4;s.invulnerable=1.5;e.used=true;burst(s,s.x,20,'#c9dfb5',12);s.events.push({kind:'nest-save',value:4});
      }else{
        s.lives--;s.pouch=Math.floor(s.pouch/2);s.pressure=0;s.combo=0;s.invulnerable=1.6;e.used=true;burst(s,s.x,20,'#f38a83',15);s.events.push({kind:'hit'});
        if(s.lives<=0){s.status='over';s.pouch=0;break;}
      }
    }
  }
  if(!awake&&s.status==='running'){
    s.missions.sleepSeconds+=dt;
    if(s.nest>0){s.nest=Math.max(0,s.nest-dt*.35);s.nestFlash=Math.max(0,s.nestFlash-dt);}
    if(s.missions.sleepSeconds+1e-8>=s.missions.sleepTarget){
      s.events.push({kind:'mission',title:`Survived ${s.missions.sleepTarget}s of sleep`});
      s.missions.completed++;s.missions.sleepTarget+=12;
    }
  }else{
    s.nestFlash=Math.max(0,s.nestFlash-dt);
  }
  s.entities=s.entities.filter(e=>e.x>-100 && !e.used);
  for(const p of s.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=400*dt;p.life-=dt;}
  s.particles=s.particles.filter(p=>p.life>0).slice(-120);
  return s;
}
