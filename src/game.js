import {WheelTracker,practiceWheel} from './wheel.js';
import {createStatusPoller} from './transport.js';
import {createRun,stepRun,checkpoint,CAPACITY,loadFor,objectiveFor,stockNest} from './engine.js';
import {drawScene} from './art.js';
import {readRecord,saveRecord,grantSealBoost,consumeSealBoost,readSealBoost} from './storage.js';
import {createBurrowSeal,SEAL_NEST_BOOST,sealGrantsNestBoost,sealWindowLabel} from './onchain.js';

export function bootGame({document=globalThis.document,window=globalThis.window,clock=()=>Date.now(),storage,fetchImpl=globalThis.fetch,autoPoll=true,autoFrame=true}={}){
 if(storage===undefined){try{storage=window.localStorage;}catch{storage=null;}}
 const $=id=>document.getElementById(id),canvas=$('scene'),stage=$('stage'),ctx=canvas.getContext('2d');
 if(!ctx){$('live-note').textContent='Canvas 2D is unavailable in this browser.';return null;}
 const tracker=new WheelTracker(),reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const input={jump:false,duck:false,home:false};let run=null,paused=false,saved=false,lastPracticeHeight='1',animTime=0,toastUntil=0,width=800,height=420,dpr=1,rafId=0,lastFrame=0,destroyed=false,curtainType='';
 let previousPhase=null,seal=null,lastBlockAt=null,pendingBanked=0;
 let sound=false,audio=null,lastSeedSound=0;const removers=[];
 function on(target,type,fn,opts){target.addEventListener(type,fn,opts);removers.push(()=>target.removeEventListener(type,fn,opts));}
 function text(id,value){const node=$(id),string=String(value);if(node.textContent!==string)node.textContent=string;}
 function show(id,visible){$(id).hidden=!visible;}
 function effect(kind){
   if(!sound)return;
   try{
     const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
     audio??=new Audio();if(audio.state==='suspended')void audio.resume();
     if(kind==='seed'&&animTime-lastSeedSound<.07)return;if(kind==='seed')lastSeedSound=animTime;
     const note={jump:[330,510,.09],seed:[740,1040,.065],hit:[160,60,.2],bank:[520,920,.22],checkpoint:[440,880,.25],zoomies:[600,1200,.3],mission:[660,990,.2],stumble:[220,120,.15],home:[440,660,.2],recover:[480,760,.18],nest:[500,820,.14],'nest-save':[360,620,.16]}[kind];if(!note)return;
     const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime;
     osc.type=kind==='hit'?'sawtooth':'square';osc.frequency.setValueAtTime(note[0],at);osc.frequency.exponentialRampToValueAtTime(note[1],at+note[2]);gain.gain.setValueAtTime(.018,at);gain.gain.exponentialRampToValueAtTime(.0001,at+note[2]);osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+note[2]);
   }catch{/* Sound never blocks play. */}
 }
 function resize(){
   const old=width;width=Math.max(300,Math.round(stage.clientWidth||800));height=Math.max(230,Math.round(stage.clientHeight||420));dpr=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   if(run&&old!==width){const factor=width/old;run.width=width;run.x=Math.max(85,width*.2);for(const e of run.entities)e.x*=factor;}
 }
 function records(){const live=readRecord('live',storage),practice=readRecord('practice',storage);text('best-live',live.best);text('best-practice',practice.best);text('best-live-sleep',live.sleep);text('best-practice-sleep',practice.sleep);text('seal-seeds',live.best);seal?.paintWallet?.();}
 function notice(message,seconds=3){text('toast',message);toastUntil=animTime+seconds;show('toast',true);}
 function telemetry(){
   const w=tracker.current(clock());$('connection-dot').className=`status-dot ${w.phase}`;text('rpm',w.rpm===null?'—':w.rpm.toFixed(1));text('block',w.height||'—');$('block').title=w.height?`Projected (not settled): ${w.height}`:'Unknown';
   text('wheel-state',w.phase==='running'?'ON THE WHEEL':w.phase==='sleeping'?'NAPPING':'NO SIGNAL');
   text('live-note',w.phase==='running'?(w.rpm>=70?'He has the zoomies. Good luck, little legs.':'The real wheel is turning. Your trail is open.'):w.phase==='sleeping'?"He's napping. Live is open: survive the night. No new seeds or run metres.":`${w.reason}. Enter Live to wait, or play the separate Practice simulation.`);
   $('start-live').disabled=false;text('start-live',w.phase==='running'?'Run with Squeektoshi ↗':w.phase==='sleeping'?'Survive the sleep phase ↗':'Enter Live waiting room ↗');
   text('source-summary',w.phase==='unknown'?'Live waiting · no signal · Practice is simulated':`Hardware telemetry · settled #${w.settledHeight}`);
   return w;
 }
 function setCurtain(kind,w){
   curtainType=kind;show('curtain',!!kind);show('result-stats',kind==='result');show('retry',kind==='result');show('resume',kind==='pause');show('offline-practice',kind==='offline');if(kind!=='result'){const sealBox=$('result-seal');if(sealBox)sealBox.hidden=true;}
   if(kind==='offline'){
     text('curtain-kicker','LIVE · OFFLINE WAITING ROOM');text('curtain-title','Waiting for a signal.');text('curtain-copy',`${w?.reason||'Wheel data unavailable'}. Still checking the real API. Your pouch and trail are frozen; no simulated RPM or score. Practice is separate.`);text('back','End run (unbanked seeds lost)');
   }else if(kind==='pause'){
     text('curtain-kicker',run?.mode==='practice'?'PRACTICE · SIMULATED':'LIVE · REAL WHEEL');text('curtain-title','Paws on pause.');text('curtain-copy','Your pouch is safe. Blocks seen while paused do not grant catch-up checkpoints.');text('back','End run (unbanked seeds lost)');
   }else if(kind==='result'){
     text('curtain-kicker',run.mode==='practice'?'PRACTICE · SEPARATE LOCAL RECORD':'LIVE · LOCAL RECORD');text('curtain-title',run.status==='home'?'Home, sweet burrow.':'The forest got you.');text('curtain-copy',run.status==='home'?"Good instincts. Your cheeks made it home.":'Three scrapes. One lesson. Banked seeds are safe; the rest stayed in the forest.');text('result-seeds',run.banked);text('result-distance',Math.floor(run.distance));text('result-missions',run.missions.completed);text('result-banks',run.bankCount);text('result-sleep',Math.floor(run.missions.sleepSeconds));
     const extra=$('result-extra');if(extra&&run.recoverCount)extra.textContent=`${run.bankCount} BANKS · ${run.missions.completed} GOALS · ${Math.floor(run.missions.sleepSeconds)}s NIGHT · ${run.recoverCount} HEALS`;
     pendingBanked=run.banked||0;
     const sealBox=$('result-seal');
     if(sealBox){sealBox.hidden=!(run.banked>0);seal?.paintWallet?.();}
     text('back','Back to the burrow');
   }else{
     const sealBox=$('result-seal');if(sealBox)sealBox.hidden=true;
   }
 }
 function start(mode){
   if(!['practice','live'].includes(mode))return false;
   run=createRun(mode,width);paused=false;saved=false;lastPracticeHeight='1';Object.assign(input,{jump:false,duck:false,home:false});curtainType='';toastUntil=0;previousPhase=null;pendingBanked=0;
   show('lobby-caption',false);show('lobby-panel',false);show('run-panel',true);show('run-hud',true);show('mission-strip',true);show('bank-feedback',false);show('touch-controls',true);show('pause',true);show('curtain',false);show('toast',false);show('seal-window',false);
   text('mode-chip',mode==='practice'?'PRACTICE · SIMULATED':'LIVE · REAL WHEEL');text('active-label',mode==='practice'?'PRACTICE · SIMULATED WHEEL':'LIVE · REAL WHEEL');text('pause','Ⅱ');$('pause').setAttribute('aria-label','Pause game');
   if(mode==='live'){
     const boost=consumeSealBoost(storage);
     if(boost){stockNest(run,SEAL_NEST_BOOST);notice('Sealed burrow soft-start · nest ready for night.',3.6);effect('nest');}
   }
   resize();stage.focus?.({preventScroll:true});if(window.innerWidth<=760)stage.scrollIntoView?.({block:'start',behavior:reducedMotion?'auto':'smooth'});effect('jump');notice('Tap twice to double jump. Hold ↓ to duck.',3.8);seal?.paintWallet?.();return true;
 }
 function finish(){if(saved||!run||run.status==='running')return;saved=true;pendingBanked=run.banked||0;saveRecord(run.mode,run,storage);records();show('touch-controls',false);show('pause',false);show('seal-window',false);setCurtain('result');effect(run.status==='home'?'home':'hit');$('retry').disabled=false;text('retry','One more run ↗');$('retry').focus?.({preventScroll:true});seal?.paintWallet?.();}
 function lobby(){
   if(run&&!saved){run.pouch=0;run.status='over';saveRecord(run.mode,run,storage);records();}
   run=null;paused=false;Object.assign(input,{jump:false,duck:false,home:false});show('curtain',false);show('run-panel',false);show('run-hud',false);show('mission-strip',false);show('bank-feedback',false);show('seal-window',false);stage.setAttribute('data-zoomies','false');show('touch-controls',false);show('pause',false);show('toast',false);show('lobby-caption',true);show('lobby-panel',true);text('mode-chip','READY WHEN YOU ARE');resize();$('start-practice').focus?.({preventScroll:true});
 }
 function togglePause(force){
   if(!run||run.status!=='running')return;paused=force??!paused;input.jump=false;input.duck=false;
   text('pause',paused?'▶':'Ⅱ');$('pause').setAttribute('aria-label',paused?'Resume game':'Pause game');if(paused){setCurtain('pause');$('resume').focus?.({preventScroll:true});}else{setCurtain('');stage.focus?.({preventScroll:true});}
 }
 function receive(raw){
   const w=tracker.ingest(raw,clock());
   if(w.checkpoint&&run?.mode==='live'&&run.status==='running'&&!paused){checkpoint(run,w.checkpoint);lastBlockAt=clock();notice(`WHEEL BLOCK #${w.checkpoint} · Golden seeds + bank ahead · seal window open`,4);effect('checkpoint');seal?.paintWallet?.();}
   telemetry();
 }
 const poller=createStatusPoller({fetchImpl,onSnapshot:receive,onFailure:reason=>{tracker.fail(reason);telemetry();}});
 function currentWheel(){return run?.mode==='practice'?practiceWheel(run.elapsed):tracker.current(clock());}
 function hud(w){
   text('pouch',run.pouch);text('banked',run.banked);text('run-distance',Math.floor(run.distance));text('hearts',Array.from({length:3},(_,i)=>i<run.lives?'♥':'♡').join(' '));$('hearts').setAttribute('aria-label',`${run.lives} lives`);
   const nestEl=$('nest-hud');if(nestEl){nestEl.hidden=run.nest<=0&&run.nestFlash<=0;nestEl.textContent=run.nest>0?`🪺 Nest ${Math.ceil(run.nest)}`:'🪺 Nest ready';nestEl.classList.toggle('flash',run.nestFlash>0);}
   $('pouch-fill').style.width=`${run.pouch/CAPACITY*100}%`;$('pouch-meter').setAttribute('aria-valuenow',String(run.pouch));
   text('pouch-note',run.pouch>=36?`Stumble risk · ${Math.round(run.pressure*100)}% pressure. Hold Duck to steady, or bank.`:run.pouch>=30?`Heavy cheeks · ${Math.round(loadFor(run.pouch)*25)}% slower. Bank to shed the weight.`:run.pouch>=15?'Looking suspiciously snack-shaped.':'Little cheeks. Big potential.');
   $('pouch-meter').setAttribute('data-heavy',String(run.pouch>=30));$('pressure-fill').style.width=`${run.pressure*100}%`;
   text('load-state',run.pouch>=36?'OVERSTUFFED':run.pouch>=30?'HEAVY':'LIGHT');
   text('pouch-hud',`${run.pouch}/40 seeds · ${run.pouch>=36?`${Math.round(run.pressure*100)}% pressure · Duck to steady`:run.pouch>=30?'heavy':'light'}`);
   const goal=objectiveFor(run,w),percent=Math.min(100,Math.round(goal.progress/goal.target*100));
   text('mission-title',goal.title);text('mission-copy',goal.copy);text('mission-count',`${run.missions.completed} GOALS`);text('mission-progress',w.phase==='unknown'?'WAITING':`${Math.floor(goal.progress)} / ${goal.target}${goal.unit}`);
   $('mission-fill').style.width=`${percent}%`;$('mission-meter').setAttribute('aria-valuenow',String(percent));
   show('bank-feedback',run.bankFlash>0||run.nestFlash>0);
   if(run.bankFlash>0)text('bank-feedback',`+${run.lastBank} seeds safe · nest +${Math.min(6,Math.ceil(run.lastBank/5))}`);
   else if(run.nestFlash>0)text('bank-feedback',`Nest stocked · night will be softer`);
   text('active-state',w.phase==='running'?'RUNNING':w.phase==='sleeping'?'SLEEPING':'NO SIGNAL');$('active-dot').className=`status-dot ${w.phase}`;text('active-rpm',w.rpm===null?'— RPM':`${Math.round(w.rpm)} RPM`);
   text('active-block',w.simulated?`Simulated block #${w.height}`:`Projected block ${w.height?'#'+w.height:'—'}`);text('settled-block',w.simulated?'Training clock · not onchain':`Settled ${w.settledHeight?'#'+w.settledHeight:'—'} · Ethereum Sepolia`);$('block-fill').style.width=`${w.progress*100}%`;
   const zooming=w.phase==='running'&&w.rpm>=70;show('zoomies',zooming);stage.setAttribute('data-zoomies',String(zooming));
   text('mode-chip',run.mode==='practice'?'PRACTICE · SIMULATED':w.phase==='sleeping'?'LIVE · SLEEP SURVIVAL':w.phase==='unknown'?'LIVE · WAITING':'LIVE · REAL WHEEL');$('home').disabled=w.phase==='unknown'||run.status!=='running';text('home',w.phase==='sleeping'?'Retreat & save your pouch ↗':'Go home & bank ↗');
   text('trail-tip',w.phase==='unknown'?'No signal, no movement, no score. Your existing pouch stays untouched.':w.phase==='sleeping'?"Night rules: slower trail, more owls and mushrooms. Survive for local goals or retreat with your pouch. No new seeds or run metres.":'Seeds in your cheeks are at risk. Head home to bank, or land at the next block’s burrow to keep running.');
   const ctx={mode:run.mode,banked:Math.max(pendingBanked,run.banked||0),lastBlockAt,now:clock()};
   const open=sealGrantsNestBoost(ctx);
   const strip=$('seal-window');
   if(strip){strip.hidden=!(run.mode==='live'&&run.status==='running'&&open);if(!strip.hidden)text('seal-window-copy',sealWindowLabel(ctx));}
   seal?.paintWallet?.();
 }
 function update(dt){
   dt=Math.min(.05,Math.max(0,dt));animTime+=dt;const live=telemetry();let w=currentWheel();
   if(run){
     if(run.status==='running'&&!paused){
       if(w.phase==='unknown'){setCurtain('offline',w);input.jump=false;input.duck=false;input.home=false;}
       else{
         if(curtainType==='offline')setCurtain('');
         if(run.mode==='practice'&&w.height!==lastPracticeHeight){lastPracticeHeight=w.height;if(w.phase==='running'){checkpoint(run,w.height);notice(`SIMULATED BLOCK #${w.height} · Bank ahead`,3);effect('checkpoint');}}
         if(w.phase==='sleeping'&&previousPhase!=='sleeping')notice('SLEEP PHASE · Survive the night. No new seeds or run metres.',4);
         if(w.phase==='running'&&previousPhase==='sleeping')notice('The wheel is awake. Seeds and run metres are back.',3);
         previousPhase=w.phase;
         stepRun(run,dt,w,input);input.jump=false;input.home=false;
         for(const event of run.events){
           effect(event.kind);
           if(event.kind==='zoomies')notice('ZOOMIES · 70+ RPM. Every seed is worth DOUBLE!',3);
           if(event.kind==='hit')notice('Ouch. Half your pouch spilled.',2);
           if(event.kind==='stumble')notice(`Stumbled! ${event.value} seeds spilled. Hold Duck to steady full cheeks.`,3);
           if(event.kind==='bank'){pendingBanked=run.banked||0;notice(`${event.value} seeds banked. Weight gone.${run.events.some(e=>e.kind==='mission')?' Goal complete!':''} Checkpoint ready to seal.`,3);seal?.paintWallet?.();}
           if(event.kind==='recover')notice(`Spent ${event.value} seeds · +1 life. Rest banked.`,3);
           if(event.kind==='nest')notice(`Nest +${event.value}. Sleep hazards will ease.`,2.4);
           if(event.kind==='nest-save')notice('Nest absorbed the hit. Keep ducking owls.',2.2);
           if(event.kind==='mission'&&!run.events.some(e=>e.kind==='bank'))notice(`GOAL COMPLETE · ${event.title}. No bonus seeds.`,3);
         }
       }
     }
     w=currentWheel();hud(w);finish();
     if(saved){$('retry').disabled=false;text('retry',run.mode==='live'&&live.phase==='unknown'?'Enter Live waiting room ↗':'One more run ↗');}
   }
   if(animTime>toastUntil)show('toast',false);
   const sceneRun=run||{travel:0,danger:0};drawScene(ctx,width,height,sceneRun,run?w:live,reducedMotion&&!run?0:animTime,{lobby:!run,reducedMotion});
 }
 on($('start-live'),'click',()=>start('live'));on($('start-practice'),'click',()=>start('practice'));
 on($('pause'),'click',()=>togglePause());on($('resume'),'click',()=>togglePause(false));on($('retry'),'click',()=>start(run?.mode||'practice'));on($('back'),'click',lobby);
 on($('offline-practice'),'click',()=>{lobby();start('practice');});
 on($('home'),'click',()=>{if(run?.status==='running'&&!paused&&currentWheel().phase!=='unknown')input.home=true;});
 on($('sound'),'click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Disable game sound':'Enable game sound');text('sound-state',sound?'on':'off');if(sound)effect('seed');});
 const jump=event=>{event.preventDefault?.();if(run?.status==='running'&&!paused)input.jump=true;};
 on($('jump'),'pointerdown',jump);on($('jump'),'click',event=>{if(event.detail===0)jump(event);});on(stage,'pointerdown',event=>{if(event.target===canvas||event.target===stage)jump(event);});
 on($('duck'),'pointerdown',event=>{event.preventDefault();if(!paused)input.duck=true;});
 on($('duck'),'keydown',event=>{if(['Space','Enter'].includes(event.code)){event.preventDefault();event.stopPropagation();if(!paused)input.duck=true;}});
 on($('duck'),'keyup',event=>{if(['Space','Enter'].includes(event.code)){event.preventDefault();event.stopPropagation();input.duck=false;}});
 for(const name of ['pointerup','pointercancel'])on(window,name,()=>{input.duck=false;});
 on(window,'keydown',event=>{
   if(!run)return;const tag=event.target?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;
   if(['KeyP','Escape'].includes(event.code)){event.preventDefault();if(!event.repeat)togglePause();return;}
   if(run.status!=='running'||paused)return;
   if(['Space','ArrowUp','KeyW'].includes(event.code)){
     if(event.code==='Space'&&tag==='BUTTON')return;event.preventDefault();if(!event.repeat)input.jump=true;
   }else if(['ArrowDown','KeyS'].includes(event.code)){event.preventDefault();input.duck=true;}
   else if(event.code==='KeyH'){event.preventDefault();if(currentWheel().phase!=='unknown')input.home=true;}
 });
 on(window,'keyup',event=>{if(['ArrowDown','KeyS'].includes(event.code))input.duck=false;});
 on(window,'blur',()=>{if(run?.status==='running')togglePause(true);});
 on(document,'visibilitychange',()=>{if(document.hidden){tracker.fail('Tab was inactive');if(run?.status==='running')togglePause(true);}});
 on(window,'resize',resize);const observer=window.ResizeObserver?new window.ResizeObserver(resize):null;observer?.observe(stage);
 function frame(at){if(destroyed)return;const dt=lastFrame?Math.min((at-lastFrame)/1000,.05):0;lastFrame=at;update(dt);rafId=window.requestAnimationFrame(frame);}
 seal=createBurrowSeal({
   document,ethereum:window.ethereum,fetchImpl,
   getSeedCount:()=>Math.max(pendingBanked,readRecord('live',storage).best),
   getSealContext:()=>({mode:run?.mode||'live',banked:Math.max(pendingBanked,run?.banked||0),lastBlockAt,now:clock()}),
   onNotice:(message,seconds=3)=>notice(message,seconds),
   onSealed:({boost,seeds,txHash})=>{
     if(boost){grantSealBoost(storage,{seeds,tx:txHash});notice('Nest soft-start armed for your next Live run.',4);}
     seal?.paintWallet?.();
   },
 });
 seal.bind();
 if(readSealBoost(storage).ready)text('source-summary','Public wheel telemetry · sealed nest soft-start armed');
 resize();records();telemetry();update(0);if(autoPoll)poller.start();if(autoFrame)rafId=window.requestAnimationFrame(frame);
 return {start,receive,update,tracker,seal,get run(){return run;},destroy(){destroyed=true;poller.stop();observer?.disconnect();window.cancelAnimationFrame?.(rafId);for(const remove of removers)remove();void audio?.close();}};
}
if(typeof document!=='undefined'&&document.querySelector('#scene'))bootGame();
