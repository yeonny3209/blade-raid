'use strict';
// ============================================================
//  일반 몬스터 새 그림 : mobs.js 의 능력치 · 행동은 그대로 두고 생김새(draw · pal)만 갈아 끼운다
//   좌표 : 발밑 = (0,0), 앞 = +x, 위 = -y   /   재질 m = [어두운, 기본, 밝은]
// ============================================================
const MA = {
  ol: '#150d14',
  // 3톤 타원 : 어두운 바탕 → 위로 밀린 기본색 → 광택
  ball(ctx, x, y, rx, ry, m, rot = 0, w = 1.8, hl = 1) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
    if (w) { ctx.lineWidth = w * 2; ctx.strokeStyle = MA.ol; ctx.stroke(); }
    ctx.fillStyle = m[0]; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + rx * 0.05, y - ry * 0.13, rx * 0.9, ry * 0.83, rot, 0, TAU); ctx.fillStyle = m[1]; ctx.fill();
    if (hl) { ctx.beginPath(); ctx.ellipse(x + rx * 0.26, y - ry * 0.48, rx * 0.32 * hl, ry * 0.17 * hl, rot - 0.25, 0, TAU); ctx.fillStyle = m[2]; ctx.fill(); }
  },
  seg(ctx, x0, y0, x1, y1, r0, r1, m, w = 1.6) {
    const a = { x: x0, y: y0 }, b = { x: x1, y: y1 };
    ctx.fillStyle = MA.ol; ctx.beginPath(); capsulePath(ctx, a, b, r0 + w, r1 + w); ctx.fill();
    shadedSeg(ctx, a, b, r0, r1, m);
  },
  poly(ctx, pts, fill, w = 1.5) { olPoly(ctx, pts, fill, MA.ol, w); },
  smooth(ctx, pts, fill, w = 1.6, t = 0.9) { olSmooth(ctx, pts, fill, MA.ol, w, t); },
  fill(ctx, pts, fill) { ctx.fillStyle = fill; ctx.beginPath(); polyPath(ctx, pts); ctx.fill(); },
  sfill(ctx, pts, fill, t = 0.9) { ctx.fillStyle = fill; ctx.beginPath(); smoothPoly(ctx, pts, t); ctx.fill(); },
  line(ctx, pts, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); },
  oline(ctx, pts, col, w, ow = 1.4) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; MA.line(ctx, pts, MA.ol, w + ow * 2); MA.line(ctx, pts, col, w); },
  dot(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); },
  // 눈 : 흰자 + 홍채 + 동공 + 반짝임. slant > 0 이면 화난 눈매 (눈꺼풀이 앞쪽으로 내려온다)
  eye(ctx, x, y, r, iris, o = {}) {
    const ry = r * (o.ry ?? 1) * (o.blink ? 0.12 : 1);
    ctx.beginPath(); ctx.ellipse(x, y, r + 1.1, ry + 1.1, 0, 0, TAU); ctx.fillStyle = MA.ol; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, TAU); ctx.fillStyle = o.white || '#fbf6ee'; ctx.fill();
    if (!o.blink) {
      const ix = x + r * (o.look ?? 0.22);
      ctx.beginPath(); ctx.ellipse(ix, y + r * 0.05, r * 0.62, Math.min(ry, r * 0.72), 0, 0, TAU); ctx.fillStyle = iris; ctx.fill();
      ctx.beginPath(); ctx.ellipse(ix + r * 0.06, y + r * 0.05, r * (o.slit ? 0.14 : 0.3), r * (o.slit ? 0.6 : 0.34), 0, 0, TAU); ctx.fillStyle = '#12060a'; ctx.fill();
      MA.dot(ctx, ix - r * 0.26, y - r * 0.3, r * 0.2, '#ffffff');
      if (o.slant) { ctx.fillStyle = o.lid || MA.ol; ctx.beginPath(); polyPath(ctx, [x - r - 1.6, y - ry - 1.8, x + r + 1.6, y - ry - 1.8, x + r + 1.6, y - ry + r * 0.95 * o.slant, x - r - 1.6, y - ry + r * 0.2 * o.slant]); ctx.fill(); }
    }
  },
  fangs(ctx, x, y, n, dx, len, col = '#fffbf0') { ctx.fillStyle = col; for (let i = 0; i < n; i++) { ctx.beginPath(); polyPath(ctx, [x + i * dx, y, x + i * dx + dx * 0.5, y + len, x + i * dx + dx, y]); ctx.fill(); } },
  glow(ctx, x, y, r, col, a = 1, sx = 1, s2 = 1) { const g = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, r, col, a, sx, s2); ctx.globalCompositeOperation = g; },
  blink: k => (k.t % 170) < 6,
  setArt(id, pal, draw) { const M = MOBS[id]; if (!M) return; if (pal) M.pal = Object.assign({}, M.pal, pal); M.draw = draw; },
};

// ---------- 늑대 ----------
MA.setArt('wolf', { fur: ['#2b2a36', '#5d5d70', '#a3a3b8'], belly: ['#6a6a7c', '#a9a9ba', '#dcdce8'], dark: ['#15141c', '#2b2a36', '#4a4a5c'] }, (ctx, m, P, k) => {
  const F = P.fur, D = P.dark, walk = k.a === 'walk' ? k.at * 0.36 : 0, mv = k.a === 'walk' ? 1 : 0, lunge = k.act === 'lunge' && k.af > 14 ? 1 : 0, crouch = k.act === 'lunge' && k.af <= 14 ? k.af / 14 : 0;
  const br = Math.sin(k.t * 0.09) * 0.8, by = -43 + crouch * 5 + br * 0.4;
  const leg = (x, top, ph, far, hind) => {
    const s = mv ? Math.sin(walk + ph) : 0, lift = mv ? Math.max(0, Math.cos(walk + ph)) * 5 : 0, st = lunge ? (hind ? -16 : 16) : s * 11;
    const kx = x + (hind ? -5 : 3) + st * 0.45, ky = top + 17, fx = x + st, fy = -3 - lift - (lunge ? 4 : 0), M2 = far ? D : F;
    MA.seg(ctx, x, top, kx, ky, hind ? 8 : 6.5, 5, M2, 1.5);
    MA.seg(ctx, kx, ky, fx, fy, 4.6, 3.8, M2, 1.5);
    MA.ball(ctx, fx + 3, fy + 1.5, 6.5, 3.6, M2, 0, 1.4, 0);
  };
  leg(-24, by + 6, 1.6, true, true); leg(22, by + 8, 0, true, false);
  // 꼬리
  const tw = Math.sin(k.t * 0.12) * 5 + (lunge ? -10 : 0);
  MA.smooth(ctx, [-34, by - 6, -52, by - 16 + tw * 0.3, -70, by - 22 + tw, -74, by - 12 + tw, -58, by - 2 + tw * 0.4, -36, by + 6], F[0], 1.6);
  MA.sfill(ctx, [-56, by - 14 + tw * 0.5, -70, by - 21 + tw, -73, by - 13 + tw, -62, by - 8 + tw * 0.6], F[2]);
  // 몸통 : 가슴이 깊고 허리가 잘록하다
  ctx.save(); ctx.translate(0, by); ctx.rotate(lunge * -0.12 + crouch * 0.06);
  MA.smooth(ctx, [-40, -2, -34, -15, -10, -18, 18, -20, 36, -14, 42, 2, 34, 17, 12, 19, -12, 12, -32, 13], F[1], 1.8);
  MA.sfill(ctx, [-38, 2, -12, 2, 14, 8, 36, 6, 34, 17, 12, 19, -12, 12, -32, 13], F[0]);
  MA.sfill(ctx, [8, 10, 34, 8, 36, 16, 14, 18], P.belly[1]);
  MA.fill(ctx, [-30, -15, -24, -22, -20, -16, -12, -23, -8, -17, 0, -24, 4, -18, 12, -25, 16, -19, 24, -24, 28, -17], F[1]);          // 등 갈기
  MA.line(ctx, [-30, -15, -24, -22, -20, -16, -12, -23, -8, -17, 0, -24, 4, -18, 12, -25, 16, -19, 24, -24, 28, -17], MA.ol, 1.4);
  MA.fill(ctx, [-20, -13, -4, -16, 10, -15, -4, -11], F[2]);
  ctx.restore();
  leg(-16, by + 6, 0.3, false, true); leg(28, by + 8, 2.1, false, false);
  // 머리
  ctx.save(); ctx.translate(36, by - 12); ctx.rotate(lunge * 0.22 - crouch * 0.15 + br * 0.01);
  MA.poly(ctx, [-4, -8, 0, -27, 9, -10], D[1], 1.3); MA.poly(ctx, [5, -10, 12, -29, 17, -9], F[1], 1.3); MA.fill(ctx, [8, -11, 12, -23, 14, -11], '#c88a94');     // 귀
  MA.smooth(ctx, [-14, -4, -8, -13, 8, -14, 20, -8, 37, -4, 39, 3, 30, 7 + lunge * 2, 14, 9, -6, 12, -14, 6], F[1], 1.7, 0.75);
  MA.sfill(ctx, [-12, 4, 6, 4, 22, 5, 30, 7, 14, 9, -6, 12], F[0], 0.7);
  MA.sfill(ctx, [14, -1, 34, -1, 37, 3, 30, 6, 16, 5], P.belly[1], 0.7);                                                     // 주둥이
  MA.dot(ctx, 37.5, -1.5, 2.6, '#16101a');
  if (lunge || crouch > 0.5) { MA.poly(ctx, [12, 6, 32, 6, 28, 16 + lunge * 4, 12, 13], '#5a0f1c', 1.2); MA.fangs(ctx, 14, 6, 4, 4.2, 4.4); MA.fill(ctx, [26, 6, 28.5, 12, 31, 6], '#fffbf0'); }
  else MA.fill(ctx, [26, 5.5, 28, 9.5, 30, 5.5], '#fffbf0');
  MA.eye(ctx, 9, -5, 3.9, '#ffb81e', { slant: 1, lid: F[0], blink: MA.blink(k), slit: 1 });
  MA.fill(ctx, [-12, 8, -18, 12, -11, 13, -15, 18, -6, 13], F[1]);                                                           // 볼 털
  ctx.restore();
});

// ---------- 포자 버섯 ----------
MA.setArt('mushroom', { cap: ['#6a1226', '#c8283c', '#ff8a96'], stem: ['#b9a886', '#eadfc4', '#fff6e4'], gill: ['#7a5a4a', '#c79a7e', '#e8c4a8'] }, (ctx, m, P, k) => {
  const hop = k.a === 'walk' ? Math.abs(Math.sin(k.at * 0.25)) * 8 : 0, puff = k.act === 'spore' ? Math.min(1, k.af / 30) : 0, br = Math.sin(k.t * 0.1);
  for (const s of [-1, 1]) MA.ball(ctx, s * 9 + (hop ? s * 2 : 0), -3, 8, 4.4, P.stem, 0, 1.4, 0);                           // 발
  ctx.translate(0, -hop);
  MA.smooth(ctx, [-11, -4, -13, -22, -10, -38, 10, -38, 13, -22, 11, -4, 0, -1], P.stem[1], 1.7);
  MA.sfill(ctx, [-11, -4, -13, -22, -10, -38, -4, -38, -5, -20, -3, -3], P.stem[0]);
  // 얼굴
  MA.eye(ctx, -3, -22, 3.4, '#3a2a10', { slant: 0.9, lid: P.stem[0], blink: MA.blink(k) }); MA.eye(ctx, 7, -22, 3.4, '#3a2a10', { slant: 0.9, lid: P.stem[0], blink: MA.blink(k) });
  if (puff > 0.2) { MA.ball(ctx, 2, -12, 4 + puff * 2, 3 + puff * 3, ['#2a0a10', '#4a1018', '#4a1018'], 0, 1, 0); } else MA.line(ctx, [-3, -12, 2, -10.5, 7, -12], MA.ol, 1.5);
  // 갓 : 아래 주름 + 위 점박이
  const cw = 34 + puff * 8, ch = 22 - puff * 4, cy = -40 - br * 0.6;
  MA.ball(ctx, 0, cy + 4, cw * 0.86, 7, P.gill, 0, 1.6, 0);
  ctx.strokeStyle = P.gill[0]; ctx.lineWidth = 1; ctx.beginPath(); for (let i = -5; i <= 5; i++) { ctx.moveTo(i * 2.2, cy + 2); ctx.lineTo(i * cw * 0.15, cy + 9.5); } ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, cy, cw, ch, 0, Math.PI, 0); ctx.quadraticCurveTo(cw * 0.5, cy + 9, 0, cy + 5); ctx.quadraticCurveTo(-cw * 0.5, cy + 9, -cw, cy); ctx.closePath();
  ctx.lineWidth = 3.6; ctx.strokeStyle = MA.ol; ctx.stroke(); ctx.fillStyle = P.cap[1]; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = P.cap[0]; ctx.beginPath(); ctx.ellipse(-6, cy + 10, cw * 1.05, ch * 0.75, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = P.cap[1]; ctx.beginPath(); ctx.ellipse(2, cy - 3, cw * 0.98, ch * 0.92, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = P.stem[2]; for (const [x, y, r] of [[-17, -8, 5.5], [5, -14, 6.5], [22, -5, 4.6], [-4, -3, 3], [-28, -1, 3.2]]) { ctx.beginPath(); ctx.ellipse(x * cw / 34, cy + y, r, r * 0.8, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(12, cy - 13, 12, 3.4, -0.2, 0, TAU); ctx.fill();
  ctx.restore();
  if (puff > 0.6) MA.glow(ctx, 0, -40, 50, '200,230,110', 0.5);
});

// ---------- 해골 궁수 ----------
MA.setArt('skeleton', { bone: ['#8d8372', '#ddd5c4', '#fffaf0'], bow: ['#3a2a14', '#70502a', '#b08a4c'], rag: ['#2a1420', '#5a2a3a', '#8a4a58'] }, (ctx, m, P, k) => {
  const B = P.bone, walk = k.a === 'walk' ? Math.sin(k.at * 0.2) : 0, draw = k.act === 'shoot' ? Math.min(1, k.af / 26) : 0, br = Math.sin(k.t * 0.07);
  const bone = (x0, y0, x1, y1, r, m2 = B) => { MA.seg(ctx, x0, y0, x1, y1, r, r * 0.8, m2, 1.3); MA.ball(ctx, x1, y1, r + 1.2, r + 1.2, m2, 0, 1.2, 0); };
  // 뒷다리 · 앞다리
  bone(-4, -58, -7 - walk * 10, -30, 3, [B[0], B[0], B[1]]); bone(-7 - walk * 10, -30, -5 - walk * 13, -3, 2.6, [B[0], B[0], B[1]]); MA.ball(ctx, -1 - walk * 13, -2, 6, 2.6, [B[0], B[0], B[1]], 0, 1.2, 0);
  // 망토 조각
  MA.poly(ctx, [-9, -98, -17, -62 + br, -12, -48, -18, -40 - br, -6, -52, -3, -96], P.rag[0], 1.3);
  // 골반 · 척추 · 갈비
  MA.ball(ctx, 0, -60, 9, 5.5, B, 0, 1.4, 0);
  MA.seg(ctx, 0, -62, 1, -96, 2.6, 2.6, B, 1.2);
  for (let i = 0; i < 4; i++) { const y = -92 + i * 7.2, w = 10.5 - i * 1.3; ctx.lineCap = 'round'; MA.oline(ctx, [-w * 0.6, y, 2, y - 1.6, w, y + 1.4, w - 2, y + 3.6], B[1], 2.2, 1.1); }
  bone(4, -58, 7 + walk * 10, -30, 3); bone(7 + walk * 10, -30, 6 + walk * 13, -3, 2.6); MA.ball(ctx, 10 + walk * 13, -2, 6.5, 2.8, B, 0, 1.2, 0);
  // 화살통
  MA.poly(ctx, [-12, -100, -5, -98, -9, -74, -15, -76], P.bow[0], 1.2); for (const o of [0, 2.4]) MA.line(ctx, [-11 + o, -100, -13 + o, -110], P.bow[2], 1.2);
  // 머리 : 두개골 + 턱
  ctx.save(); ctx.translate(2, -112 + br * 0.5); ctx.rotate(-0.06 + draw * 0.08);
  MA.poly(ctx, [-4, 8, 9, 8, 10, 15, 3, 17, -3, 14], B[0], 1.3); MA.fill(ctx, [0, 9, 9, 9, 9, 11, 0, 11], '#1a0f14'); MA.fangs(ctx, 0.5, 9, 4, 2.2, 2.4, B[2]);          // 턱 + 이
  MA.smooth(ctx, [-12, -2, -10, -11, 0, -15, 11, -11, 14, -2, 12, 6, 4, 9, -6, 8], B[1], 1.6);
  MA.sfill(ctx, [-12, -2, -10, -11, -3, -14, -5, -2, -6, 8], B[0]);
  MA.sfill(ctx, [0, -13, 9, -10, 11, -5, 3, -8], B[2]);
  ctx.fillStyle = '#12080e'; ctx.beginPath(); ctx.ellipse(-1.5, -1, 3.2, 4, 0.15, 0, TAU); ctx.ellipse(7.5, -1, 3.4, 4.2, -0.15, 0, TAU); ctx.fill();
  MA.fill(ctx, [3, 3, 4.6, 6.4, 1.6, 6.4], '#12080e');
  MA.glow(ctx, 7.5, -1, 9, '120,255,200', 0.9); MA.dot(ctx, 7.8, -0.8, 1.2, '#c8ffe8'); MA.dot(ctx, -1.2, -0.8, 1, '#8affd0');
  MA.line(ctx, [-6, -11, -3, -7, -5, -4], B[0], 0.9);                                                                         // 금
  ctx.restore();
  // 팔 + 활
  const hx = 22, hy = -86;
  bone(1, -94, 12, -84, 2.4); bone(12, -84, hx, hy, 2.2);
  ctx.save(); ctx.translate(hx, hy);
  ctx.lineCap = 'round'; ctx.strokeStyle = MA.ol; ctx.lineWidth = 6.6; ctx.beginPath(); ctx.arc(-6, 0, 31, -1.22, 1.22); ctx.stroke();
  ctx.strokeStyle = P.bow[1]; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = P.bow[2]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-6, 0, 32, -1.1, -0.2); ctx.stroke();
  MA.fill(ctx, [22, -5, 27, -5, 27, 5, 22, 5], P.bow[0]);
  ctx.strokeStyle = '#f0e8d8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4.6, -29); ctx.lineTo(-6 - draw * 16, 0); ctx.lineTo(4.6, 29); ctx.stroke();
  if (draw > 0) { MA.oline(ctx, [-6 - draw * 16, 0, 30, 0], '#c8b890', 1.8, 0.9); MA.poly(ctx, [30, -3.4, 38, 0, 30, 3.4], '#cfd6e0', 1); MA.fill(ctx, [-8 - draw * 16, -3, -2 - draw * 16, 0, -8 - draw * 16, 3], '#c84a4a'); }
  ctx.restore();
  if (draw > 0) { bone(1, -92, -6, -82, 2.2); bone(-6, -82, hx - 6 - draw * 16, hy, 2); }
});

// ---------- 석상 가고일 ----------
MA.setArt('gargoyle', { stone: ['#35353f', '#6c6c78', '#a9a9b6'], wing: ['#26262e', '#4a4a56', '#7c7c8a'] }, (ctx, m, P, k) => {
  const S = P.stone, Wg = P.wing, fl = Math.sin(k.t * 0.3), h = k.act === 'dive' ? (m.hov ?? 120) : 120 + Math.sin(k.t * 0.05) * 8;
  ctx.translate(0, -h);
  const wing = (s, col) => {
    const tipY = -66 - fl * 18 * s, kx = -42, ky = -58 - fl * 10 * s;
    MA.poly(ctx, [-2, -32, kx, ky, -78, tipY + 6, -66, -30 - fl * 4 * s, -58, -18, -46, -26, -40, -10, -28, -20, -18, -6], col[1], 1.6);
    MA.fill(ctx, [-2, -32, kx, ky, -78, tipY + 6, -60, tipY + 12, kx + 2, ky + 8, -6, -24], col[0]);
    ctx.strokeStyle = col[0]; ctx.lineWidth = 1.3; ctx.beginPath(); for (const [x, y] of [[-58, -18], [-40, -10], [-18, -6]]) { ctx.moveTo(kx, ky); ctx.lineTo(x, y); } ctx.stroke();
    MA.poly(ctx, [kx - 2, ky - 2, kx - 4, ky - 14, kx + 5, ky - 3], S[2], 1);
  };
  wing(-1, [Wg[0], Wg[0], Wg[1]]);
  // 꼬리
  ctx.lineCap = 'round'; MA.oline(ctx, [-8, -4, -26, 8, -34, 0 + fl * 3, -44, 6 + fl * 4], S[0], 4); MA.poly(ctx, [-44, 0 + fl * 4, -56, 8 + fl * 4, -44, 12 + fl * 4], S[1], 1.1);
  // 다리
  for (const s of [-1, 1]) { MA.seg(ctx, s * 7, -2, s * 10 + 4, 14, 6, 4.4, s < 0 ? [S[0], S[0], S[1]] : S, 1.4); MA.fangs(ctx, s * 10 + 1, 17, 3, 3.4, 5, S[2]); }
  // 몸통
  MA.smooth(ctx, [-16, -34, -2, -44, 16, -38, 22, -18, 16, 2, 0, 8, -14, 2, -20, -16], S[1], 1.8);
  MA.sfill(ctx, [-16, -34, -8, -40, -6, -14, -4, 6, -14, 2, -20, -16], S[0]);
  MA.sfill(ctx, [4, -36, 15, -32, 18, -18, 8, -24], S[2]);
  MA.line(ctx, [2, -26, 8, -18, 4, -12, 10, -4], S[0], 1.1); MA.line(ctx, [-6, -6, 0, -2], S[0], 1.1);                       // 갈라진 금
  wing(1, Wg);
  // 팔 (앞으로 웅크린 발톱)
  MA.seg(ctx, 12, -32, 26, -22, 6, 5, S, 1.4); MA.seg(ctx, 26, -22, 30, -8, 5, 4, S, 1.4); MA.fangs(ctx, 26, -5, 3, 3.2, 5.5, S[2]);
  // 머리
  ctx.save(); ctx.translate(12, -52); ctx.rotate(0.12);
  MA.poly(ctx, [-8, -6, -16, -22, -2, -10], S[2], 1.2); MA.poly(ctx, [2, -9, 2, -27, 10, -8], S[2], 1.2);                    // 뿔
  MA.smooth(ctx, [-12, -4, -6, -12, 8, -12, 17, -4, 20, 4, 12, 10, -2, 11, -11, 6], S[1], 1.6, 0.8);
  MA.sfill(ctx, [-12, -4, -6, -11, -2, 0, -2, 11, -11, 6], S[0], 0.8);
  MA.poly(ctx, [-9, 0, -18, -4, -12, 6], S[1], 1.1);                                                                          // 귀
  MA.poly(ctx, [6, 6, 20, 5, 17, 11, 8, 11], '#2a1016', 1); MA.fangs(ctx, 8, 6, 3, 3.6, 3.6);
  MA.fill(ctx, [3, -6, 15, -4, 14, 1, 4, 0], '#12080c'); MA.glow(ctx, 9.5, -2.5, 12, '255,80,40', 0.95); MA.fill(ctx, [5, -4.6, 13.5, -3.2, 13, -0.4, 5.6, -1.2], '#ff7a3a');
  ctx.restore();
});

// ---------- 슬라임 ----------
const slimeArt = small => (ctx, m, P, k) => {
  const G = P.gel, sc = small ? 0.6 : 1, sq = k.act === 'hop' ? (k.af < 14 ? k.af / 14 * 0.3 : -0.2) : Math.sin(k.t * 0.15) * 0.06;
  ctx.scale(sc * (1 + sq), sc * (1 - sq));
  const wob = Math.sin(k.t * 0.11) * 2;
  ctx.beginPath(); ctx.moveTo(-40, -6); ctx.bezierCurveTo(-46, -34, -22 + wob, -66, 2, -64); ctx.bezierCurveTo(26 - wob, -62, 46, -34, 40, -6); ctx.bezierCurveTo(36, 3, -36, 3, -40, -6); ctx.closePath();
  ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = MA.ol; ctx.stroke();
  const g = ctx.createLinearGradient(0, -64, 0, 2); g.addColorStop(0, G[2]); g.addColorStop(0.35, G[1]); g.addColorStop(1, G[0]); ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.ellipse(4, -22, 30, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = G[0]; ctx.globalAlpha *= 0.45; ctx.beginPath(); ctx.ellipse(-6, -26, 13, 11, 0, 0, TAU); ctx.fill(); ctx.globalAlpha /= 0.45;       // 속에 비치는 핵
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (const [x, y, r] of [[-22, -18, 3], [20, -14, 2.2], [-12, -42, 1.8], [26, -30, 1.5]]) { ctx.beginPath(); ctx.arc(x, y - ((k.t * 0.2 + x) % 6), r, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-16, -47, 11, 5.5, -0.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-26, -36, 2.4, 0, TAU); ctx.fill();
  const bl = MA.blink(k);
  MA.eye(ctx, 6, -31, 5.4, '#123a5a', { blink: bl, look: 0.25 }); MA.eye(ctx, 23, -31, 5.4, '#123a5a', { blink: bl, look: 0.25 });
  if (k.act === 'hop') MA.ball(ctx, 15, -19, 5, 4, ['#0a2238', '#123a5a', '#123a5a'], 0, 1, 0); else { ctx.lineCap = 'round'; ctx.strokeStyle = '#0a2238'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(15, -22, 4.4, 0.3, Math.PI - 0.3); ctx.stroke(); }
  MA.ball(ctx, -34, -1, 5, 2.6, [G[0], G[1], G[2]], 0, 1.2, 0); MA.ball(ctx, 37, 0, 4, 2.2, [G[0], G[1], G[2]], 0, 1.2, 0);                           // 흘러내린 방울
};
MA.setArt('slime', { gel: ['#145c94', '#3fa6ea', '#bfeeff'] }, slimeArt(false));
MA.setArt('slimelet', { gel: ['#145c94', '#3fa6ea', '#bfeeff'] }, slimeArt(true));

// ---------- 설산 예티 ----------
MA.setArt('yeti', { fur: ['#9fb0c4', '#e6eef8', '#ffffff'], skin: ['#27365a', '#4a6aa0', '#8eb4e6'], horn: ['#6a5a48', '#c8b89a', '#f4ead4'] }, (ctx, m, P, k) => {
  const F = P.fur, Sk = P.skin, walk = k.a === 'walk' ? Math.sin(k.at * 0.12) : 0, br = Math.sin(k.t * 0.06);
  let armY = -66; if (k.act === 'pound') armY = k.af < 30 ? -170 : -10; if (k.act === 'snowball') armY = k.af < 26 ? -180 : -90;
  const tuft = (pts) => { MA.fill(ctx, pts, F[1]); MA.line(ctx, pts, MA.ol, 1.4); };
  // 뒷팔
  MA.seg(ctx, -22, -122, -40, -80 + walk * 6, 15, 13, [F[0], F[0], F[1]], 1.8); MA.seg(ctx, -40, -80 + walk * 6, -34, -44 + walk * 8, 13, 14, [F[0], F[0], F[1]], 1.8); MA.ball(ctx, -33, -38 + walk * 8, 13, 11, Sk, 0, 1.6, 0);
  // 다리
  MA.seg(ctx, -17, -60, -20 - walk * 11, -6, 17, 13, [F[0], F[0], F[1]], 1.8); MA.ball(ctx, -15 - walk * 11, -5, 17, 7, Sk, 0, 1.6, 0);
  MA.seg(ctx, 17, -60, 20 + walk * 11, -6, 17, 13, F, 1.8); MA.ball(ctx, 26 + walk * 11, -5, 18, 7.5, Sk, 0, 1.6, 0);
  // 몸통
  MA.smooth(ctx, [-44, -70, -48, -112, -34, -146, 0, -158, 34, -148, 50, -112 - br, 46, -70, 24, -50, -22, -50], F[1], 2.1);
  MA.sfill(ctx, [-44, -70, -48, -112, -34, -146, -14, -152, -22, -110, -16, -52, -22, -50], F[0]);
  MA.sfill(ctx, [6, -104, 36, -108 - br, 40, -78, 22, -60, 2, -66], P.skin[0], 0.9); MA.sfill(ctx, [9, -101, 33, -105 - br, 37, -80, 21, -64, 6, -69], Sk[1], 0.9);          // 가슴
  MA.line(ctx, [21, -102, 21, -68], Sk[0], 1.6); MA.line(ctx, [9, -86, 34, -88], Sk[0], 1.2);
  tuft([-46, -84, -54, -76, -44, -74, -50, -64, -40, -66]); tuft([44, -74, 52, -66, 42, -64, 46, -54, 36, -58]);
  tuft([-30, -148, -36, -160, -22, -154, -22, -168, -10, -156]);
  // 머리
  ctx.save(); ctx.translate(18, -150 + br);
  MA.poly(ctx, [-12, -14, -24, -34, -4, -20], P.horn[1], 1.4); MA.poly(ctx, [8, -18, 14, -38, 20, -14], P.horn[1], 1.4); MA.fill(ctx, [11, -19, 14, -32, 16, -17], P.horn[2]);
  MA.ball(ctx, 0, 0, 24, 21, F, 0, 1.9, 0.9);
  MA.smooth(ctx, [-2, -8, 12, -12, 24, -6, 26, 6, 18, 14, 2, 14, -4, 4], Sk[1], 1.4, 0.85); MA.sfill(ctx, [-2, 4, 10, 6, 22, 8, 18, 14, 2, 14], Sk[0], 0.85);
  const bl = MA.blink(k); MA.eye(ctx, 6, -2, 3.6, '#ffd24a', { slant: 1, lid: Sk[0], blink: bl }); MA.eye(ctx, 18, -3, 3.6, '#ffd24a', { slant: 1, lid: Sk[0], blink: bl });
  MA.poly(ctx, [2, 6, 22, 5, 20, 12, 4, 12], '#1c0e1c', 1.1); MA.fangs(ctx, 4, 6, 4, 4.2, 3); MA.fill(ctx, [4, 12, 6.5, 6.5, 9, 12], '#fffbf0'); MA.fill(ctx, [15, 12, 17.5, 6, 20, 12], '#fffbf0');
  tuft([-22, 6, -30, 14, -20, 14, -24, 24, -12, 16]);
  ctx.restore();
  // 앞팔
  MA.seg(ctx, 30, -124, 46, (armY - 124) / 2 - 8, 16, 14, F, 1.8); MA.seg(ctx, 46, (armY - 124) / 2 - 8, 52, armY, 14, 17, F, 1.8);
  MA.ball(ctx, 53, armY + 4, 17, 15, Sk, 0, 1.7, 0.8); MA.line(ctx, [46, armY + 8, 48, armY + 16], Sk[0], 1.4); MA.line(ctx, [54, armY + 9, 55, armY + 18], Sk[0], 1.4);
  if (k.act === 'snowball' && k.af < 30) { MA.ball(ctx, 52, armY - 26, 23, 23, ['#b8cce0', '#f4f8ff', '#ffffff'], 0, 1.7); MA.dot(ctx, 44, armY - 20, 3, '#c8d8ea'); MA.dot(ctx, 60, armY - 36, 2.4, '#c8d8ea'); }
});

// ---------- 동굴 박쥐 ----------
MA.setArt('bat', { wing: ['#1c0b18', '#40203a', '#7a4a6a'], fur: ['#2a1422', '#5a3048', '#9a6a88'] }, (ctx, m, P, k) => {
  const fl = Math.sin(k.t * 0.6), h = 120 + Math.sin(k.t * 0.09 + m.id) * 20 - (k.act === 'swoop' && k.af > 12 && k.af < 26 ? 80 : 0);
  ctx.translate(0, -h);
  const wing = (s, col) => {
    const ty = -24 - fl * 18 * s;
    MA.poly(ctx, [0, -10, -18, -22 - fl * 6 * s, -46, ty, -40, -8 - fl * 4 * s, -32, 0, -24, -8, -16, 2, -8, -4], col[1], 1.3);
    MA.fill(ctx, [0, -10, -18, -22 - fl * 6 * s, -46, ty, -36, ty + 8, -18, -16 - fl * 5 * s, -2, -6], col[0]);
    ctx.strokeStyle = col[0]; ctx.lineWidth = 1; ctx.beginPath(); for (const [x, y] of [[-32, 0], [-16, 2]]) { ctx.moveTo(-18, -22 - fl * 6 * s); ctx.lineTo(x, y); } ctx.stroke();
  };
  wing(-1, [P.wing[0], P.wing[0], P.wing[1]]);
  MA.ball(ctx, 0, -6, 11, 13, P.fur, 0, 1.5, 0.8);
  wing(1, P.wing);
  MA.poly(ctx, [-6, -16, -10, -32, 0, -18], P.fur[1], 1.2); MA.poly(ctx, [2, -18, 6, -34, 10, -16], P.fur[1], 1.2); MA.fill(ctx, [4, -19, 6, -29, 8, -18], '#c87a94');
  MA.eye(ctx, 5, -10, 3, '#ff3040', { slant: 1, lid: P.fur[0] }); MA.glow(ctx, 5.5, -10, 7, '255,40,60', 0.6);
  MA.poly(ctx, [1, -3, 11, -4, 9, 3, 2, 3], '#2a0a12', 1); MA.fangs(ctx, 2.6, -3.4, 2, 3.4, 4.4);
  for (const s of [-1, 1]) MA.line(ctx, [s * 4, 6, s * 5, 11], P.fur[0], 1.6);
});

// ---------- 굴착 두더지 ----------
MA.setArt('mole', { fur: ['#392818', '#6c4c2c', '#a88054'], claw: ['#c8c0a8', '#eee6d4', '#ffffff'], hat: ['#8a6410', '#e8b020', '#ffe488'] }, (ctx, m, P, k) => {
  const u = m.under || 0, F = P.fur, br = Math.sin(k.t * 0.1);
  if (u > 0) {
    MA.ball(ctx, 0, -3, 34, 9, ['#22160c', '#3e2a18', '#5a4028'], 0, 1.4, 0);
    for (const [x, y, r] of [[-20, -8, 5], [14, -9, 6], [-2, -11, 7]]) MA.ball(ctx, x, y, r, r * 0.8, ['#2a1c10', '#4a3420', '#6a4e30'], 0, 1.2, 0);
    if (u >= 1) return;
  }
  ctx.translate(0, u * 70);
  for (let i = 0; i < 3; i++) MA.poly(ctx, [-20 + i * 5, -6, -34 + i * 4, 2 + i * 2, -18 + i * 5, -1], P.claw[0], 1);                            // 뒷발톱
  MA.smooth(ctx, [-36, -24, -30, -52, -6, -66, 22, -60, 38, -42, 36, -20, 20, -4, -22, -4], F[1], 1.9);
  MA.sfill(ctx, [-36, -24, -30, -52, -12, -64, -18, -30, -10, -5, -22, -4], F[0]);
  MA.sfill(ctx, [-4, -26, 22, -30, 30, -14, 18, -5, -6, -6], ['#c9a882'][0], 0.9);                                                            // 배
  // 얼굴 : 길쭉한 분홍 코 + 수염 + 작은 눈
  MA.smooth(ctx, [22, -52, 40, -50, 52, -40, 50, -32, 36, -30, 24, -36], F[1], 1.5, 0.8);
  MA.ball(ctx, 51, -38, 7, 6, ['#b8607a', '#f09ab0', '#ffd0dc'], 0, 1.3, 0.9);
  ctx.strokeStyle = MA.ol; ctx.lineWidth = 0.9; ctx.beginPath(); for (const a of [-0.3, 0.1, 0.5]) { ctx.moveTo(42, -36); ctx.lineTo(42 + Math.cos(a) * 15, -33 + Math.sin(a) * 15 + br); } ctx.stroke();
  MA.eye(ctx, 30, -46, 2.6, '#1a1008', { slant: 0.8, lid: F[0], blink: MA.blink(k) });
  MA.fill(ctx, [38, -31, 41, -25, 44, -31], '#fffbf0');
  // 광부 헬멧 + 등불
  MA.smooth(ctx, [2, -58, 8, -74, 26, -76, 36, -62, 30, -56, 10, -54], P.hat[1], 1.5, 0.8); MA.sfill(ctx, [12, -70, 24, -72, 30, -64, 16, -64], P.hat[2], 0.8);
  MA.poly(ctx, [26, -60, 42, -58, 40, -53, 26, -54], P.hat[0], 1.1); MA.ball(ctx, 31, -68, 4.4, 4.4, ['#b89a30', '#fff4b0', '#ffffff'], 0, 1.1, 0); MA.glow(ctx, 33, -68, 16, '255,230,140', 0.55);
  // 앞발 삽 발톱
  MA.ball(ctx, 24, -14, 9, 7, F, 0, 1.4, 0);
  for (let i = 0; i < 3; i++) MA.poly(ctx, [24 + i * 2, -18 + i * 5, 46 + i * 1.5, -12 + i * 6 + br, 26 + i * 2, -9 + i * 5], P.claw[1], 1.1);
});

// ---------- 사막 전갈 ----------
MA.setArt('scorpion', { shell: ['#5c2f0e', '#b06c26', '#f0b662'], dark: ['#2e1606', '#5c2f0e', '#8a4c18'] }, (ctx, m, P, k) => {
  const S = P.shell, D = P.dark, walk = k.a === 'walk' ? k.at * 0.4 : 0;
  let tail = Math.sin(k.t * 0.08) * 0.1; if (k.act === 'sting') tail = k.af < 22 ? -0.4 : 1.1;
  const legs = (far) => { for (let i = 0; i < 4; i++) { const x = -22 + i * 13, s = Math.sin(walk + i * 1.4 + (far ? 1.5 : 0)) * 6, c = far ? D : S; ctx.lineCap = 'round'; MA.oline(ctx, [x, -20, x - 9 + s * 0.6 + (far ? 4 : 0), -30, x - 14 + s + (far ? 6 : 0), -1], c[far ? 1 : 0], 2.6, 1.1); } };
  legs(true);
  // 꼬리 : 마디마다 굵기가 줄어든다
  ctx.save(); ctx.translate(-28, -30); ctx.rotate(tail);
  const seg = [[0, 0], [-15, -22], [-10, -46], [10, -62], [32, -60]];
  for (let i = 0; i < seg.length - 1; i++) { const r = 9.5 - i * 1.5; MA.ball(ctx, (seg[i][0] + seg[i + 1][0]) / 2, (seg[i][1] + seg[i + 1][1]) / 2, 13, r, S, Math.atan2(seg[i + 1][1] - seg[i][1], seg[i + 1][0] - seg[i][0]), 1.5, 0.8); }
  MA.ball(ctx, 36, -60, 8, 7, S, 0, 1.4, 0.8);
  MA.poly(ctx, [40, -66, 56, -52, 50, -46, 40, -56], '#2a1206', 1.2); MA.fill(ctx, [42, -62, 53, -52, 51, -50], '#7a4018');
  MA.glow(ctx, 54, -50, 15, '160,255,90', 0.85); MA.dot(ctx, 55, -49, 2, '#d8ff9a');
  ctx.restore();
  // 몸통 : 겹친 등판
  MA.smooth(ctx, [-34, -22, -28, -36, -6, -41, 20, -38, 34, -28, 32, -16, 10, -11, -22, -12], S[1], 1.8);
  MA.sfill(ctx, [-34, -22, -28, -14, 10, -11, 32, -16, 30, -20, 8, -17, -24, -18], S[0]);
  ctx.strokeStyle = S[0]; ctx.lineWidth = 1.3; ctx.beginPath(); for (const x of [-18, -6, 7, 19]) { ctx.moveTo(x, -39 + Math.abs(x) * 0.08); ctx.quadraticCurveTo(x + 5, -27, x + 1, -14); } ctx.stroke();
  MA.sfill(ctx, [-20, -34, 0, -38, 16, -34, -2, -31], S[2]);
  MA.eye(ctx, 27, -30, 2.6, '#ff3a2a', { slant: 1, lid: S[0] }); MA.dot(ctx, 21, -33, 1.4, '#12060a');
  legs(false);
  // 집게
  for (const [oy, c] of [[-5, D], [3, S]]) {
    const op = k.act === 'sting' ? 0.5 : 0.25 + Math.sin(k.t * 0.1 + oy) * 0.12;
    MA.seg(ctx, 28, -24 + oy, 44, -30 + oy * 1.6, 5, 4.4, c, 1.3);
    ctx.save(); ctx.translate(46, -31 + oy * 1.6);
    MA.smooth(ctx, [-4, -6, 8, -9, 20, -6 - op * 6, 12, -1, 0, 3], c[1], 1.3, 0.8); MA.sfill(ctx, [2, -7, 14, -7 - op * 4, 8, -4], c[2], 0.8);
    MA.poly(ctx, [2, 2, 14, 0 + op * 5, 20, 3 + op * 7, 8, 7 + op * 3], c[0], 1.2);
    ctx.restore();
  }
});

// ---------- 저주받은 미라 ----------
MA.setArt('mummy', { wrap: ['#6c5c40', '#c6b693', '#f0e6cc'], rot: ['#2a3a2a', '#4a6a4a', '#7aa07a'], gold: ['#8a6410', '#e8b82a', '#fff0a0'] }, (ctx, m, P, k) => {
  const Wr = P.wrap, Dk = [Wr[0], Wr[0], Wr[1]], walk = k.a === 'walk' ? Math.sin(k.at * 0.12) : 0, sw = Math.sin(k.t * 0.07);
  const bands = (x0, y0, x1, y1, r, n) => { ctx.strokeStyle = Wr[0]; ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 1; i <= n; i++) { const u = i / (n + 1), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, s = i % 2 ? 1 : -1; ctx.moveTo(x - r, y - 1.6 * s); ctx.lineTo(x + r, y + 1.6 * s); } ctx.stroke(); };
  MA.seg(ctx, -6, -58, -9 - walk * 9, -4, 8.5, 7, Dk, 1.6); bands(-6, -58, -9 - walk * 9, -4, 7, 5); MA.ball(ctx, -5 - walk * 9, -3, 9, 4, Dk, 0, 1.4, 0);
  MA.seg(ctx, -8, -98, -16, -78 - sw * 2, 5.5, 5, Dk, 1.4); MA.seg(ctx, -16, -78 - sw * 2, -10, -62 - sw * 3, 5, 4.4, Dk, 1.4);                 // 늘어진 뒷팔
  MA.seg(ctx, 6, -58, 9 + walk * 9, -4, 8.5, 7, Wr, 1.6); bands(6, -58, 9 + walk * 9, -4, 7, 5); MA.ball(ctx, 14 + walk * 9, -3, 9.5, 4.2, Wr, 0, 1.4, 0);
  // 몸통 (구부정)
  MA.smooth(ctx, [-15, -56, -17, -84, -12, -106, 4, -110, 17, -100, 18, -78, 15, -56, 0, -52], Wr[1], 1.8);
  MA.sfill(ctx, [-15, -56, -17, -84, -12, -106, -4, -108, -8, -80, -5, -54], Wr[0]);
  bands(0, -56, 2, -108, 15, 7);
  MA.sfill(ctx, [2, -92, 12, -94, 14, -84, 6, -80], P.rot[1], 0.8); MA.line(ctx, [4, -90, 10, -86, 6, -83], P.rot[0], 1);                          // 붕대 틈으로 썩은 살
  MA.poly(ctx, [-14, -70, -22, -52 + sw * 3, -18, -40 + sw * 4, -24, -30 + sw * 5, -15, -44 + sw * 3, -11, -64], Wr[2], 1.2);                     // 풀린 붕대
  MA.poly(ctx, [-8, -108, 10, -110, 12, -104, -8, -102], P.gold[1], 1.2); MA.dot(ctx, 2, -106.5, 2, '#3ac8d8');                                  // 목걸이
  // 머리
  ctx.save(); ctx.translate(5, -118 + sw * 0.6); ctx.rotate(0.1);
  MA.ball(ctx, 0, 0, 12.5, 13.5, Wr, 0, 1.7, 0.8);
  ctx.strokeStyle = Wr[0]; ctx.lineWidth = 1.1; ctx.beginPath(); for (const [y, s] of [[-8, 1], [-3, -1], [5, 1], [9, -1]]) { ctx.moveTo(-12, y - s); ctx.lineTo(12, y + s); } ctx.stroke();
  MA.fill(ctx, [0, -4, 12, -5, 12, 2, 1, 3], '#16100c'); MA.glow(ctx, 7, -1, 11, '120,255,200', 0.95); MA.dot(ctx, 7.4, -1, 2, '#c8ffe8');
  MA.poly(ctx, [-10, 6, -18, 16 + sw * 2, -12, 18 + sw * 2, -6, 9], Wr[2], 1.1);
  ctx.restore();
  // 앞팔 : 앞으로 뻗은 손
  MA.seg(ctx, 10, -98, 26, -96, 6.5, 5.6, Wr, 1.5); MA.seg(ctx, 26, -96, 40, -94, 5.6, 5, Wr, 1.5); bands(10, -98, 40, -94, 5.5, 5);
  for (const o of [-3, 0, 3]) MA.line(ctx, [43, -94 + o, 50, -93 + o * 1.6], Wr[2], 1.8);
  if (k.act === 'lash' && k.af >= 20 && k.af < 40) {
    const L = Math.min(1, (k.af - 20) / 6) * 280; ctx.lineCap = 'round';
    ctx.strokeStyle = MA.ol; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(40, -94); ctx.quadraticCurveTo(40 + L * 0.5, -112, 40 + L, -70); ctx.stroke();
    ctx.strokeStyle = Wr[2]; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = Wr[0]; ctx.lineWidth = 1; ctx.setLineDash([6, 9]); ctx.stroke(); ctx.setLineDash([]);
  }
});

// ---------- 역병 쥐 ----------
MA.setArt('rat', { fur: ['#3a3022', '#6e5e44', '#a4947a'], skin: ['#8a4a50', '#d08a90', '#f4c0c4'] }, (ctx, m, P, k) => {
  const F = P.fur, run = k.a === 'walk' ? Math.sin(k.at * 0.6) * 3 : 0, bite = k.act === 'bite' && k.af > 8 ? 1 : 0;
  ctx.lineCap = 'round'; MA.oline(ctx, [-18, -12, -30, -20, -40, -12 + run, -50, -16 + run * 1.4], P.skin[1], 2.2, 1);                              // 꼬리
  for (const [x, ph] of [[-12, 0], [8, 2]]) MA.ball(ctx, x + Math.sin((k.a === 'walk' ? k.at * 0.6 : 0) + ph) * 4, -2, 5, 3, P.skin, 0, 1.1, 0);
  MA.smooth(ctx, [-22, -10, -18, -22 + run * 0.3, -2, -27 + run * 0.3, 14, -22, 20, -12, 12, -4, -14, -3], F[1], 1.5);
  MA.sfill(ctx, [-22, -10, -14, -3, 12, -4, 20, -12, 8, -9, -12, -8], F[0]);
  MA.fill(ctx, [-12, -23, -8, -29, -5, -24, 0, -30, 3, -25, 8, -29, 10, -23], F[1]); MA.line(ctx, [-12, -23, -8, -29, -5, -24, 0, -30, 3, -25, 8, -29, 10, -23], MA.ol, 1.1);
  MA.dot(ctx, -6, -14, 2.6, '#7ac84a'); MA.dot(ctx, 4, -18, 1.8, '#7ac84a');                                                                   // 역병 반점
  MA.ball(ctx, 13, -27, 5, 6, P.skin, -0.2, 1.1, 0);
  MA.smooth(ctx, [10, -24, 20, -24, 31, -16, 30, -11, 20, -9, 11, -13], F[1], 1.3, 0.8);
  MA.dot(ctx, 31, -15, 1.9, '#2a1014'); MA.eye(ctx, 20, -19, 2.3, '#ff3030', { slant: 1, lid: F[0] });
  if (bite) { MA.poly(ctx, [20, -11, 30, -11, 28, -4, 20, -6], '#3a0a12', 0.9); MA.fangs(ctx, 24, -11, 2, 2.6, 4); } else MA.fill(ctx, [26, -10.5, 27.5, -6.5, 29, -10.5], '#fffbf0');
  MA.glow(ctx, 0, -14, 24, '140,235,80', 0.2);
});

// ---------- 경비 포탑 ----------
MA.setArt('turret', { steel: ['#2b2f38', '#5d6576', '#a2abbe'], warn: ['#8a6a10', '#f0c020', '#fff0a0'] }, (ctx, m, P, k) => {
  const S = P.steel, aim = k.act === 'burst' ? 1 : 0, rec = aim && k.af > 20 ? Math.abs(Math.sin(k.af * 1.6)) * 4 : 0, scan = aim ? 0 : Math.sin(k.t * 0.04) * 0.08;
  // 삼각 받침
  for (const s of [-1, 1]) { MA.poly(ctx, [s * 8, -24, s * 34, -3, s * 38, 0, s * 22, 0, s * 4, -14], S[s < 0 ? 0 : 1], 1.5); MA.ball(ctx, s * 31, -1, 8, 3.4, S, 0, 1.3, 0); }
  MA.poly(ctx, [-18, -30, 18, -30, 22, -14, -22, -14], S[1], 1.7); MA.fill(ctx, [-21, -20, 21, -20, 22, -14, -22, -14], S[0]);
  ctx.save(); ctx.beginPath(); polyPath(ctx, [-18, -30, 18, -30, 20, -22, -20, -22]); ctx.clip(); ctx.fillStyle = P.warn[1]; ctx.fillRect(-22, -30, 44, 8); ctx.fillStyle = '#17131a'; for (let x = -26; x < 26; x += 9) { ctx.beginPath(); polyPath(ctx, [x, -22, x + 4.5, -22, x + 9, -30, x + 4.5, -30]); ctx.fill(); } ctx.restore();
  MA.seg(ctx, 0, -30, 0, -46, 7, 7, S, 1.5); MA.fill(ctx, [-7, -40, 7, -40, 7, -37, -7, -37], S[0]);
  // 포탑 머리
  ctx.save(); ctx.translate(0, -62); ctx.rotate(scan);
  MA.poly(ctx, [12 - rec, -9, 58 - rec, -8, 58 - rec, -2, 12 - rec, -1], S[0], 1.4); MA.poly(ctx, [12 - rec, 1, 54 - rec, 2, 54 - rec, 7, 12 - rec, 8], S[0], 1.4);          // 쌍열 포신
  MA.fill(ctx, [14 - rec, -8, 56 - rec, -7.2, 56 - rec, -6, 14 - rec, -6.6], S[2]); MA.poly(ctx, [50 - rec, -10, 60 - rec, -10, 60 - rec, 9, 50 - rec, 9], S[1], 1.2);
  MA.smooth(ctx, [-26, 4, -22, -16, -4, -24, 18, -20, 24, -4, 20, 12, -16, 14], S[1], 1.8, 0.8);
  MA.sfill(ctx, [-26, 4, -16, 14, 20, 12, 24, -4, 16, 4, -14, 6], S[0], 0.8); MA.sfill(ctx, [-14, -16, 2, -21, 14, -17, 0, -14], S[2], 0.8);
  for (const [x, y] of [[-18, -6], [-12, 8], [14, 8], [18, -10]]) MA.dot(ctx, x, y, 1.5, S[2]);
  MA.ball(ctx, -2, -3, 8.5, 8.5, ['#12141a', '#22262e', '#3a404c'], 0, 1.4, 0);
  MA.dot(ctx, -2, -3, 5, aim ? '#ff4030' : '#7a1a1a'); MA.dot(ctx, -3.6, -4.6, 1.5, aim ? '#ffd0c0' : '#c05a5a');
  if (aim) { MA.glow(ctx, -2, -3, 20, '255,60,40', 0.9); if (rec > 2) MA.glow(ctx, 62, 0, 16, '255,200,120', 0.8); }
  MA.line(ctx, [-12, -20, -16, -34], S[0], 1.6); MA.dot(ctx, -16, -35, 2.2, k.t % 40 < 20 ? '#ff5040' : '#5a1a1a');
  ctx.restore();
});

// ---------- 감시 드론 ----------
MA.setArt('drone', { body: ['#1b1b2c', '#3d3d60', '#8282ac'], trim: ['#5a4a10', '#d8b020', '#fff0a0'] }, (ctx, m, P, k) => {
  const Bd = P.body, h = 140 + Math.sin(k.t * 0.07 + m.id) * 12, tilt = Math.sin(k.t * 0.05 + m.id) * 0.06;
  ctx.translate(0, -h); ctx.rotate(tilt);
  const c = k.act === 'zap' ? '255,60,80' : m.elem;
  for (const s of [-1, 1]) {
    MA.oline(ctx, [s * 14, -6, s * 30, -15], Bd[0], 3.2, 1.2); MA.ball(ctx, s * 30, -17, 4, 4, Bd, 0, 1.2, 0);
    ctx.fillStyle = `rgba(200,225,255,${0.3 + Math.abs(Math.sin(k.t * 1.3 + s)) * 0.3})`; ctx.beginPath(); ctx.ellipse(s * 30, -21, 19 * Math.abs(Math.cos(k.t * 0.9 + s)) + 4, 2.6, 0, 0, TAU); ctx.fill();
  }
  MA.poly(ctx, [-8, 8, 8, 8, 5, 17, -5, 17], Bd[0], 1.3); MA.poly(ctx, [-2, 15, 16, 16, 16, 20, -2, 19], Bd[1], 1.1);                               // 하부 총열
  MA.smooth(ctx, [-27, -1, -20, -12, 0, -15, 20, -12, 28, -1, 20, 9, 0, 12, -20, 9], Bd[1], 1.7, 0.85);
  MA.sfill(ctx, [-27, -1, -20, 9, 0, 12, 20, 9, 28, -1, 16, 3, -16, 3], Bd[0], 0.85); MA.sfill(ctx, [-16, -10, 0, -13, 14, -10, 0, -8], Bd[2], 0.85);
  MA.fill(ctx, [-24, -3, -14, -3, -14, 0, -25, 0], P.trim[1]);
  MA.ball(ctx, 14, 0, 8, 7.5, ['#0e0e16', '#1c1c2a', '#34344a'], 0, 1.3, 0);
  MA.dot(ctx, 15, 0, 4.6, `rgb(${c})`); MA.dot(ctx, 13.6, -1.6, 1.4, '#ffffff'); MA.glow(ctx, 16, 0, 16, c, 0.9);
  MA.line(ctx, [-10, -13, -13, -24], Bd[0], 1.4); MA.dot(ctx, -13, -25, 1.8, `rgb(${c})`);
});

// ---------- 천상의 방패기사 ----------
MA.setArt('aegis', { armor: ['#8f8672', '#ebe3cc', '#ffffff'], gold: ['#8a6a1e', '#ebc35e', '#fff6c4'], cloth: ['#1e3a7a', '#3a66c8', '#8ab0ff'] }, (ctx, m, P, k) => {
  const A = P.armor, Gd = P.gold, Dk = [A[0], A[0], A[1]], walk = k.a === 'walk' ? Math.sin(k.at * 0.15) : 0, br = Math.sin(k.t * 0.07), fl = Math.sin(k.t * 0.1) * 0.06;
  const lx = k.act === 'charge' && k.af > 20 ? 60 : 30;
  // 날개 (뒤)
  for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(-10, -120); ctx.rotate(-2.5 + i * 0.26 + fl * (i + 1)); MA.smooth(ctx, [0, -4, 30, -7, 58 - i * 6, 0, 30, 7, 0, 4], i % 2 ? A[2] : A[1], 1.3, 0.8); MA.line(ctx, [4, 0, 48 - i * 6, 0], A[0], 0.8); ctx.restore(); }
  MA.seg(ctx, -8, -70, -11 - walk * 10, -6, 9.5, 8, Dk, 1.6); MA.poly(ctx, [-18 - walk * 10, -8, -2 - walk * 10, -8, 2 - walk * 10, 0, -18 - walk * 10, 0], A[0], 1.4);
  MA.poly(ctx, [-18, -74, 18, -74, 22, -44, 8, -36, 0, -48, -8, -36, -22, -44], P.cloth[1], 1.5); MA.fill(ctx, [-18, -74, -6, -74, -8, -36, -22, -44], P.cloth[0]);            // 허리 천
  MA.line(ctx, [-21, -44, -8, -37, 0, -48, 8, -37, 21, -44], Gd[1], 1.6);
  MA.seg(ctx, 8, -70, 11 + walk * 10, -6, 9.5, 8, A, 1.6); MA.poly(ctx, [2 + walk * 10, -8, 20 + walk * 10, -8, 24 + walk * 10, 0, 2 + walk * 10, 0], A[1], 1.4); MA.ball(ctx, 10 + walk * 5, -40, 7, 7, Gd, 0, 1.3, 0.8);
  // 흉갑
  MA.smooth(ctx, [-20, -72, -25, -100, -22, -126, 0, -132, 22, -126, 25, -100, 20, -72, 0, -66], A[1], 1.9, 0.8);
  MA.sfill(ctx, [-20, -72, -25, -100, -22, -126, -8, -130, -10, -98, -6, -68], A[0], 0.8); MA.sfill(ctx, [4, -124, 18, -120, 20, -104, 8, -108], A[2], 0.8);
  MA.line(ctx, [-22, -92, 0, -86, 22, -92], Gd[1], 1.8); MA.poly(ctx, [-5, -116, 0, -122, 5, -116, 0, -104], Gd[1], 1.1); MA.dot(ctx, 0, -114, 2, '#6ac8ff');
  MA.ball(ctx, -20, -124, 10, 8, Dk, 0, 1.5, 0);
  // 투구
  ctx.save(); ctx.translate(2, -142 + br * 0.4);
  MA.poly(ctx, [-8, -12, -2, -34, 4, -30, 10, -40, 12, -12], Gd[1], 1.3); MA.fill(ctx, [0, -14, 4, -28, 8, -14], Gd[2]);                          // 볏
  MA.smooth(ctx, [-13, 2, -14, -10, -4, -17, 10, -15, 16, -5, 15, 8, 6, 13, -8, 12], A[1], 1.7, 0.8);
  MA.sfill(ctx, [-13, 2, -14, -10, -6, -16, -6, 0, -8, 12], A[0], 0.8);
  MA.fill(ctx, [2, -6, 16, -5, 15.5, -1.5, 2, -2.5], '#14121a'); MA.fill(ctx, [7, -6, 9.5, -6, 9.5, 9, 7, 9], '#14121a'); MA.glow(ctx, 11, -4, 8, '140,200,255', 0.8);
  MA.line(ctx, [-13, -7, 14, -9], Gd[1], 1.5);
  ctx.restore();
  // 창
  ctx.lineCap = 'round'; MA.oline(ctx, [lx - 30, -104, lx + 110, -104], Gd[0], 3.4, 1.2);
  MA.poly(ctx, [lx + 104, -112, lx + 160, -104, lx + 104, -96, lx + 112, -104], A[2], 1.3); MA.fill(ctx, [lx + 112, -104, lx + 156, -104, lx + 106, -98], A[0]);
  MA.poly(ctx, [lx + 98, -110, lx + 106, -110, lx + 106, -98, lx + 98, -98], Gd[1], 1.1);
  MA.poly(ctx, [lx + 90, -103, lx + 70, -90 + br * 2, lx + 80, -103], P.cloth[1], 1);
  // 큰 방패
  MA.smooth(ctx, [22, -146, 48, -140, 50, -88, 36, -58, 22, -66], Gd[1], 1.9, 0.5);
  MA.sfill(ctx, [26, -140, 44, -136, 46, -90, 36, -66, 26, -72], A[1], 0.5); MA.sfill(ctx, [26, -140, 34, -138, 34, -68, 26, -72], A[0], 0.5);
  MA.fill(ctx, [33, -130, 39, -130, 39, -78, 33, -78], Gd[1]); MA.fill(ctx, [27, -112, 45, -110, 45, -104, 27, -106], Gd[1]); MA.dot(ctx, 36, -108, 3.4, '#6ac8ff'); MA.glow(ctx, 36, -108, 12, '140,200,255', 0.6);
  MA.seg(ctx, 20, -122, 28, -104, 6, 6, A, 1.4);
});

// ---------- 떠도는 영혼 ----------
MA.setArt('wisp', { ghost: ['#236a5c', '#72dcc2', '#e4fff6'] }, (ctx, m, P, k) => {
  const G = P.ghost, h = 50 + Math.sin(k.t * 0.06 + m.id) * 10, cast = k.act === 'curse' ? Math.min(1, k.af / 24) : 0;
  ctx.translate(0, -h);
  MA.glow(ctx, 0, -34, 62, '120,255,210', 0.4 + cast * 0.25);
  ctx.beginPath(); ctx.moveTo(-24, -40); ctx.bezierCurveTo(-26, -78, -12, -100, 2, -100); ctx.bezierCurveTo(18, -100, 28, -76, 25, -40);
  for (let i = 0; i <= 6; i++) { const x = 25 - i * 49 / 6, y = 16 + Math.sin(k.t * 0.2 + i * 1.3) * 7 + (i % 2 ? 9 : -5); ctx.quadraticCurveTo(x + 4, y - 9, x, y); }
  ctx.closePath(); ctx.lineJoin = 'round';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,50,44,0.85)'; ctx.stroke();
  const g = ctx.createLinearGradient(0, -100, 0, 26); g.addColorStop(0, 'rgba(228,255,246,0.95)'); g.addColorStop(0.4, 'rgba(114,220,194,0.86)'); g.addColorStop(1, 'rgba(35,106,92,0.2)'); ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-10, -78, 6, 12, 0.4, 0, TAU); ctx.fill();
  for (const s of [-1, 1]) { const ay = -44 - cast * 26 + Math.sin(k.t * 0.1 + s) * 3; ctx.fillStyle = 'rgba(114,220,194,0.85)'; ctx.strokeStyle = 'rgba(10,50,44,0.85)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(s * 20, -50); ctx.quadraticCurveTo(s * 40, -52, s * 38 + 8, ay); ctx.quadraticCurveTo(s * 30, -34, s * 20, -36); ctx.closePath(); ctx.stroke(); ctx.fill(); }
  ctx.fillStyle = '#06201a';
  ctx.beginPath(); ctx.ellipse(-5, -62, 5, 7.5 - cast * 2, -0.25, 0, TAU); ctx.ellipse(11, -62, 5, 7.5 - cast * 2, 0.25, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -42, 5 + cast * 3, 8 + cast * 5, 0, 0, TAU); ctx.fill();
  MA.dot(ctx, -4, -62, 1.6, '#aaffe4'); MA.dot(ctx, 12, -62, 1.6, '#aaffe4');
  for (let i = 0; i < 3; i++) { const ph = (k.t * 0.02 + i / 3) % 1; MA.glow(ctx, Math.sin(ph * 6 + i * 2) * 26, -30 - ph * 80, 6 * (1 - ph), '170,255,225', 0.6 * (1 - ph)); }
});

// ---------- 심연의 눈 ----------
MA.setArt('eye', { flesh: ['#461636', '#8c3a6c', '#d07aa8'] }, (ctx, m, P, k) => {
  const Fl = P.flesh, h = 130 + Math.sin(k.t * 0.05 + m.id) * 14, beam = k.act === 'beam', lookY = Math.sin(k.t * 0.04) * 3;
  ctx.translate(0, -h);
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const x = -12 + i * 6, s = Math.sin(k.t * 0.1 + i * 1.2) * 8; ctx.strokeStyle = MA.ol; ctx.lineWidth = 6.6 - i * 0.3; ctx.beginPath(); ctx.moveTo(x, 20); ctx.bezierCurveTo(x - 8 + s, 40, x + 8 - s, 58, x - 4 + s * 0.7, 78 - (i % 2) * 12); ctx.stroke(); ctx.strokeStyle = i % 2 ? Fl[0] : Fl[1]; ctx.lineWidth = 4 - i * 0.3; ctx.stroke(); }
  MA.ball(ctx, -4, 0, 33, 33, Fl, 0, 2, 0.7);                                                                                                // 살덩이 눈꺼풀
  ctx.beginPath(); ctx.ellipse(3, 0, 27, 27, 0, 0, TAU); ctx.fillStyle = '#f6eee6'; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = MA.ol; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = 'rgba(160,60,90,0.35)'; ctx.beginPath(); ctx.ellipse(-12, 10, 30, 28, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#f6eee6'; ctx.beginPath(); ctx.ellipse(8, -6, 24, 22, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(200,40,60,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); for (const [a, l] of [[2.4, 16], [3.0, 20], [3.6, 15], [4.3, 12], [1.9, 12]]) { const x0 = 3 + Math.cos(a) * 26, y0 = Math.sin(a) * 26; ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 - Math.cos(a) * l * 0.5 + 3, y0 - Math.sin(a) * l * 0.5 + 4, x0 - Math.cos(a) * l, y0 - Math.sin(a) * l); } ctx.stroke();
  const ix = 12, iy = lookY, c = beam ? ['#5a0010', '#ff2040', '#ffb0b8'] : ['#3a0a48', '#a8309a', '#f0a0e0'];
  const g = ctx.createRadialGradient(ix, iy, 3, ix, iy, 14); g.addColorStop(0, c[2]); g.addColorStop(0.5, c[1]); g.addColorStop(1, c[0]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix, iy, 14, 0, TAU); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = MA.ol; ctx.stroke();
  ctx.strokeStyle = c[0]; ctx.lineWidth = 0.8; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.moveTo(ix + Math.cos(a) * 6, iy + Math.sin(a) * 6); ctx.lineTo(ix + Math.cos(a) * 13, iy + Math.sin(a) * 13); } ctx.stroke();
  ctx.fillStyle = '#12040e'; ctx.beginPath(); ctx.ellipse(ix + 1, iy, beam ? 2.4 : 5, beam ? 9 : 6.5, 0, 0, TAU); ctx.fill();
  MA.dot(ctx, ix - 5, iy - 6, 3, '#ffffff'); MA.dot(ctx, ix + 5, iy + 6, 1.4, 'rgba(255,255,255,0.7)');
  ctx.restore();
  MA.sfill(ctx, [-24, -22, -4, -33, 22, -28, 30, -14, 10, -24, -12, -22], Fl[1], 0.9); MA.line(ctx, [-24, -22, -12, -22, 10, -24, 30, -14], MA.ol, 1.4);                         // 윗눈꺼풀
  for (const [x, y] of [[-26, -18], [-33, -4], [-30, 14]]) MA.poly(ctx, [x, y, x - 10, y - 3, x - 1, y + 6], Fl[2], 1);                              // 돌기
  if (beam) MA.glow(ctx, 12, lookY, 32, '255,40,80', 0.9);
});

// ---------- 화염 임프 ----------
MA.setArt('imp', { skin: ['#5c1008', '#c83c1a', '#ff9244'], wing: ['#2a0806', '#6a1a10', '#b04020'] }, (ctx, m, P, k) => {
  const Sk = P.skin, h = 90 + Math.sin(k.t * 0.1 + m.id) * 12, fl = Math.sin(k.t * 0.7), cast = k.act === 'fireball' && k.af < 26;
  ctx.translate(0, -h);
  const wing = (s, c) => { MA.poly(ctx, [-4, -26, -22, -44 - fl * 10 * s, -36, -30 - fl * 6 * s, -30, -18, -24, -24, -18, -12, -12, -20], c[1], 1.3); MA.fill(ctx, [-4, -26, -22, -44 - fl * 10 * s, -34, -31 - fl * 6 * s, -20, -36 - fl * 7 * s, -6, -22], c[0]); };
  wing(-1, [P.wing[0], P.wing[0], P.wing[1]]);
  ctx.lineCap = 'round'; MA.oline(ctx, [-8, -6, -22, 6, -18, 18, -8, 22 + fl * 2], Sk[0], 2.6, 1.1); MA.poly(ctx, [-8, 17 + fl * 2, 2, 24 + fl * 2, -8, 28 + fl * 2, -5, 22 + fl * 2], Sk[1], 1);       // 화살촉 꼬리
  for (const s of [-1, 1]) { MA.seg(ctx, s * 5, -6, s * 8 + 3, 6, 4, 3, s < 0 ? [Sk[0], Sk[0], Sk[1]] : Sk, 1.2); MA.fangs(ctx, s * 8 + 1, 7, 2, 3, 3.4, '#2a0a04'); }
  MA.smooth(ctx, [-12, -22, -4, -36, 10, -32, 14, -16, 8, -2, -6, -2], Sk[1], 1.6); MA.sfill(ctx, [-12, -22, -6, -34, -3, -16, -2, -2, -6, -2], Sk[0]);
  MA.sfill(ctx, [0, -22, 9, -22, 9, -8, 1, -6], Sk[2], 0.9);
  wing(1, P.wing);
  MA.seg(ctx, 8, -28, 18, -22, 3.6, 3, Sk, 1.2); MA.seg(ctx, 18, -22, cast ? 20 : 22, cast ? -34 : -14, 3, 2.8, Sk, 1.2);
  ctx.save(); ctx.translate(5, -46); ctx.rotate(0.08);
  MA.poly(ctx, [-8, -6, -14, -24, -2, -10], '#2a0a04', 1.1); MA.poly(ctx, [2, -9, 10, -26, 12, -7], '#2a0a04', 1.1);
  MA.poly(ctx, [-9, -2, -22, -8, -11, 4], Sk[1], 1.1);
  MA.smooth(ctx, [-11, -2, -6, -11, 8, -11, 15, -3, 14, 6, 4, 11, -7, 8], Sk[1], 1.5, 0.85); MA.sfill(ctx, [-11, -2, -6, -10, -3, 0, -2, 9, -7, 8], Sk[0], 0.85);
  MA.eye(ctx, 6, -2, 3.4, '#ffe040', { slant: 1.1, lid: Sk[0], slit: 1, blink: MA.blink(k) });
  MA.poly(ctx, [0, 4, 14, 2, 12, 8, 2, 9], '#2a0408', 1); MA.fangs(ctx, 1.5, 4, 4, 2.8, 2.8);
  ctx.restore();
  if (cast) { const r = 6 + k.af * 0.55; MA.glow(ctx, 20, -40, r * 2.2, '255,140,40', 0.9); MA.ball(ctx, 20, -40, r * 0.7, r * 0.7, ['#ff6a10', '#ffb030', '#fff0a0'], 0, 0, 1); }
  MA.glow(ctx, 0, -20, 26, '255,110,40', 0.18);
});

// ---------- 심해 어인 ----------
MA.setArt('fishman', { scale: ['#0b3a4c', '#1f7e90', '#72d0d8'], fin: ['#27588c', '#4c8ec6', '#92c8f4'], belly: ['#8ab8a8', '#d0ecd8', '#f4fff4'] }, (ctx, m, P, k) => {
  const S = P.scale, Dk = [S[0], S[0], S[1]], walk = k.a === 'walk' ? Math.sin(k.at * 0.18) : 0, thrust = k.act === 'thrust' && k.af > 18 && k.af < 28 ? 40 : 0, br = Math.sin(k.t * 0.08);
  MA.poly(ctx, [-12, -62, -34, -40 + br * 3, -24, -34, -30, -24 + br * 3, -12, -44], P.fin[0], 1.3);                                           // 꼬리 지느러미
  MA.seg(ctx, -6, -56, -10 - walk * 10, -6, 8.5, 6.5, Dk, 1.6); MA.poly(ctx, [-20 - walk * 10, -6, -2 - walk * 10, -7, 6 - walk * 10, 0, -22 - walk * 10, 0], P.fin[0], 1.3);
  MA.seg(ctx, 6, -56, 10 + walk * 10, -6, 8.5, 6.5, S, 1.6); MA.poly(ctx, [0 + walk * 10, -6, 18 + walk * 10, -7, 28 + walk * 10, 0, -2 + walk * 10, 0], P.fin[1], 1.3);
  MA.smooth(ctx, [-15, -54, -17, -80, -10, -102, 6, -106, 18, -94, 18, -72, 13, -54, 0, -50], S[1], 1.8);
  MA.sfill(ctx, [-15, -54, -17, -80, -10, -102, -2, -104, -6, -78, -4, -52], S[0]);
  MA.sfill(ctx, [4, -96, 15, -90, 15, -70, 10, -56, 2, -56, 4, -76], P.belly[1], 0.9);
  ctx.strokeStyle = S[0]; ctx.lineWidth = 0.9; ctx.beginPath(); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const x = -9 + c * 6 + (r % 2) * 3, y = -92 + r * 9; ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x, y + 4, x + 3, y); } ctx.stroke();
  MA.poly(ctx, [-12, -102, -30, -92 - br * 2, -22, -84, -32, -74 - br * 2, -20, -68, -14, -72], P.fin[1], 1.3); MA.line(ctx, [-13, -96, -27, -90, -13, -84, -28, -76], P.fin[0], 0.9);   // 등지느러미
  ctx.save(); ctx.translate(11, -114 + br * 0.5);
  MA.poly(ctx, [-8, -8, -2, -26, 6, -22, 10, -30, 12, -8], P.fin[2], 1.2); MA.line(ctx, [-2, -10, -1, -22, 4, -10, 8, -24], P.fin[0], 0.9);                 // 머리 볏
  MA.smooth(ctx, [-15, -2, -10, -11, 6, -12, 20, -6, 25, 2, 18, 9, 0, 11, -12, 7], S[1], 1.7, 0.8); MA.sfill(ctx, [-15, -2, -12, 7, 0, 11, 18, 9, 10, 4, -8, 3], S[0], 0.8);
  MA.sfill(ctx, [8, 3, 22, 2, 18, 8, 6, 9], P.belly[1], 0.8);
  MA.poly(ctx, [6, 3, 24, 2, 21, 7, 8, 8], '#2a0a14', 1); MA.fangs(ctx, 8, 3, 5, 2.8, 2.6);
  MA.eye(ctx, 10, -5, 4.4, '#ffd24a', { blink: MA.blink(k), slant: 0.5, lid: S[0] });
  MA.poly(ctx, [-9, 0, -20, -3, -18, 6, -9, 6], P.fin[1], 1.1); ctx.strokeStyle = S[0]; ctx.lineWidth = 1; ctx.beginPath(); for (const x of [-4, -1, 2]) { ctx.moveTo(x, 3); ctx.lineTo(x - 1, 8); } ctx.stroke();   // 아가미
  ctx.restore();
  // 삼지창
  ctx.lineCap = 'round'; MA.oline(ctx, [-30 + thrust, -89, 108 + thrust, -89], '#8a7a5a', 3, 1.2);
  for (const o of [-9, 0, 9]) MA.poly(ctx, [106 + thrust, -91 + o * 0.8, 106 + thrust, -87 + o * 0.8, 134 + thrust - Math.abs(o) * 0.9, -89 + o, 126 + thrust - Math.abs(o) * 0.9, -89 + o * 0.6], '#cfd8e2', 1.2);
  MA.poly(ctx, [102 + thrust, -99, 108 + thrust, -99, 108 + thrust, -79, 102 + thrust, -79], '#e8c060', 1.1);
  MA.seg(ctx, 12, -94, 24 + thrust * 0.5, -90, 5.5, 5, S, 1.4); MA.ball(ctx, 26 + thrust * 0.5, -89, 6, 6, S, 0, 1.3, 0.8);
});

// ---------- 식인 꽃봉오리 ----------
MA.setArt('pod', { leaf: ['#17480e', '#3a8e2a', '#92d84e'], bulb: ['#6a2858', '#b84c9e', '#f09ad8'] }, (ctx, m, P, k) => {
  const Lf = P.leaf, Bl = P.bulb, sw = Math.sin(k.t * 0.06) * 0.1, sq = k.act === 'spit' ? (k.af < 24 ? k.af / 24 * 0.3 : -0.1) : 0, open = k.act === 'spit' ? (k.af < 24 ? 0.2 : 1) : 0.35 + Math.sin(k.t * 0.08) * 0.1;
  for (const [a, c] of [[-2.6, Lf[0]], [-2.1, Lf[1]], [-0.9, Lf[1]], [-0.45, Lf[0]]]) { ctx.save(); ctx.rotate(a + sw); MA.smooth(ctx, [0, 0, 22, -11, 56, -3, 60, 2, 26, 9], c, 1.4, 0.8); MA.line(ctx, [4, 0, 54, 0], Lf[2], 1); ctx.restore(); }
  ctx.lineCap = 'round'; MA.oline(ctx, [0, -2, -5 + sw * 30, -24, 7 + sw * 40, -44, 5 + sw * 50, -56], Lf[1], 9, 1.6); MA.line(ctx, [-2, -6, -6 + sw * 30, -24, 5 + sw * 40, -44], Lf[2], 2);
  for (const [x, y, s] of [[-7, -18, -1], [9, -36, 1]]) MA.poly(ctx, [x + sw * 30, y, x + s * 10 + sw * 30, y - 4, x + s * 2 + sw * 30, y - 7], Lf[0], 1);                              // 가시
  ctx.save(); ctx.translate(6 + sw * 50, -68); ctx.scale(1 + sq, 1 - sq); ctx.rotate(sw * 0.8);
  for (const s of [-1, 1]) MA.poly(ctx, [-18, s * 8, -32, s * 16, -22, s * 2], Lf[1], 1.2);                                                  // 꽃받침
  // 아랫입 · 윗입 (벌어진다)
  ctx.save(); ctx.rotate(open * 0.45); MA.smooth(ctx, [-22, 2, -14, 20, 8, 24, 28, 12, 24, 4, 0, 2], Bl[1], 1.8, 0.85); MA.sfill(ctx, [-20, 8, -12, 20, 8, 23, 26, 12, 10, 16, -8, 13], Bl[0], 0.85); MA.fangs(ctx, 0, 2.5, 5, 5, -5.5); ctx.restore();
  MA.poly(ctx, [-6, -4, 24, -6, 24, 8, -6, 6], '#2a0616', 0.8);
  if (open > 0.5) { MA.smooth(ctx, [2, 0, 14, -3 + Math.sin(k.t * 0.5) * 2, 30 + open * 6, 2, 14, 5], '#e04a6a', 1, 0.9); }
  ctx.save(); ctx.rotate(-open * 0.5); MA.smooth(ctx, [-24, -2, -20, -22, 0, -30, 22, -22, 30, -8, 24, -2, 0, 0], Bl[1], 1.8, 0.85); MA.sfill(ctx, [-12, -24, 2, -28, 16, -22, 2, -20], Bl[2], 0.85);
  ctx.fillStyle = Bl[2]; for (const [x, y, r] of [[-12, -12, 3.4], [2, -14, 2.6], [14, -10, 3], [-2, -6, 2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  MA.fangs(ctx, 0, -1, 5, 5, 5.5); ctx.restore();
  ctx.restore();
});

// ---------- 수정 정령 ----------
MA.setArt('crystalling', { cr: ['#43338e', '#9a80e4', '#ece4ff'] }, (ctx, m, P, k) => {
  const C = P.cr, bob = Math.sin(k.t * 0.08 + m.id) * 5, cast = k.act === 'spikes' ? Math.min(1, k.af / 30) : 0, pu = 0.6 + Math.sin(k.t * 0.1) * 0.25 + cast * 0.4;
  MA.ball(ctx, 0, -1, 20 - bob * 0.6, 4, ['#1a1430', '#2a2048', '#2a2048'], 0, 0, 0);
  ctx.translate(0, bob - 10);
  MA.glow(ctx, 0, -56, 56, '190,170,255', 0.35 * pu);
  for (const s of [-1, 1]) { const a = k.t * 0.04 * s + s, ox = s * (32 + Math.cos(a) * 5), oy = -52 + Math.sin(a) * 9; MA.poly(ctx, [ox, oy - 22, ox + 8, oy - 2, ox, oy + 20, ox - 8, oy - 2], C[1], 1.4); MA.fill(ctx, [ox, oy - 22, ox + 8, oy - 2, ox, oy - 4], C[2]); MA.fill(ctx, [ox - 8, oy - 2, ox, oy - 4, ox, oy + 20], C[0]); }
  // 본체 : 깎인 면이 있는 큰 결정
  MA.poly(ctx, [0, -112, 15, -76, 18, -30, 0, 0, -18, -30, -15, -76], C[1], 1.9);
  MA.fill(ctx, [0, -112, 15, -76, 4, -70], C[2]); MA.fill(ctx, [0, -112, -15, -76, 4, -70], C[1]);
  MA.fill(ctx, [-15, -76, 4, -70, 0, 0, -18, -30], C[0]); MA.fill(ctx, [15, -76, 18, -30, 0, 0, 4, -70], blMix(C[1], C[2], 0.35));
  MA.line(ctx, [0, -112, 4, -70, 0, 0], 'rgba(255,255,255,0.6)', 0.9); MA.line(ctx, [-15, -76, 4, -70, 15, -76], 'rgba(255,255,255,0.4)', 0.8);
  MA.fill(ctx, [6, -98, 11, -80, 7, -78], '#ffffff');
  // 속에서 빛나는 눈
  MA.glow(ctx, 5, -52, 16, '255,255,255', 0.5 * pu);
  MA.fill(ctx, [-4, -56, 2, -60, 2, -50, -4, -50], '#1c1240'); MA.fill(ctx, [7, -60, 14, -57, 13, -49, 7, -50], '#1c1240');
  MA.dot(ctx, -0.5, -54.5, 1.6, '#ffffff'); MA.dot(ctx, 10.5, -54.5, 1.8, '#ffffff');
  for (const s of [-1, 1]) MA.poly(ctx, [s * 12, -14, s * 24, -6, s * 15, 2, s * 8, -4], C[0], 1.3);
  for (let i = 0; i < 3; i++) { const ph = (k.t * 0.015 + i / 3) % 1; MA.dot(ctx, Math.sin(i * 2.4 + ph * 5) * 26, -20 - ph * 90, 1.6 * (1 - ph), `rgba(236,228,255,${1 - ph})`); }
});

// ============================================================
//  공용 그리기 도구(DR · MA)를 그림 엔진(PT)으로 : 그늘 · 반사광 · 테두리광이 자동으로 붙는다
// ============================================================
DR.ell = (ctx, x, y, rx, ry, fill, rot = 0, w = 2) => PT.fill(ctx, PT.ell(x, y, rx, ry, rot), fill, { ow: w, rim: 1, spec: Math.min(rx, ry) > 10 ? 0.5 : 0 });
DR.cap = (ctx, x0, y0, x1, y1, r0, r1, fill, w = 2) => PT.fill(ctx, PT.cap(x0, y0, x1, y1, r0, r1), fill, { ow: w, rim: 1 });
DR.poly = (ctx, pts, fill, w = 2) => PT.fill(ctx, PT.poly(pts), fill, { ow: w, rim: 1 });
MA.ball = (ctx, x, y, rx, ry, m, rot = 0, w = 1.8, hl = 1) => PT.fill(ctx, PT.ell(x, y, rx, ry, rot), m, { ow: w, rim: 1, spec: hl ? 0.7 : 0 });
MA.seg = (ctx, x0, y0, x1, y1, r0, r1, m, w = 1.6) => PT.fill(ctx, PT.cap(x0, y0, x1, y1, r0, r1), m, { ow: w, rim: 1 });
MA.poly = (ctx, pts, fill, w = 1.5) => PT.fill(ctx, PT.poly(pts), fill, { ow: w, rim: 1 });
MA.smooth = (ctx, pts, fill, w = 1.6, t = 0.9) => PT.fill(ctx, PT.sm(pts, t), fill, { ow: w, rim: 1 });
