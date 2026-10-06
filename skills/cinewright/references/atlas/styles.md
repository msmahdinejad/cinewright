# Styles — complete visual systems (pick ONE per film, then commit)

A style system is a bundle of decisions that makes scenes feel like they belong together: palette · fonts · motion language · signature techniques · transitions · grade · sound. Mixing two systems halfway looks like indecision; **one system with one twist** looks like a point of view.
Each entry gives the bundle in fields — `palette` is `bg · base · accent · accent2 · light` (hex), `fonts` are `K.FONTS` keys, `techniques` are atlas ids (`atlas.mjs show <id>`), `transitions` are `Trans` names, `sound` are sound-recipe ids, `look` is a Post grade. Start from the bundle, then bend ONE thing (colour inverted, one scene in a different system, an unexpected scale) to make it yours.
`node scripts/inspire.mjs --brief "…"` proposes three bundles for a brief.

## style-chrome-cinema — Dark cinematic chrome
tags: style cinematic dark chrome 3d premium tech trailer glossy epic hero
use: product/brand/tech films that should feel expensive and powerful; the cinema template
how: black-blue space, one hot accent pair, chrome 3D type on a mirror floor, particles that become the name, orbit camera with depth of field, hits on every cut, light glow everywhere.
palette: #05060e #121a3a #7a5cff #27f0ff #fff1dc
fonts: sans faDisplay
motion: slow eased camera moves + sharp hit punches (+2–3 %), 0.3–0.5 s transitions, holds of 1 s on hero shots
techniques: text3d-chrome particles-morph-word city-night-flight cam-orbit-3d particles-burst-spark ui-glass-panels
transitions: zoomBlurCut glitch iris burn blur whip
sound: sfx-hit-stack pad-cinematic-swell beat-house-groove sfx-riser-drop outro-resolve
look: cinematic + bloom 0.9, streak 0.1, ca 0.0025
avoid: flat 2D scenes in the middle (breaks the spell), more than 2 accent colours, text under 6 % of frame height

## style-neon-synth — Neon night / synthwave
tags: style neon synthwave cyber retro 80s night city grid sun glow music
use: music, gaming, nightlife, crypto/tech with attitude
how: deep violet-black, magenta + cyan neon, striped sun over a grid horizon, neon outlines and flickering signs, wireframe terrain, rain/bokeh, saw arps and a four-on-floor kick.
palette: #07060d #1b1030 #ff2d95 #18e0ff #fff1dc
fonts: grotesk mono display
motion: constant forward motion (fly-throughs), snap cuts on beats, scanline/CRT texture, gentle camera roll
techniques: terrain-synthwave glsl-retro-sun neon-sign tunnel-rings city-night-flight look-crt light-neon-rim-3d gfx-grid-warp
transitions: glitch scan whip chroma flash
sound: arp-synthwave beat-house-groove sfx-whoosh-set sfx-riser-drop
look: neon night + scan 0.12, bloom 1.1, ca 0.003
avoid: pastel colours, serif fonts, soft ease-in-out everywhere (use sharp easing)

## style-clean-product — Soft, white, precise product film
tags: style clean product minimal apple white soft premium calm ui devices
use: SaaS/app/hardware explainers, "it just works", calm confidence
how: near-white or very soft grey-blue backgrounds, large calm type, glass/clay objects in softbox light, device mockups with real UI, restrained motion, one accent colour, whisper-quiet sound design (clicks, soft pads).
palette: #f4f5f8 #ffffff #1f2330 #5a5cff #ffb86b
fonts: sans grotesk fa
motion: ease-in-out cubic/quint, long smooth camera pushes, staggered reveals (0.06 s), nothing bounces
techniques: phone-ui-3d ui-app-flow product-pedestal mask-reveal marker-highlight ui-dashboard-kpis weight-breathe cam-push-in
transitions: slide fade blur doors dip
sound: beat-lofi-chill pad-cinematic-swell sfx-ui-sounds outro-resolve
look: clean product (bloom 0.3, grain 0.02)
avoid: neon, particles bursts, glitch, dark heavy vignette

## style-brutalist-poster — Loud typographic poster
tags: style brutalist poster loud type bold flat anton condensed sport streetwear punk
use: sport, fashion, events, youth brands, anything that should shout
how: flat saturated colours, huge condensed type that fills the frame, hard cuts on the beat, marquee tickers, halftone textures, thick outlines, slight rotation, zero gradients.
palette: #ffcf3a #111111 #ff3b30 #ffffff #1d4e89
fonts: display faDisplay
motion: hard cuts, slams with overshoot, stepped (not eased) moves, shake on hits, 4–8 frame accents
techniques: word-slam poster-justify echo-stack marquee-wall slice-snap glsl-halftone-wave gfx-sunburst trans-color-flood
transitions: slice checker dots flash whip
sound: beat-trap-halftime sfx-hit-stack sfx-whoosh-set
look: grain 0.06, contrast 1.1, no bloom
avoid: gradients, soft shadows, light fonts, long fades

## style-swiss-grid — Swiss / Bauhaus geometry
tags: style swiss bauhaus grid geometric primary colours minimal design modernist editorial
use: design studios, architecture, education, data stories, serious-but-fresh brands
how: strict grid, primary colours on off-white, circles/squares/triangles as actors, precise linear and eased motion, big grotesque type aligned to the grid, rhythmic repetition.
palette: #f2ede4 #111111 #e63946 #1d4e89 #ffd23f
fonts: grotesk sans fa
motion: geometric transforms (rotate 90°, slide on grid lines), constant velocity moves, syncopated stagger, everything snaps to the grid
techniques: gfx-isometric-blocks gfx-sticker-pop shape-contours text-ring counter-odometer marker-highlight gfx-stroke-draw
transitions: wipe doors blinds diamond clock
sound: beat-lofi-chill sfx-ui-sounds beat-house-groove
look: flat, grain 0.03, no bloom
avoid: glow, 3D realism, gradients, decorative fonts

## style-riso-print — Risograph / halftone print
tags: style riso risograph print halftone paper texture two ink retro poster handmade graphic
use: indie, culture, music posters, education, "human" brands; a tactile alternative to glossy 3D
how: cream paper texture, two spot inks (pink + blue/teal) with overprint multiply, halftone gradients, slightly mis-registered layers, grain, hand-cut shapes, stepped 8–12 fps feel on small elements.
palette: #fff4e0 #1b1464 #e8366d #2fb8d4 #ffd23f
fonts: serif display rounded
motion: slight jitter (2 px) every 3rd frame, paper-slide transitions, scale pops, no smooth camera
techniques: look-riso glsl-halftone-wave gfx-paper-cutout gfx-sticker-pop look-duotone type-text-window gfx-blob-morph
transitions: dots slide checker dissolve
sound: beat-lofi-chill sfx-ui-sounds sfx-whoosh-set
look: grain 0.08, sat 1.05, vignette 0.2
avoid: bloom, chrome, perfect gradients, 3D

## style-paper-craft — Layered paper & collage
tags: style paper craft collage layers shadow handmade warm storybook children kids tactile
use: stories, education, kids, wellness, food — warm and human
how: layers of coloured paper with soft drop shadows and slight parallax, paper texture, hand-written accents, gentle wobble, music box / marimba sound.
palette: #efe6d2 #e07a5f #3d405b #81b29a #f2cc8f
fonts: hand rounded serif
motion: layers slide at different speeds, small rotations, wobble-in with overshoot, nothing glows
techniques: gfx-paper-cutout cam-parallax-layers gfx-liquid-wave gfx-sticker-pop words-on-beat gfx-blob-morph
transitions: slide doors dissolve blinds
sound: beat-lofi-chill ambience-wind-air sfx-ui-sounds
look: fade 0.06 warm, grain 0.07
avoid: neon, chrome, glitch, hard cuts on beat

## style-clay-3d — Soft clay 3D
tags: style clay 3d soft pastel rounded toy friendly bouncy cute product icons
use: friendly tech, apps for everyone, kids, onboarding; "3D but approachable"
how: pastel clay-material objects (rounded boxes, spheres, tori) with soft lighting and gentle fog, bouncy springs, cute proportions, floating motion, glassy accents.
palette: #1b1540 #ffb48a #ff6fb5 #6a5cff #fff3e8
fonts: rounded grotesk fa
motion: springy overshoot, idle floating sine, squash on landing, camera drifts gently, soft shadows
techniques: cubes-wave material-wall lowpoly-forest orbit-rings glass-gems words-on-beat marker-highlight
transitions: iris blur slide doors dip
sound: beat-lofi-chill sfx-ui-sounds pad-cinematic-swell
look: dream bloom light (bloom 0.5, lift pink)
avoid: chrome, hard lighting, black backgrounds, small text

## style-liquid-dream — Liquid metal & dreamy gradients
tags: style liquid dream metaballs iridescent ethereal soft gradient blobs surreal chrome fluid
use: AI, creativity, fashion, wellness tech; surreal and calm at once
how: slow raymarched liquid chrome blobs, iridescent materials, soft gradient backgrounds, lifted blacks, heavy bloom, slow dissolves, a single clean sans title.
palette: #0a0716 #2a1a5a #b79cff #ff9ecb #e8f7ff
fonts: sans faKufi
motion: slow continuous morphing, long ease-in-out, camera drifts, time feels thick; hits are soft pulses not bangs
techniques: glsl-raymarch-metaballs helix-ribbon glass-gems bg-catalog look-dream-bloom particles-dissolve gfx-blob-morph
transitions: ink liquid blur dissolve lightleak
sound: pad-cinematic-swell ambience-wind-air outro-resolve sfx-heartbeat-tension
look: dream bloom (bloom 1.0, lift violet), contrast 0.92
avoid: hard cuts, sharp glitches, brutalist type

## style-terminal-hacker — Terminal / ASCII / code
tags: style terminal hacker ascii code matrix developer mono green crt scramble cyber
use: developer tools, security, open source, "under the hood" views of AI
how: black screen, phosphor green or amber mono type, typed commands, scramble-decode text, ASCII renderings of 3D/UI, CRT curvature and scanlines, UI-click sounds.
palette: #030806 #0a1a12 #7dff9b #2dff7a #d8ffe6
fonts: mono grotesk
motion: typed/stepped movement, instant cuts, blinking caret, text scroll, glitch pops
techniques: scramble-decode typewriter-caret look-ascii look-crt ui-code-typing particles-mesh-surface glsl-voronoi-cracks
transitions: glitch scan flash pixelate
sound: sfx-ui-sounds sfx-glitch-stutter beat-dnb-breaks sfx-heartbeat-tension
look: crt + bloom 1.0, scan 0.15
avoid: soft fonts, pastel colours, long smooth camera moves

## style-holo-blueprint — Hologram & technical drawing
tags: style hologram blueprint wireframe cyan technical schematic hud sci-fi engineering scan
use: engineering, science, infrastructure, AI "analysis" scenes, aerospace
how: deep blue grid paper or black, cyan/white thin lines, wireframe objects with holographic hulls, HUD callouts drawn on, scanning lines, measured motion.
palette: #0a2540 #123a63 #7fdbff #ffffff #ff6a3d
fonts: mono grotesk
motion: line draw-ons, precise linear moves, callouts that pop with a tick, slow orbit of the object
techniques: wire-hologram gfx-stroke-draw gfx-grid-warp particles-mesh-surface look-neon-edge ui-network-graph counter-odometer
transitions: scan wipe diamond glitch
sound: sfx-ui-sounds sfx-heartbeat-tension beat-dnb-breaks
look: bloom 1.0, scan 0.08, ca 0.002
avoid: warm colours except one orange accent, organic shapes

## style-dark-glass-ui — Dark glass dashboards
tags: style glass dark ui dashboard frosted aurora saas glassmorphism cards data modern
use: SaaS, fintech, dev platforms, dashboards, feature launches
how: aurora/nebula shader behind frosted-glass cards, thin bright borders, big KPI numbers, charts that draw themselves, cursor flows, soft glows.
palette: #05060e #0f1630 #7a5cff #27f0ff #eaf2ff
fonts: sans grotesk
motion: staggered card entrances with overshoot, smooth parallax, cursor-driven flows, number counters
techniques: ui-glass-panels ui-dashboard-kpis ui-app-flow ui-donut-progress ui-notification-stack phone-ui-3d
transitions: slide blur chroma iris
sound: sfx-ui-sounds beat-house-groove pad-cinematic-swell
look: cinematic light (bloom 0.6, vignette 0.4)
avoid: flat white backgrounds, paper textures, hand fonts

## style-persian-heritage — Persian ornament & light
tags: style persian iranian heritage girih turquoise gold calligraphy nastaliq lapis ornament poetic cultural nowruz
use: Persian-language audiences, cultural/heritage/literary subjects, premium regional brands, any film that should feel unmistakably Iranian without clichés (no carpets-and-camels)
how: deep lapis or midnight background, firouzeh (turquoise) + gold accents, exact girih star patterns growing from the centre, Nastaliq or Lalezar titles, warm dust in light shafts, santur/ney with Shur or Chahargah colour, 6/8 tombak groove for energy; combine tradition with a very modern 3D/particle element for contrast.
palette: #06121f #0b3b4a #19c3b1 #f2c14e #fdf6e3
fonts: faNastaliq faDisplay faClassic fa
motion: radial reveals from the centre, calm eased moves, dust drifting, mirrored/symmetric compositions, right-to-left flow for slides and wipes
techniques: gfx-girih-reveal gfx-star-mandala type-persian-calligraphy light-godrays particles-dust-ambient text3d-chrome (gold) particles-morph-word
transitions: iris diamond dissolve lightleak dip blur
sound: beat-persian-sixeight persian-santur-melody ambience-wind-air outro-resolve
look: warm cinematic (tint 1.05,1,.9), bloom 0.7, grain 0.04
avoid: cheap clip-art motifs, mixed pseudo-Persian fonts, letter-spacing or per-letter animation on Persian text, left-to-right assumptions

## style-vhs-retro — VHS / analog nostalgia
tags: style vhs retro analog nostalgia 80s 90s tape crt grain warm found footage
use: nostalgia, culture, music, "memories", behind-the-scenes looks
how: 4:3 or letterboxed frame, tracking noise, colour bleed, date stamps (mono), warm yellow cast, soft focus, slight jitter, tape-stop and crackle sounds.
palette: #1a1208 #5a3a1a #ffb347 #7dd6ff #fff1d6
fonts: mono grotesk
motion: jitter, tracking glitches on cuts, slow zooms, abrupt cuts
techniques: look-vhs look-crt look-film-fade light-leaks glsl-halftone-wave particles-bokeh-field
transitions: glitch chroma dissolve slide
sound: beat-lofi-chill sfx-glitch-stutter ambience-wind-air
look: vintage (fade 0.14, warm), grain 0.1, scan 0.1
avoid: crisp 3D chrome, clean sans UI, bright neon

## style-playful-sticker — Playful stickers & pop
tags: style playful sticker pop colourful bouncy kids social fun cute emoji flat bold
use: consumer apps, social, kids, campaigns for young audiences
how: bright saturated flat colours, thick white-outlined stickers, springy pops with squash, rounded type, confetti, jumpy rhythm, cartoon sounds.
palette: #7a5cff #ffd23f #ff4d6d #27f0ff #ffffff
fonts: rounded hand fa
motion: bouncy overshoot, squash/stretch, wiggles, quick staggered pops, bright flashes
techniques: gfx-sticker-pop particles-confetti word-slam gfx-sunburst gfx-blob-morph extrude-block ui-toggles-settings
transitions: iris dots slide checker flip
sound: sfx-ui-sounds beat-house-groove sfx-hit-stack
look: flat, sat 1.15, grain 0.03
avoid: realism, dark moody lighting, thin fonts

## style-noir-editorial — Black & white editorial
tags: style noir editorial black white serif grain slow elegant journalism documentary serious
use: serious subjects, documentary, journalism, luxury/heritage with restraint
how: monochrome with one accent used once, serif display type, slow pushes, grain, big negative space, sparse sound (room tone, a single piano/ney line).
palette: #050505 #1a1a1a #ffffff #d8231f #cfcfcf
fonts: serif sans faClassic
motion: very slow push-ins, hard cuts, text reveals via masks, long holds
techniques: look-noir mask-reveal weight-breathe cam-push-in light-spotlight-reveal particles-dust-ambient type-text-window
transitions: dip fade blur
sound: ambience-wind-air persian-santur-melody sfx-heartbeat-tension
look: noir (sat 0, contrast 1.35, grain 0.09)
avoid: colour except the single accent, bounce, glow

## style-space-epic — Space & cosmic scale
tags: style space epic cosmic nebula planet galaxy stars orchestral sublime science wonder
use: science, AI "intelligence", big ideas, global scale, inspirational films
how: nebula/galaxy backgrounds, planets with atmosphere, star streaks, lens flares, vast empty frames with a tiny subject, orchestral swell, camera that is always travelling.
palette: #02020a #3a24b0 #b03a78 #8aa6d8 #ffe9c4
fonts: sans grotesk faDisplay
motion: slow majestic moves, parallax between star layers, accelerations into hyperspace, big scale contrast
techniques: planet-atmosphere particles-galaxy-swirl glsl-starfield-warp light-lens-flare bg-catalog cam-orbit-3d particles-morph-word
transitions: zoom lightleak dissolve blur zoomBlurCut
sound: pad-cinematic-swell sfx-riser-drop sfx-hit-stack outro-resolve
look: anamorphic (streak 0.6, bloomTint blue), vignette 0.5
avoid: flat UI, bright pastel, comedic bounce

## style-data-city — Data as architecture
tags: style data city isometric architecture charts counters analytics growth calm tech infographic
use: reports, growth stories, analytics, civic/finance explainers
how: isometric blocks rising as bars, a night city flight whose buildings are the data, counters and charts drawing, clean labelling, calm colours with one highlight, steady camera.
palette: #101730 #1f3a7a #27f0ff #ffd23f #eaf2ff
fonts: sans grotesk fa
motion: staggered rises, steady glides, counters that roll, highlights that pulse once
techniques: gfx-isometric-blocks city-night-flight ui-dashboard-kpis counter-odometer ui-donut-progress gfx-grid-warp cam-flythrough-gates
transitions: slide iris wipe clock chroma
sound: beat-lofi-chill beat-house-groove sfx-ui-sounds pad-cinematic-swell
look: cinematic light, bloom 0.5
avoid: decorative fonts, chaotic glitch

## style-ink-calligraphy — Ink, brush and flow
tags: style ink calligraphy brush flow field minimal zen poetic generative strokes paper
use: poetry, culture, mindfulness, craft, arts; very Persian-friendly with Nastaliq/Ruqaa
how: paper or deep ink-black, flowing curl-noise streamlines like brush hair, a calligraphic title drawing itself, ink-bleed transitions, long silences, one bell or santur note at a time.
palette: #f3efe6 #1b1b1b #b33a3a #1f6f78 #ffffff
fonts: faNastaliq faRuqaa serif
motion: slow flowing, drawn lines, ink bloom, minimal camera; stillness is part of the design
techniques: gfx-flow-field gfx-stroke-draw type-persian-calligraphy light-godrays particles-dust-ambient look-hatch gfx-paper-cutout
transitions: ink dissolve dip blur
sound: persian-santur-melody ambience-wind-air outro-resolve
look: film fade 0.06, grain 0.07
avoid: neon, 3D chrome, fast cuts, bounce

## style-glitch-cyber — Aggressive glitch
tags: style glitch cyber aggressive datamosh rgb split red black error hacker punk techno
use: security, techno, gaming, rebellious brands, "system failure" stories
how: black/red/white, heavy RGB split, slice jitter, datamosh blocks, scrambled text, stuttering time (freeze frames), distorted bass and glitch SFX.
palette: #050505 #12121a #ff2a3d #27f0ff #ffffff
fonts: grotesk display mono
motion: stutter, freeze-frames, jump cuts on every beat, shake, rapid scale pulses
techniques: glitch-type look-datamosh scramble-decode sfx-glitch-stutter gfx-grid-warp particles-burst-spark light-lightning
transitions: glitch scan slice chroma flash
sound: sfx-glitch-stutter beat-dnb-breaks sfx-hit-stack sfx-heartbeat-tension
look: ca 0.006, glitch pulses, grain 0.07
avoid: smooth long eases, pastel, calm pads

## style-sunset-lofi — Warm sunset lo-fi
tags: style sunset lofi warm gradient calm cozy chill friendly nostalgic soft evening
use: lifestyle, community, friendly brands, wellness, "good vibes"
how: sunset gradients, grainy soft glows, simple shapes (sun, hills, birds), handwritten accents, lo-fi keys + vinyl crackle, slow drifting camera.
palette: #150d3a #c43c6e #ff9a4a #ffd98a #fff6e8
fonts: hand serif rounded
motion: slow drift, gentle bobbing, soft fades, nothing sudden
techniques: cam-parallax-layers gfx-liquid-wave gfx-paper-cutout light-leaks particles-bokeh-field look-film-fade words-on-beat
transitions: dissolve lightleak blur fade
sound: beat-lofi-chill ambience-wind-air outro-resolve
look: vintage warm (fade 0.1), bloom 0.6, grain 0.07
avoid: hard glitch, neon cyan, aggressive bass

## style-kinetic-type-only — Type is the whole film
tags: style kinetic typography type only words lyric video rhythm persian latin minimal poster
use: statements, manifestos, quotes, lyric videos, tight budgets where the idea is the words
how: no imagery: backgrounds are flat or shader gradients; every word enters/exits with a different typographic move; colour and weight change per beat; Persian and Latin lines interlock; camera = scale and rotation of the type itself.
palette: #0e0e14 #1a1a2e #ffd23f #ff4d6d #ffffff
fonts: display faDisplay sans fa
motion: word on every beat, scale/rotate camera on the type, masks, slices, sizes jump, hold the last word
techniques: word-slam poster-justify slice-snap letters-assemble marquee-wall text-window words-on-beat counter-odometer glitch-type type-ring
transitions: whip slice flash zoom
sound: beat-trap-halftime sfx-hit-stack sfx-whoosh-set beat-persian-sixeight
look: grain 0.05, bloom 0.4
avoid: decorative imagery, more than 5 words per screen, slow fades
