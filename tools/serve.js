import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(new URL('../dist',import.meta.url).pathname),port=Number(process.env.PORT||4179),host='127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only preview');return;}
  const pathname=decodeURIComponent(new URL(req.url,`http://${host}`).pathname),file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep)||(await stat(file)).isDirectory())throw Error('Not found');
  const data=await readFile(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');}
}).listen(port,host,()=>console.log(`Cheek Pouch Run local preview: http://${host}:${port}`));
