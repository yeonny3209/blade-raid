'use strict';
// ============================================================
//  보스 : 뿔의 군주 바르카스
// ============================================================
ENEMY_TYPES.boss = {
  name: '뿔의 군주 바르카스', lv: 70, rig: RIG_BOSS, anims: ANIM_BOSS, hpMax: 1250000, atk: 5000, speed: 2.1,
  w: 38, d: 22, h: 292, weight: 3, range: 200, gold: [40, 60], lines: 62,
};

const BH = {
  swing1: { dmg: 1.0, kx: 8, kz: 6, stun: 30, stop: 10, shake: 9, fx: 'heavy', sfx: 'heavy', down: true },
  swing2: { dmg: 0.9, kx: 5, kz: 10, stun: 30, stop: 8, shake: 7, fx: 'heavy', sfx: 'heavy', down: true },
  charge: { dmg: 1.1, kx: 11, kz: 8, stun: 30, stop: 9, shake: 8, fx: 'blunt', sfx: 'heavy', down: true },
  slam: { dmg: 1.35, kx: 6, kz: 11, stun: 30, stop: 10, shake: 10, fx: 'heavy', sfx: 'none', down: true },
  erupt: { dmg: 0.8, kx: 2, kz: 10, stun: 30, stop: 6, shake: 4, fx: 'none', sfx: 'hurt', down: true },
  roar: { dmg: 0.25, kx: 12, kz: 6, stun: 30, stop: 4, shake: 2, fx: 'none', sfx: 'hurt', down: true },
};

class Boss extends Enemy {
  constructor(x, y) {
    super('boss', x, y);
    this.isBoss = true; this.heavy = true; this.noLaunch = true;
    this.brkMax = 100; this.brk = 100; this.breakT = 0;
    this.cds = { swing: 60, charge: 200, leap: 260, erupt: 330 };
    this.enraged = false; this.summon2 = false;
    this.cape = new Chain(5, 15, 0.5, 0.88);
    this.flinchCd = 0; this.shadowMul = 1.3;
    this.acts = BOSS_ACTS;
    this.state = 'intro';
  }

  hurtH() { return this.state === 'break' ? this.h * 0.72 : (this.state === 'dying' && this.landedDead ? 90 : this.h); }
  hittable() { return super.hittable() && this.state !== 'intro' && this.z < 160; }

  updateCape() {
    const J = this.J, F = torsoFrame(J);
    const [cx, cy] = tp(J.hip, F, -20, F.L - 4);
    const w = this.toWorld({ x: cx, y: cy });
    this.cape.seg = 15 * this.scale;
    this.cape.update(w[0], w[1], -this.facing * (0.4 + Math.abs(this.vx) * 0.05) + Math.sin(Game.time * 0.05) * 0.15);
  }

  onDamaged(hit, dmg) {
    if (this.state === 'break' || this.dying) return;
    this.brk -= hit.dmg * 1.35 + 0.4;
    if (this.brk <= 0) { this.brk = 0; this.startBreak(); }
  }

  startBreak() {
    this.interrupt();
    this.setState('break'); this.breakT = 300; this.gravOff = false;
    this.play('kneel', 8, 1, true);
    Game.bigText('BREAK!!', '#ffd24a', '#ff5a1a');
    Sfx.play('break'); Game.addShake(12); Game.slowmo(0.35, 40); Game.flashScreen(0.4, '255,220,160');
    const X = this.x, Y = sy(this.y, this.h * 0.6);
    for (let i = 0; i < 30; i++) {
      const a = rand(0, TAU), s = rand(6, 20);
      FX.add('world', new Spark(X, Y, Math.cos(a) * s, Math.sin(a) * s, { col: choose(['200,230,255', '255,255,255', '255,210,120']), life: randi(18, 32), w: rand(2, 4), grav: 0.3 }));
    }
    FX.add('world', new Flash(X, Y, 40, 300, 26, '255,210,120', 0.9));
    FX.add('ground', new Ring(X, sy(this.y, 0), 30, 320, 30, { col: '255,220,160', w: 14 }));
  }

  stCustom() {
    if (this.state === 'break') {
      this.vx *= 0.8; this.vy = 0;
      this.breakT--;
      if (this.breakT % 20 === 0) FX.add('world', new Mote(this.x + rand(-40, 40), sy(this.y, this.h * 0.7), 0, -1, { col: '255,220,120', life: 30, r: 10 }));
      if (this.breakT <= 0) {
        this.brk = this.brkMax; this.setState('idle'); this.aiWait = 10;
        this.play('idle', 10);
        Sfx.play('roar', 0.5, 1.2);
      }
    } else if (this.state === 'intro') {
      this.vx = 0; this.vy = 0;
    }
  }

  takeHit(hit, att, dir, dmg) {
    this.hp -= dmg;
    Game.setTarget(this);
    this.onDamaged(hit, dmg);
    if (this.hp <= 0) { this.die(hit, dir); return; }
    this.vx += dir * (hit.kx || 0) * 0.06;
    if (this.state === 'idle' || this.state === 'move') {
      if (this.flinchCd <= 0 && hit.dmg >= 1.5) {
        this.setState('hurt'); this.hurtT = 10; this.flinchCd = 70;
        this.hurtFlip = !this.hurtFlip; this.play(this.hurtFlip ? 'hurt1' : 'hurt2', 2, 1, true);
      }
    }
  }

  update() {
    if (this.hitstop <= 0) {
      if (this.flinchCd > 0) this.flinchCd--;
      for (const k in this.cds) if (this.cds[k] > 0) this.cds[k]--;
    }
    super.update();
  }

  ai(p) {
    const dx = p.x - this.x, dy = p.y - this.y, adx = Math.abs(dx);
    const want = dx >= 0 ? 1 : -1;
    if (want !== this.facing) { this.turnT = (this.turnT || 0) + 1; if (this.turnT > (this.enraged ? 10 : 18)) { this.facing = want; this.turnT = 0; } }
    else this.turnT = 0;
    if (!this.enraged && this.hp < this.hpMax * 0.5) { this.startAttack('roar'); return; }
    if (this.enraged && !this.summon2 && this.hp < this.hpMax * 0.25) { this.summon2 = true; this.startAttack('roar'); return; }
    if (this.aiWait > 0) {
      this.aiWait--;
      if (adx > 260) this.moveTo(p.x - want * 200, p.y, this.speed * 0.8); else { this.vx *= 0.8; this.vy *= 0.8; this.play('idle', 8); }
      return;
    }
    const c = this.cds, faceOK = want === this.facing;
    if (adx < 240 && Math.abs(dy) < 50 && faceOK && c.swing <= 0) { this.startAttack('swing'); c.swing = this.enraged ? 60 : 90; return; }
    if (adx > 330 && Math.abs(dy) < 70 && c.charge <= 0 && chance(0.6)) { this.facing = want; this.startAttack('charge'); c.charge = this.enraged ? 280 : 380; return; }
    if (c.leap <= 0 && chance(0.4)) { this.startAttack('leap'); c.leap = this.enraged ? 320 : 440; return; }
    if (c.erupt <= 0 && chance(0.5)) { this.startAttack('erupt'); c.erupt = this.enraged ? 360 : 500; return; }
    const arrived = this.moveTo(p.x - want * 180, clamp(p.y, 0, DEPTH), this.speed * (this.enraged ? 1.25 : 1));
    if (!faceOK) this.facing = this.facing; // 천천히 돌아섬
    this.facing = this.turnT > 0 ? this.facing : want;
    if (arrived) this.aiWait = randi(10, 30);
  }

  die(hit, dir) {
    super.die(hit, dir);
    this.vz = 6; this.vx = dir * 2;
    this.deathT = 0;
    Game.onBossKilled(this);
  }

  stDying() {
    this.deathT = (this.deathT || 0) + 1;
    if (this.deathT < 100 && this.deathT % 5 === 0) {
      const X = this.x + rand(-60, 60), Y = sy(this.y, rand(20, this.h * 0.8));
      FX.add('world', new Flash(X, Y, 20, rand(80, 160), 18, choose(['255,150,60', '255,230,200', '255,90,40']), 0.9));
      Hitfx.sparks(X, Y, chance(0.5) ? 1 : -1, 6, { spread: 3 });
      Sfx.play('hit', 0.6, 0.6);
    }
    super.stDying();
  }

  draw(ctx) {
    if (this.visible && this.alpha > 0 && (this.enraged || this.state === 'break')) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = this.state === 'break' ? '255,220,120' : '255,40,20';
      drawGlow(ctx, this.x, sy(this.y, this.z + this.h * 0.45), 190 + Math.sin(Game.time * 0.15) * 14, col, 0.28 * this.alpha, 0.8, 1.2);
      ctx.restore();
    }
    super.draw(ctx);
  }
}

// ------------------------------------------------------------
//  보스 패턴
// ------------------------------------------------------------
const BOSS_ACTS = {
  swing: {
    anim: 'swing1', len: 58, counter: 30, armor: [0, 999], trail: [[31, 36]],
    start(e) { Sfx.play('roar', 0.25, 1.8); },
    update(e, f) {
      if (f === 12) e.glint();
      if (f === 30) Sfx.play('swingBig', 1.2, 0.6);
      if (f >= 30 && f <= 35) e.vx = e.facing * 4; else e.vx *= 0.7;
      if (f >= 32 && f <= 36) e.hitPlayer(BH.swing1, { x0: -10, x1: 215, d: 46, z0: -10, z1: 290 });
      if (f === 35) {
        const x = e.x + e.facing * 190;
        FX.add('ground', new Ring(x, sy(e.y, 0), 10, 160, 22, { w: 12 }));
        FX.add('ground', new Crack(x, e.y, 100));
        for (let i = 0; i < 12; i++) FX.add('world', new Debris(x, e.y, 2, { vx: rand(-5, 5), vz: rand(6, 12), s: rand(3, 6) }));
        Hitfx.dust(x, sy(e.y, 0), 12, 60);
        Sfx.play('thud', 1.2); Game.addShake(9);
      }
      if (f === 57 && chance(e.enraged ? 0.8 : 0.55)) { e.startAttack('swing2'); }
    },
  },
  swing2: {
    anim: 'swing2', len: 48, counter: 16, armor: [0, 999], trail: [[16, 22]], blend: 2,
    update(e, f) {
      if (f === 8) e.glint();
      if (f === 16) Sfx.play('swingBig', 1.2, 0.75);
      if (f >= 16 && f <= 21) e.vx = e.facing * 5; else e.vx *= 0.7;
      if (f >= 17 && f <= 22) e.hitPlayer(BH.swing2, { x0: -20, x1: 205, d: 46, z0: -10, z1: 300 });
    },
  },
  charge: {
    anim: 'roar', len: 200, armor: [0, 999], counter: 0,
    start(e) {
      e.chPhase = 0; e.chT = 0;
      Sfx.play('roar', 0.7);
      const r = Game.room, w = e.facing > 0 ? r.maxX - e.x : e.x - r.minX;
      FX.add('ground', new Telegraph(e.x, e.y, 0, 44, 40, { shape: 'rect', w, dir: e.facing }));
    },
    update(e, f) {
      if (e.chPhase === 0) {
        e.vx = 0;
        if (f % 8 === 0) Game.addShake(2);
        if (f >= 42) { e.chPhase = 1; e.chT = 0; e.play('run', 3, 1, true); e.afterOn = 60; e.afterCol = '255,70,40'; Sfx.play('dash', 1, 0.5); }
      } else if (e.chPhase === 1) {
        e.chT++;
        e.vx = e.facing * (e.enraged ? 15 : 13);
        e.hitPlayer(BH.charge, { x0: -10, x1: 70, d: 44, z0: 0, z1: 280 });
        if (e.chT % 2 === 0) Hitfx.dust(e.x - e.facing * 30, sy(e.y, 0), 1, 10);
        if (e.chT % 8 === 0) { Game.addShake(3); Sfx.play('land', 0.8, 0.6); }
        const r = Game.room;
        if (e.x <= r.minX + 8 || e.x >= r.maxX - 8 || e.chT > 90) {
          e.chPhase = 2; e.chT = 0; e.vx = -e.facing * 4; e.vz = 5;
          e.play('hurt1', 2, 1, true);
          const x = e.x + e.facing * 30;
          FX.add('world', new Flash(x, sy(e.y, 120), 30, 220, 20, '255,200,140', 0.8));
          for (let i = 0; i < 18; i++) FX.add('world', new Debris(x, e.y, rand(40, 200), { vx: -e.facing * rand(1, 6), vz: rand(2, 8), s: rand(3, 7) }));
          Sfx.play('explode', 0.8); Game.addShake(14);
        }
      } else {
        e.chT++; e.vx *= 0.9;
        if (e.chT >= 40) e.af = e.act.len;
      }
    },
    cancel(e) { e.afterOn = 0; },
  },
  leap: {
    anim: 'crouch', len: 200, armor: [0, 999], counter: 0,
    start(e) { e.lpPhase = 0; e.lpT = 0; Sfx.play('roar', 0.3, 1.5); },
    update(e, f) {
      const p = Game.player;
      e.lpT++;
      if (e.lpPhase === 0) {
        e.vx = 0;
        if (e.lpT >= 24) {
          e.lpPhase = 1; e.lpT = 0; e.gravOff = true; e.vz = 0; e.play('leap', 3, 1, true);
          Sfx.play('jump', 1.5, 0.4); Hitfx.dust(e.x, sy(e.y, 0), 12, 60); Game.addShake(5);
          e.tx = p.x; e.ty = p.y;
          e.tg = FX.add('ground', new Telegraph(e.tx, e.ty, 170, 58, 56, { col: '255,40,30' }));
        }
      } else if (e.lpPhase === 1) {
        e.z = lerp(e.z, 520, 0.12);
        if (e.lpT < 38) { e.tx = lerp(e.tx, p.x, 0.08); e.ty = lerp(e.ty, p.y, 0.08); }
        e.tg.x = e.tx; e.tg.y = e.ty;
        e.x = lerp(e.x, e.tx, 0.1); e.y = lerp(e.y, e.ty, 0.1); e.vx = 0; e.vy = 0;
        if (e.lpT >= 50) { e.lpPhase = 2; e.lpT = 0; e.gravOff = false; e.vz = -36; e.x = e.tx; e.y = e.ty; e.play('slam', 1, 1, true); e.afterOn = 8; }
      } else if (e.lpPhase === 3) {
        e.vx = 0;
        if (e.lpT >= 44) e.af = e.act.len;
      }
    },
    onLand(e) {
      if (e.lpPhase !== 2) return;
      e.lpPhase = 3; e.lpT = 0;
      const gy = sy(e.y, 0);
      FX.add('ground', new Ring(e.x, gy, 30, 320, 28, { w: 18, col: '255,190,140' }));
      FX.add('ground', new Crack(e.x, e.y, 190));
      FX.add('world', new Flash(e.x, gy - 30, 40, 300, 22, '255,200,150', 0.9));
      for (let i = 0; i < 30; i++) FX.add('world', new Debris(e.x + rand(-80, 80), e.y + rand(-20, 20), 4, { vx: rand(-9, 9), vz: rand(8, 16), s: rand(3, 8), glow: chance(0.3) ? '255,140,60' : null }));
      Hitfx.dust(e.x, gy, 20, 140);
      Sfx.play('quake', 1.1); Game.addShake(18);
      const pl = Game.player;
      if (pl && pl.hp > 0 && pl.invul <= 0 && pl.state !== 'down' && Math.pow((pl.x - e.x) / 175, 2) + Math.pow((pl.y - e.y) / 62, 2) <= 1 && pl.z < 140)
        applyHit(e, pl, BH.slam, { dir: sign(pl.x - e.x) || 1, noStopAtt: true });
    },
    cancel(e) { e.gravOff = false; },
  },
  erupt: {
    anim: 'cast', len: 96, armor: [0, 999], counter: 0,
    start(e) { e.axeGlow = 0; Sfx.play('roar', 0.4, 0.9); },
    update(e, f) {
      e.axeGlow = f < 60 ? Math.min(1, f / 30) : Math.max(0, 1 - (f - 60) / 20);
      if (f % 3 === 0 && f < 60) {
        const [hx, hy] = e.toWorld(e.J.hand1);
        FX.add('world', new Mote(hx + rand(-60, 60), hy + rand(-80, 40), 0, 0, { col: '255,120,40', life: 20, r: 10, tx: hx, ty: hy - 80, grav: 0 }));
      }
      if (f === 24) {
        Sfx.play('magic', 0.8, 0.5);
        const p = Game.player, n = e.enraged ? 9 : 6;
        for (let i = 0; i < n; i++) {
          const tx = clamp(p.x + (i === 0 ? 0 : rand(-300, 300)), Game.room.minX + 30, Game.room.maxX - 30);
          const ty = clamp(p.y + (i === 0 ? 0 : rand(-90, 90)), 0, DEPTH);
          FX.add('ground', new Telegraph(tx, ty, 66, 24, 44 + i * 7, {
            col: '255,110,20', onEnd: tg => {
              FX.add('world', new Pillar(tg.x, tg.y, 56, 340, 36, '255,110,30', '255,235,180'));
              for (let k = 0; k < 6; k++) FX.add('world', new Debris(tg.x, tg.y, 2, { vx: rand(-3, 3), vz: rand(6, 11), s: rand(2, 4), glow: '255,140,60' }));
              Sfx.play('pillar', 0.7); Game.addShake(3);
              const pl = Game.player;
              if (pl && pl.hp > 0 && pl.invul <= 0 && pl.state !== 'down' && Math.pow((pl.x - tg.x) / 66, 2) + Math.pow((pl.y - tg.y) / 24, 2) <= 1.1 && pl.z < 150)
                applyHit(e, pl, BH.erupt, { dir: sign(pl.x - tg.x) || 1, noStopAtt: true });
            },
          }));
        }
      }
      if (f === 70) { Sfx.play('thud', 1.2); Game.addShake(6); Hitfx.dust(e.x + e.facing * 150, sy(e.y, 0), 10, 50); }
    },
    cancel(e) { e.axeGlow = 0; },
  },
  roar: {
    anim: 'roar', len: 90, armor: [0, 999], counter: 0,
    start(e) { e.invul = 90; },
    update(e, f) {
      e.vx = 0;
      if (f === 14) {
        Sfx.play('roar', 1.3); Game.addShake(14);
        FX.add('ground', new Ring(e.x, sy(e.y, 0), 30, 420, 34, { w: 20, col: '255,80,40' }));
        FX.add('world', new Flash(e.x, sy(e.y, 200), 60, 420, 30, '255,70,30', 0.6));
        const pl = Game.player;
        if (pl && pl.hp > 0 && pl.invul <= 0 && Math.abs(pl.x - e.x) < 330 && Math.abs(pl.y - e.y) < 120) applyHit(e, pl, BH.roar, { dir: sign(pl.x - e.x) || 1, noStopAtt: true });
        if (!e.enraged) { e.enraged = true; Game.bigText('분노', '#ff8a6a', '#b01010'); }
      }
      if (f === 30) {
        const r = Game.room, side = [r.minX + 80, r.maxX - 80];
        const list = e.summon2 ? ['goblin', 'goblin', 'mage'] : ['goblin', 'goblin', 'thrower'];
        list.forEach((k, i) => {
          const en = new Enemy(k, side[i % 2] + rand(-30, 30), rand(30, DEPTH - 30));
          en.spawnIn(i * 10); Game.enemies.push(en);
        });
      }
      if (f > 14 && f < 60 && f % 6 === 0) Game.addShake(3);
    },
  },
};
