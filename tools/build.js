import {mkdirSync,copyFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url),out=new URL('../dist/',import.meta.url);
mkdirSync(out,{recursive:true});
function copy(relative){const source=new URL(relative,root),dest=new URL(relative,out);if(statSync(source).isDirectory()){mkdirSync(dest,{recursive:true});for(const file of readdirSync(source))copy(join(relative,file));}else{copyFileSync(source,dest);}}
for(const file of ['index.html','style.css','favicon.svg','src','project.json'])copy(file);
writeFileSync(new URL('robots.txt',out),'User-agent: *\nAllow: /\n');
console.log('Static build ready in dist/. No secrets or runtime dependencies.');
