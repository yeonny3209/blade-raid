'use strict';
// ============================================================
//  메타 시스템 : 설정 / 난이도 / 장비 강화 / 무한의 탑 / 도감 · 업적
// ============================================================

// ---------- 설정 ----------
const Opt = {
  defaults: { master: 0.9, music: 0.5, sfx: 1, shake: 1, dmg: true, vib: true, voice: true },
  get() { return (Save.data && Save.data.opt) || this.defaults; },
  apply() {
    const o = this.get();
    Sfx.vol = o.master; Sfx.voiceOn = o.voice;
    if (Sfx.ctx && Sfx.master) {
      if (!Sfx.muted) Sfx.master.gain.value = o.master;
      Sfx.musicBus.gain.value = 0.6 * o.music;
      Sfx.sfxBus.gain.value = o.sfx; Sfx.wet.gain.value = o.sfx;
    }
  },
};

// ---------- 난이도 ----------
const DIFFS = [
  { id: 'easy', name: '쉬움', hp: 0.65, atk: 0.55, bossHp: 0.6, bossAtk: 0.55, gold: 0.7, col: '120,230,140', desc: '몬스터 약함 · 골드 70%' },
  { id: 'normal', name: '보통', hp: 1, atk: 1, bossHp: 1, bossAtk: 1, gold: 1, col: '140,200,255', desc: '기본 난이도' },
  { id: 'hard', name: '어려움', hp: 1.5, atk: 1.45, bossHp: 1.5, bossAtk: 1.4, gold: 1.6, col: '255,170,70', desc: '몬스터 강함 · 골드 160%' },
  { id: 'hell', name: '지옥', hp: 2.4, atk: 2.2, bossHp: 2.6, bossAtk: 2.0, gold: 3, col: '255,70,70', desc: '극한 · 골드 300%' },
];
const Diff = {
  cur() { return DIFFS.find(d => d.id === (Save.data && Save.data.diff)) || DIFFS[1]; },
  cycle(dir = 1) {
    const i = DIFFS.indexOf(this.cur());
    Save.data.diff = DIFFS[(i + dir + DIFFS.length) % DIFFS.length].id; Save.save();
  },
};

// ---------- 장비 강화 ----------
Gear.MAXLV = 15;
Gear.lv = function (id) { return (Save.data.up && Save.data.up[id]) || 0; };
Gear.label = function (it) { const l = this.lv(it.id); return l ? `${it.name} +${l}` : it.name; };
Gear.upCost = function (it) { const l = this.lv(it.id); return Math.round((3000 + it.price * 0.04) * Math.pow(l + 1, 1.25) / 100) * 100; };
Gear.upgrade = function (it) {
  const l = this.lv(it.id);
  if (l >= this.MAXLV) return 'max';
  const c = this.upCost(it);
  if ((Save.data.gold || 0) < c) return 'gold';
  Save.data.gold -= c; Save.data.up[it.id] = l + 1; Save.save();
  return 'ok';
};

// ---------- 무한의 탑 ----------
const TOWER = { id: 'tower', name: '무한의 탑', theme: 'forest', lv: 100, seed: 777, tower: true, rooms: 100, boss: 'varkas', mul: 2, pool: [['goblin', 1]], desc: '끝없이 올라가는 탑. 층마다 몬스터가 강해지고 5층마다 수호자가 기다린다.' };
DUNGEON_BY_ID.tower = TOWER;
const towerMul = floor => Math.max(1.4, playerPower() * 0.9) * Math.pow(1.06, floor - 1);

function buildTower(d) {
  const rooms = [], ALL = Object.keys(ENEMY_TYPES).filter(k => k !== 'boss' && k !== 'slimelet');
  for (let f = 1; f <= d.rooms; f++) {
    const blk = Math.floor((f - 1) / 5) % DUNGEONS.length, DD = DUNGEONS[blk], rnd = mulberry(f * 7919 + 31);
    if (f % 5 === 0) {
      rooms.push({ name: `${f}층 · 수호자`, theme: DD.theme, width: 1800, seed: DD.seed + f, boss: true, tower: true, bossId: DD.boss, blk, floor: f, waves: [[['boss', 1300, 115]]] });
      continue;
    }
    const own = DD.pool.map(q => q[0]), pick = [];
    for (let i = 0; i < 3; i++) pick.push(own[(rnd() * own.length) | 0]);
    for (let i = 0; i < 3; i++) pick.push(ALL[(rnd() * ALL.length) | 0]);
    const width = 1800 + Math.round(rnd() * 600), cnt = Math.min(10, 4 + Math.floor(f / 8) + Math.round(rnd() * 2)), waves = [];
    for (let wv = 0; wv < 2; wv++) {
      const list = [];
      for (let k = 0; k < cnt; k++) list.push([pick[(rnd() * 6) | 0], Math.round(700 + rnd() * (width - 900)), Math.round(40 + rnd() * (DEPTH - 80))]);
      waves.push(list);
    }
    rooms.push({ name: `${f}층`, theme: DD.theme, width, seed: DD.seed + f * 13, tower: true, blk, floor: f, waves });
  }
  return { id: 'tower', name: d.name, def: d, rooms };
}

// ---------- 도감 / 업적 ----------
const DEX_LORE = {
  goblin: '숲에 사는 흔한 전사. 무리 지어 달려든다.', thrower: '멀리서 돌을 던지는 투척병. 가까이 가면 도망친다.', orc: '체력이 높은 광전사. 내려찍기 전에 몸이 단단해진다.', mage: '순간이동하는 술사. 가까이 붙으면 도망친다.',
  wolf: '빠르게 주위를 돌다가 덮쳐 문다.', mushroom: '가까이 가면 포자를 터뜨린다. 멀리서 쓰러뜨려라.', skeleton: '멀리서 화살을 쏜다. 접근해서 처리하자.', gargoyle: '공중에 떠 있다가 급강하한다. 예고 원을 보고 피할 것.',
  slime: '쓰러지면 작은 슬라임 둘로 갈라진다.', slimelet: '갈라져 나온 작은 슬라임.', yeti: '정예. 내려찍기와 눈덩이를 던진다.', bat: '공중에서 낚아채듯 물고 간다.', mole: '땅속으로 숨어 발밑에서 튀어나온다. 예고 원을 주의.',
  scorpion: '긴 꼬리로 찌른다. 앞을 비워두면 위험.', mummy: '붕대로 끌어당긴 뒤 강타한다. 일직선상에 서지 말 것.', rat: '작고 빠르지만 체력이 낮다. 떼로 몰려온다.', turret: '움직이지 않고 3연발 사격. 사선에서 벗어나라.',
  drone: '멀리서 예고 후 번개를 쏜다.', aegis: '정예. 정면 공격을 막아낸다. 등 뒤를 노려라.', wisp: '주기적으로 흐려지며 무적이 된다. 그때는 기다려라.', eye: '바닥을 가르는 레이저. 예고선에서 벗어나라.',
  imp: '날아다니며 불덩이를 던진다. 바닥에 불이 남는다.', fishman: '창으로 찌르고 도약해서 내려앉는다.', pod: '뿌리박혀 씨앗을 쏜다. 접근해서 처리.', crystalling: '앞쪽으로 수정 가시를 차례로 솟게 한다.',
  'b:varkas': '뿔의 군주. 돌진, 내려찍기, 도약, 기둥 소환.', 'b:gravelord': '바위 껍질을 두르면 14번 때려 부숴야 한다. 지진선을 조심.', 'b:frostjarl': '땅속에서 솟는 비룡. 꼬리 휩쓸기는 점프로 피한다.',
  'b:ironwarden': '드릴 돌진과 바닥을 훑는 레이저(점프).', 'b:sandking': '거대한 황금 손이 내리찍는다. 따라오는 회오리를 피할 것.', 'b:plaguefen': '혀로 붙잡아 끌어당긴다. 몸통 내려찍기는 예고 원을 보고.',
  'b:emberfang': '화염방사와 포격. 돌진 뒤에 불길이 남는다.', 'b:stormseraph': '빛의 창과 십자 광선. 등 뒤로 순간이동한다.', 'b:voidmaw': '빨아들이기가 시작되면 거리를 벌려라.', 'b:doomking': '브레스를 쓸어내고 하늘에서 불비를 내린다.',
  'b:dracul': '흡혈 줄이 이어지면 멀리 떨어져 끊어내라.', 'b:prism': '굴절 광선 3줄. 수정 기둥이 충격파를 낸다.', 'b:kraken': '먹물로 시야를 가리고 소용돌이로 끌어당긴다.', 'b:deathknight': '3회 왕복 돌격. 해골을 소환한다.',
  'b:flora': '포위 덩굴은 틈으로 빠져나가야 한다.', 'b:chronarch': '회전하는 시곗바늘을 뛰어넘어라.', 'b:cyberlord': '레이저 격자는 가로 레인 → 세로 기둥 순서.', 'b:raijin': '동심원 낙뢰, 번개 줄, 구형 번개.',
  'b:galactus': '초신성은 보스 발밑만 안전하다.', 'b:azathoth': '다른 보스들의 패턴을 섞어 쓴다. 세계 분할은 반대편으로.',
};
const Dex = {
  monsters: null, bosses: null, bossIds: null,
  init() {
    this.monsters = Object.keys(ENEMY_TYPES).filter(k => k !== 'boss');
    this.bosses = Object.keys(BOSS_DEFS).map(k => 'b:' + k);
    this.bossIds = new Map(Object.entries(BOSS_DEFS).map(([k, v]) => [v, k]));
  },
  keyOf(e) { return e.isBoss ? 'b:' + (this.bossIds.get(e.def) || 'varkas') : (e.kind === 'slimelet' ? 'slime' : e.kind); },
  name(key) { return key.startsWith('b:') ? BOSS_DEFS[key.slice(2)].name : ENEMY_TYPES[key].name; },
  kills(key) { return (Save.data.dex && Save.data.dex[key]) || 0; },
  found() { return [...this.monsters.filter(k => k !== 'slimelet'), ...this.bosses].filter(k => this.kills(k) > 0).length; },
  total() { return this.monsters.filter(k => k !== 'slimelet').length + this.bosses.length; },
  kill(e) {
    if (!this.monsters) this.init();
    const k = this.keyOf(e), d = Save.data, first = !d.dex[k];
    d.dex[k] = (d.dex[k] || 0) + 1; d.stat.kills++;
    if (e.isBoss) d.stat.bosses++;
    if (first) {
      d.gold += 2000; Game.notice(`도감 등록 : ${this.name(k)}  (+2,000G)`);
      Sfx.play('clear', 0.4, 1.6); Save.save();
    }
    Ach.check();
  },
  // 미리보기용 인스턴스
  insts: {},
  inst(key) {
    if (this.insts[key]) return this.insts[key];
    let e;
    try {
    if (key.startsWith('b:')) { const d = BOSS_DEFS[key.slice(2)]; e = d.body ? new CBoss(0, 0, d) : new Boss(0, 0, d); }
    else e = makeEnemy(key, 0, 0);
    e.facing = 1; e.alpha = 1; e.visible = true; e.state = 'idle'; e.hitstop = 0; e.invul = 0;
    for (let i = 0; i < 3; i++) e.stepAnim();
    } catch (err) { e = null; }                                   // 방 밖에서 만들 수 없는 크리처는 미리보기를 건너뛴다
    return (this.insts[key] = e);
  },
  sil: null,
  draw(ctx, key, cx, base, size, known) {
    const e = this.inst(key);
    if (!e) return;
    const k = clamp(size * 0.85 / Math.max(e.h || 120, (e.w || 20) * 2.6, 110), 0.45, 1.7);
    let g = ctx;
    if (!known) { if (!this.sil) this.sil = makeCanvas(W, H); g = this.sil.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(cx - size, base - size * 1.4, size * 2, size * 1.6); }
    g.save(); g.translate(cx, base); g.scale(k, k); g.translate(0, -GROUND_Y);
    e.x = 0; e.y = 0; e.z = 0; e.stepAnim(); e.draw(g);
    g.restore();
    if (!known) {
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#10142a'; g.fillRect(cx - size, base - size * 1.4, size * 2, size * 1.6); g.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.sil, cx - size, base - size * 1.4, size * 2, size * 1.6, cx - size, base - size * 1.4, size * 2, size * 1.6);
    }
  },
};

const ACHS = [
  { id: 'k100', name: '사냥꾼', desc: '몬스터 100마리 처치', goal: 100, val: s => s.kills, gold: 10000 },
  { id: 'k1000', name: '학살자', desc: '몬스터 1,000마리 처치', goal: 1000, val: s => s.kills, gold: 60000 },
  { id: 'k10000', name: '재앙', desc: '몬스터 10,000마리 처치', goal: 10000, val: s => s.kills, gold: 300000 },
  { id: 'b5', name: '보스 사냥꾼', desc: '보스 5마리 처치', goal: 5, val: s => s.bosses, gold: 30000 },
  { id: 'b20', name: '보스 학살자', desc: '보스 20마리 처치', goal: 20, val: s => s.bosses, gold: 150000 },
  { id: 'b50', name: '왕을 베는 자', desc: '보스 50마리 처치', goal: 50, val: s => s.bosses, gold: 500000 },
  { id: 'c50', name: '연타의 맛', desc: '50콤보 달성', goal: 50, val: s => s.maxCombo, gold: 20000 },
  { id: 'c150', name: '콤보 마스터', desc: '150콤보 달성', goal: 150, val: s => s.maxCombo, gold: 80000 },
  { id: 'c300', name: '끝나지 않는 연타', desc: '300콤보 달성', goal: 300, val: s => s.maxCombo, gold: 300000 },
  { id: 'cl1', name: '첫 걸음', desc: '던전 1개 클리어', goal: 1, val: () => Object.keys(Save.data.cleared).length, gold: 5000 },
  { id: 'cl10', name: '제1지역 정복', desc: '던전 10개 클리어', goal: 10, val: () => Object.keys(Save.data.cleared).length, gold: 50000 },
  { id: 'cl20', name: '신화의 끝', desc: '던전 20개 모두 클리어', goal: 20, val: () => Object.keys(Save.data.cleared).length, gold: 300000 },
  { id: 'rs3', name: 'S랭크 사냥꾼', desc: 'S랭크 이상 던전 3개', goal: 3, val: () => Object.values(Save.data.best).filter(b => ['S', 'SS', 'SSS'].includes(b.rank)).length, gold: 30000 },
  { id: 'd10', name: '탐험가', desc: '도감 10종 등록', goal: 10, val: () => Dex.found(), gold: 20000 },
  { id: 'dall', name: '완전한 도감', desc: '도감 전부 등록', goal: 1, val: () => (Dex.found() >= Dex.total() ? 1 : 0), gold: 500000 },
  { id: 't10', name: '탑의 초입', desc: '무한의 탑 10층', goal: 10, val: () => Save.data.tower.best, gold: 40000 },
  { id: 't30', name: '탑의 중턱', desc: '무한의 탑 30층', goal: 30, val: () => Save.data.tower.best, gold: 200000 },
  { id: 't50', name: '탑의 정상', desc: '무한의 탑 50층', goal: 50, val: () => Save.data.tower.best, gold: 600000 },
  { id: 'u5', name: '대장장이의 손길', desc: '장비 +5 강화', goal: 5, val: () => Math.max(0, ...Object.values(Save.data.up)), gold: 20000 },
  { id: 'u15', name: '전설의 단련', desc: '장비 +15 강화', goal: 15, val: () => Math.max(0, ...Object.values(Save.data.up)), gold: 400000 },
  { id: 'sk100', name: '스킬 난사', desc: '스킬 100회 사용', goal: 100, val: s => s.skills, gold: 15000 },
  { id: 'h1', name: '도전자', desc: '어려움 이상으로 던전 클리어', goal: 1, val: s => s.hardClears, gold: 40000 },
  { id: 'hl', name: '지옥의 생환자', desc: '지옥 난이도로 던전 클리어', goal: 1, val: s => s.hellClears, gold: 200000 },
];
const Ach = {
  prog(a) { return Math.min(a.goal, a.val(Save.data.stat) || 0); },
  done(a) { return this.prog(a) >= a.goal; },
  claimed(a) { return !!Save.data.ach[a.id]; },
  claimable() { return ACHS.filter(a => this.done(a) && !this.claimed(a)).length; },
  claim(a) {
    if (!this.done(a) || this.claimed(a)) return false;
    Save.data.ach[a.id] = true; Save.data.gold += a.gold; Save.save();
    return true;
  },
  // 새로 달성한 업적 알림 (한 번만)
  check() {
    const d = Save.data;
    for (const a of ACHS) if (this.done(a) && !this.claimed(a) && !d.achSeen[a.id]) {
      d.achSeen[a.id] = true;
      Game.notice(`업적 달성 : ${a.name}  (도감·업적에서 보상 받기)`);
    }
  },
};
