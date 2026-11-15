'use strict';
// ============================================================
//  거점 「등불」 + 기억 앨범
//   - 등불 : 생존자 야영지. 볼크(상점) · 한나(스킬 트리 · 장비 강화) · 테오(기억 앨범) · 세릭(이야기 현황)
//     진행에 따라 인물들의 한마디가 바뀐다
//   - 앨범 : 모은 기억 조각 40개를 다시 읽는다 + 본 엔딩 기록
//   지도(StoryMap)의 「등불」 버튼 · 상단 기억 조각 표시로 들어온다
// ============================================================
const ENDS = [
  { k: 'A', title: '다시, 처음부터', sum: '기억을 바쳐 다시 봉인했다. 모든 것을 잊은 채, 비 오는 해안에서 다시 시작한다.', hint: '8-15 에서 「다시 봉인한다」를 고른다' },
  { k: 'B', title: '기억하는 자', sum: '모든 기억을 안은 채 옥좌에 앉아 왕을 가두었다. 곁에는 작은 빛이 남았다.', hint: '8-15 에서 「끝까지 싸운다」를 고른다' },
  { k: 'T', title: '리엔', sum: '잊힌 이들의 이름을 모두 불러, 이름 없는 왕을 보내고 리엔과 작별했다.', hint: '기억 조각을 모두 모은 채 8-15 에서 이름을 부른다' },
];
const fragsOf = m => Object.keys(FRAGS).filter(k => k.startsWith('f' + m + '_')).sort();

// 진행도 : 가장 멀리 깬 장 (0 ~ 8)
const reachedMap = () => SMAIN.reduce((a, s) => (Story.cleared(s.id) ? Math.max(a, s.m) : a), 0);

// ---------- 등불 ----------
const Camp = {
  t: 0, sel: 2, msg: 0, msgText: '',
  FOLK: [
    { who: 'volk', name: '볼크', role: '상점', go: 'shop', open: () => Story.isOpen('shop'), lock: '아직 열리지 않았다',
      lines: ['물건 좀 보고 가시오. 값은 후하게 쳐 드리지!', '왕도가 무너져도 장사는 계속되는 법이오.', '물약은 넉넉히 챙기시오. 다음 길은 험하다던데.', '바다 밑에 간다고? 물약이 젖지 않는 포장은 별도요.', '마지막 싸움이라 들었소. ……오늘은 외상도 해 드리지.'] },
    { who: 'hanna', name: '한나', role: '스킬 트리 · 장비 강화', go: 'tree', open: () => Story.isOpen('tree'), lock: '제1장을 마치면 열린다',
      lines: ['검이 울고 있어. 손봐 줄 테니 맡겨 봐.', '날이 많이 상했네. 어디서 이렇게 싸우고 다닌 거야?', '장비도 중요하지만, 몸이 먼저 기억해야 해. 기술을 익혀 둬.', '엘라의 마법이 안 닿는 곳이니, 장비를 더 강하게 해 두자.', '이게 마지막 손질이 되겠지. ……살아서 돌아와.'] },
    { who: 'theo', name: '테오', role: '기억 앨범', go: 'album', open: () => true, lock: '',
      lines: ['허허, 오셨습니까. 모은 기억을 함께 읽어 볼까요.', '남의 기억이란 묘한 것입니다. 읽을수록 제 것처럼 따뜻해지지요.', '이 조각들, 아무 관계 없어 보여도 하나의 이야기가 됩니다.', '잊힌 이들을 기억하는 일이 이렇게 큰 힘이 될 줄이야…….', '모두 읽어 두십시오. 마지막에 분명 도움이 될 겁니다.'] },
    { who: 'seric', name: '세릭', role: '이야기 현황', go: 'status', open: () => true, lock: '',
      lines: ['쉴 수 있을 때 쉬어 둬라.', '등불 사람들이 네 이야기를 한다. 기억은 못 해도, 믿고 있다.', '엘라가 있었다면 뭐라고 했을까.', '……너는 혼자가 아니다. 그걸 잊지 마라.', '끝까지 같이 간다고 했지. 약속은 지킨다.'] },
  ],
  enter(keep) { this.t = 0; this.modal = null; if (!keep) this.sel = 2; Music.play('title'); },
  line(f) { return f.lines[Math.min(f.lines.length - 1, (reachedMap() / 2) | 0)]; },
  rect(i) { return { x: 70 + i * 290, y: 170, w: 270, h: 330 }; },
  back() { Sfx.play('select', 0.7); Game.state = 'smap'; StoryMap.enter(); },
  go(i) {
    const f = this.FOLK[i];
    if (!f.open()) { this.msg = 110; this.msgText = f.lock; Sfx.play('ui', 0.6, 0.5); return; }
    Sfx.play('select');
    if (f.go === 'shop') { Game.ret = 'camp'; Game.toShop(); }
    else if (f.go === 'tree') { Game.ret = 'camp'; Game.toTree(); }
    else if (f.go === 'album') Game.toAlbum('camp');
    else this.status();
  },
  // 세릭 : 지금까지의 길을 정리해 준다
  status() {
    const sd = Story.sd(), done = Story.clearedCount(), nxt = SMAIN.find(s => Story.unlocked(s) && !Story.cleared(s.id));
    const ends = ENDS.filter(e => sd.end[e.k]).length;
    const lines = [`지나온 길 ${done} / ${SMAIN.length}`, `기억 조각 ${Story.fragCount()} / 40`, `본 엔딩 ${ends} / 3`];
    lines.push(nxt ? `다음 목적지 : ${SMAPS[nxt.m].sub} · ${nxt.name}` : '모든 길을 걸었다.');
    this.modal = { title: '세릭', lines, t: 0 };
  },
  update() {
    this.t++; if (this.msg > 0) this.msg--;
    if (this.t < 10) { Input.clear(); return; }
    for (const q of Input.drain()) {
      if (this.modal) { if (['attack', 'confirm', 'jump', 'back', 'pause'].includes(q.a)) { this.modal = null; Sfx.play('ui', 0.6); } continue; }
      if (q.a === 'left') { this.sel = (this.sel + 3) % 4; Sfx.play('ui', 0.6, 0.95); }
      else if (q.a === 'right') { this.sel = (this.sel + 1) % 4; Sfx.play('ui', 0.6, 1.05); }
      else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') { this.go(this.sel); return; }
      else if (q.a === 'back' || q.a === 'pause') { this.back(); return; }
    }
  },
  backRect() { return { x: 24, y: 640, w: 200, h: 56 }; },
  pDown(x, y) {
    if (this.t < 10) return;
    if (this.modal) { this.modal = null; return; }
    if (inR(x, y, this.backRect())) { this.back(); return; }
    for (let i = 0; i < 4; i++) if (inR(x, y, this.rect(i))) { if (this.sel === i) this.go(i); else { this.sel = i; Sfx.play('ui', 0.6); } return; }
  },
  pMove() { },
  drawBg(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05060e'); g.addColorStop(0.6, '#10101c'); g.addColorStop(1, '#1a1210');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 별
    const rnd = mulberry(77);
    for (let i = 0; i < 70; i++) { const a = 0.25 + 0.3 * Math.sin(t * 0.03 + i); ctx.fillStyle = `rgba(255,245,220,${Math.max(0, a) * 0.6})`; ctx.fillRect(rnd() * W, rnd() * 300, 2, 2); }
    // 천막 실루엣
    ctx.fillStyle = '#07070d';
    for (const [x, s] of [[120, 1], [420, 1.25], [860, 1.1], [1130, 0.95]]) { ctx.beginPath(); ctx.moveTo(x - 110 * s, 600); ctx.lineTo(x, 600 - 150 * s); ctx.lineTo(x + 110 * s, 600); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#0b0908'; ctx.fillRect(0, 600, W, H - 600);
    // 등불
    for (const [x, y] of [[250, 520], [640, 560], [1010, 520]]) {
      const f = 0.8 + Math.sin(t * 0.09 + x) * 0.15;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, 170 * f, '255,190,100', 0.28); drawGlow(ctx, x, y, 40, '255,230,160', 0.6); ctx.restore();
      ctx.fillStyle = '#ffe4a0'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
    }
  },
  draw(ctx) {
    const t = this.t;
    this.drawBg(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 72);
    UI.text(ctx, '등불 야영지', 24, 38, { size: 30, italic: true, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '살아남은 자들의 쉼터', 200, 40, { size: 15, font: FONT_B, weight: 700, fill: '#c8b890', stroke: 3 });
    this.FOLK.forEach((f, i) => {
      const r = this.rect(i), on = i === this.sel, open = f.open();
      ctx.fillStyle = on ? 'rgba(48,36,16,0.92)' : 'rgba(12,12,20,0.86)'; roundRect(ctx, r.x, r.y, r.w, r.h, 16); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(200,190,160,0.3)'; ctx.lineWidth = on ? 3 : 1.4; ctx.stroke();
      ctx.globalAlpha = open ? 1 : 0.4; Por.draw(ctx, f.who, null, r.x + r.w / 2, r.y + 84, 62, false); ctx.globalAlpha = 1;
      UI.text(ctx, f.name, r.x + r.w / 2, r.y + 172, { size: 26, align: 'center', fill: '#fff4d8', stroke: 4 });
      UI.text(ctx, f.role, r.x + r.w / 2, r.y + 200, { size: 15, align: 'center', font: FONT_B, weight: 700, fill: open ? '#ffd890' : '#7a7a8a', stroke: 3 });
      const say = open ? this.line(f) : f.lock;
      Shop.wrap(ctx, say, r.w - 34, 15).slice(0, 5).forEach((ln, k) => UI.text(ctx, ln, r.x + r.w / 2, r.y + 236 + k * 22, { size: 15, align: 'center', font: FONT_B, weight: 700, fill: open ? '#dfe4f6' : '#6a6a7a', stroke: 3 }));
    });
    bigBtn(ctx, this.backRect(), '지도로', 'rgba(30,30,44,0.95)', '#6a6a80');
    if (this.msg > 0) UI.text(ctx, this.msgText, W / 2, 560, { size: 19, align: 'center', fill: '#ffb0a0', stroke: 4 });
    if (this.modal) this.drawModal(ctx);
  },
  drawModal(ctx) {
    const M = this.modal;
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(20,18,28,0.97)'; roundRect(ctx, W / 2 - 330, 200, 660, 320, 16); ctx.fill();
    ctx.strokeStyle = '#c9a55c'; ctx.lineWidth = 2; ctx.stroke();
    UI.text(ctx, M.title, W / 2, 248, { size: 30, align: 'center', fill: '#ffe9a6', stroke: 5 });
    M.lines.forEach((l, i) => UI.text(ctx, l, W / 2, 308 + i * 38, { size: 18, align: 'center', font: FONT_B, weight: 700, fill: '#e0e4f0', stroke: 3 }));
    UI.text(ctx, '아무 곳이나 누르면 닫힌다', W / 2, 494, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: '#8a8a9a', stroke: 2 });
  },
};

// ---------- 기억 앨범 ----------
const Album = {
  t: 0, m: 1, n: 0, from: 'smap',
  enter(from) {
    this.t = 0; this.from = from || 'smap';
    // 처음엔 가장 최근에 찾은 조각이 있는 곳
    this.m = 1; this.n = 0;
    for (let m = 8; m >= 1; m--) { const k = fragsOf(m).findIndex(id => Story.sd().frag[id]); if (k >= 0) { this.m = m; this.n = k; break; } }
  },
  cur() { return fragsOf(this.m)[this.n]; },
  back() { Sfx.play('select', 0.7); if (this.from === 'camp') { Game.state = 'camp'; Camp.enter(true); } else { Game.state = 'smap'; StoryMap.enter(); } },
  cell(m, n) { return { x: 250 + n * 96, y: 148 + (m - 1) * 62 }; },
  backRect() { return { x: 24, y: 640, w: 200, h: 56 }; },
  update() {
    this.t++;
    if (this.t < 10) { Input.clear(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'left') this.n = (this.n + 4) % 5;
      else if (q.a === 'right') this.n = (this.n + 1) % 5;
      else if (q.a === 'up') this.m = this.m <= 1 ? 8 : this.m - 1;
      else if (q.a === 'down') this.m = this.m >= 8 ? 1 : this.m + 1;
      else if (q.a === 'back' || q.a === 'pause' || q.a === 'attack' || q.a === 'confirm') { this.back(); return; }
      else continue;
      Sfx.play('ui', 0.6);
    }
  },
  pDown(x, y) {
    if (this.t < 10) return;
    if (inR(x, y, this.backRect())) { this.back(); return; }
    for (let m = 1; m <= 8; m++) for (let n = 0; n < 5; n++) { const c = this.cell(m, n); if (Math.hypot(x - c.x, y - c.y) < 32) { this.m = m; this.n = n; Sfx.play('ui', 0.6); return; } }
  },
  pMove() { },
  draw(ctx) {
    const t = this.t, sd = Story.sd();
    Camp.drawBg(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 72);
    UI.text(ctx, '기억의 앨범', 24, 38, { size: 30, italic: true, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '잊힌 사람들의 기억', 200, 40, { size: 15, font: FONT_B, weight: 700, fill: '#c8b890', stroke: 3 });
    const cnt = Story.fragCount();
    UI.text(ctx, `기억 조각  ${cnt} / 40`, W - 24, 38, { size: 20, align: 'right', fill: cnt >= 40 ? '#8affc0' : '#ffe0a0', stroke: 4 });
    // 격자
    for (let m = 1; m <= 8; m++) {
      const open = StoryMap.mapOpen(m), y = 148 + (m - 1) * 62;
      UI.text(ctx, open ? SMAPS[m].sub : '???', 40, y - 8, { size: 14, font: FONT_B, weight: 700, fill: open ? '#e8d6b0' : '#5a5a6a', stroke: 3 });
      UI.text(ctx, open ? SMAPS[m].name : '', 40, y + 10, { size: 12, font: FONT_B, weight: 700, fill: '#9a9cb0', stroke: 2 });
      fragsOf(m).forEach((id, n) => {
        const c = this.cell(m, n), got = sd.frag[id], on = m === this.m && n === this.n;
        if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, c.x, c.y, 46, '255,210,120', 0.4 + Math.sin(t * 0.1) * 0.1); ctx.restore(); }
        ctx.beginPath(); ctx.moveTo(c.x, c.y - 22); ctx.lineTo(c.x + 17, c.y); ctx.lineTo(c.x, c.y + 22); ctx.lineTo(c.x - 17, c.y); ctx.closePath();
        ctx.fillStyle = got ? '#ffe0a0' : 'rgba(40,34,30,0.9)'; ctx.fill();
        ctx.strokeStyle = on ? '#fff4c8' : got ? '#fff' : '#6a5a40'; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
        if (!got) UI.text(ctx, '?', c.x, c.y + 1, { size: 15, align: 'center', fill: '#6a5a40', stroke: 0 });
      });
    }
    // 읽는 곳
    const X = 790, Y = 96, Wd = 460, Ht = 380, id = this.cur(), fr = FRAGS[id], got = sd.frag[id];
    ctx.fillStyle = 'rgba(8,8,14,0.85)'; roundRect(ctx, X, Y, Wd, Ht, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,92,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    const stg = fr && SSTAGE[fr.stage];
    if (got && fr) {
      UI.text(ctx, fr.title, X + 26, Y + 44, { size: 26, fill: '#fff4d8', stroke: 4 });
      let y = Y + 100;
      for (const para of fr.text) for (const ln of Shop.wrap(ctx, para, Wd - 56, 16)) { UI.text(ctx, ln, X + 28, y, { size: 16, font: FONT_B, weight: 700, fill: '#dfe4f6', stroke: 3 }); y += 26; }
      if (stg) UI.text(ctx, `${SMAPS[stg.m].sub} · ${stg.id} ${stg.name}`, X + 26, Y + Ht - 26, { size: 13, font: FONT_B, weight: 700, fill: '#9a9cb0', stroke: 2 });
    } else {
      UI.text(ctx, '아직 찾지 못한 기억', X + 26, Y + 44, { size: 24, fill: '#8a8a9a', stroke: 4 });
      const hint = stg && StoryMap.mapOpen(stg.m) ? `${SMAPS[stg.m].sub} · ${stg.id} 「${stg.name}」 어딘가에 숨어 있다.` : '아직 길이 닿지 않은 곳에 있다.';
      Shop.wrap(ctx, hint, Wd - 56, 16).forEach((ln, i) => UI.text(ctx, ln, X + 28, Y + 100 + i * 26, { size: 16, font: FONT_B, weight: 700, fill: '#7a7a8a', stroke: 3 }));
    }
    // 엔딩 기록
    UI.text(ctx, '본 엔딩', X, 504, { size: 16, font: FONT_B, weight: 700, fill: '#c8b890', stroke: 3 });
    ENDS.forEach((e, i) => {
      const x = X + i * 156, seen = sd.end[e.k];
      ctx.fillStyle = seen ? 'rgba(60,44,14,0.92)' : 'rgba(14,14,22,0.85)'; roundRect(ctx, x, 518, 146, 96, 10); ctx.fill();
      ctx.strokeStyle = seen ? '#ffd24a' : 'rgba(200,190,160,0.25)'; ctx.lineWidth = seen ? 2 : 1.2; ctx.stroke();
      UI.text(ctx, seen ? (e.k === 'T' ? '진엔딩' : '엔딩 ' + e.k) : '???', x + 73, 540, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: seen ? '#ffe0a0' : '#5a5a6a', stroke: 2 });
      UI.text(ctx, seen ? e.title : '', x + 73, 570, { size: 19, align: 'center', fill: '#fff4d8', stroke: 3 });
      if (!seen) Shop.wrap(ctx, e.hint, 126, 11).slice(0, 3).forEach((ln, k) => UI.text(ctx, ln, x + 73, 562 + k * 14, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: '#5a5a6a', stroke: 2 }));
    });
    // 한 줄 소개 (본 엔딩 중 마지막으로 고른 것이 아니라 가장 최근에 본 순서와 무관하게 첫 번째로 본 것)
    const first = ENDS.find(e => sd.end[e.k]);
    if (first) Shop.wrap(ctx, first.sum, Wd, 13).slice(0, 2).forEach((ln, k) => UI.text(ctx, ln, X, 632 + k * 18, { size: 13, font: FONT_B, weight: 700, fill: '#9a9cb0', stroke: 2 }));
    if (cnt >= 40) UI.text(ctx, '모든 조각을 모았다. 마지막 선택에서 이름을 불러 볼 수 있을 것 같다.', 250, 660, { size: 14, font: FONT_B, weight: 700, fill: '#8affc0', stroke: 3 });
    bigBtn(ctx, this.backRect(), '돌아가기', 'rgba(30,30,44,0.95)', '#6a6a80');
  },
};
