import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';

const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const {document}=parseHTML(`<style>${css}</style>`);
const rules=[...document.querySelector('style').sheet.cssRules];
const root=rules.find(rule=>rule.selectorText===':root').style;
function declaration(selector,property){
 let value;
 for(const rule of rules){
  if(rule.selectorText?.split(',').map(s=>s.trim()).includes(selector))value=rule.style.getPropertyValue(property)||value;
 }
 assert.ok(value,`${selector} declares ${property}`);
 return value.replace(/var\((--[\w-]+)\)/g,(_,name)=>root.getPropertyValue(name)).trim();
}
function luminance(hex){
 assert.match(hex,/^#[0-9a-f]{6}$/i,'use an opaque RGB color so contrast is unambiguous');
 const linear=hex.slice(1).match(/../g).map(channel=>{
  const s=parseInt(channel,16)/255;
  return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;
 });
 return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
function contrast(foreground,background){
 const [low,high]=[luminance(foreground),luminance(background)].sort((a,b)=>a-b);
 return (high+0.05)/(low+0.05);
}
test('WCAG contrast calculation uses the standard luminance formula',()=>{
 assert.equal(contrast('#000000','#ffffff'),21);
 assert.equal(contrast('#53644c','#53644c'),1);
});
const cases=[
 ['.practice-note','.sidebar'],
 ['.guide-grid p','body'],
 ['.honesty-note>p','body'],
 ['.notebook p','body'],
 ['.sidebar-copy','.sidebar'],
 ['.live-note','.live-panel'],
];
for(const [selector,parent] of cases)test(`${selector} normal text contrast is at least 4.5:1`,()=>{
 const foreground=declaration(selector,'color'),background=declaration(parent,'background');
 const ratio=contrast(foreground,background);
 assert.ok(ratio>=4.5,`${selector}: ${foreground} on ${background} = ${ratio.toFixed(2)}:1; needs 4.5:1`);
});
