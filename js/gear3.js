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

// w24~w33 스킬 · 이펙트는 forge_5.js · forge_6.js 에서 정의한다.

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
