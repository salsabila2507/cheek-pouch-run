import {WheelTracker,practiceWheel} from './wheel.js';
import {createStatusPoller} from './transport.js';
import {createRun,stepRun,checkpoint,CAPACITY} from './engine.js';
import {drawScene} from './art.js';
import {readRecord,saveRecord} from './storage.js';

export function bootGame({document=globalThis.document,window=globalThis.window,clock=()=>Date.now(),storage,fetchImpl=globalThis.fetch,autoPoll=true,autoFrame=true}={}){
 if(storage===undefined){try{storage=window.localStorage;}catch{storage=null;}}
 const $=id=>document.getElementById(id),canvas=$('scene'),stage=$('stage'),ctx=canvas.getContext('2d');
 if(!ctx){$('live-note').textContent='Canvas 2D is unavailable in this browser.';return null;}
 const tracker=new WheelTracker(),reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
 const input={jump:false,duck:false,home:false};let run=null,paused=false,saved=false,lastPracticeHeight='1',animTime=0,toastUntil=0,width=800,height=420,dpr=1,rafId=0,lastFrame=0,destroyed=false,curtainType='';
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
     const note={jump:[330,510,.09],seed:[740,1040,.065],hit:[160,60,.2],bank:[520,920,.22],checkpoint:[440,880,.25],home:[440,660,.2]}[kind];if(!note)return;
     const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime;
     osc.type=kind==='hit'?'sawtooth':'square';osc.frequency.setValueAtTime(note[0],at);osc.frequency.exponentialRampToValueAtTime(note[1],at+note[2]);gain.gain.setValueAtTime(.018,at);gain.gain.exponentialRampToValueAtTime(.0001,at+note[2]);osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+note[2]);
   }catch{/* Sound never blocks play. */}
 }
 function resize(){
   const old=width;width=Math.max(300,Math.round(stage.clientWidth||800));height=Math.max(230,Math.round(stage.clientHeight||420));dpr=Math.min(window.devicePixelRatio||1,2);
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   if(run&&old!==width){const factor=width/old;run.width=width;run.x=Math.max(85,width*.2);for(const e of run.entities)e.x*=factor;}
 }
 function records(){text('best-live',readRecord('live',storage).best);text('best-practice',readRecord('practice',storage).best);}
 function notice(message,seconds=3){text('toast',message);toastUntil=animTime+seconds;show('toast',true);}
 function telemetry(){
   const w=tracker.current(clock());$('connection-dot').className=`status-dot ${w.phase}`;text('rpm',w.rpm===null?'—':w.rpm.toFixed(1));text('block',w.height||'—');$('block').title=w.height?`Projected (not settled): ${w.height}`:'Unknown';
   text('wheel-state',w.phase==='running'?'ON THE WHEEL':w.phase==='sleeping'?'NAPPING':'NO SIGNAL');
   text('live-note',w.phase==='running'?(w.rpm>=70?'He has the zoomies. Good luck, little legs.':'The real wheel is turning. Your trail is open.'):w.phase==='sleeping'?"He's napping. Live scoring rests with him.":'No fresh hardware signal. Live stays closed.');
   $('start-live').disabled=w.phase!=='running';text('start-live',w.phase==='running'?'Run with Squeektoshi ↗':w.phase==='sleeping'?'Wheel asleep · try Practice':'Waiting for real wheel…');
   text('source-summary',w.phase==='unknown'?'Live unavailable · Practice is simulated':`Hardware telemetry · settled #${w.settledHeight}`);
   return w;
 }
 function setCurtain(kind,w){
   curtainType=kind;show('curtain',!!kind);show('result-stats',kind==='result');show('retry',kind==='result');show('resume',kind==='pause');
   if(kind==='offline'){
     text('curtain-kicker','LIVE · RUN FROZEN');text('curtain-title','Waiting for a signal.');text('curtain-copy',`${w?.reason||'Wheel data unavailable'}. Your pouch and the trail are frozen. No pretend running.`);text('back','End run (unbanked seeds lost)');
   }else if(kind==='pause'){
     text('curtain-kicker',run?.mode==='practice'?'PRACTICE · SIMULATED':'LIVE · REAL WHEEL');text('curtain-title','Paws on pause.');text('curtain-copy','Your pouch is safe. Blocks seen while paused do not grant catch-up checkpoints.');text('back','End run (unbanked seeds lost)');
   }else if(kind==='result'){
     text('curtain-kicker',run.mode==='practice'?'PRACTICE · SEPARATE LOCAL RECORD':'LIVE · LOCAL RECORD');text('curtain-title',run.status==='home'?'Home, sweet burrow.':'The forest got you.');text('curtain-copy',run.status==='home'?"Good instincts. Your cheeks made it home.":'Three scrapes. One lesson. Banked seeds are safe; the rest stayed in the forest.');text('result-seeds',run.banked);text('result-distance',Math.floor(run.distance));text('back','Back to the burrow');
   }
 }
 function start(mode){
   if(!['practice','live'].includes(mode))return false;
   if(mode==='live'&&tracker.current(clock()).phase!=='running')return false;
   run=createRun(mode,width);paused=false;saved=false;lastPracticeHeight='1';Object.assign(input,{jump:false,duck:false,home:false});curtainType='';toastUntil=0;
   show('lobby-caption',false);show('lobby-panel',false);show('run-panel',true);show('run-hud',true);show('touch-controls',true);show('pause',true);show('curtain',false);show('toast',false);
   text('mode-chip',mode==='practice'?'PRACTICE · SIMULATED':'LIVE · REAL WHEEL');text('active-label',mode==='practice'?'PRACTICE · SIMULATED WHEEL':'LIVE · REAL WHEEL');text('pause','Ⅱ');$('pause').setAttribute('aria-label','Pause game');
   resize();stage.focus?.({preventScroll:true});if(window.innerWidth<=760)stage.scrollIntoView?.({block:'start',behavior:reducedMotion?'auto':'smooth'});effect('jump');notice('Tap twice to double jump. Hold ↓ to duck.',3.8);return true;
 }
 function finish(){if(saved||!run||run.status==='running')return;saved=true;saveRecord(run.mode,run,storage);records();show('touch-controls',false);show('pause',false);setCurtain('result');effect(run.status==='home'?'home':'hit');$('retry').disabled=run.mode==='live'&&tracker.current(clock()).phase!=='running';text('retry',$('retry').disabled?'Real wheel not running · lobby below':'One more run ↗');$('retry').focus?.({preventScroll:true});}
 function lobby(){
   if(run&&!saved){run.pouch=0;run.status='over';saveRecord(run.mode,run,storage);records();}
   run=null;paused=false;Object.assign(input,{jump:false,duck:false,home:false});show('curtain',false);show('run-panel',false);show('run-hud',false);show('touch-controls',false);show('pause',false);show('toast',false);show('lobby-caption',true);show('lobby-panel',true);text('mode-chip','READY WHEN YOU ARE');resize();$('start-practice').focus?.({preventScroll:true});
 }
 function togglePause(force){
   if(!run||run.status!=='running')return;paused=force??!paused;input.jump=false;input.duck=false;
   text('pause',paused?'▶':'Ⅱ');$('pause').setAttribute('aria-label',paused?'Resume game':'Pause game');if(paused){setCurtain('pause');$('resume').focus?.({preventScroll:true});}else{setCurtain('');stage.focus?.({preventScroll:true});}
 }
 function receive(raw){
   const w=tracker.ingest(raw,clock());
   if(w.checkpoint&&run?.mode==='live'&&run.status==='running'&&!paused){checkpoint(run,w.checkpoint);notice(`WHEEL BLOCK #${w.checkpoint} · Golden seeds + bank ahead`,4);effect('checkpoint');}
   telemetry();
 }
 const poller=createStatusPoller({fetchImpl,onSnapshot:receive,onFailure:reason=>{tracker.fail(reason);telemetry();}});
 function currentWheel(){return run?.mode==='practice'?practiceWheel(run.elapsed):tracker.current(clock());}
 function hud(w){
   text('pouch',run.pouch);text('banked',run.banked);text('run-distance',Math.floor(run.distance));text('hearts',Array.from({length:3},(_,i)=>i<run.lives?'♥':'♡').join(' '));$('hearts').setAttribute('aria-label',`${run.lives} lives`);
   $('pouch-fill').style.width=`${run.pouch/CAPACITY*100}%`;$('pouch-meter').setAttribute('aria-valuenow',String(run.pouch));
   text('pouch-note',run.pouch===40?'Full cheeks. Find a burrow or head home.':run.pouch>=30?'Heavy cheeks. Your jumps are a little lower.':run.pouch>=15?'Looking suspiciously snack-shaped.':'Little cheeks. Big potential.');
   text('active-state',w.phase==='running'?'RUNNING':w.phase==='sleeping'?'SLEEPING':'NO SIGNAL');$('active-dot').className=`status-dot ${w.phase}`;text('active-rpm',w.rpm===null?'— RPM':`${Math.round(w.rpm)} RPM`);
   text('active-block',w.simulated?`Simulated block #${w.height}`:`Projected block ${w.height?'#'+w.height:'—'}`);text('settled-block',w.simulated?'Training clock · not onchain':`Settled ${w.settledHeight?'#'+w.settledHeight:'—'} · Ethereum Sepolia`);$('block-fill').style.width=`${w.progress*100}%`;
   show('zoomies',w.phase==='running'&&w.rpm>=70);$('home').disabled=w.phase==='unknown'||run.status!=='running';text('home',w.phase==='sleeping'?'Retreat & save your pouch ↗':'Go home & bank ↗');
   text('trail-tip',w.phase==='unknown'?'No signal, no movement, no score. Your existing pouch stays untouched.':w.phase==='sleeping'?"He's asleep. Seeds and scored metres are locked; traps get meaner. Retreat with what you already earned.":'Seeds in your cheeks are at risk. Head home to bank, or land at the next block’s burrow to keep running.');
 }
 function update(dt){
   dt=Math.min(.05,Math.max(0,dt));animTime+=dt;const live=telemetry();let w=currentWheel();
   if(run){
     if(run.status==='running'&&!paused){
       if(w.phase==='unknown'){setCurtain('offline',w);input.jump=false;input.duck=false;input.home=false;}
       else{
         if(curtainType==='offline')setCurtain('');
         if(run.mode==='practice'&&w.height!==lastPracticeHeight){lastPracticeHeight=w.height;if(w.phase==='running'){checkpoint(run,w.height);notice(`SIMULATED BLOCK #${w.height} · Bank ahead`,3);effect('checkpoint');}}
         stepRun(run,dt,w,input);input.jump=false;input.home=false;
         for(const event of run.events){effect(event.kind);if(event.kind==='hit')notice('Ouch. Half your pouch spilled.',2);if(event.kind==='bank')notice(`${event.value} seeds safe at home. Nice cheeks.`,2.6);}
       }
     }
     w=currentWheel();hud(w);finish();
     if(saved){$('retry').disabled=run.mode==='live'&&live.phase!=='running';text('retry',$('retry').disabled?'Wheel not running · back to lobby':'One more run ↗');}
   }
   if(animTime>toastUntil)show('toast',false);
   const sceneRun=run||{travel:0,danger:0};drawScene(ctx,width,height,sceneRun,run?w:live,reducedMotion&&!run?0:animTime,{lobby:!run,reducedMotion});
 }
 on($('start-live'),'click',()=>start('live'));on($('start-practice'),'click',()=>start('practice'));
 on($('pause'),'click',()=>togglePause());on($('resume'),'click',()=>togglePause(false));on($('retry'),'click',()=>start(run?.mode||'practice'));on($('back'),'click',lobby);
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
 resize();records();telemetry();update(0);if(autoPoll)poller.start();if(autoFrame)rafId=window.requestAnimationFrame(frame);
 return {start,receive,update,tracker,get run(){return run;},destroy(){destroyed=true;poller.stop();observer?.disconnect();window.cancelAnimationFrame?.(rafId);for(const remove of removers)remove();void audio?.close();}};
}
if(typeof document!=='undefined'&&document.querySelector('#scene'))bootGame();
