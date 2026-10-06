#!/usr/bin/env node
// shot.mjs — screenshot a page (or several scroll positions of it) with the skill's own headless Chrome, WebGL included, and print console errors.
// Used to check the website with a real GPU context; handy for any HTML you build with the skill.
//
//   node tools/shot.mjs <url> [--w 1440 --h 900 --dpr 1 --mobile] [--scroll 0,900,1800 | --sel "#how,#atlas"] [--wait 1500] [--eval "js before each shot"] [--print "js expression whose value is printed"] [--mouse 700,400] [--out dir] [--prefix name]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Browser } from '../skills/cinewright/scripts/chrome.mjs';

const argv = process.argv.slice(2), pos = [], o = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); if (['mobile', 'full'].includes(k)) o[k] = true; else o[k] = argv[++i]; } else pos.push(a); }
const url = pos[0]; if (!url) { console.error('usage: shot.mjs <url> [--w --h --dpr --mobile --scroll a,b --sel css,css --wait ms --eval js --mouse x,y --out dir --prefix p]'); process.exit(1); }
const W = +(o.w || 1440), H = +(o.h || 900), wait = +(o.wait || 1200), out = path.resolve(o.out || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.shots')), prefix = o.prefix || 'shot';
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const logs = [];
const b = await Browser.launch({ gpu: process.env.PCV_GPU || 'auto', width: W, height: H });
try {
  const page = await b.newPage({ width: W, height: H, onLog: (lvl, t) => { if (lvl !== 'log') logs.push(`${lvl}: ${t}`); } });
  await page.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: +(o.dpr || 1), mobile: !!o.mobile });
  await page.goto(url); await sleep(wait + 800);
  const targets = o.sel ? o.sel.split(',').map(s => ({ sel: s })) : (o.scroll || '0').split(',').map(y => ({ y: +y }));
  let n = 0;
  for (const t of targets) {
    if (t.sel) await page.eval(`(()=>{const e=document.querySelector(${JSON.stringify(t.sel)}); if(e){ e.scrollIntoView({block:'start',behavior:'instant'}); }})()`); else await page.eval(`window.scrollTo({top:${t.y},behavior:'instant'})`);
    await sleep(wait);
    if (o.eval) await page.eval(o.eval);
    if (o.print) console.log('print:', JSON.stringify(await page.eval(o.print)));
    if (o.mouse) { const [x, y] = o.mouse.split(',').map(Number); await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await sleep(400); }
    const shot = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!o.full });
    const f = path.join(out, `${prefix}-${String(n++).padStart(2, '0')}.png`); fs.writeFileSync(f, Buffer.from(shot.data, 'base64')); console.log('✔', f);
  }
  const info = await page.eval(`({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, h:document.documentElement.scrollHeight, gl2: !!document.createElement('canvas').getContext('webgl2')})`);
  console.log('page:', JSON.stringify(info));
  if (logs.length) { console.log(`\n${logs.length} console message(s):`); for (const l of [...new Set(logs)].slice(0, 20)) console.log('  ' + l.slice(0, 240)); } else console.log('console: clean');
} finally { await b.close(); }
