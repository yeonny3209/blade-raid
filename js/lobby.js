'use strict';
// ============================================================
//  로비 : 모닥불이 있는 야영지에서 던전을 고른다
//   - 좌우 이동으로 커서 이동, 공격키로 입장
//   - 클리어한 던전의 최고 랭크와 잠금 상태를 표시
// ============================================================
const Lobby = {
  sel: 0, page: 0, scroll: 0, t: 0, bg: null, enterT: 0, msg: 0, msgText: '',

  enter() {
    this.t = 0; this.enterT = 0;
    const p = Game.player;
    p.setGear();                                  // 상점에서 바꾼 장비 반영
    p.reset(190, DEPTH * 0.62);
    p.setState('cine'); p.play('idle', 0, 1, true);
    // 잠금 해제된 마지막 던전을 기본 선택
    this.sel = clamp((Save.data.unlocked || 1) - 1, 0, DUNGEONS.length - 1);
    this.page = (this.sel / 10) | 0;
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
      if (this.enterT === 0) Game.startDungeon(this.enterId || DUNGEONS[this.sel].id);
      p.px = p.x; p.stepAnim(); p.updateChains(); p.physicsLobby ? 0 : (p.x += p.vx);
      return;
    }
    // 입력
    const evs = Input.drain();
    for (let i = 0; i < evs.length; i++) {
      const q = evs[i];
      if (q.a === 'left') this.move(-1);
      else if (q.a === 'right') this.move(1);
      else if (q.a === 'up') this.setPage(0);
      else if (q.a === 'down') this.setPage(1);
      else if (q.a === 'shop') { Sfx.play('select'); Game.toShop(); Input.queue.push(...evs.slice(i + 1)); return; }
      else if (q.a === 'tower') this.enterTower();
      else if (q.a === 'codex') { Sfx.play('select'); Game.toCodex(); return; }
      else if (q.a === 'options') { Sfx.play('select'); Game.openOptions('lobby'); return; }
      else if (q.a === 'diff') { Diff.cycle(1); Sfx.play('ui', 0.7, 1.2); }
      else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') this.choose();
    }
    // 캐릭터 대기 동작
    p.vx = 0; p.px = p.x;
    p.play('idle', 6); p.stepAnim(); p.updateChains();
  },

  move(d) {
    const n = DUNGEONS.length;
    this.sel = (this.sel + d + n) % n;
    this.page = (this.sel / 10) | 0;
    Sfx.play('ui', 0.7, 1 + d * 0.05);
  },
  setPage(pg) {
    if (pg === this.page) return;
    this.page = pg; this.sel = pg * 10 + Math.min(this.sel % 10, 9);
    Sfx.play('ui', 0.7, 1 + pg * 0.2);
  },

  towerOpen() { return Object.keys(Save.data.cleared).length >= 3; },
  enterTower() {
    if (!this.towerOpen()) { Sfx.play('ui', 0.6, 0.5); this.msg = 110; this.msgText = '던전을 3개 클리어하면 무한의 탑이 열립니다'; return; }
    Sfx.play('select'); this.enterId = 'tower'; this.enterT = 40;
    Game.flashScreen(0.25, '255,230,160');
    const p = Game.player; p.setState('cine'); p.facing = 1;
  },
  btnRect(i) { return { x: W / 2 - 330 + i * 226, y: 640, w: 208, h: 46 }; },
  diffRect() { return { x: W / 2 + 120, y: 408, w: 200, h: 36 }; },

  choose() {
    this.enterId = null;
    if (!Save.isUnlocked(this.sel)) {
      Sfx.play('ui', 0.6, 0.5); this.msg = 110;
      this.msgText = this.sel === 10 ? '제1지역의 던전 10개를 모두 클리어하면 제2지역이 열립니다' : '앞의 던전을 먼저 클리어하세요';
      return;
    }
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

  // 카드 배치 (그리기와 터치가 같은 값을 쓴다)
  CW: 108, GAP: 10, CY: 206,
  cardX(i) { const tot = 10 * this.CW + 9 * this.GAP; return W / 2 - tot / 2 + i * (this.CW + this.GAP); },
  shopBtn: { x: W - 230, y: 92, w: 190, h: 36 },
  tabRect(i) { return { x: W / 2 - 262 + i * 270, y: 160, w: 252, h: 34 }; },

  drawUI(ctx) {
    const t = this.t, pg = this.page, W_ = Gear.w(), A_ = Gear.a();
    UI.text(ctx, '원 정 대  야 영 지', 40, 48, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '던전을 선택하세요', 40, 80, { size: 15, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    // 내 캐릭터 상태
    UI.text(ctx, `검귀 카엘   Lv.${playerLevel()}`, 40, 104, { size: 17, fill: '#fff', stroke: 3 });
    UI.text(ctx, `공격력 ${fmt(Math.round(3000 * playerPower() * (W_.atk || 1)))}`, 40, 126, { size: 14, font: FONT_B, weight: 700, fill: '#ffb0a0', stroke: 3 });
    UI.text(ctx, `검  ${W_.name}`, 40, 148, { size: 13, font: FONT_B, weight: 700, fill: `rgb(${W_.col})`, stroke: 3 });
    UI.text(ctx, `방어구  ${A_.name}`, 40, 168, { size: 13, font: FONT_B, weight: 700, fill: '#cfd8ff', stroke: 3 });
    // 보유 골드 / 진행도 / 상점
    const cleared = Object.keys(Save.data.cleared || {}).length;
    UI.text(ctx, `클리어한 던전  ${cleared} / ${DUNGEONS.length}`, W - 40, 48, { size: 17, align: 'right', fill: '#cfd8ff', stroke: 4 });
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(W - 150, 76, 7, 0, TAU); ctx.fill();
    UI.text(ctx, fmt(Save.data.gold || 0), W - 40, 76, { size: 17, align: 'right', fill: '#ffe9a6', stroke: 4 });
    const sb = this.shopBtn, glowS = 0.5 + Math.sin(t * 0.08) * 0.5;
    ctx.fillStyle = 'rgba(40,30,12,0.9)'; roundRect(ctx, sb.x, sb.y, sb.w, sb.h, 9); ctx.fill();
    ctx.strokeStyle = `rgba(255,${190 + glowS * 40 | 0},80,${0.7 + glowS * 0.3})`; ctx.lineWidth = 2.4; ctx.stroke();
    UI.text(ctx, Touch.on ? '상 점' : '상 점   [ B ]', sb.x + sb.w / 2, sb.y + 24, { size: 17, align: 'center', fill: '#ffe9a6', stroke: 3 });

    // 지역 탭
    for (let i = 0; i < MAPS.length; i++) {
      const r = this.tabRect(i), on = i === pg, lock = i === 1 && (Save.data.unlocked || 1) <= 10;
      ctx.fillStyle = on ? 'rgba(52,44,22,0.95)' : 'rgba(14,16,24,0.8)';
      roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(150,160,190,0.35)'; ctx.lineWidth = on ? 2.4 : 1.2; ctx.stroke();
      UI.text(ctx, `${MAPS[i].name} · ${MAPS[i].sub}${lock ? '  (잠김)' : ''}`, r.x + r.w / 2, r.y + 23, { size: 15, align: 'center', fill: on ? '#ffe9a6' : lock ? '#7a7a8a' : '#aab2d0', stroke: 3 });
    }
    if (!Touch.on) UI.text(ctx, '↑ ↓ 지역 이동', W / 2 + 394, 183, { size: 12, font: FONT_B, weight: 700, fill: '#7a84a4', stroke: 3 });

    // 던전 목록 (가로 카드, 지역별 10개)
    const cw = this.CW, y0 = this.CY;
    for (let k = 0; k < 10; k++) {
      const gi = pg * 10 + k, d = DUNGEONS[gi], x = this.cardX(k);
      const on = gi === this.sel, lock = !Save.isUnlocked(gi);
      const best = Save.data.best[d.id];
      const h = on ? 128 : 112, yy = y0 + (on ? -8 : 0);
      ctx.save();
      ctx.globalAlpha = lock ? 0.5 : 1;
      ctx.fillStyle = on ? 'rgba(40,46,64,0.95)' : 'rgba(16,18,26,0.85)';
      roundRect(ctx, x, yy, cw, h, 8); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(150,160,190,0.4)';
      ctx.lineWidth = on ? 3 : 1.4; ctx.stroke();
      ctx.save();
      roundRect(ctx, x + 7, yy + 7, cw - 14, 52, 5); ctx.clip();
      this.thumb(ctx, d.theme, x + 7, yy + 7, cw - 14, 52);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
      roundRect(ctx, x + 7, yy + 7, cw - 14, 52, 5); ctx.stroke();
      UI.text(ctx, d.name, x + cw / 2, yy + 72, { size: d.name.length > 8 ? 12 : 14, align: 'center', fill: lock ? '#8a8a9a' : '#fff', stroke: 3 });
      UI.text(ctx, 'Lv.' + d.lv, x + cw / 2, yy + 90, { size: 12, align: 'center', fill: '#ffd87a', stroke: 3 });
      UI.text(ctx, String(k + 1), x + 14, yy + 104, { size: 12, fill: '#7a84a4', stroke: 3 });
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
    const by = 362;
    ctx.fillStyle = 'rgba(8,10,16,0.82)';
    roundRect(ctx, W / 2 - 330, by, 660, 92, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,92,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    UI.text(ctx, d.name, W / 2 - 310, by + 26, { size: 22, fill: '#ffe9a6', stroke: 4 });
    UI.text(ctx, `Lv.${d.lv}  ·  ${d.rooms + 1}개 구역`, W / 2 + 310, by + 26, { size: 15, align: 'right', fill: '#9aa4c0', stroke: 3 });
    UI.text(ctx, d.desc, W / 2 - 310, by + 52, { size: 15, font: FONT_B, weight: 700, fill: '#c8cce0', stroke: 3 });
    const bd = BOSS_DEFS[d.boss];
    UI.text(ctx, '보스 : ' + bd.name, W / 2 - 310, by + 76, { size: 15, font: FONT_B, weight: 700, fill: '#ff9a80', stroke: 3 });

    // 난이도 선택
    const dr = this.diffRect(), dm = Diff.cur();
    ctx.fillStyle = 'rgba(20,24,36,0.9)'; roundRect(ctx, dr.x, dr.y, dr.w, dr.h, 9); ctx.fill();
    ctx.strokeStyle = `rgb(${dm.col})`; ctx.lineWidth = 2; ctx.stroke();
    UI.text(ctx, `난이도  ◀ ${dm.name} ▶`, dr.x + dr.w / 2, dr.y + 19, { size: 16, align: 'center', fill: `rgb(${dm.col})`, stroke: 4 });
    // 하단 메뉴
    const labels = [['무한의 탑', Save.data.tower.best ? `최고 ${Save.data.tower.best}층` : (this.towerOpen() ? '' : '잠김'), 'N', !this.towerOpen()], ['도감 · 업적', Ach.claimable() ? `보상 ${Ach.claimable()}` : `${Dex.found()}/${Dex.total()}`, 'K', false], ['설정', '', 'O', false]];
    labels.forEach(([nm, sub, key, lock], i) => {
      const r = this.btnRect(i);
      ctx.fillStyle = lock ? 'rgba(20,20,28,0.8)' : 'rgba(40,30,12,0.92)'; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
      ctx.strokeStyle = lock ? 'rgba(150,160,190,0.35)' : (i === 1 && Ach.claimable() ? '#7dffa0' : '#c9a55c'); ctx.lineWidth = 2; ctx.stroke();
      UI.text(ctx, nm + (Touch.on ? '' : `  [${key}]`), r.x + r.w / 2, r.y + (sub ? 18 : 24), { size: 17, align: 'center', fill: lock ? '#7a7a8a' : '#ffe9a6', stroke: 3 });
      if (sub) UI.text(ctx, sub, r.x + r.w / 2, r.y + 36, { size: 12, align: 'center', font: FONT_B, weight: 700, fill: lock ? '#6a6a7a' : '#9aa4c0', stroke: 3 });
    });
    // 안내
    if (this.msg > 0) {
      UI.text(ctx, this.msgText, W / 2, by + 124, { size: 18, align: 'center', fill: '#ff8a70', stroke: 4 });
    } else if (t % 70 < 50) {
      const key = Touch.on ? '카드를 터치' : '← →  선택      J / 좌클릭  입장';
      UI.text(ctx, key, W / 2, by + 124, { size: 18, align: 'center', fill: '#ffe070', stroke: 4 });
    }
    // 제2지역 개방 안내
    if (pg === 1 && (Save.data.unlocked || 1) <= 10) UI.text(ctx, '제1지역 던전 10개를 모두 클리어하면 열립니다', W / 2, by + 152, { size: 15, align: 'center', font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 });
  },

  // 카드용 간이 테마 그림
  thumb(ctx, theme, x, y, w2, h2) {
    const C = {
      forest: ['#0d2018', '#1d4030', '#7fd08a'], ruins: ['#1a1a26', '#3a3a52', '#c9a24a'],
      frost: ['#0d2140', '#3a6a8e', '#eaf3fa'], mine: ['#17120c', '#3b2916', '#6ee0ff'],
      desert: ['#8a4a3a', '#d98a4a', '#f0c078'], swamp: ['#0a1410', '#2c4430', '#8cf07a'],
      factory: ['#0b0d12', '#39404f', '#ffaa3c'], sky: ['#2a4a8a', '#b8d8f0', '#fff0b8'],
      abyss: ['#04020a', '#2a1050', '#c878ff'], lair: ['#1a0505', '#5a1208', '#ff8a30'],
      bloodmoon: ['#14040a', '#5a1226', '#ff5a4a'], crystal: ['#0a0620', '#3a2a78', '#8ae0ff'],
      deep: ['#04283a', '#0e6a88', '#a8f0ff'], grave: ['#0a0e16', '#26323c', '#a8ffd0'],
      jungle: ['#0e3a2a', '#2a7a3a', '#ffe888'], clock: ['#1a1006', '#6a4a1c', '#ffd070'],
      neon: ['#06040e', '#2a0f48', '#ff50d0'], storm: ['#0a0c1c', '#363a68', '#8ae0ff'],
      cosmos: ['#02010a', '#2a1a68', '#ff90d0'], chaos: ['#1a0420', '#5a0a50', '#ffe060'],
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

  // 터치 : 카드 / 지역 탭 / 상점 버튼 직접 선택
  touchAt(lx, ly) {
    const sb = this.shopBtn;
    if (lx >= sb.x && lx <= sb.x + sb.w && ly >= sb.y && ly <= sb.y + sb.h) { Sfx.play('select'); Game.toShop(); return true; }
    for (let i = 0; i < MAPS.length; i++) {
      const r = this.tabRect(i);
      if (lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h) { this.setPage(i); return true; }
    }
    for (let k = 0; k < 10; k++) {
      const x = this.cardX(k);
      if (lx >= x && lx <= x + this.CW && ly >= this.CY - 8 && ly <= this.CY + 128) {
        const gi = this.page * 10 + k;
        if (this.sel === gi) this.choose(); else { this.sel = gi; Sfx.play('ui', 0.7); }
        return true;
      }
    }
    if (lx >= this.diffRect().x && lx <= this.diffRect().x + this.diffRect().w && ly >= this.diffRect().y && ly <= this.diffRect().y + this.diffRect().h) { Diff.cycle(1); Sfx.play('ui', 0.7, 1.2); return true; }
    for (let i = 0; i < 3; i++) {
      const r = this.btnRect(i);
      if (lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h) { Sfx.play('select'); if (i === 0) this.enterTower(); else if (i === 1) Game.toCodex(); else Game.openOptions('lobby'); return true; }
    }
    if (ly > 350 && ly < 404) { this.choose(); return true; }
    return false;
  },
};
