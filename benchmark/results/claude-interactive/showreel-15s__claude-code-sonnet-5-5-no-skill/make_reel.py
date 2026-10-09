"""Motion-designer showreel, 15 s, 1280x720 @ 30 fps — frames with Pillow/numpy, sound with numpy, muxed with ffmpeg.
Written without any skill: just the tools on the machine (Python, Pillow, numpy, ffmpeg)."""
import math, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS, DUR = 1280, 720, 30, 15.0
N = int(FPS * DUR)
OUT = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(OUT, 'frames'); os.makedirs(FR, exist_ok=True)

BG = (11, 13, 28); INK = (245, 244, 238); CORAL = (255, 91, 87); TEAL = (32, 214, 196); GOLD = (255, 198, 60); VIOLET = (123, 97, 255)
FONTS = 'C:/Windows/Fonts/'
def font(name, size): return ImageFont.truetype(FONTS + name, int(size))

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def ease_out(x): x = clamp(x); return 1 - (1 - x) ** 3
def ease_in_out(x): x = clamp(x); return 3 * x * x - 2 * x ** 3
def ease_back(x): x = clamp(x); c1 = 1.70158; c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def seg(t, a, b): return clamp((t - a) / (b - a))
def lerp(a, b, k): return a + (b - a) * k
def mix(c1, c2, k): return tuple(int(lerp(c1[i], c2[i], k)) for i in range(3))

yy, xx = np.mgrid[0:H, 0:W]
GRAD = np.zeros((H, W, 3), np.float32)
d = np.sqrt(((xx - W * .5) / W) ** 2 + ((yy - H * .5) / H) ** 2)
for i in range(3): GRAD[..., i] = np.array(BG)[i] * (1.0 + .9 * (1 - np.clip(d * 1.6, 0, 1)))

def new_frame(tint=None):
    a = GRAD.copy()
    if tint is not None: a = a * .75 + np.array(tint, np.float32) * .25
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def text_center(dr, s, cx, cy, f, fill, anchor='mm'): dr.text((cx, cy), s, font=f, fill=fill, anchor=anchor)

def ring(dr, cx, cy, r, w, col):
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=int(max(1, w)))

# ---------------------------------------------------------------- scenes
def scene_intro(t, img):                                   # 0 - 2.6 s: title
    dr = ImageDraw.Draw(img, 'RGBA'); cx, cy = W / 2, H / 2
    k = ease_out(seg(t, 0, 1.0))
    r = lerp(0, 520, k); ring(dr, cx, cy, r, 6, CORAL + (255,)); ring(dr, cx, cy, r * .72, 3, TEAL + (200,))
    f = font('impact.ttf', 150)
    word = 'MOTION'
    x0 = cx - dr.textlength(word, font=f) / 2
    for i, ch in enumerate(word):
        a = ease_back(seg(t, .25 + i * .07, .8 + i * .07))
        y = cy - 20 + (1 - a) * 160
        al = int(255 * clamp(a * 1.4))
        dr.text((x0, y), ch, font=f, fill=INK + (al,), anchor='lm'); x0 += dr.textlength(ch, font=f)
    f2 = font('arialbd.ttf', 34); s = 'D E S I G N   R E E L   2 0 2 6'
    a = ease_out(seg(t, 1.1, 1.8)); text_center(dr, s, cx, cy + 110, f2, GOLD + (int(255 * a),))
    ln = lerp(0, 560, ease_in_out(seg(t, 1.0, 1.9))); dr.rectangle([cx - ln / 2, cy + 150, cx + ln / 2, cy + 154], fill=CORAL + (255,))

def scene_shapes(t, img):                                  # 2.6 - 5.4 s: geometry
    s = Image.new('RGBA', (W * 2, H * 2), (0, 0, 0, 0)); dr = ImageDraw.Draw(s)
    cx, cy = W, H
    for gx in range(0, W * 2, 120):
        for gy in range(0, H * 2, 120): dr.ellipse([gx - 3, gy - 3, gx + 3, gy + 3], fill=INK + (60,)) if False else dr.ellipse([gx - 3, gy - 3, gx + 3, gy + 3], fill=(255, 255, 255, 38))
    for i in range(9):
        k = ease_out(seg(t, i * .05, .7 + i * .05)); ang = t * (.8 + i * .08) + i * .7
        rad = (80 + i * 56) * k * 2
        col = [CORAL, TEAL, GOLD, VIOLET][i % 4]
        n = 3 + i % 4
        pts = [(cx + rad * math.cos(ang + j * 2 * math.pi / n), cy + rad * math.sin(ang + j * 2 * math.pi / n)) for j in range(n)]
        dr.polygon(pts, fill=col + (36,), outline=col + (230,), width=6)
    for i in range(5):
        a = t * 2 + i * 1.256; rr = 300 * 2
        x = cx + rr * math.cos(a) * .9; y = cy + rr * math.sin(a) * .55
        dr.ellipse([x - 28, y - 28, x + 28, y + 28], fill=[GOLD, CORAL, TEAL, VIOLET, INK][i] + (255,))
    s = s.resize((W, H), Image.LANCZOS); img.paste(s, (0, 0), s)
    dr = ImageDraw.Draw(img, 'RGBA'); f = font('arialbd.ttf', 40)
    a = ease_out(seg(t, .5, 1.1)); text_center(dr, 'SHAPE · RHYTHM · SPACE', W / 2, H - 70, f, INK + (int(255 * a),))

def scene_words(t, img):                                   # 5.4 - 8.4 s: kinetic words
    dr = ImageDraw.Draw(img, 'RGBA'); words = ['DESIGN', 'ANIMATE', 'CREATE']; cols = [CORAL, TEAL, GOLD]
    idx = min(2, int(t / 1.0)); lt = t - idx * 1.0
    f = font('impact.ttf', 230 * (.92 + .08 * ease_back(seg(lt, 0, .35))))
    sc = lerp(1.25, 1.0, ease_out(seg(lt, 0, .3))); al = 255 if lt < .85 else int(255 * (1 - seg(lt, .85, 1.0)))
    bar = ease_out(seg(lt, 0, .3)) * W
    dr.rectangle([0, 0, bar, H], fill=cols[idx] + (255,))
    for k in range(1, 4):
        e = ease_out(seg(lt, k * .03, .3 + k * .03)); dr.text((W / 2 + (1 - e) * 500 * k, H / 2), words[idx], font=f, fill=BG + (int(70 / k),), anchor='mm')
    dr.text((W / 2, H / 2), words[idx], font=f, fill=BG + (al,), anchor='mm')
    f2 = font('arialbd.ttf', 28); dr.text((60, 50), f'0{idx + 1} / 03', font=f2, fill=INK + (200,))

def scene_data(t, img):                                    # 8.4 - 11.2 s: data
    dr = ImageDraw.Draw(img, 'RGBA'); vals = [.35, .52, .44, .71, .63, .9]
    bw = 110; x0 = (W - 6 * 140 + 30) / 2; base = H - 150
    dr.line([(x0 - 30, base + 8), (x0 + 6 * 140, base + 8)], fill=INK + (150,), width=3)
    for i, v in enumerate(vals):
        k = ease_out(seg(t, .1 + i * .1, .8 + i * .1)); h = 380 * v * k
        col = mix(TEAL, CORAL, i / 5)
        dr.rounded_rectangle([x0 + i * 140, base - h, x0 + i * 140 + bw, base], radius=10, fill=col + (255,))
        if k > .8: dr.text((x0 + i * 140 + bw / 2, base + 34), ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'][i], font=font('arialbd.ttf', 26), fill=INK + (200,), anchor='mm')
    pts = [(x0 + i * 140 + bw / 2, base - 380 * v * ease_out(seg(t, .1 + i * .1, .8 + i * .1)) - 40) for i, v in enumerate(vals)]
    m = int(seg(t, .2, 1.6) * (len(pts) - 1)) + 1
    if m > 1: dr.line(pts[:m], fill=GOLD + (255,), width=6)
    num = int(lerp(0, 128, ease_out(seg(t, .3, 1.7))))
    f = font('impact.ttf', 150); dr.text((W / 2, 130), f'+{num}%', font=f, fill=INK + (255,), anchor='mm')
    f2 = font('arialbd.ttf', 34); dr.text((W / 2, 225), 'AUDIENCE GROWTH', font=f2, fill=TEAL + (255,), anchor='mm')

def scene_burst(t, img):                                   # 11.2 - 13.4 s: particles
    dr = ImageDraw.Draw(img, 'RGBA'); rng = np.random.default_rng(7); cx, cy = W / 2, H / 2
    for i in range(240):
        a = rng.uniform(0, 2 * math.pi); sp = rng.uniform(120, 760); life = rng.uniform(.8, 1.0)
        r = sp * ease_out(t / 1.6) * (1.0)
        x = cx + r * math.cos(a); y = cy + r * math.sin(a) + 120 * t * t
        al = int(255 * clamp(1 - t / 2.1)); sz = rng.uniform(3, 9)
        col = [CORAL, TEAL, GOLD, VIOLET, INK][i % 5]
        dr.ellipse([x - sz, y - sz, x + sz, y + sz], fill=col + (al,))
    ring(dr, cx, cy, ease_out(t / 1.1) * 600, 5, INK + (int(255 * clamp(1 - t / 1.1)),))
    for i in range(48):
        a = i / 48 * 2 * math.pi; r1 = 90 + 700 * ease_out(t / 1.0); r0 = max(0, r1 - 260)
        dr.line([(cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + r1 * math.cos(a), cy + r1 * math.sin(a))], fill=(255, 255, 255, int(120 * clamp(1 - t / 1.3))), width=3)
    f = font('impact.ttf', 190); a = ease_back(seg(t, .35, .9))
    dr.text((cx + 8, cy + 8), 'ALL OUT', font=f, fill=CORAL + (int(255 * clamp(a)),), anchor='mm')
    dr.text((cx, cy), 'ALL OUT', font=f, fill=INK + (int(255 * clamp(a)),), anchor='mm')

def scene_outro(t, img):                                   # 13.4 - 15 s: name card
    dr = ImageDraw.Draw(img, 'RGBA'); cx, cy = W / 2, H / 2
    k = ease_out(seg(t, 0, .6))
    dr.rectangle([cx - 420 * k, cy - 2, cx + 420 * k, cy + 2], fill=CORAL + (255,))
    f = font('impact.ttf', 96); a = int(255 * ease_out(seg(t, .15, .7))); dr.text((cx, cy - 70 + (1 - k) * 30), 'ALEX RIVERA', font=f, fill=INK + (a,), anchor='mm')
    f2 = font('arialbd.ttf', 36); a2 = int(255 * ease_out(seg(t, .4, .9))); dr.text((cx, cy + 60), 'MOTION DESIGNER  ·  alex@rivera.studio', font=f2, fill=GOLD + (a2,), anchor='mm')

SCENES = [(0, 2.6, scene_intro), (2.6, 5.4, scene_shapes), (5.4, 8.4, scene_words), (8.4, 11.2, scene_data), (11.2, 13.4, scene_burst), (13.4, 15.0, scene_outro)]

def post(img, t, a, b):
    """slow zoom per scene, a bloom, a flash at each cut and a vignette"""
    lt = t - a; z = 1.0 + .06 * (lt / (b - a))
    cw, ch = W / z, H / z; img = img.crop((int((W - cw) / 2), int((H - ch) / 2), int((W + cw) / 2), int((H + ch) / 2))).resize((W, H), Image.BILINEAR)
    small = img.resize((W // 4, H // 4)).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BILINEAR)
    arr = np.asarray(img, np.float32) + np.asarray(small, np.float32) * .35
    if a > 0 and lt < .18: arr += 255 * (1 - lt / .18) * .6
    d = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H / 2) / H) ** 2); arr *= (1 - np.clip(d - .35, 0, 1) * .9)[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

def render_frame(i):
    t = i / FPS
    for a, b, fn in SCENES:
        if a <= t < b or (b == DUR and t >= a):
            img = new_frame()
            fn(t - a, img)
            return post(img, t, a, b)
    return new_frame()

# ---------------------------------------------------------------- sound
SR = 44100
def render_audio():
    n = int(SR * DUR); L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    bpm = 124; beat = 60 / bpm
    def put(sig, t0, gain=1.0, pan=0.0):
        i0 = int(t0 * SR)
        if i0 >= n: return
        s = sig[:n - i0] * gain
        L[i0:i0 + len(s)] += s * (1 - max(0, pan)); R[i0:i0 + len(s)] += s * (1 + min(0, pan))
    def kick():
        t = np.arange(int(.35 * SR)) / SR; f = 50 + 120 * np.exp(-t * 28); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) * np.exp(-t * 9)).astype(np.float32)
    def hat():
        t = np.arange(int(.08 * SR)) / SR; nz = np.random.default_rng(1).standard_normal(len(t)); nz = np.diff(nz, prepend=0)
        return (nz * np.exp(-t * 60) * .5).astype(np.float32)
    def clap():
        t = np.arange(int(.2 * SR)) / SR; nz = np.random.default_rng(2).standard_normal(len(t)); return (nz * np.exp(-t * 22) * .5).astype(np.float32)
    def bass(f0, dur):
        t = np.arange(int(dur * SR)) / SR; s = np.sign(np.sin(2 * np.pi * f0 * t)) * .3 + np.sin(2 * np.pi * f0 * t) * .6
        return (s * np.exp(-t * 3.5)).astype(np.float32)
    def pad(f0, dur):
        t = np.arange(int(dur * SR)) / SR; s = sum(np.sin(2 * np.pi * f0 * m * t + p) for m, p in [(1, 0), (1.005, 1), (2, 2), (3.01, 3)]) / 4
        env = np.minimum(1, t / .4) * np.exp(-t * .5); return (s * env * .35).astype(np.float32)
    def riser(dur):
        t = np.arange(int(dur * SR)) / SR; nz = np.random.default_rng(3).standard_normal(len(t)); nz = np.diff(nz, prepend=0)
        return (nz * (t / dur) ** 2 * .35).astype(np.float32)
    def pluck(f0):
        t = np.arange(int(.4 * SR)) / SR; return (np.sin(2 * np.pi * f0 * t) * np.exp(-t * 9) * .4).astype(np.float32)
    notes = [55.0, 55.0, 65.41, 49.0]                     # A1 A1 C2 G1
    for b in range(int(DUR / beat) + 1):
        t0 = b * beat
        if t0 > 13.4: break
        put(kick(), t0, .9)
        if b % 2 == 1: put(clap(), t0, .45)
        put(hat(), t0 + beat / 2, .35, .3)
        put(bass(notes[(b // 4) % 4], beat * .9), t0, .55)
        put(pluck([440, 523.25, 659.25, 587.33][b % 4]), t0 + beat / 2, .35, -.3)
    for ci, f0 in enumerate([220, 261.6, 196]): put(pad(f0, 4.5), ci * 4.0 + .2, .7, 0)
    put(riser(2.6), 0, .6); put(riser(1.0), 10.2, .8)
    for cut in (2.6, 5.4, 8.4, 11.2, 13.4): put(riser(.45), cut - .4, .5)
    put(kick(), 13.4, 1.3); put(pad(110, 1.6), 13.4, 1.0)
    m = max(np.abs(L).max(), np.abs(R).max()); L /= m * 1.05; R /= m * 1.05
    fade = np.minimum(1, (n - np.arange(n)) / (.5 * SR)); L *= fade; R *= fade
    st = np.stack([L, R], 1); pcm = (st * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, 'audio.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'stills':
        for t in [float(x) for x in sys.argv[2:]]:
            render_frame(int(t * FPS)).save(os.path.join(OUT, f'still_{t:.1f}.png'))
        sys.exit(0)
    render_audio()
    for i in range(N):
        render_frame(i).save(os.path.join(FR, f'f{i:04d}.png'))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(FR, 'f%04d.png'), '-i', os.path.join(OUT, 'audio.wav'),
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-shortest', os.path.join(OUT, 'final.mp4')], check=True)
    print('done', os.path.join(OUT, 'final.mp4'))
