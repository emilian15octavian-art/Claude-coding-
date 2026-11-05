# One-time tool: removes burned-in subtitles from video stills and gives them a gentle quality pass.
# Usage: pip install opencv-python-headless && python3 scripts/tools/clean-stills.py still1.jpg still2.jpg ...
# Output goes to /tmp/claude-0/photos/out/ (change "out" below).
import cv2, numpy as np, sys, glob, os
src = sys.argv[1:]
for i, p in enumerate(src, 1):
    img = cv2.imread(p)
    h, w = img.shape[:2]
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # yellow-green subtitle text + its glow, only in the bottom band
    band = np.zeros((h, w), np.uint8); band[int(h*0.86):int(h*0.96), :] = 255
    text = cv2.inRange(hsv, (18, 35, 45), (48, 255, 255))
    text = cv2.bitwise_and(text, band)
    found = int(text.sum() / 255)
    if found > 50:
        mask = cv2.dilate(text, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)), iterations=3)
        img = cv2.inpaint(img, mask, 12, cv2.INPAINT_TELEA)
        # soften the repaired area so it blends with the dreamy blur around it
        blur = cv2.GaussianBlur(img, (0, 0), 6)
        soft = cv2.GaussianBlur(cv2.dilate(mask, None, iterations=6).astype(np.float32) / 255, (0, 0), 8)[..., None]
        img = (img * (1 - soft) + blur * soft).astype(np.uint8)
    # gentle quality pass: light denoise, local contrast, mild sharpening
    img = cv2.fastNlMeansDenoisingColored(img, None, 3, 3, 7, 21)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8)).apply(l)
    img = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)
    g = cv2.GaussianBlur(img, (0, 0), 1.6)
    img = cv2.addWeighted(img, 1.35, g, -0.35, 0)
    out = f'/tmp/claude-0/photos/out/photo-{i:02d}.jpg'
    cv2.imwrite(out, img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(out, 'subtitle pixels:', found)
