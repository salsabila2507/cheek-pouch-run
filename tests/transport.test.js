import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStatusPoller} from '../src/transport.js';
const flush=()=>new Promise(r=>setImmediate(r));
test('polls the exact public endpoint and schedules ~5s without credentials',async()=>{
 let call, data, delay;const p=createStatusPoller({fetchImpl:async(...args)=>{call=args;return {ok:true,json:async()=>({schemaVersion:1})}},onSnapshot:r=>data=r,onFailure:assert.fail,setTimer:(fn,ms)=>{delay=ms;return 1},clearTimer:()=>{}});
 assert.ok(p);p.start();await flush();assert.equal(call[0],'https://api.squeekchain.com/v1/status');assert.equal(call[1].credentials,'omit');assert.equal(data.schemaVersion,1);assert.equal(delay,5000);p.stop();
});
test('HTTP failure never emits fake data and respects Retry-After',async()=>{
 let failure, emitted=false, delay;const p=createStatusPoller({fetchImpl:async()=>({ok:false,status:429,headers:{get:()=> '20'}}),onSnapshot:()=>emitted=true,onFailure:r=>failure=r,setTimer:(fn,ms)=>{delay=ms;return 1},clearTimer:()=>{}});
 assert.ok(p);p.start();await flush();assert.equal(emitted,false);assert.match(failure,/429/);assert.equal(delay,20000);p.stop();
});
test('malformed JSON fails closed and stop suppresses pending snapshots',async()=>{
 let failure;const p=createStatusPoller({fetchImpl:async()=>({ok:true,json:async()=>{throw Error('bad JSON')}}),onSnapshot:assert.fail,onFailure:r=>failure=r,setTimer:()=>1,clearTimer:()=>{}});
 assert.ok(p);p.start();await flush();assert.match(failure,/connection|unavailable/i);p.stop();
 let resolve, emitted=false;const q=createStatusPoller({fetchImpl:()=>new Promise(r=>resolve=r),onSnapshot:()=>emitted=true,onFailure:()=>{},setTimer:()=>1,clearTimer:()=>{}});q.start();q.stop();resolve({ok:true,json:async()=>({})});await flush();assert.equal(emitted,false);
});
