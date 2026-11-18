'use strict';
// ============================================================
//  검의 대장간 3 : 공허의 낫 보이드리퍼 (w9) · 용암대검 마그마 크러셔 (w10) · …
// ============================================================

// ============================================================
//  공허의 낫 보이드리퍼 : 소용돌이치는 공허의 문 · 사신의 낫 궤도
// ============================================================
const VOID = '180,90,255';
class FVoidGate {
  //  세로로 찢어진 공간 : 검은 속 + 별빛 + 돌아가는 강착 고리 + 가장자리 번개
  constructor(x, y, z, life, o = {}) { Object.assign(this, { x, y, z, life, t: 0, add: false, s: o.s || 1, suck: o.suck ?? true, seed: randi(1, 9999) }); }
  update() {
    this.t++;
    const X = this.x, Y = sy(this.y, this.z);
    if (this.suck && this.t < this.life - 8 && this.t % 2 === 0) for (let i = 0; i < FF.n(2); i++) { const a = rand(0, TAU), d = rand(120, 220) * this.s; FX.add('world', new FP(X + Math.cos(a) * d, Y + Math.sin(a) * d * 1.3, { kind: chance(0.3) ? 'star' : 'glow', col: VOID, tx: X, ty: Y, pull: 0.07, r: rand(3, 7), life: 20 })); }
    return this.t < this.life;
  }
  draw(ctx) {
    const T = this.t, u = T / this.life, k = (T < 10 ? E.out3(T / 10) : u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1) * this.s, X = this.x, Y = sy(this.y, this.z), rx = 46 * k, ry = 104 * k;
    if (k <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, 170 * k, VOID, 0.55); ctx.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(X, Y);                               // 강착 고리 (뒤쪽 절반)
    const disk = (front) => {
      for (let i = 0; i < 3; i++) {
        const r = (80 + i * 22) * k, rot = T * (0.08 + i * 0.03);
        ctx.strokeStyle = `rgba(${i ? '220,160,255' : VOID},${0.7 - i * 0.18})`; ctx.lineWidth = (6 - i * 1.5) * k;
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.26, -0.25, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,230,255,0.9)'; const g = rot + i * 2, fx = Math.cos(g) * r, fy = Math.sin(g) * r * 0.26; if ((Math.sin(g) > 0) === front) { ctx.beginPath(); ctx.arc(fx * Math.cos(-0.25) - fy * Math.sin(-0.25), fx * Math.sin(-0.25) + fy * Math.cos(-0.25), 3 * k, 0, TAU); ctx.fill(); }
      }
    };
    disk(false);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, ry);        // 검은 속
    g.addColorStop(0, '#000000'); g.addColorStop(0.7, '#0c0218'); g.addColorStop(1, '#3a1060');
    ctx.fillStyle = g; ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, w = 1 + Math.sin(a * 5 + T * 0.3) * 0.06; i ? ctx.lineTo(Math.cos(a) * rx * w, Math.sin(a) * ry * w) : ctx.moveTo(Math.cos(a) * rx * w, Math.sin(a) * ry * w); }
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); const R = mulberry(this.seed);           // 안쪽 별빛이 소용돌이친다
    for (let i = 0; i < 26; i++) { const a = R() * TAU + T * 0.05 * (1 + R()), d = R(); ctx.fillStyle = `rgba(230,200,255,${0.4 + R() * 0.6})`; ctx.fillRect(Math.cos(a) * rx * d, Math.sin(a) * ry * d, 2, 2); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(230,190,255,0.95)'; ctx.lineWidth = 3 * k; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${VOID},0.7)`; ctx.lineWidth = 10 * k; ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    disk(true);
    ctx.restore();
    if (T % 5 === 0 && k > 0.5) { const a = rand(0, TAU); FX.add('world', new FLightning(X + Math.cos(a) * rx, Y + Math.sin(a) * ry, X + Math.cos(a) * rx * 2.2, Y + Math.sin(a) * ry * 1.6, { col: VOID, w: 2, br: 1, life: 6, glow: 0.3 })); }
    ctx.restore();
  }
}

class FReaper {
  //  세 자루의 사신 낫 : 잔상 궤적 · 영혼 불꽃 · 마지막에 하나로 모여 X자 참격
  constructor(p) { Object.assign(this, { p, t: 0, life: 360, hit: new Map(), add: true, hist: [[], [], []] }); }
  pos(i) { const p = this.p, a = this.t * 0.13 + i * TAU / 3, k = this.t < 16 ? E.out3(this.t / 16) : 1; return [p.x + Math.cos(a) * 150 * k, p.y + Math.sin(a) * 55 * k, p.z + 74 + Math.sin(a) * 22, a]; }
  update() {
    this.t++; const p = this.p;
    if (p.hp <= 0) return false;
    for (let i = 0; i < 3; i++) {
      const [x, y, z, a] = this.pos(i), h = this.hist[i];
      h.unshift([x, sy(y, z), a]); if (h.length > 9) h.pop();
      for (const e of Game.enemies) {
        if (!e.hittable() || Math.abs(e.x - x) > 50 + e.w || Math.abs(e.y - y) > 42 || z < e.z - 30 || z > e.z + e.hurtH() + 30) continue;
        if (this.t - (this.hit.get(e) || -99) < 10) continue;
        this.hit.set(e, this.t);
        applyHit(p, e, WH.vrOrbit, { noStopAtt: true, dir: sign(e.x - p.x) || 1, hz: z });
        FX.add('world', new FSlash(e.x, sy(e.y, e.z + e.h * 0.5), a + Math.PI / 2, 46, { col: VOID, core: '240,220,255', th: 7, life: 10, dark: '20,0,40', sparks: false }));
      }
      if (this.t % 3 === i) FX.add('world', new FP(x, sy(y, z), { kind: 'flame', col: '160,70,255', vx: rand(-1, 1), vy: rand(-2, -0.5), r: rand(4, 7), life: 18 }));
    }
    if (this.t >= this.life) {
      const X = p.x, Y = sy(p.y, p.z + 74);
      for (const k of [-1, 1]) FX.add('world', new FSlash(X, Y, k * 0.75, 230, { col: VOID, core: '250,235,255', th: 18, dark: '20,0,40', life: 26 }));
      FX.add('ground', new FRing(X, sy(p.y, 0), 20, 320, 24, { col: VOID, w: 16 }));
      FX.add('ground', new FDecal(p.x, p.y, 200, 200, { kind: 'crack', col: '200,120,255' }));
      FF.impact(X, Y, VOID, 1.5); FF.spray('flame', X, Y, 24, { col: '160,70,255', v0: 2, v1: 9 });
      Sfx.wlayer('void', 3, true); Sfx.play('explode', 0.7, 0.8); Game.addShake(10); Game.flashScreen(0.25, '200,140,255');
      WS.area(p, p.x, p.y, 260, 110, WH.vrEnd);
      return false;
    }
    return true;
  }
  draw(ctx) {
    const a = Math.min(1, this.t / 10, (this.life - this.t) / 8);
    for (let i = 0; i < 3; i++) {
      const h = this.hist[i]; if (h.length < 2) continue;
      for (let j = h.length - 1; j >= 0; j--) this.scythe(ctx, h[j][0], h[j][1], h[j][2], a * (j ? 0.18 * (1 - j / h.length) : 1), !j);
    }
  }
  scythe(ctx, X, Y, ang, al, main) {
    ctx.save(); ctx.translate(X, Y); ctx.rotate(ang * 2.4); ctx.globalAlpha = al;
    if (main) drawGlow(ctx, 0, 0, 60, VOID, 0.4);
    ctx.strokeStyle = main ? '#2a1838' : `rgb(${VOID})`; ctx.lineWidth = 4; ctx.lineCap = 'round';  // 자루
    ctx.beginPath(); ctx.moveTo(-40, 26); ctx.lineTo(28, -20); ctx.stroke();
    ctx.fillStyle = `rgba(${VOID},0.6)`; ctx.beginPath(); ctx.moveTo(26, -22); ctx.quadraticCurveTo(-10, -66, -66, -40); ctx.quadraticCurveTo(-18, -46, 30, -12); ctx.fill();   // 날 (빛번짐)
    ctx.fillStyle = main ? '#e8d8ff' : `rgba(${VOID},0.9)`; ctx.beginPath(); ctx.moveTo(26, -22); ctx.quadraticCurveTo(-10, -60, -62, -40); ctx.quadraticCurveTo(-14, -42, 28, -14); ctx.fill();
    if (main) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(24, -22); ctx.quadraticCurveTo(-10, -58, -58, -41); ctx.quadraticCurveTo(-10, -54, 24, -20); ctx.fill(); ctx.fillStyle = '#c070ff'; ctx.beginPath(); ctx.arc(28, -18, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

Object.assign(WH, {
  vrDrop: WS.hd({ dmg: 8, kx: 0, kz: 0, airKz: 0, stun: 50, stop: 8, shake: 10, fx: 'heavy', power: 1.8 }),
  vrOrbit: WS.hd({ dmg: 2.3, kx: 3, airKz: 3, stun: 22, stop: 2, shake: 1.5, fx: 'slash' }),
  vrEnd: WS.hd({ dmg: 10, kx: 9, kz: 8, airKz: 8, stun: 50, stop: 10, shake: 10, fx: 'heavy', power: 2 }),
});

forgeDef('w9', {
  name: '공허의 문', mp: 160, cd: 10, ico: ['portal', '190,100,255'],
  desc: '낫으로 공간을 찢어 공허의 문을 연다. 근처 적은 소용돌이에 빨려 사라지고, 하늘에 열린 출구에서 떨어져 바닥에 처박힌다. (보스는 강타)',
  act: {
    anim: 'a4', len: 66, cancel: 56, atkCancel: 52,
    start(p) { p.vgate = []; p.vx = 0; },
    update(p, f) {
      p.vx *= 0.7;
      const ax = p.x + p.facing * 140;
      if (f === 5) FX.add('world', new FSlash(ax, sy(p.y, 70), Math.PI / 2, 110, { col: VOID, core: '250,235,255', th: 12, dark: '20,0,40', bend: 0.04 }));
      if (f === 6) { FX.add('world', new FVoidGate(ax, p.y, 70, 32)); Sfx.wlayer('void', 2, false); }
      if (f >= 6 && f < 20) {
        for (const e of Game.enemies) {
          if (!e.hittable() || Math.abs(e.x - ax) > 250 || Math.abs(e.y - p.y) > 90) continue;
          if (e.isBoss) { if (f === 16) { applyHit(p, e, WH.vrDrop, { noStopAtt: true }); FF.impact(e.x, sy(e.y, e.z + e.h * 0.5), VOID, 1); } continue; }
          e.x = lerp(e.x, ax, 0.25); e.y = lerp(e.y, p.y, 0.2); e.z = lerp(e.z, 40, 0.2); e.hitstop = 2;
          if (f === 18 && !p.vgate.includes(e)) p.vgate.push(e);
        }
      }
      if (f === 20) for (const e of p.vgate) { e.alpha = 0; e.hitstop = 30; e.interrupt(); FX.add('world', new FP(ax, sy(p.y, 70), { kind: 'glow', col: VOID, r: 50, life: 10 })); }
      if (f === 28) { FX.add('world', new FVoidGate(p.x + p.facing * 260, p.y, 300, 38, { suck: false })); Sfx.wlayer('void', 1, false); }
      if (f === 44) {
        const tx = p.x + p.facing * 260;
        for (const e of p.vgate) {
          if (e.dead) continue;
          e.alpha = 1; e.hitstop = 0; e.x = clamp(tx + rand(-40, 40), Game.room.minX, Game.room.maxX); e.z = 290; e.state = 'air'; e.bounced = false;
          if (e.hittable()) applyHit(p, e, WH.vrDrop, { noStopAtt: true, dir: p.facing });
          e.vz = -16; e.vx = 0;
        }
        if (p.vgate.length) Gear.later(12, () => {               // 처박히는 자리
          FX.add('ground', new FDecal(tx, p.y, 130, 200, { kind: 'crack', col: '200,120,255' }));
          FX.add('ground', new FRing(tx, sy(p.y, 0), 20, 200, 20, { col: VOID, w: 12 }));
          FF.spray('flame', tx, sy(p.y, 10), 14, { col: '160,70,255', v0: 2, v1: 7 }); Game.addShake(8);
        });
        Sfx.wlayer('void', 3, true); Game.addShake(6);
      }
    },
    end(p) { for (const e of p.vgate || []) { if (e.alpha === 0) e.alpha = 1; e.hitstop = 0; } p.vgate = []; },
  },
}, {
  name: '사신의 궤도', mp: 480, cd: 42, ico: ['orbit', '190,100,255'],
  desc: '영혼의 불꽃을 두른 사신의 낫 세 자루가 6초 동안 내 주위를 돌며 닿는 적을 계속 베어낸다. 그동안 자유롭게 움직일 수 있고, 끝에는 낫이 하나로 모여 X자로 갈라 터진다.',
  act: {
    anim: 'win', len: 34, cancel: 20, atkCancel: 16,
    start(p) { forgeCine(p, '사신의 궤도', '死 神 軌 道', '170,80,255', { bars: 40, dim: 0.3 }); p.invul = 90; p.vx = 0; },
    update(p, f) {
      if (f === 6) {
        FX.add('world', new FReaper(p));
        FX.add('ground', new FCircle(p.x, p.y, 170, 60, { kind: 'rune', col: VOID, col2: '240,220,255', follow: p }));
        FF.spray('flame', p.x, sy(p.y, 74), 20, { col: '160,70,255', v0: 2, v1: 8 });
        Sfx.wlayer('void', 3, true); Game.addShake(6); forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});

// ============================================================
//  용암대검 마그마 크러셔 : 솟구치는 용암 기둥 · 굳어가는 용암 웅덩이 · 용암 해일
// ============================================================
const LAVA = ['#1a0a06', '#4a160a', '#b8300c', '#ff7a1c', '#ffd27a'];
class FLavaPool {
  constructor(p, x, y, o = {}) { Object.assign(this, { p, x, y, t: 0, add: false, rx: o.rx || 70, life: o.life || 180, every: o.every || 20, seed: randi(1, 9999) }); }
  update() {
    this.t++;
    if (this.t % this.every === 0) WS.area(this.p, this.x, this.y, this.rx, this.rx * 0.5, WH.fireTick, { hmax: 60 });
    if (this.t % 7 === 0) FX.add('world', new FP(this.x + rand(-this.rx, this.rx) * 0.7, sy(this.y, 4), { kind: chance(0.7) ? 'ember' : 'smoke', col: chance(0.7) ? '255,140,40' : '90,60,50', vx: rand(-0.5, 0.5), vy: -rand(1, 2.5), r: rand(3, 6), life: randi(20, 40) }));
    return this.t < this.life;
  }
  draw(ctx) {
    const u = this.t / this.life, k = Math.min(1, this.t / 8), cool = Math.max(0, (u - 0.5) / 0.5), gy = sy(this.y, 0), R = mulberry(this.seed), rx = this.rx * k, a = Math.min(1, (1 - u) * 6);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = LAVA[1]; ctx.beginPath();
    for (let i = 0; i <= 18; i++) { const g = i / 18 * TAU, w = 0.8 + R() * 0.25; i ? ctx.lineTo(this.x + Math.cos(g) * rx * w, gy + Math.sin(g) * rx * 0.3 * w) : ctx.moveTo(this.x + Math.cos(g) * rx * w, gy + Math.sin(g) * rx * 0.3 * w); }
    ctx.closePath(); ctx.fill(); ctx.save(); ctx.clip();
    const g = ctx.createRadialGradient(this.x, gy, 4, this.x, gy, rx); g.addColorStop(0, LAVA[4]); g.addColorStop(0.4, LAVA[3]); g.addColorStop(1, LAVA[2]);
    ctx.globalAlpha = a * (1 - cool * 0.7); ctx.fillStyle = g; ctx.fillRect(this.x - rx, gy - rx, rx * 2, rx * 2);
    ctx.globalAlpha = a; ctx.fillStyle = LAVA[0];                // 식어가며 떠다니는 검은 껍질
    for (let i = 0; i < 9; i++) { const cx = this.x + (R() - 0.5) * rx * 1.6 + Math.sin(this.t * 0.02 + i) * 4, cy = gy + (R() - 0.5) * rx * 0.5, s = (6 + R() * 10) * (0.4 + cool); ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx - s * 0.3, cy - s * 0.35); ctx.lineTo(cx + s, cy - s * 0.1); ctx.lineTo(cx + s * 0.4, cy + s * 0.3); ctx.fill(); }
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, this.x, gy, rx * 1.3, '255,110,30', 0.5 * (1 - cool * 0.6), 1, 0.35);
    ctx.restore();
  }
}

class FLavaGeyser {
  constructor(x, y, o = {}) { Object.assign(this, { x, y, t: 0, add: false, life: o.life || 34, h: o.h || 380, w: o.w || 46 }); }
  update() {
    this.t++;
    if (this.t < 18 && this.t % 2 === 0) for (let i = 0; i < FF.n(3); i++) FX.add('world', new Debris(this.x + rand(-14, 14), this.y, this.h * rand(0.5, 1), { vx: rand(-6, 6), vz: rand(2, 9), s: rand(3, 6), col: [LAVA[3], LAVA[2], LAVA[4]], glow: '255,120,30', life: 50 }));
    return this.t < this.life;
  }
  draw(ctx) {
    const T = this.t, u = T / this.life, up = T < 6 ? E.out3(T / 6) : 1, dn = u > 0.55 ? (u - 0.55) / 0.45 : 0, gy = sy(this.y, 0), x = this.x;
    const top = gy - this.h * up * (1 - dn * 0.3), bot = gy, w = this.w * (1 - dn * 0.7);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, gy, w * 3.5, '255,110,30', 0.7 * (1 - dn)); ctx.globalCompositeOperation = 'source-over';
    const col = (ww, c) => {                                          // 일렁이는 기둥 + 끝이 부풀어 넘친다
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - ww, bot);
      for (let i = 0; i <= 12; i++) { const yy = lerp(bot, top, i / 12); ctx.lineTo(x - ww * (1 - i / 30) + Math.sin(T * 0.6 + i) * ww * 0.12, yy); }
      ctx.arc(x, top, ww * 1.15, Math.PI, 0);
      for (let i = 12; i >= 0; i--) { const yy = lerp(bot, top, i / 12); ctx.lineTo(x + ww * (1 - i / 30) + Math.sin(T * 0.6 + i + 2) * ww * 0.12, yy); }
      ctx.closePath(); ctx.fill();
    };
    col(w, LAVA[2]); col(w * 0.7, LAVA[3]); col(w * 0.3, LAVA[4]);
    ctx.fillStyle = LAVA[0]; for (let i = 0; i < 5; i++) { const yy = lerp(bot, top, ((T * 0.08 + i / 5) % 1)); ctx.beginPath(); ctx.ellipse(x + Math.sin(i * 3) * w * 0.4, yy, 5, 3, 0, 0, TAU); ctx.fill(); }   // 솟구치는 검은 바위 조각
    ctx.restore();
  }
}

class FLavaTide {
  //  화면을 가로지르는 용암 해일 : 말려 올라가는 물마루 · 떠다니는 껍질 · 지나간 자리는 그을린다
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, hit: new Map(), add: false, first: new Set() }); }
  update() {
    this.t++; this.x += this.dir * 12;
    const p = this.p, r = Game.room;
    for (const e of Game.enemies) {
      if (!e.hittable()) continue;
      const rel = (e.x - this.x) * this.dir;
      if (rel > 40 || rel < -180) continue;
      if (!e.isBoss) { e.vx = this.dir * 14; e.x += this.dir * 6; if (e.z < 40) e.z = 40; e.state = e.state === 'dying' ? 'dying' : 'air'; e.vz = Math.max(e.vz, 1); }
      if (this.t - (this.hit.get(e) || -99) >= 8) { this.hit.set(e, this.t); applyHit(p, e, this.first.has(e) ? WH.mgTick : WH.mgWave, { noStopAtt: true, dir: this.dir }); this.first.add(e); Status.add(e, 'burn', { t: 120, d: p.atk * 0.2 }); }
    }
    if (this.t % 3 === 0) FX.add('ground', new FDecal(this.x - this.dir * 60, rand(0, DEPTH), rand(60, 110), 180, { kind: 'scorch', col: '255,120,40' }));
    if (this.t % 2 === 0) for (let i = 0; i < FF.n(3); i++) FX.add('world', new FP(this.x + this.dir * rand(0, 30), rand(GROUND_Y - 260, sy(DEPTH, 0)), { kind: chance(0.6) ? 'ember' : 'flame', col: '255,130,40', vx: this.dir * rand(4, 10), vy: rand(-6, -1), grav: 0.2, r: rand(3, 7), life: randi(20, 34) }));
    if (this.t % 6 === 0) Game.addShake(4);
    if (this.x < r.minX - 140 || this.x > r.maxX + 140) { Sfx.play('explode', 1); Game.addShake(16); Game.flashScreen(0.35, '255,160,80'); return false; }
    return true;
  }
  draw(ctx) {
    const d = this.dir, x = this.x, T = this.t, top = GROUND_Y - 220, bot = sy(DEPTH, 0) + 30, back = x - d * 1400;
    ctx.save();
    const g = ctx.createLinearGradient(back, 0, x, 0);
    g.addColorStop(0, 'rgba(60,16,6,0.0)'); g.addColorStop(0.55, 'rgba(90,22,8,0.92)'); g.addColorStop(0.85, LAVA[2]); g.addColorStop(1, LAVA[3]);
    // 해일 몸통 : 앞쪽이 높게 솟고 위로 말린 물마루
    const crest = (yy) => x + d * (Math.sin(T * 0.3 + yy * 0.02) * 14);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(back, bot); ctx.lineTo(back, top + 120);
    ctx.quadraticCurveTo(x - d * 300, top + 60, x - d * 60, top - 30);
    ctx.quadraticCurveTo(x + d * 70, top - 50, x + d * 50, top + 30);   // 말린 끝
    ctx.quadraticCurveTo(x + d * 10, top + 10, crest(top + 60), top + 70);
    for (let i = 0; i <= 8; i++) { const yy = lerp(top + 70, bot, i / 8); ctx.lineTo(crest(yy) + d * Math.sin(i * 1.7 + T * 0.4) * 10, yy); }
    ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';   // 흐르는 용암 줄기 · 어두운 굳은 띠
    for (let i = 0; i < 12; i++) {
      const yy = lerp(top + 40, bot, i / 11), ph = T * 0.25 + i * 1.3;
      ctx.strokeStyle = `rgba(255,${190 + (i % 3) * 20},90,${0.22 + (i % 2) * 0.15})`; ctx.lineWidth = 3 + (i % 3) * 2; ctx.beginPath();
      for (let s = 0; s <= 20; s++) { const xx = x - d * s * 45; ctx.lineTo(xx, yy + Math.sin(ph + s * 0.7) * 8 + (s * 3) % 7); }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(30,8,4,0.35)'; ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) { const yy = lerp(top + 70, bot, (i + 0.5) / 6); ctx.beginPath(); for (let s = 0; s <= 20; s++) ctx.lineTo(x - d * (s * 45 + 80), yy + Math.sin(T * 0.2 + i * 2 + s * 0.5) * 10); ctx.stroke(); }
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,220,130,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';   // 빛나는 물마루 가장자리
    ctx.beginPath(); ctx.moveTo(x - d * 300, top + 60); ctx.quadraticCurveTo(x - d * 60, top - 30, x - d * 60, top - 30); ctx.quadraticCurveTo(x + d * 70, top - 50, x + d * 50, top + 30); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,60,0.7)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 8; i++) { const yy = lerp(top + 70, bot, i / 8); ctx.lineTo(crest(yy) + d * Math.sin(i * 1.7 + T * 0.4) * 10, yy); } ctx.stroke();
    drawGlow(ctx, x - d * 40, (top + bot) / 2, 300, '255,110,30', 0.45, 0.6, 1.4);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = LAVA[0];                                         // 떠밀려 가는 껍질 조각
    for (let i = 0; i < 14; i++) { const px = x - d * ((i * 97 + T * 3) % 900 + 60), py = lerp(top + 100, bot - 10, (i * 0.37) % 1), s = 8 + (i % 4) * 4; ctx.beginPath(); ctx.moveTo(px - s, py); ctx.lineTo(px, py - s * 0.5); ctx.lineTo(px + s, py); ctx.lineTo(px, py + s * 0.3); ctx.fill(); }
    ctx.restore();
  }
}

Object.assign(WH, {
  mgGeyser: WS.hd({ dmg: 6.5, kx: 1, kz: 16, airKz: 14, stun: 50, stop: 8, shake: 8, fx: 'none', sfx: 'heavy', power2: 2 }),
  mgWave: WS.hd({ dmg: 5, kx: 14, kz: 3, airKz: 3, stun: 50, stop: 6, shake: 8, fx: 'heavy', power: 1.6 }),
  mgTick: WS.hd({ dmg: 1.6, kx: 14, airKz: 1, stun: 30, stop: 2, shake: 2, fx: 'none' }),
});

forgeDef('w10', {
  name: '용암 간헐천', mp: 150, cd: 9, ico: ['geyser', '255,110,30'],
  desc: '대검을 땅에 꽂으면 근처 적 최대 4명의 발밑이 갈라지며 끓어오른다. 잠시 뒤 용암 기둥이 솟구쳐 높이 띄우고, 서서히 식어가는 용암 웅덩이를 남긴다.',
  act: {
    anim: 'ebImpact', len: 44, cancel: 32, atkCancel: 28,
    start(p) { p.vx = 0; Sfx.pplay('swingBig'); },
    update(p, f) {
      p.vx = 0;
      if (f === 6) {
        Game.addShake(6); Sfx.play('thud', 0.8);
        FX.add('ground', new FDecal(p.x + p.facing * 40, p.y, 100, 120, { kind: 'crack', col: '255,140,40' }));
        FF.spray('ember', p.x + p.facing * 40, sy(p.y, 6), 12, { col: '255,140,40', v0: 2, v1: 6 });
        let list = WS.nearest(p.x, p.y, 4, 620).map(e => [e.x, e.y]);
        if (!list.length) list = [[p.x + p.facing * 160, p.y], [p.x + p.facing * 280, p.y]];
        list.forEach(([x, y], i) => {
          const D = 22 + i * 5;
          FX.add('ground', new FDecal(x, y, 80, D + 200, { kind: 'crack', col: '255,140,40' }));
          FX.add('world', new FRun(D, r => {                       // 끓어오르는 예고
            if (r.t % 3 === 0) FX.add('world', new FP(x + rand(-40, 40), sy(y, 2), { kind: chance(0.5) ? 'ember' : 'bubble', col: '255,140,40', vy: -rand(1, 3), r: rand(3, 6), life: 16 }));
            if (r.t === D - 1) {
              FX.add('world', new FLavaGeyser(x, y));
              FX.add('ground', new FRing(x, sy(y, 0), 10, 120, 16, { col: '255,140,40', w: 10 }));
              FX.add('ground', new FLavaPool(p, x, y, { rx: 72, life: 200 }));
              Sfx.wlayer('magma', 2, false); Game.addShake(7);
              WS.area(p, x, y, 74, 34, WH.mgGeyser, { each: e => Status.add(e, 'burn', { t: 180, d: p.atk * 0.3 }) });
            }
          }, { draw: (ctx, r) => { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, x, sy(y, 0), 80, '255,110,30', 0.6 * r.t / D, 1, 0.35); ctx.globalCompositeOperation = 'source-over'; } }));
        });
      }
    },
  },
}, {
  name: '용암 해일', mp: 480, cd: 42, ico: ['wave', '255,110,30'],
  desc: '대검을 치켜들면 등 뒤에서 말려 오르는 용암의 해일이 몰려와 화면을 가로지른다. 휩쓸린 적은 불타며 벽까지 밀려가 처박히고, 지나간 자리는 그을린다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '용암 해일', '熔 岩 海 溢', '255,100,20', { bars: 70, dim: 0.35 }); p.invul = 150; p.vx = 0; },
    update(p, f) {
      if (f === 4) { FF.screen({ col: '255,80,20', a: 0.12, life: 90, fin: 10, fout: 30 }); Sfx.play('quake', 0.6); Game.addShake(6); }
      if (f === 10) {
        const r = Game.room, x0 = p.facing > 0 ? Math.max(r.minX - 80, Game.cam.x - 120) : Math.min(r.maxX + 80, Game.cam.x + W + 120);
        FX.add('world', new FLavaTide(p, x0, p.y, p.facing));
        Sfx.play('quake', 1); Sfx.wlayer('magma', 3, true); Game.flashScreen(0.3, '255,150,60');
      }
      if (f === 12) swingT(p, 'a4', 1);
      if (f === 40) forgeUndim(20);
    },
    end() { forgeUndim(10); },
  },
});

// ============================================================
//  태엽검 크로노스 : 등 뒤의 톱니바퀴 · 멈춘 세계의 거대한 시계
// ============================================================
const CLK = '160,225,255';
function drawCog(ctx, x, y, r, teeth, rot, fill, line) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = i / teeth * TAU, a1 = (i + 0.5) / teeth * TAU, s = TAU / teeth * 0.14;
    ctx.lineTo(Math.cos(a0 - s) * r * 0.82, Math.sin(a0 - s) * r * 0.82); ctx.lineTo(Math.cos(a0 + s) * r, Math.sin(a0 + s) * r);
    ctx.lineTo(Math.cos(a1 - s) * r, Math.sin(a1 - s) * r); ctx.lineTo(Math.cos(a1 + s) * r * 0.82, Math.sin(a1 + s) * r * 0.82);
  }
  ctx.closePath(); ctx.moveTo(r * 0.4, 0); ctx.arc(0, 0, r * 0.4, 0, TAU, true);
  if (fill) { ctx.fillStyle = fill; ctx.fill('evenodd'); }
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15); ctx.lineTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); }
  if (line) ctx.stroke();
  ctx.restore();
}

class FChronoGears {
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p;
    if (!(p.hasteT > 0) || p.hp <= 0) return false;
    if (this.t % 5 === 0) FX.add('world', new FP(p.x + rand(-30, 30), sy(p.y, p.z + rand(20, 140)), { kind: 'spark', col: CLK, vx: -p.facing * rand(2, 5), vy: rand(-1, 1), r: 2.5, life: 14 }));
    return true;
  }
  draw(ctx) {
    const p = this.p, a = Math.min(1, this.t / 10, p.hasteT / 20), X = p.x - p.facing * 26, Y = sy(p.y, p.z + 100), T = this.t, sp = 0.09;
    ctx.save(); ctx.globalAlpha = a;
    drawGlow(ctx, X, Y, 90, CLK, 0.25);
    drawCog(ctx, X, Y, 46, 12, T * sp, `rgba(${CLK},0.14)`, `rgba(${CLK},0.8)`);
    drawCog(ctx, X - p.facing * 52, Y - 34, 28, 8, -T * sp * 12 / 8 + 0.2, `rgba(${CLK},0.12)`, `rgba(220,245,255,0.75)`);
    drawCog(ctx, X + p.facing * 30, Y + 44, 20, 6, -T * sp * 2 + 0.5, `rgba(${CLK},0.1)`, `rgba(${CLK},0.6)`);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';      // 미친 듯 도는 시곗바늘
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(T * 0.5) * 34, Y + Math.sin(T * 0.5) * 34); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(T * 0.05) * 22, Y + Math.sin(T * 0.05) * 22); ctx.stroke();
    ctx.restore();
  }
}

// 멈춘 세계 : 색이 빠지고, 화면 가득 시계가 걸린다 (화면 좌표)
const NUM = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
function drawClockFace(ctx, cx, cy, R, a, T, frozen) {
  ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = a;
  ctx.strokeStyle = '#d8f2ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R - 12, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, TAU); ctx.stroke();
  for (let k = 0; k < 60; k++) { const g = k / 60 * TAU, l = k % 5 ? 8 : 18; ctx.lineWidth = k % 5 ? 1.5 : 4; ctx.beginPath(); ctx.moveTo(Math.cos(g) * (R - 12), Math.sin(g) * (R - 12)); ctx.lineTo(Math.cos(g) * (R - 12 - l), Math.sin(g) * (R - 12 - l)); ctx.stroke(); }
  ctx.fillStyle = '#d8f2ff'; ctx.font = `bold ${Math.round(R * 0.11)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let k = 0; k < 12; k++) { const g = k / 12 * TAU - Math.PI / 2; ctx.fillText(NUM[k], Math.cos(g) * R * 0.76, Math.sin(g) * R * 0.76); }
  drawCog(ctx, 0, 0, R * 0.4, 16, frozen ? 0.05 : T * 0.01, null, 'rgba(216,242,255,0.6)');
  const jit = frozen ? Math.sin(T * 0.9) * 0.015 : 0;
  ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round';
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(-1.1) * R * 0.45, Math.sin(-1.1) * R * 0.45); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(-2.6) * R * 0.7, Math.sin(-2.6) * R * 0.7); ctx.stroke();
  ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-Math.cos(0.4 + jit) * 30, -Math.sin(0.4 + jit) * 30); ctx.lineTo(Math.cos(0.4 + jit) * R * 0.85, Math.sin(0.4 + jit) * R * 0.85); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
  ctx.restore();
}

// ============================================================
//  처형검 데스 헤럴드 : 피의 룬이 새겨진 단두대 · 망자의 기사단
// ============================================================
class FGuillotine {
  constructor(x, y, o) { Object.assign(this, { x, y, t: 0, dur: o.dur || 30, onImpact: o.onImpact, follow: o.follow, add: false, H: 330, w: 92 }); }
  update() {
    this.t++;
    if (this.follow && this.follow.hittable() && this.t < this.dur - 6) { this.x = lerp(this.x, this.follow.x, 0.3); this.y = lerp(this.y, this.follow.y, 0.3); }
    if (this.t === this.dur && this.onImpact) this.onImpact(this);
    if (this.t === this.dur - 6) Sfx.play('swingBig', 0.8, 0.6);
    return this.t < this.dur + 30;
  }
  draw(ctx) {
    const T = this.t, gy = sy(this.y, 0), x = this.x, w = this.w, H = this.H, rise = E.out3(Math.min(1, T / 10)), out = T > this.dur + 10 ? (T - this.dur - 10) / 20 : 0;
    const drop = T < this.dur - 6 ? 0 : Math.min(1, Math.pow((T - this.dur + 6) / 6, 2));
    const top = gy - H * rise, bladeTop = lerp(top + 18, gy - 72, drop) + (drop === 0 ? Math.sin(T * 1.3) * 1.5 : 0);
    ctx.save(); ctx.globalAlpha = 1 - out;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, gy, w + 40, 18, 0, 0, TAU); ctx.fill();
    for (const k of [-1, 1]) {                                       // 기둥 : 검은 쇠 + 붉은 룬
      const px = x + k * (w + 10);
      ctx.fillStyle = '#1c1418'; ctx.fillRect(px - 9, top, 18, gy - top);
      ctx.fillStyle = '#3a2a30'; ctx.fillRect(px - 9, top, 6, gy - top);
      ctx.fillStyle = '#80101c'; for (let i = 0; i < 6; i++) ctx.fillRect(px - 3, top + 30 + i * 46, 6, 18);
      ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) drawGlow(ctx, px, top + 39 + i * 46, 14, '255,40,60', 0.5 * rise); ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = '#1c1418'; ctx.fillRect(x - w - 26, top - 16, w * 2 + 52, 22);                 // 가로대
    ctx.fillStyle = '#4a3238'; ctx.fillRect(x - w - 26, top - 16, w * 2 + 52, 5);
    ctx.fillStyle = '#5a1018'; ctx.beginPath(); ctx.moveTo(x - 30, top - 16); ctx.lineTo(x, top - 46); ctx.lineTo(x + 30, top - 16); ctx.fill();   // 꼭대기 장식
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, top + 4); ctx.lineTo(x, bladeTop); ctx.stroke();     // 밧줄
    // 칼날 : 비스듬한 날 + 번뜩이는 날끝
    const bh = 70;
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - w, bladeTop - 22, w * 2, 22);
    const bg = ctx.createLinearGradient(0, bladeTop, 0, bladeTop + bh); bg.addColorStop(0, '#6e7080'); bg.addColorStop(1, '#c8ccd8');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(x - w, bladeTop); ctx.lineTo(x + w, bladeTop); ctx.lineTo(x + w, bladeTop + bh * 0.45); ctx.lineTo(x - w, bladeTop + bh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w, bladeTop + bh); ctx.lineTo(x + w, bladeTop + bh * 0.45); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255,60,80,${0.5 + drop * 0.5})`; ctx.lineWidth = 6; ctx.stroke();
    if (drop > 0 && drop < 1) { ctx.fillStyle = 'rgba(255,200,210,0.35)'; ctx.fillRect(x - w, bladeTop - 120, w * 2, 120); }       // 낙하 잔상
    const gl = (T * 0.08) % 1; drawGlow(ctx, lerp(x - w, x + w, gl), lerp(bladeTop + bh, bladeTop + bh * 0.45, gl), 22, '255,255,255', 0.8);
    ctx.restore();
  }
}

class FMarcher {
  constructor(p, x, y, dir, delay) { Object.assign(this, { p, x, y, dir, t: -delay, set: new Set(), add: true }); this.J = newJ(); this.pose = P(); this.hist = []; }
  update() {
    this.t++;
    if (this.t < 0) return true;
    this.x += this.dir * 8.5;
    const u = (Math.sin(this.t * 0.35) + 1) / 2;
    lerpPose(PP.a1w, PP.a1s, u, this.pose); solveRig(this.p.rig, this.pose, this.J, true);
    if (this.t % 3 === 0) { this.hist.unshift(this.x); if (this.hist.length > 3) this.hist.pop(); }
    if (this.t % 2 === 0) {
      FX.add('world', new FP(this.x - this.dir * rand(10, 40), sy(this.y, rand(40, 170)), { kind: 'flame', col: '110,255,190', vx: -this.dir * rand(1, 3), vy: -rand(0.5, 2), r: rand(5, 9), life: 18 }));
      FX.add('world', new FP(this.x + rand(-30, 30), sy(this.y, 4), { kind: 'smoke', col: '120,200,170', vx: -this.dir, vy: -0.3, r: rand(18, 30), grow: 0.4, life: 30 }));
    }
    for (const e of Game.enemies) {
      if (!e.hittable() || this.set.has(e) || Math.abs(e.x - this.x) > 70 || Math.abs(e.y - this.y) > 50) continue;
      this.set.add(e); applyHit(this.p, e, WH.exMarch, { noStopAtt: true, dir: this.dir });
      FX.add('world', new FSlash(e.x, sy(e.y, e.z + e.h * 0.5), this.dir > 0 ? -0.6 : Math.PI + 0.6, 90, { col: '120,255,200', core: '230,255,245', th: 10, dark: '0,30,20' }));
    }
    const r = Game.room;
    return this.x > r.minX - 300 && this.x < r.maxX + 300;
  }
  draw(ctx) {
    if (this.t < 0) return;
    const R = this.p.rig, a = Math.min(1, this.t / 10), gy = sy(this.y, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, this.x, gy - 90, 120, '90,255,180', 0.25 * a, 0.6, 1.4);
    this.hist.forEach((hx, i) => { ctx.save(); ctx.globalAlpha = 0.16 * a * (1 - i / 3); ctx.translate(hx - this.dir * 12 * (i + 1), gy); ctx.scale(this.dir * 1.25, 1.25); R.draw(ctx, this.J, R.ghostPal('90,220,170'), this.p, { ghost: true }); ctx.restore(); });
    ctx.globalAlpha = 0.6 * a; ctx.translate(this.x, gy); ctx.scale(this.dir * 1.25, 1.25);
    R.draw(ctx, this.J, R.ghostPal('120,255,200'), this.p, { ghost: true });
    ctx.restore();
  }
}

// ============================================================
//  월광검 루나 이클립스 : 분열하는 초승달 · 별이 뜬 월식
// ============================================================
const MOON = '200,220,255';
class FMoonBlade {
  constructor(p, x, y, z, vx, vy, o = {}) { Object.assign(this, { p, x, y, z, vx, vy, t: 0, add: true, life: o.life || 48, R: o.R || 62, hd: o.hd, rehit: o.rehit || 0, hitT: new Map(), onEnd: o.onEnd, spin: rand(0, TAU), small: !!o.small }); }
  update() {
    this.t++; this.x += this.vx; this.y = clamp(this.y + this.vy, 0, DEPTH); this.spin += this.small ? 0.4 : 0.22 * sign(this.vx || 1);
    for (const e of Game.enemies) {
      if (!e.hittable()) continue;
      const last = this.hitT.get(e); if (last !== undefined && (!this.rehit || this.t - last < this.rehit)) continue;
      if (Math.abs(e.x - this.x) > this.R + e.w || Math.abs(e.y - this.y) > 40 + e.d || e.z > this.z + 100) continue;
      this.hitT.set(e, this.t); applyHit(this.p, e, this.hd, { noStopAtt: true, dir: sign(this.vx) || 1, hz: this.z + 40 });
    }
    if (this.t % 2 === 0) FX.add('world', new FP(this.x + rand(-this.R, this.R) * 0.5, sy(this.y, this.z) + rand(-this.R, this.R) * 0.5, { kind: chance(0.4) ? 'star' : 'glow', col: MOON, vx: -this.vx * 0.2, vy: rand(-0.5, 0.5), r: rand(2, 5), life: randi(16, 26) }));
    if (this.t >= this.life) { if (this.onEnd) this.onEnd(this); return false; }
    return true;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, this.z), R = this.R, a = Math.min(1, this.t / 4, (this.life - this.t) / 6);
    ctx.save(); ctx.globalAlpha = a; drawGlow(ctx, X, Y, R * 2, MOON, 0.35);
    ctx.translate(X, Y); ctx.rotate(this.spin);
    const path = () => { ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI * 0.62, Math.PI * 0.62); ctx.arc(R * 0.38, 0, R * 0.86, Math.PI * 0.58, -Math.PI * 0.58, true); ctx.closePath(); };
    const g = ctx.createRadialGradient(-R * 0.4, 0, R * 0.2, 0, 0, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#dfe8ff'); g.addColorStop(1, '#9fb4ee');
    ctx.fillStyle = g; path(); ctx.fill();
    if (!this.small) { ctx.save(); path(); ctx.clip(); ctx.fillStyle = 'rgba(120,140,200,0.35)'; for (const [cx, cy, r] of [[-0.8, -0.3, 0.12], [-0.75, 0.35, 0.09], [-0.55, 0.05, 0.07], [-0.4, -0.65, 0.08]]) { ctx.beginPath(); ctx.arc(cx * R, cy * R, r * R, 0, TAU); ctx.fill(); } ctx.restore(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI * 0.62, Math.PI * 0.62); ctx.stroke();
    ctx.restore();
  }
}

function drawEclipse(ctx, a, T) {
  const g = ctx.createRadialGradient(W / 2, 120, 60, W / 2, H / 2, H * 1.1);
  g.addColorStop(0, `rgba(10,12,40,${0.35 * a})`); g.addColorStop(1, `rgba(2,2,12,${0.7 * a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const R = mulberry(77);                                              // 별
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H * 0.55, tw = 0.5 + 0.5 * Math.sin(T * 0.05 + i * 2.1); ctx.fillStyle = `rgba(220,230,255,${a * tw * (0.4 + R() * 0.6)})`; ctx.fillRect(x, y, 1.5 + R() * 1.5, 1.5 + R() * 1.5); }
  ctx.save(); ctx.translate(W / 2, 120); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, 0, 0, 220, '170,195,255', 0.6);
  ctx.rotate(T * 0.003); ctx.fillStyle = 'rgba(210,225,255,0.22)';     // 코로나 줄기
  for (let i = 0; i < 24; i++) { const g2 = i / 24 * TAU, L = 90 + (i % 3) * 40 + Math.sin(T * 0.04 + i) * 12; ctx.beginPath(); ctx.moveTo(Math.cos(g2 - 0.06) * 60, Math.sin(g2 - 0.06) * 60); ctx.lineTo(Math.cos(g2) * L, Math.sin(g2) * L); ctx.lineTo(Math.cos(g2 + 0.06) * 60, Math.sin(g2 + 0.06) * 60); ctx.fill(); }
  ctx.rotate(-T * 0.003);
  ctx.strokeStyle = 'rgba(240,245,255,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 60, 0, TAU); ctx.stroke();
  drawGlow(ctx, 44, -40, 26, '255,255,255', 0.9);                      // 다이아몬드 반지
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#04040c'; ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fill();
  ctx.restore();
}

// 시간 정지 · 월식 화면 연출 (wskills 의 옛 연출을 대신한다)
{
  const ov = WS.overlay;
  WS.overlay = function (ctx) {
    ov.call(this, ctx);
    const T = Game.time;
    if (Game.tstopT > 0) {
      const a = Math.min(1, Game.tstopT / 20, (270 - Game.tstopT) / 12 + 0.2);
      ctx.save();
      ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${0.85 * a})`; ctx.fillRect(0, 0, W, H);   // 색이 빠진 세계
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(30,60,100,${0.22 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      drawCog(ctx, 40, H - 60, 210, 24, T * 0.002, null, `rgba(${CLK},${0.18 * a})`);
      drawCog(ctx, W - 30, 70, 170, 20, -T * 0.0025, null, `rgba(${CLK},${0.18 * a})`);
      ctx.globalCompositeOperation = 'source-over';
      drawClockFace(ctx, W / 2, H * 0.42, 240, 0.3 * a, T, true);
      const R = mulberry(31); ctx.fillStyle = `rgba(220,240,255,${0.6 * a})`;   // 허공에 멈춘 먼지
      for (let i = 0; i < 50; i++) ctx.fillRect(R() * W, R() * H, 2, 2);
      ctx.restore();
    }
    if (WS._tsBreak > 0) {                                             // 시계가 산산조각 난다
      const k = 1 - WS._tsBreak / 30;
      ctx.save(); ctx.translate(W / 2, H * 0.42);
      for (let i = 0; i < 12; i++) {
        const g = (i + 0.5) / 12 * TAU, d = k * 420;
        ctx.save(); ctx.translate(Math.cos(g) * d, Math.sin(g) * d + k * k * 200); ctx.rotate(k * (i % 2 ? 3 : -3)); ctx.globalAlpha = 0.6 * (1 - k);
        ctx.strokeStyle = '#d8f2ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-Math.cos(g) * 0, 0, 240, g - 0.26, g + 0.26); ctx.stroke();
        ctx.fillStyle = 'rgba(200,235,255,0.25)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 240, g - 0.26, g + 0.26); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    if (Game.eclipseT > 0) drawEclipse(ctx, Math.min(1, Game.eclipseT / 30, (360 - Game.eclipseT) / 20), T);
  };
  const tk = WS.tick;
  WS.tick = function () { tk.call(this); if (this._tsBreak > 0) this._tsBreak--; };
  const rs = WS.reset;
  WS.reset = function () { rs.call(this); this._tsBreak = 0; };
}

// 크로노 브레이크 해제 : 멈춘 동안 쌓인 피해가 한꺼번에 터진다
WS.timeResume = function () {
  const p = Game.player;
  this._tsBreak = 30;
  Game.flashScreen(0.6, '220,240,255'); Game.addShake(16); Game.zoomPunch(1.06);
  Sfx.play('explode', 1); Sfx.wlayer('clock', 3, true); Sfx.play('break', 0.8);
  FX.add('top', new Label(p.x, sy(p.y, p.z) - 200, 'TIME RESUME', { col: ['#ffffff', '#6fd0ff'], size: 34, life: 70 }));
  for (const e of Game.enemies) {
    if (!e.tsStore) continue;
    const v = e.tsStore * 0.6, X = e.x, Y = sy(e.y, e.z + e.h * 0.5); e.tsStore = 0;
    FX.add('ground', new FCircle(e.x, e.y, 70, 30, { kind: 'clock', col: CLK, col2: '255,255,255', grow: 4, spin: -0.2 }));
    FX.add('world', new FSlash(X, Y, rand(-0.8, 0.8), 90, { col: CLK, core: '255,255,255', th: 12 }));
    FF.impact(X, Y, CLK, 1.1); FF.spray('shard', X, Y, 8, { col: CLK, v0: 3, v1: 9, grav: 0.3, l0: 16, l1: 28 });
    this.dmg(p, e, v, { crit: true, hit: { dmg: 4, kx: 9, kz: 10, stun: 40 } });
  }
};

// 월식 중 치명타 : 창백한 달빛이 내리꽂힌다
WS.moonbeam = function (t) {
  if (this._mb && Game.frame - this._mb < 10) return;
  this._mb = Game.frame;
  FX.add('world', new FBeam(t.x, t.y, 34, 22, { col: MOON, core: '255,255,255', h: 640 }));
  FX.add('ground', new FRing(t.x, sy(t.y, 0), 10, 90, 16, { col: MOON, w: 6 }));
};

Object.assign(WH, {
  exGuillo: WS.hd({ dmg: 17, kx: 3, kz: 5, airKz: 6, stun: 60, stop: 16, shake: 14, fx: 'x', power: 2.4, noBack: true }),
  exSplash: WS.hd({ dmg: 4, kx: 6, kz: 6, airKz: 6, stun: 40, stop: 4, shake: 4, fx: 'blunt' }),
  exMarch: WS.hd({ dmg: 6.5, kx: 7, kz: 6, airKz: 7, stun: 50, stop: 5, shake: 5, fx: 'slash', power: 1.5 }),
  mnCres: WS.hd({ dmg: 2.2, kx: 2, airKz: 3, stun: 26, stop: 2, shake: 2, fx: 'slash' }),
  mnSmall: WS.hd({ dmg: 2.4, kx: 3, airKz: 4, stun: 26, stop: 3, shake: 2, fx: 'slash' }),
});

forgeDef('w11', {
  name: '시간 가속', mp: 120, cd: 16, ico: ['hourglass', '160,225,255'],
  desc: '등 뒤의 톱니바퀴가 맞물려 돌기 시작한다. 6초 동안 나만의 시간이 1.5배로 흐르고 이동·공격·스킬 동작이 모두 빨라진다.',
  act: {
    anim: 'win', len: 24, cancel: 12, atkCancel: 10,
    start(p) { p.vx = 0; },
    update(p, f) {
      if (f === 4) {
        p.hasteT = 360;
        FX.add('top', new Label(p.x, sy(p.y, p.z) - 180, 'HASTE', { col: ['#ffffff', '#6fd0ff'], size: 30, life: 60 }));
        FX.add('ground', new FCircle(p.x, p.y, 150, 40, { kind: 'clock', col: CLK, col2: '255,255,255', grow: 4, spin: 0.2 }));
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 230, 22, { col: CLK, w: 10 }));
        FX.add('world', new FChronoGears(p));
        FF.spray('spark', p.x, sy(p.y, 90), 18, { col: CLK, v0: 3, v1: 9, l0: 12, l1: 22, r0: 2, r1: 4 });
        Sfx.wlayer('clock', 3, true);
      }
    },
  },
}, {
  name: '크로노 브레이크', mp: 480, cd: 45, ico: ['clock', '160,225,255'],
  desc: '4.5초 동안 시간을 멈춘다. 세상의 색이 빠지고 거대한 시계가 걸리며 나만 움직일 수 있다. 멈춘 동안 넣은 피해의 60%가 시계가 산산조각 나며 시간이 다시 흐를 때 한꺼번에 터진다.',
  act: {
    anim: 'win', len: 24, cancel: 10, atkCancel: 8,
    start(p) { WS.cutin(p, '크로노 브레이크', 'CHRONO BREAK', '140,210,255'); p.vx = 0; },
    update(p, f) {
      if (f === 2) {
        Game.tstopT = 270; p.invul = Math.max(p.invul, 280);
        for (const e of Game.enemies) e.tsStore = 0;
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 900, 30, { col: CLK, w: 14 }));
        Game.flashScreen(0.5, '200,230,255'); Sfx.wlayer('clock', 3, true); Sfx.play('flash');
      }
    },
  },
});

forgeDef('w12', {
  name: '단두대', mp: 140, cd: 9, ico: ['guillotine', '230,50,80'],
  desc: '가장 약해진 적의 발밑에서 피의 룬이 새겨진 단두대가 솟아오르고 칼날이 떨어진다. 체력 40% 미만이면 즉사(보스 제외), 아니면 큰 피해.',
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
        FX.add('ground', new FCircle(x, y, 110, 34, { kind: 'rune', col: '255,50,70', col2: '255,190,200' }));
        FX.add('world', new FGuillotine(x, y, {
          dur: 30, follow: t, onImpact: b => {
            const gy = sy(b.y, 0), Y = gy - 70;
            Sfx.wlayer('exec', 3, true); Game.addShake(14); Game.freeze(5);
            FX.add('world', new FSlash(b.x, Y, -0.22, 150, { col: '255,50,70', core: '255,230,230', th: 14, dark: '40,0,8', bend: 0 }));
            FF.impact(b.x, Y, '255,60,80', 1.2);
            for (let k = 0; k < FF.n(18); k++) FX.add('world', new Drop(b.x, b.y, 60, { vx: rand(-7, 7), vz: rand(3, 10), r: rand(2.5, 4), col: '#9a1022', splat: true }));
            FX.add('ground', new FDecal(b.x, b.y, 90, 220, { kind: 'pool', col: '110,0,16' }));
            if (t && t.hittable()) {
              if (!t.isBoss && t.hp / t.hpMax < 0.4) {
                FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 60, 'EXECUTE', { col: ['#ffe0e0', '#ff3a50'], size: 34, life: 70 }));
                FF.screen({ col: '160,0,20', a: 0.3, life: 20, fin: 1, fout: 14 });
                Game.slowmo(0.3, 16);
                Status.dot(t, t.hp + 1, '255,60,80');
              } else applyHit(p, t, WH.exGuillo, { noStopAtt: true, dir: p.facing });
            }
            WS.area(p, b.x, b.y, 150, 60, WH.exSplash, { skip: e => e === t });
          },
        }));
      }
    },
  },
}, {
  name: '망자의 행진', mp: 480, cd: 42, ico: ['helmet', '140,255,210'],
  desc: '혼불을 두른 망자의 기사 다섯이 등 뒤 안개 속에서 나타나 화면 끝까지 행진하며 앞을 막는 모든 적을 베어 넘긴다.',
  act: {
    anim: 'win', len: 40, cancel: 28, atkCancel: 24,
    start(p) { forgeCine(p, '망자의 행진', '亡 者 行 進', '120,255,200', { bars: 60, dim: 0.35 }); p.invul = 120; p.vx = 0; },
    update(p, f) {
      if (f === 6) {
        const x0 = p.x - p.facing * 240;
        FF.screen({ col: '20,60,50', a: 0.2, life: 120, fin: 10, fout: 30 });
        for (let i = 0; i < 5; i++) {
          const y = clamp(14 + i * 50, 0, DEPTH), x = x0 - p.facing * (i % 2) * 60;
          FX.add('ground', new FCircle(x, y, 60, 30 + i * 5, { kind: 'rune', col: '120,255,200', col2: '220,255,240', grow: 6 }));
          FX.add('world', new FMarcher(p, x, y, p.facing, i * 5));
        }
        Sfx.play('roar', 0.5, 0.8); Sfx.wlayer('exec', 2, false); Game.addShake(6);
      }
      if (f === 30) forgeUndim(30);
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w13', {
  name: '분열 초승달', mp: 130, cd: 8, ico: ['crescent', '200,220,255'],
  desc: '분화구까지 새겨진 거대한 초승달을 던진다. 천천히 날아가며 여러 번 베고, 끝에 닿으면 작은 초승달 여섯 개로 갈라져 별가루를 흩뿌리며 사방으로 흩어진다.',
  act: {
    anim: 'a2', len: 28, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 7) {
        Sfx.pplay('swingBig'); Sfx.wlayer('moon', 2, false);
        FX.add('world', new FMoonBlade(p, p.x + p.facing * 50, p.y, p.z + 70, p.facing * 8.5, 0, {
          R: 62, life: 48, rehit: 10, hd: WH.mnCres,
          onEnd: s => {
            Sfx.wlayer('moon', 2, true);
            FF.impact(s.x, sy(s.y, s.z), MOON, 0.9);
            FF.spray('star', s.x, sy(s.y, s.z), 14, { col: MOON, v0: 2, v1: 8, l0: 20, l1: 34 });
            for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; FX.add('world', new FMoonBlade(p, s.x, s.y, s.z, Math.cos(a) * 11, Math.sin(a) * 4, { R: 26, life: 26, hd: WH.mnSmall, small: true })); }
          },
        }));
      }
    },
  },
}, {
  name: '월식', mp: 480, cd: 42, ico: ['eclipse', '200,220,255'],
  desc: '6초 동안 달이 해를 가려 하늘에 별이 뜬다. 어둠 속에서 적은 길을 잃어 공격하지 못하고, 내 공격은 전부 치명타(피해 +60%)가 되어 창백한 달빛이 내리꽂힌다.',
  act: {
    anim: 'win', len: 30, cancel: 16, atkCancel: 14,
    start(p) { WS.cutin(p, '월식', '月 蝕', '170,190,255'); p.vx = 0; },
    update(p, f) {
      if (f === 4) {
        Game.eclipseT = 360; Game.flashScreen(0.4, '30,30,60'); Sfx.wlayer('moon', 3, true);
        FX.add('ground', new FCircle(p.x, p.y, 200, 70, { kind: 'star', col: MOON, col2: '255,255,255' }));
        for (const e of Game.enemies) if (e.act && !e.isBoss) e.interrupt();
      }
    },
  },
});

// ============================================================
//  유성검 스타폴 : 별을 이어 그리는 별자리 · 꼬리가 긴 별똥별
// ============================================================
const STAR = '255,236,150';
function drawStar4(ctx, x, y, r, rot = 0) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rot, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }

class FConstellation {
  constructor(list, life) { Object.assign(this, { list: list.slice().sort((a, b) => a.x - b.x), life, t: 0, add: true }); }
  pt(e) { return [e.x, sy(e.y, e.z + e.h * 0.6)]; }
  update() { this.t++; if (this.t % 3 === 0) for (const e of this.list) if (!e.dead && chance(0.3)) { const [x, y] = this.pt(e); FX.add('world', new FP(x + rand(-20, 20), y + rand(-20, 20), { kind: 'star', col: STAR, vy: -0.3, r: rand(2, 4), life: 18 })); } return this.t < this.life; }
  draw(ctx) {
    const T = this.t, n = this.list.length, a = Math.min(1, (this.life - T) / 6);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {                                    // 별 표식이 하나씩 켜진다
      const e = this.list[i], on = Math.min(1, Math.max(0, (T - i * 4) / 6)); if (on <= 0) continue;
      const [x, y] = this.pt(e), tw = 0.8 + 0.2 * Math.sin(T * 0.4 + i);
      drawGlow(ctx, x, y, 50 * on, STAR, 0.6 * a);
      ctx.fillStyle = `rgba(255,250,220,${a})`; drawStar4(ctx, x, y, 26 * on * tw, T * 0.03);
      ctx.strokeStyle = `rgba(${STAR},${0.7 * a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 18 * on, 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < n - 1; i++) {                               // 별을 잇는 선이 그어진다
      const k = Math.min(1, Math.max(0, (T - 6 - i * 4) / 8)); if (k <= 0) continue;
      const [x0, y0] = this.pt(this.list[i]), [x1, y1] = this.pt(this.list[i + 1]), xe = lerp(x0, x1, k), ye = lerp(y0, y1, k);
      ctx.strokeStyle = `rgba(${STAR},${0.35 * a})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xe, ye); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,240,${0.9 * a})`; ctx.lineWidth = 1.6; ctx.stroke();
      const m = (T * 0.05 + i * 0.3) % 1; drawGlow(ctx, lerp(x0, xe, m), lerp(y0, ye, m), 12, '255,255,255', a);
    }
    ctx.restore();
  }
}

class FShootingStar {
  constructor(p, x, y, o = {}) { Object.assign(this, { p, x, y, t: 0, add: true, dur: o.dur || 16, from: o.from ?? rand(-260, 260), r: o.r || 16, onEnd: o.onEnd }); }
  pos(t) { const k = Math.min(1, t / this.dur), gy = sy(this.y, 0); return [this.x - this.from * (1 - k), lerp(gy - 820, gy - 6, k)]; }
  update() {
    this.t++;
    const [X, Y] = this.pos(this.t);
    if (this.t % 2 === 0) FX.add('world', new FP(X + rand(-6, 6), Y + rand(-6, 6), { kind: 'star', col: STAR, vx: rand(-1, 1), vy: rand(-1, 1), r: rand(2, 4), life: 16 }));
    if (this.t >= this.dur) { if (this.onEnd) this.onEnd(this); return false; }
    return true;
  }
  draw(ctx) {
    const [X, Y] = this.pos(this.t), [X0, Y0] = this.pos(Math.max(0, this.t - 7)), dx = X - X0, dy = Y - Y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, r = this.r;
    const tx = X - dx * 3.2, ty = Y - dy * 3.2;                       // 꼬리
    const g = ctx.createLinearGradient(tx, ty, X, Y); g.addColorStop(0, `rgba(${STAR},0)`); g.addColorStop(0.7, `rgba(${STAR},0.55)`); g.addColorStop(1, 'rgba(255,255,240,0.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(X + nx * r, Y + ny * r); ctx.lineTo(X - nx * r, Y - ny * r); ctx.closePath(); ctx.fill();
    drawGlow(ctx, X, Y, r * 4, STAR, 0.8); ctx.fillStyle = '#fffbe8'; drawStar4(ctx, X, Y, r * 1.6, this.t * 0.3);
  }
}

// ============================================================
//  암살검 쉐도우팽 : 그림자 웅덩이로 녹아드는 습격 · 분신
// ============================================================
const SHD = '150,100,235';
class FShadowPool {
  constructor(x, y, life, o = {}) { Object.assign(this, { x, y, life, t: 0, add: false, r: o.r || 70, seed: randi(1, 9999) }); }
  update() { this.t++; if (this.t % 2 === 0 && this.t < this.life - 8) FX.add('world', new FP(this.x + rand(-this.r, this.r) * 0.7, sy(this.y, 2), { kind: 'flame', col: '120,70,210', vx: rand(-0.5, 0.5), vy: -rand(1, 3), r: rand(4, 8), life: 18 })); return this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, k = Math.min(1, this.t / 5) * (u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1), gy = sy(this.y, 0), R = mulberry(this.seed), r = this.r * k;
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,20,0.85)'; ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const g = i / 20 * TAU, w = 0.75 + R() * 0.35 + Math.sin(this.t * 0.2 + i) * 0.05; i ? ctx.lineTo(this.x + Math.cos(g) * r * w, gy + Math.sin(g) * r * 0.3 * w) : ctx.moveTo(this.x + Math.cos(g) * r * w, gy + Math.sin(g) * r * 0.3 * w); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,8,36,0.9)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();    // 그림자 촉수
    for (let i = 0; i < 6; i++) { const g = i / 6 * TAU + R(), L = r * (0.9 + R() * 0.6), x0 = this.x + Math.cos(g) * r * 0.6, y0 = gy + Math.sin(g) * r * 0.18; ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + Math.cos(g) * L * 0.3, y0 - L * 0.5, x0 + Math.cos(g + Math.sin(this.t * 0.15 + i)) * L * 0.4, y0 - L * (0.6 + 0.3 * Math.sin(this.t * 0.2 + i))); }
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${SHD},0.6)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(this.x, gy, r * 0.95, r * 0.28, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
//  천공의 성검 세라핌 : 깃털이 겹겹이 달린 날개 · 깃털 화살 · 후광
// ============================================================
const SER = '255,250,225';
class FWings {
  //  cond() 가 참인 동안 플레이어 등에 달린 날개. o.s 크기 · o.big 대천사
  //  FX 레이어는 캐릭터 위에 그려지므로, 날개는 플레이어가 몸을 그리기 직전에 paint() 로 직접 그린다 (player.js)
  constructor(p, cond, o = {}) { Object.assign(this, { p, cond, t: 0, add: false, s: o.s || 1, big: !!o.big, out: 0 }); p.wingFx = this; }
  update() { this.t++; if (!this.cond()) this.out++; const on = this.out < 12 && this.p.hp > 0; if (!on && this.p.wingFx === this) this.p.wingFx = null; return on; }
  draw() { }
  paint(ctx) {
    const p = this.p; if (!p.visible) return;
    const a = Math.min(1, this.t / 8) * (1 - this.out / 12), s = this.s * Math.min(1, this.t / 10), X = p.x - p.facing * 8, Y = sy(p.y, p.z + 104), fl = Math.sin(this.t * (this.big ? 0.1 : 0.3)) * (this.big ? 0.12 : 0.35);
    ctx.save(); ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y - 30 * s, 180 * s, '255,240,190', this.big ? 0.4 : 0.25); ctx.globalCompositeOperation = 'source-over';
    for (const side of [-p.facing, p.facing]) {
      const back = side === -p.facing;                                  // 뒤쪽 날개는 살짝 작고 어둡게
      ctx.save(); ctx.translate(X, Y); ctx.scale(side * s * (back ? 0.82 : 1), s * (back ? 0.9 : 1));
      ctx.rotate(-0.25 - fl);
      const bone = [[0, 0], [52, -54], [118, -76], [176, -60]];         // 날개 뼈
      const rows = [[11, 1, '#ffffff', 96], [10, 0.8, '#fff6dc', 64], [9, 0.6, '#ffeec0', 36]];
      for (const [n, len, col, L] of rows) {
        for (let i = n - 1; i >= 0; i--) {
          const k = i / (n - 1), seg = Math.min(2, Math.floor(k * 3)), q = k * 3 - seg, b0 = bone[seg], b1 = bone[seg + 1];
          const bx = lerp(b0[0], b1[0], q), by = lerp(b0[1], b1[1], q), ang = Math.PI / 2 - 0.15 + k * 0.9, l = L * (0.7 + k * 0.6) * (back ? 0.9 : 1);
          const ex = bx + Math.cos(ang) * l, ey = by + Math.sin(ang) * l, w = 18 * len + 8;
          ctx.fillStyle = back ? '#d8d0c0' : col; ctx.strokeStyle = 'rgba(160,140,100,0.55)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(bx - w * 0.5, by); ctx.bezierCurveTo(bx - w * 0.9, (by + ey) / 2, ex - w * 0.7, ey - w * 0.4, ex, ey); ctx.bezierCurveTo(ex + w * 0.5, ey - w * 0.6, bx + w * 0.8, (by + ey) / 2, bx + w * 0.5, by); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex - w * 0.05, ey - w * 0.2); ctx.stroke();
        }
      }
      ctx.strokeStyle = back ? '#c8c0b0' : '#fffaf0'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); bone.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      ctx.restore();
    }
    if (this.big) {                                                     // 후광
      const hy = sy(p.y, p.z + 168), hx = p.x;
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,170,0.9)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(hx, hy, 30, 8, 0, 0, TAU); ctx.stroke(); drawGlow(ctx, hx, hy, 50, '255,240,170', 0.6);
    }
    ctx.restore();
  }
}

class FFeather {
  constructor(p, x, y, z, t, o = {}) { Object.assign(this, { p, x, y, z, tg: t, t: 0, add: true, life: 34, vx: o.vx || 0, vy: o.vy || -4, hd: o.hd }); this.sx = this.x; this.sy = sy(y, z); this.px = this.sx; this.py = this.sy; }
  update() {
    this.t++; const e = this.tg;
    const tx = e && e.hittable() ? e.x : this.px + this.vx * 2, ty = e && e.hittable() ? sy(e.y, e.z + e.h * 0.5) : this.py + 30;
    const k = Math.min(1, this.t / 14);
    this.vx = lerp(this.vx, (tx - this.px) * 0.25, 0.15 + k * 0.3); this.vy = lerp(this.vy, (ty - this.py) * 0.25, 0.15 + k * 0.3);
    const sp = Math.hypot(this.vx, this.vy); if (sp > 22) { this.vx *= 22 / sp; this.vy *= 22 / sp; }
    this.px += this.vx; this.py += this.vy;
    if (this.t % 2 === 0) FX.add('world', new FP(this.px, this.py, { kind: 'glow', col: SER, r: 5, life: 10 }));
    if (e && e.hittable() && Math.abs(this.px - tx) < 24 + e.w && Math.abs(this.py - ty) < 40) {
      applyHit(this.p, e, this.hd, { noStopAtt: true, dir: sign(this.vx) || 1 });
      FX.add('world', new FRing(this.px, this.py, 4, 40, 10, { col: SER, w: 3, ry: 1, fill: 0 }));
      FF.spray('feather', this.px, this.py, 3, { col: SER, v0: 1, v1: 4, l0: 20, l1: 30, r0: 3, r1: 5, grav: 0.05 });
      return false;
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const ang = Math.atan2(this.vy, this.vx), X = this.px, Y = this.py;
    ctx.save(); ctx.translate(X, Y); ctx.rotate(ang);
    const g = ctx.createLinearGradient(-60, 0, 0, 0); g.addColorStop(0, `rgba(${SER},0)`); g.addColorStop(1, `rgba(${SER},0.6)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.fill();
    drawGlow(ctx, 0, 0, 22, '255,240,190', 0.7);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(-4, -8, -16, -3); ctx.lineTo(-18, 0); ctx.lineTo(-16, 3); ctx.quadraticCurveTo(-4, 8, 10, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(200,170,90,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-20, 0); ctx.stroke();
    ctx.restore();
  }
}

// ============================================================
//  마검 카오스 엣지 : 무지갯빛 균열 · 세상을 가르는 열두 참격 · 산산조각
// ============================================================
class FChaosRift {
  constructor(p, x, y) { Object.assign(this, { p, x, y, t: 0, life: 172, add: false, seed: randi(1, 9999) }); }
  update() {
    this.t++;
    const X = this.x, Y = sy(this.y, 150);
    if (this.t % 3 === 0) FX.add('world', new FP(X + rand(-20, 20), Y + rand(-50, 50), { kind: 'bit', col: hslRgb(rand(0, 360), 0.9, 0.65).join(','), vx: rand(-4, 4), vy: rand(-4, 4), r: rand(3, 6), life: 20 }));
    if (this.t % 24 === 12) {
      const p = this.p, list = WS.nearest(this.x, this.y, 99, 750);
      const e = list.length ? choose(list) : null;
      if (e) {
        const kind = choose(['fire', 'ice', 'elec', 'void', 'poison']), EX = e.x, EY = sy(e.y, e.z + e.h * 0.5), gy = sy(e.y, 0);
        const col = { fire: '255,130,40', ice: '170,230,255', elec: '255,240,110', void: '190,100,255', poison: '140,235,80' }[kind];
        FX.add('world', new FLightning(X, Y, EX, EY, { col, w: 3, br: 2, life: 10, glow: 0.6 }));
        if (kind === 'fire') { FX.add('world', new FBeam(e.x, e.y, 46, 26, { col, core: '255,230,170', h: 360 })); FF.spray('flame', e.x, gy - 20, 14, { col, ang: -Math.PI / 2, spread: 0.8, v0: 3, v1: 9 }); Status.add(e, 'burn', { t: 180, d: p.atk * 0.3 }); }
        if (kind === 'ice') { FF.spray('shard', EX, EY, 14, { col, v0: 3, v1: 9, grav: 0.3 }); FX.add('ground', new FDecal(e.x, e.y, 70, 120, { kind: 'frost' })); Status.add(e, 'freeze', { t: 70 }); }
        if (kind === 'elec') { FX.add('world', new FLightning(EX + rand(-30, 30), 0, EX, EY, { w: 5, life: 12, br: 4 })); Status.add(e, 'shock', { t: 30 }); }
        if (kind === 'void') { for (const o of WS.nearest(e.x, e.y, 6, 260, e)) if (!o.isBoss) { o.x = lerp(o.x, e.x, 0.6); o.y = lerp(o.y, e.y, 0.5); } FX.add('ground', new FRing(e.x, gy, 240, 10, 18, { col, w: 8 })); FF.spray('glow', EX, EY, 14, { col, tx: EX, ty: EY, pull: 0.1 }); }
        if (kind === 'poison') { Status.add(e, 'poison', { t: 240, d: p.atk * 0.12, n: 3 }); FF.spray('bubble', EX, EY, 14, { col, v0: 2, v1: 7, grav: 0.2 }); FX.add('ground', new FDecal(e.x, e.y, 70, 160, { kind: 'pool', col: '60,130,20' })); }
        FF.impact(EX, EY, col, 0.8);
        WS.area(p, e.x, e.y, 90, 50, WH.chRift);
        Sfx.wlayer(kind === 'elec' ? 'elec' : kind === 'void' ? 'void' : kind === 'poison' ? 'poison' : kind, 2, false);
      }
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const X = this.x, Y = sy(this.y, 150), T = this.t, a = Math.min(1, T / 10, (this.life - T) / 12), R = mulberry(this.seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) drawGlow(ctx, X + Math.cos(T * 0.05 + i * 2) * 20, Y + Math.sin(T * 0.07 + i * 2) * 30, 130, hslRgb((T * 3 + i * 120) % 360, 0.9, 0.6).join(','), 0.35 * a, 0.6, 1.4);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a;
    const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12, w = (i % 2 ? 14 : 30) * Math.sin(k * Math.PI) + 4; pts.push([X + (R() - 0.5) * 20 + Math.sin(T * 0.2 + i) * 3, Y - 110 + k * 220, w]); }
    ctx.fillStyle = '#06000c'; ctx.beginPath(); pts.forEach(([x, y, w], i) => i ? ctx.lineTo(x - w, y) : ctx.moveTo(x - w, y)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + pts[i][2], pts[i][1]); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 3;
    for (const sgn of [-1, 1]) { ctx.beginPath(); pts.forEach(([x, y, w], i) => { ctx.strokeStyle = `hsl(${(T * 4 + i * 30) % 360},100%,70%)`; }); pts.forEach(([x, y, w], i) => i ? ctx.lineTo(x + sgn * w, y) : ctx.moveTo(x + sgn * w, y)); ctx.stroke(); }
    ctx.restore();
  }
}

class FShatter {
  //  화면이 유리처럼 깨져 쏟아진다 (top 레이어 · 월드 좌표에 카메라 기준으로 배치)
  constructor() {
    this.t = 0; this.life = 80; this.add = false; this.list = [];
    const cx = Game.cam.x, n = 9, m = 6, jit = (i, j) => [cx + (i / n) * W + (i && i < n ? rand(-40, 40) : 0), (j / m) * H + (j && j < m ? rand(-30, 30) : 0)];
    const G = []; for (let i = 0; i <= n; i++) { G.push([]); for (let j = 0; j <= m; j++) G[i].push(jit(i, j)); }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) for (const tri of [[G[i][j], G[i + 1][j], G[i + 1][j + 1]], [G[i][j], G[i + 1][j + 1], G[i][j + 1]]]) {
      const c = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3], dx = c[0] - (cx + W / 2), dy = c[1] - H / 2;
      this.list.push({ pts: tri.map(([x, y]) => [x - c[0], y - c[1]]), x: c[0], y: c[1], vx: dx * 0.03 + rand(-2, 2), vy: dy * 0.03 + rand(-6, -1), r: 0, vr: rand(-0.12, 0.12), c: hslRgb(rand(0, 360), 0.8, 0.7).join(','), d: rand(0, 8) | 0 });
    }
  }
  update() { this.t++; for (const s of this.list) if (this.t > s.d) { s.x += s.vx; s.y += s.vy; s.vy += 0.7; s.r += s.vr; } return this.t < this.life; }
  draw(ctx) {
    const a = 1 - this.t / this.life;
    for (const s of this.list) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r);
      ctx.beginPath(); s.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
      const g = ctx.createLinearGradient(s.pts[0][0], s.pts[0][1], s.pts[2][0], s.pts[2][1]); g.addColorStop(0, `rgba(255,255,255,${0.4 * a})`); g.addColorStop(1, `rgba(${s.c},${0.2 * a})`);
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  }
}

Object.assign(WH, {
  stMeteor: WS.hd({ dmg: 3.4, kx: 3, kz: 8, airKz: 7, stun: 40, stop: 4, shake: 5, fx: 'none', sfx: 'heavy', power2: 2 }),
  shStab: WS.hd({ dmg: 10, kx: 3, kz: 0, airKz: 4, stun: 90, stop: 14, shake: 10, fx: 'x', power: 2.2, crit: 1 }),
  sfFeather: WS.hd({ dmg: 1.7, kx: 1, airKz: 2, stun: 20, stop: 2, shake: 1, fx: 'pierce' }),
  chRift: WS.hd({ dmg: 5, kx: 3, kz: 6, airKz: 6, stun: 40, stop: 5, shake: 4, fx: 'none', power2: 2 }),
  chSlash: WS.hd({ dmg: 2.3, kx: 1, airKz: 3, stun: 40, stop: 2, shake: 3, fx: 'slash', power2: 1 }),
  chFinal: WS.hd({ dmg: 34, kx: 10, kz: 16, airKz: 14, stun: 80, stop: 20, shake: 22, fx: 'heavy', power: 3 }),
});

forgeDef('w14', {
  name: '별자리 폭발', mp: 150, cd: 9, ico: ['constellation', '255,236,150'],
  desc: '근처 적 최대 7명에게 하나씩 별을 새기고 빛의 선으로 이어 별자리를 그린다. 별자리가 완성되면 별마다 초신성처럼 터지며, 이은 별의 수만큼 강해진다.',
  act: {
    anim: 'ultUp', len: 64, cancel: 58, atkCancel: 56,
    start(p) { p.vx = 0; p.stars = WS.nearest(p.x, p.y, 7, 650); },
    update(p, f) {
      p.vx = 0;
      if (f === 4 && p.stars.length) { FX.add('world', new FConstellation(p.stars, 50)); FX.add('ground', new FCircle(p.x, p.y, 120, 56, { kind: 'star', col: STAR, col2: '255,255,255' })); Sfx.wlayer('star', 2, false); }
      if (f === 44) { p.bladeGlow = 2; Sfx.play('charge', 0.6, 1.5); }
      if (f === 52) {
        const n = p.stars.length;
        if (!n) { WS.area(p, p.x + p.facing * 120, p.y, 140, 60, WH.stMeteor); return; }
        const hd = WS.hd({ dmg: 2.5 + n * 0.75, kx: 4, kz: 9, airKz: 8, stun: 50, stop: 8, shake: 8, fx: 'heavy', power: 1.8 });
        for (const e of p.stars) if (e.hittable()) {
          const X = e.x, Y = sy(e.y, e.z + e.h * 0.6);
          FX.add('world', new FBeam(e.x, e.y, 26, 18, { col: STAR, h: 500 }));
          FX.add('world', new FRing(X, Y, 10, 120, 18, { col: STAR, w: 6, ry: 1, fill: 0.2 }));
          FF.impact(X, Y, STAR, 1); FF.spray('star', X, Y, 10, { col: STAR, v0: 3, v1: 10, l0: 18, l1: 30 });
          applyHit(p, e, hd, { noStopAtt: true });
        }
        Sfx.wlayer('star', 3, true); Sfx.play('explode', 0.6); Game.addShake(10); Game.flashScreen(0.2, '255,245,200');
        p.stars = [];
      }
    },
  },
}, {
  name: '유성우', mp: 480, cd: 42, ico: ['meteors', '255,236,150'],
  desc: '밤하늘을 불러낸다. 3초 동안 긴 꼬리를 끄는 별똥별 수십 개가 화면 안의 적에게 쏟아지고, 떨어진 자리마다 별빛이 터진다.',
  act: {
    anim: 'ultUp', len: 40, cancel: 26, atkCancel: 22,
    start(p) { forgeCine(p, '유성우', '流 星 雨', '255,226,130', { bars: 60, dim: 0.3 }); p.invul = 120; p.vx = 0; },
    update(p, f) {
      if (f === 6) {
        Sfx.wlayer('star', 3, true); Game.flashScreen(0.25, '255,245,200');
        FF.screen({ col: '10,14,50', a: 0.4, life: 200, fin: 20, fout: 30 });
        FX.add('world', new FRun(180, r => {
          if (r.t % 5) return;
          const list = WS.onScreen(), e = list.length && chance(0.75) ? choose(list) : null;
          const x = e ? e.x + rand(-30, 30) : Game.cam.x + rand(80, W - 80), y = e ? e.y : rand(10, DEPTH - 10);
          FX.add('world', new FShootingStar(p, x, y, {
            r: rand(12, 20), onEnd: m => {
              const gy = sy(m.y, 0);
              FX.add('world', new FP(m.x, gy - 10, { kind: 'glow', col: STAR, r: 70, life: 12 }));
              FX.add('ground', new FRing(m.x, gy, 10, 120, 16, { col: STAR, w: 7 }));
              FX.add('ground', new FDecal(m.x, m.y, 50, 90, { kind: 'glyph', col: STAR }));
              FF.spray('star', m.x, gy - 10, 6, { col: STAR, ang: -Math.PI / 2, spread: 1.2, v0: 3, v1: 8, grav: 0.2 });
              Sfx.wlayer('star', 1, false); Game.addShake(3);
              WS.area(p, m.x, m.y, 92, 44, WH.stMeteor);
            },
          }));
        }));
      }
      if (f === 20) forgeUndim(30);
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w15', {
  name: '그림자 습격', mp: 110, cd: 7, ico: ['dagger', '150,100,235'],
  desc: '발밑의 그림자 웅덩이로 녹아 사라졌다가, 앞쪽 가장 먼 적의 그림자에서 솟아올라 확정 치명타 기습. 맞은 적은 오래 기절한다.',
  act: {
    anim: 'back', len: 42, cancel: 30, atkCancel: 26,
    start(p) {
      const list = Game.enemies.filter(e => e.hittable() && (e.x - p.x) * p.facing > 0 && Math.abs(e.x - p.x) < 650);
      p.ambush = list.sort((a, b) => Math.abs(b.x - p.x) - Math.abs(a.x - p.x))[0] || WS.nearest(p.x, p.y, 1, 650)[0] || null;
      p.invul = Math.max(p.invul, 30); p.vx = 0;
      FX.add('ground', new FShadowPool(p.x, p.y, 30));
      Sfx.wlayer('shadow', 2, false);
    },
    update(p, f) {
      p.vx = 0;
      if (f < 3) FF.spray('flame', p.x, sy(p.y, 60), 4, { col: '120,70,210', ang: -Math.PI / 2, spread: 0.5, v0: 1, v1: 4, l0: 14, l1: 22, rx: 20, ry: 50 });
      if (f === 2) p.visible = false;
      const t = p.ambush;
      if (f === 6 && t) FX.add('ground', new FShadowPool(t.x + (sign(t.x - p.x) || p.facing) * 62, t.y, 34));
      if (f === 12) {
        if (t && t.hittable()) { const d = sign(t.x - p.x) || p.facing; p.x = p.px = clamp(t.x + d * 62, Game.room.minX, Game.room.maxX); p.y = t.y; p.facing = -d; }
        else p.x = clamp(p.x + p.facing * 200, Game.room.minX, Game.room.maxX);
        p.visible = true; swingT(p, 'a3', 1.3);
        FF.spray('flame', p.x, sy(p.y, 40), 12, { col: '120,70,210', ang: -Math.PI / 2, spread: 0.6, v0: 2, v1: 6, l0: 14, l1: 24, rx: 20 });
      }
      if (f === 16 && t && t.hittable()) {
        const X = t.x, Y = sy(t.y, t.z + t.h * 0.5);
        applyHit(p, t, WH.shStab, { dir: p.facing });
        Status.add(t, 'shock', { t: 50 });
        for (const k of [-1, 1]) FX.add('world', new FSlash(X, Y, k * 0.8, 100, { col: SHD, core: '245,235,255', th: 12, dark: '10,0,24' }));
        FF.impact(X, Y, SHD, 1.1); FF.screen({ kind: 'vig', col: '20,0,40', a: 0.5, life: 24, fin: 1, fout: 14 });
        FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 60, 'BACKSTAB', { col: ['#f0e0ff', '#9a6aff'], size: 28 }));
        Sfx.wlayer('shadow', 3, true); Game.freeze(4);
      }
    },
    end(p) { p.visible = true; },
  },
}, {
  name: '천의 그림자', mp: 480, cd: 42, ico: ['clones', '150,100,235'],
  desc: '발밑의 그림자에서 분신 넷이 솟아 7초 동안 내 곁에 선다. 내가 적을 벨 때마다 분신들이 사방에서 같은 적을 따라 벤다.',
  act: {
    anim: 'win', len: 30, cancel: 14, atkCancel: 12,
    start(p) { forgeCine(p, '천의 그림자', '千 影', '140,90,230', { bars: 40, dim: 0.35 }); p.vx = 0; },
    update(p, f) {
      if (f === 4) {
        p.cloneT = 420; Sfx.wlayer('shadow', 3, true);
        FX.add('ground', new FShadowPool(p.x, p.y, 60, { r: 150 }));
        FF.spray('flame', p.x, sy(p.y, 60), 24, { col: '120,70,210', ang: -Math.PI / 2, spread: 0.9, v0: 2, v1: 7, rx: 80, ry: 40 });
        forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});

// 천의 그림자 : 분신이 사방에서 따라 벤다
WS.cloneStrike = function (p, t) {
  if (this._cl && Game.frame - this._cl < 4) return;
  this._cl = Game.frame;
  for (let i = 0; i < 4; i++) Gear.later(3 + i * 2, () => {
    if (!t.hittable()) return;
    const a = i * 1.57 + 0.6, X = t.x + Math.cos(a) * 60, Y = sy(t.y, t.z + t.h * 0.5);
    FX.add('world', new FSlash(t.x, Y + Math.sin(a) * 20, a + 1.2, 70, { col: SHD, core: '240,230,255', th: 7, life: 12, dark: '10,0,24', sparks: false }));
    p.addGhost(t.x + (i % 2 ? 1 : -1) * 70, t.y, t.z, i % 2 ? -1 : 1, lerpPose(PP.a1s, PP.a2s, i / 4, P()), 10, '150,100,235');
    Gear.proc(p, t, 0.32, { quiet: i > 0 });
  });
};

forgeDef('w16', {
  name: '천사의 비상', mp: 150, cd: 10, ico: ['feather', '255,250,225'],
  desc: '등에 깃털 날개가 돋아 3초 동안 날아올라 공중에 머물며 이동한다. 그동안 아래의 적들에게 빛나는 깃털 화살이 휘어 날아가 꽂힌다.',
  act: {
    anim: 'air', len: 180, cancel: 170, atkCancel: 999,
    start(p) { p.gravOff = true; p.armorF = true; Sfx.wlayer('wing', 3, true); Sfx.play('jump'); FX.add('world', new FWings(p, () => p.act && p.act.name === 'w16s5', { s: 0.75 })); FF.spray('feather', p.x, sy(p.y, 80), 14, { col: SER, v0: 2, v1: 6, grav: 0.05, l0: 30, l1: 50 }); },
    update(p, f) {
      p.armorF = true;
      p.z = f < 160 ? lerp(p.z, 150, 0.12) : p.z;
      p.vz = 0;
      const ax = Input.axisX(); if (ax) p.facing = ax;
      p.vx = ax * 4.2; p.vy = Input.axisY() * 2.6;
      if (f % 5 === 0) FX.add('world', new FP(p.x + rand(-60, 60), sy(p.y, p.z + rand(60, 130)), { kind: 'feather', col: SER, vx: rand(-1, 1), vy: rand(0, 1), grav: 0.04, r: rand(4, 6), life: 50 }));
      if (f >= 14 && f <= 160 && f % 7 === 0) {
        const t = WS.nearest(p.x, p.y, 1, 600)[0];
        FX.add('world', new FFeather(p, p.x - p.facing * 30, p.y, p.z + 110, t, { vx: -p.facing * rand(3, 7), vy: rand(-8, -3), hd: WH.sfFeather }));
        if (f % 21 === 0) Sfx.wlayer('wing', 0, false);
      }
      if (f === 160) { p.gravOff = false; }
    },
    end(p) { p.gravOff = false; },
    noAirEnd: true,
  },
}, {
  name: '대천사 강림', mp: 480, cd: 45, ico: ['angel', '255,250,225'],
  desc: '하늘에서 빛기둥이 내려와 7초 동안 대천사가 된다. 후광과 거대한 날개가 돋고 모든 피해를 받지 않으며 HP가 계속 회복되고, 0.8초마다 성광의 고리가 주변 적을 밀어낸다.',
  act: {
    anim: 'win', len: 34, cancel: 16, atkCancel: 14,
    start(p) { forgeCine(p, '대천사 강림', '大 天 使 降 臨', '255,240,190', { bars: 40, dim: 0.3 }); p.vx = 0; },
    update(p, f) {
      if (f === 4) {
        p.angelT = 420; Sfx.wlayer('holy', 3, true); Sfx.play('clear', 0.6);
        FX.add('world', new FBeam(p.x, p.y, 130, 40, { col: '255,240,190', core: '255,255,255', h: 900 }));
        FX.add('ground', new FCircle(p.x, p.y, 200, 60, { kind: 'sun', col: '255,240,190', col2: '255,255,255' }));
        FX.add('world', new FWings(p, () => p.angelT > 0, { s: 1.25, big: true }));
        FF.spray('feather', p.x, sy(p.y, 100), 30, { col: SER, v0: 3, v1: 10, grav: 0.05, l0: 40, l1: 60, r0: 4, r1: 7 });
        Game.flashScreen(0.5, '255,250,230'); forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w17', {
  name: '혼돈의 균열', mp: 160, cd: 10, ico: ['rift', '255,90,200'],
  desc: '허공을 찢어 무지갯빛으로 일렁이는 균열을 연다. 균열은 3초 동안 불기둥·얼음 파편·낙뢰·공허 흡인·독 폭발 중 무작위 주문을 적에게 퍼붓는다.',
  act: {
    anim: 'a4', len: 30, cancel: 18, atkCancel: 16,
    update(p, f) {
      p.vx *= 0.6;
      if (f === 7) FX.add('world', new FSlash(p.x + p.facing * 150, sy(p.y, 150), Math.PI / 2 + 0.2, 120, { col: '255,90,200', core: '255,255,255', th: 12 }));
      if (f === 9) { FX.add('world', new FChaosRift(p, p.x + p.facing * 150, p.y)); Sfx.wlayer('chaos', 3, true); Game.addShake(5); }
    },
  },
}, {
  name: '종말의 검', mp: 480, cd: 45, ico: ['shatter', '255,90,200'],
  desc: '세상 자체를 벤다. 화면 전체를 가르는 참격이 열두 번 휘몰아쳐 화면에 금이 가고, 마지막에 화면이 유리처럼 산산조각 나 쏟아지며 모든 적이 함께 부서진다.',
  act: {
    anim: 'ultUp', len: 110, cancel: 104, atkCancel: 104,
    start(p) { forgeCine(p, '종말의 검', '終 末 의 劍', '255,80,200', { bars: 110, dim: 0.5 }); p.invul = 200; p.vx = 0; Game.crack = { t: 999, lines: [] }; },
    update(p, f) {
      p.vx = 0; p.armorF = true;
      if (f >= 4 && f <= 70 && f % 6 === 4) {
        const cx = Game.cam.x + W / 2, cy = sy(DEPTH / 2, 120), ang = rand(0, Math.PI);
        const hcol = hslRgb(rand(0, 360), 0.9, 0.65).join(',');
        FX.add('world', new FSlash(cx + rand(-200, 200), cy + rand(-100, 100), ang, 760, { col: hcol, core: '255,255,255', th: 14, dark: '10,0,20', bend: rand(-0.05, 0.05), life: 18 }));
        swingT(p, (f / 6 | 0) % 2 ? 'a2' : 'a1', 2);
        Sfx.pplay('swingBig'); Sfx.wlayer('chaos', 2, false); Game.addShake(6); Game.flashScreen(0.1, hcol);
        for (const e of WS.onScreen()) applyHit(p, e, WH.chSlash, { noStopAtt: true });
        const x0 = rand(100, W - 100), y0 = rand(80, H - 200), L = [[x0, y0]];       // 화면에 금이 간다 (화면 좌표)
        let x = x0, y = y0; for (let k = 0; k < 6; k++) { x += rand(-90, 90); y += rand(-60, 60); L.push([x, y]); }
        Game.crack.lines.push(L);
      }
      if (f === 78) { Sfx.play('charge', 1, 0.6); FF.screen({ kind: 'lines', col: '255,200,240', a: 0.3, life: 10, fin: 6, fout: 2 }); }
      if (f === 86) {
        FX.add('top', new FShatter());
        Game.crack = { t: 10, lines: Game.crack ? Game.crack.lines : [] };
        Sfx.play('explode', 1.2); Sfx.play('flash'); Sfx.play('break', 1); Sfx.wlayer('chaos', 3, true);
        Game.flashScreen(1, '255,255,255'); Game.addShake(24); Game.slowmo(0.25, 50); Game.zoomPunch(1.1);
        for (const e of WS.onScreen()) { applyHit(p, e, WH.chFinal, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); FF.spray('shard', e.x, sy(e.y, e.z + e.h * 0.5), 8, { col: hslRgb(rand(0, 360), 0.8, 0.7).join(','), v0: 3, v1: 10, grav: 0.3 }); }
        forgeUndim(30);
      }
    },
    end() { if (Game.crack && Game.crack.t > 10) Game.crack.t = 10; forgeUndim(10); },
  },
});
