// BLADE RAID promo v3 : 타임라인 (150 BPM, 60fps, 1박 = 24프레임, 1800프레임)
(() => {
  'use strict';
  const V = window.__V, FW = 1920, FH = 1080, E = V.E, lerp = V.lerp, clamp = V.clamp, sat = V.sat;
  const CUTS = []; let cur = 0;
  const add = (id, len, def) => { const c = Object.assign({ id, f0: cur, f1: cur + len, len }, def); CUTS.push(c); cur += len; return c; };
  const WN = id => WEAPON_BY_ID[id];
  const rgba = (c, a) => `rgba(${c},${a})`;
  const beat = (F, amt, k = 5) => amt * Math.exp(-((F % 24) / 24) * k);
  const tintOf = (col, k = 0.5) => { const c = V.rgbf(col), m = Math.max(c[0], c[1], c[2], 0.01); return c.map(v => lerp(1, v / m, k)); };

  // ---------- 전투 컷 공통 ----------
  const sim = c => {
    V.pilot({ close: c.close || 110, noAtk: c.noAtk, idle: c.idle });
    if (Game.cutin && !c.keepCutin) Game.cutin = null;
    V.tick();
    if (!c.keepPick) Game.pickups.length = 0;
    if (c.passive !== false) for (const e of Game.enemies) if (!e.isBoss && e.aiWait < 30) e.aiWait = 30;
    if (!c.bossCut && V.gt % 30 === 0) V.fill(c.n ?? 8);
    V.capDmg(c.dmgCap ?? 5);
  };
  const advance = (c, rate) => { V.acc += rate; let n = 0, pk = Game.shakeA || 0; while (V.acc >= 1 - 1e-6) { sim(c); pk = Math.max(pk, Game.shakeA || 0); V.acc -= 1; n++; } V.shPk = Math.max(V.shPk || 0, pk * 1.17); Game.flash *= 0.86; Game.hurtA *= 0.9; return n; };
  const M = (id, len, o) => add(id, len, Object.assign({
    type: 'm', wo: { combo: o.combo !== false },
    async enter(c) {
      V.setup(c.dun, c.w, c.a || 'a0', { n: c.n ?? 8, tank: c.tank ?? 3000, x0: c.x0, dx: c.dx });
      V.dmgScale = c.dmgScale || 0.78;
      for (let k = 0; k < 10; k++) { V.pilot({ idle: true }); V.tick(); }
      V.cast(c.key || 's6');
      for (let u = 0; u < (c.pre || 0); u++) { sim(c); Game.flash *= 0.86; }
    },
    step(c, sf) { advance(c, c.rate ? c.rate(sf) : 1); },
    camF(c, sf) { const t = sf / c.len, e = E.out3(t); return { on: c.on || 'mid', z: lerp(c.z0 || 1.6, c.z1 || 1.32, e), roll: lerp(c.r0 || 0, c.r1 || 0, t), oy: c.oy ?? -26, ox: c.ox || 0, k: 0.18, kz: 1 }; },
    over(c, sf, ctx, L) {
      const wd = WN(c.w), col = wd.col;
      V.leak(ctx, V.F, col, 0.15, c.f0);
      if (c.ov) c.ov(c, sf, ctx, L);
    },
    text(c, sf, ctx) { const wd = WN(c.w); if (c.tag !== false) V.tag(ctx, sf - 5, c.len - 5, { name: wd.skills[c.key || 's6'].name, sub: wd.name, col: wd.col, right: c.tagR, kick: c.kick || 'ULTIMATE SKILL', scale: 1.22, y: 890 }); },
    lens(c, sf, L) { L.zoom *= 1 + beat(V.F, 0.03); L.streakTint = tintOf(WN(c.w).col, 0.7); if (c.ln) c.ln(c, sf, L); },
  }, o));

  // ---------- 주인공 단독 샷 ----------
  const mkActor = (w, a) => { Save.data.eq = { w, a: a || 'a0' }; const p = new Player(); p.x = p.px = 0; p.y = 100; p.z = p.pz = 0; p.facing = 1; p.scale = 1; return p; };
  const stepActor = p => { p.px = p.x; p.pz = p.z; p.stepAnim(); p.updateChains(); p.updateTrailAfter(); };
  const drawActor = (ctx, p, cx, cy, S) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(S, S); ctx.translate(-p.x, -sy(p.y, 0)); p.draw(ctx); p.drawTrail(ctx); ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; };
  const tipOf = (p, cx, cy, S, u = 1) => { const J = p.J, a = J.wAng * Math.PI / 180, L = RIG_PLAYER.wlen * ((p.wlook && p.wlook.L) || 1) * u; return { x: (cx + p.facing * (J.hand1.x + Math.sin(a) * L) * S) * 1.5, y: (cy + (J.hand1.y + Math.cos(a) * L) * S) * 1.5 }; };
  const g2d = () => { const G = Game, ctx = G.ctx; ctx.setTransform(G.ps, 0, 0, G.ps, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = true; return ctx; };

  // =====================================================================
  //  0. 콜드 오픈 (0 ~ 144) : 어둠 속의 검사 + "검 하나로, 끝까지."
  // =====================================================================
  add('open', 144, {
    noAuto: true, noAE: true,
    async enter(c) {
      Game.state = 'lobby'; FX.clear(); Game.time = 1000;
      const p = c.p = mkActor('w0', 'a0'); p.facing = -1; p.play('idle', 0);
      for (let i = 0; i < 80; i++) { Game.time++; stepActor(p); }
    },
    step(c, sf) {
      Game.time++; const p = c.p;
      if (sf === 96) { p.setGear(WN('w34')); p.play('hero', 10, 1, true); }
      p.bladeGlow = sf < 96 ? 0.15 + 0.15 * Math.sin(sf * 0.07) : Math.min(2.6, (sf - 96) / 10);
      stepActor(p);
    },
    render(c, sf, pc, L) {
      const ctx = g2d(), p = c.p, t = sf / c.len, hot = sf >= 96, hk = sat((sf - 96) / 14);
      ctx.fillStyle = '#020308'; ctx.fillRect(0, 0, W, H);
      const pull = E.out5(sat((sf - 96) / 12));
      const S = lerp(lerp(3.25, 3.6, E.io(sat(sf / 96))), lerp(2.5, 2.62, sat((sf - 96) / 48)), pull), cx = lerp(905 - t * 26, 1010, pull), cy = lerp(668, 690, pull);
      const col = hot ? '255,190,90' : '90,130,255', a0 = sat(sf / 40);
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, cx + 30, cy - 250, 520, col, (0.2 + 0.32 * hk) * a0);
      drawGlow(ctx, cx + 10, cy - 220, 250, col, (0.16 + 0.3 * hk) * a0);
      drawGlow(ctx, cx, cy + 6, 420, col, 0.16 * a0, 1, 0.16);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.ellipse(cx, cy + 4, 150, 22, 0, 0, TAU); ctx.fill();
      drawActor(ctx, p, cx, cy, S);
      // 어둠 속에서 서서히 드러난다
      const dk = 1 - sat(sf / 46) * 0.82 - hk * 0.18;
      if (dk > 0.01) { ctx.fillStyle = `rgba(2,3,8,${dk * 0.9})`; ctx.fillRect(0, 0, W, H); }
      pc.drawImage(Game.canvas, 0, 0, FW, FH);
      c.tip = tipOf(p, cx, cy, S, 1); c.mid = tipOf(p, cx, cy, S, 0.5);
    },
    over(c, sf, ctx, L) {
      const hot = sf >= 96, col = hot ? '255,180,80' : '110,150,255';
      V.embers(ctx, V.F, { n: hot ? 110 : 40, col: hot ? '255,160,70' : '120,160,255', a: hot ? 0.85 : 0.4, speed: hot ? 1.5 : 0.8 });
      V.bokeh(ctx, V.F, { n: 10, col, a: 0.05 });
      // 칼끝 섬광
      const gl = Math.exp(-Math.abs(sf - 30) / 5) + (hot ? Math.exp(-(sf - 96) / 7) * 1.4 : 0);
      if (c.tip) V.flare(ctx, c.tip.x, c.tip.y, 150 + gl * 90, col, Math.min(1, gl));
      if (hot && c.mid) V.flare(ctx, c.mid.x, c.mid.y, 260, col, 0.35 + 0.25 * Math.sin(sf * 0.4));
      if (sf === 48 || sf === 96) V.note('slam', sf === 96 ? 1 : 0.7);
    },
    text(c, sf, ctx) {
      V.slam(ctx, '검 하나로,', sf - 48, { x: 520, y: 430, size: 150, col: '120,160,255', dur: 96, pop: 2.2, rot: -0.05, outF: 6 });
      V.slam(ctx, '끝까지.', sf - 96, { x: 610, y: 610, size: 190, col: '255,180,70', dur: 48, pop: 2.6, rot: -0.05, outF: 5 });
    },
    lens(c, sf, L) {
      const hot = sf >= 96;
      L.bloom = hot ? 1.5 : 1.0; L.streak = hot ? 0.8 : 0.4; L.streakTint = hot ? [1, 0.75, 0.45] : [0.5, 0.7, 1]; L.bars = 0.085; L.vig = 0.6; L.ca = 3;
      for (const b of [48, 96]) if (sf >= b && sf < b + 10) { const k = 1 - (sf - b) / 10; L.zoom *= 1 + 0.05 * k; L.ca += 10 * k; L.rblur += 0.05 * k; L.flash += 0.12 * k * k; }
      if (hot) L.flashCol = [1, 0.8, 0.5];
    },
  });
  // ---------- 예고 섬광 4컷 (144 ~ 192) : 킥에 맞춰 0.2초씩 ----------
  const G = (id, o) => M(id, 12, Object.assign({ tag: false, trans: { type: 'cut' }, combo: false, rate: () => 0.6, z0: 1.9, z1: 1.75,
    ln(c, sf, L) { const k = 1 - sf / 12; L.bars = 0.085; L.sat = 0.85; L.contrast = 1.2; L.expo = 0.92 + 0.3 * k * k; L.vig = 0.6; L.ca += 4; L.rblur += 0.03 + 0.08 * k * k; L.flash += 0.25 * k * k * k; } }, o));
  G('g1', { dun: 'abyss', w: 'w3', pre: 196, r0: -0.05 });
  G('g2', { dun: 'jungle', w: 'w12', pre: 92, r0: 0.05 });
  G('g3', { dun: 'deep', w: 'w21', pre: 196, r0: -0.05 });
  G('g4', { dun: 'lair', w: 'w32', pre: 186, r0: 0.05, ln(c, sf, L) { const k = sf / 12; L.bars = 0.085; L.contrast = 1.2; L.vig = 0.5; L.rblur += 0.05 + 0.2 * k * k; L.zoom *= 1 + 0.25 * k * k; L.expo = 1 + 0.5 * k * k; L.flash += 0.9 * k * k * k; L.ca += 12 * k; } });

  // =====================================================================
  //  1. 드롭 : 각성기 몽타주 12컷 x 2박 (192 ~ 768)
  // =====================================================================
  M('m1', 48, { dun: 'frost', w: 'w1', pre: 26, z0: 1.75, z1: 1.3, r0: -0.045, r1: -0.02, trans: { type: 'flash', col: '255,200,140' }, tagR: true, impact: true, impA: [0.1, 0.02, 0.0], impB: [1, 0.95, 0.8] });
  M('m2', 48, { dun: 'neon', w: 'w31', pre: 46, z0: 1.3, z1: 1.65, r0: 0.04, r1: 0.02, trans: { type: 'slash', dir: 1, col: '90,255,230' }, tagR: true });
  M('m3', 48, { dun: 'crystal', w: 'w10', pre: 58, z0: 1.7, z1: 1.3, r0: -0.03, r1: -0.05, trans: { type: 'whip', dir: -1 } });
  M('m4', 48, { dun: 'grave', w: 'w8', pre: 32, z0: 1.25, z1: 1.6, r0: 0.045, r1: 0.02, trans: { type: 'zoom' }, impact: true, impA: [0.08, 0.06, 0.0], impB: [1, 1, 0.85] });
  M('m5', 48, { dun: 'swamp', w: 'w29', pre: 6, z0: 1.7, z1: 1.35, r0: -0.04, r1: -0.02, trans: { type: 'slash', dir: -1, col: '190,90,255' } });
  M('m6', 48, { dun: 'desert', w: 'w23', pre: 142, z0: 1.3, z1: 1.6, r0: 0.03, r1: 0.05, trans: { type: 'glitch' }, tagR: true, impact: true, impA: [0.12, 0.05, 0.0], impB: [1, 0.97, 0.8] });
  M('m7', 48, { dun: 'forest', w: 'w15', pre: 108, z0: 1.75, z1: 1.4, r0: -0.05, r1: -0.02, trans: { type: 'whip', dir: 1 }, tagR: true });
  M('m8', 48, { dun: 'cosmos', w: 'w33', pre: 198, z0: 1.3, z1: 1.6, r0: 0.04, r1: 0.02, trans: { type: 'slash', dir: 1, col: '210,180,255' } });
  M('m9', 48, { dun: 'mine', w: 'w5', pre: 22, rate: () => 1.45, z0: 1.7, z1: 1.3, r0: -0.03, r1: -0.05, trans: { type: 'zoom' }, impact: true });
  M('m10', 48, { dun: 'bloodmoon', w: 'w26', pre: 66, z0: 1.3, z1: 1.6, r0: 0.05, r1: 0.02, trans: { type: 'whip', dir: -1 } });
  M('m11', 48, { dun: 'ruins', w: 'w35', key: 's5', pre: 4, z0: 1.85, z1: 1.45, r0: -0.05, r1: -0.02, trans: { type: 'slash', dir: -1, col: '255,90,70' }, kick: 'NEW WEAPON', impact: true, impA: [0.12, 0.0, 0.02], impB: [1, 0.9, 0.85] });
  M('m12', 48, { dun: 'chaos', w: 'w17', pre: 22, z0: 1.25, z1: 1.55, r0: 0.03, r1: 0.06, trans: { type: 'glitch' }, tagR: true, impact: true, impGap: 30, impA: [0.1, 0.0, 0.08], impB: [1, 0.9, 1] });

  // =====================================================================
  //  2. 보스 러시 20종 (768 ~ 960)
  // =====================================================================
  let bi = 0;
  const B = (dun, len) => {
    const idx = ++bi;
    add('b' + idx, len, {
      type: 'b', dun, idx, bossCut: true, trans: { type: 'cut' }, wo: { noDoor: true },
      async enter(c) {
        V.setup(dun, 'w34', 'a0', { last: true, keepIntro: true });
        const tgt = len >= 12 ? 67 : 72;
        for (let k = 0; k < 500 && Game.state === 'intro' && Game.introT < tgt; k++) V.tick();
        c.name = V.boss ? V.boss.name : ''; c.title = V.boss ? (V.boss.title || '') : '';
      },
      step(c, sf) { V.tick(); Game.flash *= 0.86; },
      camF(c, sf) { const t = sf / c.len, ze = clamp(400 / ((V.boss && V.boss.h) || 260), 1.2, 1.8); return { on: 'boss', z: lerp(ze * 0.84, ze, E.out3(t)), roll: (idx % 2 ? 1 : -1) * lerp(0.05, 0.02, t), oy: -6, k: 1, kz: 1 }; },
      over(c, sf, ctx, L) {
        const R = idx % 2 === 0, col = '255,90,60';
        V.leak(ctx, V.F, col, 0.14, idx);
      },
      text(c, sf, ctx) { V.tag(ctx, len >= 12 ? sf + 2 : sf + 10, 999, { name: c.name, sub: c.title, col: '255,90,60', right: idx % 2 === 0, kick: 'BOSS  ' + String(idx).padStart(2, '0') + ' / 20', y: 890, scale: 1.15 }); },
      lens(c, sf, L) { const k = 1 - sf / c.len; L.bars = 0.075; L.contrast = 1.14; L.rblur += 0.05 * k * k; L.flash += 0.1 * k * k; L.flashCol = [1, 0.5, 0.35]; L.streakTint = [1, 0.6, 0.45]; L.zoom *= 1 + 0.04 * k; },
    });
  };
  for (const d of ['forest', 'frost', 'desert', 'abyss', 'lair', 'bloodmoon', 'deep', 'clock']) B(d, 12);
  for (const d of ['ruins', 'mine', 'swamp', 'factory', 'sky', 'crystal', 'grave', 'jungle']) B(d, 6);
  for (const d of ['neon', 'cosmos', 'chaos', 'storm']) B(d, 12);

  // =====================================================================
  //  3. 결전 : 뇌신 라이진 vs 라그나로크 (960 ~ 1152)
  // =====================================================================
  add('boss', 192, {
    type: 'bf', bossCut: true, keepCutin: true, passive: true, impact: true, impShake: 99, impFreeze: 99, impLen: 6, impGap: 80, impA: [0.1, 0.04, 0.0], impB: [1, 0.96, 0.82],
    trans: { type: 'zoom' }, wo: { bossBar: true, combo: true }, close: 170, dmgCap: 6,
    async enter(c) {
      V.setup('storm', 'w34', 'a0', { last: true, gap: 400 });
      V.dmgScale = 0.8;
      const b = V.boss; b.aiWait = 9999; b.dmgMul = () => 0.4;
      const ks = V.curKinds;
      for (let i = 0; i < 5; i++) { const e = V.spawn(ks[i % ks.length], b.x + (i - 2) * 105 - 40, clamp(b.y + ((i % 3) - 1) * 58, 30, DEPTH - 30), 3000); e.aiWait = 9999; }
      for (let k = 0; k < 8; k++) { V.pilot({ idle: true }); V.tick(); }
      V.cast('s6'); V.pilot({ idle: true }); V.tick();
      c.u = 0; c.hitSf = -1; c.slow = 0; c.bladeSf = -1; c.bladeRate = 1;
    },
    step(c, sf) {
      const b = V.boss; b.aiWait = 9999; b.hp = Math.max(b.hp, b.hpMax * 0.18);
      for (const e of Game.enemies) if (!e.isBoss) e.aiWait = 9999;
      const blade = FX.world.some(e => e && e.constructor && e.constructor.name === 'WBigBlade');
      if (blade && c.bladeSf < 0) { c.bladeSf = sf; c.bladeRate = clamp(35.4 / Math.max(6, 144 - sf), 0.5, 3); }
      let rate;
      if (Game.cutin) rate = 84 / 34;
      else if (c.hitSf >= 0) rate = c.slow > 0 ? 0.4 : 1;
      else if (c.bladeSf >= 0) rate = c.bladeRate;
      else rate = 2.35;
      if (c.slow > 0) c.slow--;
      const wasCut = !!Game.cutin;
      const n = advance(c, rate);
      if (!wasCut && !Game.cutin) c.u += n;
      if (c.hitSf < 0 && c.bladeSf >= 0 && sf > c.bladeSf + 8 && (Game.flash > 0.5 || V.shPk > 22)) { c.hitSf = sf; c.slow = 14; V.note('mega', 1); V.impT = 6; V.impLast = V.F; }
    },
    camF(c, sf) {
      if (Game.cutin) return { on: 'center', z: 1, k: 1, kz: 1 };
      if (c.hitSf < 0) {
        if (c.bladeSf < 0) return { on: 'mid', z: lerp(1.22, 1.5, sat(c.u / 175)), roll: -0.035, oy: -44, k: 0.1, kz: 0.12 };
        return { on: 'boss', z: 1.1, roll: 0.02, oy: -120, k: 0.16, kz: 0.14 };
      }
      const a = sf - c.hitSf; return { on: 'boss', z: lerp(1.12, 1.55, E.out3(sat(a / 46))), roll: lerp(0.02, 0.05, sat(a / 46)), oy: -50, k: 0.22, kz: 0.3 };
    },
    over(c, sf, ctx, L) {
      V.leak(ctx, V.F, '255,190,100', 0.16, 7);
      if (c.hitSf >= 0) { const a = sf - c.hitSf; V.speed(ctx, 960, 560, Math.max(0, 1 - a / 16), V.F, '255,235,190', 80); }
    },
    lens(c, sf, L) {
      L.bars = Game.cutin ? 0 : 0.075; L.streakTint = [1, 0.8, 0.5]; L.streak = 0.5;
      if (c.hitSf >= 0) { const a = sf - c.hitSf, k = Math.exp(-a / 12); L.bloom += 0.6 * k; L.rblur += 0.06 * k; L.zoom *= 1 + 0.08 * k; L.ca += 10 * k; L.flash += 0.2 * Math.exp(-a / 4); L.flashCol = [1, 0.92, 0.75]; }
    },
  });

  // =====================================================================
  //  4. 무기고 : 검 36종 (1152 ~ 1344)
  // =====================================================================
  const drawBlade = (ctx, wd, cx, cy, ang, lenPx, glow, flat = 1) => {
    const Lk = wd.look || {}, len = RIG_PLAYER.wlen * (Lk.L || 1), sc = lenPx / (len + 24) * (Lk.karam ? 0.7 : 1);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); ctx.scale(sc, sc * flat); ctx.translate(-(len - 16) / 2, 0);
    drawPlayerBlade(ctx, { hand1: { x: 0, y: 0 }, wAng: 90 }, RIG_PLAYER.pal, { wlook: Lk, bladeGlow: glow, id: 3 }, {});
    ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };
  const ARS1 = ['w1', 'w2', 'w9', 'w23', 'w31', 'w33', 'w17', 'w35'];
  const ARS2 = ['w0', 'w18', 'w3', 'w24', 'w4', 'w19', 'w5', 'w25', 'w6', 'w26', 'w7', 'w20', 'w8', 'w27', 'w10', 'w28'];
  const widx = id => WEAPONS.findIndex(w => w.id === id) + 1;
  add('arsenal', 192, {
    noAuto: true, noAE: true, trans: { type: 'whip', dir: 1 },
    async enter(c) { Game.state = 'lobby'; FX.clear(); },
    step(c, sf) { Game.time++; },
    render(c, sf, pc, L) {
      let w, age, ph, k;
      if (sf < 96) { k = (sf / 12) | 0; w = ARS1[k]; age = sf % 12; ph = 1; }
      else if (sf < 144) { k = ((sf - 96) / 3) | 0; w = ARS2[k]; age = (sf - 96) % 3; ph = 2; }
      else { k = 0; w = 'w34'; age = sf - 144; ph = 3; }
      const wd = WN(w), col = wd.col, idx = ph === 3 ? 36 : widx(w);
      c.cur = { w, age, ph, k, col, idx };
      pc.fillStyle = '#04050a'; pc.fillRect(0, 0, FW, FH);
      const bx = ph === 3 ? 1180 : 1040, by = 500;
      let g = pc.createRadialGradient(bx, by, 0, bx, by, 1100); g.addColorStop(0, rgba(col, 0.42)); g.addColorStop(0.45, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
      pc.fillStyle = g; pc.fillRect(0, 0, FW, FH);
      V.rays(pc, bx, by, V.F * 3, col, 0.085, 18, 1700);
      // 가로 속도선
      pc.save(); pc.globalCompositeOperation = 'lighter'; const r = V.mul(77 + (V.F >> 1));
      for (let i = 0; i < 26; i++) { const y = r() * FH, x = r() * FW, l = 200 + r() * 700; pc.fillStyle = rgba(col, 0.05 + r() * 0.14); pc.fillRect(x - l / 2, y, l, 2 + r() * 3); }
      pc.restore();
      // 큰 번호 (외곽선)
      const no = String(idx).padStart(2, '0');
      V.T(pc, no, ph === 3 ? 420 : 300, 470, { size: 560, fill: null, stroke: 5, sc: rgba(col, 0.3) });
      // 검
      const e = ph === 2 ? 1 : E.out5(sat((age + 1) / 9)), side = k % 2 ? 1 : -1;
      const ang0 = ph === 3 ? -1.05 : -0.62 + side * 0.08, ang = ang0 - (1 - e) * 1.7 * side, sc = lerp(1.6, 1, e) * (1 + age * 0.0016);
      const lenPx = (ph === 3 ? 1180 : 1080) * sc;
      const flat = Math.cos(Math.min(1.2, (1 - e) * 1.4));
      drawBlade(pc, wd, bx, by, ang, lenPx, 1.3, Math.max(0.35, flat));
      // 칼날을 훑는 빛
      const u = ph === 2 ? 0.5 : sat((age - 2) / (ph === 3 ? 30 : 9)), fa = Math.sin(u * Math.PI);
      V.flare(pc, bx + Math.cos(ang) * (u - 0.5) * lenPx * 0.86, by + Math.sin(ang) * (u - 0.5) * lenPx * 0.86, 170, col, fa * 0.95);
    },
    over(c, sf, ctx, L) {
      const q = c.cur, wd = WN(q.w);
      V.embers(ctx, V.F, { n: 60, col: q.col, a: 0.7, speed: 1.6 });
      if (q.age === 0 && q.ph !== 2) V.note(q.ph === 3 ? 'slam' : 'tick', 1);
    },
    text(c, sf, ctx) {
      const q = c.cur, wd = WN(q.w);
      if (q.ph === 1) V.tag(ctx, q.age + 3, 999, { name: wd.name, sub: wd.sub, col: q.col, kick: 'WEAPON  ' + String(q.idx).padStart(2, '0') + ' / 36', y: 880, scale: 1.4 });
      else if (q.ph === 2) V.tag(ctx, 20, 999, { name: wd.name, sub: '', col: q.col, kick: 'WEAPON  ' + String(q.idx).padStart(2, '0') + ' / 36', y: 880, scale: 1.4 });
      else {
        V.stat(ctx, q.age - 2, { num: 36, unit: '종의 검', en: 'ALL UNIQUE BLADES', col: '255,205,120', x: 110, y: 420, count: true, dur: 60 });
        V.slam(ctx, '방어구 26종  ·  강화 +15', q.age - 16, { x: 560, y: 640, size: 62, col: '255,205,120', dur: 40, pop: 1.6, rot: -0.05 });
        V.tag(ctx, q.age - 6, 999, { name: wd.name, sub: wd.sub, col: q.col, kick: 'MYTHIC', right: true, y: 880, scale: 1.3 });
      }
    },
    lens(c, sf, L) {
      const q = c.cur, k = q.ph === 2 ? 0.5 : Math.exp(-q.age / 4);
      L.bloom = 1.25 + 0.8 * k; L.streak = 0.75; L.streakTint = tintOf(q.col, 0.8); L.ca = 3 + 9 * k; L.zoom *= 1 + 0.045 * k; L.rblur += 0.04 * k; L.flash += 0.14 * k * k; L.flashCol = V.rgbf(q.col); L.vig = 0.5;
      if (q.ph === 3) { const a = q.age; L.zoom *= 1 + 0.05 * Math.exp(-a / 6); }
    },
  });

  // =====================================================================
  //  5. 성장 : 스킬 트리 (1344 ~ 1392) + 무한의 탑 (1392 ~ 1440)
  // =====================================================================
  const TSEQ = ['b_edge', 'q_dmg', 'e_dmg', 't_dmg', 'f_dmg', 'v_hp', 'w_dmg', 'b_combo', 'q_cd', 'e_cd', 't_cd', 'f_cd', 'v_mp', 'w_cdr', 'b_drain', 'q_air', 'e_mp', 't_mp', 'f_crit', 'v_swift', 'w_mp', 'b_wave', 'q_quake', 'e_ghost', 't_fourth', 'f_echo', 'v_undying', 'w_zen'];
  add('tree', 48, {
    noAuto: true, res: 2.25, noPrep: true, trans: { type: 'whip', dir: -1 },
    async enter(c) {
      Save.data.lv = 100; Save.data.xp = 0; Save.data.tree = {};
      Game.toLobby(); Game.toTree(); TreeUI.sel = 'b_edge'; c.i = 0;
      for (let k = 0; k < 7; k++) { const n = TREE_BY_ID[TSEQ[k]]; TreeUI.sel = n.id; for (let j = 0; j < 9 && Prog.check(n).ok; j++) TreeUI.tryLearn(); }
      c.i = 7; TreeUI.msgT = 0;
    },
    step(c, sf) {
      if (sf % 2 === 0 && c.i < TSEQ.length) { const n = TREE_BY_ID[TSEQ[c.i++]]; TreeUI.sel = n.id; for (let j = 0; j < 9 && Prog.check(n).ok; j++) TreeUI.tryLearn(); }
      TreeUI.msgT = 0; V.tick();
    },
    render(c, sf, pc, L) {
      Game.render();
      const t = sf / c.len, z = lerp(1.42, 1.16, E.out3(t)), cw = Game.canvas.width, ch = Game.canvas.height, sw = cw / z, sh = ch / z;
      const fx = lerp(520, 600, t) * Game.ps, fy = lerp(300, 380, E.out3(t)) * Game.ps;
      pc.fillStyle = '#000'; pc.fillRect(0, 0, FW, FH);
      pc.drawImage(Game.canvas, clamp(fx - sw / 2, 0, cw - sw), clamp(fy - sh / 2, 0, ch - sh), sw, sh, 0, 0, FW, FH);
    },
    over(c, sf, ctx, L) {
      V.leak(ctx, V.F, '170,130,255', 0.2, 3);
      V.dark(ctx, 0.12);
      if (sf === 3) V.note('slam', 0.8);
    },
    text(c, sf, ctx) { V.stat(ctx, sf - 3, { num: 100, unit: '레벨 · 스킬 트리', en: '7 BRANCHES  /  28 NODES', col: '190,150,255', x: 1700, y: 270, right: true, count: true, dur: 45 }); },
    lens(c, sf, L) { L.bloom = 1.25; L.thr = 0.5; L.streak = 0.5; L.streakTint = [0.75, 0.6, 1]; L.ca = 2.5; L.zoom *= 1 + beat(V.F, 0.03); L.roll = -0.02; L.zoom *= 1.05; },
  });
  add('tower', 48, {
    type: 'm', bossCut: true, trans: { type: 'slash', dir: 1, col: '120,255,170' }, wo: { combo: true }, close: 160, impact: true, impA: [0.0, 0.08, 0.04], impB: [0.9, 1, 0.9],
    async enter(c) {
      V.setup('tower', 'w32', 'a0', { from: 149, boss: true, gap: 320 });
      V.dmgScale = 0.78;
      const b = V.boss; if (b) { b.aiWait = 9999; b.dmgMul = () => 0.3; }
      for (let k = 0; k < 10; k++) { V.pilot({ idle: true }); V.tick(); }
      V.cast('s6');
      for (let u = 0; u < 176; u++) { if (b) { b.aiWait = 9999; b.hp = Math.max(b.hp, b.hpMax * 0.3); } sim(c); Game.flash *= 0.86; }
    },
    step(c, sf) { const b = V.boss; if (b) { b.aiWait = 9999; b.hp = Math.max(b.hp, b.hpMax * 0.3); } advance(c, 1.15); },
    camF(c, sf) { const t = sf / c.len; return { on: 'mid', z: lerp(1.2, 1.5, E.out3(t)), roll: lerp(0.05, 0.02, t), oy: -50, k: 0.2, kz: 1 }; },
    over(c, sf, ctx, L) {
      V.leak(ctx, V.F, '120,255,170', 0.2, 5);
      if (sf === 2) V.note('slam', 0.8);
    },
    text(c, sf, ctx) {
      const fl = Math.min(200, Math.round(lerp(1, 200, E.out3(sat(sf / 30)))));
      V.stat(ctx, sf - 2, { num: fl, unit: '층 · 무한의 탑', en: 'ENDLESS TOWER  200F+', col: '120,255,170', x: 110, y: 250, dur: 46, plus: sf > 32 });
    },
    lens(c, sf, L) { L.zoom *= 1 + beat(V.F, 0.03); L.streakTint = [0.6, 1, 0.75]; },
  });

  // =====================================================================
  //  6. 드롭 직전 : 가속 리캡 (1440 ~ 1536)
  // =====================================================================
  const RECAP = [222, 318, 414, 510, 606, 702, 270, 366, 462, 558, 654, 750, 800, 880, 1010, 1124];
  add('recap', 96, {
    noAuto: true, noPrep: true, noAE: true,
    async enter(c) { c.imgs = []; for (const F of RECAP) { try { c.imgs.push(await V.loadImg(`${V.HOST}/${V.DIR}/${V.frameName(F)}?t=${Date.now()}`)); } catch (e) { c.imgs.push(null); } } },
    sched(sf) { if (sf < 48) return [(sf / 12) | 0, sf % 12, 12]; if (sf < 72) return [4 + (((sf - 48) / 6) | 0), (sf - 48) % 6, 6]; return [8 + (((sf - 72) / 3) | 0), (sf - 72) % 3, 3]; },
    render(c, sf, pc, L) {
      const [i, age, dur] = c.sched(sf), im = c.imgs[i % c.imgs.length], t = sf / 96;
      pc.fillStyle = '#000'; pc.fillRect(0, 0, FW, FH);
      if (im) { const z = 1.1 + age * 0.012 + t * 0.3; pc.save(); pc.translate(960, 540); pc.rotate((i % 2 ? 1 : -1) * (0.015 + t * 0.03)); pc.scale(z, z); pc.drawImage(im, -960, -540, FW, FH); pc.restore(); }
      if (age === 0) V.note('tick', dur / 12);
    },
    over(c, sf, ctx, L) { const t = sf / 96; V.speed(ctx, 960, 540, t * t * 0.9, V.F, '255,240,210', 90); },
    lens(c, sf, L) {
      const [i, age, dur] = c.sched(sf), t = sf / 96, k = 1 - age / dur;
      L.bloom = 0.3 + t * 0.9; L.vig = 0.25; L.grain = 0.03; L.sat = 1.02; L.contrast = 1.02; L.split = 0; L.dist = 0.02 + t * 0.1; L.ca = 1 + 10 * k + t * 8;
      L.zoom *= 1 + 0.05 * k + t * t * 0.1; L.rblur += 0.03 * k + t * t * 0.2; L.expo = 1 + t * t * 0.5; L.glitch = t > 0.5 ? (age === 0 ? 0.6 : 0.15) : 0; L.bars = 0.075 * (1 - t);
      L.flash += Math.pow(sat((sf - 78) / 18), 2.2) * 1.0;
    },
  });

  // =====================================================================
  //  7. 엔드 카드 (1536 ~ 1800)
  // =====================================================================
  const LOGO = (ctx, sf) => {
    const e = E.out5(sat(sf / 9)), s = lerp(3.0, 1, e) * (1 + sf * 0.00022), a = Math.min(1, 0.3 + sf / 3);
    ctx.save(); ctx.translate(960, 372); ctx.rotate(-0.045); ctx.scale(s, s); ctx.globalAlpha = a;
    const str = 'BLADE RAID', size = 218;
    for (let k = 1; k <= 3; k++) { const ea = sf - k * 3; if (ea < 0 || ea > 22) continue; const es = 1 + ea * 0.03 * k; ctx.save(); ctx.scale(es, es); ctx.globalAlpha = a * (1 - ea / 22) * 0.5; V.T(ctx, str, 0, 0, { size, fill: null, stroke: 3, sc: 'rgba(255,200,110,1)', ls: 4 }); ctx.restore(); }
    V.T(ctx, str, 14, 16, { size, fill: 'rgba(200,40,30,0.95)', stroke: 26, sc: 'rgba(200,40,30,0.95)', ls: 4 });
    const g = ctx.createLinearGradient(0, -105, 0, 98); g.addColorStop(0, '#ffffff'); g.addColorStop(0.44, '#c3d0ee'); g.addColorStop(0.5, '#62749f'); g.addColorStop(0.56, '#aebde4'); g.addColorStop(1, '#f2f6ff');
    V.T(ctx, str, 0, 0, { size, fill: g, stroke: 24, sc: '#05060b', ls: 4 });
    // 붉은 검흔
    const sw = E.out3(sat((sf - 12) / 12));
    if (sw > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const x0 = -700, y0 = 104, x1 = x0 + 1420 * sw, y1 = y0 - 215 * sw;
      const gg = ctx.createLinearGradient(x0, y0, x1, y1); gg.addColorStop(0, 'rgba(255,60,40,0)'); gg.addColorStop(0.6, 'rgba(255,70,45,0.95)'); gg.addColorStop(1, 'rgba(255,230,200,1)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1 - 9); ctx.lineTo(x1 + 30, y1); ctx.lineTo(x1, y1 + 9); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (sf < 6) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - sf / 6); V.T(ctx, str, 0, 0, { size, fill: '#fff', ls: 4 }); }
    ctx.restore();
    return { sw, tip: { x: 960 + (-700 + 1420 * sw), y: 372 + (104 - 215 * sw) - (-700 + 1420 * sw) * 0.045 } };
  };
  add('end', 264, {
    noAuto: true, noPrep: true, noAE: true,
    async enter(c) { Game.state = 'lobby'; FX.clear(); },
    step(c, sf) { Game.time++; },
    render(c, sf, pc, L) {
      const a0 = sat(sf / 6);
      let g = pc.createRadialGradient(960, 420, 0, 960, 420, 1250); g.addColorStop(0, '#231a34'); g.addColorStop(0.4, '#0d0f22'); g.addColorStop(1, '#030409');
      pc.fillStyle = g; pc.fillRect(0, 0, FW, FH);
      V.rays(pc, 960, 400, V.F * 1.6, '255,180,90', 0.1 * a0, 18, 1700);
      g = pc.createRadialGradient(960, 390, 0, 960, 390, 760); g.addColorStop(0, 'rgba(255,170,80,0.34)'); g.addColorStop(1, 'rgba(255,170,80,0)');
      pc.save(); pc.globalCompositeOperation = 'lighter'; pc.fillStyle = g; pc.fillRect(0, 0, FW, FH); pc.restore();
      V.bokeh(pc, V.F, { n: 12, col: '255,180,100', a: 0.06 });
      V.embers(pc, V.F, { n: 130, col: '255,160,70', a: 0.9, speed: 1.3 });
      const ra = sf / 34; if (ra < 1) { V.ring(pc, 960, 400, 80 + E.out3(ra) * 1300, 26 * (1 - ra), '255,210,140', 0.8 * (1 - ra)); V.ring(pc, 960, 400, 40 + E.out3(ra) * 900, 12 * (1 - ra), '255,255,255', 0.7 * (1 - ra)); }
      if (sf < 70) { pc.save(); pc.globalCompositeOperation = 'lighter'; const r = V.mul(5);
        for (let i = 0; i < 150; i++) { const an = r() * 6.283, sp = 9 + r() * 34, d = sp * sf * (1 - sf / 150), x = 960 + Math.cos(an) * d, y = 400 + Math.sin(an) * d * 0.7 + sf * sf * 0.09, al = Math.max(0, 1 - sf / 66); pc.fillStyle = rgba(r() < 0.6 ? '255,200,110' : '255,255,255', al); const s2 = 3 + r() * 8; pc.fillRect(x - s2 / 2, y - s2 / 2, s2, s2 * 0.5); }
        pc.restore(); }
      if (sf === 0) V.note('logo', 1); if (sf === 12) V.note('shing', 1); if (sf === 50) V.note('slam', 0.8); if (sf === 70) V.note('tick', 1);
    },
    text(c, sf, ctx, L, post) {
      c.lg = LOGO(ctx, sf);
      V.slam(ctx, '블 레 이 드   레 이 드', sf - 22, { x: 960, y: 540, size: 54, col: '255,200,120', dur: 999, pop: 1.5, rot: -0.045 });
      const ca = sf - 50;
      if (ca >= 0) {
        const e = E.out5(sat(ca / 10)), w = 860 * e;
        ctx.save(); ctx.translate(960, 700); ctx.rotate(-0.03);
        V.para(ctx, -w / 2, -58, w, 116, 22, '#ffc85a'); V.para(ctx, -w / 2 + 16, 66, w * 0.82, 9, 4, '#ffffff');
        ctx.globalAlpha = sat(ca / 6); V.T(ctx, '지금 무료로 플레이', 0, 4, { size: 82, fill: '#0b0c12' });
        if (ca < 8) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - ca / 8; V.para(ctx, -w / 2, -58, w, 116, 22, '#ffffff'); }
        ctx.restore();
      }
      V.slam(ctx, 'yeonny3209.github.io/blade-raid', sf - 70, { x: 960, y: 850, size: 62, col: '120,200,255', dur: 999, pop: 1.4, rot: -0.03, fill: '#ffffff' });
      V.slam(ctx, '웹 브라우저   ·   안드로이드   ·   설치 없이 바로', sf - 88, { x: 960, y: 952, size: 42, col: '255,200,120', dur: 999, pop: 1.3, rot: -0.03, fill: '#ffe2b0' });
    },
    over2(c, sf, pc, L) {
      const lg = c.lg; if (!lg) return;
      if (lg.sw > 0 && lg.sw < 1) V.flare(pc, lg.tip.x, lg.tip.y, 260, '255,120,80', 1);
      else if (lg.sw >= 1) V.flare(pc, 960 + 720, 372 - 143, 200, '255,140,90', 0.25 + 0.6 * Math.exp(-(sf - 24) / 10));
      const sh = ((sf - 70) % 120) / 26; if (sf > 70 && sh < 1) V.flare(pc, lerp(250, 1700, sh), 372 - (sh - 0.5) * 70, 150, '255,255,255', Math.sin(sh * Math.PI) * 0.75);
    },
    postA(c, sf) { return sat((sf - 3) / 6); },
    lens(c, sf, L) {
      const k = Math.exp(-sf / 9);
      L.bloom = 1.1 + 1.6 * k; L.streak = 0.7; L.streakTint = [1, 0.7, 0.45]; L.ca = 2 + 14 * k; L.zoom *= 1 + 0.1 * k; L.rblur += 0.14 * k; L.flash += Math.pow(sat(1 - sf / 12), 2) * 0.95; L.vig = 0.55; L.split = 0.3;
      for (const b of [50, 70]) if (sf >= b && sf < b + 10) { const q = 1 - (sf - b) / 10; L.zoom *= 1 + 0.02 * q; L.ca += 5 * q; }
    },
  });

  V.CUTS = CUTS; V.TOTAL = cur;
  // ---------- 전역 자막 / 전역 렌즈 ----------
  const m1 = CUTS.find(c => c.id === 'm1').f0, b1 = CUTS.find(c => c.id === 'b1').f0;
  V.gText = (F, ctx, c, sf) => {
    V.stat(ctx, F - (m1 + 8), { num: 20, unit: '개의 던전', en: '20 DUNGEONS', col: '255,170,70', dur: 84, count: true });
    V.stat(ctx, F - (m1 + 240 + 8), { num: 70, unit: '고유 스킬', en: 'UNIQUE SKILLS', col: '255,220,90', dur: 84, count: true, plus: true });
    V.stat(ctx, F - (b1 + 6), { num: 20, unit: '종의 보스', en: '20 NAMED BOSSES', col: '255,90,60', dur: 182, y: 262 });
  };
  V.gOver = (F, ctx, L, c, sf) => { if (F === m1 + 8 || F === m1 + 248 || F === b1 + 6) V.note('slam', 0.9); };
  V.gPost = null;
  V.gLens = (F, L) => {
    if (F < 12) L.fade = Math.max(L.fade, 1 - F / 12);
    if (F >= V.TOTAL - 24) L.fade = Math.max(L.fade, (F - (V.TOTAL - 24)) / 22);
  };
})();
'cuts ok ' + window.__V.CUTS.length + ' ' + window.__V.TOTAL;
