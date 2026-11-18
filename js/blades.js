'use strict';
// ============================================================
//  검 외형 : 36자루가 저마다 다른 실루엣 · 재질 · 장식 · 이펙트를 가진다
//   좌표 : 손 = (0,0), 칼끝 방향 = +x, 날(베는 쪽) = +y, 칼등 = -y
//   S(스타일) = BLADE_STYLE[검 id]   /   색은 검의 look(c · trim · hilt · glow · rune)에서 읽는다
// ============================================================
const _BL = { init: false, mix: new Map() };
function _blRgb(c) {
  if (c[0] === '#') { const n = parseInt(c.slice(1), 16); return c.length === 4 ? [(n >> 8 & 15) * 17, (n >> 4 & 15) * 17, (n & 15) * 17] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const m = c.match(/[\d.]+/g); return m ? [+m[0], +m[1], +m[2]] : [255, 255, 255];
}
function blMix(a, b, t) {
  const k = a + b + t; let v = _BL.mix.get(k);
  if (!v) { const A = _blRgb(a), B = _blRgb(b); v = `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`; if (_BL.mix.size < 4000) _BL.mix.set(k, v); }
  return v;
}
const _flat = a => { const o = []; for (const p of a) o.push(p[0], p[1]); return o; };
const _tri = x => Math.abs(((x % 1) + 1) % 1 - 0.5) * 4 - 1;          // 삼각파 -1..1

// 검별 스타일
const BLADE_STYLE = {
  // --- 기본 ---
  w0: { w: 3.9, taper: 0.04, tip: 'square', slant: 9, fuller: 1, guard: 'cross', grip: 'wrap', pommel: 'ball', nicks: 4, rivets: [0.08, 0.2] },
  // 화염도 : 불꽃처럼 일렁이는 날, 등은 검게 그을린 곡도
  w1: { w: 5.2, ws: 0.7, we: 1.35, tip: 'clip', tipL: 30, curve: -0.07, belly: 0.3, r: 0.55, n: 30, mod: (u) => [(Math.sin(u * 26) * 0.5 + 0.5) * 5 * (0.35 + u * 0.65)], hot: 1, guard: 'flame', grip: 'wrap', pommel: 'gem', fx: 'flame', flameLick: 1, edgeGlow: { a: 0.6 } },
  // 빙백검 : 결정이 자라난 얼음 칼
  w2: { w: 5.2, taper: 0.2, tipL: 30, tipP: 1.5, n: 24, mod: (u, i) => [i % 4 === 2 ? 4.6 : 0, i % 4 === 0 ? 3.6 : 0], facets: 1, guard: 'crystal', grip: 'smooth', pommel: 'gem', fx: 'frost', icicles: { n: 6, h: 6.5, u0: 0.2, u1: 0.92 }, frostCoat: 1 },
  // 뇌명도 : 번개 모양으로 꺾인 칼날
  w3: { w: 2.8, tipL: 14, n: 32, cfn: (u) => _tri(u * 4.5 + 0.25) * 4.2 * Math.min(1, u * 5) * (1 - u * 0.4), fuller: 0, ridgeGlow: 1, guard: 'bolt', grip: 'ito', pommel: 'ring', fx: 'spark', edgeGlow: { col: '255,255,200', a: 0.5 }, gems: [0.14] },
  // 혈월도 : 톱니 송곳니가 달린 초승달 곡도
  w4: { w: 5.2, ws: 0.55, we: 1.3, tip: 'clip', tipL: 34, curve: -0.17, belly: 0.5, r: 0.6, n: 28, mod: (u, i) => [i % 2 ? 3.6 : 0], guard: 'horns', grip: 'wrap', pommel: 'spike', fx: 'drip', spines: { n: 3, u0: 0.28, u1: 0.8, h: 7, lean: 5 }, stain: 1 },
  // 대지분쇄검 : 바위를 깎아 만든 대검
  w5: { w: 9, taper: 0.1, tip: 'square', slant: 15, r: 0.5, n: 16, mod: (u, i) => [(i * 7 % 4) * 1.7 + (u > 0.8 ? 2 : 0), (i * 5 % 3) * 1.4], cracks: 'rock', guard: 'block', grip: 'wrap', pommel: 'cap', bands: [0.22, 0.5, 0.76], rivets: [0.1, 0.36, 0.63], nicks: 5, spines: { n: 3, u0: 0.25, u1: 0.8, h: 5, w: 4, lean: 1 } },
  // 질풍검 : 가늘고 긴 세검 + 바람 고리 가드
  w6: { w: 2.0, taper: 0.35, tipL: 42, tipP: 1.3, n: 28, cfn: (u) => Math.sin(u * 7) * 1.5 * u, fuller: 1, guard: 'swept', grip: 'smooth', pommel: 'ball', fx: 'wind', etch: { u0: 0.05, u1: 0.3 }, edgeGlow: { col: '200,255,235', a: 0.4, w: 1 } },
  // 맹독검 : 뱀처럼 굽이치는 크리스
  w7: { w: 3.2, taper: 0.2, tipL: 18, n: 36, cfn: (u) => Math.sin(u * 21) * 3.8 * (1 - u * 0.5), ridgeGlow: 1, guard: 'fang', grip: 'wrap', pommel: 'gem', fx: 'drip', bubbles: 1, spines: { n: 4, u0: 0.2, u1: 0.75, h: 4.6, w: 2.2, lean: 2.5 } },
  // 성검 : 금 상감이 들어간 정통 장검
  w8: { w: 5.6, taper: 0.16, tipL: 24, tipP: 0.65, fuller: 1, inlay: 1, guard: 'holy', grip: 'wrap', pommel: 'gem', fx: 'holy', etch: {}, gems: [0.2, 0.34] },
  // 공허의 낫
  w9: { form: 'scythe', guard: 'none', pommel: 'spike', fx: 'void' },
  // 용암대검 : 흑요석에 용암이 흐른다
  w10: { w: 8.6, taper: 0.05, tip: 'square', slant: 13, r: 0.5, n: 18, mod: (u, i) => [(i % 3 === 1 ? 2.2 : 0) + (u > 0.7 ? 1.5 : 0), i % 4 === 2 ? 1.6 : 0], cracks: 'lava', guard: 'block', grip: 'wrap', pommel: 'cap', fx: 'ember', flameLick: 1, bands: [0.2, 0.46, 0.72], spines: { n: 3, u0: 0.28, u1: 0.8, h: 6, w: 3.6, lean: 2 }, edgeGlow: { a: 0.5 } },
  // 태엽검 : 시곗바늘 칼날 + 돌아가는 톱니
  w11: { w: 3.8, taper: 0.35, tipL: 30, tipP: 1.0, waistAt: 0.22, n: 28, mod: (u) => { const b = Math.exp(-Math.pow((u - 0.72) / 0.09, 2)) * 3.2; return [b, b]; }, fuller: 1, guard: 'gear', grip: 'tech', pommel: 'ring', fx: 'tick', cogs: [[0.5, 3.4, 1], [0.72, 2.4, -1]], bands: [0.14] },
  // 처형검 : 끝이 뭉툭한 처형인의 검
  w12: { w: 7.2, taper: -0.12, tip: 'square', slant: 0, roundTip: 1, fuller: 2, runes: 5, guard: 'cross', grip: 'wrap', pommel: 'skull', nicks: 6, stain: 1, bands: [0.18], rivets: [0.3, 0.5, 0.7] },
  // 월광검 : 초승달 곡도
  w13: { w: 5.0, ws: 0.6, we: 1.3, tip: 'clip', tipL: 44, curve: -0.25, belly: 0.6, r: 0.6, moon: 1, guard: 'crescent', grip: 'ito', pommel: 'ring', fx: 'frost', phases: 1, stardust: 1 },
  // 유성검 : 밤하늘 칼날에 별자리
  w14: { w: 3.4, taper: -0.3, tipL: 18, tipP: 0.55, stars: 1, guard: 'star', grip: 'smooth', pommel: 'gem', fx: 'twinkle', nebula: 1, stardust: 1 },
  // 암살검 : 가드 없는 짧고 검은 단도
  w15: { w: 3.0, belly: 0.6, tipL: 26, tipP: 0.9, taper: 0.15, r: 0.55, guard: 'slim', gloss: 0.7, grip: 'tech', pommel: 'ring', fx: 'shadow', matte: 1, edgeGlow: { col: '180,120,255', a: 0.6 }, chain: 4, chainEnd: 'hook' },
  // 천공의 성검 : 깃털 날개 가드
  w16: { w: 4.2, tipL: 32, tipP: 0.8, fuller: 1, inlay: 1, guard: 'wing', grip: 'smooth', pommel: 'gem', fx: 'holy', feather: 1, gems: [0.15] },
  // 마검 : 들쭉날쭉한 혼돈의 결정
  w17: { w: 5, tipL: 26, tipP: 1.3, n: 22, mod: (u, i) => [[4.2, 0, 6.4, 1, 2.9, 0][i % 6], [0, 3.8, 0, 0, 4.8, 1.3][i % 6]], facets: 1, guard: 'eye', grip: 'bone', pommel: 'spike', fx: 'chaos', spines: { n: 5, u0: 0.2, u1: 0.85, h: 8, lean: 4 }, nebula: 2 },
  // 거합도 : 정통 카타나
  w18: { w: 2.7, ws: 0.85, we: 1.05, taper: 0.1, tip: 'clip', tipL: 12, curve: -0.075, r: 0.6, hamon: 1, guard: 'tsuba', grip: 'ito', pommel: 'cap', fx: 'mist', edgeGlow: { col: '255,255,255', a: 0.35, w: 1 } },
  // 덩굴검 : 가시 돋친 나무 칼
  w19: { w: 3.4, tipL: 22, tipP: 1.2, n: 30, cfn: (u) => Math.sin(u * 9) * 1.8, mod: (u, i) => [i % 5 === 1 ? 3.4 : 0, i % 5 === 3 ? 3 : 0], vine: 1, wood: 1, guard: 'antler', grip: 'bone', pommel: 'ball', fx: 'petal', spines: { n: 5, u0: 0.15, u1: 0.8, h: 6, w: 2.2, lean: 2, col: '#7bb04a', hi: '#c4ee86' } },
  // 주사위검
  w20: { w: 5.6, taper: 0, tip: 'square', slant: 7, r: 0.5, n: 18, mod: (u, i) => [Math.floor(i / 3) % 2 ? 2 : 0, 0], guard: 'dice', grip: 'wrap', pommel: 'ball', dice: [1, 3, 5], nicks: 2 },
  // 해적 곡도 : 넓은 커틀러스 + 너클 가드
  w21: { w: 4.9, ws: 0.6, we: 1.25, tip: 'clip', tipL: 30, curve: -0.13, belly: 0.5, flare: 0.45, r: 0.6, fuller: 1, guard: 'basket', grip: 'wrap', pommel: 'ball', etch: { u0: 0.06, u1: 0.4 }, nicks: 3 },
  // 증기 기관검
  w22: { w: 5.4, taper: 0.04, tip: 'square', slant: 8, r: 0.42, n: 24, mod: (u, i) => [i % 3 === 0 ? 3 : 0, i % 6 === 3 ? 1.4 : 0], pipes: 1, guard: 'gear', grip: 'tech', pommel: 'cap', fx: 'steam', cogs: [[0.55, 3.2, 1], [0.78, 2.2, -1]], bands: [0.14, 0.4], rivets: [0.3, 0.6, 0.85] },
  // 태양신의 곡도 : 코페시
  w23: { w: 4.6, ws: 0.7, we: 1.15, tip: 'clip', tipL: 22, r: 0.58, n: 26, cfn: (u, L) => (u < 0.3 ? 0 : Math.sin(Math.min(1, (u - 0.3) / 0.7) * Math.PI) * L * 0.17 - Math.pow(Math.max(0, u - 0.3) / 0.7, 2) * L * 0.1), inlay: 1, guard: 'sun', grip: 'wrap', pommel: 'gem', fx: 'holy', sunEtch: 1, flameLick: 1, edgeGlow: { col: '255,210,90', a: 0.5 } },
  // 캔디 크러셔
  w24: { w: 4.9, taper: 0, tipL: 12, tipP: 0.5, n: 26, cfn: (u) => -Math.pow(Math.max(0, u - 0.68) / 0.32, 2.2) * 12, stripes: 1, guard: 'candy', grip: 'smooth', pommel: 'ball', fx: 'twinkle', icing: 1 },
  // 수호기사의 검 : 방패 가드 브로드소드
  w25: { w: 6.4, taper: 0.28, tipL: 24, tipP: 0.7, fuller: 1, guard: 'shield', grip: 'wrap', pommel: 'cap', heraldry: 1, rivets: [0.14, 0.5, 0.8] },
  // 본블레이드 : 등뼈로 만든 칼
  w26: { w: 5.2, tipL: 20, tipP: 0.8, n: 24, mod: (u, i) => [i % 2 ? 0 : 3, i % 2 ? 0 : 2.2], spine: 1, guard: 'skull', grip: 'bone', pommel: 'ball', matte: 1, gloss: 0.5, spines: { n: 4, u0: 0.2, u1: 0.8, h: 6, w: 2.4, lean: 2, col: '#d9d2bc', hi: '#fffcec' }, nicks: 4 },
  // 음양검 : 반은 검고 반은 흰 직검
  w27: { w: 3.6, taper: 0.2, tipL: 24, tipP: 0.85, split: 1, guard: 'yin', grip: 'ito', pommel: 'tassel', trigram: 1 },
  // 아케인 룬소드
  w28: { w: 4.6, tipL: 36, tipP: 1.4, n: 24, mod: (u, i) => [u > 0.55 && i % 3 === 0 ? 2.2 : 0, 0], runes: 6, ridgeGlow: 1, guard: 'arc', grip: 'smooth', pommel: 'gem', fx: 'rune', gems: [0.12] },
  // 저주검
  w29: { w: 4.2, ws: 0.8, we: 1.15, tip: 'clip', tipL: 28, curve: -0.09, r: 0.55, n: 26, mod: (u, i) => [i % 3 === 1 ? 4.4 : (i % 5 === 0 ? 2 : 0)], guard: 'eye', grip: 'wrap', pommel: 'skull', fx: 'shadow', chain: 5, spines: { n: 4, u0: 0.25, u1: 0.85, h: 6, lean: 4 }, edgeGlow: { col: '190,110,255', a: 0.5 } },
  // 수정검 : 프리즘
  w30: { w: 6.2, tipL: 34, tipP: 1.0, n: 20, mod: (u, i) => [i % 4 === 2 ? 3.2 : 0, i % 4 === 0 ? 3.2 : 0], facets: 1, prism: 1, guard: 'crystal', grip: 'smooth', pommel: 'gem', fx: 'twinkle', edgeGlow: { col: '255,255,255', a: 0.4 }, stardust: 1 },
  // 레이저 블레이드
  w31: { form: 'laser', guard: 'none', grip: 'tech', pommel: 'cap' },
  // 용아검 : 용의 송곳니
  w32: { w: 6.4, ws: 0.75, we: 1.2, tip: 'clip', tipL: 38, tipP: 0.9, curve: -0.12, belly: 0.45, r: 0.56, scales: 1, guard: 'dragon', grip: 'wrap', pommel: 'spike', fx: 'ember', fin: { n: 4, u0: 0.15, u1: 0.75, h: 10 }, edgeGlow: { col: '255,150,60', a: 0.5 } },
  // 바이올린검
  w33: { w: 3.0, taper: 0.25, tipL: 26, tipP: 1.1, n: 24, mod: (u) => { const b = Math.sin(Math.min(1, Math.max(0, (u - 0.08) / 0.55)) * Math.PI) * 2.4, w = Math.exp(-Math.pow((u - 0.33) / 0.07, 2)) * 1.6; return [b - w, b - w]; }, strings: 1, guard: 'scroll', grip: 'smooth', pommel: 'ball', fx: 'note', fholes: 1 },
  // 라그나로크 : 빛의 심지가 흐르는 신화의 대검
  w34: { w: 9.4, taper: 0.06, tipL: 36, tipP: 0.75, n: 24, mod: (u, i) => [u < 0.2 ? (0.2 - u) * 16 : 0, u < 0.2 ? (0.2 - u) * 16 : 0], core: 1, runes: 4, guard: 'mythic', grip: 'wrap', pommel: 'gem', fx: 'holy', etch: { u0: 0.06, u1: 0.5 }, gems: [0.1], edgeGlow: { a: 0.5 } },
};

function bladeStyle(Lk) {
  if (!_BL.init && typeof WEAPONS !== 'undefined') { _BL.init = true; for (const w of WEAPONS) if (w.look) w.look.wid = w.id; }
  return BLADE_STYLE[Lk.wid] || BLADE_STYLE.w0;
}

// 칼날의 윤곽 : top(등) · bot(날) · mid(능선) 점 목록
function bladeGeom(S, len) {
  const N = S.n || 20, x0 = S.x0 ?? 12, span = len - x0, W = S.w ?? 4;
  const tipU = S.tip === 'square' ? 2 : Math.max(0.05, 1 - (S.tipL ?? 16) / span), tipP = S.tipP ?? 0.85, r = S.r ?? 0.5;
  const top = [], bot = [], mid = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = x0 + span * u;
    const e = u <= tipU ? 1 : Math.pow(Math.max(0, 1 - (u - tipU) / (1 - tipU)), tipP);
    let tp = 1 - (S.taper ?? 0.12) * u + (S.flare || 0) * u * u;
    if (S.waistAt) tp *= 0.55 + 0.45 * Math.min(1, Math.abs(u - S.waistAt) / S.waistAt) + (u > S.waistAt ? Math.sin(Math.min(1, (u - S.waistAt) / 0.3) * Math.PI) * 0.5 : 0);
    let ws = W * (S.ws ?? 1) * tp, we = W * (S.we ?? 1) * tp;
    if (S.belly) we *= 1 + S.belly * Math.sin(Math.min(1, u * 1.1) * Math.PI);
    let yc = (S.curve || 0) * span * u * u;
    if (S.cfn) yc += S.cfn(u, span);
    if (S.mod) { const m = S.mod(u, i, N), k = Math.min(1, e * 1.6); we += m[0] * k; ws += (m[1] || 0) * k; }
    if (S.tip === 'clip') yc -= (1 - e) * ws;
    const t = yc - ws * e, b = yc + we * e;
    top.push([x, t]); bot.push([x, b]); mid.push([x, t + (b - t) * r]);
  }
  if (S.tip === 'square') {
    top[N][0] -= S.slant || 0;
    if (S.roundTip) { const a = top[N], b = bot[N], m = (a[1] + b[1]) / 2, h = (b[1] - a[1]) / 2; top.push([a[0] + h * 0.55, a[1] + h * 0.3], [a[0] + h * 0.8, m]); bot.push([b[0] + h * 0.55, b[1] - h * 0.3]); mid.push([a[0] + h * 0.8, m]); }
  }
  return { top, bot, mid, x0, len, W };
}

// ---------- 손잡이 · 자루 끝 ----------
function drawBladeGrip(ctx, S, hilt, trim, ol, glow, plain) {
  const g0 = -15, g1 = 8, h = 2.8;
  olPoly(ctx, [g0, -h, g1, -h, g1, h, g0, h], hilt[1], ol, 1.5);
  if (plain) return;
  ctx.fillStyle = hilt[0]; ctx.fillRect(g0, h * 0.25, g1 - g0, h * 0.75);
  ctx.lineWidth = 0.9; ctx.lineCap = 'butt';
  switch (S.grip) {
    case 'ito':                                         // 마름모 끈 감기
      ctx.fillStyle = trim[1];
      for (let x = g0 + 2.8; x < g1 - 1; x += 4.6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 1.5, -1.7); ctx.lineTo(x + 3, 0); ctx.lineTo(x + 1.5, 1.7); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = hilt[2]; ctx.beginPath(); for (let x = g0 + 0.5; x < g1; x += 4.6) { ctx.moveTo(x, -h); ctx.lineTo(x + 2.3, h); ctx.moveTo(x + 2.3, -h); ctx.lineTo(x, h); } ctx.stroke(); break;
    case 'tech':
      ctx.fillStyle = hilt[2]; for (let x = g0 + 2; x < g1 - 2; x += 5) ctx.fillRect(x, -h, 1.4, h * 2);
      ctx.fillStyle = `rgba(${glow},0.9)`; ctx.fillRect(g0 + 4, -0.6, g1 - g0 - 8, 1.2); break;
    case 'bone':
      ctx.strokeStyle = hilt[2]; ctx.beginPath(); for (let x = g0 + 3; x < g1 - 1; x += 3.4) { ctx.moveTo(x, -h); ctx.quadraticCurveTo(x + 1.4, 0, x, h); } ctx.stroke(); break;
    case 'smooth':
      ctx.fillStyle = hilt[2]; ctx.fillRect(g0 + 1, -h + 0.5, g1 - g0 - 2, 1.1);
      ctx.fillStyle = trim[1]; ctx.fillRect(g0 + 1, -h, 1.6, h * 2); ctx.fillRect(g1 - 3.4, -h, 1.6, h * 2); ctx.fillRect((g0 + g1) / 2 - 0.8, -h, 1.6, h * 2); break;
    default:                                            // 가죽 끈 사선 감기
      ctx.strokeStyle = hilt[2]; ctx.beginPath(); for (let x = g0 + 1; x < g1 - 1; x += 3.2) { ctx.moveTo(x, h); ctx.lineTo(x + 2.4, -h); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(g0, -h, g1 - g0, 1);
  }
}
function drawBladePommel(ctx, S, hilt, trim, ol, glow, plain, t) {
  const x = -16.5;
  switch (S.pommel) {
    case 'gem':
      olPoly(ctx, [x - 3.6, 0, x, -3.6, x + 3, 0, x, 3.6], trim[1], ol, 1.3);
      if (!plain) { ctx.fillStyle = `rgb(${glow})`; ctx.beginPath(); polyPath(ctx, [x - 2, 0, x, -2, x + 1.6, 0, x, 2]); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 0.9, -1.1, 1, 1); } break;
    case 'ring':
      ctx.beginPath(); ctx.arc(x - 1.4, 0, 3.3, 0, TAU); ctx.lineWidth = 3.4; ctx.strokeStyle = ol; ctx.stroke(); ctx.lineWidth = 1.7; ctx.strokeStyle = trim[1]; ctx.stroke(); break;
    case 'spike': olPoly(ctx, [x + 2, -3, x + 2, 3, x - 6.5, 0], trim[1], ol, 1.3); if (!plain) { ctx.fillStyle = trim[2]; ctx.beginPath(); polyPath(ctx, [x + 1.5, -2, x + 1.5, 0, x - 4.6, 0]); ctx.fill(); } break;
    case 'cap': olPoly(ctx, [x + 2, -3.6, x - 1.6, -3.6, x - 2.6, 0, x - 1.6, 3.6, x + 2, 3.6], trim[1], ol, 1.3); if (!plain) { ctx.fillStyle = trim[2]; ctx.fillRect(x - 1.2, -3, 2.6, 1.3); } break;
    case 'skull':
      circleOl(ctx, x - 1, 0, 3.7, '#e8e2d0', ol, 1.3);
      if (!plain) { ctx.fillStyle = '#17121a'; ctx.beginPath(); ctx.arc(x - 1.9, -1.5, 1, 0, TAU); ctx.arc(x - 1.9, 1.5, 1, 0, TAU); ctx.fill(); ctx.fillRect(x + 0.6, -1.6, 1.6, 3.2); } break;
    case 'tassel': {
      circleOl(ctx, x, 0, 2.5, trim[1], ol, 1.2);
      if (!plain) {
        const sw = Math.sin(t * 0.07) * 3;
        ctx.strokeStyle = ol; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 1, 1); ctx.quadraticCurveTo(x - 6, 4, x - 6 + sw, 12); ctx.stroke();
        ctx.strokeStyle = '#d83a3a'; ctx.lineWidth = 1.3; ctx.stroke();
        olPoly(ctx, [x - 7.6 + sw, 11, x - 4.4 + sw, 11, x - 3.6 + sw * 1.3, 21, x - 8.4 + sw * 1.3, 21], '#d83a3a', ol, 1);
        ctx.fillStyle = trim[1]; ctx.fillRect(x - 7.6 + sw, 11, 3.2, 1.6);
      } break;
    }
    default: circleOl(ctx, x, 0, 2.9, trim[1], ol, 1.3); if (!plain) { ctx.fillStyle = trim[2]; ctx.beginPath(); ctx.arc(x - 0.7, -0.9, 1.1, 0, TAU); ctx.fill(); }
  }
}

// ---------- 코등이 (가드) ----------
function drawBladeGuard(ctx, S, trim, ol, glow, plain, t, W) {
  const T = trim[1], hi = pts => { if (!plain) { ctx.fillStyle = trim[2]; ctx.beginPath(); polyPath(ctx, pts); ctx.fill(); } };
  const lo = pts => { if (!plain) { ctx.fillStyle = trim[0]; ctx.beginPath(); polyPath(ctx, pts); ctx.fill(); } };
  const gem = (x, y, r) => { if (plain) return; circleOl(ctx, x, y, r, `rgb(${glow})`, ol, 1); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.34, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, r * 3.4, glow, 0.35 + Math.sin(t * 0.1) * 0.12); ctx.globalCompositeOperation = 'source-over'; };
  const curve = (pts, fill, w) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 4) ctx.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w + 2.4; ctx.strokeStyle = ol; ctx.stroke(); ctx.lineWidth = w; ctx.strokeStyle = fill; ctx.stroke(); };
  switch (S.guard) {
    case 'none': break;
    case 'antler':                                      // 사슴뿔 가드
      for (const s of [-1, 1]) { curve([8, s * 2, 14, s * 6, 14.5, s * 15], T, 2.4); curve([12.6, s * 9, 18, s * 9.4, 21, s * 6.4], T, 1.7); curve([13.8, s * 13, 19, s * 15, 22, s * 13.4], T, 1.5); }
      olPoly(ctx, [6.6, -3.4, 12, -3.8, 12, 3.8, 6.6, 3.4], trim[0], ol, 1.1); gem(9.4, 0, 1.6); break;
    case 'horns':                                       // 휘어 뻗은 두 뿔
      for (const s of [-1, 1]) { curve([8, s * 2, 11, s * 10, 22, s * 9.6], T, 3.6); curve([8.4, s * 2.4, 11.4, s * 9, 20.4, s * 8.8], trim[2], 0.9); }
      olPoly(ctx, [6.4, -3.6, 12.4, -3.6, 12.4, 3.6, 6.4, 3.6], trim[0], ol, 1.1); gem(9.4, 0, 1.9); break;
    case 'slim':                                        // 단도의 작은 날 밑
      olPoly(ctx, [7.6, -5.4, 11.4, -4.6, 11.4, 4.6, 7.6, 5.4], T, ol, 1.2); hi([8.2, -4.8, 10.8, -4.2, 10.8, -1, 8.2, -1]); break;
    case 'tsuba':
      ctx.beginPath(); ctx.ellipse(9.4, 0, 2.6, 8.6, 0, 0, TAU); ctx.fillStyle = ol; ctx.fill();
      ctx.beginPath(); ctx.ellipse(9.4, 0, 1.6, 7.5, 0, 0, TAU); ctx.fillStyle = trim[0]; ctx.fill();
      if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(9.4, 0, 1.2, 6.2, 0, 0, TAU); ctx.stroke(); }
      olPoly(ctx, [11.6, -W * 0.8, 15, -W * 0.8, 15, W * 0.95, 11.6, W * 0.95], T, ol, 1); hi([12, -W * 0.8, 14.6, -W * 0.8, 14.6, -W * 0.2, 12, -W * 0.2]); break;
    case 'swept':                                       // 바람 고리 (세검의 스웹트 힐트)
      curve([9, -6, 16, -9, 20, -3], T, 1.5); curve([9, 6, 2, 12, -10, 8], T, 1.5); curve([9, 5, 18, 10, 22, 2], T, 1.2);
      olPoly(ctx, [7.5, -6.5, 11, -6.5, 11, 6.5, 7.5, 6.5], T, ol, 1.2); hi([8, -6, 10.4, -6, 10.4, -2, 8, -2]); break;
    case 'basket':                                      // 너클 가드
      curve([10, 6, 4, 15, -8, 12, -15, 9, -16, 3], T, 2.6);
      olPoly(ctx, [7.5, -8, 12, -8.5, 12.5, 7, 7.5, 7], T, ol, 1.2); hi([8, -7.4, 11.4, -7.8, 11.4, -3, 8, -3]);
      if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(8, 9); ctx.quadraticCurveTo(2, 14, -8, 11); ctx.stroke(); } break;
    case 'claw': case 'fang': case 'dragon': {
      const k = S.guard === 'dragon' ? 1.25 : 1;
      for (const s of [-1, 1]) { olPoly(ctx, [6.5, s * 1.5, 13, s * 4.5 * k, 19.5 * k, s * 12.5 * k, 12.5, s * 10.5 * k, 6, s * 6], T, ol, 1.2); hi([8, s * 4, 12, s * 5.5 * k, 16.5 * k, s * 10.6 * k, 12.4, s * 9 * k]); }
      if (S.guard === 'dragon') { for (const s of [-1, 1]) olPoly(ctx, [7, s * 5, 2, s * 11, -3, s * 9.5, 3, s * 5], T, ol, 1.1); }
      olPoly(ctx, [6.5, -3.4, 12.5, -3.4, 12.5, 3.4, 6.5, 3.4], trim[0], ol, 1.1); gem(9.5, 0, S.guard === 'fang' ? 1.7 : 2); break;
    }
    case 'flame':
      for (const s of [-1, 1]) { olPoly(ctx, [7, 0, 15, s * 3, 13, s * 8, 17, s * 12, 10.5, s * 14.5, 8.5, s * 9.5, 5.5, s * 8], T, ol, 1.2); hi([8.5, s * 2, 13, s * 4, 11.5, s * 8.5, 13.5, s * 11.5, 10.5, s * 12.5, 9.5, s * 8]); }
      gem(9.6, 0, 2.3); break;
    case 'wing': case 'holy': case 'mythic': {
      const k = S.guard === 'mythic' ? 1.35 : S.guard === 'holy' ? 0.92 : 1.1;
      for (const s of [-1, 1]) {
        for (let f = 2; f >= 0; f--) {
          const bx = 7.5 + f * 1.3, tx = (10 - f * 6.5) * k + 2, ty = s * (15.5 - f * 3.2) * k;
          olPoly(ctx, [bx, s * 1.5, bx + 3.5, s * 2.5, tx + 3.2, ty * 0.72, tx, ty, tx - 2.4, ty * 0.62], f === 0 ? T : blMix(T, trim[2], 0.25 * f), ol, 1.1);
          if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(bx + 1.6, s * 2.6); ctx.lineTo(tx + 0.4, ty * 0.9); ctx.stroke(); }
        }
      }
      olPoly(ctx, [6.6, -4.2, 10, -5.2, 13.4, -4.2, 13.4, 4.2, 10, 5.2, 6.6, 4.2], T, ol, 1.2); lo([6.6, 1, 13.4, 1, 13.4, 4.2, 10, 5.2, 6.6, 4.2]);
      gem(10, 0, S.guard === 'mythic' ? 2.8 : 2.2); break;
    }
    case 'crystal':
      for (const s of [-1, 1]) { olPoly(ctx, [8, s * 1, 12.5, s * 2, 11.5, s * 12.5, 9.2, s * 9], T, ol, 1.1); olPoly(ctx, [6.5, s * 2, 9.5, s * 3, 5, s * 9.5], blMix(T, trim[2], 0.5), ol, 1); hi([9.4, s * 3, 11.6, s * 3.4, 11, s * 9.8]); }
      gem(9.6, 0, 2); break;
    case 'bolt':
      for (const s of [-1, 1]) { olPoly(ctx, [7.5, s * 1, 12.5, s * 1, 12, s * 6, 15.5, s * 5.2, 11.5, s * 13, 11.8, s * 8, 8.2, s * 8.6], T, ol, 1.1); hi([8.6, s * 2, 11.6, s * 2, 11, s * 6.8, 9, s * 7]); } break;
    case 'crescent':
      ctx.beginPath(); ctx.arc(14, 0, 11.5, Math.PI * 0.62, Math.PI * 1.38); ctx.arc(19.5, 0, 12.8, Math.PI * 1.3, Math.PI * 0.7, true); ctx.closePath();
      ctx.lineJoin = 'round'; ctx.lineWidth = 2.6; ctx.strokeStyle = ol; ctx.stroke(); ctx.fillStyle = T; ctx.fill();
      if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(14, 0, 10.4, Math.PI * 0.72, Math.PI * 1.28); ctx.stroke(); } gem(6.6, 0, 1.6); break;
    case 'star': {
      const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2 + Math.sin(t * 0.02) * 0.1, r = i % 2 ? 4 : 9.5; p.push(10 + Math.cos(a) * r * 0.62, Math.sin(a) * r); }
      olPoly(ctx, p, T, ol, 1.2); hi([10, -6, 11.6, -2, 10, 0, 8.4, -2]); gem(10, 0, 1.6); break;
    }
    case 'sun': {
      const p = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * 0.012, r = i % 2 ? 6.2 : 10.5; p.push(10 + Math.cos(a) * r * 0.7, Math.sin(a) * r); }
      olPoly(ctx, p, T, ol, 1.2); circleOl(ctx, 10, 0, 4.4, trim[2], ol, 1); if (!plain) { ctx.fillStyle = T; ctx.beginPath(); ctx.arc(10, 0, 2.6, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 10, 0, 16, glow, 0.3); ctx.globalCompositeOperation = 'source-over'; } break;
    }
    case 'gear': {
      const p = [], n = 8, a0 = t * 0.03; for (let i = 0; i < n * 4; i++) { const a = a0 + i / (n * 4) * TAU, r = (i % 4 < 2) ? 9 : 6.6; p.push(10 + Math.cos(a) * r * 0.78, Math.sin(a) * r); }
      olPoly(ctx, p, T, ol, 1.2); circleOl(ctx, 10, 0, 3.6, trim[0], ol, 0.9);
      if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.9; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = a0 + i / 3 * TAU; ctx.moveTo(10, 0); ctx.lineTo(10 + Math.cos(a) * 3.2 * 0.78, Math.sin(a) * 3.2); } ctx.stroke(); } break;
    }
    case 'skull':
      olPoly(ctx, [7, -9, 11.5, -9.5, 12, 9.5, 7, 9], trim[0], ol, 1.1);
      circleOl(ctx, 10.5, 0, 5.6, '#e8e2d0', ol, 1.3);
      if (!plain) { ctx.fillStyle = '#17121a'; ctx.beginPath(); ctx.ellipse(11.8, -2.2, 1.5, 1.8, 0, 0, TAU); ctx.ellipse(11.8, 2.2, 1.5, 1.8, 0, 0, TAU); ctx.fill(); ctx.fillRect(7.4, -2.4, 1.6, 4.8); ctx.fillStyle = `rgba(${glow},0.95)`; ctx.fillRect(11.4, -2.6, 0.9, 0.9); ctx.fillRect(11.4, 1.8, 0.9, 0.9); } break;
    case 'eye': {
      for (const s of [-1, 1]) { olPoly(ctx, [6.5, s * 2, 13, s * 3, 17, s * 11, 11, s * 8.5, 7, s * 12.5, 8.5, s * 6], T, ol, 1.2); hi([8.5, s * 3.4, 12, s * 4, 14.6, s * 9, 11, s * 7.2]); }
      ctx.beginPath(); ctx.ellipse(10, 0, 3.2, 5, 0, 0, TAU); ctx.fillStyle = ol; ctx.fill();
      if (!plain) { const bl = (t % 190) < 6 ? 0.15 : 1; ctx.beginPath(); ctx.ellipse(10, 0, 2.2, 4 * bl, 0, 0, TAU); ctx.fillStyle = '#fff6ea'; ctx.fill(); ctx.beginPath(); ctx.ellipse(10.3, Math.sin(t * 0.04) * 1.2, 1.3, 1.9 * bl, 0, 0, TAU); ctx.fillStyle = `rgb(${glow})`; ctx.fill(); ctx.fillStyle = '#100810'; ctx.fillRect(9.9, Math.sin(t * 0.04) * 1.2 - 1 * bl, 0.8, 2 * bl); } break;
    }
    case 'yin': {
      circleOl(ctx, 10, 0, 6.6, '#f2f2f6', ol, 1.3);
      if (!plain) { const a = t * 0.025; ctx.save(); ctx.translate(10, 0); ctx.scale(0.8, 1); ctx.rotate(a); ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.arc(0, 0, 6.6, -Math.PI / 2, Math.PI / 2); ctx.arc(0, 3.3, 3.3, Math.PI / 2, -Math.PI / 2, true); ctx.arc(0, -3.3, 3.3, Math.PI / 2, -Math.PI / 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -3.3, 1, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2f2f6'; ctx.beginPath(); ctx.arc(0, 3.3, 1, 0, TAU); ctx.fill(); ctx.restore(); } break;
    }
    case 'dice':
      olPoly(ctx, [5.5, -6.5, 14.5, -6.5, 14.5, 6.5, 5.5, 6.5], '#f6f2ea', ol, 1.3);
      if (!plain) { ctx.fillStyle = '#d4cbbb'; ctx.fillRect(5.5, 3, 9, 3.5); ctx.fillStyle = '#c8202a'; for (const [x, y] of [[7.8, -3.6], [12.2, 3.6], [10, 0]]) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, TAU); ctx.fill(); } } break;
    case 'candy':
      circleOl(ctx, 10, 0, 6.2, '#ffffff', ol, 1.3);
      if (!plain) { ctx.strokeStyle = T; ctx.lineWidth = 1.6; ctx.beginPath(); for (let a = 0; a < 9; a += 0.25) { const r = a * 0.62, x = 10 + Math.cos(a + t * 0.03) * r * 0.85, y = Math.sin(a + t * 0.03) * r; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } break;
    case 'shield':
      olPoly(ctx, [6, -11.5, 13.5, -10.5, 16.5, 0, 13.5, 10.5, 6, 11.5], T, ol, 1.3); lo([6, 0, 16.5, 0, 13.5, 10.5, 6, 11.5]); hi([7.2, -10, 12.6, -9.2, 14.6, -2, 7.2, -2]);
      if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10.2, -8); ctx.lineTo(10.2, 8); ctx.moveTo(7.4, 0); ctx.lineTo(14.4, 0); ctx.stroke(); } break;
    case 'leaf':
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8, s * 1.5); ctx.quadraticCurveTo(17, s * 4, 15.5, s * 13.5); ctx.quadraticCurveTo(7, s * 11, 8, s * 1.5); ctx.lineJoin = 'round'; ctx.lineWidth = 2.4; ctx.strokeStyle = ol; ctx.stroke(); ctx.fillStyle = T; ctx.fill(); if (!plain) { ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(9, s * 2.6); ctx.lineTo(14.6, s * 11.6); ctx.stroke(); } }
      if (!plain) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + t * 0.01; circleOl(ctx, 8.6 + Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1.7, '#ff9ad0', ol, 0.6); } ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.arc(8.6, 0, 1.3, 0, TAU); ctx.fill(); } break;
    case 'scroll':
      for (const s of [-1, 1]) { curve([9, s * 1, 12, s * 9, 7, s * 11.5, 4.5, s * 9.6, 6.2, s * 7.4], T, 2); }
      olPoly(ctx, [7, -3.2, 13.5, -4.2, 15, 0, 13.5, 4.2, 7, 3.2], T, ol, 1.2); hi([8, -2.6, 13, -3.4, 13.8, -1, 8, -1]); break;
    case 'arc':
      for (const s of [-1, 1]) curve([8, s * 2, 15, s * 5, 16, s * 13], T, 2.2);
      if (!plain) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${glow},${0.6 + Math.sin(t * 0.09) * 0.25})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(10, 0, 3.6, 11.5, 0, 0, TAU); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
      gem(10, 0, 2.4); break;
    case 'block':
      olPoly(ctx, [6, -W - 3.4, 12.5, -W - 4.6, 15, -W - 1, 15, W + 1, 12.5, W + 4.6, 6, W + 3.4], T, ol, 1.3); lo([6, 1, 15, 1, 15, W + 1, 12.5, W + 4.6, 6, W + 3.4]);
      hi([7, -W - 2.6, 12, -W - 3.6, 13.6, -W - 1.4, 7, -W - 1.4]); break;
    default:                                            // 십자 가드 : 끝이 벌어진 날개 + 가운데 보석
      olPoly(ctx, [7.6, -11.6, 11.2, -12.6, 12.6, -11.4, 12.2, -3.4, 13.2, 0, 12.2, 3.4, 12.6, 11.4, 11.2, 12.6, 7.6, 11.6, 8.6, 3.4, 7.2, 0, 8.6, -3.4], T, ol, 1.3);
      lo([8.2, 4.4, 12.2, 4.4, 12.4, 11, 11.2, 12, 8.2, 11]); hi([8.6, -10.8, 11, -11.6, 11.4, -4.4, 9.2, -4.4]);
      if (S.fuller || S.runes) gem(10.2, 0, 1.7);
  }
}

// ---------- 낫 (공허의 낫) ----------
function drawScythe(ctx, S, c, hilt, trim, ol, glow, rune, len, plain, t) {
  olPoly(ctx, [-15, -1.9, len - 8, -1.9, len - 8, 1.9, -15, 1.9], hilt[1], ol, 1.5);
  if (!plain) { ctx.fillStyle = hilt[0]; ctx.fillRect(-15, 0.4, len - 7, 1.5); ctx.fillStyle = trim[1]; for (const x of [-8, 8, len * 0.45, len - 22]) ctx.fillRect(x, -1.9, 2.2, 3.8); }
  const X = len;
  const path = () => {
    ctx.beginPath(); ctx.moveTo(X - 20, -4.5); ctx.quadraticCurveTo(X - 2, -8, X + 4, 4);
    ctx.quadraticCurveTo(X + 6, 22, X - 12, 34); ctx.quadraticCurveTo(X - 24, 42, X - 40, 42.5);
    ctx.quadraticCurveTo(X - 22, 34, X - 14, 20); ctx.quadraticCurveTo(X - 9, 9, X - 15, 3.4); ctx.closePath();
  };
  path(); ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = ol; ctx.stroke(); ctx.fillStyle = c[1]; ctx.fill();
  olPoly(ctx, [X - 14, -4.6, X - 3, -6.5, X + 2.5, -14.5, X - 9.5, -10.5], c[0], ol, 1.2);              // 등 뒤 가시
  olPoly(ctx, [X - 21, -5.6, X - 11, -5.6, X - 11, 5.6, X - 21, 5.6], trim[1], ol, 1.2);             // 소켓
  if (plain) return;
  ctx.fillStyle = c[0]; ctx.beginPath(); ctx.moveTo(X - 18, -3); ctx.quadraticCurveTo(X - 2, -5, X + 2, 5); ctx.quadraticCurveTo(X + 3, 20, X - 12, 31.5); ctx.quadraticCurveTo(X - 2, 18, X - 6, 6); ctx.quadraticCurveTo(X - 9, 0, X - 18, -3); ctx.fill();
  ctx.strokeStyle = c[2]; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X - 38, 42); ctx.quadraticCurveTo(X - 22, 34, X - 14, 20); ctx.quadraticCurveTo(X - 9, 9, X - 15, 3.6); ctx.stroke();
  ctx.fillStyle = trim[2]; ctx.fillRect(X - 20, -5, 8, 1.4);
  ctx.globalCompositeOperation = 'lighter';
  const pu = 0.6 + Math.sin(t * 0.1) * 0.25;
  ctx.strokeStyle = `rgba(${rune || glow},${0.8 * pu})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(X - 8, 0); ctx.quadraticCurveTo(X - 1, 14, X - 12, 28); ctx.stroke();
  drawGlow(ctx, X - 6, 14, 24, glow, 0.2 * pu); drawGlow(ctx, X - 16, 0, 7, glow, 0.7 * pu);
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- 레이저 블레이드 ----------
function drawLaserBlade(ctx, S, c, hilt, trim, ol, glow, len, plain, t, g) {
  olPoly(ctx, [6, -4.4, 13, -5.2, 17.5, -3.2, 17.5, 3.2, 13, 5.2, 6, 4.4], trim[0], ol, 1.4);
  const fl = plain ? 1 : 0.9 + Math.sin(t * 0.9) * 0.05 + Math.sin(t * 0.37) * 0.05, a = { x: 18, y: 0 }, b = { x: len - 3, y: 0 };
  if (plain) { ctx.fillStyle = ol; ctx.beginPath(); capsulePath(ctx, a, b, 4.2, 3.4); ctx.fill(); ctx.fillStyle = c[1]; ctx.beginPath(); capsulePath(ctx, a, b, 2.8, 2); ctx.fill(); return; }
  ctx.fillStyle = trim[1]; ctx.fillRect(7, -4, 5, 1.6); ctx.fillStyle = `rgb(${glow})`; ctx.fillRect(13, -1.2, 4, 2.4); ctx.fillRect(8, 1.6, 3, 1.2);
  ctx.fillStyle = `rgba(${glow},0.28)`; ctx.beginPath(); capsulePath(ctx, a, b, 6.4 * fl, 5.2 * fl); ctx.fill();
  ctx.fillStyle = c[1]; ctx.beginPath(); capsulePath(ctx, a, b, 3.9 * fl, 3.1 * fl); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); capsulePath(ctx, a, { x: len - 5, y: 0 }, 1.7, 1.2); ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) drawGlow(ctx, 22 + i * (len - 26) / 3, 0, 15 + g * 8, glow, 0.3 + g * 0.2);
  const k = (t * 3) % (len - 24); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(20 + k, -3.4, 5, 0.9); ctx.fillRect(20 + (k * 1.7) % (len - 24), 2.6, 4, 0.8);
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- 칼날 위 장식 ----------
function drawBladeDeco(ctx, S, G, c, trim, ol, glow, rune, t) {
  const M = G.mid, T = G.top, B = G.bot, N = M.length - 1, at = (A, u) => { const f = Math.min(N - 0.001, Math.max(0, u * N)), i = f | 0, k = f - i; return [A[i][0] + (A[i + 1][0] - A[i][0]) * k, A[i][1] + (A[i + 1][1] - A[i][1]) * k]; };
  const line = (A, u0, u1, n = 10) => { for (let i = 0; i <= n; i++) { const p = at(A, u0 + (u1 - u0) * i / n); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (S.fuller) {                                       // 피홈
    for (let k = 0; k < S.fuller; k++) {
      const o = S.fuller === 2 ? (k ? 1.4 : -1.4) : 0;
      ctx.save(); ctx.translate(0, o);
      ctx.strokeStyle = c[0]; ctx.lineWidth = 1.5; ctx.beginPath(); line(M, 0.05, 0.66); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.5; ctx.translate(0, 0.8); ctx.beginPath(); line(M, 0.06, 0.65); ctx.stroke();
      ctx.restore();
    }
  }
  if (S.hamon) {                                        // 하몬 (물결 무늬 담금질 선)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const u = 0.03 + i / 40 * 0.93, p = at(M, u), q = at(B, u), k = 0.25 + Math.sin(u * 60) * 0.18; const x = p[0] + (q[0] - p[0]) * k, y = p[1] + (q[1] - p[1]) * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
  }
  if (S.inlay) {                                        // 금 상감
    ctx.strokeStyle = trim[1]; ctx.lineWidth = 1; ctx.beginPath(); line(M, 0.04, 0.5); ctx.stroke();
    for (const u of [0.1, 0.24, 0.38]) { const p = at(M, u); ctx.fillStyle = trim[2]; ctx.beginPath(); polyPath(ctx, [p[0] - 2, p[1], p[0], p[1] - 1.5, p[0] + 2, p[1], p[0], p[1] + 1.5]); ctx.fill(); }
  }
  if (S.facets) {                                       // 결정 면
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let i = 1; i < N; i += 2) { ctx.moveTo(T[i][0], T[i][1]); ctx.lineTo(M[i + 1][0], M[i + 1][1]); ctx.lineTo(B[i][0], B[i][1]); }
    ctx.stroke();
    if (S.prism) { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < N; i += 2) { const h = (i * 37 + t * 1.5) % 360, q = hslRgb(h, 0.9, 0.6); ctx.fillStyle = `rgba(${q},0.35)`; ctx.beginPath(); polyPath(ctx, [T[i][0], T[i][1], T[i + 1][0], T[i + 1][1], M[i + 1][0], M[i + 1][1], M[i][0], M[i][1]]); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; }
  }
  if (S.cracks) {                                       // 갈라진 틈 (바위 / 용암)
    const lava = S.cracks === 'lava', r2 = mulberry(77), pu = 0.6 + Math.sin(t * 0.08) * 0.3;
    const draw = () => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const u = 0.06 + k * 0.15, p = at(M, u), a = at(T, u + 0.05), b = at(B, u + 0.03 + r2() * 0.05); ctx.moveTo(a[0], a[1] + 0.6); ctx.lineTo(p[0] + r2() * 3, p[1] + (r2() - 0.5) * 2); ctx.lineTo(b[0], b[1] - 0.6); ctx.moveTo(p[0], p[1]); const q = at(M, u + 0.13); ctx.lineTo(q[0], q[1] + (r2() - 0.5) * 3); } ctx.stroke(); };
    if (lava) { ctx.strokeStyle = '#2a0a04'; ctx.lineWidth = 2.2; draw(); ctx.globalCompositeOperation = 'lighter'; const r3 = mulberry(77); ctx.strokeStyle = `rgba(${rune || glow},${0.95 * pu})`; ctx.lineWidth = 1.1; ctx.beginPath(); for (let k = 0; k < 6; k++) { const u = 0.06 + k * 0.15, p = at(M, u), a = at(T, u + 0.05), b = at(B, u + 0.03 + r3() * 0.05); ctx.moveTo(a[0], a[1] + 0.6); ctx.lineTo(p[0] + r3() * 3, p[1] + (r3() - 0.5) * 2); ctx.lineTo(b[0], b[1] - 0.6); ctx.moveTo(p[0], p[1]); const q = at(M, u + 0.13); ctx.lineTo(q[0], q[1] + (r3() - 0.5) * 3); } ctx.stroke(); drawGlow(ctx, G.len * 0.55, 0, G.len * 0.5, glow, 0.16 * pu, 1, 0.25); ctx.globalCompositeOperation = 'source-over'; }
    else { ctx.strokeStyle = 'rgba(20,14,10,0.75)'; ctx.lineWidth = 0.9; draw(); ctx.fillStyle = 'rgba(255,240,210,0.22)'; for (let k = 0; k < 5; k++) { const p = at(T, 0.1 + k * 0.18); ctx.fillRect(p[0], p[1] + 1.2, 5, 1.6); } }
  }
  if (S.runes) {                                        // 빛나는 룬 문자
    const r2 = mulberry(31 + S.runes), pu = 0.6 + Math.sin(t * 0.09) * 0.3;
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rune || glow},${pu})`; ctx.lineWidth = 0.9;
    for (let k = 0; k < S.runes; k++) {
      const p = at(M, 0.1 + k * (0.62 / S.runes)); ctx.beginPath();
      let x = p[0], y = p[1] - 1.8; ctx.moveTo(x, y);
      for (let j = 0; j < 3; j++) { x = p[0] + (r2() - 0.5) * 3.4; y += 1.3; ctx.lineTo(x, y); }
      ctx.stroke(); drawGlow(ctx, p[0], p[1], 5, rune || glow, 0.3 * pu);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  if (S.ridgeGlow) { ctx.globalCompositeOperation = 'lighter'; const pu = 0.55 + Math.sin(t * 0.12) * 0.25; ctx.strokeStyle = `rgba(${rune || glow},${0.85 * pu})`; ctx.lineWidth = 1.3; ctx.beginPath(); line(M, 0.03, 0.9, 30); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
  if (S.core) {                                         // 칼날을 가르는 빛의 심지
    const pu = 0.7 + Math.sin(t * 0.1) * 0.2;
    ctx.fillStyle = '#2a0a08'; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const u = 0.07 + i / 12 * 0.62, p = at(M, u), w = 1.9 * Math.sin(Math.min(1, i / 12 * 1.3) * Math.PI) + 0.3; i ? ctx.lineTo(p[0], p[1] - w) : ctx.moveTo(p[0], p[1] - w); } for (let i = 12; i >= 0; i--) { const u = 0.07 + i / 12 * 0.62, p = at(M, u), w = 1.9 * Math.sin(Math.min(1, i / 12 * 1.3) * Math.PI) + 0.3; ctx.lineTo(p[0], p[1] + w); } ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${glow},${pu})`; ctx.lineWidth = 1.8; ctx.beginPath(); line(M, 0.09, 0.67, 14); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${pu * 0.9})`; ctx.lineWidth = 0.7; ctx.stroke();
    drawGlow(ctx, G.len * 0.45, 0, G.len * 0.42, glow, 0.2 * pu, 1, 0.22); ctx.globalCompositeOperation = 'source-over';
  }
  if (S.stars) {                                        // 별자리
    const r2 = mulberry(9), pts = []; for (let k = 0; k < 7; k++) { const p = at(M, 0.08 + k * 0.125); pts.push([p[0] + (r2() - 0.5) * 2, p[1] + (r2() - 0.5) * G.W * 1.1]); }
    ctx.strokeStyle = 'rgba(255,236,170,0.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; pts.forEach((p, i) => { const tw = 0.5 + 0.5 * Math.sin(t * 0.12 + i * 1.7); ctx.fillStyle = `rgba(255,244,200,${0.6 + tw * 0.4})`; ctx.beginPath(); ctx.arc(p[0], p[1], 0.7 + tw * 0.5, 0, TAU); ctx.fill(); if (i % 2 === 0) drawGlow(ctx, p[0], p[1], 4 + tw * 2, '255,236,150', 0.4); }); ctx.globalCompositeOperation = 'source-over';
  }
  if (S.moon) { const p = at(M, 0.2); circleOl(ctx, p[0], p[1], 2.6, '#f4f8ff', ol, 0.8); ctx.fillStyle = c[1]; ctx.beginPath(); ctx.arc(p[0] + 1.2, p[1] - 0.6, 2.1, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, p[0], p[1], 9, glow, 0.4 + Math.sin(t * 0.07) * 0.15); ctx.globalCompositeOperation = 'source-over'; }
  if (S.pips) { for (const [u, n] of [[0.16, 1], [0.42, 2], [0.7, 3]]) { const p = at(M, u); ctx.fillStyle = '#1a1014'; for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(p[0] + (k - (n - 1) / 2) * 4.4, p[1] + (k - (n - 1) / 2) * (n === 2 ? 2.4 : 0), 1.25, 0, TAU); ctx.fill(); } } }
  if (S.split) { ctx.fillStyle = '#12121a'; ctx.beginPath(); polyPath(ctx, _flat(M).concat(_flat(B.slice().reverse()))); ctx.fill(); ctx.strokeStyle = '#d8dcf0'; ctx.lineWidth = 0.6; ctx.beginPath(); line(B, 0, 1, 20); ctx.stroke(); const p = at(M, 0.3), q = at(M, 0.6); ctx.fillStyle = '#12121a'; ctx.beginPath(); ctx.arc(p[0], p[1] - G.W * 0.45, 1, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2f2f6'; ctx.beginPath(); ctx.arc(q[0], q[1] + G.W * 0.45, 1, 0, TAU); ctx.fill(); }
  if (S.stripes) {                                      // 사탕 줄무늬
    ctx.save(); ctx.beginPath(); polyPath(ctx, _flat(T).concat(_flat(B.slice().reverse()))); ctx.clip();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = G.x0 - 6; x < G.len + 8; x += 8.5) { ctx.moveTo(x, -G.W - 4); ctx.lineTo(x + 7, G.W + 4); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(G.x0, -G.W + 0.6, G.len, 1.1); ctx.restore();
  }
  if (S.scales) { ctx.strokeStyle = c[0]; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = 0; k < 7; k++) { const u = 0.03 + k * 0.05, a = at(T, u), b = at(M, u); for (let j = 0; j < 2; j++) { const y = a[1] + (b[1] - a[1]) * (0.25 + j * 0.5), x = a[0] + (j ? 1.6 : 0); ctx.moveTo(x - 1.6, y - 1); ctx.quadraticCurveTo(x + 1.6, y, x - 1.6, y + 1); } } ctx.stroke(); }
  if (S.spine) { ctx.fillStyle = 'rgba(40,34,26,0.55)'; for (let i = 1; i < N - 3; i += 2) { ctx.beginPath(); ctx.ellipse(M[i][0], M[i][1], 1.1, 1.9, 0, 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(40,34,26,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); line(M, 0.02, 0.8, 16); ctx.stroke(); }
  if (S.wood) { ctx.strokeStyle = 'rgba(30,18,6,0.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); line(M, 0.03, 0.7, 16); ctx.save(); ctx.translate(0, -1.6); line(M, 0.1, 0.5, 10); ctx.restore(); ctx.stroke(); }
  if (S.vine) {                                         // 칼날을 감은 덩굴 + 잎
    ctx.strokeStyle = ol; ctx.lineWidth = 2.6; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const u = 0.02 + i / 30 * 0.66, p = at(M, u), y = p[1] + Math.sin(u * 26) * G.W * 0.95; i ? ctx.lineTo(p[0], y) : ctx.moveTo(p[0], y); } ctx.stroke();
    ctx.strokeStyle = trim[1]; ctx.lineWidth = 1.3; ctx.stroke();
    for (let k = 0; k < 4; k++) { const u = 0.1 + k * 0.16, p = at(M, u), s = k % 2 ? 1 : -1, y = p[1] + s * G.W * 0.9; ctx.beginPath(); ctx.moveTo(p[0], y); ctx.quadraticCurveTo(p[0] + 3.5, y + s * 4.6, p[0] + 7, y + s * 0.6); ctx.quadraticCurveTo(p[0] + 3.5, y - s * 0.6, p[0], y); ctx.lineWidth = 1.6; ctx.strokeStyle = ol; ctx.stroke(); ctx.fillStyle = trim[2]; ctx.fill(); }
  }
  if (S.pipes) {                                        // 증기관 + 리벳
    const a = at(T, 0.04), b = at(T, 0.6);
    ctx.strokeStyle = ol; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 1.8); ctx.lineTo(b[0], b[1] + 1.8); ctx.stroke(); ctx.strokeStyle = trim[1]; ctx.lineWidth = 1.9; ctx.stroke(); ctx.strokeStyle = trim[2]; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a[0], a[1] + 1.3); ctx.lineTo(b[0], b[1] + 1.3); ctx.stroke();
    ctx.fillStyle = trim[2]; for (let k = 0; k < 5; k++) { const p = at(M, 0.1 + k * 0.17); ctx.beginPath(); ctx.arc(p[0], p[1] + 0.6, 0.9, 0, TAU); ctx.fill(); }
    const p = at(M, 0.3); circleOl(ctx, p[0], p[1] + 0.4, 2.6, '#f4ecd8', ol, 0.9); ctx.strokeStyle = '#c8202a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p[0], p[1] + 0.4); ctx.lineTo(p[0] + Math.cos(t * 0.11) * 2, p[1] + 0.4 + Math.sin(t * 0.11) * 2); ctx.stroke();
  }
  if (S.strings) { ctx.strokeStyle = 'rgba(255,244,214,0.85)'; ctx.lineWidth = 0.45; ctx.beginPath(); for (const o of [-0.9, 0, 0.9]) { ctx.moveTo(13, o); const p = at(M, 0.7); ctx.lineTo(p[0], p[1] + o * 0.5 + Math.sin(t * 0.9 + o * 3) * 0.25); } ctx.stroke(); const p = at(M, 0.18); ctx.strokeStyle = c[0]; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(p[0] - 2, p[1] - 2.2); ctx.quadraticCurveTo(p[0] + 1.6, p[1] - 1.4, p[0], p[1]); ctx.quadraticCurveTo(p[0] - 1.6, p[1] + 1.4, p[0] + 2, p[1] + 2.2); ctx.stroke(); }
}

// ---------- 움직이는 이펙트 (칼날 주위) ----------
function drawBladeFx(ctx, S, G, glow, rune, t, id) {
  const M = G.mid, B = G.bot, T = G.top, N = M.length - 1, at = (A, u) => { const f = Math.min(N - 0.001, Math.max(0, u * N)), i = f | 0, k = f - i; return [A[i][0] + (A[i + 1][0] - A[i][0]) * k, A[i][1] + (A[i + 1][1] - A[i][1]) * k]; };
  const col = rune || glow, h = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  ctx.globalCompositeOperation = 'lighter';
  switch (S.fx) {
    case 'flame': case 'ember':
      for (let i = 0; i < (S.fx === 'flame' ? 9 : 5); i++) {
        const ph = ((t * (0.035 + h(i, 1) * 0.02) + h(i, 2)) % 1), u = 0.08 + h(i, 3) * 0.86, p = at(S.fx === 'flame' ? B : M, u);
        const x = p[0] - ph * 9, y = p[1] + (S.fx === 'flame' ? 1 : 0) - ph * (S.fx === 'flame' ? -7 : 9) * (i % 2 ? 1 : -1) * (S.fx === 'flame' ? 1 : 1), r = (S.fx === 'flame' ? 4.6 : 1.4) * (1 - ph);
        if (S.fx === 'flame') { ctx.fillStyle = `rgba(${col},${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x - r * 0.4, y + r * 2.4, x - r * 2.2 - ph * 4, y + r * 2.6); ctx.quadraticCurveTo(x + r * 0.2, y + r * 1.4, x + r, y); ctx.fill(); }
        else { ctx.fillStyle = `rgba(${col},${0.9 * (1 - ph)})`; ctx.fillRect(x, y, r, r); }
      }
      drawGlow(ctx, G.len * 0.55, 3, G.len * 0.5, glow, 0.16 + Math.sin(t * 0.2) * 0.04, 1, 0.3); break;
    case 'frost': case 'twinkle': case 'holy':
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.02 + h(i, 5)) % 1, u = 0.08 + h(i, 6 + Math.floor(t * 0.02 + h(i, 5))) * 0.86, p = at(M, u), a = Math.sin(ph * Math.PI), r = (S.fx === 'holy' ? 4.2 : 3.2) * a, y = p[1] + (h(i, 8) - 0.5) * G.W * 2.6;
        ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`; ctx.beginPath(); ctx.moveTo(p[0] - r, y); ctx.lineTo(p[0], y - r * 0.28); ctx.lineTo(p[0] + r, y); ctx.lineTo(p[0], y + r * 0.28); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(p[0], y - r); ctx.lineTo(p[0] + r * 0.28, y); ctx.lineTo(p[0], y + r); ctx.lineTo(p[0] - r * 0.28, y); ctx.closePath(); ctx.fill();
      }
      if (S.fx === 'holy') drawGlow(ctx, G.len * 0.55, 0, G.len * 0.5, glow, 0.14 + Math.sin(t * 0.06) * 0.05, 1, 0.3);
      break;
    case 'spark':
      for (let k = 0; k < 2; k++) {
        const seed = Math.floor(t / 3) + k * 17, u0 = h(seed, 1) * 0.7 + 0.05; if (h(seed, 9) < 0.35) continue;
        ctx.strokeStyle = `rgba(255,255,220,${0.6 + h(seed, 2) * 0.4})`; ctx.lineWidth = 0.9; ctx.beginPath();
        for (let j = 0; j < 5; j++) { const p = at(M, u0 + j * 0.05); const y = p[1] + (h(seed, 3 + j) - 0.5) * G.W * 3.4; j ? ctx.lineTo(p[0], y) : ctx.moveTo(p[0], y); } ctx.stroke();
      }
      drawGlow(ctx, G.len * 0.55, 0, G.len * 0.45, glow, 0.12, 1, 0.3); break;
    case 'drip':
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) { const ph = (t * 0.012 + h(i, 4)) % 1, p = at(B, 0.25 + h(i, 5) * 0.6), y = p[1] + ph * ph * 16, r = 1.5 * (1 - ph * 0.5); ctx.fillStyle = `rgba(${col},${0.9 * (1 - ph)})`; ctx.beginPath(); ctx.moveTo(p[0], y - r * 2.2); ctx.quadraticCurveTo(p[0] + r, y, p[0], y + r); ctx.quadraticCurveTo(p[0] - r, y, p[0], y - r * 2.2); ctx.fill(); }
      break;
    case 'void': case 'shadow': case 'mist':
      for (let i = 0; i < 5; i++) { const ph = (t * 0.014 + h(i, 4)) % 1, p = at(M, 0.15 + h(i, 5) * 0.8), a = Math.sin(ph * Math.PI) * (S.fx === 'mist' ? 0.16 : 0.3); drawGlow(ctx, p[0] - ph * 10, p[1] + (h(i, 7) - 0.5) * 12 + Math.sin(ph * 6 + i) * 3, 5 + ph * 7, S.fx === 'mist' ? '220,235,255' : col, a); }
      break;
    case 'wind':
      ctx.strokeStyle = `rgba(${col},0.5)`; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const ph = (t * 0.03 + i / 3) % 1, x = G.x0 + ph * (G.len - G.x0 - 8), a = Math.sin(ph * Math.PI); ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, 0, 3 + i, 6 + i * 1.5, 0.3, -1.9, 1.2); ctx.stroke(); }
      ctx.globalAlpha = 1; break;
    case 'chaos':
      for (let i = 0; i < 5; i++) { const ph = (t * 0.02 + h(i, 4)) % 1, p = at(i % 2 ? T : B, 0.1 + h(i, 5) * 0.8), q = hslRgb((t * 3 + i * 70) % 360, 0.9, 0.6), a = Math.sin(ph * Math.PI); ctx.fillStyle = `rgba(${q},${0.85 * a})`; const s = 1.6 + ph * 2; ctx.fillRect(p[0] - ph * 6, p[1] + (i % 2 ? -1 : 1) * ph * 8, s, s); }
      break;
    case 'rune':
      ctx.strokeStyle = `rgba(${col},${0.5 + Math.sin(t * 0.08) * 0.2})`; ctx.lineWidth = 0.8;
      for (const u of [0.3, 0.62]) { const p = at(M, u), a = t * 0.04 + u * 9; ctx.beginPath(); ctx.ellipse(p[0], p[1], 2.4, G.W * 2.1, 0, a, a + 4.6); ctx.stroke(); }
      break;
    case 'tick': { const p = at(M, 0.34); ctx.strokeStyle = `rgba(${col},0.8)`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, TAU); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(t * 0.1) * 2.4, p[1] + Math.sin(t * 0.1) * 2.4); ctx.stroke(); break; }
    case 'steam':
      for (let i = 0; i < 3; i++) { const ph = (t * 0.018 + i / 3) % 1, p = at(T, 0.12 + i * 0.2); drawGlow(ctx, p[0] - ph * 8, p[1] - 2 - ph * 12, 3 + ph * 6, '230,235,245', 0.22 * (1 - ph)); }
      break;
    case 'petal':
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) { const ph = (t * 0.012 + h(i, 4)) % 1, p = at(M, 0.2 + h(i, 5) * 0.7), x = p[0] - ph * 10 + Math.sin(ph * 8 + i) * 2, y = p[1] + ph * 14 - 4; ctx.fillStyle = `rgba(255,170,215,${0.9 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(x, y, 1.9, 1, ph * 6 + i, 0, TAU); ctx.fill(); }
      break;
    case 'note':
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 2; i++) { const ph = (t * 0.012 + i * 0.5) % 1, p = at(T, 0.3 + i * 0.35), x = p[0] - ph * 6, y = p[1] - 3 - ph * 12 + Math.sin(ph * 7) * 2, a = 1 - ph; ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath(); ctx.ellipse(x, y, 1.5, 1.1, -0.4, 0, TAU); ctx.fill(); ctx.fillRect(x + 1, y - 5, 0.7, 5); ctx.fillRect(x + 1, y - 5, 2.4, 0.9); }
      break;
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- 본체 ----------
function drawBladeBody(ctx, S, G, c, ol, plain, t, id) {
  const T = G.top, B = G.bot, M = G.mid, outer = _flat(T).concat(_flat(B.slice().reverse()));
  olPoly(ctx, outer, plain ? c[1] : c[0], ol, 1.6);
  if (plain) return;
  const single = (S.r ?? 0.5) !== 0.5 && S.tip === 'clip';
  // 밝은 면 (등 → 능선)
  const g = ctx.createLinearGradient(G.x0, 0, G.len, 0);
  const m12 = blMix(c[1], c[2], 0.45);
  if (S.hot) { g.addColorStop(0, c[0]); g.addColorStop(0.45, blMix(c[0], c[1], 0.6)); g.addColorStop(1, c[1]); }
  else if (S.matte) { g.addColorStop(0, c[1]); g.addColorStop(1, blMix(c[1], c[0], 0.3)); }
  else { g.addColorStop(0, c[1]); g.addColorStop(0.28, m12); g.addColorStop(0.42, c[1]); g.addColorStop(0.7, blMix(c[1], c[0], 0.25)); g.addColorStop(0.86, m12); g.addColorStop(1, c[1]); }
  ctx.fillStyle = g; ctx.beginPath(); polyPath(ctx, _flat(T).concat(_flat(M.slice().reverse()))); ctx.fill();
  if (single) {                                         // 외날 : 능선 아래가 가장 밝은 날
    ctx.fillStyle = S.hot ? c[2] : blMix(c[1], c[2], 0.75); ctx.beginPath(); polyPath(ctx, _flat(M).concat(_flat(B.slice().reverse()))); ctx.fill();
    ctx.strokeStyle = c[0]; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.beginPath(); T.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 0.9) : ctx.moveTo(p[0], p[1] + 0.9))); ctx.stroke();      // 칼등 그늘
  } else {                                              // 양날 : 아래 면은 어둡게, 날 끝만 밝게
    ctx.fillStyle = blMix(c[0], c[1], 0.3); ctx.beginPath(); polyPath(ctx, _flat(M).concat(_flat(B.slice().reverse()))); ctx.fill();
    ctx.strokeStyle = blMix(c[1], c[2], 0.8); ctx.lineWidth = 0.7; ctx.beginPath(); M.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath(); T.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] + 0.7) : ctx.moveTo(p[0], p[1] + 0.7))); ctx.stroke();
  }
  // 날빛
  ctx.strokeStyle = c[2]; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.beginPath(); B.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1] - 0.5) : ctx.moveTo(p[0], p[1] - 0.5))); ctx.stroke();
  // 벼린 날 : 날 끝을 따라 밝은 연마 띠 + 그 안쪽 얇은 그늘선
  if (!S.matte) {
    const hb = B.map((q, i) => [q[0], q[1] + (M[i][1] - q[1]) * 0.24]);
    ctx.fillStyle = S.hot ? 'rgba(255,240,200,0.45)' : blMix(c[1], c[2], 0.85); ctx.globalAlpha = 0.75; ctx.beginPath(); polyPath(ctx, _flat(B).concat(_flat(hb.slice().reverse()))); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.5; ctx.beginPath(); hb.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
  }
  // 리카소 (가드 바로 앞 어두운 띠)
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); polyPath(ctx, [T[0][0], T[0][1], T[0][0] + 2.6, T[0][1], B[0][0] + 2.6, B[0][1], B[0][0], B[0][1]]); ctx.fill();
  // 훑고 지나가는 반짝임
  if (!S.matte) {
    const N = M.length - 1, ph = (t * 0.011 + (id || 0) * 0.37) % 1.9;
    if (ph < 1) { const f = ph * (N - 1), i = f | 0, p = M[i], a = Math.sin(ph * Math.PI); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; const w = G.W * 0.9; ctx.beginPath(); polyPath(ctx, [p[0] - 2.4, p[1] + w, p[0] + 1, p[1] - w, p[0] + 3.4, p[1] - w, p[0], p[1] + w]); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  }
}

function drawPlayerBlade(ctx, J, pal, ent, opt) {
  const ol = pal.ol, Lk = ent.wlook || {};
  const plain = !!(opt.ghost || opt.flash), t = Game.time, id = ent.id || 0;
  let c = pal.blade, hilt = pal.hilt, trim = pal.trim, glow = '120,190,255', rune = null;
  if (!plain) {
    if (Lk.c) { c = Lk.c; if (Lk.hilt) hilt = Lk.hilt; if (Lk.trim) trim = Lk.trim; glow = Lk.glow || glow; rune = Lk.rune; }
    if (Lk.dyn) {                                   // 혼돈의 검 : 색이 계속 변한다
      const h = (t * 2.2) % 360, a = hslRgb(h, 0.7, 0.25), b = hslRgb(h, 0.8, 0.55), d = hslRgb(h, 0.9, 0.86);
      c = [`rgb(${a})`, `rgb(${b})`, `rgb(${d})`]; glow = rune = b.join(',');
    }
  }
  const len = RIG_PLAYER.wlen * (Lk.L || 1);
  weaponFrame(ctx, J.hand1, J.wAng);
  if (Lk.karam) { drawKarambit(ctx, Lk, c, hilt, trim, ol, ent.bladeGlow || 0, plain); ctx.restore(); return; }
  const S = bladeStyle(Lk), gl = ent.bladeGlow || 0;
  if (S.form === 'scythe') {
    drawScythe(ctx, S, c, hilt, trim, ol, glow, rune, len, plain, t);
    drawBladePommel(ctx, S, hilt, trim, ol, glow, plain, t);
    if (!plain) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const ph = (t * 0.014 + i * 0.25) % 1; drawGlow(ctx, len - 6 - ph * 14, 6 + i * 8 + Math.sin(ph * 6 + i) * 3, 4 + ph * 7, glow, Math.sin(ph * Math.PI) * 0.3); }
      if (gl > 0) { ctx.globalAlpha = Math.min(1, gl) * 0.9; for (let i = 0; i < 5; i++) drawGlow(ctx, len - 2 - i * 5, -4 + i * 10, 18, glow, 0.4); ctx.globalAlpha = 1; }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore(); return;
  }
  const G = bladeGeom(S, len);
  if (!plain) drawBladeBack(ctx, S, G, c, trim, ol, glow, rune, t);
  drawBladeGrip(ctx, S, hilt, trim, ol, glow, plain);
  drawBladePommel(ctx, S, hilt, trim, ol, glow, plain, t);
  if (S.form === 'laser') { drawLaserBlade(ctx, S, c, hilt, trim, ol, glow, len, plain, t, gl); ctx.restore(); return; }
  drawBladeBody(ctx, S, G, c, ol, plain, t, id);
  if (!plain) { drawBladeDeco(ctx, S, G, c, trim, ol, glow, rune, t); drawBladeExtra(ctx, S, G, c, trim, ol, glow, rune, t, id); }
  drawBladeGuard(ctx, S, trim, ol, glow, plain, t, G.W);
  if (!plain) {
    if (S.fx) drawBladeFx(ctx, S, G, glow, rune, t, id);
    if (rune && !S.ridgeGlow && !S.core && !S.runes && !S.cracks) {          // 은은한 기운
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, len * 0.55, 0, len * 0.5, rune, 0.1 + Math.sin(t * 0.12 + id) * 0.04, 1, 0.22);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (id !== undefined && Lk.glow) {                                     // 테두리 빛 (어두운 곳에서도 검의 윤곽이 산다)
      ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      ctx.strokeStyle = `rgba(${glow},${0.22 + Math.sin(t * 0.07 + id) * 0.06})`; ctx.lineWidth = 1.3;
      ctx.beginPath(); polyPath(ctx, _flat(G.top).concat(_flat(G.bot.slice().reverse()))); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    {                                                                        // 칼끝의 별빛 (가끔 반짝)
      const ph = (t * 0.008 + id * 0.29) % 1;
      if (ph < 0.12) {
        const a = Math.sin(ph / 0.12 * Math.PI), tp = G.top[G.top.length - 1], bp = G.bot[G.bot.length - 1], x = (tp[0] + bp[0]) / 2 - 2, y = (tp[1] + bp[1]) / 2, r = 7 * a;
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${0.95 * a})`;
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x, y - r * 0.18); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 0.18); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.18, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.18, y); ctx.closePath(); ctx.fill();
        drawGlow(ctx, x, y, r * 1.6, glow, 0.5 * a); ctx.globalCompositeOperation = 'source-over';
      }
    }
    if (gl > 0) {                                                            // 기 발산
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, gl) * 0.9;
      ctx.fillStyle = `rgba(${glow},0.5)`; ctx.beginPath(); polyPath(ctx, _flat(G.top).concat(_flat(G.bot.slice().reverse()))); ctx.fill();
      ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(${glow},0.3)`; ctx.lineWidth = 7; ctx.stroke();
      for (let i = 0; i < 5; i++) { const p = G.mid[Math.min(G.mid.length - 1, Math.round(i / 4 * (G.mid.length - 1)))]; drawGlow(ctx, p[0], p[1], 16, glow, 0.35); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore();
}
