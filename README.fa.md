<div dir="rtl" align="center">

<img src="docs/assets/anim/showreel-fa.webp" alt="شوریل موشن‌گرافیک که کاملاً با کد ساخته شده" width="720">

# Cinewright (سینه‌رایت)

**یک «اسکیل» برای ایجنت‌های کدنویس (Codex، Claude Code و …) که یادشان می‌دهد ویدیوهای سینمایی و حرفه‌ای بسازند — فقط با کد.**

هر فریم یک صفحهٔ WebGL/Canvas قطعی است؛ هر صدا با کد ساخته می‌شود. بدون ویدیوی استوک، بدون مدل ویدیوساز، بدون ابر. فارسی و راست‌به‌چپ درجه‌یک است.

[![CI](https://github.com/msmahdinejad/cinewright/actions/workflows/ci.yml/badge.svg)](https://github.com/msmahdinejad/cinewright/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-5b3df5.svg)](LICENSE)

[**وب‌سایت**](https://msmahdinejad.github.io/cinewright/) · [شروع سریع](docs/getting-started.md) · [اطلس تکنیک‌ها](docs/atlas.md) · [نمونه‌پرامپت‌ها](docs/prompts.md) · [بنچمارک](docs/benchmark.md) · [English](README.md)

</div>

---

<div dir="rtl">

## نمونه‌ها

<table dir="ltr">
<tr>
<td width="50%"><img src="docs/assets/anim/avorythm-turn.webp" alt="فیلم محصول فارسی: یک منشور یک صدا را به چهار خروجی می‌شکند"><br><sub>فیلم محصول (۳۰ ثانیه، متن فارسی راست‌به‌چپ، موسیقی اصلی) — <a href="https://github.com/msmahdinejad/cinewright/releases/download/v2.1.0/avorythm-film.mp4">MP4</a> · <a href="skills/cinewright/references/case-studies/avorythm/README.md">روند ساخت</a></sub></td>
<td width="50%"><img src="docs/assets/anim/cinema.webp" alt="تریلر سینمایی تیره"><br><sub>قالب سینمایی (۲۰ ثانیه) — ذرات، عنوان سه‌بعدی کروم، پرواز بر فراز شهر شبانه. <a href="https://github.com/msmahdinejad/cinewright/releases/download/v2.1.0/cinema-template.mp4">MP4</a></sub></td>
</tr>
</table>

## چرا؟

وقتی از یک ایجنت کدنویس «ویدیو» می‌خواهید، معمولاً *اسلایدشو* می‌گیرید: چند محو شدن روی یک گرادیان، بدون دوربین، با صدای تخت. این اسکیل خروجی را در سه سطح عوض می‌کند:

| سطح | چه چیزی اضافه می‌کند |
|---|---|
| **موتور** | جعبه‌ابزار GPU: ویرایشگر صحنه با **۳۲ ترنزیشن**، موتور **سه‌بعدی** (کروم، شیشه، بازتاب، عمق میدان)، **ذرات ۵۰هزارتایی** با مورف متن↔لوگو، **۲۵ پس‌زمینهٔ شیدری**، **۲۶ فیلتر**، تایپوگرافی جنبشی، دوربین سینمایی و **موتور صدا** (درام، زهی، سنتور، نی، تمبک…) |
| **دانش** | **اطلس ۲۳۹ تکنیک در ۱۷ خانواده** — هر کدام یک دستورکار کوتاه (کاربرد / روش / پرهیز / ترکیب) با کدی که در CI اجرا می‌شود — به‌علاوهٔ گالری تصویری و `inspire.mjs` که برای هر بریف سه جهت خلاقانهٔ *متفاوت* می‌دهد |
| **فرایند** | پروتکل «استودیو»: بریف ← سبک‌یابی ← اسکلت ← **سه دور صیقل** ← دروازه‌ها؛ با سنجش‌های عینی: معیار ضد-اسلایدشو، کنترل صدا، «دروازهٔ craft» (بریف نوشته شده؟ حداقل ۶ تکنیک از ۴ خانواده؟ حداقل ۴ ترنزیشن؟ سه دور بازبینی؟) و اثبات قطعی‌بودن |

چون ویدیو فقط `renderFrame(t)` است — تابعی خالص از زمان — ایجنت می‌تواند **هر فریم را جدا** رندر کند، نگاهش کند، یک عدد را اصلاح کند و دوباره رندر کند. همین است که کارش را بدون چشم و گوش وارسی می‌کند.

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
$cinewright make a dynamic 15-second motion graphics video that shows what an incredible
motion designer you are, like it's your showreel for a résumé. Go all out.
```

```text
$cinewright یک تیزر ۲۰ ثانیه‌ای سینمایی با هویت ایرانی (نقش‌های گیره‌چینی/گره‌سازی، نستعلیق،
نور و غبار) برای یک رصدخانهٔ ستاره‌شناسی بساز. موسیقی با سنتور و نی و ریتم ۶/۸ را خودت بساز.
افقی و عمودی بده. Go all out.
```

<div dir="rtl">

خروجی: `out/*.mp4` و همراهش `brief.md` (مفهوم، سبک، لیست شات‌ها با نام تکنیک‌ها)، `video.html` و `audio.mjs` (سورس فیلم) و `qc/` (کانتکت‌شیت و فایل‌های بازبینی). پرامپت‌های بیشتر: [نمونه‌پرامپت‌ها](docs/prompts.md).

## بنچمارک: واقعاً کمک می‌کند؟

ادعا ارزان است؛ برای همین ابزار سنجش هم در ریپو هست. [`benchmark/`](benchmark/README.md) **همان پرامپت** را به ایجنت (پیش‌فرض Codex) **با اسکیل و بدون اسکیل** می‌دهد (در حالت بدون اسکیل، هر نسخهٔ نصب‌شده غیرفعال می‌شود)، بعد هر فیلم را می‌سنجد (حرکت، ریتم، بلندی صدا، فرایند) و یک صفحهٔ **رأی‌گیری کور A/B** برای سلیقه می‌دهد.

</div>

```bash
node benchmark/run.mjs --suite quick     # ۳ تسک × (بدون اسکیل، با اسکیل)
node benchmark/rate.mjs <run-id>         # رأی‌گیری کور
node benchmark/report.mjs                # → docs/benchmark.md
```

<div dir="rtl">

جدول‌ها و اعداد کامل: [docs/benchmark.md](docs/benchmark.md).

## محدودیت‌ها (صادقانه)

- این ابزار **گرافیک** می‌سازد، نه عکس/فیلم واقعی: آدم و حیوان فوتورئال ندارد.
- کیفیت نهایی به ایجنت و مدل هم بستگی دارد؛ اسکیل کف کیفیت را بالا می‌برد و ابزار بهتر می‌دهد، نه اینکه شاهکار تضمین کند. بنچمارک برای همین است.
- سازهای ایرانی (سنتور، نی، تمبک، دف) شبیه‌سازی هستند، نه ضبط واقعی.
- فونت چینی/ژاپنی/کره‌ای/عبری/هندی همراه نیست (با `K.loadFonts` اضافه کنید).

## مشارکت و مجوز

تکنیک جدید برای اطلس، نتایج بنچمارک، گزارش باگ و ترجمه خوش‌آمد است — [CONTRIBUTING.md](CONTRIBUTING.md). مجوز: MIT؛ فونت‌های همراه SIL OFL (جزئیات: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)). فیلم‌هایی که می‌سازید مال خودتان است.

</div>
