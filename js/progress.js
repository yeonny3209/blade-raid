'use strict';
// ============================================================
//  캐릭터 레벨 · 경험치 · 스킬 트리
//   - 몬스터를 쓰러뜨리면 경험치 → 레벨업 (최대 Lv.100)
//   - 레벨마다 공격력 · 최대 HP 0.6% 성장 + 스킬 포인트 1 (10레벨마다 1 추가)
//   - 스킬 트리 7갈래 × 4단계 : 검술(평타) / Q / E / T / F / 신체 / 비기(G · R)
//     4단계 노드는 새로운 동작이 붙는 "핵심 기술"
// ============================================================

// ---------- 트리 정의 ----------
//  col : 갈래, tier : 단계(1~4), max : 최대 랭크, g : 아이콘 모양, v(r) : 랭크 r 일 때의 설명 문구
const TREE_COLS = [
  { name: '검술', sub: '평타 · 콤보', col: '255,200,120', icon: null, g: 'bigsword' },
  { name: '어퍼 슬래시', sub: 'Q', col: '255,140,90', icon: 'upper' },
  { name: '돌진참', sub: 'E', col: '110,200,255', icon: 'rush' },
  { name: '삼단베기', sub: 'T', col: '180,140,255', icon: 'triple' },
  { name: '발도 : 섬', sub: 'F', col: '255,236,140', icon: 'draw' },
  { name: '신체', sub: '체력 · 이동', col: '130,255,170', icon: null, g: 'shield' },
  { name: '비기', sub: 'G · R', col: '255,110,200', icon: null, g: 'rift' },
];
const pct = v => `${Math.round(v * 1000) / 10}%`;
const TREE = [
  // 검술
  { id: 'b_edge', col: 0, tier: 1, max: 5, name: '날카로운 검', g: 'dagger', v: r => `평타 피해 +${pct(0.05 * r)}` },
  { id: 'b_combo', col: 0, tier: 2, max: 3, name: '연격', g: 'zigzag', v: r => `4번째 평타 · 대시 공격 피해 +${pct(0.15 * r)}` },
  { id: 'b_drain', col: 0, tier: 3, max: 3, name: '흡혈 검기', g: 'drop', v: r => `평타가 적중하면 최대 HP의 ${pct(0.0025 * r)} 회복` },
  { id: 'b_wave', col: 0, tier: 4, max: 1, name: '검귀의 일격', g: 'crescent', key: true, v: () => '4번째 평타가 초승달 검기를 날려 앞의 적을 모두 꿰뚫는다 (공격력 250%)' },
  // Q
  { id: 'q_dmg', col: 1, tier: 1, max: 5, name: '어퍼 강화', g: 'spikes', v: r => `어퍼 슬래시 피해 +${pct(0.1 * r)}` },
  { id: 'q_cd', col: 1, tier: 2, max: 3, name: '빠른 손놀림', g: 'clock', v: r => `어퍼 슬래시 쿨타임 -${pct(0.1 * r)}` },
  { id: 'q_air', col: 1, tier: 3, max: 3, name: '공중 추격', g: 'feather', v: r => `공중에서 휘두르는 평타 피해 +${pct(0.12 * r)}` },
  { id: 'q_quake', col: 1, tier: 4, max: 1, name: '천공참', g: 'tornado', key: true, v: () => '어퍼 슬래시를 쓰면 주변 모든 적이 충격파에 함께 떠오른다 (공격력 300%)' },
  // E
  { id: 'e_dmg', col: 2, tier: 1, max: 5, name: '돌진 강화', g: 'boomerang', v: r => `돌진참 피해 +${pct(0.1 * r)}` },
  { id: 'e_cd', col: 2, tier: 2, max: 3, name: '질풍', g: 'hourglass', v: r => `돌진참 쿨타임 -${pct(0.1 * r)}` },
  { id: 'e_mp', col: 2, tier: 3, max: 3, name: '호흡 조절', g: 'orbit', v: r => `돌진참 MP 소모 -${pct(0.12 * r)}` },
  { id: 'e_ghost', col: 2, tier: 4, max: 1, name: '잔상 돌격', g: 'clones', key: true, v: () => '돌진이 끝나면 잔상이 같은 길을 되짚어 달리며 한 번 더 벤다 (공격력 350%)' },
  // T
  { id: 't_dmg', col: 3, tier: 1, max: 5, name: '삼단 강화', g: 'spin', v: r => `삼단베기 피해 +${pct(0.1 * r)}` },
  { id: 't_cd', col: 3, tier: 2, max: 3, name: '연속 동작', g: 'hourglass', v: r => `삼단베기 쿨타임 -${pct(0.1 * r)}` },
  { id: 't_mp', col: 3, tier: 3, max: 3, name: '절제된 검', g: 'snow', v: r => `삼단베기 MP 소모 -${pct(0.12 * r)}` },
  { id: 't_fourth', col: 3, tier: 4, max: 1, name: '사단베기', g: 'shatter', key: true, v: () => '삼단베기 끝에 X자 마무리 베기가 하나 더 이어진다 (공격력 600%)' },
  // F
  { id: 'f_dmg', col: 4, tier: 1, max: 5, name: '발도 강화', g: 'iai', v: r => `발도 : 섬 피해 +${pct(0.1 * r)}` },
  { id: 'f_cd', col: 4, tier: 2, max: 3, name: '납도', g: 'clock', v: r => `발도 : 섬 쿨타임 -${pct(0.1 * r)}` },
  { id: 'f_crit', col: 4, tier: 3, max: 3, name: '급소 베기', g: 'constellation', v: r => `발도 : 섬 치명타율 +${pct(0.15 * r)}` },
  { id: 'f_echo', col: 4, tier: 4, max: 1, name: '연속 발도', g: 'crescent', key: true, v: () => '발도가 끝나면 같은 길을 한 번 더 가르는 잔영이 남는다 (공격력 900%)' },
  // 신체
  { id: 'v_hp', col: 5, tier: 1, max: 5, name: '강인한 육체', g: 'shield', v: r => `최대 HP +${pct(0.04 * r)}` },
  { id: 'v_mp', col: 5, tier: 2, max: 5, name: '명상', g: 'orbit', v: r => `MP 재생 +${pct(0.08 * r)}` },
  { id: 'v_swift', col: 5, tier: 3, max: 3, name: '바람걸음', g: 'feather', v: r => `이동속도 +${pct(0.03 * r)}` },
  { id: 'v_undying', col: 5, tier: 4, max: 1, name: '불굴', g: 'angel', key: true, v: () => '방(층)마다 한 번, 쓰러질 피해를 받아도 HP 30%로 버티고 잠시 무적이 된다' },
  // 비기
  { id: 'w_dmg', col: 6, tier: 1, max: 5, name: '검의 공명', g: 'rift', v: r => `검 고유 스킬(G · R) 피해 +${pct(0.07 * r)}` },
  { id: 'w_cdr', col: 6, tier: 2, max: 3, name: '각성 가속', g: 'hourglass', v: r => `각성기(R) 쿨타임 -${pct(0.07 * r)}` },
  { id: 'w_mp', col: 6, tier: 3, max: 3, name: '마력 순환', g: 'portal', v: r => `스킬을 쓰면 소모한 MP의 ${pct(0.08 * r)}를 돌려받는다` },
  { id: 'w_zen', col: 6, tier: 4, max: 1, name: '극의', g: 'eclipse', key: true, v: () => '각성기(R)를 쓴 뒤 6초 동안 다른 스킬의 쿨타임이 2배 빨리 돈다' },
];
const TREE_BY_ID = Object.fromEntries(TREE.map(n => [n.id, n]));
const TIER_GATE = [0, 0, 4, 10, 18];                     // 단계별로 필요한 총 투자 포인트

// 트리 전용 타격
const TH = {
  wave: { dmg: 2.5, kx: 5, kz: 3, airKz: 4, stun: 30, stop: 4, shake: 4, fx: 'slash', power: 1.4, _cat: 'tree' },
  launch: { dmg: 3, kx: 1, kz: 14, airKz: 12, stun: 50, stop: 6, shake: 6, fx: 'blunt', power: 1.5, _cat: 'tree' },
  ghost: { dmg: 3.5, kx: 6, kz: 6, airKz: 6, stun: 40, stop: 6, shake: 6, fx: 'slash', power: 1.6, _cat: 'tree' },
  fourth: { dmg: 6, kx: 9, kz: 10, airKz: 10, stun: 60, stop: 12, shake: 12, fx: 'x', power: 2.2, _cat: 'tree' },
  echo: { dmg: 9, kx: 6, kz: 9, airKz: 9, stun: 60, stop: 10, shake: 10, fx: 'x', power: 2.2, _cat: 'tree' },
};

// ============================================================
//  진행 상태
// ============================================================
const Prog = {
  MAXLV: 100,
  lv() { return (Save.data && Save.data.lv) || 1; },
  xp() { return (Save.data && Save.data.xp) || 0; },
  need(L) { return Math.round(40 * Math.pow(L, 1.6)); },
  earned() { const L = this.lv(); return (L - 1) + Math.floor(L / 10); },
  r(id) { return (Save.data && Save.data.tree && Save.data.tree[id]) || 0; },
  spent() { let n = 0; const t = (Save.data && Save.data.tree) || {}; for (const k in t) n += t[k]; return n; },
  free() { return Math.max(0, this.earned() - this.spent()); },
  resetCost() { return this.spent() * 3000; },

  // 배울 수 있는지 + 안 되는 이유
  check(n) {
    const r = this.r(n.id);
    if (r >= n.max) return { ok: false, why: '최대 랭크' };
    if (n.tier > 1) {
      const prev = TREE.find(o => o.col === n.col && o.tier === n.tier - 1);
      if (prev && this.r(prev.id) <= 0) return { ok: false, why: `먼저 「${prev.name}」을 배워야 합니다` };
    }
    if (this.spent() < TIER_GATE[n.tier]) return { ok: false, why: `${n.tier}단계는 총 ${TIER_GATE[n.tier]}포인트를 쓴 뒤 열립니다` };
    if (this.free() <= 0) return { ok: false, why: '스킬 포인트가 부족합니다' };
    return { ok: true };
  },
  learn(n) {
    if (!this.check(n).ok) return false;
    Save.data.tree[n.id] = this.r(n.id) + 1; Save.save();
    this.refresh();
    return true;
  },
  reset() {
    const c = this.resetCost();
    if (!this.spent() || (Save.data.gold || 0) < c) return false;
    Save.data.gold -= c; Save.data.tree = {}; Save.save(); this.refresh();
    return true;
  },
  refresh() { const p = Game.player; if (p && p.setGear) p.setGear(); },

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

  // ---------- 능력치 ----------
  atkMul() { return 1 + 0.006 * (this.lv() - 1); },
  hpMul() { return (1 + 0.006 * (this.lv() - 1)) * (1 + 0.04 * this.r('v_hp')); },
  mpRegenMul() { return 1 + 0.08 * this.r('v_mp'); },
  moveMul() { return 1 + 0.03 * this.r('v_swift'); },
  cdMul(k) {
    const m = { s1: 'q_cd', s2: 'e_cd', s3: 't_cd', s4: 'f_cd' }[k];
    if (m) return 1 - 0.1 * this.r(m);
    if (k === 's6') return 1 - 0.07 * this.r('w_cdr');
    return 1;
  },
  mpMul(k) { return k === 's2' ? 1 - 0.12 * this.r('e_mp') : k === 's3' ? 1 - 0.12 * this.r('t_mp') : 1; },

  // 타격 종류 : basic / s1~s4 / wsk(검 고유 · 지진검 · 귀신참) / tree
  cat(hit) { return hit && hit._cat; },
  dmgMul(p, hit) {
    switch (this.cat(hit)) {
      case 'basic': {
        let m = 1 + 0.05 * this.r('b_edge');
        if (hit === HD.a4 || hit === HD.dash) m *= 1 + 0.15 * this.r('b_combo');
        if (p.z > 20) m *= 1 + 0.12 * this.r('q_air');
        return m;
      }
      case 's1': return 1 + 0.1 * this.r('q_dmg');
      case 's2': return 1 + 0.1 * this.r('e_dmg');
      case 's3': return 1 + 0.1 * this.r('t_dmg');
      case 's4': return 1 + 0.1 * this.r('f_dmg');
      case 'wsk': return 1 + 0.07 * this.r('w_dmg');
    }
    return 1;
  },
  critAdd(p, hit) { return this.cat(hit) === 's4' ? 0.15 * this.r('f_crit') : 0; },

  // 적중 후
  onHit(p, t, dmg, hit) {
    if (this.cat(hit) !== 'basic') return;
    const dr = this.r('b_drain');
    if (dr && Game.frame - (p.drainF || -99) > 6) { p.drainF = Game.frame; Gear.heal(p, p.hpMax * 0.0025 * dr, true); }
    if (hit === HD.a4 && this.r('b_wave') && Game.frame - (p.waveF || -99) > 12) {
      p.waveF = Game.frame;
      const d = p.facing;
      FX.add('world', new WShot(p, p.x + d * 50, p.y, p.z + 70, d * 17, 0, 0, { style: 'crescent', col: '255,205,130', r: 44, life: 42, pierce: true, hd: TH.wave, floor: true }));
      Sfx.pplay('swingBig'); Sfx.play('ring', 0.4, 1.6);
    }
  },
  // 스킬을 쓴 직후
  onSkill(p, k, s) {
    const wm = this.r('w_mp');
    if (wm && s.mp) p.mp = Math.min(p.mpMax, p.mp + s.mp * this.mpMul(k) * 0.08 * wm);
    const x0 = p.x, y0 = p.y, d = p.facing;
    if (k === 's1' && this.r('q_quake')) Gear.later(7, () => {
      const gy = sy(p.y, 0);
      FX.add('ground', new Ring(p.x, gy, 20, 300, 22, { col: '255,160,100', w: 12 })); FX.add('world', new Flash(p.x, gy - 30, 20, 220, 16, '255,180,120', 0.7));
      for (let i = 0; i < 10; i++) FX.add('world', new Debris(p.x + rand(-60, 60), p.y, 4, { vx: rand(-6, 6), vz: rand(6, 13), s: rand(3, 5) }));
      Sfx.play('quake', 0.6, 1.2); Game.addShake(8);
      WS.area(p, p.x, p.y, 260, 110, TH.launch, { hmax: 200 });
    });
    if (k === 's2' && this.r('e_ghost')) Gear.later(34, () => {
      const x1 = p.x, cx = (x0 + x1) / 2, half = Math.abs(x1 - x0) / 2 + 80;
      for (let i = 0; i < 5; i++) p.addGhost(lerp(x1, x0, i / 4), y0, 0, -d, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 10 + i * 2, '120,200,255');
      FX.add('world', new CutLine(cx, sy(y0, 80), d > 0 ? Math.PI : 0, half * 2, 8, '140,215,255', 14));
      Sfx.wlayer('wind', 2, true); Sfx.pplay('swingBig'); Game.addShake(6);
      WS.area(p, cx, y0, half, 70, TH.ghost, { dir: -d });
    });
    if (k === 's3' && this.r('t_fourth')) Gear.later(56, () => {
      const dd = p.facing, cx = p.x + dd * 100, cy = sy(p.y, 80);
      FX.add('world', new CutLine(cx, cy, 0.75, 170, 9, '210,180,255', 16)); FX.add('world', new CutLine(cx, cy, -0.75, 170, 9, '210,180,255', 16));
      FX.add('world', new Flash(cx, cy, 20, 220, 16, '200,170,255', 0.85));
      swingT(p, 'a4', 1.5); Sfx.pplay('swingBig'); Sfx.play('explode', 0.5); Game.addShake(10); Game.freeze(4);
      WS.area(p, cx, p.y, 180, 80, TH.fourth);
    });
    if (k === 's4' && this.r('f_echo')) Gear.later(46, () => {
      const x1 = p.x, cx = (x0 + x1) / 2, half = Math.abs(x1 - x0) / 2 + 90;
      FX.add('world', new CutLine(cx, sy(y0, 70), 0, half * 2 + 60, 10, '255,240,170', 18));
      FX.add('world', new Flash(cx, sy(y0, 70), 20, 260, 16, '255,240,190', 0.8));
      Sfx.wlayer('katana', 3, true); Game.flashScreen(0.15, '255,250,220'); Game.addShake(10);
      WS.area(p, cx, y0, half, 70, TH.echo);
    });
    if (k === 's6' && this.r('w_zen')) { p.zenT = 360; FX.add('world', new WZen(p)); }
  },
  // 쓰러질 피해를 받았을 때 (불굴)
  tryUndying(p) {
    if (!this.r('v_undying') || p.undyingUsed) return false;
    p.undyingUsed = true; p.hp = Math.round(p.hpMax * 0.3); p.invul = 120;
    FX.add('top', new Label(p.x, sy(p.y, p.z) - 170, '불 굴', { col: ['#ffffff', '#7dffa0'], size: 34, life: 70 }));
    FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 280, 26, { col: '130,255,170', w: 14 }));
    FX.add('world', new Pillar(p.x, p.y, 60, 360, 30, '130,255,170', '230,255,240'));
    Sfx.play('clear', 0.8, 0.9); Game.flashScreen(0.3, '200,255,210'); Game.slowmo(0.4, 30);
    return true;
  },
};

// 극의 : 다른 스킬 쿨타임이 2배 빨리 돈다
class WZen {
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

// ============================================================
//  스킬 트리 화면
// ============================================================
const TreeUI = {
  sel: 'b_edge', msg: '', msgT: 0, msgCol: '#fff', resetArm: 0, t: 0,
  GX: 160, GS: 118, TY: [0, 262, 372, 482, 592], NS: 62,
  // 연출 상태
  fx: [], motes: [], pulses: [], learnT: {}, cursor: null, shake: 0, sweep: null, prevOpen: [], panelT: 1, lastSel: null, hover: null, deny: null, flashA: 0,
  nodeXY(n) { return [this.GX + n.col * this.GS, this.TY[n.tier]]; },
  nodeRect(n) { const [x, y] = this.nodeXY(n); return { x: x - this.NS / 2, y: y - this.NS / 2, w: this.NS, h: this.NS }; },
  backRect() { return { x: W - 220, y: 30, w: 180, h: 34 }; },
  learnRect() { return { x: 952, y: 548, w: 288, h: 54 }; },
  resetRect() { return { x: 952, y: 616, w: 288, h: 34 }; },
  prevOf(n) { return n.tier > 1 ? TREE.find(o => o.col === n.col && o.tier === n.tier - 1) : null; },
  nextOf(n) { return n.tier < 4 ? TREE.find(o => o.col === n.col && o.tier === n.tier + 1) : null; },
  colAct(ci) { let s = 0, m = 0; for (const n of TREE) if (n.col === ci) { s += Prog.r(n.id); m += n.max; } return m ? s / m : 0; },

  enter() {
    this.msgT = 0; this.resetArm = 0; this.t = 0; this.shake = 0; this.flashA = 0;
    this.fx.length = 0; this.pulses.length = 0; this.learnT = {}; this.sweep = null; this.hover = null; this.deny = null;
    if (!TREE_BY_ID[this.sel]) this.sel = 'b_edge';
    this.syncOpen(); this.lastSel = this.sel; this.panelT = 1;
    const [x, y] = this.nodeXY(this.cur()); this.cursor = { x, y };
    this.motes = []; for (let i = 0; i < 56; i++) this.motes.push(this.newMote(true));
  },
  leave() { Save.save(); Sfx.play('select', 0.7); Game.toLobby(); },
  flash(t, c) { this.msg = t; this.msgCol = c || '#fff'; this.msgT = 120; },
  cur() { return TREE_BY_ID[this.sel]; },
  syncOpen() { for (let tr = 1; tr <= 4; tr++) this.prevOpen[tr] = Prog.spent() >= TIER_GATE[tr]; },
  // 갈래를 따라 위로 떠오르는 빛 알갱이
  newMote(init) { const col = (Math.random() * TREE_COLS.length) | 0; return { col, x: this.GX + col * this.GS + rand(-46, 46), y: init ? rand(210, 690) : rand(680, 700), vy: rand(-0.55, -0.15), ph: rand(0, TAU), r: rand(2.5, 5) }; },

  move(dc, dt) {
    const n = this.cur(), col = clamp(n.col + dc, 0, TREE_COLS.length - 1), tier = clamp(n.tier + dt, 1, 4);
    const m = TREE.find(o => o.col === col && o.tier === tier);
    if (m && m.id !== this.sel) { this.sel = m.id; this.resetArm = 0; Sfx.play('ui', 0.4, 1.2); }
  },
  tryLearn() {
    const n = this.cur(), c = Prog.check(n);
    if (!c.ok) { Sfx.play('ui', 0.6, 0.5); this.flash(c.why, '#ff8a70'); this.deny = { id: n.id, t: 0 }; return; }
    Prog.learn(n);
    const r = Prog.r(n.id), master = r >= n.max, col = TREE_COLS[n.col].col;
    this.burst(n, r, master);
    Sfx.play('ring', 0.8, 1.2 + r * 0.05); Sfx.play('clear', 0.35, 1.7);
    if (master || n.key) Sfx.play('combo', 0.7, n.key ? 0.9 : 1.2);
    // 새 단계가 열렸는가
    for (let tr = 2; tr <= 4; tr++) if (Prog.spent() >= TIER_GATE[tr] && !this.prevOpen[tr]) this.openTier(tr);
    this.syncOpen();
    this.flash(master ? `「${n.name}」 마스터!` : `「${n.name}」 ${r} / ${n.max}`, n.key ? '#ffd24a' : `rgb(${col})`);
  },
  tryReset() {
    const c = Prog.resetCost();
    if (!Prog.spent()) { this.flash('되돌릴 포인트가 없습니다', '#9aa4c0'); return; }
    if (this.resetArm <= 0) { this.resetArm = 180; Sfx.play('ui', 0.8, 0.8); this.flash(`한 번 더 누르면 ${fmt(c)} G를 내고 초기화합니다`, '#ffb070'); return; }
    const lit = TREE.filter(n => Prog.r(n.id) > 0);
    if (!Prog.reset()) { Sfx.play('ui', 0.8, 0.5); this.flash('골드가 부족합니다', '#ff8a70'); this.resetArm = 0; return; }
    this.resetArm = 0; Sfx.play('coin', 1, 0.8); Sfx.play('dash', 0.6, 0.7); this.flash('스킬 트리를 초기화했습니다', '#7dffa0');
    // 배운 노드가 흩어져 사라진다
    lit.forEach((n, k) => {
      const [x, y] = this.nodeXY(n), col = TREE_COLS[n.col].col;
      this.fx.push({ k: 'ring', x, y, r0: 20, r1: 70, t: -k * 2, life: 22, col, w: 5 });
      for (let i = 0; i < 12; i++) { const a = rand(0, TAU), s = rand(1.5, 5); this.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, g: 0.12, t: -k * 2, life: rand(24, 40), col: chance(0.5) ? col : '170,180,210', r: rand(3, 6) }); }
    });
    this.shake = 9; this.flashA = 0.15; this.sweep = null; this.pulses.length = 0; this.syncOpen();
  },

  // 배울 때의 폭발 연출
  burst(n, r, master) {
    const [x, y] = this.nodeXY(n), col = TREE_COLS[n.col].col, gold = '255,214,100', big = master || n.key, S = this.NS;
    this.learnT[n.id] = this.t; this.shake = big ? 11 : 5; this.flashA = big ? 0.2 : 0.07;
    this.fx.push({ k: 'ring', x, y, r0: S * 0.4, r1: big ? 190 : 118, t: 0, life: big ? 34 : 24, col: big ? gold : col, w: big ? 10 : 7 });
    this.fx.push({ k: 'ring', x, y, r0: S * 0.3, r1: big ? 130 : 80, t: 0, life: 20, col: '255,255,255', w: 4 });
    if (big) {
      this.fx.push({ k: 'ring', x, y, r0: 10, r1: 270, t: -7, life: 44, col, w: 5 });
      this.fx.push({ k: 'ray', x, y, t: 0, life: 46, col: master ? gold : col, n: 16 });
    }
    const cnt = big ? 80 : 34;
    for (let i = 0; i < cnt; i++) {
      const a = rand(0, TAU), s = rand(2, big ? 10 : 7);
      this.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.1, t: 0, life: rand(26, big ? 60 : 42), col: choose(big ? [col, gold, '255,255,255'] : [col, col, '255,255,255']), r: rand(3, 6.5) });
    }
    const str = master ? 'MASTER!' : n.key && r === 1 ? '핵심 기술 습득!' : `${r} / ${n.max}`;
    this.fx.push({ k: 'text', x, y: y - 46, t: 0, life: 60, str, col: master ? gold : col, size: big ? 26 : 20 });
    // 위 단계로 이어지는 빛
    const nx = this.nextOf(n);
    if (nx && r === 1) { const [x2, y2] = this.nodeXY(nx); this.pulses.push({ x0: x, y0: y + S / 2, x1: x2, y1: y2 - S / 2, t: 0, life: 22, col, to: [x2, y2] }); }
  },
  openTier(tr) {
    this.sweep = { tier: tr, t: 0, life: 70 };
    Sfx.play('clear', 0.5, 1.35);
    for (const n of TREE) if (n.tier === tr) { const [x, y] = this.nodeXY(n); this.fx.push({ k: 'ring', x, y, r0: 10, r1: 60, t: -8 - n.col * 3, life: 22, col: TREE_COLS[n.col].col, w: 4 }); }
  },

  update() {
    this.t++;
    if (this.msgT > 0) this.msgT--;
    if (this.resetArm > 0) this.resetArm--;
    if (Input.take('pause')) { this.leave(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'left') this.move(-1, 0);
      else if (q.a === 'right') this.move(1, 0);
      else if (q.a === 'up') this.move(0, -1);
      else if (q.a === 'down') this.move(0, 1);
      else if (q.a === 'confirm' || q.a === 'jump') this.tryLearn();
      else if (q.a === 'tree' || q.a === 'back') { this.leave(); return; }
    }
    if (this.lastSel !== this.sel) { this.lastSel = this.sel; this.panelT = 0; }
    if (this.panelT < 1) this.panelT = Math.min(1, this.panelT + 0.08);
    const [tx, ty] = this.nodeXY(this.cur()), k = this.cursor || (this.cursor = { x: tx, y: ty });
    k.x = lerp(k.x, tx, 0.3); k.y = lerp(k.y, ty, 0.3);
    this.shake *= 0.86; if (this.shake < 0.2) this.shake = 0;
    this.flashA *= 0.88;
    if (this.deny && ++this.deny.t > 18) this.deny = null;
    // 마우스를 올린 노드
    this.hover = null;
    if (!Touch.on && performance.now() - Ptr.last < 2500) for (const n of TREE) if (inR(Ptr.x, Ptr.y, this.nodeRect(n))) { this.hover = n.id; break; }
    for (const m of this.motes) { m.y += m.vy; m.x += Math.sin(this.t * 0.02 + m.ph) * 0.25; if (m.y < 206) Object.assign(m, this.newMote(false)); }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]; f.t++;
      if (f.k === 'spark' && f.t > 0) { f.x += f.vx; f.y += f.vy; f.vx *= 0.92; f.vy = f.vy * 0.92 + f.g; }
      if (f.t >= f.life) this.fx.splice(i, 1);
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      if (++p.t >= p.life) { this.pulses.splice(i, 1); this.fx.push({ k: 'ring', x: p.to[0], y: p.to[1], r0: 14, r1: 64, t: 0, life: 20, col: p.col, w: 5 }); }
    }
    if (this.sweep && ++this.sweep.t > this.sweep.life) this.sweep = null;
  },
  pDown(x, y) {
    if (inR(x, y, this.backRect())) { this.leave(); return; }
    if (inR(x, y, this.learnRect())) { this.tryLearn(); return; }
    if (inR(x, y, this.resetRect())) { this.tryReset(); return; }
    for (const n of TREE) if (inR(x, y, this.nodeRect(n))) {
      if (this.sel === n.id) this.tryLearn();                                 // 이미 고른 노드를 한 번 더 누르면 배운다
      else { this.sel = n.id; this.resetArm = 0; Sfx.play('ui', 0.5, 1.2); }
      return;
    }
  },

  // ---------- 그리기 ----------
  draw(ctx) {
    scrim(ctx);
    const t = this.t, L = Prog.lv(), free = Prog.free();
    // 별빛 (세 겹, 깜빡임)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 80; i++) {
      const sp = 0.1 + (i % 3) * 0.12, x = (i * 157 + t * sp) % W, y = (i * 89) % 600 + 100, tw = 0.5 + 0.5 * Math.sin(t * 0.05 + i * 1.7), big = i % 9 === 0;
      ctx.fillStyle = `rgba(200,215,255,${(0.05 + (i % 5) * 0.025) * (0.4 + tw)})`; ctx.fillRect(x, y, big ? 3 : 2, big ? 3 : 2);
    }
    ctx.restore();
    UI.text(ctx, '스 킬  트 리', 40, 48, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '레벨을 올려 얻은 포인트로 기술을 배운다', 40, 76, { size: 14, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    // 레벨 · 경험치 (빛이 훑고 지나간다)
    const bx = 330, by = 42, bw = 420;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, bx + 30, by + 6, 46, '255,210,120', 0.18 + Math.sin(t * 0.06) * 0.06); ctx.restore();
    UI.text(ctx, `Lv.${L}`, bx, by + 6, { size: 26, fill: '#ffd87a', stroke: 4 });
    const need = Prog.need(L), u = L >= Prog.MAXLV ? 1 : Prog.xp() / need, fw = Math.max(14, (bw - 80) * u);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, bx + 80, by - 2, bw - 80, 14, 7); ctx.fill();
    const g = ctx.createLinearGradient(bx + 80, 0, bx + bw, 0); g.addColorStop(0, '#7a5aff'); g.addColorStop(1, '#ff7ad8');
    ctx.fillStyle = g; roundRect(ctx, bx + 80, by - 2, fw, 14, 7); ctx.fill();
    ctx.save(); roundRect(ctx, bx + 80, by - 2, fw, 14, 7); ctx.clip();
    const shx = bx + 80 + ((t * 4) % (fw + 160)) - 80, sg = ctx.createLinearGradient(shx - 40, 0, shx + 40, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(shx - 40, by - 2, 80, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(bx + 80, by - 1, fw, 4);
    ctx.restore();
    UI.text(ctx, L >= Prog.MAXLV ? 'MAX' : `EXP ${fmt(Prog.xp())} / ${fmt(need)}`, bx + bw, by + 30, { size: 13, align: 'right', font: FONT_B, weight: 700, fill: '#b8c0dc', stroke: 3 });
    // 남은 포인트
    const pr = { x: 790, y: 26, w: 190, h: 50 }, glow = free > 0 ? 0.5 + Math.sin(t * 0.12) * 0.3 : 0;
    if (free > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, pr.x + pr.w / 2, pr.y + pr.h / 2, 120, '255,200,80', 0.2 + glow * 0.15, 1.2, 0.5); ctx.restore(); }
    ctx.fillStyle = free > 0 ? 'rgba(70,52,14,0.95)' : 'rgba(20,24,36,0.9)'; roundRect(ctx, pr.x, pr.y, pr.w, pr.h, 12); ctx.fill();
    ctx.strokeStyle = free > 0 ? `rgba(255,210,74,${0.6 + glow * 0.4})` : 'rgba(150,160,190,0.4)'; ctx.lineWidth = 2.4; ctx.stroke();
    UI.text(ctx, '스킬 포인트', pr.x + 16, pr.y + 25, { size: 14, font: FONT_B, weight: 700, fill: '#c9b48a', stroke: 3 });
    UI.text(ctx, `${free}`, pr.x + pr.w - 18, pr.y + 26, { size: 30, align: 'right', fill: free > 0 ? '#ffe070' : '#7a84a4', stroke: 4 });
    // 돌아가기
    const br = this.backRect();
    ctx.fillStyle = 'rgba(30,24,14,0.9)'; roundRect(ctx, br.x, br.y, br.w, br.h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, Touch.on ? '돌아가기' : `돌아가기  [${Input.padActive ? 'B' : 'Esc'}]`, br.x + br.w / 2, br.y + 18, { size: 15, align: 'center', fill: '#ffe9a6', stroke: 3 });

    // ===== 트리 판 =====
    Shop.panel(ctx, 30, 104, 892, 590);
    ctx.save();
    roundRect(ctx, 31, 105, 890, 588, 12); ctx.clip();
    if (this.shake) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake * 0.7);
    const acts = TREE_COLS.map((_, i) => this.colAct(i));
    // 갈래마다 은은한 성운 + 세로 기둥
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    TREE_COLS.forEach((c, i) => {
      const x = this.GX + i * this.GS, a = acts[i];
      drawGlow(ctx, x, 430, 300, c.col, 0.05 + a * 0.16 + Math.sin(t * 0.03 + i) * 0.015, 0.26, 1);
      const sg2 = ctx.createLinearGradient(0, 200, 0, 660); sg2.addColorStop(0, `rgba(${c.col},${0.05 + a * 0.3})`); sg2.addColorStop(1, `rgba(${c.col},0)`);
      ctx.fillStyle = sg2; ctx.fillRect(x - 1, 200, 2, 460);
    });
    // 떠오르는 빛 알갱이
    for (const m of this.motes) {
      const a = acts[m.col], fade = Math.min(1, (690 - m.y) / 60, (m.y - 206) / 60);
      drawGlow(ctx, m.x, m.y, m.r * (1 + a), TREE_COLS[m.col].col, (0.12 + a * 0.55) * fade * (0.6 + 0.4 * Math.sin(t * 0.08 + m.ph)));
    }
    ctx.restore();
    this.drawTiers(ctx);
    this.drawHeads(ctx, acts);
    this.drawLinks(ctx);
    for (const n of TREE) this.drawNode(ctx, n);
    this.drawCursor(ctx);
    this.drawFx(ctx);
    ctx.restore();
    if (this.flashA > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,236,190,${this.flashA})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }

    this.drawDetail(ctx);
    if (this.msgT > 0) { ctx.globalAlpha = Math.min(1, this.msgT / 20); UI.text(ctx, this.msg, 476, 708, { size: 18, align: 'center', fill: this.msgCol, stroke: 4 }); ctx.globalAlpha = 1; }
    else UI.text(ctx, Touch.on ? '노드를 탭해 고르고, 한 번 더 탭하면 배웁니다' : Input.padActive ? '방향으로 고르기   A 배우기   B 돌아가기' : '방향키로 고르기   Enter 배우기   Esc 돌아가기   (마우스 클릭 가능)', 476, 708, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    ctx.drawImage(UI.vignette, 0, 0);
  },

  // 단계 줄 : 열린 단계는 띠가 밝고, 닫힌 단계는 필요한 포인트를 보여 준다
  drawTiers(ctx) {
    const sp = Prog.spent(), t = this.t;
    for (let tr = 1; tr <= 4; tr++) {
      const y = this.TY[tr], gate = TIER_GATE[tr], open = sp >= gate;
      if (open) {
        const bg = ctx.createLinearGradient(100, 0, 910, 0); bg.addColorStop(0, 'rgba(255,220,150,0.06)'); bg.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = bg; ctx.fillRect(100, y - 48, 810, 96);
        ctx.fillStyle = 'rgba(255,210,120,0.55)'; ctx.fillRect(100, y - 30, 2, 60);
      }
      ctx.strokeStyle = open ? 'rgba(255,220,160,0.08)' : 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(910, y); ctx.stroke();
      UI.text(ctx, `${tr}단계`, 66, y - (gate && !open ? 10 : 0), { size: 15, align: 'center', fill: open ? '#ffe9a6' : '#6a7494', stroke: 3 });
      if (gate && !open) {
        UI.text(ctx, `${gate}P 필요`, 66, y + 10, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: '#ff8a70', stroke: 3 });
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, 44, y + 22, 44, 4, 2); ctx.fill();
        ctx.fillStyle = '#ff9a70'; roundRect(ctx, 44, y + 22, Math.max(4, 44 * sp / gate), 4, 2); ctx.fill();
      } else if (gate) UI.text(ctx, `${gate}P`, 66, y + 16, { size: 12, align: 'center', font: FONT_B, weight: 700, fill: '#9aa4c0', stroke: 3 });
    }
    // 새 단계가 열리는 순간 : 빛이 줄을 훑는다
    const s = this.sweep;
    if (s) {
      const u = s.t / s.life, y = this.TY[s.tier], x = 100 + 860 * Ease.out3(u);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const sg = ctx.createLinearGradient(x - 160, 0, x + 20, 0); sg.addColorStop(0, 'rgba(255,220,140,0)'); sg.addColorStop(1, `rgba(255,230,160,${0.45 * (1 - u)})`);
      ctx.fillStyle = sg; ctx.fillRect(x - 160, y - 46, 180, 92);
      drawGlow(ctx, x, y, 70, '255,230,160', 0.6 * (1 - u), 0.5, 1.2);
      ctx.restore();
      ctx.globalAlpha = Math.min(1, (1 - u) * 3);
      UI.text(ctx, `${s.tier}단계 개방!`, 505, y - 46 - Ease.out3(Math.min(1, u * 3)) * 8, { size: 20, align: 'center', fill: '#ffe070', stroke: 5 });
      ctx.globalAlpha = 1;
    }
    void t;
  },

  // 갈래 머리 : 진행도 막대 + 진행할수록 밝아지는 테두리
  drawHeads(ctx, acts) {
    const t = this.t;
    TREE_COLS.forEach((c, i) => {
      const x = this.GX + i * this.GS, y = 150, a = acts[i];
      if (a > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y + 6, 70, c.col, 0.1 + a * 0.25, 1, 0.8); ctx.restore(); }
      const hg = ctx.createLinearGradient(0, y - 30, 0, y + 48); hg.addColorStop(0, `rgba(${c.col},${0.1 + a * 0.18})`); hg.addColorStop(1, 'rgba(14,18,34,0.94)');
      ctx.fillStyle = 'rgba(14,18,34,0.94)'; roundRect(ctx, x - 52, y - 30, 104, 78, 12); ctx.fill();
      ctx.fillStyle = hg; roundRect(ctx, x - 52, y - 30, 104, 78, 12); ctx.fill();
      ctx.strokeStyle = `rgba(${c.col},${0.4 + a * 0.6})`; ctx.lineWidth = a >= 1 ? 2.4 : 1.6; ctx.stroke();
      const bob = Math.sin(t * 0.05 + i) * 1.5;
      if (c.icon && UI.icons[c.icon]) ctx.drawImage(UI.icons[c.icon], x - 18, y - 24 + bob, 36, 36);
      else { ctx.save(); ctx.translate(x - 18, y - 24 + bob); ctx.scale(0.75, 0.75); WS.glyph(ctx, c.g, c.col); ctx.restore(); }
      UI.text(ctx, c.name, x, y + 24, { size: c.name.length > 5 ? 13 : 15, align: 'center', fill: `rgb(${c.col})`, stroke: 3 });
      UI.text(ctx, c.sub, x, y + 39, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 2.5 });
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, x - 40, y + 52, 80, 4, 2); ctx.fill();
      if (a > 0) { ctx.fillStyle = a >= 1 ? '#ffd24a' : `rgb(${c.col})`; roundRect(ctx, x - 40, y + 52, Math.max(4, 80 * a), 4, 2); ctx.fill(); }
    });
  },

  // 연결선 : 배운 길은 빛이 흐르고, 다음에 배울 수 있는 길은 점선이 움직인다
  drawLinks(ctx) {
    const t = this.t, S = this.NS;
    for (const n of TREE) {
      const prev = this.prevOf(n); if (!prev) continue;
      const [x, y] = this.nodeXY(n), [, py] = this.nodeXY(prev), y1 = py + S / 2 + (prev.key ? 10 : 2), y2 = y - S / 2 - (n.key ? 8 : 0);
      const c = TREE_COLS[n.col].col, litP = Prog.r(prev.id) > 0, litN = Prog.r(n.id) > 0;
      ctx.save();
      if (litP && litN) {
        ctx.strokeStyle = `rgba(${c},0.3)`; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        ctx.strokeStyle = `rgb(${c})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { const u = (t * 0.018 + k / 3 + n.col * 0.13) % 1; drawGlow(ctx, x, lerp(y1, y2, u), 8, c, 0.9 * Math.sin(Math.PI * u)); }
      } else if (litP) {
        ctx.strokeStyle = `rgba(${c},0.25)`; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
        ctx.strokeStyle = `rgba(${c},${0.55 + Math.sin(t * 0.12) * 0.25})`; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 0.6;
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(120,130,160,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([4, 7]);
        ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      }
      ctx.restore();
    }
    // 배울 때 위 단계로 올라가는 빛
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const p of this.pulses) {
      const u = Ease.inOut(p.t / p.life);
      for (let k = 0; k < 4; k++) { const v = Math.max(0, u - k * 0.07); drawGlow(ctx, lerp(p.x0, p.x1, v), lerp(p.y0, p.y1, v), 16 - k * 3, k ? p.col : '255,255,255', 0.95 - k * 0.2); }
    }
    ctx.restore();
  },

  drawNode(ctx, n) {
    let [x, y] = this.nodeXY(n);
    const S = this.NS, r = Prog.r(n.id), c = TREE_COLS[n.col].col, chk = Prog.check(n), prev = this.prevOf(n), t = this.t;
    const open = !prev || Prog.r(prev.id) > 0, gated = Prog.spent() < TIER_GATE[n.tier], locked = !open || gated, max = r >= n.max, on = this.sel === n.id;
    const can = chk.ok, hov = this.hover === n.id && !on, pulse = 0.5 + Math.sin(t * 0.14 + n.col) * 0.5, gold = '255,214,100';
    const lt = t - (this.learnT[n.id] ?? -999);
    let sc = hov ? 1.06 : 1;
    if (lt >= 0 && lt < 28) { const u = lt / 28; sc *= 1 + 0.34 * Math.exp(-u * 5) * Math.cos(u * 14); }
    if (this.deny && this.deny.id === n.id) x += Math.sin(this.deny.t * 1.7) * 6 * (1 - this.deny.t / 18);
    ctx.save();
    ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
    const shape = (k = 0) => {
      if (n.key) { const R = S * 0.62 + k; ctx.beginPath(); ctx.moveTo(x, y - R); ctx.lineTo(x + R, y); ctx.lineTo(x, y + R); ctx.lineTo(x - R, y); ctx.closePath(); }
      else roundRect(ctx, x - S / 2 - k, y - S / 2 - k, S + k * 2, S + k * 2, 12 + k);
    };
    // 바깥 빛
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (max) drawGlow(ctx, x, y, S * 1.25, gold, 0.32 + pulse * 0.1);
    else if (r > 0) drawGlow(ctx, x, y, S * 1.05, c, n.key ? 0.4 : 0.24);
    if (can) drawGlow(ctx, x, y, S * 1.0, c, 0.16 + pulse * 0.22);
    ctx.restore();
    // 배울 수 있는 노드 : 둘레를 도는 점선 고리
    if (can) {
      ctx.save(); ctx.strokeStyle = `rgba(${c},${0.45 + pulse * 0.35})`; ctx.lineWidth = 2; ctx.setLineDash([7, 9]); ctx.lineDashOffset = -t * 0.5;
      ctx.beginPath(); ctx.arc(x, y, n.key ? S * 0.8 : S * 0.68, 0, TAU); ctx.stroke(); ctx.restore();
    }
    // 핵심 기술 : 천천히 도는 바깥 마름모
    if (n.key && !locked) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.01);
      ctx.strokeStyle = r > 0 ? `rgba(${max ? gold : c},0.55)` : 'rgba(150,160,190,0.3)'; ctx.lineWidth = 1.4;
      const R = S * 0.74; ctx.strokeRect(-R * 0.72, -R * 0.72, R * 1.44, R * 1.44); ctx.restore();
    }
    // 바탕
    const bg = ctx.createLinearGradient(0, y - S / 2, 0, y + S / 2);
    if (r > 0) { bg.addColorStop(0, `rgba(${max ? gold : c},0.6)`); bg.addColorStop(0.55, `rgba(${c},0.22)`); bg.addColorStop(1, 'rgba(14,16,30,0.96)'); }
    else { bg.addColorStop(0, locked ? 'rgba(26,28,38,0.95)' : 'rgba(30,36,60,0.95)'); bg.addColorStop(1, 'rgba(10,12,22,0.95)'); }
    shape(); ctx.fillStyle = bg; ctx.fill();
    // 배운 노드 : 빛이 대각선으로 훑고 지나간다
    if (r > 0) {
      const k = ((t * 0.9 + n.col * 41 + n.tier * 23) % 240) / 240;
      if (k < 0.3) {
        ctx.save(); shape(); ctx.clip();
        const sx = x - S + (k / 0.3) * S * 2, sg = ctx.createLinearGradient(sx - 18, y - S / 2, sx + 18, y + S / 2);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.32)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg; ctx.fillRect(x - S, y - S, S * 2, S * 2); ctx.restore();
      }
    }
    // 테두리
    ctx.lineWidth = max ? 3 : 2;
    ctx.strokeStyle = max ? '#ffd24a' : r > 0 ? `rgb(${c})` : can ? `rgba(${c},${0.5 + pulse * 0.5})` : hov ? 'rgba(200,210,240,0.7)' : 'rgba(120,130,160,0.4)';
    shape(); ctx.stroke();
    if (max) { ctx.strokeStyle = 'rgba(255,240,190,0.55)'; ctx.lineWidth = 1; shape(-4); ctx.stroke(); }
    // 아이콘
    if (r > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, 30, max ? gold : c, 0.3); ctx.restore(); }
    ctx.save(); ctx.translate(x - 24 * 0.8, y - 24 * 0.8); ctx.scale(0.8, 0.8); ctx.globalAlpha = locked ? 0.3 : r > 0 ? 1 : 0.75;
    try { WS.glyph(ctx, n.g, locked ? '150,155,175' : c); } catch (e) { }
    ctx.restore();
    // 막 배운 순간 : 하얗게 번쩍
    if (lt >= 0 && lt < 12) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; shape(); ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - lt / 12)})`; ctx.fill(); ctx.restore(); }
    // 주위를 도는 빛 (핵심 기술 / 마스터)
    if ((n.key && (r > 0 || can)) || (max && !n.key)) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const cnt = n.key ? 3 : 2, R = n.key ? S * 0.8 : S * 0.7;
      for (let i = 0; i < cnt; i++) { const a = t * 0.045 + i * TAU / cnt; drawGlow(ctx, x + Math.cos(a) * R, y + Math.sin(a) * R * 0.92, 6, max ? gold : c, r > 0 ? 0.95 : 0.45); }
      ctx.restore();
    }
    // 잠금 자물쇠
    if (locked) {
      ctx.fillStyle = 'rgba(8,8,14,0.85)'; roundRect(ctx, x + S / 2 - 22, y + S / 2 - 22, 18, 16, 3); ctx.fill();
      ctx.strokeStyle = '#8a94b4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + S / 2 - 13, y + S / 2 - 22, 5, Math.PI, 0); ctx.stroke();
    }
    // 배울 수 있음 : 오른쪽 위 + 표시
    if (can) {
      const bx = x + (n.key ? S * 0.42 : S / 2 - 3), by = y - (n.key ? S * 0.42 : S / 2 - 3), s2 = 1 + pulse * 0.15;
      ctx.save(); ctx.translate(bx, by); ctx.scale(s2, s2);
      ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#10131e'; ctx.fillRect(-4.5, -1.2, 9, 2.4); ctx.fillRect(-1.2, -4.5, 2.4, 9);
      ctx.restore();
    }
    // 랭크 눈금
    const pw = 9, gap = 3, tw = n.max * pw + (n.max - 1) * gap;
    for (let i = 0; i < n.max; i++) {
      const px = x - tw / 2 + i * (pw + gap), py = y + S / 2 + (n.key ? 14 : 8), fill = i < r;
      if (fill) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, px + pw / 2, py + 2.5, 8, max ? gold : c, 0.4); ctx.restore(); }
      ctx.fillStyle = fill ? (max ? '#ffd24a' : `rgb(${c})`) : 'rgba(255,255,255,0.14)'; roundRect(ctx, px, py, pw, 5, 2.5); ctx.fill();
    }
    ctx.restore();
  },

  // 선택 표시 : 네 모서리 괄호가 부드럽게 따라온다
  drawCursor(ctx) {
    const n = this.cur(), c = TREE_COLS[n.col].col, S = this.NS, k = this.cursor, t = this.t;
    if (!k) return;
    const half = (n.key ? S * 0.66 : S * 0.5) + 8 + Math.sin(t * 0.12) * 2, L = 13;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, k.x, k.y, S * 1.1, c, 0.18 + 0.07 * Math.sin(t * 0.1)); ctx.restore();
    const u = (t % 80) / 80;
    ctx.save(); ctx.strokeStyle = `rgba(${c},${0.45 * (1 - u)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(k.x, k.y, S * 0.55 + u * 48, 0, TAU); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.shadowColor = `rgb(${c})`; ctx.shadowBlur = 10;
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const cx = k.x + dx * half, cy = k.y + dy * half;
      ctx.beginPath(); ctx.moveTo(cx - dx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy - dy * L); ctx.stroke();
    }
    ctx.restore();
  },

  drawFx(ctx) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const f of this.fx) {
      if (f.t < 0 || f.k === 'text') continue;
      const u = f.t / f.life;
      if (f.k === 'ring') {
        ctx.strokeStyle = `rgba(${f.col},${0.9 * (1 - u)})`; ctx.lineWidth = f.w * (1 - u) + 1;
        ctx.beginPath(); ctx.arc(f.x, f.y, lerp(f.r0, f.r1, Ease.out3(u)), 0, TAU); ctx.stroke();
      } else if (f.k === 'spark') drawGlow(ctx, f.x, f.y, f.r * (1 - u) + 2, f.col, 0.95 * (1 - u * 0.6));
      else if (f.k === 'ray') {
        const len = 40 + 200 * Ease.out3(u);
        ctx.fillStyle = `rgba(${f.col},${0.3 * (1 - u)})`;
        for (let i = 0; i < f.n; i++) {
          const a = i * TAU / f.n + f.t * 0.02, w = i % 2 ? 0.03 : 0.06, l2 = len * (i % 2 ? 0.7 : 1);
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + Math.cos(a - w) * l2, f.y + Math.sin(a - w) * l2); ctx.lineTo(f.x + Math.cos(a + w) * l2, f.y + Math.sin(a + w) * l2); ctx.closePath(); ctx.fill();
        }
      }
    }
    ctx.restore();
    for (const f of this.fx) {
      if (f.k !== 'text' || f.t < 0) continue;
      const u = f.t / f.life, s = f.t < 8 ? lerp(1.6, 1, Ease.out3(f.t / 8)) : 1;
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - u) * 3);
      ctx.translate(f.x, f.y - 40 * Ease.out3(u)); ctx.scale(s, s);
      UI.text(ctx, f.str, 0, 0, { size: f.size, align: 'center', italic: true, fill: `rgb(${f.col})`, stroke: 5 });
      ctx.restore();
    }
  },

  drawDetail(ctx) {
    const n = this.cur(), c = TREE_COLS[n.col], r = Prog.r(n.id), chk = Prog.check(n), x0 = 936, y0 = 104, w = 314, h = 590, t = this.t;
    const max = r >= n.max, gold = '255,214,100', pa = Ease.out3(this.panelT);
    Shop.panel(ctx, x0, y0, w, h, true);
    // 위쪽에 갈래 색 띠
    const tg = ctx.createLinearGradient(0, y0, 0, y0 + 200); tg.addColorStop(0, `rgba(${c.col},0.16)`); tg.addColorStop(1, `rgba(${c.col},0)`);
    ctx.save(); roundRect(ctx, x0 + 1, y0 + 1, w - 2, 200, 12); ctx.clip(); ctx.fillStyle = tg; ctx.fillRect(x0, y0, w, 200); ctx.restore();
    ctx.save(); ctx.globalAlpha = pa; ctx.translate(0, (1 - pa) * 10);
    UI.text(ctx, `${c.name} · ${n.tier}단계${n.key ? '  핵심 기술' : ''}`, x0 + 16, y0 + 30, { size: 13, font: FONT_B, weight: 700, fill: `rgb(${c.col})`, stroke: 3 });
    UI.text(ctx, n.name, x0 + 16, y0 + 66, { size: 28, fill: n.key ? '#ffe070' : '#ffffff', stroke: 5 });
    UI.text(ctx, `${r} / ${n.max}`, x0 + w - 18, y0 + 66, { size: 22, align: 'right', fill: max ? '#ffd24a' : '#b8c0dc', stroke: 4 });
    // 큰 아이콘 : 빛무리 + 도는 고리
    const cx = x0 + w / 2, cy = y0 + 140, ac = max ? gold : c.col;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, cx, cy, 110, ac, (r > 0 ? 0.32 : 0.14) + Math.sin(t * 0.08) * 0.06);
    ctx.restore();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.012);
    ctx.strokeStyle = `rgba(${ac},${r > 0 ? 0.55 : 0.25})`; ctx.lineWidth = 1.6; ctx.setLineDash([3, 7]);
    ctx.beginPath(); ctx.arc(0, 0, 66, 0, TAU); ctx.stroke();
    ctx.rotate(-t * 0.03); ctx.setLineDash([18, 10]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.stroke();
    ctx.restore();
    if (n.key || max) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const a = t * 0.035 + i * TAU / 4; drawGlow(ctx, cx + Math.cos(a) * 66, cy + Math.sin(a) * 66, 7, ac, r > 0 ? 0.9 : 0.4); }
      ctx.restore();
    }
    ctx.save(); ctx.translate(cx - 48, cy - 48 + Math.sin(t * 0.05) * 2); ctx.scale(2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, 0, 0, 48, 48, 10); ctx.fill();
    ctx.globalAlpha *= r > 0 ? 1 : 0.8;
    WS.glyph(ctx, n.g, c.col); ctx.restore();
    // 랭크 눈금 (크게)
    const pw = 22, gap = 6, tw = n.max * pw + (n.max - 1) * gap;
    for (let i = 0; i < n.max; i++) {
      const px = cx - tw / 2 + i * (pw + gap), py = y0 + 200, f = i < r;
      if (f) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, px + pw / 2, py + 3, 16, ac, 0.35); ctx.restore(); }
      ctx.fillStyle = f ? (max ? '#ffd24a' : `rgb(${c.col})`) : 'rgba(255,255,255,0.12)'; roundRect(ctx, px, py, pw, 6, 3); ctx.fill();
    }
    let y = y0 + 236;
    const line = (label, txt, col) => {
      UI.text(ctx, label, x0 + 16, y, { size: 13, font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 3 }); y += 22;
      for (const ln of Shop.wrap(ctx, txt, w - 32, 15)) { UI.text(ctx, ln, x0 + 16, y, { size: 15, font: FONT_B, weight: 700, fill: col, stroke: 3 }); y += 22; }
      y += 10;
    };
    if (n.max > 1) {
      line('현재', r > 0 ? n.v(r) : '아직 배우지 않음', r > 0 ? '#dfe4f6' : '#6a7494');
      if (r < n.max) line('다음 랭크', n.v(r + 1), '#7dffa0');
    } else line(r > 0 ? '습득함' : '효과', n.v(1), r > 0 ? '#ffe9a6' : '#dfe4f6');
    if (!chk.ok && r < n.max) line('조건', chk.why, '#ff9a88');
    ctx.restore();
    // 배우기 버튼
    const lr = this.learnRect(), ok = chk.ok, pulse = 0.5 + Math.sin(t * 0.12) * 0.5;
    if (ok) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, lr.x + lr.w / 2, lr.y + lr.h / 2, 160, '255,200,80', 0.14 + pulse * 0.12, 1, 0.35); ctx.restore(); }
    ctx.fillStyle = ok ? 'rgba(90,70,20,0.95)' : 'rgba(30,32,44,0.9)'; roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.fill();
    if (ok) {
      ctx.save(); roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.clip();
      const sx = lr.x - 60 + ((t * 3) % (lr.w + 120)), sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
      sg.addColorStop(0, 'rgba(255,240,190,0)'); sg.addColorStop(0.5, 'rgba(255,240,190,0.22)'); sg.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = sg; ctx.fillRect(sx - 30, lr.y, 60, lr.h); ctx.restore();
    }
    ctx.strokeStyle = ok ? `rgba(255,210,74,${0.7 + pulse * 0.3})` : max ? '#7dffa0' : '#6a6a7a'; ctx.lineWidth = 2.6; roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.stroke();
    UI.text(ctx, max ? '최대 랭크' : ok ? '배우기  (1 포인트)' : '배울 수 없음', lr.x + lr.w / 2, lr.y + lr.h / 2 + 1, { size: 20, align: 'center', fill: ok ? '#fff' : max ? '#7dffa0' : '#9a9aaa', stroke: 4 });
    // 초기화
    const rr = this.resetRect(), armed = this.resetArm > 0;
    ctx.fillStyle = armed ? 'rgba(110,30,26,0.95)' : 'rgba(26,20,20,0.9)'; roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 9); ctx.fill();
    ctx.strokeStyle = armed ? '#ff8a70' : 'rgba(255,140,120,0.45)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, armed ? `정말 초기화?  ${fmt(Prog.resetCost())} G` : `트리 초기화  (${fmt(Prog.resetCost())} G)`, rr.x + rr.w / 2, rr.y + 18, { size: 14, align: 'center', fill: '#ffc0b0', stroke: 3 });
    UI.text(ctx, `사용한 포인트 ${Prog.spent()}  ·  레벨 보너스 공격력 · HP +${pct(0.006 * (Prog.lv() - 1))}`, x0 + w / 2, y0 + h - 4 + 20, { size: 11.5, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
  },
};
