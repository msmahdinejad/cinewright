# Prompt cookbook

How to ask. The skill does the craft; **you supply intent**. Three rules:

1. **Name the skill** (`$cinewright` in Codex) and say **"go all out"** for studio mode.
2. **Give facts, not adjectives.** What the product *is*, who it is for, what must be in the film. Let the agent be the creative director — "surprise me" works.
3. **State hard requirements once** (language, aspect ratio, length, "end with the logo", "MP4 with audio"). Everything else is the agent's decision.

Start every run in an **empty folder**. Single-quote the prompt in PowerShell so `$cinewright` is not expanded.

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

## Persian / Iranian identity (فارسی)

```text
$cinewright یک ویدیوی ۱۵ ثانیه‌ای تایپوگرافی متحرک از این بیت حافظ بساز: «…». متن باید درست شکل‌گرفته
و راست‌به‌چپ باشد. موسیقی را خودت بساز. Go all out.
```

```text
$cinewright یک تیزر ۲۰ ثانیه‌ای سینمایی با هویت ایرانی (نقش‌های گیره‌چینی/گره‌سازی، نستعلیق،
نور و غبار) برای یک رصدخانهٔ ستاره‌شناسی بساز. موسیقی با سنتور و نی و ریتم ۶/۸ را خودت بساز.
افقی و عمودی بده. Go all out.
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
- **Looks > effects.** Ask for a *style* (liquid chrome, brutalist poster, Persian heritage…) rather than a list of effects; styles are complete systems in the atlas (`atlas.mjs list styles`).
