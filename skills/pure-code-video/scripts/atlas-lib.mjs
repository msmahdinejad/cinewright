// atlas-lib.mjs — shared loader/search for the technique atlas (used by atlas.mjs and inspire.mjs). Not copied into projects.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), ATLAS = path.join(SKILL, 'references', 'atlas');
const FIELD = /^(tags|use|how|avoid|pair|api|cost|persian|note|palette|fonts|motion|techniques|transitions|sound|look):\s*(.*)$/;

export function loadAtlas() {
  if (!fs.existsSync(ATLAS)) throw new Error(`no atlas folder at ${ATLAS}`);
  const entries = [], families = [];
  for (const f of fs.readdirSync(ATLAS).filter(f => f.endsWith('.md')).sort()) {
    const family = f.replace(/\.md$/, ''), txt = fs.readFileSync(path.join(ATLAS, f), 'utf8').replace(/\r\n/g, '\n'), parts = txt.split(/\n(?=## )/);
    const title = /^# (.+)/m.exec(parts[0])?.[1] || family; let n = 0;
    for (const p of parts.slice(1)) {
      const m = /^## ([\w-]+)\s+[—–-]\s+(.+)\n([\s\S]*)$/.exec(p); if (!m) continue;
      const e = { id: m[1], title: m[2].trim(), family, file: f, raw: ('## ' + p).trimEnd(), fields: {}, blocks: [] };
      const rest = m[3].replace(/```([^\n]*)\n([\s\S]*?)```/g, (all, info, code) => { e.blocks.push({ info: info.trim(), code: code.replace(/\n$/, '') }); return '\u0000'; });
      for (const line of rest.split('\n')) { const kv = FIELD.exec(line); if (kv) e.fields[kv[1]] = kv[2].trim(); }
      e.tags = (e.fields.tags || '').split(/[\s,]+/).filter(Boolean); entries.push(e); n++;
    }
    families.push({ family, title, count: n, file: f });
  }
  const seen = new Set(); for (const e of entries) { if (seen.has(e.id)) console.warn(`warning: duplicate atlas id "${e.id}"`); seen.add(e.id); }
  return { entries, families };
}

const SYN = { persian: ['farsi', 'rtl', 'arabic', 'iranian'], text: ['type', 'typography', 'word', 'title', 'letter'], title: ['type', 'text'], logo: ['brand', 'mark', 'sting'], intro: ['open', 'opening', 'hook'], outro: ['end', 'ending', 'closing'],
  shiny: ['chrome', 'metal', 'gold', 'glossy'], glass: ['refraction', 'transparent'], smoke: ['fog', 'cloud', 'nebula', 'mist'], fire: ['burn', 'ember', 'flame'], explode: ['burst', 'explosion', 'shatter'], cut: ['transition', 'edit'],
  glitch: ['digital', 'rgb', 'distortion'], neon: ['glow', 'cyber', 'synth'], city: ['skyline', 'building', 'night'], music: ['sound', 'beat', 'audio'], ui: ['app', 'interface', 'screen', 'product', 'dashboard'],
  data: ['chart', 'graph', 'number', 'counter'], dream: ['dreamy', 'surreal', 'ethereal'], camera: ['dolly', 'orbit', 'zoom', 'pan'], retro: ['vhs', 'crt', 'vintage', '80s'], translate: ['translation', 'language', 'dubbing'],
  showreel: ['portfolio', 'reel', 'resume', 'designer'], opensource: ['open', 'source', 'community'] };
export const norm = w => { w = w.toLowerCase().replace(/[^a-z0-9؀-ۿ-]/g, ''); return w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w; };

/** Rank entries for a free-text query. opts: { n, family (string|array), prefix (id prefix) } */
export function search(A, words, { n = 8, family, prefix } = {}) {
  const ws = (Array.isArray(words) ? words : [words]).flatMap(s => String(s).split(/[\s,]+/)).map(norm).filter(Boolean); if (!ws.length) return [];
  const exp = new Map(); for (const w of ws) { exp.set(w, 1); for (const [k, v] of Object.entries(SYN)) if (k === w || v.includes(w)) { exp.set(k, Math.max(exp.get(k) || 0, w === k ? 1 : .5)); v.forEach(x => exp.set(x, Math.max(exp.get(x) || 0, .5))); } }
  const fam = family ? [].concat(family) : null;
  return A.entries.filter(e => (!fam || fam.includes(e.family)) && (!prefix || e.id.startsWith(prefix))).map(e => {
    const hay = { id: e.id.replace(/-/g, ' '), title: e.title.toLowerCase(), tags: e.tags.join(' ').toLowerCase(), use: (e.fields.use || '').toLowerCase(), how: (e.fields.how || '').toLowerCase(), body: e.raw.toLowerCase() }; let s = 0;
    for (const [w, wt] of exp) { if (hay.id.includes(w)) s += 6 * wt; if (hay.title.includes(w)) s += 4 * wt; if (hay.tags.split(' ').some(t => t === w || t.startsWith(w))) s += 5 * wt; if (hay.use.includes(w)) s += 2.5 * wt; if (hay.how.includes(w)) s += 1.5 * wt; if (hay.body.includes(w)) s += .6 * wt; }
    return { e, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.e);
}
