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
  flurry: WS.hd({ dmg: 1.4, kx: 0.5, kz: 0, airKz: 1, stun: 12, stop: 1, shake: 1, fx: 'none', sfx: 'light', power2: 0 }),
  flurryEnd: WS.hd({ dmg: 12, kx: 5, kz: 7, airKz: 7, stun: 50, stop: 8, shake: 8, fx: 'x', power: 1.8 }),
  huntHit: WS.hd({ dmg: 2.6, kx: 0.5, kz: 0, airKz: 1, stun: 14, stop: 2, shake: 2, fx: 'slash', power: 1.1 }),
  huntEnd: WS.hd({ dmg: 44, kx: 6, kz: 9, airKz: 9, stun: 80, stop: 16, shake: 16, fx: 'x', power: 2.4 }),
});

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

// 거대한 발톱 자국 : 평행한 붉은 세 줄이 화면을 가른다
const clawSlash = (cx, cy, ang, len) => {
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  [-1, 0, 1].forEach((k, i) => {
    FX.add('world', new CutLine(cx + nx * k * 34, cy + ny * k * 34, ang, len * (i === 1 ? 1 : 0.82), 10, '255,70,50', 16));
    FX.add('world', new CutLine(cx + nx * k * 34, cy + ny * k * 34, ang, len * (i === 1 ? 1 : 0.82) * 0.92, 4, '255,235,225', 14));
  });
};
Object.assign(WH, {
  clawHit: WS.hd({ dmg: 1.1, kx: 4, kz: 8, airKz: 8, stun: 50, stop: 6, shake: 7, fx: 'slash', power: 1.6 }),
  clawEnd: WS.hd({ dmg: 5.5, kx: 9, kz: 12, airKz: 11, stun: 70, stop: 14, shake: 14, fx: 'x', power: 2.4 }),
});

WSK.w35 = ws({
  name: '맹수의 발톱', mp: 140, cd: 8, ico: ['claws', '255,80,60'], desc: '맹수처럼 달려들어 거대한 발톱 자국을 세 번 연달아 찢어 놓는다. 앞의 모든 적이 공중으로 떠오르며 출혈을 입고, 마지막에 X자로 갈라진다.',
  act: {
    anim: 'a3', len: 58, cancel: 48, atkCancel: 44,
    start(p) { p.invul = Math.max(p.invul, 50); p.vx = 0; Sfx.wlayer('talon', 2, false); },
    update(p, f) {
      const d = p.facing;
      if (f >= 3 && f < 12) { p.vx = d * 18; p.armorF = true; p.afterOn = 5; if (f === 3) { Sfx.pplay('swingBig'); p.bladeGlow = 2; } } else if (f >= 12) p.vx *= 0.5;
      const hitArea = (rx, hd) => WS.area(p, p.x + d * rx * 0.75, p.y, rx, 120, hd, { hmax: 260, each: e => Status.add(e, 'bleed', { t: 200, d: p.atk * 0.25 }) });
      if (f === 14 || f === 22 || f === 30) {
        const ang = (f === 14 ? -0.55 : f === 22 ? 0.55 : 0) + (d > 0 ? 0 : Math.PI);
        clawSlash(p.x + d * 230, sy(p.y, 80), ang, 520);
        swingT(p, f === 22 ? 'a2' : 'a1', 2); Sfx.wlayer('talon', 3, true); Sfx.pplay('swingBig'); Game.addShake(8);
        FX.add('world', new Flash(p.x + d * 230, sy(p.y, 80), 20, 240, 14, '255,110,80', 0.7));
        hitArea(380, WH.clawHit);
      }
      if (f === 40) {
        clawSlash(p.x + d * 230, sy(p.y, 80), 0.7 + (d > 0 ? 0 : Math.PI), 600); clawSlash(p.x + d * 230, sy(p.y, 80), -0.7 + (d > 0 ? 0 : Math.PI), 600);
        FX.add('world', new Flash(p.x + d * 230, sy(p.y, 80), 30, 420, 20, '255,255,255', 0.9)); FX.add('ground', new Ring(p.x + d * 230, sy(p.y, 0), 30, 440, 22, { col: '255,90,70', w: 14 }));
        Sfx.wlayer('talon', 3, true); Sfx.play('explode', 0.7); Game.addShake(16); Game.flashScreen(0.3, '255,200,190'); Game.freeze(5);
        hitArea(420, WH.clawEnd);
      }
    },
  },
}, {
  name: '야수 강림', mp: 480, cd: 42, ico: ['paw', '255,80,60'], desc: '가장 단단한 적(보스 우선)에게 달려들어 사방에서 난도질하고 급소를 꿰뚫는다. 그 뒤 8초 동안 야수가 깃든다 : 피해 +30%, 모든 공격이 가까운 적 둘에게 발톱 잔상을 남기고 HP를 조금씩 흡수하며, 동작이 빨라진다.',
  act: {
    anim: 'a1', len: 100, cancel: 999, atkCancel: 999,
    start(p) {
      WS.cutin(p, '야수 강림', '野 獸 降 臨', '255,70,50');
      const list = WS.onScreen().sort((a, b) => (b.isBoss ? 1e15 : 0) + b.hpMax - ((a.isBoss ? 1e15 : 0) + a.hpMax));
      p.huntTarget = list[0] || null; p.invul = 220; p.vx = 0;
    },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      const t = p.huntTarget;
      if (f === 2) { Game.flashScreen(0.35, '255,120,100'); p.bladeGlow = 2; }
      if (t && t.hittable()) {
        if (f >= 6 && f < 66 && f % 6 === 0) {
          const k = (f - 6) / 6, a = k * 2.4 + 0.5, d = Math.cos(a) >= 0 ? 1 : -1, ox = Math.cos(a) * 80, oy = Math.sin(a) * 36;
          p.addGhost(p.x, p.y, p.z, p.facing, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 7, '255,90,70');
          p.x = p.px = clamp(t.x + ox, Game.room.minX, Game.room.maxX); p.y = clamp(t.y + oy, 0, DEPTH); p.facing = -d; p.afterOn = 5;
          for (let j = 0; j < 3; j++) Gear.later(j * 2, () => {
            if (!t.hittable()) return;
            swingT(p, j % 2 ? 'a2' : 'a1', 2.4);
            FX.add('world', new CutLine(t.x + rand(-14, 14), sy(t.y, t.z + t.h * 0.5 + rand(-24, 24)), rand(0, TAU), 110, 4, '255,90,70', 9));
            applyHit(p, t, WH.huntHit, { noStopAtt: true, dir: p.facing, hz: 70 });
          });
          Sfx.wlayer('talon', 2, false); Sfx.pplay('swing', 0.7, 1.4);
        }
        if (f === 74) {
          p.x = p.px = clamp(t.x - p.facing * 55, Game.room.minX, Game.room.maxX); p.y = t.y; swingT(p, 'a3', 1.4);
          clawSlash(t.x, sy(t.y, t.z + t.h * 0.5), 0.8, 240); clawSlash(t.x, sy(t.y, t.z + t.h * 0.5), -0.8, 240);
          Game.flashScreen(0.4, '255,210,200'); Game.addShake(14); Sfx.play('explode', 0.7); Sfx.wlayer('talon', 3, true);
          applyHit(p, t, WH.huntEnd, { noStopAtt: true, dir: p.facing });
          Status.add(t, 'bleed', { t: 240, d: p.atk * 0.3 });
        }
      }
      if (f === 82) {                                                         // 야수 강림 : 8초
        p.feralT = 480; p.hasteT = Math.max(p.hasteT || 0, 480); p.bladeGlow = 2.5;
        Sfx.play('roar', 1, 0.6); Sfx.wlayer('talon', 3, true); Game.addShake(12); Game.flashScreen(0.4, '255,120,100');
        FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 340, 24, { col: '255,70,50', w: 14 })); FX.add('world', new WAura(p, 'feralT', '255,60,40'));
        FX.add('top', new Label(p.x, sy(p.y, p.z) - 190, 'FERAL', { col: ['#ffe0d8', '#ff3a28'], size: 34, life: 70 }));
        p.actDone = true;
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
{
  const W0 = WEAPON_KARAM; W0.skills = WSK.w35;
  for (const k of ['s5', 's6']) { const s = W0.skills[k]; s.icon = 'ws_w35_' + k; s.act.isSkill = true; s.act.name = 'w35' + k; }
}
