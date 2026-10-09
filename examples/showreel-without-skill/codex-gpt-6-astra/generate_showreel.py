from __future__ import annotations

import math
import os
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DURATION = 1280, 720, 30, 15
FRAMES = FPS * DURATION
ROOT = Path(__file__).resolve().parent

FONT_HEAVY = r"C:\Windows\Fonts\arialbd.ttf"
FONT_BODY = r"C:\Windows\Fonts\bahnschrift.ttf"
FONT_MONO = r"C:\Windows\Fonts\consolab.ttf"

rng = np.random.default_rng(23)
PARTICLES = np.column_stack([
    rng.uniform(-1.0, 1.0, 280),
    rng.uniform(-1.0, 1.0, 280),
    rng.uniform(0.1, 1.0, 280),
    rng.uniform(0.0, 1.0, 280),
])
STARS = np.column_stack([
    rng.uniform(0, W, 160),
    rng.uniform(0, H, 160),
    rng.uniform(0.3, 1.0, 160),
])


def font(path: str, size: int):
    return ImageFont.truetype(path, size)


def ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def ease_in_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def clamp(x: float, low=0.0, high=1.0) -> float:
    return max(low, min(high, x))


def rgba(hex_color: str, alpha: int = 255):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def text_size(draw, text, f):
    box = draw.textbbox((0, 0), text, font=f)
    return box[2] - box[0], box[3] - box[1]


def centered(draw, xy, text, f, fill, anchor="mm", stroke=0, stroke_fill=None):
    draw.text(xy, text, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=stroke_fill)


def add_glow(canvas: Image.Image, draw_fn, blur=24, opacity=170):
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    draw_fn(glow_draw)
    glow = glow.filter(ImageFilter.GaussianBlur(blur))
    if opacity != 255:
        a = glow.getchannel("A").point(lambda p: int(p * opacity / 255))
        glow.putalpha(a)
    canvas.alpha_composite(glow)


def background(t: float) -> Image.Image:
    yy, xx = np.mgrid[0:H, 0:W]
    u = xx / W
    v = yy / H
    glow1 = np.exp(-((u - 0.73) ** 2 / 0.12 + (v - 0.32) ** 2 / 0.24))
    glow2 = np.exp(-((u - 0.18) ** 2 / 0.18 + (v - 0.78) ** 2 / 0.14))
    pulse = 0.5 + 0.5 * math.sin(t * 2.4)
    r = 5 + 17 * glow1 + 5 * glow2
    g = 8 + 7 * glow1 + 11 * glow2
    b = 19 + 26 * glow1 + 25 * glow2 + pulse * 4
    vignette = 1 - 0.30 * np.clip(np.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2) * 1.2, 0, 1)
    arr = np.dstack([r, g, b]) * vignette[..., None]
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, "RGB").convert("RGBA")


def draw_grid(canvas: Image.Image, t: float, intensity=1.0, horizon=0.58):
    d = ImageDraw.Draw(canvas, "RGBA")
    vanishing = (W * 0.53, H * horizon)
    grid_y = H * 0.78
    scroll = (t * 0.28) % 1.0
    for i in range(18):
        p = (i + scroll) / 18
        y = H * 0.57 + (p ** 1.75) * (grid_y - H * 0.57)
        alpha = int(42 * intensity * (1 - p * 0.6))
        d.line([(0, y), (W, y)], fill=(105, 155, 255, alpha), width=1)
    for x in np.linspace(-W * 0.9, W * 1.8, 22):
        d.line([vanishing, (x, H)], fill=(100, 130, 255, int(32 * intensity)) , width=1)
    d.line([(0, H * horizon), (W, H * horizon)], fill=(118, 180, 255, int(70 * intensity)), width=1)


def draw_particles(canvas: Image.Image, t: float, amount=1.0):
    d = ImageDraw.Draw(canvas, "RGBA")
    for px, py, pz, ph in PARTICLES:
        z = (pz + t * (0.12 + pz * 0.24)) % 1.0
        x = W * 0.5 + px * W * (0.12 + z * 0.72)
        y = H * 0.52 + py * H * (0.08 + z * 0.48)
        if -20 < x < W + 20 and -20 < y < H + 20:
            r = max(1, int((1.2 + 4.5 * z) * amount))
            alpha = int(24 + 145 * z * amount)
            color = (78 + int(70 * ph), 164 + int(55 * ph), 255, alpha)
            d.ellipse((x - r, y - r, x + r, y + r), fill=color)


def draw_orbit(canvas: Image.Image, t: float, center, radius, color, spin=1.0, scale=1.0):
    cx, cy = center
    d = ImageDraw.Draw(canvas, "RGBA")
    pts = []
    for k in range(70):
        a = k / 69 * math.tau + t * spin
        wobble = 1 + 0.05 * math.sin(a * 3 + t * 4)
        x = cx + math.cos(a) * radius * wobble
        y = cy + math.sin(a) * radius * 0.33 * wobble
        pts.append((x, y))
    d.line(pts, fill=(*color, 120), width=max(1, int(2 * scale)))
    d.line(pts[::2], fill=(*color, 235), width=max(1, int(1 * scale)))


def draw_wire_cube(canvas: Image.Image, t: float, cx, cy, size, color, rotate=0.0, alpha=180):
    d = ImageDraw.Draw(canvas, "RGBA")
    pts = []
    for z in (-1, 1):
        for y in (-1, 1):
            for x in (-1, 1):
                xx = x * size * 0.5
                yy = y * size * 0.5
                zz = z * size * 0.5
                ca, sa = math.cos(rotate), math.sin(rotate)
                rx = xx * ca - zz * sa
                rz = xx * sa + zz * ca
                perspective = 1 + rz / (size * 3.0)
                pts.append((cx + rx * perspective, cy + (yy + rz * 0.22) * perspective))
    edges = [(0, 1), (0, 2), (0, 4), (3, 1), (3, 2), (3, 7), (5, 1), (5, 4), (5, 7), (6, 2), (6, 4), (6, 7)]
    for a, b in edges:
        d.line([pts[a], pts[b]], fill=(*color, alpha), width=2)


def draw_type_stack(canvas: Image.Image, t: float):
    d = ImageDraw.Draw(canvas, "RGBA")
    big = font(FONT_HEAVY, 104)
    mid = font(FONT_BODY, 22)
    words = [("TYPE", (255, 255, 255)), ("FORM", (105, 211, 255)), ("RHYTHM", (255, 94, 196))]
    for i, (word, col) in enumerate(words):
        local = clamp((t - (5.0 + i * 0.38)) / 0.8)
        x = 160 + ease_out(local) * (i * 12)
        y = 276 + i * 90 + math.sin(t * 2.0 + i) * 3
        jitter = math.sin(t * 17 + i) * 2
        centered(d, (x + jitter, y), word, big, (*col, 238), anchor="lm", stroke=2, stroke_fill=(2, 4, 15, 180))
        d.rectangle((x + 420, y - 39, x + 420 + 82 + i * 34, y - 35), fill=(*col, 190))
    centered(d, (162, 182), "A STUDY IN MOTION", mid, (160, 185, 215, 220), anchor="lm")


def draw_scene(t: float) -> Image.Image:
    canvas = background(t)
    d = ImageDraw.Draw(canvas, "RGBA")
    draw_particles(canvas, t, 0.8)
    draw_grid(canvas, t, 0.85, 0.58)

    cyan = (73, 210, 255)
    pink = (255, 80, 186)
    violet = (146, 107, 255)
    white = (245, 248, 255)

    if t < 3.2:
        p = clamp(t / 2.1)
        cx = W * 0.72 + math.sin(t * 1.2) * 18
        cy = H * 0.48 + math.cos(t * 1.5) * 10
        for j in range(8):
            rr = 150 + j * 20 + math.sin(t * 2 + j) * 7
            col = cyan if j % 2 == 0 else violet
            draw_orbit(canvas, t, (cx, cy), rr * (0.65 + 0.35 * p), col, spin=0.2 + j * 0.08, scale=1.0)
        add_glow(canvas, lambda gd: gd.ellipse((cx - 56, cy - 56, cx + 56, cy + 56), fill=(*pink, 230)), blur=38, opacity=150)
        d.ellipse((cx - 42, cy - 42, cx + 42, cy + 42), fill=(*pink, 220), outline=(*white, 180), width=2)
        d.ellipse((cx - 22, cy - 22, cx + 22, cy + 22), fill=(12, 18, 42, 255))
        big = font(FONT_HEAVY, 76)
        small = font(FONT_MONO, 16)
        x0 = 105 - ease_out(clamp((t - 0.15) / 0.8)) * 20
        centered(d, (x0, 188), "MOTION", big, (*white, 245), anchor="lm", stroke=1, stroke_fill=(4, 8, 24, 220))
        centered(d, (x0 + 5, 263), "DESIGN", big, (*cyan, 245), anchor="lm", stroke=1, stroke_fill=(4, 8, 24, 220))
        d.rectangle((x0, 311, x0 + 245, 316), fill=(*pink, 220))
        centered(d, (x0, 346), "CODED SHOWREEL / 2026", small, (171, 195, 228, 230), anchor="lm")
        centered(d, (W - 104, H - 46), "01 / 04", small, (145, 175, 215, 220), anchor="rm")
        if t > 2.25:
            q = ease_out(clamp((t - 2.25) / 0.85))
            d.rectangle((0, 0, int(W * q), H), fill=(7, 9, 25, int(190 * q)))

    elif t < 6.0:
        q = clamp((t - 3.2) / 2.8)
        skew = (1 - q) * 48
        title = font(FONT_HEAVY, 92)
        sub = font(FONT_BODY, 19)
        centered(d, (W * 0.5 + skew, 176), "SYSTEMS", title, (*white, 248), anchor="mm", stroke=2, stroke_fill=(4, 7, 24, 200))
        centered(d, (W * 0.5 - skew, 266), "THAT MOVE", title, (*pink, 248), anchor="mm", stroke=2, stroke_fill=(4, 7, 24, 200))
        centered(d, (W * 0.5, 342), "COMPOSITION  /  TIMING  /  IMPACT", sub, (158, 195, 224, 235), anchor="mm")
        for i in range(11):
            x = 120 + i * 104
            h = 105 + 92 * (0.5 + 0.5 * math.sin(t * 4.2 + i * 0.65))
            w = 38 + 10 * math.sin(t * 2.2 + i)
            y = 598 - h
            col = cyan if i % 3 == 0 else (pink if i % 3 == 1 else violet)
            d.rounded_rectangle((x, y, x + w, 598), radius=8, fill=(*col, 196), outline=(255, 255, 255, 80), width=1)
            d.rectangle((x, y - 9, x + w, y - 4), fill=(*white, 145))
        centered(d, (W - 104, H - 46), "02 / 04", font(FONT_MONO, 16), (145, 175, 215, 220), anchor="rm")

    elif t < 10.2:
        draw_type_stack(canvas, t)
        # elastic bars
        for i in range(5):
            x = 872 + i * 38
            y = 200 + math.sin(t * 3.0 + i) * 28
            d.rounded_rectangle((x, y, x + 20, y + 260 + i * 25), radius=10, fill=(*([cyan, pink, violet, white, cyan][i]), 150), outline=(*white, 100), width=1)
        centered(d, (W - 104, H - 46), "03 / 04", font(FONT_MONO, 16), (145, 175, 215, 220), anchor="rm")
        if t > 9.5:
            fade = ease_in_out(clamp((t - 9.5) / 0.7))
            d.rectangle((0, 0, W, H), fill=(4, 5, 16, int(220 * fade)))

    else:
        q = clamp((t - 10.2) / 4.8)
        center = (W * 0.5, H * 0.47)
        for j in range(9):
            a = t * (0.25 + j * 0.035) + j * 0.6
            rr = 54 + j * 36 + math.sin(t * 1.8 + j) * 6
            col = [cyan, violet, pink][j % 3]
            draw_orbit(canvas, t, center, rr, col, spin=0.35 + j * 0.05, scale=1.0)
        draw_wire_cube(canvas, t, center[0], center[1], 270 + math.sin(t * 2) * 12, cyan, rotate=t * 0.45, alpha=155)
        draw_wire_cube(canvas, t, center[0], center[1], 188 + math.sin(t * 1.7) * 10, pink, rotate=-t * 0.7, alpha=135)
        big = font(FONT_HEAVY, 58)
        sub = font(FONT_BODY, 20)
        mono = font(FONT_MONO, 16)
        title_y = 92 - min(q, 0.6) * 24
        centered(d, (W * 0.5, title_y), "MAKE THE FRAME MOVE", big, (*white, 244), anchor="ma", stroke=1, stroke_fill=(4, 6, 18, 220))
        centered(d, (W * 0.5, title_y + 66), "MOTION DESIGNER  /  DIRECTOR  /  BUILDER", sub, (*cyan, 235), anchor="ma")
        d.line([(W * 0.5 - 245, title_y + 101), (W * 0.5 + 245, title_y + 101)], fill=(*pink, 195), width=2)
        # Footer lockup
        left = 74
        centered(d, (left, H - 76), "SHOWREEL / 15 SEC", mono, (182, 205, 234, 230), anchor="lm")
        centered(d, (W - 74, H - 76), "SELECTED WORK / 2026", mono, (182, 205, 234, 230), anchor="rm")
        if t > 13.8:
            fade = ease_in_out(clamp((t - 13.8) / 1.2))
            d.rectangle((0, 0, W, H), fill=(255, 255, 255, int(18 * fade)))
        centered(d, (W - 104, H - 46), "04 / 04", mono, (145, 175, 215, 220), anchor="rm")

    # global scanline and micro UI details
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay, "RGBA")
    for y in range(0, H, 6):
        od.line([(0, y), (W, y)], fill=(255, 255, 255, 5), width=1)
    od.rectangle((34, 34, W - 34, H - 34), outline=(130, 170, 255, 50), width=1)
    od.line([(34, H - 52), (215, H - 52)], fill=(*cyan, 90), width=1)
    canvas.alpha_composite(overlay)
    return canvas.convert("RGB")


def add_audio(path: Path):
    sr = 44100
    n = int(sr * DURATION)
    tt = np.arange(n, dtype=np.float64) / sr
    audio = np.zeros((n, 2), dtype=np.float64)

    def add_mono(signal, start, gain=1.0, pan=0.0):
        start_i = int(start * sr)
        if start_i >= n:
            return
        end_i = min(n, start_i + len(signal))
        if end_i <= start_i:
            return
        chunk = signal[: end_i - start_i] * gain
        left = math.sqrt((1 - pan) * 0.5)
        right = math.sqrt((1 + pan) * 0.5)
        audio[start_i:end_i, 0] += chunk * left
        audio[start_i:end_i, 1] += chunk * right

    def kick(length=0.42):
        x = np.arange(int(sr * length)) / sr
        f = 155 * np.exp(-x * 18) + 45
        phase = 2 * np.pi * np.cumsum(f) / sr
        return np.sin(phase) * np.exp(-x * 12) + 0.22 * np.sin(phase * 2.01) * np.exp(-x * 22)

    def snare(length=0.22):
        x = np.arange(int(sr * length)) / sr
        noise = rng.normal(0, 1, len(x))
        tone = np.sin(2 * np.pi * 190 * x)
        return (noise * 0.62 + tone * 0.35) * np.exp(-x * 20)

    def hat(length=0.07):
        x = np.arange(int(sr * length)) / sr
        noise = rng.normal(0, 1, len(x))
        return noise * np.exp(-x * 65)

    def bass(freq, length=0.42):
        x = np.arange(int(sr * length)) / sr
        env = np.minimum(1, x * 90) * np.exp(-x * 4.5)
        wobble = 1.0 + 0.008 * np.sin(2 * np.pi * 5 * x)
        return (np.sin(2 * np.pi * freq * wobble * x) + 0.25 * np.sin(2 * np.pi * freq * 2 * x)) * env

    def blip(freq, length=0.18):
        x = np.arange(int(sr * length)) / sr
        env = np.minimum(1, x * 120) * np.exp(-x * 18)
        return (np.sin(2 * np.pi * freq * x) + 0.2 * np.sin(2 * np.pi * freq * 2.01 * x)) * env

    beat = 0.5
    for i in range(int(DURATION / beat)):
        t = i * beat
        add_mono(kick(), t, 0.66, 0.0)
        if i % 2 == 1:
            add_mono(snare(), t, 0.18, -0.05)
        add_mono(hat(), t + 0.25, 0.08, 0.15)
        add_mono(hat(), t + 0.375, 0.055, -0.18)
        root = [55.0, 65.41, 73.42, 82.41][(i // 2) % 4]
        add_mono(bass(root, 0.46), t, 0.24, -0.05)
        add_mono(blip(root * 4, 0.16), t + 0.125, 0.08, 0.2)
        add_mono(blip(root * 5, 0.14), t + 0.375, 0.07, -0.2)

    # rising tonal texture for the transition into the final card
    rise_start = int(9.2 * sr)
    rise_len = int(3.1 * sr)
    x = np.arange(rise_len) / sr
    freq = 90 + 1200 * (x / x[-1]) ** 2
    phase = 2 * np.pi * np.cumsum(freq) / sr
    riser = np.sin(phase) * (x / x[-1]) ** 1.8 * 0.12
    add_mono(riser, 9.2, 0.32, 0.0)

    # wide pad and final hit
    pad = np.zeros(int(sr * 2.4))
    x = np.arange(len(pad)) / sr
    for f in (110, 164.81, 220):
        pad += np.sin(2 * np.pi * f * x) * 0.08
    pad *= np.minimum(1, x * 8) * np.exp(-x * 0.45)
    add_mono(pad, 12.6, 0.35, 0.0)
    add_mono(kick(0.8), 13.98, 0.85, 0.0)
    add_mono(snare(0.35), 14.02, 0.22, 0.0)

    # subtle echo gives the minimal mix a finished edge
    dry = audio.copy()
    for delay, gain in ((0.12, 0.16), (0.24, 0.09), (0.37, 0.05)):
        shift = int(delay * sr)
        audio[shift:] += dry[:-shift] * gain
    audio = np.tanh(audio * 1.3) * 0.78
    pcm = np.clip(audio * 32767, -32768, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes(pcm.tobytes())


def main():
    audio_path = ROOT / "showreel_audio.wav"
    add_audio(audio_path)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(audio_path),
        "-t", str(DURATION), "-c:v", "libx264", "-preset", "medium", "-crf", "17",
        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
        str(ROOT / "final.mp4"),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for i in range(FRAMES):
            frame = draw_scene(i / FPS)
            proc.stdin.write(frame.tobytes())
            if i % 30 == 0:
                print(f"frame {i + 1}/{FRAMES}", flush=True)
    finally:
        proc.stdin.close()
        rc = proc.wait()
    if rc != 0:
        raise SystemExit(rc)
    audio_path.unlink(missing_ok=True)
    print(f"wrote {ROOT / 'final.mp4'}")


if __name__ == "__main__":
    main()
