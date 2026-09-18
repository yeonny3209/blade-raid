'use strict';
// ============================================================
//  오디오 : WebAudio 로 모든 효과음 / BGM 을 실시간 합성
// ============================================================
const Sfx = {
  ctx: null, master: null, sfxBus: null, musicBus: null, verb: null,
  noiseBuf: null, distCurve: null, muted: false, lastPlay: {},

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5;
    comp.attack.value = 0.002; comp.release.value = 0.18;
    this.master = ctx.createGain(); this.master.gain.value = 0.85;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.32; this.musicBus.connect(this.master);

    // 노이즈 버퍼
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    // 디스토션 커브
    const n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (3 + 20) * x * 20 * DEG / (Math.PI + 20 * Math.abs(x)); }
    this.distCurve = curve;
    // 리버브
    const rl = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, rl, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c);
      for (let i = 0; i < rl; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3);
    }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.22;
    this.verb.connect(vg); vg.connect(this.master);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 1; this.verbSend.connect(this.verb);
    this.sfxBus.connect(this.verbSend);
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
  },

  env(g, t, gain, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  },

  noise(o) {
    const ctx = this.ctx, t = ctx.currentTime + (o.at || 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 || 1000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const g = ctx.createGain();
    this.env(g, t, o.gain || 0.3, o.attack || 0.003, o.dur);
    src.connect(f); f.connect(g);
    let out = g;
    if (o.dist) { const ws = ctx.createWaveShaper(); ws.curve = this.distCurve; g.connect(ws); out = ws; }
    out.connect(o.dest || this.sfxBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + o.dur + 0.05);
  },

  tone(o) {
    const ctx = this.ctx, t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.slide || o.dur));
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    this.env(g, t, o.gain || 0.3, o.attack || 0.004, o.dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g);
    let out = g;
    if (o.dist) { const ws = ctx.createWaveShaper(); ws.curve = this.distCurve; g.connect(ws); out = ws; }
    out.connect(o.dest || this.sfxBus);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  },

  play(name, vol = 1, pitch = 1) {
    if (!this.ctx || this.muted) return;
    // 같은 소리 과다 중첩 방지
    const now = performance.now();
    if (this.lastPlay[name] && now - this.lastPlay[name] < 28) return;
    this.lastPlay[name] = now;
    const fn = SFX[name];
    if (fn) fn(this, vol, pitch * rand(0.94, 1.06));
  },
};

// ------------------------------------------------------------
//  효과음 정의
// ------------------------------------------------------------
const SFX = {
  swing(s, v, p) {
    s.noise({ type: 'bandpass', f0: 700 * p, f1: 2800 * p, q: 1.4, dur: 0.13, gain: 0.32 * v, attack: 0.01 });
    s.noise({ type: 'highpass', f0: 5000, dur: 0.06, gain: 0.08 * v, at: 0.03 });
  },
  swingBig(s, v, p) {
    s.noise({ type: 'bandpass', f0: 300 * p, f1: 2000 * p, q: 0.9, dur: 0.26, gain: 0.45 * v, attack: 0.02 });
    s.tone({ type: 'sine', f0: 180 * p, f1: 60, dur: 0.22, gain: 0.12 * v });
  },
  hit(s, v, p) {
    s.noise({ type: 'bandpass', f0: 3200 * p, f1: 1200, q: 0.8, dur: 0.09, gain: 0.55 * v });
    s.tone({ type: 'triangle', f0: 320 * p, f1: 70, dur: 0.13, gain: 0.6 * v, dist: true });
    s.noise({ type: 'lowpass', f0: 1400, f1: 200, q: 0.7, dur: 0.16, gain: 0.5 * v });
  },
  hitLight(s, v, p) {
    s.noise({ type: 'bandpass', f0: 4000 * p, f1: 1800, q: 1, dur: 0.06, gain: 0.35 * v });
    s.tone({ type: 'triangle', f0: 400 * p, f1: 120, dur: 0.07, gain: 0.3 * v });
  },
  heavy(s, v, p) {
    s.tone({ type: 'sine', f0: 190 * p, f1: 36, dur: 0.38, gain: 0.95 * v, dist: true });
    s.noise({ type: 'lowpass', f0: 2600, f1: 120, q: 0.6, dur: 0.36, gain: 0.75 * v });
    s.noise({ type: 'bandpass', f0: 4200 * p, f1: 2000, q: 0.7, dur: 0.08, gain: 0.5 * v });
  },
  crit(s, v, p) {
    s.tone({ type: 'sine', f0: 2500 * p, dur: 0.28, gain: 0.08 * v });
    s.tone({ type: 'sine', f0: 3760 * p, dur: 0.2, gain: 0.05 * v });
  },
  ring(s, v, p) {
    s.tone({ type: 'sine', f0: 1850 * p, f1: 1780 * p, dur: 0.55, gain: 0.09 * v });
    s.tone({ type: 'sine', f0: 2790 * p, dur: 0.4, gain: 0.05 * v });
    s.tone({ type: 'triangle', f0: 5200 * p, dur: 0.2, gain: 0.03 * v });
    s.noise({ type: 'highpass', f0: 6000, dur: 0.18, gain: 0.12 * v });
  },
  blunt(s, v, p) {
    s.tone({ type: 'sine', f0: 150 * p, f1: 48, dur: 0.22, gain: 0.8 * v, dist: true });
    s.noise({ type: 'lowpass', f0: 900, f1: 150, dur: 0.18, gain: 0.5 * v });
  },
  hurt(s, v, p) {
    s.tone({ type: 'square', f0: 330 * p, f1: 140, dur: 0.14, gain: 0.07 * v, lp: 1600 });
    SFX.blunt(s, v * 0.9, p);
  },
  jump(s, v, p) { s.noise({ type: 'bandpass', f0: 420 * p, f1: 1100, q: 1, dur: 0.12, gain: 0.14 * v }); },
  land(s, v, p) {
    s.noise({ type: 'lowpass', f0: 500, f1: 80, dur: 0.13, gain: 0.3 * v });
    s.tone({ type: 'sine', f0: 100 * p, f1: 50, dur: 0.1, gain: 0.2 * v });
  },
  thud(s, v, p) {
    s.tone({ type: 'sine', f0: 110 * p, f1: 38, dur: 0.3, gain: 0.7 * v });
    s.noise({ type: 'lowpass', f0: 420, f1: 90, dur: 0.24, gain: 0.45 * v });
  },
  dash(s, v, p) { s.noise({ type: 'bandpass', f0: 900 * p, f1: 3600, q: 0.9, dur: 0.22, gain: 0.25 * v, attack: 0.02 }); },
  charge(s, v, p) {
    s.tone({ type: 'sawtooth', f0: 160 * p, f1: 900 * p, dur: 0.45, gain: 0.06 * v, lp: 2200, attack: 0.1 });
    s.noise({ type: 'bandpass', f0: 500, f1: 4000, q: 2, dur: 0.45, gain: 0.12 * v, attack: 0.3 });
  },
  flash(s, v, p) {
    s.noise({ type: 'highpass', f0: 2500, f1: 9000, dur: 0.18, gain: 0.5 * v });
    s.tone({ type: 'sine', f0: 3100 * p, dur: 0.9, gain: 0.1 * v });
    s.tone({ type: 'sine', f0: 4650 * p, dur: 0.6, gain: 0.05 * v });
  },
  sheath(s, v, p) {
    s.noise({ type: 'bandpass', f0: 2500, f1: 5000, q: 3, dur: 0.12, gain: 0.25 * v });
    s.tone({ type: 'square', f0: 1400 * p, dur: 0.05, gain: 0.08 * v, at: 0.1 });
    s.tone({ type: 'sine', f0: 2600 * p, dur: 0.3, gain: 0.08 * v, at: 0.1 });
  },
  explode(s, v, p) {
    s.noise({ type: 'lowpass', f0: 3200, f1: 90, q: 0.5, dur: 1.0, gain: 0.95 * v });
    s.tone({ type: 'sine', f0: 95 * p, f1: 26, dur: 0.9, gain: 1.0 * v, dist: true });
    s.noise({ type: 'bandpass', f0: 1800, f1: 400, q: 0.6, dur: 0.3, gain: 0.5 * v });
  },
  quake(s, v, p) {
    SFX.explode(s, v * 0.8, p * 0.8);
    s.noise({ type: 'lowpass', f0: 240, f1: 60, q: 1, dur: 1.4, gain: 0.8 * v, attack: 0.05 });
  },
  coin(s, v, p) {
    s.tone({ type: 'square', f0: 1318 * p, dur: 0.06, gain: 0.04 * v, lp: 5000 });
    s.tone({ type: 'square', f0: 1760 * p, dur: 0.14, gain: 0.04 * v, at: 0.055, lp: 5000 });
  },
  potion(s, v, p) {
    s.tone({ type: 'sine', f0: 380 * p, f1: 980, dur: 0.3, gain: 0.16 * v });
    s.tone({ type: 'sine', f0: 760 * p, f1: 1600, dur: 0.35, gain: 0.08 * v, at: 0.06 });
  },
  counter(s, v, p) {
    s.tone({ type: 'square', f0: 1760 * p, f1: 880, dur: 0.1, gain: 0.09 * v, lp: 4000 });
    s.tone({ type: 'sine', f0: 2640 * p, dur: 0.35, gain: 0.08 * v, at: 0.03 });
  },
  break(s, v, p) {
    for (let i = 0; i < 4; i++) s.noise({ type: 'highpass', f0: 2500 + i * 900, dur: 0.25, gain: 0.35 * v, at: i * 0.045 });
    s.tone({ type: 'sawtooth', f0: 700 * p, f1: 160, dur: 0.5, gain: 0.1 * v, lp: 3000 });
    SFX.heavy(s, v, p * 0.8);
  },
  roar(s, v, p) {
    const ctx = s.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(110 * p, t); o.frequency.linearRampToValueAtTime(80 * p, t + 1.5);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 22; const lg = ctx.createGain(); lg.gain.value = 18;
    lfo.connect(lg); lg.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    const g = ctx.createGain(); s.env(g, t, 0.45 * v, 0.12, 1.6);
    const ws = ctx.createWaveShaper(); ws.curve = s.distCurve;
    o.connect(f); f.connect(ws); ws.connect(g); g.connect(s.sfxBus);
    o.start(t); lfo.start(t); o.stop(t + 1.7); lfo.stop(t + 1.7);
    s.noise({ type: 'bandpass', f0: 380, f1: 250, q: 0.8, dur: 1.5, gain: 0.35 * v, attack: 0.1 });
  },
  warn(s, v) {
    for (let i = 0; i < 3; i++) s.tone({ type: 'square', f0: 620, dur: 0.12, gain: 0.05 * v, at: i * 0.22, lp: 2000 });
  },
  enemyDie(s, v, p) {
    s.tone({ type: 'sawtooth', f0: 320 * p, f1: 55, dur: 0.45, gain: 0.07 * v, lp: 1400 });
    s.noise({ type: 'bandpass', f0: 1200, f1: 300, dur: 0.4, gain: 0.12 * v });
  },
  ui(s, v, p) { s.tone({ type: 'sine', f0: 900 * p, dur: 0.06, gain: 0.08 * v }); },
  select(s, v, p) {
    s.tone({ type: 'triangle', f0: 660 * p, dur: 0.1, gain: 0.12 * v });
    s.tone({ type: 'triangle', f0: 990 * p, dur: 0.18, gain: 0.1 * v, at: 0.07 });
  },
  clear(s, v) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => s.tone({ type: 'triangle', f0: f, dur: 0.5, gain: 0.12 * v, at: i * 0.08 }));
    s.tone({ type: 'sine', f0: 2093, dur: 0.9, gain: 0.05 * v, at: 0.4 });
  },
  cutin(s, v) {
    s.tone({ type: 'sine', f0: 70, f1: 28, dur: 1.5, gain: 1.0 * v, dist: true });
    s.noise({ type: 'lowpass', f0: 1600, f1: 60, dur: 1.3, gain: 0.7 * v });
    s.noise({ type: 'highpass', f0: 3000, f1: 9000, dur: 0.5, gain: 0.25 * v, attack: 0.3 });
    SFX.ring(s, v * 1.4, 0.8);
  },
  ultSlash(s, v, p) {
    s.noise({ type: 'bandpass', f0: 5000 * p, f1: 1500, q: 1.2, dur: 0.1, gain: 0.35 * v });
    s.tone({ type: 'sine', f0: 2200 * p, dur: 0.2, gain: 0.05 * v });
    s.tone({ type: 'triangle', f0: 260 * p, f1: 80, dur: 0.1, gain: 0.35 * v });
  },
  throw(s, v, p) { s.noise({ type: 'bandpass', f0: 1200 * p, f1: 500, q: 2, dur: 0.12, gain: 0.15 * v }); },
  magic(s, v, p) {
    s.tone({ type: 'sine', f0: 500 * p, f1: 1300 * p, dur: 0.4, gain: 0.1 * v });
    s.tone({ type: 'triangle', f0: 750 * p, f1: 1950 * p, dur: 0.35, gain: 0.05 * v, at: 0.03 });
    s.noise({ type: 'bandpass', f0: 3000, f1: 6000, q: 4, dur: 0.35, gain: 0.08 * v });
  },
  pillar(s, v, p) {
    s.noise({ type: 'lowpass', f0: 2000, f1: 150, dur: 0.7, gain: 0.55 * v });
    s.tone({ type: 'sine', f0: 90 * p, f1: 40, dur: 0.5, gain: 0.5 * v });
  },
  door(s, v) { s.noise({ type: 'lowpass', f0: 300, f1: 1400, dur: 0.5, gain: 0.3 * v, attack: 0.2 }); },
  spawn(s, v, p) {
    s.tone({ type: 'sine', f0: 200 * p, f1: 600 * p, dur: 0.35, gain: 0.08 * v });
    s.noise({ type: 'bandpass', f0: 600, f1: 2400, q: 3, dur: 0.35, gain: 0.1 * v });
  },
};

// ------------------------------------------------------------
//  BGM 시퀀서
// ------------------------------------------------------------
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const SONGS = {
  title: {
    bpm: 84, bars: [[45, 'm'], [41, 'M'], [43, 'M'], [40, 'm']],
    kick: '................', snare: '................', hat: '................',
    bass: 'x...............', arp: 'x.x.x.x.x.x.x.x.', pad: true, arpOct: 2, arpVol: 0.05,
  },
  dungeon: {
    bpm: 136, bars: [[45, 'm'], [41, 'M'], [38, 'm'], [40, 'M']],
    kick: 'x.....x.x.......', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.xx',
    bass: 'x.xox.x.x.xox.xo', arp: 'x.xxx.xxx.xxx.xx', pad: true, arpOct: 2, arpVol: 0.035,
  },
  boss: {
    bpm: 158, bars: [[38, 'm'], [46, 'M'], [48, 'M'], [45, 'M'], [38, 'm'], [46, 'M'], [43, 'm'], [45, 'M']],
    kick: 'x...x...x...x.x.', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx',
    bass: 'xxoxxxoxxxoxxxox', arp: 'x.x.xx.xx.x.xx.x', pad: true, arpOct: 2, arpVol: 0.04, dist: true,
  },
  clear: {
    bpm: 100, bars: [[48, 'M'], [43, 'M'], [45, 'm'], [41, 'M']],
    kick: 'x.......x.......', snare: '........', hat: '..x...x...x...x.',
    bass: 'x.......x.......', arp: 'xxxxxxxxxxxxxxxx', pad: true, arpOct: 2, arpVol: 0.04,
  },
};

const Music = {
  song: null, name: null, step: 0, next: 0, bus: null, delay: null,

  setup() {
    const ctx = Sfx.ctx;
    this.bus = ctx.createGain(); this.bus.gain.value = 1; this.bus.connect(Sfx.musicBus);
    const d = ctx.createDelay(1); d.delayTime.value = 0.33;
    const fb = ctx.createGain(); fb.gain.value = 0.35;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.bus);
    this.delay = d;
  },

  play(name) {
    if (!Sfx.ctx) return;
    if (!this.bus) this.setup();
    if (this.name === name) return;
    const ctx = Sfx.ctx;
    // 페이드 전환
    const old = this.bus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 1500);
    this.bus = ctx.createGain(); this.bus.gain.value = 0.0001;
    this.bus.gain.setTargetAtTime(1, ctx.currentTime + 0.1, 0.3);
    this.bus.connect(Sfx.musicBus);
    const d = ctx.createDelay(1); d.delayTime.value = 60 / SONGS[name].bpm * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.33;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(this.bus);
    this.delay = d;
    this.name = name; this.song = SONGS[name];
    this.step = 0; this.next = ctx.currentTime + 0.15;
  },
  stop() {
    if (!this.bus || !Sfx.ctx) return;
    this.bus.gain.setTargetAtTime(0, Sfx.ctx.currentTime, 0.3);
    this.name = null; this.song = null;
  },

  update() {
    if (!this.song || !Sfx.ctx) return;
    const ctx = Sfx.ctx, sp = 60 / this.song.bpm / 4;
    if (this.next < ctx.currentTime - 0.3) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.14) {
      this.playStep(this.step, this.next, sp);
      this.step++; this.next += sp;
    }
  },

  playStep(step, t, sp) {
    const s = this.song, i = step % 16, bar = Math.floor(step / 16) % s.bars.length;
    const [root, q] = s.bars[bar];
    const chord = [root, root + (q === 'm' ? 3 : 4), root + 7];
    const ctx = Sfx.ctx, bus = this.bus;
    if (s.kick[i] === 'x') this.kick(t);
    if (s.snare[i] === 'x') this.snare(t);
    if (s.hat[i] === 'x') this.hat(t, i % 4 === 2 ? 0.06 : 0.03);
    const b = s.bass[i];
    if (b === 'x' || b === 'o') this.bass(t, root + (b === 'o' ? 12 : 0) - 12 + 12, sp * 1.8, s.dist);
    if (s.arp[i] === 'x') {
      const seq = [0, 1, 2, 1, 2, 0, 1, 2];
      const n = chord[seq[(step) % seq.length]] + 12 * s.arpOct;
      this.arp(t, n + (i >= 12 && step % 32 >= 16 ? 12 : 0), s.arpVol);
    }
    if (s.pad && i === 0) this.pad(t, chord, sp * 16);
  },

  kick(t) {
    const ctx = Sfx.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.36);
  },
  snare(t) {
    const ctx = Sfx.ctx;
    const src = ctx.createBufferSource(); src.buffer = Sfx.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.38, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(f); f.connect(g); g.connect(this.bus); src.start(t, Math.random()); src.stop(t + 0.2);
    const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190;
    og.gain.setValueAtTime(0.25, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og); og.connect(this.bus); o.start(t); o.stop(t + 0.12);
  },
  hat(t, v) {
    const ctx = Sfx.ctx;
    const src = ctx.createBufferSource(); src.buffer = Sfx.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
    const g = ctx.createGain(); g.gain.setValueAtTime(v * 2.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(f); f.connect(g); g.connect(this.bus); src.start(t, Math.random()); src.stop(t + 0.06);
  },
  bass(t, m, dur, dist) {
    const ctx = Sfx.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(dist ? 1400 : 900, t); f.frequency.exponentialRampToValueAtTime(180, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.28, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 0.02);
  },
  arp(t, m, v) {
    const ctx = Sfx.ctx, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'square'; o.frequency.value = mtof(m);
    f.type = 'lowpass'; f.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(f); f.connect(g); g.connect(this.bus); g.connect(this.delay); o.start(t); o.stop(t + 0.18);
  },
  pad(t, chord, dur) {
    const ctx = Sfx.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = 800;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(this.bus); g.connect(this.delay);
    for (const n of chord) for (const dt of [-7, 7]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(n + 12); o.detune.value = dt;
      o.connect(f); o.start(t); o.stop(t + dur + 0.05);
    }
  },
};
