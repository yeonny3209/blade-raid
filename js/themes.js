'use strict';
// ============================================================
//  추가 배경 테마 (설원 / 광산 / 사막 / 늪 / 공장 / 천공 / 심연)
//  stage.js 의 buildForest / buildRuins / buildLair 와 같은 규약을 따른다
//    f, m, g, fg = 원경 / 중경 / 지면 / 전경 컨텍스트
//    bg.lights   = 매 프레임 움직이는 발광 요소
//    bg.glow     = 지면 위에 덧그리는 발광 레이어 (선택)
// ============================================================

// 하늘 그라디언트 + 안개 (공통)
function skyGrad(f, farW, stops) {
  const gr = f.createLinearGradient(0, 0, 0, GROUND_Y + 30);
  stops.forEach(([p, c]) => gr.addColorStop(p, c));
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);
}
function haze(f, farW, col, from = 200) {
  const gr = f.createLinearGradient(0, from, 0, GROUND_Y + 30);
  gr.addColorStop(0, col.replace('A', '0')); gr.addColorStop(1, col.replace('A', '0.32'));
  f.fillStyle = gr; f.fillRect(0, from, farW, GROUND_Y + 30);
}
// 들쭉날쭉한 능선
function ridge(f, farW, col, base, amp, step, rnd) {
  f.fillStyle = col; f.beginPath(); f.moveTo(0, GROUND_Y + 30);
  for (let x = 0; x <= farW + step; x += step) f.lineTo(x, base - rnd() * amp - Math.sin(x * 0.004) * amp * 0.5);
  f.lineTo(farW, GROUND_Y + 30); f.closePath(); f.fill();
}

// ---------------- 얼어붙은 설원 ----------------
function buildFrost(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#050a18'], [0.4, '#0d2140'], [0.75, '#1d3f63'], [1, '#3a6a8e']]);
  // 오로라
  for (let i = 0; i < 4; i++) {
    const x0 = rnd() * farW, col = i % 2 ? 'rgba(90,255,190,0.16)' : 'rgba(120,180,255,0.14)';
    f.fillStyle = col; f.beginPath(); f.moveTo(x0, 20);
    for (let y = 20; y < 240; y += 20) f.lineTo(x0 + Math.sin(y * 0.03 + i) * 60 + 40, y);
    for (let y = 240; y >= 20; y -= 20) f.lineTo(x0 + Math.sin(y * 0.03 + i) * 60 - 30, y);
    f.closePath(); f.fill();
  }
  for (let i = 0; i < 160; i++) { f.fillStyle = `rgba(230,245,255,${rnd() * 0.7})`; f.fillRect(rnd() * farW, rnd() * 220, 1.5, 1.5); }
  ridge(f, farW, '#16304a', 250, 90, 40, rnd);
  ridge(f, farW, '#22455f', 300, 60, 30, rnd);
  haze(f, farW, 'rgba(200,230,255,A)', 220);

  // 중경 : 얼음 기둥 + 눈 덮인 침엽수
  for (let x = rnd() * 100; x < midW; x += 120 + rnd() * 160) {
    const h = 120 + rnd() * 220, wd = 26 + rnd() * 40;
    const lg = m.createLinearGradient(x - wd, 0, x + wd, 0);
    lg.addColorStop(0, 'rgba(120,190,230,0.75)'); lg.addColorStop(0.5, 'rgba(200,240,255,0.9)'); lg.addColorStop(1, 'rgba(90,150,200,0.8)');
    m.fillStyle = lg;
    m.beginPath(); m.moveTo(x - wd, GROUND_Y + 26); m.lineTo(x - wd * 0.4, GROUND_Y + 26 - h); m.lineTo(x + wd * 0.2, GROUND_Y + 26 - h * 0.8); m.lineTo(x + wd, GROUND_Y + 26); m.closePath(); m.fill();
    m.strokeStyle = 'rgba(255,255,255,0.5)'; m.lineWidth = 2;
    m.beginPath(); m.moveTo(x - wd * 0.3, GROUND_Y + 20); m.lineTo(x - wd * 0.2, GROUND_Y + 26 - h * 0.7); m.stroke();
    if (rnd() < 0.5) bg.lights.push({ type: 'crystal', x, y: GROUND_Y + 20 - h * 0.6, r: 90, col: '150,220,255' });
  }
  for (let i = 0; i < midW / 90; i++) {                       // 눈 덮인 나무
    const x = rnd() * midW, h = 120 + rnd() * 120, base = GROUND_Y + 22;
    m.fillStyle = '#0e2430';
    for (let k = 0; k < 3; k++) {
      const yy = base - h * (0.35 + k * 0.28), ww = h * 0.3 * (1 - k * 0.22);
      m.beginPath(); m.moveTo(x, yy - h * 0.28); m.lineTo(x + ww, yy); m.lineTo(x - ww, yy); m.closePath(); m.fill();
    }
    m.fillStyle = 'rgba(235,248,255,0.85)';
    for (let k = 0; k < 3; k++) {
      const yy = base - h * (0.35 + k * 0.28), ww = h * 0.3 * (1 - k * 0.22);
      m.beginPath(); m.moveTo(x, yy - h * 0.28); m.lineTo(x + ww * 0.75, yy - 4); m.lineTo(x - ww * 0.75, yy - 4); m.closePath(); m.fill();
    }
    m.fillStyle = '#132a36'; m.fillRect(x - 5, base - h * 0.4, 10, h * 0.4);
  }

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#a8c6db'); gr.addColorStop(0.35, '#cfe2ef'); gr.addColorStop(1, '#eaf3fa');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  groundNoise(g, w, rnd, ['#ffffff', '#b9d2e2', '#8fb0c6'], w * 0.7, 18);
  // 얼음 균열
  g.strokeStyle = 'rgba(120,170,200,0.5)'; g.lineWidth = 1.6;
  for (let i = 0; i < w / 60; i++) {
    let x = rnd() * w, y = 60 + rnd() * (gh - 80);
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += rnd() * 40 - 10; y += rnd() * 14 - 7; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < w / 70; i++) {                          // 얼음 조각
    const sx = rnd() * w, syy = 60 + rnd() * (gh - 70), k = 0.6 + syy / gh;
    g.fillStyle = 'rgba(255,255,255,0.8)';
    g.beginPath(); polyPath(g, [sx, syy - 9 * k, sx + 7 * k, syy, sx, syy + 5 * k, sx - 7 * k, syy]); g.fill();
    g.fillStyle = 'rgba(150,200,230,0.6)';
    g.beginPath(); polyPath(g, [sx, syy - 9 * k, sx + 7 * k, syy, sx, syy + 5 * k]); g.fill();
  }
  groundShade(g, w);
  gr = g.createLinearGradient(0, 30, 0, 70);
  gr.addColorStop(0, '#9ab8cc'); gr.addColorStop(1, 'rgba(154,184,204,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, 70);

  const fgW = fg.canvas.width / bg.scale;                     // 전경 : 고드름
  fg.fillStyle = 'rgba(210,240,255,0.85)';
  for (let x = 0; x < fgW; x += 40 + rnd() * 90) {
    const h = 30 + rnd() * 90;
    fg.beginPath(); fg.moveTo(x - 12, -5); fg.lineTo(x, h); fg.lineTo(x + 12, -5); fg.closePath(); fg.fill();
  }
}

// ---------------- 버려진 광산 ----------------
function buildMine(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#0a0806'], [0.5, '#17120c'], [1, '#241a12']]);
  for (let i = 0; i < farW / 60; i++) {                       // 깊은 갱도
    const x = rnd() * farW, wd = 40 + rnd() * 70, h = 100 + rnd() * 160;
    f.fillStyle = '#060504';
    f.beginPath(); f.moveTo(x - wd, GROUND_Y + 30); f.lineTo(x - wd * 0.7, GROUND_Y + 30 - h); f.lineTo(x + wd * 0.7, GROUND_Y + 30 - h); f.lineTo(x + wd, GROUND_Y + 30); f.closePath(); f.fill();
  }
  haze(f, farW, 'rgba(120,90,50,A)', 240);

  // 중경 : 목재 갱도 지지대 + 수레 + 크리스탈
  for (let x = 60 + rnd() * 80; x < midW; x += 180 + rnd() * 120) {
    const top = 120 + rnd() * 60, base = GROUND_Y + 24;
    m.fillStyle = '#3b2916';
    m.fillRect(x - 90, top, 18, base - top); m.fillRect(x + 72, top, 18, base - top);
    m.fillRect(x - 104, top - 16, 208, 20);
    m.fillStyle = '#4d361d'; m.fillRect(x - 104, top - 16, 208, 5);
    m.strokeStyle = 'rgba(0,0,0,0.45)'; m.lineWidth = 2;
    for (let k = 0; k < 5; k++) { const yy = top + 30 + k * 50; m.beginPath(); m.moveTo(x - 88, yy); m.lineTo(x - 76, yy); m.moveTo(x + 74, yy); m.lineTo(x + 86, yy); m.stroke(); }
    if (rnd() < 0.45) bg.lights.push({ type: 'torch', x: x - 96, y: top + 40 });
    // 크리스탈 군집
    if (rnd() < 0.6) {
      const cx = x + (rnd() - 0.5) * 120, cy = base - 10;
      for (let k = 0; k < 4; k++) {
        const h = 30 + rnd() * 60, ww = 7 + rnd() * 8, ox = (rnd() - 0.5) * 50;
        m.fillStyle = rnd() < 0.5 ? 'rgba(120,230,255,0.85)' : 'rgba(180,140,255,0.8)';
        m.beginPath(); m.moveTo(cx + ox, cy - h); m.lineTo(cx + ox + ww, cy); m.lineTo(cx + ox - ww, cy); m.closePath(); m.fill();
      }
      bg.lights.push({ type: 'crystal', x: cx, y: cy - 40, r: 110, col: '110,220,255' });
    }
  }
  // 광차 레일
  m.strokeStyle = '#2a2018'; m.lineWidth = 4;
  m.beginPath(); m.moveTo(0, GROUND_Y + 14); m.lineTo(midW, GROUND_Y + 14); m.moveTo(0, GROUND_Y + 24); m.lineTo(midW, GROUND_Y + 24); m.stroke();
  m.strokeStyle = '#3a2c20'; m.lineWidth = 3;
  for (let x = 0; x < midW; x += 26) { m.beginPath(); m.moveTo(x, GROUND_Y + 12); m.lineTo(x, GROUND_Y + 26); m.stroke(); }

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#20180f'); gr.addColorStop(1, '#3a2c1d');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  groundNoise(g, w, rnd, ['#4a3820', '#120d08', '#5a4326', '#2e2216'], w * 0.9, 16);
  for (let i = 0; i < w / 40; i++) {                          // 광석 부스러기
    const sx = rnd() * w, syy = 55 + rnd() * (gh - 65), k = 0.6 + syy / gh;
    g.fillStyle = choose(['#5a5048', '#3a332d', '#6a5a3a']);
    g.beginPath(); g.ellipse(sx, syy, 6 * k, 3 * k, rnd(), 0, TAU); g.fill();
    if (rnd() < 0.12) { g.fillStyle = 'rgba(120,220,255,0.55)'; g.beginPath(); g.ellipse(sx, syy - 2, 3 * k, 2 * k, 0, 0, TAU); g.fill(); }
  }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = '#0a0806';
  for (let x = 0; x < fgW; x += 150 + rnd() * 250) { fg.fillRect(x, -10, 22, 60 + rnd() * 70); }
}

// ---------------- 사막 유적 ----------------
function buildDesert(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#2a1a3a'], [0.35, '#8a4a3a'], [0.65, '#d98a4a'], [1, '#f0c078']]);
  const sx = farW * 0.6;                                      // 지는 해
  const rg = f.createRadialGradient(sx, 250, 10, sx, 250, 220);
  rg.addColorStop(0, 'rgba(255,230,160,0.95)'); rg.addColorStop(0.25, 'rgba(255,170,90,0.45)'); rg.addColorStop(1, 'rgba(255,120,60,0)');
  f.fillStyle = rg; f.fillRect(0, 0, farW, GROUND_Y + 30);
  f.fillStyle = '#ffe9b0'; f.beginPath(); f.arc(sx, 250, 46, 0, TAU); f.fill();
  ridge(f, farW, '#7a4630', 300, 70, 50, rnd);                // 모래 언덕
  ridge(f, farW, '#a06848', 340, 45, 36, rnd);
  haze(f, farW, 'rgba(240,190,130,A)', 260);

  // 중경 : 무너진 오벨리스크 / 사암 신전
  for (let x = rnd() * 150; x < midW; x += 240 + rnd() * 200) {
    const h = 160 + rnd() * 200, wd = 30 + rnd() * 26, base = GROUND_Y + 22;
    const lean = (rnd() - 0.5) * 24;
    const lg = m.createLinearGradient(x - wd, 0, x + wd, 0);
    lg.addColorStop(0, '#6b4a2e'); lg.addColorStop(0.45, '#c79a5e'); lg.addColorStop(1, '#5a3d24');
    m.fillStyle = lg;
    m.beginPath(); m.moveTo(x - wd, base); m.lineTo(x - wd * 0.6 + lean, base - h); m.lineTo(x + wd * 0.6 + lean, base - h); m.lineTo(x + wd, base); m.closePath(); m.fill();
    m.strokeStyle = 'rgba(70,45,25,0.55)'; m.lineWidth = 2;
    for (let k = 1; k < 5; k++) { const yy = base - h * k / 5; m.beginPath(); m.moveTo(x - wd * (1 - k * 0.08), yy); m.lineTo(x + wd * (1 - k * 0.08) + lean * k / 5, yy); m.stroke(); }
    // 상형문자
    m.fillStyle = 'rgba(90,60,30,0.6)';
    for (let k = 0; k < 6; k++) m.fillRect(x - 8 + lean * 0.4, base - h * 0.8 + k * 22, 16, 10);
    if (rnd() < 0.5) bg.lights.push({ type: 'crystal', x: x + lean, y: base - h - 10, r: 70, col: '255,200,110' });
  }
  for (let i = 0; i < midW / 200; i++) {                      // 반쯤 묻힌 석상 머리
    const hx = rnd() * midW, base = GROUND_Y + 24;
    m.fillStyle = '#b08a56';
    m.beginPath(); m.ellipse(hx, base - 26, 46, 40, 0, Math.PI, TAU); m.fill();
    m.fillStyle = '#7a5a34';
    m.beginPath(); m.ellipse(hx - 16, base - 34, 7, 5, 0, 0, TAU); m.ellipse(hx + 16, base - 34, 7, 5, 0, 0, TAU); m.fill();
    m.fillRect(hx - 22, base - 14, 44, 6);
  }

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#b98a52'); gr.addColorStop(0.4, '#d9ad74'); gr.addColorStop(1, '#efd0a0');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  // 모래 결
  g.strokeStyle = 'rgba(180,140,90,0.35)'; g.lineWidth = 2;
  for (let i = 0; i < gh / 5; i++) {
    const y = 46 + i * 5;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= w; x += 40) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 3);
    g.stroke();
  }
  groundNoise(g, w, rnd, ['#f0d8ac', '#a87c46', '#c9a068'], w * 0.6, 20);
  for (let i = 0; i < w / 120; i++) {                          // 뼈 / 부서진 기둥
    const bx = rnd() * w, by = 60 + rnd() * (gh - 70), k = 0.6 + by / gh;
    g.save(); g.translate(bx, by); g.rotate(rnd() * 0.6 - 0.3); g.scale(k, k * 0.6);
    g.fillStyle = '#c9b48a'; g.fillRect(-26, -5, 52, 10);
    g.strokeStyle = '#8a7658'; g.lineWidth = 1.5; g.strokeRect(-26, -5, 52, 10);
    g.restore();
  }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = 'rgba(200,160,100,0.5)';
  for (let i = 0; i < fgW / 300; i++) fg.fillRect(rnd() * fgW, -10, 40 + rnd() * 90, 30 + rnd() * 40);
}

// ---------------- 죽음의 늪 ----------------
function buildSwamp(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#0a1410'], [0.45, '#16281c'], [1, '#2c4430']]);
  const mx = farW * 0.35;
  const rg = f.createRadialGradient(mx, 130, 5, mx, 130, 200);
  rg.addColorStop(0, 'rgba(180,255,180,0.3)'); rg.addColorStop(1, 'rgba(120,200,120,0)');
  f.fillStyle = rg; f.fillRect(0, 0, farW, GROUND_Y);
  f.fillStyle = '#c8e8b8'; f.beginPath(); f.arc(mx, 130, 26, 0, TAU); f.fill();
  ridge(f, farW, '#0e2016', 270, 70, 40, rnd);
  // 죽은 나무 실루엣
  f.strokeStyle = '#0a1a12'; f.lineWidth = 6;
  for (let i = 0; i < farW / 70; i++) {
    const x = rnd() * farW, h = 80 + rnd() * 140;
    f.beginPath(); f.moveTo(x, GROUND_Y + 30); f.lineTo(x + (rnd() - 0.5) * 20, GROUND_Y + 30 - h);
    f.moveTo(x, GROUND_Y + 30 - h * 0.6); f.lineTo(x + 30, GROUND_Y + 30 - h * 0.8);
    f.moveTo(x, GROUND_Y + 30 - h * 0.5); f.lineTo(x - 26, GROUND_Y + 30 - h * 0.7);
    f.stroke();
  }
  haze(f, farW, 'rgba(120,200,140,A)', 230);

  // 중경 : 뒤틀린 고목 + 늘어진 이끼
  for (let x = rnd() * 120; x < midW; x += 170 + rnd() * 180) {
    const tw = 30 + rnd() * 40, base = GROUND_Y + 24;
    const tg = m.createLinearGradient(x - tw, 0, x + tw, 0);
    tg.addColorStop(0, '#0c1410'); tg.addColorStop(0.45, '#25321f'); tg.addColorStop(1, '#0a110c');
    m.fillStyle = tg;
    m.beginPath(); m.moveTo(x - tw * 0.5, -10); m.lineTo(x + tw * 0.5, -10);
    m.quadraticCurveTo(x + tw * 1.2, base - 120, x + tw * 1.6, base);
    m.lineTo(x - tw * 1.6, base);
    m.quadraticCurveTo(x - tw * 1.2, base - 120, x - tw * 0.5, -10);
    m.fill();
    m.strokeStyle = 'rgba(90,140,80,0.4)'; m.lineWidth = 3;   // 이끼 줄기
    for (let k = 0; k < 5; k++) {
      const vx = x + (rnd() - 0.5) * tw * 2.4, L = 60 + rnd() * 160;
      m.beginPath(); m.moveTo(vx, 20 + rnd() * 80); m.lineTo(vx + (rnd() - 0.5) * 20, 20 + L); m.stroke();
    }
    if (rnd() < 0.55) bg.lights.push({ type: 'crystal', x: x + (rnd() - 0.5) * 80, y: base - 60 - rnd() * 100, r: 80, col: '150,255,140' });
  }

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#1b2a1c'); gr.addColorStop(0.5, '#2a3a24'); gr.addColorStop(1, '#3a4a2c');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  // 독 웅덩이
  const glow = makeCanvas(w * bg.scale, gh * bg.scale);
  const gg = glow.getContext('2d'); gg.scale(bg.scale, bg.scale);
  for (let i = 0; i < w / 90; i++) {
    const px = rnd() * w, py = 70 + rnd() * (gh - 90), rx = 30 + rnd() * 60, ry = rx * 0.3;
    g.fillStyle = 'rgba(40,60,30,0.8)'; g.beginPath(); g.ellipse(px, py, rx + 4, ry + 3, 0, 0, TAU); g.fill();
    g.fillStyle = '#4a7a3a'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, TAU); g.fill();
    gg.fillStyle = 'rgba(140,255,120,0.4)'; gg.beginPath(); gg.ellipse(px, py, rx * 0.8, ry * 0.8, 0, 0, TAU); gg.fill();
  }
  groundNoise(g, w, rnd, ['#2a3a1e', '#4a5a30', '#16200f'], w * 0.8, 18);
  for (let i = 0; i < w / 20; i++) {                          // 수초
    const sx2 = rnd() * w, sy2 = 55 + rnd() * (gh - 65), k = 0.6 + sy2 / gh;
    g.strokeStyle = choose(['#3a5a28', '#4f7030', '#2e4420']); g.lineWidth = 1.6 * k;
    g.beginPath();
    for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 1.1, L = (8 + rnd() * 14) * k; g.moveTo(sx2, sy2); g.lineTo(sx2 + Math.cos(a) * L, sy2 + Math.sin(a) * L); }
    g.stroke();
  }
  groundShade(g, w);
  bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  fg.strokeStyle = 'rgba(8,16,10,0.9)'; fg.lineWidth = 5;
  for (let i = 0; i < fgW / 120; i++) {
    const vx = rnd() * fgW, L = 50 + rnd() * 120;
    fg.beginPath(); fg.moveTo(vx, -5); fg.bezierCurveTo(vx + 14, L * 0.4, vx - 14, L * 0.7, vx + 6, L); fg.stroke();
  }
}

// ---------------- 기계 공장 ----------------
function buildFactory(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#0b0d12'], [0.5, '#161a24'], [1, '#232a38']]);
  for (let i = 0; i < farW / 90; i++) {                        // 먼 굴뚝 / 탱크
    const x = rnd() * farW, wd = 30 + rnd() * 50, h = 120 + rnd() * 200;
    f.fillStyle = '#10141c'; f.fillRect(x, GROUND_Y + 30 - h, wd, h);
    f.fillStyle = '#1a2130'; f.fillRect(x, GROUND_Y + 30 - h, wd * 0.3, h);
    for (let k = 0; k < 4; k++) { f.fillStyle = 'rgba(255,170,60,0.25)'; f.fillRect(x + 6, GROUND_Y + 30 - h + 20 + k * 40, wd - 12, 10); }
  }
  haze(f, farW, 'rgba(120,140,170,A)', 250);

  // 중경 : 배관 + 기어 + 증기
  m.fillStyle = '#1c2230'; m.fillRect(0, 90, midW, GROUND_Y - 60);
  for (let x = 0; x < midW; x += 64) {                         // 벽 패널
    m.fillStyle = `rgba(${44 + rnd() * 16 | 0},${52 + rnd() * 16 | 0},${66 + rnd() * 16 | 0},0.9)`;
    m.fillRect(x + 3, 94, 58, GROUND_Y - 70);
    m.fillStyle = 'rgba(255,255,255,0.05)'; m.fillRect(x + 3, 94, 58, 4);
    m.fillStyle = '#39404f';
    for (let k = 0; k < 4; k++) m.beginPath(), m.arc(x + 10 + (k % 2) * 44, 104 + (k > 1 ? GROUND_Y - 96 : 0), 3, 0, TAU), m.fill();
  }
  for (let i = 0; i < midW / 150; i++) {                       // 배관
    const y = 120 + rnd() * 200, th = 14 + rnd() * 16;
    m.fillStyle = '#4a5364'; m.fillRect(0, y, midW, th);
    m.fillStyle = 'rgba(255,255,255,0.12)'; m.fillRect(0, y, midW, 4);
    m.fillStyle = '#5c6779';
    for (let x = 0; x < midW; x += 120) m.fillRect(x, y - 4, 14, th + 8);
  }
  for (let x = 100 + rnd() * 100; x < midW; x += 260 + rnd() * 200) {
    const gy = 160 + rnd() * 160, r = 40 + rnd() * 40;
    bg.lights.push({ type: 'gear', x, y: gy, r, spd: (rnd() < 0.5 ? 1 : -1) * (0.004 + rnd() * 0.006) });
    if (rnd() < 0.6) bg.lights.push({ type: 'steam', x: x + 60, y: GROUND_Y + 10 });
    if (rnd() < 0.5) bg.lights.push({ type: 'crystal', x: x - 40, y: gy - 40, r: 70, col: '255,150,50' });
  }
  m.fillStyle = '#141922'; m.fillRect(0, GROUND_Y + 2, midW, 34);
  m.fillStyle = '#39404f'; m.fillRect(0, GROUND_Y, midW, 6);

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#20242e'); gr.addColorStop(1, '#333947');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  // 금속 격자 바닥
  for (let y = 46; y < gh; y += 26) {
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y + 2); g.lineTo(w, y + 2); g.stroke();
  }
  for (let x = 0; x < w; x += 60) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 46); g.lineTo(x, gh); g.stroke(); }
  for (let i = 0; i < w / 50; i++) {                            // 볼트 / 기름
    const bx = rnd() * w, by = 55 + rnd() * (gh - 65);
    g.fillStyle = '#4c5667'; g.beginPath(); g.arc(bx, by, 3, 0, TAU); g.fill();
    if (rnd() < 0.2) { g.fillStyle = 'rgba(10,10,14,0.55)'; g.beginPath(); g.ellipse(bx, by, 18, 7, 0, 0, TAU); g.fill(); }
  }
  groundNoise(g, w, rnd, ['#1a1e26', '#454d5e'], w * 0.3, 14);
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = '#0c0f16';
  for (let x = 0; x < fgW; x += 200 + rnd() * 300) { fg.fillRect(x, -10, 26, 70 + rnd() * 60); fg.fillRect(x - 10, 50 + rnd() * 40, 46, 14); }
}

// ---------------- 천상의 회랑 ----------------
function buildSky(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#2a4a8a'], [0.4, '#6a9ad0'], [0.75, '#b8d8f0'], [1, '#f0e0c0']]);
  for (let i = 0; i < farW / 40; i++) {                        // 구름층
    const x = rnd() * farW, y = 60 + rnd() * 280, r = 40 + rnd() * 90;
    f.fillStyle = `rgba(255,255,255,${0.12 + rnd() * 0.25})`;
    f.beginPath();
    for (let k = 0; k < 5; k++) f.ellipse(x + k * r * 0.5 - r, y + Math.sin(k) * 8, r * (0.5 + rnd() * 0.5), r * 0.32, 0, 0, TAU);
    f.fill();
  }
  // 먼 부유섬
  for (let i = 0; i < farW / 220; i++) {
    const x = rnd() * farW, y = 140 + rnd() * 160, s = 0.5 + rnd() * 0.7;
    f.fillStyle = 'rgba(120,150,190,0.55)';
    f.beginPath(); f.moveTo(x - 70 * s, y); f.lineTo(x + 70 * s, y); f.lineTo(x + 20 * s, y + 60 * s); f.lineTo(x - 30 * s, y + 46 * s); f.closePath(); f.fill();
    f.fillStyle = 'rgba(160,220,170,0.5)'; f.fillRect(x - 70 * s, y - 6 * s, 140 * s, 8 * s);
  }
  haze(f, farW, 'rgba(255,245,220,A)', 240);

  // 중경 : 대리석 기둥 + 빛기둥
  for (let x = 80 + rnd() * 100; x < midW; x += 230 + rnd() * 120) {
    const top = 70 + rnd() * 50, base = GROUND_Y + 24;
    const cg = m.createLinearGradient(x - 30, 0, x + 30, 0);
    cg.addColorStop(0, '#9aa8c0'); cg.addColorStop(0.4, '#f2f4fa'); cg.addColorStop(0.62, '#ffffff'); cg.addColorStop(1, '#8a97ae');
    m.fillStyle = cg; m.fillRect(x - 28, top, 56, base - top);
    m.fillStyle = '#dfe4ee'; m.fillRect(x - 40, top - 18, 80, 20); m.fillRect(x - 40, base - 18, 80, 22);
    m.fillStyle = '#c9a24a'; m.fillRect(x - 40, top - 22, 80, 5);
    m.strokeStyle = 'rgba(120,135,160,0.5)'; m.lineWidth = 2;
    for (let k = -18; k <= 18; k += 9) { m.beginPath(); m.moveTo(x + k, top + 6); m.lineTo(x + k, base - 20); m.stroke(); }
    bg.lights.push({ type: 'shaft', x: x - 20, w: 46 + rnd() * 40 });
  }
  // 떠 있는 작은 섬
  for (let i = 0; i < midW / 300; i++) {
    const x = rnd() * midW, y = 120 + rnd() * 120;
    m.fillStyle = '#6a7a92';
    m.beginPath(); m.moveTo(x - 60, y); m.lineTo(x + 60, y); m.lineTo(x + 14, y + 54); m.lineTo(x - 24, y + 40); m.closePath(); m.fill();
    m.fillStyle = '#7fbf7f'; m.fillRect(x - 60, y - 7, 120, 9);
    bg.lights.push({ type: 'crystal', x, y: y - 20, r: 90, col: '255,240,190' });
  }

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#c8cede'); gr.addColorStop(0.4, '#e8ecf4'); gr.addColorStop(1, '#fbfcff');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  let yy = 44, rh = 14, row = 0;                                // 대리석 타일
  while (yy < gh) {
    const tw = 80 + rh * 2.2, off = (row++ % 2) * tw * 0.5;
    for (let x = -off; x < w; x += tw) {
      const c = 232 + rnd() * 18 | 0;
      g.fillStyle = `rgb(${c},${c + 2},${c + 8})`;
      g.fillRect(x + 1.5, yy + 1.5, tw - 3, rh - 3);
      g.strokeStyle = 'rgba(150,160,185,0.35)'; g.lineWidth = 1;
      g.strokeRect(x + 1.5, yy + 1.5, tw - 3, rh - 3);
      if (rnd() < 0.07) { g.fillStyle = 'rgba(201,162,74,0.35)'; g.fillRect(x + tw * 0.3, yy + rh * 0.3, tw * 0.4, rh * 0.4); }
    }
    yy += rh; rh *= 1.09;
  }
  groundNoise(g, w, rnd, ['#ffffff', '#c4ccdd'], w * 0.25, 22);
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < fgW / 200; i++) {
    const x = rnd() * fgW, y = rnd() * 40, r = 60 + rnd() * 80;
    fg.beginPath();
    for (let k = 0; k < 4; k++) fg.ellipse(x + k * r * 0.4 - r * 0.5, y, r * 0.5, r * 0.22, 0, 0, TAU);
    fg.fill();
  }
}

// ---------------- 심연의 나락 ----------------
function buildAbyss(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  skyGrad(f, farW, [[0, '#04020a'], [0.5, '#0d0620'], [1, '#1a0c33']]);
  for (let i = 0; i < 200; i++) {                               // 별처럼 보이는 눈
    const x = rnd() * farW, y = rnd() * 320;
    f.fillStyle = `rgba(${180 + rnd() * 70 | 0},${100 + rnd() * 80 | 0},255,${rnd() * 0.8})`;
    f.fillRect(x, y, 1.6, 1.6);
  }
  const vx = farW * 0.5;                                        // 소용돌이 균열
  const rg = f.createRadialGradient(vx, 180, 10, vx, 180, 260);
  rg.addColorStop(0, 'rgba(200,120,255,0.5)'); rg.addColorStop(0.3, 'rgba(120,50,200,0.25)'); rg.addColorStop(1, 'rgba(60,20,120,0)');
  f.fillStyle = rg; f.fillRect(0, 0, farW, GROUND_Y + 30);
  f.strokeStyle = 'rgba(210,150,255,0.35)'; f.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    f.beginPath();
    for (let a = 0; a < 7; a += 0.2) f.lineTo(vx + Math.cos(a + i) * a * 26, 180 + Math.sin(a + i) * a * 12);
    f.stroke();
  }
  ridge(f, farW, '#0a0418', 300, 80, 44, rnd);

  // 중경 : 떠 있는 바위 + 촉수 기둥
  for (let x = rnd() * 120; x < midW; x += 200 + rnd() * 180) {
    const y = 90 + rnd() * 200, s = 0.6 + rnd() * 0.8;
    m.fillStyle = '#150a26';
    m.beginPath();
    m.moveTo(x - 70 * s, y); m.lineTo(x + 60 * s, y - 10 * s); m.lineTo(x + 30 * s, y + 60 * s); m.lineTo(x - 40 * s, y + 44 * s);
    m.closePath(); m.fill();
    m.strokeStyle = 'rgba(190,110,255,0.4)'; m.lineWidth = 2;
    m.beginPath(); m.moveTo(x - 60 * s, y + 4); m.lineTo(x + 40 * s, y - 2); m.stroke();
    bg.lights.push({ type: 'crystal', x, y: y + 20 * s, r: 80 * s, col: '170,90,255' });
  }
  for (let i = 0; i < midW / 240; i++) {                         // 촉수
    const x = rnd() * midW, base = GROUND_Y + 24, h = 140 + rnd() * 180;
    m.strokeStyle = '#1e0f33'; m.lineWidth = 16 + rnd() * 14; m.lineCap = 'round';
    m.beginPath(); m.moveTo(x, base);
    m.bezierCurveTo(x + 40, base - h * 0.4, x - 50, base - h * 0.7, x + 20, base - h);
    m.stroke();
    m.strokeStyle = 'rgba(180,90,255,0.3)'; m.lineWidth = 3;
    m.stroke();
  }
  bg.lights.push({ type: 'eye', x: midW * 0.5 - 30, y: 150 }, { type: 'eye', x: midW * 0.5 + 30, y: 150 });

  const gh = H - GROUND_Y + 44;
  let gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#0b0518'); gr.addColorStop(1, '#1b0f2e');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  groundNoise(g, w, rnd, ['#2a1642', '#06030e', '#3a1e58'], w * 0.8, 18);
  // 보랏빛 균열 (발광)
  const glow = makeCanvas(w * bg.scale, gh * bg.scale);
  const gg = glow.getContext('2d'); gg.scale(bg.scale, bg.scale);
  gg.lineCap = 'round';
  for (let i = 0; i < w / 100; i++) {
    let cx = rnd() * w, cy = 60 + rnd() * (gh - 80);
    const pts = [[cx, cy]];
    for (let k = 0; k < 6; k++) { cx += 16 + rnd() * 34; cy += (rnd() - 0.5) * 16; pts.push([cx, cy]); }
    for (const [lw, col] of [[8, 'rgba(150,60,255,0.22)'], [3.4, 'rgba(200,120,255,0.75)'], [1.3, 'rgba(240,220,255,0.9)']]) {
      gg.strokeStyle = col; gg.lineWidth = lw; gg.beginPath(); pts.forEach(([a, b], j) => j ? gg.lineTo(a, b) : gg.moveTo(a, b)); gg.stroke();
    }
    g.strokeStyle = '#05020c'; g.lineWidth = 5; g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
  }
  groundShade(g, w);
  bg.glow = glow;
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = '#05020c';
  for (let x = 0; x < fgW; x += 110 + rnd() * 220) {
    const h = 40 + rnd() * 110;
    fg.beginPath(); fg.moveTo(x - 30, -5); fg.lineTo(x - 6, h * 0.7); fg.lineTo(x + 2, h); fg.lineTo(x + 12, h * 0.6); fg.lineTo(x + 34, -5); fg.closePath(); fg.fill();
  }
}
