# Creative direction — turning a brief into a film worth watching

Contents: [1 The one-idea method](#1-the-one-idea-method) · [2 Case studies](#2-case-studies-what-good-looks-like) · [3 Structure & pacing by video type](#3-structure-and-pacing-by-video-type) · [4 Style catalog](#4-style-catalog) · [5 Colour & type decisions](#5-colour-and-type-decisions) · [6 Working from references and brand assets](#6-working-from-references-and-brand-assets) · [7 Copy](#7-copy-for-video) · [8 Distinctive, not generic](#8-distinctive-not-generic) · [9 Autonomy](#9-decide-dont-interrogate)

## 1. The one-idea method
A film feels *designed* when everything in it is the same idea seen from different distances. Find it in five moves; write the answers in `direction.md` (a few lines each).

1. **Essence** — one sentence: what does this subject *do to a person*? ("A weather app turns the sky into a feeling." "Naqsh-e Jahan Square is built from geometry.")
2. **Transformation** — A becomes B; that change is the spine. Pick a metaphor native to the subject, and test it: *can code draw both states and the change between them?* (a point → a city; a wave → a word → another word; a candle → a score → an orchestra; noise → signal; a sketch → a product; a number → a chart.)
3. **Signature technique** — the visual language that makes the transformation literal and impressive: construction lines, GPU particle morph, raymarched form, glass UI, ink, light, tilework. One technique carries the film; others support.
4. **Arc** — energy curve, not a list of scenes: quiet → tension → release → resolve. Place the **hero moment** at ~65–75 % of the duration; give it a **breath** (0.15–0.4 s of near-silence and stillness) right before it.
5. **Last image (afterimage)** — what stays. Bookend it with the first image (start and end on the same object, changed) or resolve to the logo/title held ≥ 1 s. The last frame is designed, not left over.

Surprise beats (use 1–3, never more): match-cut between different things with the same shape · scale jump (macro → cosmos) · sudden silence · reverse motion · the frame itself breaks (shatter, glitch, iris) · a whip-pan that reveals the next idea · time-freeze while the camera moves · subtraction (everything drops away except one element).

## 2. Case studies — what good looks like
| Film | Spine (A → B) | Technique | Hero moment | Why it works |
|---|---|---|---|---|
| **Naqsh-e Jahan** (60 s) | a point → a whole square, built by compass and straightedge | exact geometry (circles → flower of life → 6/8/10-fold girih → iwan → dome → 3D square), palette sampled from real tile photos | camera looking straight up into the Sheikh Lotfollah dome, a shaft of light crossing it on a santur note | each step is *constructed*, so the audience understands why it is beautiful; every line lands on a music note; ends on a single point again (bookend) |
| **Sound → language** (25 s) | a waveform → "hello" → prism → "سلام" → logo | 120 k GPU particles, curl-noise smoke, SDF prism with dispersion, 180° shutter motion blur, DOF | logo impact exactly on a bar line | the product's promise *is* the image; the tempo was chosen so bar lines hit the two key events |
| **Beethoven's 10th** (60 s) | a candle-lit manuscript → an orchestra of light → the composer, today | audio-analysis-driven particle bands, ink splatter on sforzandi, crack → shatter → cold light | the parchment shatters on the C-major arrival | picture reads *data from the sound* (envelopes per instrument), so it is always in sync; a warm→cold colour change marks the turn |
| **Tech-product reel** (20 s) | noise → one clear word | kinetic type on a 128 BPM grid, particle text morph, glass cards, post shader with glitch on cuts | the logo landing | hard cuts on beats, one big word per beat, glass depth, per-word type animation |
| **Explainer / demo** (40–45 s) | confusion → clarity | UI simulation, cursor + clicks synced to sound, character with IK, montage | the moment the tool works | the UI events *are* the beat; every click has a sound |
| **Persian ensemble** (75 s) | silence → a whole ensemble | each instrument has its own visual driven by *its own stem* | the daf ensemble unison | separate stems → perfect per-instrument sync; energy curve = camera curve |
Pattern language they share: bookend · one technique · exact sync (data-driven) · a designed climax · restraint (few colours, few words).

## 3. Structure and pacing by video type
Give **every scene a job** (hook / promise / proof / turn / payoff / call) and a **length**; scenes of 2–5 s suit social, 5–10 s cinematic. Change *something* (element, camera, colour, scene) every 1.5–3 s. Cut on beats or on motion peaks. Transitions ≤ 0.4 s.

| Type | Budget |
|---|---|
| **Logo / title sting, 4–8 s** | 0–1.5 tease (spark, line, silence) · 1.5–3 build · hit at ~3 · logo resolves by 4 · tagline + hold to end |
| **Teaser / reel, 10–20 s** | hook 0–2 (the boldest visual + 3–5 words) · promise 2–6 · proof 6–12 (2–3 beats) · CTA last 3 s; vertical, big type, safe zones |
| **Explainer, 30–60 s** | problem 0–5 · solution demo 5–20 (show, don't tell) · 2–3 proof points · result · CTA; ≤ 1 message per scene |
| **Product demo / UI tour** | one flow, start to finish, cursor decisive; zoom into what matters; every click has a sound; show the result within the first third |
| **Cinematic / music film, 60–90 s** | intro 15 % · build 35 % · climax 30 % (hero at ~65 %) · resolve 20 %; tempo map with accelerando if it fits the music |
| **Music visualizer** | visuals from the analysis (`levels`, `spectrum`, `onsets`); a section change every 8–16 beats; a distinct look for the drop; title/lyrics on the beat |
| **Kinetic type / lyric** | one idea per line, words land on stressed beats; size = importance; hold ≥ 0.9 s per short line |
| **Data story** | question → chart draws itself → the insight in one number → implication; label directly, drop legends; counters ease-out |

**Reading time:** ≤ 7 words per screen; hold = 1.2 s + 0.3 s per word beyond 4; Persian and English alike. Titles enter in 0.35–0.6 s; exits are faster (0.2–0.3 s).

## 4. Style catalog
Pick one; the row is a starting recipe (all via `K.palette`/`K.oklch`, `Post` settings in brackets).
| Style | Look | Palette | Motion | Post | Sound |
|---|---|---|---|---|---|
| **Glass-neon night** | dark ink, frosted `K.Frost` cards, glowing type | ink `oklch(.12 .04 265)`, violet + cyan + one pink | outExpo entrances, elastic logo, beat punches | bloom .6, grain .04, CA on hits | pads, sub kick, glass bells, riser |
| **Editorial paper** | off-white paper, one accent, marker underlines | `#f4efe6` / `#1a1a1a` / vermilion `#e34234` | slides + draw-on strokes, crisp, no blur | grain .06, no bloom, multiply shadows | marimba/pluck, soft clicks, dry |
| **Swiss kinetic type** | huge type fills the frame, hard grid | black/white + one hot colour | cuts on beats, scale/position snaps | none or slight grain | dry drums, clicks |
| **Blueprint / wireframe** | grid, construction lines, dimension labels, mono type | navy `#0a2540`, cyan lines | lines *draw on*, parts assemble | slight bloom | ticks, soft pad, servo whooshes |
| **Retro CRT / VHS / glitch** | scanlines, RGB split, noise, datamosh cuts | desaturated + hot RGB fringes | glitch cuts on beats | scan .3, glitch, CA | bit-crush, tape stop, stabs |
| **Candlelit vintage** | parchment, ink, flicker, heavy vignette | sepia `#cbb68b`, ember orange | slow, flame lean on hits | vignette .6, warm grade | strings, hall reverb |
| **Cosmic particles** | dust, bokeh, lens glow | near-black, violet/cyan/gold | slow parallax, dolly | bloom .9, streak .25 | ambient pads, sub swells |
| **Liquid gradient / aurora** | big blurred blobs, minimal type | 2–3 analogous hues | slow drift, gentle springs | grain .03 | lo-fi keys, soft kick |
| **Isometric 3D** | pastel extruded shapes, soft shadows | pastel triad | pops with overshoot | slight vignette | marimba, pops |
| **Persian tilework / miniature** | girih patterns, arabesques, lapis + turquoise + saffron | lapis `#1f3a93`, turquoise `#2aa9a1`, saffron `#e8b04a`, cream `#f3e6c5`, crimson `#a7252b` | geometry draws itself, staggered fills | warm grade, bloom .5 | santur (`pluck` courses 3), ney (`flute`), daf/tombak, dastgah modes |
| **Synthwave** | sun, perspective grid, chrome type | magenta/cyan on indigo | forward camera, pulsing sun | bloom 1.0, scanlines | saw bass, gated snare, arps |
| **Minimal keynote** | black, one white word, precise easing | monochrome + one accent | slow, exact | none | single notes, sub |
Match style to subject and audience, not to taste: finance → editorial/blueprint; developer tools → glass-neon/terminal; culture/heritage → tilework/candlelit; music → visualizer/cosmic; consumer app → liquid gradient/isometric.

## 5. Colour and type decisions
- **Palette:** 60 % background neutral, 30 % secondary, 10 % accent (the hero gets the accent). Build from one hue with `K.palette(hue, {mode})`, or sample the brand/reference (`node tools/qc.mjs palette image.png`). Text on colour: contrast ≥ 4.5:1; on glass add a smoke layer.
- **Sizes at 1080 (multiply by `u = K.layout(W,H).u`):** display 160–260 px, headline 72–110, body 40–56, caption ≥ 28 (≥ 4 % of frame height for anything meant to be read). Persian line-height 1.5–1.7; Latin 1.2–1.35.
- **Type:** ≤ 2 families (bundled: Vazirmatn for Persian/Arabic + Latin, Inter for Latin UI, JetBrains Mono for code). Weight contrast (800 vs 500) does more than size contrast.
- **Numbers** carry stories: use real figures, animate with ease-out, unit small and muted.

## 6. Working from references and brand assets
- **Study first:** open every provided image/screenshot/logo before designing. Extract colours (`qc.mjs palette`), proportions, motifs. Match *pixel families* (not the global average — averages go grey); check the render against the reference side by side at mid-way.
- **Logos:** use the real file (PNG with alpha) via `K.loadImages`; never redraw or distort; give clear space ≥ ½ logo height; on dark backgrounds invert navy strokes to off-white; sample logo pixels into particles with `K.samplePoints`.
- **Photos/screenshots** given as *reference* stay reference (draw the film in code) unless the user says to include them; if included, use `K.loadImages`, Ken-Burns slowly, grade to the palette.
- **Real content beats lorem:** take UI text, numbers and names from the user's repo/site when available; never invent statistics — leave a clearly marked placeholder or ask.
- **Culture/heritage subjects:** research construction rules (proportions, motifs, colours), copy the *logic* not the surface; verify with a side-by-side sheet.

## 7. Copy for video
Short lines, verbs first, one message per screen, concrete numbers. Title ≤ 5 words; support line ≤ 9. CTA = one verb + object ("Start free", «همین امروز شروع کن»). For Persian prefer the natural spoken register the audience uses; avoid long compound sentences (they break RTL rhythm); keep Latin product names as one token; use Persian digits consistently.

## 8. Distinctive, not generic
Defaults produce forgettable work: a centred title on a purple gradient with a slow zoom. Instead make each of these a decision:
- a palette taken from the subject's world;
- a background texture that belongs to the subject (paper fibre, tile glaze, circuit traces, sand);
- an easing personality (springy vs. crisp vs. slow-cinematic) chosen for the brand;
- one signature motion reused as a motif (the same wipe, the same ring pulse);
- one surprise beat;
- one place where the film goes quiet.

## 9. Decide, don't interrogate
Assume and state: 1920×1080, 30 fps for UI/explainers, 60 for cinematic/music; 15–30 s for promos, 45–75 s for cinematic; language of the request; vertical variant only if the platform implies it (Reels/TikTok/Shorts) or the user asks; a written storyboard is followed exactly (map your scene names to theirs). When the brief is one line, you are the director: pick the concept, palette, style and music and commit. Ask one question only when a wrong guess would waste the render (which language is on screen? which logo file?).

## 8. v2: ideas, styles and the generator
The one-idea method above is now backed by data: `node scripts/atlas.mjs list ideas` (concept devices — signature object, impossible camera, contrast structure, one take, typing-to-world, zoom-out reveal, countdown rhythm, glitch-fix, split pair, loop ending — plus metaphor banks for translation, speed, AI, open source, privacy, creation, growth, connection, time, transformation, simplicity, global scale, music, showreels, hooks and endings) and `list styles` (22 complete visual systems). `node scripts/inspire.mjs --brief "…"` proposes three directions with a timeline skeleton. `references/protocol.md` is the process; follow it in studio mode.
