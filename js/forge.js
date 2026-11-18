'use strict';
// ============================================================
//  검의 대장간 (forge) : 36자루 검 전면 개편의 공용 기반
//   1) FP : 모양이 다양한 입자 (불티 · 얼음 조각 · 깃털 · 음표 …)
//   2) 검마다 다른 휘두르기 궤적 (FTRAIL) + 궤적 끝에서 흩날리는 입자
//   3) 스킬 공용 연출 도구 (마법진 · 대형 검기 · 충격파 · 빛기둥 · 바닥 자국)
// ============================================================

const FF = {
  // 이펙트가 너무 많으면 입자 수를 줄인다
  b() { const n = FX.world.length; return n > 420 ? 0.25 : n > 300 ? 0.5 : n > 200 ? 0.75 : 1; },
  n(k) { return Math.max(0, Math.round(k * this.b())); },
  h(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); },
  // 여러 개 한꺼번에
  spray(kind, x, y, n, o = {}) {
    n = this.n(n);
    for (let i = 0; i < n; i++) {
      const a = o.ang !== undefined ? o.ang + rand(-(o.spread ?? 0.6), o.spread ?? 0.6) : rand(0, TAU), sp = rand(o.v0 ?? 1, o.v1 ?? 5);
      FX.add(o.layer || 'world', new FP(x + rand(-(o.rx || 0), o.rx || 0), y + rand(-(o.ry || 0), o.ry || 0), Object.assign({}, o, {
        kind, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0),
        life: randi(o.l0 ?? 20, o.l1 ?? 40), r: rand(o.r0 ?? 3, o.r1 ?? 7),
      })));
    }
  },
  // 강한 타격 한 방 : 섬광 + 충격선 + 링
  impact(x, y, col, s = 1, o = {}) {
    FX.add('world', new Flash(x, y, 10 * s, 150 * s, 16, col, 0.95));
    FX.add('world', new Flash(x, y, 4 * s, 60 * s, 9, '255,255,255', 0.9));
    FX.add('world', new Burst(x, y, { n: 14, r0: 14 * s, r1: 130 * s, life: 11, col: o.burst || '255,255,255' }));
    if (o.ring !== false) FX.add('world', new FRing(x, y, 10 * s, 140 * s, 16, { col, w: 8 * s, ry: o.ry ?? 1 }));
  },
  // 가장 가까운 적 하나
  target(p, r = 520) {
    const f = p.facing;
    return Game.enemies.filter(e => e.hittable() && Math.abs(e.x - p.x) < r && Math.abs(e.y - p.y) < 160)
      .sort((a, b) => ((a.x - p.x) * f < -20 ? 1 : 0) - ((b.x - p.x) * f < -20 ? 1 : 0) || Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
  },
  // 화면을 덮는 연출 (WS.overlay 위)
  screens: [],
  screen(o) { this.screens.push(Object.assign({ t: 0, life: 40, col: '0,0,0', a: 0.5, kind: 'fill' }, o)); },
  drawScreens(ctx) {
    const L = this.screens;
    for (let i = L.length - 1; i >= 0; i--) {
      const s = L[i];
      if (s.t >= s.life) { L.splice(i, 1); continue; }
      const u = s.t / s.life, a = s.a * Math.min(1, s.t / (s.fin ?? 6), (1 - u) * (s.fout ?? 3));
      if (s.kind === 'vig') {
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
        g.addColorStop(0, `rgba(${s.col},0)`); g.addColorStop(1, `rgba(${s.col},${a})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      } else if (s.kind === 'frost') {                      // 화면 가장자리에 서리가 낀다
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
        g.addColorStop(0, 'rgba(200,235,255,0)'); g.addColorStop(1, `rgba(220,245,255,${0.55 * a / s.a})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * a / s.a})`; ctx.lineWidth = 1.4; ctx.beginPath();
        const R = mulberry(5);
        for (let k = 0; k < 26; k++) {
          const c = k % 4, x0 = c % 2 ? W : 0, y0 = c > 1 ? H : 0, sx = c % 2 ? -1 : 1, sy2 = c > 1 ? -1 : 1, L = (90 + R() * 160) * Math.min(1, s.t / 20);
          let x = x0 + sx * R() * 260, y = y0, g2 = (sy2 > 0 ? 0.6 : -0.6) + (R() - 0.5);
          if (R() < 0.5) { x = x0; y = y0 + sy2 * R() * 220; g2 = sx > 0 ? (R() - 0.5) * 0.8 : Math.PI + (R() - 0.5) * 0.8; } else g2 = sy2 > 0 ? Math.PI / 2 + (R() - 0.5) : -Math.PI / 2 + (R() - 0.5);
          ctx.moveTo(x, y);
          for (let j = 0; j < 4; j++) { const nx = x + Math.cos(g2) * L / 4, ny = y + Math.sin(g2) * L / 4; ctx.lineTo(nx, ny); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(g2 + 0.9) * L * 0.12, ny + Math.sin(g2 + 0.9) * L * 0.12); ctx.moveTo(nx, ny); x = nx; y = ny; g2 += (R() - 0.5) * 0.5; }
        }
        ctx.stroke();
      } else if (s.kind === 'bars') {                       // 영화 같은 위아래 검은 띠
        const h = 64 * a / s.a; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
      } else if (s.kind === 'lines') {                      // 집중선
        ctx.save(); ctx.translate(W / 2, H * 0.45); ctx.fillStyle = `rgba(${s.col},${a})`;
        for (let k = 0; k < 40; k++) { const g = FF.h(k, (s.t / 2) | 0) * TAU, r0 = 260 + FF.h(k, 3) * 140, w = 0.012 + FF.h(k, 4) * 0.02; ctx.beginPath(); ctx.moveTo(Math.cos(g - w) * r0, Math.sin(g - w) * r0); ctx.lineTo(Math.cos(g) * 1200, Math.sin(g) * 1200); ctx.lineTo(Math.cos(g + w) * r0, Math.sin(g + w) * r0); ctx.fill(); }
        ctx.restore();
      } else { ctx.fillStyle = `rgba(${s.col},${a})`; ctx.fillRect(0, 0, W, H); }
    }
  },
  reset() { this.screens.length = 0; },
};

// ============================================================
//  FP : 범용 입자 (화면 좌표 = sy 로 바꾼 월드 좌표)
// ============================================================
const FP_DARK = { smoke: 1, petal: 1, leaf: 1, feather: 1, note: 1, coin: 1, drip: 1, candy: 1, bone: 1, ash: 1 };
class FP {
  constructor(x, y, o) {
    this.x = x; this.y = y; this.t = 0;
    this.vx = o.vx || 0; this.vy = o.vy || 0; this.life = o.life || 30; this.r = o.r || 5;
    this.col = o.col || '255,255,255'; this.col2 = o.col2; this.kind = o.kind || 'ember';
    this.grav = o.grav ?? 0; this.drag = o.drag ?? 0.94; this.rot = o.rot ?? rand(0, TAU); this.vr = o.vr ?? rand(-0.2, 0.2);
    this.grow = o.grow ?? 0; this.tx = o.tx; this.ty = o.ty; this.pull = o.pull || 0.04; this.wob = o.wob || 0;
    this.add = !FP_DARK[this.kind];
  }
  update() {
    this.t++;
    if (this.tx !== undefined) { this.vx += (this.tx - this.x) * this.pull; this.vy += (this.ty - this.y) * this.pull; this.vx *= 0.86; this.vy *= 0.86; }
    if (this.wob) this.vx += Math.sin(this.t * 0.25 + this.rot * 3) * this.wob;
    this.x += this.vx; this.y += this.vy; this.vx *= this.drag; this.vy = this.vy * this.drag + this.grav; this.rot += this.vr;
    return this.t < this.life;
  }
  draw(ctx) {
    const u = this.t / this.life, a = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85, r = this.r * (1 + u * this.grow), c = this.col, X = this.x, Y = this.y;
    switch (this.kind) {
      case 'ember':
        drawGlow(ctx, X, Y, r * 2.2, c, a * 0.7);
        ctx.fillStyle = `rgba(${this.col2 || '255,255,230'},${a})`; ctx.beginPath(); ctx.arc(X, Y, Math.max(0.6, r * 0.32), 0, TAU); ctx.fill(); break;
      case 'glow': drawGlow(ctx, X, Y, r, c, a); break;
      case 'spark': {
        ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = Math.max(0.8, r * 0.4 * (1 - u * 0.5)); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X - this.vx * 2.6, Y - this.vy * 2.6); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth *= 0.4; ctx.stroke(); break;
      }
      case 'flame': {                                       // 위로 솟는 불꽃 혀
        const h = r * 2.6 * (1 - u * 0.5);
        ctx.fillStyle = `rgba(${c},${a * 0.75})`; ctx.beginPath(); ctx.moveTo(X - r, Y); ctx.quadraticCurveTo(X - r * 0.8, Y - h * 0.6, X + Math.sin(this.t * 0.4 + this.rot) * r * 0.6, Y - h); ctx.quadraticCurveTo(X + r * 0.8, Y - h * 0.6, X + r, Y); ctx.quadraticCurveTo(X, Y + r * 0.7, X - r, Y); ctx.fill();
        ctx.fillStyle = `rgba(${this.col2 || '255,240,190'},${a * 0.9})`; ctx.beginPath(); ctx.ellipse(X, Y - h * 0.18, r * 0.42, h * 0.32, 0, 0, TAU); ctx.fill(); break;
      }
      case 'shard': {                                       // 회전하는 결정 조각
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.scale(1, 0.55 + Math.abs(Math.sin(this.rot * 2)) * 0.45);
        ctx.fillStyle = `rgba(${c},${a * 0.55})`; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r * 0.45); ctx.lineTo(r * 1.2, 0); ctx.lineTo(0, r * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); break;
      }
      case 'flake': {
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = 1.1; ctx.beginPath();
        for (let k = 0; k < 3; k++) { const g = k * Math.PI / 3; ctx.moveTo(-Math.cos(g) * r, -Math.sin(g) * r); ctx.lineTo(Math.cos(g) * r, Math.sin(g) * r); }
        ctx.stroke(); ctx.restore(); drawGlow(ctx, X, Y, r * 1.6, c, a * 0.35); break;
      }
      case 'star': {                                        // 반짝이는 네 갈래 별
        const s = r * (0.6 + 0.4 * Math.sin(this.t * 0.5 + this.rot * 5));
        ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath();
        ctx.moveTo(X - s * 2, Y); ctx.lineTo(X - s * 0.25, Y - s * 0.25); ctx.lineTo(X, Y - s * 2); ctx.lineTo(X + s * 0.25, Y - s * 0.25); ctx.lineTo(X + s * 2, Y); ctx.lineTo(X + s * 0.25, Y + s * 0.25); ctx.lineTo(X, Y + s * 2); ctx.lineTo(X - s * 0.25, Y + s * 0.25); ctx.closePath(); ctx.fill();
        drawGlow(ctx, X, Y, s * 3, c, a * 0.5); break;
      }
      case 'ring':
        ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = Math.max(0.6, 2.4 * (1 - u)); ctx.beginPath(); ctx.ellipse(X, Y, r, r * (this.ry || 1), 0, 0, TAU); ctx.stroke(); break;
      case 'bubble':
        ctx.strokeStyle = `rgba(${c},${a * 0.9})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`; ctx.fillRect(X - r * 0.45, Y - r * 0.5, Math.max(1, r * 0.3), Math.max(1, r * 0.3)); break;
      case 'bit':                                           // 디지털 조각
        ctx.fillStyle = `rgba(${c},${a})`; ctx.fillRect(X - r / 2, Y - r / 2, r, r); ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`; ctx.fillRect(X - r / 4, Y - r / 4, r / 2, r / 2); break;
      case 'rune': {
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot * 0.3); ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = 1.2; ctx.beginPath();
        const k = (this.rot * 10 | 0) % 4;
        if (k === 0) { ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(0, -r * 0.3); ctx.lineTo(r * 0.7, -r); }
        else if (k === 1) { ctx.moveTo(-r * 0.6, r); ctx.lineTo(0, -r); ctx.lineTo(r * 0.6, r); ctx.moveTo(-r * 0.3, 0); ctx.lineTo(r * 0.3, 0); }
        else if (k === 2) { ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.moveTo(0, -r); ctx.lineTo(0, r); }
        else { ctx.moveTo(-r * 0.6, -r); ctx.lineTo(r * 0.6, r); ctx.moveTo(r * 0.6, -r); ctx.lineTo(-r * 0.6, r); }
        ctx.stroke(); ctx.restore(); drawGlow(ctx, X, Y, r * 2.2, c, a * 0.4); break;
      }
      case 'smoke':
        ctx.globalAlpha = a * 0.5; drawGlow(ctx, X, Y, r * (1 + u * 1.5), c, 1); ctx.globalAlpha = 1; break;
      case 'ash':
        ctx.fillStyle = `rgba(${c},${a * 0.8})`; ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.fillRect(-r / 2, -r / 5, r, r / 2.5); ctx.restore(); break;
      case 'petal': case 'leaf':
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.scale(1, Math.abs(Math.sin(this.rot * 1.7)) * 0.7 + 0.3);
        ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath();
        if (this.kind === 'leaf') { ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r * 0.7, r, 0); ctx.quadraticCurveTo(0, r * 0.7, -r, 0); } else ctx.ellipse(0, 0, r, r * 0.55, 0, 0, TAU);
        ctx.fill(); if (this.kind === 'leaf') { ctx.strokeStyle = `rgba(0,0,0,${a * 0.25})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke(); }
        ctx.restore(); break;
      case 'feather':
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.6, r * 0.45, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(200,180,120,${a})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-r * 1.8, 0); ctx.lineTo(r * 1.5, 0); ctx.stroke(); ctx.restore(); break;
      case 'note':
        ctx.fillStyle = `rgba(${c},${a})`; ctx.save(); ctx.translate(X, Y); ctx.rotate(Math.sin(this.t * 0.2) * 0.3);
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.45, -0.4, 0, TAU); ctx.fill(); ctx.fillRect(r * 0.42, -r * 2, r * 0.22, r * 2); ctx.fillRect(r * 0.42, -r * 2, r * 0.9, r * 0.32); ctx.restore(); break;
      case 'coin': {
        const fl = Math.abs(Math.cos(this.t * 0.35 + this.rot));
        ctx.fillStyle = `rgba(150,100,10,${a})`; ctx.beginPath(); ctx.ellipse(X, Y, r * fl + 0.6, r, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(255,215,80,${a})`; ctx.beginPath(); ctx.ellipse(X, Y, Math.max(0.4, r * fl - 0.8), r - 0.8, 0, 0, TAU); ctx.fill(); break;
      }
      case 'candy':
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = r * 0.35; ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 4); ctx.stroke(); ctx.restore(); break;
      case 'bone':
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.fillStyle = `rgba(236,230,210,${a})`; ctx.fillRect(-r, -r * 0.2, r * 2, r * 0.4);
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r, -r * 0.22, r * 0.3, 0, TAU); ctx.arc(s * r, r * 0.22, r * 0.3, 0, TAU); ctx.fill(); } ctx.restore(); break;
      case 'drip':
        ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath(); ctx.moveTo(X, Y - r * 2); ctx.quadraticCurveTo(X + r, Y, X, Y + r); ctx.quadraticCurveTo(X - r, Y, X, Y - r * 2); ctx.fill(); break;
      case 'claw': {                                        // 세 줄 할퀸 자국
        ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot); ctx.fillStyle = `rgba(${c},${a})`;
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-r * 2, k * r * 0.7 - r * 0.3); ctx.quadraticCurveTo(0, k * r * 0.7 - r * 0.15 * (1 - u), r * 2, k * r * 0.7 + r * 0.3); ctx.quadraticCurveTo(0, k * r * 0.7 + r * 0.15, -r * 2, k * r * 0.7 - r * 0.3); ctx.fill(); }
        ctx.restore(); break;
      }
    }
  }
}

// ---------- 타원 충격 링 (두 겹 + 안쪽 채움) ----------
class FRing {
  constructor(x, y, r0, r1, life, o = {}) { Object.assign(this, { x, y, r0, r1, life, t: 0, add: true, col: o.col || '255,255,255', w: o.w || 8, ry: o.ry ?? 0.32, fill: o.fill ?? 0.18, delay: o.delay || 0 }); }
  update() { return ++this.t < this.life + this.delay; }
  draw(ctx) {
    const t = this.t - this.delay; if (t < 0) return;
    const u = t / this.life, r = lerp(this.r0, this.r1, E.out3(u)), a = 1 - u;
    if (this.fill) { const g = ctx.createRadialGradient(this.x, this.y, r * 0.2, this.x, this.y, r); g.addColorStop(0, `rgba(${this.col},0)`); g.addColorStop(0.85, `rgba(${this.col},${this.fill * a})`); g.addColorStop(1, `rgba(${this.col},0)`); ctx.save(); ctx.translate(this.x, this.y); ctx.scale(1, this.ry); ctx.translate(-this.x, -this.y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = `rgba(${this.col},${0.85 * a})`; ctx.lineWidth = this.w * a + 1;
    ctx.beginPath(); ctx.ellipse(this.x, this.y, r, r * this.ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * a})`; ctx.lineWidth = this.w * 0.3 * a + 0.5; ctx.stroke();
    ctx.strokeStyle = `rgba(${this.col},${0.4 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(this.x, this.y, r * 0.8, r * 0.8 * this.ry, 0, 0, TAU); ctx.stroke();
  }
}

// ---------- 바닥 마법진 ----------
//  o.kind : 'rune'(룬 고리) · 'clock'(시계) · 'star'(별 · 육망성) · 'sun' · 'yin' · 'hex'
class FCircle {
  constructor(x, y, r, life, o = {}) { Object.assign(this, { x, y, r, life, t: 0, add: true, col: o.col || '170,140,255', col2: o.col2 || '255,255,255', kind: o.kind || 'rune', spin: o.spin ?? 0.02, ry: o.ry ?? 0.34, grow: o.grow ?? 10, follow: o.follow, up: o.up || 0, a: o.a ?? 1 }); }
  update() { if (this.follow) { this.x = this.follow.x; this.y = this.follow.y; } return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = this.a * Math.min(1, this.t / this.grow, (1 - u) * 5), r = this.r * E.out3(Math.min(1, this.t / this.grow)), rot = this.t * this.spin, c = this.col;
    ctx.save(); ctx.translate(this.x, sy(this.y, this.up)); ctx.scale(1, this.ry);
    drawGlow(ctx, 0, 0, r * 1.25, c, 0.28 * a);
    ctx.lineCap = 'round';
    const ring = (rr, w, al) => { ctx.strokeStyle = `rgba(${c},${al * a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); };
    ring(r, 3.2, 0.95); ring(r * 0.93, 1.2, 0.7); ring(r * 0.62, 2, 0.8);
    ctx.strokeStyle = `rgba(${this.col2},${0.9 * a})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    // 고리 사이 룬 문자
    ctx.save(); ctx.rotate(rot); ctx.strokeStyle = `rgba(${c},${0.9 * a})`; ctx.lineWidth = 1.6;
    const n = Math.max(10, Math.round(r / 9));
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const g = i / n * TAU, rr = r * 0.775, s = r * 0.07, cx = Math.cos(g) * rr, cy = Math.sin(g) * rr, k = (i * 7) % 4, tx = -Math.sin(g), ty = Math.cos(g);
      const P = (p, q) => [cx + tx * p + Math.cos(g) * q, cy + ty * p + Math.sin(g) * q];
      const L = (a0, b0, a1, b1) => { const A = P(a0, b0), B = P(a1, b1); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); };
      if (k === 0) { L(0, -s, 0, s); L(0, 0, s * 0.8, -s); } else if (k === 1) { L(-s * 0.6, s, 0, -s); L(0, -s, s * 0.6, s); } else if (k === 2) { L(-s * 0.6, -s, s * 0.6, s); L(s * 0.6, -s, -s * 0.6, s); } else { L(-s * 0.5, -s, -s * 0.5, s); L(-s * 0.5, 0, s * 0.6, 0); }
    }
    ctx.stroke(); ctx.restore();
    // 안쪽 도형
    ctx.save(); ctx.rotate(-rot * 1.6); ctx.strokeStyle = `rgba(${this.col2},${0.75 * a})`; ctx.lineWidth = 1.4; ctx.beginPath();
    const poly = (k, rr, skip = 1) => { for (let i = 0; i <= k; i++) { const g = (i * skip) / k * TAU - Math.PI / 2; i ? ctx.lineTo(Math.cos(g) * rr, Math.sin(g) * rr) : ctx.moveTo(Math.cos(g) * rr, Math.sin(g) * rr); } };
    switch (this.kind) {
      case 'star': poly(5, r * 0.6, 2); break;
      case 'hex': poly(3, r * 0.6); ctx.moveTo(0, 0); ctx.rotate(Math.PI); poly(3, r * 0.6); break;
      case 'clock':
        for (let i = 0; i < 12; i++) { const g = i / 12 * TAU; ctx.moveTo(Math.cos(g) * r * 0.5, Math.sin(g) * r * 0.5); ctx.lineTo(Math.cos(g) * r * 0.6, Math.sin(g) * r * 0.6); }
        ctx.moveTo(0, 0); ctx.lineTo(Math.cos(rot * 6) * r * 0.45, Math.sin(rot * 6) * r * 0.45); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(rot) * r * 0.3, Math.sin(rot) * r * 0.3); break;
      case 'sun': for (let i = 0; i < 16; i++) { const g = i / 16 * TAU; ctx.moveTo(Math.cos(g) * r * 0.2, Math.sin(g) * r * 0.2); ctx.lineTo(Math.cos(g) * r * (i % 2 ? 0.45 : 0.6), Math.sin(g) * r * (i % 2 ? 0.45 : 0.6)); } break;
      case 'yin': ctx.arc(0, 0, r * 0.45, 0, TAU); ctx.moveTo(0, -r * 0.45); ctx.arc(0, -r * 0.225, r * 0.225, -Math.PI / 2, Math.PI / 2); ctx.arc(0, r * 0.225, r * 0.225, -Math.PI / 2, Math.PI / 2, true); break;
      default: poly(4, r * 0.6); ctx.moveTo(0, 0); ctx.rotate(Math.PI / 4); poly(4, r * 0.6);
    }
    ctx.stroke(); ctx.restore();
    ctx.restore();
  }
}

// ---------- 공간을 가르는 대형 참격 (휘어진 칼자국 + 갈라진 빛 + 잔광) ----------
//  x,y = 화면 좌표 중심, ang = 기울기, L = 길이 반, o.bend 휨, o.col 색, o.delay 지연, o.th 두께
class FSlash {
  constructor(x, y, ang, L, o = {}) {
    Object.assign(this, { x, y, ang, L, t: 0, add: true, col: o.col || '200,230,255', core: o.core || '255,255,255', life: o.life || 22, th: o.th || 14, bend: o.bend ?? 0.12, delay: o.delay || 0, open: o.open ?? 6, dark: o.dark });
    this.sparks = o.sparks ?? true; this.fired = false;
  }
  update() {
    this.t++;
    const t = this.t - this.delay;
    if (t === 1 && this.sparks) {
      const c = Math.cos(this.ang), s = Math.sin(this.ang);
      for (let i = 0; i < FF.n(10); i++) { const k = rand(-1, 1); FX.add('world', new FP(this.x + c * this.L * k, this.y + s * this.L * k - this.bend * this.L * (1 - k * k), { kind: 'spark', vx: c * rand(-4, 4) - s * rand(2, 7), vy: s * rand(-4, 4) + c * rand(2, 7) * (Math.random() < 0.5 ? -1 : 1), life: randi(10, 18), r: rand(2, 4), col: this.col, drag: 0.86 })); }
    }
    return t < this.life;
  }
  path(ctx, L, th, e) {
    const n = 20; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const k = -1 + 2 * i / n, x = L * k * e, y = -this.bend * L * (1 - k * k); ctx.lineTo(x, y - th * (1 - k * k)); }
    for (let i = n; i >= 0; i--) { const k = -1 + 2 * i / n, x = L * k * e, y = -this.bend * L * (1 - k * k); ctx.lineTo(x, y + th * (1 - k * k) * 0.5); }
    ctx.closePath();
  }
  draw(ctx) {
    const t = this.t - this.delay; if (t < 0) return;
    const u = t / this.life, e = E.out5(Math.min(1, t / 4)), a = t < 4 ? 1 : 1 - (t - 4) / (this.life - 4);
    const op = Math.min(1, t / this.open);
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang);
    if (this.dark) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(${this.dark},${0.85 * a})`; this.path(ctx, this.L * 1.02, this.th * (0.6 + op * 0.8), e); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
    ctx.fillStyle = `rgba(${this.col},${0.35 * a})`; this.path(ctx, this.L * 1.08, this.th * 2.6 * (0.5 + op * 0.5), e); ctx.fill();
    ctx.fillStyle = `rgba(${this.col},${0.85 * a})`; this.path(ctx, this.L, this.th * (1 - u * 0.6), e); ctx.fill();
    ctx.fillStyle = `rgba(${this.core},${a})`; this.path(ctx, this.L * 0.96, this.th * 0.32 * (1 - u * 0.5), e); ctx.fill();
    drawGlow(ctx, 0, -this.bend * this.L, this.L * 0.9, this.col, 0.28 * a, 1, 0.25);
    ctx.restore();
  }
}

// ---------- 하늘에서 내리꽂는 빛기둥 (월드 좌표) ----------
class FBeam {
  constructor(x, y, w, life, o = {}) { Object.assign(this, { x, y, w, life, t: 0, add: true, col: o.col || '255,240,170', core: o.core || '255,255,255', h: o.h || 760, delay: o.delay || 0, rays: o.rays ?? true }); }
  update() { return ++this.t < this.life + this.delay; }
  draw(ctx) {
    const t = this.t - this.delay; if (t < 0) return;
    const u = t / this.life, gy = sy(this.y, 0), on = E.out3(Math.min(1, t / 5)), a = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4, w = this.w * (u < 0.15 ? 0.3 + on * 0.9 : 1.2 - u * 0.6);
    const g = ctx.createLinearGradient(this.x - w, 0, this.x + w, 0);
    g.addColorStop(0, `rgba(${this.col},0)`); g.addColorStop(0.3, `rgba(${this.col},${0.5 * a})`); g.addColorStop(0.5, `rgba(${this.core},${0.95 * a})`); g.addColorStop(0.7, `rgba(${this.col},${0.5 * a})`); g.addColorStop(1, `rgba(${this.col},0)`);
    ctx.fillStyle = g; ctx.fillRect(this.x - w, gy - this.h * on, w * 2, this.h * on);
    drawGlow(ctx, this.x, gy, w * 3, this.col, 0.8 * a, 1, 0.32);
    drawGlow(ctx, this.x, gy - 10, w * 1.4, this.core, 0.7 * a, 1, 0.5);
    if (this.rays) for (let i = 0; i < 6; i++) { const ph = (t * 0.05 + i / 6) % 1, yy = gy - ph * this.h * 0.7; ctx.fillStyle = `rgba(${this.core},${0.6 * a * (1 - ph)})`; ctx.fillRect(this.x - w * 0.12 + Math.sin(i * 3) * w * 0.4, yy, 2, 26); }
  }
}

// ---------- 바닥 자국 (그을음 · 서리 · 균열 · 핏자국 …) ----------
class FDecal {
  constructor(x, y, r, life, o = {}) { Object.assign(this, { x, y, r, life, t: 0, kind: o.kind || 'scorch', col: o.col || '255,120,40', seed: randi(1, 9999) }); this.add = false; }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = Math.min(1, this.t / 4, (1 - u) * 3), gy = sy(this.y, 0), R = mulberry(this.seed), r = this.r;
    ctx.save();
    if (this.kind === 'scorch') {
      ctx.fillStyle = `rgba(14,8,6,${0.5 * a})`; ctx.beginPath(); ctx.ellipse(this.x, gy, r, r * 0.3, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; const h = Math.max(0, 1 - u * 2);
      ctx.strokeStyle = `rgba(${this.col},${0.8 * a * h})`; ctx.lineWidth = 2;
      ctx.beginPath(); for (let i = 0; i < 7; i++) { const g = R() * TAU, l = r * (0.4 + R() * 0.6); ctx.moveTo(this.x, gy); ctx.lineTo(this.x + Math.cos(g) * l * 0.5, gy + Math.sin(g) * l * 0.15); ctx.lineTo(this.x + Math.cos(g + 0.2) * l, gy + Math.sin(g + 0.2) * l * 0.3); } ctx.stroke();
      drawGlow(ctx, this.x, gy, r * 0.8, this.col, 0.5 * a * h, 1, 0.3);
    } else if (this.kind === 'frost') {
      ctx.fillStyle = `rgba(200,235,255,${0.28 * a})`; ctx.beginPath(); ctx.ellipse(this.x, gy, r, r * 0.3, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(235,250,255,${0.7 * a})`; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < 9; i++) { const g = R() * TAU, l = r * (0.5 + R() * 0.5), mx = this.x + Math.cos(g) * l * 0.5, my = gy + Math.sin(g) * l * 0.15; ctx.moveTo(this.x, gy); ctx.lineTo(mx, my); ctx.lineTo(this.x + Math.cos(g) * l, gy + Math.sin(g) * l * 0.3); ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(g + 0.8) * l * 0.25, my + Math.sin(g + 0.8) * l * 0.08); } ctx.stroke();
    } else if (this.kind === 'crack') {
      ctx.strokeStyle = `rgba(20,14,10,${0.75 * a})`; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { let x = this.x, y = gy, g = R() * TAU; ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { g += (R() - 0.5) * 0.9; const l = r * 0.28 * (1 - k * 0.15); x += Math.cos(g) * l; y += Math.sin(g) * l * 0.3; ctx.lineTo(x, y); } } ctx.stroke();
      if (this.col) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${this.col},${0.6 * a * Math.max(0, 1 - u * 1.5)})`; ctx.lineWidth = 1; ctx.stroke(); }
    } else if (this.kind === 'pool') {                       // 액체 웅덩이 (피 · 독)
      ctx.fillStyle = `rgba(${this.col},${0.55 * a})`; ctx.beginPath();
      for (let i = 0; i <= 16; i++) { const g = i / 16 * TAU, rr = r * (0.75 + R() * 0.25); i ? ctx.lineTo(this.x + Math.cos(g) * rr, gy + Math.sin(g) * rr * 0.3) : ctx.moveTo(this.x + Math.cos(g) * rr, gy + Math.sin(g) * rr * 0.3); } ctx.fill();
    } else if (this.kind === 'glyph') {                      // 빛나는 문양
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${this.col},${0.7 * a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(this.x, gy, r, r * 0.3, 0, 0, TAU); ctx.stroke(); drawGlow(ctx, this.x, gy, r, this.col, 0.25 * a, 1, 0.3);
    }
    ctx.restore();
  }
}

// ---------- 날아가는 검기 (판정 포함) ----------
//  o.hd 타격, o.r 판정 반경, o.style 'crescent'|'x'|'wave', o.pierce, o.onHit, o.trail 입자 종류
class FWave {
  constructor(p, x, y, z, vx, o = {}) {
    Object.assign(this, { p, x, y, z, vx, vy: o.vy || 0, t: 0, add: true, life: o.life || 40, r: o.r || 60, col: o.col || '200,230,255', core: o.core || '255,255,255', hd: o.hd, set: new Set(), style: o.style || 'crescent', size: o.size || 1, onHit: o.onHit, pierce: o.pierce ?? true, part: o.part, accel: o.accel || 1, onEnd: o.onEnd, rehit: o.rehit || 0 });
    this.hitT = new Map();
  }
  update() {
    this.t++; this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.vx *= this.accel;
    const p = this.p, d = sign(this.vx);
    for (const e of Game.enemies) {
      if (!e.hittable()) continue;
      if (this.rehit) { if ((this.hitT.get(e) ?? -99) > this.t - this.rehit) continue; } else if (this.set.has(e)) continue;
      if (Math.abs(e.x - this.x) > this.r * this.size + e.w || Math.abs(e.y - this.y) > 46 + e.d || e.z > this.z + 120) continue;
      this.set.add(e); this.hitT.set(e, this.t);
      if (this.hd) applyHit(p, e, this.hd, { noStopAtt: true, dir: d, hz: this.z + 60 });
      if (this.onHit) this.onHit(this, e);
      if (!this.pierce) { this.t = this.life; break; }
    }
    if (this.part && this.t % 2 === 0) FX.add('world', new FP(this.x - d * rand(0, 30), sy(this.y, this.z + rand(20, 110) * this.size), { kind: this.part, vx: -d * rand(0.5, 2), vy: rand(-1.5, 0.5), life: randi(16, 28), r: rand(2, 5), col: this.col }));
    const r = Game.room;
    if (this.t >= this.life || (r && (this.x < r.minX - 80 || this.x > r.maxX + 80))) { if (this.onEnd) this.onEnd(this); return false; }
    return true;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z + 64 * this.size), u = this.t / this.life, a = Math.min(1, this.t / 3, (1 - u) * 4), d = sign(this.vx), s = this.size;
    ctx.save(); ctx.translate(X, Y); ctx.scale(d * s, s);
    drawGlow(ctx, -10, 0, 110, this.col, 0.35 * a, 1, 1.1);
    if (this.style === 'x') {
      for (const k of [-1, 1]) { ctx.save(); ctx.rotate(k * 0.75); ctx.fillStyle = `rgba(${this.col},${0.85 * a})`; ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(0, -9); ctx.lineTo(70, 0); ctx.lineTo(0, 9); ctx.fill(); ctx.fillStyle = `rgba(${this.core},${a})`; ctx.beginPath(); ctx.moveTo(-64, 0); ctx.lineTo(0, -3); ctx.lineTo(64, 0); ctx.lineTo(0, 3); ctx.fill(); ctx.restore(); }
    } else {
      const th = this.style === 'wave' ? 34 : 24;
      for (let k = 2; k >= 0; k--) {                         // 뒤로 길게 끌리는 잔상 세 겹
        const ox = -k * 22, al = a * (k ? 0.25 / k : 1);
        ctx.fillStyle = `rgba(${k ? this.col : this.col},${al * 0.9})`;
        ctx.beginPath(); ctx.moveTo(ox - 8, -86); ctx.quadraticCurveTo(ox + 54, 0, ox - 8, 86); ctx.quadraticCurveTo(ox + 54 - th, 0, ox - 8, -86); ctx.fill();
      }
      ctx.fillStyle = `rgba(${this.core},${a})`; ctx.beginPath(); ctx.moveTo(-4, -76); ctx.quadraticCurveTo(50, 0, -4, 76); ctx.quadraticCurveTo(42, 0, -4, -76); ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- 가지 치는 번개 (화면 좌표) ----------
//  o.w 굵기 · o.col 색 · o.br 가지 수 · o.amp 흔들림 · o.life
class FLightning {
  constructor(x0, y0, x1, y1, o = {}) { Object.assign(this, { x0, y0, x1, y1, t: 0, add: true, life: o.life || 14, w: o.w || 4, col: o.col || '255,235,110', br: o.br ?? 3, amp: o.amp ?? 0.18, glow: o.glow ?? 1 }); this.build(); }
  seg(x0, y0, x1, y1, amp, depth) {
    const pts = [[x0, y0], [x1, y1]];
    for (let k = 0; k < 5; k++) {                              // 중점 변위
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); out.push([(a[0] + b[0]) / 2 - dy / L * L * amp * rand(-1, 1), (a[1] + b[1]) / 2 + dx / L * L * amp * rand(-1, 1)], b); }
      pts.length = 0; pts.push(...out); amp *= 0.55;
    }
    return pts;
  }
  build() {
    this.main = this.seg(this.x0, this.y0, this.x1, this.y1, this.amp, 0);
    this.branches = [];
    for (let i = 0; i < this.br; i++) {
      const s = this.main[randi(4, this.main.length - 6)], dx = this.x1 - this.x0, dy = this.y1 - this.y0, L = Math.hypot(dx, dy) * rand(0.15, 0.35), a = Math.atan2(dy, dx) + rand(-0.9, 0.9);
      this.branches.push(this.seg(s[0], s[1], s[0] + Math.cos(a) * L, s[1] + Math.sin(a) * L, 0.25, 1));
    }
  }
  update() { this.t++; if (this.t % 3 === 0) this.build(); return this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = (u < 0.15 ? 1 : 1 - (u - 0.15) / 0.85) * (this.t % 4 === 1 ? 0.55 : 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const path = P => { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
    for (const [w, col, al] of [[this.w * 4, this.col, 0.18], [this.w * 1.6, this.col, 0.75], [this.w * 0.6, '255,255,255', 1]]) {
      ctx.strokeStyle = `rgba(${col},${al * a})`; ctx.lineWidth = w; path(this.main);
      ctx.lineWidth = w * 0.5; for (const b of this.branches) path(b);
    }
    if (this.glow) { drawGlow(ctx, this.x1, this.y1, 60 * this.glow, this.col, 0.8 * a); drawGlow(ctx, this.x0, this.y0, 30 * this.glow, this.col, 0.4 * a); }
  }
}

// ---------- 지연 실행 + 매 프레임 실행 ----------
class FRun {
  constructor(life, fn, o = {}) { Object.assign(this, { life, fn, t: 0, add: true, drawFn: o.draw }); }
  update() { this.t++; if (this.fn(this) === false) return false; return this.t < this.life; }
  draw(ctx) { if (this.drawFn) this.drawFn(ctx, this); }
}

// ============================================================
//  검마다 다른 휘두르기 궤적
//   k : 궤적 종류 · c1 주색 · c2 날빛 · dk 아래 깔리는 어두운 색(source-over) · w 너비 (1 = 기본)
//   p : 궤적 끝에서 흩날리는 입자 종류 · pc 입자 색 · pr 입자 빈도(0~1)
// ============================================================
const FTRAIL = {
  w0: { k: 'steel', c1: '140,200,255', c2: '210,235,255' },
  w1: { k: 'flame', c1: '255,100,20', c2: '255,200,90', dk: '50,8,0', p: 'flame', pc: '255,120,30', pr: 0.9 },
  w2: { k: 'frost', c1: '120,205,255', c2: '230,250,255', p: 'flake', pc: '210,240,255', pr: 0.6 },
  w3: { k: 'bolt', c1: '255,225,70', c2: '255,255,210', p: 'spark', pc: '255,240,140', pr: 0.8 },
  w4: { k: 'blood', c1: '220,20,50', c2: '255,120,140', dk: '70,0,12', w: 1.05, p: 'drip', pc: '170,10,30', pr: 0.5 },
  w5: { k: 'stone', c1: '220,180,110', c2: '255,235,190', dk: '60,46,32', w: 1.35, p: 'ash', pc: '150,130,100', pr: 0.7 },
  w6: { k: 'wind', c1: '150,255,200', c2: '235,255,245', w: 0.85, p: 'leaf', pc: '170,240,190', pr: 0.25 },
  w7: { k: 'venom', c1: '110,220,50', c2: '220,255,140', dk: '16,40,6', p: 'bubble', pc: '150,240,80', pr: 0.5 },
  w8: { k: 'holy', c1: '255,225,120', c2: '255,255,235', w: 1.1, p: 'star', pc: '255,240,180', pr: 0.45 },
  w9: { k: 'void', c1: '170,80,255', c2: '230,190,255', dk: '14,0,30', w: 1.2, p: 'glow', pc: '150,60,255', pr: 0.7 },
  w10: { k: 'magma', c1: '255,90,20', c2: '255,210,120', dk: '30,10,6', w: 1.35, p: 'ember', pc: '255,120,30', pr: 0.9 },
  w11: { k: 'clock', c1: '150,220,255', c2: '255,240,190', p: 'rune', pc: '160,225,255', pr: 0.25 },
  w12: { k: 'exec', c1: '200,20,50', c2: '255,200,210', dk: '20,4,8', w: 1.25, p: 'ash', pc: '60,10,16', pr: 0.4 },
  w13: { k: 'moon', c1: '170,195,255', c2: '255,255,255', w: 1.15, p: 'star', pc: '210,225,255', pr: 0.3 },
  w14: { k: 'star', c1: '255,225,130', c2: '255,255,230', dk: '8,10,40', p: 'star', pc: '255,236,160', pr: 0.6 },
  w15: { k: 'shadow', c1: '140,90,235', c2: '210,190,255', dk: '6,2,16', w: 0.9, p: 'smoke', pc: '20,10,40', pr: 0.5 },
  w16: { k: 'holy', c1: '255,245,215', c2: '255,255,255', w: 1.1, p: 'feather', pc: '255,255,245', pr: 0.3 },
  w17: { k: 'chaos', c1: '255,90,200', c2: '255,230,255', dk: '20,4,30', w: 1.15, p: 'shard', pc: '255,120,220', pr: 0.6 },
  w18: { k: 'iai', c1: '200,225,255', c2: '255,255,255', w: 0.7 },
  w19: { k: 'leaf', c1: '120,210,70', c2: '230,255,170', p: 'leaf', pc: '110,200,60', pr: 0.5 },
  w20: { k: 'dice', c1: '255,70,80', c2: '255,255,255' },
  w21: { k: 'gold', c1: '255,200,60', c2: '255,250,200', p: 'coin', pc: '255,210,80', pr: 0.25 },
  w22: { k: 'steam', c1: '255,170,90', c2: '255,240,210', dk: '40,24,14', w: 1.2, p: 'smoke', pc: '235,235,240', pr: 0.55 },
  w23: { k: 'sun', c1: '255,205,70', c2: '255,255,220', w: 1.15, p: 'ember', pc: '255,220,100', pr: 0.6 },
  w24: { k: 'candy', c1: '255,110,190', c2: '255,255,255', p: 'candy', pc: '255,140,210', pr: 0.25 },
  w25: { k: 'steel', c1: '170,200,255', c2: '240,248,255', w: 1.25, p: 'spark', pc: '220,235,255', pr: 0.3 },
  w26: { k: 'bone', c1: '230,222,190', c2: '255,255,240', dk: '30,26,20', w: 1.2, p: 'ash', pc: '200,190,160', pr: 0.4 },
  w27: { k: 'yin', c1: '230,235,255', c2: '255,255,255', dk: '8,8,16' },
  w28: { k: 'arcane', c1: '150,110,255', c2: '235,225,255', p: 'rune', pc: '180,150,255', pr: 0.45 },
  w29: { k: 'curse', c1: '160,60,220', c2: '230,180,255', dk: '16,2,24', p: 'smoke', pc: '40,10,60', pr: 0.6 },
  w30: { k: 'prism', c1: '200,235,255', c2: '255,255,255', p: 'shard', pc: '220,240,255', pr: 0.45 },
  w31: { k: 'cyber', c1: '60,255,225', c2: '230,255,250', w: 0.95, p: 'bit', pc: '90,255,230', pr: 0.6 },
  w32: { k: 'flame', c1: '230,60,20', c2: '255,180,80', dk: '40,6,2', w: 1.3, p: 'ember', pc: '255,110,40', pr: 0.9 },
  w33: { k: 'requiem', c1: '200,165,255', c2: '255,240,255', p: 'note', pc: '225,200,255', pr: 0.3 },
  w34: { k: 'myth', c1: '255,190,90', c2: '255,250,220', dk: '40,10,6', w: 1.45, p: 'ember', pc: '255,215,130', pr: 0.9 },
  w35: { k: 'talon', c1: '255,70,60', c2: '255,220,210', w: 0.9 },
};

// 궤적 그리기 : 끊기지 않은 구간마다 겹겹의 띠 + 종류별 장식
Player.prototype.drawTrail = function (ctx) {
  const tr = this.trail, n = tr.length;
  if (n < 2) return;
  const S = FTRAIL[this.wdef && this.wdef.id] || FTRAIL.w0, T = Game.time, ws = S.w || 1;
  const K = new Float32Array(n);
  for (let i = 0; i < n; i++) K[i] = Math.max(0, 1 - tr[i].age / 7) * Math.pow((i + 1) / n, 0.55);
  const ok = i => { const a = tr[i - 1], b = tr[i]; return b.age - a.age <= 1 && Math.hypot(b.tx - a.tx, b.ty - a.ty) < 170; };
  const P = (q, u) => [lerp(q.bx, q.tx, u), lerp(q.by, q.ty, u)];
  // 오래된 쪽일수록 칼끝 쪽으로 얇아져 초승달 모양이 된다
  const TP = new Float32Array(n);
  for (let i = 0; i < n; i++) TP[i] = clamp(K[i] * 1.35, 0.1, 1);
  const band = (u0, u1, col, am, jit) => {
    for (let i = 1; i < n; i++) {
      if (!ok(i)) continue;
      const a = tr[i - 1], b = tr[i], k = K[i] * am;
      if (k < 0.01) continue;
      const ja = jit ? jit(i - 1) : 0, jb = jit ? jit(i) : 0;
      const ua = u1 - (u1 - u0) * TP[i - 1], ub = u1 - (u1 - u0) * TP[i];
      const A0 = P(a, ua), A1 = P(a, u1 + ja), B1 = P(b, u1 + jb), B0 = P(b, ub);
      ctx.fillStyle = `rgba(${col},${k})`; ctx.beginPath(); ctx.moveTo(A0[0], A0[1]); ctx.lineTo(A1[0], A1[1]); ctx.lineTo(B1[0], B1[1]); ctx.lineTo(B0[0], B0[1]); ctx.closePath(); ctx.fill();
    }
  };
  const tipLine = (u, col, w, am, jit) => {
    ctx.strokeStyle = `rgba(${col},${am})`; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    let on = false; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (i && !ok(i)) on = false;
      if (K[i] < 0.05) { on = false; continue; }
      const q = P(tr[i], u), o = jit ? jit(i) : [0, 0];
      on ? ctx.lineTo(q[0] + o[0], q[1] + o[1]) : ctx.moveTo(q[0] + o[0], q[1] + o[1]); on = true;
    }
    ctx.stroke();
  };
  const dir = i => { const q = tr[i], dx = q.tx - q.bx, dy = q.ty - q.by, L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
  const lo = 1 - 0.65 * ws;
  // 1) 어두운 바탕 (피 · 공허 · 용암 …)
  if (S.dk) { ctx.globalCompositeOperation = 'source-over'; band(lo + 0.2, 1.02, S.dk, 0.42); }
  ctx.globalCompositeOperation = 'lighter';
  const c1 = S.c1, c2 = S.c2;
  switch (S.k) {
    case 'iai':                                             // 가늘고 긴 하얀 일섬
      band(0.7, 1.02, c1, 0.18); band(0.9, 1.01, c2, 0.85); tipLine(1.0, '255,255,255', 1.4, 0.9); break;
    case 'wind':
      band(lo, 1, c1, 0.08);
      for (const [u, w] of [[0.62, 1], [0.8, 1.4], [0.98, 2]]) tipLine(u, c1, w * 2.4, 0.25), tipLine(u, c2, w, 0.8);
      break;
    case 'talon':                                           // 세 갈래 발톱
      for (const u of [0.7, 0.85, 1.0]) { band(u - 0.06, u, c1, 0.55); tipLine(u, c2, 1.2, 0.85); }
      break;
    case 'prism': {
      const cols = ['255,80,80', '255,180,60', '255,255,90', '90,255,120', '80,200,255', '150,110,255'];
      cols.forEach((c, j) => band(0.55 + j * 0.075, 0.62 + j * 0.075, c, 0.4)); band(0.95, 1.01, '255,255,255', 0.9); break;
    }
    case 'yin':                                             // 위는 흰빛, 아래는 먹빛
      band(lo + 0.15, 0.75, '230,235,255', 0.2); band(0.75, 1.01, '255,255,255', 0.55); tipLine(1.0, '255,255,255', 1.6, 0.9); break;
    case 'chaos':
      for (let i = 1; i < n; i++) { if (!ok(i)) continue; const q = hslRgb((T * 4 + i * 9) % 360, 0.9, 0.62).join(','), a = tr[i - 1], b = tr[i], k = K[i]; for (const [u0, u1, am] of [[lo, 1, 0.12], [0.6, 1, 0.4], [0.88, 1.01, 0.8]]) { const A0 = P(a, u0), A1 = P(a, u1), B1 = P(b, u1), B0 = P(b, u0); ctx.fillStyle = `rgba(${u0 > 0.8 ? '255,240,255' : q},${k * am})`; ctx.beginPath(); ctx.moveTo(A0[0], A0[1]); ctx.lineTo(A1[0], A1[1]); ctx.lineTo(B1[0], B1[1]); ctx.lineTo(B0[0], B0[1]); ctx.fill(); } }
      break;
    case 'candy':
      for (let i = 1; i < n; i++) { if (!ok(i)) continue; const a = tr[i - 1], b = tr[i], k = K[i], c = (i >> 2) % 2 ? '255,255,255' : c1; const A0 = P(a, 0.55), A1 = P(a, 1), B1 = P(b, 1), B0 = P(b, 0.55); ctx.fillStyle = `rgba(${c},${k * 0.5})`; ctx.beginPath(); ctx.moveTo(A0[0], A0[1]); ctx.lineTo(A1[0], A1[1]); ctx.lineTo(B1[0], B1[1]); ctx.lineTo(B0[0], B0[1]); ctx.fill(); }
      band(0.9, 1.01, '255,255,255', 0.8); break;
    default: {
      // 기본 겹띠 : 바깥 번짐 → 주색 → 날빛 → 흰 심
      const fl = S.k === 'flame' || S.k === 'magma' || S.k === 'myth';
      const jit = fl ? i => (FF.h(i, (T / 2) | 0) - 0.3) * 0.16 : null;
      band(lo, 1.07, c1, 0.2, jit); band(lo + 0.25 * ws, 1.0, c1, 0.5, jit); band(0.8, 1.0, c2, 0.75); band(0.94, 1.01, '255,255,255', 0.9);
    }
  }
  // 3) 종류별 장식
  switch (S.k) {
    case 'flame': case 'magma': case 'myth':                // 날 끝에서 솟는 불꽃 혀
      for (let i = 0; i < n; i += 3) {
        const k = K[i]; if (k < 0.12) continue;
        const q = P(tr[i], 1), d = dir(i), h = FF.h(i, (T / 3) | 0), L = (10 + h * 22) * k * ws, w = 5 * k;
        const ex = q[0] + d[0] * L, ey = q[1] + d[1] * L - L * 0.4;
        ctx.fillStyle = `rgba(${c1},${0.55 * k})`; ctx.beginPath(); ctx.moveTo(q[0] - d[1] * w, q[1] + d[0] * w); ctx.quadraticCurveTo(q[0] + d[0] * L * 0.5, q[1] + d[1] * L * 0.5, ex, ey); ctx.quadraticCurveTo(q[0] + d[0] * L * 0.4, q[1] + d[1] * L * 0.4 - w, q[0] + d[1] * w, q[1] - d[0] * w); ctx.fill();
      }
      if (S.k === 'myth') tipLine(0.98, '255,255,220', 2, 0.6, i => [(FF.h(i, T | 0) - 0.5) * 8, (FF.h(i, T + 3 | 0) - 0.5) * 8]);
      break;
    case 'frost':                                           // 날 끝의 얼음 결정
      for (let i = 1; i < n; i += 3) {
        const k = K[i]; if (k < 0.15) continue;
        const q = P(tr[i], 1), d = dir(i), L = (6 + FF.h(i, 7) * 11) * k, w = 2.6 * k;
        ctx.fillStyle = `rgba(230,248,255,${0.8 * k})`; ctx.beginPath(); ctx.moveTo(q[0] - d[1] * w, q[1] + d[0] * w); ctx.lineTo(q[0] + d[0] * L, q[1] + d[1] * L); ctx.lineTo(q[0] + d[1] * w, q[1] - d[0] * w); ctx.fill();
      }
      break;
    case 'bolt':                                            // 날 끝을 따라 튀는 번개
      for (const [w, c, a] of [[6, c1, 0.3], [2.2, c1, 0.9], [0.9, '255,255,255', 1]]) tipLine(1.0, c, w, a, i => { const d = dir(i), o = (FF.h(i, (T / 2) | 0) - 0.5) * 14; return [d[0] * o, d[1] * o]; });
      break;
    case 'holy': case 'sun':
      tipLine(1.0, '255,255,255', 2.4, 0.5);
      for (let i = 2; i < n; i += 7) { const k = K[i]; if (k < 0.3) continue; const q = P(tr[i], 1), s = 4 * k; ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(q[0] - s * 2, q[1] - 0.6, s * 4, 1.2); ctx.fillRect(q[0] - 0.6, q[1] - s * 2, 1.2, s * 4); }
      break;
    case 'void': case 'shadow': case 'curse':
      ctx.globalCompositeOperation = 'source-over'; band(0.82, 0.96, S.dk, 0.7); ctx.globalCompositeOperation = 'lighter';
      tipLine(1.0, c2, 1.3, 0.8);
      break;
    case 'clock':                                           // 눈금
      ctx.strokeStyle = `rgba(${c2},0.7)`; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < n; i += 5) { if (K[i] < 0.2) continue; const a = P(tr[i], 0.78), b = P(tr[i], 1.04); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke();
      break;
    case 'star': case 'arcane':
      for (let i = 1; i < n; i += 5) { const k = K[i]; if (k < 0.2) continue; const q = P(tr[i], 0.7 + FF.h(i, 2) * 0.3), tw = 0.5 + 0.5 * Math.sin(T * 0.4 + i); drawGlow(ctx, q[0], q[1], 5 + tw * 4, c1, k * 0.8); ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(q[0] - 1, q[1] - 1, 2, 2); }
      break;
    case 'cyber':                                           // 끊어지는 디지털 선
      ctx.fillStyle = `rgba(${c2},0.8)`;
      for (let i = 0; i < n; i += 2) { if (K[i] < 0.2 || FF.h(i, (T / 2) | 0) < 0.5) continue; const q = P(tr[i], 0.7 + FF.h(i, 5) * 0.3); ctx.fillRect(q[0] - 3, q[1] - 1, 6, 2); }
      break;
    case 'requiem':                                         // 오선지
      for (const u of [0.72, 0.8, 0.88, 0.96]) tipLine(u, c1, 0.8, 0.5);
      break;
    case 'blood': case 'exec':
      tipLine(1.0, '255,200,200', 1, 0.6); break;
  }
  ctx.globalCompositeOperation = 'source-over';
};

// 플레이어 궤적은 프레임 사이를 8번 나눠 찍어 빠른 휘두르기도 매끄러운 곡선이 된다
Player.prototype.sampleTrail = function (t0) {
  const N = 8, R = this.rig;
  if (!this._trp) this._trp = P();
  for (let k = 1; k <= N; k++) {
    const u = k / N;
    let J = this.J;
    if (k < N && this.blendT >= this.blendDur) { sampleAnim(this.anim, lerp(t0, this.animT, u), this._trp, this); solveRig(R, this._trp, this.tJ, this.z <= 0.5); J = this.tJ; }
    const ex = lerp(this.px, this.x, u), ey = sy(this.y, lerp(this.pz, this.z, u));
    const a = J.wAng * DEG, dx = Math.sin(a), dy = Math.cos(a), h = J.hand1, s = this.scale, f = this.facing, L = R.wlen * ((this.wlook && this.wlook.L) || 1);
    this.trail.push({ bx: ex + f * (h.x + dx * L * 0.3) * s, by: ey + (h.y + dy * L * 0.3) * s, tx: ex + f * (h.x + dx * L * 1.08) * s, ty: ey + (h.y + dy * L * 1.08) * s, age: 0 });
  }
};

// 궤적 끝에서 입자가 흩날린다
const _forgeUTA = Player.prototype.updateTrailAfter;
Player.prototype.updateTrailAfter = function () {
  _forgeUTA.call(this);
  if (!this.trailOn || !this.trail.length) return;
  const S = FTRAIL[this.wdef && this.wdef.id];
  if (!S || !S.p || Math.random() > S.pr * FF.b()) return;
  const q = this.trail[this.trail.length - 1], u = rand(0.75, 1.02), x = lerp(q.bx, q.tx, u), y = lerp(q.by, q.ty, u);
  const up = S.p === 'flame' || S.p === 'ember' || S.p === 'smoke' || S.p === 'glow', down = S.p === 'drip' || S.p === 'ash' || S.p === 'coin' || S.p === 'candy';
  FX.add('world', new FP(x, y, {
    kind: S.p, col: S.pc, vx: rand(-1.5, 1.5) - this.facing * rand(0, 1.5), vy: up ? rand(-2.4, -0.6) : down ? rand(-1.5, 0.5) : rand(-1.2, 1.2),
    grav: down ? 0.22 : up ? -0.02 : 0.02, life: randi(18, 34), r: S.p === 'smoke' ? rand(8, 14) : S.p === 'flame' ? rand(4, 7) : rand(2.2, 4.5), drag: 0.95,
  }));
};

// 새 스킬 등록 : 옛 정의를 덮어쓰고 검에 다시 연결한다
function forgeDef(id, s5, s6) {
  const o = ws(s5, s6); WSK[id] = o;
  const W0 = WEAPON_BY_ID[id]; if (W0) W0.skills = o;
  for (const k of ['s5', 's6']) { o[k].icon = 'ws_' + id + '_' + k; o[k].act.isSkill = true; o[k].act.name = id + k; }
  return o;
}
// 스킬 공용 : 컷인 + 화면 어둡게 + 위아래 띠
function forgeCine(p, name, han, col, o = {}) {
  WS.cutin(p, name, han, col);
  Game.dimTo(o.dim ?? 0.45, 10);
  FF.screen({ kind: 'bars', life: o.bars ?? 90, a: 1, fin: 10, fout: 4 });
}
function forgeUndim(f = 14) { Game.dimTo(0, f); }

// 화면 연출 그리기 (WS.overlay 다음)
const _forgeOverlay = WS.overlay;
WS.overlay = function (ctx) { _forgeOverlay.call(this, ctx); FF.drawScreens(ctx); };
const _forgeTick = WS.tick;
WS.tick = function () { _forgeTick.call(this); for (const s of FF.screens) s.t++; };
const _forgeReset = WS.reset;
WS.reset = function () { _forgeReset.call(this); FF.reset(); };
