'use strict';
// ============================================================
//  보스 새 그림 : creatures*.js 의 행동 · 판정 · 포즈 계산은 그대로, 생김새(draw)만 새로 그린다
//   좌표 : 발밑 = (0,0), 앞 = +x, 위 = -y.  그림 엔진 PT 를 쓴다.
// ============================================================
const BA = {
  // 맞았을 때 하얗게 (팔레트 밖의 고정색에도)
  c(b, c) { return b.flash > 0 ? PT.mix(c, '#ffffff', 0.7) : c; },
  // 두 마디 팔 · 다리의 관절 위치 (길이 L 두 개, bend = +1 / -1 굽는 방향)
  ik(ax, ay, bx, by, L, bend) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, h = Math.sqrt(Math.max(0, L * L - d * d / 4));
    return [(ax + bx) / 2 - dy / d * h * bend, (ay + by) / 2 + dx / d * h * bend];
  },
  // 휘어진 뿔 · 발톱 : (x,y) 에서 ang 방향으로 len, 밑동 반폭 w, 끝으로 갈수록 curl 만큼 휜다
  horn(ctx, x, y, ang, len, w, curl, M, o) {
    const A = [], B = []; let px = x, py = y;
    for (let i = 0; i <= 7; i++) {
      const u = i / 7, a = ang + curl * u, ww = w * (1 - u * 0.92);
      if (i) { px += Math.cos(a) * len / 7; py += Math.sin(a) * len / 7; }
      A.push(px - Math.sin(a) * ww, py + Math.cos(a) * ww); B.unshift(px + Math.sin(a) * ww, py - Math.cos(a) * ww);
    }
    PT.fill(ctx, PT.sm(A.concat(B), 0.6), M, Object.assign({ ow: 1.8, hl: 1.6, rim: 1 }, o || {}));
  },
  // 열린 점열을 흔들리는 곡선으로 (촉수 · 꼬리)
  wave(x0, y0, x1, y1, n, amp, ph, freq = 1) {
    const o = [], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 0; i <= n; i++) { const u = i / n, w = Math.sin(u * Math.PI * freq + ph) * amp * u; o.push(x0 + dx * u + nx * w, y0 + dy * u + ny * w); }
    return o;
  },
};

// ============================================================
//  1. 석귀 골렘 : 이끼 낀 신전 석상. 가슴에 룬 핵, 바위 주먹, 떠도는 룬석
// ============================================================
CREATURES.golem.draw = function (ctx, b, P, k) {
  const t = k.t, R = P.rock, D2 = P.dark, F = PT.fill, C = c => BA.c(b, c);
  const moss = [C('#1f3318'), C('#4a6b2c'), C('#86a856')], stone = { tex: 'stone', ta: 0.4, rim: 1 };
  let by = Math.sin(t * 0.05) * 3, lean = 0;
  if (k.st === 'break') { by = 50; lean = 0.15; }
  if (k.st === 'hurt') lean = -0.08;
  const walk = k.a === 'walk' ? Math.sin(k.at * 0.12) : 0;
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
  const ga = b.skinT > 0 ? 1 : 0.6 + Math.sin(t * 0.08) * 0.25, el = b.enraged ? '255,90,40' : b.elem;
  // 룬석 하나
  const runeStone = (X, Y, a, s, front) => {
    ctx.save(); ctx.translate(X, Y); ctx.rotate(a * 0.4); ctx.scale(s, s);
    F(ctx, PT.poly([-13, -9, -4, -15, 11, -11, 15, 1, 8, 12, -9, 11, -15, 2]), front ? R[1] : D2[2], { ow: 1.6, tex: 'stone', ta: 0.35, rim: 1 });
    PT.neon(ctx, [-5, -6, 2, -1, -4, 5, 4, 7], el, 1.3, ga * (front ? 1 : 0.5));
    ctx.restore();
  };
  // 바위 주먹 : 손가락 마디 네 개 + 엄지
  const fist = (X, Y, rot, M, front) => {
    ctx.save(); ctx.translate(X, Y); ctx.rotate(rot);
    F(ctx, PT.sm([-34, -28, 8, -38, 38, -24, 46, 6, 36, 32, -6, 38, -36, 22, -44, -4], 0.6), M, stone);
    for (let i = 0; i < 4; i++) F(ctx, PT.sm([22 + i * 0, -28 + i * 16, 44, -26 + i * 16, 50, -14 + i * 16, 44, -4 + i * 16, 24, -6 + i * 16], 0.7), M, { ow: 1.8, tex: 'stone', ta: 0.35, rim: 1 });
    F(ctx, PT.sm([-6, -40, 18, -46, 30, -34, 16, -24, -4, -26], 0.7), M, { ow: 1.8, tex: 'stone', ta: 0.3 });
    if (front) { PT.neon(ctx, [-20, -8, -6, 2, -16, 14], el, 1.6, ga * 0.9); F(ctx, PT.sm([-30, 20, -10, 28, -16, 34, -34, 24], 0.6), moss, { ow: 1.2, hl: 1.5 }); }
    ctx.restore();
  };
  // 팔 : 어깨 → 팔꿈치 → 주먹, 바위 덩이를 이어 붙인다
  const arm = (sx, sy2, hx, hy, M, front) => {
    const [ex, ey] = BA.ik(sx, sy2, hx, hy, 74, front ? 1 : -1);
    F(ctx, PT.cap(sx, sy2, ex, ey, 30, 25), M, stone);
    F(ctx, PT.cap(ex, ey, hx, hy, 26, 30), M, stone);
    F(ctx, PT.ell(ex, ey, 24, 22, 0.4), M, { ow: 2, tex: 'stone', ta: 0.35, rim: 1 });
    // 팔뚝 위 돌판
    const a = Math.atan2(hy - ey, hx - ex);
    ctx.save(); ctx.translate((ex + hx) / 2, (ey + hy) / 2); ctx.rotate(a);
    F(ctx, PT.poly([-30, -30, 24, -34, 30, -14, -26, -12]), front ? R[2] : D2[2], { ow: 1.8, tex: 'stone', ta: 0.4 });
    if (front) PT.neon(ctx, [-16, -24, -4, -20, 10, -26], el, 1.2, ga * 0.7);
    ctx.restore();
    fist(hx, hy, a - Math.PI / 2 + (front ? 1.2 : 1.4), M, front);
  };

  ctx.save(); ctx.translate(0, by); ctx.rotate(lean);
  // 뒤쪽 룬석
  for (let i = 0; i < 5; i++) { const a = t * 0.025 + i * TAU / 5; if (Math.sin(a) < 0) runeStone(Math.cos(a) * 150, -190 + Math.sin(a) * 30, a, 0.8, false); }
  // 뒷팔
  arm(-80, -232, bx2, bky, D2, false);
  // 다리 : 굵은 기둥 + 받침돌 발
  const leg = (x, sw, M, front) => {
    const kx = x + sw * 6;
    F(ctx, PT.sm([x - 32, -112, x + 30, -112, kx + 30, -40, kx + 26, -18, kx - 30, -18, kx - 34, -44], 0.4), M, stone);
    F(ctx, PT.sm([kx - 42, -26, kx + 44, -28, kx + 54, 0, kx - 46, 0], 0.3), M, { ow: 2, tex: 'stone', ta: 0.45, rim: 1 });
    for (let i = 0; i < 3; i++) F(ctx, PT.sm([kx + 30 + i * 0, -20 + i * 7, kx + 58, -18 + i * 7, kx + 60, -8 + i * 7, kx + 32, -8 + i * 7], 0.5), M, { ow: 1.4 });
    F(ctx, PT.poly([x - 26, -92, x + 24, -92, x + 22, -62, x - 24, -64]), front ? R[2] : D2[2], { ow: 1.6, tex: 'stone', ta: 0.4 });     // 무릎 판
    if (front) PT.neon(ctx, [x - 8, -86, x + 2, -74, x - 6, -66], el, 1.1, ga * 0.6);
  };
  leg(-38, walk, D2, false);
  leg(30, -walk, R, true);
  // 허리 띠돌
  F(ctx, PT.sm([-80, -120, 78, -120, 84, -86, -84, -86], 0.4), D2, { ow: 2.2, tex: 'stone', ta: 0.4 });
  // 몸통 : 앞으로 굽은 거대한 바위 덩어리
  const torso = PT.sm([-82, -96, 82, -96, 106, -168, 104, -226, 70, -268, 10, -282, -56, -272, -102, -238, -110, -170], 0.65);
  F(ctx, torso, R, { ow: 2.6, tex: 'stone', ta: 0.5, rim: 1, sh: 1.1 });
  // 가슴 돌판 + 룬 고리 + 핵
  F(ctx, PT.sm([-48, -118, 56, -118, 70, -186, 40, -232, -30, -236, -64, -190], 0.5), R[2] === R[1] ? R : [R[1], R[2], PT.lt(R[2], 0.3)], { ow: 2, tex: 'stone', ta: 0.45 });
  ctx.save(); ctx.translate(6, -176);
  F(ctx, PT.ell(0, 0, 36, 36), D2, { ow: 2, sh: 0.6 });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.01; PT.neon(ctx, [Math.cos(a) * 28, Math.sin(a) * 28, Math.cos(a + 0.25) * 30, Math.sin(a + 0.25) * 30], el, 1.4, ga * 0.8); }
  PT.glow(ctx, 0, 0, 70, el, 0.55 * ga);
  F(ctx, PT.poly([0, -20, 16, 0, 0, 20, -16, 0]), C('#fff6d8'), { ow: 1.6, flat: true });
  ctx.fillStyle = `rgba(${el},0.75)`; ctx.beginPath(); polyPath(ctx, [0, -14, 10, 0, 0, 14, -10, 0]); ctx.fill();
  ctx.restore();
  // 빛나는 균열
  PT.neon(ctx, [-60, -150, -44, -166, -52, -198, -36, -222], el, 2, ga);
  PT.neon(ctx, [66, -128, 54, -150, 76, -176, 70, -200], el, 1.6, ga);
  PT.neon(ctx, [-84, -110, -70, -126, -78, -140], el, 1.3, ga * 0.8);
  if (b.skinT > 0) PT.glow(ctx, 0, -180, 220, '230,200,140', 0.4, 0.8, 1.2);
  // 어깨의 이끼
  F(ctx, PT.sm([-96, -232, -60, -270, -10, -282, -30, -262, -66, -250, -88, -222], 0.8), moss, { ow: 1.6, hl: 1.6 });
  for (let i = 0; i < 5; i++) { const x = -86 + i * 16; PT.line(ctx, [x, -236 + i * 4, x - 2, -222 + i * 5 + Math.sin(t * 0.04 + i) * 2], moss[1], 2.4, 1); }
  // 머리 : 낮게 박힌 투구 같은 돌머리, 이마 돌기, 눈 틈
  ctx.save(); ctx.translate(26, -276);
  F(ctx, PT.sm([-34, 10, -36, -22, -16, -42, 20, -44, 42, -26, 44, 4, 30, 18, -20, 20], 0.6), R, { ow: 2.2, tex: 'stone', ta: 0.45, rim: 1 });
  F(ctx, PT.sm([-30, -18, 4, -30, 46, -22, 50, -10, 6, -14, -28, -6], 0.5), R[2] === R[1] ? R : [R[1], R[2], PT.lt(R[2], 0.25)], { ow: 1.8, tex: 'stone', ta: 0.35 });
  F(ctx, PT.poly([-6, -42, 2, -62, 12, -40]), D2, { ow: 1.6 });
  ctx.fillStyle = C('#07050a'); ctx.beginPath(); polyPath(ctx, [-6, -8, 44, -6, 42, 4, -4, 2]); ctx.fill();
  PT.glow(ctx, 22, -2, 46, el, 0.9);
  PT.neon(ctx, [2, -2, 40, -1], el, 2.4, 1);
  F(ctx, PT.sm([0, 8, 36, 8, 34, 18, 4, 18], 0.4), D2, { ow: 1.4 });                                   // 턱
  ctx.restore();
  if (boulder) {
    ctx.save(); ctx.translate(boulder[0], boulder[1]);
    F(ctx, PT.sm([-50, -10, -30, -42, 10, -48, 46, -26, 52, 12, 22, 42, -26, 40, -54, 20], 0.7), [C('#3b352d'), C('#6a6258'), C('#9a907e')], { ow: 2.4, tex: 'stone', ta: 0.55, rim: 1, sh: 1.1 });
    PT.neon(ctx, [-20, -10, 0, 6, 18, -8], el, 1.6, 0.8);
    ctx.restore();
  }
  // 앞 어깨 바위 + 앞팔
  F(ctx, PT.sm([-110, -222, -96, -250, -70, -246, -66, -214, -90, -204], 0.7), D2, { ow: 2, tex: 'stone', ta: 0.4 });
  arm(92, -228, fx, fy, R, true);
  F(ctx, PT.sm([56, -230, 80, -268, 124, -262, 136, -228, 120, -204, 76, -204], 0.65), R, { ow: 2.2, tex: 'stone', ta: 0.45, rim: 1, spec: 0.3 });
  F(ctx, PT.sm([72, -250, 92, -268, 120, -262, 104, -248], 0.7), moss, { ow: 1.4, hl: 1.5 });
  PT.neon(ctx, [92, -244, 104, -232, 96, -218], el, 1.3, ga * 0.8);
  // 앞쪽 룬석
  for (let i = 0; i < 5; i++) { const a = t * 0.025 + i * TAU / 5; if (Math.sin(a) >= 0) runeStone(Math.cos(a) * 150, -190 + Math.sin(a) * 30, a, 1, true); }
  ctx.restore();
};

// ============================================================
//  2. 서리 비룡 : 비늘 덮인 뱀 몸, 얼음 결정 등지느러미, 뿔 달린 용머리
// ============================================================
CREATURES.wyrm.draw = function (ctx, b, P, k) {
  const t = k.t, B = P.body, L = P.belly, I = P.ice, F = PT.fill, C = c => BA.c(b, c);
  let sub = b.sub || 0, headX = 40, headY = -230, jaw = 0.15, rear = 0, tail = null;
  if (k.act === 'breath') { const f = k.af; if (f < 34) { headX = 10; headY = -250; jaw = 0.1; } else if (f < 88) { headX = 90; headY = -170; jaw = 0.6; } }
  if (k.act === 'tail') { const f = k.af; rear = -20; tail = f < 44 ? 0 : clamp((f - 44) / 10, 0, 1); }
  if (k.act === 'icicles' || k.act === 'roar' || k.a === 'roar') { headY = -290; headX = 10; jaw = 0.7; }
  if (k.st === 'break') { headY = -120; headX = 70; }
  const eyeC = b.enraged ? '255,90,60' : '150,230,255';
  const eye = (x, y, col) => {
    ctx.fillStyle = '#081018'; ctx.beginPath(); polyPath(ctx, [x - 12, y + 2, x + 2, y - 7, x + 14, y - 2, x + 2, y + 5]); ctx.fill();
    PT.glow(ctx, x + 2, y - 1, 30, col, 0.9);
    ctx.fillStyle = `rgba(${col},1)`; ctx.beginPath(); polyPath(ctx, [x - 8, y + 1, x + 2, y - 5, x + 11, y - 2, x + 2, y + 3]); ctx.fill();
    PT.dot(ctx, x + 3, y - 1, 1.8, '#ffffff');
  };
  // 구멍 뒤쪽 가장자리
  F(ctx, PT.sm([-160, 8, -120, -14, -60, -20, 0, -14, 40, 6, -60, 0], 0.7), I, { ow: 1.6 });
  ctx.save();
  ctx.beginPath(); ctx.rect(-600, -760, 1200, 760); ctx.clip();
  ctx.translate(0, sub * 320);
  const seg = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14, w = Math.sin(u * 3.2 + t * 0.05) * 32 * (1 - u * 0.6);
    seg.push(lerp(-70, headX - 24, u) + w + rear * (1 - u), lerp(30, headY + 34, Math.pow(u, 0.9)));
  }
  // 꼬리 휩쓸기 (몸 뒤)
  if (tail !== null) {
    const sw = tail * Math.PI * 1.2, tp = [];
    for (let i = 0; i <= 10; i++) { const a = -0.2 + sw * (i / 10), r = 50 + i * 30; tp.push(Math.cos(a) * r - 40, -16 + Math.sin(a) * 8); }
    F(ctx, PT.strip(tp, 26, 4), B, { ow: 2, tex: 'scale', ta: 0.4, rim: 1 });
    for (let i = 2; i < 10; i += 2) F(ctx, PT.poly([tp[i * 2] - 6, tp[i * 2 + 1] - 10, tp[i * 2], tp[i * 2 + 1] - 30 + i, tp[i * 2] + 6, tp[i * 2 + 1] - 10]), I, { ow: 1.2 });
  }
  // 등지느러미 얼음 결정
  for (let i = 1; i < 14; i++) {
    const x = seg[i * 2], y = seg[i * 2 + 1], dx = seg[i * 2 + 2] - seg[i * 2 - 2], dy = seg[i * 2 + 3] - seg[i * 2 - 1], l = Math.hypot(dx, dy) || 1;
    const nx = dy / l, ny = -dx / l, r = lerp(40, 26, i / 14), h = r * (1.3 + 0.4 * Math.sin(i * 1.7));
    const bx0 = x + nx * r * 0.7, by0 = y + ny * r * 0.7;
    F(ctx, PT.poly([bx0 - dx / l * r * 0.45, by0 - dy / l * r * 0.45, bx0 + nx * h - dx / l * 6, by0 + ny * h - dy / l * 6, bx0 + dx / l * r * 0.45, by0 + dy / l * r * 0.45]), I, { ow: 1.5, hl: 2, rim: '#ffffff' });
  }
  // 몸통
  F(ctx, PT.strip(seg, 42, 27), B, { ow: 2.6, tex: 'scale', ta: 0.45, rim: 1, sh: 1.1 });
  // 배 비늘판
  const bel = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.max(0, i - 1) * 2, c = Math.min(14, i + 1) * 2, dx = seg[c] - seg[a], dy = seg[c + 1] - seg[a + 1], l = Math.hypot(dx, dy) || 1, r = lerp(42, 27, i / 14);
    bel.push(seg[i * 2] - dy / l * r * 0.42, seg[i * 2 + 1] + dx / l * r * 0.42);
  }
  F(ctx, PT.strip(bel, 24, 14), L, { ow: 1.4, sh: 0.8 });
  ctx.strokeStyle = PT.rgba(L[0], 0.9); ctx.lineWidth = 2;
  for (let i = 1; i < 14; i++) {
    const a = (i - 1) * 2, c = (i + 1) * 2, dx = bel[c] - bel[a], dy = bel[c + 1] - bel[a + 1], l = Math.hypot(dx, dy) || 1, r = lerp(22, 13, i / 14);
    ctx.beginPath(); ctx.moveTo(bel[i * 2] + dy / l * r, bel[i * 2 + 1] - dx / l * r); ctx.quadraticCurveTo(bel[i * 2] + dx / l * 4, bel[i * 2 + 1] + dy / l * 4, bel[i * 2] - dy / l * r, bel[i * 2 + 1] + dx / l * r); ctx.stroke();
  }
  // 서리 김
  for (let i = 0; i < 4; i++) { const ph = (t * 0.01 + i / 4) % 1; PT.glow(ctx, seg[16] + Math.sin(i * 3 + t * 0.02) * 40, seg[17] - ph * 160, 30, '200,240,255', 0.25 * (1 - ph)); }
  // 머리
  ctx.save(); ctx.translate(headX, headY); ctx.rotate(-0.1); ctx.scale(1.3, 1.3);
  const I2 = [I[0], I[1], '#ffffff'];
  BA.horn(ctx, -26, -10, -2.5, 66, 9, 0.7, I2);
  for (let i = 0; i < 4; i++) BA.horn(ctx, -28, -2 + i * 8, 2.75 - i * 0.18, 34 + i * 4, 6, -0.4, I2, { ow: 1.4 });
  // 아랫턱
  ctx.save(); ctx.translate(-6, 10); ctx.rotate(jaw * 0.7);
  F(ctx, PT.sm([-14, -4, 30, -2, 76, 2, 80, 8, 44, 20, 0, 20, -18, 10], 0.5), [B[0], PT.mix(B[0], B[1], 0.5), B[1]], { ow: 2, tex: 'scale', ta: 0.3 });
  ctx.fillStyle = C('#5a1020'); ctx.beginPath(); smoothPoly(ctx, [10, 4, 70, 4, 72, 8, 40, 14, 10, 12], 0.5); ctx.fill();
  PT.teeth(ctx, 22, 4, 74, 2, 6, -7);
  ctx.restore();
  if (jaw > 0.3) { ctx.fillStyle = C('#3a0812'); ctx.beginPath(); polyPath(ctx, [0, 8, 70, 8, 40, 30]); ctx.fill(); }
  // 윗턱 · 두개골
  F(ctx, PT.sm([-38, 6, -36, -20, -10, -34, 26, -30, 56, -18, 86, -10, 90, 2, 60, 10, 20, 12, -20, 16], 0.55), B, { ow: 2.4, tex: 'scale', ta: 0.4, rim: 1, spec: 0.3 });
  F(ctx, PT.sm([-30, 4, 10, 6, 60, 4, 88, 0, 90, 4, 60, 12, 10, 14, -24, 14], 0.5), L, { ow: 0, sh: 0.6 });
  PT.teeth(ctx, 24, 8, 86, 4, 7, 9);
  // 눈썹 능선 + 볼 지느러미
  F(ctx, PT.sm([-6, -30, 40, -32, 54, -20, 30, -16, 0, -18], 0.6), B, { ow: 1.8, tex: 'scale', ta: 0.3 });
  F(ctx, PT.sm([-24, 0, -52, 18, -40, 32, -12, 14], 0.6), I2, { ow: 1.5, hl: 2 });
  eye(26, -14, eyeC);
  PT.dot(ctx, 82, -6, 2.4, '#0a1420');
  // 앞뿔 두 개
  BA.horn(ctx, 2, -28, -2.2, 72, 9, 0.9, I2);
  BA.horn(ctx, 22, -28, -1.9, 36, 6, 0.6, I2, { ow: 1.5 });
  if (k.act === 'breath' && k.af >= 34 && k.af < 88) { PT.glow(ctx, 90, 8, 90, '200,240,255', 0.9); PT.glow(ctx, 60, 12, 40, '255,255,255', 0.6); }
  if (k.act === 'breath' && k.af < 34) PT.glow(ctx, 70, 6, 20 + k.af, '200,240,255', 0.7);
  ctx.restore();
  ctx.restore();
  // 얼음 구멍 앞쪽 가장자리 : 눈 덮인 얼음 덩이
  F(ctx, PT.sm([-170, 10, -130, 0, -60, 6, 10, 0, 50, 12, 20, 30, -60, 34, -150, 28], 0.7), [C('#9cc4dc'), C('#e4f4ff'), '#ffffff'], { ow: 1.8 });
  for (let i = 0; i < 5; i++) { const x = -150 + i * 44; F(ctx, PT.poly([x, 14, x + 10, -14 - (i % 2) * 12, x + 22, 12]), I2, { ow: 1.3, hl: 2 }); }
};

// ============================================================
//  3. 굴착 거미 CX-9 : 장갑 동체, 피스톤 다리, 회전 드릴, 미사일 포드
// ============================================================
CREATURES.spider.draw = function (ctx, b, P, k) {
  const t = k.t, H = P.hull, Lg = P.leg, Dr = P.drill, F = PT.fill, C = c => BA.c(b, c);
  const walk = (k.a === 'walk' || k.act === 'drill') ? k.at * (k.act === 'drill' ? 0.5 : 0.18) : 0;
  let lift = Math.sin(t * 0.06) * 3, tilt = 0, visor = 0.6;
  if (k.act === 'laser') { visor = 1; tilt = k.af > 40 ? 0.12 : 0; }
  if (k.st === 'break') { lift = 40; tilt = 0.2; }
  const el = b.enraged ? '255,60,40' : b.elem, met = { ow: 2, gloss: 0.8, rim: 1 };
  const legs = [[-40, -95, 0], [40, -95, 1.6], [-30, -95, 3.1], [50, -95, 4.7]];
  const legF = (i) => { const [hx, hy, ph] = legs[i];
    const s = Math.sin(walk + ph), fxx = hx * 2.9 + s * 22, fyy = -Math.max(0, Math.cos(walk + ph)) * 16;
    const kx = hx * 2.1 + (hx > 0 ? 18 : -18), ky = -214 + lift, M = i < 2 ? [Lg[0], PT.mix(Lg[0], Lg[1], 0.5), Lg[1]] : Lg;
    F(ctx, PT.cap(hx, hy + lift, kx, ky, 13, 10), M, met);
    const a1 = Math.atan2(ky - hy - lift, kx - hx);
    ctx.save(); ctx.translate((hx + kx) / 2, (hy + lift + ky) / 2); ctx.rotate(a1);
    F(ctx, PT.sm([-34, -16, 30, -14, 36, 0, 30, 12, -34, 12], 0.4), i < 2 ? Lg : H, { ow: 1.8, gloss: 0.9 });
    ctx.fillStyle = C('#ffb030'); for (let j = 0; j < 3; j++) { ctx.beginPath(); polyPath(ctx, [-20 + j * 14, -12, -12 + j * 14, -12, -18 + j * 14, 8, -26 + j * 14, 8]); ctx.fill(); }
    ctx.restore();
    F(ctx, PT.cap(kx, ky, fxx, fyy - 10, 10, 6), M, met);
    PT.line(ctx, [kx + (fxx - kx) * 0.2, ky + (fyy - ky) * 0.2, kx + (fxx - kx) * 0.62, ky + (fyy - ky) * 0.62], C('#c8ccd4'), 4, 1.4);
    F(ctx, PT.poly([fxx - 8, fyy - 14, fxx + 8, fyy - 14, fxx + 4 * Math.sign(hx || 1), fyy + 2]), Lg, { ow: 1.6, gloss: 0.6 });
    F(ctx, PT.ell(kx, ky, 15, 15), H, { ow: 1.8, gloss: 1, spec: 0.6 });
    PT.dot(ctx, kx, ky, 5, C(i < 2 ? '#20242c' : '#3a404c')); PT.glow(ctx, kx, ky, 12, el, 0.4);
  };
  legF(0); legF(1);
  ctx.save(); ctx.translate(0, lift - 112); ctx.rotate(tilt);
  // 배기관
  for (let i = 0; i < 2; i++) {
    F(ctx, PT.cap(-70 + i * 18, -30, -84 + i * 18, -78, 7, 7), Lg, { ow: 1.6, gloss: 0.8 });
    PT.glow(ctx, -84 + i * 18, -84, 18, '255,150,60', 0.5 + 0.3 * Math.sin(t * 0.3 + i));
    for (let j = 0; j < 2; j++) { const ph = (t * 0.02 + j * 0.5 + i * 0.25) % 1; ctx.fillStyle = `rgba(90,90,100,${0.4 * (1 - ph)})`; ctx.beginPath(); ctx.arc(-86 + i * 18 - ph * 20, -90 - ph * 60, 6 + ph * 14, 0, TAU); ctx.fill(); }
  }
  // 동체
  F(ctx, PT.sm([-96, 4, -84, -38, -40, -60, 30, -58, 82, -34, 98, 0, 84, 36, 30, 54, -46, 52, -88, 34], 0.75), H, { ow: 2.6, gloss: 1, rim: 1, sh: 1.1 });
  ctx.strokeStyle = PT.rgba(H[0], 1); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-40, -58); ctx.quadraticCurveTo(-52, 0, -40, 52); ctx.moveTo(30, -58); ctx.quadraticCurveTo(44, 0, 30, 54); ctx.stroke();
  for (let i = 0; i < 6; i++) { PT.dot(ctx, -46, -44 + i * 17, 2.2, H[2]); PT.dot(ctx, 38, -44 + i * 17, 2.2, H[2]); }
  // 아래 경고 띠
  ctx.save(); ctx.beginPath(); ctx.moveTo(-80, 24); ctx.quadraticCurveTo(0, 46, 80, 24); ctx.lineTo(74, 38); ctx.quadraticCurveTo(0, 62, -74, 38); ctx.closePath(); ctx.clip();
  ctx.fillStyle = C('#e8a020'); ctx.fillRect(-90, 20, 180, 50); ctx.fillStyle = C('#1a1a20');
  for (let i = -6; i < 7; i++) { ctx.beginPath(); polyPath(ctx, [i * 16, 20, i * 16 + 8, 20, i * 16 - 6, 70, i * 16 - 14, 70]); ctx.fill(); }
  ctx.restore();
  // 미사일 포드
  const open = k.act === 'missiles' ? 1 : 0;
  F(ctx, PT.sm([-66, -46, -8, -50, -2, -92, -70, -88], 0.25), Lg, { ow: 2, gloss: 0.9, rim: 1 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x = -58 + i * 18, y = -84 + j * 18;
    F(ctx, PT.ell(x + 6, y + 6, 6.5, 6.5), C('#0c0e14'), { ow: 1.2, flat: true });
    if (open) { PT.dot(ctx, x + 6, y + 6, 4, '#ff6030'); PT.glow(ctx, x + 6, y + 6, 14, '255,110,40', 0.6); } else F(ctx, PT.poly([x + 6, y, x + 12, y + 6, x + 6, y + 12, x, y + 6]), C('#c84020'), { ow: 0.8 });
  }
  // 조종석 바이저
  F(ctx, PT.sm([34, -34, 90, -20, 100, 4, 92, 24, 38, 22, 30, -6], 0.5), C('#0e1220'), { ow: 2.2, gloss: 1.2 });
  PT.glow(ctx, 70, 0, 44 + visor * 34, el, 0.5 + visor * 0.5);
  ctx.fillStyle = `rgba(${el},0.95)`; ctx.beginPath(); polyPath(ctx, [46, -8, 92, -4, 92, 4, 46, 6]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(56, -3, 30, 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(44, -26); ctx.lineTo(84, -16); ctx.stroke();
  // 드릴 : 금속 원뿔 + 나선 홈
  const spin = (k.act === 'drill' ? t * 0.8 : t * 0.1) % 1;
  ctx.save(); ctx.translate(84, 30);
  F(ctx, PT.sm([-14, -30, 6, -34, 10, 34, -14, 30], 0.4), Lg, { ow: 2, gloss: 1 });
  const cone = PT.poly([6, -28, 124, 0, 6, 28]);
  F(ctx, cone, Dr, { ow: 2.2, gloss: 1.3, rim: 1 });
  ctx.save(); ctx.clip(cone); ctx.strokeStyle = PT.rgba(Dr[0], 1); ctx.lineWidth = 4;
  for (let i = -1; i < 6; i++) { const x = 6 + ((i + spin) / 5) * 118; ctx.beginPath(); ctx.moveTo(x, -30); ctx.quadraticCurveTo(x + 10, 0, x + 22, 30); ctx.stroke(); }
  ctx.strokeStyle = PT.rgba(Dr[2], 0.8); ctx.lineWidth = 1.6;
  for (let i = -1; i < 6; i++) { const x = 12 + ((i + spin) / 5) * 118; ctx.beginPath(); ctx.moveTo(x, -30); ctx.quadraticCurveTo(x + 10, 0, x + 22, 30); ctx.stroke(); }
  ctx.restore();
  if (k.act === 'drill') PT.glow(ctx, 124, 0, 40, '255,200,100', 0.7);
  ctx.restore();
  ctx.restore();
  legF(2); legF(3);
};

// ============================================================
//  4. 모래의 파라오 네크렘 : 떠 있는 미라 왕. 네메스 두건, 황금 가면, 거대한 황금 손
// ============================================================
CREATURES.pharaoh.draw = function (ctx, b, P, k) {
  const t = k.t, G = P.gold, Wr = P.wrap, Bl = P.blue, Fh = 80 + Math.sin(t * 0.05) * 10, F = PT.fill, C = c => BA.c(b, c);
  let lh = [130, -Fh - 100], rh = [-120, -Fh - 110], slam = 0;
  lh[1] += Math.sin(t * 0.07) * 8; rh[1] += Math.cos(t * 0.07) * 8;
  if (k.act === 'crush') {
    const f = k.af, lx = b.tgx !== undefined ? (b.tgx - b.x) * b.facing : 200;
    if (f < 48) { const e = DR.ease(f, 0, 20); lh = [lerp(130, lx + 50, e), lerp(lh[1], -380, e)]; rh = [lerp(-120, lx - 50, e), lerp(rh[1], -380, e)]; }
    else if (f < 70) { const e = DR.ease(f, 48, 53); lh = [lx + 50, lerp(-380, -30, e)]; rh = [lx - 50, lerp(-380, -30, e)]; slam = 1; }
    else { const e = DR.ease(f, 70, 90); lh = [lerp(lx + 50, 130, e), lerp(-30, -Fh - 100, e)]; rh = [lerp(lx - 50, -120, e), lerp(-30, -Fh - 110, e)]; }
  }
  if (k.act === 'orbs' || k.act === 'storm' || k.a === 'roar') { lh = [110, -Fh - 260]; rh = [-100, -Fh - 260]; }
  if (k.st === 'break') { lh = [80, -40]; rh = [-80, -40]; }
  const el = b.enraged ? '255,60,40' : b.elem, gold = { ow: 2, gloss: 1, rim: 1 };
  const G0 = [PT.dk(G[0], 0.3), G[0], G[1]];
  // 떠 있는 황금 손 : 손등 갑주 + 마디 손가락 + 청금석 + 손목의 마법 고리
  const hand = (x, y, back) => {
    const M = back ? G0 : G;
    ctx.save(); ctx.translate(x, y); ctx.scale(back ? -1 : 1, 1);
    // 손목 고리
    ctx.save(); ctx.scale(1, 0.35); ctx.strokeStyle = `rgba(${el},0.55)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-4, -100, 40, 0, TAU); ctx.stroke(); ctx.restore();
    PT.glow(ctx, -4, -34, 46, el, back ? 0.2 : 0.35);
    F(ctx, PT.sm([-24, -46, 18, -48, 22, -18, -26, -16], 0.4), M, gold);                                 // 팔찌
    ctx.fillStyle = C(Bl[1]); for (let i = 0; i < 4; i++) ctx.fillRect(-20 + i * 11, -42, 6, 22);
    // 손가락 (뒤 → 앞)
    for (let i = 0; i < 4; i++) {
      const x0 = -24 + i * 16, l = i === 0 || i === 3 ? 30 : 38, cx2 = x0 - 2 + i, sp = Math.sin(t * 0.05 + i) * 2;
      F(ctx, PT.cap(x0, 20, cx2, 20 + l * 0.55, 8, 7), M, gold);
      F(ctx, PT.cap(cx2, 20 + l * 0.55, cx2 - 3 + sp, 20 + l, 7, 5), M, gold);
      F(ctx, PT.poly([cx2 - 6 + sp, 18 + l, cx2 + 4 + sp, 18 + l, cx2 - 2 + sp, 30 + l]), C('#2a2018'), { ow: 1.2 });       // 검은 손톱
    }
    F(ctx, PT.sm([-34, -20, 32, -24, 40, 4, 34, 28, -30, 30, -38, 4], 0.6), M, gold);                       // 손등
    F(ctx, PT.cap(30, 4, 56, -18, 9, 7), M, gold); F(ctx, PT.cap(56, -18, 66, -38, 7, 5), M, gold);            // 엄지
    F(ctx, PT.ell(2, 2, 12, 12), Bl, { ow: 1.8, spec: 0.9 });
    ctx.strokeStyle = C(G[2]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(2, 2, 16, 0, TAU); ctx.stroke();
    PT.glow(ctx, 2, 2, 22, el, 0.5);
    ctx.restore();
  };
  hand(rh[0], rh[1], true);
  // 모래 소용돌이 + 흩날리는 붕대
  PT.glow(ctx, 0, -10, 100, '230,190,120', 0.4, 1.4, 0.4);
  for (let i = 0; i < 10; i++) { const a = t * 0.06 + i * 0.63, r = 30 + (i % 4) * 22; ctx.fillStyle = C(i % 2 ? '#d8b878' : '#a88848'); ctx.beginPath(); ctx.arc(Math.cos(a) * r, -16 - Math.sin(a) * r * 0.25 - (i % 3) * 18, 2 + (i % 3), 0, TAU); ctx.fill(); }
  ctx.save(); ctx.translate(0, -Fh);
  // 흘러내리는 붕대 꼬리
  for (let i = 0; i < 2; i++) {
    const pts = BA.wave(-8 + i * 14, 0, -50 + i * 26, 60, 6, 9, t * 0.08 + i * 2, 1.5);
    F(ctx, PT.strip(pts, 11, 3), Wr, { ow: 1.4, tex: 'cloth', ta: 0.5 });
  }
  // 몸 : 붕대 감긴 상체가 아래로 가늘어진다
  const body = PT.sm([-44, -172, 44, -172, 38, -100, 26, -30, 10, 30, -12, 30, -26, -30, -40, -100], 0.55);
  F(ctx, body, Wr, { ow: 2.2, tex: 'cloth', ta: 0.6, rim: 1 });
  ctx.save(); ctx.clip(body); ctx.strokeStyle = PT.rgba(Wr[0], 0.95); ctx.lineWidth = 2.2;
  for (let i = 0; i < 10; i++) { const y = -160 + i * 19; ctx.beginPath(); ctx.moveTo(-50, y + 8); ctx.quadraticCurveTo(0, y - 6 + (i % 2) * 6, 50, y - 4); ctx.stroke(); }
  ctx.strokeStyle = PT.rgba(Wr[2], 0.7); ctx.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) { const y = -156 + i * 19; ctx.beginPath(); ctx.moveTo(-50, y + 8); ctx.quadraticCurveTo(0, y - 6 + (i % 2) * 6, 50, y - 4); ctx.stroke(); }
  ctx.restore();
  // 황금 허리띠 + 늘어진 앞치마 (셴디트)
  F(ctx, PT.sm([-38, -104, 36, -104, 34, -88, -36, -88], 0.3), G, gold);
  F(ctx, PT.poly([-12, -90, 16, -90, 22, -30, 2, -18, -18, -30]), G, gold);
  ctx.fillStyle = C(Bl[1]); for (let i = 0; i < 4; i++) ctx.fillRect(-10 + i * 0, -82 + i * 14, 24, 6);
  // 넓은 목깃 (우세크) : 금 · 청금석 · 홍옥 띠
  ctx.save(); ctx.translate(0, -164);
  for (let r = 3; r >= 0; r--) {
    const w = 52 + r * 6, h = 14 + r * 9, col = [G, Bl, G, [C('#5a1010'), C('#b02828'), C('#ff6a5a')]][r];
    F(ctx, PT.path(p => { p.moveTo(-w, -6); p.quadraticCurveTo(0, h * 2.2, w, -6); p.lineTo(w * 0.7, -10); p.quadraticCurveTo(0, h * 1.2, -w * 0.7, -10); p.closePath(); }, [-w, -10, w, h * 1.2]), col, { ow: 1.6, gloss: r % 2 ? 0 : 0.8 });
  }
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + i * 0.0875); PT.dot(ctx, Math.cos(a) * 54, Math.sin(a) * 40 - 2, 2.4, C(G[2])); }
  ctx.restore();
  // 네메스 두건 : 금 · 청 줄무늬, 어깨로 늘어진 날개
  const nem = PT.sm([-56, -254, -20, -268, 38, -262, 52, -236, 60, -176, 42, -182, 30, -200, -28, -200, -48, -180, -70, -172, -62, -220], 0.5);
  F(ctx, nem, G, gold);
  ctx.save(); ctx.clip(nem); ctx.fillStyle = C(Bl[1]);
  for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(-70 + i * 16, -270); ctx.rotate(0.12); ctx.fillRect(0, 0, 7, 110); ctx.restore(); }
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-70, -270, 140, 14);
  ctx.restore();
  // 황금 가면 : 칠흑 눈화장, 빛나는 눈
  ctx.save(); ctx.translate(14, -222);
  F(ctx, PT.sm([-30, -28, 0, -32, 24, -26, 26, 4, 18, 24, 0, 34, -20, 24, -30, 0], 0.6), G, { ow: 2, gloss: 1.3, rim: 1, spec: 0.5 });
  ctx.fillStyle = C('#0c0a14');
  ctx.beginPath(); polyPath(ctx, [-8, -6, 4, -12, 20, -8, 24, -4, 6, -2, -6, -2]); ctx.fill();
  ctx.lineWidth = 2.4; ctx.strokeStyle = C('#0c0a14'); ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(28, -4); ctx.moveTo(-6, -16); ctx.quadraticCurveTo(8, -22, 24, -14); ctx.stroke();
  PT.glow(ctx, 9, -7, 40, el, 1);
  ctx.fillStyle = `rgba(${el},1)`; ctx.beginPath(); ctx.ellipse(9, -7, 6, 3, -0.1, 0, TAU); ctx.fill(); PT.dot(ctx, 10, -7, 1.8, '#ffffff');
  F(ctx, PT.poly([16, 2, 22, 10, 16, 12]), G0, { ow: 1 });                                           // 코
  ctx.strokeStyle = C(G[0]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(4, 18); ctx.quadraticCurveTo(12, 21, 18, 17); ctx.stroke();
  // 수염
  F(ctx, PT.sm([2, 28, 14, 28, 16, 56, 4, 58], 0.3), Bl, { ow: 1.6, gloss: 0.8 });
  ctx.strokeStyle = C(G[1]); ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(3, 34 + i * 6); ctx.lineTo(15, 34 + i * 6); ctx.stroke(); }
  ctx.restore();
  // 이마의 코브라 (우라에우스)
  ctx.save(); ctx.translate(20, -262);
  F(ctx, PT.sm([-8, 8, -10, -12, -2, -26, 8, -24, 10, -10, 6, 8], 0.6), G, gold);
  F(ctx, PT.sm([-4, -6, 0, -18, 6, -18, 6, -6], 0.6), Bl, { ow: 1 });
  PT.dot(ctx, 4, -20, 1.6, '#ff3020');
  ctx.restore();
  ctx.restore();
  hand(lh[0], lh[1], false);
  if (slam) PT.glow(ctx, (lh[0] + rh[0]) / 2, -20, 130, '255,220,140', 0.7, 1.2, 0.5);
};

// ============================================================
//  5. 역병 두꺼비 펜라 : 사마귀 · 독 고름 주머니 · 버섯이 돋은 거대 두꺼비
// ============================================================
CREATURES.toad.draw = function (ctx, b, P, k) {
  const t = k.t, S = P.skin, Bl = P.belly, Wt = P.wart, F = PT.fill, C = c => BA.c(b, c);
  let sq = 0, mouth = 0.05, tongue = 0, sac = 0;
  if (k.a === 'walk') sq = Math.sin(k.at * 0.2) * 0.06;
  if (k.act === 'flop') { const f = k.af; sq = f < 20 ? f / 20 * 0.3 : -0.2; }
  if (k.act === 'tongue') { const f = k.af; mouth = f > 26 ? 0.5 : 0.1; tongue = f < 30 ? 0 : f < 40 ? (f - 30) / 10 : f < 58 ? 1 : Math.max(0, 1 - (f - 58) / 8); if (b.grab) tongue = Math.max(0.2, 1 - (f - 40) / 18); }
  if (k.act === 'spit') { const f = k.af; sac = f < 30 ? f / 30 : Math.max(0, 1 - (f - 30) / 10); mouth = f > 28 ? 0.4 : 0.05; }
  if (k.a === 'roar' || k.act === 'roar') mouth = 0.6;
  if (k.st === 'break') sq = 0.3;
  const br = Math.sin(t * 0.06) * 3, skin = { ow: 2.4, tex: 'skin', ta: 0.55, rim: 1 }, S0 = [PT.dk(S[0], 0.3), S[0], S[1]];
  const pus = '170,255,80';
  ctx.save(); ctx.scale(1 + sq * 0.6, 1 - sq);
  // 뒷다리 : 접힌 굵은 허벅지 + 물갈퀴 발
  F(ctx, PT.sm([-130, -40, -112, -92, -60, -100, -20, -62, -30, -20, -90, -10], 0.75), S0, skin);
  F(ctx, PT.sm([-60, -12, -10, -20, 40, -10, 48, 2, -50, 4], 0.6), S0, { ow: 2 });
  for (let i = 0; i < 3; i++) F(ctx, PT.ell(26 + i * 10, 0, 7, 4), S0, { ow: 1.4 });
  // 몸통
  const body = PT.sm([-128, -60, -120, -130, -70, -176 - br, 10, -184 - br, 80, -160, 126, -112, 130, -60, 100, -16, 20, -4, -80, -10], 0.8);
  F(ctx, body, S, { ow: 2.8, tex: 'skin', ta: 0.6, rim: 1, sh: 1.1 });
  // 등의 진한 얼룩
  ctx.save(); ctx.clip(body);
  ctx.fillStyle = PT.rgba(S[0], 0.8);
  for (const [x, y, rx, ry] of [[-70, -150, 30, 16], [-20, -170, 22, 12], [30, -160, 26, 12], [-100, -110, 20, 14], [-40, -124, 18, 10]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.3, 0, TAU); ctx.fill(); }
  // 배
  F(ctx, PT.sm([20, -120, 90, -110, 126, -70, 110, -20, 40, -10, 0, -40], 0.8), Bl, { ow: 0, tex: 'skin', ta: 0.3 });
  ctx.strokeStyle = PT.rgba(Bl[0], 0.9); ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 6, -96 + i * 20); ctx.quadraticCurveTo(80, -84 + i * 22, 122, -92 + i * 22); ctx.stroke(); }
  ctx.restore();
  // 사마귀 · 독 고름
  const warts = [[-90, -140, 9], [-50, -160, 7], [-10, -176, 8], [30, -168, 6], [-110, -100, 7], [-70, -116, 10], [-30, -140, 6], [10, -150, 7], [60, -150, 5]];
  warts.forEach(([x, y, r], i) => {
    F(ctx, PT.ell(x, y - br * 0.5, r, r * 0.85), Wt, { ow: 1.4, spec: 0.8 });
    if (i % 3 === 0) { const pu = 0.6 + 0.4 * Math.sin(t * 0.1 + i); PT.glow(ctx, x, y - br * 0.5, r * 2.6, pus, 0.35 * pu); PT.dot(ctx, x + 1, y - br * 0.5 - 1, r * 0.45, C('#e8ff90')); }
  });
  // 등에 돋은 독버섯
  for (const [x, y, s] of [[-80, -168, 1], [-50, -178, 0.7], [-104, -150, 0.6]]) {
    ctx.save(); ctx.translate(x, y - br); ctx.scale(s, s);
    F(ctx, PT.cap(0, 0, 2, -16, 4, 3.4), [C('#a89a80'), C('#e8dcc0'), '#fff'], { ow: 1.4 });
    F(ctx, PT.sm([-14, -14, -8, -26, 6, -28, 16, -16, 0, -12], 0.8), [C('#4a1a5a'), C('#8a3aa8'), C('#c880e0')], { ow: 1.6, spec: 0.6 });
    PT.dot(ctx, -4, -22, 2, C('#e8c0ff')); PT.dot(ctx, 6, -20, 1.6, C('#e8c0ff'));
    ctx.restore();
  }
  // 앞다리 : 짧고 굵은 팔 + 물갈퀴 손
  F(ctx, PT.cap(72, -56, 94, -12, 18, 13), S, skin);
  F(ctx, PT.sm([74, -10, 120, -16, 134, -4, 130, 4, 76, 4], 0.6), S, { ow: 2 });
  for (let i = 0; i < 3; i++) F(ctx, PT.ell(112 + i * 9, 0, 6, 4), S, { ow: 1.4 });
  // 울음주머니
  if (sac > 0) {
    F(ctx, PT.ell(92, -38, 30 + sac * 26, 22 + sac * 20), [C('#8a9a3a'), C('#d8e080'), C('#f8ffc0')], { ow: 2, spec: 1 });
    ctx.strokeStyle = 'rgba(120,60,60,0.5)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(92, -38, 12 + i * 10 * sac, 0.4, 2.2); ctx.stroke(); }
    PT.glow(ctx, 92, -38, 60 * sac, pus, 0.45);
  }
  // 입 : 넓게 찢어진 입술
  ctx.save(); ctx.translate(112, -84);
  if (mouth > 0.08) {
    F(ctx, PT.path(p => { p.moveTo(-84, -4); p.quadraticCurveTo(-10, 4, 18, -2); p.quadraticCurveTo(0, 40 * mouth + 6, -84, -4); p.closePath(); }, [-84, -4, 18, 40 * mouth]), C('#4a0c18'), { ow: 2, flat: true });
    ctx.fillStyle = C('#a0304a'); ctx.beginPath(); ctx.ellipse(-30, 20 * mouth + 2, 26, 8 * mouth + 2, 0, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = PT.ol; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-90, -8); ctx.quadraticCurveTo(-14, 6, 18, -4); ctx.stroke();
  ctx.strokeStyle = PT.rgba(S[2], 0.8); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-84, -13); ctx.quadraticCurveTo(-14, -2, 14, -9); ctx.stroke();
  if (tongue > 0) {
    const L = 520 * tongue;
    F(ctx, PT.cap(0, 6, L, 26, 10, 14), [C('#a02840'), C('#e8506a'), C('#ff9aac')], { ow: 2, spec: 0.6 });
    F(ctx, PT.ell(L, 26, 24, 19), [C('#b02848'), C('#ff6a80'), C('#ffc0cc')], { ow: 2, spec: 1 });
    for (let i = 0; i < 3; i++) PT.dot(ctx, L - 10 + i * 8, 44 + ((t + i * 7) % 14), 2.4, 'rgba(200,255,140,0.8)');
  }
  ctx.restore();
  // 눈 : 머리 위로 툭 튀어나온 큰 눈, 금빛 홍채 · 가로 동공
  for (const [ex, ey, back] of [[-12, -170, 1], [42, -162, 0]]) {
    F(ctx, PT.ell(ex, ey - br, 26, 23), back ? S0 : S, { ow: 2.2, tex: 'skin', ta: 0.4 });
    F(ctx, PT.ell(ex + 4, ey - br - 3, 17, 15), [C('#8a6a10'), C(b.enraged ? '#ff5a30' : '#e8c430'), C('#fff0a0')], { ow: 1.4, sh: 0.6, spec: 0.0 });
    ctx.fillStyle = '#100808'; ctx.beginPath(); ctx.ellipse(ex + 5, ey - br - 3, 10, 4, 0, 0, TAU); ctx.fill();
    PT.dot(ctx, ex - 2, ey - br - 9, 3.4, '#ffffff'); PT.dot(ctx, ex + 10, ey - br + 3, 1.6, 'rgba(255,255,255,0.7)');
    F(ctx, PT.path(p => { p.moveTo(ex - 26, ey - br - 2); p.quadraticCurveTo(ex, ey - br - 34, ex + 26, ey - br - 4); p.quadraticCurveTo(ex, ey - br - 18, ex - 26, ey - br - 2); }, [ex - 26, ey - 30, ex + 26, ey]), back ? S0 : S, { ow: 1.6 });   // 눈꺼풀
  }
  if (b.enraged) PT.glow(ctx, 20, -160, 80, '255,60,40', 0.35);
  ctx.restore();
};

// ============================================================
//  6. 용광로 전차 이그니스 : 악마 얼굴의 용광로, 리벳 철판, 궤도, 포탑
// ============================================================
CREATURES.furnace.draw = function (ctx, b, P, k) {
  const t = k.t, I = P.iron, St = P.steel, T = P.tread, F = PT.fill, C = c => BA.c(b, c);
  const roll = (k.a === 'walk' || k.act === 'ram') ? k.at * (k.act === 'ram' ? 0.6 : 0.15) : 0;
  let heat = 0.5 + Math.sin(t * 0.1) * 0.15, cannon = -0.35, recoil = 0;
  if (k.act === 'flame') heat = 1;
  if (k.act === 'shells') { cannon = -0.7; recoil = [20, 40, 60].some(x => k.af >= x && k.af < x + 6) ? 12 : 0; }
  if (k.act === 'ram') heat = 1.2;
  if (k.st === 'break') heat = 0.1;
  const met = { ow: 2, gloss: 0.8, rim: 1 }, iron = { ow: 2.2, tex: 'skin', ta: 0.35, gloss: 0.5, rim: 1 }, brass = [C('#6a4a18'), C('#c89a40'), C('#ffe090')];
  const hot = `255,${120 + Math.min(1, heat) * 90 | 0},40`;
  // 굴뚝 (몸 뒤)
  for (const [sx, sh] of [[-74, 78], [-34, 58]]) {
    F(ctx, PT.sm([sx - 15, -200, sx + 15, -202, sx + 12, -200 - sh, sx - 12, -200 - sh], 0.2), St, met);
    F(ctx, PT.sm([sx - 19, -196 - sh, sx + 19, -196 - sh, sx + 22, -212 - sh, sx - 22, -212 - sh], 0.3), brass, met);
    F(ctx, PT.sm([sx - 14, -222 - sh, sx + 14, -222 - sh, sx + 16, -230 - sh, sx - 16, -230 - sh], 0.3), St, { ow: 1.6 });
    PT.glow(ctx, sx, -214 - sh, 26, '255,150,60', 0.4 * heat);
    for (let j = 0; j < 3; j++) { const ph = (t * 0.012 + j / 3 + sx * 0.01) % 1; ctx.fillStyle = `rgba(70,66,74,${0.45 * (1 - ph)})`; ctx.beginPath(); ctx.arc(sx - ph * 30, -230 - sh - ph * 90, 10 + ph * 22, 0, TAU); ctx.fill(); }
  }
  if (t % 8 === 0 && Game.state === 'play') FX.add('world', new Dust(b.x + b.facing * -70, sy(b.y, 290), rand(-0.3, 0.3), -1.2, 22, { col: '80,80,90', life: 70, a: 0.35 }));
  // 포탑 (보일러 뒤쪽 위)
  ctx.save(); ctx.translate(-10, -214); ctx.rotate(cannon);
  F(ctx, PT.sm([14 - recoil, -15, 120 - recoil, -13, 120 - recoil, 13, 14 - recoil, 15], 0.15), St, met);
  for (const x of [40, 80]) F(ctx, PT.sm([x - recoil, -17, x + 12 - recoil, -17, x + 12 - recoil, 17, x - recoil, 17], 0.2), brass, { ow: 1.4, gloss: 0.8 });
  F(ctx, PT.sm([112 - recoil, -19, 136 - recoil, -19, 136 - recoil, 19, 112 - recoil, 19], 0.2), St, met);
  ctx.fillStyle = '#060606'; ctx.beginPath(); ctx.ellipse(136 - recoil, 0, 4, 11, 0, 0, TAU); ctx.fill();
  if (recoil) PT.glow(ctx, 140, 0, 60, '255,200,90', 0.9);
  F(ctx, PT.ell(0, 0, 36, 28), St, Object.assign({ spec: 0.6 }, met));
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; PT.dot(ctx, Math.cos(a) * 26, Math.sin(a) * 20, 2.2, C(St[2])); }
  ctx.restore();
  // 무한궤도
  F(ctx, PT.sm([-124, -58, 112, -58, 134, -30, 114, 2, -124, 2, -142, -30], 0.45), T, { ow: 2.4, rim: 1 });
  ctx.save(); ctx.beginPath(); smoothPoly(ctx, [-124, -58, 112, -58, 134, -30, 114, 2, -124, 2, -142, -30], 0.45); ctx.clip();
  ctx.fillStyle = C(T[2]); const off = (roll * 7) % 14;
  for (let x = -150 + off; x < 140; x += 14) { ctx.fillRect(x, -58, 6, 6); ctx.fillRect(x - off * 2 + 7, -4, 6, 6); }
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const x = -106 + i * 42;
    F(ctx, PT.ell(x, -29, 19, 19), T, { ow: 1.6, gloss: 0.6 });
    F(ctx, PT.ell(x, -29, 10, 10), brass, { ow: 1.2, gloss: 1 });
    ctx.strokeStyle = C(T[0]); ctx.lineWidth = 3;
    for (let j = 0; j < 3; j++) { const a = roll + i + j * 2.094; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 11, -29 + Math.sin(a) * 11); ctx.lineTo(x + Math.cos(a) * 17, -29 + Math.sin(a) * 17); ctx.stroke(); }
  }
  // 보일러 동체
  const hull = PT.sm([-104, -56, 84, -56, 98, -120, 92, -200, 50, -218, -50, -222, -96, -208, -106, -130], 0.35);
  F(ctx, hull, I, Object.assign({ sh: 1.1 }, iron));
  ctx.save(); ctx.clip(hull);
  ctx.strokeStyle = PT.rgba(I[0], 1); ctx.lineWidth = 2.4;
  for (const y of [-100, -150, -190]) { ctx.beginPath(); ctx.moveTo(-110, y + 4); ctx.quadraticCurveTo(0, y - 8, 100, y + 2); ctx.stroke(); }
  ctx.fillStyle = C(I[2]);
  for (const y of [-106, -156, -196]) for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(-94 + i * 22, y + 2 + Math.abs(i - 4) * 0.6, 2.6, 0, TAU); ctx.fill(); }
  // 달아오른 철판 (열기)
  const hg = ctx.createRadialGradient(50, -128, 10, 50, -128, 120); hg.addColorStop(0, `rgba(${hot},${0.35 * heat})`); hg.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = hg; ctx.fillRect(-110, -230, 220, 180);
  ctx.restore();
  // 황동 띠 + 압력계
  F(ctx, PT.sm([-106, -70, 88, -70, 90, -58, -106, -58], 0.2), brass, { ow: 1.6, gloss: 1 });
  F(ctx, PT.ell(-60, -150, 18, 18), brass, { ow: 1.8, gloss: 1 });
  F(ctx, PT.ell(-60, -150, 12, 12), C('#f4ecd8'), { ow: 1, flat: true });
  PT.line(ctx, [-60, -150, -60 + Math.cos(-2.4 + heat * 2.6) * 10, -150 + Math.sin(-2.4 + heat * 2.6) * 10], C('#b01010'), 2);
  // 파이프
  PT.line(ctx, [-40, -150, -20, -150, -20, -200], C(St[0]), 9, 1.6); PT.line(ctx, [-40, -150, -20, -150, -20, -200], C(St[1]), 5);
  // 악마 얼굴 : 이글거리는 눈구멍 + 이빨 창살 화구
  for (const ex of [26, 70]) {
    F(ctx, PT.sm([ex - 16, -190, ex + 14, -186, ex + 14, -172, ex - 14, -174], 0.4), C('#160804'), { ow: 2, flat: true });
    PT.glow(ctx, ex, -180, 34, hot, 0.8 * heat + 0.2);
    ctx.fillStyle = `rgba(${hot},1)`; ctx.beginPath(); polyPath(ctx, [ex - 11, -184, ex + 10, -181, ex + 9, -176, ex - 10, -178]); ctx.fill();
  }
  F(ctx, PT.sm([-10, -196, 40, -204, 96, -192, 96, -186, 40, -194, -10, -188], 0.3), I, { ow: 1.8 });            // 성난 눈썹 철판
  const mouth = PT.sm([14, -164, 92, -164, 96, -84, 14, -84], 0.25);
  F(ctx, mouth, C('#1a0804'), { ow: 2.4, flat: true });
  ctx.save(); ctx.clip(mouth);
  const mg = ctx.createLinearGradient(0, -164, 0, -84); mg.addColorStop(0, `rgba(255,${200 + heat * 50 | 0},120,${0.6 + heat * 0.4})`); mg.addColorStop(1, `rgba(${hot},${0.5 + heat * 0.5})`);
  ctx.fillStyle = mg; ctx.fillRect(14, -164, 84, 80);
  for (let i = 0; i < 5; i++) { const ph = (t * 0.03 + i * 0.37) % 1; ctx.fillStyle = `rgba(255,255,200,${0.6 * (1 - ph)})`; ctx.beginPath(); ctx.arc(24 + i * 16, -90 - ph * 70, 4 + ph * 4, 0, TAU); ctx.fill(); }
  ctx.restore();
  PT.glow(ctx, 54, -124, 80 + heat * 60, '255,130,40', 0.35 + heat * 0.3);
  for (let i = 0; i < 5; i++) { const x = 20 + i * 16; F(ctx, PT.poly([x, -166, x + 12, -166, x + 6, -144 + (i % 2) * 6]), St, { ow: 1.4, gloss: 0.8 }); F(ctx, PT.poly([x, -82, x + 12, -82, x + 6, -102 - (i % 2) * 6]), St, { ow: 1.4, gloss: 0.8 }); }
  // 화염 노즐
  F(ctx, PT.sm([84, -80, 126, -88, 132, -76, 126, -58, 84, -60], 0.3), St, met);
  F(ctx, PT.sm([120, -90, 136, -90, 136, -56, 120, -56], 0.3), brass, met);
  PT.glow(ctx, 138, -73, 14, '120,180,255', 0.7);
  if (k.act === 'flame' && k.af >= 30 && k.af < 92) PT.glow(ctx, 140, -72, 60, '255,170,60', 1);
  if (b.enraged) PT.glow(ctx, 0, -130, 170, '255,80,30', 0.22);
};

// ============================================================
//  7. 천공의 심판자 세라핌 : 금빛 갑주의 천사, 깃털 날개 두 쌍, 가면, 후광, 날개 달린 창
// ============================================================
CREATURES.seraph.draw = function (ctx, b, P, k) {
  const t = k.t, R = P.robe, G = P.gold, Wg = P.wing, Fh = 70 + Math.sin(t * 0.06) * 10, F = PT.fill, C = c => BA.c(b, c);
  let spread = 0.3 + Math.sin(t * 0.08) * 0.08, spear = -1.1, armUp = 0;
  if (k.act === 'fan') spread = k.af < 26 ? 0.1 : 1;
  if (k.act === 'spears' || k.a === 'roar') { spear = -1.6; armUp = 1; spread = 0.7; }
  if (k.act === 'cross') { spread = 0.9; armUp = 0.5; }
  if (k.act === 'blink' && k.af > 40) spear = 0;
  if (k.st === 'break') spread = -0.2;
  const gold = { ow: 1.8, gloss: 1, rim: 1 }, hc = b.enraged ? '255,120,80' : '255,240,170';
  // 깃털 하나 : 길쭉한 잎 + 깃대
  const feather = (x, y, a, L, w, M) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    F(ctx, PT.sm([0, -w * 0.5, L * 0.5, -w, L, -w * 0.25, L * 1.04, 0, L, w * 0.4, L * 0.45, w * 0.9, 0, w * 0.5], 0.7), M, { ow: 1.3, sh: 0.7, hl: 1.4 });
    ctx.strokeStyle = PT.rgba(M[0], 0.9); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(L * 0.92, 0); ctx.stroke();
    ctx.restore();
  };
  // 날개 : 뿌리(ox,oy)에서 위로 퍼지는 칼깃 · 덮깃 층
  const wing = (ox, oy, s, back) => {
    const M = back ? [PT.dk(Wg[0], 0.25), Wg[0], Wg[1]] : Wg;
    const base = -Math.PI / 2 - 0.45 - spread * 0.45;
    for (let i = 0; i < 9; i++) { const a = base - i * 0.16, L = (150 - i * 9) * s; feather(ox + Math.cos(a) * 30 * s, oy + Math.sin(a) * 30 * s, a, L, 13 * s, M); }       // 칼깃
    for (let i = 0; i < 7; i++) { const a = base - 0.08 - i * 0.2, L = (84 - i * 5) * s; feather(ox + Math.cos(a) * 14 * s, oy + Math.sin(a) * 14 * s, a, L, 12 * s, [M[1], M[2], '#ffffff']); }   // 중간깃
    F(ctx, PT.sm([ox - 8 * s, oy + 6, ox + Math.cos(base - 0.6) * 60 * s, oy + Math.sin(base - 0.6) * 60 * s, ox + Math.cos(base - 0.2) * 70 * s, oy + Math.sin(base - 0.2) * 70 * s, ox + 10 * s, oy - 8], 0.8), [M[1], M[2], '#ffffff'], { ow: 1.4 });
    for (let i = 0; i < 6; i++) { const a = base - 0.1 - i * 0.22, r = 40 * s; F(ctx, PT.ell(ox + Math.cos(a) * r, oy + Math.sin(a) * r, 9 * s, 6 * s, a), [M[1], M[2], '#ffffff'], { ow: 1, sh: 0.5 }); }
    ctx.strokeStyle = C(G[1]); ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + Math.cos(base - 0.4) * 50 * s, oy + Math.sin(base - 0.4) * 60 * s, ox + Math.cos(base - 0.2) * 74 * s, oy + Math.sin(base - 0.2) * 74 * s); ctx.stroke();
  };
  ctx.save(); ctx.translate(0, -Fh);
  PT.glow(ctx, -40, -220, 190, '255,245,210', 0.35);
  wing(-14, -184, 1.25, true);
  wing(-8, -150, 1, false);
  // 로브 치마 : 아래로 빛이 되어 사라진다
  const robe = PT.sm([-42, -110, 42, -110, 56, -30, 40, 20, 6, 46, -20, 22, -56, -30], 0.6);
  F(ctx, robe, R, { ow: 2, tex: 'cloth', ta: 0.3, rim: 1 });
  ctx.save(); ctx.clip(robe);
  ctx.strokeStyle = PT.rgba(R[0], 0.9); ctx.lineWidth = 2; for (const x of [-26, -6, 18, 36]) { ctx.beginPath(); ctx.moveTo(x * 0.6, -100); ctx.quadraticCurveTo(x, -40, x * 1.1, 40); ctx.stroke(); }
  const fade = ctx.createLinearGradient(0, -40, 0, 46); fade.addColorStop(0, 'rgba(255,248,220,0)'); fade.addColorStop(1, 'rgba(255,248,220,0.95)');
  ctx.fillStyle = fade; ctx.fillRect(-60, -40, 120, 90);
  ctx.restore();
  F(ctx, PT.poly([-8, -110, 10, -110, 14, 30, 0, 44, -12, 30]), G, gold);                                // 금 앞자락
  ctx.strokeStyle = C(R[2]); ctx.lineWidth = 1.2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-6, -96 + i * 26); ctx.lineTo(1, -88 + i * 26); ctx.lineTo(8, -96 + i * 26); ctx.stroke(); }
  PT.glow(ctx, 0, 34, 70, '255,240,190', 0.85);
  // 흉갑 + 어깨갑
  F(ctx, PT.sm([-38, -186, 38, -186, 44, -150, 30, -110, -30, -110, -44, -150], 0.45), [C('#c8c2b4'), C('#f4f0e6'), '#ffffff'], { ow: 2, gloss: 0.9, rim: 1 });
  F(ctx, PT.sm([-30, -176, 0, -150, 30, -176, 26, -168, 0, -140, -26, -168], 0.3), G, gold);
  F(ctx, PT.poly([-4, -152, 4, -152, 2, -116, -2, -116]), G, { ow: 1.2, gloss: 1 });
  PT.glow(ctx, 0, -150, 22, hc, 0.6); F(ctx, PT.poly([0, -160, 6, -150, 0, -140, -6, -150]), C('#fffbe8'), { ow: 1, flat: true });
  F(ctx, PT.sm([-34, -112, 34, -112, 36, -102, -36, -102], 0.2), G, gold);                                 // 허리띠
  F(ctx, PT.sm([-58, -168, -40, -196, -16, -194, -18, -166, -40, -156], 0.6), G, gold);                     // 뒤 어깨갑
  // 팔 + 창
  const hx = 40, hy = -150 - armUp * 60;
  F(ctx, PT.cap(30, -172, hx, hy, 11, 9), [C(R[0]), C(R[1]), C(R[2])], { ow: 1.8, rim: 1 });
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(spear);
  F(ctx, PT.sm([-160, -3.5, 118, -3.5, 118, 3.5, -160, 3.5], 0.1), G, gold);
  for (const x of [-120, -40, 60]) F(ctx, PT.ell(x, 0, 6, 6), G, { ow: 1.2, gloss: 1 });
  F(ctx, PT.sm([108, -8, 122, -26, 132, -20, 124, -6], 0.4), G, gold); F(ctx, PT.sm([108, 8, 122, 26, 132, 20, 124, 6], 0.4), G, gold);   // 창날개
  F(ctx, PT.poly([118, -10, 186, 0, 118, 10, 126, 0]), [C('#c8c8d8'), C('#f4f6ff'), '#ffffff'], { ow: 1.6, gloss: 1.4 });
  PT.glow(ctx, 160, 0, 46, hc, 0.8);
  ctx.restore();
  F(ctx, PT.ell(hx, hy, 10, 9), G, { ow: 1.6, gloss: 1 });
  F(ctx, PT.sm([20, -186, 44, -194, 58, -174, 44, -158, 24, -164], 0.6), G, gold);                          // 앞 어깨갑
  // 머리 : 사기 가면 + 늘어진 금빛 베일
  ctx.save(); ctx.translate(6, -214);
  F(ctx, PT.sm([-22, -20, -6, -34, 16, -30, 26, -6, 20, 20, 2, 32, -18, 18, -26, -2], 0.7), G, gold);       // 두건
  F(ctx, PT.sm([-6, -24, 12, -24, 22, -4, 18, 18, 4, 26, -6, 14], 0.6), [C('#d8d2c8'), C('#fbf8f2'), '#ffffff'], { ow: 1.6, gloss: 0.7, spec: 0.6 });
  ctx.strokeStyle = C('#8a7a5a'); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(9, -3, 15, -6); ctx.moveTo(10, 10); ctx.lineTo(16, 10); ctx.stroke();
  for (let i = 0; i < 4; i++) PT.line(ctx, [-4 + i * 6, 22, -6 + i * 6, 44 + (i % 2) * 6], C(G[1]), 1.8);                    // 베일 사슬
  PT.neon(ctx, [6, -18, 6, -10], hc, 1.4, 0.9);
  ctx.restore();
  // 후광 : 고리 + 빛살
  ctx.save(); ctx.translate(0, -262);
  ctx.strokeStyle = C(G[0]); ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(0, 0, 36, 10, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = C(G[2]); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, 0, 36, 10, 0, 0, TAU); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + t * 0.01; PT.neon(ctx, [Math.cos(a) * 42, Math.sin(a) * 12, Math.cos(a) * 54, Math.sin(a) * 15], hc, 1.2, 0.6); }
  PT.glow(ctx, 0, 0, 70, hc, 0.6);
  ctx.restore();
  ctx.restore();
};

// ============================================================
//  8. 나락의 아가리 : 떠다니는 살덩이. 이빨 고리 입, 핏발 선 외눈, 빨판 촉수, 뿔 왕관
// ============================================================
CREATURES.maw.draw = function (ctx, b, P, k) {
  const t = k.t, Fl = P.flesh, Te = P.teeth, Tn = P.ten, Fh = 90 + Math.sin(t * 0.04) * 12, F = PT.fill, C = c => BA.c(b, c);
  let open = 0.25 + Math.sin(t * 0.07) * 0.08;
  if (k.act === 'devour') open = k.af < 20 ? k.af / 20 : k.af < 124 ? 1 : 0.3;
  if (k.act === 'orbs') open = k.af > 20 && k.af < 34 ? 0.9 : 0.2;
  if (k.a === 'roar' || k.act === 'roar') open = 1;
  if (k.st === 'break') open = 0.05;
  const gz = k.act === 'gaze', ec = b.enraged ? '255,48,16' : gz ? '255,60,200' : '190,110,255', flesh = { ow: 2.6, tex: 'skin', ta: 0.5, rim: '#c890ff' };
  ctx.save(); ctx.translate(0, -Fh - 110);
  // 촉수 (빨판)
  const tent = (i, back) => {
    const x0 = -76 + i * 30, L = 130 + (i % 3) * 34, pts = [];
    for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push(x0 + Math.sin(t * 0.06 + i + u * 3) * 26 * u + (back ? -10 : 0), 70 + L * u); }
    F(ctx, PT.strip(pts, 13, 2.5), back ? [PT.dk(Tn[0], 0.4), Tn[0], Tn[1]] : Tn, { ow: 1.8, rim: 1 });
    if (!back) for (let j = 2; j < 9; j++) PT.dot(ctx, pts[j * 2] + 4 - j * 0.3, pts[j * 2 + 1], 3.4 - j * 0.3, C(Tn[2]));
  };
  for (let i = 0; i < 6; i += 2) tent(i + 0.5, true);
  // 뿔 왕관 (몸 뒤)
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.18 + i * 0.11); BA.horn(ctx, Math.cos(a) * 96, Math.sin(a) * 90, a - 0.1, 50 + (i % 2) * 22, 11, -0.5, [C('#2a1a2a'), C('#6a5a6a'), C('#b8a8b8')]); }
  // 몸
  const body = PT.ell(0, 0, 122, 112);
  F(ctx, body, Fl, Object.assign({ sh: 1.1 }, flesh));
  ctx.save(); ctx.clip(body);
  ctx.strokeStyle = PT.rgba(Tn[1], 0.55); ctx.lineWidth = 2.2;
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 130, Math.sin(a) * 120); ctx.quadraticCurveTo(Math.cos(a + 0.5) * 70, Math.sin(a + 0.5) * 60, Math.cos(a + 0.2) * 30, Math.sin(a + 0.2) * 30); ctx.stroke(); }
  for (let i = 0; i < 9; i++) { const x = -90 + (i * 47) % 170, y = -80 + (i * 61) % 160, pu = 0.6 + 0.4 * Math.sin(t * 0.08 + i); PT.glow(ctx, x, y, 12, '200,140,255', 0.5 * pu); PT.dot(ctx, x, y, 2.4, `rgba(240,210,255,${pu})`); }
  ctx.restore();
  // 작은 눈들
  for (const [x, y, r, ph] of [[-70, -40, 9, 0], [-80, 20, 7, 2], [-40, -84, 7, 4], [80, -40, 6, 1]]) {
    const bl = ((t + ph * 40) % 200) < 8 ? 0.15 : 1;
    F(ctx, PT.ell(x, y, r, r * bl), C('#f0e0d8'), { ow: 1.4, sh: 0.6 });
    if (bl > 0.5) { PT.dot(ctx, x + r * 0.2, y, r * 0.55, `rgba(${ec},1)`); PT.dot(ctx, x + r * 0.25, y, r * 0.2, '#100410'); }
  }
  for (let i = 0; i < 6; i += 2) tent(i, false);
  // 입 : 잇몸 + 두 겹 이빨 고리 + 목구멍 빛
  const mr = 30 + open * 52;
  F(ctx, PT.ell(40, 32, mr + 14, (mr + 14) * 0.82), [C('#3a0a2a'), C('#8a2a5a'), C('#d06a9a')], { ow: 2, sh: 0.7 });
  ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.ellipse(40, 32, mr, mr * 0.8, 0, 0, TAU); ctx.fill();
  const tg = ctx.createRadialGradient(40, 32, 0, 40, 32, mr); tg.addColorStop(0, `rgba(190,90,255,${0.5 + open * 0.4})`); tg.addColorStop(0.5, 'rgba(90,20,140,0.4)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(40, 32, mr, mr * 0.8, 0, 0, TAU); ctx.fill();
  for (const [rr, n, ln] of [[mr * 0.62, 10, 12], [mr, 16, 20]]) {
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + (rr < mr ? 0.2 : 0), x = 40 + Math.cos(a) * rr, y = 32 + Math.sin(a) * rr * 0.8, l = ln * (0.8 + open * 0.4);
      F(ctx, PT.poly([x + Math.sin(a) * 6, y - Math.cos(a) * 5, x - Math.cos(a) * l, y - Math.sin(a) * l * 0.85, x - Math.sin(a) * 6, y + Math.cos(a) * 5]), Te, { ow: 1.1, sh: 0.6, hl: 1.5 });
    }
  }
  // 외눈 : 핏발 선 흰자, 홍채, 세로 동공, 무거운 눈꺼풀
  ctx.save(); ctx.translate(18, -70);
  F(ctx, PT.ell(0, 0, 44, 36), Fl, { ow: 2.2, tex: 'skin', ta: 0.4 });
  const ew = PT.ell(4, 2, 34, 26 * (gz ? 1 : 0.86));
  F(ctx, ew, [C('#c8b0b0'), C('#f6eee8'), '#ffffff'], { ow: 1.8, sh: 0.8 });
  ctx.save(); ctx.clip(ew); ctx.strokeStyle = 'rgba(190,30,50,0.7)'; ctx.lineWidth = 1.1;
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(4 + Math.cos(a) * 36, 2 + Math.sin(a) * 28); ctx.quadraticCurveTo(4 + Math.cos(a + 0.3) * 24, 2 + Math.sin(a + 0.3) * 18, 4 + Math.cos(a) * 16, 2 + Math.sin(a) * 12); ctx.stroke(); }
  const ix = 12 + Math.sin(t * 0.02) * 4;
  const ig = ctx.createRadialGradient(ix, 2, 2, ix, 2, 18); ig.addColorStop(0, '#ffffff'); ig.addColorStop(0.25, `rgba(${ec},1)`); ig.addColorStop(1, PT.dk(b.enraged ? '#ff3010' : '#a040e0', 0.4));
  ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ix, 2, 18, 0, TAU); ctx.fill();
  ctx.fillStyle = '#100410'; ctx.beginPath(); ctx.ellipse(ix + 1, 2, gz ? 3 : 5, 15, 0, 0, TAU); ctx.fill();
  PT.dot(ctx, ix - 7, -6, 4, 'rgba(255,255,255,0.9)');
  ctx.restore();
  F(ctx, PT.path(p => { p.moveTo(-34, -2); p.quadraticCurveTo(4, -48, 42, -4); p.quadraticCurveTo(4, gz ? -34 : -22, -34, -2); }, [-34, -40, 42, 0]), Fl, { ow: 1.8, tex: 'skin', ta: 0.4 });
  PT.glow(ctx, ix, 2, 50, ec, gz ? 1 : 0.45);
  ctx.restore();
  ctx.restore();
};

// ============================================================
//  9. 종말의 화룡 카오스 : 근육질 몸, 비막 날개, 등가시, 뿔 왕관, 용암빛 비늘 틈
// ============================================================
CREATURES.dragon.draw = function (ctx, b, P, k) {
  const t = k.t, S = P.scale, Wg = P.wing, Bl = P.belly, Hn = P.horn, F = PT.fill, C = c => BA.c(b, c);
  const walk = k.a === 'walk' ? k.at * 0.14 : 0;
  let headX = 200, headY = -230, jaw = 0.1, wingUp = 0.2 + Math.sin(t * 0.06) * 0.1, tailA = Math.sin(t * 0.05) * 0.2, lift = 0;
  if (k.act === 'breath') { const f = k.af; if (f < 30) { headX = 170; headY = -260; } else if (f < 100) { headX = 230; headY = -170; jaw = 0.6; } }
  if (k.act === 'gust') wingUp = 0.2 + Math.sin(k.af * 0.4) * 1.0;
  if (k.act === 'spin') tailA = k.af < 30 ? -0.4 : (k.af - 30) * 0.35;
  if (k.act === 'dive') wingUp = Math.sin(k.af * 0.35) * 1.2;
  if (k.a === 'roar' || k.act === 'roar') { headY = -290; jaw = 0.7; wingUp = 1; }
  if (k.st === 'break') { headY = -120; headX = 180; lift = 30; }
  const scl = { ow: 2.4, tex: 'scale', ta: 0.45, rim: 1 }, S0 = [PT.dk(S[0], 0.35), S[0], S[1]], lava = b.enraged ? '255,60,30' : '255,150,50';
  ctx.save(); ctx.translate(0, lift);
  // 날개 : 팔뼈 → 손목(발톱) → 손가락뼈 네 개, 사이에 찢긴 비막
  const wing = (dx, s, back) => {
    const M = back ? [PT.dk(Wg[0], 0.3), Wg[0], Wg[1]] : Wg, bone = back ? S0 : S;
    const a = -1.2 - wingUp * 0.6, sx = dx, sy2 = -182;
    const ex = sx - 40 * s + Math.cos(a - 0.5) * 70 * s, ey = sy2 + Math.sin(a - 0.5) * 70 * s;        // 팔꿈치
    const wx = ex + Math.cos(a) * 110 * s, wy = ey + Math.sin(a) * 110 * s;                              // 손목
    const tips = [];
    for (let i = 0; i < 4; i++) { const fa = a - 0.05 - i * 0.52 - wingUp * 0.05 * i, L = (200 - i * 26) * s; tips.push(wx + Math.cos(fa) * L, wy + Math.sin(fa) * L); }
    const root = [sx - 110 * s, -150 + wingUp * 16];
    // 비막 (손가락 사이가 오목하게 처진다)
    const mem = new Path2D(); mem.moveTo(sx, sy2); mem.lineTo(ex, ey); mem.lineTo(wx, wy); mem.lineTo(tips[0], tips[1]);
    let px = tips[0], py = tips[1];
    for (let i = 1; i < 5; i++) {
      const nx = i < 4 ? tips[i * 2] : root[0], ny = i < 4 ? tips[i * 2 + 1] : root[1];
      const mx = (px + nx) / 2, my = (py + ny) / 2, cx = mx + (wx - mx) * 0.32, cy = my + (wy - my) * 0.32;
      mem.quadraticCurveTo(cx, cy, nx, ny); px = nx; py = ny;
    }
    mem.lineTo(sx - 40, -150); mem.closePath();
    mem.bb = [Math.min(tips[6], root[0], sx - 40), Math.min(tips[1], wy, tips[3]), Math.max(sx, tips[0]), Math.max(root[1], sy2)];
    F(ctx, mem, M, { ow: 2, sh: 0.5, rim: 1 });
    ctx.save(); ctx.clip(mem); ctx.strokeStyle = PT.rgba(M[0], 0.6); ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo((wx + tips[i * 2]) / 2 + 14, (wy + tips[i * 2 + 1]) / 2 + 20, root[0] + (tips[i * 2] - root[0]) * 0.5, root[1] + (tips[i * 2 + 1] - root[1]) * 0.6); ctx.stroke(); }
    ctx.restore();
    F(ctx, PT.cap(sx, sy2, ex, ey, 11 * s, 8 * s), bone, scl);
    F(ctx, PT.cap(ex, ey, wx, wy, 8 * s, 6 * s), bone, scl);
    for (let i = 0; i < 4; i++) F(ctx, PT.cap(wx, wy, tips[i * 2], tips[i * 2 + 1], 4.5 * s, 2 * s), bone, { ow: 1.6 });
    BA.horn(ctx, wx, wy, a - 1.2, 26 * s, 6 * s, 0.6, Hn);
  };
  wing(-10, 0.9, true);
  // 꼬리 : 가늘어지는 띠 + 등가시 + 스페이드 끝
  ctx.save(); ctx.translate(-118, -122); ctx.rotate(tailA);
  const tl = BA.wave(0, 0, -270, 70, 12, 22, t * 0.05, 1.4);
  F(ctx, PT.strip(tl, 30, 6), S, scl);
  for (let i = 1; i < 11; i++) BA.horn(ctx, tl[i * 2], tl[i * 2 + 1] - (30 - i * 2.2) * 0.8, -1.9, 22 - i * 1.4, 6 - i * 0.35, -0.3, Hn, { ow: 1.2 });
  F(ctx, PT.sm([tl[24] + 6, tl[25] - 5, tl[24] - 18, tl[25] - 24, tl[24] - 58, tl[25] + 2, tl[24] - 18, tl[25] + 24, tl[24] + 6, tl[25] + 5], 0.25), S, { ow: 2, rim: 1 });
  ctx.restore();
  // 다리 : 굵은 허벅지 + 역관절 + 발톱 셋
  const leg = (x, ph, back) => {
    const M = back ? S0 : S, s = Math.sin(walk + ph) * 18, lf = Math.max(0, Math.cos(walk + ph)) * (walk ? 10 : 0);
    F(ctx, PT.sm([x - 30, -140, x + 28, -138, x + 22 + s * 0.5, -70, x - 10 + s * 0.5, -56, x - 34, -90], 0.75), M, scl);
    F(ctx, PT.cap(x + 6 + s * 0.5, -66, x + s - 4, -16 - lf, 15, 11), M, scl);
    F(ctx, PT.sm([x + s - 18, -22 - lf, x + s + 14, -22 - lf, x + s + 22, -2 - lf, x + s - 16, -2 - lf], 0.5), M, { ow: 2 });
    for (let i = 0; i < 3; i++) BA.horn(ctx, x + s + 8 + i * 9, -6 - lf, 0.5, 14, 4, 0.9, Hn, { ow: 1.2 });
  };
  leg(-70, 0, true); leg(60, 1.6, true);
  // 등가시 (몸 뒤에서 솟음)
  for (let i = 0; i < 7; i++) BA.horn(ctx, -90 + i * 30, -178 + Math.abs(i - 3) * 3, -1.75 + i * 0.05, 34 + (i % 2) * 12, 9, -0.35, Hn);
  // 몸통
  const body = PT.sm([-140, -132, -110, -180, -30, -192, 70, -186, 136, -152, 140, -110, 100, -72, 0, -64, -100, -76, -136, -96], 0.8);
  F(ctx, body, S, Object.assign({ sh: 1.1 }, scl));
  ctx.save(); ctx.clip(body);
  F(ctx, PT.sm([-110, -84, -20, -100, 90, -104, 140, -96, 120, -60, -100, -60], 0.6), Bl, { ow: 1.4, sh: 0.7 });
  ctx.strokeStyle = PT.rgba(Bl[0], 0.9); ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const x = -90 + i * 26; ctx.beginPath(); ctx.moveTo(x, -98); ctx.quadraticCurveTo(x + 6, -82, x + 2, -60); ctx.stroke(); }
  // 비늘 틈의 용암빛
  for (const pts of [[-60, -150, -40, -136, -50, -118], [10, -160, 30, -148, 24, -128], [70, -150, 86, -140, 80, -122]]) PT.neon(ctx, pts, lava, 1.6, 0.55 + 0.25 * Math.sin(t * 0.09 + pts[0]));
  ctx.restore();
  leg(-40, 3.1, false); leg(90, 4.7, false);
  // 목 : 굵은 S자 + 배 비늘
  const nk = []; for (let i = 0; i <= 8; i++) { const u = i / 8; nk.push(lerp(100, headX - 26, u) + Math.sin(u * Math.PI) * -16, lerp(-150, headY + 22, u) + Math.sin(u * Math.PI) * -10); }
  for (let i = 1; i < 8; i++) BA.horn(ctx, nk[i * 2] - 10, nk[i * 2 + 1] - 22 + i, -2.1, 20, 6, -0.3, Hn, { ow: 1.2 });
  F(ctx, PT.strip(nk, 36, 24), S, scl);
  const nb = nk.map((v, i) => i % 2 ? v + 12 : v + 10);
  F(ctx, PT.strip(nb, 16, 11), Bl, { ow: 1.2, sh: 0.6 });
  // 머리
  ctx.save(); ctx.translate(headX, headY);
  BA.horn(ctx, -26, -18, -2.55, 82, 12, 0.85, Hn);                                                        // 뒤 큰 뿔
  for (let i = 0; i < 3; i++) BA.horn(ctx, -32, -4 + i * 10, 2.9 - i * 0.2, 34 - i * 6, 7, -0.3, Hn, { ow: 1.4 });   // 뺨 가시
  ctx.save(); ctx.translate(-8, 8); ctx.rotate(jaw * 0.6);
  F(ctx, PT.sm([-20, 0, 30, 2, 80, 8, 84, 14, 40, 26, -16, 22], 0.5), S0, scl);
  ctx.fillStyle = C('#4a0a0a'); ctx.beginPath(); smoothPoly(ctx, [6, 2, 76, 8, 70, 12, 10, 10], 0.5); ctx.fill();
  PT.teeth(ctx, 24, 4, 78, 9, 6, -8);
  ctx.restore();
  if (jaw > 0.3) { ctx.fillStyle = C('#5a0c06'); ctx.beginPath(); polyPath(ctx, [-6, 10, 80, 10, 40, 40]); ctx.fill(); PT.glow(ctx, 40, 18, 40, lava, 0.6); }
  F(ctx, PT.sm([-40, 10, -38, -22, -8, -36, 34, -32, 66, -20, 96, -12, 100, 4, 70, 12, 20, 14, -24, 20], 0.55), S, Object.assign({ spec: 0.3 }, scl));
  PT.teeth(ctx, 26, 10, 94, 6, 7, 10);
  F(ctx, PT.sm([-10, -32, 44, -34, 60, -22, 30, -16, -4, -20], 0.6), S0, { ow: 1.8, tex: 'scale', ta: 0.3 });        // 눈썹뼈
  ctx.fillStyle = '#140806'; ctx.beginPath(); polyPath(ctx, [16, -18, 32, -24, 44, -18, 32, -12]); ctx.fill();
  PT.glow(ctx, 31, -18, 34, b.enraged ? '255,60,30' : '255,200,80', 0.95);
  ctx.fillStyle = C('#ffd040'); ctx.beginPath(); polyPath(ctx, [19, -18, 32, -22, 42, -18, 32, -14]); ctx.fill();
  ctx.fillStyle = '#100808'; ctx.fillRect(30, -22, 3, 8);
  BA.horn(ctx, 0, -30, -2.3, 92, 12, 1.0, Hn);                                                            // 앞 큰 뿔
  BA.horn(ctx, 70, -18, -1.6, 22, 6, -0.4, Hn, { ow: 1.4 });                                              // 코뿔
  PT.dot(ctx, 92, -6, 3, '#140806');
  for (let i = 0; i < 2; i++) { const ph = (t * 0.02 + i * 0.5) % 1; ctx.fillStyle = `rgba(80,70,70,${0.4 * (1 - ph)})`; ctx.beginPath(); ctx.arc(96 + ph * 20, -10 - ph * 40, 4 + ph * 10, 0, TAU); ctx.fill(); }
  if (k.act === 'breath' && k.af >= 30 && k.af < 100) { PT.glow(ctx, 100, 12, 90, '255,160,60', 1); PT.glow(ctx, 80, 14, 40, '255,240,200', 0.7); }
  ctx.restore();
  wing(30, 1.1, false);
  ctx.restore();
};

// ============================================================
//  10. 피의 백작 드라큘 : 높은 깃 망토(진홍 안감), 조끼와 크라바트, 창백한 얼굴, 긴 손톱
// ============================================================
CREATURES.vampire.draw = function (ctx, b, P, k) {
  const t = k.t, Cp = P.cape, In = P.inner, Sk = P.skin, Su = P.suit, F = PT.fill, C = c => BA.c(b, c);
  const walk = k.a === 'walk' ? Math.sin(k.at * 0.2) : 0;
  let capeF = 0.2 + Math.sin(t * 0.07) * 0.1, arm = 0, lean = 0;
  if (k.act === 'claws') { const f = k.af; arm = [20, 32, 46].some(x => f >= x && f < x + 6) ? 1 : 0.3; lean = 0.1; }
  if (k.act === 'drain' || k.act === 'spikes' || k.a === 'roar') { capeF = 1; arm = -1; }
  if (k.st === 'break') lean = -0.2;
  const cloth = { ow: 2, tex: 'cloth', ta: 0.35, rim: '#ff5070' }, gold = [C('#6a4a10'), C('#d8a840'), C('#fff0a0')];
  ctx.save(); ctx.rotate(lean);
  // 망토 : 박쥐 날개처럼 끝이 갈라진 자락
  const cw = capeF, hem = [];
  for (let i = 0; i <= 5; i++) { const u = i / 5; hem.push(lerp(-92 - cw * 70, 12, u), -8 - Math.sin(u * Math.PI * 5) * 10 * (1 - u) - (i % 2 ? 14 : 0)); }
  const capeOut = [20, -194, -20, -196, -62 - cw * 64, -150, -84 - cw * 72, -60].concat(hem);
  F(ctx, PT.sm(capeOut, 0.45), Cp, cloth);
  const capeIn = [10, -186, -14, -188, -50 - cw * 56, -146, -70 - cw * 64, -60, -76 - cw * 62, -18, 2, -18];
  F(ctx, PT.sm(capeIn, 0.5), In, { ow: 0, tex: 'cloth', ta: 0.3, gloss: 0.5 });
  ctx.strokeStyle = PT.rgba(In[0], 0.9); ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-10 - i * 8, -176); ctx.quadraticCurveTo(-40 - cw * 40 - i * 6, -100, -40 - cw * 50 - i * 10, -22); ctx.stroke(); }
  // 다리 : 바지 + 광택 나는 구두
  for (const [x, s, back] of [[-6, -walk, 1], [8, walk, 0]]) {
    const M = back ? [PT.dk(Su[0], 0.3), Su[0], Su[1]] : Su;
    F(ctx, PT.cap(x, -98, x + s * 14, -10, 9, 6.5), M, { ow: 1.8, rim: 1 });
    F(ctx, PT.sm([x + s * 14 - 7, -12, x + s * 14 + 6, -14, x + s * 14 + 18, -4, x + s * 14 + 16, 0, x + s * 14 - 8, 0], 0.5), [C('#050408'), C('#16121e'), C('#5a5470')], { ow: 1.6, gloss: 1.2 });
  }
  // 몸통 : 연미복 + 진홍 조끼
  F(ctx, PT.sm([-12, -104, -40, -40, -18, -46, 0, -100], 0.4), Su, { ow: 1.6, rim: 1 });                // 연미복 꼬리
  F(ctx, PT.sm([-22, -98, 22, -98, 28, -150, 26, -182, -24, -184, -28, -150], 0.45), Su, { ow: 2, rim: 1, tex: 'cloth', ta: 0.25 });
  F(ctx, PT.poly([-4, -178, 16, -178, 18, -112, 4, -104, -6, -112]), In, { ow: 1.4, gloss: 0.6 });
  for (let i = 0; i < 3; i++) PT.dot(ctx, 6, -160 + i * 16, 2, C(gold[1]));
  F(ctx, PT.sm([-2, -184, 14, -184, 18, -170, 6, -160, -4, -170], 0.6), [C('#c8c0d0'), C('#f4f0f8'), '#ffffff'], { ow: 1.4 });     // 크라바트
  F(ctx, PT.ell(6, -172, 4.5, 4.5), [C('#5a0010'), C('#d01030'), C('#ff8090')], { ow: 1.2, spec: 1 });                         // 루비 브로치
  PT.glow(ctx, 6, -172, 12, '255,30,60', 0.4);
  // 높은 깃
  F(ctx, PT.sm([-30, -176, -46, -236, -30, -226, -8, -192], 0.4), Cp, { ow: 1.6, rim: '#ff5070' });
  F(ctx, PT.sm([-26, -182, -38, -226, -12, -196], 0.4), In, { ow: 0 });
  // 머리
  ctx.save(); ctx.translate(6, -206);
  F(ctx, PT.sm([-13, -6, -10, -18, 4, -22, 15, -14, 17, 2, 10, 16, 2, 20, -8, 12], 0.75), Sk, { ow: 2, sh: 0.8, spec: 0.3 });
  F(ctx, PT.poly([-10, -2, -22, -12, -12, 6]), Sk, { ow: 1.4 });                                       // 뾰족귀
  // 올백 머리 + 이마 V
  F(ctx, PT.sm([-16, 2, -18, -14, -6, -26, 10, -26, 20, -16, 14, -14, 8, -10, 2, -16, -6, -12, -10, -2], 0.6), [C('#050308'), C('#141020'), C('#3a3450')], { ow: 1.6, gloss: 1 });
  ctx.fillStyle = C('#1a0810'); ctx.beginPath(); polyPath(ctx, [6, -4, 15, -6, 15, -2, 7, -1]); ctx.fill();
  PT.glow(ctx, 11, -3, 22, '255,30,50', 0.95);
  ctx.fillStyle = '#ff2030'; ctx.beginPath(); polyPath(ctx, [7, -3, 14, -5, 14, -2, 8, -1.6]); ctx.fill();
  ctx.strokeStyle = C('#4a3a50'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(15, -9); ctx.moveTo(15, 3); ctx.lineTo(16, 7); ctx.stroke();
  ctx.strokeStyle = C('#5a1020'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(7, 11); ctx.quadraticCurveTo(11, 12, 15, 10); ctx.stroke();
  F(ctx, PT.poly([9, 11, 10.5, 16, 12, 11]), '#ffffff', { ow: 0.8, flat: true }); F(ctx, PT.poly([13, 10.6, 14, 14.5, 15, 10.4]), '#ffffff', { ow: 0.8, flat: true });
  ctx.restore();
  // 팔 + 긴 손톱
  const hx = 30 + arm * 40, hy = arm < 0 ? -220 : -130 - arm * 20;
  const [ex, ey] = BA.ik(16, -170, hx, hy, 30, -1);
  F(ctx, PT.cap(16, -170, ex, ey, 8, 7), Su, { ow: 1.8, rim: 1 });
  F(ctx, PT.cap(ex, ey, hx, hy, 7, 6), Su, { ow: 1.8, rim: 1 });
  F(ctx, PT.sm([hx - 6, hy - 6, hx - 2, hy - 8, hx + 2, hy + 6, hx - 6, hy + 6], 0.5), [C('#c8c0d0'), C('#f4f0f8'), '#fff'], { ow: 1.2 });   // 소매 레이스
  F(ctx, PT.ell(hx + 4, hy, 6, 5), Sk, { ow: 1.4 });
  for (let i = 0; i < 4; i++) BA.horn(ctx, hx + 6, hy - 4 + i * 3, -0.5 + i * 0.32, 24 + arm * 8, 2.6, 0.5, [C('#2a0810'), C('#6a1828'), C('#c05060')], { ow: 1 });
  if (arm > 0.9) PT.glow(ctx, hx + 24, hy, 46, '255,40,70', 0.8);
  ctx.restore();
};

// ============================================================
//  11. 프리즘 핵 크리스탈로스 : 결정 왕관과 결정 덩굴이 붙은 거대한 다면체 핵, 안쪽의 눈
// ============================================================
CREATURES.crystal.draw = function (ctx, b, P, k) {
  const t = k.t, Fh = 70 + Math.sin(t * 0.05) * 12, spin = t * 0.03, F = PT.fill, C = c => BA.c(b, c);
  let orb = 110, glowA = 0.5;
  if (k.act === 'nova') orb = k.af < 30 ? 110 - k.af * 2 : 170;
  if (k.act === 'prism') glowA = k.af > 30 ? 1 : 0.7;
  if (k.st === 'break') orb = 60;
  const ec = b.enraged ? '255,90,160' : '230,220,255';
  // 결정 하나 : 길쭉한 육각 기둥 (면 셋 + 반짝임)
  const prism = (x, y, a, L, w, c, ow = 1.6) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const out = PT.poly([0, -w, L * 0.8, -w, L, 0, L * 0.8, w, 0, w, -w * 0.4, 0]);
    F(ctx, out, c, { ow, sh: 0, hl: 0, grad: false });
    ctx.fillStyle = C(c[2]); ctx.beginPath(); polyPath(ctx, [0, -w, L * 0.8, -w, L, 0, L * 0.8, -w * 0.15, 0, -w * 0.15]); ctx.fill();
    ctx.fillStyle = PT.rgba(c[0], 0.85); ctx.beginPath(); polyPath(ctx, [0, w * 0.45, L * 0.8, w * 0.45, L, 0, L * 0.8, w, 0, w]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -w * 0.6); ctx.lineTo(L * 0.7, -w * 0.6); ctx.stroke();
    ctx.restore();
  };
  ctx.save(); ctx.translate(0, -Fh - 110);
  const shard = (i, front) => {
    const a = spin + i * TAU / 6, x = Math.cos(a) * orb, y = Math.sin(a) * orb * 0.35;
    if ((Math.sin(a) > 0) !== front) return;
    const c = i % 2 ? P.c1 : P.c2;
    prism(x, y + 26, -Math.PI / 2 + Math.sin(a * 2) * 0.2, 60, 11, front ? c : [PT.dk(c[0], 0.3), c[0], c[1]]);
    PT.glow(ctx, x, y, 26, i % 2 ? '160,200,255' : '255,160,255', front ? 0.35 : 0.15);
  };
  for (let i = 0; i < 6; i++) shard(i, false);
  PT.glow(ctx, 0, 0, 190, '190,170,255', 0.3 + glowA * 0.25);
  // 아래로 늘어진 결정 덩이
  for (const [x, a, L, c] of [[-26, 1.8, 70, P.c2], [0, 1.57, 96, P.c1], [24, 1.3, 64, P.c2], [-10, 2.1, 40, P.c1]]) prism(x, 80, a, L, 12, c);
  // 핵 : 다면체 (면마다 다른 빛), 반투명 안쪽
  const pts = [0, -116, 58, -34, 44, 64, 0, 116, -44, 64, -58, -34];
  F(ctx, PT.poly(pts), P.core, { ow: 2.6, sh: 0, hl: 0, grad: false });
  const facet = (a, c) => { ctx.fillStyle = C(c); ctx.beginPath(); polyPath(ctx, a); ctx.fill(); };
  facet([0, -116, 58, -34, 8, -14], P.c1[2]); facet([0, -116, -58, -34, 8, -14], P.c2[1]);
  facet([58, -34, 44, 64, 8, -14], P.c1[1]); facet([-58, -34, -44, 64, 8, -14], P.core[0]);
  facet([44, 64, 0, 116, 8, -14], P.c2[2]); facet([-44, 64, 0, 116, 8, -14], P.c1[0]);
  // 안쪽 굴절 빛줄기
  ctx.save(); ctx.beginPath(); polyPath(ctx, pts); ctx.clip();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) { const a = t * 0.02 + i * 1.26; ctx.fillStyle = `rgba(${i % 2 ? '255,180,255' : '160,220,255'},0.16)`; ctx.beginPath(); ctx.moveTo(8, -14); ctx.lineTo(8 + Math.cos(a) * 160, -14 + Math.sin(a) * 160); ctx.lineTo(8 + Math.cos(a + 0.18) * 160, -14 + Math.sin(a + 0.18) * 160); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let i = 0; i < 12; i += 2) { ctx.moveTo(pts[i], pts[i + 1]); ctx.lineTo(8, -14); } ctx.stroke();
  // 안쪽의 두 눈
  PT.glow(ctx, 8, -14, 70, ec, 0.6 + glowA * 0.3);
  for (const ex of [-8, 24]) { ctx.fillStyle = 'rgba(30,10,60,0.85)'; ctx.beginPath(); polyPath(ctx, [ex - 13, -16, ex + 13, -22, ex + 11, -8, ex - 11, -6]); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); polyPath(ctx, [ex - 8, -13, ex + 9, -18, ex + 7, -11, ex - 7, -9]); ctx.fill(); }
  // 결정 왕관
  for (const [x, a, L, c] of [[-30, -2.2, 56, P.c2], [0, -1.57, 84, P.c1], [30, -0.95, 60, P.c2], [-14, -1.85, 44, P.c1], [16, -1.25, 46, P.c1]]) prism(x * 0.6, -100, a, L, 10, c);
  // 반짝임
  for (let i = 0; i < 4; i++) { const ph = (t * 0.02 + i * 0.25) % 1, s = Math.sin(ph * Math.PI) * 9, x = [30, -34, 20, -10][i], y = [-70, 10, 50, -40][i]; ctx.fillStyle = '#ffffff'; ctx.beginPath(); polyPath(ctx, [x, y - s, x + s * 0.25, y, x, y + s, x - s * 0.25, y]); ctx.fill(); ctx.beginPath(); polyPath(ctx, [x - s, y, x, y - s * 0.25, x + s, y, x, y + s * 0.25]); ctx.fill(); }
  for (let i = 0; i < 6; i++) shard(i, true);
  ctx.restore();
};

// ============================================================
//  12. 심해의 군주 크라켄 : 얼룩 외투막, 발광점, 가로 동공 눈, 빨판 줄 촉수, 부리
// ============================================================
CREATURES.kraken.draw = function (ctx, b, P, k) {
  const t = k.t, S = P.skin, Su = P.sucker, F = PT.fill, C = c => BA.c(b, c);
  let rise = 0, siphon = 0;
  if (k.act === 'ink') siphon = k.af > 20 && k.af < 50 ? 1 : 0;
  if (k.a === 'roar' || k.act === 'roar') rise = -30;
  if (k.st === 'break') rise = 40;
  const skin = { ow: 2.4, tex: 'skin', ta: 0.5, rim: '#a8f0ff' }, S0 = [PT.dk(S[0], 0.4), S[0], S[1]];
  ctx.save(); ctx.translate(0, rise);
  // 촉수 : 가늘어지는 띠 + 아랫면 빨판 줄 + 말린 끝
  const tent = (x0, ph, len, back, curl) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(x0 + Math.sin(u * 3 + t * 0.05 + ph) * 40 * u + u * len * 0.6 + (u > 0.85 ? Math.sin((u - 0.85) * 20) * 18 : 0), -50 - Math.sin(u * Math.PI) * 140 * curl + u * 44 - (u > 0.85 ? (u - 0.85) * 120 : 0)); }
    F(ctx, PT.strip(pts, 26, 4), back ? S0 : S, skin);
    for (let i = 1; i < 11; i++) {
      const a = Math.max(0, i - 1) * 2, c = (i + 1) * 2, dx = pts[c] - pts[a], dy = pts[c + 1] - pts[a + 1], l = Math.hypot(dx, dy) || 1, w = 26 + (4 - 26) * i / 12;
      const x = pts[i * 2] - dy / l * w * 0.55, y = pts[i * 2 + 1] + dx / l * w * 0.55, r = 5.4 - i * 0.38;
      F(ctx, PT.ell(x, y, r, r), back ? [PT.dk(Su[0], 0.3), Su[0], Su[1]] : Su, { ow: 1.2, sh: 0.6 });
      ctx.fillStyle = PT.rgba(S[0], 0.8); ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, TAU); ctx.fill();
    }
  };
  tent(-170, 0, 260, true, 0.7); tent(-130, 2, 300, true, 1);
  // 외투막 : 길쭉한 머리 + 지느러미 + 얼룩
  F(ctx, PT.sm([-120, -270, -150, -330, -96, -312], 0.6), S0, skin);
  F(ctx, PT.sm([20, -300, 50, -350, 54, -296], 0.6), S0, skin);
  const mantle = PT.sm([-150, -150, -146, -250, -110, -310, -40, -334, 20, -310, 60, -240, 70, -150, 40, -60, -60, -50, -130, -80], 0.85);
  F(ctx, mantle, S, Object.assign({ sh: 1.1 }, skin));
  ctx.save(); ctx.clip(mantle);
  ctx.fillStyle = PT.rgba(S[0], 0.7);
  for (const [x, y, r] of [[-90, -260, 22], [-40, -290, 14], [0, -230, 18], [-110, -190, 16], [-60, -210, 10], [20, -170, 12]]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0.4, 0, TAU); ctx.fill(); }
  for (let i = 0; i < 10; i++) { const x = -120 + (i * 37) % 170, y = -300 + (i * 53) % 220, pu = 0.5 + 0.5 * Math.sin(t * 0.07 + i * 1.3); PT.glow(ctx, x, y, 14, '120,240,255', 0.5 * pu); PT.dot(ctx, x, y, 2.6, `rgba(200,255,255,${0.6 + pu * 0.4})`); }
  ctx.restore();
  // 눈 : 노란 눈, 가로 동공, 두꺼운 눈두덩
  for (const [ex, ey, back] of [[-40, -150, 1], [18, -162, 0]]) {
    F(ctx, PT.ell(ex, ey, 32, 27), back ? S0 : S, skin);
    F(ctx, PT.ell(ex + 3, ey + 1, 22, 18), [C('#8a7a20'), C(b.enraged ? '#ff7040' : '#f0e070'), C('#fffbd0')], { ow: 1.6, sh: 0.6 });
    ctx.fillStyle = '#080404'; ctx.beginPath(); ctx.ellipse(ex + 4, ey + 1, 15, 4.5, 0.05, 0, TAU); ctx.fill();
    PT.dot(ctx, ex - 6, ey - 7, 4, 'rgba(255,255,255,0.9)');
    F(ctx, PT.path(p => { p.moveTo(ex - 30, ey - 2); p.quadraticCurveTo(ex, ey - 40, ex + 30, ey - 6); p.quadraticCurveTo(ex, ey - 22, ex - 30, ey - 2); }, [ex - 30, ey - 30, ex + 30, ey]), back ? S0 : S, { ow: 1.6 });
    PT.glow(ctx, ex, ey, 36, b.enraged ? '255,80,40' : '255,230,120', 0.4);
  }
  // 부리
  F(ctx, PT.sm([-24, -100, 10, -104, 30, -90, 4, -74, -20, -84], 0.5), [C('#1a1010'), C('#3a2a24'), C('#7a6a5a')], { ow: 1.8, gloss: 0.8 });
  // 수관
  F(ctx, PT.cap(56, -152, 96, -172, 17, 12), S, skin);
  ctx.fillStyle = '#04121a'; ctx.beginPath(); ctx.ellipse(98, -173, 5, 9, 0.4, 0, TAU); ctx.fill();
  if (siphon) PT.glow(ctx, 100, -174, 46, '20,20,40', 0.8);
  tent(-60, 4, 320, false, 0.5); tent(0, 1, 280, false, 0.35);
  ctx.restore();
};

// ============================================================
//  13. 목 없는 기사 모르타 : 마갑을 두른 유령마, 초록 불꽃 갈기, 판금 기수, 목의 불기둥, 마상창
// ============================================================
CREATURES.horseman.draw = function (ctx, b, P, k) {
  const t = k.t, Hs = P.horse, A = P.armor, Cp = P.cape, F = PT.fill, C = c => BA.c(b, c);
  const gal = (k.a === 'walk' || k.act === 'joust') ? k.at * (k.act === 'joust' ? 0.45 : 0.2) : 0;
  let rear = 0, lance = 0;
  if (k.act === 'reap') { rear = k.af < 30 ? k.af / 30 : k.af < 50 ? 1 - (k.af - 30) / 20 : 0; lance = k.af > 30 && k.af < 50 ? (k.af - 30) * 0.3 : 0; }
  if (k.st === 'break') rear = -0.3;
  const gf = '120,255,200', met = { ow: 2, gloss: 0.9, rim: '#9affd8' }, hs = { ow: 2.2, rim: '#9affd8', tex: 'skin', ta: 0.3 }, H0 = [PT.dk(Hs[0], 0.35), Hs[0], Hs[1]];
  // 유령 불꽃 (위로 흔들리며 사라지는 혀)
  const flame = (x, y, w, h, a = 1) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ph = t * 0.15 + i * 2.1, s = 1 - i * 0.28;
      ctx.fillStyle = i === 2 ? `rgba(230,255,245,${0.8 * a})` : `rgba(${gf},${(0.35 + i * 0.15) * a})`;
      ctx.beginPath(); ctx.moveTo(x - w * s, y);
      ctx.quadraticCurveTo(x - w * s * 0.9, y - h * s * 0.5, x + Math.sin(ph) * w * 0.5, y - h * s);
      ctx.quadraticCurveTo(x + w * s * 0.9, y - h * s * 0.45, x + w * s, y); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  ctx.save(); ctx.globalAlpha *= 0.95;
  ctx.translate(-20, -110); ctx.rotate(-rear * 0.45); ctx.translate(20, 110);
  // 다리 : 앞뒤 관절 + 굽 + 굽의 불꽃
  const leg = (x, ph, back, front) => {
    const M = back ? H0 : Hs, s = Math.sin(gal + ph), kx = x + s * 26 + (front ? 4 : -6), fx = x + s * 18 + 8;
    F(ctx, PT.sm([x - 18, -118, x + 16, -116, kx + 10, -56, kx - 8, -50], 0.6), M, hs);
    F(ctx, PT.cap(kx, -52, fx, -10, 7.5, 5.5), M, hs);
    F(ctx, PT.sm([fx - 9, -14, fx + 9, -14, fx + 11, 0, fx - 10, 0], 0.4), [C('#0a0a0e'), C('#2a2a34'), C('#5a5a6a')], { ow: 1.6, gloss: 0.8 });
    flame(fx, 0, 10, 18 + Math.sin(t * 0.3 + ph) * 4, back ? 0.5 : 0.8);
  };
  leg(-70, 0, true, false); leg(50, 1.5, true, true);
  // 꼬리 불꽃
  for (let i = 0; i < 3; i++) { const pts = BA.wave(-104, -132, -170 + i * 6, -60 + i * 10, 6, 12, t * 0.12 + i, 1.5); ctx.save(); ctx.globalCompositeOperation = 'lighter'; PT.curve(ctx, pts, `rgba(${gf},${0.35 - i * 0.08})`, 14 - i * 3); ctx.restore(); }
  // 몸통 + 마갑 (사슬 · 판금 · 가장자리 천)
  const body = PT.sm([-112, -128, -80, -166, 20, -170, 90, -150, 100, -112, 60, -84, -40, -80, -104, -96], 0.8);
  F(ctx, body, Hs, Object.assign({ sh: 1.1 }, hs));
  F(ctx, PT.sm([-96, -150, -40, -168, 50, -164, 84, -146, 80, -110, 20, -98, -60, -100, -100, -112], 0.6), Cp, { ow: 2, tex: 'cloth', ta: 0.4, rim: 1 });
  ctx.fillStyle = C(Cp[0]); for (let i = 0; i < 9; i++) { const x = -96 + i * 21; ctx.beginPath(); polyPath(ctx, [x, -108 + Math.abs(i - 4) * 0.8, x + 14, -108 + Math.abs(i - 4) * 0.8, x + 7, -94 + (i % 2) * 6]); ctx.fill(); }
  ctx.strokeStyle = C(A[2]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-94, -146); ctx.quadraticCurveTo(-10, -170, 82, -142); ctx.stroke();
  for (let i = 0; i < 6; i++) PT.dot(ctx, -70 + i * 28, -152 - Math.sin(i / 5 * Math.PI) * 10, 2.4, C(A[2]));
  leg(-50, 3, false, false); leg(70, 4.6, false, true);
  // 목 + 머리 : 판금 목갑, 말머리 투구 (샹프롱)
  F(ctx, PT.sm([56, -150, 90, -134, 124, -196, 104, -226, 80, -214], 0.6), Hs, hs);
  for (let i = 0; i < 4; i++) F(ctx, PT.sm([70 + i * 9, -162 - i * 14, 98 + i * 6, -152 - i * 16, 104 + i * 5, -164 - i * 16, 78 + i * 8, -176 - i * 14], 0.4), A, met);
  ctx.save(); ctx.translate(112, -206); ctx.rotate(0.35);
  F(ctx, PT.sm([-16, -14, 20, -18, 52, -6, 58, 6, 50, 16, 10, 16, -14, 10], 0.55), Hs, hs);
  F(ctx, PT.sm([-10, -16, 24, -20, 54, -6, 50, 2, 20, -4, -8, -2], 0.4), A, met);
  BA.horn(ctx, 4, -16, -1.9, 26, 5, -0.4, A, { ow: 1.4 });
  ctx.fillStyle = '#04100c'; ctx.beginPath(); polyPath(ctx, [14, -8, 26, -12, 28, -4, 16, -2]); ctx.fill();
  PT.glow(ctx, 22, -7, 24, gf, 0.95); PT.dot(ctx, 22, -7, 3.4, '#d8fff0');
  PT.dot(ctx, 54, 6, 2, '#04100c');
  ctx.restore();
  // 갈기 불꽃
  for (let i = 0; i < 5; i++) flame(72 + i * 9, -168 - i * 11, 9, 26 + Math.sin(t * 0.2 + i) * 6, 0.9);
  // 기수 : 판금 몸통, 찢긴 망토, 어깨갑
  const cw = Math.sin(t * 0.08) * 10;
  const capePts = [-26, -250, -96, -230 + cw, -118, -190 + cw, -112, -146, -96, -158, -84, -142, -70, -156, -30, -160];
  F(ctx, PT.sm(capePts, 0.5), Cp, { ow: 2, tex: 'cloth', ta: 0.4, rim: 1 });
  F(ctx, PT.cap(-6, -150, 18, -110, 12, 10), A, met);                                                  // 다리 (말 위)
  F(ctx, PT.sm([18, -116, 30, -118, 36, -100, 16, -98], 0.4), A, met);
  F(ctx, PT.sm([-30, -150, 30, -150, 36, -196, 30, -252, -28, -256, -34, -200], 0.4), A, Object.assign({ tex: 'metal', ta: 0.3 }, met));
  F(ctx, PT.sm([-24, -200, 28, -200, 26, -170, -22, -170], 0.3), A, met);                               // 복부 판
  ctx.strokeStyle = C(A[0]); ctx.lineWidth = 2; for (const y of [-226, -184, -160]) { ctx.beginPath(); ctx.moveTo(-28, y); ctx.lineTo(30, y); ctx.stroke(); }
  F(ctx, PT.sm([-16, -244, 12, -244, 8, -206, -4, -200, -14, -206], 0.4), Cp, { ow: 1.4 });           // 서코트
  // 목의 불기둥
  F(ctx, PT.ell(0, -258, 26, 10), A, met);
  ctx.fillStyle = '#04100c'; ctx.beginPath(); ctx.ellipse(0, -259, 18, 6, 0, 0, TAU); ctx.fill();
  flame(0, -258, 18, 62 + Math.sin(t * 0.17) * 8, 1);
  PT.glow(ctx, 0, -290, 50, gf, 0.5);
  // 창 : 원뿔 손잡이 덮개(밤플레이트) + 깃발
  ctx.save(); ctx.translate(20, -200); ctx.rotate(-0.08 + lance);
  F(ctx, PT.sm([-40, -4, 240, -3, 240, 3, -40, 4], 0.1), [C('#20140c'), C('#4a3020'), C('#8a6a4a')], { ow: 1.6, tex: 'wood', ta: 0.4 });
  const fl = Math.sin(t * 0.2) * 6;
  F(ctx, PT.sm([150, -4, 196, -10 + fl, 186, -2 + fl, 200, 8 + fl, 150, 4], 0.4), Cp, { ow: 1.4 });
  F(ctx, PT.poly([16, -20, 56, -4, 56, 4, 16, 20]), A, met);
  F(ctx, PT.poly([226, -12, 296, 0, 226, 12, 232, 0]), [C('#5a6470'), C('#d0d8e0'), '#ffffff'], { ow: 1.6, gloss: 1.3 });
  PT.glow(ctx, 270, 0, 26, gf, 0.4);
  ctx.restore();
  F(ctx, PT.sm([8, -238, 38, -248, 52, -226, 36, -208, 12, -212], 0.6), A, met);                       // 앞 어깨갑
  F(ctx, PT.cap(30, -222, 26, -196, 9, 8), A, met);
  F(ctx, PT.ell(24, -198, 10, 9), A, met);
  ctx.restore();
};

// ============================================================
//  14. 태고의 식인초 플로라 : 가시 덩굴 줄기, 핏빛 속살의 두 턱과 섬모 이빨, 뿌리 덩이
// ============================================================
CREATURES.flytrap.draw = function (ctx, b, P, k) {
  const t = k.t, S = P.stem, J = P.jaw, In = P.inner, F = PT.fill, C = c => BA.c(b, c);
  let hx = 60 + Math.sin(t * 0.04) * 14, hy = -250 + Math.cos(t * 0.05) * 10, open = 0.3 + Math.sin(t * 0.08) * 0.1;
  if (k.act === 'bite') { const f = k.af; if (f < 34) { hx = 0; hy = -280; open = 0.8; } else if (f < 46) { const e = DR.ease(f, 34, 40); hx = lerp(0, 440, e); hy = lerp(-280, -90, e); open = 1 - e; } else { const e = DR.ease(f, 46, 64); hx = lerp(440, 60, e); hy = lerp(-90, -250, e); open = 0.1; } }
  if (k.act === 'seeds' || k.act === 'pollen' || k.a === 'roar') open = 0.9;
  if (k.st === 'break') { hy = -110; hx = 90; open = 0; }
  const leaf = { ow: 2, rim: 1 }, S0 = [PT.dk(S[0], 0.3), S[0], S[1]], wood = [C('#1e140a'), C('#4a3420'), C('#7a5a3a')];
  // 뿌리
  for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.8, pts = [0, -8, Math.sin(a) * 50, 0, Math.sin(a) * 100, 4 + Math.cos(a) * 4, Math.sin(a) * 150, 6 + Math.cos(a) * 8]; F(ctx, PT.strip(pts, 9, 2), wood, { ow: 1.6, tex: 'wood', ta: 0.4 }); }
  // 큰 잎 (톱니 가장자리 + 잎맥)
  const bigLeaf = (a, s, back) => {
    ctx.save(); ctx.translate(0, -44); ctx.rotate(a + Math.sin(t * 0.05 + a) * 0.05); ctx.scale(s, s);
    const pts = [0, 0]; for (let i = 1; i <= 8; i++) pts.push(i * 19, -Math.sin(i / 9 * Math.PI) * 30 - (i % 2) * 5); pts.push(168, 0); for (let i = 8; i >= 1; i--) pts.push(i * 19, Math.sin(i / 9 * Math.PI) * 24 + (i % 2) * 4);
    F(ctx, PT.sm(pts, 0.5), back ? S0 : S, leaf);
    ctx.strokeStyle = PT.rgba(S[0], 0.9); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(80, -4, 160, 0); ctx.stroke();
    ctx.lineWidth = 1.2; for (let i = 1; i < 7; i++) { ctx.beginPath(); ctx.moveTo(i * 22, -1); ctx.lineTo(i * 22 + 14, -18 * Math.sin(i / 7 * Math.PI)); ctx.moveTo(i * 22, 1); ctx.lineTo(i * 22 + 14, 14 * Math.sin(i / 7 * Math.PI)); ctx.stroke(); }
    ctx.restore();
  };
  bigLeaf(-2.0, 0.8, true); bigLeaf(-2.5, 1, true);
  // 뿌리 덩이
  F(ctx, PT.sm([-56, -4, -50, -50, -10, -70, 30, -60, 56, -20, 40, 0], 0.8), S0, { ow: 2.4, tex: 'skin', ta: 0.4, rim: 1 });
  // 줄기 : 꼬인 덩굴 + 가시
  const st = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = 1 - u; st.push(a * a * a * 0 + 3 * a * a * u * -60 + 3 * a * u * u * 80 + u * u * u * (hx - 30), a * a * a * -20 + 3 * a * a * u * -120 + 3 * a * u * u * -170 + u * u * u * (hy + 30)); }
  F(ctx, PT.strip(st, 24, 16), S, { ow: 2.4, rim: 1 });
  ctx.strokeStyle = PT.rgba(S[0], 0.8); ctx.lineWidth = 3;
  for (let i = 1; i < 14; i += 2) { const x = st[i * 2], y = st[i * 2 + 1]; ctx.beginPath(); ctx.moveTo(x - 16, y - 6); ctx.quadraticCurveTo(x, y + 8, x + 16, y + 2); ctx.stroke(); }
  for (let i = 2; i < 13; i += 2) { const x = st[i * 2], y = st[i * 2 + 1], s2 = i % 4 ? 1 : -1; BA.horn(ctx, x + s2 * 18, y, s2 > 0 ? -0.4 : Math.PI + 0.4, 16, 4.5, s2 * -0.4, [C('#5a2a1a'), C('#b07a4a'), C('#f0d0a0')], { ow: 1.2 }); }
  bigLeaf(-0.7, 1.1, false);
  // 머리 : 두 턱 (바깥 초록, 안쪽 핏빛), 섬모 이빨
  ctx.save(); ctx.translate(hx, hy);
  const jaw = (s) => {
    ctx.save(); ctx.rotate(-s * open * 0.7);
    const out = PT.sm([-30, 0, -10, -s * 40, 30, -s * 62, 80, -s * 50, 112, -s * 14, 116, 0], 0.7);
    F(ctx, out, J, { ow: 2.4, tex: 'skin', ta: 0.35, rim: 1 });
    F(ctx, PT.sm([-18, 0, 10, -s * 40, 70, -s * 38, 104, -s * 8, 104, 0], 0.7), In, { ow: 1.2, sh: 0.7, gloss: 0.5 });
    ctx.fillStyle = PT.rgba(In[2], 0.7); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(14 + i * 18, -s * (18 + Math.sin(i * 1.7) * 6), 2.2, 0, TAU); ctx.fill(); }
    // 섬모 이빨
    for (let i = 0; i < 9; i++) { const x = -6 + i * 13, l = 22 + Math.sin(i * 2.1) * 5; BA.horn(ctx, x, -s * 2, s > 0 ? 1.45 : -1.45, l, 3.6, s * 0.1, [C('#b8b090'), C('#f4eedc'), '#ffffff'], { ow: 1 }); }
    ctx.restore();
  };
  if (open > 0.2) { ctx.fillStyle = C('#3a0a14'); ctx.beginPath(); ctx.ellipse(46, 0, 50, 40 * open, 0, 0, TAU); ctx.fill(); }
  jaw(-1); jaw(1);
  F(ctx, PT.sm([-44, -14, -24, -20, -20, 20, -44, 14], 0.6), S, { ow: 2 });                                // 턱 경첩
  PT.glow(ctx, 46, 0, 60, b.enraged ? '255,60,80' : '255,140,180', 0.3 + open * 0.35);
  ctx.restore();
};

// ============================================================
//  15. 시간의 지배자 크로나르크 : 아치형 황동 시계함, 드러난 톱니, 종 왕관, 칼날 추, 피스톤 다리
// ============================================================
CREATURES.clock.draw = function (ctx, b, P, k) {
  const t = k.t, Br = P.brass, Fc = P.face, Dk = P.dark, F = PT.fill, C = c => BA.c(b, c);
  const walk = k.a === 'walk' ? Math.sin(k.at * 0.1) : 0;
  let pend = Math.sin(t * 0.05) * 0.35, handA = t * 0.02;
  if (k.act === 'pendulum') { const f = k.af; pend = f < 30 ? -0.9 * f / 30 : f < 60 ? -0.9 + 1.8 * DR.ease(f, 34, 44) - (f > 46 ? 1.8 * DR.ease(f, 46, 56) : 0) : 0; }
  if (k.act === 'hands') handA = k.af * 0.06;
  if (k.st === 'break') pend = 0.6;
  const met = { ow: 2, gloss: 1, rim: 1 }, glow = b.enraged ? '255,80,40' : '150,230,255', B0 = [PT.dk(Br[0], 0.3), Br[0], Br[1]];
  const gear = (x, y, r, n, a, M, hole = true) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const g = new Path2D(); for (let i = 0; i < n * 2; i++) { const aa = i / (n * 2) * TAU, rr = i % 2 ? r : r * 0.82; g.lineTo(Math.cos(aa - 0.08) * rr, Math.sin(aa - 0.08) * rr); g.lineTo(Math.cos(aa + 0.08) * rr, Math.sin(aa + 0.08) * rr); } g.closePath(); g.bb = [-r, -r, r, r]; g.th = r * 2;
    F(ctx, g, M, met);
    if (hole) { ctx.fillStyle = C(Dk[0]); for (let i = 0; i < 5; i++) { const aa = i / 5 * TAU; ctx.beginPath(); ctx.arc(Math.cos(aa) * r * 0.5, Math.sin(aa) * r * 0.5, r * 0.16, 0, TAU); ctx.fill(); } }
    F(ctx, PT.ell(0, 0, r * 0.22, r * 0.22), Dk, { ow: 1.4, gloss: 1 });
    ctx.restore();
  };
  // 다리 : 피스톤 + 받침 발
  for (const [x, s, back] of [[-34, -walk, 1], [34, walk, 0]]) {
    const M = back ? B0 : Br, fx = x + s * 16 + (x > 0 ? 4 : -4);
    F(ctx, PT.cap(x, -132, fx, -20, 12, 9), back ? Dk : [Dk[1], Dk[2], Br[1]], met);
    F(ctx, PT.cap(x, -128, (x + fx) / 2, -76, 15, 13), M, met);
    F(ctx, PT.ell((x + fx) / 2, -74, 11, 11), M, met);
    F(ctx, PT.sm([fx - 22, -22, fx + 22, -22, fx + 28, 0, fx - 26, 0], 0.4), M, met);
  }
  // 추 : 칼날 원반 (몸통 아래)
  ctx.save(); ctx.translate(0, -130); ctx.rotate(pend);
  F(ctx, PT.sm([-3.5, 0, 3.5, 0, 3.5, 112, -3.5, 112], 0.1), Br, met);
  F(ctx, PT.sm([-56, 98, -20, 92, 20, 92, 56, 98, 30, 128, 0, 146, -30, 128], 0.5), [C('#6a7480'), C('#c8d0d8'), '#ffffff'], { ow: 2, gloss: 1.4 });
  F(ctx, PT.ell(0, 112, 13, 13), Br, met);
  PT.glow(ctx, 0, 116, 34, '255,230,150', 0.45);
  ctx.restore();
  // 어깨 톱니
  gear(-112, -270, 46, 12, -t * 0.04, B0);
  gear(-80, -310, 26, 8, t * 0.07, B0, false);
  gear(112, -270, 46, 12, t * 0.04, Br);
  // 시계함 몸통 : 아치 윗부분 + 장식 테
  const caseP = PT.sm([-104, -130, 104, -130, 116, -200, 108, -272, 70, -326, 0, -342, -70, -326, -108, -272, -116, -200], 0.55);
  F(ctx, caseP, [C(Dk[0]), C(Dk[1]), C(Dk[2])], { ow: 2.6, tex: 'wood', ta: 0.45, rim: 1 });
  F(ctx, PT.sm([-100, -140, 100, -140, 102, -126, -100, -126], 0.2), Br, met);
  // 옆쪽 드러난 톱니 장치
  ctx.save(); ctx.beginPath(); ctx.rect(-112, -250, 30, 100); ctx.clip(); gear(-96, -196, 26, 10, t * 0.06, B0, false); ctx.restore();
  // 시계판
  F(ctx, PT.ell(0, -222, 100, 100), Br, Object.assign({ spec: 0.5 }, met));
  F(ctx, PT.ell(0, -222, 86, 86), Fc, { ow: 1.6, sh: 0.5 });
  ctx.strokeStyle = C(Dk[0]); ctx.fillStyle = C(Dk[0]); ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 66, -222 + Math.sin(a) * 66); ctx.lineTo(Math.cos(a) * 80, -222 + Math.sin(a) * 80); ctx.stroke(); }
  ctx.font = '700 15px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ['XII', 'III', 'VI', 'IX'].forEach((s, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; ctx.fillText(s, Math.cos(a) * 54, -222 + Math.sin(a) * 54); });
  // 안쪽 톱니 창
  ctx.save(); ctx.beginPath(); ctx.arc(0, -222, 34, 0, TAU); ctx.clip(); ctx.fillStyle = C(Dk[0]); ctx.fillRect(-40, -260, 80, 80);
  gear(-12, -228, 22, 9, t * 0.05, Br, false); gear(16, -210, 16, 7, -t * 0.07, B0, false);
  ctx.restore();
  ctx.strokeStyle = C(Br[0]); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -222, 34, 0, TAU); ctx.stroke();
  // 시곗바늘 (칼날 모양)
  const hand = (a, L, w, M) => { ctx.save(); ctx.translate(0, -222); ctx.rotate(a); F(ctx, PT.poly([-12, -w * 0.6, L * 0.7, -w, L, 0, L * 0.7, w, -12, w * 0.6]), M, { ow: 1.6, gloss: 1 }); ctx.restore(); };
  hand(handA, 64, 6, Dk); hand(handA * 12, 80, 4, [C('#6a1010'), C('#c02020'), C('#ff8080')]);
  F(ctx, PT.ell(0, -222, 9, 9), Br, met);
  // 유리 반사
  ctx.save(); ctx.beginPath(); ctx.arc(0, -222, 86, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.ellipse(-30, -262, 60, 26, -0.6, 0, TAU); ctx.fill(); ctx.restore();
  // 눈 : 시계판 위 아치 안의 두 빛
  for (const ex of [-26, 26]) { ctx.fillStyle = '#080404'; ctx.beginPath(); ctx.ellipse(ex, -306, 12, 8, 0, 0, TAU); ctx.fill(); PT.glow(ctx, ex, -306, 26, glow, 0.9); PT.dot(ctx, ex, -306, 4.4, `rgba(${glow},1)`); PT.dot(ctx, ex, -306, 2, '#fff'); }
  // 종 왕관
  F(ctx, PT.sm([-36, -334, 36, -334, 44, -318, -44, -318], 0.3), Br, met);
  F(ctx, PT.sm([-24, -336, -22, -366, -8, -380, 8, -380, 22, -366, 24, -336], 0.6), Br, Object.assign({ spec: 0.6 }, met));
  F(ctx, PT.ell(0, -386, 6, 6), Br, met);
  PT.glow(ctx, 0, -222, 150, glow, 0.18 + (k.act === 'slowfield' ? 0.4 : 0));
};

// ============================================================
//  16. 사이버 군주 ZX-0 : 네온 회로 장갑, 떠 있는 어깨판, 팔 캐논, 뿔 바이저, 플라스마 추진
// ============================================================
CREATURES.cyber.draw = function (ctx, b, P, k) {
  const t = k.t, Bd = P.body, Pl = P.plate, Fh = 80 + Math.sin(t * 0.07) * 8, neon = b.enraged ? '255,60,80' : b.elem, F = PT.fill, C = c => BA.c(b, c);
  let arm = 0;
  if (k.act === 'grid' || k.act === 'emp' || k.a === 'roar') arm = 1;
  const gl = k.act === 'glitch' && k.af % 6 < 3;
  const met = { ow: 2, gloss: 1, rim: `rgb(${neon})` };
  ctx.save(); ctx.translate(gl ? rand(-8, 8) : 0, -Fh);
  // 플라스마 추진
  for (const s of [-1, 1]) {
    F(ctx, PT.sm([s * 16, -24, s * 44, -16, s * 40, 16, s * 14, 8], 0.4), Pl, met);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fl = 50 + Math.sin(t * 0.6 + s) * 8;
    const g = ctx.createLinearGradient(0, 14, 0, 14 + fl); g.addColorStop(0, `rgba(255,255,255,0.9)`); g.addColorStop(0.3, `rgba(${neon},0.7)`); g.addColorStop(1, `rgba(${neon},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s * 18, 12); ctx.quadraticCurveTo(s * 28, 14 + fl, s * 30, 14 + fl); ctx.quadraticCurveTo(s * 32, 14 + fl, s * 40, 14); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 홀로그램 고리
  ctx.save(); ctx.translate(0, -110); ctx.scale(1, 0.28); ctx.strokeStyle = `rgba(${neon},0.5)`; ctx.lineWidth = 3; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -t * 2; ctx.beginPath(); ctx.arc(0, 0, 120, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  // 뒤 어깨판 + 뒤 팔
  const armF = (s, back) => {
    ctx.save(); ctx.translate(s * 64, -150); ctx.rotate(s * (0.4 - arm * 1.1));
    const M = back ? [PT.dk(Pl[0], 0.3), Pl[0], Pl[1]] : Pl;
    F(ctx, PT.sm([-13, 0, 13, 0, 16, 70, 18, 96, -18, 96, -16, 70], 0.3), M, met);
    F(ctx, PT.sm([-18, 60, 18, 60, 20, 100, -20, 100], 0.3), Bd, met);
    PT.neon(ctx, [-8, 10, -8, 50, 0, 58], neon, 1.4, back ? 0.5 : 1);
    ctx.fillStyle = '#04020a'; ctx.beginPath(); ctx.ellipse(0, 100, 10, 4, 0, 0, TAU); ctx.fill();
    PT.glow(ctx, 0, 102, 24, neon, back ? 0.5 : 0.9); PT.dot(ctx, 0, 100, 4, '#ffffff');
    ctx.restore();
  };
  armF(-1, true);
  F(ctx, PT.sm([-60, -196, -96, -176, -100, -140, -66, -150], 0.5), [PT.dk(Pl[0], 0.3), Pl[0], Pl[1]], met);
  // 몸통 : V자 장갑 + 회로
  const body = PT.sm([-50, -40, 50, -40, 66, -150, 34, -194, -34, -194, -66, -150], 0.35);
  F(ctx, body, Bd, Object.assign({ sh: 1.1 }, met));
  ctx.save(); ctx.clip(body);
  F(ctx, PT.poly([-40, -186, 40, -186, 26, -120, 0, -100, -26, -120]), Pl, { ow: 1.6, gloss: 1.2 });
  PT.neon(ctx, [-40, -60, -20, -90, 0, -120, 20, -90, 40, -60], neon, 2, 1);
  PT.neon(ctx, [-56, -140, -40, -140, -30, -110, -40, -70], neon, 1.2, 0.8);
  PT.neon(ctx, [56, -140, 40, -140, 30, -110, 40, -70], neon, 1.2, 0.8);
  ctx.restore();
  // 코어
  F(ctx, PT.poly([0, -164, 14, -150, 0, -136, -14, -150]), C('#08040e'), { ow: 1.6, flat: true });
  PT.glow(ctx, 0, -150, 44, neon, 0.8); F(ctx, PT.poly([0, -158, 8, -150, 0, -142, -8, -150]), C('#ffffff'), { ow: 0, flat: true });
  // 허리 · 치마 장갑
  F(ctx, PT.sm([-50, -46, 50, -46, 46, -30, -46, -30], 0.2), Pl, met);
  for (const s of [-1, 1]) F(ctx, PT.poly([s * 10, -34, s * 46, -34, s * 40, 4, s * 16, -6]), Pl, met);
  // 머리 : 뿔 달린 바이저 투구
  F(ctx, PT.sm([-28, -192, 28, -192, 34, -230, 20, -250, -18, -254, -30, -232], 0.4), Pl, met);
  F(ctx, PT.poly([-18, -228, 36, -226, 34, -212, -16, -214]), C('#06040c'), { ow: 1.4, gloss: 1.4 });
  PT.neon(ctx, [-10, -220, 30, -219], neon, 2.2, 1); PT.glow(ctx, 10, -220, 46, neon, 0.8);
  BA.horn(ctx, -16, -246, -2.0, 40, 6, -0.4, Pl, { ow: 1.4, rim: `rgb(${neon})` });
  BA.horn(ctx, 4, -250, -1.7, 30, 5, -0.5, Pl, { ow: 1.4 });
  F(ctx, PT.poly([16, -206, 30, -206, 26, -194, 18, -194]), Pl, { ow: 1.2 });
  // 앞 어깨판 + 앞 팔
  armF(1, false);
  F(ctx, PT.sm([60, -196, 98, -180, 102, -142, 66, -148], 0.5), Pl, met);
  PT.neon(ctx, [70, -180, 92, -170, 94, -152], neon, 1.2, 0.9);
  // 공전 드론
  for (let i = 0; i < 2; i++) {
    const a = t * 0.05 + i * Math.PI, x = Math.cos(a) * 116, y = -140 + Math.sin(a) * 26;
    ctx.save(); ctx.translate(x, y);
    F(ctx, PT.sm([-18, 0, -8, -9, 8, -9, 18, 0, 8, 8, -8, 8], 0.5), Pl, met);
    PT.glow(ctx, 0, 0, 22, neon, 0.7); PT.dot(ctx, 0, 0, 3.6, '#fff');
    ctx.restore();
  }
  ctx.restore();
};

// ============================================================
//  17. 뇌신 라이진 : 근육질 푸른 도깨비, 치솟는 금빛 갈기, 호랑이 가죽 허리옷, 북 고리, 먹구름
// ============================================================
CREATURES.oni.draw = function (ctx, b, P, k) {
  const t = k.t, S = P.skin, Dm = P.drum, Hr = P.hair, Fh = 60 + Math.sin(t * 0.06) * 10, F = PT.fill, C = c => BA.c(b, c);
  let beat = 0;
  if (k.act === 'drums' || k.act === 'rows') beat = (k.af % 14) < 5 ? 1 : 0;
  if (k.a === 'roar' || k.act === 'roar') beat = 1;
  const skin = { ow: 2.2, rim: '#c8f0ff' }, S0 = [PT.dk(S[0], 0.3), S[0], S[1]], ec = b.enraged ? '255,80,40' : '255,240,110';
  const tiger = [C('#8a5a10'), C('#f0b030'), C('#ffe090')], cloud = [C('#4a4a66'), C('#8a8cac'), C('#d8dcf0')];
  ctx.save(); ctx.translate(0, -Fh);
  // 북 고리 틀
  ctx.strokeStyle = PT.ol; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(-20, -150, 140, Math.PI + 0.1, TAU - 0.1); ctx.stroke();
  ctx.strokeStyle = C(Dm[0]); ctx.lineWidth = 8; ctx.stroke();
  ctx.strokeStyle = C('#d8a840'); ctx.lineWidth = 2; ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + 0.2 + i / 7 * (Math.PI - 0.4), x = Math.cos(a) * 140 - 20, y = -150 + Math.sin(a) * 110;
    const lit = beat && i % 2 === (Math.floor(k.af / 14) % 2);
    F(ctx, PT.ell(x, y, 28, 28), Dm, { ow: 2, gloss: 0.7, rim: 1 });
    for (let j = 0; j < 8; j++) { const aa = j / 8 * TAU; PT.dot(ctx, x + Math.cos(aa) * 24, y + Math.sin(aa) * 24, 1.8, C('#f0d080')); }
    F(ctx, PT.ell(x, y, 19, 19), [C('#c8b890'), C('#f4ecd0'), '#ffffff'], { ow: 1.2, sh: 0.5 });
    // 세 쉼표 문양
    ctx.fillStyle = C(Dm[0]); for (let j = 0; j < 3; j++) { const aa = j / 3 * TAU + t * 0.02; ctx.beginPath(); ctx.arc(x + Math.cos(aa) * 7, y + Math.sin(aa) * 7, 5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + Math.cos(aa) * 7 + Math.cos(aa + 1.6) * 5, y + Math.sin(aa) * 7 + Math.sin(aa + 1.6) * 5); ctx.quadraticCurveTo(x + Math.cos(aa + 1) * 14, y + Math.sin(aa + 1) * 14, x + Math.cos(aa + 1.9) * 12, y + Math.sin(aa + 1.9) * 12); ctx.lineTo(x + Math.cos(aa) * 7, y + Math.sin(aa) * 7); ctx.fill(); }
    if (lit) { PT.glow(ctx, x, y, 48, ec, 0.9); for (let j = 0; j < 2; j++) { const aa = Math.random() * TAU; PT.neon(ctx, [x, y, x + Math.cos(aa) * 30, y + Math.sin(aa) * 30, x + Math.cos(aa + 0.4) * 46, y + Math.sin(aa + 0.4) * 46], ec, 1.2, 0.8); } }
  }
  // 먹구름 하체 + 번개
  for (let i = 0; i < 7; i++) F(ctx, PT.ell(-60 + i * 20, 10 + Math.sin(t * 0.08 + i) * 4 + (i % 2) * 8, 34 - Math.abs(i - 3) * 2, 20), cloud, { ow: 1.6, sh: 0.8 });
  if ((t % 50) < 4) PT.neon(ctx, [-20, 20, -30, 50, -14, 60, -26, 96], ec, 1.6, 1);
  // 몸통 : 근육 (가슴 · 복근)
  F(ctx, PT.sm([-42, -6, 42, -6, 60, -100, 64, -150, 34, -182, -34, -182, -64, -150, -58, -100], 0.6), S, Object.assign({ sh: 1.1 }, skin));
  ctx.strokeStyle = PT.rgba(S[0], 0.85); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-40, -150); ctx.quadraticCurveTo(-10, -128, 4, -150); ctx.moveTo(48, -150); ctx.quadraticCurveTo(20, -128, 6, -150); ctx.stroke();
  ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-16, -112 + i * 22); ctx.quadraticCurveTo(4, -106 + i * 22, 24, -112 + i * 22); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(4, -124); ctx.lineTo(4, -48); ctx.stroke();
  // 호랑이 가죽 허리옷 + 밧줄 띠
  const loin = PT.sm([-46, -40, 46, -40, 52, 0, 30, 12, -30, 12, -52, 0], 0.4);
  F(ctx, loin, tiger, { ow: 2, rim: 1 });
  ctx.save(); ctx.clip(loin); ctx.fillStyle = C('#1a1008');
  for (let i = 0; i < 6; i++) { const x = -44 + i * 17; ctx.beginPath(); polyPath(ctx, [x, -42, x + 7, -42, x + 2, -22, x + 8, -8, x - 2, -24]); ctx.fill(); }
  ctx.restore();
  F(ctx, PT.sm([-48, -48, 48, -48, 48, -36, -48, -36], 0.3), [C('#6a4a2a'), C('#c8a070'), C('#f0dcb0')], { ow: 1.8, tex: 'wood', ta: 0.4 });
  // 팔 + 북채
  const arm = (s, up) => {
    const hx = s * 72 + (up ? s * 10 : 0), hy = up ? -250 : -120, sx = s * 52, syy = -162;
    const [ex, ey] = BA.ik(sx, syy, hx, hy, 52, s > 0 ? 1 : -1);
    const M = s < 0 ? S0 : S;
    F(ctx, PT.ell(sx, syy, 22, 20), M, skin);
    F(ctx, PT.cap(sx, syy, ex, ey, 17, 14), M, skin);
    F(ctx, PT.cap(ex, ey, hx, hy, 14, 12), M, skin);
    F(ctx, PT.cap(ex + (hx - ex) * 0.5, ey + (hy - ey) * 0.5, hx, hy, 15, 14), [C('#3a2a10'), C('#c89a40'), C('#ffe090')], { ow: 1.8, gloss: 1 });
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(up ? -s * 0.4 : s * 0.8);
    F(ctx, PT.sm([-4, 0, 4, 0, 4, -62, -4, -62], 0.1), [C('#1e140a'), C('#4a3420'), C('#7a5a3a')], { ow: 1.4 });
    F(ctx, PT.ell(0, -68, 13, 11), [C('#a89a70'), C('#f0e8c8'), '#fff'], { ow: 1.4, spec: 0.6 });
    ctx.restore();
    F(ctx, PT.ell(hx, hy, 13, 12), M, skin);
  };
  arm(-1, beat);
  // 머리 : 치솟는 갈기 + 뿔 + 성난 얼굴
  ctx.save(); ctx.translate(4, -208);
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.3, w = Math.sin(t * 0.1 + i) * 0.12; BA.horn(ctx, Math.cos(a) * 14, Math.sin(a) * 14, a + w, 66 - Math.abs(i - 4) * 5, 13, (i - 4) * 0.08 + w, Hr, { ow: 1.4, hl: 1.4 }); }
  F(ctx, PT.sm([-28, -6, -24, -26, -2, -34, 24, -28, 34, -6, 30, 16, 14, 30, -10, 30, -26, 16], 0.7), S, skin);
  BA.horn(ctx, -16, -26, -2.0, 38, 7, 0.5, [C('#a89a70'), C('#f4ecd0'), '#fff']);
  BA.horn(ctx, 16, -28, -1.25, 38, 7, -0.5, [C('#a89a70'), C('#f4ecd0'), '#fff']);
  F(ctx, PT.sm([-8, -18, 30, -16, 36, -8, 4, -6], 0.4), S0, { ow: 1.4 });                                                   // 찌푸린 눈썹
  ctx.fillStyle = '#100808'; ctx.beginPath(); polyPath(ctx, [4, -8, 30, -8, 28, -1, 6, -2]); ctx.fill();
  PT.glow(ctx, 17, -5, 30, ec, 0.95); ctx.fillStyle = `rgba(${ec},1)`; ctx.beginPath(); polyPath(ctx, [7, -6, 28, -6, 26, -2, 8, -3]); ctx.fill();
  F(ctx, PT.sm([4, 10, 32, 8, 30, 22, 8, 22], 0.4), C('#3a0810'), { ow: 1.6, flat: true });
  PT.teeth(ctx, 6, 10, 30, 9, 4, 4, '#fff8e8'); PT.teeth(ctx, 8, 22, 28, 22, 3, -4, '#fff8e8', -1);
  BA.horn(ctx, 9, 12, 1.3, 9, 2.4, -0.3, ['#c8c0a8', '#fffbe8', '#fff'], { ow: 1 }); BA.horn(ctx, 27, 11, 1.4, 9, 2.4, 0.3, ['#c8c0a8', '#fffbe8', '#fff'], { ow: 1 });
  ctx.restore();
  arm(1, !beat);
  ctx.restore();
};

// ============================================================
//  18. 별을 삼키는 자 : 금 세공 테두리의 성운 두건, 별 눈, 행성 고리 후광, 별조각 왕관
// ============================================================
CREATURES.cosmic.draw = function (ctx, b, P, k) {
  const t = k.t, Hm = P.helm, G = P.gold, Fc = P.face, Fh = 70 + Math.sin(t * 0.04) * 12, F = PT.fill, C = c => BA.c(b, c);
  let mouth = 0.2, star = 0;
  if (k.act === 'supernova') { star = Math.min(1, k.af / 80); mouth = 0.6; }
  if (k.a === 'roar' || k.act === 'roar') mouth = 0.8;
  const gold = { ow: 2, gloss: 1, rim: 1 }, ec = b.enraged ? '255,80,60' : '255,220,120';
  ctx.save(); ctx.translate(0, -Fh - 130);
  // 성운
  PT.glow(ctx, 0, 0, 240, '120,80,255', 0.28); PT.glow(ctx, 50, 50, 170, '255,90,170', 0.16); PT.glow(ctx, -70, -60, 140, '80,200,255', 0.12);
  // 행성 고리 후광 (뒤 절반)
  const ring = (front) => {
    ctx.save(); ctx.translate(0, -40); ctx.rotate(-0.25); ctx.scale(1, 0.26);
    ctx.beginPath(); ctx.arc(0, 0, 200, front ? 0 : Math.PI, front ? Math.PI : TAU);
    ctx.strokeStyle = 'rgba(255,220,160,0.25)'; ctx.lineWidth = 34; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,210,0.6)'; ctx.lineWidth = 6; ctx.stroke();
    ctx.restore();
  };
  ring(false);
  const planets = b.planets ?? 3;
  const pl = (i, front) => {
    const a = t * 0.025 + i * TAU / 3, x = Math.cos(a) * 200, y = Math.sin(a) * 50 + 40; if ((Math.sin(a) > 0) !== front || i >= planets) return;
    const g = ctx.createRadialGradient(x - 9, y - 9, 2, x, y, 28); g.addColorStop(0, ['#fff0c0', '#c0f0ff', '#ffc0d8'][i]); g.addColorStop(0.5, ['#e0a040', '#4090d0', '#d04080'][i]); g.addColorStop(1, '#1a1030');
    ctx.fillStyle = PT.ol; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 28, 0, TAU); ctx.fill();
    if (i === 0) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.3); ctx.strokeStyle = 'rgba(255,230,180,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.stroke(); ctx.restore(); }
  };
  for (let i = 0; i < 3; i++) pl(i, false);
  // 별조각 왕관 (뒤)
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.32, r = 150 + Math.sin(t * 0.05 + i) * 6, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.9 - 30, s = 1 - Math.abs(i - 3) * 0.12; F(ctx, PT.poly([x, y - 26 * s, x + 8 * s, y, x, y + 14 * s, x - 8 * s, y]), G, gold); PT.glow(ctx, x, y - 6, 20, '255,230,160', 0.4); }
  // 두건 (외곽) : 깊은 우주색 + 금 세공 테
  const hood = PT.sm([-120, 60, -128, -40, -96, -120, -36, -156, 36, -156, 96, -120, 128, -40, 120, 60, 80, 120, 0, 140, -80, 120], 0.75);
  F(ctx, hood, Hm, { ow: 2.8, rim: '#b0a0ff', tex: 'cloth', ta: 0.3 });
  ctx.save(); ctx.clip(hood); ctx.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { const x = -120 + (i * 71) % 240, y = -150 + (i * 43) % 290, s = (i % 3) * 0.6 + 0.8; ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 0.05 + i); ctx.fillRect(x, y, s, s); } ctx.globalAlpha = 1; ctx.restore();
  ctx.strokeStyle = C(G[0]); ctx.lineWidth = 9; ctx.beginPath(); smoothPoly(ctx, [-96, 70, -100, -36, -72, -102, -28, -124, 28, -124, 72, -102, 100, -36, 96, 70, 60, 112, 0, 124, -60, 112], 0.75); ctx.stroke();
  ctx.strokeStyle = C(G[1]); ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = C(G[2]); ctx.lineWidth = 1.4; ctx.stroke();
  for (let i = 0; i < 10; i++) { const a = Math.PI * 0.95 + i / 9 * Math.PI * 1.1; PT.dot(ctx, Math.cos(a) * 104, -6 + Math.sin(a) * 124, 3, C(G[2])); }
  // 이마 보석
  F(ctx, PT.poly([0, -132, 14, -112, 0, -92, -14, -112]), [C('#5a0a3a'), C('#e0308a'), C('#ffb0e0')], { ow: 1.8, gloss: 1.2 });
  PT.glow(ctx, 0, -112, 30, '255,90,190', 0.6);
  // 얼굴 : 별이 박힌 허공
  const face = PT.sm([-74, -70, 0, -100, 74, -70, 84, 20, 44, 92, 0, 104, -44, 92, -84, 20], 0.8);
  F(ctx, face, Fc, { ow: 2.2, sh: 0.6, hl: 0 });
  ctx.save(); ctx.clip(face);
  const vg = ctx.createRadialGradient(0, 10, 10, 0, 10, 110); vg.addColorStop(0, 'rgba(160,120,255,0.35)'); vg.addColorStop(1, 'rgba(0,0,10,0.6)'); ctx.fillStyle = vg; ctx.fillRect(-90, -110, 180, 220);
  for (let i = 0; i < 30; i++) { const x = -70 + (i * 37) % 140, y = -80 + (i * 53) % 170, s = (i % 4 === 0) ? 2.4 : 1.2; ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 0.08 + i * 1.7)})`; ctx.fillRect(x, y, s, s); }
  ctx.strokeStyle = 'rgba(200,190,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-50, 60); ctx.lineTo(-20, 74); ctx.lineTo(10, 66); ctx.lineTo(40, 80); ctx.moveTo(-60, -40); ctx.lineTo(-40, -60); ctx.stroke();
  ctx.restore();
  // 별 눈
  for (const s of [-1, 1]) {
    const x = s * 34 + 8, y = -20;
    PT.glow(ctx, x, y, 44, ec, 0.9);
    ctx.fillStyle = `rgba(${ec},1)`; ctx.beginPath(); polyPath(ctx, [x - 20, y, x - 5, y - 4, x, y - 14, x + 5, y - 4, x + 20, y, x + 5, y + 4, x, y + 12, x - 5, y + 4]); ctx.fill();
    PT.dot(ctx, x, y, 4, '#ffffff');
  }
  // 입 : 별을 빨아들이는 어둠
  ctx.fillStyle = '#02010a'; ctx.beginPath(); ctx.ellipse(8, 52, 34, 8 + mouth * 22, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(8, 52); ctx.rotate(t * 0.05); ctx.strokeStyle = `rgba(190,150,255,${0.4 + mouth * 0.4})`; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 24 - i * 7, (6 + mouth * 16) * (1 - i * 0.28), 0, i, i + 4); ctx.stroke(); }
  ctx.restore();
  PT.glow(ctx, 8, 52, 30 + mouth * 24, '160,120,255', 0.5);
  ring(true);
  for (let i = 0; i < 3; i++) pl(i, true);
  if (star > 0) { PT.glow(ctx, 160, 60, 40 + star * 140, '255,240,200', 0.4 + star * 0.6); PT.glow(ctx, 160, 60, 20 + star * 40, '255,255,255', 1); }
  ctx.restore();
};

// ============================================================
//  19. 태초의 혼돈 아자토스 : 꿈틀대는 살덩이에 다른 보스들의 조각(날개 · 촉수 · 결정 · 바위 주먹)이 엉겨 붙었다
// ============================================================
CREATURES.chaos.draw = function (ctx, b, P, k) {
  const t = k.t, h = (t * 1.5) % 360, cc = hslRgb(h, 0.8, 0.55).join(','), Fh = 50 + Math.sin(t * 0.05) * 10, F = PT.fill, C = c => BA.c(b, c);
  const A = P.a, Bb = P.b, Cc = P.c;
  ctx.save(); ctx.translate(0, -Fh - 140);
  PT.glow(ctx, 0, 0, 220, cc, 0.25);
  // 비막 날개 (뒤)
  const wy = Math.sin(t * 0.08) * 40;
  const mem = PT.path(p => { p.moveTo(-40, -60); p.lineTo(-150, -170 - wy * 0.6); p.lineTo(-270, -220 - wy); p.quadraticCurveTo(-230, -140, -250, -90 - wy * 0.3); p.quadraticCurveTo(-200, -90, -200, -50); p.quadraticCurveTo(-160, -50, -120, -10); p.closePath(); }, [-270, -260, -40, -10]);
  F(ctx, mem, Bb, { ow: 2, sh: 0.5, rim: 1 });
  for (const [x, y] of [[-270, -220 - wy], [-250, -90 - wy * 0.3], [-200, -50]]) PT.line(ctx, [-150, -170 - wy * 0.6, x, y], C(Bb[0]), 5, 1.4);
  PT.line(ctx, [-40, -60, -150, -170 - wy * 0.6], C(Bb[0]), 8, 1.6);
  // 촉수 (아래)
  for (let i = 0; i < 5; i++) {
    const pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push(-60 + i * 30 + Math.sin(t * 0.07 + i + u * 3) * 30 * u, 80 + u * (Fh + 120)); }
    F(ctx, PT.strip(pts, 15 - i, 3), Cc, { ow: 1.8, rim: 1 });
    for (let j = 2; j < 9; j += 2) PT.dot(ctx, pts[j * 2] + 4, pts[j * 2 + 1], 3 - j * 0.2, C(Cc[2]));
  }
  // 결정 가시
  for (let i = 0; i < 4; i++) { const a = -1.2 + i * 0.5, x0 = Math.cos(a) * 100, y0 = Math.sin(a) * 96; ctx.save(); ctx.translate(x0, y0); ctx.rotate(a); F(ctx, PT.poly([0, -12, 70 + i * 6, -6, 92 + i * 6, 0, 70 + i * 6, 6, 0, 12]), [C('#2a4aa0'), C('#80b0ff'), '#ffffff'], { ow: 1.6, gloss: 1.2 }); ctx.restore(); }
  // 바위 주먹 (골렘 조각)
  ctx.save(); ctx.translate(150, 40); ctx.rotate(0.3 + Math.sin(t * 0.04) * 0.15);
  F(ctx, PT.sm([-40, -30, 10, -40, 44, -20, 48, 14, 20, 38, -28, 34, -48, 4], 0.6), [C('#2e2b26'), C('#5c574d'), C('#8a8375')], { ow: 2.2, tex: 'stone', ta: 0.45, rim: 1 });
  for (let i = 0; i < 3; i++) F(ctx, PT.sm([30, -26 + i * 18, 52, -24 + i * 18, 56, -12 + i * 18, 32, -10 + i * 18], 0.6), [C('#2e2b26'), C('#5c574d'), C('#8a8375')], { ow: 1.6 });
  PT.neon(ctx, [-20, -10, -4, 6, -14, 20], cc, 1.4, 0.8);
  ctx.restore();
  // 몸 : 일렁이는 덩어리 (세 가지 살색이 섞인다)
  const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = 122 + Math.sin(t * 0.07 + i * 1.7) * 14 + (i % 3) * 8; pts.push(Math.cos(a) * r, Math.sin(a) * r * 0.9); }
  const body = PT.sm(pts, 0.9);
  F(ctx, body, A, { ow: 3, tex: 'skin', ta: 0.5, rim: `rgb(${cc})`, sh: 1.1 });
  ctx.save(); ctx.clip(body);
  ctx.fillStyle = PT.rgba(Bb[1], 0.55); ctx.beginPath(); ctx.ellipse(-60 + Math.sin(t * 0.03) * 20, 40, 70, 50, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = PT.rgba(Cc[1], 0.45); ctx.beginPath(); ctx.ellipse(60, -50 + Math.cos(t * 0.03) * 20, 60, 40, -0.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(${cc},0.6)`; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = i * 1.05 + t * 0.01; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 130, Math.sin(a) * 120); ctx.quadraticCurveTo(Math.cos(a + 0.6) * 60, Math.sin(a + 0.6) * 60, 0, 0); ctx.stroke(); }
  ctx.restore();
  PT.glow(ctx, 0, 0, 170, cc, 0.3);
  // 이빨 난 갈라진 틈 (입)
  ctx.save(); ctx.translate(30, 60); ctx.rotate(-0.15);
  F(ctx, PT.path(p => { p.moveTo(-60, 0); p.quadraticCurveTo(0, -18, 60, 0); p.quadraticCurveTo(0, 26 + Math.sin(t * 0.1) * 6, -60, 0); }, [-60, -18, 60, 26]), C('#14020c'), { ow: 2, flat: true });
  PT.teeth(ctx, -50, -4, 50, -4, 9, 9); PT.teeth(ctx, -44, 10, 44, 10, 8, -8, '#f4ecd8', -1);
  PT.glow(ctx, 0, 4, 40, cc, 0.5);
  ctx.restore();
  // 여러 개의 눈 (크기 · 홍채 색이 제각각)
  for (let i = 0; i < 7; i++) {
    const ex = Math.cos(i * 1.9) * 70, ey = Math.sin(i * 2.7) * 50 - 20, r = 12 + (i % 3) * 5, bl = Math.sin(t * 0.05 + i * 2) > 0.92 ? 0.15 : 1;
    F(ctx, PT.ell(ex, ey, r + 4, (r + 4) * 0.8), A, { ow: 1.6 });
    F(ctx, PT.ell(ex, ey, r, r * 0.75 * bl), [C('#c8b8a8'), C('#f8f0e0'), '#fff'], { ow: 1.4, sh: 0.6 });
    if (bl > 0.5) { const ic = hslRgb((h + i * 50) % 360, 0.9, 0.55).join(','); PT.dot(ctx, ex + r * 0.2, ey, r * 0.5, `rgb(${ic})`); ctx.fillStyle = '#0a0208'; ctx.beginPath(); ctx.ellipse(ex + r * 0.22, ey, r * 0.14, r * 0.42, 0, 0, TAU); ctx.fill(); PT.dot(ctx, ex - r * 0.05, ey - r * 0.22, r * 0.16, '#fff'); }
  }
  ctx.restore();
};
