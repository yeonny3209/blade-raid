'use strict';
// ============================================================
//  메인 스토리 「잊혀진 이름」 : 맵 · 스테이지 정의
//   - 스테이지 하나 = 방 1~3개짜리 작은 던전 (기존 던전 엔진을 그대로 쓴다)
//   - 종류(type) : kill 섬멸 / survive 생존 / defend 방어 / escort 호위 / time 돌파
//                  chase 추격 / elite 정예 / rush 연전 / boss 보스
//   - rule : 특수 규칙 (dark 어둠 · smoke 연기 · blizzard 눈보라 · poison 독안개 · blood 핏빛 달
//            nopot 물약 금지 · rage 분노 · curse 저주 · warp 시간 왜곡 · tide 해일 · lowgrav 무중력)
//   - trap : 함정 (debris 잔해 · rock 낙석 · spike 가시 · fire 화염 · pool 독 웅덩이 · arrow 화살
//            saw 톱니 · bolt 번개 · crystal 수정 가시 · barrel 폭발 통 · ice 얼음)
//   - ally : 함께 싸우는 동료 (seric · ella · youngseric · youngella · orben)
//   - mem  : 기억 회상 스테이지 (화면이 흑백 + 금빛으로 바뀐다)
//   문서 : docs/story/STORY_BIBLE.md
// ============================================================

// ---------- 맵 ----------
const SMAPS = [
  { key: 'T', name: '잿빛 해안', sub: '프롤로그', col: ['#0c1620', '#2a3e50', '#9fc4d8'] },
  { key: '1', name: '재의 고향', sub: '제1장', col: ['#1a0c08', '#4a2414', '#ff9a50'] },
  { key: '2', name: '기사의 맹세', sub: '제2장', col: ['#10121c', '#34344c', '#8ae0ff'] },
  { key: '3', name: '멈춘 시간의 탑', sub: '제3장', col: ['#0d1a30', '#3a6a8e', '#ffd070'] },
  { key: '4', name: '무너진 왕도', sub: '제4장', col: ['#160608', '#4a1420', '#ff6a50'] },
  { key: '5', name: '모래의 배신', sub: '제5장', col: ['#1a1408', '#6a4a24', '#f0c078'] },
  { key: '6', name: '가라앉은 진실', sub: '제6장', col: ['#04202a', '#0e5a70', '#a8f0ff'] },
  { key: '7', name: '심판의 하늘', sub: '제7장', col: ['#141c3a', '#5a78b0', '#fff0b8'] },
  { key: '8', name: '망각의 왕좌', sub: '제8장', col: ['#0a0414', '#3a1050', '#ff60c0'] },
  { key: 'X', name: '모든 것을 기억하는 자', sub: '진엔딩', col: ['#0a1020', '#3a4a70', '#fff0c0'], hidden: true },
];

// ---------- 새 테마의 몬스터 구성 (기존 테마는 던전 데이터를 그대로 쓴다) ----------
const STORY_POOLS = {
  shore: [['goblin', 3], ['rat', 2], ['slime', 2], ['thrower', 1]],
  village: [['goblin', 4], ['thrower', 2], ['wolf', 2], ['orc', 1]],
  kingdom: [['skeleton', 3], ['goblin', 2], ['orc', 2], ['mage', 2], ['gargoyle', 1]],
  demon: [['imp', 3], ['orc', 2], ['aegis', 1], ['mage', 2], ['wisp', 2]],
  memory: [['goblin', 3], ['thrower', 2], ['orc', 1]],
};
function storyPool(theme) {
  if (STORY_POOLS[theme]) return STORY_POOLS[theme];
  const d = DUNGEONS.find(x => x.theme === theme);
  return d ? d.pool : STORY_POOLS.village;
}

// ---------- 보스 : 기존 보스 몸체를 쓰되 스토리에 맞는 이름을 붙인다 ----------
//   [스토리 키, 기존 BOSS_DEFS 키, 이름, 칭호]
const STORY_BOSSES = [
  ['harghan', 'emberfang', '잿불 공성차 하르간', '마을을 태운 병기'],
  ['varkas', 'varkas', '뿔의 군주 바르카스', '마왕군 선봉장'],
  ['gorden', 'gravelord', '신전 수문장 고르덴', '무너지지 않는 문'],
  ['drillak', 'ironwarden', '굴착 거미 드릴락', '광맥을 파먹는 것'],
  ['crystalos', 'prism', '프리즘 핵 크리스탈로스', '기억을 삼킨 수정'],
  ['skaldir', 'frostjarl', '서리 비룡 스칼디르', '얼음 아래의 왕'],
  ['chronarch', 'chronarch', '멈춘 초침 크로나르크', '탑의 수호자'],
  ['morta', 'deathknight', '목 없는 기사 모르타', '끝나지 않는 행진'],
  ['veilun', 'dracul', '핏빛 달의 백작 베일른', '마왕군 사장군'],
  ['aspel', 'doomking', '왕도를 태운 화룡 아스펠', '하늘을 태우는 자'],
  ['penra', 'plaguefen', '역병 두꺼비 펜라', '늪의 어머니'],
  ['nekrem', 'sandking', '모래의 왕 네크렘', '잠들지 않는 왕'],
  ['flora', 'flora', '태고의 식인초 플로라', '숲의 포식자'],
  ['zero', 'cyberlord', '가라앉은 문명의 파수기 제로', '깨어난 고대 병기'],
  ['mroa', 'kraken', '심해의 군주 므로아', '파도를 부르는 자'],
  ['aurel', 'stormseraph', '빛의 집행자 아우렐', '심판의 날개'],
  ['voltar', 'raijin', '뇌운의 거인 볼타르', '폭풍을 다스리는 자'],
  ['azmor', 'voidmaw', '나락의 아가리 아즈모르', '모든 것을 삼키는'],
  ['null', 'azathoth', '이름 없는 혼돈 눌', '뒤섞인 것들의 핵'],
  ['eovan', 'galactus', '별을 삼키는 자 에오반', '성운의 포식자'],
  // 아직 전용 그림이 없는 새 보스 : 비슷한 몸체를 빌려 쓴다 (그림이 오면 교체)
  ['orben1', 'varkas', '검은 기사', '마왕의 사도', { skin: ['#141418', '#2a2a34', '#4a4a5a'], armor: ['#0a0a10', '#22222e', '#5a5a70'], aura: '120,60,255', elem: '160,90,255', head: 'skull', scale: 1.5 }],
  ['orben2', 'varkas', '오르벤', '가면을 벗은 사도', { skin: ['#2a1a14', '#5a3424', '#8a5a40'], armor: ['#0a0a10', '#22222e', '#6a6a84'], aura: '150,70,255', elem: '190,110,255', head: 'skull', scale: 1.6 }],
  ['orben3', 'varkas', '새벽을 등진 검 오르벤', '마지막 결투', { skin: ['#2a1a14', '#5a3424', '#8a5a40'], armor: ['#100818', '#2e1e44', '#8a70c0'], aura: '200,90,255', elem: '230,140,255', head: 'skull', scale: 1.7 }],
  ['yorben', 'varkas', '오르벤', '비 오는 밤', { skin: ['#2a1a14', '#5a3424', '#8a5a40'], armor: ['#1a1a24', '#34344a', '#7a7a94'], aura: '130,110,200', elem: '170,150,230', head: 'skull', scale: 1.3 }],
  ['morgrain', 'azathoth', '마왕 모르그레인', '망각에서 태어난 왕', { scale: 2.4 }],
  ['shadow', 'varkas', '그림자', '과거의 자신', { skin: ['#08080c', '#14141c', '#2a2a3a'], armor: ['#050508', '#101018', '#30304a'], aura: '80,80,120', elem: '140,140,200', head: 'skull', scale: 1.45 }],
  ['nameless', 'galactus', '이름 없는 왕', '모든 것의 끝', { scale: 2.5 }],
];
//   기존 보스는 이름을 그 자리에서 바꾼다 (도감 · 탑에서도 새 이름).  새 보스는 's_' 로 따로 만든다.
const SBOSS = {};
for (const [k, base, name, title, extra] of STORY_BOSSES) {
  const B = BOSS_DEFS[base];
  if (!B) continue;
  if (!extra) { B.name = name; B.title = title; SBOSS[k] = base; continue; }
  BOSS_DEFS['s_' + k] = Object.assign({}, B, extra, { name, title, storyBase: base });
  SBOSS[k] = 's_' + k;
}
// 오르벤은 세 번 나오지만 도감에는 한 칸
BOSS_DEFS.s_orben2.dexKey = BOSS_DEFS.s_orben3.dexKey = BOSS_DEFS.s_yorben.dexKey = 's_orben1';
BOSS_DEFS.s_orben1.storyName = '검은 기사'; BOSS_DEFS.s_orben1.name = '검은 기사 오르벤';        // 스토리에서는 정체를 숨긴다 · 도감은 본명

// ---------- 스테이지 ----------
//   st(id, 이름, 테마, 종류, 추가 설정)
const SSTAGES = [];
function st(id, name, theme, type, o = {}) {
  const [mk, nk] = id.split('-');
  const m = mk === 'T' ? 0 : +mk, n = +nk;
  SSTAGES.push(Object.assign({ id, m, n, name, theme, type }, o));
}

// 프롤로그 「잿빛 해안」
st('T-1', '비 오는 해안', 'shore', 'kill', { rooms: 1, tut: 'move', easy: 0.45 });
st('T-2', '난파선 잔해', 'shore', 'kill', { rooms: 1, tut: 'jump', easy: 0.5 });
st('T-3', '갯바위', 'shore', 'kill', { rooms: 1, tut: 'skill', easy: 0.55 });
st('T-4', '썰물 동굴', 'shore', 'survive', { sec: 40, tut: 'pot', easy: 0.6 });
st('T-5', '난파선 갑판', 'shore', 'elite', { elite: ['orc', '망령 선장', 4], easy: 0.65, unlock: 'shop' });

// 제1장 「재의 고향」
st('1-1', '불탄 마을 입구', 'village', 'kill', { rooms: 1 });
st('1-2', '무너진 광장', 'village', 'kill', { trap: 'debris' });
st('1-3', '우물가', 'village', 'escort', { who: 'fio', frag: 'f1_1' });
st('1-4', '불탄 집들', 'village', 'kill', { rule: 'smoke' });
st('1-5', '마을 중심', 'village', 'boss', { boss: 'harghan', frag: 'f1_2' });
st('1-6', '축제의 밤', 'village', 'survive', { mem: true, sec: 50, rule: 'smoke' });
st('1-7', '숲 입구', 'forest', 'kill', { pool: [['wolf', 4], ['goblin', 2], ['mushroom', 1]], frag: 'f1_3' });
st('1-8', '덩굴 길', 'forest', 'chase', { thief: ['goblin', '기억 도둑 고블린'], frag: 'f1_4' });
st('1-9', '고블린 야영지', 'forest', 'defend', { obj: '리엔의 결계', frag: 'f1_5' });
st('1-10', '늙은 나무 아래', 'forest', 'boss', { boss: 'varkas', final: true, unlock: 'hub' });

// 제2장 「기사의 맹세」
st('2-1', '무너진 정문', 'ruins', 'kill', { rooms: 1 });
st('2-2', '기둥의 방', 'ruins', 'kill', { frag: 'f2_1' });
st('2-3', '봉인된 회랑', 'ruins', 'escort', { who: 'knight' });
st('2-4', '제단 앞뜰', 'ruins', 'kill', { rule: 'dark' });
st('2-5', '신전 안쪽', 'ruins', 'boss', { boss: 'gorden' });
st('2-6', '갱도 입구', 'mine', 'kill', { trap: 'rock', frag: 'f2_2' });
st('2-7', '광차 정거장', 'mine', 'kill', { ally: 'seric' });
st('2-8', '기사 서임식', 'kingdom', 'kill', { mem: true, ally: 'youngseric' });
st('2-9', '무너진 수직갱', 'mine', 'time', { sec: 110, trap: 'rock', frag: 'f2_3' });
st('2-10', '가장 깊은 곳', 'mine', 'boss', { boss: 'drillak' });
st('2-11', '수정 입구', 'crystal', 'kill', { rooms: 1 });
st('2-12', '프리즘 동굴', 'crystal', 'kill', { rule: 'dark', frag: 'f2_4' });
st('2-13', '반짝이는 호수', 'crystal', 'defend', { obj: '수정 등불', trap: 'crystal' });
st('2-14', '빛의 갈림길', 'crystal', 'rush', { frag: 'f2_5' });
st('2-15', '거신의 심장', 'crystal', 'boss', { boss: 'crystalos', final: true, unlock: 'tower' });

// 제3장 「멈춘 시간의 탑」
st('3-1', '눈보라 언덕', 'frost', 'kill', { rooms: 1 });
st('3-2', '얼음 기둥 지대', 'frost', 'kill', { trap: 'ice', frag: 'f3_1' });
st('3-3', '얼어붙은 호수', 'frost', 'survive', { sec: 50 });
st('3-4', '설원 한가운데', 'frost', 'kill', { rule: 'blizzard' });
st('3-5', '빙하 틈새', 'frost', 'boss', { boss: 'skaldir', frag: 'f3_2' });
st('3-6', '서리 옥좌 앞', 'frost', 'kill', {});
st('3-7', '설원 야영지', 'frost', 'escort', { who: 'scout', frag: 'f3_3' });
st('3-8', '북쪽 탑의 마법사', 'clock', 'kill', { mem: true, ally: 'youngella' });
st('3-9', '무너진 설원 다리', 'frost', 'chase', { thief: ['wolf', '결정을 문 늑대'] });
st('3-10', '검은 눈', 'frost', 'boss', { boss: 'orben1', duel: 0.45 });
st('3-11', '톱니 정문', 'clock', 'kill', { rule: 'warp' });
st('3-12', '진자 회랑', 'clock', 'kill', { trap: 'saw', frag: 'f3_4' });
st('3-13', '멈춘 시침', 'clock', 'defend', { obj: '엘라의 시계' });
st('3-14', '종탑 계단', 'clock', 'rush', { frag: 'f3_5' });
st('3-15', '시간의 방', 'clock', 'boss', { boss: 'chronarch', final: true });

// 제4장 「무너진 왕도」
st('4-1', '왕도의 문', 'kingdom', 'kill', { rooms: 1 });
st('4-2', '불탄 시장', 'kingdom', 'kill', { trap: 'fire', frag: 'f4_1' });
st('4-3', '피난민의 길', 'kingdom', 'escort', { who: 'refugee' });
st('4-4', '무너진 성벽', 'kingdom', 'kill', { rule: 'smoke' });
st('4-5', '근위대 광장', 'kingdom', 'boss', { boss: 'morta', frag: 'f4_2' });
st('4-6', '묘지 정문', 'grave', 'kill', {});
st('4-7', '비석의 언덕', 'grave', 'kill', { ally: 'seric', frag: 'f4_3' });
st('4-8', '왕도 함락의 밤', 'kingdom', 'time', { mem: true, sec: 120, trap: 'fire' });
st('4-9', '지하 납골당', 'grave', 'kill', { rule: 'dark' });
st('4-10', '붉은 달 정원', 'bloodmoon', 'boss', { boss: 'veilun' });
st('4-11', '박쥐의 회랑', 'bloodmoon', 'kill', { frag: 'f4_4' });
st('4-12', '피의 연회장', 'bloodmoon', 'kill', { rule: 'blood' });
st('4-13', '고성 지하 묘실', 'bloodmoon', 'defend', { obj: '왕가의 성유물' });
st('4-14', '첨탑 계단', 'bloodmoon', 'rush', { frag: 'f4_5' });
st('4-15', '왕좌의 잿더미', 'kingdom', 'boss', { boss: 'aspel', final: true, unlock: 'hell' });

// 제5장 「모래의 배신」
st('5-1', '늪 가장자리', 'swamp', 'kill', { rooms: 1 });
st('5-2', '독 웅덩이', 'swamp', 'kill', { trap: 'pool', frag: 'f5_1' });
st('5-3', '썩은 고목 지대', 'swamp', 'escort', { who: 'healer' });
st('5-4', '안개 골짜기', 'swamp', 'kill', { rule: 'poison' });
st('5-5', '모태의 둥지', 'swamp', 'boss', { boss: 'penra', frag: 'f5_2' });
st('5-6', '모래 언덕', 'desert', 'kill', {});
st('5-7', '오벨리스크 지대', 'desert', 'kill', { ally: 'ella', frag: 'f5_3' });
st('5-8', '비 오는 밤의 결투', 'kingdom', 'boss', { mem: true, boss: 'yorben', duel: 0.35 });
st('5-9', '묻힌 석상', 'desert', 'chase', { thief: ['scorpion', '결정을 진 전갈'] });
st('5-10', '파라오의 방', 'desert', 'boss', { boss: 'nekrem' });
st('5-11', '태양의 뜰', 'desert', 'kill', { trap: 'arrow', frag: 'f5_4' });
st('5-12', '지하 묘실', 'desert', 'kill', { rule: 'nopot' });
st('5-13', '무너진 궁전', 'desert', 'defend', { obj: '오르벤 가문의 비석' });
st('5-14', '모래 폭풍', 'desert', 'rush', { frag: 'f5_5' });
st('5-15', '오르벤의 무덤', 'desert', 'boss', { boss: 'orben2', final: true, duel: 0.3 });

// 제6장 「가라앉은 진실」
st('6-1', '덩굴 입구', 'jungle', 'kill', { rooms: 1 });
st('6-2', '거대한 고사리밭', 'jungle', 'kill', { trap: 'pool', frag: 'f6_1' });
st('6-3', '폭포 아래', 'jungle', 'survive', { sec: 55 });
st('6-4', '뿌리의 미로', 'jungle', 'kill', { rule: 'dark' });
st('6-5', '식인초의 심장', 'jungle', 'boss', { boss: 'flora', frag: 'f6_2' });
st('6-6', '침몰한 입구', 'deep', 'kill', {});
st('6-7', '산호 회랑', 'deep', 'time', { sec: 100, ally: 'ella', frag: 'f6_3' });
st('6-8', '봉인을 정한 밤', 'clock', 'kill', { mem: true, ally: 'youngella' });
st('6-9', '진주 정원', 'deep', 'kill', { rule: 'tide' });
st('6-10', '난파선 잔해', 'deep', 'boss', { boss: 'zero' });
st('6-11', '심해 기둥', 'deep', 'kill', { frag: 'f6_4' });
st('6-12', '가라앉은 서고', 'deep', 'defend', { obj: '봉인의 석판' });
st('6-13', '심연의 계단', 'deep', 'kill', { trap: 'bolt' });
st('6-14', '봉인의 원형', 'deep', 'rush', { frag: 'f6_5' });
st('6-15', '크라켄의 둥지', 'deep', 'boss', { boss: 'mroa', final: true });

// 제7장 「심판의 하늘」
st('7-1', '구름 계단', 'sky', 'kill', { rooms: 1 });
st('7-2', '빛의 회랑', 'sky', 'kill', { frag: 'f7_1' });
st('7-3', '천공 정원', 'sky', 'escort', { who: 'ella' });
st('7-4', '부유 석판', 'sky', 'kill', { rule: 'curse' });
st('7-5', '심판의 단', 'sky', 'boss', { boss: 'aurel', frag: 'f7_2' });
st('7-6', '구름 절벽', 'storm', 'kill', {});
st('7-7', '번개 능선', 'storm', 'kill', { trap: 'bolt', ally: 'seric', frag: 'f7_3' });
st('7-8', '봉인 의식', 'memory', 'survive', { mem: true, sec: 60 });
st('7-9', '폭풍의 다리', 'storm', 'time', { sec: 100 });
st('7-10', '뇌신의 제단', 'storm', 'boss', { boss: 'voltar' });
st('7-11', '별의 계단', 'cosmos', 'kill', { frag: 'f7_4' });
st('7-12', '운석 정원', 'cosmos', 'kill', { rule: 'rage' });
st('7-13', '별의 문', 'cosmos', 'defend', { obj: '엘라가 남긴 빛' });
st('7-14', '별의 심장 앞', 'cosmos', 'rush', { frag: 'f7_5' });
st('7-15', '별의 제단', 'cosmos', 'boss', { boss: 'orben3', final: true });

// 제8장 「망각의 왕좌」
st('8-1', '균열 입구', 'abyss', 'kill', { rooms: 1 });
st('8-2', '뒤틀린 회랑', 'abyss', 'kill', { frag: 'f8_1' });
st('8-3', '촉수의 숲', 'abyss', 'survive', { sec: 55 });
st('8-4', '속삭이는 방', 'abyss', 'kill', { rule: 'dark' });
st('8-5', '아가리', 'abyss', 'boss', { boss: 'azmor', frag: 'f8_2' });
st('8-6', '뒤섞인 땅', 'chaos', 'kill', { mix: true });
st('8-7', '부서진 시간', 'chaos', 'kill', { rule: 'warp', ally: 'seric', frag: 'f8_3' });
st('8-8', '리엔의 기억', 'village', 'kill', { mem: true });
st('8-9', '혼돈의 소용돌이', 'chaos', 'chase', { thief: ['imp', '마지막 조각을 문 임프'] });
st('8-10', '태초의 자리', 'chaos', 'boss', { boss: 'null' });
st('8-11', '마왕의 성문', 'demon', 'kill', { ally: 'seric', frag: 'f8_4' });
st('8-12', '망각의 회랑', 'demon', 'kill', { rule: 'curse' });
st('8-13', '잊힌 자들의 홀', 'demon', 'defend', { obj: '등불 야영지의 깃발' });
st('8-14', '옥좌 앞 계단', 'demon', 'rush', { frag: 'f8_5' });
st('8-15', '망각의 왕좌', 'demon', 'boss', { boss: 'morgrain', final: true, ending: true, duel: 0.2 });

// 진엔딩
//   8-15 에서 기억 조각 40개를 모두 모은 채 「잊힌 이들의 이름을 부른다」를 고르면 열린다
st('X-1', '기억의 바다', 'memory', 'boss', { boss: 'shadow', hidden: true, rooms: 0, m: 9, n: 1 });
st('X-2', '이름 없는 왕', 'memory', 'boss', { boss: 'nameless', hidden: true, rooms: 0, ending: true, final: true, m: 9, n: 2 });

// ---------- 색인 · 강함 곡선 ----------
const SSTAGE = {};
const SMAIN = SSTAGES.filter(s => !s.hidden);                 // 본편 120개
SSTAGES.forEach((s, i) => { s.g = s.hidden ? SMAIN.length - 1 : SMAIN.indexOf(s); SSTAGE[s.id] = s; });
SMAPS.forEach((M, i) => { M.stages = SSTAGES.filter(s => s.m === i); });

// 기존 던전 배율 곡선(POWER_CURVE)을 120스테이지에 고르게 편다 : 스테이지 g 의 적 = 던전 g/6 번째 수준
function storyCurve(g) {
  const x = clamp(g / 6, 0, POWER_CURVE.length - 1), i = Math.floor(x), f = x - i;
  const a = POWER_CURVE[i], b = POWER_CURVE[Math.min(POWER_CURVE.length - 1, i + 1)];
  return a * Math.pow(b / a, f);
}
function stageMul(s) { return storyCurve(s.g) * (s.easy || 1) * (s.n === 1 && s.m === 1 ? 0.8 : 1); }
function stageLv(s) { return Math.max(1, Math.round(1 + s.g * 0.66)); }          // 권장 레벨 : 120번째 스테이지가 Lv.80 쯤
const STORY_XP = 0.76;                                                          // 스토리 경험치 배율 (전부 깨면 약 Lv.80)

// ---------- 기억 조각 40개 ----------
//   [id, 제목, 내용 3~4줄]  : 잊힌 사람들의 기억 (진엔딩의 열쇠)
const FRAGS = {};
SSTAGES.forEach(s => { if (s.frag) FRAGS[s.frag] = { id: s.frag, stage: s.id, title: '흐릿한 기억', text: ['아직 읽을 수 없는 기억이다.'] }; });
