import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStatus, WheelTracker, practiceWheel } from '../src/wheel.js';

export const NOW = Date.parse('2026-11-06T08:00:00Z');
export function snapshot({height='1140', rpm=54, status='ACTIVE', ...patch}={}) {
  return {schemaVersion:1, installationId:'squeektoshi', generatedAt:new Date(NOW).toISOString(),
    measurement:{freshness:'online', observedAt:new Date(NOW).toISOString(),receivedAt:new Date(NOW).toISOString(),staleAfterSeconds:120,counterEpoch:'epoch-1',provenance:'hardware',coreStatus:status,rpmMilli:rpm*1000},
    oracle:{state:'accepted'}, builder:{status:'available',projected:{blockHeight:height,blockProgress:'500000000'},anchor:{blockHeight:'1138'}}, ...patch};
}
test('published status shape converts milli RPM and distinguishes optimistic from settled blocks',()=>{
 const w=normalizeStatus(snapshot(),NOW); assert.ok(w,'a normalized wheel is returned'); assert.equal(w.phase,'running'); assert.equal(w.rpm,54); assert.equal(w.height,'1140'); assert.equal(w.settledHeight,'1138'); assert.equal(w.progress,.5);
});
test('IDLE with residual rpm is asleep; ACTIVE zero rpm is also asleep',()=>{
 assert.equal(normalizeStatus(snapshot({status:'IDLE',rpm:30}),NOW)?.phase,'sleeping');
 assert.equal(normalizeStatus(snapshot({rpm:0}),NOW)?.phase,'sleeping');
});
test('simulated, replay, missing, malformed and future data cannot score Live',()=>{
 const base=snapshot();
 for(const data of [null, {}, {...base,schemaVersion:2}, {...base,status:'unavailable'}, {...base,measurement:{...base.measurement,provenance:'simulated'}}, {...base,measurement:{...base.measurement,provenance:'replay'}}, {...base,measurement:{...base.measurement,rpmMilli:-1}}, {...base,measurement:{...base.measurement,rpmMilli:'54000'}}, {...base,measurement:{...base.measurement,observedAt:new Date(NOW+20000).toISOString()}}, {...base,measurement:{...base.measurement,freshness:'stale'}}, {...base,oracle:{state:'blocked'}}, {...base,builder:{status:'unavailable'}}]) {
  assert.equal(normalizeStatus(data,NOW)?.phase,'unknown');
 }
});
test('timestamps expire even when freshness flag still says online',()=>{assert.equal(normalizeStatus(snapshot(),NOW+121000)?.phase,'unknown')});
test('first observation is baseline; one forward jump emits only one checkpoint',()=>{
 const t=new WheelTracker(); assert.equal(t.ingest(snapshot(),NOW)?.checkpoint,null);
 assert.equal(t.ingest(snapshot({height:'1149'}),NOW+5000)?.checkpoint,'1149');
 assert.equal(t.ingest(snapshot({height:'1149'}),NOW+6000)?.checkpoint,null);
});
test('heights beyond JS safe integers are never rounded or repeated after rollback',()=>{
 const t=new WheelTracker(); t.ingest(snapshot({height:'900719925474099300'}),NOW);
 assert.equal(t.ingest(snapshot({height:'900719925474099301'}),NOW+1000)?.checkpoint,'900719925474099301');
 assert.equal(t.ingest(snapshot({height:'900719925474099299'}),NOW+2000)?.checkpoint,null);
 assert.equal(t.ingest(snapshot({height:'900719925474099301'}),NOW+3000)?.checkpoint,null);
});
test('transport expiration and failed polls pause immediately and never catch up on reconnect',()=>{
 const t=new WheelTracker();t.ingest(snapshot(),NOW); assert.equal(t.current(NOW+12001)?.phase,'unknown');
 assert.equal(t.ingest(snapshot({height:'1200'}),NOW+13000)?.checkpoint,null);
 t.fail('network');assert.equal(t.current(NOW+14000)?.phase,'unknown');
 assert.equal(t.ingest(snapshot({height:'1300'}),NOW+15000)?.checkpoint,null);
 assert.equal(t.ingest(snapshot({height:'1301'}),NOW+16000)?.checkpoint,'1301');
});
test('unknown data and installation/epoch changes rebaseline, never award a checkpoint',()=>{
 const t=new WheelTracker();t.ingest(snapshot(),NOW);t.ingest({},NOW+1000);
 assert.equal(t.ingest(snapshot({height:'1300'}),NOW+2000)?.checkpoint,null);
 const data=snapshot({height:'1301'});data.measurement.counterEpoch='epoch-2';assert.equal(t.ingest(data,NOW+3000)?.checkpoint,null);
});
test('sleeping observations consume height changes without deferred golden bursts',()=>{
 const t=new WheelTracker();t.ingest(snapshot(),NOW);
 assert.equal(t.ingest(snapshot({height:'1141',status:'IDLE',rpm:0}),NOW+1000)?.checkpoint,null);
 assert.equal(t.ingest(snapshot({height:'1141'}),NOW+2000)?.checkpoint,null);
});
test('practice is explicitly simulated and cycles running/sleep with a deterministic block',()=>{
 assert.equal(practiceWheel(0)?.simulated,true);assert.equal(practiceWheel(0)?.phase,'running');assert.equal(practiceWheel(60)?.phase,'sleeping');assert.notEqual(practiceWheel(18)?.height,practiceWheel(0)?.height);
});
