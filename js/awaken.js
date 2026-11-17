'use strict';
// ============================================================
//  각성기 : 스킬 트리(검의 성좌)에서 한 갈래의 별을 모두 밝히면 배울 수 있는 필살 기술
//   Y 키(패드 SELECT · 터치 버튼)로 쓴다 · MP 600 · 쿨타임 60초 · 장착한 하나만 쓴다
//    파검 「파천멸검」 / 유검 「만검귀종」 / 비기 「차원절」 / 수호 「불사성광」
//   별 · 정보 판은 skilltree.js, 여기는 실제 동작과 연출만 둔다
// ============================================================

// ---------- 타격 ----------
const AWK_HD = (dmg, o = {}) => Object.assign({ noBack: true, dmg, kx: 0, kz: 0, airKz: 0, stun: 50, stop: 1, shake: 1, fx: 'slash', power: 1.2, _cat: 'awk' }, o);
const AHD = {
  dash: AWK_HD(2.6, { kx: 1, stun: 60, power: 1.4 }),
  slam: AWK_HD(52, { kx: 14, kz: 16, airKz: 14, stun: 90, stop: 18, shake: 20, fx: 'heavy', power: 2.8 }),
  blade: AWK_HD(1.8, { stun: 45, kz: 3, airKz: 3, fx: 'pierce', power: 1.3 }),
  giant: AWK_HD(34, { kx: 12, kz: 16, airKz: 14, stun: 90, stop: 16, shake: 18, fx: 'x', power: 2.6 }),
  cut: AWK_HD(1.9, { stun: 70, power: 1.3 }),
  void: AWK_HD(58, { kx: 0, kz: 18, airKz: 16, stun: 100, stop: 18, shake: 20, fx: 'x', power: 3 }),
  nova: AWK_HD(24, { kx: 14, kz: 12, airKz: 10, stun: 90, stop: 10, shake: 14, fx: 'heavy', power: 2.2 }),
};

// ---------- 연출 도구 ----------
// 하늘에서 떨어지는 검의 영혼
class SkBlade {
  constructor(x, gy, fall, o = {}) { Object.assign(this, { x, gy, fall, t: 0, add: true, col: o.col || '150,210,255', sc: o.sc || 1, H: o.H || 780, onHit: o.onHit, hit: false }); }
  update() {
    this.t++;
    if (!this.hit && this.t >= this.fall) { this.hit = true; if (this.onHit) this.onHit(); }
    return this.t < this.fall + 16;
  }
  draw(ctx) {
    const sc = this.sc, L = 190 * sc, w = 15 * sc, u = Math.min(1, this.t / this.fall);
    const tip = this.hit ? this.gy : lerp(this.gy - this.H, this.gy, u * u), a = this.hit ? 1 - (this.t - this.fall) / 16 : Math.min(1, this.t / 3);
    ctx.save(); ctx.translate(this.x, tip); ctx.globalAlpha = a;
    if (!this.hit) { const g = ctx.createLinearGradient(0, -L - 320 * sc, 0, -L); g.addColorStop(0, `rgba(${this.col},0)`); g.addColorStop(1, `rgba(${this.col},0.55)`); ctx.fillStyle = g; ctx.fillRect(-w * 0.7, -L - 320 * sc, w * 1.4, 320 * sc); }
    const bg = ctx.createLinearGradient(-w, 0, w, 0); bg.addColorStop(0, `rgba(${this.col},0.9)`); bg.addColorStop(0.5, 'rgba(255,255,255,1)'); bg.addColorStop(1, `rgba(${this.col},0.9)`);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, -L * 0.55); ctx.lineTo(w * 0.5, -L); ctx.lineTo(-w * 0.5, -L); ctx.lineTo(-w, -L * 0.55); ctx.closePath(); ctx.fill();
    drawGlow(ctx, 0, -L * 0.5, L * 0.6, this.col, 0.55);
    if (this.hit) { const k = (this.t - this.fall) / 16; drawGlow(ctx, 0, 0, 40 * sc * (1 + k * 2), '255,255,255', 0.8 * (1 - k)); }
    ctx.restore();
  }
}
// 시공의 균열
class SkRift {
  constructor(x, y, ang, L, life, col = '200,120,255') { Object.assign(this, { x, y, ang, L, life, col, t: 0, add: false }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, open = u < 0.18 ? Ease.out3(u / 0.18) : u > 0.8 ? 1 - Ease.in((u - 0.8) / 0.2) : 1, W2 = this.L * 0.075 * open, L = this.L * (0.3 + 0.7 * Math.min(1, u / 0.12));
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang);
    const path = k => { ctx.beginPath(); ctx.moveTo(-L, 0); for (let i = -5; i <= 5; i++) { const s = i / 5, h = W2 * k * (1 - s * s) * (0.6 + 0.4 * Math.sin(i * 2.7 + this.t * 0.2)); ctx.lineTo(s * L * 0.92, -h); } ctx.lineTo(L, 0); for (let i = 5; i >= -5; i--) { const s = i / 5, h = W2 * k * (1 - s * s) * (0.6 + 0.4 * Math.cos(i * 2.1 + this.t * 0.2)); ctx.lineTo(s * L * 0.92, h); } ctx.closePath(); };
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${this.col},0.3)`; path(1.9); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(8,0,18,0.96)'; path(1.1); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,230,255,${0.9 * open})`; ctx.lineWidth = 2.2; path(1.1); ctx.stroke();
    drawGlow(ctx, 0, 0, L * 0.5, this.col, 0.35 * open, 1.8, 0.35);
    ctx.restore();
  }
}
// 불사성광 : 등 뒤에 펼쳐진 날개와 후광
class SkAura {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() { this.t++; const p = this.p; if (!(p.awkBuffT > 0) || p.hp <= 0) return false; if (this.t % 5 === 0) FX.add('world', new Mote(p.x + rand(-34, 34), sy(p.y, rand(0, 150)), rand(-0.3, 0.3), rand(-2, -0.8), { col: choose(['255,225,120', '255,255,235']), life: 34, r: rand(4, 7), grav: 0 })); return true; }
  draw(ctx) {
    const p = this.p, t = this.t, cx = p.x, cy = sy(p.y, p.z + 90), fade = Math.min(1, p.awkBuffT / 40, t / 12), flap = Math.sin(t * 0.07) * 0.06;
    ctx.save(); ctx.globalAlpha = fade;
    drawGlow(ctx, cx, cy, 190, '255,225,120', 0.26 + Math.sin(t * 0.09) * 0.05, 1, 1.1);
    drawGlow(ctx, p.x, sy(p.y, p.z + 168), 46, '255,245,200', 0.8);
    ctx.strokeStyle = 'rgba(255,235,170,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, sy(p.y, p.z + 160), 22, 7, 0, 0, TAU); ctx.stroke();
    for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) {
      const a = (-0.35 + i * 0.3 + flap) * sg, L = 120 - i * 12;
      ctx.save(); ctx.translate(cx - p.facing * 6, cy + 6); ctx.rotate(a - Math.PI / 2 * 0 + (sg > 0 ? 0 : 0));
      ctx.scale(sg, 1);
      const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(255,250,225,0.8)'); g.addColorStop(1, 'rgba(255,215,110,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(L * 0.5, -15 - i, L, -3); ctx.quadraticCurveTo(L * 0.5, 9, 8, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}
const awkShake = (n, flash, col) => { Game.addShake(n); if (flash) Game.flashScreen(flash, col || '255,255,255'); };
const awkSplash = (x, gy, col, n = 14) => { for (let i = 0; i < n; i++) FX.add('world', new Mote(x + rand(-30, 30), gy - rand(0, 20), rand(-3, 3), rand(-6, -2), { col: choose([col, '255,255,255']), life: 26, r: rand(3, 6), grav: 0.3 })); };

// ============================================================
//  파천멸검 (파검)  : 무적 질주 12연참 → 천공 강타
// ============================================================
const AWK_ACT = {};
AWK_ACT.awk_p = {
  anim: 'drawReady', len: 190, cancel: 170,
  start(p) { Game.startCutin(p, { name: '파천멸검', sub: '破 天 滅 劍', col: '255,70,50' }); p.invul = 360; p.vx = p.vy = 0; p.aw = { ph: 'charge', t: 0 }; },
  update(p, f) {
    const A = p.aw, d = p.facing, r = Game.room;
    p.armorF = true; p.invul = Math.max(p.invul, 12);
    if (f === 1) { Game.dimTo(0.55, 12); Sfx.play('charge'); p.ghostGlow = 1; p.bladeGlow = 2; p.vx = 0; }
    if (A.ph === 'charge') {
      p.vx *= 0.5;
      if (f % 2) convergeMotes(p.x + d * 30, sy(p.y, 80), 3, '255,90,60', 170);
      if (f === 12) { FX.add('ground', new Ring(p.x, sy(p.y, 0), 30, 240, 24, { col: '255,110,70', w: 10 })); Sfx.play('ring', 0.7, 0.7); }
      if (f === 24) {
        A.ph = 'dash'; A.n = 0; p.play('drawFollow', 0, 1, true); p.ghostGlow = 0; p.bladeGlow = 2;
        Sfx.play('flash'); awkShake(8, 0.55, '255,200,180'); p.afterOn = 40;
      }
    } else if (A.ph === 'dash') {
      p.invul = Math.max(p.invul, 20);
      const edge = d > 0 ? r.maxX - 60 : r.minX + 60;
      p.vx = (d > 0 ? p.x < edge : p.x > edge) ? d * 22 : 0;
      p.afterOn = 6;
      if (f % 2 === 0) {
        A.n++;
        p.play(A.n % 2 ? 'a1' : 'a2', 0, 1, true);
        WS.area(p, p.x + d * 80, p.y, 220, 100, AHD.dash, { hmax: 240, dir: d });
        const ang = rand(-1.1, 1.1) + (chance(0.4) ? Math.PI / 2 : 0), cx = p.x + d * rand(40, 190);
        FX.add('world', new CutLine(cx, sy(p.y, rand(30, 150)), ang, 200 + rand(0, 110), 9, chance(0.5) ? '255,90,70' : '255,235,210', 13));
        if (A.n % 3 === 0) { p.addGhost(p.x - d * 30, p.y, p.z, d, chance(0.5) ? PP.a1s : PP.a2s, 12, '255,90,70'); Sfx.play('swing', 0.7, 1 + A.n * 0.03); }
        Game.addShake(3);
      }
      if (A.n >= 12) { A.ph = 'leap'; A.f0 = f; p.vx = 0; p.play('ultUp', 0, 1, true); p.gravOff = true; p.bladeGlow = 3; Sfx.play('charge'); p.ghostGlow = 1; }
    } else if (A.ph === 'leap') {
      const k = f - A.f0;
      p.vx *= 0.6; p.vz = 0; p.z += (210 - p.z) * 0.14;
      if (k % 2 === 0) convergeMotes(p.x + d * 10, sy(p.y, p.z + 150), 3, chance(0.5) ? '255,90,60' : '255,230,200', 190);
      if (k === 10) FX.add('world', new Flash(p.x + d * 20, sy(p.y, p.z + 160), 30, 260, 24, '255,120,80', 0.8));
      if (k >= 26) {
        A.ph = 'slam'; p.gravOff = false; p.vz = -30; p.play('ultDn', 0, 1, true); p.trailOn = true; p.ghostGlow = 0;
        crescentAt(p, 60, 140, 330, -118, 72, { th: 90, life: 26, col: '255,70,50', core: '255,240,230', speed: 4, grow: 0.08 });
        Sfx.pplay('swingBig'); Sfx.play('cutin', 0.5, 1.3); Game.zoomPunch(1.04);
      }
    } else if (A.ph === 'slam') {
      p.vz = Math.min(p.vz, -30); p.bladeGlow = 3; p.afterOn = 4;
      if (f - A.f0 > 70) AWK_ACT.awk_p.onLand(p);
    } else if (A.ph === 'impact') {
      A.t++;
      if (A.t >= 50) p.actDone = true;
    }
  },
  onLand(p) {
    const A = p.aw; if (!A || A.ph !== 'slam') return;
    A.ph = 'impact'; A.t = 0; p.vx = 0; p.trailOn = false; p.play('ebImpact', 0, 1, true);
    const d = p.facing, cx = p.x + d * 70, gy = sy(p.y, 0);
    p.swing = newSwing();
    FX.add('ground', new Ring(cx, gy, 30, 620, 34, { w: 22, col: '255,200,150' }));
    FX.add('ground', new Ring(cx, gy, 20, 420, 26, { w: 14, col: '255,90,60' }));
    FX.add('ground', new Crack(cx, p.y, 330));
    FX.add('world', new Flash(cx, gy - 40, 60, 480, 30, '255,200,150', 1));
    FX.add('world', new Pillar(cx, p.y, 150, 900, 40, '255,90,60', '255,240,225'));
    FX.add('world', new CutLine(cx, gy - 260, Math.PI / 2, 760, 16, '255,255,255', 22));
    FX.add('world', new CutLine(cx, gy - 130, d > 0 ? 0 : Math.PI, 700, 14, '255,140,100', 20));
    for (let i = 0; i < 40; i++) FX.add('world', new Debris(cx + rand(-120, 120), p.y + rand(-30, 30), 4, { vx: rand(-11, 11), vz: rand(8, 22), s: rand(3, 9), glow: chance(0.5) ? '255,140,60' : null }));
    Hitfx.dust(cx, gy, 26, 200);
    WS.area(p, cx, p.y, 650, 160, AHD.slam, { hmax: 340, dir: d, each: e => { e.awkBreak = 420; } });
    Sfx.play('quake'); Sfx.play('explode', 0.9); Sfx.play('cutin', 0.5, 0.7);
    awkShake(32, 1, '255,225,210'); Game.slowmo(0.18, 60); Game.zoomPunch(1.14); Game.dimTo(0, 30); p.hitstop = 8;
    FX.add('top', new Label(p.x, sy(p.y, 0) - 240, '破 天', { col: ['#ffffff', '#ff6a4a'], size: 54, life: 70, vy: -0.4 }));
  },
  end(p) { p.gravOff = false; p.armorF = false; p.trailOn = false; p.ghostGlow = 0; p.aw = null; Game.dimTo(0, 10); },
};

// ============================================================
//  만검귀종 (유검) : 검 36자루 + 거대한 검 → 쿨타임 초기화
// ============================================================
AWK_ACT.awk_s = {
  anim: 'ultUp', len: 160, cancel: 140,
  start(p) { Game.startCutin(p, { name: '만검귀종', sub: '萬 劍 歸 宗', col: '120,200,255' }); p.invul = 360; p.vx = p.vy = 0; p.aw = { n: 0 }; },
  update(p, f) {
    const A = p.aw, r = Game.room;
    p.armorF = true; p.invul = Math.max(p.invul, 12); p.vx *= 0.5; p.vy = 0;
    if (f === 1) { p.play('ultUp', 0, 1, true); p.gravOff = true; Game.dimTo(0.62, 14); Sfx.play('charge'); p.bladeGlow = 2.5; p.ghostGlow = 0.6; }
    if (f <= 26) { p.vz = 0; p.z += (150 - p.z) * 0.18; if (f % 2) convergeMotes(p.x, sy(p.y, p.z + 130), 3, '140,210,255', 200); }
    if (f === 6 || f === 14) FX.add('world', new Ring(p.x, sy(p.y, p.z + 150), 30, 330 - (f - 6) * 6, 42, { col: '140,210,255', w: 6, ry: 0.2 }));
    if (f > 26) { p.vz = 0; p.z = lerp(p.z, 150 + Math.sin(f * 0.16) * 6, 0.2); }
    // 검 36자루
    if (f >= 28 && f <= 98 && f % 2 === 0) {
      const ts = WS.onScreen(80), e = ts.length ? choose(ts) : null;
      const tx = e ? e.x + rand(-26, 26) : clamp(p.x + p.facing * rand(60, 420), r.minX, r.maxX), ty = e ? e.y : clamp(p.y + rand(-50, 50), 0, DEPTH), n = ++A.n;
      FX.add('world', new SkBlade(tx, sy(ty, 0), 9, {
        col: n % 3 ? '150,215,255' : '255,255,255',
        onHit() {
          WS.area(p, tx, ty, 130, 80, AHD.blade, { hmax: 280 });
          FX.add('ground', new Ring(tx, sy(ty, 0), 10, 90, 12, { col: '170,225,255', w: 6 }));
          awkSplash(tx, sy(ty, 0), '170,225,255', 8);
          if (n % 3 === 0) { Sfx.play('katana', 0.5, 1 + (n % 7) * 0.05); Game.addShake(3); }
        },
      }));
    }
    // 거대한 검
    if (f === 104) {
      const ts = WS.onScreen(80), gx = ts.length ? ts.reduce((s, e) => s + e.x, 0) / ts.length : clamp(p.x + p.facing * 240, r.minX, r.maxX), gy0 = ts.length ? ts[0].y : p.y;
      A.gx = gx; Game.dimTo(0.85, 6); Sfx.play('charge'); Game.slowmo(0.45, 16);
      FX.add('world', new Flash(p.x, sy(p.y, p.z + 120), 40, 300, 26, '200,235,255', 0.9));
      FX.add('world', new SkBlade(gx, sy(gy0, 0), 18, {
        sc: 3.4, H: 1100, col: '190,230,255',
        onHit() {
          const gy = sy(gy0, 0);
          p.swing = newSwing();
          FX.add('ground', new Ring(gx, gy, 30, 600, 34, { w: 20, col: '170,225,255' }));
          FX.add('ground', new Ring(gx, gy, 20, 380, 26, { w: 12, col: '255,255,255' }));
          FX.add('ground', new Crack(gx, gy0, 300));
          FX.add('world', new Flash(gx, gy - 40, 60, 480, 30, '190,230,255', 1));
          FX.add('world', new Pillar(gx, gy0, 160, 900, 40, '140,210,255', '240,250,255'));
          for (let i = 0; i < 36; i++) FX.add('world', new Debris(gx + rand(-100, 100), gy0 + rand(-30, 30), 4, { vx: rand(-10, 10), vz: rand(8, 20), s: rand(3, 8), glow: '140,210,255' }));
          WS.area(p, gx, gy0, 600, 150, AHD.giant, { hmax: 340 });
          Sfx.play('quake'); Sfx.play('explode', 0.9);
          awkShake(30, 1, '230,245,255'); Game.slowmo(0.2, 56); Game.zoomPunch(1.13); Game.dimTo(0, 30);
          FX.add('top', new Label(gx, gy - 240, '萬 劍', { col: ['#ffffff', '#6ac8ff'], size: 54, life: 70, vy: -0.4 }));
        },
      }));
    }
    // 쿨타임 초기화
    if (f === 128) {
      for (const k of ['s1', 's2', 's3', 's4']) p.cd[k] = 0;
      p.zenT = 480; FX.add('world', new SkZen(p)); p.gravOff = false; p.ghostGlow = 0;
      FX.add('top', new Label(p.x, sy(p.y, p.z) - 190, '쿨타임 초기화', { col: ['#ffffff', '#7fd4ff'], size: 28, life: 70 }));
      FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 260, 24, { col: '140,210,255', w: 12 }));
      Sfx.play('ring', 0.9, 1.4); Sfx.play('clear', 0.7, 1.2);
    }
    if (f > 128) p.gravOff = false;
  },
  end(p) { p.gravOff = false; p.armorF = false; p.ghostGlow = 0; p.aw = null; Game.dimTo(0, 10); },
};

// ============================================================
//  차원절 (비기) : 시간 정지 연속 절단 → 특이점 붕괴
// ============================================================
AWK_ACT.awk_w = {
  anim: 'drawReady', len: 156, cancel: 138,
  start(p) { Game.startCutin(p, { name: '차원절', sub: '次 元 絶', col: '200,110,255' }); p.invul = 380; p.vx = p.vy = 0; p.aw = { cut: 0 }; },
  update(p, f) {
    const A = p.aw, d = p.facing, r = Game.room;
    p.armorF = true; p.invul = Math.max(p.invul, 12); p.vx *= 0.4; p.vy = 0;
    if (f === 1) {
      A.ts = WS.onScreen(120); A.cx = A.ts.length ? A.ts.reduce((s, e) => s + e.x, 0) / A.ts.length : clamp(p.x + d * 240, r.minX, r.maxX);
      for (const e of A.ts) e.suspend = 170;
      Game.dimTo(0.82, 10); Sfx.play('charge'); p.bladeGlow = 2.5; p.ghostGlow = 1; Game.flashScreen(0.5, '210,150,255');
      FX.add('world', new SkRift(A.cx, sy(p.y, 120), Math.PI / 2 - 0.2, 460, 110, '200,120,255'));
      FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 280, 26, { col: '200,120,255', w: 10 }));
    }
    // 정지한 시간 속에서 차례로 베어낸다
    if (f >= 12 && f <= 84 && (f - 12) % 6 === 0) {
      const alive = A.ts.filter(e => e.hittable()), c = ++A.cut;
      const e = alive.length ? choose(alive) : null, x = e ? e.x : A.cx + rand(-120, 120), y = e ? e.y : p.y, hz = e ? e.z + e.hurtH() * 0.5 : 80;
      p.play(c % 2 ? 'a1' : 'a2', 0, 1, true); p.bladeGlow = 2;
      const ang = rand(-0.5, 0.5) + (c % 2 ? 0.9 : -0.9);
      FX.add('world', new SkRift(x, sy(y, hz), ang, 230 + rand(0, 90), 26, c % 3 ? '200,120,255' : '255,160,230'));
      FX.add('world', new CutLine(x, sy(y, hz), ang + 1.57, 160, 7, '255,255,255', 12));
      for (const t of alive) applyHit(p, t, AHD.cut, { noStopAtt: true, dir: sign(t.x - p.x) || d });
      p.addGhost(p.x - d * rand(20, 80), p.y, p.z, d, chance(0.5) ? PP.a1s : PP.a2s, 12, '200,120,255');
      Sfx.play('flash', 0.5, 0.9 + c * 0.04); Sfx.play('ultSlash', 0.5, 1 + c * 0.03); Game.addShake(4);
    }
    // 끌려 들어간다
    if (f === 86) { Sfx.play('charge'); Sfx.play('ring', 0.8, 0.5); FX.add('world', new Ring(A.cx, sy(p.y, 90), 460, 20, 26, { col: '230,150,255', w: 14, ry: 0.5 })); p.play('ultUp', 0, 1, true); }
    if (f >= 86 && f < 110) {
      for (const e of A.ts) if (e.hittable()) { e.suspend = Math.max(e.suspend, 20); e.x = lerp(e.x, A.cx, 0.17); e.y = lerp(e.y, p.y, 0.1); }
      convergeMotes(A.cx, sy(p.y, 90), 4, chance(0.5) ? '210,130,255' : '255,255,255', 300);
    }
    // 특이점 붕괴
    if (f === 112) {
      const gy = sy(p.y, 0);
      for (const e of A.ts) e.suspend = 0;
      p.swing = newSwing(); p.play('ultDn', 0, 1, true);
      FX.add('world', new SkRift(A.cx, sy(p.y, 100), Math.PI / 2, 520, 34, '230,150,255'));
      FX.add('world', new Flash(A.cx, sy(p.y, 90), 40, 560, 34, '230,170,255', 1));
      FX.add('world', new Pillar(A.cx, p.y, 180, 950, 44, '190,100,255', '250,235,255'));
      for (let i = 0; i < 3; i++) FX.add('ground', new Ring(A.cx, gy, 20, 360 + i * 140, 26 + i * 6, { w: 16 - i * 3, col: i ? '200,120,255' : '255,255,255' }));
      for (let i = 0; i < 30; i++) { const a = rand(0, TAU); FX.add('world', new Mote(A.cx, gy - 80, Math.cos(a) * rand(4, 12), Math.sin(a) * rand(3, 8), { col: choose(['210,130,255', '255,255,255']), life: 36, r: rand(5, 10), grav: 0 })); }
      WS.area(p, A.cx, p.y, 720, 230, AHD.void, { hmax: 420 });
      p.mp = p.mpMax; p.mpBoostT = 600;
      Sfx.play('explode'); Sfx.play('quake', 0.8, 0.8); Sfx.play('cutin', 0.5, 0.6);
      awkShake(32, 1, '240,220,255'); Game.slowmo(0.16, 70); Game.zoomPunch(1.15); Game.dimTo(0, 36);
      FX.add('top', new Label(A.cx, gy - 250, '次 元 絶', { col: ['#ffffff', '#c878ff'], size: 54, life: 80, vy: -0.4 }));
      FX.add('top', new Label(p.x, sy(p.y, 0) - 180, 'MP 가득', { col: ['#ffffff', '#6aa8ff'], size: 24, life: 70 }));
    }
  },
  end(p) { p.armorF = false; p.ghostGlow = 0; p.aw = null; Game.dimTo(0, 10); },
};

// ============================================================
//  불사성광 (수호) : 성광 폭발 + 12초 불사 상태
// ============================================================
AWK_ACT.awk_v = {
  anim: 'ultUp', len: 86, cancel: 70,
  start(p) { Game.startCutin(p, { name: '불사성광', sub: '不 死 聖 光', col: '255,225,120' }); p.invul = 420; p.vx = p.vy = 0; p.aw = {}; },
  update(p, f) {
    p.armorF = true; p.invul = Math.max(p.invul, 12); p.vx *= 0.4; p.vy = 0;
    if (f === 1) {
      p.play('ultUp', 0, 1, true); p.gravOff = true; Game.dimTo(0.55, 12); Sfx.play('charge'); Sfx.play('clear', 0.6, 0.8); p.bladeGlow = 2.5;
      FX.add('world', new Pillar(p.x, p.y, 90, 760, 46, '255,215,110', '255,250,225'));
      FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 280, 30, { col: '255,225,130', w: 12 }));
    }
    if (f <= 40) {
      p.vz = 0; p.z += (95 - p.z) * 0.12;
      if (p.hp > 0) p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.5 / 40);                        // HP 50% 회복
      if (f % 2 === 0) FX.add('world', new Mote(p.x + rand(-40, 40), sy(p.y, rand(0, 160)), rand(-0.3, 0.3), rand(-3.2, -1), { col: choose(['255,225,120', '255,255,235']), life: 36, r: rand(4, 8), grav: 0 }));
      if (f % 2) convergeMotes(p.x, sy(p.y, p.z + 80), 3, '255,225,130', 190);
      if (f === 14) { p.awkBuffT = 720 + 76; FX.add('world', new SkAura(p)); Sfx.play('ring', 0.8, 1); }
    }
    if (f === 40) {
      const gy = sy(p.y, 0);
      p.swing = newSwing();
      for (let i = 0; i < 3; i++) FX.add('ground', new Ring(p.x, gy, 20, 420 + i * 120, 26 + i * 6, { w: 18 - i * 4, col: i ? '255,225,130' : '255,255,255' }));
      FX.add('world', new Flash(p.x, sy(p.y, 90), 60, 560, 34, '255,240,190', 1));
      FX.add('world', new Pillar(p.x, p.y, 200, 900, 40, '255,215,110', '255,252,235'));
      for (let i = 0; i < 28; i++) { const a = rand(0, TAU); FX.add('world', new Mote(p.x, sy(p.y, 90), Math.cos(a) * rand(4, 11), Math.sin(a) * rand(2, 8), { col: choose(['255,225,120', '255,255,255']), life: 38, r: rand(5, 9), grav: 0 })); }
      WS.area(p, p.x, p.y, 680, 180, AHD.nova, { hmax: 380 });
      Game.projectiles = [];                                                                         // 날아오던 공격은 모두 사라진다
      Sfx.play('explode', 0.9); Sfx.play('clear', 0.9, 1); Sfx.play('cutin', 0.5, 1.4);
      awkShake(22, 0.9, '255,245,205'); Game.slowmo(0.3, 36); Game.zoomPunch(1.08); Game.dimTo(0, 26);
      FX.add('top', new Label(p.x, gy - 250, '不 死 聖 光', { col: ['#ffffff', '#ffd24a'], size: 48, life: 80, vy: -0.4 }));
      FX.add('top', new Label(p.x, gy - 190, '불사 상태 12초', { col: ['#ffffff', '#7dffa0'], size: 22, life: 70 }));
    }
    if (f > 44) p.gravOff = false;
  },
  end(p) { p.gravOff = false; p.armorF = false; p.aw = null; Game.dimTo(0, 10); },
};

for (const k in AWK_ACT) { AWK_ACT[k].name = k; AWK_ACT[k].isSkill = true; PA[k] = AWK_ACT[k]; }

// ============================================================
//  연결 : 쓰기 · 슬롯 · 상태
// ============================================================
Object.assign(Prog, {
  // Y 키 : 장착한 각성기를 쓴다
  tryAwaken(p) {
    if (!p.has('awk')) return false;
    p.use('awk');
    const a = this.awkSel(); if (!a) return false;
    const D = SK_AWK[a];
    if ((p.cd.awk || 0) > 0) { Sfx.play('ui', 0.5, 0.5); return false; }
    if (p.mp < D.mp) { Game.notice('MP가 부족합니다'); Sfx.play('ui', 0.5, 0.5); return false; }
    p.mp -= D.mp; p.cd.awk = D.cd;
    Game.stats.skills++; Save.data.stat.skills++;
    p.startAct(AWK_ACT['awk_' + a]);
    return true;
  },
  awkIcon() { const a = this.awkSel(); return a ? TreeUI.icon(SKN_BY['aw_' + a], 'c') : null; },
});

// 매 프레임 : 방어가 무너진 적 표시
{
  const tick0 = Prog.tick;
  Prog.tick = function (p) {
    tick0.call(this, p);
    for (const e of Game.enemies) {
      if (!(e.awkBreak > 0)) continue;
      e.awkBreak--;
      if (e.awkBreak % 14 === 0 && !e.dead) FX.add('world', new Mote(e.x + rand(-18, 18), sy(e.y, e.hurtH() * rand(0.3, 0.9)), 0, rand(-1.4, -0.5), { col: '255,90,70', life: 26, r: rand(3, 5), grav: 0 }));
    }
  };
  const ts0 = Player.prototype.trySkills;
  Player.prototype.trySkills = function (allowAir, exclude) { if (Prog.tryAwaken(this)) return true; return ts0.call(this, allowAir, exclude); };
  const sk0 = Player.prototype.skill;
  Player.prototype.skill = function (k) { if (k === 'awk') { const D = SK_AWK[Prog.awkSel()]; return D ? { key: 'awk', mp: D.mp, cd: D.cd } : { key: 'awk', mp: 0, cd: 1 }; } return sk0.call(this, k); };
}
