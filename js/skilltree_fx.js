'use strict';
// ============================================================
//  검의 성좌 : 전직 연출 · 직업 표식 (skilltree.js 의 TreeUI 에 덧붙인다)
//   - 첫 별을 밝히면 「1차 전직」, 확장 별 8개를 밝히면 「2차 전직」, 왕관 별을 밝히면 「3차 전직」 연출이 나온다
//   - 가운데 별에는 직업 고리가, 판 왼쪽 위에는 직업 명패가 걸린다
// ============================================================
(() => {
  const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const E = Ease;

  // ---------- 배우는 순간 전직 확인 ----------
  const origLearn = TreeUI.tryLearn;
  TreeUI.tryLearn = function () {
    origLearn.call(this);
    const jt = Prog.jobTier(), seen = Save.data.jobSeen || 0;
    if (jt > seen && Prog.job()) {
      Save.data.jobSeen = jt; Save.save();
      this.cineQ.push({ kind: 'job', arm: Prog.job(), tier: jt });
    }
  };
  const origStart = TreeUI.startCine;
  TreeUI.startCine = function (q) {
    origStart.call(this, q);
    if (q.kind === 'job') { this.cine.life = 330; this.shake = 16; this.flashA = 0.5; Sfx.play('combo', 0.9, 0.6); Sfx.play('quake', 0.5, 1.2); }
  };
  const origCine = TreeUI.drawCine;
  TreeUI.drawCine = function (ctx) { if (this.cine && this.cine.kind === 'job') return this.drawJobCine(ctx, this.cine); return origCine.call(this, ctx); };

  // ---------- 가운데 별 둘레의 직업 고리 ----------
  const origCursor = TreeUI.drawCursor;
  TreeUI.drawCursor = function (ctx) {
    const job = Prog.job();
    if (job) {
      const t = this.t, tier = Prog.jobTier(), col = SK_ARMS[job].col;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 0, 0, 96 + tier * 10, col, 0.18 + Math.sin(t * 0.05) * 0.05);
      for (let k = 0; k < tier; k++) {
        const R = 64 + k * 15, a0 = t * (0.012 + k * 0.006) * (k % 2 ? -1 : 1);
        ctx.strokeStyle = `rgba(${col},${0.55 - k * 0.08})`; ctx.lineWidth = 2.2 - k * 0.3; ctx.setLineDash([14 - k * 3, 9 + k * 2]); ctx.beginPath(); ctx.arc(0, 0, R, a0, a0 + TAU); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let i = 0; i < tier * 3; i++) { const a = t * 0.02 + i * TAU / (tier * 3), R = 64 + (i % tier) * 15; drawGlow(ctx, Math.cos(a) * R, Math.sin(a) * R, 7, col, 0.7); }
      ctx.restore();
    }
    origCursor.call(this, ctx);
  };

  // ---------- 판 왼쪽 위의 직업 명패 ----------
  const origBoardUI = TreeUI.drawBoardUI;
  TreeUI.drawBoardUI = function (ctx) {
    origBoardUI.call(this, ctx);
    const job = Prog.job(); if (!job) return;
    const B = this.BR, A = SK_ARMS[job], J = SK_JOB[job], tier = Prog.jobTier(), x = B.x + 14, y = B.y + 12, w = 214, h = 52, col = A.col;
    ctx.save();
    ctx.fillStyle = 'rgba(6,8,18,0.82)'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = `rgba(${col},0.85)`; ctx.lineWidth = 1.8; ctx.stroke();
    const g = ctx.createLinearGradient(x, y, x + w, y); g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 9); ctx.fill();
    UI.text(ctx, J.han[tier - 1], x + 38, y + h / 2 + 1, { size: tier > 2 ? 22 : 26, align: 'center', fill: '#ffe9a6', stroke: 4 });
    UI.text(ctx, `${tier}차 전직`, x + 80, y + 17, { size: 11, align: 'left', font: FONT_B, weight: 800, fill: `rgb(${col})`, stroke: 3 });
    UI.text(ctx, J.tier[tier - 1], x + 80, y + 36, { size: 20, align: 'left', fill: '#fff', stroke: 4 });
    for (let i = 0; i < 3; i++) { ctx.fillStyle = i < tier ? `rgb(${SK_GOLD})` : 'rgba(120,128,150,0.5)'; ctx.beginPath(); ctx.moveTo(x + w - 18 - i * 15, y + 8); ctx.lineTo(x + w - 14 - i * 15, y + 14); ctx.lineTo(x + w - 18 - i * 15, y + 20); ctx.lineTo(x + w - 22 - i * 15, y + 14); ctx.fill(); }
    ctx.restore();
  };


  // ---------- 전직 오라 : 전투 중 주인공 발밑 · 몸 둘레 ----------
  class JobSigil {
    constructor(p) { this.p = p; this.t = 0; this.dead = false; }
    update() {
      const p = this.p; this.t++;
      if (Game.player !== p || p.hp <= 0 || !Prog.job() || Prog.jobTier() < 1) { this.dead = true; p.sigilFx = null; return false; }
      return true;
    }
    draw(ctx) {
      const p = this.p, job = Prog.job(), tier = Prog.jobTier(), col = SK_ARMS[job].col, t = this.t, X = p.x, Y = sy(p.y, 0);
      ctx.save(); ctx.translate(X, Y); ctx.scale(1, 0.3); ctx.globalCompositeOperation = 'lighter';
      const R0 = 54 + tier * 12, pu = 0.5 + Math.sin(t * 0.06) * 0.15;
      drawGlow(ctx, 0, 0, R0 * 1.3, col, 0.12 + tier * 0.04);
      ctx.lineCap = 'round';
      for (let k = 0; k < tier; k++) {
        const R = R0 - k * 14, a0 = t * (0.014 + k * 0.007) * (k % 2 ? -1 : 1);
        ctx.strokeStyle = `rgba(${col},${(0.62 - k * 0.1) * pu + 0.15})`; ctx.lineWidth = 3 - k * 0.5;
        ctx.setLineDash([R * 0.34, R * 0.12]); ctx.beginPath(); ctx.arc(0, 0, R, a0, a0 + TAU); ctx.stroke();
      }
      ctx.setLineDash([]);
      if (tier >= 2) {                                                              // 룬 표식
        for (let i = 0; i < 6; i++) { const a = t * 0.01 + i * TAU / 6; ctx.save(); ctx.translate(Math.cos(a) * (R0 + 10), Math.sin(a) * (R0 + 10)); ctx.rotate(a + Math.PI / 2); ctx.strokeStyle = `rgba(${col},0.7)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(0, 7); ctx.lineTo(4, -4); ctx.stroke(); ctx.restore(); }
      }
      if (tier >= 3) {                                                              // 별 모양 문양
        ctx.strokeStyle = `rgba(${SK_GOLD},0.55)`; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 5; i++) { const a = -t * 0.012 + i * 2 * TAU / 5, R = R0 - 20; i ? ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R) : ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R); } ctx.stroke();
      }
      ctx.restore();
    }
  }
  const origTick = Prog.tick;
  Prog.tick = function (p) {
    origTick.call(this, p);
    const job = this.job(), tier = this.jobTier();
    if (!job || p.hp <= 0 || p.state === 'dead') return;
    if (!p.sigilFx || p.sigilFx.dead) { p.sigilFx = new JobSigil(p); FX.add('ground', p.sigilFx); }
    const col = SK_ARMS[job].col, gap = [0, 11, 7, 4][tier];
    if (Game.frame % gap === 0) {
      const a = rand(0, TAU), r = rand(10, 24 + tier * 6);
      FX.add('world', new Mote(p.x + Math.cos(a) * r, sy(p.y, rand(0, 30)), 0, rand(-2.4, -0.8) - tier * 0.2, { col: tier > 2 && chance(0.3) ? SK_GOLD : col, life: 26 + tier * 6, r: rand(3, 4.5 + tier), grav: 0 }));
    }
  };

  // ---------- 전직 연출 ----------
  TreeUI.drawJobCine = function (ctx, C) {
    const T = C.t, life = C.life, a = Math.min(1, T / 16, (life - T) / 26), cx = W / 2, cy = 286;
    const A = SK_ARMS[C.arm], J = SK_JOB[C.arm], col = A.col, gold = SK_GOLD, tier = C.tier, prev = tier > 1 ? J.tier[tier - 2] : J.base;
    ctx.save();
    ctx.fillStyle = `rgba(2,3,8,${0.9 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const ng = ctx.createRadialGradient(cx, cy, 10, cx, cy, 560); ng.addColorStop(0, `rgba(${col},${0.4 * a})`); ng.addColorStop(0.5, `rgba(${col},${0.1 * a})`); ng.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = ng; ctx.fillRect(0, 0, W, H);
    // 햇살
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(T * 0.003);
    for (let i = 0; i < 28; i++) { const an = i * TAU / 28, L = (i % 2 ? 520 : 820) * E.out3(Math.min(1, Math.max(0, (T - 70) / 40))), wd = i % 2 ? 0.025 : 0.05; ctx.fillStyle = `rgba(${i % 3 ? col : gold},${0.08 * a})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an - wd) * L, Math.sin(an - wd) * L); ctx.lineTo(Math.cos(an + wd) * L, Math.sin(an + wd) * L); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // 떠오르는 불씨
    for (let i = 0; i < 70; i++) { const sp = 0.6 + hash(i, 1) * 2.2, y = H - ((T * sp + hash(i, 2) * H * 1.4) % (H * 1.1)), x = hash(i, 3) * W + Math.sin(T * 0.03 + i) * 18, r = 1.4 + hash(i, 4) * 3.4; drawGlow(ctx, x, y, r * 4, i % 4 ? col : gold, 0.5 * a * Math.min(1, (T - 8) / 30)); }
    // 검들이 소용돌이치며 모여든다
    const NS = 44;
    for (let i = 0; i < NS; i++) {
      const u = E.inOut(clamp((T - 6 - i * 0.9) / 58, 0, 1)); if (u <= 0 || u >= 1) continue;
      const ang = i * 0.43 + T * 0.045 * (1 - u * 0.4), R = lerp(640, 40, u), x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R * 0.62;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2 + Math.PI); const L = 34 + hash(i, 5) * 30;
      ctx.fillStyle = `rgba(${col},${0.9 * a * (1 - u * 0.4)})`; ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(3.2, 0); ctx.lineTo(0, 10); ctx.lineTo(-3.2, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.7 * a})`; ctx.fillRect(-0.7, -L + 4, 1.4, L - 6); drawGlow(ctx, 0, -L * 0.4, 16, col, 0.4 * a);
      ctx.restore();
    }
    // 충격 (T = 70)
    if (T >= 70) {
      const k = T - 70;
      for (let r = 0; r < 3; r++) { const u = clamp((k - r * 7) / 40, 0, 1); if (u > 0 && u < 1) { ctx.strokeStyle = `rgba(${r ? col : gold},${(1 - u) * 0.9 * a})`; ctx.lineWidth = 14 * (1 - u) + 1; ctx.beginPath(); ctx.arc(cx, cy, 40 + E.out3(u) * (360 + r * 140), 0, TAU); ctx.stroke(); } }
      if (k < 14) { ctx.fillStyle = `rgba(255,248,230,${(1 - k / 14) * 0.7 * a})`; ctx.fillRect(0, 0, W, H); }
      drawGlow(ctx, cx, cy, 260, col, 0.45 * a); drawGlow(ctx, cx, cy, 120, gold, 0.4 * a);
      // 직업 문양
      const m = E.out3(Math.min(1, k / 30)) * a;
      ctx.lineCap = 'round';
      if (C.arm === 'p') {                                                              // 교차하는 두 줄기 참격
        for (const s of [-1, 1]) { const L = 380 * m, x0 = cx - s * L, y0 = cy - L * 0.55, x1 = cx + s * L, y1 = cy + L * 0.55; ctx.strokeStyle = `rgba(${col},0.35)`; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3; ctx.stroke(); }
      } else if (C.arm === 's') {                                                       // 흐르는 물결 검
        for (let w = 0; w < 5; w++) { ctx.strokeStyle = `rgba(${w % 2 ? col : '200,235,255'},${0.55 * m})`; ctx.lineWidth = 3 - w * 0.3; ctx.beginPath(); for (let x = -420; x <= 420; x += 12) { const y = Math.sin(x * 0.015 + T * 0.08 + w) * (26 - w * 3) * m + (w - 2) * 14; x === -420 ? ctx.moveTo(cx + x, cy + y) : ctx.lineTo(cx + x, cy + y); } ctx.stroke(); }
      } else if (C.arm === 'w') {                                                       // 룬 고리
        for (let r = 0; r < 2; r++) { const R = (190 + r * 46) * m; ctx.strokeStyle = `rgba(${col},${0.6 * m})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke(); for (let i = 0; i < 18; i++) { const an = i * TAU / 18 + T * 0.01 * (r ? -1 : 1); ctx.save(); ctx.translate(cx + Math.cos(an) * R, cy + Math.sin(an) * R); ctx.rotate(an + Math.PI / 2); ctx.strokeStyle = `rgba(${i % 3 ? col : '255,255,255'},${0.8 * m})`; ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(0, 7); ctx.lineTo(5, -4); ctx.lineTo(-2, 0); ctx.stroke(); ctx.restore(); } }
      } else {                                                                          // 육각 방벽 + 빛기둥
        for (let r = 0; r < 3; r++) { const R = (150 + r * 40) * m; ctx.strokeStyle = `rgba(${r ? col : gold},${0.65 * m})`; ctx.lineWidth = 3 - r * 0.6; ctx.beginPath(); for (let i = 0; i <= 6; i++) { const an = i * TAU / 6 + T * 0.006 * (r % 2 ? -1 : 1) - Math.PI / 2; i ? ctx.lineTo(cx + Math.cos(an) * R, cy + Math.sin(an) * R) : ctx.moveTo(cx + Math.cos(an) * R, cy + Math.sin(an) * R); } ctx.stroke(); }
        for (let i = -3; i <= 3; i++) { const g = ctx.createLinearGradient(0, cy - 300, 0, cy + 300); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(${col},${0.18 * m})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx + i * 110 - 5, cy - 300, 10, 600); }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = a;
    // 한자 (큰 글씨)
    if (T >= 70) {
      const pop = E.back(Math.min(1, (T - 70) / 22));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
      UI.text(ctx, J.han[tier - 1], 0, -6, { size: tier > 2 ? 100 : 118, align: 'center', fill: '#ffe9a6', stroke: 10 });
      ctx.restore();
    }
    // 글자들
    const fadeIn = (t0) => clamp((T - t0) / 14, 0, 1);
    ctx.globalAlpha = a * fadeIn(86); UI.text(ctx, `${tier}  차    전  직`, cx, cy - 168, { size: 22, align: 'center', fill: `rgb(${gold})`, stroke: 5 });
    ctx.globalAlpha = a * fadeIn(112);
    UI.text(ctx, prev, cx - 150, cy + 112, { size: 22, align: 'center', fill: '#9aa4c0', stroke: 4 });
    UI.text(ctx, '▶', cx - 70, cy + 112, { size: 20, align: 'center', fill: `rgb(${col})`, stroke: 3 });
    ctx.globalAlpha = a * fadeIn(124);
    UI.text(ctx, J.tier[tier - 1], cx + 70, cy + 108, { size: 54, align: 'center', fill: '#ffffff', stroke: 8 });
    ctx.globalAlpha = a * fadeIn(150);
    UI.text(ctx, `${A.name} · ${J.han[tier - 1]}`, cx, cy + 156, { size: 20, align: 'center', font: FONT_B, weight: 800, fill: `rgb(${col})`, stroke: 4 });
    ctx.globalAlpha = a * fadeIn(172);
    skWrap(ctx, J.d[tier - 1], 720, 18).forEach((ln, i) => UI.text(ctx, ln, cx, cy + 196 + i * 26, { size: 18, align: 'center', font: FONT_B, weight: 700, fill: '#e8ecff', stroke: 4 }));
    if (tier === 1) { ctx.globalAlpha = a * fadeIn(200); UI.text(ctx, '다른 갈래의 별은 70%의 효과만 낸다  ·  확장 별은 전직한 갈래에서만 배운다', cx, cy + 246, { size: 14, align: 'center', font: FONT_B, weight: 700, fill: '#ffd24a', stroke: 3 }); }
    if (T > 60) { ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(T * 0.12)); UI.text(ctx, Touch.on ? '탭해서 계속' : '아무 키나 눌러 계속', cx, H - 56, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 }); }
    ctx.restore();
  };
})();
