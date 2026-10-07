#!/usr/bin/env node
// new-site.mjs — generate a project website like the Cinewright one (dark, animated, WebGL hero, bilingual) for ANY repository from a small JSON file.
//
//   node tools/new-site.mjs site-template/site.config.example.json --out ../my-project/docs
//
// Writes:  <out>/index.html · 404.html · assets/{css,js,fonts}   and   <out>/../.github/workflows/pages.yml  (publishes <out> with GitHub Pages)
// Then:    git add . && git commit -m "site" && git push   and   gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow
// Strings may be plain ("text") or per language ({"en": "...", "fa": "..."}); `*word*` in the headline gets the gradient. Config reference: site-template/site.config.example.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2), pos = [], o = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) o[a.slice(2)] = argv[++i]; else pos.push(a); }
if (!pos[0] || !o.out) { console.error('usage: node tools/new-site.mjs <site.config.json> --out <folder for the site, e.g. ../my-project/docs>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(pos[0], 'utf8')), OUT = path.resolve(o.out), langs = cfg.languages || ['en'], both = langs.length > 1, fa = langs.includes('fa');
const [owner, repoName] = (cfg.repo || '/').split('/'), siteUrl = cfg.url || `https://${owner}.github.io/${repoName}/`, colors = { c1: '#8a63ff', c2: '#40f5f5', ...(cfg.colors || {}) };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const T = (v, fn = esc) => v == null ? '' : typeof v === 'string' ? fn(v) : langs.map(l => v[l] != null ? `<span lang="${l}">${fn(v[l])}</span>` : '').join('');
const plain = (v, l = langs[0]) => v == null ? '' : typeof v === 'string' ? v : (v[l] ?? v.en ?? '');
const accent = s => esc(s).replace(/\*(.+?)\*/g, '<span class="grad">$1</span>');
const rv = (i = 0) => ` class="rv" style="--d:${i * 70}"`;

const nav = [['#features', { en: 'Features', fa: 'قابلیت‌ها' }], ['#how', { en: 'How it works', fa: 'چگونه کار می‌کند' }], ['#install', { en: 'Install', fa: 'نصب' }], ['#faq', { en: 'FAQ', fa: 'پرسش‌ها' }]].filter(([h]) => (h === '#features' ? cfg.features : h === '#how' ? cfg.steps : h === '#install' ? cfg.install : cfg.faq)?.length);
const html = `<!doctype html>
<html lang="${langs[0]}" dir="${langs[0] === 'fa' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(cfg.name)} — ${esc(plain(cfg.tagline))}</title>
<meta name="description" content="${esc(plain(cfg.lead))}"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#05040a">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(cfg.name)} — ${esc(plain(cfg.tagline))}"><meta property="og:description" content="${esc(plain(cfg.lead))}">${cfg.ogImage ? `<meta property="og:image" content="${esc(siteUrl + cfg.ogImage)}"><meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2305040a'/%3E%3Cpath d='M9 22a9 9 0 0 1 0-12' stroke='${encodeURIComponent(colors.c1)}' stroke-width='3.5' fill='none' stroke-linecap='round'/%3E%3Cpath d='M23 10a9 9 0 0 1 0 12' stroke='${encodeURIComponent(colors.c2)}' stroke-width='3.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="stylesheet" href="assets/css/site.css"><link rel="stylesheet" href="assets/css/extra.css">
<style>:root{--v:${colors.c1};--c:${colors.c2};--g:linear-gradient(100deg,${colors.c1} 0%,${colors.c2} 100%)}</style>
<script type="application/json" id="cfg">${JSON.stringify({ languages: langs, heroCommand: cfg.heroCommand || '', words: cfg.rotator ? { en: cfg.rotator.words?.en || cfg.rotator.words, fa: cfg.rotator.words?.fa || cfg.rotator.words?.en || cfg.rotator.words } : null, titles: Object.fromEntries(langs.map(l => [l, `${cfg.name} — ${plain(cfg.tagline, l)}`])) }).replace(/</g, '\\u003c')}</script>
</head>
<body>
<div id="sp"></div><div id="glow"></div><div class="grain"></div>
<nav id="nav"><div class="nav-in"><a class="brand" href="#top"><svg class="mark" viewBox="0 0 32 32"><path d="M9 22a9 9 0 0 1 0-12" stroke="${colors.c1}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M23 10a9 9 0 0 1 0 12" stroke="${colors.c2}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M16 10.5l1.7 3.8 3.8 1.7-3.8 1.7L16 21.5l-1.7-3.8-3.8-1.7 3.8-1.7z" fill="#fff"/></svg>${esc(cfg.name)}</a>
${nav.map(([h, t]) => `<a class="l" href="${h}">${T(t)}</a>`).join('')}${both ? '<button class="pill" id="lang" aria-label="Switch language">فارسی</button>' : ''}<a class="gh" href="https://github.com/${esc(cfg.repo)}">★ <span>GitHub</span></a></div></nav>

<header class="hero${cfg.heroImage ? '' : ' center'}" id="top"><canvas id="hero-gl" aria-hidden="true" data-c1="${colors.c1}" data-c2="${colors.c2}"></canvas><div class="hero-shade"></div>
<div class="wrap hero-grid"><div class="hero-copy">
${cfg.badge ? `<a class="badge" href="https://github.com/${esc(cfg.repo)}"><b>★</b>${T(cfg.badge)}</a>` : ''}
<h1 class="split" id="h1">${T(cfg.headline, accent)}</h1>
<p class="lead">${T(cfg.lead)}</p>
${cfg.rotator ? `<div class="rot">${T(cfg.rotator.prefix)}<span class="slot" id="rot"></span>${cfg.rotator.suffix ? T(cfg.rotator.suffix) : ''}</div>` : ''}
<div class="cta"><a class="btn main mag" href="#${cfg.install?.length ? 'install' : 'top'}">${T(cfg.cta || { en: 'Get started', fa: 'شروع کنید' })} →</a><a class="btn mag" href="https://github.com/${esc(cfg.repo)}">★ ${T({ en: 'Star on GitHub', fa: 'ستاره در گیت‌هاب' })}</a></div>
${cfg.heroCommand ? `<div class="term" style="position:relative"><div class="bar"><i></i><i></i><i></i><em>terminal</em></div><pre><span class="pr">$</span> <span id="hero-cmd"></span><span class="caret"></span></pre><button class="pill cp" data-copy="#hero-cmd">${T({ en: 'copy', fa: 'کپی' })}</button></div>` : ''}
</div>${cfg.heroImage ? `<div class="hero-visual"><div class="hero-art"><img src="${esc(cfg.heroImage)}" alt="${esc(cfg.name)}" fetchpriority="high"></div></div>` : ''}</div>
${cfg.stats?.length ? `<div class="wrap"><div class="stats" style="grid-template-columns:repeat(${cfg.stats.length},1fr)">${cfg.stats.map(s => `<div><b data-count="${+s.n}"${s.suffix ? ` data-suffix="${esc(s.suffix)}"` : ''}>${+s.n}</b><span>${T(s.label)}</span></div>`).join('')}</div></div>` : ''}
</header>

${cfg.features?.length ? `<section id="features"><div class="wrap"><div class="eyebrow rv">${T(cfg.featuresEyebrow || { en: 'Features', fa: 'قابلیت‌ها' })}</div><h2 class="rv">${T(cfg.featuresTitle || { en: 'Everything you need.', fa: 'هرچه لازم دارید.' })}</h2><div class="feats">${cfg.features.map((f, i) => `<div class="fcard rv" style="--d:${i * 70}"><i>${esc(f.icon || '◆')}</i><h3>${T(f.title)}</h3><p>${T(f.text)}</p></div>`).join('')}</div></div></section>` : ''}

${cfg.steps?.length ? `<section id="how"><div class="wrap"><div class="eyebrow rv">${T({ en: 'How it works', fa: 'چگونه کار می‌کند' })}</div><h2 class="rv">${T(cfg.stepsTitle || { en: 'Simple by design.', fa: 'ساده طراحی شده.' })}</h2><div class="pipe n${Math.min(4, Math.max(2, cfg.steps.length))} rv">${cfg.steps.map(s => `<div class="pn"><span class="dot"></span><b>${T(s.title)}</b><span>${T(s.text)}</span></div>`).join('')}</div></div></section>` : ''}

${cfg.install?.length ? `<section id="install"><div class="wrap"><div class="eyebrow rv">${T({ en: 'Get it', fa: 'دریافت' })}</div><h2 class="rv">${T(cfg.installTitle || { en: 'Install in a minute.', fa: 'در یک دقیقه نصب کنید.' })}</h2>
<div class="rv"><div class="tabs" id="itabs" role="tablist">${cfg.install.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-p="p${i}">${esc(plain(t.label))}</button>`).join('')}</div>
${cfg.install.map((t, i) => `<div class="panel${i ? '' : ' on'}" id="p${i}"><div class="codebox"><button class="pill cp">${T({ en: 'copy', fa: 'کپی' })}</button><pre>${esc(t.code)}</pre></div>${t.note ? `<p class="mini">${T(t.note)}</p>` : ''}</div>`).join('')}</div></div></section>` : ''}

${cfg.faq?.length ? `<section id="faq"><div class="wrap"><div class="eyebrow rv">FAQ</div><h2 class="rv">${T({ en: 'Questions', fa: 'پرسش‌های پرتکرار' })}</h2><div class="rv">${cfg.faq.map(q => `<details class="qa"><summary>${T(q.q)}</summary><p>${T(q.a)}</p></details>`).join('')}</div></div></section>` : ''}

<footer><div class="wrap"><div class="big-word" aria-label="${esc(cfg.name)}">${esc(cfg.name)}</div><div class="flinks"><span>${esc(cfg.license || 'MIT')} © ${esc(cfg.author || owner)}</span><a href="https://github.com/${esc(cfg.repo)}">GitHub</a>${(cfg.links || []).map(l => `<a href="${esc(l.href)}">${T(l.label)}</a>`).join('')}</div></div></footer>
<script src="assets/js/hero.js" defer></script><script src="assets/js/site.js" defer></script>
</body></html>
`;

const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, '404.html'), fs.readFileSync(path.join(ROOT, 'docs', '404.html'), 'utf8').replaceAll('/cinewright/', `/${repoName}/`).replace('Frame not found — Cinewright', `Page not found — ${cfg.name}`).replace('renderFrame(t) → t is outside [0, duration]', 'this page is outside the timeline').replace('Back to the film →', 'Back home →'));
copy(path.join(ROOT, 'docs/assets/css/site.css'), path.join(OUT, 'assets/css/site.css')); copy(path.join(ROOT, 'site-template/extra.css'), path.join(OUT, 'assets/css/extra.css'));
copy(path.join(ROOT, 'docs/assets/js/hero.js'), path.join(OUT, 'assets/js/hero.js')); copy(path.join(ROOT, 'site-template/site.js'), path.join(OUT, 'assets/js/site.js'));
for (const f of ['space-grotesk-latin.woff2', 'space-grotesk-latin-ext.woff2', 'inter-latin.woff2', 'jetbrains-mono-latin.woff2', ...(fa ? ['Vazirmatn-variable.woff2', 'lalezar-arabic-400.woff2', 'lalezar-latin-400.woff2'] : [])]) copy(path.join(ROOT, 'docs/assets/fonts', f), path.join(OUT, 'assets/fonts', f));
// the CSS declares all faces; the ones that are not shipped (e.g. Persian fonts for an English-only site) are simply never requested
// workflow: same validated action versions as this repository's own pages.yml
const mine = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8'), ver = n => (new RegExp(`uses: (actions/${n}@v\\d+)`).exec(mine) || [])[1] || `actions/${n}@v4`;
const wfDir = path.resolve(OUT, '..', '.github', 'workflows'), rel = path.relative(path.resolve(OUT, '..'), OUT).replace(/\\/g, '/') || '.';
fs.mkdirSync(wfDir, { recursive: true });
fs.writeFileSync(path.join(wfDir, 'pages.yml'), `name: Site\n\non:\n  push:\n    branches: [main]\n    paths: ["${rel}/**"]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: pages\n  cancel-in-progress: true\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    environment:\n      name: github-pages\n      url: \${{ steps.deployment.outputs.page_url }}\n    steps:\n      - uses: ${ver('checkout')}\n      - uses: ${ver('configure-pages')}\n      - uses: ${ver('upload-pages-artifact')}\n        with: { path: ${rel} }\n      - id: deployment\n        uses: ${ver('deploy-pages')}\n`);
console.log(`✔ site written to ${OUT}\n  workflow: ${path.relative(process.cwd(), path.join(wfDir, 'pages.yml'))}\n\nnext (in the project's repository):\n  git add . && git commit -m "Add website" && git push\n  gh api -X POST repos/${cfg.repo}/pages -f build_type=workflow      # once\n  → ${siteUrl}`);
