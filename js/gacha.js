'use strict';
// ============================================================
//  성화(聖火) · 소환
//   - 새 재화 「성화」: 전투 · 업적 · 도감 보상으로 조금씩 모은다
//   - 소환 : 1회 160 / 10회 1,600 · 천장 80회 (한정 검 확정) · 10회에는 SR 이상 1개 보장
//   - 한정 검(js/gacha_sword.js)은 소환으로만 얻는다. 같은 검이 또 나오면 돌파(최대 5)
//   - 저장 : Save.data.gc = { sh 성화, pity 천장, pulls 총 소환, brk {검id: 돌파} }
// ============================================================
const GACHA = {
  COST1: 160, COST10: 1600, PITY: 80, SOFT: 60, MAXBRK: 5, DUP_REFUND: 80,
  BANNER: 'wL1',
  RATE: { UR: 0.016, SR: 0.10, R: 0.30 },                          // 나머지는 N
  COL: { UR: '255,214,120', SR: '190,130,255', R: '110,190,255', N: '170,182,204' },
  NAME: { UR: 'UR', SR: 'SR', R: 'R', N: 'N' },
  PRIZE: { SR: { gold: 50000, t: '황금 주머니 (대)' }, R: { gold: 15000, t: '황금 주머니' }, N: { gold: 4000, t: '금화 꾸러미' } },
};

const Gacha = {
  d() { const s = Save.data; return s.gc || (s.gc = { sh: 0, pity: 0, pulls: 0, brk: {} }); },
  sh() { return this.d().sh | 0; },
  brk(id) { return (this.d().brk || {})[id] | 0; },
  owned(id) { return Gear.owns('w', id); },
  // 성화 획득 (알림은 quiet 가 아닐 때만)
  earn(n, why, quiet) {
    n = Math.round(n); if (n <= 0 || !Save.data) return;
    this.d().sh += n; Save.save();
    if (!quiet && Game.notice) Game.notice(`성화 +${n}${why ? `  (${why})` : ''}`);
  },
  // 한 번 뽑는다 (천장 · 확률)
  roll1() {
    const d = this.d(), p = d.pity;
    let ur = GACHA.RATE.UR + (p >= GACHA.SOFT ? (p - GACHA.SOFT + 1) * 0.04 : 0);
    if (p >= GACHA.PITY - 1) ur = 1;
    const x = Math.random();
    let r = 'N';
    if (x < ur) r = 'UR'; else if (x < ur + GACHA.RATE.SR) r = 'SR'; else if (x < ur + GACHA.RATE.SR + GACHA.RATE.R) r = 'R';
    d.pity = r === 'UR' ? 0 : p + 1; d.pulls++;
    return r;
  },
  // n 회 소환 : 결과 목록을 돌려준다. 성화가 모자라면 null
  pull(n) {
    const cost = n === 10 ? GACHA.COST10 : GACHA.COST1 * n, d = this.d();
    if (d.sh < cost) return null;
    d.sh -= cost;
    const rs = [];
    for (let i = 0; i < n; i++) rs.push(this.roll1());
    if (n >= 10 && !rs.some(r => r === 'UR' || r === 'SR')) rs[rs.length - 1] = 'SR';        // 10회 : SR 이상 보장
    const out = rs.map(r => this.apply(r));
    Save.save();
    return out;
  },
  apply(r) {
    const d = this.d(), id = GACHA.BANNER, W = WEAPON_BY_ID[id];
    if (r === 'UR') {
      if (!this.owned(id)) {
        Save.data.owned = Save.data.owned || { w: ['w0'], a: ['a0'] }; Save.data.owned.w.push(id); d.brk[id] = 0;
        return { r, id, name: W.name, kind: 'new' };
      }
      if (this.brk(id) < GACHA.MAXBRK) { d.brk[id] = this.brk(id) + 1; return { r, id, name: W.name, kind: 'brk', n: d.brk[id] }; }
      d.sh += GACHA.DUP_REFUND; return { r, id, name: W.name, kind: 'max', sh: GACHA.DUP_REFUND };
    }
    const P = GACHA.PRIZE[r]; Save.data.gold = (Save.data.gold || 0) + P.gold;
    return { r, kind: 'gold', name: P.t, gold: P.gold };
  },
};

// 돌파 보너스 : 한정 검을 들면 공격력 +6% · 치명타율 +1% (돌파 1회마다)
{
  const _sg = Player.prototype.setGear;
  Player.prototype.setGear = function (w, a) {
    _sg.call(this, w, a);
    const W = this.wdef, b = W && W.gacha ? Gacha.brk(W.id) : 0;
    if (b > 0) { this.atk = this.baseAtk = Math.round(this.atk * (1 + 0.06 * b)); this.critRate += 0.01 * b; }
  };
}

// ---------- 성화 얻는 곳 ----------
// 던전 클리어 : 처음 +8, 이후 +2
{
  const _rec = Save.record;
  Save.record = function (id, rank, score, gold) {
    const first = !(this.data.cleared && this.data.cleared[id]);
    const r = _rec.call(this, id, rank, score, gold);
    Gacha.earn(first ? 8 : 2, first ? '던전 첫 클리어' : '던전 클리어');
    return r;
  };
}
// 도감 첫 등록 +2 (보스 +4) · 보스 처치 +1
{
  const _dk = Dex.kill;
  Dex.kill = function (e) {
    if (!this.monsters) this.init();
    const first = !Save.data.dex[this.keyOf(e)];
    _dk.call(this, e);
    const n = (first ? (e.isBoss ? 4 : 2) : 0) + (e.isBoss ? 1 : 0);
    if (n) Gacha.earn(n, first ? '도감 등록' : '보스 처치');
  };
}
// 업적 보상 : 골드 15,000 당 성화 1 (1~60)
{
  const _ac = Ach.claim;
  Ach.claim = function (a) {
    const ok = _ac.call(this, a);
    if (ok) Gacha.earn(clamp(Math.round(a.gold / 15000), 1, 60), '업적', true);
    return ok;
  };
}

// ============================================================
//  소환 화면
// ============================================================
// 한정 검 키아트 (img/gacha/sunflame.webp) — 불러오지 못하면 코드로 그린 검을 쓴다
const GACHA_ART = { ok: false, img: new Image() };
GACHA_ART.img.onload = () => {                                      // 검이 있는 띠만 잘라 어두운 배경을 투명하게 만든다
  try {
    const sw = 768, sh = 580, c = document.createElement('canvas'); c.width = sw; c.height = sh;
    const g = c.getContext('2d'); g.drawImage(GACHA_ART.img, 0, 360, sw, sh, 0, 0, sw, sh);
    const d = g.getImageData(0, 0, sw, sh), p = d.data;
    for (let i = 0; i < p.length; i += 4) { const m = Math.max(p[i], p[i + 1], p[i + 2]); p[i + 3] = Math.max(0, Math.min(255, (m - 46) * 5)); }
    g.putImageData(d, 0, 0); GACHA_ART.cv = c;
  } catch (e) { GACHA_ART.cv = null; }
  GACHA_ART.ok = true;
};
GACHA_ART.img.src = './img/gacha/sunflame.webp';

const GachaUI = {
  t: 0, pp: null, sel: 1, msg: '', msgT: 0, res: null, rt: 0, cs: 100, best: 'N',
  backRect() { return { x: W - 220, y: 54, w: 180, h: 34 }; },
  btn(i) { return { x: 700 + i * 270, y: 604, w: 250, h: 70 }; },
  okRect() { return { x: W / 2 - 110, y: 640, w: 220, h: 48 }; },

  enter() {
    this.t = 0; this.res = null; this.msgT = 0;
    if (!this.pp) this.pp = new Player();
    const pp = this.pp;
    pp.scale = 2.5; pp.x = pp.px = 360; pp.y = 560 - GROUND_Y; pp.z = 0; pp.facing = 1; pp.visible = true; pp.state = 'ground';
    pp.setGear(WEAPON_BY_ID[GACHA.BANNER], ARMORS[0]); pp.bladeGlow = 1.2;
    pp.trail.length = 0; pp.after.length = 0; pp.play('idle', 0, 1, true);
    Music.play('title');
  },
  leave() { Save.save(); Sfx.play('select', 0.7); Game.toLobby(); },
  flash(t, c) { this.msg = t; this.msgCol = c || '#fff'; this.msgT = 120; },

  doPull(n) {
    if (this.res) return;
    const out = Gacha.pull(n);
    if (!out) { Sfx.play('ui', 0.5, 0.6); this.flash(`성화가 부족합니다 (${fmt(n === 10 ? GACHA.COST10 : GACHA.COST1 * n)} 필요)`, '#ff8a70'); return; }
    this.res = out; this.rt = 0;
    this.best = out.some(o => o.r === 'UR') ? 'UR' : out.some(o => o.r === 'SR') ? 'SR' : out.some(o => o.r === 'R') ? 'R' : 'N';
    this.cs = this.best === 'UR' ? 270 : 100;
  },

  update() {
    this.t++; if (this.msgT > 0) this.msgT--;
    const pp = this.pp;
    if (pp) { pp.px = pp.x; pp.stepAnim(); pp.updateChains(); pp.bladeGlow = 1 + Math.sin(this.t * 0.05) * 0.4; }
    if (this.res) {
      this.rt++;
      const rt = this.rt, cs = this.cs, ur = this.best === 'UR';
      if (rt === 2) Sfx.play('flash', 0.5, 0.7);
      if (rt === 50) Sfx.play('ring', 0.5, ur ? 0.8 : 1.1);
      if (ur && rt === 90) { Sfx.play('explode', 0.9, 0.8); Sfx.play('flash', 0.8, 0.6); }
      if (ur && rt === 104) Sfx.play('roar', 0.5, 1.5);
      if (ur && rt === 172) { Sfx.play('clear', 1, 0.9); Sfx.play('explode', 0.7, 1); }
      if (rt === cs) Sfx.play(ur ? 'coin' : 'select', ur ? 1 : 0.6, ur ? 1.2 : 1.3);
      if (rt > cs && (rt - cs) % 5 === 0 && (rt - cs) / 5 <= this.res.length) { const o = this.res[(rt - cs) / 5 - 1]; if (o) Sfx.play(o.r === 'UR' ? 'coin' : 'ui', o.r === 'UR' ? 1 : 0.5, o.r === 'N' ? 0.9 : 1.4); }
      const done = rt > cs + 10;
      let go = Input.take('pause') || Input.take('back');
      for (const q of Input.drain()) if (q.a === 'confirm' || q.a === 'attack' || q.a === 'jump') go = true;
      if (go) { if (done) this.res = null; else if (rt > 20 && rt < cs) this.rt = cs - 1; }
      return;
    }
    if (Input.take('pause')) { this.leave(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'left') { this.sel = 0; Sfx.play('ui', 0.5, 1.1); }
      else if (q.a === 'right') { this.sel = 1; Sfx.play('ui', 0.5, 1.1); }
      else if (q.a === 'confirm' || q.a === 'attack') this.doPull(this.sel ? 10 : 1);
      else if (q.a === 'gacha' || q.a === 'back') { this.leave(); return; }
    }
  },

  pDown(x, y) {
    if (this.res) { if (this.rt > this.cs + 10) this.res = null; else if (this.rt > 20 && this.rt < this.cs) this.rt = this.cs - 1; return; }
    if (inR(x, y, this.backRect())) { this.leave(); return; }
    for (let i = 0; i < 2; i++) if (inR(x, y, this.btn(i))) { this.sel = i; this.doPull(i ? 10 : 1); return; }
  },
  pMove() { }, pUp() { }, wheel() { },

  draw(ctx) {
    const t = this.t, G = Gacha.d(), W_ = WEAPON_BY_ID[GACHA.BANNER], col = W_.col;
    // 배경 : 새벽빛
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120a18'); bg.addColorStop(0.55, '#3a1e24'); bg.addColorStop(1, '#0c0810');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cx = 380, cy = 330;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU + t * 0.004, L = 700, g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      g.addColorStop(0, `rgba(${col},0.22)`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - 0.06) * L, cy + Math.sin(a - 0.06) * L); ctx.lineTo(cx + Math.cos(a + 0.06) * L, cy + Math.sin(a + 0.06) * L); ctx.fill();
    }
    const gg = ctx.createRadialGradient(cx, cy, 20, cx, cy, 340); gg.addColorStop(0, `rgba(${col},0.35)`); gg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, 340, 0, TAU); ctx.fill();
    for (let i = 0; i < 26; i++) { const k = (t * 0.6 + i * 53) % 400, x = (i * 97) % 760 + 20, y = 640 - k * 1.5; ctx.fillStyle = `rgba(${i % 2 ? col : '255,246,214'},${0.5 * (1 - k / 400)})`; ctx.beginPath(); ctx.arc(x + Math.sin(t * 0.02 + i) * 14, y, 2 + (i % 3), 0, TAU); ctx.fill(); }
    ctx.restore();
    // 배너 : 한정 검 키아트 (둥실 떠 있다). 이미지를 못 불러오면 검 든 주인공
    if (GACHA_ART.ok) {
      const bob = Math.sin(t * 0.04) * 8;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 380, 440 + bob, 300, col, 0.28 + Math.sin(t * 0.05) * 0.05); ctx.restore();
      this.drawArt(ctx, 380, 440 + bob, 640, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(380, 690, 150 - bob * 2, 14, 0, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(360, 568, 130, 24, 0, 0, TAU); ctx.fill();
      this.pp.draw(ctx);
    }

    // 제목 · 재화
    UI.text(ctx, '소  환', 40, 48, { size: 32, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '한정 검은 소환으로만 얻을 수 있습니다', 40, 76, { size: 14, font: FONT_B, weight: 700, fill: '#c9b48c' });
    const br = this.backRect();
    ctx.fillStyle = 'rgba(30,24,14,0.9)'; roundRect(ctx, br.x, br.y, br.w, br.h, 8); ctx.fill(); ctx.strokeStyle = '#c9a55c'; ctx.lineWidth = 2; ctx.stroke();
    UI.text(ctx, Touch.on ? '돌아가기' : `돌아가기 [Esc]`, br.x + br.w / 2, br.y + 23, { size: 15, align: 'center', fill: '#ffe9a6', stroke: 3 });
    this.drawShard(ctx, W - 40, 112, G.sh);

    // 배너 설명
    UI.text(ctx, '한 정  소 환', 360, 128, { size: 17, align: 'center', fill: '#fff1c0', stroke: 4 });
    UI.text(ctx, W_.name, 360, 172, { size: 40, align: 'center', fill: '#fffbe8', stroke: 7, italic: true });
    UI.text(ctx, W_.sub, 360, 198, { size: 15, font: FONT_B, weight: 700, align: 'center', fill: `rgb(${col})`, stroke: 4 });

    // 오른쪽 : 정보 패널
    const px = 700, py = 140, pw = 540;
    ctx.fillStyle = 'rgba(12,10,18,0.72)'; roundRect(ctx, px, py, pw, 440, 14); ctx.fill(); ctx.strokeStyle = 'rgba(201,165,92,0.5)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, '성화검: 여명', px + 24, py + 36, { size: 22, fill: '#ffe9a6', stroke: 4 });
    const own = Gacha.owned(GACHA.BANNER), b = Gacha.brk(GACHA.BANNER);
    UI.text(ctx, own ? `보유 중  ·  돌파 ${b} / ${GACHA.MAXBRK}` : '미보유', px + pw - 24, py + 36, { size: 15, align: 'right', fill: own ? '#7dffa0' : '#9aa4c0', stroke: 3 });
    for (let i = 0; i < GACHA.MAXBRK; i++) { ctx.fillStyle = i < b ? '#ffd24a' : 'rgba(255,255,255,0.16)'; gcStar(ctx, px + pw - 40 - (GACHA.MAXBRK - 1 - i) * 24, py + 58, 8); }
    const lines = [['능력', '공격력 x2.4 (일반 검 최고 x1.62) · 치명 피해 x2.2 · 이동 +10%'], ['G  성화 낙하', '불기둥 다섯 줄기 + 거대한 마지막 기둥'], ['R  일출', '화면 전체 심판 · 성화 강림 15초 (날개 · 피해 +40%)'], ['패시브', '5번째 적중마다 성화 폭발 · 치명타 번개 · 처치 시 회복']];
    lines.forEach(([a, c], i) => { UI.text(ctx, a, px + 24, py + 92 + i * 22, { size: 15, fill: '#ffd890', stroke: 3 }); UI.text(ctx, c, px + 140, py + 92 + i * 22, { size: 14, font: FONT_B, weight: 700, fill: '#dfe4f6', stroke: 3 }); });
    UI.text(ctx, `돌파 : 같은 검이 또 나오면 돌파 — 공격력 +6% · 치명타율 +1% (최대 ${GACHA.MAXBRK}회)`, px + 24, py + 190, { size: 13, font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 });
    // 확률
    UI.text(ctx, '확률', px + 24, py + 226, { size: 16, fill: '#ffe9a6', stroke: 3 });
    [['UR', '한정 검 · 돌파', GACHA.RATE.UR], ['SR', '황금 주머니 (대)  50,000 G', GACHA.RATE.SR], ['R', '황금 주머니  15,000 G', GACHA.RATE.R], ['N', '금화 꾸러미  4,000 G', 1 - GACHA.RATE.UR - GACHA.RATE.SR - GACHA.RATE.R]].forEach(([r, nm, p], i) => {
      const y = py + 256 + i * 26;
      UI.text(ctx, r, px + 24, y, { size: 15, fill: `rgb(${GACHA.COL[r]})`, stroke: 3 });
      UI.text(ctx, nm, px + 70, y, { size: 14, font: FONT_B, weight: 700, fill: '#dfe4f6', stroke: 3 });
      UI.text(ctx, (p * 100).toFixed(1) + '%', px + pw - 24, y, { size: 14, font: FONT_B, weight: 700, align: 'right', fill: '#dfe4f6', stroke: 3 });
    });
    UI.text(ctx, `${GACHA.SOFT}회부터 확률 상승 · ${GACHA.PITY}회째에 UR 확정 · 10회 소환은 SR 이상 1개 보장`, px + 24, py + 372, { size: 12, font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 });
    // 천장
    const u = G.pity / GACHA.PITY;
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, px + 24, py + 392, pw - 48, 10, 5); ctx.fill();
    ctx.fillStyle = `rgb(${col})`; roundRect(ctx, px + 24, py + 392, Math.max(10, (pw - 48) * u), 10, 5); ctx.fill();
    UI.text(ctx, `천장까지 ${GACHA.PITY - G.pity}회  (${G.pity} / ${GACHA.PITY})`, px + 24, py + 426, { size: 14, fill: '#ffe9a6', stroke: 3 });
    UI.text(ctx, `누적 소환 ${fmt(G.pulls)}회`, px + pw - 24, py + 426, { size: 13, font: FONT_B, weight: 700, align: 'right', fill: '#9aa4c0', stroke: 3 });
    // 버튼
    for (let i = 0; i < 2; i++) {
      const r = this.btn(i), cost = i ? GACHA.COST10 : GACHA.COST1, can = G.sh >= cost, on = this.sel === i;
      ctx.fillStyle = can ? 'rgba(60,40,10,0.95)' : 'rgba(30,26,30,0.9)'; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
      ctx.strokeStyle = can ? (on ? '#fff1a0' : '#c9a55c') : 'rgba(150,160,190,0.4)'; ctx.lineWidth = on ? 3 : 2; ctx.stroke();
      UI.text(ctx, i ? '10회 소환' : '1회 소환', r.x + r.w / 2, r.y + 30, { size: 22, align: 'center', fill: can ? '#fff1c0' : '#7a7a8a', stroke: 4 });
      this.drawShard(ctx, r.x + r.w / 2 + 34, r.y + 58, cost, true, can);
    }
    if (!Touch.on) UI.text(ctx, '← → 고르기 · Enter 소환', px + pw / 2, 702, { size: 13, font: FONT_B, weight: 700, align: 'center', fill: '#8a8a9a', stroke: 3 });
    if (this.msgT > 0) UI.text(ctx, this.msg, W / 2, 590, { size: 20, align: 'center', fill: this.msgCol, stroke: 5 });
    if (this.res) this.drawResult(ctx);
  },
  // 성화 아이콘 + 수량
  drawShard(ctx, x, y, n, center, can = true) {
    const s = fmt(n), w = (s.length * 11 + 22), x0 = center ? x - w : x - w;
    ctx.save(); ctx.translate(x0 + 8, y - 6); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 14); g.addColorStop(0, 'rgba(255,246,214,0.9)'); g.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = can ? '#ffd870' : '#7a7a8a'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(7, -2, 5, 5); ctx.quadraticCurveTo(0, 10, -5, 5); ctx.quadraticCurveTo(-7, -2, 0, -9); ctx.fill();
    ctx.restore();
    UI.text(ctx, s, x0 + 22, y, { size: 18, fill: can ? '#ffe9a6' : '#8a8a9a', stroke: 4 });
  },

  // 키아트 그리기 : 검이 있는 가운데 띠만 잘라 w 너비로 그린다. 어두운 배경은 screen 합성으로 녹인다
  drawArt(ctx, cx, cy, w, a = 1, rot = 0) {
    if (!GACHA_ART.ok) return false;
    const sh = 580, sw = 768, h = w * sh / sw;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.rotate(rot);
    if (GACHA_ART.cv) ctx.drawImage(GACHA_ART.cv, -w / 2, -h / 2, w, h);
    else { ctx.globalCompositeOperation = 'screen'; ctx.drawImage(GACHA_ART.img, 0, 360, sw, sh, -w / 2, -h / 2, w, h); }
    ctx.restore(); return true;
  },
  // 한정 검 그리기 (상점 자세히 보기와 같은 방식)
  drawSword(ctx, cx, cy, sc, ang, t, a = 1) {
    const it = WEAPON_BY_ID[GACHA.BANNER], Lk = it.look, len = RIG_PLAYER.wlen * (Lk.L || 1);
    const ent = { wlook: Lk, bladeGlow: 1.4 + Math.sin(t * 0.1) * 0.4, id: 3 };
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.rotate(ang); ctx.scale(sc, sc); ctx.translate(-(len - 16) / 2, 0);
    drawPlayerBlade(ctx, { hand1: { x: 0, y: 0 }, wAng: 90 }, RIG_PLAYER.pal, ent, {});
    const u = (t % 70) / 70; ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, u * len, 0, 14, '255,255,255', 0.95 * Math.sin(u * Math.PI));
    ctx.restore();
  },
  // 소환 연출 : 모으기 → (UR) 폭발 · 검 강림 → 카드
  drawCine(ctx) {
    const rt = this.rt, best = this.best, ur = best === 'UR', col = GACHA.COL[best], cs = this.cs;
    const H1 = i => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
    const A = Math.min(1, rt / 90), cx = W / 2, cy = 350;
    ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    const shk = rt < 90 ? A * (ur ? 4 : 2) : (ur && rt < 120 ? (120 - rt) / 5 : 0);
    if (shk) ctx.translate(rand(-shk, shk), rand(-shk, shk));
    ctx.globalCompositeOperation = 'lighter';
    // 바닥에서 솟는 빛기둥
    { const w = 40 + A * 90, g = ctx.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},${0.12 + A * 0.4})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(cx - w, 0, w * 2, H); }
    // 마법진 (바닥)
    ctx.save(); ctx.translate(cx, 560); ctx.scale(1, 0.3);
    const n = ur ? 3 : best === 'SR' ? 2 : 1;
    for (let k = 0; k <= n; k++) {
      const r = (150 + k * 70) * (0.4 + A * 0.6), dir = k % 2 ? -1 : 1;
      ctx.strokeStyle = `rgba(${k ? col : '255,246,214'},${(0.5 + 0.4 * A) * (1 - k * 0.15)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2; for (let i = 0; i < 24 + k * 6; i++) { const a = i / (24 + k * 6) * TAU + rt * 0.02 * dir; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + 14 + (i % 3) * 5), Math.sin(a) * (r + 14 + (i % 3) * 5)); ctx.stroke(); }
    }
    ctx.rotate(rt * 0.02); ctx.strokeStyle = `rgba(255,246,214,${0.6 * A})`; ctx.lineWidth = 3;
    for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + k * Math.PI / 6; ctx.lineTo(Math.cos(a) * 130 * A, Math.sin(a) * 130 * A); } ctx.closePath(); ctx.stroke(); }
    ctx.restore();
    // 안으로 모여드는 빛줄기
    for (let i = 0; i < 70; i++) {
      const ph = ((rt * (0.012 + H1(i) * 0.012) + H1(i + 50)) % 1), d = (1 - ph) * (260 + H1(i + 9) * 420), a = H1(i + 3) * TAU + rt * 0.004;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7, al = Math.min(1, ph * 3) * (rt < 90 ? 1 : Math.max(0, 1 - (rt - 90) / 12));
      if (al <= 0) continue;
      ctx.strokeStyle = `rgba(${i % 3 ? col : '255,246,214'},${al * 0.8})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx + Math.cos(a) * (d - 24), cy + Math.sin(a) * (d - 24) * 0.7); ctx.stroke();
    }
    // 중앙 구체
    if (rt < 92) {
      const R = 26 + A * A * 110 + Math.sin(rt * 0.4) * 4, g = ctx.createRadialGradient(cx, cy, 2, cx, cy, R * 2.2);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, `rgba(${col},${0.7 * A + 0.2})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.35, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (!ur || rt < 90) {
      if (rt > 20 && rt < 90) UI.text(ctx, '성화가 모이고 있다…', cx, 690, { size: 16, align: 'center', fill: `rgba(${col},${0.5 + Math.sin(rt * 0.2) * 0.3})`, stroke: 3 });
      return;
    }
    // ---- UR : 폭발 → 검 강림 ----
    const t = rt - 90, fl = t < 10 ? 1 - t / 10 : 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 28; i++) {                                                  // 회전하는 태양 빛살
      const a = i / 28 * TAU + t * 0.006 * (i % 2 ? 1 : -1), L = 1100, e = E.out3(Math.min(1, t / 30)), w = 0.035 + (i % 3) * 0.018;
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L); g.addColorStop(0, `rgba(255,236,170,${0.45 * e})`); g.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - w) * L, cy + Math.sin(a - w) * L); ctx.lineTo(cx + Math.cos(a + w) * L, cy + Math.sin(a + w) * L); ctx.fill();
    }
    for (const [d0, c0, w0] of [[0, '255,246,214', 14], [12, '255,200,100', 9], [26, '255,150,60', 6]]) {   // 퍼지는 충격 고리
      const u = (t - d0) / 60; if (u < 0 || u > 1) continue;
      const rr = 40 + E.out3(u) * 900;
      ctx.strokeStyle = `rgba(${c0},${1 - u})`; ctx.lineWidth = w0 * (1 - u) + 2; ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.8, 0, 0, TAU); ctx.stroke();
    }
    const gl = ctx.createRadialGradient(cx, cy, 10, cx, cy, 420); gl.addColorStop(0, 'rgba(255,240,190,0.55)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 420, 0, TAU); ctx.fill();
    for (let i = 0; i < 60; i++) {                                                  // 아래에서 솟는 불씨
      const sp = 1.5 + H1(i) * 3, y = ((t * sp + H1(i + 7) * 900) % 900) - 100, x = H1(i + 2) * W + Math.sin(t * 0.03 + i) * 20;
      ctx.fillStyle = `rgba(${i % 2 ? '255,214,120' : '255,246,214'},${0.3 + H1(i + 5) * 0.6})`; ctx.beginPath(); ctx.arc(x, 740 - y, 1.5 + H1(i + 4) * 3, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 검 강림 : 위에서 돌며 내려와 중앙에 멈춘다
    const u = clamp((t - 14) / 56, 0, 1), e = E.out3(u), sy0 = -260, sy1 = cy - 10 + Math.sin(rt * 0.05) * 7;
    const ang = -Math.PI / 2 + (1 - e) * TAU * 2.2, sc = 2.3 + (1 - e) * 1.0;
    if (t > 14) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, cx, lerp(sy0, sy1, e), 230, '255,214,120', 0.5 * Math.min(1, e + 0.3)); ctx.restore();
      if (GACHA_ART.ok) this.drawArt(ctx, cx, lerp(sy0, sy1, e) + 10, 640 + (1 - e) * 260, Math.min(1, (t - 14) / 10), (1 - e) * 0.6 - 0.05);
      else this.drawSword(ctx, cx, lerp(sy0, sy1, e), sc, ang, rt, Math.min(1, (t - 14) / 10));
    }
    // 검이 멈추는 순간 : 두 번째 섬광 + 베기 고리
    if (rt >= 168 && rt < 176) { ctx.fillStyle = `rgba(255,250,235,${(1 - Math.abs(rt - 172) / 4) * 0.7})`; ctx.fillRect(0, 0, W, H); }
    if (rt >= 170) {
      const q = (rt - 170) / 40; if (q < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,236,170,${1 - q})`; ctx.lineWidth = 10 * (1 - q) + 2; ctx.beginPath(); ctx.arc(cx, cy, 60 + q * 420, -0.9, 0.9 + Math.PI * 0.9); ctx.stroke(); ctx.restore(); }
      const nm = '성화검: 여명', k = Math.min(nm.length, Math.floor((rt - 170) / 4));
      UI.text(ctx, 'UR', cx, 122, { size: 70, align: 'center', fill: '#ffd870', stroke: 9, italic: true });
      UI.text(ctx, nm.slice(0, k), cx, 592, { size: 54, align: 'center', fill: '#fffbe8', stroke: 8, italic: true });
      if (rt > 200) UI.text(ctx, '밤의 끝에서 타오르는 성스러운 불', cx, 630, { size: 17, font: FONT_B, weight: 700, align: 'center', fill: `rgba(255,214,120,${Math.min(1, (rt - 200) / 20)})`, stroke: 4 });
    }
    if (fl > 0) { ctx.fillStyle = `rgba(255,252,240,${fl})`; ctx.fillRect(0, 0, W, H); }
    const vg = ctx.createRadialGradient(cx, cy, 300, cx, cy, 760); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    if (rt > 30 && rt < cs - 20) UI.text(ctx, Touch.on ? '터치하면 건너뜀' : 'Enter : 건너뛰기', W - 30, 700, { size: 12, align: 'right', font: FONT_B, weight: 700, fill: 'rgba(255,255,255,0.35)', stroke: 2 });
  },

  drawResult(ctx) {
    const rt = this.rt, res = this.res, best = this.best, col = GACHA.COL[best], cs = this.cs;
    if (rt < cs) { this.drawCine(ctx); return; }
    const q = rt - cs;
    ctx.fillStyle = `rgba(6,4,10,${Math.min(0.94, 0.5 + q / 12)})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cx = W / 2, cy = 360, R = best === 'UR' ? 520 : 360;
    const n = best === 'UR' ? 22 : 14;
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rt * 0.01, g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * R * 1.6, cy + Math.sin(a) * R * 1.6); g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - 0.05) * R * 1.6, cy + Math.sin(a - 0.05) * R * 1.6); ctx.lineTo(cx + Math.cos(a + 0.05) * R * 1.6, cy + Math.sin(a + 0.05) * R * 1.6); ctx.fill(); }
    const gg = ctx.createRadialGradient(cx, cy, 10, cx, cy, R); gg.addColorStop(0, 'rgba(255,250,235,0.3)'); gg.addColorStop(0.3, `rgba(${col},0.4)`); gg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.restore();
    if (q < 10) { ctx.fillStyle = `rgba(255,250,235,${(1 - q / 10) * 0.8})`; ctx.fillRect(0, 0, W, H); }
    const k = Math.min(res.length, Math.floor(q / 5));
    const cols = res.length > 5 ? 5 : res.length, rows = Math.ceil(res.length / cols), cw = res.length === 1 ? 300 : 200, ch = res.length === 1 ? 380 : 232, gap = 18;
    const x0 = W / 2 - (cols * cw + (cols - 1) * gap) / 2, y0 = 360 - (rows * ch + (rows - 1) * gap) / 2 - 20;
    for (let i = 0; i < k; i++) {
      const o = res[i], c = GACHA.COL[o.r], col_ = i % cols, row = Math.floor(i / cols), age = Math.min(1, (q - i * 5) / 10);
      const x = x0 + col_ * (cw + gap), y = y0 + row * (ch + gap) + (1 - E.out3(age)) * 30;
      ctx.save(); ctx.globalAlpha = age;
      const g = ctx.createLinearGradient(x, y, x, y + ch); g.addColorStop(0, `rgba(${c},0.38)`); g.addColorStop(1, 'rgba(14,10,20,0.95)');
      ctx.fillStyle = g; roundRect(ctx, x, y, cw, ch, 14); ctx.fill(); ctx.strokeStyle = `rgb(${c})`; ctx.lineWidth = o.r === 'UR' ? 4 : 2; ctx.stroke();
      if (o.r === 'UR') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(x + cw / 2, y + ch * 0.4, 6, x + cw / 2, y + ch * 0.4, cw * 0.8); gl.addColorStop(0, `rgba(${c},0.5)`); gl.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gl; ctx.fillRect(x, y, cw, ch); ctx.restore(); }
      UI.text(ctx, GACHA.NAME[o.r], x + cw / 2, y + (res.length === 1 ? 58 : 36), { size: res.length === 1 ? 44 : 28, align: 'center', fill: `rgb(${c})`, stroke: 5, italic: true });
      const m = res.length === 1 ? 1.6 : 1;
      if (o.kind === 'gold') {
        ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(x + cw / 2, y + ch * 0.46, 20 * m, 0, TAU); ctx.fill(); ctx.fillStyle = '#b5821a'; ctx.beginPath(); ctx.arc(x + cw / 2, y + ch * 0.46, 13 * m, 0, TAU); ctx.fill();
        UI.text(ctx, o.name, x + cw / 2, y + ch * 0.7, { size: 15 * m, align: 'center', fill: '#fff', stroke: 4 });
        UI.text(ctx, `+${fmt(o.gold)} G`, x + cw / 2, y + ch * 0.82, { size: 15 * m, font: FONT_B, weight: 800, align: 'center', fill: '#ffe9a6', stroke: 4 });
      } else {
        const art = this.drawArt(ctx, x + cw / 2, y + ch * 0.4, cw * 0.92, 1), ny = art ? 0.64 : 0.5, ty = art ? 0.78 : 0.68, ly = art ? 0.9 : 0.82;
        UI.text(ctx, o.name, x + cw / 2, y + ch * ny, { size: res.length === 1 ? 26 : 17, align: 'center', fill: '#fffbe8', stroke: 5 });
        const tx = o.kind === 'new' ? '새로 획득!' : o.kind === 'brk' ? `돌파 ${o.n} / ${GACHA.MAXBRK}` : `최대 돌파 · 성화 +${o.sh}`;
        UI.text(ctx, tx, x + cw / 2, y + ch * ty, { size: res.length === 1 ? 22 : 15, align: 'center', fill: o.kind === 'new' ? '#7dffa0' : '#ffd24a', stroke: 4 });
        UI.text(ctx, '한정 검', x + cw / 2, y + ch * ly, { size: 13 * (res.length === 1 ? 1.3 : 1), font: FONT_B, weight: 700, align: 'center', fill: `rgb(${c})`, stroke: 3 });
      }
      ctx.restore();
    }
    if (k >= res.length && rt > cs + 10) {
      const r = this.okRect(); ctx.fillStyle = 'rgba(60,40,10,0.95)'; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill(); ctx.strokeStyle = '#c9a55c'; ctx.lineWidth = 2; ctx.stroke();
      UI.text(ctx, '확  인', r.x + r.w / 2, r.y + 32, { size: 20, align: 'center', fill: '#ffe9a6', stroke: 4 });
    }
  },
};
// 별 그리기
function gcStar(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }

// ============================================================
//  개발자 명령어 (시험용) — 브라우저 콘솔(F12)에서 쓴다
//    성화(1600)     성화 1,600 받기          Dev.sh(n)  도 같다
//    천장(79)       천장 카운트를 79 로 (다음 소환에 한정 검 확정)
//    Dev.gold(n)    골드 n 받기              Dev.reset()  소환 기록 · 성화 · 한정 검 지우기
//  주소 끝에 ?dev=1 을 붙이면 소환 화면에 「성화 +1,600」 버튼이 생긴다 (모바일용)
// ============================================================
const Dev = {
  sh(n = GACHA.COST10) { Gacha.d().sh += Math.round(n); Save.save(); return `성화 ${fmt(Gacha.sh())}`; },
  pity(n = GACHA.PITY - 1) { Gacha.d().pity = clamp(Math.round(n), 0, GACHA.PITY - 1); Save.save(); return `천장 ${Gacha.d().pity} / ${GACHA.PITY}`; },
  gold(n = 100000) { Save.data.gold = (Save.data.gold || 0) + Math.round(n); Save.save(); return `골드 ${fmt(Save.data.gold)}`; },
  reset() {
    const o = Save.data.owned; if (o && o.w) o.w = o.w.filter(id => id !== GACHA.BANNER);
    if (Save.data.eq && Save.data.eq.w === GACHA.BANNER) Save.data.eq.w = 'w0';
    Save.data.gc = { sh: 0, pity: 0, pulls: 0, brk: {} }; Save.save(); return '소환 기록을 지웠습니다';
  },
};
window.Dev = Dev; window.성화 = n => Dev.sh(n); window.천장 = n => Dev.pity(n);
GachaUI.devOn = /[?&]dev=1\b/.test(location.search);
GachaUI.devRect = () => ({ x: 40, y: 92, w: 220, h: 32 });
{
  const _d = GachaUI.draw, _p = GachaUI.pDown;
  GachaUI.draw = function (ctx) {
    _d.call(this, ctx);
    if (this.devOn && !this.res) { const r = this.devRect(); ctx.fillStyle = 'rgba(20,60,30,0.9)'; roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill(); ctx.strokeStyle = '#7dffa0'; ctx.lineWidth = 2; ctx.stroke(); UI.text(ctx, `개발자 : 성화 +${fmt(GACHA.COST10)}`, r.x + r.w / 2, r.y + 22, { size: 15, align: 'center', fill: '#7dffa0', stroke: 3 }); }
  };
  GachaUI.pDown = function (x, y) {
    if (this.devOn && !this.res && inR(x, y, this.devRect())) { Dev.sh(GACHA.COST10); Sfx.play('coin', 0.8, 1.2); this.flash(`성화 +${fmt(GACHA.COST10)}`, '#7dffa0'); return; }
    _p.call(this, x, y);
  };
}
