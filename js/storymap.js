'use strict';
// ============================================================
//  세계 지도 (로비를 대신한다)
//   위 : 장 탭 (프롤로그 · 1 ~ 8장)
//   가운데 : 스테이지 노드 (5개씩 뱀 모양 줄)
//   오른쪽 : 선택한 스테이지 정보 + 출격
//   아래 : 상점 · 스킬 트리 · 무한의 탑 · 도감 · 설정 · 난이도
// ============================================================
const TYPE_NAME = { kill: '섬멸', survive: '생존', defend: '방어', escort: '호위', time: '돌파', chase: '추격', elite: '정예', rush: '연전', boss: '보스' };
const TRAP_NAME = { debris: '떨어지는 잔해', rock: '낙석', bolt: '낙뢰', spike: '가시 함정', crystal: '수정 가시', fire: '불기둥', pool: '독 웅덩이', arrow: '화살 함정', saw: '톱날', ice: '빙판' };

const StoryMap = {
  m: 0, sel: 0, t: 0, enterT: 0, modal: null, msg: 0, msgText: '', hover: -1,

  enter() {
    this.t = 0; this.enterT = 0; this.modal = null;
    const sd = Story.sd(), cur = SSTAGE[sd.cur] || SMAIN[0];
    this.m = cur.m; this.sel = SMAPS[cur.m].stages.indexOf(cur);
    if (this.sel < 0) this.sel = 0;
    Music.play('title');
    // 처음 : 프롤로그로 곧장 / 예전 플레이어 : 튜토리얼을 건너뛸지 묻는다
    if (!sd.seen.prologue && Story.clearedCount() === 0) {
      sd.seen.prologue = 1; Save.save();
      if (sd.legacy >= 0) {
        this.modal = {
          title: '새로운 이야기', lines: ['메인 스토리가 처음부터 시작됩니다.', '장비 · 레벨 · 골드는 그대로 가져갑니다.', '프롤로그(튜토리얼)를 건너뛰고 제1장부터 시작할까요?'],
          opts: ['프롤로그부터', '건너뛰기'], sel: 0,
          cb: i => { if (i === 1) { sd.flag.tutSkip = 1; sd.cur = '1-1'; Save.save(); this.m = 1; this.sel = 0; } },
        };
      } else this.autoGo = 50;
    }
  },
  stages() { return SMAPS[this.m].stages; },
  cur() { return this.stages()[this.sel]; },
  mapOpen(m) { return Story.unlocked(SMAPS[m].stages[0]) || SMAPS[m].stages.some(s => Story.cleared(s.id)); },

  // ---------- 배치 ----------
  nodePos(i) {
    const n = this.stages().length, rows = Math.ceil(n / 5), r = (i / 5) | 0, c = i % 5;
    const cc = r % 2 ? 4 - c : c;
    const y0 = 380 - (rows - 1) * 72;
    return { x: 110 + cc * 166, y: y0 + r * 144 + (cc % 2 ? 18 : -10) };
  },
  tabRect(i) { return { x: 24 + i * 92, y: 84, w: 86, h: 40 }; },
  startRect() { return { x: 900, y: 532, w: 340, h: 58 }; },
  BTNS: [['camp', '등불'], ['shop', '상점'], ['tree', '스킬 트리'], ['tower', '무한의 탑'], ['codex', '도감 · 업적'], ['options', '설정'], ['diff', '난이도']],
  btnRect(i) { return { x: 24 + i * 177, y: 636, w: 167, h: 60 }; },
  fragRect() { return { x: W - 500, y: 18, w: 150, h: 40 }; },
  btnOpen(k) { return k === 'camp' ? Story.isOpen('hub') : k === 'shop' ? Story.isOpen('shop') : k === 'tree' ? Story.isOpen('tree') : k === 'tower' ? Story.isOpen('tower') : true; },
  lockText: { camp: '제1장을 마치면 거점 「등불」이 열립니다', shop: '프롤로그를 마치면 상점이 열립니다', tree: '제1장을 마치면 거점 · 스킬 트리가 열립니다', tower: '제2장을 마치면 무한의 탑이 열립니다' },

  // ---------- 입력 ----------
  update() {
    this.t++; if (this.msg > 0) this.msg--;
    if (this.enterT > 0) { if (--this.enterT === 0) Story.start(this.cur().id); return; }
    if (this.autoGo > 0 && --this.autoGo === 0) { this.go(); return; }
    Input.take('pause');
    if (this.t < 12) { Input.clear(); return; }
    const evs = Input.drain();
    if (this.modal) {
      const M = this.modal;
      for (const q of evs) {
        if (q.a === 'left' || q.a === 'right' || q.a === 'up' || q.a === 'down') { M.sel = (M.sel + 1) % M.opts.length; Sfx.play('ui', 0.6); }
        else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') { this.pickModal(M.sel); return; }
      }
      return;
    }
    for (const q of evs) {
      if (q.a === 'left') this.move(-1);
      else if (q.a === 'right') this.move(1);
      else if (q.a === 'up') this.setMap(this.m - 1);
      else if (q.a === 'down') this.setMap(this.m + 1);
      else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') { this.go(); return; }
      else if (['shop', 'tree', 'tower', 'codex', 'options', 'diff'].includes(q.a)) { this.btn(q.a); if (Game.state !== 'smap') return; }
    }
  },
  pickModal(i) { const M = this.modal; this.modal = null; Sfx.play('select'); if (M.cb) M.cb(i); },
  move(d) {
    const n = this.stages().length;
    let i = this.sel + d;
    if (i < 0) { if (this.m > 0 && this.mapOpen(this.m - 1)) { this.setMap(this.m - 1); this.sel = this.stages().length - 1; } return; }
    if (i >= n) { if (this.m < SMAPS.length - 1 && this.mapOpen(this.m + 1)) { this.setMap(this.m + 1); this.sel = 0; } return; }
    this.sel = i; Sfx.play('ui', 0.6, 1 + d * 0.05);
  },
  setMap(m) {
    if (m < 0 || m >= SMAPS.length || m === this.m) return;
    if (!this.mapOpen(m)) { this.say(`${SMAPS[m].sub}은(는) 아직 갈 수 없습니다`); return; }
    this.m = m; Sfx.play('ui', 0.7, 1.1);
    const st = this.stages(); let k = st.findIndex(s => Story.unlocked(s) && !Story.cleared(s.id));
    this.sel = k >= 0 ? k : 0;
  },
  say(t) { this.msg = 130; this.msgText = t; Sfx.play('ui', 0.6, 0.5); },
  go() {
    const s = this.cur();
    if (!Story.unlocked(s)) { this.say('앞 스테이지를 먼저 클리어하세요'); return; }
    const dm = Diff.cur();
    if (!Story.diffOk(this.m, dm.id)) { Save.data.diff = 'normal'; Save.save(); Game.notice(`이 장에서는 아직 「${dm.name}」을 고를 수 없어 보통으로 출격합니다`); }
    Sfx.play('select'); Game.flashScreen(0.3, '255,230,160'); this.enterT = 28;
  },
  btn(k) {
    if (!this.btnOpen(k)) { this.say(this.lockText[k]); return; }
    if (k === 'camp') { Sfx.play('select'); Game.toCamp(); }
    else if (k === 'shop') { Sfx.play('select'); Game.toShop(); }
    else if (k === 'tree') { Sfx.play('select'); Game.toTree(); }
    else if (k === 'codex') { Sfx.play('select'); Game.toCodex(); }
    else if (k === 'options') { Sfx.play('select'); Game.openOptions('smap'); }
    else if (k === 'tower') {
      const run = Save.data.tower.run > 0 ? Save.data.tower.run : 0;
      if (run) {
        this.modal = { title: '무한의 탑', lines: [`${run + 1}층에서 이어서 오를 수 있습니다.`], opts: ['이어하기', '1층부터'], sel: 0, cb: i => { if (i === 1) { Save.data.tower.run = null; Save.save(); } Game.startDungeon('tower', i === 1 ? 0 : run); } };
      } else { Sfx.play('select'); Game.startDungeon('tower', 0); }
    } else if (k === 'diff') {
      for (let n = 0; n < DIFFS.length; n++) { Diff.cycle(1); if (Story.diffOk(this.m, Diff.cur().id)) break; }
      Sfx.play('ui', 0.7, 1.2);
    }
  },
  pDown(x, y) {
    if (this.enterT > 0 || this.t < 12) return;
    if (this.modal) { for (let i = 0; i < this.modal.opts.length; i++) if (inR(x, y, this.modalBtn(i))) { this.pickModal(i); return; } return; }
    if (inR(x, y, this.fragRect())) { Sfx.play('select'); Game.toAlbum('smap'); return; }
    for (let i = 0; i < SMAPS.length; i++) if (inR(x, y, this.tabRect(i))) { this.setMap(i); return; }
    const st = this.stages();
    for (let i = 0; i < st.length; i++) { const P = this.nodePos(i); if (Math.hypot(x - P.x, y - P.y) < 40) { if (this.sel === i) this.go(); else { this.sel = i; Sfx.play('ui', 0.6); } return; } }
    if (inR(x, y, this.startRect())) { this.go(); return; }
    for (let i = 0; i < this.BTNS.length; i++) if (inR(x, y, this.btnRect(i))) { this.btn(this.BTNS[i][0]); return; }
  },
  pMove(x, y) { this.hover = -1; const st = this.stages(); for (let i = 0; i < st.length; i++) { const P = this.nodePos(i); if (Math.hypot(x - P.x, y - P.y) < 40) this.hover = i; } },
  modalBtn(i) { const n = this.modal.opts.length; return { x: W / 2 - n * 130 + i * 260 + 10, y: 440, w: 240, h: 56 }; },

  // ---------- 그리기 ----------
  bg(m) {
    this.bgC = this.bgC || {};
    if (this.bgC[m]) return this.bgC[m];
    const c = makeCanvas(W, H), g = c.getContext('2d'), col = SMAPS[m].col, rnd = mulberry(m * 977 + 3);
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, col[0]); gr.addColorStop(0.6, col[1]); gr.addColorStop(1, col[0]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 양피지 지도 느낌 : 등고선 + 얼룩
    g.globalAlpha = 0.12; g.strokeStyle = col[2]; g.lineWidth = 1.2;
    for (let k = 0; k < 9; k++) { const cx = rnd() * 860, cy = 160 + rnd() * 420, r = 60 + rnd() * 120; for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(cx, cy, r + j * 18, (r + j * 18) * 0.55, rnd() * 0.5, 0, TAU); g.stroke(); } }
    g.globalAlpha = 1;
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`; g.beginPath(); g.arc(rnd() * W, rnd() * H, 1 + rnd() * 3, 0, TAU); g.fill(); }
    const vg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 800); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return (this.bgC[m] = c);
  },
  draw(ctx) {
    const t = this.t, sd = Story.sd();
    ctx.drawImage(this.bg(this.m), 0, 0);
    // 지도 이름 (바탕 글씨)
    UI.text(ctx, SMAPS[this.m].name, 440, 600, { size: 74, align: 'center', fill: 'rgba(255,255,255,0.05)', italic: true });
    // 윗줄
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 72);
    UI.text(ctx, 'BLADE RAID', 24, 38, { size: 30, italic: true, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '메인 스토리 · 기억의 조각', 228, 40, { size: 15, font: FONT_B, weight: 700, fill: '#c8b890', stroke: 3 });
    const info = [[`${heroName()}  Lv.${Prog.lv()}`, '#e8ecf8'], [`★ ${SMAIN.reduce((a, s) => a + Story.stars(s.id), 0)} / ${SMAIN.length * 3}`, '#ffd24a'], [`기억 조각 ${Story.fragCount()} / 40`, '#ffe0a0'], [`엔딩 ${ENDS.filter(e => sd.end[e.k]).length} / 3`, '#c8f0c8'], [`${fmt(Save.data.gold || 0)} G`, '#ffe9a6']];
    const xs = [W - 740, W - 560, W - 360, W - 215, W - 24];
    info.forEach(([txt, col], i) => UI.text(ctx, txt, xs[i], 38, { size: 17, align: 'right', fill: col, stroke: 3 }));
    // 장 탭
    for (let i = 0; i < SMAPS.length; i++) {
      const r = this.tabRect(i), on = i === this.m, open = this.mapOpen(i);
      ctx.fillStyle = on ? 'rgba(70,52,20,0.95)' : open ? 'rgba(14,14,22,0.82)' : 'rgba(10,10,14,0.6)'; roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(200,190,160,0.3)'; ctx.lineWidth = on ? 2.4 : 1.2; ctx.stroke();
      UI.text(ctx, open ? SMAPS[i].sub : '???', r.x + r.w / 2, r.y + 15, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: on ? '#ffe9a6' : open ? '#c8cce0' : '#5a5a6a', stroke: 3 });
      if (open) UI.text(ctx, `★${Story.mapStars(i)}`, r.x + r.w / 2, r.y + 31, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: '#d8b858', stroke: 2 });
    }
    // 길
    const st = this.stages();
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < st.length - 1; i++) {
      const a = this.nodePos(i), b = this.nodePos(i + 1), done = Story.cleared(st[i].id);
      ctx.strokeStyle = done ? 'rgba(255,210,120,0.75)' : 'rgba(200,200,220,0.22)'; ctx.lineWidth = done ? 5 : 3; ctx.setLineDash(done ? [] : [8, 10]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 24, b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
    // 노드
    st.forEach((s, i) => this.drawNode(ctx, s, i));
    this.drawPanel(ctx, this.cur());
    // 아랫줄 버튼
    this.BTNS.forEach(([k, lab], i) => {
      const r = this.btnRect(i), open = this.btnOpen(k);
      ctx.fillStyle = open ? 'rgba(16,16,26,0.88)' : 'rgba(10,10,14,0.7)'; roundRect(ctx, r.x, r.y, r.w, r.h, 11); ctx.fill();
      ctx.strokeStyle = open ? 'rgba(201,165,92,0.6)' : 'rgba(120,120,130,0.3)'; ctx.lineWidth = 1.4; ctx.stroke();
      let sub = '';
      if (k === 'diff') { const d = Diff.cur(); sub = d.name; UI.text(ctx, sub, r.x + r.w / 2, r.y + 42, { size: 15, align: 'center', fill: `rgb(${d.col})`, stroke: 3 }); }
      else if (!open) sub = '잠김';
      else if (k === 'tree' && Prog.free()) sub = `포인트 ${Prog.free()}`;
      else if (k === 'codex' && Ach.claimable()) sub = `보상 ${Ach.claimable()}`;
      else if (k === 'tower' && Save.data.tower.best) sub = `최고 ${Save.data.tower.best}층`;
      UI.text(ctx, lab, r.x + r.w / 2, r.y + (sub ? 22 : 31), { size: 19, align: 'center', fill: open ? '#e8ecf8' : '#6a6a7a', stroke: 3 });
      if (sub && k !== 'diff') UI.text(ctx, sub, r.x + r.w / 2, r.y + 44, { size: 12, align: 'center', font: FONT_B, weight: 700, fill: open ? '#ffd890' : '#5a5a6a', stroke: 2 });
      if (!Touch.on) { const kl = Input.label(k); if (kl) UI.text(ctx, kl, r.x + r.w - 10, r.y + 13, { size: 11, align: 'right', font: FONT_B, weight: 700, fill: '#8a8a9a', stroke: 2 }); }
    });
    if (this.msg > 0) { ctx.globalAlpha = Math.min(1, this.msg / 20); UI.text(ctx, this.msgText, 440, 150, { size: 19, align: 'center', fill: '#ffb0a0', stroke: 4 }); ctx.globalAlpha = 1; }
    if (this.modal) this.drawModal(ctx);
    if (this.enterT > 0 || this.autoGo > 0) { const a = this.enterT > 0 ? 1 - this.enterT / 28 : 1 - this.autoGo / 50; ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); }
  },
  drawNode(ctx, s, i) {
    const P = this.nodePos(i), t = this.t, sel = i === this.sel, open = Story.unlocked(s), done = Story.cleared(s.id);
    const boss = s.type === 'boss', R = boss ? (s.final ? 38 : 33) : 27;
    const next = open && !done;
    ctx.save();
    if (sel) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, P.x, P.y, R * 2.6, '255,210,120', 0.35 + Math.sin(t * 0.08) * 0.1); ctx.globalCompositeOperation = 'source-over'; }
    if (next) { ctx.strokeStyle = `rgba(255,230,160,${0.5 + Math.sin(t * 0.1) * 0.4})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(P.x, P.y, R + 8 + Math.sin(t * 0.1) * 2, 0, TAU); ctx.stroke(); }
    const g = ctx.createRadialGradient(P.x - R * 0.3, P.y - R * 0.3, 2, P.x, P.y, R);
    if (!open) { g.addColorStop(0, '#3a3a44'); g.addColorStop(1, '#16161c'); }
    else if (s.mem) { g.addColorStop(0, '#fff0c8'); g.addColorStop(1, '#a87a3a'); }
    else if (boss) { g.addColorStop(0, '#ff8a6a'); g.addColorStop(1, '#6a1010'); }
    else if (done) { g.addColorStop(0, '#ffe8a0'); g.addColorStop(1, '#8a6020'); }
    else { g.addColorStop(0, '#9ac8ff'); g.addColorStop(1, '#1e3a6a'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = sel ? '#fff4c8' : 'rgba(0,0,0,0.7)'; ctx.lineWidth = sel ? 3 : 2; ctx.stroke();
    // 가운데 표시
    if (!open) UI.text(ctx, '🔒', P.x, P.y + 1, { size: 18, align: 'center', font: FONT_B, fill: '#888', stroke: 0 });
    else UI.text(ctx, boss ? '☠' : `${s.n}`, P.x, P.y + 1, { size: boss ? 26 : 22, align: 'center', fill: '#fff', stroke: 4, italic: !boss });
    // 별
    if (done) { const n = Story.stars(s.id); for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(P.x - 18 + k * 18, P.y + R + 12); starShape(ctx, 0, 0, 8, k < n ? '#ffd24a' : '#2a2a36', k < n ? '#fff2b0' : '#4a4a5a'); ctx.restore(); } }
    // 기억 조각
    if (s.frag) { const got = Story.sd().frag[s.frag], X = P.x + R * 0.78, Y = P.y - R * 0.78; ctx.fillStyle = got ? '#ffe0a0' : 'rgba(60,50,40,0.9)'; ctx.beginPath(); ctx.moveTo(X, Y - 8); ctx.lineTo(X + 6, Y); ctx.lineTo(X, Y + 8); ctx.lineTo(X - 6, Y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = got ? '#fff' : '#a08a60'; ctx.lineWidth = 1.4; ctx.stroke(); }
    // 이름 (선택 · 마우스를 올린 노드)
    if (sel || this.hover === i) UI.text(ctx, s.name, P.x, P.y - R - 16, { size: 14, align: 'center', font: FONT_B, weight: 700, fill: '#fff4d8', stroke: 3 });
    ctx.restore();
  },
  drawPanel(ctx, s) {
    const X = 884, Y = 140, Wd = 372, Ht = 470, open = Story.unlocked(s), c = Story.sd().clr[s.id];
    ctx.fillStyle = 'rgba(8,8,14,0.82)'; roundRect(ctx, X, Y, Wd, Ht, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,92,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, `${SMAPS[s.m].sub} · ${s.id}`, X + 22, Y + 30, { size: 15, font: FONT_B, weight: 700, fill: '#b8a888', stroke: 3 });
    UI.text(ctx, open ? s.name : '???', X + 22, Y + 66, { size: 28, fill: '#fff4d8', stroke: 4 });
    const tag = s.mem ? '기억' : TYPE_NAME[s.type];
    ctx.fillStyle = s.type === 'boss' ? 'rgba(160,30,30,0.85)' : s.mem ? 'rgba(160,120,50,0.85)' : 'rgba(40,70,120,0.85)'; roundRect(ctx, X + Wd - 92, Y + 16, 72, 26, 7); ctx.fill();
    UI.text(ctx, tag, X + Wd - 56, Y + 30, { size: 14, align: 'center', font: FONT_B, weight: 700, fill: '#fff', stroke: 2 });
    let y = Y + 108;
    const row = (k, v, col = '#e8ecf8') => { UI.text(ctx, k, X + 22, y, { size: 14, font: FONT_B, weight: 700, fill: '#9a9cb0', stroke: 2 }); UI.text(ctx, v, X + 112, y, { size: 15, font: FONT_B, weight: 700, fill: col, stroke: 3 }); y += 30; };
    if (!open) { UI.text(ctx, '앞 스테이지를 클리어하면 열립니다', X + Wd / 2, Y + 220, { size: 16, align: 'center', font: FONT_B, weight: 700, fill: '#8a8a9a', stroke: 3 }); }
    else {
      row('목표', Story.goalText(s), '#ffe9a6');
      row('권장 레벨', `Lv.${stageLv(s)}`, Prog.lv() + 3 < stageLv(s) ? '#ff8a70' : '#c8f0c8');
      if (s.rule) row('특수 규칙', RULE_TEXT[s.rule][0], '#c0a8ff');
      if (s.trap) row('함정', TRAP_NAME[s.trap] || s.trap, '#ffb080');
      if (s.ally) row('동료', castName(s.ally), '#9fefff');
      if (s.mem) row('기억', '리엔은 이곳에 함께할 수 없다', '#ffe0a0');
      row('기억 조각', s.frag ? (Story.sd().frag[s.frag] ? '찾았다' : '어딘가에 있다') : '없음', s.frag ? (Story.sd().frag[s.frag] ? '#ffe0a0' : '#c8b890') : '#6a6a7a');
      if (c) { row('최고 기록', `${String(c.t / 60 | 0).padStart(2, '0')}:${String(c.t % 60).padStart(2, '0')}  ·  콤보 ${c.combo}`); }
      // 별 3개
      const n = Story.stars(s.id);
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(X + Wd / 2 - 50 + k * 50, Y + Ht - 118); starShape(ctx, 0, 0, 17, k < n ? '#ffd24a' : '#22222c', k < n ? '#fff2b0' : '#4a4a5a'); ctx.restore(); }
      const unl = s.unlock && !Story.isOpen(s.unlock) ? { shop: '클리어 보상 : 상점 개방', hub: '클리어 보상 : 거점 · 스킬 트리', tower: '클리어 보상 : 무한의 탑', hell: '클리어 보상 : 지옥 난이도' }[s.unlock] : null;
      if (unl) UI.text(ctx, unl, X + Wd / 2, Y + Ht - 84, { size: 14, align: 'center', font: FONT_B, weight: 700, fill: '#8affc0', stroke: 3 });
    }
    const r = this.startRect();
    bigBtn(ctx, r, open ? (Touch.on ? '출격' : '출격  [Enter]') : '잠김', 'rgba(120,70,16,0.95)', '#ffd24a', open);
  },
  drawModal(ctx) {
    const M = this.modal;
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(20,18,28,0.97)'; roundRect(ctx, W / 2 - 330, 210, 660, 310, 16); ctx.fill();
    ctx.strokeStyle = '#c9a55c'; ctx.lineWidth = 2; ctx.stroke();
    UI.text(ctx, M.title, W / 2, 256, { size: 30, align: 'center', fill: '#ffe9a6', stroke: 5 });
    M.lines.forEach((l, i) => UI.text(ctx, l, W / 2, 312 + i * 34, { size: 17, align: 'center', font: FONT_B, weight: 700, fill: '#e0e4f0', stroke: 3 }));
    M.opts.forEach((o, i) => { const r = this.modalBtn(i), on = M.sel === i; bigBtn(ctx, r, o, on ? 'rgba(120,70,16,0.95)' : 'rgba(30,30,44,0.95)', on ? '#ffd24a' : '#6a6a80'); });
  },
};
