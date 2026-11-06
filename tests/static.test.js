import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('every controller DOM target exists once and public assets are local',()=>{
 const {document}=parseHTML(read('index.html')),ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
 for(const match of read('src/game.js').matchAll(/\$\('([^']+)'\)/g))assert.ok(document.getElementById(match[1]),match[1]);
 for(const n of document.querySelectorAll('script[src],link[href],img[src]')){const path=n.getAttribute('src')||n.getAttribute('href');if(path.startsWith('/'))assert.ok(existsSync(new URL(path.slice(1),root)),path);}
 assert.equal(document.documentElement.lang,'en');assert.match(document.querySelector('meta[name=viewport]').content,/width=device-width/);
});
test('all runtime imports resolve and no verification/job/hosting claim is fabricated',()=>{
 for(const file of readdirSync(new URL('src',root)))for(const match of read('src/'+file).matchAll(/from ['"](\.[^'"]+)['"]/g))assert.ok(existsSync(new URL(match[1],new URL('src/'+file,root))),match[1]);
 const metadata=JSON.parse(read('project.json'));assert.equal(metadata.author,'0xyas');assert.equal(metadata.verification.status,'pending-verify');assert.equal(metadata.verification.imdJob,null);assert.equal(metadata.verification.publicRepository,'https://github.com/salsabila2507/cheek-pouch-run');assert.equal(metadata.liveUrl,'https://squeekrun.site');assert.equal(metadata.verification.imdSite,null);assert.equal(metadata.verification.issuedPageTag,'099e6481-92a0-4eb5-af7c-29c2b0d3b42d');assert.equal(metadata.verification.approval,null);assert.equal(metadata.verification.domain,'squeekrun.site');assert.equal(metadata.integration.optionalOnchain.token,'0x5501e1fa81be1c3f49225fa7668da0245d07db60');
 assert.match(read('index.html'),/Seeds are local game points, not SQK/);assert.match(read('README.md'),/not IMD/);
});

for(const file of ['README.md','docs/VERIFICATION.md'])test(`${file} records public hosting without inventing approval`,()=>{
 const text=read(file);
 assert.ok(text.includes('https://github.com/salsabila2507/cheek-pouch-run'));
 assert.ok(text.includes('https://cheek-pouch-run.vercel.app') || text.includes('https://squeekrun.site'));
 assert.doesNotMatch(text,/not publicly deployed|not externally hosted|no public repo created|No public deployment or repository has been created/i);
 assert.match(text,/pending verify|pending-verify|not submitted|not-submitted/);
 assert.match(text,/not IMD/);
});
