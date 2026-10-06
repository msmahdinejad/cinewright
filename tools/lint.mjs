#!/usr/bin/env node
// lint.mjs — repository checks that need no browser: run by CI on every push (`npm test`).
//   · SKILL.md frontmatter valid (name = folder, description ≤ 1024 chars)
//   · every script parses (node --check); templates never call Math.random / Date.now
//   · atlas: unique ids, every entry has title + `use:`, code fences are of a known kind
//   · relative links in every Markdown file resolve
//   · numbers in the docs (entries, families) match the atlas; versions agree across package.json, CHANGELOG, plugin manifests, CITATION
//   · no file larger than 8 MB sneaks in (media belongs in GitHub Releases)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SKILL = path.join(ROOT, 'skills', 'cinewright');
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const rd = f => fs.readFileSync(f, 'utf8');
const rel = f => path.relative(ROOT, f).replace(/\\/g, '/');
function walk(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (['.git', 'node_modules', '.render'].includes(e.name)) continue; const p = path.join(dir, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; }
const files = walk(ROOT);

/* 1 ─ SKILL.md */
{
  const t = rd(path.join(SKILL, 'SKILL.md')), m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(t);
  if (!m) err('SKILL.md: no YAML frontmatter');
  else {
    const name = /^name:\s*(.+)$/m.exec(m[1])?.[1]?.trim(), desc = /^description:\s*(.+)$/m.exec(m[1])?.[1]?.trim();
    if (name !== 'cinewright') err(`SKILL.md: name is "${name}", expected "cinewright" (must equal the folder name)`);
    if (!desc) err('SKILL.md: missing description'); else if (desc.length > 1024) err(`SKILL.md: description is ${desc.length} chars (limit 1024)`);
  }
  if (t.split('\n').length > 140) warn(`SKILL.md has ${t.split('\n').length} lines — keep the entry point lean, move detail to references/`);
}

/* 2 ─ scripts parse; templates deterministic */
for (const f of files.filter(f => /\.mjs$/.test(f))) { const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }); if (r.status !== 0) err(`syntax error in ${rel(f)}:\n${r.stderr.split('\n').slice(0, 4).join('\n')}`); }
for (const f of files.filter(f => /\.js$/.test(f) && f.includes(`${path.sep}templates${path.sep}lib${path.sep}`))) { const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }); if (r.status !== 0) err(`syntax error in ${rel(f)}:\n${r.stderr.split('\n').slice(0, 4).join('\n')}`); }
for (const f of files.filter(f => /templates[\\/][a-z0-9]+[\\/](video\.html|index\.html)$/.test(f))) {
  const code = rd(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const m = /\b(Math\.random|Date\.now|performance\.now|requestAnimationFrame|setTimeout|setInterval)\b/.exec(code); if (m) err(`${rel(f)} uses ${m[1]} — frames must be pure functions of time`);
}

/* 3 ─ atlas */
const atlasLib = await import(pathToFileURL(path.join(SKILL, 'scripts', 'atlas-lib.mjs')).href);
const A = atlasLib.loadAtlas();
{
  const seen = new Set(), kinds = new Set(['js scene', 'js gl', 'glsl', 'js init', 'js audio', 'js']);
  for (const e of A.entries) {
    if (seen.has(e.id)) err(`atlas: duplicate id ${e.id}`); seen.add(e.id);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(e.id)) err(`atlas: id "${e.id}" must be kebab-case`);
    if (!e.title) err(`atlas: ${e.id} has no title`);
    if (!e.fields?.use && e.family !== 'styles') warn(`atlas: ${e.id} has no "use:" line`);
    for (const b of e.blocks || []) if (!kinds.has(b.info)) err(`atlas: ${e.id} has a code block of unknown kind "${b.info}"`);
  }
}

/* 4 ─ relative links in Markdown */
for (const f of files.filter(f => f.endsWith('.md'))) {
  const text = rd(f).replace(/```[\s\S]*?```/g, ''), dir = path.dirname(f);
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    let href = m[1]; if (/^(https?:|mailto:|#|data:)/.test(href)) continue; href = decodeURIComponent(href.split('#')[0].split('?')[0]); if (!href) continue;
    const target = path.resolve(href.startsWith('/') ? ROOT : dir, href.replace(/^\//, ''));
    if (!fs.existsSync(target)) err(`${rel(f)}: broken link → ${m[1]}`);
  }
}

/* 5 ─ numbers and versions */
{
  const nEntries = A.entries.length, nFam = A.families.length, readme = rd(path.join(ROOT, 'README.md'));
  for (const [file, re] of [['README.md', /(\d+) (?:tested )?(?:techniques|entries|recipes) in (\d+) famil/i], ['skills/cinewright/SKILL.md', /(\d+) families, (\d+) entries/]]) {
    const t = rd(path.join(ROOT, file)), m = re.exec(t); if (!m) { warn(`${file}: could not find the "N entries in M families" sentence`); continue; }
    const [a, b] = file.startsWith('README') ? [m[1], m[2]] : [m[2], m[1]];
    if (+a !== nEntries || +b !== nFam) err(`${file} says ${a} entries / ${b} families, the atlas has ${nEntries} / ${nFam}`);
  }
  void readme;
  const pkg = JSON.parse(rd(path.join(ROOT, 'package.json'))).version, vers = { 'package.json': pkg };
  const cl = /^## \[(\d+\.\d+\.\d+)\]/m.exec(rd(path.join(ROOT, 'CHANGELOG.md')))?.[1]; vers['CHANGELOG.md'] = cl;
  for (const f of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) { try { const j = JSON.parse(rd(path.join(ROOT, f))); vers[f] = j.version ?? j.plugins?.[0]?.version; } catch (e) { err(`${f}: ${e.message}`); } }
  vers['CITATION.cff'] = /^version:\s*(\S+)/m.exec(rd(path.join(ROOT, 'CITATION.cff')))?.[1];
  for (const [f, v] of Object.entries(vers)) if (v !== pkg) err(`version mismatch: ${f} has ${v}, package.json has ${pkg}`);
}

/* 6 ─ size guard */
for (const f of files) { const s = fs.statSync(f).size; if (s > 8 * 1024 * 1024) err(`${rel(f)} is ${(s / 1048576).toFixed(1)} MB — put media in GitHub Releases, not in git`); }

for (const w of warns) console.log('! warn ', w);
for (const e of errors) console.log('✘ FAIL ', e);
console.log(errors.length ? `\n✘ ${errors.length} problem(s), ${warns.length} warning(s)` : `✔ lint passed — ${A.entries.length} atlas entries in ${A.families.length} families, ${files.length} files checked, ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
