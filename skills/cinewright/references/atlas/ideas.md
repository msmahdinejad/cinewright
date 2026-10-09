# Ideas — concepts, metaphors, hooks and endings (read BEFORE you write brief.md)

Technique cannot save a generic idea. The first thing a viewer sees is the concept; the 2nd is whether it is *specific*. Generic = "glowing gradient + product name + whoosh". Specific = **one visual verb that only this subject could do**.
Method: (1) write the promise of the film in ONE sentence · (2) list 10 *literal* visuals (screens, logos, UI) and throw them away · (3) climb the **metaphor ladder**: literal → metaphor → impossible image (an object/camera/world that cannot exist but explains the idea instantly) ·
(4) pick ONE signature device (below) and a hook + ending · (5) only then pick style, palette, techniques. `node inspire.mjs --brief "…"` generates three different directions from a brief to start from.
Always look for the **impossible camera** (flies through a letter, a mouth, a screen), the **transformation** (one object becomes another across the film) and the **contrast** (before/after, loud/quiet, flat/3D, dull/bright). Surprise = expectation set up, then bent.

## idea-metaphor-ladder — From literal to impossible
tags: idea concept method metaphor creative brief literal ladder originality
use: whenever the first idea feels like "a product video". Do it on paper in brief.md: three rungs for the main message
how: take the message ("translates speech live") → literal rung: UI with captions → metaphor rung: a prism splitting white light into colours; a river of words flowing into another language → impossible rung: you fly through a speaker's mouth and the sound waves harden into 3D letters of another script that fly out of the frame. Build the film from the highest rung you can execute well; use the literal rung only as the proof (one UI shot near the end).
pair: ideas below, text3d-chrome, particles-morph-word

## idea-signature-object — One object that transforms through the film
tags: idea concept object transformation continuity morph signature narrative device
use: gives 15–60 s a spine without dialogue: the viewer follows ONE thing. Works for showreels, brands, explainers
how: choose a simple form (a dot, a ring, a cube, a word, a waveform). Scene 1 it is a dot; it stretches into a line (scene 2), the line draws a UI card, the card shatters into particles, particles re-form as the logo. Use match cuts on the object's position/shape between scenes (`trans-circle-reveal`), keep it on screen through each transition.
pair: particles-morph-word, trans-circle-reveal, gfx-stroke-draw

## idea-impossible-camera — The camera that goes where no camera can
tags: idea concept camera fly through zoom impossible immersive transition
use: hooks and transitions; most memorable shots in motion design are impossible camera moves
how: fly *through* something: a letter's counter into the next scene (`trans-zoom-through`), a phone screen into the app world (3D phone → UI card → UI scene), a keyhole, a bubble, an eye, a waveform. Rule: the object you enter on the outgoing side must match the object you exit from on the incoming side (same size, same position) so the cut is invisible.
pair: cam-flythrough-gates, phone-ui-3d, trans-zoom-through

## idea-contrast-structure — Built on one contrast
tags: idea concept contrast structure before after dull bright flat 3d quiet loud
use: films under 20 s: a single big contrast is easier to land than a sequence of equally pretty scenes
how: pick the axis: dull→vivid (grayscale, silent, 4:3 → full colour, music, widescreen), small→vast (one dot → a galaxy of dots), chaos→order (particle smoke → clean typography), analogue→digital (paper/VHS → glossy 3D), noise→meaning (static → words). The change should happen ONCE, at about 60 % of the runtime, with a hit and a transition.
pair: look-noir, look-vhs, particles-morph-word, sfx-riser-drop

## idea-one-take — A single continuous camera through every scene
tags: idea concept one take continuous camera flythrough seamless journey
use: showreels and brand films that should feel expensive and connected; "one gesture, many worlds"
how: design every scene so the camera path continues: end of scene A = same screen position/scale/motion as start of scene B; hide the join with a fast object passing the lens, a flash, a whip or a zoom through a shared shape. The camera never stops moving — vary speed (slow, accelerate, slow).
pair: cam-flythrough-gates, trans-zoom-through, trans-hit-flash

## idea-typing-to-world — A typed line becomes a world
tags: idea concept ai prompt typing generate create text world reveal
use: AI/creation/automation stories: the prompt IS the hero. A caret types a sentence; each word spawns its visual (letters flying out, the scene assembling around the text)
how: terminal/search box `typewriter-caret` → words detach and become 3D (`text3d-chrome`) or particles (`particles-morph-word`) → the scene materialises (city, planet, UI) with the sentence still readable as a subtitle; end on the result and the tagline.
pair: typewriter-caret, particles-morph-word, planet-atmosphere

## idea-zoom-out-reveal — Start close, zoom out to the truth
tags: idea concept zoom out reveal scale context surprise
use: surprise reveals ("this tiny thing is part of that giant thing"), scale/community stories
how: begin on an abstract macro detail (a dot, a texture, a glyph), pull back through steps (each zoom = a cut hidden by the zoom itself) until the full picture reads — a face in a crowd of dots, a letter in a poster of letters, one language in a globe of languages.
pair: trans-zoom-through, ui-network-graph, particles-morph-word

## idea-countdown-rhythm — Accelerating cuts
tags: idea concept countdown rhythm acceleration montage energy 1 2 3 4
use: showreels, trailers, "N things" explainers: the editing itself is the idea
how: scenes 3 s → 2 s → 1.5 s → 1 s → 0.5 s → 0.25 s on the beat; the camera push gets faster, the sound adds a layer each cut, then everything stops for a half-second of silence and the hero shot lands.
pair: word-slam, sfx-riser-drop, cam-punch-hits

## idea-glitch-fix — Broken, then repaired
tags: idea concept glitch error fix repair noise clarity problem solution
use: problem→solution stories (communication breakdown → clarity): the "problem" is shown as distortion, the product restores it
how: first third: distorted (glitch, noise, scramble, wrong-language gibberish, muffled sound with low-pass), a hard cut/flash, then crisp, warm, in sync (sound opens up with a filter sweep). Use `scramble-decode` for gibberish→meaning.
pair: scramble-decode, look-vhs, glitch transitions, sfx-glitch-stutter

## idea-split-pair — Two worlds side by side
tags: idea concept split screen pair two languages before after mirror duet
use: comparison, translation, dubbing, collaboration, A/B: the frame divides and each half is a world that responds to the other
how: a vertical seam; left = source (grey/dull/English), right = result (colour/Persian); the seam moves, content crosses it, one object appears on both sides mirrored. Persian is right-to-left: let the Persian half enter from the right.
pair: trans-push-parallax, words-on-beat, ui-chat-bubbles

## idea-loop-ending — The end is the beginning
tags: idea concept loop ending seamless circular social repeat
use: social-first cuts and logo stings; invites replays; elegant for 8–15 s pieces
how: last frame = first frame (same composition and sound tail leading into the first hit); design scene 1 as the "set-up" so the loop feels like a cycle (cloud → word → cloud). Check by rendering frames 0 and N−1 side by side.
pair: particles-dissolve, particles-morph-word

## meta-translation-language — Language, translation, dubbing
tags: idea metaphor translation language dubbing speech voice persian subtitles global babel
use: subjects about speaking across languages (translation tools, learning apps, subtitles, dubbing, travel)
how: **prism** (white waveform → glass prism → coloured waveforms per language) · **alphabet storm** (letters of many scripts fall and snap into one sentence; Persian assembles right-to-left) · **mouth-to-text** (waveform bars → words, `ui-waveform-voice`) · **world of speakers** (globe/nodes with names in several scripts, signals travelling, `ui-network-graph`) · **echo with a twist** (a word repeats and each echo changes script and colour) · **bridge** (two cliffs, a bridge drawn by `gfx-stroke-draw`, words walk across) · **live subtitles in the street** (3D city, signs switch language as the camera passes). Sound: the dull babble (`voice-babble`) becomes clear and bright at the moment of translation.
pair: ui-waveform-voice, words-on-beat, ui-network-graph, text3d-chrome (Persian), gfx-girih-reveal

## meta-speed-realtime — Speed, real time, zero latency
tags: idea metaphor speed realtime latency fast instant live streaming
use: "instant", "live", "zero delay" claims
how: streaks and hyperspace (`glsl-starfield-warp`, `tunnel-rings`), a stopwatch/odometer that freezes at 0.2 s (`counter-odometer`), a race where the competitor's line lags behind a glowing trail, a heartbeat/waveform with no gap, a speed-ramp that slows time to show the 200 ms (`cam-speed-ramp`).
pair: tunnel-rings, counter-odometer, cam-speed-ramp, sfx-whoosh-set

## meta-ai-intelligence — AI, intelligence, models
tags: idea metaphor ai intelligence neural network brain model learning thinking
use: AI products. Avoid the cliché blue brain: show *behaviour* (thinking, noticing, choosing) not anatomy
how: particles that organise as they "think" (`particles-morph-word`), a field of points snapping to a face/word, attention as a spotlight moving over text (`light-spotlight-reveal`), a prompt turning into a scene (`idea-typing-to-world`), glass shards assembling into a lens, a calm ever-evolving flow field (`gfx-flow-field`) that reacts to a cursor.
pair: gfx-flow-field, particles-mesh-surface, look-ascii (the machine's view)

## meta-open-source-community — Open source and community
tags: idea metaphor open source community contributors github code share collaboration commons
use: open-source tools: value = many hands, transparency, freedom
how: code typing (`ui-code-typing`) whose lines are claimed by avatars from many places; a constellation where each star is a contributor and the stars connect (`ui-network-graph`); a glass box (transparent product: you can see the gears, `glass-gems` + `wire-hologram`); a key being handed on; "fork" as a shape splitting into two shapes that both continue.
pair: ui-code-typing, ui-network-graph, wire-hologram

## meta-privacy-security — Privacy, security, trust
tags: idea metaphor privacy security trust local offline lock encryption safe
use: privacy-first / offline / on-device claims
how: a vault door/lock iris (`trans` iris + ring glow), data as particles that stay inside a ring (`particles-morph-word` ring shape), a toggle flipping Offline mode (`ui-toggles-settings`), a cloud crossed out and replaced by the device, a shield assembled from hex tiles (`bg hex`).
pair: ui-toggles-settings, glass-gems, gfx-girih-reveal (secure geometry)

## meta-creation-craft — Making, craft, the maker's hand
tags: idea metaphor creation craft making hand build design process behind the scenes
use: showreels, tools for creators, portfolio films
how: the process as the show: wireframe → shaded → rendered (`wire-hologram` → chrome), a line drawing itself into an object (`gfx-stroke-draw`), sketch/hatch to full colour (`look-hatch` → colour), the artist's cursor placing keyframes visibly, parameters being dialled (sliders), the same object in 5 materials (`material-wall`).
pair: material-wall, wire-hologram, gfx-stroke-draw, look-hatch

## meta-growth-data — Growth, data, momentum
tags: idea metaphor growth data metrics numbers rise momentum chart city
use: traction, results, impact stories
how: a city skyline rising (`city-night-flight` / `gfx-isometric-blocks`), bars as buildings, a line chart that draws out of the horizon and becomes a road to fly along (`cam-flythrough-gates`), counters that never stop (`counter-odometer`), a single seed → tree → forest time-lapse.
pair: ui-dashboard-kpis, gfx-isometric-blocks, city-night-flight

## meta-connection-network — Connection, people, links
tags: idea metaphor connection network people link community bridge social global
use: social products, platforms, communication, communities
how: dots that find each other and connect (`ui-network-graph`), threads weaving into fabric, lights switching on one by one across a map, hands/avatars (`UI.avatar`) joining a growing circle, two lines meeting and merging into one.
pair: ui-network-graph, particles-comet-trail

## meta-time-memory — Time, memory, nostalgia
tags: idea metaphor time memory nostalgia clock history archive past future
use: heritage, "years of …", emotional films
how: speed ramps and ghost trails (`cam-speed-ramp`), dissolving particles of old photographs (`particles-dissolve` with `look-film-fade`), clock hands/odometers, seasons by colour-grade shifts, then the cut to now in full colour.
pair: look-film-fade, particles-dissolve, light-leaks

## meta-transformation — Transformation and metamorphosis
tags: idea metaphor transformation morph change evolution before after becoming
use: any "before → after" product benefit
how: shape morph (`glsl-shape-contours`), liquid metal blobs merging then solidifying into the logo (`glsl-raymarch-metaballs` → `text3d-chrome`), particle flows between words (`particles-morph-word`), a rough sketch refined line by line, grey clay to glossy chrome (`Mat.clay` → `Mat.chrome` swap with a flash).
pair: glsl-raymarch-metaballs, particles-morph-word, material-wall

## meta-simplicity-clarity — Simplicity and clarity
tags: idea metaphor simplicity clarity minimal clean calm focus quiet
use: "just works", minimal products, calm brands
how: subtract: a single word on a huge calm gradient, slow `cam-push-in`, generous empty space, one accent colour, weight breathing (`weight-breathe`), soft ease, sparse piano/ney. The restraint IS the message; resist adding effects.
pair: weight-breathe, cam-push-in, look-dream-bloom

## meta-global-scale — The world, scale, reach
tags: idea metaphor global world scale planet earth reach countries map space
use: international reach, "for everyone"
how: planet with atmosphere and satellites (`planet-atmosphere`), zoom out from a single window to the globe (`idea-zoom-out-reveal`), nodes on a sphere (`particles-mesh-surface` with a sphere), greetings in 12 scripts popping on a grid (`typography` tiles), day/night terminator sweeping.
pair: planet-atmosphere, ui-network-graph, particles-galaxy-swirl

## meta-music-sound-rhythm — Music, sound, rhythm
tags: idea metaphor music sound rhythm beat voice audio dance
use: music, audio, podcast, voice tools, events
how: the picture IS the equaliser (`gfx-radial-equalizer`, `cubes-wave`), cuts on every kick, type that moves on the snare, a waveform that becomes a landscape, silence as a visual (everything freezes for a beat).
pair: gfx-radial-equalizer, cubes-wave, word-slam, cam-punch-hits

## meta-showreel-self — "I make things move" (showreels, portfolios)
tags: idea metaphor showreel portfolio self motion designer reel skills techniques personal brand
use: résumé/showreel films where the *work is the content* (the first user prompt!). Do not narrate skills — **demonstrate range with one coherent style**
how: 6–8 shots of 2–3 s, each a different discipline (kinetic type, 3D hero, particle morph, UI motion, shader/generative, 2D character-less graphics, sound design) tied by ONE system: the same palette, the same easing, a recurring shape (a ring/dot) that passes through every shot, and match-cut transitions. Open with a 1-second statement, end with name + role + contact as a held, calm card. Speed up toward the middle, breathe at the end.
pair: word-slam, text3d-chrome, particles-morph-word, ui-app-flow, glsl-julia-zoom, cam-flythrough-gates, trans-circle-reveal

## hook-first-two-seconds — Hooks that stop the scroll
tags: hook opening first seconds attention social start intro
use: every film: the first 1–2 seconds decide whether anyone watches the next 13
how: pick one — (a) an impossible image already in motion, (b) a bold 2–4 word statement slammed on the beat (`word-slam`), (c) sound-first: black + a pulse, then a hit on 0.8 s, (d) a question the film answers, (e) the end result first (flash of the finished logo/UI), then "rewind". Never open on a fade-in from black with a logo. Motion in frame 1.
pair: word-slam, particles-burst-spark, sfx-hit-stack

## end-first-last-impression — Endings people remember
tags: ending outro end card logo cta resolve last frame call to action tagline
use: every film: the last 2–3 seconds are what is remembered and shared
how: pick one — (a) logo sting: particles/chrome name + a hit and a held frame of ≥ 1 s, (b) loop back to frame 1 (`idea-loop-ending`), (c) quiet resolve: music thins to a bell, camera pushes slowly on the tagline, (d) call-to-action line + URL typed (`typewriter-caret`). Always: a held final frame (no motion for 0.6–1 s), the sound resolves (`outro-resolve`), brand name large and correctly spelled.
pair: outro-resolve, text3d-chrome, particles-morph-word, typewriter-caret
