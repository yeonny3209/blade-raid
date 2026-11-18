'use strict';
// ============================================================
//  검의 대장간 4 : w18 무라사메 · w19 쏜베인 · w20 다이스 · w21 블랙펄 · w22 스팀하트 · w23 라 솔레이
// ============================================================

// ============================================================
//  거합도 무라사메 : 숨을 고르는 일섬 · 고요한 수면 위의 무념무상
// ============================================================
const IAI = '225,238,255';
class FStillWater {
  //  무념무상 : 발밑에 고요한 수면 · 천천히 번지는 물결 · 떨어지는 꽃잎
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p;
    if (!(p.stanceT > 0) || p.hp <= 0) return false;
    if (this.t % 9 === 0) FX.add('world', new FP(p.x + rand(-160, 160), sy(p.y, rand(160, 260)), { kind: 'petal', col: '255,225,235', vx: rand(-0.6, 0.2), vy: rand(0.6, 1.2), wob: 0.04, r: rand(4, 6), life: 90 }));
    return true;
  }
  draw(ctx) {
    const p = this.p, gy = sy(p.y, 0), T = this.t, a = Math.min(1, T / 12, p.stanceT / 20);
    ctx.save();
    const g = ctx.createRadialGradient(p.x, gy, 10, p.x, gy, 170); g.addColorStop(0, `rgba(${IAI},${0.18 * a})`); g.addColorStop(1, `rgba(${IAI},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, gy, 170, 50, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 3; i++) { const k = ((T * 0.012) + i / 3) % 1; ctx.strokeStyle = `rgba(${IAI},${0.6 * a * (1 - k)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, gy, 30 + k * 160, (30 + k * 160) * 0.28, 0, 0, TAU); ctx.stroke(); }
    drawGlow(ctx, p.x, sy(p.y, p.z + 70), 110, IAI, 0.15 * a, 1, 1.2);
    ctx.restore();
  }
}

// 무념무상 반격 : 세상이 한순간 하얗게 멈추고 가로로 갈라진다
Player.prototype.onStance = function (att) {
  this.stanceN = (this.stanceN || 0) + 1; this.invul = Math.max(this.invul, 14);
  const X = this.x, Y = sy(this.y, 70);
  FX.add('top', new Label(X, sy(this.y, this.z) - 170, 'COUNTER', { col: ['#ffffff', '#9ad0ff'], size: 28 }));
  FX.add('world', new FSlash(X + this.facing * 120, Y, 0, 420, { col: IAI, core: '255,255,255', th: 9, bend: 0, dark: '10,16,30', life: 20 }));
  FX.add('ground', new FRing(X, sy(this.y, 0), 20, 240, 18, { col: IAI, w: 8 }));
  FF.screen({ kind: 'bars', a: 1, life: 16, fin: 2, fout: 8 }); FF.spray('petal', X, Y, 10, { col: '255,225,235', v0: 3, v1: 9, wob: 0.05, l0: 30, l1: 50 });
  Sfx.play('counter'); Sfx.wlayer('katana', 3, true); Game.freeze(5); Game.addShake(8);
  swingT(this, this.stanceN % 2 ? 'a3' : 'a2', 1.8);
  const tg = att && att.hittable && att.hittable() ? att : null;
  if (tg) { this.facing = sign(tg.x - this.x) || this.facing; applyHit(this, tg, WH.iaCounter, { noStopAtt: true, dir: this.facing }); }
  WS.area(this, this.x, this.y, 230, 90, WH.iaCounter);
  if (this.stanceN >= 6) this.stanceT = 0;
};

// ============================================================
//  덩굴검 쏜베인 : 가시 덩굴 · 세계수
// ============================================================
const LEAF = '150,230,90';
class FVine {
  //  땅을 뚫고 나와 대상의 몸을 휘감아 오르는 가시 덩굴 (e 가 없으면 허공으로 솟는다)
  constructor(x, y, o = {}) { Object.assign(this, { x, y, t: 0, add: false, life: o.life || 56, e: o.e, n: o.n || 3, h: o.h || 130, seed: randi(1, 9999) }); }
  update() { this.t++; if (this.t === 2) FF.spray('bit', this.x, sy(this.y, 4), 6, { col: '110,80,40', ang: -Math.PI / 2, spread: 1, v0: 2, v1: 6, grav: 0.3 }); if (this.e && this.e.hittable() && this.t < this.life - 12) { this.x = lerp(this.x, this.e.x, 0.3); this.y = lerp(this.y, this.e.y, 0.3); } return this.t < this.life; }
  draw(ctx) {
    const T = this.t, u = T / this.life, grow = E.out3(Math.min(1, T / 12)), a = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1, gy = sy(this.y, 0), R = mulberry(this.seed);
    const H = (this.e ? Math.min(this.h, this.e.hurtH() + 20) : this.h) * grow, W = this.e ? this.e.w + 14 : 26;
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(40,24,10,0.6)'; ctx.beginPath(); ctx.ellipse(this.x, gy, W + 20, 9, 0, 0, TAU); ctx.fill();   // 뚫린 흙
    for (let s = 0; s < this.n; s++) {
      const ph = s / this.n * TAU + R() * 0.5, pts = [];
      for (let k = 0; k <= 22; k++) { const q = k / 22, ang = ph + q * 9 + T * 0.04, r = W * (1 - q * 0.35) * (this.e ? 1 : 0.4); pts.push([this.x + Math.cos(ang) * r, gy - q * H + Math.sin(ang) * r * 0.25, Math.sin(ang) > 0, q]); }
      for (const [w, c] of [[9, '#1c3a10'], [5, '#4a9a28'], [1.6, '#a8e070']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w;
        for (let k = 1; k < pts.length; k++) { const [x0, y0] = pts[k - 1], [x1, y1, front, q] = pts[k]; if (!front && w < 5) continue; ctx.lineWidth = w * (1 - q * 0.5); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      }
      ctx.fillStyle = '#e8f8b0';                                  // 가시
      for (let k = 2; k < pts.length; k += 3) { const [x, y, front] = pts[k]; if (!front) continue; const d = k % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + d * 9, y - 7); ctx.lineTo(x, y + 2); ctx.fill(); }
      ctx.fillStyle = '#5ab83a';                                  // 잎
      for (let k = 4; k < pts.length; k += 6) { const [x, y] = pts[k]; ctx.save(); ctx.translate(x, y); ctx.rotate(R() * TAU); ctx.beginPath(); ctx.ellipse(6, 0, 7, 3.2, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    ctx.restore();
  }
}

class FWorldTree {
  constructor(p, x, y) { Object.assign(this, { p, x, y, t: 0, life: 440, add: false, seed: randi(1, 9999) }); this.br = []; this.build(); }
  build() {                                                       // 재귀 가지 (상대 좌표)
    const R = mulberry(this.seed), add = (x, y, ang, len, w, d) => {
      const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len; this.br.push({ x, y, x1, y1, w, d });
      if (d < 4) for (const s of [-1, 1]) add(x1, y1, ang + s * (0.35 + R() * 0.35), len * (0.66 + R() * 0.12), w * 0.62, d + 1);
      else this.br.push({ leaf: true, x: x1, y: y1, r: 34 + R() * 26, c: R() });
    };
    add(0, 0, -Math.PI / 2, 150, 40, 0);
  }
  update() {
    this.t++;
    const p = this.p;
    if (this.t > 20 && this.t % 15 === 0) {
      WS.area(p, this.x, this.y, 430, 160, WH.tvThorn, { hmax: 200, each: e => Status.add(e, 'slow', { t: 40, m: 0.5 }) });
      if (Math.abs(p.x - this.x) < 430 && Math.abs(p.y - this.y) < 160) Gear.heal(p, p.hpMax * 0.009, true);
    }
    if (this.t > 20 && this.t % 4 === 0) FX.add('world', new FP(this.x + rand(-260, 260), sy(this.y, rand(220, 420)), { kind: chance(0.6) ? 'leaf' : 'petal', col: chance(0.6) ? '120,200,90' : '255,180,210', vx: rand(-0.8, 0.4), vy: rand(0.6, 1.4), wob: 0.05, r: rand(4, 7), life: 120 }));
    if (this.t > 20 && this.t % 6 === 0) FX.add('world', new FP(this.x + rand(-380, 380), sy(this.y + rand(-120, 120), rand(10, 120)), { kind: 'glow', col: '200,255,140', vx: rand(-0.4, 0.4), vy: rand(-0.6, -0.1), wob: 0.08, r: rand(3, 5), life: 60 }));
    if (this.t === 30) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; FX.add('world', new FVine(this.x + Math.cos(a) * rand(200, 400), clamp(this.y + Math.sin(a) * 120, 0, DEPTH), { life: 400, n: 2, h: rand(60, 110) })); }
    if (this.t === this.life) {
      Sfx.wlayer('thorn', 3, true); Game.addShake(10); Game.flashScreen(0.3, '255,220,235');
      FX.add('ground', new FRing(this.x, sy(this.y, 0), 30, 480, 26, { col: '255,180,210', w: 16 }));
      FF.spray('petal', this.x, sy(this.y, 300), 60, { col: '255,180,210', v0: 3, v1: 12, wob: 0.05, grav: 0.05, l0: 50, l1: 80, rx: 200, ry: 80 });
      WS.area(p, this.x, this.y, 460, 170, WH.tvBloom);
      Gear.heal(p, p.hpMax * 0.1);
    }
    return this.t < this.life + 6;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), g = E.out3(Math.min(1, this.t / 24)), end = this.t > this.life - 20 ? (this.life - this.t) / 20 : 1, a = Math.max(0, end), X = this.x;
    ctx.save(); ctx.globalAlpha = a;
    const gg = ctx.createRadialGradient(X, gy, 20, X, gy, 430 * g); gg.addColorStop(0, 'rgba(60,120,40,0.45)'); gg.addColorStop(1, 'rgba(60,120,40,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(X, gy, 430 * g, 160 * g, 0, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    for (const b of this.br) if (!b.leaf) {                       // 줄기 · 가지 (깊이에 따라 순서대로 자란다)
      const k = clamp(g * 5 - b.d, 0, 1); if (k <= 0) continue;
      const x0 = X + b.x * g * 1.1, y0 = gy + b.y * g * 1.1, x1 = x0 + (b.x1 - b.x) * g * 1.1 * k, y1 = y0 + (b.y1 - b.y) * g * 1.1 * k;
      ctx.strokeStyle = '#2e1c0c'; ctx.lineWidth = b.w * g + 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = '#6a4a24'; ctx.lineWidth = b.w * g * 0.5; ctx.beginPath(); ctx.moveTo(x0 - b.w * 0.15, y0); ctx.lineTo(x1 - b.w * 0.1, y1); ctx.stroke();
    }
    const lk = clamp(g * 5 - 4, 0, 1);
    for (const pass of [0, 1, 2]) for (const b of this.br) if (b.leaf) {   // 잎 덩어리 : 그늘 → 본색 → 하이라이트
      const x = X + b.x * g * 1.1, y = gy + b.y * g * 1.1, r = b.r * lk;
      ctx.fillStyle = ['#1e5a1c', b.c > 0.5 ? '#3a9a34' : '#2e8a2c', '#7ad05a'][pass];
      ctx.beginPath(); ctx.arc(x + [4, 0, -r * 0.3][pass], y + [6, 0, -r * 0.35][pass], r * [1.05, 0.92, 0.45][pass], 0, TAU); ctx.fill();
      if (pass === 2 && b.c > 0.6) { ctx.fillStyle = '#ffb8d8'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i * 2.1 + b.c * 9) * r * 0.6, y + Math.sin(i * 2.1 + b.c * 9) * r * 0.5, 3.5, 0, TAU); ctx.fill(); } }
    }
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, gy - 300 * g, 300 * g, '160,240,100', 0.22, 1, 0.8);
    ctx.restore();
  }
}

// ============================================================
//  운명의 주사위검 다이스 : 입체 주사위 · 화려한 슬롯머신
// ============================================================
const PIPS = (n, a) => { const c = [0, 0], tl = [-a, -a], tr = [a, -a], bl = [-a, a], br = [a, a], ml = [-a, 0], mr = [a, 0]; return [[c], [tl, br], [tl, c, br], [tl, tr, bl, br], [tl, tr, c, bl, br], [tl, tr, ml, mr, bl, br]][n - 1]; };
function drawDie(ctx, x, y, s, rot, top, front, side) {
  //  윗면 · 앞면 · 옆면이 보이는 입체 주사위
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const h = s, d = s * 0.5;
  const face = (pts, fill, n, cx, cy, sx, sy2, kx) => {
    ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7a0a18'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = n === 1 ? '#d01828' : '#a8101e';
    for (const [px, py] of PIPS(n, 0.3)) { ctx.beginPath(); ctx.ellipse(cx + px * sx + py * kx, cy + py * sy2, s * 0.09 * Math.abs(sx) / h + 0.5, s * 0.09 * Math.abs(sy2) / h + 0.5, 0, 0, TAU); ctx.fill(); }
  };
  face([[-h / 2, -h / 2], [h / 2, -h / 2], [h / 2, h / 2], [-h / 2, h / 2]], '#fafafa', front, 0, 0, h, h, 0);
  face([[-h / 2, -h / 2], [-h / 2 + d, -h / 2 - d * 0.6], [h / 2 + d, -h / 2 - d * 0.6], [h / 2, -h / 2]], '#ffffff', top, d / 2, -h / 2 - d * 0.3, h, d * 0.6, d * 0.8);
  face([[h / 2, -h / 2], [h / 2 + d, -h / 2 - d * 0.6], [h / 2 + d, h / 2 - d * 0.6], [h / 2, h / 2]], '#d8d8de', side, h / 2 + d / 2, -d * 0.3, d * 0.5, h, -d * 0.6);
  ctx.restore();
}

class FDie {
  constructor(p, x, y, face) { Object.assign(this, { p, x, y, z: 80, vx: p.facing * 9, vz: 7, t: 0, face, rot: 0, add: false, bounce: 0 }); }
  update() {
    this.t++; this.x += this.vx; this.z += this.vz; this.vz -= 0.55; this.rot += 0.3 * sign(this.vx);
    const r = Game.room;
    let hit = null;
    for (const e of Game.enemies) if (e.hittable() && Math.abs(e.x - this.x) < 46 + e.w && Math.abs(e.y - this.y) < 40 && this.z < e.z + e.hurtH() + 20) { hit = e; break; }
    if (this.z <= 0 && !hit && this.bounce < 1 && this.t > 4) { this.bounce++; this.z = 0; this.vz = 5; this.vx *= 0.6; Sfx.wlayer('dice', 0, false); FF.spray('bit', this.x, sy(this.y, 2), 4, { col: '200,180,160', ang: -Math.PI / 2, spread: 1, v0: 2, v1: 4, grav: 0.3 }); return true; }
    if (hit || (this.z <= 0 && this.t > 4) || this.x < r.minX - 40 || this.x > r.maxX + 40) { this.land(); return false; }
    if (this.t % 2 === 0) FX.add('world', new FP(this.x, sy(this.y, this.z), { kind: 'spark', col: '255,120,120', vx: -this.vx * 0.2, vy: rand(-1, 1), r: 2.5, life: 12 }));
    return true;
  }
  land() {
    const p = this.p, X = this.x, Y = this.y, n = this.face, gy = sy(Y, 0);
    const col = ['255,255,255', '255,230,120', '255,140,60', '150,220,255', '140,255,160', '255,80,80'][n - 1];
    FX.add('world', new FDieShow(X, Y, n, col));
    FX.add('ground', new FRing(X, gy, 20, 150 + n * 25, 20, { col, w: 8 }));
    FF.impact(X, gy - 30, col, 0.8 + n * 0.1);
    Sfx.wlayer('dice', 2, n === 6); Game.addShake(3 + n);
    const R = 150 + n * 22, mul = [1, 1.3, 1.5, 1.4, 1.6, 4][n - 1];
    if (n === 2) for (const e of WS.nearest(X, Y, 5, R)) FX.add('world', new FLightning(X, gy - 120, e.x, sy(e.y, e.z + e.h * 0.5), { w: 3, life: 10 }));
    if (n === 3) { FX.add('world', new FBeam(X, Y, 60, 26, { col: '255,140,60', core: '255,230,170', h: 380 })); FF.spray('flame', X, gy - 10, 20, { col: '255,140,60', ang: -Math.PI / 2, spread: 1.2, v0: 3, v1: 9 }); }
    if (n === 4) { FX.add('ground', new FDecal(X, Y, R, 160, { kind: 'frost' })); FF.spray('shard', X, gy - 20, 16, { col: '170,230,255', v0: 3, v1: 9, grav: 0.3 }); }
    if (n === 5) { FX.add('ground', new FCircle(p.x, p.y, 90, 40, { kind: 'star', col: '140,255,160' })); FF.spray('glow', p.x, sy(p.y, 60), 14, { col: '140,255,160', ang: -Math.PI / 2, spread: 0.8, v0: 1, v1: 4 }); }
    WS.area(p, X, Y, R, R * 0.45, WS.hd({ dmg: 2.2 * mul, kx: 5, kz: 7, airKz: 6, stun: 40, stop: 4 + n, shake: 3 + n, fx: n === 6 ? 'heavy' : 'blunt', power: 1.2 + n * 0.1 }), {
      each: ev => { if (n === 2) Status.add(ev, 'shock', { t: 30 }); if (n === 3) Status.add(ev, 'burn', { t: 150, d: p.atk * 0.2 }); if (n === 4) Status.add(ev, 'freeze', { t: 60 }); },
    });
    if (n === 5) Gear.heal(p, p.hpMax * 0.08);
    if (n === 6) {
      Game.flashScreen(0.35, '255,230,200'); Sfx.play('explode', 0.8);
      FX.add('top', new Label(X, gy - 140, 'JACKPOT!', { col: ['#ffffff', '#ff5050'], size: 38, life: 70 }));
      FF.spray('coin', X, gy - 40, 24, { col: '255,215,90', ang: -Math.PI / 2, spread: 1.2, v0: 5, v1: 13, grav: 0.4, l0: 30, l1: 50 });
      for (let i = 0; i < 8; i++) Game.pickups.push(new Pickup('gold', X, Y, 50, randi(60, 140)));
    } else FX.add('top', new Label(X, gy - 120, `${n}`, { col: ['#ffffff', '#' + ['ffffff', 'ffe070', 'ff9040', '90d0ff', '70ff90', 'ff5050'][n - 1]], size: 30, life: 46 }));
  }
  draw(ctx) {
    const gy = sy(this.y, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(this.x, gy, 24, 7, 0, 0, TAU); ctx.fill();
    const k = (this.t / 3 | 0) % 6;
    drawDie(ctx, this.x, sy(this.y, this.z), 46, this.rot, 1 + k, 1 + (k + 2) % 6, 1 + (k + 4) % 6);
  }
}
class FDieShow {
  constructor(x, y, n, col) { Object.assign(this, { x, y, n, col, t: 0, life: 44, add: false }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const gy = sy(this.y, 0), a = this.t < 30 ? 1 : 1 - (this.t - 30) / 14, s = E.out3(Math.min(1, this.t / 6)), lift = Math.min(1, this.t / 10) * 50;
    ctx.save(); ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, gy - 30 - lift, 90, this.col, 0.6); ctx.globalCompositeOperation = 'source-over';
    drawDie(ctx, this.x, gy - 30 - lift, 62 * s, 0, this.n === 1 ? 2 : 1, this.n, 3);
    ctx.restore();
  }
}

// ============================================================
//  해적 곡도 블랙펄 : 휘파람 소리를 내며 떨어지는 포탄 · 금화가 쏟아지는 보물 상자
// ============================================================
class FCannonball {
  constructor(p, x, y, delay) { Object.assign(this, { p, x, y, t: -delay, dur: 30, add: false, from: rand(-460, -320) * (chance(0.5) ? 1 : -1) }); }
  pos() { const u = Math.min(1, this.t / this.dur), e = u * u; return [lerp(this.x + this.from, this.x, u), lerp(-200, sy(this.y, 14), e) - Math.sin(u * Math.PI) * 60]; }
  update() {
    this.t++;
    if (this.t === 1) Sfx.play('dash', 0.4, 0.5);
    if (this.t > 0 && this.t < this.dur && this.t % 2 === 0) { const [bx, by] = this.pos(); FX.add('world', new FP(bx, by, { kind: 'smoke', col: '120,110,100', vx: rand(-0.5, 0.5), vy: -0.5, r: rand(10, 16), grow: 0.4, life: 26 })); }
    if (this.t === this.dur) {
      const p = this.p, gy = sy(this.y, 0);
      FF.impact(this.x, gy - 30, '255,190,100', 1.4, { burst: '255,230,180' });
      FX.add('ground', new FRing(this.x, gy, 20, 250, 20, { col: '255,190,100', w: 12 }));
      FX.add('ground', new FDecal(this.x, this.y, 120, 220, { kind: 'scorch', col: '255,140,50' }));
      FF.spray('flame', this.x, gy - 20, 18, { col: '255,150,60', ang: -Math.PI / 2, spread: 1.3, v0: 3, v1: 9, l0: 18, l1: 30 });
      FF.spray('smoke', this.x, gy - 30, 12, { col: '90,80,70', v0: 1, v1: 4, r0: 20, r1: 36, l0: 40, l1: 60, grow: 0.4 });
      for (let i = 0; i < FF.n(12); i++) FX.add('world', new Debris(this.x + rand(-30, 30), this.y, 6, { vx: rand(-8, 8), vz: rand(5, 14), s: rand(3, 7), col: ['#3a2416', '#6a4a2c', '#ffb040'], glow: '255,160,60' }));
      Sfx.play('explode', 0.9); Sfx.wlayer('coin', 2, false); Game.addShake(10);
      WS.area(p, this.x, this.y, 170, 76, WH.prCannon);
    }
    return this.t < this.dur + 4;
  }
  draw(ctx) {
    if (this.t < 0 || this.t >= this.dur) return;
    const gy = sy(this.y, 0), u = Math.min(1, this.t / this.dur);
    ctx.save();
    ctx.strokeStyle = `rgba(255,60,60,${0.4 + u * 0.5})`; ctx.lineWidth = 4; ctx.lineCap = 'round';          // 조준 표식 (X)
    const r = 26 + (1 - u) * 30; ctx.beginPath(); ctx.moveTo(this.x - r, gy - r * 0.3); ctx.lineTo(this.x + r, gy + r * 0.3); ctx.moveTo(this.x + r, gy - r * 0.3); ctx.lineTo(this.x - r, gy + r * 0.3); ctx.stroke();
    ctx.fillStyle = `rgba(0,0,0,${0.15 + u * 0.3})`; ctx.beginPath(); ctx.ellipse(this.x, gy, 30 * u + 6, 9 * u + 2, 0, 0, TAU); ctx.fill();
    const [bx, by] = this.pos();
    const g = ctx.createRadialGradient(bx - 6, by - 6, 2, bx, by, 18); g.addColorStop(0, '#6a6058'); g.addColorStop(1, '#100c0a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 18, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, bx, by - 20, 14, '255,200,90', 0.9); ctx.fillStyle = '#ffe080'; ctx.fillRect(bx - 1, by - 26, 2, 8);   // 도화선 불꽃
    ctx.restore();
  }
}

class FTreasure {
  constructor(p, x, y) { Object.assign(this, { p, x, y, x0: p.x, y0: p.y, t: 0, add: false, open: 22, life: 190 }); }
  update() {
    this.t++;
    const p = this.p, gy = sy(this.y, 0);
    if (this.t === this.open) {
      FF.impact(this.x, gy - 40, '255,215,90', 1.3);
      FX.add('ground', new FRing(this.x, gy, 20, 360, 24, { col: '255,215,90', w: 12 }));
      FX.add('ground', new FCircle(this.x, this.y, 200, this.life - this.open, { kind: 'sun', col: '255,215,90', col2: '255,250,220', spin: 0.01 }));
      Sfx.wlayer('coin', 3, true); Game.addShake(6);
    }
    if (this.t > this.open && this.t < this.life - 10) {
      if (this.t % 2 === 0) FX.add('world', new FP(this.x + rand(-20, 20), gy - 50, { kind: 'coin', col: '255,215,90', vx: rand(-7, 7), vy: rand(-14, -8), grav: 0.5, r: rand(4, 6), life: 40 }));
      if (this.t % 3 === 0) {
        const list = WS.nearest(this.x, this.y, 99, 380), e = list.length ? choose(list) : null;
        const cx = e ? e.x + rand(-20, 20) : this.x + rand(-300, 300), cy = e ? e.y : clamp(this.y + rand(-80, 80), 0, DEPTH);
        FX.add('world', new FP(cx, sy(cy, 180), { kind: 'coin', col: '255,215,90', vy: 14, r: 6, life: 9 }));
        Gear.later(8, () => {
          FX.add('world', new FRing(cx, sy(cy, 20), 4, 40, 8, { col: '255,220,100', w: 3, ry: 0.6, fill: 0 }));
          WS.area(this.p, cx, cy, 60, 32, WH.prCoin);
          if (this.t % 2 === 0) Game.pickups.push(new Pickup('gold', cx, cy, 30, randi(30, 80)));
        });
        Sfx.wlayer('coin', 1, false);
      }
    }
    if (this.t === this.life) {
      Sfx.play('explode', 1); Game.addShake(14); Game.flashScreen(0.4, '255,230,150');
      FF.impact(this.x, gy - 60, '255,215,90', 2);
      FF.spray('coin', this.x, gy - 40, 40, { col: '255,215,90', v0: 5, v1: 15, grav: 0.45, l0: 30, l1: 50 });
      WS.area(p, this.x, this.y, 400, 150, WH.prChest);
    }
    return this.t < this.life + 4;
  }
  draw(ctx) {
    const t = this.t;
    let X, Y;
    if (t < this.open) { const u = t / this.open; X = lerp(this.x0, this.x, u); Y = lerp(sy(this.y0, 70), sy(this.y, 0), u) - Math.sin(u * Math.PI) * 140; }
    else { X = this.x; Y = sy(this.y, 0); }
    const a = t > this.life - 10 ? Math.max(0, (this.life - t) / 10) : 1, open = t < this.open ? 0 : E.out3(Math.min(1, (t - this.open) / 8)), sh = t > this.open && t < this.life ? Math.sin(t * 1.2) * 1.5 : 0;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(X + sh, Y);
    if (open > 0) {                                               // 상자 안에서 뿜어나오는 빛줄기
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const g = -Math.PI / 2 + (i - 3) * 0.22 + Math.sin(t * 0.05 + i) * 0.05; ctx.fillStyle = `rgba(255,220,120,${0.25 * open})`; ctx.beginPath(); ctx.moveTo(-20, -40); ctx.lineTo(Math.cos(g - 0.06) * 300, -40 + Math.sin(g - 0.06) * 300); ctx.lineTo(Math.cos(g + 0.06) * 300, -40 + Math.sin(g + 0.06) * 300); ctx.lineTo(20, -40); ctx.fill(); }
      drawGlow(ctx, 0, -44, 120, '255,215,90', 0.8 * open); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 46, 10, 0, 0, TAU); ctx.fill();
    const wood = ctx.createLinearGradient(0, -44, 0, 0); wood.addColorStop(0, '#7a4a1c'); wood.addColorStop(1, '#3a200c');
    ctx.fillStyle = wood; ctx.fillRect(-40, -44, 80, 44);
    ctx.fillStyle = '#e8b830'; for (const x of [-40, -6, 34]) ctx.fillRect(x, -44, 6, 44); ctx.fillRect(-40, -46, 80, 5);
    ctx.fillStyle = '#ffe080'; ctx.fillRect(-7, -32, 14, 16); ctx.fillStyle = '#3a200c'; ctx.fillRect(-2, -27, 4, 7);
    ctx.save(); ctx.translate(0, -44); ctx.scale(1, 1 - open * 1.6);            // 뚜껑 (열리며 뒤로 젖혀진다)
    ctx.fillStyle = '#8a5424'; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.quadraticCurveTo(0, -34, 40, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    if (open > 0) { ctx.fillStyle = '#ffd24a'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-30 + i * 7.5, -46 - (i % 3) * 3, 6, 3, 0, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
}

// ============================================================
//  증기 기관검 스팀하트 : 금속 톱날 · 회전하는 기관포
// ============================================================
const STM = '255,190,120';
class FSaw {
  constructor(p, x, y, vx) { Object.assign(this, { p, x, y, vx, t: 0, bounces: 0, hit: new Map(), add: false, rot: 0 }); }
  update() {
    this.t++; this.x += this.vx; this.rot += 0.45 * Math.sign(this.vx);
    const r = Game.room;
    if ((this.x < r.minX + 30 && this.vx < 0) || (this.x > r.maxX - 30 && this.vx > 0)) {
      this.vx = -this.vx; this.bounces++;
      FF.impact(this.x, sy(this.y, 60), STM, 0.7); FF.spray('smoke', this.x, sy(this.y, 60), 8, { col: '240,240,240', v0: 1, v1: 4, r0: 14, r1: 24, l0: 30, l1: 46, grow: 0.4 });
      Sfx.wlayer('steam', 1, false); Game.addShake(3);
    }
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 56 + e.w || Math.abs(e.y - this.y) > 42 || e.z > 140) continue;
      if (this.t - (this.hit.get(e) || -99) < 9) continue;
      this.hit.set(e, this.t);
      applyHit(this.p, e, WH.stSaw, { noStopAtt: true, dir: sign(this.vx) || 1, hz: 60 });
      FF.spray('spark', this.x, sy(this.y, 60), 8, { col: '255,220,140', v0: 4, v1: 10, grav: 0.3, l0: 10, l1: 18, r0: 2, r1: 3 });
    }
    if (this.t % 2 === 0) FX.add('world', new FP(this.x, sy(this.y, 2), { kind: 'spark', col: '255,210,130', vx: -this.vx * 0.4 + rand(-2, 2), vy: rand(-5, -2), grav: 0.35, r: 2.5, life: 14 }));
    return this.bounces < 3 && this.t < 170;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, 60), gy = sy(this.y, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(X, gy, 40, 9, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(X, Y);
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 80, STM, 0.35); ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 50, this.rot, this.rot + 1.5); ctx.stroke();   // 회전 잔상
    ctx.rotate(this.rot);
    ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ctx.lineTo(Math.cos(a) * 52, Math.sin(a) * 52); ctx.lineTo(Math.cos(a + 0.18) * 42, Math.sin(a + 0.18) * 42); } ctx.closePath();
    const g = ctx.createLinearGradient(-50, -50, 50, 50); g.addColorStop(0, '#f0d0a0'); g.addColorStop(0.5, '#8a5a30'); g.addColorStop(1, '#e0b070');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.5; ctx.stroke();
    drawCog(ctx, 0, 0, 30, 10, 0, '#b87030', '#3a2410');
    ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffe0a0'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20, 2.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

class FGatling {
  //  기관포 모드 동안 손에 들린 다연장 총열 (플레이어를 따라감)
  constructor(p) { Object.assign(this, { p, t: 0, add: false, spin: 0, heat: 0 }); }
  update() { this.t++; const p = this.p; const on = p.act && p.act.name === 'w22s6'; this.spin += on && p.af > 40 ? 0.7 : 0.05; this.heat = on && p.af > 40 ? Math.min(1, this.heat + 0.01) : Math.max(0, this.heat - 0.05); if (this.heat > 0.4 && this.t % 6 === 0) FX.add('world', new FP(p.x - p.facing * 10, sy(p.y, p.z + 100), { kind: 'smoke', col: '240,240,240', vx: -p.facing, vy: -2, r: 14, grow: 0.5, life: 30 })); return on; }
  draw(ctx) {
    const p = this.p, d = p.facing, X = p.x + d * 30, Y = sy(p.y, p.z + 78);
    ctx.save(); ctx.translate(X, Y); ctx.scale(d, 1);
    ctx.fillStyle = '#4a2a14'; ctx.fillRect(-26, -16, 40, 32);                     // 몸통 · 보일러
    ctx.fillStyle = '#c87a30'; ctx.fillRect(-26, -16, 40, 6); ctx.fillRect(-26, 10, 40, 6);
    ctx.fillStyle = '#f0b870'; ctx.beginPath(); ctx.arc(-8, 0, 7, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) {                                                   // 돌아가는 총열 여섯 개
      const a = this.spin + i / 6 * TAU, oy = Math.sin(a) * 9, front = Math.cos(a) > 0;
      ctx.fillStyle = front ? '#d8a060' : '#6a4020'; ctx.fillRect(14, oy - 2.5, 62, 5);
    }
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(14, -13, 8, 26); ctx.fillRect(70, -12, 6, 24);
    if (this.heat > 0) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 50, 0, 40, '255,90,30', this.heat * 0.6); }
    ctx.restore();
  }
}

// ============================================================
//  태양신의 곡도 라 솔레이 : 일렁이는 태양 광선 · 정오의 태양
// ============================================================
const SUN = '255,215,90';
class FSunRay {
  constructor(p) { Object.assign(this, { p, t: 0, life: 36, add: true, dir: p.facing }); }
  update() {
    this.t++;
    const p = this.p, u = this.t / this.life, ly = clamp(p.y + (u * 2 - 1) * 70, 0, DEPTH);
    this.ly = ly;
    if (this.t % 4 === 0) { WS.area(p, p.x + this.dir * 480, ly, 480, 44, WH.snRay, { hmax: 240, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.12 }) }); Game.addShake(2); }
    if (this.t % 2 === 0) { FX.add('ground', new FDecal(p.x + this.dir * rand(80, 900), ly, rand(20, 40), 90, { kind: 'scorch', col: '255,170,60' })); FX.add('world', new FP(p.x + this.dir * rand(60, 900), sy(ly, rand(50, 90)), { kind: 'ember', col: '255,225,110', vx: this.dir * rand(1, 4), vy: rand(-2, -0.5), r: rand(3, 6), life: 22 })); }
    return this.t < this.life && p.hp > 0;
  }
  draw(ctx) {
    const p = this.p, d = this.dir, Y = sy(this.ly ?? p.y, 70), X0 = p.x + d * 50, a = Math.min(1, this.t / 5, (this.life - this.t) / 6), T = this.t;
    ctx.save(); ctx.globalAlpha = a;
    for (const [w, c, al] of [[46, '255,170,50', 0.35], [26, '255,220,110', 0.7], [9, '255,255,235', 1]]) {   // 일렁이는 세 겹 광선
      ctx.fillStyle = `rgba(${c},${al})`; ctx.beginPath(); ctx.moveTo(X0, Y - w * 0.3);
      for (let i = 0; i <= 20; i++) { const x = X0 + d * i * 50; ctx.lineTo(x, Y - w * (0.3 + i / 20 * 0.7) - Math.sin(T * 0.6 + i) * w * 0.12); }
      for (let i = 20; i >= 0; i--) { const x = X0 + d * i * 50; ctx.lineTo(x, Y + w * (0.3 + i / 20 * 0.7) + Math.sin(T * 0.6 + i + 1) * w * 0.12); }
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 8; i++) { const k = ((T * 0.06 + i / 8) % 1); ctx.fillRect(X0 + d * k * 1000 - 20, Y - 2 + Math.sin(i * 3) * 8, 40, 3); }
    drawGlow(ctx, X0, Y, 110, SUN, 0.9);
    ctx.save(); ctx.translate(X0, Y); ctx.rotate(T * 0.1); ctx.fillStyle = 'rgba(255,240,170,0.6)';   // 칼끝의 작은 태양
    for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(18, -4); ctx.lineTo(46 + (i % 2) * 14, 0); ctx.lineTo(18, 4); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
}

class FNoonSun {
  constructor(p) { Object.assign(this, { p, t: 0, life: 150, add: false }); }
  update() {
    this.t++;
    const p = this.p;
    if (this.t > 20 && this.t % 14 === 0) for (const e of WS.onScreen()) { Status.add(e, 'burn', { t: 90, d: p.atk * 0.14 }); FX.add('world', new FP(e.x, sy(e.y, e.z + e.h * 0.5), { kind: 'flame', col: '255,170,60', vy: -2, r: 8, life: 16 })); }
    if (this.t === this.life) {
      Game.flashScreen(0.8, '255,250,210'); Game.addShake(22); Game.zoomPunch(1.08); Game.slowmo(0.4, 20);
      Sfx.play('explode', 1.1); Sfx.wlayer('sun', 3, true);
      for (const e of WS.onScreen()) {
        FX.add('world', new FBeam(e.x, e.y, 60, 30, { col: SUN, core: '255,255,240', h: 800 }));
        FX.add('ground', new FDecal(e.x, e.y, 90, 200, { kind: 'scorch', col: '255,170,60' }));
        FF.impact(e.x, sy(e.y, e.z + e.h * 0.5), SUN, 1.2);
        applyHit(p, e, WH.snFlare, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
      }
    }
    return this.t < this.life + 4;
  }
  draw(ctx) {
    const T = this.t, u = Math.min(1, T / this.life), X = Game.cam.x + W / 2, Y = 120, s = E.out3(Math.min(1, T / 24)) * (1 + u * 0.7), pre = T > this.life - 16 ? (T - this.life + 16) / 16 : 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, X, Y, 300 * s, SUN, 0.5 + pre * 0.4);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(T * 0.006);
    for (let i = 0; i < 24; i++) { ctx.rotate(TAU / 24); const L = (120 + (i % 2) * 60 + Math.sin(T * 0.15 + i) * 20) * s; ctx.fillStyle = `rgba(255,${200 + (i % 2) * 40},110,0.45)`; ctx.beginPath(); ctx.moveTo(56 * s, -9 * s); ctx.lineTo(L, 0); ctx.lineTo(56 * s, 9 * s); ctx.fill(); }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(X - 14 * s, Y - 14 * s, 4, X, Y, 64 * s); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#fff2b0'); g.addColorStop(1, '#ffb830');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, 64 * s, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,250,220,0.8)'; ctx.lineWidth = 3;      // 표면의 홍염
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + T * 0.03, r = 64 * s; ctx.beginPath(); ctx.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r, 10 * s + Math.sin(T * 0.2 + i) * 4, a - Math.PI * 0.6, a + Math.PI * 0.6); ctx.stroke(); }
    ctx.restore();
  }
}

Object.assign(WH, {
  iaIchi: WS.hd({ dmg: 4.5, kx: 5, kz: 3, airKz: 4, stun: 50, stop: 8, shake: 9, fx: 'slash', power: 1.8 }),
  iaCounter: WS.hd({ dmg: 9, kx: 6, kz: 5, airKz: 6, stun: 50, stop: 10, shake: 10, fx: 'slash', power: 2 }),
  tvThorn: WS.hd({ dmg: 1.4, kx: 0, airKz: 0.5, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  tvBloom: WS.hd({ dmg: 12, kx: 6, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'blunt', power: 1.6 }),
  tvGrab: WS.hd({ dmg: 3.2, kx: 0, kz: 2, airKz: 2, stun: 40, stop: 5, shake: 4, fx: 'pierce', power: 1.3 }),
  prCannon: WS.hd({ dmg: 4, kx: 7, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.6 }),
  prCoin: WS.hd({ dmg: 1.5, kx: 1, airKz: 2, stun: 12, stop: 1, shake: 1, fx: 'none', sfx: 'light' }),
  prChest: WS.hd({ dmg: 13, kx: 9, kz: 11, airKz: 10, stun: 60, stop: 14, shake: 14, fx: 'heavy', power: 2.2 }),
  stSaw: WS.hd({ dmg: 1.9, kx: 2, airKz: 2, stun: 22, stop: 2, shake: 2, fx: 'slash' }),
  stBullet: WS.hd({ dmg: 0.85, kx: 1.5, airKz: 1, stun: 14, stop: 1, shake: 1, fx: 'pierce', sfx: 'light' }),
  snRay: WS.hd({ dmg: 1, kx: 2, airKz: 2, stun: 20, stop: 1, shake: 1.5, fx: 'none', sfx: 'none' }),
  snFlare: WS.hd({ dmg: 30, kx: 8, kz: 13, airKz: 12, stun: 70, stop: 18, shake: 18, fx: 'heavy', power: 2.6 }),
});

// ---------- 슬롯머신 (잭팟) : 전구가 깜빡이는 금빛 기계 ----------
const SLOT_SYM = ['seven', 'bar', 'cherry', 'star', 'bell'];
function drawSlotSym(g, s, x, y, r) {
  g.save(); g.translate(x, y);
  switch (s) {
    case 'seven': { const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, '#ff8080'); gr.addColorStop(1, '#c00010'); g.fillStyle = gr; g.strokeStyle = '#fff'; g.lineWidth = 4; g.font = `${r * 2}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('7', 0, 2); g.fillText('7', 0, 2); break; }
    case 'bar': g.fillStyle = '#1a1a1a'; g.strokeStyle = '#ffd24a'; g.lineWidth = 3; roundRect(g, -r, -r * 0.42, r * 2, r * 0.84, 4); g.fill(); g.stroke(); g.fillStyle = '#ffd24a'; g.font = `${r * 0.7}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BAR', 0, 1); break;
    case 'cherry': g.strokeStyle = '#3a8a20'; g.lineWidth = 3; g.beginPath(); g.moveTo(-r * 0.4, r * 0.1); g.quadraticCurveTo(-r * 0.2, -r * 0.6, r * 0.1, -r * 0.8); g.moveTo(r * 0.4, r * 0.1); g.quadraticCurveTo(r * 0.3, -r * 0.5, r * 0.1, -r * 0.8); g.stroke();
      for (const o of [-r * 0.4, r * 0.4]) { const gr = g.createRadialGradient(o - 4, r * 0.25, 1, o, r * 0.35, r * 0.42); gr.addColorStop(0, '#ff9090'); gr.addColorStop(1, '#b00020'); g.fillStyle = gr; g.beginPath(); g.arc(o, r * 0.35, r * 0.42, 0, TAU); g.fill(); } break;
    case 'star': { const gr = g.createRadialGradient(0, 0, 2, 0, 0, r); gr.addColorStop(0, '#fff8c0'); gr.addColorStop(1, '#f0a010'); g.fillStyle = gr; g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.42 : r * 0.95, a = k / 10 * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); break; }
    case 'bell': { const gr = g.createLinearGradient(-r, 0, r, 0); gr.addColorStop(0, '#c88010'); gr.addColorStop(0.4, '#ffe070'); gr.addColorStop(1, '#b07010'); g.fillStyle = gr; g.beginPath(); g.moveTo(-r * 0.75, r * 0.5); g.quadraticCurveTo(-r * 0.7, -r * 0.85, 0, -r * 0.85); g.quadraticCurveTo(r * 0.7, -r * 0.85, r * 0.75, r * 0.5); g.closePath(); g.fill(); g.fillStyle = '#8a5010'; g.beginPath(); g.arc(0, r * 0.65, r * 0.18, 0, TAU); g.fill(); break; }
  }
  g.restore();
}
{
  const ov = WS.overlay;
  WS.overlay = function (ctx) {
    ov.call(this, ctx);
    const S = Game.slot;
    if (!S) return;
    const t = S.t, a = Math.min(1, t / 8, (S.life - t) / 14), cx = W / 2, cy = 200, done = t > 64;
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(cx, cy); const pop = E.out3(Math.min(1, t / 10)); ctx.scale(0.8 + pop * 0.2, 0.8 + pop * 0.2); ctx.translate(-cx, -cy);
    const body = ctx.createLinearGradient(0, cy - 110, 0, cy + 110); body.addColorStop(0, '#5a0a14'); body.addColorStop(1, '#22040a');
    ctx.fillStyle = body; roundRect(ctx, cx - 220, cy - 104, 440, 208, 24); ctx.fill();
    const rim = ctx.createLinearGradient(cx - 220, 0, cx + 220, 0); rim.addColorStop(0, '#a8741a'); rim.addColorStop(0.5, '#ffe8a0'); rim.addColorStop(1, '#a8741a');
    ctx.strokeStyle = rim; ctx.lineWidth = 8; ctx.stroke();
    for (let i = 0; i < 26; i++) {                               // 테두리 전구
      const k = i / 26, per = 2 * (440 + 208), d = k * per; let bx, by;
      if (d < 440) { bx = cx - 220 + d; by = cy - 104; } else if (d < 648) { bx = cx + 220; by = cy - 104 + d - 440; } else if (d < 1088) { bx = cx + 220 - (d - 648); by = cy + 104; } else { bx = cx - 220; by = cy + 104 - (d - 1088); }
      const on = done && S.win ? (i + (t >> 2)) % 2 === 0 : (i + (t >> 3)) % 3 === 0;
      ctx.fillStyle = on ? '#fff6c0' : '#7a5a20'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill();
      if (on) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, bx, by, 14, '255,230,140', 0.8); ctx.globalCompositeOperation = 'source-over'; }
    }
    for (let i = 0; i < 3; i++) {
      const rx = cx - 124 + i * 124, stop = 24 + i * 16, spinning = t < stop;
      const rg = ctx.createLinearGradient(0, cy - 66, 0, cy + 66); rg.addColorStop(0, '#9a948a'); rg.addColorStop(0.2, '#fbf8f0'); rg.addColorStop(0.8, '#fbf8f0'); rg.addColorStop(1, '#9a948a');
      ctx.fillStyle = rg; roundRect(ctx, rx - 50, cy - 66, 100, 132, 12); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(rx - 50, cy - 66, 100, 132); ctx.clip();
      if (spinning) { ctx.globalAlpha = a * 0.85; for (let k = -2; k <= 2; k++) drawSlotSym(ctx, SLOT_SYM[((t * 2 + i * 3 + k + 50) % 5 + 5) % 5], rx, cy + k * 56 + (t * 22 % 56), 26); }
      else { const b = Math.max(0, 1 - (t - stop) / 6); drawSlotSym(ctx, S.res[i], rx, cy - b * 14, 30); }
      ctx.restore();
      ctx.strokeStyle = '#3a0a10'; ctx.lineWidth = 4; roundRect(ctx, rx - 50, cy - 66, 100, 132, 12); ctx.stroke();
    }
    ctx.fillStyle = '#d02030'; ctx.fillRect(cx + 232, cy - 40, 12, 80);            // 손잡이
    const lv = t < 12 ? t / 12 : 1; ctx.fillStyle = '#ff4050'; ctx.beginPath(); ctx.arc(cx + 238, cy - 60 + lv * 100, 14, 0, TAU); ctx.fill();
    if (done) { ctx.fillStyle = S.win ? '#ffe070' : '#ffffff'; ctx.font = `38px ${FONT_T}`; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = '#000'; ctx.strokeText(S.text, cx, cy + 148); ctx.fillText(S.text, cx, cy + 148); }
    ctx.restore();
  };
}

// ============================================================
//  스킬 정의
// ============================================================
forgeDef('w18', {
  name: '일문자', mp: 110, cd: 8, ico: ['iai', '225,238,255'],
  desc: '칼집에 손을 얹고 숨을 고르면 주위의 바람이 멎는다. 한순간에 앞으로 뛰쳐나가며 베면, 같은 줄에 선 적들이 잠시 뒤 한꺼번에 갈라진다.',
  act: {
    anim: 'drawReady', len: 58, cancel: 46, atkCancel: 46,
    start(p) { p.vx = 0; p.iaiList = []; Sfx.wlayer('katana', 1, false); },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      if (f < 26) {
        p.bladeGlow = 0.5 + f * 0.04;
        if (f === 2) { FX.add('ground', new FRing(p.x, sy(p.y, 0), 170, 12, 24, { col: IAI, w: 5 })); FF.screen({ kind: 'vig', col: '0,0,10', a: 0.45, life: 34, fin: 10, fout: 4 }); }
        if (f % 2 === 0) FX.add('world', new FP(p.x + rand(-140, 140), sy(p.y, rand(10, 160)), { kind: 'glow', col: IAI, tx: p.x - p.facing * 10, ty: sy(p.y, 70), pull: 0.05, r: 3, life: 18 }));
        if (f === 20) FX.add('world', new FSlash(p.x + p.facing * 420, sy(p.y, 70), 0, 460, { col: IAI, core: '255,255,255', th: 2, bend: 0, life: 6, sparks: false }));   // 일섬의 예감
      }
      if (f === 26) {
        const d = p.facing, minX = Game.room.minX, maxX = Game.room.maxX;
        p.iaiList = Game.enemies.filter(e => e.hittable() && Math.abs(e.y - p.y) < 85 && (e.x - p.x) * d > -90 && Math.abs(e.x - p.x) < 1000);
        const x0 = p.x, nx = clamp(p.x + d * 420, minX, maxX);
        for (let i = 0; i < 5; i++) p.addGhost(lerp(p.x, nx, i / 5), p.y, p.z, d, lerpPose(PP.a1s, PP.a3s || PP.a2s, 0.6, P()), 10 + i, '220,236,255');
        p.x = p.px = nx; p.afterOn = 8; swingT(p, 'a3', 2.2); p.bladeGlow = 2;
        FX.add('world', new FSlash((x0 + nx) / 2, sy(p.y, 70), 0, 560, { col: IAI, core: '255,255,255', th: 10, bend: 0, dark: '10,16,30', life: 22 }));
        FF.screen({ kind: 'lines', col: '240,248,255', a: 0.25, life: 12, fin: 1, fout: 8 });
        Game.flashScreen(0.25, '255,255,255'); Sfx.pplay('swingBig'); Sfx.wlayer('katana', 3, true);
      }
      if (f === 36) {
        for (const e of p.iaiList) if (e.hittable()) {
          const X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
          FX.add('world', new FSlash(X, Y, -0.15, 120, { col: IAI, core: '255,255,255', th: 8, dark: '10,16,30' }));
          FF.spray('petal', X, Y, 5, { col: '255,225,235', v0: 2, v1: 6, wob: 0.05, l0: 30, l1: 50 });
          applyHit(p, e, WH.iaIchi, { noStopAtt: true, dir: p.facing });
        }
        if (p.iaiList.length) { Game.addShake(8); Game.freeze(5); }
        p.iaiList = [];
      }
      if (f === 46) Sfx.play('sheath', 0.8);
    },
  },
}, {
  name: '무념무상', mp: 480, cd: 42, ico: ['stance', '200,225,255'],
  desc: '5초 동안 마음을 비우면 발밑이 고요한 수면이 되고 꽃잎이 내린다. 그동안 맞는 공격은 모두 흘려보내고, 세상을 가로로 가르며 되받아 벤다. (반격 최대 6회)',
  act: {
    anim: 'drawReady', len: 40, cancel: 30, atkCancel: 24,
    start(p) { forgeCine(p, '무념무상', '無 念 無 想', '200,225,255', { bars: 50, dim: 0.4 }); p.invul = 90; p.vx = 0; },
    update(p, f) {
      if (f === 8) {
        p.stanceT = 300; p.stanceN = 0; p.bladeGlow = 2;
        Sfx.wlayer('katana', 3, false); Game.flashScreen(0.15, '230,240,255');
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 260, 26, { col: IAI, w: 10 }));
        FX.add('ground', new FStillWater(p));
        forgeUndim(30);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w19', {
  name: '덩굴 올가미', mp: 120, cd: 9, ico: ['vine', '150,230,90'],
  desc: '검을 꽂으면 가까운 적 최대 5명의 발밑에서 가시 덩굴이 뚫고 나와 몸을 휘감는다. 붙잡힌 적은 내 앞으로 끌려오고 잠시 움직이지 못한다.',
  act: {
    anim: 'ebImpact', len: 44, cancel: 34, atkCancel: 30,
    update(p, f) {
      p.vx = 0;
      if (f === 10) {
        Sfx.wlayer('thorn', 3, true); Sfx.play('quake', 0.5); Game.addShake(5);
        FX.add('ground', new FDecal(p.x + p.facing * 30, p.y, 90, 120, { kind: 'crack', col: LEAF }));
        const list = WS.nearest(p.x, p.y, 5, 620);
        if (!list.length) for (let i = 0; i < 3; i++) FX.add('world', new FVine(p.x + p.facing * (150 + i * 130), p.y, { life: 46 }));
        for (const e of list) {
          FX.add('world', new FVine(e.x, e.y, { life: 64, e }));
          Gear.later(12, () => {
            if (!e.hittable()) return;
            if (!e.isBoss) { e.x = lerp(e.x, p.x + p.facing * 90, 0.8); e.y = lerp(e.y, p.y, 0.5); }
            applyHit(p, e, WH.tvGrab, { noStopAtt: true, dir: -p.facing });
            Status.add(e, 'shock', { t: 70 });
            FF.spray('leaf', e.x, sy(e.y, 40), 6, { col: '120,200,90', v0: 2, v1: 5, wob: 0.05, l0: 30, l1: 46 });
          });
        }
      }
    },
  },
}, {
  name: '세계수의 숲', mp: 480, cd: 42, ico: ['tree', '150,230,90'],
  desc: '앞에 세계수를 키워 7초 동안 숲을 만든다. 가지가 뻗고 잎이 무성해지며 반딧불이 떠다닌다. 숲 안의 적은 가시 덩굴에 찔리며 느려지고, 숲에 있는 동안 HP가 차오른다. 마지막에 꽃이 만개해 터진다.',
  act: {
    anim: 'ultUp', len: 50, cancel: 40, atkCancel: 34,
    start(p) { forgeCine(p, '세계수의 숲', '世 界 樹', '150,230,90', { bars: 60, dim: 0.3 }); p.invul = 90; p.vx = 0; },
    update(p, f) {
      if (f === 12) {
        const x = clamp(p.x + p.facing * 120, Game.room.minX + 200, Game.room.maxX - 200);
        FX.add('world', new FWorldTree(p, x, p.y)); p.bladeGlow = 2;
        FF.spray('bit', x, sy(p.y, 4), 20, { col: '110,80,40', ang: -Math.PI / 2, spread: 1.2, v0: 3, v1: 9, grav: 0.35 });
        Sfx.wlayer('thorn', 3, true); Sfx.play('quake', 0.7); Game.addShake(10); Game.flashScreen(0.2, '200,255,160');
        forgeUndim(30);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w20', {
  name: '주사위 굴리기', mp: 100, cd: 8, ico: ['dice', '255,90,90'],
  desc: '거대한 입체 주사위를 던진다. 튀어 구르다 멈춘 눈에 따라 효과가 다르다. 1 약한 폭발 · 2 연쇄 번개 · 3 불기둥 · 4 빙결 · 5 HP 회복 · 6 대박(큰 폭발 + 금화).',
  act: {
    anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 6) { Sfx.pplay('swingBig'); Sfx.wlayer('dice', 2, false); FX.add('world', new FDie(p, p.x + p.facing * 40, p.y, randi(1, 6))); }
    },
  },
}, {
  name: '잭팟', mp: 480, cd: 42, ico: ['slot', '255,215,90'],
  desc: '전구가 번쩍이는 슬롯머신을 돌린다. 세 개가 모두 같으면 큰 당첨 (7이면 대박), 두 개가 같으면 중간, 꽝이어도 약간의 피해. 화면 안의 모든 적에게 같은 배율이 적용되고 금화가 쏟아진다.',
  act: {
    anim: 'ultUp', len: 100, cancel: 90, atkCancel: 84,
    start(p) {
      WS.cutin(p, '잭팟', 'J A C K P O T', '255,215,90'); p.invul = 160; p.vx = 0;
      const r = Math.random(); let res, mul, text, win = true;
      if (r < 0.12) { res = ['seven', 'seven', 'seven']; mul = 8; text = 'JACKPOT !!!'; }
      else if (r < 0.30) { const s = choose(['bar', 'cherry', 'star', 'bell']); res = [s, s, s]; mul = 4; text = 'TRIPLE !'; }
      else if (r < 0.70) { const s = choose(SLOT_SYM), o = choose(SLOT_SYM.filter(x => x !== s)), pos = randi(0, 2); res = [s, s, s]; res[pos] = o; mul = 2.2; text = 'DOUBLE'; }
      else { res = SLOT_SYM.slice().sort(() => Math.random() - 0.5).slice(0, 3); mul = 1.2; text = 'TRY AGAIN'; win = false; }
      p.slotMul = mul; Game.slot = { t: 0, life: 110, res, text, win };
    },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      const S = Game.slot; if (S) { S.t++; if (S.t === 24 || S.t === 40 || S.t === 56) Sfx.wlayer('dice', 1, false); if (S.t >= S.life) Game.slot = null; }
      if (f === 70) {
        const mul = p.slotMul || 1;
        Sfx.wlayer('coin', 3, true); Game.flashScreen(0.4, '255,230,150'); Game.addShake(8 + mul * 2);
        const hd = WS.hd({ dmg: 8 * mul, kx: 6, kz: 8, airKz: 8, stun: 50, stop: 8 + mul, shake: 8 + mul, fx: 'heavy', power: 1.4 + mul * 0.15 });
        for (const e of WS.onScreen()) {
          const X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
          FF.impact(X, Y, '255,215,90', 0.8 + mul * 0.1);
          FF.spray('coin', X, Y, Math.min(16, 4 + mul * 2), { col: '255,215,90', ang: -Math.PI / 2, spread: 1.2, v0: 4, v1: 11, grav: 0.45, l0: 30, l1: 46 });
          for (let i = 0; i < Math.min(8, Math.round(mul * 2)); i++) Game.pickups.push(new Pickup('gold', e.x, e.y, 60, randi(30, 80) * Math.ceil(mul / 2)));
          applyHit(p, e, hd, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
        }
      }
    },
    end() { Game.slot = null; },
  },
});

forgeDef('w21', {
  name: '대포 일제사격', mp: 140, cd: 9, ico: ['cannon', '255,190,90'],
  desc: '곡도를 치켜들어 신호하면 아군 함선이 대포 세 발을 쏜다. 적이 있는 곳에 붉은 X 표식이 찍히고, 포탄이 연기 꼬리를 끌며 차례로 떨어져 폭발한다.',
  act: {
    anim: 'win', len: 36, cancel: 24, atkCancel: 20,
    update(p, f) {
      p.vx *= 0.5;
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('coin', 2, true);
        const list = WS.nearest(p.x, p.y, 3, 800);
        for (let i = 0; i < 3; i++) {
          const e = list[i] || list[0];
          const x = e ? e.x + rand(-30, 30) : p.x + p.facing * (260 + i * 200), y = e ? e.y : clamp(p.y + (i - 1) * 40, 0, DEPTH);
          FX.add('world', new FCannonball(p, clamp(x, Game.room.minX, Game.room.maxX), y, i * 9));
        }
      }
    },
  },
}, {
  name: '황금 약탈', mp: 480, cd: 42, ico: ['chest', '255,215,90'],
  desc: '보물 상자를 던진다. 적이 몰린 곳에서 뚜껑이 열리며 빛줄기와 함께 3초 동안 금화가 분수처럼 쏟아져 적을 때리고, 진짜 금화도 바닥에 떨어진다. 마지막에 상자가 폭발한다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '황금 약탈', '黃 金 掠 奪', '255,215,90', { bars: 60, dim: 0.3 }); p.invul = 100; p.vx = 0; },
    update(p, f) {
      if (f === 8) {
        const list = WS.onScreen();
        let best = null, bn = -1;
        for (const e of list) { const n = list.filter(o => Math.abs(o.x - e.x) < 300).length; if (n > bn) { bn = n; best = e; } }
        const x = best ? best.x : p.x + p.facing * 300, y = best ? best.y : p.y;
        FX.add('world', new FTreasure(p, x, y)); p.bladeGlow = 2; Sfx.wlayer('coin', 2, false);
      }
      if (f === 30) forgeUndim(20);
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w22', {
  name: '톱니 투척', mp: 120, cd: 8, ico: ['gear', '255,190,120'],
  desc: '금속 톱날 두 개를 던진다. 톱날은 불꽃을 튀기며 적을 갈아내다가 벽에 부딪혀 증기를 뿜으며 튕기고, 세 번 튕기면 멈춘다.',
  act: {
    anim: 'a2', len: 26, cancel: 14, atkCancel: 12,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 4) FF.spray('smoke', p.x - p.facing * 10, sy(p.y, 90), 4, { col: '240,240,240', ang: -Math.PI / 2, spread: 0.5, v0: 1, v1: 3, r0: 10, r1: 16, grow: 0.4 });
      if (f === 6) {
        Sfx.pplay('swingBig'); Sfx.wlayer('steam', 2, true);
        FX.add('world', new FSaw(p, p.x + p.facing * 40, p.y - 22, p.facing * 12));
        FX.add('world', new FSaw(p, p.x + p.facing * 40, p.y + 22, p.facing * 9));
      }
    },
  },
}, {
  name: '기관포 모드', mp: 480, cd: 42, ico: ['gun', '255,190,120'],
  desc: '검이 증기를 뿜으며 여섯 총열의 기관포로 변형된다. 5초 동안 제자리(천천히 이동 가능)에서 가장 가까운 적에게 예광탄을 퍼붓고 탄피가 쏟아진다. 그동안 피격에도 흔들리지 않는다.',
  act: {
    anim: 'ebImpact', len: 320, cancel: 320, atkCancel: 320,
    start(p) { WS.cutin(p, '기관포 모드', 'G A T L I N G', '255,190,120'); p.invul = 40; p.vx = 0; FX.add('world', new FGatling(p)); },
    update(p, f) {
      p.armorF = true; p.bladeGlow = 0;
      const ax = Input.axisX(); p.vx = ax * 1.3; p.vy = Input.axisY() * 1;
      if (f === 20) { FF.spray('smoke', p.x, sy(p.y, 80), 14, { col: '240,240,240', v0: 1, v1: 5, r0: 16, r1: 28, l0: 30, l1: 50, grow: 0.4 }); Sfx.wlayer('steam', 3, true); }
      if (f < 40) return;
      if (f >= 300) { p.actDone = true; return; }
      if (f % 3 === 0) {
        const t = WS.nearest(p.x, p.y, 1, 1000)[0];
        const d = t ? sign(t.x - p.x) || p.facing : p.facing;
        if (t) p.facing = d;
        const mx = p.x + d * 108, my = sy(p.y, p.z + 78) + rand(-4, 4);
        FX.add('world', new FP(mx, my, { kind: 'glow', col: '255,220,140', r: 26, life: 4 }));
        FX.add('world', new FP(mx, my, { kind: 'star', col: '255,240,190', r: 14, life: 3 }));
        FX.add('world', new Debris(p.x + d * 20, p.y, 80, { vx: -d * rand(1, 3), vz: rand(3, 6), s: 2.4, col: ['#f0c060', '#c89030'], life: 30 }));
        if (t) {
          const tx = t.x + rand(-10, 10), ty = sy(t.y, t.z + t.h * 0.5) + rand(-14, 14), ang = Math.atan2(ty - my, tx - mx), L = Math.hypot(tx - mx, ty - my);
          FX.add('world', new FRun(4, r => { }, { draw: (ctx, r) => { const k0 = r.t / 4, k1 = Math.min(1, k0 + 0.45); ctx.strokeStyle = 'rgba(255,230,150,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx + Math.cos(ang) * L * k0, my + Math.sin(ang) * L * k0); ctx.lineTo(mx + Math.cos(ang) * L * k1, my + Math.sin(ang) * L * k1); ctx.stroke(); } }));
          Gear.later(2, () => { if (t.hittable()) { applyHit(p, t, WH.stBullet, { noStopAtt: true, dir: d, hz: 60 }); FF.spray('spark', tx, ty, 3, { col: '255,220,140', v0: 2, v1: 6, l0: 8, l1: 14, r0: 2, r1: 3 }); } });
        }
        Sfx.pplay('swing', 0.5, 1.7 + Math.random() * 0.3); if (f % 6 === 0) Game.addShake(2);
      }
    },
  },
});

forgeDef('w23', {
  name: '태양 광선', mp: 150, cd: 9, ico: ['beam', '255,225,110'],
  desc: '칼끝에 작은 태양을 모았다가 일렁이는 광선으로 쏘아 보낸다. 광선이 위아래로 천천히 쓸면서 닿은 모든 적을 태우고 땅을 그을린다.',
  act: {
    anim: 'drawReady', len: 62, cancel: 52, atkCancel: 52,
    start(p) { p.vx = 0; Sfx.wlayer('sun', 1, false); },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      if (f < 14) {
        p.bladeGlow = 0.6 + f * 0.1;
        if (f === 3) FX.add('ground', new FRing(p.x, sy(p.y, 0), 130, 10, 14, { col: SUN, w: 6 }));
        FX.add('world', new FP(p.x + rand(-150, 150), sy(p.y, rand(0, 200)), { kind: 'glow', col: SUN, tx: p.x + p.facing * 50, ty: sy(p.y, 70), pull: 0.08, r: 4, life: 16 }));
      }
      if (f === 14) { swingT(p, 'a3', 1.2); FX.add('world', new FSunRay(p)); Sfx.wlayer('sun', 3, true); Sfx.pplay('swingBig'); Game.flashScreen(0.2, '255,245,200'); }
      if (f > 14 && f < 50) p.bladeGlow = 2;
    },
  },
}, {
  name: '정오의 태양', mp: 480, cd: 42, ico: ['sun', '255,215,90'],
  desc: '하늘에 홍염이 이글거리는 태양을 띄운다. 2.5초 동안 태양이 점점 커지며 화면 안의 적을 태우고, 마지막에 모든 적에게 빛기둥이 내리꽂힌다.',
  act: {
    anim: 'ultUp', len: 80, cancel: 70, atkCancel: 62,
    start(p) { forgeCine(p, '정오의 태양', '正 午 太 陽', '255,215,90', { bars: 80, dim: 0.2 }); p.invul = 190; p.vx = 0; },
    update(p, f) {
      if (f === 8) { p.bladeGlow = 2.5; FX.add('top', new FNoonSun(p)); FF.screen({ col: '255,200,90', a: 0.1, life: 150, fin: 30, fout: 10 }); Sfx.play('charge'); Sfx.wlayer('sun', 3, false); }
      if (f === 60) forgeUndim(20);
    },
    end() { forgeUndim(10); },
  },
});
