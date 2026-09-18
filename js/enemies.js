'use strict';
// ============================================================
//  몬스터 : 기본 클래스 + 종류별 AI
// ============================================================
const ENEMY_TYPES = {
  goblin: { name: '고블린 전사', lv: 62, rig: RIG_GOBLIN, anims: ANIM_GOB, hpMax: 16000, atk: 1700, speed: 2.4, w: 15, d: 12, h: 92, weight: 1, range: 70, gear: 'helm', gold: [3, 6] },
  thrower: { name: '고블린 투척병', lv: 62, rig: RIG_GOBLIN, anims: ANIM_GOB, hpMax: 11000, atk: 1500, speed: 2.2, w: 15, d: 12, h: 92, weight: 1, range: 320, gear: 'band', gold: [3, 6] },
  orc: { name: '오크 광전사', lv: 64, rig: RIG_ORC, anims: ANIM_ORC, hpMax: 64000, atk: 4200, speed: 1.8, w: 26, d: 16, h: 156, weight: 1.55, range: 118, elite: true, gold: [8, 14] },
  mage: { name: '암흑 술사', lv: 63, rig: RIG_MAGE, anims: ANIM_MAGE, hpMax: 24000, atk: 2400, speed: 2.0, w: 15, d: 12, h: 126, weight: 1.1, range: 380, gold: [5, 9] },
};

class Enemy extends Entity {
  constructor(type, x, y) {
    const T = ENEMY_TYPES[type] || {};
    super(T.rig, T.anims);
    Object.assign(this, T);
    this.kind = type; this.team = 1; this.hp = this.hpMax;
    this.x = this.px = x; this.y = y; this.facing = -1;
    this.state = 'idle'; this.stT = 0; this.aiWait = randi(20, 60); this.atkCd = randi(30, 80);
    this.yOff = rand(-18, 18); this.hang = rand(0, 60);
    this.juggle = 0; this.bounced = false; this.hurtFlip = false; this.hasToken = false;
    this.act = null; this.af = 0; this.suspend = 0; this.fadeT = 0; this.dying = false;
    this.lines = this.lines || (this.elite ? 3 : 1);
    this.cape = null;
    this.play('idle', 0);
  }

  hittable() { return !this.dead && !this.dying && this.state !== 'spawn' && this.invul <= 0; }
  hurtH() { return this.state === 'down' || (this.state === 'dying' && this.z < 5 && this.stT > 5) ? 34 * this.scale : this.h; }
  counterable() { return this.state === 'attack' && this.act && this.af < (this.act.counter || 0); }
  armored() { return this.state === 'attack' && this.act && this.act.armor && this.af >= this.act.armor[0] && this.af <= this.act.armor[1]; }

  setState(s) { this.state = s; this.stT = 0; }

  spawnIn(delay = 0) {
    this.setState('spawn'); this.alpha = 0; this.spawnDelay = delay;
  }

  update() {
    this.px = this.x; this.pz = this.z;
    if (this.flash > 0) this.flash--;
    if (this.hitstop > 0) { this.hitstop--; return; }
    this.shakeHit = false;
    this.stT++;
    if (this.invul > 0) this.invul--;
    if (this.atkCd > 0) this.atkCd--;
    this.castGlow = Math.max(0, (this.castGlow || 0) - 0.03);

    if (this.suspend > 0) {
      this.suspend--;
      this.gravOff = true; this.vz = 0; this.vx *= 0.7; this.vy *= 0.7;
      this.z = lerp(this.z, Math.max(this.z, 70), 0.15);
      if (this.state !== 'dying') { this.setState('air'); this.play('air', 3); }
      if (this.suspend === 0) this.gravOff = false;
    }

    switch (this.state) {
      case 'spawn': this.stSpawn(); break;
      case 'idle': case 'move': this.think(); break;
      case 'attack': this.stAttack(); break;
      case 'hurt': this.vx *= 0.86; this.vy *= 0.8; if (this.stT >= this.hurtT) { this.setState('idle'); this.play('idle', 6); } break;
      case 'air': this.vx *= this.juggle > 0 ? 0.94 : 0.985; this.vy *= 0.9; break;
      case 'down': this.vx *= 0.8; this.vy = 0; if (this.stT >= this.downT) { this.setState('getup'); this.invul = 26; this.play('getup', 2, 1, true); } break;
      case 'getup': this.vx *= 0.8; if (this.stT >= 22) { this.setState('idle'); this.juggle = 0; this.gravMul = 1; this.aiWait = randi(5, 25); this.play('idle', 6); } break;
      case 'dying': this.stDying(); break;
      default: if (this.stCustom) this.stCustom(); break;
    }
    if (this.carryT > 0) { this.carryT--; }
    this.physics();
    this.stepAnim();
    if (this.cape) this.updateCape();
    this.updateTrailAfter();
  }

  stSpawn() {
    if (this.stT < (this.spawnDelay || 0)) { this.alpha = 0; return; }
    const t = this.stT - (this.spawnDelay || 0);
    if (t === 1) {
      const X = this.x, Y = sy(this.y, 50 * this.scale);
      FX.add('ground', new Ring(this.x, sy(this.y, 0), 10, 80 * this.scale, 26, { col: '190,90,255' }));
      FX.add('world', new Flash(X, Y, 20, 90 * this.scale, 22, '170,80,255', 0.8));
      for (let i = 0; i < 14; i++) FX.add('world', new Mote(X + rand(-30, 30), sy(this.y, 0) - rand(0, 90), 0, rand(-2, -0.5), { col: '190,110,255', life: 36, r: 8 }));
      Sfx.play('spawn', 0.7);
    }
    this.alpha = Math.min(1, t / 20);
    if (t >= 24) { this.alpha = 1; this.setState('idle'); this.aiWait = randi(10, 30); }
  }

  stDying() {
    this.vx *= this.z > 0 ? 0.99 : 0.85; this.vy *= 0.9;
    if (this.z <= 0 && this.stT > 3 && this.landedDead) {
      this.fadeT++;
      if (this.fadeT > 26) {
        this.alpha = Math.max(0, 1 - (this.fadeT - 26) / 22);
        if (this.fadeT % 2 === 0) {
          const X = this.x + rand(-25, 25) * this.scale, Y = sy(this.y, 0) - rand(0, 30) * this.scale;
          FX.add('world', new Mote(X, Y, rand(-0.4, 0.4), rand(-1.8, -0.6), { col: this.isBoss ? '255,120,60' : '200,160,255', life: 34, r: 7 }));
        }
        if (this.alpha <= 0) this.dead = true;
      }
    }
  }

  onLand(vz) {
    if (this.state === 'air' || this.state === 'dying') {
      if (!this.bounced && vz < -5.5 && !this.heavy) {
        this.vz = -vz * 0.38; this.bounced = true;
        Hitfx.dust(this.x, sy(this.y, 0), 6, 18 * this.scale);
        Sfx.play('thud', 0.8); Game.addShake(1.5);
        return;
      }
      Hitfx.dust(this.x, sy(this.y, 0), 4, 16 * this.scale);
      if (this.state === 'dying') { this.landedDead = true; this.play('down', 3); return; }
      this.setState('down'); this.downT = 36 + randi(0, 10); this.play('down', 3);
    } else if (this.state === 'attack' && this.act && this.act.onLand) this.act.onLand(this, vz);
  }

  // 공통 피격 반응
  takeHit(hit, att, dir, dmg) {
    this.hp -= dmg;
    Game.setTarget(this);
    if (this.onDamaged) this.onDamaged(hit, dmg);
    if (this.hp <= 0) { this.die(hit, dir); return; }
    if (this.suspend > 0) return;
    if (this.armored() || this.superArmor) {
      this.vx += dir * (hit.kx || 0) * 0.08;
      return;
    }
    this.interrupt();
    const w = this.weight;
    const air = this.z > 1 || this.state === 'air';
    let kz = hit.kz || 0;
    if (air) kz = hit.airKz ?? Math.max(kz * 0.7, 4.5);
    if (hit.carry) {
      const f = att.facing;
      this.x = clamp(att.x + f * (34 + this.w), Game.room.minX, Game.room.maxX);
      this.vx = att.vx; this.carryT = 4;
    }
    if (this.state === 'down' && !(hit.kz > 0)) {
      this.vz = 3; this.setState('air'); this.bounced = true;
      this.vx = dir * (hit.kx || 2) * 0.3 / w;
      this.play('air', 2, 1, true); this.facing = -dir;
      return;
    }
    if (kz > 0 && !this.noLaunch) {
      const decay = Math.max(0.3, 1 - this.juggle * 0.055);
      const v = kz * decay / w;
      this.vz = air ? Math.max(this.vz, v) : v;
      if (air && this.vz < v * 0.6) this.vz = v * 0.6;
      this.juggle++; this.gravMul = 1 + this.juggle * 0.035;
      if (this.state !== 'air') this.bounced = false;
      this.setState('air'); this.play('air', 2, 1, true);
    } else if (!air) {
      this.setState('hurt'); this.hurtT = Math.round((hit.stun ?? 20) / Math.sqrt(w));
      this.hurtFlip = !this.hurtFlip;
      this.play(this.hurtFlip ? 'hurt1' : 'hurt2', 1, 1, true);
    }
    if (!hit.carry) this.vx = dir * (hit.kx ?? 3) / w * (air ? 0.45 : 1);
    this.vy = 0;
    this.facing = -dir;
  }

  interrupt() {
    if (this.act && this.act.cancel) this.act.cancel(this);
    this.act = null; this.trailOn = false; this.holdRock = false;
    Game.releaseToken(this);
  }

  die(hit, dir) {
    this.hp = 0; this.interrupt(); this.dying = true; this.suspend = 0; this.gravOff = false;
    this.setState('dying'); this.landedDead = false; this.bounced = false;
    this.vz = Math.max(this.z > 0 ? this.vz : 0, (this.heavy ? 5 : 8));
    this.vx = dir * Math.max(4, (hit.kx || 4)) / Math.max(1, this.weight * 0.8);
    this.facing = -dir;
    this.play('air', 2, 1, true);
    Sfx.play('enemyDie', 0.8);
    Game.onEnemyKilled(this);
  }

  // ---------- AI 도우미 ----------
  moveTo(tx, ty, sp) {
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy * 1.4);
    if (d < 6) { this.vx *= 0.7; this.vy *= 0.7; this.play('idle', 6); this.setState('idle'); return true; }
    this.vx = dx / d * sp; this.vy = dy / d * sp * 0.75;
    this.separate();
    this.setState('move');
    this.play('walk', 5);
    return false;
  }
  separate() {
    for (const o of Game.enemies) {
      if (o === this || o.dying || o.dead) continue;
      const dx = this.x - o.x, dy = this.y - o.y;
      if (Math.abs(dx) < 34 && Math.abs(dy) < 20) {
        this.vx += (dx >= 0 ? 1 : -1) * 0.6; this.vy += (dy >= 0 ? 1 : -1) * 0.5;
      }
    }
  }
  facePlayer() { const p = Game.player; if (p) this.facing = p.x >= this.x ? 1 : -1; }

  startAttack(name) {
    const act = this.acts[name];
    this.act = act; this.af = 0; this.setState('attack'); this.swing = newSwing();
    this.vx = 0; this.vy = 0;
    this.play(act.anim, act.blend ?? 4, 1, true);
    if (act.start) act.start(this);
  }
  stAttack() {
    const act = this.act;
    if (!act) { this.setState('idle'); return; }
    this.af++;
    if (act.trail) this.trailOn = act.trail.some(r => this.af >= r[0] && this.af <= r[1]);
    act.update(this, this.af);
    if (this.act !== act) return;
    if (this.af >= act.len) {
      this.act = null; this.trailOn = false;
      Game.releaseToken(this);
      this.atkCd = randi(act.cdMin || 50, act.cdMax || 110) * (Game.room && Game.room.hard ? 0.8 : 1);
      this.setState('idle'); this.aiWait = randi(8, 26); this.play('idle', 6);
    }
  }
  // 근접 공격 판정 (플레이어 대상)
  hitPlayer(hd, box) {
    const p = Game.player;
    if (!p || p.hp <= 0 || p.invul > 0 || p.state === 'down' || p.state === 'getup') return false;
    if (this.swing.set.has(p)) return false;
    const B = attackBox(this, box);
    if (Game.debug) Game.debugBoxes.push(B);
    if (!overlaps(B, p)) return false;
    this.swing.set.add(p);
    applyHit(this, p, hd);
    return true;
  }
  glint() {
    const J = this.J, a = J.wAng * DEG, L = this.rig.wlen * 0.8;
    const lx = J.hand1.x + Math.sin(a) * L, ly = J.hand1.y + Math.cos(a) * L;
    const [X, Y] = this.toWorld({ x: lx, y: ly });
    FX.add('world', new Glint(X, Y, 16 * Math.sqrt(this.scale)));
  }

  think() {
    const p = Game.player;
    if (!p || p.hp <= 0 || Game.state !== 'play') { this.vx *= 0.8; this.vy *= 0.8; this.play('idle', 6); return; }
    this.ai(p);
  }
}

// 공격 예고 반짝임
class Glint {
  constructor(x, y, r) { Object.assign(this, { x, y, r, t: 0, life: 14, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, s = this.r * Math.sin(u * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${1 - u * 0.5})`;
    ctx.beginPath(); ctx.moveTo(this.x - s * 1.6, this.y); ctx.lineTo(this.x, this.y - s * 0.18); ctx.lineTo(this.x + s * 1.6, this.y); ctx.lineTo(this.x, this.y + s * 0.18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(this.x, this.y - s * 1.6); ctx.lineTo(this.x + s * 0.18, this.y); ctx.lineTo(this.x, this.y + s * 1.6); ctx.lineTo(this.x - s * 0.18, this.y); ctx.closePath(); ctx.fill();
    drawGlow(ctx, this.x, this.y, s * 1.4, '255,240,200', 0.7);
  }
}

// ------------------------------------------------------------
//  고블린 전사
// ------------------------------------------------------------
const EH = {
  gob: { dmg: 1, kx: 4.5, stun: 20, stop: 6, shake: 3, fx: 'blunt', sfx: 'hurt' },
  gobLunge: { dmg: 1.2, kx: 6, kz: 5, stun: 24, stop: 7, shake: 4, fx: 'blunt', sfx: 'hurt', down: true },
  rock: { dmg: 1, kx: 3, stun: 16, stop: 4, shake: 2, fx: 'blunt', sfx: 'hurt' },
  orcSmash: { dmg: 1, kx: 7, kz: 7, stun: 30, stop: 10, shake: 8, fx: 'heavy', sfx: 'heavy', down: true },
  orcCharge: { dmg: 0.85, kx: 9, kz: 8, stun: 30, stop: 8, shake: 6, fx: 'blunt', sfx: 'heavy', down: true },
  orb: { dmg: 1, kx: 3, stun: 18, stop: 5, shake: 3, fx: 'none', sfx: 'hurt' },
  pillar: { dmg: 1.2, kx: 2, kz: 10, stun: 30, stop: 6, shake: 5, fx: 'none', sfx: 'hurt', down: true },
};

ENEMY_TYPES.goblin.acts = {
  atk: {
    anim: 'atk', len: 46, counter: 24, trail: [[23, 27]],
    start(e) { e.glint(); },
    update(e, f) {
      if (f === 21) Sfx.play('swing', 0.7, 0.8);
      if (f >= 22 && f <= 25) e.vx = e.facing * 2.5; else e.vx *= 0.7;
      if (f >= 23 && f <= 26) e.hitPlayer(EH.gob, { x0: -5, x1: 68, d: 24, z0: 0, z1: 90 });
    },
  },
  lunge: {
    anim: 'lunge', len: 44, counter: 17, trail: [[18, 22]],
    start(e) { e.glint(); },
    update(e, f) {
      if (f === 16) { e.vx = e.facing * 8.5; e.vz = 5.5; Sfx.play('swing', 0.7, 0.9); }
      if (f > 16 && e.z <= 0) e.vx *= 0.7;
      if (f >= 17 && f <= 24) e.hitPlayer(EH.gobLunge, { x0: -5, x1: 60, d: 24, z0: -10, z1: 90 });
    },
  },
};
ENEMY_TYPES.goblin.ai = function (p) {
  const dx = p.x - this.x, dy = p.y - this.y, adx = Math.abs(dx);
  this.facePlayer();
  if (this.aiWait > 0) { this.aiWait--; this.vx *= 0.8; this.vy *= 0.8; this.play('idle', 6); return; }
  if (adx < this.range + 12 && adx > 18 && Math.abs(dy) < 16 && this.atkCd <= 0 && Game.takeToken(this)) {
    this.startAttack(chance(0.3) ? 'lunge' : 'atk'); return;
  }
  if (adx > 150 && adx < 200 && Math.abs(dy) < 16 && this.atkCd <= 0 && chance(0.02) && Game.takeToken(this)) { this.startAttack('lunge'); return; }
  const side = dx > 0 ? -1 : 1;
  let tx = p.x + side * this.range * 0.8, ty = p.y + this.yOff * 0.3;
  if (this.atkCd > 25 || Game.tokensUsed() >= Game.tokenMax) tx = p.x + side * (this.range + 70 + this.hang);
  const arrived = this.moveTo(tx, clamp(ty, 0, DEPTH), this.speed);
  if (arrived && chance(0.05)) this.aiWait = randi(10, 40);
};

// ------------------------------------------------------------
//  고블린 투척병
// ------------------------------------------------------------
ENEMY_TYPES.thrower.acts = {
  throw: {
    anim: 'throw', len: 48, counter: 26,
    update(e, f) {
      if (f === 8) e.holdRock = true;
      if (f === 27) {
        e.holdRock = false;
        const p = Game.player, T = 34;
        const tx = p.x + p.vx * 10, ty = p.y;
        const sx = e.x + e.facing * 20, sz = 88;
        const vx = (tx - sx) / T, vy = (ty - e.y) / T, g = 0.4;
        const vz = (60 - sz) / T + 0.5 * g * T;
        Game.projectiles.push(new Projectile(e, 'rock', sx, e.y, sz, vx, vy, vz, { grav: g, r: 9, hit: EH.rock }));
        Sfx.play('throw');
      }
    },
    cancel(e) { e.holdRock = false; },
    cdMin: 70, cdMax: 130,
  },
};
ENEMY_TYPES.thrower.ai = function (p) {
  const dx = p.x - this.x, dy = p.y - this.y, adx = Math.abs(dx);
  this.facePlayer();
  if (this.aiWait > 0) { this.aiWait--; this.vx *= 0.8; this.vy *= 0.8; this.play('idle', 6); return; }
  if (adx > 170 && adx < 460 && this.atkCd <= 0 && Game.takeToken(this)) { this.startAttack('throw'); return; }
  const side = dx > 0 ? -1 : 1;
  const tx = clamp(p.x + side * (this.range + this.hang * 0.5), Game.room.minX + 30, Game.room.maxX - 30);
  const arrived = this.moveTo(tx, clamp(p.y + this.yOff * 2, 0, DEPTH), adx < 170 ? this.speed * 1.3 : this.speed);
  if (arrived) this.aiWait = randi(20, 50);
};

// ------------------------------------------------------------
//  오크 광전사
// ------------------------------------------------------------
ENEMY_TYPES.orc.acts = {
  smash: {
    anim: 'smash', len: 74, counter: 36, armor: [1, 40], trail: [[35, 40]], cdMin: 60, cdMax: 110,
    start(e) { Sfx.play('roar', 0.3, 1.6); },
    update(e, f) {
      if (f === 20) e.glint();
      if (f === 35) Sfx.play('swingBig', 1, 0.7);
      if (f >= 35 && f <= 39) e.vx = e.facing * 3; else e.vx *= 0.7;
      if (f >= 36 && f <= 40) e.hitPlayer(EH.orcSmash, { x0: 0, x1: 130, d: 32, z0: -10, z1: 170 });
      if (f === 39) {
        const x = e.x + e.facing * 110;
        FX.add('ground', new Ring(x, sy(e.y, 0), 10, 130, 22, { w: 10, col: '255,200,150' }));
        FX.add('ground', new Crack(x, e.y, 70));
        for (let i = 0; i < 10; i++) FX.add('world', new Debris(x, e.y, 2, { vx: rand(-4, 4), vz: rand(5, 10) }));
        Hitfx.dust(x, sy(e.y, 0), 10, 40);
        Sfx.play('thud'); Game.addShake(6);
      }
    },
  },
  charge: {
    anim: 'roar', len: 140, counter: 0, armor: [1, 999], cdMin: 120, cdMax: 180,
    start(e) {
      e.chPhase = 0; Sfx.play('roar', 0.6, 1.3);
      FX.add('ground', new Telegraph(e.x, e.y, 0, 26, 28, { shape: 'rect', w: 600, dir: e.facing }));
    },
    update(e, f) {
      if (e.chPhase === 0) {
        e.vx = 0;
        if (f >= 30) { e.chPhase = 1; e.chT = 0; e.play('run', 3); Sfx.play('dash', 0.8, 0.6); e.afterOn = 40; e.afterCol = '255,90,60'; }
      } else if (e.chPhase === 1) {
        e.chT++;
        e.vx = e.facing * 10;
        e.hitPlayer(EH.orcCharge, { x0: 0, x1: 50, d: 30, z0: 0, z1: 150 });
        if (e.chT % 3 === 0) Hitfx.dust(e.x - e.facing * 20, sy(e.y, 0), 1, 6);
        if (e.chT % 10 === 0) Game.addShake(1.5);
        const r = Game.room;
        if (e.chT > 58 || e.x <= r.minX + 5 || e.x >= r.maxX - 5) { e.chPhase = 2; e.chT = 0; e.play('chargeEnd', 2, 1, true); Sfx.play('swingBig', 1, 0.7); e.swing = newSwing(); }
      } else {
        e.chT++; e.vx *= 0.82;
        if (e.chT >= 4 && e.chT <= 8) e.hitPlayer(EH.orcSmash, { x0: 0, x1: 120, d: 30, z0: 0, z1: 160 });
        if (e.chT >= 26) e.af = e.act.len;
      }
    },
    cancel(e) { e.afterOn = 0; },
  },
};
ENEMY_TYPES.orc.ai = function (p) {
  const dx = p.x - this.x, dy = p.y - this.y, adx = Math.abs(dx);
  this.facePlayer();
  if (this.aiWait > 0) { this.aiWait--; this.vx *= 0.8; this.vy *= 0.8; this.play('idle', 6); return; }
  if (adx < this.range + 15 && Math.abs(dy) < 20 && this.atkCd <= 0 && Game.takeToken(this)) { this.startAttack('smash'); return; }
  if (adx > 260 && adx < 560 && Math.abs(dy) < 18 && this.atkCd <= 0 && chance(0.04) && Game.takeToken(this)) { this.startAttack('charge'); return; }
  const side = dx > 0 ? -1 : 1;
  let tx = p.x + side * this.range * 0.85;
  if (this.atkCd > 30) tx = p.x + side * (this.range + 90 + this.hang);
  this.moveTo(tx, clamp(p.y + this.yOff * 0.3, 0, DEPTH), this.speed);
};

// ------------------------------------------------------------
//  암흑 술사
// ------------------------------------------------------------
ENEMY_TYPES.mage.acts = {
  orb: {
    anim: 'cast', len: 58, counter: 34, cdMin: 80, cdMax: 150,
    update(e, f) {
      if (f < 32) e.castGlow = Math.min(1, f / 28);
      if (f === 6) Sfx.play('magic', 0.5, 0.7);
      if (f === 34) {
        const p = Game.player;
        const sx = e.x + e.facing * 30, sz = 72;
        const d = Math.max(1, Math.abs(p.x - sx));
        Game.projectiles.push(new Projectile(e, 'orb', sx, e.y, sz, e.facing * 4.2, clamp((p.y - e.y) / d * 4.2, -1.4, 1.4), 0, { r: 14, hit: EH.orb, life: 260 }));
        Sfx.play('magic', 0.8, 1.3);
      }
    },
  },
  pillar: {
    anim: 'summon', len: 60, counter: 44, cdMin: 90, cdMax: 160,
    update(e, f) {
      e.castGlow = Math.min(1, f / 20);
      if (f === 14) {
        const p = Game.player;
        Sfx.play('magic', 0.6, 0.5);
        const tx = p.x + p.vx * 12, ty = p.y;
        FX.add('ground', new Telegraph(tx, ty, 52, 20, 52, {
          col: '200,60,255', onEnd: tg => {
            FX.add('world', new Pillar(tg.x, tg.y, 44, 260, 34, '170,60,255', '240,200,255'));
            Sfx.play('pillar', 0.8, 1.2); Game.addShake(3);
            const pl = Game.player;
            if (pl && pl.hp > 0 && pl.invul <= 0 && pl.state !== 'down' && Math.pow((pl.x - tg.x) / 52, 2) + Math.pow((pl.y - tg.y) / 20, 2) <= 1.1 && pl.z < 110)
              applyHit(e, pl, EH.pillar, { dir: sign(pl.x - tg.x) || 1, noStopAtt: true });
          },
        }));
      }
    },
  },
};
ENEMY_TYPES.mage.ai = function (p) {
  const dx = p.x - this.x, dy = p.y - this.y, adx = Math.abs(dx);
  this.facePlayer();
  if (this.aiWait > 0) { this.aiWait--; this.vx *= 0.8; this.vy *= 0.8; this.play('idle', 6); return; }
  // 가까우면 순간이동
  if (adx < 120 && Math.abs(dy) < 50) this.nearT = (this.nearT || 0) + 1; else this.nearT = 0;
  if (this.nearT > 40) { this.nearT = 0; this.blink(p); return; }
  if (this.atkCd <= 0 && adx > 140 && adx < 620 && Game.takeToken(this)) {
    this.startAttack(Math.abs(dy) < 30 && chance(0.55) ? 'orb' : 'pillar'); return;
  }
  const side = dx > 0 ? -1 : 1;
  const tx = clamp(p.x + side * (this.range + this.hang), Game.room.minX + 40, Game.room.maxX - 40);
  const arrived = this.moveTo(tx, clamp(p.y + this.yOff * 2.5, 0, DEPTH), adx < 150 ? this.speed * 1.4 : this.speed);
  if (arrived) this.aiWait = randi(20, 50);
};
Enemy.prototype.blink = function (p) {
  const r = Game.room;
  const X = this.x, Y = sy(this.y, 50);
  FX.add('world', new Flash(X, Y, 20, 80, 16, '170,80,255', 0.8));
  for (let i = 0; i < 10; i++) FX.add('world', new Mote(X + rand(-20, 20), Y + rand(-50, 40), rand(-1, 1), rand(-2, 0), { col: '190,110,255', life: 26, r: 8 }));
  let nx = p.x + (chance(0.5) ? 1 : -1) * rand(320, 440);
  if (nx < r.minX + 40 || nx > r.maxX - 40) nx = p.x - (nx - p.x);
  this.x = this.px = clamp(nx, r.minX + 40, r.maxX - 40);
  this.y = clamp(rand(20, DEPTH - 20), 0, DEPTH);
  this.setState('spawn'); this.spawnDelay = 0; this.alpha = 0; this.stT = 8;
  Sfx.play('magic', 0.5, 1.8);
};

for (const k in ENEMY_TYPES) {
  const T = ENEMY_TYPES[k];
  if (T.ai) { /* 할당은 인스턴스에서 */ }
}
Enemy.prototype.ai = function (p) { const T = ENEMY_TYPES[this.kind]; if (T && T.ai) T.ai.call(this, p); };
