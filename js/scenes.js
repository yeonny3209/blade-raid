'use strict';
// ============================================================
//  장면 : 설정 / 도감·업적  +  기록 카드(공유)
// ============================================================

// ---------- 포인터 (마우스·터치 공용) : 상점 외의 장면들이 쓴다 ----------
const Ptr = {
  down: false, x: 0, y: 0, last: 0,
  init() {
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      addEventListener(t, e => {
        const S = Game.scene && Game.scene();
        if (!S) { if (t !== 'pointermove') this.down = false; return; }
        const [x, y] = Touch.toLogical(e);
        this.x = x; this.y = y; this.last = performance.now();
        if (t === 'pointerdown') { this.down = true; S.pDown && S.pDown(x, y); }
        else if (t === 'pointermove') S.pMove && S.pMove(x, y, this.down);
        else { this.down = false; S.pUp && S.pUp(x, y); }
      }, { passive: true });
    }
  },
};
const inR = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const bigBtn = (ctx, r, label, col, edge, ok = true) => {
  ctx.fillStyle = ok ? col : 'rgba(40,40,50,0.9)'; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.strokeStyle = ok ? edge : '#6a6a7a'; ctx.lineWidth = 2.6; ctx.stroke();
  UI.text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: Math.min(21, r.h * 0.42), align: 'center', fill: ok ? '#fff' : '#9a9aaa', stroke: 4 });
};
const scrim = ctx => {
  const bg = ctx.createRadialGradient(W / 2, 260, 40, W / 2, 360, 760);
  bg.addColorStop(0, '#1a2038'); bg.addColorStop(0.6, '#0c101e'); bg.addColorStop(1, '#05060c');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
};

// ============================================================
//  설정
// ============================================================
const Opts = {
  sel: 0, from: 'lobby', msg: '', msgT: 0, drag: -1,
  rows: [
    { k: 'master', label: '전체 음량', type: 'slider', max: 1 },
    { k: 'music', label: '배경음악', type: 'slider', max: 1 },
    { k: 'sfx', label: '효과음', type: 'slider', max: 1 },
    { k: 'shake', label: '화면 흔들림', type: 'slider', max: 1.5 },
    { k: 'dmg', label: '데미지 숫자 표시', type: 'toggle' },
    { k: 'vib', label: '진동 (휴대폰 · 패드)', type: 'toggle' },
    { k: 'voice', label: '몬스터 목소리', type: 'toggle' },
    { k: 'diff', label: '난이도', type: 'diff' },
    { k: 'back', label: '돌아가기', type: 'back' },
  ],
  RY: 168, RH: 50,
  rowRect(i) { return { x: 300, y: this.RY + i * this.RH, w: 680, h: 44 }; },
  track(i) { const r = this.rowRect(i); return { x: r.x + 340, y: r.y + 10, w: 280, h: 24 }; },

  enter(from) { this.from = from || 'lobby'; this.sel = 0; this.drag = -1; },
  leave() { Opt.apply(); Save.save(); Sfx.play('select', 0.7); if (this.from === 'paused') { Game.state = 'paused'; } else Game.state = this.from; if (this.from === 'lobby') Lobby.t = 0; },

  val(r) { return Opt.get()[r.k]; },
  setVal(r, v) { Opt.get()[r.k] = v; Opt.apply(); },
  adjust(i, d) {
    const r = this.rows[i], o = Opt.get();
    if (r.type === 'slider') { const st = r.max / 10, nv = clamp(Math.round((o[r.k] + d * st) / st) * st, 0, r.max); this.setVal(r, +nv.toFixed(2)); Sfx.play('ui', 0.5, 1 + o[r.k]); }
    else if (r.type === 'toggle') { this.setVal(r, !o[r.k]); Sfx.play('ui', 0.6, o[r.k] ? 1.3 : 0.8); }
    else if (r.type === 'diff') { Diff.cycle(d || 1); Sfx.play('ui', 0.6, 1.2); }
  },
  act(i) { const r = this.rows[i]; if (r.type === 'back') this.leave(); else if (r.type === 'toggle' || r.type === 'diff') this.adjust(i, 1); },

  update() {
    if (this.msgT > 0) this.msgT--;
    if (Input.take('pause')) { this.leave(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'up') this.sel = (this.sel + this.rows.length - 1) % this.rows.length;
      else if (q.a === 'down') this.sel = (this.sel + 1) % this.rows.length;
      else if (q.a === 'left') this.adjust(this.sel, -1);
      else if (q.a === 'right') this.adjust(this.sel, 1);
      else if (q.a === 'confirm' || q.a === 'jump') this.act(this.sel);
      else if (q.a === 'options' || q.a === 'back') { this.leave(); return; }
    }
    FX.update();
  },

  setFromX(i, x) {
    const r = this.rows[i], t = this.track(i), u = clamp((x - t.x) / t.w, 0, 1), st = r.max / 10;
    const nv = +(Math.round(u * r.max / st) * st).toFixed(2);
    if (nv !== this.val(r)) { this.setVal(r, nv); Sfx.play('ui', 0.3, 1 + nv * 0.5); }
  },
  pDown(x, y) {
    for (let i = 0; i < this.rows.length; i++) {
      const r = this.rowRect(i); if (!inR(x, y, r)) continue;
      this.sel = i;
      const row = this.rows[i];
      if (row.type === 'slider') { if (x >= r.x + 320) { this.drag = i; this.setFromX(i, x); } }
      else this.act(i);
      return;
    }
  },
  pMove(x, y, down) { if (down && this.drag >= 0) this.setFromX(this.drag, x); },
  pUp() { this.drag = -1; },

  draw(ctx) {
    scrim(ctx);
    UI.text(ctx, '설  정', W / 2, 80, { size: 40, align: 'center', fill: '#ffe9a6', stroke: 6 });
    Shop.panel(ctx, 280, 142, 720, this.rows.length * this.RH + 52);
    const o = Opt.get();
    this.rows.forEach((r, i) => {
      const rr = this.rowRect(i), on = i === this.sel;
      ctx.fillStyle = on ? 'rgba(70,58,26,0.85)' : 'rgba(24,28,42,0.65)'; roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 9); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; ctx.stroke(); }
      UI.text(ctx, r.label, rr.x + 20, rr.y + 23, { size: 18, fill: r.type === 'back' ? '#ffe9a6' : '#e8ecff', stroke: 3 });
      if (r.type === 'slider') {
        const t = this.track(i), v = o[r.k] / r.max;
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, t.x, t.y + 8, t.w, 8, 4); ctx.fill();
        ctx.fillStyle = '#ffd24a'; roundRect(ctx, t.x, t.y + 8, Math.max(8, t.w * v), 8, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(t.x + t.w * v, t.y + 12, 11, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 2; ctx.stroke();
        UI.text(ctx, `${Math.round(o[r.k] * 100)}%`, rr.x + rr.w - 12, rr.y + 23, { size: 15, align: 'right', fill: '#b8c0dc', stroke: 3 });
      } else if (r.type === 'toggle') {
        const x = rr.x + rr.w - 110, y = rr.y + 10, on2 = o[r.k];
        ctx.fillStyle = on2 ? 'rgba(60,150,90,0.9)' : 'rgba(70,70,84,0.9)'; roundRect(ctx, x, y, 88, 26, 13); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(on2 ? x + 75 : x + 13, y + 13, 10, 0, TAU); ctx.fill();
        UI.text(ctx, on2 ? '켜짐' : '꺼짐', on2 ? x + 30 : x + 58, y + 14, { size: 13, align: 'center', stroke: 3 });
      } else if (r.type === 'diff') {
        const d = Diff.cur();
        UI.text(ctx, `◀  ${d.name}  ▶`, rr.x + rr.w - 150, rr.y + 23, { size: 19, align: 'center', fill: `rgb(${d.col})`, stroke: 4 });
        UI.text(ctx, d.desc, rr.x + 190, rr.y + 23, { size: 12, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 3 });
      }
    });
    UI.text(ctx, Touch.on ? '슬라이더를 끌어 조절 · 항목을 탭해 켜고 끄기' : '↑ ↓ 고르기   ← → 조절   Enter 변경   Esc 돌아가기', W / 2, 676, { size: 14, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    ctx.drawImage(UI.vignette, 0, 0);
  },
};

// ============================================================
//  도감 · 업적
// ============================================================
const Codex = {
  tab: 0, sel: [0, 0, 0], scroll: [0, 0, 0], msg: '', msgT: 0, td: null,
  ROWS: 8, ROW_H: 62, LX: 40, LY: 144, LW: 470,
  tabs: ['몬스터', '보스', '업적'],
  list() { return this.tab === 0 ? Dex.monsters.filter(k => k !== 'slimelet') : this.tab === 1 ? Dex.bosses : ACHS; },
  tabRect(i) { return { x: this.LX + i * 160, y: 92, w: 150, h: 38 }; },
  backRect() { return { x: W - 220, y: 54, w: 180, h: 34 }; },
  btnRect() { return { x: 868, y: 574, w: 352, h: 52 }; },
  upRect() { return { x: this.LX + 480, y: 90, w: 0, h: 0 }; },

  enter() { if (!Dex.monsters) Dex.init(); this.msgT = 0; this.td = null; this.scroll[this.tab] = clamp(this.scroll[this.tab], 0, Math.max(0, this.list().length - this.ROWS)); },
  leave() { Save.save(); Sfx.play('select', 0.7); Game.toLobby(); },
  flash(t, c) { this.msg = t; this.msgCol = c || '#fff'; this.msgT = 110; },
  setTab(i) { if (i === this.tab) return; this.tab = i; Sfx.play('ui', 0.7, 1.2); },
  setSel(i) {
    const n = this.list().length; this.sel[this.tab] = (i + n) % n;
    const s = this.sel[this.tab];
    if (s < this.scroll[this.tab]) this.scroll[this.tab] = s;
    if (s >= this.scroll[this.tab] + this.ROWS) this.scroll[this.tab] = s - this.ROWS + 1;
    Sfx.play('ui', 0.5, 1.1);
  },
  scrollBy(n) { this.scroll[this.tab] = clamp(this.scroll[this.tab] + n, 0, Math.max(0, this.list().length - this.ROWS)); },
  claim() {
    const a = ACHS[this.sel[2]];
    if (Ach.claim(a)) { Sfx.play('coin', 1, 0.8); Sfx.play('clear', 0.6); this.flash(`보상 ${fmt(a.gold)} G 획득!`, '#ffe070'); }
    else this.flash(Ach.claimed(a) ? '이미 받은 보상입니다' : '아직 달성하지 못했습니다', '#ff8a70');
  },
  claimAll() {
    let g = 0, n = 0;
    for (const a of ACHS) if (Ach.claim(a)) { g += a.gold; n++; }
    if (n) { Sfx.play('coin', 1, 0.8); Sfx.play('clear', 0.6); this.flash(`${n}개 보상 ${fmt(g)} G 획득!`, '#ffe070'); } else this.flash('받을 보상이 없습니다', '#9aa4c0');
  },
  allRect() { return { x: 868, y: 640, w: 352, h: 34 }; },

  update() {
    if (this.msgT > 0) this.msgT--;
    if (Input.take('pause')) { this.leave(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'up') this.setSel(this.sel[this.tab] - 1);
      else if (q.a === 'down') this.setSel(this.sel[this.tab] + 1);
      else if (q.a === 'left') this.setTab((this.tab + 2) % 3);
      else if (q.a === 'right') this.setTab((this.tab + 1) % 3);
      else if (q.a === 'confirm' || q.a === 'jump') { if (this.tab === 2) this.claim(); }
      else if (q.a === 'codex' || q.a === 'back') { this.leave(); return; }
    }
  },

  pDown(x, y) {
    if (inR(x, y, this.backRect())) { this.leave(); return; }
    for (let i = 0; i < 3; i++) if (inR(x, y, this.tabRect(i))) { this.setTab(i); return; }
    if (this.tab === 2 && inR(x, y, this.btnRect())) { this.claim(); return; }
    if (this.tab === 2 && inR(x, y, this.allRect())) { this.claimAll(); return; }
    const inList = x >= this.LX && x <= this.LX + this.LW && y >= this.LY && y < this.LY + this.ROWS * this.ROW_H;
    this.td = { x, y, s: this.scroll[this.tab], drag: false, inList };
  },
  pMove(x, y, down) {
    const t = this.td; if (!down || !t || !t.inList) return;
    const dy = y - t.y;
    if (!t.drag && Math.abs(dy) > 14) t.drag = true;
    if (t.drag) this.scroll[this.tab] = clamp(Math.round(t.s - dy / this.ROW_H), 0, Math.max(0, this.list().length - this.ROWS));
  },
  pUp(x, y) {
    const t = this.td; this.td = null;
    if (!t || t.drag || !t.inList) return;
    const i = this.scroll[this.tab] + Math.floor((y - this.LY) / this.ROW_H);
    if (i < this.list().length && i !== this.sel[this.tab]) this.setSel(i);
  },
  wheel(d) { this.scrollBy(d > 0 ? 1 : -1); },

  draw(ctx) {
    scrim(ctx);
    UI.text(ctx, '도감  &  업적', 40, 48, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, `도감 ${Dex.found()} / ${Dex.total()}   ·   받을 수 있는 업적 보상 ${Ach.claimable()}개`, 40, 74, { size: 14, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    const br = this.backRect();
    ctx.fillStyle = 'rgba(30,24,14,0.9)'; roundRect(ctx, br.x, br.y, br.w, br.h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, Touch.on ? '돌아가기' : '돌아가기  [Esc]', br.x + br.w / 2, br.y + 18, { size: 15, align: 'center', fill: '#ffe9a6', stroke: 3 });
    for (let i = 0; i < 3; i++) {
      const r = this.tabRect(i), on = i === this.tab;
      ctx.fillStyle = on ? 'rgba(54,44,22,0.95)' : 'rgba(14,16,24,0.85)'; roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(150,160,190,0.35)'; ctx.lineWidth = on ? 2.4 : 1.2; ctx.stroke();
      UI.text(ctx, this.tabs[i] + (i === 2 && Ach.claimable() ? ' !' : ''), r.x + r.w / 2, r.y + 26, { size: 17, align: 'center', fill: on ? '#ffe9a6' : '#8a94b4', stroke: 3 });
    }
    this.drawList(ctx);
    this.drawDetail(ctx);
    if (this.msgT > 0) { ctx.globalAlpha = Math.min(1, this.msgT / 20); UI.text(ctx, this.msg, W / 2, 686, { size: 22, align: 'center', fill: this.msgCol, stroke: 5 }); ctx.globalAlpha = 1; }
    else UI.text(ctx, Touch.on ? '목록을 위아래로 밀어 스크롤 · 탭하면 선택' : '↑ ↓ 고르기   ← → 탭 전환   Enter 보상 받기   Esc 돌아가기', W / 2, 686, { size: 14, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    ctx.drawImage(UI.vignette, 0, 0);
  },

  drawList(ctx) {
    const list = this.list(), s0 = this.scroll[this.tab];
    Shop.panel(ctx, this.LX - 10, this.LY - 8, this.LW + 20, this.ROWS * this.ROW_H + 16);
    for (let r = 0; r < this.ROWS; r++) {
      const i = s0 + r; if (i >= list.length) break;
      const y = this.LY + r * this.ROW_H, on = i === this.sel[this.tab];
      ctx.fillStyle = on ? 'rgba(70,58,26,0.85)' : 'rgba(24,28,42,0.65)'; roundRect(ctx, this.LX, y + 2, this.LW, this.ROW_H - 4, 9); ctx.fill();
      if (on) { ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2.2; ctx.stroke(); }
      if (this.tab === 2) {
        const a = list[i], p = Ach.prog(a), done = Ach.done(a), cl = Ach.claimed(a);
        UI.text(ctx, a.name, this.LX + 16, y + 24, { size: 17, fill: cl ? '#7a84a4' : '#fff', stroke: 3 });
        UI.text(ctx, a.desc, this.LX + 16, y + 46, { size: 12, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 2.5 });
        const bx = this.LX + 250, bw = 130;
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, bx, y + 32, bw, 8, 4); ctx.fill();
        ctx.fillStyle = done ? '#7dffa0' : '#ffd24a'; roundRect(ctx, bx, y + 32, Math.max(6, bw * p / a.goal), 8, 4); ctx.fill();
        UI.text(ctx, `${fmt(p)} / ${fmt(a.goal)}`, bx + bw, y + 22, { size: 12, align: 'right', fill: '#b8c0dc', stroke: 3 });
        UI.text(ctx, cl ? '완료' : done ? '받기!' : '', this.LX + this.LW - 14, y + 31, { size: 16, align: 'right', fill: cl ? '#7a84a4' : '#ffe070', stroke: 3 });
      } else {
        const key = list[i], k = Dex.kills(key), known = k > 0;
        const T = key.startsWith('b:') ? null : ENEMY_TYPES[key];
        UI.text(ctx, known ? Dex.name(key) : '???', this.LX + 16, y + 24, { size: 17, fill: known ? '#fff' : '#6a7494', stroke: 3 });
        UI.text(ctx, known ? (T ? (T.elite ? '정예 몬스터' : '일반 몬스터') : BOSS_DEFS[key.slice(2)].title) : '아직 만나지 못했다', this.LX + 16, y + 46, { size: 12, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 2.5 });
        UI.text(ctx, known ? `처치 ${fmt(k)}` : '미등록', this.LX + this.LW - 14, y + 31, { size: 15, align: 'right', fill: known ? '#9ac8ff' : '#5a6480', stroke: 3 });
      }
    }
    if (list.length > this.ROWS) {
      const x = this.LX + this.LW + 4, h = this.ROWS * this.ROW_H - 8, max = list.length - this.ROWS, th = h * this.ROWS / list.length, ty = this.LY + 2 + (h - th) * (s0 / max);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, x, this.LY + 2, 4, h, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,210,100,0.7)'; roundRect(ctx, x, ty, 4, th, 2); ctx.fill();
    }
  },

  drawDetail(ctx) {
    const x0 = 530, w = 710, y0 = 144, h = 500;
    Shop.panel(ctx, x0, y0, w, h);
    const list = this.list(), key = list[this.sel[this.tab]];
    if (this.tab === 2) {
      const a = key, done = Ach.done(a), cl = Ach.claimed(a);
      UI.text(ctx, a.name, x0 + 30, y0 + 50, { size: 30, fill: '#ffe9a6', stroke: 5 });
      UI.text(ctx, a.desc, x0 + 30, y0 + 90, { size: 17, font: FONT_B, weight: 700, fill: '#dfe4f6', stroke: 3 });
      UI.text(ctx, `진행  ${fmt(Ach.prog(a))} / ${fmt(a.goal)}`, x0 + 30, y0 + 140, { size: 18, fill: '#9ac8ff', stroke: 3 });
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, x0 + 30, y0 + 160, w - 60, 16, 8); ctx.fill();
      ctx.fillStyle = done ? '#7dffa0' : '#ffd24a'; roundRect(ctx, x0 + 30, y0 + 160, Math.max(12, (w - 60) * Ach.prog(a) / a.goal), 16, 8); ctx.fill();
      UI.text(ctx, `보상  ${fmt(a.gold)} G`, x0 + 30, y0 + 220, { size: 22, fill: '#ffe070', stroke: 4 });
      bigBtn(ctx, this.btnRect(), cl ? '받음' : done ? '보상 받기' : '진행 중', done && !cl ? 'rgba(90,70,20,0.95)' : 'rgba(30,50,86,0.95)', done && !cl ? '#ffd24a' : '#6a7aa0', done && !cl);
      bigBtn(ctx, this.allRect(), '받을 수 있는 보상 모두 받기', 'rgba(30,50,86,0.95)', '#9ac8ff', Ach.claimable() > 0);
      return;
    }
    const k = Dex.kills(key), known = k > 0, isB = key.startsWith('b:');
    // 미리보기
    ctx.save(); roundRect(ctx, x0 + 16, y0 + 16, 300, h - 32, 12); ctx.clip();
    const sg = ctx.createLinearGradient(0, y0, 0, y0 + h); sg.addColorStop(0, '#10162c'); sg.addColorStop(1, '#2a3050');
    ctx.fillStyle = sg; ctx.fillRect(x0 + 16, y0 + 16, 300, h - 32);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x0 + 166, y0 + 400, 100, 20, 0, 0, TAU); ctx.fill();
    try { Dex.draw(ctx, key, x0 + 166, y0 + 400, 300, known); } catch (e) { }
    ctx.restore();
    UI.text(ctx, known ? Dex.name(key) : '???', x0 + 340, y0 + 50, { size: 28, fill: known ? '#ffe9a6' : '#6a7494', stroke: 5 });
    if (!known) { UI.text(ctx, '이 몬스터를 처음 처치하면 도감에 등록되고 2,000G를 받습니다.', x0 + 340, y0 + 100, { size: 14, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 3 }); return; }
    const lines = [];
    if (isB) { const d = BOSS_DEFS[key.slice(2)]; lines.push(['칭호', d.title || '-'], ['패턴 수', d.body ? Object.keys(CREATURES[d.body].acts).length + 1 : (d.patterns || []).length]); }
    else { const T = ENEMY_TYPES[key]; lines.push(['구분', T.elite ? '정예' : '일반'], ['재질', ({ flesh: '살', armor: '갑옷', bone: '뼈', magic: '마력', stone: '돌', beast: '야수', ice: '얼음', metal: '금속' })[T.hitMat] || '-']); }
    lines.push(['누적 처치', fmt(k)]);
    lines.forEach(([a, b], i) => { UI.text(ctx, a, x0 + 340, y0 + 96 + i * 30, { size: 14, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 2.5 }); UI.text(ctx, String(b), x0 + w - 36, y0 + 96 + i * 30, { size: 16, align: 'right', fill: '#fff', stroke: 3 }); });
    UI.text(ctx, '공략 힌트', x0 + 340, y0 + 214, { size: 16, fill: '#9ac8ff', stroke: 3 });
    const lore = DEX_LORE[key] || '';
    Shop.wrap(ctx, lore, w - 380, 15).forEach((ln, i) => UI.text(ctx, ln, x0 + 340, y0 + 246 + i * 24, { size: 15, font: FONT_B, weight: 700, fill: '#dfe4f6', stroke: 3 }));
  },
};

// 마우스 휠 (도감)
addEventListener('wheel', e => { if (Game.state === 'codex') Codex.wheel(e.deltaY); }, { passive: true });

// ============================================================
//  일시정지 메뉴 : 계속하기 / 설정 / 로비로 나가기 (마우스 · 터치 · 키보드)
// ============================================================
const Pause = {
  sel: 0, arm: 0,
  btn(i) { return { x: 294 + i * 236, y: 150, w: 220, h: 46 }; },
  enter() { this.sel = 0; this.arm = 0; },
  press(i) {
    if (i === 0) { Game.state = Game.pausedFrom; Sfx.play('ui'); }
    else if (i === 1) { Sfx.play('select'); Game.openOptions('paused'); }
    else if (this.arm > 0) { Sfx.play('select'); this.arm = 0; Game.quitToLobby(); }
    else { this.arm = 200; this.sel = 2; Sfx.play('ui', 0.8, 0.8); }          // 실수로 나가지 않게 한 번 더 확인
  },
  click(x, y) { for (let i = 0; i < 3; i++) if (inR(x, y, this.btn(i))) { this.press(i); return true; } return false; },
  update() {
    if (this.arm > 0) this.arm--;
    if (Input.take('left')) { this.sel = (this.sel + 2) % 3; this.arm = 0; Sfx.play('ui', 0.5, 1.1); }
    if (Input.take('right')) { this.sel = (this.sel + 1) % 3; this.arm = 0; Sfx.play('ui', 0.5, 1.1); }
    if (Input.take('confirm')) this.press(this.sel);
    else if (Input.take('back')) this.press(2);
  },
  draw(ctx) {
    const names = ['계속하기', Touch.on ? '설정' : '설정  [O]', this.arm > 0 ? '정말 나갈까요?  한 번 더' : '로비로 나가기'];
    for (let i = 0; i < 3; i++) {
      const r = this.btn(i), on = i === this.sel, warn = i === 2;
      const col = warn ? (this.arm > 0 ? 'rgba(120,34,28,0.95)' : 'rgba(70,30,26,0.9)') : 'rgba(30,50,86,0.95)';
      ctx.fillStyle = col; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : (warn ? '#ff8a70' : '#9ac8ff'); ctx.lineWidth = on ? 3.2 : 2; ctx.stroke();
      UI.text(ctx, names[i], r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 18, align: 'center', fill: '#fff', stroke: 4 });
    }
  },
};

// ============================================================
//  기록 카드 (이미지로 저장 · 공유)
// ============================================================
const Share = {
  btn: { x: 470, y: 600, w: 340, h: 46 },
  hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(0, 7); },
  info() {
    const dun = Game.dungeon && Game.dungeon.def, s = Game.stats, R = Game.result, tower = dun && dun.tower;
    const sec = s.time / 60 | 0, w = Gear.w(), a = Gear.a(), d = Diff.cur();
    const floor = tower ? Game.roomIdx + (Game.state === 'result' ? 1 : 0) : 0;      // 결과 화면 = 마지막 층까지 클리어
    const title = tower ? `무한의 탑  ${floor}층 돌파` : `${(R && R.dungeon) || (dun && dun.name) || '던전'}  클리어`;
    const rows = [
      tower ? ['돌파한 층', `${floor}층  (최고 ${Save.data.tower.best}층)`] : ['랭크 / 점수', R ? `${R.rank}  /  ${fmt(R.score)}` : '-'],
      ['클리어 타임', `${String(sec / 60 | 0).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`],
      ['최대 콤보', fmt(s.maxCombo)], ['처치한 몬스터', fmt(s.kills)], ['난이도', d.name],
      ['장비', `${Gear.label(w)}  /  ${Gear.label(a)}`],
    ];
    const date = new Date(), ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const code = this.hash(['BR1:7c3e', title, s.kills, s.maxCombo, sec, floor, d.id, ds, w.id, a.id].join('|'));
    return { title, rows, ds, code, tower, floor, rank: R && R.rank, diff: d };
  },
  render() {
    const I = this.info(), S = 1080, c = makeCanvas(S, S), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, S, S); bg.addColorStop(0, '#0c1226'); bg.addColorStop(0.55, '#1a1e3a'); bg.addColorStop(1, '#2a1230');
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`; g.fillRect(Math.random() * S, Math.random() * S * 0.6, 2, 2); }
    g.globalCompositeOperation = 'lighter'; drawGlow(g, S * 0.75, 260, 420, `${I.diff.col}`, 0.25); g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(g, 50, 50, S - 100, S - 100, 28); g.fill();
    g.strokeStyle = '#c9a55c'; g.lineWidth = 4; g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const T = (t, x, y, size, fill, font = FONT_T, align = 'center') => { g.font = `${size}px ${font}`; g.textAlign = align; g.lineWidth = size / 6; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(t, x, y); g.fillStyle = fill; g.fillText(t, x, y); };
    T('BLADE RAID', S / 2, 140, 84, '#ffe9a6');
    T('블레이드 레이드', S / 2, 205, 32, '#9aa4c0', FONT_B);
    T(I.title, S / 2, 330, 64, '#ffffff');
    if (I.rank) T(I.rank, S / 2, 450, 150, ({ SSS: '#ff4ad8', SS: '#ffb020', S: '#ffd24a', A: '#4ac2ff', B: '#4adf6a', C: '#999' })[I.rank] || '#fff');
    const y0 = I.rank ? 560 : 470;
    I.rows.forEach(([a, b], i) => { const y = y0 + i * 62; g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(120, y - 26, S - 240, 52); T(a, 150, y, 28, '#8a94b4', FONT_B, 'left'); T(b, S - 150, y, 32, '#fff', FONT_T, 'right'); });
    T(`인증 코드  ${I.code}`, S / 2, 975, 30, '#ffd24a');
    T(`${I.ds}   ·   yeonny3209.github.io/blade-raid`, S / 2, 1015, 22, '#7a84a4', FONT_B);
    return { canvas: c, info: I };
  },
  busy: false,
  async save() {
    if (this.busy) return;
    this.busy = true;
    try {
      const { canvas, info } = this.render();
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const name = `BladeRaid_${info.tower ? 'Tower' + info.floor : 'Clear'}_${info.code}.png`;
      if (window.AndroidApp && AndroidApp.saveImage) {                       // 안드로이드 앱 : 갤러리에 저장
        const ok = AndroidApp.saveImage(canvas.toDataURL('image/png').split(',')[1], name);
        Game.notice(ok ? '갤러리(Pictures/BladeRaid)에 저장했습니다' : '기록 카드를 저장하지 못했습니다'); return;
      }
      const file = new File([blob], name, { type: 'image/png' });
      if (Touch.on && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'BLADE RAID', text: `#블레이드레이드 ${info.title}  인증코드 ${info.code}` }); }
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
      Game.notice('기록 카드를 저장했습니다');
    } catch (e) { if (!(e && e.name === 'AbortError')) Game.notice('기록 카드를 저장하지 못했습니다'); }
    finally { this.busy = false; }
  },
  active() { return Game.state === 'result' || Game.state === 'gameover'; },
  // 버튼 위를 눌렀으면 true (이 입력은 "계속하기"로 쓰이지 않게 막는다)
  swallow(e) {
    if (!this.active() || !(Game.resT > 100 || Game.state === 'gameover')) return false;
    const [x, y] = Touch.toLogical(e);
    if (!inR(x, y, this.btn)) return false;
    this.save(); return true;
  },
  draw(ctx) {
    if (!this.active()) return;
    bigBtn(ctx, this.btn, Touch.on ? '기록 카드 저장 · 공유' : '기록 카드 저장  [P]', 'rgba(30,50,86,0.95)', '#9ac8ff');
  },
};
