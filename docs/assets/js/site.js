/* Cinewright website — vanilla JS, no dependencies. Components: i18n, reveal, counters, magnetic/tilt, hero typing, video manager, proof (with/without players), atlas explorer + reels, showcase gallery + lightbox, benchmark charts, installer, footer wordmark. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  const safe = f => { try { return f(); } catch { return null; } };
  const root = document.documentElement;
  const isFa = () => root.lang === 'fa';
  const L = (en, fa) => isFa() ? fa : en;
  const T2 = o => o == null ? '' : typeof o === 'string' ? o : (isFa() ? (o.fa || o.en) : o.en) || '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const FAMC = { type: '#ff7ad9', 'three-d': '#40f5f5', particles: '#ffd23f', shaders: '#8a63ff', looks: '#ff9e5e', camera: '#5dff9d', transitions: '#7aa7ff', light: '#fff1a8', 'ui-data': '#6be3ff', graphic: '#ff5ea8', logos: '#b79cff', sound: '#9dff7a', ideas: '#ffb3c7', editing: '#a9a9ff', color: '#ff8f8f', styles: '#e0b0ff', pipelines: '#8affc7' };
  const famColor = f => FAMC[f] || '#9a98c0';
  const CMD = 'node skills/cinewright/scripts/atlas.mjs show ';
  const REL = 'https://github.com/msmahdinejad/cinewright/releases/download/v2.2.0/';
  const num = (v, d = 0) => v == null ? '–' : (Math.round(v * 10 ** d) / 10 ** d).toString();

  /* ── language ─────────────────────────────────────────────── */
  function setLang(l) {
    root.lang = l; root.dir = l === 'fa' ? 'rtl' : 'ltr'; $('#lang').textContent = l === 'fa' ? 'English' : 'فارسی';
    document.title = l === 'fa' ? 'سینه‌رایت — ایجنت کدنویستان حالا می‌تواند فیلم بسازد' : 'Cinewright — your coding agent can now direct films';
    safe(() => localStorage.setItem('cw-lang', l)); document.dispatchEvent(new Event('langchange'));
  }
  $('#lang').addEventListener('click', () => setLang(isFa() ? 'en' : 'fa'));
  setLang(safe(() => localStorage.getItem('cw-lang')) || ((navigator.language || '').startsWith('fa') ? 'fa' : 'en'));

  /* ── cinematic intro (once per session) ───────────────────────────────────────── */
  (() => { const intro = $('#intro'); if (!intro) return; if (reduce || safe(() => sessionStorage.getItem('cw-intro'))) { intro.remove(); root.classList.add('go'); return; }
    setTimeout(() => { root.classList.add('go'); safe(() => sessionStorage.setItem('cw-intro', '1')); setTimeout(() => intro.remove(), 1200); }, 1700); })();

  /* ── headline: split into words (never letters — Persian stays joined) ─────────── */
  function splitWords(el, grad = false) {
    for (const n of [...el.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(tok => { if (!tok) return; if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; } const w = document.createElement('span'); w.className = 'w' + (grad ? ' grad' : ''); w.textContent = tok; frag.appendChild(w); });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n, grad || n.classList.contains('grad'));
    }
  }
  const h1 = $('#h1'); if (h1) { $$('[lang]', h1).filter(e => e.parentElement === h1).forEach(e => splitWords(e)); $$('.grad', h1).forEach(g => { if (!g.classList.contains('w')) g.classList.remove('grad'); }); let i = 0; $$('.w', h1).forEach(w => { w.style.setProperty('--i', i++ % 14); }); }

  /* ── scroll: progress bar, nav, reveal, counters ─────────────────────────────────── */
  const nav = $('#nav'); let lastY = 0, ticking = false;
  let vel = 0, rate = 1; const mqRate = () => { vel *= .92; rate += ((1 + Math.min(vel / 22, 7)) - rate) * .12; $$('.mq').forEach(m => { const a = m.getAnimations()[0]; if (a) a.playbackRate = rate; }); requestAnimationFrame(mqRate); }; if (!reduce) requestAnimationFrame(mqRate);
  const onScroll = () => { vel = Math.max(vel, Math.abs(scrollY - lastY)); ticking = false; const y = scrollY, max = document.documentElement.scrollHeight - innerHeight; root.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : 0); nav.classList.toggle('hide', y > 500 && y > lastY + 4); if (y < lastY - 4 || y < 500) nav.classList.remove('hide'); lastY = y; };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const reveal = el => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', 0); io.observe(el); };
  $$('.rv').forEach((el, i) => { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i % 4) * 90); io.observe(el); });
  const countIO = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; countIO.unobserve(e.target); const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(); if (reduce || to === 0) { el.textContent = to + suf; return; } (function f(now) { const p = clamp((now - t0) / 1600, 0, 1), v = to * (1 - Math.pow(2, -10 * p)); el.textContent = Math.round(p >= 1 ? to : v) + suf; if (p < 1) requestAnimationFrame(f); })(t0); }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));
  const links = $$('.nav-in a.l'), secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => navIO.observe(s));

  /* ── scroll-linked bands + spotlight borders ──────────────────────────────────── */
  const bands = $$('.bt'); const bandTick = () => { const vh = innerHeight; bands.forEach(b => { const r = b.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; const p = (vh - r.top) / (vh + r.height), sp = +b.dataset.sp, off = sp < 0 ? -p * (b.scrollWidth - innerWidth) * .9 : -(1 - p) * (b.scrollWidth - innerWidth) * .9; b.style.transform = `translate3d(${off}px,0,0)`; }); };
  addEventListener('scroll', bandTick, { passive: true }); addEventListener('resize', bandTick); bandTick();
  document.addEventListener('pointermove', e => { const t = e.target.closest && e.target.closest('.ac,.pn,.step,.bm,.film .tx'); if (!t) return; const r = t.getBoundingClientRect(); t.style.setProperty('--sx', (e.clientX - r.left) + 'px'); t.style.setProperty('--sy', (e.clientY - r.top) + 'px'); }, { passive: true });

  /* ── pointer effects: cursor glow, magnetic buttons, tilt ────────────────────────── */
  if (!coarse && !reduce) {
    const glow = $('#glow'); let gx = innerWidth / 2, gy = innerHeight / 3, tx = gx, ty = gy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function g() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = `translate3d(${gx}px,${gy}px,0)`; requestAnimationFrame(g); })();
    $$('.mag').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); b.style.transform = `translate(${x * .22}px,${y * .3}px)`; }); b.addEventListener('pointerleave', () => { b.style.transform = ''; }); });
    const tilt = (el, max = 8) => { el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; el.style.setProperty('--ry', ((px - .5) * max * 2).toFixed(2) + 'deg'); el.style.setProperty('--rx', ((.5 - py) * max * 2).toFixed(2) + 'deg'); el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%'); el.style.setProperty('--go', 1); }); el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--go', 0); }); };
    $$('.tilt-d').forEach(el => tilt(el, 9)); window.__tilt = tilt;
    const hv = $('.hero-visual'); addEventListener('pointermove', e => { if (scrollY > innerHeight) return; hv.style.setProperty('--px', ((e.clientX / innerWidth) - .5).toFixed(3)); hv.style.setProperty('--py', ((e.clientY / innerHeight) - .5).toFixed(3)); }, { passive: true });
  }

  /* ── hero: install command typing (OS-aware) and rotating words ─────────────────── */
  const win = /Win/i.test(navigator.platform || navigator.userAgent);
  const INSTALL = win ? 'irm https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.ps1 | iex' : 'curl -fsSL https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.sh | bash';
  $('#osn').textContent = win ? 'PowerShell' : 'bash';
  async function typeInto(el, text, speed = 22, token) { el.textContent = ''; for (const ch of text) { if (token && token.stop) return; el.textContent += ch; await sleep(speed + Math.random() * speed * .6); } }
  (async () => {
    const cmd = $('#hero-cmd'), pre = $('#hero-term'); if (reduce) { cmd.textContent = INSTALL; return; }
    await sleep(900); await typeInto(cmd, INSTALL, 18); await sleep(350);
    pre.querySelector('.caret').remove();
    const out = [['dm', 'installed -> ~/.agents/skills/cinewright'], ['ok', '✔ Node · ffmpeg · Chrome · WebGL2 · fonts'], ['ok', '✔ all good. Restart your agent, then:'], ['pr', '$cinewright make a showreel. Go all out.']];
    for (const [c, tx] of out) { await sleep(260); pre.insertAdjacentHTML('beforeend', `\n<span class="${c}">${esc(tx)}</span>`); }
  })();
  const ROTS = { en: ['person intro', 'channel intro', 'social promo', 'animated infographic', 'event promo', 'logo sting', 'app explainer', 'data story', 'showreel'], fa: ['معرفی یک آدم', 'اینتروی کانال', 'پرومو شبکه‌های اجتماعی', 'اینفوگرافیک متحرک', 'پرومو رویداد', 'لوگو استینگ', 'ویدیوی توضیحی اپ', 'داستان داده', 'شوریل'] };
  (() => {
    const slot = $('#rot'); let i = 0, cur = null;
    const show = () => { const list = ROTS[isFa() ? 'fa' : 'en'], s = document.createElement('span'); s.textContent = list[i % list.length]; s.className = 'pre'; slot.appendChild(s); slot.style.width = s.offsetWidth + 4 + 'px'; void s.offsetWidth; s.className = ''; if (cur) { const o = cur; o.className = 'out'; setTimeout(() => o.remove(), 700); } cur = s; i++; };
    show(); if (!reduce) setInterval(show, 2300); document.addEventListener('langchange', () => { slot.innerHTML = ''; cur = null; i = 0; show(); });
  })();

  /* ── copy buttons ────────────────────────────────────────────────────────────────── */
  document.addEventListener('click', async e => {
    const b = e.target.closest('.cp'); if (!b) return;
    const src = b.dataset.copy ? $(b.dataset.copy) : b.parentElement.querySelector('pre'); if (!src) return;
    const text = b.dataset.copy ? (src.id === 'hero-cmd' ? INSTALL : src.textContent) : src.innerText;
    const old = b.innerHTML; try { await navigator.clipboard.writeText(text); b.textContent = L('copied ✓', 'کپی شد ✓'); } catch { b.textContent = L('select + Ctrl+C', 'انتخاب و Ctrl+C'); } setTimeout(() => { b.innerHTML = old; }, 1600);
  });

  /* ── video manager: lazy-load, play only what is on screen (max 5 at once), pause when the tab is hidden ─────────────── */
  const VM = (() => {
    const playing = new Set(), MAX = 5;
    const attach = v => { if (!v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); } };
    const play = v => { if (reduce || v.dataset.manual) return; if (playing.size >= MAX) { const old = playing.values().next().value; old.pause(); playing.delete(old); } playing.add(v); const p = v.play(); if (p) p.catch(() => {}); };
    const stop = v => { playing.delete(v); v.pause(); };
    const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { attach(e.target); near.unobserve(e.target); } }), { rootMargin: '600px 0px' });
    const vis = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) play(e.target); else stop(e.target); }), { threshold: .35 });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { [...playing].forEach(stop); } });
    return { watch(v) { v.muted = true; near.observe(v); vis.observe(v); }, stop, attach };
  })();
  const vtag = (m, cls = '', extra = '') => `<video class="${cls}" data-src="${esc(m.video)}" poster="${esc(m.posterImg)}" muted loop playsinline preload="none" width="${m.width}" height="${m.height}" ${extra}></video>`;
  const watchAll = (el = document) => $$('video[data-src]:not([data-w])', el).forEach(v => { v.dataset.w = 1; if (!v.hasAttribute('controls')) VM.watch(v); });
  const MEDIAJ = fetch('assets/data/media.json').then(r => r.json()).catch(() => ({ items: [], tasks: [] }));
  const MEDIA = MEDIAJ.then(j => j.items || []), TASKS = MEDIAJ.then(j => j.tasks || []);
  const BENCH = fetch('assets/benchmark/summary.json').then(r => r.json()).catch(() => []);
  const byId = (items, id) => items.find(i => i.id === id);

  /* ── hero visual, hero cards, engine monitor ───────────────────────────────────── */
  MEDIA.then(items => {
    const main = items.find(i => i.section === 'hero'), cards = items.filter(i => i.section === 'herocard'), eng = items.find(i => i.section === 'engine');
    if (main) { const d = $('#hero-main'); d.innerHTML = `<video src="${esc(main.video)}" poster="${esc(main.posterImg)}" autoplay muted loop playsinline preload="auto" width="${main.width}" height="${main.height}" aria-label="The Cinewright ident, made with the skill"></video>`; const v = $('video', d); v.muted = true; if (reduce) v.removeAttribute('autoplay'); }
    cards.forEach((m, k) => { const d = $(k ? '#hero-b' : '#hero-a'); if (d) { d.innerHTML = vtag(m); watchAll(d); } });
    if (eng) { const p = $('#mon-v'); p.insertAdjacentHTML('afterbegin', vtag(eng)); watchAll(p); }
  });

  /* ── data: atlas ─────────────────────────────────────────────────────────────────── */
  fetch('assets/data/atlas.json').then(r => r.json()).then(D => MEDIA.then(items => initAtlas(D, items))).catch(() => { $('#cards').innerHTML = `<div class="empty">Open docs/atlas.md for the full catalogue.</div>`; });
  function initAtlas(D, items) {
    const E = D.entries, F = D.families; $('#at-n').textContent = E.length; const sn = $('#st-n'); if (sn) { sn.dataset.count = E.length; }
    // marquee
    const rng = (() => { let s = 7; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const pickRows = [0, 1].map(() => E.slice().sort(() => rng() - .5).slice(0, 34));
    $('#marquee').innerHTML = pickRows.map((row, k) => { const chips = row.map(e => `<span class="chip" style="--fc:${famColor(e.f)}"><i></i>${esc(e.id)}</span>`).join(''); return `<div class="mq ${k ? 'r' : ''}">${chips}${chips}</div>`; }).join('');
    // reels: real recipes rendered by the atlas itself (family filters with motion)
    const reels = items.filter(i => i.section === 'reel');
    $('#reels').innerHTML = reels.map(m => { const f = m.family, fm = F.find(x => x.id === f); return `<div class="reel" data-f="${f}" role="button" tabindex="0">${vtag(m)}<span style="color:${famColor(f)}">${esc(f)}<small>${fm ? fm.n : ''} ${L('recipes', 'دستورکار')}</small></span></div>`; }).join(''); watchAll($('#reels'));
    // explorer state
    const st = { q: '', fam: '', n: 24 };
    $('#fams').innerHTML = `<button class="fam" data-f="" aria-pressed="true"><i style="--fc:#fff"></i>${L('All', 'همه')} <b>${E.length}</b></button>` + F.map(f => `<button class="fam" data-f="${f.id}" aria-pressed="false"><i style="--fc:${famColor(f.id)}"></i>${esc(f.id)} <b>${f.n}</b></button>`).join('');
    const words = q => q.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const score = (e, ws) => { let s = 0; for (const w of ws) { let m = 0; if (e.id.includes(w)) m += 6; if (e.t.toLowerCase().includes(w)) m += 5; if (e.g.some(g => g.includes(w))) m += 3; if (e.u.toLowerCase().includes(w)) m += 1; if (e.f.includes(w)) m += 2; if (!m) return -1; s += m; } return s; };
    const hl = (txt, ws) => { let o = esc(txt); for (const w of ws) { if (w.length < 2) continue; o = o.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); } return o; };
    const render = (append) => {
      const ws = words(st.q); let list = E.filter(e => !st.fam || e.f === st.fam);
      if (ws.length) list = list.map(e => [e, score(e, ws)]).filter(x => x[1] >= 0).sort((a, b) => b[1] - a[1]).map(x => x[0]);
      const shown = list.slice(0, st.n); $('#res-n').textContent = L(`Showing ${shown.length} of ${list.length}`, `نمایش ${shown.length} از ${list.length}`);
      $('#cards').innerHTML = shown.length ? shown.map((e, i) => `<button class="ac" style="--fc:${famColor(e.f)};--i:${append ? Math.max(0, i - (st.n - 24)) : i}" data-id="${esc(e.id)}"><div class="id"><span>${esc(e.f)}</span>${e.r ? '<em>▶ runnable</em>' : ''}</div><h4>${hl(e.t, ws)}</h4><p>${hl(e.u, ws)}</p><div class="id" style="margin:9px 0 0;color:var(--dim)">${esc(e.id)}</div><span class="copied">${L('copied: atlas.mjs show', 'کپی شد: atlas.mjs show')} ${esc(e.id)}</span></button>`).join('') : `<div class="empty">${L('Nothing matches — try “3d”, “particles”, “logo”, “transition”, “camera”.', 'چیزی پیدا نشد — «3d»، «particles»، «logo»، «transition» یا «camera» را امتحان کنید.')}</div>`;
      $('#more').hidden = shown.length >= list.length;
    };
    render();
    $('#q').addEventListener('input', e => { st.q = e.target.value; st.n = 24; render(); });
    $('#fams').addEventListener('click', e => { const b = e.target.closest('.fam'); if (!b) return; $$('.fam').forEach(x => x.setAttribute('aria-pressed', x === b)); st.fam = b.dataset.f; st.n = 24; render(); });
    $('#reels').addEventListener('click', e => { const r = e.target.closest('.reel'); if (!r) return; st.fam = r.dataset.f; st.n = 24; $$('.fam').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === st.fam)); render(); $('#fams').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    $('#more').addEventListener('click', () => { st.n += 24; render(true); });
    $('#cards').addEventListener('click', async e => { const c = e.target.closest('.ac'); if (!c) return; try { await navigator.clipboard.writeText(CMD + c.dataset.id); } catch { /* ignore */ } c.classList.add('cp-on'); setTimeout(() => c.classList.remove('cp-on'), 1300); });
    addEventListener('keydown', e => { if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) { e.preventDefault(); $('#q').focus(); $('#q').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
    document.addEventListener('langchange', () => { $('#fams .fam:first-child').innerHTML = `<i style="--fc:#fff"></i>${L('All', 'همه')} <b>${E.length}</b>`; render(); $$('#reels .reel span small').forEach((s, i) => { const fm = F.find(x => x.id === reels[i].family); s.textContent = `${fm ? fm.n : ''} ${L('recipes', 'دستورکار')}`; }); });
  }

  /* ── layers: sticky storytelling with typed terminals ────────────────────────────── */
  (() => {
    const steps = $$('.step'), panes = $$('.pane'), typed = {};
    const ATLAS = [['pr', '$ node atlas.mjs search liquid chrome 3d text'], ['', ''], ['ok', ' 1. text3d-chrome          [three-d]   Puffy chrome word on a glossy floor'], ['dm', '      use: THE hero shot — brand name / title as a polished 3D object'], ['dm', '      pairs with: bg-nebula, particles-morph-word, cam-orbit-3d, trans-zoomblur'], ['ok', ' 2. style-chrome-cinema    [styles]    Dark cinematic chrome'], ['dm', '      use: product/brand/tech films that should feel expensive and powerful'], ['ok', ' 3. style-liquid-dream     [styles]    Liquid metal & dreamy gradients'], ['dm', '      use: AI, creativity, fashion, wellness tech; surreal and calm at once'], ['', ''], ['pr', '$ node atlas.mjs show text3d-chrome'], ['dm', '→ the full recipe: use · how · avoid · pairs-with · runnable code']];
    const QC = [['pr', '$ node tools/qc.mjs check'], ['dm', '── pacing'], ['dm', '  info  median 0.0758 · quiet 0% of the time · 10 hard cut(s)'], ['ok', '✔ PASS  no static holds ≥ 1.5 s'], ['dm', '  info  frame fill: median 43% (reference films 27–53%)'], ['ok', '✔ PASS  frames are filled'], ['dm', '── audio'], ['ok', '✔ PASS  integrated loudness -14 LUFS (social target ≈ −14)'], ['ok', '✔ PASS  true peak -1.4 dBFS (headroom OK)'], ['dm', '── craft (studio mode: plan · code · process)'], ['ok', '✔ PASS  brief.md cites 30 atlas techniques from 10 families'], ['ok', '✔ PASS  video.html has no Math.random / Date.now / timers'], ['ok', '✔ PASS  7 different transitions: whip, zoomBlurCut, dots, liquid…'], ['ok', '✔ PASS  3 written review rounds with real fix lists'], ['ok', '✔ 0 failure(s), 0 warning(s). Ship it.']];
    async function play(id, lines) { const el = $(id); if (typed[id]) return; typed[id] = true; el.innerHTML = ''; for (const [c, t] of lines) { if (reduce) { el.insertAdjacentHTML('beforeend', `<span class="${c}">${esc(t)}</span>\n`); continue; } const line = document.createElement('span'); line.className = c; el.appendChild(line); el.appendChild(document.createTextNode('\n')); if (c === 'pr') { for (const ch of t) { line.textContent += ch; await sleep(14); } await sleep(220); } else { line.textContent = t; await sleep(110); } } }
    const set = i => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); panes.forEach((p, k) => p.classList.toggle('on', k === i)); if (i === 1) play('#t-atlas', ATLAS); if (i === 2) play('#t-qc', QC); };
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.p); }), { rootMargin: '-40% 0px -45% 0px' }); steps.forEach(s => so.observe(s));
    steps.forEach(s => s.addEventListener('click', () => set(+s.dataset.p)));
  })();

  /* ── pipeline: width for the travelling pulse ────────────────────────────────────── */
  const pipe = $('#pipe'); if (pipe) { const m = () => pipe.style.setProperty('--pw', pipe.clientWidth + 'px'); m(); addEventListener('resize', m); }

  /* ── THE PROOF: the same prompt, the same agent, with and without the skill — real films with sound ─────────────── */
  Promise.all([MEDIA, BENCH, TASKS]).then(([items, bench, tasks]) => {
    const host = $('#ab'), tabs = $('#ab-tabs'), ttabs = $('#ab-tasks'); if (!host) return;
    const cmpAll = items.filter(i => i.section === 'compare'); if (!cmpAll.length) { $('#results').hidden = true; return; }
    const vis = i => i.lang !== 'fa' || isFa(), tk = i => i.task || 'showreel', taskList = () => { const rank = id => { const k = tasks.findIndex(t => t.id === id); return k < 0 ? 99 : k; }; return [...new Set(cmpAll.filter(vis).map(tk))].filter(tid => cmpAll.some(a => tk(a) === tid && a.side === 'without' && cmpAll.some(b => tk(b) === tid && b.pair === a.pair && b.side === 'with'))).sort((a, b) => rank(a) - rank(b)); };   // a prompt gets a tab only when at least one pair is complete
    const info = id => tasks.find(t => t.id === id) || { id, title: id, prompt: '' };
    const pairsOf = tid => [...new Set(cmpAll.filter(i => tk(i) === tid && vis(i)).map(i => i.pair))].map(k => ({ key: k, without: cmpAll.find(i => tk(i) === tid && i.pair === k && i.side === 'without'), with: cmpAll.find(i => tk(i) === tid && i.pair === k && i.side === 'with') })).filter(p => p.without && p.with);
    const row = id => bench.find(r => r.id === id) || null;
    const tabLabel = p => ((p.with || p.without).agent || p.key).replace(/ \+ Cinewright/, '');
    let curTask = taskList()[0], cur = pairsOf(curTask)[0].key, snd = 'with';
    const metric = (r, k) => r ? r[k] : null;
    const chip = (r) => r ? [r.fill != null ? `${L('fill', 'پُری')} ${num(r.fill)}%` : '', r.quietPct != null ? `${L('static', 'ساکن')} ${num(r.quietPct)}%` : '', r.lra != null ? `LRA ${num(r.lra, 1)}` : ''].filter(Boolean).map(c => `<span class="mc">${c}</span>`).join('') : '';
    const player = (m, side) => !m ? `<figure class="vp ${side}"><div class="vp-miss">${L('film not available yet', 'فیلم هنوز آماده نیست')}</div></figure>` : `<figure class="vp ${side === 'with' ? 'win' : ''}${m.height > m.width ? ' vert' : ''}" data-side="${side}"><span class="vlab">${side === 'with' ? L('With Cinewright', 'با سینه‌رایت') : L('Without Cinewright', 'بدون سینه‌رایت')}</span><video controls playsinline preload="metadata" poster="${esc(m.posterImg)}" src="${esc(m.video)}" width="${m.width}" height="${m.height}" data-side="${side}" data-manual="1"></video><figcaption>${chip(row(m.metrics))}</figcaption></figure>`;
    const vids = () => $$('#ab video');
    const applySound = () => { vids().forEach(v => { v.muted = v.dataset.side !== snd; }); $$('#ab-snd button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === snd)); };
    function barPair(label, a, b, better, unit = '%', max = 100, d = 0) {
      if (a == null && b == null) return '';
      const w = v => v == null ? 0 : clamp(v / max * 100, 2, 100), win = a != null && b != null && (better === 'high' ? b > a : b < a), lose = a != null && b != null && (better === 'high' ? b < a : b > a);
      return `<div class="mrow"><div class="ml">${label}</div><div class="mb"><div class="mbar a"><i style="--w:${w(a)}%"></i><b>${a == null ? '–' : num(a, d) + unit}</b></div><div class="mbar b ${win ? 'ok' : lose ? 'no' : ''}"><i style="--w:${w(b)}%"></i><b>${b == null ? '–' : num(b, d) + unit}</b></div></div></div>`;
    }
    function drawMetrics(p) {
      const a = row(p.without?.metrics), b = row(p.with?.metrics); const abm = $('#abm'); if (!a && !b) { abm.innerHTML = ''; return; }
      const mins = r => r && r.wallSeconds ? r.wallSeconds / 60 : null, kt = r => r && r.tokens ? r.tokens / 1000 : null;
      abm.innerHTML = `<div class="abm-in glass"><div class="abm-h"><span></span><span>${L('Without', 'بدون')}</span><span class="hl">${L('With Cinewright', 'با سینه‌رایت')}</span></div>`
        + barPair(L('Frame fill — bolder pictures', 'پُری قاب — تصویر جسورتر'), metric(a, 'fill'), metric(b, 'fill'), 'high', '%', 60, 0)
        + barPair(L('Static time — less is better', 'زمان ساکن — کمتر بهتر'), metric(a, 'quietPct'), metric(b, 'quietPct'), 'low', '%', 100, 0)
        + barPair(L('Loudness range — mix dynamics', 'دامنهٔ بلندی صدا — پویایی میکس'), metric(a, 'lra'), metric(b, 'lra'), 'high', ' LU', 12, 1)
        + barPair(L('Agent time', 'زمان ایجنت'), mins(a), mins(b), 'none', ' min', 80, 0)
        + barPair(L('Tokens (in + out)', 'توکن (ورودی + خروجی)'), kt(a), kt(b), 'none', 'M', 15, 1) + `</div>`;
    }
    const drawPrompt = () => { const t = info(curTask); $('#res-prompt').textContent = '$cinewright ' + (t.prompt || ''); };
    function drawPair() {
      const p = pairsOf(curTask).find(x => x.key === cur) || pairsOf(curTask)[0]; cur = p.key;
      host.innerHTML = player(p.without, 'without') + player(p.with, 'with'); $('#abbar').hidden = !(p.without && p.with); applySound(); drawMetrics(p);
      const rd = (p.with || p.without).read; $('#ab-read').innerHTML = rd ? `<b>${L('Our read', 'برداشت ما')}</b> ${esc(T2(rd))}` : ''; $('#ab-read').hidden = !rd;
      host.querySelectorAll('video').forEach(v => v.addEventListener('play', () => { vids().forEach(o => { if (o !== v && !$('#ab').dataset.both) o.pause(); }); }));
      $$('.vp', host).forEach(f => f.classList.add('in'));
    }
    const drawTabs = () => {
      ttabs.innerHTML = taskList().map(id => `<button role="tab" aria-selected="${id === curTask}" data-k="${esc(id)}">${esc(T2(info(id).title))}</button>`).join('');
      tabs.innerHTML = pairsOf(curTask).map(p => `<button role="tab" aria-selected="${p.key === cur}" data-k="${esc(p.key)}">${esc(tabLabel(p))}</button>`).join('');
      drawPrompt();
    };
    drawTabs(); drawPair();
    ttabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; curTask = b.dataset.k; cur = pairsOf(curTask)[0].key; drawTabs(); drawPair(); });
    tabs.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.k; drawTabs(); drawPair(); });
    $('#ab-snd').addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (!b) return; snd = b.dataset.s; applySound(); });
    $('#ab-both').addEventListener('click', () => { host.dataset.both = '1'; applySound(); vids().forEach(v => { v.currentTime = 0; const pr = v.play(); if (pr) pr.catch(() => {}); }); setTimeout(() => { delete host.dataset.both; }, 500); });
    const note = () => { $('#ab-note').innerHTML = L(
      `One run per side. The Codex films are unattended <code>codex exec</code> sessions at <b>xhigh</b> reasoning — “without” = the skill disabled, “with” = installed in the project folder, the prompt identical apart from <code>$cinewright</code>. The Claude pair was made in an interactive session by the same Claude that wrote the skill: <b>not blind</b>, and the “without” film deliberately never opened it (plain Python + Pillow). Judge by eye and ear first; the numbers only check motion and sound hygiene — and the skill costs several times the tokens. We publish every run: the report also has a sci-fi HUD, a launch film, a trailer and a music visualizer — including the ones the skill does not win. <a href="https://github.com/msmahdinejad/cinewright/blob/main/docs/benchmark.md">Method &amp; all runs</a>`,
      `یک اجرا برای هر سمت. فیلم‌های Codex جلسه‌های بی‌نظارت <code>codex exec</code> با ریزنینگ <b>xhigh</b> هستند — «بدون» = اسکیل غیرفعال، «با» = نصب در پوشهٔ پروژه، پرامپت یکسان جز <code>$cinewright</code>. جفت Claude در یک جلسهٔ تعاملی ساخته شده، با همان Claudeای که اسکیل را نوشته: <b>کور نیست</b>، و فیلم «بدون» عمداً اسکیل را باز نکرد (فقط Python + Pillow). اول با چشم و گوش قضاوت کنید؛ اعداد فقط سلامت حرکت و صدا را می‌سنجند — و اسکیل چندین برابر توکن مصرف می‌کند. همهٔ اجراها را منتشر می‌کنیم: در گزارش یک HUD علمی‌تخیلی، یک فیلم معرفی محصول، یک تیزر و یک ویژوالایزر هم هست — حتی آن‌هایی که اسکیل در آن‌ها نمی‌برد. <a href="https://github.com/msmahdinejad/cinewright/blob/main/docs/benchmark.md">روش و همهٔ اجراها</a>`); };
    note(); document.addEventListener('langchange', () => { note(); if (!taskList().includes(curTask)) { curTask = taskList()[0]; cur = pairsOf(curTask)[0].key; } drawTabs(); drawPair(); });
  });

  /* ── showcase gallery + lightbox ─────────────────────────────────────────────────── */
  MEDIA.then(items => {
    const films = items.filter(i => i.section === 'showcase'); const host = $('#gallery'), fil = $('#sc-filter'), dlg = $('#dlg'), v = $('#dlg-v'); if (!host) return; if (!films.length) { $('#showcase').hidden = true; return; }
    let f = 'all'; const dur = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
    const visible = () => films.filter(m => (m.lang !== 'fa' || isFa()) && (f === 'all' || (f === 'fa' ? m.lang === 'fa' : m.agentFamily === f)));
    const FILT = () => [['all', L('All', 'همه')], ['codex', 'Codex'], ['claude', 'Claude Code'], ...(isFa() ? [['fa', 'فارسی']] : [])];
    const drawF = () => { fil.innerHTML = FILT().map(([k, t]) => `<button role="tab" aria-selected="${k === f}" data-k="${k}">${esc(t)}</button>`).join(''); };
    const draw = () => {
      const list = visible(); host.innerHTML = list.map((m, i) => `<article class="film ${m.height > m.width ? 'v' : ''} ${m.lang === 'fa' ? 'fa-only' : ''}" data-id="${esc(m.id)}"><div class="im" style="aspect-ratio:${m.width}/${m.height}">${vtag(m)}<button class="pl" data-id="${esc(m.id)}" aria-label="${L('Play with sound', 'پخش با صدا')}: ${esc(T2(m.title))}"><span><svg viewBox="0 0 24 24"><use href="#i-play"/></svg></span><em>${L('Play with sound', 'پخش با صدا')}</em></button><span class="ag">${esc(m.agent || '')}</span><span class="du">${dur(m.duration)}${m.audio ? ' ♪' : ''}</span></div><div class="tx"><h3>${esc(T2(m.title))}</h3><p>${esc(T2(m.desc))}</p><details><summary>${L('The prompt', 'پرامپت')}</summary><p class="prm" dir="${/[؀-ۿ]/.test(m.prompt || '') ? 'rtl' : 'ltr'}">${esc(m.prompt || '')}</p></details></div></article>`).join('') || `<div class="empty">${L('Nothing here yet.', 'هنوز چیزی اینجا نیست.')}</div>`;
      watchAll(host); if (!coarse && !reduce && window.__tilt) $$('.film', host).forEach(el => window.__tilt(el, 2.5));
    };
    drawF(); draw(); document.addEventListener('langchange', () => { if (f === 'fa' && !isFa()) f = 'all'; drawF(); draw(); });
    fil.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; f = b.dataset.k; drawF(); draw(); });
    host.addEventListener('click', e => {
      if (e.target.closest('details')) return; const c = e.target.closest('.film'); if (!c) return; const m = films.find(x => x.id === c.dataset.id); if (!m) return;
      $('#dlg-fb').innerHTML = `<b>${esc(T2(m.title))}</b> · ${esc(m.agent || '')}<p class="prm" dir="${/[؀-ۿ]/.test(m.prompt || '') ? 'rtl' : 'ltr'}">${esc(m.prompt || '')}</p><a href="${REL + m.src}.mp4">${L('Download the original MP4', 'دانلود MP4 اصلی')}</a>`;
      v.removeAttribute('data-manual'); v.muted = false; v.src = m.video; v.poster = m.posterImg; v.onerror = () => { $('#dlg-fb').insertAdjacentHTML('afterbegin', `<p>${L('Could not play it here — ', 'اینجا پخش نشد — ')}<a href="${REL + m.src}.mp4">${L('download the MP4', 'دانلود MP4')}</a></p>`); };
      dlg.showModal(); const pr = v.play(); if (pr) pr.catch(() => {});
    });
    const close = () => { v.pause(); v.removeAttribute('src'); v.load(); dlg.close(); }; $('#dlg-x').addEventListener('click', close); dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); dlg.addEventListener('close', () => { v.pause(); });
  });

  /* ── Persian: karaoke captions (the atlas recipe type-karaoke-captions, in CSS) ──── */
  (() => {
    const box = $('#kar'), ws = $$('span', box), pill = $('.pillb', box); let i = -1, timer = 0;
    const place = k => { const w = ws[k]; if (!w) return; pill.style.cssText = `left:${w.offsetLeft - 8}px;top:${w.offsetTop - 2}px;width:${w.offsetWidth + 16}px;height:${w.offsetHeight + 4}px`; };
    const tick = () => { i++; if (i > ws.length + 2) { i = -1; ws.forEach(w => w.className = ''); pill.style.opacity = 0; return; } ws.forEach((w, k) => w.className = k < i ? 'done' : k === i ? 'act' : ''); if (i >= 0 && i < ws.length) { pill.style.opacity = 1; place(i); } };
    const so = new IntersectionObserver(es => { if (es[0].isIntersecting) { if (!timer && !reduce) timer = setInterval(tick, 520); if (reduce) ws.forEach(w => w.className = 'done'); } else { clearInterval(timer); timer = 0; } }, { threshold: .4 }); so.observe(box);
    addEventListener('resize', () => place(clamp(i, 0, ws.length - 1)));
  })();

  /* ── benchmark: each agent against itself, from the committed results ──────────── */
  Promise.all([MEDIA, BENCH, TASKS]).then(([items, rows, tasks]) => {
    const host = $('#bm'); if (!host) return;
    const cmp = items.filter(i => i.section === 'compare'), tk = i => i.task || 'showreel';
    const rank = id => { const k = tasks.findIndex(t => t.id === id); return k < 0 ? 99 : k; }, keysAll = () => [...new Set(cmp.filter(i => i.lang !== 'fa' || isFa()).map(i => tk(i) + '|' + i.pair))].filter(key => { const [t, k] = key.split('|'); return ['without', 'with'].every(sd => cmp.some(i => tk(i) === t && i.pair === k && i.side === sd)); }).sort((x, y) => rank(x.split('|')[0]) - rank(y.split('|')[0]));
    const bar = (name, val, pct, cls) => `<div class="bar"><div class="lb"><span>${name}</span><b>${val}</b></div><div class="tr"><div class="fl ${cls}" data-w="${pct}"></div></div></div>`;
    const card = key => {
      const [t, k] = key.split('|'), a = cmp.find(i => tk(i) === t && i.pair === k && i.side === 'without'), b = cmp.find(i => tk(i) === t && i.pair === k && i.side === 'with'), ra = a && rows.find(r => r.id === a.metrics), rb = b && rows.find(r => r.id === b.metrics); if (!ra && !rb) return '';
      const ti = tasks.find(x => x.id === t), agent = ((b || a).agent || k).replace(/ \+ Cinewright/, ''), title = agent + (t === 'showreel' || !ti ? '' : ' · ' + T2(ti.title));
      const col = (r, who, win) => !r ? `<div class="col"><div class="who">${who}</div><div class="dm">${L('no result yet', 'هنوز نتیجه‌ای نیست')}</div></div>` : !r.ok ? `<div class="col"><div class="who">${who}</div><div class="dm">✘ ${L('no film produced', 'فیلمی تولید نشد')}</div></div>` :
        `<div class="col ${win ? 'win' : ''}"><div class="who">${who}<small>${num(r.length, 0)} s${r.wallSeconds ? ' · ' + Math.round(r.wallSeconds / 60) + ' min' : ''}${r.tokens ? ' · ' + (r.tokens / 1000).toFixed(1) + 'M ' + L('tokens', 'توکن') : ''}</small></div>`
          + bar(L('frame fill', 'پُری قاب'), num(r.fill) + '%', Math.min(100, (r.fill || 0) * 1.7), (r.fill || 0) >= 25 ? 'good' : (r.fill || 0) < 15 ? 'bad' : '')
          + bar(L('static time', 'زمان ساکن'), num(r.quietPct) + '%', Math.min(100, (r.quietPct || 0) * 1.7), (r.quietPct || 0) > 40 ? 'bad' : (r.quietPct || 0) < 15 ? 'good' : '')
          + bar(L('loudness range', 'دامنهٔ بلندی'), num(r.lra, 1) + ' LU', Math.min(100, (r.lra || 0) * 12), (r.lra || 0) >= 2 ? 'good' : (r.lra || 0) < .6 ? 'bad' : '') + `</div>`;
      return `<div class="card bm rv in"><h3>${esc(title)}</h3><div class="dm">${L('same prompt · the agent against itself', 'پرامپت یکسان · ایجنت در برابر خودش')}</div><div class="cols">${col(ra, L('Without Cinewright', 'بدون سینه‌رایت'), false)}${col(rb, L('With Cinewright', 'با سینه‌رایت'), true)}</div></div>`;
    };
    const draw = () => {
      host.innerHTML = keysAll().map(card).join('') || '<div class="empty">Open docs/benchmark.md for the results.</div>';
      const bio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('.fl', e.target).forEach(f => { f.style.width = f.dataset.w + '%'; }); bio.unobserve(e.target); } }), { threshold: .25 }); $$('.bm', host).forEach(c => bio.observe(c));
    };
    draw(); document.addEventListener('langchange', draw);
  });

  /* ── install tabs, prompt rotator ────────────────────────────────────────────────── */
  $('#itabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#itabs button').forEach(x => x.setAttribute('aria-selected', x === b)); $$('.panel').forEach(p => p.classList.toggle('on', p.id === b.dataset.p)); });
  if (!win) { const b = $('#itabs button[data-p=p2]'); b && b.click(); }
  (() => {
    const PEN = [
      '$cinewright Make a 15-second motion graphics video that introduces a person: Maya Chen, a senior product designer from Toronto — name and role, three skills, three numbers, a quote, her handle @mayachen. Clean, modern, energetic. Go all out.',
      '$cinewright Make an 8-second YouTube channel intro for a tech-review channel called "Pixel Pulse": a logo mark that builds itself, the name, a tagline, punchy transitions and sound design. Go all out.',
      '$cinewright Make a 12-second vertical (9:16) social promo for a coffee shop, "Brew & Co.", announcing three autumn drinks with prices and a call to action. Bold type, flat shapes, a beat-synced edit. Go all out.',
      '$cinewright Make a 20-second animated infographic "Why sleep matters" with three facts, animated icons, counting numbers and upbeat music. Go all out.',
      '$cinewright make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it\'s your showreel for a résumé. Go all out.',
    ];
    const PFA = [
      '$cinewright یک موشن‌گرافی ۱۵ ثانیه‌ای برای معرفی «سارا احمدی»، طراح محصول ساکن تهران بساز (جزئیات را خودت بساز): نام و عنوان، سه مهارت، سه عدد (سال تجربه، پروژه، جایزه) و یک جملهٔ کوتاه. تمیز، مدرن و پرانرژی؛ متن فارسی درست شکل‌گرفته و راست‌به‌چپ. موسیقی را خودت بساز. Go all out.',
      '$cinewright یک اینفوگرافیک متحرک ۲۰ ثانیه‌ای با عنوان «چرا خواب مهم است» بساز: سه واقعیت، آیکون‌های متحرک، عددهای در حال شمارش، سلسله‌مراتب بصری روشن و موسیقی شاد. Go all out.',
    ];
    const list = () => isFa() ? [...PFA, ...PEN] : PEN;
    const q = $('#pq'), dots = $('#pd'); let i = 0, run = 0, vis = false;
    const drawDots = () => { dots.innerHTML = list().map((_, k) => `<button aria-label="Prompt ${k + 1}"></button>`).join(''); };
    drawDots();
    async function cycle(my) { const P = list(), k = i % P.length; $$('button', dots).forEach((b, n) => b.classList.toggle('on', n === k)); q.innerHTML = ''; const span = document.createElement('span'); q.appendChild(span); const txt = P[k]; q.style.direction = /[؀-ۿ]/.test(txt) ? 'rtl' : 'ltr'; q.style.textAlign = /[؀-ۿ]/.test(txt) ? 'right' : 'left'; for (let c = 0; c < txt.length; c++) { if (my !== run) return; span.innerHTML = esc(txt.slice(0, c + 1)).replace('$cinewright', '<span class="dl">$cinewright</span>'); await sleep(reduce ? 0 : 16); } await sleep(3800); if (my !== run) return; i++; cycle(my); }
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; i = $$('button', dots).indexOf(b); run++; cycle(run); });
    document.addEventListener('langchange', () => { i = 0; drawDots(); if (vis) { run++; cycle(run); } });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) { run++; cycle(run); } else run++; }, { threshold: .3 }).observe(q);
  })();

  /* ── footer wordmark: letters swell near the pointer (variable font weight) ─────── */
  (() => {
    const bw = $('#bw'); bw.innerHTML = [...'Cinewright'].map(c => `<span>${c}</span>`).join(''); if (coarse || reduce) return; const sp = $$('span', bw);
    bw.addEventListener('pointermove', e => { sp.forEach(s => { const r = s.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), (e.clientY - (r.top + r.height / 2)) * .6); s.style.setProperty('--wg', Math.round(300 + 400 * Math.exp(-(d * d) / (2 * 170 * 170)))); }); });
    bw.addEventListener('pointerleave', () => sp.forEach(s => s.style.removeProperty('--wg')));
  })();
})();
