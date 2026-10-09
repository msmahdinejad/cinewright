# Pipeline reference — page contract, render options, speed, troubleshooting

Contents: [1 Project layout](#1-project-layout) · [2 Page contract](#2-page-contract) · [3 render.mjs options](#3-rendermjs-options) · [4 Speed](#4-speed-and-quality) · [5 Formats & platforms](#5-formats-and-platforms) · [6 Long renders](#6-long-renders) · [7 Troubleshooting](#7-troubleshooting) · [8 Platform notes](#8-platform-notes)

## 1. Project layout
```
video.html        scenes + renderFrame(t) + <script id="cues">          audio.mjs      soundtrack from the same cues → audio.wav
direction.md      the brief                                            lib/           kit.js post.js ui.js geometry.js synth.mjs
tools/            render.mjs qc.mjs chrome.mjs pcv-page.js analyze-audio.mjs doctor.mjs      fonts/  fonts.css + Vazirmatn/Inter/JetBrains Mono (offline)
assets/           your logos, photos, data                               out/           final MP4s          qc/  contact sheets, stills, spectrogram
.render/          progress.json, pid, render.log (tiny)                  (segments live in the OS temp dir so OneDrive/Dropbox never sync them)
```
Everything the project needs is inside it. `tools/` are copies: edit freely; `<skill>/scripts/` stay pristine.

## 2. Page contract
`render.mjs` serves the folder over `http://127.0.0.1:<port>/` (fonts and canvas pixel reads need http, not file://), opens `video.html?render=1&w=&h=&fps=&dur=&…` in N headless Chromes and calls:

| Global | Meaning |
|---|---|
| `window.renderFrame(t)` | draw the frame for time `t` (seconds). Pure. May be `async`. If it draws with WebGL asynchronously, create the context with `preserveDrawingBuffer: true`. |
| `window.ready` | optional Promise resolved when fonts/images/data are loaded (`K.loadFonts`, `K.loadImages`, `K.audioData`). The renderer also awaits `document.fonts.ready` and **refuses to render if any font failed**. |
| `window.VIDEO` | `{ width, height, fps, duration, audio, title, capture, canvas, markers }`. `duration` is required (or pass `--dur`). `audio` defaults to `audio.wav`. `markers: [{t,label}]` are added to `sheet --markers`. |
| `<canvas id="out">` | the output canvas (first of `#out #c #gl #canvas`, else the largest). Its pixel size must equal the requested size — size it from `?w=&h=` (`K.params()`). |
| `?w=&h=&fps=&dur=&lang=…` | query params; `--query lang=fa` adds your own. Templates use `w/h` to **re-compose** for other aspect ratios. |
| `?play` / `?t=3.5` | (kit.js) live preview with audio, keyboard scrub / single frame in any browser: `node tools/render.mjs serve`. |

**Capture modes** (auto): `canvas` (default, fast) — the page draws into a canvas; `screenshot` — for DOM/CSS/SVG pages, uses `Page.captureScreenshot` (3–6× slower; PNG, or `--shot-format jpeg`). Force with `VIDEO.capture` or `--capture`. For canvas capture the renderer packs frames to planar YUV420 BT.709 on the GPU (2.7× less data than RGBA); it falls back to RGBA automatically (`--transport raw`), PNG is `--transport png`.

**Determinism checklist** (what `verify` catches): no `Math.random/Date.now/performance.now` in the render path; no state mutated per frame; particles as closed-form functions of `t` (`K.field`, GPU attributes); simulations need checkpoints, not accumulation; images/fonts awaited; CSS animations/`<video>` not used (or seeked explicitly); grain seeded by frame index (`Post` does).

## 3. render.mjs options
Modes: (default) full render · `sheet` · `still 3.5,12` · `verify` · `serve` · `info` · `status` · `stop`. Run from the project folder, or pass `--root <dir>`; `--page other.html` picks another page.

| Flag | Default | Notes |
|---|---|---|
| `--w --h --fps --dur` | from `VIDEO` | overrides (the page must honour `?w=&h=`); `--scale 0.5` halves both |
| `--vertical` / `--aspects 16:9,9:16,1:1,4:5` | — | short side = `min(w,h)`; writes `out/<page>_<aspect>.mp4` per aspect |
| `--start s --end s` | whole | render a range → `<page>_partial.mp4` (quick look at one scene) |
| `--quality` | `high` | `draft` ultrafast crf28 · `web` medium crf22 + small maxrate (for sharing) · `standard` veryfast crf20 · `high` medium crf17 · `max` slow crf15 |
| `--crf --preset --maxrate auto\|off\|25M` | | `auto` = 0.2 bits/pixel/frame (grain explodes CRF-only files: 400 MB → 60 MB) |
| `--codec` | `h264` | `h265`, `vp9` (webm), `prores` (mov, editing), `gif` (≤ 960 px, no audio) |
| `--encoder nvenc` | x264 | probed first; falls back with a warning if the driver rejects it |
| `--workers` | up to `min(8, cores/3)` | one Chrome process each. The default is an upper bound: a probe measures what one worker costs on *your* page and only as many start as fit in free RAM (§4). An explicit number is honoured (with a warning if RAM looks too small). |
| `--gpu auto\|on\|off` (env `PCV_GPU`) | `auto` | `off` = software (SwiftShader) — same output, ~3× slower for WebGL. A crashed renderer is auto-restarted in software mode. |
| `--motion-blur K --shutter 0.5` | 1 | K sub-frames per frame, averaged on the GPU (canvas) or by ffmpeg `tmix` (screenshot). 8 is silky, cost ≈ K×. `shutter` = fraction of the frame interval (0.5 = 180°). |
| `--audio f --no-audio` | `VIDEO.audio` | audio shorter than video is padded with silence, longer is cut |
| `--rebuild-audio auto\|always\|never` | `auto` | `audio.mjs` is re-run when older than the page/synth |
| `--segment s` | 6 | resumable segments (0 = single pass); a changed project invalidates old segments |
| `--query "lang=fa&x=1"` | | extra page params |
| `--times --count N --markers --cols --tile --out` | | sheet layout |
| `--detach` | | run in the background; poll with `status` |
| `--profile` | | prints ms per frame split into renderFrame / pixel readback / upload |
| `--frame-timeout 90`, `--stall-timeout 180` | s | a frame slower than this (or 40× the running average) = hung renderer → Chrome restarts in software mode; nothing finishing anywhere for the stall time → stop with a clear message, segments kept |
| `--ready-timeout 90`, `--chrome path`, `--verbose`, `--fresh`, `--quiet` | | |
| `--min-free-gb N` | 5 % of RAM | free RAM below this for 3 s sheds a worker (advanced) |

Env: `CHROME`, `FFMPEG`, `FFPROBE`, `PCV_TMP` (scratch folder; automatic fallback to `<project>/.render/tmp` when the OS temp dir is not writable), `PCV_NO_SANDBOX`. Output colour: BT.709, limited range, `yuv420p`, `+faststart`, AAC 256 kb/s 48 kHz.

## 4. Speed and quality
Measured on a 32-thread laptop with an RTX-class GPU (1080p60, busy scenes): canvas + post ≈ 25–30 fps (a 60 s film ≈ 2–3 min); GPU particles 70 k ≈ 26 fps; software WebGL ≈ 1.5–4 fps.
- Read `--profile`. `renderFrame` large → simplify the scene (fewer `shadowBlur`, cache sprites, smaller blurs, fewer layers). `pixel readback` large on WebGL pages = the GPU work finishing; reduce resolution or shader cost. `upload` large = too many workers for the machine — lower `--workers`.
- Iterate with `--quality draft --scale 0.5 --fps 30` or `--start/--end`; render the final once.
- x264 `slow` is ~2× slower than `medium` for a near-identical file — the defaults already use `medium`.
- CPU-only machines: `--w 1280 --h 720 --fps 30`, particles `--query n=20000`, shaders: fewer raymarch steps, or lower resolution.
- **Workers and memory.** A worker is a whole Chrome (browser + renderer + GPU process ≈ 0.6 GB for an ordinary 1080p page; an integrated GPU's memory *is* system RAM). Before starting the pool, worker 0 shoots ~16 probe frames (an even grid + every `VIDEO.markers` time) while free RAM is watched, prints `probe: … one worker ≈ X GB · Y GB free → N workers`, and only as many start as fit (≥ 10 % of RAM stays free). During the render, free RAM under 5 % for 3 s sheds a worker — its frames go to the others and the output is bit-identical. GPU-bound pages (motion blur, shaders, big blooms) gain nothing beyond 2–3 workers on an integrated GPU; CPU-bound pages (heavy canvas 2D) scale with workers until RAM or cores run out.
- Do not use more workers than physical cores/3; the encoder needs CPU too.

## 5. Formats and platforms
| Target | Size | fps | Notes |
|---|---|---|---|
| YouTube / website / talks | 1920×1080 (or 3840×2160) | 30–60 | keep 5 % margins |
| Instagram Reels, TikTok, Shorts | 1080×1920 | 30 | keep text out of top 14 % / bottom 20 %; ≤ 60 s is safest; captions matter (muted autoplay) |
| LinkedIn / X feed | 1920×1080, 1080×1080 or 1080×1350 | 30 | 15–45 s; hook in 2 s; burn in captions |
| WhatsApp / Telegram | any | 30 | `--quality web` keeps files small |
| Editing in another tool | — | — | `--codec prores` (mov) |
Loudness −14 LUFS integrated, true peak ≤ −1 dB. 30 fps suits UI/explainers; 60 fps suits cinematic motion, particles, camera moves. Beat length in frames is whole at: 60 fps → 120 BPM=30 f, 100=36, 90=40, 75=48, 150=24; 30 fps → 120=15, 100=18, 90=20, 150=12.

## 6. Long renders
Shell tools usually kill commands after 2–10 minutes. Use `node tools/render.mjs --detach`, then poll `node tools/render.mjs status` (prints `progress.json`: done/total/fps/ETA, whether the process lives, and the log tail). If the machine sleeps or the process dies, run the same command again — finished segments are reused. Never poll faster than every ~20 s.

**End a background render with `node tools/render.mjs stop`** — it asks the render to quit itself, so Chrome and ffmpeg are closed properly and finished segments are kept. Killing `node`/Chrome from outside (`taskkill /F`, `Stop-Process`, `kill -9`) skips that cleanup; on Windows it can leave Chrome GPU processes stuck in the graphics driver holding gigabytes of RAM (see §7). Ctrl+C in a foreground render is safe.

## 7. Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| `error: ffmpeg … exited` immediately | bad encoder flag / codec missing | message shows ffmpeg's own error; try `--codec h264 --encoder x264` |
| `page never became ready` | `renderFrame` undefined, exception in a script, `window.ready` never resolves | look at the `[page error]` lines above; fix the script error |
| `font(s) failed to load` | wrong `@font-face` URL / missing file | fonts must be local; `fonts/fonts.css` is already correct |
| `HTTP 404 for …` | asset path typo | fix the path (relative to the project folder) |
| `page canvas is 1280×720 but 1080×1920 was requested` | page ignores `?w=&h=` | `const W = K.params().w \|\| 1920` and size the canvas from it |
| `WebGL2 unavailable` | no GPU/driver, blocked WebGL | run `doctor.mjs`; `--gpu off`; update the driver |
| Very slow WebGL | running on SwiftShader | doctor shows it; lower cost or use a machine with a GPU |
| `verify` FAIL | something depends on more than `t` (typically ≥ 1 % of bytes differ, deltas ≫ 2) | see the checklist in §2; rendering `t` twice must give the same pixels. `PASS~` is not a failure: GPU blending/float math is not bit-exact; `--gpu off` gives bit-exact frames |
| `probe: … one worker ≈ 4 GB` + a warning about blend modes | the page draws thousands of small shapes with `multiply`/`screen`/`overlay`… (or huge canvases) on a GPU-accelerated 2D canvas — Skia allocates GPU memory per draw (measured: 16 384 `multiply` rects = 3.7 GB per worker, which with 8 workers exhausted a 30 GB machine) | paint such layers **once** on a software canvas: `K.bake(key,w,h,fn)` or `K.canvas(w,h,{cpu:true})`; per frame stick to `source-over`/`lighter`; fewer, larger draws |
| machine slows down, `free RAM` in the progress lines keeps falling | too many workers, or a memory-hungry page | `--workers 2`; fix the page as above; close other apps; the renderer also sheds workers by itself below 5 % free |
| `no frame finished for N s …` | the stall watchdog: memory/GPU exhaustion, or an endless loop in `renderFrame` | simplify the page, `--workers 1`, `--gpu off`; finished segments are kept, so the same command resumes |
| `worker N: … timed out … restarting Chrome in software-rendering mode` | one frame took longer than `--frame-timeout` (hung, or legitimately very slow) | find the heavy/hanging call; raise `--frame-timeout` only for a really slow frame |
| Windows: `chrome.exe` processes that cannot be ended ("Access is denied"), RAM does not come back | after a hard kill or memory exhaustion the Chrome **GPU process is wedged in the graphics driver** (already "terminating", so nothing can kill it) | they go away once the driver lets go — **Win+Ctrl+Shift+B** (resets the graphics driver; the screen flickers once) or a restart makes it immediate. Prevent it: never kill a render from outside — use `node tools/render.mjs stop` or Ctrl+C |
| `the GPU is unstable here … switching to software rendering` | Chrome's GPU process died or WebGL is unavailable (driver problem, forced adapter, remote/VM session) | nothing to do: the whole run continues on SwiftShader (same picture, ~3–10× slower for WebGL-heavy pages). Update the GPU driver, or pass `--gpu off` to skip the attempt |
| Chrome "renderer crashed" | rare GPU bug with big layers | automatic restart in software mode; or `--gpu off` from the start |
| Output tiny / 48 bytes | render failed silently upstream | run `qc.mjs check`; read the log; never trust "done" |
| File 400 MB | grain + CRF only | keep the default `maxrate auto`, or `--quality web` |
| Colours look washed on some players | untagged/BT.601 | the renderer tags BT.709; do not re-encode with other tools without `-colorspace bt709` |
| Sync drift with your own audio file | different sample rate/leading silence | render.mjs resamples to 48 kHz and pads; trim leading silence in the file |
| `EPERM`/locked files on Windows | antivirus/OneDrive on the project folder | keep projects outside synced folders if possible; segments already go to `%TEMP%` |

## 8. Platform notes
- **Windows:** use the project folder as the working directory; quote paths with spaces. Chrome is found under Program Files / LocalAppData / Edge. `winget install Gyan.FFmpeg` installs ffmpeg. Codex/PowerShell: run `node …` directly; for `$skill-name` mentions in PowerShell, single-quote the prompt so `$` is not expanded.
- **macOS:** `brew install ffmpeg`; Chrome in /Applications is found automatically. `--encoder` hardware options other than nvenc are not wired; x264 is fast enough.
- **Linux/CI:** install `chromium` + `ffmpeg`; there is usually no GPU → software WebGL (slow) — prefer canvas-2D templates; as root (containers) `--no-sandbox` is added automatically; set `PCV_NO_SANDBOX=1` to force it.
- Sandboxed agent shells (Codex, CI) may block spawning Chrome, binding a local port or writing outside the workspace: request the permission once (nothing leaves `127.0.0.1`). If only the OS temp dir is blocked, scratch files move to `<project>/.render/tmp` by themselves (or set `PCV_TMP`).
- Hybrid laptops (integrated + NVIDIA/AMD GPU): headless Chrome uses the GPU Windows assigns to `chrome.exe` — usually the integrated one, which works (the pool size is measured, see §4) but shares system RAM. Forcing the discrete GPU with a Chrome flag (`--force_high_performance_gpu`) was tried on an Intel + RTX laptop: the GPU process died on start (`exit_code=34`), so it is **not** used. If you experiment anyway, pass flags via `PCV_CHROME_FLAGS`; the renderer notices a dying GPU process and switches the run to software rendering by itself.

## 9. The v2 film engine (what is in `lib/` and how the pieces fit)
`kit.js` (math, noise, easing, 2D shapes, text incl. Persian) · `post.js` (HDR bloom/grade/grain/glitch — the final image) · `gfx.js` (WebGL toolkit on Post's context) · `trans.js` (32 GPU transitions, `Trans.define`) · `stage.js` (scene timeline + transitions + camera + overlay) · `fx.js` (25 backgrounds, 26 filters, depth of field) · `scene3d.js` (3D engine: PBR-lite, glass, floor reflections, instancing, relief text) · `parts.js` (GPU particles: morph, bursts, streams) · `type.js` (kinetic typography) · `cine.js` (camera paths, shake, speed ramps) · `ui.js` · `geometry.js` · `synth.mjs`.
API on one page: `references/engine.md`. Everything is a classic script (no bundler); the order of `<script>` tags is in engine.md. `scaffold.mjs` copies ALL of it into the project, so any template can use any library.
**Performance notes:** a Scene3D at 1080p costs ≈ 10–30 ms/frame on integrated graphics (`ss: 1` halves it); 50 000 morph particles are cheap; 2D canvas filters (`g.filter = 'blur()'`) are slow — use `fx.filter('blur')`. Frames are independent: never rely on a previous frame (no feedback buffers); for motion blur/trails evaluate several times inside the shader/emitter.
**Scaffold flags:** `--template cinema|showreel|motion|basic|explainer|music|particles|shader` (`motion` takes `--preset person-intro|channel-intro|social-promo|infographic|event-promo` — the film is a JSON spec, see `references/motion-graphics.md`), `--lang fa`, `--dur`, `--w --h --fps`, `--examples` (copies 8 runnable engine demos into `examples/`). **Sheets of any page:** `render.mjs sheet --page examples/transitions.html --markers`.
**Atlas harness:** `node <skill>/scripts/atlas.mjs sheet <ids>` builds a temporary project in the OS temp folder (`pcv-atlas`) and renders recipes there (`--project dir` to choose the location if the temp folder is read-only).
