'use strict';
// ============================================================
//  메인 스토리 진행
//   - 스테이지를 기존 던전 형식으로 만들어 같은 전투 엔진에서 돌린다
//   - 목표(생존 · 방어 · 호위 · 돌파 · 추격 · 정예 · 연전) / 특수 규칙 / 함정 / 동료 / 기억 조각 / 별 평가
//   - 저장 : Save.data.story
// ============================================================
const GOAL_TEXT = {
  kill: '모든 적을 쓰러뜨려라', survive: '끝까지 버텨라', defend: '{obj}을(를) 지켜라', escort: '{who}을(를) 끝까지 데려가라',
  time: '제한 시간 안에 돌파하라', chase: '{thief}을(를) 붙잡아라', elite: '{elite}을(를) 쓰러뜨려라', rush: '정예 셋을 연달아 쓰러뜨려라', boss: '{boss}을(를) 쓰러뜨려라',
};
const RULE_TEXT = {
  dark: ['어둠', '빛이 닿는 곳만 보인다'], smoke: ['연기', '시야가 좁아진다'], blizzard: ['눈보라', '바람에 조금씩 밀려난다'],
  poison: ['독안개', '정화의 빛 밖에서는 체력이 줄어든다'], blood: ['핏빛 달', '적이 공격할 때 체력을 빨아들인다'], nopot: ['물약 금지', '물약을 쓸 수 없다'],
  rage: ['분노', '적이 강해지는 대신 골드가 늘어난다'], curse: ['저주', '최대 체력이 줄어든다'], warp: ['시간 왜곡', '푸른 곳에서는 적이, 붉은 곳에서는 내가 느려진다'],
  tide: ['해일', '주기적으로 파도가 밀려온다 (점프로 피한다)'], lowgrav: ['무중력', '몸이 가볍게 뜬다'],
};
const ENDING_NAME = {
  A: { text: '엔딩 A 「다시, 처음부터」' }, B: { text: '엔딩 B 「기억하는 자」' },
  route: { text: '진엔딩 루트 개방 — 「기억의 바다」' }, T: { text: '진엔딩 「리엔」' },
};
const WHO_NAME = { fio: '피오와 할머니', knight: '세릭의 부하', scout: '정찰병', refugee: '피난민', healer: '치유사', ella: '엘라' };

const Story = {
  active: false, st: null, R: null,

  // ---------- 저장 ----------
  sd() { return Save.data.story; },
  migrate(d) {
    const s = d.story = Object.assign({ clr: {}, frag: {}, flag: {}, end: {}, open: {}, mapc: {}, cur: 'T-1', seen: {} }, d.story || {});
    // 이미 던전을 깨고 있던 플레이어 : 콘텐츠는 처음부터 전부 열어 둔다
    if (s.legacy == null) {
      const old = Object.keys(d.cleared || {}).length;
      s.legacy = old > 0 || (d.gold || 0) > 0 || (d.lv || 1) > 1 ? old : -1;
      if (s.legacy >= 0) s.open = { shop: 1, hub: 1, tree: 1, tower: 1, hard: s.legacy >= 3 ? 1 : 0, hell: s.legacy >= 10 ? 1 : 0 };
    }
    return s;
  },
  isOpen(k) { const s = this.sd(); return !!(s.open[k] || (k === 'tree' && s.open.hub) || (k === 'upgrade' && s.open.hub)); },
  cleared(id) { return !!this.sd().clr[id]; },
  clearedCount() { return SMAIN.filter(s => this.sd().clr[s.id]).length; },
  // 앞 스테이지를 깨야 열린다
  unlocked(s) {
    if (s.hidden) { const k = SSTAGES.indexOf(s), pv = SSTAGES[k - 1]; return !!this.sd().flag.trueRoute && (!pv.hidden || !!this.sd().clr[pv.id]); }
    const i = SMAIN.indexOf(s);
    if (i <= 0) return true;
    if (i === 5 && this.sd().flag.tutSkip) return true;            // 튜토리얼을 건너뛴 경우 1-1 부터
    return !!this.sd().clr[SMAIN[i - 1].id];
  },
  stars(id) { const c = this.sd().clr[id]; return c ? c.star.reduce((a, b) => a + b, 0) : 0; },
  mapStars(m) { return SMAPS[m].stages.reduce((a, s) => a + this.stars(s.id), 0); },
  fragCount() { return Object.keys(this.sd().frag).length; },
  // 난이도 : 맵을 보통으로 깨면 어려움, 어려움으로 깨면 지옥
  diffOk(m, id) {
    if (id === 'easy' || id === 'normal') return true;
    const c = this.sd().mapc[m] || {}, o = this.sd().open;
    if (id === 'hard') return !!(c.normal || c.hard || c.hell || o.hard);
    if (id === 'hell') return !!((c.hard || c.hell || o.hell) && (o.hell || this.isOpen('hellDiff')));
    return false;
  },

  // ---------- 스테이지 → 던전 ----------
  build(s) {
    const rnd = mulberry(s.g * 7919 + 131 + s.n * 17);
    const pool = s.pool || storyPool(s.theme);
    const pick = () => { const tot = pool.reduce((a, x) => a + x[1], 0); let r = rnd() * tot; for (const [k, w] of pool) { r -= w; if (r <= 0) return k; } return pool[0][0]; };
    const def = { id: 'story:' + s.id, name: s.name, theme: s.theme, lv: stageLv(s), mul: stageMul(s), boss: s.boss ? SBOSS[s.boss] : 'varkas', pool, story: s, desc: '' };
    const late = s.m >= 3 ? 1 : 0, tut = s.m === 0;
    const wave = (cnt, x0 = 700, x1 = null, w = 2000) => {
      const list = [];
      for (let k = 0; k < cnt; k++) list.push([pick(), Math.round(x0 + rnd() * ((x1 || w - 200) - x0)), Math.round(40 + rnd() * (DEPTH - 80))]);
      return list;
    };
    const room = (o = {}) => {
      const width = o.width || 1800 + Math.round(rnd() * 500);
      const themes = s.mix ? ['forest', 'ruins', 'frost', 'desert', 'deep', 'clock', 'sky'] : null;
      const theme = themes ? themes[(rnd() * themes.length) | 0] : s.theme;
      const nw = o.waves ?? 2, base = tut ? 2 : 3 + late;
      const waves = o.list || Array.from({ length: nw }, (_, i) => wave(base + Math.round(rnd() * 2) + (i > 0 ? late : 0), 650, null, width));
      return { name: o.name || s.name, theme, width, seed: s.g * 31 + (o.k || 0) * 17 + 5, waves, story: true };
    };
    const rooms = [];
    const t = s.type;
    let n = s.rooms ?? ({ kill: s.m <= 1 ? (s.n <= 2 ? 1 : 2) : 2, survive: 1, defend: 1, escort: 1, time: 2, chase: 2, elite: 1, rush: 1, boss: 1 })[t];
    if (s.waves) rooms.push(room({ list: s.waves }));
    else if (t === 'survive') rooms.push(room({ waves: 1, width: 1500 }));
    else if (t === 'escort') rooms.push(room({ waves: 3, width: 2900 }));
    else if (t === 'defend') rooms.push(room({ waves: 3, width: 1500 }));
    else if (t === 'elite') rooms.push(room({ list: [wave(tut ? 2 : 3, 700, 1300, 1600), [[s.elite[0], 1250, 110], ...wave(tut ? 1 : 2, 900, 1400, 1600)]], width: 1600 }));
    else if (t === 'rush') { const ek = this.eliteKind(pool); rooms.push(room({ list: [[[ek, 1200, 110], ...wave(2, 900, 1400, 1600)], [[ek, 1250, 60], ...wave(2, 900, 1400, 1600)], [[ek, 1300, 160], ...wave(3, 900, 1400, 1600)]], width: 1600 })); }
    else for (let i = 0; i < n; i++) rooms.push(room({ k: i }));
    if (t === 'boss') rooms.push({ name: s.name, theme: s.theme, width: 1800, seed: s.g * 31 + 99, boss: true, story: true, waves: [[['boss', 1300, 115]]] });
    return { id: def.id, name: SMAPS[s.m] ? `${SMAPS[s.m].sub} · ${s.id}` : s.id, def, rooms };
  },
  eliteKind(pool) {
    const el = pool.map(p => p[0]).filter(k => ENEMY_TYPES[k] && ENEMY_TYPES[k].elite);
    return el[0] || 'orc';
  },

  // ---------- 시작 ----------
  start(id) {
    const s = SSTAGE[id]; if (!s) return;
    const G = Game;
    this.active = true; this.st = s;
    this.sd().cur = id; Save.save();
    G.dungeon = this.build(s);
    G.bgCache = {}; G.stats = G.newStats(); G.player = new Player();
    G.combo = { n: 0, t: 0, dmg: 0, pop: 0 }; G.coins = 3;
    G.dungeonIdx = Math.floor(s.g / 6); G.notices = []; G.big = null;
    const p = G.player;
    if (s.rule === 'nopot') p.pots = { hp: 0, mp: 0 };
    this.R = { t: 0, hits0: 0, starDone: false, frag: null, crate: null, objs: [], traps: [], allies: [], props: [], timer: 0, failed: false, done: false, contUsed: false, thief: null, npc: null, obj: null, elite: null, hp0: 1, goalShown: false, timeLeft: s.type === 'time' ? s.sec * 60 : 0 };
    Cine.reset(); Lien.on = !s.mem; Lien.reset();
    Scr.memT = Scr.mem = s.mem ? 1 : 0;
    G.loadRoom(0);
  },
  quit() { this.active = false; this.st = null; this.R = null; Cine.reset(); Lien.on = false; Scr.mem = Scr.memT = 0; },
  script(key) { const S = STORY_SCRIPTS[this.st.id], v = S && S[key]; return typeof v === 'function' ? v() : v; },   // 함수 = 고른 엔딩에 따라 바뀌는 대본
  lastRoom() { return Game.roomIdx >= Game.dungeon.rooms.length - 1; },

  // 방에 들어올 때 (Game.loadRoom 이 부른다)
  onRoom(i) {
    const s = this.st, R = this.R, G = Game, rm = G.room;
    R.traps = []; R.props = []; R.allies = []; R.npc = null; R.obj = null; R.thief = null; R.elite = null; R.crate = null; R.zones = [];
    Lien.reset(); Bubbles.list = [];
    for (const id in Cine.actors) if (!Cine.actors[id].o.keep) delete Cine.actors[id];
    for (const e of G.enemies) if (!e._story) this.tagEnemy(e);       // 보스 이름은 대본 · 등장 연출보다 먼저
    const p = G.player;
    if (s.rule === 'curse' && !R.cursed) { R.cursed = true; p.hpMax = Math.round(p.hpMax * 0.65); p.hp = Math.min(p.hp, p.hpMax); }
    if (i === 0) R.hp0 = p.hp;
    // 목표 장치
    const last = this.lastRoom();
    if (s.type === 'survive') { rm.hold = true; R.timer = s.sec * 60; R.spawnT = 0; }
    if (s.type === 'escort') {
      rm.hold = true;
      const who = s.who || 'fio';
      R.npc = { x: 240, y: DEPTH * 0.55, hp: 1, hpMax: 1, a: new Actor('escort', who === 'fio' ? 'fio' : who === 'ella' ? 'ella' : 'villager', 240, DEPTH * 0.55, { look: who === 'knight' ? 'a2' : who === 'healer' ? 'a10' : undefined, facing: 1 }) };
      if (who === 'fio') R.npc.b = new Actor('escort2', 'granny', 200, DEPTH * 0.65, { facing: 1 });
      R.trig = [0, rm.width * 0.33, rm.width * 0.62]; R.trigN = 1;                 // 첫 웨이브는 방에 들어올 때 이미 나왔다
    }
    if (s.type === 'defend' && last) R.obj = { x: 360, y: DEPTH * 0.5, hp: 1, name: s.obj || '결계석', hitT: 0 };
    if (s.type === 'chase' && last) R.thiefPending = true;
    // 동료
    if (s.ally && !rm.def.boss) R.allies.push(new Ally(s.ally, 150, DEPTH * 0.35));
    // 함정 · 규칙 장치
    if (s.trap) this.makeTraps(s.trap, rm);
    if (s.rule === 'poison') for (let k = 0; k < 3; k++) R.zones.push({ kind: 'pure', x: 400 + k * (rm.width - 700) / 2, y: DEPTH * (0.3 + 0.2 * (k % 2)), r: 120 });
    if (s.rule === 'warp') for (let x = 500, k = 0; x < rm.width - 300; x += 520, k++) R.zones.push({ kind: k % 2 ? 'slowP' : 'slowE', x, y: DEPTH / 2, r: 170 });
    R.tideT = 400;
    // 기억 조각 상자 : 마지막 방(보스 방이면 그 앞 방)의 안쪽
    const fragRoom = Math.max(0, G.dungeon.rooms.length - 1 - (G.dungeon.rooms[G.dungeon.rooms.length - 1].boss ? 1 : 0));
    if (s.frag && !this.sd().frag[s.frag] && i === fragRoom && !rm.def.boss) R.crate = { x: Math.round(rm.width * 0.55), y: 18, hp: 3, cd: 0, hint: false, open: false };
    // 대본 : 첫 방 = start, 보스 방 = boss, 그 밖 = room1, room2 …
    const key = rm.def.boss ? 'boss' : i === 0 ? 'start' : 'room' + i;
    const sc = this.script(key) || (i === 0 ? this.autoStart() : null);
    if (sc) Cine.run(sc, () => this.afterScript());
    else this.afterScript();
  },
  afterScript() { if (!this.R.goalShown) { this.R.goalShown = true; this.showGoal(); } },
  goalText(s = this.st) {
    const b = s.boss && BOSS_DEFS[SBOSS[s.boss]];
    return fillName((GOAL_TEXT[s.type] || '').replace('{obj}', s.obj || '결계석').replace('{who}', WHO_NAME[s.who] || '동료').replace('{thief}', s.thief ? s.thief[1] : '').replace('{elite}', s.elite ? s.elite[1] : '').replace('{boss}', b ? (b.storyName || b.name) : '보스'));
  },
  showGoal() {
    const s = this.st;
    Game.bigText(this.goalText(), '#fff4d8', '#ffb43a', 230, 40);
    if (s.rule) Game.notice(`특수 규칙 · ${RULE_TEXT[s.rule][0]} : ${RULE_TEXT[s.rule][1]}`);
  },
  // 대본이 없는 스테이지 : 리엔이 한마디
  autoStart() {
    const s = this.st, t = s.type;
    const L = { survive: '많이 몰려와요! 버티기만 하면 돼요!', defend: `${s.obj || '결계석'}에 적이 닿지 않게 해 주세요!`, escort: '천천히 따라오게 해요. 앞을 먼저 정리해 주세요!', time: '시간이 없어요, 서둘러요!', chase: '저기, 도망친다! 놓치면 안 돼요!', rush: '강한 기운이 셋… 하나씩 상대해요.', elite: '저 녀석, 다른 놈들과 달라요. 조심해요!' }[t];
    if (s.mem || !L) return null;
    return [['say', 'lien', L, 140]];
  },

  // ---------- 매 프레임 ----------
  tick() {
    if (!this.active || !Game.room) return;
    Cine.tick(); Lien.update();
    const G = Game, s = this.st, R = this.R, p = G.player, rm = G.room;
    for (const e of G.enemies) if (!e._story) this.tagEnemy(e);       // 이름 · 정예 · 규칙 (보스 등장 연출 전에)
    if (G.state !== 'play') return;
    R.t++;
    // 목표
    if (s.type === 'survive' && rm.hold && !R.done) this.tickSurvive();
    if (s.type === 'escort' && R.npc && !R.done) this.tickEscort();
    if (R.obj && !R.done) this.tickDefend();
    if (s.type === 'time' && !R.done && !G.clearSeq) { if (--R.timeLeft <= 0) this.fail('시간이 다 되었다'); }
    if (R.thiefPending && rm.wave >= 0) { R.thiefPending = false; this.spawnThief(); }
    if (R.thief && !R.done) this.tickThief();
    this.checkDuel();
    // 규칙
    this.tickRules();
    for (const tr of R.traps) tr.update();
    for (const a of R.allies) a.update();
    if (R.crate) this.tickCrate();
    if (R.fragOrb) this.tickFragOrb();
  },
  tagEnemy(e) {
    const s = this.st, R = this.R;
    e._story = true;
    if (s.rule === 'rage') { e.atk = Math.round(e.atk * 1.35); e.gold = [e.gold[0] * 2, e.gold[1] * 2]; }
    if (e.isBoss) {
      const B = BOSS_DEFS[SBOSS[s.boss]]; if (B) { e.name = B.storyName || B.name; e.title = B.title; }
      if (s.duel) e.duelAt = e.hpMax * s.duel;                 // 결판이 나지 않는 결투
      return;
    }
    const nm = s.type === 'elite' && !R.elite && e.kind === s.elite[0] ? s.elite[1] : s.type === 'rush' && ENEMY_TYPES[e.kind] && ENEMY_TYPES[e.kind].elite ? '정예 ' + e.name : null;
    if (nm) this.makeElite(e, nm, s.type === 'elite' ? s.elite[2] : 3.2);
  },
  makeElite(e, name, k) {
    e.name = name; e.elite = true; e.named = true; e.lines = 5;
    e.hpMax = Math.round(e.hpMax * k); e.hp = e.hpMax; e.atk = Math.round(e.atk * 1.3);
    e.scale = (e.scale || 1) * 1.22; e.w *= 1.2; e.h *= 1.22;
    if (this.st.type === 'elite') this.R.elite = e;
  },

  tickSurvive() {
    const R = this.R, G = Game, rm = G.room;
    R.timer--;
    const alive = G.enemies.filter(e => !e.dying && !e.dead).length, cap = 4 + Math.min(4, this.st.m);
    if (--R.spawnT <= 0 && alive < cap) {
      R.spawnT = 70 - Math.min(30, this.st.m * 4);
      const pool = G.dungeon.def.pool, tot = pool.reduce((a, x) => a + x[1], 0);
      let r = Math.random() * tot, k = pool[0][0]; for (const [kk, w] of pool) { r -= w; if (r <= 0) { k = kk; break; } }
      const side = Math.random() < 0.5 ? -1 : 1, x = clamp(G.player.x + side * rand(380, 560), 100, rm.width - 100);
      const e = makeEnemy(k, x, rand(30, DEPTH - 30)); e.spawnIn(0); G.enemies.push(e);
    }
    if (R.timer <= 0) {
      for (const e of G.enemies) if (!e.dying && !e.dead && !e.isBoss) e.die({ kx: 4, kz: 7 }, sign(e.x - G.player.x));
      rm.hold = false; rm.wave = rm.def.waves.length - 1;
      G.flashScreen(0.4, '255,240,200');
    }
  },
  tickEscort() {
    const R = this.R, G = Game, rm = G.room, n = R.npc, a = n.a;
    const near = G.enemies.filter(e => !e.dying && !e.dead && Math.abs(e.x - a.x) < 280);
    if (!near.length && a.x < rm.width - 160) { a.tx = Math.min(rm.width - 160, a.x + 60); a.ty = n.y; a.spd = 1.25; }
    else a.tx = null;
    if (n.b) { n.b.tx = a.x - 50; n.b.ty = n.y + 26; n.b.spd = 1.3; n.b.update(); }
    a.update(); n.x = a.x;
    // 붙은 적이 공격한다
    for (const e of near) if (Math.abs(e.x - a.x) < 80 && Math.abs(e.y - a.y) < 40 && (R.t + (e.id || 0) * 7) % 70 === 0) this.hurtThing(n, 0.07, a.x, a.y);
    if (n.hp <= 0) return this.fail(`${WHO_NAME[this.st.who] || '동료'}을(를) 지키지 못했다`);
    // 웨이브 : 일정 거리마다
    if (R.trigN < 3 && a.x >= R.trig[R.trigN]) { rm.spawnWave(R.trigN, R.trigN === 0); R.trigN++; }
    if (a.x >= rm.width - 165 && R.trigN >= 3 && !G.enemies.some(e => !e.dying && !e.dead)) { rm.hold = false; rm.wave = rm.def.waves.length - 1; }
  },
  tickDefend() {
    const R = this.R, G = Game, o = R.obj;
    for (const e of G.enemies) {
      if (e.dying || e.dead || e.isBoss) continue;
      const dx = o.x - e.x, d = Math.abs(dx);
      if (d < 90 && Math.abs(e.y - o.y) < 50) { if ((R.t + (e.id || 0) * 11) % 60 === 0) this.hurtThing(o, 0.045, o.x, o.y); }
      else if ((e.state === 'idle' || e.state === 'move') && Math.abs(e.x - G.player.x) > 240) { e.x += sign(dx) * 1.3; e.facing = sign(dx); }
    }
    if (o.hitT > 0) o.hitT--;
    if (o.hp <= 0) this.fail(`${o.name}이(가) 부서졌다`);
  },
  hurtThing(t, f, x, y) {
    t.hp = Math.max(0, t.hp - f * (Diff.cur().id === 'hell' ? 1.5 : Diff.cur().id === 'hard' ? 1.2 : 1)); t.hitT = 12;
    FX.add('world', new Flash(x, sy(y, 70), 6, 46, 10, '255,120,90', 0.6)); Sfx.play('blunt', 0.5);
    if (!this.R.warned) { this.R.warned = true; Bubbles.add('lien', '공격받고 있어요! 막아 주세요!', 120); }
  },
  spawnThief() {
    const s = this.st, G = Game, rm = G.room, R = this.R;
    const e = makeEnemy(s.thief[0], Math.min(rm.width - 300, G.player.x + 520), DEPTH * 0.5);
    e.spawnIn(0); e._story = true; e.storyId = 'thief';
    e.name = s.thief[1]; e.elite = true; e.named = true; e.lines = 3;
    e.hpMax = Math.round(e.hpMax * 2.2); e.hp = e.hpMax;
    G.enemies.push(e); R.thief = e; R.thiefT = 40 * 60;
    const think = e.think.bind(e);
    e.think = function () {                                        // 거리를 벌리며 도망친다 (궁지에 몰리면 싸운다)
      const p = Game.player, dx = this.x - p.x, d = Math.abs(dx), dir = sign(dx);
      const cornered = (dir > 0 && this.x > Game.room.width - 140) || (dir < 0 && this.x < 140);
      if (Game.state === 'play' && d < 360 && !cornered && this.hp > this.hpMax * 0.25) {
        this.vx = dir * 3.3; this.vy = (DEPTH / 2 - this.y) * 0.02; this.facing = dir;
        try { this.play('walk', 4); } catch (err) { }
        return;
      }
      think();
    };
    Bubbles.add('thief', '키키킥!', 90);
  },
  tickThief() {
    const R = this.R, e = R.thief;
    if (e.dying || e.dead) { R.thief = null; Bubbles.add('lien', '잡았다! 조각이 돌아왔어요!', 120); return; }
    if (--R.thiefT <= 0) this.fail(`${this.st.thief[1]}을(를) 놓쳤다`);
  },

  // ---------- 규칙 ----------
  tickRules() {
    const s = this.st, R = this.R, G = Game, p = G.player;
    if (!s.rule || p.hp <= 0) return;
    if (s.rule === 'blizzard' && p.state !== 'cine') { p.x -= 0.7; if (G.frame % 4 === 0) for (const e of G.enemies) if (!e.isBoss) e.x -= 0.4; }
    if (s.rule === 'lowgrav') p.gravMul = 0.55;
    if (s.rule === 'poison') {
      const inPure = R.zones.some(z => z.kind === 'pure' && Math.hypot(p.x - z.x, (p.y - z.y) * 2) < z.r);
      R.inPure = inPure;
      if (!inPure && G.frame % 90 === 0) { p.hp = Math.max(1, p.hp - p.hpMax * 0.03); FX.add('top', new DmgText(p.x, sy(p.y, p.z + 150), Math.round(p.hpMax * 0.03), 'p', 0)); }
      if (inPure && G.frame % 30 === 0) p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.004);
    }
    if (s.rule === 'warp') for (const z of R.zones) {
      if (z.kind === 'slowP' && Math.abs(p.x - z.x) < z.r) p.slowT = Math.max(p.slowT || 0, 2);
      if (z.kind === 'slowE') for (const e of G.enemies) if (Math.abs(e.x - z.x) < z.r && !e.isBoss) { e.st = e.st || {}; e.slowMul = 0.5; }
    }
    if (s.rule === 'tide') {
      if (--R.tideT === 90) Bubbles.add('lien', '파도가 와요! 뛰어요!', 80);
      if (R.tideT <= 0) {
        R.tideT = 540;
        G.addShake(6); Sfx.play('explode', 0.5, 0.6); G.flashScreen(0.2, '160,220,255');
        if (p.z < 25 && p.state !== 'cine' && p.invul <= 0) { p.vx -= 9; p.hp = Math.max(1, p.hp - p.hpMax * 0.04); }
        for (const e of G.enemies) if (!e.isBoss && e.z < 25) e.vx -= 7;
        for (let i = 0; i < 30; i++) FX.add('world', new Mote(G.cam.x + W + rand(0, 200), sy(rand(0, DEPTH), rand(0, 60)), rand(-14, -8), rand(-1, 1), { col: '170,230,255', life: 40, r: 10 }));
      }
    }
  },
  // 핏빛 달 : 맞으면 근처의 적이 회복한다
  onPlayerHurt(dmg) {
    if (!this.active || this.st.rule !== 'blood') return;
    for (const e of Game.enemies) if (!e.dying && !e.dead && Math.abs(e.x - Game.player.x) < 220) e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.03);
  },

  // ---------- 함정 ----------
  makeTraps(kind, rm) {
    const R = this.R, xs = [];
    for (let x = 520; x < rm.width - 260; x += 300 + Math.random() * 180) xs.push(x);
    if (kind === 'debris' || kind === 'rock' || kind === 'bolt') R.traps.push(new Trap(kind, 0, 0));
    else if (kind === 'arrow') R.traps.push(new Trap('arrow', 0, 0));
    else xs.forEach((x, i) => R.traps.push(new Trap(kind, x, kind === 'pool' || kind === 'ice' ? 40 + ((i * 67) % (DEPTH - 80)) : DEPTH * 0.5, i)));
  },

  // ---------- 기억 조각 ----------
  tickCrate() {
    const c = this.R.crate, p = Game.player;
    if (c.open) return;
    const d = Math.abs(p.x - c.x), dy = Math.abs(p.y - c.y);
    if (!c.hint && d < 300) { c.hint = true; Bubbles.add('lien', '잠깐… 저 상자에서 뭔가 느껴져요.', 150); Lien.glow = 1; }
    if (c.cd > 0) c.cd--;
    if (p.state === 'act' && d < 90 && dy < 40 && c.cd <= 0) {
      c.cd = 16; c.hp--;
      Sfx.impact('stone', 1, { vol: 0.8 }); Game.addShake(2);
      for (let i = 0; i < 5; i++) FX.add('world', new Debris(c.x, c.y, 30, { vx: rand(-3, 3), vz: rand(3, 7), s: rand(2, 4) }));
      if (c.hp <= 0) { c.open = true; this.R.fragOrb = { x: c.x, y: c.y + 10, z: 60, t: 0 }; Sfx.play('clear', 0.4, 1.4); }
    }
  },
  tickFragOrb() {
    const o = this.R.fragOrb, p = Game.player;
    o.t++; o.z = 60 + Math.sin(o.t * 0.08) * 10;
    if (o.t > 30 && Math.abs(p.x - o.x) < 50 && Math.abs(p.y - o.y) < 40) {
      const id = this.st.frag; this.sd().frag[id] = 1; Save.save();
      this.R.fragOrb = null; this.R.gotFrag = id;
      Game.flashScreen(0.35, '255,240,200'); Sfx.play('clear', 0.6, 1.2);
      Game.bigText('기억 조각을 찾았다', '#fff8e0', '#ffd070', 250, 38);
      Lien.glow = 1; Bubbles.add('lien', '누군가의 기억이에요… 따뜻해요.', 150);
      Game.notice(`기억 조각 ${this.fragCount()} / 40`);
    }
  },

  // ---------- 클리어 · 실패 ----------
  onRoomClear() {
    if (!this.active || !this.lastRoom() || Game.room.def.boss) return false;
    this.clearStage();
    return true;
  },
  clearStage() {
    const R = this.R; if (R.done) return;
    R.done = true;
    const G = Game, p = G.player;
    G.slowmo(0.3, 60); G.flashScreen(0.4, '255,255,255');
    const quiet = this.st.ending;                                  // 엔딩 스테이지 : 팡파르 없이 바로 엔딩으로
    setTimeoutFrames(50, () => {
      if (!quiet) { G.bigText('STAGE CLEAR', '#fff8d0', '#ffb020', 300, 64); Sfx.play('clear'); Music.play('clear'); }
      if (p.hp > 0) { if (p.act) p.endAct(); p.setState('cine'); p.play('win', 6, 1, true); p.bladeGlow = 1; }
      for (const it of G.pickups) it.magnet = true;
    });
    setTimeoutFrames(200, () => this.finish());
  },
  // 보스 처치 (결투형 보스는 체력이 일정 이하로 떨어지면 끝)
  checkDuel() {
    const b = Game.boss;
    if (!this.active || !b || !b.duelAt || b.duelDone || b.hp > b.duelAt) return;
    b.duelDone = true; b.hp = Math.max(1, b.hp);
    b.invul = 9999; b.aiWait = 1e9; b.superArmor = true;
    for (const e of Game.enemies) if (!e.isBoss && !e.dying) e.die({ kx: 5, kz: 8 }, 1);
    const sc = this.script('duel') || [];
    Game.player.setState('cine');
    Cine.run(sc, () => { b.dead = true; Game.boss = null; this.R.duel = true; this.clearStage(); });
  },
  finish() {
    if (!this.active || this.R.finished) return;
    this.R.finished = true;
    const sc = this.script('end');
    const go = () => this.result();
    if (sc) Cine.run(sc, go); else go();
  },
  starsFor() {
    const s = this.st, R = this.R, G = Game, p = G.player, sec = G.stats.time / 60;
    const hp = p.hp / p.hpMax;
    const lim = { kill: 100 + G.dungeon.rooms.length * 30, boss: 150, elite: 90, rush: 110, chase: 80 }[s.type];
    const third = {
      kill: [`${lim | 0}초 안에 클리어`, sec <= lim], boss: ['부활 없이 쓰러뜨리기', G.coins >= 3 && !R.contUsed], elite: [`${lim}초 안에 클리어`, sec <= lim],
      rush: [`${lim}초 안에 클리어`, sec <= lim], chase: [`${lim}초 안에 클리어`, sec <= lim], survive: ['10번 이하로 맞기', G.stats.hitsTaken <= 10],
      defend: [`${(R.objName || '목표')} 체력 70% 이상`, (R.objHp ?? 1) >= 0.7], escort: ['호위 대상 체력 70% 이상', (R.npcHp ?? 1) >= 0.7],
      time: ['시간 30% 이상 남기기', R.timeLeft >= s.sec * 60 * 0.3],
    }[s.type] || ['콤보 30 이상', G.stats.maxCombo >= 30];
    return [['클리어', true], ['체력 50% 이상 남기기', hp >= 0.5], third];
  },
  result() {
    const s = this.st, R = this.R, G = Game, sd = this.sd();
    if (R.npc) R.npcHp = R.npc.hp; if (R.obj) { R.objHp = R.obj.hp; R.objName = R.obj.name; }
    const stars = this.starsFor(), got = stars.map(x => (x[1] ? 1 : 0));
    const prev = sd.clr[s.id], first = !prev;
    const sec = G.stats.time / 60 | 0;
    sd.clr[s.id] = { star: prev ? prev.star.map((v, i) => Math.max(v, got[i])) : got, t: Math.min(prev ? prev.t : 1e9, sec), n: (prev ? prev.n : 0) + 1, combo: Math.max(prev ? prev.combo : 0, G.stats.maxCombo) };
    // 보상 : 처음 깨면 경험치 · 골드를 크게
    const tLv = Math.max(1, Math.round(1 + s.g * 0.66)), dm = Diff.cur();
    const xp = Math.round(Prog.need(tLv) * (first ? 0.8 : 0.12) * (dm.id === 'hard' ? 1.3 : dm.id === 'hell' ? 1.7 : 1));
    const gold = Math.round((first ? 3000 : 600) * storyCurve(s.g) * (dm.gold || 1));
    Prog.gainXp(xp); Save.data.gold = (Save.data.gold || 0) + gold + G.stats.gold;
    if (dm.id === 'hard') Save.data.stat.hardClears++; if (dm.id === 'hell') { Save.data.stat.hellClears++; Save.data.stat.hardClears++; }
    // 맵 클리어 → 다음 난이도
    const unlocks = [];
    if (s.final || s.id === 'T-5') {
      const mc = sd.mapc[s.m] = sd.mapc[s.m] || {};
      if (!mc[dm.id]) { mc[dm.id] = 1; if (dm.id === 'normal' && s.m > 0) unlocks.push(`${SMAPS[s.m].name} 「어려움」 개방`); if (dm.id === 'hard') unlocks.push(`${SMAPS[s.m].name} 「지옥」 개방`); }
    }
    if (s.unlock && !sd.open[s.unlock]) {
      sd.open[s.unlock] = 1;
      unlocks.push({ shop: '상점 개방 — 상인 볼크가 합류했다', hub: '거점 · 스킬 트리 · 장비 강화 개방', tower: '무한의 탑 개방', hell: '지옥 난이도 개방' }[s.unlock]);
      if (s.unlock === 'hell') sd.open.hellDiff = 1;
    }
    // 엔딩
    let nx = s.hidden ? SSTAGES[SSTAGES.indexOf(s) + 1] : SMAIN[SMAIN.indexOf(s) + 1];
    if (s.ending && !R.ending) R.ending = s.hidden ? 'T' : 'A';
    if (R.ending) {
      const E = ENDING_NAME[R.ending];
      if (R.ending === 'route') { sd.flag.trueRoute = 1; nx = SSTAGE['X-1']; sd.cur = nx.id; }
      else sd.end[R.ending] = 1;
      unlocks.push(E.text);
      if (R.ending !== 'T' && R.ending !== 'route' && this.fragCount() < 40) unlocks.push(`기억 조각 ${this.fragCount()} / 40 — 모두 모으면 다른 길이 보일지도 모른다`);
    }
    if (nx && first) sd.cur = nx.id;
    Ach.check(); Save.save();
    this.res = { s, stars, got, first, xp, gold: gold + G.stats.gold, sec, frag: R.gotFrag, unlocks, next: nx && this.unlocked(nx) ? nx : null, combo: G.stats.maxCombo, t: 0 };
    G.state = 'sres'; Input.clear(); Touch.release();
  },
  fail(reason) {
    const R = this.R; if (R.done || R.failed) return;
    R.failed = true;
    Game.slowmo(0.3, 50); Music.stop();
    Game.keptGold = Game.stats.gold; Save.bank(Game.stats.gold); Game.stats.gold = 0;
    this.res = { fail: reason, t: 0, s: this.st };
    setTimeoutFrames(70, () => { Game.state = 'sres'; Input.clear(); Touch.release(); });
  },

  failNow(reason) {                                          // 이어하기를 다 쓴 경우 : 바로 실패 화면
    const R = this.R; if (R) R.failed = true;
    Music.stop();
    Game.keptGold = Game.stats.gold; Save.bank(Game.stats.gold); Game.stats.gold = 0;
    this.res = { fail: reason, t: 0, s: this.st };
    Game.state = 'sres'; Input.clear(); Touch.release();
  },
  // ---------- 결과 화면 ----------
  BTN: [{ x: W / 2 - 330, y: 600, w: 310, h: 56 }, { x: W / 2 + 20, y: 600, w: 310, h: 56 }],
  updateRes() {
    const r = this.res; r.t++;
    if (r.t < 50) { Input.clear(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'left' || q.a === 'right') { r.sel = r.sel ? 0 : 1; Sfx.play('ui', 0.6); }
      else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') { this.resPick(r.sel || 0); return; }
      else if (q.a === 'back' || q.a === 'pause') { this.resPick(1); return; }
    }
  },
  resPick(i) {
    const r = this.res; Sfx.play('select');
    const again = r.fail ? r.s.id : (r.next ? r.next.id : null);
    if (i === 0 && again) { this.start(again); return; }
    Game.coins = 3; Game.toLobby();
  },
  resDown(x, y) { if (this.res.t < 50) return; for (let i = 0; i < 2; i++) if (inR(x, y, this.BTN[i])) { this.resPick(i); return; } },
  drawRes(ctx) {
    const r = this.res, t = r.t, a = Math.min(1, t / 25);
    ctx.fillStyle = `rgba(0,0,0,${0.72 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = a;
    const pg = ctx.createLinearGradient(0, 80, 0, 680); pg.addColorStop(0, 'rgba(30,26,40,0.96)'); pg.addColorStop(1, 'rgba(10,8,14,0.96)');
    ctx.fillStyle = pg; roundRect(ctx, 250, 70, 780, 600, 16); ctx.fill();
    ctx.strokeStyle = r.fail ? '#a04030' : '#c9a55c'; ctx.lineWidth = 2; ctx.stroke();
    UI.text(ctx, `${SMAPS[r.s.m].sub} · ${r.s.id}  ${r.s.name}`, W / 2, 108, { size: 18, align: 'center', font: FONT_B, weight: 700, fill: '#b8a888' });
    if (r.fail) {
      UI.text(ctx, '임무 실패', W / 2, 200, { size: 60, align: 'center', italic: true, fill: '#ff7a60', stroke: 7 });
      UI.text(ctx, r.fail, W / 2, 270, { size: 24, align: 'center', fill: '#f0d0c0', stroke: 4 });
      if (Game.keptGold > 0) UI.text(ctx, `주운 골드 ${fmt(Game.keptGold)} 는 가져간다`, W / 2, 320, { size: 18, align: 'center', font: FONT_B, weight: 700, fill: '#ffe9a6', stroke: 3 });
    } else {
      UI.text(ctx, 'STAGE CLEAR', W / 2, 150, { size: 50, align: 'center', italic: true, fill: '#ffe9a6', stroke: 6 });
      r.stars.forEach(([label, ok], i) => {
        const show = t > 40 + i * 18; if (!show) return;
        const x = W / 2 - 150 + i * 150, y = 228, s = t < 52 + i * 18 ? lerp(2.2, 1, E.out3((t - 40 - i * 18) / 12)) : 1;
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s); starShape(ctx, 0, 0, 34, ok ? '#ffd24a' : '#2a2a36', ok ? '#fff2b0' : '#4a4a5a'); ctx.restore();
        UI.text(ctx, label, x, 282, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: ok ? '#f0e4c0' : '#7a7a8a', stroke: 3 });
      });
      const rows = [['클리어 타임', `${String(r.sec / 60 | 0).padStart(2, '0')}:${String(r.sec % 60).padStart(2, '0')}`], ['최대 콤보', fmt(r.combo)], ['획득 경험치', '+' + fmt(r.xp)], ['획득 골드', '+' + fmt(r.gold)]];
      rows.forEach(([k, v], i) => { if (t < 90 + i * 8) return; UI.text(ctx, k, 380, 330 + i * 40, { size: 19, fill: '#c8cce0', stroke: 3 }); UI.text(ctx, v, 900, 330 + i * 40, { size: 21, align: 'right', fill: '#fff', stroke: 3, italic: true }); });
      let y = 500;
      if (r.frag && t > 130) { UI.text(ctx, `기억 조각 획득  ( ${this.fragCount()} / 40 )`, W / 2, y, { size: 20, align: 'center', fill: '#ffe0a0', stroke: 4 }); y += 32; }
      if (t > 140) for (const u of r.unlocks) { UI.text(ctx, '★ ' + u, W / 2, y, { size: 19, align: 'center', fill: '#8affc0', stroke: 4 }); y += 30; }
    }
    if (t > 50) {
      const labs = r.fail ? ['다시 도전', '지도로'] : [r.next ? '다음 스테이지 ▶' : '지도로', '지도로'];
      if (!r.fail && !r.next) labs[0] = '지도로';
      labs.forEach((lab, i) => {
        const b = this.BTN[i], on = (r.sel || 0) === i;
        ctx.fillStyle = on ? 'rgba(60,44,14,0.95)' : 'rgba(16,16,24,0.9)'; roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
        ctx.strokeStyle = on ? '#ffd24a' : 'rgba(200,200,220,0.35)'; ctx.lineWidth = on ? 2.6 : 1.4; ctx.stroke();
        UI.text(ctx, lab, b.x + b.w / 2, b.y + b.h / 2 + 1, { size: 21, align: 'center', fill: on ? '#ffe9a6' : '#c8cce0', stroke: 3 });
      });
    }
    ctx.restore();
  },

  // ---------- 그리기 ----------
  worldObjs() {
    if (!this.active || !this.R) return [];
    const R = this.R, out = [...R.allies, ...Cine.list()];
    if (R.npc) { out.push(R.npc.a); if (R.npc.b) out.push(R.npc.b); }
    if (R.obj) out.push(new ObjDraw(R.obj));
    if (R.crate && !R.crate.open) out.push(new CrateDraw(R.crate));
    return out;
  },
  drawGround(ctx) {
    if (!this.active || !this.R) return;
    const R = this.R;
    for (const z of R.zones || []) {
      const gy = sy(z.y, 0), col = z.kind === 'pure' ? '140,255,180' : z.kind === 'slowE' ? '120,180,255' : '255,110,90';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, z.x, gy, z.r * 1.2, col, 0.18 + Math.sin(Game.time * 0.05) * 0.05, 1, 0.45);
      ctx.strokeStyle = `rgba(${col},0.45)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(z.x, gy, z.r, z.r * 0.32, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    for (const tr of R.traps) tr.drawGround(ctx);
  },
  drawShadows(ctx) { for (const o of this.worldObjs()) if (o.drawShadow) o.drawShadow(ctx); },
  drawTop(ctx) {                                         // 월드 좌표 · 맨 위 (리엔 · 함정 효과 · 말풍선)
    if (!this.active || !this.R) return;
    for (const tr of this.R.traps) tr.drawTop(ctx);
    if (this.R.fragOrb) { const o = this.R.fragOrb, X = o.x, Y = sy(o.y, o.z); ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, 70, '255,220,150', 0.5); drawGlow(ctx, X, Y, 16, '255,255,240', 0.95); ctx.restore(); }
    Lien.draw(ctx);
    Cine.drawWorld(ctx);
  },
  // 화면 좌표 : 시야 제한 · 기억 필터 · 목표 표시
  drawScreen(ctx) {
    if (!this.active || !this.R) return;
    const s = this.st, R = this.R, G = Game, p = G.player, camX = G.cam.x;
    if (s.rule === 'dark' || s.rule === 'smoke') {
      const c = this.darkC || (this.darkC = makeCanvas(W / 2, H / 2)), g = c.getContext('2d');
      g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      g.fillStyle = s.rule === 'dark' ? 'rgba(2,3,8,0.93)' : 'rgba(40,36,34,0.82)'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-out';
      const hole = (x, y, r) => { const rg = g.createRadialGradient(x, y, r * 0.25, x, y, r); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); };
      hole(p.x - camX, sy(p.y, p.z + 70), s.rule === 'dark' ? 250 : 320);
      if (Lien.on) hole(Lien.x - camX, sy(Lien.y, Lien.z), 150);
      for (const tr of R.traps) if (tr.lit) hole(tr.x - camX, sy(tr.y, 30), 90);
      ctx.drawImage(c, 0, 0, W, H);
    }
    Scr.drawMem(ctx);
  },
  drawHud(ctx) {
    if (!this.active || !this.R || Game.state === 'cine' || Game.state === 'talk') return;
    const s = this.st, R = this.R;
    let y = 108;
    const box = (label, val, col, frac) => {
      ctx.fillStyle = 'rgba(8,8,14,0.72)'; roundRect(ctx, 14, y, 280, frac != null ? 46 : 34, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(201,165,92,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
      UI.text(ctx, label, 28, y + 17, { size: 14, fill: '#e8dcc0', stroke: 3 });
      UI.text(ctx, val, 280, y + 17, { size: 16, align: 'right', fill: col, stroke: 3, italic: true });
      if (frac != null) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(28, y + 32, 252, 6); ctx.fillStyle = col; ctx.fillRect(28, y + 32, 252 * clamp(frac, 0, 1), 6); }
      y += frac != null ? 54 : 42;
    };
    const tm = f => { const sec = Math.ceil(Math.max(0, f) / 60); return `${sec / 60 | 0}:${String(sec % 60).padStart(2, '0')}`; };
    if (s.type === 'survive' && Game.room.hold) box('버티기', tm(R.timer), '#ffe070');
    if (s.type === 'time') box('남은 시간', tm(R.timeLeft), R.timeLeft < 900 && Game.frame % 30 < 15 ? '#ff6a50' : '#ffe070');
    if (R.obj) box(R.obj.name, Math.round(R.obj.hp * 100) + '%', R.obj.hitT > 0 ? '#ff6a50' : '#7ad8ff', R.obj.hp);
    if (R.npc) box(WHO_NAME[s.who] || '동료', Math.round(R.npc.hp * 100) + '%', '#8aff9a', R.npc.hp);
    if (R.thief) box('놓치기까지', tm(R.thiefT), '#ffb070');
    if (s.rule) { UI.text(ctx, `[${RULE_TEXT[s.rule][0]}]`, 28, y + 10, { size: 13, fill: '#c0a8ff', stroke: 3 }); y += 22; }
    if (s.m === 0) this.drawTut(ctx);
  },
  // 튜토리얼 조작 안내
  drawTut(ctx) {
    const k = this.st.tut; if (!k) return;
    const pad = Input.padActive, tch = Touch.on;
    const T = {
      move: tch ? [['왼쪽 화면 끌기', '이동'], ['큰 버튼', '공격 (연타하면 콤보)']] : pad ? [['왼쪽 스틱', '이동'], ['X', '공격 (연타하면 콤보)']] : [['W A S D', '이동'], ['좌클릭 / J', '공격 (연타하면 콤보)']],
      jump: tch ? [['↑ 버튼', '점프'], ['같은 방향 두 번', '대시'], ['← 버튼', '백스텝 (무적)']] : pad ? [['A', '점프'], ['같은 방향 두 번', '대시'], ['B', '백스텝 (무적)']] : [['Space', '점프'], ['같은 방향 두 번', '대시'], ['Z', '백스텝 (무적)']],
      skill: tch ? [['오른쪽 스킬 버튼', '스킬 (공격 중에도 이어 쓸 수 있다)']] : pad ? [['Y · LB · RB · LT', '스킬'], ['RT / L3', '검 고유 스킬 · 각성기']] : [['Q E T F', '스킬 (공격 중에도 이어 쓸 수 있다)'], ['G · R', '검 고유 스킬 · 각성기']],
      pot: tch ? [['빨강 / 파랑 버튼', 'HP / MP 물약']] : pad ? [['십자키 ↑ / ↓', 'HP / MP 물약']] : [['C / V', 'HP / MP 물약']],
    }[k];
    if (!T) return;
    const x = W / 2 - 230, y = H - (tch ? 250 : 168), h = 18 + T.length * 28;
    ctx.save(); ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(8,10,18,0.78)'; roundRect(ctx, x, y, 460, h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(150,220,255,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
    T.forEach(([a, b], i) => { UI.text(ctx, a, x + 20, y + 23 + i * 28, { size: 16, fill: '#9fefff', stroke: 3 }); UI.text(ctx, b, x + 200, y + 23 + i * 28, { size: 15, font: FONT_B, weight: 700, fill: '#e8ecf8', stroke: 3 }); });
    ctx.restore();
  },
};

const StoryRes = { pDown: (x, y) => Story.resDown(x, y) };

// 프레임 단위 예약 (Game.update 가 돌 때만 진행 → 일시정지 중에는 멈춘다)
const _timers = [];
function setTimeoutFrames(n, fn) { _timers.push({ n, fn }); }
function tickTimers() { for (let i = _timers.length - 1; i >= 0; i--) if (--_timers[i].n <= 0) { const f = _timers[i].fn; _timers.splice(i, 1); f(); } }

function starShape(ctx, x, y, r, fill, edge) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2.5; ctx.stroke();
}

// ---------- 그리기용 작은 물체 ----------
class ObjDraw {
  constructor(o) { this.o = o; this.x = o.x; this.y = o.y; }
  drawShadow(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), 40, 12, 0, 0, TAU); ctx.fill(); }
  draw(ctx) {
    const o = this.o, X = o.x, Y = sy(o.y, 0), t = Game.time, hit = o.hitT > 0;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y - 80, 110, hit ? '255,90,70' : '120,220,255', 0.3 + Math.sin(t * 0.06) * 0.08); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#2a3446'; ctx.beginPath(); ctx.moveTo(X - 30, Y); ctx.lineTo(X - 20, Y - 22); ctx.lineTo(X + 20, Y - 22); ctx.lineTo(X + 30, Y); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(X - 16, 0, X + 16, 0); g.addColorStop(0, '#5ab8e8'); g.addColorStop(0.5, '#d8f6ff'); g.addColorStop(1, '#3a88c0');
    ctx.fillStyle = hit ? '#ffb0a0' : g; ctx.beginPath(); ctx.moveTo(X, Y - 150 - Math.sin(t * 0.05) * 4); ctx.lineTo(X + 18, Y - 70); ctx.lineTo(X, Y - 24); ctx.lineTo(X - 18, Y - 70); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(10,20,40,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
}
class CrateDraw {
  constructor(c) { this.c = c; this.x = c.x; this.y = c.y; }
  drawShadow(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), 30, 9, 0, 0, TAU); ctx.fill(); }
  draw(ctx) {
    const c = this.c, X = c.x + (c.cd > 10 ? rand(-2, 2) : 0), Y = sy(c.y, 0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y - 26, 60, '255,220,150', 0.18 + Math.sin(Game.time * 0.07) * 0.08); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#4a3220'; ctx.fillRect(X - 26, Y - 46, 52, 46);
    ctx.fillStyle = '#6a4a2e'; ctx.fillRect(X - 26, Y - 46, 52, 8); ctx.fillRect(X - 26, Y - 24, 52, 5);
    ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 2.5; ctx.strokeRect(X - 26, Y - 46, 52, 46);
    ctx.beginPath(); ctx.moveTo(X - 26, Y - 46); ctx.lineTo(X + 26, Y); ctx.moveTo(X + 26, Y - 46); ctx.lineTo(X - 26, Y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,230,160,0.9)'; ctx.fillRect(X - 3, Y - 30, 6, 6);
    ctx.restore();
  }
}

// ---------- 함정 ----------
class Trap {
  constructor(kind, x, y, i = 0) {
    this.kind = kind; this.x = x; this.y = y; this.t = -((i * 37) % 120); this.hits = []; this.drops = []; this.lit = kind === 'fire' || kind === 'bolt';
    this.period = { spike: 150, fire: 170, crystal: 160, saw: 1 }[kind] || 0;
    this.sawY = DEPTH / 2; this.sawV = 2.2 + (i % 3) * 0.4;
  }
  atk() { return Math.round(1500 * Math.pow(Game.dungeon.def.mul, 0.62) * DIFF.atk * Diff.cur().atk); }
  hit(tx, ty, r, mul, kz) {
    const p = Game.player, h = { dmg: mul, kx: 4, kz: kz || 0, stun: 18, stop: 4, shake: 3, fx: 'none', sfx: 'hurt', down: !!kz };
    const att = { x: tx, y: ty, z: 0, facing: p.x >= tx ? 1 : -1, atk: this.atk(), hitstop: 0, scale: 1 };
    if (p.hp > 0 && p.invul <= 0 && p.state !== 'cine' && p.state !== 'down' && Math.abs(p.x - tx) < r && Math.abs(p.y - ty) < r * 0.45 && p.z < 40) applyHit(att, p, h, { dir: p.x >= tx ? 1 : -1 });
    for (const e of Game.enemies) if (!e.isBoss && !e.dying && !e.dead && e.hittable() && Math.abs(e.x - tx) < r && Math.abs(e.y - ty) < r * 0.45 && e.z < 40) applyHit(att, e, Object.assign({}, h, { dmg: mul * 3 }), { dir: e.x >= tx ? 1 : -1 });
  }
  update() {
    this.t++;
    const p = Game.player, k = this.kind;
    if (k === 'debris' || k === 'rock' || k === 'bolt') {              // 플레이어 근처로 떨어지는 것
      if (this.t % (k === 'bolt' ? 120 : 95) === 0) this.drops.push({ x: p.x + rand(-160, 160), y: clamp(p.y + rand(-50, 50), 10, DEPTH - 10), t: 0 });
      for (const d of this.drops) {
        d.t++;
        if (d.t === 55) {
          this.hit(d.x, d.y, 62, 0.9, 6); Game.addShake(k === 'bolt' ? 6 : 5);
          if (k === 'bolt') { Sfx.play('explode', 0.5, 1.6); FX.add('world', new Flash(d.x, sy(d.y, 60), 20, 140, 14, '200,220,255', 0.9)); }
          else { Sfx.impact('stone', 2, { vol: 0.8 }); for (let i = 0; i < 7; i++) FX.add('world', new Debris(d.x, d.y, 20, { vx: rand(-4, 4), vz: rand(3, 8), s: rand(3, 6) })); }
          Hitfx.dust(d.x, sy(d.y, 0), 5, 22);
        }
      }
      this.drops = this.drops.filter(d => d.t < 70);
    } else if (k === 'arrow') {
      if (this.t % 110 === 0) this.drops.push({ y: clamp(p.y + rand(-30, 30), 10, DEPTH - 10), t: 0, x: Game.cam.x + W + 40 });
      for (const d of this.drops) { d.t++; if (d.t > 50) { d.x -= 14; if (!d.hitDone && Math.abs(d.x - p.x) < 20) { const y0 = p.y; if (Math.abs(y0 - d.y) < 22 && p.z < 60) { d.hitDone = true; this.hit(p.x + 1, d.y, 30, 0.7, 0); } } } }
      this.drops = this.drops.filter(d => d.x > Game.cam.x - 60);
    } else if (k === 'saw') {
      this.sawY += this.sawV; if (this.sawY < 15 || this.sawY > DEPTH - 15) this.sawV *= -1;
      if (this.t % 20 === 0) this.hit(this.x, this.sawY, 40, 0.5, 0);
    } else if (k === 'pool' || k === 'ice') {
      if (k === 'pool' && this.t % 40 === 0) this.hit(this.x, this.y, 90, 0.25, 0);
      if (k === 'ice' && Math.abs(p.x - this.x) < 110 && Math.abs(p.y - this.y) < 40) { p.x += (p.iceV || 0); p.iceV = (p.iceV || 0) * 0.95 + (p.x - p.px) * 0.05; } else p.iceV = 0;
    } else if (this.period) {
      const u = ((this.t % this.period) + this.period) % this.period;
      if (u === this.period - 30) { this.hit(this.x, this.y, 70, 0.9, 7); Game.addShake(3); if (k === 'fire') Sfx.play('fire', 0.4); else Sfx.impact('metal', 1, { vol: 0.5 }); }
    }
  }
  drawGround(ctx) {
    const k = this.kind, t = Game.time;
    for (const d of this.drops) if ((k === 'debris' || k === 'rock' || k === 'bolt') && d.t < 55) {
      const u = d.t / 55, gy = sy(d.y, 0);
      ctx.fillStyle = `rgba(${k === 'bolt' ? '150,180,255' : '255,60,40'},${0.15 + u * 0.3})`; ctx.beginPath(); ctx.ellipse(d.x, gy, 62 * (0.4 + u * 0.6), 18 * (0.4 + u * 0.6), 0, 0, TAU); ctx.fill();
    }
    if (k === 'arrow') for (const d of this.drops) if (d.t <= 50) { ctx.fillStyle = `rgba(255,80,60,${0.2 + (d.t / 50) * 0.3})`; ctx.fillRect(Game.cam.x, sy(d.y, 0) - 3, W, 6); }
    if (k === 'pool') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, sy(this.y, 0), 110, '110,255,90', 0.22, 1, 0.4); ctx.restore(); ctx.fillStyle = 'rgba(60,140,40,0.55)'; ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), 90, 26, 0, 0, TAU); ctx.fill(); }
    if (k === 'ice') { ctx.fillStyle = 'rgba(200,235,255,0.35)'; ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), 110, 30, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (this.period && k !== 'saw') {
      const u = ((this.t % this.period) + this.period) % this.period, warn = u > this.period - 70 && u < this.period - 30, on = u >= this.period - 30 && u < this.period - 8;
      const gy = sy(this.y, 0), col = k === 'fire' ? '255,120,40' : k === 'crystal' ? '150,220,255' : '220,220,230';
      ctx.fillStyle = `rgba(${col},${warn ? 0.25 + Math.sin(t * 0.6) * 0.15 : 0.12})`; ctx.beginPath(); ctx.ellipse(this.x, gy, 70, 22, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (on && k !== 'fire') { ctx.fillStyle = k === 'crystal' ? '#bfeaff' : '#c8ccd8'; for (let i = -3; i <= 3; i++) { const sx = this.x + i * 18, h = 40 - Math.abs(i) * 6; ctx.beginPath(); ctx.moveTo(sx - 7, gy); ctx.lineTo(sx, gy - h); ctx.lineTo(sx + 7, gy); ctx.closePath(); ctx.fill(); } }
    }
  }
  drawTop(ctx) {
    const k = this.kind, t = Game.time;
    if (k === 'debris' || k === 'rock') for (const d of this.drops) if (d.t < 55) { const u = d.t / 55, X = d.x, Y = sy(d.y, (1 - u) * 520); ctx.fillStyle = '#4a3e34'; ctx.beginPath(); ctx.arc(X, Y, 16, 0, TAU); ctx.fill(); ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 2; ctx.stroke(); }
    if (k === 'arrow') for (const d of this.drops) if (d.t > 50) { const Y = sy(d.y, 50); ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(d.x, Y); ctx.lineTo(d.x + 40, Y); ctx.stroke(); ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(d.x - 8, Y); ctx.lineTo(d.x + 2, Y - 5); ctx.lineTo(d.x + 2, Y + 5); ctx.fill(); }
    if (k === 'saw') { const X = this.x, Y = sy(this.sawY, 40); ctx.save(); ctx.translate(X, Y); ctx.rotate(t * 0.4); ctx.fillStyle = '#b8bcc8'; for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(30, -5); ctx.lineTo(40, 0); ctx.lineTo(30, 5); ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a5e6a'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.restore(); }
    if (k === 'fire' && this.period) {
      const u = ((this.t % this.period) + this.period) % this.period, on = u >= this.period - 30 && u < this.period - 4;
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gy = sy(this.y, 0); for (let i = 0; i < 6; i++) drawGlow(ctx, this.x + rand(-20, 20), gy - i * 30 - rand(0, 20), 40 - i * 4, i < 2 ? '255,230,150' : '255,110,30', 0.6); ctx.restore(); }
    }
  }
}

// ---------- 동료 : 함께 싸운다 (적은 동료를 노리지 않는다) ----------
class Ally {
  constructor(kind, x, y) {
    const C = CAST[kind] || CAST.seric;
    this.kind = kind; this.isPlayer = false; this.facing = 1; this.hitstop = 0; this.scale = 1; this.z = 0;
    this.a = new Actor('ally_' + kind, kind, x, y, { facing: 1 });
    this.x = x; this.y = y; this.cd = 40; this.af = 0; this.mage = kind === 'ella' || kind === 'youngella';
    const p = Game.player; this.atk = Math.round((p ? p.atk : 3000) * 0.3); this.w = 16; this.d = 11;
    this.healT = 480;
  }
  update() {
    if (this.hitstop > 0) { this.hitstop--; return; }
    const G = Game, p = G.player, a = this.a;
    let tgt = null, best = 1e9;
    for (const e of G.enemies) { if (e.dying || e.dead || !e.hittable() || e.state === 'spawn') continue; const d = Math.abs(e.x - this.x) + Math.abs(e.y - this.y) * 2; if (d < best) { best = d; tgt = e; } }
    const range = this.mage ? 340 : 80;
    if (G.state !== 'play') tgt = null;
    if (this.af > 0) {                                                  // 공격 중
      this.af--;
      if (this.af === 12 && tgt) {
        if (this.mage) {
          FX.add('world', new Flash(tgt.x, sy(tgt.y, 70), 14, 90, 14, '190,140,255', 0.85));
          applyHit(this, tgt, { dmg: 1, kx: 2, kz: 3, stun: 22, stop: 3, shake: 1, fx: 'none', sfx: 'none' }, { noStopAtt: true });
          Sfx.play('ui', 0.25, 0.6);
        } else if (Math.abs(tgt.x - this.x) < 110 && Math.abs(tgt.y - this.y) < 34) applyHit(this, tgt, { dmg: 1, kx: 3.5, stun: 20, stop: 4, shake: 1.2, fx: 'slash' }, { noStopAtt: true });
      }
    } else if (tgt) {
      const dx = tgt.x - this.x, dy = tgt.y - this.y;
      this.facing = sign(dx);
      if (Math.abs(dx) > range || Math.abs(dy) > 26) { const sp = 3; this.x += clamp(dx - sign(dx) * range * 0.8, -sp, sp); this.y += clamp(dy, -1.6, 1.6); a.spd = 3.5; a.tx = null; this.moving = true; }
      else if (--this.cd <= 0) { this.cd = this.mage ? 70 : 34 + randi(0, 14); this.af = 24; this.atkN = ((this.atkN || 0) + 1) % 3; a.body.play(this.mage ? 'drawReady' : ['a1', 'a2', 'a3'][this.atkN], 2, 1, true); this.moving = false; }
      else this.moving = false;
    } else {                                                            // 주인공 뒤를 따른다
      const fx = p.x - p.facing * 110, dx = fx - this.x;
      if (Math.abs(dx) > 40) { this.x += clamp(dx, -3.2, 3.2); this.facing = sign(dx); this.moving = true; } else this.moving = false;
      this.y = lerp(this.y, clamp(p.y - 30, 10, DEPTH - 10), 0.04);
    }
    if (this.mage && --this.healT <= 0 && p.hp > 0) { this.healT = 480; p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.06); FX.add('world', new Flash(p.x, sy(p.y, 70), 10, 90, 20, '150,255,180', 0.6)); Game.notice('엘라의 치유 마법'); }
    this.x = clamp(this.x, 40, G.room.width - 40);
    a.x = this.x; a.y = this.y; a.facing = this.facing;
    const b = a.body; b.px = b.x; b.x = this.x; b.y = this.y; b.facing = this.facing;
    if (this.af <= 0) b.play(this.moving ? 'run' : 'idle', 5);
    b.stepAnim(); if (b.updateChains) b.updateChains();
  }
  drawShadow(ctx) { this.a.drawShadow(ctx); }
  draw(ctx) { this.a.draw(ctx); }
}
