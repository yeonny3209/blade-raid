import numpy as np, wave, sys
w = wave.open(sys.argv[1]); n = w.getnframes(); sr = w.getframerate()
a = np.frombuffer(w.readframes(n), dtype='<i2').reshape(-1, 2).astype(float) / 32768
m = a.mean(1)
secs = [('open', 0, 3.2), ('drop', 3.2, 12.8), ('rush', 12.8, 16.0), ('boss', 16.0, 19.2), ('arsenal', 19.2, 22.4), ('sys', 22.4, 24.0), ('recap', 24.0, 25.6), ('end', 25.6, 30.0)]
bands = [(20, 120), (120, 500), (500, 2000), (2000, 8000), (8000, 20000)]
print('sec      rms    peak   | sub   lowmid  mid   high   air (dB rel. total)')
for name, t0, t1 in secs:
    x = m[int(t0 * sr):int(t1 * sr)]; X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr)
    tot = X.sum()
    bs = [10 * np.log10(X[(f >= lo) & (f < hi)].sum() / tot + 1e-12) for lo, hi in bands]
    print('%-8s %.3f  %.3f  | %s' % (name, np.sqrt((x ** 2).mean()), np.abs(a[int(t0 * sr):int(t1 * sr)]).max(), '  '.join('%5.1f' % b for b in bs)))
st = a[:, 0] - a[:, 1]
print('stereo width (side/mid rms): %.2f' % (np.sqrt((st ** 2).mean()) / np.sqrt(((a[:, 0] + a[:, 1]) ** 2).mean())))
print('dc', a.mean(0))
