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
    body: 'wyrm',
    name: '서리 비룡 요툰', title: '얼음 아래의 왕', head: 'bull', scale: 1.95,
    skin: ['#16384f', '#3d7fa6', '#7cc0e0'], armor: ['#1a2c3a', '#3f6b86', '#8fc4dd'],
    horn: ['#8fb6c9', '#dcf0fa', '#ffffff'],
    aura: '110,200,255', elem: '150,220,255', hitMat: 'ice',
    patterns: ['swing', 'leap', 'erupt'], eruptCount: 9,
  },
  gravelord: {
    body: 'golem',
    name: '석귀 골렘 고르곤', title: '무너지지 않는 것', head: 'skull', scale: 2.05,
    skin: ['#2e2b26', '#5c574d', '#8a8375'], armor: ['#23201c', '#4a453c', '#7a7264'],
    aura: '200,180,120', elem: '200,170,110', hitMat: 'stone',
    patterns: ['swing', 'charge', 'erupt'], heavyHit: true,
  },
  sandking: {
    body: 'pharaoh',
    name: '모래의 파라오 네크렘', title: '잠들지 않는 왕', head: 'skull', scale: 1.8,
    skin: ['#4a3418', '#a8823c', '#e0c078'], armor: ['#3a2a10', '#c9a24a', '#f5da8e'],
    aura: '255,200,90', elem: '255,190,80', hitMat: 'bone',
    patterns: ['swing', 'charge', 'leap', 'erupt'],
  },
  plaguefen: {
    body: 'toad',
    name: '역병 두꺼비 펜라', title: '늪의 어머니', head: 'eye', scale: 1.88,
    skin: ['#1e3a1c', '#4a7a32', '#86b055'], armor: ['#24301a', '#495c30', '#7d9350'],
    aura: '150,255,120', elem: '140,255,110', hitMat: 'flesh', blood: ['#3f8a22', '#9be060'],
    patterns: ['swing', 'leap', 'erupt'], eruptCount: 10,
  },
  ironwarden: {
    body: 'spider',
    name: '굴착 거미 CX-9', title: '멈추지 않는 기계', head: 'eye', scale: 1.85,
    skin: ['#2a2f3a', '#59616f', '#98a2b4'], armor: ['#1a1d24', '#6a7280', '#b4bccb'],
    aura: '255,170,60', elem: '255,160,50', hitMat: 'metal',
    patterns: ['swing', 'charge', 'erupt'],
  },
  stormseraph: {
    body: 'seraph',
    name: '천공의 심판자 세라핌', title: '빛의 집행자', head: 'bull', scale: 1.86,
    skin: ['#6a5a2a', '#d8c070', '#fff0b8'], armor: ['#8a7030', '#e8d48a', '#fff8d8'],
    horn: ['#c9a24a', '#f5e0a0', '#fffbe8'],
    aura: '255,240,160', elem: '255,240,170', hitMat: 'metal',
    patterns: ['swing', 'leap', 'erupt'], eruptCount: 11,
  },
  voidmaw: {
    body: 'maw',
    name: '나락의 아가리 아즈모르', title: '모든 것을 삼키는', head: 'eye', scale: 2.15,
    skin: ['#1e0d33', '#4a2380', '#8a55c8'], armor: ['#150a24', '#3a1d60', '#6a3fa0'],
    aura: '190,110,255', elem: '190,110,255', hitMat: 'magic',
    patterns: ['swing', 'charge', 'leap', 'erupt'], eruptCount: 12,
  },
  emberfang: {
    body: 'furnace',
    name: '용광로 전차 이그니스', title: '꺼지지 않는 불', head: 'bull', scale: 1.9,
    skin: ['#4a1206', '#a33c12', '#e87a30'], armor: ['#2a1208', '#7a3a18', '#c06a30'],
    aura: '255,90,20', elem: '255,110,30', hitMat: 'beast',
    patterns: ['swing', 'charge', 'leap', 'erupt'],
  },
  doomking: {
    body: 'dragon',
    name: '종말의 화룡 카오스', title: '하늘을 태우는 자', head: 'skull', scale: 2.2,
    skin: ['#2a0a0a', '#6a1020', '#b02840'], armor: ['#100810', '#3a1030', '#7a2060'],
    aura: '255,60,140', elem: '255,70,150', hitMat: 'beast',
    patterns: ['swing', 'charge', 'leap', 'erupt'], eruptCount: 12, heavyHit: true,
  },

  // ---------------- 제2지역 보스 ----------------
  dracul: {
    body: 'vampire',
    name: '피의 백작 드라쿨', title: '핏빛 달의 주인', head: 'skull', scale: 1.9,
    skin: ['#2a0810', '#7a1428', '#c03048'], armor: ['#100408', '#3a0e1c', '#8a2040'],
    aura: '255,40,80', elem: '255,50,90', hitMat: 'flesh', blood: ['#a01020', '#e03050'],
    patterns: ['swing', 'leap', 'beam', 'summon'], eruptCount: 8,
  },
  prism: {
    body: 'crystal',
    name: '프리즘 핵 크리스탈로스', title: '빛을 가르는 자', head: 'eye', scale: 2.1,
    skin: ['#2a3a6a', '#7aa0e0', '#d8f0ff'], armor: ['#3a2a6a', '#a080e0', '#f0d8ff'], horn: ['#a0e0ff', '#e8f8ff', '#ffffff'],
    aura: '160,220,255', elem: '190,170,255', hitMat: 'ice',
    patterns: ['swing', 'nova', 'erupt', 'rain'], heavyHit: true, eruptCount: 9,
  },
  kraken: {
    body: 'kraken',
    name: '심해의 군주 크라켄', title: '파도를 부르는 자', head: 'eye', scale: 2.1,
    skin: ['#0a2a3a', '#1e6a8a', '#58b8d8'], armor: ['#0a1e2a', '#1a4a64', '#4a98b8'],
    aura: '80,200,240', elem: '80,190,255', hitMat: 'flesh', blood: ['#1e6a8a', '#58b8d8'],
    patterns: ['charge', 'rain', 'nova', 'summon'],
  },
  deathknight: {
    body: 'horseman',
    name: '목 없는 기사 모르타', title: '끝나지 않는 행진', head: 'skull', scale: 1.85,
    skin: ['#1a1e24', '#4a5560', '#8a98a8'], armor: ['#0a0c10', '#2a3038', '#68788a'],
    aura: '140,255,220', elem: '120,255,210', hitMat: 'bone',
    patterns: ['swing', 'charge', 'summon', 'beam'],
  },
  flora: {
    body: 'flytrap',
    name: '태고의 식인초 플로라', title: '숲의 포식자', head: 'eye', scale: 2.1,
    skin: ['#10300e', '#3a8a2a', '#8ad048'], armor: ['#1a2a10', '#4a6a20', '#98c040'],
    aura: '160,255,100', elem: '170,255,90', hitMat: 'flesh', blood: ['#5aa020', '#b0e050'],
    patterns: ['erupt', 'summon', 'rain', 'swing'], eruptCount: 12,
  },
  chronarch: {
    body: 'clock',
    name: '시간의 지배자 크로나르크', title: '멈춰버린 초침', head: 'bull', scale: 1.95,
    skin: ['#3a2a10', '#a8803a', '#f0d080'], armor: ['#2a1e08', '#8a6a28', '#e8c868'], horn: ['#8a6a28', '#d8b050', '#fff0b0'],
    aura: '255,220,120', elem: '150,230,255', hitMat: 'metal',
    patterns: ['swing', 'charge', 'nova', 'rain'],
  },
  cyberlord: {
    body: 'cyber',
    name: '사이버 군주 ZX-0', title: '네온의 지배자', head: 'eye', scale: 2.0,
    skin: ['#1a1030', '#5a30a0', '#c060ff'], armor: ['#0a0818', '#302060', '#ff40d0'],
    aura: '255,60,220', elem: '60,240,255', hitMat: 'metal',
    patterns: ['beam', 'charge', 'rain', 'summon'],
  },
  raijin: {
    body: 'oni',
    name: '뇌신 라이진', title: '폭풍을 다스리는 자', head: 'bull', scale: 2.0,
    skin: ['#20284a', '#5a6ab0', '#c0d0ff'], armor: ['#10162e', '#3a4a88', '#ffe060'], horn: ['#c9a24a', '#ffe060', '#fff8c0'],
    aura: '255,240,100', elem: '255,240,90', hitMat: 'metal',
    patterns: ['leap', 'beam', 'erupt', 'nova'], eruptCount: 14,
  },
  galactus: {
    body: 'cosmic',
    name: '별을 삼키는 자 갤럭투스', title: '성운의 포식자', head: 'eye', scale: 2.15,
    skin: ['#140a30', '#4a2a9a', '#a888ff'], armor: ['#0a0620', '#2a1a68', '#ffd860'],
    aura: '160,130,255', elem: '255,220,120', hitMat: 'magic',
    patterns: ['rain', 'beam', 'nova', 'summon', 'leap'], heavyHit: true, eruptCount: 12,
  },
  azathoth: {
    body: 'chaos',
    name: '태초의 혼돈 아자토스', title: '모든 것의 끝', head: 'skull', scale: 2.3,
    skin: ['#200418', '#7a1060', '#ff40b0'], armor: ['#100010', '#4a0848', '#ff60d0'], horn: ['#ff40b0', '#ffa0e0', '#ffffff'],
    aura: '255,70,200', elem: '255,80,200', hitMat: 'beast',
    patterns: ['swing', 'charge', 'leap', 'erupt', 'rain', 'nova', 'summon', 'beam'], heavyHit: true, eruptCount: 14,
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
  bloodmoon: { tint: '#d02040', amt: 0.3, pre: '피에 젖은 ' },
  crystal: { tint: '#a8b0ff', amt: 0.38, pre: '수정 ' },
  deep: { tint: '#4aa0c0', amt: 0.4, pre: '심해 ' },
  grave: { tint: '#9aa0a8', amt: 0.46, pre: '망자의 ' },
  jungle: { tint: '#6ad050', amt: 0.3, pre: '밀림 ' },
  clock: { tint: '#d8b060', amt: 0.38, pre: '태엽 ' },
  neon: { tint: '#ff40d0', amt: 0.34, pre: '네온 ' },
  storm: { tint: '#ffe060', amt: 0.3, pre: '폭풍 ' },
  cosmos: { tint: '#8080ff', amt: 0.4, pre: '성운 ' },
  chaos: { tint: '#ff4090', amt: 0.4, pre: '혼돈의 ' },
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

  // ===================== 제2지역 : 신화의 땅 =====================
  {
    id: 'bloodmoon', name: '핏빛 달의 성', theme: 'bloodmoon', lv: 94, seed: 163,
    desc: '붉은 달 아래 흡혈귀가 군림하는 고성.',
    rooms: 5, pool: [['mage', 4], ['goblin', 3], ['orc', 3]], boss: 'dracul', mul: 14.4,
  },
  {
    id: 'crystal', name: '수정 심연 동굴', theme: 'crystal', lv: 97, seed: 179,
    desc: '무지갯빛 수정이 빛나는 거대한 지하 공동.',
    rooms: 5, pool: [['mage', 3], ['orc', 4], ['thrower', 3]], boss: 'prism', mul: 17.4,
  },
  {
    id: 'deep', name: '가라앉은 해저 신전', theme: 'deep', lv: 100, seed: 197,
    desc: '바다 밑에 잠든 고대 신전.',
    rooms: 5, pool: [['thrower', 4], ['goblin', 3], ['mage', 3]], boss: 'kraken', mul: 21,
  },
  {
    id: 'grave', name: '망자의 공동묘지', theme: 'grave', lv: 103, seed: 211,
    desc: '안개 속에서 망자들이 일어서는 묘지.',
    rooms: 6, pool: [['goblin', 5], ['orc', 3], ['mage', 2]], boss: 'deathknight', mul: 25,
  },
  {
    id: 'jungle', name: '태고의 밀림', theme: 'jungle', lv: 106, seed: 227,
    desc: '거대한 식물이 모든 것을 삼키는 정글.',
    rooms: 6, pool: [['goblin', 4], ['thrower', 3], ['orc', 3]], boss: 'flora', mul: 30,
  },
  {
    id: 'clock', name: '멈춰버린 시계탑', theme: 'clock', lv: 109, seed: 241,
    desc: '톱니바퀴가 시간을 갉아먹는 탑.',
    rooms: 6, pool: [['orc', 4], ['mage', 3], ['thrower', 3]], boss: 'chronarch', mul: 36,
  },
  {
    id: 'neon', name: '네온 폐허 도시', theme: 'neon', lv: 112, seed: 257,
    desc: '비 내리는 밤, 네온이 깜빡이는 미래의 폐허.',
    rooms: 6, pool: [['thrower', 4], ['orc', 3], ['mage', 3]], boss: 'cyberlord', mul: 42,
  },
  {
    id: 'storm', name: '뇌운의 고원', theme: 'storm', lv: 115, seed: 271,
    desc: '번개가 끊이지 않는 하늘 위 고원.',
    rooms: 6, pool: [['mage', 4], ['goblin', 3], ['orc', 3]], boss: 'raijin', mul: 49,
  },
  {
    id: 'cosmos', name: '은하 정거장', theme: 'cosmos', lv: 118, seed: 283,
    desc: '별과 성운 사이에 떠 있는 정거장.',
    rooms: 7, pool: [['mage', 4], ['orc', 4], ['thrower', 2]], boss: 'galactus', mul: 58,
  },
  {
    id: 'chaos', name: '혼돈의 근원', theme: 'chaos', lv: 122, seed: 307,
    desc: '모든 것이 시작되고 끝나는 최후의 장소.',
    rooms: 7, pool: [['orc', 5], ['mage', 4], ['goblin', 3]], boss: 'azathoth', mul: 67,
  },
];
const MAPS = [
  { name: '제1지역', sub: '저주받은 대륙', from: 0, to: 10 },
  { name: '제2지역', sub: '신화의 땅', from: 10, to: 20 },
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
  bloodmoon: ['붉은 달 정원', '박쥐의 회랑', '피의 연회장', '고성 지하 묘실', '첨탑 계단', '백작의 침실'],
  crystal: ['수정 입구', '프리즘 동굴', '반짝이는 호수', '결정 숲', '빛의 갈림길', '거신의 심장'],
  deep: ['침몰한 입구', '산호 회랑', '진주 정원', '난파선 잔해', '심해 기둥', '크라켄의 둥지'],
  grave: ['묘지 정문', '비석의 언덕', '안개 낀 무덤길', '지하 납골당', '썩은 예배당', '기사의 묘'],
  jungle: ['덩굴 입구', '거대한 고사리밭', '독꽃 군락', '폭포 아래', '뿌리의 미로', '식인초의 심장'],
  clock: ['톱니 정문', '진자 회랑', '멈춘 시침', '태엽 창고', '종탑 계단', '시간의 방'],
  neon: ['빗속의 골목', '깨진 간판 거리', '홀로그램 광장', '폐쇄된 지하철', '옥상 정원', '군주의 서버실'],
  storm: ['구름 절벽', '번개 능선', '폭풍의 다리', '낙뢰 평원', '신의 계단', '뇌신의 제단'],
  cosmos: ['정거장 입구', '무중력 회랑', '성운 전망대', '운석 정원', '블랙홀 앞', '별의 심장'],
  chaos: ['균열의 문턱', '뒤섞인 땅', '부서진 시간', '혼돈의 소용돌이', '모든 색의 방', '태초의 자리'],
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
const POWER_CURVE = [1, 1.35, 1.8, 2.3, 3, 3.9, 5, 6.4, 8, 10, 12, 14.5, 17.5, 21, 25, 30, 35, 41, 48, 56, 66];
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
    // 예전 저장 : 던전이 10개뿐일 때는 마지막 던전을 깨도 해금 수가 10에서 멈췄다 → 클리어 기록으로 다시 계산
    let hi = 0;
    DUNGEONS.forEach((dd, i) => { if (this.data.cleared && this.data.cleared[dd.id]) hi = Math.max(hi, i + 2); });
    this.data.unlocked = Math.min(DUNGEONS.length, Math.max(this.data.unlocked || 1, hi));
    this.data.owned = Object.assign({ w: ['w0'], a: ['a0'] }, this.data.owned || {});
    this.data.eq = Object.assign({ w: 'w0', a: 'a0' }, this.data.eq || {});
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
  // 던전을 클리어하지 못하고 끝나도 주운 골드는 가져간다
  bank(g) { if (g > 0) { this.data.gold = (this.data.gold || 0) + g; this.save(); } },
  reset() { this.data = { cleared: {}, best: {}, gold: 0, unlocked: 1, owned: { w: ['w0'], a: ['a0'] }, eq: { w: 'w0', a: 'a0' } }; this.save(); },
};
