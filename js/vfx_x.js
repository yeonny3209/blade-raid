'use strict';
// ============================================================
//  전투 연출 2차 : 화면 후처리 · 타격 불꽃 · 처치 폭발 · 콤보 연출
//   - Vfx.post(ctx)   월드를 다 그린 뒤 : 빛번짐(블룸) + 대비 + 강타 잔상  (프레임이 느리면 스스로 꺼진다)
//   - Vfx.onHit(...)  applyHit(entity.js) 끝에서 불린다 : 별 모양 섬광 · 충격 고리 · 방향성 불꽃 · 처치 폭발
//   - Vfx.tick()      Game.update 에서 : 콤보 마일스톤 · 후처리 값 감쇠
// ============================================================
class VfxStar {                                           // 십자 모양 섬광 (가로 · 세로 · 대각)
  constructor(x, y, o = {}) { Object.assign(this, { x, y, t: 0, life: o.life || 12, r: o.r || 60, col: o.col || '255,240,200', rot: o.rot || 0, n: o.n || 2, thin: o.thin || 0.09 }); }
  update() { this.t++; return this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = 1 - u, L = this.r * (0.35 + Ease.out3(Math.min(1, u * 2.2)) * 0.9);
    ctx.save(); ctx.translate(this.x, this.y); ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 0, 0, L * 0.55, this.col, 0.55 * a);
    for (let k = 0; k < this.n; k++) {
      ctx.save(); ctx.rotate(this.rot + k * Math.PI / this.n);
      ctx.fillStyle = `rgba(${this.col},${0.9 * a})`; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, -L * this.thin); ctx.lineTo(L, 0); ctx.lineTo(0, L * this.thin); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.moveTo(-L * 0.5, 0); ctx.lineTo(0, -L * this.thin * 0.45); ctx.lineTo(L * 0.5, 0); ctx.lineTo(0, L * this.thin * 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}
class VfxSoul {                                           // 쓰러진 적에게서 피어오르는 빛 (위로 올라가며 흩어진다)
  constructor(x, y, col, n = 8) { this.x = x; this.y = y; this.t = 0; this.life = 54; this.col = col; this.p = []; for (let i = 0; i < n; i++) this.p.push({ x: rand(-14, 14), y: rand(-8, 8), vx: rand(-0.5, 0.5), vy: rand(-2.4, -0.8), r: rand(2.5, 6), ph: rand(0, TAU) }); }
  update() { this.t++; for (const q of this.p) { q.x += q.vx + Math.sin(this.t * 0.18 + q.ph) * 0.4; q.y += q.vy; q.vy *= 0.985; } return this.t < this.life; }
  draw(ctx) { const a = 1 - this.t / this.life; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const q of this.p) drawGlow(ctx, this.x + q.x, this.y + q.y, q.r * 3.2, this.col, 0.7 * a); ctx.restore(); }
}

const Vfx = {
  on: true, ghost: 0, ghostX: 640, ghostY: 360, chroma: 0, pulse: 0, pulseCol: '255,230,170',
  A: null, B: null, ag: null, bg: null, lastT: 0, slow: 0, fpsN: 0, lastCombo: 0,
  _mk(w, h) { const c = makeCanvas(w, h); return [c, c.getContext('2d')]; },

  // ---------- 후처리 ----------
  post(ctx) {
    if (!this.on || Opt.get().fx === false) return;
    const cv = ctx.canvas, cw = cv.width, ch = cv.height, now = performance.now();
    if (this.lastT) {                                                                  // 느린 기기에서는 끈다
      const dt = now - this.lastT; this.slow = this.slow * 0.97 + (dt > 30 ? 3 : dt < 20 ? -1 : 0);
      if (this.slow > 90) { this.on = false; return; }
    }
    this.lastT = now;
    if (!this.A || this.A.width !== (cw >> 2)) { [this.A, this.ag] = this._mk(cw >> 2, ch >> 2); [this.B, this.bg] = this._mk(cw >> 4, ch >> 4); }
    // 밝은 부분만 뽑아 작게 줄였다가 번지게 키운다
    this.ag.globalCompositeOperation = 'copy'; this.ag.imageSmoothingEnabled = true;
    try { this.ag.filter = 'brightness(0.62) contrast(1.9)'; } catch (e) { }
    this.ag.drawImage(cv, 0, 0, cw, ch, 0, 0, this.A.width, this.A.height);
    try { this.ag.filter = 'none'; } catch (e) { }
    this.bg.globalCompositeOperation = 'copy'; this.bg.imageSmoothingEnabled = true; this.bg.drawImage(this.A, 0, 0, this.B.width, this.B.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.42 + this.pulse * 0.3; ctx.drawImage(this.B, 0, 0, cw, ch);
    ctx.globalAlpha = 0.3 + this.pulse * 0.2; ctx.drawImage(this.A, 0, 0, cw, ch);
    // 강타 : 화면이 중심에서 번져 나가는 잔상
    if (this.ghost > 0) {
      const g = this.ghost / 8, s = 1 + 0.018 * g * (this.ghostBig ? 2 : 1), fx = this.ghostX * cw / W, fy = this.ghostY * ch / H;
      ctx.globalAlpha = 0.22 * g; ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy); ctx.drawImage(cv, 0, 0);
    }
    ctx.restore();
    // 대비 : 자기 자신을 겹쳐 그림자는 더 짙게, 빛은 더 선명하게
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16; ctx.drawImage(cv, 0, 0); ctx.restore();
    // 색 번짐 (크리티컬 · 필살)
    if (this.chroma > 0) {
      const g = this.chroma / 10; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16 * g; ctx.drawImage(cv, -3 * g * cw / W, 0); ctx.drawImage(cv, 3 * g * cw / W, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  },

  tick() {
    if (this.ghost > 0) this.ghost--; if (this.chroma > 0) this.chroma--; this.pulse = Math.max(0, this.pulse - 0.05);
    const G = Game.combo; if (!G) return;
    const n = G.n || 0;
    if (n < this.lastCombo) this.lastCombo = 0;
    const m = Math.floor(n / 25);
    if (m > Math.floor(this.lastCombo / 25) && Game.player && n >= 25) this.comboFx(n, m);
    this.lastCombo = n;
  },
  comboFx(n, m) {
    const p = Game.player, x = p.x, y = sy(p.y, 0), cols = ['255,220,120', '255,150,80', '255,90,120', '200,120,255', '120,200,255'], col = cols[Math.min(cols.length - 1, m - 1)];
    FX.add('ground', new Ring(x, y, 20, 420 + m * 40, 30, { col, w: 16 })); FX.add('ground', new Ring(x, y, 10, 300, 24, { col: '255,255,255', w: 6 }));
    FX.add('world', new Flash(x, y - 60, 20, 300, 18, col, 0.7));
    FX.add('top', new Label(x, y - 200, `${n} COMBO!`, { col: ['#ffffff', `rgb(${col})`], size: 34 + Math.min(20, m * 3), life: 70, vy: -0.5 }));
    if (typeof FF !== 'undefined') FF.spray('star', x, y - 60, 22, { v0: 4, v1: 11, l0: 28, l1: 44 });
    this.pulse = 1; this.pulseCol = col; this.ghostX = x - Game.cam.x; this.ghostY = y - 60; this.ghost = 8; this.ghostBig = true;
    Game.flashScreen(0.12, col); Sfx.play('combo', 0.55, 1 + m * 0.06);
  },

  // ---------- 타격 ----------
  //   o : { X, Y, dir, ipw, crit, dmg, stop, back, counter, killed, hz }
  onHit(att, tgt, hit, o) {
    if (!this.on || !att.isPlayer) return;
    const { X, Y, dir, ipw, crit, killed } = o, col = att.wcol || '255,240,200';
    const big = ipw >= 2 || crit;
    // 섬광 : 칼 색의 별 + 흰 십자
    FX.add('world', new VfxStar(X, Y, { r: 34 + ipw * 14 + (crit ? 30 : 0), col: crit ? '255,220,110' : col, rot: rand(0, TAU), n: crit ? 3 : 2, life: crit ? 16 : 11 }));
    if (typeof FF !== 'undefined') {
      FF.spray('spark', X, Y, 5 + ipw * 4 + (crit ? 8 : 0), { v0: 3 + ipw, v1: 9 + ipw * 3, ang: dir > 0 ? 0 : Math.PI, spread: 1.1, l0: 16 + ipw * 3, l1: 26 + ipw * 5 });
      if (big) FF.spray('ember', X, Y, 6 + ipw * 3, { v0: 1, v1: 5, l0: 24, l1: 40 });
    }
    if (big) FX.add('world', new Ring(X, Y, 6, 44 + ipw * 30 + (crit ? 24 : 0), 11, { col: crit ? '255,220,110' : col, w: 5 }));
    if (crit) { this.chroma = 8; this.ghost = Math.max(this.ghost, 5); this.ghostX = X - Game.cam.x; this.ghostY = Y; this.ghostBig = false; }
    else if (ipw >= 3) { this.ghost = Math.max(this.ghost, 6); this.ghostX = X - Game.cam.x; this.ghostY = Y; this.ghostBig = false; }
    if (o.counter) { FX.add('world', new VfxStar(X, Y, { r: 120, col: '255,240,170', n: 4, life: 20, thin: 0.07 })); this.pulse = 1; this.pulseCol = '255,240,170'; }
    if (killed) this.kill(tgt, X, Y, ipw, crit, col);
  },
  // 처치 : 폭발 + 영혼 + 파편
  kill(tgt, X, Y, ipw, crit, col) {
    const boss = tgt.isBoss, base = tgt.deathCol || tgt.col || '255,170,120';
    FX.add('world', new Flash(X, Y, 12, 120 + (boss ? 200 : 0), 14, crit ? '255,230,140' : col, 0.65));
    FX.add('world', new Ring(X, Y, 10, 100 + (boss ? 160 : 0) + ipw * 18, 18, { col: '255,255,255', w: 8 }));
    FX.add('world', new VfxSoul(tgt.x, sy(tgt.y, tgt.z + (tgt.hurtH ? tgt.hurtH() * 0.5 : 40)), crit ? '255,230,130' : col, boss ? 22 : 8 + ipw * 2));
    if (typeof FF !== 'undefined') { FF.spray('shard', X, Y, boss ? 30 : 10 + ipw * 3, { v0: 3, v1: 11, l0: 24, l1: 38 }); FF.spray('spark', X, Y, boss ? 36 : 14 + ipw * 4, { v0: 4, v1: 13, l0: 18, l1: 30 }); }
    FX.add('world', new VfxStar(X, Y, { r: boss ? 240 : 110, col: crit ? '255,230,140' : col, n: 3, life: boss ? 26 : 16 }));
    this.pulse = Math.max(this.pulse, boss ? 1 : 0.5); this.pulseCol = col;
    if (!boss && ipw >= 2 && Game.slowScale >= 1) Game.slowmo(0.55, 5);                  // 강타로 쓰러뜨리면 살짝 느려진다
  },
};
