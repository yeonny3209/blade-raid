'use strict';
// ============================================================
//  던전 구성 + 절차적 배경 생성
// ============================================================
const DUNGEON = {
  name: '바르카스의 둥지',
  rooms: [
    {
      name: '어둠의 숲 입구', theme: 'forest', width: 1900, seed: 11,
      waves: [
        [['goblin', 820, 70], ['goblin', 980, 160], ['goblin', 1180, 100], ['thrower', 1450, 190]],
        [['goblin', 1350, 40], ['goblin', 1550, 170], ['thrower', 1750, 110], ['goblin', 500, 200]],
      ],
    },
    {
      name: '고블린 야영지', theme: 'forest', width: 2100, seed: 23,
      waves: [
        [['goblin', 760, 80], ['goblin', 900, 180], ['thrower', 1300, 40], ['thrower', 1350, 200], ['goblin', 1100, 120]],
        [['orc', 1500, 110], ['goblin', 1350, 50], ['goblin', 1400, 190]],
      ],
    },
    {
      name: '잊혀진 신전', theme: 'ruins', width: 2000, seed: 37,
      waves: [
        [['mage', 1200, 60], ['mage', 1400, 180], ['goblin', 850, 90], ['goblin', 950, 170], ['goblin', 1000, 40]],
        [['orc', 1300, 80], ['orc', 1600, 170], ['mage', 1800, 120]],
      ],
    },
    {
      name: '피의 회랑', theme: 'ruins', width: 2200, seed: 51, carpet: true,
      waves: [
        [['orc', 900, 120], ['thrower', 1400, 40], ['thrower', 1450, 200], ['mage', 1700, 110], ['goblin', 1100, 60], ['goblin', 1150, 180]],
        [['orc', 1500, 60], ['orc', 1650, 180], ['mage', 1900, 50], ['mage', 1950, 190], ['goblin', 700, 120]],
      ],
    },
    {
      name: '군주의 옥좌', theme: 'lair', width: 1800, seed: 77, boss: true,
      waves: [[['boss', 1300, 115]]],
    },
  ],
};

class Room {
  constructor(idx) {
    const def = DUNGEON.rooms[idx];
    this.def = def; this.idx = idx; this.width = def.width;
    this.minX = 40; this.maxX = def.width - 40;
    this.wave = -1; this.cleared = false; this.clearT = 0; this.waveDelay = 0;
    this.bg = Game.bgCache[idx] || (Game.bgCache[idx] = buildBackground(def, Game.bgScale));
    this.ambient = [];
    this.doorOpen = 0;
  }
  playerMaxX() { return this.cleared && !this.def.boss ? this.width - 10 : this.maxX; }

  spawnWave(i, pre) {
    this.wave = i;
    const list = this.def.waves[i];
    list.forEach(([k, x, y], j) => {
      const e = k === 'boss' ? new Boss(x, y) : new Enemy(k, x, y);
      if (!pre) e.spawnIn(j * 8);
      else { e.aiWait = randi(40, 90) + j * 10; }
      Game.enemies.push(e);
    });
  }

  update() {
    const alive = Game.enemies.some(e => !e.dying && !e.dead);
    if (!this.cleared && !alive && Game.state === 'play') {
      if (this.wave < this.def.waves.length - 1) {
        this.waveDelay++;
        if (this.waveDelay > 45) { this.waveDelay = 0; this.spawnWave(this.wave + 1, false); }
      } else {
        this.cleared = true; this.clearT = 0;
        Game.onRoomClear();
      }
    }
    if (this.cleared) { this.clearT++; this.doorOpen = Math.min(1, this.doorOpen + 0.03); }
    this.updateAmbient();
  }

  updateAmbient() {
    const th = this.def.theme, cam = Game.cam.x;
    const want = th === 'forest' ? 26 : th === 'ruins' ? 30 : 46;
    if (this.ambient.length < want && chance(0.3)) {
      const a = { x: cam + rand(-50, W + 50), y: rand(40, H - 60), t: 0, life: randi(160, 320), ph: rand(0, TAU) };
      if (th === 'forest') { a.vx = rand(-0.3, 0.3); a.vy = rand(-0.25, 0.1); a.col = chance(0.7) ? '200,255,120' : '140,230,255'; a.r = rand(5, 9); a.blink = true; }
      else if (th === 'ruins') { a.vx = rand(-0.15, 0.25); a.vy = rand(-0.1, 0.15); a.col = '255,230,190'; a.r = rand(3, 6); }
      else { a.y = rand(250, H); a.vx = rand(-0.4, 0.4); a.vy = rand(-1.4, -0.4); a.col = chance(0.8) ? '255,120,40' : '255,200,90'; a.r = rand(4, 8); }
      this.ambient.push(a);
    }
    for (const a of this.ambient) { a.t++; a.x += a.vx + Math.sin((a.t + a.ph * 50) * 0.02) * 0.3; a.y += a.vy; }
    this.ambient = this.ambient.filter(a => a.t < a.life);
  }

  drawAmbient(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    for (const a of this.ambient) {
      const u = a.t / a.life;
      let al = Math.min(1, u * 5, (1 - u) * 4);
      if (a.blink) al *= 0.5 + 0.5 * Math.sin(a.t * 0.08 + a.ph);
      drawGlow(ctx, a.x, a.y, a.r, a.col, al * 0.8);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- 배경 레이어 ----------
  drawBack(ctx, camX) {
    const bg = this.bg, s = bg.scale;
    const fx = -camX * 0.22, mx = -camX * 0.55;
    ctx.drawImage(bg.far, 0, 0, bg.far.width, bg.far.height, fx, 0, bg.far.width / s, bg.far.height / s);
    // 움직이는 요소 (횃불, 용암 등) - 원경 뒤
    ctx.drawImage(bg.mid, 0, 0, bg.mid.width, bg.mid.height, mx, 0, bg.mid.width / s, bg.mid.height / s);
    this.drawMidAnim(ctx, mx);
    ctx.drawImage(bg.ground, 0, 0, bg.ground.width, bg.ground.height, -camX, GROUND_Y - 44, bg.ground.width / s, bg.ground.height / s);
    if (bg.glow) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + Math.sin(Game.time * 0.04) * 0.25;
      ctx.drawImage(bg.glow, 0, 0, bg.glow.width, bg.glow.height, -camX, GROUND_Y - 44, bg.glow.width / s, bg.glow.height / s);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }

  drawMidAnim(ctx, mx) {
    const bg = this.bg, t = Game.time;
    ctx.globalCompositeOperation = 'lighter';
    for (const L of bg.lights) {
      const x = L.x + mx;
      if (x < -200 || x > W + 200) continue;
      if (L.type === 'torch') {
        const fl = 0.8 + Math.sin(t * 0.3 + L.x) * 0.1 + Math.sin(t * 0.73 + L.x * 2) * 0.08;
        drawGlow(ctx, x, L.y - 8, 140 * fl, '255,140,50', 0.35);
        drawGlow(ctx, x, L.y - 10, 40 * fl, '255,200,120', 0.8);
        // 불꽃
        ctx.fillStyle = `rgba(255,${160 + Math.sin(t * 0.5 + L.x) * 40 | 0},60,0.95)`;
        const h = 22 * fl;
        ctx.beginPath(); ctx.moveTo(x - 7, L.y); ctx.quadraticCurveTo(x - 8, L.y - h * 0.6, x + Math.sin(t * 0.4 + L.x) * 3, L.y - h); ctx.quadraticCurveTo(x + 8, L.y - h * 0.6, x + 7, L.y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.9)';
        ctx.beginPath(); ctx.ellipse(x, L.y - 5, 3.5, 7 * fl, 0, 0, TAU); ctx.fill();
      } else if (L.type === 'lava') {
        const g = 0.6 + Math.sin(t * 0.05 + L.x) * 0.2;
        drawGlow(ctx, x, L.y, L.r, '255,90,20', 0.35 * g, 1, 1.6);
        // 흐르는 줄기
        ctx.fillStyle = 'rgba(255,150,40,0.5)';
        for (let i = 0; i < 4; i++) {
          const yy = ((t * 3 + i * 60) % 240);
          ctx.fillRect(x - L.w / 2 + (i * 7) % L.w, L.top + yy, 3, 26);
        }
      } else if (L.type === 'eye') {
        const g = 0.6 + Math.sin(t * 0.06) * 0.3;
        drawGlow(ctx, x, L.y, 26, '255,40,20', g);
      } else if (L.type === 'shaft') {
        ctx.globalAlpha = 0.07 + Math.sin(t * 0.01 + L.x) * 0.03;
        ctx.fillStyle = '#cfefff';
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + L.w, 0); ctx.lineTo(x + L.w + 260, GROUND_Y + 40); ctx.lineTo(x + 160, GROUND_Y + 40); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  drawFront(ctx, camX) {
    const bg = this.bg, s = bg.scale;
    if (bg.fg) ctx.drawImage(bg.fg, 0, 0, bg.fg.width, bg.fg.height, -camX * 1.18, 0, bg.fg.width / s, bg.fg.height / s);
  }

  // 출구 게이트 (월드 좌표)
  drawDoor(ctx) {
    if (this.def.boss) return;
    const x = this.width - 46, y = DEPTH / 2, gy = sy(y, 0), o = this.doorOpen, t = Game.time;
    ctx.save();
    // 바닥 빛
    ctx.globalCompositeOperation = 'lighter';
    const col = o > 0 ? '90,180,255' : '255,50,40';
    drawGlow(ctx, x, gy, 150, col, 0.25 + o * 0.25, 1, 0.5);
    // 소용돌이 포탈
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = o > 0 ? `rgba(140,210,255,${0.4 + o * 0.4})` : 'rgba(255,70,50,0.35)';
      ctx.lineWidth = 3 - i * 0.6;
      ctx.beginPath(); ctx.ellipse(x, gy - 110, 36 - i * 8, 110 - i * 18, 0, t * 0.03 * (i + 1), t * 0.03 * (i + 1) + Math.PI * 1.4); ctx.stroke();
    }
    drawGlow(ctx, x, gy - 110, 110, col, 0.3 + o * 0.35, 0.5, 1.2);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
}

// ============================================================
//  배경 생성기
// ============================================================
function buildBackground(def, S) {
  const rnd = mulberry(def.seed * 9973 + 17);
  const w = def.width;
  const farW = W + (w - W) * 0.22 + 40, midW = W + (w - W) * 0.55 + 40;
  const far = makeCanvas(farW * S, (GROUND_Y + 30) * S);
  const mid = makeCanvas(midW * S, (GROUND_Y + 30) * S);
  const gnd = makeCanvas(w * S, (H - GROUND_Y + 44) * S);
  const fg = makeCanvas((W + (w - W) * 1.18 + 60) * S, 180 * S);
  const ctxs = [far, mid, gnd, fg].map(c => { const g = c.getContext('2d'); g.scale(S, S); return g; });
  const bg = { far, mid, ground: gnd, fg, scale: S, lights: [], glow: null };
  const T = def.theme;
  if (T === 'forest') buildForest(bg, ctxs, farW, midW, w, rnd, def);
  else if (T === 'ruins') buildRuins(bg, ctxs, farW, midW, w, rnd, def);
  else buildLair(bg, ctxs, farW, midW, w, rnd, def, S);
  return bg;
}

// 지면 공통 : 깊이감 그라디언트 + 노이즈
function groundNoise(g, w, rnd, cols, n, sz) {
  const gh = H - GROUND_Y + 44;
  for (let i = 0; i < n; i++) {
    const y = 44 + rnd() * (gh - 44), k = 0.55 + (y - 44) / (gh - 44) * 0.8;
    g.globalAlpha = 0.05 + rnd() * 0.12;
    g.fillStyle = cols[(rnd() * cols.length) | 0];
    g.beginPath(); g.ellipse(rnd() * w, y, (sz * 0.5 + rnd() * sz) * k * 2.2, (sz * 0.3 + rnd() * sz * 0.5) * k * 0.6, 0, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
function groundShade(g, w) {
  const gh = H - GROUND_Y + 44;
  const gr = g.createLinearGradient(0, 30, 0, gh);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.25, 'rgba(0,0,0,0.1)'); gr.addColorStop(0.75, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
}

// ---------------- 숲 ----------------
function buildForest(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  // 원경
  let gr = f.createLinearGradient(0, 0, 0, GROUND_Y + 30);
  gr.addColorStop(0, '#060c16'); gr.addColorStop(0.45, '#10263a'); gr.addColorStop(0.8, '#1d4048'); gr.addColorStop(1, '#2b5452');
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);
  // 달
  const mx = farW * 0.62;
  let rg = f.createRadialGradient(mx, 100, 0, mx, 100, 260);
  rg.addColorStop(0, 'rgba(210,240,255,0.45)'); rg.addColorStop(0.2, 'rgba(150,210,230,0.15)'); rg.addColorStop(1, 'rgba(100,160,200,0)');
  f.fillStyle = rg; f.fillRect(0, 0, farW, GROUND_Y);
  f.fillStyle = '#e6f6ff'; f.beginPath(); f.arc(mx, 100, 34, 0, TAU); f.fill();
  f.fillStyle = 'rgba(160,200,220,0.35)'; f.beginPath(); f.arc(mx + 8, 94, 10, 0, TAU); f.arc(mx - 12, 110, 7, 0, TAU); f.fill();
  // 별
  for (let i = 0; i < 120; i++) { f.fillStyle = `rgba(220,240,255,${rnd() * 0.6})`; f.fillRect(rnd() * farW, rnd() * 200, 1.4, 1.4); }
  // 먼 산
  const ridge = (col, base, amp, step) => {
    f.fillStyle = col; f.beginPath(); f.moveTo(0, GROUND_Y + 30);
    for (let x = 0; x <= farW + step; x += step) f.lineTo(x, base - rnd() * amp - Math.sin(x * 0.004) * amp * 0.5);
    f.lineTo(farW, GROUND_Y + 30); f.closePath(); f.fill();
  };
  ridge('#142a36', 230, 90, 40);
  ridge('#18333c', 280, 60, 30);
  // 먼 숲 실루엣
  const pines = (col, base, hmin, hmax, n) => {
    f.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const x = rnd() * farW, h = hmin + rnd() * (hmax - hmin), wd = h * 0.28;
      f.beginPath(); f.moveTo(x, base - h);
      for (let k = 1; k <= 4; k++) { f.lineTo(x + wd * k / 4, base - h + h * k / 4.4); f.lineTo(x + wd * k / 8, base - h + h * k / 4.4); }
      f.lineTo(x + wd, base); f.lineTo(x - wd, base);
      for (let k = 4; k >= 1; k--) { f.lineTo(x - wd * k / 8, base - h + h * k / 4.4); f.lineTo(x - wd * k / 4, base - h + h * k / 4.4); }
      f.closePath(); f.fill();
    }
  };
  pines('#1a3a40', GROUND_Y + 30, 70, 150, farW / 22);
  gr = f.createLinearGradient(0, 200, 0, GROUND_Y + 30);
  gr.addColorStop(0, 'rgba(120,190,190,0)'); gr.addColorStop(1, 'rgba(120,190,190,0.25)');
  f.fillStyle = gr; f.fillRect(0, 200, farW, GROUND_Y);
  pines('#132c30', GROUND_Y + 30, 90, 190, farW / 30);

  // 중경 : 큰 나무
  m.clearRect(0, 0, midW, GROUND_Y + 30);
  // 수풀 윗부분
  for (let i = 0; i < midW / 40; i++) {
    const x = rnd() * midW, r = 60 + rnd() * 90;
    m.fillStyle = choose(['#0a1a14', '#0c1f17', '#0e231a']);
    m.beginPath(); m.ellipse(x, rnd() * 60 - 20, r, r * 0.6, 0, 0, TAU); m.fill();
  }
  let x = rnd() * 120;
  while (x < midW) {
    const tw = 38 + rnd() * 60, lean = (rnd() - 0.5) * 30;
    const base = GROUND_Y + 22;
    // 줄기
    const tg = m.createLinearGradient(x - tw, 0, x + tw, 0);
    tg.addColorStop(0, '#0d110e'); tg.addColorStop(0.35, '#1d251d'); tg.addColorStop(0.6, '#253024'); tg.addColorStop(1, '#0b0f0c');
    m.fillStyle = tg;
    m.beginPath();
    m.moveTo(x - tw / 2 + lean, -10); m.lineTo(x + tw / 2 + lean, -10);
    m.quadraticCurveTo(x + tw * 0.45, base - 80, x + tw * 1.3, base);
    m.lineTo(x - tw * 1.3, base);
    m.quadraticCurveTo(x - tw * 0.45, base - 80, x - tw / 2 + lean, -10);
    m.fill();
    // 껍질 결
    m.strokeStyle = 'rgba(80,100,70,0.25)'; m.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      const bx = x - tw / 3 + rnd() * tw * 0.66;
      m.beginPath(); m.moveTo(bx + lean * 0.8, rnd() * 60); m.bezierCurveTo(bx + 6, 120, bx - 6, 220, bx + (bx - x) * 0.3, base - 30); m.stroke();
    }
    // 이끼
    m.fillStyle = 'rgba(70,110,50,0.35)';
    for (let k = 0; k < 5; k++) { m.beginPath(); m.ellipse(x + (rnd() - 0.5) * tw, 120 + rnd() * 200, 6 + rnd() * 10, 3 + rnd() * 6, 0, 0, TAU); m.fill(); }
    // 가지
    if (rnd() < 0.7) {
      const by = 60 + rnd() * 120, dir = rnd() < 0.5 ? -1 : 1;
      m.strokeStyle = '#141a14'; m.lineWidth = 10; m.lineCap = 'round';
      m.beginPath(); m.moveTo(x, by); m.quadraticCurveTo(x + dir * 60, by - 20, x + dir * 130, by - 60 - rnd() * 40); m.stroke();
    }
    // 덩굴
    m.strokeStyle = 'rgba(40,70,40,0.8)'; m.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const vx = x + (rnd() - 0.5) * tw * 2, len = 60 + rnd() * 140;
      m.beginPath(); m.moveTo(vx, 0); m.bezierCurveTo(vx + 10, len * 0.3, vx - 10, len * 0.6, vx + 4, len); m.stroke();
    }
    if (rnd() < 0.5) bg.lights.push({ type: 'shaft', x: x + tw, w: 40 + rnd() * 60 });
    x += 200 + rnd() * 260;
  }
  // 하단 수풀
  for (let i = 0; i < midW / 18; i++) {
    const bx = rnd() * midW, r = 30 + rnd() * 50;
    m.fillStyle = choose(['#0f2418', '#132c1c', '#0c1d14']);
    m.beginPath(); m.ellipse(bx, GROUND_Y + 10 - rnd() * 20, r, r * 0.55, 0, Math.PI, TAU); m.fill();
  }
  // 빛나는 버섯
  for (let i = 0; i < midW / 160; i++) {
    const bx = rnd() * midW, by = GROUND_Y + 4 - rnd() * 10;
    m.fillStyle = '#b8f0ff'; m.beginPath(); m.ellipse(bx, by - 8, 7, 4, 0, Math.PI, TAU); m.fill();
    m.fillStyle = '#cfe'; m.fillRect(bx - 1.5, by - 8, 3, 8);
    const mg = m.createRadialGradient(bx, by - 8, 0, bx, by - 8, 30); mg.addColorStop(0, 'rgba(120,230,255,0.35)'); mg.addColorStop(1, 'rgba(120,230,255,0)');
    m.fillStyle = mg; m.fillRect(bx - 30, by - 38, 60, 60);
  }

  // 지면
  const gh = H - GROUND_Y + 44;
  gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#1f2a1c'); gr.addColorStop(0.3, '#2f3526'); gr.addColorStop(1, '#3f4430');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  // 흙길
  g.fillStyle = '#453d2d';
  g.beginPath(); g.moveTo(0, 80);
  for (let xx = 0; xx <= w; xx += 60) g.lineTo(xx, 74 + Math.sin(xx * 0.01) * 10 + rnd() * 8);
  for (let xx = w; xx >= 0; xx -= 60) g.lineTo(xx, gh - 40 + Math.sin(xx * 0.013) * 14 + rnd() * 10);
  g.closePath(); g.fill();
  groundNoise(g, w, rnd, ['#5a4e39', '#2e2a1f', '#3b4a2a', '#6a5c42'], w * 0.9, 14);
  // 돌
  for (let i = 0; i < w / 45; i++) {
    const sx = rnd() * w, syy = 60 + rnd() * (gh - 80), k = 0.6 + (syy / gh);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(sx + 2, syy + 3 * k, 9 * k, 3.5 * k, 0, 0, TAU); g.fill();
    g.fillStyle = choose(['#5c5a52', '#4a4842', '#6b675c']); g.beginPath(); g.ellipse(sx, syy, 8 * k, 4.5 * k, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(sx - 2 * k, syy - 1.5 * k, 4 * k, 1.8 * k, 0, 0, TAU); g.fill();
  }
  // 낙엽
  for (let i = 0; i < w / 6; i++) {
    const sx = rnd() * w, syy = 50 + rnd() * (gh - 60), k = 0.6 + syy / gh;
    g.fillStyle = choose(['#7a4a1e', '#8a5a24', '#5a3a1a', '#6a6a2a']); g.globalAlpha = 0.7;
    g.beginPath(); g.ellipse(sx, syy, 3 * k, 1.4 * k, rnd() * 3, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // 풀
  const tuft = (tx, ty, k, col) => {
    g.strokeStyle = col; g.lineWidth = 1.4 * k;
    g.beginPath();
    for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 1.3; const L = (6 + rnd() * 10) * k; g.moveTo(tx + (rnd() - 0.5) * 8 * k, ty); g.lineTo(tx + Math.cos(a) * L, ty + Math.sin(a) * L); }
    g.stroke();
  };
  for (let i = 0; i < w / 12; i++) { const ty = 50 + rnd() * (gh - 60); tuft(rnd() * w, ty, 0.6 + ty / gh, choose(['#3d5a28', '#4f7030', '#2e4420'])); }
  groundShade(g, w);
  // 상단 경계 수풀
  for (let i = 0; i < w / 7; i++) {
    const tx = rnd() * w, ty = 36 + rnd() * 16;
    tuft(tx, ty, 1.4, choose(['#1c3018', '#243a1c', '#152512']));
  }
  for (let i = 0; i < w / 50; i++) {
    const bx = rnd() * w; g.fillStyle = choose(['#10200f', '#162a14']);
    g.beginPath(); g.ellipse(bx, 40, 30 + rnd() * 40, 14 + rnd() * 10, 0, Math.PI, TAU); g.fill();
  }
  // 전경 : 위에서 늘어진 잎사귀
  const fgW = fg.canvas.width / bg.scale;
  for (let i = 0; i < fgW / 220; i++) {
    const vx = rnd() * fgW;
    fg.fillStyle = choose(['#050c08', '#081209']);
    fg.beginPath(); fg.ellipse(vx, -10, 70 + rnd() * 80, 40 + rnd() * 40, 0, 0, TAU); fg.fill();
    fg.strokeStyle = '#07100a'; fg.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      const lx = vx + (rnd() - 0.5) * 120, L = 60 + rnd() * 110;
      fg.beginPath(); fg.moveTo(lx, 0); fg.bezierCurveTo(lx + 12, L * 0.4, lx - 12, L * 0.7, lx + 5, L); fg.stroke();
      for (let q = 0; q < 5; q++) { fg.fillStyle = '#081209'; fg.beginPath(); fg.ellipse(lx + (rnd() - 0.5) * 8, L * q / 5 + 10, 7, 3.5, rnd() * 3, 0, TAU); fg.fill(); }
    }
  }
}

// ---------------- 신전 폐허 ----------------
function buildRuins(bg, [f, m, g, fg], farW, midW, w, rnd, def) {
  let gr = f.createLinearGradient(0, 0, 0, GROUND_Y + 30);
  gr.addColorStop(0, '#07070d'); gr.addColorStop(0.5, '#141425'); gr.addColorStop(1, '#23233a');
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);
  // 먼 기둥들
  for (let x = rnd() * 80; x < farW; x += 110 + rnd() * 80) {
    const pw = 26 + rnd() * 20, top = 40 + rnd() * 100;
    f.fillStyle = '#1b1b2e'; f.fillRect(x, top, pw, GROUND_Y + 30 - top);
    f.fillStyle = '#23233a'; f.fillRect(x + pw * 0.2, top, pw * 0.2, GROUND_Y + 30 - top);
    f.fillStyle = '#191929'; f.fillRect(x - 6, top - 10, pw + 12, 12);
  }
  gr = f.createLinearGradient(0, 150, 0, GROUND_Y + 30);
  gr.addColorStop(0, 'rgba(90,90,150,0)'); gr.addColorStop(1, 'rgba(90,90,150,0.3)');
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);

  // 중경 : 석벽
  const wallTop = 70;
  gr = m.createLinearGradient(0, wallTop, 0, GROUND_Y + 30);
  gr.addColorStop(0, '#24232e'); gr.addColorStop(1, '#31303c');
  m.fillStyle = gr; m.fillRect(0, wallTop, midW, GROUND_Y + 30 - wallTop);
  // 벽돌
  let row = 0;
  for (let y = wallTop; y < GROUND_Y + 30; y += 34) {
    const off = (row++ % 2) * 40;
    for (let x = -off; x < midW; x += 80) {
      m.fillStyle = `rgba(${40 + rnd() * 20 | 0},${40 + rnd() * 18 | 0},${52 + rnd() * 20 | 0},0.7)`;
      m.fillRect(x + 2, y + 2, 76, 30);
      m.fillStyle = 'rgba(255,255,255,0.04)'; m.fillRect(x + 2, y + 2, 76, 3);
      if (rnd() < 0.12) { m.strokeStyle = 'rgba(0,0,0,0.5)'; m.lineWidth = 1.2; m.beginPath(); m.moveTo(x + rnd() * 70, y + 2); m.lineTo(x + rnd() * 70, y + 18); m.lineTo(x + rnd() * 70, y + 32); m.stroke(); }
    }
  }
  // 벽 윗부분 무너짐
  m.fillStyle = '#07070d';
  m.beginPath(); m.moveTo(0, 0); m.lineTo(0, wallTop + 10);
  for (let x = 0; x <= midW; x += 30) m.lineTo(x, wallTop - 10 + rnd() * 40);
  m.lineTo(midW, 0); m.closePath(); m.fill();
  // 아치 + 기둥 + 횃불 + 휘장
  for (let x = 150 + rnd() * 100; x < midW - 60; x += 360 + rnd() * 120) {
    const aw = 120, top = 150;
    const ag = m.createLinearGradient(0, top, 0, GROUND_Y + 30);
    ag.addColorStop(0, '#050509'); ag.addColorStop(1, '#0e0e18');
    m.fillStyle = ag;
    m.beginPath(); m.moveTo(x - aw / 2, GROUND_Y + 30); m.lineTo(x - aw / 2, top + aw / 2); m.arc(x, top + aw / 2, aw / 2, Math.PI, 0); m.lineTo(x + aw / 2, GROUND_Y + 30); m.closePath(); m.fill();
    m.strokeStyle = '#3e3d4c'; m.lineWidth = 10;
    m.beginPath(); m.moveTo(x - aw / 2 - 5, GROUND_Y + 30); m.lineTo(x - aw / 2 - 5, top + aw / 2); m.arc(x, top + aw / 2, aw / 2 + 5, Math.PI, 0); m.lineTo(x + aw / 2 + 5, GROUND_Y + 30); m.stroke();
    m.fillStyle = '#4a4858'; m.fillRect(x - 10, top - 14, 20, 22);
    // 기둥
    for (const px of [x - 170, x + 170]) {
      const cg = m.createLinearGradient(px - 24, 0, px + 24, 0);
      cg.addColorStop(0, '#1c1b25'); cg.addColorStop(0.35, '#4a4858'); cg.addColorStop(0.55, '#57556a'); cg.addColorStop(1, '#17161f');
      m.fillStyle = cg; m.fillRect(px - 24, wallTop - 20, 48, GROUND_Y + 50 - wallTop);
      m.fillStyle = '#3a3947'; m.fillRect(px - 32, wallTop - 30, 64, 16); m.fillRect(px - 32, GROUND_Y + 6, 64, 20);
      m.strokeStyle = 'rgba(0,0,0,0.3)'; m.lineWidth = 2;
      for (let k = -16; k <= 16; k += 8) { m.beginPath(); m.moveTo(px + k, wallTop - 14); m.lineTo(px + k, GROUND_Y + 6); m.stroke(); }
      // 이끼
      m.fillStyle = 'rgba(60,90,50,0.4)'; m.beginPath(); m.ellipse(px, GROUND_Y - 10, 26, 14, 0, 0, TAU); m.fill();
    }
    // 휘장
    if (rnd() < 0.8) {
      const bx = x + (rnd() < 0.5 ? -90 : 90), by = 96;
      m.fillStyle = '#5a0e12'; m.beginPath(); m.moveTo(bx - 22, by); m.lineTo(bx + 22, by); m.lineTo(bx + 22, by + 130); m.lineTo(bx, by + 116); m.lineTo(bx - 22, by + 130); m.closePath(); m.fill();
      m.fillStyle = '#8a1a1e'; m.fillRect(bx - 18, by, 10, 124);
      m.strokeStyle = '#c9a24a'; m.lineWidth = 2; m.strokeRect(bx - 20, by + 4, 40, 8);
      m.beginPath(); m.arc(bx, by + 55, 10, 0, TAU); m.moveTo(bx, by + 40); m.lineTo(bx, by + 70); m.stroke();
    }
    bg.lights.push({ type: 'torch', x: x - 95, y: 205 });
    bg.lights.push({ type: 'torch', x: x + 95, y: 205 });
    for (const tx of [x - 95, x + 95]) {
      m.fillStyle = '#1a1512'; m.fillRect(tx - 3, 205, 6, 22); m.fillStyle = '#3a2f28'; m.beginPath(); m.moveTo(tx - 10, 200); m.lineTo(tx + 10, 200); m.lineTo(tx + 5, 210); m.lineTo(tx - 5, 210); m.closePath(); m.fill();
    }
  }
  // 바닥 몰딩
  m.fillStyle = '#18171f'; m.fillRect(0, GROUND_Y + 4, midW, 30);
  m.fillStyle = '#403e4e'; m.fillRect(0, GROUND_Y + 2, midW, 5);

  // 지면 : 석판
  const gh = H - GROUND_Y + 44;
  g.fillStyle = '#23222b'; g.fillRect(0, 0, w, gh);
  let yy = 44, rh = 13, r = 0;
  while (yy < gh) {
    const tw = 70 + rh * 2.2, off = (r++ % 2) * tw * 0.5;
    for (let x = -off; x < w; x += tw) {
      const c = 42 + rnd() * 16 | 0;
      g.fillStyle = `rgb(${c},${c - 2},${c + 8})`;
      g.fillRect(x + 1.5, yy + 1.5, tw - 3, rh - 3);
      g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 1.5, yy + 1.5, tw - 3, 2);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 1.5, yy + rh - 4, tw - 3, 2.5);
      if (rnd() < 0.1) { g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + rnd() * tw, yy + 2); g.lineTo(x + rnd() * tw, yy + rh * 0.5); g.lineTo(x + rnd() * tw, yy + rh - 2); g.stroke(); }
      if (rnd() < 0.06) { g.fillStyle = 'rgba(60,90,50,0.35)'; g.beginPath(); g.ellipse(x + rnd() * tw, yy + rh / 2, 20, rh * 0.4, 0, 0, TAU); g.fill(); }
    }
    yy += rh; rh *= 1.09;
  }
  if (def.carpet) {
    const cy0 = 44 + 80, cy1 = 44 + 170;
    g.fillStyle = '#4a0a10'; g.fillRect(0, cy0, w, cy1 - cy0);
    g.fillStyle = '#6e1218'; g.fillRect(0, cy0 + 8, w, cy1 - cy0 - 16);
    g.fillStyle = '#c9a24a'; g.fillRect(0, cy0 + 4, w, 3); g.fillRect(0, cy1 - 7, w, 3);
    for (let x = 0; x < w; x += 90) { g.fillStyle = 'rgba(201,162,74,0.35)'; g.beginPath(); g.moveTo(x, (cy0 + cy1) / 2); g.lineTo(x + 20, cy0 + 20); g.lineTo(x + 40, (cy0 + cy1) / 2); g.lineTo(x + 20, cy1 - 20); g.closePath(); g.fill(); }
    groundNoise(g, w, rnd, ['#2a0508', '#000000'], w * 0.2, 12);
  }
  // 잔해
  for (let i = 0; i < w / 70; i++) {
    const sx = rnd() * w, syy = 50 + rnd() * (gh - 60), k = 0.6 + syy / gh;
    for (let q = 0; q < 3; q++) {
      g.fillStyle = choose(['#4a4858', '#3a3947', '#55536a']);
      g.beginPath(); polyPath(g, [sx + q * 7 * k, syy, sx + (q * 7 + 6) * k, syy - 4 * k, sx + (q * 7 + 11) * k, syy + 1, sx + (q * 7 + 4) * k, syy + 4 * k]); g.fill();
    }
  }
  groundNoise(g, w, rnd, ['#000', '#3a3a50', '#1a1a22'], w * 0.4, 16);
  groundShade(g, w);
  // 전경 : 사슬
  const fgW = fg.canvas.width / bg.scale;
  for (let i = 0; i < fgW / 320; i++) {
    const cx = rnd() * fgW, L = 60 + rnd() * 100;
    fg.strokeStyle = '#08080c'; fg.lineWidth = 4;
    for (let y = 0; y < L; y += 12) { fg.beginPath(); fg.ellipse(cx, y, 4, 7, 0, 0, TAU); fg.stroke(); }
    fg.fillStyle = '#08080c'; fg.fillRect(cx - 50, -20, 100, 30);
  }
}

// ---------------- 군주의 둥지 ----------------
function buildLair(bg, [f, m, g, fg], farW, midW, w, rnd, def, S) {
  let gr = f.createLinearGradient(0, 0, 0, GROUND_Y + 30);
  gr.addColorStop(0, '#050203'); gr.addColorStop(0.55, '#1e0708'); gr.addColorStop(1, '#4a120a');
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);
  // 먼 첨탑
  for (let x = rnd() * 60; x < farW; x += 60 + rnd() * 90) {
    const h = 80 + rnd() * 200, wd = 20 + rnd() * 40;
    f.fillStyle = choose(['#1a0708', '#220a0a']);
    f.beginPath(); f.moveTo(x - wd, GROUND_Y + 30); f.lineTo(x - wd * 0.2, GROUND_Y + 30 - h); f.lineTo(x + wd * 0.3, GROUND_Y + 30 - h * 0.9); f.lineTo(x + wd, GROUND_Y + 30); f.closePath(); f.fill();
  }
  gr = f.createLinearGradient(0, 220, 0, GROUND_Y + 30);
  gr.addColorStop(0, 'rgba(255,80,20,0)'); gr.addColorStop(1, 'rgba(255,80,20,0.35)');
  f.fillStyle = gr; f.fillRect(0, 0, farW, GROUND_Y + 30);
  // 종유석
  f.fillStyle = '#090304';
  for (let x = 0; x < farW; x += 30 + rnd() * 40) { const h = 30 + rnd() * 110; f.beginPath(); f.moveTo(x - 20, 0); f.lineTo(x, h); f.lineTo(x + 20, 0); f.closePath(); f.fill(); }

  // 중경 : 동굴 벽
  const rock = (x0, top, wd) => {
    const rg = m.createLinearGradient(x0, 0, x0 + wd, 0);
    rg.addColorStop(0, '#0d0506'); rg.addColorStop(0.5, '#1f0c0c'); rg.addColorStop(1, '#0a0405');
    m.fillStyle = rg;
    m.beginPath(); m.moveTo(x0, GROUND_Y + 30);
    for (let k = 0; k <= 6; k++) m.lineTo(x0 + wd * k / 6 + (rnd() - 0.5) * 20, top + rnd() * 60 - (k === 0 || k === 6 ? -80 : 0));
    m.lineTo(x0 + wd, GROUND_Y + 30); m.closePath(); m.fill();
    m.strokeStyle = 'rgba(255,90,40,0.25)'; m.lineWidth = 2;
    m.beginPath(); m.moveTo(x0 + wd * 0.2, top + 60); m.lineTo(x0 + wd * 0.4, top + 30); m.lineTo(x0 + wd * 0.7, top + 50); m.stroke();
  };
  for (let x = -40; x < midW; x += 140 + rnd() * 160) rock(x, 60 + rnd() * 140, 160 + rnd() * 160);
  // 용암 폭포
  for (let i = 0; i < Math.max(2, midW / 700); i++) {
    const lx = 200 + rnd() * (midW - 400), lw = 26 + rnd() * 20, top = 40 + rnd() * 60;
    const lg = m.createLinearGradient(0, top, 0, GROUND_Y + 30);
    lg.addColorStop(0, '#ff9a2a'); lg.addColorStop(0.5, '#ff5a10'); lg.addColorStop(1, '#ffb040');
    m.fillStyle = lg; m.fillRect(lx - lw / 2, top, lw, GROUND_Y + 30 - top);
    m.fillStyle = 'rgba(255,240,180,0.6)'; m.fillRect(lx - lw * 0.15, top, lw * 0.3, GROUND_Y + 30 - top);
    bg.lights.push({ type: 'lava', x: lx, y: GROUND_Y - 20, r: 180, w: lw, top });
  }
  // 옥좌 (중앙)
  const tx = midW * 0.55;
  m.fillStyle = '#0b0405';
  m.beginPath(); m.moveTo(tx - 130, GROUND_Y + 30); m.lineTo(tx - 110, 150); m.lineTo(tx - 140, 80); m.lineTo(tx - 80, 120); m.lineTo(tx - 40, 40); m.lineTo(tx, 100); m.lineTo(tx + 40, 40); m.lineTo(tx + 80, 120); m.lineTo(tx + 140, 80); m.lineTo(tx + 110, 150); m.lineTo(tx + 130, GROUND_Y + 30); m.closePath(); m.fill();
  m.fillStyle = '#1a0808'; m.fillRect(tx - 90, 230, 180, 30);
  m.strokeStyle = 'rgba(255,60,30,0.5)'; m.lineWidth = 2;
  m.beginPath(); m.moveTo(tx - 60, 140); m.lineTo(tx, 200); m.lineTo(tx + 60, 140); m.stroke();
  bg.lights.push({ type: 'eye', x: tx - 20, y: 130 }, { type: 'eye', x: tx + 20, y: 130 });
  // 해골 더미
  for (let i = 0; i < midW / 200; i++) {
    const sx = rnd() * midW, sy0 = GROUND_Y + 20;
    for (let q = 0; q < 6; q++) {
      const kx = sx + (rnd() - 0.5) * 60, ky = sy0 - rnd() * 24;
      m.fillStyle = '#6a5e50'; m.beginPath(); m.arc(kx, ky, 7, 0, TAU); m.fill();
      m.fillStyle = '#0a0404'; m.beginPath(); m.arc(kx - 2.5, ky, 1.8, 0, TAU); m.arc(kx + 2.5, ky, 1.8, 0, TAU); m.fill();
    }
  }
  // 사슬
  m.strokeStyle = '#0a0506'; m.lineWidth = 3;
  for (let i = 0; i < midW / 250; i++) { const cx = rnd() * midW; for (let y = 0; y < 100 + rnd() * 120; y += 10) { m.beginPath(); m.ellipse(cx, y, 3, 6, 0, 0, TAU); m.stroke(); } }

  // 지면 : 현무암 + 용암 균열
  const gh = H - GROUND_Y + 44;
  gr = g.createLinearGradient(0, 0, 0, gh);
  gr.addColorStop(0, '#150a0a'); gr.addColorStop(1, '#2a1414');
  g.fillStyle = gr; g.fillRect(0, 0, w, gh);
  groundNoise(g, w, rnd, ['#3a1c18', '#0a0404', '#2c1512', '#4a2418'], w * 0.8, 16);
  // 뼈
  for (let i = 0; i < w / 90; i++) {
    const sx = rnd() * w, syy = 60 + rnd() * (gh - 70), k = 0.6 + syy / gh, a = rnd() * 3;
    g.save(); g.translate(sx, syy); g.rotate(a); g.scale(k, k * 0.5);
    g.fillStyle = '#8a7c68'; g.fillRect(-10, -1.5, 20, 3); g.beginPath(); g.arc(-10, -2, 2.5, 0, TAU); g.arc(-10, 2, 2.5, 0, TAU); g.arc(10, -2, 2.5, 0, TAU); g.arc(10, 2, 2.5, 0, TAU); g.fill();
    g.restore();
  }
  groundShade(g, w);
  // 용암 균열 (발광 레이어)
  const glow = makeCanvas(w * S, gh * S);
  const gg = glow.getContext('2d'); gg.scale(S, S);
  gg.lineCap = 'round'; gg.lineJoin = 'round';
  for (let i = 0; i < w / 110; i++) {
    let cx = rnd() * w, cy = 60 + rnd() * (gh - 80);
    const pts = [[cx, cy]];
    for (let k = 0; k < 6; k++) { cx += 14 + rnd() * 30; cy += (rnd() - 0.5) * 12; pts.push([cx, cy]); }
    for (const [lw, col] of [[7, 'rgba(255,70,10,0.25)'], [3, 'rgba(255,120,30,0.8)'], [1.2, 'rgba(255,230,150,0.9)']]) {
      gg.strokeStyle = col; gg.lineWidth = lw; gg.beginPath(); pts.forEach(([a, b], j) => j ? gg.lineTo(a, b) : gg.moveTo(a, b)); gg.stroke();
    }
    g.strokeStyle = '#050202'; g.lineWidth = 5; g.beginPath(); pts.forEach(([a, b], j) => j ? g.lineTo(a, b) : g.moveTo(a, b)); g.stroke();
  }
  // 상단 경계
  gr = g.createLinearGradient(0, 30, 0, 60);
  gr.addColorStop(0, '#0a0404'); gr.addColorStop(1, 'rgba(10,4,4,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, 60);
  bg.glow = glow;
  // 전경 : 종유석
  const fgW = fg.canvas.width / bg.scale;
  fg.fillStyle = '#050102';
  for (let x = 0; x < fgW; x += 90 + rnd() * 200) { const h = 40 + rnd() * 120; fg.beginPath(); fg.moveTo(x - 36, -5); fg.lineTo(x - 8, h * 0.7); fg.lineTo(x, h); fg.lineTo(x + 10, h * 0.6); fg.lineTo(x + 40, -5); fg.closePath(); fg.fill(); }
}
