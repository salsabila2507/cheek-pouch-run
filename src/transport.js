import {STATUS_URL} from './wheel.js';
export function createStatusPoller({fetchImpl=globalThis.fetch,onSnapshot,onFailure,setTimer=setTimeout,clearTimer=clearTimeout,timeoutMs=4000}) {
  let stopped=true,timer=null,controller=null;
  async function poll(){
    if(stopped)return;let delay=5000;
    controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),timeoutMs);
    try{
      const response=await fetchImpl(STATUS_URL,{credentials:'omit',cache:'no-store',headers:{accept:'application/json'},signal:controller.signal});
      if(!response.ok){
        if([429,503].includes(response.status))delay=Math.min(60000,Math.max(5000,(Number(response.headers?.get('retry-after'))||5)*1000));
        if(!stopped)onFailure(`Wheel API unavailable (HTTP ${response.status})`);
      }else{const data=await response.json();if(!stopped)onSnapshot(data);}
    }catch{if(!stopped)onFailure('Wheel connection unavailable');}
    finally{clearTimeout(timeout);if(!stopped)timer=setTimer(poll,delay);}
  }
  return {start(){if(!stopped)return;stopped=false;void poll();},stop(){stopped=true;clearTimer(timer);controller?.abort();}};
}
