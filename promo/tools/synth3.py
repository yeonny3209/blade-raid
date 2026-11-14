import numpy as np, wave, os, json
SR = 44100; T = 30.0; N = int(SR * T)
rng = np.random.default_rng(33)
BEAT = 0.4; BAR = 1.6; FPS = 60
HERE = os.path.dirname(os.path.abspath(__file__))
EV = {}
try:
    EV = {int(k): v for k, v in json.load(open(os.path.join(HERE, 'events', 'ev.json'), encoding='utf-8')).items()}
except Exception as e:
    print('no events', e)

# ---------------- 기본 도구 ----------------
BUS = {k: [np.zeros(N), np.zeros(N)] for k in ('drum', 'bass', 'lead', 'pad', 'stab', 'fx', 'arp', 'kick')}
def mid(m): return 440.0 * 2 ** ((m - 69) / 12)
def tarr(d): return np.arange(int(d * SR)) / SR
def add(bus, sig, start, g=1.0, pan=0.0):
    i = int(round(start * SR))
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); s = sig[:j - i] * g
    if s.ndim == 2: BUS[bus][0][i:j] += s[:, 0] * min(1.0, 1 - pan); BUS[bus][1][i:j] += s[:, 1] * min(1.0, 1 + pan); return
    BUS[bus][0][i:j] += s * min(1.0, 1 - pan); BUS[bus][1][i:j] += s * min(1.0, 1 + pan)
def lp(x, fc, order=1):
    if x.ndim == 2: return np.stack([lp(x[:, 0], fc, order), lp(x[:, 1], fc, order)], 1)
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    H = 1 / (1 + 1j * f / fc)
    return np.fft.irfft(X * H ** order, n)
def hp(x, fc, order=1):
    if x.ndim == 2: return np.stack([hp(x[:, 0], fc, order), hp(x[:, 1], fc, order)], 1)
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    H = (1j * f / fc) / (1 + 1j * f / fc)
    return np.fft.irfft(X * H ** order, n)
def bp(x, f0, f1): return hp(lp(x, f1, 2), f0, 2)
def noise(d): return rng.standard_normal(int(d * SR))
def noise2(d): return rng.standard_normal((int(d * SR), 2))
def saw(f, d, ph=0.0):
    t = tarr(d); return 2 * ((f * t + ph) % 1.0) - 1
def sqr(f, d, pw=0.5):
    t = tarr(d); return np.where((f * t) % 1.0 < pw, 1.0, -1.0)
def sine(f, d): return np.sin(2 * np.pi * f * tarr(d))
def env(d, a=0.005, r=0.05):
    t = tarr(d); return np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
def sweep(f0, f1, d, curve=1.0):
    t = tarr(d); f = f0 + (f1 - f0) * (t / d) ** curve; return np.sin(2 * np.pi * np.cumsum(f) / SR)
def supersaw(m, d, det=0.012, n=7):
    f = mid(m); out = np.zeros((int(d * SR), 2))
    for k in range(n):
        u = (k - (n - 1) / 2) / ((n - 1) / 2); dt = u * det
        v = saw(f * (1 + dt), d, rng.random()); a = (u * 0.85 + 1) * np.pi / 4
        out[:, 0] += v * np.cos(a); out[:, 1] += v * np.sin(a)
    return out / n * 1.3
def col(e): return e[:, None]

# ---------------- 타악 ----------------
def kick(g=1.0, punch=1.0):
    t = tarr(0.36); f = 46 + 170 * np.exp(-t * 34); ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 14)
    click = hp(noise(0.36), 2500) * np.exp(-t * 160) * 0.5
    return np.tanh((body * 1.6 + click) * punch) * g
def snare(g=1.0):
    t = tarr(0.3); n = bp(noise(0.3), 1200, 9000) * np.exp(-t * 20)
    tone = (np.sin(2 * np.pi * 190 * t) + 0.6 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t * 30)
    return (n * 1.1 + tone * 0.55) * g
def clap(g=1.0):
    d = 0.32; t = tarr(d); e = np.zeros(len(t))
    for o in (0, 0.011, 0.023, 0.034):
        k = int(o * SR); e[k:] += np.exp(-(t[:len(t) - k]) * 55) * (0.6 if o < 0.03 else 1.0)
    return bp(noise(d), 900, 6500) * e * 0.9 * g
def hat(op=False, g=1.0):
    d = 0.28 if op else 0.05; t = tarr(d); return hp(noise(d), 7500, 2) * np.exp(-t * (13 if op else 75)) * g
def crash(g=1.0, d=2.4):
    t = tarr(d); return hp(noise2(d), 5000) * (np.exp(-t * 2.4) * g)[:, None]
def tom(f=110, g=1.0, d=0.5):
    t = tarr(d); fr = f * (1 + 0.9 * np.exp(-t * 26)); ph = 2 * np.pi * np.cumsum(fr) / SR
    return (np.sin(ph) * np.exp(-t * 7.5) + lp(noise(d), 900) * np.exp(-t * 40) * 0.5) * g
def taiko(g=1.0):
    t = tarr(0.9); fr = 62 * (1 + 1.2 * np.exp(-t * 30)); ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.tanh((np.sin(ph) * np.exp(-t * 5) * 1.5 + lp(noise(0.9), 1400) * np.exp(-t * 26) * 0.9)) * g
def boom(g=1.0, d=2.2):
    t = tarr(d); f = 70 * np.exp(-t * 2.6) + 27; ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(np.sin(ph) * np.exp(-t * 2.0) * 1.5 + lp(noise(d), 500) * np.exp(-t * 3.2) * 1.0 + hp(noise(d), 3000) * np.exp(-t * 7) * 0.35) * g
def subdrop(g=1.0, d=1.6):
    t = tarr(d); f = 120 * np.exp(-t * 2.4) + 24; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * g
def whoosh(d, up=True, g=1.0, f0=500, f1=7000):
    t = tarr(d); b = bp(noise2(d), f0, f1); e = (t / d) ** 2.4 if up else (1 - t / d) ** 2
    return b * (e * g)[:, None]
def slashfx(g=1.0, d=0.18):
    t = tarr(d); return hp(lp(noise(d), 11000), 2200) * np.exp(-t * 26) * (0.4 + 0.6 * t / d * 0 + 1) * g
def shing(f=2600, g=1.0, d=0.9):
    t = tarr(d); s = np.zeros(len(t))
    for k, r in enumerate((1.0, 1.51, 2.27, 2.94, 3.71, 4.63)):
        s += np.sin(2 * np.pi * f * r * t + k) * np.exp(-t * (5 + k * 2.2)) / (1 + k * 0.5)
    sc = hp(noise(d), 5000) * np.exp(-t * 30) * 0.7
    return (s * 0.35 + sc) * np.minimum(1, t / 0.002) * g
def crack(g=1.0):
    t = tarr(0.22); return (hp(noise(0.22), 1800) * np.exp(-t * 45) * 1.2 + np.sin(2 * np.pi * (90 + 220 * np.exp(-t * 60)) * t) * np.exp(-t * 22)) * g
def thud(g=1.0):
    t = tarr(0.5); f = 55 + 120 * np.exp(-t * 40); return np.tanh((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.6 + bp(noise(0.5), 300, 3000) * np.exp(-t * 60) * 0.7)) * g
def tick(f=1800, g=1.0):
    t = tarr(0.06); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + hp(noise(0.06), 6000) * np.exp(-t * 140) * 0.6) * g
def riser(d, g=1.0, f0=200, f1=4200):
    t = tarr(d); tone = sweep(f0, f1, d, 2.2) * (t / d) ** 1.8 * 0.35
    ns = bp(noise2(d), 800, 9000) * ((t / d) ** 2.6)[:, None]
    return (tone[:, None] + ns) * g
def revcym(d, g=1.0):
    t = tarr(d); return hp(noise2(d), 4500) * (np.exp(-(d - t) * 3.2) * g)[:, None]
def bell(m, d=1.6, g=1.0):
    f = mid(m); t = tarr(d); return (np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) + 0.22 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 3.2) * g
def pluck(m, d=0.26, g=1.0, br=5200):
    f = mid(m); s = saw(f, d) + 0.5 * saw(f * 2.005, d); t = tarr(d); return lp(s, br) * np.exp(-t * 12) * g
def choir(m, d, g=1.0):
    f = mid(m); t = tarr(d); s = sum(saw(f * k * (1 + dt), d, rng.random()) for k in (1, 2) for dt in (-0.007, 0, 0.007)) / 6
    return lp(s * (1 + 0.004 * np.sin(2 * np.pi * 5.1 * t)), 1700, 2) * np.minimum(1, t * 2.5) * np.minimum(1, (d - t) * 2.5) * g
def growl(m, d, g=1.0, rate=5.0):
    f = mid(m); t = tarr(d); s = saw(f, d) + saw(f * 1.006, d, 0.3) + sqr(f * 0.5, d) * 0.6
    n = len(s); out = np.zeros(n); seg = int(SR * 0.05)
    for i in range(0, n, seg):
        tt = i / SR; fc = 260 + 1500 * (0.5 + 0.5 * np.sin(2 * np.pi * rate * tt - 1.2)) ** 2
        out[i:i + seg] = lp(s[i:i + seg], fc, 2)
    return np.tanh(out * 2.2) * env(d, 0.01, 0.05) * g

B = lambda b: b * BEAT
def chordAt(bar):
    return [([57, 60, 64], 33), ([53, 57, 60], 29), ([55, 60, 64], 36), ([55, 59, 62], 31)][bar % 4]     # Am F C G

# =====================================================================
#  0. 콜드 오픈 (0 ~ 8박)
# =====================================================================
d = B(8)
t = tarr(d)
for m in (33, 45, 52, 57):
    add('pad', lp(supersaw(m, d, 0.006, 5), 900) * col(np.minimum(1, t / 1.6) * np.minimum(1, (d - t) / 0.15)) * 0.1, 0)
add('fx', sine(55, d) * np.minimum(1, t / 1.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.5 * t) ** 2) * 0.1, 0)
for b in (0, 1, 1.5):                      # 심장 박동
    add('drum', kick(0.5), B(b)); add('drum', kick(0.32), B(b) + 0.16)
add('fx', revcym(B(2) - 0.05, 0.3), 0.05); add('fx', boom(0.8), B(2)); add('fx', thud(0.9), B(2)); add('fx', shing(1900, 0.25), B(2) + 0.02, pan=-0.3)     # 검 하나로,
add('fx', revcym(B(2), 0.42), B(2)); add('fx', boom(1.0), B(4)); add('fx', thud(1.0), B(4)); add('fx', shing(2500, 0.4), B(4) + 0.02, pan=0.3)          # 끝까지.
add('pad', choir(69, B(2.2), 0.32), B(4)); add('pad', choir(64, B(2.2), 0.3), B(4)); add('pad', choir(76, B(2.2), 0.2), B(4))
add('fx', riser(B(4), 0.5, 180, 5200), B(4))
for k in range(4):                         # 예고 섬광 4컷 (반 박마다)
    tb = B(6 + k * 0.5); add('drum', kick(0.85 + k * 0.05), tb); add('fx', crack(0.5 + 0.1 * k), tb, pan=(-0.4 if k % 2 else 0.4)); add('fx', whoosh(0.2, True, 0.4), tb + 0.0)
for k in range(8): add('drum', snare(0.3 + 0.07 * k), B(7) + k * BEAT / 8)
add('fx', revcym(B(1), 0.5), B(7))

# =====================================================================
#  1. 드롭 : 몽타주 (8 ~ 32박)
# =====================================================================
MEL = [[81, 0, 76, 81, 84, 0, 83, 81], [81, 0, 77, 81, 84, 0, 81, 77], [79, 0, 76, 79, 84, 0, 83, 79], [83, 0, 79, 83, 86, 0, 83, 79], [81, 0, 76, 81, 84, 0, 88, 84], [89, 0, 84, 81, 84, 86, 88, 91]]
add('fx', boom(1.15), B(8)); add('drum', crash(0.6), B(8)); add('fx', subdrop(0.8), B(8))
def groove(b0, b1, lvl=1.0, mel=None, bar0=0, hats=True, stabs=True, bassOn=True):
    for b in range(b0, b1):
        tb = B(b); bi = (b - b0) % 4; bar = bar0 + (b - b0) // 4; ch, root = chordAt(bar)
        add('kick', kick(1.0 * lvl), tb)
        if bi in (1, 3): add('drum', clap(0.75 * lvl), tb, pan=0.06); add('drum', snare(0.5 * lvl), tb, pan=-0.06)
        if hats:
            add('drum', hat(True, 0.3 * lvl), tb + BEAT / 2, pan=0.15)
            for k in (0.25, 0.75): add('drum', hat(False, 0.2 * lvl), tb + k * BEAT, pan=-0.15)
        if bassOn:                                                    # 오프비트 베이스 + 16분 구르기
            for k, o in ((0.5, 0), (0.75, 12)):
                dd = BEAT * 0.23; f = root + o
                add('bass', np.tanh(lp(saw(mid(f), dd) + 0.6 * sqr(mid(f), dd), 700, 2) * 1.8) * env(dd, 0.004, 0.03) * 0.62 * lvl, tb + k * BEAT)
            add('bass', np.tanh(lp(saw(mid(root), BEAT * 0.2), 500, 2) * 1.6) * env(BEAT * 0.2, 0.004, 0.03) * 0.4 * lvl, tb + 0.25 * BEAT)
        if stabs and bi in (0, 2):
            dd = BEAT * (0.9 if bi == 0 else 0.45); st = tb + (0 if bi == 0 else BEAT * 0.5)
            for m in ch + [ch[0] + 12]:
                add('stab', lp(supersaw(m + 12, dd, 0.014), 5200) * col(env(dd, 0.004, 0.08)) * 0.2 * lvl, st)
        for k in range(4):                                            # 16분 아르페지오
            m = ch[(b * 4 + k) % 3] + 24 + (12 if k % 2 else 0)
            add('arp', pluck(m, 0.2, 0.2 * lvl, 6500), tb + k * BEAT / 4, pan=(0.35 if k % 2 else -0.35))
        if mel is not None:
            row = mel[bar % len(mel)]
            for k in range(2):
                m = row[bi * 2 + k]
                if m:
                    dd = BEAT * 0.5 * (1.9 if (bi * 2 + k + 1 < 8 and row[bi * 2 + k + 1] == 0) else 0.95)
                    add('lead', lp(supersaw(m, dd, 0.01, 5) + 0.3 * col(sqr(mid(m - 12), dd)), 6500) * col(env(dd, 0.006, 0.05)) * 0.34 * lvl, tb + k * BEAT / 2)
groove(8, 32, 1.0, MEL)
for k in range(12):                                                   # 컷 전환마다 타격 + 휙
    tb = B(8 + k * 2)
    if k: add('fx', boom(0.26, 0.8), tb); add('fx', crack(0.32), tb, pan=(0.3 if k % 2 else -0.3)); add('fx', whoosh(0.22, True, 0.6), tb - 0.2, pan=(0.5 if k % 2 else -0.5)); add('drum', crash(0.26, 1.2), tb, pan=(0.3 if k % 2 else -0.3))
for k in range(8): add('drum', snare(0.35 + 0.07 * k), B(31) + k * BEAT / 8)                # 보스 구간으로 넘어가는 필
add('fx', revcym(B(1), 0.45), B(31))

# =====================================================================
#  2. 보스 러시 (32 ~ 40박) : 하프타임 + 보스마다 큰북
# =====================================================================
add('fx', boom(1.1), B(32)); add('drum', crash(0.5), B(32))
add('bass', growl(33, B(4), 0.55, 2.5), B(32)); add('bass', growl(34, B(2), 0.55, 5.0), B(36)); add('bass', growl(36, B(2), 0.6, 10.0), B(38))
for b in (32, 34, 36, 38): add('kick', kick(1.0), B(b))
for b in (33, 35, 37, 39): add('drum', snare(0.85), B(b)); add('drum', clap(0.5), B(b))
for i in range(8): add('fx', taiko(0.8), B(32 + i * 0.5), pan=(-0.35 if i % 2 else 0.35)); add('stab', lp(supersaw(45 + (0 if i % 4 < 3 else 1), 0.16, 0.02) + supersaw(52 + (0 if i % 4 < 3 else 1), 0.16, 0.02), 2600) * col(env(0.16, 0.004, 0.05)) * 0.32, B(32 + i * 0.5))
for i in range(8): add('drum', tom(90 + i * 14, 0.7, 0.3), B(36) + i * BEAT / 4, pan=(-0.4 + i * 0.1)); add('fx', tick(900 + i * 150, 0.3), B(36) + i * BEAT / 4)
for i in range(4): add('fx', taiko(0.9 + 0.05 * i), B(38 + i * 0.5), pan=(-0.35 if i % 2 else 0.35)); add('stab', lp(supersaw(46 + i, 0.18, 0.02) + supersaw(53 + i, 0.18, 0.02), 3000) * col(env(0.18, 0.004, 0.05)) * 0.36, B(38 + i * 0.5))
add('fx', riser(B(2), 0.4, 300, 3000), B(38))

# =====================================================================
#  3. 결전 (40 ~ 48박) : 컷인 -> 쌓기 -> 46박 대폭발
# =====================================================================
add('fx', boom(1.0), B(40)); add('fx', whoosh(0.5, False, 0.7), B(40)); add('fx', shing(2100, 0.5), B(40) + 0.03)
for m in (57, 64, 69, 72): add('pad', choir(m, B(5.9), 0.3), B(40))
for b in range(41, 46):
    lv = 0.55 + 0.09 * (b - 41)
    add('kick', kick(lv), B(b))
    for k in range(4):
        m = [57, 57, 60, 57, 64, 57, 60, 62][((b - 41) * 4 + k) % 8] + (12 if b >= 44 else 0)
        add('arp', lp(saw(mid(m), 0.085) + saw(mid(m) * 1.007, 0.085), 3600) * env(0.085, 0.003, 0.02) * 0.34 * lv, B(b) + k * BEAT / 4, pan=(0.25 if k % 2 else -0.25))
    add('bass', np.tanh(lp(saw(mid(33), BEAT * 0.9), 420, 2) * 2) * env(BEAT * 0.9, 0.005, 0.05) * 0.5 * lv, B(b))
for i in range(4): add('drum', snare(0.5 + 0.06 * i), B(44) + i * BEAT / 2)
for i in range(8): add('drum', snare(0.6 + 0.05 * i), B(45) + i * BEAT / 8)
add('fx', riser(B(3), 0.55, 250, 5200), B(43)); add('fx', revcym(B(1), 0.5), B(45))
MEGA = B(46)
for f, evs in EV.items():
    for k, v in evs:
        if k == 'mega': MEGA = f / FPS
add('fx', boom(1.5, 2.6), MEGA); add('fx', subdrop(1.2, 2.0), MEGA); add('drum', crash(0.8, 2.6), MEGA); add('fx', crack(1.1), MEGA); add('fx', taiko(1.1), MEGA)
add('fx', hp(noise(1.6), 3000) * np.exp(-tarr(1.6) * 3) * 0.4, MEGA, pan=0.1)
for m in (45, 57, 64): add('pad', choir(m, B(48) - MEGA + 0.1, 0.3), MEGA)
add('fx', bell(93, 1.6, 0.16), MEGA + 0.12); add('fx', revcym(0.7, 0.5), B(48) - 0.7)

# =====================================================================
#  4. 무기고 (48 ~ 56박) + 성장 (56 ~ 60박)
# =====================================================================
add('fx', boom(0.9), B(48)); add('drum', crash(0.45), B(48))
groove(48, 52, 0.92, None, 0, stabs=True)
for i in range(8): add('fx', shing(1700 + (i * 7 % 5) * 260, 0.3), B(48 + i * 0.5) + 0.01, pan=(-0.45 if i % 2 else 0.45)); add('fx', slashfx(0.4), B(48 + i * 0.5))
for b in (52, 53): add('kick', kick(0.9), B(b))                               # 16자루 연사
for i in range(16): add('fx', tick(1200 + i * 130, 0.34), B(52) + i * BEAT / 8, pan=(-0.5 + i / 16)); add('drum', snare(0.22 + 0.035 * i), B(52) + i * BEAT / 8)
add('fx', riser(B(2), 0.4, 400, 5000), B(52))
add('fx', boom(1.1), B(54)); add('drum', crash(0.5), B(54)); add('fx', shing(1500, 0.7, 1.4), B(54) + 0.02); add('fx', thud(0.9), B(54))
groove(54, 60, 0.95, MEL, 0)
for tb, pn in ((B(56), -0.3), (B(58), 0.3)): add('fx', boom(0.5, 1.0), tb); add('fx', whoosh(0.22, True, 0.5), tb - 0.2, pan=pn); add('fx', thud(0.7), tb + 0.05)

# =====================================================================
#  5. 가속 리캡 (60 ~ 64박)
# =====================================================================
for i in range(4): add('kick', kick(0.95), B(60) + i * BEAT / 2); add('drum', snare(0.5), B(60) + i * BEAT / 2 + BEAT / 4)
for i in range(4): add('kick', kick(0.95), B(62) + i * BEAT / 4); add('drum', snare(0.55 + 0.04 * i), B(62) + i * BEAT / 4)
for i in range(8): add('kick', kick(0.85), B(63) + i * BEAT / 8); add('drum', snare(0.6 + 0.05 * i), B(63) + i * BEAT / 8)
for i in range(16): add('fx', tick(900 + i * 190, 0.3), B(60) + (i / 16) ** 0.8 * B(4))
add('fx', riser(B(4), 0.8, 200, 7000), B(60)); add('fx', revcym(B(2), 0.6), B(62))
add('bass', growl(33, B(4), 0.4, 10), B(60))
for m in (69, 72, 76): add('pad', lp(supersaw(m, B(4), 0.02), 3000) * col((tarr(B(4)) / B(4)) ** 1.5) * 0.2, B(60))

# =====================================================================
#  6. 엔드 카드 (64 ~ 75박)
# =====================================================================
E0 = B(64)
add('fx', boom(1.6, 3.0), E0); add('fx', subdrop(1.2, 2.2), E0); add('drum', crash(0.9, 3.0), E0); add('kick', kick(1.0), E0); add('fx', taiko(1.0), E0)
add('fx', shing(2300, 0.8, 1.6), E0 + 12 / FPS); add('fx', slashfx(0.7, 0.3), E0 + 12 / FPS)
ENDCH = [([57, 60, 64, 69], 33, 0, 4), ([53, 57, 60, 65], 29, 4, 2), ([55, 59, 62, 67], 31, 6, 2), ([57, 64, 69, 76], 33, 8, 3)]
for ch, root, b0, nb in ENDCH:
    dd = B(nb) * (1.0 if b0 < 8 else 1.25); tb = E0 + B(b0)
    for m in ch:
        add('pad', lp(supersaw(m + 12, dd, 0.013), 4200) * col(np.minimum(1, tarr(dd) * 12) * np.minimum(1, (dd - tarr(dd)) * (3 if b0 < 8 else 1.2))) * 0.2, tb)
        add('pad', choir(m, dd, 0.2), tb)
    add('bass', np.tanh(lp(saw(mid(root), dd), 380, 2) * 2) * np.minimum(1, (dd - tarr(dd)) * 2) * np.minimum(1, tarr(dd) * 60) * 0.55, tb)
    if b0: add('kick', kick(0.85), tb); add('fx', boom(0.6, 1.4), tb)
for k, m in enumerate([81, 84, 88, 93, 88, 84, 88, 93, 96, 93, 88, 93, 96, 100, 96, 105]): add('fx', bell(m, 1.5, 0.15), E0 + k * BEAT / 2, pan=(-0.3 if k % 2 else 0.3))
for b in (1, 2, 3, 5, 7): add('kick', kick(0.6), E0 + B(b))
for b in (1, 3, 5, 7): add('drum', clap(0.4), E0 + B(b))
add('fx', revcym(B(1.5), 0.4), E0 + B(6.5)); add('fx', boom(1.0, 2.6), E0 + B(8)); add('drum', crash(0.5, 2.6), E0 + B(8))

# =====================================================================
#  이벤트 기반 효과음
# =====================================================================
for f in sorted(EV):
    ts = f / FPS
    for k, v in EV[f]:
        if k == 'impact': add('fx', crack(0.75), ts); add('fx', thud(0.55), ts)
        elif k == 'slam': add('fx', thud(0.6 * (v or 1)), ts); add('fx', whoosh(0.16, True, 0.3), ts - 0.15)
        elif k == 'cut' and B(32) <= ts < B(40): pass
        elif k == 'tick' and ts >= B(64): add('fx', tick(1500, 0.5), ts); add('fx', thud(0.4), ts)

# =====================================================================
#  믹스
# =====================================================================
t_all = np.arange(N) / SR
kL = BUS['kick'][0]
envk = lp(np.abs(kL), 12); envk = envk / (envk.max() + 1e-9)
duck = 1 - np.clip(envk * 2.4, 0, 0.7)                  # 킥이 칠 때 나머지를 누른다
def bus(k): return np.stack(BUS[k], 1)
def hp2(x, fc): return np.stack([hp(x[:, 0], fc), hp(x[:, 1], fc)], 1)
lead = bus('lead'); ld = lead.copy()
for dly, g in ((BEAT * 0.75, 0.3), (BEAT * 1.5, 0.16)):
    k = int(dly * SR); ld[k:, 0] += lead[:-k, 1] * g; ld[k:, 1] += lead[:-k, 0] * g
arp = bus('arp'); ad = arp.copy(); k = int(BEAT * 0.75 * SR); ad[k:, 0] += arp[:-k, 1] * 0.3; ad[k:, 1] += arp[:-k, 0] * 0.3
music = hp2(ld * 1.5 + ad * 1.25 + bus('stab') * 1.45 + bus('pad') * 1.35, 150)
fx = bus('fx')
fx_lo = np.stack([lp(fx[:, 0], 110, 2), lp(fx[:, 1], 110, 2)], 1); fx = fx - fx_lo * 0.55                 # 효과음의 초저역을 덜어낸다
mix = bus('kick') * 0.72 + bus('drum') * 1.0
mix += bus('bass') * duck[:, None] * 0.8
mix += music * (0.4 + 0.6 * duck[:, None])
mix += fx * 0.8
ir_n = int(2.2 * SR)
def mk_ir(seed):
    r = np.random.default_rng(seed); ir = r.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.8); ir = lp(ir, 6000); return ir / np.sqrt((ir ** 2).sum())
irL, irR = mk_ir(1), mk_ir(2)
def reverb(x, ir):
    n = len(x) + ir_n; return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
send = music * 0.55 + fx * 0.4 + bus('drum') * 0.18
send = np.stack([hp(send[:, 0], 350), hp(send[:, 1], 350)], 1)
mix[:, 0] += reverb(send[:, 0], irL) * 0.3; mix[:, 1] += reverb(send[:, 1], irR) * 0.3
mix = hp2(mix, 30)
def master_eq(x):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    gdb = np.interp(np.log10(np.maximum(f, 1)), np.log10([20, 50, 110, 220, 500, 1500, 4000, 9000, 20000]), [-6, -5, -3.5, -1.0, 0.5, 2.0, 1.2, -0.8, -3.0])
    return np.fft.irfft(X * 10 ** (gdb / 20), n)
mix = np.stack([master_eq(mix[:, 0]), master_eq(mix[:, 1])], 1)
# 구간 셈여림 : 조용한 도입 -> 꽉 찬 드롭
auto = np.interp(t_all, [0, B(4), B(7.6), B(8), B(32), B(40), B(46), B(48), B(60), B(63.8), B(64), 30], [0.5, 0.62, 0.8, 1.0, 1.0, 0.95, 1.0, 1.0, 0.95, 0.9, 1.0, 1.0])
mix *= auto[:, None]
mix *= (np.minimum(1, t_all / 0.25) * np.minimum(1, (T - t_all) / 1.2))[:, None]
peak = np.percentile(np.abs(mix), 99.7)
out = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * 0.93
pcm = (np.clip(out, -1, 1) * 32767).astype('<i2')
os.makedirs(os.path.join(HERE, 'audio'), exist_ok=True)
path = os.path.join(HERE, 'audio', 'promo3.wav')
with wave.open(path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
rms = [round(float(np.sqrt((out[int(i * BAR * SR):int((i + 1) * BAR * SR)] ** 2).mean())), 3) for i in range(19)]
print('saved', path, 'peak', round(float(np.abs(out).max()), 3), 'clipfrac', round(float((np.abs(out) > 0.93).mean()), 4), 'MEGA', round(MEGA, 3))
print('rms/bar', rms)
