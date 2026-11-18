'use strict';
// ============================================================
//  스킬 트리 「검의 성좌」
//   - 가운데 별 「검심」에서 네 갈래 길이 뻗어 나가는 별자리 판
//       파검(평타 · 치명) / 유검(Q · E · T · F) / 비기(G · R · MP) / 수호(체력 · 방어 · 회복)
//     갈래 사이에는 두 길을 잇는 「다리 별」이 있다
//   - 이미 밝힌 별과 선으로 이어진 별만 밝힐 수 있다
//   - 별의 종류 : 소성(능력치) · 명성(특수 효과) · 극성(새 기술 · 택일 오의)
//   - 한 갈래를 모두 밝히면 「성좌 완성」 보너스
//   - 저장 : Save.data.sk  (예전 트리 Save.data.tree 는 쓰지 않는다 → 포인트는 레벨로 계산되므로 모두 돌려받는다)
// ============================================================

const SK_UX = 96, SK_UY = 70;                                    // 별자리 좌표 눈금 (가로 · 세로)
const SK_GOLD = '255,214,110';
const SK_AWK_KEY = 'Y';
const SK_ARMS = {
  p: { name: '파검의 길', short: '파검', han: '破 劍', col: '255,112,84', th: 180, lab: 4.5, done: '모든 피해 +5%', sub: '평타 · 치명 · 연격' },
  s: { name: '유검의 길', short: '유검', han: '流 劍', col: '96,186,255', th: 0, lab: 5.5, done: '스킬(Q·E·T·F) 쿨타임 -5%', sub: 'Q · E · T · F 스킬' },
  w: { name: '비기의 길', short: '비기', han: '秘 技', col: '226,120,255', th: 270, lab: 5.1, done: '검 고유 스킬(G·R) 피해 +10%', sub: '검 고유 스킬 · MP' },
  v: { name: '수호의 길', short: '수호', han: '守 護', col: '110,235,160', th: 90, lab: 5.1, done: '최대 HP +8%', sub: '체력 · 방어 · 회복' },
};
const SK_ARM_KEYS = ['p', 's', 'w', 'v'];
const SK_TYPE = {
  core: { name: '근원', R: 44, view: 50 },
  s: { name: '소성', R: 20, view: 38 },
  n: { name: '명성', R: 27, view: 42 },
  k: { name: '극성', R: 35, view: 48 },
  a: { name: '각성', R: 46, view: 54 },
};

// 능력치 : [설명, 단위, 부호(+1 늘어남 / -1 줄어듦), 짧은 이름]
const SK_STAT = {
  all: ['모든 피해', '%', 1, '모든 피해'],
  basic: ['평타 피해', '%', 1, '평타'],
  a4: ['4번째 평타 · 대시 공격 피해', '%', 1, '4타 · 대시'],
  air: ['공중 평타 피해', '%', 1, '공중 평타'],
  crit: ['치명타율', '%', 1, '치명타율'],
  critD: ['치명타 피해', '%', 1, '치명 피해'],
  back: ['배후 공격 · 반격 피해', '%', 1, '배후 · 반격'],
  flow: ['콤보 10마다 피해 (최대 10번)', '%', 1, '콤보 피해'],
  exec: ['체력 30% 이하인 적에게 주는 피해', '%', 1, '처형'],
  drain: ['평타 적중 시 최대 HP 회복', '%', 1, '흡혈'],
  sk: ['스킬(Q·E·T·F) 피해', '%', 1, '스킬 피해'],
  s1: ['어퍼 슬래시 피해', '%', 1, 'Q 피해'], cd1: ['어퍼 슬래시 쿨타임', '%', -1, 'Q 쿨'],
  s2: ['돌진참 피해', '%', 1, 'E 피해'], cd2: ['돌진참 쿨타임', '%', -1, 'E 쿨'],
  s3: ['삼단베기 피해', '%', 1, 'T 피해'], cd3: ['삼단베기 쿨타임', '%', -1, 'T 쿨'],
  s4: ['발도 : 섬 피해', '%', 1, 'F 피해'], cd4: ['발도 : 섬 쿨타임', '%', -1, 'F 쿨'],
  cdAll: ['스킬(Q·E·T·F) 쿨타임', '%', -1, '스킬 쿨'],
  mpAll: ['모든 스킬 MP 소모', '%', -1, 'MP 소모'],
  skCrit: ['스킬(Q·E·T·F) 치명타율', '%', 1, '스킬 치명'],
  wsk: ['검 고유 스킬(G·R) 피해', '%', 1, 'G · R 피해'],
  wCrit: ['검 고유 스킬 치명타율', '%', 1, 'G · R 치명'],
  cdW: ['검 고유 스킬(G·R) 쿨타임', '%', -1, 'G · R 쿨'],
  mpRet: ['스킬 MP 환급', '%', 1, 'MP 환급'],
  mpReg: ['MP 재생', '%', 1, 'MP 재생'],
  mpMax: ['최대 MP', '%', 1, '최대 MP'],
  hp: ['최대 HP', '%', 1, '최대 HP'],
  def: ['받는 피해', '%', -1, '받는 피해'],
  move: ['이동속도', '%', 1, '이동속도'],
  dodge: ['공격을 흘려 피할 확률', '%', 1, '회피'],
  regen: ['3초간 맞지 않으면 1초마다 최대 HP 회복', '%', 1, '자연 회복'],
  kill: ['적을 쓰러뜨리면 최대 HP 회복', '%', 1, '처치 회복'],
  killCd: ['적을 쓰러뜨리면 스킬(Q·E·T·F) 쿨타임', '초', -1, '처치 쿨감'],
  pot: ['회복약 효과', '%', 1, '회복약'],
};
const skNum = (k, v) => SK_STAT[k][1] === '초' ? `${+v.toFixed(2)}초` : `${+(v * 100).toFixed(2)}%`;
const skLine = (k, v) => { const [l, , s] = SK_STAT[k]; return `${l} ${s > 0 ? '+' : '-'}${skNum(k, v)}`; };
// 받침에 따라 조사 고르기 : jo('검심', '을', '를') → '검심을'
// 줄바꿈 : 띄어쓰기 단위로 자르고, 한 낱말이 너무 길 때만 글자 단위로 자른다
const skWrap = (ctx, str, maxW, size) => {
  ctx.font = `700 ${size}px ${FONT_B}`;
  const out = []; let cur = '';
  for (const wd of str.split(' ')) {
    const nx = cur ? cur + ' ' + wd : wd;
    if (ctx.measureText(nx).width <= maxW) { cur = nx; continue; }
    if (cur) out.push(cur);
    if (ctx.measureText(wd).width <= maxW) cur = wd;
    else { const parts = Shop.wrap(ctx, wd, maxW, size); cur = parts.pop(); out.push(...parts); }
  }
  if (cur) out.push(cur);
  return out;
};
const jo = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };

// ---------- 별 ----------
//  r : 가운데에서 떨어진 거리(고리) · off : 갈래 방향에서 벌어진 각도(도) · type : core / s / n / k
//  fx : 랭크마다 오르는 능력치 · key : 특수 효과 · ex : 택일 묶음 · req : 먼저 배워야 하는 별 · lv : 필요한 레벨
const SKN = [];
const skn = (id, arm, r, off, type, max, name, g, fx, o) => SKN.push(Object.assign({ id, arm, r, off, type, max, name, g, fx: fx || null }, o || {}));

skn('core', 'core', 0, 0, 'core', 1, '검심', 'bigsword', null, { d: '모든 별의 시작. 이 별과 선으로 이어진 별부터 차례로 밝힐 수 있다.' });

// 파검의 길 (왼쪽) : 평타 · 치명 · 연격
skn('p1', 'p', 1.22, 0, 's', 5, '날 세우기', 'dagger', { basic: 0.04 });
skn('p2', 'p', 2.1, 21, 's', 5, '급소 노리기', 'constellation', { crit: 0.02 });
skn('p3', 'p', 2.1, -21, 's', 3, '연격', 'zigzag', { a4: 0.12 });
skn('p4', 'p', 2.85, 0, 'n', 2, '흡혈 검기', 'drop', { drain: 0.0035 }, { lv: 8 });
skn('p5', 'p', 3.45, 27, 's', 3, '치명상', 'shatter', { critD: 0.12 });
skn('p6', 'p', 3.45, -27, 's', 3, '공중 추격', 'tornado', { air: 0.12 });
skn('p7', 'p', 3.75, 0, 'n', 1, '흐르는 검', 'spin', { flow: 0.025 }, { lv: 12 });
skn('p8', 'p', 4.5, 13, 'k', 1, '검귀의 일격', 'crescent', null, { key: 'wave', ex: 'p', lv: 20, d: '4번째 평타가 초승달 검기를 날려 앞의 적을 모두 꿰뚫는다 (공격력 250%)' });
skn('p9', 'p', 4.5, -13, 'k', 1, '광전사의 피', 'moonred', null, { key: 'rage', ex: 'p', lv: 20, d: 'HP가 50% 이하이면 주는 피해 +30%, 평타 흡혈이 2배가 된다. 대신 받는 피해가 늘 10% 많아진다' });

// 유검의 길 (오른쪽) : Q · E · T · F
skn('s1', 's', 1.22, 0, 's', 5, '검의 집중', 'orbit', { sk: 0.03 });
skn('sq', 's', 2.25, -38, 's', 5, '어퍼 강화', '@upper', { s1: 0.08, cd1: 0.03 });
skn('se', 's', 2.25, -13, 's', 5, '돌진 강화', '@rush', { s2: 0.08, cd2: 0.03 });
skn('st', 's', 2.25, 13, 's', 5, '삼단 강화', '@triple', { s3: 0.08, cd3: 0.03 });
skn('sf', 's', 2.25, 38, 's', 5, '발도 강화', '@draw', { s4: 0.08, cd4: 0.03 });
skn('sh', 's', 3.0, -26, 'n', 3, '질풍의 손', 'hourglass', { cdAll: 0.04 }, { lv: 8 });
skn('sl', 's', 3.0, 0, 'n', 1, '검류 연계', 'link', null, { key: 'link', lv: 10, d: '스킬(Q·E·T·F)을 쓰면 2.5초 동안 평타 피해 +20%' });
skn('sb', 's', 3.0, 26, 'n', 3, '호흡 조절', 'snow', { mpAll: 0.06 }, { lv: 8 });
skn('kq', 's', 4.05, -36, 'k', 1, '천공참', '@upper', null, { key: 'quake', req: 'sq', lv: 15, d: '어퍼 슬래시를 쓰면 주변 모든 적이 충격파에 함께 떠오른다 (공격력 300%)' });
skn('ke', 's', 3.95, -14, 'k', 1, '잔상 돌격', '@rush', null, { key: 'ghost', req: 'se', lv: 15, d: '돌진이 끝나면 잔상이 같은 길을 되짚어 달리며 한 번 더 벤다 (공격력 350%)' });
skn('kt', 's', 3.95, 14, 'k', 1, '사단베기', '@triple', null, { key: 'fourth', req: 'st', lv: 15, d: '삼단베기 끝에 X자 마무리 베기가 하나 더 이어진다 (공격력 600%)' });
skn('kf', 's', 4.05, 36, 'k', 1, '연속 발도', '@draw', null, { key: 'echo', req: 'sf', lv: 15, d: '발도가 끝나면 같은 길을 한 번 더 가르는 잔영이 남는다 (공격력 900%)' });
skn('sr', 's', 4.7, 0, 'k', 1, '연환', 'cycle', null, { key: 'chain', lv: 30, d: '스킬(Q·E·T·F)을 쓸 때마다 다른 세 스킬의 쿨타임이 0.6초씩 줄어든다' });

// 비기의 길 (위) : 검 고유 스킬 · MP
skn('w1', 'w', 1.22, 0, 's', 5, '검의 공명', 'rift', { wsk: 0.06 });
skn('w2', 'w', 2.1, -25, 's', 5, '명상', 'lotus', { mpReg: 0.08 });
skn('w3', 'w', 2.1, 25, 's', 3, '각성 가속', 'clock', { cdW: 0.06 });
skn('w4', 'w', 2.8, 0, 'n', 3, '마력 순환', 'portal', { mpRet: 0.06 }, { lv: 8 });
skn('w5', 'w', 3.45, -27, 's', 3, '마나의 그릇', 'geyser', { mpMax: 0.1 });
skn('w6', 'w', 3.45, 27, 's', 3, '비기의 날', 'meteors', { wCrit: 0.05 });
skn('w7', 'w', 4.0, 0, 'n', 1, '심안', 'eye', null, { key: 'eye', lv: 12, d: '검 고유 스킬(G·R)을 쓰면 4초 동안 모든 공격의 치명타율 +15%' });
skn('w8', 'w', 4.65, -13, 'k', 1, '극의', 'eclipse', null, { key: 'zen', ex: 'w', lv: 25, d: '각성기(R)를 쓴 뒤 6초 동안 다른 스킬의 쿨타임이 2배 빨리 돈다' });
skn('w9', 'w', 4.65, 13, 'k', 1, '마나 방패', 'barrier', null, { key: 'mshield', ex: 'w', lv: 25, d: '받는 피해의 25%를 MP가 대신 받는다 (MP가 남아 있는 동안)' });

// 수호의 길 (아래) : 체력 · 방어 · 회복
skn('v1', 'v', 1.22, 0, 's', 5, '강인한 육체', 'shield', { hp: 0.04 });
skn('v2', 'v', 2.1, 25, 's', 5, '단련된 피부', 'helmet', { def: 0.02 });
skn('v3', 'v', 2.1, -25, 's', 3, '바람걸음', 'wind', { move: 0.03 });
skn('v4', 'v', 2.8, 0, 'n', 2, '생명의 맥', 'heart', { regen: 0.006 }, { lv: 8 });
skn('v5', 'v', 3.45, 27, 's', 3, '흘려보내기', 'feather', { dodge: 0.03 });
skn('v6', 'v', 3.45, -27, 's', 3, '사냥꾼의 숨', 'fang', { kill: 0.01 });
skn('v7', 'v', 4.0, 0, 'n', 3, '약초 지식', 'potion', { pot: 0.15 }, { lv: 12 });
skn('v8', 'v', 4.65, 13, 'k', 1, '불굴', 'angel', null, { key: 'undying', ex: 'v', lv: 20, d: '방(층)마다 한 번, 쓰러질 피해를 받아도 HP 30%로 버티고 2초 동안 무적이 된다' });
skn('v9', 'v', 4.65, -13, 'k', 1, '철벽', 'fortress', null, { key: 'iron', ex: 'v', lv: 20, d: '받는 피해 -15%, 넉백 저항 +60%. 무거운 공격에도 쉽게 밀려나지 않는다' });

// 다리 별 : 두 갈래 사이
skn('b1', 'p', 3.2, 0, 's', 3, '처형자', 'guillotine', { exec: 0.08 }, { th: 225, arm2: 'w' });
skn('b2', 's', 3.2, 0, 's', 3, '전투 감각', 'star4', { skCrit: 0.04 }, { th: 315, arm2: 'w' });
skn('b3', 's', 3.2, 0, 's', 2, '사냥 본능', 'boomerang', { killCd: 0.25 }, { th: 45, arm2: 'v' });
skn('b4', 'p', 3.2, 0, 's', 3, '역습', 'fist', { back: 0.1 }, { th: 135, arm2: 'v' });

// 각성 : 갈래의 모든 별을 하나씩 밝히면 열린다 (랭크는 상관없음 · 스킬 포인트는 쓰지 않는다 · Y 키로 사용)
const SK_AWK = {
  p: {
    name: '파천멸검', han: '破天滅劍', sub: '破 天 滅 劍', g: 'awk_p', mp: 600, cd: 60, pos: [-505, -170], tips: ['p8', 'p9'],
    d: '무적 상태로 앞을 질주하며 12번 베고, 하늘로 뛰어올라 거대한 검기를 내리꽂는다. 적중한 적은 7초 동안 방어가 무너져 받는 피해가 35% 늘어난다.',
    brief: '질주 12연참 + 천공 강타 (공격력 약 8,000%)',
  },
  s: {
    name: '만검귀종', han: '萬劍歸宗', sub: '萬 劍 歸 宗', g: 'awk_s', mp: 600, cd: 60, pos: [505, 170], tips: ['sr'],
    d: '검의 영혼 36자루를 하늘에서 쏟아 모든 적을 차례로 꿰뚫고, 마지막에 거대한 검 한 자루가 내리꽂힌다. 끝나면 스킬 쿨타임이 모두 초기화되고 8초 동안 쿨타임이 2배 빨리 돈다.',
    brief: '검 36자루 + 거대한 검 낙하 · 쿨타임 초기화',
  },
  w: {
    name: '차원절', han: '次元絶', sub: '次 元 絶', g: 'awk_w', mp: 600, cd: 60, pos: [265, -335], tips: ['w8', 'w9'],
    d: '시공을 가르는 균열을 열어 화면의 모든 적을 붙잡고 수십 번 베어낸다. 균열이 닫히면 모두 한 점으로 끌려가 소멸한다. MP가 가득 차고 10초 동안 MP가 빠르게 차오른다.',
    brief: '시간 정지 연속 차원 절단 + 특이점 붕괴 · MP 가득',
  },
  v: {
    name: '불사성광', han: '不死聖光', sub: '不 死 聖 光', g: 'awk_v', mp: 600, cd: 60, pos: [-265, 335], tips: ['v8', 'v9'],
    d: '성스러운 날개를 펼친다. 주변을 쓸어내는 성광 폭발과 함께 HP를 50% 되찾고, 12초 동안 받는 피해 -60%, 공격력 +40%, 초당 HP 2% 회복의 「불사 상태」가 된다.',
    brief: '성광 폭발 + 12초 불사 상태 (피해 -60% · 공격 +40%)',
  },
};
for (const a of SK_ARM_KEYS) { const A = SK_AWK[a]; skn('aw_' + a, a, 0, 0, 'a', 1, A.name, A.g, null, { awk: a, fixed: A.pos, tips: A.tips, d: A.d }); }

// ---------- 확장 별 (skilltree_x.js) : 갈래마다 18개 ----------
Object.assign(SK_STAT, SK_STAT_X);
const SK_XTIP = { p: ['p8', 'p9'], s: ['sr'], w: ['w8', 'w9'], v: ['v8', 'v9'] };
const SK_XEDGES = [];
for (const a of SK_ARM_KEYS) {
  const X = SK_X[a], id = k => 'x_' + a + '_' + k;
  const put = (k, r, off, type, def, lv) => {
    const keyed = typeof def[2] === 'string';
    skn(id(k), a, r, off, type, keyed ? 1 : def[3], def[0], def[1], keyed ? null : def[2], Object.assign({ xp: true, lv }, keyed ? { key: def[2], d: def[3] } : def[4] ? { d: def[4] } : {}));
  };
  put('hub', 5.1, 0, 'n', X.hub, 25);
  for (const t of SK_XTIP[a]) SK_XEDGES.push([t, id('hub')]);
  [['a', -30, 5.7], ['b', 0, 5.9], ['c', 30, 5.7]].forEach(([ln, off, r0]) => {
    for (let i = 0; i < 4; i++) {
      const last = i === 3, o = last ? off * 0.87 : off;
      put(ln + (i + 1), r0 + i * 0.95, o, last ? 'k' : 's', X[ln][i], 28 + i * 4 + (last ? 4 : 0));
      SK_XEDGES.push([i ? id(ln + i) : id('hub'), id(ln + (i + 1))]);
    }
  });
  put('x1', 6.35, -15, 's', X.x1, 30); put('x2', 6.35, 15, 's', X.x2, 30);
  SK_XEDGES.push([id('a1'), id('x1')], [id('b1'), id('x1')], [id('b1'), id('x2')], [id('c1'), id('x2')]);
  put('br1', 8.3, -14, 'n', X.br1, 38); put('br2', 8.3, 14, 'n', X.br2, 38);
  SK_XEDGES.push([id('a3'), id('br1')], [id('b3'), id('br1')], [id('b3'), id('br2')], [id('c3'), id('br2')]);
  put('crown', 10.0, 0, 'k', X.crown, 55);
  SK_XEDGES.push([id('a4'), id('crown')], [id('b4'), id('crown')], [id('c4'), id('crown')]);
}

const SK_EDGES = [
  ['core', 'p1'], ['core', 's1'], ['core', 'w1'], ['core', 'v1'],
  ['s1', 'sq'], ['s1', 'se'], ['s1', 'st'], ['s1', 'sf'], ['sq', 'sh'], ['se', 'sh'], ['se', 'sl'], ['st', 'sl'], ['st', 'sb'], ['sf', 'sb'],
  ['sq', 'kq'], ['sh', 'kq'], ['sh', 'ke'], ['sl', 'ke'], ['sl', 'kt'], ['sb', 'kt'], ['sb', 'kf'], ['sf', 'kf'], ['ke', 'sr'], ['kt', 'sr'],
  ['b1', 'p2'], ['b1', 'w2'], ['b2', 'sq'], ['b2', 'w3'], ['b3', 'sf'], ['b3', 'v3'], ['b4', 'p3'], ['b4', 'v2'],
];
// 파검 · 비기 · 수호는 같은 모양
for (const a of ['p', 'w', 'v']) {
  const E = [[1, 2], [1, 3], [2, 4], [3, 4], [2, 5], [3, 6], [4, 7], [5, 7], [6, 7], [5, 8], [7, 8], [7, 9], [6, 9]];
  for (const [i, j] of E) SK_EDGES.push([a + i, a + j]);
}
for (const e of SK_XEDGES) SK_EDGES.push(e);
const SKN_BY = Object.fromEntries(SKN.map(n => [n.id, n]));
const SK_ADJ = Object.fromEntries(SKN.map(n => [n.id, []]));
for (const [a, b] of SK_EDGES) { SK_ADJ[a].push(b); SK_ADJ[b].push(a); }
const mixCol = (a, b) => { const A = a.split(',').map(Number), B = b.split(',').map(Number); return A.map((v, i) => Math.round((v + B[i]) / 2)).join(','); };
for (const n of SKN) {
  const th = ((n.th ?? (SK_ARMS[n.arm] ? SK_ARMS[n.arm].th : 0)) + n.off) * DEG;
  n.x = Math.cos(th) * n.r * SK_UX; n.y = Math.sin(th) * n.r * SK_UY;
  if (n.fixed) { n.x = n.fixed[0]; n.y = n.fixed[1]; }
  n.col = n.type === 'core' ? SK_GOLD : n.arm2 ? mixCol(SK_ARMS[n.arm].col, SK_ARMS[n.arm2].col) : SK_ARMS[n.arm].col;
  n.bridge = !!n.arm2;
}

// 성좌 완성 · 별 효과 문구
const skDesc = (n, r) => {
  if (n.d && !n.fx) return [n.d];
  const out = []; for (const k in n.fx) out.push(skLine(k, n.fx[k] * r));
  return out;
};

// 트리 전용 타격 (극성 기술)
const SKH = {
  wave: { dmg: 2.5, kx: 5, kz: 3, airKz: 4, stun: 30, stop: 4, shake: 4, fx: 'slash', power: 1.4, _cat: 'tree' },
  launch: { dmg: 3, kx: 1, kz: 14, airKz: 12, stun: 50, stop: 6, shake: 6, fx: 'blunt', power: 1.5, _cat: 'tree' },
  ghost: { dmg: 3.5, kx: 6, kz: 6, airKz: 6, stun: 40, stop: 6, shake: 6, fx: 'slash', power: 1.6, _cat: 'tree' },
  fourth: { dmg: 6, kx: 9, kz: 10, airKz: 10, stun: 60, stop: 12, shake: 12, fx: 'x', power: 2.2, _cat: 'tree' },
  echo: { dmg: 9, kx: 6, kz: 9, airKz: 9, stun: 60, stop: 10, shake: 10, fx: 'x', power: 2.2, _cat: 'tree' },
};
const SK_SKILL = { s1: 1, s2: 2, s3: 3, s4: 4 };

// ============================================================
//  진행 · 능력치 (Prog 에 덧붙인다)
// ============================================================
Object.assign(Prog, {
  _v: 0, _st: null, _stRef: null, _stV: -1,
  sk() { const d = Save.data; return d.sk || (d.sk = {}); },
  r(id) {
    if (id === 'core') return 1;
    if (id.charCodeAt(0) === 97) { const a = Save.data && Save.data.awk; return a && a[id.slice(3)] ? 1 : 0; }      // 각성 별 (aw_p …)
    const t = Save.data && Save.data.sk; return (t && t[id]) || 0;
  },
  spent() { let n = 0; const t = (Save.data && Save.data.sk) || {}; for (const k in t) n += t[k]; return n; },
  free() { return Math.max(0, this.earned() - this.spent()); },
  resetCost() { return this.spent() * 1500; },
  refundCost() { return 1000; },
  linked(n) { return n.type === 'core' || SK_ADJ[n.id].some(id => this.r(id) > 0); },
  exTaken(n) { if (!n.ex) return null; return SKN.find(o => o.ex === n.ex && o.id !== n.id && this.r(o.id) > 0) || null; },
  armMax(a) { let m = 0; const seen = {}; for (const n of SKN) if (n.arm === a && !n.bridge && !n.awk && !n.xp) { if (n.ex) { if (seen[n.ex]) continue; seen[n.ex] = 1; } m += n.max; } return m; },
  armSpent(a) { let s = 0; for (const n of SKN) if (n.arm === a && !n.bridge && !n.awk) s += this.r(n.id); return s; },
  // 전직 : 첫 별을 밝힌 갈래 (예전 저장에는 값이 없으니 가장 많이 쓴 갈래로 본다)
  job() { const d = Save.data; if (!d) return null; if (d.job && SK_JOB[d.job]) return d.job; let best = null, bs = 0; for (const a of SK_ARM_KEYS) { const q = this.armSpent(a); if (q > bs) { bs = q; best = a; } } return best; },
  jobTier() { const a = this.job(); if (!a) return 0; if (this.r('x_' + a + '_crown') > 0) return 3; let c = 0; for (const n of SKN) if (n.xp && n.arm === a && this.r(n.id) > 0) c++; return c >= SK_JOB_T2 ? 2 : 1; },
  jobName(a = this.job(), t = this.jobTier()) { return a && t > 0 ? SK_JOB[a].tier[t - 1] : SK_JOB.p.base; },
  // 각성 조건 : 갈래의 별을 하나도 빠짐없이 1랭크 이상 밝혔는가 (택일 오의는 하나만)
  armNodes(a) { const out = [], seen = {}; for (const n of SKN) if (n.arm === a && !n.bridge && !n.awk && !n.xp) { if (n.ex) { if (seen[n.ex]) continue; seen[n.ex] = 1; } out.push(n); } return out; },
  armOpen(a) { return this.armNodes(a).every(n => this.r(n.id) > 0 || (n.ex && this.exTaken(n))); },
  armOpenCount(a) { return this.armNodes(a).filter(n => this.r(n.id) > 0 || (n.ex && this.exTaken(n))).length; },
  // 각성 조건 : ① 그 갈래로 전직 ② 갈래의 별을 모두 한 번씩 밝히기 ③ 2차 전직(확장 별 SK_JOB_T2개)
  awkReady(a) { return this.job() === a && this.jobTier() >= 2 && this.armOpen(a); },
  awkWhy(a) { if (this.job() !== a) return this.job() ? `「${SK_ARMS[a].short}」으로 전직해야 합니다 (지금은 ${this.jobName()})` : `「${SK_ARMS[a].short}」의 별을 밝혀 전직해야 합니다`; if (!this.armOpen(a)) return `「${SK_ARMS[a].name}」의 모든 별을 하나씩 밝혀야 합니다 (${this.armOpenCount(a)} / ${this.armNodes(a).length})`; return `2차 전직이 필요합니다 — 확장 별을 ${SK_JOB_T2}개 이상 밝히세요`; },
  armDone(a) { for (const n of SKN) if (n.arm === a && !n.bridge && !n.awk && !n.xp && this.r(n.id) < n.max && !(n.ex && this.exTaken(n))) return false; return true; },

  // 배울 수 있는지 + 안 되는 이유
  check(n) {
    if (n.type === 'core') return { ok: false, why: '처음부터 밝혀져 있는 별입니다', core: true };
    if (n.awk) {
      if (this.r(n.id)) return { ok: false, why: '이미 각성했습니다', max: true };
      if (!this.awkReady(n.awk)) return { ok: false, why: this.awkWhy(n.awk) };
      return { ok: true, awk: true };
    }
    const r = this.r(n.id);
    if (r >= n.max) return { ok: false, why: '최대 랭크', max: true };
    if (n.xp && this.job() !== n.arm) return { ok: false, why: this.job() ? `「${SK_ARMS[n.arm].short}」으로 전직해야 배울 수 있습니다 (지금은 ${this.jobName()})` : `「${SK_ARMS[n.arm].short}」의 별을 먼저 하나 밝혀 전직해야 합니다` };
    if (!this.linked(n)) return { ok: false, why: '밝혀진 별과 이어져 있어야 합니다' };
    if (n.req && !this.r(n.req)) return { ok: false, why: `먼저 「${SKN_BY[n.req].name}」${jo(SKN_BY[n.req].name, '을', '를').slice(-1)} 배워야 합니다` };
    const ex = this.exTaken(n); if (ex) return { ok: false, why: `「${ex.name}」${jo(ex.name, '과', '와').slice(-1)} 함께 배울 수 없습니다 (택일)` };
    if (n.lv && this.lv() < n.lv) return { ok: false, why: `Lv.${n.lv}부터 배울 수 있습니다` };
    if (this.free() <= 0) return { ok: false, why: '스킬 포인트가 부족합니다' };
    return { ok: true };
  },
  learn(n) {
    if (!this.check(n).ok) return false;
    if (n.awk) { const d = Save.data; (d.awk || (d.awk = {}))[n.awk] = 1; if (!d.awkSel) d.awkSel = n.awk; Save.save(); this.refresh(); return true; }
    const t = this.sk(); t[n.id] = (t[n.id] || 0) + 1;
    if (!Save.data.job) Save.data.job = this.job() || n.arm;                          // 첫 별 → 전직
    Save.save(); this.refresh();
    return true;
  },
  // 한 랭크 되돌리기 : 끄면 다른 별이 끊어지는 경우는 안 된다
  canRefund(n) {
    const r = this.r(n.id);
    if (n.awk) return { ok: false, why: '각성은 되돌릴 수 없습니다 (전체 초기화로만 사라집니다)' };
    if (n.type === 'core' || r <= 0) return { ok: false, why: '되돌릴 랭크가 없습니다' };
    if (r === 1 && !n.bridge && Save.data.awk && Save.data.awk[n.arm]) return { ok: false, why: '각성한 갈래의 별은 모두 밝혀 둬야 합니다 (랭크만 줄일 수 있음)' };
    if (r === 1) {
      for (const o of SKN) if (o.req === n.id && this.r(o.id) > 0) return { ok: false, why: `「${o.name}」${jo(o.name, '이', '가').slice(-1)} 이 별을 필요로 합니다` };
      const lit = new Set(['core']), st = ['core'];
      while (st.length) { const id = st.pop(); for (const j of SK_ADJ[id]) if (j !== n.id && !lit.has(j) && this.r(j) > 0) { lit.add(j); st.push(j); } }
      for (const o of SKN) if (o.id !== n.id && o.type !== 'core' && this.r(o.id) > 0 && !lit.has(o.id)) return { ok: false, why: `이 별을 끄면 「${o.name}」${jo(o.name, '이', '가').slice(-1)} 끊어집니다` };
    }
    if ((Save.data.gold || 0) < this.refundCost()) return { ok: false, why: '골드가 부족합니다' };
    return { ok: true };
  },
  refund(n) {
    if (!this.canRefund(n).ok) return false;
    const t = this.sk(); Save.data.gold -= this.refundCost();
    if (--t[n.id] <= 0) delete t[n.id];
    if (this.spent() === 0) { Save.data.job = null; Save.data.jobSeen = 0; } else Save.data.jobSeen = Math.min(Save.data.jobSeen || 0, this.jobTier());
    Save.save(); this.refresh(); return true;
  },
  reset() {
    const c = this.resetCost();
    if (!this.spent() || (Save.data.gold || 0) < c) return false;
    Save.data.gold -= c; Save.data.sk = {}; Save.data.awk = {}; Save.data.awkSel = null; Save.data.job = null; Save.data.jobSeen = 0; Save.save(); this.refresh();
    return true;
  },
  refresh() { this._v++; const p = Game.player; if (p && p.setGear) p.setGear(); },

  // 모든 별의 효과를 더한 값 (바뀔 때만 다시 계산)
  st() {
    const t = (Save.data && Save.data.sk) || null;
    if (this._st && this._stRef === t && this._stV === this._v) return this._st;
    const S = {}, K = {}, D = {}, job = this.job();
    for (const n of SKN) {
      const r = this.r(n.id); if (!r || n.type === 'core') continue;
      const eff = (n.arm === job || n.bridge || n.xp) ? 1 : 0.7;                    // 전직하지 않은 갈래의 별은 70%
      if (n.fx) for (const k in n.fx) S[k] = (S[k] || 0) + n.fx[k] * r * eff;
      if (n.key) K[n.key] = 1;
    }
    const O = {}; for (const a of SK_ARM_KEYS) { D[a] = this.armDone(a); O[a] = this.armOpen(a); }
    if (D.p) S.all = (S.all || 0) + 0.05;
    if (D.s) S.cdAll = (S.cdAll || 0) + 0.05;
    if (D.w) S.wsk = (S.wsk || 0) + 0.1;
    if (D.v) S.hp = (S.hp || 0) + 0.08;
    if (job) { const jt = this.jobTier(); for (let i = 0; i < jt; i++) for (const k in SK_JOB[job].b[i]) S[k] = (S[k] || 0) + SK_JOB[job].b[i][k]; }
    this._st = { S, K, D, O }; this._stRef = t; this._stV = this._v;
    return this._st;
  },
  v(k) { return this.st().S[k] || 0; },
  // 각성기 : 배웠고 갈래가 완성되어 있으면 쓸 수 있다. 장착한 하나를 Y 키로 쓴다
  awkOn(a) { const d = Save.data; return !!(d && d.awk && d.awk[a]) && !!this.st().O[a]; },
  awkSel() { const d = Save.data; if (d && d.awkSel && this.awkOn(d.awkSel)) return d.awkSel; for (const a of SK_ARM_KEYS) if (this.awkOn(a)) return a; return null; },
  awkDef(a) { return a ? SK_AWK[a] : null; },
  has(k) { return !!this.st().K[k]; },

  // ---------- 능력치 ----------
  hpMul() { return (1 + 0.006 * (this.lv() - 1)) * (1 + this.v('hp')); },
  mpRegenMul() { return 1 + this.v('mpReg'); },
  moveMul() { return 1 + this.v('move'); },
  potMul() { return 1 + this.v('pot'); },
  cdMul(k) {
    const i = SK_SKILL[k];
    if (i) return Math.max(0.3, (1 - this.v('cd' + i)) * (1 - this.v('cdAll')));
    if (k === 's5' || k === 's6') return Math.max(0.4, 1 - this.v('cdW'));
    return 1;
  },
  mpMul() { return Math.max(0.3, 1 - this.v('mpAll')); },
  // 장비를 바꿀 때마다 (Player.setGear 끝에서)
  gear(p) {
    p.critDmg += this.v('critD');
    p.dodge = Math.min(0.6, (p.dodge || 0) + this.v('dodge'));
    p.kbRes = Math.min(0.9, (p.kbRes || 0) + (this.has('iron') ? 0.6 : 0));
    p.takeMul *= (1 - this.v('def')) * (this.has('iron') ? 0.85 : 1) * (this.has('rage') ? 1.1 : 1);
    p.mpMax = Math.round(1500 * (1 + this.v('mpMax')));
    if (p.mp != null) p.mp = Math.min(p.mp, p.mpMax);
  },

  // 타격 종류 : basic / s1~s4 / wsk(검 고유 · 지진검 · 귀신참) / tree
  cat(hit) { return hit && hit._cat; },
  dmgMul(p, hit, tgt, backOrCounter) {
    let m = 1 + this.v('all');
    if (p.awkBuffT > 0) m *= 1.4;                                              // 불사성광
    const c = this.cat(hit);
    if (c === 'basic') {
      m *= 1 + this.v('basic');
      if (hit === HD.a4 || hit === HD.dash) m *= 1 + this.v('a4');
      if (p.z > 20) m *= 1 + this.v('air');
      if (p.linkT > 0) m *= 1.2;
    } else if (SK_SKILL[c]) m *= (1 + this.v('sk')) * (1 + this.v(c));
    else if (c === 'wsk') m *= 1 + this.v('wsk');
    else if (c === 'tree') m *= 1 + this.v('sk');
    const fl = this.v('flow');
    if (fl && Game.combo) m *= 1 + fl * Math.min(10, Math.floor(Game.combo.n / 10));
    const ex = this.v('exec');
    if (ex && tgt && tgt.hpMax && tgt.hp < tgt.hpMax * 0.3) m *= 1 + ex;
    if (backOrCounter) m *= 1 + this.v('back');
    if (tgt && tgt.awkBreak > 0) m *= 1.35;                                    // 파천멸검 : 방어가 무너진 적
    if (this.has('rage') && p.hp < p.hpMax * 0.5) m *= 1.3;
    // ---- 확장 별 ----
    const bs = this.v('boss'); if (bs && tgt && (tgt.isBoss || tgt.elite)) m *= 1 + bs;
    if (this.has('giant') && tgt && (tgt.isBoss || tgt.elite)) m *= 1.25;
    if (this.has('ember') && p.hp >= p.hpMax * 0.9) m *= 1.15;
    if (this.has('opener') && tgt && tgt.hpMax && tgt.hp >= tgt.hpMax * 0.999) m *= 1.35;
    if (c === 'basic' && p.adrT > 0) m *= 1.25;
    if (this.has('overflow') && (SK_SKILL[c] || c === 'tree') && p.mp >= p.mpMax * 0.7) m *= 1.15;
    if (p.nukeT > 0 && (SK_SKILL[c] || c === 'tree')) m *= 1.4;
    return m;
  },
  critAdd(p, hit) {
    const c = this.cat(hit); let a = this.v('crit');
    if (SK_SKILL[c]) a += this.v('skCrit');
    if (c === 'wsk') a += this.v('wCrit');
    if (p.eyeT > 0) a += 0.15;
    if (p.eye2T > 0) a += 0.25;
    return a;
  },
  // 받는 피해 (마나 방패)
  takeDmg(p, dmg) {
    if (p.awkBuffT > 0) dmg *= 0.4;                                            // 불사성광
    if (this.has('lastStand') && p.hp < p.hpMax * 0.3) dmg *= 0.75;
    if (this.has('bulwark')) { if (p.bulT > 0) dmg *= 0.7; p.bulT = 60; }
    if (p.barrier > 0) {                                                       // 수호 결계 : 보호막이 먼저 맞는다
      const ab = Math.min(p.barrier, dmg); p.barrier -= ab; dmg -= ab; p.barrierGone = 0;
      FX.add('world', new Ring(p.x, sy(p.y, p.z + 70), 26, 84, 14, { col: '130,255,190', w: 5 })); Sfx.play('ring', 0.3, 1.9);
      if (p.barrier <= 0) { p.barrier = 0; FX.add('world', new Flash(p.x, sy(p.y, p.z + 70), 16, 150, 18, '170,255,210', 0.7)); }
      if (dmg <= 0) return 0;
    }
    if (!this.has('mshield') || !(p.mp > 0) || !p.hpMax) return dmg;
    let part = dmg * 0.25, cost = part / p.hpMax * p.mpMax;
    if (cost > p.mp) { part *= p.mp / cost; cost = p.mp; }
    p.mp -= cost;
    if (part > p.hpMax * 0.02) { FX.add('world', new Ring(p.x, sy(p.y, p.z + 70), 30, 90, 14, { col: '170,140,255', w: 6 })); Sfx.play('ring', 0.35, 1.8); }
    return dmg - part;
  },

  // 적중 후
  onHit(p, t, dmg, hit) {
    if (this.cat(hit) !== 'basic') return;
    let dr = this.v('drain');
    if (dr && this.has('rage') && p.hp < p.hpMax * 0.5) dr *= 2;
    if (dr && Game.frame - (p.drainF || -99) > 6) { p.drainF = Game.frame; Gear.heal(p, p.hpMax * dr, true); }
    if (hit === HD.a4 && this.has('wave') && Game.frame - (p.waveF || -99) > 12) {
      p.waveF = Game.frame;
      const d = p.facing;
      FX.add('world', new WShot(p, p.x + d * 50, p.y, p.z + 70, d * 17, 0, 0, { style: 'crescent', col: '255,205,130', r: 44, life: 42, pierce: true, hd: SKH.wave, floor: true }));
      Sfx.pplay('swingBig'); Sfx.play('ring', 0.4, 1.6);
    }
  },
  // 스킬을 쓴 직후
  onSkill(p, k, s) {
    const ret = this.v('mpRet');
    if (ret && s.mp) p.mp = Math.min(p.mpMax, p.mp + s.mp * this.mpMul(k) * ret);
    if (SK_SKILL[k]) {
      if (this.has('link')) { p.linkT = 150; p.bladeGlow = Math.max(p.bladeGlow || 0, 0.8); }
      if (this.has('chain')) for (const o in SK_SKILL) if (o !== k && p.cd[o] > 0) p.cd[o] = Math.max(0, p.cd[o] - 0.6);
    }
    if ((k === 's5' || k === 's6') && this.has('eye')) {
      p.eyeT = 240;
      FX.add('top', new Label(p.x, sy(p.y, p.z) - 170, '심 안', { col: ['#ffffff', '#e27aff'], size: 22, life: 40 }));
    }
    if (SK_SKILL[k] && this.has('echoSk')) { p.mp = Math.min(p.mpMax, p.mp + p.mpMax * 0.06); FX.add('world', new Mote(p.x, sy(p.y, p.z + 90), 0, -1.4, { col: '120,200,255', life: 26, r: 6, grav: 0 })); }
    if (SK_SKILL[k] && this.has('nuke5')) { p.nkN = (p.nkN || 0) + 1; if (p.nkN % 5 === 0) { p.nukeT = 240; FX.add('top', new Label(p.x, sy(p.y, p.z) - 170, '오 의 연 타', { col: ['#ffffff', '#7ab8ff'], size: 24, life: 50 })); FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 220, 20, { col: '130,190,255', w: 10 })); } }
    if ((k === 's5' || k === 's6') && this.has('echoW')) for (const o in p.cd) if (o !== k && p.cd[o] > 0) p.cd[o] = Math.max(0, p.cd[o] - 2);
    if ((k === 's5' || k === 's6') && this.has('eye2')) { p.eye2T = 480; FX.add('top', new Label(p.x, sy(p.y, p.z) - 190, '천 리 안', { col: ['#ffffff', '#d890ff'], size: 22, life: 40 })); }
    const x0 = p.x, y0 = p.y, d = p.facing;
    if (k === 's1' && this.has('quake')) Gear.later(7, () => {
      const gy = sy(p.y, 0);
      FX.add('ground', new Ring(p.x, gy, 20, 300, 22, { col: '255,160,100', w: 12 })); FX.add('world', new Flash(p.x, gy - 30, 20, 220, 16, '255,180,120', 0.7));
      for (let i = 0; i < 10; i++) FX.add('world', new Debris(p.x + rand(-60, 60), p.y, 4, { vx: rand(-6, 6), vz: rand(6, 13), s: rand(3, 5) }));
      Sfx.play('quake', 0.6, 1.2); Game.addShake(8);
      WS.area(p, p.x, p.y, 260, 110, SKH.launch, { hmax: 200 });
    });
    if (k === 's2' && this.has('ghost')) Gear.later(34, () => {
      const x1 = p.x, cx = (x0 + x1) / 2, half = Math.abs(x1 - x0) / 2 + 80;
      for (let i = 0; i < 5; i++) p.addGhost(lerp(x1, x0, i / 4), y0, 0, -d, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 10 + i * 2, '120,200,255');
      FX.add('world', new CutLine(cx, sy(y0, 80), d > 0 ? Math.PI : 0, half * 2, 8, '140,215,255', 14));
      Sfx.wlayer('wind', 2, true); Sfx.pplay('swingBig'); Game.addShake(6);
      WS.area(p, cx, y0, half, 70, SKH.ghost, { dir: -d });
    });
    if (k === 's3' && this.has('fourth')) Gear.later(56, () => {
      const dd = p.facing, cx = p.x + dd * 100, cy = sy(p.y, 80);
      FX.add('world', new CutLine(cx, cy, 0.75, 170, 9, '210,180,255', 16)); FX.add('world', new CutLine(cx, cy, -0.75, 170, 9, '210,180,255', 16));
      FX.add('world', new Flash(cx, cy, 20, 220, 16, '200,170,255', 0.85));
      swingT(p, 'a4', 1.5); Sfx.pplay('swingBig'); Sfx.play('explode', 0.5); Game.addShake(10); Game.freeze(4);
      WS.area(p, cx, p.y, 180, 80, SKH.fourth);
    });
    if (k === 's4' && this.has('echo')) Gear.later(46, () => {
      const x1 = p.x, cx = (x0 + x1) / 2, half = Math.abs(x1 - x0) / 2 + 90;
      FX.add('world', new CutLine(cx, sy(y0, 70), 0, half * 2 + 60, 10, '255,240,170', 18));
      FX.add('world', new Flash(cx, sy(y0, 70), 20, 260, 16, '255,240,190', 0.8));
      Sfx.wlayer('katana', 3, true); Game.flashScreen(0.15, '255,250,220'); Game.addShake(10);
      WS.area(p, cx, y0, half, 70, SKH.echo);
    });
    if (k === 's6' && this.has('zen')) { p.zenT = 360; FX.add('world', new SkZen(p)); }
  },
  // 적을 쓰러뜨렸을 때
  onKill(p, e) {
    if (this.has('adren')) p.adrT = 240;
    const h = this.v('kill'); if (h) Gear.heal(p, p.hpMax * h * (e.isBoss ? 5 : 1), true);
    const c = this.v('killCd'); if (c) for (const k in SK_SKILL) if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - c);
  },
  // 매 프레임 (Player.update)
  tick(p) {
    if (p.linkT > 0) p.linkT--;
    if (p.awkBuffT > 0) { p.awkBuffT--; if (p.hp > 0 && Game.frame % 60 === 0) Gear.heal(p, p.hpMax * 0.02, true); }
    if (p.mpBoostT > 0) { p.mpBoostT--; p.mp = Math.min(p.mpMax, p.mp + p.mpMax * 0.004); }
    if (p.eyeT > 0) p.eyeT--;
    if (p.eye2T > 0) p.eye2T--;
    if (p.adrT > 0) p.adrT--;
    if (p.nukeT > 0) p.nukeT--;
    if (p.bulT > 0) p.bulT--;
    if (this.has('barrier') && p.hp > 0) {                                      // 수호 결계 : 5초 동안 맞지 않으면 보호막
      if (!(p.barrier > 0) && p.sinceHit > 300 && (p.barrierGone = (p.barrierGone || 0) + 1) > 0) { p.barrier = p.hpMax * 0.08; FX.add('world', new Ring(p.x, sy(p.y, p.z + 70), 20, 120, 20, { col: '130,255,190', w: 6 })); Sfx.play('ring', 0.3, 1.4); }
      if (p.barrier > 0 && Game.frame % 8 === 0) FX.add('world', new Mote(p.x + rand(-22, 22), sy(p.y, rand(30, 130)), 0, -0.4, { col: '130,255,190', life: 22, r: 3.5, grav: 0 }));
    }
    if (p.hp <= 0 || p.state === 'dead') return;
    const rg = this.v('regen');
    if (rg && p.sinceHit > 180 && p.hp < p.hpMax && Game.frame % 60 === 0) {
      Gear.heal(p, p.hpMax * rg, true);
      for (let i = 0; i < 3; i++) FX.add('world', new Mote(p.x + rand(-20, 20), sy(p.y, rand(20, 110)), 0, rand(-1.6, -0.6), { col: '120,240,160', life: 30, r: rand(4, 6), grav: 0 }));
    }
    if (this.has('rage') && p.hp < p.hpMax * 0.5 && Game.frame % 6 === 0) FX.add('world', new Mote(p.x + rand(-26, 26), sy(p.y, rand(10, 140)), rand(-0.3, 0.3), rand(-2.2, -0.8), { col: choose(['255,60,40', '255,120,60']), life: 26, r: rand(4, 7), grav: 0 }));
  },
  // 쓰러질 피해를 받았을 때 (불굴)
  tryUndying(p) {
    if (!this.has('undying') || p.undyingUsed) return false;
    p.undyingUsed = true; p.hp = Math.round(p.hpMax * 0.3); p.invul = 120;
    FX.add('top', new Label(p.x, sy(p.y, p.z) - 170, '불 굴', { col: ['#ffffff', '#7dffa0'], size: 34, life: 70 }));
    FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 280, 26, { col: '130,255,170', w: 14 }));
    FX.add('world', new Pillar(p.x, p.y, 60, 360, 30, '130,255,170', '230,255,240'));
    Sfx.play('clear', 0.8, 0.9); Game.flashScreen(0.3, '200,255,210'); Game.slowmo(0.4, 30);
    return true;
  },
});

// 극의 : 다른 스킬 쿨타임이 2배 빨리 돈다
class SkZen {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p;
    if (!(p.zenT > 0) || p.hp <= 0) return false;
    p.zenT--;
    for (const k in p.cd) if (k !== 's6' && p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - (1 + (p.cdr || 0)) / 60);
    if (this.t % 7 === 0) FX.add('world', new Mote(p.x + rand(-40, 40), sy(p.y, rand(0, 150)), rand(-0.4, 0.4), rand(-2, -0.8), { col: '255,130,210', life: 30, r: rand(4, 7), grav: 0 }));
    return true;
  }
  draw(ctx) { const p = this.p; drawGlow(ctx, p.x, sy(p.y, 70), 120, '255,110,200', 0.18 + Math.sin(this.t * 0.2) * 0.06, 1, 1.1); }
}

// ---------- 별 그림 (WS.glyph 에 없는 모양) ----------
const SKG = (g, kind, col) => {
  const C = a => `rgba(${col},${a})`;
  const line = (fn, w = 3) => {
    g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke();
    g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke();
  };
  const fill = (fn, a = 1) => { g.fillStyle = C(a); g.beginPath(); fn(); g.fill(); };
  const hex = (r, cx = 24, cy = 24) => { for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; i ? g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'awk_p':
      fill(() => g.arc(24, 24, 15, 0, TAU), 0.22);
      line(() => { g.moveTo(7, 7); g.lineTo(41, 41); }, 3.6); line(() => { g.moveTo(41, 7); g.lineTo(7, 41); }, 3.6);
      line(() => g.arc(24, 24, 19, -2.6, -0.5), 2.2); line(() => g.arc(24, 24, 19, 0.55, 2.65), 2.2);
      fill(() => g.arc(24, 24, 5.5, 0, TAU), 0.95); g.fillStyle = '#fff'; g.beginPath(); g.arc(24, 24, 2.6, 0, TAU); g.fill();
      return true;
    case 'awk_s':
      for (let i = -2; i <= 2; i++) {
        const x = 24 + i * 9, tx = 24 + i * 1.6;
        fill(() => { g.moveTo(x - 2.2, 2); g.lineTo(x + 2.2, 2); g.lineTo(tx + 1, 36); g.lineTo(tx, 41); g.lineTo(tx - 1, 36); }, i === 0 ? 1 : 0.7);
      }
      line(() => { g.moveTo(24, 6); g.lineTo(24, 38); }, 2);
      fill(() => g.ellipse(24, 43, 14, 3.4, 0, 0, TAU), 0.55);
      return true;
    case 'awk_w':
      fill(() => g.ellipse(24, 24, 12, 21, 0, 0, TAU), 0.3);
      line(() => { g.moveTo(24, 2); g.lineTo(19, 14); g.lineTo(28, 22); g.lineTo(18, 33); g.lineTo(24, 46); }, 3);
      fill(() => g.arc(11, 15, 2.2, 0, TAU), 0.9); fill(() => g.arc(37, 33, 2.2, 0, TAU), 0.9); fill(() => g.arc(38, 11, 1.6, 0, TAU), 0.8); fill(() => g.arc(10, 38, 1.6, 0, TAU), 0.8);
      return true;
    case 'awk_v':
      for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) fill(() => { const a = (-0.2 - i * 0.34) * sg, L = 22 - i * 2.2; g.save(); g.translate(24, 28); g.rotate(a + (sg > 0 ? 0 : 0)); g.ellipse(sg * (L / 2 + 3), -3 - i * 0.6, L / 2, 3.1, sg * -0.25, 0, TAU); g.restore(); }, 0.9 - i * 0.12);
      fill(() => { g.moveTo(24, 10); g.lineTo(28, 26); g.lineTo(24, 42); g.lineTo(20, 26); }, 0.95);
      line(() => g.ellipse(24, 7, 7, 2.6, 0, 0, TAU), 1.8);
      return true;
    case 'heart':
      fill(() => { g.moveTo(24, 41); g.bezierCurveTo(2, 26, 8, 6, 24, 16); g.bezierCurveTo(40, 6, 46, 26, 24, 41); }, 0.8);
      line(() => { g.moveTo(9, 25); g.lineTo(17, 25); g.lineTo(21, 18); g.lineTo(26, 32); g.lineTo(29, 25); g.lineTo(39, 25); }, 2);
      return true;
    case 'fang':
      fill(() => { g.moveTo(9, 12); g.quadraticCurveTo(13, 30, 20, 42); g.quadraticCurveTo(22, 26, 22, 12); }, 0.9);
      fill(() => { g.moveTo(39, 12); g.quadraticCurveTo(35, 30, 28, 42); g.quadraticCurveTo(26, 26, 26, 12); }, 0.9);
      line(() => { g.moveTo(5, 10); g.quadraticCurveTo(24, 17, 43, 10); }, 2.2);
      return true;
    case 'potion':
      fill(() => g.arc(24, 30, 13, 0, TAU), 0.25);
      fill(() => g.arc(24, 30, 11, 0.15, Math.PI - 0.15), 0.9);
      line(() => { g.arc(24, 30, 13, -1.15, Math.PI + 1.15); }, 2.2);
      line(() => { g.moveTo(19, 7); g.lineTo(29, 7); g.moveTo(21, 8); g.lineTo(21, 18); g.moveTo(27, 8); g.lineTo(27, 18); }, 2);
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(19, 26, 2.4, 0, TAU); g.fill();
      return true;
    case 'fortress':
      fill(() => { g.rect(10, 18, 28, 24); }, 0.55);
      for (const x of [8, 20.5, 33]) fill(() => g.rect(x, 10, 7, 9), 0.9);
      g.fillStyle = 'rgba(8,10,20,0.9)'; g.beginPath(); g.moveTo(19, 42); g.lineTo(19, 33); g.arc(24, 33, 5, Math.PI, 0); g.lineTo(29, 42); g.fill();
      line(() => { g.moveTo(8, 42); g.lineTo(40, 42); g.moveTo(10, 19); g.lineTo(10, 42); g.moveTo(38, 19); g.lineTo(38, 42); }, 1.8);
      return true;
    case 'eye':
      line(() => { g.moveTo(4, 24); g.quadraticCurveTo(24, 5, 44, 24); g.quadraticCurveTo(24, 43, 4, 24); }, 2.4);
      fill(() => g.arc(24, 24, 8, 0, TAU), 0.95);
      g.fillStyle = 'rgba(10,8,20,0.9)'; g.beginPath(); g.ellipse(24, 24, 2.6, 6, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(21, 21, 1.8, 0, TAU); g.fill();
      return true;
    case 'star4':
      fill(() => { g.moveTo(24, 4); g.quadraticCurveTo(27, 21, 44, 24); g.quadraticCurveTo(27, 27, 24, 44); g.quadraticCurveTo(21, 27, 4, 24); g.quadraticCurveTo(21, 21, 24, 4); });
      fill(() => { g.moveTo(39, 5); g.lineTo(40.5, 9.5); g.lineTo(45, 11); g.lineTo(40.5, 12.5); g.lineTo(39, 17); g.lineTo(37.5, 12.5); g.lineTo(33, 11); g.lineTo(37.5, 9.5); }, 0.8);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(24, 24, 3, 0, TAU); g.fill();
      return true;
    case 'barrier':
      fill(() => hex(13), 0.3);
      line(() => hex(19), 2.4); line(() => hex(11), 1.6);
      return true;
    case 'link':
      line(() => g.ellipse(18, 24, 11, 7, -0.7, 0, TAU), 2.4);
      line(() => g.ellipse(30, 24, 11, 7, -0.7, 0, TAU), 2.4);
      return true;
    case 'lotus':
      for (let i = -2; i <= 2; i++) fill(() => g.ellipse(24 + i * 6.5, 27 - (2 - Math.abs(i)) * 3, 5, 12 - Math.abs(i) * 1.5, i * 0.38, 0, TAU), 0.55 + (2 - Math.abs(i)) * 0.18);
      line(() => { g.moveTo(8, 40); g.quadraticCurveTo(24, 46, 40, 40); }, 2);
      return true;
    case 'cycle':
      line(() => g.arc(24, 24, 15, -2.7, -0.35), 2.6);
      line(() => g.arc(24, 24, 15, 0.45, 2.8), 2.6);
      fill(() => { const a = -0.35, x = 24 + Math.cos(a) * 15, y = 24 + Math.sin(a) * 15; g.moveTo(x + 6, y - 2); g.lineTo(x - 3, y - 6); g.lineTo(x - 1, y + 5); });
      fill(() => { const a = 2.8, x = 24 + Math.cos(a) * 15, y = 24 + Math.sin(a) * 15; g.moveTo(x - 6, y + 2); g.lineTo(x + 3, y + 6); g.lineTo(x + 1, y - 5); });
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(24, 24, 3.4, 0, TAU); g.fill();
      return true;
  }
  return false;
};

// ============================================================
//  스킬 트리 화면 「검의 성좌」
// ============================================================
const TreeUI = {
  BR: { x: 16, y: 96, w: 884, h: 594 },            // 별자리 판
  PR: { x: 914, y: 96, w: 350, h: 594 },           // 오른쪽 정보 판
  sel: 'core', hover: null, t: 0, tab: 0,
  cam: { x: 0, y: 0, z: 1 }, tgt: { x: 0, y: 0, z: 1 }, fitZ: 1, fitC: [0, 0],
  drag: null, fx: [], comets: [], learnT: {}, denyT: {}, cine: null, cineQ: [], shake: 0, flashA: 0,
  msg: '', msgT: 0, msgCol: '#fff', resetArm: 0, refArm: 0, panelT: 1, lastSel: null, cursor: null,
  bg: null, iconC: {}, plateC: {}, twk: null, S: {},

  cur() { return SKN_BY[this.sel] || SKN_BY.core; },
  bcx() { return this.BR.x + this.BR.w / 2; },
  bcy() { return this.BR.y + this.BR.h / 2; },
  w2s(x, y, c = this.cam) { return [this.bcx() + (x - c.x) * c.z, this.bcy() + (y - c.y) * c.z]; },
  s2w(x, y, c = this.cam) { return [(x - this.bcx()) / c.z + c.x, (y - this.bcy()) / c.z + c.y]; },
  minZ() { return this.fitZ * 0.95; },
  maxZ() { return 2.1; },

  // ---------- 버튼 위치 ----------
  backRect() { return { x: 1086, y: 30, w: 172, h: 38 }; },
  chipRect(i) { return { x: 748 + i * 84, y: 22, w: 78, h: 54 }; },
  tabRect(i) { const P = this.PR; return { x: P.x + 10 + i * ((P.w - 20) / 2), y: P.y + 10, w: (P.w - 20) / 2 - 4, h: 32 }; },
  learnRect() { const P = this.PR; return { x: P.x + 16, y: P.y + P.h - 128, w: P.w - 32, h: 52 }; },
  refundRect() { const P = this.PR; return { x: P.x + 16, y: P.y + P.h - 66, w: (P.w - 40) / 2, h: 34 }; },
  resetRect() { const P = this.PR; return { x: P.x + 24 + (P.w - 40) / 2, y: P.y + P.h - 66, w: (P.w - 40) / 2, h: 34 }; },
  zoomRect(i) { const B = this.BR; return { x: B.x + B.w - 14 - (3 - i) * 42, y: B.y + B.h - 48, w: 36, h: 34 }; },

  fit() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const n of SKN) { const R = SK_TYPE[n.type].R * (n.awk ? 1.72 : 1) + 14; x0 = Math.min(x0, n.x - R); x1 = Math.max(x1, n.x + R); y0 = Math.min(y0, n.y - R); y1 = Math.max(y1, n.y + R + (n.awk ? 38 : 0)); }
    const bot = 40;                                                              // 아래쪽 버튼 · 알림 자리
    this.fitZ = Math.min((this.BR.w - 30) / (x1 - x0), (this.BR.h - 24 - bot) / (y1 - y0));
    this.fitC = [(x0 + x1) / 2, (y0 + y1) / 2 + bot / 2 / this.fitZ];
  },
  fitView() { this.tgt.x = this.fitC[0]; this.tgt.y = this.fitC[1]; this.tgt.z = this.fitZ; },
  // 처음 보는 화면 : 휴대폰은 별이 작으므로 조금 당겨서 보여 준다
  homeView() { this.fitView(); if (Touch.on) { this.tgt.z = this.fitZ * 1.3; this.tgt.x = 0; this.tgt.y = 0; this.focus(this.cur()); } },

  enter() {
    this.fit();
    this.msgT = 0; this.resetArm = 0; this.refArm = 0; this.t = 0; this.shake = 0; this.flashA = 0; this.drag = null;
    this.fx.length = 0; this.comets.length = 0; this.learnT = {}; this.denyT = {}; this.cine = null; this.cineQ.length = 0; this.hover = null;
    if (!SKN_BY[this.sel]) this.sel = 'core';
    this.homeView(); Object.assign(this.cam, this.tgt);
    const n = this.cur(); this.cursor = { x: n.x, y: n.y }; this.lastSel = this.sel; this.panelT = 1;
    // 새 트리로 바뀐 뒤 처음 들어왔을 때
    const d = Save.data;
    if (!d.skMig) {
      d.skMig = 1;
      const old = d.tree && Object.values(d.tree).some(v => v > 0);
      Save.save();
      if (old) this.say('스킬 트리가 새로 바뀌어, 쓴 포인트를 모두 돌려 드렸습니다', '#ffe070', 300);
    }
    if (!this.msgT && Prog.free() > 0) this.say(`밝힐 수 있는 별이 있습니다  ·  남은 포인트 ${Prog.free()}`, '#ffe9a6', 150);
  },
  leave() { Save.save(); Sfx.play('select', 0.7); Game.toLobby(); },
  say(t, c, life = 140) { this.msg = t; this.msgCol = c || '#fff'; this.msgT = life; },
  select(n, quiet) {
    if (n.id === this.sel) return;
    this.sel = n.id; this.resetArm = 0; this.refArm = 0;
    if (!quiet) Sfx.play('ui', 0.45, 1.2);
    this.focus(n);
  },
  // 고른 별이 판 가장자리에 걸리면 카메라를 옮긴다
  focus(n) {
    const B = this.BR, c = this.tgt, m = 110, [sx, sy2] = this.w2s(n.x, n.y, c);
    if (sx < B.x + m) c.x = n.x - (m - B.w / 2) / c.z; else if (sx > B.x + B.w - m) c.x = n.x - (B.w / 2 - m) / c.z;
    if (sy2 < B.y + m) c.y = n.y - (m - B.h / 2) / c.z; else if (sy2 > B.y + B.h - m) c.y = n.y - (B.h / 2 - m) / c.z;
    this.clampCam();
  },
  clampCam() { const c = this.tgt; c.x = clamp(c.x, -470, 470); c.y = clamp(c.y, -360, 360); c.z = clamp(c.z, this.minZ(), this.maxZ()); },
  zoomAt(f, sx, sy2) {
    const c = this.tgt, [wx, wy] = this.s2w(sx, sy2, c), z1 = clamp(c.z * f, this.minZ(), this.maxZ());
    c.z = z1; c.x = wx - (sx - this.bcx()) / z1; c.y = wy - (sy2 - this.bcy()) / z1;
    this.clampCam();
  },
  // 방향키 : 그 방향에 있는 가장 가까운 별로
  move(dx, dy) {
    const n = this.cur(); let best = null, bs = 1e9;
    for (const o of SKN) {
      if (o === n) continue;
      const vx = o.x - n.x, vy = o.y - n.y, d = Math.hypot(vx, vy), pr = (vx * dx + vy * dy) / d;
      if (pr < 0.42) continue;                                                  // 약 65도 안쪽만
      const s = d * (1 + (1 - pr) * 2.2) + (SK_ADJ[n.id].includes(o.id) ? -30 : 0);
      if (s < bs) { bs = s; best = o; }
    }
    if (best) this.select(best);
  },
  nodeAt(sx, sy2) {
    const [wx, wy] = this.s2w(sx, sy2); let best = null, bd = 1e9;
    for (const n of SKN) { const d = Math.hypot(n.x - wx, n.y - wy), R = SK_TYPE[n.type].R + 8 / this.cam.z; if (d < R && d < bd) { bd = d; best = n; } }
    return best;
  },

  // ---------- 배우기 · 되돌리기 · 초기화 ----------
  tryLearn() {
    if (this.cine && this.cine.t < 40) return;
    const n = this.cur(), c = Prog.check(n);
    if (!c.ok) {
      if (c.core) { this.say(n.d, '#ffe9a6'); Sfx.play('ui', 0.5, 0.9); return; }
      Sfx.play('ui', 0.6, 0.5); this.say(c.why, c.max ? '#ffd24a' : '#ff8a70'); this.denyT[n.id] = this.t; return;
    }
    const doneBefore = SK_ARM_KEYS.filter(a => Prog.armDone(a));
    const first = Prog.r(n.id) === 0;
    const from = SK_ADJ[n.id].map(id => SKN_BY[id]).filter(o => Prog.r(o.id) > 0).sort((a, b) => a.r - b.r)[0];
    Prog.learn(n);
    const r = Prog.r(n.id);
    Sfx.play('ring', 0.55, 1.05 + r * 0.06);
    if (first && from) { this.comets.push({ x0: from.x, y0: from.y, x1: n.x, y1: n.y, t: 0, life: 16, col: n.col, n, r }); Sfx.play('dash', 0.35, 1.6); }
    else this.ignite(n, r);
    if (n.type === 'k' && first) this.cineQ.push({ kind: 'key', n });
    if (n.awk) { this.cineQ.push({ kind: 'awk', n }); Sfx.play('combo', 0.8, 0.7); }
    for (const a of SK_ARM_KEYS) if (!doneBefore.includes(a) && Prog.armDone(a)) this.cineQ.push({ kind: 'arm', arm: a });
    this.refArm = 0; this.resetArm = 0;
    if (n.awk) { this.say(`「${n.name}」 각성!  ${SK_AWK_KEY} 키로 사용합니다`, '#ffd24a', 220); return; }
    this.say(r >= n.max ? (n.max > 1 ? `「${n.name}」 최대 랭크!` : `「${n.name}」 습득!`) : `「${n.name}」 ${r} / ${n.max}`, n.type === 'k' ? '#ffd24a' : `rgb(${n.col})`);
  },
  // 각성기 장착 (여러 개를 각성했을 때 Y 키로 쓸 것을 고른다)
  tryEquip(n) {
    if (!Prog.r(n.id)) { Sfx.play('ui', 0.6, 0.5); this.say('먼저 각성해야 합니다', '#ff8a70'); return; }
    if (!Prog.awkOn(n.awk)) { Sfx.play('ui', 0.6, 0.5); this.say('갈래의 별이 모두 밝혀져 있어야 쓸 수 있습니다', '#ff8a70'); return; }
    if (Prog.awkSel() === n.awk) { this.say(`이미 「${n.name}」을 장착하고 있습니다`, '#c8d0ec'); return; }
    Save.data.awkSel = n.awk; Save.save(); Prog.refresh();
    Sfx.play('ring', 0.7, 1.3); Sfx.play('clear', 0.4, 1.4);
    this.fx.push({ k: 'ring', x: n.x, y: n.y, r0: 30, r1: 150, t: 0, life: 26, col: n.col, w: 7 });
    this.say(`「${n.name}」 장착  ·  ${SK_AWK_KEY} 키`, '#ffd24a');
  },
  tryRefund() {
    const n = this.cur();
    if (n.awk) { this.tryEquip(n); return; }
    const c = Prog.canRefund(n);
    if (!c.ok) { Sfx.play('ui', 0.6, 0.5); this.say(c.why, '#ff8a70'); this.refArm = 0; return; }
    if (this.refArm <= 0) { this.refArm = 180; this.resetArm = 0; Sfx.play('ui', 0.8, 0.8); this.say(`한 번 더 누르면 ${fmt(Prog.refundCost())} G를 내고 1랭크 되돌립니다`, '#ffb070'); return; }
    Prog.refund(n); this.refArm = 0;
    Sfx.play('coin', 0.8, 0.8); Sfx.play('ui', 0.6, 0.7);
    const S = SK_TYPE[n.type].R;
    this.fx.push({ k: 'ring', x: n.x, y: n.y, r0: S * 2.6, r1: S * 0.8, t: 0, life: 18, col: '170,180,210', w: 4 });
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU), d = rand(40, 70); this.fx.push({ k: 'spark', x: n.x + Math.cos(a) * d, y: n.y + Math.sin(a) * d, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3, g: 0, t: 0, life: 16, col: '180,190,220', r: rand(2, 4) }); }
    this.say(`「${n.name}」 ${Prog.r(n.id)} / ${n.max}  (되돌림)`, '#c8d0ec');
  },
  tryReset() {
    const c = Prog.resetCost();
    if (!Prog.spent()) { this.say('되돌릴 포인트가 없습니다', '#9aa4c0'); return; }
    if (this.resetArm <= 0) { this.resetArm = 180; this.refArm = 0; Sfx.play('ui', 0.8, 0.8); this.say(`한 번 더 누르면 ${fmt(c)} G를 내고 모든 별을 끕니다`, '#ffb070'); return; }
    const lit = SKN.filter(n => n.type !== 'core' && Prog.r(n.id) > 0);
    if (!Prog.reset()) { Sfx.play('ui', 0.8, 0.5); this.say('골드가 부족합니다', '#ff8a70'); this.resetArm = 0; return; }
    this.resetArm = 0; Sfx.play('coin', 1, 0.8); Sfx.play('dash', 0.6, 0.7); this.say('모든 별을 껐습니다. 포인트를 돌려받았습니다', '#7dffa0');
    lit.sort((a, b) => b.r - a.r).forEach((n, k) => {
      this.fx.push({ k: 'ring', x: n.x, y: n.y, r0: 14, r1: 64, t: -k * 1.5, life: 22, col: n.col, w: 5 });
      for (let i = 0; i < 10; i++) { const a = rand(0, TAU), s = rand(1.5, 4.5); this.fx.push({ k: 'spark', x: n.x, y: n.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, g: 0.1, t: -k * 1.5, life: rand(22, 38), col: chance(0.5) ? n.col : '170,180,210', r: rand(2.5, 5) }); }
    });
    this.shake = 9; this.flashA = 0.14;
  },

  // 별이 밝혀지는 순간
  ignite(n, r) {
    const max = r >= n.max, big = n.type === 'k' || n.type === 'n' || max, S = SK_TYPE[n.type].R, col = n.col, gold = SK_GOLD;
    this.learnT[n.id] = this.t; this.shake = Math.max(this.shake, n.type === 'k' ? 12 : big ? 6 : 3); this.flashA = Math.max(this.flashA, n.type === 'k' ? 0.2 : big ? 0.08 : 0.04);
    this.fx.push({ k: 'ring', x: n.x, y: n.y, r0: S * 0.8, r1: S * (big ? 4.6 : 3.2), t: 0, life: big ? 30 : 22, col: max ? gold : col, w: big ? 8 : 6 });
    this.fx.push({ k: 'ring', x: n.x, y: n.y, r0: S * 0.6, r1: S * 2.4, t: 0, life: 18, col: '255,255,255', w: 3 });
    if (big) this.fx.push({ k: 'ray', x: n.x, y: n.y, t: 0, life: 40, col: max ? gold : col, n: n.type === 'k' ? 18 : 12, len: S * 6 });
    if (n.type === 'k') this.fx.push({ k: 'ring', x: n.x, y: n.y, r0: 10, r1: S * 8, t: -6, life: 44, col, w: 4 });
    const cnt = n.type === 'k' ? 60 : big ? 34 : 20;
    for (let i = 0; i < cnt; i++) {
      const a = rand(0, TAU), s = rand(1.5, n.type === 'k' ? 8 : 5.5);
      this.fx.push({ k: 'spark', x: n.x, y: n.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.05, t: 0, life: rand(22, n.type === 'k' ? 56 : 40), col: choose(max || n.type === 'k' ? [col, gold, '255,255,255'] : [col, col, '255,255,255']), r: rand(2, 5) });
    }
    const str = n.type === 'k' ? '극성 각성!' : max ? (n.max > 1 ? 'MAX!' : '습득!') : `${r} / ${n.max}`;
    this.fx.push({ k: 'text', x: n.x, y: n.y - S - 18, t: 0, life: 56, str, col: max || n.type === 'k' ? gold : col, size: big ? 22 : 17 });
    Sfx.play('clear', 0.3, 1.7);
    if (max || n.type === 'k') Sfx.play('combo', 0.6, n.type === 'k' ? 0.85 : 1.2);
    // 이웃한 선을 따라 퍼지는 빛 (다음에 밝힐 수 있는 별 쪽으로)
    for (const id of SK_ADJ[n.id]) {
      const o = SKN_BY[id];
      if (Prog.r(id) > 0 || !Prog.check(o).ok) continue;
      this.fx.push({ k: 'pulse', x0: n.x, y0: n.y, x1: o.x, y1: o.y, t: -4, life: 18, col });
    }
  },

  // ---------- 매 프레임 ----------
  update() {
    this.t++;
    if (this.msgT > 0) this.msgT--;
    if (this.resetArm > 0) this.resetArm--;
    if (this.refArm > 0) this.refArm--;
    if (this.cine && ++this.cine.t >= this.cine.life) this.cine = null;
    if (!this.cine && this.cineQ.length && !this.comets.length) this.startCine(this.cineQ.shift());
    if (Input.take('pause')) { if (this.cine) this.skipCine(); else { this.leave(); return; } }
    for (const q of Input.drain()) {
      if (this.cine) { this.skipCine(); continue; }
      switch (q.a) {
        case 'left': this.move(-1, 0); break;
        case 'right': this.move(1, 0); break;
        case 'up': this.move(0, -1); break;
        case 'down': this.move(0, 1); break;
        case 'confirm': case 'jump': this.tryLearn(); break;
        case 'shop': this.tab ^= 1; Sfx.play('ui', 0.5, 1); break;
        case 'diff': this.tryRefund(); break;
        case 'tower': this.zoomAt(1.25, this.bcx(), this.bcy()); this.focus(this.cur()); break;
        case 'tower2': this.fitView(); break;
        case 'tree': case 'back': this.leave(); return;
      }
    }
    if (this.lastSel !== this.sel) { this.lastSel = this.sel; this.panelT = 0; }
    if (this.panelT < 1) this.panelT = Math.min(1, this.panelT + 0.09);
    // 카메라
    const c = this.cam, g = this.tgt;
    c.x = lerp(c.x, g.x, 0.2); c.y = lerp(c.y, g.y, 0.2); c.z = lerp(c.z, g.z, 0.22);
    const n = this.cur(), k = this.cursor || (this.cursor = { x: n.x, y: n.y });
    k.x = lerp(k.x, n.x, 0.3); k.y = lerp(k.y, n.y, 0.3);
    this.shake *= 0.86; if (this.shake < 0.2) this.shake = 0;
    this.flashA *= 0.88;
    // 마우스를 올린 별
    this.hover = null;
    if (!Touch.on && !this.drag && performance.now() - Ptr.last < 3000 && inR(Ptr.x, Ptr.y, this.BR)) { const h = this.nodeAt(Ptr.x, Ptr.y); if (h) this.hover = h.id; }
    // 연출
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t++;
      if (f.k === 'spark' && f.t > 0) { f.x += f.vx; f.y += f.vy; f.vx *= 0.93; f.vy = f.vy * 0.93 + f.g; }
      if (f.t >= f.life) this.fx.splice(i, 1);
    }
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const m = this.comets[i];
      if (++m.t >= m.life) { this.comets.splice(i, 1); this.ignite(m.n, m.r); }
    }
  },
  startCine(q) {
    this.cine = Object.assign({ t: 0, life: q.kind === 'key' ? 150 : q.kind === 'awk' ? 210 : 170 }, q);
    Sfx.play('clear', 0.8, q.kind === 'key' ? 1 : 0.8); Sfx.play('ring', 0.8, 0.8);
    if (q.kind === 'arm') Sfx.play('combo', 0.8, 0.7);
  },
  skipCine() { const C = this.cine; if (C && C.t > 24 && C.t < C.life - 20) C.t = C.life - 20; },

  // ---------- 포인터 ----------
  pDown(x, y) {
    if (this.cine) { this.skipCine(); return; }
    if (inR(x, y, this.backRect())) { this.leave(); return; }
    for (let i = 0; i < 4; i++) if (inR(x, y, this.chipRect(i))) { this.focusArm(SK_ARM_KEYS[i]); return; }
    for (let i = 0; i < 2; i++) if (inR(x, y, this.tabRect(i))) { if (this.tab !== i) { this.tab = i; Sfx.play('ui', 0.5, 1); } return; }
    if (this.tab === 0) {
      if (inR(x, y, this.learnRect())) { this.tryLearn(); return; }
      if (inR(x, y, this.refundRect())) { this.tryRefund(); return; }
    }
    if (inR(x, y, this.resetRect())) { this.tryReset(); return; }
    if (inR(x, y, this.zoomRect(0))) { this.zoomAt(1.25, this.bcx(), this.bcy()); return; }
    if (inR(x, y, this.zoomRect(1))) { this.zoomAt(0.8, this.bcx(), this.bcy()); return; }
    if (inR(x, y, this.zoomRect(2))) { this.fitView(); return; }
    if (inR(x, y, this.BR)) this.drag = { x0: x, y0: y, cx: this.tgt.x, cy: this.tgt.y, moved: false };
  },
  pMove(x, y, down) {
    const d = this.drag; if (!d || !down) return;
    const dx = x - d.x0, dy = y - d.y0;
    if (!d.moved && Math.hypot(dx, dy) > (Touch.on ? 12 : 7)) d.moved = true;
    if (d.moved) { this.tgt.x = d.cx - dx / this.cam.z; this.tgt.y = d.cy - dy / this.cam.z; this.clampCam(); this.cam.x = this.tgt.x; this.cam.y = this.tgt.y; }
  },
  pUp(x, y) {
    const d = this.drag; this.drag = null;
    if (!d || d.moved) return;
    const n = this.nodeAt(x, y); if (!n) return;
    if (this.sel === n.id) this.tryLearn();                                    // 이미 고른 별을 한 번 더 누르면 배운다
    else this.select(n);
  },
  wheel(dy) { if (this.cine) return; const x = inR(Ptr.x, Ptr.y, this.BR) ? Ptr.x : this.bcx(), y = inR(Ptr.x, Ptr.y, this.BR) ? Ptr.y : this.bcy(); this.zoomAt(dy > 0 ? 0.88 : 1.14, x, y); },
  focusArm(a) {
    const A = SK_ARMS[a], ns = SKN.filter(n => n.arm === a && !n.bridge);
    const cx = ns.reduce((s, n) => s + n.x, 0) / ns.length, cy = ns.reduce((s, n) => s + n.y, 0) / ns.length;
    this.tgt.z = Math.min(this.maxZ(), this.fitZ * 1.5); this.tgt.x = cx; this.tgt.y = cy; this.clampCam();
    const first = ns.find(n => Prog.check(n).ok) || ns[0];
    this.select(first, true); Sfx.play('ui', 0.5, 1.1);
    this.say(`${A.name}  ·  ${A.sub}`, `rgb(${A.col})`, 90);
  },

  // ============================================================
  //  그리기
  // ============================================================
  state(n) {
    const r = Prog.r(n.id), chk = Prog.check(n), lit = r > 0;
    const exed = !lit && !!Prog.exTaken(n), linked = Prog.linked(n);
    return { r, lit, max: r >= n.max, can: chk.ok, exed, linked, dim: !lit && !chk.ok && (!linked || exed), lvLock: !lit && n.lv && Prog.lv() < n.lv, chk };
  },
  icon(n, mode) {
    const key = n.id + mode; if (this.iconC[key]) return this.iconC[key];
    const c = makeCanvas(96, 96), g = c.getContext('2d'); g.scale(2, 2);
    const col = mode === 'g' ? '140,146,172' : n.col;
    if (n.g[0] === '@') {
      const im = UI.icons[n.g.slice(1)];
      if (im) {
        g.save(); g.beginPath(); g.arc(24, 24, 21, 0, TAU); g.clip(); g.drawImage(im, 1, 1, 46, 46); g.restore();
        if (mode === 'g') { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(14,16,26,0.66)'; g.fillRect(0, 0, 48, 48); }
      }
    } else if (!SKG(g, n.g, col)) { try { WS.glyph(g, n.g, col); } catch (e) { } }
    return (this.iconC[key] = c);
  },
  // 별 그림 조각 : 상태(랭크 · 밝음 · 막힘)가 같으면 다시 그리지 않는다
  sprite(n, S, kind, Q = 2.25) {
    const sk = `${kind}|${S.r}|${+S.lit}|${+S.can}|${+S.dim}|${+S.exed}|${+!!S.lvLock}|${Q}`;
    const box = this.plateC[n.id] || (this.plateC[n.id] = {});
    if (box[sk]) return box[sk];
    if (Object.keys(box).length > 6) for (const k in box) delete box[k];
    const T = SK_TYPE[n.type], R = T.R, c = n.col, gold = SK_GOLD, core = n.type === 'core', max = S.r >= n.max;
    const ac = (max && n.type !== 's') || core ? gold : c, h = kind === 'star' ? R * 1.85 : kind === 'tick' ? R + 13 : R + 20;
    const cv = makeCanvas(Math.ceil(h * 2 * Q), Math.ceil(h * 2 * Q)), g = cv.getContext('2d');
    g.scale(Q, Q); g.translate(h, h);
    if (kind === 'star') {
      const aw = n.type === 'a', N = core ? 12 : aw ? 16 : 8, R1 = R * (core ? 1.55 : aw ? 1.72 : 1.48), R2 = R * (aw ? 1.14 : 1.08);
      g.beginPath();
      for (let i = 0; i < N * 2; i++) { const a = i * Math.PI / N, rr = i % 2 ? R2 : R1; i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      g.closePath();
      g.fillStyle = S.lit ? `rgba(${c},0.16)` : 'rgba(20,24,40,0.7)'; g.fill();
      g.strokeStyle = S.lit ? `rgba(${ac},0.75)` : S.can ? `rgba(${c},0.55)` : 'rgba(120,130,170,0.3)'; g.lineWidth = 1.4; g.stroke();
      g.strokeStyle = S.lit ? `rgba(${ac},0.45)` : 'rgba(120,130,170,0.18)'; g.lineWidth = 1; g.setLineDash([2, 5]);
      g.beginPath(); g.arc(0, 0, R * 1.75, 0, TAU); g.stroke();
    } else if (kind === 'tick') {
      g.strokeStyle = S.lit ? `rgba(${ac},0.7)` : S.can ? `rgba(${c},0.5)` : 'rgba(120,130,170,0.28)'; g.lineWidth = 1.6;
      g.beginPath(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12, L = R + (i % 3 ? 8 : 11); g.moveTo(Math.cos(a) * (R + 5), Math.sin(a) * (R + 5)); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); }
      g.stroke();
    } else {
      const gr = g.createRadialGradient(-R * 0.2, -R * 0.35, R * 0.1, 0, 0, R);
      if (S.lit) { gr.addColorStop(0, `rgba(${ac},0.85)`); gr.addColorStop(0.5, `rgba(${c},0.32)`); gr.addColorStop(1, 'rgba(8,10,22,0.97)'); }
      else { gr.addColorStop(0, S.dim ? 'rgba(28,30,42,0.97)' : 'rgba(36,46,78,0.97)'); gr.addColorStop(1, 'rgba(7,8,16,0.98)'); }
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
      g.lineWidth = max && !core ? 3 : 2.2;
      g.strokeStyle = core ? `rgb(${gold})` : max ? '#ffd24a' : S.lit ? `rgb(${c})` : S.can ? `rgba(${c},0.6)` : S.dim ? 'rgba(90,96,120,0.45)' : 'rgba(130,140,180,0.55)';
      g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, R - 4, 0, TAU); g.stroke();
      const ic = this.icon(n, S.lit || S.can || core ? 'c' : 'g'), is = R * (core ? 1.3 : n.g[0] === '@' ? 1.55 : 1.42);
      if (S.lit) { g.save(); g.globalCompositeOperation = 'lighter'; drawGlow(g, 0, 0, R * 0.9, ac, 0.3); g.restore(); }
      g.save(); g.globalAlpha = S.dim ? 0.4 : S.lit || core ? 1 : S.can ? 0.85 : 0.6;
      g.drawImage(ic, -is / 2, -is / 2 - (core ? 2 : 0), is, is); g.restore();
      if (n.max > 1) {
        const a0 = Math.PI * 0.78, span = Math.PI * 1.44, seg = span / n.max, gap = Math.min(0.16, seg * 0.3), RR = R + 5.5;
        g.lineCap = 'round'; g.lineWidth = 3.2;
        for (let i = 0; i < n.max; i++) {
          g.strokeStyle = i < S.r ? (max ? '#ffd24a' : `rgb(${c})`) : 'rgba(255,255,255,0.13)';
          g.beginPath(); g.arc(0, 0, RR, a0 + i * seg + gap / 2, a0 + (i + 1) * seg - gap / 2); g.stroke();
        }
      }
      if (S.exed) {
        g.strokeStyle = 'rgba(255,110,90,0.7)'; g.lineWidth = 2.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-R * 0.55, -R * 0.55); g.lineTo(R * 0.55, R * 0.55); g.moveTo(R * 0.55, -R * 0.55); g.lineTo(-R * 0.55, R * 0.55); g.stroke();
      }
      if (S.lvLock) {
        const ty = R + 9, w = 40;
        g.fillStyle = 'rgba(10,10,18,0.88)'; roundRect(g, -w / 2, ty - 7, w, 14, 7); g.fill();
        g.strokeStyle = 'rgba(255,140,110,0.6)'; g.lineWidth = 1; g.stroke();
        UI.text(g, `Lv.${n.lv}`, 0, ty + 0.5, { size: 10, align: 'center', font: FONT_B, weight: 800, fill: '#ffb0a0' });
      }
    }
    return (box[sk] = { c: cv, h });
  },
  makeBg() {
    const c = makeCanvas(W + 240, H + 240), g = c.getContext('2d'), rnd = mulberry(7731);
    const bg = g.createRadialGradient(c.width / 2, c.height * 0.45, 40, c.width / 2, c.height / 2, c.width * 0.62);
    bg.addColorStop(0, '#141a34'); bg.addColorStop(0.5, '#0a0e1e'); bg.addColorStop(1, '#03040a');
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'lighter';
    const cols = ['80,90,200', '140,60,170', '40,120,170', '170,70,90', '60,140,120'];
    for (let i = 0; i < 26; i++) drawGlow(g, rnd() * c.width, rnd() * c.height, 120 + rnd() * 260, cols[i % cols.length], 0.05 + rnd() * 0.07, 1 + rnd() * 0.8, 0.6 + rnd() * 0.5);
    for (let i = 0; i < 520; i++) {
      const x = rnd() * c.width, y = rnd() * c.height, b = rnd(), s = b > 0.97 ? 2.2 : b > 0.85 ? 1.5 : 1;
      g.fillStyle = `rgba(${b > 0.6 ? '220,228,255' : '170,180,230'},${0.15 + b * 0.45})`; g.fillRect(x, y, s, s);
    }
    this.bg = c;
    this.twk = []; for (let i = 0; i < 46; i++) this.twk.push({ x: rnd() * c.width, y: rnd() * c.height, ph: rnd() * TAU, s: 0.5 + rnd() * 1.4, sp: 0.02 + rnd() * 0.05 });
  },

  draw(ctx) {
    if (!this.bg) this.makeBg();
    const t = this.t, c = this.cam;
    this.S = {}; for (const n of SKN) this.S[n.id] = this.state(n);
    // 배경 : 카메라를 따라 아주 조금 움직인다
    const ox = -120 - clamp(c.x * 0.12, -110, 110), oy = -120 - clamp(c.y * 0.12, -110, 110);
    ctx.drawImage(this.bg, ox, oy);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const s of this.twk) { const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * s.sp + s.ph)); drawGlow(ctx, s.x + ox, s.y + oy, 4 + s.s * 3, '210,220,255', a * 0.55); }
    ctx.restore();

    // ===== 별자리 판 =====
    const B = this.BR;
    ctx.save();
    ctx.fillStyle = 'rgba(4,6,14,0.35)'; roundRect(ctx, B.x, B.y, B.w, B.h, 14); ctx.fill();
    roundRect(ctx, B.x + 1, B.y + 1, B.w - 2, B.h - 2, 13); ctx.clip();
    let shx = 0, shy = 0; if (this.shake) { shx = (Math.random() - 0.5) * this.shake; shy = (Math.random() - 0.5) * this.shake * 0.7; }
    ctx.translate(this.bcx() + shx, this.bcy() + shy); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    this.drawSky(ctx);
    this.drawEdges(ctx);
    this.drawAwkLinks(ctx);
    this.drawComets(ctx);
    for (const n of SKN) if (n.id !== this.sel) this.drawEmblem(ctx, n, n.x, n.y, 1, this.S[n.id]);
    this.drawEmblem(ctx, this.cur(), this.cur().x, this.cur().y, 1, this.S[this.sel]);
    this.drawCursor(ctx);
    this.drawFx(ctx);
    if (c.z > 1.25) this.drawNames(ctx);
    ctx.restore();
    // 판 테두리 · 버튼
    ctx.strokeStyle = 'rgba(201,165,92,0.4)'; ctx.lineWidth = 1.5; roundRect(ctx, B.x, B.y, B.w, B.h, 14); ctx.stroke();
    this.drawBoardUI(ctx);
    if (this.flashA > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,236,190,${this.flashA})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

    this.drawHeader(ctx);
    this.drawPanel(ctx);
    this.drawTip(ctx);
    ctx.drawImage(UI.vignette, 0, 0);
    this.drawCine(ctx);
  },

  // 하늘 : 갈래별 성운 · 천구 고리 · 갈래 이름
  drawSky(ctx) {
    const t = this.t;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const a of SK_ARM_KEYS) {
      const A = SK_ARMS[a], th = A.th * DEG, u = Prog.armSpent(a) / Prog.armMax(a);
      drawGlow(ctx, Math.cos(th) * 3 * SK_UX, Math.sin(th) * 3 * SK_UY, 300, A.col, 0.05 + u * 0.16 + Math.sin(t * 0.02 + th) * 0.012, 1.1, 1);
    }
    drawGlow(ctx, 0, 0, 170, SK_GOLD, 0.16 + Math.sin(t * 0.03) * 0.03);
    ctx.restore();
    // 천구 고리
    ctx.save();
    for (const [r, a, dash] of [[1.62, 0.07, [3, 9]], [3.22, 0.06, [2, 10]], [5.05, 0.09, [1, 0]]]) {
      ctx.strokeStyle = `rgba(200,210,255,${a})`; ctx.lineWidth = 1.2; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.ellipse(0, 0, r * SK_UX, r * SK_UY, 0, 0, TAU); ctx.stroke();
    }
    ctx.setLineDash([]);
    // 바깥 고리 눈금 (천천히 돈다)
    ctx.strokeStyle = 'rgba(200,210,255,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 120; i++) {
      const a = i * TAU / 120 + t * 0.0006, L = i % 10 === 0 ? 0.16 : 0.07, cx = Math.cos(a), cy = Math.sin(a);
      ctx.moveTo(cx * 5.05 * SK_UX, cy * 5.05 * SK_UY); ctx.lineTo(cx * (5.05 + L) * SK_UX, cy * (5.05 + L) * SK_UY);
    }
    ctx.stroke();
    ctx.restore();
    // 각성 별 이름표
    for (const n of SKN) {
      if (!n.awk) continue;
      const S = this.S[n.id], D = SK_AWK[n.awk], y = n.y + SK_TYPE.a.R * 1.72 + 18, done = Prog.awkReady(n.awk);
      UI.text(ctx, D.name, n.x, y, { size: 15, align: 'center', fill: S.lit ? '#ffe9a6' : done ? '#fff' : '#8a94b4', stroke: 4 });
      UI.text(ctx, S.lit ? '각성 완료' : done ? '각성할 수 있다!' : Prog.armOpen(n.awk) && Prog.job() === n.awk ? '2차 전직 필요' : `${Prog.armOpenCount(n.awk)} / ${Prog.armNodes(n.awk).length}`, n.x, y + 16, { size: 11, align: 'center', font: FONT_B, weight: 800, fill: S.lit ? '#ffd24a' : done ? '#7dffa0' : '#6a7494', stroke: 3 });
    }
    // 갈래 이름 (가장 바깥 별들 사이) · 택일 표시
    for (const a of SK_ARM_KEYS) {
      const A = SK_ARMS[a], th = A.th * DEG, x = Math.cos(th) * A.lab * SK_UX, y = Math.sin(th) * A.lab * SK_UY;
      const done = this.S && Prog.st().D[a], u = Prog.armSpent(a) / Prog.armMax(a);
      const ex = a !== 's' ? SKN.filter(n => n.arm === a && n.ex) : null;
      if (ex) {
        // 두 극성을 잇는 점선 (택일)
        const taken = ex.find(n => Prog.r(n.id) > 0);
        ctx.save(); ctx.strokeStyle = taken ? `rgba(${A.col},0.25)` : `rgba(${A.col},${0.3 + Math.sin(this.t * 0.06) * 0.1})`; ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
        for (const n of ex) { const d = Math.hypot(n.x - x, n.y - y), R = SK_TYPE.k.R + 8; ctx.beginPath(); ctx.moveTo(x + (n.x - x) * 26 / d, y + (n.y - y) * 26 / d); ctx.lineTo(n.x - (n.x - x) * R / d, n.y - (n.y - y) * R / d); ctx.stroke(); }
        ctx.restore();
      }
      if (done) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, 70, SK_GOLD, 0.25 + Math.sin(this.t * 0.08) * 0.08); ctx.restore(); }
      UI.text(ctx, A.han, x, y - (ex ? 12 : 6), { size: 22, align: 'center', fill: done ? '#ffe9a6' : `rgba(${A.col},${0.55 + u * 0.45})`, stroke: 4 });
      UI.text(ctx, A.name, x, y + (ex ? 9 : 14), { size: 10.5, align: 'center', font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 3 });
      if (ex) UI.text(ctx, '◆ 오의 택일 ◆', x, y + 24, { size: 9.5, align: 'center', font: FONT_B, weight: 700, fill: `rgba(${A.col},0.8)`, stroke: 3 });
    }
  },

  // 별 사이의 선 : 둘 다 밝으면 빛이 흐르고, 한쪽만 밝으면 점선이 움직인다
  drawEdges(ctx) {
    const t = this.t;
    for (const [a, b] of SK_EDGES) {
      let A = SKN_BY[a], Bn = SKN_BY[b];
      if (Bn.r < A.r) [A, Bn] = [Bn, A];                                         // A : 가운데 쪽
      const sa = this.S[A.id], sb = this.S[Bn.id];
      const d = Math.hypot(Bn.x - A.x, Bn.y - A.y), ux = (Bn.x - A.x) / d, uy = (Bn.y - A.y) / d;
      const ra = SK_TYPE[A.type].R + 3, rb = SK_TYPE[Bn.type].R + 3;
      const x0 = A.x + ux * ra, y0 = A.y + uy * ra, x1 = Bn.x - ux * rb, y1 = Bn.y - uy * rb;
      const col = Bn.type === 'core' ? A.col : Bn.col;
      ctx.save();
      if (sa.lit && sb.lit) {
        ctx.strokeStyle = `rgba(${col},0.22)`; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = `rgba(${col},0.95)`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 60));
        for (let k = 0; k < n; k++) { const u = (t * 0.012 + k / n + A.x * 0.001) % 1; drawGlow(ctx, lerp(x0, x1, u), lerp(y0, y1, u), 7, col, 0.85 * Math.sin(Math.PI * u)); }
      } else if ((sa.lit && sb.can) || (sb.lit && sa.can)) {
        ctx.strokeStyle = `rgba(${col},0.16)`; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.strokeStyle = `rgba(${col},${0.55 + Math.sin(t * 0.12) * 0.25})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = sa.lit ? -t * 0.6 : t * 0.6;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      } else if (sa.lit || sb.lit) {
        ctx.strokeStyle = `rgba(${col},0.28)`; ctx.lineWidth = 1.6; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(140,150,190,0.17)'; ctx.lineWidth = 1.3; ctx.setLineDash([2, 6]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      ctx.restore();
    }
  },
  // 각성 별 : 갈래의 끝 별에서 이어지는 빛줄기
  drawAwkLinks(ctx) {
    const t = this.t;
    for (const n of SKN) {
      if (!n.awk) continue;
      const S = this.S[n.id], done = Prog.awkReady(n.awk), c = n.col;
      for (const id of n.tips) {
        const o = SKN_BY[id], d = Math.hypot(n.x - o.x, n.y - o.y), ux = (n.x - o.x) / d, uy = (n.y - o.y) / d;
        const x0 = o.x + ux * (SK_TYPE[o.type].R + 3), y0 = o.y + uy * (SK_TYPE[o.type].R + 3), x1 = n.x - ux * (SK_TYPE.a.R + 4), y1 = n.y - uy * (SK_TYPE.a.R + 4);
        ctx.save();
        if (S.lit) {
          ctx.strokeStyle = `rgba(${c},0.25)`; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.strokeStyle = `rgba(${SK_GOLD},0.95)`; ctx.lineWidth = 2.6; ctx.stroke();
          ctx.globalCompositeOperation = 'lighter';
          for (let k = 0; k < 3; k++) { const u = (t * 0.016 + k / 3) % 1; drawGlow(ctx, lerp(x0, x1, u), lerp(y0, y1, u), 8, SK_GOLD, 0.9 * Math.sin(Math.PI * u)); }
        } else if (done) {
          ctx.strokeStyle = `rgba(${SK_GOLD},${0.5 + Math.sin(t * 0.14) * 0.3})`; ctx.lineWidth = 2.4; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 0.8;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        } else {
          ctx.strokeStyle = `rgba(${c},0.22)`; ctx.lineWidth = 1.6; ctx.setLineDash([2, 8]);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        ctx.restore();
      }
    }
  },
  drawComets(ctx) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const m of this.comets) {
      const u = Ease.inOut(m.t / m.life);
      for (let k = 0; k < 6; k++) { const v = Math.max(0, u - k * 0.05); drawGlow(ctx, lerp(m.x0, m.x1, v), lerp(m.y0, m.y1, v), 14 - k * 2, k ? m.col : '255,255,255', 0.95 - k * 0.14); }
    }
    for (const f of this.fx) {
      if (f.k !== 'pulse' || f.t < 0) continue;
      const u = Ease.out3(f.t / f.life);
      drawGlow(ctx, lerp(f.x0, f.x1, u), lerp(f.y0, f.y1, u), 9, f.col, 0.9 * (1 - u * 0.6));
    }
    ctx.restore();
  },

  // 별 하나 (판 위 · 정보 판 · 각성 연출 공용)
  drawEmblem(ctx, n, x, y, k, S) {
    const t = this.t, T = SK_TYPE[n.type], R = T.R * k, c = n.col, gold = SK_GOLD;
    const { lit, max, can } = S;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.12 + n.x * 0.013 + n.y * 0.007);
    const core = n.type === 'core', key = n.type === 'k' || n.type === 'a', ac = (max && n.type !== 's') || core ? gold : c;
    const lt = t - (this.learnT[n.id] ?? -999), dn = t - (this.denyT[n.id] ?? -999);
    let sc = 1;
    if (lt >= 0 && lt < 30) { const u = lt / 30; sc = 1 + 0.4 * Math.exp(-u * 5) * Math.cos(u * 14); }
    if (k === 1 && this.hover === n.id && n.id !== this.sel) sc *= 1.08;
    if (dn >= 0 && dn < 18) x += Math.sin(dn * 1.7) * 5 * (1 - dn / 18) * k;
    ctx.save();
    ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
    // 바깥 빛
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (lit) drawGlow(ctx, x, y, R * (key || core ? 2.9 : 2.3), ac, (core ? 0.5 : key ? 0.42 : 0.3) + pulse * 0.08);
    else if (can) drawGlow(ctx, x, y, R * 2.3, c, 0.1 + pulse * 0.18);
    ctx.restore();
    // 근원 · 극성 : 뒤에서 천천히 도는 별 모양 (그림을 만들어 두고 돌린다)
    if (key || core) {
      const rot = t * (core ? 0.003 : 0.005) * (n.x < 0 ? -1 : 1), sp = this.sprite(n, S, 'star');
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k); ctx.drawImage(sp.c, -sp.h, -sp.h, sp.h * 2, sp.h * 2); ctx.restore();
      if (lit) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) { const a = i * TAU / 4 - rot * 1.4; drawGlow(ctx, x + Math.cos(a) * R * 1.75, y + Math.sin(a) * R * 1.75, 5 * k, ac, 0.9); }
        ctx.restore();
      }
    }
    // 명성 : 눈금 고리
    if (n.type === 'n') {
      const sp = this.sprite(n, S, 'tick');
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.006); ctx.scale(k, k); ctx.drawImage(sp.c, -sp.h, -sp.h, sp.h * 2, sp.h * 2); ctx.restore();
    }
    // 근원 : 빛줄기
    if (core) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(-t * 0.002); ctx.fillStyle = `rgba(${gold},0.05)`;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16, L = R * (i % 2 ? 2.2 : 3) * (0.85 + 0.15 * Math.sin(t * 0.05 + i)); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - 0.05) * L, Math.sin(a - 0.05) * L); ctx.lineTo(Math.cos(a + 0.05) * L, Math.sin(a + 0.05) * L); ctx.closePath(); }
      ctx.fill(); ctx.restore();
    }
    // 판 · 테두리 · 아이콘 · 랭크 고리 (상태가 바뀔 때만 다시 그린다)
    const pl = this.sprite(n, S, 'plate', k > 1.5 ? 3 : 2.25);
    ctx.drawImage(pl.c, x - pl.h * k, y - pl.h * k, pl.h * 2 * k, pl.h * 2 * k);
    // 배운 별 : 빛이 대각선으로 훑고 지나간다
    if (lit) {
      const q = ((t * 0.8 + n.x * 0.37 + n.y * 0.21) % 260 + 260) % 260 / 260;
      if (q < 0.28) {
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
        const sx = x - R * 1.6 + (q / 0.28) * R * 3.2, sg = ctx.createLinearGradient(sx - R * 0.4, y - R, sx + R * 0.4, y + R);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.3)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg; ctx.fillRect(x - R, y - R, R * 2, R * 2); ctx.restore();
      }
    }
    // 배울 수 있음 : 테두리가 숨 쉬듯 빛난다
    if (can) { ctx.save(); ctx.strokeStyle = `rgba(${c},${0.25 + pulse * 0.5})`; ctx.lineWidth = 2.4 * k; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); ctx.restore(); }
    // 막 배운 순간 : 하얗게 번쩍
    if (lt >= 0 && lt < 12) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - lt / 12)})`; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill(); ctx.restore(); }
    // 배울 수 있음 : 오른쪽 위 + 표시
    if (can) {
      const bx = x + R * 0.74, by = y - R * 0.74, s2 = (1 + pulse * 0.14) * Math.max(0.85, k * 0.75);
      ctx.save(); ctx.translate(bx, by); ctx.scale(s2, s2);
      ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#10131e'; ctx.fillRect(-4, -1.1, 8, 2.2); ctx.fillRect(-1.1, -4, 2.2, 8);
      ctx.restore();
    }
    ctx.restore();
  },

  drawCursor(ctx) {
    const n = this.cur(), k = this.cursor, t = this.t; if (!k) return;
    const R = SK_TYPE[n.type].R * (n.type === 'k' || n.type === 'a' ? 1.5 : n.type === 'core' ? 1.6 : 1) + 12 + Math.sin(t * 0.12) * 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, k.x, k.y, R * 1.6, n.col, 0.14 + 0.05 * Math.sin(t * 0.1)); ctx.restore();
    const u = (t % 70) / 70;
    ctx.save(); ctx.strokeStyle = `rgba(${n.col},${0.5 * (1 - u)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(k.x, k.y, R + u * 34, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(t * 0.02);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.shadowColor = `rgb(${n.col})`; ctx.shadowBlur = 10;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.beginPath(); ctx.arc(0, 0, R, a + 0.25, a + Math.PI / 2 - 0.25); ctx.stroke(); }
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(R + 9, 0); ctx.lineTo(R + 2, -4); ctx.lineTo(R + 2, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.restore();
  },
  drawNames(ctx) {
    const a = Math.min(1, (this.cam.z - 1.25) / 0.2);
    ctx.save(); ctx.globalAlpha = a;
    for (const n of SKN) {
      if (n.type === 'core' || n.awk) continue;
      const S = this.S[n.id], y = n.y + SK_TYPE[n.type].R + (S.lvLock ? 24 : 15);
      UI.text(ctx, n.name, n.x, y, { size: 11, align: 'center', font: FONT_B, weight: 800, fill: S.lit ? '#f2f4ff' : S.can ? `rgb(${n.col})` : '#8a94b4', stroke: 3 });
    }
    ctx.restore();
  },
  drawFx(ctx) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fx) {
      if (f.t < 0 || f.k === 'text' || f.k === 'pulse') continue;
      const u = f.t / f.life;
      if (f.k === 'ring') {
        ctx.strokeStyle = `rgba(${f.col},${0.9 * (1 - u)})`; ctx.lineWidth = f.w * (1 - u) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(1, lerp(f.r0, f.r1, Ease.out3(u))), 0, TAU); ctx.stroke();
      } else if (f.k === 'spark') drawGlow(ctx, f.x, f.y, f.r * (1 - u) + 2, f.col, 0.95 * (1 - u * 0.6));
      else if (f.k === 'ray') {
        const len = f.len * (0.3 + 0.7 * Ease.out3(u));
        ctx.fillStyle = `rgba(${f.col},${0.3 * (1 - u)})`;
        for (let i = 0; i < f.n; i++) {
          const a = i * TAU / f.n + f.t * 0.015, w = i % 2 ? 0.035 : 0.07, l2 = len * (i % 2 ? 0.65 : 1);
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a - w) * l2, f.y + Math.sin(a - w) * l2); ctx.lineTo(f.x + Math.cos(a + w) * l2, f.y + Math.sin(a + w) * l2); ctx.closePath(); ctx.fill();
        }
      }
    }
    ctx.restore();
    for (const f of this.fx) {
      if (f.k !== 'text' || f.t < 0) continue;
      const u = f.t / f.life, s = (f.t < 8 ? lerp(1.6, 1, Ease.out3(f.t / 8)) : 1) / Math.max(0.8, this.cam.z);
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - u) * 3);
      ctx.translate(f.x, f.y - 34 * Ease.out3(u)); ctx.scale(s, s);
      UI.text(ctx, f.str, 0, 0, { size: f.size, align: 'center', italic: true, fill: `rgb(${f.col})`, stroke: 5 });
      ctx.restore();
    }
  },

  // 판 위의 버튼 · 알림
  drawBoardUI(ctx) {
    const B = this.BR, t = this.t;
    // 확대 · 축소 · 전체 보기
    const labels = ['+', '−', '⤢'];
    for (let i = 0; i < 3; i++) {
      const r = this.zoomRect(i), hov = !Touch.on && inR(Ptr.x, Ptr.y, r);
      ctx.fillStyle = hov ? 'rgba(50,46,30,0.95)' : 'rgba(16,18,30,0.88)'; roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(201,165,92,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
      UI.text(ctx, labels[i], r.x + r.w / 2, r.y + r.h / 2 + 1, { size: i === 2 ? 17 : 22, align: 'center', font: FONT_B, weight: 800, fill: '#ffe9a6', stroke: 3 });
    }
    // 배율
    UI.text(ctx, `${Math.round(this.cam.z / this.fitZ * 100)}%`, this.zoomRect(0).x - 10, this.zoomRect(0).y + 17, { size: 11, align: 'right', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    // 범례
    const lg = [['소성', 's'], ['명성', 'n'], ['극성', 'k'], ['각성', 'a']];
    let lx = B.x + 18; const ly = B.y + B.h - 30;
    for (const [nm, ty] of lg) {
      const R = ty === 's' ? 6 : ty === 'n' ? 7.5 : ty === 'k' ? 9 : 10;
      ctx.fillStyle = 'rgba(36,46,78,0.95)'; ctx.beginPath(); ctx.arc(lx + R, ly, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = ty === 'k' || ty === 'a' ? 'rgba(255,214,110,0.9)' : 'rgba(170,180,220,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      UI.text(ctx, nm, lx + R * 2 + 6, ly + 1, { size: 12, font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 });
      lx += R * 2 + 48;
    }
    // 알림
    if (this.msgT > 0) {
      const a = Math.min(1, this.msgT / 16, (this.msgT > 0 ? 1 : 0));
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `800 16px ${FONT_B}`; const w = Math.min(B.w - 300, ctx.measureText(this.msg).width + 48), x = this.bcx() - w / 2, y = B.y + B.h - 52 + (1 - Math.min(1, (140 - this.msgT) / 10 + 1)) * 0;
      ctx.fillStyle = 'rgba(8,10,20,0.9)'; roundRect(ctx, x, y, w, 36, 18); ctx.fill();
      ctx.strokeStyle = this.msgCol.startsWith('rgb') || this.msgCol.startsWith('#') ? this.msgCol : '#fff'; ctx.globalAlpha = a * 0.6; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = a;
      UI.text(ctx, this.msg, this.bcx(), y + 19, { size: 16, align: 'center', font: FONT_B, weight: 800, fill: this.msgCol, stroke: 3 });
      ctx.restore();
    }
    // 아래 안내
    const hint = Touch.on ? '별을 탭해 고르고 한 번 더 탭하면 밝힙니다  ·  끌어서 이동'
      : Input.padActive ? '방향 : 별 고르기   A : 밝히기   Y : 정보/요약   LT : 되돌리기   RT : 확대   B : 돌아가기'
        : '방향키 : 고르기   Enter : 밝히기   클릭 두 번 : 밝히기   끌기 : 이동   휠 : 확대   B : 정보/요약   H : 되돌리기   Esc : 돌아가기';
    UI.text(ctx, hint, B.x + B.w / 2, H - 14, { size: 12, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    void t;
  },

  drawHeader(ctx) {
    const t = this.t, L = Prog.lv(), free = Prog.free();
    UI.text(ctx, '검 의  성 좌', 32, 42, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '스킬 트리  ·  별을 밝혀 힘을 얻는다', 34, 72, { size: 13, font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 });
    // 레벨 · 경험치
    const bx = 262, by = 40, bw = 278;
    UI.text(ctx, `Lv.${L}`, bx, by, { size: 24, fill: '#ffd87a', stroke: 4 });
    const need = Prog.need(L), u = L >= Prog.MAXLV ? 1 : Prog.xp() / need, x0 = bx + 74, ww = bw - 74, fw = Math.max(12, ww * u);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, x0, by - 7, ww, 13, 6.5); ctx.fill();
    const g = ctx.createLinearGradient(x0, 0, x0 + ww, 0); g.addColorStop(0, '#7a5aff'); g.addColorStop(1, '#ff7ad8');
    ctx.fillStyle = g; roundRect(ctx, x0, by - 7, fw, 13, 6.5); ctx.fill();
    ctx.save(); roundRect(ctx, x0, by - 7, fw, 13, 6.5); ctx.clip();
    const sx = x0 + ((t * 4) % (fw + 160)) - 80, sg = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - 40, by - 7, 80, 13); ctx.restore();
    UI.text(ctx, L >= Prog.MAXLV ? 'MAX' : `EXP ${fmt(Prog.xp())} / ${fmt(need)}`, bx + bw, by + 24, { size: 12, align: 'right', font: FONT_B, weight: 700, fill: '#b8c0dc', stroke: 3 });
    // 남은 포인트
    const pr = { x: 560, y: 22, w: 170, h: 54 }, glow = free > 0 ? 0.5 + Math.sin(t * 0.12) * 0.3 : 0;
    if (free > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, pr.x + pr.w / 2, pr.y + pr.h / 2, 110, '255,200,80', 0.18 + glow * 0.15, 1.2, 0.5); ctx.restore(); }
    ctx.fillStyle = free > 0 ? 'rgba(70,52,14,0.95)' : 'rgba(20,24,36,0.9)'; roundRect(ctx, pr.x, pr.y, pr.w, pr.h, 12); ctx.fill();
    ctx.strokeStyle = free > 0 ? `rgba(255,210,74,${0.6 + glow * 0.4})` : 'rgba(150,160,190,0.4)'; ctx.lineWidth = 2.2; ctx.stroke();
    UI.text(ctx, '스킬 포인트', pr.x + 14, pr.y + 19, { size: 13, font: FONT_B, weight: 700, fill: '#c9b48a', stroke: 3 });
    UI.text(ctx, `사용 ${Prog.spent()}`, pr.x + 14, pr.y + 38, { size: 11, font: FONT_B, weight: 700, fill: '#8a7c60', stroke: 3 });
    UI.text(ctx, `${free}`, pr.x + pr.w - 16, pr.y + 28, { size: 32, align: 'right', fill: free > 0 ? '#ffe070' : '#7a84a4', stroke: 4 });
    // 갈래 진행도 (누르면 그 갈래로)
    SK_ARM_KEYS.forEach((a, i) => {
      const A = SK_ARMS[a], r = this.chipRect(i), sp = Prog.armSpent(a), mx = Prog.armMax(a), done = Prog.st().D[a], hov = !Touch.on && inR(Ptr.x, Ptr.y, r);
      if (done) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, r.x + r.w / 2, r.y + r.h / 2, 60, SK_GOLD, 0.16 + Math.sin(t * 0.08 + i) * 0.05, 1.1, 0.7); ctx.restore(); }
      const bg = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); bg.addColorStop(0, `rgba(${A.col},${hov ? 0.26 : 0.16})`); bg.addColorStop(1, 'rgba(12,14,26,0.94)');
      ctx.fillStyle = 'rgba(12,14,26,0.94)'; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
      ctx.fillStyle = bg; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
      ctx.strokeStyle = done ? '#ffd24a' : `rgba(${A.col},${0.45 + sp / mx * 0.5})`; ctx.lineWidth = done ? 2 : 1.4; ctx.stroke();
      UI.text(ctx, A.short, r.x + r.w / 2, r.y + 16, { size: 15, align: 'center', fill: `rgb(${A.col})`, stroke: 3 });
      UI.text(ctx, `${sp} / ${mx}`, r.x + r.w / 2, r.y + 34, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: done ? '#ffe9a6' : '#9aa4c0', stroke: 2.5 });
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, r.x + 10, r.y + 44, r.w - 20, 4, 2); ctx.fill();
      if (sp) { ctx.fillStyle = done ? '#ffd24a' : `rgb(${A.col})`; roundRect(ctx, r.x + 10, r.y + 44, Math.max(4, (r.w - 20) * sp / mx), 4, 2); ctx.fill(); }
    });
    // 돌아가기
    const br = this.backRect();
    ctx.fillStyle = 'rgba(30,24,14,0.9)'; roundRect(ctx, br.x, br.y, br.w, br.h, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, Touch.on ? '돌아가기' : `돌아가기  [${Input.padActive ? 'B' : 'Esc'}]`, br.x + br.w / 2, br.y + br.h / 2 + 1, { size: 15, align: 'center', fill: '#ffe9a6', stroke: 3 });
  },

  // ---------- 오른쪽 정보 판 ----------
  drawPanel(ctx) {
    const P = this.PR;
    Shop.panel(ctx, P.x, P.y, P.w, P.h, this.tab === 0 && this.S[this.sel] && this.S[this.sel].can);
    for (let i = 0; i < 2; i++) {
      const r = this.tabRect(i), on = this.tab === i;
      ctx.fillStyle = on ? 'rgba(60,48,22,0.95)' : 'rgba(18,20,32,0.9)'; roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
      ctx.strokeStyle = on ? 'rgba(255,210,90,0.85)' : 'rgba(150,160,190,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
      UI.text(ctx, i ? '능력 요약' : '별 정보', r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 15, align: 'center', fill: on ? '#ffe9a6' : '#8a94b4', stroke: 3 });
    }
    if (this.tab === 0) this.drawInfo(ctx); else this.drawSummary(ctx);
    // 초기화 (두 탭 공통)
    const rr = this.resetRect(), armed = this.resetArm > 0;
    ctx.fillStyle = armed ? 'rgba(110,30,26,0.95)' : 'rgba(26,20,20,0.9)'; roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 9); ctx.fill();
    ctx.strokeStyle = armed ? '#ff8a70' : 'rgba(255,140,120,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    UI.text(ctx, armed ? '정말 초기화?' : '전체 초기화', rr.x + rr.w / 2, rr.y + 12, { size: 13, align: 'center', fill: '#ffc0b0', stroke: 3 });
    UI.text(ctx, `${fmt(Prog.resetCost())} G`, rr.x + rr.w / 2, rr.y + 26, { size: 10.5, align: 'center', font: FONT_B, weight: 700, fill: '#c09088', stroke: 2.5 });
    UI.text(ctx, `보유 ${fmt(Save.data.gold || 0)} G  ·  레벨 보너스 공격력 · HP +${+(0.6 * (Prog.lv() - 1)).toFixed(1)}%`, P.x + P.w / 2, P.y + P.h - 14, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
  },
  drawInfo(ctx) {
    const P = this.PR, n = this.cur(), S = this.S[n.id], t = this.t, pa = Ease.out3(this.panelT);
    const x0 = P.x, w = P.w, y0 = P.y + 48, cx = x0 + w / 2;
    const arm = SK_ARMS[n.arm], an = n.type === 'core' ? '검의 성좌' : n.bridge ? `${arm.short} · ${SK_ARMS[n.arm2].short} 다리 별` : arm.name;
    // 위쪽 색 띠
    const tg = ctx.createLinearGradient(0, y0, 0, y0 + 190); tg.addColorStop(0, `rgba(${n.col},0.2)`); tg.addColorStop(1, `rgba(${n.col},0)`);
    ctx.save(); ctx.fillStyle = tg; ctx.fillRect(x0 + 2, y0, w - 4, 190); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + 2, y0, w - 4, P.h - 48 - 2); ctx.clip(); ctx.globalAlpha = pa; ctx.translate(0, (1 - pa) * 10);
    UI.text(ctx, an, x0 + 16, y0 + 18, { size: 13, font: FONT_B, weight: 800, fill: `rgb(${n.col})`, stroke: 3 });
    const tb = SK_TYPE[n.type].name + (n.awk ? ' · 필살 기술' : n.ex ? ' · 택일 오의' : n.type === 'k' ? ' · 새 기술' : n.type === 'n' ? ' · 특수 효과' : '');
    ctx.font = `800 11px ${FONT_B}`; const tw = ctx.measureText(tb).width + 16;
    ctx.fillStyle = n.type === 'k' || n.awk ? 'rgba(90,68,20,0.95)' : 'rgba(26,30,48,0.95)'; roundRect(ctx, x0 + w - 16 - tw, y0 + 8, tw, 20, 10); ctx.fill();
    ctx.strokeStyle = n.type === 'k' ? '#ffd24a' : `rgba(${n.col},0.6)`; ctx.lineWidth = 1.2; ctx.stroke();
    UI.text(ctx, tb, x0 + w - 16 - tw / 2, y0 + 18.5, { size: 11, align: 'center', font: FONT_B, weight: 800, fill: n.type === 'k' ? '#ffe9a6' : '#c8d0ec' });
    // 큰 별
    const kk = SK_TYPE[n.type].view / SK_TYPE[n.type].R;
    this.drawEmblem(ctx, n, cx, y0 + 92 + Math.sin(t * 0.05) * 2, kk, Object.assign({}, S, { lvLock: false }));
    UI.text(ctx, n.name, cx, y0 + 166, { size: 26, align: 'center', fill: n.type === 'k' ? '#ffe070' : '#ffffff', stroke: 5 });
    if (n.max > 1) {
      const pw = 22, gap = 6, tw2 = n.max * pw + (n.max - 1) * gap;
      for (let i = 0; i < n.max; i++) {
        const px = cx - tw2 / 2 + i * (pw + gap), py = y0 + 188, f = i < S.r;
        if (f) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, px + pw / 2, py + 3, 14, S.max ? SK_GOLD : n.col, 0.35); ctx.restore(); }
        ctx.fillStyle = f ? (S.max ? '#ffd24a' : `rgb(${n.col})`) : 'rgba(255,255,255,0.12)'; roundRect(ctx, px, py, pw, 6, 3); ctx.fill();
      }
      UI.text(ctx, `${S.r} / ${n.max}`, x0 + w - 18, y0 + 191, { size: 13, align: 'right', fill: S.max ? '#ffd24a' : '#9aa4c0', stroke: 3 });
    }
    // 효과
    let y = y0 + 216;
    const lines = (label, arr, col, lc = '#8a94b4') => {
      UI.text(ctx, label, x0 + 18, y, { size: 12, font: FONT_B, weight: 800, fill: lc, stroke: 3 }); y += 20;
      for (const s of arr) for (const ln of skWrap(ctx, s, w - 40, 15)) { UI.text(ctx, ln, x0 + 22, y, { size: 15, font: FONT_B, weight: 700, fill: col, stroke: 3 }); y += 21; }
      y += 6;
    };
    if (n.awk) {
      const D = SK_AWK[n.awk];
      lines(S.lit ? '각성함' : '각성기', [n.d], S.lit ? '#ffe9a6' : '#dfe4f6', '#ffcf6a');
      lines('사용', [`${SK_AWK_KEY} 키  ·  MP ${D.mp}  ·  쿨타임 ${D.cd}초`], '#9fd0ff');
    }
    else if (n.type === 'core') lines('근원', [n.d], '#ffe9a6');
    else if (!n.fx) lines(S.lit ? '습득함' : '효과', [n.d], S.lit ? '#ffe9a6' : '#dfe4f6', n.type === 'k' ? '#ffcf6a' : '#8a94b4');
    else {
      if (S.r > 0) lines(S.max ? '현재 (최대)' : '현재', skDesc(n, S.r), '#dfe4f6');
      if (!S.max) lines(S.r ? '다음 랭크' : '1랭크 효과', skDesc(n, S.r + 1), '#7dffa0');
      if (!S.max && S.r === 0 && n.max > 1) { UI.text(ctx, `최대 ${n.max}랭크 : ${skDesc(n, n.max).join(' · ')}`, x0 + 22, y - 2, { size: 12, font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 }); y += 18; }
    }
    // 조건 목록
    if (n.type !== 'core' && !S.lit) {
      const cond = [];
      if (n.awk) { cond.push([Prog.job() === n.awk, `「${SK_ARMS[n.awk].short}」으로 전직`]); cond.push([Prog.armOpen(n.awk), `${SK_ARMS[n.awk].name}의 모든 별 밝히기  ${Prog.armOpenCount(n.awk)} / ${Prog.armNodes(n.awk).length}`]); cond.push([Prog.job() === n.awk && Prog.jobTier() >= 2, `2차 전직 (확장 별 ${SK_JOB_T2}개 이상)`]); }
      else cond.push([S.linked, '밝혀진 별과 이어져 있음']);
      if (n.req) cond.push([Prog.r(n.req) > 0, `「${SKN_BY[n.req].name}」 1랭크 이상`]);
      if (n.lv) cond.push([Prog.lv() >= n.lv, `캐릭터 Lv.${n.lv} 이상`]);
      if (n.ex) { const o = SKN.find(m => m.ex === n.ex && m !== n); cond.push([!S.exed, `택일 : 「${o.name}」${jo(o.name, '과', '와').slice(-1)} 함께 못 배움`]); }
      y += 2;
      for (const [ok, s] of cond) {
        ctx.fillStyle = ok ? 'rgba(80,220,140,0.9)' : 'rgba(255,110,90,0.9)'; ctx.beginPath(); ctx.arc(x0 + 26, y, 7, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#0c0e18'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
        if (ok) { ctx.moveTo(x0 + 22.5, y); ctx.lineTo(x0 + 25.5, y + 3); ctx.lineTo(x0 + 30, y - 3); } else { ctx.moveTo(x0 + 23, y - 3); ctx.lineTo(x0 + 29, y + 3); ctx.moveTo(x0 + 29, y - 3); ctx.lineTo(x0 + 23, y + 3); }
        ctx.stroke();
        UI.text(ctx, s, x0 + 40, y + 1, { size: 13, font: FONT_B, weight: 700, fill: ok ? '#a8e8c0' : '#ffb0a0', stroke: 3 }); y += 22;
      }
    }
    ctx.restore();
    // 밝히기 버튼
    const lr = this.learnRect(), ok = S.can, pulse = 0.5 + Math.sin(t * 0.12) * 0.5;
    if (ok) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, lr.x + lr.w / 2, lr.y + lr.h / 2, 160, '255,200,80', 0.14 + pulse * 0.12, 1, 0.35); ctx.restore(); }
    ctx.fillStyle = ok ? 'rgba(90,70,20,0.95)' : 'rgba(30,32,44,0.9)'; roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.fill();
    if (ok) {
      ctx.save(); roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.clip();
      const sx = lr.x - 60 + ((t * 3) % (lr.w + 120)), sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
      sg.addColorStop(0, 'rgba(255,240,190,0)'); sg.addColorStop(0.5, 'rgba(255,240,190,0.22)'); sg.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx - 30, lr.y, 60, lr.h); ctx.restore();
    }
    const core = n.type === 'core';
    ctx.strokeStyle = ok ? `rgba(255,210,74,${0.7 + pulse * 0.3})` : S.max && !core ? '#7dffa0' : '#5a5a6a'; ctx.lineWidth = 2.4; roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.stroke();
    const lab = core ? '검의 성좌의 중심' : n.awk ? (S.max ? '각성 완료' : ok ? '각 성 하 기  (포인트 없음)' : '아직 각성할 수 없음') : S.max ? (n.max > 1 ? '최대 랭크' : '습득함') : ok ? (S.r ? '랭크 올리기  (1 포인트)' : '별 밝히기  (1 포인트)') : '밝힐 수 없음';
    UI.text(ctx, lab, lr.x + lr.w / 2, lr.y + lr.h / 2 + 1, { size: 19, align: 'center', fill: ok ? '#fff' : S.max && !core ? '#7dffa0' : '#8a8a9a', stroke: 4 });
    // 되돌리기
    const fr = this.refundRect(), armed = this.refArm > 0, eqp = n.awk && Prog.awkSel() === n.awk, can = n.awk ? S.r > 0 && !eqp : n.type !== 'core' && S.r > 0;
    ctx.fillStyle = armed ? 'rgba(70,50,20,0.95)' : 'rgba(22,24,34,0.9)'; roundRect(ctx, fr.x, fr.y, fr.w, fr.h, 9); ctx.fill();
    ctx.strokeStyle = armed ? '#ffb070' : can ? 'rgba(200,190,150,0.5)' : 'rgba(120,120,140,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    UI.text(ctx, n.awk ? (eqp ? '장착 중' : '장착하기') : armed ? '정말 되돌릴까?' : '1랭크 되돌리기', fr.x + fr.w / 2, fr.y + (n.awk ? 17 : 12), { size: 13, align: 'center', fill: eqp ? '#ffd24a' : can ? '#f0e0c0' : '#6a6a7a', stroke: 3 });
    if (!n.awk) UI.text(ctx, `${fmt(Prog.refundCost())} G`, fr.x + fr.w / 2, fr.y + 26, { size: 10.5, align: 'center', font: FONT_B, weight: 700, fill: can ? '#b0a080' : '#5a5a6a', stroke: 2.5 });
  },
  drawSummary(ctx) {
    const P = this.PR, x0 = P.x + 16, w = P.w - 32, st = Prog.st(), t = this.t;
    let y = P.y + 62;
    // 갈래별 진행도 · 성좌 완성 보너스
    for (const a of SK_ARM_KEYS) {
      const A = SK_ARMS[a], sp = Prog.armSpent(a), mx = Prog.armMax(a), done = st.D[a];
      UI.text(ctx, A.name, x0, y, { size: 14, fill: `rgb(${A.col})`, stroke: 3 });
      UI.text(ctx, `${sp} / ${mx}`, x0 + w, y, { size: 12, align: 'right', font: FONT_B, weight: 700, fill: done ? '#ffe9a6' : '#9aa4c0', stroke: 3 });
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, x0, y + 10, w, 5, 2.5); ctx.fill();
      if (sp) { ctx.fillStyle = done ? '#ffd24a' : `rgb(${A.col})`; roundRect(ctx, x0, y + 10, Math.max(5, w * sp / mx), 5, 2.5); ctx.fill(); }
      UI.text(ctx, `${done ? '★ 성좌 완성' : '완성 보너스'} : ${A.done}`, x0, y + 25, { size: 11, font: FONT_B, weight: 700, fill: done ? '#ffd24a' : '#5e6888', stroke: 2.5 });
      y += 44;
    }
    // 능력치 합계
    y += 2;
    UI.text(ctx, '능력치 합계', x0, y, { size: 13, font: FONT_B, weight: 800, fill: '#8a94b4', stroke: 3 });
    ctx.strokeStyle = 'rgba(201,165,92,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 84, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    y += 20;
    const rows = Object.keys(SK_STAT).filter(k => st.S[k] > 0);
    if (!rows.length) { UI.text(ctx, '아직 밝힌 별이 없습니다', x0 + 4, y, { size: 13, font: FONT_B, weight: 700, fill: '#5e6888', stroke: 3 }); y += 20; }
    const cw = (w - 12) / 2;
    rows.forEach((k, i) => {
      const cx = x0 + (i % 2) * (cw + 12), cy = y + Math.floor(i / 2) * 19, [, , sgn, sh] = SK_STAT[k];
      UI.text(ctx, sh, cx, cy, { size: 12, font: FONT_B, weight: 700, fill: '#b8c0dc', stroke: 2.5 });
      UI.text(ctx, `${sgn > 0 ? '+' : '-'}${skNum(k, st.S[k])}`, cx + cw, cy, { size: 12, align: 'right', font: FONT_B, weight: 800, fill: '#7dffa0', stroke: 2.5 });
    });
    y += Math.ceil(rows.length / 2) * 19 + 8;
    // 특수 효과
    const keys = SKN.filter(n => n.key && Prog.r(n.id) > 0);
    UI.text(ctx, '특수 효과', x0, y, { size: 13, font: FONT_B, weight: 800, fill: '#8a94b4', stroke: 3 });
    ctx.strokeStyle = 'rgba(201,165,92,0.25)'; ctx.beginPath(); ctx.moveTo(x0 + 70, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    y += 20;
    if (!keys.length) UI.text(ctx, '명성 · 극성을 밝히면 여기에 나타납니다', x0 + 4, y, { size: 12, font: FONT_B, weight: 700, fill: '#5e6888', stroke: 3 });
    let cx = x0;
    const maxY = this.resetRect().y - 14;
    for (const n of keys) {
      ctx.font = `800 12px ${FONT_B}`; const cw2 = ctx.measureText(n.name).width + 26;
      if (cx + cw2 > x0 + w) { cx = x0; y += 24; }
      if (y > maxY) break;
      ctx.fillStyle = `rgba(${n.col},0.16)`; roundRect(ctx, cx, y - 10, cw2, 20, 10); ctx.fill();
      ctx.strokeStyle = n.type === 'k' ? 'rgba(255,214,110,0.8)' : `rgba(${n.col},0.6)`; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, cx + 10, y, 6, n.col, 0.9 + Math.sin(t * 0.1 + cx) * 0.1); ctx.restore();
      UI.text(ctx, n.name, cx + 18, y + 0.5, { size: 12, font: FONT_B, weight: 800, fill: '#eef0ff' });
      cx += cw2 + 6;
    }
  },

  // 마우스를 올린 별 : 이름표
  drawTip(ctx) {
    if (!this.hover || this.hover === this.sel || this.drag || this.cine) return;
    const n = SKN_BY[this.hover], S = this.S[n.id], [sx, sy2] = this.w2s(n.x, n.y);
    const t1 = n.name, t2 = n.type === 'core' ? '근원' : `${SK_TYPE[n.type].name}  ·  ${S.r} / ${n.max}${S.can ? '  ·  밝힐 수 있음' : ''}`;
    ctx.font = `800 14px ${FONT_B}`; let w = ctx.measureText(t1).width; ctx.font = `700 11px ${FONT_B}`; w = Math.max(w, ctx.measureText(t2).width) + 24;
    const R = SK_TYPE[n.type].R * this.cam.z, x = clamp(sx - w / 2, this.BR.x + 6, this.BR.x + this.BR.w - w - 6), y = sy2 - R - 52 < this.BR.y + 4 ? sy2 + R + 14 : sy2 - R - 52;
    ctx.fillStyle = 'rgba(8,10,20,0.94)'; roundRect(ctx, x, y, w, 40, 8); ctx.fill();
    ctx.strokeStyle = `rgba(${n.col},0.7)`; ctx.lineWidth = 1.4; ctx.stroke();
    UI.text(ctx, t1, x + 12, y + 13, { size: 14, font: FONT_B, weight: 800, fill: '#ffffff' });
    UI.text(ctx, t2, x + 12, y + 29, { size: 11, font: FONT_B, weight: 700, fill: S.can ? '#7dffa0' : '#9aa4c0' });
  },

  // 극성 각성 · 성좌 완성 연출
  drawCine(ctx) {
    const C = this.cine; if (!C) return;
    const T = C.t, a = Math.min(1, T / 12, (C.life - T) / 20), cx = W / 2, cy = 300;
    const key = C.kind === 'key' || C.kind === 'awk', col = key ? C.n.col : SK_ARMS[C.arm].col, gold = SK_GOLD;
    ctx.save();
    ctx.fillStyle = `rgba(2,3,8,${0.78 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(T * 0.004);
    for (let i = 0; i < 20; i++) {
      const an = i * TAU / 20, L = (i % 2 ? 420 : 680) * Ease.out3(Math.min(1, T / 26)), wd = i % 2 ? 0.03 : 0.055;
      ctx.fillStyle = `rgba(${i % 3 ? col : gold},${0.07 * a})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an - wd) * L, Math.sin(an - wd) * L); ctx.lineTo(Math.cos(an + wd) * L, Math.sin(an + wd) * L); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    drawGlow(ctx, cx, cy, 300, col, 0.4 * a); drawGlow(ctx, cx, cy, 140, gold, 0.3 * a);
    for (let k = 0; k < 2; k++) { const u = clamp((T - k * 8) / 34, 0, 1); if (u > 0 && u < 1) { ctx.strokeStyle = `rgba(${k ? col : gold},${(1 - u) * 0.9 * a})`; ctx.lineWidth = 10 * (1 - u) + 1; ctx.beginPath(); ctx.arc(cx, cy, 60 + Ease.out3(u) * 320, 0, TAU); ctx.stroke(); } }
    ctx.globalCompositeOperation = 'source-over';
    const pop = Ease.back(Math.min(1, T / 20));
    ctx.globalAlpha = a;
    if (key) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop); ctx.translate(-cx, -cy);
      this.drawEmblem(ctx, C.n, cx, cy, C.kind === 'awk' ? 2.1 : 2.3, { r: 1, lit: true, max: true, can: false, dim: false, exed: false, lvLock: false });
      ctx.restore();
      const ta = Math.min(1, Math.max(0, (T - 14) / 14));
      ctx.globalAlpha = a * ta;
      UI.text(ctx, C.kind === 'awk' ? '각   성' : '극 성 각 성', cx, cy - 150, { size: C.kind === 'awk' ? 26 : 18, align: 'center', fill: '#ffe9a6', stroke: 4 });
      if (C.kind === 'awk') UI.text(ctx, SK_AWK[C.n.awk].han, cx, cy + 108, { size: 20, align: 'center', font: FONT_B, weight: 800, fill: `rgb(${col})`, stroke: 4 });
      UI.text(ctx, C.n.name, cx, cy + 142, { size: 46, align: 'center', fill: '#ffffff', stroke: 7 });
      const ls = skWrap(ctx, C.n.d, 680, 18);
      ls.forEach((ln, i) => UI.text(ctx, ln, cx, cy + 190 + i * 26, { size: 18, align: 'center', font: FONT_B, weight: 700, fill: `rgb(${col})`, stroke: 4 }));
    } else {
      const A = SK_ARMS[C.arm];
      ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, pop);
      UI.text(ctx, A.han, 0, 0, { size: 96, align: 'center', fill: '#ffe9a6', stroke: 8 });
      ctx.restore();
      const ta = Math.min(1, Math.max(0, (T - 14) / 14));
      ctx.globalAlpha = a * ta;
      UI.text(ctx, '성 좌 완 성', cx, cy - 110, { size: 20, align: 'center', fill: `rgb(${A.col})`, stroke: 4 });
      UI.text(ctx, `${A.name}의 모든 별이 밝혀졌다`, cx, cy + 96, { size: 30, align: 'center', fill: '#ffffff', stroke: 6 });
      UI.text(ctx, `완성 보너스 : ${A.done}`, cx, cy + 140, { size: 20, align: 'center', font: FONT_B, weight: 800, fill: '#ffd24a', stroke: 4 });
    }
    if (T > 40) { ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(T * 0.12)); UI.text(ctx, Touch.on ? '탭해서 계속' : '아무 키나 눌러 계속', cx, H - 60, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 }); }
    ctx.restore();
  },
};
addEventListener('wheel', e => { if (typeof Game !== 'undefined' && Game.state === 'tree') TreeUI.wheel(e.deltaY); }, { passive: true });
