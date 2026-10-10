# Genres — what "great" looks like for each kind of film

Every genre fails in its own way. An intro fails as a slideshow; a landscape fails as flat clip art; a title sequence fails as a row of static credit cards; a data story fails as a dashboard with a voice-over missing. Read the section for your brief **before** you write `brief.md`, put its *structure* into your shot list and its *failure modes* into your review rounds. Everything in `anti-slideshow.md` still applies — except where a section below says otherwise (an ambient film is allowed to be slow: say so with `Pacing: <why>` or `Restraint: <why>` in `brief.md`).

Contents: [Everyday motion graphics](#everyday-motion-graphics) · [Vertical data story](#vertical-data-story) · [Title sequence](#title-sequence) · [Ambient / generative / loop](#ambient--generative--loop) · [App / product explainer](#app--product-explainer) · [Logo sting](#logo-sting) · [Kinetic typography](#kinetic-typography) · [Music visualizer](#music-visualizer) · [Product reveal / launch film](#product-reveal--launch-film)

## Everyday motion graphics
Intros, promos, announcements, infographics → the motion kit (`--template motion --preset …`, `motion-graphics.md`). Shots, not slides; one carried object; a travelling transition at every boundary.

## Vertical data story
*One number people should feel* (growth, a change, a comparison), 10–20 s, 9:16.
- **Structure:** hook in the first second (the START number slams in big, or the question) → the hero visual that *is* the data (a city of dots that multiplies, a river that widens, a stack that grows — not a chart yet) → the number counts up while the visual grows → the chart moment (a line draws itself, directly labelled, no legend, no gridlines beyond two) → the **drop** where the END number lands on the beat with a hit, a flash and a camera punch → one-line takeaway → end card.
- **Look:** one hero colour on a dark or paper ground, a second colour only for the "after"; numbers in a heavy condensed face, ≥ 18 % of the frame height at the drop; everything inside the phone safe area (top 14 %, bottom 20 %, sides 6 % — `K.layout(W, H, 'reel')`).
- **The visual must be the data.** 12,000 → 87,000 should *look* like 7× more of something. Particles or dots are counted (one dot = N units, say so in a footnote).
- **Fails:** a dashboard (cards with KPIs, a pie, a legend); the number appearing instead of counting; the chart arriving before the viewer cares; the takeaway in 9 words at 3 % height; no drop in the music where the number lands.
- **Sound:** a riser under the count, the drop on the final number, ticks that speed up with the counter.
- **Atlas:** `counter-odometer`, `ui-dashboard-kpis` (for the line only), `style-data-city`, `meta-growth-data`, `particles-morph-word`, `cam-punch-hits`, `edit-beat-grid`.

## Title sequence
The opening titles of a series or film: mood first, information second, 20–40 s, 16:9.
- **Structure:** 4–6 *images*, each an abstract metaphor for the story (a clock that unravels, rain on glass, a neon sign, a silhouette made of particles), each 3–6 s, linked by **match cuts and morphs** (the clock's hand becomes the street line, the thread becomes rain) — never a fade to the next card. Credits ride *inside* the images: on a wall, in a reflection, lit by the neon, tracking with the camera. The **title lock-up** is the last image, built from what came before (the thread draws the letters), held ≥ 2 s.
- **Look:** a strict graphic system — 2–3 colours (Saul Bass: one red against cream and black), paper/grain texture, hard silhouettes, slow camera pushes or drifts that never stop; type in one family, tracked caps for names, the title larger and denser.
- **Every image moves the whole time.** A credit card that holds for 3 s on a static picture is a slide; the picture keeps drifting, the light keeps flickering, something falls or unravels.
- **Fails:** credits centred on black between images; images that are illustrations without motion; five unrelated ideas; the title appearing out of nowhere.
- **Sound:** a pulse (heartbeat / clock tick) as the clock of the edit, one low swell under the title, hits on the match cuts, silence before the title.
- **Atlas:** `idea-signature-object`, `trans-circle-reveal`, `type-outline-write-on`, `light-godrays`, `light-leaks`, `look-film-fade`, `particles-dissolve`, `edit-text-timing`, `trans-hit-flash`.

## Ambient / generative / loop
A landscape, an abstract field, a wallpaper — the picture is the hero, nothing shouts, 8–30 s; often no text.
- **Structure:** one slow camera move for the whole film (a crane, a push, a drift), 2–3 *events* that change the light (the moon clears the ridge, the aurora brightens, the fireflies wake), a breath at the end. For a **loop** every motion is periodic in the loop length (`edit-seamless-loop`) and the last frame equals the first — check it with `qc.mjs loop`.
- **Look = depth.** 5–7 layers from far to near; **aerial perspective**: far layers are lighter, hazier and closer to the sky colour, near layers darker and sharper; a mist band resting in each valley, drifting at its own speed; one light source with a halo and its colour on the layers it touches; stars or dust at different speeds (parallax); grain and a vignette to make it photographic. Start from `light-dusk-landscape`.
- **Fails:** one dark colour for every ridge (clip art); a white disc moon with no glow; a "mist" that is a uniform grey veil; motion faster than a breath; a cut; music with a beat.
- **Gates:** slow is the point — write `Restraint: a meditative loop; the motion is slow on purpose` in `brief.md`, and `qc energy` / `qc look` warnings become notes. The frame must still be full (sky + layers fill it).
- **Sound:** a pad that evolves, a sparse pluck or bell, room tone (wind, crickets) — no drums; −18 to −16 LUFS is fine for ambient.
- **Atlas:** `light-dusk-landscape`, `particles-fireflies`, `particles-dust-ambient`, `edit-seamless-loop`, `idea-loop-ending`, `glsl-*` backgrounds, `ambience-wind-air`.

## App / product explainer
Problem → product → proof → name, 15–45 s. Start from `--template explainer` (`lib/ui.js`).
- **Structure:** the problem in one image (receipts piling up, a group chat full of "who paid?") 0–4 s → the app *working*, not described: a real flow with a cursor or a thumb, each tap with a sound, screens that respond 4–14 s → one satisfying data moment (a balance that settles to 0.00, a chart that resolves) → name + one-line tagline, held.
- **Look:** the UI is designed like a real app (one type family, an 8-px grid, real-looking data, no lorem ipsum), shown on a device or floating glass panels, with depth (shadow, slight 3D tilt, background blur); the camera zooms into what matters and back out.
- **Fails:** UI screenshots sliding in like slides; text explaining what the UI should be showing; a cursor that wanders; five features instead of one flow; tiny UI text nobody can read on a phone.
- **Sound:** UI foley (taps, whooshes, a success chime) on the music's beat grid; the tagline on a resolved chord.
- **Atlas:** `ui-app-flow`, `phone-ui-3d`, `ui-glass-panels`, `ui-notification-stack`, `ui-chat-bubbles`, `pipe-procedural-footage`, `style-clean-product`.

## Logo sting
4–8 s: tease → build → hit → resolve → hold (`direction.md` §3). One idea for how the mark is made (drawn, assembled, shattered back together, poured); the hit is the loudest and brightest frame; the mark holds ≥ 1.5 s. `atlas.mjs list logos`, `sfx-hit-stack`.

## Kinetic typography
The words are the picture. One idea per line, words land on stressed beats, size = importance, ≥ 6 different treatments (mask, slice, scale-through, extrude, outline-to-fill, stack), one full-bleed colour moment every ~4 s, a beat of silence before the last line. `style-kinetic-type-only`, `type-*` recipes.

## Music visualizer
The picture is *driven by the analysis* of the track (`tools/analyze-audio.mjs` → envelopes), not by a timer: kick → scale/flash, bass → mass/colour, hats → particles, lead → line. A section change every 8–16 beats, a distinct look for the drop. `--template music`.

## Product reveal / launch film
A hero *object* is a lit 3D mesh (`Scene3D`) with a coloured environment, a floor and depth of field — never a 2D outline. Macro details first, the whole object at ~70 %, the name last. `--template cinema`, `product-ring-macro`, `product-pedestal`.
