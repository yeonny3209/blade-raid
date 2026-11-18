'use strict';
// ============================================================
//  초상화 : 대화창 · 기억 앨범 · 등불 거점에서 쓰는 가슴 위 그림 (128칸 원 안)
//   사람은 cast.js 의 얼굴 · 머리 · 옷 값으로 크게 그리고, 괴물 · 보스는 인물마다 따로 그린다.
//   img/story/portrait/ 에 그림 파일이 있으면 그것이 우선이다 (dialog.js 의 Por.draw)
// ============================================================
const _cpPoly = (g, pts, fill, ol, w) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.lineJoin = 'round'; if (ol) { g.strokeStyle = ol; g.lineWidth = w || 2; g.stroke(); } g.fillStyle = fill; g.fill(); };
const _cpGlow = (g, x, y, r, rgb, a) => { g.save(); g.globalCompositeOperation = 'lighter'; drawGlow(g, x, y, r, rgb, a); g.restore(); };
const _cpEye = (g, x, y, rx, ry, col) => { g.fillStyle = '#10080c'; g.beginPath(); g.ellipse(x, y, rx + 1, ry + 1, 0, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.3, rx * 0.32, ry * 0.32, 0, 0, TAU); g.fill(); _cpGlow(g, x, y, rx * 3.4, '255,255,255', 0.25); };
const OL = '#120f18';

// ---------- 사람 : 큰 얼굴 + 어깨 · 옷 ----------
function bustNpc(g, d, face, R) {
  const C = _tone(d.coat), T = _tone(d.trim), M = _tone(d.metal || '#8a94a6'), SK = _tone(d.skin), o = d.outfit;
  const P = { coat: C, trim: T, metal: M };
  g.save(); g.translate(R + 2, 0);
  if (d.cape) { _cpPoly(g, [-62, 128, -52, 84, -26, 70, 26, 70, 56, 84, 66, 128], _tone(d.cape)[0], OL, 2.4); }
  // 어깨 · 몸
  const sh = o === 'child' ? 0.78 : 1;
  _cpPoly(g, [-58 * sh, 130, -52 * sh, 96, -30, 80, 30, 80, 54 * sh, 96, 60 * sh, 130], C[1], OL, 2.6);
  g.fillStyle = C[0]; g.beginPath(); g.moveTo(-58 * sh, 130); g.lineTo(-52 * sh, 96); g.lineTo(-30, 80); g.lineTo(-10, 80); g.lineTo(-18, 130); g.fill();
  g.fillStyle = 'rgba(160,190,255,0.14)'; g.beginPath(); g.moveTo(24, 80); g.lineTo(54 * sh, 96); g.lineTo(60 * sh, 130); g.lineTo(40, 130); g.fill();
  // 목
  _cpPoly(g, [-9, 62, 13, 62, 15, 86, -11, 86], SK[0], OL, 2.2);
  if (o === 'armor' || o === 'dark') {
    _cpPoly(g, [-24, 80, 24, 80, 20, 92, -20, 92], M[1], OL, 2); g.fillStyle = M[2]; g.fillRect(-18, 82, 20, 3);
    for (const s of [-1, 1]) {                                                              // 어깨 갑옷
      g.beginPath(); g.ellipse(s * 44, 100, 26, 20, 0, 0, TAU); g.fillStyle = OL; g.fill(); g.beginPath(); g.ellipse(s * 44, 100, 23.4, 17.4, 0, 0, TAU); g.fillStyle = s < 0 ? M[0] : M[1]; g.fill();
      g.beginPath(); g.ellipse(s * 44 - s * 4, 94, 12, 5.4, 0, 0, TAU); g.fillStyle = M[2]; g.fill();
      g.strokeStyle = T[1]; g.lineWidth = 2; g.beginPath(); g.ellipse(s * 44, 100, 18, 12.4, 0, 0.3, Math.PI - 0.3); g.stroke();
      if (o === 'dark') _cpPoly(g, [s * 40, 84, s * 44, 62, s * 50, 84], T[1], OL, 1.6);
    }
    g.strokeStyle = T[1]; g.lineWidth = 2; g.beginPath(); g.moveTo(-18, 104); g.lineTo(0, 112); g.lineTo(20, 104); g.stroke();
  } else if (o === 'robe' || o === 'royal') {
    _cpPoly(g, [-16, 80, 10, 118, 34, 80, 14, 92], T[1], OL, 2); g.strokeStyle = T[2]; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-14, 82); g.lineTo(10, 116); g.stroke();
    if (o === 'royal') for (let i = 0; i < 9; i++) { const x = -44 + i * 11, y = 90 - Math.abs(i - 4) * 2.6; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fillStyle = '#f4f0e8'; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke(); g.fillStyle = '#2a2a30'; g.fillRect(x - 1, y - 1, 2, 4); }
    if (d.acc && d.acc.includes('stars')) { g.fillStyle = T[2]; for (const [x, y] of [[-34, 104], [30, 112], [-12, 120], [44, 98]]) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 1.6 : 4.4; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); } }
  } else if (o === 'smith') {
    _cpPoly(g, [-30, 128, -26, 92, 26, 92, 30, 128], '#6a4a2a', OL, 2.4); _cpPoly(g, [-24, 92, -16, 92, -12, 80, -22, 84], '#4a3220', OL, 1.6); _cpPoly(g, [16, 92, 24, 92, 22, 84, 12, 80], '#4a3220', OL, 1.6);
  } else if (o === 'coat') {
    _cpPoly(g, [-48, 94, -20, 78, -4, 96, -22, 128, -50, 128], C[2], OL, 2.2); g.strokeStyle = T[1]; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-48, 94); g.lineTo(-20, 78); g.lineTo(-4, 96); g.stroke();
    for (const y of [102, 116]) { g.beginPath(); g.arc(18, y, 3.4, 0, TAU); g.fillStyle = T[1]; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.4; g.stroke(); }
  } else if (o === 'granny') {
    _cpPoly(g, [-58, 128, -50, 90, -14, 78, 26, 80, 56, 92, 62, 128], T[1], OL, 2.4); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1.6; g.beginPath(); for (const x of [-34, -12, 10, 32]) { g.moveTo(x, 92); g.lineTo(x - 4, 128); } g.stroke();
  } else if (o === 'rags') {
    for (const [x, y, c] of [[-32, 104, '#a85a4a'], [26, 112, '#5a7a8a'], [-4, 120, '#8a8a4a']]) { _cpPoly(g, [x - 8, y - 8, x + 8, y - 8, x + 8, y + 8, x - 8, y + 8], c, OL, 1.6); g.strokeStyle = OL; g.setLineDash([3, 3]); g.lineWidth = 1; g.strokeRect(x - 6, y - 6, 12, 12); g.setLineDash([]); }
  } else if (o === 'scout') {
    _cpPoly(g, [-50, 98, -30, 82, 30, 82, 50, 98, 40, 128, -40, 128], C[2], OL, 2.2); _cpPoly(g, [-48, 90, -40, 84, 34, 128, 22, 128], '#6a4a2a', OL, 1.8);
  } else if (o === 'child') {
    g.strokeStyle = T[1]; g.lineWidth = 4; g.beginPath(); g.moveTo(-18, 84); g.quadraticCurveTo(0, 96, 20, 84); g.stroke();
  }
  // 얼굴 (옆얼굴 3/4)
  g.save(); g.translate(-5, 54); const hs = (d.headScale || (o === 'child' ? 1.18 : 1)) * 3.2; g.scale(hs, hs);
  drawNpcHead(g, d, P, OL, 0.75, { face, detail: true, t: 0 });
  g.restore();
  g.restore();
}

// ---------- 주인공 ----------
function bustHero(g, R, face) {
  const pal = RIG_PLAYER.pal, C = pal.coat, M = pal.metal, P = pal.pauldron;
  g.save(); g.translate(R + 2, 0);
  _cpPoly(g, [-58, 130, -50, 96, -28, 80, 28, 80, 52, 96, 60, 130], C[1], OL, 2.6);
  g.fillStyle = C[0]; g.beginPath(); g.moveTo(-58, 130); g.lineTo(-50, 96); g.lineTo(-28, 80); g.lineTo(-8, 80); g.lineTo(-16, 130); g.fill();
  _cpPoly(g, [-9, 62, 13, 62, 15, 88, -11, 88], pal.skin[0], OL, 2.2);
  _cpPoly(g, [-26, 84, 24, 84, 22, 98, -22, 98], pal.pipe[1], OL, 2);                                       // 목도리
  _cpPoly(g, [-34, 98, 34, 98, 40, 128, -40, 128], M[1], OL, 2.2); g.fillStyle = M[2]; g.fillRect(-20, 102, 34, 3);
  g.beginPath(); g.ellipse(46, 100, 24, 18, 0, 0, TAU); g.fillStyle = OL; g.fill(); g.beginPath(); g.ellipse(46, 100, 21.6, 15.6, 0, 0, TAU); g.fillStyle = P[1]; g.fill();
  g.beginPath(); g.ellipse(42, 94, 11, 5, 0, 0, TAU); g.fillStyle = P[2]; g.fill(); _cpPoly(g, [40, 84, 46, 64, 52, 84], pal.pipe[1], OL, 1.6);
  const mk = [10, 116]; _cpGlow(g, mk[0], mk[1], 14, '255,50,30', 0.6); g.fillStyle = '#c02a20'; g.beginPath(); g.ellipse(mk[0], mk[1], 5, 3, 0, 0, TAU); g.fill();
  g.save(); g.translate(-5, 54); g.scale(3.5, 3.5); drawPlayerHead(g, UI.pJ, pal, 0.6, {}, 1); g.restore();
  g.restore();
}

// ---------- 괴물 · 보스 ----------
const MON_BUST = {
  morgrain(g, R) {
    _cpGlow(g, R, R, 70, '170,60,255', 0.45);
    _cpPoly(g, [8, 128, 14, 80, 40, 60, 64, 54, 88, 60, 114, 80, 120, 128], '#150a24', OL, 2.4);
    for (const s of [-1, 1]) { g.fillStyle = '#2a1646'; g.beginPath(); g.moveTo(64 + s * 18, 40); g.quadraticCurveTo(64 + s * 50, 34, 64 + s * 46, 4); g.quadraticCurveTo(64 + s * 38, 26, 64 + s * 12, 28); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); }
    _cpPoly(g, [40, 42, 64, 30, 88, 42, 84, 92, 64, 104, 44, 92], '#e8e0f0', OL, 2.4);
    g.fillStyle = '#cfc4e0'; g.beginPath(); g.moveTo(64, 30); g.lineTo(88, 42); g.lineTo(84, 92); g.lineTo(64, 104); g.fill();
    for (const [x, y, r] of [[52, 58, 5], [76, 58, 5], [64, 72, 6], [64, 48, 3.4], [50, 80, 3], [78, 80, 3]]) _cpEye(g, x, y, r, r * 0.8, '#c060ff');
    g.strokeStyle = '#150a24'; g.lineWidth = 2; g.beginPath(); g.moveTo(52, 92); g.lineTo(76, 92); for (let x = 54; x < 76; x += 5) { g.moveTo(x, 90); g.lineTo(x + 2, 96); } g.stroke();
  },
  captain(g, R) {
    _cpGlow(g, R, 70, 64, '90,230,200', 0.35);
    _cpPoly(g, [14, 128, 20, 90, 46, 78, 82, 78, 108, 90, 114, 128], '#1a3040', OL, 2.4);
    _cpPoly(g, [36, 56, 44, 30, 64, 22, 84, 30, 92, 56, 80, 96, 64, 106, 48, 96], '#d8f0e4', OL, 2.4);
    g.fillStyle = '#9fd8c8'; g.beginPath(); g.moveTo(64, 22); g.lineTo(84, 30); g.lineTo(92, 56); g.lineTo(80, 96); g.lineTo(64, 106); g.fill();
    for (const x of [52, 76]) { g.fillStyle = '#06141a'; g.beginPath(); g.ellipse(x, 58, 8, 10, 0, 0, TAU); g.fill(); _cpGlow(g, x, 58, 16, '80,255,220', 0.7); g.fillStyle = '#9affea'; g.beginPath(); g.arc(x, 59, 2.6, 0, TAU); g.fill(); }
    g.fillStyle = '#06141a'; g.beginPath(); g.moveTo(60, 74); g.lineTo(64, 66); g.lineTo(68, 74); g.fill();
    for (let x = 48; x < 84; x += 6) { g.fillStyle = '#e8f6ee'; g.fillRect(x, 88, 4.6, 8); g.strokeStyle = OL; g.lineWidth = 1; g.strokeRect(x, 88, 4.6, 8); }
    _cpPoly(g, [12, 44, 24, 22, 64, 6, 104, 22, 116, 44, 94, 36, 64, 30, 34, 36], '#0c1c28', OL, 2.4);                                  // 삼각모
    g.fillStyle = '#e8f6ee'; g.beginPath(); g.arc(64, 22, 6, 0, TAU); g.fill(); g.fillStyle = '#0c1c28'; g.fillRect(61, 22, 2, 3); g.fillRect(65, 22, 2, 3);
    g.strokeStyle = 'rgba(80,230,190,0.5)'; g.lineWidth = 2; g.beginPath(); for (const x of [30, 46, 82, 98]) { g.moveTo(x, 100); g.quadraticCurveTo(x - 4, 114, x + 2, 126); } g.stroke();
  },
  harghan(g, R) {
    _cpGlow(g, R, R + 6, 70, '255,130,40', 0.5);
    _cpPoly(g, [20, 128, 24, 84, 50, 66, 78, 66, 104, 84, 108, 128], '#3a3238', OL, 2.4);
    for (const s of [-1, 1]) { g.strokeStyle = OL; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(64 + s * 22, 44); g.quadraticCurveTo(64 + s * 50, 38, 64 + s * 46, 66); g.stroke(); g.strokeStyle = '#7a7480'; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#c8c2cc'; g.lineWidth = 2; g.stroke(); }
    _cpPoly(g, [38, 44, 90, 44, 98, 82, 64, 106, 30, 82], '#5a545e', OL, 2.4); g.fillStyle = '#8a848e'; g.fillRect(40, 48, 48, 8);
    for (let x = 42; x < 88; x += 9) { g.fillStyle = '#d8d2dc'; g.fillRect(x, 52, 3, 3); }
    for (const x of [52, 76]) { g.fillStyle = '#100808'; g.fillRect(x - 8, 62, 16, 12); _cpGlow(g, x, 68, 18, '255,110,30', 0.9); g.fillStyle = '#ffb040'; g.fillRect(x - 5, 66, 10, 5); }
    g.fillStyle = '#100808'; g.fillRect(48, 88, 32, 8); g.fillStyle = '#ff7a20'; for (let x = 50; x < 78; x += 6) g.fillRect(x, 90, 3, 4);
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(255,${120 + i * 15},40,0.6)`; g.beginPath(); g.arc(30 + i * 14, 40 - (i % 3) * 8, 4 - i % 2, 0, TAU); g.fill(); }
  },
  varkas(g, R) {
    _cpGlow(g, R, R, 70, '255,70,40', 0.45);
    _cpPoly(g, [14, 128, 22, 82, 46, 64, 82, 64, 106, 82, 114, 128], '#5a1810', OL, 2.4);
    for (const s of [-1, 1]) { g.fillStyle = '#e0d4b8'; g.beginPath(); g.moveTo(64 + s * 20, 42); g.quadraticCurveTo(64 + s * 62, 40, 64 + s * 54, -2); g.quadraticCurveTo(64 + s * 42, 26, 64 + s * 14, 30); g.fill(); g.strokeStyle = OL; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = '#a89878'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(64 + s * 30, 36); g.quadraticCurveTo(64 + s * 50, 30, 64 + s * 50, 8); g.stroke(); }
    _cpPoly(g, [36, 44, 64, 34, 92, 44, 96, 80, 80, 104, 64, 108, 48, 104, 32, 80], '#c2442c', OL, 2.4);
    g.fillStyle = '#8a2a1c'; g.beginPath(); g.moveTo(36, 44); g.lineTo(52, 50); g.lineTo(48, 100); g.lineTo(32, 80); g.fill();
    for (const x of [50, 78]) { g.fillStyle = '#10080a'; g.beginPath(); g.moveTo(x - 9, 60); g.lineTo(x + 9, 64); g.lineTo(x + 6, 72); g.lineTo(x - 8, 68); g.fill(); _cpGlow(g, x, 66, 14, '255,210,60', 0.8); g.fillStyle = '#ffe070'; g.fillRect(x - 3, 64, 6, 3); }
    g.fillStyle = '#10080a'; g.beginPath(); g.moveTo(44, 90); g.quadraticCurveTo(64, 102, 84, 90); g.lineTo(80, 98); g.quadraticCurveTo(64, 112, 48, 98); g.fill();
    for (const s of [-1, 1]) _cpPoly(g, [64 + s * 14, 92, 64 + s * 19, 92, 64 + s * 17, 108], '#f0e8d0', OL, 1.4);
  },
  gorden(g, R) {
    _cpGlow(g, R, 64, 60, '180,200,150', 0.22);
    _cpPoly(g, [12, 128, 18, 86, 44, 68, 84, 68, 110, 86, 116, 128], '#6a6a62', OL, 2.4);
    _cpPoly(g, [32, 40, 50, 22, 78, 22, 96, 40, 100, 80, 84, 104, 44, 104, 28, 80], '#8a8a80', OL, 2.6);
    g.fillStyle = '#6a6a62'; g.beginPath(); g.moveTo(32, 40); g.lineTo(50, 22); g.lineTo(54, 60); g.lineTo(44, 104); g.lineTo(28, 80); g.fill();
    g.strokeStyle = '#3a3a34'; g.lineWidth = 2; g.beginPath(); g.moveTo(70, 24); g.lineTo(64, 44); g.lineTo(74, 56); g.moveTo(40, 84); g.lineTo(52, 92); g.lineTo(48, 104); g.stroke();
    g.fillStyle = '#5a8a3a'; for (const [x, y] of [[36, 46], [88, 40], [60, 100], [90, 92]]) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
    for (const x of [52, 78]) { g.fillStyle = '#10100a'; g.fillRect(x - 8, 58, 16, 8); _cpGlow(g, x, 62, 16, '200,255,140', 0.85); g.fillStyle = '#e0ffb0'; g.fillRect(x - 5, 60, 10, 4); }
    g.fillStyle = '#10100a'; g.fillRect(50, 86, 30, 6);
  },
  drillak(g, R) {
    _cpPoly(g, [14, 128, 20, 90, 44, 76, 84, 76, 108, 90, 114, 128], '#2a2030', OL, 2.4);
    for (const [s, y] of [[-1, 52], [-1, 66], [1, 52], [1, 66]]) { g.strokeStyle = OL; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(64 + s * 22, y); g.quadraticCurveTo(64 + s * 48, y - 18, 64 + s * 56, y + 14); g.stroke(); g.strokeStyle = '#4a3a50'; g.lineWidth = 4; g.stroke(); }
    _cpPoly(g, [34, 44, 64, 32, 94, 44, 90, 84, 64, 96, 38, 84], '#4a3a50', OL, 2.6);
    for (const [x, y, r] of [[48, 54, 6], [80, 54, 6], [40, 66, 4], [88, 66, 4], [56, 46, 3], [72, 46, 3]]) _cpEye(g, x, y, r, r, '#ff5a8a');
    _cpPoly(g, [54, 68, 74, 68, 66, 118, 62, 118], '#b8bcc8', OL, 2.4); g.strokeStyle = '#6a6e7a'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 6; i++) { const y = 72 + i * 8; g.moveTo(56 + i * 0.6, y); g.lineTo(72 - i * 0.6, y + 4); } g.stroke();
    _cpGlow(g, 64, 112, 18, '255,200,100', 0.5);
  },
  crystalos(g, R) {
    _cpGlow(g, R, R, 74, '170,230,255', 0.5);
    const facets = [[[64, 4], [100, 40], [64, 64]], [[64, 4], [28, 40], [64, 64]], [[100, 40], [92, 92], [64, 64]], [[28, 40], [36, 92], [64, 64]], [[36, 92], [64, 124], [64, 64]], [[92, 92], [64, 124], [64, 64]]];
    facets.forEach((f, i) => { const h = (i * 55 + 190) % 360, c = hslRgb(h, 0.8, 0.62 - (i % 2) * 0.12); _cpPoly(g, f.flat(), `rgb(${c})`, OL, 2.4); });
    _cpEye(g, 64, 66, 12, 12, '#fff'); _cpGlow(g, 64, 66, 30, '255,255,255', 0.6);
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(50, 28); g.lineTo(60, 14); g.moveTo(84, 54); g.lineTo(92, 46); g.stroke();
  },
  skaldir(g, R) {
    _cpGlow(g, R, R, 72, '170,220,255', 0.4);
    _cpPoly(g, [10, 128, 20, 92, 52, 80, 80, 80, 112, 92, 120, 128], '#8ab0d0', OL, 2.4);
    for (const s of [-1, 1]) { g.fillStyle = '#e8f6ff'; g.beginPath(); g.moveTo(64 + s * 14, 38); g.quadraticCurveTo(64 + s * 44, 28, 64 + s * 50, -2); g.quadraticCurveTo(64 + s * 34, 16, 64 + s * 8, 28); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); }
    _cpPoly(g, [36, 40, 64, 26, 92, 40, 90, 74, 100, 108, 64, 118, 28, 108, 38, 74], '#a8d0f0', OL, 2.6);
    g.fillStyle = '#7aa8d0'; g.beginPath(); g.moveTo(36, 40); g.lineTo(52, 44); g.lineTo(44, 114); g.lineTo(28, 108); g.lineTo(38, 74); g.fill();
    for (const x of [50, 78]) { g.fillStyle = '#10243a'; g.beginPath(); g.moveTo(x - 9, 56); g.lineTo(x + 9, 58); g.lineTo(x + 6, 68); g.lineTo(x - 7, 66); g.fill(); _cpGlow(g, x, 62, 14, '170,240,255', 0.8); g.fillStyle = '#e8fcff'; g.fillRect(x - 3, 59, 6, 5); }
    g.fillStyle = '#10243a'; g.fillRect(46, 94, 36, 8); for (let x = 48; x < 80; x += 6) _cpPoly(g, [x, 94, x + 4, 94, x + 2, 102], '#fff', null);
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(20 + i * 22, 118); g.lineTo(24 + i * 22, 126); } g.stroke();
  },
  chronarch(g, R) {
    _cpGlow(g, R, R, 72, '255,210,120', 0.4);
    g.beginPath(); g.arc(64, 64, 56, 0, TAU); g.fillStyle = OL; g.fill(); g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.fillStyle = '#f0e0b0'; g.fill();
    g.beginPath(); g.arc(64, 64, 46, 0, TAU); g.fillStyle = '#d8c488'; g.fill();
    g.strokeStyle = '#5a4020'; g.lineWidth = 2.4; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 40 : 34; g.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0); g.lineTo(64 + Math.cos(a) * 45, 64 + Math.sin(a) * 45); } g.stroke();
    for (const [x, y] of [[48, 54], [80, 54]]) { g.strokeStyle = OL; g.lineWidth = 2.4; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.stroke(); _cpGlow(g, x, y, 12, '255,160,60', 0.5); g.fillStyle = '#ff6a20'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
    g.strokeStyle = '#2a1a0a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(64, 70); g.lineTo(64, 28); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(64, 70); g.lineTo(90, 82); g.stroke();
    g.beginPath(); g.moveTo(40, 90); g.quadraticCurveTo(64, 104, 88, 90); g.lineWidth = 2.4; g.stroke();
    for (const [x, y, r] of [[14, 20, 9], [112, 108, 8]]) { g.strokeStyle = OL; g.lineWidth = 1.6; g.fillStyle = '#c8a050'; g.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * 0.76 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); }
  },
  morta(g, R) {
    _cpGlow(g, R, 36, 50, '90,170,255', 0.6);
    _cpPoly(g, [12, 128, 18, 84, 42, 66, 86, 66, 110, 84, 116, 128], '#2a3040', OL, 2.4);
    _cpPoly(g, [34, 86, 94, 86, 88, 104, 40, 104], '#566074', OL, 2.4);
    _cpPoly(g, [38, 66, 90, 66, 94, 88, 34, 88], '#3a4256', OL, 2.4);
    for (let i = 0; i < 7; i++) { const x = 44 + i * 6; g.fillStyle = `rgba(110,190,255,${0.9 - i % 3 * 0.15})`; g.beginPath(); g.moveTo(x - 4, 66); g.quadraticCurveTo(x + (i % 2 ? 6 : -6), 40 - (i % 3) * 8, x + 2, 12 + (i % 3) * 10); g.quadraticCurveTo(x + 8, 42, x + 4, 66); g.fill(); }
    _cpGlow(g, 64, 44, 30, '120,200,255', 0.6);
    g.strokeStyle = '#a8c8ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, 80); g.lineTo(88, 80); g.stroke();
    _cpPoly(g, [56, 96, 72, 96, 68, 128, 60, 128], '#8a2a30', OL, 1.6);
  },
  veilun(g, R) {
    _cpGlow(g, R, R, 70, '255,60,90', 0.35);
    _cpPoly(g, [8, 128, 16, 80, 44, 58, 84, 58, 112, 80, 120, 128], '#5a0a1a', OL, 2.4);
    _cpPoly(g, [28, 128, 30, 62, 46, 40, 82, 40, 98, 62, 100, 128, 82, 100, 64, 112, 46, 100], '#240810', OL, 2.4);
    _cpPoly(g, [42, 44, 64, 34, 86, 44, 84, 88, 64, 104, 44, 88], '#ecdcd8', OL, 2.4); g.fillStyle = '#c8b4b0'; g.beginPath(); g.moveTo(42, 44); g.lineTo(54, 48); g.lineTo(52, 96); g.lineTo(44, 88); g.fill();
    _cpPoly(g, [38, 52, 46, 28, 64, 22, 84, 30, 90, 54, 80, 38, 64, 36, 50, 40], '#100408', OL, 2.4);
    for (const x of [54, 76]) { g.fillStyle = '#240810'; g.beginPath(); g.moveTo(x - 8, 60); g.lineTo(x + 8, 62); g.lineTo(x + 5, 70); g.lineTo(x - 6, 68); g.fill(); _cpGlow(g, x, 65, 12, '255,40,70', 0.9); g.fillStyle = '#ff4060'; g.fillRect(x - 3, 63, 6, 4); }
    g.fillStyle = '#1a0408'; g.fillRect(52, 84, 26, 5); for (const x of [56, 70]) _cpPoly(g, [x, 86, x + 4, 86, x + 2, 94], '#fff', OL, 0.8);
    g.fillStyle = '#c02040'; g.beginPath(); g.arc(64, 112, 5, 0, TAU); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke();
  },
  aspel(g, R) {
    _cpGlow(g, R, R, 76, '255,110,30', 0.55);
    _cpPoly(g, [8, 128, 18, 90, 50, 80, 78, 80, 110, 90, 120, 128], '#8a2418', OL, 2.4);
    for (const s of [-1, 1]) { g.fillStyle = '#f0d098'; g.beginPath(); g.moveTo(64 + s * 16, 36); g.quadraticCurveTo(64 + s * 52, 24, 64 + s * 52, -4); g.quadraticCurveTo(64 + s * 36, 16, 64 + s * 8, 28); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); }
    _cpPoly(g, [34, 40, 64, 26, 94, 40, 92, 74, 102, 106, 64, 118, 26, 106, 36, 74], '#d8542a', OL, 2.6);
    g.fillStyle = '#a02e18'; g.beginPath(); g.moveTo(34, 40); g.lineTo(52, 44); g.lineTo(44, 114); g.lineTo(26, 106); g.lineTo(36, 74); g.fill();
    for (const x of [50, 78]) { g.fillStyle = '#200806'; g.beginPath(); g.moveTo(x - 9, 56); g.lineTo(x + 9, 58); g.lineTo(x + 6, 68); g.lineTo(x - 7, 66); g.fill(); _cpGlow(g, x, 62, 14, '255,230,80', 0.9); g.fillStyle = '#fff4a0'; g.fillRect(x - 3, 59, 6, 5); }
    g.fillStyle = '#200806'; g.fillRect(46, 94, 36, 9); for (let x = 48; x < 80; x += 6) _cpPoly(g, [x, 94, x + 4, 94, x + 2, 102], '#fff4c0', null);
    for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(255,${150 + i * 12},50,0.7)`; g.beginPath(); g.moveTo(20 + i * 15, 124); g.quadraticCurveTo(24 + i * 15, 104, 20 + i * 15 + (i % 2 ? 6 : -4), 92); g.quadraticCurveTo(28 + i * 15, 108, 28 + i * 15, 124); g.fill(); }
  },
  penra(g, R) {
    _cpGlow(g, R, R, 66, '150,240,60', 0.3);
    _cpPoly(g, [8, 128, 14, 92, 40, 78, 88, 78, 114, 92, 120, 128], '#4a6a2a', OL, 2.4);
    g.beginPath(); g.ellipse(64, 78, 54, 40, 0, 0, TAU); g.fillStyle = '#6a9a3a'; g.fill(); g.strokeStyle = OL; g.lineWidth = 2.6; g.stroke();
    g.fillStyle = '#8ac04a'; g.beginPath(); g.ellipse(56, 66, 32, 20, 0, 0, TAU); g.fill();
    for (const s of [-1, 1]) { circleOl(g, 64 + s * 28, 42, 15, '#8ac04a', OL, 2.2); circleOl(g, 64 + s * 28, 43, 9, '#f0e040', OL, 1.4); g.fillStyle = '#100a04'; g.fillRect(64 + s * 28 - 8, 41, 16, 3.4); }
    g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 90); g.quadraticCurveTo(64, 112, 106, 90); g.stroke(); g.strokeStyle = '#2a3a14'; g.lineWidth = 1.2; g.stroke();
    for (const [x, y, r] of [[36, 74, 5], [80, 70, 6], [92, 84, 4], [50, 62, 3.4], [64, 78, 4]]) { circleOl(g, x, y, r, '#b04aff', OL, 1.4); _cpGlow(g, x, y, r * 2.4, '180,80,255', 0.4); }
  },
  nekrem(g, R) {
    _cpGlow(g, R, R, 70, '255,220,120', 0.45);
    _cpPoly(g, [4, 128, 14, 60, 36, 28, 92, 28, 114, 60, 124, 128, 96, 110, 32, 110], '#2a50a0', OL, 2.6);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f0cc60' : '#2a50a0'; g.fillRect(16 + i * 2, 34 + i * 12, 5, 12); g.fillRect(107 - i * 2 - 5, 34 + i * 12, 5, 12); }
    _cpPoly(g, [40, 36, 64, 26, 88, 36, 86, 90, 64, 108, 42, 90], '#f2cc58', OL, 2.6); g.fillStyle = '#c8a030'; g.beginPath(); g.moveTo(40, 36); g.lineTo(54, 40); g.lineTo(52, 98); g.lineTo(42, 90); g.fill();
    for (const x of [52, 76]) { _cpPoly(g, [x - 9, 58, x + 9, 58, x + 7, 66, x - 7, 66], '#100a04', OL, 1.4); _cpGlow(g, x, 62, 12, '80,220,255', 0.8); g.fillStyle = '#9af0ff'; g.fillRect(x - 4, 60, 8, 4); g.strokeStyle = '#100a04'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + (x < 64 ? -8 : 8), 62); g.lineTo(x + (x < 64 ? -16 : 16), 70); g.stroke(); }
    _cpPoly(g, [60, 66, 68, 66, 70, 82, 58, 82], '#c8a030', OL, 1.4); g.strokeStyle = '#100a04'; g.lineWidth = 2; g.beginPath(); g.moveTo(54, 92); g.lineTo(74, 92); g.stroke();
    _cpPoly(g, [56, 100, 72, 100, 76, 126, 52, 126], '#2a50a0', OL, 2); for (const y of [106, 114, 122]) { g.fillStyle = '#f0cc60'; g.fillRect(56, y, 16, 3); }
    _cpPoly(g, [58, 18, 70, 18, 66, 8, 62, 8], '#4ac8a0', OL, 1.4);
  },
  flora(g, R) {
    _cpGlow(g, R, R, 70, '255,90,150', 0.4);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2; g.save(); g.translate(64, 64); g.rotate(a); _cpPoly(g, [-12, 0, -22, -42, 0, -58, 22, -42, 12, 0], i % 2 ? '#e0488a' : '#ff6aa8', OL, 2.4); g.fillStyle = 'rgba(255,200,220,0.4)'; g.beginPath(); g.moveTo(0, -10); g.lineTo(-8, -40); g.lineTo(0, -52); g.fill(); g.restore(); }
    g.beginPath(); g.arc(64, 64, 32, 0, TAU); g.fillStyle = OL; g.fill(); g.beginPath(); g.arc(64, 64, 29, 0, TAU); g.fillStyle = '#3a0a1a'; g.fill();
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.save(); g.translate(64, 64); g.rotate(a); _cpPoly(g, [-4, -29, 0, -15, 4, -29], '#fff4e8', OL, 1); g.restore(); }
    g.fillStyle = '#8a1a40'; g.beginPath(); g.ellipse(64, 64, 18, 22, 0, 0, TAU); g.fill();
    for (const [x, y] of [[52, 52], [76, 52]]) _cpEye(g, x, y, 4.6, 5.6, '#ffe040');
    g.fillStyle = '#ff9ac0'; g.beginPath(); g.ellipse(64, 80, 8, 4, 0, 0, TAU); g.fill();
  },
  zero(g, R) {
    _cpGlow(g, R, R, 70, '110,230,255', 0.5);
    g.beginPath(); g.ellipse(64, 64, 54, 50, 0, 0, TAU); g.fillStyle = OL; g.fill(); g.beginPath(); g.ellipse(64, 64, 50, 46, 0, 0, TAU); g.fillStyle = '#8a98b0'; g.fill();
    g.fillStyle = '#6a7890'; g.beginPath(); g.ellipse(50, 70, 40, 38, 0, 0, TAU); g.fill(); g.fillStyle = '#c8d4e8'; g.beginPath(); g.ellipse(62, 42, 30, 9, -0.2, 0, TAU); g.fill();
    g.beginPath(); g.arc(64, 64, 26, 0, TAU); g.fillStyle = OL; g.fill(); g.beginPath(); g.arc(64, 64, 22, 0, TAU); g.fillStyle = '#082838'; g.fill();
    _cpGlow(g, 64, 64, 32, '90,240,255', 0.9); g.fillStyle = '#7af0ff'; g.beginPath(); g.arc(64, 64, 12, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(60, 60, 4, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(122,240,255,0.7)'; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.moveTo(64 + Math.cos(a) * 18, 64 + Math.sin(a) * 18); g.lineTo(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34); } g.stroke();
    for (const [x, y] of [[20, 60], [108, 60], [64, 12], [64, 116]]) { g.fillStyle = '#4a5870'; g.fillRect(x - 5, y - 5, 10, 10); g.strokeStyle = OL; g.lineWidth = 1.4; g.strokeRect(x - 5, y - 5, 10, 10); }
  },
  mroa(g, R) {
    _cpGlow(g, R, R, 70, '60,200,230', 0.4);
    _cpPoly(g, [4, 128, 10, 80, 34, 52, 96, 52, 120, 80, 124, 128], '#0a3a4a', OL, 2.4);
    g.beginPath(); g.ellipse(64, 80, 56, 40, 0, 0, TAU); g.fillStyle = '#126a80'; g.fill(); g.strokeStyle = OL; g.lineWidth = 2.6; g.stroke();
    g.fillStyle = '#0a4a5e'; g.beginPath(); g.ellipse(52, 90, 40, 28, 0, 0, TAU); g.fill();
    g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 42); g.quadraticCurveTo(64, 12, 90, 12); g.stroke(); g.strokeStyle = '#2a8aa0'; g.lineWidth = 1.6; g.stroke();
    _cpGlow(g, 90, 14, 26, '160,255,240', 0.9); g.fillStyle = '#d8fff8'; g.beginPath(); g.arc(90, 14, 5, 0, TAU); g.fill();
    for (const [x, y, r] of [[40, 70, 9], [88, 70, 9]]) { _cpEye(g, x, y, r, r, '#ffe060'); g.fillStyle = '#100808'; g.fillRect(x - 1, y - r, 2, r * 2); }
    g.fillStyle = '#100808'; g.beginPath(); g.moveTo(20, 92); g.quadraticCurveTo(64, 120, 108, 92); g.lineTo(100, 108); g.quadraticCurveTo(64, 126, 28, 108); g.fill();
    for (let i = 0; i < 9; i++) { const x = 28 + i * 9.5; _cpPoly(g, [x, 98 + Math.sin(i) * 2, x + 4, 98 + Math.sin(i) * 2, x + 2, 112 - (i % 2) * 4], '#e8fcff', OL, 0.8); }
  },
  aurel(g, R) {
    _cpGlow(g, R, 50, 78, '255,240,160', 0.7);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { g.save(); g.translate(64 + s * 18, 84); g.rotate(s * (0.5 + i * 0.28)); _cpPoly(g, [0, 0, 8, -48 + i * 4, -2, -54 + i * 4, -10, -30], i % 2 ? '#fff4c0' : '#ffe890', OL, 1.8); g.restore(); }
    g.beginPath(); g.ellipse(64, 16, 34, 9, 0, 0, TAU); g.strokeStyle = OL; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#fff2a0'; g.lineWidth = 3.6; g.stroke(); _cpGlow(g, 64, 16, 40, '255,240,140', 0.7);
    _cpPoly(g, [24, 128, 30, 88, 50, 74, 78, 74, 98, 88, 104, 128], '#e8d8a0', OL, 2.4);
    _cpPoly(g, [40, 80, 40, 40, 52, 26, 76, 26, 88, 40, 88, 80, 76, 98, 52, 98], '#f6eec0', OL, 2.6);
    g.fillStyle = '#d8c888'; g.beginPath(); g.moveTo(40, 80); g.lineTo(40, 40); g.lineTo(52, 26); g.lineTo(52, 98); g.fill();
    g.fillStyle = '#fffbe0'; g.fillRect(60, 28, 8, 54); g.fillStyle = '#ffe070'; g.fillRect(46, 52, 36, 7);
    _cpGlow(g, 64, 56, 22, '255,250,200', 0.9); g.fillStyle = '#fff'; g.fillRect(52, 54, 24, 3);
    olPoly2(g, [58, 100, 70, 100, 64, 116], '#f0d878');
  },
  voltar(g, R) {
    _cpGlow(g, R, R, 76, '140,160,255', 0.5);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.38; g.fillStyle = i % 2 ? '#5a6a90' : '#7a8ab0'; g.beginPath(); g.arc(64 + Math.cos(a) * 44, 40 + Math.sin(a) * 30, 20 - Math.abs(i - 3), 0, TAU); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); }
    _cpPoly(g, [10, 128, 18, 90, 46, 74, 84, 74, 110, 90, 118, 128], '#3a4670', OL, 2.4);
    _cpPoly(g, [36, 42, 64, 32, 92, 42, 90, 80, 78, 112, 50, 112, 38, 80], '#9aa8c8', OL, 2.6); g.fillStyle = '#7886a8'; g.beginPath(); g.moveTo(36, 42); g.lineTo(52, 46); g.lineTo(50, 112); g.lineTo(38, 80); g.fill();
    for (const x of [52, 76]) { g.fillStyle = '#10142a'; g.fillRect(x - 8, 56, 16, 8); _cpGlow(g, x, 60, 15, '190,220,255', 0.9); g.fillStyle = '#f0f8ff'; g.fillRect(x - 5, 58, 10, 4); }
    g.strokeStyle = OL; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(48, 84); g.lineTo(60, 100); g.lineTo(54, 104); g.lineTo(66, 124); g.moveTo(80, 84); g.lineTo(68, 100); g.lineTo(74, 104); g.lineTo(62, 124); g.stroke();
    g.strokeStyle = '#d8eaff'; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1.4; g.stroke(); _cpGlow(g, 64, 106, 30, '170,200,255', 0.6);
  },
  azmor(g, R) {
    _cpGlow(g, R, R, 76, '190,70,255', 0.55);
    g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.fillStyle = '#0a0414'; g.fill(); g.strokeStyle = OL; g.lineWidth = 2.4; g.stroke();
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + ring * 0.17, r0 = 54 - ring * 18; g.save(); g.translate(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0); g.rotate(a + Math.PI / 2); _cpPoly(g, [-4, 0, 0, -(12 - ring * 3), 4, 0], ring ? '#cfa8ff' : '#f4ecff', OL, 1); g.restore(); }
    const gg = g.createRadialGradient(64, 64, 2, 64, 64, 30); gg.addColorStop(0, '#fff'); gg.addColorStop(0.3, '#d090ff'); gg.addColorStop(1, '#10041c'); g.fillStyle = gg; g.beginPath(); g.arc(64, 64, 30, 0, TAU); g.fill();
    _cpGlow(g, 64, 64, 40, '220,120,255', 0.8);
    for (const [x, y, r] of [[50, 28, 6], [78, 28, 6], [64, 18, 4]]) _cpEye(g, x, y, r, r * 0.8, '#ff6af0');
  },
  null(g, R) {
    for (let i = 0; i < 8; i++) { const h = (i * 45 + 280) % 360, c = hslRgb(h, 0.9, 0.55); g.strokeStyle = `rgba(${c},0.8)`; g.lineWidth = 5 - i * 0.4; g.beginPath(); for (let a = 0; a < 10; a += 0.2) { const r = 4 + a * (5.4 - i * 0.2), x = 64 + Math.cos(a + i * 0.8) * r, y = 64 + Math.sin(a + i * 0.8) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    const gg = g.createRadialGradient(64, 64, 2, 64, 64, 22); gg.addColorStop(0, '#000'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.beginPath(); g.arc(64, 64, 22, 0, TAU); g.fill();
    _cpGlow(g, 64, 64, 60, '255,120,240', 0.4);
    _cpEye(g, 64, 64, 8, 10, '#fff');
  },
  shadow(g, R) {
    _cpGlow(g, R, R, 70, '150,150,200', 0.3);
    _cpPoly(g, [14, 128, 20, 84, 46, 66, 82, 66, 108, 84, 114, 128], '#0a0a12', OL, 2.4);
    g.fillStyle = '#0a0a12'; g.beginPath(); g.ellipse(64, 52, 26, 30, 0, 0, TAU); g.fill(); g.strokeStyle = OL; g.lineWidth = 2.4; g.stroke();
    _cpPoly(g, [38, 40, 30, 24, 46, 28, 52, 12, 62, 24, 74, 8, 80, 26, 96, 20, 90, 40], '#0a0a12', OL, 2);
    g.fillStyle = '#e8e8ff'; for (const x of [56, 76]) { g.beginPath(); g.moveTo(x - 7, 52); g.lineTo(x + 6, 50); g.lineTo(x + 4, 58); g.lineTo(x - 6, 57); g.fill(); _cpGlow(g, x, 54, 10, '200,200,255', 0.6); }
    g.strokeStyle = 'rgba(160,160,220,0.35)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(20 + i * 22, 128); g.quadraticCurveTo(14 + i * 22, 100, 24 + i * 22, 84); } g.stroke();
  },
  nameless(g, R) {
    _cpGlow(g, R, R, 78, '255,240,190', 0.6);
    _cpPoly(g, [8, 128, 16, 82, 44, 62, 84, 62, 112, 82, 120, 128], '#d8c890', OL, 2.4); g.fillStyle = '#b8a870'; g.beginPath(); g.moveTo(8, 128); g.lineTo(16, 82); g.lineTo(44, 62); g.lineTo(56, 128); g.fill();
    _cpPoly(g, [42, 62, 44, 36, 64, 28, 84, 36, 86, 62, 78, 98, 50, 98], '#f8f0d0', OL, 2.4); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(70, 56, 10, 20, 0.1, 0, TAU); g.fill();
    _cpPoly(g, [36, 40, 42, 14, 54, 26, 64, 4, 74, 26, 86, 14, 92, 40], '#f2cc58', OL, 2.4); for (const [x, y] of [[54, 24], [64, 14], [74, 24]]) circleOl(g, x, y + 8, 2.6, '#60d0ff', OL, 1);
    g.strokeStyle = 'rgba(200,180,120,0.8)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(52, 62); g.quadraticCurveTo(58, 70, 52, 80); g.moveTo(76, 62); g.quadraticCurveTo(70, 70, 76, 80); g.stroke();
  },
  voice(g, R) {
    _cpGlow(g, R, R, 70, '190,190,230', 0.35);
    _cpPoly(g, [10, 128, 18, 80, 44, 56, 84, 56, 110, 80, 118, 128], '#1c1c2a', OL, 2.4);
    g.fillStyle = '#10101a'; g.beginPath(); g.ellipse(64, 52, 28, 32, 0, 0, TAU); g.fill(); g.strokeStyle = OL; g.lineWidth = 2.4; g.stroke();
    g.fillStyle = '#d8d8f0'; g.font = `700 40px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 64, 54); _cpGlow(g, 64, 54, 26, '200,200,255', 0.5);
  },
};
function olPoly2(g, pts, fill) { _cpPoly(g, pts, fill, OL, 1.4); }
MON_BUST.boss = MON_BUST.voice;

// ---------- 초상화 그리기 ----------
Por.make = function (who, face) {
  const S = 2, R = 64, c = makeCanvas(R * 2 * S, R * 2 * S), g = c.getContext('2d');
  g.scale(S, S);
  const C = CAST[who] || CAST.voice, col = C.col;
  g.save(); g.beginPath(); g.arc(R, R, R - 2, 0, TAU); g.clip();
  const bg = g.createRadialGradient(R, R * 0.6, 4, R, R, R * 1.25);
  bg.addColorStop(0, mixHex(col, '#ffffff', 0.28)); bg.addColorStop(0.5, mixHex(col, '#101422', 0.55)); bg.addColorStop(1, '#05070c');
  g.fillStyle = bg; g.fillRect(0, 0, R * 2, R * 2);
  g.globalAlpha = 0.16; g.fillStyle = '#fff'; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(R, R * 0.5); const a = i / 9 * TAU; g.lineTo(R + Math.cos(a - 0.08) * 160, R * 0.5 + Math.sin(a - 0.08) * 160); g.lineTo(R + Math.cos(a + 0.08) * 160, R * 0.5 + Math.sin(a + 0.08) * 160); g.fill(); } g.globalAlpha = 1;
  try {
    if (who === 'hero') bustHero(g, R, face);
    else if (who === 'lien') { _cpGlow(g, R, R, 60, '150,240,255', 0.5); Lien.drawBody(g, R, R + 6, 2.8, 0, face === 'worry' || face === 'sad' ? 0.6 : 1); }
    else if (NPC_DEFS[who]) bustNpc(g, NPC_DEFS[who], face, R);
    else if (MON_BUST[who]) MON_BUST[who](g, R, col);
    else MON_BUST.voice(g, R, col);
  } catch (e) { MON_BUST.voice(g, R, col); }
  const vg = g.createRadialGradient(R, R, R * 0.55, R, R, R); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, R * 2, R * 2);
  g.restore();
  g.strokeStyle = 'rgba(255,230,170,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(R, R, R - 2, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1.4; g.beginPath(); g.arc(R, R, R - 5, 0, TAU); g.stroke();
  return c;
};
// 'young' 은 어린 주인공 (NPC 도감)
