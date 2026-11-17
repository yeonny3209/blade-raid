'use strict';
// ============================================================
//  캐릭터 레벨 · 경험치
//   - 몬스터를 쓰러뜨리면 경험치 → 레벨업 (최대 Lv.100)
//   - 레벨마다 공격력 · 최대 HP 0.6% 성장 + 스킬 포인트 1 (10레벨마다 1 추가)
//   - 스킬 트리(검의 성좌)와 별 효과는 skilltree.js
// ============================================================

// ============================================================
//  진행 상태
// ============================================================
const Prog = {
  MAXLV: 100,
  lv() { return (Save.data && Save.data.lv) || 1; },
  xp() { return (Save.data && Save.data.xp) || 0; },
  need(L) { return Math.round(40 * Math.pow(L, 1.6)); },
  earned() { const L = this.lv(); return (L - 1) + Math.floor(L / 10); },

  // ---------- 경험치 ----------
  xpFor(e) {
    const D = Game.dungeon && Game.dungeon.def;
    const base = e.isBoss ? 400 : e.elite ? 35 : (e.kind === 'slimelet' ? 3 : 10);
    const tier = D && D.tower ? 1 + (Game.roomIdx + 1) * 0.1 : 1 + Math.max(0, Game.dungeonIdx) * 0.35;
    const dm = ({ easy: 0.7, normal: 1, hard: 1.4, hell: 2 })[Diff.cur().id] || 1;
    return Math.max(1, Math.round(base * tier * dm));
  },
  gainXp(n, quiet) {
    const d = Save.data;
    if (d.lv >= this.MAXLV) { d.xp = 0; return; }
    if (typeof Story !== 'undefined' && Story.active) n = Math.round(n * STORY_XP);          // 메인 스토리 : 끝에 이르러 약 Lv.80 이 되도록 맞춘 값
    d.xp = (d.xp || 0) + n;
    let ups = 0;
    while (d.lv < this.MAXLV && d.xp >= this.need(d.lv)) { d.xp -= this.need(d.lv); d.lv++; ups++; }
    if (d.lv >= this.MAXLV) d.xp = 0;
    if (ups && !quiet) this.onLevelUp(ups);
  },
  onLevelUp(ups) {
    const p = Game.player, L = this.lv();
    Save.save();
    if (p && p.setGear) {
      p.setGear();
      p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.3); p.mp = p.mpMax; p.lv = L;
      const X = p.x, gy = sy(p.y, 0);
      FX.add('world', new Pillar(X, p.y, 70, 420, 34, '255,215,110', '255,255,230'));
      FX.add('ground', new Ring(X, gy, 20, 260, 30, { col: '255,225,130', w: 12 }));
      for (let i = 0; i < 24; i++) FX.add('world', new Mote(X + rand(-40, 40), gy - rand(0, 160), rand(-0.6, 0.6), rand(-3, -1), { col: choose(['255,230,140', '255,255,255']), life: 50, r: rand(5, 9), grav: 0 }));
    }
    Game.bigText(`LEVEL UP!  Lv.${L}`, '#fff6c0', '#ffb020', 220, 48);
    if (typeof Ach !== 'undefined') Ach.check();
    Sfx.play('clear', 0.9, 1.25); Sfx.play('ring', 0.8, 1.4);
    const sp = (L - 1) + Math.floor(L / 10) - ((L - ups - 1) + Math.floor((L - ups) / 10));
    Game.notice(`스킬 포인트 +${sp}  (지도의 [스킬 트리]에서 배울 수 있어요)`);
  },
  // 처음 이 기능이 생겼을 때 : 이미 깬 던전만큼 경험치를 소급해서 준다
  migrate(d) {
    if (d.lv) return;
    d.lv = 1; d.xp = 0; d.tree = d.tree || {};
    const cleared = Object.keys(d.cleared || {});
    let xp = 0;
    for (const id of cleared) { const i = DUNGEONS.findIndex(x => x.id === id); if (i >= 0) xp += 900 * (1 + i * 0.35); }
    xp += (d.tower && d.tower.best || 0) * 120;
    const save = Save.data; Save.data = d; this.gainXp(Math.round(xp), true); Save.data = save;
  },

  // ---------- 능력치 (레벨) ----------
  atkMul() { return 1 + 0.006 * (this.lv() - 1); },
};

// ---------- 타격 분류 표시 ----------
(function tagHits() {
  for (const k of ['a1', 'a2', 'a3', 'a4', 'dash', 'jump']) if (HD[k]) HD[k]._cat = 'basic';
  if (HD.upper) HD.upper._cat = 's1';
  for (const k of ['rushHit', 'rushEnd']) if (HD[k]) HD[k]._cat = 's2';
  for (const k of ['tri1', 'tri2', 'tri3']) if (HD[k]) HD[k]._cat = 's3';
  for (const k of ['drawMark', 'drawFinal']) if (HD[k]) HD[k]._cat = 's4';
  for (const k of ['quake1', 'quake2', 'ultHit', 'ultFinal']) if (HD[k]) HD[k]._cat = 'wsk';
  for (const k in WH) if (!WH[k]._cat) WH[k]._cat = 'wsk';
  const hd0 = WS.hd;
  WS.hd = function (o) { const h = hd0.call(this, o); h._cat = 'wsk'; return h; };
})();

// 던전 권장 레벨 표시 (캐릭터 레벨과 같은 눈금)
DUNGEONS.forEach((d, i) => { d.lv = 1 + i * 5; });
