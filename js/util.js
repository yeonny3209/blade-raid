'use strict';
// ============================================================
//  공용 상수 / 유틸리티
// ============================================================
const W = 1280, H = 720;
const GROUND_Y = 384;        // 깊이 y=0 이 화면에 그려지는 위치
const DEPTH = 228;           // 이동 가능한 깊이 범위
const DEG = Math.PI / 180, TAU = Math.PI * 2;

const FONT_T = "'Black Han Sans', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const FONT_B = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";

// 모바일(터치) 기기 판별 : 해상도 상한과 터치 UI 를 결정
const IS_MOBILE = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)
  || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => (v < 0 ? -1 : 1);
const choose = a => a[(Math.random() * a.length) | 0];
const approach = (v, t, s) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t));
const chance = p => Math.random() < p;

const Ease = {
  lin: t => t,
  in: t => t * t,
  out: t => 1 - (1 - t) * (1 - t),
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out3: t => 1 - Math.pow(1 - t, 3),
  out5: t => 1 - Math.pow(1 - t, 5),
  in3: t => t * t * t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: t => (t === 0 || t === 1) ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1,
};

// 월드(x, 깊이 y, 높이 z) → 카메라 적용 전 화면 y
const sy = (y, z) => GROUND_Y + y - z;

function fmt(n) { return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// ---------- 발광 스프라이트 캐시 ----------
const _glow = {};
function glowSprite(rgb) {
  let c = _glow[rgb];
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${rgb},1)`);
  gr.addColorStop(0.18, `rgba(${rgb},0.75)`);
  gr.addColorStop(0.45, `rgba(${rgb},0.22)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  _glow[rgb] = c;
  return c;
}
function drawGlow(ctx, x, y, r, rgb, a = 1, sx = 1, syy = 1) {
  if (a <= 0 || r <= 0) return;
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * a;
  ctx.drawImage(glowSprite(rgb), x - r * sx, y - r * syy, r * 2 * sx, r * 2 * syy);
  ctx.globalAlpha = pa;
}

// 결정적 난수 (배경 생성용)
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 색 보간 '#rrggbb'
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
