'use strict';
// ============================================================
//  리그 캐릭터 새 그림 : 고블린 · 오크 · 암흑 술사 · 뿔의 군주 바르카스
//   - 공용 도형 함수(olPoly · limb · shadedSeg …)를 그림 엔진(PT)으로 바꿔 주인공까지 입체감이 붙는다
//   - 관절 계산(리그) · 애니메이션은 그대로, 생김새만 새로 그린다
// ============================================================

// ---------- 공용 도형 → PT ----------
olPoly = function (ctx, pts, fill, ol, ow) { PT.fill(ctx, PT.poly(pts), fill, { ow: ow || 0, ol, rim: 1 }); };
olSmooth = function (ctx, pts, fill, ol, ow, t) { PT.fill(ctx, PT.sm(pts, t), fill, { ow: ow || 0, ol, rim: 1 }); };
circleOl = function (ctx, x, y, r, fill, ol, ow) { PT.fill(ctx, PT.ell(x, y, r, r), fill, { ow: ow || 0, ol, rim: 1, spec: r > 5 ? 0.4 : 0 }); };
shadedSeg = function (ctx, a, b, r0, r1, m) {
  if (m[0] === m[1]) { ctx.fillStyle = m[0]; ctx.beginPath(); capsulePath(ctx, a, b, r0, r1); ctx.fill(); return; }
  PT.fill(ctx, PT.cap(a.x, a.y, b.x, b.y, r0, r1), m, { ow: 0, rim: 1 });
};
footShape = function (ctx, knee, ft, m, ol, len, h, ow) {
  const dx = ft.x - knee.x, dy = ft.y - knee.y, L = Math.hypot(dx, dy) || 1;
  const sx = dx / L, s_y = dy / L, fx = s_y, fy = -sx;
  const P2 = (a, b) => [ft.x + fx * a + sx * b, ft.y + fy * a + s_y * b];
  PT.fill(ctx, PT.sm([...P2(-4, -h), ...P2(len * 0.45, -h * 1.1), ...P2(len, -h * 0.1), ...P2(len + 1, h * 0.8), ...P2(-4.5, h * 0.9)], 0.45), m, { ow: ow || 0, ol, rim: 1 });
};

// ---------- 리그 그리기 도우미 ----------
const RA = {
  // 몸통 좌표 (앞 f, 위 u) 점열 → 평평한 배열
  tp(Hh, F, arr) { const o = []; for (let i = 0; i < arr.length; i += 2) { const p = tp(Hh, F, arr[i], arr[i + 1]); o.push(p[0], p[1]); } return o; },
  // 관절 사이 분절 (외곽선 + 셰이딩)
  seg(ctx, a, b, r0, r1, m, ol, ow, o) { PT.fill(ctx, PT.cap(a.x, a.y, b.x, b.y, r0, r1), m, Object.assign({ ow, ol, rim: 1 }, o || {})); },
  // a→b 를 따라가는 로컬 좌표계 (x = a→b 방향)
  frame(ctx, a, b, u = 0) { const ang = Math.atan2(b.y - a.y, b.x - a.x); ctx.save(); ctx.translate(lerp(a.x, b.x, u), lerp(a.y, b.y, u)); ctx.rotate(ang); return Math.hypot(b.x - a.x, b.y - a.y); },
  // 손 (주먹) : 손등 + 엄지
  fist(ctx, h, e, r, m, ol, ow) {
    const a = Math.atan2(h.y - e.y, h.x - e.x);
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(a);
    PT.fill(ctx, PT.sm([-r * 0.8, -r, r * 0.7, -r * 1.05, r * 1.25, -r * 0.2, r * 1.1, r * 0.8, -r * 0.6, r * 1.05, -r * 1.05, 0], 0.7), m, { ow, ol, rim: 1 });
    ctx.strokeStyle = PT.rgba(m[0], 0.9); ctx.lineWidth = Math.max(0.8, r * 0.18); ctx.beginPath();
    for (let i = 0; i < 2; i++) { ctx.moveTo(r * 0.55, -r * 0.5 + i * r * 0.6); ctx.lineTo(r * 1.05, -r * 0.45 + i * r * 0.6); } ctx.stroke();
    ctx.restore();
  },
  glow(ctx, opt, x, y, r, col, a) { if (opt.flash || opt.ghost) return; PT.glow(ctx, x, y, r, col, a); },
};

// ============================================================
//  고블린 : 큰 귀 · 매부리코 · 덧니, 덧댄 가죽 옷, 못 박힌 몽둥이
// ============================================================
function drawGoblin2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.4, S = pal.skin, Cl = pal.cloth, F = torsoFrame(J), Hh = J.hip, L = F.L;
  if (J.wb) goblinWeapon2(ctx, J, pal, ent, opt);
  // 뒷팔 · 뒷다리
  const S0 = [PT.dk(S[0], 0.25), S[0], S[1]];
  RA.seg(ctx, J.sh2, J.elbow2, 3.8, 3.2, S0, ol, ow); RA.seg(ctx, J.elbow2, J.hand2, 3.4, 3, S0, ol, ow);
  RA.fist(ctx, J.hand2, J.elbow2, 3.6, S0, ol, ow);
  RA.seg(ctx, J.hip, J.knee2, 5, 3.8, S0, ol, ow); RA.seg(ctx, J.knee2, J.foot2, 3.8, 3.2, S0, ol, ow);
  goblinFoot(ctx, J.knee2, J.foot2, S0, ol, ow);
  // 몸통 : 배가 볼록한 작은 몸
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-9, -3, 9, -4, 13, L * 0.4, 10, L + 1, -7, L + 2, -11, L * 0.45]), 0.7), S, { ow, ol, tex: 'skin', ta: 0.4, rim: 1 });
  // 덧댄 가죽 조끼 + 어깨끈
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-10, L * 0.25, 2, L * 0.3, 5, L + 2, -8.5, L + 2.5]), 0.4), Cl, { ow: 1.1, ol, tex: 'cloth', ta: 0.4, rim: 1 });
  ctx.strokeStyle = PT.rgba(Cl[2], 0.9); ctx.lineWidth = 0.9; ctx.setLineDash([1.6, 1.4]);
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, -4, L * 0.35)); ctx.lineTo(...tp(Hh, F, -3, L)); ctx.stroke(); ctx.setLineDash([]);
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [-7, L * 0.55, -2, L * 0.57, -2.5, L * 0.75, -7.5, L * 0.73])), [Cl[0], PT.mix(Cl[1], '#8a6a3a', 0.4), Cl[2]], { ow: 0.8, ol });   // 덧댄 조각
  // 허리띠 + 주머니 + 허리천
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-10, 4, 10.5, 4, 9, -12, 2, -8, -4, -14, -10, -6]), 0.3), [pal.cloth[0], PT.dk(pal.cloth[0], -0.2), Cl[1]], { ow: 1.1, ol });
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [-10.5, 4, 11, 4, 11, 0.5, -10.5, 0.5])), pal.wood, { ow: 1, ol });
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-12, 2, -6, 2, -6, -6, -12, -6]), 0.5), Cl, { ow: 1, ol });
  circleOl(ctx, ...tp(Hh, F, 7, 2.2), 1.6, pal.metal[2], ol, 0.8);
  // 앞다리
  RA.seg(ctx, J.hip, J.knee1, 5.4, 4, S, ol, ow); RA.seg(ctx, J.knee1, J.foot1, 4, 3.4, S, ol, ow);
  goblinFoot(ctx, J.knee1, J.foot1, S, ol, ow);
  goblinHead2(ctx, J, pal, ow, ent, opt);
  if (!J.wb) goblinWeapon2(ctx, J, pal, ent, opt);
  // 앞팔 + 가죽 팔목띠
  RA.seg(ctx, J.sh1, J.elbow1, 4, 3.4, S, ol, ow); RA.seg(ctx, J.elbow1, J.hand1, 3.6, 3.2, S, ol, ow);
  { const m = { x: lerp(J.elbow1.x, J.hand1.x, 0.45), y: lerp(J.elbow1.y, J.hand1.y, 0.45) }, n = { x: lerp(J.elbow1.x, J.hand1.x, 0.85), y: lerp(J.elbow1.y, J.hand1.y, 0.85) }; RA.seg(ctx, m, n, 4, 3.8, Cl, ol, 1); }
  RA.fist(ctx, J.hand1, J.elbow1, 3.9, S, ol, ow);
}
function goblinFoot(ctx, knee, ft, m, ol, ow) {
  const a = Math.atan2(ft.y - knee.y, ft.x - knee.x) - Math.PI / 2;
  ctx.save(); ctx.translate(ft.x, ft.y); ctx.rotate(a);
  PT.fill(ctx, PT.sm([-4, -3, 4, -3.4, 11, -1, 12, 2.6, -4.5, 3], 0.6), m, { ow, ol, rim: 1 });
  ctx.strokeStyle = PT.rgba(m[0], 0.9); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(8.6, 2.4); ctx.moveTo(5, -2); ctx.lineTo(5.4, 2.6); ctx.stroke();
  ctx.restore();
}
function goblinHead2(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head, S = pal.skin;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 큰 귀 (축 처짐 + 귀걸이)
  PT.fill(ctx, PT.sm([-5, -7, -16, -12, -30, -14, -22, -6, -12, 0, -5, 2], 0.5), S, { ow, ol, rim: 1 });
  PT.fill(ctx, PT.sm([-8, -5, -18, -10, -25, -11, -18, -6, -9, -1], 0.5), pal.ear, { ow: 0 });
  ctx.strokeStyle = pal.metal[2]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-20, -4.5, 2.4, 0, TAU); ctx.stroke();
  // 머리 : 위가 넓은 달걀형 + 턱
  PT.fill(ctx, PT.sm([-12, 4, -13, -7, -6, -14, 5, -14, 12, -8, 14, 0, 13, 8, 6, 13, -4, 12], 0.8), S, { ow, ol, tex: 'skin', ta: 0.35, rim: 1 });
  // 이마 주름 + 눈썹
  ctx.strokeStyle = PT.rgba(S[0], 0.9); ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(-2, -9); ctx.quadraticCurveTo(4, -11, 9, -9); ctx.stroke();
  // 눈 : 노란 흰자, 붉은 동공, 처진 눈두덩
  PT.fill(ctx, PT.sm([3, -3.5, 7, -6, 11.5, -4.5, 11, -0.5, 4, -0.2], 0.7), pal.eye, { ow: 0.9, ol, sh: 0.6, hl: 0 });
  PT.dot(ctx, 8.6, -2.6, 1.7, pal.pupil[0]); PT.dot(ctx, 8.1, -3.3, 0.6, '#ffffff');
  PT.fill(ctx, PT.poly([1.5, -6.5, 12.8, -5.5, 12, -3.8, 2, -4]), S, { ow: 0.9, ol });
  // 매부리코
  PT.fill(ctx, PT.sm([8, -3, 14, -1, 21, 4, 18, 7.5, 13, 6, 10, 4], 0.6), S, { ow, ol, rim: 1, spec: 0.5 });
  PT.dot(ctx, 16, 5.6, 0.9, PT.rgba(S[0], 1));
  // 입 : 비뚤어진 웃음 + 덧니
  PT.fill(ctx, PT.sm([2, 7, 8, 9, 14, 7.5, 12, 11.5, 5, 11.5], 0.6), '#3a0a0a', { ow: 1, ol, flat: true });
  ctx.fillStyle = pal.teeth[1]; ctx.beginPath(); polyPath(ctx, [5, 8, 6.2, 10.6, 7.4, 8.4]); polyPath(ctx, [10.5, 8.2, 11.4, 10.8, 12.6, 7.8]); ctx.fill();
  ctx.fillStyle = pal.teeth[2]; ctx.beginPath(); polyPath(ctx, [8, 11.4, 9, 9, 10, 11.4]); ctx.fill();
  // 투구 / 두건
  if (ent.gear === 'helm') {
    PT.fill(ctx, PT.sm([-14, -2, -13, -10, -6, -16, 4, -17, 11, -13, 14, -6, 15, -2], 0.6), pal.metal, { ow, ol, gloss: 1, rim: 1 });
    PT.fill(ctx, PT.poly([-14, -3, 15.5, -3, 15.5, -0.5, -14, -0.5]), pal.metal, { ow: 0.9, ol });
    for (const x of [-8, 0, 8]) PT.dot(ctx, x, -1.8, 0.8, pal.metal[2]);
    BA.horn(ctx, 1, -16, -1.65, 9, 2.4, 0.3, pal.metal, { ow: 1 });
    ctx.strokeStyle = PT.rgba(pal.metal[0], 0.9); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(8, -10); ctx.lineTo(6.5, -7); ctx.stroke();        // 찌그러진 금
  } else {
    const B = pal.band, wv = Math.sin(Game.time * 0.2 + ent.id) * 1.6;
    PT.fill(ctx, PT.sm([-12, -11, -18, -6 + wv, -25, -3 + wv, -20, 1 + wv, -12, -4], 0.5), [B[0], B[0], B[1]], { ow: 1, ol });
    PT.fill(ctx, PT.sm([-13, -4, -12, -11, -4, -16, 6, -15, 12, -10, 13.5, -5], 0.6), B, { ow, ol, tex: 'cloth', ta: 0.3, rim: 1 });
    for (const [x, y] of [[-6, -10], [2, -12], [8, -8]]) PT.dot(ctx, x, y, 1.1, PT.rgba(B[2], 0.9));
  }
  ctx.restore();
}
function goblinWeapon2(ctx, J, pal, ent, opt) {
  const ol = pal.ol;
  if (ent.kind === 'thrower') {
    if (ent.holdRock) PT.fill(ctx, PT.sm([J.hand1.x - 5, J.hand1.y - 6, J.hand1.x + 3, J.hand1.y - 9, J.hand1.x + 7, J.hand1.y - 3, J.hand1.x + 2, J.hand1.y + 2, J.hand1.x - 5, J.hand1.y], 0.7), ['#4a4238', '#8a8173', '#c0b8a8'], { ow: 1.3, ol, tex: 'stone', ta: 0.5, rim: 1 });
    return;
  }
  weaponFrame(ctx, J.hand1, J.wAng);
  const Wd = pal.wood, M = pal.metal;
  PT.fill(ctx, PT.sm([-6, -2.2, 14, -3, 38, -7.5, 47, -4, 47, 4, 38, 7.5, 14, 3, -6, 2.2], 0.5), Wd, { ow: 1.4, ol, tex: 'wood', ta: 0.5, rim: 1 });
  ctx.strokeStyle = PT.rgba(Wd[0], 1); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(32, 1, 2, 0, TAU); ctx.stroke();                         // 옹이
  PT.fill(ctx, PT.poly([-6, -2.6, 4, -2.8, 4, 2.8, -6, 2.6]), pal.cloth, { ow: 1, ol });                                                      // 손잡이 감은 천
  for (const [x, y, a] of [[24, -5, -1.5], [34, -7.5, -1.4], [42, -6.5, -1.1], [29, 5.5, 1.5], [39, 7.5, 1.4], [46, 3, 0.7]]) BA.horn(ctx, x, y, a, 5.5, 1.5, 0, M, { ow: 0.8, hl: 1 });
  ctx.restore();
}

// ============================================================
//  오크 전사 : 엄니 · 상투 · 흉터, 가죽 멜빵과 해골 버클, 가시 견갑, 날 넓은 전투 도끼
// ============================================================
function drawOrc2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.7, S = pal.skin, Lt = pal.leather, Mt = pal.metal, F = torsoFrame(J), Hh = J.hip, L = F.L;
  const S0 = [PT.dk(S[0], 0.25), S[0], S[1]], L0 = [PT.dk(Lt[0], 0.25), Lt[0], Lt[1]];
  if (J.wb) orcAxe2(ctx, J, pal, ent, opt);
  // 뒷팔
  RA.seg(ctx, J.sh2, J.elbow2, 8, 7, S0, ol, ow); RA.seg(ctx, J.elbow2, J.hand2, 7.4, 6.4, S0, ol, ow);
  RA.fist(ctx, J.hand2, J.elbow2, 6.4, S0, ol, ow);
  // 뒷다리 (가죽 바지 + 장화)
  RA.seg(ctx, J.hip, J.knee2, 10, 8, L0, ol, ow); RA.seg(ctx, J.knee2, J.foot2, 8, 7, L0, ol, ow);
  footShape(ctx, J.knee2, J.foot2, L0, ol, 13, 5.5, ow);
  // 거대한 몸통 : 가슴 · 배
  const torso = PT.sm(RA.tp(Hh, F, [-16, -4, 17, -4, 22, L * 0.35, 24, L * 0.75, 16, L + 6, -12, L + 6, -21, L * 0.7, -18, L * 0.25]), 0.6);
  PT.fill(ctx, torso, S, { ow, ol, tex: 'skin', ta: 0.4, rim: 1, sh: 1.1 });
  ctx.save(); ctx.clip(torso);
  ctx.strokeStyle = PT.rgba(S[0], 0.85); ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 2, L * 0.78)); ctx.quadraticCurveTo(...tp(Hh, F, 14, L * 0.62), ...tp(Hh, F, 24, L * 0.76)); ctx.stroke();       // 가슴선
  ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 9, 12 + i * 8)); ctx.lineTo(...tp(Hh, F, 19, 13 + i * 8)); ctx.stroke(); }
  // 전투 문신
  ctx.strokeStyle = pal.paint[1]; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 4, L * 0.92)); ctx.lineTo(...tp(Hh, F, 12, L * 0.7)); ctx.lineTo(...tp(Hh, F, 8, L * 0.56)); ctx.moveTo(...tp(Hh, F, 14, L * 0.94)); ctx.lineTo(...tp(Hh, F, 20, L * 0.74)); ctx.stroke();
  ctx.restore();
  // 가죽 멜빵 (어깨 → 허리) + 쇠고리
  const s1 = tp(Hh, F, -14, L * 0.95), s2 = tp(Hh, F, 20, L * 0.15);
  PT.line(ctx, [s1[0], s1[1], s2[0], s2[1]], Lt[1], 6, 1.4);
  PT.line(ctx, [s1[0], s1[1], s2[0], s2[1]], PT.rgba(Lt[2], 0.7), 1.2);
  circleOl(ctx, ...tp(Hh, F, 6, L * 0.52), 3.4, Mt[1], ol, 1.1);
  // 벨트 + 해골 버클 + 허리천
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [-17, 0, 18, 0, 18, 9, -17, 9])), Lt, { ow: 1.4, ol, tex: 'cloth', ta: 0.3 });
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [4, 0, 17, 0, 15, -26, 10, -22, 6, -24]), 0.4), pal.cloth, { ow: 1.3, ol, tex: 'cloth', ta: 0.4, rim: 1 });
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-16, 0, -6, 0, -8, -20, -17, -16]), 0.4), [PT.dk(pal.cloth[0], 0.2), pal.cloth[0], pal.cloth[1]], { ow: 1.3, ol });
  { const [bx, by] = tp(Hh, F, 11, 4.5); PT.fill(ctx, PT.sm([bx - 5, by - 4, bx + 5, by - 4, bx + 5.5, by + 2, bx + 2, by + 5.5, bx - 2, by + 5.5, bx - 5.5, by + 2], 0.6), pal.tusk, { ow: 1.1, ol, spec: 0.5 }); ctx.fillStyle = ol; ctx.beginPath(); ctx.arc(bx - 2, by - 0.5, 1.4, 0, TAU); ctx.arc(bx + 2, by - 0.5, 1.4, 0, TAU); ctx.fill(); }
  // 앞다리
  RA.seg(ctx, J.hip, J.knee1, 10.5, 8.5, Lt, ol, ow); RA.seg(ctx, J.knee1, J.foot1, 8.5, 7.5, Lt, ol, ow);
  footShape(ctx, J.knee1, J.foot1, [PT.dk(Lt[0], 0.3), PT.dk(Lt[1], 0.2), Lt[1]], ol, 14, 5.5, ow);
  circleOl(ctx, J.knee1.x, J.knee1.y, 6.5, Mt[1], ol, 1.2);
  orcHead2(ctx, J, pal, ow, ent, opt);
  if (!J.wb) orcAxe2(ctx, J, pal, ent, opt);
  // 앞팔 + 쇠 팔목 보호대 + 주먹
  RA.seg(ctx, J.sh1, J.elbow1, 8.6, 7.6, S, ol, ow); RA.seg(ctx, J.elbow1, J.hand1, 8, 6.8, S, ol, ow);
  { const m = { x: lerp(J.elbow1.x, J.hand1.x, 0.5), y: lerp(J.elbow1.y, J.hand1.y, 0.5) }, n = { x: lerp(J.elbow1.x, J.hand1.x, 0.9), y: lerp(J.elbow1.y, J.hand1.y, 0.9) }; RA.seg(ctx, m, n, 8.6, 8, Mt, ol, 1.3, { gloss: 0.9 }); }
  RA.fist(ctx, J.hand1, J.elbow1, 7, S, ol, ow);
  // 가시 견갑
  { const a = RA.frame(ctx, J.sh1, J.elbow1, 0.1);
    PT.fill(ctx, PT.sm([-12, -2, -8, -14, 4, -16, 15, -10, 17, 4, 12, 13, -6, 13], 0.6), Mt, { ow, ol, gloss: 1, rim: 1 });
    for (const [x, y, an] of [[-6, -13, -2.2], [3, -15.5, -1.8], [11, -12, -1.3]]) BA.horn(ctx, x, y, an, 9, 2.8, 0.2, pal.tusk, { ow: 1.1 });
    ctx.strokeStyle = PT.rgba(Mt[0], 1); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(4, 8, 16, 3); ctx.stroke();
    for (const x of [-6, 4, 12]) PT.dot(ctx, x, 6.5, 1, Mt[2]);
    ctx.restore(); }
}
function orcHead2(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head, S = pal.skin;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 상투 + 머리끈
  PT.fill(ctx, PT.sm([-9, -12, -14, -22, -9, -30, -2, -27, 0, -15], 0.6), pal.hair, { ow, ol, gloss: 0.6 });
  PT.fill(ctx, PT.poly([-11, -18, -3, -20, -2, -17, -10, -15]), pal.cloth, { ow: 0.9, ol });
  // 귀
  PT.fill(ctx, PT.sm([-6, -3, -17, -10, -14, -2, -9, 4], 0.4), S, { ow: 1.2, ol, rim: 1 });
  // 머리 : 넓은 턱
  PT.fill(ctx, PT.sm([-14, -8, -8, -16, 6, -16, 14, -9, 18, 2, 17, 12, 8, 18, -6, 17, -14, 6], 0.55), S, { ow, ol, tex: 'skin', ta: 0.4, rim: 1 });
  // 눈썹뼈 + 흉터
  PT.fill(ctx, PT.sm([1, -7, 17, -5, 16, -1, 3, -2], 0.4), [PT.dk(S[0], 0.2), S[0], S[1]], { ow: 1, ol });
  ctx.strokeStyle = '#e8b0a0'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(12, -12); ctx.lineTo(9, 3); ctx.stroke();
  ctx.strokeStyle = PT.rgba(S[0], 1); ctx.lineWidth = 0.7; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(9.5 + i * 0.3 - 1.6, -9 + i * 4.5); ctx.lineTo(11.5 + i * 0.3, -8.5 + i * 4.5); ctx.stroke(); }
  // 눈
  ctx.fillStyle = '#1a0606'; ctx.beginPath(); polyPath(ctx, [6, -2.5, 15, -1.6, 14, 1.8, 6.5, 1.2]); ctx.fill();
  ctx.fillStyle = pal.eye[1]; ctx.beginPath(); polyPath(ctx, [7.5, -1.4, 13.5, -0.8, 13, 1, 8, 0.6]); ctx.fill();
  RA.glow(ctx, opt, 10.5, 0, 9, '255,70,30', 0.7);
  // 코 · 입 · 엄니
  PT.fill(ctx, PT.sm([13, 0, 19, 3, 18, 6, 13, 5.5], 0.5), S, { ow: 1, ol });
  ctx.strokeStyle = ol; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(5, 11); ctx.quadraticCurveTo(11, 12.5, 17, 10); ctx.stroke();
  BA.horn(ctx, 7.5, 12, -1.45, 6.5, 2.4, 0.35, pal.tusk, { ow: 1.1 });
  BA.horn(ctx, 14.5, 11.4, -1.6, 4.5, 1.8, 0.3, pal.tusk, { ow: 1 });
  ctx.restore();
}
function orcAxe2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, L = RIG_ORC.wlen, Wd = pal.wood, M = pal.metal;
  weaponFrame(ctx, J.hand1, J.wAng);
  PT.fill(ctx, PT.sm([-20, -3, L, -3.6, L, 3.6, -20, 3], 0.15), Wd, { ow: 1.5, ol, tex: 'wood', ta: 0.5, rim: 1 });
  for (let x = -14; x < 10; x += 5) PT.fill(ctx, PT.poly([x, -4, x + 3, -4, x + 4, 4, x + 1, 4]), pal.leather, { ow: 0.8, ol });
  PT.fill(ctx, PT.ell(-21, 0, 4.5, 4.5), M, { ow: 1.2, ol, gloss: 1 });
  // 도끼머리 : 수염 도끼날 + 뒤쪽 가시
  const head = PT.sm([L - 32, 3, L - 4, 3, L + 8, 16, L + 12, 38, L, 34, L - 14, 40, L - 28, 34, L - 34, 18], 0.45);
  PT.fill(ctx, head, M, { ow: 1.8, ol, gloss: 1.1, rim: 1 });
  ctx.save(); ctx.clip(head);
  ctx.fillStyle = PT.rgba(M[2], 0.85); ctx.beginPath(); smoothPoly(ctx, [L - 28, 33, L - 14, 38, L, 32, L + 11, 36, L + 12, 40, L - 28, 40], 0.4); ctx.fill();
  ctx.fillStyle = PT.rgba(M[0], 0.7); for (const [x, y] of [[L - 2, 36], [L - 20, 37]]) { ctx.beginPath(); ctx.arc(x, y + 3, 2.4, 0, TAU); ctx.fill(); }          // 이 빠진 자국
  ctx.restore();
  PT.fill(ctx, PT.sm([L - 30, 4, L - 8, 4, L - 10, 13, L - 28, 14], 0.3), [M[0], PT.dk(M[0], 0.2), M[1]], { ow: 1, ol });
  for (const x of [L - 24, L - 14]) PT.dot(ctx, x, 9, 1.4, M[2]);
  BA.horn(ctx, L - 6, -3, -1.75, 16, 3.6, 0.45, M, { ow: 1.2, gloss: 0.8 });
  ctx.restore();
}

// ============================================================
//  암흑 술사 : 겹 로브와 금실 자수, 그림자 속 빛나는 눈, 발톱이 쥔 수정 구슬 지팡이
// ============================================================
function drawMage2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.5, R = pal.robe, R2 = pal.robe2, Tr = pal.trim, F = torsoFrame(J), Hh = J.hip, L = F.L;
  if (J.wb) mageStaff2(ctx, J, pal, ent, opt);
  // 뒷팔 (넓은 소매)
  RA.seg(ctx, J.sh2, J.elbow2, 5.5, 6, R2, ol, ow); RA.seg(ctx, J.elbow2, J.hand2, 6, 7.5, R2, ol, ow);
  circleOl(ctx, J.hand2.x, J.hand2.y, 3.2, pal.skin[1], ol, 1.1);
  if (ent.castGlow > 0) { RA.glow(ctx, opt, J.hand2.x, J.hand2.y, 24 + ent.castGlow * 14, '200,90,255', 0.5 + ent.castGlow * 0.4); }
  // 로브 치마 : 겹친 자락 + 금 테두리 + 룬
  const hem = Math.max(J.foot1.y, J.foot2.y) - 1, sway = Math.sin(Game.time * 0.12 + ent.id) * 2;
  const x0 = Math.min(J.foot1.x, J.foot2.x, J.hip.x - 10) - 9, x1 = Math.max(J.foot1.x, J.foot2.x, J.hip.x + 10) + 9;
  const skirt = PT.sm([J.hip.x - 11, J.hip.y - 4, J.hip.x + 11, J.hip.y - 4, x1 + sway, hem - 2, x1 - 4 + sway, hem + 1, (x0 + x1) / 2 + 4, hem + 2, x0 + 4 + sway, hem + 1, x0 + sway, hem - 2], 0.3);
  PT.fill(ctx, skirt, R, { ow, ol, tex: 'cloth', ta: 0.4, rim: '#c890ff' });
  ctx.save(); ctx.clip(skirt);
  PT.fill(ctx, PT.poly([J.hip.x + 2, J.hip.y - 4, J.hip.x + 10, J.hip.y - 4, x1 + sway, hem + 4, (x0 + x1) / 2 + 2, hem + 4]), R2, { ow: 1, ol });       // 앞 트임
  ctx.strokeStyle = Tr[1]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0 + sway, hem - 3); ctx.lineTo((x0 + x1) / 2 + 4, hem - 1); ctx.lineTo(x1 + sway, hem - 3); ctx.stroke();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(J.hip.x + 3, J.hip.y); ctx.lineTo((x0 + x1) / 2 + 3, hem); ctx.stroke();
  ctx.strokeStyle = PT.rgba(Tr[2], 0.8); ctx.lineWidth = 0.9;
  for (let i = 0; i < 3; i++) { const x = lerp(x0, x1, 0.25 + i * 0.25) + sway * 0.6, y = hem - 7; ctx.beginPath(); ctx.moveTo(x - 2, y - 2); ctx.lineTo(x, y + 2); ctx.lineTo(x + 2, y - 2); ctx.stroke(); }
  ctx.restore();
  // 상체 + 금 허리띠 + 늘어진 띠
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-11, -4, 11, -4, 12, L * 0.6, 10, L + 3, -10, L + 3, -12, L * 0.5]), 0.4), R, { ow, ol, tex: 'cloth', ta: 0.4, rim: '#c890ff' });
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [-2, L + 2, 6, L + 2, 4, 6, 0, 6])), Tr, { ow: 1, ol, gloss: 0.8 });
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [-11.5, 0, 11.5, 0, 11.5, 5, -11.5, 5])), Tr, { ow: 1, ol, gloss: 1 });
  PT.fill(ctx, PT.ell(...tp(Hh, F, 4, 2.5), 3, 3), pal.orb, { ow: 0.9, ol, spec: 1 });
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [2, 0, 6, 0, 7, -16, 3, -18]), 0.4), Tr, { ow: 0.9, ol });
  // 높은 깃 망토 어깨
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-14, L - 2, -4, L + 6, 10, L + 4, 14, L - 4, 0, L - 8]), 0.6), R2, { ow, ol, rim: 1 });
  mageHead2(ctx, J, pal, ow, ent, opt);
  if (!J.wb) mageStaff2(ctx, J, pal, ent, opt);
  // 앞팔
  RA.seg(ctx, J.sh1, J.elbow1, 5.6, 6.2, R, ol, ow); RA.seg(ctx, J.elbow1, J.hand1, 6.2, 7.8, R, ol, ow);
  { const m = { x: lerp(J.elbow1.x, J.hand1.x, 0.78), y: lerp(J.elbow1.y, J.hand1.y, 0.78) }; ctx.strokeStyle = Tr[1]; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(m.x, m.y, 6.6, 0, TAU); ctx.stroke(); }
  circleOl(ctx, J.hand1.x, J.hand1.y, 3.4, pal.skin[1], ol, 1.1);
}
function mageHead2(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head, R = pal.robe;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  // 뾰족 두건 (뒤로 꺾임)
  PT.fill(ctx, PT.sm([-12, 11, -16, -2, -14, -12, -24, -24, -30, -20, -10, -19, 4, -18, 13, -8, 15, 4, 12, 14, 0, 17], 0.5), R, { ow, ol, tex: 'cloth', ta: 0.35, rim: '#c890ff' });
  // 그림자 얼굴
  PT.fill(ctx, PT.sm([0, -7, 9, -9, 14, -2, 13, 8, 6, 12, 0, 8], 0.7), pal.face, { ow: 0, sh: 0, hl: 0, grad: false });
  // 눈
  RA.glow(ctx, opt, 9, 0, 11, '210,110,255', 0.8);
  ctx.fillStyle = pal.eye[1]; ctx.beginPath(); polyPath(ctx, [5, -0.8, 9, -1.8, 8.6, 0.6, 5.2, 0.6]); ctx.fill(); ctx.beginPath(); polyPath(ctx, [10.5, -1.6, 13.4, -1.4, 13, 0.6, 10.6, 0.8]); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillRect(6.3, -0.8, 1.4, 0.9); ctx.fillRect(11.3, -0.8, 1.2, 0.9);
  // 두건 테두리 금실
  ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -10); ctx.quadraticCurveTo(13, -13, 15, 3); ctx.quadraticCurveTo(14, 12, 4, 16); ctx.stroke();
  ctx.strokeStyle = PT.rgba(pal.trim[2], 0.8); ctx.lineWidth = 0.7; ctx.stroke();
  PT.fill(ctx, PT.poly([-2, -15, 1, -19, 4, -15, 1, -12]), pal.orb, { ow: 0.9, ol, spec: 1 });           // 이마 보석
  ctx.restore();
}
function mageStaff2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, L = RIG_MAGE.wlen, Wd = pal.wood, Tr = pal.trim, cg = ent.castGlow || 0;
  weaponFrame(ctx, J.hand1, J.wAng);
  // 비틀린 나무 자루
  const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(-40 + u * (L - 26), Math.sin(u * 9) * 1.2); }
  PT.fill(ctx, PT.strip(pts, 2.6, 2.2), Wd, { ow: 1.4, ol, tex: 'wood', ta: 0.5, rim: 1 });
  PT.fill(ctx, PT.sm([-44, -3, -36, -3, -36, 3, -44, 3], 0.4), Tr, { ow: 1, ol, gloss: 1 });
  // 금 발톱이 구슬을 쥔다
  for (const s of [-1, 1]) BA.horn(ctx, L - 16, s * 2, s * 0.6, 22, 3, -s * 1.4, Tr, { ow: 1.1, gloss: 0.8 });
  PT.fill(ctx, PT.sm([L - 20, -3, L - 12, -6, L - 8, 0, L - 12, 6, L - 20, 3], 0.6), Tr, { ow: 1.2, ol, gloss: 1 });
  RA.glow(ctx, opt, L + 4, 0, 26 + cg * 18 + Math.sin(Game.time * 0.2) * 3, '190,90,255', 0.75);
  PT.fill(ctx, PT.ell(L + 4, 0, 7.5, 7.5), pal.orb, { ow: 1.2, ol, sh: 0.8 });
  ctx.save(); ctx.beginPath(); ctx.arc(L + 4, 0, 7, 0, TAU); ctx.clip(); ctx.strokeStyle = PT.rgba(pal.orb[2], 0.8); ctx.lineWidth = 1.2;
  const a = Game.time * 0.1; ctx.beginPath(); ctx.arc(L + 4 + Math.cos(a) * 2, Math.sin(a) * 2, 4, a, a + 3.5); ctx.stroke(); ctx.restore();
  PT.dot(ctx, L + 1.5, -2.5, 2.2, '#ffffff');
  for (const s of [-1, 1]) BA.horn(ctx, L - 8, s * 3, s * 1.2, 12, 2.4, -s * 1.8, Tr, { ow: 1, gloss: 0.8 });
  ctx.restore();
}

// ============================================================
//  뿔의 군주 바르카스 : 붉은 근육의 우두(牛頭) 군주, 금장 견갑, 룬이 빛나는 양날 도끼
// ============================================================
function drawBoss2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.6, S = pal.skin, A = pal.armor, G = pal.gold, Fu = pal.fur, F = torsoFrame(J), Hh = J.hip, L = F.L;
  const S0 = [PT.dk(S[0], 0.25), S[0], S[1]], Fu0 = [PT.dk(Fu[0], 0.2), Fu[0], Fu[1]], met = { ow: 1.4, ol, gloss: 1, rim: 1 };
  if (!opt.ghost && ent.cape) {
    const c = ent.cape, ex = ent.x, ey = sy(ent.y, ent.z), s = ent.scale * ent.facing, sc = ent.scale;
    const pts = c.p.map(q => [(q.x - ex) / s, (q.y - ey) / sc]).flat();
    PT.fill(ctx, PT.strip(pts, 18, 12), pal.cape, { ow, ol, tex: 'cloth', ta: 0.4, rim: 1 });
  }
  if (J.wb) bossAxe2(ctx, J, pal, ent, opt);
  // 뒷팔
  RA.seg(ctx, J.sh2, J.elbow2, 10, 9, S0, ol, ow); RA.seg(ctx, J.elbow2, J.hand2, 9, 8, S0, ol, ow);
  bracer2(ctx, J.elbow2, J.hand2, 9.5, pal, ol, true);
  RA.fist(ctx, J.hand2, J.elbow2, 8, S0, ol, ow);
  // 뒷다리 : 털 + 발굽
  RA.seg(ctx, J.hip, J.knee2, 12.5, 10, Fu0, ol, ow, { tex: 'fur', ta: 0.5 }); RA.seg(ctx, J.knee2, J.foot2, 10, 8, Fu0, ol, ow, { tex: 'fur', ta: 0.5 });
  footShape(ctx, J.knee2, J.foot2, pal.hoof, ol, 10, 6, ow);
  // 몸통 : 근육
  const torso = PT.sm(RA.tp(Hh, F, [-19, -6, 19, -6, 23, L * 0.4, 28, L * 0.8, 20, L + 7, -16, L + 8, -25, L * 0.7, -21, L * 0.25]), 0.55);
  PT.fill(ctx, torso, S, { ow, ol, tex: 'skin', ta: 0.4, rim: '#ffb080', sh: 1.1 });
  ctx.save(); ctx.clip(torso);
  ctx.strokeStyle = PT.rgba(S[0], 0.9); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 2, L * 0.72)); ctx.quadraticCurveTo(...tp(Hh, F, 18, L * 0.6), ...tp(Hh, F, 28, L * 0.8)); ctx.stroke();
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 7, 9 + i * 9)); ctx.quadraticCurveTo(...tp(Hh, F, 13, 7 + i * 9), ...tp(Hh, F, 19, 10 + i * 9)); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(...tp(Hh, F, 12, 4)); ctx.lineTo(...tp(Hh, F, 12, L * 0.6)); ctx.stroke();
  ctx.restore();
  // 가슴 사슬 띠 + 룬
  const c1 = tp(Hh, F, -18, L * 0.95), c2 = tp(Hh, F, 20, L * 0.22);
  PT.line(ctx, [c1[0], c1[1], c2[0], c2[1]], A[1], 7, 1.4); PT.line(ctx, [c1[0], c1[1], c2[0], c2[1]], G[1], 1.6);
  for (let i = 1; i < 4; i++) { const u = i / 4; PT.fill(ctx, PT.ell(lerp(c1[0], c2[0], u), lerp(c1[1], c2[1], u), 3, 3), G, { ow: 0.9, ol, gloss: 1 }); }
  const rg = ent.enraged ? 1 : 0.6;
  if (!opt.flash && !opt.ghost) PT.neon(ctx, [...tp(Hh, F, 0, L * 0.4), ...tp(Hh, F, 4, L * 0.32), ...tp(Hh, F, 0, L * 0.24)], '255,110,30', 1.3, rg);
  // 벨트 + 해골 버클 + 갑옷 치마
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [-20, -2, 20, -2, 20, 10, -20, 10])), A, met);
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [-20, -2, -5, -2, -8, -26, -22, -20]), 0.3), A, met);
  PT.fill(ctx, PT.sm(RA.tp(Hh, F, [2, -2, 20, -2, 18, -24, 4, -28]), 0.3), A, met);
  PT.fill(ctx, PT.poly(RA.tp(Hh, F, [4, -25, 18, -21, 18, -24, 4, -28])), G, { ow: 0.8, ol, gloss: 1 });
  { const [bx, by] = tp(Hh, F, 12, 4); PT.fill(ctx, PT.sm([bx - 7, by - 5, bx + 7, by - 5, bx + 7.5, by + 2, bx + 3, by + 7, bx - 3, by + 7, bx - 7.5, by + 2], 0.6), pal.horn, { ow: 1.2, ol, spec: 0.6 }); ctx.fillStyle = ol; ctx.beginPath(); ctx.arc(bx - 2.6, by - 0.5, 2, 0, TAU); ctx.arc(bx + 2.6, by - 0.5, 2, 0, TAU); ctx.fill(); BA.horn(ctx, bx - 6, by - 4, -2.4, 7, 2, 0.6, pal.horn, { ow: 0.9 }); BA.horn(ctx, bx + 6, by - 4, -0.7, 7, 2, -0.6, pal.horn, { ow: 0.9 }); }
  // 앞다리
  RA.seg(ctx, J.hip, J.knee1, 13, 10.5, Fu, ol, ow, { tex: 'fur', ta: 0.5 }); RA.seg(ctx, J.knee1, J.foot1, 10.5, 8.5, Fu, ol, ow, { tex: 'fur', ta: 0.5 });
  footShape(ctx, J.knee1, J.foot1, pal.hoof, ol, 11, 6.5, ow);
  { RA.frame(ctx, J.knee1, J.foot1, 0); PT.fill(ctx, PT.sm([-10, -9, 6, -11, 12, 0, 6, 11, -10, 9], 0.6), A, met); BA.horn(ctx, 4, -9, -1.2, 9, 3, -0.3, A, { ow: 1 }); ctx.restore(); }
  // 머리
  const HD2 = { skull: bossHeadSkull, eye: bossHeadEye }[(ent.rig && ent.rig.head) || 'bull'] || bossHead2;
  HD2(ctx, J, pal, ow, ent, opt);
  if (!J.wb) bossAxe2(ctx, J, pal, ent, opt);
  // 앞팔
  RA.seg(ctx, J.sh1, J.elbow1, 11, 9.5, S, ol, ow); RA.seg(ctx, J.elbow1, J.hand1, 9.5, 8.5, S, ol, ow);
  bracer2(ctx, J.elbow1, J.hand1, 10, pal, ol, false);
  RA.fist(ctx, J.hand1, J.elbow1, 8.6, S, ol, ow);
  // 거대 견갑 : 겹판 + 금 테 + 뿔 장식
  { RA.frame(ctx, J.sh1, J.elbow1, 0.08);
    BA.horn(ctx, -2, -18, -2.0, 18, 4.5, -0.5, pal.horn, { ow: 1.2 });
    BA.horn(ctx, 10, -18, -1.4, 22, 5, 0.4, pal.horn, { ow: 1.2 });
    PT.fill(ctx, PT.sm([-14, 0, -10, -18, 6, -22, 19, -14, 22, 2, 17, 16, -8, 18, -16, 8], 0.6), A, Object.assign({ tex: 'metal', ta: 0.3 }, met));
    PT.fill(ctx, PT.sm([-12, 8, 4, 12, 19, 6, 18, 14, -6, 20, -14, 14], 0.5), A, met);
    ctx.strokeStyle = G[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(4, 6, 20, 0); ctx.stroke();
    ctx.strokeStyle = G[2]; ctx.lineWidth = 0.8; ctx.stroke();
    PT.fill(ctx, PT.ell(4, -8, 4, 4), [pal.rune[0], pal.rune[1], pal.rune[2]], { ow: 1, ol, spec: 1 });
    RA.glow(ctx, opt, 4, -8, 12, '255,110,30', 0.5 * rg);
    ctx.restore(); }
}
function bracer2(ctx, e, h, r, pal, ol, back) {
  const m = { x: lerp(e.x, h.x, 0.42), y: lerp(e.y, h.y, 0.42) }, n = { x: lerp(e.x, h.x, 0.88), y: lerp(e.y, h.y, 0.88) };
  const A = back ? [PT.dk(pal.armor[0], 0.2), pal.armor[0], pal.armor[1]] : pal.armor;
  PT.fill(ctx, PT.cap(m.x, m.y, n.x, n.y, r + 0.4, r * 0.95), A, { ow: 1.4, ol, gloss: 1, rim: 1 });
  RA.frame(ctx, m, n, 0);
  const len = Math.hypot(n.x - m.x, n.y - m.y);
  ctx.strokeStyle = pal.gold[1]; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(len, -r); ctx.lineTo(len, r); ctx.stroke();
  for (let i = 0; i < 2; i++) BA.horn(ctx, len * (0.3 + i * 0.4), -r + 1, -1.7, 9, 3, 0.2, A, { ow: 1 });
  ctx.restore();
}
function bossHead2(ctx, J, pal, ow, ent, opt) {
  const ol = pal.ol, h = J.head, S = pal.skin, Hn = pal.horn;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(J.headRot);
  BA.horn(ctx, -8, -12, -2.6, 50, 7, 0.9, [PT.dk(Hn[0], 0.2), Hn[0], Hn[1]]);                  // 뒤 뿔
  // 갈기
  PT.fill(ctx, PT.sm([-12, -16, -26, -6, -24, 8, -30, 18, -16, 20, -6, 22, -2, 4], 0.5), pal.fur, { ow, ol, tex: 'fur', ta: 0.6, rim: 1 });
  // 머리 : 넓은 이마 + 긴 주둥이
  PT.fill(ctx, PT.sm([-16, -10, -8, -18, 6, -18, 16, -11, 24, -5, 31, 2, 31, 12, 22, 18, 8, 18, -6, 16, -16, 6], 0.55), S, { ow, ol, tex: 'skin', ta: 0.4, rim: '#ffb080' });
  PT.fill(ctx, PT.sm([16, 0, 30, 1, 34, 8, 31, 16, 18, 16], 0.5), [S[1], S[2], PT.lt(S[2], 0.3)], { ow: 1.3, ol, spec: 0.5 });       // 주둥이
  ctx.fillStyle = ol; ctx.beginPath(); ctx.ellipse(28.5, 6, 2, 3, 0.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = pal.gold[0]; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(29, 13, 4.6, -0.6, Math.PI * 1.1); ctx.stroke();
  ctx.strokeStyle = pal.gold[2]; ctx.lineWidth = 1.4; ctx.stroke();
  // 눈썹뼈 + 눈
  PT.fill(ctx, PT.sm([4, -10, 22, -7, 21, -3, 5, -4], 0.4), S0of(S), { ow: 1, ol });
  ctx.fillStyle = '#100404'; ctx.beginPath(); polyPath(ctx, [6, -6, 19, -3.5, 18, 0.5, 7, -0.4]); ctx.fill();
  ctx.fillStyle = ent.enraged ? '#ff4020' : pal.eye[1]; ctx.beginPath(); polyPath(ctx, [8.5, -4.6, 17, -2.8, 16.5, -0.8, 9, -1.6]); ctx.fill();
  RA.glow(ctx, opt, 13, -3, 16, ent.enraged ? '255,60,20' : '255,190,40', 0.85);
  // 귀
  PT.fill(ctx, PT.sm([-2, -10, -16, -18, -12, -6], 0.5), S, { ow: 1.2, ol });
  // 앞 뿔 (마디 무늬)
  BA.horn(ctx, 4, -14, -1.55, 58, 8, 1.15, Hn);
  ctx.restore();
  function S0of(s) { return [PT.dk(s[0], 0.2), s[0], s[1]]; }
}
function bossAxe2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, L = RIG_BOSS.wlen, A = pal.armor, G = pal.gold;
  weaponFrame(ctx, J.hand1, J.wAng);
  PT.fill(ctx, PT.sm([-30, -4, L + 10, -4.5, L + 10, 4.5, -30, 4], 0.1), pal.fur, { ow: 1.6, ol, tex: 'wood', ta: 0.5, rim: 1 });
  for (const x of [-26, -6, L - 42]) PT.fill(ctx, PT.poly([x, -5.5, x + 6, -5.5, x + 6, 5.5, x, 5.5]), G, { ow: 1, ol, gloss: 1 });
  BA.horn(ctx, -30, 0, Math.PI, 12, 4, 0, G, { ow: 1.2 });
  // 양날 도끼
  const bl = PT.sm([L - 44, 4, L - 4, 4, L + 10, 20, L + 15, 54, L - 8, 45, L - 30, 56, L - 46, 26], 0.4);
  const bl2 = PT.sm([L - 40, -4, L - 6, -4, L + 6, -16, L + 9, -40, L - 10, -32, L - 28, -42, L - 42, -18], 0.4);
  for (const b of [bl, bl2]) {
    PT.fill(ctx, b, A, { ow: 1.8, ol, gloss: 1.2, rim: 1, tex: 'metal', ta: 0.25 });
    ctx.save(); ctx.clip(b); ctx.strokeStyle = PT.rgba(A[2], 0.9); ctx.lineWidth = 4; ctx.stroke(b); ctx.restore();
  }
  PT.fill(ctx, PT.sm([L - 40, 6, L - 8, 6, L - 14, 22, L - 38, 22], 0.3), [A[0], PT.dk(A[0], 0.2), A[1]], { ow: 1, ol });
  PT.fill(ctx, PT.ell(L - 22, 0, 8, 8), G, { ow: 1.4, ol, gloss: 1.2 });
  PT.fill(ctx, PT.ell(L - 22, 0, 3.6, 3.6), pal.rune, { ow: 0.8, ol, spec: 1 });
  const rg = ent.enraged ? 1 : 0.6;
  if (!opt.flash && !opt.ghost) {
    PT.neon(ctx, [L - 34, 30, L - 26, 38, L - 18, 28, L - 10, 36], '255,110,30', 1.6, rg + Math.sin(Game.time * 0.15) * 0.15);
    PT.neon(ctx, [L - 32, -20, L - 22, -28, L - 12, -20], '255,110,30', 1.4, rg);
    if (ent.axeGlow) PT.glow(ctx, L - 10, 10, 70 * ent.axeGlow, '255,120,40', 0.7 * ent.axeGlow);
  }
  ctx.restore();
}

RIG_GOBLIN.draw = drawGoblin2;
RIG_ORC.draw = drawOrc2;
RIG_MAGE.draw = drawMage2;
RIG_BOSS.draw = drawBoss2;
drawBoss = drawBoss2;            // makeBossRig 의 draw 가 부른다
