'use strict';
// ============================================================
//  추가 장비 2차 : 검 10종 + 방어구 10종
//   캔디 · 방패 · 뼈 · 음양 · 마법 · 저주 · 수정 · 사이버 · 용 · 레퀴엠
//   gear2.js 와 같은 방식 : 검마다 고유 스킬 2개(G · R)
// ============================================================

// ---------- 타격 파편 ----------
const _pm = (X, Y, n, cols, o = {}) => { for (let i = 0; i < n; i++) FX.add('world', new Mote(X + rand(-(o.sx || 14), o.sx || 14), Y + rand(-(o.sy || 10), o.sy || 10), rand(-(o.vx || 1.5), o.vx || 1.5) + (o.dx || 0), rand(o.vy0 ?? -2.2, o.vy1 ?? 0.4), { col: choose(cols), life: o.life || 40, r: rand(o.r0 || 4, o.r1 || 7), grav: o.grav ?? 0.03 })); };
Object.assign(PART, {
  candy(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); for (let i = 0; i < Math.round((6 + pw) * b); i++) FX.add('world', new Debris(x + rand(-8, 8), y, z + rand(-6, 6), { vx: d * rand(1, 6) + rand(-2, 2), vz: rand(4, 10), s: rand(2.5, 4), col: choose([['#ff7ac0', '#ffb0dc', '#fff'], ['#7ad8ff', '#b0ecff', '#fff'], ['#ffe070', '#fff0a0', '#fff']]), life: 46 })); FX.add('world', new Flash(X, Y, 8, 56, 10, '255,160,210', 0.5)); },
  knight(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); Hitfx.sparks(X, Y, d, Math.round((6 + pw) * b), { col: '210,230,255', spread: 1.5 }); FX.add('world', new Ring(X, Y, 6, 64 + pw * 12, 12, { col: '200,225,255', w: 5, ry: 1 })); },
  bone(x, y, z, d, pw, b) { for (let i = 0; i < Math.round((6 + pw) * b); i++) FX.add('world', new Debris(x + rand(-8, 8), y, z + rand(-6, 6), { vx: d * rand(1, 7) + rand(-2, 2), vz: rand(4, 10), s: rand(2.5, 4.5), col: ['#e8e0c8', '#c8bea0', '#fffbe8'], life: 46 })); FX.add('world', new Flash(x, sy(y, z), 8, 50, 10, '230,225,200', 0.4)); },
  taegeuk(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); FX.add('world', new Ring(X, Y, 6, 80 + pw * 12, 16, { col: '255,255,255', w: 4, ry: 1 })); FX.add('world', new Ring(X, Y, 3, 56 + pw * 10, 16, { col: '120,150,255', w: 4, ry: 1 })); _pm(X, Y, Math.round(6 * b), ['255,255,255', '140,170,255'], { r0: 3, r1: 6 }); },
  arcane(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); for (let i = 0; i < 5; i++) FX.add('world', new CutLine(X, Y, i / 5 * Math.PI, 60 + pw * 10, 2.4, '170,140,255', 10)); _pm(X, Y, Math.round(5 * b), ['180,150,255', '255,255,255'], { r0: 3, r1: 6 }); FX.add('world', new Flash(X, Y, 8, 66, 12, '160,130,255', 0.55)); },
  curse(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); _pm(X, Y, Math.round((7 + pw) * b), ['150,60,200', '100,20,140', '210,120,255'], { r0: 5, r1: 9, vy1: -0.2 }); FX.add('world', new Flash(X, Y, 8, 56, 12, '150,60,200', 0.5)); },
  prism(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); const cols = ['255,90,90', '255,220,90', '90,255,150', '90,200,255', '200,120,255']; for (let i = 0; i < 5; i++) FX.add('world', new CutLine(X, Y, -0.6 + i * 0.3 + (d > 0 ? 0 : Math.PI), 80 + pw * 10, 2.4, cols[i], 11)); Hitfx.sparks(X, Y, d, Math.round(4 * b), { col: '240,250,255', spread: 1.6 }); },
  cyber(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); for (let i = 0; i < 3 + pw; i++) { const a = rand(0, TAU), L = rand(30, 70); FX.add('world', new CutLine(X + Math.cos(a) * L * 0.4, Y + Math.sin(a) * L * 0.4, a, L, 2, '90,255,230', 8)); } Hitfx.sparks(X, Y, d, Math.round(5 * b), { col: '120,255,235', spread: 1.6 }); FX.add('world', new Flash(X, Y, 8, 56, 10, '90,255,230', 0.5)); },
  dragon(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); for (let i = 0; i < Math.round((5 + pw) * b); i++) FX.add('world', new Mote(X + rand(-10, 10), Y + rand(-8, 8), rand(-1, 1) + d * 1.4, rand(-2.5, -0.5), { col: choose(['255,140,40', '255,200,80', '255,90,30']), life: 34, r: rand(6, 11) })); for (let i = 0; i < 3; i++) FX.add('world', new CutLine(X, Y, (d > 0 ? -0.5 : Math.PI + 0.5) + (i - 1) * 0.35, 84, 3.4, '255,150,60', 10)); },
  requiem(x, y, z, d, pw, b) { const X = x, Y = sy(y, z); for (let i = 0; i < Math.round((4 + pw) * b); i++) { const note = FX.add('world', new Mote(X + rand(-18, 18), Y + rand(-8, 8), rand(-0.6, 0.6), rand(-2, -0.8), { col: choose(['200,170,255', '255,230,150', '255,255,255']), life: 44, r: rand(5, 8), grav: 0 })); } FX.add('world', new Ring(X, Y, 8, 70 + pw * 10, 14, { col: '210,180,255', w: 3, ry: 1 })); },
});

// ============================================================
//  검 10종
// ============================================================
const WEAPONS_NEW2 = [
  {
    id: 'w24', name: '캔디 크러셔', sub: '달콤하게 부서뜨리는 사탕 몽둥이', price: 55000, map: 1,
    atk: 1.06, stop: 0.95, shake: 0.9, col: '255,130,200', snd: 'candy', part: 'candy', pitch: 1.2, swingPitch: 1.15,
    feel: '통통 튀는 팝 소리와 흩날리는 사탕 조각', desc: '적중 시 12% 확률로 사탕이 떨어진다. 사탕을 주우면 HP 6% 회복.',
    look: { c: ['#8a2a6a', '#ff7ac0', '#ffffff'], hw: 4.6, L: 0.95, edge: 'wave', tip: 'round', guard: 'ring', glow: '255,130,200', rune: '255,200,230', trim: ['#b02a7a', '#ff9ad0', '#ffffff'] },
    amb: ['mote', '255,150,210', 0.16],
    hit(p, t) { if (Game.frame - (p.candyF || -99) > 25 && chance(0.12)) { p.candyF = Game.frame; Game.pickups.push(new Pickup('candy', t.x, t.y, 50, 0)); } },
  },
  {
    id: 'w25', name: '수호기사의 검 아이기스', sub: '방패와 한 몸이 된 기사검', price: 125000, map: 1,
    atk: 1.0, stop: 1.1, shake: 1.2, kx: 1.3, move: 0.97, col: '190,215,255', snd: 'knight', part: 'knight', pitch: 0.9, swingPitch: 0.92,
    feel: '방패를 두드리는 듯한 묵직한 쇳소리', desc: '5번째 적중마다 2초간 피해 -30%의 방어막. 이동속도 -3%.',
    look: { c: ['#2a3450', '#8aa0d0', '#e8f0ff'], hw: 5.4, L: 0.96, edge: 'plain', tip: 'cleave', guard: 'cross', glow: '190,215,255', rune: '200,225,255', trim: ['#4a5a8a', '#c0d0f0', '#ffffff'], taper: 0.02 },
    amb: ['mote', '200,225,255', 0.1],
    hit(p) { if (_n(p, 'ac') % 5 === 0) { p.shield = Math.max(p.shield, 120); FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 130, 16, { col: '190,215,255', w: 6 })); Sfx.wlayer('knight', 1, false); } },
  },
  {
    id: 'w26', name: '카타콤 본블레이드', sub: '무덤에서 꺼낸 대퇴골 대검', price: 180000, map: 1,
    atk: 1.14, stop: 1.1, col: '232,226,200', snd: 'bone', part: 'bone', pitch: 0.95, swingPitch: 0.95,
    feel: '뼈가 부딪히는 딱딱한 소리', desc: '적을 처치하면 해골 영혼이 나타나 근처 적을 한 번 베어 80% 피해를 준다.',
    look: { c: ['#6a6048', '#e8e0c8', '#fffbe8'], hw: 5.6, L: 1.0, edge: 'notch', tip: 'round', guard: 'claw', glow: '230,225,200', rune: '255,250,220', trim: ['#4a4030', '#c8bea0', '#fffbe8'], taper: 0.03 },
    amb: ['dust', '230,225,200', 0.08],
    kill(p, t) {
      if (Game.frame - (p.boneF || -99) < 20) return; p.boneF = Game.frame;
      const X = t.x, Y = t.y;
      Gear.later(8, () => {
        const e = WS.nearest(X, Y, 1, 420)[0]; if (!e) return;
        FX.add('world', new Flash(X, sy(Y, 50), 10, 80, 12, '230,225,200', 0.7));
        FX.add('world', new CutLine(e.x, sy(e.y, e.z + e.h * 0.5), -0.5, 110, 5, '240,235,210', 12));
        Gear.proc(p, e, 0.8, { quiet: true }); Sfx.wlayer('bone', 2, false);
      });
    },
  },
  {
    id: 'w27', name: '음양검 태극', sub: '밝음과 어둠이 번갈아 깃드는 검', price: 310000, map: 1,
    atk: 1.14, stop: 1.0, col: '230,235,255', snd: 'taegeuk', part: 'taegeuk', pitch: 1.0, swingPitch: 1.02,
    feel: '징 소리와 맑은 종소리가 번갈아 울린다', desc: '적중마다 양(피해 +25%)과 음(HP 0.6% · MP 4 회복)이 번갈아 발동한다.',
    look: { c: ['#10142a', '#e8ecff', '#ffffff'], hw: 4.2, L: 1.04, edge: 'plain', tip: 'point', guard: 'ring', glow: '230,235,255', rune: '255,255,255', trim: ['#1a1e3a', '#d8dcf0', '#ffffff'] },
    amb: ['mote', '220,230,255', 0.14],
    mod(p) { p.yin = !p.yin; return p.yin ? 1 : 1.25; },
    hit(p) { p.wcol = p.yin ? '120,160,255' : '255,220,120'; p.wHold = 16; if (p.yin) { Gear.heal(p, p.hpMax * 0.006, true); p.mp = Math.min(p.mpMax, p.mp + 4); } },
  },
  {
    id: 'w28', name: '마법검 아케인 룬소드', sub: '룬이 새겨진 마력의 칼날', price: 600000, map: 2,
    atk: 1.24, stop: 1.0, col: '170,140,255', snd: 'arcane', part: 'arcane', pitch: 1.15, swingPitch: 1.12,
    feel: '반짝이는 마력이 터지는 소리', desc: '적중 시 MP +6. 15% 확률로 마력탄이 날아가 다른 적에게 50% 피해.',
    look: { c: ['#201048', '#7a5ae0', '#e0d0ff'], hw: 4.4, L: 1.08, edge: 'crystal', tip: 'point', guard: 'wing', glow: '170,140,255', rune: '190,160,255', trim: ['#3a2a7a', '#a890f0', '#ffffff'] },
    amb: ['star', '190,160,255', 0.16],
    mod(p) { return p.overT > 0 ? 1.3 : 1; },
    hit(p, t) {
      p.mp = Math.min(p.mpMax, p.mp + 6);
      if (!chance(0.15)) return;
      const e = WS.nearest(t.x, t.y, 1, 500, t)[0]; if (!e) return;
      Gear.bolt(t, e, '180,150,255'); FX.add('world', new Flash(e.x, sy(e.y, e.z + 40), 8, 70, 10, '170,140,255', 0.8)); Gear.proc(p, e, 0.5, { quiet: true });
    },
  },
  {
    id: 'w29', name: '저주검 헥스', sub: '베일수록 깊어지는 저주', price: 780000, map: 2,
    atk: 1.26, stop: 1.1, col: '170,70,220', snd: 'curse', part: 'curse', pitch: 0.9, swingPitch: 0.9,
    feel: '속삭이는 듯한 어두운 울림', desc: '적중마다 저주가 쌓인다(최대 5). 저주 1단계당 받는 피해 +6%. 저주 3단계 이상인 적이 죽으면 저주가 폭발해 주변 적에게 퍼진다.',
    look: { c: ['#14061e', '#6a2a98', '#d8a0ff'], hw: 4.0, L: 1.02, edge: 'saw', tip: 'curve', guard: 'claw', glow: '170,70,220', rune: '190,90,240', trim: ['#2a0e3a', '#7a3aa8', '#d8a0ff'] },
    amb: ['void', '170,70,220', 0.14],
    mod(p, t) { return 1 + 0.06 * (t.curse || 0); },
    hit(p, t) {
      t.curse = Math.min(5, (t.curse || 0) + 1);
      if (t.curse === 3 || t.curse === 5) FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, `CURSE x${t.curse}`, { col: ['#f0d8ff', '#a050e0'], size: 20 }));
    },
    kill(p, t) {
      if ((t.curse || 0) < 3) return;
      const X = t.x, gy = sy(t.y, 0);
      FX.add('world', new Flash(X, gy - 40, 20, 200, 18, '170,70,220', 0.8)); FX.add('ground', new Ring(X, gy, 20, 220, 22, { col: '190,90,240', w: 10 }));
      Sfx.wlayer('curse', 3, true);
      for (const e of Gear.near(p, t, 260)) { e.curse = Math.min(5, (e.curse || 0) + 2); Gear.proc(p, e, 0.5 * t.curse, { quiet: true }); }
    },
  },
  {
    id: 'w30', name: '수정검 프리즘', sub: '빛을 일곱 갈래로 쪼개는 칼날', price: 1000000, map: 2,
    atk: 1.2, crit: 0.12, critDmg: 1.8, stop: 1.0, col: '200,235,255', snd: 'prism', part: 'prism', pitch: 1.25, swingPitch: 1.2,
    feel: '유리 종소리와 갈라지는 무지갯빛', desc: '치명타율 +12%, 치명타 피해 x1.8. 치명타 시 빛이 갈라져 주변 적 2명에게 35% 피해.',
    look: { c: ['#3a5a8a', '#bfe8ff', '#ffffff'], hw: 4.8, L: 1.06, edge: 'crystal', tip: 'spike', guard: 'cross', glow: '200,235,255', rune: '255,255,255', trim: ['#6a8ab0', '#e0f4ff', '#ffffff'] },
    amb: ['mote', '220,240,255', 0.18],
    hit(p, t, dmg, I) {
      if (!I.crit) return;
      const cols = ['255,90,90', '255,220,90', '90,255,150', '90,200,255'];
      Gear.near(p, t, 300, 2).forEach((e, i) => { Gear.bolt(t, e, cols[i * 2]); Gear.proc(p, e, 0.35, { quiet: true, crit: true }); });
      Sfx.wlayer('prism', 2, true);
    },
  },
  {
    id: 'w31', name: '사이버 레이저블레이드', sub: '에너지로 날을 세우는 광선검', price: 1250000, map: 2,
    atk: 1.3, stop: 0.9, shake: 0.9, move: 1.04, col: '90,255,230', snd: 'cyber', part: 'cyber', pitch: 1.1, swingPitch: 1.25,
    feel: '지지직거리는 전자음과 청록 스파크', desc: '10번째 적중마다 EMP 방출 : 주변 모든 적이 0.6초 마비되고 60% 피해. 이동속도 +4%.',
    look: { c: ['#0a2a30', '#20d8c0', '#e0fffa'], hw: 3.4, L: 1.06, edge: 'notch', tip: 'point', guard: 'cross', glow: '90,255,230', rune: '110,255,235', trim: ['#103a40', '#30c8b0', '#e0fffa'] },
    amb: ['spark', '110,255,235', 0.14],
    hit(p, t) {
      if (_n(p) % 10 !== 0) return;
      FX.add('ground', new Ring(t.x, sy(t.y, 0), 20, 320, 22, { col: '90,255,230', w: 8 })); FX.add('world', new Flash(t.x, sy(t.y, 50), 14, 160, 16, '90,255,230', 0.8));
      Sfx.wlayer('cyber', 3, true); Game.addShake(5); Game.flashScreen(0.1, '180,255,245');
      FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, 'E M P', { col: ['#ffffff', '#30ffe0'], size: 22 }));
      for (const e of [t, ...Gear.near(p, t, 340)]) { Gear.proc(p, e, 0.6, { quiet: true }); Status.add(e, 'shock', { t: 36 }); }
    },
  },
  {
    id: 'w32', name: '용아검 드라고닉 팽', sub: '고룡의 송곳니를 그대로 벼린 검', price: 1650000, map: 2,
    atk: 1.38, stop: 1.2, shake: 1.3, kx: 1.2, col: '255,140,50', snd: 'dragon', part: 'dragon', pitch: 0.85, swingPitch: 0.85,
    feel: '낮은 포효와 타오르는 불길', desc: '엘리트 · 보스에게 +30% 피해. 적중한 적은 용의 불길에 2초간 불탄다.',
    look: { c: ['#3a0c08', '#b02a14', '#ffb070'], hw: 5.8, L: 1.0, edge: 'saw', tip: 'curve', guard: 'claw', glow: '255,130,40', rune: '255,150,60', trim: ['#5a1a08', '#d86a20', '#ffd090'], taper: 0.03 },
    amb: ['ember', '255,140,50', 0.2],
    mod(p, t) { return (t.elite || t.isBoss ? 1.3 : 1) * (p.rageT > 0 ? 1.5 : 1); },
    hit(p, t, dmg) {
      Status.add(t, 'burn', { t: 120, d: dmg * 0.08 });
      if (p.rageT > 0 && Game.frame - (p.rageF || -99) > 6) { p.rageF = Game.frame; for (const e of Gear.near(p, t, 320, 2)) { Gear.bolt(t, e, '255,140,40'); Gear.proc(p, e, 0.4, { quiet: true }); Status.add(e, 'burn', { t: 90, d: dmg * 0.06 }); } }
    },
  },
  {
    id: 'w33', name: '레퀴엠 바이올린검', sub: '활 대신 칼로 켜는 진혼곡', price: 1950000, map: 2,
    atk: 1.34, stop: 1.0, col: '210,180,255', snd: 'requiem', part: 'requiem', pitch: 1.05, swingPitch: 1.05,
    feel: '현이 울리는 맑은 선율', desc: '4번째 적중마다 화음이 울려 주변 적에게 80% 피해, MP +15.',
    look: { c: ['#3a1a2a', '#c07a50', '#ffe0b0'], hw: 3.2, L: 1.1, edge: 'wave', tip: 'curve', guard: 'ring', glow: '210,180,255', rune: '220,190,255', trim: ['#5a2a1a', '#e0a060', '#fff0c8'] },
    amb: ['feather', '220,190,255', 0.12],
    hit(p, t) {
      if (_n(p) % 4 !== 0) return;
      p.mp = Math.min(p.mpMax, p.mp + 15);
      FX.add('ground', new Ring(t.x, sy(t.y, 0), 20, 230, 20, { col: '210,180,255', w: 8 })); _pm(t.x, sy(t.y, t.z + 40), 8, ['200,170,255', '255,230,150'], { sx: 60, r0: 5, r1: 8 });
      Sfx.wlayer('requiem', 3, true);
      for (const e of [t, ...Gear.near(p, t, 260)]) Gear.proc(p, e, 0.8, { quiet: true });
    },
  },
];

// ============================================================
//  방어구 10종
// ============================================================
const ARMORS_NEW2 = [
  { id: 'a16', name: '수도승의 도복', sub: '맨몸으로 수련한 이의 옷', price: 55000, map: 1, def: 0.03, hp: 1.04, move: 1.1, dodge: 0.16, desc: '16% 확률로 공격을 회피. 이동속도 +10%, 받는 피해 -3%.',
    look: { coat: ['#3a2410', '#c88a30', '#f0c870'], metal: ['#6a4a20', '#d8a850', '#fff0b0'], deco: 'monk', dc: ['#5a3a18', '#e0a040', '#fff0b0'], trim: ['#7a4a10', '#e8b030', '#fff0a0'] } },
  { id: 'a17', name: '뼈 갑옷 본아머', sub: '해골의 갈비뼈로 엮은 갑옷', price: 150000, map: 1, def: 0.1, hp: 1.12, thorns: true, desc: '받는 피해 -10%, 최대 HP +12%. 근접 공격한 적에게 뼈 가시로 반격(내 공격력의 35%).',
    look: { coat: ['#2a2418', '#6a6048', '#a89e80'], metal: ['#8a8068', '#e8e0c8', '#fffbe8'], deco: 'bone', dc: ['#8a8068', '#e8e0c8', '#fffbe8'] } },
  { id: 'a18', name: '수호기사의 갑주', sub: '왕국을 지키는 중무장 기사', price: 260000, map: 1, def: 0.22, hp: 1.18, move: 0.93, kbRes: 0.6, desc: '받는 피해 -22%, 최대 HP +18%, 피격 시 밀려나는 거리 60% 감소. 이동속도 -7%.',
    look: { coat: ['#101828', '#2a4070', '#5a80c0'], metal: ['#4a5a7a', '#a0b4d8', '#f0f6ff'], deco: 'knight', dc: ['#3a4a6a', '#90a4c8', '#eaf2ff'], trim: ['#8a6a20', '#d8aa38', '#fff0a8'] } },
  { id: 'a19', name: '인어의 비늘옷', sub: '바다가 입혀준 푸른 비늘', price: 340000, map: 1, def: 0.1, hp: 1.1, move: 1.05, mpRegen: 1.6, regen: 0.014, desc: '받는 피해 -10%, MP 재생 +60%, 이동속도 +5%. 3초간 맞지 않으면 초당 HP 1.4% 회복.',
    look: { coat: ['#06222a', '#1a7a8a', '#58d0d8'], metal: ['#0e4a5a', '#2aa0b0', '#a0f0f0'], deco: 'mermaid', dc: ['#0a3a46', '#22a0b0', '#90f0f0'], glow: '120,240,240' } },
  { id: 'a20', name: '대마법사의 법의', sub: '룬이 흐르는 비단 로브', price: 480000, map: 2, def: 0.08, hp: 1.06, mpRegen: 2.2, cdr: 0.2, desc: 'MP 재생 +120%, 스킬 쿨타임 -20%, 받는 피해 -8%.',
    look: { coat: ['#140a38', '#4a2ab0', '#9a7aff'], metal: ['#2a1a6a', '#6a4ae0', '#d0c0ff'], deco: 'arcane', dc: ['#2a1a6a', '#5a3ad0', '#c0a8ff'], glow: '170,140,255' } },
  { id: 'a21', name: '저주받은 수의', sub: '죽은 자가 남긴 낡은 천', price: 650000, map: 2, def: 0.14, hp: 1.15, berserk: 0.25, desc: '받는 피해 -14%, 최대 HP +15%. HP가 절반 이하면 공격력 +25%.',
    look: { coat: ['#0c0814', '#2a1a3a', '#5a3a78'], metal: ['#1a1024', '#3a2450', '#7a50a0'], deco: 'shroud', dc: ['#14081e', '#34204a', '#6a4090'], glow: '170,70,220' } },
  { id: 'a22', name: '사이버 전투복', sub: '신경이 직결된 나노 슈트', price: 1050000, map: 2, def: 0.1, hp: 1.1, move: 1.12, dodge: 0.18, desc: '18% 확률로 공격을 회피. 이동속도 +12%, 받는 피해 -10%.',
    look: { coat: ['#06141a', '#103a48', '#20a0b8'], metal: ['#0a2a34', '#1a6a80', '#60f0e0'], deco: 'cyber', dc: ['#0a2a34', '#18788c', '#70fff0'], glow: '90,255,230' } },
  { id: 'a23', name: '용기사의 비늘갑주', sub: '용과 맺은 계약의 증표', price: 1400000, map: 2, def: 0.28, hp: 1.35, capHit: 0.15, thorns: true, desc: '받는 피해 -28%, 최대 HP +35%. 한 번에 최대 HP의 15% 이상은 입지 않고, 근접 공격한 적에게 불꽃으로 반격.',
    look: { coat: ['#2a0808', '#8a1c10', '#d8502a'], metal: ['#4a1408', '#c03a1c', '#ffa060'], deco: 'drake', dc: ['#4a1008', '#b03018', '#ff9050'], glow: '255,130,50' } },
  { id: 'a24', name: '지휘자의 연미복', sub: '선율로 전장을 이끄는 검은 정장', price: 1800000, map: 2, def: 0.14, hp: 1.15, cdr: 0.25, mpRegen: 1.8, dodge: 0.08, desc: '스킬 쿨타임 -25%, MP 재생 +80%, 8% 확률로 회피, 받는 피해 -14%.',
    look: { coat: ['#0a0a10', '#1c1c2a', '#3c3c58'], metal: ['#2a2a3a', '#5a5a78', '#c0c0e0'], deco: 'tux', dc: ['#10101a', '#26263a', '#50507a'], trim: ['#6a4a10', '#e8b830', '#fff0a0'] } },
  { id: 'a25', name: '태양 사제의 예복', sub: '정오의 빛을 두른 금빛 법의', price: 2300000, map: 2, def: 0.2, hp: 1.28, regen: 0.02, desc: '받는 피해 -20%, 최대 HP +28%. 3초간 맞지 않으면 초당 HP 2% 회복.',
    look: { coat: ['#6a4a10', '#f0b830', '#fff0a0'], metal: ['#a07018', '#ffd860', '#ffffff'], deco: 'sunrobe', dc: ['#a07018', '#f8c850', '#fff6c8'], glow: '255,225,110', trim: ['#7a4a10', '#f0b020', '#fff0a0'] } },
];

// ============================================================
//  스킬 전용 이펙트
// ============================================================

// 던지는 물체 : 사탕 폭탄(달라붙었다가 터진다) / 해골(닿으면 바로 터진다)
class WLob {
  constructor(p, x, y, z, vx, vy, vz, o) { Object.assign(this, { p, x, y, z, vx, vy, vz, t: 0, kind: o.kind, fuse: o.fuse || 0, boom: o.boom, stuck: null, st: 0, add: false, rot: 0 }); }
  update() {
    this.t++;
    if (this.stuck) {
      const e = this.stuck; if (e.hittable()) { this.x = e.x; this.y = e.y; this.z = e.z + e.h * 0.6; }
      if (++this.st >= this.fuse) { this.boom(this); return false; }
      return true;
    }
    this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.z += this.vz; this.vz -= 0.45; this.rot += 0.3;
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 40 + e.w || Math.abs(e.y - this.y) > 36 || this.z > e.z + e.hurtH() + 20 || this.z < e.z - 20) continue;
      if (this.fuse) { this.stuck = e; return true; }
      this.boom(this); return false;
    }
    if (this.z <= 0) { this.z = 0; if (this.fuse) { this.vx = this.vy = this.vz = 0; this.st++; if (this.st >= this.fuse) { this.boom(this); return false; } return true; } this.boom(this); return false; }
    const r = Game.room; if (this.x < r.minX - 40 || this.x > r.maxX + 40) { this.boom(this); return false; }
    return true;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z);
    ctx.save(); ctx.translate(X, Y);
    if (this.kind === 'candy') {
      const bl = this.stuck || this.st > 0 ? (Math.sin(this.t * 0.6) > 0 ? 1 : 0.5) : 1;
      ctx.rotate(this.rot); ctx.fillStyle = '#6a1a4a'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,${bl > 0.7 ? 122 : 200},192,1)`; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 7, 0.4, 5.4); ctx.stroke();
    } else {
      ctx.rotate(Math.sin(this.rot) * 0.4);
      ctx.fillStyle = '#16120a'; ctx.beginPath(); ctx.arc(0, -2, 17, 0, TAU); ctx.fill();
      ctx.fillStyle = '#efe8d0'; ctx.beginPath(); ctx.arc(0, -3, 14.5, 0, TAU); ctx.fill(); ctx.fillRect(-8, 6, 16, 9);
      ctx.fillStyle = '#16120a'; ctx.beginPath(); ctx.arc(-5.5, -3, 3.6, 0, TAU); ctx.arc(5.5, -3, 3.6, 0, TAU); ctx.fill(); ctx.fillRect(-1.6, 3, 3.2, 4);
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -2, 40, '230,225,200', 0.3);
    }
    ctx.restore();
  }
}

// 철벽 요새 : 막아낸 공격 수만큼 마지막에 충격파가 커진다
class WFort {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p;
    if (p.absorbT <= 0 || p.hp <= 0) {
      const n = p.absorbN || 0, gy = sy(p.y, 0);
      Sfx.wlayer('knight', 3, true); Game.addShake(8 + n * 2); Game.flashScreen(0.3, '200,225,255');
      FX.add('world', new Flash(p.x, gy - 40, 20, 260 + n * 30, 20, '190,220,255', 0.9)); FX.add('ground', new Ring(p.x, gy, 20, 340 + n * 30, 24, { col: '190,220,255', w: 14 }));
      WS.area(p, p.x, p.y, 320 + n * 25, 130, WS.hd({ dmg: 3 + n * 1.6, kx: 10, kz: 6, airKz: 6, stun: 60, stop: 8 + n, shake: 8, fx: 'heavy', power: 1.8 }));
      return false;
    }
    return true;
  }
  draw(ctx) {
    const p = this.p, X = p.x, Y = sy(p.y, p.z + 70), pu = 0.7 + Math.sin(this.t * 0.25) * 0.2, fade = Math.min(1, p.absorbT / 20);
    ctx.save(); ctx.globalAlpha = fade;
    drawGlow(ctx, X, Y, 170, '190,220,255', 0.3 * pu, 1, 1.1);
    ctx.strokeStyle = `rgba(210,232,255,${0.8 * pu})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(X, Y, 78, 96, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.4 * pu})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(X, Y, 70, 88, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}
Player.prototype.onAbsorb = function (att) {
  this.absorbN = (this.absorbN || 0) + 1;
  FX.add('top', new Label(this.x, sy(this.y, this.z) - 170, 'BLOCK', { col: ['#ffffff', '#9ac8ff'], size: 24, life: 40 }));
  FX.add('world', new Flash(this.x, sy(this.y, 70), 20, 150, 12, '200,225,255', 0.9));
  Sfx.wlayer('knight', 2, true); Sfx.play('counter', 0.6, 1.2); Game.addShake(5);
};

// 뼈 용 : 화면 반대편에서 나타나 달려오며 모두 물어뜯는다
class WBoneDragon {
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, add: false, hits: new Map(), z: 90 }); }
  update() {
    this.t++; this.x += this.dir * 17; const p = this.p;
    if (this.t % 3 === 0) FX.add('world', new Debris(this.x - this.dir * rand(0, 160), this.y + rand(-30, 30), rand(40, 130), { vx: rand(-2, 2), vz: rand(2, 6), s: rand(2, 4), col: ['#e8e0c8', '#c8bea0', '#fffbe8'], life: 30 }));
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 130 || Math.abs(e.y - this.y) > 110) continue;
      const n = this.hits.get(e) || 0, last = this['l' + e.id] || -99;
      if (n >= 4 || this.t - last < 5) continue;
      this.hits.set(e, n + 1); this['l' + e.id] = this.t;
      applyHit(p, e, WH.boneBite, { noStopAtt: true, dir: this.dir });
    }
    const r = Game.room;
    if ((this.dir < 0 && this.x < r.minX - 260) || (this.dir > 0 && this.x > r.maxX + 260)) {
      const cx = clamp(Game.cam.x + W / 2, r.minX, r.maxX);
      Sfx.wlayer('bone', 3, true); Sfx.play('roar', 0.8, 0.6); Game.addShake(14); Game.flashScreen(0.35, '240,235,215');
      FX.add('world', new Flash(cx, sy(this.y, 60), 30, 460, 22, '240,235,215', 0.9)); FX.add('ground', new Ring(cx, sy(this.y, 0), 30, 560, 26, { col: '240,235,215', w: 16 }));
      for (const e of WS.onScreen()) applyHit(p, e, WH.boneRoar, { noStopAtt: true, dir: sign(e.x - cx) || 1 });
      return false;
    }
    return true;
  }
  draw(ctx) {
    const d = this.dir, T = this.t, gy = sy(this.y, this.z);
    ctx.save(); ctx.translate(this.x, gy); ctx.scale(-d, 1); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 200, '230,225,200', 0.25);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 7; i >= 1; i--) {                                         // 척추 + 갈비뼈
      const x = -i * 52, y = Math.sin(T * 0.3 - i * 0.7) * 22;
      ctx.fillStyle = '#e8e0c8'; ctx.strokeStyle = '#4a4030'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, 18 - i * 1.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d0c8a8'; ctx.lineWidth = 5 - i * 0.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 6, y + 44 - i * 3, x + 10, y + 64 - i * 4); ctx.stroke();
    }
    ctx.fillStyle = '#f2ecd6'; ctx.strokeStyle = '#4a4030'; ctx.lineWidth = 3;                  // 머리뼈
    ctx.beginPath(); ctx.moveTo(-10, -26); ctx.quadraticCurveTo(50, -40, 92, -6); ctx.lineTo(80, 8); ctx.lineTo(18, 16); ctx.quadraticCurveTo(-16, 10, -10, -26); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#16120a'; ctx.beginPath(); ctx.ellipse(34, -14, 11, 8, -0.3, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 34, -14, 24, '120,255,200', 0.9);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fffbe8';
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(30 + k * 9, 8 + (k % 2) * 1); ctx.lineTo(34 + k * 9, 20 + (Math.sin(T * 0.5) + 1) * 3); ctx.lineTo(38 + k * 9, 8); ctx.fill(); }
    ctx.restore();
  }
}

// 음양 영역 : 양(불꽃 · 피해)과 음(냉기 · 회복)
class WYin {
  constructor(p, x, y, yang) { Object.assign(this, { p, x, y, yang, t: 0, life: 300, add: false }); }
  update() {
    this.t++; const p = this.p;
    if (this.t > 10 && this.t % 15 === 0) {
      if (this.yang) WS.area(p, this.x, this.y, 250, 110, WH.yang, { hmax: 200, each: e => Status.add(e, 'burn', { t: 90, d: p.atk * 0.12 }) });
      else {
        WS.area(p, this.x, this.y, 250, 110, WH.yin, { hmax: 200, each: e => Status.add(e, 'slow', { t: 40, m: 0.4 }) });
        if (Math.abs(p.x - this.x) < 250 && Math.abs(p.y - this.y) < 110) Gear.heal(p, p.hpMax * 0.012, true);
      }
    }
    if (this.t === this.life) {
      const gy = sy(this.y, 0); Sfx.wlayer('taegeuk', 3, true); Game.addShake(6);
      FX.add('world', new Flash(this.x, gy - 30, 20, 230, 18, this.yang ? '255,200,100' : '140,170,255', 0.9)); FX.add('ground', new Ring(this.x, gy, 20, 300, 22, { col: this.yang ? '255,200,100' : '140,170,255', w: 12 }));
      WS.area(p, this.x, this.y, 280, 120, WH.yinBoom);
    }
    return this.t < this.life + 4;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), g = E.out3(Math.min(1, this.t / 12)), a = this.t > this.life - 14 ? Math.max(0, (this.life - this.t) / 14) : 1;
    ctx.save(); ctx.globalAlpha = a * 0.85; ctx.translate(this.x, gy); ctx.scale(1, 0.44); ctx.rotate(this.t * 0.03 * (this.yang ? 1 : -1));
    const R = 240 * g;
    ctx.fillStyle = this.yang ? 'rgba(255,220,150,0.5)' : 'rgba(110,140,255,0.5)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.fillStyle = this.yang ? 'rgba(255,255,255,0.8)' : 'rgba(20,24,60,0.8)'; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); ctx.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true); ctx.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2); ctx.fill();
    ctx.strokeStyle = this.yang ? '#ffe9a0' : '#9ab0ff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

// 드론 : 곁을 맴돌며 가까운 적을 쏜다
class WDrone {
  constructor(p, slot) { Object.assign(this, { p, slot, t: 0, life: 320, add: true }); }
  update() {
    this.t++; const p = this.p; if (p.hp <= 0) return false;
    if (this.t % 14 === (this.slot ? 7 : 0)) {
      const px = p.x + Math.cos(this.t * 0.06 + this.slot * Math.PI) * 70, py = p.y + Math.sin(this.t * 0.06 + this.slot * Math.PI) * 24, e = WS.nearest(px, py, 1, 900)[0];
      if (e) {
        const X1 = px, Y1 = sy(py, 130), X2 = e.x, Y2 = sy(e.y, e.z + e.h * 0.5);
        FX.add('world', new CutLine((X1 + X2) / 2, (Y1 + Y2) / 2, Math.atan2(Y2 - Y1, X2 - X1), Math.hypot(X2 - X1, Y2 - Y1) / 2, 2.4, '90,255,230', 6));
        FX.add('world', new Flash(X2, Y2, 4, 40, 8, '90,255,230', 0.8)); Sfx.wlayer('cyber', 1, false);
        applyHit(p, e, WH.droneShot, { noStopAtt: true, dir: sign(e.x - px) || 1, hz: 70 });
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const p = this.p, a = this.t * 0.06 + this.slot * Math.PI, X = p.x + Math.cos(a) * 70, Y = sy(p.y + Math.sin(a) * 24, 130 + Math.sin(this.t * 0.2) * 6);
    ctx.save(); ctx.translate(X, Y);
    ctx.fillStyle = '#10343a'; ctx.strokeStyle = '#60fff0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 15, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#60fff0'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#60fff0'; ctx.beginPath(); ctx.moveTo(-15, -9); ctx.lineTo(-22, -15); ctx.moveTo(15, -9); ctx.lineTo(22, -15); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 30, '90,255,230', 0.5); ctx.restore();
  }
}

// 궤도 레이저 : 예고선이 나타난 뒤 하늘에서 광선이 내리꽂힌다
class WOrbital {
  constructor(p, x, y, delay) { Object.assign(this, { p, x, y, t: -delay, dur: 36, add: true }); }
  update() {
    this.t++;
    if (this.t === this.dur) {
      const gy = sy(this.y, 0);
      FX.add('world', new Pillar(this.x, this.y, 60, 640, 22, '90,255,230', '240,255,252')); FX.add('world', new Flash(this.x, gy - 20, 20, 240, 18, '90,255,230', 0.95)); FX.add('ground', new Ring(this.x, gy, 20, 260, 20, { col: '90,255,230', w: 12 }));
      Sfx.wlayer('cyber', 3, true); Sfx.play('explode', 0.7); Game.addShake(8);
      WS.area(this.p, this.x, DEPTH / 2, 80, DEPTH, WH.orbital, { hmax: 400 });
    }
    return this.t < this.dur + 2;
  }
  draw(ctx) {
    if (this.t < 0 || this.t >= this.dur) return;
    const u = this.t / this.dur, gy = sy(this.y, 0);
    ctx.save(); ctx.strokeStyle = `rgba(90,255,230,${0.35 + u * 0.5})`; ctx.lineWidth = 2 + u * 3; ctx.setLineDash([14, 10]);
    ctx.beginPath(); ctx.moveTo(this.x, -20); ctx.lineTo(this.x, gy + 20); ctx.stroke();
    ctx.fillStyle = `rgba(90,255,230,${0.12 + u * 0.2})`; ctx.beginPath(); ctx.ellipse(this.x, gy, 80 * (0.4 + u * 0.6), 28 * (0.4 + u * 0.6), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// 용의 숨결 : 앞으로 부채꼴 화염
class WBreath {
  constructor(p) { Object.assign(this, { p, t: 0, life: 40, add: true }); this.dir = p.facing; }
  update() {
    this.t++; const p = this.p;
    if (this.t % 3 === 0) {
      WS.area(p, p.x + this.dir * 270, p.y, 280, 78, WH.breath, { hmax: 220, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.14 }) });
      Game.addShake(2);
    }
    for (let i = 0; i < 3; i++) FX.add('world', new Mote(p.x + this.dir * rand(60, 520), sy(p.y + rand(-50, 50), rand(20, 90)), this.dir * rand(1, 3), rand(-2, -0.4), { col: choose(['255,140,40', '255,200,80', '255,90,30']), life: 26, r: rand(9, 16), grav: 0 }));
    return this.t < this.life && p.hp > 0;
  }
  draw(ctx) {
    const p = this.p, d = this.dir, X0 = p.x + d * 50, Y = sy(p.y, 80), a = Math.min(1, this.t / 4, (this.life - this.t) / 6);
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(X0, 0, X0 + d * 620, 0); g.addColorStop(0, 'rgba(255,230,160,0.9)'); g.addColorStop(0.5, 'rgba(255,130,40,0.55)'); g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, Y - 6); ctx.lineTo(X0 + d * 620, Y - 90); ctx.lineTo(X0 + d * 620, Y + 90); ctx.lineTo(X0, Y + 6); ctx.fill();
    drawGlow(ctx, X0, Y, 80, '255,180,70', 0.8); ctx.restore();
  }
}

// 교향곡 : 4악장으로 이어지는 연주 (느려짐 → 파동 → 회복 → 피날레)
class WSymph {
  constructor(p) { Object.assign(this, { p, t: 0, life: 250, add: false }); Game.symphT = 250; }
  update() {
    this.t++; const p = this.p, t = this.t;
    if (p.hp <= 0) return false;
    const note = () => FX.add('world', new Mote(Game.cam.x + rand(40, W - 40), sy(rand(0, DEPTH), rand(20, 200)), rand(-0.5, 0.5), rand(-2, -0.8), { col: choose(['200,170,255', '255,230,150', '255,255,255']), life: 50, r: rand(6, 10), grav: 0 }));
    if (t % 4 === 0) note();
    if (t <= 60) { if (t % 10 === 0) for (const e of WS.onScreen()) Status.add(e, 'slow', { t: 40, m: 0.35 }); }
    else if (t <= 120) { if (t % 15 === 0) { Sfx.wlayer('requiem', 2, false); FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 460, 22, { col: '210,180,255', w: 10 })); for (const e of WS.onScreen()) applyHit(p, e, WH.movement, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); } }
    else if (t <= 180) { if (t % 10 === 0) { Gear.heal(p, p.hpMax * 0.035, true); p.mp = Math.min(p.mpMax, p.mp + 60); FX.add('ground', new Ring(p.x, sy(p.y, 0), 10, 160, 16, { col: '150,255,190', w: 6 })); } }
    else if (t < 240) { if (t % 8 === 0) { Sfx.wlayer('requiem', 3, true); Game.addShake(5); for (const e of WS.onScreen()) applyHit(p, e, WH.crescendo, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); } }
    else if (t === 240) {
      Game.flashScreen(0.8, '240,230,255'); Game.addShake(20); Game.zoomPunch(1.07); Sfx.play('explode', 1); Sfx.wlayer('requiem', 3, true);
      for (const e of WS.onScreen()) { FX.add('world', new Pillar(e.x, e.y, 50, 520, 24, '210,180,255', '255,250,255')); applyHit(p, e, WH.finale, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); }
    }
    return t < this.life;
  }
  draw() { }
}

// 수정 감옥 : 적을 수정에 가두고, 부서지며 무지갯빛으로 터진다
class WCrystal {
  constructor(p, e) { Object.assign(this, { p, e, t: 0, life: 150, add: false }); }
  update() {
    this.t++; const e = this.e, p = this.p;
    if (!e.hittable()) return false;
    if (e.isBoss) { Status.add(e, 'slow', { t: 20, m: 0.5 }); } else { e.holdT = Math.max(e.holdT || 0, 6); e.holdKind = 'shock'; e.vx = e.vy = 0; }
    if (this.t % 30 === 0 && this.t < this.life) { applyHit(p, e, WH.crystalTick, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); Sfx.wlayer('prism', 1, false); }
    if (this.t === this.life) {
      Sfx.wlayer('prism', 3, true); Game.addShake(6);
      const cols = ['255,90,90', '255,220,90', '90,255,150', '90,200,255', '200,120,255'], X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
      for (let i = 0; i < 10; i++) FX.add('world', new CutLine(X, Y, i / 10 * TAU, 90, 3, cols[i % 5], 12));
      FX.add('world', new Flash(X, Y, 16, 150, 16, '255,255,255', 0.9));
      applyHit(p, e, WH.shatter, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
      return false;
    }
    return true;
  }
  draw(ctx) {
    const e = this.e; if (!e.hittable()) return;
    const u = this.t / this.life, g = E.out3(Math.min(1, this.t / 8)), X = e.x, Y = sy(e.y, e.z), h = (e.h || 120) * 1.15 * g, w = (e.w || 24) * 1.9 * g;
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(190,235,255,0.35)'; ctx.strokeStyle = 'rgba(240,252,255,0.95)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(X, Y + 6); ctx.lineTo(X - w, Y - h * 0.3); ctx.lineTo(X - w * 0.6, Y - h * 0.85); ctx.lineTo(X, Y - h); ctx.lineTo(X + w * 0.6, Y - h * 0.85); ctx.lineTo(X + w, Y - h * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y - h * 0.5, h * 0.9, ['255,120,120', '255,230,120', '120,255,170', '120,210,255', '210,140,255'][(this.t / 10 | 0) % 5], 0.25 + u * 0.2);
    ctx.restore();
  }
}

// 아케인 오버로드 : 쿨타임 없음 + MP 무한 (각성기 제외)
class WOver {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() { this.t++; const p = this.p; if (p.overT <= 0 || p.hp <= 0) return false; for (const k in p.cd) if (k !== 's6') p.cd[k] = 0; p.mp = p.mpMax; if (this.t % 6 === 0) FX.add('world', new Mote(p.x + rand(-40, 40), sy(p.y, rand(0, 150)), rand(-0.4, 0.4), rand(-2.4, -1), { col: choose(['190,160,255', '255,255,255']), life: 34, r: rand(4, 7), grav: 0 })); return true; }
  draw(ctx) { const p = this.p, pu = 0.6 + Math.sin(this.t * 0.3) * 0.3; drawGlow(ctx, p.x, sy(p.y, 70), 140, '170,140,255', 0.25 * pu, 1, 1.1); }
}

// ---------- 타격 정의 ----------
Object.assign(WH, {
  candyBomb: WS.hd({ dmg: 2.5, kx: 6, kz: 8, airKz: 7, stun: 40, stop: 6, shake: 6, fx: 'blunt', power: 1.4 }),
  sweet: WS.hd({ dmg: 12, kx: 6, kz: 9, airKz: 8, stun: 60, stop: 10, shake: 10, fx: 'heavy', power: 2 }),
  bash: WS.hd({ dmg: 4.5, kx: 15, kz: 4, airKz: 5, stun: 70, stop: 8, shake: 9, fx: 'heavy', power: 1.8 }),
  skull: WS.hd({ dmg: 4.8, kx: 6, kz: 8, airKz: 7, stun: 60, stop: 7, shake: 7, fx: 'blunt', power: 1.5 }),
  boneBite: WS.hd({ dmg: 3.2, kx: 7, kz: 6, airKz: 6, stun: 40, stop: 4, shake: 5, fx: 'heavy', power: 1.4 }),
  boneRoar: WS.hd({ dmg: 9, kx: 10, kz: 10, airKz: 9, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2 }),
  taegeuk: WS.hd({ dmg: 1.4, kx: 0, airKz: 1, stun: 14, stop: 1, shake: 1.5, fx: 'slash' }),
  yang: WS.hd({ dmg: 1.3, kx: 0, airKz: 1, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  yin: WS.hd({ dmg: 0.8, kx: 0, airKz: 0.5, stun: 8, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  yinBoom: WS.hd({ dmg: 8, kx: 8, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.6 }),
  missile: WS.hd({ dmg: 2.4, kx: 2, airKz: 3, stun: 26, stop: 3, shake: 2, fx: 'none', power2: 1 }),
  curseBurst: WS.hd({ dmg: 4, kx: 4, kz: 7, airKz: 7, stun: 50, stop: 6, shake: 6, fx: 'none', power2: 2 }),
  prism: WS.hd({ dmg: 3.4, kx: 3, airKz: 4, stun: 30, stop: 4, shake: 3, fx: 'pierce', power: 1.3 }),
  crystalTick: WS.hd({ dmg: 2.4, kx: 0, airKz: 0.5, stun: 20, stop: 2, shake: 2, fx: 'none', sfx: 'none' }),
  shatter: WS.hd({ dmg: 14, kx: 6, kz: 11, airKz: 10, stun: 60, stop: 10, shake: 10, fx: 'heavy', power: 1.8 }),
  droneShot: WS.hd({ dmg: 1.3, kx: 1, airKz: 1, stun: 12, stop: 1, shake: 1, fx: 'none', sfx: 'light' }),
  orbital: WS.hd({ dmg: 12, kx: 6, kz: 13, airKz: 12, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2 }),
  breath: WS.hd({ dmg: 0.95, kx: 3, airKz: 1, stun: 14, stop: 1, shake: 1.5, fx: 'none', sfx: 'none' }),
  movement: WS.hd({ dmg: 2.6, kx: 5, airKz: 4, stun: 30, stop: 3, shake: 3, fx: 'none', power2: 1 }),
  crescendo: WS.hd({ dmg: 1.8, kx: 2, airKz: 3, stun: 22, stop: 2, shake: 3, fx: 'slash' }),
  finale: WS.hd({ dmg: 24, kx: 9, kz: 14, airKz: 12, stun: 70, stop: 18, shake: 18, fx: 'heavy', power: 2.6 }),
});

// ============================================================
//  스킬 정의 (G = s5 / R = s6)
// ============================================================
Object.assign(WSK, {
  // ----------------------------- 캔디 크러셔 -----------------------------
  w24: ws({
    name: '설탕 폭탄', mp: 120, cd: 8, ico: ['candybomb', '255,130,200'], desc: '끈끈한 사탕 폭탄 세 개를 던진다. 적에게 달라붙었다가 잠시 뒤 터지며 주변을 느리게 만든다.',
    act: {
      anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) {
          Sfx.pplay('swingBig'); Sfx.wlayer('candy', 2, false);
          for (const vy of [-2.4, 0, 2.4]) FX.add('world', new WLob(p, p.x + p.facing * 40, p.y, p.z + 70, p.facing * 10, vy, 4, {
            kind: 'candy', fuse: 40, boom: b => {
              const gy = sy(b.y, 0);
              FX.add('world', new Flash(b.x, gy - 30, 12, 190, 16, '255,150,210', 0.9)); FX.add('ground', new Ring(b.x, gy, 12, 210, 20, { col: '255,160,215', w: 10 }));
              for (let i = 0; i < 12; i++) FX.add('world', new Debris(b.x + rand(-20, 20), b.y, 10, { vx: rand(-6, 6), vz: rand(5, 11), s: rand(2.5, 4), col: choose([['#ff7ac0', '#ffb0dc', '#fff'], ['#7ad8ff', '#b0ecff', '#fff'], ['#ffe070', '#fff0a0', '#fff']]), life: 50 }));
              Sfx.wlayer('candy', 3, true); Sfx.play('explode', 0.4); Game.addShake(5);
              WS.area(p, b.x, b.y, 190, 80, WH.candyBomb, { each: e => Status.add(e, 'slow', { t: 150, m: 0.45 }) });
            },
          }));
        }
      },
    },
  }, {
    name: '매혹의 단맛', mp: 480, cd: 42, ico: ['heartcandy', '255,130,200'], desc: '달콤한 향기로 화면 안의 모든 적을 매혹시킨다(3초간 꼼짝 못함). 그동안 HP를 15% 회복하고, 매혹이 풀리는 순간 달콤하게 터진다. (보스는 느려질 뿐)',
    act: {
      anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
      start(p) { WS.cutin(p, '매혹의 단맛', '甘 美 魅 惑', '255,130,200'); p.invul = 100; p.vx = 0; },
      update(p, f) {
        if (f === 10) {
          Game.flashScreen(0.3, '255,200,230'); Sfx.wlayer('candy', 3, true); p.bladeGlow = 2; Gear.heal(p, p.hpMax * 0.15);
          const list = WS.onScreen();
          for (const e of list) {
            Status.add(e, 'shock', { t: 180 });
            for (let i = 0; i < 5; i++) FX.add('world', new Mote(e.x + rand(-20, 20), sy(e.y, e.z + e.h + 10 + rand(0, 30)), rand(-0.4, 0.4), rand(-1.4, -0.5), { col: '255,120,190', life: 70, r: rand(8, 13), grav: 0 }));
          }
          Gear.later(185, () => {
            Sfx.wlayer('candy', 3, true); Game.addShake(10); Game.flashScreen(0.4, '255,210,235');
            for (const e of WS.onScreen()) { FX.add('world', new Flash(e.x, sy(e.y, e.z + e.h * 0.5), 16, 160, 16, '255,150,210', 0.9)); applyHit(p, e, WH.sweet, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); }
          });
        }
      },
    },
  }),

  // ----------------------------- 수호기사의 검 아이기스 -----------------------------
  w25: ws({
    name: '방패 강타', mp: 110, cd: 8, ico: ['shieldbash', '190,215,255'], desc: '방패를 앞세워 돌진하며 들이받는다. 맞은 적은 크게 밀려나고 기절한다.',
    act: {
      anim: 'a3', len: 36, cancel: 26, atkCancel: 22,
      update(p, f) {
        if (f < 8) { p.vx = 0; p.bladeGlow = 0.5; }
        if (f === 8) { Sfx.pplay('swingBig'); Sfx.wlayer('knight', 2, false); p.afterOn = 6; }
        if (f >= 8 && f < 14) { p.vx = p.facing * 17; p.armorF = true; }
        if (f === 12) {
          swingT(p, 'a4', 1.8); Game.addShake(8); Sfx.wlayer('knight', 3, true);
          FX.add('ground', new Ring(p.x + p.facing * 90, sy(p.y, 0), 20, 200, 18, { col: '200,225,255', w: 10 })); FX.add('world', new Flash(p.x + p.facing * 90, sy(p.y, 60), 20, 190, 14, '200,225,255', 0.9));
          WS.area(p, p.x + p.facing * 100, p.y, 170, 80, WH.bash, { each: e => Status.add(e, 'shock', { t: 50 }) });
        }
      },
    },
  }, {
    name: '철벽 요새', mp: 480, cd: 42, ico: ['fortress', '190,215,255'], desc: '4초 동안 철벽을 세운다. 어떤 공격도 막아내며, 막을 때마다 충격파가 쌓여 마지막에 한꺼번에 터진다.',
    act: {
      anim: 'drawReady', len: 40, cancel: 30, atkCancel: 24,
      start(p) { WS.cutin(p, '철벽 요새', '鐵 壁 要 塞', '190,215,255'); p.invul = 40; p.vx = 0; },
      update(p, f) {
        if (f === 8) { p.absorbT = 240; p.absorbN = 0; p.bladeGlow = 2; Sfx.wlayer('knight', 3, false); Game.flashScreen(0.2, '210,230,255'); FX.add('top', new WFort(p)); }
      },
    },
  }),

  // ----------------------------- 카타콤 본블레이드 -----------------------------
  w26: ws({
    name: '해골 투척', mp: 120, cd: 8, ico: ['skull', '232,226,200'], desc: '해골을 던진다. 적에게 닿는 순간 터지며 뼛조각이 흩어지고 주변 적이 기절한다.',
    act: {
      anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) {
          Sfx.pplay('swingBig'); Sfx.wlayer('bone', 2, false);
          for (const vy of [-1.6, 1.6]) FX.add('world', new WLob(p, p.x + p.facing * 40, p.y, p.z + 70, p.facing * 13, vy, 3, {
            kind: 'skull', boom: b => {
              const gy = sy(b.y, 0);
              FX.add('world', new Flash(b.x, gy - 30, 12, 180, 16, '235,230,205', 0.9)); FX.add('ground', new Ring(b.x, gy, 12, 200, 20, { col: '235,230,205', w: 10 }));
              for (let i = 0; i < 12; i++) FX.add('world', new Debris(b.x + rand(-20, 20), b.y, 20, { vx: rand(-7, 7), vz: rand(5, 12), s: rand(2.5, 4.5), col: ['#e8e0c8', '#c8bea0', '#fffbe8'], life: 50 }));
              Sfx.wlayer('bone', 3, true); Game.addShake(6);
              WS.area(p, b.x, b.y, 190, 80, WH.skull, { each: e => Status.add(e, 'shock', { t: 50 }) });
            },
          }));
        }
      },
    },
  }, {
    name: '뼈 용의 포효', mp: 480, cd: 42, ico: ['bonedragon', '232,226,200'], desc: '화면 반대편에서 거대한 뼈 용이 달려와 길을 막는 모든 적을 물어뜯고, 끝에서 포효로 화면을 뒤흔든다.',
    act: {
      anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
      start(p) { WS.cutin(p, '뼈 용의 포효', '骨 龍 咆 哮', '232,226,200'); p.invul = 120; p.vx = 0; },
      update(p, f) {
        if (f === 12) {
          const r = Game.room, dir = -p.facing, sx = dir < 0 ? Math.min(r.maxX + 200, Game.cam.x + W + 240) : Math.max(r.minX - 200, Game.cam.x - 240);
          FX.add('world', new WBoneDragon(p, sx, clamp(p.y, 40, DEPTH - 40), dir)); Sfx.play('roar', 0.8, 0.6); Sfx.wlayer('bone', 3, true); Game.flashScreen(0.3, '240,235,215'); p.bladeGlow = 2;
        }
      },
    },
  }),

  // ----------------------------- 음양검 태극 -----------------------------
  w27: ws({
    name: '태극 회전', mp: 140, cd: 9, ico: ['taegeuk', '230,235,255'], desc: '검을 쥔 채 회전한다. 0.2초마다 음(적을 끌어당김)과 양(적을 밀어냄)이 번갈아 바뀌며 주변 적을 계속 벤다.',
    act: {
      anim: 'a1', len: 60, cancel: 50, atkCancel: 50,
      start(p) { Sfx.pplay('swingBig'); p.bladeGlow = 1.2; },
      update(p, f) {
        p.armorF = f < 52; p.trailOn = f < 54; p.vx *= 0.7;
        if (f % 8 === 1) { swingT(p, (f / 8 | 0) % 2 ? 'a2' : 'a1', 1.9); Sfx.pplay('swing', 0.8, 1 + f * 0.004); }
        const pull = ((f / 12) | 0) % 2 === 0;
        if (f % 4 === 0 && f < 54) {
          for (const e of Game.enemies) { if (!e.hittable() || e.isBoss) continue; const dx = e.x - p.x; if (Math.abs(dx) < 260 && Math.abs(e.y - p.y) < 90) { e.x += (pull ? -dx : dx) * 0.14; e.y += (p.y - e.y) * 0.05; } }
          FX.add('ground', new Ring(p.x, sy(p.y, 0), pull ? 160 : 40, pull ? 40 : 170, 14, { col: pull ? '120,150,255' : '255,225,140', w: 6 }));
        }
        if (f % 6 === 0 && f < 54) {
          WS.area(p, p.x, p.y, 170, 70, WH.taegeuk, { hmax: 170 });
          FX.add('world', new Crescent(p.x, sy(p.y, p.z + 70), 110, f * 0.35, f * 0.35 + 2.4, { th: 22, life: 12, col: pull ? '130,160,255' : '255,225,140', core: '255,255,255', sy: 0.42 }));
        }
      },
    },
  }, {
    name: '음양 영역', mp: 480, cd: 42, ico: ['yinyang', '230,235,255'], desc: '좌우에 양(불꽃)과 음(냉기)의 영역을 5초간 펼친다. 양은 적을 태우고, 음은 적을 느리게 하며 내 HP를 회복시킨다. 끝에는 두 영역이 함께 터진다.',
    act: {
      anim: 'ultUp', len: 50, cancel: 40, atkCancel: 34,
      start(p) { WS.cutin(p, '음양 영역', '陰 陽 領 域', '230,235,255'); p.invul = 90; p.vx = 0; },
      update(p, f) {
        if (f === 12) {
          const r = Game.room, lx = clamp(p.x - 260, r.minX + 100, r.maxX - 100), rx = clamp(p.x + 260, r.minX + 100, r.maxX - 100);
          FX.add('ground', new WYin(p, lx, p.y, true)); FX.add('ground', new WYin(p, rx, p.y, false));
          Sfx.wlayer('taegeuk', 3, true); Game.addShake(8); p.bladeGlow = 2; Game.flashScreen(0.3, '240,245,255');
        }
      },
    },
  }),

  // ----------------------------- 마법검 아케인 룬소드 -----------------------------
  w28: ws({
    name: '마나 미사일', mp: 130, cd: 8, ico: ['missiles', '170,140,255'], desc: '유도되는 마력탄 다섯 발을 쏜다. 마력탄은 가까운 적을 쫓아가 터진다.',
    act: {
      anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) {
          Sfx.pplay('swingBig'); Sfx.wlayer('arcane', 3, true);
          for (let i = 0; i < 5; i++) FX.add('world', new WShot(p, p.x + p.facing * 30, p.y + (i - 2) * 14, p.z + 90 + (i % 2) * 20, p.facing * (9 + i), (i - 2) * 1.2, 0, {
            col: '180,150,255', r: 22, life: 150, home: 0.14, trail: true, hd: WH.missile, floor: true,
            onHit: (s, e) => { FX.add('world', new Flash(e.x, sy(e.y, e.z + e.h * 0.5), 8, 90, 12, '170,140,255', 0.9)); Sfx.wlayer('arcane', 1, false); },
          }));
        }
      },
    },
  }, {
    name: '아케인 오버로드', mp: 480, cd: 42, ico: ['overload', '170,140,255'], desc: '5초 동안 마력이 폭주한다. 각성기를 뺀 모든 스킬의 쿨타임이 사라지고 MP가 바닥나지 않으며, 내 피해가 30% 늘어난다.',
    act: {
      anim: 'ultUp', len: 50, cancel: 36, atkCancel: 30,
      start(p) { WS.cutin(p, '아케인 오버로드', 'O V E R L O A D', '170,140,255'); p.invul = 80; p.vx = 0; },
      update(p, f) {
        if (f === 10) { p.overT = 300; p.bladeGlow = 2.5; Sfx.wlayer('arcane', 3, true); Game.flashScreen(0.3, '200,180,255'); FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 300, 24, { col: '170,140,255', w: 12 })); FX.add('top', new WOver(p)); }
      },
    },
  }),

  // ----------------------------- 저주검 헥스 -----------------------------
  w29: ws({
    name: '저주 낙인', mp: 110, cd: 8, ico: ['curse', '170,70,220'], desc: '앞쪽 넓은 범위의 적에게 저주를 세 단계씩 새긴다. 저주가 깊을수록 받는 피해가 커지고, 적은 느려진다.',
    act: {
      anim: 'win', len: 34, cancel: 22, atkCancel: 18,
      update(p, f) {
        p.vx *= 0.5;
        if (f === 8) {
          Sfx.wlayer('curse', 3, true); Game.addShake(4);
          FX.add('ground', new Ring(p.x + p.facing * 220, sy(p.y, 0), 20, 460, 24, { col: '190,90,240', w: 10 }));
          for (const e of Game.enemies) {
            if (!e.hittable() || (e.x - p.x) * p.facing < -60 || Math.abs(e.x - p.x) > 620) continue;
            e.curse = Math.min(6, (e.curse || 0) + 3); Status.add(e, 'slow', { t: 150, m: 0.6 });
            FX.add('top', new Label(e.x, sy(e.y, e.z + e.hurtH()) - 54, `CURSE x${Math.min(5, e.curse)}`, { col: ['#f0d8ff', '#a050e0'], size: 20 }));
            for (let i = 0; i < 5; i++) FX.add('world', new Mote(e.x + rand(-16, 16), sy(e.y, e.z + rand(10, e.h)), rand(-0.4, 0.4), rand(-1.4, -0.4), { col: '170,70,220', life: 40, r: rand(6, 10), grav: 0 }));
          }
        }
      },
    },
  }, {
    name: '저주 폭발', mp: 480, cd: 42, ico: ['hexburst', '170,70,220'], desc: '화면 안 모든 적의 저주가 한꺼번에 터진다. 저주가 깊은 적일수록 큰 피해를 입고, 터진 저주는 이웃한 적에게 번진다.',
    act: {
      anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
      start(p) { WS.cutin(p, '저주 폭발', '詛 咒 爆 發', '170,70,220'); p.invul = 100; p.vx = 0; },
      update(p, f) {
        if (f === 14) {
          Game.flashScreen(0.5, '210,150,255'); Game.addShake(14); Sfx.wlayer('curse', 3, true); Sfx.play('explode', 0.8); p.bladeGlow = 2;
          for (const e of WS.onScreen()) {
            const st = Math.max(2, Math.min(5, e.curse || 0)), mul = 0.8 + st * 1.5;
            FX.add('world', new Pillar(e.x, e.y, 46, 460, 22, '170,70,220', '240,210,255'));
            applyHit(p, e, WS.hd({ dmg: 4 * mul, kx: 5, kz: 9, airKz: 8, stun: 60, stop: 8 + st, shake: 8, fx: 'none', power2: 2 }), { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
            for (const o of WS.nearest(e.x, e.y, 3, 300, e)) o.curse = Math.min(5, (o.curse || 0) + 1);
            e.curse = 0;
          }
        }
      },
    },
  }),

  // ----------------------------- 수정검 프리즘 -----------------------------
  w30: ws({
    name: '빛 굴절', mp: 130, cd: 8, ico: ['prismray', '200,235,255'], desc: '칼끝에서 나간 빛이 프리즘을 지나 세 갈래 광선으로 갈라져 앞의 적들을 꿰뚫는다.',
    act: {
      anim: 'a3', len: 34, cancel: 22, atkCancel: 18,
      update(p, f) {
        p.vx *= 0.5;
        if (f === 8) {
          const d = p.facing, cols = ['255,90,110', '255,235,120', '90,200,255'];
          Sfx.pplay('swingBig'); Sfx.wlayer('prism', 3, true); Game.flashScreen(0.15, '240,250,255'); p.bladeGlow = 2;
          [-70, 0, 70].forEach((off, i) => {
            const ly = clamp(p.y + off, 0, DEPTH);
            FX.add('world', new CutLine(p.x + d * 480, sy(ly, 80), d > 0 ? 0 : Math.PI, 520, 6, cols[i], 16));
            WS.area(p, p.x + d * 480, ly, 520, 44, WH.prism, { hmax: 240 });
          });
          FX.add('world', new Flash(p.x + d * 60, sy(p.y, 80), 10, 110, 14, '255,255,255', 0.9));
        }
      },
    },
  }, {
    name: '수정 감옥', mp: 480, cd: 42, ico: ['crystalcage', '200,235,255'], desc: '가까운 적 최대 6명을 거대한 수정에 가둔다. 갇힌 적은 2.5초 동안 움직이지 못하고 계속 베이다가, 수정이 부서지며 무지갯빛으로 폭발한다. (보스는 느려진다)',
    act: {
      anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
      start(p) { WS.cutin(p, '수정 감옥', '水 晶 監 獄', '200,235,255'); p.invul = 100; p.vx = 0; },
      update(p, f) {
        if (f === 12) {
          Sfx.wlayer('prism', 3, true); Game.flashScreen(0.3, '230,248,255'); Game.addShake(8); p.bladeGlow = 2;
          for (const e of WS.nearest(p.x, p.y, 6, 760)) FX.add('world', new WCrystal(p, e));
        }
      },
    },
  }),

  // ----------------------------- 사이버 레이저블레이드 -----------------------------
  w31: ws({
    name: '드론 호출', mp: 130, cd: 9, ico: ['drone', '90,255,230'], desc: '전투 드론 두 대를 호출한다. 드론은 5초 동안 내 곁을 돌며 가장 가까운 적에게 레이저를 쏜다.',
    act: {
      anim: 'win', len: 30, cancel: 16, atkCancel: 14,
      update(p, f) { p.vx *= 0.5; if (f === 6) { Sfx.wlayer('cyber', 3, true); Game.flashScreen(0.12, '180,255,245'); FX.add('world', new WDrone(p, 0)); FX.add('world', new WDrone(p, 1)); FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 150, 16, { col: '90,255,230', w: 6 })); } },
    },
  }, {
    name: '궤도 레이저', mp: 480, cd: 42, ico: ['orbital', '90,255,230'], desc: '위성에서 궤도 레이저를 쏜다. 예고선이 나타난 뒤 화면 곳곳(적이 있는 곳 우선)에 광선이 차례로 내리꽂혀 세로줄 전체를 불태운다.',
    act: {
      anim: 'ultUp', len: 80, cancel: 66, atkCancel: 56,
      start(p) { WS.cutin(p, '궤도 레이저', 'O R B I T A L', '90,255,230'); p.invul = 150; p.vx = 0; },
      update(p, f) {
        if (f === 10) {
          p.bladeGlow = 2; Sfx.wlayer('cyber', 3, false);
          const xs = WS.onScreen().map(e => e.x).sort(() => Math.random() - 0.5).slice(0, 6), r = Game.room;
          while (xs.length < 6) xs.push(clamp(p.x + p.facing * rand(120, 700), r.minX + 60, r.maxX - 60));
          xs.forEach((x, i) => FX.add('world', new WOrbital(p, x, DEPTH / 2, i * 8)));
        }
      },
    },
  }),

  // ----------------------------- 용아검 드라고닉 팽 -----------------------------
  w32: ws({
    name: '용의 숨결', mp: 150, cd: 9, ico: ['breath', '255,140,50'], desc: '숨을 들이마셨다가 앞으로 거대한 불길을 내뿜는다. 부채꼴로 퍼진 불길이 닿은 적을 계속 태운다.',
    act: {
      anim: 'a3', len: 60, cancel: 52, atkCancel: 52,
      start(p) { p.vx = 0; Sfx.wlayer('dragon', 1, false); },
      update(p, f) {
        p.vx = 0; p.vy = 0;
        if (f < 10) { p.bladeGlow = 0.6 + f * 0.1; }
        if (f === 10) { swingT(p, 'a3', 1.2); FX.add('world', new WBreath(p)); Sfx.wlayer('dragon', 3, true); Sfx.play('roar', 0.5, 0.8); Game.flashScreen(0.15, '255,200,120'); }
        if (f > 10 && f < 50) p.bladeGlow = 2;
      },
    },
  }, {
    name: '용의 분노', mp: 480, cd: 42, ico: ['dragonrage', '255,140,50'], desc: '6초 동안 용의 힘이 깃든다. 내 피해가 50% 늘고 동작이 빨라지며, 적을 벨 때마다 불덩이가 주변 적에게 튀어 불태운다.',
    act: {
      anim: 'ultUp', len: 50, cancel: 36, atkCancel: 30,
      start(p) { WS.cutin(p, '용의 분노', '龍 의 怒', '255,140,50'); p.invul = 90; p.vx = 0; },
      update(p, f) {
        if (f === 10) {
          p.rageT = 360; p.hasteT = Math.max(p.hasteT || 0, 360); p.bladeGlow = 2.5;
          Sfx.play('roar', 1, 0.7); Sfx.wlayer('dragon', 3, true); Game.addShake(10); Game.flashScreen(0.35, '255,170,90');
          FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 320, 24, { col: '255,140,50', w: 14 })); FX.add('world', new WAura(p, 'rageT', '255,130,40'));
        }
      },
    },
  }),

  // ----------------------------- 레퀴엠 바이올린검 -----------------------------
  w33: ws({
    name: '음파 충격', mp: 120, cd: 8, ico: ['soundwave', '210,180,255'], desc: '검을 켜면 부채꼴 음파가 퍼져 나간다. 앞의 모든 적이 크게 밀려나고 잠시 기절한다.',
    act: {
      anim: 'a2', len: 36, cancel: 22, atkCancel: 18,
      update(p, f) {
        p.vx *= 0.5;
        if (f === 8) {
          const d = p.facing; Sfx.pplay('swingBig'); Sfx.wlayer('requiem', 3, true); Game.addShake(7);
          for (let i = 0; i < 3; i++) FX.add('ground', new Ring(p.x + d * (60 + i * 40), sy(p.y, 0), 20, 220 + i * 60, 18 + i * 3, { col: '210,180,255', w: 8 - i * 2 }));
          _pm(p.x + d * 200, sy(p.y, 80), 14, ['200,170,255', '255,230,150'], { sx: 160, sy: 40, r0: 6, r1: 10 });
          WS.area(p, p.x + d * 260, p.y, 300, 100, WS.hd({ dmg: 3.4, kx: 15, kz: 3, airKz: 4, stun: 60, stop: 6, shake: 6, fx: 'blunt', power: 1.5 }), { each: e => Status.add(e, 'shock', { t: 40 }) });
        }
      },
    },
  }, {
    name: '교향곡', mp: 480, cd: 42, ico: ['symphony', '210,180,255'], desc: '4악장을 연주한다. 1악장 적이 느려지고, 2악장 음파가 적을 때리고, 3악장 HP · MP가 차오르고, 4악장 점점 격렬해지다 마지막 한 음에 모든 적이 터진다.',
    act: {
      anim: 'ultUp', len: 50, cancel: 40, atkCancel: 34,
      start(p) { WS.cutin(p, '교향곡', 'S Y M P H O N Y', '210,180,255'); p.invul = 90; p.vx = 0; },
      update(p, f) { if (f === 10) { p.bladeGlow = 2; Sfx.wlayer('requiem', 3, false); FX.add('top', new WSymph(p)); } },
    },
  }),
});

// ---------- 스킬 아이콘 ----------
{
  const g1 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => { g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke(); g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke(); };
    const fill = (fn, a = 1) => { g.fillStyle = C(a); g.beginPath(); fn(); g.fill(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'candybomb': fill(() => g.arc(24, 26, 13, 0, TAU), 0.9); line(() => g.arc(24, 26, 6, 0.4, 5.4), 2); line(() => { g.moveTo(30, 14); g.lineTo(36, 6); }, 2); break;
      case 'heartcandy': fill(() => { g.moveTo(24, 40); g.bezierCurveTo(4, 26, 8, 8, 24, 16); g.bezierCurveTo(40, 8, 44, 26, 24, 40); }); line(() => { g.moveTo(14, 20); g.lineTo(20, 18); }, 1.6); break;
      case 'shieldbash': fill(() => { g.moveTo(18, 8); g.lineTo(38, 12); g.lineTo(38, 28); g.quadraticCurveTo(30, 40, 18, 42); g.quadraticCurveTo(10, 28, 18, 8); }, 0.9); line(() => { g.moveTo(4, 24); g.lineTo(14, 24); g.moveTo(4, 16); g.lineTo(12, 18); g.moveTo(4, 32); g.lineTo(12, 30); }, 2); break;
      case 'fortress': fill(() => { g.rect(8, 22, 32, 20); }, 0.9); for (let i = 0; i < 4; i++) fill(() => g.rect(8 + i * 9, 14, 5, 8)); line(() => { g.moveTo(20, 42); g.lineTo(20, 32); g.lineTo(28, 32); g.lineTo(28, 42); }, 1.6); break;
      case 'skull': fill(() => { g.arc(24, 22, 14, 0, TAU); g.rect(17, 28, 14, 12); }, 0.95); g.fillStyle = '#05050c'; g.beginPath(); g.arc(18, 22, 4, 0, TAU); g.arc(30, 22, 4, 0, TAU); g.fill(); g.fillRect(22, 28, 4, 5); break;
      case 'bonedragon': line(() => { g.moveTo(4, 36); g.bezierCurveTo(12, 20, 20, 40, 28, 24); g.lineTo(36, 14); }, 3); fill(() => { g.moveTo(34, 10); g.lineTo(46, 14); g.lineTo(38, 22); }); for (let i = 0; i < 3; i++) line(() => { g.moveTo(10 + i * 7, 30 - i * 2); g.lineTo(8 + i * 7, 40); }, 1.4); break;
      case 'taegeuk': line(() => g.arc(24, 24, 16, 0, TAU), 2); fill(() => { g.arc(24, 24, 16, -Math.PI / 2, Math.PI / 2); g.arc(24, 32, 8, Math.PI / 2, -Math.PI / 2, true); g.arc(24, 16, 8, Math.PI / 2, -Math.PI / 2); }, 0.9); break;
      case 'yinyang': fill(() => g.arc(15, 24, 10, 0, TAU), 0.9); line(() => g.arc(34, 24, 9, 0, TAU), 2.4); line(() => { g.moveTo(24, 6); g.lineTo(24, 42); }, 1.4); break;
      case 'missiles': for (let i = 0; i < 4; i++) { fill(() => g.arc(34 - i * 4, 12 + i * 9, 4, 0, TAU)); line(() => { g.moveTo(30 - i * 4, 12 + i * 9); g.lineTo(6, 24 + (i - 1.5) * 4); }, 1.4); } break;
      case 'overload': line(() => g.arc(24, 24, 16, 0.4, 5.9), 2.4); fill(() => { g.moveTo(28, 6); g.lineTo(16, 26); g.lineTo(24, 26); g.lineTo(20, 42); g.lineTo(34, 20); g.lineTo(26, 20); }); break;
      case 'curse': fill(() => g.arc(24, 24, 15, 0, TAU), 0.7); g.fillStyle = '#05050c'; g.beginPath(); g.arc(18, 22, 3.4, 0, TAU); g.arc(30, 22, 3.4, 0, TAU); g.fill(); line(() => { g.moveTo(16, 32); g.quadraticCurveTo(24, 38, 32, 32); }, 1.6); break;
      case 'hexburst': for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; line(() => { g.moveTo(24 + Math.cos(a) * 6, 24 + Math.sin(a) * 6); g.lineTo(24 + Math.cos(a) * 19, 24 + Math.sin(a) * 19); }, 2); } fill(() => g.arc(24, 24, 6, 0, TAU)); break;
      case 'prismray': fill(() => { g.moveTo(24, 6); g.lineTo(38, 36); g.lineTo(10, 36); }, 0.6); line(() => { g.moveTo(2, 30); g.lineTo(18, 28); }, 2); for (let i = 0; i < 3; i++) line(() => { g.moveTo(30, 28 + (i - 1) * 3); g.lineTo(46, 28 + (i - 1) * 9); }, 1.8); break;
      case 'crystalcage': fill(() => { g.moveTo(24, 4); g.lineTo(38, 18); g.lineTo(34, 42); g.lineTo(14, 42); g.lineTo(10, 18); }, 0.5); line(() => { g.moveTo(24, 4); g.lineTo(24, 42); g.moveTo(10, 18); g.lineTo(38, 18); }, 1.6); break;
      case 'drone': fill(() => g.ellipse(24, 24, 15, 9, 0, 0, TAU), 0.9); g.fillStyle = '#05050c'; g.beginPath(); g.arc(24, 24, 4, 0, TAU); g.fill(); line(() => { g.moveTo(9, 15); g.lineTo(2, 8); g.moveTo(39, 15); g.lineTo(46, 8); g.moveTo(24, 33); g.lineTo(24, 44); }, 2); break;
      case 'orbital': line(() => { g.moveTo(24, 2); g.lineTo(24, 38); }, 5); fill(() => g.ellipse(24, 40, 16, 5, 0, 0, TAU), 0.8); for (const x of [10, 38]) line(() => { g.moveTo(x, 8); g.lineTo(x, 36); }, 1.4); break;
      case 'breath': fill(() => { g.moveTo(4, 24); g.lineTo(44, 6); g.lineTo(44, 42); }, 0.8); fill(() => { g.moveTo(4, 24); g.lineTo(36, 14); g.lineTo(36, 34); }, 0.9); break;
      case 'dragonrage': fill(() => { g.moveTo(24, 4); g.quadraticCurveTo(44, 24, 30, 42); g.quadraticCurveTo(24, 34, 18, 42); g.quadraticCurveTo(4, 24, 24, 4); }, 0.9); g.fillStyle = '#05050c'; g.beginPath(); g.moveTo(24, 24); g.lineTo(20, 14); g.lineTo(28, 14); g.fill(); break;
      case 'soundwave': for (let i = 0; i < 3; i++) line(() => g.arc(8, 24, 12 + i * 9, -0.9, 0.9), 2.4); fill(() => g.arc(8, 24, 4, 0, TAU)); break;
      case 'symphony': for (let i = 0; i < 5; i++) line(() => { g.moveTo(4, 12 + i * 6); g.lineTo(44, 12 + i * 6); }, 1); fill(() => g.ellipse(14, 34, 5, 3.6, -0.4, 0, TAU)); fill(() => g.ellipse(32, 26, 5, 3.6, -0.4, 0, TAU)); line(() => { g.moveTo(18, 33); g.lineTo(18, 12); g.moveTo(36, 25); g.lineTo(36, 8); }, 1.6); break;
      default: g1.call(this, g, kind, col);
    }
  };
}

// ============================================================
//  등록
// ============================================================
for (const w of WEAPONS_NEW2) WEAPONS.push(w);
for (const a of ARMORS_NEW2) ARMORS.push(a);
WEAPONS.sort(_byPrice); ARMORS.sort(_byPrice);
for (const w of WEAPONS) WEAPON_BY_ID[w.id] = w;
for (const a of ARMORS) ARMOR_BY_ID[a.id] = a;
for (const id in WSK) {
  const W0 = WEAPON_BY_ID[id];
  if (!W0 || W0.skills) continue;
  W0.skills = WSK[id];
  for (const k of ['s5', 's6']) { const s = WSK[id][k]; s.icon = 'ws_' + id + '_' + k; s.act.isSkill = true; s.act.name = id + k; }
}
