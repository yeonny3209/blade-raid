'use strict';
// ============================================================
//  그림 엔진 : Path2D 도형 + 화면 기준 빛의 셀 셰이딩 + 재질
//   - 빛은 언제나 화면 왼쪽 위에서 온다 (도형이 돌거나 뒤집혀도 그늘이 맞게 붙는다)
//   - 그늘은 차갑게(보랏빛), 빛은 따뜻하게 색이 기운다
//   - PT.fill(ctx, path, 색 | [어두운, 기본, 밝은], 옵션) 하나로 외곽선 · 그늘 · 반사광 · 테두리광 · 광택 · 질감
// ============================================================
const PT = (() => {
  const T = {};
  T.LX = -0.48; T.LY = -0.88;          // 빛이 오는 쪽 (화면 기준)
  T.ol = '#120a14';
  T.q = 2;                              // 2 = 전부, 1 = 테두리광 · 질감 생략, 0 = 단색
  const ID = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

  // ---------- 색 ----------
  const _rgb = new Map();
  function rgb(c) {
    let v = _rgb.get(c); if (v) return v;
    if (c[0] === '#') {
      const h = c.length === 4 ? c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : c.slice(1, 7);
      v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    } else { const m = c.match(/[\d.]+/g); v = m ? [+m[0], +m[1], +m[2]] : [128, 128, 128]; }
    _rgb.set(c, v); return v;
  }
  const hx = n => (n < 16 ? '0' : '') + n.toString(16);
  const _mix = new Map();
  T.mix = (a, b, t) => {
    const k = a + '|' + b + '|' + t; let v = _mix.get(k); if (v) return v;
    const A = rgb(a), B = rgb(b);
    v = '#' + hx(Math.round(A[0] + (B[0] - A[0]) * t)) + hx(Math.round(A[1] + (B[1] - A[1]) * t)) + hx(Math.round(A[2] + (B[2] - A[2]) * t));
    if (_mix.size > 6000) _mix.clear(); _mix.set(k, v); return v;
  };
  T.rgba = (c, a) => { const v = rgb(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
  T.dk = (c, t) => T.mix(c, '#170c2a', t);
  T.lt = (c, t) => T.mix(c, '#fff4dc', t);
  T.solid = c => typeof c === 'string' && (c[0] === '#' || c.startsWith('rgb(')) ;
  const _mat = new Map();
  // 재질 : b 기본, d 그늘, dd 깊은 그늘, l 반사광, s 광택, r 테두리광
  T.mat = c => {
    if (Array.isArray(c)) { const k = c.join(); let m = _mat.get(k); if (!m) { m = { b: c[1], d: c[0], dd: T.dk(c[0], 0.35), l: c[2] || T.lt(c[1], 0.3), s: T.lt(c[2] || c[1], 0.55), r: T.mix(c[1], '#cfe6ff', 0.5) }; _mat.set(k, m); } return m; }
    let m = _mat.get(c);
    if (!m) { m = { b: c, d: T.dk(c, 0.36), dd: T.dk(c, 0.6), l: T.lt(c, 0.3), s: T.lt(c, 0.68), r: T.mix(c, '#cfe6ff', 0.5) }; _mat.set(c, m); }
    return m;
  };

  // ---------- 도형 (Path2D + 경계 상자 bb) ----------
  const bbOf = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < pts.length; i += 2) { const x = pts[i], y = pts[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; };
  T.poly = pts => { const p = new Path2D(); polyPath(p, pts); p.bb = bbOf(pts); return p; };
  T.sm = (pts, t = 1) => { const p = new Path2D(); smoothPoly(p, pts, t); p.bb = bbOf(pts); return p; };
  T.cap = (x0, y0, x1, y1, r0, r1 = r0) => {
    const p = new Path2D(); capsulePath(p, { x: x0, y: y0 }, { x: x1, y: y1 }, r0, r1);
    p.bb = [Math.min(x0 - r0, x1 - r1), Math.min(y0 - r0, y1 - r1), Math.max(x0 + r0, x1 + r1), Math.max(y0 + r0, y1 + r1)];
    p.th = Math.max(r0, r1) * 2; return p;
  };
  T.ell = (x, y, rx, ry, rot = 0) => {
    rx = Math.max(0.1, rx); ry = Math.max(0.1, ry);
    const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU);
    const r = Math.max(rx, ry); p.bb = [x - r, y - r, x + r, y + r]; p.th = Math.min(rx, ry) * 2; return p;
  };
  // 자유 도형 : fn(p) 로 그리고 bb 를 직접 준다
  T.path = (fn, bb) => { const p = new Path2D(); fn(p); p.bb = bb; return p; };
  // 굵기가 변하는 띠 (척추 · 꼬리 · 촉수) : pts = [x,y,...], w(i/n) = 반폭
  T.strip = (pts, w0, w1, wf) => {
    const n = pts.length >> 1, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 2, b = Math.min(n - 1, i + 1) * 2, dx = pts[b] - pts[a], dy = pts[b + 1] - pts[a + 1], len = Math.hypot(dx, dy) || 1;
      const u = i / (n - 1 || 1), w = wf ? wf(u) : w0 + (w1 - w0) * u, nx = -dy / len * w, ny = dx / len * w;
      L.push(pts[i * 2] + nx, pts[i * 2 + 1] + ny); R.push(pts[i * 2] - nx, pts[i * 2 + 1] - ny);
    }
    const out = L.slice(); for (let i = R.length - 2; i >= 0; i -= 2) out.push(R[i], R[i + 1]);
    const p = T.sm(out, 0.85); p.th = Math.max(w0, w1) * 2; return p;
  };

  // 지금 좌표계에서 빛 쪽 단위 벡터
  T.lv = ctx => {
    const m = ctx.getTransform(), det = m.a * m.d - m.b * m.c || 1;
    const vx = (m.d * T.LX - m.c * T.LY) / det, vy = (-m.b * T.LX + m.a * T.LY) / det, L = Math.hypot(vx, vy) || 1;
    return [vx / L, vy / L];
  };

  // ---------- 질감 ----------
  const TEX = {};
  function mkTex(kind) {
    const S = 96, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
    let seed = 7 + kind.length * 31; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    if (kind === 'stone') {
      for (let i = 0; i < 70; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(rnd() * S, rnd() * S, 1 + rnd() * 3, 0.8 + rnd() * 2, rnd() * 3, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) { let x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rnd() - 0.5) * 22; y += (rnd() - 0.3) * 16; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === 'scale') {
      g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1.4;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const x = c * 16 + (r % 2) * 8, y = r * 14; g.beginPath(); g.arc(x, y, 9, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const x = c * 16 + (r % 2) * 8, y = r * 14 - 3; g.beginPath(); g.arc(x, y, 5, 1.15 * Math.PI, 1.6 * Math.PI); g.stroke(); }
    } else if (kind === 'fur') {
      g.lineCap = 'round';
      for (let i = 0; i < 120; i++) { const x = rnd() * S, y = rnd() * S, l = 4 + rnd() * 7; g.strokeStyle = rnd() < 0.55 ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.4)'; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2, y + l * 0.5, x + 1 + rnd() * 2, y + l); g.stroke(); }
    } else if (kind === 'metal') {
      for (let i = 0; i < 40; i++) { g.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)'; g.lineWidth = 0.6 + rnd() * 0.8; const y = rnd() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (rnd() - 0.5) * 3); g.stroke(); }
    } else if (kind === 'cloth') {
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; for (let i = 0; i < S; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S * 0.5, S); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.16)'; for (let i = 2; i < S; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i - S * 0.5, S); g.stroke(); }
    } else if (kind === 'skin') {
      for (let i = 0; i < 90; i++) { g.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)'; g.beginPath(); g.arc(rnd() * S, rnd() * S, 0.6 + rnd() * 1.6, 0, TAU); g.fill(); }
    } else if (kind === 'wood') {
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.2;
      for (let i = 0; i < 10; i++) { const x0 = rnd() * S; g.beginPath(); g.moveTo(x0, 0); g.bezierCurveTo(x0 + (rnd() - 0.5) * 20, S * 0.3, x0 + (rnd() - 0.5) * 20, S * 0.7, x0, S); g.stroke(); }
    }
    return g.createPattern(cv, 'repeat');
  }
  T.tex = kind => TEX[kind] || (TEX[kind] = mkTex(kind));

  // ---------- 칠하기 ----------
  // o : ow 외곽선 굵기(기본 2) · ol 외곽선 색 · sh 그늘 크기 배율 · hl 반사광 배율 · rim 테두리광 · spec 광택(0..1)
  //     tex 질감 이름 · ta 질감 진하기 · grad 부드러운 명암 · flat 음영 없음 · gloss 금속 띠
  T.fill = (ctx, p, c, o) => {
    o = o || {};
    const ow = o.ow ?? 2;
    if (ow > 0) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.ol || T.ol; ctx.lineWidth = ow * 2; ctx.stroke(p); }
    const arr = Array.isArray(c), base = arr ? c[1] : c;
    ctx.fillStyle = base; ctx.fill(p);
    if (T.q === 0 || o.flat || !(arr || T.solid(c)) || (arr && c[0] === c[1])) return;
    const bb = p.bb; if (!bb) return;
    const W = bb[2] - bb[0], H = bb[3] - bb[1], sz = p.th || Math.min(W, H);
    if (sz < 2.5) return;
    const M = T.mat(c), v = T.lv(ctx), vx = v[0], vy = v[1];
    const pad = sz + 6, rx = bb[0] - pad, ry = bb[1] - pad, rw = W + pad * 2, rh = H + pad * 2;
    ctx.save(); ctx.clip(p);
    // 부드러운 명암
    if (o.grad !== false && sz > 14) {
      const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, R = Math.max(W, H) * 0.55;
      const g = ctx.createLinearGradient(cx + vx * R, cy + vy * R, cx - vx * R, cy - vy * R);
      g.addColorStop(0, 'rgba(255,246,225,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(20,8,40,0.22)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    }
    if (o.tex && T.q > 1) { ctx.globalAlpha *= o.ta ?? 0.5; ctx.fillStyle = T.tex(o.tex); ctx.fillRect(rx, ry, rw, rh); ctx.globalAlpha /= o.ta ?? 0.5; }
    // 그늘 (빛 반대쪽 초승달)
    const s = sz * 0.27 * (o.sh ?? 1);
    let q = new Path2D(); q.rect(rx, ry, rw, rh); q.addPath(p, { a: 1, b: 0, c: 0, d: 1, e: vx * s, f: vy * s });
    ctx.fillStyle = M.d; ctx.fill(q, 'evenodd');
    if (sz > 9 && (o.sh ?? 1) > 0) {
      const s2 = s * 0.38; q = new Path2D(); q.rect(rx, ry, rw, rh); q.addPath(p, { a: 1, b: 0, c: 0, d: 1, e: vx * s2, f: vy * s2 });
      ctx.fillStyle = M.dd; ctx.globalAlpha *= 0.55; ctx.fill(q, 'evenodd'); ctx.globalAlpha /= 0.55;
    }
    // 반사광 (빛 쪽 가장자리)
    if ((o.hl ?? 1) > 0) {
      const h = sz * 0.1 * (o.hl ?? 1); q = new Path2D(); q.rect(rx, ry, rw, rh); q.addPath(p, { a: 1, b: 0, c: 0, d: 1, e: -vx * h, f: -vy * h });
      ctx.fillStyle = M.l; ctx.fill(q, 'evenodd');
    }
    // 테두리광 (빛 반대쪽 아주 얇은 차가운 빛)
    if (o.rim && T.q > 1 && sz > 8) {
      const r = Math.max(0.9, sz * 0.045); q = new Path2D(); q.rect(rx, ry, rw, rh); q.addPath(p, { a: 1, b: 0, c: 0, d: 1, e: vx * r, f: vy * r });
      ctx.fillStyle = typeof o.rim === 'string' ? o.rim : M.r; ctx.globalAlpha *= 0.75; ctx.fill(q, 'evenodd'); ctx.globalAlpha /= 0.75;
    }
    // 금속 띠 : 빛과 수직인 날카로운 반사 줄
    if (o.gloss) {
      const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, R = Math.max(W, H) * 0.6;
      const g = ctx.createLinearGradient(cx + vx * R, cy + vy * R, cx - vx * R, cy - vy * R);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(255,255,255,0.05)'); g.addColorStop(0.36, 'rgba(255,255,255,' + (0.55 * o.gloss) + ')'); g.addColorStop(0.42, 'rgba(255,255,255,0.08)'); g.addColorStop(0.62, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(10,0,30,' + (0.25 * o.gloss) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
    }
    ctx.restore();
    // 광택 점
    if (o.spec) {
      const cx = (bb[0] + bb[2]) / 2 + vx * W * 0.24, cy = (bb[1] + bb[3]) / 2 + vy * H * 0.24;
      ctx.fillStyle = T.rgba(M.s, 0.85 * o.spec); ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.6, W * 0.13), Math.max(0.5, H * 0.07), Math.atan2(vy, vx) + Math.PI / 2, 0, TAU); ctx.fill();
    }
  };

  // 줄 (외곽선 포함)
  T.line = (ctx, pts, col, w, ow = 0, cap = 'round') => {
    ctx.lineCap = cap; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (ow) { ctx.strokeStyle = T.ol; ctx.lineWidth = w + ow * 2; ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  };
  T.curve = (ctx, pts, col, w, ow = 0) => {      // 부드러운 열린 곡선
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length - 2; i += 2) { const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2; ctx.quadraticCurveTo(pts[i], pts[i + 1], mx, my); }
    ctx.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
    if (ow) { ctx.strokeStyle = T.ol; ctx.lineWidth = w + ow * 2; ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  };
  T.dot = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  T.glow = (ctx, x, y, r, col, a = 1, sx = 1, s2 = 1) => { const g = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, r, col, a, sx, s2); ctx.globalCompositeOperation = g; };
  // 빛나는 줄 (균열 · 문양) : 넓은 빛 + 밝은 심
  T.neon = (ctx, pts, col, w, a = 1) => {
    const g = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = `rgba(${col},${0.22 * a})`; ctx.lineWidth = w * 4; ctx.stroke();
    ctx.strokeStyle = `rgba(${col},${0.7 * a})`; ctx.lineWidth = w * 1.6; ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.85 * a})`; ctx.lineWidth = w * 0.6; ctx.stroke();
    ctx.globalCompositeOperation = g;
  };
  // 빛나는 눈 : 검은 눈구멍 + 빛 + 흰 심
  T.geye = (ctx, x, y, rx, ry, col, a = 1, rot = 0) => {
    ctx.fillStyle = '#0a0410'; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.35, ry * 1.5, rot, 0, TAU); ctx.fill();
    T.glow(ctx, x, y, rx * 4.5, col, 0.55 * a);
    ctx.fillStyle = `rgba(${col},1)`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + rx * 0.15, y, rx * 0.45, ry * 0.45, rot, 0, TAU); ctx.fill();
  };
  // 이빨 줄 : 위(dir=1) 또는 아래(dir=-1) 로 향한 삼각 이빨
  T.teeth = (ctx, x0, y0, x1, y1, n, len, col = '#f4ecd8', dir = 1) => {
    const p = new Path2D(), dx = (x1 - x0) / n, dy = (y1 - y0) / n;
    for (let i = 0; i < n; i++) { const ax = x0 + dx * i, ay = y0 + dy * i, l = len * (0.75 + 0.25 * Math.sin(i * 2.3 + 1)); p.moveTo(ax, ay); p.lineTo(ax + dx * 0.5, ay + dy * 0.5 + l * dir); p.lineTo(ax + dx, ay + dy); p.closePath(); }
    ctx.lineJoin = 'round'; ctx.strokeStyle = T.ol; ctx.lineWidth = 1.6; ctx.stroke(p); ctx.fillStyle = col; ctx.fill(p);
  };

  // 간단한 프레임 시간 기반 품질 조절 (느린 기기에서는 테두리광 · 질감부터 끈다)
  let acc = 0, n = 0;
  T.tick = ms => { acc += ms; if (++n >= 90) { const avg = acc / n; acc = 0; n = 0; if (avg > 13 && T.q > 1) T.q = 1; else if (avg < 7 && T.q < 2 && !T.lock) T.q = 2; } };
  return T;
})();
