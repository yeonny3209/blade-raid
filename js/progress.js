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
    Game.notice(`스킬 포인트 +${sp}  (로비의 [스킬 트리]에서 배울 수 있어요)`);
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
  sel: 'b_edge', msg: '', msgT: 0, msgCol: '#fff', resetArm: 0, sparks: [], t: 0,
  GX: 160, GS: 118, TY: [0, 262, 372, 482, 592], NS: 62,
  nodeXY(n) { return [this.GX + n.col * this.GS, this.TY[n.tier]]; },
  nodeRect(n) { const [x, y] = this.nodeXY(n); return { x: x - this.NS / 2, y: y - this.NS / 2, w: this.NS, h: this.NS }; },
  backRect() { return { x: W - 220, y: 30, w: 180, h: 34 }; },
  learnRect() { return { x: 952, y: 548, w: 288, h: 54 }; },
  resetRect() { return { x: 952, y: 616, w: 288, h: 34 }; },

  enter() { this.msgT = 0; this.resetArm = 0; this.sparks.length = 0; this.t = 0; if (!TREE_BY_ID[this.sel]) this.sel = 'b_edge'; },
  leave() { Save.save(); Sfx.play('select', 0.7); Game.toLobby(); },
  flash(t, c) { this.msg = t; this.msgCol = c || '#fff'; this.msgT = 120; },
  cur() { return TREE_BY_ID[this.sel]; },
  move(dc, dt) {
    const n = this.cur(), col = clamp(n.col + dc, 0, TREE_COLS.length - 1), tier = clamp(n.tier + dt, 1, 4);
    const m = TREE.find(o => o.col === col && o.tier === tier);
    if (m && m.id !== this.sel) { this.sel = m.id; this.resetArm = 0; Sfx.play('ui', 0.4, 1.2); }
  },
  tryLearn() {
    const n = this.cur(), c = Prog.check(n);
    if (!c.ok) { Sfx.play('ui', 0.6, 0.5); this.flash(c.why, '#ff8a70'); return; }
    Prog.learn(n);
    const [x, y] = this.nodeXY(n), col = TREE_COLS[n.col].col;
    for (let i = 0; i < 26; i++) { const a = rand(0, TAU), s = rand(2, 7); this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rand(24, 40), col }); }
    Sfx.play('ring', 0.8, 1.2 + Prog.r(n.id) * 0.05); Sfx.play('clear', 0.35, 1.7);
    this.flash(Prog.r(n.id) >= n.max ? `「${n.name}」 마스터!` : `「${n.name}」 ${Prog.r(n.id)} / ${n.max}`, n.key ? '#ffd24a' : `rgb(${col})`);
  },
  tryReset() {
    const c = Prog.resetCost();
    if (!Prog.spent()) { this.flash('되돌릴 포인트가 없습니다', '#9aa4c0'); return; }
    if (this.resetArm <= 0) { this.resetArm = 180; Sfx.play('ui', 0.8, 0.8); this.flash(`한 번 더 누르면 ${fmt(c)} G를 내고 초기화합니다`, '#ffb070'); return; }
    if (!Prog.reset()) { Sfx.play('ui', 0.8, 0.5); this.flash('골드가 부족합니다', '#ff8a70'); this.resetArm = 0; return; }
    this.resetArm = 0; Sfx.play('coin', 1, 0.8); this.flash('스킬 트리를 초기화했습니다', '#7dffa0');
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
    for (let i = this.sparks.length - 1; i >= 0; i--) { const s = this.sparks[i]; s.t++; s.x += s.vx; s.y += s.vy; s.vx *= 0.9; s.vy = s.vy * 0.9 + 0.08; if (s.t >= s.life) this.sparks.splice(i, 1); }
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
    // 은은한 별빛
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) { const x = (i * 157 + t * 0.15) % W, y = (i * 89) % 560 + 120; ctx.fillStyle = `rgba(200,210,255,${0.06 + (i % 5) * 0.025})`; ctx.fillRect(x, y, 2, 2); }
    ctx.restore();
    UI.text(ctx, '스 킬  트 리', 40, 48, { size: 30, fill: '#ffe9a6', stroke: 5 });
    UI.text(ctx, '레벨을 올려 얻은 포인트로 기술을 배운다', 40, 76, { size: 14, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    // 레벨 · 경험치
    const bx = 330, by = 42, bw = 420;
    UI.text(ctx, `Lv.${L}`, bx, by + 6, { size: 26, fill: '#ffd87a', stroke: 4 });
    const need = Prog.need(L), u = L >= Prog.MAXLV ? 1 : Prog.xp() / need;
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, bx + 80, by - 2, bw - 80, 14, 7); ctx.fill();
    const g = ctx.createLinearGradient(bx + 80, 0, bx + bw, 0); g.addColorStop(0, '#7a5aff'); g.addColorStop(1, '#ff7ad8');
    ctx.fillStyle = g; roundRect(ctx, bx + 80, by - 2, Math.max(14, (bw - 80) * u), 14, 7); ctx.fill();
    UI.text(ctx, L >= Prog.MAXLV ? 'MAX' : `EXP ${fmt(Prog.xp())} / ${fmt(need)}`, bx + bw, by + 30, { size: 13, align: 'right', font: FONT_B, weight: 700, fill: '#b8c0dc', stroke: 3 });
    // 남은 포인트
    const pr = { x: 790, y: 26, w: 190, h: 50 }, glow = free > 0 ? 0.5 + Math.sin(t * 0.12) * 0.3 : 0;
    ctx.fillStyle = free > 0 ? 'rgba(70,52,14,0.95)' : 'rgba(20,24,36,0.9)'; roundRect(ctx, pr.x, pr.y, pr.w, pr.h, 12); ctx.fill();
    ctx.strokeStyle = free > 0 ? `rgba(255,210,74,${0.6 + glow * 0.4})` : 'rgba(150,160,190,0.4)'; ctx.lineWidth = 2.4; ctx.stroke();
    UI.text(ctx, '스킬 포인트', pr.x + 16, pr.y + 25, { size: 14, font: FONT_B, weight: 700, fill: '#c9b48a', stroke: 3 });
    UI.text(ctx, `${free}`, pr.x + pr.w - 18, pr.y + 26, { size: 30, align: 'right', fill: free > 0 ? '#ffe070' : '#7a84a4', stroke: 4 });
    // 돌아가기
    const br = this.backRect();
    ctx.fillStyle = 'rgba(30,24,14,0.9)'; roundRect(ctx, br.x, br.y, br.w, br.h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,100,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, Touch.on ? '돌아가기' : '돌아가기  [Esc]', br.x + br.w / 2, br.y + 18, { size: 15, align: 'center', fill: '#ffe9a6', stroke: 3 });

    // 트리 판
    Shop.panel(ctx, 30, 104, 892, 590);
    // 단계 표시 (왼쪽)
    for (let tr = 1; tr <= 4; tr++) {
      const y = this.TY[tr], open = Prog.spent() >= TIER_GATE[tr];
      UI.text(ctx, `${tr}단계`, 66, y - 4, { size: 15, align: 'center', fill: open ? '#ffe9a6' : '#6a7494', stroke: 3 });
      if (TIER_GATE[tr]) UI.text(ctx, `${TIER_GATE[tr]}P`, 66, y + 16, { size: 12, align: 'center', font: FONT_B, weight: 700, fill: open ? '#9aa4c0' : '#ff8a70', stroke: 3 });
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(910, y); ctx.stroke();
    }
    // 갈래 머리
    TREE_COLS.forEach((c, i) => {
      const x = this.GX + i * this.GS, y = 150;
      ctx.fillStyle = 'rgba(14,18,34,0.92)'; roundRect(ctx, x - 52, y - 30, 104, 78, 12); ctx.fill();
      ctx.strokeStyle = `rgba(${c.col},0.55)`; ctx.lineWidth = 1.6; ctx.stroke();
      if (c.icon && UI.icons[c.icon]) ctx.drawImage(UI.icons[c.icon], x - 18, y - 24, 36, 36);
      else { ctx.save(); ctx.translate(x - 18, y - 24); ctx.scale(0.75, 0.75); WS.glyph(ctx, c.g, c.col); ctx.restore(); }
      UI.text(ctx, c.name, x, y + 26, { size: c.name.length > 5 ? 13 : 15, align: 'center', fill: `rgb(${c.col})`, stroke: 3 });
      UI.text(ctx, c.sub, x, y + 42, { size: 11, align: 'center', font: FONT_B, weight: 700, fill: '#8a94b4', stroke: 2.5 });
    });
    // 연결선
    for (const n of TREE) {
      if (n.tier === 1) continue;
      const prev = TREE.find(o => o.col === n.col && o.tier === n.tier - 1), [x, y] = this.nodeXY(n), [, py] = this.nodeXY(prev);
      const lit = Prog.r(prev.id) > 0, c = TREE_COLS[n.col].col;
      ctx.save();
      if (lit) { ctx.strokeStyle = `rgba(${c},0.35)`; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, py + this.NS / 2); ctx.lineTo(x, y - this.NS / 2); ctx.stroke(); }
      ctx.strokeStyle = lit ? `rgb(${c})` : 'rgba(120,130,160,0.35)'; ctx.lineWidth = lit ? 3 : 2; if (!lit) ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(x, py + this.NS / 2); ctx.lineTo(x, y - this.NS / 2); ctx.stroke();
      ctx.restore();
    }
    // 노드
    for (const n of TREE) this.drawNode(ctx, n);
    // 반짝이
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const s of this.sparks) drawGlow(ctx, s.x, s.y, 10 * (1 - s.t / s.life) + 3, s.col, 0.9);
    ctx.restore();
    this.drawDetail(ctx);
    if (this.msgT > 0) { ctx.globalAlpha = Math.min(1, this.msgT / 20); UI.text(ctx, this.msg, 476, 708, { size: 18, align: 'center', fill: this.msgCol, stroke: 4 }); ctx.globalAlpha = 1; }
    else UI.text(ctx, Touch.on ? '노드를 탭해 고르고, 한 번 더 탭하면 배웁니다' : '방향키로 고르기   Enter 배우기   Esc 돌아가기   (마우스 클릭 가능)', 476, 708, { size: 13, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
    ctx.drawImage(UI.vignette, 0, 0);
  },

  drawNode(ctx, n) {
    const [x, y] = this.nodeXY(n), S = this.NS, r = Prog.r(n.id), c = TREE_COLS[n.col].col, chk = Prog.check(n);
    const open = n.tier === 1 || Prog.r(TREE.find(o => o.col === n.col && o.tier === n.tier - 1).id) > 0;
    const gated = Prog.spent() < TIER_GATE[n.tier], locked = !open || gated, max = r >= n.max, on = this.sel === n.id;
    const can = chk.ok, pulse = 0.5 + Math.sin(this.t * 0.14 + n.col) * 0.5;
    ctx.save();
    if (max || (r > 0 && n.key)) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, S * 1.1, max ? '255,210,90' : c, 0.35); ctx.globalCompositeOperation = 'source-over'; }
    if (can) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, y, S * 0.95, c, 0.18 + pulse * 0.2); ctx.globalCompositeOperation = 'source-over'; }
    // 바탕 (핵심 기술은 마름모)
    const shape = () => { if (n.key) { ctx.beginPath(); ctx.moveTo(x, y - S * 0.62); ctx.lineTo(x + S * 0.62, y); ctx.lineTo(x, y + S * 0.62); ctx.lineTo(x - S * 0.62, y); ctx.closePath(); } else { roundRect(ctx, x - S / 2, y - S / 2, S, S, 12); } };
    const bg = ctx.createLinearGradient(0, y - S / 2, 0, y + S / 2);
    if (r > 0) { bg.addColorStop(0, `rgba(${c},0.55)`); bg.addColorStop(1, 'rgba(14,16,30,0.95)'); } else { bg.addColorStop(0, locked ? 'rgba(26,28,38,0.95)' : 'rgba(30,36,60,0.95)'); bg.addColorStop(1, 'rgba(10,12,22,0.95)'); }
    shape(); ctx.fillStyle = bg; ctx.fill();
    ctx.lineWidth = on ? 3.4 : max ? 3 : 2;
    ctx.strokeStyle = on ? '#ffffff' : max ? '#ffd24a' : r > 0 ? `rgb(${c})` : can ? `rgba(${c},${0.5 + pulse * 0.5})` : 'rgba(120,130,160,0.4)';
    shape(); ctx.stroke();
    // 아이콘
    ctx.save(); ctx.translate(x - 24 * 0.8, y - 24 * 0.8); ctx.scale(0.8, 0.8); ctx.globalAlpha = locked ? 0.35 : 1;
    try { WS.glyph(ctx, n.g, locked ? '150,155,175' : c); } catch (e) { }
    ctx.restore();
    // 잠금 자물쇠
    if (locked) {
      ctx.fillStyle = 'rgba(8,8,14,0.85)'; roundRect(ctx, x + S / 2 - 22, y + S / 2 - 22, 18, 16, 3); ctx.fill();
      ctx.strokeStyle = '#8a94b4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + S / 2 - 13, y + S / 2 - 22, 5, Math.PI, 0); ctx.stroke();
    }
    // 랭크 눈금
    const pw = 9, gap = 3, tw = n.max * pw + (n.max - 1) * gap;
    for (let i = 0; i < n.max; i++) {
      const px = x - tw / 2 + i * (pw + gap), py = y + S / 2 + (n.key ? 14 : 8);
      ctx.fillStyle = i < r ? (max ? '#ffd24a' : `rgb(${c})`) : 'rgba(255,255,255,0.14)'; roundRect(ctx, px, py, pw, 5, 2.5); ctx.fill();
    }
    ctx.restore();
  },

  drawDetail(ctx) {
    const n = this.cur(), c = TREE_COLS[n.col], r = Prog.r(n.id), chk = Prog.check(n), x0 = 936, y0 = 104, w = 314, h = 590;
    Shop.panel(ctx, x0, y0, w, h, true);
    UI.text(ctx, `${c.name} · ${n.tier}단계${n.key ? '  핵심 기술' : ''}`, x0 + 16, y0 + 30, { size: 13, font: FONT_B, weight: 700, fill: `rgb(${c.col})`, stroke: 3 });
    UI.text(ctx, n.name, x0 + 16, y0 + 66, { size: 28, fill: n.key ? '#ffe070' : '#ffffff', stroke: 5 });
    UI.text(ctx, `${r} / ${n.max}`, x0 + w - 18, y0 + 66, { size: 22, align: 'right', fill: r >= n.max ? '#ffd24a' : '#b8c0dc', stroke: 4 });
    // 아이콘 큰 것
    ctx.save(); ctx.translate(x0 + w / 2 - 48, y0 + 92); ctx.scale(2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, 0, 0, 48, 48, 10); ctx.fill();
    WS.glyph(ctx, n.g, c.col); ctx.restore();
    let y = y0 + 220;
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
    // 배우기 버튼
    const lr = this.learnRect(), ok = chk.ok;
    ctx.fillStyle = ok ? 'rgba(90,70,20,0.95)' : 'rgba(30,32,44,0.9)'; roundRect(ctx, lr.x, lr.y, lr.w, lr.h, 12); ctx.fill();
    ctx.strokeStyle = ok ? '#ffd24a' : r >= n.max ? '#7dffa0' : '#6a6a7a'; ctx.lineWidth = 2.6; ctx.stroke();
    UI.text(ctx, r >= n.max ? '최대 랭크' : ok ? '배우기  (1 포인트)' : '배울 수 없음', lr.x + lr.w / 2, lr.y + lr.h / 2 + 1, { size: 20, align: 'center', fill: ok ? '#fff' : r >= n.max ? '#7dffa0' : '#9a9aaa', stroke: 4 });
    // 초기화
    const rr = this.resetRect(), armed = this.resetArm > 0;
    ctx.fillStyle = armed ? 'rgba(110,30,26,0.95)' : 'rgba(26,20,20,0.9)'; roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 9); ctx.fill();
    ctx.strokeStyle = armed ? '#ff8a70' : 'rgba(255,140,120,0.45)'; ctx.lineWidth = 1.6; ctx.stroke();
    UI.text(ctx, armed ? `정말 초기화?  ${fmt(Prog.resetCost())} G` : `트리 초기화  (${fmt(Prog.resetCost())} G)`, rr.x + rr.w / 2, rr.y + 18, { size: 14, align: 'center', fill: '#ffc0b0', stroke: 3 });
    UI.text(ctx, `사용한 포인트 ${Prog.spent()}  ·  레벨 보너스 공격력 · HP +${pct(0.006 * (Prog.lv() - 1))}`, x0 + w / 2, y0 + h - 4 + 20, { size: 11.5, align: 'center', font: FONT_B, weight: 700, fill: '#6a7494', stroke: 3 });
  },
};
