'use strict';
// ============================================================
//  검의 대장간 7 : w34 라그나로크 · w35 카람빗 새벽발톱
// ============================================================

// ============================================================
//  신화의 대검 라그나로크 : 궁니르 · 신들의 황혼
// ============================================================
const MYTH = '255,205,120';
class FGungnir {
  //  번개가 감아 도는 룬 새김 황금 창. 길을 막는 모든 적을 꿰뚫고, 끝에 벼락이 떨어진다
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, life: 46, hits: new Map(), add: false, tr: [] }); }
  update() {
    this.t++; this.x += this.dir * 27; const p = this.p, r = Game.room;
    this.tr.push(this.x); if (this.tr.length > 10) this.tr.shift();
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 90 + e.w || Math.abs(e.y - this.y) > 70) continue;
      if (this.t - (this.hits.get(e) ?? -99) < 5) continue;
      this.hits.set(e, this.t);
      applyHit(p, e, WH.mySpear, { noStopAtt: true, dir: this.dir, hz: 80 });
      Status.add(e, 'shock', { t: 14 });
      FF.spray('spark', e.x, sy(e.y, e.z + e.h * 0.5), 8, { col: MYTH, v0: 3, v1: 9, l0: 10, l1: 18, r0: 2, r1: 3 });
    }
    if (this.t % 3 === 0) FX.add('world', new FLightning(this.x - this.dir * rand(60, 200), sy(this.y, 80) + rand(-30, 30), this.x, sy(this.y, 80), { w: 2, br: 1, life: 6, glow: 0.4 }));
    if (this.t >= this.life || this.x < r.minX - 100 || this.x > r.maxX + 100) {
      const X = clamp(this.x, r.minX + 40, r.maxX - 40), gy = sy(this.y, 0);
      FX.add('world', new FLightning(X - 60, sy(0, 680), X, gy - 10, { w: 9, br: 6, life: 22 }));
      FX.add('world', new FBeam(X, this.y, 80, 28, { col: '255,230,150', core: '255,255,240' }));
      FF.impact(X, gy - 40, MYTH, 2, { burst: '255,250,220' });
      FX.add('ground', new FRing(X, gy, 20, 340, 24, { col: MYTH, w: 14 }));
      FX.add('ground', new FDecal(X, this.y, 160, 240, { kind: 'crack', col: MYTH }));
      FF.spray('spark', X, gy - 20, 24, { col: '255,240,170', ang: -Math.PI / 2, spread: 1.4, v0: 5, v1: 14, grav: 0.3, l0: 16, l1: 30 });
      Sfx.wlayer('myth', 3, true); Sfx.play('explode', 0.9); Game.addShake(14); Game.flashScreen(0.35, '255,245,200'); Game.freeze(3);
      WS.area(p, X, this.y, 300, 120, WH.mySpearBoom);
      return false;
    }
    return true;
  }
  draw(ctx) {
    const d = this.dir, X = this.x, Y = sy(this.y, 80), T = this.t;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';                         // 빛의 꼬리
    const tx = this.tr[0] - d * 200, g = ctx.createLinearGradient(tx, 0, X, 0); g.addColorStop(0, `rgba(${MYTH},0)`); g.addColorStop(1, `rgba(${MYTH},0.6)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tx, Y); ctx.lineTo(X, Y - 18); ctx.lineTo(X, Y + 18); ctx.fill();
    drawGlow(ctx, X - d * 40, Y, 170, MYTH, 0.55, 1.6, 0.5);
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(X, Y); ctx.scale(d, 1);
    const sh = ctx.createLinearGradient(0, -5, 0, 5); sh.addColorStop(0, '#ffe6a0'); sh.addColorStop(0.5, '#a86a18'); sh.addColorStop(1, '#5a3008');
    ctx.fillStyle = sh; ctx.fillRect(-200, -4.5, 196, 9);
    ctx.fillStyle = '#ffd860'; for (let i = 0; i < 5; i++) ctx.fillRect(-190 + i * 36, -6, 5, 12);   // 금고리
    ctx.fillStyle = '#d8a030'; ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(4, -6); ctx.lineTo(4, 6); ctx.lineTo(-6, 14); ctx.closePath(); ctx.fill();
    const hg = ctx.createLinearGradient(0, -18, 0, 18); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.5, '#fff0b0'); hg.addColorStop(1, '#d8a030');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(70, 0); ctx.quadraticCurveTo(30, -20, 4, -9); ctx.lineTo(4, 9); ctx.quadraticCurveTo(30, 20, 70, 0); ctx.fill();   // 창날
    ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(120,220,255,0.95)'; ctx.lineWidth = 1.8;  // 룬
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(56, 0); for (let i = 0; i < 3; i++) { ctx.moveTo(18 + i * 12, -4); ctx.lineTo(22 + i * 12, 0); ctx.lineTo(18 + i * 12, 4); } ctx.stroke();
    ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 2;     // 감아 도는 번개
    for (let s = 0; s < 2; s++) { ctx.beginPath(); for (let i = 0; i <= 14; i++) { const x = -190 + i * 18, y = Math.sin(i * 1.3 + T * 0.9 + s * Math.PI) * 12 + (FF.h(i + T, s) - 0.5) * 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    ctx.restore();
  }
}

class FTwilight {
  //  신들의 황혼 : 붉게 물든 하늘 · 먹구름 · 하늘의 균열에서 쏟아지는 빛
  constructor(p) { Object.assign(this, { p, t: 0, life: 230, add: false }); }
  update() {
    this.t++; const p = this.p;
    if (this.t % 9 === 0 && this.t < 170) {
      const list = WS.onScreen();
      if (list.length) { const e = choose(list); thStrikeFx(e.x, e.y, e.z + e.h * 0.5); applyHit(p, e, WH.myStorm, { noStopAtt: true, dir: -e.facing || 1 }); Status.add(e, 'shock', { t: 18 }); Sfx.wlayer('elec', 2, false); Game.addShake(3); }
    }
    if (this.t >= 20 && this.t < 110 && (this.t - 20) % 15 === 0) {
      const list = WS.onScreen(); if (list.length) {
        const e = choose(list), gy = sy(e.y, 0);
        FX.add('world', new FBeam(e.x, e.y, 56, 30, { col: '255,120,30', core: '255,235,170', h: 560 }));
        FX.add('ground', new FDecal(e.x, e.y, 110, 220, { kind: 'scorch', col: '255,140,50' }));
        FX.add('ground', new FRing(e.x, gy, 20, 240, 20, { col: '255,170,70', w: 10 }));
        FF.spray('flame', e.x, gy - 10, 22, { col: '255,140,40', ang: -Math.PI / 2, spread: 0.5, v0: 5, v1: 14, l0: 20, l1: 36, r0: 10, r1: 18 });
        FF.spray('ember', e.x, gy - 40, 12, { col: '255,200,90', v0: 2, v1: 8, grav: -0.05 });
        Sfx.wlayer('myth', 2, false); Sfx.play('explode', 0.4); Game.addShake(5);
        WS.area(p, e.x, e.y, 200, 90, WH.myFire, { each: e2 => Status.add(e2, 'burn', { t: 150, d: p.atk * 0.2 }) });
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const T = this.t, a = Math.min(1, T / 20, (this.life - T) / 20), L = Game.cam.x, open = clamp((T - 140) / 30, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(120,20,10,0.5)'); g.addColorStop(0.6, 'rgba(255,110,40,0.18)'); g.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = g; ctx.fillRect(L, 0, W, 300);
    for (let i = 0; i < 9; i++) {                                         // 먹구름
      const x = L + ((i * 160 + T * (0.6 + (i % 3) * 0.2)) % (W + 300)) - 150, y = 20 + (i % 3) * 26;
      ctx.fillStyle = `rgba(30,18,24,${0.55 + (i % 2) * 0.15})`; ctx.beginPath(); ctx.ellipse(x, y, 150, 40, 0, 0, TAU); ctx.ellipse(x + 70, y + 12, 100, 32, 0, 0, TAU); ctx.fill();
    }
    if (T % 23 < 3) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, L + FF.h(T, 1) * W, 40, 220, '255,220,200', 0.4, 1, 0.35); ctx.globalCompositeOperation = 'source-over'; }
    if (open > 0 && this.sx !== undefined) {                              // 하늘의 균열
      ctx.globalCompositeOperation = 'lighter'; const cx = this.sx;
      drawGlow(ctx, cx, 30, 300 * open, '255,240,200', 0.7 * open, 1, 0.35);
      ctx.strokeStyle = `rgba(255,250,230,${open})`; ctx.lineWidth = 4 * open; ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const x = cx + (i - 4) * 46 * open, y = 30 + (FF.h(i, 7) - 0.5) * 30; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    }
    ctx.restore();
  }
}
class FGodSword {
  //  하늘의 균열에서 떨어지는 거대한 신검 : 날개 달린 코등이 · 룬이 빛나는 홈 · 보석 박힌 손잡이
  constructor(p, x, y) { Object.assign(this, { p, x, y, t: 0, dur: 44, add: false }); }
  update() {
    this.t++; const p = this.p, gy = sy(this.y, 0);
    if (this.t < this.dur && this.t % 2 === 0) FX.add('world', new FP(this.x + rand(-60, 60), this.tip() - rand(100, 500), { kind: 'spark', col: MYTH, vy: 10, r: 3, life: 10 }));
    if (this.t === this.dur) {
      Sfx.play('explode', 1.2); Sfx.wlayer('myth', 3, true); Game.addShake(28); Game.flashScreen(0.85, '255,250,225'); Game.zoomPunch(1.1); Game.freeze(8); Game.slowmo(0.35, 24);
      FX.add('world', new FBeam(this.x, this.y, 160, 46, { col: '255,210,120', core: '255,255,240', h: 900 }));
      FF.impact(this.x, gy - 60, MYTH, 3.2, { burst: '255,250,220' });
      FX.add('ground', new FRing(this.x, gy, 40, 700, 34, { col: MYTH, w: 26 }));
      FX.add('ground', new FRing(this.x, gy, 20, 520, 44, { col: '255,255,240', w: 8 }));
      FX.add('ground', new FDecal(this.x, this.y, 380, 400, { kind: 'crack', col: MYTH }));
      FX.add('ground', new FDecal(this.x, this.y, 260, 400, { kind: 'scorch', col: '255,170,70' }));
      for (let i = 0; i < FF.n(26); i++) FX.add('world', new Debris(this.x + rand(-80, 80), this.y, 10, { vx: rand(-12, 12), vz: rand(8, 20), s: rand(4, 9), col: ['#3a2416', '#7a5a3c', '#ffd070'], glow: '255,200,100' }));
      FF.spray('spark', this.x, gy - 30, 40, { col: '255,240,170', ang: -Math.PI / 2, spread: 1.5, v0: 6, v1: 18, grav: 0.3, l0: 20, l1: 40 });
      FF.screen({ kind: 'lines', col: '255,240,200', a: 0.3, life: 20, fin: 1, fout: 6 });
      for (const e of WS.onScreen()) applyHit(p, e, WH.mySword, { noStopAtt: true, dir: sign(e.x - this.x) || 1 });
    }
    return this.t < this.dur + 60;
  }
  tip() { const u = Math.min(1, this.t / this.dur); return lerp(-40, sy(this.y, 0) + 10, u * u); }
  draw(ctx) {
    const gy = sy(this.y, 0), u = Math.min(1, this.t / this.dur), X = this.x, tipY = this.tip(), a = this.t > this.dur + 30 ? 1 - (this.t - this.dur - 30) / 30 : 1, L = 470, w = 40;
    ctx.save(); ctx.globalAlpha = a;
    if (this.t < this.dur) { ctx.fillStyle = `rgba(255,220,140,${0.2 + u * 0.4})`; ctx.beginPath(); ctx.ellipse(X, gy, 110 * (0.3 + u * 0.7), 30 * (0.3 + u * 0.7), 0, 0, TAU); ctx.fill(); }
    if (this.t < this.dur) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,200,${0.25 * u})`; for (let i = -2; i <= 2; i++) ctx.fillRect(X + i * 26 - 2, tipY - L - 600, 4, 600); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, tipY - L * 0.5, 260, '255,225,140', 0.55, 0.6, 1.4); ctx.globalCompositeOperation = 'source-over';
    const bl = ctx.createLinearGradient(X - w, 0, X + w, 0); bl.addColorStop(0, '#c8b890'); bl.addColorStop(0.45, '#fffdf0'); bl.addColorStop(0.55, '#e8dcc0'); bl.addColorStop(1, '#8a7a58');
    ctx.fillStyle = bl; ctx.beginPath(); ctx.moveTo(X, tipY); ctx.lineTo(X - w, tipY - 80); ctx.lineTo(X - w * 0.9, tipY - L); ctx.lineTo(X + w * 0.9, tipY - L); ctx.lineTo(X + w, tipY - 80); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6a5020'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#d8b050'; ctx.fillRect(X - 7, tipY - L, 14, L - 70);                   // 홈
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(140,230,255,0.95)';     // 룬
    for (let i = 0; i < 8; i++) { const yy = tipY - L + 30 + i * 46; ctx.fillRect(X - 1.5, yy, 3, 22); ctx.fillRect(X - 6, yy + 6 + (i % 2) * 6, 12, 3); }
    drawGlow(ctx, X, tipY - L * 0.5, 60, '140,230,255', 0.5, 0.3, 3);
    ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(X, tipY - L - 10);                                          // 날개 코등이
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#e8c060'; ctx.strokeStyle = '#7a5010'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 80, -10, s * 150, -60); ctx.lineTo(s * 130, -30); ctx.lineTo(s * 120, -44); ctx.lineTo(s * 100, -14); ctx.lineTo(s * 90, -28); ctx.lineTo(s * 70, -4); ctx.lineTo(s * 30, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.moveTo(s * 20, 2); ctx.quadraticCurveTo(s * 80, -8, s * 140, -54); ctx.lineTo(s * 70, -2); ctx.fill();
    }
    ctx.fillStyle = '#d8a030'; ctx.fillRect(-50, -6, 100, 20);
    ctx.fillStyle = '#3a1a10'; ctx.fillRect(-11, -120, 22, 114);                           // 손잡이
    ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-11, -114 + i * 14); ctx.lineTo(11, -106 + i * 14); ctx.stroke(); }
    ctx.fillStyle = '#e8c060'; ctx.beginPath(); ctx.arc(0, -128, 18, 0, TAU); ctx.fill();
    const gem = ctx.createRadialGradient(-4, -132, 1, 0, -128, 11); gem.addColorStop(0, '#ffd0c0'); gem.addColorStop(1, '#c01020');
    ctx.fillStyle = gem; ctx.beginPath(); ctx.arc(0, -128, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff3040'; ctx.beginPath(); ctx.arc(0, 4, 7, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

// ============================================================
//  카람빗 새벽발톱 : 맹수의 세 줄 발톱 · 야수의 혼
// ============================================================
const TAL = '255,80,60';
function talonRake(cx, cy, ang, len, o = {}) {
  //  평행한 세 줄 발톱 자국 (가운데가 길고 굵다) + 검붉은 상처
  const nx = -Math.sin(ang), ny = Math.cos(ang), gap = o.gap || 34;
  [-1, 0, 1].forEach((k, i) => FX.add('world', new FSlash(cx + nx * k * gap, cy + ny * k * gap, ang, len * (i === 1 ? 1 : 0.8), { col: TAL, core: '255,235,225', th: (i === 1 ? 12 : 9) * (o.s || 1), bend: 0.08, dark: '40,0,0', life: o.life || 18, delay: i * 1 })));
  FF.spray('drip', cx, cy, 8, { col: '200,20,20', v0: 2, v1: 7, grav: 0.4, l0: 20, l1: 34 });
}
class FBeastSpirit {
  //  야수 강림 : 등 뒤로 떠오르는 붉은 늑대의 혼 (빛나는 눈 · 일렁이는 갈기) + 발밑 핏빛 기운
  constructor(p) { Object.assign(this, { p, t: 0, add: false }); }
  update() {
    this.t++; const p = this.p; if (!(p.feralT > 0) || p.hp <= 0) return false;
    if (this.t % 4 === 0) FX.add('world', new FP(p.x + rand(-40, 40), sy(p.y, rand(0, 60)), { kind: 'flame', col: '255,60,40', vy: rand(-2.6, -1.2), r: rand(8, 13), life: 22 }));
    return true;
  }
  draw(ctx) {
    const p = this.p, T = this.t, fade = Math.min(1, T / 14, p.feralT / 20), d = p.facing, X = p.x - d * 30, Y = sy(p.y, p.z + 170) + Math.sin(T * 0.08) * 5;
    ctx.save(); ctx.globalAlpha = fade * 0.75; ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, p.x, sy(p.y, 0), 120, TAL, 0.35, 1, 0.3);
    ctx.translate(X, Y); ctx.scale(d * 1.1, 1.1);
    const g = ctx.createLinearGradient(-60, 0, 80, 0); g.addColorStop(0, 'rgba(160,10,10,0)'); g.addColorStop(0.5, 'rgba(230,40,30,0.45)'); g.addColorStop(1, 'rgba(255,120,90,0.6)');
    ctx.fillStyle = g; ctx.beginPath();                                     // 늑대 머리 옆모습
    ctx.moveTo(-60, 40); ctx.lineTo(-50, -10); ctx.lineTo(-30, -40); ctx.lineTo(-24, -76); ctx.lineTo(-6, -46); ctx.lineTo(10, -70); ctx.lineTo(16, -40);
    ctx.quadraticCurveTo(40, -36, 80, -14); ctx.lineTo(84, -4); ctx.lineTo(60, 4); ctx.lineTo(70, 16); ctx.lineTo(30, 14); ctx.quadraticCurveTo(0, 40, -60, 40); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++) { const yy = -30 + i * 12, flick = Math.sin(T * 0.3 + i) * 8; ctx.beginPath(); ctx.moveTo(-40, yy); ctx.lineTo(-80 - flick - i * 4, yy - 6); ctx.lineTo(-44, yy + 8); ctx.fill(); }   // 갈기
    ctx.fillStyle = 'rgba(255,240,220,0.9)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(40 + k * 9, 4); ctx.lineTo(44 + k * 9, 14); ctx.lineTo(48 + k * 9, 4); ctx.fill(); }
    ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.ellipse(28, -24, 7, 3.5, -0.3, 0, TAU); ctx.fill(); drawGlow(ctx, 28, -24, 30, '255,220,120', 1);
    ctx.restore();
  }
}

Object.assign(WH, {
  mySpear: WS.hd({ dmg: 2.4, kx: 3, kz: 2, airKz: 3, stun: 24, stop: 3, shake: 3, fx: 'pierce', power: 1.4 }),
  mySpearBoom: WS.hd({ dmg: 11, kx: 9, kz: 11, airKz: 10, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2.1 }),
  myStorm: WS.hd({ dmg: 2.7, kx: 1, airKz: 4, stun: 30, stop: 3, shake: 3, fx: 'none', sfx: 'none', power2: 2 }),
  myFire: WS.hd({ dmg: 4, kx: 3, kz: 9, airKz: 8, stun: 50, stop: 6, shake: 6, fx: 'none', sfx: 'heavy', power2: 2 }),
  mySword: WS.hd({ dmg: 34, kx: 10, kz: 14, airKz: 12, stun: 80, stop: 20, shake: 20, fx: 'heavy', power: 2.8 }),
  tlClaw: WS.hd({ dmg: 1.1, kx: 4, kz: 8, airKz: 8, stun: 50, stop: 6, shake: 7, fx: 'slash', power: 1.6 }),
  tlClawEnd: WS.hd({ dmg: 5.5, kx: 9, kz: 12, airKz: 11, stun: 70, stop: 14, shake: 14, fx: 'x', power: 2.4 }),
  tlHunt: WS.hd({ dmg: 2.6, kx: 0.5, kz: 0, airKz: 1, stun: 14, stop: 2, shake: 2, fx: 'slash', power: 1.1 }),
  tlHuntEnd: WS.hd({ dmg: 44, kx: 6, kz: 9, airKz: 9, stun: 80, stop: 16, shake: 16, fx: 'x', power: 2.4 }),
});

// ============================================================
//  스킬 정의
// ============================================================
forgeDef('w34', {
  name: '궁니르', mp: 170, cd: 9, ico: ['spear', '255,225,130'],
  desc: '룬이 새겨진 황금 창을 번개와 함께 던진다. 창은 빛의 꼬리를 끌며 길을 막는 모든 적을 꿰뚫고, 끝에 닿는 곳에 하늘에서 벼락이 내리꽂혀 폭발한다.',
  act: {
    anim: 'a2', len: 30, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.5;
      if (f < 6) { p.bladeGlow = 1 + f * 0.2; if (f === 1) FX.add('world', new FLightning(p.x, sy(0, 600), p.x + p.facing * 20, sy(p.y, 120), { w: 3, br: 2, life: 8 })); }
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('myth', 3, false); Sfx.wlayer('elec', 2, true); Game.flashScreen(0.15, '255,245,200'); p.bladeGlow = 2; Game.addShake(4);
        FX.add('world', new FGungnir(p, p.x + p.facing * 60, p.y, p.facing));
        FF.impact(p.x + p.facing * 60, sy(p.y, 80), MYTH, 0.8, { ring: false });
      }
    },
  },
}, {
  name: '라그나로크', mp: 520, cd: 46, ico: ['ragnarok', MYTH],
  desc: '신들의 황혼을 불러낸다. 하늘이 붉게 물들고 먹구름에서 낙뢰가 쏟아지며, 적의 발밑에서 차례로 불기둥이 솟는다. 마지막에 하늘이 갈라지고 날개 달린 거대한 신검이 떨어져 모든 것을 끝낸다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '라그나로크', '神 들 의 黃 昏', MYTH, { bars: 90, dim: 0.4 }); p.invul = 260; p.vx = 0; },
    update(p, f) {
      if (f !== 10) return;
      p.bladeGlow = 3; Game.flashScreen(0.5, '255,230,170'); Sfx.wlayer('myth', 3, true); Sfx.play('roar', 0.6, 0.5); Game.addShake(12);
      const tw = new FTwilight(p); FX.add('top', tw); forgeUndim(40);
      Gear.later(140, () => {
        const list = WS.onScreen();
        let best = null, bn = -1;
        for (const e of list) { const n = list.filter(o => Math.abs(o.x - e.x) < 320).length; if (n > bn) { bn = n; best = e; } }
        tw.sx = best ? best.x : p.x + p.facing * 300;
        Sfx.play('charge');
      });
      Gear.later(170, () => {
        const x = tw.sx ?? p.x + p.facing * 300, near = WS.nearest(x, p.y, 1, 400)[0];
        FX.add('world', new FGodSword(p, x, near ? near.y : p.y));
      });
    },
  },
});

forgeDef('w35', {
  name: '맹수의 발톱', mp: 140, cd: 8, ico: ['claws', TAL],
  desc: '맹수처럼 몸을 낮췄다가 달려들어 거대한 세 줄 발톱 자국을 세 번 연달아 찢어 놓는다. 앞의 모든 적이 공중으로 떠오르며 출혈을 입고, 마지막에 X자로 갈라진다.',
  act: {
    anim: 'a3', len: 58, cancel: 48, atkCancel: 44,
    start(p) { p.invul = Math.max(p.invul, 50); p.vx = 0; Sfx.wlayer('talon', 2, false); },
    update(p, f) {
      const d = p.facing;
      if (f < 3) FF.spray('glow', p.x, sy(p.y, 60), 3, { col: TAL, v0: 1, v1: 3 });
      if (f >= 3 && f < 12) {
        p.vx = d * 18; p.armorF = true; p.afterOn = 5;
        if (f === 3) { Sfx.pplay('swingBig'); p.bladeGlow = 2; FF.screen({ kind: 'lines', col: '255,200,190', a: 0.2, life: 14, fin: 1, fout: 5 }); }
        FX.add('world', new FP(p.x - d * 20, sy(p.y, rand(20, 120)), { kind: 'spark', col: TAL, vx: -d * 8, r: 3, life: 10 }));
      } else if (f >= 12) p.vx *= 0.5;
      const hitArea = (rx, hd) => WS.area(p, p.x + d * rx * 0.75, p.y, rx, 120, hd, { hmax: 260, each: e => { Status.add(e, 'bleed', { t: 200, d: p.atk * 0.25 }); FF.spray('drip', e.x, sy(e.y, e.z + e.h * 0.5), 4, { col: '200,20,20', v0: 2, v1: 5, grav: 0.4 }); } });
      if (f === 14 || f === 22 || f === 30) {
        const ang = (f === 14 ? -0.55 : f === 22 ? 0.55 : 0) + (d > 0 ? 0 : Math.PI);
        talonRake(p.x + d * 230, sy(p.y, 80), ang, 260);
        swingT(p, f === 22 ? 'a2' : 'a1', 2); Sfx.wlayer('talon', 3, true); Sfx.pplay('swingBig'); Game.addShake(8); Game.freeze(2);
        hitArea(380, WH.tlClaw);
      }
      if (f === 40) {
        const X = p.x + d * 230, Y = sy(p.y, 80);
        talonRake(X, Y, 0.7 + (d > 0 ? 0 : Math.PI), 320, { s: 1.3, life: 24 }); talonRake(X, Y, -0.7 + (d > 0 ? 0 : Math.PI), 320, { s: 1.3, life: 24 });
        FF.impact(X, Y, TAL, 2, { burst: '255,230,220' });
        FX.add('ground', new FRing(X, sy(p.y, 0), 30, 440, 22, { col: TAL, w: 14 }));
        FX.add('ground', new FDecal(X, p.y, 200, 200, { kind: 'pool', col: '120,0,0' }));
        Sfx.wlayer('talon', 3, true); Sfx.play('explode', 0.7); Game.addShake(16); Game.flashScreen(0.3, '255,200,190'); Game.freeze(5);
        hitArea(420, WH.tlClawEnd);
      }
    },
  },
}, {
  name: '야수 강림', mp: 480, cd: 42, ico: ['paw', TAL],
  desc: '가장 단단한 적(보스 우선)에게 붉은 잔상을 남기며 사방에서 달려들어 난도질하고, 급소를 X자로 꿰뚫는다. 그 뒤 8초 동안 붉은 늑대의 혼이 깃든다 : 피해 +30%, 모든 공격이 가까운 적 둘에게 발톱 잔상을 남기고 HP를 조금씩 흡수하며, 동작이 빨라진다.',
  act: {
    anim: 'a1', len: 100, cancel: 999, atkCancel: 999,
    start(p) {
      forgeCine(p, '야수 강림', '野 獸 降 臨', TAL, { bars: 100, dim: 0.45 });
      const list = WS.onScreen().sort((a, b) => (b.isBoss ? 1e15 : 0) + b.hpMax - ((a.isBoss ? 1e15 : 0) + a.hpMax));
      p.huntTarget = list[0] || null; p.invul = 220; p.vx = 0;
    },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      const t = p.huntTarget;
      if (f === 2) { Game.flashScreen(0.35, '255,120,100'); p.bladeGlow = 2; Sfx.play('roar', 0.5, 1.2); }
      if (t && t.hittable()) {
        if (f >= 6 && f < 66 && f % 6 === 0) {
          const k = (f - 6) / 6, a = k * 2.4 + 0.5, d = Math.cos(a) >= 0 ? 1 : -1, ox = Math.cos(a) * 80, oy = Math.sin(a) * 36, x0 = p.x, y0 = p.y;
          p.addGhost(p.x, p.y, p.z, p.facing, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 9, '255,60,40');
          p.x = p.px = clamp(t.x + ox, Game.room.minX, Game.room.maxX); p.y = clamp(t.y + oy, 0, DEPTH); p.facing = -d; p.afterOn = 5;
          const ax = x0, ay = sy(y0, 70), bx = p.x, by = sy(p.y, 70), ang = Math.atan2(by - ay, bx - ax);
          FX.add('world', new FSlash((ax + bx) / 2, (ay + by) / 2, ang, Math.hypot(bx - ax, by - ay) / 2 + 20, { col: TAL, th: 5, bend: 0, life: 10, sparks: false }));
          for (let j = 0; j < 3; j++) Gear.later(j * 2, () => {
            if (!t.hittable()) return;
            swingT(p, j % 2 ? 'a2' : 'a1', 2.4);
            FX.add('world', new FSlash(t.x + rand(-14, 14), sy(t.y, t.z + t.h * 0.5 + rand(-24, 24)), rand(0, TAU), 70, { col: TAL, core: '255,235,225', th: 7, dark: '40,0,0', life: 12, sparks: j === 0 }));
            FF.spray('drip', t.x, sy(t.y, t.z + t.h * 0.5), 3, { col: '200,20,20', v0: 2, v1: 6, grav: 0.4 });
            applyHit(p, t, WH.tlHunt, { noStopAtt: true, dir: p.facing, hz: 70 });
          });
          Sfx.wlayer('talon', 2, false); Sfx.pplay('swing', 0.7, 1.4);
        }
        if (f === 74) {
          p.x = p.px = clamp(t.x - p.facing * 55, Game.room.minX, Game.room.maxX); p.y = t.y; swingT(p, 'a3', 1.4);
          const X = t.x, Y = sy(t.y, t.z + t.h * 0.5);
          talonRake(X, Y, 0.8, 150, { s: 1.2, life: 26, gap: 26 }); talonRake(X, Y, -0.8, 150, { s: 1.2, life: 26, gap: 26 });
          FF.impact(X, Y, TAL, 2.2, { burst: '255,230,220' });
          Game.flashScreen(0.4, '255,210,200'); Game.addShake(14); Game.freeze(8); Sfx.play('explode', 0.7); Sfx.wlayer('talon', 3, true);
          FX.add('top', new Label(X, sy(t.y, t.z + t.hurtH()) - 70, 'FATAL', { col: ['#ffe0d8', '#ff3a28'], size: 34, life: 50 }));
          applyHit(p, t, WH.tlHuntEnd, { noStopAtt: true, dir: p.facing });
          Status.add(t, 'bleed', { t: 240, d: p.atk * 0.3 });
        }
      }
      if (f === 82) {                                                         // 야수 강림 : 8초
        p.feralT = 480; p.hasteT = Math.max(p.hasteT || 0, 480); p.bladeGlow = 2.5;
        Sfx.play('roar', 1, 0.6); Sfx.wlayer('talon', 3, true); Game.addShake(12); Game.flashScreen(0.4, '255,120,100');
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 340, 24, { col: TAL, w: 14 }));
        FF.spray('flame', p.x, sy(p.y, 20), 24, { col: '255,60,40', ang: -Math.PI / 2, spread: 1.3, v0: 4, v1: 11, l0: 20, l1: 34 });
        FX.add('world', new FBeastSpirit(p));
        FX.add('top', new Label(p.x, sy(p.y, p.z) - 230, 'FERAL', { col: ['#ffe0d8', '#ff3a28'], size: 34, life: 70 }));
        forgeUndim(20);
        p.actDone = true;
      }
    },
    end() { forgeUndim(10); },
  },
});

// ============================================================
//  무쇠 연습검 (w0) : 기본 지진검 · 극 귀신참에 새 연출을 덧입힌다 (판정 · 피해는 그대로)
// ============================================================
{
  const STEEL = '140,200,255';
  const q = PA.quake, land = q.onLand, qup = q.update;
  q.onLand = function (p) {
    const was = p.qPhase; land.call(this, p);
    if (was !== 'plunge') return;
    const cx = p.x + p.facing * 40, gy = sy(p.y, 0);
    FX.add('ground', new FDecal(cx, p.y, 220, 240, { kind: 'crack', col: STEEL }));
    FX.add('ground', new FRing(cx, gy, 20, 320, 22, { col: STEEL, w: 10, delay: 2 }));
    FX.add('world', new FSlash(cx, gy - 120, Math.PI / 2, 130, { col: STEEL, core: '255,255,255', th: 12, bend: 0, life: 14, sparks: false }));
    FF.spray('shard', cx, gy - 10, 16, { col: '200,225,255', ang: -Math.PI / 2, spread: 1.3, v0: 4, v1: 12, grav: 0.4, l0: 20, l1: 36 });
    FF.spray('smoke', cx, gy - 10, 12, { col: '150,140,130', v0: 2, v1: 6, r0: 20, r1: 36, l0: 30, l1: 50, grow: 0.4 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = rand(110, 170); FX.add('world', new FRockPillar(cx + Math.cos(a) * r, clamp(p.y + Math.sin(a) * r * 0.35, 0, DEPTH), rand(40, 80), { top: 'spike', lean: Math.cos(a) * 0.3, w: rand(14, 22), delay: i, life: 70, glow: STEEL })); }
  };
  q.update = function (p, f) {
    qup.call(this, p, f);
    if (p.qPhase === 'plunge' && p.qT % 2 === 0) FX.add('world', new FP(p.x + rand(-20, 20), sy(p.y, p.z + rand(40, 140)), { kind: 'spark', col: STEEL, vy: -6, r: 3, life: 10 }));
    if (p.qPhase === 'impact' && p.qT === 12) {
      const cx = p.x + p.facing * 40, gy = sy(p.y, 0);
      FX.add('ground', new FRing(cx, gy, 60, 400, 28, { col: STEEL, w: 8 }));
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = rand(240, 320); FX.add('world', new FBeam(cx + Math.cos(a) * r, clamp(p.y + Math.sin(a) * r * 0.35, 0, DEPTH), 18, 16, { col: STEEL, core: '235,245,255', h: 160, rays: false, delay: i % 3 })); }
    }
  };

  const u = PA.ult, uup = u.update;
  u.update = function (p, f) {
    uup.call(this, p, f);
    if (f === 1) FF.screen({ kind: 'bars', a: 1, life: 100, fin: 8, fout: 10 });
    if (f >= 4 && f <= 66 && f % 3 === 1) {
      const alive = (p.ultTargets || []).filter(e => e.hittable());
      if (alive.length) {
        const e = alive[(f / 3 | 0) % alive.length], c = chance(0.5) ? '255,80,60' : STEEL;
        FX.add('world', new FSlash(e.x + rand(-20, 20), sy(e.y, e.z + e.hurtH() * 0.5 + rand(-20, 20)), rand(-1.2, 1.2), rand(90, 150), { col: c, core: '255,255,255', th: 8, dark: '10,0,0', life: 12, sparks: f % 2 === 0 }));
      }
    }
    if (f === 72) FX.add('ground', new FCircle(p.x, p.y, 160, 30, { kind: 'star', col: '255,80,60', col2: '255,220,200', spin: 0.05 }));
    if (f === 90) {
      FF.screen({ kind: 'lines', col: '255,220,210', a: 0.3, life: 22, fin: 1, fout: 6 });
      FX.add('world', new FSlash(p.x + p.facing * 260, sy(p.y, 120), p.facing > 0 ? 0.25 : Math.PI - 0.25, 520, { col: '255,70,50', core: '255,240,230', th: 22, bend: 0.18, dark: '30,0,0', life: 30 }));
      for (const e of p.ultTargets || []) if (e.hittable()) {
        FX.add('world', new FBeam(e.x, e.y, 70, 30, { col: '255,80,60', core: '255,235,225', h: 700 }));
        FX.add('ground', new FDecal(e.x, e.y, 120, 220, { kind: 'crack', col: '255,90,60' }));
        FF.spray('spark', e.x, sy(e.y, e.z + e.h * 0.5), 14, { col: '255,120,90', v0: 4, v1: 12, grav: 0.2, l0: 14, l1: 26 });
      }
    }
  };
}
