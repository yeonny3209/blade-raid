'use strict';
// ============================================================
//  스토리 전용 배경 5종
//   shore   : 난파선이 걸린 잿빛 해안 (튜토리얼)
//   village : 불타 버린 마을 (기억 속 고향)
//   kingdom : 무너진 왕도 아르덴
//   memory  : 기억의 공간 (금빛 안개 · 떠다니는 파편)
//   demon   : 마왕성 (붉은 하늘 · 검은 첨탑)
//  themes.js 와 같은 규약 : f,m,g,fg = 원경 / 중경 / 지면 / 전경, bg.lights, bg.glow
// ============================================================

// ---------------- 잿빛 해안 ----------------
function buildShore(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#0e1218'], [0.45, '#2a323c'], [0.8, '#56606a'], [1, '#7a8288']]);
  glowOrb(f, farW * 0.7, 150, 300, '220,210,190', 0.22);
  // 구름 띠
  for (let i = 0; i < 14; i++) { const x = rnd() * farW, y = 40 + rnd() * 150, r = 80 + rnd() * 140; f.fillStyle = `rgba(20,24,30,${0.25 + rnd() * 0.3})`; f.beginPath(); f.ellipse(x, y, r * 2, r * 0.32, 0, 0, TAU); f.fill(); }
  // 바다
  const sea = 250;
  let gr = f.createLinearGradient(0, sea, 0, GROUND_Y + 30); gr.addColorStop(0, '#3a4a54'); gr.addColorStop(1, '#1c262e');
  f.fillStyle = gr; f.fillRect(0, sea, farW, GROUND_Y + 30 - sea);
  for (let i = 0; i < 160; i++) { f.fillStyle = `rgba(200,220,230,${rnd() * 0.18})`; f.fillRect(rnd() * farW, sea + rnd() * 130, 10 + rnd() * 40, 1.5); }
  // 먼 바위섬
  for (let x = rnd() * 300; x < farW; x += 400 + rnd() * 500) { f.fillStyle = '#161c22'; f.beginPath(); f.moveTo(x, sea + 6); f.lineTo(x + 20, sea - 40 - rnd() * 50); f.lineTo(x + 60, sea - 20); f.lineTo(x + 90, sea + 6); f.fill(); }
  // 중경 : 난파선 잔해 + 바위
  for (let x = 120 + rnd() * 200; x < midW; x += 520 + rnd() * 380) {
    const r = rnd();
    if (r < 0.5) {                                                       // 기운 선체
      m.save(); m.translate(x, FLOOR_Y); m.rotate(-0.12 + rnd() * 0.08);
      m.fillStyle = '#2a1e16'; m.beginPath(); m.moveTo(-160, 0); m.quadraticCurveTo(-170, -70, -120, -110); m.lineTo(150, -100); m.quadraticCurveTo(190, -60, 170, 0); m.closePath(); m.fill();
      m.strokeStyle = '#140e0a'; m.lineWidth = 3;
      for (let k = -140; k < 160; k += 26) { m.beginPath(); m.moveTo(k, -104); m.lineTo(k + 6, 0); m.stroke(); }
      m.fillStyle = '#0e0a08'; m.fillRect(-40, -96, 50, 40);
      // 부러진 돛대 + 찢긴 돛
      m.fillStyle = '#3a2a1e'; m.fillRect(-10, -300, 12, 200);
      m.fillStyle = 'rgba(180,170,150,0.55)'; m.beginPath(); m.moveTo(2, -290); m.quadraticCurveTo(90, -250, 70, -170); m.lineTo(50, -190); m.lineTo(30, -160); m.lineTo(2, -180); m.closePath(); m.fill();
      m.restore();
    } else {
      m.fillStyle = '#20262c'; m.beginPath(); m.moveTo(x - 90, FLOOR_Y); m.lineTo(x - 60, FLOOR_Y - 90 - rnd() * 60); m.lineTo(x + 10, FLOOR_Y - 130 - rnd() * 40); m.lineTo(x + 80, FLOOR_Y - 60); m.lineTo(x + 100, FLOOR_Y); m.fill();
      m.fillStyle = 'rgba(160,180,190,0.12)'; m.fillRect(x - 60, FLOOR_Y - 100, 4, 90);
    }
  }
  // 지면 : 젖은 모래 + 물가
  const gh = groundFill(g, w, '#4a4840', '#2e2c28');
  groundNoise(g, w, rnd, ['#5a564a', '#38342e', '#6a6658', '#24221e'], w * 0.8, 16);
  g.fillStyle = 'rgba(90,120,130,0.35)'; g.beginPath(); g.moveTo(0, 44);
  for (let x = 0; x <= w; x += 40) g.lineTo(x, 50 + Math.sin(x * 0.01) * 6 + rnd() * 4);
  g.lineTo(w, 44); g.closePath(); g.fill();
  for (let i = 0; i < w / 120; i++) { const px = rnd() * w, py = 70 + rnd() * (gh - 80), k = 0.6 + py / gh; g.fillStyle = '#2a1e16'; g.save(); g.translate(px, py); g.rotate(rnd() * 0.6 - 0.3); g.fillRect(-30 * k, -3 * k, 60 * k, 6 * k); g.restore(); }
  for (let i = 0; i < w / 160; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 70); g.fillStyle = 'rgba(230,220,200,0.5)'; g.beginPath(); g.ellipse(px, py, 4, 2, 0, 0, TAU); g.fill(); }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  for (let x = rnd() * 200; x < fgW; x += 300 + rnd() * 400) { fg.fillStyle = 'rgba(10,12,14,0.92)'; fg.beginPath(); fg.moveTo(x - 60, 180); fg.lineTo(x - 30, 120 - rnd() * 40); fg.lineTo(x + 30, 110); fg.lineTo(x + 70, 180); fg.fill(); }
}

// ---------------- 불탄 마을 ----------------
function buildVillage(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#120806'], [0.5, '#3a160c'], [0.85, '#7a3216'], [1, '#a04a1e']]);
  glowOrb(f, farW * 0.5, GROUND_Y, 520, '255,110,40', 0.25);
  // 연기 기둥
  for (let i = 0; i < 9; i++) { const x = rnd() * farW; for (let k = 0; k < 8; k++) { f.fillStyle = `rgba(20,12,10,${0.18 + rnd() * 0.14})`; f.beginPath(); f.ellipse(x + k * 22 + rnd() * 20, GROUND_Y - 40 - k * 40, 40 + k * 14, 26 + k * 8, 0, 0, TAU); f.fill(); } }
  ridge(f, farW, '#1a0c08', 300, 50, 50, rnd);
  // 먼 지붕 실루엣
  for (let x = rnd() * 60; x < farW; x += 60 + rnd() * 70) { const h = 30 + rnd() * 40, ww = 40 + rnd() * 30; f.fillStyle = '#140806'; f.fillRect(x, GROUND_Y + 30 - h, ww, h); f.beginPath(); f.moveTo(x - 6, GROUND_Y + 30 - h); f.lineTo(x + ww / 2, GROUND_Y + 30 - h - 24); f.lineTo(x + ww + 6, GROUND_Y + 30 - h); f.fill(); }
  // 중경 : 불탄 집
  for (let x = 80 + rnd() * 120; x < midW; x += 300 + rnd() * 220) {
    const ww = 150 + rnd() * 80, h = 110 + rnd() * 50, top = FLOOR_Y - h;
    m.fillStyle = '#2a1a14'; m.fillRect(x, top, ww, h);
    // 무너진 지붕
    m.fillStyle = '#1a100c'; m.beginPath(); m.moveTo(x - 14, top); m.lineTo(x + ww * 0.35, top - 70); m.lineTo(x + ww * 0.55, top - 30); m.lineTo(x + ww * 0.7, top - 50); m.lineTo(x + ww + 14, top); m.fill();
    m.strokeStyle = '#0c0806'; m.lineWidth = 6; m.beginPath(); m.moveTo(x + ww * 0.3, top - 60); m.lineTo(x + ww * 0.9, top + 20); m.stroke();
    // 창 (불빛)
    for (let k = 0; k < 2; k++) { const wx = x + 24 + k * (ww - 70), wy = top + 34; m.fillStyle = '#ff8a30'; m.fillRect(wx, wy, 26, 30); m.fillStyle = '#1a100c'; m.fillRect(wx + 12, wy, 3, 30); m.fillRect(wx, wy + 14, 26, 3); bg.lights.push({ type: 'crystal', x: wx + 13, y: wy + 15, r: 60, col: '255,130,40' }); }
    m.fillStyle = '#0c0806'; m.fillRect(x + ww / 2 - 16, FLOOR_Y - 50, 32, 50);
    // 그을음
    const sg = m.createLinearGradient(0, top, 0, FLOOR_Y); sg.addColorStop(0, 'rgba(0,0,0,0.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = sg; m.fillRect(x, top, ww, h);
    if (rnd() < 0.7) bg.lights.push({ type: 'torch', x: x + ww * (0.2 + rnd() * 0.6), y: top - 10 });
    // 울타리
    m.strokeStyle = '#1a100c'; m.lineWidth = 4;
    for (let k = 0; k < 6; k++) { const fx = x + ww + 20 + k * 18; m.beginPath(); m.moveTo(fx, FLOOR_Y); m.lineTo(fx + (rnd() - 0.5) * 6, FLOOR_Y - 30 - rnd() * 14); m.stroke(); }
  }
  // 지면 : 흙길 + 재
  const gh = groundFill(g, w, '#3a2a20', '#22160e');
  groundNoise(g, w, rnd, ['#4a3426', '#1a100a', '#5a4030', '#2a2a2a'], w * 0.9, 18);
  for (let i = 0; i < w / 70; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 70); g.fillStyle = `rgba(255,${90 + rnd() * 60 | 0},30,${0.3 + rnd() * 0.4})`; g.beginPath(); g.ellipse(px, py, 3 + rnd() * 3, 1.5 + rnd() * 1.5, 0, 0, TAU); g.fill(); }
  groundShade(g, w);
  const [gc, gg] = newGlow(bg, w, gh); bg.glow = gc;
  for (let i = 0; i < w / 160; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 70); const rg = gg.createRadialGradient(px, py, 0, px, py, 50); rg.addColorStop(0, 'rgba(255,120,40,0.4)'); rg.addColorStop(1, 'rgba(255,120,40,0)'); gg.fillStyle = rg; gg.fillRect(px - 50, py - 50, 100, 100); }
  const fgW = fg.canvas.width / bg.scale;
  for (let x = rnd() * 100; x < fgW; x += 220 + rnd() * 300) { fg.fillStyle = 'rgba(8,4,2,0.94)'; fg.fillRect(x, 60, 14, 120); fg.fillRect(x - 30, 90, 74, 8); }
}

// ---------------- 무너진 왕도 ----------------
function buildKingdom(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#0a0a14'], [0.5, '#1e1c30'], [0.85, '#3e3448'], [1, '#5a4850']]);
  glowOrb(f, farW * 0.35, 120, 260, '200,190,230', 0.25);
  f.fillStyle = '#d8d4e8'; f.beginPath(); f.arc(farW * 0.35, 120, 30, 0, TAU); f.fill();
  starField(f, farW, 70, 180, rnd);
  // 원경 : 성의 실루엣 (첨탑)
  const cx = farW * 0.55;
  f.fillStyle = '#12101c';
  f.fillRect(cx - 220, 200, 440, GROUND_Y - 170);
  for (const [dx, h, ww] of [[-200, 150, 40], [-110, 210, 46], [0, 280, 60], [110, 200, 46], [200, 140, 40]]) { f.fillRect(cx + dx - ww / 2, GROUND_Y + 30 - h - 100, ww, h + 100); f.beginPath(); f.moveTo(cx + dx - ww / 2 - 6, GROUND_Y - 70 - h); f.lineTo(cx + dx, GROUND_Y - 130 - h); f.lineTo(cx + dx + ww / 2 + 6, GROUND_Y - 70 - h); f.fill(); }
  f.fillStyle = 'rgba(255,200,120,0.5)'; for (let i = 0; i < 18; i++) f.fillRect(cx - 200 + rnd() * 400, 220 + rnd() * 120, 4, 7);
  // 부서진 부분
  f.fillStyle = '#1e1c30'; f.beginPath(); f.moveTo(cx + 60, 100); f.lineTo(cx + 140, 160); f.lineTo(cx + 90, 230); f.lineTo(cx + 40, 180); f.fill();
  haze(f, farW, 'rgba(120,100,140,A)', 220);
  // 중경 : 성벽 + 부서진 석상
  const top = 150;
  let gr = m.createLinearGradient(0, top, 0, FLOOR_Y); gr.addColorStop(0, '#2c2a38'); gr.addColorStop(1, '#3c3846');
  for (let x = 0; x < midW; x += 640 + rnd() * 200) {
    const ww = 420 + rnd() * 160;
    m.fillStyle = gr; m.fillRect(x, top, ww, FLOOR_Y - top);
    for (let k = 0; k < ww; k += 40) if (rnd() < 0.8) m.fillRect(x + k, top - 22, 24, 22);           // 총안
    m.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = top + 20; y < FLOOR_Y; y += 30) m.fillRect(x, y, ww, 2);
    // 무너진 틈
    m.fillStyle = '#0a0a14'; m.beginPath(); const bx = x + ww * (0.3 + rnd() * 0.4); m.moveTo(bx - 40, top - 22); m.lineTo(bx + 50, top - 22); m.lineTo(bx + 20, top + 90); m.lineTo(bx - 10, top + 60); m.fill();
    // 깃발 (찢긴 왕국기)
    const fx = x + 60 + rnd() * (ww - 120);
    m.fillStyle = '#2a2018'; m.fillRect(fx, top - 120, 5, 100);
    m.fillStyle = '#3a4a8a'; m.beginPath(); m.moveTo(fx + 5, top - 118); m.lineTo(fx + 70, top - 110); m.lineTo(fx + 50, top - 90); m.lineTo(fx + 66, top - 70); m.lineTo(fx + 5, top - 74); m.fill();
    m.strokeStyle = '#c9a24a'; m.lineWidth = 2; m.beginPath(); m.arc(fx + 30, top - 94, 8, 0, TAU); m.stroke();
    bg.lights.push({ type: 'torch', x: x + 40, y: top + 60 }); bg.lights.push({ type: 'torch', x: x + ww - 40, y: top + 60 });
    // 석상 받침
    const sx = x + ww + 80;
    if (sx < midW) { m.fillStyle = '#4a4656'; m.fillRect(sx - 30, FLOOR_Y - 40, 60, 40); m.fillStyle = '#3a3646'; m.fillRect(sx - 14, FLOOR_Y - 150, 28, 110); m.beginPath(); m.arc(sx, FLOOR_Y - 158, 14, 0, TAU); m.fill(); m.fillRect(sx + 10, FLOOR_Y - 140, 40, 7); }
  }
  // 지면 : 왕도의 돌길
  const gh = groundFill(g, w, '#34323c', '#22202a');
  let yy = 44, rh = 12, row = 0;
  while (yy < gh) {
    const tw = 52 + rh * 2, off = (row++ % 2) * tw * 0.5;
    for (let x = -off; x < w; x += tw) { const c = 50 + rnd() * 18 | 0; g.fillStyle = `rgb(${c},${c - 3},${c + 6})`; g.fillRect(x + 1.5, yy + 1.5, tw - 3, rh - 3); if (rnd() < 0.05) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x + 4, yy + 3, tw - 8, rh - 6); } }
    yy += rh; rh *= 1.12;
  }
  for (let i = 0; i < w / 200; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 70); g.fillStyle = 'rgba(90,20,20,0.35)'; g.beginPath(); g.ellipse(px, py, 40, 10, 0, 0, TAU); g.fill(); }
  groundShade(g, w);
  const fgW = fg.canvas.width / bg.scale;
  for (let x = rnd() * 200; x < fgW; x += 360 + rnd() * 300) { fg.fillStyle = 'rgba(8,8,12,0.94)'; fg.fillRect(x, 40, 46, 140); fg.fillRect(x - 10, 30, 66, 16); }
}

// ---------------- 기억의 공간 ----------------
function buildMemory(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#2a2236'], [0.45, '#6a5a6a'], [0.8, '#c8a880'], [1, '#e8d0a0']]);
  glowOrb(f, farW * 0.5, 200, 560, '255,240,200', 0.35);
  // 떠다니는 파편 (거울 조각)
  for (let i = 0; i < 46; i++) {
    const x = rnd() * farW, y = 30 + rnd() * 300, s = 8 + rnd() * 30, a = rnd() * TAU;
    f.save(); f.translate(x, y); f.rotate(a);
    f.fillStyle = `rgba(255,${230 + rnd() * 25 | 0},${190 + rnd() * 40 | 0},${0.2 + rnd() * 0.35})`;
    f.beginPath(); f.moveTo(0, -s); f.lineTo(s * 0.6, 0); f.lineTo(0, s * 0.8); f.lineTo(-s * 0.5, s * 0.1); f.closePath(); f.fill();
    f.strokeStyle = 'rgba(255,255,240,0.4)'; f.lineWidth = 1; f.stroke();
    f.restore();
  }
  // 거꾸로 매달린 섬 (기억의 풍경)
  for (let x = rnd() * 300; x < farW; x += 500 + rnd() * 400) {
    const y = 80 + rnd() * 100, ww = 140 + rnd() * 100;
    f.fillStyle = 'rgba(70,56,70,0.65)'; f.beginPath(); f.moveTo(x - ww / 2, y); f.lineTo(x + ww / 2, y); f.lineTo(x + ww * 0.1, y + 70 + rnd() * 50); f.closePath(); f.fill();
    f.fillStyle = 'rgba(90,110,80,0.6)'; f.fillRect(x - ww / 2, y - 6, ww, 8);
    f.fillStyle = 'rgba(60,46,50,0.7)'; f.fillRect(x - 20, y - 40, 30, 34); f.beginPath(); f.moveTo(x - 26, y - 40); f.lineTo(x - 5, y - 60); f.lineTo(x + 16, y - 40); f.fill();
  }
  haze(f, farW, 'rgba(255,230,190,A)', 160);
  // 중경 : 흐릿한 문틀 · 의자 · 기둥 (누군가의 방)
  for (let x = 140 + rnd() * 200; x < midW; x += 380 + rnd() * 260) {
    const r = rnd();
    m.globalAlpha = 0.55;
    if (r < 0.35) { m.strokeStyle = '#4a3a3a'; m.lineWidth = 10; m.strokeRect(x - 50, FLOOR_Y - 190, 100, 190); m.fillStyle = 'rgba(255,240,210,0.5)'; m.fillRect(x - 45, FLOOR_Y - 185, 90, 185); }
    else if (r < 0.65) { m.fillStyle = '#5a4646'; m.fillRect(x - 24, FLOOR_Y - 120, 8, 120); m.fillRect(x - 24, FLOOR_Y - 60, 48, 8); m.fillRect(x + 16, FLOOR_Y - 60, 8, 60); m.fillRect(x - 24, FLOOR_Y - 120, 48, 8); }
    else { const cg = m.createLinearGradient(x - 26, 0, x + 26, 0); cg.addColorStop(0, '#6a5a5a'); cg.addColorStop(0.5, '#a89080'); cg.addColorStop(1, '#5a4a4a'); m.fillStyle = cg; m.fillRect(x - 26, FLOOR_Y - 260 + rnd() * 80, 52, 300); }
    m.globalAlpha = 1;
    if (rnd() < 0.6) bg.lights.push({ type: 'crystal', x: x + (rnd() - 0.5) * 120, y: FLOOR_Y - 100 - rnd() * 160, r: 70, col: '255,230,170' });
  }
  // 지면 : 물처럼 비치는 금빛 바닥
  const gh = groundFill(g, w, '#8a7468', '#4a3a40');
  for (let i = 0; i < w / 30; i++) { const px = rnd() * w, py = 50 + rnd() * (gh - 60), k = 0.5 + py / gh; g.fillStyle = `rgba(255,240,210,${0.06 + rnd() * 0.1})`; g.fillRect(px, py, (30 + rnd() * 80) * k, 1.5); }
  groundShade(g, w);
  const [gc, gg] = newGlow(bg, w, gh); bg.glow = gc;
  gg.strokeStyle = 'rgba(255,230,170,0.5)'; gg.lineWidth = 1.5;
  for (let i = 0; i < w / 180; i++) { const px = rnd() * w, py = 60 + rnd() * (gh - 80); gg.beginPath(); gg.moveTo(px, py); for (let k = 0; k < 4; k++) gg.lineTo(px + (rnd() - 0.3) * 80 * (k + 1), py + (rnd() - 0.5) * 20); gg.stroke(); }
  const fgW = fg.canvas.width / bg.scale;
  for (let x = rnd() * 200; x < fgW; x += 260 + rnd() * 300) { fg.fillStyle = 'rgba(255,235,200,0.14)'; fg.beginPath(); fg.ellipse(x, 150, 120, 50, 0, 0, TAU); fg.fill(); }
}

// ---------------- 마왕성 ----------------
function buildDemon(bg, [f, m, g, fg], farW, midW, w, rnd) {
  skyGrad(f, farW, [[0, '#0a0206'], [0.4, '#2a0612'], [0.8, '#5a0c1e'], [1, '#7a1424']]);
  // 붉은 달 + 갈라진 하늘
  glowOrb(f, farW * 0.62, 130, 300, '255,40,60', 0.35);
  f.fillStyle = '#c81a2e'; f.beginPath(); f.arc(farW * 0.62, 130, 46, 0, TAU); f.fill();
  f.fillStyle = 'rgba(40,0,8,0.6)'; f.beginPath(); f.arc(farW * 0.62 + 14, 122, 40, 0, TAU); f.fill();
  f.strokeStyle = 'rgba(255,90,140,0.5)'; f.lineWidth = 2;
  for (let i = 0; i < 8; i++) { let x = rnd() * farW, y = 0; f.beginPath(); f.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 60; y += 20 + rnd() * 30; f.lineTo(x, y); } f.stroke(); }
  // 첨탑 숲
  for (let x = rnd() * 40; x < farW; x += 30 + rnd() * 60) { const h = 100 + rnd() * 220, ww = 14 + rnd() * 22; f.fillStyle = '#0c0408'; f.beginPath(); f.moveTo(x, GROUND_Y + 30); f.lineTo(x, GROUND_Y + 30 - h); f.lineTo(x + ww / 2, GROUND_Y + 30 - h - 40 - rnd() * 40); f.lineTo(x + ww, GROUND_Y + 30 - h); f.lineTo(x + ww, GROUND_Y + 30); f.fill(); if (rnd() < 0.3) { f.fillStyle = 'rgba(255,60,90,0.8)'; f.fillRect(x + ww / 2 - 2, GROUND_Y + 30 - h + 20, 4, 6); } }
  haze(f, farW, 'rgba(200,20,50,A)', 220);
  // 중경 : 검은 성벽 + 뼈 장식 + 붉은 수정
  for (let x = 0; x < midW; x += 500 + rnd() * 200) {
    const ww = 360 + rnd() * 120, top = 120 + rnd() * 30;
    const gr = m.createLinearGradient(0, top, 0, FLOOR_Y); gr.addColorStop(0, '#1a0c12'); gr.addColorStop(1, '#2a141c');
    m.fillStyle = gr; m.beginPath(); m.moveTo(x, FLOOR_Y); m.lineTo(x, top);
    for (let k = 0; k <= ww; k += 30) m.lineTo(x + k, top - (k % 60 ? 0 : 36));
    m.lineTo(x + ww, FLOOR_Y); m.fill();
    // 문 (붉은 빛)
    const dx = x + ww / 2;
    m.fillStyle = '#05010a'; m.beginPath(); m.moveTo(dx - 50, FLOOR_Y); m.lineTo(dx - 50, FLOOR_Y - 120); m.quadraticCurveTo(dx, FLOOR_Y - 190, dx + 50, FLOOR_Y - 120); m.lineTo(dx + 50, FLOOR_Y); m.fill();
    bg.lights.push({ type: 'crystal', x: dx, y: FLOOR_Y - 80, r: 120, col: '255,30,60' });
    // 해골 장식
    for (let k = 0; k < 4; k++) { const sx = x + 40 + k * (ww - 80) / 3, syy = top + 40; m.fillStyle = '#8a7a70'; m.beginPath(); m.arc(sx, syy, 10, 0, TAU); m.fill(); m.fillStyle = '#05010a'; m.fillRect(sx - 6, syy - 2, 4, 4); m.fillRect(sx + 2, syy - 2, 4, 4); }
    bg.lights.push({ type: 'eye', x: x + 30, y: top + 90 }); bg.lights.push({ type: 'eye', x: x + ww - 30, y: top + 90 });
    // 붉은 수정 기둥
    const cx = x + ww + 60 + rnd() * 60;
    if (cx < midW) { m.fillStyle = '#5a0a1c'; m.beginPath(); m.moveTo(cx - 20, FLOOR_Y); m.lineTo(cx - 10, FLOOR_Y - 170); m.lineTo(cx, FLOOR_Y - 220); m.lineTo(cx + 12, FLOOR_Y - 160); m.lineTo(cx + 22, FLOOR_Y); m.fill(); m.fillStyle = 'rgba(255,90,120,0.5)'; m.fillRect(cx - 4, FLOOR_Y - 200, 3, 180); bg.lights.push({ type: 'crystal', x: cx, y: FLOOR_Y - 120, r: 90, col: '255,40,80' }); }
  }
  // 지면 : 검은 흑요석 + 핏빛 균열
  const gh = groundFill(g, w, '#1e0e14', '#0e060a');
  groundNoise(g, w, rnd, ['#2a141c', '#0a0406', '#3a1a24', '#140810'], w * 0.8, 18);
  groundShade(g, w);
  const [gc, gg] = newGlow(bg, w, gh); bg.glow = gc;
  gg.strokeStyle = 'rgba(255,40,70,0.75)'; gg.lineWidth = 2.5;
  for (let i = 0; i < w / 140; i++) { let px = rnd() * w, py = 50 + rnd() * (gh - 60); gg.beginPath(); gg.moveTo(px, py); for (let k = 0; k < 5; k++) { px += 20 + rnd() * 40; py += (rnd() - 0.5) * 16; gg.lineTo(px, py); } gg.stroke(); }
  const fgW = fg.canvas.width / bg.scale;
  for (let x = rnd() * 100; x < fgW; x += 200 + rnd() * 260) { fg.fillStyle = 'rgba(4,0,2,0.95)'; fg.beginPath(); fg.moveTo(x - 20, 180); fg.lineTo(x, 40 + rnd() * 60); fg.lineTo(x + 20, 180); fg.fill(); }
}

// 테마 등록 (stage.js buildBackground / AMBIENT 가 읽는다)
const STORY_THEMES = { shore: buildShore, village: buildVillage, kingdom: buildKingdom, memory: buildMemory, demon: buildDemon };
Object.assign(AMBIENT, {
  shore: { n: 40, rate: 0.5, cols: ['220,230,235', '190,200,210'], vx: [-1.4, -0.4], vy: [-0.1, 0.25], r: [3, 6] },
  village: { n: 60, rate: 0.7, cols: ['255,140,50', '255,200,100', '120,110,100'], vx: [-0.4, 0.6], vy: [-1.6, -0.5], r: [3, 7], y0: 250, y1: 720 },
  kingdom: { n: 30, cols: ['220,210,240', '255,220,170'], vx: [-0.2, 0.3], vy: [-0.2, 0.15], r: [3, 6] },
  memory: { n: 60, rate: 0.6, cols: ['255,240,200', '255,220,160', '220,230,255'], vx: [-0.25, 0.25], vy: [-0.6, -0.1], r: [4, 10], blink: true },
  demon: { n: 50, rate: 0.6, cols: ['255,40,70', '255,120,140', '120,20,40'], vx: [-0.4, 0.4], vy: [-1.2, -0.3], r: [3, 8], y0: 250, y1: 720 },
});
