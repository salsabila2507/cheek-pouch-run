/** Public status schema v1. Optimistic wheel blocks are not Ethereum settlements. */
export const STATUS_URL = 'https://api.squeekchain.com/v1/status';
export const HEARTBEAT_MS = 12000;
const uint = v => typeof v === 'string' && /^(0|[1-9]\d*)$/.test(v);
const unknown = reason => ({phase:'unknown',rpm:null,height:null,settledHeight:null,progress:0,reason,simulated:false});

export function normalizeStatus(raw, now = Date.now()) {
  const m=raw?.measurement, b=raw?.builder;
  if (raw?.schemaVersion!==1 || raw?.status==='unavailable' || !m || !b) return unknown('Status unavailable');
  if (m.provenance!=='hardware') return unknown('Hardware telemetry required');
  if (m.freshness!=='online' || b.status!=='available' || raw.oracle?.state!=='accepted') return unknown('Telemetry is not healthy');
  if (!['IDLE','ACTIVE'].includes(m.coreStatus) || !Number.isInteger(m.rpmMilli) || m.rpmMilli<0 || m.rpmMilli>1000000) return unknown('Invalid wheel measurement');
  const observed=Date.parse(m.observedAt), received=Date.parse(m.receivedAt);
  const ttl=Number.isFinite(m.staleAfterSeconds) && m.staleAfterSeconds>0 ? Math.min(m.staleAfterSeconds,120)*1000 : 0;
  if (!ttl || !Number.isFinite(observed) || !Number.isFinite(received) || Math.max(observed,received)>now+10000 || now-Math.min(observed,received)>ttl) return unknown('Telemetry has expired');
  if (!uint(b.projected?.blockHeight) || !uint(b.anchor?.blockHeight) || !uint(b.projected?.blockProgress) || BigInt(b.projected.blockProgress)>=1000000000n || typeof raw.installationId!=='string' || !raw.installationId || typeof m.counterEpoch!=='string' || !m.counterEpoch) return unknown('Invalid block identity');
  return {phase:m.coreStatus==='ACTIVE' && m.rpmMilli>0 ? 'running':'sleeping',rpm:m.rpmMilli/1000,height:b.projected.blockHeight,settledHeight:b.anchor.blockHeight,progress:Number(b.projected.blockProgress)/1e9,
    identity:`${raw.installationId}:${m.counterEpoch}`,sourceAt:Math.min(observed,received),sourceTtl:ttl,reason:null,simulated:false};
}

export class WheelTracker {
  constructor(){ this.raw=null;this.lastSeen=0;this.connected=false;this.identity=null;this.high=null;this.reason='Connecting to the wheel'; }
  current(now=Date.now()) {
    if(!this.connected || now-this.lastSeen>HEARTBEAT_MS) return unknown(this.connected?'Wheel connection lost':this.reason);
    return normalizeStatus(this.raw,now);
  }
  ingest(raw,now=Date.now()) {
    const previous=this.current(now), next=normalizeStatus(raw,now);
    if(next.phase==='unknown'){this.fail(next.reason);return {...next,checkpoint:null};}
    const continuous=previous.phase!=='unknown' && next.identity===this.identity;
    let checkpoint=null;
    if(!continuous){this.high=BigInt(next.height);}
    else if(BigInt(next.height)>this.high){this.high=BigInt(next.height);if(next.phase==='running')checkpoint=next.height;}
    this.raw=raw;this.lastSeen=now;this.connected=true;this.identity=next.identity;
    return {...next,checkpoint};
  }
  fail(reason='Wheel connection lost'){this.connected=false;this.reason=reason;}
}

/** An isolated training clock. This function is never used to recover Live mode. */
export function practiceWheel(seconds) {
  const cycle=((seconds%72)+72)%72, running=cycle<54;
  const rpm=running ? Math.round(48+28*Math.sin(cycle/12)**2) : 0;
  return {phase:running?'running':'sleeping',rpm,height:String(1+Math.floor(seconds/18)),settledHeight:null,progress:(seconds%18)/18,simulated:true,reason:null};
}
