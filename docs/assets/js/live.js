/* Live engine demo. The page loads a real Cinewright film (docs/demo/<film>.html — the template's video.html next to the shared lib/) in an iframe and
   drives it by calling renderFrame(t): the film is a pure function of time, so scrubbing, rewinding and jumping are free. Audio is the template's own synthesised score. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const stage = $('#stage'); if (!stage) return;
  const poster = $('#poster'), start = $('#start'), pp = $('#pp'), snd = $('#snd'), track = $('#track'), tabs = $('#film-tabs'), section = $('#live');
  const head = track.querySelector('.head'), fill = track.querySelector('.fill');
  const ro = { t: $('#ro-t'), t2: $('#ro-t2'), f: $('#ro-f'), s: $('#ro-s') };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FILMS = { showreel: { poster: 'assets/anim/showreel.webp', strip: 'assets/img/strip-showreel.jpg' }, cinema: { poster: 'assets/anim/cinema.webp', strip: 'assets/img/strip-cinema.jpg' } };
  const FPS = 30;
  const canLive = (() => { try { const g = document.createElement('canvas').getContext('webgl2'); return !!(g && g.getExtension('EXT_color_buffer_float')); } catch { return false; } })();
  if (!canLive) { stage.classList.add('nolive'); start.hidden = true; pp.disabled = snd.disabled = true; pp.style.opacity = snd.style.opacity = .4; return; }

  let cur = 'showreel', meta = null, frameEl = null, win = null, ready = false, playing = false, t = 0, base = 0, t0 = 0, audio = null, sound = false, visible = false, loading = null, drag = false, started = false;
  const icon = (btn, id) => btn.querySelector('use').setAttribute('href', '#' + id);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  function markers() {
    track.querySelectorAll('.mk').forEach(n => n.remove());
    for (const m of meta.markers) { if (m.t <= 0.01 || m.t >= meta.duration) continue; const d = document.createElement('div'); d.className = 'mk'; d.dataset.l = m.label; d.style.left = (m.t / meta.duration * 100) + '%'; track.appendChild(d); }
  }
  async function load(name, resume) {
    cur = name; ready = false; stage.classList.remove('live'); poster.src = FILMS[name].poster; track.style.backgroundImage = `url(${FILMS[name].strip})`;
    if (audio) { audio.pause(); audio = null; }
    const token = loading = {};
    try {
      meta = await (await fetch(`demo/${name}.json`)).json(); markers();
      if (frameEl) frameEl.remove();
      frameEl = document.createElement('iframe'); frameEl.title = `Cinewright live engine — ${name}`; frameEl.setAttribute('aria-hidden', 'true'); frameEl.tabIndex = -1;
      const [w, h] = innerWidth > 1100 ? [1280, 720] : [960, 540];
      frameEl.src = `demo/${name}.html?w=${w}&h=${h}`; stage.insertBefore(frameEl, poster);
      await new Promise((res, rej) => { frameEl.addEventListener('load', res, { once: true }); frameEl.addEventListener('error', rej, { once: true }); });
      win = frameEl.contentWindow; await win.ready; if (token !== loading) return;
      ready = true; stage.classList.add('live'); seek(resume ?? (name === 'cinema' ? 4.2 : 3.2));
    } catch (e) { console.warn('live demo unavailable:', e); stage.classList.add('nolive'); }
  }
  function ensureAudio() { if (!audio) { audio = new Audio(`demo/${cur}.m4a`); audio.preload = 'auto'; audio.loop = false; } return audio; }
  function seek(x) {
    t = clamp(x, 0, meta.duration - 1 / FPS); base = t; t0 = performance.now();
    if (sound && audio) try { audio.currentTime = t; } catch { /* not ready */ }
    draw(t);
  }
  let lastScene = '';
  function draw(tt) {
    if (!ready) return;
    try { win.renderFrame(tt); } catch (e) { /* page not ready for this frame */ }
    const pct = tt / meta.duration * 100; head.style.left = pct + '%'; fill.style.width = pct + '%'; track.setAttribute('aria-valuenow', Math.round(pct));
    ro.t.textContent = tt.toFixed(2) + ' s'; ro.t2.textContent = tt.toFixed(2); ro.f.textContent = Math.round(tt * FPS);
    let sc = meta.markers[0]?.label || '—'; for (const m of meta.markers) if (m.t <= tt) sc = m.label; if (sc !== lastScene) { ro.s.textContent = sc; lastScene = sc; }
    let e = 0; for (const h of meta.hits) { const d = tt - h; if (d >= 0 && d < .5) e += Math.exp(-d / .09); } stage.classList.toggle('hit', e > .5);
  }
  function setPlaying(on) {
    if (on === playing) return; playing = on; base = t; t0 = performance.now(); icon(pp, on ? 'i-pause' : 'i-play');
    if (audio && sound) { if (on) { audio.currentTime = t; audio.play().catch(() => {}); } else audio.pause(); }
  }
  function setSound(on) {
    sound = on; icon(snd, on ? 'i-sound' : 'i-mute'); snd.setAttribute('aria-pressed', on);
    if (on) { ensureAudio(); if (playing) { audio.currentTime = t; audio.play().catch(() => { sound = false; icon(snd, 'i-mute'); }); } } else if (audio) audio.pause();
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if (!ready || !visible || document.hidden) return;
    if (playing && !drag) {
      t = sound && audio && !audio.paused && audio.readyState > 1 ? audio.currentTime : base + (now - t0) / 1000;
      if (t >= meta.duration - 1 / FPS) { t = 0; base = 0; t0 = now; if (audio && sound) { audio.currentTime = 0; audio.play().catch(() => {}); } }
      draw(t);
    }
  }
  requestAnimationFrame(loop);

  function begin() { if (started) { setPlaying(!playing); return; } started = true; load(cur).then(() => { if (ready) setPlaying(true); }); }
  start.addEventListener('click', () => { begin(); });
  pp.addEventListener('click', () => { if (!started) begin(); else setPlaying(!playing); });
  snd.addEventListener('click', () => { if (!started) { begin(); } setSound(!sound); });
  stage.addEventListener('click', e => { if (e.target === stage || e.target === frameEl || e.target === poster) { if (started) setPlaying(!playing); } });
  tabs.addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (!b || b.dataset.f === cur) return; tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b)); const was = playing; playing = false; icon(pp, 'i-play'); started = true; load(b.dataset.f).then(() => { if (ready && (was || true)) setPlaying(true); }); });

  const at = e => { const r = track.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1) * (meta ? meta.duration : 0); };
  track.addEventListener('pointerdown', e => { if (!started) { begin(); return; } if (!ready) return; drag = true; track.setPointerCapture(e.pointerId); seek(at(e)); });
  track.addEventListener('pointermove', e => { if (drag && ready) seek(at(e)); });
  const up = () => { if (drag) { drag = false; base = t; t0 = performance.now(); } };
  track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
  section.addEventListener('keydown', e => {
    if (!ready || /^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowLeft' && e.target === track) { e.preventDefault(); seek(t - (e.shiftKey ? .1 : 1)); }
    else if (e.key === 'ArrowRight' && e.target === track) { e.preventDefault(); seek(t + (e.shiftKey ? .1 : 1)); }
    else if (e.key === ' ' && (e.target === track || e.target === pp)) { e.preventDefault(); setPlaying(!playing); }
  });

  new IntersectionObserver(es => {
    const v = es[0].isIntersecting; visible = v;
    if (v && !started && !reduce) { started = true; load(cur).then(() => { if (ready) setPlaying(true); }); }       // first time in view: load and start (muted)
    if (!v && audio) audio.pause(); else if (v && playing && sound && audio) { audio.currentTime = t; audio.play().catch(() => {}); }
  }, { threshold: .25 }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden && audio) audio.pause(); else if (playing && sound && audio) { audio.currentTime = t; audio.play().catch(() => {}); } base = t; t0 = performance.now(); });
  window.__live = { seek: x => ready && seek(x), play: () => setPlaying(true), pause: () => setPlaying(false), get t() { return t; }, get ready() { return ready; } };
})();
