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

  reset() { Game.tstopT = 0; Game.eclipseT = 0; Game.stormT = 0; Game.crack = null; Game.inkT = 0; },
  tick() {
    if (Game.eclipseT > 0) Game.eclipseT--;
    if (Game.stormT > 0) Game.stormT--;
    if (Game.inkT > 0) Game.inkT--;
    if (Game.crack && Game.crack.t > 0) Game.crack.t--;
  },

  // 화면 전체 연출 (월드 위, UI 아래)
  overlay(ctx) {
    const t = Game.time;
    if (Game.inkT > 0 && Game.player) {                      // 크라켄의 먹물 : 내 주변만 보인다
      const p = Game.player, a = Math.min(1, Game.inkT / 30, (300 - Game.inkT) / 20), X = p.x - Game.cam.x, Y = sy(p.y, p.z + 60);
      const g = ctx.createRadialGradient(X, Y, 120, X, Y, 360);
      g.addColorStop(0, 'rgba(4,6,16,0)'); g.addColorStop(1, `rgba(4,6,16,${0.92 * a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
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

// ============================================================
//  타격 정의 (스킬 전용)
// ============================================================
const WH = {
  fireTick: WS.hd({ dmg: 0.5, kx: 0, airKz: 1, stun: 10, stop: 1, shake: 0, fx: 'none', sfx: 'none' }),
  holyCounter: WS.hd({ dmg: 11, kx: 10, kz: 8, airKz: 8, stun: 50, stop: 14, shake: 12, fx: 'heavy', power: 2 }),
  angelRing: WS.hd({ dmg: 6, kx: 11, kz: 6, airKz: 7, stun: 40, stop: 6, shake: 6, fx: 'blunt' }),
};

// ============================================================
//  스킬 정의 : 검마다 s5(고유기, G) / s6(각성기, R)
// ============================================================
const ws = (s5, s6) => ({ s5: Object.assign({ key: 's5' }, s5), s6: Object.assign({ key: 's6' }, s6) });
const swingT = (p, k, sp = 1.4) => { p.play(k, 1, sp, true); p.swing = newSwing(); };

const WSK = {
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
