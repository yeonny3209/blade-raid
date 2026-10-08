'use strict';
// ============================================================
//  상점 : 던전에서 모은 골드로 검과 방어구를 산다
//   - 왼쪽 목록 / 가운데 미리보기(실제 타격음·이펙트가 나온다) / 오른쪽 상세
//   - ↑↓ 고르기  ←→ 검·방어구 전환  Enter·Space 구매/장착  Esc 돌아가기  (마우스·터치 가능)
// ============================================================
const Shop = {
  tab: 0, sel: [0, 0], scroll: [0, 0], t: 0, msg: '', msgT: 0, msgCol: '#fff',
  pp: null, step: 0, hitDone: false, dummyHit: 0, swingK: 0, mx: 0, my: 0, mouseT: 0, inited: false,
  ROWS: 8, ROW_H: 62, LX: 40, LY: 144, LW: 470,
  STAGE: { x: 524, y: 144, w: 310, h: 500 },
  DET: { x: 848, y: 144, w: 392, h: 500 },
  TX: 770, FY: 176,                       // 허수아비 x / 바닥 깊이 (화면 y = GROUND_Y + FY)

  items() { return this.tab === 0 ? WEAPONS : ARMORS; },
  kind() { return this.tab === 0 ? 'w' : 'a'; },
  cur() { return this.items()[this.sel[this.tab]]; },
  btnRect() { const D = this.DET; return { x: D.x + 20, y: D.y + D.h - 70, w: D.w - 40, h: 52 }; },
  tabRect(i) { return { x: this.LX + i * 160, y: 92, w: 150, h: 38 }; },
  backRect() { return { x: W - 220, y: 54, w: 180, h: 34 }; },

  enter() {
    this.t = 0; this.msgT = 0; this.step = 0; this.hitDone = true;
    if (!this.inited) {
      this.inited = true;
      addEventListener('mousemove', e => {
        if (Game.state !== 'shop') return;
        const r = Game.canvas.getBoundingClientRect();
        this.mx = (e.clientX - r.left) / r.width * W; this.my = (e.clientY - r.top) / r.height * H; this.mouseT = 600;
      });
    }
    if (!this.pp) this.pp = new Player();
    const pp = this.pp;
    pp.scale = 1.5; pp.x = pp.px = 606; pp.y = this.FY; pp.z = 0; pp.facing = 1;
    pp.visible = true; pp.state = 'ground';
    // 처음에는 장착 중인 아이템을 선택
    for (const [i, list, k] of [[0, WEAPONS, 'w'], [1, ARMORS, 'a']]) {
      const id = Save.data.eq[k], ix = list.findIndex(x => x.id === id);
      this.sel[i] = Math.max(0, ix); this.scroll[i] = clamp(this.sel[i] - 3, 0, Math.max(0, list.length - this.ROWS));
    }
    this.refresh();
    Music.play('title');
  },

  // 선택한 아이템을 미리보기 캐릭터에게 입힌다
  refresh() {
    const pp = this.pp, it = this.cur();
    if (this.tab === 0) pp.setGear(it, Gear.a()); else pp.setGear(Gear.w(), it);
    pp.bladeGlow = 0; pp.trail.length = 0; pp.after.length = 0;
    this.step = 0; this.hitDone = true;
    pp.play('idle', 0, 1, true);
  },

  setSel(i) {
    const list = this.items(), n = list.length;
    this.sel[this.tab] = (i + n) % n;
    const s = this.sel[this.tab];
    if (s < this.scroll[this.tab]) this.scroll[this.tab] = s;
    if (s >= this.scroll[this.tab] + this.ROWS) this.scroll[this.tab] = s - this.ROWS + 1;
    Sfx.play('ui', 0.6, 1.1);
    this.refresh();
  },
  setTab(i) {
    if (i === this.tab) return;
    this.tab = i; Sfx.play('ui', 0.7, 1.2); this.refresh();
  },

  leave() { Sfx.play('select', 0.8); Game.toLobby(); },

  flash(text, col = '#fff') { this.msg = text; this.msgCol = col; this.msgT = 120; },

  act() {
    const it = this.cur(), k = this.kind();
    if (Gear.owns(k, it.id)) {
      if (Save.data.eq[k] === it.id) { Sfx.play('ui', 0.6, 0.8); this.flash('이미 장착 중입니다', '#9aa4c0'); return; }
      Gear.equip(k, it.id); Sfx.play('select'); this.flash('장착했습니다', '#7dffa0'); this.refresh();
      return;
    }
    const r = Gear.buy(k, it);
    if (r === 'ok') {
      Sfx.play('coin', 1, 0.8); Sfx.play('clear', 0.7); this.flash('구매 완료!  자동으로 장착했습니다', '#ffe070');
      const b = this.btnRect();
      for (let i = 0; i < 26; i++) FX.add('top', new Mote(b.x + rand(0, b.w), b.y + rand(0, b.h), rand(-1.5, 1.5), rand(-4, -1), { col: '255,220,100', life: 40, r: rand(6, 11) }));
      FX.add('top', new Flash(b.x + b.w / 2, b.y + b.h / 2, 20, 200, 18, '255,225,120', 0.8));
      this.refresh();
    } else if (r === 'gold') { Sfx.play('ui', 0.8, 0.5); this.flash('골드가 부족합니다', '#ff8a70'); }
    else if (r === 'locked') { Sfx.play('ui', 0.8, 0.5); this.flash('제2지역을 열어야 살 수 있습니다', '#ff8a70'); }
  },

  // 클릭 / 터치
  clickAt(x, y) {
    const inR = r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inR(this.backRect())) { this.leave(); return true; }
    for (let i = 0; i < 2; i++) if (inR(this.tabRect(i))) { this.setTab(i); return true; }
    if (inR(this.btnRect())) { this.act(); return true; }
    if (x >= this.LX && x <= this.LX + this.LW && y >= this.LY && y < this.LY + this.ROWS * this.ROW_H) {
      const i = this.scroll[this.tab] + Math.floor((y - this.LY) / this.ROW_H);
      if (i < this.items().length) { if (i === this.sel[this.tab]) this.act(); else this.setSel(i); }
      return true;
    }
    return false;
  },
  touchAt(x, y) { this.clickAt(x, y); },

  // ---------- 매 프레임 ----------
  update() {
    this.t++;
    if (this.msgT > 0) this.msgT--;
    if (this.mouseT > 0) this.mouseT--;
    if (Input.take('pause')) { this.leave(); return; }
    const evs = Input.drain();
    for (let i = 0; i < evs.length; i++) {
      const q = evs[i];
      if (q.a === 'up') this.setSel(this.sel[this.tab] - 1);
      else if (q.a === 'down') this.setSel(this.sel[this.tab] + 1);
      else if (q.a === 'left') this.setTab(0);
      else if (q.a === 'right') this.setTab(1);
      else if (q.a === 'confirm' || q.a === 'jump') this.act();
      else if (q.a === 'attack') { if (this.mouseT > 0) this.clickAt(this.mx, this.my); else this.act(); }
      else if (q.a === 'shop' || q.a === 'back') { this.leave(); return; }
    }
    // 마우스를 올리면 목록 선택
    if (this.mouseT > 590) {
      const x = this.mx, y = this.my;
      if (x >= this.LX && x <= this.LX + this.LW && y >= this.LY && y < this.LY + this.ROWS * this.ROW_H) {
        const i = this.scroll[this.tab] + Math.floor((y - this.LY) / this.ROW_H);
        if (i < this.items().length && i !== this.sel[this.tab]) this.setSel(i);
      }
    }
    this.updatePreview();
    FX.update();
  },

  // 미리보기 : 휘두르고 → 허수아비를 때리고 → 대기, 를 반복
  updatePreview() {
    const pp = this.pp, it = this.cur(), isW = this.tab === 0;
    const W_ = isW ? it : Gear.w();
    pp.px = pp.x; pp.pz = pp.z;
    this.step++;
    const CY = [56, 56, 62, 78], HIT = [5, 5, 6, 8], TR = [[3, 8], [3, 9], [4, 10], [6, 12]];
    const cyc = this.step % 76, k = ((this.step / 76) | 0) % 4;
    if (cyc === 1) {
      pp.play(['a1', 'a2', 'a3', 'a4'][k], 2, 1, true);
      pp.swing = newSwing(); this.hitDone = false; this.swingK = k;
      pp.bladeGlow = k === 3 ? 0.8 : 0;
      Sfx.play(k === 3 ? 'swingBig' : 'swing', 1, W_.swingPitch || 1); if (W_.snd) Sfx.wlayer(W_.snd, k === 3 ? 1 : 0, false);
    }
    const f = cyc - 1;
    if (f >= 0) {
      pp.trailOn = f >= TR[this.swingK][0] && f <= TR[this.swingK][1];
      if (f === HIT[this.swingK] && !this.hitDone) {
        this.hitDone = true; this.dummyHit = 1;
        Gear.previewHit(W_, this.TX - 28, this.FY, 120, 1);
        if (this.swingK === 3) { pp.bladeGlow = 0; Sfx.impact('flesh', 2, { vol: 1, pitch: W_.pitch || 1 }) }
      }
      if (f === CY[this.swingK]) pp.play('idle', 6);
    }
    pp.stepAnim(); pp.updateChains(); pp.updateTrailAfter(); pp.gearTick();
    this.dummyHit *= 0.88;
  },

  // ---------- 그리기 ----------
  wrap(ctx, str, maxW, size, font = FONT_B, weight = 700) {
    ctx.font = `${weight} ${size}px ${font}`;
    const lines = []; let cur = '';
    for (const ch of str) {
      if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur.trim()); cur = ch; } else cur += ch;
    }
    if (cur) lines.push(cur.trim());
    return lines;
  },

  panel(ctx, x, y, w, h, hot) {
    ctx.fillStyle = 'rgba(9,11,18,0.88)'; roundRect(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = hot ? 'rgba(255,210,90,0.8)' : 'rgba(201,165,92,0.45)'; ctx.lineWidth = hot ? 2.4 : 1.5; ctx.stroke();
  },

  bladeIcon(ctx, Wp, x, y, s) {
    const Lk = Wp.look, c = Lk.c, S = bladeShape(Lk, 80);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.78); ctx.scale(s, s); ctx.translate(-34, 0);
    olPoly(ctx, [-12, -2.4, 10, -2.4, 10, 2.4, -12, 2.4], (Lk.hilt || ['#1a120c', '#2e2016'])[1], '#120f18', 1.2);
    olPoly(ctx, [8, -8, 12, -8, 12, 8, 8, 8], (Lk.trim || ['', '#c9a55c'])[1], '#120f18', 1);
    olPoly(ctx, S.outer, c[0], '#120f18', 1.3);
    ctx.fillStyle = c[1]; ctx.beginPath(); polyPath(ctx, S.inner); ctx.fill();
    ctx.strokeStyle = c[2]; ctx.lineWidth = 1; ctx.beginPath(); S.bot.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    if (Lk.rune) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${Lk.rune},0.8)`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(66, 0); ctx.stroke(); }
    ctx.restore();
  },
  armorIcon(ctx, A, x, y, s) {
    const L = A.look, coat = L.coat || RIG_PLAYER.pal.coat, met = L.metal || RIG_PLAYER.pal.metal;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    olPoly(ctx, [-16, -18, -7, -22, 7, -22, 16, -18, 14, 12, 8, 20, -8, 20, -14, 12], coat[1], '#120f18', 1.4);
    ctx.fillStyle = coat[2]; ctx.beginPath(); polyPath(ctx, [2, -19, 7, -19, 9, 14, 4, 17]); ctx.fill();
    olPoly(ctx, [-18, -20, -8, -24, -6, -14, -17, -12], met[1], '#120f18', 1.1);
    olPoly(ctx, [18, -20, 8, -24, 6, -14, 17, -12], met[1], '#120f18', 1.1);
    ctx.fillStyle = met[2]; ctx.fillRect(-14, 4, 28, 3);
    ctx.restore();
  },

  draw(ctx) {
    const t = this.t, pp = this.pp, it = this.cur(), k = this.kind();
    // 배경
    const bg = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 360, 760);
    bg.addColorStop(0, '#1a2038'); bg.addColorStop(0.6, '#0c101e'); bg.addColorStop(1, '#05060c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < 18; i++) ctx.fillRect(0, 130 + i * 32 + (t * 0.2) % 32, W, 1);

    // 제목 / 골드 / 돌아가기
    UI.text(ctx, '대 장 간  &  상 점', 40, 48, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '던전에서 모은 골드로 검과 방어구를 장만하세요', 40, 74, { size: 14, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(W - 226, 40, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(W - 228, 38, 2.8, 0, TAU); ctx.fill();
    UI.text(ctx, fmt(Save.data.gold || 0), W - 40, 40, { size: 22, align: 'right', fill: '#ffe9a6', stroke: 4 });
    const br = this.backRect();
    ctx.fillStyle = 'rgba(30,24,14,0.9)'; roundRect(ctx, br.x, br.y, br.w, br.h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, Touch.on ? '돌아가기' : '돌아가기  [Esc]', br.x + br.w / 2, br.y + 18, { size: 15, align: 'center', fill: '#ffe9a6', stroke: 3 });

    // 탭
    for (let i = 0; i < 2; i++) {
      const r = this.tabRect(i), on = i === this.tab;
      ctx.fillStyle = on ? 'rgba(54,44,22,0.95)' : 'rgba(14,16,24,0.85)'; roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(150,160,190,0.35)'; ctx.lineWidth = on ? 2.4 : 1.2; ctx.stroke();
      UI.text(ctx, i ? `방어구  ${Save.data.owned.a.length}/${ARMORS.length}` : `검  ${Save.data.owned.w.length}/${WEAPONS.length}`, r.x + r.w / 2, r.y + 26, { size: 17, align: 'center', fill: on ? '#ffe9a6' : '#8a94b4', stroke: 3 });
    }
    if (!Touch.on) UI.text(ctx, '← →  전환', this.LX + 330, 112, { size: 12, font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });

    this.drawList(ctx);
    this.drawStage(ctx);
    this.drawDetail(ctx, it, k);

    // 메시지
    if (this.msgT > 0) {
      const a = Math.min(1, this.msgT / 20);
      ctx.globalAlpha = a;
      UI.text(ctx, this.msg, W / 2, 682, { size: 22, align: 'center', fill: this.msgCol, stroke: 5 });
      ctx.globalAlpha = 1;
    } else if (!Touch.on) {
      UI.text(ctx, '↑ ↓  고르기      Enter / Space  구매·장착      B / Esc  돌아가기', W / 2, 682, { size: 15, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    }
    ctx.drawImage(UI.vignette, 0, 0);
    FX.draw(ctx, 'top');
  },

  drawList(ctx) {
    const list = this.items(), kk = this.kind(), s0 = this.scroll[this.tab];
    this.panel(ctx, this.LX - 10, this.LY - 8, this.LW + 20, this.ROWS * this.ROW_H + 16);
    for (let r = 0; r < this.ROWS; r++) {
      const i = s0 + r; if (i >= list.length) break;
      const it = list[i], y = this.LY + r * this.ROW_H, on = i === this.sel[this.tab];
      const owned = Gear.owns(kk, it.id), eq = Save.data.eq[kk] === it.id, open = Gear.open(it), afford = (Save.data.gold || 0) >= it.price;
      ctx.save();
      if (!open) ctx.globalAlpha = 0.55;
      if (on) {
        const pulse = 0.5 + Math.sin(this.t * 0.12) * 0.5;
        ctx.fillStyle = 'rgba(70,58,26,0.85)'; roundRect(ctx, this.LX, y + 2, this.LW, this.ROW_H - 4, 9); ctx.fill();
        ctx.strokeStyle = `rgba(255,${200 + pulse * 40 | 0},90,0.95)`; ctx.lineWidth = 2.2; ctx.stroke();
      } else { ctx.fillStyle = 'rgba(24,28,42,0.65)'; roundRect(ctx, this.LX, y + 2, this.LW, this.ROW_H - 4, 9); ctx.fill(); }
      // 아이콘
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, this.LX + 8, y + 8, 56, 46, 7); ctx.fill();
      if (this.tab === 0) this.bladeIcon(ctx, it, this.LX + 36, y + 31, 0.58); else this.armorIcon(ctx, it, this.LX + 36, y + 31, 0.95);
      // 이름
      UI.text(ctx, it.name, this.LX + 76, y + 24, { size: it.name.length > 9 ? 15 : 17, fill: on ? '#fff' : '#d8dcec', stroke: 3 });
      UI.text(ctx, it.sub, this.LX + 76, y + 45, { size: 11.5, font: FONT_B, weight: 700, fill: '#7a84a4', stroke: 2.5 });
      // 상태 / 가격
      if (eq) UI.text(ctx, '장착중', this.LX + this.LW - 14, y + 31, { size: 15, align: 'right', fill: '#7dffa0', stroke: 3 });
      else if (owned) UI.text(ctx, '보유', this.LX + this.LW - 14, y + 31, { size: 15, align: 'right', fill: '#9ac8ff', stroke: 3 });
      else {
        UI.text(ctx, fmt(it.price), this.LX + this.LW - 14, y + 31, { size: 16, align: 'right', fill: afford && open ? '#ffe9a6' : '#ff9a88', stroke: 3 });
        ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(this.LX + this.LW - 14 - ctx.measureText(fmt(it.price)).width - 12, y + 31, 5.5, 0, TAU); ctx.fill();
      }
      if ((it.map || 1) === 2) UI.text(ctx, 'II', this.LX + 11, y + 14, { size: 11, fill: '#ffb84a', stroke: 3 });
      ctx.restore();
    }
    // 스크롤 표시
    if (list.length > this.ROWS) {
      const x = this.LX + this.LW + 4, h = this.ROWS * this.ROW_H - 8, th = h * this.ROWS / list.length, ty = this.LY + 2 + (h - th) * (s0 / (list.length - this.ROWS));
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, x, this.LY + 2, 4, h, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,210,100,0.7)'; roundRect(ctx, x, ty, 4, th, 2); ctx.fill();
    }
  },

  drawStage(ctx) {
    const S = this.STAGE, pp = this.pp;
    this.panel(ctx, S.x, S.y, S.w, S.h);
    ctx.save();
    roundRect(ctx, S.x + 2, S.y + 2, S.w - 4, S.h - 4, 11); ctx.clip();
    const sg = ctx.createLinearGradient(0, S.y, 0, S.y + S.h);
    sg.addColorStop(0, '#10162c'); sg.addColorStop(0.7, '#1c2440'); sg.addColorStop(1, '#2a3050');
    ctx.fillStyle = sg; ctx.fillRect(S.x, S.y, S.w, S.h);
    // 스포트라이트
    ctx.globalCompositeOperation = 'lighter';
    const W_ = this.tab === 0 ? this.cur() : Gear.w();
    drawGlow(ctx, 670, 430, 260, W_.col || '140,200,255', 0.16);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(606, 560, 90, 18, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(this.TX, 560, 54, 12, 0, 0, TAU); ctx.fill();
    FX.draw(ctx, 'ground');
    this.drawDummy(ctx);
    pp.draw(ctx); pp.drawTrail(ctx);
    FX.draw(ctx, 'world');
    ctx.restore();
    UI.text(ctx, '미리보기', S.x + S.w / 2, S.y + 22, { size: 14, align: 'center', fill: '#6a7494', stroke: 3 });
  },

  drawDummy(ctx) {
    const x = this.TX, y = 560, w = Math.sin(this.t * 0.9) * this.dummyHit * 0.1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(w + this.dummyHit * 0.06); ctx.scale(1.15, 1.15);
    ctx.fillStyle = '#4a3320'; ctx.fillRect(-7, -150, 14, 150);                    // 기둥
    ctx.fillStyle = '#6a4a2c'; ctx.fillRect(-7, -150, 5, 150);
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(-40, -118, 80, 10);                    // 팔
    ctx.fillStyle = '#c9a85a'; ctx.beginPath(); ctx.ellipse(0, -80, 30, 44, 0, 0, TAU); ctx.fill();   // 짚 몸통
    ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 8, -118); ctx.lineTo(i * 6, -44); ctx.stroke(); }
    ctx.fillStyle = '#d8c080'; ctx.beginPath(); ctx.arc(0, -150, 20, 0, TAU); ctx.fill();              // 머리
    ctx.fillStyle = '#7a1a1a'; ctx.beginPath(); ctx.arc(0, -86, 20, 0, TAU); ctx.fill();               // 표적
    ctx.fillStyle = '#f0e6c8'; ctx.beginPath(); ctx.arc(0, -86, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a1a1a'; ctx.beginPath(); ctx.arc(0, -86, 6, 0, TAU); ctx.fill();
    ctx.restore();
  },

  drawDetail(ctx, it, k) {
    const D = this.DET, isW = this.tab === 0;
    this.panel(ctx, D.x, D.y, D.w, D.h);
    const x = D.x + 20, mw = D.w - 40;
    let y = D.y + 34;
    UI.text(ctx, it.name, x, y, { size: it.name.length > 9 ? 23 : 27, fill: isW ? `rgb(${it.col})` : '#e8ecff', stroke: 5 });
    UI.text(ctx, it.sub, x, y + 26, { size: 13, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 3 });
    y += 56;
    // 능력치
    const rows = [];
    if (isW) {
      rows.push(['공격력', `${Math.round((it.atk || 1) * 100)}%`, (it.atk || 1) > 1]);
      if (it.crit) rows.push(['치명타율', `+${Math.round(it.crit * 100)}%`, true]);
      if (it.critDmg) rows.push(['치명타 피해', `×${it.critDmg}`, true]);
      rows.push(['타격 경직', `${Math.round((it.stop || 1) * 100)}%`, (it.stop || 1) >= 1]);
      rows.push(['화면 진동', `${Math.round((it.shake || 1) * 100)}%`, (it.shake || 1) >= 1]);
      if (it.kx) rows.push(['넉백', `${Math.round(it.kx * 100)}%`, true]);
      if (it.move) rows.push(['이동속도', `${Math.round(it.move * 100)}%`, it.move >= 1]);
    } else {
      rows.push(['받는 피해', `-${Math.round((it.def || 0) * 100)}%`, (it.def || 0) > 0]);
      rows.push(['최대 체력', `${Math.round((it.hp || 1) * 100)}%`, (it.hp || 1) >= 1]);
      if (it.move) rows.push(['이동속도', `${Math.round(it.move * 100)}%`, it.move >= 1]);
      if (it.mpRegen) rows.push(['MP 재생', `${Math.round(it.mpRegen * 100)}%`, true]);
      if (it.cdr) rows.push(['쿨타임', `-${Math.round(it.cdr * 100)}%`, true]);
      if (it.dodge) rows.push(['회피', `${Math.round(it.dodge * 100)}%`, true]);
    }
    const colW = mw / 2;
    rows.forEach((r, i) => {
      const cx = x + (i % 2) * colW, cy = y + Math.floor(i / 2) * 26;
      UI.text(ctx, r[0], cx, cy, { size: 13, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 2.5 });
      UI.text(ctx, r[1], cx + colW - 18, cy, { size: 15, align: 'right', fill: r[2] ? '#b8ffcc' : '#ffb0a0', stroke: 3 });
    });
    y += Math.ceil(rows.length / 2) * 26 + 10;
    ctx.strokeStyle = 'rgba(201,165,92,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + mw, y - 6); ctx.stroke();
    // 고유 능력
    UI.text(ctx, isW ? '고유 능력' : '방어구 효과', x, y + 10, { size: 14, fill: '#ffd87a', stroke: 3 });
    y += 30;
    for (const ln of this.wrap(ctx, it.desc, mw, 14)) { UI.text(ctx, ln, x, y, { size: 14, font: FONT_B, weight: 700, fill: '#dfe4f6', stroke: 3 }); y += 21; }
    if (isW && it.feel) {
      y += 8;
      UI.text(ctx, '타격감', x, y + 4, { size: 14, fill: '#9ac8ff', stroke: 3 });
      y += 26;
      for (const ln of this.wrap(ctx, it.feel, mw, 14)) { UI.text(ctx, ln, x, y, { size: 14, font: FONT_B, weight: 700, fill: '#cfd8ff', stroke: 3 }); y += 21; }
    }
    // 구매 / 장착 버튼
    const b = this.btnRect(), owned = Gear.owns(k, it.id), eq = Save.data.eq[k] === it.id, open = Gear.open(it);
    const afford = (Save.data.gold || 0) >= it.price;
    let label, col, edge;
    if (eq) { label = '장착중'; col = 'rgba(30,70,44,0.9)'; edge = '#7dffa0'; }
    else if (owned) { label = '장착하기'; col = 'rgba(30,50,86,0.95)'; edge = '#9ac8ff'; }
    else if (!open) { label = '제2지역 개방 필요'; col = 'rgba(40,40,50,0.9)'; edge = '#6a6a7a'; }
    else if (!afford) { label = `${fmt(it.price)} G  (골드 부족)`; col = 'rgba(70,30,26,0.9)'; edge = '#ff8a70'; }
    else { label = `${fmt(it.price)} G  구매`; col = 'rgba(90,70,20,0.95)'; edge = '#ffd24a'; }
    ctx.fillStyle = col; roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 2.6; ctx.stroke();
    UI.text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 1, { size: 21, align: 'center', fill: edge === '#6a6a7a' ? '#9a9aaa' : '#fff', stroke: 4 });
  },
};
