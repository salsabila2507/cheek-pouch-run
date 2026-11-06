const key=mode=>{if(!['live','practice'].includes(mode))throw new Error('Unknown mode');return `cheek-pouch-run:v1:${mode}`;};
const clean=v=>Number.isFinite(v)&&v>=0?Math.floor(Math.min(v,1e9)):0;
export function readRecord(mode,store=globalThis.localStorage){
  try{const r=JSON.parse(store.getItem(key(mode))||'{}');return {best:clean(r?.best),distance:clean(r?.distance),runs:clean(r?.runs),sleep:clean(r?.sleep),goals:clean(r?.goals)};}
  catch{return {best:0,distance:0,runs:0,sleep:0,goals:0};}
}
export function saveRecord(mode,run,store=globalThis.localStorage){
  const prior=readRecord(mode,store),next={best:Math.max(prior.best,clean(run.banked)),distance:Math.max(prior.distance,clean(run.distance)),runs:prior.runs+1,sleep:Math.max(prior.sleep,clean(run.missions?.sleepSeconds)),goals:Math.max(prior.goals,clean(run.missions?.completed))};
  try{store.setItem(key(mode),JSON.stringify(next));}catch{/* Private browsing still works; records are optional. */}
  return next;
}

const sealKey='cheek-pouch-run:v1:seal-boost';
export function readSealBoost(store=globalThis.localStorage){
  try{
    const r=JSON.parse(store?.getItem?.(sealKey)||'null');
    if(!r?.ready)return {ready:false,seeds:0,tx:''};
    return {ready:true,seeds:clean(r.seeds),tx:String(r.tx||'')};
  }catch{return {ready:false,seeds:0,tx:''};}
}
export function grantSealBoost(store=globalThis.localStorage,{seeds=0,tx=''}={}){
  const next={ready:true,seeds:clean(seeds),tx:String(tx||''),at:Date.now()};
  try{store?.setItem?.(sealKey,JSON.stringify(next));}catch{/* optional */}
  return next;
}
export function consumeSealBoost(store=globalThis.localStorage){
  const prior=readSealBoost(store);
  if(!prior.ready)return null;
  try{store?.removeItem?.(sealKey);}catch{/* optional */}
  return prior;
}
