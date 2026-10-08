'use strict';
// ============================================================
//  제2지역 배경 10종 (핏빛 성 / 수정 동굴 / 해저 / 묘지 / 밀림 / 시계탑 / 네온 도시 / 뇌운 / 은하 / 혼돈)
//  themes.js 와 같은 규약 : f,m,g,fg = 원경 / 중경 / 지면 / 전경, bg.lights, bg.glow
// ============================================================
const FLOOR_Y = GROUND_Y + 24;            // 중경 오브젝트가 땅에 닿는 선

function starField(f, farW, n, maxY, rnd, rgb = '230,240,255') {
  for (let i = 0; i < n; i++) { f.fillStyle = `rgba(${rgb},${rnd() * 0.8})`; f.fillRect(rnd() * farW, rnd() * maxY, 1.5, 1.5); }
}
function glowOrb(f, x, y, r, rgb, a = 0.5) {
  const g = f.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  f.fillStyle = g; f.fillRect(x - r, y - r, r * 2, r * 2);
}
function groundFill(g, w, c0, c1) {
  const gh = H - GROUND_Y + 44, gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  return gh;
}
function newGlow(bg, w, gh) {
  const c = makeCanvas(w * bg.scale, gh * bg.scale), gg = c.getContext('2d'); gg.scale(bg.scale, bg.scale);
  return [c, gg];
}

// ---------------- 핏빛 달의 성 ----------------
function buildBloodmoon(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#12030a'], [0.5, '#3a0a1a'], [1, '#6a1a28']]);
  const mx = farW * 0.55;
  glowOrb(f, mx, 130, 300, '255,40,50', 0.5);
  f.fillStyle = '#ff5a4a'; f.beginPath(); f.arc(mx, 130, 74, 0, TAU); f.fill();
  f.fillStyle = 'rgba(160,20,30,0.45)'; f.beginPath(); f.arc(mx + 18, 120, 18, 0, TAU); f.arc(mx - 26, 150, 12, 0, TAU); f.arc(mx + 4, 160, 9, 0, TAU); f.fill();
  for (let i = 0; i < 14; i++) {                                            // 박쥐
    const bx = rnd() * farW, by = 60 + rnd() * 160, s = 0.6 + rnd();
    f.fillStyle = '#0a0206'; f.beginPath(); f.moveTo(bx, by); f.quadraticCurveTo(bx - 14 * s, by - 10 * s, bx - 24 * s, by + 2 * s); f.quadraticCurveTo(bx - 12 * s, by + 2 * s, bx, by + 6 * s);
    f.quadraticCurveTo(bx + 12 * s, by + 2 * s, bx + 24 * s, by + 2 * s); f.quadraticCurveTo(bx + 14 * s, by - 10 * s, bx, by); f.fill();
  }
  ridge(f, farW, '#1a0610', 300, 60, 46, rnd);
  for (let x = 120 + rnd() * 200; x < farW; x += 380 + rnd() * 260) {          // 먼 고성
    const h = 180 + rnd() * 120;
    f.fillStyle = '#10040a'; f.fillRect(x - 40, GROUND_Y + 30 - h, 80, h);
    f.beginPath(); f.moveTo(x - 50, GROUND_Y + 30 - h); f.lineTo(x, GROUND_Y + 30 - h - 70); f.lineTo(x + 50, GROUND_Y + 30 - h); f.fill();
    f.fillStyle = 'rgba(255,170,60,0.75)'; f.fillRect(x - 6, GROUND_Y + 30 - h + 30, 12, 22);
  }
  haze(f, farW, 'rgba(160,30,50,A)', 250);
  for (let x = 60 + rnd() * 100; x < midW; x += 230 + rnd() * 140) {          // 중경 : 고딕 아치 + 스테인드글라스
    const wd = 70 + rnd() * 30, top = 90 + rnd() * 50;
    m.fillStyle = '#1e0a12'; m.fillRect(x - wd, top, wd * 2, FLOOR_Y - top);
    m.fillStyle = '#2c1018'; m.fillRect(x - wd, top, 14, FLOOR_Y - top); m.fillRect(x + wd - 14, top, 14, FLOOR_Y - top);
    m.fillStyle = '#0a0206'; m.beginPath(); m.moveTo(x - wd + 24, FLOOR_Y); m.lineTo(x - wd + 24, top + 120); m.quadraticCurveTo(x, top + 20, x + wd - 24, top + 120); m.lineTo(x + wd - 24, FLOOR_Y); m.fill();
    const gr = m.createLinearGradient(0, top + 60, 0, top + 190); gr.addColorStop(0, 'rgba(255,60,60,0.75)'); gr.addColorStop(1, 'rgba(255,170,60,0.55)');
    m.fillStyle = gr; m.beginPath(); m.moveTo(x - 22, top + 190); m.lineTo(x - 22, top + 110); m.quadraticCurveTo(x, top + 60, x + 22, top + 110); m.lineTo(x + 22, top + 190); m.fill();
    m.strokeStyle = '#0a0206'; m.lineWidth = 3; m.beginPath(); m.moveTo(x, top + 80); m.lineTo(x, top + 190); m.moveTo(x - 22, top + 140); m.lineTo(x + 22, top + 140); m.stroke();
    bg.lights.push({ type: 'crystal', x, y: top + 140, r: 130, col: '255,70,60' });
    if (rnd() < 0.7) bg.lights.push({ type: 'torch', x: x - wd - 16, y: top + 150 });
  }
  const gh = groundFill(g, w, '#1c0a10', '#35121c');
  groundNoise(g, w, rnd, ['#2a0e18', '#10040a', '#4a1624'], w * 0.8, 16);
  g.fillStyle = 'rgba(120,10,24,0.55)'; g.fillRect(0, gh * 0.4, w, gh * 0.22);               // 붉은 카펫
  g.strokeStyle = 'rgba(220,170,60,0.6)'; g.lineWidth = 2; g.strokeRect(-4, gh * 0.4, w + 8, gh * 0.22);
  for (let i = 0; i < w / 150; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 80); g.fillStyle = 'rgba(150,10,25,0.6)'; g.beginPath(); g.ellipse(px, py, 22 + rnd() * 30, 6 + rnd() * 6, 0, 0, TAU); g.fill(); }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = '#080206';
  for (let x = 0; x < fgW; x += 90 + rnd() * 160) { fg.fillRect(x, -10, 5, 50 + rnd() * 80); fg.beginPath(); fg.moveTo(x - 6, 40 + rnd() * 60); fg.lineTo(x + 2.5, 20); fg.lineTo(x + 11, 40 + rnd() * 60); fg.fill(); }
}

// ---------------- 수정 심연 동굴 ----------------
function buildCrystal(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#07041a'], [0.5, '#150a38'], [1, '#2a1a58']]);
  const cols = ['120,220,255', '255,130,230', '170,140,255', '120,255,190'];
  for (let i = 0; i < farW / 70; i++) {                                         // 천장 종유석
    const x = rnd() * farW, h = 60 + rnd() * 170, wd = 18 + rnd() * 30;
    f.fillStyle = '#0c0724'; f.beginPath(); f.moveTo(x - wd, -5); f.lineTo(x + 3, h); f.lineTo(x + wd, -5); f.fill();
  }
  for (let i = 0; i < farW / 90; i++) {                                         // 먼 수정
    const x = rnd() * farW, h = 80 + rnd() * 160, c = cols[(rnd() * 4) | 0];
    f.fillStyle = `rgba(${c},0.22)`; f.beginPath(); f.moveTo(x - 22, GROUND_Y + 30); f.lineTo(x - 6, GROUND_Y + 30 - h); f.lineTo(x + 10, GROUND_Y + 30 - h * 0.8); f.lineTo(x + 26, GROUND_Y + 30); f.fill();
  }
  glowOrb(f, farW * 0.5, 200, 380, '170,140,255', 0.22);
  haze(f, farW, 'rgba(150,120,255,A)', 240);
  for (let x = 40 + rnd() * 80; x < midW; x += 150 + rnd() * 140) {            // 중경 : 큰 수정 군집
    const cx = x, base = FLOOR_Y, n = 3 + ((rnd() * 3) | 0);
    for (let k = 0; k < n; k++) {
      const h = 90 + rnd() * 190, wd = 16 + rnd() * 22, ox = (rnd() - 0.5) * 90, c = cols[(rnd() * 4) | 0];
      const lg = m.createLinearGradient(cx + ox - wd, 0, cx + ox + wd, 0);
      lg.addColorStop(0, `rgba(${c},0.55)`); lg.addColorStop(0.5, `rgba(255,255,255,0.78)`); lg.addColorStop(1, `rgba(${c},0.45)`);
      m.fillStyle = lg; m.beginPath(); m.moveTo(cx + ox - wd, base); m.lineTo(cx + ox - wd * 0.7, base - h * 0.85); m.lineTo(cx + ox, base - h); m.lineTo(cx + ox + wd * 0.7, base - h * 0.85); m.lineTo(cx + ox + wd, base); m.closePath(); m.fill();
      m.strokeStyle = 'rgba(255,255,255,0.4)'; m.lineWidth = 1.5; m.beginPath(); m.moveTo(cx + ox, base); m.lineTo(cx + ox, base - h); m.stroke();
    }
    bg.lights.push({ type: 'crystal', x: cx, y: base - 90, r: 150, col: cols[(rnd() * 4) | 0] });
  }
  const gh = groundFill(g, w, '#120a2c', '#241648');
  groundNoise(g, w, rnd, ['#2a1c58', '#0a0620', '#4a3290'], w * 0.8, 16);
  const [glow, gg] = newGlow(bg, w, gh);
  for (let i = 0; i < w / 60; i++) {                                           // 바닥 수정 조각 + 반사 빛
    const px = rnd() * w, py = 56 + rnd() * (gh - 70), k = 0.6 + py / gh, c = cols[(rnd() * 4) | 0];
    g.fillStyle = `rgba(${c},0.8)`; g.beginPath(); polyPath(g, [px, py - 14 * k, px + 6 * k, py, px - 6 * k, py]); g.fill();
    gg.fillStyle = `rgba(${c},0.35)`; gg.beginPath(); gg.ellipse(px, py, 16 * k, 5 * k, 0, 0, TAU); gg.fill();
  }
  groundShade(g, w); bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  for (let x = 0; x < fgW; x += 120 + rnd() * 200) { const h = 40 + rnd() * 110; fg.fillStyle = '#0a0620'; fg.beginPath(); fg.moveTo(x - 24, -5); fg.lineTo(x + 2, h); fg.lineTo(x + 26, -5); fg.fill(); fg.fillStyle = `rgba(${cols[(rnd() * 4) | 0]},0.4)`; fg.beginPath(); fg.moveTo(x - 6, -5); fg.lineTo(x + 2, h * 0.7); fg.lineTo(x + 10, -5); fg.fill(); }
}

// ---------------- 가라앉은 해저 신전 ----------------
function buildDeep(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#04283a'], [0.45, '#0a5070'], [1, '#12809a']]);
  for (let i = 0; i < farW / 140; i++) bg.lights.push({ type: 'shaft', x: rnd() * midW * 0.9, w: 50 + rnd() * 80 });
  for (let i = 0; i < farW / 90; i++) {                                         // 먼 물고기 떼
    const x = rnd() * farW, y = 100 + rnd() * 220, s = 0.5 + rnd() * 0.8;
    f.fillStyle = 'rgba(10,60,90,0.55)';
    for (let k = 0; k < 4; k++) { f.beginPath(); f.ellipse(x + k * 22 * s, y + Math.sin(k) * 8, 10 * s, 4 * s, 0, 0, TAU); f.fill(); f.beginPath(); f.moveTo(x + k * 22 * s - 8 * s, y + Math.sin(k) * 8); f.lineTo(x + k * 22 * s - 16 * s, y - 4 * s + Math.sin(k) * 8); f.lineTo(x + k * 22 * s - 16 * s, y + 4 * s + Math.sin(k) * 8); f.fill(); }
  }
  ridge(f, farW, '#0a3a50', 300, 60, 46, rnd);
  haze(f, farW, 'rgba(100,220,240,A)', 220);
  for (let x = 70 + rnd() * 100; x < midW; x += 210 + rnd() * 140) {            // 중경 : 부서진 신전 기둥 + 산호
    const top = 110 + rnd() * 120, wd = 26 + rnd() * 12;
    const cg = m.createLinearGradient(x - wd, 0, x + wd, 0); cg.addColorStop(0, '#2a6a80'); cg.addColorStop(0.5, '#6ac0cc'); cg.addColorStop(1, '#1e5a70');
    m.fillStyle = cg; m.fillRect(x - wd, top, wd * 2, FLOOR_Y - top);
    m.fillStyle = '#80d0d8'; m.fillRect(x - wd - 8, top - 10, wd * 2 + 16, 12);
    m.strokeStyle = 'rgba(10,50,70,0.5)'; m.lineWidth = 2; for (let k = -wd + 8; k < wd; k += 11) { m.beginPath(); m.moveTo(x + k, top + 4); m.lineTo(x + k, FLOOR_Y); m.stroke(); }
    m.strokeStyle = 'rgba(20,120,70,0.75)'; m.lineWidth = 5; m.lineCap = 'round';           // 해초
    for (let k = 0; k < 3; k++) { m.beginPath(); m.moveTo(x - wd - 10 + k * 8, FLOOR_Y); m.bezierCurveTo(x - wd + 8, FLOOR_Y - 60, x - wd - 24, FLOOR_Y - 110, x - wd, FLOOR_Y - 150 - k * 20); m.stroke(); }
    for (let k = 0; k < 4; k++) {                                                              // 산호
      const cx = x + (rnd() - 0.5) * 160, c = choose(['#ff7aa0', '#ffa050', '#c070ff']);
      m.strokeStyle = c; m.lineWidth = 5;
      for (let b = 0; b < 4; b++) { m.beginPath(); m.moveTo(cx, FLOOR_Y); m.quadraticCurveTo(cx + (b - 1.5) * 12, FLOOR_Y - 20, cx + (b - 1.5) * 20, FLOOR_Y - 34 - rnd() * 20); m.stroke(); }
    }
    if (rnd() < 0.6) bg.lights.push({ type: 'crystal', x: x + 30, y: FLOOR_Y - 60, r: 110, col: '120,255,230' });
  }
  const gh = groundFill(g, w, '#3a8a98', '#7ac0c0');
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2;                                      // 모래 물결 + 빛 그물
  for (let i = 0; i < gh / 5; i++) { const y = 46 + i * 5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3); g.stroke(); }
  groundNoise(g, w, rnd, ['#a8dcd8', '#2a6a78', '#d0f0e8'], w * 0.7, 18);
  for (let i = 0; i < w / 80; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 70); g.fillStyle = choose(['#f8e0d0', '#ffb0b0', '#c8e8f0']); g.beginPath(); g.ellipse(px, py, 7, 4, rnd(), 0, TAU); g.fill(); }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.strokeStyle = 'rgba(8,60,50,0.85)'; fg.lineWidth = 8; fg.lineCap = 'round';
  for (let x = 0; x < fgW; x += 80 + rnd() * 160) { fg.beginPath(); fg.moveTo(x, -5); fg.bezierCurveTo(x + 18, 40, x - 18, 80, x + 8, 120 + rnd() * 50); fg.stroke(); }
}

// ---------------- 망자의 공동묘지 ----------------
function buildGrave(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#080c14'], [0.5, '#16202c'], [1, '#2e3c48']]);
  const mx = farW * 0.4;
  glowOrb(f, mx, 120, 280, '190,220,230', 0.35);
  f.fillStyle = '#dfe9ee'; f.beginPath(); f.arc(mx, 120, 40, 0, TAU); f.fill();
  starField(f, farW, 70, 200, rnd);
  ridge(f, farW, '#0c141c', 290, 60, 44, rnd);
  f.strokeStyle = '#06090e'; f.lineWidth = 6;
  for (let i = 0; i < farW / 90; i++) { const x = rnd() * farW, h = 90 + rnd() * 140; f.beginPath(); f.moveTo(x, GROUND_Y + 30); f.lineTo(x + (rnd() - 0.5) * 20, GROUND_Y + 30 - h); f.moveTo(x, GROUND_Y + 30 - h * 0.55); f.lineTo(x + 34, GROUND_Y + 30 - h * 0.8); f.moveTo(x, GROUND_Y + 30 - h * 0.4); f.lineTo(x - 30, GROUND_Y + 30 - h * 0.65); f.stroke(); }
  haze(f, farW, 'rgba(170,200,210,A)', 200);
  for (let x = 40 + rnd() * 80; x < midW; x += 100 + rnd() * 120) {               // 묘비 / 십자가 / 납골당
    const r = rnd(), base = FLOOR_Y, h = 50 + rnd() * 70;
    m.fillStyle = '#3a4650';
    if (r < 0.45) { m.beginPath(); m.moveTo(x - 18, base); m.lineTo(x - 18, base - h + 14); m.quadraticCurveTo(x, base - h - 8, x + 18, base - h + 14); m.lineTo(x + 18, base); m.fill(); m.fillStyle = '#566672'; m.fillRect(x - 12, base - h + 20, 24, 3); }
    else if (r < 0.8) { m.fillRect(x - 5, base - h - 14, 10, h + 14); m.fillRect(x - 20, base - h + 4, 40, 9); m.fillStyle = '#566672'; m.fillRect(x - 5, base - h - 14, 3, h + 14); }
    else { m.fillStyle = '#2a343e'; m.fillRect(x - 55, base - 120, 110, 120); m.beginPath(); m.moveTo(x - 66, base - 120); m.lineTo(x, base - 170); m.lineTo(x + 66, base - 120); m.fill(); m.fillStyle = '#05080c'; m.fillRect(x - 20, base - 80, 40, 80); bg.lights.push({ type: 'crystal', x, y: base - 60, r: 90, col: '120,255,190' }); }
    if (rnd() < 0.2) bg.lights.push({ type: 'crystal', x: x + 20, y: base - 40 - rnd() * 60, r: 60, col: '140,255,200' });
  }
  const gh = groundFill(g, w, '#1c2620', '#2c3a30');
  groundNoise(g, w, rnd, ['#2e4034', '#101810', '#3e5242', '#52584a'], w * 0.9, 18);
  for (let i = 0; i < w / 90; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 70), k = 0.6 + py / gh; g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(px, py, 26 * k, 8 * k, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(210,200,170,0.8)'; g.fillRect(px - 5 * k, py - 7 * k, 11 * k, 3 * k); }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.strokeStyle = 'rgba(6,10,8,0.9)'; fg.lineWidth = 3;
  for (let x = 0; x < fgW; x += 18 + rnd() * 30) { const h = 30 + rnd() * 40; fg.beginPath(); fg.moveTo(x, 180); fg.lineTo(x + (rnd() - 0.5) * 14, 180 - h); fg.stroke(); }
}

// ---------------- 태고의 밀림 ----------------
function buildJungle(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#0e3a2a'], [0.5, '#2a7a3a'], [1, '#7ac060']]);
  for (let i = 0; i < farW / 150; i++) bg.lights.push({ type: 'shaft', x: rnd() * midW * 0.9, w: 40 + rnd() * 70 });
  for (let x = rnd() * 120; x < farW; x += 140 + rnd() * 150) {                    // 먼 거목 + 덩굴
    const wd = 36 + rnd() * 30; f.fillStyle = '#0e3022'; f.fillRect(x, 0, wd, GROUND_Y + 30);
    f.strokeStyle = '#1a5a30'; f.lineWidth = 4;
    for (let k = 0; k < 3; k++) { f.beginPath(); f.moveTo(x + k * 12, 0); f.bezierCurveTo(x + k * 12 + 20, 100, x + k * 12 - 20, 160, x + k * 12 + 6, 220 + rnd() * 80); f.stroke(); }
  }
  haze(f, farW, 'rgba(180,255,150,A)', 200);
  for (let x = 30 + rnd() * 60; x < midW; x += 120 + rnd() * 120) {                // 중경 : 고사리 / 큰 잎 / 발광 꽃
    const base = FLOOR_Y;
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + (k - 2.5) * 0.4, L = 90 + rnd() * 110;
      m.strokeStyle = choose(['#1c6a2a', '#2a8a34', '#3aa040']); m.lineWidth = 7; m.lineCap = 'round';
      m.beginPath(); m.moveTo(x, base); m.quadraticCurveTo(x + Math.cos(a) * L * 0.5, base + Math.sin(a) * L * 0.9, x + Math.cos(a) * L, base + Math.sin(a) * L * 0.55); m.stroke();
    }
    if (rnd() < 0.5) { const fx = x + (rnd() - 0.5) * 80, fy = base - 40 - rnd() * 40; m.fillStyle = choose(['#ff60a0', '#ffd040', '#c070ff']); for (let k = 0; k < 5; k++) { m.beginPath(); m.ellipse(fx + Math.cos(k * 1.256) * 9, fy + Math.sin(k * 1.256) * 9, 7, 4, k * 1.256, 0, TAU); m.fill(); } bg.lights.push({ type: 'crystal', x: fx, y: fy, r: 70, col: '255,210,120' }); }
  }
  const gh = groundFill(g, w, '#2a4a1c', '#4a6a2c');
  groundNoise(g, w, rnd, ['#3a5a20', '#1a3010', '#5a7a30', '#6a4a24'], w * 0.9, 18);
  g.strokeStyle = 'rgba(70,44,22,0.8)'; g.lineWidth = 4; g.lineCap = 'round';                // 뿌리
  for (let i = 0; i < w / 120; i++) { let x = rnd() * w, y = 60 + rnd() * (gh - 80); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += 14 + rnd() * 22; y += (rnd() - 0.5) * 12; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < w / 40; i++) { const px = rnd() * w, py = 52 + rnd() * (gh - 60); g.fillStyle = choose(['#6a8a2a', '#8aa030', '#a06a24']); g.beginPath(); g.ellipse(px, py, 7, 3, rnd() * 3, 0, TAU); g.fill(); }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  for (let x = 0; x < fgW; x += 150 + rnd() * 200) { fg.fillStyle = 'rgba(8,40,18,0.9)'; fg.beginPath(); fg.moveTo(x, -5); fg.quadraticCurveTo(x + 50, 40, x + 90 + rnd() * 30, 120 + rnd() * 40); fg.quadraticCurveTo(x + 30, 70, x - 40, 30); fg.closePath(); fg.fill(); }
}

// ---------------- 멈춰버린 시계탑 ----------------
function buildClock(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#1a1006'], [0.5, '#3a2810'], [1, '#6a4a1c']]);
  for (let x = farW * 0.25; x < farW; x += farW * 0.45) {                           // 거대한 시계판
    f.fillStyle = 'rgba(30,18,6,0.8)'; f.beginPath(); f.arc(x, 190, 150, 0, TAU); f.fill();
    f.strokeStyle = '#c9a050'; f.lineWidth = 6; f.beginPath(); f.arc(x, 190, 150, 0, TAU); f.stroke();
    f.lineWidth = 3; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; f.beginPath(); f.moveTo(x + Math.cos(a) * 124, 190 + Math.sin(a) * 124); f.lineTo(x + Math.cos(a) * 142, 190 + Math.sin(a) * 142); f.stroke(); }
    f.lineWidth = 8; f.beginPath(); f.moveTo(x, 190); f.lineTo(x + 70, 150); f.stroke(); f.lineWidth = 5; f.beginPath(); f.moveTo(x, 190); f.lineTo(x - 20, 100); f.stroke();
    glowOrb(f, x, 190, 260, '255,200,100', 0.18);
  }
  haze(f, farW, 'rgba(255,200,120,A)', 260);
  m.fillStyle = '#20140a'; m.fillRect(0, 70, midW, FLOOR_Y - 70);
  for (let x = 0; x < midW; x += 90) { m.fillStyle = `rgba(${60 + rnd() * 20 | 0},${40 + rnd() * 14 | 0},20,0.9)`; m.fillRect(x + 3, 76, 84, FLOOR_Y - 90); m.strokeStyle = 'rgba(0,0,0,0.4)'; m.lineWidth = 2; m.strokeRect(x + 3, 76, 84, FLOOR_Y - 90); }
  for (let x = 120 + rnd() * 100; x < midW; x += 240 + rnd() * 160) {              // 톱니바퀴 + 추
    bg.lights.push({ type: 'gear', x, y: 130 + rnd() * 140, r: 50 + rnd() * 50, spd: (rnd() < 0.5 ? 1 : -1) * (0.003 + rnd() * 0.005), c1: '#6a4a1c', c2: '#a8802c', c3: '#2a1a08' });
    if (rnd() < 0.6) { const px = x + 100; m.strokeStyle = '#c9a050'; m.lineWidth = 3; m.beginPath(); m.moveTo(px, 76); m.lineTo(px + 22, 300); m.stroke(); m.fillStyle = '#b08a38'; m.beginPath(); m.arc(px + 22, 306, 22, 0, TAU); m.fill(); bg.lights.push({ type: 'crystal', x: px + 22, y: 306, r: 70, col: '255,200,110' }); }
    if (rnd() < 0.5) bg.lights.push({ type: 'torch', x: x - 70, y: 260 });
  }
  m.fillStyle = '#2a1c0c'; m.fillRect(0, FLOOR_Y - 4, midW, 40);
  const gh = groundFill(g, w, '#3a2a14', '#5a4020');
  const tile = 52;
  for (let y = 46, r = 0; y < gh; y += tile * 0.5, r++) for (let x = (r % 2) * tile; x < w; x += tile * 2) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, y, tile, tile * 0.5); }
  g.strokeStyle = 'rgba(210,170,80,0.35)'; g.lineWidth = 2; for (let y = 46; y < gh; y += tile * 0.5) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  groundNoise(g, w, rnd, ['#6a4a1c', '#241608'], w * 0.4, 14);
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.strokeStyle = '#120a04'; fg.lineWidth = 4;
  for (let x = 0; x < fgW; x += 130 + rnd() * 200) { fg.beginPath(); fg.moveTo(x, -5); fg.lineTo(x, 60 + rnd() * 70); fg.stroke(); for (let k = 0; k < 4; k++) { fg.beginPath(); fg.arc(x, 20 + k * 22, 6, 0, TAU); fg.stroke(); } }
}

// ---------------- 네온 폐허 도시 ----------------
function buildNeon(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#04040e'], [0.5, '#140a2e'], [1, '#3a1050']]);
  glowOrb(f, farW * 0.5, 300, 420, '255,60,200', 0.18);
  for (let x = 0; x < farW; x += 36 + rnd() * 50) {                                   // 먼 마천루
    const h = 120 + rnd() * 230, wd = 34 + rnd() * 40;
    f.fillStyle = '#0a0820'; f.fillRect(x, GROUND_Y + 30 - h, wd, h);
    for (let yy = GROUND_Y + 36 - h; yy < GROUND_Y + 20; yy += 14) for (let xx = x + 4; xx < x + wd - 6; xx += 9) if (rnd() < 0.3) { f.fillStyle = choose(['rgba(255,220,120,0.8)', 'rgba(90,240,255,0.8)', 'rgba(255,90,200,0.8)']); f.fillRect(xx, yy, 4, 6); }
  }
  haze(f, farW, 'rgba(200,80,255,A)', 230);
  for (let x = 40 + rnd() * 80; x < midW; x += 210 + rnd() * 150) {                    // 중경 : 건물 + 네온 간판
    const wd = 90 + rnd() * 50, top = 70 + rnd() * 90;
    m.fillStyle = '#0e0a24'; m.fillRect(x - wd, top, wd * 2, FLOOR_Y - top);
    m.fillStyle = '#1a1238'; m.fillRect(x - wd, top, wd * 2, 8);
    for (let yy = top + 24; yy < FLOOR_Y - 20; yy += 22) for (let xx = x - wd + 10; xx < x + wd - 14; xx += 18) { m.fillStyle = rnd() < 0.55 ? 'rgba(20,16,50,0.9)' : choose(['rgba(255,210,110,0.85)', 'rgba(110,230,255,0.8)']); m.fillRect(xx, yy, 10, 12); }
    const c = choose(['255,60,200', '60,240,255', '255,230,70', '150,90,255']);
    m.fillStyle = `rgb(${c})`; m.fillRect(x - wd + 20, top + 6 + (rnd() * 40 | 0), 14, 90);
    bg.lights.push({ type: 'neon', x: x - wd + 27, y: top + 60, r: 120, col: c });
    if (rnd() < 0.7) { const c2 = choose(['255,60,200', '60,240,255']); m.fillStyle = `rgb(${c2})`; m.fillRect(x + 6, top - 18, 70, 8); bg.lights.push({ type: 'neon', x: x + 40, y: top - 14, r: 110, col: c2 }); }
  }
  bg.lights.push({ type: 'flash', x: 3 });
  const gh = groundFill(g, w, '#0c0a1c', '#1a1432');
  groundNoise(g, w, rnd, ['#1c1638', '#04030c', '#2a2050'], w * 0.5, 18);
  const [glow, gg] = newGlow(bg, w, gh);
  for (let i = 0; i < w / 110; i++) {                                                  // 비에 젖은 웅덩이 + 네온 반사
    const px = rnd() * w, py = 62 + rnd() * (gh - 82), rx = 30 + rnd() * 50, c = choose(['255,60,200', '60,240,255', '255,230,70']);
    g.fillStyle = 'rgba(30,30,70,0.7)'; g.beginPath(); g.ellipse(px, py, rx, rx * 0.26, 0, 0, TAU); g.fill();
    gg.fillStyle = `rgba(${c},0.35)`; gg.beginPath(); gg.ellipse(px, py, rx * 0.8, rx * 0.2, 0, 0, TAU); gg.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; for (let x = 0; x < w; x += 180) { g.beginPath(); g.moveTo(x, 50); g.lineTo(x - 30, gh); g.stroke(); }
  groundShade(g, w); bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  fg.strokeStyle = '#04030a'; fg.lineWidth = 3;
  for (let x = 0; x < fgW; x += 160 + rnd() * 260) { fg.fillStyle = '#04030a'; fg.fillRect(x, -5, 8, 150); fg.beginPath(); fg.moveTo(x + 4, 8); fg.bezierCurveTo(x + 80, 40, x + 140, 20, x + 220, 70); fg.stroke(); }
}

// ---------------- 뇌운의 고원 ----------------
function buildStorm(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#0a0c1c'], [0.4, '#1c2444'], [0.8, '#3a3c68'], [1, '#52507a']]);
  for (let i = 0; i < farW / 60; i++) {                                                // 먹구름 덩어리
    const x = rnd() * farW, y = 20 + rnd() * 240, r = 50 + rnd() * 120;
    f.fillStyle = `rgba(${14 + rnd() * 30 | 0},${16 + rnd() * 30 | 0},${40 + rnd() * 40 | 0},${0.35 + rnd() * 0.4})`;
    f.beginPath(); for (let k = 0; k < 5; k++) f.ellipse(x + k * r * 0.55 - r, y + Math.sin(k * 2) * 12, r * (0.5 + rnd() * 0.5), r * 0.36, 0, 0, TAU); f.fill();
  }
  ridge(f, farW, '#12142a', 310, 60, 50, rnd);
  haze(f, farW, 'rgba(140,150,220,A)', 240);
  bg.lights.push({ type: 'flash', x: 0 }, { type: 'flash', x: 97 });
  for (let x = 60 + rnd() * 100; x < midW; x += 190 + rnd() * 140) {                  // 중경 : 절벽 바위기둥 + 번개 균열
    const wd = 56 + rnd() * 44, h = 140 + rnd() * 200;
    const lg = m.createLinearGradient(x - wd, 0, x + wd, 0); lg.addColorStop(0, '#12142a'); lg.addColorStop(0.5, '#3a3e66'); lg.addColorStop(1, '#0c0e20');
    m.fillStyle = lg; m.beginPath(); m.moveTo(x - wd, FLOOR_Y); m.lineTo(x - wd * 0.7, FLOOR_Y - h); m.lineTo(x - wd * 0.2, FLOOR_Y - h - 24); m.lineTo(x + wd * 0.6, FLOOR_Y - h + 10); m.lineTo(x + wd, FLOOR_Y); m.fill();
    m.strokeStyle = 'rgba(120,230,255,0.55)'; m.lineWidth = 2; m.beginPath(); let cx = x, cy = FLOOR_Y - h + 10; m.moveTo(cx, cy); for (let k = 0; k < 5; k++) { cx += (rnd() - 0.5) * 22; cy += h / 6; m.lineTo(cx, cy); } m.stroke();
    if (rnd() < 0.6) bg.lights.push({ type: 'crystal', x, y: FLOOR_Y - h * 0.5, r: 90, col: '120,220,255' });
  }
  const gh = groundFill(g, w, '#1c2038', '#30345a');
  groundNoise(g, w, rnd, ['#262c4c', '#0e1020', '#3c4270'], w * 0.8, 18);
  const [glow, gg] = newGlow(bg, w, gh);
  gg.lineCap = 'round';
  for (let i = 0; i < w / 130; i++) {
    let cx = rnd() * w, cy = 60 + rnd() * (gh - 80); const pts = [[cx, cy]];
    for (let k = 0; k < 6; k++) { cx += 14 + rnd() * 30; cy += (rnd() - 0.5) * 18; pts.push([cx, cy]); }
    for (const [lw, col] of [[7, 'rgba(80,200,255,0.2)'], [3, 'rgba(140,230,255,0.75)'], [1.2, 'rgba(240,252,255,0.95)']]) { gg.strokeStyle = col; gg.lineWidth = lw; gg.beginPath(); pts.forEach(([a, b], j) => j ? gg.lineTo(a, b) : gg.moveTo(a, b)); gg.stroke(); }
    g.strokeStyle = '#06070f'; g.lineWidth = 4; g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
  }
  groundShade(g, w); bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  for (let x = 0; x < fgW; x += 100 + rnd() * 200) { fg.fillStyle = `rgba(8,10,26,${0.5 + rnd() * 0.4})`; fg.beginPath(); fg.ellipse(x, 10, 70 + rnd() * 60, 22 + rnd() * 20, 0, 0, TAU); fg.fill(); }
}

// ---------------- 은하 정거장 ----------------
function buildCosmos(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#02010a'], [0.6, '#0a0620'], [1, '#160c3a']]);
  glowOrb(f, farW * 0.3, 150, 360, '140,90,255', 0.3); glowOrb(f, farW * 0.7, 230, 320, '255,90,170', 0.22); glowOrb(f, farW * 0.55, 120, 260, '90,200,255', 0.18);
  starField(f, farW, 320, 400, rnd);
  const px = farW * 0.72, py = 170;                                                      // 고리 행성
  const pg = f.createRadialGradient(px - 20, py - 20, 4, px, py, 70); pg.addColorStop(0, '#f0c880'); pg.addColorStop(1, '#4a2a50');
  f.fillStyle = pg; f.beginPath(); f.arc(px, py, 70, 0, TAU); f.fill();
  f.strokeStyle = 'rgba(255,220,160,0.6)'; f.lineWidth = 8; f.beginPath(); f.ellipse(px, py, 130, 30, -0.3, 0, TAU); f.stroke();
  haze(f, farW, 'rgba(120,90,255,A)', 280);
  for (let x = rnd() * 80; x < midW; x += 200 + rnd() * 140) {                           // 중경 : 정거장 선체 + 창문 + 소행성
    const wd = 100 + rnd() * 60, top = 120 + rnd() * 90;
    const lg = m.createLinearGradient(0, top, 0, FLOOR_Y); lg.addColorStop(0, '#2a3050'); lg.addColorStop(1, '#10142a');
    m.fillStyle = lg; m.fillRect(x - wd, top, wd * 2, FLOOR_Y - top);
    m.strokeStyle = 'rgba(160,190,255,0.3)'; m.lineWidth = 2; for (let yy = top + 30; yy < FLOOR_Y; yy += 40) { m.beginPath(); m.moveTo(x - wd, yy); m.lineTo(x + wd, yy); m.stroke(); }
    for (let k = 0; k < 4; k++) { m.fillStyle = rnd() < 0.7 ? 'rgba(120,220,255,0.85)' : 'rgba(255,200,120,0.85)'; m.fillRect(x - wd + 20 + k * 40, top + 14, 26, 10); }
    bg.lights.push({ type: 'crystal', x, y: top + 20, r: 110, col: '120,200,255' });
    if (rnd() < 0.6) { const ax = x + wd + 40 + rnd() * 40, ay = 60 + rnd() * 120, ar = 18 + rnd() * 24; m.fillStyle = '#3a3248'; m.beginPath(); m.ellipse(ax, ay, ar, ar * 0.7, rnd(), 0, TAU); m.fill(); }
  }
  const gh = groundFill(g, w, '#14183a', '#232860');
  g.strokeStyle = 'rgba(160,190,255,0.22)'; g.lineWidth = 2;
  for (let y = 46; y < gh; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  for (let x = 0; x < w; x += 80) { g.beginPath(); g.moveTo(x, 46); g.lineTo(x, gh); g.stroke(); }
  groundNoise(g, w, rnd, ['#1c2250', '#080a1c'], w * 0.3, 14);
  const [glow, gg] = newGlow(bg, w, gh);
  gg.strokeStyle = 'rgba(100,220,255,0.55)'; gg.lineWidth = 3;
  for (let y = 80; y < gh; y += 120) { gg.beginPath(); gg.moveTo(0, y); gg.lineTo(w, y); gg.stroke(); }
  for (let i = 0; i < w / 160; i++) { gg.fillStyle = choose(['rgba(255,90,170,0.5)', 'rgba(100,220,255,0.5)']); gg.beginPath(); gg.arc(rnd() * w, 60 + rnd() * (gh - 70), 6, 0, TAU); gg.fill(); }
  groundShade(g, w); bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = '#05061a';
  for (let x = 0; x < fgW; x += 180 + rnd() * 260) { fg.fillRect(x, -5, 18, 90 + rnd() * 50); fg.fillRect(x - 24, 60 + rnd() * 40, 66, 10); fg.beginPath(); fg.arc(x + 9, 40, 14, 0, TAU); fg.fill(); }
}

// ---------------- 혼돈의 근원 ----------------
function buildChaos(bg, [f, m, g, fg], farW, midW, w, rnd) {
  const gr = f.createLinearGradient(0, 0, farW, GROUND_Y + 30);
  ['#1a0420', '#3a0a40', '#0a1a48', '#4a0a30', '#14042a'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);
  for (let i = 0; i < 9; i++) glowOrb(f, rnd() * farW, 60 + rnd() * 280, 160 + rnd() * 200, choose(['255,60,160', '80,160,255', '160,80,255', '255,200,80', '80,255,200']), 0.2);
  for (let i = 0; i < 6; i++) {                                                        // 소용돌이
    f.strokeStyle = `rgba(${choose(['255,120,220', '120,200,255', '255,220,120'])},0.3)`; f.lineWidth = 3; const cx = rnd() * farW, cy = 100 + rnd() * 200;
    f.beginPath(); for (let a = 0; a < 9; a += 0.2) f.lineTo(cx + Math.cos(a + i) * a * 14, cy + Math.sin(a + i) * a * 8); f.stroke();
  }
  starField(f, farW, 160, 380, rnd, '255,220,255');
  haze(f, farW, 'rgba(255,100,200,A)', 260);
  for (let x = rnd() * 100; x < midW; x += 170 + rnd() * 160) {                         // 중경 : 부서진 조각 섬 (서로 다른 세계의 파편)
    const y = 90 + rnd() * 220, s = 0.7 + rnd() * 1.0, c = choose(['#3a1050', '#10305a', '#5a1030', '#104a3a', '#5a4010']), e = choose(['255,100,220', '90,200,255', '255,220,90', '120,255,190']);
    m.fillStyle = c; m.beginPath(); m.moveTo(x - 80 * s, y); m.lineTo(x + 70 * s, y - 14 * s); m.lineTo(x + 40 * s, y + 70 * s); m.lineTo(x - 10 * s, y + 90 * s); m.lineTo(x - 60 * s, y + 40 * s); m.closePath(); m.fill();
    m.strokeStyle = `rgba(${e},0.7)`; m.lineWidth = 2.4; m.beginPath(); m.moveTo(x - 80 * s, y); m.lineTo(x + 70 * s, y - 14 * s); m.stroke();
    bg.lights.push({ type: 'crystal', x, y: y + 20 * s, r: 110 * s, col: e });
    if (rnd() < 0.5) bg.lights.push({ type: 'eye', x: x + 10, y: y + 30 * s });
  }
  const gh = groundFill(g, w, '#14062a', '#2a0c44');
  for (let i = 0; i < w / 90; i++) {                                                    // 서로 다른 색의 조각 타일
    const px = rnd() * w, py = 46 + rnd() * (gh - 50), s = 40 + rnd() * 90;
    g.fillStyle = choose(['rgba(90,20,120,0.55)', 'rgba(20,60,130,0.55)', 'rgba(120,20,70,0.55)', 'rgba(20,100,90,0.5)', 'rgba(130,100,20,0.45)']);
    g.beginPath(); polyPath(g, [px, py, px + s, py + rnd() * 10, px + s * 0.8, py + s * 0.35, px + rnd() * 20, py + s * 0.4]); g.fill();
  }
  groundNoise(g, w, rnd, ['#3a1060', '#08020e', '#600a50'], w * 0.5, 16);
  const [glow, gg] = newGlow(bg, w, gh);
  gg.lineCap = 'round';
  for (let i = 0; i < w / 90; i++) {
    let cx = rnd() * w, cy = 56 + rnd() * (gh - 70); const pts = [[cx, cy]];
    for (let k = 0; k < 7; k++) { cx += 14 + rnd() * 34; cy += (rnd() - 0.5) * 20; pts.push([cx, cy]); }
    const c = choose(['255,90,200', '90,200,255', '255,220,90', '120,255,190', '190,110,255']);
    for (const [lw, col] of [[8, `rgba(${c},0.22)`], [3.2, `rgba(${c},0.8)`], [1.2, 'rgba(255,255,255,0.9)']]) { gg.strokeStyle = col; gg.lineWidth = lw; gg.beginPath(); pts.forEach(([a, b], j) => j ? gg.lineTo(a, b) : gg.moveTo(a, b)); gg.stroke(); }
    g.strokeStyle = '#05010a'; g.lineWidth = 5; g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
  }
  groundShade(g, w); bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  for (let x = 0; x < fgW; x += 90 + rnd() * 180) { const h = 40 + rnd() * 120; fg.fillStyle = choose(['#10031c', '#08102a', '#1c0412']); fg.beginPath(); fg.moveTo(x - 20, -5); fg.lineTo(x + (rnd() - 0.5) * 30, h); fg.lineTo(x + 24, -5); fg.fill(); }
}
