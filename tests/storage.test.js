import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readRecord,saveRecord} from '../src/storage.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
test('Live and Practice records are separate, best banked score cannot fall',()=>{
 const store=memory();saveRecord('practice',{banked:80,distance:200},store);assert.equal(readRecord('live',store)?.best,0);assert.equal(readRecord('practice',store)?.best,80);saveRecord('practice',{banked:5,distance:5},store);assert.equal(readRecord('practice',store)?.best,80);assert.equal(readRecord('practice',store)?.runs,2);
});
test('malformed or unavailable storage is safe; records are not trusted input',()=>{
 assert.equal(readRecord('live',{getItem(){return '{broken'}})?.best,0);
 assert.equal(readRecord('live',{getItem(){return '{"best":-1,"runs":"x","distance":null}'}})?.best,0);
 assert.doesNotThrow(()=>saveRecord('live',{banked:1,distance:5},{getItem(){throw Error()},setItem(){throw Error()}}));
});

test('night survival and goals persist separately without creating seed scores',()=>{
 const store=memory();saveRecord('live',{banked:0,distance:0,missions:{sleepSeconds:16.7,completed:1}},store);
 assert.equal(readRecord('live',store).sleep,16);assert.equal(readRecord('live',store).goals,1);assert.equal(readRecord('live',store).best,0);assert.equal(readRecord('practice',store).sleep,0);
 saveRecord('live',{banked:0,distance:0,missions:{sleepSeconds:2,completed:0}},store);assert.equal(readRecord('live',store).sleep,16);
});
test('old records migrate with zero night/goal bests and invalid values are rejected',()=>{
 assert.equal(readRecord('live',{getItem:()=>'{"best":5}'}).sleep,0);
 const r=readRecord('live',{getItem:()=>'{"sleep":-3,"goals":"900"}'});assert.equal(r.sleep,0);assert.equal(r.goals,0);
});
