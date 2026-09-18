'use strict';
// ============================================================
//  이펙트 : 파티클, 검기, 타격 섬광, 데미지 숫자, 아이템
// ============================================================
const FX = {
  ground: [], world: [], top: [],
  add(layer, e) { this[layer].push(e); return e; },
  clear() { this.ground.length = 0; this.world.length = 0; this.top.length = 0; },
  update() {
    for (const k of ['ground', 'world', 'top']) {
      const arr = this[k];
      let j = 0;
      for (let i = 0; i < arr.length; i++) { const e = arr[i]; if (e.update() !== false) arr[j++] = e; }
      arr.length = j;
    }
  },
  draw(ctx, layer) {
    for (const e of this[layer]) {
      ctx.globalCompositeOperation = e.add ? 'lighter' : 'source-over';
      e.draw(ctx);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};

// ---------- 불꽃 줄기 (화면 좌표) ----------
class Spark {
  constructor(x, y, vx, vy, o = {}) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = o.life || 16; this.t = 0; this.w = o.w || 2.2; this.len = o.len || 2.2;
    this.col = o.col || '255,220,150'; this.grav = o.grav ?? 0.25; this.drag = o.drag ?? 0.88; this.add = true;
  }
  update() {
    this.t++; this.x += this.vx; this.y += this.vy; this.vx *= this.drag; this.vy = this.vy * this.drag + this.grav;
    return this.t < this.life;
  }
  draw(ctx) {
    const a = 1 - this.t / this.life;
    ctx.strokeStyle = `rgba(${this.col},${a})`; ctx.lineWidth = this.w * (0.5 + a * 0.5); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x - this.vx * this.len, this.y - this.vy * this.len); ctx.stroke();
  }
}

// ---------- 원형 섬광 ----------
class Flash {
  constructor(x, y, r0, r1, life, col = '255,240,220', a = 1) { Object.assign(this, { x, y, r0, r1, life, col, a, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life;
    drawGlow(ctx, this.x, this.y, lerp(this.r0, this.r1, E.out(u)), this.col, this.a * (1 - u));
  }
}

// ---------- 베기 자국 (마름모 섬광) ----------
class CutLine {
  constructor(x, y, ang, L, w, col = '160,210,255', life = 11) { Object.assign(this, { x, y, ang, L, w, col, life, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life;
    const l = this.L * (this.t < 3 ? E.out(this.t / 3) : 1 + u * 0.15), w = this.w * (1 - u) * (1 - u);
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang);
    ctx.fillStyle = `rgba(${this.col},${0.85 * (1 - u)})`;
    ctx.beginPath(); ctx.moveTo(-l, 0); ctx.lineTo(0, -w * 2.2); ctx.lineTo(l, 0); ctx.lineTo(0, w * 2.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${1 - u})`;
    ctx.beginPath(); ctx.moveTo(-l * 0.9, 0); ctx.lineTo(0, -w); ctx.lineTo(l * 0.9, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ---------- 초승달 검기 ----------
class Crescent {
  // a0 → a1 방향으로 휘두름 (라디안, 화면 기준)
  constructor(x, y, r, a0, a1, o = {}) {
    Object.assign(this, { x, y, r, a0, a1, t: 0, add: true });
    this.th = o.th || r * 0.35; this.life = o.life || 14; this.col = o.col || '120,190,255';
    this.sy = o.sy || 1; this.rot = o.rot || 0; this.grow = o.grow ?? 0.12; this.speed = o.speed || 3;
    this.core = o.core || '255,255,255';
  }
  update() { return ++this.t < this.life; }
  path(ctx, r, th, a0, a1, n) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const u = i / n, a = lerp(a0, a1, u); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    for (let i = n; i >= 0; i--) {
      const u = i / n, a = lerp(a0, a1, u), tt = th * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1)), 0.8) * (0.3 + 0.7 * u);
      ctx.lineTo(Math.cos(a) * (r - tt), Math.sin(a) * (r - tt));
    }
    ctx.closePath();
  }
  draw(ctx) {
    const u = this.t / this.life, rev = Math.min(1, this.t / this.speed);
    const a1 = lerp(this.a0, this.a1, E.out(rev));
    const fade = this.t < this.speed ? 1 : 1 - (this.t - this.speed) / (this.life - this.speed);
    const r = this.r * (1 + u * this.grow);
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.scale(1, this.sy);
    ctx.fillStyle = `rgba(${this.col},${0.55 * fade})`;
    this.path(ctx, r * 1.04, this.th * 1.5, this.a0, a1, 24); ctx.fill();
    ctx.fillStyle = `rgba(${this.col},${0.9 * fade})`;
    this.path(ctx, r, this.th, this.a0, a1, 24); ctx.fill();
    ctx.fillStyle = `rgba(${this.core},${fade})`;
    this.path(ctx, r * 0.985, this.th * 0.38, this.a0 + (a1 - this.a0) * 0.2, a1, 20); ctx.fill();
    ctx.restore();
  }
}

// ---------- 지면 충격파 링 ----------
class Ring {
  constructor(x, y, r0, r1, life, o = {}) {
    Object.assign(this, { x, y, r0, r1, life, t: 0, add: true });
    this.col = o.col || '255,220,170'; this.w = o.w || 10; this.ry = o.ry || 0.32;
  }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, r = lerp(this.r0, this.r1, E.out3(u));
    ctx.strokeStyle = `rgba(${this.col},${(1 - u) * 0.9})`; ctx.lineWidth = this.w * (1 - u) + 1;
    ctx.beginPath(); ctx.ellipse(this.x, this.y, r, r * this.ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${(1 - u) * 0.6})`; ctx.lineWidth = this.w * 0.3 * (1 - u) + 0.5;
    ctx.stroke();
  }
}

// ---------- 흙먼지 ----------
class Dust {
  constructor(x, y, vx, vy, r, o = {}) {
    Object.assign(this, { x, y, vx, vy, r, t: 0 });
    this.life = o.life || 30; this.col = o.col || '170,160,140'; this.a = o.a ?? 0.45; this.grow = o.grow || 1.8; this.add = !!o.add;
  }
  update() { this.t++; this.x += this.vx; this.y += this.vy; this.vx *= 0.92; this.vy *= 0.92; return this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life;
    drawGlow(ctx, this.x, this.y, this.r * (1 + u * this.grow), this.col, this.a * (1 - u) * (1 - u));
  }
}

// ---------- 파편 (월드 좌표, 튕김) ----------
class Debris {
  constructor(x, y, z, o = {}) {
    Object.assign(this, { x, y, z, t: 0 });
    this.vx = o.vx ?? rand(-5, 5); this.vy = o.vy ?? rand(-1, 1); this.vz = o.vz ?? rand(6, 13);
    this.s = o.s || rand(3, 7); this.rot = rand(0, TAU); this.vr = rand(-0.4, 0.4);
    this.col = o.col || ['#5a5048', '#3a332d', '#7a6e62']; this.life = o.life || 70; this.glow = o.glow;
    this.pts = []; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; this.pts.push(Math.cos(a) * rand(0.6, 1), Math.sin(a) * rand(0.6, 1)); }
  }
  update() {
    this.t++;
    this.x += this.vx; this.y += this.vy; this.z += this.vz; this.vz -= 0.6; this.rot += this.vr;
    if (this.z < 0) { this.z = 0; this.vz = -this.vz * 0.35; this.vx *= 0.6; this.vr *= 0.6; if (Math.abs(this.vz) < 1) this.vz = 0; }
    return this.t < this.life;
  }
  draw(ctx) {
    const a = this.t > this.life - 15 ? (this.life - this.t) / 15 : 1;
    ctx.globalAlpha = a;
    ctx.save(); ctx.translate(this.x, sy(this.y, this.z)); ctx.rotate(this.rot); ctx.scale(this.s, this.s);
    ctx.beginPath(); polyPath(ctx, this.pts); ctx.fillStyle = this.col[0]; ctx.fill();
    ctx.lineWidth = 0.25; ctx.strokeStyle = '#120e0c'; ctx.stroke();
    ctx.fillStyle = this.col[2]; ctx.beginPath(); ctx.arc(-0.2, -0.3, 0.35, 0, TAU); ctx.fill();
    ctx.restore();
    if (this.glow) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, sy(this.y, this.z), this.s * 3, this.glow, a * 0.6); ctx.globalCompositeOperation = 'source-over'; }
    ctx.globalAlpha = 1;
  }
}

// ---------- 빛 입자 (상승/수렴 등) ----------
class Mote {
  constructor(x, y, vx, vy, o = {}) {
    Object.assign(this, { x, y, vx, vy, t: 0, add: true });
    this.life = o.life || 40; this.col = o.col || '255,120,60'; this.r = o.r || 6; this.grav = o.grav ?? -0.03;
    this.tx = o.tx; this.ty = o.ty; this.drag = o.drag ?? 0.97;
  }
  update() {
    this.t++;
    if (this.tx !== undefined) { this.vx += (this.tx - this.x) * 0.02; this.vy += (this.ty - this.y) * 0.02; this.vx *= 0.88; this.vy *= 0.88; }
    this.x += this.vx; this.y += this.vy; this.vy += this.grav; this.vx *= this.drag;
    return this.t < this.life;
  }
  draw(ctx) {
    const u = this.t / this.life, a = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
    drawGlow(ctx, this.x, this.y, this.r, this.col, a);
  }
}

// ---------- 기둥 (화염/암흑) ----------
class Pillar {
  constructor(x, y, w, h, life, col = '255,110,30', core = '255,230,170') { Object.assign(this, { x, y, w, h, life, col, core, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, gy = sy(this.y, 0);
    const rise = E.out3(Math.min(1, this.t / 6)), fade = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
    const hh = this.h * rise, ww = this.w * (u < 0.5 ? 1 : 1 - (u - 0.5));
    const g = ctx.createLinearGradient(0, gy - hh, 0, gy);
    g.addColorStop(0, `rgba(${this.col},0)`); g.addColorStop(0.3, `rgba(${this.col},${0.6 * fade})`); g.addColorStop(1, `rgba(${this.col},${0.95 * fade})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(this.x, gy, ww, ww * 0.3, 0, 0, Math.PI); ctx.lineTo(this.x - ww * 0.7, gy - hh); ctx.lineTo(this.x + ww * 0.7, gy - hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(${this.core},${0.8 * fade})`;
    ctx.fillRect(this.x - ww * 0.22, gy - hh * 0.9, ww * 0.44, hh * 0.9);
    drawGlow(ctx, this.x, gy, ww * 2.2, this.col, 0.6 * fade, 1, 0.4);
  }
}

// ---------- 발도 섬광선 ----------
class FlashLine {
  constructor(x0, x1, y, life = 26, col = '140,200,255') { Object.assign(this, { x0, x1, y, life, col, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = 1 - u;
    const w = 14 * (1 - u) + 1;
    const g = ctx.createLinearGradient(this.x0, 0, this.x1, 0);
    g.addColorStop(0, `rgba(${this.col},0)`); g.addColorStop(0.15, `rgba(${this.col},${a})`); g.addColorStop(1, `rgba(${this.col},${a})`);
    ctx.fillStyle = g; ctx.fillRect(Math.min(this.x0, this.x1), this.y - w, Math.abs(this.x1 - this.x0), w * 2);
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(Math.min(this.x0, this.x1), this.y - w * 0.25, Math.abs(this.x1 - this.x0), w * 0.5);
  }
}

// ---------- 데미지 숫자 ----------
class DmgText {
  constructor(x, y, val, type = 'n', stack = 0) {
    Object.assign(this, { x: x + rand(-14, 14), y: y - stack * 26, val, type, t: 0, vy: -1.4 });
    this.life = type === 'c' ? 62 : 52;
    this.str = fmt(val);
    this.size = type === 'c' ? 40 : type === 'p' ? 32 : type === 'h' ? 28 : 30;
    if (val >= 100000) this.size += 10;
  }
  update() { this.t++; this.y += this.vy; this.vy *= 0.9; return this.t < this.life; }
  draw(ctx) {
    const t = this.t;
    const s = t < 7 ? lerp(1.9, 1, E.out3(t / 7)) : 1;
    const a = t > this.life - 14 ? (this.life - t) / 14 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(this.x, this.y); ctx.scale(s, s);
    ctx.font = `italic ${this.size}px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,6,4,0.9)'; ctx.strokeText(this.str, 0, 0);
    const g = ctx.createLinearGradient(0, -this.size / 2, 0, this.size / 2);
    if (this.type === 'c') { g.addColorStop(0, '#fffbe0'); g.addColorStop(0.45, '#ffd23a'); g.addColorStop(1, '#ff6a00'); }
    else if (this.type === 'p') { g.addColorStop(0, '#ffd0d0'); g.addColorStop(0.5, '#ff4a4a'); g.addColorStop(1, '#a00'); }
    else if (this.type === 'h') { g.addColorStop(0, '#e0ffe0'); g.addColorStop(1, '#3adf5a'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#fff4c8'); g.addColorStop(1, '#f2c75c'); }
    ctx.fillStyle = g; ctx.fillText(this.str, 0, 0);
    if (this.type === 'c' && t < 10) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - t / 10) * 0.8;
      ctx.fillStyle = '#fff'; ctx.fillText(this.str, 0, 0);
    }
    ctx.restore();
  }
}

// ---------- 라벨 (COUNTER 등) ----------
class Label {
  constructor(x, y, str, o = {}) {
    Object.assign(this, { x, y, str, t: 0 });
    this.col = o.col || ['#ffffff', '#7fd4ff']; this.size = o.size || 20; this.life = o.life || 44; this.vy = o.vy ?? -0.8;
  }
  update() { this.t++; this.y += this.vy; return this.t < this.life; }
  draw(ctx) {
    const t = this.t, s = t < 6 ? lerp(1.6, 1, E.out(t / 6)) : 1, a = t > this.life - 12 ? (this.life - t) / 12 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(this.x, this.y); ctx.scale(s, s);
    ctx.font = `italic ${this.size}px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(this.str, 0, 0);
    const g = ctx.createLinearGradient(0, -this.size / 2, 0, this.size / 2);
    g.addColorStop(0, this.col[0]); g.addColorStop(1, this.col[1]);
    ctx.fillStyle = g; ctx.fillText(this.str, 0, 0);
    ctx.restore();
  }
}

// ---------- 텔레그래프(위험 지역) ----------
class Telegraph {
  constructor(x, y, rx, ry, dur, o = {}) {
    Object.assign(this, { x, y, rx, ry, dur, t: 0 });
    this.shape = o.shape || 'ellipse'; this.w = o.w || 0; this.dir = o.dir || 1; this.col = o.col || '255,40,30';
    this.onEnd = o.onEnd; this.add = false;
  }
  update() {
    this.t++;
    if (this.t >= this.dur) { if (this.onEnd) this.onEnd(this); return false; }
    return true;
  }
  draw(ctx) {
    const u = this.t / this.dur, gy = sy(this.y, 0);
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 0.5);
    ctx.save();
    if (this.shape === 'rect') {
      const x0 = this.dir > 0 ? this.x : this.x - this.w;
      ctx.fillStyle = `rgba(${this.col},${0.15 + pulse * 0.08})`;
      ctx.fillRect(x0, gy - this.ry, this.w, this.ry * 2);
      ctx.fillStyle = `rgba(${this.col},0.35)`;
      const fw = this.w * u;
      ctx.fillRect(this.dir > 0 ? x0 : x0 + this.w - fw, gy - this.ry, fw, this.ry * 2);
      ctx.strokeStyle = `rgba(${this.col},0.9)`; ctx.lineWidth = 2; ctx.strokeRect(x0, gy - this.ry, this.w, this.ry * 2);
    } else {
      ctx.fillStyle = `rgba(${this.col},${0.14 + pulse * 0.08})`;
      ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx, this.ry, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${this.col},0.38)`;
      ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx * u, this.ry * u, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(${this.col},0.95)`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx, this.ry, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
}

// ============================================================
//  편의 함수 : 타격 이펙트 세트
// ============================================================
const Hitfx = {
  sparks(x, y, dir, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.ang ?? 0) + rand(-(o.spread ?? 1.1), o.spread ?? 1.1);
      const sp = rand(o.min ?? 6, o.max ?? 16);
      FX.add('world', new Spark(x, y, Math.cos(a) * sp * dir, Math.sin(a) * sp - rand(0, 2), { col: o.col || choose(['255,230,160', '255,200,110', '255,255,230']), life: randi(10, 20), w: rand(1.5, 3), len: rand(1.5, 3) }));
    }
  },
  slash(x, y, dir, ang, power = 1, col = '140,200,255') {
    FX.add('world', new Flash(x, y, 6, 30 * power, 8, '255,245,230', 0.75));
    FX.add('world', new Flash(x, y, 10, 60 * power, 12, col, 0.3));
    FX.add('world', new CutLine(x, y, ang, 62 * power + rand(0, 16), 5 * power, col, 12));
    this.sparks(x, y, dir, Math.round(7 * power), { spread: 1.2 });
    if (power > 1.2) FX.add('world', new Ring(x, y, 6, 50 * power, 12, { col, w: 4, ry: 1 }));
  },
  heavy(x, y, dir, ang, power = 1.5) {
    FX.add('world', new Flash(x, y, 8, 40 * power, 10, '255,240,220', 0.85));
    FX.add('world', new Flash(x, y, 20, 90 * power, 18, '255,150,60', 0.3));
    FX.add('world', new Ring(x, y, 8, 60 * power, 14, { col: '255,210,150', w: 5, ry: 1 }));
    FX.add('world', new CutLine(x, y, ang, 95 * power, 7, '255,200,120', 14));
    FX.add('world', new CutLine(x, y, ang + Math.PI / 2 + rand(-0.3, 0.3), 60 * power, 4.5, '255,200,120', 12));
    this.sparks(x, y, dir, 14, { spread: 1.6, max: 20 });
  },
  pierce(x, y, dir, power = 1) {
    FX.add('world', new Flash(x, y, 6, 28 * power, 8, '255,245,230', 0.75));
    FX.add('world', new CutLine(x, y, dir > 0 ? 0 : Math.PI, 80 * power, 5, '150,210,255', 10));
    this.sparks(x, y, dir, 6, { spread: 0.35, min: 8, max: 20 });
  },
  blunt(x, y, dir) {
    FX.add('world', new Flash(x, y, 12, 50, 10, '255,200,180', 0.9));
    this.sparks(x, y, dir, 8, { col: '255,160,120', spread: 1.3 });
  },
  dust(x, y, n = 6, spread = 30, col) {
    for (let i = 0; i < n; i++) FX.add('ground', new Dust(x + rand(-spread, spread), y + rand(-4, 4), rand(-2.5, 2.5), rand(-0.8, 0.1), rand(10, 20), { col, life: randi(22, 40) }));
  },
};

// ============================================================
//  드랍 아이템
// ============================================================
class Pickup {
  constructor(kind, x, y, z, value) {
    Object.assign(this, { kind, x, y, z, value, t: 0 });
    this.vx = rand(-3.5, 3.5); this.vy = rand(-1.6, 1.6); this.vz = rand(6, 10); this.magnet = false; this.dead = false;
  }
  update(pl) {
    this.t++;
    if (!this.magnet) {
      this.x += this.vx; this.y += this.vy; this.z += this.vz; this.vz -= 0.55;
      if (this.z < 0) { this.z = 0; this.vz = -this.vz * 0.45; this.vx *= 0.6; this.vy *= 0.6; if (Math.abs(this.vz) < 1.2) this.vz = 0; }
      this.y = clamp(this.y, 0, DEPTH);
      if (this.t > 30 && pl && Math.abs(pl.x - this.x) < 120 && Math.abs(pl.y - this.y) < 60 && pl.hp > 0) this.magnet = true;
    } else if (pl) {
      const dx = pl.x - this.x, dy = pl.y - this.y, dz = 50 - this.z, d = Math.hypot(dx, dy, dz);
      const sp = Math.min(22, 4 + this.t * 0.15);
      if (d < sp + 6) { this.collect(pl); return false; }
      this.x += dx / d * sp; this.y += dy / d * sp; this.z += dz / d * sp;
    }
    return !this.dead;
  }
  collect(pl) {
    const x = this.x, y = sy(this.y, this.z);
    if (this.kind === 'gold') {
      Game.stats.gold += this.value; Sfx.play('coin', 1, rand(0.95, 1.15));
      FX.add('world', new Flash(x, y, 4, 22, 8, '255,220,120', 0.8));
    } else {
      const heal = Math.round(pl.hpMax * 0.2);
      pl.hp = Math.min(pl.hpMax, pl.hp + heal);
      Sfx.play('potion');
      FX.add('top', new DmgText(pl.x, sy(pl.y, pl.z) - 140, heal, 'h'));
      for (let i = 0; i < 12; i++) FX.add('world', new Mote(pl.x + rand(-20, 20), sy(pl.y, 0) - rand(0, 100), 0, rand(-2, -0.5), { col: '120,255,140', life: 36, r: 7 }));
    }
  }
  draw(ctx) {
    const x = this.x, y = sy(this.y, this.z);
    if (this.kind === 'gold') {
      const w = Math.abs(Math.cos(this.t * 0.18)) * 7 + 1.5;
      ctx.fillStyle = '#5a3a08'; ctx.beginPath(); ctx.ellipse(x, y - 7, w + 1.5, 8.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.ellipse(x, y - 7, w, 7, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(x - w * 0.3, y - 9, w * 0.35, 2.5, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y - 7, 16, '255,200,80', 0.35); ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.fillStyle = '#1a0a0a'; ctx.beginPath(); ctx.arc(x, y - 10, 9, 0, TAU); ctx.fill(); ctx.fillRect(x - 4, y - 24, 8, 8);
      ctx.fillStyle = '#e02a2a'; ctx.beginPath(); ctx.arc(x, y - 10, 7.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffb0b0'; ctx.beginPath(); ctx.arc(x - 2.5, y - 12.5, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b08040'; ctx.fillRect(x - 3, y - 23, 6, 5);
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y - 10, 22 + Math.sin(this.t * 0.2) * 3, '255,60,60', 0.45); ctx.globalCompositeOperation = 'source-over';
    }
  }
}
