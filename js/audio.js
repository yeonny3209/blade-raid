'use strict';
// ============================================================
//  오디오 : WebAudio 로 모든 효과음 / BGM 을 실시간 합성
//
//  타격음 설계 원칙 (손맛)
//   1) 트랜지언트  : 0ms 에 최대치로 꽂히는 짧은 노이즈 = "딱" 하는 순간의 날
//   2) 바디        : 밴드패스 노이즈 = 살/갑옷을 때리는 질감
//   3) 서브 베이스 : 급강하 사인 + 새추레이션 = 배로 느껴지는 "퍽"
//   4) 메탈 링     : 비조화 배음 = 칼날의 쇳소리
//   타격음은 드라이(리버브 없음)로 두어 윤곽이 뭉개지지 않게 한다.
// ============================================================
function makeCurve(fn, n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = fn(i * 2 / (n - 1) - 1);
  return c;
}

const Sfx = {
  ctx: null, master: null, sfxBus: null, wet: null, musicBus: null, musicDuck: null, musicLP: null,
  verb: null, verbSend: null, noiseBuf: null, distCurve: null, softCurve: null,
  muted: false, lastPlay: {}, vol: 0.9, voiceOn: true, voiceVol: 1,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();

    // 노이즈 버퍼 / 왜곡 커브
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.distCurve = makeCurve(x => Math.tanh(x * 5));            // 서브 베이스 배음 생성
    this.softCurve = makeCurve(x => Math.tanh(x * 1.3) * 0.94);   // 마스터 소프트 클립

    // 마스터 : 소프트 클립만 (컴프레서 금지)
    //  DynamicsCompressor 는 룩어헤드 6ms 지연 + 트랜지언트를 절반으로 깎아
    //  타격음의 "날"을 통째로 먹어버린다. 소프트 클립은 지연 0ms 이면서
    //  피크를 눌러주고 배음까지 더해 오히려 더 크게 들린다.
    const clip = ctx.createWaveShaper(); clip.curve = this.softCurve; clip.oversample = 'none';
    this.master = ctx.createGain(); this.master.gain.value = this.vol;
    this.master.connect(clip); clip.connect(ctx.destination);

    // 리버브 (보내는 소리만)
    const rl = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, rl, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = ir.getChannelData(c);
      for (let i = 0; i < rl; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3.2);
    }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    const vg = ctx.createGain(); vg.gain.value = 0.3;
    this.verb.connect(vg); vg.connect(this.master);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 1; this.verbSend.connect(this.verb);

    // 버스 : sfxBus = 완전 드라이(타격음) / wet = 드라이 + 리버브(공간감 필요한 소리)
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 1; this.sfxBus.connect(this.master);
    this.wet = ctx.createGain(); this.wet.gain.value = 1;
    this.wet.connect(this.master); this.wet.connect(this.verbSend);
    // 음악 : 타격 시 순간적으로 눌러주는 덕킹 단계를 둔다
    this.musicDuck = ctx.createGain(); this.musicDuck.gain.value = 1; this.musicDuck.connect(this.master);
    // 로우패스 : 평소엔 20kHz(=무영향), 강타 순간에만 잠깐 닫혀 "귀가 먹먹한" 느낌을 낸다
    this.musicLP = ctx.createBiquadFilter(); this.musicLP.type = 'lowpass';
    this.musicLP.frequency.value = 20000; this.musicLP.Q.value = 0.7; this.musicLP.connect(this.musicDuck);
    this.musicBus = ctx.createGain(); this.musicBus.gain.value = 0.3; this.musicBus.connect(this.musicLP);
    if (typeof Opt !== 'undefined' && Save.data) Opt.apply();
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol, this.ctx.currentTime, 0.05);
  },

  // 음악 사이드체인 : 큰 타격이 들어간 순간 BGM 을 눌러 타격을 돋보이게
  duck(depth = 0.4, dur = 0.25) {
    if (!this.musicDuck) return;
    const t = this.ctx.currentTime, g = this.musicDuck.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(1 - depth, t + 0.012);
    g.linearRampToValueAtTime(1, t + dur);
  },

  // 강타 순간 BGM 을 먹먹하게 (depth 0..1 : 1 이면 400Hz 까지 닫힘)
  muffle(depth = 0.7, dur = 0.18) {
    if (!this.musicLP) return;
    const t = this.ctx.currentTime, f = this.musicLP.frequency;
    f.cancelScheduledValues(t);
    f.setValueAtTime(clamp(f.value, 300, 20000), t);
    f.exponentialRampToValueAtTime(Math.max(350, 20000 * Math.pow(0.02, clamp(depth, 0, 1))), t + 0.01);
    f.exponentialRampToValueAtTime(20000, t + 0.01 + dur);
  },

  // ---------- 기본 레이어 ----------
  env(g, t, gain, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  },

  // 트랜지언트 : 램프 없이 즉시 최대 → 가장 날카로운 어택
  tick(o) {
    const ctx = this.ctx, t = ctx.currentTime + (o.at || 0), dur = o.dur || 0.02;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'highpass'; f.frequency.value = o.f || 3000; f.Q.value = o.q || 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || this.sfxBus);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
  },

  // 서브 베이스 펀치 : 급강하 사인 + 새추레이션
  //  드라이브(배음 생성)와 출력 레벨을 분리한다. 게인 뒤에 새추레이션을 걸면
  //  음량을 줄여도 출력이 천장에 붙어버려 강약이 사라진다.
  sub(o) {
    const ctx = this.ctx, t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t);
    osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.drop || o.dur * 0.4));
    const env = ctx.createGain();                       // 엔벨로프는 0..1 로만
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(env);
    let out = env;
    if (o.drive) {
      const ws = ctx.createWaveShaper(); ws.curve = this.distCurve;
      env.connect(ws); out = ws;
    }
    const lvl = ctx.createGain(); lvl.gain.value = o.gain;   // 최종 음량은 새추레이션 뒤에서
    out.connect(lvl); lvl.connect(o.dest || this.sfxBus);
    osc.start(t); osc.stop(t + o.dur + 0.02);
  },

  // 금속 링 : 비조화 배음 (칼날 / 갑옷)
  metal(o) {
    const ctx = this.ctx, t = ctx.currentTime + (o.at || 0);
    const parts = o.parts || [1, 2.74, 5.37, 8.9];
    for (let i = 0; i < parts.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = o.f * parts[i] * (0.995 + Math.random() * 0.01);
      const dur = o.dur / (1 + i * 0.45);
      const g = ctx.createGain();
      g.gain.setValueAtTime(o.gain / (1 + i * 1.3), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(o.dest || this.sfxBus);
      osc.start(t); osc.stop(t + dur + 0.02);
    }
  },

  // 포먼트 음성 : 성대(톱니파) → 병렬 밴드패스(모음) → 엔벨로프
  //   o.f0→f1 음높이, o.forms=[[F시작,F끝,Q,이득],..] 모음, o.grow=[Hz,깊이] 떨림, o.dist 거칠기, o.breath 숨소리
  formant(o) {
    const ctx = this.ctx, t = ctx.currentTime + (o.at || 0), dur = o.dur;
    const dest = o.dest || this.sfxBus;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(o.f0, t);
    osc.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    let node = osc;
    if (o.dist) { const ws = ctx.createWaveShaper(); ws.curve = this.distCurve; node.connect(ws); node = ws; }
    // 그로울 : 진폭을 빠르게 떨어 목이 갈라지는 소리
    const am = ctx.createGain(); am.gain.value = 1;
    if (o.grow) {
      am.gain.value = 1 - o.grow[1] / 2;
      const lfo = ctx.createOscillator(); lfo.frequency.value = o.grow[0];
      const lg = ctx.createGain(); lg.gain.value = o.grow[1] / 2;
      lfo.connect(lg); lg.connect(am.gain); lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    node.connect(am);
    const mix = ctx.createGain(); mix.gain.value = 1;
    for (const [fa, fb, q, gn] of o.forms) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(fa, t);
      if (fb && fb !== fa) bp.frequency.exponentialRampToValueAtTime(fb, t + dur);
      const g = ctx.createGain(); g.gain.value = gn;
      am.connect(bp); bp.connect(g); g.connect(mix);
    }
    const env = ctx.createGain();
    this.env(env, t, o.gain, o.attack ?? 0.008, dur);
    mix.connect(env); env.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.05);
    if (o.breath) this.noise({ type: 'bandpass', f0: 2600, f1: 1400, q: 0.8, dur: dur * 0.8, gain: o.breath, attack: 0.006, at: o.at || 0, dest });
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
    this.env(g, t, o.gain || 0.3, o.attack ?? 0.001, o.dur);
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
    this.env(g, t, o.gain || 0.3, o.attack ?? 0.002, o.dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g);
    let out = g;
    if (o.dist) { const ws = ctx.createWaveShaper(); ws.curve = this.distCurve; g.connect(ws); out = ws; }
    out.connect(o.dest || this.sfxBus);
    osc.start(t); osc.stop(t + o.dur + 0.05);
  },

  // 재질 × 강도 타격음 (게임 쪽에서 쓰는 진입점)
  impact(mat, power, o = {}) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    const key = 'imp' + power;
    if (this.lastPlay[key] && now - this.lastPlay[key] < 22) return;
    this.lastPlay[key] = now;
    const pitch = (o.pitch || 1) * (0.95 + Math.random() * 0.1);
    SFX.impact(this, (o.vol || 1) * (MIX.impact ?? 0.37) * (power >= 2 ? 1.18 : 1), pitch, mat, power, !!o.crit, o.combo | 0);
  },

  // 검 고유 음색 한 겹 (applyHit 에서 재질 타격음 뒤에 호출)
  wlayer(kind, power, crit) {
    if (!this.ctx || this.muted || !kind) return;
    const now = performance.now(), key = 'wl' + power;
    if (this.lastPlay[key] && now - this.lastPlay[key] < 22) return;
    this.lastPlay[key] = now;
    SFX.wlayer(this, MIX.wl, 0.95 + Math.random() * 0.1, kind, power, crit);
  },
  // 플레이어 검 휘두르는 소리 : 기본 휘두름 + 장착한 검의 색을 입힌다
  pplay(name, vol = 1, pitch = 1) {
    const W = typeof Gear !== 'undefined' ? Gear.w() : null;
    this.play(name, vol, pitch * ((W && W.swingPitch) || 1));
    if (W && W.snd && this.ctx && !this.muted) {
      const now = performance.now(), key = 'ws' + name;
      if (this.lastPlay[key] && now - this.lastPlay[key] < 60) return;
      this.lastPlay[key] = now;
      SFX.wlayer(this, MIX.wl * (name === 'swingBig' ? 0.55 : 0.4), pitch, W.snd, name === 'swingBig' ? 1 : 0, false);
    }
  },

  // 몬스터 목소리 (kind: goblin/orc/mage/boss, mode: hit/die)
  voice(kind, mode = 'hit') {
    if (!this.ctx || this.muted || !this.voiceOn) return;
    const now = performance.now(), key = 'vox' + kind;
    if (this.lastPlay[key] && now - this.lastPlay[key] < 90) return;
    this.lastPlay[key] = now;
    SFX.vox(this, this.voiceVol, 0.92 + Math.random() * 0.16, kind, mode);
  },

  play(name, vol = 1, pitch = 1) {
    if (!this.ctx || this.muted) return;
    const now = performance.now();
    if (this.lastPlay[name] && now - this.lastPlay[name] < 26) return;   // 같은 소리 과다 중첩 방지
    this.lastPlay[name] = now;
    const fn = SFX[name];
    if (fn) fn(this, vol * (MIX[name] ?? 0.5), pitch * (0.95 + Math.random() * 0.1));
  },
};

// 소리별 음량 단계 : 약한 타격 < 평타 < 강타 < 폭발 순으로 확실히 차이나게
// (소프트 클립 천장이 0.94 라서 개별 레벨을 정리해두지 않으면 전부 같은 크기로 뭉개진다)
const MIX = {
  kill: 0.32, combo: 0.42, wl: 0.42, impact: 0.37, hitLight: 0.33, hit: 0.37, heavy: 0.44, crit: 1, blunt: 0.38, hurt: 0.41,
  thud: 0.48, land: 0.51, explode: 0.45, quake: 0.49, break: 0.41, cutin: 0.46,
  ultSlash: 0.3, pillar: 0.4, roar: 0.5, flash: 0.71, counter: 0.64,
  swing: 2.2, swingBig: 1.19, ring: 1, dash: 1, jump: 1, charge: 1, sheath: 1,
  magic: 1, throw: 1, enemyDie: 1, spawn: 1, warn: 1, door: 1,
  coin: 1, potion: 1, ui: 1, select: 1, clear: 1,
};

// ------------------------------------------------------------
//  효과음 정의
// ------------------------------------------------------------
// 재질별 타격 음색표
//   tick  : 트랜지언트 주파수 / 세기      body : 밴드패스 중심 → 끝, Q, 길이
//   sub   : 저음 시작 → 끝, 길이, 세기    metal: 금속 링 주파수 / 세기 / 길이
//   grit  : 자갈·뼈 부서지는 잡음량
const MATS = {
  flesh: { tick: [4200, 0.5], body: [1700, 650, 1.0, 0.10], sub: [205, 44, 0.17, 0.95], metal: null, grit: 0 },
  armor: { tick: [6200, 0.8], body: [2700, 1150, 1.3, 0.09], sub: [195, 42, 0.15, 0.8], metal: [1950, 0.2, 0.16], grit: 0.15 },
  bone: { tick: [5400, 0.7], body: [3100, 950, 2.1, 0.07], sub: [235, 62, 0.10, 0.55], metal: [2700, 0.09, 0.07], grit: 0.6 },
  magic: { tick: [7200, 0.45], body: [3600, 1500, 1.5, 0.10], sub: [265, 72, 0.12, 0.5], metal: [3200, 0.24, 0.42], grit: 0 },
  stone: { tick: [2300, 0.7], body: [880, 300, 0.9, 0.15], sub: [150, 34, 0.24, 1.1], metal: null, grit: 0.85 },
  beast: { tick: [1600, 0.75], body: [1150, 420, 0.85, 0.18], sub: [148, 30, 0.3, 1.2], metal: null, grit: 0.3 },
  ice: { tick: [7600, 0.6], body: [3300, 1200, 1.8, 0.08], sub: [240, 58, 0.12, 0.6], metal: [3400, 0.2, 0.3], grit: 0.55 },
  metal: { tick: [6800, 0.9], body: [3000, 1300, 1.6, 0.10], sub: [180, 40, 0.16, 0.8], metal: [1500, 0.3, 0.34], grit: 0.1 },
};

// 타격 강도 단계 : 0 다단히트 / 1 평타 / 2 강타 / 3 필살
const POWER = [
  { g: 0.62, dur: 0.6, subG: 0.55, duck: 0 },
  { g: 1.0, dur: 1.0, subG: 1.0, duck: 0.18 },
  { g: 1.25, dur: 1.9, subG: 1.45, duck: 0.45 },
  { g: 1.45, dur: 2.9, subG: 1.8, duck: 0.65 },
];

const SFX = {
  // ---------- 타격 ----------
  // 재질 × 강도로 즉석 합성한다. 같은 적을 때려도 매번 음색이 조금씩 달라진다.
  impact(s, v, p, mat, pw, crit, cmb = 0) {
    const M = MATS[mat] || MATS.flesh, P = POWER[clamp(pw | 0, 0, 3)];
    const r = () => 0.88 + Math.random() * 0.24;             // 레이어별 흔들림
    const g = v * P.g, d = P.dur;

    // 1) 트랜지언트 : 0ms 에 꽂히는 날
    s.tick({ f: M.tick[0] * r() * p, gain: M.tick[1] * g * 1.05, dur: 0.012 * (1 + d * 0.3) });
    s.tick({ f: 1100 * r(), q: 0.9, gain: M.tick[1] * g * 0.75, dur: 0.045 * d, at: 0.002 });

    // 2) 바디 : 재질의 질감
    const B = M.body;
    s.noise({ type: 'bandpass', f0: B[0] * r() * p, f1: B[1], q: B[2], dur: B[3] * (0.7 + d * 0.5), gain: 0.72 * g, attack: 0.0005 });
    if (pw >= 2) s.noise({ type: 'lowpass', f0: 2300, f1: 170, q: 0.9, dur: 0.16 * d, gain: 0.75 * g, attack: 0.001 });

    // 3) 서브 베이스 : 배로 느껴지는 무게
    const S2 = M.sub;
    s.sub({ f0: S2[0] * p * r(), f1: S2[1], dur: S2[2] * (0.8 + d * 0.6), drop: S2[2] * 0.3, gain: S2[3] * g * P.subG, drive: true });

    // 4) 금속 링 / 자갈
    if (M.metal) s.metal({ f: M.metal[0] * p * r(), gain: M.metal[1] * g, dur: M.metal[2] * (0.8 + d * 0.4) });
    if (M.grit) s.noise({ type: 'highpass', f0: 2600 * r(), dur: 0.09 * d, gain: 0.35 * M.grit * g, attack: 0.001, at: 0.008 });

    // 5) 크리티컬 : 위에 얹는 밝은 종
    if (crit) {
      s.metal({ f: 3100 * p * r(), gain: 0.2 * v, dur: 0.42, parts: [1, 2.4, 3.9, 6.2], dest: s.wet });
      s.noise({ type: 'bandpass', f0: 2800, f1: 9000, q: 3, dur: 0.17, gain: 0.28 * v, attack: 0.003 });
    }
    // 6) 콤보 보상음 : 콤보가 쌓일수록 밝고 높은 "딩" 이 얹힌다 (맞출수록 기분 좋게)
    if (cmb >= 6) {
      const c = Math.min(cmb, 80) / 80;
      s.tone({ type: 'sine', f0: (1500 + 1900 * c) * p, dur: 0.06, gain: 0.2 * v, attack: 0.0008 });
      if (cmb >= 30) s.tone({ type: 'sine', f0: (2250 + 2850 * c) * p, dur: 0.05, gain: 0.12 * v, attack: 0.0008, at: 0.012 });
    }
    if (P.duck) s.duck(P.duck, 0.12 + d * 0.1);
    if (pw >= 2) s.muffle(0.32 + pw * 0.16, 0.12 + d * 0.07);       // 강타 : 순간 귀가 먹먹
  },

  // ---------- 검마다 다른 타격 음색 ----------
  //  재질 타격음 위에 한 겹 더 얹는다 (불=파직, 얼음=쨍, 번개=지직 …). pw : 0~3 타격 강도
  wlayer(s, v, p, kind, pw = 1, crit = false) {
    // 음색마다 원래 음량이 달라서(노이즈 위주는 작고 서브베이스 위주는 큼) 측정값으로 맞춘 보정치
    const KG = { fire: 2.8, ice: 1.55, elec: 1.4, blood: 1.15, quake: 0.9, wind: 5.5, poison: 1.45, holy: 2.1, void: 1.1, magma: 0.9, clock: 2.9, exec: 0.82, moon: 1.9, star: 3.1, shadow: 3.1, wing: 3.2, chaos: 1.75, katana: 2.4, thorn: 1.6, dice: 1.5, coin: 2.2, steam: 1.8, sun: 2.0 };
    const g = v * (0.72 + pw * 0.2) * (KG[kind] || 1), r = () => 0.9 + Math.random() * 0.2;
    switch (kind) {
      case 'fire':
        for (let i = 0; i < 4; i++) s.tick({ f: 2600 + Math.random() * 3000, gain: 0.3 * g, dur: 0.012, at: i * 0.028 + Math.random() * 0.02 });
        s.noise({ type: 'bandpass', f0: 900, f1: 3200 * p, q: 1.4, dur: 0.26, gain: 0.34 * g, attack: 0.004 });
        s.noise({ type: 'lowpass', f0: 1700, f1: 240, q: 0.8, dur: 0.22, gain: 0.4 * g });
        break;
      case 'ice':
        s.metal({ f: 3300 * p * r(), gain: 0.2 * g, dur: 0.5, parts: [1, 2.9, 5.1, 7.4], dest: s.wet });
        s.noise({ type: 'highpass', f0: 6500, dur: 0.12, gain: 0.3 * g, attack: 0.001 });
        s.tone({ type: 'sine', f0: 2600 * p, f1: 1300, dur: 0.08, gain: 0.12 * g });
        break;
      case 'elec':
        s.tone({ type: 'sawtooth', f0: 2000 * p, f1: 260, slide: 0.09, dur: 0.11, gain: 0.16 * g, dist: true, lp: 5000 });
        for (let i = 0; i < 3; i++) s.noise({ type: 'highpass', f0: 3800, dur: 0.02, gain: 0.34 * g, attack: 0.0005, at: i * 0.024 });
        s.tone({ type: 'square', f0: 118, f1: 90, dur: 0.12, gain: 0.1 * g, lp: 700 });
        break;
      case 'blood':
        s.noise({ type: 'bandpass', f0: 520, f1: 190, q: 0.8, dur: 0.2, gain: 0.5 * g, attack: 0.002 });
        s.sub({ f0: 120 * p, f1: 48, dur: 0.17, gain: 0.7 * g, drive: true });
        s.tone({ type: 'sine', f0: 720 * p, f1: 240, dur: 0.09, gain: 0.12 * g });
        break;
      case 'quake':
        s.sub({ f0: 84 * p, f1: 26, dur: 0.6, drop: 0.16, gain: 1.15 * g, drive: true });
        s.noise({ type: 'lowpass', f0: 700, f1: 60, q: 1, dur: 0.5, gain: 0.7 * g, attack: 0.002 });
        s.noise({ type: 'highpass', f0: 1800, dur: 0.18, gain: 0.3 * g, at: 0.01 });
        break;
      case 'wind':
        s.noise({ type: 'bandpass', f0: 2200, f1: 7000, q: 4, dur: 0.17, gain: 0.26 * g, attack: 0.02 });
        s.noise({ type: 'bandpass', f0: 6500, f1: 1800, q: 3, dur: 0.14, gain: 0.2 * g, attack: 0.012, at: 0.04 });
        s.tone({ type: 'sine', f0: 1900 * p, f1: 2700 * p, dur: 0.1, gain: 0.07 * g, attack: 0.03 });
        break;
      case 'poison':
        for (let i = 0; i < 3; i++) s.tone({ type: 'sine', f0: (300 + i * 60) * p, f1: (680 + i * 80) * p, dur: 0.07, gain: 0.16 * g, at: i * 0.05 });
        s.noise({ type: 'bandpass', f0: 1400, f1: 500, q: 1.6, dur: 0.16, gain: 0.25 * g });
        s.sub({ f0: 140 * p, f1: 66, dur: 0.14, gain: 0.55 * g, drive: true });
        break;
      case 'holy':
        s.metal({ f: 1760 * p, gain: 0.24 * g, dur: 0.85, parts: [1, 2, 3, 4.2], dest: s.wet });
        s.tone({ type: 'triangle', f0: 880 * p, f1: 1320 * p, dur: 0.22, gain: 0.1 * g, dest: s.wet });
        s.noise({ type: 'highpass', f0: 9000, dur: 0.1, gain: 0.16 * g });
        break;
      case 'void':
        s.noise({ type: 'bandpass', f0: 280, f1: 1300, q: 1.2, dur: 0.26, gain: 0.4 * g, attack: 0.1, dest: s.wet });
        s.sub({ f0: 70 * p, f1: 38, dur: 0.5, gain: 0.8 * g, drive: true });
        s.tone({ type: 'sawtooth', f0: 520 * p, f1: 70, dur: 0.22, gain: 0.07 * g, lp: 900, dist: true });
        break;
      case 'magma':
        s.sub({ f0: 100 * p, f1: 30, dur: 0.5, drop: 0.12, gain: 1.05 * g, drive: true });
        s.noise({ type: 'lowpass', f0: 3200, f1: 150, q: 0.7, dur: 0.46, gain: 0.7 * g, attack: 0.001 });
        for (let i = 0; i < 3; i++) s.tick({ f: 2200 + Math.random() * 2000, gain: 0.26 * g, dur: 0.012, at: 0.03 + i * 0.04 });
        break;
      case 'clock':
        s.tone({ type: 'square', f0: 1250, dur: 0.018, gain: 0.14 * g, lp: 5000, attack: 0.0004 });
        s.tone({ type: 'square', f0: 1800, dur: 0.018, gain: 0.12 * g, lp: 5000, attack: 0.0004, at: 0.07 });
        s.metal({ f: 2400 * p, gain: 0.14 * g, dur: 0.35, parts: [1, 3.1, 5.6], dest: s.wet, at: 0.07 });
        break;
      case 'exec':
        s.tick({ f: 2000, gain: 0.5 * g, dur: 0.02 });
        s.sub({ f0: 74 * p, f1: 30, dur: 0.48, drop: 0.12, gain: 1.2 * g, drive: true });
        s.noise({ type: 'lowpass', f0: 950, f1: 110, q: 0.9, dur: 0.3, gain: 0.7 * g, attack: 0.001 });
        s.metal({ f: 210 * p, gain: 0.2 * g, dur: 0.6, parts: [1, 2.3, 3.8], dest: s.wet });
        break;
      case 'moon':
        s.metal({ f: 2640 * p * r(), gain: 0.2 * g, dur: 0.9, parts: [1, 2.4, 4.1, 6], dest: s.wet });
        s.tone({ type: 'sine', f0: 3520 * p, dur: 0.3, gain: 0.09 * g, at: 0.02, dest: s.wet });
        s.noise({ type: 'highpass', f0: 8000, dur: 0.14, gain: 0.2 * g });
        break;
      case 'star':
        [1568, 2093, 2637, 3136].forEach((f, i) => s.tone({ type: 'sine', f0: f * p, dur: 0.13, gain: 0.13 * g, at: i * 0.035, dest: s.wet }));
        s.noise({ type: 'highpass', f0: 9500, dur: 0.18, gain: 0.18 * g });
        break;
      case 'shadow':
        s.noise({ type: 'bandpass', f0: 1300, f1: 280, q: 2, dur: 0.15, gain: 0.36 * g, attack: 0.002 });
        s.tone({ type: 'sine', f0: 230 * p, f1: 85, dur: 0.22, gain: 0.26 * g, lp: 600 });
        s.noise({ type: 'highpass', f0: 7000, dur: 0.05, gain: 0.1 * g, at: 0.02 });
        break;
      case 'wing':
        s.noise({ type: 'bandpass', f0: 3000, f1: 8000, q: 1.5, dur: 0.3, gain: 0.16 * g, attack: 0.04, dest: s.wet });
        s.tone({ type: 'triangle', f0: 1175 * p, f1: 1760 * p, dur: 0.26, gain: 0.1 * g, dest: s.wet });
        s.metal({ f: 1320 * p, gain: 0.12 * g, dur: 0.6, parts: [1, 2.01, 3.02], dest: s.wet });
        break;
      case 'chaos':
        s.tone({ type: 'sawtooth', f0: 90 * p, f1: 640 * p, dur: 0.16, gain: 0.1 * g, dist: true, lp: 3000 });
        s.noise({ type: 'bandpass', f0: 4200, f1: 600, q: 2.4, dur: 0.2, gain: 0.3 * g });
        s.metal({ f: 1500 * p * r(), gain: 0.14 * g, dur: 0.5, parts: [1, 1.41, 2.73], dest: s.wet });
        break;
      case 'katana':                                       // 거합 : 맑은 쇳소리 + 공기 가르는 소리
        s.metal({ f: 3800 * p * r(), gain: 0.16 * g, dur: 0.45, parts: [1, 2.7, 5.2], dest: s.wet });
        s.noise({ type: 'highpass', f0: 7000, dur: 0.08, gain: 0.3 * g, attack: 0.001 });
        s.tone({ type: 'sine', f0: 2400 * p, f1: 900, dur: 0.09, gain: 0.1 * g });
        break;
      case 'thorn':                                        // 덩굴 : 나무 삐걱임 + 가시 꺾이는 소리
        s.tick({ f: 900 * r(), gain: 0.4 * g, dur: 0.02 });
        s.noise({ type: 'bandpass', f0: 700, f1: 280, q: 2, dur: 0.14, gain: 0.36 * g, attack: 0.002 });
        s.tone({ type: 'triangle', f0: 190 * p, f1: 90, dur: 0.12, gain: 0.2 * g, lp: 800 });
        break;
      case 'dice':                                         // 주사위 : 굴러가는 딸깍 소리
        for (let i = 0; i < 4; i++) s.tick({ f: 1800 + Math.random() * 1600, gain: 0.3 * g, dur: 0.014, at: i * 0.032 + Math.random() * 0.012 });
        s.tone({ type: 'square', f0: 520 * p, f1: 380, dur: 0.05, gain: 0.07 * g, lp: 1800, at: 0.12 });
        s.sub({ f0: 110 * p, f1: 55, dur: 0.12, gain: 0.5 * g, drive: true, at: 0.12 });
        break;
      case 'coin':                                         // 금화 : 짤랑이는 금속음
        s.metal({ f: 2900 * p * r(), gain: 0.2 * g, dur: 0.5, parts: [1, 2.4, 4.1], dest: s.wet });
        s.tick({ f: 3600, gain: 0.3 * g, dur: 0.012 });
        s.noise({ type: 'bandpass', f0: 1500, f1: 700, q: 1.4, dur: 0.1, gain: 0.2 * g });
        break;
      case 'steam':                                        // 증기 : 쉬익 + 쇠 부딪히는 소리
        s.noise({ type: 'highpass', f0: 4500, dur: 0.3, gain: 0.3 * g, attack: 0.01 });
        s.noise({ type: 'bandpass', f0: 2600, f1: 1400, q: 0.9, dur: 0.26, gain: 0.25 * g, attack: 0.02 });
        s.metal({ f: 260 * p, gain: 0.2 * g, dur: 0.4, parts: [1, 2.1, 3.3] });
        break;
      case 'sun':                                          // 태양 : 밝은 금관 소리 + 열기
        s.tone({ type: 'triangle', f0: 660 * p, f1: 1320 * p, dur: 0.3, gain: 0.12 * g, dest: s.wet });
        s.metal({ f: 1320 * p, gain: 0.16 * g, dur: 0.7, parts: [1, 2, 3], dest: s.wet });
        s.noise({ type: 'lowpass', f0: 2200, f1: 300, q: 0.8, dur: 0.3, gain: 0.35 * g, attack: 0.002 });
        break;
    }
    if (crit) s.tone({ type: 'sine', f0: 2200 * p, f1: 3300 * p, dur: 0.1, gain: 0.07 * g });
  },

  // 아래 이름들은 기존 호출부 호환용 (재질 기본값 = 살)
  hit(s, v, p) { SFX.impact(s, v, p, 'flesh', 1, false); },
  hitLight(s, v, p) { SFX.impact(s, v, p, 'flesh', 0, false); },
  heavy(s, v, p) { SFX.impact(s, v, p, 'armor', 2, false); },
  crit(s, v, p) {
    s.metal({ f: 3100 * p, gain: 0.2 * v, dur: 0.42, parts: [1, 2.4, 3.9, 6.2], dest: s.wet });
    s.noise({ type: 'bandpass', f0: 2800, f1: 9000, q: 3, dur: 0.17, gain: 0.3 * v, attack: 0.003 });
    s.tone({ type: 'triangle', f0: 1300 * p, f1: 2600 * p, dur: 0.1, gain: 0.1 * v });
  },
  // 몬스터가 플레이어를 때릴 때 (둔탁하게)
  blunt(s, v, p) {
    s.tick({ f: 1100, q: 0.8, gain: 0.8 * v, dur: 0.03 });
    s.noise({ type: 'lowpass', f0: 1300, f1: 150, q: 0.9, dur: 0.24, gain: 0.8 * v, attack: 0.0006 });
    s.sub({ f0: 155 * p, f1: 38, dur: 0.28, drop: 0.08, gain: 1.15 * v, drive: true });
    s.duck(0.3, 0.2);
  },
  hurt(s, v, p) {
    SFX.blunt(s, v, p);
    s.tone({ type: 'square', f0: 340 * p, f1: 150, dur: 0.13, gain: 0.06 * v, lp: 1400 });
  },

  // ---------- 검 / 이동 ----------
  swing(s, v, p) {
    s.noise({ type: 'bandpass', f0: 900 * p, f1: 3400 * p, q: 3.2, dur: 0.12, gain: 0.3 * v, attack: 0.012 });
    s.noise({ type: 'highpass', f0: 5000, dur: 0.05, gain: 0.07 * v, at: 0.05 });
  },
  swingBig(s, v, p) {
    s.noise({ type: 'bandpass', f0: 380 * p, f1: 2200 * p, q: 2.4, dur: 0.24, gain: 0.42 * v, attack: 0.03 });
    s.sub({ f0: 150 * p, f1: 60, dur: 0.2, gain: 0.25 * v, at: 0.06 });
  },
  ring(s, v, p) {
    s.metal({ f: 1850 * p, gain: 0.16 * v, dur: 0.6, parts: [1, 2.76, 5.4], dest: s.wet });
    s.noise({ type: 'highpass', f0: 6500, dur: 0.16, gain: 0.1 * v, attack: 0.004, dest: s.wet });
  },
  dash(s, v, p) { s.noise({ type: 'bandpass', f0: 800 * p, f1: 3000, q: 1.2, dur: 0.2, gain: 0.22 * v, attack: 0.02 }); },
  jump(s, v, p) { s.noise({ type: 'bandpass', f0: 420 * p, f1: 1100, q: 1.4, dur: 0.11, gain: 0.14 * v, attack: 0.006 }); },
  land(s, v, p) {
    s.tick({ f: 900, gain: 0.35 * v, dur: 0.02 });
    s.noise({ type: 'lowpass', f0: 600, f1: 90, dur: 0.14, gain: 0.4 * v, attack: 0.0008 });
    s.sub({ f0: 120 * p, f1: 48, dur: 0.12, gain: 0.5 * v });
  },
  // 적이 바닥에 처박힐 때
  thud(s, v, p) {
    s.tick({ f: 700, q: 0.8, gain: 0.7 * v, dur: 0.03 });
    s.noise({ type: 'lowpass', f0: 800, f1: 90, q: 0.9, dur: 0.3, gain: 0.75 * v, attack: 0.0008 });
    s.sub({ f0: 130 * p, f1: 30, dur: 0.34, drop: 0.1, gain: 1.2 * v, drive: true });
    s.duck(0.25, 0.22);
  },

  // ---------- 스킬 ----------
  charge(s, v, p) {
    s.tone({ type: 'sawtooth', f0: 150 * p, f1: 900 * p, dur: 0.45, gain: 0.07 * v, lp: 2400, attack: 0.12 });
    s.noise({ type: 'bandpass', f0: 500, f1: 4200, q: 2.4, dur: 0.45, gain: 0.13 * v, attack: 0.3, dest: s.wet });
  },
  flash(s, v, p) {
    s.tick({ f: 7000, gain: 0.7 * v, dur: 0.03 });
    s.noise({ type: 'highpass', f0: 2500, f1: 9000, dur: 0.2, gain: 0.45 * v, attack: 0.002 });
    s.metal({ f: 3100 * p, gain: 0.13 * v, dur: 0.8, parts: [1, 2.4, 4.1], dest: s.wet });
  },
  sheath(s, v, p) {
    s.noise({ type: 'bandpass', f0: 2400, f1: 5200, q: 3.5, dur: 0.12, gain: 0.22 * v, attack: 0.01 });
    s.tick({ f: 4000, gain: 0.35 * v, dur: 0.02, at: 0.1 });
    s.metal({ f: 2600 * p, gain: 0.1 * v, dur: 0.45, at: 0.1, dest: s.wet });
  },
  explode(s, v, p) {
    s.tick({ f: 2000, gain: 1.0 * v, dur: 0.035 });
    s.noise({ type: 'lowpass', f0: 4000, f1: 80, q: 0.6, dur: 0.9, gain: 1.0 * v, attack: 0.0008 });
    s.noise({ type: 'bandpass', f0: 1400, f1: 300, q: 0.8, dur: 0.3, gain: 0.55 * v, attack: 0.001 });
    s.sub({ f0: 150 * p, f1: 26, dur: 0.85, drop: 0.2, gain: 1.5 * v, drive: true });
    s.duck(0.6, 0.45);
  },
  quake(s, v, p) {
    SFX.explode(s, v * 0.85, p * 0.85);
    s.noise({ type: 'lowpass', f0: 260, f1: 60, q: 1, dur: 1.3, gain: 0.8 * v, attack: 0.04 });
  },
  pillar(s, v, p) {
    s.tick({ f: 2600, gain: 0.5 * v, dur: 0.02 });
    s.noise({ type: 'lowpass', f0: 2400, f1: 160, dur: 0.6, gain: 0.6 * v, attack: 0.001 });
    s.sub({ f0: 110 * p, f1: 42, dur: 0.5, gain: 0.7 * v, drive: true });
  },
  ultSlash(s, v, p) {
    s.tick({ f: 6500, gain: 0.55 * v, dur: 0.012 });
    s.noise({ type: 'bandpass', f0: 4800 * p, f1: 1500, q: 1.2, dur: 0.1, gain: 0.45 * v, attack: 0.0004 });
    s.sub({ f0: 240 * p, f1: 60, dur: 0.12, drop: 0.04, gain: 0.7 * v, drive: true });
    s.metal({ f: 2400 * p, gain: 0.07 * v, dur: 0.18, parts: [1, 2.74], dest: s.wet });
  },
  counter(s, v, p) {
    s.tick({ f: 5000, gain: 0.6 * v, dur: 0.015 });
    s.tone({ type: 'square', f0: 1760 * p, f1: 880, dur: 0.1, gain: 0.08 * v, lp: 4000 });
    s.metal({ f: 2640 * p, gain: 0.12 * v, dur: 0.35, parts: [1, 2.4], dest: s.wet });
  },
  break(s, v, p) {
    for (let i = 0; i < 4; i++) s.noise({ type: 'highpass', f0: 2400 + i * 900, dur: 0.26, gain: 0.35 * v, at: i * 0.045, attack: 0.001 });
    s.tone({ type: 'sawtooth', f0: 700 * p, f1: 160, dur: 0.5, gain: 0.09 * v, lp: 3000 });
    SFX.heavy(s, v, p * 0.8);
  },
  magic(s, v, p) {
    s.tone({ type: 'sine', f0: 500 * p, f1: 1300 * p, dur: 0.4, gain: 0.09 * v, dest: s.wet });
    s.tone({ type: 'triangle', f0: 750 * p, f1: 1950 * p, dur: 0.35, gain: 0.05 * v, at: 0.03, dest: s.wet });
    s.noise({ type: 'bandpass', f0: 3000, f1: 6000, q: 4, dur: 0.35, gain: 0.07 * v, attack: 0.01, dest: s.wet });
  },
  throw(s, v, p) { s.noise({ type: 'bandpass', f0: 1200 * p, f1: 500, q: 2, dur: 0.12, gain: 0.14 * v, attack: 0.006 }); },
  roar(s, v, p) {
    const ctx = s.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(110 * p, t); o.frequency.linearRampToValueAtTime(80 * p, t + 1.5);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 22; const lg = ctx.createGain(); lg.gain.value = 18;
    lfo.connect(lg); lg.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800;
    const g = ctx.createGain(); s.env(g, t, 0.5 * v, 0.1, 1.6);
    const ws = ctx.createWaveShaper(); ws.curve = s.distCurve;
    o.connect(f); f.connect(ws); ws.connect(g); g.connect(s.wet);
    o.start(t); lfo.start(t); o.stop(t + 1.7); lfo.stop(t + 1.7);
    s.noise({ type: 'bandpass', f0: 380, f1: 250, q: 0.8, dur: 1.5, gain: 0.3 * v, attack: 0.1, dest: s.wet });
    s.sub({ f0: 70, f1: 45, dur: 1.4, gain: 0.5 * v, drive: true });
    s.duck(0.35, 1.2);
  },
  cutin(s, v) {
    s.tick({ f: 1500, gain: 0.8 * v, dur: 0.05 });
    s.sub({ f0: 90, f1: 26, dur: 1.5, drop: 0.4, gain: 1.4 * v, drive: true });
    s.noise({ type: 'lowpass', f0: 1800, f1: 60, dur: 1.3, gain: 0.7 * v, attack: 0.002 });
    s.noise({ type: 'highpass', f0: 3000, f1: 9000, dur: 0.5, gain: 0.25 * v, attack: 0.3, dest: s.wet });
    SFX.ring(s, v * 1.3, 0.8);
    s.duck(0.7, 1.4);
  },
  // 처치 : 몸이 터지듯 "퍽" + 영혼이 빠져나가는 반짝임
  kill(s, v, p) {
    s.tick({ f: 3200, gain: 0.55 * v, dur: 0.02 });
    s.noise({ type: 'bandpass', f0: 2600 * p, f1: 480, q: 1.1, dur: 0.24, gain: 0.7 * v, attack: 0.0005 });
    s.sub({ f0: 330 * p, f1: 38, dur: 0.32, drop: 0.09, gain: 1.15 * v, drive: true });
    s.metal({ f: 2300 * p, gain: 0.15 * v, dur: 0.55, dest: s.wet });
    s.tone({ type: 'sine', f0: 600 * p, f1: 2600 * p, dur: 0.26, gain: 0.07 * v, dest: s.wet });
    s.duck(0.5, 0.35); s.muffle(0.65, 0.22);
  },
  // 콤보 달성 (10 / 25 / 50 / 100 …) : 티어가 높을수록 음이 올라감
  combo(s, v, p) {
    s.sub({ f0: 150 * p, f1: 46, dur: 0.4, drop: 0.1, gain: 1.0 * v, drive: true });
    s.tone({ type: 'sawtooth', f0: 320 * p, f1: 1300 * p, dur: 0.22, gain: 0.08 * v, lp: 3600, attack: 0.02 });
    s.metal({ f: 1760 * p, gain: 0.2 * v, dur: 0.6, dest: s.wet });
    s.tone({ type: 'triangle', f0: 880 * p, dur: 0.13, gain: 0.11 * v, at: 0.06 });
    s.tone({ type: 'triangle', f0: 1320 * p, dur: 0.22, gain: 0.11 * v, at: 0.12, dest: s.wet });
    s.duck(0.35, 0.3);
  },
  // 몬스터 목소리 : 종류 × (맞을 때 / 죽을 때)
  vox(s, v, p, kind, mode) {
    // 목소리는 타격음 위에 얹히므로 종류별로 눌러서 타격음을 가리지 않게 한다 ([맞을 때, 죽을 때])
    v *= ({ goblin: [1, 0.55], orc: [0.4, 0.5], mage: [0.5, 0.6], boss: [0.42, 0.5] }[kind] || [1, 1])[mode === 'hit' ? 0 : 1];
    const VF = { a: [820, 1250], o: [520, 900], i: [320, 2350], u: [360, 820] };   // 모음 포먼트
    const F = (vw, q, g) => [[VF[vw][0], 0, q, g], [VF[vw][1], 0, q + 2, g * 0.7]];
    if (kind === 'goblin') {
      if (mode === 'hit') s.formant({ f0: 640 * p, f1: 360 * p, dur: 0.13, gain: 0.7 * v, forms: F('i', 6, 4), breath: 0.05 * v });
      else s.formant({ f0: 720 * p, f1: 130 * p, dur: 0.44, gain: 0.7 * v, forms: [[900, 380, 6, 4], [1900, 900, 8, 2.5]], breath: 0.06 * v, grow: [26, 0.35] });
    } else if (kind === 'orc') {
      if (mode === 'hit') s.formant({ f0: 125 * p, f1: 82 * p, dur: 0.24, gain: 0.85 * v, forms: F('o', 5, 4.5), dist: true, grow: [38, 0.55], breath: 0.06 * v });
      else s.formant({ f0: 150 * p, f1: 44 * p, dur: 0.75, gain: 0.9 * v, forms: [[760, 480, 5, 4.5], [1200, 800, 7, 3]], dist: true, grow: [30, 0.6], breath: 0.08 * v });
    } else if (kind === 'mage') {
      // 속삭임 + 텅 빈 울림 (리버브를 태워 유령처럼)
      if (mode === 'hit') {
        s.noise({ type: 'bandpass', f0: 2000 * p, f1: 800, q: 2.5, dur: 0.3, gain: 0.34 * v, attack: 0.02, dest: s.wet });
        s.formant({ f0: 420 * p, f1: 300 * p, dur: 0.3, gain: 0.5 * v, forms: F('u', 8, 3.5), dest: s.wet });
      } else {
        s.noise({ type: 'bandpass', f0: 2600 * p, f1: 500, q: 2, dur: 0.8, gain: 0.34 * v, attack: 0.04, dest: s.wet });
        s.formant({ f0: 520 * p, f1: 95 * p, dur: 0.85, gain: 0.55 * v, forms: [[420, 320, 7, 4], [900, 600, 8, 2.5]], grow: [9, 0.4], dest: s.wet });
      }
    } else if (kind === 'boss') {
      if (mode === 'hit') { s.formant({ f0: 72 * p, f1: 54 * p, dur: 0.34, gain: 1.0 * v, forms: F('o', 4, 5), dist: true, grow: [30, 0.5], dest: s.wet }); s.sub({ f0: 64 * p, f1: 42, dur: 0.3, gain: 0.5 * v }); }
      else { s.formant({ f0: 86 * p, f1: 34 * p, dur: 1.2, gain: 1.1 * v, forms: [[460, 300, 4, 5], [820, 500, 6, 3]], dist: true, grow: [24, 0.6], dest: s.wet }); s.sub({ f0: 60 * p, f1: 30, dur: 1.1, gain: 0.7 * v }); }
    }
  },

  enemyDie(s, v, p) {
    s.tone({ type: 'sawtooth', f0: 320 * p, f1: 55, dur: 0.45, gain: 0.07 * v, lp: 1400, dest: s.wet });
    s.noise({ type: 'bandpass', f0: 1200, f1: 300, dur: 0.4, gain: 0.12 * v, attack: 0.002 });
  },
  spawn(s, v, p) {
    s.tone({ type: 'sine', f0: 200 * p, f1: 600 * p, dur: 0.35, gain: 0.08 * v, dest: s.wet });
    s.noise({ type: 'bandpass', f0: 600, f1: 2400, q: 3, dur: 0.35, gain: 0.1 * v, attack: 0.01, dest: s.wet });
  },
  warn(s, v) { for (let i = 0; i < 3; i++) s.tone({ type: 'square', f0: 620, dur: 0.12, gain: 0.05 * v, at: i * 0.22, lp: 2000 }); },
  door(s, v) { s.noise({ type: 'lowpass', f0: 300, f1: 1400, dur: 0.5, gain: 0.25 * v, attack: 0.2, dest: s.wet }); },

  // ---------- UI / 아이템 ----------
  coin(s, v, p) {
    s.tone({ type: 'square', f0: 1318 * p, dur: 0.05, gain: 0.04 * v, lp: 5000 });
    s.tone({ type: 'square', f0: 1760 * p, dur: 0.13, gain: 0.04 * v, at: 0.05, lp: 5000, dest: s.wet });
  },
  potion(s, v, p) {
    s.tone({ type: 'sine', f0: 380 * p, f1: 980, dur: 0.3, gain: 0.14 * v });
    s.tone({ type: 'sine', f0: 760 * p, f1: 1600, dur: 0.35, gain: 0.07 * v, at: 0.06, dest: s.wet });
  },
  ui(s, v, p) { s.tone({ type: 'sine', f0: 900 * p, dur: 0.06, gain: 0.07 * v }); },
  select(s, v, p) {
    s.tone({ type: 'triangle', f0: 660 * p, dur: 0.1, gain: 0.11 * v });
    s.tone({ type: 'triangle', f0: 990 * p, dur: 0.18, gain: 0.09 * v, at: 0.07, dest: s.wet });
  },
  clear(s, v) {
    [523, 659, 784, 1047, 1319].forEach((f, i) => s.tone({ type: 'triangle', f0: f, dur: 0.5, gain: 0.11 * v, at: i * 0.08, dest: s.wet }));
    s.tone({ type: 'sine', f0: 2093, dur: 0.9, gain: 0.05 * v, at: 0.4, dest: s.wet });
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
