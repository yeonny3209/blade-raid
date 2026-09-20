'use strict';
// ============================================================
//  로비 : 모닥불이 있는 야영지에서 던전을 고른다
//   - 좌우 이동으로 커서 이동, 공격키로 입장
//   - 클리어한 던전의 최고 랭크와 잠금 상태를 표시
// ============================================================
const Lobby = {
  sel: 0, scroll: 0, t: 0, bg: null, enterT: 0, msg: 0,

  enter() {
    this.t = 0; this.enterT = 0;
    const p = Game.player;
    p.reset(300, DEPTH * 0.62);
    p.setState('cine'); p.play('idle', 0, 1, true);
    // 잠금 해제된 마지막 던전을 기본 선택
    this.sel = clamp((Save.data.unlocked || 1) - 1, 0, DUNGEONS.length - 1);
    this.scroll = 0;
    if (!this.bg) this.bg = this.build();
    Music.play('title');
  },

  // 야영지 배경 (한 번만 생성)
  build() {
    const S = Game.bgScale, rnd = mulberry(4242);
    const c = makeCanvas(W * S, H * S), g = c.getContext('2d');
    g.scale(S, S);
    // 밤하늘 + 언덕
    let gr = g.createLinearGradient(0, 0, 0, GROUND_Y + 40);
    gr.addColorStop(0, '#070c18'); gr.addColorStop(0.5, '#10203a'); gr.addColorStop(1, '#23405a');
    g.fillStyle = gr; g.fillRect(0, 0, W, GROUND_Y + 40);
    for (let i = 0; i < 150; i++) { g.fillStyle = `rgba(220,240,255,${rnd() * 0.7})`; g.fillRect(rnd() * W, rnd() * 260, 1.5, 1.5); }
    const mx = W * 0.75;
    const rg = g.createRadialGradient(mx, 90, 0, mx, 90, 200);
    rg.addColorStop(0, 'rgba(210,235,255,0.4)'); rg.addColorStop(1, 'rgba(150,200,240,0)');
    g.fillStyle = rg; g.fillRect(0, 0, W, GROUND_Y);
    g.fillStyle = '#e8f4ff'; g.beginPath(); g.arc(mx, 90, 30, 0, TAU); g.fill();
    // 먼 산
    for (const [col, base, amp] of [['#132436', 270, 80], ['#1b3046', 320, 50]]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, GROUND_Y + 40);
      for (let x = 0; x <= W + 40; x += 40) g.lineTo(x, base - rnd() * amp - Math.sin(x * 0.005) * amp * 0.4);
      g.lineTo(W, GROUND_Y + 40); g.closePath(); g.fill();
    }
    // 나무 울타리 + 천막
    g.fillStyle = '#0d1a14';
    for (let i = 0; i < 14; i++) { const x = rnd() * W, h = 60 + rnd() * 90; g.fillRect(x, GROUND_Y + 20 - h, 8 + rnd() * 10, h); }
    // 천막 두 채
    for (const tx of [W * 0.12, W * 0.88]) {
      g.fillStyle = '#3a2a1c';
      g.beginPath(); g.moveTo(tx, GROUND_Y - 90); g.lineTo(tx + 90, GROUND_Y + 24); g.lineTo(tx - 90, GROUND_Y + 24); g.closePath(); g.fill();
      g.fillStyle = '#4a3624';
      g.beginPath(); g.moveTo(tx, GROUND_Y - 90); g.lineTo(tx + 30, GROUND_Y + 24); g.lineTo(tx - 30, GROUND_Y + 24); g.closePath(); g.fill();
      g.fillStyle = '#10080a';
      g.beginPath(); g.moveTo(tx, GROUND_Y - 30); g.lineTo(tx + 22, GROUND_Y + 24); g.lineTo(tx - 22, GROUND_Y + 24); g.closePath(); g.fill();
    }
    // 바닥
    const gh = H - GROUND_Y + 44;
    gr = g.createLinearGradient(0, GROUND_Y - 44, 0, H);
    gr.addColorStop(0, '#23281c'); gr.addColorStop(0.3, '#33382a'); gr.addColorStop(1, '#434834');
    g.fillStyle = gr; g.fillRect(0, GROUND_Y - 44, W, gh);
    for (let i = 0; i < 700; i++) {
      const y = GROUND_Y - 10 + rnd() * (H - GROUND_Y + 10);
      g.globalAlpha = 0.05 + rnd() * 0.12;
      g.fillStyle = choose(['#5a4e39', '#2e2a1f', '#3b4a2a', '#6a5c42']);
      g.beginPath(); g.ellipse(rnd() * W, y, 8 + rnd() * 26, 3 + rnd() * 6, 0, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    // 모닥불 돌
    g.fillStyle = '#4a4842';
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU;
      g.beginPath(); g.ellipse(640 + Math.cos(a) * 54, 560 + Math.sin(a) * 18, 12, 8, 0, 0, TAU); g.fill();
    }
    g.fillStyle = '#2a1a10';
    g.fillRect(618, 548, 44, 8); g.save(); g.translate(640, 552); g.rotate(0.5); g.fillRect(-22, -4, 44, 8); g.restore();
    return c;
  },

  update() {
    this.t++;
    if (this.msg > 0) this.msg--;
    const p = Game.player;
    // 입장 연출
    if (this.enterT > 0) {
      this.enterT--;
      p.vx = 6; p.play('run', 4);
      if (this.enterT === 0) Game.startDungeon(DUNGEONS[this.sel].id);
      p.px = p.x; p.stepAnim(); p.updateChains(); p.physicsLobby ? 0 : (p.x += p.vx);
      return;
    }
    // 입력
    for (const q of Input.drain()) {
      if (q.a === 'left') this.move(-1);
      else if (q.a === 'right') this.move(1);
      else if (q.a === 'up') this.move(-1);
      else if (q.a === 'down') this.move(1);
      else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') this.choose();
    }
    // 캐릭터 대기 동작
    p.vx = 0; p.px = p.x;
    p.play('idle', 6); p.stepAnim(); p.updateChains();
  },

  move(d) {
    const n = DUNGEONS.length;
    this.sel = (this.sel + d + n) % n;
    Sfx.play('ui', 0.7, 1 + d * 0.05);
  },

  choose() {
    if (!Save.isUnlocked(this.sel)) { Sfx.play('ui', 0.6, 0.5); this.msg = 90; return; }
    Sfx.play('select');
    this.enterT = 40;
    Game.flashScreen(0.25, '200,230,255');
    const p = Game.player;
    p.setState('cine'); p.facing = 1;
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    const t = this.t, p = Game.player;
    ctx.drawImage(this.bg, 0, 0, this.bg.width, this.bg.height, 0, 0, W, H);
    // 모닥불
    const fx = 640, fy = 556;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fl = 0.85 + Math.sin(t * 0.3) * 0.1 + Math.sin(t * 0.77) * 0.06;
    drawGlow(ctx, fx, fy - 10, 240 * fl, '255,140,50', 0.3);
    drawGlow(ctx, fx, fy - 14, 70 * fl, '255,200,120', 0.8);
    for (let i = 0; i < 3; i++) {
      const h = (34 + i * 10) * fl, w2 = 16 - i * 3;
      ctx.fillStyle = ['rgba(255,110,30,0.9)', 'rgba(255,170,60,0.9)', 'rgba(255,240,180,0.95)'][i];
      ctx.beginPath(); ctx.moveTo(fx - w2, fy);
      ctx.quadraticCurveTo(fx - w2, fy - h * 0.6, fx + Math.sin(t * 0.25 + i) * 5, fy - h);
      ctx.quadraticCurveTo(fx + w2, fy - h * 0.6, fx + w2, fy); ctx.closePath(); ctx.fill();
    }
    if (t % 4 === 0) FX.add('world', new Mote(fx + rand(-14, 14), fy - 20, rand(-0.4, 0.4), rand(-1.8, -0.8), { col: '255,150,50', life: 50, r: 6 }));
    ctx.restore();
    FX.update();
    ctx.save(); FX.draw(ctx, 'world'); ctx.restore();

    // 캐릭터
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(p.x, sy(p.y, 0), 30, 9, 0, 0, TAU); ctx.fill();
    p.draw(ctx);

    ctx.drawImage(UI.vignette, 0, 0);
    this.drawUI(ctx);
    if (this.enterT > 0) { ctx.fillStyle = `rgba(0,0,0,${1 - this.enterT / 40})`; ctx.fillRect(0, 0, W, H); }
  },

  drawUI(ctx) {
    const n = DUNGEONS.length, t = this.t;
    UI.text(ctx, '원 정 대  야 영 지', 40, 48, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '던전을 선택하세요', 40, 80, { size: 15, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    // 내 캐릭터 상태
    UI.text(ctx, `검귀 카엘   Lv.${playerLevel()}`, 40, 104, { size: 17, fill: '#fff', stroke: 3 });
    UI.text(ctx, `공격력 ${fmt(Math.round(3000 * playerPower()))}`, 40, 126, { size: 14, font: FONT_B, weight: 700, fill: '#ffb0a0', stroke: 3 });
    // 보유 골드 / 진행도
    const cleared = Object.keys(Save.data.cleared || {}).length;
    UI.text(ctx, `클리어한 던전  ${cleared} / ${n}`, W - 40, 48, { size: 17, align: 'right', fill: '#cfd8ff', stroke: 4 });
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(W - 150, 76, 7, 0, TAU); ctx.fill();
    UI.text(ctx, fmt(Save.data.gold || 0), W - 40, 76, { size: 17, align: 'right', fill: '#ffe9a6', stroke: 4 });

    // 던전 목록 (가로 카드)
    const cw = 108, gap = 10, tot = n * cw + (n - 1) * gap;
    const x0 = W / 2 - tot / 2, y0 = 132;
    for (let i = 0; i < n; i++) {
      const d = DUNGEONS[i], x = x0 + i * (cw + gap);
      const on = i === this.sel, lock = !Save.isUnlocked(i);
      const best = Save.data.best[d.id];
      const h = on ? 128 : 112, yy = y0 + (on ? -8 : 0);
      ctx.save();
      ctx.globalAlpha = lock ? 0.5 : 1;
      // 카드
      ctx.fillStyle = on ? 'rgba(40,46,64,0.95)' : 'rgba(16,18,26,0.85)';
      roundRect(ctx, x, yy, cw, h, 8); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(150,160,190,0.4)';
      ctx.lineWidth = on ? 3 : 1.4; ctx.stroke();
      // 테마 썸네일
      ctx.save();
      roundRect(ctx, x + 7, yy + 7, cw - 14, 52, 5); ctx.clip();
      this.thumb(ctx, d.theme, x + 7, yy + 7, cw - 14, 52);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
      roundRect(ctx, x + 7, yy + 7, cw - 14, 52, 5); ctx.stroke();
      // 이름 / 레벨
      UI.text(ctx, d.name, x + cw / 2, yy + 72, { size: 14, align: 'center', fill: lock ? '#8a8a9a' : '#fff', stroke: 3 });
      UI.text(ctx, 'Lv.' + d.lv, x + cw / 2, yy + 90, { size: 12, align: 'center', fill: '#ffd87a', stroke: 3 });
      // 최고 랭크
      if (best) {
        const col = { SSS: '#ff4ad8', SS: '#ffb020', S: '#ffd24a', A: '#4ac2ff', B: '#4adf6a', C: '#999' }[best.rank] || '#fff';
        UI.text(ctx, best.rank, x + cw - 14, yy + 104, { size: 19, align: 'right', italic: true, fill: col, stroke: 4 });
      }
      if (lock) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, x, yy, cw, h, 8); ctx.fill();
        ctx.fillStyle = '#c0c6d8';
        ctx.fillRect(x + cw / 2 - 11, yy + h / 2 - 8, 22, 18);
        ctx.strokeStyle = '#c0c6d8'; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.arc(x + cw / 2, yy + h / 2 - 9, 8, Math.PI, TAU); ctx.stroke();
      }
      ctx.restore();
    }

    // 선택한 던전 설명
    const d = DUNGEONS[this.sel];
    const by = 296;
    ctx.fillStyle = 'rgba(8,10,16,0.82)';
    roundRect(ctx, W / 2 - 330, by, 660, 92, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,92,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    UI.text(ctx, d.name, W / 2 - 310, by + 26, { size: 22, fill: '#ffe9a6', stroke: 4 });
    UI.text(ctx, `Lv.${d.lv}  ·  ${d.rooms + 1}개 구역`, W / 2 + 310, by + 26, { size: 15, align: 'right', fill: '#9aa4c0', stroke: 3 });
    UI.text(ctx, d.desc, W / 2 - 310, by + 52, { size: 15, font: FONT_B, weight: 700, fill: '#c8cce0', stroke: 3 });
    const bd = BOSS_DEFS[d.boss];
    UI.text(ctx, '보스 : ' + bd.name, W / 2 - 310, by + 76, { size: 15, font: FONT_B, weight: 700, fill: '#ff9a80', stroke: 3 });

    // 안내
    if (this.msg > 0) {
      UI.text(ctx, '앞의 던전을 먼저 클리어하세요', W / 2, by + 118, { size: 18, align: 'center', fill: '#ff8a70', stroke: 4 });
    } else if (t % 70 < 50) {
      const key = Touch.on ? '카드를 터치' : '← →  선택      J / 좌클릭  입장';
      UI.text(ctx, key, W / 2, by + 118, { size: 18, align: 'center', fill: '#ffe070', stroke: 4 });
    }
  },

  // 카드용 간이 테마 그림
  thumb(ctx, theme, x, y, w2, h2) {
    const C = {
      forest: ['#0d2018', '#1d4030', '#7fd08a'], ruins: ['#1a1a26', '#3a3a52', '#c9a24a'],
      frost: ['#0d2140', '#3a6a8e', '#eaf3fa'], mine: ['#17120c', '#3b2916', '#6ee0ff'],
      desert: ['#8a4a3a', '#d98a4a', '#f0c078'], swamp: ['#0a1410', '#2c4430', '#8cf07a'],
      factory: ['#0b0d12', '#39404f', '#ffaa3c'], sky: ['#2a4a8a', '#b8d8f0', '#fff0b8'],
      abyss: ['#04020a', '#2a1050', '#c878ff'], lair: ['#1a0505', '#5a1208', '#ff8a30'],
    }[theme] || ['#111', '#333', '#888'];
    const g = ctx.createLinearGradient(x, y, x, y + h2);
    g.addColorStop(0, C[0]); g.addColorStop(1, C[1]);
    ctx.fillStyle = g; ctx.fillRect(x, y, w2, h2);
    // 실루엣
    ctx.fillStyle = C[0];
    for (let i = 0; i < 6; i++) {
      const bx = x + (i + 0.5) * w2 / 6 + Math.sin(i * 3.1) * 6, bh = h2 * (0.3 + ((i * 37) % 10) / 22);
      if (theme === 'sky' || theme === 'frost') { ctx.beginPath(); ctx.moveTo(bx, y + h2 - bh); ctx.lineTo(bx + 9, y + h2); ctx.lineTo(bx - 9, y + h2); ctx.closePath(); ctx.fill(); }
      else ctx.fillRect(bx - 6, y + h2 - bh, 12, bh);
    }
    ctx.fillStyle = C[2]; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(x + w2 * 0.72, y + h2 * 0.3, 7, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.25; ctx.fillRect(x, y + h2 - 8, w2, 8);
    ctx.globalAlpha = 1;
  },

  // 터치 : 카드 직접 선택
  touchAt(lx, ly) {
    const n = DUNGEONS.length, cw = 108, gap = 10, tot = n * cw + (n - 1) * gap;
    const x0 = W / 2 - tot / 2, y0 = 124;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cw + gap);
      if (lx >= x && lx <= x + cw && ly >= y0 && ly <= y0 + 136) {
        if (this.sel === i) this.choose(); else { this.sel = i; Sfx.play('ui', 0.7); }
        return true;
      }
    }
    if (ly > 280) { this.choose(); return true; }
    return false;
  },
};
