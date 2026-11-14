import sys, os
from PIL import Image, ImageDraw
here = os.path.dirname(os.path.abspath(__file__))
d = sys.argv[1]; out = sys.argv[2]; cols = int(sys.argv[3]); frames = [int(x) for x in sys.argv[4:]]
tw = 1920 // cols; th = tw * 9 // 16; rows = (len(frames) + cols - 1) // cols
sh = Image.new('RGB', (tw * cols, th * rows))
dr = ImageDraw.Draw(sh)
for i, f in enumerate(frames):
    p = os.path.join(here, d, 'f%04d.jpg' % f)
    if not os.path.exists(p): continue
    im = Image.open(p).resize((tw, th), Image.LANCZOS)
    x = (i % cols) * tw; y = (i // cols) * th
    sh.paste(im, (x, y)); dr.rectangle([x, y, x + 62, y + 16], fill=(0, 0, 0)); dr.text((x + 3, y + 2), 'F%d' % f, fill=(255, 255, 255))
sh.save(os.path.join(here, 'test', out + '.jpg'), quality=86)
print('ok', len(frames))
