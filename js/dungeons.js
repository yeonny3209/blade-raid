'use strict';
// ============================================================
//  던전 10종 정의 + 진행도 저장
//   각 던전은 테마 / 몬스터 구성 / 보스가 모두 다르다.
//   방 구성은 시드로 생성해 같은 던전은 항상 같은 배치가 나온다.
// ============================================================

// 보스 : 같은 골격을 쓰되 색·크기·머리·패턴·속성이 달라 전혀 다르게 보인다
const BOSS_DEFS = {
  varkas: {
    name: '뿔의 군주 바르카스', title: '뿔의 군주', head: 'bull', scale: 1.78,
    skin: ['#3c0f0d', '#7c2621', '#b4473b'], armor: ['#16161c', '#373945', '#6b7080'],
    aura: '255,40,20', elem: '255,110,30', hitMat: 'beast',
    patterns: ['swing', 'charge', 'leap', 'erupt'],
  },
  frostjarl: {
    name: '서리 거인 요툰', title: '얼어붙은 왕', head: 'bull', scale: 1.95,
    skin: ['#16384f', '#3d7fa6', '#7cc0e0'], armor: ['#1a2c3a', '#3f6b86', '#8fc4dd'],
    horn: ['#8fb6c9', '#dcf0fa', '#ffffff'],
    aura: '110,200,255', elem: '150,220,255', hitMat: 'ice',
    patterns: ['swing', 'leap', 'erupt'], eruptCount: 9,
  },
  gravelord: {
    name: '심층의 석귀 고르곤', title: '무너지지 않는 것', head: 'skull', scale: 2.05,
    skin: ['#2e2b26', '#5c574d', '#8a8375'], armor: ['#23201c', '#4a453c', '#7a7264'],
    aura: '200,180,120', elem: '200,170,110', hitMat: 'stone',
    patterns: ['swing', 'charge', 'erupt'], heavyHit: true,
  },
  sandking: {
    name: '모래의 파라오 네크렘', title: '잠들지 않는 왕', head: 'skull', scale: 1.8,
    skin: ['#4a3418', '#a8823c', '#e0c078'], armor: ['#3a2a10', '#c9a24a', '#f5da8e'],
    aura: '255,200,90', elem: '255,190,80', hitMat: 'bone',
    patterns: ['swing', 'charge', 'leap', 'erupt'],
  },
  plaguefen: {
    name: '역병의 모태 펜라', title: '늪의 어머니', head: 'eye', scale: 1.88,
    skin: ['#1e3a1c', '#4a7a32', '#86b055'], armor: ['#24301a', '#495c30', '#7d9350'],
    aura: '150,255,120', elem: '140,255,110', hitMat: 'flesh',
    patterns: ['swing', 'leap', 'erupt'], eruptCount: 10,
  },
  ironwarden: {
    name: '강철 감독관 CX-9', title: '멈추지 않는 기계', head: 'eye', scale: 1.85,
    skin: ['#2a2f3a', '#59616f', '#98a2b4'], armor: ['#1a1d24', '#6a7280', '#b4bccb'],
    aura: '255,170,60', elem: '255,160,50', hitMat: 'metal',
    patterns: ['swing', 'charge', 'erupt'],
  },
  stormseraph: {
    name: '천공의 심판자 세라핌', title: '빛의 집행자', head: 'bull', scale: 1.86,
    skin: ['#6a5a2a', '#d8c070', '#fff0b8'], armor: ['#8a7030', '#e8d48a', '#fff8d8'],
    horn: ['#c9a24a', '#f5e0a0', '#fffbe8'],
    aura: '255,240,160', elem: '255,240,170', hitMat: 'metal',
    patterns: ['swing', 'leap', 'erupt'], eruptCount: 11,
  },
  voidmaw: {
    name: '나락의 아가리 아즈모르', title: '모든 것을 삼키는', head: 'eye', scale: 2.15,
    skin: ['#1e0d33', '#4a2380', '#8a55c8'], armor: ['#150a24', '#3a1d60', '#6a3fa0'],
    aura: '190,110,255', elem: '190,110,255', hitMat: 'magic',
    patterns: ['swing', 'charge', 'leap', 'erupt'], eruptCount: 12,
  },
  emberfang: {
    name: '용암의 이빨 이그니스', title: '꺼지지 않는 불', head: 'bull', scale: 1.9,
    skin: ['#4a1206', '#a33c12', '#e87a30'], armor: ['#2a1208', '#7a3a18', '#c06a30'],
    aura: '255,90,20', elem: '255,110,30', hitMat: 'beast',
    patterns: ['swing', 'charge', 'leap', 'erupt'],
  },
  doomking: {
    name: '멸망의 군주 카오스', title: '종말', head: 'skull', scale: 2.2,
    skin: ['#2a0a0a', '#6a1020', '#b02840'], armor: ['#100810', '#3a1030', '#7a2060'],
    aura: '255,60,140', elem: '255,70,150', hitMat: 'beast',
    patterns: ['swing', 'charge', 'leap', 'erupt'], eruptCount: 12, heavyHit: true,
  },
};

// 몬스터 외형 변형 : 테마에 맞춰 색을 갈아입는다
const SKINS = {
  forest: null,
  ruins: { tint: '#c8b48a', amt: 0.22, pre: '고대의 ' },
  frost: { tint: '#9fd8ff', amt: 0.42, pre: '서리 ' },
  mine: { tint: '#c98a4a', amt: 0.3, pre: '광부 ' },
  desert: { tint: '#e0c078', amt: 0.36, pre: '모래 ' },
  swamp: { tint: '#7fc060', amt: 0.34, pre: '역병 ' },
  factory: { tint: '#8fa4c0', amt: 0.4, pre: '강철 ' },
  sky: { tint: '#fff0c0', amt: 0.34, pre: '천상의 ' },
  abyss: { tint: '#b070ff', amt: 0.4, pre: '심연의 ' },
  lair: { tint: '#ff7a40', amt: 0.28, pre: '화염 ' },
};

// ------------------------------------------------------------
//  던전 목록 (난이도 순)
// ------------------------------------------------------------
const DUNGEONS = [
  {
    id: 'forest', name: '어둠의 숲', theme: 'forest', lv: 62, seed: 11,
    desc: '고블린 무리가 자리잡은 밤의 숲.',
    rooms: 4, pool: [['goblin', 5], ['thrower', 2], ['orc', 1]], boss: 'varkas', mul: 1,
  },
  {
    id: 'ruins', name: '잊혀진 신전', theme: 'ruins', lv: 65, seed: 23,
    desc: '술사들이 지키는 무너진 석조 신전.',
    rooms: 4, pool: [['goblin', 3], ['mage', 3], ['orc', 2]], boss: 'gravelord', mul: 1.35,
  },
  {
    id: 'frost', name: '얼어붙은 설원', theme: 'frost', lv: 68, seed: 37,
    desc: '오로라 아래 끝없이 눈보라가 치는 벌판.',
    rooms: 5, pool: [['goblin', 3], ['thrower', 3], ['orc', 2]], boss: 'frostjarl', mul: 1.8,
  },
  {
    id: 'mine', name: '버려진 광산', theme: 'mine', lv: 71, seed: 51,
    desc: '수정이 자라난 깊은 갱도.',
    rooms: 5, pool: [['goblin', 4], ['orc', 3], ['mage', 2]], boss: 'ironwarden', mul: 2.3,
  },
  {
    id: 'desert', name: '사막의 유적', theme: 'desert', lv: 74, seed: 67,
    desc: '모래에 잠긴 파라오의 무덤.',
    rooms: 5, pool: [['thrower', 4], ['mage', 3], ['orc', 3]], boss: 'sandking', mul: 3,
  },
  {
    id: 'swamp', name: '죽음의 늪', theme: 'swamp', lv: 77, seed: 83,
    desc: '독 안개가 걷히지 않는 썩은 습지.',
    rooms: 5, pool: [['goblin', 3], ['mage', 4], ['orc', 3]], boss: 'plaguefen', mul: 3.9,
  },
  {
    id: 'factory', name: '강철 공장', theme: 'factory', lv: 80, seed: 97,
    desc: '아직도 돌아가는 기계 도시의 심장부.',
    rooms: 6, pool: [['orc', 4], ['thrower', 3], ['mage', 3]], boss: 'emberfang', mul: 5,
  },
  {
    id: 'sky', name: '천상의 회랑', theme: 'sky', lv: 83, seed: 113,
    desc: '구름 위에 떠 있는 하얀 신전.',
    rooms: 6, pool: [['mage', 4], ['orc', 4], ['goblin', 2]], boss: 'stormseraph', mul: 6.4,
  },
  {
    id: 'abyss', name: '심연의 나락', theme: 'abyss', lv: 86, seed: 131,
    desc: '별이 뒤틀린 공허의 밑바닥.',
    rooms: 6, pool: [['mage', 5], ['orc', 4], ['thrower', 2]], boss: 'voidmaw', mul: 8,
  },
  {
    id: 'lair', name: '군주의 옥좌', theme: 'lair', lv: 90, seed: 149,
    desc: '모든 것이 끝나는 화염의 왕좌.',
    rooms: 6, pool: [['orc', 5], ['mage', 4], ['goblin', 3]], boss: 'doomking', mul: 10,
  },
];
const DUNGEON_BY_ID = Object.fromEntries(DUNGEONS.map(d => [d.id, d]));

// 방 이름 (테마별로 다른 어감)
const ROOM_NAMES = {
  forest: ['숲 입구', '이끼 낀 오솔길', '고블린 야영지', '늙은 나무 아래', '달빛 공터', '숲의 심장'],
  ruins: ['무너진 정문', '기둥의 방', '봉인된 회랑', '제단 앞뜰', '피의 회랑', '신전 안쪽'],
  frost: ['눈보라 언덕', '얼음 기둥 지대', '얼어붙은 호수', '설원 한가운데', '빙하 틈새', '서리 옥좌'],
  mine: ['갱도 입구', '무너진 수직갱', '수정 광맥', '광차 정거장', '지하 수로', '가장 깊은 곳'],
  desert: ['모래 언덕', '오벨리스크 지대', '묻힌 석상', '태양의 뜰', '지하 묘실', '파라오의 방'],
  swamp: ['늪 가장자리', '독 웅덩이', '썩은 고목 지대', '안개 골짜기', '뼈 무덤', '모태의 둥지'],
  factory: ['하역장', '배관실', '용광로 앞', '조립 라인', '동력부', '제어실'],
  sky: ['구름 계단', '빛의 회랑', '천공 정원', '부유 석판', '성소 앞', '심판의 단'],
  abyss: ['균열 입구', '뒤틀린 회랑', '촉수의 숲', '무중력 지대', '속삭이는 방', '아가리'],
  lair: ['용암 다리', '화염 회랑', '재의 뜰', '녹아내린 홀', '불의 제단', '군주의 옥좌'],
};

// ------------------------------------------------------------
//  방 구성 생성 (시드 고정 → 같은 던전은 항상 같은 배치)
// ------------------------------------------------------------
function buildDungeon(d) {
  const rnd = mulberry(d.seed * 7919 + 13);
  const pick = () => {
    const tot = d.pool.reduce((s, x) => s + x[1], 0);
    let r = rnd() * tot;
    for (const [k, wgt] of d.pool) { r -= wgt; if (r <= 0) return k; }
    return d.pool[0][0];
  };
  const names = ROOM_NAMES[d.theme] || ROOM_NAMES.forest;
  const rooms = [];
  for (let i = 0; i < d.rooms; i++) {
    const width = 1800 + Math.round(rnd() * 600);
    const waves = [];
    const nWave = 2;
    for (let wv = 0; wv < nWave; wv++) {
      const cnt = 4 + Math.round(rnd() * 2) + (i > 2 ? 1 : 0);
      const list = [];
      for (let k = 0; k < cnt; k++) {
        const x = 700 + rnd() * (width - 900);
        const y = 40 + rnd() * (DEPTH - 80);
        list.push([pick(), Math.round(x), Math.round(y)]);
      }
      waves.push(list);
    }
    rooms.push({ name: names[i % names.length], theme: d.theme, width, seed: d.seed + i * 17, waves, carpet: d.theme === 'ruins' && i === d.rooms - 1 });
  }
  // 보스 방
  rooms.push({
    name: names[names.length - 1], theme: d.theme, width: 1800, seed: d.seed + 99,
    boss: true, waves: [[['boss', 1300, 115]]],
  });
  return { id: d.id, name: d.name, def: d, rooms };
}

// ------------------------------------------------------------
//  진행도 저장 (브라우저 / 앱 모두 localStorage)
// ------------------------------------------------------------
// 클리어한 던전 수에 따른 캐릭터 성장
//   던전의 난이도 배율(mul)과 같은 곡선을 따라가므로
//   순서대로 진행하면 항상 비슷한 체감 난이도가 된다.
const POWER_CURVE = [1, 1.35, 1.8, 2.3, 3, 3.9, 5, 6.4, 8, 10, 12];
function playerPower() {
  const n = Object.keys((Save.data && Save.data.cleared) || {}).length;
  return POWER_CURVE[clamp(n, 0, POWER_CURVE.length - 1)];
}
function playerLevel() {
  const n = Object.keys((Save.data && Save.data.cleared) || {}).length;
  return 60 + n * 3;
}

const Save = {
  key: 'bladeRaid.save.v1',
  data: null,

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { }
    this.data = Object.assign({ cleared: {}, best: {}, gold: 0, unlocked: 1 }, d || {});
    return this.data;
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { }
  },
  isUnlocked(i) { return i < (this.data.unlocked || 1); },
  // 클리어 기록 : 최고 랭크·점수만 갱신
  record(id, rank, score, gold) {
    const d = this.data, prev = d.best[id];
    const order = { C: 0, B: 1, A: 2, S: 3, SS: 4, SSS: 5 };
    if (!prev || (order[rank] ?? 0) > (order[prev.rank] ?? 0) || score > (prev.score || 0)) {
      d.best[id] = { rank: (!prev || (order[rank] ?? 0) > (order[prev.rank] ?? 0)) ? rank : prev.rank, score: Math.max(score, prev ? prev.score : 0) };
    }
    d.cleared[id] = (d.cleared[id] || 0) + 1;
    d.gold = (d.gold || 0) + gold;
    const idx = DUNGEONS.findIndex(x => x.id === id);
    if (idx >= 0 && idx + 2 > (d.unlocked || 1)) d.unlocked = Math.min(DUNGEONS.length, idx + 2);
    this.save();
  },
  reset() { this.data = { cleared: {}, best: {}, gold: 0, unlocked: 1 }; this.save(); },
};
