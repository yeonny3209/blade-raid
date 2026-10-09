'use strict';
// ============================================================
//  보스 몸체 (2) : 세라핌 / 공허의 아가리 / 용 / 흡혈 백작 / 수정 핵 / 크라켄 / 목 없는 기사
// ============================================================

// 땅에서 솟는 촉수
class BTentacle {
  constructor(x, y, h, col) { Object.assign(this, { x, y, h, col, t: 0, life: 44 }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const u = this.t / this.life, rise = u < 0.25 ? E.out3(u / 0.25) : u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1, gy = sy(this.y, 0), H = this.h * rise;
    ctx.save(); ctx.lineCap = 'round';
    const pts = []; for (let i = 0; i <= 8; i++) { const v = i / 8; pts.push([this.x + Math.sin(v * 4 + this.t * 0.3) * 18 * v, gy - H * v]); }
    for (const [w, c] of [[30, '#14061e'], [22, this.col[0]], [8, this.col[1]]]) {
      ctx.strokeStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => { ctx.lineWidth = w * (1 - i / 10); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.lineWidth = w * 0.7; ctx.stroke();
    }
    ctx.fillStyle = '#0a0410'; ctx.beginPath(); ctx.ellipse(this.x, gy, 36, 12, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// 바닥을 가르는 광선
class BBeam {
  constructor(x0, y0, x1, y1, life, col, w = 26) { Object.assign(this, { x0, y0, x1, y1, life, col, w, t: 0, add: true }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const a = 1 - this.t / this.life, z = 30;
    ctx.save(); ctx.lineCap = 'round';
    for (const [w, c, al] of [[this.w * 2.4, this.col, 0.25], [this.w, this.col, 0.8], [this.w * 0.35, '255,255,255', 1]]) {
      ctx.strokeStyle = `rgba(${c},${al * a})`; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(this.x0, sy(this.y0, z)); ctx.lineTo(this.x1, sy(this.y1, z)); ctx.stroke();
    }
    ctx.restore();
  }
}
// 주기적으로 충격파를 내는 수정 기둥
class BPylon {
  constructor(b, x, y, life) { Object.assign(this, { b, x, y, life, t: 0 }); }
  update() {
    this.t++;
    if (this.t % 80 === 40 && this.t < this.life - 20) {
      const b = this.b;
      FX.add('ground', new ShockWave(this.x, this.y, { col: '190,170,255', speed: 6, maxR: 260, w: 12, hitFn: w => {
        const pl = BX.pl(); if (w.hit || !pl) return;
        const d = Math.hypot(pl.x - w.x, (pl.y - w.y) * 2.8);
        if (Math.abs(d - w.r) < 22 && pl.z < 40) { w.hit = true; applyHit(b, pl, CH.shot, { dir: sign(pl.x - w.x) || 1, noStopAtt: true }); }
      } }));
      Sfx.wlayer('ice', 1, false);
    }
    return this.t < this.life && !this.b.dead;
  }
  draw(ctx) {
    const gy = sy(this.y, 0), a = Math.min(1, this.t / 12, (this.life - this.t) / 12), T = Game.time;
    ctx.save(); ctx.globalAlpha = a;
    DR.poly(ctx, [this.x - 26, gy, this.x - 18, gy - 150, this.x, gy - 190, this.x + 18, gy - 150, this.x + 26, gy], '#a890f0', 2);
    ctx.fillStyle = '#e8e0ff'; ctx.beginPath(); polyPath(ctx, [this.x - 4, gy - 10, this.x - 2, gy - 170, this.x + 8, gy - 150, this.x + 6, gy - 10]); ctx.fill();
    DR.glow(ctx, this.x, gy - 100, 70 + Math.sin(T * 0.2) * 8, '190,170,255', 0.5);
    ctx.restore();
  }
}

// ============================================================
//  7. 천공의 심판자 세라핌
// ============================================================
CREATURES.seraph = {
  w: 34, h: 300, d: 26, shadow: 1.2, speed: 2.2, keep: 320, rest: 45, roarPitch: 1.5,
  pal: { robe: ['#b8b0a0', '#f2eee4', '#ffffff'], gold: ['#8a7030', '#e8d48a', '#fff8d8'], wing: ['#c8c4d8', '#f4f2fa', '#ffffff'] },
  onInterrupt(b) { b.alpha = 1; b.invul = 0; },
  draw(ctx, b, P, k) {
    const t = k.t, R = P.robe, G = P.gold, Wg = P.wing, F = 70 + Math.sin(t * 0.06) * 10;
    let spread = 0.3 + Math.sin(t * 0.08) * 0.08, spear = -1.1, armUp = 0;
    if (k.act === 'fan') spread = k.af < 26 ? 0.1 : 1;
    if (k.act === 'spears' || k.a === 'roar') { spear = -1.6; armUp = 1; spread = 0.7; }
    if (k.act === 'cross') { spread = 0.9; armUp = 0.5; }
    if (k.act === 'blink' && k.af > 40) spear = 0;
    if (k.st === 'break') spread = -0.2;
    ctx.save(); ctx.translate(0, -F);
    // 날개 두 쌍
    for (const [ox, oy, s, c] of [[-10, -190, 1.25, Wg[0]], [-6, -150, 1, Wg[1]]]) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 - 0.5 - i * 0.24 - spread * 0.4, L = (150 - i * 14) * s;
        DR.poly(ctx, [ox, oy, ox + Math.cos(a) * L * 0.5 - 10, oy + Math.sin(a) * L * 0.5, ox + Math.cos(a) * L, oy + Math.sin(a) * L, ox + Math.cos(a) * L * 0.5 + 10, oy + Math.sin(a) * L * 0.5 + 6], i % 2 ? c : Wg[2], 1.4);
      }
    }
    DR.glow(ctx, -40, -230, 160, '255,245,210', 0.3);
    // 로브 (발 없이 빛으로 사라짐)
    DR.poly(ctx, [-40, -180, 40, -180, 52, -40, 0, 40, -52, -40], R[1], 2.2);
    ctx.fillStyle = R[0]; ctx.beginPath(); polyPath(ctx, [-40, -180, -10, -180, -20, 20, -52, -40]); ctx.fill();
    ctx.strokeStyle = G[1]; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -180); ctx.lineTo(0, 30); ctx.stroke();
    DR.glow(ctx, 0, 30, 60, '255,240,190', 0.8);
    // 팔 + 창
    const hx = 40, hy = -150 - armUp * 60;
    DR.cap(ctx, 30, -170, hx, hy, 10, 8, R[2], 1.8);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(spear);
    DR.poly(ctx, [-160, -3, 120, -3, 120, 3, -160, 3], G[0], 1.4);
    DR.poly(ctx, [120, -10, 170, 0, 120, 10], G[2], 1.6);
    DR.glow(ctx, 150, 0, 40, '255,240,190', 0.8);
    ctx.restore();
    // 얼굴 없는 가면 + 후광
    DR.ell(ctx, 6, -212, 24, 30, G[2], 0, 2);
    ctx.fillStyle = 'rgba(120,100,60,0.6)'; ctx.fillRect(-4, -218, 26, 3);
    ctx.strokeStyle = G[1]; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -258, 34, 9, 0, 0, TAU); ctx.stroke();
    DR.glow(ctx, 0, -258, 60, b.enraged ? '255,120,80' : '255,240,170', 0.6);
    ctx.restore();
  },
  acts: {
    spears: {
      anim: 'spears', len: 80, counter: 0, armor: [0, 999], cd: 220,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 4) Sfx.play('charge', 0.7, 1.4);
        if (f >= 12 && f <= 52 && f % 8 === 4) {
          const p = Game.player, i = (f - 12) / 8, dir = sign(p.vx) || b.facing;
          const x = clamp(p.x + dir * (i - 2) * 90, Game.room.minX + 30, Game.room.maxX - 30), y = clamp(p.y + rand(-30, 30), 0, DEPTH);
          BX.tele(x, y, 46, 18, 26, '255,240,170', tg => BX.shot(b, tg.x, tg.y, 420, 0, 0, -30, { style: 'spear', r: 14, col: '255,240,170', hd: CH.shot, onEnd: s => { BX.blast(b, s.x, s.y, 50, 20, CH.shot, '255,240,170', { style: 'quiet' }); FX.add('world', new Flash(s.x, sy(s.y, 10), 10, 70, 12, '255,240,170', 0.9)); Sfx.wlayer('holy', 0, false); } }));
        }
      },
    },
    fan: {
      anim: 'fan', len: 60, counter: 20, armor: [0, 999], cd: 180, when: (b, p, adx) => adx > 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 26) {
          Sfx.wlayer('wing', 3, true);
          for (let i = 0; i < 7; i++) BX.shot(b, b.x + b.facing * 30, b.y, 80, b.facing * 8.5, (i - 3) * 0.9, 0, { style: 'feather', r: 14, col: '255,250,225', hd: CH.shot, life: 160, pierce: false, floor: true });
        }
      },
    },
    cross: {
      anim: 'cross', len: 100, counter: 0, armor: [0, 999], cd: 300, cd0: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const fire = y => {
          const r = Game.room;
          FX.add('world', new FlashLine(r.minX, r.maxX, sy(y, 40), 26, '255,240,170'));
          const p = BX.pl(); if (p && Math.abs(p.y - y) < 34 && p.z < 120) applyHit(b, p, CH.mid, { dir: b.facing, noStopAtt: true });
          Sfx.play('flash', 0.6); Game.addShake(6);
        };
        if (f === 6 || f === 50) {
          const p = Game.player, r = Game.room, ys = [p.y, clamp(p.y + (p.y > DEPTH / 2 ? -1 : 1) * rand(90, 140), 0, DEPTH)];
          for (const y of ys) BX.lane(r.minX, r.maxX, y, 32, 36, '255,240,170', () => fire(y));
        }
      },
    },
    blink: {
      anim: 'blink', len: 76, counter: 40, armor: [0, 999], cd: 240, cd0: 120,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f < 20) b.alpha = 1 - f / 20;
        if (f === 2) { b.invul = 40; Sfx.wlayer('holy', 1, false); }
        if (f === 26) { const d = p.facing || 1; b.x = clamp(p.x - d * 150, Game.room.minX + 40, Game.room.maxX - 40); b.y = p.y; b.facing = sign(p.x - b.x) || 1; b.glint(); }
        if (f > 26 && f <= 40) b.alpha = (f - 26) / 14;
        if (f === 44) { b.swing = newSwing(); Sfx.play('swingBig', 1.2, 1.2); }
        if (f >= 44 && f <= 50) { b.vx = b.facing * 6; b.hitPlayer(CH.heavy, { x0: 0, x1: 250, d: 40, z0: 0, z1: 220 }); }
      },
      cancel(b) { b.alpha = 1; },
    },
  },
};

// ============================================================
//  8. 나락의 아가리
// ============================================================
CREATURES.maw = {
  w: 70, h: 300, d: 34, shadow: 1.6, speed: 1.4, keep: 300, rest: 45, roarPitch: 0.5,
  pal: { flesh: ['#150a24', '#3a1d60', '#6a3fa0'], teeth: ['#c8b8a0', '#f0e8d8', '#ffffff'], ten: ['#4a2380', '#8a55c8', '#c89aff'] },
  draw(ctx, b, P, k) {
    const t = k.t, Fl = P.flesh, F = 90 + Math.sin(t * 0.04) * 12;
    let open = 0.25 + Math.sin(t * 0.07) * 0.08;
    if (k.act === 'devour') open = k.af < 20 ? k.af / 20 : k.af < 124 ? 1 : 0.3;
    if (k.act === 'orbs') open = k.af > 20 && k.af < 34 ? 0.9 : 0.2;
    if (k.a === 'roar' || k.act === 'roar') open = 1;
    if (k.st === 'break') open = 0.05;
    ctx.save(); ctx.translate(0, -F - 110);
    // 늘어진 촉수
    for (let i = 0; i < 6; i++) {
      const x0 = -70 + i * 28, L = 120 + (i % 3) * 30;
      ctx.lineCap = 'round';
      for (const [w, c] of [[16, '#0c0414'], [11, P.ten[0]]]) {
        ctx.strokeStyle = c; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(x0, 60); ctx.bezierCurveTo(x0 + Math.sin(t * 0.06 + i) * 30, 60 + L * 0.4, x0 - Math.sin(t * 0.05 + i) * 30, 60 + L * 0.7, x0 + Math.sin(t * 0.07 + i * 2) * 20, 60 + L); ctx.stroke();
      }
    }
    // 몸
    DR.ell(ctx, 0, 0, 120, 110, Fl[1], 0, 2.6);
    ctx.fillStyle = Fl[0]; ctx.beginPath(); ctx.ellipse(-20, 20, 96, 80, 0, 0.5, Math.PI + 0.5); ctx.fill();
    // 입 (이빨 고리)
    const mr = 30 + open * 50;
    ctx.fillStyle = '#05010a'; ctx.beginPath(); ctx.ellipse(40, 30, mr, mr * 0.8, 0, 0, TAU); ctx.fill();
    DR.glow(ctx, 40, 30, mr * 1.4, '170,80,255', 0.4 + open * 0.4);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = 40 + Math.cos(a) * mr, y = 30 + Math.sin(a) * mr * 0.8; DR.poly(ctx, [x, y, x - Math.cos(a) * 18 + Math.sin(a) * 6, y - Math.sin(a) * 15, x - Math.sin(a) * 6, y + Math.cos(a) * 5], P.teeth[1], 1); }
    // 외눈
    DR.ell(ctx, 20, -70, 34, 26, '#f0e8d8', 0, 2);
    ctx.fillStyle = b.enraged ? '#ff3010' : '#c060ff'; ctx.beginPath(); ctx.arc(30, -70, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = '#100410'; ctx.beginPath(); ctx.ellipse(32, -70, 5, 14, 0, 0, TAU); ctx.fill();
    DR.glow(ctx, 30, -70, 44, k.act === 'gaze' ? '255,60,200' : '190,110,255', k.act === 'gaze' ? 1 : 0.5);
    ctx.restore();
  },
  acts: {
    tentacles: {
      anim: 'tentacles', len: 80, counter: 0, armor: [0, 999], cd: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f >= 8 && f <= 56 && f % 12 === 8) {
          const p = Game.player, x = clamp(p.x + rand(-40, 40), Game.room.minX + 30, Game.room.maxX - 30), y = clamp(p.y + rand(-20, 20), 0, DEPTH);
          BX.tele(x, y, 56, 22, 26, b.elem, tg => { FX.add('world', new BTentacle(tg.x, tg.y, 240, ['#4a2380', '#c89aff'])); BX.hitAt(b, tg.x, tg.y, 58, 24, CH.launch, 200); Sfx.play('pillar', 0.6, 0.8); Game.addShake(4); });
        }
      },
    },
    devour: {
      anim: 'devour', len: 140, counter: 0, armor: [0, 999], cd: 380, cd0: 260, when: (b, p, adx) => adx < 900,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 8) { Sfx.play('roar', 1.2, 0.5); FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '도망쳐!', { col: ['#fff', '#c89aff'], size: 28, life: 60 })); }
        if (f >= 22 && f < 124) {
          BX.pullPlayer(b.x + b.facing * 60, b.y, 3.4);
          if (f % 3 === 0) { const a = rand(0, TAU), R = rand(200, 400); FX.add('world', new Mote(b.x + Math.cos(a) * R, sy(b.y, 160) + Math.sin(a) * R * 0.4, 0, 0, { col: '190,110,255', life: 24, r: 8, tx: b.x + b.facing * 40, ty: sy(b.y, 230), grav: 0 })); }
          if (f % 18 === 0) { BX.hitAt(b, b.x + b.facing * 60, b.y, 150, 70, CH.light, 200); }
          if (f % 8 === 0) Game.addShake(2);
        }
      },
    },
    orbs: {
      anim: 'orbs', len: 56, counter: 0, armor: [0, 999], cd: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 24) {
          Sfx.play('magic', 0.9, 0.6);
          const p = Game.player;
          for (let i = 0; i < 4; i++) { const dx = p.x - b.x; BX.shot(b, b.x + b.facing * 40, b.y, 200, dx / 60 + rand(-2, 2), rand(-1.2, 1.2), rand(3, 7), { style: 'orb', r: 18, col: '190,110,255', grav: 0.32, bounce: 0.78, maxBounce: 5, life: 300, hd: CH.shot }); }
        }
      },
    },
    gaze: {
      anim: 'gaze', len: 150, counter: 0, armor: [0, 999], cd: 300, cd0: 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 2) { b.gx = b.x + b.facing * 150; b.gy = b.y; Sfx.play('charge', 0.8, 0.5); }
        if (f >= 30 && f < 140) {
          b.gx += clamp(p.x - b.gx, -3.4, 3.4); b.gy += clamp(p.y - b.gy, -1.8, 1.8);
          FX.add('world', new Bolt(b.x + b.facing * 30, sy(b.y, 290), b.gx, sy(b.gy, 0), { col: '255,80,220', life: 2, amp: 3, w: 6 }));
          FX.add('ground', new Ring(b.gx, sy(b.gy, 0), 6, 60, 8, { col: '255,80,220', w: 6 }));
          if (f % 16 === 0) BX.hitAt(b, b.gx, b.gy, 54, 24, CH.shot, 60);
        }
      },
    },
  },
};

// ============================================================
//  9. 화염의 용
// ============================================================
CREATURES.dragon = {
  w: 100, h: 270, d: 40, shadow: 2.2, speed: 1.9, keep: 300, rest: 45, roarPitch: 0.7,
  pal: { scale: ['#4a1206', '#a33c12', '#e87a30'], belly: ['#a87a30', '#e8c060', '#fff0a0'], wing: ['#3a0a06', '#7a2010', '#c04a20'], horn: ['#3a3020', '#c8b890', '#fff8e0'] },
  draw(ctx, b, P, k) {
    const t = k.t, S = P.scale, Wg = P.wing;
    const walk = k.a === 'walk' ? k.at * 0.14 : 0;
    let headX = 200, headY = -230, jaw = 0.1, wingUp = 0.2 + Math.sin(t * 0.06) * 0.1, tailA = Math.sin(t * 0.05) * 0.2, lift = 0;
    if (k.act === 'breath') { const f = k.af; if (f < 30) { headX = 170; headY = -260; } else if (f < 100) { headX = 230; headY = -170; jaw = 0.6; } }
    if (k.act === 'gust') wingUp = 0.2 + Math.sin(k.af * 0.4) * 1.0;
    if (k.act === 'spin') tailA = k.af < 30 ? -0.4 : (k.af - 30) * 0.35;
    if (k.act === 'dive') { wingUp = Math.sin(k.af * 0.35) * 1.2; }
    if (k.a === 'roar' || k.act === 'roar') { headY = -290; jaw = 0.7; wingUp = 1; }
    if (k.st === 'break') { headY = -120; headX = 180; lift = 30; }
    ctx.save(); ctx.translate(0, lift);
    // 뒷날개
    const wing = (dx, s, c) => {
      const a = -1.2 - wingUp * 0.6;
      const tipX = dx + Math.cos(a) * 260 * s, tipY = -180 + Math.sin(a) * 260 * s;
      DR.poly(ctx, [dx, -180, tipX, tipY, dx - 120 * s, -160 + wingUp * 20, dx - 60, -150], c, 2);
      ctx.strokeStyle = S[0]; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dx, -180); ctx.lineTo(lerp(tipX, dx - 120 * s, i / 4), lerp(tipY, -160, i / 4)); ctx.stroke(); }
    };
    wing(-10, 0.9, Wg[0]);
    // 꼬리
    ctx.save(); ctx.translate(-120, -120); ctx.rotate(tailA);
    DR.poly(ctx, [0, -26, -100, -10, -200, 30, -260, 60, -190, 46, -100, 30, 0, 26], S[1], 2.2);
    DR.poly(ctx, [-250, 50, -290, 40, -270, 74], P.horn[1], 1.4);
    ctx.restore();
    // 뒷다리
    const leg = (x, ph, c) => { const s = Math.sin(walk + ph) * 18; DR.cap(ctx, x, -110, x + s, -40, 22, 16, c, 2); DR.cap(ctx, x + s, -40, x + s + 16, 0, 16, 12, c, 2); };
    leg(-70, 0, S[0]); leg(60, 1.6, S[0]);
    // 몸통
    DR.ell(ctx, 0, -125, 135, 64, S[1], 0, 2.6);
    ctx.fillStyle = P.belly[1]; ctx.beginPath(); ctx.ellipse(10, -95, 110, 28, 0, 0, Math.PI); ctx.fill();
    for (let i = 0; i < 7; i++) DR.poly(ctx, [-90 + i * 30, -180, -80 + i * 30, -206, -70 + i * 30, -180], P.horn[1], 1.2);
    leg(-40, 3.1, S[1]); leg(90, 4.7, S[1]);
    // 목 + 머리
    ctx.lineCap = 'round';
    DR.cap(ctx, 100, -150, headX - 20, headY + 20, 34, 24, S[1], 2.4);
    ctx.save(); ctx.translate(headX, headY);
    DR.poly(ctx, [-34, -22, 30, -26, 84, -10, 88, 4, 30, 8, -30, 18], S[1], 2.4);
    ctx.save(); ctx.rotate(jaw * 0.6); DR.poly(ctx, [-24, 8, 30, 8, 76, 16, 30, 30, -20, 26], S[0], 2); ctx.restore();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#fff8e0'; ctx.beginPath(); polyPath(ctx, [34 + i * 11, 4, 38 + i * 11, 14, 42 + i * 11, 4]); ctx.fill(); }
    DR.poly(ctx, [-20, -20, -70, -64, -6, -26], P.horn[1], 1.6);
    DR.poly(ctx, [0, -24, -36, -80, 16, -28], P.horn[2], 1.6);
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.ellipse(26, -12, 8, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#100808'; ctx.fillRect(25, -16, 3, 8);
    DR.glow(ctx, 26, -12, 26, b.enraged ? '255,60,30' : '255,200,80', 0.8);
    if (k.act === 'breath' && k.af >= 30 && k.af < 100) DR.glow(ctx, 90, 10, 80, '255,160,60', 1);
    ctx.restore();
    // 앞날개
    wing(30, 1.1, Wg[1]);
    ctx.restore();
  },
  acts: {
    breath: {
      anim: 'breath', len: 110, counter: 30, armor: [0, 999], cd: 260, when: (b, p, adx) => adx < 560,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 4) Sfx.play('roar', 1, 0.8);
        if (f >= 30 && f < 100) {
          const aimY = clamp(b.y + Math.sin((f - 30) * 0.07) * 130, 0, DEPTH), u = (f - 30) / 70;
          for (let i = 0; i < 3; i++) { const L = rand(80, 500); FX.add('world', new Mote(b.x + b.facing * (240 + L * 0.2), sy(b.y, 200), b.facing * L / 26, (aimY - b.y) / 26 + rand(-0.4, 0.8), { col: chance(0.5) ? '255,140,40' : '255,220,100', life: 26, r: rand(14, 26), grav: 0.08 })); }
          if (f % 12 === 0) {
            const p = BX.pl();
            if (p) { const rel = (p.x - b.x) * b.facing; if (rel > 60 && rel < 560 && Math.abs(p.y - aimY) < 46 && p.z < 140) applyHit(b, p, CH.shot, { dir: b.facing, noStopAtt: true }); }
            if (f % 24 === 0) BX.zone(b, b.x + b.facing * rand(200, 480), aimY, { rx: 50, ry: 20, life: 150, every: 28, col: '255,130,40', hd: CH.tick });
          }
          if (f % 12 === 0) Sfx.wlayer('fire', 1, false);
        }
      },
    },
    gust: {
      anim: 'gust', len: 100, counter: 0, armor: [0, 999], cd: 280, cd0: 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) { Sfx.wlayer('wind', 3, true); Sfx.play('roar', 0.5, 1.2); BX.hitAt(b, b.x + b.facing * 150, b.y, 240, 100, CH.push, 200); }
        if (f >= 20 && f < 90) {
          const p = Game.player;
          if (p && p.hp > 0 && Math.abs(p.x - b.x) < 760) p.x = clamp(p.x + sign(p.x - b.x) * 3.6, Game.room.minX, Game.room.playerMaxX());
          if (f % 3 === 0) FX.add('world', new CutLine(b.x + b.facing * rand(100, 600), sy(rand(0, DEPTH), rand(20, 160)), b.facing > 0 ? 0 : Math.PI, rand(60, 120), 2, '255,230,200', 10));
          if (f % 20 === 0) for (let i = 0; i < 3; i++) BX.shot(b, b.x + b.facing * 120, clamp(b.y + (i - 1) * 60, 0, DEPTH), 60, b.facing * 9, 0, 0, { style: 'orb', r: 14, col: '255,220,180', hd: CH.shot, floor: true, life: 120 });
        }
      },
    },
    spin: {
      anim: 'spin', len: 70, counter: 22, armor: [0, 999], cd: 200, when: (b, p, adx, ady) => adx < 330 && ady < 100,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 10) { BX.lane(b.x - 320, b.x + 320, b.y, 92, 26, b.elem); FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, 'JUMP!', { col: ['#fff', '#ffb030'], size: 26 })); }
        if (f === 36) { Sfx.play('swingBig', 1.3, 0.5); Game.addShake(10); Hitfx.dust(b.x, sy(b.y, 0), 14, 260); BX.hitAt(b, b.x, b.y, 330, 96, CH.heavy, 50); }
      },
    },
    dive: {
      anim: 'dive', len: 150, counter: 0, armor: [0, 999], cd: 420, cd0: 300,
      start(b) { b.gravOff = true; Sfx.play('roar', 1.2, 0.7); },
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f < 30) { b.z = lerp(b.z, 620, 0.1); if (f % 4 === 0) Hitfx.dust(b.x, sy(b.y, 0), 3, 120); }
        if (f >= 30 && f <= 90 && f % 6 === 0) {
          const x = clamp(p.x + rand(-300, 300), Game.room.minX + 30, Game.room.maxX - 30), y = clamp(p.y + rand(-90, 90), 0, DEPTH);
          BX.tele(x, y, 52, 20, 22, '255,120,40', tg => FX.add('world', new Meteor(tg.x, tg.y, { col: '255,130,40', dur: 10, r: 18, from: rand(-200, 200), onEnd: m => BX.blast(b, m.x, m.y, 58, 22, CH.shot, '255,140,60', { shake: 3, sfx: 'land', glow: true }) })));
        }
        if (f === 96) { b.dx = p.x; b.dy = p.y; b.dt = BX.tele(p.x, p.y, 190, 64, 30, b.elem); }
        if (f > 96 && f < 112 && b.dt) { b.dx = lerp(b.dx, p.x, 0.08); b.dy = lerp(b.dy, p.y, 0.08); b.dt.x = b.dx; b.dt.y = b.dy; }
        if (f >= 112 && f < 126) { b.x = lerp(b.x, b.dx, 0.35); b.y = lerp(b.y, b.dy, 0.35); b.z = lerp(b.z, 0, 0.35); }
        if (f === 126) { b.z = 0; b.gravOff = false; b.x = b.dx; b.y = b.dy; BX.blast(b, b.x, b.y, 200, 70, CH.heavy, '255,140,60', { shake: 20, sfx: 'quake', glow: true }); FX.add('ground', new Crack(b.x, b.y, 180)); }
      },
      cancel(b) { b.gravOff = false; b.z = 0; },
    },
  },
};

// ============================================================
//  10. 피의 백작 드라쿨 (흡혈귀)
// ============================================================
CREATURES.vampire = {
  w: 24, h: 220, d: 18, shadow: 1, speed: 2.8, keep: 240, rest: 40, roarPitch: 1.3,
  pal: { cape: ['#0a0206', '#1c060c', '#3a0a16'], inner: ['#5a0a14', '#a8142c', '#e04050'], skin: ['#a8a0b0', '#e0dae6', '#ffffff'], suit: ['#0c0a10', '#1e1a26', '#3a3448'] },
  onInterrupt(b) { b.alpha = 1; b.invul = 0; },
  draw(ctx, b, P, k) {
    const t = k.t, C = P.cape, In = P.inner, Sk = P.skin, Su = P.suit;
    const walk = k.a === 'walk' ? Math.sin(k.at * 0.2) : 0;
    let capeF = 0.2 + Math.sin(t * 0.07) * 0.1, arm = 0, lean = 0;
    if (k.act === 'claws') { const f = k.af; arm = [20, 32, 46].some(x => f >= x && f < x + 6) ? 1 : 0.3; lean = 0.1; }
    if (k.act === 'drain' || k.act === 'spikes' || k.a === 'roar') { capeF = 1; arm = -1; }
    if (k.st === 'break') lean = -0.2;
    ctx.save(); ctx.rotate(lean);
    // 망토 (뒤)
    DR.poly(ctx, [-20, -190, -60 - capeF * 60, -150, -80 - capeF * 70, -10, 10, -10, 20, -190], C[1], 2);
    ctx.fillStyle = In[1]; ctx.beginPath(); polyPath(ctx, [-10, -184, -46 - capeF * 50, -140, -64 - capeF * 60, -14, 0, -14]); ctx.fill();
    // 다리
    DR.cap(ctx, -6, -96, -6 - walk * 14, 0, 8, 6, Su[1], 1.8);
    DR.cap(ctx, 8, -96, 8 + walk * 14, 0, 8, 6, Su[2], 1.8);
    // 몸통
    DR.poly(ctx, [-20, -100, 22, -100, 26, -180, -24, -182], Su[1], 2);
    ctx.fillStyle = In[1]; ctx.beginPath(); polyPath(ctx, [0, -176, 14, -176, 8, -120, 2, -120]); ctx.fill();
    // 높은 깃
    DR.poly(ctx, [-30, -176, -40, -230, -6, -190, 30, -176, 40, -228, 10, -190], C[2], 1.6);
    // 팔 + 발톱
    const hx = 30 + arm * 40, hy = arm < 0 ? -220 : -130 - arm * 20;
    DR.cap(ctx, 14, -168, hx, hy, 7, 6, Su[2], 1.6);
    for (let i = 0; i < 3; i++) DR.poly(ctx, [hx, hy - 4 + i * 4, hx + 22 + arm * 8, hy - 10 + i * 8, hx + 2, hy + 2 + i * 4], Sk[1], 1);
    if (arm > 0.9) DR.glow(ctx, hx + 20, hy, 40, '255,40,70', 0.7);
    // 머리
    DR.ell(ctx, 4, -204, 15, 18, Sk[1], 0, 2);
    DR.poly(ctx, [-12, -214, 0, -226, 20, -222, 16, -210, -6, -208], '#100810', 1.4);          // 올백 머리
    ctx.fillStyle = '#ff2030'; ctx.fillRect(8, -206, 7, 3);
    DR.glow(ctx, 12, -205, 18, '255,30,50', 0.9);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); polyPath(ctx, [10, -194, 12, -188, 14, -194]); ctx.fill();
    ctx.restore();
  },
  acts: {
    batdash: {
      anim: 'batdash', len: 84, counter: 0, armor: [0, 999], cd: 260, when: (b, p, adx) => adx > 180,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f < 16) b.alpha = 1 - f / 16;
        if (f === 2) { b.invul = 70; Sfx.play('roar', 0.5, 1.8); }
        if (f === 16) {
          const d = sign(p.x - b.x) || 1;
          for (let i = 0; i < 9; i++) BX.shot(b, b.x, clamp(b.y + rand(-50, 50), 0, DEPTH), rand(60, 200), d * rand(9, 12), (p.y - b.y) / 60 + rand(-0.8, 0.8), 0, { style: 'bat', r: 14, pierce: true, life: 110, hd: CH.light, floor: true });
          b.bx = clamp(p.x + d * 240, Game.room.minX + 40, Game.room.maxX - 40); b.by = p.y;
        }
        if (f === 60) { b.x = b.bx; b.y = b.by; b.facing = sign(p.x - b.x) || 1; }
        if (f > 60 && f <= 74) b.alpha = (f - 60) / 14;
      },
      cancel(b) { b.alpha = 1; },
    },
    spikes: {
      anim: 'spikes', len: 90, counter: 30, armor: [0, 999], cd: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 10) { b.sa = Math.atan2((p.y - b.y) * 2, p.x - b.x); Sfx.wlayer('blood', 2, false); }
        if (f >= 18 && f <= 60 && (f - 18) % 6 === 0) {
          const i = (f - 18) / 6, d = 70 + i * 70, x = b.x + Math.cos(b.sa) * d, y = clamp(b.y + Math.sin(b.sa) * d / 2, 0, DEPTH);
          BX.tele(x, y, 44, 18, 16, '230,40,70', tg => { FX.add('world', new WSpike(tg.x, tg.y, 130, ['#5a0a14', '#a8142c', '#ff7a8c'])); BX.hitAt(b, tg.x, tg.y, 46, 20, CH.launch, 160); Sfx.play('pillar', 0.4, 1.4); });
        }
      },
    },
    drain: {
      anim: 'drain', len: 160, counter: 0, armor: [0, 999], cd: 380, cd0: 220, when: (b, p, adx) => adx < 500,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 20) { b.drain = true; Sfx.wlayer('blood', 3, true); FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '멀리 떨어져 끊어내라!', { col: ['#fff', '#ff6a80'], size: 22, life: 70 })); }
        if (b.drain && f > 20 && f < 150) {
          if (Math.abs(p.x - b.x) > 560 || p.hp <= 0) { b.drain = false; FX.add('top', new Label(p.x, sy(p.y, 0) - 150, '끊어냈다!', { col: ['#fff', '#7dffa0'], size: 24 })); Sfx.play('counter'); return; }
          FX.add('world', new Bolt(b.x + b.facing * 20, sy(b.y, 170), p.x, sy(p.y, p.z + 70), { col: '255,40,70', life: 2, amp: 10, w: 4 }));
          if (f % 15 === 0) { if (BX.pl()) { applyHit(b, p, CH.tick, { dir: sign(p.x - b.x) || 1, noStopAtt: true }); b.hp = Math.min(b.hpMax, b.hp + b.hpMax * 0.004); } }
        }
      },
      cancel(b) { b.drain = false; },
    },
    claws: {
      anim: 'claws', len: 66, counter: 16, armor: [0, 999], cd: 190, when: (b, p, adx, ady) => adx < 340 && ady < 80,
      update(b, f) {
        b.vy = 0;
        const p = Game.player;
        if (f === 6) { b.x = clamp(p.x - b.facing * 110, Game.room.minX + 30, Game.room.maxX - 30); b.y = p.y; FX.add('world', new Flash(b.x, sy(b.y, 120), 10, 120, 12, '255,40,70', 0.7)); b.glint(); }
        for (const [s, hd] of [[20, CH.light], [32, CH.light], [46, CH.mid]]) {
          if (f === s) { b.swing = newSwing(); Sfx.play('swing', 1, 1.3); FX.add('world', new CutLine(b.x + b.facing * 90, sy(b.y, 120), b.facing > 0 ? -0.6 + (s % 2) : Math.PI + 0.6, 120, 5, '255,60,80', 10)); }
          if (f >= s && f <= s + 4) { b.vx = b.facing * 4; b.hitPlayer(hd, { x0: 0, x1: 170, d: 40, z0: 0, z1: 200 }); }
        }
        if (f > 52) b.vx *= 0.8;
      },
    },
  },
};

// ============================================================
//  11. 프리즘 핵 (수정 동굴)
// ============================================================
CREATURES.crystal = {
  w: 40, h: 280, d: 26, shadow: 1.1, speed: 1.6, keep: 320, rest: 40, roarPitch: 1.8,
  pal: { c1: ['#3a2a6a', '#7aa0e0', '#d8f0ff'], c2: ['#6a2a6a', '#e080e0', '#ffd8ff'], core: ['#4a3a90', '#a080e0', '#ffffff'] },
  draw(ctx, b, P, k) {
    const t = k.t, F = 70 + Math.sin(t * 0.05) * 12, spin = t * 0.03;
    let orb = 110, glowA = 0.5;
    if (k.act === 'nova') orb = k.af < 30 ? 110 - k.af * 2 : 170;
    if (k.act === 'prism') glowA = k.af > 30 ? 1 : 0.7;
    if (k.st === 'break') orb = 60;
    ctx.save(); ctx.translate(0, -F - 110);
    const shard = (i, front) => {
      const a = spin + i * TAU / 6, x = Math.cos(a) * orb, y = Math.sin(a) * orb * 0.35;
      if ((Math.sin(a) > 0) !== front) return;
      const c = i % 2 ? P.c1 : P.c2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a * 2);
      DR.poly(ctx, [0, -30, 12, 0, 0, 30, -12, 0], c[1], 1.4);
      ctx.fillStyle = c[2]; ctx.beginPath(); polyPath(ctx, [0, -30, 12, 0, 0, 4]); ctx.fill();
      ctx.restore();
    };
    for (let i = 0; i < 6; i++) shard(i, false);
    DR.glow(ctx, 0, 0, 170, '190,170,255', 0.3 + glowA * 0.2);
    // 핵 (다면체)
    const pts = [0, -110, 54, -30, 40, 60, 0, 110, -40, 60, -54, -30];
    DR.poly(ctx, pts, P.core[1], 2.4);
    const facet = (a, c) => { ctx.fillStyle = c; ctx.beginPath(); polyPath(ctx, a); ctx.fill(); };
    facet([0, -110, 54, -30, 0, -10], P.c1[2]); facet([0, -110, -54, -30, 0, -10], P.c2[1]);
    facet([54, -30, 40, 60, 0, -10], P.c1[1]); facet([-54, -30, -40, 60, 0, -10], P.core[0]);
    facet([40, 60, 0, 110, 0, -10], P.c2[2]); facet([-40, 60, 0, 110, 0, -10], P.c1[0]);
    DR.glow(ctx, 0, -10, 50, b.enraged ? '255,90,160' : '230,220,255', 0.9);
    for (let i = 0; i < 6; i++) shard(i, true);
    ctx.restore();
  },
  acts: {
    prism: {
      anim: 'prism', len: 90, counter: 0, armor: [0, 999], cd: 230,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 6) {
          const base = Math.atan2((p.y - b.y) * 2, p.x - b.x);
          b.beams = [-0.5, 0, 0.5].map(o => { const a = base + o; return [b.x, b.y, b.x + Math.cos(a) * 900, clamp(b.y + Math.sin(a) * 450, -60, DEPTH + 60)]; });
          for (const [x0, y0, x1, y1] of b.beams) FX.add('ground', new BLine(x0, y0, x1, y1, 34, '190,170,255', 40));
          Sfx.play('charge', 0.8, 1.6);
        }
        if (f === 40 && b.beams) {
          const set = new Set();
          for (const [x0, y0, x1, y1] of b.beams) { FX.add('world', new BBeam(x0, y0, x1, y1, 24, chance(0.5) ? '190,170,255' : '255,160,230')); BX.hitSeg(b, x0, y0, x1, y1, 36, CH.mid, 140, set); }
          Sfx.play('flash', 0.8); Game.addShake(6); b.beams = null;
        }
      },
    },
    rain: {
      anim: 'rain', len: 80, counter: 0, armor: [0, 999], cd: 260,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 10) {
          const p = Game.player, r = Game.room, off = rand(0, 70);
          for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) {
            if ((i + j) % 2) continue;
            const x = clamp(p.x + i * 140 + off, r.minX + 30, r.maxX - 30), y = clamp(p.y + j * 70, 0, DEPTH);
            BX.tele(x, y, 48, 18, 30, '190,170,255', tg => BX.shot(b, tg.x, tg.y, 300, 0, 0, -26, { style: 'shard', r: 16, col: '190,170,255', hd: CH.shot, onEnd: s => { BX.hitAt(b, s.x, s.y, 50, 20, CH.shot); FX.add('world', new Flash(s.x, sy(s.y, 8), 10, 70, 12, '210,200,255', 0.8)); Sfx.wlayer('ice', 0, false); } }));
          }
          Sfx.play('magic', 0.8, 1.6);
        }
      },
    },
    pylons: {
      anim: 'prism', len: 50, counter: 0, armor: [0, 999], cd: 520, cd0: 260,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) {
          const p = Game.player, r = Game.room;
          for (const s of [-1, 1]) FX.add('world', new BPylon(b, clamp(p.x + s * 220, r.minX + 60, r.maxX - 60), clamp(p.y + s * 30, 0, DEPTH), 380));
          Sfx.play('pillar', 0.8, 1.5); Game.addShake(5);
        }
      },
    },
    nova: {
      anim: 'nova', len: 90, counter: 0, armor: [0, 999], cd: 280, cd0: 180,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 30 || f === 54) {
          const off = f === 54 ? Math.PI / 12 : 0;
          for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + off; BX.shot(b, b.x, b.y, 60, Math.cos(a) * 5.5, Math.sin(a) * 2.6, 0, { style: 'shard', r: 14, col: '255,160,230', hd: CH.shot, floor: true, life: 150 }); }
          Sfx.wlayer('ice', 2, true); Game.addShake(4);
        }
      },
    },
  },
};

// ============================================================
//  12. 심해의 군주 크라켄 (움직이지 않는다)
// ============================================================
CREATURES.kraken = {
  w: 90, h: 230, d: 40, shadow: 2, stationary: true, keep: 300, rest: 40, roarPitch: 0.5,
  pal: { skin: ['#0a2a3a', '#1e6a8a', '#58b8d8'], sucker: ['#a8d8e8', '#e8f8ff', '#ffffff'] },
  init(b) { const r = Game.room; b.x = r.maxX - 220; },
  draw(ctx, b, P, k) {
    const t = k.t, S = P.skin;
    let rise = 0, siphon = 0;
    if (k.act === 'ink') siphon = k.af > 20 && k.af < 50 ? 1 : 0;
    if (k.a === 'roar' || k.act === 'roar') rise = -30;
    if (k.st === 'break') rise = 40;
    ctx.save(); ctx.translate(0, rise);
    // 뒤쪽 촉수
    const tent = (x0, ph, len, c, curl) => {
      ctx.lineCap = 'round';
      const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x0 + Math.sin(u * 3 + t * 0.05 + ph) * 40 * u + u * len * 0.6, -60 - Math.sin(u * Math.PI) * 140 * curl + u * 40]); }
      for (const [w, cc] of [[30, '#04121a'], [24, c]]) { ctx.strokeStyle = cc; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.lineWidth = w; ctx.stroke(); }
      ctx.fillStyle = P.sucker[1]; for (let i = 2; i < 10; i += 2) { const [x, y] = pts[i]; ctx.beginPath(); ctx.arc(x, y + 8, 4, 0, TAU); ctx.fill(); }
    };
    tent(-160, 0, 260, S[0], 0.7); tent(-120, 2, 300, S[0], 1);
    // 머리 (외투막)
    DR.ell(ctx, -40, -170, 120, 150, S[1], -0.15, 2.6);
    ctx.fillStyle = S[0]; ctx.beginPath(); ctx.ellipse(-80, -150, 70, 120, -0.15, 0.5, Math.PI + 1); ctx.fill();
    for (let i = 0; i < 8; i++) DR.ell(ctx, -60 + (i * 31) % 90, -260 + (i * 47) % 160, 8, 6, S[2], 0, 0);
    // 눈
    for (const [ex, ey] of [[20, -110], [-30, -100]]) {
      DR.ell(ctx, ex, ey, 26, 22, '#f0e8a0', 0, 2);
      ctx.fillStyle = '#100808'; ctx.fillRect(ex - 14, ey - 3, 28, 7);
      DR.glow(ctx, ex, ey, 30, b.enraged ? '255,80,40' : '255,230,120', 0.5);
    }
    // 수관 (먹물)
    DR.cap(ctx, 50, -150, 90, -170, 16, 12, S[1], 2);
    if (siphon) DR.glow(ctx, 96, -172, 40, '20,20,40', 0.8);
    // 앞쪽 촉수
    tent(-60, 4, 320, S[1], 0.5); tent(0, 1, 280, S[1], 0.35);
    ctx.restore();
  },
  acts: {
    slam: {
      anim: 'slam', len: 90, counter: 0, armor: [0, 999], cd: 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player, r = Game.room;
        if (f === 6) {
          b.lanesY = [p.y, clamp(p.y + (chance(0.5) ? 1 : -1) * rand(70, 110), 0, DEPTH)];
          for (const y of b.lanesY) FX.add('ground', new Telegraph(b.x - 60, y, 0, 40, 40, { shape: 'rect', w: 820, dir: -1, col: b.elem }));
          Sfx.play('roar', 0.5, 0.6);
        }
        if (f === 46 && b.lanesY) {
          for (const y of b.lanesY) {
            for (let i = 0; i < 9; i++) FX.add('world', new BTentacle(b.x - 80 - i * 90, y, 70 + i * 6, ['#1e6a8a', '#a8d8e8']));
            const pl = BX.pl(); if (pl && Math.abs(pl.y - y) < 42 && pl.x < b.x - 40 && pl.x > b.x - 900 && pl.z < 90) applyHit(b, pl, CH.mid, { dir: -1, noStopAtt: true });
            Hitfx.dust(b.x - 420, sy(y, 0), 16, 400, '160,210,230');
          }
          Sfx.play('quake', 0.8); Game.addShake(12);
        }
      },
    },
    ink: {
      anim: 'ink', len: 60, counter: 0, armor: [0, 999], cd: 600, cd0: 280,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 22) {
          Game.inkT = 300; Sfx.play('explode', 0.5, 0.6); Game.flashScreen(0.4, '10,10,30');
          const p = Game.player;
          for (let i = 0; i < 5; i++) {
            const tx = clamp(p.x + rand(-260, 200), Game.room.minX + 30, Game.room.maxX - 30), ty = clamp(p.y + rand(-80, 80), 0, DEPTH), T = 34;
            const v = BX.arc(b.x - 90, b.y, 170, tx, ty, 0, T, 0.45);
            BX.shot(b, b.x - 90, b.y, 170, v[0], v[1], v[2], { style: 'orb', r: 16, col: '30,30,60', grav: 0.45, hd: CH.shot, onEnd: s => BX.zone(b, s.x, s.y, { rx: 80, ry: 28, life: 300, every: 40, col: '40,40,90', slow: true, hd: CH.tick }) });
          }
        }
      },
    },
    whirl: {
      anim: 'whirl', len: 50, counter: 0, armor: [0, 999], cd: 380, cd0: 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 16) { const p = Game.player; BX.zone(b, p.x, p.y, { kind: 'vortex', rx: 150, ry: 54, life: 260, every: 22, pull: 1.9, delay: 30, col: '100,200,240', hd: CH.light, hmax: 90 }); Sfx.wlayer('wind', 2, false); }
      },
    },
    jet: {
      anim: 'jet', len: 80, counter: 0, armor: [0, 999], cd: 220,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player;
        if (f === 6) { b.jy = p.y; FX.add('ground', new Telegraph(b.x - 60, b.jy, 0, 30, 36, { shape: 'rect', w: 1000, dir: -1, col: '120,220,255' })); Sfx.play('charge', 0.6, 0.9); }
        if (f === 42) {
          FX.add('world', new FlashLine(b.x - 60, b.x - 1100, sy(b.jy, 60), 28, '120,220,255'));
          for (let i = 0; i < 20; i++) FX.add('world', new Mote(b.x - rand(80, 900), sy(b.jy, 60) + rand(-12, 12), -rand(4, 10), rand(-1, 1), { col: '200,240,255', life: 26, r: rand(8, 14) }));
          const pl = BX.pl(); if (pl && Math.abs(pl.y - b.jy) < 32 && pl.x < b.x && pl.z < 120) applyHit(b, pl, CH.heavy, { dir: -1, noStopAtt: true });
          Sfx.play('explode', 0.5, 1.3); Game.addShake(8);
        }
      },
    },
  },
};

// ============================================================
//  13. 목 없는 망자 기사 (공동묘지)
// ============================================================
CREATURES.horseman = {
  w: 80, h: 260, d: 38, shadow: 2, speed: 2.6, keep: 320, rest: 40, roarPitch: 1,
  pal: { horse: ['#20302e', '#4a6a66', '#8ab0aa'], armor: ['#0a0c10', '#2a3038', '#68788a'], cape: ['#0a1a14', '#1e4a3a', '#3a7a62'] },
  draw(ctx, b, P, k) {
    const t = k.t, Hs = P.horse, A = P.armor;
    const gal = (k.a === 'walk' || k.act === 'joust') ? k.at * (k.act === 'joust' ? 0.45 : 0.2) : 0;
    let rear = 0, lance = 0;
    if (k.act === 'reap') { rear = k.af < 30 ? k.af / 30 : k.af < 50 ? 1 - (k.af - 30) / 20 : 0; lance = k.af > 30 && k.af < 50 ? (k.af - 30) * 0.3 : 0; }
    if (k.act === 'joust') lance = 0;
    if (k.st === 'break') rear = -0.3;
    ctx.save(); ctx.globalAlpha *= 0.92;
    ctx.translate(-20, -110); ctx.rotate(-rear * 0.45); ctx.translate(20, 110);
    // 유령 말 다리
    const leg = (x, ph, c) => { const s = Math.sin(gal + ph); DR.cap(ctx, x, -100, x + s * 26, -50, 11, 8, c, 1.8); DR.cap(ctx, x + s * 26, -50, x + s * 18 + 8, 0, 8, 6, c, 1.8); };
    leg(-70, 0, Hs[0]); leg(50, 1.5, Hs[0]);
    DR.ell(ctx, -10, -120, 100, 46, Hs[1], 0, 2.4);
    ctx.fillStyle = Hs[0]; ctx.beginPath(); ctx.ellipse(-20, -104, 80, 22, 0, 0, Math.PI); ctx.fill();
    leg(-50, 3, Hs[1]); leg(70, 4.6, Hs[1]);
    // 꼬리 + 목 + 말머리
    ctx.strokeStyle = 'rgba(120,255,200,0.5)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-105, -130); ctx.quadraticCurveTo(-150, -110 + Math.sin(t * 0.1) * 10, -160, -60); ctx.stroke();
    DR.cap(ctx, 70, -140, 110, -200, 24, 18, Hs[1], 2.2);
    DR.poly(ctx, [96, -214, 160, -196, 164, -178, 106, -180], Hs[1], 2);
    ctx.fillStyle = '#9affd8'; ctx.beginPath(); ctx.arc(130, -200, 4, 0, TAU); ctx.fill();
    DR.glow(ctx, 130, -200, 20, '120,255,200', 0.9);
    ctx.strokeStyle = 'rgba(120,255,200,0.5)'; ctx.lineWidth = 6; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(90 - i * 8, -206 + i * 10); ctx.lineTo(70 - i * 10 + Math.sin(t * 0.1 + i) * 6, -210 + i * 12); ctx.stroke(); }
    // 기수 (머리 없음)
    DR.poly(ctx, [-30, -150, 30, -150, 34, -250, -30, -254], A[1], 2.2);
    ctx.fillStyle = A[2]; ctx.fillRect(-4, -246, 12, 90);
    DR.poly(ctx, [-30, -250, -100, -230 + Math.sin(t * 0.08) * 10, -110, -150, -30, -160], P.cape[1], 2);
    DR.ell(ctx, 0, -258, 26, 10, A[2], 0, 1.6);
    for (let i = 0; i < 5; i++) DR.glow(ctx, rand(-10, 10), -270 - i * 10 - (t * 2 % 10), 20 - i * 3, '120,255,200', 0.6);   // 목의 불꽃
    // 창
    ctx.save(); ctx.translate(20, -200); ctx.rotate(-0.08 + lance);
    DR.poly(ctx, [-40, -4, 240, -3, 240, 3, -40, 4], A[2], 1.6);
    DR.poly(ctx, [200, -14, 280, 0, 200, 14], '#d0d8e0', 1.6);
    ctx.restore();
    ctx.restore();
  },
  acts: {
    joust: BX.dash({ anim: 'joust', cd: 320, speed: 17, hd: CH.heavy, repeat: 3, tele: 36, pause: 22,
      trail: b => FX.add('world', new Mote(b.x - b.facing * 40, sy(b.y, rand(40, 200)), -b.facing * 2, -0.5, { col: '120,255,200', life: 30, r: 14 })) }),
    raise: {
      anim: 'raise', len: 60, counter: 0, armor: [0, 999], cd: 700, cd0: 400, when: () => Game.enemies.filter(o => !o.isBoss && !o.dying).length < 2,
      update(b, f) {
        b.vx = 0;
        if (f === 30) { Sfx.play('spawn', 1, 0.7); BX.summon(b, 3, 0.25); for (let i = 0; i < 20; i++) FX.add('world', new Mote(b.x + rand(-300, 300), sy(rand(0, DEPTH), 0), 0, rand(-2, -0.5), { col: '120,255,200', life: 40, r: 10 })); }
      },
    },
    reap: {
      anim: 'reap', len: 80, counter: 26, armor: [0, 999], cd: 220, when: (b, p, adx, ady) => adx < 340 && ady < 100,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) { BX.lane(b.x - 330, b.x + 330, b.y, 96, 28, '120,255,200'); FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, 'JUMP!', { col: ['#fff', '#8affd8'], size: 26 })); Sfx.play('roar', 0.8, 1.1); }
        if (f === 34) { Sfx.play('swingBig', 1.3, 0.6); Game.addShake(10); FX.add('ground', new Ring(b.x, sy(b.y, 0), 30, 330, 22, { col: '120,255,200', w: 14 })); BX.hitAt(b, b.x, b.y, 340, 100, CH.heavy, 50); }
      },
    },
    headfire: {
      anim: 'headfire', len: 60, counter: 20, armor: [0, 999], cd: 200, when: (b, p, adx) => adx > 150,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 24) {
          const p = Game.player;
          Sfx.play('throw', 1, 0.7);
          BX.shot(b, b.x, b.y, 270, (p.x - b.x) / 50, (p.y - b.y) / 50, 4, { style: 'skullfire', r: 18, col: '120,255,200', grav: 0.3, bounce: 0.7, maxBounce: 2, home: 0.04, life: 260, hd: CH.mid, onEnd: s => BX.blast(b, s.x, s.y, 110, 40, CH.mid, '120,255,200', { shake: 8, sfx: 'explode', glow: true }) });
        }
      },
    },
  },
};
