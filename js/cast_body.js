'use strict';
// ============================================================
//  등장인물 몸 : NPC_DEFS 의 옷 종류별로 그린다 (cast.js 의 얼굴 · 머리와 함께 쓴다)
//   armor 기사 · dark 검은 갑옷 · robe 로브 · coat 장사꾼 외투 · smith 대장장이 · child 아이 · granny 할머니
//   rags 누더기 · scout 정찰병 · royal 왕 — 같은 뼈대에 다른 실루엣 · 다른 소품
// ============================================================
function npcLeg(ctx, hip, knee, foot, P, d, ol, ow, back) {
  const k = back ? 0.93 : 1, dk = m => [m[0], blMix(m[0], m[1], 0.45), m[1]];
  const pm = back ? dk(P.pants) : P.pants, bm = back ? dk(P.boots) : P.boots, W = d.build[0];
  ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, hip, knee, 8.2 * k * W + ow, 6 * k * W + ow); capsulePath(ctx, knee, foot, 6.2 * k * W + ow, 5 * k + ow); ctx.fill();
  shadedSeg(ctx, hip, knee, 8.2 * k * W, 6 * k * W, pm);
  shadedSeg(ctx, knee, foot, 6.2 * k * W, 5 * k, bm);
  heroFoot(ctx, knee, foot, bm, ol, back ? 11 : 12, 4.5, ow, true);
  const dx = foot.x - knee.x, dy = foot.y - knee.y, Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux;
  const B = (a, b) => [knee.x + ux * a + nx * b, knee.y + uy * a + ny * b];
  if (d.outfit === 'armor' || d.outfit === 'dark') {
    const M = P.metal, w = 5.6 * k;
    olPoly(ctx, [...B(3, -w), ...B(Ln * 0.82, -w + 0.8), ...B(Ln * 0.84, w * 0.3), ...B(3, w * 0.4)], M[1], ol, 0.9);
    ctx.fillStyle = M[2]; ctx.beginPath(); polyPath(ctx, [...B(4, -w + 1), ...B(Ln * 0.74, -w + 1.6), ...B(Ln * 0.74, -w + 3), ...B(4, -w + 3)]); ctx.fill();
    if (!back) { const kp = B(-0.4, -2); ctx.save(); ctx.translate(kp[0], kp[1]); ctx.rotate(Math.atan2(uy, ux)); olPoly(ctx, d.outfit === 'dark' ? [-5, -5.4, 3, -6, 9.4, 0, 3, 6, -5, 5.4, -7, 0] : [-5, -5, 4, -5.6, 6, 0, 4, 5.6, -5, 5], M[1], ol, 1); ctx.fillStyle = M[2]; ctx.fillRect(-3.6, -3.6, 5, 1.4); ctx.restore(); }
  } else if (d.outfit === 'scout' || d.outfit === 'smith') {
    ctx.strokeStyle = bm[2]; ctx.lineWidth = 1.4; ctx.beginPath(); for (const a of [0.2, 0.4, 0.6]) { const p = B(Ln * a, 0); ctx.moveTo(p[0] - nx * 5.6, p[1] - ny * 5.6); ctx.lineTo(p[0] + nx * 5.6, p[1] + ny * 5.6); } ctx.stroke();
  }
  olPoly(ctx, [...B(Ln * 0.84, -6.4), ...B(Ln * 0.84, 6.4), ...B(Ln - 1.4, 6.4), ...B(Ln - 1.4, -6.4)], bm[2], ol, 0.8);
}

function npcBladeOrProp(ctx, J, pal, ent, opt, d, P, ol) {
  if (!d.noBlade && !d.cane && !d.acc?.includes('hammer')) { drawPlayerBlade(ctx, J, pal, ent, opt); return; }
  weaponFrame(ctx, J.hand1, J.wAng);
  if (d.cane) {                                                                        // 지팡이 : 굽은 손잡이
    ctx.lineCap = 'round'; ctx.strokeStyle = ol; ctx.lineWidth = 5.6; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(58, 0); ctx.stroke();
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3.2; ctx.stroke(); ctx.strokeStyle = '#a8825a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, -0.8); ctx.lineTo(56, -0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(60, -4, 4, -0.4, 4.2); ctx.lineWidth = 5.6; ctx.strokeStyle = ol; ctx.stroke(); ctx.lineWidth = 3.2; ctx.strokeStyle = '#7a5a3a'; ctx.stroke();
    if (d.acc && d.acc.includes('scroll')) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 62, -6, 12, '150,255,190', 0.4 + Math.sin(Game.time * 0.07) * 0.1); ctx.globalCompositeOperation = 'source-over'; circleOl(ctx, 62, -6, 3, '#9affc0', ol, 0.8); }
  } else if (d.acc && d.acc.includes('hammer')) {                                      // 대장장이 망치
    ctx.lineCap = 'round'; ctx.strokeStyle = ol; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(40, 0); ctx.stroke(); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2.8; ctx.stroke();
    olPoly(ctx, [34, -9, 54, -9, 54, 9, 34, 9], '#8a909c', ol, 1.3); ctx.fillStyle = '#c4cad6'; ctx.fillRect(35.4, -7.6, 17, 3); ctx.fillStyle = '#5a606c'; ctx.fillRect(35.4, 3, 17, 4.4);
  }
  ctx.restore();
}

function drawNpc(ctx, J, pal, ent, opt) {
  const d = ent.npc, ol = pal.ol, ow = 1.5, o = d.outfit, W = d.build[0];
  const C = _tone(d.coat), T = _tone(d.trim), M = _tone(d.metal || '#8a94a6'), SK = _tone(d.skin);
  const P = { coat: C, trim: T, metal: M, pants: _tone(d.pants || (o === 'robe' || o === 'granny' ? blMix(d.coat, '#000000', 0.4) : '#4a4658')), boots: _tone(d.boots || '#3a2c24') };
  const F = torsoFrame(J), Hh = J.hip, L = F.L, Tp = (f, u) => tp(Hh, F, f, u), tailOk = ent.tail && ent.tail.p;
  const long = o === 'robe' || o === 'granny' || o === 'royal';
  const t = Game.time;
  const wob = d.hunch || 0;
  // 망토 · 가방 (뒤)
  if (d.cape && tailOk) { drawRibbon(ctx, ent, ent.tail, 13 * W, 8 * W, _tone(d.cape)[0], ol, ow); drawRibbon(ctx, ent, ent.tail, 7.5 * W, 3.4, _tone(d.cape)[1], ol, 0); }
  if (d.acc && d.acc.includes('pack')) {
    olSmooth(ctx, [...Tp(-14, 2), ...Tp(-24, L * 0.3), ...Tp(-25, L * 0.8), ...Tp(-17, L + 4), ...Tp(-10, L * 0.7)], '#7a4a22', ol, ow, 0.6);
    ctx.fillStyle = '#a06a30'; ctx.beginPath(); smoothPoly(ctx, [...Tp(-16, L * 0.55), ...Tp(-24, L * 0.6), ...Tp(-24, L * 0.9), ...Tp(-17, L + 3)], 0.6); ctx.fill();
    olPoly(ctx, [...Tp(-22.4, L * 0.78), ...Tp(-17, L * 0.7), ...Tp(-16.6, L * 0.55), ...Tp(-22, L * 0.6)], '#d0a050', ol, 0.8);
  }
  if (d.outfit === 'scout') { olPoly(ctx, [...Tp(-8, L * 0.9), ...Tp(-17, L * 1.25), ...Tp(-12, L * 1.3), ...Tp(-3, L * 0.95)], '#6a4a2a', ol, 0.9); for (const k of [0, 1, 2]) olPoly(ctx, [...Tp(-14 + k * 2, L * 1.26), ...Tp(-16 + k * 2, L * 1.38), ...Tp(-13 + k * 2, L * 1.27)], '#d8d0b0', ol, 0.5); }

  // 뒷팔
  limb(ctx, J.sh2, J.elbow2, J.hand2, 5.2, 4.8, 4.2, [C[0], C[0], C[1]], [SK[0], SK[0], SK[1]], ol, ow);
  npcLeg(ctx, J.hip, J.knee2, J.foot2, P, d, ol, ow, true);
  // 목
  ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, J.chest, J.neck, 5.2, 5); ctx.fill();
  ctx.fillStyle = SK[0]; ctx.beginPath(); capsulePath(ctx, J.chest, J.neck, 3.8, 3.6); ctx.fill();

  // 몸통
  const sw = (o === 'armor' || o === 'dark' || o === 'royal' ? 12.4 : o === 'child' ? 9.6 : 11) * W, ww = (long ? 9.4 : 9) * W;
  const body = [...Tp(-ww, -3), ...Tp(-sw, L * 0.5), ...Tp(-sw - 0.6, L * 0.86), ...Tp(-6, L + 3.6), ...Tp(6, L + 3.6), ...Tp(sw + 1.4, L * 0.84), ...Tp(sw, L * 0.4), ...Tp(ww, -3)];
  olSmooth(ctx, body, C[1], ol, ow, 0.7);
  ctx.save(); ctx.beginPath(); smoothPoly(ctx, body, 0.7); ctx.clip();
  const g = ctx.createLinearGradient(...Tp(-sw, 0), ...Tp(sw, 0)); g.addColorStop(0, 'rgba(0,0,14,0.36)'); g.addColorStop(0.5, 'rgba(0,0,14,0.04)'); g.addColorStop(1, 'rgba(160,190,255,0.14)');
  ctx.fillStyle = g; ctx.fillRect(-900, -900, 1800, 1800); ctx.restore();
  // 옷 종류별 상체
  switch (o) {
    case 'armor': case 'dark': {
      const cp = [...Tp(-8.4, L * 0.3), ...Tp(-11, L * 0.78), ...Tp(-6.6, L + 2.6), ...Tp(6.4, L + 2.8), ...Tp(sw + 0.6, L * 0.84), ...Tp(sw - 0.6, L * 0.34), ...Tp(3, L * 0.18)];
      olSmooth(ctx, cp, M[1], ol, 1.2, 0.55);
      ctx.save(); ctx.beginPath(); smoothPoly(ctx, cp, 0.55); ctx.clip();
      ctx.fillStyle = M[0]; ctx.beginPath(); polyPath(ctx, [...Tp(-14, 0), ...Tp(-4, 0), ...Tp(-4, L + 8), ...Tp(-14, L + 8)]); ctx.fill();
      ctx.fillStyle = M[2]; ctx.beginPath(); smoothPoly(ctx, [...Tp(6, L * 0.5), ...Tp(sw, L * 0.76), ...Tp(9.4, L + 1.4), ...Tp(5.4, L * 0.88)], 0.8); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = T[1]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...Tp(-7.6, L * 0.32)); ctx.lineTo(...Tp(2.8, L * 0.2)); ctx.lineTo(...Tp(sw - 1, L * 0.36)); ctx.stroke();
      if (o === 'dark') { const mk = Tp(5, L * 0.58); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, mk[0], mk[1], 9, '255,50,70', 0.4 + Math.sin(t * 0.08) * 0.12); ctx.globalCompositeOperation = 'source-over'; olPoly(ctx, [mk[0] - 3, mk[1], mk[0], mk[1] - 3.4, mk[0] + 3, mk[1], mk[0], mk[1] + 3.4], '#c02840', ol, 0.7); }
      break;
    }
    case 'robe': case 'royal': {
      olPoly(ctx, [...Tp(-3, L + 4), ...Tp(9, L + 1.6), ...Tp(sw, L * 0.3), ...Tp(5, L * 0.46)], T[1], ol, 0.9);                                  // 옷깃 안쪽
      ctx.strokeStyle = T[2]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(...Tp(-3, L + 3.8)); ctx.lineTo(...Tp(5, L * 0.46)); ctx.stroke();
      if (o === 'royal') {                                                                                                                         // 털 깃 + 보석
        for (let i = 0; i < 9; i++) { const p = Tp(-sw + 1 + i * (sw * 2 - 2) / 8, L + 1 - Math.abs(i - 4) * 0.9); circleOl(ctx, p[0], p[1], 3.4, '#f4f0e8', ol, 0.7); ctx.fillStyle = '#2a2a30'; ctx.fillRect(p[0] - 0.4, p[1] - 0.2, 0.9, 1.6); }
        const j = Tp(2, L * 0.66); circleOl(ctx, j[0], j[1], 2.8, '#d02848', ol, 0.8); ctx.fillStyle = '#fff'; ctx.fillRect(j[0] - 1.2, j[1] - 1.4, 1, 1);
      }
      break;
    }
    case 'smith':
      olPoly(ctx, [...Tp(-8, L * 0.9), ...Tp(8.4, L * 0.9), ...Tp(10, -3), ...Tp(-10, -3)], '#6a4a2a', ol, ow);                                      // 가죽 앞치마
      ctx.fillStyle = '#8a6238'; ctx.beginPath(); polyPath(ctx, [...Tp(-6, L * 0.8), ...Tp(2, L * 0.8), ...Tp(3, -1), ...Tp(-7, -1)]); ctx.fill();
      olPoly(ctx, [...Tp(-2, L * 0.4), ...Tp(7, L * 0.4), ...Tp(7, L * 0.16), ...Tp(-2, L * 0.16)], '#4a3220', ol, 0.8);                               // 주머니
      olPoly(ctx, [...Tp(-6, L * 0.9), ...Tp(-4, L + 3), ...Tp(-2, L + 3), ...Tp(-3.6, L * 0.86)], '#4a3220', ol, 0.7);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (const [f, u] of [[-3, 0.6], [4, 0.3], [0, 0.82]]) { const p = Tp(f, L * u); ctx.beginPath(); ctx.ellipse(p[0], p[1], 2.2, 1.3, 0.4, 0, TAU); ctx.fill(); }   // 그을음
      break;
    case 'granny': case 'child': case 'rags': case 'scout': {
      if (o === 'granny') olPoly(ctx, [...Tp(-sw, L * 0.7), ...Tp(sw + 2, L * 0.76), ...Tp(4, L * 0.1), ...Tp(-4, L * 0.1)], T[1], ol, ow);   // 숄
      if (o === 'rags') for (const [f, u, c] of [[-4, 0.5, '#a85a4a'], [4, 0.7, '#5a7a8a'], [1, 0.25, '#8a8a4a']]) { const p = Tp(f, L * u); olPoly(ctx, [p[0] - 3, p[1] - 3, p[0] + 3, p[1] - 3, p[0] + 3, p[1] + 3, p[0] - 3, p[1] + 3], c, ol, 0.6); ctx.strokeStyle = ol; ctx.setLineDash([1.2, 1.2]); ctx.lineWidth = 0.5; ctx.strokeRect(p[0] - 2.2, p[1] - 2.2, 4.4, 4.4); ctx.setLineDash([]); }
      if (o === 'scout') { olPoly(ctx, [...Tp(-10, L - 2), ...Tp(-7, L + 1.4), ...Tp(10, 8), ...Tp(9, 4)], '#6a4a2a', ol, 1); }
      if (o === 'child') { ctx.fillStyle = T[1]; ctx.beginPath(); polyPath(ctx, [...Tp(-sw, L * 0.1), ...Tp(sw, L * 0.1), ...Tp(sw, L * 0.04), ...Tp(-sw, L * 0.04)]); ctx.fill(); }
      break;
    }
    case 'coat':
      for (const u of [0.3, 0.5, 0.7]) { const p = Tp(7, L * u); circleOl(ctx, p[0], p[1], 1.7, T[1], ol, 0.6); }
      olPoly(ctx, [...Tp(-sw, L * 0.9), ...Tp(-4, L + 3.8), ...Tp(2, L * 0.5), ...Tp(-6, L * 0.52)], C[2], ol, 0.9);
      ctx.strokeStyle = T[1]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(...Tp(-sw, L * 0.9)); ctx.lineTo(...Tp(-4, L + 3.8)); ctx.lineTo(...Tp(2, L * 0.5)); ctx.stroke();
      if (d.acc && d.acc.includes('coins')) for (const k of [0, 1, 2]) { const p = Tp(-6 + k * 3.2, 1.5); circleOl(ctx, p[0], p[1] + Math.sin(t * 0.06 + k) * 0.5, 1.5, '#f2d060', ol, 0.5); }
      break;
  }
  if (d.acc && d.acc.includes('stars')) { ctx.fillStyle = T[2]; for (const [f, u] of [[-4, 0.4], [5, 0.6], [-2, 0.75], [8, 0.3]]) { const p = Tp(f, L * u); ctx.beginPath(); polyPath(ctx, [p[0], p[1] - 2, p[0] + 0.7, p[1] - 0.6, p[0] + 2, p[1], p[0] + 0.7, p[1] + 0.6, p[0], p[1] + 2, p[0] - 0.7, p[1] + 0.6, p[0] - 2, p[1], p[0] - 0.7, p[1] - 0.6]); ctx.fill(); } }
  if (d.acc && d.acc.includes('leaf')) { const p = Tp(3, L * 0.55); olPoly(ctx, [p[0], p[1] - 4, p[0] + 3, p[1], p[0], p[1] + 4, p[0] - 3, p[1]], T[1], ol, 0.7); }
  // 허리띠
  if (!long || o === 'royal') {
    olPoly(ctx, [...Tp(-ww - 0.6, -1.8), ...Tp(ww + 0.8, -1.8), ...Tp(ww + 1, 5), ...Tp(-ww - 1, 5)], o === 'armor' || o === 'dark' ? '#1c1c24' : '#4a3220', ol, 1);
    olPoly(ctx, [...Tp(-1.6, -2.4), ...Tp(4.8, -2.4), ...Tp(4.8, 5.6), ...Tp(-1.6, 5.6)], T[1], ol, 0.9);
  } else olPoly(ctx, [...Tp(-ww - 0.6, 0), ...Tp(ww + 0.8, 0), ...Tp(ww + 1, 4.6), ...Tp(-ww - 1, 4.6)], T[1], ol, 1);
  // 앞다리
  npcLeg(ctx, J.hip, J.knee1, J.foot1, P, d, ol, ow, false);
  // 아랫단
  const m = [(J.knee1.x + J.knee2.x) / 2, (J.knee1.y + J.knee2.y) / 2];
  const sway = tailOk ? clamp((ent.tail.p[1].x - ent.x) / (ent.scale * ent.facing) * 0.12, -3.4, 3.4) : 0;
  if (long) {
    const fy = Math.min(J.foot1.y, J.foot2.y) - 3, fl = (o === 'granny' ? 15 : 13) * W;
    const hem = [...Tp(-ww - 1, 3), ...Tp(ww + 1.6, 3), m[0] + fl + sway * 1.3, fy - 1, m[0] + fl * 0.4 + sway * 1.4, fy + 2, m[0] - fl * 0.4 + sway, fy, m[0] - fl - 1 + sway, fy - 2];
    olSmooth(ctx, hem, C[1], ol, ow, 0.35);
    ctx.save(); ctx.beginPath(); smoothPoly(ctx, hem, 0.35); ctx.clip();
    ctx.fillStyle = C[0]; ctx.beginPath(); polyPath(ctx, [...Tp(-ww - 1, 3), ...Tp(0, 3), m[0] - 2 + sway, fy + 4, m[0] - fl - 4 + sway, fy + 4]); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,14,0.3)'; ctx.lineWidth = 0.9; ctx.beginPath(); for (const a of [-0.6, -0.2, 0.25, 0.65]) { ctx.moveTo(...Tp(a * ww, 2)); ctx.quadraticCurveTo(m[0] + a * fl * 0.9 + sway * 0.5, (Hh.y + fy) / 2 + 4, m[0] + a * fl + sway, fy); } ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = T[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hem[8], hem[9]); ctx.lineTo(hem[6], hem[7]); ctx.lineTo(hem[4], hem[5]); ctx.lineTo(hem[2], hem[3]); ctx.stroke();
    if (o === 'royal') { ctx.strokeStyle = T[2]; ctx.lineWidth = 0.8; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]); }
  } else if (d.tabard || o === 'dark' || o === 'coat' || o === 'rags' || o === 'scout') {
    const tc = _tone(d.tabard || (o === 'dark' ? '#2a1020' : o === 'scout' ? '#4a6a3a' : d.coat));
    const lenK = o === 'coat' ? 12.6 : 10.4, ww2 = 6.2 * W;
    const cl = [...Tp(-ww2, 1), ...Tp(ww2 + 1, 1), m[0] + ww2 + 3 + sway * 1.2, m[1] + lenK - 3, m[0] + 3 + sway * 1.3, m[1] + lenK + 3, m[0] - 3 + sway * 1.1, m[1] + lenK - 1, m[0] - ww2 - 3 + sway, m[1] + lenK + 2];
    olPoly(ctx, cl, tc[1], ol, ow);
    ctx.fillStyle = tc[0]; ctx.beginPath(); polyPath(ctx, [...Tp(-ww2, 1), ...Tp(-1, 1), m[0] + sway * 1.1, m[1] + lenK, m[0] - ww2 - 3 + sway, m[1] + lenK + 2]); ctx.fill();
    ctx.strokeStyle = T[1]; ctx.lineWidth = 1.4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cl[8], cl[9]); ctx.lineTo(cl[6], cl[7]); ctx.lineTo(cl[4], cl[5]); ctx.lineTo(cl[2], cl[3]); ctx.stroke();
    if (d.tabard || o === 'dark') { const e = [m[0] + 3 + sway * 1.2, m[1] + 4]; ctx.fillStyle = T[1]; ctx.beginPath(); polyPath(ctx, [e[0], e[1] - 3.4, e[0] + 2.4, e[1], e[0], e[1] + 3.4, e[0] - 2.4, e[1]]); ctx.fill(); }
    if (o === 'armor' || o === 'dark') for (let i = 0; i < 2; i++) { const uTop = 1 - i * 3.6, uBot = -3 - i * 3.4; olPoly(ctx, [...Tp(-11.6 + i, uTop), ...Tp(11.6 - i, uTop), ...Tp(10.2 - i, uBot), ...Tp(-10.2 + i, uBot + 0.6)], i % 2 ? M[0] : M[1], ol, 0.9); }
  } else if (o === 'smith' || o === 'child') {
    const lk = o === 'child' ? 5 : 7.4;
    olPoly(ctx, [...Tp(-ww - 0.6, 3), ...Tp(ww + 1, 3), m[0] + 8 + sway, m[1] - 2 + lk, m[0] - 8 + sway, m[1] - 2 + lk], o === 'child' ? C[1] : '#6a4a2a', ol, ow);
    ctx.fillStyle = o === 'child' ? C[0] : '#4a3220'; ctx.beginPath(); polyPath(ctx, [...Tp(-ww, 3), ...Tp(0, 3), m[0] + sway, m[1] - 2 + lk, m[0] - 8 + sway, m[1] - 2 + lk]); ctx.fill();
  }
  // 머리 + 목도리 · 머리쓰개
  ctx.save(); ctx.translate(J.head.x + wob * 0.22, J.head.y + wob * 0.12); ctx.rotate(J.headRot);
  const hs = d.headScale || (o === 'child' ? 1.34 : 1.12); ctx.scale(hs, hs);
  drawNpcHead(ctx, d, P, ol, 1.5, { t, face: ent.npcFace || 'base' });
  ctx.restore();
  // 검 · 소품 · 앞팔
  npcBladeOrProp(ctx, J, pal, ent, opt, d, P, ol);
  const wide = d.sleeve === 'wide', sleeveM = o === 'armor' || o === 'dark' ? [M[0], M[1], M[2]] : C;
  limb(ctx, J.sh1, J.elbow1, J.hand1, 6 * W, 5.4, 4.8, wide ? C : sleeveM, o === 'smith' || o === 'child' ? SK : (o === 'armor' || o === 'dark' ? M : [C[0], C[1], C[2]]), ol, ow);
  { const e = J.elbow1, h = J.hand1, dx = h.x - e.x, dy = h.y - e.y, Ln = Math.hypot(dx, dy) || 1, ux = dx / Ln, uy = dy / Ln, nx = -uy, ny = ux, Q = (a, b) => [e.x + ux * a + nx * b, e.y + uy * a + ny * b];
    if (wide) olPoly(ctx, [...Q(-1, 5.6), ...Q(-1, -5.6), ...Q(Ln - 1, -9), ...Q(Ln + 2.4, 8)], C[1], ol, 1);
    if (wide) { ctx.fillStyle = C[0]; ctx.beginPath(); polyPath(ctx, [...Q(-1, 5.6), ...Q(Ln + 2.4, 8), ...Q(Ln - 1, 2), ...Q(-1, 1)]); ctx.fill(); ctx.strokeStyle = T[1]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(...Q(Ln - 1, -9)); ctx.lineTo(...Q(Ln + 2.4, 8)); ctx.stroke(); }
    if (o === 'armor' || o === 'dark') { olPoly(ctx, [...Q(4, -5.8), ...Q(Ln - 3, -5.4), ...Q(Ln - 2, 2.4), ...Q(4.6, 3)], M[1], ol, 0.9); ctx.fillStyle = M[2]; ctx.beginPath(); polyPath(ctx, [...Q(5, -5), ...Q(Ln - 4, -4.8), ...Q(Ln - 4, -3.5), ...Q(5, -3.8)]); ctx.fill(); }
    if (o === 'smith') { olPoly(ctx, [...Q(Ln * 0.3, -5.4), ...Q(Ln - 2, -5), ...Q(Ln - 2, 4.6), ...Q(Ln * 0.3, 5)], '#4a3220', ol, 0.9); }
  }
  if (o === 'armor' || o === 'dark') {
    const dx = J.elbow1.x - J.sh1.x, dy = J.elbow1.y - J.sh1.y, a = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(J.sh1.x + dx * 0.08, J.sh1.y + dy * 0.08); ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 8.8, 0, 0, TAU); ctx.fillStyle = ol; ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 0, 9.6, 7.4, 0, 0, TAU); ctx.fillStyle = M[1]; ctx.fill();
    ctx.beginPath(); ctx.ellipse(1, 2.4, 8, 4.6, 0, 0.1, Math.PI - 0.1); ctx.fillStyle = M[0]; ctx.fill(); ctx.beginPath(); ctx.ellipse(-2.4, -2.8, 4.6, 2.2, -0.2, 0, TAU); ctx.fillStyle = M[2]; ctx.fill();
    if (o === 'dark') olPoly(ctx, [-3, -6, 0.4, -15, 4, -6], T[1], ol, 0.9); else { ctx.strokeStyle = T[1]; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 0, 7.4, 5.4, 0, 0.4, Math.PI - 0.4); ctx.stroke(); }
    ctx.restore();
  }
  // 손
  const gl = o === 'armor' || o === 'dark' ? M : o === 'scout' || o === 'smith' ? _tone('#5a3a22') : SK;
  circleOl(ctx, J.hand1.x, J.hand1.y, o === 'child' ? 4.2 : 5, gl[1], ol, ow);
  ctx.fillStyle = gl[2]; ctx.beginPath(); ctx.arc(J.hand1.x - 1.2, J.hand1.y - 1.4, 1.8, 0, TAU); ctx.fill();
}

// 월드에서 NPC 를 그린다 : ent.npc 가 있는 몸은 위 그림, 나머지는 기존 그림
(() => {
  const prev = RIG_PLAYER.draw;
  RIG_PLAYER.draw = (ctx, J, pal, ent, opt) => {
    if (ent.npc && !opt.ghost && !opt.flash) drawNpc(ctx, J, pal, ent, opt); else prev(ctx, J, pal, ent, opt);
  };
})();
