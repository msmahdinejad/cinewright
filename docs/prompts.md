# Prompt cookbook

How to ask. The skill does the craft; **you supply intent**. Three rules:

1. **Name the skill** (`$cinewright` in Codex) and say **"go all out"** for studio mode.
2. **Give facts, not adjectives.** What the product *is*, who it is for, what must be in the film. Let the agent be the creative director — "surprise me" works.
3. **State hard requirements once** (language, aspect ratio, length, "end with the logo", "MP4 with audio"). Everything else is the agent's decision.

Start every run in an **empty folder**. Single-quote the prompt in PowerShell so `$cinewright` is not expanded.

## Everyday motion graphics (the `motion` kit — fast, and it looks designed)

These are the jobs people ask for most. The skill starts from the `motion` template (a film described as data: ten scene types, seven themes, wipes, icons, music and sound from the same spec), so a good first cut arrives quickly and you spend the rest on copy, colour and timing. Be specific about **the facts that must appear** and **the format**; leave the look to the agent or name a theme (`poster` — bold flat colour and condensed caps · `night` · `studio` · `warm` · `ocean` · `mint`).

**Introduce a person**
```text
$cinewright Make a 15-second motion graphics video that introduces a person: Maya Chen, a senior product designer
from Toronto (invent the details). Show her name and role, three skills, three numbers (years of experience, projects
shipped, awards) and a short quote, and end on her handle @mayachen. Clean, modern, energetic — the kind of intro a
personal brand would open a talk or a portfolio with. Original music and sound design. Go all out.
```

**YouTube / brand intro**
```text
$cinewright Make an 8-second YouTube channel intro for a fictional tech-review channel called "Pixel Pulse": a logo mark
that builds itself, the name, a one-line tagline you write, punchy transitions and sound design (a hit, whooshes, a
short musical sting). Bold, bright, memorable. Go all out.
```

**Vertical social promo**
```text
$cinewright Make a 12-second vertical (9:16) social-media promo for a fictional coffee shop called "Brew & Co."
announcing three autumn drinks with prices — Maple Latte €4.50, Spiced Cold Brew €4.00, Pumpkin Mocha €4.80 — and a call
to action: "Open daily 7–19 · Main Street". Bold type, flat shapes and simple icon drawings (cups, leaves, beans), a
beat-synced edit, punchy sound. Go all out.
```

**Animated infographic**
```text
$cinewright Make a 20-second animated infographic explainer titled "Why sleep matters" with three facts — adults need
7–9 hours; one night of poor sleep can cut focus by about a third; a regular bedtime improves mood — each with an
animated icon or chart (moon, brain, clock), counting numbers, a clear visual hierarchy, upbeat original music and sound
design. Go all out.
```

**Event promo**
```text
$cinewright Make a 15-second motion graphics promo for a fictional design conference, "Frame Summit 2026 · Oct 14–16 ·
Lisbon": three speakers with their talk titles, a big date moment, bold typography and shapes, and the call to action
"Get tickets at framesummit.io". Energetic, modern, with a beat-synced edit and sound design. Go all out.
```

Steer after the first render with the same vocabulary the kit uses: *"make the colour change every scene"*, *"swap the stats scene for a bar chart"*, *"theme night, mood tech"*, *"add a words burst before the logo"*, *"draw a coffee cup as a custom scene instead of the gift icon"*. More: [`references/motion-graphics.md`](../skills/cinewright/references/motion-graphics.md).

## Motion design & brand

**Showreel (the classic)**
```text
$cinewright make a dynamic 15-second motion graphics video that shows what an incredible
motion designer you are, like it's your showreel for a résumé. Go all out.
```

**Logo sting**
```text
$cinewright Create a 6-second logo sting for "Northwind Labs", a fictional climate-data startup.
Invent a simple mark and wordmark, reveal them with real impact, and give it sound design
(a hit, a whoosh, a short musical resolve). Go all out.
```

**Product film with a creative-director brief** — facts in, concept out
```text
$cinewright Create a motion graphics piece about my product <Name>. You are the creative director:
YOU decide the concept, format, aspect ratio, length (15–60 s), style, story, typography, colour, music
and pacing. Surprise me — bold and original, not a generic product ad. Go all out.

WHAT IT IS (facts — don't invent features):
- …
REQUIREMENTS: the viewer must understand what it does and feel why it's special; end with the name/logo;
MP4 with audio. Write brief.md first, review your own frames mid-way and fix anything weak.
```

## Strong prompts — what the films on the website were made from

A short prompt gets a good film; a **directed** prompt gets a film that looks like someone had opinions. These are the eight prompts behind the *Made with it* wall (they live in [`benchmark/suite/showcase.json`](../benchmark/suite/showcase.json)). What makes them work:

- **A look, with a constraint** ("a dark studio that is *not* monochrome — a cool teal key, a warm amber rim, a violet accent").
- **A structure with time codes** (0–6 s macro, 6–12 s exploded view, …) so the agent plans the pacing instead of discovering it.
- **A named moment that must be the biggest** (the drop, the reveal, "one beat of total silence before the last line").
- **Sound as a design brief**, not an afterthought (foley, a sub hit on the reveal, a riser through the explosion).
- **A floor against laziness**: "no stretch longer than a second where nothing moves", "at least six different typographic treatments".

**Product launch film — ARC** · 30 s · 16:9
```text
$cinewright Make a 30-second launch film for ARC, a fictional titanium smart ring — a seven-figure brand film made
entirely from code. Look: a dark studio that is NOT monochrome — pools of coloured light (a cool teal key, a
warm amber rim, a violet accent) sweep across brushed titanium with real reflections, and the camera never
stops moving. Structure: (0–6 s) an extreme macro of the metal grain catching a travelling highlight, then
the whole ring revealed by a slow dolly; (6–12 s) the ring comes apart into an exploded view — sensors,
battery, titanium shell — each part with a hairline call-out and a one-word kinetic title; (12–24 s) three
feature moments, each with its own visual idea: a 9-day battery as a ring of light slowly draining, sleep &
HRV as a living waveform wrapping the ring, 50 m water resistance as caustic ripples; (24–30 s) the ring
re-assembles into the hero pose, lock-up "ARC" and the tagline "Less to wear. More to know." Typography:
confident, large, few words. Sound: macro foley (clicks, glassy ticks, air), a deep sub on the reveal, a
riser through the explosion, a resolving chord on the lock-up. No placeholder shots, no stretch longer than
a second where nothing moves. Go all out.
```

**Sci-fi teaser — LAST SIGNAL** · 25 s · 16:9
```text
$cinewright Make a 25-second teaser trailer for "LAST SIGNAL" (a lone deep-space station keeps receiving a transmission
from its own future). Cinematic dread: slow push-ins, flickering practical lights, cold blue instrument glow
against one warm emergency red, heavy film grain, anamorphic streaks, a flythrough of a dim corridor, a
waveform that resolves into a faceless silhouette made of particles, countdown numerals, decoded text on a
CRT terminal ("THIS IS THE STATION. IT HAS ALREADY HAPPENED."), a build to one enormous moment (the
transmission's source revealed as a planet-sized ring), a hard cut to black, a title card and a release
date. Sound: a low drone that rises for 20 s, a heartbeat that accelerates, morse-like pings, a sub-bass hit
on the reveal, silence before the title. No actors, no footage: everything generated. Go all out.
```

**Kinetic typography manifesto** · 20 s · 16:9
```text
$cinewright Make a 20-second kinetic typography film that delivers this manifesto word for word: "We don't wait for
inspiration. We build it. Frame by frame. Line by line. Until the thing you imagined starts to move." Type
is the only hero — at least six different typographic treatments (mask reveal, slice, 3D extrusion with
perspective, outline-to-fill, scale-through, glitch, per-letter physics) on a driving original drum-and-bass
track at 174 BPM with every cut on the beat. Two saturated colours plus one neutral, huge type (at least 40
% of the frame height), a full-bleed colour flood every ~4 s, one camera flight through the letters in 3D
and one beat of total silence before the last line. Sound: drums, bass, risers and a synth stab on every key
word. Go all out.
```

**Audio-reactive music visualizer** · 24 s · 16:9
```text
$cinewright First compose a 24-second original electronic track (synthesise it yourself): intro, build, drop, outro.
Then make an audio-reactive music visualizer for it. The picture must be driven by the track's real analysis
(envelopes of kick, bass, hats and lead): a GPU particle field that pulses with the kick, a bass-driven
tunnel or terrain, a ring equaliser, light streaks on the hats, a palette that shifts at the drop. The drop
must be the most spectacular moment (full-frame flash, shockwave, camera punch). Only a tiny title ("SIGNAL
/ 24") at the very end. Go all out.
```

**Prestige-drama title sequence** · 25 s · 16:9
```text
$cinewright Make a 25-second main-title sequence for a fictional prestige thriller series called "THE HOLLOW HOURS" (a
night-shift detective in a city that never sleeps) — Saul Bass meets a modern streaming title. Build
everything from abstract shapes, light, grain and type: cut-paper layers that peel apart, a flickering neon
sign, rain streaking down glass with bokeh street lights, a clock whose hands unravel into thread, a
silhouette made of falling particles. Credit-style typography with invented names ("Created by …", "Starring
…"), a brooding original score with a heartbeat pulse and a low brass swell, and a final title lock-up that
holds for two seconds. Go all out.
```

**Vertical data story** · 15 s · 9:16
```text
$cinewright Make a 15-second VERTICAL (9:16) social video that makes people feel one statistic: in the fictional city of
Lumen, daily bike-share rides grew from 12,000 in 2021 to 87,000 in 2025. Hook in the first second (a number
slams in), one hero visual (a city of dots growing into a river of light), big readable numbers that count
up, a map or line-chart moment, a beat drop where 87,000 lands, safe areas for phone UI, punchy music with a
drop, and an end card with a one-line takeaway. Go all out.
```

**Sci-fi interface boot sequence** · 15 s · 16:9
```text
$cinewright Make a 15-second cinematic sci-fi interface sequence — a fictional starship's HUD booting up: radial menus,
hex grids, scanning lines, a rotating 3D wireframe planet with orbit markers, data read-outs with counting
numbers, a waveform scope, amber warnings, and a final "ALL SYSTEMS NOMINAL" glow. Layered parallax,
constant micro-motion, glitches on the cuts, a scan-line / CRT grade. Sound: UI beeps, servo whirs, a rising
power-up tone and a final confirm chord. Go all out.
```

**Meditative landscape, no text** · 15 s · 16:9
```text
$cinewright Make a 15-second meditative cinematic landscape with no text at all: dusk over a procedural terrain with
layered mountain ridges, drifting mist, an aurora ribbon in the sky, a slowly rising moon, fireflies, a slow
crane move. A gentle original ambient score (pads, a soft pluck, sparse bells). Palette: deep indigo to rose
gold. Make it so beautiful that someone would loop it. Go all out.
```

## Cinematic & atmosphere

```text
$cinewright Make a 20-second cinematic teaser trailer for a fictional science-fiction film
called "LAST SIGNAL": title cards, camera moves, atmosphere, a build to one huge moment, a score.
No footage — everything generated. Go all out.
```

```text
$cinewright An 8-second SEAMLESS loop for a website hero background: dark, elegant, one accent
colour, slow organic motion, no text. The last frame must flow into the first.
```

## Explainers & data

```text
$cinewright 20-second explainer for "Pocketwise", a fictional app that turns shared household
expenses into a monthly summary: the problem, the invented UI, one satisfying data moment, the name
and a one-line tagline. Original music and UI sounds. Go all out.
```

```text
$cinewright 15-second VERTICAL (9:16) social video telling one statistic so people feel it
(<your real number>). Hook in the first second, one hero visual, big numbers, music with a drop,
phone-UI safe areas. Go all out.
```

## Music

```text
$cinewright First compose a 20-second original electronic track (synthesise it yourself), then make
an audio-reactive visualizer: the picture must respond to the kick, bass and melody, with a build and a drop.
```


## Steering after the first result

The agent leaves `brief.md`, `video.html` and `qc/review-*.md` behind, so you can steer precisely instead of re-rolling:

| you say | what happens |
|---|---|
| "the middle drags — tighten scenes 3 and 4 to 2 s each" | cues change in one place; picture and music retime together |
| "make the ending hit harder" | agent adds a hit + camera punch on the cue, re-renders just that second to check |
| "give me a 9:16 version" | `--aspects 16:9,9:16` — the page re-composes from `?w=&h=` |
| "use technique `particles-morph-word` for the title" | `atlas.mjs show particles-morph-word`, drops the recipe into the scene |
| "different style, same story" | `inspire.mjs --seed 7` for another direction; swap the style system |

## Tips that change results

- **Constraints inspire.** "One accent colour", "no text until the last second", "only circles" produce more distinctive films than "make it cool".
- **Say who it is for and where it will play** (phone, big screen, silent autoplay): it changes type size, pacing and sound.
- **Ask for the reasoning artefacts** — "write brief.md first" — they make the work reviewable and the next prompt sharper.
- **Looks > effects.** Ask for a *style* (liquid chrome, brutalist poster, flat pop…) rather than a list of effects; styles are complete systems in the atlas (`atlas.mjs list styles`).

## More languages — Persian (فارسی)

```text
$cinewright یک موشن‌گرافی ۱۵ ثانیه‌ای برای معرفی «سارا احمدی»،
طراح محصول ساکن تهران بساز (جزئیات را خودت بساز): نام و عنوان، سه مهارت، سه عدد (سال تجربه، پروژه، جایزه) و یک جملهٔ کوتاه. تمیز، مدرن و پرانرژی؛ متن فارسی درست شکل‌گرفته و راست‌به‌چپ. موسیقی را خودت بساز. Go all out.
```

```text
$cinewright یک اینفوگرافیک متحرک ۲۰ ثانیه‌ای با عنوان «چرا خواب مهم است» بساز: سه واقعیت، آیکون‌های متحرک، عددهای در حال شمارش، سلسله‌مراتب بصری روشن و موسیقی شاد. Go all out.
```
