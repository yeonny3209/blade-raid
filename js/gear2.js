'use strict';
// ============================================================
//  추가 장비 : 검 6종 + 방어구 4종
//   기존 장비와 다른 콘셉트 (거합도 · 덩굴 · 주사위 · 해적 · 증기 · 태양) + 검마다 고유 스킬 2개
//   가격 / 성능은 비슷한 가격대의 기존 장비와 맞춘다.  상점 목록은 (지역, 가격) 순으로 정렬된다.
// ============================================================

// ---------- 타격 파편 ----------
Object.assign(PART, {
  iai(x, y, z, d, pw, b) {                                    // 거합 : 가늘고 하얀 일섬 두 줄
    const X = x, Y = sy(y, z);
    FX.add('world', new CutLine(X, Y, d > 0 ? -0.35 : Math.PI + 0.35, 118 + pw * 14, 3, '235,245,255', 10));
    FX.add('world', new CutLine(X, Y, d > 0 ? 0.3 : Math.PI - 0.3, 72, 2, '200,220,255', 8));
    Hitfx.sparks(X, Y, d, Math.round(5 * b), { col: '235,245,255', spread: 1.4 });
  },
  leaf(x, y, z, d, pw, b) {                                   // 덩굴 : 잎사귀와 꽃잎이 흩날린다
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((6 + pw) * b); i++) FX.add('world', new Mote(X + rand(-14, 14), Y + rand(-10, 10), rand(-1.5, 1.5) + d * 0.8, rand(-2.2, 0.4), { col: choose(['120,210,70', '170,235,100', '255,170,200']), life: 42, r: rand(4, 7), grav: 0.04 }));
    FX.add('world', new Flash(X, Y, 8, 54, 10, '150,230,90', 0.45));
  },
  dice(x, y, z, d, pw, b) {                                   // 주사위 : 하얀 큐브 조각이 튄다
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((5 + pw) * b); i++) FX.add('world', new Debris(x + rand(-8, 8), y, z + rand(-6, 6), { vx: d * rand(1, 6) + rand(-2, 2), vz: rand(4, 10), s: rand(3, 5), col: ['#ffffff', '#e8e8e8', '#d02030'], life: 44 }));
    Hitfx.sparks(X, Y, d, Math.round(4 * b), { col: '255,90,90', spread: 1.5 });
  },
  coin(x, y, z, d, pw, b) {                                   // 해적 : 금화가 튀어 오른다
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((6 + pw * 2) * b); i++) FX.add('world', new Debris(x + rand(-8, 8), y, z + rand(-6, 6), { vx: d * rand(1, 7) + rand(-2, 2), vz: rand(5, 12), s: rand(3, 4.5), col: ['#ffd24a', '#f0b020', '#fff0a0'], glow: '255,210,80', life: 46 }));
    FX.add('world', new Flash(X, Y, 8, 60, 10, '255,210,80', 0.5));
  },
  steam(x, y, z, d, pw, b) {                                  // 증기 : 하얀 김이 뿜어져 나온다
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((5 + pw) * b); i++) FX.add('world', new Mote(X + rand(-12, 12), Y + rand(-8, 8), rand(-1.2, 1.2) + d * 1.2, rand(-1.6, -0.2), { col: '235,235,235', life: 38, r: rand(8, 14), grav: 0 }));
    Hitfx.sparks(X, Y, d, Math.round(4 * b), { col: '255,200,120', spread: 1.5 });
    FX.add('world', new Ring(X, Y, 8, 70 + pw * 10, 12, { col: '230,230,230', w: 4, ry: 1 }));
  },
  sun(x, y, z, d, pw, b) {                                    // 태양 : 눈부신 빛줄기
    const X = x, Y = sy(y, z);
    FX.add('world', new Flash(X, Y, 10, 96, 14, '255,225,110', 0.75));
    for (let i = 0; i < 6; i++) FX.add('world', new CutLine(X, Y, i / 6 * Math.PI, 70 + pw * 10, 3, '255,235,140', 10));
    Hitfx.sparks(X, Y, d, Math.round(5 * b), { col: '255,240,170', spread: 1.7 });
  },
});

// ============================================================
//  검 6종
// ============================================================
const WEAPONS_NEW = [
  {
    id: 'w18', name: '거합도 무라사메', sub: '뽑는 순간 승부가 끝나는 검', price: 38000, map: 1,
    atk: 1.07, crit: 0.05, stop: 0.9, shake: 0.9, col: '230,240,255', snd: 'katana', part: 'iai', pitch: 1.1, swingPitch: 1.2,
    feel: '맑은 쇳소리와 가늘고 하얀 일섬', desc: '3초 이상 공격하지 않다가 치는 첫 일격은 피해 +90% (일섬). 치명타율 +5%.',
    look: { c: ['#262a36', '#c8d0dc', '#ffffff'], hw: 2.3, L: 1.12, edge: 'plain', tip: 'curve', guard: 'ring', glow: '225,238,255', rune: '220,235,255', trim: ['#2a2a2a', '#7a6a3a', '#d8c070'], taper: 0.02 },
    amb: ['mote', '225,238,255', 0.1],
    mod(p) {
      const first = Game.frame - (p.lastHitF || -999) > 180;
      if (first) p.iaiF = Game.frame;
      return first || p.iaiF === Game.frame ? 1.9 : 1;
    },
    hit(p, t) {
      if (p.iaiF === Game.frame && p.iaiL !== Game.frame) {
        p.iaiL = Game.frame;
        FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, '一 閃', { col: ['#ffffff', '#9ad0ff'], size: 24 }));
        Sfx.wlayer('katana', 3, true);
      }
      p.lastHitF = Game.frame;
    },
  },
  {
    id: 'w19', name: '덩굴검 쏜베인', sub: '숲이 벼려낸 가시 달린 목검', price: 95000, map: 1,
    atk: 1.12, stop: 1.0, col: '150,230,90', snd: 'thorn', part: 'leaf', pitch: 0.95, swingPitch: 0.98,
    feel: '나무가 꺾이는 소리와 흩날리는 잎', desc: '4번째 적중마다 덩굴이 뻗어 주변 적을 0.9초 붙잡고 40% 피해. 처치 시 HP 2% 회복.',
    look: { c: ['#2e2210', '#7a5a2c', '#d0b070'], hw: 3.9, L: 1.02, edge: 'saw', tip: 'spike', guard: 'claw', glow: '140,230,90', rune: '255,160,205', trim: ['#2a4a18', '#5aa030', '#c8f090'] },
    amb: ['leaf', '150,220,90', 0.18],
    hit(p, t, dmg) {
      if (_n(p, 'vc') % 4 !== 0) return;
      FX.add('world', new FVine(t.x, t.y, { life: 46, n: 2, h: 90 }));
      Sfx.wlayer('thorn', 2, true);
      for (const e of [t, ...Gear.near(p, t, 170)]) { Gear.proc(p, e, 0.4, { quiet: true }); Status.add(e, 'shock', { t: 54 }); }
    },
    kill(p) { Gear.heal(p, p.hpMax * 0.02, true); },
  },
  {
    id: 'w20', name: '운명의 주사위검 다이스', sub: '굴려봐야 아는 칼날', price: 235000, map: 1,
    atk: 1.12, stop: 1.05, shake: 1.1, col: '255,90,90', snd: 'dice', part: 'dice', pitch: 1.0, swingPitch: 1.05,
    feel: '주사위 구르는 딸깍 소리', desc: '적중마다 주사위를 굴려 피해 x0.6 ~ x2.0 (평균 x1.18). 6이 나오면 금화가 튀어 오른다.',
    look: { c: ['#6a1010', '#f0f0f0', '#ffffff'], hw: 5.6, L: 0.95, edge: 'notch', tip: 'cleave', guard: 'cross', glow: '255,90,90', rune: '255,255,255', trim: ['#4a0a0a', '#d02030', '#ff8a8a'] },
    amb: ['spark', '255,230,230', 0.1],
    mod(p) { const n = randi(1, 6); p.diceN = n; p.diceF = Game.frame; return [0.6, 0.8, 1, 1.2, 1.5, 2][n - 1]; },
    hit(p, t) {
      if (p.diceN === 6 && p.diceL !== Game.frame) {
        p.diceL = Game.frame;
        FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, 'LUCKY 6', { col: ['#ffffff', '#ff5a5a'], size: 22 }));
        for (let i = 0; i < 2; i++) Game.pickups.push(new Pickup('gold', t.x, t.y, 40, randi(40, 90)));
      }
    },
  },
  {
    id: 'w21', name: '해적 곡도 블랙펄', sub: '바다를 뒤집은 선장의 칼', price: 900000, map: 2,
    atk: 1.3, stop: 1.1, shake: 1.2, col: '255,205,70', snd: 'coin', part: 'coin', pitch: 1.05, swingPitch: 1.0,
    feel: '짤랑이는 금화와 묵직한 곡도', desc: '적을 처치하면 금화 주머니를 터뜨려 금화가 추가로 떨어진다(골드 획득량 약 2배).',
    look: { c: ['#3a2a1a', '#b8a070', '#fff0c0'], hw: 4.7, L: 1.0, edge: 'plain', tip: 'curve', guard: 'wing', glow: '255,210,80', rune: '255,215,90', trim: ['#6a4a10', '#e8b830', '#fff0a0'] },
    amb: ['star', '255,215,90', 0.14],
    kill(p, t) {
      const D = Game.dungeon.def, base = D.tower ? 1.6 + (Game.roomIdx + 1) * 0.15 : (Game.dungeonIdx >= 10 ? 4.5 : 1.6);
      const per = Math.max(1, Math.round(randi(40, 120) * base * Diff.cur().gold * 0.8));
      for (let i = 0; i < 4; i++) Game.pickups.push(new Pickup('gold', t.x, t.y, 50 + 20 * i, per));
      FX.add('world', new Flash(t.x, sy(t.y, 50), 10, 80, 12, '255,215,90', 0.7)); Sfx.wlayer('coin', 1, false);
    },
  },
  {
    id: 'w22', name: '증기 기관검 스팀하트', sub: '심장 대신 보일러가 뛰는 칼', price: 1500000, map: 2,
    atk: 1.35, stop: 1.2, shake: 1.2, kx: 1.2, move: 0.97, col: '255,190,120', snd: 'steam', part: 'steam', pitch: 0.9, swingPitch: 0.9,
    feel: '쉭 하고 뿜는 증기와 쇳덩이 소리', desc: '적중마다 압력이 쌓인다. 8에 도달하면 증기가 폭발해 주변 적에게 120% 피해와 화상. 이동속도 -3%.',
    look: { c: ['#2a1c14', '#8a5a3a', '#f0c090'], hw: 5.4, L: 0.98, edge: 'notch', tip: 'cleave', guard: 'cross', glow: '255,200,140', rune: '255,170,90', trim: ['#4a2a10', '#c87a30', '#ffd090'], taper: 0.03 },
    amb: ['steam', '235,235,235', 0.2],
    hit(p, t, dmg) {
      p.press = (p.press || 0) + 1;
      if (p.press < 8) return;
      p.press = 0;
      const X = t.x, gy = sy(t.y, 0);
      FX.add('world', new Flash(X, gy - 40, 20, 200, 18, '255,255,255', 0.8));
      FX.add('ground', new Ring(X, gy, 20, 230, 22, { col: '235,235,235', w: 12 }));
      for (let i = 0; i < 14; i++) FX.add('world', new Mote(X + rand(-50, 50), gy - rand(10, 80), rand(-2, 2), rand(-2, -0.4), { col: '240,240,240', life: 44, r: rand(10, 18), grav: 0 }));
      Sfx.wlayer('steam', 3, true); Sfx.play('explode', 0.5); Game.addShake(7);
      FX.add('top', new Label(X, sy(t.y, t.z + t.hurtH()) - 54, 'STEAM BLAST', { col: ['#ffffff', '#ffb070'], size: 22 }));
      for (const e of [t, ...Gear.near(p, t, 240)]) { Gear.proc(p, e, 1.2, { quiet: true, hit: { dmg: 0.8, kx: 6, kz: 5, stun: 30 } }); Status.add(e, 'burn', { t: 120, d: dmg * 0.08 }); }
    },
  },
  {
    id: 'w23', name: '태양신의 곡도 라 솔레이', sub: '정오의 해를 벼려 만든 칼날', price: 2200000, map: 2,
    atk: 1.42, crit: 0.06, stop: 1.1, col: '255,222,100', snd: 'sun', part: 'sun', pitch: 1.12, swingPitch: 1.08,
    feel: '밝은 금관 소리와 눈부신 빛줄기', desc: 'HP가 80% 이상이면 피해 +25% (정오의 힘). 적중한 적은 일사병으로 2초간 화상을 입는다.',
    look: { c: ['#8a5a10', '#ffd860', '#ffffff'], hw: 5.2, L: 1.1, edge: 'crystal', tip: 'round', guard: 'ring', glow: '255,225,100', rune: '255,230,120', trim: ['#7a4a10', '#f0b020', '#fff0a0'] },
    amb: ['mote', '255,230,120', 0.2],
    mod(p) { return p.hp / p.hpMax >= 0.8 ? 1.25 : 1; },
    hit(p, t, dmg) { Status.add(t, 'burn', { t: 120, d: dmg * 0.07 }); },
  },
];

// ============================================================
//  방어구 4종
// ============================================================
const ARMORS_NEW = [
  {
    id: 'a12', name: '사무라이 갑주 오오요로이', sub: '무사가 입던 겹겹의 철갑', price: 100000, map: 1,
    def: 0.15, hp: 1.14, move: 0.97, kbRes: 0.35, desc: '받는 피해 -15%, 최대 HP +14%, 피격 시 밀려나는 거리 35% 감소. 이동속도 -3%.',
    look: { coat: ['#1c0a0a', '#7a1c1c', '#c04040'], metal: ['#2a2a34', '#5a5a6e', '#a8a8c0'], deco: 'samurai', dc: ['#2a2a34', '#6a6a82', '#c0c0d8'], trim: ['#7a5a10', '#d8aa38', '#fff0a8'] },
  },
  {
    id: 'a13', name: '드루이드의 숲옷', sub: '숲이 직접 짜준 이끼 옷', price: 210000, map: 1,
    def: 0.08, hp: 1.12, mpRegen: 1.4, regen: 0.012, desc: '받는 피해 -8%, 최대 HP +12%, MP 재생 +40%. 3초간 맞지 않으면 초당 HP 1.2% 회복.',
    look: { coat: ['#0e2410', '#2c6a30', '#6ab048'], metal: ['#3a2a14', '#7a5a2c', '#c8a860'], deco: 'druid', dc: ['#1c4a1c', '#3a8a3a', '#9ae070'], glow: '140,230,100' },
  },
  {
    id: 'a14', name: '해적 선장의 코트', sub: '파도 위에서 닳은 붉은 외투', price: 700000, map: 2,
    def: 0.12, hp: 1.1, move: 1.08, dodge: 0.12, desc: '12% 확률로 공격을 회피. 이동속도 +8%, 받는 피해 -12%, 최대 HP +10%.',
    look: { coat: ['#1a0c0c', '#6a1010', '#c02828'], metal: ['#2a1a10', '#5a3a1c', '#a07038'], deco: 'pirate', dc: ['#220c0c', '#7a1414', '#d03a3a'], trim: ['#6a4a10', '#e8b830', '#fff0a0'] },
  },
  {
    id: 'a15', name: '증기 외골격 스팀가드', sub: '압력으로 움직이는 구리 갑옷', price: 1600000, map: 2,
    def: 0.3, hp: 1.32, move: 0.96, thorns: true, desc: '받는 피해 -30%, 최대 HP +32%. 근접 공격한 적에게 증기 파편으로 반격(내 공격력의 35%). 이동속도 -4%.',
    look: { coat: ['#1a1410', '#5a3a22', '#9a6a3c'], metal: ['#4a2a14', '#b87030', '#f0b870'], deco: 'steam', dc: ['#3a2410', '#a86a30', '#f0c080'], glow: '255,190,120', trim: ['#4a2a10', '#c87a30', '#ffd090'] },
  },
];

// w18~w23 스킬 · 이펙트는 forge_4.js 에서 정의한다.

// ---------- 스킬 아이콘 ----------
{
  const g0 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => {
      g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke();
      g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke();
    };
    const fill = (fn, a = 1) => { g.fillStyle = C(a); g.beginPath(); fn(); g.fill(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'iai': line(() => { g.moveTo(4, 30); g.lineTo(44, 18); }, 3); line(() => { g.moveTo(8, 38); g.lineTo(36, 30); }, 1.6); fill(() => g.arc(40, 16, 3, 0, TAU), 0.8); break;
      case 'stance': line(() => g.arc(24, 24, 16, 0, TAU), 2); fill(() => g.arc(24, 24, 7, 0, TAU), 0.9); line(() => { g.moveTo(24, 4); g.lineTo(24, 12); g.moveTo(24, 36); g.lineTo(24, 44); }, 2); break;
      case 'vine': for (let i = 0; i < 3; i++) line(() => { g.moveTo(10 + i * 14, 44); g.bezierCurveTo(4 + i * 14, 30, 18 + i * 14, 22, 12 + i * 14, 8); }, 2.4); break;
      case 'tree': fill(() => { g.rect(21, 22, 6, 22); }, 0.8); fill(() => { g.arc(24, 18, 14, 0, TAU); }, 0.9); fill(() => { g.arc(12, 24, 8, 0, TAU); g.arc(36, 24, 8, 0, TAU); }, 0.7); break;
      case 'dice': line(() => { g.rect(10, 10, 28, 28); }, 2.4); for (const [x, y] of [[18, 18], [30, 30], [18, 30], [30, 18]]) fill(() => g.arc(x, y, 3, 0, TAU)); break;
      case 'slot': line(() => { g.rect(6, 12, 36, 24); }, 2.2); for (let i = 0; i < 3; i++) fill(() => g.arc(15 + i * 9, 24, 3.4, 0, TAU)); line(() => { g.moveTo(44, 14); g.lineTo(44, 26); }, 2); break;
      case 'cannon': fill(() => { g.moveTo(6, 30); g.lineTo(30, 18); g.lineTo(36, 28); g.lineTo(12, 40); }); fill(() => g.arc(12, 38, 6, 0, TAU), 0.8); fill(() => g.arc(40, 12, 5, 0, TAU), 0.9); break;
      case 'chest': fill(() => { g.rect(8, 22, 32, 20); }, 0.9); fill(() => { g.moveTo(8, 22); g.quadraticCurveTo(24, 4, 40, 22); }, 0.7); for (let i = 0; i < 3; i++) fill(() => g.arc(14 + i * 10, 12 - (i % 2) * 4, 3, 0, TAU)); break;
      case 'gear': fill(() => { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 11 : 17; g.lineTo(24 + Math.cos(a) * r, 24 + Math.sin(a) * r); } }, 0.9); g.fillStyle = '#05050c'; g.beginPath(); g.arc(24, 24, 5, 0, TAU); g.fill(); break;
      case 'gun': fill(() => { g.rect(6, 18, 30, 8); }, 0.9); for (let i = 0; i < 3; i++) line(() => { g.moveTo(38, 20 + i * 3); g.lineTo(46, 20 + i * 3); }, 1.4); fill(() => { g.rect(12, 26, 8, 14); }, 0.7); break;
      case 'beam': line(() => { g.moveTo(4, 24); g.lineTo(44, 24); }, 5); fill(() => g.arc(8, 24, 7, 0, TAU)); break;
      case 'sun': fill(() => g.arc(24, 24, 9, 0, TAU)); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; line(() => { g.moveTo(24 + Math.cos(a) * 13, 24 + Math.sin(a) * 13); g.lineTo(24 + Math.cos(a) * 20, 24 + Math.sin(a) * 20); }, 2.2); } break;
      default: g0.call(this, g, kind, col);
    }
  };
}

// ============================================================
//  등록 : 목록에 합치고 (지역, 가격) 순으로 정렬 + 스킬 연결
// ============================================================
for (const w of WEAPONS_NEW) WEAPONS.push(w);
for (const a of ARMORS_NEW) ARMORS.push(a);
const _byPrice = (a, b) => (a.map - b.map) || (a.price - b.price);
WEAPONS.sort(_byPrice); ARMORS.sort(_byPrice);
for (const w of WEAPONS) WEAPON_BY_ID[w.id] = w;
for (const a of ARMORS) ARMOR_BY_ID[a.id] = a;
for (const id in WSK) {
  const W0 = WEAPON_BY_ID[id];
  if (!W0 || W0.skills) continue;
  W0.skills = WSK[id];
  for (const k of ['s5', 's6']) { const s = WSK[id][k]; s.icon = 'ws_' + id + '_' + k; s.act.isSkill = true; s.act.name = id + k; }
}
