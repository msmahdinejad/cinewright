# Avorythm — «صدا هست، اما معنا نه» · creative brief

**The request (user's words):** a motion-graphics piece about Avorythm — I am the creative director: concept, format, length (15–60 s), style, story, typography, colour, music, pacing. *Surprise me — bold and original, not a generic product ad. Go all out.* Facts only (open-source MIT; Chrome extension + desktop app for Windows/macOS/Linux; pick a tab + target language → live translation, AI dubbing and subtitles, even without subtitles; 4 independent outputs — original audio, dubbed audio, source subtitles, translated subtitles — mix original + dub at any ratio; synchronized player, frosted-glass subtitle card, WAV/SRT downloads; desktop app also translates any app's audio and processes audio/video files; runs on free Google AI Studio (Gemini) + Groq (Whisper) keys; tagline *"Hear every voice — or just read it — in your language"*). Requirements: the viewer understands what it does and feels why it is special; all on-screen text Persian, shaped, RTL; end with the Avorythm name/logo; MP4 with audio.

## Concept — *two voices, one meaning* (the logo is the story)
The Avorythm mark is two voices — **violet (the source)** and **cyan (the target)** — circling each other around an "A". The film tells that exchange in time: it starts in a world where sound has no meaning (violet only, foreign scripts, noise), a single click turns on the second voice (cyan) and meaning flows in.
**One sentence promise:** *every voice becomes yours.*  **The visual verb:** a voice *splits into meanings* (prism) and the two directions of reading — English left→right in violet, Persian right→left in cyan — **meet in the middle and become the logo.**
**Twist (makes it ours):** direction is the theme. Violet/source always lives on the left and enters left→right; cyan/target always on the right and enters right→left (Persian RTL). Every scene is a left/right negotiation; the final logo is the two directions locked together.
**Hook:** a heartbeat line on black, a hit at 0.8 s and a wall of foreign greetings slams in — *sound without meaning.*  **Hero moment (≈ 80 %, 24 s):** all the scripts burst into particles and re-form as the real logo. **Last image:** logo + name + the tagline in Persian and English, held ≈ 3 s.

## Style bible
- **System:** dark glass + cinematic light (style-dark-glass-ui × chrome-cinema) with Persian-first typography.
- **Palette (tokens):** night `#05061a` · navy `#0a1155` · **violet `#6a2fff`** (source) · **cyan `#40f5f5`** (target) · white `#f4f7ff` · alarm `#ff4d6d` (problem scene only). Colour arrives at the turn: scenes 1–2 are desaturated.
- **Type:** Vazirmatn 500–800 for Persian (word-by-word, RTL, never per letter) · Lalezar for the big Persian beats · Space Grotesk for Latin wordmark/labels · Inter for the multi-script wall · JetBrains Mono for URLs.
- **Motion:** eased push-ins everywhere, punches (+1.5 %) on hits, GPU transitions that all *mean* something (glitch = problem, flash = the turn, whip/slide = crossing, iris = focus, zoom-blur = escalation, blur = resolve).
- **Grade:** problem = VHS + desaturated + heavy vignette; solution = bloom 0.8, clean, cool-neutral. **Never:** warm tints, letter-spacing on Persian, more than 7 words per screen.

## Storyboard (30 s, 120 BPM, 16:9 1080p/30; shot = technique)
| time | scene | picture (technique ids) | motion/camera | transition in | sound |
|---|---|---|---|---|---|
| 0–4 | **babel** — problem | heartbeat line → wall of foreign greetings (`marquee-wall`), flat grey waveform, VHS (`look-vhs`); caption «صدا هست… اما معنا نه.» (`words-on-beat`) | slam at 0.8, slow push | (fade in) | muffled babble (`voice-babble`), drone, glitch ticks |
| 4–8 | **tab** — a video, no subtitles | browser + foreign video, "no subtitles" badge, Avorythm popup, cursor picks «فارسی» (`ui-app-flow`) | push-in, cursor path, click at 7.5 s | glitch | UI ticks, riser |
| 8–12 | **prism** — the turn | glass-like crystal prism (`Scene3D`, iridescent) splits one white voice-wave into 4 outputs: «صدای اصلی · صدای دوبله · زیرنویس مبدأ · زیرنویس ترجمه»; headline «یک تب. یک زبان. چهار خروجی.» (`glass-gems`, `ui-waveform-voice`) | orbit + DOF | flash (the click) | impact, filter opens, 4 ascending chimes, groove in |
| 12–16 | **mix** — any ratio | split-screen violet|cyan equaliser bars, crossfader slider, % counters (`ui-toggles-settings`, `counter-odometer`) | knob sweeps | whip | bright dub babble fades in vs dull original |
| 16–20 | **glass** — synchronized player | procedural "video", frosted-glass subtitle card (`ui-glass-panels`) moving/resizing; source line violet + Persian translation | card move + scale | iris | santur phrase on the Persian line |
| 20–24 | **world** — anything with sound | 3 sources (tab · any app · files) → hub → (dub · subtitles · WAV/SRT) with travelling pulses (`ui-network-graph`, `particles-comet-trail`); pills: Windows · macOS · Linux · Gemini · Groq | lines draw, pulses | zoom | pops on pulses, riser |
| 24–26 | **burst** — hero | scripts → particles → the real logo (`particles-morph-word`, `particles-burst-spark`), «هر صدا را بشنو…» | shock ring + shake | zoomBlurCut | silence → impact, sparkle |
| 26–30 | **end** | logo + «Avorythm» + tagline FA/EN, «متن‌باز · MIT», github URL, arcs pulsing | calm drift, long hold | blur | resolve chord, bells, santur note |

## Music idea
D minor (Shur colour in the Persian line), 120 BPM. Starts *in the listener's ears*: a dull, low-passed babble (the foreign voice) over a drone. The click opens the sound (filter sweep + impact); a half-time groove enters with the prism; a second, **bright babble panned right** (the dub) answers the dull one on the left — the left/right of the logo, in audio. Santur plays the Persian translation line; silence 0.15 s before the burst; the end resolves to D major with bells.

## Review plan
Look-dev frames first (babel, prism, glass, end), then skeleton, then 3 rounds (motion → craft → sound). Gate: `verify`, `qc check`, `qc energy`, contact sheets from the encoded MP4, Persian frames inspected at full size.
