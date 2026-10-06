# Gallery — look before you choose

Contact sheets rendered by this very engine (tile labels = the atlas id or name). Open the ones that match your style with your image viewer, pick by eye, then `node scripts/atlas.mjs show <id>` for the code.
Regenerate after changing the libraries: `node scripts/atlas.mjs gallery`.

| image | what it shows | go deeper |
|---|---|---|
| `film-cinema.jpg` · `film-showreel.jpg` | the two flagship templates as films (20 frames each): dark cinematic chrome/city/particles vs bright graphic poster reel | `templates/cinema`, `templates/showreel` |
| `atlas-type.jpg` | 24 typography recipes (poster, slam, echo stack, outline draw, slice, glitch, extrude, marquee, counter, assemble, neon, Persian calligraphy…, karaoke captions, outline write-on) | `atlas.mjs list type` |
| `atlas-three-d.jpg` | 15 3D recipes: chrome text, glass gems, material wall, night city, terrain, orbit rings, tunnel, helix, relief logo, phone UI, planet, cubes, low-poly forest, pedestal, hologram | `atlas.mjs list three-d` |
| `atlas-particles.jpg` | 13 particle recipes: morph word, dissolve, burst, confetti, dust, fireflies, rain, snow, galaxy, mesh surface, image, comet trail, bokeh | `atlas.mjs list particles` |
| `atlas-shaders.jpg` | 11 shader recipes: background catalog, raymarched metaballs, voronoi, Julia zoom, truchet, SDF contours, starfield warp, retro sun, ripples, motion blur, halftone | `atlas.mjs list shaders` |
| `atlas-looks.jpg` | 22 looks: grades (teal-orange, noir, dream, anamorphic, film fade) and filters (ascii, dither, hatch, stained glass, VHS, CRT, riso, duotone, neon edge, pixel, tilt-shift, kaleido, swirl, datamosh, emboss) on one test picture | `atlas.mjs list looks` |
| `atlas-camera.jpg` · `atlas-transitions.jpg` | camera moves (push-in, punch, handheld, whip, speed ramp, parallax, orbit, dolly zoom, rack focus, flythrough, crane) and transition techniques | `list camera`, `list transitions` |
| `atlas-light.jpg` | god-rays, lens flare, light leaks, spotlight, lightning, rim light, floor reflection, long shadow, neon sign | `list light` |
| `atlas-ui-data.jpg` | app flow with cursor, chat, code typing, KPI dashboard, toasts, glass panels, donut, waveform→words, network graph, toggles, isotype statistic grid | `list ui-data` |
| `atlas-graphic.jpg` | girih star pattern, mandala, spirograph, flow field, Lissajous, blobs, sunburst, stroke draw, isometric blocks, grid warp, radial equalizer, paper cutout, stickers, liquid wave, dotted globe with arcs | `list graphic` |
| `atlas-editing.jpg` | the one visual editing recipe — a seamless loop (all other editing entries are guidance, no picture) | `show edit-seamless-loop` |
| `atlas-logos.jpg` | ten ways to reveal a mark: slam + shockwave, stroke trace, light sweep, shatter-in, split doors, liquid fill, glitch, orbit lock-up, GPU bloom ring, confetti pop (placeholder logo — swap in your own canvas) | `list logos` |
| `transitions.jpg` | all 32 GPU transitions at 50 % progress (orange "A" → blue "B") | `show trans-catalog` |
| `backgrounds.jpg` | the 25 `fx.bg` shader backgrounds with their default colours | `show bg-catalog` |
| `filters.jpg` | every `fx.filter` on one picture | `list looks` |
| `materials3d.jpg` | Scene3D materials × environments on a torus knot | `show material-wall` |
| `fonts.jpg` | the 14 bundled fonts with Latin + Persian samples | `show type-font-guide` |
| `typography.jpg` · `particles-example.jpg` · `text3d-city.jpg` | the original engine demos (`templates/examples/*.html`) | `scaffold --examples` |

Rendering these yourself: `node scripts/atlas.mjs sheet <id|family> [--cols 5 --tile 380 --out file.png]` (one frame per recipe) or `--strip` (six frames of one recipe, to judge its motion).
