import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const DIST='/home/claude/stockpulse/dist', BASE='/stockpulse';
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async (req,res)=>{ let p=decodeURI(req.url.split('?')[0]); if(p.startsWith(BASE)) p=p.slice(BASE.length)||'/';
 let f=path.join(DIST,p); try{ if((await stat(f)).isDirectory()) f=path.join(f,'index.html'); }catch{ f=f+'.html'; }
 try{ const b=await readFile(f); res.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'}); res.end(b);}catch{ res.writeHead(404); res.end('nf'); }});
await new Promise(r=>server.listen(4502,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:1440,height:1000}}); const pg=await ctx.newPage();
const errs=[]; pg.on('pageerror',e=>errs.push(String(e))); pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('http://localhost:4502/stockpulse/',{waitUntil:'networkidle'});
const before = await pg.evaluate(()=>({nodes:document.querySelectorAll('*').length, tables:document.querySelectorAll('table.board').length, rows:document.querySelectorAll('tr.row').length}));
console.log('on load        ', JSON.stringify(before));
await pg.click('[data-horizon="long_term"]');
await pg.waitForFunction(()=>document.querySelector('.board-panel[data-board="US/long_term"]')?.dataset.loaded==='1',{timeout:8000});
const after = await pg.evaluate(()=>{
  const p=document.querySelector('.board-panel[data-board="US/long_term"]');
  return {loaded:p.dataset.loaded, rows:p.querySelectorAll('tr.row').length, hasCompliance:!!p.querySelector('.compliance'), heading:p.querySelector('.board-heading')?.textContent.trim().slice(0,40), nodes:document.querySelectorAll('*').length};
});
console.log('after tab click', JSON.stringify(after));
await pg.click('[data-market="KR"]');
await pg.waitForFunction(()=>document.querySelector('.board-panel[data-board="KR/long_term"]')?.dataset.loaded==='1',{timeout:8000});
const kr = await pg.evaluate(()=>{const p=document.querySelector('.board-panel[data-board="KR/long_term"]');return {rows:p.querySelectorAll('tr.row').length, visible:!p.hidden};});
console.log('after KR switch', JSON.stringify(kr));
console.log(errs.length? 'ERRORS: '+errs.join(' | ') : 'no console/page errors');
await b.close(); server.close();
