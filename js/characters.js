'use strict';
// ============================================================
//  캐릭터 리그 정의 + 외형 드로잉
// ============================================================

function footShape(ctx, knee, ft, m, ol, len, h, ow) {
  const dx = ft.x - knee.x, dy = ft.y - knee.y, L = Math.hypot(dx, dy) || 1;
  const sx = dx / L, s_y = dy / L, fx = s_y, fy = -sx;
  const P2 = (a, b) => [ft.x + fx * a + sx * b, ft.y + fy * a + s_y * b];
  const pts = [...P2(-4, -h), ...P2(len * 0.5, -h), ...P2(len, 0), ...P2(len, h * 0.8), ...P2(-4, h * 0.8)];
  olPoly(ctx, pts, m[1], ol, ow);
  ctx.fillStyle = m[0];
  ctx.beginPath(); polyPath(ctx, [...P2(-4, h * 0.2), ...P2(len, h * 0.2), ...P2(len, h * 0.8), ...P2(-4, h * 0.8)]); ctx.fill();
}

function circleOl(ctx, x, y, r, fill, ol, ow) {
  ctx.beginPath(); ctx.arc(x, y, r + ow, 0, TAU); ctx.fillStyle = ol; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill();
}

// 무기용 로컬 좌표계 진입 (손 위치, 무기 방향이 +x)
function weaponFrame(ctx, hand, angDeg) {
  const a = angDeg * DEG;
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(Math.atan2(Math.cos(a), Math.sin(a)));
}

// ============================================================
//  플레이어 : 검귀 카엘
// ============================================================
const RIG_PLAYER = {
  scale: 1.1, thigh: 30, shin: 31, torso: 38, neck: 6, headR: 14, uArm: 22, fArm: 21,
  shDrop: 5, shOff: 3, footH: 3, wWaist: 11, wChest: 13, wlen: 88,
  pal: {
    ol: '#120f18',
    skin: ['#c08a6c', '#efc3a3', '#ffe3cf'],
    hair: ['#141219', '#2a2633', '#4a4458'],
    coat: ['#10172a', '#1f2e4f', '#3a5288'],
    coatIn: ['#5b5e6b', '#9ea1ad', '#d4d6de'],
    trim: ['#8a6a2c', '#c9a55c', '#f3dd9a'],
    sash: ['#5e0e0e', '#a91f1c', '#e0504a'],
    pants: ['#121217', '#25252e', '#3e3e4a'],
    boots: ['#23150e', '#43291c', '#6b4631'],
    bracer: ['#34261a', '#57412c', '#80664a'],
    ghost: ['#3e0a0d', '#861a1d', '#cf3a3a'],
    bandage: ['#b9a88a', '#e8d9c0', '#fff4e0'],
    metal: ['#353b48', '#667085', '#a8b3c9'],
    blade: ['#7d8a9e', '#cfd7e3', '#ffffff'],
    hilt: ['#1a120c', '#2e2016', '#4a3624'],
    band: ['#7a1414', '#c42a28', '#ff6655'],
    eye: ['#ff2a1a', '#ff5a3a', '#ffd0a0'],
  },
};

function drawPlayer(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.7, ghost = opt.ghost;
  if (J.wb) drawPlayerBlade(ctx, J, pal, ent, opt);

  // --- 뒷팔 (귀수) ---
  limb(ctx, J.sh2, J.elbow2, J.hand2, 6, 5.3, 4.7, pal.coat, pal.ghost, ol, ow);
  if (!ghost) {
    ctx.strokeStyle = pal.bandage[1]; ctx.lineWidth = 1.4;
    const dx = J.hand2.x - J.elbow2.x, dy = J.hand2.y - J.elbow2.y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L * 4.4, ny = dx / L * 4.4;
    ctx.beginPath();
    for (let i = 1; i <= 4; i++) {
      const u = i / 5, x = J.elbow2.x + dx * u, y = J.elbow2.y + dy * u;
      ctx.moveTo(x + nx - dx / L * 2, y + ny - dy / L * 2); ctx.lineTo(x - nx + dx / L * 2, y - ny + dy / L * 2);
    }
    ctx.stroke();
  }
  circleOl(ctx, J.hand2.x, J.hand2.y, 4.9, pal.ghost[1], ol, ow);
  if (!ghost && !opt.flash) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fl = 0.45 + Math.sin(Game.time * 0.3) * 0.1 + (ent.ghostGlow || 0);
    drawGlow(ctx, J.hand2.x, J.hand2.y, 18 + (ent.ghostGlow || 0) * 20, '255,40,30', fl);
    ctx.restore();
  }

  // --- 코트 자락 ---
  if (!ghost && ent.tail) drawRibbon(ctx, ent, ent.tail, 10, 4, pal.coat[1], ol, ow);

  // --- 뒷다리 ---
  limb(ctx, J.hip, J.knee2, J.foot2, 8.6, 7, 5.8, pal.pants, pal.boots, ol, ow);
  footShape(ctx, J.knee2, J.foot2, pal.boots, ol, 11, 4.6, ow);

  // --- 목 ---
  ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, J.chest, J.neck, 5.5, 5.5); ctx.fill();
  ctx.fillStyle = pal.skin[0]; ctx.beginPath(); capsulePath(ctx, J.chest, J.neck, 4, 4); ctx.fill();

  // --- 몸통 (코트) ---
  const F = torsoFrame(J), Hh = J.hip, L = F.L;
  olPoly(ctx, [
    ...tp(Hh, F, -12.5, -7), ...tp(Hh, F, 11.5, -7), ...tp(Hh, F, 13, L * 0.5),
    ...tp(Hh, F, 14.5, L - 1), ...tp(Hh, F, 7, L + 4.5), ...tp(Hh, F, -7, L + 4.5),
    ...tp(Hh, F, -14.5, L - 2), ...tp(Hh, F, -13, L * 0.45)], pal.coat[1], ol, ow);
  ctx.fillStyle = pal.coat[0];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, -12.5, -7), ...tp(Hh, F, -4, -7), ...tp(Hh, F, -5, L + 3), ...tp(Hh, F, -14.5, L - 2), ...tp(Hh, F, -13, L * 0.45)]); ctx.fill();
  // 이너 셔츠 V
  ctx.fillStyle = pal.coatIn[1];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, 11, L * 0.35), ...tp(Hh, F, 12.3, L - 1), ...tp(Hh, F, 6.5, L + 3.5), ...tp(Hh, F, 5, L * 0.6)]); ctx.fill();
  // 트림 라인
  ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 5, L * 0.6)); ctx.lineTo(...tp(Hh, F, 6.5, L + 3.5)); ctx.lineTo(...tp(Hh, F, -6, L + 4)); ctx.stroke();
  // 하이라이트
  ctx.fillStyle = pal.coat[2];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, 2, L * 0.55), ...tp(Hh, F, 4, L - 1), ...tp(Hh, F, 1, L + 1), ...tp(Hh, F, 0, L * 0.6)]); ctx.fill();
  // 허리띠 (붉은 띠)
  olPoly(ctx, [...tp(Hh, F, -13.3, 1), ...tp(Hh, F, 12.3, 1), ...tp(Hh, F, 12.8, 8), ...tp(Hh, F, -13.5, 8)], pal.sash[1], ol, 1.2);
  ctx.fillStyle = pal.sash[2];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, -6, 5), ...tp(Hh, F, 10, 5), ...tp(Hh, F, 10.5, 7), ...tp(Hh, F, -6, 7)]); ctx.fill();
  olPoly(ctx, [...tp(Hh, F, -12, 6), ...tp(Hh, F, -15, -6), ...tp(Hh, F, -19, -12), ...tp(Hh, F, -14, -4), ...tp(Hh, F, -11, 2)], pal.sash[0], ol, 1.2);

  // --- 앞다리 ---
  limb(ctx, J.hip, J.knee1, J.foot1, 9, 7.4, 6.1, pal.pants, pal.boots, ol, ow);
  footShape(ctx, J.knee1, J.foot1, pal.boots, ol, 12, 4.8, ow);
  // 무릎 보호대
  circleOl(ctx, J.knee1.x, J.knee1.y, 4.5, pal.metal[1], ol, 1.2);

  // --- 머리 ---
  if (!ghost && ent.ribbon) drawRibbon(ctx, ent, ent.ribbon, 2.6, 1.2, pal.band[1], ol, 1.2);
  drawPlayerHead(ctx, J, pal, ow, opt);

  // --- 검 ---
  if (!J.wb) drawPlayerBlade(ctx, J, pal, ent, opt);

  // --- 앞팔 ---
  limb(ctx, J.sh1, J.elbow1, J.hand1, 6.6, 5.8, 5.2, pal.coat, pal.bracer, ol, ow);
  // 견갑
  {
    const dx = J.elbow1.x - J.sh1.x, dy = J.elbow1.y - J.sh1.y, a = Math.atan2(dy, dx);
    const cx = J.sh1.x + dx * 0.12, cy = J.sh1.y + dy * 0.12;
    ctx.beginPath(); ctx.ellipse(cx, cy, 10.5, 8.5, a, 0, TAU); ctx.fillStyle = ol; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy, 9, 7, a, 0, TAU); ctx.fillStyle = pal.metal[1]; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 1, cy - 2, 5, 3.5, a, 0, TAU); ctx.fillStyle = pal.metal[2]; ctx.fill();
    ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.ellipse(cx, cy, 7.4, 5.6, a, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  circleOl(ctx, J.hand1.x, J.hand1.y, 5.2, pal.bracer[1], ol, ow);
}

function drawPlayerHead(ctx, J, pal, ow, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot); ctx.scale(1.1, 1.1);
  // 뒷머리 (삐죽)
  const hair = [-2, -15, -10, -17, -8, -12, -19, -14, -13, -7, -23, -4, -14, -1, -20, 6, -10, 5, -8, 11, 0, 6];
  olPoly(ctx, hair, pal.hair[1], ol, ow);
  // 얼굴
  circleOl(ctx, 0, 0, 12.5, pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0];
  ctx.beginPath(); ctx.arc(0, 0, 12.5, Math.PI * 0.55, Math.PI * 1.45); ctx.lineTo(-2, 0); ctx.fill();
  // 턱 라인
  ctx.fillStyle = pal.skin[1];
  ctx.beginPath(); polyPath(ctx, [4, 6, 12, 5, 9, 11, 2, 12]); ctx.fill();
  ctx.strokeStyle = ol; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(12, 4.5); ctx.lineTo(9.5, 11); ctx.lineTo(2, 12.5); ctx.stroke();
  // 윗머리 + 앞머리
  olPoly(ctx, [-13, -2, -12, -10, -4, -15, 6, -14, 13, -8, 15, -3, 10, -5, 11, 1, 6, -5, 3, -2, -2, -6, -6, -2], pal.hair[1], ol, ow);
  ctx.fillStyle = pal.hair[2];
  ctx.beginPath(); polyPath(ctx, [-8, -11, -1, -14, 6, -13, 0, -11]); ctx.fill();
  // 머리띠
  ctx.fillStyle = ol;
  ctx.beginPath(); polyPath(ctx, [-13.5, -7.5, 13, -6.5, 13, -1.5, -13.5, -2.5]); ctx.fill();
  ctx.fillStyle = pal.band[1];
  ctx.beginPath(); polyPath(ctx, [-12.5, -6.5, 12, -5.6, 12, -2.6, -12.5, -3.5]); ctx.fill();
  ctx.fillStyle = pal.band[2];
  ctx.beginPath(); polyPath(ctx, [-6, -6.3, 11, -5.6, 11, -4.6, -6, -5.3]); ctx.fill();
  // 귀
  ctx.fillStyle = pal.skin[0]; ctx.beginPath(); ctx.ellipse(-2, 2, 2.6, 3.6, 0, 0, TAU); ctx.fill();
  // 눈 (붉게 빛나는 귀안)
  ctx.fillStyle = ol;
  ctx.beginPath(); polyPath(ctx, [4.5, 0.2, 10.5, -0.6, 10, 2.4, 5, 2.6]); ctx.fill();
  ctx.fillStyle = pal.eye[1];
  ctx.beginPath(); polyPath(ctx, [6.5, 0.8, 9.8, 0.4, 9.4, 1.9, 6.6, 2]); ctx.fill();
  if (!opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 8.2, 1.2, 7, '255,60,30', 0.55);
    ctx.globalCompositeOperation = 'source-over';
  }
  // 눈썹
  ctx.strokeStyle = ol; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(11, -2.8); ctx.stroke();
  ctx.restore();
}

function drawPlayerBlade(ctx, J, pal, ent, opt) {
  const ol = pal.ol, L = RIG_PLAYER.wlen;
  weaponFrame(ctx, J.hand1, J.wAng);
  // 칼자루
  olPoly(ctx, [-15, -2.7, 8, -2.7, 8, 2.7, -15, 2.7], pal.hilt[1], ol, 1.5);
  ctx.strokeStyle = pal.hilt[2]; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -13; x < 7; x += 4) { ctx.moveTo(x, -2.4); ctx.lineTo(x + 2, 2.4); ctx.moveTo(x + 2, -2.4); ctx.lineTo(x, 2.4); }
  ctx.stroke();
  circleOl(ctx, -16, 0, 2.6, pal.trim[1], ol, 1.3);
  // 코등이
  ctx.beginPath(); ctx.ellipse(9.5, 0, 3.2, 8, 0, 0, TAU); ctx.fillStyle = ol; ctx.fill();
  ctx.beginPath(); ctx.ellipse(9.5, 0, 2, 6.8, 0, 0, TAU); ctx.fillStyle = pal.trim[1]; ctx.fill();
  // 칼날
  const blade = [12, -3.8, L - 16, -3.6, L, 0.4, L - 9, 4, 12, 4];
  olPoly(ctx, blade, pal.blade[0], ol, 1.6);
  ctx.fillStyle = pal.blade[1];
  ctx.beginPath(); polyPath(ctx, [12, -1.2, L - 14, -1.2, L - 2, 0.6, L - 9, 3.2, 12, 3.2]); ctx.fill();
  ctx.strokeStyle = pal.blade[2]; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(13, 3.1); ctx.lineTo(L - 9, 3.1); ctx.lineTo(L - 1, 0.6); ctx.stroke();
  ctx.strokeStyle = pal.blade[0]; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(14, -0.6); ctx.lineTo(L - 20, -0.6); ctx.stroke();
  // 기 발산
  const g = ent.bladeGlow || 0;
  if (g > 0 && !opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, g) * 0.9;
    ctx.fillStyle = 'rgba(120,190,255,0.55)';
    ctx.beginPath(); polyPath(ctx, [10, -7, L - 14, -7, L + 8, 0, L - 10, 8, 10, 8]); ctx.fill();
    for (let i = 0; i < 5; i++) drawGlow(ctx, 18 + i * (L - 20) / 4, 0, 16, '110,180,255', 0.35);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

// ============================================================
//  고블린
// ============================================================
const RIG_GOBLIN = {
  scale: 1.08, thigh: 16, shin: 17, torso: 24, neck: 2, headR: 13, uArm: 15, fArm: 14,
  shDrop: 4, shOff: 2, footH: 3, wWaist: 10, wChest: 12, wlen: 44,
  pal: {
    ol: '#121a0c',
    skin: ['#34591f', '#5f9a3e', '#95cc6c'],
    ear: ['#2c4a1a', '#c2715f', '#e3998a'],
    cloth: ['#35220f', '#5c3b1e', '#86603a'],
    wood: ['#3a2312', '#6d4422', '#98693a'],
    metal: ['#3a3f48', '#727b8a', '#b3bcc9'],
    eye: ['#ffd21f', '#fff2a8', '#ffffff'],
    pupil: ['#8c0e0e', '#8c0e0e', '#8c0e0e'],
    teeth: ['#d8cfa8', '#f3ecd0', '#ffffff'],
    band: ['#6e1010', '#b02220', '#e14a40'],
  },
};

function drawGoblin(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.5;
  if (J.wb) goblinWeapon(ctx, J, pal, ent);
  limb(ctx, J.sh2, J.elbow2, J.hand2, 4, 3.6, 3.4, pal.skin, pal.skin, ol, ow);
  circleOl(ctx, J.hand2.x, J.hand2.y, 3.6, pal.skin[1], ol, ow);
  limb(ctx, J.hip, J.knee2, J.foot2, 5, 4.4, 3.8, pal.skin, pal.skin, ol, ow);
  footShape(ctx, J.knee2, J.foot2, pal.skin, ol, 8, 3, ow);
  // 몸통
  const F = torsoFrame(J), Hh = J.hip, L = F.L;
  olPoly(ctx, [...tp(Hh, F, -9, -3), ...tp(Hh, F, 10, -3), ...tp(Hh, F, 12, L * 0.45), ...tp(Hh, F, 9, L + 2),
    ...tp(Hh, F, -8, L + 2), ...tp(Hh, F, -10, L * 0.5)], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[2];
  ctx.beginPath(); ctx.ellipse(...tp(Hh, F, 6, L * 0.35), 4, 6, Math.atan2(F.uy, F.ux), 0, TAU); ctx.fill();
  // 가죽 조끼
  olPoly(ctx, [...tp(Hh, F, -9.5, L * 0.3), ...tp(Hh, F, 1, L * 0.35), ...tp(Hh, F, 4, L + 2), ...tp(Hh, F, -8.5, L + 2.5)], pal.cloth[1], ol, 1.2);
  ctx.strokeStyle = pal.cloth[2]; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, -4, L * 0.4)); ctx.lineTo(...tp(Hh, F, -3, L)); ctx.stroke();
  // 허리천
  olPoly(ctx, [...tp(Hh, F, -10, 3), ...tp(Hh, F, 10.5, 3), ...tp(Hh, F, 9, -12), ...tp(Hh, F, 2, -8), ...tp(Hh, F, -4, -14), ...tp(Hh, F, -10, -6)], pal.cloth[0], ol, 1.2);
  ctx.fillStyle = pal.cloth[2];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, -10, 3), ...tp(Hh, F, 10.5, 3), ...tp(Hh, F, 10.5, 0), ...tp(Hh, F, -10, 0)]); ctx.fill();
  limb(ctx, J.hip, J.knee1, J.foot1, 5.4, 4.6, 4, pal.skin, pal.skin, ol, ow);
  footShape(ctx, J.knee1, J.foot1, pal.skin, ol, 9, 3, ow);
  goblinHead(ctx, J, pal, ow, ent, opt);
  if (!J.wb) goblinWeapon(ctx, J, pal, ent);
  limb(ctx, J.sh1, J.elbow1, J.hand1, 4.2, 3.8, 3.5, pal.skin, pal.skin, ol, ow);
  circleOl(ctx, J.hand1.x, J.hand1.y, 3.8, pal.skin[1], ol, ow);
}

function goblinHead(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 귀
  olPoly(ctx, [-5, -6, -27, -15, -20, -8, -6, 2], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.ear[1];
  ctx.beginPath(); polyPath(ctx, [-7, -4, -22, -12, -17, -8, -7, -1]); ctx.fill();
  // 머리
  circleOl(ctx, 0, 0, 13, pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0];
  ctx.beginPath(); ctx.arc(0, 0, 13, Math.PI * 0.5, Math.PI * 1.4); ctx.lineTo(0, 0); ctx.fill();
  ctx.fillStyle = pal.skin[2];
  ctx.beginPath(); ctx.ellipse(3, -7, 5, 3, -0.3, 0, TAU); ctx.fill();
  // 코
  olPoly(ctx, [9, -3, 20, 3, 17, 6, 10, 5], pal.skin[1], ol, ow);
  // 입
  ctx.fillStyle = '#2a0808';
  ctx.beginPath(); polyPath(ctx, [3, 7, 13, 8, 11, 11, 4, 10]); ctx.fill();
  ctx.fillStyle = pal.teeth[1];
  ctx.beginPath(); polyPath(ctx, [5, 7.2, 6.5, 9.5, 8, 7.4, 9.5, 9.5, 11, 7.6]); ctx.fill();
  // 눈
  ctx.fillStyle = pal.eye[0]; ctx.beginPath(); ctx.ellipse(6.5, -2.5, 3.6, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = pal.pupil[0]; ctx.beginPath(); ctx.arc(7.6, -2.3, 1.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = ol; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(2, -7.5); ctx.lineTo(11, -4.5); ctx.stroke();
  // 투구 / 두건
  if (ent.gear === 'helm') {
    olPoly(ctx, [-13, -3, -12, -10, -6, -15, 3, -16, 10, -12, 13, -5, 14, -3], pal.metal[1], ol, ow);
    ctx.fillStyle = pal.metal[2]; ctx.beginPath(); polyPath(ctx, [-4, -13, 3, -14.5, 7, -12, 0, -11]); ctx.fill();
    ctx.fillStyle = pal.metal[0]; ctx.beginPath(); polyPath(ctx, [-13, -3, 14, -3, 14, -1, -13, -1]); ctx.fill();
    olPoly(ctx, [0, -16, 2, -23, 5, -15.5], pal.metal[2], ol, 1.2);
  } else {
    olPoly(ctx, [-13, -4, -11, -11, -3, -15, 6, -14, 12, -9, 13, -5], pal.band[1], ol, ow);
    olPoly(ctx, [-12, -7, -22, -4, -19, 1, -12, -3], pal.band[0], ol, 1.2);
    ctx.fillStyle = pal.band[2]; ctx.beginPath(); polyPath(ctx, [-4, -13, 5, -13, 3, -11, -4, -11]); ctx.fill();
  }
  ctx.restore();
}

function goblinWeapon(ctx, J, pal, ent) {
  const ol = pal.ol;
  if (ent.kind === 'thrower') {
    if (ent.holdRock) circleOl(ctx, J.hand1.x + 1, J.hand1.y - 3, 5.5, '#8a8173', ol, 1.4);
    return;
  }
  weaponFrame(ctx, J.hand1, J.wAng);
  olPoly(ctx, [-6, -2.2, 14, -2.8, 44, -7, 46, 0, 44, 7, 14, 2.8, -6, 2.2], pal.wood[1], ol, 1.5);
  ctx.fillStyle = pal.wood[2]; ctx.beginPath(); polyPath(ctx, [14, -2, 42, -5.5, 42, -3, 14, -0.5]); ctx.fill();
  ctx.fillStyle = pal.metal[2];
  for (const [x, y] of [[26, -6], [36, -8], [31, 6], [41, 7.5]]) { ctx.beginPath(); polyPath(ctx, [x - 2, y * 0.6, x, y + sign(y) * 3.5, x + 2, y * 0.6]); ctx.fill(); }
  ctx.restore();
}

// ============================================================
//  오크 전사 (중형, 슈퍼아머)
// ============================================================
const RIG_ORC = {
  scale: 1.24, thigh: 29, shin: 29, torso: 42, neck: 4, headR: 16, uArm: 26, fArm: 25,
  shDrop: 8, shOff: 6, footH: 4, wWaist: 20, wChest: 25, wlen: 96,
  pal: {
    ol: '#0f1216',
    skin: ['#3a4556', '#687b93', '#9fb2c8'],
    cloth: ['#4a0f0f', '#8b1f1c', '#c23c32'],
    leather: ['#2c1c12', '#4c3322', '#735238'],
    metal: ['#2e333c', '#5d6573', '#9aa4b5'],
    wood: ['#2e1c0f', '#553619', '#7d552d'],
    hair: ['#0c0c10', '#1c1c24', '#34343f'],
    tusk: ['#b7aa88', '#efe4c6', '#ffffff'],
    eye: ['#ff3a1a', '#ff6a3a', '#ffd0a0'],
    paint: ['#a01818', '#c42222', '#e84040'],
  },
};

function drawOrc(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.8;
  if (J.wb) orcAxe(ctx, J, pal, ent);
  limb(ctx, J.sh2, J.elbow2, J.hand2, 8, 7.5, 6.5, pal.skin, pal.skin, ol, ow);
  circleOl(ctx, J.hand2.x, J.hand2.y, 6.5, pal.skin[1], ol, ow);
  limb(ctx, J.hip, J.knee2, J.foot2, 10, 8, 7, pal.leather, pal.skin, ol, ow);
  footShape(ctx, J.knee2, J.foot2, pal.leather, ol, 12, 5, ow);
  const F = torsoFrame(J), Hh = J.hip, L = F.L;
  // 거대한 몸통
  olPoly(ctx, [...tp(Hh, F, -16, -4), ...tp(Hh, F, 17, -4), ...tp(Hh, F, 22, L * 0.35), ...tp(Hh, F, 22, L * 0.75), ...tp(Hh, F, 16, L + 5),
    ...tp(Hh, F, -12, L + 6), ...tp(Hh, F, -20, L * 0.7), ...tp(Hh, F, -18, L * 0.25)], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, -16, -4), ...tp(Hh, F, -6, -4), ...tp(Hh, F, -8, L + 5), ...tp(Hh, F, -12, L + 6), ...tp(Hh, F, -20, L * 0.7), ...tp(Hh, F, -18, L * 0.25)]); ctx.fill();
  ctx.fillStyle = pal.skin[2];
  ctx.beginPath(); ctx.ellipse(...tp(Hh, F, 10, L * 0.72), 8, 6, Math.atan2(F.uy, F.ux), 0, TAU); ctx.fill();
  // 전투 문신
  ctx.strokeStyle = pal.paint[1]; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 4, L * 0.9)); ctx.lineTo(...tp(Hh, F, 14, L * 0.55)); ctx.moveTo(...tp(Hh, F, 0, L * 0.75)); ctx.lineTo(...tp(Hh, F, 10, L * 0.4)); ctx.stroke();
  // 가죽 벨트 + 허리천
  olPoly(ctx, [...tp(Hh, F, -17, 0), ...tp(Hh, F, 18, 0), ...tp(Hh, F, 18, 9), ...tp(Hh, F, -17, 9)], pal.leather[1], ol, 1.4);
  circleOl(ctx, ...tp(Hh, F, 12, 4.5), 4.5, pal.metal[2], ol, 1.2);
  olPoly(ctx, [...tp(Hh, F, 4, 0), ...tp(Hh, F, 17, 0), ...tp(Hh, F, 15, -24), ...tp(Hh, F, 6, -22)], pal.cloth[1], ol, 1.4);
  olPoly(ctx, [...tp(Hh, F, -16, 0), ...tp(Hh, F, -6, 0), ...tp(Hh, F, -8, -18), ...tp(Hh, F, -17, -15)], pal.cloth[0], ol, 1.4);
  limb(ctx, J.hip, J.knee1, J.foot1, 10.5, 8.5, 7.5, pal.leather, pal.skin, ol, ow);
  footShape(ctx, J.knee1, J.foot1, pal.leather, ol, 13, 5, ow);
  orcHead(ctx, J, pal, ow, ent, opt);
  if (!J.wb) orcAxe(ctx, J, pal, ent);
  limb(ctx, J.sh1, J.elbow1, J.hand1, 8.5, 8, 7, pal.skin, pal.skin, ol, ow);
  // 손목 보호대
  {
    const e = J.elbow1, hnd = J.hand1;
    const m = { x: lerp(e.x, hnd.x, 0.55), y: lerp(e.y, hnd.y, 0.55) }, n = { x: lerp(e.x, hnd.x, 0.9), y: lerp(e.y, hnd.y, 0.9) };
    ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, m, n, 9, 8.5); ctx.fill();
    shadedSeg(ctx, m, n, 7.8, 7.2, pal.leather);
  }
  circleOl(ctx, J.hand1.x, J.hand1.y, 7, pal.skin[1], ol, ow);
  // 견갑
  {
    const dx = J.elbow1.x - J.sh1.x, dy = J.elbow1.y - J.sh1.y, a = Math.atan2(dy, dx);
    const cx = J.sh1.x + dx * 0.1, cy = J.sh1.y + dy * 0.1;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    olPoly(ctx, [-6, -12, -2, -22, 3, -12, 8, -20, 11, -10, 14, -3, 12, 12, -6, 13, -12, 0], pal.metal[1], ol, ow);
    ctx.fillStyle = pal.metal[2]; ctx.beginPath(); polyPath(ctx, [-6, -6, 8, -8, 9, -3, -5, -1]); ctx.fill();
    ctx.restore();
  }
}

function orcHead(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 상투
  olPoly(ctx, [-10, -12, -16, -24, -8, -20, -2, -30, 0, -16], pal.hair[1], ol, ow);
  // 머리 (각진)
  olPoly(ctx, [-14, -8, -8, -16, 6, -15, 14, -8, 17, 2, 16, 12, 8, 17, -6, 16, -14, 6], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0]; ctx.beginPath(); polyPath(ctx, [-14, -8, -6, -14, -4, 16, -6, 16, -14, 6]); ctx.fill();
  // 눈썹뼈
  ctx.fillStyle = pal.skin[0]; ctx.beginPath(); polyPath(ctx, [2, -6, 16, -4, 15, -1, 3, -2]); ctx.fill();
  // 눈
  ctx.fillStyle = pal.eye[1]; ctx.beginPath(); polyPath(ctx, [7, -2, 13, -1.2, 12, 1.2, 7.5, 1]); ctx.fill();
  if (!opt.flash && !opt.ghost) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 10, 0, 7, '255,70,30', 0.6); ctx.globalCompositeOperation = 'source-over'; }
  // 입 + 엄니
  ctx.strokeStyle = ol; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(6, 10); ctx.lineTo(16, 9); ctx.stroke();
  olPoly(ctx, [8, 10, 10, 1, 12, 10], pal.tusk[1], ol, 1.2);
  // 귀
  olPoly(ctx, [-6, -2, -16, -8, -10, 4], pal.skin[1], ol, 1.2);
  ctx.restore();
}

function orcAxe(ctx, J, pal, ent) {
  const ol = pal.ol, L = RIG_ORC.wlen;
  weaponFrame(ctx, J.hand1, J.wAng);
  olPoly(ctx, [-18, -3, L, -3.5, L, 3.5, -18, 3], pal.wood[1], ol, 1.6);
  ctx.fillStyle = pal.wood[2]; ctx.beginPath(); polyPath(ctx, [-16, -2.5, L - 4, -2.5, L - 4, -0.8, -16, -0.8]); ctx.fill();
  ctx.fillStyle = pal.leather[1];
  for (let x = -12; x < 8; x += 5) ctx.fillRect(x, -3.5, 2.5, 7);
  // 도끼날 (진행방향 +y)
  olPoly(ctx, [L - 34, 3, L - 4, 3, L + 6, 14, L + 8, 34, L - 8, 30, L - 26, 36, L - 34, 18], pal.metal[1], ol, 1.8);
  ctx.fillStyle = pal.metal[2]; ctx.beginPath(); polyPath(ctx, [L - 26, 31, L - 8, 25, L + 6, 30, L + 7, 33, L - 8, 29, L - 25, 34]); ctx.fill();
  ctx.fillStyle = pal.metal[0]; ctx.beginPath(); polyPath(ctx, [L - 30, 5, L - 8, 5, L - 12, 14, L - 28, 15]); ctx.fill();
  olPoly(ctx, [L - 2, -3, L + 12, -10, L + 4, 0], pal.metal[1], ol, 1.2);
  ctx.restore();
}

// ============================================================
//  암흑 술사 (원거리 마법)
// ============================================================
const RIG_MAGE = {
  scale: 1.1, thigh: 26, shin: 27, torso: 34, neck: 4, headR: 12, uArm: 21, fArm: 20,
  shDrop: 5, shOff: 3, footH: 3, wWaist: 11, wChest: 12, wlen: 104,
  pal: {
    ol: '#0d0814',
    robe: ['#1a0d2c', '#3a2160', '#643f9c'],
    robe2: ['#120820', '#261440', '#3c2462'],
    trim: ['#8a6a2c', '#d6b04e', '#f7e19a'],
    face: ['#050308', '#0c0714', '#1c1228'],
    eye: ['#d45aff', '#ecaaff', '#ffffff'],
    wood: ['#2a1a10', '#4c3120', '#6e4a30'],
    skin: ['#6b5a7a', '#9888aa', '#c4b6d4'],
    orb: ['#7b2cbf', '#c77dff', '#f1d3ff'],
  },
};

function drawMage(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.6;
  if (J.wb) mageStaff(ctx, J, pal, ent, opt);
  limb(ctx, J.sh2, J.elbow2, J.hand2, 5.5, 6, 7, pal.robe2, pal.robe2, ol, ow);
  circleOl(ctx, J.hand2.x, J.hand2.y, 3.4, pal.skin[1], ol, 1.2);
  if (ent.castGlow > 0 && !opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, J.hand2.x, J.hand2.y, 22 + ent.castGlow * 14, '200,90,255', 0.5 + ent.castGlow * 0.4);
    ctx.globalCompositeOperation = 'source-over';
  }
  // 로브 치마
  const hem = Math.max(J.foot1.y, J.foot2.y) - 1;
  const x0 = Math.min(J.foot1.x, J.foot2.x, J.hip.x - 10) - 8, x1 = Math.max(J.foot1.x, J.foot2.x, J.hip.x + 10) + 8;
  const sway = Math.sin(Game.time * 0.12 + ent.id) * 2;
  olPoly(ctx, [J.hip.x - 11, J.hip.y - 4, J.hip.x + 11, J.hip.y - 4, x1 + sway, hem, (x0 + x1) / 2 + 4, hem + 2, x0 + sway, hem], pal.robe[1], ol, ow);
  ctx.fillStyle = pal.robe[0];
  ctx.beginPath(); polyPath(ctx, [J.hip.x - 11, J.hip.y - 4, J.hip.x - 3, J.hip.y - 4, (x0 + x1) / 2 - 4, hem + 1, x0 + sway, hem]); ctx.fill();
  ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0 + sway + 1, hem - 2); ctx.lineTo((x0 + x1) / 2 + 4, hem); ctx.lineTo(x1 + sway - 1, hem - 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(J.hip.x + 7, J.hip.y); ctx.lineTo(x1 + sway - 6, hem - 2); ctx.stroke();
  // 상체
  const F = torsoFrame(J), Hh = J.hip, L = F.L;
  olPoly(ctx, [...tp(Hh, F, -11, -4), ...tp(Hh, F, 11, -4), ...tp(Hh, F, 12, L * 0.6), ...tp(Hh, F, 10, L + 3), ...tp(Hh, F, -10, L + 3), ...tp(Hh, F, -12, L * 0.5)], pal.robe[1], ol, ow);
  ctx.fillStyle = pal.robe[0]; ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, -11, -4), ...tp(Hh, F, -3, -4), ...tp(Hh, F, -3, L + 3), ...tp(Hh, F, -10, L + 3), ...tp(Hh, F, -12, L * 0.5)]); ctx.fill();
  olPoly(ctx, [...tp(Hh, F, -11.5, 0), ...tp(Hh, F, 11.5, 0), ...tp(Hh, F, 11.5, 5), ...tp(Hh, F, -11.5, 5)], pal.trim[1], ol, 1.1);
  // 두건
  mageHead(ctx, J, pal, ow, ent, opt);
  if (!J.wb) mageStaff(ctx, J, pal, ent, opt);
  limb(ctx, J.sh1, J.elbow1, J.hand1, 5.5, 6.2, 7.2, pal.robe, pal.robe, ol, ow);
  circleOl(ctx, J.hand1.x, J.hand1.y, 3.6, pal.skin[1], ol, 1.2);
}

function mageHead(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  olPoly(ctx, [-12, 10, -16, -2, -14, -12, -26, -22, -8, -18, 4, -18, 13, -8, 15, 4, 12, 14, 0, 16], pal.robe[1], ol, ow);
  ctx.fillStyle = pal.robe[0]; ctx.beginPath(); polyPath(ctx, [-12, 10, -16, -2, -14, -12, -26, -22, -8, -18, -6, 14]); ctx.fill();
  ctx.fillStyle = pal.face[1];
  ctx.beginPath(); ctx.ellipse(6, 2, 7, 9, 0.1, 0, TAU); ctx.fill();
  ctx.fillStyle = pal.eye[1];
  ctx.beginPath(); ctx.ellipse(7, 0, 2, 1.2, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11.5, 0.5, 1.5, 1.1, 0, 0, TAU); ctx.fill();
  if (!opt.flash && !opt.ghost) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 9, 0.3, 9, '210,110,255', 0.7); ctx.globalCompositeOperation = 'source-over'; }
  ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-1, -9); ctx.quadraticCurveTo(12, -12, 14, 2); ctx.stroke();
  ctx.restore();
}

function mageStaff(ctx, J, pal, ent, opt) {
  const ol = pal.ol, L = RIG_MAGE.wlen;
  weaponFrame(ctx, J.hand1, J.wAng);
  olPoly(ctx, [-40, -2.2, L - 12, -2.6, L - 12, 2.6, -40, 2.2], pal.wood[1], ol, 1.5);
  olPoly(ctx, [L - 16, -3, L - 6, -9, L + 12, -7, L + 18, 0, L + 12, 7, L - 6, 9, L - 16, 3], pal.trim[1], ol, 1.4);
  circleOl(ctx, L + 4, 0, 6.5, pal.orb[1], ol, 1.2);
  ctx.fillStyle = pal.orb[2]; ctx.beginPath(); ctx.arc(L + 2.5, -2, 2.2, 0, TAU); ctx.fill();
  if (!opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, L + 4, 0, 22 + (ent.castGlow || 0) * 18 + Math.sin(Game.time * 0.2) * 3, '190,90,255', 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

// ============================================================
//  보스 : 뿔의 군주 바르카스
// ============================================================
const RIG_BOSS = {
  scale: 1.78, thigh: 36, shin: 35, torso: 52, neck: 6, headR: 19, uArm: 34, fArm: 32,
  shDrop: 9, shOff: 7, footH: 5, wWaist: 24, wChest: 31, wlen: 126,
  pal: {
    ol: '#0c0506',
    skin: ['#3c0f0d', '#7c2621', '#b4473b'],
    fur: ['#140d0b', '#2b1f1a', '#46352c'],
    armor: ['#16161c', '#373945', '#6b7080'],
    gold: ['#7a5a1c', '#c9a24a', '#f5da8e'],
    horn: ['#7d6b4e', '#d6c5a0', '#f7eed6'],
    eye: ['#ffb31a', '#ffd84a', '#ffffff'],
    cape: ['#240505', '#4a0b0b', '#721616'],
    rune: ['#ff4a12', '#ff8a3a', '#ffe0a0'],
    hoof: ['#0e0b0a', '#26201c', '#3e3530'],
  },
};

function drawBoss(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.6;
  if (!opt.ghost && ent.cape) drawRibbon(ctx, ent, ent.cape, 18, 11, pal.cape[1], ol, ow);
  if (J.wb) bossAxe(ctx, J, pal, ent, opt);
  // 뒷팔
  limb(ctx, J.sh2, J.elbow2, J.hand2, 10, 9, 8, pal.skin, pal.skin, ol, ow);
  bracer(ctx, J.elbow2, J.hand2, 9.5, pal, ol);
  circleOl(ctx, J.hand2.x, J.hand2.y, 8, pal.skin[1], ol, ow);
  // 뒷다리
  limb(ctx, J.hip, J.knee2, J.foot2, 12.5, 10, 8, pal.fur, pal.fur, ol, ow);
  footShape(ctx, J.knee2, J.foot2, pal.hoof, ol, 10, 6, ow);
  // 몸통
  const F = torsoFrame(J), Hh = J.hip, L = F.L;
  olPoly(ctx, [...tp(Hh, F, -19, -6), ...tp(Hh, F, 19, -6), ...tp(Hh, F, 22, L * 0.4), ...tp(Hh, F, 27, L * 0.8), ...tp(Hh, F, 20, L + 7),
    ...tp(Hh, F, -16, L + 8), ...tp(Hh, F, -25, L * 0.7), ...tp(Hh, F, -21, L * 0.25)], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, -19, -6), ...tp(Hh, F, -8, -6), ...tp(Hh, F, -10, L + 7), ...tp(Hh, F, -16, L + 8), ...tp(Hh, F, -25, L * 0.7), ...tp(Hh, F, -21, L * 0.25)]); ctx.fill();
  // 복근/가슴
  ctx.strokeStyle = pal.skin[0]; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) { ctx.moveTo(...tp(Hh, F, 8, 10 + i * 9)); ctx.lineTo(...tp(Hh, F, 19, 11 + i * 9)); }
  ctx.moveTo(...tp(Hh, F, 4, L * 0.7)); ctx.quadraticCurveTo(...tp(Hh, F, 20, L * 0.62), ...tp(Hh, F, 26, L * 0.8));
  ctx.stroke();
  ctx.fillStyle = pal.skin[2]; ctx.beginPath(); ctx.ellipse(...tp(Hh, F, 16, L * 0.84), 7, 5, Math.atan2(F.uy, F.ux), 0, TAU); ctx.fill();
  // 가슴 갑옷 끈 + 룬
  ctx.strokeStyle = pal.armor[1]; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, -18, L * 0.95)); ctx.lineTo(...tp(Hh, F, 20, L * 0.25)); ctx.stroke();
  ctx.strokeStyle = pal.gold[1]; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, -18, L * 0.95)); ctx.lineTo(...tp(Hh, F, 20, L * 0.25)); ctx.stroke();
  // 벨트
  olPoly(ctx, [...tp(Hh, F, -20, -2), ...tp(Hh, F, 20, -2), ...tp(Hh, F, 20, 10), ...tp(Hh, F, -20, 10)], pal.armor[1], ol, 1.4);
  // 해골 버클
  {
    const [bx, by] = tp(Hh, F, 12, 4);
    circleOl(ctx, bx, by, 7, pal.horn[1], ol, 1.2);
    ctx.fillStyle = ol; ctx.beginPath(); ctx.arc(bx - 2.5, by - 1, 1.8, 0, TAU); ctx.arc(bx + 2.5, by - 1, 1.8, 0, TAU); ctx.fill();
  }
  // 허리 갑옷 스커트
  olPoly(ctx, [...tp(Hh, F, -20, -2), ...tp(Hh, F, -5, -2), ...tp(Hh, F, -8, -26), ...tp(Hh, F, -22, -20)], pal.armor[1], ol, 1.4);
  olPoly(ctx, [...tp(Hh, F, 2, -2), ...tp(Hh, F, 20, -2), ...tp(Hh, F, 18, -24), ...tp(Hh, F, 4, -28)], pal.armor[1], ol, 1.4);
  ctx.fillStyle = pal.gold[1];
  ctx.beginPath(); polyPath(ctx, [...tp(Hh, F, 4, -25), ...tp(Hh, F, 18, -21), ...tp(Hh, F, 18, -24), ...tp(Hh, F, 4, -28)]); ctx.fill();
  // 앞다리
  limb(ctx, J.hip, J.knee1, J.foot1, 13, 10.5, 8.5, pal.fur, pal.fur, ol, ow);
  footShape(ctx, J.knee1, J.foot1, pal.hoof, ol, 11, 6.5, ow);
  circleOl(ctx, J.knee1.x, J.knee1.y, 8, pal.armor[1], ol, 1.3);
  // 머리 (보스마다 다름)
  const HD2 = { skull: bossHeadSkull, eye: bossHeadEye }[(ent.rig && ent.rig.head) || 'bull'] || bossHead;
  HD2(ctx, J, pal, ow, ent, opt);
  if (!J.wb) bossAxe(ctx, J, pal, ent, opt);
  // 앞팔
  limb(ctx, J.sh1, J.elbow1, J.hand1, 11, 9.5, 8.5, pal.skin, pal.skin, ol, ow);
  bracer(ctx, J.elbow1, J.hand1, 10, pal, ol);
  circleOl(ctx, J.hand1.x, J.hand1.y, 8.5, pal.skin[1], ol, ow);
  // 거대 견갑
  {
    const dx = J.elbow1.x - J.sh1.x, dy = J.elbow1.y - J.sh1.y, a = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(J.sh1.x + dx * 0.08, J.sh1.y + dy * 0.08); ctx.rotate(a);
    olPoly(ctx, [-10, -16, -6, -30, 0, -17, 7, -34, 11, -16, 17, -26, 18, -10, 20, 4, 15, 17, -8, 18, -16, 2], pal.armor[1], ol, ow);
    ctx.fillStyle = pal.armor[2]; ctx.beginPath(); polyPath(ctx, [-8, -10, 14, -12, 16, -6, -7, -4]); ctx.fill();
    ctx.strokeStyle = pal.gold[1]; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-12, 6); ctx.quadraticCurveTo(4, 12, 17, 6); ctx.stroke();
    ctx.restore();
  }
}

function bracer(ctx, e, h, r, pal, ol) {
  const m = { x: lerp(e.x, h.x, 0.45), y: lerp(e.y, h.y, 0.45) }, n = { x: lerp(e.x, h.x, 0.88), y: lerp(e.y, h.y, 0.88) };
  ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, m, n, r + 1.6, r + 1.2); ctx.fill();
  shadedSeg(ctx, m, n, r, r * 0.92, pal.armor);
  const dx = n.x - m.x, dy = n.y - m.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let i = 0; i < 2; i++) {
    const px = lerp(m.x, n.x, 0.3 + i * 0.4), py = lerp(m.y, n.y, 0.3 + i * 0.4);
    olPoly(ctx, [px + nx * r - dx / L * 3, py + ny * r - dy / L * 3, px + nx * (r + 9), py + ny * (r + 9), px + nx * r + dx / L * 3, py + ny * r + dy / L * 3], pal.armor[2], ol, 1.2);
  }
}

function bossHead(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 뒤쪽 뿔
  olPoly(ctx, [-8, -10, -20, -18, -30, -34, -24, -52, -16, -60, -20, -46, -14, -30, -2, -18], pal.horn[0], ol, ow);
  // 갈기
  olPoly(ctx, [-18, -12, -26, -2, -22, 8, -28, 16, -16, 18, -8, 20, -4, 6], pal.fur[1], ol, ow);
  // 머리
  olPoly(ctx, [-16, -10, -8, -18, 6, -18, 16, -10, 24, -4, 30, 2, 30, 12, 22, 17, 8, 18, -6, 16, -16, 6], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0]; ctx.beginPath(); polyPath(ctx, [-16, -10, -8, -18, -4, 16, -6, 16, -16, 6]); ctx.fill();
  // 주둥이
  olPoly(ctx, [16, 0, 30, 1, 33, 8, 30, 15, 18, 16], pal.skin[2], ol, 1.3);
  ctx.fillStyle = ol; ctx.beginPath(); ctx.ellipse(28, 6, 2, 3, 0.3, 0, TAU); ctx.fill();
  // 코걸이
  ctx.strokeStyle = pal.gold[1]; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(29, 13, 4.5, -0.6, Math.PI * 1.1); ctx.stroke();
  // 눈 (빛남)
  ctx.fillStyle = ol; ctx.beginPath(); polyPath(ctx, [6, -8, 19, -5, 18, -1, 7, -2]); ctx.fill();
  ctx.fillStyle = ent.enraged ? '#ff4020' : pal.eye[1];
  ctx.beginPath(); polyPath(ctx, [9, -6, 17, -4, 16.5, -2.2, 9.5, -3]); ctx.fill();
  if (!opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 13, -4, 14, ent.enraged ? '255,60,20' : '255,190,40', 0.8);
    ctx.globalCompositeOperation = 'source-over';
  }
  // 앞 뿔
  olPoly(ctx, [2, -14, 10, -24, 14, -40, 26, -54, 38, -58, 30, -50, 24, -36, 20, -22, 14, -12], pal.horn[1], ol, ow);
  ctx.fillStyle = pal.horn[2]; ctx.beginPath(); polyPath(ctx, [8, -20, 14, -36, 24, -50, 18, -36, 12, -20]); ctx.fill();
  ctx.strokeStyle = pal.horn[0]; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(8, -18); ctx.lineTo(15, -17); ctx.moveTo(11, -27); ctx.lineTo(18, -26); ctx.moveTo(16, -36); ctx.lineTo(22, -38); ctx.stroke();
  ctx.restore();
}

function bossAxe(ctx, J, pal, ent, opt) {
  const ol = pal.ol, L = RIG_BOSS.wlen;
  weaponFrame(ctx, J.hand1, J.wAng);
  olPoly(ctx, [-30, -4, L + 10, -4.5, L + 10, 4.5, -30, 4], pal.fur[1], ol, 1.6);
  ctx.fillStyle = pal.gold[1];
  for (const x of [-26, -6, L - 40]) ctx.fillRect(x, -5, 5, 10);
  // 양날 도끼
  const bl = [L - 44, 4, L - 4, 4, L + 10, 20, L + 14, 52, L - 8, 44, L - 30, 54, L - 46, 26];
  olPoly(ctx, bl, pal.armor[1], ol, 1.8);
  const bl2 = [L - 40, -4, L - 6, -4, L + 6, -16, L + 8, -38, L - 10, -32, L - 28, -40, L - 42, -18];
  olPoly(ctx, bl2, pal.armor[1], ol, 1.8);
  ctx.fillStyle = pal.armor[2];
  ctx.beginPath(); polyPath(ctx, [L - 30, 50, L - 8, 40, L + 13, 48, L + 13, 52, L - 8, 45, L - 29, 54]); ctx.fill();
  ctx.fillStyle = pal.armor[0];
  ctx.beginPath(); polyPath(ctx, [L - 40, 6, L - 8, 6, L - 14, 22, L - 38, 22]); ctx.fill();
  // 룬 문양
  const rg = ent.enraged ? 1 : 0.6;
  ctx.strokeStyle = pal.rune[1]; ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(L - 34, 30); ctx.lineTo(L - 26, 38); ctx.lineTo(L - 18, 28); ctx.lineTo(L - 10, 36);
  ctx.moveTo(L - 32, -20); ctx.lineTo(L - 22, -28); ctx.lineTo(L - 12, -20);
  ctx.stroke();
  if (!opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, L - 22, 33, 28, '255,90,20', 0.45 * rg + Math.sin(Game.time * 0.15) * 0.1);
    drawGlow(ctx, L - 22, -24, 22, '255,90,20', 0.35 * rg);
    if (ent.axeGlow) drawGlow(ctx, L - 10, 10, 70 * ent.axeGlow, '255,120,40', 0.7 * ent.axeGlow);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

// 보스 머리 변형 : 해골형
function bossHeadSkull(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 뒤로 뻗은 뿔
  olPoly(ctx, [-8, -10, -22, -20, -34, -40, -26, -58, -18, -64, -22, -48, -14, -30, -2, -18], pal.horn[0], ol, ow);
  olPoly(ctx, [2, -12, 12, -26, 20, -46, 34, -60, 44, -62, 32, -48, 24, -30, 16, -14], pal.horn[1], ol, ow);
  // 두개골
  olPoly(ctx, [-16, -8, -10, -18, 6, -19, 18, -12, 26, -2, 28, 10, 20, 18, 4, 20, -8, 17, -16, 6], pal.horn[1], ol, ow);
  ctx.fillStyle = pal.horn[0];
  ctx.beginPath(); polyPath(ctx, [-16, -8, -8, -16, -6, 18, -8, 17, -16, 6]); ctx.fill();
  // 눈구멍 (빛남)
  ctx.fillStyle = '#080404';
  ctx.beginPath(); polyPath(ctx, [4, -8, 18, -6, 17, 3, 5, 1]); ctx.fill();
  ctx.beginPath(); polyPath(ctx, [-6, -9, 1, -8, 1, 0, -6, -1]); ctx.fill();
  ctx.fillStyle = ent.enraged ? '#ff4020' : pal.eye[1];
  ctx.beginPath(); ctx.ellipse(11, -2, 4, 3, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-2, -4, 2.6, 2.4, 0, 0, TAU); ctx.fill();
  if (!opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 11, -2, 16, ent.enraged ? '255,60,20' : (pal.eyeGlow || '255,190,40'), 0.85);
    drawGlow(ctx, -2, -4, 11, ent.enraged ? '255,60,20' : (pal.eyeGlow || '255,190,40'), 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
  // 이빨
  ctx.fillStyle = pal.horn[2];
  for (let i = 0; i < 5; i++) { ctx.beginPath(); polyPath(ctx, [6 + i * 4, 13, 8 + i * 4, 21, 10 + i * 4, 13]); ctx.fill(); }
  ctx.strokeStyle = ol; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(4, 13); ctx.lineTo(27, 11); ctx.stroke();
  ctx.restore();
}

// 보스 머리 변형 : 외눈 괴물
function bossHeadEye(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 촉수 갈기
  ctx.strokeStyle = pal.fur[1]; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = -2.6 + i * 0.32, L = 26 + (i % 3) * 12;
    ctx.lineWidth = 7 - (i % 3);
    ctx.beginPath(); ctx.moveTo(-6, -4);
    ctx.quadraticCurveTo(-6 + Math.cos(a) * L * 0.7, -4 + Math.sin(a) * L * 0.7 + Math.sin(Game.time * 0.04 + i) * 5,
      -6 + Math.cos(a) * L, -4 + Math.sin(a) * L);
    ctx.stroke();
  }
  // 머리 덩어리
  olPoly(ctx, [-16, -6, -6, -18, 10, -20, 24, -12, 30, 0, 26, 14, 10, 20, -6, 18, -16, 8], pal.skin[1], ol, ow);
  ctx.fillStyle = pal.skin[0];
  ctx.beginPath(); polyPath(ctx, [-16, -6, -6, -16, -4, 18, -6, 18, -16, 8]); ctx.fill();
  // 커다란 외눈
  circleOl(ctx, 10, -1, 12, '#f0e8d8', ol, ow);
  ctx.fillStyle = ent.enraged ? '#ff3010' : (pal.eye[0] || '#ffb31a');
  ctx.beginPath(); ctx.arc(13, -1, 7.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#100808';
  ctx.beginPath(); ctx.ellipse(14, -1, 3, 6.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(8, -6, 3, 0, TAU); ctx.fill();
  if (!opt.flash && !opt.ghost) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 13, -1, 26, ent.enraged ? '255,60,20' : (pal.eyeGlow || '255,190,40'), 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
  // 아래턱 이빨
  ctx.fillStyle = pal.horn[2];
  for (let i = 0; i < 4; i++) { ctx.beginPath(); polyPath(ctx, [2 + i * 6, 16, 4 + i * 6, 23, 7 + i * 6, 16]); ctx.fill(); }
  ctx.restore();
}

// 보스 종류별 팔레트 / 머리 (dungeons.js 의 BOSS_DEFS 를 적용)
function makeBossRig(def) {
  const pal = Object.assign({}, RIG_BOSS.pal);
  if (def.skin) pal.skin = def.skin;
  if (def.armor) pal.armor = def.armor;
  if (def.horn) pal.horn = def.horn;
  if (def.elem) { pal.rune = ['#ffffff', 'rgb(' + def.elem + ')', '#ffffff']; pal.eyeGlow = def.elem; }
  const rig = Object.assign({}, RIG_BOSS, {
    scale: def.scale || RIG_BOSS.scale,
    pal,
    head: def.head || 'bull',
    draw(ctx, J, p2, ent, opt) { drawBoss(ctx, J, p2, ent, opt); },
  });
  rig.flashPal = mapPal(pal, c => (typeof c === 'string' && c[0] === '#' ? mixHex(c, '#ffffff', 0.72) : c));
  rig.flashPal.ol = mixHex(pal.ol, '#ffffff', 0.35);
  rig._ghost = {};
  rig.ghostPal = rgb => rig._ghost[rgb] || (rig._ghost[rgb] = mapPal(pal, () => `rgb(${rgb})`));
  return rig;
}

// 몬스터 색 변형 : 테마에 맞게 팔레트를 물들인다
function tintRig(base, tint, amt, keep) {
  const hex = c => typeof c === 'string' && c[0] === '#';
  const pal = mapPal(base.pal, c => (hex(c) ? mixHex(c, tint, amt) : c));
  // 눈·보석처럼 색을 유지할 항목만 되돌린다 (없는 키는 건드리지 않음)
  if (keep) for (const k of keep) if (base.pal[k] !== undefined) pal[k] = base.pal[k];
  const rig = Object.assign({}, base, { pal });
  rig.flashPal = mapPal(pal, c => (hex(c) ? mixHex(c, '#ffffff', 0.72) : c));
  rig.flashPal.ol = base.flashPal.ol;
  rig._ghost = {};
  rig.ghostPal = rgb => rig._ghost[rgb] || (rig._ghost[rgb] = mapPal(pal, () => `rgb(${rgb})`));
  return rig;
}

RIG_PLAYER.draw = drawPlayer;
RIG_GOBLIN.draw = drawGoblin;
RIG_ORC.draw = drawOrc;
RIG_MAGE.draw = drawMage;
RIG_BOSS.draw = drawBoss;

for (const R of [RIG_PLAYER, RIG_GOBLIN, RIG_ORC, RIG_MAGE, RIG_BOSS]) {
  R.flashPal = mapPal(R.pal, c => mixHex(c, '#ffffff', 0.72));
  R.flashPal.ol = mixHex(R.pal.ol, '#ffffff', 0.35);
  R._ghost = {};
  R.ghostPal = rgb => R._ghost[rgb] || (R._ghost[rgb] = mapPal(R.pal, () => `rgb(${rgb})`));
}
