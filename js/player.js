'use strict';
// ============================================================
//  플레이어 : 검귀 카엘
// ============================================================
const SKILLS = [
  { key: 's1', act: 'upper', name: '어퍼 슬래시', mp: 40, cd: 2.5, icon: 'upper', air: true },
  { key: 's2', act: 'rush', name: '돌진참', mp: 90, cd: 5, icon: 'rush' },
  { key: 's3', act: 'triple', name: '삼단베기', mp: 120, cd: 7, icon: 'triple', air: true },
  { key: 's4', act: 'draw', name: '발도 : 섬', mp: 180, cd: 10, icon: 'draw' },
  { key: 's5', act: 'quake', name: '지진검', mp: 200, cd: 12, icon: 'quake' },
  { key: 's6', act: 'ult', name: '극 귀신참', mp: 480, cd: 40, icon: 'ult' },
];
const SKILL_BY_KEY = Object.fromEntries(SKILLS.map(s => [s.key, s]));

const HD = {
  a1: { dmg: 1.0, kx: 3.2, airKz: 5.5, stun: 22, stop: 5, shake: 2, ang: -35, mp: 6 },
  a2: { dmg: 1.1, kx: 3.4, airKz: 6.5, stun: 22, stop: 5, shake: 2.5, ang: 55, mp: 6 },
  a3: { dmg: 1.3, kx: 5.5, airKz: 5, stun: 24, stop: 6, shake: 3, fx: 'pierce', mp: 6 },
  a4: { dmg: 1.9, kx: 7.5, kz: 8, airKz: 8, stun: 30, stop: 9, shake: 7, fx: 'heavy', ang: -75, sfx: 'heavy', mp: 8 },
  dash: { dmg: 2.0, kx: 7.5, kz: 7.5, airKz: 7, stun: 28, stop: 7, shake: 4, ang: 40, sfx: 'heavy', mp: 6 },
  jump: { dmg: 1.2, kx: 2.5, airKz: 4.2, stun: 22, stop: 5, shake: 2, ang: -60, mp: 5 },
  upper: { dmg: 4.0, kx: 2, kz: 14, airKz: 12, stun: 40, stop: 8, shake: 5, ang: 80, sfx: 'heavy', power: 1.4 },
  rushHit: { noBack: true, dmg: 0.7, kx: 0, stun: 26, stop: 1, shake: 1, fx: 'pierce', carry: true, sfx: 'hitLight', airKz: 1.5 },
  rushEnd: { dmg: 3.2, kx: 10, kz: 8, airKz: 8, stun: 40, stop: 11, shake: 8, fx: 'heavy', ang: 60, sfx: 'heavy' },
  tri1: { dmg: 3.0, kx: 4, kz: 6, airKz: 6, stun: 40, stop: 5, shake: 3, ang: -35, power: 1.3 },
  tri2: { dmg: 3.0, kx: 4, kz: 7, airKz: 7, stun: 40, stop: 5, shake: 3, ang: 55, power: 1.3 },
  tri3: { dmg: 4.5, kx: 8, kz: 10, airKz: 10, stun: 50, stop: 10, shake: 8, fx: 'heavy', ang: -70, sfx: 'heavy', power: 1.6 },
  drawMark: { noBack: true, dmg: 1.0, kx: 0, stun: 70, stop: 30, stopT: 0, shake: 0, fx: 'none', sfx: 'none', flash: 6 },
  drawFinal: { noBack: true, dmg: 15, kx: 6, kz: 10, airKz: 9, stun: 60, stop: 12, shake: 12, fx: 'x', sfx: 'heavy', power: 2 },
  quake1: { noBack: true, dmg: 8, kx: 6, kz: 13, airKz: 11, stun: 50, stop: 10, shake: 10, fx: 'heavy', ang: -90, sfx: 'none', power: 1.5 },
  quake2: { noBack: true, dmg: 5, kx: 5, kz: 9, airKz: 8, stun: 40, stop: 5, shake: 4, fx: 'blunt', sfx: 'hitLight' },
  ultHit: { noBack: true, dmg: 1.3, kx: 0, stun: 60, stop: 2, shake: 2, sfx: 'ultSlash', airKz: 1.2, power: 1.1 },
  ultFinal: { noBack: true, dmg: 32, kx: 12, kz: 15, airKz: 14, stun: 80, stop: 18, shake: 18, fx: 'heavy', sfx: 'none', power: 2.6 },
};

// 화면 좌표 초승달 (facing 에 따라 좌우 반전)
function crescentAt(p, dx, dz, r, a0, a1, o = {}) {
  const f = p.facing, m = a => (f > 0 ? a : 180 - a) * DEG;
  FX.add('world', new Crescent(p.x + dx * f, sy(p.y, p.z + dz), r, m(a0), m(a1), o));
}

function convergeMotes(x, y, n, col = '120,190,255', rad = 110) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), d = rand(rad * 0.6, rad);
    FX.add('world', new Mote(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, 0, 0, { col, life: 22, r: rand(5, 9), tx: x, ty: y, grav: 0 }));
  }
}

// ------------------------------------------------------------
//  행동 정의
// ------------------------------------------------------------
const PA = {
  a1: {
    anim: 'a1', len: 20, chain: 8, next: 'a2', cancel: 4, trail: [[3, 8]],
    update(p, f) {
      if (f === 2) Sfx.play('swing');
      p.vx = f <= 6 ? p.facing * 2.4 : p.vx * 0.6;
      if (f >= 4 && f <= 6) p.hit(HD.a1, { x0: -10, x1: 110, d: 32, z0: -10, z1: 185 });
    },
  },
  a2: {
    anim: 'a2', len: 22, chain: 9, next: 'a3', cancel: 4, trail: [[3, 9]],
    update(p, f) {
      if (f === 2) Sfx.play('swing', 1, 1.1);
      p.vx = f <= 6 ? p.facing * 2 : p.vx * 0.6;
      if (f >= 4 && f <= 7) p.hit(HD.a2, { x0: -10, x1: 106, d: 32, z0: -10, z1: 215 });
    },
  },
  a3: {
    anim: 'a3', len: 24, chain: 11, next: 'a4', cancel: 5,
    update(p, f) {
      if (f === 4) { Sfx.play('swing', 1, 1.3); Sfx.play('dash', 0.4); }
      p.vx = (f >= 4 && f <= 8) ? p.facing * 8 : p.vx * 0.6;
      if (f === 6) FX.add('world', new CutLine(p.x + p.facing * 70, sy(p.y, p.z + 78), p.facing > 0 ? 0 : Math.PI, 90, 4, '150,210,255', 9));
      if (f >= 5 && f <= 8) p.hit(HD.a3, { x0: 0, x1: 142, d: 28, z0: 20, z1: 150 });
    },
  },
  a4: {
    anim: 'a4', len: 36, cancel: 12, atkCancel: 17, trail: [[6, 11]],
    update(p, f) {
      if (f === 5) { Sfx.play('swingBig'); p.bladeGlow = 0.7; }
      p.vx = (f >= 5 && f <= 9) ? p.facing * 3.5 : p.vx * 0.6;
      if (f >= 7 && f <= 10) p.hit(HD.a4, { x0: -10, x1: 124, d: 34, z0: -10, z1: 210 });
      if (f === 9) {
        const x = p.x + p.facing * 95, y = sy(p.y, 0);
        FX.add('ground', new Ring(x, y, 10, 90, 18, { w: 8 }));
        Hitfx.dust(x, y, 7, 26);
        for (let i = 0; i < 6; i++) FX.add('world', new Debris(x, p.y, 2, { vx: rand(-3, 3) + p.facing * 2, vz: rand(5, 9), s: rand(2, 4) }));
        Game.addShake(3); Sfx.play('thud', 0.6);
      }
    },
  },
  dashAtk: {
    anim: 'dashAtk', len: 30, cancel: 10, chain: 12, next: 'a2', trail: [[3, 9]],
    update(p, f) {
      if (f === 1) { Sfx.play('dash', 0.8); p.afterOn = 10; }
      if (f === 3) Sfx.play('swingBig');
      p.vx = f <= 12 ? p.facing * (12 - f * 0.55) : p.vx * 0.7;
      if (f >= 4 && f <= 9) p.hit(HD.dash, { x0: -10, x1: 112, d: 32, z0: 0, z1: 160 });
      if (f % 3 === 0 && f < 12) Hitfx.dust(p.x - p.facing * 10, sy(p.y, 0), 1, 4);
    },
  },
  jumpAtk: {
    anim: 'jumpAtk', len: 18, air: true, chain: 11, next: 'jumpAtk', trail: [[2, 6]],
    start(p) { p.popped = false; },
    update(p, f) {
      if (f === 1) Sfx.play('swing', 1, 1.05);
      if (f >= 3 && f <= 7) p.hit(HD.jump, { x0: -12, x1: 102, d: 32, z0: -80, z1: 100 });
    },
    onHit(p) { if (!p.popped) { p.popped = true; p.vz = Math.max(p.vz, 3.4); } },
  },
  back: {
    anim: 'back', len: 20, cancel: 10, atkCancel: 9, noTurn: true,
    start(p) { p.vx = -p.facing * 9.5; p.vz = 5.2; p.invul = 15; p.afterOn = 8; Sfx.play('dash', 0.6); },
    update(p, f) { if (p.z <= 0 && f > 3) p.vx *= 0.7; },
    onLand(p) { p.vx *= 0.3; Hitfx.dust(p.x, sy(p.y, 0), 3, 10); Sfx.play('land', 0.5); },
  },

  // ------------------- 스킬 -------------------
  upper: {
    anim: 'upper', len: 32, cancel: 12, atkCancel: 12, trail: [[5, 11]],
    update(p, f) {
      p.vx *= 0.7;
      if (f === 1) p.bladeGlow = 1;
      if (f === 5) { Sfx.play('swingBig'); Sfx.play('ring', 0.6); p.vz = 4.5; p.vx = p.facing * 2; }
      if (f === 7) crescentAt(p, 22, 60, 88, 70, -115, { th: 30, life: 14 });
      if (f >= 6 && f <= 10) p.hit(HD.upper, { x0: -10, x1: 108, d: 34, z0: -10, z1: 180 });
    },
  },
  rush: {
    anim: 'rush', len: 46, cancel: 33, atkCancel: 33,
    update(p, f) {
      p.armorF = f >= 8 && f <= 24;
      if (f === 1) { Sfx.play('charge', 0.6); p.bladeGlow = 1; }
      if (f < 8) { p.vx *= 0.5; if (f % 2) convergeMotes(p.x + p.facing * 20, sy(p.y, p.z + 70), 2); }
      if (f === 8) { Sfx.play('dash'); Sfx.play('swingBig'); p.afterOn = 18; Game.speedLines(p.facing, 22); }
      if (f >= 8 && f < 24) {
        p.vx = p.facing * 15; p.vy = 0;
        if ((f - 8) % 3 === 0) p.swing = newSwing();
        p.hit(HD.rushHit, { x0: -25, x1: 80, d: 36, z0: 0, z1: 150 });
        if (f % 2 === 0) Hitfx.dust(p.x - p.facing * 20, sy(p.y, 0), 1, 6);
        if (f % 2 === 0) FX.add('world', new CutLine(p.x + p.facing * 60, sy(p.y, p.z + 74), p.facing > 0 ? 0 : Math.PI, 70, 3, '150,210,255', 6));
      }
      if (f === 24) p.vx = p.facing * 3;
      if (f > 24) p.vx *= 0.8;
      if (f === 27) { p.swing = newSwing(); Sfx.play('swingBig'); Sfx.play('ring', 0.5); p.trailOn = true; }
      if (f === 29) crescentAt(p, 18, 62, 96, 60, -120, { th: 34, life: 15 });
      if (f >= 28 && f <= 31) p.hit(HD.rushEnd, { x0: -10, x1: 118, d: 36, z0: -10, z1: 175 });
    },
    trail: [[27, 33]],
  },
  triple: {
    anim: 'triple', len: 64, cancel: 50, atkCancel: 50, trail: [[3, 9], [21, 27], [39, 46]],
    update(p, f) {
      for (let i = 0; i < 3; i++) {
        const s = i * 18;
        if (f === s + 1) {
          const ax = Input.axisX(); if (ax) p.facing = ax;
          p.steerY = Input.axisY(); p.swing = newSwing();
        }
        if (f === s + 4) {
          Sfx.play(i === 2 ? 'swingBig' : 'swing', 1, 1 + i * 0.08); Sfx.play('ring', 0.45, 1 + i * 0.12);
          p.afterOn = 9; p.bladeGlow = 1;
          if (i === 0) crescentAt(p, 20, 70, 92, -120, 55, { th: 30 });
          if (i === 1) crescentAt(p, 20, 60, 92, 70, -115, { th: 30 });
          if (i === 2) { crescentAt(p, 26, 70, 118, -125, 65, { th: 44, col: '150,170,255' }); Game.speedLines(p.facing, 12); }
        }
        if (f >= s + 4 && f <= s + 11) {
          p.vx = p.facing * (i === 2 ? 12.5 : 11); p.vy = (p.steerY || 0) * 4;
          p.hit(i === 0 ? HD.tri1 : i === 1 ? HD.tri2 : HD.tri3, { x0: -20, x1: 112, d: 36, z0: -10, z1: 175 });
        } else if (f > s + 11 && f < s + 18) { p.vx *= 0.55; p.vy *= 0.5; }
      }
      if (f > 54) { p.vx *= 0.7; p.vy = 0; }
    },
  },
  draw: {
    anim: 'drawReady', len: 76, cancel: 54, atkCancel: 54,
    update(p, f) {
      const r = Game.room;
      p.armorF = f < 22;
      if (f === 1) { Sfx.play('charge'); Game.dimTo(0.45, 10); p.vy = 0; }
      if (f < 20) {
        p.vx *= 0.5; p.ghostGlow = f / 20;
        if (f % 2) convergeMotes(p.x - p.facing * 30, sy(p.y, 60), 3, '140,200,255', 140);
      }
      if (f === 20) {
        const x0 = p.x, x1 = clamp(p.x + p.facing * 360, r.minX, r.maxX);
        const lo = Math.min(x0, x1) - 30, hi = Math.max(x0, x1) + 30;
        p.marked = Game.enemies.filter(e => e.hittable() && e.x > lo && e.x < hi && Math.abs(e.y - p.y) < 50 && e.z < 160);
        for (let i = 0; i < 6; i++) {
          const u = i / 6;
          p.addGhost(lerp(x0, x1, u), p.y, p.z, p.facing, lerpPose(PP.drawR, PP.drawF, u, P()), 18 + i * 2, '140,200,255');
        }
        p.x = x1; p.px = x1; p.invul = Math.max(p.invul, 30);
        FX.add('world', new FlashLine(x0, x1, sy(p.y, 76), 30));
        Sfx.play('flash'); Game.flashScreen(0.9, '255,255,255'); Game.addShake(6);
        p.play('drawFollow', 0, 1, true); p.ghostGlow = 0; p.bladeGlow = 1.5;
        p.swing = newSwing();
        for (const e of p.marked) applyHit(p, e, HD.drawMark, { noStopAtt: true, dir: p.facing });
      }
      if (f > 20) p.vx = 0;
      if (f === 46) Sfx.play('sheath');
      if (f === 50) {
        let any = false;
        for (const e of p.marked || []) {
          if (!e.hittable()) continue;
          any = true;
          applyHit(p, e, HD.drawFinal, { noStopAtt: true, dir: p.facing });
        }
        Game.dimTo(0, 20);
        if (any) { Game.flashScreen(0.35, '255,230,220'); Game.addShake(8); Game.zoomPunch(1.04); }
        p.marked = null;
      }
    },
  },
  quake: {
    anim: 'ebCrouch', len: 999, noAirEnd: true,
    start(p) {
      p.armorF = true;
      if (p.z > 5) { p.qPhase = 'plunge'; p.vz = -22; p.play('ebPlunge', 1, 1, true); p.afterOn = 10; Sfx.play('swingBig'); }
      else { p.qPhase = 'crouch'; }
      p.qT = 0;
    },
    update(p, f) {
      p.qT++; p.armorF = true; p.vy = 0;
      if (p.qPhase === 'crouch') {
        p.vx *= 0.5;
        if (p.qT === 6) { p.qPhase = 'rise'; p.vz = 13; p.vx = p.facing * 2.5; Sfx.play('jump'); p.play('ebRise', 3, 1, true); p.bladeGlow = 1.2; Hitfx.dust(p.x, sy(p.y, 0), 5, 16); }
      } else if (p.qPhase === 'rise') {
        if (p.vz < 1.5) { p.qPhase = 'plunge'; p.vz = -24; p.vx = p.facing * 3; p.play('ebPlunge', 1, 1, true); Sfx.play('swingBig'); p.afterOn = 10; }
      } else if (p.qPhase === 'plunge') {
        p.vz = Math.min(p.vz, -24); p.bladeGlow = 1.5;
      } else if (p.qPhase === 'impact') {
        if (p.qT === 12) {
          p.swing = newSwing();
          const cx = p.x + p.facing * 40;
          FX.add('ground', new Ring(cx, sy(p.y, 0), 60, 380, 26, { w: 14, col: '255,200,120' }));
          for (let i = 0; i < 16; i++) {
            const a = i / 16 * TAU, d = rand(230, 320);
            FX.add('world', new Debris(cx + Math.cos(a) * d, clamp(p.y + Math.sin(a) * d * 0.35, 0, DEPTH), 0, { vx: Math.cos(a) * 2, vz: rand(7, 12), s: rand(3, 6), glow: '255,140,60' }));
          }
          for (const e of Game.enemies) {
            if (!e.hittable() || p.swing.set.has(e)) continue;
            if (Math.abs(e.x - cx) < 340 && Math.abs(e.y - p.y) < 115 && e.z < 150) { p.swing.set.add(e); applyHit(p, e, HD.quake2, { noStopAtt: true, dir: sign(e.x - cx) }); }
          }
          Sfx.play('quake', 0.7); Game.addShake(8);
        }
        if (p.qT >= 16) p.atkOK = true;
        if (p.qT >= 36) p.actDone = true;
      }
    },
    onLand(p) {
      if (p.qPhase !== 'plunge') return;
      p.qPhase = 'impact'; p.qT = 0; p.vx = 0;
      p.play('ebImpact', 0, 1, true);
      const cx = p.x + p.facing * 40, gy = sy(p.y, 0);
      FX.add('ground', new Ring(cx, gy, 20, 250, 22, { w: 18, col: '255,230,190' }));
      FX.add('ground', new Crack(cx, p.y, 150));
      FX.add('world', new Flash(cx, gy - 20, 40, 260, 20, '255,220,160', 0.9));
      FX.add('world', new Pillar(cx, p.y, 70, 300, 26, '140,190,255', '230,245,255'));
      for (let i = 0; i < 26; i++) FX.add('world', new Debris(cx + rand(-60, 60), p.y + rand(-20, 20), 4, { vx: rand(-8, 8), vz: rand(8, 17), s: rand(3, 8), glow: chance(0.4) ? '255,160,60' : null }));
      Hitfx.dust(cx, gy, 16, 120);
      Hitfx.sparks(cx, gy - 10, 1, 12, { ang: -Math.PI / 2, spread: 1.4, max: 22 });
      Hitfx.sparks(cx, gy - 10, -1, 12, { ang: -Math.PI / 2, spread: 1.4, max: 22 });
      p.swing = newSwing();
      for (const e of Game.enemies) {
        if (!e.hittable()) continue;
        if (Math.abs(e.x - cx) < 220 && Math.abs(e.y - p.y) < 85 && e.z < 140) { p.swing.set.add(e); applyHit(p, e, HD.quake1, { noStopAtt: true, dir: sign(e.x - cx) || p.facing }); }
      }
      Sfx.play('quake'); Game.addShake(16); Game.zoomPunch(1.05);
      p.hitstop = 6;
    },
  },
  ult: {
    anim: 'ultUp', len: 136, cancel: 104, atkCancel: 102,
    start(p) { Game.startCutin(p); p.invul = 260; p.vx = 0; p.vy = 0; },
    update(p, f) {
      p.invul = Math.max(p.invul, 12); p.armorF = true;
      if (f === 1) {
        p.visible = false; Game.dimTo(0.72, 8);
        p.ultTargets = Game.enemies.filter(e => e.hittable() && Math.abs(e.x - p.x) < 760);
        for (const e of p.ultTargets) e.suspend = 96;
        p.ultX = p.x;
      }
      if (f >= 4 && f <= 66 && f % 3 === 1) {
        const alive = p.ultTargets.filter(e => e.hittable());
        if (alive.length) {
          const e = alive[(f / 3 | 0) % alive.length];
          const ang = rand(-0.9, 0.9) + (chance(0.5) ? Math.PI / 2 : 0);
          const cx = e.x + rand(-12, 12), cz = e.z + e.hurtH() * 0.5;
          FX.add('world', new CutLine(cx, sy(e.y, cz), ang, 190 + rand(0, 90), 6, chance(0.5) ? '255,90,70' : '140,200,255', 12));
          const gf = chance(0.5) ? 1 : -1;
          p.addGhost(e.x - gf * rand(40, 90), e.y, rand(0, 60), gf, chance(0.5) ? PP.a1s : PP.a2s, 12, chance(0.5) ? '255,70,60' : '120,180,255');
          p.swing = newSwing();
          applyHit(p, e, HD.ultHit, { noStopAtt: true, dir: gf, hz: cz });
        }
        Game.addShake(2);
      }
      if (f === 72) {
        const alive = p.ultTargets.filter(e => e.hittable());
        if (alive.length) {
          const avg = alive.reduce((s, e) => s + e.x, 0) / alive.length;
          p.x = clamp(avg - p.facing * 110, Game.room.minX, Game.room.maxX);
        }
        p.visible = true; p.z = 110; p.vz = 0; p.gravOff = true;
        p.play('ultUp', 0, 1, true); Sfx.play('charge'); p.bladeGlow = 2.5; p.ghostGlow = 1;
        FX.add('world', new Flash(p.x, sy(p.y, p.z + 80), 20, 200, 18, '255,80,60', 0.8));
      }
      if (f > 72 && f < 90) {
        p.vz = 0.2;
        convergeMotes(p.x - p.facing * 5, sy(p.y, p.z + 150), 3, chance(0.5) ? '255,90,60' : '255,220,200', 180);
      }
      if (f === 90) {
        p.gravOff = false; p.vz = -9;
        p.play('ultDn', 0, 1, true); p.trailOn = true;
        crescentAt(p, 60, 130, 300, -118, 72, { th: 90, life: 30, col: '255,70,50', core: '255,240,230', speed: 4, grow: 0.08 });
        crescentAt(p, 60, 130, 260, -110, 66, { th: 40, life: 24, col: '255,190,160', speed: 3 });
        Game.flashScreen(1, '255,255,255'); Sfx.play('explode'); Sfx.play('cutin', 0.6);
        Game.addShake(24); Game.slowmo(0.22, 55); Game.zoomPunch(1.1); Game.dimTo(0, 30);
        p.swing = newSwing();
        for (const e of p.ultTargets) {
          if (!e.hittable()) continue;
          e.suspend = 0;
          applyHit(p, e, HD.ultFinal, { noStopAtt: true, dir: sign(e.x - p.x) || p.facing });
          FX.add('world', new Pillar(e.x, e.y, 60, 420, 30, '255,80,60', '255,230,220'));
        }
        p.ghostGlow = 0;
      }
      if (f > 90 && f < 96) p.trailOn = true;
    },
    trail: [[90, 96]],
  },
};

for (const k in PA) PA[k].name = k;
for (const s of SKILLS) PA[s.act].isSkill = true;

// 지면 균열 (지진검)
class Crack {
  constructor(x, y, R) {
    Object.assign(this, { x, y, R, t: 0, life: 110 });
    this.lines = [];
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU + rand(-0.2, 0.2);
      const pts = [0, 0]; let r = 0, aa = a;
      while (r < R * rand(0.6, 1)) { r += rand(14, 26); aa += rand(-0.35, 0.35); pts.push(Math.cos(aa) * r, Math.sin(aa) * r * 0.34); }
      this.lines.push(pts);
    }
  }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, a = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3, gy = sy(this.y, 0);
    ctx.save(); ctx.translate(this.x, gy);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = `rgba(10,6,4,${0.8 * a})`; ctx.lineWidth = 5;
    for (const L of this.lines) { ctx.beginPath(); ctx.moveTo(L[0], L[1]); for (let i = 2; i < L.length; i += 2) ctx.lineTo(L[i], L[i + 1]); ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,150,60,${0.8 * a * (1 - u * 0.6)})`; ctx.lineWidth = 2;
    for (const L of this.lines) { ctx.beginPath(); ctx.moveTo(L[0], L[1]); for (let i = 2; i < L.length; i += 2) ctx.lineTo(L[i], L[i + 1]); ctx.stroke(); }
    ctx.restore();
  }
}

// ------------------------------------------------------------
class Player extends Entity {
  constructor() {
    super(RIG_PLAYER, ANIM_P);
    this.isPlayer = true; this.w = 16; this.d = 11; this.h = 134;
    // 클리어 기록에 따라 강해진다 (공격력은 난이도 배율과 같은 곡선)
    const P = typeof playerPower === 'function' ? playerPower() : 1;
    this.power = P;
    this.lv = typeof playerLevel === 'function' ? playerLevel() : 70;
    this.hpMax = Math.round(34000 * (1 + (P - 1) * 0.35)); this.hp = this.hpMax;
    this.mpMax = 1500; this.mp = this.mpMax; this.mpRegen = 42;
    this.atk = Math.round(3000 * P); this.critRate = 0.2;
    this.state = 'ground'; this.running = false; this.act = null; this.af = 0; this.stT = 0;
    this.buf = {}; this.dashDir = 0;
    this.cd = {}; for (const s of SKILLS) this.cd[s.key] = 0;
    this.pots = { hp: 3, mp: 3 }; this.potCd = 0;
    this.swing = newSwing(); this.hitCount = 0;
    this.tail = new Chain(4, 9, 0.42, 0.86);
    this.ribbon = new Chain(4, 7, 0.3, 0.84);
    this.bladeGlow = 0; this.ghostGlow = 0; this.armorF = false; this.landT = 0;
    this.play('idle', 0);
  }

  reset(x, y) {
    this.x = this.px = x; this.y = y; this.z = this.pz = 0; this.vx = this.vy = this.vz = 0;
    this.state = 'ground'; this.act = null; this.visible = true; this.gravOff = false; this.armorF = false;
    this.trail.length = 0; this.after.length = 0; this.facing = 1; this.running = false; this.buf = {};
    this.tail.reset(); this.ribbon.reset(); this.play('idle', 0, 1, true);
  }

  has(a) { return this.buf[a] > 0; }
  use(a) { this.buf[a] = 0; }
  hittable() { return this.hp > 0; }

  update() {
    this.px = this.x; this.pz = this.z;
    if (this.flash > 0) this.flash--;
    for (const q of Input.drain()) {
      if (q.a === 'dash') { this.buf.dash = 16; this.dashDir = q.dir; }
      else this.buf[q.a] = 16;
    }
    if (this.hitstop > 0) { this.hitstop--; return; }
    this.shakeHit = false;
    for (const k in this.buf) if (this.buf[k] > 0) this.buf[k]--;
    for (const k in this.cd) if (this.cd[k] > 0) this.cd[k] = Math.max(0, this.cd[k] - 1 / 60);
    if (this.invul > 0) this.invul--;
    if (this.potCd > 0) this.potCd--;
    if (this.state !== 'dead') this.mp = Math.min(this.mpMax, this.mp + this.mpRegen / 60);
    this.bladeGlow = Math.max(0, this.bladeGlow - 0.035);
    this.stT++;
    this.handlePotions();

    switch (this.state) {
      case 'ground': this.stGround(); break;
      case 'air': this.stAir(); break;
      case 'act': this.stAct(); break;
      case 'hurt': this.stHurt(); break;
      case 'fall': this.vx *= 0.98; break;
      case 'down': this.stDown(); break;
      case 'getup': if (this.stT >= 18) this.setState('ground'); this.vx *= 0.8; break;
      case 'dead': this.vx *= 0.9; break;
      case 'cine': this.vx *= 0.8; this.vy *= 0.8; break;
    }
    this.physics();
    this.stepAnim();
    this.updateChains();
    this.updateTrailAfter();
    // 달리기 먼지
    if (this.state === 'ground' && this.running && Math.abs(this.vx) > 1 && Game.frame % 6 === 0) Hitfx.dust(this.x - this.facing * 12, sy(this.y, 0), 1, 4);
  }

  setState(s) { this.state = s; this.stT = 0; }

  updateChains() {
    const J = this.J, F = torsoFrame(J);
    const [tx, ty] = tp(J.hip, F, -10, -3);
    const w = this.toWorld({ x: tx, y: ty });
    const wind = -this.facing * (0.22 + Math.abs(this.vx) * 0.04) + Math.sin(Game.time * 0.07) * 0.08;
    this.tail.update(w[0], w[1], wind);
    const hr = J.headRot, c = Math.cos(hr), s = Math.sin(hr);
    const hx = J.head.x + (-12 * c - -4.5 * s), hy = J.head.y + (-12 * s + -4.5 * c);
    const w2 = this.toWorld({ x: hx, y: hy });
    this.ribbon.update(w2[0], w2[1], wind * 1.2);
  }

  handlePotions() {
    if (this.state === 'dead' || this.potCd > 0) return;
    if (this.has('pot1')) {
      this.use('pot1');
      if (this.pots.hp > 0 && this.hp < this.hpMax) {
        this.pots.hp--; this.potCd = 30;
        const v = Math.round(this.hpMax * 0.4); this.hp = Math.min(this.hpMax, this.hp + v);
        Sfx.play('potion'); FX.add('top', new DmgText(this.x, sy(this.y, this.z) - 150, v, 'h'));
        for (let i = 0; i < 16; i++) FX.add('world', new Mote(this.x + rand(-22, 22), sy(this.y, 0) - rand(0, 110), 0, rand(-2.2, -0.6), { col: '255,90,90', life: 40, r: 8 }));
      } else Sfx.play('ui', 0.6, 0.6);
    }
    if (this.has('pot2')) {
      this.use('pot2');
      if (this.pots.mp > 0 && this.mp < this.mpMax) {
        this.pots.mp--; this.potCd = 30;
        this.mp = Math.min(this.mpMax, this.mp + this.mpMax * 0.5);
        Sfx.play('potion', 1, 1.3);
        for (let i = 0; i < 16; i++) FX.add('world', new Mote(this.x + rand(-22, 22), sy(this.y, 0) - rand(0, 110), 0, rand(-2.2, -0.6), { col: '90,150,255', life: 40, r: 8 }));
      } else Sfx.play('ui', 0.6, 0.6);
    }
  }

  canSkill(k) {
    const s = SKILL_BY_KEY[k];
    return this.cd[k] <= 0 && this.mp >= s.mp;
  }
  trySkills(allowAir, exclude) {
    for (const s of SKILLS) {
      if (!this.has(s.key)) continue;
      if (exclude && s.act === exclude) continue;
      if (this.z > 1 && !(allowAir && s.air) && s.key !== 's5' && s.key !== 's6') continue;
      this.use(s.key);
      if (!this.canSkill(s.key)) {
        if (this.cd[s.key] <= 0 && this.mp < s.mp) Game.notice('MP가 부족합니다');
        Sfx.play('ui', 0.5, 0.5);
        continue;
      }
      this.mp -= s.mp; this.cd[s.key] = s.cd;
      Game.stats.skills++;
      this.startAct(PA[s.act]);
      return true;
    }
    return false;
  }

  startAct(act) {
    const ax = Input.axisX();
    if (ax && !act.noTurn) this.facing = ax;
    if (this.act && this.act.end) this.act.end(this);
    this.act = act; this.af = 0; this.setState('act'); this.actDone = false;
    this.swing = newSwing(); this.hitCount = 0; this.armorF = false; this.atkOK = false;
    this.vy = 0;
    this.trailOn = false;
    this.play(act.anim, act.blend ?? 2, 1, true);
    if (act.start) act.start(this);
  }

  endAct() {
    if (this.act && this.act.end) this.act.end(this);
    this.act = null; this.trailOn = false; this.armorF = false; this.gravOff = false; this.visible = true;
    if (this.z > 0.5) { this.setState('air'); this.play('air', 4); }
    else { this.setState('ground'); this.play('idle', 6); }
  }

  stGround() {
    const ax = Input.axisX(), ay = Input.axisY();
    if (this.has('dash') && this.dashDir === ax) { this.running = true; this.use('dash'); }
    if (ax === 0) this.running = false;
    if (ax) { if (ax !== this.facing && this.running) this.running = false; this.facing = ax; }
    const sp = this.running ? 7 : 3.7;
    this.vx = ax * sp; this.vy = ay * (this.running ? 3.1 : 2.6);
    if (this.landT > 0) this.landT--;
    if (this.tryGroundActions()) return;
    if (ax || ay) this.play(this.running ? 'run' : 'walk', 4);
    else if (this.landT <= 0) this.play('idle', 6);
  }

  tryGroundActions() {
    if (this.trySkills(false)) return true;
    if (this.has('back')) { this.use('back'); this.startAct(PA.back); return true; }
    if (this.has('attack')) { this.use('attack'); this.startAct(this.running ? PA.dashAtk : PA.a1); return true; }
    if (this.has('jump')) { this.use('jump'); this.jump(); return true; }
    return false;
  }

  jump() {
    const ax = Input.axisX();
    this.setState('air');
    this.vz = 11.4;
    this.vx = ax * (this.running ? 6.6 : 3.7);
    this.play('air', 3, 1, true);
    Sfx.play('jump'); Hitfx.dust(this.x, sy(this.y, 0), 3, 8);
  }

  stAir() {
    const ax = Input.axisX(), ay = Input.axisY();
    const sp = this.running ? 6.6 : 3.7;
    this.vx = approach(this.vx, ax * sp, 0.55);
    this.vy = approach(this.vy, ay * 2.2, 0.4);
    if (ax) this.facing = ax;
    if (this.trySkills(true)) return;
    if (this.has('attack')) { this.use('attack'); this.startAct(PA.jumpAtk); return; }
    this.play('air', 4);
  }

  stAct() {
    const act = this.act;
    this.af++;
    const f = this.af;
    if (act.trail) this.trailOn = act.trail.some(r => f >= r[0] && f <= r[1]);
    act.update(this, f);
    if (this.state !== 'act' || this.act !== act) return;
    if (act.next && f >= act.chain && this.has('attack')) {
      this.use('attack');
      const nx = PA[act.next];
      if (nx === PA.jumpAtk && this.z <= 0.5) { /* 착지 후엔 연결 안 함 */ }
      else { this.startAct(nx); return; }
    }
    // 스킬/백스텝 → 평타 캔슬 (평타를 섞은 콤보)
    if (((act.atkCancel !== undefined && f >= act.atkCancel) || this.atkOK) && this.has('attack')) {
      this.use('attack');
      this.startAct(this.z > 40 || (this.z > 0.5 && this.vz > 2) ? PA.jumpAtk : PA.a1);
      return;
    }
    if (f >= (act.cancel ?? 9999)) {
      if (this.trySkills(true, act.isSkill ? act.name : null)) return;
      if (this.z <= 0.5 && this.has('back')) { this.use('back'); this.startAct(PA.back); return; }
      if (this.z <= 0.5 && this.has('jump') && act !== PA.back) { this.use('jump'); this.endAct(); this.jump(); return; }
    }
    if (f >= act.len || this.actDone) this.endAct();
  }

  onLand(vz) {
    if (this.state === 'air') {
      this.setState('ground'); this.landT = 6;
      this.play('land', 1, 1, true);
      Hitfx.dust(this.x, sy(this.y, 0), 4, 12); Sfx.play('land');
    } else if (this.state === 'act') {
      if (this.act.onLand) this.act.onLand(this, vz);
      if (this.act && this.act.air) { this.endAct(); this.landT = 5; this.play('land', 1, 1, true); Hitfx.dust(this.x, sy(this.y, 0), 3, 10); Sfx.play('land', 0.7); }
    } else if (this.state === 'fall' || this.state === 'dead') {
      if (!this.bounced && vz < -5) { this.vz = -vz * 0.3; this.bounced = true; Hitfx.dust(this.x, sy(this.y, 0), 6, 20); Sfx.play('thud', 0.7); }
      else {
        this.vx *= 0.3;
        if (this.state === 'dead') { this.play('down', 3); Game.onPlayerDead(); }
        else { this.setState('down'); this.play('down', 3); }
        Hitfx.dust(this.x, sy(this.y, 0), 5, 20);
      }
    }
  }

  stHurt() {
    this.vx *= 0.85;
    if (this.stT >= this.hurtT) { this.setState('ground'); this.play('idle', 6); }
  }

  stDown() {
    this.vx *= 0.8;
    if (this.stT > 6 && this.has('jump')) {
      this.use('jump');
      this.setState('getup'); this.invul = 40; this.vz = 6; this.stT = 8;
      this.play('air', 2, 1, true); Sfx.play('dash', 0.6); this.afterOn = 10;
      FX.add('top', new Label(this.x, sy(this.y, 0) - 100, 'QUICK REBOUND', { col: ['#ffffff', '#8fe3ff'], size: 16 }));
      return;
    }
    if (this.stT >= 40) { this.setState('getup'); this.invul = 50; this.play('getup', 2, 1, true); }
  }

  takeHit(hit, att, dir, dmg) {
    if (this.state === 'dead') return;
    this.hp -= dmg;
    Game.onPlayerDamaged(dmg);
    if (this.hp <= 0) {
      this.hp = 0;
      if (this.act && this.act.end) this.act.end(this);
      this.act = null; this.trailOn = false; this.gravOff = false; this.visible = true;
      this.setState('dead'); this.vz = 7; this.vx = dir * 5; this.bounced = false; this.facing = -dir;
      this.play('fall', 2, 1, true);
      Game.slowmo(0.3, 60);
      return;
    }
    if (this.armorF || this.invul > 0) return;
    if (this.act && this.act.end) this.act.end(this);
    this.act = null; this.trailOn = false; this.gravOff = false; this.visible = true; this.running = false;
    this.facing = -dir;
    if (hit.down || hit.kz > 0 || this.z > 0.5) {
      this.setState('fall'); this.bounced = false;
      this.vz = Math.max(5, hit.kz || 6); this.vx = dir * (hit.kx || 4) * 0.8;
      this.play('fall', 2, 1, true);
    } else {
      this.setState('hurt'); this.hurtT = hit.stun || 18;
      this.vx = dir * (hit.kx || 3);
      this.hurtFlip = !this.hurtFlip;
      this.play(this.hurtFlip ? 'hurt1' : 'hurt2', 1, 1, true);
    }
  }

  // 공격 판정
  hit(hd, box) {
    const B = attackBox(this, box);
    if (Game.debug) Game.debugBoxes.push(B);
    let n = 0;
    for (const e of Game.enemies) {
      if (!e.hittable() || this.swing.set.has(e)) continue;
      if (!overlaps(B, e)) continue;
      this.swing.set.add(e);
      applyHit(this, e, hd);
      n++;
    }
    if (n) { this.hitCount += n; if (this.act && this.act.onHit) this.act.onHit(this, n); }
    return n;
  }

  revive() {
    this.hp = this.hpMax; this.mp = this.mpMax; this.invul = 120;
    this.setState('getup'); this.play('getup', 2, 1, true);
    for (let i = 0; i < 30; i++) FX.add('world', new Mote(this.x + rand(-40, 40), sy(this.y, 0) - rand(0, 140), 0, rand(-3, -1), { col: '255,230,150', life: 50, r: 10 }));
    FX.add('ground', new Ring(this.x, sy(this.y, 0), 10, 200, 30, { col: '255,230,150' }));
    Sfx.play('clear');
  }
}
