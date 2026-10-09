'use strict';
// ============================================================
//  보스 몸체 : 보스마다 생김새·움직임·공격이 완전히 다르다
//   CBoss 는 Boss(체력·무력화·사망 연출)를 그대로 쓰고,
//   그림 / 애니메이션 / AI / 패턴만 CREATURES[종류] 에서 가져온다.
// ============================================================
const CREATURES = {};

// ---------- 보스 공격 판정 ----------
const CH = {
  light: { dmg: 0.6, kx: 4, stun: 24, stop: 6, shake: 4, fx: 'blunt', sfx: 'hurt' },
  mid: { dmg: 0.9, kx: 7, kz: 7, stun: 30, stop: 8, shake: 6, fx: 'heavy', sfx: 'heavy', down: true },
  heavy: { dmg: 1.2, kx: 9, kz: 10, stun: 30, stop: 10, shake: 9, fx: 'heavy', sfx: 'heavy', down: true },
  launch: { dmg: 0.9, kx: 2, kz: 12, stun: 30, stop: 7, shake: 6, fx: 'none', sfx: 'hurt', down: true },
  shot: { dmg: 0.6, kx: 4, kz: 5, stun: 24, stop: 5, shake: 3, fx: 'none', sfx: 'hurt', down: true },
  tick: { dmg: 0.22, kx: 1, stun: 12, stop: 2, shake: 1, fx: 'none', sfx: 'hurt' },
  push: { dmg: 0.3, kx: 14, kz: 5, stun: 30, stop: 4, shake: 4, fx: 'none', sfx: 'hurt', down: true },
};

// ---------- 그리기 도우미 ----------
const DR = {
  ol: '#0c0608',
  ell(ctx, x, y, rx, ry, fill, rot = 0, w = 2) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
    if (w) { ctx.lineWidth = w * 2; ctx.strokeStyle = DR.ol; ctx.stroke(); }
    ctx.fillStyle = fill; ctx.fill();
  },
  poly(ctx, pts, fill, w = 2) { olPoly(ctx, pts, fill, DR.ol, w); },
  cap(ctx, x0, y0, x1, y1, r0, r1, fill, w = 2) {
    ctx.beginPath(); capsulePath(ctx, { x: x0, y: y0 }, { x: x1, y: y1 }, r0, r1);
    if (w) { ctx.lineWidth = w * 2; ctx.strokeStyle = DR.ol; ctx.stroke(); }
    ctx.fillStyle = fill; ctx.fill();
  },
  glow(ctx, x, y, r, col, a = 1, sx = 1, sy2 = 1) {
    const g = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x, y, r, col, a, sx, sy2); ctx.globalCompositeOperation = g;
  },
  line(ctx, pts, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); },
  ease: (u, a, b) => clamp((u - a) / (b - a), 0, 1),
};

// ---------- 공격 도우미 ----------
const BX = {
  pl() { const p = Game.player; return p && p.hp > 0 && p.invul <= 0 && p.state !== 'down' && p.state !== 'getup' && p.state !== 'dead' ? p : null; },
  hitAt(b, x, y, rx, ry, hd, hmax = 150, set) {
    const p = BX.pl(); if (!p || (set && set.has(p))) return false;
    const dx = (p.x - x) / rx, dy = (p.y - y) / ry;
    if (dx * dx + dy * dy > 1 || p.z > hmax) return false;
    if (set) set.add(p);
    applyHit(b, p, hd, { dir: sign(p.x - x) || b.facing, noStopAtt: true });
    return true;
  },
  // 선분 (깊이는 2배로 계산) 근처
  hitSeg(b, x0, y0, x1, y1, wd, hd, hmax = 150, set) {
    const p = BX.pl(); if (!p || (set && set.has(p))) return false;
    const ax = x1 - x0, ay = (y1 - y0) * 2, px = p.x - x0, py = (p.y - y0) * 2, L = ax * ax + ay * ay || 1;
    const u = clamp((px * ax + py * ay) / L, 0, 1), d = Math.hypot(px - ax * u, py - ay * u);
    if (d > wd || p.z > hmax) return false;
    if (set) set.add(p);
    applyHit(b, p, hd, { dir: sign(p.x - b.x) || b.facing, noStopAtt: true });
    return true;
  },
  // 정면 원뿔 (브레스 / 화염방사)
  cone(b, len, w0, w1, hd, hmax = 160) {
    const p = BX.pl(); if (!p) return false;
    const rel = (p.x - b.x) * b.facing;
    if (rel < 10 || rel > len || p.z > hmax) return false;
    if (Math.abs(p.y - b.y) > w0 + (w1 - w0) * rel / len) return false;
    applyHit(b, p, hd, { dir: b.facing, noStopAtt: true });
    return true;
  },
  blast(b, x, y, rx, ry, hd, col, o = {}) {
    const gy = sy(y, 0);
    if (o.style !== 'quiet') {
      if (o.style === 'pillar') FX.add('world', new Pillar(x, y, rx * 0.8, o.h || 300, 28, col, '255,240,225'));
      FX.add('ground', new Ring(x, gy, 10, rx * 2, 20, { col, w: 12 }));
      FX.add('world', new Flash(x, gy - 20, 20, rx * 2.2, 18, col, 0.8));
      Hitfx.dust(x, gy, 8, rx * 0.6);
      for (let k = 0; k < 8; k++) FX.add('world', new Debris(x, y, 2, { vx: rand(-5, 5), vz: rand(5, 11), s: rand(2, 5), glow: o.glow ? col : null }));
      Sfx.play(o.sfx || 'thud', 0.9); Game.addShake(o.shake ?? 6);
    }
    return BX.hitAt(b, x, y, rx, ry, hd, o.hmax ?? 150);
  },
  tele(x, y, rx, ry, dur, col, onEnd) { return FX.add('ground', new Telegraph(x, y, rx, ry, dur, { col, onEnd })); },
  lane(x0, x1, y, ry, dur, col, onEnd) { return FX.add('ground', new Telegraph(x0, y, 0, ry, dur, { shape: 'rect', w: x1 - x0, dir: 1, col, onEnd })); },
  shot(b, x, y, z, vx, vy, vz, o) { const s = new BShot(b, x, y, z, vx, vy, vz, o); Game.projectiles.push(s); return s; },
  zone(b, x, y, o) { return FX.add('ground', new BZone(b, x, y, o)); },
  arc(x0, y0, z0, x1, y1, z1, T, g) { return [(x1 - x0) / T, (y1 - y0) / T, (z1 - z0) / T + 0.5 * g * T]; },
  summon(b, n, hpMul = 0.3, kinds) {
    const D = Game.dungeon.def, r = Game.room, pool = kinds || D.pool.map(q => q[0]);
    for (let i = 0; i < n; i++) {
      const en = makeEnemy(choose(pool), clamp(b.x + (i % 2 ? 1 : -1) * rand(160, 420), r.minX + 40, r.maxX - 40), rand(30, DEPTH - 30));
      en.hpMax = en.hp = Math.round(en.hpMax * hpMul);
      en.spawnIn(i * 8); Game.enemies.push(en);
    }
  },
  pullPlayer(x, y, str) {
    const p = Game.player; if (!p || p.hp <= 0 || p.state === 'dead') return;
    const r = Game.room;
    p.x = clamp(p.x + clamp(x - p.x, -str, str), r.minX, r.playerMaxX()); p.y = clamp(p.y + clamp(y - p.y, -str * 0.5, str * 0.5), 0, DEPTH);
  },
  // 돌진 패턴 생성기 (예고선 → 직선 돌진 → 벽에 부딪혀 멈춤, repeat 회 왕복)
  dash(o) {
    return {
      anim: o.anim || 'dash', len: 400, armor: [0, 999], counter: 0, cd: o.cd || 300, when: o.when,
      start(b) { b.dPh = 0; b.dN = 0; BX.dashTele(b, o); if (o.start) o.start(b); },
      update(b, f) {
        b.dT = (b.dT || 0) + 1;
        if (b.dPh === 0) { b.vx = 0; b.vy = 0; if (b.dT >= (o.tele || 40)) { b.dPh = 1; b.dT = 0; b.swing = newSwing(); Sfx.play('dash', 1, 0.6); Sfx.play('roar', 0.4, 1.3); } }
        else if (b.dPh === 1) {
          b.vx = b.facing * (o.speed || 14); b.vy = 0;
          b.hitPlayer(o.hd || CH.mid, { x0: -20, x1: b.w * 1.5, d: 46, z0: 0, z1: b.h * 0.8 });
          if (b.dT % 3 === 0) Hitfx.dust(b.x - b.facing * b.w, sy(b.y, 0), 1, 12);
          if (o.trail && b.dT % (o.trailEvery || 6) === 0) o.trail(b);
          const r = Game.room;
          if (b.x <= r.minX + 12 || b.x >= r.maxX - 12 || b.dT > 110) {
            b.dPh = 2; b.dT = 0; b.vx = -b.facing * 3; Game.addShake(10); Sfx.play('explode', 0.5);
            FX.add('world', new Flash(b.x + b.facing * b.w, sy(b.y, b.h * 0.4), 20, 180, 18, b.elem, 0.8));
            if (o.end) o.end(b);
          }
        } else {
          b.vx *= 0.85;
          if (b.dT >= (o.pause || 26)) {
            b.dN++;
            if (b.dN < (o.repeat || 1)) { b.facing = -b.facing; b.dPh = 0; b.dT = 0; BX.dashTele(b, o, 26); }
            else b.af = 9999;
          }
        }
      },
      cancel(b) { b.dT = 0; },
    };
  },
  dashTele(b, o, dur) {
    const p = Game.player;
    if (p && o.aimY !== false) b.y = clamp(lerp(b.y, p.y, 0.7), 0, DEPTH);
    const r = Game.room, L = b.facing > 0 ? r.maxX - b.x : b.x - r.minX;
    FX.add('ground', new Telegraph(b.x, b.y, 0, o.ry || 46, dur || o.tele || 40, { shape: 'rect', w: L, dir: b.facing, col: b.elem }));
    b.dT = 0;
  },
};

// ---------- 보스 투사체 (플레이어를 맞힌다) ----------
class BShot {
  constructor(owner, x, y, z, vx, vy, vz, o = {}) {
    Object.assign(this, { owner, x, y, z, vx, vy, vz, t: 0 }, o);
    this.r = o.r || 14; this.life = o.life || 260; this.hd = o.hd || CH.shot; this.style = o.style || 'orb';
    this.col = o.col || owner.elem || '255,140,80'; this.facing = 1; this.w = this.r; this.d = this.r;
  }
  update() {
    this.t++;
    const p = Game.player;
    if (this.home && p && this.t < (this.homeT || 120)) {
      const sp = Math.hypot(this.vx, this.vy) || 1, a = Math.atan2((p.y - this.y) * 2, p.x - this.x), cur = Math.atan2(this.vy * 2, this.vx);
      const na = cur + clamp(Math.atan2(Math.sin(a - cur), Math.cos(a - cur)), -this.home, this.home);
      this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp / 2;
    }
    if (this.landed) { this.vx = this.vy = this.vz = 0; this.z = 0; }
    this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.z += this.vz; this.vz -= this.grav || 0;
    if (this.roll) { this.z = this.r * 0.8; this.vz = 0; }
    if (this.z <= 0 && !this.roll) {
      if (this.bounce && this.vz < -1) { this.z = 0; this.vz = -this.vz * this.bounce; this.bn = (this.bn || 0) + 1; Sfx.play('land', 0.4, 1.4); if (this.bn > (this.maxBounce || 4)) return this.end(); }
      else if (this.floor) { if (!this.landed) { this.landed = true; this.landT = this.t; if (this.onLand) this.onLand(this); } }
      else return this.end();
    }
    const pl = BX.pl();
    if (pl && !this.harmless && Math.abs(pl.x - this.x) < pl.w + this.r && Math.abs(pl.y - this.y) < pl.d + this.r * 0.8 && this.z > pl.z - this.r && this.z < pl.z + pl.h) {
      applyHit(this.owner, pl, this.hd, { dir: sign(this.vx) || (sign(pl.x - this.x) || 1), hz: this.z, noStopAtt: true });
      if (!this.pierce) return this.end(true);
    }
    if (this.prox && pl && this.landed && this.t - this.landT > 20 && Math.hypot(pl.x - this.x, (pl.y - this.y) * 2) < this.prox) return this.end(true);
    if (this.tick) this.tick(this);
    const r = Game.room;
    if (this.t > this.life || this.x < r.minX - 160 || this.x > r.maxX + 160 || this.dead) return this.end();
    return true;
  }
  end(hit) {
    if (this.done) return false;
    this.done = true;
    if (this.onEnd) this.onEnd(this, hit);
    else { FX.add('world', new Flash(this.x, sy(this.y, this.z), 8, this.r * 4, 12, this.col, 0.8)); }
    return false;
  }
  drawShadow(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), this.r * 1.1, this.r * 0.35, 0, 0, TAU); ctx.fill(); }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z), t = this.t, c = this.col, r = this.r;
    ctx.save(); ctx.translate(X, Y);
    switch (this.style) {
      case 'rock':
        ctx.rotate(t * 0.2 * (this.vx >= 0 ? 1 : -1));
        DR.poly(ctx, [-r, -r * 0.3, -r * 0.4, -r, r * 0.6, -r * 0.8, r, r * 0.2, r * 0.3, r, -r * 0.7, r * 0.7], '#6a6258', 1.6);
        ctx.fillStyle = '#9a9080'; ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.3, r * 0.3, 0, TAU); ctx.fill();
        break;
      case 'icicle':
        DR.poly(ctx, [-r * 0.5, -r * 3, r * 0.5, -r * 3, 0, r * 1.2], '#bfeaff', 1.4);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -r * 2.6, 3, r * 2.6);
        break;
      case 'missile': {
        const a = Math.atan2(-this.vz + this.vy, this.vx);
        ctx.rotate(a);
        DR.glow(ctx, -r * 1.6, 0, r * 1.6, '255,170,60', 0.9);
        DR.cap(ctx, -r, 0, r, 0, r * 0.45, r * 0.4, '#5a6070', 1.2);
        DR.poly(ctx, [r, -r * 0.4, r * 1.6, 0, r, r * 0.4], '#d84030', 1);
        break;
      }
      case 'mine': {
        const bl = this.landed && Math.floor(t / (t - (this.landT || 0) > 200 ? 4 : 10)) % 2;
        DR.ell(ctx, 0, 0, r, r * 0.45, '#3a3f4a', 0, 1.4);
        ctx.fillStyle = bl ? '#ff3030' : '#601010'; ctx.beginPath(); ctx.arc(0, -3, 3.5, 0, TAU); ctx.fill();
        if (bl) DR.glow(ctx, 0, -3, 22, '255,60,40', 0.8);
        break;
      }
      case 'shell':
        DR.ell(ctx, 0, 0, r, r * 0.8, '#2a2a30', 0, 1.4);
        DR.glow(ctx, 0, 0, r * 1.6, '255,140,60', 0.5);
        break;
      case 'scarab':
        ctx.scale(sign(this.vx) || 1, 1);
        DR.ell(ctx, 0, 0, r, r * 0.6, '#2a4a3a', 0, 1.2);
        ctx.fillStyle = '#5ac08a'; ctx.beginPath(); ctx.ellipse(-2, -2, r * 0.7, r * 0.35, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#120a06'; ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) { const s = Math.sin(t * 0.8 + i) * 3; ctx.beginPath(); ctx.moveTo(i * 5, 3); ctx.lineTo(i * 6 + s, 9); ctx.stroke(); }
        break;
      case 'glob':
        DR.glow(ctx, 0, 0, r * 2, '140,235,80', 0.6);
        DR.ell(ctx, 0, 0, r, r * 0.85, '#5aa02a', 0, 1.2);
        ctx.fillStyle = '#c8ff90'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, TAU); ctx.fill();
        break;
      case 'gear':
        ctx.rotate(t * 0.3 * (this.vx >= 0 ? 1 : -1));
        ctx.fillStyle = '#7a5a20'; ctx.strokeStyle = DR.ol; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r : r * 0.8; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.stroke(); ctx.fill();
        ctx.fillStyle = '#d8b050'; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, TAU); ctx.fill();
        break;
      case 'planet': {
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        g.addColorStop(0, '#ffe0a0'); g.addColorStop(1, '#7a3a60');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,230,180,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.7, r * 0.4, -0.3, 0, TAU); ctx.stroke();
        break;
      }
      case 'spear': {
        const a = Math.atan2(-this.vz + this.vy, this.vx);
        ctx.rotate(a); DR.glow(ctx, 0, 0, r * 2.5, c, 0.6, 1.8, 0.5);
        ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.moveTo(r * 2.2, 0); ctx.lineTo(-r * 2.2, -r * 0.3); ctx.lineTo(-r * 2.2, r * 0.3); ctx.fill();
        break;
      }
      case 'feather': {
        ctx.rotate(Math.atan2(this.vy, this.vx));
        DR.glow(ctx, 0, 0, 22, c, 0.5);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 5, 0, 0, TAU); ctx.fill();
        break;
      }
      case 'bat':
        ctx.scale(sign(this.vx) || 1, 1);
        ctx.fillStyle = '#1a0408'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-10, -12 + Math.sin(t) * 6, -20, -2); ctx.quadraticCurveTo(-8, 0, 0, 4); ctx.quadraticCurveTo(8, 0, 20, -2); ctx.quadraticCurveTo(10, -12 + Math.sin(t) * 6, 0, 0); ctx.fill();
        ctx.fillStyle = '#ff3040'; ctx.fillRect(2, -2, 2, 2);
        break;
      case 'drone':
        DR.ell(ctx, 0, 0, r, r * 0.5, '#2a2440', 0, 1.2);
        ctx.fillStyle = `rgb(${c})`; ctx.fillRect(-r * 0.6, -1.5, r * 1.2, 3);
        DR.glow(ctx, 0, 0, r * 1.5, c, 0.6);
        break;
      case 'shard':
        ctx.rotate(t * 0.25);
        DR.poly(ctx, [0, -r, r * 0.5, 0, 0, r, -r * 0.5, 0], '#c8b8ff', 1.2);
        DR.glow(ctx, 0, 0, r * 1.8, c, 0.5);
        break;
      case 'seed':
        DR.ell(ctx, 0, 0, r, r * 0.8, '#5a3a18', t * 0.2, 1.2);
        ctx.fillStyle = '#a8d040'; ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.4, r * 0.2, 0, 0, TAU); ctx.fill();
        break;
      case 'skullfire':
        DR.glow(ctx, 0, 0, r * 2.4, c, 0.8);
        DR.ell(ctx, 0, 0, r * 0.8, r * 0.7, '#e8e0d0', 0, 1.2);
        ctx.fillStyle = '#100808'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.2, 0, TAU); ctx.arc(r * 0.3, -r * 0.1, r * 0.2, 0, TAU); ctx.fill();
        break;
      default:
        DR.glow(ctx, 0, 0, r * 2.2, c, 0.9);
        DR.glow(ctx, 0, 0, r * 0.9, '255,255,255', 0.9);
    }
    ctx.restore();
  }
}

// ---------- 플레이어를 해치는 바닥 지대 ----------
class BZone {
  constructor(owner, x, y, o) {
    Object.assign(this, { owner, x, y, t: 0 }, o);
    this.every = o.every || 24; this.life = o.life || 200; this.hd = o.hd || CH.tick; this.col = o.col || owner.elem;
  }
  update() {
    this.t++;
    const p = Game.player;
    if (this.follow && p) { this.x += clamp(p.x - this.x, -this.follow, this.follow); this.y += clamp(p.y - this.y, -this.follow * 0.5, this.follow * 0.5); }
    if (this.pull && p && Math.abs(p.x - this.x) < this.rx * 1.8 && this.t > (this.delay || 0)) BX.pullPlayer(this.x, this.y, this.pull);
    if (this.slow && p && Math.pow((p.x - this.x) / this.rx, 2) + Math.pow((p.y - this.y) / this.ry, 2) < 1) p.slowT = Math.max(p.slowT || 0, 8);
    if (this.t % this.every === 0 && this.t > (this.delay || 0)) BX.hitAt(this.owner, this.x, this.y, this.rx, this.ry, this.hd, this.hmax || 70);
    if (this.onTick) this.onTick(this);
    return this.t < this.life && !this.owner.dead;
  }
  draw(ctx) {
    const u = this.t / this.life, a = Math.min(1, this.t / 10, (1 - u) * 5), gy = sy(this.y, 0), T = Game.time, c = this.col;
    ctx.save();
    switch (this.kind) {
      case 'vortex':
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { ctx.strokeStyle = `rgba(${c},${0.35 * a})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx * (1 - i * 0.22), this.ry * (1 - i * 0.22), 0, T * 0.1 * (i + 1), T * 0.1 * (i + 1) + 4); ctx.stroke(); }
        drawGlow(ctx, this.x, gy, this.rx * 0.6, c, 0.4 * a, 1, 0.4);
        break;
      case 'tornado':
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 10; i++) { const yy = gy - i * 22, rr = 20 + i * 7; ctx.strokeStyle = `rgba(${c},${0.3 * a})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(this.x + Math.sin(T * 0.2 + i) * 8, yy, rr, rr * 0.25, 0, T * 0.3 + i, T * 0.3 + i + 4); ctx.stroke(); }
        break;
      case 'cloud':
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) drawGlow(ctx, this.x + Math.cos(i * 1.7 + T * 0.02) * this.rx * 0.6, gy - 30 + Math.sin(i * 2.1) * 20, this.rx * 0.6, c, 0.22 * a);
        break;
      default:
        ctx.fillStyle = `rgba(${c},${0.28 * a})`; ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx, this.ry, 0, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, this.x, gy, this.rx, c, 0.3 * a, 1, this.ry / this.rx);
        for (let i = 0; i < 4; i++) { const ph = (T * 0.04 + i * 0.25) % 1; drawGlow(ctx, this.x + Math.cos(i * 2.3) * this.rx * 0.5, gy + Math.sin(i * 1.7) * this.ry * 0.5 - ph * 16, 8, c, (1 - ph) * a); }
    }
    ctx.restore();
  }
}

// 바닥 예고선 (선분)
class BLine {
  constructor(x0, y0, x1, y1, life, col, w = 30) { Object.assign(this, { x0, y0, x1, y1, life, col, w, t: 0 }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, pu = 0.5 + Math.sin(this.t * 0.5) * 0.5;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${this.col},${0.18 + pu * 0.12})`; ctx.lineWidth = this.w;
    ctx.beginPath(); ctx.moveTo(this.x0, sy(this.y0, 0)); ctx.lineTo(this.x1, sy(this.y1, 0)); ctx.stroke();
    ctx.strokeStyle = `rgba(${this.col},0.9)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.x0, sy(this.y0, 0)); ctx.lineTo(lerp(this.x0, this.x1, u), sy(lerp(this.y0, this.y1, u), 0)); ctx.stroke();
    ctx.restore();
  }
}

// ---------- 분노 (공통) ----------
const CROAR = {
  anim: 'roar', len: 80, armor: [0, 999], counter: 0,
  start(b) { b.invul = 80; Sfx.play('roar', 1.2, b.C.roarPitch || 1); },
  update(b, f) {
    b.vx = 0; b.vy = 0;
    if (f === 14) {
      Game.addShake(12);
      FX.add('ground', new Ring(b.x, sy(b.y, 0), 30, 420, 34, { w: 20, col: b.auraCol }));
      FX.add('world', new Flash(b.x, sy(b.y, b.h * 0.6), 60, 420, 30, b.auraCol, 0.6));
      if (!b.enraged) { b.enraged = true; Game.bigText('분노', '#ff8a6a', '#b01010'); }
    }
    if (f > 14 && f < 60 && f % 6 === 0) Game.addShake(3);
  },
};

// ============================================================
//  CBoss
// ============================================================
class CBoss extends Boss {
  constructor(x, y, def) {
    super(x, y, def);
    const C = this.C = CREATURES[def.body];
    this.cape = null;
    this.w = C.w; this.h = C.h; this.d = C.d || 26; this.shadowMul = C.shadow || 1.4;
    this.speed = C.speed || 1.8; this.scale = 1;
    this.acts = Object.assign({ roar: CROAR }, C.acts);
    for (const k in this.acts) this.acts[k].name = k;
    this.cds = {}; for (const k in C.acts) this.cds[k] = C.acts[k].cd0 ?? randi(60, 160);
    this.pal = Object.assign({}, C.pal, def.pal || {});
    this.fpal = mapPal(this.pal, c => mixHex(c, '#ffffff', 0.7));
    this.anm = 'idle'; this.anmT = 0;
    if (C.init) C.init(this);
  }
  play(name, blend, speed, force) { if (force || this.anm !== name) { this.anm = name; this.anmT = 0; } }
  stepAnim() { this.anmT++; }
  updateCape() { }
  glint() { FX.add('world', new Glint(this.x + this.facing * this.w * 1.3, sy(this.y, this.h * 0.65), 24)); }
  dmgMul(att) { return this.C.dmgMul ? this.C.dmgMul(this, att) : 1; }
  update() { if (this.C.tick && this.hitstop <= 0 && !this.dying) this.C.tick(this); super.update(); }
  stAttack() {
    super.stAttack();
    if (this.state === 'idle' && this.restNext) { this.aiWait += this.restNext; this.restNext = 0; }
  }
  interrupt() { if (this.C.onInterrupt) this.C.onInterrupt(this); super.interrupt(); }

  ai(p) {
    const C = this.C, dx = p.x - this.x, adx = Math.abs(dx), ady = Math.abs(p.y - this.y), want = sign(dx) || 1;
    if (!C.noTurn) this.facing = want;
    if (!this.enraged && this.hp < this.hpMax * 0.5) { this.startAttack('roar'); this.restNext = 20; return; }
    const keep = C.keep || 200;
    if (this.aiWait > 0) {
      this.aiWait--;
      if (C.stationary) { this.vx *= 0.8; this.vy *= 0.8; this.play('idle'); }
      else if (adx > keep + 140 || ady > 70) this.moveTo(p.x - want * keep, clamp(p.y, 0, DEPTH), this.speed * 0.8);
      else { this.vx *= 0.8; this.vy *= 0.8; this.play('idle'); }
      return;
    }
    const opts = [];
    for (const k in C.acts) { const a = C.acts[k]; if (this.cds[k] > 0 || (a.when && !a.when(this, p, adx, ady))) continue; opts.push(k); }
    if (opts.length) {
      const k = choose(opts), a = C.acts[k];
      this.startAttack(k); this.cds[k] = Math.round(a.cd * (this.enraged ? 0.8 : 1)); this.restNext = C.rest ?? 45;
      return;
    }
    if (C.stationary) { this.aiWait = 15; this.play('idle'); return; }
    if (this.moveTo(p.x - want * keep, clamp(p.y, 0, DEPTH), this.speed)) this.aiWait = randi(10, 30);
  }

  kf() { const a = this.act; return { t: Game.time + this.id * 17, a: this.anm, at: this.anmT, act: a ? a.name : null, af: this.af, u: a ? this.af / a.len : 0, st: this.state, en: this.enraged }; }

  draw(ctx) {
    if (!this.visible || this.alpha <= 0) return;
    if (this.enraged || this.state === 'break') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, this.x, sy(this.y, this.z + this.h * 0.45), this.h * 0.7 + Math.sin(Game.time * 0.15) * 14, this.state === 'break' ? '255,220,120' : this.auraCol, 0.24 * this.alpha, 0.8, 1.2);
      ctx.restore();
    }
    ctx.save();
    const ox = this.hitstop > 0 && this.shakeHit ? (this.hitstop % 2 ? 1 : -1) * 4 : 0;
    ctx.translate(this.x + ox, sy(this.y, this.z));
    const sq = (this.squash || 0) * 0.3;
    if (this.state === 'dying') ctx.rotate(-0.22 * this.facing * Math.min(1, this.stT / 24));
    ctx.scale(this.facing * (1 - sq * 0.12), 1 + sq * 0.12);
    ctx.globalAlpha = this.alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    this.C.draw(ctx, this, this.flash > 0 ? this.fpal : this.pal, this.kf());
    ctx.restore();
    if (this.st || this.holdT > 0) Status.draw(ctx, this);
  }
  // 보스 체력바 초상화
  portrait(g) {
    const s = 46 / this.h;
    g.save(); g.translate(32, 34 + this.h * s * 0.5); g.scale(s * 1.2, s * 1.2);
    g.lineJoin = 'round'; g.lineCap = 'round';
    this.C.draw(g, this, this.pal, { t: 0, a: 'idle', at: 0, act: null, af: 0, u: 0, st: 'idle', en: false });
    g.restore();
  }
}

// ============================================================
//  1. 석귀 골렘 (잊혀진 신전)
// ============================================================
CREATURES.golem = {
  w: 50, h: 300, d: 30, shadow: 1.6, speed: 1.3, keep: 230, rest: 50, roarPitch: 0.6,
  pal: { rock: ['#2e2b26', '#5c574d', '#8a8375'], dark: ['#1a1814', '#2e2b26', '#3e3a33'] },
  tick(b) { if (b.skinT > 0 && --b.skinT === 0) { FX.add('top', new Label(b.x, sy(b.y, b.h) - 20, '바위 껍질 해제', { col: ['#fff', '#d8c8a0'], size: 20 })); } },
  dmgMul(b) {
    if (!(b.skinT > 0)) return 1;
    b.skinHits = (b.skinHits || 0) + 1;
    Hitfx.sparks(b.x, sy(b.y, b.h * 0.5), -b.facing, 5, { col: '230,210,160' });
    if (b.skinHits >= 14) {
      b.skinT = 0;
      FX.add('top', new Label(b.x, sy(b.y, b.h) - 20, '껍질 파괴!', { col: ['#fffbe0', '#ffb020'], size: 28 }));
      for (let i = 0; i < 24; i++) FX.add('world', new Debris(b.x + rand(-60, 60), b.y, rand(60, 260), { vx: rand(-8, 8), vz: rand(3, 10), s: rand(4, 9) }));
      Sfx.play('explode', 0.8); b.startBreak();
    }
    return 0.25;
  },
  draw(ctx, b, P, k) {
    const t = k.t, R = P.rock, D2 = P.dark;
    let by = Math.sin(t * 0.05) * 3, lean = 0;
    if (k.st === 'break') { by = 50; lean = 0.15; }
    if (k.st === 'hurt') lean = -0.08;
    const walk = k.a === 'walk' ? Math.sin(k.at * 0.12) : 0;
    // 팔 위치 (주먹)
    let fx = 92, fy = -120, bx2 = -88, bky = -125, boulder = null;
    if (k.act === 'punch') {
      const f = k.af;
      if (f < 26) { fx = 60 - f * 2; fy = -170; }
      else if (f < 40) { const e = DR.ease(f, 26, 30); fx = lerp(10, 280, e); fy = lerp(-170, -110, e); }
      else { const e = DR.ease(f, 40, 56); fx = lerp(280, 92, e); fy = -110; }
    } else if (k.act === 'fault') {
      const f = k.af;
      if (f < 36) { const e = DR.ease(f, 0, 30); fx = lerp(92, 40, e); fy = lerp(-120, -330, e); bx2 = lerp(-88, -30, e); bky = lerp(-125, -330, e); }
      else if (f < 70) { const e = DR.ease(f, 36, 41); fx = lerp(40, 110, e); fy = lerp(-330, -30, e); bx2 = lerp(-30, -60, e); bky = lerp(-330, -30, e); by += e * 30; }
    } else if (k.act === 'throw') {
      const f = k.af;
      if (f < 34) { const e = DR.ease(f, 4, 26); fx = lerp(92, 20, e); fy = lerp(-120, -340, e); bx2 = lerp(-88, -20, e); bky = lerp(-125, -340, e); boulder = [0, fy - 40]; }
      else { const e = DR.ease(f, 34, 44); fx = lerp(20, 200, e); fy = lerp(-340, -200, e); }
    } else if (k.act === 'skin' || b.skinT > 0) { fx = 30; fy = -200; bx2 = -30; bky = -205; }
    else if (k.a === 'roar' || k.act === 'roar') { fx = 120; fy = -320; bx2 = -110; bky = -320; }
    ctx.save(); ctx.translate(0, by); ctx.rotate(lean);
    // 떠다니는 돌
    for (let i = 0; i < 5; i++) {
      const a = t * 0.025 + i * TAU / 5, X = Math.cos(a) * 150, Y = -190 + Math.sin(a) * 30;
      if (Math.sin(a) < 0) DR.ell(ctx, X, Y, 14, 11, R[1], a, 1.4);
    }
    // 뒷팔
    DR.cap(ctx, -88, -235, bx2, bky, 30, 26, D2[2], 2);
    DR.ell(ctx, bx2, bky, 38, 34, D2[2], 0.3, 2);
    // 다리
    DR.poly(ctx, [-60, -100, -14, -100, -10 + walk * 12, 0, -66 + walk * 12, 0], R[0], 2);
    DR.poly(ctx, [12, -100, 58, -100, 64 - walk * 12, 0, 8 - walk * 12, 0], R[1], 2);
    // 몸통
    DR.poly(ctx, [-75, -90, 75, -90, 100, -230, 45, -268, -45, -268, -100, -230], R[1], 2.4);
    ctx.fillStyle = R[0]; ctx.beginPath(); polyPath(ctx, [-75, -90, -20, -90, -40, -268, -100, -230]); ctx.fill();
    ctx.fillStyle = R[2]; ctx.beginPath(); polyPath(ctx, [20, -110, 60, -110, 82, -220, 40, -250]); ctx.fill();
    // 빛나는 균열
    const ga = b.skinT > 0 ? 1 : 0.55 + Math.sin(t * 0.08) * 0.2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    DR.line(ctx, [[-20, -120], [5, -160], [-10, -200], [15, -245]], `rgba(${b.elem},${ga})`, 4);
    DR.line(ctx, [[40, -130], [25, -175], [55, -210]], `rgba(${b.elem},${ga})`, 3);
    if (b.skinT > 0) drawGlow(ctx, 0, -180, 200, '230,200,140', 0.35, 0.8, 1.2);
    ctx.restore();
    // 머리
    DR.poly(ctx, [-30, -262, 30, -262, 26, -310, -24, -312], R[1], 2);
    ctx.fillStyle = '#0a0806'; ctx.fillRect(-14, -296, 34, 8);
    DR.glow(ctx, 8, -292, 30, b.enraged ? '255,80,40' : b.elem, 0.9);
    // 어깨 + 앞팔 + 주먹
    DR.ell(ctx, -92, -228, 34, 30, D2[2], 0, 2);
    DR.cap(ctx, 92, -232, fx, fy, 30, 26, R[1], 2);
    DR.ell(ctx, 95, -232, 38, 34, R[2], 0, 2);
    DR.ell(ctx, fx, fy, 42, 38, R[1], 0.2, 2.2);
    ctx.fillStyle = R[2]; ctx.beginPath(); ctx.ellipse(fx + 8, fy - 12, 16, 10, 0.2, 0, TAU); ctx.fill();
    if (boulder) DR.ell(ctx, boulder[0], boulder[1], 52, 44, '#6a6258', 0.4, 2.2);
    for (let i = 0; i < 5; i++) {
      const a = t * 0.025 + i * TAU / 5, X = Math.cos(a) * 150, Y = -190 + Math.sin(a) * 30;
      if (Math.sin(a) >= 0) DR.ell(ctx, X, Y, 14, 11, R[2], a, 1.4);
    }
    ctx.restore();
  },
  acts: {
    punch: {
      anim: 'punch', len: 58, counter: 24, armor: [0, 999], cd: 150, when: (b, p, adx, ady) => adx < 320 && ady < 70,
      start(b) { b.swing = newSwing(); },
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 12) b.glint();
        if (f === 26) Sfx.play('swingBig', 1.2, 0.55);
        if (f >= 27 && f <= 33) b.hitPlayer(CH.heavy, { x0: 20, x1: 310, d: 54, z0: 0, z1: 230 });
        if (f === 30) { const x = b.x + b.facing * 280; for (let i = 0; i < 8; i++) FX.add('world', new Debris(x, b.y, 110, { vx: b.facing * rand(2, 8), vz: rand(2, 8), s: rand(3, 6) })); Game.addShake(8); Sfx.play('thud', 1); }
      },
    },
    fault: {
      anim: 'fault', len: 96, counter: 30, armor: [0, 999], cd: 320, when: (b, p, adx) => adx < 760,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 8) Sfx.play('roar', 0.6, 0.6);
        if (f === 41) {
          Game.addShake(14); Sfx.play('quake', 1);
          FX.add('ground', new Ring(b.x, sy(b.y, 0), 30, 260, 26, { col: '230,200,150', w: 16 }));
          b.faults = [-0.42, 0, 0.42].map(a => {
            const x0 = b.x + b.facing * 70, y0 = b.y, x1 = x0 + b.facing * Math.cos(a) * 660, y1 = clamp(y0 + Math.sin(a) * 300, 0, DEPTH);
            FX.add('ground', new BLine(x0, y0, x1, y1, 26, b.elem, 54));
            return [x0, y0, x1, y1];
          });
        }
        if (f === 67 && b.faults) {
          const set = new Set();
          for (const [x0, y0, x1, y1] of b.faults) {
            for (let i = 0; i <= 6; i++) { const u = i / 6; FX.add('world', new Pillar(lerp(x0, x1, u), lerp(y0, y1, u), 30, 150 + rand(0, 60), 26, '150,120,90', '230,200,160')); }
            BX.hitSeg(b, x0, y0, x1, y1, 40, CH.launch, 150, set);
          }
          Sfx.play('quake', 0.8); Game.addShake(12); b.faults = null;
        }
      },
    },
    throw: {
      anim: 'throw', len: 70, counter: 20, armor: [0, 999], cd: 230, when: (b, p, adx) => adx > 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) Sfx.play('roar', 0.4, 0.7);
        if (f === 34) {
          const p = Game.player, T = 34;
          BX.tele(p.x, p.y, 90, 32, T, b.elem);
          const v = BX.arc(b.x + b.facing * 20, b.y, 380, p.x, p.y, 0, T, 0.5);
          Sfx.play('swingBig', 1.2, 0.5);
          BX.shot(b, b.x + b.facing * 20, b.y, 380, v[0], v[1], v[2], {
            grav: 0.5, r: 32, style: 'rock', hd: CH.mid, onEnd: s => {
              BX.blast(b, s.x, s.y, 90, 34, CH.mid, '200,170,130', { shake: 10 });
              for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; BX.shot(b, s.x, s.y, 12, Math.cos(a) * 5, Math.sin(a) * 2, 0, { roll: true, r: 14, style: 'rock', life: 60, hd: CH.light }); }
            },
          });
        }
      },
    },
    skin: {
      anim: 'skin', len: 44, armor: [0, 999], counter: 0, cd: 640, cd0: 420, when: b => b.hp < b.hpMax * 0.9,
      start(b) { b.skinT = 320; b.skinHits = 0; Sfx.play('quake', 0.5, 1.4); FX.add('top', new Label(b.x, sy(b.y, b.h) - 20, '바위 껍질 : 14번 때려 부숴라!', { col: ['#fff', '#d8c8a0'], size: 22, life: 80 })); },
      update(b) { b.vx = 0; b.vy = 0; },
    },
  },
};

// ============================================================
//  2. 서리 비룡 (얼어붙은 설원)
// ============================================================
CREATURES.wyrm = {
  w: 44, h: 240, d: 30, shadow: 1.3, speed: 2.0, keep: 260, rest: 45, roarPitch: 1.1,
  pal: { body: ['#16384f', '#3d7fa6', '#7cc0e0'], belly: ['#8fb6c9', '#dcf0fa', '#ffffff'], ice: ['#8fd8ff', '#d8f4ff', '#ffffff'] },
  onInterrupt(b) { b.sub = 0; b.invul = 0; },
  draw(ctx, b, P, k) {
    const t = k.t, B = P.body, L = P.belly;
    let sub = b.sub || 0, headX = 40, headY = -230, jaw = 0.15, rear = 0, tail = null;
    if (k.act === 'breath') { const f = k.af; if (f < 34) { headX = 10; headY = -250; jaw = 0.1; } else if (f < 88) { headX = 90; headY = -170; jaw = 0.6; } }
    if (k.act === 'tail') { const f = k.af; rear = -20; tail = f < 44 ? 0 : clamp((f - 44) / 10, 0, 1); }
    if (k.act === 'icicles' || k.act === 'roar' || k.a === 'roar') { headY = -290; headX = 10; jaw = 0.7; }
    if (k.st === 'break') { headY = -120; headX = 70; }
    ctx.save();
    ctx.beginPath(); ctx.rect(-500, -700, 1000, 700); ctx.clip();          // 땅 아래는 숨긴다
    ctx.translate(0, sub * 320);
    // 몸통 마디 (구멍에서 솟아 S자로)
    const seg = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, w = Math.sin(u * 3.2 + t * 0.05) * 32 * (1 - u * 0.6);
      seg.push([lerp(-70, headX - 20, u) + w + rear * (1 - u), lerp(20, headY + 30, Math.pow(u, 0.9))]);
    }
    for (let i = 0; i < seg.length - 1; i++) {
      const [x, y] = seg[i], r = lerp(40, 26, i / 12);
      DR.ell(ctx, x, y, r, r, B[1], 0, 2);
      ctx.fillStyle = L[1]; ctx.beginPath(); ctx.ellipse(x + r * 0.35, y, r * 0.5, r * 0.8, 0, 0, TAU); ctx.fill();
      DR.poly(ctx, [x - r * 0.6, y - r * 0.7, x - r * 0.9, y - r * 1.6, x - r * 0.1, y - r * 0.9], P.ice[0], 1.2);
    }
    // 꼬리 휩쓸기
    if (tail !== null) {
      const sw = tail * Math.PI * 1.2;
      for (let i = 0; i < 9; i++) { const a = -0.2 + sw * (i / 9), r = 60 + i * 28; DR.ell(ctx, Math.cos(a) * r, -18 + Math.sin(a) * 6, 22 - i * 1.6, 16 - i, B[1], 0, 1.6); }
    }
    // 머리
    ctx.save(); ctx.translate(headX, headY); ctx.rotate(-0.1);
    DR.poly(ctx, [-30, -20, 30, -26, 74, -12, 78, 0, 40, 6, -26, 14], B[1], 2.2);          // 윗턱
    ctx.save(); ctx.rotate(jaw * 0.7);
    DR.poly(ctx, [-20, 6, 40, 6, 70, 14, 30, 26, -20, 22], B[0], 2);                       // 아랫턱
    ctx.restore();
    ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); polyPath(ctx, [30 + i * 10, 2, 34 + i * 10, 12, 38 + i * 10, 2]); ctx.fill(); }
    DR.poly(ctx, [-20, -18, -60, -60, -10, -24], P.ice[1], 1.6);                           // 뿔
    DR.poly(ctx, [0, -22, -26, -74, 14, -26], P.ice[0], 1.6);
    ctx.fillStyle = '#0a1420'; ctx.beginPath(); ctx.ellipse(20, -12, 7, 4, 0, 0, TAU); ctx.fill();
    DR.glow(ctx, 21, -12, 26, b.enraged ? '255,90,60' : '150,230,255', 0.9);
    if (k.act === 'breath' && k.af >= 34 && k.af < 88) DR.glow(ctx, 80, 6, 70, '200,240,255', 0.8);
    if (k.act === 'breath' && k.af < 34) DR.glow(ctx, 70, 0, 20 + k.af, '200,240,255', 0.6);
    ctx.restore();
    ctx.restore();
    // 구멍 테두리 (항상 땅 위)
    DR.ell(ctx, -60, 6, 90, 22, '#e8f4ff', 0, 1.6);
    ctx.fillStyle = '#0a1a28'; ctx.beginPath(); ctx.ellipse(-60, 6, 70, 15, 0, 0, TAU); ctx.fill();
  },
  acts: {
    breath: {
      anim: 'breath', len: 104, counter: 30, armor: [0, 999], cd: 260, when: (b, p, adx, ady) => adx < 520 && ady < 90,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 4) Sfx.play('roar', 0.5, 1.4);
        if (f < 34 && f % 3 === 0) FX.add('world', new Mote(b.x + b.facing * rand(60, 160), sy(b.y, rand(180, 300)), 0, 0, { col: '200,240,255', life: 20, r: 8, tx: b.x + b.facing * 130, ty: sy(b.y, 230), grav: 0 }));
        if (f === 34) { Sfx.wlayer('ice', 3, true); Sfx.play('magic', 0.8, 0.6); }
        if (f >= 34 && f < 88) {
          for (let i = 0; i < 3; i++) FX.add('world', new Mote(b.x + b.facing * 130, sy(b.y, 200), b.facing * rand(6, 13), rand(1, 3.2), { col: chance(0.5) ? '200,240,255' : '150,220,255', life: 34, r: rand(10, 20), grav: 0.05 }));
          if (f % 14 === 0) BX.cone(b, 470, 40, 110, CH.tick, 200);
          if (f % 6 === 0) Game.addShake(2);
        }
      },
    },
    tail: {
      anim: 'tail', len: 74, counter: 20, armor: [0, 999], cd: 220, when: (b, p, adx, ady) => adx < 380 && ady < 90,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 16) { BX.lane(b.x - 340, b.x + 340, b.y, 80, 28, b.elem); FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, 'JUMP!', { col: ['#fff', '#8fe3ff'], size: 26 })); }
        if (f === 44) { Sfx.play('swingBig', 1.3, 0.6); Game.addShake(8); Hitfx.dust(b.x, sy(b.y, 0), 12, 200, '220,240,255'); BX.hitAt(b, b.x, b.y, 350, 85, CH.mid, 46); }
      },
    },
    burrow: {
      anim: 'burrow', len: 150, counter: 0, armor: [0, 999], cd: 380, cd0: 240,
      start(b) { b.invul = 999; Sfx.play('quake', 0.6, 1.2); },
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f <= 22) b.sub = f / 22;
        else if (f < 92) {
          b.sub = 1;
          const r = Game.room;
          b.x = clamp(lerp(b.x, p.x, 0.035), r.minX + 60, r.maxX - 60); b.y = lerp(b.y, p.y, 0.05);
          if (f % 6 === 0) { FX.add('ground', new Ring(b.x, sy(b.y, 0), 10, 70, 16, { col: '220,240,255', w: 5 })); Hitfx.dust(b.x, sy(b.y, 0), 2, 20, '230,245,255'); }
        }
        if (f === 92) BX.tele(b.x, b.y, 110, 38, 22, b.elem);
        if (f === 114) {
          b.invul = 0; b.sub = 0.4;
          BX.blast(b, b.x, b.y, 120, 44, CH.launch, '200,240,255', { shake: 14, sfx: 'quake' });
          for (let i = 0; i < 16; i++) FX.add('world', new Debris(b.x + rand(-40, 40), b.y, 20, { vx: rand(-8, 8), vz: rand(8, 16), s: rand(3, 6), col: ['#bfeaff', '#8ccfee', '#eaf9ff'] }));
        }
        if (f > 114) b.sub = Math.max(0, b.sub - 0.05);
      },
      cancel(b) { b.sub = 0; b.invul = 0; },
    },
    icicles: {
      anim: 'icicles', len: 90, counter: 0, armor: [0, 999], cd: 300,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 10) { Sfx.play('roar', 1, 1.2); Game.addShake(6); }
        if (f >= 20 && f <= 64 && f % 5 === 0) {
          const p = Game.player, r = Game.room;
          const x = clamp(p.x + rand(-260, 260), r.minX + 30, r.maxX - 30), y = clamp(p.y + rand(-80, 80), 0, DEPTH);
          BX.tele(x, y, 48, 18, 26, '170,230,255', tg => BX.shot(b, tg.x, tg.y, 260, 0, 0, -20, {
            style: 'icicle', r: 14, hd: CH.shot, onEnd: s => { BX.blast(b, s.x, s.y, 52, 20, CH.shot, '200,240,255', { style: 'quiet' }); FX.add('world', new Flash(s.x, sy(s.y, 10), 8, 60, 12, '200,240,255', 0.8)); for (let i = 0; i < 4; i++) FX.add('world', new Debris(s.x, s.y, 4, { vx: rand(-4, 4), vz: rand(3, 7), s: rand(2, 3), col: ['#bfeaff', '#8ccfee', '#eaf9ff'], life: 30 })); Sfx.wlayer('ice', 0, false); },
          }));
        }
      },
    },
  },
};

// ============================================================
//  3. 굴착 거미 기계 (버려진 광산)
// ============================================================
CREATURES.spider = {
  w: 70, h: 200, d: 34, shadow: 1.7, speed: 2.4, keep: 280, rest: 40, roarPitch: 1.6,
  pal: { hull: ['#2a2f3a', '#59616f', '#98a2b4'], leg: ['#1a1d24', '#3a404c', '#6a7280'], drill: ['#6a5020', '#c8a040', '#ffe08a'] },
  draw(ctx, b, P, k) {
    const t = k.t, H = P.hull, Lg = P.leg;
    const walk = (k.a === 'walk' || k.act === 'drill') ? k.at * (k.act === 'drill' ? 0.5 : 0.18) : 0;
    let lift = Math.sin(t * 0.06) * 3, tilt = 0, visor = 0.6;
    if (k.act === 'laser') { visor = 1; tilt = k.af > 40 ? 0.12 : 0; }
    if (k.st === 'break') { lift = 40; tilt = 0.2; }
    // 다리 4개 (뒤 두 개 먼저)
    const legs = [[-40, -95, 0], [40, -95, 1.6], [-30, -95, 3.1], [50, -95, 4.7]];
    legs.forEach(([hx, hy, ph], i) => {
      const s = Math.sin(walk + ph), fxx = hx * 2.6 + s * 22, fyy = -Math.max(0, Math.cos(walk + ph)) * 16;
      const kx = (hx + fxx) / 2 + (hx > 0 ? 30 : -30), ky = -170 + lift;
      const col = i < 2 ? Lg[0] : Lg[1];
      DR.cap(ctx, hx, hy + lift, kx, ky, 12, 10, col, 1.8);
      DR.cap(ctx, kx, ky, fxx, fyy, 10, 5, col, 1.8);
      DR.ell(ctx, kx, ky, 12, 12, Lg[2], 0, 1.4);
    });
    ctx.save(); ctx.translate(0, lift - 110); ctx.rotate(tilt);
    // 몸체
    DR.ell(ctx, 0, 0, 90, 56, H[1], 0, 2.4);
    ctx.fillStyle = H[0]; ctx.beginPath(); ctx.ellipse(-20, 14, 70, 30, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = H[2]; ctx.beginPath(); ctx.ellipse(-10, -30, 50, 12, -0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb030'; for (let i = 0; i < 5; i++) ctx.fillRect(-60 + i * 22, 22, 12, 5);
    // 미사일 포드
    DR.poly(ctx, [-60, -46, -10, -46, -6, -84, -64, -80], H[0], 2);
    const open = k.act === 'missiles' ? 1 : 0;
    for (let i = 0; i < 3; i++) { ctx.fillStyle = open ? '#ff6030' : '#101218'; ctx.fillRect(-56 + i * 16, -76, 10, 10); }
    // 바이저
    DR.poly(ctx, [40, -30, 92, -14, 92, 18, 40, 20], '#101420', 2);
    DR.glow(ctx, 70, 0, 40 + visor * 30, b.enraged ? '255,60,40' : b.elem, 0.5 + visor * 0.5);
    ctx.fillStyle = `rgba(${b.elem},0.9)`; ctx.fillRect(50, -6, 36, 8);
    // 드릴
    const spin = (k.act === 'drill' ? t * 0.8 : t * 0.1) % 1;
    ctx.save(); ctx.translate(86, 30);
    DR.poly(ctx, [0, -26, 110, 0, 0, 26], P.drill[1], 2);
    ctx.strokeStyle = P.drill[0]; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const x = ((i + spin) / 5) * 100; ctx.beginPath(); ctx.moveTo(x, -26 * (1 - x / 110)); ctx.lineTo(x + 14, 26 * (1 - (x + 14) / 110)); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  },
  acts: {
    drill: BX.dash({ anim: 'drill', cd: 300, speed: 15, hd: CH.heavy, when: (b, p, adx, ady) => adx > 240,
      trail: b => Hitfx.sparks(b.x + b.facing * 150, sy(b.y, 80), b.facing, 4, { col: '255,200,100' }) }),
    missiles: {
      anim: 'missiles', len: 80, counter: 0, armor: [0, 999], cd: 260,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 8) Sfx.play('warn', 0.8);
        if (f >= 26 && f <= 56 && f % 5 === 1) {
          Sfx.play('throw', 0.7, 0.6);
          BX.shot(b, b.x - b.facing * 35, b.y, 230, b.facing * rand(-2, 3), rand(-1, 1), 7, {
            style: 'missile', r: 12, grav: 0.28, home: 0.06, homeT: 70, life: 200, hd: CH.shot,
            tick: s => { if (s.t % 2 === 0) FX.add('world', new Mote(s.x, sy(s.y, s.z), 0, 0, { col: '200,200,210', life: 22, r: 7, grav: -0.02 })); if (s.t === 20) { const sp = 5; const p = Game.player; const d = Math.hypot(p.x - s.x, p.y - s.y) || 1; s.vx = (p.x - s.x) / d * sp; s.vy = (p.y - s.y) / d * sp * 0.5; } },
            onEnd: s => BX.blast(b, s.x, s.y, 64, 26, CH.shot, '255,170,80', { shake: 4, sfx: 'land' }),
          });
        }
      },
    },
    mines: {
      anim: 'mines', len: 70, counter: 0, armor: [0, 999], cd: 380, cd0: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f >= 14 && f <= 54 && f % 8 === 6) {
          const p = Game.player, r = Game.room;
          const tx = clamp(p.x + rand(-300, 300), r.minX + 40, r.maxX - 40), ty = clamp(p.y + rand(-80, 80), 6, DEPTH - 6);
          const v = BX.arc(b.x, b.y, 150, tx, ty, 0, 26, 0.5);
          Sfx.play('throw', 0.6, 1.3);
          BX.shot(b, b.x, b.y, 150, v[0], v[1], v[2], {
            style: 'mine', r: 16, grav: 0.5, floor: true, prox: 70, life: 420, hd: CH.mid, harmless: true,
            onEnd: s => { s.harmless = false; BX.blast(b, s.x, s.y, 90, 34, CH.mid, '255,140,60', { shake: 6, sfx: 'explode' }); },
          });
        }
      },
    },
    laser: {
      anim: 'laser', len: 110, counter: 30, armor: [0, 999], cd: 280, when: (b, p, adx, ady) => adx < 760 && ady < 60,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const r = Game.room, x1 = b.facing > 0 ? r.maxX : r.minX;
        if (f === 4) { b.lset = new Set(); FX.add('ground', new Telegraph(b.x, b.y, 0, 34, 40, { shape: 'rect', w: Math.abs(x1 - b.x), dir: b.facing, col: b.elem })); Sfx.play('charge', 0.8); FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, 'JUMP!', { col: ['#fff', '#ffb030'], size: 26 })); }
        if (f >= 44 && f <= 90) {
          const px = b.x + b.facing * (90 + (f - 44) * 15);
          FX.add('world', new Bolt(b.x + b.facing * 80, sy(b.y, 110), px, sy(b.y, 0), { col: b.elem, life: 3, amp: 2, w: 5 }));
          FX.add('world', new Flash(px, sy(b.y, 4), 10, 50, 8, b.elem, 0.9));
          if (f % 2 === 0) FX.add('ground', new Dust(px, sy(b.y, 0), 0, -0.5, 12, { col: '60,40,30', life: 60 }));
          BX.hitAt(b, px, b.y, 40, 40, CH.mid, 40, b.lset);
          if (f === 44) Sfx.play('flash', 0.7);
        }
      },
    },
  },
};

// ============================================================
//  4. 파라오의 망령 (사막의 유적) : 떠 있는 미라 + 거대한 황금 손
// ============================================================
CREATURES.pharaoh = {
  w: 36, h: 290, d: 26, shadow: 1.2, speed: 1.8, keep: 300, rest: 45, roarPitch: 0.8,
  pal: { gold: ['#7a5a1c', '#c9a24a', '#f5da8e'], wrap: ['#6a5a40', '#b8a888', '#e8dcc0'], blue: ['#102040', '#2a4a8a', '#4a7ac8'] },
  draw(ctx, b, P, k) {
    const t = k.t, G = P.gold, Wr = P.wrap, F = 80 + Math.sin(t * 0.05) * 10;
    let lh = [130, -F - 100], rh = [-120, -F - 110], slam = 0;
    lh[1] += Math.sin(t * 0.07) * 8; rh[1] += Math.cos(t * 0.07) * 8;
    if (k.act === 'crush') {
      const f = k.af, lx = b.tgx !== undefined ? (b.tgx - b.x) * b.facing : 200;
      if (f < 48) { const e = DR.ease(f, 0, 20); lh = [lerp(130, lx + 50, e), lerp(lh[1], -380, e)]; rh = [lerp(-120, lx - 50, e), lerp(rh[1], -380, e)]; }
      else if (f < 70) { const e = DR.ease(f, 48, 53); lh = [lx + 50, lerp(-380, -30, e)]; rh = [lx - 50, lerp(-380, -30, e)]; slam = 1; }
      else { const e = DR.ease(f, 70, 90); lh = [lerp(lx + 50, 130, e), lerp(-30, -F - 100, e)]; rh = [lerp(lx - 50, -120, e), lerp(-30, -F - 110, e)]; }
    }
    if (k.act === 'orbs' || k.act === 'storm' || k.a === 'roar') { lh = [110, -F - 260]; rh = [-100, -F - 260]; }
    if (k.st === 'break') { lh = [80, -40]; rh = [-80, -40]; }
    const hand = (x, y, back) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(back ? -1 : 1, 1);
      DR.poly(ctx, [-30, -20, 30, -24, 36, 20, -26, 26], back ? G[0] : G[1], 2);
      for (let i = 0; i < 4; i++) DR.cap(ctx, -22 + i * 16, 22, -24 + i * 17, 56 + (i === 0 || i === 3 ? -8 : 0), 7, 6, back ? G[0] : G[1], 1.6);
      DR.cap(ctx, 30, 0, 52, -20, 8, 7, back ? G[0] : G[1], 1.6);
      ctx.fillStyle = P.blue[1]; ctx.beginPath(); ctx.arc(2, 0, 8, 0, TAU); ctx.fill();
      ctx.restore();
    };
    hand(rh[0], rh[1], true);
    // 모래 소용돌이
    DR.glow(ctx, 0, -10, 90, '230,190,120', 0.35, 1.4, 0.4);
    ctx.save(); ctx.translate(0, -F);
    // 몸 (붕대)
    DR.poly(ctx, [-42, -170, 42, -170, 30, -40, 10, 30, -10, 30, -30, -40], Wr[1], 2.2);
    ctx.strokeStyle = Wr[0]; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 2, -150 + i * 24); ctx.lineTo(40 - i * 4, -140 + i * 24 - 10); ctx.stroke(); }
    // 넓은 목깃
    DR.poly(ctx, [-56, -176, 56, -176, 40, -136, -40, -136], G[1], 2);
    ctx.fillStyle = P.blue[1]; for (let i = 0; i < 5; i++) ctx.fillRect(-44 + i * 18, -166, 10, 20);
    // 두건 (네메스)
    DR.poly(ctx, [-50, -250, 40, -258, 54, -176, 30, -196, -30, -196, -60, -176], G[1], 2);
    ctx.strokeStyle = P.blue[1]; ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-54 + i * 3, -236 + i * 12); ctx.lineTo(-58 + i * 2, -186); ctx.stroke(); }
    // 황금 가면
    DR.poly(ctx, [-20, -244, 34, -246, 38, -196, 24, -182, -14, -186], G[2], 2);
    ctx.fillStyle = '#0a0806'; ctx.fillRect(4, -228, 26, 7);
    DR.glow(ctx, 18, -224, 34, b.enraged ? '255,60,40' : b.elem, 1);
    DR.poly(ctx, [10, -196, 18, -170, 26, -196], P.blue[1], 1.4);                        // 수염
    // 코브라 장식
    DR.poly(ctx, [6, -252, 14, -274, 22, -252], G[2], 1.6);
    ctx.restore();
    hand(lh[0], lh[1], false);
    if (slam) DR.glow(ctx, (lh[0] + rh[0]) / 2, -20, 120, '255,220,140', 0.6, 1.2, 0.5);
  },
  acts: {
    crush: {
      anim: 'crush', len: 92, counter: 0, armor: [0, 999], cd: 230, when: (b, p, adx) => adx < 760,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 2) { b.tgx = p.x; b.tgy = p.y; b.tg = BX.tele(p.x, p.y, 120, 44, 48, b.elem); Sfx.play('magic', 0.6, 0.5); }
        if (f < 40 && b.tg) { b.tgx = lerp(b.tgx, p.x, 0.12); b.tgy = lerp(b.tgy, p.y, 0.12); b.tg.x = b.tgx; b.tg.y = b.tgy; }
        if (f === 49) { BX.blast(b, b.tgx, b.tgy, 125, 46, CH.heavy, '230,200,120', { shake: 16, sfx: 'quake' }); Hitfx.dust(b.tgx, sy(b.tgy, 0), 20, 140, '220,190,130'); }
      },
    },
    storm: {
      anim: 'storm', len: 60, counter: 0, armor: [0, 999], cd: 520, cd0: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) {
          Sfx.play('roar', 0.7, 0.9); Game.addShake(6);
          for (const s of [-1, 1]) BX.zone(b, clamp(b.x + s * 200, Game.room.minX + 60, Game.room.maxX - 60), b.y, { kind: 'tornado', rx: 60, ry: 30, life: 330, every: 26, follow: 1.4, hd: CH.light, hmax: 220, col: '230,200,140' });
        }
      },
    },
    orbs: {
      anim: 'orbs', len: 70, counter: 0, armor: [0, 999], cd: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 30 || f === 40 || f === 50) {
          Sfx.play('magic', 0.8, 0.9);
          const p = Game.player, a = Math.atan2(p.y - b.y, p.x - b.x);
          BX.shot(b, b.x, b.y, 220, Math.cos(a) * 3.4, Math.sin(a) * 1.6, -1.4, { style: 'orb', r: 16, col: '200,120,255', home: 0.04, homeT: 100, life: 220, hd: CH.shot, floor: false });
        }
      },
    },
    scarabs: {
      anim: 'orbs', len: 80, counter: 0, armor: [0, 999], cd: 340,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 10) {
          const r = Game.room, lanes = [20, 70, 120, 170, 210].sort(() => Math.random() - 0.5).slice(0, 4);
          b.lanes = lanes;
          for (const y of lanes) BX.lane(r.minX, r.maxX, y, 16, 30, '120,220,160');
          Sfx.play('spawn', 0.8);
        }
        if (f === 40) {
          const r = Game.room;
          for (const y of b.lanes || []) for (let k = 0; k < 2; k++) { const dir = (y / 50 | 0) % 2 ? 1 : -1; BX.shot(b, dir > 0 ? Game.cam.x - 40 - k * 80 : Game.cam.x + W + 40 + k * 80, y, 6, dir * 7, 0, 0, { style: 'scarab', r: 14, roll: true, pierce: true, life: 240, hd: CH.light }); }
        }
      },
    },
  },
};

// ============================================================
//  5. 늪의 어미 두꺼비 (죽음의 늪)
// ============================================================
CREATURES.toad = {
  w: 80, h: 180, d: 34, shadow: 1.9, speed: 1.6, keep: 260, rest: 45, roarPitch: 0.7,
  pal: { skin: ['#1e3a1c', '#4a7a32', '#86b055'], belly: ['#a8a060', '#d8d090', '#f0ecc0'], wart: ['#3a5a1a', '#6a9a3a', '#c0e070'] },
  draw(ctx, b, P, k) {
    const t = k.t, S = P.skin, Bl = P.belly;
    let sq = 0, mouth = 0.05, tongue = 0, sac = 0;
    if (k.a === 'walk') sq = Math.sin(k.at * 0.2) * 0.06;
    if (k.act === 'flop') { const f = k.af; sq = f < 20 ? f / 20 * 0.3 : -0.2; }
    if (k.act === 'tongue') { const f = k.af; mouth = f > 26 ? 0.5 : 0.1; tongue = f < 30 ? 0 : f < 40 ? (f - 30) / 10 : f < 58 ? 1 : Math.max(0, 1 - (f - 58) / 8); if (b.grab) tongue = Math.max(0.2, 1 - (f - 40) / 18); }
    if (k.act === 'spit') { const f = k.af; sac = f < 30 ? f / 30 : Math.max(0, 1 - (f - 30) / 10); mouth = f > 28 ? 0.4 : 0.05; }
    if (k.a === 'roar' || k.act === 'roar') mouth = 0.6;
    if (k.st === 'break') sq = 0.3;
    ctx.save(); ctx.scale(1 + sq * 0.6, 1 - sq);
    // 뒷다리
    DR.ell(ctx, -60, -40, 60, 40, S[0], -0.3, 2.2);
    DR.ell(ctx, -20, -6, 50, 12, S[0], 0, 2);
    // 몸통
    DR.ell(ctx, 0, -90, 125, 82, S[1], 0, 2.6);
    ctx.fillStyle = Bl[1]; ctx.beginPath(); ctx.ellipse(36, -60, 70, 46, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = S[0]; ctx.beginPath(); ctx.ellipse(-30, -120, 80, 40, -0.2, Math.PI, TAU); ctx.fill();
    for (let i = 0; i < 9; i++) { const a = i * 2.4; DR.ell(ctx, -60 + (i * 37) % 120, -140 + (i * 23) % 60, 7, 6, P.wart[1], 0, 1); }
    // 앞다리
    DR.cap(ctx, 70, -50, 96, -4, 16, 12, S[1], 2);
    DR.ell(ctx, 104, -2, 26, 9, S[0], 0, 1.8);
    // 울음주머니
    if (sac > 0) { DR.ell(ctx, 90, -40, 30 + sac * 26, 22 + sac * 20, '#c8d070', 0, 2); DR.glow(ctx, 90, -40, 50 * sac, '160,255,90', 0.4); }
    // 입
    ctx.save(); ctx.translate(110, -80);
    ctx.fillStyle = '#3a0a10'; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(0, 30 * mouth + 4, 14, 0); ctx.quadraticCurveTo(0, -4, -60, 0); ctx.fill();
    ctx.strokeStyle = DR.ol; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-70, -4); ctx.quadraticCurveTo(-10, 6, 16, -2); ctx.stroke();
    if (tongue > 0) {
      const L = 520 * tongue;
      DR.cap(ctx, 0, 6, L, 26, 10, 14, '#e8506a', 2);
      DR.ell(ctx, L, 26, 22, 18, '#ff6a80', 0, 2);
    }
    ctx.restore();
    // 눈
    for (const [ex, ey] of [[40, -160], [-10, -168]]) {
      DR.ell(ctx, ex, ey, 22, 20, S[1], 0, 2);
      DR.ell(ctx, ex + 4, ey - 2, 14, 13, '#e8d040', 0, 1);
      ctx.fillStyle = '#100808'; ctx.fillRect(ex - 2, ey - 9, 7, 14);
    }
    if (b.enraged) DR.glow(ctx, 20, -160, 70, '255,60,40', 0.35);
    ctx.restore();
  },
  acts: {
    flop: {
      anim: 'flop', len: 110, counter: 0, armor: [0, 999], cd: 260, when: (b, p, adx) => adx < 800,
      start(b) { b.gravOff = true; },
      update(b, f) {
        const p = Game.player;
        b.vx = 0; b.vy = 0;
        if (f === 20) { Sfx.play('jump', 1.5, 0.4); Hitfx.dust(b.x, sy(b.y, 0), 14, 90); b.ft = BX.tele(p.x, p.y, 170, 58, 50, b.elem); b.fx = p.x; b.fy = p.y; }
        if (f > 20 && f < 70) {
          b.z = lerp(b.z, 480, 0.1);
          if (f < 52) { b.fx = lerp(b.fx, p.x, 0.1); b.fy = lerp(b.fy, p.y, 0.1); if (b.ft) { b.ft.x = b.fx; b.ft.y = b.fy; } }
          b.x = lerp(b.x, b.fx, 0.12); b.y = lerp(b.y, b.fy, 0.12);
        }
        if (f === 70) { b.z = 0; b.x = b.fx; b.y = b.fy; b.gravOff = false;
          BX.blast(b, b.x, b.y, 180, 62, CH.heavy, '160,230,90', { shake: 20, sfx: 'quake' });
          FX.add('ground', new Ring(b.x, sy(b.y, 0), 30, 360, 30, { col: '160,230,90', w: 18 }));
          for (const s of [-1, 1]) BX.zone(b, b.x + s * 160, b.y, { rx: 80, ry: 28, life: 260, every: 30, col: '140,235,80', hd: CH.tick });
          for (let i = 0; i < 12; i++) FX.add('world', new Drop(b.x, b.y, 20, { vx: rand(-8, 8), vz: rand(4, 10), r: 4, col: '#5aa02a', splat: true }));
        }
      },
      cancel(b) { b.gravOff = false; b.z = 0; },
    },
    tongue: {
      anim: 'tongue', len: 76, counter: 26, armor: [0, 999], cd: 200, when: (b, p, adx, ady) => adx < 560 && ady < 60,
      start(b) { b.grab = false; },
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 4) { b.y = lerp(b.y, p.y, 0.6); FX.add('ground', new Telegraph(b.x, b.y, 0, 26, 26, { shape: 'rect', w: 560, dir: b.facing, col: b.elem })); }
        if (f === 30) Sfx.play('swing', 1.3, 0.5);
        if (f >= 30 && f <= 40 && !b.grab) {
          const reach = 120 + (f - 30) * 46;
          if (BX.pl() && (p.x - b.x) * b.facing > 40 && (p.x - b.x) * b.facing < reach && Math.abs(p.y - b.y) < 36 && p.z < 120) {
            b.grab = true; applyHit(b, p, CH.light, { dir: -b.facing, noStopAtt: true });
            FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '붙잡혔다!', { col: ['#fff', '#ff6a80'], size: 22 }));
          }
        }
        if (b.grab && f > 40 && f < 60) { p.x = lerp(p.x, b.x + b.facing * 140, 0.22); p.y = lerp(p.y, b.y, 0.2); p.vx = 0; }
        if (b.grab && f === 62) { p.invul = 0; applyHit(b, p, CH.heavy, { dir: b.facing, noStopAtt: true }); Sfx.play('explode', 0.5, 1.4); b.grab = false; }
      },
      cancel(b) { b.grab = false; },
    },
    spit: {
      anim: 'spit', len: 56, counter: 20, armor: [0, 999], cd: 220, when: (b, p, adx) => adx > 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 34) {
          Sfx.wlayer('poison', 2, false);
          const p = Game.player;
          for (let i = 0; i < 3; i++) {
            const tx = clamp(p.x + (i - 1) * 140, Game.room.minX + 40, Game.room.maxX - 40), ty = clamp(p.y + rand(-40, 40), 0, DEPTH), T = 30 + i * 6;
            BX.tele(tx, ty, 80, 28, T, '140,235,80');
            const v = BX.arc(b.x + b.facing * 110, b.y, 80, tx, ty, 0, T, 0.45);
            BX.shot(b, b.x + b.facing * 110, b.y, 80, v[0], v[1], v[2], { style: 'glob', r: 16, grav: 0.45, hd: CH.shot, onEnd: s => { BX.blast(b, s.x, s.y, 70, 26, CH.shot, '140,235,80', { style: 'quiet' }); FX.add('world', new Flash(s.x, sy(s.y, 10), 10, 90, 14, '140,235,80', 0.8)); BX.zone(b, s.x, s.y, { rx: 74, ry: 26, life: 300, every: 30, col: '140,235,80', hd: CH.tick }); } });
          }
        }
      },
    },
    brood: {
      anim: 'spit', len: 50, counter: 0, armor: [0, 999], cd: 700, cd0: 500, when: () => Game.enemies.filter(o => !o.isBoss && !o.dying).length < 2,
      update(b, f) { b.vx = 0; if (f === 26) { Sfx.play('spawn', 1); BX.summon(b, 3, 0.25, ['goblin']); } },
    },
  },
};

// ============================================================
//  6. 용광로 전차 (강철 공장)
// ============================================================
CREATURES.furnace = {
  w: 80, h: 240, d: 36, shadow: 1.9, speed: 1.6, keep: 300, rest: 45, roarPitch: 0.5,
  pal: { iron: ['#2a1208', '#5a3018', '#8a5a30'], steel: ['#2a2e36', '#4e5462', '#8a92a2'], tread: ['#151515', '#2a2a2a', '#4a4a4a'] },
  draw(ctx, b, P, k) {
    const t = k.t, I = P.iron, St = P.steel, T = P.tread;
    const roll = (k.a === 'walk' || k.act === 'ram') ? k.at * (k.act === 'ram' ? 0.6 : 0.15) : 0;
    let heat = 0.5 + Math.sin(t * 0.1) * 0.15, cannon = -0.35, recoil = 0;
    if (k.act === 'flame') heat = 1;
    if (k.act === 'shells') { cannon = -0.7; recoil = [20, 40, 60].some(x => k.af >= x && k.af < x + 6) ? 12 : 0; }
    if (k.act === 'ram') heat = 1.2;
    if (k.st === 'break') heat = 0.1;
    // 무한궤도
    DR.poly(ctx, [-120, -54, 110, -54, 128, -28, 110, 0, -120, 0, -136, -28], T[1], 2.2);
    for (let i = 0; i < 6; i++) { const x = -105 + i * 42; DR.ell(ctx, x, -27, 17, 17, T[0], 0, 1.6); ctx.strokeStyle = T[2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(roll + i) * 14, -27 + Math.sin(roll + i) * 14); ctx.lineTo(x - Math.cos(roll + i) * 14, -27 - Math.sin(roll + i) * 14); ctx.stroke(); }
    // 보일러
    DR.poly(ctx, [-100, -54, 80, -54, 92, -200, -92, -210], I[1], 2.4);
    ctx.fillStyle = I[0]; ctx.fillRect(-92, -200, 30, 146);
    ctx.fillStyle = I[2]; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(-70 + i * 46, -80 - j * 44, 3.5, 0, TAU); ctx.fill(); }
    // 화구
    DR.poly(ctx, [20, -170, 80, -170, 82, -86, 20, -86], '#1a0a04', 2);
    const hc = `rgba(255,${120 + heat * 80 | 0},40,${Math.min(1, 0.5 + heat * 0.5)})`;
    ctx.fillStyle = hc; for (let i = 0; i < 4; i++) ctx.fillRect(26, -160 + i * 18, 50, 9);
    DR.glow(ctx, 52, -128, 70 + heat * 50, '255,130,40', 0.4 + heat * 0.3);
    // 굴뚝
    for (const [sx, sh] of [[-70, 70], [-30, 52]]) { DR.poly(ctx, [sx - 14, -206, sx + 14, -208, sx + 12, -206 - sh, sx - 12, -206 - sh], St[0], 2); DR.glow(ctx, sx, -210 - sh, 20, '255,150,60', 0.3 * heat); }
    if (t % 8 === 0 && Game.state === 'play') FX.add('world', new Dust(b.x + b.facing * -70, sy(b.y, 290), rand(-0.3, 0.3), -1.2, 22, { col: '80,80,90', life: 70, a: 0.35 }));
    // 대포
    ctx.save(); ctx.translate(-10, -214); ctx.rotate(cannon);
    DR.ell(ctx, 0, 0, 30, 24, St[1], 0, 2);
    DR.poly(ctx, [10 - recoil, -14, 120 - recoil, -12, 120 - recoil, 12, 10 - recoil, 14], St[1], 2);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(112 - recoil, -9, 10, 18);
    ctx.restore();
    // 화염 노즐
    DR.poly(ctx, [80, -76, 120, -84, 124, -60, 80, -60], St[0], 2);
    if (k.act === 'flame' && k.af >= 30 && k.af < 92) DR.glow(ctx, 126, -72, 50, '255,170,60', 1);
    if (b.enraged) DR.glow(ctx, 0, -130, 160, '255,80,30', 0.2);
  },
  acts: {
    flame: {
      anim: 'flame', len: 104, counter: 28, armor: [0, 999], cd: 240, when: (b, p, adx, ady) => adx < 460 && ady < 80,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) Sfx.play('charge', 0.8, 0.6);
        if (f >= 30 && f < 92) {
          for (let i = 0; i < 3; i++) FX.add('world', new Mote(b.x + b.facing * 125, sy(b.y, 70), b.facing * rand(7, 14), rand(-1.6, 1.6), { col: chance(0.5) ? '255,140,40' : '255,220,90', life: 28, r: rand(12, 22), grav: -0.03 }));
          if (f % 14 === 0) BX.cone(b, 420, 40, 100, CH.tick, 140);
          if (f % 18 === 0) BX.zone(b, b.x + b.facing * rand(140, 400), clamp(b.y + rand(-60, 60), 0, DEPTH), { rx: 46, ry: 18, life: 140, every: 26, col: '255,130,40', hd: CH.tick });
          if (f === 30) Sfx.wlayer('fire', 3, true);
          if (f % 10 === 0) Sfx.wlayer('fire', 1, false);
        }
      },
    },
    shells: {
      anim: 'shells', len: 80, counter: 0, armor: [0, 999], cd: 230,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20 || f === 40 || f === 60) {
          const p = Game.player, tx = clamp(p.x + p.vx * 22 + rand(-60, 60), Game.room.minX + 30, Game.room.maxX - 30), ty = clamp(p.y + rand(-40, 40), 0, DEPTH), T = 36;
          BX.tele(tx, ty, 90, 32, T, '255,140,60');
          const v = BX.arc(b.x + b.facing * 90, b.y, 300, tx, ty, 0, T, 0.55);
          Sfx.play('explode', 0.4, 1.6); Game.addShake(4);
          FX.add('world', new Flash(b.x + b.facing * 100, sy(b.y, 300), 10, 80, 10, '255,200,120', 0.9));
          BX.shot(b, b.x + b.facing * 90, b.y, 300, v[0], v[1], v[2], { style: 'shell', r: 13, grav: 0.55, hd: CH.mid, onEnd: s => BX.blast(b, s.x, s.y, 92, 34, CH.mid, '255,140,60', { shake: 8, sfx: 'explode', glow: true }) });
        }
      },
    },
    vents: {
      anim: 'vents', len: 110, counter: 0, armor: [0, 999], cd: 360, cd0: 220,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const wave = (off, lanes) => {
          const cx = Game.player.x;
          for (let i = -3; i <= 3; i++) for (const y of lanes) {
            const x = clamp(cx + i * 150 + off, Game.room.minX + 40, Game.room.maxX - 40);
            BX.tele(x, y, 56, 22, 36, '220,230,255', tg => { FX.add('world', new Pillar(tg.x, tg.y, 40, 320, 26, '220,230,255', '255,255,255')); BX.hitAt(b, tg.x, tg.y, 56, 24, CH.launch, 200); });
          }
        };
        if (f === 10) { wave(0, [40, 160]); Sfx.play('charge', 0.6, 1.4); }
        if (f === 52) wave(75, [100, 210]);
        if (f === 46 || f === 88) { Sfx.play('pillar', 0.7, 1.3); Game.addShake(5); }
      },
    },
    ram: BX.dash({ anim: 'ram', cd: 320, speed: 13, hd: CH.heavy, when: (b, p, adx) => adx > 300, trailEvery: 5,
      trail: b => BX.zone(b, b.x - b.facing * 80, b.y, { rx: 46, ry: 20, life: 160, every: 28, col: '255,130,40', hd: CH.tick }) }),
  },
};
