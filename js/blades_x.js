'use strict';
// ============================================================
//  검 외형 2차 : 금속 질감 · 등날 가시 · 얼음 고드름 · 상감 · 보석 · 장식띠 · 손상 흔적 · 불꽃 등
//   blades.js 의 drawPlayerBlade 가 부른다.  드로어 두 개 :
//     drawBladeBack  — 칼날 뒤(손잡이 · 날 밑)에 그려지는 것 : 등날 가시, 고드름, 사슬
//     drawBladeExtra — 칼날 위에 덧그리는 것 : 광택 · 상감 · 보석 · 장식띠 · 불꽃 …
//   스타일 키는 BLADE_STYLE (blades.js) 에서 켠다.
// ============================================================
const _bxAt = (A, u) => { const N = A.length - 1, f = Math.min(N - 0.001, Math.max(0, u * N)), i = f | 0, k = f - i; return [A[i][0] + (A[i + 1][0] - A[i][0]) * k, A[i][1] + (A[i + 1][1] - A[i][1]) * k]; };
const _bxLine = (ctx, A, u0, u1, n = 14, dy = 0) => { for (let i = 0; i <= n; i++) { const p = _bxAt(A, u0 + (u1 - u0) * i / n); i ? ctx.lineTo(p[0], p[1] + dy) : ctx.moveTo(p[0], p[1] + dy); } };
// 칼날 안쪽으로 가두기
const _bxClip = (ctx, G) => { ctx.beginPath(); polyPath(ctx, _flat(G.top).concat(_flat(G.bot.slice().reverse()))); ctx.clip(); };
// 두 선 사이(위 a0 ~ a1 아래 비율) 띠
const _bxBand = (ctx, G, a0, a1, col) => {
  const n = Math.min(G.top.length, G.bot.length), f = a => G.top.slice(0, n).map((p, i) => [p[0], p[1] + (G.bot[i][1] - p[1]) * a]);
  ctx.fillStyle = col; ctx.beginPath(); polyPath(ctx, _flat(f(a0)).concat(_flat(f(a1).reverse()))); ctx.fill();
};

// ---------- 칼날 뒤에 깔리는 것 ----------
function drawBladeBack(ctx, S, G, c, trim, ol, glow, rune, t) {
  const T = G.top, B = G.bot;
  if (S.spines) {                                         // 등날 가시 (날 끝쪽으로 갈수록 낮아진다)
    const sp = S.spines;
    for (let k = 0; k < sp.n; k++) {
      const f = (k + 0.5) / sp.n, u = sp.u0 + f * (sp.u1 - sp.u0), p = _bxAt(T, u), h = sp.h * (1 - 0.4 * f), w = sp.w || 3.2, lean = sp.lean ?? 3;
      olPoly(ctx, [p[0] - w, p[1] + 1.6, p[0] + lean, p[1] - h, p[0] + w + 1, p[1] + 1.6], sp.col || c[1], ol, 1.1);
      ctx.fillStyle = sp.hi || c[2]; ctx.beginPath(); polyPath(ctx, [p[0] - w * 0.2, p[1] + 0.8, p[0] + lean, p[1] - h + 1.2, p[0] + lean * 0.3, p[1] + 0.8]); ctx.fill();
      if (sp.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${glow},${0.35 + Math.sin(t * 0.1 + k) * 0.15})`; ctx.beginPath(); polyPath(ctx, [p[0] - w * 0.2, p[1] + 0.8, p[0] + lean, p[1] - h + 1.2, p[0] + lean * 0.3, p[1] + 0.8]); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    }
  }
  if (S.icicles) {                                        // 날 아래로 자라난 고드름
    const ic = S.icicles;
    for (let k = 0; k < ic.n; k++) {
      const f = (k + 0.5) / ic.n, u = ic.u0 + f * (ic.u1 - ic.u0), p = _bxAt(B, u), h = ic.h * (0.55 + 0.45 * Math.abs(Math.sin(k * 2.3 + 1)));
      olPoly(ctx, [p[0] - 2, p[1] - 1.5, p[0] + 0.4, p[1] + h, p[0] + 2.2, p[1] - 1.5], '#d6f1ff', ol, 1);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); polyPath(ctx, [p[0] - 0.9, p[1] - 0.8, p[0] + 0.2, p[1] + h * 0.7, p[0] + 0.4, p[1] - 0.8]); ctx.fill();
    }
  }
  if (S.chain) {                                          // 자루 끝에 매달린 사슬
    const n = S.chain, sw = Math.sin(t * 0.05) * 1.6;
    for (let i = 0; i < n; i++) {
      const x = -19 - i * 3.1 - sw * i * 0.3, y = 1.5 + i * 2.6 + Math.sin(t * 0.06 + i * 0.7) * (0.6 + i * 0.35), a = i % 2 ? 0.9 : -0.2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, 0, 2.5, 1.5, 0, 0, TAU); ctx.lineWidth = 2.4; ctx.strokeStyle = ol; ctx.stroke(); ctx.lineWidth = 1.1; ctx.strokeStyle = i % 2 ? trim[2] : trim[1]; ctx.stroke(); ctx.restore();
    }
    const L = n, x = -19 - L * 3.1 - sw * L * 0.3, y = 1.5 + L * 2.6;
    if (S.chainEnd === 'hook') { ctx.beginPath(); ctx.arc(x - 1, y + 3, 3, -2.2, 1.6); ctx.lineWidth = 3; ctx.strokeStyle = ol; ctx.stroke(); ctx.lineWidth = 1.5; ctx.strokeStyle = trim[1]; ctx.stroke(); }
    else circleOl(ctx, x - 1, y + 2, 2.6, trim[1], ol, 1);
  }
  if (S.fin) {                                            // 용의 등지느러미 (휘어진 막)
    const fn = S.fin;
    for (let k = 0; k < fn.n; k++) {
      const f = (k + 0.5) / fn.n, u = fn.u0 + f * (fn.u1 - fn.u0), p = _bxAt(T, u), q = _bxAt(T, u + 0.06), h = fn.h * (1 - 0.45 * f);
      ctx.beginPath(); ctx.moveTo(p[0], p[1] + 1.4); ctx.quadraticCurveTo(p[0] + 1, p[1] - h, p[0] + 7, p[1] - h * 1.05); ctx.quadraticCurveTo(q[0] + 1, q[1] - h * 0.35, q[0] + 2, q[1] + 1.4); ctx.closePath();
      ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = ol; ctx.stroke(); ctx.fillStyle = fn.col || trim[1]; ctx.fill();
      ctx.strokeStyle = fn.hi || trim[2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(p[0] + 0.5, p[1] + 0.4); ctx.quadraticCurveTo(p[0] + 2, p[1] - h * 0.6, p[0] + 6, p[1] - h * 0.95); ctx.stroke();
    }
  }
}

// ---------- 칼날 위에 덧그리는 것 ----------
function drawBladeExtra(ctx, S, G, c, trim, ol, glow, rune, t, id) {
  const M = G.mid, T = G.top, B = G.bot, W = G.W, col = rune || glow;
  // 금속 광택 : 등 그늘 · 윗면 반사 · 날 쪽 반사광
  if ((!S.matte || S.gloss) && S.gloss !== 0) {
    const k = S.gloss || 1;
    _bxBand(ctx, G, 0, 0.12, `rgba(0,0,24,${0.2 * k})`);
    _bxBand(ctx, G, 0.17, 0.3, `rgba(255,255,255,${0.2 * k})`);
    _bxBand(ctx, G, 0.58, 0.72, `rgba(0,0,30,${0.11 * k})`);
    _bxBand(ctx, G, 0.8, 0.9, `rgba(255,255,255,${0.13 * k})`);
  }
  // 은은한 안쪽 색 번짐 (은하 · 오로라)
  if (S.nebula) {
    ctx.save(); _bxClip(ctx, G); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) { const p = _bxAt(M, 0.15 + k * 0.23), h = (k * 80 + t * 0.6) % 360, q = S.nebula === 2 ? hslRgb(h, 0.8, 0.55) : (k % 2 ? '150,110,255' : '90,150,255'); drawGlow(ctx, p[0], p[1], W * 3.4, typeof q === 'string' ? q : q.join(','), 0.22 + Math.sin(t * 0.05 + k) * 0.06); }
    ctx.restore();
  }
  // 상감 무늬 (자루 쪽 날 밑에 새긴 덩굴무늬)
  if (S.etch) {
    const e = S.etch, a = e.u0 ?? 0.06, b = e.u1 ?? 0.46;
    ctx.save(); _bxClip(ctx, G); ctx.lineCap = 'round'; ctx.strokeStyle = e.col || trim[1]; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.9;
    for (const s of [-1, 1]) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const u = a + (b - a) * i / 24, p = _bxAt(M, u), y = p[1] + s * (W * 0.34 + Math.sin(i * 0.95) * W * 0.17); i ? ctx.lineTo(p[0], y) : ctx.moveTo(p[0], y); } ctx.stroke(); }
    ctx.fillStyle = e.col || trim[1]; for (let i = 0; i < 4; i++) { const p = _bxAt(M, a + (b - a) * (i + 0.5) / 4); ctx.beginPath(); polyPath(ctx, [p[0] - 1.8, p[1], p[0], p[1] - 1.2, p[0] + 1.8, p[1], p[0], p[1] + 1.2]); ctx.fill(); }
    ctx.restore();
  }
  // 깃털 무늬
  if (S.feather) {
    ctx.save(); _bxClip(ctx, G); ctx.strokeStyle = trim[1]; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.85; ctx.beginPath();
    for (let k = 0; k < 9; k++) { const p = _bxAt(M, 0.07 + k * 0.058); ctx.moveTo(p[0] - 1.5, p[1] + 0.2); ctx.lineTo(p[0] + 2.8, p[1] - W * 0.5); ctx.moveTo(p[0] - 1.5, p[1] + 0.2); ctx.lineTo(p[0] + 2.8, p[1] + W * 0.5); }
    ctx.stroke(); ctx.restore();
  }
  // 장식띠 (쇠 띠 · 놋쇠 띠)
  if (S.bands) {
    for (const u of S.bands) {
      const a = _bxAt(T, u), b = _bxAt(B, u), w = S.bandW || 2.4;
      olPoly(ctx, [a[0] - w / 2, a[1] - 0.4, a[0] + w / 2, a[1] - 0.4, b[0] + w / 2, b[1] + 0.4, b[0] - w / 2, b[1] + 0.4], trim[1], ol, 0.9);
      ctx.fillStyle = trim[2]; ctx.fillRect(a[0] - w / 2 + 0.4, a[1], 0.8, b[1] - a[1]);
      ctx.fillStyle = trim[0]; ctx.fillRect(a[0] + w / 2 - 0.9, a[1], 0.6, b[1] - a[1]);
    }
  }
  // 리벳
  if (S.rivets) { ctx.fillStyle = trim[2]; for (const u of S.rivets) { const p = _bxAt(M, u); for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(p[0], p[1] + s * W * 0.42, 0.85, 0, TAU); ctx.fill(); } } }
  // 달의 위상
  if (S.phases) {
    for (let k = 0; k < 5; k++) {
      const p = _bxAt(M, 0.12 + k * 0.105), r = 1.7, ph = k / 4;
      ctx.fillStyle = '#26324e'; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.arc(p[0], p[1], r, -Math.PI / 2, Math.PI / 2); ctx.ellipse(p[0], p[1], Math.abs(r * (1 - ph * 2)), r, 0, Math.PI / 2, -Math.PI / 2, ph * 2 > 1); ctx.fill();
    }
  }
  // 보석 (피홈 위에 박힌 보석)
  if (S.gems) {
    for (let k = 0; k < S.gems.length; k++) {
      const p = _bxAt(M, S.gems[k]), r = k === 0 ? 2.2 : 1.7;
      olPoly(ctx, [p[0] - r * 1.3, p[1], p[0], p[1] - r, p[0] + r * 1.3, p[1], p[0], p[1] + r], `rgb(${glow})`, ol, 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); polyPath(ctx, [p[0] - r * 0.6, p[1], p[0], p[1] - r * 0.55, p[0] + r * 0.1, p[1]]); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, p[0], p[1], r * 3.4, glow, 0.3 + Math.sin(t * 0.09 + k * 1.3) * 0.12); ctx.globalCompositeOperation = 'source-over';
    }
  }
  // 톱니바퀴 (태엽 · 증기)
  if (S.cogs) {
    for (let k = 0; k < S.cogs.length; k++) {
      const [u, r, dir] = S.cogs[k], p = _bxAt(M, u), a0 = t * 0.03 * (dir || 1), pts = [];
      for (let i = 0; i < 24; i++) { const a = a0 + i / 24 * TAU, rr = (i % 3 === 2) ? r * 0.76 : r; pts.push(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr); }
      olPoly(ctx, pts, trim[1], ol, 0.9); circleOl(ctx, p[0], p[1], r * 0.36, trim[0], ol, 0.7);
      ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(p[0] + Math.cos(a0) * r * 0.5, p[1] + Math.sin(a0) * r * 0.5); ctx.lineTo(p[0] - Math.cos(a0) * r * 0.5, p[1] - Math.sin(a0) * r * 0.5); ctx.stroke();
    }
  }
  // 주사위 눈 면
  if (S.dice) {
    const PAT = [[], [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]], [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]];
    const faces = S.dice, sz = W * 0.88;
    for (let k = 0; k < faces.length; k++) {
      const p = _bxAt(M, 0.3 + k * (0.55 / (faces.length - 1 || 1))), n = faces[k];
      olPoly(ctx, [p[0] - sz, p[1] - sz, p[0] + sz, p[1] - sz, p[0] + sz, p[1] + sz, p[0] - sz, p[1] + sz], '#f8f4ec', ol, 0.9);
      ctx.fillStyle = '#d9d0bf'; ctx.fillRect(p[0] - sz, p[1] + sz * 0.45, sz * 2, sz * 0.55);
      ctx.fillStyle = n === 1 || n === 4 ? '#d6202a' : '#1a1218';
      for (const q of PAT[n]) { ctx.beginPath(); ctx.arc(p[0] + q[0] * sz * 0.5, p[1] + q[1] * sz * 0.5 - 0.2, n === 1 ? sz * 0.28 : sz * 0.17, 0, TAU); ctx.fill(); }
    }
  }
  // 바이올린의 f 홀 · 줄받침
  if (S.fholes) {
    ctx.save(); _bxClip(ctx, G); ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { const p = _bxAt(M, 0.34); ctx.beginPath(); ctx.moveTo(p[0] - 2.4, p[1] + s * W * 0.7); ctx.quadraticCurveTo(p[0] + 0.6, p[1] + s * W * 0.3, p[0] - 0.4, p[1] + s * W * 0.1); ctx.quadraticCurveTo(p[0] - 1.6, p[1] - s * W * 0.2, p[0] + 2, p[1] - s * W * 0.6); ctx.stroke(); }
    const q = _bxAt(M, 0.52); olPoly(ctx, [q[0] - 0.8, q[1] - W * 0.7, q[0] + 0.8, q[1] - W * 0.7, q[0] + 1.6, q[1] + W * 0.7, q[0] - 1.6, q[1] + W * 0.7], '#f0d6a0', ol, 0.5); ctx.restore();
  }
  // 팔괘 표식
  if (S.trigram) {
    ctx.fillStyle = 'rgba(30,30,40,0.7)';
    for (let k = 0; k < 3; k++) { const p = _bxAt(M, 0.55 + k * 0.1); for (let j = 0; j < 3; j++) { const y = p[1] - W * 0.55 + j * 1.5; if ((k + j) % 2) { ctx.fillRect(p[0] - 1.6, y, 1.2, 0.8); ctx.fillRect(p[0] + 0.5, y, 1.2, 0.8); } else ctx.fillRect(p[0] - 1.6, y, 3.4, 0.8); } }
  }
  // 문장 (십자 + 방패)
  if (S.heraldry) {
    const p = _bxAt(M, 0.3); ctx.strokeStyle = trim[1]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p[0], p[1] - W * 0.6); ctx.lineTo(p[0], p[1] + W * 0.6); ctx.moveTo(p[0] - W * 0.5, p[1] - W * 0.1); ctx.lineTo(p[0] + W * 0.5, p[1] - W * 0.1); ctx.stroke();
    ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.5; ctx.stroke();
  }
  // 햇살 문양
  if (S.sunEtch) {
    const p = _bxAt(M, 0.3); ctx.strokeStyle = trim[1]; ctx.lineWidth = 0.7; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.moveTo(p[0] + Math.cos(a) * 1.9, p[1] + Math.sin(a) * 1.9); ctx.lineTo(p[0] + Math.cos(a) * (i % 2 ? 3.2 : 4.4), p[1] + Math.sin(a) * (i % 2 ? 3.2 : 4.4)); } ctx.stroke();
    circleOl(ctx, p[0], p[1], 1.4, trim[2], ol, 0.6);
  }
  // 흠집 · 이 빠진 자국 · 긁힌 선
  if (S.nicks) {
    const r = mulberry(S.nicks * 13 + 3);
    ctx.fillStyle = ol;
    for (let k = 0; k < S.nicks; k++) { const u = 0.22 + r() * 0.66, p = _bxAt(B, u), d = 1.1 + r() * 1.1; ctx.beginPath(); polyPath(ctx, [p[0] - d, p[1] + 0.8, p[0] + 0.3, p[1] - d * 1.5, p[0] + d, p[1] + 0.8]); ctx.fill(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let k = 0; k < 3; k++) { const p = _bxAt(M, 0.2 + r() * 0.55); ctx.moveTo(p[0], p[1] - W * 0.4); ctx.lineTo(p[0] + 4 + r() * 3, p[1] + W * 0.3); }
    ctx.stroke();
  }
  // 핏자국
  if (S.stain) {
    ctx.save(); _bxClip(ctx, G); ctx.fillStyle = 'rgba(110,18,22,0.55)';
    const r = mulberry(21);
    for (let k = 0; k < 6; k++) { const u = 0.4 + r() * 0.5, p = _bxAt(B, u); ctx.beginPath(); ctx.ellipse(p[0], p[1] - 1.2 - r() * 2, 1.6 + r() * 2.8, 0.9 + r() * 1.2, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // 얼음 서리 덮개
  if (S.frostCoat) {
    ctx.save(); _bxClip(ctx, G);
    const g = ctx.createLinearGradient(G.x0, 0, G.len, 0); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(0.45, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(G.x0, -W * 3, G.len, W * 6);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; const r = mulberry(7); for (let k = 0; k < 16; k++) { const p = _bxAt(M, 0.03 + r() * 0.5); ctx.fillRect(p[0], p[1] + (r() - 0.5) * W * 1.6, 0.9, 0.9); }
    ctx.restore();
  }
  // 독 방울
  if (S.bubbles) {
    ctx.save(); _bxClip(ctx, G); const r = mulberry(5);
    for (let k = 0; k < 9; k++) { const ph = (t * 0.01 + r()) % 1, p = _bxAt(M, 0.08 + r() * 0.8), rr = 0.8 + r() * 1.1; ctx.strokeStyle = `rgba(230,255,190,${0.8 * (1 - ph * 0.5)})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(p[0], p[1] + (r() - 0.5) * W * 1.2 - ph * 2, rr, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(p[0] - rr * 0.4, p[1] + (r() - 0.5) * W * 0 - ph * 2 - rr * 0.5, 0.6, 0.6); }
    ctx.restore();
  }
  // 사탕 아이싱 + 알록달록 스프링클
  if (S.icing) {
    ctx.save(); _bxClip(ctx, G);
    const r = mulberry(11), cs = ['#ff5a9a', '#5ad2ff', '#ffe05a', '#8aff7a', '#b48aff'];
    for (let k = 0; k < 14; k++) { const p = _bxAt(M, 0.12 + r() * 0.8); ctx.save(); ctx.translate(p[0], p[1] + (r() - 0.5) * W * 1.4); ctx.rotate(r() * 3); ctx.fillStyle = cs[k % 5]; ctx.fillRect(-1.3, -0.45, 2.6, 0.9); ctx.restore(); }
    ctx.restore();
    ctx.fillStyle = '#fffafc'; ctx.lineWidth = 1; ctx.strokeStyle = ol;
    for (let k = 0; k < 7; k++) { const p = _bxAt(T, 0.1 + k * 0.125), h = 1.6 + (k % 3) * 1.1; ctx.beginPath(); ctx.ellipse(p[0], p[1] + 0.2, 3.3, 2, 0, Math.PI, TAU); ctx.moveTo(p[0] - 2.4, p[1] + 0.2); ctx.quadraticCurveTo(p[0] - 1.8, p[1] + h + 1, p[0] - 0.9, p[1] + h + 1.4); ctx.quadraticCurveTo(p[0], p[1] + h + 0.8, p[0] + 0.2, p[1] + 0.4); ctx.fill(); }
  }
  // 화염 (등날에서 일렁이는 불꽃)
  if (S.flameLick) {
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) {
      const ph = (t * 0.045 + k * 0.37) % 1, u = 0.1 + k * 0.12, p = _bxAt(T, u), h = (6 + (k % 3) * 2.2) * (1 - ph * 0.5), sw = Math.sin(t * 0.13 + k * 1.9) * 1.8;
      ctx.fillStyle = `rgba(${glow},${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.moveTo(p[0] - 2.4, p[1] + 1); ctx.quadraticCurveTo(p[0] - 1.6 + sw, p[1] - h * 0.5, p[0] + 1.2 + sw * 1.8, p[1] - h); ctx.quadraticCurveTo(p[0] + 1.8, p[1] - h * 0.35, p[0] + 2.8, p[1] + 1); ctx.fill();
      ctx.fillStyle = `rgba(255,240,190,${0.55 * (1 - ph)})`; ctx.beginPath(); ctx.moveTo(p[0] - 1, p[1] + 1); ctx.quadraticCurveTo(p[0] + sw * 0.5, p[1] - h * 0.35, p[0] + 0.5 + sw, p[1] - h * 0.55); ctx.quadraticCurveTo(p[0] + 1.2, p[1] - h * 0.2, p[0] + 1.6, p[1] + 1); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // 날이 달아오른 선 / 색 선
  if (S.edgeGlow) {
    const e = S.edgeGlow; ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${e.col || glow},${(e.a ?? 0.7) * (0.8 + Math.sin(t * 0.1 + id) * 0.2)})`; ctx.lineWidth = e.w || 1.5; ctx.beginPath(); _bxLine(ctx, B, 0.04, 0.99, 30, -0.4); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.5; ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
  }
  // 낚싯대처럼 가는 별빛 (밤하늘 · 월광)
  if (S.stardust) {
    ctx.save(); _bxClip(ctx, G); ctx.globalCompositeOperation = 'lighter'; const r = mulberry(17);
    for (let k = 0; k < 14; k++) { const p = _bxAt(M, 0.05 + r() * 0.9), y = p[1] + (r() - 0.5) * W * 1.8, tw = 0.5 + 0.5 * Math.sin(t * 0.1 + k * 2.1); ctx.fillStyle = `rgba(255,246,210,${0.35 + tw * 0.6})`; ctx.fillRect(p[0], y, 0.7 + (k % 3 === 0 ? 0.5 : 0), 0.7 + (k % 3 === 0 ? 0.5 : 0)); }
    ctx.restore();
  }
  // 손잡이 양끝의 금속 테 (모든 검)
  if (!S.noFerrule) {
    for (const x of [-14.6, 6.2]) {
      ctx.fillStyle = ol; ctx.fillRect(x - 0.4, -3.3, 2.6, 6.6);
      ctx.fillStyle = trim[1]; ctx.fillRect(x, -2.9, 1.8, 5.8); ctx.fillStyle = trim[2]; ctx.fillRect(x, -2.9, 0.7, 5.8);
    }
  }
}
