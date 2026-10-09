'use strict';
// ============================================================
//  검 고유 스킬 : 검마다 G(고유기) + R(각성기) 2개씩, 서로 겹치는 방식이 없다
//   w0(무쇠 연습검)은 원래의 지진검 / 극 귀신참을 그대로 쓴다
// ============================================================

// ---------- 공용 도우미 ----------
const WS = {
  // 타원 범위 안의 적 전부 타격 (applyHit 을 거치므로 검 패시브·손맛이 모두 적용됨)
  area(p, x, y, rx, ry, hd, o = {}) {
    let n = 0;
    for (const e of Game.enemies) {
      if (!e.hittable() || (o.set && o.set.has(e))) continue;
      const dx = (e.x - x) / rx, dy = (e.y - y) / ry;
      if (dx * dx + dy * dy > 1 || e.z > (o.hmax ?? 220)) continue;
      if (o.set) o.set.add(e);
      if (o.skip && o.skip(e)) continue;
      applyHit(p, e, hd, { noStopAtt: !o.stopAtt, dir: o.dir ?? (sign(e.x - x) || p.facing), hz: o.hz });
      if (o.each) o.each(e);
      n++;
    }
    return n;
  },
  // 화면 안 (카메라 기준) 적
  onScreen(margin = 60) {
    const c = Game.cam.x;
    return Game.enemies.filter(e => e.hittable() && e.x > c - margin && e.x < c + W + margin);
  },
  nearest(x, y, n = 99, r = 700, excl) {
    return Game.enemies.filter(e => e.hittable() && e !== excl && Math.abs(e.x - x) < r && Math.abs(e.y - y) < r * 0.6)
      .sort((a, b) => Math.hypot(a.x - x, (a.y - y) * 2) - Math.hypot(b.x - x, (b.y - y) * 2)).slice(0, n);
  },
  // 직접 피해 (시간 정지 해제 등) : 반응 + 숫자
  dmg(p, e, amount, o = {}) {
    if (!e || e.dead || e.dying || e.hp <= 0) return;
    amount = Math.max(1, Math.round(amount));
    FX.add('top', new DmgText(e.x, sy(e.y, e.z + e.hurtH()) - 20, amount, o.crit ? 'c' : 'n', 0));
    e.flash = 4; Game.stats.dmg += amount;
    e.takeHit(o.hit || { dmg: 3, kx: 6, kz: 7, stun: 30 }, p, o.dir ?? (sign(e.x - p.x) || 1), amount);
  },
  cutin(p, name, sub, col) { Game.startCutin(p, { name, sub, col }); },
  hd(o) { return Object.assign({ dmg: 1, kx: 3, airKz: 5, stun: 30, stop: 5, shake: 3 }, o); },

  reset() { Game.tstopT = 0; Game.eclipseT = 0; Game.frostT = 0; Game.stormT = 0; Game.crack = null; },
  tick() {
    if (Game.eclipseT > 0) Game.eclipseT--;
    if (Game.frostT > 0) Game.frostT--;
    if (Game.stormT > 0) Game.stormT--;
    if (Game.crack && Game.crack.t > 0) Game.crack.t--;
  },

  // 크로노 브레이크 해제 : 멈춘 동안 쌓인 피해가 한꺼번에 터진다
  timeResume() {
    const p = Game.player;
    Game.flashScreen(0.7, '220,240,255'); Game.addShake(16); Game.zoomPunch(1.06);
    Sfx.play('explode', 1); Sfx.wlayer('clock', 3, true);
    FX.add('top', new Label(p.x, sy(p.y, p.z) - 200, 'TIME RESUME', { col: ['#ffffff', '#6fd0ff'], size: 34, life: 70 }));
    for (const e of Game.enemies) {
      if (!e.tsStore) continue;
      const v = e.tsStore * 0.6; e.tsStore = 0;
      FX.add('world', new Flash(e.x, sy(e.y, e.z + e.h * 0.5), 20, 160, 18, '170,230,255', 0.9));
      FX.add('world', new Burst(e.x, sy(e.y, e.z + e.h * 0.5), { n: 16, r0: 16, r1: 140, life: 12, col: '200,240,255' }));
      this.dmg(p, e, v, { crit: true, hit: { dmg: 4, kx: 9, kz: 10, stun: 40 } });
    }
  },
  // 천의 그림자 : 분신이 따라 벤다
  cloneStrike(p, t) {
    if (this._cl && Game.frame - this._cl < 4) return;
    this._cl = Game.frame;
    for (let i = 0; i < 4; i++) Gear.later(3 + i * 2, () => {
      if (!t.hittable()) return;
      const a = i * 1.57 + 0.6, X = t.x + Math.cos(a) * 60, Y = sy(t.y, t.z + t.h * 0.5);
      FX.add('world', new CutLine(X, Y + Math.sin(a) * 30, a + 1.2, 90, 4, '150,100,235', 10));
      p.addGhost(t.x + (i % 2 ? 1 : -1) * 70, t.y, t.z, i % 2 ? -1 : 1, lerpPose(PP.a1s, PP.a2s, i / 4, P()), 10, '150,100,235');
      Gear.proc(p, t, 0.32, { quiet: i > 0 });
    });
  },
  moonbeam(t) {
    if (this._mb && Game.frame - this._mb < 10) return;
    this._mb = Game.frame;
    FX.add('world', new Pillar(t.x, t.y, 34, 520, 22, '190,210,255', '255,255,255'));
  },

  // 화면 전체 연출 (월드 위, UI 아래)
  overlay(ctx) {
    const t = Game.time;
    if (Game.tstopT > 0) {
      const a = Math.min(1, Game.tstopT / 20, (270 - Game.tstopT) / 12 + 0.2);
      ctx.fillStyle = `rgba(40,60,90,${0.38 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.globalAlpha = 0.28 * a;
      ctx.strokeStyle = '#cfefff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 230, 0, TAU); ctx.stroke();
      for (let k = 0; k < 12; k++) { const g = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(g) * 205, Math.sin(g) * 205); ctx.lineTo(Math.cos(g) * 228, Math.sin(g) * 228); ctx.stroke(); }
      ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -160); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(110, 40); ctx.stroke();
      ctx.restore();
    }
    if (Game.eclipseT > 0) {
      const a = Math.min(1, Game.eclipseT / 30, (360 - Game.eclipseT) / 20);
      ctx.fillStyle = `rgba(4,4,18,${0.5 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, W / 2, 120, 150, '190,210,255', 0.8);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#05050c'; ctx.beginPath(); ctx.arc(W / 2, 120, 58, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (Game.frostT > 0) {
      const a = Math.min(1, Game.frostT / 30);
      ctx.fillStyle = `rgba(210,235,255,${0.22 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`;
      for (let i = 0; i < 60; i++) { const x = (i * 97 + t * (1 + i % 3)) % W, y = (i * 53 + t * (2 + i % 4)) % H; ctx.fillRect(x, y, 3, 3); }
    }
    if (Game.stormT > 0) {
      const a = Math.min(1, Game.stormT / 30, 0.9);
      const g = ctx.createLinearGradient(0, 0, 0, 260);
      g.addColorStop(0, `rgba(10,12,30,${0.75 * a})`); g.addColorStop(1, 'rgba(10,12,30,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260);
      ctx.fillStyle = `rgba(20,24,48,${0.8 * a})`;
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse((i * 160 + t * 0.4) % (W + 200) - 100, 40 + (i % 3) * 22, 130, 46, 0, 0, TAU); ctx.fill(); }
    }
    if (Game.crack && Game.crack.lines.length) {
      const c = Game.crack, a = Math.min(1, c.t / 12);
      ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
      for (const L of c.lines) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.4;
        ctx.beginPath(); L.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,90,200,0.5)'; ctx.lineWidth = 7; ctx.stroke();
      }
      ctx.restore();
    }
  },
};

// ============================================================
//  스킬 전용 이펙트 / 물체 (FX 레이어에 들어가 매 프레임 갱신)
// ============================================================

// 지속 지대 (불길 / 용암 웅덩이 / 독늪)
class WZone {
  constructor(x, y, o) {
    Object.assign(this, { x, y, t: 0 }, o);
    this.every = o.every || 15; this.life = o.life || 120;
  }
  update() {
    this.t++;
    if (this.t % this.every === 0 && this.onTick) this.onTick(this);
    return this.t < this.life;
  }
  draw(ctx) {
    const u = this.t / this.life, a = Math.min(1, this.t / 8, (1 - u) * 4), gy = sy(this.y, 0), T = Game.time;
    ctx.save();
    if (this.kind === 'swamp') {
      ctx.fillStyle = `rgba(40,80,20,${0.55 * a})`; ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx, this.ry, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, this.x, gy, this.rx, '120,230,60', 0.25 * a, 1, this.ry / this.rx);
      for (let i = 0; i < 9; i++) {
        const ph = (T * 0.05 + i * 1.7) % 1, bx = this.x + Math.cos(i * 2.3) * this.rx * 0.7, by = gy + Math.sin(i * 1.9) * this.ry * 0.6;
        drawGlow(ctx, bx, by - ph * 10, 6 + ph * 10, '160,255,90', 0.7 * (1 - ph) * a);
      }
    } else {
      const lava = this.kind === 'lava';
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, this.x, gy, this.rx * 1.3, lava ? '255,90,20' : '255,130,30', 0.55 * a, 1, 0.35);
      if (!lava) for (let i = 0; i < 3; i++) {
        const h = (14 + Math.sin(T * 0.4 + i * 2 + this.x) * 6) * a, fx = this.x + (i - 1) * this.rx * 0.5;
        ctx.fillStyle = `rgba(255,${150 + i * 30},60,${0.8 * a})`;
        ctx.beginPath(); ctx.moveTo(fx - 6, gy); ctx.quadraticCurveTo(fx, gy - h * 1.6, fx + 6, gy); ctx.fill();
      } else { ctx.fillStyle = `rgba(255,140,40,${0.6 * a})`; ctx.beginPath(); ctx.ellipse(this.x, gy, this.rx * 0.8, this.ry * 0.7, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
}

// 플레이어 투사체 (부메랑 / 유도 / 분열 …)
class WShot {
  constructor(p, x, y, z, vx, vy, vz, o) {
    Object.assign(this, { p, x, y, z, vx, vy, vz, t: 0, dist: 0, set: new Set(), add: true }, o);
    this.life = o.life || 60; this.r = o.r || 24; this.rehit = o.rehit || 0; this.hitT = new Map();
  }
  update() {
    this.t++;
    const p = this.p;
    if (this.home) {                                   // 가장 가까운 적을 향해 휜다
      const tg = WS.nearest(this.x, this.y, 1, 700)[0];
      if (tg) {
        const a = Math.atan2((tg.y - this.y) * 2, tg.x - this.x), sp = Math.hypot(this.vx, this.vy * 2) || 1;
        const cur = Math.atan2(this.vy * 2, this.vx), d = Math.atan2(Math.sin(a - cur), Math.cos(a - cur));
        const na = cur + clamp(d, -this.home, this.home);
        this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp / 2;
      }
    }
    if (this.ret && !this.back && this.dist > this.ret) { this.back = true; this.set.clear(); }
    if (this.back) {                                   // 부메랑 : 주인에게 돌아온다
      const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy) || 1, sp = 17;
      this.vx = dx / d * sp; this.vy = dy / d * sp * 0.6; this.z = lerp(this.z, p.z + 70, 0.1);
      if (d < 30) return this.end();
    }
    this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.z += this.vz; this.dist += Math.abs(this.vx);
    if (this.grav) this.vz -= this.grav;
    if (this.z <= 0 && this.vz < 0 && !this.floor) return this.end();
    for (const e of Game.enemies) {
      if (!e.hittable()) continue;
      if (this.rehit) { if ((this.hitT.get(e) || -99) > this.t - this.rehit) continue; } else if (this.set.has(e)) continue;
      if (Math.abs(e.x - this.x) > this.r + e.w || Math.abs(e.y - this.y) > this.r * 0.6 + e.d || this.z < e.z - 20 || this.z > e.z + e.hurtH() + 20) continue;
      this.set.add(e); this.hitT.set(e, this.t);
      applyHit(p, e, this.hd, { noStopAtt: true, dir: sign(this.vx) || p.facing, hz: this.z });
      if (this.onHit) this.onHit(this, e);
      if (!this.pierce) return this.end();
    }
    const r = Game.room;
    if (this.t >= this.life || (r && (this.x < r.minX - 60 || this.x > r.maxX + 60))) return this.end();
    if (this.trail && this.t % 2 === 0) FX.add('world', new Mote(this.x, sy(this.y, this.z), 0, 0, { col: this.col, life: 14, r: this.r * 0.5, grav: 0 }));
    return true;
  }
  end() { if (!this.ended) { this.ended = true; if (this.onEnd) this.onEnd(this); } return false; }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z), T = this.t, c = this.col;
    ctx.save(); ctx.translate(X, Y);
    switch (this.style) {
      case 'wind':
        ctx.rotate(T * 0.6);
        for (const [s, a] of [[1, 0.35], [0.7, 0.9]]) { ctx.fillStyle = `rgba(${c},${a})`; ctx.beginPath(); ctx.arc(0, 0, this.r * s, 0.3, Math.PI * 1.4); ctx.arc(-this.r * 0.25, 0, this.r * 0.75 * s, Math.PI * 1.4, 0.3, true); ctx.fill(); }
        break;
      case 'snake': {
        const ang = Math.atan2(this.vy * 2, this.vx);
        ctx.rotate(ang); ctx.lineCap = 'round';
        ctx.strokeStyle = '#1e4a10'; ctx.lineWidth = 9; ctx.beginPath();
        for (let i = 0; i <= 8; i++) ctx.lineTo(-i * 6, Math.sin(T * 0.5 - i * 0.8) * 6); ctx.stroke();
        ctx.strokeStyle = '#7ad040'; ctx.lineWidth = 5; ctx.stroke();
        ctx.fillStyle = '#4a9a20'; ctx.beginPath(); ctx.ellipse(4, 0, 8, 6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffe040'; ctx.fillRect(6, -3, 2.5, 2.5);
        break;
      }
      case 'crescent':
        ctx.rotate(T * 0.35 * (this.vx >= 0 ? 1 : -1));
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, 0, 0, this.r * 1.5, c, 0.5);
        ctx.fillStyle = `rgba(${c},0.9)`; ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 1.3); ctx.arc(this.r * 0.3, -this.r * 0.15, this.r * 0.82, Math.PI * 1.3, 0, true); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(0, 0, this.r * 0.96, 0.2, Math.PI * 1.1); ctx.arc(this.r * 0.18, -this.r * 0.1, this.r * 0.9, Math.PI * 1.1, 0.2, true); ctx.fill();
        break;
      case 'feather':
        ctx.rotate(Math.atan2(-this.vz + this.vy, this.vx));
        ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 22, '255,240,190', 0.6);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 4.5, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#e8d8a0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(14, 0); ctx.stroke();
        break;
      default:
        ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, this.r * 1.4, c, 0.9);
    }
    ctx.restore();
  }
}

// 화면을 가로지르는 불새
class WPhoenix {
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, add: true, hits: new Map(), z: 120 }); this.x0 = x; }
  update() {
    this.t++; this.x += this.dir * 19;
    const p = this.p;
    if (this.t % 2 === 0) for (let i = 0; i < 3; i++) FX.add('world', new Mote(this.x - this.dir * rand(40, 160), sy(this.y, this.z) + rand(-40, 40), -this.dir * rand(1, 3), rand(-1.5, 0.5), { col: choose(['255,120,30', '255,200,80']), life: 30, r: rand(8, 16) }));
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 120 || Math.abs(e.y - this.y) > 110) continue;
      const n = this.hits.get(e) || 0, last = this['l' + e.id] || -99;
      if (n >= 5 || this.t - last < 4) continue;
      this.hits.set(e, n + 1); this['l' + e.id] = this.t;
      applyHit(p, e, WH.phoenix, { noStopAtt: true, dir: this.dir });
      Status.add(e, 'burn', { t: 200, d: p.atk * 0.3 });
    }
    const r = Game.room;
    if (this.x < r.minX - 200 || this.x > r.maxX + 200) {
      const cx = clamp(Game.cam.x + W / 2, r.minX, r.maxX);
      FX.add('world', new Flash(cx, sy(this.y, 60), 40, 520, 26, '255,140,40', 1));
      FX.add('ground', new Ring(cx, sy(this.y, 0), 40, 640, 30, { col: '255,170,70', w: 20 }));
      Sfx.play('explode', 1.1); Game.addShake(20); Game.flashScreen(0.6, '255,200,140'); Game.zoomPunch(1.08);
      for (const e of WS.onScreen()) { applyHit(p, e, WH.phoenixEnd, { noStopAtt: true, dir: sign(e.x - cx) || 1 }); }
      return false;
    }
    return true;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z), d = this.dir, fl = Math.sin(this.t * 0.45);
    ctx.save(); ctx.translate(X, Y); ctx.scale(d * 1.45, 1.45); ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 0, 0, 230, '255,110,20', 0.55);
    const wing = (s) => {
      ctx.beginPath(); ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(-40, -120 * s * (0.6 + fl * 0.4), -150, -150 * s * (0.5 + fl * 0.5));
      ctx.quadraticCurveTo(-90, -40 * s, -60, 0); ctx.closePath(); ctx.fill();
    };
    ctx.fillStyle = 'rgba(255,120,30,0.75)'; wing(1); wing(-0.55);
    ctx.fillStyle = 'rgba(255,210,90,0.85)';
    ctx.beginPath(); ctx.ellipse(0, 0, 70, 22, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(60, -6); ctx.lineTo(108, -14); ctx.lineTo(70, 10); ctx.fill();           // 머리
    for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(255,${100 + i * 30},40,0.6)`; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.quadraticCurveTo(-130, (i - 1.5) * 16 + fl * 8, -220 - i * 20, (i - 1.5) * 34); ctx.lineTo(-60, 6); ctx.fill(); }
    drawGlow(ctx, 30, -4, 60, '255,255,220', 0.9);
    ctx.restore();
  }
}

// 얼음 가시 (솟았다가 부서짐)
class WSpike {
  constructor(x, y, h, col = ['#bfeaff', '#7ac0e8', '#ffffff']) { Object.assign(this, { x, y, h, col, t: 0, life: 34 }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, rise = E.out3(Math.min(1, this.t / 5)), a = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3, gy = sy(this.y, 0), h = this.h * rise;
    ctx.save(); ctx.globalAlpha = a;
    for (const [ox, s] of [[-18, 0.6], [16, 0.7], [0, 1]]) {
      ctx.fillStyle = this.col[1]; ctx.beginPath(); ctx.moveTo(this.x + ox - 14 * s, gy); ctx.lineTo(this.x + ox, gy - h * s); ctx.lineTo(this.x + ox + 14 * s, gy); ctx.fill();
      ctx.fillStyle = this.col[2]; ctx.beginPath(); ctx.moveTo(this.x + ox - 3 * s, gy); ctx.lineTo(this.x + ox, gy - h * s); ctx.lineTo(this.x + ox + 6 * s, gy); ctx.fill();
    }
    ctx.restore();
  }
}

// 하늘에서 떨어지는 거대한 검 / 단두대 칼날
class WBigBlade {
  constructor(x, y, o) { Object.assign(this, { x, y, t: 0, dur: o.dur || 34, kind: o.kind || 'sword', onImpact: o.onImpact, follow: o.follow, add: false }); }
  update() {
    this.t++;
    if (this.follow && this.follow.hittable() && this.t < this.dur - 6) { this.x = lerp(this.x, this.follow.x, 0.3); this.y = lerp(this.y, this.follow.y, 0.3); }
    if (this.t === this.dur && this.onImpact) this.onImpact(this);
    return this.t < this.dur + 26;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), u = Math.min(1, this.t / this.dur), e = u * u * u;
    const tipY = lerp(-260, gy - 6, e), a = this.t > this.dur ? 1 - (this.t - this.dur) / 26 : Math.min(1, this.t / 6);
    ctx.save(); ctx.globalAlpha = a;
    if (this.t < this.dur) { ctx.fillStyle = `rgba(255,${this.kind === 'sword' ? 230 : 60},${this.kind === 'sword' ? 140 : 60},${0.25 + u * 0.3})`; ctx.beginPath(); ctx.ellipse(this.x, gy, 90 * (0.4 + u * 0.6), 26 * (0.4 + u * 0.6), 0, 0, TAU); ctx.fill(); }
    if (this.kind === 'sword') {
      const L = 420, w = 34;
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, tipY - L * 0.5, 220, '255,230,150', 0.5, 0.6, 1.4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.moveTo(this.x, tipY); ctx.lineTo(this.x - w, tipY - 60); ctx.lineTo(this.x - w, tipY - L); ctx.lineTo(this.x + w, tipY - L); ctx.lineTo(this.x + w, tipY - 60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(this.x - 4, tipY - L, 8, L - 50);
      ctx.fillStyle = '#d8a83a'; ctx.fillRect(this.x - 90, tipY - L - 16, 180, 24); ctx.fillRect(this.x - 12, tipY - L - 110, 24, 96);
    } else {
      const w = 110, h = 70;
      ctx.fillStyle = '#5a5a68'; ctx.fillRect(this.x - w - 18, -40, 14, tipY + 40); ctx.fillRect(this.x + w + 4, -40, 14, tipY + 40);
      ctx.fillStyle = '#9a9aac'; ctx.beginPath(); ctx.moveTo(this.x - w, tipY - h); ctx.lineTo(this.x + w, tipY - h); ctx.lineTo(this.x + w, tipY - 20); ctx.lineTo(this.x - w, tipY + 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8e8f4'; ctx.beginPath(); ctx.moveTo(this.x - w, tipY + 6); ctx.lineTo(this.x + w, tipY - 20); ctx.lineTo(this.x + w, tipY - 30); ctx.lineTo(this.x - w, tipY - 6); ctx.fill();
      ctx.fillStyle = '#3a3a48'; ctx.fillRect(this.x - w, tipY - h - 18, w * 2, 18);
    }
    ctx.restore();
  }
}

// 회오리 (적을 빨아올려 공중에 붙잡는다)
class WTornado {
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, life: 250, add: true, hit: new Map(), caught: new Set() }); }
  update() {
    this.t++; this.x += this.dir * 3.2;
    const r = Game.room; this.x = clamp(this.x, r.minX + 40, r.maxX - 40);
    const p = this.p, end = this.t >= this.life;
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 170 || Math.abs(e.y - this.y) > 100) continue;
      this.caught.add(e);
      if (!e.isBoss) {
        e.x = lerp(e.x, this.x + Math.sin(this.t * 0.25 + e.id) * 40, 0.2); e.y = lerp(e.y, this.y, 0.1);
        e.z = lerp(e.z, 90 + Math.sin(this.t * 0.2 + e.id) * 50, 0.2); e.vz = 0; e.hitstop = Math.max(e.hitstop, 2);
        if (e.state !== 'dying') { e.state = 'air'; }
      }
      if (this.t - (this.hit.get(e) || -99) >= 9) { this.hit.set(e, this.t); applyHit(p, e, WH.tornado, { noStopAtt: true, dir: sign(e.x - this.x) || 1 }); }
    }
    if (end) {
      FX.add('world', new Flash(this.x, sy(this.y, 160), 40, 300, 22, '200,255,225', 0.9));
      Sfx.wlayer('wind', 3, true); Sfx.play('explode', 0.6); Game.addShake(12);
      for (const e of this.caught) if (e.hittable()) { e.hitstop = 0; applyHit(p, e, WH.tornadoEnd, { noStopAtt: true, dir: sign(e.x - this.x) || 1 }); }
      return false;
    }
    return true;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), T = this.t, a = Math.min(1, T / 12, (this.life - T) / 12);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const u = i / 16, yy = gy - u * 360, rr = 26 + u * 130, ph = T * 0.35 + i * 0.7;
      ctx.strokeStyle = `rgba(200,255,225,${(0.25 + u * 0.25) * a})`; ctx.lineWidth = 6 - u * 3;
      ctx.beginPath(); ctx.ellipse(this.x + Math.sin(ph * 0.3) * 10, yy, rr, rr * 0.22, 0, ph % TAU, ph % TAU + 4.2); ctx.stroke();
    }
    drawGlow(ctx, this.x, gy - 160, 220, '170,255,205', 0.22 * a, 0.7, 1.4);
    ctx.restore();
  }
}

// 번개 구름 : 일정 시간 동안 화면 안의 적에게 낙뢰
class WStorm {
  constructor(p) { Object.assign(this, { p, t: 0, life: 320 }); Game.stormT = 320; }
  update() {
    this.t++;
    if (this.t % 9 === 0) {
      const list = WS.onScreen();
      if (list.length) {
        const e = choose(list), X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
        FX.add('world', new Bolt(X + rand(-40, 40), sy(0, 600), X, Y, { life: 10, amp: 30, w: 4.5 }));
        FX.add('world', new Flash(X, Y, 14, 110, 12, '255,245,150', 0.9));
        FX.add('ground', new Ring(X, sy(e.y, 0), 10, 90, 14, { col: '255,240,120', w: 6 }));
        applyHit(this.p, e, WH.storm, { noStopAtt: true, dir: e.facing * -1 || 1 });
        Status.add(e, 'shock', { t: 18 });
        Sfx.wlayer('elec', 2, false); Game.addShake(3);
        if (this.t % 27 === 0) Game.flashScreen(0.08, '230,240,255');
      }
    }
    return this.t < this.life;
  }
  draw() { }
}

// 용암 해일 : 화면을 가로질러 적을 벽까지 밀어붙인다
class WWave {
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, hit: new Map(), add: false }); }
  update() {
    this.t++; this.x += this.dir * 12;
    const p = this.p, r = Game.room;
    for (const e of Game.enemies) {
      if (!e.hittable()) continue;
      const rel = (e.x - this.x) * this.dir;
      if (rel > 40 || rel < -150) continue;
      if (!e.isBoss) { e.vx = this.dir * 14; e.x += this.dir * 6; if (e.z < 30) e.z = 30; e.state = e.state === 'dying' ? 'dying' : 'air'; e.vz = Math.max(e.vz, 1); }
      if (this.t - (this.hit.get(e) || -99) >= 8) { this.hit.set(e, this.t); applyHit(p, e, this.hit.has('f' + e.id) ? WH.waveTick : WH.wave, { noStopAtt: true, dir: this.dir }); this.hit.set('f' + e.id, 1); Status.add(e, 'burn', { t: 120, d: p.atk * 0.2 }); }
    }
    if (this.t % 2 === 0) FX.add('world', new Debris(this.x + this.dir * rand(-40, 20), rand(0, DEPTH), rand(20, 200), { vx: this.dir * rand(2, 8), vz: rand(2, 8), s: rand(3, 6), col: ['#2a1612', '#5a2a18', '#ff8a30'], glow: '255,120,30', life: 40 }));
    if (this.x < r.minX - 100 || this.x > r.maxX + 100) {
      Sfx.play('explode', 1); Game.addShake(16); Game.flashScreen(0.4, '255,160,80');
      return false;
    }
    if (this.t % 6 === 0) Game.addShake(4);
    return true;
  }
  draw(ctx) {
    const top = GROUND_Y - 40, bot = sy(DEPTH, 0) + 20, d = this.dir, x = this.x, T = this.t;
    ctx.save();
    const g = ctx.createLinearGradient(x - d * 240, 0, x, 0);
    g.addColorStop(0, 'rgba(120,20,0,0)'); g.addColorStop(0.6, 'rgba(200,50,10,0.85)'); g.addColorStop(1, 'rgba(255,150,40,0.95)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - d * 260, bot); ctx.lineTo(x - d * 260, top);
    for (let i = 0; i <= 10; i++) { const yy = lerp(top, bot, i / 10); ctx.lineTo(x + d * (20 + Math.sin(T * 0.4 + i) * 22), yy - 30 * Math.sin(i / 10 * Math.PI)); }
    ctx.lineTo(x - d * 260, bot); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, (top + bot) / 2, 260, '255,110,30', 0.5, 0.6, 1.3);
    ctx.restore();
  }
}

// 플레이어 주위를 도는 사신의 낫
class WOrbit {
  constructor(p) { Object.assign(this, { p, t: 0, life: 360, hit: new Map(), add: true }); }
  pos(i) { const p = this.p, a = this.t * 0.13 + i * TAU / 3; return [p.x + Math.cos(a) * 140, p.y + Math.sin(a) * 50, p.z + 70 + Math.sin(a) * 20, a]; }
  update() {
    this.t++;
    const p = this.p;
    if (p.hp <= 0) return false;
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = this.pos(i);
      for (const e of Game.enemies) {
        if (!e.hittable() || Math.abs(e.x - x) > 46 + e.w || Math.abs(e.y - y) > 40 || z < e.z - 30 || z > e.z + e.hurtH() + 30) continue;
        if (this.t - (this.hit.get(e) || -99) < 10) continue;
        this.hit.set(e, this.t);
        applyHit(p, e, WH.orbit, { noStopAtt: true, dir: sign(e.x - p.x) || 1, hz: z });
      }
    }
    if (this.t >= this.life) {
      FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 300, 24, { col: '200,130,255', w: 14 }));
      Sfx.wlayer('void', 3, true); Game.addShake(8);
      WS.area(p, p.x, p.y, 240, 110, WH.orbitEnd);
      return false;
    }
    return true;
  }
  draw(ctx) {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const [x, y, z, a] = this.pos(i), X = x, Y = sy(y, z);
      ctx.save(); ctx.translate(X, Y); ctx.rotate(a * 3);
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 50, '170,80,255', 0.6);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#2a1048'; ctx.fillRect(-3, -34, 6, 60);
      ctx.fillStyle = '#c89aff'; ctx.beginPath(); ctx.moveTo(0, -34); ctx.quadraticCurveTo(46, -40, 52, -6); ctx.quadraticCurveTo(30, -26, 0, -22); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

// 망자의 기사 : 화면을 가로질러 행진하며 베어 넘긴다
class WMarcher {
  constructor(p, x, y, dir, delay) {
    Object.assign(this, { p, x, y, dir, t: -delay, set: new Set(), add: true });
    this.J = newJ(); this.pose = P();
  }
  update() {
    this.t++;
    if (this.t < 0) return true;
    this.x += this.dir * 8.5;
    const u = (Math.sin(this.t * 0.35) + 1) / 2;
    lerpPose(PP.a1w, PP.a1s, u, this.pose); solveRig(this.p.rig, this.pose, this.J, true);
    for (const e of Game.enemies) {
      if (!e.hittable() || this.set.has(e) || Math.abs(e.x - this.x) > 70 || Math.abs(e.y - this.y) > 50) continue;
      this.set.add(e); applyHit(this.p, e, WH.march, { noStopAtt: true, dir: this.dir });
      FX.add('world', new CutLine(e.x, sy(e.y, e.z + e.h * 0.5), this.dir > 0 ? -0.6 : Math.PI + 0.6, 110, 5, '140,255,210', 12));
    }
    const r = Game.room;
    return this.x > r.minX - 300 && this.x < r.maxX + 300;
  }
  draw(ctx) {
    if (this.t < 0) return;
    const R = this.p.rig, a = Math.min(1, this.t / 10);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * a;
    ctx.translate(this.x, sy(this.y, 0)); ctx.scale(this.dir * 1.25, 1.25);
    R.draw(ctx, this.J, R.ghostPal('120,255,200'), this.p, { ghost: true });
    ctx.restore();
  }
}

// 별자리 : 표식을 이은 선
class WLinks {
  constructor(list, life) { Object.assign(this, { list, life, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const pts = this.list.filter(e => !e.dead).map(e => [e.x, sy(e.y, e.z + e.h * 0.6)]);
    const u = this.t / this.life, show = Math.min(pts.length, Math.floor(this.t / 5) + 1);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(255,236,150,${0.7 + u * 0.3})`; ctx.lineWidth = 2 + u * 3;
    ctx.beginPath(); pts.slice(0, show).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    for (const [x, y] of pts.slice(0, show)) {
      drawGlow(ctx, x, y, 30 + u * 30, '255,236,150', 0.9);
      ctx.fillStyle = '#fff'; ctx.beginPath();
      for (let k = 0; k < 10; k++) { const r = k % 2 ? 6 : 15, a = k / 10 * TAU - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.fill();
    }
    ctx.restore();
  }
}

// 피의 줄 : 플레이어와 적을 잇는다
class WTether {
  constructor(p, list, life) { Object.assign(this, { p, list, life, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const p = this.p, X = p.x, Y = sy(p.y, p.z + 80);
    ctx.save(); ctx.lineCap = 'round';
    for (const e of this.list) {
      if (e.dead || e.dying) continue;
      const ex = e.x, ey = sy(e.y, e.z + e.h * 0.5);
      ctx.strokeStyle = 'rgba(255,40,70,0.35)'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.quadraticCurveTo((ex + X) / 2, Math.min(ey, Y) - 80, X, Y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,120,140,0.9)'; ctx.lineWidth = 2.5; ctx.stroke();
      const k = (this.t * 0.04 + e.id * 0.3) % 1, mx = lerp(lerp(ex, (ex + X) / 2, k), lerp((ex + X) / 2, X, k), k), my = lerp(lerp(ey, Math.min(ey, Y) - 80, k), lerp(Math.min(ey, Y) - 80, Y, k), k);
      drawGlow(ctx, mx, my, 14, '255,60,80', 1);
    }
    drawGlow(ctx, X, Y, 60, '255,40,70', 0.6);
    ctx.restore();
  }
}

// 혼돈의 균열 : 무작위 주문을 쏟아낸다
class WRift {
  constructor(p, x, y) { Object.assign(this, { p, x, y, t: 0, life: 172, add: true }); }
  update() {
    this.t++;
    if (this.t % 24 === 12) {
      const p = this.p, list = WS.nearest(this.x, this.y, 99, 750);
      const e = list.length ? choose(list) : null;
      if (e) {
        const kind = choose(['fire', 'ice', 'elec', 'void', 'poison']), X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
        const col = { fire: '255,130,40', ice: '170,230,255', elec: '255,240,110', void: '190,100,255', poison: '140,235,80' }[kind];
        FX.add('world', new Bolt(this.x, sy(this.y, 150), X, Y, { col, life: 8, amp: 18, w: 3 }));
        if (kind === 'fire') { FX.add('world', new Pillar(e.x, e.y, 46, 300, 26, '255,110,30', '255,230,170')); Status.add(e, 'burn', { t: 180, d: p.atk * 0.3 }); }
        if (kind === 'ice') { FX.add('world', new WSpike(e.x, e.y, 140)); Status.add(e, 'freeze', { t: 70 }); }
        if (kind === 'elec') { FX.add('world', new Bolt(X, sy(0, 600), X, Y, { life: 10, amp: 26, w: 4 })); Status.add(e, 'shock', { t: 30 }); }
        if (kind === 'void') { for (const o of WS.nearest(e.x, e.y, 6, 260, e)) if (!o.isBoss) { o.x = lerp(o.x, e.x, 0.6); o.y = lerp(o.y, e.y, 0.5); } FX.add('ground', new Ring(e.x, sy(e.y, 0), 240, 10, 18, { col, w: 8 })); }
        if (kind === 'poison') { Status.add(e, 'poison', { t: 240, d: p.atk * 0.12, n: 3 }); FX.add('world', new Flash(X, Y, 20, 140, 18, col, 0.7)); }
        WS.area(p, e.x, e.y, 90, 50, WH.rift);
        Sfx.wlayer(kind === 'void' ? 'void' : kind === 'poison' ? 'poison' : kind === 'ice' ? 'ice' : kind, 2, false);
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, 150), T = this.t, a = Math.min(1, T / 10, (this.life - T) / 12);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const h = (T * 2.2) % 360, c = hslRgb(h, 0.9, 0.6).join(',');
    drawGlow(ctx, X, Y, 110, c, 0.6 * a, 0.6, 1.3);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
    ctx.fillStyle = '#0a0010'; ctx.beginPath();
    for (let i = 0; i < 14; i++) { const ang = i / 14 * TAU, r = (i % 2 ? 22 : 62) + Math.sin(T * 0.3 + i) * 6; ctx.lineTo(X + Math.cos(ang) * r * 0.45, Y + Math.sin(ang) * r); }
    ctx.fill();
    ctx.strokeStyle = `rgb(${c})`; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
}

// 운석우 / 다발 낙하 관리
class WShower {
  constructor(p, life, every, fn) { Object.assign(this, { p, life, every, fn, t: 0 }); }
  update() { this.t++; if (this.t % this.every === 0) this.fn(this); return this.t < this.life; }
  draw() { }
}

// 화면이 깨져 쏟아지는 유리 조각 (혼돈의 각성기)
class WShards {
  constructor() {
    this.t = 0; this.life = 70; this.list = [];
    const cx = Game.cam.x;
    for (let i = 0; i < 46; i++) this.list.push({ x: cx + rand(0, W), y: rand(0, H), vx: rand(-3, 3), vy: rand(-4, 2), r: rand(0, TAU), vr: rand(-0.2, 0.2), s: rand(20, 60), c: choose(['255,90,200', '90,200,255', '255,220,90', '255,255,255']) });
  }
  update() { this.t++; for (const s of this.list) { s.x += s.vx; s.y += s.vy; s.vy += 0.6; s.r += s.vr; } return this.t < this.life; }
  draw(ctx) {
    const a = 1 - this.t / this.life;
    ctx.save();
    for (const s of this.list) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r);
      ctx.fillStyle = `rgba(${s.c},${0.35 * a})`; ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-s.s * 0.5, -s.s * 0.3); ctx.lineTo(s.s * 0.4, -s.s * 0.5); ctx.lineTo(s.s * 0.2, s.s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}

// 포털 (공허의 문)
class WPortal {
  constructor(x, y, z, life) { Object.assign(this, { x, y, z, life, t: 0, add: false }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z), u = this.t / this.life, s = Math.min(1, this.t / 8, (1 - u) * 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, 130 * s, '170,80,255', 0.6);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#08020f'; ctx.beginPath(); ctx.ellipse(X, Y, 34 * s, 90 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c89aff'; ctx.lineWidth = 4;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(X, Y, (34 - i * 10) * s, (90 - i * 24) * s, 0, this.t * 0.2 * (i ? -1 : 1), this.t * 0.2 * (i ? -1 : 1) + 4.5); ctx.stroke(); }
    ctx.restore();
  }
}

// ============================================================
//  타격 정의 (스킬 전용)
// ============================================================
const WH = {
  cyc: WS.hd({ dmg: 1.6, kx: 3, airKz: 3.5, stun: 24, stop: 3, shake: 2, fx: 'slash', power: 1.1 }),
  fireTick: WS.hd({ dmg: 0.5, kx: 0, airKz: 1, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  phoenix: WS.hd({ dmg: 3.4, kx: 4, kz: 6, airKz: 6, stun: 40, stop: 3, shake: 4, fx: 'heavy', power: 1.4 }),
  phoenixEnd: WS.hd({ dmg: 16, kx: 9, kz: 12, airKz: 11, stun: 60, stop: 14, shake: 16, fx: 'heavy', power: 2.4 }),
  spike: WS.hd({ dmg: 3, kx: 1, kz: 11, airKz: 9, stun: 40, stop: 6, shake: 5, fx: 'pierce', ang: 90, power: 1.3 }),
  zero: WS.hd({ dmg: 30, kx: 8, kz: 12, airKz: 11, stun: 70, stop: 18, shake: 18, fx: 'x', power: 2.6 }),
  step: WS.hd({ dmg: 3.8, kx: 4, kz: 5, airKz: 6, stun: 40, stop: 5, shake: 5, fx: 'pierce', power: 1.4 }),
  storm: WS.hd({ dmg: 2.7, kx: 1, airKz: 4, stun: 30, stop: 3, shake: 3, fx: 'none', sfx: 'none', power2: 2 }),
  bloodBurst: WS.hd({ dmg: 4.5, kx: 7, kz: 7, airKz: 7, stun: 40, stop: 9, shake: 8, fx: 'heavy', power: 1.5 }),
  bloodMoon: WS.hd({ dmg: 16, kx: 10, kz: 12, airKz: 11, stun: 60, stop: 14, shake: 16, fx: 'heavy', power: 2.4 }),
  slam: WS.hd({ dmg: 13, kx: 6, kz: 9, airKz: 9, stun: 60, stop: 16, shake: 16, fx: 'heavy', power: 2.4 }),
  slamWave: WS.hd({ dmg: 4, kx: 6, kz: 8, airKz: 8, stun: 40, stop: 6, shake: 6, fx: 'blunt' }),
  rock: WS.hd({ dmg: 3.6, kx: 2, kz: 13, airKz: 11, stun: 40, stop: 5, shake: 6, fx: 'blunt', power: 1.4 }),
  boulder: WS.hd({ dmg: 22, kx: 8, kz: 14, airKz: 12, stun: 70, stop: 18, shake: 20, fx: 'heavy', power: 2.6 }),
  vac: WS.hd({ dmg: 1.9, kx: 2, airKz: 3, stun: 22, stop: 2, shake: 1.5, fx: 'slash' }),
  tornado: WS.hd({ dmg: 1.7, kx: 0, airKz: 0, stun: 30, stop: 2, shake: 1.5, fx: 'slash', power2: 0 }),
  tornadoEnd: WS.hd({ dmg: 12, kx: 6, kz: 16, airKz: 15, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2.2 }),
  bite: WS.hd({ dmg: 3, kx: 2, airKz: 3, stun: 30, stop: 4, shake: 2, fx: 'pierce' }),
  swampTick: WS.hd({ dmg: 0.8, kx: 0, airKz: 0.5, stun: 8, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  bubble: WS.hd({ dmg: 2.4, kx: 1, kz: 7, airKz: 6, stun: 30, stop: 3, shake: 3, fx: 'blunt' }),
  holyCounter: WS.hd({ dmg: 11, kx: 10, kz: 8, airKz: 8, stun: 50, stop: 14, shake: 12, fx: 'heavy', power: 2 }),
  holyWave: WS.hd({ dmg: 4, kx: 6, kz: 4, airKz: 5, stun: 30, stop: 5, shake: 4, fx: 'blunt' }),
  judgment: WS.hd({ dmg: 32, kx: 8, kz: 14, airKz: 12, stun: 70, stop: 18, shake: 20, fx: 'heavy', power: 2.8 }),
  voidDrop: WS.hd({ dmg: 8, kx: 0, kz: 0, airKz: 0, stun: 50, stop: 8, shake: 10, fx: 'heavy', power: 1.8 }),
  orbit: WS.hd({ dmg: 2.3, kx: 3, airKz: 3, stun: 22, stop: 2, shake: 1.5, fx: 'slash' }),
  orbitEnd: WS.hd({ dmg: 10, kx: 9, kz: 8, airKz: 8, stun: 50, stop: 10, shake: 10, fx: 'heavy', power: 2 }),
  geyser: WS.hd({ dmg: 6.5, kx: 1, kz: 16, airKz: 14, stun: 50, stop: 8, shake: 8, fx: 'none', sfx: 'heavy', power2: 2 }),
  wave: WS.hd({ dmg: 5, kx: 14, kz: 3, airKz: 3, stun: 50, stop: 6, shake: 8, fx: 'heavy', power: 1.6 }),
  waveTick: WS.hd({ dmg: 1.6, kx: 14, airKz: 1, stun: 30, stop: 2, shake: 2, fx: 'none' }),
  guillo: WS.hd({ dmg: 17, kx: 3, kz: 5, airKz: 6, stun: 60, stop: 16, shake: 14, fx: 'x', power: 2.4, noBack: true }),
  guilloSplash: WS.hd({ dmg: 4, kx: 6, kz: 6, airKz: 6, stun: 40, stop: 4, shake: 4, fx: 'blunt' }),
  march: WS.hd({ dmg: 6.5, kx: 7, kz: 6, airKz: 7, stun: 50, stop: 5, shake: 5, fx: 'slash', power: 1.5 }),
  cres: WS.hd({ dmg: 2.2, kx: 2, airKz: 3, stun: 26, stop: 2, shake: 2, fx: 'slash' }),
  cresSmall: WS.hd({ dmg: 2.4, kx: 3, airKz: 4, stun: 26, stop: 3, shake: 2, fx: 'slash' }),
  meteor: WS.hd({ dmg: 3.4, kx: 3, kz: 8, airKz: 7, stun: 40, stop: 4, shake: 5, fx: 'none', sfx: 'heavy', power2: 2 }),
  backstab: WS.hd({ dmg: 10, kx: 3, kz: 0, airKz: 4, stun: 90, stop: 14, shake: 10, fx: 'x', power: 2.2, crit: 1 }),
  feather: WS.hd({ dmg: 1.7, kx: 1, airKz: 2, stun: 20, stop: 2, shake: 1, fx: 'pierce' }),
  angelRing: WS.hd({ dmg: 6, kx: 11, kz: 6, airKz: 7, stun: 40, stop: 6, shake: 6, fx: 'blunt' }),
  rift: WS.hd({ dmg: 5, kx: 3, kz: 6, airKz: 6, stun: 40, stop: 5, shake: 4, fx: 'none', power2: 2 }),
  endSlash: WS.hd({ dmg: 2.3, kx: 1, airKz: 3, stun: 40, stop: 2, shake: 3, fx: 'slash', power2: 1 }),
  endFinal: WS.hd({ dmg: 34, kx: 10, kz: 16, airKz: 14, stun: 80, stop: 20, shake: 22, fx: 'heavy', power: 3 }),
};

// ============================================================
//  스킬 정의 : 검마다 s5(고유기, G) / s6(각성기, R)
// ============================================================
const ws = (s5, s6) => ({ s5: Object.assign({ key: 's5' }, s5), s6: Object.assign({ key: 's6' }, s6) });
const swingT = (p, k, sp = 1.4) => { p.play(k, 1, sp, true); p.swing = newSwing(); };

const WSK = {
  // ----------------------------- 화염도 이그니스 -----------------------------
  w1: ws({
    name: '화염 회오리', mp: 160, cd: 9, ico: ['spin', '255,130,40'], desc: '불꽃을 두른 채 회전하며 전진. 지나간 자리에 불길이 남아 계속 태운다.',
    act: {
      anim: 'a1', len: 62, cancel: 54, atkCancel: 54,
      start(p) { Sfx.pplay('swingBig'); p.bladeGlow = 1.2; },
      update(p, f) {
        p.armorF = f < 56; p.trailOn = f < 58;
        const ax = Input.axisX(); if (ax) p.facing = ax;
        p.vx = (ax || p.facing) * 3.4; p.vy = Input.axisY() * 2.2;
        if (f % 8 === 1) { swingT(p, (f / 8 | 0) % 2 ? 'a2' : 'a1', 1.8); Sfx.pplay('swing', 0.8, 1 + f * 0.004); }
        if (f % 6 === 0 && f < 58) {
          WS.area(p, p.x, p.y, 155, 62, WH.cyc, { hmax: 170 });
          FX.add('world', new Crescent(p.x, sy(p.y, p.z + 70), 120, f * 0.4, f * 0.4 + 2.6, { th: 26, life: 12, col: '255,120,30', core: '255,230,170', sy: 0.42 }));
        }
        if (f % 5 === 0 && f < 58) FX.add('ground', new WZone(p.x - p.facing * 20, p.y, {
          rx: 48, ry: 17, life: 150, every: 15, kind: 'fire',
          onTick: z => WS.area(p, z.x, z.y, z.rx, z.ry * 1.8, WH.fireTick, { hmax: 70, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.15 }) }),
        }));
      },
    },
  }, {
    name: '불새 강림', mp: 480, cd: 42, ico: ['bird', '255,120,30'], desc: '거대한 불새를 불러낸다. 불새가 화면을 가로지르며 모든 적을 여러 번 불태우고 끝에서 대폭발.',
    act: {
      anim: 'ultUp', len: 70, cancel: 50, atkCancel: 50,
      start(p) { WS.cutin(p, '불새 강림', '鳳 凰 降 臨', '255,110,30'); p.invul = 200; p.vx = 0; },
      update(p, f) {
        if (f === 2) { p.vz = 9; p.bladeGlow = 2; Sfx.play('charge'); }
        if (f === 14) {
          const r = Game.room, startX = p.facing > 0 ? Math.max(r.minX - 150, Game.cam.x - 150) : Math.min(r.maxX + 150, Game.cam.x + W + 150);
          FX.add('world', new WPhoenix(p, startX, clamp(p.y, 40, DEPTH - 40), p.facing));
          Sfx.play('roar', 0.8, 1.6); Sfx.wlayer('fire', 3, true); Game.flashScreen(0.4, '255,180,90');
        }
      },
    },
  }),

  // ----------------------------- 빙백검 프로스트 -----------------------------
  w2: ws({
    name: '빙결 감옥', mp: 150, cd: 8, ico: ['spikes', '170,230,255'], desc: '검을 꽂으면 얼음 가시가 앞으로 차례차례 솟구친다. 맞은 적은 띄워지고 얼어붙는다.',
    act: {
      anim: 'ebImpact', len: 50, cancel: 40, atkCancel: 40,
      start(p) { p.vx = 0; Sfx.pplay('swingBig'); p.bladeGlow = 1.2; },
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) { Hitfx.dust(p.x + p.facing * 40, sy(p.y, 0), 6, 30, '200,230,255'); Game.addShake(4); }
        for (let i = 0; i < 7; i++) if (f === 7 + i * 4) {
          const x = p.x + p.facing * (80 + i * 64);
          FX.add('world', new WSpike(x, p.y, 120 + i * 12));
          FX.add('ground', new Ring(x, sy(p.y, 0), 10, 70, 14, { col: '180,230,255', w: 6 }));
          WS.area(p, x, p.y, 58, 42, WH.spike, { each: e => Status.add(e, 'freeze', { t: 80 }) });
          Sfx.wlayer('ice', 1, false);
        }
      },
    },
  }, {
    name: '절대영도', mp: 480, cd: 42, ico: ['snow', '200,240,255'], desc: '세상을 얼려 화면 안의 모든 적을 빙결시킨 뒤, 일섬으로 한꺼번에 산산조각 낸다.',
    act: {
      anim: 'drawReady', len: 150, cancel: 140, atkCancel: 140,
      start(p) { WS.cutin(p, '절대영도', '絶 對 零 度', '150,220,255'); p.invul = 240; p.vx = 0; },
      update(p, f) {
        p.vx = 0; p.vy = 0; p.armorF = true;
        if (f === 2) {
          Game.flashScreen(1, '230,245,255'); Game.frostT = 150; Sfx.wlayer('ice', 3, true); Sfx.play('flash');
          p.zeroList = WS.onScreen();
          for (const e of p.zeroList) { Status.add(e, 'freeze', { t: 150 }); Status.add(e, 'slow', { t: 150, m: 0.2 }); }
        }
        if (f < 100 && f % 3 === 0) convergeMotes(p.x - p.facing * 20, sy(p.y, 70), 3, '200,240,255', 160);
        if (f === 104) {
          const r = Game.room, x0 = p.x, x1 = clamp(p.x + p.facing * 520, r.minX, r.maxX);
          p.x = x1; p.px = x1; p.play('drawFollow', 0, 1, true); p.bladeGlow = 2;
          FX.add('world', new FlashLine(x0, x1, sy(p.y, 76), 30, '200,240,255'));
          Sfx.play('flash'); Game.flashScreen(0.9, '255,255,255'); Game.addShake(8);
        }
        if (f === 120) {
          Sfx.play('sheath'); Game.slowmo(0.25, 40); Game.addShake(20);
          for (const e of (p.zeroList || [])) {
            if (!e.hittable() && !(e.holdT > 0)) continue;
            e.holdT = 0; e.holdKind = null; Status.release(e);
            FX.add('world', new Burst(e.x, sy(e.y, e.z + e.h * 0.5), { n: 14, r0: 14, r1: 120, life: 12, col: '210,240,255' }));
            if (e.hittable()) applyHit(p, e, WH.zero, { noStopAtt: true, dir: p.facing });
          }
          p.zeroList = null;
        }
      },
    },
  }),

  // ----------------------------- 뇌명도 천둥 -----------------------------
  w3: ws({
    name: '뇌전 섬광보', mp: 140, cd: 8, ico: ['zigzag', '255,240,110'], desc: '번개가 되어 가까운 적 최대 6명 사이를 순간이동하며 하나씩 꿰뚫는다.',
    act: {
      anim: 'a3', len: 60, cancel: 999, atkCancel: 999,
      start(p) {
        p.stepList = WS.nearest(p.x, p.y, 6, 650);
        p.stepEnd = 10 + p.stepList.length * 7;
        p.invul = Math.max(p.invul, p.stepEnd + 6);
        if (!p.stepList.length) { p.vx = p.facing * 14; }
      },
      update(p, f) {
        const L = p.stepList || [];
        if (!L.length) { p.vx *= 0.85; if (f > 16) p.actDone = true; return; }
        const i = Math.floor((f - 4) / 7);
        if (f >= 4 && (f - 4) % 7 === 0 && i < L.length) {
          const e = L[i];
          if (e.hittable()) {
            const ox = p.x, oy = p.y, d = sign(e.x - p.x) || p.facing;
            p.facing = d; p.x = p.px = clamp(e.x - d * 55, Game.room.minX, Game.room.maxX); p.y = e.y;
            FX.add('world', new Bolt(ox, sy(oy, 70), p.x, sy(p.y, 70), { life: 9, amp: 16, w: 3.6 }));
            p.afterOn = 4; swingT(p, i % 2 ? 'a2' : 'a1', 1.8);
            applyHit(p, e, WH.step, { noStopAtt: true, dir: d });
            Status.add(e, 'shock', { t: 30 });
            Sfx.wlayer('elec', 1, false); Sfx.pplay('swing', 0.8, 1.2);
          }
        }
        p.vx = 0; p.vy = 0;
        if (f >= p.stepEnd) p.actDone = true;
      },
    },
  }, {
    name: '천벌의 뇌우', mp: 480, cd: 42, ico: ['cloud', '255,240,110'], desc: '하늘을 먹구름으로 덮는다. 5초 동안 화면 안의 적에게 쉴 새 없이 낙뢰가 꽂힌다. 그동안 자유롭게 싸울 수 있다.',
    act: {
      anim: 'ultUp', len: 40, cancel: 30, atkCancel: 24,
      start(p) { WS.cutin(p, '천벌의 뇌우', '天 罰 雷 雨', '255,230,90'); p.invul = 120; p.vx = 0; },
      update(p, f) {
        if (f === 6) {
          FX.add('world', new Bolt(p.x, sy(0, 640), p.x, sy(p.y, p.z + 130), { life: 14, amp: 20, w: 6 }));
          Game.flashScreen(0.6, '255,250,210'); Sfx.wlayer('elec', 3, true); Sfx.play('explode', 0.6); p.bladeGlow = 2.5;
          FX.add('world', new WStorm(p));
        }
      },
    },
  }),

  // ----------------------------- 혈월도 크림슨 팡 -----------------------------
  w4: ws({
    name: '피의 계약', mp: 100, cd: 14, ico: ['drop', '255,40,70'], desc: '현재 HP의 12%를 바쳐 8초간 광란 : 피해 +40%, 모든 적중이 흡혈. 계약 순간 주변에 피의 폭발.',
    act: {
      anim: 'win', len: 34, cancel: 20, atkCancel: 18,
      start(p) { p.vx = 0; },
      update(p, f) {
        if (f === 8) {
          const cost = Math.floor(p.hp * 0.12);
          p.hp = Math.max(1, p.hp - cost);
          FX.add('top', new DmgText(p.x, sy(p.y, p.z) - 150, cost, 'p'));
          FX.add('top', new Label(p.x, sy(p.y, p.z) - 190, 'BLOOD PACT', { col: ['#ffe0e0', '#ff2a40'], size: 28, life: 60 }));
          p.bloodT = 480;
          FX.add('world', new Flash(p.x, sy(p.y, 70), 30, 260, 22, '255,30,60', 0.9));
          FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 230, 22, { col: '255,50,80', w: 14 }));
          for (let i = 0; i < 18; i++) FX.add('world', new Drop(p.x, p.y, 70, { vx: rand(-8, 8), vz: rand(4, 11), r: rand(2.5, 4), col: '#b01428', splat: true }));
          Sfx.wlayer('blood', 3, true); Game.addShake(8); Game.flashScreen(0.25, '255,40,60');
          WS.area(p, p.x, p.y, 190, 80, WH.bloodBurst);
        }
      },
    },
  }, {
    name: '진홍의 만월', mp: 480, cd: 42, ico: ['moonred', '255,40,70'], desc: '피의 줄로 화면 안의 모든 적과 연결해 2초 동안 생명력을 빨아들이고, 붉은 달이 터지며 마무리.',
    act: {
      anim: 'ultUp', len: 150, cancel: 145, atkCancel: 145,
      start(p) { WS.cutin(p, '진홍의 만월', '眞 紅 滿 月', '230,30,60'); p.invul = 220; p.vx = 0; p.gravOff = true; },
      update(p, f) {
        p.vx = 0; p.vy = 0; p.armorF = true; p.z = lerp(p.z, 70, 0.1);
        if (f === 2) { p.tether = WS.onScreen(); FX.add('world', new WTether(p, p.tether, 138)); Sfx.wlayer('blood', 2, false); }
        if (f >= 10 && f <= 130 && f % 10 === 0) {
          let heal = 0;
          for (const e of p.tether || []) {
            if (!e.hittable()) continue;
            heal += Gear.proc(p, e, 0.6, { quiet: true, hit: { dmg: 0.3, kx: 0, stun: 14 } });
            if (!e.isBoss) { e.x = lerp(e.x, p.x, 0.05); }
          }
          Gear.heal(p, Math.min(heal * 0.12, p.hpMax * 0.03), f % 30 !== 0);
          Sfx.wlayer('blood', 1, false);
        }
        if (f === 138) {
          p.gravOff = false;
          const gy = sy(p.y, 0);
          FX.add('world', new Flash(p.x, gy - 220, 60, 600, 30, '255,40,70', 1));
          FX.add('ground', new Ring(p.x, gy, 40, 700, 30, { col: '255,60,80', w: 22 }));
          Sfx.play('explode', 1.1); Game.addShake(20); Game.flashScreen(0.7, '255,60,80'); Game.zoomPunch(1.08);
          for (const e of p.tether || []) if (e.hittable()) applyHit(p, e, WH.bloodMoon, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
          p.tether = null;
        }
      },
      end(p) { p.gravOff = false; },
    },
  }),

  // ----------------------------- 대지분쇄검 그라바돈 -----------------------------
  w5: ws({
    name: '거인의 메치기', mp: 150, cd: 9, ico: ['fist', '230,190,120'], desc: '앞의 적을 붙잡아 머리 위로 들어 올린 뒤 땅에 내리꽂는다. 착지 지점에 충격파. (보스는 강타)',
    act: {
      anim: 'dashAtk', len: 60, cancel: 52, atkCancel: 52,
      start(p) { p.grab = null; Sfx.play('dash', 0.8); },
      update(p, f) {
        if (f < 9) p.vx = p.facing * 9; else p.vx *= 0.7;
        if (f === 8) {
          const c = Game.enemies.filter(e => e.hittable() && (e.x - p.x) * p.facing > -10 && Math.abs(e.x - p.x) < 170 && Math.abs(e.y - p.y) < 50).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
          if (c && !c.isBoss) { p.grab = c; c.interrupt(); Sfx.play('thud', 0.6, 1.4); swingT(p, 'upper', 1); }
          else if (c) { applyHit(p, c, WH.slam, { dir: p.facing }); p.actDone = true; }
        }
        const g = p.grab;
        if (g && f > 8 && f < 32) {
          if (!g.hittable() && !g.dying) { p.grab = null; return; }
          g.hitstop = 2; g.x = p.x + p.facing * 24; g.y = p.y; g.z = lerp(g.z, 170, 0.25); g.vx = g.vz = 0; g.state = 'air'; g.facing = -p.facing;
        }
        if (g && f === 32) {
          swingT(p, 'a4', 1.4); Sfx.pplay('swingBig');
          g.x = clamp(p.x + p.facing * 120, Game.room.minX, Game.room.maxX); g.z = 20; g.hitstop = 0;
          if (g.hittable()) applyHit(p, g, WH.slam, { dir: p.facing, hz: 40 });
          const x = g.x;
          FX.add('ground', new Ring(x, sy(p.y, 0), 20, 230, 24, { col: '230,190,120', w: 16 }));
          FX.add('ground', new Crack(x, p.y, 140));
          for (let i = 0; i < 18; i++) FX.add('world', new Debris(x, p.y, 4, { vx: rand(-8, 8), vz: rand(6, 14), s: rand(3, 7) }));
          Hitfx.dust(x, sy(p.y, 0), 12, 70); Sfx.play('quake', 0.9); Game.addShake(16);
          WS.area(p, x, p.y, 200, 80, WH.slamWave, { skip: e => e === g });
          p.grab = null;
        }
        if (!g && f === 30 && !p.actDone) { WS.area(p, p.x + p.facing * 90, p.y, 120, 50, WH.slamWave); Game.addShake(6); }
      },
      end(p) { if (p.grab) { p.grab.hitstop = 0; p.grab = null; } },
    },
  }, {
    name: '산맥 붕괴', mp: 480, cd: 42, ico: ['mountain', '230,190,120'], desc: '땅을 내리치면 바위 기둥이 앞쪽으로 줄지어 솟아 적을 띄우고, 거대한 바위가 떨어져 모두 짓뭉갠다.',
    act: {
      anim: 'ebImpact', len: 110, cancel: 100, atkCancel: 100,
      start(p) { WS.cutin(p, '산맥 붕괴', '山 脈 崩 壞', '210,170,110'); p.invul = 180; p.vx = 0; },
      update(p, f) {
        p.vx = 0; p.armorF = true;
        if (f === 3) { Sfx.play('quake'); Game.addShake(12); Hitfx.dust(p.x, sy(p.y, 0), 14, 90); }
        for (let i = 0; i < 9; i++) if (f === 6 + i * 5) {
          const x = p.x + p.facing * (90 + i * 85);
          for (const dy of [-50, 0, 50]) {
            const y = clamp(p.y + dy, 0, DEPTH);
            FX.add('world', new Pillar(x + rand(-14, 14), y, 34, 170 + rand(0, 80), 30, '150,120,90', '210,190,160'));
          }
          for (let k = 0; k < 8; k++) FX.add('world', new Debris(x, p.y, 4, { vx: rand(-4, 4), vz: rand(8, 15), s: rand(3, 7) }));
          WS.area(p, x, p.y, 70, 90, WH.rock); Sfx.play('thud', 0.8); Game.addShake(5);
        }
        if (f === 62) {
          const alive = WS.onScreen(), cx = alive.length ? alive.reduce((s, e) => s + e.x, 0) / alive.length : p.x + p.facing * 300;
          FX.add('world', new Meteor(cx, p.y, {
            col: '200,170,130', dur: 26, r: 70, from: p.facing * -200, onEnd: m => {
              const gy = sy(m.y, 0);
              FX.add('world', new Flash(m.x, gy - 40, 40, 380, 26, '230,200,160', 0.9));
              FX.add('ground', new Ring(m.x, gy, 30, 420, 30, { col: '230,190,140', w: 22 }));
              FX.add('ground', new Crack(m.x, m.y, 220));
              for (let k = 0; k < 30; k++) FX.add('world', new Debris(m.x + rand(-80, 80), m.y, 6, { vx: rand(-10, 10), vz: rand(8, 18), s: rand(4, 10) }));
              Sfx.play('quake', 1.2); Game.addShake(24); Game.zoomPunch(1.1); Game.flashScreen(0.4, '255,230,200');
              WS.area(p, m.x, m.y, 320, 140, WH.boulder);
            },
          }));
        }
      },
    },
  }),

  // ----------------------------- 질풍검 바람가르기 -----------------------------
  w6: ws({
    name: '진공 부메랑', mp: 120, cd: 7, ico: ['boomerang', '180,255,215'], desc: '진공 칼날 3개를 던진다. 칼날은 적을 관통하며 날아갔다가 다시 손으로 돌아오며 한 번 더 벤다.',
    act: {
      anim: 'a2', len: 26, cancel: 14, atkCancel: 12,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 6) {
          Sfx.pplay('swingBig'); Sfx.wlayer('wind', 2, false);
          for (const vy of [-2.2, 0, 2.2]) FX.add('world', new WShot(p, p.x + p.facing * 40, p.y, p.z + 70, p.facing * 15, vy, 0, {
            style: 'wind', col: '190,255,225', r: 30, life: 120, pierce: true, ret: 360, hd: WH.vac, floor: true,
          }));
        }
      },
    },
  }, {
    name: '천풍참', mp: 480, cd: 42, ico: ['tornado', '180,255,215'], desc: '거대한 회오리를 일으킨다. 회오리는 천천히 전진하며 적을 빨아올려 공중에 가두고 계속 베다가 하늘로 날려버린다.',
    act: {
      anim: 'upper', len: 46, cancel: 36, atkCancel: 30,
      start(p) { WS.cutin(p, '천풍참', '天 風 斬', '160,255,200'); p.invul = 120; p.vx = 0; },
      update(p, f) {
        if (f === 8) { Sfx.pplay('swingBig'); p.bladeGlow = 2; }
        if (f === 12) { FX.add('world', new WTornado(p, p.x + p.facing * 130, p.y, p.facing)); Sfx.wlayer('wind', 3, true); Game.addShake(8); }
      },
    },
  }),

  // ----------------------------- 맹독검 베놈 팽 -----------------------------
  w7: ws({
    name: '독사 소환', mp: 130, cd: 8, ico: ['snake', '140,235,80'], desc: '독사 세 마리를 풀어놓는다. 뱀은 땅을 기어 적을 쫓아가 물고, 독을 최대치까지 중첩시킨다.',
    act: {
      anim: 'a3', len: 30, cancel: 18, atkCancel: 16,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 7) {
          Sfx.wlayer('poison', 2, false);
          for (let i = 0; i < 3; i++) FX.add('world', new WShot(p, p.x + p.facing * 30, p.y + (i - 1) * 20, 6, p.facing * 7.5, (i - 1) * 1.5, 0, {
            style: 'snake', col: '140,235,80', r: 22, life: 170, home: 0.11, hd: WH.bite, floor: true,
            onHit: (s, e) => { Status.add(e, 'poison', { t: 300, d: p.atk * 0.1, n: 5, max: 5 }); FX.add('world', new Flash(e.x, sy(e.y, 30), 10, 70, 12, '140,235,80', 0.8)); },
          }));
        }
      },
    },
  }, {
    name: '역병의 늪', mp: 480, cd: 42, ico: ['swamp', '140,235,80'], desc: '발밑에 거대한 독늪을 7초간 펼친다. 늪 안의 적은 크게 느려지고 독에 잠기며, 독거품이 수시로 터진다.',
    act: {
      anim: 'ebImpact', len: 50, cancel: 36, atkCancel: 30,
      start(p) { WS.cutin(p, '역병의 늪', '疫 病 沼', '120,230,70'); p.invul = 120; p.vx = 0; },
      update(p, f) {
        if (f === 10) {
          Sfx.wlayer('poison', 3, true); Sfx.play('quake', 0.6); Game.addShake(8);
          FX.add('ground', new WZone(p.x, p.y, {
            rx: 360, ry: 130, life: 420, every: 18, kind: 'swamp',
            onTick: z => {
              WS.area(p, z.x, z.y, z.rx, z.ry, WH.swampTick, { hmax: 90, each: e => { Status.add(e, 'poison', { t: 120, d: p.atk * 0.08, n: 1 }); Status.add(e, 'slow', { t: 30, m: 0.35 }); } });
              const bx = z.x + rand(-z.rx * 0.8, z.rx * 0.8), by = clamp(z.y + rand(-z.ry * 0.7, z.ry * 0.7), 0, DEPTH);
              FX.add('world', new Flash(bx, sy(by, 20), 10, 80, 14, '150,255,90', 0.8));
              for (let k = 0; k < 6; k++) FX.add('world', new Drop(bx, by, 10, { vx: rand(-3, 3), vz: rand(4, 9), r: 3, col: '#7ad040' }));
              WS.area(p, bx, by, 70, 34, WH.bubble);
            },
          }));
        }
      },
    },
  }),

  // ----------------------------- 성검 루미나스 -----------------------------
  w8: ws({
    name: '성스러운 반격', mp: 110, cd: 8, ico: ['shield', '255,235,150'], desc: '1초간 빛의 방패를 세운다. 그 사이 공격을 받으면 피해를 무효화하고 주변 모든 적에게 성광 반격 + HP 5% 회복.',
    act: {
      anim: 'drawReady', len: 70, cancel: 66, atkCancel: 66,
      start(p) { p.guardT = 62; p.vx = 0; Sfx.wlayer('holy', 1, false); },
      update(p, f) {
        p.vx = 0; p.vy = 0;
        if (f === 62 && p.guardT >= 0) {
          WS.area(p, p.x, p.y, 160, 70, WH.holyWave);
          FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 170, 18, { col: '255,240,170', w: 8 }));
        }
      },
      end(p) { p.guardT = 0; },
    },
  }, {
    name: '심판의 검', mp: 480, cd: 42, ico: ['bigsword', '255,235,150'], desc: '적이 가장 많이 모인 곳에 하늘에서 거대한 성검이 떨어진다. 넓은 범위 대미지 + HP 25% 회복.',
    act: {
      anim: 'ultUp', len: 80, cancel: 70, atkCancel: 66,
      start(p) { WS.cutin(p, '심판의 검', '審 判 의 劍', '255,230,140'); p.invul = 160; p.vx = 0; },
      update(p, f) {
        if (f === 4) {
          const list = WS.onScreen();
          let best = null, bn = -1;
          for (const e of list) { const n = list.filter(o => Math.abs(o.x - e.x) < 260).length; if (n > bn) { bn = n; best = e; } }
          const x = best ? best.x : p.x + p.facing * 260, y = best ? best.y : p.y;
          Sfx.play('charge'); p.bladeGlow = 2;
          FX.add('world', new WBigBlade(x, y, {
            kind: 'sword', dur: 34, onImpact: b => {
              const gy = sy(b.y, 0);
              FX.add('world', new Flash(b.x, gy - 60, 60, 520, 30, '255,240,170', 1));
              FX.add('world', new Pillar(b.x, b.y, 120, 600, 36, '255,230,140', '255,255,240'));
              FX.add('ground', new Ring(b.x, gy, 40, 520, 30, { col: '255,240,170', w: 22 }));
              Sfx.play('explode', 1.1); Sfx.wlayer('holy', 3, true); Game.addShake(22); Game.flashScreen(0.7, '255,250,220'); Game.zoomPunch(1.08);
              WS.area(p, b.x, b.y, 320, 130, WH.judgment);
              Gear.heal(p, p.hpMax * 0.25);
            },
          }));
        }
      },
    },
  }),

  // ----------------------------- 공허의 낫 보이드리퍼 -----------------------------
  w9: ws({
    name: '공허의 문', mp: 160, cd: 10, ico: ['portal', '190,100,255'], desc: '앞에 공허의 문을 열어 근처 적을 빨아들인다. 하늘에 열린 출구에서 떨어진 적은 바닥에 처박힌다. (보스는 강타)',
    act: {
      anim: 'a4', len: 66, cancel: 56, atkCancel: 52,
      start(p) { p.vgate = []; p.vx = 0; },
      update(p, f) {
        p.vx *= 0.7;
        const ax = p.x + p.facing * 140;
        if (f === 6) { FX.add('world', new WPortal(ax, p.y, 70, 30)); Sfx.wlayer('void', 2, false); }
        if (f >= 6 && f < 20) {
          for (const e of Game.enemies) {
            if (!e.hittable() || Math.abs(e.x - ax) > 250 || Math.abs(e.y - p.y) > 90) continue;
            if (e.isBoss) { if (f === 16) applyHit(p, e, WH.voidDrop, { noStopAtt: true }); continue; }
            e.x = lerp(e.x, ax, 0.25); e.y = lerp(e.y, p.y, 0.2); e.hitstop = 2;
            if (f === 18 && !p.vgate.includes(e)) p.vgate.push(e);
          }
        }
        if (f === 20) for (const e of p.vgate) { e.alpha = 0; e.hitstop = 30; e.interrupt(); }
        if (f === 30) FX.add('world', new WPortal(p.x + p.facing * 260, p.y, 300, 36));
        if (f === 44) {
          for (const e of p.vgate) {
            if (e.dead) continue;
            e.alpha = 1; e.hitstop = 0; e.x = clamp(p.x + p.facing * 260 + rand(-40, 40), Game.room.minX, Game.room.maxX); e.z = 290; e.state = 'air'; e.bounced = false;
            if (e.hittable()) applyHit(p, e, WH.voidDrop, { noStopAtt: true, dir: p.facing });
            e.vz = -16; e.vx = 0;
          }
          Sfx.wlayer('void', 3, true); Game.addShake(6);
        }
      },
      end(p) { for (const e of p.vgate || []) { if (e.alpha === 0) e.alpha = 1; e.hitstop = 0; } p.vgate = []; },
    },
  }, {
    name: '사신의 궤도', mp: 480, cd: 42, ico: ['orbit', '190,100,255'], desc: '사신의 낫 세 자루가 6초 동안 내 주위를 돌며 닿는 적을 계속 베어낸다. 그동안 자유롭게 움직일 수 있다.',
    act: {
      anim: 'win', len: 34, cancel: 20, atkCancel: 16,
      start(p) { WS.cutin(p, '사신의 궤도', '死 神 軌 道', '170,80,255'); p.invul = 90; p.vx = 0; },
      update(p, f) { if (f === 6) { FX.add('world', new WOrbit(p)); Sfx.wlayer('void', 3, true); Game.addShake(6); } },
    },
  }),

  // ----------------------------- 용암대검 마그마 크러셔 -----------------------------
  w10: ws({
    name: '용암 간헐천', mp: 150, cd: 9, ico: ['geyser', '255,110,30'], desc: '검을 땅에 꽂으면 근처 적 최대 4명의 발밑이 끓어오른다. 잠시 뒤 용암이 분출해 높이 띄우고 용암 웅덩이를 남긴다.',
    act: {
      anim: 'ebImpact', len: 44, cancel: 32, atkCancel: 28,
      start(p) { p.vx = 0; Sfx.pplay('swingBig'); },
      update(p, f) {
        p.vx = 0;
        if (f === 6) {
          Game.addShake(5); Sfx.play('thud', 0.8);
          let list = WS.nearest(p.x, p.y, 4, 620).map(e => [e.x, e.y]);
          if (!list.length) list = [[p.x + p.facing * 160, p.y], [p.x + p.facing * 280, p.y]];
          list.forEach(([x, y], i) => FX.add('ground', new Telegraph(x, y, 72, 26, 24 + i * 5, {
            col: '255,110,30', onEnd: tg => {
              FX.add('world', new Pillar(tg.x, tg.y, 62, 380, 30, '255,90,20', '255,220,140'));
              for (let k = 0; k < 10; k++) FX.add('world', new Debris(tg.x, tg.y, 4, { vx: rand(-4, 4), vz: rand(8, 16), s: rand(3, 5), col: ['#2a1612', '#5a2a18', '#ff8a30'], glow: '255,120,30' }));
              Sfx.wlayer('magma', 2, false); Game.addShake(6);
              WS.area(p, tg.x, tg.y, 74, 34, WH.geyser, { each: e => Status.add(e, 'burn', { t: 180, d: p.atk * 0.3 }) });
              FX.add('ground', new WZone(tg.x, tg.y, { rx: 64, ry: 22, life: 180, every: 20, kind: 'lava', onTick: z => WS.area(p, z.x, z.y, z.rx, z.ry * 1.6, WH.fireTick, { hmax: 60 }) }));
            },
          })));
        }
      },
    },
  }, {
    name: '용암 해일', mp: 480, cd: 42, ico: ['wave', '255,110,30'], desc: '등 뒤에서 용암의 해일이 몰려와 화면을 가로지른다. 휩쓸린 적은 벽까지 밀려가 처박힌다.',
    act: {
      anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
      start(p) { WS.cutin(p, '용암 해일', '熔 岩 海 溢', '255,100,20'); p.invul = 150; p.vx = 0; },
      update(p, f) {
        if (f === 10) {
          const r = Game.room, x0 = p.facing > 0 ? Math.max(r.minX - 80, Game.cam.x - 120) : Math.min(r.maxX + 80, Game.cam.x + W + 120);
          FX.add('world', new WWave(p, x0, p.y, p.facing));
          Sfx.play('quake', 1); Sfx.wlayer('magma', 3, true); Game.flashScreen(0.4, '255,150,60');
        }
        if (f === 12) swingT(p, 'a4', 1);
      },
    },
  }),

  // ----------------------------- 태엽검 크로노스 -----------------------------
  w11: ws({
    name: '시간 가속', mp: 120, cd: 16, ico: ['hourglass', '160,225,255'], desc: '6초 동안 나만의 시간이 1.5배로 흐른다. 이동·공격·스킬 동작이 모두 빨라진다.',
    act: {
      anim: 'win', len: 24, cancel: 12, atkCancel: 10,
      start(p) { p.vx = 0; },
      update(p, f) {
        if (f === 4) {
          p.hasteT = 360;
          FX.add('top', new Label(p.x, sy(p.y, p.z) - 180, 'HASTE', { col: ['#ffffff', '#6fd0ff'], size: 30, life: 60 }));
          FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 220, 22, { col: '160,225,255', w: 10 }));
          Sfx.wlayer('clock', 3, true);
        }
      },
    },
  }, {
    name: '크로노 브레이크', mp: 480, cd: 45, ico: ['clock', '160,225,255'], desc: '4.5초 동안 시간을 멈춘다. 나만 움직일 수 있고, 멈춘 동안 넣은 피해의 60%가 시간이 다시 흐를 때 한꺼번에 추가로 터진다.',
    act: {
      anim: 'win', len: 24, cancel: 10, atkCancel: 8,
      start(p) { WS.cutin(p, '크로노 브레이크', 'CHRONO BREAK', '140,210,255'); p.vx = 0; },
      update(p, f) {
        if (f === 2) {
          Game.tstopT = 270; p.invul = Math.max(p.invul, 280);
          for (const e of Game.enemies) e.tsStore = 0;
          Game.flashScreen(0.6, '200,230,255'); Sfx.wlayer('clock', 3, true); Sfx.play('flash');
        }
      },
    },
  }),

  // ----------------------------- 처형검 데스 헤럴드 -----------------------------
  w12: ws({
    name: '단두대', mp: 140, cd: 9, ico: ['guillotine', '230,50,80'], desc: '가장 약해진 적 머리 위로 단두대 칼날이 떨어진다. 체력 40% 미만이면 즉사(보스 제외), 아니면 큰 피해.',
    act: {
      anim: 'drawReady', len: 50, cancel: 40, atkCancel: 36,
      start(p) { p.vx = 0; },
      update(p, f) {
        p.vx = 0;
        if (f === 4) {
          const list = WS.nearest(p.x, p.y, 99, 560);
          const t = list.sort((a, b) => (a.isBoss - b.isBoss) || (a.hp / a.hpMax - b.hp / b.hpMax))[0];
          const x = t ? t.x : p.x + p.facing * 200, y = t ? t.y : p.y;
          Sfx.play('sheath');
          FX.add('world', new WBigBlade(x, y, {
            kind: 'guillotine', dur: 26, follow: t, onImpact: b => {
              const gy = sy(b.y, 0);
              Sfx.wlayer('exec', 3, true); Game.addShake(14); Game.freeze(4);
              FX.add('world', new Flash(b.x, gy - 60, 30, 260, 20, '255,60,80', 0.9));
              for (let k = 0; k < 16; k++) FX.add('world', new Drop(b.x, b.y, 60, { vx: rand(-7, 7), vz: rand(3, 10), r: rand(2.5, 4), col: '#9a1022', splat: true }));
              if (t && t.hittable()) {
                if (!t.isBoss && t.hp / t.hpMax < 0.4) {
                  FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 60, 'EXECUTE', { col: ['#ffe0e0', '#ff3a50'], size: 30, life: 60 }));
                  Status.dot(t, t.hp + 1, '255,60,80');
                } else applyHit(p, t, WH.guillo, { noStopAtt: true, dir: p.facing });
              }
              WS.area(p, b.x, b.y, 150, 60, WH.guilloSplash, { skip: e => e === t });
            },
          }));
        }
      },
    },
  }, {
    name: '망자의 행진', mp: 480, cd: 42, ico: ['helmet', '140,255,210'], desc: '망자의 기사 다섯이 등 뒤에서 나타나 화면 끝까지 행진하며 앞을 막는 모든 적을 베어 넘긴다.',
    act: {
      anim: 'win', len: 40, cancel: 28, atkCancel: 24,
      start(p) { WS.cutin(p, '망자의 행진', '亡 者 行 進', '120,255,200'); p.invul = 120; p.vx = 0; },
      update(p, f) {
        if (f === 6) {
          const x0 = p.x - p.facing * 240;
          for (let i = 0; i < 5; i++) FX.add('world', new WMarcher(p, x0 - p.facing * (i % 2) * 60, clamp(14 + i * 50, 0, DEPTH), p.facing, i * 5));
          Sfx.play('roar', 0.5, 0.8); Sfx.wlayer('exec', 2, false); Game.addShake(6);
        }
      },
    },
  }),

  // ----------------------------- 월광검 루나 이클립스 -----------------------------
  w13: ws({
    name: '분열 초승달', mp: 130, cd: 8, ico: ['crescent', '200,220,255'], desc: '거대한 초승달을 던진다. 천천히 날아가며 여러 번 베고, 끝에 닿으면 작은 초승달 여섯 개로 갈라져 사방으로 흩어진다.',
    act: {
      anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 7) {
          Sfx.pplay('swingBig'); Sfx.wlayer('moon', 2, false);
          FX.add('world', new WShot(p, p.x + p.facing * 50, p.y, p.z + 70, p.facing * 8.5, 0, 0, {
            style: 'crescent', col: '190,215,255', r: 62, life: 48, pierce: true, rehit: 10, hd: WH.cres, floor: true,
            onEnd: s => {
              Sfx.wlayer('moon', 2, true);
              for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; FX.add('world', new WShot(p, s.x, s.y, s.z, Math.cos(a) * 11, Math.sin(a) * 4, 0, { style: 'crescent', col: '220,230,255', r: 26, life: 26, pierce: true, hd: WH.cresSmall, floor: true })); }
            },
          }));
        }
      },
    },
  }, {
    name: '월식', mp: 480, cd: 42, ico: ['eclipse', '200,220,255'], desc: '6초 동안 달이 해를 가린다. 어둠 속에서 적은 길을 잃어 공격하지 못하고, 내 공격은 전부 치명타(피해 +60%)가 되어 월광이 내리꽂힌다.',
    act: {
      anim: 'win', len: 30, cancel: 16, atkCancel: 14,
      start(p) { WS.cutin(p, '월식', '月 蝕', '170,190,255'); p.vx = 0; },
      update(p, f) {
        if (f === 4) {
          Game.eclipseT = 360; Game.flashScreen(0.5, '30,30,60'); Sfx.wlayer('moon', 3, true);
          for (const e of Game.enemies) if (e.act && !e.isBoss) e.interrupt();
        }
      },
    },
  }),

  // ----------------------------- 유성검 스타폴 -----------------------------
  w14: ws({
    name: '별자리 폭발', mp: 150, cd: 9, ico: ['constellation', '255,236,150'], desc: '근처 적 최대 7명에게 별을 새기고 선으로 이어 별자리를 만든다. 별자리가 완성되면 이은 별의 수만큼 강해진 폭발.',
    act: {
      anim: 'ultUp', len: 64, cancel: 58, atkCancel: 56,
      start(p) { p.vx = 0; p.stars = WS.nearest(p.x, p.y, 7, 650); },
      update(p, f) {
        p.vx = 0;
        if (f === 4 && p.stars.length) { FX.add('top', new WLinks(p.stars, 50)); Sfx.wlayer('star', 2, false); }
        if (f === 52) {
          const n = p.stars.length;
          if (!n) { WS.area(p, p.x + p.facing * 120, p.y, 140, 60, WH.meteor); return; }
          const hd = WS.hd({ dmg: 2.5 + n * 0.75, kx: 4, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.8 });
          for (const e of p.stars) if (e.hittable()) {
            FX.add('world', new Glint(e.x, sy(e.y, e.z + e.h * 0.6), 60));
            FX.add('world', new Flash(e.x, sy(e.y, e.z + e.h * 0.6), 20, 160, 18, '255,236,150', 0.9));
            applyHit(p, e, hd, { noStopAtt: true });
          }
          Sfx.wlayer('star', 3, true); Sfx.play('explode', 0.6); Game.addShake(10); Game.flashScreen(0.2, '255,245,200');
          p.stars = [];
        }
      },
    },
  }, {
    name: '유성우', mp: 480, cd: 42, ico: ['meteors', '255,236,150'], desc: '3초 동안 하늘에서 별똥별 수십 개가 화면 안의 적에게 쏟아진다.',
    act: {
      anim: 'ultUp', len: 40, cancel: 26, atkCancel: 22,
      start(p) { WS.cutin(p, '유성우', '流 星 雨', '255,226,130'); p.invul = 120; p.vx = 0; },
      update(p, f) {
        if (f === 6) {
          Sfx.wlayer('star', 3, true); Game.flashScreen(0.3, '255,245,200');
          FX.add('world', new WShower(p, 180, 5, () => {
            const list = WS.onScreen(), e = list.length && chance(0.75) ? choose(list) : null;
            const x = e ? e.x + rand(-30, 30) : Game.cam.x + rand(80, W - 80), y = e ? e.y : rand(10, DEPTH - 10);
            FX.add('world', new Meteor(x, y, {
              col: '255,226,130', dur: 14, r: 20, from: rand(-200, 300), onEnd: m => {
                FX.add('world', new Flash(m.x, sy(m.y, 10), 14, 140, 14, '255,226,130', 0.9));
                FX.add('ground', new Ring(m.x, sy(m.y, 0), 10, 110, 14, { col: '255,236,150', w: 7 }));
                Sfx.wlayer('star', 1, false); Game.addShake(3);
                WS.area(p, m.x, m.y, 92, 44, WH.meteor);
              },
            }));
          }));
        }
      },
    },
  }),

  // ----------------------------- 암살검 쉐도우팽 -----------------------------
  w15: ws({
    name: '그림자 습격', mp: 110, cd: 7, ico: ['dagger', '150,100,235'], desc: '그림자에 녹아 사라졌다가 앞쪽 가장 먼 적의 등 뒤에서 나타나 확정 치명타 기습. 맞은 적은 오래 기절한다.',
    act: {
      anim: 'back', len: 42, cancel: 30, atkCancel: 26,
      start(p) {
        const list = Game.enemies.filter(e => e.hittable() && (e.x - p.x) * p.facing > 0 && Math.abs(e.x - p.x) < 650);
        p.ambush = list.sort((a, b) => Math.abs(b.x - p.x) - Math.abs(a.x - p.x))[0] || WS.nearest(p.x, p.y, 1, 650)[0] || null;
        p.invul = Math.max(p.invul, 30); p.vx = 0;
        for (let i = 0; i < 14; i++) FX.add('world', new Mote(p.x + rand(-20, 20), sy(p.y, rand(0, 120)), rand(-1, 1), rand(-2, 0), { col: '120,80,200', life: 30, r: rand(8, 14) }));
        Sfx.wlayer('shadow', 2, false);
      },
      update(p, f) {
        p.vx = 0;
        if (f === 2) p.visible = false;
        const t = p.ambush;
        if (f === 12) {
          if (t && t.hittable()) { const d = sign(t.x - p.x) || p.facing; p.x = p.px = clamp(t.x + d * 62, Game.room.minX, Game.room.maxX); p.y = t.y; p.facing = -d; }
          else p.x = clamp(p.x + p.facing * 200, Game.room.minX, Game.room.maxX);
          p.visible = true; swingT(p, 'a3', 1.3);
          for (let i = 0; i < 10; i++) FX.add('world', new Mote(p.x + rand(-20, 20), sy(p.y, rand(0, 120)), rand(-1, 1), rand(-2, 0), { col: '120,80,200', life: 24, r: rand(8, 12) }));
        }
        if (f === 16 && t && t.hittable()) {
          applyHit(p, t, WH.backstab, { dir: p.facing });
          Status.add(t, 'shock', { t: 50 });
          FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 60, 'BACKSTAB', { col: ['#f0e0ff', '#9a6aff'], size: 26 }));
          Sfx.wlayer('shadow', 3, true);
        }
      },
      end(p) { p.visible = true; },
    },
  }, {
    name: '천의 그림자', mp: 480, cd: 42, ico: ['clones', '150,100,235'], desc: '7초 동안 그림자 분신 넷이 내 곁에 선다. 내가 적을 벨 때마다 분신들이 같은 적을 따라 벤다.',
    act: {
      anim: 'win', len: 30, cancel: 14, atkCancel: 12,
      start(p) { WS.cutin(p, '천의 그림자', '千 影', '140,90,230'); p.vx = 0; },
      update(p, f) {
        if (f === 4) {
          p.cloneT = 420; Sfx.wlayer('shadow', 3, true);
          for (let i = 0; i < 20; i++) FX.add('world', new Mote(p.x + rand(-80, 80), sy(p.y, rand(0, 140)), rand(-1, 1), rand(-2, 0), { col: '130,90,220', life: 34, r: rand(8, 14) }));
        }
      },
    },
  }),

  // ----------------------------- 천공의 성검 세라핌 -----------------------------
  w16: ws({
    name: '천사의 비상', mp: 150, cd: 10, ico: ['feather', '255,250,225'], desc: '3초 동안 날아올라 공중에 머물며 이동한다. 그동안 아래의 적들에게 깃털 화살이 자동으로 쏟아진다.',
    act: {
      anim: 'air', len: 180, cancel: 170, atkCancel: 999,
      start(p) { p.gravOff = true; p.armorF = true; Sfx.wlayer('wing', 3, true); Sfx.play('jump'); },
      update(p, f) {
        p.armorF = true;
        p.z = f < 160 ? lerp(p.z, 150, 0.12) : p.z;
        p.vz = 0;
        const ax = Input.axisX(); if (ax) p.facing = ax;
        p.vx = ax * 4.2; p.vy = Input.axisY() * 2.6;
        if (f % 4 === 0) FX.add('world', new Mote(p.x + rand(-30, 30), sy(p.y, p.z + rand(30, 110)), rand(-1, 1), rand(-0.5, 0.5), { col: '255,255,240', life: 40, r: 6, grav: 0.05 }));
        if (f >= 14 && f <= 160 && f % 7 === 0) {
          const t = WS.nearest(p.x, p.y, 1, 600)[0];
          const tx = t ? t.x : p.x + p.facing * 200, ty = t ? t.y : p.y, tz = t ? t.z + t.h * 0.5 : 0, T = 14;
          FX.add('world', new WShot(p, p.x, p.y, p.z + 80, (tx - p.x) / T, (ty - p.y) / T, (tz - p.z - 80) / T, { style: 'feather', col: '255,250,225', r: 20, life: 30, hd: WH.feather }));
          if (f % 21 === 0) Sfx.wlayer('wing', 0, false);
        }
        if (f === 160) { p.gravOff = false; }
      },
      end(p) { p.gravOff = false; },
      noAirEnd: true,
    },
  }, {
    name: '대천사 강림', mp: 480, cd: 45, ico: ['angel', '255,250,225'], desc: '7초 동안 대천사가 된다. 거대한 날개가 돋고 모든 피해를 받지 않으며 HP가 계속 회복되고, 0.8초마다 성광의 고리가 주변 적을 밀어낸다.',
    act: {
      anim: 'win', len: 34, cancel: 16, atkCancel: 14,
      start(p) { WS.cutin(p, '대천사 강림', '大 天 使 降 臨', '255,240,190'); p.vx = 0; },
      update(p, f) {
        if (f === 4) {
          p.angelT = 420; Sfx.wlayer('holy', 3, true); Sfx.play('clear', 0.6);
          FX.add('world', new Pillar(p.x, p.y, 120, 700, 40, '255,240,190', '255,255,255'));
          Game.flashScreen(0.6, '255,250,230');
        }
      },
    },
  }),

  // ----------------------------- 마검 카오스 엣지 -----------------------------
  w17: ws({
    name: '혼돈의 균열', mp: 160, cd: 10, ico: ['rift', '255,90,200'], desc: '허공에 균열을 연다. 균열은 3초 동안 불기둥·얼음 가시·낙뢰·공허 흡인·독 폭발 중 무작위 주문을 적에게 퍼붓는다.',
    act: {
      anim: 'a4', len: 30, cancel: 18, atkCancel: 16,
      update(p, f) {
        p.vx *= 0.6;
        if (f === 9) { FX.add('world', new WRift(p, p.x + p.facing * 150, p.y)); Sfx.wlayer('chaos', 3, true); Game.addShake(5); }
      },
    },
  }, {
    name: '종말의 검', mp: 480, cd: 45, ico: ['shatter', '255,90,200'], desc: '세상 자체를 벤다. 화면 전체를 가르는 참격이 열두 번 휘몰아쳐 화면에 금이 가고, 마지막에 화면이 산산조각 나며 모든 적이 함께 부서진다.',
    act: {
      anim: 'ultUp', len: 110, cancel: 104, atkCancel: 104,
      start(p) { WS.cutin(p, '종말의 검', '終 末 의 劍', '255,80,200'); p.invul = 200; p.vx = 0; Game.crack = { t: 999, lines: [] }; },
      update(p, f) {
        p.vx = 0; p.armorF = true;
        if (f >= 4 && f <= 70 && f % 6 === 4) {
          const cx = Game.cam.x + W / 2, cy = sy(DEPTH / 2, 120), ang = rand(0, Math.PI);
          const hcol = hslRgb(rand(0, 360), 0.9, 0.65).join(',');
          FX.add('world', new CutLine(cx + rand(-200, 200), cy + rand(-100, 100), ang, 900, 12, hcol, 16));
          swingT(p, (f / 6 | 0) % 2 ? 'a2' : 'a1', 2);
          Sfx.pplay('swingBig'); Sfx.wlayer('chaos', 2, false); Game.addShake(6); Game.flashScreen(0.12, hcol);
          for (const e of WS.onScreen()) applyHit(p, e, WH.endSlash, { noStopAtt: true });
          // 화면에 금이 간다 (화면 좌표)
          const x0 = rand(100, W - 100), y0 = rand(80, H - 200), L = [[x0, y0]];
          let x = x0, y = y0; for (let k = 0; k < 6; k++) { x += rand(-90, 90); y += rand(-60, 60); L.push([x, y]); }
          Game.crack.lines.push(L);
        }
        if (f === 86) {
          FX.add('top', new WShards());
          Game.crack = { t: 10, lines: Game.crack ? Game.crack.lines : [] };
          Sfx.play('explode', 1.2); Sfx.play('flash'); Sfx.wlayer('chaos', 3, true);
          Game.flashScreen(1, '255,255,255'); Game.addShake(24); Game.slowmo(0.25, 50); Game.zoomPunch(1.1);
          for (const e of WS.onScreen()) applyHit(p, e, WH.endFinal, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
        }
      },
      end() { if (Game.crack && Game.crack.t > 10) Game.crack.t = 10; },
    },
  }),
};

// 검에 스킬 연결 + 공통 속성
for (const id in WSK) {
  const W0 = WEAPON_BY_ID[id];
  if (!W0) continue;
  W0.skills = WSK[id];
  for (const k of ['s5', 's6']) {
    const s = WSK[id][k];
    s.icon = 'ws_' + id + '_' + k;
    s.act.isSkill = true; s.act.name = id + k;
  }
}

// ---------- 스킬 아이콘 그림 ----------
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
    case 'spin': for (let i = 0; i < 3; i++) line(() => g.arc(24, 26, 8 + i * 6, i * 2, i * 2 + 4.2), 2.2); break;
    case 'bird':
      fill(() => { g.moveTo(8, 30); g.quadraticCurveTo(18, 6, 40, 10); g.quadraticCurveTo(26, 18, 30, 30); g.quadraticCurveTo(20, 24, 8, 30); });
      fill(() => { g.ellipse(30, 30, 10, 5, -0.3, 0, TAU); }, 0.9); fill(() => { g.moveTo(22, 32); g.lineTo(6, 42); g.lineTo(18, 36); }, 0.8); break;
    case 'spikes': for (let i = 0; i < 4; i++) fill(() => { g.moveTo(6 + i * 10, 42); g.lineTo(11 + i * 10, 34 - i * 7); g.lineTo(16 + i * 10, 42); }); break;
    case 'snow': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(() => { g.moveTo(24, 24); g.lineTo(24 + Math.cos(a) * 17, 24 + Math.sin(a) * 17); }, 2); } break;
    case 'zigzag': line(() => { g.moveTo(6, 8); g.lineTo(20, 20); g.lineTo(14, 26); g.lineTo(30, 30); g.lineTo(24, 36); g.lineTo(42, 42); }, 2.6); break;
    case 'cloud': fill(() => { g.ellipse(18, 16, 11, 8, 0, 0, TAU); g.ellipse(30, 14, 12, 9, 0, 0, TAU); }, 0.6); line(() => { g.moveTo(22, 22); g.lineTo(16, 32); g.lineTo(24, 32); g.lineTo(18, 44); }, 2.4); break;
    case 'drop': fill(() => { g.moveTo(24, 6); g.quadraticCurveTo(40, 28, 24, 40); g.quadraticCurveTo(8, 28, 24, 6); }); break;
    case 'moonred': fill(() => g.arc(24, 24, 15, 0, TAU), 0.9); for (let i = 0; i < 4; i++) line(() => { g.moveTo(24, 24); g.lineTo(6 + i * 12, 46); }, 1.2); break;
    case 'fist': fill(() => { g.ellipse(24, 16, 12, 8, 0, 0, TAU); }); line(() => { g.moveTo(24, 22); g.lineTo(24, 40); }, 3); line(() => { g.moveTo(10, 42); g.lineTo(38, 42); }, 2); break;
    case 'mountain': fill(() => { g.moveTo(4, 42); g.lineTo(16, 18); g.lineTo(24, 30); g.lineTo(32, 10); g.lineTo(44, 42); }, 0.9); break;
    case 'boomerang': line(() => { g.moveTo(10, 34); g.quadraticCurveTo(24, 6, 40, 30); }, 3); line(() => g.arc(24, 30, 15, 0.3, 2.8), 1.4); break;
    case 'tornado': for (let i = 0; i < 5; i++) line(() => g.ellipse(24 + i * 1.5, 10 + i * 7, 16 - i * 3, 3, 0, 0, TAU), 1.8); break;
    case 'snake': line(() => { g.moveTo(6, 38); g.bezierCurveTo(16, 18, 26, 44, 34, 22); g.lineTo(40, 14); }, 3); fill(() => g.ellipse(40, 14, 4, 3, -0.8, 0, TAU)); break;
    case 'swamp': fill(() => g.ellipse(24, 34, 19, 8, 0, 0, TAU), 0.6); for (let i = 0; i < 4; i++) line(() => g.arc(12 + i * 8, 24 - (i % 2) * 6, 3 + (i % 2), 0, TAU), 1.4); break;
    case 'shield': line(() => { g.moveTo(24, 6); g.lineTo(40, 12); g.quadraticCurveTo(40, 34, 24, 42); g.quadraticCurveTo(8, 34, 8, 12); g.closePath(); }, 2.4); fill(() => { g.rect(22, 14, 4, 20); g.rect(16, 20, 16, 4); }); break;
    case 'bigsword': fill(() => { g.moveTo(24, 44); g.lineTo(18, 34); g.lineTo(18, 10); g.lineTo(30, 10); g.lineTo(30, 34); }); fill(() => g.rect(12, 8, 24, 4), 0.8); fill(() => g.rect(22, 2, 4, 7), 0.8); break;
    case 'portal': line(() => g.ellipse(16, 30, 6, 14, 0, 0, TAU), 2.2); line(() => g.ellipse(34, 14, 6, 10, 0, 0, TAU), 2.2); line(() => { g.moveTo(22, 24); g.quadraticCurveTo(26, 12, 30, 16); }, 1.2); break;
    case 'orbit': line(() => g.ellipse(24, 24, 18, 8, 0, 0, TAU), 1.4); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; fill(() => g.arc(24 + Math.cos(a) * 18, 24 + Math.sin(a) * 8, 4, 0, TAU)); } fill(() => g.arc(24, 24, 4, 0, TAU), 0.6); break;
    case 'geyser': fill(() => g.ellipse(24, 40, 16, 5, 0, 0, TAU), 0.8); line(() => { g.moveTo(24, 38); g.lineTo(24, 8); }, 4); fill(() => g.arc(24, 8, 6, 0, TAU)); break;
    case 'wave': fill(() => { g.moveTo(4, 44); g.lineTo(4, 26); g.quadraticCurveTo(20, 6, 36, 16); g.quadraticCurveTo(28, 18, 30, 26); g.quadraticCurveTo(38, 30, 44, 26); g.lineTo(44, 44); }, 0.9); break;
    case 'hourglass': line(() => { g.moveTo(14, 6); g.lineTo(34, 6); g.lineTo(14, 42); g.lineTo(34, 42); g.closePath(); }, 2.2); fill(() => { g.moveTo(18, 38); g.lineTo(30, 38); g.lineTo(24, 30); }); break;
    case 'clock': line(() => g.arc(24, 24, 16, 0, TAU), 2.2); line(() => { g.moveTo(24, 24); g.lineTo(24, 12); g.moveTo(24, 24); g.lineTo(32, 28); }, 2); break;
    case 'guillotine': line(() => { g.moveTo(10, 4); g.lineTo(10, 44); g.moveTo(38, 4); g.lineTo(38, 44); }, 2); fill(() => { g.moveTo(12, 10); g.lineTo(36, 10); g.lineTo(36, 18); g.lineTo(12, 24); }); break;
    case 'helmet': fill(() => { g.moveTo(10, 40); g.lineTo(10, 18); g.quadraticCurveTo(24, 2, 38, 18); g.lineTo(38, 40); }, 0.9); g.fillStyle = '#000'; g.fillRect(14, 22, 20, 4); g.fillRect(22, 22, 4, 14); break;
    case 'crescent': fill(() => { g.arc(24, 24, 17, 0.6, 5.7); g.arc(30, 22, 13, 5.5, 0.8, true); }); break;
    case 'eclipse': fill(() => g.arc(24, 24, 17, 0, TAU), 0.9); g.fillStyle = '#05050c'; g.beginPath(); g.arc(24, 24, 14, 0, TAU); g.fill(); break;
    case 'constellation': { const pts = [[8, 36], [18, 14], [30, 24], [40, 8], [36, 40]]; line(() => pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))), 1.3); for (const [x, y] of pts) fill(() => g.arc(x, y, 3.2, 0, TAU)); break; }
    case 'meteors': for (let i = 0; i < 3; i++) { line(() => { g.moveTo(40 - i * 8, 4 + i * 4); g.lineTo(18 - i * 8, 26 + i * 4); }, 1.6); fill(() => g.arc(18 - i * 8 + 8, 26 + i * 4, 4, 0, TAU)); } break;
    case 'dagger': fill(() => { g.moveTo(38, 8); g.lineTo(20, 30); g.lineTo(16, 26); }); fill(() => { g.moveTo(14, 26); g.lineTo(22, 34); g.lineTo(10, 42); g.lineTo(6, 38); }, 0.7); break;
    case 'clones': for (let i = 0; i < 3; i++) fill(() => { g.arc(12 + i * 12, 14, 4, 0, TAU); g.rect(9 + i * 12, 18, 6, 18); }, 0.4 + i * 0.3); break;
    case 'feather': fill(() => { g.moveTo(10, 42); g.quadraticCurveTo(12, 14, 38, 6); g.quadraticCurveTo(30, 30, 10, 42); }); line(() => { g.moveTo(10, 42); g.lineTo(32, 12); }, 1); break;
    case 'angel': fill(() => { g.moveTo(24, 26); g.quadraticCurveTo(4, 6, 4, 30); g.quadraticCurveTo(14, 26, 24, 30); }, 0.85); fill(() => { g.moveTo(24, 26); g.quadraticCurveTo(44, 6, 44, 30); g.quadraticCurveTo(34, 26, 24, 30); }, 0.85); line(() => g.ellipse(24, 10, 7, 2.5, 0, 0, TAU), 1.4); break;
    case 'rift': fill(() => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? 6 : 18; g.lineTo(24 + Math.cos(a) * r * 0.5, 24 + Math.sin(a) * r); } }); break;
    case 'shatter': for (let i = 0; i < 5; i++) line(() => { g.moveTo(24, 24); g.lineTo(24 + Math.cos(i * 1.3) * 20, 24 + Math.sin(i * 1.3) * 20); }, 1.4); line(() => { g.moveTo(6, 6); g.lineTo(42, 42); }, 3); break;
  }
};
