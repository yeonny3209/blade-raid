# 주인공 부품 시트 → 부품별 webp + 메타.  사용: python tools/cut_hero.py
# 시트의 10개 덩어리를 (위→아래, 왼→오른) 순서가 아니라 번호 순서로 잘라 낸다.
from PIL import Image, ImageFilter
import numpy as np, json, sys
from collections import deque
SRC = 'docs/art/candidates/hero_parts_draft.png'
OUT = 'img/hero/'
F = 0.20                                    # 시트 → 파일 축소 비율 (화면 크기의 약 2배로 남긴다)
NAMES = ['head', 'torso', 'pelvis', 'uarm', 'farm', 'hand', 'thigh', 'shin', 'foot', 'cape']
# 시트의 덩어리를 번호에 맞게 고른다 (좌표는 탐지 결과로 확인한 것)
BOX = {'head': (85, 49), 'torso': (460, 5), 'pelvis': (787, 121), 'uarm': (1173, 36), 'farm': (1473, 54),
       'hand': (181, 544), 'thigh': (461, 450), 'shin': (792, 458), 'foot': (1061, 563), 'cape': (1447, 425)}
im = Image.open(SRC).convert('RGBA')
a = np.array(im)[:, :, 3]
m = np.array(Image.fromarray(((a > 40) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(9))) > 0
H, W = m.shape
seen = np.zeros_like(m, bool)
comps = []
for y in range(0, H, 2):
    for x in range(0, W, 2):
        if m[y, x] and not seen[y, x]:
            q = deque([(y, x)]); seen[y, x] = True; pts = []
            while q:
                cy, cx = q.popleft(); pts.append((cy, cx))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            if len(pts) > 4000:
                ys = [p[0] for p in pts]; xs = [p[1] for p in pts]
                comps.append((min(xs), min(ys), max(xs), max(ys), pts))
meta = {'F': F, 'parts': {}}
for nm in NAMES:
    bx, by = BOX[nm]
    c = min(comps, key=lambda c: abs(c[0] - bx) + abs(c[1] - by))
    x0, y0, x1, y1, pts = c
    mask = np.zeros_like(m); 
    for p in pts: mask[p] = True
    x0 = max(0, x0 - 4); y0 = max(0, y0 - 4); x1 = min(W, x1 + 5); y1 = min(H, y1 + 5)
    crop = im.crop((x0, y0, x1, y1)).copy()
    arr = np.array(crop); mk = mask[y0:y1, x0:x1]
    arr[~mk, 3] = 0                                      # 다른 부품 · 번호 글자 지우기
    crop = Image.fromarray(arr)
    w, h = crop.size
    crop = crop.resize((max(1, round(w * F)), max(1, round(h * F))), Image.LANCZOS)
    crop.save(OUT + nm + '.webp', 'WEBP', quality=92, method=6)
    al = np.array(crop)[:, :, 3] > 40
    ys, xs = np.nonzero(al)
    def cx(r0, r1):
        sel = al[r0:r1]; yy, xx = np.nonzero(sel); return float(xx.mean()) if len(xx) else crop.size[0] / 2
    cw, ch = crop.size
    meta['parts'][nm] = {'w': cw, 'h': ch, 'top': round(cx(0, max(2, ch // 10)), 1), 'bot': round(cx(ch - max(2, ch // 10), ch), 1)}
    print(nm, (x1 - x0, y1 - y0), '->', crop.size, meta['parts'][nm])
json.dump(meta, open(OUT + 'meta.json', 'w'), indent=1)
