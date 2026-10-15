'use strict';
// ============================================================
//  카람빗 : 손가락 고리가 달린 휘어진 발톱 단검 (빠르게 연속으로 벤다)
// ============================================================
PART.talon = function (x, y, z, d, pw, b) {                      // 평행한 세 줄 할퀸 자국
  const X = x, Y = sy(y, z), a = d > 0 ? -0.55 : Math.PI + 0.55;
  for (let i = -1; i <= 1; i++) FX.add('world', new CutLine(X + i * 7 * -Math.sin(a), Y + i * 7 * Math.cos(a), a, 70 + pw * 12, 3, '255,110,90', 10));
  Hitfx.sparks(X, Y, d, Math.round(4 * b), { col: '255,150,120', spread: 1.5 });
};

Object.assign(WH, {
  flurry: WS.hd({ dmg: 0.85, kx: 0.5, kz: 0, airKz: 1, stun: 12, stop: 1, shake: 1, fx: 'none', sfx: 'light', power2: 0 }),
  flurryEnd: WS.hd({ dmg: 6, kx: 5, kz: 7, airKz: 7, stun: 50, stop: 8, shake: 8, fx: 'x', power: 1.8 }),
  huntHit: WS.hd({ dmg: 1.6, kx: 0.5, kz: 0, airKz: 1, stun: 14, stop: 2, shake: 2, fx: 'slash', power: 1.1 }),
  huntEnd: WS.hd({ dmg: 26, kx: 6, kz: 9, airKz: 9, stun: 80, stop: 16, shake: 16, fx: 'x', power: 2.4 }),
});

const WEAPON_KARAM = {
  id: 'w35', name: '카람빗 새벽발톱', sub: '손가락에 걸어 휘두르는 짐승의 발톱', price: 560000, map: 2,
  atk: 1.0, stop: 0.6, shake: 0.7, move: 1.06, col: '255,100,80', snd: 'talon', part: 'talon', pitch: 1.25, swingPitch: 1.3,
  feel: '짧고 날카로운 연속 할퀴는 소리', desc: '1.5초 안에 이어서 적중할 때마다 피해가 3%씩 쌓인다(최대 +30%). 모든 적중이 출혈을 일으키고, 이동속도 +6%.',
  look: { c: ['#2a1010', '#c04030', '#ffd0c0'], hw: 6.4, L: 0.6, bend: 1.0, edge: 'plain', tip: 'curve', guard: 'ring', glow: '255,90,70', rune: '255,120,90', trim: ['#4a1a14', '#e0705a', '#ffd0c0'], taper: 0.12 },
  amb: ['ember', '255,90,70', 0.1],
  mod(p) {
    if (Game.frame - (p.talonF || -999) > 90) p.talonN = 0;
    return 1 + 0.03 * Math.min(10, p.talonN || 0);
  },
  hit(p, t, dmg) {
    if (Game.frame - (p.talonF || -999) > 90) p.talonN = 0;
    p.talonF = Game.frame; p.talonN = Math.min(10, (p.talonN || 0) + 1);
    Status.add(t, 'bleed', { t: 150, d: dmg * 0.06 });
    if (p.talonN === 10 && p.talonL !== p.talonF) { p.talonL = p.talonF; FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, 'FRENZY', { col: ['#ffe0d8', '#ff4a38'], size: 22 })); }
  },
};

WSK.w35 = ws({
  name: '난도질', mp: 120, cd: 8, ico: ['claws', '255,100,80'], desc: '가장 가까운 적에게 파고들어 눈 깜짝할 새 열 번 넘게 할퀸다. 마지막 일격은 X자로 갈라 크게 피해를 준다.',
  act: {
    anim: 'a1', len: 44, cancel: 36, atkCancel: 36,
    start(p) {
      p.flTarget = WS.nearest(p.x, p.y, 1, 650)[0] || null; p.vx = 0; p.invul = Math.max(p.invul, 44);
      const t = p.flTarget;
      if (t) { const d = sign(t.x - p.x) || p.facing; for (let i = 0; i < 3; i++) p.addGhost(lerp(p.x, t.x - d * 50, i / 3), p.y, p.z, d, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 8 + i * 2, '255,110,90'); p.facing = d; p.x = p.px = clamp(t.x - d * 50, Game.room.minX, Game.room.maxX); p.y = t.y; p.afterOn = 6; Sfx.wlayer('talon', 2, false); }
    },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      const t = p.flTarget;
      if (!t || !t.hittable()) { if (f > 10) p.actDone = true; return; }
      if (f >= 4 && f < 34 && f % 3 === 1) {
        swingT(p, (f / 3 | 0) % 2 ? 'a2' : 'a1', 2.4);
        const a = rand(-1.2, 1.2) + (p.facing > 0 ? 0 : Math.PI);
        FX.add('world', new CutLine(t.x + rand(-12, 12), sy(t.y, t.z + t.h * 0.5 + rand(-20, 20)), a, 90, 3.4, '255,110,90', 9));
        applyHit(p, t, WH.flurry, { noStopAtt: true, dir: p.facing, hz: 70 }); Sfx.pplay('swing', 0.5, 1.6 + Math.random() * 0.3);
      }
      if (f === 36) {
        FX.add('world', new CutLine(t.x, sy(t.y, t.z + t.h * 0.5), 0.8, 130, 7, '255,230,220', 14)); FX.add('world', new CutLine(t.x, sy(t.y, t.z + t.h * 0.5), -0.8, 130, 7, '255,230,220', 14));
        applyHit(p, t, WH.flurryEnd, { noStopAtt: true, dir: p.facing }); Sfx.wlayer('talon', 3, true); Game.addShake(8);
      }
    },
  },
}, {
  name: '사냥 개시', mp: 480, cd: 42, ico: ['hunt', '255,100,80'], desc: '가장 단단한 적(보스 우선)을 사냥감으로 정한다. 사방으로 번쩍이며 파고들어 쉴 새 없이 난도질하고, 마지막에 급소를 꿰뚫는 일격을 넣는다.',
  act: {
    anim: 'a1', len: 90, cancel: 999, atkCancel: 999,
    start(p) {
      WS.cutin(p, '사냥 개시', '狩 獵 開 始', '255,100,80');
      const list = WS.onScreen().sort((a, b) => (b.isBoss ? 1e15 : 0) + b.hpMax - ((a.isBoss ? 1e15 : 0) + a.hpMax));
      p.huntTarget = list[0] || null; p.invul = 200; p.vx = 0;
    },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      const t = p.huntTarget;
      if (!t || !t.hittable()) { if (f > 8) p.actDone = true; return; }
      if (f >= 6 && f < 66 && f % 6 === 0) {
        const k = (f - 6) / 6, a = k * 2.4 + 0.5, d = Math.cos(a) >= 0 ? 1 : -1, ox = Math.cos(a) * 70, oy = Math.sin(a) * 34;
        p.addGhost(p.x, p.y, p.z, p.facing, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 7, '255,110,90');
        p.x = p.px = clamp(t.x + ox, Game.room.minX, Game.room.maxX); p.y = clamp(t.y + oy, 0, DEPTH); p.facing = -d; p.afterOn = 5;
        for (let j = 0; j < 3; j++) Gear.later(j * 2, () => {
          if (!t.hittable()) return;
          swingT(p, j % 2 ? 'a2' : 'a1', 2.4);
          FX.add('world', new CutLine(t.x + rand(-14, 14), sy(t.y, t.z + t.h * 0.5 + rand(-24, 24)), rand(0, TAU), 100, 3.6, '255,110,90', 9));
          applyHit(p, t, WH.huntHit, { noStopAtt: true, dir: p.facing, hz: 70 });
        });
        Sfx.wlayer('talon', 2, false); Sfx.pplay('swing', 0.7, 1.4);
      }
      if (f === 74) {
        p.x = p.px = clamp(t.x - p.facing * 55, Game.room.minX, Game.room.maxX); p.y = t.y; swingT(p, 'a3', 1.4); p.bladeGlow = 2;
        FX.add('world', new CutLine(t.x, sy(t.y, t.z + t.h * 0.5), 0.8, 170, 9, '255,240,230', 18)); FX.add('world', new CutLine(t.x, sy(t.y, t.z + t.h * 0.5), -0.8, 170, 9, '255,240,230', 18));
        Game.flashScreen(0.4, '255,210,200'); Game.addShake(14); Sfx.play('explode', 0.7); Sfx.wlayer('talon', 3, true);
        applyHit(p, t, WH.huntEnd, { noStopAtt: true, dir: p.facing });
        Status.add(t, 'bleed', { t: 240, d: p.atk * 0.3 });
      }
    },
  },
});

// ---------- 아이콘 ----------
{
  const g3 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => { g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke(); g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'claws': for (let i = 0; i < 3; i++) line(() => { g.moveTo(10 + i * 11, 6); g.quadraticCurveTo(14 + i * 11, 24, 8 + i * 11, 42); }, 2.6); break;
      case 'hunt': line(() => g.arc(24, 24, 15, 0, TAU), 2); line(() => { g.moveTo(24, 4); g.lineTo(24, 14); g.moveTo(24, 34); g.lineTo(24, 44); g.moveTo(4, 24); g.lineTo(14, 24); g.moveTo(34, 24); g.lineTo(44, 24); }, 2); g.fillStyle = C(1); g.beginPath(); g.arc(24, 24, 3.4, 0, TAU); g.fill(); break;
      default: g3.call(this, g, kind, col);
    }
  };
}

// ---------- 등록 ----------
WEAPONS.push(WEAPON_KARAM);
WEAPONS.sort(_byPrice);
WEAPON_BY_ID[WEAPON_KARAM.id] = WEAPON_KARAM;
{
  const W0 = WEAPON_KARAM; W0.skills = WSK.w35;
  for (const k of ['s5', 's6']) { const s = W0.skills[k]; s.icon = 'ws_w35_' + k; s.act.isSkill = true; s.act.name = 'w35' + k; }
}
