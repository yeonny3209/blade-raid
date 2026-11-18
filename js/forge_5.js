'use strict';
// ============================================================
//  검의 대장간 5 : w24 캔디 · w25 아이기스 · w26 본블레이드 · w27 태극 · w28 아케인
// ============================================================

function drawHeart(ctx, x, y, s, fill) {
  ctx.fillStyle = fill; ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 0.9, y - s * 0.95, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.9, y - s * 0.95, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.fill();
}

// ============================================================
//  캔디 크러셔 : 포장 사탕 폭탄 · 거대 롤리팝과 매혹의 하트
// ============================================================
const CANDY = '255,130,200', CANDY_COLS = ['255,120,190', '120,210,255', '255,225,110', '150,255,170', '200,150,255'];
class FCandyBomb {
  //  양 끝이 꼬인 포장 사탕. 적에게 달라붙어 깜빡이다가 사탕 파편으로 터진다
  constructor(p, x, y, z, vx, vy, vz, hue) { Object.assign(this, { p, x, y, z, vx, vy, vz, hue, t: 0, rot: 0, stuck: null, st: 0, fuse: 40, add: false, sx: 0 }); }
  update() {
    this.t++;
    if (this.stuck || this.st > 0) {
      const e = this.stuck; if (e && e.hittable()) { this.x = e.x + this.sx; this.y = e.y; this.z = e.z + e.h * 0.6; }
      this.st++; this.rot = Math.sin(this.st * 0.8) * 0.3;
      if (this.st % 8 === 0) Sfx.pplay('swing', 0.2, 2 + this.st * 0.02);
      if (this.st >= this.fuse) { this.boom(); return false; }
      return true;
    }
    this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.z += this.vz; this.vz -= 0.45; this.rot += 0.35;
    if (this.t % 2 === 0) FX.add('world', new FP(this.x, sy(this.y, this.z), { kind: 'star', col: CANDY_COLS[this.hue], vx: -this.vx * 0.1, vy: rand(-0.5, 0.5), r: 3, life: 14 }));
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 36 + e.w || Math.abs(e.y - this.y) > 36 || this.z > e.z + e.hurtH() + 20 || this.z < e.z - 20) continue;
      this.stuck = e; this.sx = this.x - e.x; this.st = 1; Sfx.play('thud', 0.4, 1.6);
      FF.spray('drip', this.x, sy(this.y, this.z), 5, { col: CANDY_COLS[this.hue], v0: 1, v1: 3, grav: 0.3 });
      return true;
    }
    if (this.z <= 0) { this.z = 0; this.st = 1; this.vx = this.vy = this.vz = 0; FX.add('ground', new FDecal(this.x, this.y, 40, 80, { kind: 'pool', col: CANDY_COLS[this.hue] })); }
    const r = Game.room; if (this.x < r.minX - 40 || this.x > r.maxX + 40) { this.boom(); return false; }
    return true;
  }
  boom() {
    const p = this.p, X = this.x, Y = this.y, gy = sy(Y, 0), c = CANDY_COLS[this.hue];
    FF.impact(X, sy(Y, this.z) - 10, c, 1, { burst: '255,255,255' });
    FX.add('ground', new FRing(X, gy, 14, 220, 20, { col: c, w: 12 }));
    FX.add('ground', new FDecal(X, Y, 130, 200, { kind: 'pool', col: c }));
    FF.spray('candy', X, sy(Y, this.z), 14, { col: c, v0: 4, v1: 11, grav: 0.4, l0: 30, l1: 50, r0: 5, r1: 8 });
    for (const k of CANDY_COLS) FF.spray('star', X, sy(Y, this.z), 3, { col: k, v0: 3, v1: 9, grav: 0.2, l0: 20, l1: 34 });
    Sfx.wlayer('candy', 3, true); Sfx.play('explode', 0.4, 1.3); Game.addShake(5);
    WS.area(p, X, Y, 190, 80, WH.cdBomb, { each: e => Status.add(e, 'slow', { t: 150, m: 0.45 }) });
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z), c = CANDY_COLS[this.hue], bl = this.st > 0 ? (Math.sin(this.st * (0.4 + this.st * 0.02)) > 0 ? 1 : 0) : 0;
    if (this.z > 0 && !this.stuck) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X, sy(this.y, 0), 16, 5, 0, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot);
    for (const s of [-1, 1]) {                                     // 꼬인 포장지
      ctx.fillStyle = `rgba(${c},0.9)`; ctx.beginPath(); ctx.moveTo(s * 14, 0); ctx.lineTo(s * 30, -12); ctx.lineTo(s * 26, 0); ctx.lineTo(s * 30, 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s * 16, -2); ctx.lineTo(s * 27, -8); ctx.moveTo(s * 16, 2); ctx.lineTo(s * 27, 8); ctx.stroke();
    }
    const g = ctx.createRadialGradient(-5, -5, 2, 0, 0, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, `rgb(${c})`); g.addColorStop(1, `rgba(${c},1)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4;   // 줄무늬
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 9 - 16, -16); ctx.lineTo(i * 9 + 4, 16); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(90,20,60,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(-6, -7, 5, 3, -0.6, 0, TAU); ctx.fill();
    if (bl) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 44, '255,255,255', 0.7); }
    ctx.restore();
  }
}

class FLollipop {
  //  매혹의 단맛 : 뒤편에 솟는 거대한 소용돌이 롤리팝 + 분홍 안개
  constructor(p, x, y) { Object.assign(this, { p, x, y, t: 0, life: 200, add: false }); }
  update() { this.t++; if (this.t % 5 === 0) FX.add('world', new FP(this.x + rand(-300, 300), sy(this.y, rand(0, 40)), { kind: 'smoke', col: '255,170,215', vx: rand(-0.5, 0.5), vy: -0.4, r: rand(30, 50), grow: 0.5, life: 60 })); return this.t < this.life; }
  draw(ctx) {
    const T = this.t, rise = E.out3(Math.min(1, T / 26)), a = Math.min(1, (this.life - T) / 20), X = this.x, gy = sy(this.y, 0), H = 330 * rise, R = 110 * rise;
    if (R < 1) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#f8f2ea'; ctx.fillRect(X - 8, gy - H, 16, H); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(X + 2, gy - H, 6, H);   // 막대
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, gy - H, R * 2.2, CANDY, 0.35); ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(X, gy - H); ctx.rotate(T * 0.05);
    ctx.fillStyle = '#ffe0f0'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    for (const [c, off] of [['#ff5aa8', 0], ['#7ad0ff', 2.1], ['#ffd860', 4.2]]) {       // 세 겹 소용돌이
      ctx.strokeStyle = c; ctx.lineWidth = R * 0.16; ctx.beginPath();
      for (let k = 0; k <= 60; k++) { const q = k / 60, ang = off + q * 9, r = q * R * 0.9; k ? ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : ctx.moveTo(0, 0); }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(160,40,110,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-R * 0.4, -R * 0.45, R * 0.28, R * 0.12, -0.7, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ff7ac0'; ctx.beginPath(); ctx.moveTo(X, gy - H + R); ctx.lineTo(X - 34, gy - H + R + 22); ctx.lineTo(X - 30, gy - H + R + 6); ctx.lineTo(X + 30, gy - H + R + 6); ctx.lineTo(X + 34, gy - H + R + 22); ctx.fill();   // 리본
    ctx.restore();
  }
}
class FCharm {
  //  매혹된 적 : 머리 위에서 뛰는 하트 + 주위를 도는 작은 하트
  constructor(e, life) { Object.assign(this, { e, life, t: 0, add: false }); }
  update() { this.t++; const e = this.e; if (!e.hittable()) return false; if (this.t % 12 === 0) FX.add('world', new FP(e.x + rand(-20, 20), sy(e.y, e.z + e.hurtH()), { kind: 'glow', col: CANDY, vy: -1, r: 4, life: 30 })); return this.t < this.life; }
  draw(ctx) {
    const e = this.e; if (!e.hittable()) return;
    const T = this.t, a = Math.min(1, T / 8, (this.life - T) / 8), X = e.x, Y = sy(e.y, e.z + e.hurtH()) - 34, beat = 1 + Math.max(0, Math.sin(T * 0.3)) * 0.25;
    ctx.save(); ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, 40, CANDY, 0.6); ctx.globalCompositeOperation = 'source-over';
    drawHeart(ctx, X, Y, 15 * beat, '#ff3d8f'); drawHeart(ctx, X - 3, Y - 3, 6 * beat, 'rgba(255,255,255,0.55)');
    for (let i = 0; i < 3; i++) { const g = T * 0.08 + i / 3 * TAU; drawHeart(ctx, X + Math.cos(g) * 30, Y + 18 + Math.sin(g) * 8, 5, '#ff8ac4'); }
    ctx.restore();
  }
}

// ============================================================
//  수호기사의 검 아이기스 : 빛의 방패 · 육각 방벽 요새
// ============================================================
const AEG = '190,215,255';
function drawKite(ctx, x, y, s, a, crest = true) {
  //  연(kite)형 기사 방패 + 십자 문장
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.beginPath(); ctx.moveTo(0, -60); ctx.quadraticCurveTo(44, -58, 46, -30); ctx.quadraticCurveTo(44, 30, 0, 70); ctx.quadraticCurveTo(-44, 30, -46, -30); ctx.quadraticCurveTo(-44, -58, 0, -60); ctx.closePath();
  const g = ctx.createLinearGradient(-46, -60, 46, 70); g.addColorStop(0, 'rgba(230,240,255,0.75)'); g.addColorStop(0.5, 'rgba(120,150,220,0.55)'); g.addColorStop(1, 'rgba(60,80,150,0.7)');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,240,190,0.95)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  if (crest) { ctx.fillStyle = 'rgba(255,236,170,0.95)'; ctx.fillRect(-5, -42, 10, 86); ctx.fillRect(-28, -16, 56, 10); ctx.beginPath(); ctx.arc(0, -11, 9, 0, TAU); ctx.fill(); }
  ctx.restore();
}
class FShieldCharge {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() { this.t++; return this.t < 30 && this.p.act && this.p.act.name === 'w25s5'; }
  draw(ctx) {
    const p = this.p, T = this.t, a = Math.min(1, T / 4) * (T > 20 ? 1 - (T - 20) / 10 : 1), X = p.x + p.facing * 70, Y = sy(p.y, p.z + 75);
    drawGlow(ctx, X, Y, 140, AEG, 0.45 * a);
    ctx.save(); ctx.translate(X, Y); ctx.scale(p.facing * 0.55, 1); drawKite(ctx, 0, 0, 1.1, a); ctx.restore();
    if (T > 7 && T < 16) { ctx.strokeStyle = `rgba(230,240,255,${0.7 * a})`; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const yy = Y - 70 + i * 28; ctx.beginPath(); ctx.moveTo(X - p.facing * 40, yy); ctx.lineTo(X - p.facing * (140 + i % 2 * 60), yy); ctx.stroke(); } }
  }
}
class FBastion {
  //  철벽 요새 : 플레이어를 감싸는 육각 방패 돔. 막을 때마다 패널이 빛나고 금이 쌓인다
  constructor(p) { Object.assign(this, { p, t: 0, add: false, hitT: 0, hx: 0, hy: 0 }); }
  ping(att) { this.hitT = 14; this.hx = att ? sign(att.x - this.p.x) || 1 : 1; }
  update() {
    this.t++; const p = this.p; if (this.hitT > 0) this.hitT--;
    if (this.t % 10 === 0) FX.add('world', new FP(p.x + rand(-100, 100), sy(p.y, rand(10, 200)), { kind: 'glow', col: AEG, vy: -0.6, r: 3, life: 30 }));
    if (p.absorbT <= 0 || p.hp <= 0) {
      const n = p.absorbN || 0, gy = sy(p.y, 0);
      Sfx.wlayer('knight', 3, true); Sfx.play('break', 0.8); Game.addShake(8 + n * 2); Game.flashScreen(0.3, '220,235,255'); Game.freeze(4);
      FF.impact(p.x, sy(p.y, 90), AEG, 1.6 + n * 0.1);
      FX.add('ground', new FRing(p.x, gy, 20, 340 + n * 30, 24, { col: AEG, w: 16 }));
      FX.add('ground', new FRing(p.x, gy, 10, 260 + n * 20, 30, { col: '255,240,190', w: 6 }));
      FF.spray('shard', p.x, sy(p.y, 90), 30 + n * 3, { col: AEG, v0: 6, v1: 16, grav: 0.25, l0: 26, l1: 46, r0: 5, r1: 10, rx: 60, ry: 60 });
      if (n) FX.add('top', new Label(p.x, gy - 230, `x${n} RETALIATE`, { col: ['#ffffff', '#ffe6a0'], size: 30, life: 50 }));
      WS.area(p, p.x, p.y, 320 + n * 25, 130, WS.hd({ dmg: 3 + n * 1.6, kx: 10, kz: 6, airKz: 6, stun: 60, stop: 8 + n, shake: 8, fx: 'heavy', power: 1.8 }));
      return false;
    }
    return true;
  }
  draw(ctx) {
    const p = this.p, T = this.t, X = p.x, gy = sy(p.y, 0), g = E.out3(Math.min(1, T / 12)), fade = Math.min(1, p.absorbT / 16), RX = 120 * g, RY = 175 * g, n = p.absorbN || 0;
    ctx.save(); ctx.globalAlpha = fade;
    ctx.globalCompositeOperation = 'lighter';
    const dome = ctx.createRadialGradient(X, gy - RY * 0.5, RX * 0.2, X, gy - RY * 0.5, RY);
    dome.addColorStop(0, `rgba(${AEG},0.02)`); dome.addColorStop(0.8, `rgba(${AEG},0.12)`); dome.addColorStop(1, `rgba(${AEG},0.35)`);
    ctx.fillStyle = dome; ctx.beginPath(); ctx.ellipse(X, gy, RX, RY, 0, Math.PI, TAU); ctx.ellipse(X, gy, RX, RX * 0.3, 0, 0, Math.PI); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(X, gy, RX, RY, 0, Math.PI, TAU); ctx.closePath(); ctx.clip();          // 육각 격자
    const S = 26; ctx.lineWidth = 1.4;
    for (let r = 0; r < 9; r++) for (let c = -6; c <= 6; c++) {
      const hx = X + c * S * 1.5, hy = gy - r * S * 1.73 - (c & 1) * S * 0.86 + (T * 0.4 % (S * 1.73)) * 0;
      const d = Math.hypot((hx - X) / RX, (hy - gy) / RY), lit = this.hitT > 0 && sign(hx - X) === this.hx ? this.hitT / 14 : 0, k = 0.25 + Math.max(0, d - 0.5) * 0.9 + lit * 0.8 + Math.max(0, Math.sin(T * 0.08 + c + r)) * 0.15;
      ctx.strokeStyle = `rgba(210,232,255,${Math.min(1, k)})`; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU; ctx.lineTo(hx + Math.cos(ang) * S * 0.92, hy + Math.sin(ang) * S * 0.92); } ctx.closePath(); ctx.stroke();
      if (lit > 0) { ctx.fillStyle = `rgba(255,245,200,${0.35 * lit})`; ctx.fill(); }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(235,245,255,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(X, gy, RX, RY, 0, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(${AEG},0.8)`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(X, gy, RX, RX * 0.3, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 4; i++) {                                     // 돔 둘레를 도는 방패 네 장
      const ang = T * 0.03 + i / 4 * TAU, front = Math.sin(ang) > 0, sx = X + Math.cos(ang) * RX * 1.02, syy = gy - 80 + Math.sin(ang) * 10;
      ctx.save(); ctx.globalAlpha = fade * (front ? 0.95 : 0.4); ctx.translate(sx, syy); ctx.scale(Math.max(0.15, Math.abs(Math.sin(ang))) * 0.42, 0.42); drawKite(ctx, 0, 0, 1, 1); ctx.restore();
    }
    for (let i = 0; i < Math.min(n, 12); i++) {                        // 막은 횟수 표시
      const x = X - 66 + (i % 6) * 26, y = gy - RY - 20 - (i / 6 | 0) * 22;
      ctx.save(); ctx.globalAlpha = fade; drawKite(ctx, x, y, 0.14, 1, false); ctx.restore();
    }
  }
}
Player.prototype.onAbsorb = function (att) {
  this.absorbN = (this.absorbN || 0) + 1;
  if (this.bastion) this.bastion.ping(att);
  const hx = this.x + (att ? (sign(att.x - this.x) || 1) * 110 : 0), hy = sy(this.y, 90);
  FX.add('top', new Label(this.x, sy(this.y, this.z) - 210, 'BLOCK', { col: ['#ffffff', '#9ac8ff'], size: 24, life: 40 }));
  FF.impact(hx, hy, AEG, 0.8);
  FF.spray('spark', hx, hy, 10, { col: '255,240,190', v0: 3, v1: 9, grav: 0.3, l0: 12, l1: 20, r0: 2, r1: 3 });
  Sfx.wlayer('knight', 2, true); Sfx.play('counter', 0.6, 1.2); Game.addShake(5); Game.freeze(2);
};

// ============================================================
//  카타콤 본블레이드 : 유령불 해골 · 뼈 용
// ============================================================
const BONE = '232,226,200', GHOST = '120,255,190';
function drawSkull(ctx, x, y, s, jaw, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#efe7cc'; ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -4, 16, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(10, 8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9, 8 + jaw); ctx.lineTo(9, 8 + jaw); ctx.lineTo(7, 15 + jaw); ctx.lineTo(-7, 15 + jaw); ctx.closePath(); ctx.fill(); ctx.stroke();   // 아래턱
  ctx.fillStyle = '#fffbe8'; for (let i = -2; i <= 2; i++) { ctx.fillRect(i * 3.6 - 1.4, 7, 2.8, 3.5); ctx.fillRect(i * 3.2 - 1.2, 6.5 + jaw, 2.4, 3); }
  ctx.fillStyle = '#12100a'; ctx.beginPath(); ctx.ellipse(-6, -3, 4.6, 5.4, 0.2, 0, TAU); ctx.ellipse(6, -3, 4.6, 5.4, -0.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-2, 6); ctx.lineTo(2, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, -18); ctx.lineTo(1, -11); ctx.lineTo(5, -8); ctx.stroke();   // 금
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${GHOST},1)`; ctx.beginPath(); ctx.arc(-6, -3, 2, 0, TAU); ctx.arc(6, -3, 2, 0, TAU); ctx.fill();
  drawGlow(ctx, -6, -3, 10, GHOST, 0.9); drawGlow(ctx, 6, -3, 10, GHOST, 0.9);
  ctx.restore();
}
class FSkullShot {
  constructor(p, x, y, z, vx, vy, vz) { Object.assign(this, { p, x, y, z, vx, vy, vz, t: 0, add: false }); }
  update() {
    this.t++; this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.z += this.vz; this.vz -= 0.3;
    FX.add('world', new FP(this.x - this.vx * 0.5, sy(this.y, this.z) + rand(-6, 6), { kind: 'flame', col: GHOST, vx: -this.vx * 0.15, vy: rand(-1.5, -0.5), r: rand(8, 12), life: 18, add: true }));
    for (const e of Game.enemies) if (e.hittable() && Math.abs(e.x - this.x) < 34 + e.w && Math.abs(e.y - this.y) < 36 && this.z < e.z + e.hurtH() + 20 && this.z > e.z - 20) { this.boom(); return false; }
    const r = Game.room;
    if (this.z <= 0 || this.x < r.minX - 40 || this.x > r.maxX + 40) { this.boom(); return false; }
    return true;
  }
  boom() {
    const p = this.p, X = this.x, Y = this.y, H = sy(Y, Math.max(20, this.z));
    FF.impact(X, H, GHOST, 1.1, { burst: '230,255,240' });
    FX.add('ground', new FRing(X, sy(Y, 0), 12, 210, 20, { col: GHOST, w: 10 }));
    FF.spray('bone', X, H, 12, { col: BONE, v0: 4, v1: 11, grav: 0.4, l0: 30, l1: 50, r0: 5, r1: 9 });
    FF.spray('flame', X, H, 14, { col: GHOST, v0: 2, v1: 7, l0: 16, l1: 30, r0: 8, r1: 14 });
    FF.spray('smoke', X, H, 6, { col: '60,90,80', v0: 1, v1: 3, r0: 20, r1: 34, l0: 30, l1: 50, grow: 0.4 });
    Sfx.wlayer('bone', 3, true); Sfx.play('break', 0.5, 1.2); Game.addShake(6);
    WS.area(p, X, Y, 190, 80, WH.bnSkull, { each: e => Status.add(e, 'shock', { t: 50 }) });
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(X, sy(this.y, 0), 16, 5, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, 56, GHOST, 0.45); ctx.restore();
    drawSkull(ctx, X, Y, 1.25, Math.abs(Math.sin(this.t * 0.6)) * 5, Math.sin(this.t * 0.3) * 0.3 * sign(this.vx));
  }
}

class FBoneWyrm {
  //  화면 반대편에서 날아드는 거대한 뼈 용 : 뿔 달린 해골 · 척추 · 갈비뼈 · 해진 유령막 날개
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, add: false, hits: new Map(), last: new Map() }); }
  update() {
    this.t++; this.x += this.dir * 17; const p = this.p;
    if (this.t % 2 === 0) FX.add('world', new FP(this.x - this.dir * rand(40, 420), sy(this.y + rand(-30, 30), rand(80, 200)), { kind: 'flame', col: GHOST, vx: -this.dir * 2, vy: rand(-1.5, -0.4), r: rand(10, 18), life: 26 }));
    if (this.t % 4 === 0) FX.add('world', new Debris(this.x - this.dir * rand(0, 300), this.y + rand(-30, 30), rand(40, 130), { vx: rand(-2, 2), vz: rand(2, 6), s: rand(2, 4), col: ['#e8e0c8', '#c8bea0', '#fffbe8'], life: 30 }));
    if (this.t % 12 === 0) Game.addShake(3);
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 140 || Math.abs(e.y - this.y) > 110) continue;
      const n = this.hits.get(e) || 0, last = this.last.get(e) ?? -99;
      if (n >= 4 || this.t - last < 5) continue;
      this.hits.set(e, n + 1); this.last.set(e, this.t);
      applyHit(p, e, WH.bnBite, { noStopAtt: true, dir: this.dir });
      if (n === 0) FX.add('world', new FSlash(e.x, sy(e.y, e.z + e.h * 0.5), this.dir > 0 ? 1.2 : -1.2, 70, { col: GHOST, th: 8, life: 14 }));
    }
    const r = Game.room;
    if ((this.dir < 0 && this.x < r.minX - 300) || (this.dir > 0 && this.x > r.maxX + 300) || this.t > 220) {
      const cx = clamp(Game.cam.x + W / 2, r.minX, r.maxX);
      Sfx.wlayer('bone', 3, true); Sfx.play('roar', 0.9, 0.6); Game.addShake(16); Game.flashScreen(0.35, '200,255,225'); Game.zoomPunch(1.05);
      FX.add('ground', new FRing(cx, sy(this.y, 0), 30, 600, 30, { col: GHOST, w: 18 }));
      FX.add('ground', new FRing(cx, sy(this.y, 0), 20, 460, 36, { col: BONE, w: 6 }));
      FF.screen({ kind: 'vig', col: '20,60,40', a: 0.5, life: 40, fin: 2, fout: 6 });
      for (const e of WS.onScreen()) { FF.spray('flame', e.x, sy(e.y, e.z + e.h * 0.5), 8, { col: GHOST, v0: 2, v1: 6, l0: 16, l1: 26 }); applyHit(p, e, WH.bnRoar, { noStopAtt: true, dir: sign(e.x - cx) || 1 }); }
      return false;
    }
    return true;
  }
  draw(ctx) {
    const d = this.dir, T = this.t, base = sy(this.y, 120);
    ctx.save(); ctx.translate(this.x, base); ctx.scale(d * 1.35, 1.35);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(-180, sy(this.y, 0) - base, 260, 22, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, -150, 0, 300, GHOST, 0.18, 1, 0.5); ctx.globalCompositeOperation = 'source-over';
    const sp = i => [-40 - i * 34, Math.sin(T * 0.25 - i * 0.5) * 18 + i * 1.5];
    const flap = Math.sin(T * 0.22);
    for (const back of [true, false]) {                              // 날개 (뒤 → 앞)
      const [wx, wy] = sp(3), up = (back ? 0.8 : 1) * (-90 - flap * 70);
      ctx.save(); ctx.translate(wx, wy); ctx.globalAlpha = back ? 0.55 : 1;
      const tips = [[-60, up - 60], [-130, up - 10], [-190, up + 50], [-220, up + 120]];
      ctx.fillStyle = 'rgba(70,140,110,0.35)'; ctx.beginPath(); ctx.moveTo(0, 0);
      for (const [tx, ty] of tips) ctx.lineTo(tx, ty);
      ctx.lineTo(-150, 30); ctx.lineTo(-90, 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(${GHOST},0.5)`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = '#e0d8bc'; ctx.lineCap = 'round';
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, up * 0.6); ctx.stroke();
      ctx.lineWidth = 3.5; for (const [tx, ty] of tips) { ctx.beginPath(); ctx.moveTo(-30, up * 0.6); ctx.lineTo(tx, ty); ctx.stroke(); }
      ctx.restore();
    }
    for (let i = 11; i >= 0; i--) {                                  // 꼬리 → 척추 · 갈비뼈
      const [x, y] = sp(i), s = i < 7 ? 1 : 1 - (i - 7) * 0.15;
      if (i >= 1 && i <= 5) { ctx.strokeStyle = '#d4cbab'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y + 40, x - 4, y + 66 - i * 4); ctx.stroke(); }
      ctx.fillStyle = '#ece4c8'; ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, 15 * s, 12 * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6 * s, y - 10 * s); ctx.lineTo(x + 2, y - 26 * s); ctx.lineTo(x + 6 * s, y - 9 * s); ctx.fill(); ctx.stroke();   // 등가시
    }
    const jaw = (Math.sin(T * 0.4) + 1) * 0.18;                      // 머리뼈
    ctx.save(); ctx.translate(-10, -6);
    ctx.fillStyle = '#e8e0c4'; ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 3;
    ctx.save(); ctx.rotate(jaw); ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(96, 18); ctx.lineTo(90, 30); ctx.lineTo(10, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fffbe8'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(24 + k * 10, 19); ctx.lineTo(28 + k * 10, 8); ctx.lineTo(32 + k * 10, 20); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#f2ecd6'; ctx.beginPath(); ctx.moveTo(-14, -26); ctx.quadraticCurveTo(50, -46, 112, -6); ctx.lineTo(104, 12); ctx.lineTo(12, 14); ctx.quadraticCurveTo(-22, 6, -14, -26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fffbe8'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(30 + k * 10, 12); ctx.lineTo(34 + k * 10, 24); ctx.lineTo(38 + k * 10, 12); ctx.fill(); }
    ctx.fillStyle = '#d8ceb0'; for (const [hx, hl] of [[0, 1], [16, 0.75]]) { ctx.beginPath(); ctx.moveTo(hx - 6, -26); ctx.quadraticCurveTo(hx - 50 * hl, -70 * hl, hx - 80 * hl, -62 * hl); ctx.quadraticCurveTo(hx - 40 * hl, -50 * hl, hx + 8, -24); ctx.fill(); ctx.stroke(); }   // 뿔
    ctx.fillStyle = '#100c08'; ctx.beginPath(); ctx.ellipse(44, -14, 13, 9, -0.25, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(96, -4, 4, 3, 0, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 44, -14, 40, GHOST, 1); ctx.fillStyle = `rgba(${GHOST},1)`; ctx.beginPath(); ctx.arc(46, -14, 4, 0, TAU); ctx.fill();
    for (let k = 0; k < 3; k++) drawGlow(ctx, 50 - k * 30, -16 - k * 4, 30 - k * 6, GHOST, 0.3);   // 눈에서 흐르는 유령불
    ctx.restore();
    ctx.restore();
  }
}

// ============================================================
//  음양검 태극 : 태극 회전 · 음양 영역 (팔괘 고리)
// ============================================================
const YANG = '255,215,130', YINC = '120,150,255';
const TRIGRAM = [[1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1], [1, 1, 0], [0, 1, 0], [1, 0, 0], [0, 0, 0]];
function drawTaegeuk(ctx, R, light, dark) {
  ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); ctx.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true); ctx.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2); ctx.fill();
  ctx.fillStyle = light; ctx.beginPath(); ctx.arc(0, R / 2, R * 0.13, 0, TAU); ctx.fill();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, -R / 2, R * 0.13, 0, TAU); ctx.fill();
}
class FTaegeukDisc {
  //  태극 회전 중 발밑에서 도는 태극 원판
  constructor(p) { Object.assign(this, { p, t: 0, add: false }); }
  update() { this.t++; return this.t < 62 && this.p.act && this.p.act.name === 'w27s5'; }
  draw(ctx) {
    const p = this.p, T = this.t, a = Math.min(1, T / 6, (62 - T) / 8), pull = ((T / 12) | 0) % 2 === 0, gy = sy(p.y, 0);
    ctx.save(); ctx.globalAlpha = a * 0.85; ctx.translate(p.x, gy); ctx.scale(1, 0.32);
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 230, pull ? YINC : YANG, 0.5); ctx.globalCompositeOperation = 'source-over';
    ctx.rotate(T * 0.25 * (pull ? -1 : 1)); drawTaegeuk(ctx, 130, 'rgba(255,248,230,0.75)', 'rgba(20,24,60,0.75)');
    ctx.strokeStyle = pull ? `rgba(${YINC},1)` : `rgba(${YANG},1)`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 130, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) {                                      // 팔괘
      ctx.save(); ctx.rotate(i / 8 * TAU); ctx.fillStyle = 'rgba(255,255,255,0.85)';
      TRIGRAM[i].forEach((b, k) => { const y = -158 - k * 10; if (b) ctx.fillRect(-16, y, 32, 6); else { ctx.fillRect(-16, y, 13, 6); ctx.fillRect(3, y, 13, 6); } });
      ctx.restore();
    }
    ctx.restore();
  }
}
class FYinYangField {
  //  음양 영역 : 양(불꽃 · 피해)과 음(냉기 · 회복). 끝에 두 영역이 가운데로 모여 거대한 태극이 되어 터진다
  constructor(p, x, y, yang, mid) { Object.assign(this, { p, x, y, x0: x, yang, mid, t: 0, life: 300, add: false }); }
  update() {
    this.t++; const p = this.p, c = this.yang ? YANG : YINC;
    if (this.t > 10 && this.t % 15 === 0 && this.t < this.life - 30) {
      if (this.yang) WS.area(p, this.x, this.y, 250, 110, WH.tgYang, { hmax: 200, each: e => Status.add(e, 'burn', { t: 90, d: p.atk * 0.12 }) });
      else {
        WS.area(p, this.x, this.y, 250, 110, WH.tgYin, { hmax: 200, each: e => Status.add(e, 'slow', { t: 40, m: 0.4 }) });
        if (Math.abs(p.x - this.x) < 250 && Math.abs(p.y - this.y) < 110) { Gear.heal(p, p.hpMax * 0.012, true); FF.spray('glow', p.x, sy(p.y, 40), 3, { col: YINC, ang: -Math.PI / 2, spread: 0.6, v0: 1, v1: 3 }); }
      }
    }
    if (this.t % 3 === 0 && this.t < this.life - 30) {
      const a = rand(0, TAU), r = rand(0, 230);
      FX.add('world', new FP(this.x + Math.cos(a) * r, sy(this.y + Math.sin(a) * r * 0.42, rand(0, 20)), this.yang ? { kind: 'flame', col: '255,170,70', vy: rand(-3, -1.5), r: rand(8, 14), life: 26 } : { kind: 'flake', col: '200,220,255', vy: rand(-1.2, -0.4), r: rand(4, 7), life: 40 }));
    }
    if (this.t > this.life - 30) this.x = lerp(this.x0, this.mid, E.in3((this.t - (this.life - 30)) / 30));
    if (this.t === this.life && this.yang) {
      const gy = sy(this.y, 0), X = this.mid;
      Sfx.wlayer('taegeuk', 3, true); Sfx.play('explode', 0.8); Game.addShake(12); Game.flashScreen(0.5, '255,255,255'); Game.freeze(4);
      FF.impact(X, gy - 60, '255,255,255', 2);
      FX.add('ground', new FRing(X, gy, 20, 420, 26, { col: YANG, w: 14 })); FX.add('ground', new FRing(X, gy, 20, 360, 32, { col: YINC, w: 14 }));
      FX.add('world', new FBeam(X, this.y, 120, 34, { col: '230,235,255', core: '255,255,255', h: 800 }));
      FF.spray('flame', X, gy - 40, 20, { col: '255,170,70', v0: 4, v1: 12, l0: 20, l1: 34 }); FF.spray('flake', X, gy - 40, 20, { col: '200,220,255', v0: 4, v1: 12, l0: 30, l1: 50 });
      WS.area(p, X, this.y, 460, 160, WH.tgBoom);
    }
    return this.t < this.life + 4;
  }
  draw(ctx) {
    const T = this.t, gy = sy(this.y, 0), g = E.out3(Math.min(1, T / 14)), merge = T > this.life - 30 ? (T - (this.life - 30)) / 30 : 0, a = T > this.life ? 0 : 1, c = this.yang ? YANG : YINC, R = 240 * g * (1 - merge * 0.4);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(this.x, gy); ctx.scale(1, 0.42);
    ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.15); gg.addColorStop(0, `rgba(${c},0.35)`); gg.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, R * 1.15, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.rotate(T * 0.03 * (this.yang ? 1 : -1) * (1 + merge * 6));
    ctx.globalAlpha = a * 0.7;
    if (this.yang) drawTaegeuk(ctx, R * 0.7, 'rgba(255,250,225,0.9)', 'rgba(220,120,40,0.75)'); else drawTaegeuk(ctx, R * 0.7, 'rgba(200,215,255,0.85)', 'rgba(16,20,60,0.85)');
    ctx.globalAlpha = a;
    ctx.strokeStyle = `rgba(${c},0.95)`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, R * 0.7, 0, TAU); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.rotate(i / 8 * TAU); ctx.fillStyle = `rgba(${this.yang ? '255,240,200' : '220,230,255'},0.9)`;
      TRIGRAM[i].forEach((b, k) => { const y = -R * 0.78 - k * 11; if (b) ctx.fillRect(-20, y, 40, 7); else { ctx.fillRect(-20, y, 16, 7); ctx.fillRect(4, y, 16, 7); } });
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }
}

// ============================================================
//  마법검 아케인 : 유도 마력탄 · 마력 폭주
// ============================================================
const ARC = '170,140,255';
class FArcaneBolt {
  constructor(p, x, y, z, vx, vy, vz, delay) { Object.assign(this, { p, x, y, z, vx, vy, vz, t: -delay, tr: [], add: true, tg: null }); }
  update() {
    this.t++; if (this.t < 0) return true;
    const p = this.p;
    if (!this.tg || !this.tg.hittable()) this.tg = WS.nearest(this.x, this.y, 1, 900)[0] || null;
    if (this.tg && this.t > 6) {
      const e = this.tg, tz = e.z + e.h * 0.5, k = Math.min(0.2, 0.05 + this.t * 0.006);
      this.vx = lerp(this.vx, sign(e.x - this.x) * 16, k); this.vy = lerp(this.vy, clamp((e.y - this.y) * 0.2, -10, 10), k); this.vz = lerp(this.vz, clamp((tz - this.z) * 0.2, -10, 10), k);
    }
    this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.z = Math.max(10, this.z + this.vz);
    this.tr.push([this.x, sy(this.y, this.z)]); if (this.tr.length > 12) this.tr.shift();
    if (this.t % 3 === 0) FX.add('world', new FP(this.x, sy(this.y, this.z), { kind: 'rune', col: ARC, vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5), r: 5, life: 18 }));
    for (const e of Game.enemies) if (e.hittable() && Math.abs(e.x - this.x) < 30 + e.w && Math.abs(e.y - this.y) < 34 && Math.abs(this.z - (e.z + e.h * 0.5)) < e.h * 0.7) {
      const H = sy(e.y, e.z + e.h * 0.5);
      FF.impact(e.x, H, ARC, 0.8, { burst: '230,220,255' });
      FX.add('world', new FCircle(e.x, e.y, 50, 20, { kind: 'star', col: ARC, up: e.z + e.h * 0.5, ry: 1, grow: 4 }));
      FF.spray('star', e.x, H, 6, { col: '220,200,255', v0: 2, v1: 6, l0: 14, l1: 24 });
      Sfx.wlayer('arcane', 1, false);
      applyHit(p, e, WH.arMissile, { noStopAtt: true, dir: sign(this.vx) || 1 });
      return false;
    }
    return this.t < 150;
  }
  draw(ctx) {
    if (this.t < 0 || !this.tr.length) return;
    const tr = this.tr, [X, Y] = tr[tr.length - 1];
    ctx.lineCap = 'round';
    for (const [w, c] of [[14, `rgba(${ARC},0.25)`], [6, `rgba(${ARC},0.7)`], [2, 'rgba(255,255,255,0.95)']]) {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); tr.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    }
    drawGlow(ctx, X, Y, 46, ARC, 0.8);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(this.t * 0.3); ctx.fillStyle = '#ffffff';
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 13, a = i / 8 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill();
    ctx.restore();
  }
}
class FOverload {
  //  아케인 오버로드 : 몸 주위를 도는 세 겹 룬 고리 + 떠다니는 마도서 페이지 + 머리 위 마력 왕관
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p; if (p.overT <= 0 || p.hp <= 0) return false;
    for (const k in p.cd) if (k !== 's6') p.cd[k] = 0; p.mp = p.mpMax;
    if (this.t % 5 === 0) FX.add('world', new FP(p.x + rand(-60, 60), sy(p.y, rand(0, 160)), { kind: 'rune', col: chance(0.5) ? ARC : '255,255,255', vy: rand(-2.4, -1), r: rand(5, 8), life: 34 }));
    return true;
  }
  draw(ctx) {
    const p = this.p, T = this.t, fade = Math.min(1, p.overT / 20, T / 10), X = p.x, Y = sy(p.y, p.z + 80);
    ctx.save(); ctx.globalAlpha = fade;
    drawGlow(ctx, X, Y, 170, ARC, 0.22 + Math.sin(T * 0.3) * 0.06, 1, 1.1);
    for (let k = 0; k < 3; k++) {                                       // 기울어진 룬 고리 세 개
      ctx.save(); ctx.translate(X, Y); ctx.rotate([-0.5, 0.4, 0][k]); ctx.scale(1, 0.3);
      const R = 90 + k * 14; ctx.strokeStyle = `rgba(${ARC},0.7)`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(240,230,255,0.95)';
      for (let i = 0; i < 10; i++) { const a = T * (0.04 + k * 0.015) * (k % 2 ? -1 : 1) + i / 10 * TAU; ctx.save(); ctx.translate(Math.cos(a) * R, Math.sin(a) * R); ctx.rotate(a); ctx.fillRect(-1.5, -6, 3, 12); ctx.fillRect(-4, -1.5, 8, 3); ctx.restore(); }
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) {                                       // 마도서 페이지
      const a = T * 0.03 + i / 4 * TAU, px = X + Math.cos(a) * 130, py = Y - 20 + Math.sin(a) * 30 + Math.sin(T * 0.1 + i) * 8;
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(T * 0.05 + i) * 0.4); ctx.scale(Math.max(0.2, Math.abs(Math.cos(a))), 1);
      ctx.fillStyle = 'rgba(245,235,255,0.85)'; ctx.fillRect(-12, -16, 24, 32); ctx.strokeStyle = `rgba(${ARC},0.9)`; ctx.lineWidth = 1;
      for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(-8, -10 + l * 5); ctx.lineTo(8 - (l % 2) * 4, -10 + l * 5); ctx.stroke(); }
      ctx.restore();
    }
    const cy = sy(p.y, p.z + 200) + Math.sin(T * 0.1) * 4;              // 마력 왕관
    ctx.fillStyle = 'rgba(220,200,255,0.9)'; ctx.beginPath(); ctx.moveTo(X - 26, cy + 10);
    for (let i = 0; i <= 4; i++) { ctx.lineTo(X - 26 + i * 13, cy - (i % 2 ? 4 : 18)); if (i < 4) ctx.lineTo(X - 26 + i * 13 + 6.5, cy); }
    ctx.lineTo(X + 26, cy + 10); ctx.closePath(); ctx.fill(); drawGlow(ctx, X, cy, 50, ARC, 0.6);
    ctx.restore();
  }
}

Object.assign(WH, {
  cdBomb: WS.hd({ dmg: 2.5, kx: 6, kz: 8, airKz: 7, stun: 40, stop: 6, shake: 6, fx: 'blunt', power: 1.4 }),
  cdSweet: WS.hd({ dmg: 12, kx: 6, kz: 9, airKz: 8, stun: 60, stop: 10, shake: 10, fx: 'heavy', power: 2 }),
  agBash: WS.hd({ dmg: 4.5, kx: 15, kz: 4, airKz: 5, stun: 70, stop: 8, shake: 9, fx: 'heavy', power: 1.8 }),
  bnSkull: WS.hd({ dmg: 4.8, kx: 6, kz: 8, airKz: 7, stun: 60, stop: 7, shake: 7, fx: 'blunt', power: 1.5 }),
  bnBite: WS.hd({ dmg: 3.2, kx: 7, kz: 6, airKz: 6, stun: 40, stop: 4, shake: 5, fx: 'heavy', power: 1.4 }),
  bnRoar: WS.hd({ dmg: 9, kx: 10, kz: 10, airKz: 9, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2 }),
  tgSpin: WS.hd({ dmg: 1.4, kx: 0, airKz: 1, stun: 14, stop: 1, shake: 1.5, fx: 'slash' }),
  tgYang: WS.hd({ dmg: 1.3, kx: 0, airKz: 1, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  tgYin: WS.hd({ dmg: 0.8, kx: 0, airKz: 0.5, stun: 8, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  tgBoom: WS.hd({ dmg: 8, kx: 8, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.6 }),
  arMissile: WS.hd({ dmg: 2.4, kx: 2, airKz: 3, stun: 26, stop: 3, shake: 2, fx: 'none', power2: 1 }),
});

// ============================================================
//  스킬 정의
// ============================================================
forgeDef('w24', {
  name: '설탕 폭탄', mp: 120, cd: 8, ico: ['candybomb', CANDY],
  desc: '줄무늬 포장 사탕 폭탄 세 개를 던진다. 적에게 달라붙어 깜빡이다가 사탕 파편과 별가루로 터지고, 바닥에 끈적한 시럽을 남겨 주변을 느리게 만든다.',
  act: {
    anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('candy', 2, false);
        [-2.4, 0, 2.4].forEach((vy, i) => FX.add('world', new FCandyBomb(p, p.x + p.facing * 40, p.y, p.z + 80, p.facing * (9 + i), vy, 4 + i * 0.6, [0, 1, 2][i])));
        FF.spray('star', p.x + p.facing * 40, sy(p.y, 90), 8, { col: CANDY, ang: p.facing > 0 ? -0.4 : Math.PI + 0.4, spread: 0.6, v0: 3, v1: 7 });
      }
    },
  },
}, {
  name: '매혹의 단맛', mp: 480, cd: 42, ico: ['heartcandy', CANDY],
  desc: '뒤편에 거대한 소용돌이 롤리팝이 솟고 분홍 안개가 깔린다. 화면 안의 모든 적이 하트에 매혹되어 3초간 꼼짝 못 하고(보스는 느려짐), 그동안 HP를 15% 회복한다. 매혹이 풀리는 순간 달콤하게 터진다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '매혹의 단맛', '甘 美 魅 惑', CANDY, { bars: 60, dim: 0.3 }); p.invul = 100; p.vx = 0; },
    update(p, f) {
      if (f === 10) {
        FX.add('world', new FLollipop(p, p.x - p.facing * 120, Math.max(0, p.y - 30)));
        FF.screen({ kind: 'vig', col: '255,120,190', a: 0.35, life: 190, fin: 20, fout: 6 });
        Game.flashScreen(0.3, '255,200,230'); Sfx.wlayer('candy', 3, true); p.bladeGlow = 2; Gear.heal(p, p.hpMax * 0.15);
        FF.spray('glow', p.x, sy(p.y, 60), 16, { col: '255,180,220', ang: -Math.PI / 2, spread: 1, v0: 1, v1: 4 });
        for (const e of WS.onScreen()) {
          Status.add(e, 'shock', { t: 180 }); FX.add('world', new FCharm(e, 182));
          FX.add('world', new FP(p.x, sy(p.y, 120), { kind: 'glow', col: CANDY, tx: e.x, ty: sy(e.y, e.z + e.hurtH()), pull: 0.12, r: 8, life: 26 }));
        }
        forgeUndim(30);
        Gear.later(185, () => {
          Sfx.wlayer('candy', 3, true); Sfx.play('explode', 0.6, 1.3); Game.addShake(10); Game.flashScreen(0.4, '255,210,235');
          for (const e of WS.onScreen()) {
            const X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
            FF.impact(X, Y, CANDY, 1.2);
            FF.spray('candy', X, Y, 8, { col: choose(CANDY_COLS), v0: 4, v1: 10, grav: 0.4, l0: 30, l1: 46, r0: 5, r1: 8 });
            applyHit(p, e, WH.cdSweet, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
          }
        });
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w25', {
  name: '방패 강타', mp: 110, cd: 8, ico: ['shieldbash', AEG],
  desc: '빛의 연(鳶)형 방패를 앞세워 돌진하며 들이받는다. 방패에 부딪힌 적은 크게 밀려나고 기절한다.',
  act: {
    anim: 'a3', len: 36, cancel: 26, atkCancel: 22,
    start(p) { FX.add('world', new FShieldCharge(p)); },
    update(p, f) {
      if (f < 8) { p.vx = 0; p.bladeGlow = 0.5; }
      if (f === 8) { Sfx.pplay('swingBig'); Sfx.wlayer('knight', 2, false); p.afterOn = 6; }
      if (f >= 8 && f < 14) { p.vx = p.facing * 17; p.armorF = true; if (f % 2 === 0) FF.spray('smoke', p.x, sy(p.y, 6), 2, { col: '200,200,210', v0: 1, v1: 2, r0: 12, r1: 18, l0: 20, l1: 30, grow: 0.3 }); }
      if (f === 12) {
        const X = p.x + p.facing * 100;
        swingT(p, 'a4', 1.8); Game.addShake(9); Game.freeze(4); Sfx.wlayer('knight', 3, true); Sfx.play('thud', 0.8);
        FF.impact(X, sy(p.y, 70), AEG, 1.3, { burst: '255,240,190' });
        FX.add('ground', new FRing(X, sy(p.y, 0), 20, 220, 18, { col: AEG, w: 10 }));
        FF.spray('spark', X, sy(p.y, 70), 14, { col: '255,240,190', ang: p.facing > 0 ? 0 : Math.PI, spread: 0.8, v0: 5, v1: 12, grav: 0.3, l0: 12, l1: 20 });
        WS.area(p, X, p.y, 170, 80, WH.agBash, { each: e => Status.add(e, 'shock', { t: 50 }) });
      }
    },
  },
}, {
  name: '철벽 요새', mp: 480, cd: 42, ico: ['fortress', AEG],
  desc: '4초 동안 육각 방패 돔을 세운다. 어떤 공격도 막아내고, 막을 때마다 돔이 빛나며 방패 문장이 하나씩 쌓인다. 끝나는 순간 돔이 산산이 부서지며 쌓인 만큼 큰 충격파가 터진다.',
  act: {
    anim: 'drawReady', len: 40, cancel: 30, atkCancel: 24,
    start(p) { forgeCine(p, '철벽 요새', '鐵 壁 要 塞', AEG, { bars: 40, dim: 0.3 }); p.invul = 40; p.vx = 0; },
    update(p, f) {
      if (f === 8) {
        p.absorbT = 240; p.absorbN = 0; p.bladeGlow = 2; Sfx.wlayer('knight', 3, false); Sfx.play('counter', 0.6, 0.7); Game.flashScreen(0.2, '210,230,255'); Game.addShake(6);
        p.bastion = new FBastion(p); FX.add('world', p.bastion);
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 200, 20, { col: AEG, w: 10 }));
        FX.add('ground', new FCircle(p.x, p.y, 150, 250, { kind: 'hex', col: AEG, col2: '255,240,190', follow: p, spin: 0.01 }));
        forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w26', {
  name: '해골 투척', mp: 120, cd: 8, ico: ['skull', BONE],
  desc: '눈에 유령불이 타오르는 해골 두 개를 던진다. 해골은 이를 딱딱거리며 날아가 적에게 닿는 순간 뼛조각과 유령불로 터지고 주변 적이 기절한다.',
  act: {
    anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('bone', 2, false); Sfx.play('roar', 0.25, 1.8);
        for (const vy of [-1.6, 1.6]) FX.add('world', new FSkullShot(p, p.x + p.facing * 40, p.y, p.z + 80, p.facing * 13, vy, 3));
      }
    },
  },
}, {
  name: '뼈 용의 포효', mp: 480, cd: 42, ico: ['bonedragon', BONE],
  desc: '화면 반대편에서 뿔 달린 거대한 뼈 용이 해진 유령막 날개를 펄럭이며 날아든다. 길을 막는 모든 적을 물어뜯고, 끝에서 유령불 포효로 화면을 뒤흔든다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '뼈 용의 포효', '骨 龍 咆 哮', BONE, { bars: 70, dim: 0.4 }); p.invul = 120; p.vx = 0; },
    update(p, f) {
      if (f === 12) {
        const r = Game.room, dir = -p.facing, sx = dir < 0 ? Math.min(r.maxX + 260, Game.cam.x + W + 300) : Math.max(r.minX - 260, Game.cam.x - 300);
        FX.add('world', new FBoneWyrm(p, sx, clamp(p.y, 40, DEPTH - 40), dir));
        Sfx.play('roar', 0.8, 0.6); Sfx.wlayer('bone', 3, true); Game.flashScreen(0.25, '200,255,225'); Game.addShake(8); p.bladeGlow = 2;
        FF.screen({ kind: 'vig', col: '10,40,30', a: 0.4, life: 100, fin: 10, fout: 6 });
      }
      if (f === 40) forgeUndim(20);
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w27', {
  name: '태극 회전', mp: 140, cd: 9, ico: ['taegeuk', '230,235,255'],
  desc: '발밑에 팔괘가 새겨진 태극 원판을 펼치고 회전한다. 0.2초마다 음(푸른빛 · 적을 끌어당김)과 양(금빛 · 적을 밀어냄)이 번갈아 바뀌며 주변 적을 계속 벤다.',
  act: {
    anim: 'a1', len: 60, cancel: 50, atkCancel: 50,
    start(p) { Sfx.pplay('swingBig'); p.bladeGlow = 1.2; FX.add('ground', new FTaegeukDisc(p)); },
    update(p, f) {
      p.armorF = f < 52; p.trailOn = f < 54; p.vx *= 0.7;
      if (f % 8 === 1) { swingT(p, (f / 8 | 0) % 2 ? 'a2' : 'a1', 1.9); Sfx.pplay('swing', 0.8, 1 + f * 0.004); }
      const pull = ((f / 12) | 0) % 2 === 0, c = pull ? YINC : YANG;
      if (f % 12 === 0 && f < 54) Sfx.wlayer('taegeuk', 1, false);
      if (f % 4 === 0 && f < 54) {
        for (const e of Game.enemies) { if (!e.hittable() || e.isBoss) continue; const dx = e.x - p.x; if (Math.abs(dx) < 260 && Math.abs(e.y - p.y) < 90) { e.x += (pull ? -dx : dx) * 0.14; e.y += (p.y - e.y) * 0.05; } }
        FX.add('ground', new FRing(p.x, sy(p.y, 0), pull ? 200 : 40, pull ? 40 : 210, 14, { col: c, w: 6 }));
        for (let i = 0; i < 2; i++) { const a = rand(0, TAU); FX.add('world', new FP(p.x + Math.cos(a) * 200, sy(p.y + Math.sin(a) * 70, rand(20, 120)), pull ? { kind: 'glow', col: c, tx: p.x, ty: sy(p.y, 70), pull: 0.12, r: 4, life: 16 } : { kind: 'glow', col: c, vx: Math.cos(a) * 6, vy: Math.sin(a) * 2, r: 4, life: 16 })); }
      }
      if (f % 6 === 0 && f < 54) {
        WS.area(p, p.x, p.y, 170, 70, WH.tgSpin, { hmax: 170 });
        const g = f * 0.6, Y = sy(p.y, p.z + 70);
        FX.add('world', new FSlash(p.x + Math.cos(g) * 60, Y + Math.sin(g) * 18, g + Math.PI / 2, 110, { col: c, th: 10, bend: 0.3, life: 12, sparks: false }));
      }
    },
  },
}, {
  name: '음양 영역', mp: 480, cd: 42, ico: ['yinyang', '230,235,255'],
  desc: '좌우에 팔괘 고리가 두른 양(불꽃)과 음(눈송이)의 영역을 5초간 펼친다. 양은 적을 태우고, 음은 적을 느리게 하며 내 HP를 회복시킨다. 끝에는 두 영역이 가운데로 모여 하나의 태극이 되어 터진다.',
  act: {
    anim: 'ultUp', len: 50, cancel: 40, atkCancel: 34,
    start(p) { forgeCine(p, '음양 영역', '陰 陽 領 域', '230,235,255', { bars: 60, dim: 0.35 }); p.invul = 90; p.vx = 0; },
    update(p, f) {
      if (f === 12) {
        const r = Game.room, lx = clamp(p.x - 270, r.minX + 120, r.maxX - 120), rx = clamp(p.x + 270, r.minX + 120, r.maxX - 120), mid = (lx + rx) / 2;
        FX.add('ground', new FYinYangField(p, lx, p.y, true, mid)); FX.add('ground', new FYinYangField(p, rx, p.y, false, mid));
        Sfx.wlayer('taegeuk', 3, true); Game.addShake(8); p.bladeGlow = 2; Game.flashScreen(0.3, '240,245,255');
        FF.impact(lx, sy(p.y, 40), YANG, 1); FF.impact(rx, sy(p.y, 40), YINC, 1);
        forgeUndim(24);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w28', {
  name: '마나 미사일', mp: 130, cd: 8, ico: ['missiles', ARC],
  desc: '등 뒤에 마법진을 펼쳐 별 모양 마력탄 다섯 발을 차례로 쏜다. 마력탄은 빛의 꼬리를 그리며 가까운 적을 쫓아가 별무늬를 남기며 터진다.',
  act: {
    anim: 'a2', len: 34, cancel: 20, atkCancel: 16,
    start(p) { FX.add('world', new FCircle(p.x - p.facing * 30, p.y, 80, 40, { kind: 'star', col: ARC, up: 110, ry: 1, grow: 6, spin: 0.06 })); Sfx.wlayer('arcane', 1, false); },
    update(p, f) {
      p.vx *= 0.6;
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('arcane', 3, true);
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i - 2) * 0.45;
          FX.add('world', new FArcaneBolt(p, p.x - p.facing * 30, p.y, p.z + 110, Math.cos(a) * 6 * p.facing + p.facing * 2, (i - 2) * 1.2, -Math.sin(a) * 6, i * 3));
        }
      }
    },
  },
}, {
  name: '아케인 오버로드', mp: 480, cd: 42, ico: ['overload', ARC],
  desc: '5초 동안 마력이 폭주한다. 몸 주위로 룬 고리와 마도서 페이지가 돌고 머리 위에 마력 왕관이 뜬다. 각성기를 뺀 모든 스킬의 쿨타임이 사라지고 MP가 바닥나지 않으며, 내 피해가 30% 늘어난다.',
  act: {
    anim: 'ultUp', len: 50, cancel: 36, atkCancel: 30,
    start(p) { forgeCine(p, '아케인 오버로드', 'O V E R L O A D', ARC, { bars: 40, dim: 0.35 }); p.invul = 80; p.vx = 0; },
    update(p, f) {
      if (f === 10) {
        p.overT = 300; p.bladeGlow = 2.5; Sfx.wlayer('arcane', 3, true); Game.flashScreen(0.3, '200,180,255'); Game.addShake(6);
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 320, 24, { col: ARC, w: 12 }));
        FX.add('ground', new FCircle(p.x, p.y, 170, 300, { kind: 'hex', col: ARC, follow: p, spin: 0.02 }));
        FX.add('world', new FOverload(p));
        FF.spray('rune', p.x, sy(p.y, 80), 20, { col: ARC, v0: 3, v1: 9, l0: 20, l1: 40 });
        forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});
