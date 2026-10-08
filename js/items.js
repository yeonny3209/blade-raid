'use strict';
// ============================================================
//  장비 : 검 18종 + 방어구 12종
//   - 검마다 외형 / 타격음 / 파편 / 히트스톱·진동 / 고유 능력이 모두 다르다
//   - 상태이상(화상·독·출혈·둔화·빙결·감전)은 적에게 걸린다
//   - 구매·장착은 Save.data.owned / Save.data.eq 에 저장된다
// ============================================================

// ---------- 상태이상 ----------
const Status = {
  // 적에게 지속 피해를 입힌다 (반응 없이 체력만 깎음)
  dot(e, dmg, col) {
    if (!e || e.dead || e.dying || e.hp <= 0 || dmg <= 0) return;
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; Game.stats.dmg += dmg;
    const dt = FX.add('top', new DmgText(e.x, sy(e.y, e.z + e.hurtH()) - 10, dmg, 'd', 0)); dt.dcol = col;
    if (e.hp <= 0) e.die({ kx: 2, kz: 5 }, -e.facing);
  },

  add(e, kind, o = {}) {
    if (!e || e.dead || e.dying || !e.hittable()) return;
    const s = e.st || (e.st = {});
    switch (kind) {
      case 'burn': { const b = s.burn || (s.burn = { t: 0, d: 0 }); b.t = o.t || 180; b.d = Math.max(b.d, o.d || 1); break; }
      case 'poison': {
        const b = s.poison || (s.poison = { t: 0, d: 0, n: 0 });
        b.t = o.t || 240; b.d = Math.max(b.d, o.d || 1); b.n = Math.min(o.max || 5, b.n + (o.n || 1)); break;
      }
      case 'bleed': { const b = s.bleed || (s.bleed = { t: 0, d: 0 }); b.t = o.t || 180; b.d = Math.max(b.d, o.d || 1); break; }
      case 'slow': { const b = s.slow || (s.slow = { t: 0, m: 1 }); b.t = Math.max(b.t, o.t || 150); b.m = Math.min(e.isBoss ? Math.max(o.m || 0.55, 0.8) : (o.m || 0.55), b.m || 1); break; }
      case 'freeze': case 'shock': {
        if (e.isBoss) { this.add(e, 'slow', { t: 60, m: 0.8 }); return; }
        if (e.holdT > 0 && kind === 'shock' && e.holdKind === 'freeze') return;
        e.holdT = Math.max(e.holdT || 0, o.t || 40); e.holdKind = kind;
        if (e.act) e.interrupt();
        if (e.state === 'attack' || e.state === 'move') { e.setState('idle'); e.play('idle', 2); }
        e.vx = e.vy = 0;
        break;
      }
    }
  },

  release(e) {
    if (e.holdKind === 'freeze') {
      const X = e.x, Y = sy(e.y, e.z + e.h * 0.4);
      FX.add('world', new Flash(X, Y, 10, 80, 12, '190,235,255', 0.8));
      for (let i = 0; i < 9; i++) FX.add('world', new Debris(e.x + rand(-12, 12), e.y, e.z + rand(10, e.h * 0.9), { vx: rand(-4, 4), vz: rand(3, 9), s: rand(2, 4), col: ['#bfeaff', '#8ccfee', '#eaf9ff'], life: 40 }));
      Sfx.wlayer('ice', 1, false);
    }
    e.holdKind = null;
  },

  // 매 프레임 (히트스톱 중에는 호출 안 됨)
  step(e) {
    const s = e.st;
    e.slowMul = 1;
    if (!s) return;
    const emit = Game.frame % 6 === 0 && FX.world.length < 240;
    if (s.slow) { if (--s.slow.t <= 0) delete s.slow; else e.slowMul = s.slow.m; }
    if (s.burn) {
      const b = s.burn;
      if (--b.t <= 0) delete s.burn;
      else {
        if (b.t % 20 === 0) this.dot(e, b.d, '255,140,50');
        if (emit) FX.add('world', new Mote(e.x + rand(-10, 10) * e.scale, sy(e.y, e.z + rand(10, e.h * 0.9)), rand(-0.4, 0.4), rand(-2, -0.8), { col: '255,130,40', life: 26, r: rand(5, 9) }));
      }
    }
    if (s.poison && !e.dead) {
      const b = s.poison;
      if (--b.t <= 0) delete s.poison;
      else {
        if (b.t % 30 === 0) this.dot(e, b.d * b.n, '130,230,80');
        if (emit) FX.add('world', new Mote(e.x + rand(-10, 10) * e.scale, sy(e.y, e.z + rand(10, e.h * 0.8)), rand(-0.3, 0.3), rand(-1.4, -0.4), { col: '140,235,80', life: 30, r: rand(4, 7) }));
      }
    }
    if (s.bleed && !e.dead) {
      const b = s.bleed;
      if (--b.t <= 0) delete s.bleed;
      else {
        if (b.t % 24 === 0) {
          this.dot(e, b.d, '230,50,70');
          for (let i = 0; i < 3; i++) FX.add('world', new Drop(e.x, e.y, e.z + rand(20, e.h * 0.7), { vx: rand(-1.5, 1.5), vz: rand(1, 4), col: '#b01428', splat: true }));
        }
      }
    }
    if (!s.slow && !s.burn && !s.poison && !s.bleed) e.st = null;
  },

  draw(ctx, e) {
    const s = e.st || {};
    const X = e.x, Y = sy(e.y, e.z + e.h * 0.5), r = 30 + e.w * 1.4;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (s.burn) drawGlow(ctx, X, Y, r * 1.4, '255,110,30', 0.28 + Math.sin(Game.time * 0.5 + e.id) * 0.08);
    if (s.poison) drawGlow(ctx, X, Y, r * 1.3, '120,230,70', 0.14 + 0.05 * s.poison.n);
    if (s.bleed) drawGlow(ctx, X, Y, r, '230,40,60', 0.18);
    if (s.slow) drawGlow(ctx, X, Y + 20, r * 1.2, '150,210,255', 0.16);
    if (e.holdT > 0) {
      const fz = e.holdKind === 'freeze', c = fz ? '170,225,255' : '255,240,110';
      drawGlow(ctx, X, Y, r * 1.8, c, fz ? 0.5 : 0.35 + Math.sin(Game.time) * 0.15);
      ctx.globalCompositeOperation = 'source-over';
      if (fz) {
        ctx.fillStyle = 'rgba(205,240,255,0.34)'; ctx.strokeStyle = 'rgba(230,250,255,0.85)'; ctx.lineWidth = 1.6;
        const h = e.h, w = e.w * 1.5;
        ctx.beginPath(); polyPath(ctx, [X - w, sy(e.y, e.z), X - w * 0.7, sy(e.y, e.z + h * 0.7), X - w * 0.2, sy(e.y, e.z + h), X + w * 0.5, sy(e.y, e.z + h * 0.85), X + w, sy(e.y, e.z + h * 0.3), X + w, sy(e.y, e.z)]);
        ctx.fill(); ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255,245,150,0.9)'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = rand(0, TAU), L = rand(16, 40); ctx.moveTo(X, Y); ctx.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); } ctx.stroke();
      }
    }
    ctx.restore();
  },
};

// ---------- 장비 관리 ----------
const Gear = {
  timers: [],
  _w: null, _a: null,

  w() { const id = Save.data && Save.data.eq && Save.data.eq.w; return WEAPON_BY_ID[id] || WEAPONS[0]; },
  a() { const id = Save.data && Save.data.eq && Save.data.eq.a; return ARMOR_BY_ID[id] || ARMORS[0]; },
  owns(kind, id) { return ((Save.data.owned || {})[kind] || []).includes(id); },
  open(it) { return (it.map || 1) <= 1 || (Save.data.unlocked || 1) > 10; },
  buy(kind, it) {
    const d = Save.data;
    if (this.owns(kind, it.id)) return 'owned';
    if (!this.open(it)) return 'locked';
    if ((d.gold || 0) < it.price) return 'gold';
    d.gold -= it.price;
    d.owned = d.owned || { w: ['w0'], a: ['a0'] };
    d.owned[kind].push(it.id);
    this.equip(kind, it.id);
    return 'ok';
  },
  equip(kind, id) {
    const d = Save.data;
    d.eq = d.eq || { w: 'w0', a: 'a0' };
    d.eq[kind] = id; Save.save();
  },
  reset() { this.timers.length = 0; },
  later(frames, fn) { this.timers.push({ t: frames, fn }); },
  tick() {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const q = this.timers[i];
      if (--q.t <= 0) { this.timers.splice(i, 1); try { q.fn(); } catch (e) { } }
    }
  },

  // 주변의 다른 적 (가까운 순)
  near(p, t, r, n = 99) {
    return Game.enemies.filter(e => e !== t && e.hittable() && Math.abs(e.x - t.x) < r && Math.abs(e.y - t.y) < r * 0.5)
      .sort((a, b) => Math.abs(a.x - t.x) - Math.abs(b.x - t.x)).slice(0, n);
  },
  // 능력으로 가하는 추가 피해 (능력 연쇄 방지를 위해 applyHit 을 거치지 않는다)
  proc(p, t, mul, o = {}) {
    if (!t || !t.hittable()) return 0;
    const dmg = Math.max(1, Math.round(p.atk * mul * rand(0.93, 1.07)));
    const dir = o.dir ?? sign(t.x - p.x);
    FX.add('top', new DmgText(t.x, sy(t.y, t.z + t.hurtH()) - 14, dmg, o.crit ? 'c' : 'n', o.stack || 0));
    t.flash = 3; Game.stats.dmg += dmg;
    t.takeHit(o.hit || { dmg: mul * 0.5, kx: 2.5, stun: 16, kz: o.kz || 0 }, p, dir, dmg);
    if (!o.quiet) Sfx.impact(t.hitMat || 'flesh', 0, { vol: 0.8 });
    return dmg;
  },
  bolt(a, b, col) {
    const ax = a.x, ay = sy(a.y, (a.z || 0) + (a.h || 0) * 0.5), bx = b.x, by = sy(b.y, (b.z || 0) + (b.h || 0) * 0.5);
    FX.add('world', new Bolt(ax, ay, bx, by, { col: col || '255,240,120', life: 10 }));
  },
  heal(p, v, quiet) {
    v = Math.round(v);
    if (v <= 0 || p.hp <= 0) return;
    p.hp = Math.min(p.hpMax, p.hp + v);
    if (!quiet) FX.add('top', new DmgText(p.x, sy(p.y, p.z) - 150, v, 'h'));
  },
  meteor(p, x, y, mul, col) {
    FX.add('world', new Meteor(x, y, {
      col: col || '255,220,120', dur: 16, onEnd: () => {
        const gy = sy(y, 0);
        FX.add('world', new Flash(x, gy - 20, 20, 240, 20, col || '255,220,120', 0.95));
        FX.add('ground', new Ring(x, gy, 20, 220, 22, { col: col || '255,220,120', w: 12 }));
        Hitfx.dust(x, gy, 10, 50);
        for (let i = 0; i < 10; i++) FX.add('world', new Debris(x + rand(-30, 30), y, 4, { vx: rand(-6, 6), vz: rand(5, 12), s: rand(2, 5), glow: col || '255,200,100' }));
        Sfx.play('explode', 0.7); Game.addShake(8);
        for (const e of Game.enemies) if (e.hittable() && Math.abs(e.x - x) < 190 && Math.abs(e.y - y) < 80) this.proc(p, e, mul, { hit: { dmg: 1, kx: 6, kz: 7, stun: 30 } });
      },
    }));
  },

  // ----- 파편 연출 (실전 + 상점 미리보기 공용) -----
  hitFx(W, wx, wy, hz, dir, pw, crit) {
    const f = PART[W.part];
    if (!f) return;
    const b = FX.world.length > 260 ? 0.4 : FX.world.length > 170 ? 0.7 : 1;
    f(wx, wy, hz, dir, pw, b, W);
  },
  // 상점에서 보여주는 시뮬레이션 타격
  previewHit(W, x, y, hz, dir) {
    const pw = 1 + (Math.random() < 0.35 ? 1 : 0), crit = Math.random() < 0.2;
    const col = W.col, X = x, Y = sy(y, hz);
    Hitfx.slash(X, Y, dir, (dir > 0 ? -35 : 215) * DEG, 1 + pw * 0.2, col);
    Sfx.impact('flesh', pw, { vol: 0.8, pitch: W.pitch || 1, crit });
    Sfx.wlayer(W.snd, pw, crit);
    this.hitFx(W, x, y, hz, dir, pw, crit);
    Game.addShake(0);
    FX.add('top', new DmgText(x, Y - 70, randi(2400, 4800) * (crit ? 1.5 : 1) | 0, crit ? 'c' : 'n', 0));
  },
};

// ---------- 검 고유 파편 ----------
const PART = {
  fire(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    Hitfx.sparks(X, Y, d, Math.round((3 + pw * 2) * b), { col: '255,150,50', spread: 1.5 });
    for (let i = 0; i < Math.round((3 + pw * 2) * b); i++) FX.add('world', new Mote(X + rand(-8, 8), Y + rand(-6, 6), rand(-1, 1) + d * 0.5, rand(-3.2, -1), { col: '255,120,30', life: 32, r: rand(6, 11) }));
    FX.add('world', new Flash(X, Y, 10, 56 + pw * 14, 12, '255,140,40', 0.6));
  },
  ice(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((5 + pw * 2) * b); i++) FX.add('world', new Debris(x + rand(-6, 6), y, z + rand(-8, 8), { vx: d * rand(1, 6) + rand(-1.5, 1.5), vz: rand(3, 10), s: rand(2, 4.5), col: ['#bfeaff', '#8ccfee', '#eaf9ff'], life: 50 }));
    Hitfx.sparks(X, Y, d, Math.round(5 * b), { col: '190,235,255', spread: 1.5 });
    FX.add('world', new Ring(X, Y, 8, 64 + pw * 12, 14, { col: '170,225,255', w: 4, ry: 1 }));
  },
  elec(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < 2 + pw; i++) { const a = rand(0, TAU), L = rand(40, 78); FX.add('world', new Bolt(X, Y, X + Math.cos(a) * L, Y + Math.sin(a) * L, { life: 8, amp: 12, w: 2.4, col: '255,240,110' })); }
    Hitfx.sparks(X, Y, d, Math.round(6 * b), { col: '255,245,140', spread: 1.8, max: 22 });
    FX.add('world', new Flash(X, Y, 10, 60, 10, '255,245,150', 0.7));
  },
  blood(x, y, z, d, pw, b) {
    const n = Math.round((6 + pw * 3) * b);
    for (let i = 0; i < n; i++) FX.add('world', new Drop(x + rand(-5, 5), y, z + rand(-8, 8), { vx: d * rand(1.5, 8) + rand(-1.5, 1.5), vz: rand(1, 8), r: rand(2, 3.4), col: chance(0.5) ? '#c01830' : '#8a0f20', splat: true }));
    FX.add('world', new Flash(x, sy(y, z), 8, 50, 10, '255,40,70', 0.45));
  },
  stone(x, y, z, d, pw, b) {
    for (let i = 0; i < Math.round((6 + pw * 3) * b); i++) FX.add('world', new Debris(x + rand(-8, 8), y, z + rand(-8, 8), { vx: d * rand(1, 8) + rand(-2, 2), vz: rand(4, 12), s: rand(3, 6) }));
    Hitfx.dust(x, sy(y, 0), Math.round(5 * b), 24);
    FX.add('ground', new Ring(x, sy(y, 0), 10, 110 + pw * 20, 18, { col: '200,180,150', w: 8 }));
  },
  wind(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < 3; i++) FX.add('world', new CutLine(X - d * 20, Y + rand(-18, 18), (d > 0 ? 0 : Math.PI) + rand(-0.2, 0.2), rand(50, 96), 3, '180,255,215', 11));
    for (let i = 0; i < Math.round(5 * b); i++) FX.add('world', new Mote(X, Y + rand(-12, 12), -d * rand(2, 5), rand(-0.6, 0.6), { col: '200,255,225', life: 22, r: rand(4, 7), grav: 0 }));
  },
  poison(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((5 + pw) * b); i++) FX.add('world', new Drop(x + rand(-5, 5), y, z + rand(-8, 8), { vx: d * rand(0.5, 5) + rand(-1, 1), vz: rand(1, 6), r: rand(2, 3.2), col: chance(0.5) ? '#5fbf2a' : '#9be060', splat: true }));
    for (let i = 0; i < Math.round(5 * b); i++) FX.add('world', new Mote(X + rand(-12, 12), Y + rand(-10, 10), rand(-0.5, 0.5), rand(-1.6, -0.4), { col: '140,235,80', life: 36, r: rand(5, 9) }));
  },
  holy(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    FX.add('world', new Flash(X, Y, 10, 90, 16, '255,240,170', 0.7));
    for (let i = 0; i < Math.round((6 + pw * 2) * b); i++) FX.add('world', new Mote(X + rand(-18, 18), Y + rand(-10, 14), rand(-0.4, 0.4), rand(-2.4, -0.8), { col: '255,236,150', life: 38, r: rand(5, 9) }));
    Hitfx.sparks(X, Y, d, Math.round(5 * b), { col: '255,250,210', spread: 1.6 });
  },
  void(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((8 + pw * 2) * b); i++) { const a = rand(0, TAU), R = rand(40, 80); FX.add('world', new Mote(X + Math.cos(a) * R, Y + Math.sin(a) * R * 0.7, 0, 0, { col: '190,100,255', life: 20, r: rand(5, 9), tx: X, ty: Y, grav: 0 })); }
    FX.add('world', new Flash(X, Y, 8, 70, 14, '170,80,255', 0.6));
    FX.add('world', new Ring(X, Y, 70, 6, 14, { col: '200,130,255', w: 4, ry: 1 }));
  },
  magma(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((6 + pw * 2) * b); i++) FX.add('world', new Debris(x + rand(-8, 8), y, z + rand(-6, 6), { vx: d * rand(1, 8) + rand(-2, 2), vz: rand(4, 12), s: rand(3, 5.5), col: ['#2a1612', '#5a2a18', '#ff8a30'], glow: '255,120,30' }));
    FX.add('world', new Flash(X, Y, 12, 80 + pw * 16, 14, '255,120,30', 0.7));
    Hitfx.sparks(X, Y, d, Math.round(6 * b), { col: '255,170,70', spread: 1.5 });
  },
  clock(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    FX.add('world', new Ring(X, Y, 8, 76, 16, { col: '160,225,255', w: 3, ry: 1 }));
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; FX.add('world', new CutLine(X + Math.cos(a) * 46, Y + Math.sin(a) * 46, a, i % 3 ? 7 : 13, 1.6, '170,230,255', 14)); }
  },
  exec(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    FX.add('world', new CutLine(X, Y, 0.75, 96 + pw * 12, 7, '255,70,90', 16));
    FX.add('world', new CutLine(X, Y, -0.75, 96 + pw * 12, 7, '255,70,90', 16));
    for (let i = 0; i < Math.round(6 * b); i++) FX.add('world', new Drop(x, y, z + rand(-6, 6), { vx: d * rand(1, 7), vz: rand(2, 8), r: rand(2, 3.4), col: '#9a1022', splat: true }));
  },
  moon(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    FX.add('world', new Crescent(X, Y, 50 + pw * 8, -2.4, 0.2, { th: 16, life: 12, col: '190,215,255', core: '255,255,255', speed: 3 }));
    Hitfx.sparks(X, Y, d, Math.round(6 * b), { col: '215,230,255', spread: 1.6 });
    FX.add('world', new Flash(X, Y, 8, 56, 12, '200,220,255', 0.55));
  },
  star(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    FX.add('world', new Glint(X, Y, 28 + pw * 6));
    for (let i = 0; i < Math.round(7 * b); i++) FX.add('world', new Mote(X + rand(-20, 20), Y + rand(-20, 20), rand(-1.2, 1.2), rand(-1.6, 0.4), { col: '255,236,150', life: 30, r: rand(4, 8) }));
    Hitfx.sparks(X, Y, d, Math.round(5 * b), { col: '255,245,190', spread: 1.7 });
  },
  shadow(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round(8 * b); i++) FX.add('world', new Mote(X + rand(-14, 14), Y + rand(-14, 14), rand(-1.4, 1.4), rand(-1.4, 1), { col: '150,100,235', life: 28, r: rand(6, 11) }));
    FX.add('world', new CutLine(X, Y, (d > 0 ? -0.5 : Math.PI + 0.5), 84, 5, '170,120,255', 12));
  },
  wing(x, y, z, d, pw, b) {
    const X = x, Y = sy(y, z);
    for (let i = 0; i < Math.round((6 + pw) * b); i++) FX.add('world', new Mote(X + rand(-20, 20), Y + rand(-20, 10), rand(-1.5, 1.5), rand(-1.8, -0.2), { col: '255,255,240', life: 46, r: rand(5, 8), grav: 0.04 }));
    FX.add('world', new Flash(X, Y, 10, 70, 14, '255,252,225', 0.6));
  },
  chaos(x, y, z, d, pw, b, W) {
    const pick = choose(['fire', 'ice', 'elec', 'blood', 'poison', 'void', 'holy', 'star']);
    PART[pick](x, y, z, d, pw, b, W);
  },
};

// 공용 도우미
const _n = (p, k = 'wc') => (p[k] = (p[k] || 0) + 1);
const ELEM_LIST = ['w1', 'w2', 'w3', 'w4', 'w7', 'w9'];

// ============================================================
//  검 18종
//   mod(p,t,dmg,I) : 피해 배율 / hit(p,t,dmg,I) : 적중 능력 / kill(p,t) : 처치 능력
//   atk 공격력배율, crit 치명타율+, critDmg 치명타배율, stop 히트스톱배율, shake 진동배율,
//   kx 넉백배율, move 이동속도배율, pitch 타격음 높낮이, swingPitch 휘두르는 소리
// ============================================================
const WEAPONS = [
  {
    id: 'w0', name: '무쇠 연습검', sub: '견습 검사의 첫 번째 칼', price: 0, map: 1,
    atk: 1, col: '140,200,255', snd: null, part: null, feel: '평범하고 깔끔한 쇳소리',
    desc: '특별한 힘은 없지만 손에 익은 검. 모든 것의 시작.',
    look: { c: ['#5a6272', '#a9b2c0', '#e8edf5'], guard: 'oval', glow: '120,190,255' },
  },
  {
    id: 'w1', name: '화염도 이그니스', sub: '꺼지지 않는 불씨를 벼린 검', price: 14000, map: 1,
    atk: 1.04, stop: 0.92, col: '255,130,40', snd: 'fire', part: 'fire', pitch: 1.04, swingPitch: 1.05,
    feel: '파직이는 불꽃과 뜨거운 불티', desc: '적중 시 점화 : 3초간 불타며 타격 피해의 약 40%를 화상으로 입힌다.',
    look: { c: ['#5a1208', '#ff6a20', '#ffe08a'], hw: 4.3, edge: 'flame', tip: 'point', guard: 'wing', glow: '255,120,40', rune: '255,150,50', trim: ['#7a3a10', '#e89a30', '#ffe08a'] },
    amb: ['ember', '255,130,40', 0.22],
    hit(p, t, dmg) { Status.add(t, 'burn', { t: 180, d: dmg * 0.13 }); },
  },
  {
    id: 'w2', name: '빙백검 프로스트', sub: '천 년 동안 얼어붙은 서슬', price: 28000, map: 1,
    atk: 1.06, stop: 1.1, col: '140,220,255', snd: 'ice', part: 'ice', pitch: 1.12, swingPitch: 1.12,
    feel: '쨍하고 부서지는 얼음 소리', desc: '적중 시 둔화(이동·공격 속도 -45%). 6번째 적중마다 1.2초 빙결, 빙결된 적은 받는 피해 +35%.',
    look: { c: ['#2b5878', '#9bd8f2', '#f2fcff'], hw: 4.2, L: 1.05, edge: 'crystal', tip: 'spike', guard: 'cross', glow: '150,225,255', rune: '170,235,255', trim: ['#4a7a98', '#bfe8f8', '#ffffff'] },
    amb: ['snow', '200,235,255', 0.2],
    mod(p, t) { return t.holdT > 0 && t.holdKind === 'freeze' ? 1.35 : 1; },
    hit(p, t) { Status.add(t, 'slow', { t: 150, m: 0.55 }); if (_n(p) % 6 === 0) { Status.add(t, 'freeze', { t: 72 }); FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 52, 'FREEZE', { col: ['#ffffff', '#6fd0ff'], size: 20 })); } },
  },
  {
    id: 'w3', name: '뇌명도 천둥', sub: '번개를 삼킨 우레의 칼날', price: 48000, map: 1,
    atk: 1.08, crit: 0.04, stop: 0.95, col: '255,235,90', snd: 'elec', part: 'elec', pitch: 1.08,
    feel: '지직거리는 전류와 번쩍이는 섬광', desc: '30% 확률로 낙뢰 : 대상과 주변 적 최대 3명에게 55% 피해 + 감전(0.4초 경직).',
    look: { c: ['#2a2540', '#c9b84a', '#fffbd0'], hw: 3.5, edge: 'notch', tip: 'point', guard: 'cross', glow: '255,235,100', rune: '255,240,120', trim: ['#4a4030', '#e8d040', '#fffbd0'] },
    amb: ['spark', '255,240,120', 0.12],
    hit(p, t, dmg) {
      if (!chance(0.3)) return;
      FX.add('world', new Bolt(t.x + rand(-60, 60), -20, t.x, sy(t.y, t.z + t.h * 0.5), { life: 12, amp: 34, w: 4 }));
      FX.add('world', new Flash(t.x, sy(t.y, t.z + 40), 14, 100, 12, '255,245,150', 0.85));
      Sfx.wlayer('elec', 2, false); Game.flashScreen(0.08, '255,250,200');
      Gear.proc(p, t, 0.4, { quiet: true }); Status.add(t, 'shock', { t: 24 });
      let from = t;
      for (const e of Gear.near(p, t, 320, 3)) { Gear.bolt(from, e); Gear.proc(p, e, 0.55, { quiet: true }); Status.add(e, 'shock', { t: 24 }); from = e; }
    },
  },
  {
    id: 'w4', name: '혈월도 크림슨 팡', sub: '피를 마실수록 날카로워지는 송곳니', price: 76000, map: 1,
    atk: 1.1, stop: 1.15, shake: 1.1, col: '230,40,70', snd: 'blood', part: 'blood', pitch: 0.92, swingPitch: 0.95,
    feel: '질척이는 살점 소리와 튀는 핏방울', desc: '적중 시 피해의 6% 흡혈. 치명타는 출혈(3초) 유발.',
    look: { c: ['#3a0610', '#a8142c', '#ff7a8c'], hw: 4, edge: 'saw', tip: 'curve', guard: 'claw', glow: '255,50,80', rune: '255,60,90', trim: ['#4a1018', '#a02030', '#ff7a8c'] },
    amb: ['drip', '230,40,70', 0.1],
    hit(p, t, dmg, I) {
      Gear.heal(p, Math.min(dmg * 0.06, p.hpMax * 0.012), _n(p, 'hc') % 3 !== 0);
      if (I.crit) Status.add(t, 'bleed', { t: 180, d: dmg * 0.1 });
    },
  },
  {
    id: 'w5', name: '대지분쇄검 그라바돈', sub: '산을 쪼개던 거인의 대검', price: 110000, map: 1,
    atk: 1.18, stop: 1.55, shake: 1.8, kx: 1.5, move: 0.94, col: '230,190,120', snd: 'quake', part: 'stone', pitch: 0.78, swingPitch: 0.8,
    feel: '땅이 울리는 묵직한 진동', desc: '타격이 훨씬 묵직하다(히트스톱·넉백↑). 강타 시 지면 충격파가 주변 적에게 35% 피해. 이동속도 -6%.',
    look: { c: ['#3a3430', '#8a7a68', '#d8c8a8'], hw: 7.4, L: 0.96, edge: 'plain', tip: 'cleave', guard: 'cross', glow: '230,190,120', rune: '255,170,80', trim: ['#4a3a20', '#a08040', '#e8cc88'], taper: 0.02 },
    amb: ['dust', '200,180,150', 0.07],
    hit(p, t, dmg, I) {
      p.wcd = p.wcd || 0;
      if (I.ipw < 2 || p.wcd > 0) return;
      p.wcd = 24;
      FX.add('ground', new Ring(t.x, sy(t.y, 0), 20, 250, 22, { col: '230,190,120', w: 12 }));
      FX.add('ground', new Crack(t.x, t.y, 110));
      Hitfx.dust(t.x, sy(t.y, 0), 8, 50); Sfx.play('thud', 0.8, 0.8); Game.addShake(6);
      for (const e of Gear.near(p, t, 260)) Gear.proc(p, e, 0.35, { hit: { dmg: 0.5, kx: 5, kz: 5, stun: 24 } });
    },
  },
  {
    id: 'w6', name: '질풍검 바람가르기', sub: '바람보다 먼저 도착하는 칼', price: 150000, map: 1,
    atk: 1, stop: 0.7, shake: 0.8, move: 1.12, col: '170,255,205', snd: 'wind', part: 'wind', pitch: 1.22, swingPitch: 1.3,
    feel: '경쾌하게 베어 넘기는 바람 소리', desc: '이동속도 +12%. 28% 확률로 잔상 베기 : 0.1초 뒤 55% 추가 타격.',
    look: { c: ['#3a5a50', '#b8f0d8', '#ffffff'], hw: 2.5, L: 1.14, edge: 'plain', tip: 'spike', guard: 'ring', glow: '170,255,210', rune: '190,255,225', trim: ['#4a6a60', '#a8e8c8', '#ffffff'] },
    amb: ['wind', '190,255,220', 0.18],
    hit(p, t) {
      if (!chance(0.28)) return;
      Gear.later(6, () => {
        if (!t.hittable()) return;
        const d = sign(t.x - p.x);
        FX.add('world', new CutLine(t.x, sy(t.y, t.z + t.h * 0.5), (d > 0 ? -0.3 : Math.PI + 0.3), 100, 5, '190,255,225', 11));
        Gear.proc(p, t, 0.55, { quiet: true }); Sfx.wlayer('wind', 1, false);
        p.addGhost(t.x - d * 70, p.y, p.z, d, lerpPose(PP.a1s, PP.a2s, 0.5, P()), 9, '170,255,205');
      });
    },
  },
  {
    id: 'w7', name: '맹독검 베놈 팽', sub: '독사의 이빨을 갈아 만든 단검', price: 205000, map: 1,
    atk: 1.1, stop: 1.0, col: '130,230,70', snd: 'poison', part: 'poison', pitch: 1.0,
    feel: '끈적한 독액이 튀는 소리', desc: '적중마다 독이 중첩(최대 5). 중독된 적이 죽으면 독구름이 퍼져 주변 적에게 독이 옮겨간다.',
    look: { c: ['#1c3a14', '#58b02a', '#d4ff90'], hw: 4, edge: 'wave', tip: 'point', guard: 'claw', glow: '130,235,80', rune: '150,255,90', trim: ['#2a4a18', '#7ac838', '#d4ff90'] },
    amb: ['bubble', '140,235,80', 0.14],
    hit(p, t, dmg) { Status.add(t, 'poison', { t: 240, d: Math.max(1, dmg * 0.05), n: 1, max: 5 }); },
    kill(p, t) {
      if (!t.st || !t.st.poison) return;
      const X = t.x, gy = sy(t.y, 0);
      FX.add('world', new Flash(X, gy - 40, 20, 160, 22, '130,230,70', 0.7));
      FX.add('ground', new Ring(X, gy, 20, 210, 24, { col: '140,235,80', w: 10 }));
      for (let i = 0; i < 12; i++) FX.add('world', new Mote(X + rand(-60, 60), gy - rand(10, 90), rand(-1, 1), rand(-1.4, -0.3), { col: '140,235,80', life: 44, r: rand(8, 14) }));
      for (const e of Gear.near(p, t, 280)) Status.add(e, 'poison', { t: 240, d: t.st.poison.d, n: 3, max: 5 });
    },
  },
  {
    id: 'w8', name: '성검 루미나스', sub: '어둠을 벤 빛의 검', price: 275000, map: 1,
    atk: 1.15, stop: 1.05, col: '255,235,150', snd: 'holy', part: 'holy', pitch: 1.1, swingPitch: 1.08,
    feel: '맑은 종소리와 번지는 성광', desc: '엘리트·보스에게 +25% 피해. 적중 시 MP +10. 7번째 적중마다 빛기둥이 내려와 범위 90% 피해.',
    look: { c: ['#8a7a40', '#f8f0c8', '#ffffff'], hw: 4.5, L: 1.06, edge: 'plain', tip: 'round', guard: 'wing', glow: '255,240,160', rune: '255,235,140', trim: ['#b08a30', '#ffd24a', '#fff6c8'] },
    amb: ['mote', '255,240,160', 0.2],
    mod(p, t) { return t.elite || t.isBoss ? 1.25 : 1; },
    hit(p, t) {
      p.mp = Math.min(p.mpMax, p.mp + 10);
      if (_n(p) % 7 !== 0) return;
      FX.add('world', new Pillar(t.x, t.y, 70, 380, 30, '255,230,140', '255,255,240'));
      FX.add('ground', new Ring(t.x, sy(t.y, 0), 20, 200, 20, { col: '255,240,170', w: 10 }));
      Sfx.wlayer('holy', 3, true); Game.flashScreen(0.14, '255,250,220'); Game.addShake(5);
      Gear.proc(p, t, 0.9, { quiet: true });
      for (const e of Gear.near(p, t, 190)) Gear.proc(p, e, 0.9, { quiet: true });
    },
  },
  {
    id: 'w9', name: '공허의 낫 보이드리퍼', sub: '빛마저 삼키는 어둠의 곡도', price: 350000, map: 1,
    atk: 1.22, crit: 0.08, stop: 1.2, col: '190,100,255', snd: 'void', part: 'void', pitch: 0.88, swingPitch: 0.88,
    feel: '빨려들어가는 저음과 일그러지는 울림', desc: '적중한 적을 끌어당긴다. 5번째 적중마다 블랙홀 : 주변 적을 모아 70% 피해.',
    look: { c: ['#10061e', '#5a2a98', '#c89aff'], hw: 5.2, L: 1.02, edge: 'notch', tip: 'curve', guard: 'ring', glow: '190,100,255', rune: '200,120,255', trim: ['#2a1048', '#7a40c8', '#c89aff'] },
    amb: ['void', '190,100,255', 0.2],
    hit(p, t, dmg, I) {
      if (!t.isBoss) t.vx = -I.dir * 4.2;
      if (_n(p) % 5 !== 0) return;
      const X = t.x, gy = sy(t.y, 0);
      FX.add('world', new Flash(X, gy - 50, 20, 240, 22, '150,60,255', 0.8));
      FX.add('ground', new Ring(X, gy, 280, 10, 20, { col: '200,130,255', w: 10 }));
      for (let i = 0; i < 16; i++) { const a = rand(0, TAU), R = rand(80, 170); FX.add('world', new Mote(X + Math.cos(a) * R, gy - 40 + Math.sin(a) * R * 0.6, 0, 0, { col: '190,100,255', life: 24, r: rand(6, 11), tx: X, ty: gy - 40, grav: 0 })); }
      Sfx.wlayer('void', 3, false); Game.addShake(6);
      for (const e of Gear.near(p, t, 330)) { if (!e.isBoss) { e.x += (X - e.x) * 0.7; e.y += (t.y - e.y) * 0.5; } Gear.proc(p, e, 0.7, { quiet: true }); }
      Gear.proc(p, t, 0.7, { quiet: true });
    },
  },

  // ----- 제2지역 -----
  {
    id: 'w10', name: '용암대검 마그마 크러셔', sub: '화산의 심장에서 식힌 대검', price: 520000, map: 2,
    atk: 1.3, stop: 1.35, shake: 1.5, kx: 1.3, move: 0.96, col: '255,100,25', snd: 'magma', part: 'magma', pitch: 0.82, swingPitch: 0.84,
    feel: '용암이 터지는 폭음과 불꽃', desc: '3번째 적중마다 용암 폭발 : 범위 60% 피해 + 화상. 이동속도 -4%.',
    look: { c: ['#1a1210', '#4a2a22', '#ff8a30'], hw: 7, L: 1, edge: 'flame', tip: 'cleave', guard: 'cross', glow: '255,110,30', rune: '255,130,40', trim: ['#3a2218', '#7a4028', '#ff9a40'], taper: 0.02 },
    amb: ['ember', '255,110,30', 0.28],
    hit(p, t, dmg) {
      Status.add(t, 'burn', { t: 120, d: dmg * 0.08 });
      if (_n(p) % 3 !== 0) return;
      const X = t.x, gy = sy(t.y, 0);
      FX.add('world', new Flash(X, gy - 40, 20, 220, 20, '255,120,30', 0.95));
      FX.add('ground', new Ring(X, gy, 20, 240, 22, { col: '255,130,40', w: 14 }));
      for (let i = 0; i < 12; i++) FX.add('world', new Debris(X + rand(-30, 30), t.y, 6, { vx: rand(-7, 7), vz: rand(6, 14), s: rand(3, 6), col: ['#2a1612', '#5a2a18', '#ff8a30'], glow: '255,120,30' }));
      Sfx.wlayer('magma', 3, true); Sfx.play('explode', 0.6); Game.addShake(8);
      for (const e of Gear.near(p, t, 250)) { Gear.proc(p, e, 0.6, { quiet: true, hit: { dmg: 0.6, kx: 6, kz: 6, stun: 26 } }); Status.add(e, 'burn', { t: 120, d: dmg * 0.08 }); }
    },
  },
  {
    id: 'w11', name: '태엽검 크로노스', sub: '시간을 감아 올리는 황금 칼날', price: 680000, map: 2,
    atk: 1.22, stop: 1.0, col: '160,225,255', snd: 'clock', part: 'clock', pitch: 1.15, swingPitch: 1.1,
    feel: '째깍이는 태엽 소리와 맑은 공명', desc: '적중마다 모든 스킬 쿨타임 -0.18초. 12번째 적중에 시간 정지 : 모든 적을 0.5초 경직시킨다.',
    look: { c: ['#6a5020', '#d8b050', '#fff0b8'], hw: 3.7, L: 1.1, edge: 'notch', tip: 'point', guard: 'ring', glow: '160,225,255', rune: '150,225,255', trim: ['#7a5a20', '#e8c060', '#fff0b8'] },
    amb: ['mote', '170,230,255', 0.14],
    hit(p) {
      for (const k in p.cd) p.cd[k] = Math.max(0, p.cd[k] - 0.18);
      if (_n(p) % 12 !== 0) return;
      Game.slowmo(0.12, 34); Game.flashScreen(0.3, '190,235,255');
      FX.add('top', new Label(p.x, sy(p.y, p.z) - 190, 'TIME STOP', { col: ['#ffffff', '#6fd0ff'], size: 34, life: 60 }));
      FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 420, 30, { col: '160,225,255', w: 12 }));
      Sfx.wlayer('clock', 3, true);
      for (const e of Game.enemies) if (e.hittable() && Math.abs(e.x - p.x) < 700) Status.add(e, 'shock', { t: 30 });
    },
  },
  {
    id: 'w12', name: '처형검 데스 헤럴드', sub: '목을 거둔 자만이 쥘 수 있는 검', price: 860000, map: 2,
    atk: 1.32, stop: 1.4, shake: 1.4, col: '210,40,70', snd: 'exec', part: 'exec', pitch: 0.8, swingPitch: 0.82,
    feel: '단두대가 떨어지는 듯한 저음', desc: '체력 25% 이하 적에게 피해 2배. 처치 시 HP 3% 회복.',
    look: { c: ['#1c1c24', '#585868', '#c8c8d8'], hw: 6, L: 0.98, edge: 'notch', tip: 'cleave', guard: 'cross', glow: '230,50,80', rune: '230,40,70', trim: ['#3a1018', '#a02030', '#ff7a8c'], taper: 0.03 },
    amb: ['drip', '230,40,70', 0.08],
    mod(p, t) { return t.hp / t.hpMax <= 0.25 ? 2 : 1; },
    hit(p, t, dmg, I) { if (t.hp / t.hpMax <= 0.25) FX.add('top', new Label(t.x, sy(t.y, t.z + t.hurtH()) - 54, 'EXECUTE', { col: ['#ffe0e0', '#ff3a50'], size: 20 })); },
    kill(p) { Gear.heal(p, p.hpMax * 0.03); },
  },
  {
    id: 'w13', name: '월광검 루나 이클립스', sub: '달이 가려지는 밤에만 빛나는 검', price: 1100000, map: 2,
    atk: 1.28, crit: 0.3, critDmg: 2.1, stop: 1.05, col: '190,215,255', snd: 'moon', part: 'moon', pitch: 1.18, swingPitch: 1.15,
    feel: '은빛 종이 울리는 투명한 타격', desc: '치명타율 +30%, 치명타 피해 x2.1. 치명타 시 월광 베기가 0.1초 뒤 40% 추가 타격.',
    look: { c: ['#2a3454', '#9aa8d8', '#f4f8ff'], hw: 4.8, L: 1.06, edge: 'plain', tip: 'curve', guard: 'wing', glow: '190,215,255', rune: '210,225,255', trim: ['#4a5478', '#b8c8f0', '#ffffff'] },
    amb: ['mote', '200,220,255', 0.18],
    hit(p, t, dmg, I) {
      if (!I.crit) return;
      Gear.later(6, () => {
        if (!t.hittable()) return;
        FX.add('world', new Crescent(t.x, sy(t.y, t.z + t.h * 0.5), 86, -2.4, 0.5, { th: 26, life: 13, col: '190,215,255', core: '255,255,255' }));
        Gear.proc(p, t, 0.4, { crit: true, quiet: true }); Sfx.wlayer('moon', 2, true);
      });
    },
  },
  {
    id: 'w14', name: '유성검 스타폴', sub: '별이 떨어진 자리에서 주운 검', price: 1400000, map: 2,
    atk: 1.36, stop: 1.1, col: '255,236,150', snd: 'star', part: 'star', pitch: 1.1, swingPitch: 1.1,
    feel: '반짝이는 별가루와 높은 울림', desc: '공중에 뜬 적에게 +20% 피해. 처치 시 별똥별이 떨어져 주변 적에게 120% 피해.',
    look: { c: ['#141a40', '#4a5ab0', '#ffe9a0'], hw: 4.1, L: 1.04, edge: 'crystal', tip: 'spike', guard: 'wing', glow: '255,236,150', rune: '255,236,150', trim: ['#4a3a10', '#e8c040', '#fff2b0'] },
    amb: ['star', '255,236,150', 0.18],
    mod(p, t) { return t.z > 30 ? 1.2 : 1; },
    kill(p, t) { Gear.meteor(p, t.x, t.y, 1.2, '255,226,130'); },
  },
  {
    id: 'w15', name: '암살검 쉐도우팽', sub: '그림자 속에서 목을 노리는 단검', price: 1700000, map: 2,
    atk: 1.25, stop: 0.8, shake: 0.85, move: 1.08, col: '150,100,235', snd: 'shadow', part: 'shadow', pitch: 1.0, swingPitch: 1.12,
    feel: '소리 없이 스며드는 부드러운 절삭음', desc: '등 뒤 공격 +60% 피해. 이동속도 +8%. 12% 확률로 그림자 분신이 0.12초 뒤 60% 추가 타격.',
    look: { c: ['#0a0614', '#3a2a68', '#a890e8'], hw: 3, L: 0.92, edge: 'notch', tip: 'point', guard: 'none', glow: '150,100,235', rune: '170,120,255', trim: ['#2a1a48', '#5a3a98', '#a890e8'] },
    amb: ['void', '150,100,235', 0.14],
    mod(p, t, dmg, I) { return I.back ? 1.6 : 1; },
    hit(p, t) {
      if (!chance(0.12)) return;
      Gear.later(7, () => {
        if (!t.hittable()) return;
        const d = sign(p.x - t.x) || 1;
        p.addGhost(t.x + d * 60, t.y, 0, -d, lerpPose(PP.a2s, PP.a3s || PP.a2s, 0.5, P()), 12, '150,100,235');
        FX.add('world', new CutLine(t.x, sy(t.y, t.z + t.h * 0.55), -0.4, 110, 6, '170,120,255', 12));
        Gear.proc(p, t, 0.6, { quiet: true }); Sfx.wlayer('shadow', 2, false);
      });
    },
  },
  {
    id: 'w16', name: '천공의 성검 세라핌', sub: '천사가 떨어뜨린 한 장의 날개', price: 2100000, map: 2,
    atk: 1.4, stop: 1.1, col: '255,252,225', snd: 'wing', part: 'wing', pitch: 1.14, swingPitch: 1.12,
    feel: '깃털처럼 흩날리는 맑고 부드러운 타격', desc: '적중 시 HP 1% 회복. 15번째 적중마다 5초간 받는 피해 -30%의 깃털 보호막.',
    look: { c: ['#8a8aa0', '#f4f4fa', '#ffffff'], hw: 4.7, L: 1.14, edge: 'plain', tip: 'round', guard: 'wing', glow: '255,252,230', rune: '255,250,225', trim: ['#b0a070', '#ffe9a0', '#ffffff'] },
    amb: ['feather', '255,255,240', 0.16],
    hit(p) {
      Gear.heal(p, p.hpMax * 0.01, _n(p, 'hc') % 3 !== 0);
      if (_n(p) % 15 !== 0) return;
      p.shield = 300;
      FX.add('top', new Label(p.x, sy(p.y, p.z) - 170, 'BARRIER', { col: ['#ffffff', '#ffe9a0'], size: 24 }));
      FX.add('ground', new Ring(p.x, sy(p.y, 0), 20, 160, 20, { col: '255,245,200', w: 8 }));
      Sfx.wlayer('holy', 2, false);
    },
  },
  {
    id: 'w17', name: '마검 카오스 엣지', sub: '정해진 모습이 없는 혼돈의 검', price: 2600000, map: 2,
    atk: 1.5, crit: 0.1, critDmg: 1.7, stop: 1.25, shake: 1.3, col: '255,90,200', snd: 'chaos', part: 'chaos', pitch: 0.95, swingPitch: 0.95,
    feel: '매 타격마다 소리가 바뀌는 불안정한 울림', desc: '적중할 때마다 무작위 원소가 발동(화염·냉기·번개·흡혈·독·공허). 칼날 색이 계속 변한다.',
    look: { c: ['#201028', '#802898', '#ffb0ff'], hw: 5, L: 1.1, edge: 'crystal', tip: 'spike', guard: 'claw', glow: '255,90,200', rune: '255,120,220', trim: ['#401850', '#a040c0', '#ffc8ff'], dyn: true },
    amb: ['chaos', '255,90,200', 0.3],
    hit(p, t, dmg, I) {
      const E = WEAPON_BY_ID[choose(ELEM_LIST)];
      if (E.hit) E.hit(p, t, dmg, I);
      Sfx.wlayer(E.snd, 1, false);
      PART[E.part](t.x, t.y, I.hz, I.dir, I.ipw, 0.7, E);
      p.wcol = E.col; p.wHold = 20;
    },
    kill(p, t) { if (chance(0.5)) Gear.meteor(p, t.x, t.y, 0.9, '255,120,220'); },
  },
];
const WEAPON_BY_ID = Object.fromEntries(WEAPONS.map(w => [w.id, w]));

// ============================================================
//  방어구 12종
//   def 받는 피해 감소, hp 체력배율, move 이동속도배율, mpRegen, cdr 쿨타임 감소, dodge 회피
// ============================================================
const ARMORS = [
  {
    id: 'a0', name: '견습 검사복', sub: '낡았지만 몸에 맞는 옷', price: 0, map: 1,
    def: 0, hp: 1, desc: '특별한 효과 없음.', look: {},
  },
  {
    id: 'a1', name: '가죽 흉갑', sub: '사냥꾼이 쓰던 질긴 가죽', price: 9000, map: 1,
    def: 0.06, hp: 1.04, move: 1.04, desc: '받는 피해 -6%, 이동속도 +4%.',
    look: { coat: ['#2a1c10', '#5a3c22', '#8a6038'], metal: ['#3a2a1c', '#6a4a2c', '#a0784a'], deco: 'leather', dc: ['#2a1a0e', '#6a4428', '#a87a48'] },
  },
  {
    id: 'a2', name: '사슬 갑옷', sub: '촘촘히 엮은 강철 고리', price: 24000, map: 1,
    def: 0.1, hp: 1.1, desc: '받는 피해 -10%, 최대 HP +10%.',
    look: { coat: ['#1c2028', '#444c5c', '#7c8698'], metal: ['#4a5262', '#8a94a8', '#d0d8e6'], deco: 'chain', dc: ['#3a4252', '#7a8498', '#c8d0e0'] },
  },
  {
    id: 'a3', name: '가시 갑옷 쏜하트', sub: '건드린 자에게 가시가 돋는다', price: 46000, map: 1,
    def: 0.08, hp: 1.05, thorns: true, desc: '받는 피해 -8%. 근접 공격한 적에게 가시로 반격 피해(내 공격력의 35%).',
    look: { coat: ['#1a1410', '#3e2c22', '#6a4c3a'], metal: ['#2a2a2a', '#5a5a5a', '#9a9a9a'], deco: 'spikes', dc: ['#2a2020', '#5a4a40', '#b8a898'] },
  },
  {
    id: 'a4', name: '마도사의 로브', sub: '마력이 흐르는 보랏빛 의복', price: 78000, map: 1,
    def: 0.04, hp: 1.04, mpRegen: 1.9, cdr: 0.1, desc: 'MP 재생 +90%, 스킬 쿨타임 -10%, 받는 피해 -4%.',
    look: { coat: ['#1c1038', '#3e2a78', '#7a5ac8'], metal: ['#3a2a68', '#7a5ac8', '#c0a8ff'], deco: 'robe', dc: ['#2a1858', '#5a3aa8', '#a888f0'], glow: '170,130,255' },
  },
  {
    id: 'a5', name: '수호의 판금 갑주', sub: '왕실 기사단의 방패와 같은 갑옷', price: 120000, map: 1,
    def: 0.2, hp: 1.2, move: 0.95, kbRes: 0.5, desc: '받는 피해 -20%, 최대 HP +20%, 피격 시 밀려나는 거리 절반. 이동속도 -5%.',
    look: { coat: ['#1a2030', '#3a4868', '#6a80b0'], metal: ['#5a6a88', '#a8b8d8', '#f0f6ff'], deco: 'plate', dc: ['#4a5a78', '#9aaccc', '#eaf2ff'], trim: ['#8a6a20', '#d8aa38', '#fff0a8'] },
  },
  {
    id: 'a6', name: '그림자 망토', sub: '어둠에 녹아드는 밤의 외투', price: 170000, map: 1,
    def: 0.05, hp: 1, move: 1.06, dodge: 0.14, desc: '14% 확률로 공격을 회피. 이동속도 +6%, 받는 피해 -5%.',
    look: { coat: ['#06060c', '#1a1a2c', '#3a3a58'], metal: ['#1a1a2a', '#3a3a58', '#6a6a98'], deco: 'cloak', dc: ['#08080e', '#1c1c30', '#40406a'], glow: '120,100,220' },
  },
  {
    id: 'a7', name: '불사조 갑주', sub: '재 속에서 다시 날아오르는 날개', price: 240000, map: 1,
    def: 0.12, hp: 1.1, phoenix: true, desc: '던전당 1회, 치명상을 입으면 HP 45%로 부활하며 불꽃 폭발. 받는 피해 -12%.',
    look: { coat: ['#3a0e06', '#a8300e', '#f07a28'], metal: ['#6a2410', '#e0602a', '#ffd070'], deco: 'wings', dc: ['#8a2008', '#f0602a', '#ffd070'], glow: '255,150,50' },
  },
  {
    id: 'a8', name: '용린 갑옷 드래곤스킨', sub: '고룡의 비늘을 한 장씩 꿰었다', price: 400000, map: 2,
    def: 0.26, hp: 1.25, capHit: 0.2, desc: '받는 피해 -26%, 최대 HP +25%. 한 번에 최대 HP의 20% 이상은 절대 입지 않는다.',
    look: { coat: ['#06201a', '#126a56', '#38c0a0'], metal: ['#0e4a3c', '#2a9a80', '#8ae8c8'], deco: 'scales', dc: ['#0a3a30', '#1e8a70', '#7adcc0'], glow: '90,230,190' },
  },
  {
    id: 'a9', name: '흑요석 흉갑', sub: '화산유리를 깎아낸 검은 갑옷', price: 600000, map: 2,
    def: 0.22, hp: 1.2, nova: true, desc: '받는 피해 -22%, 최대 HP +20%. 피격 시 충격파가 주변 적을 밀쳐내고 80% 피해(1.5초 재사용).',
    look: { coat: ['#0a0810', '#241a38', '#4a3a70'], metal: ['#14101e', '#3a2a58', '#8a6ad0'], deco: 'obsidian', dc: ['#0a0812', '#2a1e44', '#7a5ac0'], glow: '170,120,255' },
  },
  {
    id: 'a10', name: '천사의 가호', sub: '신성한 빛이 감싸는 순백의 갑주', price: 850000, map: 2,
    def: 0.2, hp: 1.3, regen: 0.015, desc: '받는 피해 -20%, 최대 HP +30%. 3초간 맞지 않으면 초당 HP 1.5% 회복.',
    look: { coat: ['#8a90a8', '#e8ecf8', '#ffffff'], metal: ['#b0a070', '#ffe9a0', '#ffffff'], deco: 'halo', dc: ['#a8aec4', '#f4f6fc', '#ffffff'], glow: '255,240,170', trim: ['#b0903a', '#ffd24a', '#fff6c8'] },
  },
  {
    id: 'a11', name: '멸망의 갑주 도무스', sub: '왕좌를 불태운 자의 마지막 갑옷', price: 1200000, map: 2,
    def: 0.34, hp: 1.4, berserk: 0.15, desc: '받는 피해 -34%, 최대 HP +40%. HP가 절반 이하면 공격력 +15%.',
    look: { coat: ['#12060a', '#4a0e1c', '#a82040'], metal: ['#1a0a10', '#5a1830', '#d83060'], deco: 'horns', dc: ['#14080c', '#4a1020', '#c02848'], glow: '255,60,110', trim: ['#4a0e1c', '#a82040', '#ff6080'] },
  },
];
const ARMOR_BY_ID = Object.fromEntries(ARMORS.map(a => [a.id, a]));
