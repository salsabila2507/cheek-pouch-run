const key=mode=>{if(!['live','practice'].includes(mode))throw new Error('Unknown mode');return `cheek-pouch-run:v1:${mode}`;};
const clean=v=>Number.isFinite(v)&&v>=0?Math.floor(Math.min(v,1e9)):0;
export function readRecord(mode,store=globalThis.localStorage){
  try{const r=JSON.parse(store.getItem(key(mode))||'{}');return {best:clean(r?.best),distance:clean(r?.distance),runs:clean(r?.runs)};}
  catch{return {best:0,distance:0,runs:0};}
}
export function saveRecord(mode,run,store=globalThis.localStorage){
  const prior=readRecord(mode,store),next={best:Math.max(prior.best,clean(run.banked)),distance:Math.max(prior.distance,clean(run.distance)),runs:prior.runs+1};
  try{store.setItem(key(mode),JSON.stringify(next));}catch{/* Private browsing still works; records are optional. */}
  return next;
}
