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
      FX.add('world', new WVines(t.x, t.y, { life: 46 }));
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

// ============================================================
//  스킬 전용 이펙트
// ============================================================

// 칼날 주위에 퍼지는 기운 (무념무상 : 반격 자세 표시)
class WAura {
  constructor(p, key, col) { Object.assign(this, { p, key, col, t: 0, add: true }); }
  update() { this.t++; return this.p[this.key] > 0 && this.p.hp > 0; }
  draw(ctx) {
    const p = this.p, X = p.x, Y = sy(p.y, p.z + 70), pu = 0.6 + Math.sin(this.t * 0.2) * 0.25;
    drawGlow(ctx, X, Y, 130, this.col, 0.22 * pu, 1, 1.1);
    ctx.strokeStyle = `rgba(${this.col},${0.7 * pu})`; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.ellipse(X, sy(p.y, 0), 70 + Math.sin(this.t * 0.2) * 6, 20, 0, 0, TAU); ctx.stroke();
  }
}

// 땅에서 솟아 적을 붙잡는 덩굴
class WVines {
  constructor(x, y, o = {}) { Object.assign(this, { x, y, t: 0, life: o.life || 50 }); this.seed = Math.random() * 10; }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, rise = E.out3(Math.min(1, this.t / 10)), a = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25, gy = sy(this.y, 0);
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const ox = (i - 2.5) * 22, h = (90 + (i % 3) * 36) * rise, sw = Math.sin(this.t * 0.12 + i + this.seed) * 14;
      for (const [w, c] of [[8, '#1c3a10'], [4.4, '#4aa028']]) {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(this.x + ox, gy);
        ctx.bezierCurveTo(this.x + ox + sw, gy - h * 0.4, this.x + ox - sw, gy - h * 0.75, this.x + ox + sw * 0.5, gy - h); ctx.stroke();
      }
      ctx.fillStyle = '#d8f090';
      for (let k = 1; k <= 2; k++) { const px = this.x + ox + sw * 0.3 * k, py = gy - h * 0.33 * k; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 8, py - 9); ctx.lineTo(px + 2, py - 2); ctx.fill(); }
    }
    ctx.restore();
  }
}

// 세계수 : 자라나 숲을 만든다 (피해 + 둔화 / 내 HP 회복)
class WTree {
  constructor(p, x, y) { Object.assign(this, { p, x, y, t: 0, life: 440, add: false }); }
  update() {
    this.t++;
    const p = this.p;
    if (this.t > 20 && this.t % 15 === 0) {
      WS.area(p, this.x, this.y, 430, 160, WH.thorn, { hmax: 200, each: e => Status.add(e, 'slow', { t: 40, m: 0.5 }) });
      if (Math.abs(p.x - this.x) < 430 && Math.abs(p.y - this.y) < 160) Gear.heal(p, p.hpMax * 0.009, true);
      FX.add('world', new Mote(this.x + rand(-380, 380), sy(this.y + rand(-120, 120), 20), rand(-0.4, 0.4), rand(-1.6, -0.6), { col: choose(['150,230,90', '255,170,200']), life: 40, r: rand(4, 7), grav: 0 }));
    }
    if (this.t === this.life) {
      Sfx.wlayer('thorn', 3, true); Game.addShake(10); Game.flashScreen(0.3, '200,255,160');
      FX.add('ground', new Ring(this.x, sy(this.y, 0), 30, 480, 26, { col: '170,240,110', w: 16 }));
      for (let i = 0; i < 30; i++) FX.add('world', new Mote(this.x + rand(-200, 200), sy(this.y, rand(60, 280)), rand(-3, 3), rand(-3, 0), { col: choose(['150,230,90', '255,170,200']), life: 50, r: rand(5, 9), grav: 0.05 }));
      WS.area(p, this.x, this.y, 460, 170, WH.bloom);
      Gear.heal(p, p.hpMax * 0.1);
    }
    return this.t < this.life + 6;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), g = E.out3(Math.min(1, this.t / 20)), end = this.t > this.life - 20 ? (this.life - this.t) / 20 : 1, a = Math.max(0, end);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(40,90,30,0.28)'; ctx.beginPath(); ctx.ellipse(this.x, gy, 430 * g, 160 * g, 0, 0, TAU); ctx.fill();
    const h = 330 * g;
    ctx.fillStyle = '#2e1c0c'; ctx.beginPath(); ctx.moveTo(this.x - 38, gy); ctx.quadraticCurveTo(this.x - 22, gy - h * 0.5, this.x - 16, gy - h); ctx.lineTo(this.x + 16, gy - h); ctx.quadraticCurveTo(this.x + 22, gy - h * 0.5, this.x + 38, gy); ctx.fill();
    ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.moveTo(this.x - 12, gy); ctx.quadraticCurveTo(this.x - 6, gy - h * 0.5, this.x - 4, gy - h); ctx.lineTo(this.x + 10, gy - h); ctx.quadraticCurveTo(this.x + 12, gy - h * 0.5, this.x + 18, gy); ctx.fill();
    for (const [ox, oy, r, c] of [[-90, 0.9, 110, '#1e5a1c'], [90, 0.92, 110, '#1e5a1c'], [0, 1.08, 140, '#2a7a28'], [-50, 1.0, 100, '#3a9a34'], [60, 1.02, 96, '#3a9a34']])
      { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(this.x + ox * g, gy - h * oy, r * g, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, gy - h * 0.9, 260 * g, '160,240,100', 0.28, 1, 0.8);
    ctx.restore();
  }
}

// 구르는 주사위 : 던지면 눈이 정해지고 효과가 달라진다
class WDice {
  constructor(p, x, y, face) { Object.assign(this, { p, x, y, z: 80, vx: p.facing * 9, vz: 6, t: 0, face, rot: 0, done: false, add: false }); }
  update() {
    this.t++; this.x += this.vx; this.z += this.vz; this.vz -= 0.55; this.rot += 0.35;
    const p = this.p, r = Game.room;
    let hit = null;
    for (const e of Game.enemies) if (e.hittable() && Math.abs(e.x - this.x) < 46 + e.w && Math.abs(e.y - this.y) < 40 && this.z < e.z + e.hurtH() + 20) { hit = e; break; }
    if (hit || (this.z <= 0 && this.t > 4) || this.x < r.minX - 40 || this.x > r.maxX + 40) { this.land(hit); return false; }
    return true;
  }
  land(e) {
    const p = this.p, X = this.x, Y = this.y, n = this.face, gy = sy(Y, 0);
    const col = ['255,255,255', '255,230,120', '255,140,60', '150,220,255', '140,255,160', '255,80,80'][n - 1];
    FX.add('world', new WDiceFace(X, Y, n));
    FX.add('world', new Flash(X, gy - 20, 14, 120 + n * 14, 16, col, 0.8));
    FX.add('ground', new Ring(X, gy, 20, 150 + n * 25, 20, { col, w: 8 }));
    Sfx.wlayer('dice', 2, n === 6); Game.addShake(3 + n);
    const R = 150 + n * 22;
    const mul = [1, 1.3, 1.5, 1.4, 1.6, 4][n - 1];
    WS.area(p, X, Y, R, R * 0.45, WS.hd({ dmg: 2.2 * mul, kx: 5, kz: 7, airKz: 6, stun: 40, stop: 4 + n, shake: 3 + n, fx: n === 6 ? 'heavy' : 'blunt', power: 1.2 + n * 0.1 }), {
      each: ev => {
        if (n === 2) Status.add(ev, 'shock', { t: 30 });
        if (n === 3) Status.add(ev, 'burn', { t: 150, d: p.atk * 0.2 });
        if (n === 4) Status.add(ev, 'freeze', { t: 60 });
      },
    });
    if (n === 5) Gear.heal(p, p.hpMax * 0.08);
    if (n === 6) {
      Game.flashScreen(0.35, '255,230,200'); Sfx.play('explode', 0.8);
      FX.add('top', new Label(X, gy - 120, 'JACKPOT!', { col: ['#ffffff', '#ff5050'], size: 36, life: 70 }));
      for (let i = 0; i < 8; i++) Game.pickups.push(new Pickup('gold', X, Y, 50, randi(60, 140)));
    } else FX.add('top', new Label(X, gy - 100, `${n}`, { col: ['#ffffff', '#' + ['ffffff', 'ffe070', 'ff9040', '90d0ff', '70ff90', 'ff5050'][n - 1]], size: 30, life: 46 }));
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot);
    ctx.fillStyle = '#000'; ctx.globalAlpha = 0.35; ctx.fillRect(-19, -19, 38, 38); ctx.globalAlpha = 1;
    ctx.fillStyle = '#f6f6f6'; ctx.strokeStyle = '#a01020'; ctx.lineWidth = 3; roundRect(ctx, -18, -18, 36, 36, 6); ctx.fill(); ctx.stroke();
    const pips = [[0, 0], [-8, -8], [8, 8], [-8, 8], [8, -8]];
    ctx.fillStyle = '#c01828'; const k = 1 + (this.t / 3 | 0) % 6;
    for (const [px, py] of this.pipsFor(k)) { ctx.beginPath(); ctx.arc(px, py, 3.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  pipsFor(n) {
    const a = 8, c = [0, 0], tl = [-a, -a], tr = [a, -a], bl = [-a, a], br = [a, a], ml = [-a, 0], mr = [a, 0];
    return [[c], [tl, br], [tl, c, br], [tl, tr, bl, br], [tl, tr, c, bl, br], [tl, tr, ml, mr, bl, br]][n - 1];
  }
}
// 착지한 주사위 눈이 잠깐 바닥에 남는다
class WDiceFace {
  constructor(x, y, n) { Object.assign(this, { x, y, n, t: 0, life: 40 }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const gy = sy(this.y, 0), a = this.t < 28 ? 1 : 1 - (this.t - 28) / 12, s = E.out3(Math.min(1, this.t / 6));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(this.x, gy - 18); ctx.scale(s, s);
    ctx.fillStyle = '#f6f6f6'; ctx.strokeStyle = '#a01020'; ctx.lineWidth = 3; roundRect(ctx, -22, -22, 44, 44, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c01828';
    const A = 10, c = [0, 0], tl = [-A, -A], tr = [A, -A], bl = [-A, A], br = [A, A], ml = [-A, 0], mr = [A, 0];
    for (const [px, py] of [[c], [tl, br], [tl, c, br], [tl, tr, bl, br], [tl, tr, c, bl, br], [tl, tr, ml, mr, bl, br]][this.n - 1]) { ctx.beginPath(); ctx.arc(px, py, 4.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

// 대포알 : 예고 원이 커지다가 하늘에서 떨어져 폭발
class WCannon {
  constructor(p, x, y, delay) { Object.assign(this, { p, x, y, t: -delay, dur: 30, add: false }); }
  update() {
    this.t++;
    if (this.t === this.dur) {
      const p = this.p, gy = sy(this.y, 0);
      FX.add('world', new Flash(this.x, gy - 30, 20, 230, 18, '255,200,120', 0.95));
      FX.add('ground', new Ring(this.x, gy, 20, 250, 20, { col: '255,190,100', w: 12 }));
      for (let i = 0; i < 12; i++) FX.add('world', new Debris(this.x + rand(-30, 30), this.y, 6, { vx: rand(-7, 7), vz: rand(5, 13), s: rand(3, 6), col: ['#2a2018', '#5a4a38', '#ffb040'], glow: '255,160,60' }));
      for (let i = 0; i < 8; i++) FX.add('world', new Mote(this.x + rand(-50, 50), gy - rand(0, 50), rand(-1, 1), rand(-2, -0.5), { col: '90,80,70', life: 40, r: rand(10, 16), grav: 0 }));
      Sfx.play('explode', 0.9); Sfx.wlayer('coin', 2, false); Game.addShake(10);
      WS.area(p, this.x, this.y, 170, 76, WH.cannon);
    }
    return this.t < this.dur + 4;
  }
  draw(ctx) {
    if (this.t < 0) return;
    const gy = sy(this.y, 0), u = Math.min(1, this.t / this.dur);
    if (this.t < this.dur) {
      ctx.fillStyle = `rgba(255,120,60,${0.18 + u * 0.3})`; ctx.beginPath(); ctx.ellipse(this.x, gy, 170 * (0.3 + u * 0.7), 60 * (0.3 + u * 0.7), 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,170,90,${0.5 + u * 0.4})`; ctx.lineWidth = 3; ctx.stroke();
      const e = u * u, bx = lerp(this.x - 380, this.x, e), by = lerp(-160, gy - 12, e);
      ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.arc(bx, by, 17, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a3028'; ctx.beginPath(); ctx.arc(bx - 5, by - 5, 6, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, bx + 12, by - 16, 16, '255,200,90', 0.9);
    }
  }
}

// 보물 상자 : 날아가 열리며 금화가 쏟아진다 (금화 하나하나가 적을 때린다)
class WPlunder {
  constructor(p, x, y) { Object.assign(this, { p, x, y, x0: p.x, y0: p.y, t: 0, add: false, open: 20, life: 190 }); }
  update() {
    this.t++;
    const p = this.p;
    if (this.t === this.open) {
      FX.add('world', new Flash(this.x, sy(this.y, 60), 20, 260, 20, '255,215,90', 0.95));
      FX.add('ground', new Ring(this.x, sy(this.y, 0), 20, 360, 24, { col: '255,215,90', w: 12 }));
      Sfx.wlayer('coin', 3, true); Game.addShake(6);
    }
    if (this.t > this.open && this.t < this.life - 10 && this.t % 3 === 0) {
      const list = WS.nearest(this.x, this.y, 99, 380), e = list.length ? choose(list) : null;
      const cx = e ? e.x + rand(-20, 20) : this.x + rand(-300, 300), cy = e ? e.y : clamp(this.y + rand(-80, 80), 0, DEPTH);
      FX.add('world', new Debris(cx, cy, 160, { vx: 0, vz: -8, s: 4, col: ['#ffd24a', '#f0b020', '#fff0a0'], glow: '255,210,80', life: 14 }));
      Gear.later(5, () => {
        FX.add('world', new Flash(cx, sy(cy, 30), 6, 50, 8, '255,220,100', 0.7));
        WS.area(this.p, cx, cy, 60, 32, WH.coinHit);
        if (this.t % 2 === 0) Game.pickups.push(new Pickup('gold', cx, cy, 30, randi(30, 80)));
      });
      Sfx.wlayer('coin', 1, false);
    }
    if (this.t === this.life) {
      Sfx.play('explode', 1); Game.addShake(14); Game.flashScreen(0.4, '255,230,150');
      FX.add('world', new Flash(this.x, sy(this.y, 60), 30, 420, 24, '255,215,90', 1));
      WS.area(p, this.x, this.y, 400, 150, WH.chestBlast);
    }
    return this.t < this.life + 4;
  }
  draw(ctx) {
    const t = this.t;
    let X, Y;
    if (t < this.open) { const u = t / this.open; X = lerp(this.x0, this.x, u); Y = lerp(sy(this.y0, 70), sy(this.y, 14), u) - Math.sin(u * Math.PI) * 120; }
    else { X = this.x; Y = sy(this.y, 14); }
    const a = t > this.life - 10 ? Math.max(0, (this.life - t) / 10) : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(X, Y);
    ctx.fillStyle = '#4a2a10'; ctx.fillRect(-30, -20, 60, 32); ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 3; ctx.strokeRect(-30, -20, 60, 32);
    ctx.fillStyle = '#6a3a14'; ctx.beginPath();
    if (t < this.open) ctx.rect(-30, -34, 60, 14); else { ctx.moveTo(-30, -20); ctx.lineTo(-30, -46); ctx.lineTo(30, -46); ctx.lineTo(30, -20); }
    ctx.fill(); ctx.stroke();
    if (t >= this.open) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -30, 100, '255,215,90', 0.7); }
    ctx.restore();
  }
}

// 튕기는 톱니 : 벽에 부딪히며 세 번까지 왕복
class WGear {
  constructor(p, x, y, vx) { Object.assign(this, { p, x, y, vx, t: 0, bounces: 0, hit: new Map(), add: false, rot: 0 }); }
  update() {
    this.t++; this.x += this.vx; this.rot += 0.4 * Math.sign(this.vx);
    const r = Game.room;
    if ((this.x < r.minX + 30 && this.vx < 0) || (this.x > r.maxX - 30 && this.vx > 0)) { this.vx = -this.vx; this.bounces++; FX.add('world', new Flash(this.x, sy(this.y, 60), 8, 70, 8, '255,200,120', 0.8)); Sfx.wlayer('steam', 1, false); }
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 56 + e.w || Math.abs(e.y - this.y) > 42 || e.z > 140) continue;
      if (this.t - (this.hit.get(e) || -99) < 9) continue;
      this.hit.set(e, this.t);
      applyHit(this.p, e, WH.gearSaw, { noStopAtt: true, dir: sign(this.vx) || 1, hz: 60 });
    }
    if (this.t % 2 === 0) FX.add('world', new Debris(this.x, this.y, 60, { vx: rand(-2, 2), vz: rand(2, 6), s: 2, col: ['#ffd090', '#ffffff'], glow: '255,190,100', life: 16 }));
    return this.bounces < 3 && this.t < 170;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, 60);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(this.rot);
    ctx.fillStyle = '#4a2a10'; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 40 : 52; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); }
    ctx.fill(); ctx.strokeStyle = '#f0b870'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#c87a30'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 70, '255,190,110', 0.35);
    ctx.restore();
  }
}

// 태양 광선 : 칼끝에서 앞으로 뻗어 위아래로 쓸어 담는다
class WBeam {
  constructor(p) { Object.assign(this, { p, t: 0, life: 36, add: true }); this.dir = p.facing; }
  update() {
    this.t++;
    const p = this.p, u = this.t / this.life, ly = clamp(p.y + (u * 2 - 1) * 70, 0, DEPTH);
    this.ly = ly;
    if (this.t % 4 === 0) {
      WS.area(p, p.x + this.dir * 480, ly, 480, 44, WH.beam, { hmax: 240, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.12 }) });
      Game.addShake(2);
    }
    if (this.t % 3 === 0) FX.add('world', new Mote(p.x + this.dir * rand(60, 900), sy(ly, rand(30, 90)), rand(-1, 1), rand(-1.5, -0.3), { col: '255,225,110', life: 22, r: rand(4, 8), grav: 0 }));
    return this.t < this.life && p.hp > 0;
  }
  draw(ctx) {
    const p = this.p, d = this.dir, Y = sy(this.ly ?? p.y, 70), X0 = p.x + d * 40, a = Math.min(1, this.t / 5, (this.life - this.t) / 6);
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(X0, 0, X0 + d * 1000, 0);
    g.addColorStop(0, 'rgba(255,255,230,0.95)'); g.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, Y - 6); ctx.lineTo(X0 + d * 1000, Y - 34); ctx.lineTo(X0 + d * 1000, Y + 34); ctx.lineTo(X0, Y + 6); ctx.fill();
    drawGlow(ctx, X0, Y, 90, '255,225,110', 0.8);
    ctx.restore();
  }
}

// 정오의 태양 : 하늘에 떠올라 힘을 모았다가 터진다
class WSunBig {
  constructor(p) { Object.assign(this, { p, t: 0, life: 150, add: false }); Game.sunT = 150; }
  update() {
    this.t++;
    const p = this.p;
    if (this.t > 20 && this.t % 14 === 0) for (const e of WS.onScreen()) { Status.add(e, 'burn', { t: 90, d: p.atk * 0.14 }); FX.add('world', new Flash(e.x, sy(e.y, e.z + e.h * 0.5), 6, 50, 10, '255,200,80', 0.7)); }
    if (this.t === this.life) {
      Game.flashScreen(0.9, '255,250,210'); Game.addShake(22); Game.zoomPunch(1.08);
      Sfx.play('explode', 1.1); Sfx.wlayer('sun', 3, true);
      for (const e of WS.onScreen()) {
        FX.add('world', new Pillar(e.x, e.y, 50, 560, 26, '255,225,110', '255,255,240'));
        applyHit(p, e, WH.sunFlare, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
      }
    }
    return this.t < this.life + 4;
  }
  draw(ctx) {
    const u = Math.min(1, this.t / this.life), X = Game.cam.x + W / 2, Y = 120, s = E.out3(Math.min(1, this.t / 24)) * (1 + u * 0.7);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, X, Y, 260 * s, '255,215,90', 0.55);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + this.t * 0.03; ctx.strokeStyle = 'rgba(255,230,130,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * 70 * s, Y + Math.sin(a) * 70 * s); ctx.lineTo(X + Math.cos(a) * (130 + 40 * Math.sin(this.t * 0.2 + i)) * s, Y + Math.sin(a) * (130 + 40 * Math.sin(this.t * 0.2 + i)) * s); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(X, Y, 62 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd860'; ctx.beginPath(); ctx.arc(X, Y, 48 * s, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

// ---------- 타격 정의 ----------
Object.assign(WH, {
  ichi: WS.hd({ dmg: 8, kx: 5, kz: 3, airKz: 4, stun: 50, stop: 8, shake: 9, fx: 'slash', power: 1.8 }),
  counterIai: WS.hd({ dmg: 9, kx: 6, kz: 5, airKz: 6, stun: 50, stop: 10, shake: 10, fx: 'slash', power: 2 }),
  thorn: WS.hd({ dmg: 0.9, kx: 0, airKz: 0.5, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  bloom: WS.hd({ dmg: 9, kx: 6, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'blunt', power: 1.6 }),
  vineGrab: WS.hd({ dmg: 3.2, kx: 0, kz: 2, airKz: 2, stun: 40, stop: 5, shake: 4, fx: 'pierce', power: 1.3 }),
  cannon: WS.hd({ dmg: 6, kx: 7, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.6 }),
  coinHit: WS.hd({ dmg: 1.5, kx: 1, airKz: 2, stun: 12, stop: 1, shake: 1, fx: 'none', sfx: 'light' }),
  chestBlast: WS.hd({ dmg: 13, kx: 9, kz: 11, airKz: 10, stun: 60, stop: 14, shake: 14, fx: 'heavy', power: 2.2 }),
  gearSaw: WS.hd({ dmg: 1.9, kx: 2, airKz: 2, stun: 22, stop: 2, shake: 2, fx: 'slash' }),
  bullet: WS.hd({ dmg: 0.85, kx: 1.5, airKz: 1, stun: 14, stop: 1, shake: 1, fx: 'pierce', sfx: 'light' }),
  beam: WS.hd({ dmg: 1.5, kx: 2, airKz: 2, stun: 20, stop: 1, shake: 1.5, fx: 'none', sfx: 'none' }),
  sunFlare: WS.hd({ dmg: 30, kx: 8, kz: 13, airKz: 12, stun: 70, stop: 18, shake: 18, fx: 'heavy', power: 2.6 }),
  slotWin: WS.hd({ dmg: 6, kx: 6, kz: 8, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.6 }),
});

// 무념무상 : 서 있는 동안 맞으면 피하고 그 자리에서 되받아 벤다
Player.prototype.onStance = function (att) {
  this.stanceN = (this.stanceN || 0) + 1; this.invul = Math.max(this.invul, 14);
  FX.add('top', new Label(this.x, sy(this.y, this.z) - 170, 'COUNTER', { col: ['#ffffff', '#9ad0ff'], size: 28 }));
  FX.add('world', new Flash(this.x, sy(this.y, 70), 20, 220, 18, '230,245,255', 1));
  FX.add('world', new CutLine(this.x, sy(this.y, 70), (this.facing > 0 ? -0.2 : Math.PI + 0.2), 520, 6, '255,255,255', 12));
  Sfx.play('counter'); Sfx.wlayer('katana', 3, true); Game.freeze(4); Game.addShake(8);
  swingT(this, this.stanceN % 2 ? 'a3' : 'a2', 1.8);
  const tg = att && att.hittable && att.hittable() ? att : null;
  if (tg) { this.facing = sign(tg.x - this.x) || this.facing; applyHit(this, tg, WH.counterIai, { noStopAtt: true, dir: this.facing }); }
  WS.area(this, this.x, this.y, 230, 90, WH.counterIai);
  if (this.stanceN >= 6) this.stanceT = 0;
};

// ---------- 슬롯머신 연출 (잭팟) ----------
const SLOT_SYM = ['seven', 'bar', 'cherry', 'star', 'bell'];
function drawSlotSym(g, s, x, y, r) {
  g.save(); g.translate(x, y);
  switch (s) {
    case 'seven': g.fillStyle = '#ff3a3a'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.font = `${r * 1.9}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('7', 0, 2); g.fillText('7', 0, 2); break;
    case 'bar': g.fillStyle = '#222'; g.strokeStyle = '#ffd24a'; g.lineWidth = 3; g.fillRect(-r, -r * 0.4, r * 2, r * 0.8); g.strokeRect(-r, -r * 0.4, r * 2, r * 0.8); break;
    case 'cherry': g.fillStyle = '#e02040'; for (const o of [-r * 0.4, r * 0.4]) { g.beginPath(); g.arc(o, r * 0.35, r * 0.4, 0, TAU); g.fill(); } g.strokeStyle = '#4aa030'; g.lineWidth = 3; g.beginPath(); g.moveTo(-r * 0.4, r * 0.1); g.lineTo(0, -r * 0.7); g.lineTo(r * 0.4, r * 0.1); g.stroke(); break;
    case 'star': g.fillStyle = '#ffd24a'; g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.4 : r * 0.9, a = k / 10 * TAU - Math.PI / 2; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill(); break;
    case 'bell': g.fillStyle = '#f0b020'; g.beginPath(); g.moveTo(-r * 0.7, r * 0.5); g.quadraticCurveTo(-r * 0.7, -r * 0.8, 0, -r * 0.8); g.quadraticCurveTo(r * 0.7, -r * 0.8, r * 0.7, r * 0.5); g.closePath(); g.fill(); g.fillStyle = '#c87a10'; g.beginPath(); g.arc(0, r * 0.65, r * 0.18, 0, TAU); g.fill(); break;
  }
  g.restore();
}
const _ov0 = WS.overlay;
WS.overlay = function (ctx) {
  _ov0.call(this, ctx);
  const S = Game.slot;
  if (!S) return;
  const t = S.t, a = Math.min(1, t / 8, (S.life - t) / 14), cx = W / 2, cy = 190;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(10,6,10,0.88)'; roundRect(ctx, cx - 190, cy - 80, 380, 160, 18); ctx.fill();
  ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 5; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const rx = cx - 110 + i * 110, stop = 24 + i * 16, spinning = t < stop;
    ctx.fillStyle = '#f6f2e6'; roundRect(ctx, rx - 44, cy - 56, 88, 112, 10); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(rx - 44, cy - 56, 88, 112); ctx.clip();
    if (spinning) for (let k = -1; k <= 1; k++) drawSlotSym(ctx, SLOT_SYM[((t * 2 + i * 3 + k + 50) % 5 + 5) % 5], rx, cy + k * 52 + (t * 18 % 52), 24);
    else drawSlotSym(ctx, S.res[i], rx, cy, 28);
    ctx.restore();
  }
  if (t > 64 + 0) { ctx.globalAlpha = a; ctx.fillStyle = S.win ? '#ffe070' : '#ffffff'; ctx.font = `34px ${FONT_T}`; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(S.text, cx, cy + 112); ctx.fillText(S.text, cx, cy + 112); }
  ctx.restore();
};

// ============================================================
//  스킬 정의 (G = s5 고유기 / R = s6 각성기)
// ============================================================
Object.assign(WSK, {
  // ----------------------------- 거합도 무라사메 -----------------------------
  w18: ws({
    name: '일문자', mp: 110, cd: 8, ico: ['iai', '225,238,255'], desc: '칼집에 손을 얹고 숨을 고른다. 한순간에 앞으로 뛰쳐나가며 베면, 같은 줄에 선 적들이 잠시 뒤 한꺼번에 갈라진다.',
    act: {
      anim: 'drawReady', len: 58, cancel: 46, atkCancel: 46,
      start(p) { p.vx = 0; p.iaiList = []; Sfx.wlayer('katana', 1, false); },
      update(p, f) {
        p.vx = 0; p.vy = 0;
        if (f < 26) { p.bladeGlow = 0.5 + f * 0.04; if (f === 2) FX.add('ground', new Ring(p.x, sy(p.y, 0), 150, 12, 24, { col: '225,238,255', w: 6 })); }
        if (f === 26) {
          const d = p.facing, minX = Game.room.minX, maxX = Game.room.maxX;
          p.iaiList = Game.enemies.filter(e => e.hittable() && Math.abs(e.y - p.y) < 85 && (e.x - p.x) * d > -90 && Math.abs(e.x - p.x) < 1000);
          const nx = clamp(p.x + d * 420, minX, maxX);
          for (let i = 0; i < 5; i++) p.addGhost(lerp(p.x, nx, i / 5), p.y, p.z, d, lerpPose(PP.a1s, PP.a3s || PP.a2s, 0.6, P()), 10 + i, '220,236,255');
          p.x = p.px = nx; p.afterOn = 8; swingT(p, 'a3', 2.2); p.bladeGlow = 2;
          FX.add('world', new CutLine(p.x - d * 450, sy(p.y, 70), d > 0 ? 0 : Math.PI, 1000, 7, '255,255,255', 16));
          Game.flashScreen(0.25, '255,255,255'); Sfx.pplay('swingBig'); Sfx.wlayer('katana', 3, true);
        }
        if (f === 34) {
          for (const e of p.iaiList) if (e.hittable()) {
            FX.add('world', new CutLine(e.x, sy(e.y, e.z + e.h * 0.5), -0.15, 150, 6, '255,255,255', 12));
            applyHit(p, e, WH.ichi, { noStopAtt: true, dir: p.facing });
          }
          if (p.iaiList.length) { Game.addShake(8); Game.freeze(4); }
          p.iaiList = [];
        }
      },
    },
  }, {
    name: '무념무상', mp: 480, cd: 42, ico: ['stance', '200,225,255'], desc: '5초 동안 마음을 비운다. 그동안 맞는 공격은 모두 피하고, 그 자리에서 되받아 벤다. (반격 최대 6회)',
    act: {
      anim: 'drawReady', len: 40, cancel: 30, atkCancel: 24,
      start(p) { WS.cutin(p, '무념무상', '無 念 無 想', '200,225,255'); p.invul = 90; p.vx = 0; },
      update(p, f) {
        if (f === 8) {
          p.stanceT = 300; p.stanceN = 0; p.bladeGlow = 2;
          Sfx.wlayer('katana', 3, false); Game.flashScreen(0.2, '230,240,255');
          FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 260, 26, { col: '220,235,255', w: 10 }));
          FX.add('world', new WAura(p, 'stanceT', '210,230,255'));
        }
      },
    },
  }),

  // ----------------------------- 덩굴검 쏜베인 -----------------------------
  w19: ws({
    name: '덩굴 올가미', mp: 120, cd: 9, ico: ['vine', '150,230,90'], desc: '검을 꽂으면 가까운 적 최대 5명의 발밑에서 덩굴이 솟아 붙잡는다. 붙잡힌 적은 내 앞으로 끌려오고 잠시 움직이지 못한다.',
    act: {
      anim: 'ebImpact', len: 44, cancel: 34, atkCancel: 30,
      update(p, f) {
        p.vx = 0;
        if (f === 10) {
          Sfx.wlayer('thorn', 3, true); Sfx.play('quake', 0.5); Game.addShake(5);
          const list = WS.nearest(p.x, p.y, 5, 620);
          if (!list.length) for (let i = 0; i < 3; i++) FX.add('world', new WVines(p.x + p.facing * (150 + i * 130), p.y, { life: 46 }));
          for (const e of list) {
            FX.add('world', new WVines(e.x, e.y, { life: 60 }));
            Gear.later(12, () => {
              if (!e.hittable()) return;
              if (!e.isBoss) { e.x = lerp(e.x, p.x + p.facing * 90, 0.8); e.y = lerp(e.y, p.y, 0.5); }
              applyHit(p, e, WH.vineGrab, { noStopAtt: true, dir: -p.facing });
              Status.add(e, 'shock', { t: 70 });
              FX.add('world', new Flash(e.x, sy(e.y, 40), 8, 70, 10, '150,230,90', 0.8));
            });
          }
        }
      },
    },
  }, {
    name: '세계수의 숲', mp: 480, cd: 42, ico: ['tree', '150,230,90'], desc: '앞에 세계수를 키워 7초 동안 숲을 만든다. 숲 안의 적은 가시에 찔리며 느려지고, 숲에 있는 동안 HP가 차오른다. 마지막에 꽃이 만개해 터진다.',
    act: {
      anim: 'ultUp', len: 50, cancel: 40, atkCancel: 34,
      start(p) { WS.cutin(p, '세계수의 숲', '世 界 樹', '150,230,90'); p.invul = 90; p.vx = 0; },
      update(p, f) {
        if (f === 12) {
          const x = clamp(p.x + p.facing * 120, Game.room.minX + 200, Game.room.maxX - 200);
          FX.add('world', new WTree(p, x, p.y)); p.bladeGlow = 2;
          Sfx.wlayer('thorn', 3, true); Sfx.play('quake', 0.7); Game.addShake(10); Game.flashScreen(0.3, '200,255,160');
        }
      },
    },
  }),

  // ----------------------------- 운명의 주사위검 다이스 -----------------------------
  w20: ws({
    name: '주사위 굴리기', mp: 100, cd: 8, ico: ['dice', '255,90,90'], desc: '거대한 주사위를 던진다. 눈에 따라 효과가 다르다. 1 약한 폭발 · 2 감전 · 3 화염 · 4 빙결 · 5 HP 회복 · 6 대박(큰 폭발 + 금화).',
    act: {
      anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) { Sfx.pplay('swingBig'); Sfx.wlayer('dice', 2, false); FX.add('world', new WDice(p, p.x + p.facing * 40, p.y, randi(1, 6))); }
      },
    },
  }, {
    name: '잭팟', mp: 480, cd: 42, ico: ['slot', '255,215,90'], desc: '슬롯머신을 돌린다. 세 개가 모두 같으면 큰 당첨 (7이면 대박), 두 개가 같으면 중간, 꽝이어도 약간의 피해. 화면 안의 모든 적에게 같은 배율이 적용된다.',
    act: {
      anim: 'ultUp', len: 100, cancel: 90, atkCancel: 84,
      start(p) {
        WS.cutin(p, '잭팟', 'J A C K P O T', '255,215,90'); p.invul = 160; p.vx = 0;
        const r = Math.random(); let res, mul, text, win = true;
        if (r < 0.12) { res = ['seven', 'seven', 'seven']; mul = 8; text = 'JACKPOT !!!'; }
        else if (r < 0.30) { const s = choose(['bar', 'cherry', 'star', 'bell']); res = [s, s, s]; mul = 4; text = 'TRIPLE !'; }
        else if (r < 0.70) { const s = choose(SLOT_SYM), o = choose(SLOT_SYM.filter(x => x !== s)), pos = randi(0, 2); res = [s, s, s]; res[pos] = o; mul = 2.2; text = 'DOUBLE'; }
        else { res = SLOT_SYM.slice().sort(() => Math.random() - 0.5).slice(0, 3); mul = 1.2; text = 'TRY AGAIN'; win = false; }
        p.slotMul = mul; Game.slot = { t: 0, life: 110, res, text, win };
      },
      update(p, f) {
        p.vx = 0; p.vy = 0;
        const S = Game.slot; if (S) { S.t++; if (S.t >= S.life) Game.slot = null; }
        if (f === 70) {
          const mul = p.slotMul || 1;
          Sfx.wlayer('coin', 3, true); Game.flashScreen(0.4, '255,230,150'); Game.addShake(8 + mul * 2);
          const hd = WS.hd({ dmg: 6 * mul, kx: 6, kz: 8, airKz: 8, stun: 50, stop: 8 + mul, shake: 8 + mul, fx: 'heavy', power: 1.4 + mul * 0.15 });
          for (const e of WS.onScreen()) {
            FX.add('world', new Flash(e.x, sy(e.y, e.z + e.h * 0.5), 14, 120, 14, '255,215,90', 0.9));
            for (let i = 0; i < Math.min(8, Math.round(mul * 2)); i++) Game.pickups.push(new Pickup('gold', e.x, e.y, 60, randi(30, 80) * Math.ceil(mul / 2)));
            applyHit(p, e, hd, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
          }
        }
      },
      end() { Game.slot = null; },
    },
  }),

  // ----------------------------- 해적 곡도 블랙펄 -----------------------------
  w21: ws({
    name: '대포 일제사격', mp: 140, cd: 9, ico: ['cannon', '255,190,90'], desc: '아군 함선에서 대포 세 발을 쏜다. 적이 있는 곳을 노려 차례로 떨어져 폭발한다. 적이 없으면 앞쪽에 떨어진다.',
    act: {
      anim: 'win', len: 36, cancel: 24, atkCancel: 20,
      update(p, f) {
        p.vx *= 0.5;
        if (f === 6) {
          Sfx.pplay('swingBig'); Sfx.wlayer('coin', 2, true);
          const list = WS.nearest(p.x, p.y, 3, 800);
          for (let i = 0; i < 3; i++) {
            const e = list[i] || list[0];
            const x = e ? e.x + rand(-30, 30) : p.x + p.facing * (260 + i * 200), y = e ? e.y : clamp(p.y + (i - 1) * 40, 0, DEPTH);
            FX.add('world', new WCannon(p, clamp(x, Game.room.minX, Game.room.maxX), y, i * 9));
          }
        }
      },
    },
  }, {
    name: '황금 약탈', mp: 480, cd: 42, ico: ['chest', '255,215,90'], desc: '보물 상자를 던진다. 적이 몰린 곳에서 열려 3초 동안 금화가 쏟아지며 적을 때리고, 진짜 금화도 바닥에 떨어진다. 마지막에 상자가 폭발한다.',
    act: {
      anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
      start(p) { WS.cutin(p, '황금 약탈', '黃 金 掠 奪', '255,215,90'); p.invul = 100; p.vx = 0; },
      update(p, f) {
        if (f === 8) {
          const list = WS.onScreen();
          let best = null, bn = -1;
          for (const e of list) { const n = list.filter(o => Math.abs(o.x - e.x) < 300).length; if (n > bn) { bn = n; best = e; } }
          const x = best ? best.x : p.x + p.facing * 300, y = best ? best.y : p.y;
          FX.add('world', new WPlunder(p, x, y)); p.bladeGlow = 2; Sfx.wlayer('coin', 2, false);
        }
      },
    },
  }),

  // ----------------------------- 증기 기관검 스팀하트 -----------------------------
  w22: ws({
    name: '톱니 투척', mp: 120, cd: 8, ico: ['gear', '255,190,120'], desc: '톱니바퀴 두 개를 던진다. 톱니는 적을 갈아내며 날아가다가 벽에 부딪혀 튕기고, 세 번 튕기면 멈춘다.',
    act: {
      anim: 'a2', len: 26, cancel: 14, atkCancel: 12,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) {
          Sfx.pplay('swingBig'); Sfx.wlayer('steam', 2, true);
          FX.add('world', new WGear(p, p.x + p.facing * 40, p.y - 22, p.facing * 12));
          FX.add('world', new WGear(p, p.x + p.facing * 40, p.y + 22, p.facing * 9));
        }
      },
    },
  }, {
    name: '기관포 모드', mp: 480, cd: 42, ico: ['gun', '255,190,120'], desc: '검이 기관포로 변형된다. 5초 동안 제자리(천천히 이동 가능)에서 가장 가까운 적에게 총알을 자동으로 퍼붓는다. 그동안 피격에도 흔들리지 않는다.',
    act: {
      anim: 'ebImpact', len: 320, cancel: 320, atkCancel: 320,
      start(p) { WS.cutin(p, '기관포 모드', 'G A T L I N G', '255,190,120'); p.invul = 40; p.vx = 0; },
      update(p, f) {
        p.armorF = true; p.bladeGlow = 1.4;
        const ax = Input.axisX(); p.vx = ax * 1.3; p.vy = Input.axisY() * 1;
        if (f < 40) return;
        if (f >= 300) { p.actDone = true; return; }
        if (f % 3 === 0) {
          const t = WS.nearest(p.x, p.y, 1, 1000)[0];
          const d = t ? sign(t.x - p.x) || p.facing : p.facing;
          if (t) p.facing = d;
          const mx = p.x + d * 60, my = sy(p.y, 80);
          FX.add('world', new Flash(mx, my, 4, 36, 4, '255,220,140', 0.9));
          FX.add('world', new Debris(p.x, p.y, 90, { vx: -d * rand(1, 3), vz: rand(3, 6), s: 2, col: ['#f0c060', '#c89030'], life: 24 }));
          if (t) {
            FX.add('world', new CutLine(mx, my, Math.atan2(sy(t.y, t.z + t.h * 0.5) - my, t.x - mx), Math.hypot(t.x - mx, sy(t.y, t.z + t.h * 0.5) - my), 2, '255,230,150', 4));
            applyHit(p, t, WH.bullet, { noStopAtt: true, dir: d, hz: 60 });
          }
          Sfx.pplay('swing', 0.5, 1.7 + Math.random() * 0.3); if (f % 6 === 0) Game.addShake(2);
        }
      },
    },
  }),

  // ----------------------------- 태양신의 곡도 라 솔레이 -----------------------------
  w23: ws({
    name: '태양 광선', mp: 150, cd: 9, ico: ['beam', '255,225,110'], desc: '칼끝에 햇빛을 모았다가 앞으로 쏘아 보낸다. 광선이 위아래로 천천히 쓸면서 닿은 모든 적을 태운다.',
    act: {
      anim: 'drawReady', len: 62, cancel: 52, atkCancel: 52,
      start(p) { p.vx = 0; Sfx.wlayer('sun', 1, false); },
      update(p, f) {
        p.vx = 0; p.vy = 0;
        if (f < 14) { p.bladeGlow = 0.6 + f * 0.1; if (f === 3) FX.add('ground', new Ring(p.x, sy(p.y, 0), 120, 10, 14, { col: '255,225,110', w: 6 })); }
        if (f === 14) { swingT(p, 'a3', 1.2); FX.add('world', new WBeam(p)); Sfx.wlayer('sun', 3, true); Sfx.pplay('swingBig'); Game.flashScreen(0.2, '255,245,200'); }
        if (f > 14 && f < 50) p.bladeGlow = 2;
      },
    },
  }, {
    name: '정오의 태양', mp: 480, cd: 42, ico: ['sun', '255,215,90'], desc: '하늘에 태양을 띄운다. 2.5초 동안 태양이 점점 커지며 화면 안의 적을 태우고, 마지막에 모든 적에게 빛기둥이 내리꽂힌다.',
    act: {
      anim: 'ultUp', len: 80, cancel: 70, atkCancel: 62,
      start(p) { WS.cutin(p, '정오의 태양', '正 午 太 陽', '255,215,90'); p.invul = 190; p.vx = 0; },
      update(p, f) {
        if (f === 8) { p.bladeGlow = 2.5; FX.add('top', new WSunBig(p)); Sfx.play('charge'); Sfx.wlayer('sun', 3, false); }
      },
    },
  }),
});

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
