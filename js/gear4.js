'use strict';
// ============================================================
//  신화급 검 : 라그나로크 (3,300,000G · 가장 비싼 검)
// ============================================================
PART.myth = function (x, y, z, d, pw, b, W) { PART.fire(x, y, z, d, pw, b * 0.7, W); PART.elec(x, y, z, d, pw, b * 0.7, W); };

const WEAPON_MYTH = {
  id: 'w34', name: '신화의 대검 라그나로크', sub: '신들의 황혼을 끝낸 마지막 검', price: 3300000, map: 2,
  atk: 1.62, crit: 0.12, critDmg: 1.9, stop: 1.3, shake: 1.5, kx: 1.3, col: '255,205,120', snd: 'myth', part: 'myth', pitch: 0.85, swingPitch: 0.88,
  feel: '천둥 같은 저음과 황금빛 종소리', desc: '7번째 적중마다 신화의 일격 : 하늘의 번개 · 불기둥 · 서리가 동시에 내리쳐 대상과 주변 적에게 110% 피해 + 화상 + 둔화. 치명타율 +12%, 치명타 피해 x1.9.',
  look: { c: ['#3a0e0e', '#d8a030', '#fff4c0'], hw: 7.6, L: 1.16, edge: 'crystal', tip: 'cleave', guard: 'wing', glow: '255,205,120', rune: '255,225,140', trim: ['#6a1a10', '#e8b030', '#fff0a0'], taper: 0.02 },
  amb: ['star', '255,210,130', 0.3],
  hit(p, t, dmg) {
    if (_n(p, 'rg') % 7 !== 0) return;
    const X = t.x, gy = sy(t.y, 0);
    FX.add('world', new Bolt(X + rand(-40, 40), sy(0, 640), X, sy(t.y, t.z + t.h * 0.5), { life: 14, amp: 34, w: 6 }));
    FX.add('world', new Pillar(X, t.y, 60, 480, 26, '255,120,30', '255,235,170')); FX.add('ground', new Ring(X, gy, 20, 300, 22, { col: '170,225,255', w: 12 }));
    FX.add('world', new Flash(X, gy - 40, 20, 240, 20, '255,225,140', 0.95));
    FX.add('top', new Label(X, sy(t.y, t.z + t.hurtH()) - 58, 'RAGNAROK', { col: ['#fff6d0', '#ff9a30'], size: 26, life: 60 }));
    Sfx.wlayer('myth', 3, true); Game.addShake(9); Game.flashScreen(0.2, '255,240,200');
    for (const e of [t, ...Gear.near(p, t, 300)]) { Gear.proc(p, e, 1.1, { quiet: true, crit: true, hit: { dmg: 1, kx: 5, kz: 7, stun: 40 } }); Status.add(e, 'burn', { t: 150, d: dmg * 0.1 }); Status.add(e, 'slow', { t: 120, m: 0.55 }); }
  },
};

// ---------- 스킬 아이콘 ----------
{
  const g2 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => { g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke(); g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke(); };
    const fill = (fn, a = 1) => { g.fillStyle = C(a); g.beginPath(); fn(); g.fill(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'spear': line(() => { g.moveTo(4, 40); g.lineTo(38, 10); }, 3); fill(() => { g.moveTo(44, 6); g.lineTo(32, 10); g.lineTo(38, 18); }); line(() => { g.moveTo(8, 30); g.lineTo(18, 26); g.lineTo(14, 34); g.lineTo(26, 28); }, 1.4); break;
      case 'ragnarok': fill(() => { g.moveTo(24, 44); g.lineTo(18, 32); g.lineTo(18, 8); g.lineTo(30, 8); g.lineTo(30, 32); }); fill(() => g.rect(10, 6, 28, 4), 0.8); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(() => { g.moveTo(24 + Math.cos(a) * 14, 22 + Math.sin(a) * 14); g.lineTo(24 + Math.cos(a) * 20, 22 + Math.sin(a) * 20); }, 1.6); } break;
      default: g2.call(this, g, kind, col);
    }
  };
}

// ---------- 등록 ----------
WEAPONS.push(WEAPON_MYTH);
WEAPONS.sort(_byPrice);
WEAPON_BY_ID[WEAPON_MYTH.id] = WEAPON_MYTH;
// w34 스킬은 forge_7.js 에서 정의한다.
