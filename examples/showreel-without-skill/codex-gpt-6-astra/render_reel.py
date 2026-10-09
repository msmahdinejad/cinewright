from __future__ import annotations

import math
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / '.deps'))

import moderngl
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont
from scipy.signal import butter, sosfilt

WIDTH, HEIGHT, FPS = 1920, 1080, 60
DURATION = 15
INK = (21, 23, 22)
PAPER = (240, 237, 229)
ORANGE = (255, 77, 31)
ACID = (218, 249, 82)
MUTED = (116, 119, 109)
BOLD = r'C:\Windows\Fonts\arialbd.ttf'
MONO = r'C:\Windows\Fonts\consola.ttf'


def smooth(value):
    value = np.clip(value, 0.0, 1.0)
    return float(value * value * (3.0 - 2.0 * value))


def out(value):
    return 1.0 - (1.0 - float(np.clip(value, 0.0, 1.0))) ** 4


def spring(value):
    value = max(0.0, value)
    return 1.0 - math.exp(-value * 8.0) * math.cos(value * 10.0)


@lru_cache(maxsize=256)
def mask_for(text, face=BOLD):
    font = ImageFont.truetype(face, 300)
    bounds = font.getbbox(text)
    mask = Image.new('L', (bounds[2] - bounds[0] + 8, bounds[3] - bounds[1] + 8))
    ImageDraw.Draw(mask).text((4 - bounds[0], 4 - bounds[1]), text, font=font, fill=255)
    return mask


def word(image, text, box, fill=INK, outline=False, opacity=255):
    left, top, width, height = [int(round(value)) for value in box]
    if width <= 0 or height <= 0:
        return
    mask = mask_for(text).resize((width, height), Image.Resampling.LANCZOS)
    if outline:
        mask = ImageChops.subtract(mask, mask.filter(ImageFilter.MinFilter(5)))
    if opacity != 255:
        mask = mask.point(lambda value: value * opacity // 255)
    patch = Image.new('RGBA', mask.size, fill + (255,))
    patch.putalpha(mask)
    image.alpha_composite(patch, (left, top))


def elastic_word(image, text, box, time, fill, phase=0):
    left, top, width, height = box
    reference_height = mask_for('H').height
    weights = [mask_for(character).width * (1 + 0.11 * math.sin(time * 7 + index * 1.3 + phase)) for index, character in enumerate(text)]
    available = width - 10 * (len(text) - 1)
    total = sum(weights)
    for index, character in enumerate(text):
        letter_width = weights[index] / total * available
        fluctuation = math.sin(time * 7 + index * 0.9 + phase)
        letter_height = height * mask_for(character).height / reference_height * (1 + 0.10 * fluctuation)
        baseline = top + height + 11 * fluctuation
        word(image, character, (left, baseline - letter_height, letter_width, letter_height), fill)
        left += letter_width + 10


@lru_cache(maxsize=64)
def get_font(size, face=MONO):
    return ImageFont.truetype(face, size)


def label(image, text, position, fill=INK, size=20, anchor='la'):
    ImageDraw.Draw(image).text(position, text, fill=fill + (255,), font=get_font(size), anchor=anchor)


def line(image, points, color, width=1):
    ImageDraw.Draw(image).line(points, fill=color + (255,), width=width)


def star(image, center, radius, color, angle=0.0, spokes=8):
    points = []
    for index in range(spokes * 4):
        phi = angle + math.tau * index / (spokes * 4)
        distance = radius if index % 4 in (0, 1) else radius * 0.35
        points.append((center[0] + math.cos(phi) * distance, center[1] + math.sin(phi) * distance))
    ImageDraw.Draw(image).polygon(points, fill=color + (255,))


def scene_at(time):
    if time < 2.5:
        return 0, time
    if time < 5.0:
        return 1, time - 2.5
    if time < 8.5:
        return 2, time - 5.0
    if time < 11.5:
        return 3, time - 8.5
    return 4, time - 11.5


def furniture(front, time, scene):
    light = scene in (1, 2)
    foreground = PAPER if light else INK
    subtle = (138, 143, 132) if light else (92, 94, 86)
    draw = ImageDraw.Draw(front)
    draw.rectangle((84, 66, 99, 81), fill=(ORANGE if scene != 4 else INK) + (255,))
    label(front, 'MOTION / WITH INTENT', (115, 59), foreground, 21)
    label(front, 'REEL 001     /     2026', (1834, 59), foreground, 20, 'ra')
    line(front, [(84, 111), (1836, 111)], subtle)
    label(front, ['01 / KINETIC IDENTITY', '02 / TYPOGRAPHY', '03 / FORM + MATERIAL', '04 / GENERATIVE SYSTEMS', '05 / NEVER STAND STILL'][scene], (84, 139), foreground, 18)
    label(front, 'DESIGN  /  ANIMATION  /  CODE', (84, 976), foreground, 19)
    frame = int(time * FPS)
    label(front, f'00:{frame // FPS:02d}:{frame % FPS:02d}  /  00:15:00', (1836, 976), foreground, 19, 'ra')
    line(front, [(84, 1020), (1836, 1020)], subtle)
    line(front, [(84, 1020), (84 + 1752 * time / 15, 1020)], ORANGE if scene != 4 else INK, 4)
    for cut in (0, 2.5, 5.0, 8.5, 11.5, 15):
        location = 84 + 1752 * cut / 15
        line(front, [(location, 1015), (location, 1026)], foreground, 2)


def layers(time):
    scene, local = scene_at(time)
    back = Image.new('RGBA', (WIDTH, HEIGHT))
    front = Image.new('RGBA', (WIDTH, HEIGHT))
    paper = PAPER
    center = (1530.0, 356.0)
    scale = 202.0
    balls = np.zeros((49, 4), dtype='f4')

    if scene == 0:
        entrance = out((local + 0.08) / 0.65)
        second = spring(max(0, local - 0.12) / 0.75)
        word(front, 'MAKE', (82 - 180 * (1 - entrance), 242, 1160 * entrance, 230), INK)
        word(front, 'IT MOVE.', (82 + 280 * (1 - second), 540, 1735, 265 * max(0.05, second)), INK)
        label(front, 'IDEAS INTO IMPACT.', (94, 873), INK, 25)
        label(front, 'A 15-SECOND MOTION STUDY', (1825, 881), MUTED, 18, 'ra')
        scale *= 0.72 + 0.28 * spring(local / 0.8)
        center = (1550 + 60 * math.sin(local * 1.2), 355 - 18 * math.sin(local * 2.1))
        ImageDraw.Draw(back).ellipse((1330, 139, 1775, 585), outline=(150, 150, 140, 255), width=1)
        line(back, [(1310, 355), (1340, 355)], MUTED, 2)
        line(back, [(1550, 115), (1550, 145)], MUTED, 2)
        label(front, '360°', (1792, 346), INK, 17)
        if local > 2.08:
            wipe = smooth((local - 2.08) / 0.42)
            ImageDraw.Draw(front).polygon([(WIDTH * (1 - wipe) + 200, 0), (WIDTH, 0), (WIDTH, HEIGHT), (WIDTH * (1 - wipe) - 200, HEIGHT)], fill=INK + (255,))

    elif scene == 1:
        paper = INK
        punch = math.exp(-(local % 0.5) * 18)
        width = 1715 + 58 * punch
        displacement = 500 * (1 - out(local / 0.38))
        rise = 430 * (1 - out((local - 0.12) / 0.48))
        word(back, 'TYPE', (78, -163 - local * 17, 1730, 290), (78, 86, 54), True)
        word(back, 'ALIVE.', (80, 871 - local * 15, 1730, 285), (78, 86, 54), True)
        elastic_word(front, 'TYPE', (84 - displacement - punch * 17, 235, width, 246), local, ACID)
        elastic_word(front, 'ALIVE.', (84 + rise, 559, 1735, 270), local, ACID, 1.8)
        badge = Image.new('RGBA', (162, 90), ORANGE + (255,))
        word(badge, 'IS', (37, 18, 87, 54), INK)
        badge = badge.rotate(-9 + math.sin(local * 3) * 5, Image.Resampling.BICUBIC, expand=True)
        front.alpha_composite(badge, (858, 464))
        label(front, 'STRETCH. SHIFT. REPEAT.', (94, 884), PAPER, 22)
        star(front, (1770, 887), 28, ORANGE, time * 3)
        if local > 2.15:
            progress = smooth((local - 2.15) / 0.35)
            radius = 2350 * progress
            ImageDraw.Draw(front).ellipse((1920 - radius, 500 - radius, 1920 + radius, 500 + radius), fill=(17, 20, 22, 255))

    elif scene == 2:
        paper = (17, 20, 22)
        center = (1290 + math.sin(local * 0.8) * 35, 553 + math.sin(local * 1.5) * 24)
        scale = 355 * (0.83 + 0.17 * out(local / 0.7)) + local * 6
        word(back, 'FORM', (55 - local * 10, 294, 1850, 491), (68, 74, 77), True)
        label(front, 'VOLUME / LIGHT / MOTION', (94, 346), (169, 179, 179), 18)
        word(front, 'FORM', (84 - 90 * (1 - out(local / 0.55)), 410, 670, 219), PAPER)
        word(front, 'HAS FEELING.', (90, 670 + 50 * (1 - out(local / 0.7)), 595, 57), PAPER)
        line(front, [(97, 779), (250, 779)], ORANGE, 5)
        label(front, 'PROCEDURAL SURFACE', (94, 814), (153, 164, 167), 18)
        label(front, '01   /   CONTINUOUS ROTATION', (94, 844), (153, 164, 167), 18)
        label(front, '+', (1788, 849), PAPER, 35)
        if local > 3.17:
            wipe = out((local - 3.17) / 0.33)
            ImageDraw.Draw(front).rectangle((0, HEIGHT * (1 - wipe), WIDTH, HEIGHT), fill=PAPER + (255,))

    elif scene == 3:
        paper = PAPER
        formation = spring(local / 0.9)
        collapse = smooth((local - 2.0) / 0.8)
        for index in range(49):
            row, column = divmod(index, 7)
            phase = index * 2.399963
            chaos_x = 1350 + math.cos(phase + local * 0.7) * (140 + index * 9)
            chaos_y = 530 + math.sin(phase + local * 0.7) * (120 + index * 6)
            grid_x = 936 + column * 128 + math.sin(local * 2.5 + row * 0.7) * 14
            grid_y = 264 + row * 100 + math.sin(local * 3.5 + column * 0.7) * 22
            orbit = math.tau * index / 49 + local * 0.7
            ring_x = 1330 + math.cos(orbit) * (250 + 55 * math.sin(index * 1.7))
            ring_y = 550 + math.sin(orbit) * (250 + 55 * math.sin(index * 1.7))
            pos_x = chaos_x * (1 - formation) + grid_x * formation
            pos_y = chaos_y * (1 - formation) + grid_y * formation
            pos_x = pos_x * (1 - collapse) + ring_x * collapse
            pos_y = pos_y * (1 - collapse) + ring_y * collapse
            radius = 36 + 9 * math.sin(local * 3 + column * 0.6 + row * 0.5)
            radius *= 1 - 0.34 * collapse
            kind = 0 if (row + column) % 3 != 0 else 2
            balls[index] = (pos_x, pos_y, radius, kind)
        word(front, 'ORDER', (85 - 270 * (1 - out((local + 0.1) / 0.5)), 293, 690, 169), INK)
        word(front, 'FROM', (85 - 270 * (1 - out(local / 0.5)), 488, 530, 150), INK)
        word(front, 'CHAOS.', (85 - 270 * (1 - out((local - 0.1) / 0.5)), 666, 740, 173), INK)
        label(front, '49 ELEMENTS. ONE SYSTEM.', (94, 888), MUTED, 20)
        label(front, f'COHERENCE    {min(100, int(out(local / 1.3) * 100)):03d}%', (1815, 191), MUTED, 17, 'ra')
        line(back, [(875, 218), (875, 881)], (186, 187, 175))
        for row in range(8):
            location = 217 + row * 99
            line(back, [(870, location), (880, location)], (160, 166, 151))
        if local > 2.75:
            wipe = smooth((local - 2.75) / 0.25)
            ImageDraw.Draw(front).rectangle((0, 0, WIDTH * wipe, HEIGHT), fill=ORANGE + (255,))

    else:
        paper = ORANGE
        center = (1560 + math.sin(local * 0.65) * 18, 340)
        scale = 200 * (0.7 + 0.3 * spring(local / 0.75))
        entrance = out((local + 0.04) / 0.6)
        second = out((local - 0.16) / 0.6)
        word(front, 'BORN', (83 - 100 * (1 - entrance), 243, 1140, 229), INK)
        word(front, 'TO MOVE.', (83 + 200 * (1 - second), 545, 1730, 260), INK)
        label(front, '15 SECONDS. ZERO STILL FRAMES.', (94, 880), INK, 23)
        label(front, 'THANK YOU FOR WATCHING', (1824, 883), INK, 18, 'ra')
        star(front, (1795, 936), 16, INK, time * 1.6)
        line(back, [(1370, 182), (1773, 182)], (178, 50, 21))
        line(back, [(1773, 182), (1773, 510)], (178, 50, 21))

    furniture(front, time, scene)
    return back, front, scene, np.array(paper, dtype='f4') / 255.0, center, scale, balls


def synthesize_sound():
    rate = 48000
    audio = np.zeros((rate * DURATION, 2), dtype=np.float64)
    rng = np.random.default_rng(712)

    def add(signal, start, gain=1.0, pan=0.0):
        start_index = int(start * rate)
        if start_index < 0:
            signal = signal[-start_index:]
            start_index = 0
        count = min(len(signal), len(audio) - start_index)
        if count <= 0:
            return
        weights = np.sqrt(np.array([1 - pan, 1 + pan]) / 2)
        audio[start_index:start_index + count] += signal[:count, None] * gain * weights

    def filtered_noise(duration, highpass=0, lowpass=0):
        signal = rng.normal(0, 1, int(rate * duration))
        if highpass:
            signal = sosfilt(butter(2, highpass, btype='highpass', fs=rate, output='sos'), signal)
        if lowpass:
            signal = sosfilt(butter(2, lowpass, btype='lowpass', fs=rate, output='sos'), signal)
        return signal

    def kick():
        timeline = np.arange(int(rate * 0.45)) / rate
        frequency = 44 + 165 * np.exp(-timeline * 38)
        phase = np.cumsum(frequency) * math.tau / rate
        body = np.sin(phase) * np.exp(-timeline * 10)
        attack = filtered_noise(0.45, 1800, 10000) * np.exp(-timeline * 300) * 0.4
        return np.tanh((body + attack) * 1.6) * np.minimum(timeline * 1000, 1)

    def snare():
        timeline = np.arange(int(rate * 0.22)) / rate
        noise = filtered_noise(0.22, 1300, 11000)
        body = np.sin(math.tau * 180 * timeline) * np.exp(-timeline * 25)
        return noise * np.exp(-timeline * 24) * 0.68 + body * 0.24

    def hat(duration=0.06):
        timeline = np.arange(int(rate * duration)) / rate
        return filtered_noise(duration, 7000, 18500) * np.exp(-timeline * 65)

    def bass(frequency, duration):
        timeline = np.arange(int(rate * duration)) / rate
        phase = timeline * frequency
        saw = 2 * (phase % 1) - 1
        pulse = np.tanh(np.sin(math.tau * phase) * 4)
        signal = sosfilt(butter(2, 700, fs=rate, output='sos'), saw * 0.45 + pulse * 0.2)
        signal += np.sin(math.tau * frequency * timeline) * 0.75
        envelope = np.minimum(timeline * 160, 1) * np.minimum((duration - timeline) * 60, 1) * np.exp(-timeline * 3)
        return signal * envelope

    def pluck(frequency, duration=0.4):
        timeline = np.arange(int(rate * duration)) / rate
        signal = sum(np.sin(math.tau * frequency * harmonic * timeline) / harmonic ** 1.8 for harmonic in (1, 2, 3, 4))
        envelope = np.minimum(timeline * 280, 1) * np.exp(-timeline * 11)
        return signal * envelope

    roots = [73.416, 73.416, 87.307, 65.406, 97.999, 87.307, 65.406, 73.416]
    for beat_index in range(29):
        position = beat_index * 0.5
        add(kick(), position, 0.72)
        if beat_index % 2:
            add(snare(), position, 0.40, -0.03)
            add(snare(), position + 0.013, 0.13, 0.25)
        for offbeat in (0.0, 0.25):
            add(hat(), position + offbeat, 0.15 if offbeat else 0.10, 0.32 if beat_index % 2 else -0.32)
        if beat_index % 4 in (2, 3):
            add(hat(0.035), position + 0.375, 0.1, -0.45)
        root = roots[(beat_index // 2) % len(roots)]
        add(bass(root, 0.25), position + 0.04, 0.31)
        add(bass(root * (2 if beat_index % 4 == 3 else 1), 0.14), position + 0.32, 0.21, 0.03)
        if beat_index >= 4:
            frequency = root * [4, 6, 8, 6][beat_index % 4]
            add(pluck(frequency), position + 0.25, 0.095, math.sin(beat_index) * 0.5)
            add(pluck(frequency), position + 0.4375, 0.028, -math.sin(beat_index) * 0.5)

    for cut in (0, 2.5, 5.0, 8.5, 11.5):
        length = 0.42
        timeline = np.arange(int(rate * length)) / rate
        envelope = (timeline / length) ** 2
        noise = filtered_noise(length, 800, 9500)
        whistle = np.sin(math.tau * (240 * timeline + 1800 * timeline ** 3))
        add((noise * 0.27 + whistle * 0.12) * envelope, cut - length, 0.50, -0.3)
        add((noise[::-1] * 0.20) * np.exp(-timeline * 11), cut, 0.4, 0.3)
        hit_time = np.arange(int(rate * 0.85)) / rate
        sub = np.sin(math.tau * (42 * hit_time + 2 * (1 - np.exp(-hit_time * 12))))
        add(sub * np.exp(-hit_time * 6) * np.minimum(hit_time * 400, 1), cut, 0.24)

    for index in range(16):
        add(pluck(500 + index * 39, 0.10), 8.5 + index * 0.044, 0.027, -0.7 + index / 15 * 1.4)

    duration = 1.0
    timeline = np.arange(int(rate * duration)) / rate
    chord = sum(np.sin(math.tau * frequency * timeline) for frequency in (146.832, 220, 293.665, 349.228)) * 0.10
    chord *= np.minimum(timeline * 200, 1) * np.exp(-timeline * 4.5)
    add(chord, 14.0, 0.6)
    dry = audio.copy()
    for delay, gain in ((0.062, 0.10), (0.1875, 0.07), (0.375, 0.04)):
        shift = int(delay * rate)
        audio[shift:] += dry[:-shift, ::-1] * gain
    audio = np.tanh(audio * 1.2)
    audio *= 0.89 / np.max(np.abs(audio))
    audio[:480] *= np.linspace(0, 1, 480)[:, None]
    audio[-4800:] *= np.linspace(1, 0, 4800)[:, None]
    samples = np.round(audio * 32767).astype('<i2')
    with wave.open(str(ROOT / 'soundtrack.wav'), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(samples.tobytes())


class Renderer:
    def __init__(self):
        self.context = moderngl.create_standalone_context()
        self.program = self.context.program(
            vertex_shader='''#version 330
                in vec2 in_position;
                void main() { gl_Position = vec4(in_position, 0.0, 1.0); }
            ''',
            fragment_shader=(ROOT / 'visual.frag').read_text(),
        )
        vertices = np.array([-1, -1, 1, -1, -1, 1, 1, 1], dtype='f4')
        self.buffer = self.context.buffer(vertices.tobytes())
        self.mesh = self.context.simple_vertex_array(self.program, self.buffer, 'in_position')
        self.framebuffer = self.context.simple_framebuffer((WIDTH, HEIGHT))
        self.framebuffer.use()
        self.textures = [self.context.texture((WIDTH, HEIGHT), 4) for _ in range(2)]
        for index, texture in enumerate(self.textures):
            texture.filter = (moderngl.LINEAR, moderngl.LINEAR)
            texture.use(index)
        self.program['backLayer'] = 0
        self.program['frontLayer'] = 1
        self.program['resolution'] = (WIDTH, HEIGHT)

    def render(self, time):
        back, front, scene, paper, center, scale, balls = layers(time)
        self.textures[0].write(back.tobytes())
        self.textures[1].write(front.tobytes())
        self.program['time'] = time
        self.program['scene'] = scene
        self.program['paper'] = tuple(paper)
        self.program['objectCenter'] = center
        self.program['objectScale'] = scale
        self.program['balls'].write(balls.tobytes())
        self.mesh.render(moderngl.TRIANGLE_STRIP)
        return self.framebuffer.read(components=3, alignment=1)


def main():
    renderer = Renderer()
    if '--preview' in sys.argv:
        times = (1.1, 3.4, 6.3, 9.8, 13.6)
        sheet = Image.new('RGB', (960 * 2, 540 * 3), PAPER)
        for index, time in enumerate(times):
            raw = renderer.render(time)
            image = Image.frombytes('RGB', (WIDTH, HEIGHT), raw).transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            image.save(ROOT / f'frame_{index}.jpg', quality=95)
            sheet.paste(image.resize((960, 540), Image.Resampling.LANCZOS), ((index % 2) * 960, (index // 2) * 540))
        sheet.save(ROOT / 'contact_sheet.jpg', quality=94)
        return
    synthesize_sound()
    command = [
        'ffmpeg', '-y', '-v', 'warning', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
        '-s', f'{WIDTH}x{HEIGHT}', '-r', str(FPS), '-i', '-', '-i', str(ROOT / 'soundtrack.wav'),
        '-vf', 'vflip', '-af', 'loudnorm=I=-14:TP=-1.0:LRA=8',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', '15', '-movflags', '+faststart',
        str(ROOT / 'final.mp4'),
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(FPS * DURATION):
            process.stdin.write(renderer.render(frame / FPS))
            if frame % 60 == 0:
                print(f'Rendered {frame // FPS:02d}/{DURATION} seconds', flush=True)
    finally:
        process.stdin.close()
        returncode = process.wait()
    if returncode:
        raise SystemExit(returncode)
    print('Complete: final.mp4', flush=True)


if __name__ == '__main__':
    main()
