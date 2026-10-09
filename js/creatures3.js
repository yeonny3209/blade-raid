'use strict';
// ============================================================
//  보스 몸체 (3) : 식인초 / 시계 거신 / 사이버 군주 / 뇌신 / 별을 삼키는 자 / 혼돈의 집합체
// ============================================================

// ============================================================
//  14. 태고의 식인초 (뿌리박혀 움직이지 않는다)
// ============================================================
CREATURES.flytrap = {
  w: 70, h: 300, d: 34, shadow: 1.8, stationary: true, keep: 300, rest: 40, roarPitch: 1.4,
  pal: { stem: ['#10300e', '#3a8a2a', '#8ad048'], jaw: ['#2a5a1a', '#5aa030', '#a8e060'], inner: ['#8a1a3a', '#e04a6a', '#ffb0c0'] },
  draw(ctx, b, P, k) {
    const t = k.t, S = P.stem, J = P.jaw;
    let hx = 60 + Math.sin(t * 0.04) * 14, hy = -250 + Math.cos(t * 0.05) * 10, open = 0.3 + Math.sin(t * 0.08) * 0.1;
    if (k.act === 'bite') { const f = k.af; if (f < 34) { hx = 0; hy = -280; open = 0.8; } else if (f < 46) { const e = DR.ease(f, 34, 40); hx = lerp(0, 440, e); hy = lerp(-280, -90, e); open = 1 - e; } else { const e = DR.ease(f, 46, 64); hx = lerp(440, 60, e); hy = lerp(-90, -250, e); open = 0.1; } }
    if (k.act === 'seeds' || k.act === 'pollen' || k.a === 'roar') open = 0.9;
    if (k.st === 'break') { hy = -110; hx = 90; open = 0; }
    // 뿌리
    ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 2.6; ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(Math.sin(a) * 60, 6, Math.sin(a) * 130, 4 + Math.cos(a) * 8); ctx.stroke(); }
    // 큰 잎
    for (const [a, s] of [[-2.4, 1], [-0.7, 1.1], [-2.0, 0.8]]) { ctx.save(); ctx.translate(0, -40); ctx.rotate(a + Math.sin(t * 0.05 + a) * 0.05); DR.poly(ctx, [0, 0, 70 * s, -26 * s, 150 * s, 0, 70 * s, 22 * s], S[1], 2); ctx.strokeStyle = S[0]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(140 * s, 0); ctx.stroke(); ctx.restore(); }
    // 줄기
    ctx.lineCap = 'round';
    for (const [w, c] of [[44, DR.ol], [38, S[1]], [12, S[2]]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(-60, -120, 80, -170, hx - 30, hy + 30); ctx.stroke(); }
    // 머리 (두 턱)
    ctx.save(); ctx.translate(hx, hy);
    const jaw = (s) => {
      ctx.save(); ctx.rotate(-s * open * 0.7);
      DR.poly(ctx, [-30, 0, 20, -s * 60, 90, -s * 40, 110, 0], J[1], 2);
      ctx.fillStyle = P.inner[1]; ctx.beginPath(); polyPath(ctx, [-20, 0, 20, -s * 46, 84, -s * 30, 100, 0]); ctx.fill();
      ctx.fillStyle = '#fff8e0'; for (let i = 0; i < 6; i++) { ctx.beginPath(); polyPath(ctx, [i * 18, 0, i * 18 + 6, -s * 14 + s * 2, i * 18 + 12, 0]); ctx.fill(); }
      ctx.restore();
    };
    jaw(1); jaw(-1);
    DR.glow(ctx, 40, 0, 50, b.enraged ? '255,60,80' : '255,140,180', 0.3 + open * 0.3);
    ctx.restore();
  },
  acts: {
    encircle: {
      anim: 'encircle', len: 110, counter: 0, armor: [0, 999], cd: 260,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player, r = Game.room;
        if (f === 8) {
          b.cx = p.x; b.cy = p.y; const gap = Math.floor(rand(0, 10));
          FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '틈으로 빠져나가라!', { col: ['#fff', '#a8e060'], size: 22, life: 70 }));
          for (let i = 0; i < 10; i++) {
            if (i === gap) continue;
            const a = i / 10 * TAU, x = clamp(b.cx + Math.cos(a) * 170, r.minX + 20, r.maxX - 20), y = clamp(b.cy + Math.sin(a) * 75, 0, DEPTH);
            BX.tele(x, y, 40, 16, 30, '140,230,80', tg => { FX.add('world', new BTentacle(tg.x, tg.y, 200, ['#3a8a2a', '#a8e060'])); BX.hitAt(b, tg.x, tg.y, 44, 18, CH.mid, 200); });
          }
          Sfx.play('roar', 0.5, 1.6);
        }
        if (f === 40) BX.tele(b.cx, b.cy, 130, 52, 30, '140,230,80');
        if (f === 70) { for (let i = 0; i < 5; i++) FX.add('world', new BTentacle(b.cx + rand(-60, 60), clamp(b.cy + rand(-25, 25), 0, DEPTH), 260, ['#3a8a2a', '#a8e060'])); BX.hitAt(b, b.cx, b.cy, 135, 55, CH.launch, 200); Sfx.play('quake', 0.6, 1.4); Game.addShake(8); }
      },
    },
    seeds: {
      anim: 'seeds', len: 60, counter: 0, armor: [0, 999], cd: 230,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 24) {
          const p = Game.player;
          for (let i = 0; i < 4; i++) {
            const tx = clamp(p.x + rand(-260, 260), Game.room.minX + 40, Game.room.maxX - 40), ty = clamp(p.y + rand(-70, 70), 10, DEPTH - 10), T = 36;
            const v = BX.arc(b.x + b.facing * 60, b.y, 250, tx, ty, 0, T, 0.45);
            BX.shot(b, b.x + b.facing * 60, b.y, 250, v[0], v[1], v[2], {
              style: 'seed', r: 14, grav: 0.45, floor: true, harmless: true, life: 120, hd: CH.shot,
              onLand: s => FX.add('ground', new Telegraph(s.x, s.y, 46, 18, 40, { col: '140,230,80' })),
              tick: s => { if (s.landed && s.t - s.landT === 40) s.dead = true; },
              onEnd: s => {
                FX.add('world', new Flash(s.x, sy(s.y, 10), 10, 90, 12, '160,240,90', 0.8));
                for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; BX.shot(b, s.x, s.y, 30, Math.cos(a) * 4.5, Math.sin(a) * 2.2, 0, { style: 'seed', r: 9, floor: true, life: 70, hd: CH.light }); }
                Sfx.play('pillar', 0.4, 1.6);
              },
            });
          }
          Sfx.play('throw', 1, 0.8);
        }
      },
    },
    pollen: {
      anim: 'pollen', len: 50, counter: 0, armor: [0, 999], cd: 420, cd0: 220,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) {
          const p = Game.player;
          for (let i = 0; i < 3; i++) BX.zone(b, clamp(p.x + (i - 1) * 200, Game.room.minX + 40, Game.room.maxX - 40), clamp(p.y + rand(-50, 50), 0, DEPTH), { kind: 'cloud', rx: 100, ry: 40, life: 320, every: 40, slow: true, col: '230,230,110', hd: CH.tick, hmax: 160 });
          Sfx.play('magic', 0.6, 1.2);
          FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '꽃가루 : 둔화', { col: ['#fff', '#e8e070'], size: 20 }));
        }
      },
    },
    bite: {
      anim: 'bite', len: 70, counter: 30, armor: [0, 999], cd: 180, when: (b, p, adx, ady) => adx < 480 && ady < 60,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) { FX.add('ground', new Telegraph(b.x, b.y, 0, 34, 28, { shape: 'rect', w: 480, dir: b.facing, col: b.elem })); b.glint(); }
        if (f === 34) { b.swing = newSwing(); Sfx.play('swingBig', 1.2, 0.8); }
        if (f >= 34 && f <= 42) b.hitPlayer(CH.heavy, { x0: 0, x1: 480, d: 38, z0: 0, z1: 200 });
        if (f === 40) { Sfx.play('thud', 1, 1.4); Game.addShake(8); }
      },
    },
  },
};

// ============================================================
//  15. 시계 거신 (멈춰버린 시계탑)
// ============================================================
CREATURES.clock = {
  w: 70, h: 330, d: 34, shadow: 1.6, speed: 1.2, keep: 260, rest: 45, roarPitch: 0.7,
  pal: { brass: ['#6a4a1c', '#c9a050', '#f0d888'], face: ['#d8ccb0', '#f4ecd8', '#ffffff'], dark: ['#2a1a08', '#4a3010', '#6a4a20'] },
  draw(ctx, b, P, k) {
    const t = k.t, Br = P.brass;
    const walk = k.a === 'walk' ? Math.sin(k.at * 0.1) : 0;
    let pend = Math.sin(t * 0.05) * 0.35, handA = t * 0.02;
    if (k.act === 'pendulum') { const f = k.af; pend = f < 30 ? -0.9 * f / 30 : f < 60 ? -0.9 + 1.8 * DR.ease(f, 34, 44) - (f > 46 ? 1.8 * DR.ease(f, 46, 56) : 0) : 0; }
    if (k.act === 'hands') handA = k.af * 0.06;
    if (k.st === 'break') pend = 0.6;
    // 다리
    DR.cap(ctx, -30, -130, -36 - walk * 16, 0, 10, 8, Br[0], 2);
    DR.cap(ctx, 30, -130, 36 + walk * 16, 0, 10, 8, Br[1], 2);
    // 추
    ctx.save(); ctx.translate(0, -130); ctx.rotate(pend);
    DR.poly(ctx, [-3, 0, 3, 0, 3, 110, -3, 110], Br[0], 1.4);
    DR.poly(ctx, [-50, 100, 50, 100, 0, 140], '#c0c8d0', 2);
    DR.glow(ctx, 0, 115, 30, '255,230,150', 0.4);
    ctx.restore();
    // 어깨 톱니
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 110, -270); ctx.rotate(t * 0.04 * s);
      ctx.fillStyle = s > 0 ? Br[1] : Br[0]; ctx.strokeStyle = DR.ol; ctx.lineWidth = 3;
      ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, r = i % 2 ? 46 : 38; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.fillStyle = P.dark[1]; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // 시계판 몸통
    DR.ell(ctx, 0, -220, 112, 112, Br[1], 0, 2.6);
    DR.ell(ctx, 0, -220, 94, 94, P.face[1], 0, 1.4);
    ctx.strokeStyle = P.dark[0]; ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 78, -220 + Math.sin(a) * 78); ctx.lineTo(Math.cos(a) * 90, -220 + Math.sin(a) * 90); ctx.stroke(); }
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -220); ctx.lineTo(Math.cos(handA) * 70, -220 + Math.sin(handA) * 70); ctx.stroke();
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -220); ctx.lineTo(Math.cos(handA * 12) * 84, -220 + Math.sin(handA * 12) * 84); ctx.stroke();
    DR.ell(ctx, 0, -220, 10, 10, Br[2], 0, 1.4);
    // 종 왕관
    DR.poly(ctx, [-30, -330, 30, -330, 40, -306, -40, -306], Br[2], 2);
    DR.ell(ctx, 0, -344, 22, 18, Br[1], 0, 2);
    DR.glow(ctx, 0, -220, 140, b.enraged ? '255,80,40' : '150,230,255', 0.2 + (k.act === 'slowfield' ? 0.4 : 0));
  },
  acts: {
    hands: {
      anim: 'hands', len: 160, counter: 0, armor: [0, 999], cd: 300, cd0: 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) { FX.add('ground', new Ring(b.x, sy(b.y, 0), 360, 360, 30, { col: '150,230,255', w: 6 })); FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, '바늘을 뛰어넘어라!', { col: ['#fff', '#8fe3ff'], size: 22, life: 60 })); Sfx.wlayer('clock', 2, true); b.hset = [new Set(), new Set()]; }
        if (f >= 36 && f < 156) {
          for (let h = 0; h < 2; h++) {
            const a = (f - 36) * 0.0525 + h * Math.PI, x0 = b.x + Math.cos(a) * 70, y0 = b.y + Math.sin(a) * 32, x1 = b.x + Math.cos(a) * 380, y1 = b.y + Math.sin(a) * 170;
            FX.add('world', new BBeam(x0, y0, x1, y1, 2, h ? '255,220,140' : '150,230,255', 18));
            if (f % 30 === 0) b.hset[h].clear();
            BX.hitSeg(b, x0, y0, x1, y1, 26, CH.mid, 50, b.hset[h]);
          }
          if (f % 10 === 0) Sfx.wlayer('clock', 0, false);
        }
      },
    },
    gears: {
      anim: 'gears', len: 70, counter: 0, armor: [0, 999], cd: 220,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 8) {
          const p = Game.player; b.gy = [p.y, clamp(p.y + 80, 0, DEPTH), clamp(p.y - 80, 0, DEPTH)].slice(0, 3);
          const r = Game.room; for (const y of b.gy) BX.lane(Math.min(b.x, r.minX), Math.max(b.x, r.maxX), y, 22, 30, '255,200,110');
        }
        if (f === 38) { for (const [i, y] of b.gy.entries()) BX.shot(b, b.x + b.facing * 40, y, 30, b.facing * (6 + i * 1.2), 0, 0, { style: 'gear', r: 34, roll: true, pierce: true, life: 260, hd: CH.mid }); Sfx.play('thud', 0.8, 1.4); }
      },
    },
    slowfield: {
      anim: 'slowfield', len: 50, counter: 0, armor: [0, 999], cd: 420, cd0: 240,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) {
          const p = Game.player;
          BX.zone(b, p.x, p.y, { kind: 'vortex', rx: 190, ry: 70, life: 300, every: 45, slow: true, col: '150,230,255', hd: CH.tick, hmax: 160 });
          Sfx.wlayer('clock', 3, true); FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '시간 둔화', { col: ['#fff', '#8fe3ff'], size: 22 }));
        }
      },
    },
    pendulum: {
      anim: 'pendulum', len: 70, counter: 30, armor: [0, 999], cd: 200, when: (b, p, adx, ady) => adx < 300 && ady < 90,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) { BX.lane(b.x - 280, b.x + 280, b.y, 80, 30, b.elem); Sfx.play('charge', 0.6, 0.6); }
        if (f === 38 || f === 50) { Sfx.play('swingBig', 1.3, 0.5); Game.addShake(8); BX.hitAt(b, b.x + (f === 38 ? b.facing : -b.facing) * 150, b.y, 190, 85, CH.heavy, 200); }
      },
    },
  },
};

// ============================================================
//  16. 사이버 군주 ZX-0 (네온 도시)
// ============================================================
CREATURES.cyber = {
  w: 40, h: 290, d: 26, shadow: 1.3, speed: 2.6, keep: 320, rest: 40, roarPitch: 2,
  pal: { body: ['#0a0818', '#302060', '#6a50c0'], plate: ['#1a1a2a', '#4a4a6a', '#9a9ac0'] },
  onInterrupt(b) { b.alpha = 1; },
  draw(ctx, b, P, k) {
    const t = k.t, Bd = P.body, Pl = P.plate, F = 80 + Math.sin(t * 0.07) * 8, neon = b.enraged ? '255,60,80' : b.elem;
    let arm = 0;
    if (k.act === 'grid' || k.act === 'emp' || k.a === 'roar') arm = 1;
    const gl = k.act === 'glitch' && k.af % 6 < 3;
    ctx.save(); ctx.translate(gl ? rand(-8, 8) : 0, -F);
    // 추진기
    for (const s of [-1, 1]) { DR.poly(ctx, [s * 20, -20, s * 46, -10, s * 40, 20, s * 16, 10], Pl[1], 1.6); DR.glow(ctx, s * 30, 30, 34 + Math.sin(t * 0.6) * 6, neon, 0.8, 0.6, 1.4); }
    // 몸통
    DR.poly(ctx, [-50, -40, 50, -40, 64, -150, 30, -190, -30, -190, -64, -150], Bd[1], 2.4);
    ctx.fillStyle = Bd[0]; ctx.beginPath(); polyPath(ctx, [-50, -40, -10, -40, -24, -190, -64, -150]); ctx.fill();
    ctx.strokeStyle = `rgb(${neon})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-40, -60); ctx.lineTo(0, -120); ctx.lineTo(40, -60); ctx.moveTo(-30, -160); ctx.lineTo(30, -160); ctx.stroke();
    DR.glow(ctx, 0, -110, 60, neon, 0.4);
    // 팔 캐논
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 64, -150); ctx.rotate(s * (0.4 - arm * 1.1));
      DR.poly(ctx, [-12, 0, 12, 0, 14, 90, -14, 90], Pl[1], 1.8);
      ctx.fillStyle = `rgb(${neon})`; ctx.fillRect(-4, 70, 8, 16); DR.glow(ctx, 0, 92, 20, neon, 0.8);
      ctx.restore();
    }
    // 머리 (바이저)
    DR.poly(ctx, [-26, -190, 26, -190, 30, -236, -24, -244], Pl[1], 2);
    ctx.fillStyle = `rgb(${neon})`; ctx.fillRect(-14, -224, 40, 7); DR.glow(ctx, 6, -220, 40, neon, 0.9);
    DR.poly(ctx, [-20, -244, -36, -280, -8, -248], Pl[2], 1.2);
    // 공전 드론 두 기
    for (let i = 0; i < 2; i++) { const a = t * 0.05 + i * Math.PI; DR.ell(ctx, Math.cos(a) * 110, -140 + Math.sin(a) * 26, 18, 9, Pl[0], 0, 1.4); DR.glow(ctx, Math.cos(a) * 110, -140 + Math.sin(a) * 26, 20, neon, 0.7); }
    ctx.restore();
  },
  acts: {
    grid: {
      anim: 'grid', len: 120, counter: 0, armor: [0, 999], cd: 260,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const r = Game.room, p = Game.player, col = b.elem;
        if (f === 6) {      // 1단계 : 깊이 레인 (한 줄만 안전)
          const lanes = [0, 1, 2, 3].map(i => 28 + i * (DEPTH - 56) / 3), safe = Math.floor(rand(0, 4));
          b.gl = lanes.filter((_, i) => i !== safe);
          for (const y of b.gl) BX.lane(r.minX, r.maxX, y, 30, 40, col);
          Sfx.play('warn', 0.8);
        }
        if (f === 46) for (const y of b.gl) { FX.add('world', new FlashLine(r.minX, r.maxX, sy(y, 50), 20, col)); const pl = BX.pl(); if (pl && Math.abs(pl.y - y) < 32 && pl.z < 120) applyHit(b, pl, CH.mid, { dir: b.facing, noStopAtt: true }); }
        if (f === 56) {     // 2단계 : 세로 기둥 (사이로 피한다)
          b.gc = []; for (let i = -2; i <= 2; i++) b.gc.push(clamp(p.x + i * 170 + rand(-20, 20), r.minX + 40, r.maxX - 40));
          for (const x of b.gc) FX.add('ground', new Telegraph(x - 45, DEPTH / 2, 0, DEPTH / 2 + 10, 36, { shape: 'rect', w: 90, dir: 1, col: '60,240,255' }));
          Sfx.play('warn', 0.8, 1.3);
        }
        if (f === 92) for (const x of b.gc) { FX.add('world', new Pillar(x, DEPTH / 2, 50, 520, 20, '60,240,255', '220,255,255')); const pl = BX.pl(); if (pl && Math.abs(pl.x - x) < 48 && pl.z < 300) applyHit(b, pl, CH.mid, { dir: sign(pl.x - x) || 1, noStopAtt: true }); }
        if (f === 46 || f === 92) { Sfx.play('flash', 0.6); Game.addShake(5); }
      },
    },
    drones: {
      anim: 'drones', len: 50, counter: 0, armor: [0, 999], cd: 420, cd0: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) {
          Sfx.play('spawn', 0.8, 1.6);
          for (let i = 0; i < 3; i++) BX.shot(b, b.x, b.y + (i - 1) * 40, 180, rand(-2, 2), rand(-1, 1), 0, {
            style: 'drone', r: 16, col: b.elem, home: 0.05, homeT: 999, life: 360, floor: true, harmless: true, hd: CH.shot,
            tick: s => {
              const p = Game.player; s.vx = clamp(s.vx + (p.x + (i - 1) * 140 - s.x) * 0.004, -3, 3); s.vy = clamp(s.vy + (p.y - s.y) * 0.004, -1.5, 1.5); s.z = lerp(s.z, 180, 0.05); s.vz = 0;
              if (s.t % 60 === 30) { const d = Math.hypot(p.x - s.x, p.y - s.y) || 1; BX.shot(b, s.x, s.y, s.z, (p.x - s.x) / d * 6, (p.y - s.y) / d * 3, -s.z / (d / 6), { style: 'orb', r: 9, col: b.elem, hd: CH.light, life: 90 }); Sfx.play('magic', 0.3, 2); }
            },
          });
        }
      },
    },
    glitch: {
      anim: 'glitch', len: 90, counter: 0, armor: [0, 999], cd: 240,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player, r = Game.room;
        if (f === 10 || f === 30 || f === 50) {
          BX.zone(b, b.x, b.y, { rx: 70, ry: 26, life: 200, every: 20, col: b.elem, hd: CH.tick, delay: 10 });
          FX.add('world', new Flash(b.x, sy(b.y, 140), 20, 160, 10, b.elem, 0.8));
          const a = rand(0, TAU); b.x = clamp(p.x + Math.cos(a) * 220, r.minX + 40, r.maxX - 40); b.y = clamp(p.y + Math.sin(a) * 60, 0, DEPTH); b.facing = sign(p.x - b.x) || 1;
          Sfx.play('magic', 0.6, 2.2);
        }
        if (f === 64) { b.swing = newSwing(); b.glint(); Sfx.play('swingBig', 1, 1.6); }
        if (f >= 64 && f <= 72) { b.vx = b.facing * 12; b.hitPlayer(CH.heavy, { x0: -20, x1: 140, d: 40, z0: 0, z1: 260 }); }
      },
    },
    emp: {
      anim: 'emp', len: 80, counter: 0, armor: [0, 999], cd: 300, cd0: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 6) { Sfx.play('charge', 1, 1.6); FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, 'JUMP! (MP 흡수)', { col: ['#fff', '#6ff0ff'], size: 22 })); }
        if (f === 40) {
          Game.flashScreen(0.3, '60,240,255'); Sfx.wlayer('elec', 3, true);
          FX.add('ground', new ShockWave(b.x, b.y, { col: '60,240,255', speed: 10, maxR: 800, w: 16, hitFn: w => {
            const pl = BX.pl(); if (w.hit || !pl) return;
            const d = Math.hypot(pl.x - w.x, (pl.y - w.y) * 3.2);
            if (Math.abs(d - w.r) < 26 && pl.z < 44) { w.hit = true; applyHit(b, pl, CH.shot, { dir: sign(pl.x - w.x) || 1, noStopAtt: true }); pl.mp = Math.max(0, pl.mp - pl.mpMax * 0.3); FX.add('top', new Label(pl.x, sy(pl.y, pl.z) - 150, 'MP -30%', { col: ['#fff', '#5aa0ff'], size: 20 })); }
          } }));
        }
      },
    },
  },
};

// ============================================================
//  17. 뇌신 라이진 (뇌운의 고원) : 북을 두른 도깨비
// ============================================================
CREATURES.oni = {
  w: 46, h: 300, d: 30, shadow: 1.4, speed: 2.2, keep: 300, rest: 45, roarPitch: 0.9,
  pal: { skin: ['#20284a', '#5a6ab0', '#c0d0ff'], drum: ['#5a1a10', '#a8402a', '#e8a060'], hair: ['#c8a020', '#ffe060', '#fff8c0'] },
  draw(ctx, b, P, k) {
    const t = k.t, S = P.skin, Dm = P.drum, F = 60 + Math.sin(t * 0.06) * 10;
    let beat = 0;
    if (k.act === 'drums' || k.act === 'rows') beat = (k.af % 14) < 5 ? 1 : 0;
    if (k.a === 'roar' || k.act === 'roar') beat = 1;
    ctx.save(); ctx.translate(0, -F);
    // 북 고리
    for (let i = 0; i < 8; i++) {
      const a = Math.PI + 0.2 + i / 7 * (Math.PI - 0.4), x = Math.cos(a) * 140 - 20, y = -150 + Math.sin(a) * 110;
      DR.ell(ctx, x, y, 26, 26, Dm[1], 0, 2); ctx.fillStyle = Dm[2]; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = Dm[0]; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
      if (beat && i % 2 === (Math.floor(k.af / 14) % 2)) DR.glow(ctx, x, y, 40, '255,240,110', 0.8);
    }
    ctx.strokeStyle = Dm[0]; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-20, -150, 140, Math.PI + 0.1, TAU - 0.1); ctx.stroke();
    // 구름 하체
    for (let i = 0; i < 5; i++) DR.ell(ctx, -40 + i * 20, 10 + Math.sin(t * 0.08 + i) * 4, 34, 18, '#d8dcf0', 0, 0);
    DR.glow(ctx, 0, 10, 70, '200,210,255', 0.3);
    // 몸통
    DR.poly(ctx, [-40, 0, 40, 0, 60, -150, 30, -180, -30, -180, -60, -150], S[1], 2.4);
    ctx.fillStyle = S[2]; ctx.beginPath(); polyPath(ctx, [0, -160, 34, -150, 26, -60, 4, -40]); ctx.fill();
    ctx.fillStyle = '#e8d8a0'; ctx.fillRect(-42, -20, 84, 16);
    // 팔 + 북채
    const arm = (s, up) => {
      const hx = s * 70 + (up ? s * 10 : 0), hy = up ? -250 : -120;
      DR.cap(ctx, s * 50, -160, hx, hy, 15, 12, S[1], 2);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(up ? -s * 0.4 : s * 0.8);
      DR.poly(ctx, [-4, 0, 4, 0, 4, -60, -4, -60], '#3a2a14', 1.2); DR.ell(ctx, 0, -66, 12, 10, '#e8e0c0', 0, 1.2);
      ctx.restore();
    };
    arm(-1, beat); arm(1, !beat);
    // 머리 : 뿔 + 갈기
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i - 3.5) * 0.3; DR.poly(ctx, [0, -210, Math.cos(a) * 70, -210 + Math.sin(a) * 70 + Math.sin(t * 0.1 + i) * 6, Math.cos(a + 0.15) * 30, -210 + Math.sin(a + 0.15) * 30], P.hair[1], 1.2); }
    DR.ell(ctx, 4, -206, 30, 30, S[1], 0, 2);
    DR.poly(ctx, [-14, -228, -26, -262, -2, -232], P.hair[2], 1.4); DR.poly(ctx, [18, -230, 30, -264, 26, -228], P.hair[2], 1.4);
    ctx.fillStyle = '#fff8a0'; ctx.fillRect(4, -214, 22, 6); DR.glow(ctx, 15, -211, 30, b.enraged ? '255,80,40' : '255,240,110', 0.9);
    ctx.fillStyle = '#fff'; ctx.beginPath(); polyPath(ctx, [6, -190, 12, -182, 18, -190]); ctx.fill();
    ctx.restore();
  },
  acts: {
    drums: {
      anim: 'drums', len: 110, counter: 0, armor: [0, 999], cd: 240,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        for (const [i, R] of [[0, 140], [1, 270], [2, 400]]) {
          if (f === 8 + i * 22) {
            Sfx.play('thud', 1, 1.2); Game.addShake(4);
            const off = i * 0.2;
            for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + off, x = clamp(b.x + Math.cos(a) * R, Game.room.minX + 20, Game.room.maxX - 20), y = clamp(b.y + Math.sin(a) * R * 0.4, 0, DEPTH);
              BX.tele(x, y, 40, 16, 34, '255,240,110', tg => { FX.add('world', new Bolt(tg.x + rand(-30, 30), sy(0, 600), tg.x, sy(tg.y, 0), { life: 9, amp: 22, w: 4 })); BX.hitAt(b, tg.x, tg.y, 44, 18, CH.shot, 200); }); }
          }
          if (f === 42 + i * 22) { Sfx.wlayer('elec', 2, false); Game.flashScreen(0.06, '255,250,200'); }
        }
      },
    },
    rows: {
      anim: 'rows', len: 120, counter: 0, armor: [0, 999], cd: 280, cd0: 160,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player, r = Game.room;
        if (f === 6) b.rd = sign(p.x - b.x) || b.facing;
        for (let row = 0; row < 5; row++) if (f === 10 + row * 14) {
          const x = clamp(b.x + b.rd * (120 + row * 130), r.minX + 20, r.maxX - 20), gap = Math.floor(rand(0, 5));
          for (let j = 0; j < 5; j++) { if (j === gap) continue; const y = 22 + j * (DEPTH - 44) / 4;
            BX.tele(x, y, 50, 22, 26, '255,240,110', tg => { FX.add('world', new Bolt(tg.x, sy(0, 640), tg.x, sy(tg.y, 0), { life: 10, amp: 26, w: 5 })); FX.add('world', new Flash(tg.x, sy(tg.y, 10), 10, 90, 12, '255,245,150', 0.9)); BX.hitAt(b, tg.x, tg.y, 54, 24, CH.shot, 260); }); }
          Sfx.play('thud', 0.8, 1.4);
        }
      },
    },
    balls: {
      anim: 'balls', len: 50, counter: 0, armor: [0, 999], cd: 300,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 24) {
          Sfx.wlayer('elec', 2, true);
          for (let i = 0; i < 3; i++) BX.shot(b, b.x + (i - 1) * 60, b.y, 140, (i - 1) * 1.5, 0, 0, {
            style: 'orb', r: 22, col: '255,240,110', home: 0.035, homeT: 999, life: 330, floor: true, harmless: true, hd: CH.shot,
            tick: s => { s.z = lerp(s.z, 70, 0.04); s.vz = 0; const sp = Math.hypot(s.vx, s.vy); if (sp < 2.2) { s.vx += (Game.player.x - s.x) * 0.002; s.vy += (Game.player.y - s.y) * 0.002; }
              if (s.t % 40 === 20) { FX.add('world', new Bolt(s.x, sy(s.y, s.z), s.x + rand(-60, 60), sy(s.y, s.z) + rand(-60, 60), { life: 6, amp: 10, w: 2 })); }
              const pl = BX.pl(); if (pl && s.t > 30 && Math.hypot(pl.x - s.x, (pl.y - s.y) * 2) < 70 && Math.abs(pl.z + 60 - s.z) < 90) s.dead = true; },
            onEnd: s => { FX.add('world', new Flash(s.x, sy(s.y, s.z), 20, 140, 14, '255,240,110', 1)); Sfx.wlayer('elec', 1, false); BX.hitAt(b, s.x, s.y, 90, 40, CH.mid, 200); },
          });
        }
      },
    },
    cloud: BX.dash({ anim: 'cloud', cd: 300, speed: 15, hd: CH.mid, when: (b, p, adx) => adx > 260, trailEvery: 8,
      trail: b => BX.zone(b, b.x - b.facing * 30, b.y, { rx: 50, ry: 20, life: 150, every: 30, col: '255,240,110', hd: CH.tick }) }),
  },
};

// ============================================================
//  18. 별을 삼키는 자 (은하 정거장) : 거대한 우주의 머리
// ============================================================
CREATURES.cosmic = {
  w: 70, h: 320, d: 34, shadow: 1.5, speed: 1.3, keep: 340, rest: 45, roarPitch: 0.4,
  pal: { helm: ['#0a0620', '#2a1a68', '#6a50c0'], gold: ['#8a6a20', '#ffd860', '#fff4c0'], face: ['#140a30', '#3a2a7a', '#8a70e0'] },
  draw(ctx, b, P, k) {
    const t = k.t, Hm = P.helm, G = P.gold, F = 70 + Math.sin(t * 0.04) * 12;
    let mouth = 0.2, star = 0;
    if (k.act === 'supernova') { star = Math.min(1, k.af / 80); mouth = 0.6; }
    if (k.a === 'roar' || k.act === 'roar') mouth = 0.8;
    ctx.save(); ctx.translate(0, -F - 130);
    // 성운
    DR.glow(ctx, 0, 0, 220, '120,80,255', 0.25); DR.glow(ctx, 40, 40, 160, '255,90,170', 0.15);
    // 공전 행성 (뒤)
    const planets = b.planets ?? 3;
    const pl = (i, front) => { const a = t * 0.025 + i * TAU / 3, x = Math.cos(a) * 190, y = Math.sin(a) * 50 + 40; if ((Math.sin(a) > 0) !== front || i >= planets) return; const g = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, 26); g.addColorStop(0, ['#ffe0a0', '#a0e0ff', '#ffa0c0'][i]); g.addColorStop(1, '#2a1a40'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill(); };
    for (let i = 0; i < 3; i++) pl(i, false);
    // 투구 + 볏
    DR.poly(ctx, [-110, 40, -120, -70, -60, -140, 60, -140, 120, -70, 110, 40, 60, 110, -60, 110], Hm[1], 2.6);
    DR.poly(ctx, [-20, -140, 0, -230, 20, -140], G[1], 2);
    DR.poly(ctx, [-60, -140, -110, -200, -40, -150], G[0], 1.6); DR.poly(ctx, [60, -140, 110, -200, 40, -150], G[0], 1.6);
    // 얼굴 (별이 박힌 공간)
    DR.poly(ctx, [-70, -60, 70, -60, 80, 30, 40, 90, -40, 90, -80, 30], P.face[1], 2);
    ctx.fillStyle = '#fff'; for (let i = 0; i < 18; i++) ctx.fillRect(-60 + (i * 37) % 120, -50 + (i * 53) % 130, 2, 2);
    // 눈
    for (const s of [-1, 1]) { DR.ell(ctx, s * 36 + 10, -20, 18, 10, '#fff8d0', 0, 1.4); DR.glow(ctx, s * 36 + 10, -20, 34, b.enraged ? '255,80,60' : '255,220,120', 0.9); }
    // 입
    ctx.fillStyle = '#02010a'; ctx.beginPath(); ctx.ellipse(10, 50, 36, 8 + mouth * 22, 0, 0, TAU); ctx.fill();
    DR.glow(ctx, 10, 50, 30 + mouth * 20, '160,120,255', 0.5);
    // 테두리 금장식
    ctx.strokeStyle = G[1]; ctx.lineWidth = 4; ctx.beginPath(); polyPath(ctx, [-110, 40, -120, -70, -60, -140, 60, -140, 120, -70, 110, 40]); ctx.stroke();
    for (let i = 0; i < 3; i++) pl(i, true);
    if (star > 0) { DR.glow(ctx, 160, 60, 40 + star * 140, '255,240,200', 0.4 + star * 0.6); DR.glow(ctx, 160, 60, 20 + star * 40, '255,255,255', 1); }
    ctx.restore();
  },
  init(b) { b.planets = 3; },
  acts: {
    planets: {
      anim: 'planets', len: 90, counter: 0, armor: [0, 999], cd: 240,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20 || f === 40 || f === 60) {
          const p = Game.player, T = 34;
          const tx = clamp(p.x + rand(-60, 60), Game.room.minX + 40, Game.room.maxX - 40), ty = clamp(p.y + rand(-40, 40), 0, DEPTH);
          BX.tele(tx, ty, 100, 36, T, b.elem);
          const v = BX.arc(b.x, b.y, 330, tx, ty, 0, T, 0.5);
          BX.shot(b, b.x, b.y, 330, v[0], v[1], v[2], { style: 'planet', r: 30, grav: 0.5, hd: CH.mid, onEnd: s => { BX.blast(b, s.x, s.y, 100, 36, CH.mid, '255,220,140', { shake: 8, sfx: 'explode', glow: true }); BX.shot(b, s.x, s.y, 20, sign(s.vx || 1) * 5, 0, 0, { style: 'planet', r: 22, roll: true, pierce: true, life: 120, hd: CH.light }); } });
          b.planets = Math.max(0, (b.planets ?? 3) - 1); Sfx.play('throw', 1, 0.5);
        }
        if (f === 88) b.planets = 3;
      },
      cancel(b) { b.planets = 3; },
    },
    blackhole: {
      anim: 'blackhole', len: 50, counter: 0, armor: [0, 999], cd: 380, cd0: 200,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 20) {
          const p = Game.player, x = clamp(lerp(p.x, b.x, 0.4), Game.room.minX + 80, Game.room.maxX - 80);
          BX.zone(b, x, p.y, { kind: 'vortex', rx: 120, ry: 44, life: 280, every: 18, pull: 2.6, delay: 20, col: '160,120,255', hd: CH.light, hmax: 200 });
          Sfx.wlayer('void', 3, true); Game.addShake(6);
        }
      },
    },
    supernova: {
      anim: 'supernova', len: 130, counter: 0, armor: [0, 999], cd: 460, cd0: 300,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        if (f === 4) {
          Sfx.play('charge', 1.2, 0.4);
          FX.add('top', new Label(Game.player.x, sy(Game.player.y, 0) - 170, '보스 발밑으로 피하라!', { col: ['#fff', '#ffe08a'], size: 24, life: 90 }));
          FX.add('ground', new Telegraph(b.x, b.y, 170, 60, 96, { col: '120,255,140' }));
          const r = Game.room; BX.lane(r.minX, r.maxX, DEPTH / 2, DEPTH / 2 + 20, 96, '255,200,120');
        }
        if (f < 96 && f % 3 === 0) FX.add('world', new Mote(b.x + b.facing * 160 + rand(-200, 200), sy(b.y, 260) + rand(-120, 120), 0, 0, { col: '255,240,200', life: 20, r: 8, tx: b.x + b.facing * 160, ty: sy(b.y, 260), grav: 0 }));
        if (f === 100) {
          Game.flashScreen(1, '255,250,230'); Sfx.play('explode', 1.4, 0.6); Game.addShake(24); Game.zoomPunch(1.08);
          FX.add('world', new Flash(b.x, sy(b.y, 150), 100, 1200, 34, '255,230,180', 1));
          const pl = BX.pl(); if (pl && Math.hypot(pl.x - b.x, (pl.y - b.y) * 2.8) > 175) applyHit(b, pl, CH.heavy, { dir: sign(pl.x - b.x) || 1, noStopAtt: true });
        }
      },
    },
    constellation: {
      anim: 'constellation', len: 110, counter: 0, armor: [0, 999], cd: 280, cd0: 120,
      update(b, f) {
        b.vx = 0; b.vy = 0;
        const p = Game.player, r = Game.room;
        if (f === 8) {
          b.cst = []; for (let i = 0; i < 6; i++) b.cst.push([clamp(p.x + rand(-380, 380), r.minX + 30, r.maxX - 30), clamp(rand(10, DEPTH - 10), 0, DEPTH)]);
          b.cst.sort((a, c) => a[0] - c[0]);
          for (let i = 0; i < b.cst.length - 1; i++) FX.add('ground', new BLine(b.cst[i][0], b.cst[i][1], b.cst[i + 1][0], b.cst[i + 1][1], 44, '255,236,150', 34));
          for (const [x, y] of b.cst) FX.add('world', new Glint(x, sy(y, 10), 30));
          Sfx.wlayer('star', 2, true);
        }
        if (f === 52 && b.cst) {
          const set = new Set();
          for (let i = 0; i < b.cst.length - 1; i++) { const [x0, y0] = b.cst[i], [x1, y1] = b.cst[i + 1]; FX.add('world', new BBeam(x0, y0, x1, y1, 24, '255,236,150', 30)); BX.hitSeg(b, x0, y0, x1, y1, 30, CH.mid, 140, set); }
          Sfx.play('flash', 0.8); Game.addShake(6); b.cst = null;
        }
      },
    },
  },
};

// ============================================================
//  19. 태초의 혼돈 (혼돈의 근원) : 모든 보스가 뒤섞인 덩어리
// ============================================================
CREATURES.chaos = {
  w: 70, h: 320, d: 34, shadow: 1.7, speed: 1.6, keep: 300, rest: 35, roarPitch: 0.6,
  pal: { a: ['#200418', '#7a1060', '#ff40b0'], b: ['#0a1a48', '#2a4aa0', '#80b0ff'], c: ['#1a3010', '#4a8a2a', '#b0f070'] },
  draw(ctx, b, P, k) {
    const t = k.t, h = (t * 1.5) % 360, cc = hslRgb(h, 0.8, 0.55).join(','), F = 50 + Math.sin(t * 0.05) * 10;
    ctx.save(); ctx.translate(0, -F - 140);
    // 섞인 팔다리 : 용의 날개 / 크라켄 촉수 / 수정 조각 / 골렘 주먹
    DR.poly(ctx, [-40, -60, -260, -220 - Math.sin(t * 0.08) * 40, -200, -60, -120, -20], P.b[0], 2);
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = P.c[1]; ctx.lineWidth = 16 - i * 2; ctx.beginPath(); ctx.moveTo(-40 + i * 30, 80); ctx.bezierCurveTo(-60 + i * 30 + Math.sin(t * 0.07 + i) * 30, 140, -20 + i * 30, 170, -40 + i * 30 + Math.sin(t * 0.09 + i) * 30, F + 130); ctx.stroke(); }
    for (let i = 0; i < 4; i++) { const a = -1.2 + i * 0.5; DR.poly(ctx, [Math.cos(a) * 110, Math.sin(a) * 110, Math.cos(a) * 190, Math.sin(a) * 190 - 20, Math.cos(a + 0.2) * 120, Math.sin(a + 0.2) * 120], P.b[2], 1.4); }
    DR.ell(ctx, 150, 40, 46, 40, '#5c574d', 0.3, 2);
    // 몸 (불규칙한 덩어리)
    ctx.fillStyle = P.a[1]; ctx.strokeStyle = DR.ol; ctx.lineWidth = 5; ctx.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = 120 + Math.sin(t * 0.07 + i * 1.7) * 14 + (i % 3) * 8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9); }
    ctx.closePath(); ctx.stroke(); ctx.fill();
    DR.glow(ctx, 0, 0, 160, cc, 0.35);
    // 여러 개의 눈
    for (let i = 0; i < 6; i++) {
      const ex = Math.cos(i * 1.9) * 66, ey = Math.sin(i * 2.7) * 56, bl = Math.sin(t * 0.05 + i * 2) > 0.92 ? 0.15 : 1;
      DR.ell(ctx, ex, ey, 16, 12 * bl, '#f8f0e0', 0, 1.4);
      ctx.fillStyle = `rgb(${cc})`; ctx.beginPath(); ctx.arc(ex + 3, ey, 6 * bl, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
  acts: {},
};
// 혼돈은 다른 보스들의 대표 패턴을 빌려 쓰고, 고유 패턴 '세계 분할'을 더한다
Object.assign(CREATURES.chaos.acts, {
  fault: CREATURES.golem.acts.fault,
  breath: CREATURES.dragon.acts.breath,
  prism: CREATURES.crystal.acts.prism,
  cross: CREATURES.seraph.acts.cross,
  tentacles: CREATURES.maw.acts.tentacles,
  rows: CREATURES.oni.acts.rows,
  split: {
    anim: 'split', len: 130, counter: 0, armor: [0, 999], cd: 300, cd0: 160,
    update(b, f) {
      b.vx = 0; b.vy = 0;
      const p = Game.player, r = Game.room, cam = Game.cam.x, mid = cam + W / 2;
      if (f === 6) {
        b.side = p.x < mid ? -1 : 1;
        FX.add('top', new Label(p.x, sy(p.y, 0) - 170, '반대편으로!', { col: ['#fff', '#ff80d0'], size: 26, life: 60 }));
        const x0 = b.side < 0 ? Math.max(r.minX, cam - 100) : mid; FX.add('ground', new Telegraph(x0, DEPTH / 2, 0, DEPTH / 2 + 20, 46, { shape: 'rect', w: W / 2 + 100, dir: 1, col: '255,80,200' }));
        Sfx.play('warn', 1);
      }
      const boom = (side) => {
        const x0 = side < 0 ? cam - 100 : mid, x1 = side < 0 ? mid : cam + W + 100;
        for (let i = 0; i < 8; i++) FX.add('world', new Pillar(lerp(x0, x1, rand(0, 1)), rand(0, DEPTH), 50, 380, 26, hslRgb(rand(0, 360), 0.9, 0.6).join(','), '255,255,255'));
        const pl = BX.pl(); if (pl && pl.x > x0 && pl.x < x1 && pl.z < 300) applyHit(b, pl, CH.heavy, { dir: -side, noStopAtt: true });
        Sfx.play('explode', 1); Game.addShake(14); Game.flashScreen(0.3, '255,120,220');
      };
      if (f === 52) {
        boom(b.side);
        const x0 = b.side > 0 ? Math.max(r.minX, cam - 100) : mid; FX.add('ground', new Telegraph(x0, DEPTH / 2, 0, DEPTH / 2 + 20, 46, { shape: 'rect', w: W / 2 + 100, dir: 1, col: '255,80,200' }));
      }
      if (f === 98) boom(-b.side);
    },
  },
});
