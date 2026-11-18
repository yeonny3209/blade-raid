'use strict';
// ============================================================
//  검의 대장간 1 : 화염도 이그니스 (w1) · 빙백검 프로스트 (w2) · 뇌명도 천둥 (w3)
// ============================================================

// ---------- 불길 지대 : 바닥에 남아 타오르는 불꽃 (판정은 onTick) ----------
class FBlaze {
  constructor(x, y, o = {}) {
    Object.assign(this, { x, y, t: 0, add: true, rx: o.rx || 50, life: o.life || 150, every: o.every || 15, onTick: o.onTick, col: o.col || '255,110,30', core: o.core || '255,220,140', seed: randi(0, 999) });
    FX.add('ground', new FDecal(x, y, this.rx * 1.1, this.life + 40, { kind: 'scorch', col: this.col }));
  }
  update() { this.t++; if (this.onTick && this.t % this.every === 0) this.onTick(this); return this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = Math.min(1, this.t / 6, (1 - u) * 3), gy = sy(this.y, 0), T = Game.time;
    drawGlow(ctx, this.x, gy, this.rx * 1.3, this.col, 0.45 * a, 1, 0.3);
    for (let i = 0; i < 5; i++) {
      const fx = this.x + (FF.h(this.seed, i) - 0.5) * this.rx * 1.6, h = (16 + FF.h(i, this.seed) * 26) * a * (0.75 + 0.25 * Math.sin(T * 0.45 + i * 2.1)), w = 6 + FF.h(i, 3) * 5, sw = Math.sin(T * 0.3 + i) * 4;
      ctx.fillStyle = `rgba(${this.col},${0.7 * a})`; ctx.beginPath(); ctx.moveTo(fx - w, gy); ctx.quadraticCurveTo(fx - w * 0.6, gy - h * 0.6, fx + sw, gy - h); ctx.quadraticCurveTo(fx + w * 0.6, gy - h * 0.6, fx + w, gy); ctx.fill();
      ctx.fillStyle = `rgba(${this.core},${0.8 * a})`; ctx.beginPath(); ctx.ellipse(fx + sw * 0.3, gy - h * 0.25, w * 0.4, h * 0.28, 0, 0, TAU); ctx.fill();
    }
    if (this.t % 5 === 0 && a > 0.5) FX.add('world', new FP(this.x + rand(-this.rx, this.rx), gy - rand(4, 20), { kind: 'ember', col: this.col, vx: rand(-0.5, 0.5), vy: rand(-2.2, -1), life: randi(20, 34), r: rand(1.5, 3) }));
  }
}

// ---------- 불의 회오리 (몸을 감싸는 세 갈래 나선 불길) ----------
class FFireVortex {
  constructor(p, life) { Object.assign(this, { p, life, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const p = this.p, u = this.t / this.life, a = Math.min(1, this.t / 6, (1 - u) * 5), T = this.t, H = 190;
    const gx = p.x, gy = sy(p.y, 0);
    drawGlow(ctx, gx, gy, 170, '255,100,20', 0.5 * a, 1, 0.3);
    drawGlow(ctx, gx, gy - 90, 150, '255,140,40', 0.22 * a, 0.8, 1.2);
    // 열기 원뿔
    const g = ctx.createLinearGradient(0, gy, 0, gy - H - 40);
    g.addColorStop(0, `rgba(255,120,30,${0.3 * a})`); g.addColorStop(0.6, `rgba(255,90,20,${0.12 * a})`); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(gx - 46, gy); ctx.lineTo(gx - 40 - H * 0.44, gy - H - 30); ctx.lineTo(gx + 40 + H * 0.44, gy - H - 30); ctx.lineTo(gx + 46, gy); ctx.fill();
    // 세 갈래 불길 띠 : 아래는 두껍고 위로 갈수록 가늘게 흩어진다
    for (let s = 0; s < 3; s++) {
      const C = [];
      for (let k = 0; k <= 26; k++) {
        const h = k / 26 * H, ang = T * 0.42 + s * TAU / 3 + h * 0.03, R = 40 + h * 0.42 + Math.sin(T * 0.6 + k * 0.9 + s) * 5;
        C.push([gx + Math.cos(ang) * R, sy(p.y, p.z + h) + Math.sin(ang) * R * 0.28, (1 - k / 26 * 0.75) * (0.6 + 0.4 * Math.abs(Math.sin(ang)))]);
      }
      for (const [w, col, al] of [[22, '255,80,20', 0.3], [11, '255,160,50', 0.6], [3.5, '255,245,200', 0.85]]) {
        ctx.fillStyle = `rgba(${col},${al * a})`; ctx.beginPath();
        C.forEach(([x, y, k], i) => (i ? ctx.lineTo(x, y - w * k * 0.5) : ctx.moveTo(x, y - w * k * 0.5)));
        for (let i = C.length - 1; i >= 0; i--) ctx.lineTo(C[i][0], C[i][1] + w * C[i][2] * 0.5);
        ctx.fill();
      }
    }
    if (T % 2 === 0) for (let i = 0; i < FF.n(2); i++) { const ang = rand(0, TAU), h = rand(20, H), R = 40 + h * 0.42; FX.add('world', new FP(gx + Math.cos(ang) * R, sy(p.y, p.z + h) + Math.sin(ang) * R * 0.28, { kind: chance(0.5) ? 'flame' : 'ember', col: '255,120,30', vx: -Math.sin(ang) * 3, vy: rand(-3, -1), life: randi(14, 24), r: rand(3, 6) })); }
  }
}

// ---------- 불새 : 모여들어 태어나고 → 날개를 펼치고 → 휩쓸고 → 솟구쳐 깃털 비를 뿌린다 ----------
class FPhoenix {
  constructor(p, x, y, z, dir) {
    Object.assign(this, { p, x, y, z, dir, t: 0, ph: 'form', pt: 0, s: 0.2, add: true, flap: 0, hits: new Map(), trail: [] });
    this.vx = 0; this.vz = 0; this.tilt = 0;
  }
  go(ph) { this.ph = ph; this.pt = 0; }
  update() {
    this.t++; this.pt++;
    const p = this.p, r = Game.room;
    this.flap += this.ph === 'dive' ? 0.32 : 0.18;
    switch (this.ph) {
      case 'form':                                         // 불꽃이 모여들어 형체가 된다
        this.s = lerp(0.2, 0.7, E.out(this.pt / 30));
        for (let i = 0; i < FF.n(3); i++) { const a = rand(0, TAU), d = rand(140, 260); FX.add('world', new FP(this.x + Math.cos(a) * d, sy(this.y, this.z) + Math.sin(a) * d * 0.6, { kind: 'flame', col: '255,120,30', tx: this.x, ty: sy(this.y, this.z), pull: 0.05, life: 24, r: rand(4, 8) })); }
        if (this.pt >= 30) {
          this.go('spread');
          Sfx.play('roar', 0.9, 1.7); Sfx.wlayer('fire', 3, true); Game.flashScreen(0.55, '255,190,110'); Game.addShake(10);
          FX.add('world', new Flash(this.x, sy(this.y, this.z), 40, 420, 26, '255,140,40', 1));
          FX.add('world', new FRing(this.x, sy(this.y, this.z), 30, 360, 24, { col: '255,170,70', w: 14, ry: 0.55 }));
          FF.spray('flame', this.x, sy(this.y, this.z), 26, { col: '255,140,40', v0: 4, v1: 11, l0: 20, l1: 36, r0: 5, r1: 9 });
        }
        break;
      case 'spread':                                       // 날개를 활짝 펼치고 울부짖는다
        this.s = lerp(0.7, 1.45, E.out3(Math.min(1, this.pt / 16)));
        this.z += 1.2;
        if (this.pt >= 26) {
          this.go('dive'); this.vx = this.dir * 6; Sfx.play('dash', 1, 0.7); Sfx.play('roar', 0.7, 2);
        }
        break;
      case 'dive': {                                       // 낮게 활강하며 화면을 휩쓴다
        this.vx = clamp(this.vx + this.dir * 1.6, -24, 24); this.x += this.vx;
        this.z = lerp(this.z, 100, 0.12); this.tilt = lerp(this.tilt, 0.12, 0.2);
        this.y = lerp(this.y, clamp(p.y, 30, DEPTH - 30), 0.05);
        if (this.pt % 3 === 0) FX.add('ground', new FBlaze(this.x - this.dir * 40, this.y + rand(-20, 20), { rx: 46, life: 130, every: 20, onTick: z => WS.area(p, z.x, z.y, z.rx, 40, WH.igBurn, { hmax: 80, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.12 }) }) }));
        for (const e of Game.enemies) {
          if (!e.hittable() || Math.abs(e.x - this.x) > 150 || Math.abs(e.y - this.y) > 120) continue;
          const n = this.hits.get(e) || 0, last = this['l' + e.id] ?? -99;
          if (n >= 4 || this.t - last < 5) continue;
          this.hits.set(e, n + 1); this['l' + e.id] = this.t;
          applyHit(p, e, WH.phDive, { noStopAtt: true, dir: this.dir, hz: e.z + 60 });
          Status.add(e, 'burn', { t: 200, d: p.atk * 0.3 });
        }
        const out = this.dir > 0 ? this.x > Math.min(r.maxX + 120, Game.cam.x + W + 140) : this.x < Math.max(r.minX - 120, Game.cam.x - 140);
        if (out || this.pt > 90) { this.go('rise'); this.vx *= 0.3; Sfx.play('roar', 0.8, 1.5); }
        break;
      }
      case 'rise':                                         // 하늘로 솟구친다
        this.x += this.vx; this.vx *= 0.92; this.z += 18; this.tilt = lerp(this.tilt, -0.9, 0.2);
        if (this.pt >= 18) { this.go('rain'); this.rainX = clamp(Game.cam.x + W / 2, r.minX + 200, r.maxX - 200); Game.flashScreen(0.4, '255,160,80'); }
        break;
      case 'rain':                                         // 불타는 깃털 비
        if (this.pt <= 40 && this.pt % 2 === 0) {
          const x = this.rainX + rand(-W * 0.48, W * 0.48), y = rand(10, DEPTH - 10);
          FX.add('world', new FFeatherFall(p, x, y));
        }
        if (this.pt === 64) {                               // 마지막 대폭발
          const cx = this.rainX, gy = sy(p.y, 0);
          FX.add('world', new FBeam(cx, p.y, 150, 40, { col: '255,120,30', core: '255,240,200' }));
          FX.add('world', new Flash(cx, gy - 120, 60, 620, 34, '255,130,40', 1));
          FX.add('ground', new FRing(cx, gy, 40, 720, 34, { col: '255,170,70', w: 24 }));
          FX.add('ground', new FDecal(cx, p.y, 320, 220, { kind: 'scorch' }));
          FF.spray('flame', cx, gy - 40, 40, { col: '255,140,40', v0: 6, v1: 16, l0: 26, l1: 44, r0: 6, r1: 11, ry: 30 });
          for (let i = 0; i < FF.n(16); i++) FX.add('world', new Debris(cx + rand(-80, 80), p.y + rand(-30, 30), 6, { vx: rand(-9, 9), vz: rand(8, 17), s: rand(3, 6), col: ['#2a1612', '#5a2a18', '#ff8a30'], glow: '255,120,30' }));
          Sfx.play('explode', 1.2); Sfx.play('explode', 0.8, 0.6); Game.addShake(22); Game.flashScreen(0.75, '255,200,140'); Game.zoomPunch(1.1); Game.slowmo(0.35, 20);
          for (const e of WS.onScreen()) applyHit(p, e, WH.phEnd, { noStopAtt: true, dir: sign(e.x - cx) || 1 });
          forgeUndim(30);
        }
        if (this.pt >= 70) return false;
        break;
    }
    // 꼬리 잔상
    this.trail.push({ x: this.x, y: sy(this.y, this.z) }); if (this.trail.length > 14) this.trail.shift();
    if (this.ph !== 'rain' && this.ph !== 'form' && this.t % 2 === 0) for (let i = 0; i < FF.n(3); i++) FX.add('world', new FP(this.x - this.dir * rand(30, 150) * this.s, sy(this.y, this.z) + rand(-50, 50) * this.s, { kind: chance(0.6) ? 'ember' : 'flame', col: choose(['255,120,30', '255,190,80']), vx: -this.dir * rand(1, 4), vy: rand(-2, 0.5), life: randi(18, 32), r: rand(3, 7) }));
    return true;
  }
  draw(ctx) {
    if (this.ph === 'rain' || this.ph === 'form' && this.pt < 8) return;
    const X = this.x, Y = sy(this.y, this.z), d = this.dir, s = this.s, f = Math.sin(this.flap), T = this.t;
    // 지나간 길 잔광
    if (this.trail.length > 2) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, col, al] of [[60 * s, '255,90,20', 0.12], [24 * s, '255,170,60', 0.25]]) { ctx.strokeStyle = `rgba(${col},${al})`; ctx.lineWidth = w; ctx.beginPath(); this.trail.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke(); }
    }
    ctx.save(); ctx.translate(X, Y); ctx.scale(d * s, s); ctx.rotate(this.tilt);
    drawGlow(ctx, 0, -30, 280, '255,100,20', 0.35);
    drawGlow(ctx, 10, 0, 110, '255,200,90', 0.35);
    const L = (o, col, a) => { ctx.fillStyle = `rgba(${col},${a})`; return ctx; };
    // 꼬리 : 길게 휘날리는 세 가닥
    for (let i = 0; i < 3; i++) {
      const sp = (i - 1) * 26, wv = Math.sin(T * 0.25 + i * 1.3) * 22, len = 250 + i * 30;
      for (const [w, col, a] of [[22, '255,90,20', 0.45], [10, '255,190,80', 0.7], [3, '255,250,220', 0.9]]) {
        L(0, col, a); ctx.beginPath(); ctx.moveTo(-40, -w * 0.5);
        ctx.bezierCurveTo(-120, sp - w + wv * 0.4, -190, sp * 1.6 - wv, -40 - len, sp * 2 + wv);
        ctx.bezierCurveTo(-190, sp * 1.6 - wv + w, -120, sp + w + wv * 0.4, -40, w * 0.5); ctx.fill();
      }
      drawGlow(ctx, -40 - len, sp * 2 + wv, 30, '255,200,100', 0.8);
    }
    // 날개 (먼 쪽 → 몸 → 가까운 쪽)
    // 날개 : 어깨 → 팔꿈치 → 날개 끝으로 이어지는 앞날개 뼈대에서 깃털이 뒤로 늘어진다
    const wing = (side, k) => {
      const up = 0.35 + f * 0.65, sx = 4, sy0 = -10;
      const ex = 0, ey = sy0 - 110 * up * k, tx = -70 * k, ty = sy0 - (190 * up - 40) * k;
      const bone = u => { const v = 1 - u; return [v * v * sx + 2 * v * u * ex + u * u * tx, v * v * sy0 + 2 * v * u * ey + u * u * ty]; };
      for (let i = 8; i >= 0; i--) {                       // 넓은 깃털 (끝 쪽이 길다)
        const u = 0.15 + i / 8 * 0.85, [bx, by] = bone(u), len = (55 + u * 85) * k, ang = Math.PI * (0.78 + u * 0.18), fx = bx + Math.cos(ang) * len, fy = by + Math.sin(ang) * len, w = (26 + u * 14) * k;
        for (const [ww, col, a] of [[w * 1.25, '255,80,20', 0.28], [w, '255,140,40', 0.45], [w * 0.4, '255,235,190', 0.7]]) {
          const nx = -Math.sin(ang) * ww * 0.5, ny = Math.cos(ang) * ww * 0.5, mx = (bx + fx) / 2, my = (by + fy) / 2;
          L(0, col, a); ctx.beginPath(); ctx.moveTo(bx - nx * 0.6, by - ny * 0.6); ctx.quadraticCurveTo(mx - nx, my - ny, fx, fy); ctx.quadraticCurveTo(mx + nx, my + ny, bx + nx * 0.6, by + ny * 0.6); ctx.fill();
        }
      }
      ctx.lineCap = 'round';                                // 앞날개 뼈대
      for (const [w, col, a] of [[16 * k, '255,120,30', 0.6], [6 * k, '255,230,160', 0.9]]) { ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(sx, sy0); ctx.quadraticCurveTo(ex, ey, tx, ty); ctx.stroke(); }
      drawGlow(ctx, tx, ty, 26 * k, '255,220,140', 0.7);
    };
    ctx.save(); ctx.globalAlpha = 0.55; ctx.translate(18, -6); ctx.scale(0.8, 0.86); wing(-1, 1); ctx.restore();
    // 몸통 · 목 · 머리
    for (const [rx, ry, col, a] of [[78, 28, '255,90,20', 0.5], [62, 20, '255,170,60', 0.75], [40, 11, '255,250,220', 0.95]]) { L(0, col, a); ctx.beginPath(); ctx.ellipse(10, 0, rx, ry, -0.12, 0, TAU); ctx.fill(); }
    L(0, '255,170,60', 0.85); ctx.beginPath(); ctx.moveTo(48, -14); ctx.quadraticCurveTo(70, -36, 92, -30); ctx.lineTo(96, -14); ctx.quadraticCurveTo(70, -14, 56, 4); ctx.fill();
    L(0, '255,140,40', 0.7); ctx.beginPath(); ctx.arc(92, -28, 24, 0, TAU); ctx.fill();
    L(0, '255,230,170', 0.95); ctx.beginPath(); ctx.arc(92, -28, 16, 0, TAU); ctx.fill();
    L(0, '255,250,230', 1); ctx.beginPath(); ctx.moveTo(104, -36); ctx.quadraticCurveTo(128, -34, 140, -20); ctx.lineTo(104, -20); ctx.fill();                       // 부리
    for (let i = 0; i < 3; i++) { L(0, '255,140,40', 0.8); ctx.beginPath(); ctx.moveTo(86, -36); ctx.quadraticCurveTo(70 - i * 8, -60 - i * 6 + Math.sin(T * 0.3 + i) * 4, 50 - i * 14, -58 - i * 10); ctx.quadraticCurveTo(74 - i * 6, -48, 92, -34); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(96, -28, 3, 0, TAU); ctx.fill();
    wing(1, 1);
    ctx.restore();
  }
}

// 하늘에서 떨어지는 불타는 깃털 : 땅에 닿으면 작은 폭발
class FFeatherFall {
  constructor(p, x, y) { Object.assign(this, { p, x, y, z: rand(560, 700), t: 0, add: true, vz: -rand(18, 24), sw: rand(0, TAU) }); }
  update() {
    this.t++; this.z += this.vz; this.x += Math.sin(this.t * 0.2 + this.sw) * 2;
    if (this.t % 2 === 0) FX.add('world', new FP(this.x, sy(this.y, this.z) - 10, { kind: 'ember', col: '255,140,40', vx: rand(-0.5, 0.5), vy: -1, life: 14, r: 2.5 }));
    if (this.z <= 0) {
      const p = this.p, gy = sy(this.y, 0);
      FX.add('world', new Flash(this.x, gy - 20, 14, 130, 16, '255,140,40', 0.9));
      FX.add('ground', new FRing(this.x, gy, 10, 120, 16, { col: '255,170,70', w: 7 }));
      FX.add('ground', new FBlaze(this.x, this.y, { rx: 34, life: 90, every: 30 }));
      FF.spray('flame', this.x, gy - 10, 5, { col: '255,140,40', ang: -Math.PI / 2, spread: 1, v0: 2, v1: 6, l0: 14, l1: 24, r0: 4, r1: 7 });
      Sfx.play('explode', 0.35, 1.4); Game.addShake(2);
      WS.area(p, this.x, this.y, 90, 50, WH.phFeather, { hmax: 140, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.2 }) });
      return false;
    }
    return true;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z);
    drawGlow(ctx, X, Y, 40, '255,110,30', 0.6);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(Math.PI / 2 + Math.sin(this.t * 0.2 + this.sw) * 0.3);
    for (const [w, col, a] of [[9, '255,110,30', 0.6], [5, '255,200,90', 0.85], [1.6, '255,255,240', 1]]) { ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.ellipse(0, 0, 26, w, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,170,60,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y - 60); ctx.stroke();
  }
}

Object.assign(WH, {
  igSpin: WS.hd({ dmg: 1.35, kx: 1, airKz: 3, stun: 24, stop: 2, shake: 1.5, fx: 'slash', power: 1.1 }),
  igWave: WS.hd({ dmg: 7.5, kx: 5, kz: 12, airKz: 10, stun: 50, stop: 9, shake: 9, fx: 'heavy', power: 1.8 }),
  igBurn: WS.hd({ dmg: 0.45, kx: 0, airKz: 1, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  phDive: WS.hd({ dmg: 3.2, kx: 5, kz: 7, airKz: 7, stun: 40, stop: 3, shake: 4, fx: 'heavy', power: 1.4 }),
  phFeather: WS.hd({ dmg: 2.2, kx: 2, kz: 5, airKz: 4, stun: 30, stop: 2, shake: 2, fx: 'none', sfx: 'none', power2: 1 }),
  phEnd: WS.hd({ dmg: 18, kx: 9, kz: 13, airKz: 12, stun: 70, stop: 16, shake: 18, fx: 'heavy', power: 2.6 }),
});

// ============================================================
//  화염도 이그니스
// ============================================================
forgeDef('w1', {
  name: '화염 회오리', mp: 160, cd: 9, ico: ['spin', '255,130,40'],
  desc: '검에 불을 붙인 뒤 불길의 회오리를 두르고 돌진한다. 휘말린 적은 끌려들며 계속 타고, 마지막에 불꽃 검기를 날려 띄운다. 지나간 자리는 불바다가 된다.',
  act: {
    anim: 'ebCrouch', len: 78, cancel: 70, atkCancel: 70,
    start(p) { p.vx = 0; p.bladeGlow = 1.6; Sfx.play('charge', 0.7, 1.3); },
    update(p, f) {
      // 1) 점화
      if (f < 10) {
        p.vx *= 0.5; p.armorF = true;
        if (f === 2) { FX.add('ground', new FRing(p.x, sy(p.y, 0), 10, 130, 16, { col: '255,140,40', w: 8 })); FF.spray('flame', p.x + p.facing * 30, sy(p.y, 80), 10, { col: '255,140,40', v0: 2, v1: 6, l0: 14, l1: 24, r0: 4, r1: 7 }); Sfx.wlayer('fire', 2, false); }
        if (f === 9) FX.add('world', new FFireVortex(p, 52));
        return;
      }
      // 2) 회오리 돌진
      if (f < 58) {
        p.armorF = true; p.trailOn = true;
        const ax = Input.axisX(); if (ax) p.facing = ax;
        p.vx = (ax || p.facing) * 4.4; p.vy = Input.axisY() * 2.4;
        if ((f - 10) % 7 === 0) { swingT(p, ((f - 10) / 7 | 0) % 2 ? 'a2' : 'a1', 1.9); Sfx.pplay('swing', 0.8, 0.9 + f * 0.006); }
        if (f % 6 === 0) {
          WS.area(p, p.x, p.y, 160, 66, WH.igSpin, { hmax: 190, each: e => { Status.add(e, 'burn', { t: 120, d: p.atk * 0.12 }); if (!e.isBoss) { e.x = lerp(e.x, p.x + p.facing * 30, 0.25); e.y = lerp(e.y, p.y, 0.2); } } });
          FX.add('world', new Crescent(p.x, sy(p.y, p.z + 80), 130, f * 0.5, f * 0.5 + 2.8, { th: 28, life: 12, col: '255,110,30', core: '255,230,170', sy: 0.38 }));
        }
        if (f % 5 === 0) FX.add('ground', new FBlaze(p.x - p.facing * 26, p.y, { rx: 44, life: 150, every: 15, onTick: z => WS.area(p, z.x, z.y, z.rx, z.rx * 0.8, WH.igBurn, { hmax: 70, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.12 }) }) }));
        return;
      }
      // 3) 불꽃 검기
      p.vx *= 0.7; p.vy = 0;
      if (f === 58) { swingT(p, 'upper', 1.3); Sfx.pplay('swingBig'); Sfx.wlayer('fire', 3, true); p.bladeGlow = 2.2; Game.addShake(6); }
      if (f === 62) {
        FX.add('world', new FSlash(p.x + p.facing * 70, sy(p.y, 90), -p.facing * 1.15, 120, { col: '255,120,30', core: '255,240,200', th: 16 }));
        FX.add('world', new FWave(p, p.x + p.facing * 40, p.y, 0, p.facing * 15, { hd: WH.igWave, col: '255,120,30', core: '255,235,190', life: 34, r: 70, size: 1.15, part: 'flame', accel: 1.02,
          onHit: (w, e) => Status.add(e, 'burn', { t: 180, d: p.atk * 0.2 }),
        }));
        FX.add('world', new FRun(34, r => { if (r.t % 4 === 0) { const w = FX.world.find(o => o instanceof FWave && o.p === p); if (w) FX.add('ground', new FBlaze(w.x, w.y, { rx: 40, life: 110, every: 20, onTick: z => WS.area(p, z.x, z.y, z.rx, 34, WH.igBurn, { hmax: 70 }) })); } }));
      }
    },
    end(p) { p.armorF = false; },
  },
}, {
  name: '불새 강림', mp: 480, cd: 42, ico: ['bird', '255,120,30'],
  desc: '불꽃을 모아 거대한 불새를 낳는다. 불새는 날개를 펼쳐 울부짖은 뒤 화면을 낮게 휩쓸며 적을 여러 번 불태우고, 하늘로 솟구쳐 불타는 깃털 비를 뿌린 다음 대폭발로 끝맺는다.',
  act: {
    anim: 'ultUp', len: 72, cancel: 60, atkCancel: 60,
    start(p) { forgeCine(p, '불새 강림', '鳳 凰 降 臨', '255,110,30', { bars: 200, dim: 0.35 }); p.invul = 260; p.vx = 0; },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      if (f === 1) {
        p.vz = 8; p.bladeGlow = 2.4; Sfx.play('charge');
        FF.screen({ col: '255,90,10', a: 0.07, life: 190, fin: 20, fout: 4 });
        FX.add('ground', new FCircle(p.x, p.y, 170, 70, { kind: 'sun', col: '255,130,40', col2: '255,230,170', spin: 0.03 }));
        const ph = new FPhoenix(p, p.x + p.facing * 40, clamp(p.y, 40, DEPTH - 40), 230, p.facing);
        FX.add('world', ph); p._phx = ph;
      }
      if (f < 30 && f % 3 === 0) convergeMotes(p.x, sy(p.y, p.z + 90), 2, '255,150,50', 140);
      if (f === 40) { p.play('ultDn', 0, 1, true); p.trailOn = true; Sfx.pplay('swingBig'); }
      if (f === 46) p.trailOn = false;
    },
    end(p) { p._phx = null; },
  },
});

// ============================================================
//  빙백검 프로스트
// ============================================================

// 얼음 결정 무리 : 솟구쳤다가 금이 가며 부서진다
class FCrystal {
  constructor(x, y, o = {}) {
    Object.assign(this, { x, y, t: 0, add: false, life: o.life || 46, s: o.s || 1, rise: o.rise || 5 });
    const n = o.n || 3; this.sp = [];
    for (let i = 0; i < n; i++) { const k = i === 0 ? 1 : rand(0.45, 0.8); this.sp.push({ dx: i === 0 ? 0 : rand(-26, 26) * this.s, h: (o.h || 120) * k * this.s, w: rand(11, 16) * k * this.s * (o.wide || 1), lean: rand(-0.25, 0.25), d: i === 0 ? 0 : rand(-1, 1) }); }
    this.sp.sort((a, b) => a.d - b.d);
  }
  update() {
    this.t++;
    if (this.t === this.life - 8) {                         // 부서질 때 파편
      const gy = sy(this.y, 0);
      for (const s of this.sp) FF.spray('shard', this.x + s.dx, gy - s.h * 0.5, 4, { col: '190,235,255', v0: 2, v1: 7, ry: s.h * 0.3, grav: 0.3, l0: 18, l1: 30, r0: 4, r1: 8 });
      FF.spray('flake', this.x, gy - 30, 4, { col: '230,248,255', v0: 1, v1: 3, l0: 24, l1: 40, r0: 3, r1: 5 });
    }
    return this.t < this.life - 8;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), up = E.out3(Math.min(1, this.t / this.rise)), u = this.t / (this.life - 8), crack = Math.max(0, (u - 0.6) / 0.4), a = Math.min(1, (1 - u) * 6 + 0.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, gy, 70 * this.s, '150,215,255', 0.5 * a, 1, 0.3); ctx.globalCompositeOperation = 'source-over';
    for (const s of this.sp) {
      const h = s.h * up, x0 = this.x + s.dx, tx = x0 + s.lean * h, ty = gy - h, w = s.w;
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(70,140,205,0.85)'; ctx.beginPath(); ctx.moveTo(x0 - w, gy); ctx.lineTo(tx, ty); ctx.lineTo(x0 + w * 0.15, gy + 2); ctx.fill();          // 그늘진 면
      ctx.fillStyle = 'rgba(175,228,255,0.9)'; ctx.beginPath(); ctx.moveTo(x0 + w * 0.15, gy + 2); ctx.lineTo(tx, ty); ctx.lineTo(x0 + w, gy); ctx.fill();          // 밝은 면
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 - w, gy); ctx.lineTo(tx, ty); ctx.lineTo(x0 + w, gy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + w * 0.15, gy); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(x0 + w * 0.3, gy - h * 0.15); ctx.lineTo(tx + w * 0.05, ty + h * 0.12); ctx.lineTo(x0 + w * 0.5, gy - h * 0.12); ctx.fill();   // 반사광
      if (crack > 0) {                                      // 금
        ctx.strokeStyle = `rgba(255,255,255,${crack})`; ctx.lineWidth = 1.2; ctx.beginPath();
        let cx = x0 - w * 0.4, cy = gy - h * 0.3; ctx.moveTo(cx, cy);
        for (let k = 0; k < 4; k++) { cx += w * 0.35; cy -= h * 0.12 * (k % 2 ? 0.4 : 1.4) * crack; ctx.lineTo(cx, cy); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, tx, ty + 6, 14 * this.s, '220,245,255', 0.7 * a); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }
}

// 적을 통째로 가두는 얼음 관 : crack 이 1 이 되면 부서진다
class FIceCoffin {
  constructor(e, life) { Object.assign(this, { e, life, t: 0, add: false, crack: 0, seed: randi(1, 999) }); }
  update() { this.t++; if (this.done) return false; return this.t < this.life; }
  draw(ctx) {
    const e = this.e; if (!e) return;
    const w = Math.max(28, e.w * 2.4) * Math.min(1.8, (e.scale || 1)), h = Math.max(70, e.hurtH() * 1.12), X = e.x, gy = sy(e.y, e.z), g = E.out3(Math.min(1, this.t / 8)), a = Math.min(1, (this.life - this.t) / 6);
    const R = mulberry(this.seed), pts = [];
    for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU - Math.PI / 2, rr = 0.85 + R() * 0.2; pts.push([X + Math.cos(ang) * w * rr * g, gy - h * 0.5 + Math.sin(ang) * h * 0.58 * rr * g]); }
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(160,215,250,0.42)'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(240,252,255,0.95)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < 8; i += 2) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(X + (R() - 0.5) * w * 0.3, gy - h * 0.5 + (R() - 0.5) * h * 0.2); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(pts[7][0], pts[7][1]); ctx.lineTo(pts[0][0], pts[0][1]); ctx.lineTo(X - w * 0.2, gy - h * 0.55); ctx.fill();
    if (this.crack > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 + this.crack * 0.4})`; ctx.lineWidth = 1.6; ctx.beginPath();
      const R2 = mulberry(this.seed + 7);
      for (let k = 0; k < 6; k++) { let x = X, y = gy - h * 0.5, ang = R2() * TAU; ctx.moveTo(x, y); for (let j = 0; j < 3; j++) { const L = Math.min(w, h * 0.5) * 0.4 * this.crack; x += Math.cos(ang) * L; y += Math.sin(ang) * L * 1.3; ctx.lineTo(x, y); ang += (R2() - 0.5) * 1.2; } }
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, gy - h * 0.5, w * 1.2, '200,240,255', 0.5 * this.crack);
    }
    ctx.restore();
  }
}

Object.assign(WH, {
  frSpike: WS.hd({ dmg: 3, kx: 1, kz: 11, airKz: 9, stun: 40, stop: 6, shake: 5, fx: 'pierce', ang: 90, power: 1.3 }),
  frShatter: WS.hd({ dmg: 5, kx: 4, kz: 8, airKz: 7, stun: 40, stop: 7, shake: 6, fx: 'none', sfx: 'heavy', power2: 2 }),
  frZero: WS.hd({ dmg: 30, kx: 8, kz: 12, airKz: 11, stun: 70, stop: 18, shake: 18, fx: 'x', power: 2.6 }),
});

const frShatterFx = (x, y, s = 1) => {
  FX.add('world', new Flash(x, y, 10, 120 * s, 14, '200,240,255', 0.9));
  FX.add('world', new Burst(x, y, { n: 12, r0: 12, r1: 110 * s, life: 11, col: '220,245,255' }));
  FF.spray('shard', x, y, 10 * s, { col: '190,235,255', v0: 3, v1: 10, grav: 0.35, l0: 18, l1: 32, r0: 4, r1: 9 });
  FF.spray('flake', x, y, 5, { col: '240,250,255', v0: 1, v1: 4, l0: 24, l1: 40, r0: 3, r1: 6 });
};

forgeDef('w2', {
  name: '빙결 감옥', mp: 150, cd: 8, ico: ['spikes', '170,230,255'],
  desc: '검을 땅에 꽂으면 서리가 앞으로 번지며 얼음 결정이 차례로 솟구친다. 맞은 적은 띄워지며 얼어붙고, 잠시 뒤 얼음이 한꺼번에 깨지며 얼어 있는 적에게 추가 피해를 준다.',
  act: {
    anim: 'ebImpact', len: 56, cancel: 46, atkCancel: 46,
    start(p) { p.vx = 0; Sfx.pplay('swingBig'); p.bladeGlow = 1.4; p._frSet = new Set(); },
    update(p, f) {
      p.vx *= 0.6;
      if (f === 5) {
        const gx = p.x + p.facing * 34;
        FX.add('ground', new FDecal(gx + p.facing * 220, p.y, 300, 140, { kind: 'frost' }));
        FX.add('ground', new FRing(gx, sy(p.y, 0), 10, 110, 16, { col: '190,235,255', w: 8 }));
        FF.spray('flake', gx, sy(p.y, 10), 10, { col: '220,245,255', ang: -Math.PI / 2, spread: 1.2, v0: 1, v1: 4, l0: 20, l1: 36 });
        Game.addShake(5); Sfx.wlayer('ice', 2, false);
      }
      for (let i = 0; i < 7; i++) if (f === 7 + i * 4) {
        const x = p.x + p.facing * (78 + i * 66), s = 0.8 + i * 0.07;
        FX.add('world', new FCrystal(x, p.y, { h: 110 + i * 14, s, n: 3 + (i > 3 ? 1 : 0), life: 40 - i * 2 + 26 }));
        FX.add('ground', new FRing(x, sy(p.y, 0), 8, 80, 14, { col: '180,230,255', w: 6 }));
        FF.spray('smoke', x, sy(p.y, 6), 2, { col: '200,230,250', v0: 0.5, v1: 2, l0: 24, l1: 36, r0: 18, r1: 26 });
        WS.area(p, x, p.y, 60, 44, WH.frSpike, { each: e => { Status.add(e, 'freeze', { t: 90 }); p._frSet.add(e); } });
        Sfx.wlayer('ice', 1, false); Game.addShake(2);
      }
      if (f === 46) {                                      // 한꺼번에 깨진다
        Sfx.play('flash', 0.6, 1.4); Sfx.wlayer('ice', 3, true); Game.addShake(8); Game.flashScreen(0.25, '220,245,255');
        for (const e of p._frSet || []) {
          if (!e.hittable() && !(e.holdT > 0)) continue;
          frShatterFx(e.x, sy(e.y, e.z + e.h * 0.5));
          if (e.holdT > 0 && e.holdKind === 'freeze') { e.holdT = 0; e.holdKind = null; Status.release(e); }
          if (e.hittable()) applyHit(p, e, WH.frShatter, { noStopAtt: true, dir: p.facing });
        }
      }
    },
    end(p) { p._frSet = null; },
  },
}, {
  name: '절대영도', mp: 480, cd: 42, ico: ['snow', '200,240,255'],
  desc: '냉기의 파동으로 세상을 얼려 화면 안의 모든 적을 얼음 관에 가둔다. 숨을 고른 뒤 단 한 번의 발도로 화면을 가로지르면, 납도하는 순간 모든 얼음 관이 금 가며 산산조각 난다.',
  act: {
    anim: 'drawReady', len: 156, cancel: 148, atkCancel: 148,
    start(p) { forgeCine(p, '절대영도', '絶 對 零 度', '150,220,255', { bars: 170, dim: 0.3 }); p.invul = 250; p.vx = 0; },
    update(p, f) {
      p.vx = 0; p.vy = 0; p.armorF = true;
      if (f === 2) {
        Game.flashScreen(0.9, '230,245,255'); Sfx.wlayer('ice', 3, true); Sfx.play('flash');
        FF.screen({ kind: 'frost', a: 1, life: 150, fin: 24, fout: 5 });
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 1100, 40, { col: '200,240,255', w: 20 }));
        FX.add('ground', new FCircle(p.x, p.y, 150, 150, { kind: 'hex', col: '170,225,255', col2: '255,255,255', spin: 0.008 }));
        p._coffins = [];
        for (const e of WS.onScreen()) {
          Status.add(e, 'freeze', { t: 150 }); Status.add(e, 'slow', { t: 150, m: 0.2 });
          const c = FX.add('world', new FIceCoffin(e, 160)); p._coffins.push(c);
          frShatterFx(e.x, sy(e.y, e.z + e.h * 0.5), 0.6);
        }
      }
      if (f > 2 && f < 100 && f % 2 === 0) FF.spray('flake', Game.cam.x + rand(0, W), rand(0, H * 0.5), 1, { col: '230,248,255', vx: -2, vy: 2.5, v0: 0.2, v1: 1, l0: 60, l1: 90, r0: 3, r1: 6 });
      if (f < 100 && f % 3 === 0) convergeMotes(p.x - p.facing * 20, sy(p.y, 70), 3, '200,240,255', 160);
      if (f === 60) { p.bladeGlow = 2.4; Sfx.play('charge', 0.8, 1.2); }
      if (f === 104) {                                      // 발도
        const r = Game.room, x0 = p.x, x1 = clamp(p.x + p.facing * 540, r.minX, r.maxX);
        for (let k = 1; k <= 5; k++) p.addGhost(lerp(x0, x1, k / 6), p.y, p.z, p.facing, PP.drawF, 18, '200,240,255');
        p.x = x1; p.px = x1; p.play('drawFollow', 0, 1, true); p.bladeGlow = 2.6;
        FX.add('world', new FlashLine(x0, x1, sy(p.y, 76), 34, '200,240,255'));
        FX.add('world', new FSlash((x0 + x1) / 2, sy(p.y, 76), 0, Math.abs(x1 - x0) / 2 + 60, { col: '190,235,255', th: 10, bend: 0.02, life: 30 }));
        Sfx.play('flash'); Game.flashScreen(0.9, '255,255,255'); Game.addShake(8);
      }
      if (f > 104 && f < 122) for (const c of p._coffins || []) c.crack = (f - 104) / 18;
      if (f === 110) Sfx.play('sheath');
      if (f === 122) {                                      // 산산조각
        Sfx.play('explode', 0.8, 1.3); Sfx.wlayer('ice', 3, true); Game.slowmo(0.25, 40); Game.addShake(20); Game.flashScreen(0.6, '230,250,255'); Game.zoomPunch(1.06);
        for (const c of p._coffins || []) {
          const e = c.e; c.done = true;
          if (!e || (!e.hittable() && !(e.holdT > 0))) continue;
          e.holdT = 0; e.holdKind = null; Status.release(e);
          frShatterFx(e.x, sy(e.y, e.z + e.h * 0.5), 1.4);
          if (e.hittable()) applyHit(p, e, WH.frZero, { noStopAtt: true, dir: p.facing });
        }
        p._coffins = null; forgeUndim(30);
      }
    },
    end(p) { if (p._coffins) for (const c of p._coffins) c.done = true; p._coffins = null; forgeUndim(10); },
  },
});

// ============================================================
//  뇌명도 천둥
// ============================================================
Object.assign(WH, {
  thStep: WS.hd({ dmg: 3.6, kx: 4, kz: 5, airKz: 6, stun: 40, stop: 4, shake: 4, fx: 'pierce', power: 1.4 }),
  thFinal: WS.hd({ dmg: 9, kx: 6, kz: 12, airKz: 11, stun: 55, stop: 12, shake: 12, fx: 'heavy', power: 2 }),
  thStrike: WS.hd({ dmg: 2.5, kx: 1, airKz: 4, stun: 30, stop: 3, shake: 3, fx: 'none', sfx: 'none', power2: 2 }),
  thJudge: WS.hd({ dmg: 16, kx: 6, kz: 14, airKz: 12, stun: 70, stop: 16, shake: 18, fx: 'heavy', power: 2.6 }),
});
// 하늘에서 내리치는 번개 한 줄기 + 착탄 효과
const thStrikeFx = (x, y, z, s = 1) => {
  const gy = sy(y, 0), ty = sy(y, z);
  FX.add('world', new FLightning(x + rand(-60, 60) * s, sy(0, 640), x, ty, { w: 4.5 * s, br: 3, life: 12 }));
  FX.add('world', new Flash(x, ty, 14, 130 * s, 12, '255,245,160', 0.9));
  FX.add('ground', new FRing(x, gy, 10, 110 * s, 14, { col: '255,240,120', w: 7 }));
  FX.add('ground', new FDecal(x, y, 46 * s, 90, { kind: 'crack', col: '255,240,140' }));
  FF.spray('spark', x, ty, 8 * s, { col: '255,245,170', v0: 3, v1: 9, grav: 0.3, l0: 10, l1: 18, r0: 2, r1: 4 });
};

forgeDef('w3', {
  name: '뇌전 섬광보', mp: 140, cd: 8, ico: ['zigzag', '255,240,110'],
  desc: '몸에 번개를 두른 뒤 번개가 되어 가까운 적 최대 6명 사이를 순간이동하며 하나씩 꿰뚫는다. 마지막엔 하늘의 번개를 마지막 적에게 내리꽂고, 꿰뚫린 적 모두에게 전류가 다시 흐른다.',
  act: {
    anim: 'ebCrouch', len: 90, cancel: 999, atkCancel: 999,
    start(p) {
      p.stepList = WS.nearest(p.x, p.y, 6, 650); p.stepHit = [];
      p.stepEnd = 10 + p.stepList.length * 6;
      p.invul = Math.max(p.invul, p.stepEnd + 20); p.bladeGlow = 2; Sfx.play('charge', 0.6, 1.6);
    },
    update(p, f) {
      const L = p.stepList || [];
      if (f < 9) {                                          // 몸에 번개가 감긴다
        p.vx *= 0.5;
        if (f % 3 === 0) { const a = rand(0, TAU); FX.add('world', new FLightning(p.x + Math.cos(a) * 50, sy(p.y, 70) + Math.sin(a) * 60, p.x + rand(-20, 20), sy(p.y, rand(20, 120)), { w: 1.6, br: 1, life: 6, glow: 0.4 })); Sfx.wlayer('elec', 0, false); }
        return;
      }
      if (!L.length) {                                      // 대상이 없으면 앞으로 번개 돌진
        if (f === 9) { const x0 = p.x, x1 = clamp(p.x + p.facing * 300, Game.room.minX, Game.room.maxX); FX.add('world', new FLightning(x0, sy(p.y, 70), x1, sy(p.y, 70), { w: 4, br: 2 })); p.x = p.px = x1; p.afterOn = 4; Sfx.wlayer('elec', 2, false); }
        if (f > 20) p.actDone = true; return;
      }
      const i = Math.floor((f - 9) / 6);
      if ((f - 9) % 6 === 0 && i < L.length) {
        const e = L[i];
        if (e.hittable()) {
          const ox = p.x, oy = p.y, d = sign(e.x - p.x) || p.facing;
          p.facing = d; p.x = p.px = clamp(e.x - d * 55, Game.room.minX, Game.room.maxX); p.y = e.y;
          FX.add('world', new FLightning(ox, sy(oy, 70), p.x, sy(p.y, 70), { w: 4.5, br: 2, life: 12, glow: 0.6 }));
          FX.add('world', new FSlash(e.x, sy(e.y, e.z + e.h * 0.55), d * (i % 2 ? 0.7 : -0.7), 70, { col: '255,235,110', th: 7, life: 14 }));
          FF.spray('spark', e.x, sy(e.y, e.z + e.h * 0.5), 8, { col: '255,245,160', v0: 3, v1: 9, grav: 0.2, l0: 8, l1: 16 });
          p.afterOn = 4; swingT(p, i % 2 ? 'a2' : 'a1', 1.9);
          applyHit(p, e, WH.thStep, { noStopAtt: true, dir: d }); Status.add(e, 'shock', { t: 30 }); p.stepHit.push(e);
          Sfx.wlayer('elec', 1, false); Sfx.pplay('swing', 0.8, 1.2); Game.addShake(3);
        }
      }
      p.vx = 0; p.vy = 0;
      if (f === p.stepEnd + 2) {                            // 천둥 마무리
        const e = L[L.length - 1];
        if (e) { thStrikeFx(e.x, e.y, e.z + e.h * 0.5, 1.5); if (e.hittable()) applyHit(p, e, WH.thFinal, { noStopAtt: true, dir: p.facing }); }
        const H = p.stepHit.filter(o => o.hittable());
        for (let k = 0; k < H.length; k++) {
          const a = H[k], b = H[(k + 1) % H.length];
          if (a !== b) FX.add('world', new FLightning(a.x, sy(a.y, a.z + a.h * 0.5), b.x, sy(b.y, b.z + b.h * 0.5), { w: 2.4, br: 1, life: 14, glow: 0.4 }));
          Gear.proc(p, a, 1.6, { quiet: true, hit: { dmg: 1, kx: 2, stun: 30 } }); Status.add(a, 'shock', { t: 30 });
        }
        Sfx.play('explode', 0.6, 1.3); Sfx.wlayer('elec', 3, true); Game.flashScreen(0.3, '255,250,210'); Game.addShake(9);
        p.play('ebImpact', 1, 1, true);
      }
      if (f >= p.stepEnd + 14) p.actDone = true;
    },
    end(p) { p.stepList = null; p.stepHit = null; },
  },
}, {
  name: '천벌의 뇌우', mp: 480, cd: 42, ico: ['cloud', '255,240,110'],
  desc: '검을 하늘로 치켜들어 벼락을 받아 먹구름을 부른다. 5초 동안 화면 안의 적에게 쉴 새 없이 낙뢰가 꽂히고 번개가 옆 적에게 옮겨붙는다. 그동안 자유롭게 싸울 수 있고, 끝에 천벌의 낙뢰가 가장 강한 적을 내리친다.',
  act: {
    anim: 'ultUp', len: 44, cancel: 34, atkCancel: 28,
    start(p) { forgeCine(p, '천벌의 뇌우', '天 罰 雷 雨', '255,230,90', { bars: 50, dim: 0.35 }); p.invul = 120; p.vx = 0; },
    update(p, f) {
      if (f === 6) {
        FX.add('world', new FLightning(p.x + 30, sy(0, 660), p.x + p.facing * 20, sy(p.y, p.z + 150), { w: 7, br: 4, life: 18 }));
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 260, 22, { col: '255,240,120', w: 12 }));
        FF.spray('spark', p.x, sy(p.y, 150), 16, { col: '255,245,170', v0: 4, v1: 12, grav: 0.3, l0: 12, l1: 22 });
        Game.flashScreen(0.7, '255,250,210'); Sfx.wlayer('elec', 3, true); Sfx.play('explode', 0.7); p.bladeGlow = 3;
        FX.add('world', new FStorm(p)); forgeUndim(60);
      }
    },
  },
});

// 먹구름 : 5초 동안 낙뢰 → 끝에 천벌
class FStorm {
  constructor(p) { Object.assign(this, { p, t: 0, life: 320, add: true, n: 0 }); Game.stormT = 320; }
  update() {
    this.t++;
    const p = this.p;
    if (this.t % 9 === 0 && this.t < this.life - 30) {
      const list = WS.onScreen();
      if (list.length) {
        const e = choose(list); this.n++;
        thStrikeFx(e.x, e.y, e.z + e.h * 0.5);
        applyHit(p, e, WH.thStrike, { noStopAtt: true, dir: -e.facing || 1 }); Status.add(e, 'shock', { t: 18 });
        if (this.n % 3 === 0) for (const o of Gear.near(p, e, 300, 2)) { FX.add('world', new FLightning(e.x, sy(e.y, e.z + e.h * 0.5), o.x, sy(o.y, o.z + o.h * 0.5), { w: 2, br: 1, life: 10, glow: 0.4 })); Gear.proc(p, o, 0.8, { quiet: true }); Status.add(o, 'shock', { t: 18 }); }
        Sfx.wlayer('elec', 2, false); Game.addShake(3);
        if (this.n % 4 === 0) Game.flashScreen(0.12, '230,240,255');
      }
    }
    if (this.t === this.life - 14) {                         // 천벌
      const list = WS.onScreen().sort((a, b) => (+!!b.isBoss - +!!a.isBoss) || (b.hp - a.hp));
      const e = list[0];
      if (e) {
        FX.add('world', new FBeam(e.x, e.y, 70, 30, { col: '255,240,140', core: '255,255,255' }));
        thStrikeFx(e.x, e.y, e.z + e.h * 0.5, 2.4);
        FX.add('world', new FLightning(e.x - 80, sy(0, 660), e.x, sy(e.y, e.z + e.h * 0.5), { w: 9, br: 6, life: 22 }));
        applyHit(p, e, WH.thJudge, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
        for (const o of Gear.near(p, e, 360)) { FX.add('world', new FLightning(e.x, sy(e.y, e.z + e.h * 0.5), o.x, sy(o.y, o.z + o.h * 0.5), { w: 3, br: 2, life: 14 })); Gear.proc(p, o, 3, { quiet: true, hit: { dmg: 1.5, kx: 4, kz: 6, stun: 40 } }); }
        Sfx.play('explode', 1.1); Sfx.wlayer('elec', 3, true); Game.flashScreen(0.85, '255,252,225'); Game.addShake(18); Game.zoomPunch(1.06); Game.slowmo(0.4, 18);
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {                                                // 구름 속 번쩍임
    if (this.t % 23 < 3) { const x = Game.cam.x + FF.h(this.t, 1) * W; drawGlow(ctx, x, 40, 220, '220,230,255', 0.35, 1, 0.35); }
  }
}
