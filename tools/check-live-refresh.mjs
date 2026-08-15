import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const DIST='/home/claude/stockpulse/dist', BASE='/stockpulse';
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
let hits=[]; let bumpAfter=1e9; let n=0;
const server=http.createServer(async (req,res)=>{
  let p=decodeURI(req.url.split('?')[0]); if(p.startsWith(BASE)) p=p.slice(BASE.length)||'/';
  let f=path.join(DIST,p);
  if(p==='/data/rankings.json'){
    n++; hits.push(req.headers['if-none-match']?'conditional':'plain');
    const raw=JSON.parse(await readFile(path.join(DIST,'data/rankings.json'),'utf8'));
    if(n>bumpAfter) raw.generatedAt='2099-01-01T00:00:00.000Z';
    const body=JSON.stringify(raw); const etag='"v'+(n>bumpAfter?2:1)+'"';
    if(req.headers['if-none-match']===etag){ res.writeHead(304,{etag}); return res.end(); }
    res.writeHead(200,{'content-type':'application/json',etag,'cache-control':'no-cache'}); return res.end(body);
  }
  try{ if((await stat(f)).isDirectory()) f=path.join(f,'index.html'); }catch{ f=f+'.html'; }
  try{ const b=await readFile(f); res.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'}); res.end(b);}catch{ res.writeHead(404); res.end('nf'); }
});
await new Promise(r=>server.listen(4501,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

async function run(label, fn){ hits=[]; n=0;
  const ctx=await b.newContext(); const pg=await ctx.newPage();
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
  await pg.clock.install();
  await pg.goto('http://localhost:4501/stockpulse/',{waitUntil:'networkidle'});
  await pg.evaluate(()=>{ window.__sp=[]; document.addEventListener('sp:data',e=>window.__sp.push(e.detail.name)); });
  const out = await fn(pg);
  console.log(label.padEnd(46), out, errs.length?('ERR '+errs[0]):'');
  await ctx.close();
}

await run('no request on load (LCP not disturbed)', async pg=>{ return 'requests=' + hits.length + (hits.length===0?'  PASS':'  FAIL'); });

await run('polls, and revalidates conditionally', async pg=>{
  for(let i=0;i<4;i++){ await pg.clock.fastForward('02:05'); await pg.waitForTimeout(300); }
  return 'requests=' + hits.length + ' kinds=' + JSON.stringify(hits) +
    ((hits.length>=2 && hits.slice(1).every(h=>h==='conditional')) ? '  PASS' : '  FAIL');
});

bumpAfter = 1;
await run('fires sp:data only when generatedAt moves', async pg=>{
  for(let i=0;i<4;i++){ await pg.clock.fastForward('02:05'); await pg.waitForTimeout(300); }
  const evts = await pg.evaluate(()=>window.__sp);
  const bar = await pg.evaluate(()=>{const e=document.getElementById('live-bar'); return e? !e.hidden : null;});
  return 'events=' + JSON.stringify(evts) + ' liveBarShown=' + bar + ((evts.length===1 && evts[0]==='rankings')?'  PASS':'  FAIL');
});
bumpAfter = 1e9;

await run('pauses while the tab is hidden', async pg=>{
  await pg.evaluate(()=>{ Object.defineProperty(document,'hidden',{value:true,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
  const before = hits.length;
  for(let i=0;i<5;i++){ await pg.clock.fastForward('02:05'); await pg.waitForTimeout(200); }
  const during = hits.length;
  await pg.evaluate(()=>{ Object.defineProperty(document,'hidden',{value:false,configurable:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(400);
  const after = hits.length;
  return `hidden:${during-before} onResume:${after-during}` + ((during===before && after>during)?'  PASS':'  FAIL');
});

await b.close(); server.close();
