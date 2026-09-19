'use strict';
// ============================================================
//  엔티티 기반 클래스 + 전투 판정
// ============================================================
let _eid = 0;

class Entity {
  constructor(rig, anims) {
    this.id = ++_eid; this.rig = rig; this.anims = anims; this.scale = rig.scale || 1;
    this.x = 0; this.y = 0; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0; this.px = 0; this.pz = 0;
    this.facing = 1; this.grav = 0.62; this.gravMul = 1; this.gravOff = false;
    this.w = 16; this.d = 12; this.h = 120;
    this.hitstop = 0; this.flash = 0; this.invul = 0; this.shakeHit = false;
    this.pose = P(PS); this.tmpPose = P(); this.J = newJ(); this.tJ = newJ();
    this.anim = null; this.animT = 0; this.animSpeed = 1; this.blendFrom = P(); this.blendT = 0; this.blendDur = 0;
    this.trail = []; this.trailOn = false; this.trailCol = '140,200,255';
    this.after = []; this.afterOn = 0; this.afterCol = '80,160,255';
    this.visible = true; this.alpha = 1; this.dead = false;
    this.dmgStack = 0; this.dmgStackT = -99; this.squash = 0;
  }

  play(name, blend = 3, speed = 1, force = false) {
    const an = typeof name === 'string' ? this.anims[name] : name;
    if (!an || (!force && this.anim === an)) return;
    if (this.anim) copyPose(this.pose, this.blendFrom); else blend = 0;
    this.anim = an; this.animT = 0; this.blendT = 0; this.blendDur = blend; this.animSpeed = speed;
  }

  stepAnim() {
    const t0 = this.animT;
    this.animT += this.animSpeed;
    sampleAnim(this.anim, this.animT, this.tmpPose, this);
    if (this.blendT < this.blendDur) { this.blendT++; lerpPose(this.blendFrom, this.tmpPose, E.out(this.blendT / this.blendDur), this.pose); }
    else copyPose(this.tmpPose, this.pose);
    solveRig(this.rig, this.pose, this.J, this.z <= 0.5);
    if (this.trailOn) this.sampleTrail(t0);
  }

  sampleTrail(t0) {
    const N = 4, R = this.rig;
    if (!this._trp) this._trp = P();
    for (let k = 1; k <= N; k++) {
      const u = k / N;
      let J = this.J;
      if (k < N && this.blendT >= this.blendDur) {
        sampleAnim(this.anim, lerp(t0, this.animT, u), this._trp, this);
        solveRig(R, this._trp, this.tJ, this.z <= 0.5);
        J = this.tJ;
      }
      const ex = lerp(this.px, this.x, u), ey = sy(this.y, lerp(this.pz, this.z, u));
      const a = J.wAng * DEG, dx = Math.sin(a), dy = Math.cos(a);
      const h = J.hand1, s = this.scale, f = this.facing;
      const b0 = R.wlen * 0.35, b1 = R.wlen * 1.05;
      this.trail.push({
        bx: ex + f * (h.x + dx * b0) * s, by: ey + (h.y + dy * b0) * s,
        tx: ex + f * (h.x + dx * b1) * s, ty: ey + (h.y + dy * b1) * s, age: 0,
      });
    }
  }

  updateTrailAfter() {
    const tr = this.trail;
    for (const q of tr) q.age++;
    while (tr.length && tr[0].age > 7) tr.shift();
    for (const a of this.after) a.life--;
    if (this.after.length && this.after[0].life <= 0) this.after = this.after.filter(a => a.life > 0);
    if (this.afterOn > 0) {
      this.afterOn--;
      if (Game.frame % 3 === 0) this.after.push({ x: this.x, y: this.y, z: this.z, f: this.facing, J: copyJ(this.J), life: 13, max: 13, col: this.afterCol });
    }
  }

  addGhost(x, y, z, facing, pose, life = 16, col) {
    const J = newJ(); solveRig(this.rig, pose, J, z <= 0.5);
    this.after.push({ x, y, z, f: facing, J, life, max: life, col: col || this.afterCol });
  }

  physics() {
    if (this.squash > 0) this.squash *= 0.8;
    this.x += this.vx; this.y += this.vy;
    if (!this.gravOff && (this.z > 0 || this.vz > 0)) {
      const was = this.z;
      this.z += this.vz; this.vz -= this.grav * this.gravMul;
      if (this.z <= 0 && was > 0) { const v = this.vz; this.z = 0; this.vz = 0; this.onLand(v); }
      else if (this.z <= 0) { this.z = 0; if (this.vz < 0) this.vz = 0; }
    } else if (this.gravOff) { this.z = Math.max(0, this.z + this.vz); }
    this.y = clamp(this.y, 0, DEPTH);
    const r = Game.room;
    if (r) this.x = clamp(this.x, r.minX, this.isPlayer ? r.playerMaxX() : r.maxX);
  }
  onLand() { }

  hurtH() { return this.h; }
  toWorld(pt) { return [this.x + this.facing * pt.x * this.scale, sy(this.y, this.z) + pt.y * this.scale]; }

  // ---------- 렌더 ----------
  drawShadow(ctx) {
    if (!this.visible && !this.after.length) return;
    const k = Math.max(0.35, 1 - this.z / 260);
    ctx.fillStyle = `rgba(0,0,0,${0.38 * k * this.alpha})`;
    ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), this.w * 1.9 * k * (this.shadowMul || 1), this.w * 0.55 * k * (this.shadowMul || 1), 0, 0, TAU); ctx.fill();
  }

  draw(ctx) {
    const R = this.rig;
    if (this.after.length) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const a of this.after) {
        ctx.save();
        ctx.globalAlpha = (a.life / a.max) * 0.42;
        ctx.translate(a.x, sy(a.y, a.z)); ctx.scale(a.f * this.scale, this.scale);
        R.draw(ctx, a.J, R.ghostPal(a.col), this, { ghost: true });
        ctx.restore();
      }
      ctx.restore();
    }
    if (!this.visible || this.alpha <= 0) return;
    ctx.save();
    const ox = this.hitstop > 0 && this.shakeHit ? (this.hitstop % 2 ? 1 : -1) * 3.5 : 0;
    ctx.translate(this.x + ox, sy(this.y, this.z));
    const sq = (this.squash || 0) * (this.isBoss ? 0.4 : 1);   // 덩치 큰 보스는 과하지 않게
    ctx.scale(this.facing * this.scale * (1 - sq * 0.14), this.scale * (1 + sq * 0.17));
    ctx.globalAlpha = this.alpha;
    const fl = this.flash > 0;
    R.draw(ctx, this.J, fl ? R.flashPal : R.pal, this, { flash: fl });
    ctx.restore();
  }

  drawTrail(ctx) {
    const tr = this.trail;
    if (tr.length < 2) return;
    ctx.globalCompositeOperation = 'lighter';
    const n = tr.length;
    const band = (u0, u1, col, amul) => {
      for (let i = 1; i < n; i++) {
        const a = tr[i - 1], b = tr[i];
        if (b.age - a.age > 1 || Math.hypot(b.tx - a.tx, b.ty - a.ty) > 160) continue;
        const k = Math.max(0, 1 - b.age / 7) * Math.pow(i / n, 0.6);
        ctx.fillStyle = `rgba(${col},${amul * k})`;
        ctx.beginPath();
        ctx.moveTo(lerp(a.bx, a.tx, u0), lerp(a.by, a.ty, u0)); ctx.lineTo(lerp(a.bx, a.tx, u1), lerp(a.by, a.ty, u1));
        ctx.lineTo(lerp(b.bx, b.tx, u1), lerp(b.by, b.ty, u1)); ctx.lineTo(lerp(b.bx, b.tx, u0), lerp(b.by, b.ty, u0));
        ctx.closePath(); ctx.fill();
      }
    };
    band(0.3, 1, this.trailCol, 0.1);
    band(0.6, 1, this.trailCol, 0.28);
    band(0.86, 1.01, '255,255,255', 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ============================================================
//  판정
// ============================================================
function attackBox(att, box) {
  const f = att.facing, xa = att.x + f * box.x0, xb = att.x + f * box.x1;
  return {
    x0: Math.min(xa, xb), x1: Math.max(xa, xb),
    y0: att.y - box.d, y1: att.y + box.d,
    z0: att.z + (box.z0 ?? 0), z1: att.z + (box.z1 ?? 150),
  };
}
function overlaps(b, t) {
  return b.x1 > t.x - t.w && b.x0 < t.x + t.w && b.y1 > t.y - t.d && b.y0 < t.y + t.d && b.z1 > t.z && b.z0 < t.z + t.hurtH();
}

let _swingId = 0;
function newSwing() { return { id: ++_swingId, set: new Set() }; }

// 타격 적용 (손맛의 핵심)
function applyHit(att, tgt, hit, o = {}) {
  const dir = o.dir ?? (tgt.x >= att.x ? 1 : -1);
  let dmg = (att.atk || 1000) * hit.dmg * rand(0.93, 1.07);
  let crit = false, counter = false, back = false;
  if (att.isPlayer) {
    crit = Math.random() < att.critRate + (hit.crit || 0);
    counter = !!(tgt.counterable && tgt.counterable());
    back = !hit.noBack && tgt.facing === sign(tgt.x - att.x) && !tgt.isBoss;
    if (crit) dmg *= 1.5;
    if (counter) dmg *= 1.25;
    if (back) dmg *= 1.1;
    if (tgt.breakT > 0) dmg *= 1.35;
  }
  dmg = Math.max(1, Math.round(dmg));

  // --- 히트스톱 ---
  let stop = hit.stop ?? 5;
  if (counter) stop += 3;
  if (!o.noStopAtt) att.hitstop = Math.max(att.hitstop, stop);
  tgt.hitstop = Math.max(tgt.hitstop, stop + (hit.stopT ?? 1));
  tgt.shakeHit = true;
  tgt.flash = hit.flash ?? 3;

  // --- 이펙트 위치 ---
  const th = tgt.hurtH();
  const hz = clamp(o.hz ?? (att.z + (att.isPlayer ? 72 : 60) * (att.scale || 1)), tgt.z + th * 0.2, tgt.z + th * 0.85);
  const X = tgt.x - dir * tgt.w * 0.35 + rand(-5, 5), Y = sy(tgt.y, hz) + rand(-6, 6);
  const ang = ((att.facing > 0 ? (hit.ang ?? 0) : 180 - (hit.ang ?? 0)) + rand(-10, 10)) * DEG;
  const pw = (hit.power || 1) * (crit ? 1.2 : 1);
  switch (hit.fx) {
    case 'none': break;
    case 'heavy': Hitfx.heavy(X, Y, dir, ang, pw); break;
    case 'pierce': Hitfx.pierce(X, Y, dir, pw); break;
    case 'blunt': Hitfx.blunt(X, Y, dir); break;
    case 'x':
      FX.add('world', new CutLine(X, Y, 0.75, 150 * pw, 10, '255,120,90', 18));
      FX.add('world', new CutLine(X, Y, -0.75, 150 * pw, 10, '255,120,90', 18));
      Hitfx.heavy(X, Y, dir, ang, pw);
      break;
    default: Hitfx.slash(X, Y, dir, ang, pw, att.isPlayer ? '140,200,255' : '255,140,120');
  }
  if (crit) FX.add('world', new Flash(X, Y, 8, 48, 10, '255,210,90', 0.6));

  // --- 사운드 ---
  // 콤보가 쌓일수록 반음씩 올라가 연타가 기계적으로 들리지 않게 한다
  const cp = 1 + Math.min(Game.combo.n, 12) * 0.015;
  const snd = hit.sfx || (att.isPlayer ? 'hit' : 'blunt');
  if (snd !== 'none') Sfx.play(snd, hit.vol || 1, att.isPlayer ? cp : 1);
  if (crit && att.isPlayer) Sfx.play('crit', 0.8, cp);

  // --- 데미지 숫자 ---
  if (Game.frame - tgt.dmgStackT < 22) tgt.dmgStack = Math.min(tgt.dmgStack + 1, 7); else tgt.dmgStack = 0;
  tgt.dmgStackT = Game.frame;
  const ty = sy(tgt.y, tgt.z + th) - 18;
  FX.add('top', new DmgText(tgt.x, ty, dmg, tgt.isPlayer ? 'p' : crit ? 'c' : 'n', tgt.dmgStack));
  if (counter) { FX.add('top', new Label(tgt.x, ty - 40 - tgt.dmgStack * 26, 'COUNTER', { col: ['#fffbd0', '#ffb020'], size: 24 })); Sfx.play('counter'); }
  else if (back && att.isPlayer && tgt.dmgStack === 0) FX.add('top', new Label(tgt.x, ty - 38, 'BACK ATTACK', { col: ['#e0f7ff', '#4ac2ff'], size: 17 }));

  // --- 반응 ---
  tgt.takeHit(hit, att, dir, dmg, { crit, counter });

  // --- 손맛 연출 ---
  const power = stop / 5;                                  // 타격 강도 (히트스톱 기준)
  tgt.squash = Math.min(1.1, 0.45 + power * 0.28);         // 맞는 쪽이 찌그러졌다 펴짐
  if (att.isPlayer && stop >= 7) att.squash = Math.max(att.squash || 0, 0.3);
  Game.addShake(hit.shake ?? 2);
  Game.kick(dir * Math.min(12, (hit.shake ?? 2) * 0.9), -Math.min(5, power));
  if (stop >= 9) Game.freeze(Math.min(4, Math.round(stop / 3)));   // 강타는 화면 전체를 정지
  if (att.isPlayer) Game.rumble(Math.min(1, 0.25 + power * 0.22), 60 + stop * 8);
  if (att.isPlayer) {
    Game.onPlayerHit(dmg, tgt, hit);
    if (hit.mp) att.mp = Math.min(att.mpMax, att.mp + hit.mp);
  }
  return dmg;
}

// ============================================================
//  투사체
// ============================================================
class Projectile {
  constructor(owner, kind, x, y, z, vx, vy, vz, o = {}) {
    Object.assign(this, { owner, kind, x, y, z, vx, vy, vz, t: 0, dead: false });
    this.grav = o.grav ?? 0; this.r = o.r || 10; this.hit = o.hit; this.life = o.life || 240;
    this.facing = 1; this.w = this.r; this.d = this.r;
  }
  update() {
    this.t++;
    if (this.kind === 'orb' && Game.player && this.t < 70) {
      const p = Game.player, dy = p.y - this.y;
      this.vy += clamp(dy * 0.004, -0.06, 0.06);
      this.vy = clamp(this.vy, -1.6, 1.6);
    }
    this.x += this.vx; this.y += this.vy; this.z += this.vz; this.vz -= this.grav;
    this.y = clamp(this.y, 0, DEPTH);
    if (this.kind === 'orb' && this.t % 2 === 0) FX.add('world', new Mote(this.x, sy(this.y, this.z), rand(-0.5, 0.5), rand(-0.5, 0.5), { col: '190,90,255', life: 22, r: 12 }));
    const p = Game.player;
    if (p && p.hp > 0 && p.invul <= 0 && p.state !== 'down' && p.state !== 'dead') {
      if (Math.abs(p.x - this.x) < p.w + this.r && Math.abs(p.y - this.y) < p.d + this.r * 0.8 && this.z > p.z - this.r && this.z < p.z + p.h) {
        applyHit(this.owner, p, this.hit, { dir: sign(this.vx), hz: this.z, noStopAtt: true });
        this.burst(); return false;
      }
    }
    if (this.z <= 0) { this.burst(); return false; }
    const r = Game.room;
    if (this.t > this.life || this.x < r.minX - 100 || this.x > r.maxX + 100) return false;
    return true;
  }
  burst() {
    const X = this.x, Y = sy(this.y, this.z);
    if (this.kind === 'rock') {
      for (let i = 0; i < 5; i++) FX.add('world', new Debris(this.x, this.y, Math.max(2, this.z), { s: rand(2, 4), vz: rand(3, 6) }));
      Hitfx.dust(this.x, sy(this.y, 0), 3, 10);
      Sfx.play('land', 0.6);
    } else {
      FX.add('world', new Flash(X, Y, 10, 60, 14, '200,100,255', 0.9));
      for (let i = 0; i < 10; i++) FX.add('world', new Mote(X, Y, rand(-4, 4), rand(-4, 4), { col: '200,110,255', life: 26, r: 9, grav: 0 }));
      Sfx.play('hitLight', 0.7, 0.6);
    }
  }
  drawShadow(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), this.r * 1.1, this.r * 0.35, 0, 0, TAU); ctx.fill();
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z);
    if (this.kind === 'rock') {
      ctx.save(); ctx.translate(X, Y); ctx.rotate(this.t * 0.3);
      ctx.fillStyle = '#1a1512'; ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a8173'; ctx.beginPath(); polyPath(ctx, [-6, -2, -2, -6, 5, -4, 6, 3, 1, 6, -5, 4]); ctx.fill();
      ctx.fillStyle = '#b3aa9a'; ctx.beginPath(); ctx.arc(-1.5, -2, 2, 0, TAU); ctx.fill();
      ctx.restore();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, X, Y, 34 + Math.sin(this.t * 0.4) * 4, '170,70,255', 0.8);
      drawGlow(ctx, X, Y, 14, '255,220,255', 1);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
