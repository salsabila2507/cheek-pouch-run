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
