# One-time tool: generates brand-style placeholder images (replace with real photos later).
# Usage: python3 scripts/tools/make-placeholders.py
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

random.seed(316)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def grain(w, h, base=12, spread=22, red=False):
    im = Image.effect_noise((w, h), spread).point(lambda p: max(0, min(255, base + (p - 128) // 3)))
    im = im.convert('RGB')
    # vignette + soft light streak
    glow = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(glow)
    d.ellipse((w * 0.15, h * 0.05, w * 0.85, h * 1.1), fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) // 5))
    tint = (150, 18, 24) if red else (90, 90, 90)
    im = Image.composite(Image.new('RGB', (w, h), tint), im, glow.point(lambda p: p // 2))
    return im

def label(im, text, size):
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, size)
    w, h = im.size
    bb = d.textbbox((0, 0), text, font=f)
    d.text(((w - bb[2]) / 2, (h - bb[3]) / 2), text, font=f, fill=(235, 235, 235))
    return im

grain(2400, 1350, red=True).save('src/assets/images/hero.jpg', quality=82)
for i in (1, 2):
    im = grain(900, 1125)
    d = ImageDraw.Draw(im)
    # simple silhouette
    d.ellipse((330, 260, 570, 520), fill=(30, 30, 30)); d.rounded_rectangle((230, 560, 670, 1125), 140, fill=(30, 30, 30))
    im.save(f'src/assets/images/members/member-{i}.jpg', quality=82)
# Example content (only used when EXAMPLES=1)
label(grain(1400, 1400, red=True), 'EXAMPLE COVER', 90).save('src/assets/images/covers/example-cover.jpg', quality=82)
label(grain(1200, 1200), 'EXAMPLE T-SHIRT', 80).save('src/assets/images/merch/example-tshirt.jpg', quality=82)
for i in (1, 2, 3, 4):
    label(grain(1600, 1067, red=i % 2 == 0), f'EXAMPLE PHOTO {i}', 70).save(f'src/assets/images/gallery/example-{i}.jpg', quality=82)
label(grain(3000, 2000), 'PRESS PHOTO — REPLACE', 120).save('src/assets/images/press/press-photo-1.jpg', quality=85)
print('placeholders done')
