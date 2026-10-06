#!/usr/bin/env node
// qc.mjs — verify what you cannot see or hear. Zero dependencies (Node >= 18 + ffmpeg/ffprobe).
//
//   node tools/qc.mjs check [file.mp4]          the final gate: video + audio checks, prints PASS/WARN/FAIL and what to fix
//   node tools/qc.mjs video [file.mp4]          ffprobe facts, decode test, black/frozen segments, hard cuts, photosensitive flash rate
//   node tools/qc.mjs audio [file.wav|mp4]      loudness (LUFS/LRA/true peak), clipping, silence, spectrogram.png, band balance table, energy curve
//   node tools/qc.mjs sheet [file.mp4] [--count 24] [--cols 6]   contact sheet cut from the ENCODED file (proves fonts/colours survived encoding)
//   node tools/qc.mjs energy [file.mp4]         motion/pacing curve: how much of the picture changes per ½ s, static holds, cut rate (the anti-slideshow check)
//   node tools/qc.mjs frames file.mp4 3.5,12     full-size PNG stills from the encoded file → qc/
//   node tools/qc.mjs palette image.png [--n 6]  dominant colours (hex) + luminance, to match a brand/reference photo
//   node tools/qc.mjs craft                      studio-mode gate on the PROJECT (not the mp4): brief.md complete? >= 6 atlas techniques from >= 4 families? >= 4 transitions? deterministic code? 3 review rounds? (also part of `check`)
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpBase } from './chrome.mjs';

const args = process.argv.slice(2), cmd = args[0] && !args[0].startsWith('--') ? args.shift() : 'check';
const flag = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && ['count', 'cols', 'n', 'out', 'tile'].includes(args[i - 1].slice(2))));
const FFMPEG = process.env.FFMPEG || 'ffmpeg', FFPROBE = process.env.FFPROBE || 'ffprobe';
const ROOT = process.cwd();
const results = [];
const note = (level, msg) => { results.push([level, msg]); console.log(`${{ PASS: '✔ PASS', WARN: '! WARN', FAIL: '✘ FAIL', INFO: '  info' }[level]}  ${msg}`); };

const run = (bin, a, o = {}) => spawnSync(bin, a, { encoding: 'utf8', maxBuffer: 1 << 28, ...o });
if (run(FFMPEG, ['-version']).status !== 0) { console.error('ffmpeg not found on PATH'); process.exit(1); }
const findDefault = ext => { for (const d of ['out', '.']) { try { const f = fs.readdirSync(path.join(ROOT, d)).filter(n => ext.some(e => n.endsWith(e)) && !n.includes('_partial')).map(n => path.join(ROOT, d, n)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs); if (f.length) return f[0]; } catch { /* dir missing */ } } return null; };
const inputFile = ext => { const f = positional[0] ? path.resolve(positional[0]) : findDefault(ext); if (!f || !fs.existsSync(f)) { console.error(`no input file found. Pass one: node tools/qc.mjs ${cmd} out/video.mp4`); process.exit(1); } return f; };
const probe = f => JSON.parse(run(FFPROBE, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', f]).stdout || '{}');
const tmp = fs.mkdtempSync(path.join(tmpBase(path.join(process.cwd(), 'qc', '.tmp')), 'pcv-qc-')); process.on('exit', () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* ignore */ } });

/* ───────────────────────── video ───────────────────────── */
function qcVideo(file) {
  console.log(`\n── video: ${file}`);
  const P = probe(file), v = P.streams?.find(s => s.codec_type === 'video'), a = P.streams?.find(s => s.codec_type === 'audio'), dur = +P.format?.duration || 0;
  if (!v) { note('FAIL', 'no video stream'); return; }
  const [fn, fd] = (v.r_frame_rate || '30/1').split('/').map(Number), fps = fn / fd;
  note('INFO', `${v.codec_name} ${v.width}×${v.height} @ ${fps.toFixed(3)} fps · ${dur.toFixed(2)} s · ${v.pix_fmt} · ${(+P.format.size / 1e6).toFixed(1)} MB · ${(+P.format.bit_rate / 1e6).toFixed(1)} Mb/s`);
  if (v.width % 2 || v.height % 2) note('FAIL', 'odd frame size — many players and platforms reject it');
  v.pix_fmt === 'yuv420p' ? note('PASS', 'pixel format yuv420p (plays everywhere)') : note('WARN', `pixel format ${v.pix_fmt} — social platforms and phones expect yuv420p`);
  v.color_space === 'bt709' ? note('PASS', 'colour tagged BT.709') : note('WARN', `colour space tag is "${v.color_space || 'none'}" — untagged HD video can render with shifted colours; render with tools/render.mjs`);
  if (fs.statSync(file).size < 30000) note('FAIL', 'file is tiny — the render probably failed silently');
  // moov atom before mdat (fast start)
  const head = fs.readFileSync(file).subarray(0, 65536), moov = head.indexOf('moov'), mdat = head.indexOf('mdat');
  if (file.endsWith('.mp4') || file.endsWith('.mov')) (moov >= 0 && (mdat < 0 || moov < mdat)) ? note('PASS', 'faststart (moov before mdat): plays while downloading') : note('WARN', 'moov atom is at the end — add -movflags +faststart');
  // frame count / timing regularity
  const fr = run(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file]).stdout.trim().replace(/,/g, '');
  const expect = Math.round(dur * fps), got = +fr; Math.abs(got - expect) <= 1 ? note('PASS', `${got} frames (${dur.toFixed(2)} s × ${fps.toFixed(2)} fps)`) : note('FAIL', `frame count ${got}, expected ≈ ${expect} — dropped or duplicated frames`);
  // decode test
  const dec = run(FFMPEG, ['-v', 'error', '-i', file, '-f', 'null', '-']); dec.stderr.trim() ? note('FAIL', 'decode errors: ' + dec.stderr.trim().split('\n')[0]) : note('PASS', 'decodes cleanly end to end');
  // audio presence
  if (a) { note('INFO', `audio ${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch`); Math.abs(+a.duration - dur) < .15 ? note('PASS', 'audio and video lengths match') : note('WARN', `audio ${(+a.duration).toFixed(2)} s vs video ${dur.toFixed(2)} s`); } else note('WARN', 'no audio track');
  // black / freeze / cuts
  const det = run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-an', '-vf', 'blackdetect=d=0.25:pix_th=0.06,freezedetect=n=0.0008:d=1.2', '-f', 'null', '-']).stderr;
  const blacks = [...det.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m => [+m[1], +m[2]]);
  const frz = [...det.matchAll(/freeze_start: ([\d.]+)/g)].map(m => +m[1]), frzEnd = [...det.matchAll(/freeze_end: ([\d.]+)/g)].map(m => +m[1]);
  const midBlack = blacks.filter(([s, e]) => s > .5 && e < dur - .5); midBlack.length ? note('WARN', `black frames in the middle: ${midBlack.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join(', ')} (intentional?)`) : note('PASS', 'no unintended black gaps');
  const frozen = frz.map((s, i) => [s, frzEnd[i] ?? dur]).filter(([s, e]) => e - s >= 1.2); frozen.length ? note('WARN', `motionless for ≥1.2 s at: ${frozen.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join(', ')} — hold frames look dead; add drift/breathing/particles`) : note('PASS', 'no frozen stretches ≥1.2 s');
  // metadata files are written relative to a temp cwd: absolute Windows paths (C:\…) need painful double escaping inside filtergraphs
  run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-an', '-vf', "select='gt(scene,0.32)',metadata=print:file=scenes.txt", '-f', 'null', '-'], { cwd: tmp });
  let cuts = []; try { cuts = [...fs.readFileSync(path.join(tmp, 'scenes.txt'), 'utf8').matchAll(/pts_time:([\d.]+)/g)].map(m => +m[1]); } catch { /* none */ }
  note('INFO', cuts.length ? `hard cuts / big jumps at: ${cuts.slice(0, 24).map(t => t.toFixed(2)).join(', ')} s${cuts.length > 24 ? ' …' : ''}` : 'no hard cuts detected (continuous motion)');
  // photosensitive flashes: mean luma per frame
  const ys = path.join(tmp, 'y.txt');
  run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-an', '-vf', 'scale=160:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=y.txt', '-f', 'null', '-'], { cwd: tmp });
  try {
    const Y = [...fs.readFileSync(ys, 'utf8').matchAll(/YAVG=([\d.]+)/g)].map(m => (+m[1] - 16) / 219);
    let flashes = [], last = 0, dir = 0, worst = 0, worstT = 0;
    for (let i = 1; i < Y.length; i++) { const d = Y[i] - Y[i - 1]; if (Math.abs(d) >= .1 && Math.max(Y[i], Y[i - 1]) > .15) { const s = Math.sign(d); if (s !== dir) { flashes.push(i / fps); dir = s; } } if (Math.abs(d) > worst) { worst = Math.abs(d); worstT = i / fps; } }
    let maxPerSec = 0, at = 0; for (let i = 0; i < flashes.length; i++) { const n = flashes.filter(t => t >= flashes[i] && t < flashes[i] + 1).length; if (n > maxPerSec) { maxPerSec = n; at = flashes[i]; } }
    const pairs = maxPerSec / 2;
    pairs > 3 ? note('WARN', `flash rate ≈ ${pairs.toFixed(1)}/s near ${at.toFixed(1)}s (guideline: ≤ 3/s) — strobing can trigger photosensitive epilepsy; soften the flashes or lower their area/contrast`) : note('PASS', `flash rate OK (max ${pairs.toFixed(1)}/s; biggest brightness jump ${(worst * 100).toFixed(0)}% at ${worstT.toFixed(2)}s)`);
    const mean = Y.reduce((a, b) => a + b, 0) / Y.length; mean < .03 ? note('WARN', `very dark overall (mean luma ${(mean * 100).toFixed(1)}%) — check contrast on phone screens`) : mean > .9 ? note('WARN', `very bright overall (${(mean * 100).toFixed(0)}%)`) : note('INFO', `mean luma ${(mean * 100).toFixed(0)}%`);
  } catch { note('INFO', 'flash analysis skipped'); }
}

/* ───────────────────────── audio ───────────────────────── */
function decodeMono(file, sr = 32000) { const r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 }); if (r.status !== 0) return null; const b = r.stdout; return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)); }
function biq(type, f, Q, sr) { const w = 2 * Math.PI * f / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al; const [b0, b1, b2] = type === 'lp' ? [(1 - c) / 2, 1 - c, (1 - c) / 2] : [(1 + c) / 2, -(1 + c), (1 + c) / 2]; let x1 = 0, x2 = 0, y1 = 0, y2 = 0; return x => { const y = (b0 * x + b1 * x1 + b2 * x2 - (-2 * c) * y1 - (1 - al) * y2) / a0; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; }
function qcAudio(file) {
  console.log(`\n── audio: ${file}`);
  const P = probe(file), a = P.streams?.find(s => s.codec_type === 'audio'); if (!a) { note('FAIL', 'no audio stream'); return; }
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true,astats=metadata=1:measure_perchannel=Peak_level+RMS_level+DC_offset:measure_overall=Peak_level+RMS_level+DC_offset', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr;
  const sum = r.slice(r.lastIndexOf('Summary:')), I = +(/I:\s+(-?[\d.]+) LUFS/.exec(sum)?.[1] ?? NaN), LRA = +(/LRA:\s+([\d.]+) LU/.exec(sum)?.[1] ?? NaN), TP = +(/Peak:\s+(-?[\d.]+) dBFS/.exec(sum)?.[1] ?? NaN);
  note('INFO', `${a.codec_name} ${a.sample_rate} Hz ${a.channels} ch · ${(+a.duration || +P.format.duration).toFixed(2)} s`);
  isNaN(I) ? note('WARN', 'could not measure loudness') : (Math.abs(I + 14) <= 2 ? note('PASS', `integrated loudness ${I} LUFS (social target ≈ −14)`) : I > -10 ? note('WARN', `integrated loudness ${I} LUFS is very loud — platforms will turn it down; target −14`) : I < -20 ? note('WARN', `integrated loudness ${I} LUFS is quiet — raise the master (target −14)`) : note('INFO', `integrated loudness ${I} LUFS (target −14 for social, −16 for speech-led)`));
  !isNaN(TP) && (TP > -0.5 ? note('WARN', `true peak ${TP} dBFS — can clip after lossy encoding; keep ≤ −1`) : note('PASS', `true peak ${TP} dBFS (headroom OK)`));
  !isNaN(LRA) && note('INFO', `loudness range ${LRA} LU${LRA < 2 ? ' — very flat; add dynamics (quiet intro, louder climax)' : ''}`);
  const dc = [...r.matchAll(/DC offset: (-?[\d.e-]+)/g)].map(m => Math.abs(+m[1])); dc.length && Math.max(...dc) > .005 && note('WARN', `DC offset ${Math.max(...dc).toFixed(4)} — add a high-pass at 20–30 Hz`);
  // silence at edges + gaps
  const sil = spawnSync(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'silencedetect=n=-55dB:d=0.35', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const ss = [...sil.matchAll(/silence_start: ([\d.]+)/g)].map(m => +m[1]), se = [...sil.matchAll(/silence_end: ([\d.]+)/g)].map(m => +m[1]), dur = +P.format.duration;
  const gaps = ss.map((s, i) => [s, se[i] ?? dur]).filter(([s, e]) => s > .6 && e < dur - .6); gaps.length ? note('WARN', `silent gaps: ${gaps.map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join(', ')} (intentional?)`) : note('PASS', 'no unintended silent gaps');
  // spectrogram + waveform images
  fs.mkdirSync(path.join(ROOT, 'qc'), { recursive: true });
  spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', file, '-vn', '-lavfi', 'showspectrumpic=s=1600x640:legend=1:scale=log:fscale=log:color=intensity:start=30:stop=18000', path.join(ROOT, 'qc', 'spectrogram.png')]);
  spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', file, '-vn', '-lavfi', 'showwavespic=s=1600x260:split_channels=1:colors=0x5cf4f4|0xa48bff', path.join(ROOT, 'qc', 'waveform.png')]);
  note('INFO', 'images: qc/spectrogram.png (look for a hole at 2–6 kHz = dull, a wall below 250 Hz = muddy) · qc/waveform.png (flat blob = over-compressed)');
  // band balance + energy curve
  const sr = 32000, x = decodeMono(file, sr); if (!x || !x.length) return;
  const bands = [['sub<60', 0, 60], ['low 60-250', 60, 250], ['lowmid 250-800', 250, 800], ['mid .8-2.5k', 800, 2500], ['pres 2.5-6k', 2500, 6000], ['air 6k+', 6000, 0]];
  const hop = sr, frames = Math.floor(x.length / hop), rmsDb = z => 10 * Math.log10(z + 1e-12), rows = [];
  const bandDb = bands.map(([, lo, hi]) => { const f = []; let hp1 = lo ? biq('hp', lo, .707, sr) : null, hp2 = lo ? biq('hp', lo, .707, sr) : null, lp1 = hi ? biq('lp', hi, .707, sr) : null, lp2 = hi ? biq('lp', hi, .707, sr) : null;
    for (let k = 0; k < frames; k++) { let s = 0; for (let i = k * hop; i < (k + 1) * hop; i++) { let y = x[i]; if (hp1) y = hp2(hp1(y)); if (lp1) y = lp2(lp1(y)); s += y * y; } f.push(rmsDb(s / hop)); } return f; });
  const total = []; for (let k = 0; k < frames; k++) { let s = 0; for (let i = k * hop; i < (k + 1) * hop; i++) s += x[i] * x[i]; total.push(rmsDb(s / hop)); }
  const avg = (arr, a, b) => rmsDb(arr.slice(a, b).reduce((s, v) => s + 10 ** (v / 10), 0) / Math.max(1, b - a));
  const seg = Math.max(1, Math.ceil(frames / 8));
  console.log('\n  section     loud   ' + bands.map(b => b[0].split(' ')[0].padStart(7)).join(''));
  for (let a0 = 0; a0 < frames; a0 += seg) { const b0 = Math.min(frames, a0 + seg), L = avg(total, a0, b0); console.log(`  ${String(a0).padStart(3)}–${String(b0).padStart(3)}s ${L.toFixed(1).padStart(6)}  ` + bandDb.map(bd => (avg(bd, a0, b0) - L).toFixed(1).padStart(7)).join('')); }
  const all = bandDb.map(bd => avg(bd, 0, frames) - avg(total, 0, frames));
  all[1] > -3 && all[4] < -22 ? note('WARN', `muddy: lows dominate (60–250 Hz ${all[1].toFixed(0)} dB) while presence (2.5–6 kHz) is ${all[4].toFixed(0)} dB below the mix — brighten filters, cut bass/pad low end`) : all[4] < -32 ? note('WARN', 'dull: almost no energy at 2.5–6 kHz') : all[0] > -6 ? note('WARN', `sub-bass is strong (${all[0].toFixed(0)} dB re total) — phone speakers will not play it and it eats headroom`) : note('PASS', 'band balance looks reasonable');
  const bars = '▁▂▃▄▅▆▇█', mx = Math.max(...total), mn = Math.max(-60, Math.min(...total)); console.log('\n  energy curve (1 char = 1 s):  ' + total.map(v => bars[Math.max(0, Math.min(7, Math.round((v - mn) / Math.max(1, mx - mn) * 7)))]).join(''));
}

/* ───────────────────────── sheets, frames, palette ───────────────────────── */
function fontFile() { return [process.env.SystemRoot && path.join(process.env.SystemRoot, 'Fonts/arial.ttf'), '/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Helvetica.ttc', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'].filter(Boolean).find(f => fs.existsSync(f)); }
function qcSheet(file) {
  const P = probe(file), dur = +P.format.duration, v = P.streams.find(s => s.codec_type === 'video'), n = +flag('count', 24), portrait = v.height > v.width, cols = +flag('cols', portrait ? 6 : 4), rows = Math.ceil(n / cols);
  const out = path.resolve(String(flag('out', 'qc/sheet_mp4.png'))); fs.mkdirSync(path.dirname(out), { recursive: true });
  const times = Array.from({ length: n }, (_, i) => +((i + .5) / n * dur).toFixed(3)), tile = Math.round(2000 / cols), ff = fontFile();
  // the label font is copied next to the frames and referenced relatively — absolute Windows paths (C:\...) break ffmpeg filter escaping
  let font = false; if (ff) { try { fs.copyFileSync(ff, path.join(tmp, 'font.ttf')); font = true; } catch { /* no label */ } }
  const files = times.map((t, i) => {
    const name = `s${String(i).padStart(3, '0')}.png`, base = ['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1'];
    const lab = `scale=${tile}:-2,drawtext=fontfile=font.ttf:text='${t.toFixed(1)}s':x=8:y=6:fontsize=${Math.round(tile / 16)}:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=4`;
    let r = font ? spawnSync(FFMPEG, [...base, '-vf', lab, name], { cwd: tmp }) : { status: 1 };
    if (r.status !== 0) spawnSync(FFMPEG, [...base, '-vf', `scale=${tile}:-2`, name], { cwd: tmp });
    return name;
  });
  fs.writeFileSync(path.join(tmp, 'list.txt'), files.map(f => `file '${f}'`).join('\n'));
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-vf', `tile=${cols}x${rows}:padding=4:margin=4:color=0x101014`, '-frames:v', '1', '-update', '1', out], { cwd: tmp });
  r.status === 0 ? console.log(`✔ ${out}\n  frames at: ${times.join(', ')} s  (row-major)`) : console.error(String(r.stderr));
}
function qcFrames(file, list) { fs.mkdirSync(path.join(ROOT, 'qc'), { recursive: true }); for (const t of String(list).split(',')) { const o = path.join(ROOT, 'qc', `enc_${(+t).toFixed(2)}.png`); spawnSync(FFMPEG, ['-v', 'error', '-y', '-ss', t, '-i', file, '-frames:v', '1', o]); console.log('✔ ' + o); } }
function qcPalette(file) {
  const n = +flag('n', 6), r = spawnSync(FFMPEG, ['-v', 'error', '-i', file, '-vf', 'scale=80:80:flags=area,format=rgb24', '-frames:v', '1', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 24 });
  if (r.status !== 0) { console.error(String(r.stderr)); process.exit(1); }
  const px = []; for (let i = 0; i + 2 < r.stdout.length; i += 3) px.push([r.stdout[i], r.stdout[i + 1], r.stdout[i + 2]]);
  // k-means (deterministic init from luminance-sorted quantiles)
  const lum = p => .2126 * p[0] + .7152 * p[1] + .0722 * p[2], sorted = [...px].sort((a, b) => lum(a) - lum(b)); let C = Array.from({ length: n }, (_, i) => [...sorted[Math.floor((i + .5) / n * sorted.length)]]);
  for (let it = 0; it < 20; it++) { const S = C.map(() => [0, 0, 0, 0]); for (const p of px) { let b = 0, bd = 1e9; C.forEach((c, i) => { const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2; if (d < bd) { bd = d; b = i; } }); S[b][0] += p[0]; S[b][1] += p[1]; S[b][2] += p[2]; S[b][3]++; } C = C.map((c, i) => S[i][3] ? [S[i][0] / S[i][3], S[i][1] / S[i][3], S[i][2] / S[i][3], S[i][3]] : c); }
  const tot = px.length, hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  console.log(`palette of ${file} (share · hex · luminance · saturation):`);
  C.map(c => ({ c, share: (c[3] || 0) / tot })).sort((a, b) => b.share - a.share).forEach(({ c, share }) => { const mx = Math.max(...c.slice(0, 3)), mnv = Math.min(...c.slice(0, 3)); console.log(`  ${(share * 100).toFixed(0).padStart(3)}%  ${hex(c)}  L=${(lum(c) / 255).toFixed(2)}  S=${(mx ? (mx - mnv) / mx : 0).toFixed(2)}`); });
  console.log(`  mean luminance ${(px.reduce((s, p) => s + lum(p), 0) / tot / 255).toFixed(2)}`);
}

/* ───────────────────────── motion / pacing ───────────────────────── */
/** Mean absolute difference between consecutive frames (15 fps, 192 px wide) → 0…1. Dark cinematic pieces read low by nature; what matters is the SHAPE of the curve and long flat stretches. */
function qcEnergy(file) {
  console.log(`
── motion energy: ${file}`);
  run(FFMPEG, ['-hide_banner', '-nostats', '-i', file, '-an', '-vf', 'fps=15,scale=192:-2,format=yuv420p,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=e.txt', '-f', 'null', '-'], { cwd: tmp });
  let E = []; try { E = [...fs.readFileSync(path.join(tmp, 'e.txt'), 'utf8').matchAll(/YAVG=([\d.]+)/g)].map(m => +m[1] / 219); } catch { /* none */ }
  if (E.length < 10) { note('INFO', 'not enough frames for an energy analysis'); return; }
  const dt = 1 / 15, win = Math.round(.5 / dt), W = []; for (let i = 0; i + win <= E.length; i += win) W.push(E.slice(i, i + win).reduce((a, b) => a + b, 0) / win);
  const sorted = [...W].sort((a, b) => a - b), med = sorted[Math.floor(W.length / 2)], mean = E.reduce((a, b) => a + b, 0) / E.length, QUIET = .003;
  const runs = []; let st = -1; W.forEach((x, i) => { if (x < QUIET) { if (st < 0) st = i; } else if (st >= 0) { runs.push([st * .5, i * .5]); st = -1; } }); if (st >= 0) runs.push([st * .5, W.length * .5]);
  const longRuns = runs.filter(([a, b]) => b - a >= 1.5), quietPct = W.filter(x => x < QUIET).length / W.length;
  const spikes = []; for (let i = 1; i < E.length; i++) if (E[i] > .12 && E[i] > 3 * E[i - 1] + .02) spikes.push(i * dt); const cuts = spikes.filter((t, i) => !i || t - spikes[i - 1] > .3);
  note('INFO', `½-second energy (▁ calm … █ busy, each char = 0.5 s; a typical busy cinematic piece peaks at 0.05+):`);
  console.log('  ' + W.map(x => '▁▂▃▄▅▆▇█'[Math.min(7, Math.floor(x / .04 * 8))]).join(''));
  note('INFO', `median ${med.toFixed(4)} · mean ${mean.toFixed(4)} · quiet ${(quietPct * 100).toFixed(0)}% of the time · ${cuts.length} hard cut(s)/flash(es)${cuts.length ? ' at ' + cuts.slice(0, 12).map(t => t.toFixed(1)).join(', ') + ' s' : ''}`);
  longRuns.length ? note('WARN', `almost nothing changes for ≥ 1.5 s at: ${longRuns.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)}s`).join(', ')} — static holds read as slides; add camera drift, secondary motion, particles, light sweeps or cut sooner (intentional slow reveals are fine: say so)`) : note('PASS', 'no static holds ≥ 1.5 s');
  quietPct > .45 ? note('WARN', `${(quietPct * 100).toFixed(0)}% of the film is near-static — compare with references/gallery: stronger pieces keep ≥ 3 things moving at different speeds in every shot`) : note('PASS', 'pacing: enough of the film is in motion');
}

/* ───────────────────────── craft (studio mode): did the plan, the code and the process meet the ambition budget? ───────────────────────── */
async function qcCraft() {
  console.log('\n── craft (studio mode: plan · code · process)');
  const rd = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { return null; } };
  const brief = rd('brief.md'), html = rd('video.html') || rd('index.html'), audio = rd('audio.mjs');
  if (!brief && !html) { note('INFO', 'no brief.md / video.html in this folder — craft checks skipped (run them from the project folder)'); return; }
  // the atlas is optional: scaffold bakes the skill path into tools/atlas.mjs; without it only id-shaped words are counted
  let A = null;
  try { const fwd = rd('tools/atlas.mjs'), m = fwd && /const real = ("(?:[^"\\]|\\.)*")/.exec(fwd); if (m) { const lib = path.join(path.dirname(JSON.parse(m[1])), 'atlas-lib.mjs'); if (fs.existsSync(lib)) A = (await import(pathToFileURL(lib).href)).loadAtlas(); } } catch { /* atlas unavailable */ }
  // ── plan
  if (!brief) note('WARN', 'no brief.md — write it BEFORE building: one-sentence promise, visual verb, hero moment, last image, style bible (5 hex), shot list with atlas technique ids (protocol.md §1)');
  else {
    if (brief.length < 500) note('WARN', `brief.md is only ${brief.length} characters — a real brief names the concept, the style bible and a shot list`);
    const missing = [['promise', /promise|وعده/i], ['visual verb', /verb|فعل/i], ['hero moment', /hero|اوج/i], ['last image', /last image|final image|ending|تصویر آخر|پایان/i], ['shot list', /shot ?list|storyboard|شات|استوری/i]].filter(([, re]) => !re.test(brief)).map(([n]) => n);
    missing.length >= 2 ? note('WARN', `brief.md does not mention: ${missing.join(', ')} (see the step-1 checklist in SKILL.md)`) : note('PASS', 'brief.md covers the concept checklist');
    const hex = new Set((brief.match(/#[0-9a-f]{6}\b/gi) || []).map(x => x.toLowerCase()));
    hex.size >= 4 ? note('PASS', `style bible has a palette (${hex.size} colours)`) : note('WARN', `brief.md lists ${hex.size} hex colours — write the 5-token palette (bg · base · accent · accent2 · light)`);
    const tokens = [...new Set([...brief.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g)].map(m => m[1]))];
    if (A) {
      const byId = new Map(A.entries.map(e => [e.id, e])), ids = tokens.filter(t => byId.has(t)), fam = new Set(ids.map(t => byId.get(t).family)), unknown = tokens.filter(t => !byId.has(t));
      ids.length >= 6 && fam.size >= 4 ? note('PASS', `brief.md cites ${ids.length} atlas techniques from ${fam.size} families (${[...fam].join(', ')})`) : note('WARN', `brief.md cites ${ids.length} atlas technique(s) from ${fam.size} family/families — the budget is ≥ 6 from ≥ 4. Browse: node tools/atlas.mjs search <topic> · list <family>; name each technique you use by its id in the shot list`);
      if (unknown.length) note('INFO', `not atlas ids (fine if they are your own names): ${unknown.slice(0, 8).join(', ')}`);
    } else tokens.length >= 6 ? note('PASS', `brief.md names ${tokens.length} techniques (atlas not reachable from here, ids not validated)`) : note('WARN', `brief.md names ${tokens.length} id-shaped techniques — the budget is ≥ 6 from ≥ 4 families`);
  }
  // ── code
  if (html) {
    const code = html.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1'), lines = code.split('\n');
    const bad = []; lines.forEach((l, i) => { const m = /\b(Math\.random|Date\.now|performance\.now|new Date|requestAnimationFrame|setTimeout|setInterval)\b/.exec(l); if (m) bad.push(`${i + 1}: ${m[1]}`); });
    bad.length ? note('FAIL', `video.html uses non-deterministic APIs (frames would differ between runs) at line ${bad.slice(0, 5).join(', ')} — use K.hash / K.rng / K.noise and closed-form motion`) : note('PASS', 'video.html has no Math.random / Date.now / timers (frames are reproducible)');
    const trans = new Set([...code.matchAll(/enter:\s*\[\s*['"](\w+)['"]/g)].map(m => m[1])), nScenes = (code.match(/\bat:\s*T\.\w+/g) || []).length;
    if (nScenes >= 4 || trans.size) trans.size >= 4 ? note('PASS', `${trans.size} different transitions: ${[...trans].join(', ')}`) : note('WARN', `${trans.size} different transition(s)${trans.size ? ' (' + [...trans].join(', ') + ')' : ''} — vary them (≥ 4: whip, zoomBlurCut, glitch, iris, liquid, burn … see gallery/transitions.jpg); match cuts beat generic fades`);
    if (/K\.FONTS|font[:=]/.test(code) && !/loadFonts\s*\(/.test(code)) note('WARN', 'video.html draws text but never calls K.loadFonts([...]) — it will render in a fallback font');
    if (brief && /persian|farsi|فارسی|rtl/i.test(brief) && !/[؀-ۿ]/.test(code) && !/[؀-ۿ]/.test(audio || '')) note('WARN', 'the brief mentions Persian/RTL but video.html contains no Persian text — is the text in another file, or missing?');
  }
  if (audio && !/cues/.test(audio)) note('WARN', 'audio.mjs does not read the shared <script id="cues"> — picture and sound will drift apart when you retime');
  // ── process
  let reviews = []; try { reviews = fs.readdirSync(path.join(ROOT, 'qc')).filter(n => /^review-\d+\.md$/i.test(n)); } catch { /* no qc dir */ }
  reviews.length >= 3 ? note('PASS', `${reviews.length} written review rounds (qc/review-*.md)`) : note('WARN', `${reviews.length} review round(s) in qc/ — studio mode asks for three (A motion · B craft · C sound), each a written fix list after LOOKING at frames; a first render is a skeleton, not a film`);
}

/* ───────────────────────── dispatch ───────────────────────── */
if (cmd === 'video') qcVideo(inputFile(['.mp4', '.mov', '.webm', '.mkv']));
else if (cmd === 'audio') qcAudio(inputFile(['.wav', '.mp4', '.mov', '.mp3', '.m4a']));
else if (cmd === 'sheet') qcSheet(inputFile(['.mp4', '.mov', '.webm']));
else if (cmd === 'energy') qcEnergy(inputFile(['.mp4', '.mov', '.webm', '.mkv']));
else if (cmd === 'frames') qcFrames(path.resolve(positional[0]), positional[1] || '1');
else if (cmd === 'palette') qcPalette(path.resolve(positional[0]));
else if (cmd === 'craft') await qcCraft();
else if (cmd === 'check') { const f = inputFile(['.mp4', '.mov', '.webm', '.mkv']); qcVideo(f); qcEnergy(f); qcAudio(f); await qcCraft(); }
else { console.error('unknown command. try: check | craft | video | audio | energy | sheet | frames | palette'); process.exit(1); }
if (cmd === 'check' || cmd === 'craft' || cmd === 'video' || cmd === 'audio' || cmd === 'energy') {
  const f = results.filter(r => r[0] === 'FAIL').length, w = results.filter(r => r[0] === 'WARN').length;
  console.log(`\n${f ? '✘' : w ? '!' : '✔'} ${f} failure(s), ${w} warning(s).${f || w ? ' Fix or consciously accept each, then re-run.' : ' Ship it.'}`); process.exit(f ? 2 : 0);
}
