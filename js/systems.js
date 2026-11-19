'use strict';
// ============================================================
//  성장 · 콘텐츠 시스템 (6종) — 한 화면(HubUI)에 탭으로 모여 있다
//   ① 출석 · 일일 퀘스트   ② 시즌 패스   ③ 룬 각인   ④ 펫 동료   ⑤ 주간 보스 레이드   ⑥ 무한의 탑 보상(탑 자체는 meta.js)
//   저장 : Save.data.sx
//   재료 : 룬 가루(dust) · 펫 먹이(food) · 펫 알(egg)  — 전투 · 퀘스트 · 패스 · 레이드 · 탑에서 얻는다
// ============================================================
const SX = {
  d() {
    const s = Save.data;
    if (!s.sx) s.sx = {};
    const x = s.sx;
    if (x.day == null) Object.assign(x, {
      day: -1, last: -9, streak: 0, att: false, q: [], bonus: false,
      dust: 0, food: 0, egg: 0, runes: [], eq: [null, null, null], rid: 1,
      pets: {}, pet: null, pass: { m: -1, xp: 0, got: {} }, raid: { w: -1, tk: 5, best: 0, wins: 0, first: false }, twr: 0,
    });
    return x;
  },
  today() { const t = new Date(); return Math.floor((t.getTime() - t.getTimezoneOffset() * 60000) / 864e5); },
  week() { return Math.floor((this.today() + 3) / 7); },                      // 월요일 시작
  month() { const t = new Date(); return t.getFullYear() * 12 + t.getMonth(); },
  // 날짜가 바뀌었으면 퀘스트 · 출석 · 레이드 표 · 패스를 새로 연다
  roll() {
    const x = this.d(), day = this.today();
    if (x.day !== day) {
      x.day = day; x.att = false; x.bonus = false;
      const r = mulberry(day * 7919 + 17), keys = Object.keys(QDEF).filter(k => QDEF[k].ok());
      for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
      const hard = r() < 0.5 ? 1 : 0;
      x.q = keys.slice(0, 3).map((k, i) => ({ k, goal: QDEF[k].goal[i === 2 ? 1 : hard], n: 0, got: false }));
    }
    if (x.raid.w !== this.week()) x.raid = { w: this.week(), tk: 5, best: x.raid.best, wins: 0, first: false };
    if (x.pass.m !== this.month()) x.pass = { m: this.month(), xp: 0, got: {} };
    return x;
  },
  // 재화 · 재료 지급
  give(r, quiet) {
    const x = this.d(), out = [];
    if (r.gold) { Save.data.gold = (Save.data.gold || 0) + r.gold; out.push(`골드 ${fmt(r.gold)}`); }
    if (r.sh) { Gacha.earn(r.sh, '', true); out.push(`성화 ${fmt(r.sh)}`); }
    if (r.dust) { x.dust += r.dust; out.push(`룬 가루 ${fmt(r.dust)}`); }
    if (r.food) { x.food += r.food; out.push(`펫 먹이 ${fmt(r.food)}`); }
    if (r.egg) { x.egg += r.egg; out.push(`펫 알 ${r.egg}`); }
    if (r.xp) this.xp(r.xp, true);
    Save.save();
    const s = out.join(' · ');
    if (!quiet && s && Game.notice) Game.notice(s);
    return s;
  },
  txt(r) {
    const o = [];
    if (r.gold) o.push(`골드 ${fmt(r.gold)}`); if (r.sh) o.push(`성화 ${fmt(r.sh)}`); if (r.dust) o.push(`룬 가루 ${r.dust}`);
    if (r.food) o.push(`펫 먹이 ${r.food}`); if (r.egg) o.push(`펫 알 ${r.egg}`); if (r.xp) o.push(`패스 경험치 ${r.xp}`);
    return o.join(' · ');
  },
  xp(n, quiet) { const p = this.d().pass; p.xp += n; if (!quiet) Save.save(); },
  // 퀘스트 진행
  ev(k, n = 1) {
    const x = this.roll(); let ch = false;
    for (const q of x.q) if (q.k === k && q.n < q.goal) { q.n = Math.min(q.goal, q.n + n); ch = true; if (q.n >= q.goal && Game.notice) Game.notice(`퀘스트 완료 : ${QDEF[k].t}`); }
    if (ch) Save.save();
  },
  // 받을 수 있는 보상 수 (버튼 알림용)
  claimable() {
    const x = this.roll(); let n = x.att ? 0 : 1;
    for (const q of x.q) if (q.n >= q.goal && !q.got) n++;
    if (x.q.length && x.q.every(q => q.got) && !x.bonus) n++;
    for (let l = 1; l <= PASS.lv(); l++) if (!x.pass.got[l]) n++;
    return n;
  },
};

const QDEF = {
  kill: { t: '몬스터 처치', goal: [120, 220], u: '마리', ok: () => true },
  boss: { t: '보스 처치', goal: [1, 2], u: '마리', ok: () => true },
  clear: { t: '스테이지 클리어', goal: [1, 2], u: '회', ok: () => true },
  gold: { t: '골드 획득', goal: [15000, 40000], u: 'G', ok: () => true },
  pull: { t: '소환 하기', goal: [1, 1], u: '회', ok: () => Gacha.sh() >= GACHA.COST1 },
  tower: { t: '무한의 탑 층 돌파', goal: [3, 5], u: '층', ok: () => Story.isOpen('tower') },
};
const Q_REWARD = { gold: 6000, dust: 20, xp: 30 }, Q_BONUS = { sh: 60, food: 3, xp: 40 };
const ATT = [
  { gold: 10000 }, { dust: 30 }, { sh: 80 }, { food: 4 }, { gold: 40000 }, { dust: 80 }, { egg: 1, sh: 160 },
];

// ---------- 시즌 패스 (매월 새로 시작) ----------
const PASS = {
  MAX: 30, PER: 80,
  lv() { const p = SX.d().pass; return Math.min(this.MAX, Math.floor(p.xp / this.PER)); },
  reward(l) {
    if (l === 30) return { sh: 1600, egg: 2, dust: 200 };
    if (l % 10 === 0) return { egg: 1, sh: 160 };
    if (l % 5 === 0) return { sh: 100, dust: 40 };
    if (l % 3 === 0) return { food: 4 };
    if (l % 2 === 0) return { dust: 25 };
    return { gold: 15000 + l * 1500 };
  },
  claim(l) {
    const p = SX.roll().pass;
    if (l > this.lv() || p.got[l]) return false;
    p.got[l] = 1; SX.give(this.reward(l)); Sfx.play('coin', 0.7, 1.1); return true;
  },
  claimAll() { let n = 0; for (let l = 1; l <= this.lv(); l++) if (this.claim(l)) n++; return n; },
};

// ---------- 룬 각인 ----------
const RTYPE = {
  atk: { n: '일격', u: '공격력', b: 0.04, col: '255,110,90', pct: true },
  crit: { n: '급소', u: '치명타율', b: 0.02, col: '255,220,90', pct: true },
  cd: { n: '파쇄', u: '치명 피해', b: 0.08, col: '255,160,70', pct: true },
  hp: { n: '강인', u: '체력', b: 0.05, col: '120,230,130', pct: true },
  mv: { n: '질풍', u: '이동 속도', b: 0.03, col: '110,220,255', pct: true },
  ls: { n: '흡혈', u: '피해 흡혈', b: 0.004, col: '230,110,230', pct: true },
};
const RGRADE = [null, { n: '평범', col: '170,182,204' }, { n: '정교', col: '110,190,255' }, { n: '희귀', col: '190,130,255' }, { n: '영웅', col: '255,170,70' }, { n: '전설', col: '255,214,120' }];
const Runes = {
  CAP: 30, SLOTS: 3, MAXLV: 5, COST: 40,
  val(r) { return RTYPE[r.t].b * (1 + 0.6 * (r.g - 1)) * (1 + 0.12 * r.lv); },
  name(r) { return `${RGRADE[r.g].n} ${RTYPE[r.t].n}의 룬`; },
  desc(r) { const T = RTYPE[r.t], v = this.val(r); return `${T.u} +${(v * 100).toFixed(T.b < 0.01 ? 2 : 1)}%`; },
  upCost(r) { return 12 * (r.lv + 1) * r.g; },
  back(r) { return 15 * r.g + 8 * r.lv; },
  get(id) { return SX.d().runes.find(r => r.id === id); },
  eq() { return SX.d().eq.map(id => id && this.get(id)); },
  // 장착한 룬의 합계 (같은 종류 3개를 끼우면 세트 효과 x1.3)
  sum() {
    const o = { atk: 0, crit: 0, cd: 0, hp: 0, mv: 0, ls: 0 }, e = this.eq().filter(Boolean);
    const set = e.length === this.SLOTS && e.every(r => r.t === e[0].t) ? 1.3 : 1;
    for (const r of e) o[r.t] += this.val(r) * set;
    return o;
  },
  isSet() { const e = this.eq().filter(Boolean); return e.length === this.SLOTS && e.every(r => r.t === e[0].t); },
  roll(g) {
    const x = Math.random();
    const gr = g || (x < 0.004 ? 5 : x < 0.03 ? 4 : x < 0.12 ? 3 : x < 0.4 ? 2 : 1);
    const t = Object.keys(RTYPE)[Math.floor(Math.random() * 6)];
    return { id: SX.d().rid++, t, g: gr, lv: 0 };
  },
  craft() {
    const x = SX.d();
    if (x.runes.length >= this.CAP) return { err: '룬 보관함이 가득 찼습니다 (분해해서 비우세요)' };
    if (x.dust < this.COST) return { err: `룬 가루가 모자랍니다 (${this.COST} 필요)` };
    x.dust -= this.COST; const r = this.roll(); x.runes.push(r); Save.save(); return { r };
  },
  equip(id) {
    const x = SX.d(), i = x.eq.indexOf(id);
    if (i >= 0) { x.eq[i] = null; Save.save(); return; }
    const k = x.eq.indexOf(null); if (k < 0) return 'full';
    x.eq[k] = id; Save.save();
  },
  up(r) {
    const x = SX.d(), c = this.upCost(r);
    if (r.lv >= this.MAXLV) return '이미 최대 강화입니다';
    if (x.dust < c) return `룬 가루가 모자랍니다 (${c} 필요)`;
    x.dust -= c; r.lv++; Save.save(); return null;
  },
  scrap(r) {
    const x = SX.d(); x.dust += this.back(r);
    x.runes = x.runes.filter(q => q !== r); x.eq = x.eq.map(id => id === r.id ? null : id); Save.save();
  },
};

// ---------- 펫 동료 ----------
const PETS = {
  fox: { n: '불씨 여우', role: '공격', col: ['#e8782a', '#ffc070', '#fff1c8'], pas: 'atk', pv: 0.02, pu: '공격력', act: '불꽃 구슬을 쏘아 불태운다', cd: 150 },
  owl: { n: '달빛 올빼미', role: '치명', col: ['#6a78b8', '#aebcf0', '#f2f6ff'], pas: 'crit', pv: 0.005, pu: '치명타율', act: '번개를 내려 적 둘을 친다', cd: 200 },
  turtle: { n: '단단이 거북', role: '수호', col: ['#3f8a58', '#8ed49a', '#e6f6c8'], pas: 'hp', pv: 0.03, pu: '체력', act: '주기적으로 체력을 회복시킨다', cd: 540 },
  slime: { n: '황금 슬라임', role: '재물', col: ['#d8a820', '#ffe070', '#fffbe0'], pas: 'mp', pv: 0.04, pu: '기력 회복', act: '금화를 뱉으며 적을 맞춘다', cd: 260 },
};
const Pets = {
  MAXLV: 10,
  have(id) { return SX.d().pets[id] | 0; },                    // 0 = 없음 / 1~ = 레벨
  cur() { const id = SX.d().pet; return id && this.have(id) ? id : null; },
  upCost(lv) { return 2 + lv * 2; },
  hatch() {
    const x = SX.d();
    if (x.egg < 1) return { err: '펫 알이 없습니다' };
    x.egg--; const ids = Object.keys(PETS), id = ids[Math.floor(Math.random() * ids.length)];
    let kind = 'new';
    if (!x.pets[id]) { x.pets[id] = 1; if (!x.pet) x.pet = id; } else { x.food += 3; kind = 'dup'; }
    Save.save(); return { id, kind };
  },
  up(id) {
    const x = SX.d(), lv = this.have(id), c = this.upCost(lv);
    if (!lv) return '아직 만나지 못한 펫입니다';
    if (lv >= this.MAXLV) return '이미 최고 레벨입니다';
    if (x.food < c) return `펫 먹이가 모자랍니다 (${c} 필요)`;
    x.food -= c; x.pets[id] = lv + 1; Save.save(); return null;
  },
  // 펫을 그린다 (카드 · 전투 공용). x,y = 발밑 중앙, s = 크기
  draw(ctx, id, x, y, s, t, face = 1) {
    const C = PETS[id].col, bob = Math.sin(t * 0.1) * 2 * s;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(s * face, s); ctx.lineJoin = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = '#1a1220';
    const eye = (ex, ey, r = 2.6) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#10101a'; ctx.beginPath(); ctx.arc(ex + 0.7, ey + 0.4, r * 0.55, 0, TAU); ctx.fill(); };
    if (id === 'fox') {
      const sw = Math.sin(t * 0.15) * 0.25;
      ctx.save(); ctx.translate(-14, -14); ctx.rotate(-0.7 + sw);                                   // 꼬리 + 불꽃
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.ellipse(-6, 0, 14, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C[2]; ctx.beginPath(); ctx.ellipse(-16, 0, 6, 4.5, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, -20, -2, 14, '255,160,60', 0.5 + Math.sin(t * 0.3) * 0.15); ctx.restore();
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.ellipse(0, -14, 16, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C[2]; ctx.beginPath(); ctx.ellipse(3, -9, 9, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.arc(12, -26, 11, 0, TAU); ctx.fill(); ctx.stroke();
      for (const ex of [6, 16]) { ctx.beginPath(); ctx.moveTo(ex - 4, -34); ctx.lineTo(ex + (ex > 10 ? 4 : -2), -47); ctx.lineTo(ex + 5, -33); ctx.closePath(); ctx.fillStyle = C[0]; ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = C[2]; ctx.beginPath(); ctx.ellipse(18, -23, 5, 4, 0, 0, TAU); ctx.fill(); eye(14, -28); ctx.fillStyle = '#2a1018'; ctx.beginPath(); ctx.arc(21, -24, 1.5, 0, TAU); ctx.fill();
    } else if (id === 'owl') {
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.ellipse(0, -22, 17, 21, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C[2]; ctx.beginPath(); ctx.ellipse(0, -16, 10, 14, 0, 0, TAU); ctx.fill();
      const fl = Math.sin(t * 0.2) * 0.3;
      for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 15, -22); ctx.rotate(sd * (0.35 + fl)); ctx.fillStyle = C[1]; ctx.beginPath(); ctx.ellipse(sd * 5, 0, 7, 15, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 6, -39); ctx.lineTo(sd * 13, -50); ctx.lineTo(sd * 15, -37); ctx.closePath(); ctx.fillStyle = C[0]; ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = C[2]; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 7, -30, 7, 0, TAU); ctx.fill(); ctx.stroke(); eye(sd * 7, -30, 4); }
      ctx.fillStyle = '#ffc040'; ctx.beginPath(); ctx.moveTo(-3, -24); ctx.lineTo(3, -24); ctx.lineTo(0, -18); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -22, 30, '150,170,255', 0.18); ctx.globalCompositeOperation = 'source-over';
    } else if (id === 'turtle') {
      ctx.fillStyle = C[1]; ctx.beginPath(); ctx.ellipse(18, -14, 8, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-12, -4, 5, 0, TAU); ctx.arc(10, -4, 5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.ellipse(0, -14, 19, 14, 0, Math.PI, TAU); ctx.lineTo(19, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,246,200,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6, -27); ctx.lineTo(-9, -14); ctx.moveTo(6, -27); ctx.lineTo(9, -14); ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.stroke();
      ctx.strokeStyle = '#1a1220'; ctx.lineWidth = 2.2; eye(21, -17, 2.2);
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -22, 26, '140,255,170', 0.16 + Math.sin(t * 0.07) * 0.06); ctx.globalCompositeOperation = 'source-over';
    } else {
      const sq = 1 + Math.sin(t * 0.14) * 0.07;
      ctx.scale(1 / sq, sq);
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-20, -34, 0, -36); ctx.quadraticCurveTo(20, -34, 18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C[1]; ctx.beginPath(); ctx.ellipse(-6, -24, 8, 5, -0.5, 0, TAU); ctx.fill();
      eye(-6, -17, 3.2); eye(7, -17, 3.2);
      ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, -11, 4, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -20, 28, '255,220,90', 0.22); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  },
};

// 전투 중 따라다니는 펫
class FPet {
  constructor(id) {
    const p = Game.player;
    this.id = id; this.x = p.x - 60; this.y = p.y + 24; this.z = 36; this.h = 0; this.t = 0; this.cd = 80; this.face = 1;
  }
  update() {
    const g = Game, p = g.player;
    if (!p || g.pet !== this) return false;
    this.t++;
    const tx = p.x - p.facing * 62, ty = clamp(p.y + 26, 10, DEPTH - 10);
    this.x += (tx - this.x) * 0.09; this.y += (ty - this.y) * 0.09; this.face = p.facing || 1;
    this.z = 34 + Math.sin(this.t * 0.07) * 6;
    if (g.state !== 'play' || p.hp <= 0 || g.clearSeq) return true;
    if (--this.cd > 0) return true;
    const P = PETS[this.id], lv = Pets.have(this.id) || 1;
    const es = g.enemies.filter(e => e.hittable() && Math.abs(e.x - this.x) < 640).sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x));
    if (this.id === 'turtle') {
      this.cd = P.cd;
      if (p.hp < p.hpMax) { Gear.heal(p, p.hpMax * (0.03 + 0.005 * lv)); FX.add('world', new Flash(p.x, sy(p.y, p.z + 60), 10, 90, 18, '140,255,170', 0.7)); Sfx.play('ui', 0.4, 1.6); }
      return true;
    }
    if (!es.length) { this.cd = 20; return true; }
    this.cd = P.cd - lv * 6;
    const tgt = [es[0]];
    if (this.id === 'owl' && es[1]) tgt.push(es[1]);
    for (const e of tgt) {
      if (this.id === 'owl') { Gear.bolt({ x: e.x, y: e.y, z: 700, h: 0 }, e, '170,190,255'); FX.add('world', new Flash(e.x, sy(e.y, e.z + 40), 8, 90, 12, '170,190,255', 0.9)); Gear.proc(p, e, 0.5 + 0.1 * lv, { quiet: true, crit: true }); }
      else if (this.id === 'fox') { Gear.bolt(this, e, '255,150,60'); FX.add('world', new Flash(e.x, sy(e.y, e.z + 40), 8, 100, 12, '255,150,60', 0.9)); Gear.proc(p, e, 0.6 + 0.14 * lv, { quiet: true }); Status.add(e, 'burn', { t: 120, d: Math.max(1, p.atk * 0.05) }); }
      else { Gear.bolt(this, e, '255,226,100'); FX.add('world', new Flash(e.x, sy(e.y, e.z + 40), 8, 80, 12, '255,226,100', 0.9)); Gear.proc(p, e, 0.5 + 0.1 * lv, { quiet: true }); g.stats.gold += 20 * lv; }
    }
    Sfx.play('ui', 0.35, 1.8);
    return true;
  }
  draw(ctx) {
    const sx = this.x, gy = sy(this.y, 0), py = sy(this.y, this.z);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, gy, 15, 5, 0, 0, TAU); ctx.fill();
    Pets.draw(ctx, this.id, sx, py, 0.8, this.t, this.face);
  }
}

// ---------- 주간 보스 레이드 ----------
const Raid = {
  run: null,
  bossKey() {
    const ks = Object.keys(BOSS_DEFS).filter(k => !BOSS_DEFS[k].dexKey);
    return ks[SX.week() % ks.length];
  },
  def() {
    const k = this.bossKey(), base = DUNGEONS.find(d => d.boss === k) || DUNGEONS[DUNGEONS.length - 1];
    return Object.assign({}, base, { id: 'raid', name: `주간 레이드 · ${BOSS_DEFS[k].name}`, rooms: 0, boss: k, tower: false, mul: Math.max(2, playerPower() * 2.6), lv: Math.min(999, 40 + Math.round(playerPower())) });
  },
  open() { return Story.isOpen('shop'); },
  reward(tier) {
    const m = tier === 'S' ? 2 : tier === 'A' ? 1.5 : 1;
    const r = { gold: Math.round(60000 * m), dust: Math.round(50 * m), sh: Math.round(50 * m), food: Math.round(5 * m), xp: 80 };
    if (tier === 'S') r.egg = 1;
    return r;
  },
  start() {
    const x = SX.roll(), R = x.raid;
    if (!this.open()) return '프롤로그를 마치면 도전할 수 있습니다';
    if (R.tk < 1) return '이번 주 도전권을 모두 썼습니다 (월요일에 5장 충전)';
    R.tk--; Save.save();
    DUNGEON_BY_ID.raid = this.def();
    this.run = { done: false, frac: 0, boss: null, t0: Game.frame };
    Game.startDungeon('raid', 0);
    return null;
  },
  // 결과 정산 : cleared 이면 시간 등급, 아니면 입힌 피해량만큼 위로금
  settle(cleared, sec) {
    const r = this.run; if (!r || r.done) return; r.done = true;
    const x = SX.roll(), R = x.raid; let msg;
    if (cleared) {
      const tier = sec <= 110 ? 'S' : sec <= 190 ? 'A' : 'B', rw = this.reward(tier);
      if (!R.first) { R.first = true; rw.sh += 100; }
      R.wins++; R.best = R.best ? Math.min(R.best, sec) : sec;
      msg = `레이드 클리어  ${tier}등급 (${sec}초)  :  ${SX.give(rw, true)}`;
      Sfx.play('clear', 0.6);
    } else {
      const f = clamp(r.frac, 0, 1), rw = { gold: Math.round(20000 * f), dust: Math.round(15 * f), xp: Math.round(20 * f) };
      msg = `레이드 실패 (보스 체력 ${Math.round(f * 100)}% 깎음)  :  ${SX.give(rw, true) || '위로금 없음'}`;
    }
    Save.save(); Game.notice(msg); this.last = msg;
  },
};

// ---------- 전투 · 진행 연결 ----------
{
  // 능력치 : 룬 + 펫
  const _sg = Player.prototype.setGear;
  Player.prototype.setGear = function (w, a) {
    _sg.call(this, w, a);
    if (!Save.data) return;
    const R = Runes.sum(), pid = Pets.cur(), P = pid && PETS[pid], pl = pid ? Pets.have(pid) : 0, pv = P ? P.pv * pl : 0;
    const atk = R.atk + (P && P.pas === 'atk' ? pv : 0), hp = R.hp + (P && P.pas === 'hp' ? pv : 0);
    if (atk) this.atk = this.baseAtk = Math.round(this.atk * (1 + atk));
    if (hp) { const f = this.hp / this.hpMax; this.hpMax = Math.round(this.hpMax * (1 + hp)); this.hp = Math.max(1, Math.round(this.hpMax * f)); }
    this.critRate += R.crit + (P && P.pas === 'crit' ? pv : 0); this.critDmg += R.cd;
    this.moveMul *= 1 + R.mv; if (P && P.pas === 'mp') this.mpRegen *= 1 + pv;
    this.lsRate = R.ls;
  };
  // 흡혈
  const _oh = Game.onPlayerHit;
  Game.onPlayerHit = function (dmg, tgt) {
    const r = _oh.apply(this, arguments), p = this.player;
    if (p && p.lsRate > 0 && p.hp > 0 && dmg > 0) Gear.heal(p, Math.min(dmg * p.lsRate, p.hpMax * 0.01), true);
    return r;
  };
  // 방이 열릴 때 펫을 데려온다
  const _lr = Game.loadRoom;
  Game.loadRoom = function (i) {
    _lr.call(this, i);
    this.pet = null;
    const id = Pets.cur(); if (id && this.player) this.pet = FX.add('world', new FPet(id));
  };
  // 퀘스트 · 재료 얻기
  const _dk = Dex.kill;
  Dex.kill = function (e) { _dk.call(this, e); SX.ev('kill'); if (e.isBoss) { SX.ev('boss'); SX.give({ dust: 3 }, true); } };
  const _cs = Story.clearStage;
  Story.clearStage = function () {
    const first = !(this.R && this.R.done);
    _cs.apply(this, arguments);
    if (first) { SX.ev('clear'); SX.give({ dust: 10, xp: 15 }, true); }
  };
  const _rec = Save.record;
  Save.record = function (id, rank, score, gold) {
    if (id === 'raid') {                                                       // 레이드는 던전 기록(해금 · 전투력 곡선)에 넣지 않는다
      Save.data.gold = (Save.data.gold || 0) + gold; Save.save();
      Raid.settle(true, Math.round(Game.stats.time / 60)); return;
    }
    _rec.apply(this, arguments);
    SX.ev('clear'); SX.ev('gold', gold); SX.give({ dust: 10, xp: 15 }, true);
  };
  const _bk = Save.bank;
  Save.bank = function (g) { _bk.call(this, g); if (g > 0) SX.ev('gold', g); };
  const _pl = Gacha.pull;
  Gacha.pull = function (n) { const r = _pl.call(this, n); if (r) SX.ev('pull', n); return r; };
  // 무한의 탑 : 층 돌파 퀘스트 · 10층마다 보상
  const _orc = Game.onRoomClear;
  Game.onRoomClear = function () {
    _orc.apply(this, arguments);
    if (this.dungeon && this.dungeon.def.tower) {
      SX.ev('tower');
      const f = this.roomIdx + 1, x = SX.d();
      if (f % 10 === 0 && f > x.twr) {
        x.twr = f; const rw = { sh: 20 + (f / 10) * 4, dust: 30, gold: 20000 };
        if (f % 50 === 0) rw.egg = 1;
        this.notice(`탑 ${f}층 돌파 보상 : ${SX.give(rw, true)}`);
      }
    }
  };
  // 레이드 : 쓰러지거나 도중에 나가면 정산
  const _up = Game.update;
  Game.update = function () {
    _up.apply(this, arguments);
    const r = Raid.run; if (!r || r.done) return;
    if (this.boss && this.boss.hpMax) { r.boss = this.boss; r.frac = 1 - this.boss.hp / this.boss.hpMax; }
    if (this.state === 'gameover' || this.state === 'smap' || this.state === 'lobby' || this.state === 'title') Raid.settle(false);
  };
}

// ---------- 화면 ----------
const HubUI = {
  TABS: ['출석 · 퀘스트', '시즌 패스', '룬 각인', '펫 동료', '레이드 · 탑'],
  tab: 0, t: 0, hits: [], msg: '', msgT: 0, sel: null, res: null, resT: 0,
  enter() { SX.roll(); this.t = 0; this.hits = []; this.sel = null; this.res = null; this.msgT = 0; if (Raid.last) { this.say(Raid.last); Raid.last = null; this.tab = 4; } },
  leave() { Sfx.play('select'); Game.toLobby(); },
  say(m) { this.msg = m; this.msgT = 180; },
  go(i) { this.tab = (i + this.TABS.length) % this.TABS.length; this.sel = null; Sfx.play('ui', 0.6, 1.1); },
  update() {
    this.t++; if (this.msgT > 0) this.msgT--;
    if (this.res) { this.resT++; for (const q of Input.drain()) if (this.resT > 20 && (q.a === 'confirm' || q.a === 'attack' || q.a === 'jump')) this.res = null; if (Input.take('pause')) this.res = null; return; }
    if (Input.take('pause')) { this.leave(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'left') this.go(this.tab - 1);
      else if (q.a === 'right') this.go(this.tab + 1);
      else if (q.a === 'back' || q.a === 'hub') { this.leave(); return; }
      else if (q.a === 'confirm' || q.a === 'attack') this.primary();
    }
  },
  pDown(x, y) {
    if (this.res) { if (this.resT > 20) this.res = null; return; }
    for (let i = this.hits.length - 1; i >= 0; i--) if (inR(x, y, this.hits[i].r)) { this.hits[i].fn(); return; }
  },
  pMove() { }, pUp() { }, wheel() { },
  // 엔터 : 지금 탭에서 가장 하고 싶은 일
  primary() {
    const x = SX.roll();
    if (this.tab === 0) { if (!x.att) this.claimAtt(); else { const i = x.q.findIndex(q => q.n >= q.goal && !q.got); if (i >= 0) this.claimQ(i); else if (x.q.length && x.q.every(q => q.got) && !x.bonus) this.claimBonus(); } }
    else if (this.tab === 1) { const n = PASS.claimAll(); this.say(n ? `보상 ${n}개를 받았습니다` : '받을 보상이 없습니다'); }
    else if (this.tab === 2) this.craft();
    else if (this.tab === 3) this.hatch();
    else this.raidGo();
  },
  claimAtt() {
    const x = SX.roll(); if (x.att) return;
    x.streak = x.last === x.day - 1 ? x.streak + 1 : 1; x.last = x.day; x.att = true;
    const r = Object.assign({ xp: 20 }, ATT[(x.streak - 1) % 7]); this.say(`출석 ${x.streak}일째 :  ${SX.give(r, true)}`); Sfx.play('coin', 0.8, 1.1);
  },
  claimQ(i) { const q = SX.roll().q[i]; if (!q || q.got || q.n < q.goal) return; q.got = true; this.say(`퀘스트 보상 :  ${SX.give(Q_REWARD, true)}`); Sfx.play('coin', 0.7, 1.2); },
  claimBonus() { const x = SX.roll(); if (x.bonus || !x.q.every(q => q.got)) return; x.bonus = true; this.say(`전부 완료 보너스 :  ${SX.give(Q_BONUS, true)}`); Sfx.play('clear', 0.5, 1.3); },
  craft() { const o = Runes.craft(); if (o.err) { this.say(o.err); Sfx.play('ui', 0.5, 0.5); return; } this.sel = o.r.id; this.res = { type: 'rune', r: o.r }; this.resT = 0; Sfx.play('flash', 0.6, 1.1); },
  hatch() { const o = Pets.hatch(); if (o.err) { this.say(o.err); Sfx.play('ui', 0.5, 0.5); return; } this.res = { type: 'pet', id: o.id, kind: o.kind }; this.resT = 0; Sfx.play('flash', 0.6, 1.1); },
  raidGo() { const e = Raid.start(); if (e) { this.say(e); Sfx.play('ui', 0.5, 0.5); } else Sfx.play('select'); },
  towerGo() {
    if (!Story.isOpen('tower')) { this.say('제2장을 마치면 무한의 탑이 열립니다'); return; }
    const run = Save.data.tower.run > 0 ? Save.data.tower.run : 0; Sfx.play('select'); Game.startDungeon('tower', run);
  },

  // ----- 그리기 도우미 -----
  panel(ctx, x, y, w, h, o = {}) {
    ctx.fillStyle = o.fill || 'rgba(12,10,18,0.78)'; roundRect(ctx, x, y, w, h, o.r || 12); ctx.fill();
    ctx.strokeStyle = o.line || 'rgba(201,165,92,0.45)'; ctx.lineWidth = 1.6; ctx.stroke();
  },
  btn(ctx, x, y, w, h, label, fn, o = {}) {
    const can = o.can !== false, r = { x, y, w, h };
    ctx.fillStyle = can ? (o.fill || 'rgba(60,40,10,0.95)') : 'rgba(30,26,30,0.9)'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = can ? (o.line || '#c9a55c') : 'rgba(150,160,190,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    UI.text(ctx, label, x + w / 2, y + h / 2 + (o.sub ? -2 : 6), { size: o.size || 17, align: 'center', fill: can ? '#fff1c0' : '#7a7a8a', stroke: 3 });
    if (o.sub) UI.text(ctx, o.sub, x + w / 2, y + h / 2 + 15, { size: 11, font: FONT_B, weight: 700, align: 'center', fill: can ? '#ffd890' : '#6a6a78', stroke: 2 });
    this.hits.push({ r, fn });
  },
  tx(ctx, s, x, y, size = 15, fill = '#dfe4f6', align = 'left') { UI.text(ctx, s, x, y, { size, font: FONT_B, weight: 700, align, fill, stroke: 3 }); },
  bar(ctx, x, y, w, h, u, col) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    if (u > 0) { ctx.fillStyle = col; roundRect(ctx, x, y, Math.max(h, w * clamp(u, 0, 1)), h, h / 2); ctx.fill(); }
  },
  runeIcon(ctx, r, cx, cy, s, on) {
    const T = RTYPE[r.t], G = RGRADE[r.g];
    ctx.save(); ctx.translate(cx, cy);
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, s * 1.1, G.col, 0.18 + r.g * 0.05); ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath(); ctx.moveTo(0, -s * 0.62); ctx.lineTo(s * 0.5, 0); ctx.lineTo(0, s * 0.62); ctx.lineTo(-s * 0.5, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -s * 0.6, 0, s * 0.6); g.addColorStop(0, `rgba(${T.col},1)`); g.addColorStop(1, 'rgba(20,14,30,1)'); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = on ? 3.2 : 2.2; ctx.strokeStyle = `rgb(${G.col})`; ctx.stroke();
    UI.text(ctx, T.n[0], 0, s * 0.14, { size: Math.round(s * 0.46), align: 'center', fill: '#fff', stroke: 3 });
    if (r.lv) UI.text(ctx, `+${r.lv}`, s * 0.5, s * 0.62, { size: 12, align: 'right', fill: '#ffe9a6', stroke: 3 });
    ctx.restore();
  },

  draw(ctx) {
    const t = this.t, x = SX.roll(); this.hits = [];
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0e1220'); bg.addColorStop(1, '#1c1226'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) { const k = (t * 0.4 + i * 61) % 500; ctx.fillStyle = `rgba(160,190,255,${0.22 * (1 - k / 500)})`; ctx.beginPath(); ctx.arc((i * 211) % W, H - k * 1.5, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
    UI.text(ctx, '성장 · 콘텐츠', 40, 52, { size: 32, fill: '#ffe9a6', stroke: 5 });
    this.btn(ctx, 40 + 232, 22, 110, 38, Touch.on ? '돌아가기' : '돌아가기 [Esc]', () => this.leave(), { size: 14 });
    // 재료 표시
    const res = [['룬 가루', x.dust, '170,200,255'], ['펫 먹이', x.food, '255,190,110'], ['펫 알', x.egg, '255,150,200'], ['성화', Gacha.sh(), '255,214,120'], ['골드', Save.data.gold | 0, '255,230,120']];
    res.forEach(([n, v, c], i) => { const rx = W - 40 - (res.length - 1 - i) * 128; this.tx(ctx, n, rx, 34, 12, `rgb(${c})`, 'right'); UI.text(ctx, fmt(v), rx, 58, { size: 18, align: 'right', fill: '#fff', stroke: 3 }); });
    // 탭
    this.TABS.forEach((n, i) => {
      const bx = 40 + i * 238, on = i === this.tab, dot = i === 0 ? (x.att ? 0 : 1) + x.q.filter(q => q.n >= q.goal && !q.got).length + (x.q.length && x.q.every(q => q.got) && !x.bonus ? 1 : 0) : i === 1 ? Math.max(0, PASS.lv() - Object.keys(x.pass.got).length) : i === 3 ? (x.egg > 0 ? 1 : 0) : 0;
      this.btn(ctx, bx, 78, 228, 44, n, () => this.go(i), { fill: on ? 'rgba(90,64,14,0.98)' : 'rgba(26,22,34,0.92)', line: on ? '#fff1a0' : 'rgba(201,165,92,0.45)', size: 18 });
      if (dot) { ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(bx + 218, 88, 8, 0, TAU); ctx.fill(); UI.text(ctx, String(Math.min(dot, 99)), bx + 218, 93, { size: 11, align: 'center', fill: '#fff', stroke: 2 }); }
    });
    if (this.tab === 0) this.drawDaily(ctx, x);
    else if (this.tab === 1) this.drawPass(ctx, x);
    else if (this.tab === 2) this.drawRunes(ctx, x);
    else if (this.tab === 3) this.drawPets(ctx, x);
    else this.drawRaid(ctx, x);
    if (!Touch.on) this.tx(ctx, '← → 탭 이동   Enter 가장 먼저 할 일   Esc 돌아가기', 40, 706, 12, '#7f89a8');
    if (this.msgT > 0) { const a = Math.min(1, this.msgT / 20); ctx.globalAlpha = a; this.panel(ctx, 40, 640, 1200, 44, { fill: 'rgba(20,16,8,0.95)', line: '#c9a55c' }); UI.text(ctx, this.msg, W / 2, 669, { size: 16, align: 'center', fill: '#ffe9a6', stroke: 3 }); ctx.globalAlpha = 1; }
    if (this.res) this.drawRes(ctx);
    if (GachaUI.devOn) this.btn(ctx, 400, 22, 200, 38, '개발자 : 재료 보급', () => { Dev.sx(); this.say('룬 가루 +1,000 · 먹이 +100 · 알 +5 · 패스 +800 · 레이드 도전권 충전'); }, { size: 13 });
  },

  drawDaily(ctx, x) {
    this.panel(ctx, 40, 140, 1200, 170);
    this.tx(ctx, `출석 보상  ·  연속 ${x.streak}일`, 62, 172, 18, '#ffe9a6');
    const idx = x.att ? (x.streak - 1) % 7 : (x.last === x.day - 1 ? x.streak : 0) % 7;      // 오늘 받을(받은) 칸
    for (let i = 0; i < 7; i++) {
      const cx = 62 + i * 168, done = x.att ? i <= idx : i < idx, today = !x.att && i === idx;
      this.panel(ctx, cx, 190, 156, 78, { fill: done ? 'rgba(40,64,40,0.7)' : today ? 'rgba(80,58,16,0.85)' : 'rgba(24,20,30,0.7)', line: today ? '#fff1a0' : done ? '#6fcf80' : 'rgba(201,165,92,0.3)', r: 10 });
      this.tx(ctx, `${i + 1}일`, cx + 12, 212, 13, today ? '#fff1a0' : '#9aa4c0');
      this.tx(ctx, SX.txt(ATT[i]), cx + 78, 248, 13, '#e8ecf8', 'center');
      if (done) UI.text(ctx, '✔', cx + 138, 214, { size: 18, align: 'center', fill: '#7dffa0', stroke: 3 });
    }
    this.btn(ctx, 62, 276, 220, 28, x.att ? '오늘 출석 완료' : '출석 도장 찍기', () => this.claimAtt(), { can: !x.att, size: 15 });
    this.tx(ctx, '하루를 걸러도 기록은 처음으로 돌아갑니다. 7일째에는 펫 알이 나옵니다.', 300, 296, 12, '#8c96b4');
    // 일일 퀘스트
    this.panel(ctx, 40, 326, 1200, 300);
    this.tx(ctx, '일일 퀘스트', 62, 358, 18, '#ffe9a6'); this.tx(ctx, '매일 자정에 새로 바뀝니다', 190, 358, 12, '#8c96b4');
    x.q.forEach((q, i) => {
      const y = 376 + i * 70, D = QDEF[q.k], done = q.n >= q.goal;
      this.panel(ctx, 56, y, 1168, 60, { fill: 'rgba(24,20,32,0.8)', line: done ? '#6fcf80' : 'rgba(201,165,92,0.3)', r: 10 });
      this.tx(ctx, D.t, 76, y + 26, 17, '#fff');
      this.tx(ctx, `${fmt(q.n)} / ${fmt(q.goal)} ${D.u}`, 76, y + 48, 13, '#9aa4c0');
      this.bar(ctx, 380, y + 22, 400, 14, q.n / q.goal, done ? '#6fcf80' : '#c9a55c');
      this.tx(ctx, SX.txt(Q_REWARD), 800, y + 36, 13, '#ffd890');
      this.btn(ctx, 1076, y + 10, 136, 40, q.got ? '수령 완료' : done ? '보상 받기' : '진행 중', () => this.claimQ(i), { can: done && !q.got, size: 16 });
    });
    const all = x.q.length && x.q.every(q => q.got);
    this.tx(ctx, `전부 완료 보너스 :  ${SX.txt(Q_BONUS)}`, 76, 606, 14, all ? '#ffd890' : '#7f89a8');
    this.btn(ctx, 1076, 584, 136, 34, x.bonus ? '수령 완료' : '보너스', () => this.claimBonus(), { can: all && !x.bonus, size: 15 });
  },

  drawPass(ctx, x) {
    const p = x.pass, lv = PASS.lv(), mo = this.monthName();
    this.panel(ctx, 40, 140, 1200, 84);
    UI.text(ctx, `${mo} 시즌 패스`, 62, 178, { size: 24, fill: '#ffe9a6', stroke: 4 });
    this.tx(ctx, `레벨 ${lv} / ${PASS.MAX}`, 62, 206, 15, '#fff');
    this.bar(ctx, 220, 192, 560, 14, lv >= PASS.MAX ? 1 : (p.xp % PASS.PER) / PASS.PER, '#8fc4ff');
    this.tx(ctx, lv >= PASS.MAX ? '최고 레벨' : `다음 레벨까지 ${PASS.PER - p.xp % PASS.PER}`, 790, 205, 13, '#9aa4c0');
    const n = Math.max(0, lv - Object.keys(p.got).length);
    this.btn(ctx, 1040, 164, 172, 44, n ? `모두 받기 (${n})` : '모두 받기', () => { const k = PASS.claimAll(); this.say(k ? `보상 ${k}개를 받았습니다` : '받을 보상이 없습니다'); }, { can: n > 0, size: 17 });
    for (let l = 1; l <= PASS.MAX; l++) {
      const col = (l - 1) % 10, row = Math.floor((l - 1) / 10), cx = 40 + col * 120, cy = 240 + row * 130;
      const got = !!p.got[l], can = l <= lv && !got, r = PASS.reward(l);
      this.panel(ctx, cx, cy, 112, 120, { fill: got ? 'rgba(40,60,40,0.7)' : can ? 'rgba(90,64,14,0.9)' : 'rgba(20,18,28,0.8)', line: can ? '#fff1a0' : got ? '#6fcf80' : 'rgba(201,165,92,0.28)', r: 10 });
      this.tx(ctx, `Lv ${l}`, cx + 56, cy + 22, 15, can ? '#fff1a0' : '#9aa4c0', 'center');
      const rows = SX.txt(r).split(' · ');
      rows.slice(0, 3).forEach((s, i) => this.tx(ctx, s, cx + 56, cy + 48 + i * 18, 12, l <= lv ? '#e8ecf8' : '#6a6f86', 'center'));
      this.tx(ctx, got ? '수령 완료' : can ? '누르면 받기' : '잠김', cx + 56, cy + 110, 11, got ? '#7dffa0' : can ? '#ffd890' : '#555c74', 'center');
      this.hits.push({ r: { x: cx, y: cy, w: 112, h: 120 }, fn: () => { if (PASS.claim(l)) this.say(`Lv ${l} 보상 :  ${SX.txt(r)}`); } });
    }
  },
  monthName() { return `${new Date().getMonth() + 1}월`; },

  drawRunes(ctx, x) {
    this.panel(ctx, 40, 140, 470, 490);
    this.tx(ctx, '장착 슬롯', 62, 172, 18, '#ffe9a6');
    const eq = Runes.eq();
    for (let i = 0; i < 3; i++) {
      const cx = 100 + i * 150, cy = 250, r = eq[i];
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; roundRect(ctx, cx - 60, cy - 60, 120, 120, 14); ctx.fill(); ctx.strokeStyle = 'rgba(201,165,92,0.4)'; ctx.lineWidth = 1.6; ctx.stroke();
      if (r) { this.runeIcon(ctx, r, cx, cy - 6, 64, this.sel === r.id); this.tx(ctx, RTYPE[r.t].n, cx, cy + 48, 12, '#dfe4f6', 'center'); this.hits.push({ r: { x: cx - 60, y: cy - 60, w: 120, h: 120 }, fn: () => { this.sel = r.id; Sfx.play('ui', 0.5, 1.2); } }); }
      else this.tx(ctx, '비어 있음', cx, cy + 6, 13, '#6a7090', 'center');
    }
    const sum = Runes.sum(), set = Runes.isSet();
    this.tx(ctx, set ? '세트 효과 발동!  같은 룬 3개  효과 ×1.3' : '같은 종류 룬 3개를 끼우면 효과 ×1.3', 62, 340, 13, set ? '#ffd890' : '#8c96b4');
    this.tx(ctx, '현재 효과', 62, 378, 16, '#ffe9a6');
    let ly = 404;
    for (const k of Object.keys(RTYPE)) if (sum[k] > 0) { this.tx(ctx, RTYPE[k].u, 70, ly, 14, '#dfe4f6'); this.tx(ctx, `+${(sum[k] * 100).toFixed(RTYPE[k].b < 0.01 ? 2 : 1)}%`, 480, ly, 14, '#7dffa0', 'right'); ly += 24; }
    if (ly === 404) this.tx(ctx, '장착한 룬이 없습니다', 70, ly, 14, '#6a7090');
    this.btn(ctx, 62, 560, 426, 52, '룬 각인', () => this.craft(), { sub: `룬 가루 ${Runes.COST} 소모 · 종류와 등급은 무작위`, can: x.dust >= Runes.COST && x.runes.length < Runes.CAP, size: 20 });
    // 보관함
    this.panel(ctx, 530, 140, 710, 490);
    this.tx(ctx, `보관함  ${x.runes.length} / ${Runes.CAP}`, 552, 172, 18, '#ffe9a6');
    const cols = 8, cw = 82;
    x.runes.forEach((r, i) => {
      const cx = 552 + (i % cols) * cw + 36, cy = 218 + Math.floor(i / cols) * cw + 8, on = this.sel === r.id, eqd = x.eq.includes(r.id);
      ctx.fillStyle = on ? 'rgba(90,64,14,0.8)' : 'rgba(255,255,255,0.05)'; roundRect(ctx, cx - 38, cy - 38, 76, 76, 10); ctx.fill();
      this.runeIcon(ctx, r, cx, cy - 2, 46, on);
      if (eqd) UI.text(ctx, 'E', cx - 30, cy - 24, { size: 12, fill: '#7dffa0', stroke: 3 });
      this.hits.push({ r: { x: cx - 38, y: cy - 38, w: 76, h: 76 }, fn: () => { this.sel = r.id; Sfx.play('ui', 0.5, 1.2); } });
    });
    if (!x.runes.length) this.tx(ctx, '룬 가루로 룬을 각인해 보세요', 885, 330, 15, '#6a7090', 'center');
    // 선택한 룬
    const r = this.sel && Runes.get(this.sel);
    if (r) {
      const y0 = 480; this.panel(ctx, 546, y0, 678, 140, { fill: 'rgba(30,24,40,0.9)', r: 10 });
      this.runeIcon(ctx, r, 600, y0 + 58, 64, true);
      UI.text(ctx, Runes.name(r), 650, y0 + 40, { size: 19, fill: `rgb(${RGRADE[r.g].col})`, stroke: 3 });
      this.tx(ctx, Runes.desc(r), 650, y0 + 66, 15, '#fff'); this.tx(ctx, `강화 ${r.lv} / ${Runes.MAXLV}`, 650, y0 + 90, 13, '#9aa4c0');
      const eqd = x.eq.includes(r.id);
      this.btn(ctx, 860, y0 + 18, 170, 46, eqd ? '해제' : '장착', () => { const e = Runes.equip(r.id); if (e === 'full') this.say('슬롯이 가득 찼습니다. 먼저 하나를 해제하세요'); else Sfx.play('ui', 0.6, 1.2); }, { size: 17 });
      this.btn(ctx, 1044, y0 + 18, 170, 46, '분해', () => { const b = Runes.back(r); Runes.scrap(r); this.sel = null; this.say(`분해 :  룬 가루 +${b}`); }, { size: 17, sub: `룬 가루 +${Runes.back(r)}` });
      this.btn(ctx, 860, y0 + 76, 354, 50, r.lv >= Runes.MAXLV ? '최대 강화' : '강화', () => { const e = Runes.up(r); if (e) this.say(e); else { Sfx.play('coin', 0.6, 1.3); this.say(`${Runes.name(r)} +${r.lv}`); } }, { size: 18, sub: r.lv >= Runes.MAXLV ? '' : `룬 가루 ${Runes.upCost(r)} 소모`, can: r.lv < Runes.MAXLV && x.dust >= Runes.upCost(r) });
    }
  },

  drawPets(ctx, x) {
    const ids = Object.keys(PETS), cur = Pets.cur();
    this.panel(ctx, 40, 140, 1200, 60);
    this.tx(ctx, `펫 알 ${x.egg}개  ·  펫 먹이 ${x.food}개`, 62, 178, 16, '#fff');
    this.tx(ctx, '알은 퀘스트 · 패스 · 레이드 · 탑에서 얻습니다. 같은 펫이 나오면 먹이 3개로 바뀝니다.', 340, 176, 12, '#8c96b4');
    this.btn(ctx, 1040, 148, 180, 44, '알 부화시키기', () => this.hatch(), { can: x.egg > 0, size: 16 });
    ids.forEach((id, i) => {
      const P = PETS[id], lv = Pets.have(id), cx = 40 + i * 304, y = 216, eqd = cur === id;
      this.panel(ctx, cx, y, 292, 414, { fill: eqd ? 'rgba(70,52,14,0.88)' : 'rgba(12,10,18,0.78)', line: eqd ? '#fff1a0' : 'rgba(201,165,92,0.45)' });
      ctx.save(); ctx.globalAlpha = lv ? 1 : 0.25; if (!lv) ctx.filter = 'grayscale(1)'; Pets.draw(ctx, id, cx + 146, y + 160, 2.4, this.t + i * 20); ctx.restore();
      if (!lv) UI.text(ctx, '?', cx + 146, y + 130, { size: 60, align: 'center', fill: '#4a5070', stroke: 4 });
      UI.text(ctx, lv ? P.n : '???', cx + 146, y + 214, { size: 21, align: 'center', fill: lv ? '#fff1c0' : '#5a6080', stroke: 4 });
      if (lv) {
        this.tx(ctx, `${P.role}형  ·  Lv ${lv} / ${Pets.MAXLV}`, cx + 146, y + 240, 14, '#ffd890', 'center');
        this.tx(ctx, `${P.pu} +${(P.pv * lv * 100).toFixed(P.pv < 0.01 ? 1 : 0)}%`, cx + 146, y + 268, 14, '#7dffa0', 'center');
        this.tx(ctx, P.act, cx + 146, y + 294, 12, '#c8d0ea', 'center');
        this.btn(ctx, cx + 20, y + 312, 252, 42, eqd ? '동행 중 (해제)' : '함께 다니기', () => { x.pet = eqd ? null : id; Save.save(); Sfx.play('ui', 0.6, 1.2); }, { size: 16 });
        this.btn(ctx, cx + 20, y + 360, 252, 46, lv >= Pets.MAXLV ? '최고 레벨' : '성장시키기', () => { const e = Pets.up(id); if (e) this.say(e); else { Sfx.play('coin', 0.6, 1.3); this.say(`${P.n}  Lv ${Pets.have(id)}`); } }, { size: 15, sub: lv >= Pets.MAXLV ? '' : `먹이 ${Pets.upCost(lv)} 소모`, can: lv < Pets.MAXLV && x.food >= Pets.upCost(lv) });
      } else this.tx(ctx, '알에서 만날 수 있습니다', cx + 146, y + 280, 13, '#5a6080', 'center');
    });
  },

  drawRaid(ctx, x) {
    const R = x.raid, k = Raid.bossKey(), B = BOSS_DEFS[k], open = Raid.open();
    // 레이드
    this.panel(ctx, 40, 140, 700, 490);
    UI.text(ctx, '주간 보스 레이드', 62, 178, { size: 24, fill: '#ffe9a6', stroke: 4 });
    this.tx(ctx, `도전권 ${R.tk} / 5   (월요일에 충전)`, 718, 176, 15, R.tk ? '#7dffa0' : '#ff9a8a', 'right');
    const bgc = ctx.createLinearGradient(0, 196, 0, 340); bgc.addColorStop(0, `rgba(${B.aura},0.30)`); bgc.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = bgc; roundRect(ctx, 62, 196, 656, 150, 12); ctx.fill();
    UI.text(ctx, B.name, 390, 262, { size: 34, align: 'center', fill: '#fff', stroke: 6 });
    this.tx(ctx, `이번 주의 보스  ·  ${B.title}`, 390, 296, 15, `rgb(${B.aura})`, 'center');
    this.tx(ctx, `체력 · 공격력이 평소 보스의 약 ${Math.round(2.6 * 10) / 10}배 수준으로 강화됩니다. 쓰러지거나 나가도 입힌 피해만큼 위로금이 나옵니다.`, 390, 326, 12, '#9aa4c0', 'center');
    this.tx(ctx, '클리어 보상', 62, 378, 16, '#ffe9a6');
    [['S', '110초 이내', Raid.reward('S')], ['A', '190초 이내', Raid.reward('A')], ['B', '그 이상', Raid.reward('B')]].forEach(([g, tm, r], i) => {
      const y = 396 + i * 38; this.tx(ctx, g, 72, y + 22, 18, g === 'S' ? '#ffd24a' : g === 'A' ? '#c0a0ff' : '#9ec8ff');
      this.tx(ctx, tm, 108, y + 22, 13, '#9aa4c0'); this.tx(ctx, SX.txt(r), 220, y + 22, 13, '#e8ecf8');
    });
    this.tx(ctx, `이번 주 첫 클리어 보너스  성화 100   ·   이번 주 ${R.wins}회 클리어   ·   최고 기록 ${R.best ? R.best + '초' : '없음'}`, 62, 528, 13, '#8c96b4');
    this.btn(ctx, 62, 552, 656, 62, open ? '레이드 도전' : '잠김', () => this.raidGo(), { size: 24, can: open && R.tk > 0, sub: open ? (R.tk ? '도전권 1장 사용' : '도전권이 없습니다') : '프롤로그를 마치면 열립니다' });
    // 탑
    this.panel(ctx, 760, 140, 480, 490);
    UI.text(ctx, '무한의 탑', 782, 178, { size: 24, fill: '#ffe9a6', stroke: 4 });
    const tw = Save.data.tower, run = tw.run > 0 ? tw.run : 0;
    this.tx(ctx, `최고 ${tw.best}층   ·   보상 받은 층 ${x.twr}층`, 782, 214, 15, '#fff');
    this.tx(ctx, '10층마다 : 성화 · 룬 가루 · 골드', 782, 250, 14, '#ffd890');
    this.tx(ctx, '50층마다 : 펫 알 1개 추가', 782, 274, 14, '#ffd890');
    this.tx(ctx, `다음 보상  ${Math.max(10, (Math.floor(tw.best / 10) + 1) * 10)}층 :  ${SX.txt({ sh: 20 + (Math.floor(Math.max(tw.best, x.twr) / 10) + 1) * 4, dust: 30, gold: 20000 })}`, 782, 312, 13, '#c8d0ea');
    this.tx(ctx, '탑은 스킬 쿨타임과 부활 없이 오르는 도전 모드입니다.', 782, 346, 12, '#8c96b4');
    this.btn(ctx, 782, 552, 436, 62, Story.isOpen('tower') ? (run ? `${run + 1}층에서 이어하기` : '탑에 오르기') : '잠김', () => this.towerGo(), { size: 22, can: Story.isOpen('tower'), sub: Story.isOpen('tower') ? '' : '제2장을 마치면 열립니다' });
  },

  // 룬 각인 · 펫 부화 연출
  drawRes(ctx) {
    const o = this.res, u = clamp(this.resT / 40, 0, 1), e = 1 - Math.pow(1 - u, 3);
    ctx.fillStyle = `rgba(0,0,0,${0.75 * e})`; ctx.fillRect(0, 0, W, H);
    const col = o.type === 'rune' ? RGRADE[o.r.g].col : '255,214,120', cx = W / 2, cy = 330;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + this.resT * 0.01; ctx.fillStyle = `rgba(${col},${0.12 * e})`; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - 0.07) * 600, cy + Math.sin(a - 0.07) * 600); ctx.lineTo(cx + Math.cos(a + 0.07) * 600, cy + Math.sin(a + 0.07) * 600); ctx.closePath(); ctx.fill(); }
    drawGlow(ctx, cx, cy, 260 * e, col, 0.5); ctx.restore();
    if (o.type === 'rune') {
      this.runeIcon(ctx, o.r, cx, cy, 150 * (0.4 + 0.6 * e), true);
      UI.text(ctx, Runes.name(o.r), cx, 470, { size: 34, align: 'center', fill: `rgb(${col})`, stroke: 6 });
      this.tx(ctx, Runes.desc(o.r), cx, 506, 20, '#fff', 'center');
    } else {
      Pets.draw(ctx, o.id, cx, cy + 90, 5 * (0.4 + 0.6 * e), this.resT);
      UI.text(ctx, PETS[o.id].n, cx, 470, { size: 34, align: 'center', fill: '#fff1c0', stroke: 6 });
      this.tx(ctx, o.kind === 'new' ? '새로운 동료가 되었습니다!' : '이미 함께하는 펫입니다  →  펫 먹이 +3', cx, 506, 20, '#ffd890', 'center');
    }
    if (this.resT > 20) this.tx(ctx, Touch.on ? '화면을 누르세요' : 'Enter', cx, 580, 14, '#9aa4c0', 'center');
  },
};

// ---------- 개발자 도구 ----------
if (typeof Dev !== 'undefined') {
  Dev.sx = function () {
    const x = SX.roll(); x.dust += 1000; x.food += 100; x.egg += 5; x.pass.xp += 800; x.raid.tk = 5; Save.save();
    return `룬 가루 ${x.dust} · 먹이 ${x.food} · 알 ${x.egg} · 패스 Lv ${PASS.lv()}`;
  };
  Dev.reset2 = function () { delete Save.data.sx; SX.d(); Save.save(); return '성장 시스템 초기화'; };
  window.보급 = () => Dev.sx();
}
