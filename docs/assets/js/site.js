/* Cinewright website — vanilla JS, no dependencies. Components: i18n, reveal, counters, magnetic/tilt, hero typing, atlas explorer, showcase, benchmark charts, installer, footer wordmark. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  const safe = f => { try { return f(); } catch { return null; } };
  const root = document.documentElement;
  const isFa = () => root.lang === 'fa';
  const L = (en, fa) => isFa() ? fa : en;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const FAMC = { type: '#ff7ad9', 'three-d': '#40f5f5', particles: '#ffd23f', shaders: '#8a63ff', looks: '#ff9e5e', camera: '#5dff9d', transitions: '#7aa7ff', light: '#fff1a8', 'ui-data': '#6be3ff', graphic: '#ff5ea8', logos: '#b79cff', sound: '#9dff7a', ideas: '#ffb3c7', editing: '#a9a9ff', color: '#ff8f8f', styles: '#e0b0ff', pipelines: '#8affc7' };
  const famColor = f => FAMC[f] || '#9a98c0';
  const CMD = 'node skills/cinewright/scripts/atlas.mjs show ';

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
  const ROTS = { en: ['showreel', 'logo sting', 'product film', 'cinematic trailer', 'explainer', 'music visual', 'Persian title sequence'], fa: ['شوریل', 'لوگو استینگ', 'فیلم محصول', 'تریلر سینمایی', 'ویدیوی توضیحی', 'موزیک ویژوال', 'تیتراژ فارسی'] };
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

  /* ── data: atlas ─────────────────────────────────────────────────────────────────── */
  fetch('assets/data/atlas.json').then(r => r.json()).then(initAtlas).catch(() => { $('#cards').innerHTML = `<div class="empty">Open docs/atlas.md for the full catalogue.</div>`; });
  function initAtlas(D) {
    const E = D.entries, F = D.families; $('#at-n').textContent = E.length; const sn = $('#st-n'); if (sn) { sn.dataset.count = E.length; }
    // marquee
    const rng = (() => { let s = 7; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const pickRows = [0, 1].map(() => E.slice().sort(() => rng() - .5).slice(0, 34));
    $('#marquee').innerHTML = pickRows.map((row, k) => { const chips = row.map(e => `<span class="chip" style="--fc:${famColor(e.f)}"><i></i>${esc(e.id)}</span>`).join(''); return `<div class="mq ${k ? 'r' : ''}">${chips}${chips}</div>`; }).join('');
    // reels (family filters with motion)
    const REELS = [['type', 'reel-type'], ['three-d', 'reel-3d'], ['particles', 'reel-particles'], ['shaders', 'reel-shaders'], ['looks', 'reel-looks'], ['logos', 'reel-logos'], ['graphic', 'reel-graphic'], ['ui-data', 'reel-ui']];
    $('#reels').innerHTML = REELS.map(([f, r]) => { const fm = F.find(x => x.id === f); return `<div class="reel" data-f="${f}" role="button" tabindex="0"><img src="assets/anim/${r}.webp" alt="${esc(f)} reel" width="560" height="315" loading="lazy"><span style="color:${famColor(f)}">${esc(f)}<small>${fm ? fm.n : ''} ${L('recipes', 'دستورکار')}</small></span></div>`; }).join('');
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
      $('#cards').innerHTML = shown.length ? shown.map((e, i) => `<button class="ac" style="--fc:${famColor(e.f)};--i:${append ? Math.max(0, i - (st.n - 24)) : i}" data-id="${esc(e.id)}"><div class="id"><span>${esc(e.f)}</span>${e.r ? '<em>▶ runnable</em>' : ''}</div><h4>${hl(e.t, ws)}</h4><p>${hl(e.u, ws)}</p><div class="id" style="margin:9px 0 0;color:var(--dim)">${esc(e.id)}</div><span class="copied">${L('copied: atlas.mjs show', 'کپی شد: atlas.mjs show')} ${esc(e.id)}</span></button>`).join('') : `<div class="empty">${L('Nothing matches — try “3d”, “particles”, “persian”, “logo”, “transition”.', 'چیزی پیدا نشد — «3d»، «particles»، «persian»، «logo» یا «transition» را امتحان کنید.')}</div>`;
      $('#more').hidden = shown.length >= list.length;
    };
    render();
    $('#q').addEventListener('input', e => { st.q = e.target.value; st.n = 24; render(); });
    $('#fams').addEventListener('click', e => { const b = e.target.closest('.fam'); if (!b) return; $$('.fam').forEach(x => x.setAttribute('aria-pressed', x === b)); st.fam = b.dataset.f; st.n = 24; render(); });
    $('#reels').addEventListener('click', e => { const r = e.target.closest('.reel'); if (!r) return; st.fam = r.dataset.f; st.n = 24; $$('.fam').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === st.fam)); render(); $('#fams').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    $('#more').addEventListener('click', () => { st.n += 24; render(true); });
    $('#cards').addEventListener('click', async e => { const c = e.target.closest('.ac'); if (!c) return; try { await navigator.clipboard.writeText(CMD + c.dataset.id); } catch { /* ignore */ } c.classList.add('cp-on'); setTimeout(() => c.classList.remove('cp-on'), 1300); });
    addEventListener('keydown', e => { if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) { e.preventDefault(); $('#q').focus(); $('#q').scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
    document.addEventListener('langchange', () => { $('#fams .fam:first-child').innerHTML = `<i style="--fc:#fff"></i>${L('All', 'همه')} <b>${E.length}</b>`; render(); $$('#reels .reel span small').forEach((s, i) => { const fm = F.find(x => x.id === REELS[i][0]); s.textContent = `${fm ? fm.n : ''} ${L('recipes', 'دستورکار')}`; }); });
  }

  /* ── layers: sticky storytelling with typed terminals ────────────────────────────── */
  (() => {
    const steps = $$('.step'), panes = $$('.pane'), typed = {};
    const ATLAS = [['pr', '$ node atlas.mjs search liquid chrome 3d text'], ['', ''], ['ok', ' 1. text3d-chrome          [three-d]   Puffy chrome word on a glossy floor'], ['dm', '      use: THE hero shot — brand name / title as a polished 3D object; works for Persian'], ['dm', '      pairs with: bg-nebula, particles-morph-word, cam-orbit-3d, trans-zoomblur'], ['ok', ' 2. style-chrome-cinema    [styles]    Dark cinematic chrome'], ['dm', '      use: product/brand/tech films that should feel expensive and powerful'], ['ok', ' 3. style-liquid-dream     [styles]    Liquid metal & dreamy gradients'], ['dm', '      use: AI, creativity, fashion, wellness tech; surreal and calm at once'], ['', ''], ['pr', '$ node atlas.mjs show text3d-chrome'], ['dm', '→ the full recipe: use · how · avoid · pairs-with · runnable code']];
    const QC = [['pr', '$ node tools/qc.mjs check'], ['dm', '── pacing'], ['dm', '  info  median 0.0398 · quiet 16% of the time · 11 hard cut(s)'], ['ok', '✔ PASS  no static holds ≥ 1.5 s'], ['dm', '── audio'], ['ok', '✔ PASS  integrated loudness -14 LUFS (social target ≈ −14)'], ['ok', '✔ PASS  true peak -1.4 dBFS (headroom OK)'], ['dm', '── craft (studio mode: plan · code · process)'], ['ok', '✔ PASS  brief.md cites 14 atlas techniques from 6 families'], ['ok', '✔ PASS  video.html has no Math.random / Date.now / timers'], ['ok', '✔ PASS  8 different transitions: whip, zoomBlurCut, dots, slide…'], ['ok', '✔ PASS  3 written review rounds (qc/review-*.md)'], ['ok', '✔ 0 failure(s), 0 warning(s). Ship it.']];
    async function play(id, lines) { const el = $(id); if (typed[id]) return; typed[id] = true; el.innerHTML = ''; for (const [c, t] of lines) { if (reduce) { el.insertAdjacentHTML('beforeend', `<span class="${c}">${esc(t)}</span>\n`); continue; } const line = document.createElement('span'); line.className = c; el.appendChild(line); el.appendChild(document.createTextNode('\n')); if (c === 'pr') { for (const ch of t) { line.textContent += ch; await sleep(14); } await sleep(220); } else { line.textContent = t; await sleep(110); } } }
    const set = i => { steps.forEach((s, k) => s.classList.toggle('on', k === i)); panes.forEach((p, k) => p.classList.toggle('on', k === i)); if (i === 1) play('#t-atlas', ATLAS); if (i === 2) play('#t-qc', QC); };
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(+e.target.dataset.p); }), { rootMargin: '-40% 0px -45% 0px' }); steps.forEach(s => so.observe(s));
    steps.forEach(s => s.addEventListener('click', () => set(+s.dataset.p)));
  })();

  /* ── pipeline: width for the travelling pulse ────────────────────────────────────── */
  const pipe = $('#pipe'); if (pipe) { const m = () => pipe.style.setProperty('--pw', pipe.clientWidth + 'px'); m(); addEventListener('resize', m); }

  /* ── showcase carousel + lightbox ────────────────────────────────────────────────── */
  (() => {
    const REL = 'https://github.com/msmahdinejad/cinewright/releases/download/v2.1.0/';
    const FILMS = [
      { img: 'avorythm-turn', mp4: 'avorythm-film.mp4', w: 'avorythm.mp4#t=7.4', t: ['Product film — the turn', 'فیلم محصول — نقطهٔ عطف'], d: ['30 s · Persian RTL · original score. A prism splits one white voice into four outputs.', '۳۰ ثانیه · فارسی راست‌به‌چپ · موسیقی اصلی. یک منشور یک صدا را به چهار خروجی می‌شکند.'], g: ['3D prism', 'kinetic type', 'synth score'] },
      { img: 'avorythm-burst', mp4: 'avorythm-film.mp4', w: 'avorythm.mp4#t=22.8', t: ['Particles become the logo', 'ذرات به لوگو تبدیل می‌شوند'], d: ['50 000 GPU points morph from world scripts into the mark — shock ring, camera punch, then 0.15 s of silence.', '۵۰هزار نقطهٔ GPU از خط‌های جهان به لوگو مورف می‌شوند — حلقهٔ شوک، پانچ دوربین، و ۰٫۱۵ ثانیه سکوت.'], g: ['particles', 'morph', 'sound design'] },
      { img: 'avorythm-glass', mp4: 'avorythm-film.mp4', w: 'avorythm.mp4#t=15.8', t: ['Frosted-glass subtitles', 'زیرنویس شیشهٔ مات'], d: ['A bilingual subtitle card dragged over a living background; santur plays the Persian line.', 'کارت زیرنویس دوزبانه روی پس‌زمینهٔ زنده؛ سنتور خط فارسی را می‌نوازد.'], g: ['UI glass', 'RTL', 'santur'] },
      { img: 'cinema', mp4: 'cinema-template.mp4', w: 'cinema.mp4', t: ['Cinema template', 'قالب سینمایی'], d: ['20 s dark trailer: particles → chrome 3D name → kinetic poster → night-city flight → burst.', 'تریلر ۲۰ ثانیه‌ای تیره: ذرات ← نام کروم سه‌بعدی ← پوستر جنبشی ← پرواز بر شهر شبانه ← انفجار.'], g: ['3D', 'city flight', 'bloom'] },
      { img: 'showreel', mp4: 'showreel-template.mp4', w: 'showreel.mp4', t: ['Showreel template', 'قالب شوریل'], d: ['17.5 s bright poster system: slam type, 3D plastic, girih pattern, liquid metal, tunnel.', '۱۷٫۵ ثانیه سیستم پوستر روشن: تایپ اسلم، پلاستیک سه‌بعدی، گره‌چینی، فلز مایع، تونل.'], g: ['poster', 'girih', 'liquid metal'] },
      { img: 'showreel-fa', mp4: 'showreel-template-fa.mp4', w: 'showreel-fa.mp4', t: ['Showreel — Persian', 'شوریل — فارسی'], d: ['The same template with Persian copy: shaped, right-to-left, word by word.', 'همان قالب با متن فارسی: شکل‌دهی‌شده، راست‌به‌چپ، کلمه‌به‌کلمه.'], g: ['Persian', 'RTL', 'Lalezar'] },
    ];
    const car = $('#car'), dlg = $('#dlg'), v = $('#dlg-v');
    const draw = () => { car.innerHTML = FILMS.map((f, i) => `<article class="film tilt" data-i="${i}"><div class="im"><img src="assets/anim/${f.img}.webp" alt="${esc(f.t[0])}" width="640" height="360" loading="lazy"><button class="pl" data-i="${i}" aria-label="${L('Play', 'پخش')} ${esc(f.t[0])}"><span><svg viewBox="0 0 24 24"><use href="#i-play"/></svg></span></button></div><div class="tx"><h3>${esc(L(f.t[0], f.t[1]))}</h3><p>${esc(L(f.d[0], f.d[1]))}</p><div class="tg">${f.g.map(x => `<span class="tag">${esc(x)}</span>`).join('')}<a class="tag v" href="${REL + f.mp4}">MP4</a></div></div></article>`).join(''); if (!coarse && !reduce && window.__tilt) $$('.film', car).forEach(el => window.__tilt(el, 3)); };
    draw(); document.addEventListener('langchange', draw);
    car.addEventListener('click', e => { const b = e.target.closest('.pl'); if (!b) return; const f = FILMS[+b.dataset.i]; $('#dlg-fb').innerHTML = `${L('720p preview · full quality: ', 'پیش‌نمایش ۷۲۰p · کیفیت کامل: ')}<a href="${REL + f.mp4}">${L('download the MP4', 'دانلود MP4')}</a>`; v.preload = 'metadata'; v.src = 'assets/video/' + f.w; v.onerror = () => { $('#dlg-fb').innerHTML = `${L('Could not play it here — ', 'اینجا پخش نشد — ')}<a href="${REL + f.mp4}">${L('download the MP4', 'دانلود MP4')}</a>`; }; dlg.showModal(); v.play().catch(() => {}); });
    const close = () => { v.pause(); v.removeAttribute('src'); v.load(); dlg.close(); }; $('#dlg-x').addEventListener('click', close); dlg.addEventListener('click', e => { if (e.target === dlg) close(); }); dlg.addEventListener('close', () => { v.pause(); });
    const step = () => car.clientWidth * .6; $('#prev').addEventListener('click', () => car.scrollBy({ left: isFa() ? step() : -step(), behavior: 'smooth' })); $('#next').addEventListener('click', () => car.scrollBy({ left: isFa() ? -step() : step(), behavior: 'smooth' }));
  })();

  /* ── Persian: karaoke captions (the atlas recipe type-karaoke-captions, in CSS) ──── */
  (() => {
    const box = $('#kar'), ws = $$('span', box), pill = $('.pillb', box); let i = -1, timer = 0;
    const place = k => { const w = ws[k]; if (!w) return; pill.style.cssText = `left:${w.offsetLeft - 8}px;top:${w.offsetTop - 2}px;width:${w.offsetWidth + 16}px;height:${w.offsetHeight + 4}px`; };
    const tick = () => { i++; if (i > ws.length + 2) { i = -1; ws.forEach(w => w.className = ''); pill.style.opacity = 0; return; } ws.forEach((w, k) => w.className = k < i ? 'done' : k === i ? 'act' : ''); if (i >= 0 && i < ws.length) { pill.style.opacity = 1; place(i); } };
    const so = new IntersectionObserver(es => { if (es[0].isIntersecting) { if (!timer && !reduce) timer = setInterval(tick, 520); if (reduce) ws.forEach(w => w.className = 'done'); } else { clearInterval(timer); timer = 0; } }, { threshold: .4 }); so.observe(box);
    addEventListener('resize', () => place(clamp(i, 0, ws.length - 1)));
  })();

  /* ── benchmark: bars from the committed results, optional before/after slider ──── */
  fetch('assets/benchmark/summary.json').then(r => r.json()).then(rows => {
    const tasks = [...new Set(rows.map(r => r.task))]; const host = $('#bm');
    const draw = () => { host.innerHTML = tasks.map(t => { const rs = rows.filter(r => r.task === t); return `<div class="card bm rv in"><h3>${esc(rs[0].taskTitle)}</h3><div class="dm">${esc(t)}</div>${rs.map(r => { const q = r.quietPct == null ? 0 : r.quietPct; const cls = q > 40 ? 'bad' : q < 15 ? 'good' : ''; return `<div class="bar"><div class="lb"><span>${esc(r.label)}${r.model ? ' · ' + esc(r.model) : ''}</span><b>${r.ok ? q + '%' : '✘'}</b></div><div class="tr"><div class="fl ${cls}" data-w="${q}"></div></div><small>${r.ok ? Math.round(r.length) + ' s · LRA ' + (r.lra ?? '–') + ' LU · ' : ''}${r.kind === 'run' ? L('measured by the runner', 'اندازه‌گیری رانر') : L('measured after the fact', 'اندازه‌گیری پس از ساخت')}</small></div>`; }).join('')}</div>`; }).join('');
      const bio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('.fl', e.target).forEach(f => { f.style.width = f.dataset.w + '%'; }); bio.unobserve(e.target); } }), { threshold: .3 }); $$('.bm', host).forEach(c => bio.observe(c)); };
    draw(); document.addEventListener('langchange', draw);
    const pair = tasks.map(t => ({ t, b: rows.find(r => r.task === t && r.kind === 'run' && r.condition === 'baseline' && r.preview), s: rows.find(r => r.task === t && r.kind === 'run' && r.condition !== 'baseline' && r.preview) })).find(p => p.b && p.s);
    if (pair) {
      const w = $('#cmpw'), top = $('#cmp-b'); $('#cmp-a').src = pair.b.preview; top.src = pair.s.preview; $('#cmp-t').textContent = pair.s.taskTitle; $('#cmp-l1').textContent = L('No skill', 'بدون اسکیل'); $('#cmp-l2').textContent = L('With Cinewright', 'با سینه‌رایت'); $('#cmp').classList.add('on');
      const setP = p => { top.style.clipPath = `inset(0 0 0 ${p}%)`; $('#cmp-h').style.left = p + '%'; }; let d = false; setP(50);
      const mv = e => { const r = w.getBoundingClientRect(); setP(clamp((e.clientX - r.left) / r.width * 100, 2, 98)); };
      w.addEventListener('pointerdown', e => { d = true; w.setPointerCapture(e.pointerId); mv(e); }); w.addEventListener('pointermove', e => { if (d) mv(e); }); w.addEventListener('pointerup', () => { d = false; });
      if (!reduce) { let p = 8, dir = 1, auto = true; const stop = () => { auto = false; }; w.addEventListener('pointerdown', stop); (function a() { if (!auto) return; p += dir * .35; if (p > 92 || p < 8) dir *= -1; setP(p); requestAnimationFrame(a); })(); }
    }
  }).catch(() => { $('#bm').innerHTML = '<div class="empty">Open docs/benchmark.md for the results.</div>'; });

  /* ── install tabs, prompt rotator ────────────────────────────────────────────────── */
  $('#itabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#itabs button').forEach(x => x.setAttribute('aria-selected', x === b)); $$('.panel').forEach(p => p.classList.toggle('on', p.id === b.dataset.p)); });
  if (!win) { const b = $('#itabs button[data-p=p2]'); b && b.click(); }
  (() => {
    const P = [
      '$cinewright make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it\'s your showreel for a résumé. Go all out.',
      '$cinewright Create a 6-second logo sting for "Northwind Labs", a fictional climate-data startup. Reveal it with real impact and give it sound design. Go all out.',
      '$cinewright یک تیزر ۲۰ ثانیه‌ای سینمایی با هویت ایرانی (نقش گیره‌چینی، نستعلیق، نور و غبار) برای یک رصدخانهٔ ستاره‌شناسی بساز؛ موسیقی با سنتور و نی و ریتم ۶/۸. Go all out.',
    ];
    const q = $('#pq'), dots = $('#pd'); let i = 0, run = 0, vis = false;
    dots.innerHTML = P.map((_, k) => `<button aria-label="Prompt ${k + 1}"></button>`).join('');
    async function cycle(my) { const k = i % P.length; $$('button', dots).forEach((b, n) => b.classList.toggle('on', n === k)); q.innerHTML = ''; const span = document.createElement('span'); q.appendChild(span); const txt = P[k]; if (/[؀-ۿ]/.test(txt)) q.style.direction = 'ltr'; for (let c = 0; c < txt.length; c++) { if (my !== run) return; span.innerHTML = esc(txt.slice(0, c + 1)).replace('$cinewright', '<span class="dl">$cinewright</span>'); await sleep(reduce ? 0 : 16); } await sleep(3600); if (my !== run) return; i++; cycle(my); }
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; i = $$('button', dots).indexOf(b); run++; cycle(run); });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) { run++; cycle(run); } else run++; }, { threshold: .3 }).observe(q);
  })();

  /* ── footer wordmark: letters swell near the pointer (variable font weight) ─────── */
  (() => {
    const bw = $('#bw'); bw.innerHTML = [...'Cinewright'].map(c => `<span>${c}</span>`).join(''); if (coarse || reduce) return; const sp = $$('span', bw);
    bw.addEventListener('pointermove', e => { sp.forEach(s => { const r = s.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), (e.clientY - (r.top + r.height / 2)) * .6); s.style.setProperty('--wg', Math.round(300 + 400 * Math.exp(-(d * d) / (2 * 170 * 170)))); }); });
    bw.addEventListener('pointerleave', () => sp.forEach(s => s.style.removeProperty('--wg')));
  })();
})();
