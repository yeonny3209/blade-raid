'use strict';
// ============================================================
//  검의 대장간 2 : 혈월도 크림슨 팡 (w4) · 대지분쇄검 그라바돈 (w5) · 질풍검 바람가르기 (w6)
// ============================================================

// ---------- 피의 가시 : 땅에서 휘어진 핏빛 가시가 솟았다가 가라앉는다 ----------
class FThorn {
  constructor(x, y, h, o = {}) { Object.assign(this, { x, y, h, t: 0, add: false, life: o.life || 34, lean: o.lean ?? rand(-0.4, 0.4), w: o.w || 9, col: o.col || ['#3a0610', '#a8142c', '#ff7a8c'] }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, up = this.t < 5 ? E.out3(this.t / 5) : u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1, h = this.h * up, gy = sy(this.y, 0), x = this.x, l = this.lean, w = this.w, c = this.col;
    if (h < 2) return;
    const tx = x + l * h, ty = gy - h;
    ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(x - w, gy); ctx.quadraticCurveTo(x - w * 0.3 + l * h * 0.3, gy - h * 0.55, tx, ty); ctx.quadraticCurveTo(x + w * 0.6 + l * h * 0.5, gy - h * 0.5, x + w, gy); ctx.fill();
    ctx.fillStyle = c[1]; ctx.beginPath(); ctx.moveTo(x - w * 0.4, gy); ctx.quadraticCurveTo(x + l * h * 0.35, gy - h * 0.55, tx, ty); ctx.quadraticCurveTo(x + w * 0.4 + l * h * 0.45, gy - h * 0.5, x + w * 0.5, gy); ctx.fill();
    ctx.strokeStyle = c[2]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - w * 0.1, gy - 2); ctx.quadraticCurveTo(x + l * h * 0.35, gy - h * 0.55, tx, ty); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, tx, ty + 4, 12, '255,40,70', 0.6); ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------- 광란의 기운 : 피의 계약이 이어지는 동안 몸을 감싼다 ----------
class FBloodAura {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p;
    if (!(p.bloodT > 0) || p.hp <= 0) return false;
    if (this.t % 3 === 0) FX.add('world', new FP(p.x + rand(-26, 26), sy(p.y, p.z + rand(10, 120)), { kind: chance(0.7) ? 'glow' : 'drip', col: chance(0.7) ? '255,30,60' : '150,8,24', vx: rand(-0.4, 0.4), vy: chance(0.7) ? rand(-2, -0.8) : 0.5, grav: 0, life: randi(20, 34), r: rand(5, 10) }));
    return true;
  }
  draw(ctx) {
    const p = this.p, gy = sy(p.y, 0), pu = 0.5 + 0.5 * Math.sin(this.t * 0.15), a = Math.min(1, this.t / 10, p.bloodT / 30);
    ctx.strokeStyle = `rgba(255,40,70,${(0.35 + pu * 0.3) * a})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(p.x, gy, 56 + pu * 6, 16 + pu * 2, 0, 0, TAU); ctx.stroke();
    ctx.save(); ctx.translate(p.x, gy); ctx.scale(1, 0.3); ctx.rotate(this.t * 0.03); ctx.strokeStyle = `rgba(255,90,110,${0.5 * a})`; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const g = i / 6 * TAU; ctx.beginPath(); ctx.arc(0, 0, 66, g, g + 0.5); ctx.stroke(); }
    ctx.restore();
  }
}

// ---------- 핏줄기 : 적에게서 내게로 피가 흘러온다 ----------
class FBloodStream {
  constructor(p, e, life) { Object.assign(this, { p, e, life, t: 0, add: true, k: rand(-1, 1) }); }
  update() {
    this.t++; const p = this.p, e = this.e;
    if (!e.hittable() && !e.dying) return false;
    if (this.t % 2 === 0) { const s = this.pts(); const q = s[1]; FX.add('world', new FP(q[0], q[1], { kind: 'glow', col: '255,30,60', tx: s[3][0], ty: s[3][1], pull: 0.08, life: 26, r: rand(6, 10) })); }
    return this.t < this.life;
  }
  pts() { const p = this.p, e = this.e, a = [e.x, sy(e.y, e.z + e.h * 0.55)], b = [p.x, sy(p.y, p.z + 80)], m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 90 - this.k * 50]; return [a, a, m, b]; }
  draw(ctx) {
    const [a, , m, b] = this.pts(), u = this.t / this.life, al = Math.min(1, this.t / 8, (1 - u) * 6), ph = this.t * 0.08;
    ctx.lineCap = 'round';
    for (const [w, col, k] of [[9, '200,10,40', 0.35], [3, '255,90,110', 0.8]]) { ctx.strokeStyle = `rgba(${col},${k * al})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m[0], m[1], b[0], b[1]); ctx.stroke(); }
    for (let i = 0; i < 4; i++) {                            // 흐르는 핏방울
      const t = (ph + i / 4) % 1, v = 1 - t, x = v * v * a[0] + 2 * v * t * m[0] + t * t * b[0], y = v * v * a[1] + 2 * v * t * m[1] + t * t * b[1];
      drawGlow(ctx, x, y, 12, '255,40,70', al);
    }
  }
}

// ---------- 진홍의 만월 : 하늘에 떠오르는 붉은 달 (화면 위쪽에 고정) ----------
class FBloodMoon {
  constructor(life) { Object.assign(this, { t: 0, life, add: false, crack: 0, burst: 0 }); }
  update() { this.t++; return this.t < this.life; }
  draw(ctx) {
    const X = Game.cam.x + W / 2, rise = E.out3(Math.min(1, this.t / 40)), Y = 260 - rise * 130, R = 92, a = Math.min(1, (this.life - this.t) / 10);
    if (this.burst > 0) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, R * (1.5 + this.burst * 3.5), '255,40,60', (1 - this.burst) * 0.55);
      ctx.strokeStyle = `rgba(255,200,200,${1 - this.burst})`; ctx.lineWidth = 6 * (1 - this.burst) + 1; ctx.beginPath(); ctx.arc(X, Y, R * (1 + this.burst * 4), 0, TAU); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; return; }
    ctx.save(); ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, R * 3.2, '255,20,40', 0.45); drawGlow(ctx, X, Y, R * 1.6, '255,60,70', 0.5); ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(X - R * 0.3, Y - R * 0.3, R * 0.1, X, Y, R);
    g.addColorStop(0, '#ff9a8a'); g.addColorStop(0.45, '#e0283c'); g.addColorStop(1, '#5a0414');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, R, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,0,16,0.35)';                    // 바다 · 분화구
    for (const [dx, dy, r] of [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.3], [-0.1, 0.4, 0.15], [0.4, -0.35, 0.12], [-0.45, 0.25, 0.1]]) { ctx.beginPath(); ctx.arc(X + dx * R, Y + dy * R, r * R, 0, TAU); ctx.fill(); }
    if (this.crack > 0) {
      ctx.strokeStyle = `rgba(255,230,230,${this.crack})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
      const Rn = mulberry(13);
      for (let k = 0; k < 7; k++) { let x = X, y = Y, ang = k / 7 * TAU + Rn(); ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { const L = R * 0.3 * this.crack; x += Math.cos(ang) * L; y += Math.sin(ang) * L; ctx.lineTo(x, y); ang += (Rn() - 0.5) * 1.1; } }
      ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,60,80,${this.crack * 0.6})`; ctx.lineWidth = 9; ctx.stroke();
    }
    ctx.restore();
  }
}

Object.assign(WH, {
  blBurst: WS.hd({ dmg: 4.5, kx: 7, kz: 7, airKz: 7, stun: 40, stop: 9, shake: 8, fx: 'heavy', power: 1.5 }),
  blThorn: WS.hd({ dmg: 2.4, kx: 1, kz: 10, airKz: 8, stun: 40, stop: 4, shake: 4, fx: 'pierce', ang: 90, power: 1.2 }),
  bmCres: WS.hd({ dmg: 5, kx: 4, kz: 6, airKz: 6, stun: 40, stop: 5, shake: 5, fx: 'slash', power: 1.6 }),
  bmEnd: WS.hd({ dmg: 14, kx: 10, kz: 12, airKz: 11, stun: 60, stop: 14, shake: 16, fx: 'heavy', power: 2.4 }),
});

// ============================================================
//  혈월도 크림슨 팡
// ============================================================
forgeDef('w4', {
  name: '피의 계약', mp: 100, cd: 14, ico: ['drop', '255,40,70'],
  desc: '칼날에 현재 HP의 12%를 바쳐 8초간 광란 : 피해 +40%, 모든 적중이 흡혈. 계약 순간 피가 소용돌이쳐 칼날로 빨려들고, 주변 땅에서 피의 가시가 솟구친다.',
  act: {
    anim: 'win', len: 40, cancel: 26, atkCancel: 24,
    start(p) { p.vx = 0; p.bladeGlow = 1; Sfx.wlayer('blood', 1, false); },
    update(p, f) {
      if (f < 12 && f % 2 === 0) for (let i = 0; i < FF.n(3); i++) { const a = rand(0, TAU), d = rand(70, 140); FX.add('world', new FP(p.x + Math.cos(a) * d, sy(p.y, 70) + Math.sin(a) * d * 0.6, { kind: 'glow', col: '255,30,60', tx: p.x + p.facing * 20, ty: sy(p.y, 120), pull: 0.06, life: 20, r: rand(6, 10) })); }
      if (f === 12) {
        const cost = Math.floor(p.hp * 0.12);
        p.hp = Math.max(1, p.hp - cost); p.bloodT = 480; p.bladeGlow = 2.6;
        FX.add('top', new DmgText(p.x, sy(p.y, p.z) - 150, cost, 'p'));
        FX.add('top', new Label(p.x, sy(p.y, p.z) - 190, 'BLOOD PACT', { col: ['#ffe0e0', '#ff2a40'], size: 28, life: 60 }));
        FX.add('world', new FBloodAura(p));
        FF.impact(p.x, sy(p.y, 80), '255,30,60', 1.6, { burst: '255,180,190' });
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 250, 22, { col: '255,50,80', w: 14 }));
        FX.add('ground', new FDecal(p.x, p.y, 150, 200, { kind: 'pool', col: '110,0,18' }));
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = rand(70, 190); FX.add('world', new FThorn(p.x + Math.cos(a) * r, clamp(p.y + Math.sin(a) * r * 0.4, 0, DEPTH), rand(50, 100), { lean: Math.cos(a) * 0.4, life: 30 + randi(0, 10) })); }
        for (let i = 0; i < FF.n(18); i++) FX.add('world', new Drop(p.x, p.y, 70, { vx: rand(-8, 8), vz: rand(4, 11), r: rand(2.5, 4), col: '#b01428', splat: true }));
        Sfx.wlayer('blood', 3, true); Sfx.play('explode', 0.5, 0.7); Game.addShake(9); Game.flashScreen(0.3, '255,40,60'); FF.screen({ kind: 'vig', col: '120,0,20', a: 0.6, life: 40, fin: 3, fout: 2 });
        WS.area(p, p.x, p.y, 200, 84, WH.blBurst);
        WS.area(p, p.x, p.y, 200, 84, WH.blThorn, { set: new Set() });
      }
    },
  },
}, {
  name: '진홍의 만월', mp: 480, cd: 42, ico: ['moonred', '255,40,70'],
  desc: '하늘에 붉은 달을 띄우고 피의 줄로 화면 안의 모든 적과 이어 2초 동안 생명력을 빨아들인다. 마지막에 검을 치켜들면 달이 금 가며 터지고, 쏟아지는 진홍의 초승달이 모든 적을 벤다.',
  act: {
    anim: 'ultUp', len: 170, cancel: 164, atkCancel: 164,
    start(p) { forgeCine(p, '진홍의 만월', '眞 紅 滿 月', '230,30,60', { bars: 180, dim: 0.5 }); p.invul = 240; p.vx = 0; p.gravOff = true; },
    update(p, f) {
      p.vx = 0; p.vy = 0; p.armorF = true; p.z = lerp(p.z, 80, 0.08);
      if (f === 2) {
        p._moon = FX.add('world', new FBloodMoon(176));
        FF.screen({ col: '120,0,20', a: 0.22, life: 170, fin: 30, fout: 6 });
        FX.add('ground', new FCircle(p.x, p.y, 160, 160, { kind: 'star', col: '255,40,70', col2: '255,170,180', spin: 0.015 }));
        p.tether = WS.onScreen();
        for (const e of p.tether) FX.add('world', new FBloodStream(p, e, 130));
        Sfx.wlayer('blood', 2, false); Sfx.play('charge', 0.8, 0.7);
      }
      if (f >= 12 && f <= 130 && f % 10 === 0) {
        let heal = 0;
        for (const e of p.tether || []) {
          if (!e.hittable()) continue;
          heal += Gear.proc(p, e, 0.6, { quiet: true, hit: { dmg: 0.3, kx: 0, stun: 14 } });
          if (!e.isBoss) { e.x = lerp(e.x, p.x, 0.04); e.z = lerp(e.z, 30, 0.2); }
        }
        Gear.heal(p, Math.min(heal * 0.12, p.hpMax * 0.03), f % 30 !== 0);
        Sfx.wlayer('blood', 1, false);
      }
      if (f > 120 && f < 140 && p._moon) p._moon.crack = (f - 120) / 20;
      if (f === 132) { p.play('ultUp', 0, 1, true); p.bladeGlow = 3; Sfx.play('charge', 1, 1.4); }
      if (f === 140) {                                       // 달이 터진다
        p.gravOff = false;
        if (p._moon) p._moon.burst = 0.01;
        FX.add('world', new FRun(30, r => { if (p._moon) p._moon.burst = Math.min(0.99, r.t / 30); }));
        Sfx.play('explode', 1.1); Game.addShake(20); Game.flashScreen(0.45, '255,60,80'); Game.zoomPunch(1.08); Game.slowmo(0.4, 24);
        const L = (p.tether || []).filter(e => e.hittable());
        L.forEach((e, i) => Gear.later(4 + i * 2, () => {      // 진홍의 초승달 비
          if (!e.hittable()) return;
          const X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
          FX.add('world', new FSlash(X, Y, rand(-1.2, -0.4) * (i % 2 ? 1 : -1), 110, { col: '255,40,70', core: '255,220,220', th: 14, dark: '60,0,10' }));
          FX.add('world', new Crescent(X, Y, 90, -2.4, 0.6, { th: 24, life: 14, col: '255,40,70', core: '255,230,230' }));
          for (let k = 0; k < FF.n(6); k++) FX.add('world', new Drop(e.x, e.y, e.z + e.h * 0.5, { vx: rand(-6, 6), vz: rand(3, 9), r: rand(2, 3.5), col: '#b01428', splat: true }));
          applyHit(p, e, WH.bmCres, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
          applyHit(p, e, WH.bmEnd, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
          Sfx.wlayer('blood', 2, true);
        }));
        p.tether = null; forgeUndim(40);
      }
    },
    end(p) { p.gravOff = false; p.tether = null; p._moon = null; forgeUndim(10); },
  },
});

// ============================================================
//  대지분쇄검 그라바돈 : 깎인 면이 있는 바위 기둥 · 하늘에서 떨어지는 거암
// ============================================================
const ROCK = ['#281c13', '#634630', '#a27b52', '#e0c592'];
class FRockPillar {
  //  o.top 'spike'(뾰족) | 'flat'(넓적) · o.lean 기울기 · o.delay · o.life · o.glow 틈새 용암빛
  constructor(x, y, h, o = {}) {
    Object.assign(this, { x, y, h, t: 0, add: false, w: o.w || h * 0.2, lean: o.lean ?? rand(-0.15, 0.15), delay: o.delay || 0, life: o.life || 46, top: o.top || 'flat', glow: o.glow ?? 0, seed: randi(1, 9999) });
  }
  update() {
    this.t++;
    const t = this.t - this.delay;
    if (t === 1) {
      for (let i = 0; i < FF.n(5); i++) FX.add('world', new Debris(this.x + rand(-this.w, this.w), this.y, 4, { vx: rand(-5, 5), vz: rand(6, 13), s: rand(3, 7), col: ROCK.slice(1), life: 50 }));
      FX.add('world', new FP(this.x, sy(this.y, 4), { kind: 'smoke', col: '150,125,95', vx: rand(-1, 1), vy: -0.6, r: this.w * 1.2, grow: 0.8, life: 34 }));
    }
    if (t === this.life - 10) for (let i = 0; i < FF.n(4); i++) FX.add('world', new Debris(this.x, this.y, this.h * rand(0.2, 0.8), { vx: rand(-3, 3), vz: rand(0, 4), s: rand(3, 8), col: ROCK.slice(1), life: 40 }));
    return t < this.life;
  }
  draw(ctx) {
    const t = this.t - this.delay; if (t < 1) return;
    const u = t / this.life, rise = t < 6 ? E.out3(t / 6) * 1.08 : t < 10 ? 1.08 - (t - 6) / 4 * 0.08 : 1, sink = u > 0.78 ? (u - 0.78) / 0.22 : 0;
    const h = this.h * rise * (1 - sink * 0.9), gy = sy(this.y, 0) + sink * 6, x = this.x, w = this.w, l = this.lean * h, R = mulberry(this.seed);
    if (h < 3) return;
    ctx.save(); ctx.globalAlpha = 1 - Math.max(0, sink - 0.6) / 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, gy + 2, w * 1.3, w * 0.35, 0, 0, TAU); ctx.fill();
    const sp = this.top === 'spike';
    const tl = [x - w * 0.55 + l * 0.9, gy - h * (sp ? 0.72 : 0.93)], tr = [x + w * 0.6 + l * 0.9, gy - h * (sp ? 0.66 : 0.89)], tp = sp ? [x + l * 1.1 + w * 0.08, gy - h] : [x + w * 0.05 + l, gy - h];
    const bl = [x - w, gy], bm = [x + w * 0.15, gy + w * 0.12], br = [x + w, gy], cm = [x + w * 0.12 + l * 0.95, gy - h * (sp ? 0.7 : 0.88)];
    const face = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); };
    face([bl, bm, cm, tl], ROCK[2]);                          // 왼쪽 면 (빛 받는 면)
    face([bm, br, tr, cm], ROCK[1]);                          // 오른쪽 면 (그늘)
    face([tl, cm, tr, tp], ROCK[3]);                          // 윗면 · 끝
    ctx.strokeStyle = 'rgba(30,20,12,0.6)'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 1; i < 5; i++) { const k = i / 5 * 0.85, yy = gy - h * k; ctx.moveTo(x - w * (1 - k * 0.45) + l * k, yy + R() * 6); ctx.lineTo(x + w * 0.13 + l * k, yy + w * 0.12 * (1 - k) + R() * 4); ctx.lineTo(x + w * (1 - k * 0.4) + l * k, yy - R() * 6); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,26,16,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bm[0], bm[1]); ctx.lineTo(cm[0], cm[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,210,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bl[0], bl[1]); ctx.lineTo(tl[0], tl[1]); ctx.lineTo(tp[0], tp[1]); ctx.lineTo(tr[0], tr[1]); ctx.stroke();
    if (this.glow) {                                          // 바위틈 용암빛
      const g = this.glow * (1 - sink); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,150,50,${0.8 * g})`; ctx.lineWidth = 2; ctx.beginPath();
      let px = x - w * 0.3, py = gy - 4; ctx.moveTo(px, py); for (let i = 0; i < 5; i++) { px += (R() - 0.4) * w * 0.4 + l * 0.15; py -= h * 0.15; ctx.lineTo(px, py); } ctx.stroke();
      drawGlow(ctx, x, gy, w * 1.6, '255,130,40', 0.35 * g, 1, 0.4);
    }
    ctx.restore();
  }
}

class FBoulder {
  constructor(p, x, y, o = {}) { Object.assign(this, { p, x, y, t: 0, add: false, dur: o.dur || 34, r: o.r || 120, onEnd: o.onEnd, from: o.from || 0, seed: randi(1, 9999), rot: 0 }); this.pts = []; const R = mulberry(this.seed); for (let i = 0; i < 13; i++) this.pts.push(0.78 + R() * 0.26); }
  pos() { const k = Math.pow(Math.min(1, this.t / this.dur), 2.2), gy = sy(this.y, 0); return [this.x + this.from * (1 - k), lerp(gy - 900, gy - this.r * 0.8, k), k]; }
  update() {
    this.t++; this.rot += 0.03;
    const [X, Y] = this.pos();
    if (this.t % 2 === 0) { FX.add('world', new FP(X + rand(-this.r, this.r) * 0.6, Y - this.r * 0.6, { kind: 'smoke', col: '120,95,70', vx: rand(-1, 1), vy: -3, r: rand(20, 40), grow: 0.6, life: 30 })); FX.add('world', new FP(X + rand(-this.r, this.r) * 0.5, Y - this.r * 0.3, { kind: 'ember', col: '255,150,60', vx: rand(-2, 2), vy: rand(-6, -3), r: rand(2, 4), life: 24 })); }
    if (this.t >= this.dur) { if (this.onEnd) this.onEnd(this); return false; }
    return true;
  }
  draw(ctx) {
    const [X, Y, k] = this.pos(), r = this.r, gy = sy(this.y, 0);
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.15 + k * 0.45})`; ctx.beginPath(); ctx.ellipse(this.x, gy, r * (0.4 + k * 0.9), r * (0.12 + k * 0.25), 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';                 // 대기 마찰열
    const tg = ctx.createLinearGradient(X, Y - r * 3.5, X, Y); tg.addColorStop(0, 'rgba(255,120,40,0)'); tg.addColorStop(1, `rgba(255,150,60,${0.35 * k + 0.1})`);
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(X - r * 0.9, Y); ctx.lineTo(X - r * 0.4 - this.from * 0.3, Y - r * 3.5); ctx.lineTo(X + r * 0.4 - this.from * 0.3, Y - r * 3.5); ctx.lineTo(X + r * 0.9, Y); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(X, Y); ctx.rotate(this.rot);
    const P = this.pts.map((q, i) => { const a = i / this.pts.length * TAU; return [Math.cos(a) * r * q, Math.sin(a) * r * q]; });
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); g.addColorStop(0, ROCK[3]); g.addColorStop(0.5, ROCK[2]); g.addColorStop(1, ROCK[0]);
    ctx.fillStyle = g; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,12,0.8)'; ctx.lineWidth = 2; ctx.beginPath();          // 면 나누기
    for (let i = 0; i < P.length; i += 3) { ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i][0] * 0.35, P[i][1] * 0.35); }
    ctx.moveTo(P[0][0] * 0.35, P[0][1] * 0.35); for (let i = 3; i < P.length; i += 3) ctx.lineTo(P[i][0] * 0.35, P[i][1] * 0.35); ctx.closePath(); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,150,50,${0.5 + k * 0.5})`; ctx.lineWidth = 3; ctx.lineJoin = 'round';  // 용암 균열
    ctx.beginPath(); const R = mulberry(this.seed + 1);
    for (let j = 0; j < 4; j++) { let a = R() * TAU, x = Math.cos(a) * r * 0.2, y = Math.sin(a) * r * 0.2; ctx.moveTo(x, y); for (let s = 0; s < 4; s++) { a += (R() - 0.5) * 1.2; x += Math.cos(a) * r * 0.18; y += Math.sin(a) * r * 0.18; ctx.lineTo(x, y); } }
    ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,180,0.9)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

// 지면 강타 공통 연출 : 분화구 · 방사형 바위 가시 · 흙먼지 벽
function gtCrater(p, x, y, s = 1) {
  const gy = sy(y, 0);
  FX.add('ground', new FDecal(x, y, 170 * s, 260, { kind: 'crack', col: '255,150,60' }));
  FX.add('ground', new FDecal(x, y, 110 * s, 260, { kind: 'scorch', col: '255,140,50' }));
  FX.add('ground', new FRing(x, gy, 30, 300 * s, 26, { col: '230,190,130', w: 18 }));
  FX.add('ground', new FRing(x, gy, 20, 200 * s, 20, { col: '255,170,90', w: 10, delay: 3 }));
  const n = Math.round(10 * Math.min(s, 1.4));
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.2, 0.2), r = rand(90, 170) * s; FX.add('world', new FRockPillar(x + Math.cos(a) * r, clamp(y + Math.sin(a) * r * 0.35, 0, DEPTH), rand(60, 110) * s, { top: 'spike', lean: Math.cos(a) * 0.35, w: rand(14, 22) * s, delay: randi(1, 6), life: 40, glow: 0.6 })); }
  for (let i = 0; i < FF.n(20 * s); i++) { const a = rand(0, TAU); FX.add('world', new FP(x + Math.cos(a) * 40, gy + Math.sin(a) * 12, { kind: 'smoke', col: '160,135,100', vx: Math.cos(a) * rand(4, 9), vy: Math.sin(a) * rand(0.5, 2) - 0.5, drag: 0.9, r: rand(24, 44) * s, grow: 0.5, life: randi(34, 50) })); }
  for (let i = 0; i < FF.n(22 * s); i++) FX.add('world', new Debris(x + rand(-40, 40), y, 6, { vx: rand(-11, 11), vz: rand(7, 19), s: rand(4, 10), col: ROCK.slice(1), life: 70 }));
  FF.impact(x, gy - 20, '255,200,140', 1.3 * s);
  Sfx.play('quake', 1); Sfx.wlayer('quake', 3, true); Game.addShake(14 * s); Game.zoomPunch(1 + 0.04 * s);
}

Object.assign(WH, {
  gtSlam: WS.hd({ dmg: 13, kx: 6, kz: 9, airKz: 9, stun: 60, stop: 16, shake: 16, fx: 'heavy', power: 2.4 }),
  gtWave: WS.hd({ dmg: 4, kx: 6, kz: 10, airKz: 9, stun: 40, stop: 6, shake: 6, fx: 'blunt' }),
  gtRock: WS.hd({ dmg: 3.6, kx: 2, kz: 13, airKz: 11, stun: 40, stop: 5, shake: 6, fx: 'blunt', power: 1.4 }),
  gtBoulder: WS.hd({ dmg: 22, kx: 8, kz: 14, airKz: 12, stun: 70, stop: 18, shake: 20, fx: 'heavy', power: 2.6 }),
});

forgeDef('w5', {
  name: '거인의 메치기', mp: 150, cd: 9, ico: ['fist', '230,190,120'],
  desc: '땅을 갈아엎으며 돌진해 앞의 적을 붙잡아 머리 위로 들어 올린 뒤 땅에 내리꽂는다. 꽂힌 자리는 분화구가 되고 사방으로 바위 가시가 솟는다. (보스는 강타)',
  act: {
    anim: 'dashAtk', len: 62, cancel: 54, atkCancel: 54,
    start(p) { p.grab = null; Sfx.play('dash', 0.8); p.bladeGlow = 1; },
    update(p, f) {
      if (f < 9) { p.vx = p.facing * 10; if (f % 2 === 0) { FX.add('world', new FP(p.x - p.facing * 20, sy(p.y, 6), { kind: 'smoke', col: '150,125,95', vx: -p.facing * rand(1, 3), vy: -1, r: rand(16, 28), grow: 0.5, life: 26 })); FX.add('world', new Debris(p.x, p.y, 2, { vx: -p.facing * rand(2, 6), vz: rand(3, 7), s: rand(2, 4), col: ROCK.slice(1), life: 30 })); } }
      else p.vx *= 0.7;
      if (f === 8) {
        const c = Game.enemies.filter(e => e.hittable() && (e.x - p.x) * p.facing > -10 && Math.abs(e.x - p.x) < 180 && Math.abs(e.y - p.y) < 50).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
        if (c && !c.isBoss) { p.grab = c; c.interrupt(); Sfx.play('thud', 0.7, 1.3); swingT(p, 'upper', 0.9); FF.impact(c.x, sy(c.y, c.z + c.h * 0.5), '230,190,130', 0.6); }
        else if (c) { applyHit(p, c, WH.gtSlam, { dir: p.facing }); swingT(p, 'a4', 1.4); gtCrater(p, c.x, c.y, 0.9); WS.area(p, c.x, c.y, 220, 90, WH.gtWave, { skip: e => e === c }); p.actDone = true; return; }
      }
      const g = p.grab;
      if (g && f > 8 && f < 30) {
        if (!g.hittable() && !g.dying) { p.grab = null; return; }
        const k = E.out3(Math.min(1, (f - 8) / 14));
        g.hitstop = 2; g.x = p.x + p.facing * lerp(24, 6, k); g.y = p.y; g.z = lerp(20, 200, k); g.vx = g.vz = 0; g.state = 'air'; g.facing = -p.facing;
        if (f % 3 === 0) FX.add('world', new Debris(g.x + rand(-30, 30), g.y, g.z + rand(0, 40), { vx: rand(-2, 2), vz: rand(-1, 2), s: rand(2, 5), col: ROCK.slice(1), life: 40 }));
        if (f === 24) { Sfx.play('charge', 0.6, 0.6); p.bladeGlow = 2; FX.add('ground', new FCircle(p.x + p.facing * 130, p.y, 90, 20, { kind: 'hex', col: '255,170,90', col2: '255,230,190' })); }
      }
      if (g && f >= 30 && f < 35) {                          // 포물선을 그리며 내리꽂힘
        const k = (f - 29) / 5, tx = clamp(p.x + p.facing * 130, Game.room.minX, Game.room.maxX);
        g.hitstop = 2; g.x = lerp(p.x + p.facing * 6, tx, k); g.z = 200 * (1 - k * k) + Math.sin(k * Math.PI) * 50; g.vx = g.vz = 0;
        if (f === 30) { swingT(p, 'a4', 1.5); Sfx.pplay('swingBig'); FX.add('world', new FSlash(p.x + p.facing * 70, sy(p.y, 130), p.facing * 1.1, 110, { col: '230,190,130', core: '255,240,210', th: 16, dark: '50,34,20' })); }
        FX.add('world', new FP(g.x, sy(g.y, g.z + g.h * 0.5), { kind: 'glow', col: '255,180,100', r: 30, life: 10 }));
      }
      if (g && f === 35) {
        g.z = 0; g.hitstop = 0;
        if (g.hittable()) applyHit(p, g, WH.gtSlam, { dir: p.facing, hz: 40 });
        gtCrater(p, g.x, p.y, 1);
        WS.area(p, g.x, p.y, 230, 90, WH.gtWave, { skip: e => e === g });
        p.grab = null;
      }
      if (!g && f === 30 && !p.actDone) { swingT(p, 'a4', 1.4); const x = p.x + p.facing * 100; gtCrater(p, x, p.y, 0.6); WS.area(p, x, p.y, 140, 60, WH.gtWave); }
    },
    end(p) { if (p.grab) { p.grab.hitstop = 0; p.grab = null; } },
  },
}, {
  name: '산맥 붕괴', mp: 480, cd: 42, ico: ['mountain', '230,190,120'],
  desc: '대지를 내리치면 앞쪽으로 바위 산맥이 줄지어 솟아 적을 하늘로 띄운다. 이어 용암빛 균열이 번뜩이는 거암이 하늘에서 떨어져 산맥째 모두 짓뭉갠다.',
  act: {
    anim: 'ebImpact', len: 120, cancel: 110, atkCancel: 110,
    start(p) { forgeCine(p, '산맥 붕괴', '山 脈 崩 壞', '210,170,110', { bars: 120, dim: 0.3 }); p.invul = 190; p.vx = 0; },
    update(p, f) {
      p.vx = 0; p.armorF = true;
      if (f === 3) { Game.addShake(12); gtCrater(p, p.x + p.facing * 30, p.y, 0.7); FF.screen({ col: '60,40,20', a: 0.18, life: 110, fin: 10, fout: 10 }); }
      for (let i = 0; i < 9; i++) if (f === 6 + i * 5) {      // 산맥이 앞으로 뻗어 나간다
        const x = p.x + p.facing * (100 + i * 88), s = 1 + i * 0.06;
        for (const dy of [-55, 0, 55]) FX.add('world', new FRockPillar(x + rand(-16, 16), clamp(p.y + dy, 0, DEPTH), (dy ? rand(110, 160) : rand(170, 240)) * s, { top: chance(0.5) ? 'spike' : 'flat', w: rand(28, 40) * s, life: 70 - i * 3, glow: 0.5 }));
        FX.add('ground', new FDecal(x, p.y, 90, 200, { kind: 'crack', col: '255,150,60' }));
        for (let k = 0; k < FF.n(7); k++) FX.add('world', new Debris(x, p.y, 4, { vx: rand(-4, 4), vz: rand(9, 16), s: rand(3, 8), col: ROCK.slice(1) }));
        WS.area(p, x, p.y, 75, 95, WH.gtRock); Sfx.play('thud', 0.9, 0.8 + i * 0.03); Game.addShake(6);
      }
      if (f === 56) { Sfx.play('roar', 0.6, 0.6); FF.screen({ kind: 'vig', col: '40,20,5', a: 0.6, life: 50, fin: 10, fout: 6 }); }
      if (f === 58) {
        const alive = WS.onScreen(), cx = alive.length ? alive.reduce((s, e) => s + e.x, 0) / alive.length : p.x + p.facing * 330;
        FX.add('world', new FBoulder(p, cx, p.y, {
          r: 130, dur: 32, from: -p.facing * 260, onEnd: m => {
            const gy = sy(m.y, 0);
            gtCrater(p, m.x, m.y, 1.8);
            FX.add('world', new FBeam(m.x, m.y, 120, 20, { col: '255,170,90', core: '255,240,200', h: 500, rays: false }));
            for (let k = 0; k < FF.n(30); k++) FX.add('world', new Debris(m.x + rand(-100, 100), m.y, 30, { vx: rand(-13, 13), vz: rand(8, 20), s: rand(6, 14), col: ROCK.slice(1), life: 80 }));
            for (let k = 0; k < FF.n(30); k++) FX.add('world', new FP(m.x + rand(-60, 60), gy - rand(0, 60), { kind: 'ember', col: '255,150,60', vx: rand(-8, 8), vy: rand(-12, -3), grav: 0.3, r: rand(2, 5), life: randi(30, 50) }));
            Game.addShake(26); Game.flashScreen(0.45, '255,220,170'); Game.slowmo(0.4, 20); Game.zoomPunch(1.1);
            WS.area(p, m.x, m.y, 340, 150, WH.gtBoulder);
          },
        }));
      }
      if (f === 100) forgeUndim(16);
    },
    end() { forgeUndim(8); },
  },
});

// ============================================================
//  질풍검 바람가르기 : 되돌아오는 진공 칼날 · 하늘까지 닿는 회오리
// ============================================================
const WIND = '170,255,210';
class FVacBlade {
  constructor(p, x, y, z, vx, vy, o = {}) { Object.assign(this, { p, x, y, z, vx, vy, t: 0, add: true, hd: o.hd, set: new Set(), back: false, dist: 0, max: o.max || 380, spin: 0, s: o.s || 1, life: 150 }); }
  update() {
    this.t++; const p = this.p;
    if (!this.back) {
      this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.dist += Math.abs(this.vx);
      const k = this.dist / this.max; this.vx *= 0.985; this.vy *= 0.95;
      if (k >= 1) { this.back = true; this.set.clear(); this.sp = 4; FX.add('world', new FRing(this.x, sy(this.y, this.z + 40), 10, 70, 12, { col: WIND, w: 4, ry: 1, fill: 0 })); Sfx.wlayer('wind', 0, false); }
    } else {
      this.sp = Math.min(22, this.sp * 1.12);
      const tx = p.x, ty = p.y, tz = p.z + 70, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
      this.x += dx / d * this.sp; this.y += dy / d * Math.min(this.sp, Math.abs(dy)); this.z = lerp(this.z, tz, 0.15); this.vx = dx / d * this.sp;
      if (d < 30) { FX.add('world', new FP(p.x, sy(p.y, p.z + 70), { kind: 'glow', col: WIND, r: 40, life: 10 })); return false; }
    }
    this.spin += 0.55 * sign(this.vx || 1);
    for (const e of Game.enemies) {
      if (!e.hittable() || this.set.has(e)) continue;
      if (Math.abs(e.x - this.x) > 42 * this.s + e.w || Math.abs(e.y - this.y) > 40 + e.d || e.z > this.z + 100) continue;
      this.set.add(e); applyHit(p, e, this.hd, { noStopAtt: true, dir: sign(this.vx) || 1, hz: this.z + 40 });
      for (let i = 0; i < FF.n(5); i++) FX.add('world', new FP(e.x, sy(e.y, e.z + e.h * 0.5), { kind: 'spark', col: WIND, vx: rand(-6, 6), vy: rand(-6, 6), life: 12, r: 3 }));
    }
    if (this.t % 2 === 0) FX.add('world', new FP(this.x, sy(this.y, this.z + 40) + rand(-20, 20), { kind: chance(0.25) ? 'leaf' : 'glow', col: chance(0.25) ? '120,200,110' : WIND, vx: -this.vx * 0.15 + rand(-1, 1), vy: rand(-1, 1), r: rand(3, 7), life: randi(14, 24) }));
    return this.t < this.life;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z + 40), s = this.s, d = sign(this.vx) || 1;
    ctx.save();
    ctx.strokeStyle = `rgba(${WIND},0.35)`; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();   // 뒤로 끌리는 바람줄
    for (let i = -2; i <= 2; i++) { ctx.moveTo(X - d * 30, Y + i * 9 * s); ctx.lineTo(X - d * (80 + Math.abs(i) * -10 + 30), Y + i * 11 * s); }
    ctx.stroke();
    drawGlow(ctx, X, Y, 70 * s, WIND, 0.4);
    ctx.translate(X, Y); ctx.scale(s, s * 0.55); ctx.rotate(this.spin);
    for (let k = 0; k < 3; k++) {
      ctx.rotate(TAU / 3);
      for (const [w, col, al] of [[1.25, WIND, 0.35], [1, WIND, 0.8], [0.8, '255,255,255', 0.95]]) {
        ctx.fillStyle = `rgba(${col},${al})`; ctx.beginPath();
        ctx.arc(0, 0, 44 * w, -0.2, 1.9); ctx.quadraticCurveTo(Math.cos(1) * 20, Math.sin(1) * 20, Math.cos(-0.2) * 44 * w, Math.sin(-0.2) * 44 * w); ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

class FGale {
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, life: 250, add: true, hit: new Map(), caught: new Set(), H: 420 }); }
  update() {
    this.t++; this.x += this.dir * 3.2;
    const r = Game.room; this.x = clamp(this.x, r.minX + 40, r.maxX - 40);
    const p = this.p, T = this.t, gy = sy(this.y, 0);
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 180 || Math.abs(e.y - this.y) > 100) continue;
      this.caught.add(e);
      if (!e.isBoss) {
        const ph = T * 0.22 + e.id * 1.7;
        e.x = lerp(e.x, this.x + Math.sin(ph) * 60, 0.22); e.y = lerp(e.y, this.y, 0.1);
        e.z = lerp(e.z, 110 + Math.sin(ph * 0.5 + e.id) * 70, 0.15); e.vz = 0; e.hitstop = Math.max(e.hitstop, 2);
        if (e.state !== 'dying') e.state = 'air';
      }
      if (T - (this.hit.get(e) || -99) >= 9) {
        this.hit.set(e, T); applyHit(p, e, WH.gaCut, { noStopAtt: true, dir: sign(e.x - this.x) || 1 });
        FX.add('world', new FSlash(e.x, sy(e.y, e.z + e.h * 0.5), rand(-0.6, 0.6), 50, { col: WIND, core: '255,255,255', th: 6, life: 10, sparks: false }));
      }
    }
    if (T % 2 === 0) {                                          // 휘말리는 잎 · 흙먼지
      for (let i = 0; i < FF.n(2); i++) { const h = rand(10, this.H), R = 30 + h * 0.36, a = rand(0, TAU); FX.add('world', new FP(this.x + Math.cos(a) * R, gy - h + Math.sin(a) * R * 0.2, { kind: chance(0.6) ? 'leaf' : 'bit', col: chance(0.6) ? '120,200,110' : '170,150,120', vx: -Math.sin(a) * 6, vy: -rand(1, 3), drag: 0.9, r: rand(3, 6), life: randi(14, 24) })); }
      FX.add('world', new FP(this.x + rand(-60, 60), gy, { kind: 'smoke', col: '190,180,150', vx: rand(-4, 4), vy: -rand(0.5, 1.5), r: rand(20, 36), grow: 0.6, life: 30 }));
    }
    if (T % 30 === 0) Sfx.wlayer('wind', 1, false);
    if (T >= this.life) {
      FX.add('world', new FBeam(this.x, this.y, 110, 26, { col: WIND, core: '255,255,255', h: 760 }));
      FX.add('ground', new FRing(this.x, gy, 30, 320, 24, { col: WIND, w: 14 }));
      for (let i = 0; i < 4; i++) FX.add('world', new FSlash(this.x + rand(-40, 40), gy - 120 - i * 70, rand(-0.5, 0.5), 140, { col: WIND, core: '255,255,255', th: 12, delay: i * 2 }));
      for (let i = 0; i < FF.n(30); i++) FX.add('world', new FP(this.x + rand(-60, 60), gy - rand(0, 300), { kind: chance(0.5) ? 'leaf' : 'glow', col: chance(0.5) ? '120,200,110' : WIND, vx: rand(-9, 9), vy: rand(-14, -4), drag: 0.93, r: rand(3, 7), life: randi(30, 50) }));
      Sfx.wlayer('wind', 3, true); Sfx.play('explode', 0.6, 1.2); Game.addShake(14); Game.flashScreen(0.3, '220,255,240'); Game.zoomPunch(1.05);
      for (const e of this.caught) if (e.hittable()) { e.hitstop = 0; applyHit(p, e, WH.gaEnd, { noStopAtt: true, dir: sign(e.x - this.x) || 1 }); }
      return false;
    }
    return true;
  }
  draw(ctx) {
    const T = this.t, a = Math.min(1, T / 14, (this.life - T) / 10), grow = E.out3(Math.min(1, T / 24)), H = this.H * grow, gx = this.x, gy = sy(this.y, 0);
    const R = h => 26 + h * 0.36;
    drawGlow(ctx, gx, gy, 200, WIND, 0.3 * a, 1, 0.3);
    const g = ctx.createLinearGradient(0, gy, 0, gy - H);         // 바람 기둥 몸통
    g.addColorStop(0, `rgba(${WIND},${0.32 * a})`); g.addColorStop(0.5, `rgba(${WIND},${0.16 * a})`); g.addColorStop(1, `rgba(${WIND},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(gx - 26, gy); ctx.quadraticCurveTo(gx - R(H * 0.5) * 0.8, gy - H * 0.5, gx - R(H), gy - H); ctx.lineTo(gx + R(H), gy - H); ctx.quadraticCurveTo(gx + R(H * 0.5) * 0.8, gy - H * 0.5, gx + 26, gy); ctx.fill();
    for (let s = 0; s < 5; s++) {                                // 감아 오르는 띠 (앞쪽이 밝다)
      const C = [];
      for (let k = 0; k <= 30; k++) { const h = k / 30 * H, ang = -T * 0.38 + s * TAU / 5 + h * 0.022, r = R(h); C.push([gx + Math.cos(ang) * r + Math.sin(T * 0.05 + h * 0.01) * h * 0.06, gy - h + Math.sin(ang) * r * 0.22, Math.max(0.1, Math.sin(ang)), 1 - k / 30 * 0.6]); }
      for (let i = 1; i < C.length; i++) {
        const [x0, y0] = C[i - 1], [x1, y1, fr, th] = C[i];
        ctx.strokeStyle = `rgba(${fr > 0.5 ? '235,255,245' : WIND},${(0.15 + fr * 0.6) * a})`; ctx.lineWidth = (4 + fr * 10) * th;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * a})`; ctx.lineWidth = 1.5;   // 가는 바람줄
    for (let i = 0; i < 10; i++) { const h = ((T * 6 + i * 47) % H), r = R(h), ang = -T * 0.5 + i; ctx.beginPath(); ctx.ellipse(gx, gy - h, r, r * 0.22, 0, ang, ang + 1.4); ctx.stroke(); }
    ctx.fillStyle = `rgba(220,240,235,${0.25 * a})`;            // 꼭대기 구름 소용돌이
    ctx.beginPath(); ctx.ellipse(gx, gy - H, R(H) * 1.3, R(H) * 0.3, 0, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
  }
}

Object.assign(WH, {
  vacCut: WS.hd({ dmg: 1.9, kx: 2, airKz: 3, stun: 22, stop: 2, shake: 1.5, fx: 'slash' }),
  gaCut: WS.hd({ dmg: 1.7, kx: 0, airKz: 0, stun: 30, stop: 2, shake: 1.5, fx: 'slash', power2: 0 }),
  gaEnd: WS.hd({ dmg: 12, kx: 6, kz: 16, airKz: 15, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2.2 }),
});

forgeDef('w6', {
  name: '진공 부메랑', mp: 120, cd: 7, ico: ['boomerang', '180,255,215'],
  desc: '세 갈래로 휘도는 진공 칼날 3개를 던진다. 칼날은 적을 관통하며 날아갔다가 손으로 되돌아오며 한 번 더 벤다.',
  act: {
    anim: 'a2', len: 26, cancel: 14, atkCancel: 12,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 3) FX.add('world', new FP(p.x + p.facing * 30, sy(p.y, p.z + 80), { kind: 'glow', col: WIND, r: 50, life: 8 }));
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('wind', 2, false);
        FX.add('world', new FSlash(p.x + p.facing * 60, sy(p.y, p.z + 80), p.facing * -0.3, 80, { col: WIND, core: '255,255,255', th: 10, bend: 0.25 }));
        [-2.2, 0, 2.2].forEach((vy, i) => FX.add('world', new FVacBlade(p, p.x + p.facing * 40, p.y, p.z + 30 + i * 6, p.facing * (16 - Math.abs(vy)), vy, { hd: WH.vacCut, max: 380 - Math.abs(vy) * 20, s: i === 1 ? 1.1 : 0.85 })));
      }
    },
  },
}, {
  name: '천풍참', mp: 480, cd: 42, ico: ['tornado', '180,255,215'],
  desc: '하늘까지 닿는 회오리를 일으킨다. 회오리는 천천히 전진하며 적을 빨아올려 공중에 가둔 채 계속 베다가, 마지막에 하늘로 터져 오르며 모두 날려버린다.',
  act: {
    anim: 'upper', len: 46, cancel: 36, atkCancel: 30,
    start(p) { forgeCine(p, '천풍참', '天 風 斬', '160,255,200', { bars: 70, dim: 0.25 }); p.invul = 120; p.vx = 0; },
    update(p, f) {
      if (f === 4) { Sfx.play('charge', 0.6, 1.3); for (let i = 0; i < FF.n(14); i++) { const a = rand(0, TAU), d = rand(80, 160); FX.add('world', new FP(p.x + Math.cos(a) * d, sy(p.y, 70) + Math.sin(a) * d * 0.5, { kind: 'leaf', col: '120,200,110', tx: p.x, ty: sy(p.y, 90), pull: 0.05, r: 5, life: 18 })); } }
      if (f === 8) { Sfx.pplay('swingBig'); p.bladeGlow = 2; FX.add('world', new FSlash(p.x + p.facing * 70, sy(p.y, 140), -Math.PI / 2 + p.facing * 0.3, 150, { col: WIND, core: '255,255,255', th: 16 })); }
      if (f === 12) {
        FX.add('world', new FGale(p, p.x + p.facing * 140, p.y, p.facing));
        FX.add('ground', new FRing(p.x + p.facing * 140, sy(p.y, 0), 20, 260, 22, { col: WIND, w: 12 }));
        FF.screen({ kind: 'lines', col: '230,255,245', a: 0.18, life: 40, fin: 4, fout: 20 });
        Sfx.wlayer('wind', 3, true); Game.addShake(8); forgeUndim(30);
      }
    },
  },
});

// ============================================================
//  맹독검 베놈 팽 : 기어가는 독사 · 끓어오르는 역병의 늪 · 늪에서 솟는 거대 독사
// ============================================================
const VEN = '140,235,80';
class FSnake {
  constructor(p, x, y, vx, vy, o = {}) {
    Object.assign(this, { p, t: 0, add: false, hx: x, hy: y, ang: Math.atan2(vy * 2.4, vx), sp: Math.hypot(vx, vy), bites: 0, maxB: o.bites || 2, life: 190, lunge: 0, tgt: null, done: 0, hit: new Set(), s: o.s || 1 });
    this.seg = []; for (let i = 0; i < 16; i++) this.seg.push([x - Math.cos(this.ang) * i * 6, y]);
  }
  update() {
    this.t++; const p = this.p;
    if (this.done) { this.done++; return this.done < 18; }
    if (!this.tgt || !this.tgt.hittable() || this.hit.has(this.tgt)) {
      this.tgt = null; let bd = 520;
      for (const e of Game.enemies) { if (!e.hittable() || this.hit.has(e)) continue; const d = Math.hypot(e.x - this.hx, (e.y - this.hy) * 2); if (d < bd) { bd = d; this.tgt = e; } }
    }
    const e = this.tgt;
    if (e) {
      const want = Math.atan2((e.y - this.hy) * 2.4, e.x - this.hx); let da = want - this.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      this.ang += clamp(da, -0.11, 0.11);
      if (!this.lunge && Math.abs(e.x - this.hx) < 60 + e.w && Math.abs(e.y - this.hy) < 30 + e.d) { this.lunge = 1; Sfx.play('dash', 0.3, 1.8); }
    }
    if (this.lunge) {                                          // 몸을 세웠다가 덥석
      this.lunge++;
      if (this.lunge === 9 && e && e.hittable()) {
        this.hit.add(e); this.bites++;
        applyHit(p, e, WH.vnBite, { noStopAtt: true, dir: Math.cos(this.ang) >= 0 ? 1 : -1 });
        Status.add(e, 'poison', { t: 300, d: p.atk * 0.1, n: 5, max: 5 });
        const X = e.x, Y = sy(e.y, e.z + e.h * 0.4);
        FX.add('world', new FRing(X, Y, 6, 60, 12, { col: VEN, w: 5, ry: 1, fill: 0 }));
        for (let i = 0; i < FF.n(8); i++) FX.add('world', new FP(X, Y, { kind: chance(0.5) ? 'drip' : 'bubble', col: VEN, vx: rand(-4, 4), vy: rand(-5, 1), grav: 0.25, r: rand(3, 6), life: randi(18, 30) }));
        Sfx.wlayer('poison', 1, false);
      }
      if (this.lunge > 16) { this.lunge = 0; if (this.bites >= this.maxB) this.done = 1; }
    }
    const sp = this.lunge ? (this.lunge < 6 ? 1 : this.lunge < 10 ? this.sp * 1.8 : 1) : this.sp, wig = this.lunge ? 0 : Math.sin(this.t * 0.35) * 0.5;
    this.hx += Math.cos(this.ang + wig) * sp; this.hy = clamp(this.hy + Math.sin(this.ang + wig) * sp / 2.4, 0, DEPTH);
    this.seg[0] = [this.hx, this.hy];
    for (let i = 1; i < this.seg.length; i++) { const a = this.seg[i - 1], b = this.seg[i], dx = b[0] - a[0], dy = (b[1] - a[1]) * 2.4, d = Math.hypot(dx, dy) || 1; this.seg[i] = [a[0] + dx / d * 6 * this.s, a[1] + dy / d * 6 * this.s / 2.4]; }
    if (this.t % 6 === 0) FX.add('ground', new FDecal(this.seg[8][0], this.seg[8][1], 10, 60, { kind: 'pool', col: '70,140,30' }));
    if (this.t >= this.life) this.done = 1;
    return true;
  }
  draw(ctx) {
    const a = this.done ? 1 - this.done / 18 : Math.min(1, this.t / 6), s = this.s, L = this.lunge, rise = L ? (L < 7 ? L / 7 : L < 12 ? 1 : 1 - (L - 12) / 5) : 0;
    const P = this.seg.map(([x, y], i) => [x, sy(y, 4 + (i < 5 ? rise * 30 * (1 - i / 5) : 0))]);
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < P.length; i += 2) { ctx.beginPath(); ctx.ellipse(this.seg[i][0], sy(this.seg[i][1], 0), 6 * s, 2.5 * s, 0, 0, TAU); ctx.fill(); }
    for (let i = P.length - 1; i > 0; i--) {                    // 꼬리부터 머리까지 비늘 마디
      const w = (4 + 7 * Math.sin(Math.min(1, (P.length - i) / P.length * 1.4) * Math.PI / 2)) * s;
      ctx.strokeStyle = '#14320a'; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i - 1][0], P[i - 1][1]); ctx.stroke();
      ctx.strokeStyle = i % 3 === 0 ? '#2c6a14' : '#4f9e22'; ctx.lineWidth = w; ctx.stroke();
      if (i % 2 === 0) { ctx.fillStyle = '#c4f070'; ctx.beginPath(); ctx.arc(P[i][0], P[i][1] - w * 0.15, w * 0.22, 0, TAU); ctx.fill(); }
    }
    const [hx, hy] = P[0], ang = Math.atan2(P[0][1] - P[2][1], P[0][0] - P[2][0]), open = L > 6 && L < 12 ? 0.7 : 0.08;
    ctx.translate(hx, hy); ctx.rotate(ang); ctx.scale(s, s);
    for (const k of [-1, 1]) {                                   // 위·아래 턱
      ctx.save(); ctx.rotate(k * open * 0.5);
      ctx.fillStyle = '#14320a'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(2, k * 10, 16, k * 2); ctx.lineTo(16, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = k < 0 ? '#5aae28' : '#3c7c1a'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(2, k * 8, 14, k * 1.5); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
      if (open > 0.3) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(10, k * 1.5); ctx.lineTo(11.5, -k * 4); ctx.lineTo(13, k * 1.5); ctx.fill(); }
      ctx.restore();
    }
    ctx.fillStyle = '#ffe040'; ctx.beginPath(); ctx.ellipse(3, -4, 2.6, 1.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(2.6, -5.5, 0.9, 3);
    ctx.restore();
  }
}

// ---------- 역병의 늪 : 출렁이는 늪 표면 · 차오르는 거품 · 독안개 ----------
class FSwamp {
  constructor(p, x, y, o) { Object.assign(this, { p, x, y, t: 0, add: false, rx: o.rx, ry: o.ry, life: o.life, every: o.every, onTick: o.onTick, bub: [], seed: randi(1, 9999) }); }
  update() {
    this.t++;
    if (this.t % this.every === 0 && this.onTick) this.onTick(this);
    if (this.t % 3 === 0 && this.t < this.life - 20) this.bub.push({ x: rand(-0.85, 0.85), y: rand(-0.75, 0.75), t: 0, L: randi(20, 40), r: rand(5, 13) });
    for (const b of this.bub) if (++b.t === b.L) FX.add('world', new FRing(this.x + b.x * this.rx, sy(this.y + b.y * this.ry * 0.5, 0), b.r * 0.5, b.r * 2.2, 10, { col: VEN, w: 2, fill: 0 }));
    this.bub = this.bub.filter(b => b.t < b.L);
    if (this.t % 4 === 0) FX.add('world', new FP(this.x + rand(-this.rx, this.rx) * 0.8, sy(this.y + rand(-1, 1) * this.ry * 0.4, 0), { kind: 'smoke', col: '110,190,60', vx: rand(-0.5, 0.5), vy: -rand(0.4, 1), r: rand(30, 50), grow: 0.4, life: 60 }));
    return this.t < this.life;
  }
  edge(ctx, k) {
    const gy = sy(this.y, 0), R = mulberry(this.seed); ctx.beginPath();
    for (let i = 0; i <= 28; i++) { const g = i / 28 * TAU, w = 1 + (R() - 0.5) * 0.16 + Math.sin(this.t * 0.06 + i * 1.3) * 0.03; const x = this.x + Math.cos(g) * this.rx * w * k, y = gy + Math.sin(g) * this.ry * 0.5 * w * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath();
  }
  draw(ctx) {
    const u = this.t / this.life, k = E.out3(Math.min(1, this.t / 20)) * (u > 0.92 ? 1 - (u - 0.92) / 0.08 : 1), gy = sy(this.y, 0);
    if (k <= 0.01) return;
    ctx.save();
    const g = ctx.createRadialGradient(this.x, gy, 10, this.x, gy, this.rx * k);
    g.addColorStop(0, 'rgba(40,80,16,0.92)'); g.addColorStop(0.7, 'rgba(28,62,12,0.88)'); g.addColorStop(1, 'rgba(70,140,30,0.75)');
    ctx.fillStyle = g; this.edge(ctx, k); ctx.fill();
    ctx.strokeStyle = 'rgba(150,240,90,0.65)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';                    // 수면 일렁임
    ctx.strokeStyle = 'rgba(150,240,90,0.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const yy = gy + (i - 2.5) * this.ry * 0.16, ph = this.t * 0.05 + i; ctx.beginPath(); for (let x = -1; x <= 1; x += 0.1) ctx.lineTo(this.x + x * this.rx, yy + Math.sin(ph + x * 6) * 3); ctx.stroke(); }
    drawGlow(ctx, this.x, gy, this.rx * 0.8 * k, '120,230,60', 0.25, 1, 0.35);
    ctx.globalCompositeOperation = 'source-over';
    for (const b of this.bub) {                                   // 부풀어 오르는 거품
      const q = b.t / b.L, r = b.r * E.out3(q), X = this.x + b.x * this.rx * k, Y = sy(this.y + b.y * this.ry * 0.5 * k, 0) - r * 0.6;
      ctx.fillStyle = 'rgba(110,200,50,0.7)'; ctx.beginPath(); ctx.arc(X, Y, r, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(230,255,190,0.8)'; ctx.beginPath(); ctx.arc(X - r * 0.35, Y - r * 0.4, r * 0.22, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- 늪에서 솟아 내리꽂는 거대 독사 ----------
class FHydra {
  constructor(p, x, y, tx, o = {}) { Object.assign(this, { p, x, y, tx, t: 0, add: false, life: 62, s: o.s || 1, fired: false, dir: sign(tx - x) || 1 }); }
  update() {
    this.t++;
    if (this.t === 1) { for (let i = 0; i < FF.n(14); i++) FX.add('world', new FP(this.x, sy(this.y, 0), { kind: 'drip', col: VEN, vx: rand(-6, 6), vy: rand(-12, -5), grav: 0.45, r: rand(3, 6), life: 40 })); Sfx.play('roar', 0.7, 1.4); }
    if (this.t === 38 && !this.fired) {
      this.fired = true; const p = this.p, X = this.tx;
      FX.add('ground', new FRing(X, sy(this.y, 0), 20, 230, 22, { col: VEN, w: 14 }));
      FX.add('ground', new FDecal(X, this.y, 140, 240, { kind: 'pool', col: '60,130,20' }));
      for (let i = 0; i < FF.n(24); i++) FX.add('world', new FP(X + rand(-40, 40), sy(this.y, 10), { kind: chance(0.5) ? 'drip' : 'bubble', col: VEN, vx: rand(-9, 9), vy: rand(-14, -4), grav: 0.45, r: rand(3, 7), life: randi(30, 46) }));
      FF.impact(X, sy(this.y, 40), VEN, 1.4); Sfx.wlayer('poison', 3, true); Sfx.play('explode', 0.7, 0.8); Game.addShake(16); Game.zoomPunch(1.05);
      WS.area(p, X, this.y, 200, 90, WH.vnStrike, { each: e => Status.add(e, 'poison', { t: 300, d: p.atk * 0.1, n: 5, max: 5 }) });
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const T = this.t, s = this.s, gy = sy(this.y, 0), d = this.dir;
    // 머리 위치 : 솟음 → 뒤로 젖힘 → 내리꽂음 → 가라앉음
    let hx, hy, open = 0.1;
    if (T < 20) { const k = E.out3(T / 20); hx = this.x + d * 20 * k; hy = gy - 300 * k * s; }
    else if (T < 34) { const k = (T - 20) / 14; hx = this.x - d * 50 * k; hy = gy - (300 + 40 * k) * s; open = 0.1 + k * 0.8; }
    else if (T < 40) { const k = E.out3((T - 34) / 6); hx = lerp(this.x - d * 50, this.tx, k); hy = lerp(gy - 340 * s, gy - 30, k); open = 0.9 - k * 0.6; }
    else { const k = (T - 40) / 22; hx = lerp(this.tx, this.x, k); hy = gy - 30 + k * 60; }
    const a = T > 50 ? 1 - (T - 50) / 12 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    const bx = this.x, by = gy, cx = (bx + hx) / 2 - d * 90 * s, cy = Math.min(by, hy) - 40;   // 목 곡선
    const N = 22, pts = []; for (let i = 0; i <= N; i++) { const t = i / N, v = 1 - t; pts.push([v * v * bx + 2 * v * t * cx + t * t * hx, v * v * by + 2 * v * t * cy + t * t * hy]); }
    for (let i = 1; i <= N; i++) {
      const w = (44 - i * 0.8) * s;
      ctx.strokeStyle = '#14320a'; ctx.lineWidth = w + 6; ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      ctx.strokeStyle = i % 2 ? '#3d8a1a' : '#4fa024'; ctx.lineWidth = w; ctx.stroke();
      ctx.strokeStyle = '#b8e870'; ctx.lineWidth = w * 0.3; ctx.beginPath(); ctx.moveTo(pts[i - 1][0] + d * w * 0.25, pts[i - 1][1]); ctx.lineTo(pts[i][0] + d * w * 0.25, pts[i][1]); ctx.stroke();
    }
    const ang = Math.atan2(hy - pts[N - 2][1], hx - pts[N - 2][0]);
    ctx.translate(hx, hy); ctx.rotate(ang); ctx.scale(s * 3.4, s * 3.4);
    for (const k of [-1, 1]) {
      ctx.save(); ctx.rotate(k * open * 0.5);
      ctx.fillStyle = '#14320a'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(2, k * 12, 20, k * 2); ctx.lineTo(20, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = k < 0 ? '#5aae28' : '#3c7c1a'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(2, k * 10, 18, k * 1.5); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill();
      if (open > 0.3) { ctx.fillStyle = '#7a1020'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(6, k * 5, 16, k * 1); ctx.lineTo(16, 0); ctx.fill(); ctx.fillStyle = '#fff'; for (const fx of [12, 15.5]) { ctx.beginPath(); ctx.moveTo(fx - 1, k * 1.5); ctx.lineTo(fx, -k * 4.5); ctx.lineTo(fx + 1, k * 1.5); ctx.fill(); } }
      ctx.restore();
    }
    ctx.fillStyle = '#ffe040'; ctx.beginPath(); ctx.ellipse(3, -5, 3, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#000'; ctx.fillRect(2.5, -6.8, 1, 3.6);
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 3, -5, 8, '255,240,90', 0.6);
    ctx.restore();
  }
}

Object.assign(WH, {
  vnBite: WS.hd({ dmg: 3, kx: 2, airKz: 3, stun: 30, stop: 4, shake: 2, fx: 'pierce' }),
  vnTick: WS.hd({ dmg: 0.8, kx: 0, airKz: 0.5, stun: 8, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  vnBubble: WS.hd({ dmg: 2.4, kx: 1, kz: 7, airKz: 6, stun: 30, stop: 3, shake: 3, fx: 'blunt' }),
  vnStrike: WS.hd({ dmg: 8, kx: 6, kz: 9, airKz: 9, stun: 50, stop: 10, shake: 10, fx: 'heavy', power: 1.8 }),
});

forgeDef('w7', {
  name: '독사 소환', mp: 130, cd: 8, ico: ['snake', '140,235,80'],
  desc: '칼끝의 독으로 독사 세 마리를 빚어낸다. 뱀은 땅을 기어 적을 쫓아가 몸을 세워 물고, 독을 최대치까지 중첩시킨 뒤 다음 먹잇감을 노린다. (뱀마다 2번)',
  act: {
    anim: 'a3', len: 30, cancel: 18, atkCancel: 16,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 2) for (let i = 0; i < FF.n(8); i++) FX.add('world', new FP(p.x + p.facing * rand(20, 80), sy(p.y, p.z + rand(40, 110)), { kind: 'drip', col: VEN, vx: 0, vy: 1, grav: 0.3, r: rand(3, 5), life: 20 }));
      if (f === 7) {
        Sfx.wlayer('poison', 2, false);
        const X = p.x + p.facing * 50;
        FX.add('ground', new FDecal(X, p.y, 70, 120, { kind: 'pool', col: '60,130,20' }));
        FX.add('ground', new FRing(X, sy(p.y, 0), 10, 90, 16, { col: VEN, w: 6 }));
        for (let i = 0; i < 3; i++) FX.add('world', new FSnake(p, X, clamp(p.y + (i - 1) * 24, 0, DEPTH), p.facing * 7, (i - 1) * 1.4, { s: i === 1 ? 1.15 : 1 }));
      }
    },
  },
}, {
  name: '역병의 늪', mp: 480, cd: 42, ico: ['swamp', '140,235,80'],
  desc: '발밑에 거대한 독늪을 7초간 펼친다. 늪 안의 적은 크게 느려지고 독에 잠기며 독거품이 수시로 터진다. 늪이 열리는 순간 거대한 독사가 솟아올라 적의 무리를 내리문다.',
  act: {
    anim: 'ebImpact', len: 56, cancel: 40, atkCancel: 34,
    start(p) { forgeCine(p, '역병의 늪', '疫 病 沼', '120,230,70', { bars: 60, dim: 0.3 }); p.invul = 120; p.vx = 0; },
    update(p, f) {
      if (f === 10) {
        Sfx.wlayer('poison', 3, true); Sfx.play('quake', 0.6); Game.addShake(8);
        FF.screen({ col: '40,90,10', a: 0.14, life: 420, fin: 20, fout: 30 });
        FX.add('ground', new FSwamp(p, p.x, p.y, {
          rx: 360, ry: 130, life: 420, every: 18,
          onTick: z => {
            WS.area(p, z.x, z.y, z.rx, z.ry, WH.vnTick, { hmax: 90, each: e => { Status.add(e, 'poison', { t: 120, d: p.atk * 0.08, n: 1 }); Status.add(e, 'slow', { t: 30, m: 0.35 }); } });
            const bx = z.x + rand(-z.rx * 0.8, z.rx * 0.8), by = clamp(z.y + rand(-z.ry * 0.7, z.ry * 0.7), 0, DEPTH), Y = sy(by, 0);
            FX.add('world', new FRing(bx, Y - 20, 10, 80, 14, { col: VEN, w: 5, ry: 0.8 }));
            FX.add('world', new FP(bx, Y - 20, { kind: 'glow', col: VEN, r: 60, life: 12 }));
            for (let k = 0; k < FF.n(8); k++) FX.add('world', new FP(bx, Y - 10, { kind: chance(0.5) ? 'drip' : 'bubble', col: VEN, vx: rand(-4, 4), vy: rand(-9, -3), grav: 0.4, r: rand(3, 6), life: randi(20, 34) }));
            WS.area(p, bx, by, 70, 34, WH.vnBubble);
          },
        }));
        const L = WS.onScreen(), tx = L.length ? L.reduce((s, e) => s + e.x, 0) / L.length : p.x + p.facing * 240;
        FX.add('world', new FHydra(p, p.x - p.facing * 120, p.y, clamp(tx, p.x - 420, p.x + 420)));
      }
      if (f === 50) forgeUndim(20);
    },
    end() { forgeUndim(10); },
  },
});

// ============================================================
//  성검 루미나스 : 육각 성광 방패 · 하늘에서 내리꽂히는 심판의 대검
// ============================================================
const HOLY = '255,236,160';
class FHolyShield {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() { this.t++; return this.p.guardT > 0 || this.t < 3; }
  draw(ctx) {
    const p = this.p, X = p.x + p.facing * 34, Y = sy(p.y, p.z + 72), T = this.t, k = E.out3(Math.min(1, T / 8)), pu = 0.75 + Math.sin(T * 0.4) * 0.25;
    ctx.save(); ctx.translate(X, Y); ctx.scale(k * 0.55 * p.facing, k);
    drawGlow(ctx, 0, 0, 130, HOLY, 0.4 * pu);
    const hex = (r, rot = 0) => { ctx.beginPath(); for (let i = 0; i <= 6; i++) { const g = i / 6 * TAU + rot; i ? ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r) : ctx.moveTo(Math.cos(g) * r, Math.sin(g) * r); } };
    ctx.fillStyle = `rgba(${HOLY},${0.14 * pu})`; hex(104); ctx.fill();
    ctx.strokeStyle = `rgba(${HOLY},0.9)`; ctx.lineWidth = 5; hex(104); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); hex(100); ctx.clip();                            // 벌집 무늬
    ctx.strokeStyle = `rgba(${HOLY},${0.35 * pu})`; ctx.lineWidth = 1.2;
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) { const cx = i * 30 + (j % 2) * 15, cy = j * 26; ctx.save(); ctx.translate(cx, cy); hex(15, Math.PI / 6); ctx.stroke(); ctx.restore(); }
    const sw = ((T * 6) % 260) - 130; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-130, sw - 8, 260, 16);  // 훑고 지나가는 빛
    ctx.restore();
    ctx.rotate(T * 0.03); ctx.strokeStyle = `rgba(${HOLY},0.8)`; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(116, -6); ctx.lineTo(124, 0); ctx.lineTo(116, 6); ctx.stroke(); }
    ctx.restore();
  }
}

class FJudgeSword {
  constructor(p, x, y, o = {}) { Object.assign(this, { p, x, y, t: 0, add: false, dur: o.dur || 34, stay: 64, onImpact: o.onImpact, hit: false }); }
  update() {
    this.t++;
    if (this.t === this.dur && this.onImpact) { this.hit = true; this.onImpact(this); }
    if (this.t > this.dur && this.t % 3 === 0) FX.add('world', new FP(this.x + rand(-40, 40), sy(this.y, rand(0, 300)), { kind: 'feather', col: '255,250,230', vx: rand(-1.5, 1.5), vy: rand(-1, 0.6), grav: 0.03, r: rand(4, 7), life: 50 }));
    return this.t < this.dur + this.stay;
  }
  draw(ctx) {
    const T = this.t, gy = sy(this.y, 0), fall = Math.pow(Math.min(1, T / this.dur), 2.6), out = T > this.dur + this.stay - 14 ? (T - (this.dur + this.stay - 14)) / 14 : 0;
    const tipY = lerp(gy - 900, gy + 26, fall) - out * 60, BL = 420, X = this.x;
    ctx.save(); ctx.globalAlpha = 1 - out;
    // 하늘의 열린 틈과 빛
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, `rgba(${HOLY},0.4)`); g.addColorStop(1, `rgba(${HOLY},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X - 60, 0); ctx.lineTo(X + 60, 0); ctx.lineTo(X + 160, gy); ctx.lineTo(X - 160, gy); ctx.fill();
    if (T < this.dur) { ctx.fillStyle = `rgba(${HOLY},${0.15 + fall * 0.4})`; ctx.beginPath(); ctx.ellipse(X, gy, 40 + fall * 140, 12 + fall * 40, 0, 0, TAU); ctx.fill(); }   // 떨어질 자리 표시
    drawGlow(ctx, X, tipY - BL * 0.5, 260, HOLY, 0.35);
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(X, tipY);
    // 칼날
    const bw = 40;
    const bg = ctx.createLinearGradient(-bw, 0, bw, 0); bg.addColorStop(0, '#c9d6e8'); bg.addColorStop(0.48, '#ffffff'); bg.addColorStop(0.52, '#a9b8cc'); bg.addColorStop(1, '#e8eef8');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-bw, -70); ctx.lineTo(-bw * 0.85, -BL); ctx.lineTo(bw * 0.85, -BL); ctx.lineTo(bw, -70); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6e7f98'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.moveTo(-5, -90); ctx.lineTo(0, -80); ctx.lineTo(5, -90); ctx.lineTo(5, -BL + 20); ctx.lineTo(-5, -BL + 20); ctx.fill();   // 금빛 홈
    ctx.fillStyle = '#fff4c0'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, -140 - i * 64, 6, 0, TAU); ctx.fill(); }
    // 날개 달린 코등이
    ctx.translate(0, -BL);
    for (const k of [-1, 1]) {
      ctx.fillStyle = '#f2d470'; ctx.strokeStyle = '#8a6418'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(k * 70, -10, k * 150, -64); ctx.quadraticCurveTo(k * 120, -20, k * 128, 0); ctx.quadraticCurveTo(k * 100, 6, k * 108, 18); ctx.quadraticCurveTo(k * 60, 10, 0, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(138,100,24,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 1; i < 5; i++) { ctx.moveTo(k * i * 24, 4); ctx.lineTo(k * (i * 24 + 22), -10 - i * 10); } ctx.stroke();
    }
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(-11, -96, 22, 96);   // 손잡이
    ctx.strokeStyle = '#f2d470'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.moveTo(-11, -8 - i * 15); ctx.lineTo(11, -16 - i * 15); } ctx.stroke();
    ctx.fillStyle = '#f2d470'; ctx.beginPath(); ctx.arc(0, -108, 18, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7ad8ff'; ctx.beginPath(); ctx.arc(0, -108, 9, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -108, 40, '140,220,255', 0.8); drawGlow(ctx, 0, 6, 60, HOLY, 0.7);
    ctx.restore();
  }
}

Object.assign(WH, {
  hlWave: WS.hd({ dmg: 4, kx: 6, kz: 4, airKz: 5, stun: 30, stop: 5, shake: 4, fx: 'blunt' }),
  hlJudge: WS.hd({ dmg: 32, kx: 8, kz: 14, airKz: 12, stun: 70, stop: 18, shake: 20, fx: 'heavy', power: 2.8 }),
});

// 성스러운 반격 : 방패로 받아내는 순간의 연출 (판정은 entity.js · WH.holyCounter 그대로)
Player.prototype.onGuard = function (att) {
  this.guardT = 0; this.invul = Math.max(this.invul, 30);
  const X = this.x, gy = sy(this.y, 0), Y = sy(this.y, this.z + 72);
  FX.add('top', new Label(X, sy(this.y, this.z) - 170, 'GUARD!', { col: ['#ffffff', '#ffd24a'], size: 30 }));
  FX.add('ground', new FCircle(X, this.y, 200, 50, { kind: 'sun', col: HOLY, col2: '255,255,255', grow: 4, spin: 0.05 }));
  FX.add('ground', new FRing(X, gy, 20, 280, 22, { col: HOLY, w: 16 }));
  FX.add('world', new FSlash(X, Y, 0, 200, { col: HOLY, core: '255,255,255', th: 10, bend: 0 }));
  FX.add('world', new FSlash(X, Y, Math.PI / 2, 140, { col: HOLY, core: '255,255,255', th: 10, bend: 0 }));
  FX.add('world', new FBeam(X, this.y, 70, 22, { col: HOLY, h: 600 }));
  for (let i = 0; i < FF.n(16); i++) { const a = rand(0, TAU); FX.add('world', new FP(X, Y, { kind: 'feather', col: '255,250,230', vx: Math.cos(a) * rand(3, 8), vy: Math.sin(a) * rand(3, 8), drag: 0.9, grav: 0.04, r: rand(4, 7), life: randi(34, 50) })); }
  FF.impact(X, Y, HOLY, 1.2);
  Sfx.play('counter'); Sfx.wlayer('holy', 3, true); Game.freeze(5); Game.addShake(10); Game.flashScreen(0.3, '255,250,220');
  Gear.heal(this, this.hpMax * 0.05);
  WS.area(this, this.x, this.y, 240, 100, WH.holyCounter);
  swingT(this, 'a4', 1.3);
  if (this.act) this.atkOK = true;
};

forgeDef('w8', {
  name: '성스러운 반격', mp: 110, cd: 8, ico: ['shield', '255,235,150'],
  desc: '1초간 벌집 무늬의 성광 방패를 세운다. 그 사이 공격을 받으면 피해를 무효화하고 십자 성광으로 주변 모든 적에게 반격 + HP 5% 회복. 아무도 치지 않으면 방패가 터지며 주변을 밀어낸다.',
  act: {
    anim: 'drawReady', len: 70, cancel: 66, atkCancel: 66,
    start(p) { p.guardT = 62; p.vx = 0; Sfx.wlayer('holy', 1, false); FX.add('world', new FHolyShield(p)); FX.add('ground', new FCircle(p.x, p.y, 110, 64, { kind: 'hex', col: HOLY, col2: '255,255,255', follow: p })); },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      if (f === 62 && p.guardT >= 0) {
        WS.area(p, p.x, p.y, 170, 70, WH.hlWave);
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 190, 18, { col: HOLY, w: 8 }));
        for (let i = 0; i < FF.n(10); i++) FX.add('world', new FP(p.x + p.facing * 34, sy(p.y, 72) + rand(-60, 60), { kind: 'shard', col: HOLY, vx: p.facing * rand(2, 7), vy: rand(-3, 3), grav: 0.2, r: rand(4, 7), life: 30 }));
      }
    },
    end(p) { p.guardT = 0; },
  },
}, {
  name: '심판의 검', mp: 480, cd: 42, ico: ['bigsword', '255,235,150'],
  desc: '하늘이 갈라지며 날개 달린 거대한 성검이 적이 가장 많이 모인 곳에 내리꽂힌다. 십자로 퍼지는 성광이 넓은 범위를 심판하고 HP 25% 회복.',
  act: {
    anim: 'ultUp', len: 84, cancel: 74, atkCancel: 70,
    start(p) { forgeCine(p, '심판의 검', '審 判 의 劍', '255,230,140', { bars: 90, dim: 0.4 }); p.invul = 160; p.vx = 0; },
    update(p, f) {
      if (f === 4) {
        const list = WS.onScreen();
        let best = null, bn = -1;
        for (const e of list) { const n = list.filter(o => Math.abs(o.x - e.x) < 260).length; if (n > bn) { bn = n; best = e; } }
        const x = best ? best.x : p.x + p.facing * 260, y = best ? best.y : p.y;
        Sfx.play('charge'); p.bladeGlow = 2;
        FX.add('ground', new FCircle(x, y, 240, 80, { kind: 'sun', col: HOLY, col2: '255,255,255', spin: 0.01 }));
        FF.screen({ kind: 'lines', col: '255,250,220', a: 0.12, life: 40, fin: 20, fout: 10 });
        FX.add('world', new FJudgeSword(p, x, y, {
          dur: 34, onImpact: b => {
            const gy = sy(b.y, 0);
            FX.add('world', new FBeam(b.x, b.y, 80, 20, { col: HOLY, core: '255,255,255', h: 900 }));
            FX.add('world', new FSlash(b.x, gy - 40, 0, 520, { col: HOLY, core: '255,255,255', th: 18, bend: 0, life: 28 }));
            FX.add('ground', new FRing(b.x, gy, 40, 540, 30, { col: HOLY, w: 22 }));
            FX.add('ground', new FRing(b.x, gy, 30, 380, 24, { col: '255,255,255', w: 8, delay: 4 }));
            FX.add('ground', new FDecal(b.x, b.y, 220, 240, { kind: 'crack', col: '255,230,150' }));
            FX.add('ground', new FDecal(b.x, b.y, 260, 240, { kind: 'glyph', col: HOLY }));
            for (let i = 0; i < FF.n(30); i++) { const a = rand(-Math.PI, 0); FX.add('world', new FP(b.x, gy - 30, { kind: chance(0.5) ? 'feather' : 'star', col: chance(0.5) ? '255,250,230' : HOLY, vx: Math.cos(a) * rand(4, 12), vy: Math.sin(a) * rand(4, 12), drag: 0.92, grav: 0.05, r: rand(4, 8), life: randi(40, 60) })); }
            FF.impact(b.x, gy - 40, HOLY, 1.8);
            Sfx.play('explode', 1.1); Sfx.wlayer('holy', 3, true); Game.addShake(22); Game.flashScreen(0.55, '255,250,220'); Game.zoomPunch(1.08); Game.slowmo(0.4, 18);
            WS.area(p, b.x, b.y, 320, 130, WH.hlJudge);
            Gear.heal(p, p.hpMax * 0.25);
            forgeUndim(24);
          },
        }));
      }
    },
    end() { forgeUndim(10); },
  },
});
