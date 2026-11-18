'use strict';
// ============================================================
//  주인공 「카엘」 새 의상 · 새 체형 (기본 복장 전용)
//   - 가슴 갑옷 + 가죽 멜빵 + 겹친 허리 갑판 + 앞 천 + 붉은 목도리 + 큰 견갑 + 정강이 갑옷
//   - 다른 복장 스킨을 입으면 예전 그림(drawPlayer)을 그대로 쓴다
//   - 머리는 drawPlayerHead 를 작게(1.1배) 그려 체형을 날씬하게 한다
// ============================================================
const HERO2_HEAD = 1.1;

// 견갑 : 겹친 세 장의 판 + 붉은 안감 + 뿔
function heroPauldron2(ctx, J, pal, ent, ol) {
  const dx = J.elbow1.x - J.sh1.x, dy = J.elbow1.y - J.sh1.y, a = Math.atan2(dy, dx);
  const pm = pal.pauldron || pal.metal, pipe = pal.pipe || pal.trim, mt = pal.metal;
  ctx.save(); ctx.translate(J.sh1.x + dx * 0.08, J.sh1.y + dy * 0.08); ctx.rotate(a);
  for (const [r, ox, c] of [[9.4, 9, mt[0]], [10.4, 5.2, pm[0]]]) { ctx.beginPath(); ctx.ellipse(ox, 1, r * 0.95, r * 0.8, 0, 0, TAU); ctx.fillStyle = ol; ctx.fill(); ctx.beginPath(); ctx.ellipse(ox, 1, r * 0.95 - 1.4, r * 0.8 - 1.4, 0, 0, TAU); ctx.fillStyle = c; ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(-0.4, -0.4, 12.6, 10, 0, 0, TAU); ctx.fillStyle = ol; ctx.fill();               // 윗판
  ctx.beginPath(); ctx.ellipse(-0.4, -0.4, 11.2, 8.6, 0, 0, TAU); ctx.fillStyle = pm[1]; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0.8, 2.6, 9.4, 5.4, 0, 0.15, Math.PI - 0.15); ctx.fillStyle = pm[0]; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-3, -3.4, 5.8, 2.7, -0.25, 0, TAU); ctx.fillStyle = pm[2]; ctx.fill();
  ctx.strokeStyle = pipe[1]; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.ellipse(-0.4, -0.4, 9, 6.6, 0, 0.4, Math.PI - 0.4); ctx.stroke();
  olPoly(ctx, [-2.4, -7.2, 1.2, -15.4, 4.6, -6.6], pipe[1], ol, 1);                                          // 붉은 뿔
  ctx.fillStyle = pipe[2]; ctx.beginPath(); polyPath(ctx, [-1.4, -7.4, 1.1, -13.2, 2.6, -7]); ctx.fill();
  ctx.fillStyle = pal.trim[1]; ctx.beginPath(); ctx.arc(-6.4, 0.6, 1.3, 0, TAU); ctx.arc(6, 0.6, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
}

// 다리 : 헐렁한 바지 + 가죽 감개 + 정강이 갑옷 + 뾰족 무릎 보호대 + 장화
function heroLeg2(ctx, hip, knee, foot, pal, ol, ow, back, det) {
  const k = back ? 0.94 : 1, dk = m => [m[0], blMix(m[0], m[1], 0.45), m[1]];
  const pm = back ? dk(pal.pants) : pal.pants, bm = back ? dk(pal.boots) : pal.boots, mt = back ? dk(pal.metal) : pal.metal;
  ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, hip, knee, 9.6 * k + ow, 6.2 * k + ow); capsulePath(ctx, knee, foot, 6.6 * k + ow, 5 * k + ow); ctx.fill();
  shadedSeg(ctx, hip, knee, 9.6 * k, 6.2 * k, pm);
  shadedSeg(ctx, knee, foot, 6.6 * k, 5 * k, bm);
  heroFoot(ctx, knee, foot, bm, ol, back ? 11.8 : 13, 4.6, ow, det);
  if (!det) return;
  const dx = foot.x - knee.x, dy = foot.y - knee.y, Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
  const B = (a, b) => [knee.x + ux * a + nx * b, knee.y + uy * a + ny * b];
  const tx = hip.x - knee.x, ty = hip.y - knee.y, tl = Math.hypot(tx, ty) || 1;
  // 허벅지 감개 (가죽 띠)
  ctx.strokeStyle = bm[2]; ctx.lineWidth = 1.5; ctx.lineCap = 'butt'; ctx.beginPath();
  for (const u of [0.35, 0.5, 0.65]) { const cx = knee.x + (hip.x - knee.x) * u, cy = knee.y + (hip.y - knee.y) * u, ww = (6.2 + 3.4 * u) * k; ctx.moveTo(cx - (-ty / tl) * ww, cy - (tx / tl) * ww); ctx.lineTo(cx + (-ty / tl) * ww, cy + (tx / tl) * ww); }
  ctx.stroke();
  // 정강이 갑옷
  const w = 5.9 * k;
  olPoly(ctx, [...B(5, -w), ...B(Ln * 0.8, -w + 0.8), ...B(Ln * 0.84, w * 0.2), ...B(5, w * 0.4)], mt[1], ol, 1);
  ctx.fillStyle = mt[2]; ctx.beginPath(); polyPath(ctx, [...B(6.4, -w + 1), ...B(Ln * 0.74, -w + 1.6), ...B(Ln * 0.74, -w + 3), ...B(6.4, -w + 3)]); ctx.fill();
  ctx.fillStyle = mt[0]; ctx.beginPath(); polyPath(ctx, [...B(6, w * 0.1), ...B(Ln * 0.82, w * 0.05), ...B(Ln * 0.84, w * 0.2), ...B(5, w * 0.4)]); ctx.fill();
  ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(...B(5.4, -w * 0.2)); ctx.lineTo(...B(Ln * 0.8, -w * 0.2)); ctx.stroke();
  if (!back) {
    // 무릎 보호대 : 뾰족한 판 + 붉은 보석
    const kp = B(-0.5, -2.4);
    ctx.save(); ctx.translate(kp[0], kp[1]); ctx.rotate(Math.atan2(uy, ux));
    olPoly(ctx, [-6, -5.8, 3.4, -6.4, 8.2, 0, 3.4, 6.4, -6, 5.8, -8, 0], mt[1], ol, 1.2);
    ctx.fillStyle = mt[2]; ctx.beginPath(); polyPath(ctx, [-5, -4.8, 2.6, -5.2, 5.6, -1.6, -4, -1.2]); ctx.fill();
    ctx.fillStyle = mt[0]; ctx.beginPath(); polyPath(ctx, [-5, 1.8, 5.8, 1.4, 3.2, 5.4, -5, 4.8]); ctx.fill();
    circleOl(ctx, 0.4, 0, 1.9, pal.pipe[1], ol, 0.8); ctx.fillStyle = '#fff'; ctx.fillRect(-0.4, -1, 0.8, 0.8);
    ctx.restore();
  }
  // 장화 목 · 버클
  olPoly(ctx, [...B(Ln * 0.84, -w - 0.4), ...B(Ln * 0.84, w * 0.9), ...B(Ln - 1.4, w * 0.9), ...B(Ln - 1.4, -w - 0.4)], bm[2], ol, 0.9);
  ctx.fillStyle = pal.trim[1]; const bp = B(Ln * 0.92, 0); ctx.fillRect(bp[0] - 1, bp[1] - 1, 2, 2);
}

// 목도리 : 목에 감은 붉은 천 + 뒤로 날리는 두 갈래
function heroScarf(ctx, J, pal, ent, ol, F, T, L) {
  const pipe = pal.pipe, sp = clamp((ent.vx || 0) * (ent.facing || 1) * 0.12, -3, 6), t = Game.time;
  const base = T(2, L + 5);
  const tail = (dx, dy, w, ph, shade) => {
    const x1 = base[0] - 6 - sp * 0.6, y1 = base[1] + 2 + Math.sin(t * 0.09 + ph) * 1.2;
    const x2 = base[0] - dx - sp * 1.4, y2 = base[1] + dy + Math.sin(t * 0.07 + ph + 1.4) * 2.6;
    ctx.beginPath(); ctx.moveTo(base[0], base[1] - w); ctx.quadraticCurveTo(x1, y1 - w, x2, y2 - w * 0.5); ctx.lineTo(x2 - 1.6, y2 + w * 0.8); ctx.quadraticCurveTo(x1 - 1, y1 + w, base[0], base[1] + w);
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = ol; ctx.stroke(); ctx.fillStyle = shade; ctx.fill();
  };
  tail(17, 7, 2.6, 0, pipe[0]); tail(13, 12, 2.4, 1.7, pipe[1]);
  olPoly(ctx, [...T(-6.4, L + 2.6), ...T(8.2, L + 3.4), ...T(9.4, L + 8), ...T(-5, L + 7.6)], pipe[1], ol, 1.1);
  ctx.fillStyle = pipe[2]; ctx.beginPath(); polyPath(ctx, [...T(-4.4, L + 6.6), ...T(7.6, L + 7.2), ...T(8, L + 7.9), ...T(-4.2, L + 7.4)]); ctx.fill();
  ctx.fillStyle = pipe[0]; ctx.beginPath(); polyPath(ctx, [...T(-6.2, L + 2.8), ...T(8.2, L + 3.5), ...T(8.6, L + 4.6), ...T(-6, L + 4)]); ctx.fill();
  olPoly(ctx, [...T(3, L + 3.2), ...T(7.4, L + 3.6), ...T(6.6, L + 8), ...T(2.6, L + 7.6)], pipe[0], ol, 0.9);     // 매듭
}

function drawPlayer2(ctx, J, pal, ent, opt) {
  const ol = pal.ol, ow = 1.6, ghost = opt.ghost, det = !ghost;
  const pipe = pal.pipe, mt = pal.metal, gl = ent.ghostGlow || 0;
  if (J.wb) drawPlayerBlade(ctx, J, pal, ent, opt);
  const F = torsoFrame(J), Hh = J.hip, L = F.L, T = (f, u) => tp(Hh, F, f, u);

  gearDeco(ctx, J, pal, ent, opt, 'back');
  heroGhostArm(ctx, J, pal, ent, opt, ol, ow);

  // --- 망토 (뒷자락) : 겉 남색 + 붉은 안감 ---
  if (!ghost && ent.tail) {
    drawRibbon(ctx, ent, ent.tail, 15, 9, pal.coat[0], ol, ow);
    drawRibbon(ctx, ent, ent.tail, 9, 4.4, pal.coat[1], ol, 0);
    drawRibbon(ctx, ent, ent.tail, 3.2, 1.2, pipe[1], ol, 0);
  }

  heroLeg2(ctx, J.hip, J.knee2, J.foot2, pal, ol, ow, true, det);

  // 목
  ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, J.chest, J.neck, 5.6, 5.4); ctx.fill();
  ctx.fillStyle = pal.skin[0]; ctx.beginPath(); capsulePath(ctx, J.chest, J.neck, 4.1, 3.9); ctx.fill();

  // --- 몸통 : 어깨가 넓고 허리가 잘록한 V자 윗옷 ---
  const body = [...T(-9.4, -3), ...T(-11.6, L * 0.34), ...T(-13.6, L * 0.8), ...T(-9, L + 3.4), ...T(0, L + 4.6), ...T(9.4, L + 3.4), ...T(14.6, L * 0.78), ...T(11.4, L * 0.34), ...T(9.6, -3)];
  olSmooth(ctx, body, pal.coat[1], ol, ow, 0.8);
  if (det) {
    ctx.fillStyle = pal.coat[0]; ctx.beginPath(); smoothPoly(ctx, [...T(-9.4, -3), ...T(-11.6, L * 0.34), ...T(-13.6, L * 0.8), ...T(-9, L + 3.4), ...T(-4, L + 3), ...T(-4.6, L * 0.4)], 0.8); ctx.fill();
  }
  // 가슴 갑옷
  const cp = [...T(-8.4, L * 0.3), ...T(-11, L * 0.78), ...T(-6.6, L + 2.6), ...T(6.4, L + 2.8), ...T(13, L * 0.84), ...T(11.6, L * 0.34), ...T(3, L * 0.18)];
  olSmooth(ctx, cp, mt[1], ol, 1.3, 0.55);
  if (det) {
    ctx.save(); ctx.beginPath(); smoothPoly(ctx, cp, 0.55); ctx.clip();
    ctx.fillStyle = mt[0]; ctx.beginPath(); polyPath(ctx, [...T(-14, L * 0.0), ...T(14, L * 0.0), ...T(14, L * 0.36), ...T(-14, L * 0.3)]); ctx.fill();                  // 아래 그늘
    ctx.fillStyle = mt[0]; ctx.beginPath(); polyPath(ctx, [...T(-14, 0), ...T(-4, 0), ...T(-4, L + 8), ...T(-14, L + 8)]); ctx.fill();                                 // 등쪽 그늘
    ctx.fillStyle = mt[2]; ctx.beginPath(); smoothPoly(ctx, [...T(6, L * 0.5), ...T(12, L * 0.76), ...T(9.4, L + 1.4), ...T(5.4, L * 0.88)], 0.8); ctx.fill();        // 가슴 광택
    ctx.strokeStyle = 'rgba(0,0,14,0.55)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(...T(3.4, L * 0.22)); ctx.lineTo(...T(3.8, L + 2.4)); ctx.stroke();    // 가운데 능선
    ctx.restore();
    ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(...T(-7.6, L * 0.32)); ctx.lineTo(...T(2.8, L * 0.2)); ctx.lineTo(...T(11.2, L * 0.36)); ctx.stroke();   // 금 테
    // 귀안의 문장 : 붉은 눈 모양 룬이 맥동한다
    const mk = T(6.4, L * 0.58), pu = 0.55 + Math.sin(Game.time * 0.08) * 0.2 + gl * 0.4;
    ctx.save(); ctx.translate(mk[0], mk[1]);
    ctx.fillStyle = '#1a0608'; ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 2.3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,70,50,${Math.min(1, pu + 0.3)})`; ctx.beginPath(); ctx.ellipse(0, 0, 1.4, 1.9, 0, 0, TAU); ctx.fill();
    if (!opt.flash) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 9 + gl * 6, '255,50,30', 0.45 * pu); ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
    // 가죽 멜빵 (어깨 → 허리)
    olPoly(ctx, [...T(-10.4, L - 2), ...T(-7.4, L + 1.6), ...T(10.4, 8.4), ...T(9.4, 4)], pal.sash[1], ol, 1.1);
    ctx.fillStyle = pal.sash[2]; ctx.beginPath(); polyPath(ctx, [...T(-8.6, L - 0.6), ...T(-7.6, L + 0.4), ...T(9.8, 7.4), ...T(9.6, 6.2)]); ctx.fill();
    const b = T(2, L * 0.44); ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(Math.atan2(F.fy, F.fx) + 0.72); olPoly(ctx, [-2.6, -3, 2.6, -3, 2.6, 3, -2.6, 3], pal.buckle[1], ol, 0.9); ctx.fillStyle = pal.sash[0]; ctx.fillRect(-1.1, -1.5, 2.2, 3); ctx.restore();
  }
  // 허리띠
  olPoly(ctx, [...T(-11.6, -1.8), ...T(11.4, -1.8), ...T(11.8, 6.2), ...T(-12, 6.2)], pal.sash[1], ol, 1.2);
  if (det) {
    ctx.fillStyle = pal.sash[2]; ctx.beginPath(); polyPath(ctx, [...T(-11.4, 4.2), ...T(11.6, 4.2), ...T(11.8, 5.4), ...T(-11.6, 5.4)]); ctx.fill();
    olPoly(ctx, [...T(-2.4, -2.8), ...T(6, -2.8), ...T(6, 7.6), ...T(-2.4, 7.6)], pal.trim[1], ol, 1);                                                                // 큰 버클
    ctx.fillStyle = pal.trim[2]; ctx.beginPath(); polyPath(ctx, [...T(-1.4, 6.4), ...T(5, 6.4), ...T(5, 7), ...T(-1.4, 7)]); ctx.fill();
    ctx.fillStyle = pal.sash[0]; ctx.beginPath(); polyPath(ctx, [...T(0, -0.6), ...T(3.6, -0.6), ...T(3.6, 4.8), ...T(0, 4.8)]); ctx.fill();
    olPoly(ctx, [...T(-11.2, 5), ...T(-14.6, -5), ...T(-20, -12), ...T(-14, -4), ...T(-10.6, 1)], pal.sash[0], ol, 1.1);                                                   // 허리끈 끝
  }
  gearDeco(ctx, J, pal, ent, opt, 'body');

  // --- 앞다리 ---
  heroLeg2(ctx, J.hip, J.knee1, J.foot1, pal, ol, ow, false, det);

  // --- 겹친 허리 갑판 + 앞 천 ---
  const m = [(J.knee1.x + J.knee2.x) / 2, (J.knee1.y + J.knee2.y) / 2];
  const sw = ent.tail && ent.tail.p && ent.tail.p[1] ? clamp((ent.tail.p[1].x - ent.x) / (ent.scale * ent.facing) * 0.12, -3.4, 3.4) : 0;
  const cl = [...T(-6, 1), ...T(8.4, 1), m[0] + 8.6 + sw * 1.2, m[1] + 6, m[0] + 3.6 + sw * 1.3, m[1] + 14, m[0] - 3.2 + sw * 1.1, m[1] + 8.6, m[0] - 6.6 + sw, m[1] + 12.6];
  olPoly(ctx, cl, pal.coat[1], ol, ow);
  if (det) {
    ctx.fillStyle = pal.coat[0]; ctx.beginPath(); polyPath(ctx, [...T(-6, 1), ...T(-1, 1), m[0] + 1 + sw * 1.1, m[1] + 9, m[0] - 3.2 + sw * 1.1, m[1] + 8.6, m[0] - 6.6 + sw, m[1] + 12.6]); ctx.fill();
    ctx.strokeStyle = pipe[1]; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cl[8], cl[9]); ctx.lineTo(cl[6], cl[7]); ctx.lineTo(cl[4], cl[5]); ctx.lineTo(cl[2], cl[3]); ctx.stroke();
    const e = [m[0] + 3 + sw * 1.2, m[1] + 4.5];                                                      // 천 위 문장
    ctx.fillStyle = pal.trim[1]; ctx.beginPath(); polyPath(ctx, [e[0], e[1] - 3.4, e[0] + 2.4, e[1], e[0], e[1] + 3.4, e[0] - 2.4, e[1]]); ctx.fill();
    ctx.fillStyle = pipe[1]; ctx.beginPath(); ctx.arc(e[0], e[1], 1, 0, TAU); ctx.fill();
  }
  // 허리 갑판 3겹
  for (let i = 0; i < 3; i++) {
    const uTop = 1 - i * 3.8, uBot = -3 - i * 3.6, wTop = 12.4 - i * 0.9, wBot = 11 - i * 1.2;
    olPoly(ctx, [...T(-wTop, uTop), ...T(wTop, uTop), ...T(wBot, uBot), ...T(-wBot, uBot + 0.6)], i % 2 ? mt[0] : mt[1], ol, 1);
    if (det) { ctx.fillStyle = mt[2]; ctx.beginPath(); polyPath(ctx, [...T(-wTop + 1, uTop - 0.4), ...T(wTop - 1, uTop - 0.4), ...T(wTop - 1.4, uTop - 1.4), ...T(-wTop + 1.4, uTop - 1.4)]); ctx.fill(); ctx.fillStyle = pal.trim[1]; const p = T(0, uBot + 1); ctx.fillRect(p[0] - 1, p[1] - 0.6, 2, 1.2); }
  }

  // --- 머리 ---
  heroScarf(ctx, J, pal, ent, ol, F, T, L);
  if (!ghost && ent.ribbon) { drawRibbon(ctx, ent, ent.ribbon, 4.6, 1.5, pal.band[1], ol, 1.3); drawRibbon(ctx, ent, ent.ribbon, 1.6, 0.4, pal.band[2], ol, 0); }
  drawPlayerHead(ctx, J, pal, ow, opt, HERO2_HEAD);

  // --- 검 · 앞팔 ---
  if (!J.wb) drawPlayerBlade(ctx, J, pal, ent, opt);
  limb(ctx, J.sh1, J.elbow1, J.hand1, 6.4, 5.6, 5, pal.coat, pal.bracer, ol, ow);
  if (det) {
    const e = J.elbow1, h = J.hand1, dx = h.x - e.x, dy = h.y - e.y, Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
    const Q = (a, b) => [e.x + ux * a + nx * b, e.y + uy * a + ny * b];
    olPoly(ctx, [...Q(-2, 6.4), ...Q(-2.4, -6.4), ...Q(2.8, -6), ...Q(3.2, 6)], pipe[1], ol, 1);                         // 붉은 소매 끝
    olPoly(ctx, [...Q(5, -6.2), ...Q(Ln - 3, -5.6), ...Q(Ln - 2, 2.4), ...Q(5.6, 3.2)], mt[1], ol, 1);                // 긴 팔 보호대
    ctx.fillStyle = mt[2]; ctx.beginPath(); polyPath(ctx, [...Q(6, -5.4), ...Q(Ln - 4, -5), ...Q(Ln - 4, -3.6), ...Q(6, -4)]); ctx.fill();
    ctx.fillStyle = mt[0]; ctx.beginPath(); polyPath(ctx, [...Q(6, 1.2), ...Q(Ln - 2.6, 1), ...Q(Ln - 2, 2.4), ...Q(5.6, 3.2)]); ctx.fill();
    ctx.fillStyle = pal.trim[1]; for (const a of [0.3, 0.62]) { const p = Q(5 + (Ln - 8) * a, -1.2); ctx.beginPath(); ctx.arc(p[0], p[1], 1, 0, TAU); ctx.fill(); }
  }
  heroPauldron2(ctx, J, pal, ent, ol);
  gearDeco(ctx, J, pal, ent, opt, 'top');
  circleOl(ctx, J.hand1.x, J.hand1.y, 5.4, pal.bracer[1], ol, ow);
  if (det) { ctx.strokeStyle = pal.trim[1]; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(J.hand1.x, J.hand1.y, 4.1, 3.4, 5.8); ctx.stroke(); ctx.fillStyle = pal.bracer[2]; ctx.beginPath(); ctx.arc(J.hand1.x - 1.2, J.hand1.y - 1.6, 2.4, 0, TAU); ctx.fill(); }
}

// 기본 복장일 때만 새 그림을 쓴다
(() => {
  const prev = RIG_PLAYER.draw;
  RIG_PLAYER.draw = (ctx, J, pal, ent, opt) => {
    const look = ent.adef && ent.adef.look;
    if (!(look && look.coat) && pal.pipe) drawPlayer2(ctx, J, pal, ent, opt); else prev(ctx, J, pal, ent, opt);
  };
})();
