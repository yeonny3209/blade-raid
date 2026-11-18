'use strict';
// ============================================================
//  등장인물 : 사람마다 얼굴 · 머리 · 체형 · 옷이 다른 「인물 도감」
//   NPC_DEFS[id]  — 인물의 생김새 값 (머리 모양 · 수염 · 눈 · 옷 종류 · 색 · 소품)
//   drawNpcHead   — 얼굴 · 머리 · 모자 (월드에서도, 초상화에서도 같은 그림을 쓴다)
//   drawNpc       — 몸 전체 (주인공의 뼈대에 얹는 새 옷)
//   Actor(dialog.js)가 NPC_DEFS 에 있는 인물을 만들면 body.npc 에 값을 달고, 아래에서 RIG_PLAYER.draw 를 가로채 그린다
// ============================================================
const _tone = c => [blMix(c, '#000008', 0.46), c, blMix(c, '#ffffff', 0.34)];
const _t = c => (typeof c === 'string' ? _tone(c) : c);

// ---------- 인물 도감 ----------
//  hair : [모양, 색]  beard : none / stubble / full / mustache / goatee / long   outfit : 옷 종류
//  eye : [모양, 홍채색]  head : 머리쓰개  acc : 소품(들)   build : 체형(폭, 길이)
const NPC_DEFS = {
  seric: { skin: '#d9a98a', hair: ['short', '#3a2a22'], beard: 'stubble', eye: ['sharp', '#5a8aa8'], brow: 2.2, scar: 1, jaw: 1, outfit: 'armor', coat: '#2e4a5c', trim: '#c9a55c', metal: '#8a94a6', cape: '#1c2b36', tabard: '#2e4a5c', build: [1.08, 1] },
  youngseric: { skin: '#e0b496', hair: ['short', '#4a3426'], beard: 'none', eye: ['sharp', '#6a9ab0'], brow: 1.8, outfit: 'armor', coat: '#3a6a4a', trim: '#d8c070', metal: '#a8b0c0', tabard: '#3a6a4a', build: [1, 1] },
  ella: { skin: '#f0d4c0', hair: ['long', '#c8c4e8'], beard: 'none', eye: ['soft', '#9a6aff'], brow: 1.2, outfit: 'robe', coat: '#4a3a8a', trim: '#e8d078', head: 'circlet', acc: ['stars'], sleeve: 'wide', build: [0.94, 1.03], eyeLash: 1 },
  youngella: { skin: '#f4d8c4', hair: ['ponytail', '#d4c8f0'], beard: 'none', eye: ['soft', '#a07aff'], brow: 1.2, outfit: 'robe', coat: '#6a5ab0', trim: '#f0e090', sleeve: 'wide', build: [0.94, 1], eyeLash: 1 },
  orben: { skin: '#d8b8a8', hair: ['slick', '#8a8a9a'], beard: 'goatee', eye: ['sharp', '#c8384a'], brow: 2.4, jaw: 1, outfit: 'dark', coat: '#1c1a2a', trim: '#b02838', metal: '#3a3848', cape: '#2a1020', build: [1.08, 1.02] },
  knight: { skin: '#d8b8a8', hair: ['slick', '#8a8a9a'], beard: 'none', eye: ['sharp', '#ff3a3a'], outfit: 'dark', head: 'fullhelm', coat: '#14121e', trim: '#b02838', metal: '#2c2a3a', cape: '#2a1020', build: [1.1, 1.04] },
  youngorben: { skin: '#e0c0a8', hair: ['short', '#6a4a3a'], beard: 'none', eye: ['sharp', '#4a7aa8'], brow: 2, outfit: 'armor', coat: '#3a5a8a', trim: '#d0d8e8', metal: '#a8b4c8', tabard: '#3a5a8a', build: [1.02, 1] },
  volk: { noBlade: 1, skin: '#e8b890', hair: ['slick', '#5a3a1a'], beard: 'mustache', eye: ['soft', '#8a5a2a'], brow: 1.8, outfit: 'coat', coat: '#c0782c', trim: '#f0d070', head: 'wide', acc: ['pack', 'coins'], build: [1.16, 0.96], goldTooth: 1 },
  hanna: { skin: '#e0a888', hair: ['ponytail', '#8a3a22'], beard: 'none', eye: ['sharp', '#8a4a22'], brow: 2, outfit: 'smith', coat: '#a85030', trim: '#7a5a3a', head: 'goggles', acc: ['hammer', 'soot'], build: [1.1, 0.98], freckle: 1 },
  theo: { skin: '#e6c4a8', hair: ['wild', '#eeeeee'], beard: 'long', eye: ['soft', '#5a8a6a'], brow: 2.6, outfit: 'robe', coat: '#4a6a4a', trim: '#c8b878', glasses: 1, acc: ['scroll'], cane: 1, age: 2, build: [0.96, 0.97], hunch: 4, sleeve: 'wide' },
  fio: { noBlade: 1, skin: '#f0cca8', hair: ['messy', '#d8a838'], beard: 'none', eye: ['round', '#4a8ad0'], brow: 1, outfit: 'child', coat: '#e0b050', trim: '#a87030', build: [0.9, 0.95], freckle: 1 },
  granny: { skin: '#e6c8b0', hair: ['bun', '#d8d8d8'], beard: 'none', eye: ['soft', '#7a6a5a'], brow: 1, outfit: 'granny', coat: '#7a5a4a', trim: '#d8c0a0', cane: 1, age: 3, build: [1.04, 0.92], hunch: 6 },
  villager: { noBlade: 1, skin: '#dcb090', hair: ['short', '#5a4030'], beard: 'stubble', eye: ['soft', '#6a5a3a'], brow: 1.8, outfit: 'rags', coat: '#8a7a5a', trim: '#6a5a3a', head: 'strawhat', build: [1, 1] },
  young: { skin: '#f0c8a8', hair: ['spiky', '#1c1a26'], beard: 'none', eye: ['round', '#e04a3a'], brow: 1.4, outfit: 'child', coat: '#3a4a7a', trim: '#c9a55c', head: 'headband', build: [0.92, 0.96] },
  younglien: { noBlade: 1, skin: '#f6d8c0', hair: ['twin', '#f0e0a8'], beard: 'none', eye: ['round', '#4ac8e0'], brow: 1, outfit: 'child', coat: '#6ad0e0', trim: '#f0e8b0', build: [0.86, 0.94], eyeLash: 1 },
  soldier: { skin: '#d8a888', hair: ['short', '#4a3a2a'], beard: 'stubble', eye: ['sharp', '#6a6a4a'], brow: 2, outfit: 'armor', coat: '#6a6a52', trim: '#a89868', metal: '#8a8a88', head: 'helm', build: [1.04, 1] },
  scout: { skin: '#d4a888', hair: ['short', '#6a5a3a'], beard: 'none', eye: ['sharp', '#5a8a4a'], brow: 1.6, outfit: 'scout', coat: '#5a7a4a', trim: '#8a6a3a', head: 'hood', cape: '#3a5a3a', build: [0.98, 1] },
  healer: { noBlade: 1, skin: '#f0d0b8', hair: ['braid', '#6a4a30'], beard: 'none', eye: ['soft', '#5aa878'], brow: 1.2, outfit: 'robe', coat: '#e8e8e0', trim: '#5ab888', acc: ['leaf'], sleeve: 'wide', build: [0.95, 1], eyeLash: 1 },
  king: { noBlade: 1, skin: '#e0b898', hair: ['slick', '#d8d0c0'], beard: 'full', eye: ['sharp', '#6a7a9a'], brow: 2.6, outfit: 'royal', coat: '#8a2030', trim: '#f0cc60', head: 'crown', cape: '#6a1828', age: 2, build: [1.12, 1.02] },
  refugee: { noBlade: 1, skin: '#d0a888', hair: ['messy', '#4a3a2a'], beard: 'stubble', eye: ['soft', '#5a4a3a'], brow: 1.6, outfit: 'rags', coat: '#7a6a5a', trim: '#5a4a3a', head: 'hood', cape: '#5a4a3a', bandage: 1, build: [0.96, 0.98], hunch: 3 },
  desertman: { skin: '#c89a70', hair: ['bald', '#eeeeee'], beard: 'long', eye: ['soft', '#5a4a2a'], brow: 2.6, outfit: 'robe', coat: '#c8a870', trim: '#8a5a2a', head: 'turban', cane: 1, age: 3, sleeve: 'wide', build: [1, 0.97], hunch: 4 },
};
// 말풍선 · 대화창에서 같은 사람으로 취급할 별칭
NPC_DEFS.younghero = NPC_DEFS.young;

// ---------- 머리 모양 ----------
function npcHairBack(ctx, d, H, ol, ow) {
  const k = d.hair[0];
  const P = (pts, c = H[1], w = ow) => olPoly(ctx, pts, c, ol, w);
  switch (k) {
    case 'long': P([-8, -14, -18, -11, -23, 6, -22, 28, -14, 31, -12, 12, -6, 2]); ctx.fillStyle = H[0]; ctx.beginPath(); polyPath(ctx, [-12, 2, -22, 8, -21, 27, -15, 29, -12, 12]); ctx.fill(); break;
    case 'ponytail': P([-12, -12, -21, -15, -27, -4, -26, 12, -20, 19, -19, 4, -13, -2]); ctx.fillStyle = H[0]; ctx.beginPath(); polyPath(ctx, [-14, -2, -19, 4, -20, 19, -25, 12, -24, 0]); ctx.fill(); olPoly(ctx, [-12, -9, -16, -11, -16.4, -4, -12.4, -3], d.ribbon || '#c84a5a', ol, 0.8); break;
    case 'braid': P([-12, -12, -19, -10, -22, 2]); for (let i = 0; i < 6; i++) { const x = -19 - i * 0.6, y = 0 + i * 5.2; circleOl(ctx, x, y, 3.2 - i * 0.18, i % 2 ? H[0] : H[1], ol, 0.8); } olPoly(ctx, [-19.6, 30, -17, 30, -17.6, 34, -20.2, 34], d.ribbon || '#5ab888', ol, 0.7); break;
    case 'twin': P([-12, -10, -19, -8, -24, 8, -22, 20, -16, 18, -15, 4, -11, -2]); P([-9, -12, -14, -16, -20, -12, -17, -6]); break;
    case 'bun': P([-12, -6, -16, 0, -13, 8, -8, 6]); break;
    case 'wild': P([-1, -15.5, -8.5, -20, -9, -14, -19, -18.5, -14.5, -9.5, -25, -9, -17, -3.5, -24.5, 3.5, -15, 3.5, -19, 10, -10, 7, -8, 13, -1.5, 7.5]); break;
    case 'spiky': P([-1, -15.5, -8.5, -18.5, -8, -13.5, -17.5, -16.5, -13.5, -9.5, -23, -8, -15.5, -3.5, -22.5, 2.5, -14, 2.5, -17, 9, -9.5, 6.5, -8, 12.5, -1.5, 7.5]); break;
    case 'messy': P([-11, -12, -18, -13, -21, -4, -17, 0, -19, 6, -11, 4, -8, 9, -4, 3]); break;
    case 'bald': if (d.hairBack !== 0) P([-11, -2, -14, 3, -12, 9, -7, 8, -7, 0]); break;
    case 'slick': P([-12, -6, -16, -2, -15, 8, -9, 8, -8, 0]); break;
    default: P([-12, -8, -15, -1, -12, 8, -7, 7, -6, -1]);
  }
}
function npcHairFront(ctx, d, H, ol, ow, detail) {
  const k = d.hair[0], P = (pts, c = H[1], w = ow) => olPoly(ctx, pts, c, ol, w);
  const hl = pts => { if (detail) { ctx.fillStyle = H[2]; ctx.beginPath(); polyPath(ctx, pts); ctx.fill(); } };
  switch (k) {
    case 'bald': olPoly(ctx, [-9, -7.4, -4, -12, 0, -13, -3, -8.4], H[1], ol, 0.6); break;
    case 'slick': P([-13.4, 0.5, -13.6, -9.5, -8, -15.8, 0, -17.8, 8, -16, 12.6, -10.6, 14, -7, 7.6, -9.6, 1, -10.4, -5, -6, -8.6, 3.6]); hl([-9, -12.6, -2, -16.4, 6, -15, -1, -12.8]); break;
    case 'long': P([-13.4, 0.5, -13.6, -9.5, -8, -15.6, 0, -17.6, 8, -15.6, 13.4, -10.8, 14.6, -6, 9, -8, 3, -6.4, -3.6, -4, -6, 4, -7, 20, -3, 21, -3.4, 4.4, -9.6, -1.8]); hl([-8.4, -12.6, -2, -15.6, 5, -14.6, -1, -12.6]); break;
    case 'bun': P([-13.4, 0.5, -13.6, -9.5, -8, -15.6, 0, -17.6, 8, -15.6, 13.4, -10.8, 13, -7, 6, -8.4, -2, -8, -6, 0, -8, 4.6, -9.6, -1.8]); circleOl(ctx, -4, -19.6, 6.6, H[1], ol, ow); if (detail) { ctx.strokeStyle = H[2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(-4, -19.6, 3.6, 3.6, 5.6); ctx.stroke(); } break;
    case 'ponytail': case 'braid': P([-13.4, 0.5, -13.6, -9.5, -8, -15.6, 0, -17.6, 8, -15.6, 13.4, -10.8, 14.4, -6, 7, -9, 1, -7.6, -3.6, -3.4, -7, 3.6, -9.6, -1.8]); hl([-8.4, -12.6, -2, -15.6, 5, -14.6, -1, -12.6]); break;
    case 'twin': P([-13.4, 0.5, -13.6, -9.5, -8, -15.8, 0, -17.8, 8, -16, 13.4, -10.8, 14.8, -4, 8, -8.2, 3, -4.8, -2, -8, -6, -2, -8, 4, -9.6, -1.8]); hl([-8, -12.6, -1, -16, 6, -14.6]); olPoly(ctx, [-9, -13.4, -12.6, -15.6, -12.4, -10.4, -8.8, -9.4], d.ribbon || '#6ad0e0', ol, 0.8); break;
    case 'wild': P([-13, 0, -14, -10, -9, -17, -2, -20, 6, -18, 12, -13, 15, -7, 9, -9.6, 3, -8, -3, -5, -7, 3, -9.6, -1.8]); hl([-9, -14, -2, -18, 6, -16, 0, -13]); break;
    case 'spiky': P([-13.4, 0.5, -13.6, -9.5, -8, -15.6, 0, -17.6, 8, -15.6, 13.4, -10.8, 15.2, -7, 6, -7.4, -2, -7.6, -5.2, -2.6, -7.6, 3.6, -9.6, -2.6]); P([-1.6, -10.8, 5.6, -10.4, 4.4, -3.6, 2.6, -6.8, 1.2, -1.6, -0.6, -6.2, -3.4, -2.4], H[1], 1); hl([-9, -11.6, -2, -15.6, 6, -14.6, 0, -12.4]); break;
    case 'messy': P([-13.4, 0.5, -14, -9.5, -9, -16, -3, -15, 0, -19, 5, -15.4, 10, -17, 13.4, -10.8, 14.6, -6, 9, -7.4, 6, -10.4, 3, -6.4, -1, -9, -5, -4, -8, 3, -9.6, -1.8]); hl([-9, -12.6, -2, -16, 6, -15, 0, -12.8]); break;
    default: P([-13.4, 0.5, -13.6, -9.5, -8, -15.6, 0, -17.6, 8, -15.6, 13.4, -10.8, 14.4, -6, 8, -8.4, 2, -8, -4, -3, -7.6, 3.6, -9.6, -1.8]); hl([-8.4, -12.6, -2, -15.8, 6, -14.6, -1, -12.8]);
  }
}

// ---------- 머리쓰개 ----------
function npcHeadgear(ctx, d, P, ol, ow, detail, t) {
  const h = d.head; if (!h) return;
  const M = P.metal || _tone('#8a94a6'), C = P.coat, T = P.trim;
  switch (h) {
    case 'helm':                                     // 열린 투구 : 둥근 정수리 + 볼 가리개 + 콧등 막이
      olPoly(ctx, [-14.4, 3, -15, -9, -9, -16, 0, -18.4, 9, -16.4, 14.6, -9.6, 15, -6, 6, -7, -2, -8, -7, -2, -9, 8, -14, 8], M[1], ol, ow);
      ctx.fillStyle = M[2]; ctx.beginPath(); polyPath(ctx, [-9, -14, -2, -17.4, 7, -16, 0, -13]); ctx.fill();
      ctx.fillStyle = M[0]; ctx.beginPath(); polyPath(ctx, [-14.4, 3, -14, 8, -9, 8, -9, -2]); ctx.fill();
      olPoly(ctx, [11, -8, 13.4, -7.6, 13.2, 1.6, 12, 3.4, 10.6, 0], M[1], ol, 0.9);
      if (detail) { ctx.fillStyle = T[1]; ctx.fillRect(-14.6, -8.4, 29.6, 1.6); }
      break;
    case 'fullhelm': {                               // 검은 기사의 투구 : 얼굴을 모두 덮고 붉은 눈구멍만 남는다
      olPoly(ctx, [-15, 8, -16, -8, -10, -17, 0, -20, 9, -17, 15, -9, 16.4, 2, 14, 12, 4, 15, -8, 14], M[1], ol, ow);
      ctx.fillStyle = M[0]; ctx.beginPath(); polyPath(ctx, [-15, 8, -16, -8, -10, -17, -6, -14, -8, 4, -8, 14]); ctx.fill();
      ctx.fillStyle = M[2]; ctx.beginPath(); polyPath(ctx, [-8, -17, 0, -19.6, 8, -17, 0, -14.6]); ctx.fill();
      olPoly(ctx, [2, -5, 15, -4, 15.4, 0.6, 3, 1.4], '#07060c', ol, 0.8);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,50,40,${0.8 + Math.sin(t * 0.08) * 0.15})`; ctx.fillRect(5, -3.4, 8, 2.4); drawGlow(ctx, 9, -2, 10, '255,40,30', 0.5); ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = ol; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(4, 3); ctx.lineTo(14, 5); ctx.moveTo(4, 6); ctx.lineTo(13, 8); ctx.moveTo(4, 9); ctx.lineTo(11, 11); ctx.stroke();
      olPoly(ctx, [-4, -19, 0, -29, 4, -19], T[1], ol, 0.9);                                           // 투구 장식 뿔
      break;
    }
    case 'hood':
      olPoly(ctx, [-16, 8, -17, -8, -10, -17, 0, -20, 9, -16, 14, -9, 15, -4, 6, -8, -2, -8.4, -8, -2, -9, 10], C[1], ol, ow);
      ctx.fillStyle = C[0]; ctx.beginPath(); polyPath(ctx, [-16, 8, -17, -8, -10, -17, -6, -12, -9, 0, -9, 10]); ctx.fill();
      ctx.fillStyle = C[2]; ctx.beginPath(); polyPath(ctx, [-6, -16.4, 0, -19.2, 8, -15.6, 1, -13.6]); ctx.fill();
      break;
    case 'turban':
      olPoly(ctx, [-15, 0, -16, -10, -10, -17, 0, -20, 10, -17, 15, -10, 14.4, -5, -2, -7.4, -9, -3], '#efe6d2', ol, ow);
      ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, -12, 13, -7); ctx.moveTo(-13, -10); ctx.quadraticCurveTo(0, -17, 12, -12); ctx.stroke();
      olPoly(ctx, [-12, -4, -16, -6, -19, 6, -15, 5], '#e4d8c0', ol, 0.8);
      circleOl(ctx, 6, -11, 1.6, T[1], ol, 0.6);
      break;
    case 'crown':
      olPoly(ctx, [-11, -12, -10, -21, -6, -16, -2, -23, 2, -16, 6, -23, 10, -16, 13, -20, 13.4, -12], T[1], ol, ow);
      ctx.fillStyle = T[2]; ctx.beginPath(); polyPath(ctx, [-10, -13, -9.4, -19, -6.6, -15.4, -6, -13]); ctx.fill();
      for (const x of [-6, 0, 6, 11]) circleOl(ctx, x, -14, 1.5, '#d02848', ol, 0.5);
      break;
    case 'wide':                                     // 챙 넓은 모자 + 깃털
      olPoly(ctx, [-22, -8, -14, -11, 0, -12.6, 14, -11, 24, -8, 20, -4, 0, -7, -20, -4], C[1], ol, ow);
      olPoly(ctx, [-9, -10, -8, -20, 0, -22, 8, -20, 9, -10], C[1], ol, ow);
      ctx.fillStyle = C[0]; ctx.beginPath(); polyPath(ctx, [-22, -8, -20, -4, 0, -7, 0, -9]); ctx.fill();
      olPoly(ctx, [-8.4, -12, 8.6, -12, 8.4, -9.4, -8.4, -9.4], T[1], ol, 0.7);
      olPoly(ctx, [7, -13, 14, -22, 22, -26, 17, -16, 10, -11], '#d8483a', ol, 0.8);
      break;
    case 'strawhat':
      olPoly(ctx, [-24, -6, -14, -11, 0, -13, 14, -11, 24, -6, 18, -3, 0, -6, -18, -3], '#d8c070', ol, ow);
      olPoly(ctx, [-9, -10, -8, -19, 0, -20.6, 8, -19, 9, -10], '#e6d488', ol, ow);
      ctx.strokeStyle = '#b8a050'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let i = -20; i < 22; i += 4) { ctx.moveTo(i, -9); ctx.lineTo(i + 1, -5); } ctx.stroke();
      olPoly(ctx, [-8.6, -12.4, 8.6, -12.4, 8.4, -10.4, -8.4, -10.4], '#a8483a', ol, 0.6);
      break;
    case 'goggles':
      olPoly(ctx, [-14.2, -9.6, 13.6, -8.2, 13.4, -3.6, -14.2, -4.6], '#7a2e2a', ol, 1.1);    // 두건
      olPoly(ctx, [-13.2, -9.4, -18, -12, -17, -6, -19.4, -2.6, -13.4, -4.6], '#7a2e2a', ol, 0.9);
      circleOl(ctx, 3, -11.6, 4.2, '#4a4a52', ol, 0.8); circleOl(ctx, 3, -11.6, 2.8, '#8ad0e0', ol, 0.5); ctx.fillStyle = '#fff'; ctx.fillRect(1.6, -13, 1.4, 1.4);
      circleOl(ctx, -6, -11.6, 4.2, '#4a4a52', ol, 0.8); circleOl(ctx, -6, -11.6, 2.8, '#8ad0e0', ol, 0.5);
      break;
    case 'circlet':
      ctx.strokeStyle = ol; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-13, -8); ctx.quadraticCurveTo(0, -13, 13, -8.6); ctx.stroke();
      ctx.strokeStyle = T[1]; ctx.lineWidth = 1.8; ctx.stroke();
      olPoly(ctx, [4, -11.4, 6.6, -9, 4, -6.6, 1.4, -9], '#9a6aff', ol, 0.8); ctx.fillStyle = '#fff'; ctx.fillRect(3.4, -10, 1.2, 1.2);
      break;
    case 'headband':
      olPoly(ctx, [-14.2, -9.6, 13.6, -8.2, 13.4, -3.6, -14.2, -4.6], '#c42a28', ol, 1.1);
      olPoly(ctx, [-13.2, -9.4, -18, -11.6, -17.2, -6.6, -19, -3.4, -13.4, -4.6], '#c42a28', ol, 0.9);
      break;
  }
}

// ---------- 얼굴 · 머리 ----------
//  face : 표정 (smile · worry · shock · angry · sad · base)  — 월드에서는 base
function drawNpcHead(ctx, d, P, ol, ow, opt = {}) {
  const face = opt.face || 'base', detail = opt.detail !== false, t = opt.t || 0;
  const S = _t(d.skin), H = _t(d.hair[1]), hidden = d.head === 'fullhelm';
  npcHairBack(ctx, d, H, ol, ow);
  if (d.head === 'hood' || d.head === 'turban') npcHeadgear(ctx, { head: d.head === 'hood' ? 'hood' : null }, P, ol, ow, detail, t);
  // 얼굴 윤곽 (턱 : jaw 1 = 각진 턱, age = 갸름하고 주름진)
  const jaw = d.jaw || 0;
  olSmooth(ctx, [-10.5, -6, -6, -11.8, 1, -13, 8.5, -10.6, 12.2, -5.4, 12.6, -0.6, 13.9, 2.6, 12.3, 4.6, 12.1 + jaw * 0.6, 7.6, 9.6 + jaw * 1.2, 11.6 + jaw * 0.6, 3.4, 12.7 + jaw * 0.6, -2.6, 9.6, -7.6, 3.6], S[1], ol, ow, 0.8);
  if (detail) {
    ctx.fillStyle = S[0]; ctx.beginPath(); smoothPoly(ctx, [-10.5, -6, -4, -2, -0.6, 4.6, 3, 9.2, 8.6, 11.8, 3.4, 12.7, -2.6, 9.6, -7.6, 3.6], 0.8); ctx.fill();
    ctx.fillStyle = S[2]; ctx.beginPath(); ctx.ellipse(9.2, 4.8, 2.3, 1.3, -0.2, 0, TAU); ctx.fill();
    if (face === 'smile' || d.eye[0] === 'round') { ctx.fillStyle = 'rgba(255,120,110,0.35)'; ctx.beginPath(); ctx.ellipse(7.6, 5.6, 2.6, 1.6, 0, 0, TAU); ctx.fill(); }
  }
  // 귀
  ctx.beginPath(); ctx.ellipse(-2.6, 2.2, 3.2, 4.2, 0.1, 0, TAU); ctx.fillStyle = ol; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-2.6, 2.2, 2.2, 3.2, 0.1, 0, TAU); ctx.fillStyle = S[1]; ctx.fill();
  if (detail) { ctx.strokeStyle = S[0]; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(-2.4, 2.4, 1.5, 1.2, 4.4); ctx.stroke(); }
  if (!hidden) {
    // 눈
    const [shape, iris] = d.eye, sh = face === 'shock' ? 1.25 : face === 'smile' ? 0.45 : face === 'sad' || face === 'worry' ? 0.9 : 1;
    if (face === 'smile') {                                                     // 웃는 눈 : 아래로 볼록한 호
      ctx.strokeStyle = ol; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4.8, 2); ctx.quadraticCurveTo(8.4, -2.4, 12, 1.4); ctx.stroke();
    } else if (shape === 'round') {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(8.4, 1.4, 3.6, 4 * sh, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = ol; ctx.lineWidth = 1; ctx.stroke();
      const ig = ctx.createRadialGradient(8.8, 0.6, 0.4, 8.8, 1.6, 3.2); ig.addColorStop(0, blMix(iris, '#ffffff', 0.5)); ig.addColorStop(0.6, iris); ig.addColorStop(1, blMix(iris, '#000010', 0.5));
      ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(9, 1.8, 2.5, 3 * sh, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#12101a'; ctx.beginPath(); ctx.ellipse(9.2, 1.9, 1.2, 1.6 * sh, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(8, 0.4, 1.1, 0, TAU); ctx.arc(10, 3.4, 0.55, 0, TAU); ctx.fill();
    } else {
      const y0 = shape === 'soft' ? 0.4 : 0;
      ctx.fillStyle = '#f6f0ee'; ctx.beginPath(); polyPath(ctx, shape === 'soft' ? [4.2, 0.8, 7.2, -1.2, 11.7, -0.6, 11.2, 3.8, 5.4, 4.2] : [4, 0, 7.4, -2, 11.7, -1.4, 11.1, 3.5, 5.2, 3.8]); ctx.fill();
      const ig = ctx.createRadialGradient(8.2, 0.2 + y0, 0.3, 8.5, 1 + y0, 3); ig.addColorStop(0, blMix(iris, '#ffffff', 0.55)); ig.addColorStop(0.55, iris); ig.addColorStop(1, blMix(iris, '#000010', 0.55));
      ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(8.5, 1 + y0, 2.3, 2.7 * sh, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#12101a'; ctx.beginPath(); ctx.ellipse(8.7, 1.1 + y0, 1.1, 1.5 * sh, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7.6, -0.1 + y0, 0.8, 0, TAU); ctx.fill();
      ctx.strokeStyle = ol; ctx.lineCap = 'round'; ctx.lineWidth = d.eyeLash ? 1.9 : 1.5; ctx.beginPath(); ctx.moveTo(3.4, 0.6 + y0); ctx.quadraticCurveTo(7.4, -3 + y0, 12.2, -1.6 + y0); ctx.stroke();
      ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(5.6, 4); ctx.lineTo(10.8, 3.7); ctx.stroke();
      if (d.eyeLash) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(12, -1.4); ctx.lineTo(13.6, -2.6); ctx.moveTo(11.6, -0.4); ctx.lineTo(13.4, -0.6); ctx.stroke(); }
    }
    // 눈썹
    const ba = { angry: [0.55, 1.2], worry: [-0.5, -0.4], sad: [-0.5, 0], shock: [-0.3, -1.8], smile: [0.05, -0.6] }[face] || [0.12, 0];
    const bw = d.brow || 1.6, by = (shape === 'round' ? -6.6 : -5) + (ba[1] || 0);
    ctx.strokeStyle = blMix(d.hair[1], '#000000', 0.25); ctx.lineWidth = bw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(3.2, by + 0.4 - ba[0] * 3); ctx.lineTo(12, by + 1.5 + ba[0] * 3); ctx.stroke();
    // 코 · 입
    ctx.strokeStyle = S[0]; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(12.4, 2.4); ctx.quadraticCurveTo(13.8, 4, 12.2, 4.9); ctx.stroke();
    ctx.strokeStyle = ol; ctx.lineWidth = 0.9; ctx.lineCap = 'round'; ctx.beginPath();
    if (face === 'smile') { ctx.moveTo(8, 8.4); ctx.quadraticCurveTo(10.4, 11.2, 12.6, 7.8); }
    else if (face === 'shock') { ctx.ellipse(10.6, 9, 1.4, 1.9, 0, 0, TAU); }
    else if (face === 'sad' || face === 'worry') { ctx.moveTo(8.4, 9.6); ctx.quadraticCurveTo(10.6, 7.6, 12.6, 9.2); }
    else if (face === 'angry') { ctx.moveTo(8.4, 9.2); ctx.lineTo(12.6, 8.2); }
    else { ctx.moveTo(9.4, 8.4); ctx.lineTo(11.9, 8); }
    ctx.stroke();
    if (d.goldTooth && face !== 'shock') { ctx.fillStyle = '#f2d060'; ctx.fillRect(10.8, 8.6, 1.2, 1.2); }
    if (d.freckle) { ctx.fillStyle = 'rgba(150,80,40,0.55)'; for (const [x, y] of [[8, 6], [10, 6.8], [6.8, 7.4], [11.4, 5.6]]) ctx.fillRect(x, y, 0.8, 0.8); }
    if (d.scar) { ctx.strokeStyle = 'rgba(160,50,50,0.8)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(6.4, -3.2); ctx.lineTo(10.6, 6.4); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,215,0.5)'; ctx.lineWidth = 0.4; ctx.stroke(); }
    if (d.age) { ctx.strokeStyle = S[0]; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(4.4, 5.2); ctx.quadraticCurveTo(7, 7.4, 6.8, 9.4); ctx.moveTo(12, -2.8); ctx.lineTo(14, -3.2); ctx.moveTo(12.2, -1.8); ctx.lineTo(14.4, -2); if (d.age > 1) { ctx.moveTo(3, -3); ctx.lineTo(8.6, -4.4); } ctx.stroke(); }
    if (face === 'worry' || face === 'sad') { ctx.fillStyle = 'rgba(120,200,255,0.7)'; ctx.beginPath(); ctx.ellipse(11.8, 5.4, 0.7, 1.3, 0, 0, TAU); ctx.fill(); }
  }
  // 수염
  const bd = d.beard, BH = d.beardCol ? _t(d.beardCol) : H;
  if (bd && bd !== 'none' && !hidden) {
    if (bd === 'stubble') { ctx.fillStyle = 'rgba(40,30,24,0.28)'; ctx.beginPath(); smoothPoly(ctx, [3, 6.6, 9.6, 7.6, 12.2, 5, 12.1, 7.6, 9.6, 11.6, 3.4, 12.7, -2.6, 9.6, -2, 5], 0.8); ctx.fill(); }
    else if (bd === 'mustache') { olPoly(ctx, [7.6, 6.4, 13.8, 5.2, 14.6, 7.8, 10.4, 7.4], BH[1], ol, 0.8); }
    else if (bd === 'goatee') { olPoly(ctx, [7.8, 6.6, 12.8, 6, 13, 8, 10, 7.6], BH[1], ol, 0.7); olPoly(ctx, [8, 10, 12, 10, 10.6, 16, 8.6, 14], BH[1], ol, 0.8); }
    else { olPoly(ctx, [-4, 4, 3, 6.8, 7.8, 6.2, 13.8, 5.6, 14.4, 8, 12.4, 14, 10, 24, 5, 28, 0, 22, -4, 12, -6, 8], BH[1], ol, ow); ctx.fillStyle = BH[2]; ctx.beginPath(); polyPath(ctx, [6, 9, 12, 8.6, 10, 20, 7, 23]); ctx.fill(); olPoly(ctx, [7.6, 6.6, 14, 5.4, 14.6, 7.6, 10.6, 7.8], BH[1], ol, 0.7); }
  }
  npcHairFront(ctx, d, H, ol, ow, detail);
  npcHeadgear(ctx, d.head === 'hood' || d.head === 'turban' ? Object.assign({}, d, { head: d.head === 'hood' ? 'hood' : d.head }) : d, P, ol, ow, detail, t);
  if (d.head === 'hood') { ctx.fillStyle = 'rgba(0,0,0,0.0)'; }
  if (d.glasses) { ctx.strokeStyle = '#2a2a30'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(8.8, 1.4, 4.2, 0, TAU); ctx.moveTo(4.6, 1.2); ctx.lineTo(-4, 0.6); ctx.stroke(); ctx.fillStyle = 'rgba(190,230,255,0.25)'; ctx.beginPath(); ctx.arc(8.8, 1.4, 4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(6.4, -0.6, 1.4, 1.1); }
  if (d.bandage) { olPoly(ctx, [-9, -5, 4, -7, 5, -3, -8, -1], '#e8d9c0', ol, 0.7); }
}
