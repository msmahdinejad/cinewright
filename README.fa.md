<div dir="rtl" align="center">

<img src="docs/assets/anim/ident.webp" alt="معرفی سینه‌رایت: پنجرهٔ کد، ذرات، مارپیچ قاب‌های فیلم و نام" width="760">

# Cinewright (سینه‌رایت)

**ایجنت کدنویس شما حالا می‌تواند فیلم بسازد.**

یک «اسکیل» متن‌باز برای Codex، Claude Code و هم‌قطارانشان. هر فریم یک صفحهٔ WebGL/Canvas قطعی است و هر صدا با کد ساخته می‌شود — بدون ویدیوی استوک، بدون مدل ویدیوساز، بدون ابر. پرامپت یکسان، ایجنت یکسان: تفاوت فقط اسکیل است. فارسی و راست‌به‌چپ هم درجه‌یک پشتیبانی می‌شود.

[![CI](https://github.com/msmahdinejad/cinewright/actions/workflows/ci.yml/badge.svg)](https://github.com/msmahdinejad/cinewright/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-5b3df5.svg)](LICENSE)

[**وب‌سایت (فیلم‌ها با صدا)**](https://msmahdinejad.github.io/cinewright/) · [شروع سریع](docs/getting-started.md) · [اطلس تکنیک‌ها](docs/atlas.md) · [نمونه‌پرامپت‌ها](docs/prompts.md) · [بنچمارک](docs/benchmark.md) · [English](README.md)

</div>

<div dir="rtl">

> **نام قبلی: `pure-code-video`.** در نسخهٔ ۲٫۱ به «سینه‌رایت (Cinewright)» تغییر نام داد. برای ارتقا نصب‌کننده را دوباره اجرا کنید؛ نسخهٔ قدیمی را خودش پاک می‌کند. پرامپت `$cinewright` است.

</div>

---

<div dir="rtl">

## اثبات: پرامپت یکسان، ایجنت یکسان — با اسکیل و بدون اسکیل

همین درخواست را در یک پوشهٔ تمیز به هر ایجنت دادیم؛ تنها تفاوت اسکیل است. Codex بدون نظارت و با ریزنینگ **xhigh** اجرا شد؛ هر ایجنت فقط با *خودش* مقایسه می‌شود، نه با ایجنت دیگر. اول کارهایی که بیشتر از همه خواسته می‌شود — موشن‌گرافی ساده، بدون جلوه‌های سه‌بعدی — با پرامپت‌هایی که «موشن‌دیزاین واقعی، نه اسلایدشو» می‌خواهند (متن برای هر دو حالت یکسان است)، بعد شوریل رزومه:

</div>

<!-- FA-PROOF:START -->
<div dir="rtl">

### موشن‌گرافی روزمره

</div>

<div dir="rtl">

**معرفی یک آدم**

</div>

```text
$cinewright Make a 15-second motion graphics video that introduces a person: Maya Chen, a senior product designer from Toronto (invent the details). Show her name and role, three skills, three numbers (years of experience, projects shipped, awards) and a short quote, and end on her handle @mayachen. Clean, modern, energetic — the kind of intro a personal brand would open a talk or a portfolio with. It has to feel like real motion design, not a slideshow: objects and type travel and transform from one scene into the next, the camera moves, and every cut lands on the beat. Original music and sound design. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-person-motion-baseline.webp" alt="Codex بدون اسکیل: اینترو ویراستاری کرم و مشکی برای مایا چن — حلقهٔ سه‌بعدی بنفش، سه مهارت به‌صورت ردیف، سه عدد بزرگ کنار هم و یک نقل‌قول" width="480"></td><td align="center"><img src="docs/assets/anim/cmp-person-motion-skill.webp" alt="Codex با اسکیل: ده شاتِ تک‌ایده‌ای روی بلوک‌های رنگی — نشان MC، «Senior product designer.»، هر مهارت در یک شات، هر عدد شمارشی در یک شات، نقل‌قول و پیل @mayachen" width="480"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۱۲٪ ← ۲۵٪ · زمان تقریباً ساکن ۵۴٪ ← ۰٪ · ۳٫۴× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

**پرومو عمودی شبکه‌های اجتماعی**

</div>

```text
$cinewright Make a 12-second vertical (9:16) social-media promo for a fictional coffee shop called "Brew & Co." announcing three autumn drinks with prices — Maple Latte €4.50, Spiced Cold Brew €4.00, Pumpkin Mocha €4.80 — and a call to action: "Open daily 7–19 · Main Street". Bold type, flat shapes and simple icon drawings (cups, leaves, beans), a beat-synced edit, punchy sound. It has to feel like real motion design, not a slideshow: objects and type travel and transform from one scene into the next, the camera moves, and every cut lands on the beat. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-promo-motion-baseline.webp" alt="Codex بدون اسکیل: پرومو پوستری نارنجی و کرم — «عاشق پاییز شو»، برای هر نوشیدنی یک لیوان تصویرسازی‌شده با مهر قیمت، و کارت منوی پایانی" width="270"></td><td align="center"><img src="docs/assets/anim/cmp-promo-motion-skill.webp" alt="Codex با اسکیل: شات‌های پوستری کرم، قرمز، خردلی و سبز — BREW &amp; CO.، «Autumn is here.»، برای هر نوشیدنی یک لیوان تصویرسازی‌شده با مهر قیمت، سه لیوان کنار هم و «Open daily 7–19 · Main Street»" width="270"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۳۵٪ ← ۳۳٪ · زمان تقریباً ساکن ۰٪ ← ۰٪ · ۵٫۶× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

**اینترو کانال**

</div>

```text
$cinewright Make an 8-second YouTube channel intro for a fictional tech-review channel called "Pixel Pulse": a logo mark that builds itself, the name, a one-line tagline you write, punchy transitions and sound design (a hit, whooshes, a short musical sting). Bold, bright, memorable. It has to feel like real motion design, not a slideshow: objects and type travel and transform from one scene into the next, the camera moves, and every cut lands on the beat. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-channel-motion-baseline.webp" alt="Codex بدون اسکیل: مکعب‌های پیکسلیِ نورخورده به یک P تبدیل می‌شوند، دوربین در تایپ غول‌پیکر PIXEL روی لیمویی فرو می‌رود، PULSE روی بنفش، و بعد لوگوی PIXEL PULSE" width="480"></td><td align="center"><img src="docs/assets/anim/cmp-channel-motion-skill.webp" alt="Codex با اسکیل: تونلی از مربع‌های هم‌مرکز، مکعب‌های پیکسلی که یک P با خط ضربان می‌سازند، ویپ به PIXEL روی لیمویی، PULSE روی نیلی، و بعد لوگوی PIXEL PULSE با شعارش" width="480"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۱۶٪ ← ۳۱٪ · زمان تقریباً ساکن ۳۶٪ ← ۱۴٪ · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

**اینفوگرافیک متحرک**

</div>

```text
$cinewright Make a 20-second animated infographic explainer titled "Why sleep matters" with three facts — adults need 7–9 hours; one night of poor sleep can cut focus by about a third; a regular bedtime improves mood — each with an animated icon or chart (moon, brain, clock), counting numbers, a clear visual hierarchy, upbeat original music and sound design. It has to feel like real motion design, not a slideshow: objects and type travel and transform from one scene into the next, the camera moves, and every cut lands on the beat. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-infographic-motion-baseline.webp" alt="Codex بدون اسکیل: توضیح‌ویدیوی سرمه‌ای — ماه لیمویی، «بزرگسالان ۷ تا ۹ ساعت لازم دارند»، مغز نارنجی با «‎−۳۳٪»، ساعتی روی زمینهٔ یاسی و جملهٔ پایانی «خواب یک ابرقدرت است»" width="480"></td><td align="center"><img src="docs/assets/anim/cmp-infographic-motion-skill.webp" alt="Codex با اسکیل: یازده شات روی سرمه‌ای، یاسی، زرد و مرجانی — یک آیکون که از ماه به ساعت، مغز و اسمایلی تبدیل می‌شود، حلقه‌ای که تا ≈۳۳٪ می‌شمارد، «Same time. Every night.» و «Sleep well. Live brighter.»" width="480"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۱۲٪ ← ۲۲٪ · زمان تقریباً ساکن ۵۷٪ ← ۵٪ · ۴٫۴× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

### انواع دیگر فیلم

</div>

<div dir="rtl">

**داستان داده‌ای عمودی**

</div>

```text
$cinewright Make a 15-second VERTICAL (9:16) social video that makes people feel one statistic: in the fictional city of Lumen, daily bike-share rides grew from 12,000 in 2021 to 87,000 in 2025. Hook in the first second (a number slams in), one hero visual (a city of dots growing into a river of light), big readable numbers that count up, a map or line-chart moment, a beat drop where 87,000 lands, safe areas for phone UI, punchy music with a drop, and an end card with a one-line takeaway. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-datastory-variety-baseline.webp" alt="Codex بدون اسکیل: یک HUD عمودی تیره — شمارنده از ۱۲٬۰۰۰ تا ۸۷٬۰۰۰ بالا می‌رود بالای شبکه‌ای کج از نقطه‌ها که به رودی درخشان جمع می‌شود، یک نمودار خطی باریک زیر آن و کارت پایانی ۷٫۲۵×" width="270"></td><td align="center"><img src="docs/assets/anim/cmp-datastory-variety-skill.webp" alt="Codex با اسکیل: اعداد فشردهٔ خیلی بزرگ که روی شهری از نور می‌شمارند و شهر رود می‌شود، یک لحظهٔ نمودار خطی («Four years. One direction.»)، ۸۷٬۰۰۰ زرد روی دراپ و کارت پایانی LUMEN با دوچرخه" width="270"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۱۶٪ ← ۲۶٪ · زمان تقریباً ساکن ۱۴٪ ← ۰٪ · ۳٫۴× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

**تیتراژ آغازین سریال**

</div>

```text
$cinewright Make a 25-second main-title sequence for a fictional prestige thriller series called "THE HOLLOW HOURS" (a night-shift detective in a city that never sleeps) — Saul Bass meets a modern streaming title. Build everything from abstract shapes, light, grain and type: cut-paper layers that peel apart, a flickering neon sign, rain streaking down glass with bokeh street lights, a clock whose hands unravel into thread, a silhouette made of falling particles. Credit-style typography with invented names ("Created by …", "Starring …"), a brooding original score with a heartbeat pulse and a low brass swell, and a final title lock-up that holds for two seconds. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-title-variety-baseline.webp" alt="Codex بدون اسکیل: قاب‌های آرام با بافت کاغذ — یک خیابان استیلیزه، تابلوی نئون OPEN ALL NIGHT، بوکهٔ باران، ساعتی که ترک می‌خورد، یک سیلوئت ذره‌ای — با تیتراژ کوچک در چپ و پایان روی THE HOLLOW HOURS" width="480"></td><td align="center"><img src="docs/assets/anim/cmp-title-variety-skill.webp" alt="Codex با اسکیل: شات‌های گرافیکی جسور قرمز و سبزآبی و کرم به حال‌وهوای سال باس — حلقه‌های هم‌مرکز که عقربه آن‌ها را می‌شکافد، نئون ALL NIGHT زیر باران، ساعتی روی قرمز که روبانی را باز می‌کند، اثر انگشتی که خطی قرمز آن را می‌برد، سیلوئت ذره‌ای که فرو می‌ریزد و عنوانی که عقربه از وسطش می‌گذرد" width="480"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۲۱٪ ← ۳۸٪ · زمان تقریباً ساکن ۵۹٪ ← ۹٪ · ۳٫۶× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

**منظرهٔ آرام، بدون متن**

</div>

```text
$cinewright Make a 15-second meditative cinematic landscape with no text at all: dusk over a procedural terrain with layered mountain ridges, drifting mist, an aurora ribbon in the sky, a slowly rising moon, fireflies, a slow crane move. A gentle original ambient score (pads, a soft pluck, sparse bells). Palette: deep indigo to rose gold. Make it so beautiful that someone would loop it. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-ambient-variety-baseline.webp" alt="Codex بدون اسکیل: دره‌ای ری‌مارچ‌شده در غروب — پردهٔ پهن شفق، ماه کامل، دامنه‌های پوشیده از کاج و دریاچه‌ای آرام که نور را بازتاب می‌دهد، در 4K" width="480"></td><td align="center"><img src="docs/assets/anim/cmp-ambient-variety-skill.webp" alt="Codex با اسکیل: رشته‌کوهی ری‌مارچ‌شده از بالا — ستیغ پشت ستیغ که در مه محو می‌شود، رودی که در دره پیچ می‌خورد، شفقی ملایم‌تر، ماهی که بالا می‌آید و کرم‌های شب‌تاب روی کاج‌های تیرهٔ پیش‌زمینه" width="480"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۳۵٪ ← ۴۶٪ · زمان تقریباً ساکن ۱۰۰٪ ← ۱۰۰٪ · ۱٫۳× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

**اکسپلینر اپ**

</div>

```text
$cinewright Make a 20-second explainer video for "Pocketwise", a fictional app that turns shared household expenses into a simple monthly summary. Show the problem, the app UI (invent the screens), one satisfying data moment (numbers/chart), and end with the name and a one-line tagline. Original music and UI sound design. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-explainer-variety-baseline.webp" alt="Codex بدون اسکیل: چیدمان‌های تمیز کرم و سبز — تیتر در چپ، کارت‌های هزینه یا گوشی شناور در راست — «Shared home. Scattered spending.»، «Every expense. One place.»، خلاصهٔ دونات ۱٬۲۴۰ دلار و کارت پایانی Pocketwise" width="480"></td><td align="center"><img src="docs/assets/anim/cmp-explainer-variety-skill.webp" alt="Codex با اسکیل: شات‌های بنفش و یاسی و لیمویی — رسیدها و حباب‌های «who paid for this?»، نشان اپ، گوشی، کارت افزودن هزینه که ۷۲ دلار را به چهار کاشی ۱۸ دلاری تقسیم می‌کند، یک ویپ با موشن‌بلور، دوناتی که تا ۲٬۴۰۰ دلار می‌شمارد، چهار سهم ۶۰۰ دلاری و کارت پایانی Pocketwise" width="480"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۱۵٪ ← ۴۸٪ · زمان تقریباً ساکن ۶۵٪ ← ۱۶٪ · ۳٫۸× توکن · هر خانه یک اجرا</sub>

</div>

<div dir="rtl">

### شوریل رزومه — هر ایجنت در برابر خودش

</div>

<div dir="rtl">

**شوریل رزومه**

</div>

```text
$cinewright make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. Go all out.
```

<table dir="ltr">
<tr><th width="50%">Codex · gpt-6-astra · xhigh — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-codex-astra-baseline.webp" alt="Codex بدون اسکیل: شوریل جسور Python/GLSL با پنج صحنه" width="520"></td><td align="center"><img src="docs/assets/anim/cmp-codex-astra-skill.webp" alt="Codex با اسکیل: سه‌بعدی کروم، ذرات GPU، موج‌های آپ‌آرت، حلقهٔ نور و کارت عنوان" width="520"></td></tr>
<tr><th width="50%">Claude Code · Sonnet 5.5 — بدون اسکیل</th><th width="50%">با Cinewright</th></tr>
<tr><td align="center"><img src="docs/assets/anim/cmp-claude-baseline.webp" alt="Claude بدون اسکیل: شوریل Python و Pillow" width="520"></td><td align="center"><img src="docs/assets/anim/cmp-claude-skill.webp" alt="Claude با اسکیل: سیل رنگ، گرهٔ کروم، ذرات، داشبورد، فلز مایع، تونل، انفجار و کارت نام" width="520"></td></tr>
</table>

<div dir="rtl">

<sub>Codex · gpt-6-astra · xhigh: پُری قاب ۲۵٪ ← ۳۰٪ · زمان تقریباً ساکن ۲۵٪ ← ۱۱٪ · ۵٫۵× توکن<br>Claude Code · Sonnet 5.5: پُری قاب ۱۶٪ ← ۴۸٪ · زمان تقریباً ساکن ۲۱٪ ← ۰٪ · هر خانه یک اجرا</sub>

</div>
<!-- FA-PROOF:END -->

<div dir="rtl">

**[▶ همهٔ جفت‌ها را با صدا ببینید](https://msmahdinejad.github.io/cinewright/#results)** — صدا بخشی از نتیجه است. پرامپت‌های سنگین‌تر و سینمایی (فیلم معرفی محصول، تیزر علمی‌تخیلی، ویژوالایزر، بوت رابط) هم در [گزارش بنچمارک](docs/benchmark.md) هستند — از جمله آن‌هایی که اسکیل در آن‌ها نبرد.

</div>

<div dir="rtl">

## نمونه‌های فارسی

</div>

<!-- FA-SHOWCASE:START -->
<table dir="ltr">
<tr><td valign="top" width="50%"><img src="docs/assets/anim/film-person-fa-claude.webp" alt="معرفی یک آدم — مایا چن" width="480"><br><sub><b>معرفی یک آدم — مایا چن</b> · Claude Code · Sonnet 5.5 + Cinewright · 15 s<br>پریست «معرفی یک آدم» با متن فارسی: فقط متن عوض شده. گزینهٔ `--lang fa` کل چیدمان را راست‌به‌چپ می‌کند و ارقام را فارسی می‌نویسد؛ نه شاتِ تک‌ایده‌ای، یک نشان که برای هر مهارت به یک آیکون تبدیل می‌شود، و موسیقی‌ای که از همان مشخصات ساخته می‌شود.</sub></td><td></td></tr>
</table>

<div dir="rtl">

<details><summary>پرامپت‌هایی که این فیلم‌ها از آن‌ها ساخته شدند</summary>

**معرفی یک آدم — مایا چن**

```text
یک موشن‌گرافی ۱۵ ثانیه‌ای فارسی برای معرفی یک آدم بساز: مایا چن، طراح ارشد محصول از تورنتو (جزئیات را خودت بساز). نام و عنوان، سه مهارت، سه عدد (سال تجربه، پروژه‌های تحویل‌شده، جوایز) و یک نقل‌قول کوتاه را نشان بده و با شناسهٔ @mayachen تمام کن. تمیز، مدرن و پرانرژی. موسیقی و صداگذاری اورجینال. تمام‌قد برو.
```

</details>

</div>

<!-- FA-SHOWCASE:END -->

<div dir="rtl">

## چرا؟

وقتی از یک ایجنت کدنویس «ویدیو» می‌خواهید، معمولاً *اسلایدشو* می‌گیرید: چند محو شدن روی یک گرادیان، بدون دوربین، با صدای تخت. این اسکیل خروجی را در سه سطح عوض می‌کند:

| سطح | چه چیزی اضافه می‌کند |
|---|---|
| **موتور** | یک **کیت موشن‌گرافی** — یازده نوع صحنه که به **شاتِ تک‌ایده‌ای** بریده می‌شوند (نه اسلاید)، هفت تم، ۵۰ آیکونِ خودکش، شمارنده و نمودار، یک شیءِ حامل و گذارهای سفرکننده (ویپ، پوش، زوم، آیریس) به‌جای وایپ‌های اسلاید-به-اسلاید، تایپ جنبشی — روی یک جعبه‌ابزار GPU: **۳۲ ترنزیشن GPU**، **ذرات ۵۰هزارتایی** با مورف، **۲۵ پس‌زمینهٔ شیدری**، **۲۶ فیلتر**، ابزار دوربین و یک موتور سه‌بعدی برای صحنه‌ای که لازمش دارد، و **موتور صدا** (درام، بیس، پد، زهی، کیبورد، رایزر، ایمپکت…) که از همان مشخصات تصویر ساخته می‌شود |
| **دانش** | **اطلس ۲۵۶ تکنیک در ۱۷ خانواده** به‌علاوهٔ **دفترچهٔ ژانرها** (دیتا استوری، تیتراژ، منظرهٔ لوپ، اکسپلینر اپ، لوگو، تایپوگرافی، ویژوالایزر، معرفی محصول: ساختار، ظاهر، خطاهای رایج) — هر کدام یک دستورکار کوتاه (کاربرد / روش / پرهیز / ترکیب) با کدی که در CI اجرا می‌شود — به‌علاوهٔ گالری تصویری و `inspire.mjs` که برای هر بریف سه جهت خلاقانهٔ *متفاوت* می‌دهد |
| **فرایند** | پروتکل «استودیو»: بریف ← سبک‌یابی ← اسکلت ← **سه دور صیقل** ← دروازه‌ها؛ با سنجش‌های عینی: معیار ضد-اسلایدشو، کف پُری قاب، کنترل صدا، «دروازهٔ craft» (شاتِ ۱–۲ ثانیه‌ای نه اسلاید، شیء حامل و گذارهای سفرکننده) و اثبات قطعی‌بودن |

چون ویدیو فقط `renderFrame(t)` است — تابعی خالص از زمان — ایجنت می‌تواند **هر فریم را جدا** رندر کند، نگاهش کند، یک عدد را اصلاح کند و دوباره رندر کند. همین است که کارش را وارسی می‌کند.

## نصب

به **Node ≥ 18**، **Chrome/Edge** و **ffmpeg** نیاز دارید (نصب‌کننده بررسی می‌کند و می‌گوید چه کم است). `npm install` لازم نیست.

**Codex** (و هر ایجنتی که `~/.agents/skills` را می‌خواند):

</div>

```powershell
irm https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.ps1 | iex
```

```bash
curl -fsSL https://raw.githubusercontent.com/msmahdinejad/cinewright/main/install.sh | bash
```

<div dir="rtl">

بعد از نصب، ایجنت را کامل ببندید و دوباره باز کنید.

**Claude Code:**

</div>

```text
/plugin marketplace add msmahdinejad/cinewright
/plugin install cinewright@cinewright
```

<div dir="rtl">

**هر ایجنت دیگر:** `npx skills add msmahdinejad/cinewright` · **داکر** (بدون نصب روی سیستم): [راهنما](docs/getting-started.md#docker)

## استفاده

در یک **پوشهٔ خالی** ایجنت را باز کنید و بخواهید. در Codex اسکیل با `$` صدا زده می‌شود؛ عبارت **«go all out»** آن را وارد «حالت استودیو» می‌کند.

</div>

```text
$cinewright یک موشن‌گرافی ۱۵ ثانیه‌ای برای معرفی «سارا احمدی»،
طراح محصول ساکن تهران بساز (جزئیات را خودت بساز): نام و عنوان، سه مهارت، سه عدد (سال تجربه، پروژه، جایزه) و یک جملهٔ کوتاه. تمیز، مدرن و پرانرژی؛ متن فارسی درست شکل‌گرفته و راست‌به‌چپ. موسیقی را خودت بساز. Go all out.
```

```text
$cinewright یک اینفوگرافیک متحرک ۲۰ ثانیه‌ای با عنوان «چرا خواب مهم است» بساز: سه واقعیت، آیکون‌های متحرک، عددهای در حال شمارش، سلسله‌مراتب بصری روشن و موسیقی شاد. Go all out.
```

<div dir="rtl">

خروجی: `out/*.mp4` و همراهش `brief.md` (مفهوم، سبک، لیست شات‌ها با نام تکنیک‌ها)، `video.html` و `audio.mjs` (سورس فیلم) و `qc/` (کانتکت‌شیت و بازبینی‌های نوشته‌شده). سورس کامل فیلم‌های بالا در [`examples/`](examples/) است. پرامپت‌های بیشتر: [نمونه‌پرامپت‌ها](docs/prompts.md).

## بنچمارک: واقعاً کمک می‌کند؟

ادعا ارزان است؛ برای همین ابزار سنجش هم در ریپو هست. [`benchmark/`](benchmark/README.md) **همان پرامپت** را به ایجنت (پیش‌فرض Codex) **با اسکیل و بدون اسکیل** می‌دهد (در حالت بدون اسکیل، هر نسخهٔ نصب‌شده غیرفعال می‌شود)، بعد هر فیلم را می‌سنجد (حرکت، پُری قاب، بلندی صدا، فرایند) و یک صفحهٔ **رأی‌گیری کور A/B** برای سلیقه می‌دهد. هر ایجنت فقط با خودش مقایسه می‌شود.

</div>

```bash
node benchmark/run.mjs --suite headline --models gpt-6-astra,gpt-6.1-sol --effort xhigh   # اثبات بالا
node benchmark/rate.mjs <run-id>                                                          # رأی‌گیری کور
node benchmark/report.mjs                                                                 # → docs/benchmark.md
```

<div dir="rtl">

جدول‌ها، کانتکت‌شیت‌ها و لاگ توسعه (از جمله اولین اجرا، که اسکیل در آن *باخت*): [docs/benchmark.md](docs/benchmark.md).

## محدودیت‌ها (صادقانه)

- این ابزار **گرافیک** می‌سازد، نه عکس/فیلم واقعی: آدم و حیوان فوتورئال ندارد.
- کیفیت نهایی به ایجنت و مدل هم بستگی دارد؛ اسکیل کف کیفیت را بالا می‌برد و ابزار بهتر می‌دهد، نه اینکه شاهکار تضمین کند — و توکن بیشتری مصرف می‌کند (در اندازه‌گیری‌های ما چندین برابر اجرای ساده). بنچمارک برای همین است.
- سازهای ایرانی (سنتور، نی، تمبک، دف) شبیه‌سازی هستند، نه ضبط واقعی.
- فونت چینی/ژاپنی/کره‌ای/عبری/هندی همراه نیست (با `K.loadFonts` اضافه کنید).

## مشارکت و مجوز

تکنیک جدید برای اطلس، نتایج بنچمارک، گزارش باگ و ترجمه خوش‌آمد است — [CONTRIBUTING.md](CONTRIBUTING.md). مجوز: MIT؛ فونت‌های همراه SIL OFL (جزئیات: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)). فیلم‌هایی که می‌سازید مال خودتان است.

</div>
