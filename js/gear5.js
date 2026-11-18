'use strict';
// ============================================================
//  카람빗 : 손가락 고리가 달린 휘어진 발톱 단검 (빠르게 연속으로 벤다)
// ============================================================
PART.talon = function (x, y, z, d, pw, b) {                      // 평행한 세 줄 할퀸 자국
  const X = x, Y = sy(y, z), a = d > 0 ? -0.55 : Math.PI + 0.55;
  for (let i = -1; i <= 1; i++) FX.add('world', new CutLine(X + i * 7 * -Math.sin(a), Y + i * 7 * Math.cos(a), a, 70 + pw * 12, 3, '255,110,90', 10));
  Hitfx.sparks(X, Y, d, Math.round(4 * b), { col: '255,150,120', spread: 1.5 });
};

const WEAPON_KARAM = {
  id: 'w35', name: '카람빗 새벽발톱', sub: '손가락에 걸어 휘두르는 짐승의 발톱', price: 2200000, map: 2,
  atk: 0.78, crit: 0.16, critDmg: 1.9, stop: 0.5, shake: 0.8, move: 1.12, col: '255,100,80', snd: 'talon', part: 'talon', pitch: 1.25, swingPitch: 1.3,
  feel: '짧고 날카로운 연속 할퀴는 소리', desc: '1.5초 안에 이어서 적중할 때마다 피해가 5%씩 쌓인다(최대 +50%). 모든 적중이 출혈을 일으킨다. 치명타율 +16%, 치명타 피해 x1.9, 이동속도 +12%.',
  look: { karam: true, L: 0.68, c: ['#1c1218', '#9aa4b8', '#ffffff'], grip: ['#0a0a10', '#1c1c26', '#4a4a5c'], glow: '255,90,70', rune: '255,70,60', trim: ['#5a0e0e', '#e03a2a', '#ffb8a8'] },
  amb: ['ember', '255,90,70', 0.1],
  mod(p) {
    if (Game.frame - (p.talonF || -999) > 90) p.talonN = 0;
    return (1 + 0.05 * Math.min(10, p.talonN || 0)) * (p.feralT > 0 ? 1.3 : 1);
  },
  hit(p, t, dmg) {
    if (Game.frame - (p.talonF || -999) > 90) p.talonN = 0;
    p.talonF = Game.frame; p.talonN = Math.min(10, (p.talonN || 0) + 1);
    Status.add(t, 'bleed', { t: 180, d: dmg * 0.1 });
    if (p.feralT > 0) {                                                       // 야수 강림 : 발톱 잔상 + 흡혈
      Gear.heal(p, p.hpMax * 0.004, true);
      if (Game.frame - (p.feralF || -99) > 5) {
        p.feralF = Game.frame;
        for (const e of Gear.near(p, t, 380, 2)) { FX.add('world', new CutLine(e.x, sy(e.y, e.z + e.h * 0.5), rand(-0.9, 0.9) + (e.x > p.x ? 0 : Math.PI), 100, 4, '255,70,50', 9)); Gear.proc(p, e, 0.6, { quiet: true }); }
      }
    }
    if (p.talonN === 10 && p.talonL !== p.talonF) { p.talonL = p.talonF; FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, 'FRENZY', { col: ['#ffe0d8', '#ff4a38'], size: 22 })); }
  },
};

// ---------- 아이콘 ----------
{
  const g3 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => { g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke(); g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'claws': for (let i = 0; i < 3; i++) line(() => { g.moveTo(10 + i * 11, 6); g.quadraticCurveTo(14 + i * 11, 24, 8 + i * 11, 42); }, 2.6); break;
      case 'paw': { g.fillStyle = C(1); g.beginPath(); g.ellipse(24, 32, 10, 8, 0, 0, TAU); g.fill(); for (const [x, y, r] of [[11, 20, 4.2], [19, 12, 4.6], [29, 12, 4.6], [37, 20, 4.2]]) { g.beginPath(); g.ellipse(x, y, r, r * 1.25, 0, 0, TAU); g.fill(); } line(() => { g.moveTo(8, 6); g.lineTo(14, 22); g.moveTo(40, 6); g.lineTo(34, 22); }, 1.6); break; }
      case 'hunt': line(() => g.arc(24, 24, 15, 0, TAU), 2); line(() => { g.moveTo(24, 4); g.lineTo(24, 14); g.moveTo(24, 34); g.lineTo(24, 44); g.moveTo(4, 24); g.lineTo(14, 24); g.moveTo(34, 24); g.lineTo(44, 24); }, 2); g.fillStyle = C(1); g.beginPath(); g.arc(24, 24, 3.4, 0, TAU); g.fill(); break;
      default: g3.call(this, g, kind, col);
    }
  };
}

// ---------- 등록 ----------
WEAPONS.push(WEAPON_KARAM);
WEAPONS.sort(_byPrice);
WEAPON_BY_ID[WEAPON_KARAM.id] = WEAPON_KARAM;
// w35 스킬은 forge_7.js 에서 정의한다.
