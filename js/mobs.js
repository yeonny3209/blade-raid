'use strict';
// ============================================================
//  일반 몬스터 20종 : 종류마다 생김새 · 움직임 · 공격이 다르다
//   (고블린 / 투척병 / 오크 / 술사는 기존 골격 몬스터 그대로)
// ============================================================
const MOBS = {};
const MOB_RIG = { scale: 1, draw() { }, pal: {} };

const MH = {
  bite: { dmg: 1, kx: 4, stun: 20, stop: 6, shake: 3, fx: 'blunt', sfx: 'hurt' },
  heavy: { dmg: 1.2, kx: 7, kz: 6, stun: 26, stop: 9, shake: 6, fx: 'heavy', sfx: 'heavy', down: true },
  shot: { dmg: 0.9, kx: 3, stun: 18, stop: 4, shake: 2, fx: 'none', sfx: 'hurt' },
  launch: { dmg: 1, kx: 2, kz: 9, stun: 26, stop: 6, shake: 4, fx: 'blunt', sfx: 'hurt', down: true },
  poison: { dmg: 0.4, kx: 1, stun: 12, stop: 2, shake: 1, fx: 'none', sfx: 'hurt' },
};

// 몬스터 정의 등록 : 능력치는 ENEMY_TYPES 에, 그림·행동은 MOBS 에
function defMob(id, stats, spec) {
  ENEMY_TYPES[id] = Object.assign({ rig: MOB_RIG, anims: {}, mob: true, lv: 62, weight: 1, w: 16, d: 12, gold: [3, 6] }, stats);
  MOBS[id] = spec;
  for (const k in spec.acts) spec.acts[k].name = k;
}

class CMob extends Enemy {
  constructor(type, x, y) {
    super(type, x, y);
    const M = this.M = MOBS[type];
    this.acts = M.acts; this.elem = M.elem || '255,140,80';
    this.anm = 'idle'; this.anmT = 0;
    const D = Game.dungeon && Game.dungeon.def, sk = D && SKINS[D.theme];
    this.pal = CMob.palFor(type, M.pal, sk && !M.noTint ? sk : null);
    this.fpal = CMob.palFor(type + ':flash', this.pal, null, true);
    if (M.init) M.init(this);
  }
  static palFor(key, pal, sk, flash) {
    const ck = key + ':' + (sk ? sk.tint : '');
    CMob.cache = CMob.cache || {};
    if (CMob.cache[ck]) return CMob.cache[ck];
    const p = flash ? mapPal(pal, c => (typeof c === 'string' && c[0] === '#' ? mixHex(c, '#ffffff', 0.7) : c))
      : sk ? mapPal(pal, c => mixHex(c, sk.tint, sk.amt * 0.5)) : pal;
    return (CMob.cache[ck] = p);
  }
  play(name, blend, speed, force) { if (force || this.anm !== name) { this.anm = name; this.anmT = 0; } }
  stepAnim() { this.anmT++; }
  glint() { FX.add('world', new Glint(this.x + this.facing * this.w * 1.2, sy(this.y, this.z + this.h * 0.6), 14)); }
  dmgMul(att) { return this.M.dmgMul ? this.M.dmgMul(this, att) : 1; }
  die(hit, dir) { super.die(hit, dir); if (this.M.onDie) this.M.onDie(this); }
  interrupt() { if (this.M.onInterrupt) this.M.onInterrupt(this); super.interrupt(); }
  update() { if (this.M.tick && this.hitstop <= 0 && !this.dying) this.M.tick(this); super.update(); }

  ai(p) {
    const M = this.M, dx = p.x - this.x, adx = Math.abs(dx), ady = Math.abs(p.y - this.y);
    this.facePlayer();
    if (this.aiWait > 0) { this.aiWait--; this.vx *= 0.8; this.vy *= 0.8; this.play('idle'); return; }
    if (this.atkCd <= 0) for (const k in M.acts) {
      const a = M.acts[k];
      if (a.when(this, p, adx, ady) && Game.takeToken(this)) { this.startAttack(k); return; }
    }
    if (M.stationary) { this.vx = 0; this.vy = 0; this.play('idle'); return; }
    const side = dx > 0 ? -1 : 1, keep = M.keep ?? this.range * 0.8;
    let tx = p.x + side * keep, ty = p.y + this.yOff * (M.spread || 0.4);
    if (this.atkCd > 25 || Game.tokensUsed() >= Game.tokenMax) tx = p.x + side * (keep + 80 + this.hang);
    if (M.circle) ty = p.y + Math.sin(Game.time * 0.03 + this.id) * 60;
    const arrived = this.moveTo(tx, clamp(ty, 0, DEPTH), this.speed);
    if (arrived && chance(0.05)) this.aiWait = randi(10, 40);
  }

  draw(ctx) {
    if (!this.visible || this.alpha <= 0) return;
    ctx.save();
    const ox = this.hitstop > 0 && this.shakeHit ? (this.hitstop % 2 ? 1 : -1) * 3 : 0;
    ctx.translate(this.x + ox, sy(this.y, this.z));
    const lying = this.state === 'down' || (this.state === 'dying' && this.landedDead) || (this.state === 'getup' && this.stT < 12);
    const sq = (this.squash || 0);
    ctx.scale(this.facing * (1 - sq * 0.14), 1 + sq * 0.17);
    if (lying && !this.M.fly) { ctx.translate(0, -6); ctx.rotate(-1.35); ctx.translate(this.h * 0.25, 0); }
    else if (this.state === 'air' || this.state === 'dying') ctx.rotate(-0.35);
    else if (this.state === 'hurt') ctx.rotate(-0.15);
    ctx.globalAlpha = this.alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const a = this.act;
    this.M.draw(ctx, this, this.flash > 0 ? this.fpal : this.pal, { t: Game.time + this.id * 13, a: this.anm, at: this.anmT, act: a ? a.name : null, af: this.af, st: this.state });
    ctx.restore();
    if (this.st || this.holdT > 0) Status.draw(ctx, this);
  }
}

const mob = (id, x, y) => new CMob(id, x, y);
const legs4 = (ctx, P, walk, xs, top, len, r, c0, c1) => xs.forEach((x, i) => { const s = Math.sin(walk + i * 1.6) * 10; DR.cap(ctx, x, top, x + s, -2, r, r * 0.75, i % 2 ? c1 : c0, 1.6); });

// ---------- 1. 늑대 ----------
defMob('wolf', { name: '굶주린 늑대', hitMat: 'beast', hpMax: 13000, atk: 1500, speed: 3.6, w: 22, d: 12, h: 72, range: 110 }, {
  pal: { fur: ['#2a2a30', '#5a5a66', '#9a9aa8'] }, circle: true,
  draw(ctx, m, P, k) {
    const F = P.fur, walk = k.a === 'walk' ? k.at * 0.35 : 0, lunge = k.act === 'lunge' && k.af > 14 ? 1 : 0;
    legs4(ctx, P, walk, [-26, 18, -14, 28], -34, 34, 6, F[0], F[1]);
    DR.ell(ctx, 0, -42, 38, 17, F[1], lunge * -0.1, 1.8);
    DR.poly(ctx, [-36, -48, -64, -60, -40, -40], F[0], 1.4);                          // 꼬리
    ctx.save(); ctx.translate(34, -54); ctx.rotate(lunge * 0.2);
    DR.poly(ctx, [-8, -10, 18, -12, 34, -2, 30, 6, 16, 4, -6, 10], F[1], 1.6);
    DR.poly(ctx, [0, -10, 4, -24, 10, -10], F[0], 1.2);
    ctx.fillStyle = '#ffcc30'; ctx.fillRect(14, -6, 4, 3);
    if (lunge) { ctx.fillStyle = '#fff'; ctx.beginPath(); polyPath(ctx, [20, 4, 24, 10, 28, 4]); ctx.fill(); }
    ctx.restore();
  },
  acts: {
    lunge: { anim: 'lunge', len: 40, counter: 14, cdMin: 50, cdMax: 90, when: (m, p, adx, ady) => adx < 170 && adx > 40 && ady < 18,
      start(m) { m.glint(); },
      update(m, f) { if (f === 14) { m.vx = m.facing * 9; m.vz = 4; Sfx.play('swing', 0.6, 1.2); } if (f > 14 && m.z <= 0) m.vx *= 0.75; if (f >= 15 && f <= 24) m.hitPlayer(MH.bite, { x0: 0, x1: 60, d: 22, z0: -10, z1: 80 }); } },
  },
});

// ---------- 2. 독버섯 ----------
defMob('mushroom', { name: '포자 버섯', hitMat: 'flesh', bloodCol: ['#5a7a2a', '#a8d060'], hpMax: 11000, atk: 1300, speed: 1.3, w: 18, h: 66, range: 130 }, {
  pal: { cap: ['#5a1020', '#c02a3a', '#ff7080'], stem: ['#b8a888', '#e8dcc0', '#fff4e0'] },
  keep: 70,
  draw(ctx, m, P, k) {
    const hop = k.a === 'walk' ? Math.abs(Math.sin(k.at * 0.25)) * 8 : 0, puff = k.act === 'spore' ? Math.min(1, k.af / 30) : 0;
    ctx.translate(0, -hop);
    DR.cap(ctx, 0, -4, 0, -34, 13, 11, P.stem[1], 1.6);
    ctx.fillStyle = '#100808'; ctx.fillRect(-6, -26, 3, 4); ctx.fillRect(4, -26, 3, 4);
    DR.ell(ctx, 0, -40, 32 + puff * 8, 20 - puff * 4, P.cap[1], 0, 1.8);
    ctx.fillStyle = P.stem[2]; for (const [x, y] of [[-14, -46], [6, -52], [18, -42]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
    if (puff > 0.6) DR.glow(ctx, 0, -40, 50, '200,230,110', 0.5);
  },
  acts: {
    spore: { anim: 'spore', len: 56, counter: 26, cdMin: 90, cdMax: 150, when: (m, p, adx, ady) => adx < 115 && ady < 40,
      update(m, f) {
        m.vx = 0; m.vy = 0;
        if (f === 6) FX.add('ground', new Telegraph(m.x, m.y, 130, 44, 26, { col: '200,230,110' }));
        if (f === 32) { for (let i = 0; i < 14; i++) FX.add('world', new Mote(m.x + rand(-30, 30), sy(m.y, 40), rand(-3, 3), rand(-2, 0.5), { col: '200,230,110', life: 40, r: rand(10, 18) })); Sfx.play('pillar', 0.4, 1.8); BX.hitAt(m, m.x, m.y, 130, 44, MH.launch, 90); }
      } },
  },
});

// ---------- 3. 해골 궁수 ----------
defMob('skeleton', { name: '해골 궁수', hitMat: 'bone', hpMax: 10000, atk: 1500, speed: 2.0, w: 14, h: 120, range: 380 }, {
  pal: { bone: ['#8a8070', '#d8d0c0', '#fffaf0'], bow: ['#3a2a14', '#6a4a24', '#a07a40'] }, keep: 360,
  draw(ctx, m, P, k) {
    const B = P.bone, walk = k.a === 'walk' ? Math.sin(k.at * 0.2) : 0, draw = k.act === 'shoot' ? Math.min(1, k.af / 26) : 0;
    DR.line(ctx, [[-4, -60], [-6 - walk * 10, -30], [-4 - walk * 12, 0]], B[1], 5);
    DR.line(ctx, [[4, -60], [6 + walk * 10, -30], [6 + walk * 12, 0]], B[1], 5);
    DR.cap(ctx, 0, -60, 0, -100, 6, 6, B[1], 1.4);
    ctx.strokeStyle = B[0]; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-10, -92 + i * 9); ctx.lineTo(10, -92 + i * 9); ctx.stroke(); }
    DR.ell(ctx, 2, -112, 12, 13, B[1], 0, 1.6);
    ctx.fillStyle = '#100808'; ctx.fillRect(4, -116, 5, 5); ctx.fillRect(-4, -116, 4, 5);
    DR.glow(ctx, 6, -114, 10, '120,255,200', 0.8);
    DR.line(ctx, [[0, -96], [18, -86]], B[1], 4);
    ctx.save(); ctx.translate(22, -86);
    ctx.strokeStyle = P.bow[1]; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-6, 0, 30, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, -28); ctx.lineTo(-6 - draw * 16, 0); ctx.lineTo(4, 28); ctx.stroke();
    if (draw > 0) DR.line(ctx, [[-6 - draw * 16, 0], [30, 0]], '#c8b890', 2);
    ctx.restore();
  },
  acts: {
    shoot: { anim: 'shoot', len: 44, counter: 22, cdMin: 70, cdMax: 120, when: (m, p, adx, ady) => adx > 140 && adx < 560 && ady < 30,
      update(m, f) { m.vx = 0; m.vy = 0; if (f === 28) { Sfx.play('throw', 0.6, 1.6); BX.shot(m, m.x + m.facing * 30, m.y, 86, m.facing * 11, 0, 0, { style: 'spear', r: 8, col: '230,220,190', hd: MH.shot, life: 90, floor: true }); } } },
  },
});

// ---------- 4. 가고일 (비행, 급강하) ----------
defMob('gargoyle', { name: '석상 가고일', hitMat: 'stone', hpMax: 15000, atk: 1700, speed: 2.6, w: 18, h: 200, range: 260 }, {
  pal: { stone: ['#3a3a40', '#6a6a72', '#a0a0aa'] }, fly: true, keep: 240,
  tick(m) { if (m.act && m.act.name === 'dive') return; m.hov = lerp(m.hov ?? 120, 120, 0.1); },
  draw(ctx, m, P, k) {
    const S = P.stone, fl = Math.sin(k.t * 0.3), h = k.act === 'dive' ? (m.hov ?? 120) : 120 + Math.sin(k.t * 0.05) * 8;
    ctx.translate(0, -h);
    for (const s of [-1, 1]) DR.poly(ctx, [0, -30, -50, -60 - fl * 14 * s, -70, -20, -30, -10], s < 0 ? S[0] : S[1], 1.6);
    DR.ell(ctx, 0, -20, 20, 26, S[1], 0, 1.8);
    DR.ell(ctx, 10, -50, 13, 12, S[1], 0, 1.6);
    DR.poly(ctx, [2, -60, -4, -76, 8, -60], S[2], 1); DR.poly(ctx, [12, -60, 14, -78, 18, -58], S[2], 1);
    DR.glow(ctx, 16, -50, 12, '255,80,40', 0.9);
    DR.line(ctx, [[-6, 2], [-10, 20]], S[0], 5); DR.line(ctx, [[6, 2], [10, 20]], S[0], 5);
  },
  acts: {
    dive: { anim: 'dive', len: 70, counter: 20, cdMin: 90, cdMax: 150, when: (m, p, adx, ady) => adx < 340,
      start(m) { m.glint(); m.hov = 120; },
      update(m, f) {
        const p = Game.player;
        if (f === 2) { m.dx = p.x; m.dy = p.y; FX.add('ground', new Telegraph(p.x, p.y, 54, 20, 22, { col: '255,120,80' })); }
        if (f < 22) { m.vx = 0; m.vy = 0; m.hov = 120 + f * 2; }
        if (f >= 22 && f < 34) { m.x = lerp(m.x, m.dx, 0.25); m.y = lerp(m.y, m.dy, 0.25); m.hov = lerp(m.hov, 10, 0.3); if (f === 22) Sfx.play('swing', 0.7, 0.8); m.hitPlayer(MH.heavy, { x0: -30, x1: 40, d: 30, z0: -10, z1: 200 }); }
        if (f >= 34) { m.hov = lerp(m.hov, 120, 0.1); m.vx = -m.facing * 2; }
      },
      cancel(m) { m.hov = 120; } },
  },
});

// ---------- 5. 슬라임 (죽으면 둘로 갈라짐) ----------
const slimeSpec = (small) => ({
  pal: { gel: ['#1a5a8a', '#40a0e0', '#b0e8ff'] },
  onDie: small ? null : m => { for (const s of [-1, 1]) { const e = mob('slimelet', m.x + s * 20, clamp(m.y + s * 14, 0, DEPTH)); e.vx = s * 3; e.aiWait = 30; Game.enemies.push(e); } },
  draw(ctx, m, P, k) {
    const sc = small ? 0.6 : 1, sq = k.act === 'hop' ? (k.af < 14 ? k.af / 14 * 0.3 : -0.2) : Math.sin(k.t * 0.15) * 0.06;
    ctx.scale(sc * (1 + sq), sc * (1 - sq));
    DR.ell(ctx, 0, -30, 40, 32, P.gel[1], 0, 2);
    ctx.fillStyle = P.gel[2]; ctx.globalAlpha *= 0.7; ctx.beginPath(); ctx.ellipse(-12, -44, 12, 7, -0.4, 0, TAU); ctx.fill(); ctx.globalAlpha /= 0.7;
    ctx.fillStyle = '#0a1420'; ctx.beginPath(); ctx.arc(8, -32, 4, 0, TAU); ctx.arc(22, -32, 4, 0, TAU); ctx.fill();
  },
  acts: {
    hop: { anim: 'hop', len: 50, counter: 14, cdMin: 50, cdMax: 90, when: (m, p, adx, ady) => adx < 240 && ady < 40,
      update(m, f) {
        if (f === 14) { const p = Game.player; m.vx = clamp((p.x - m.x) / 22, -9, 9); m.vy = clamp((p.y - m.y) / 22, -3, 3); m.vz = 8; Sfx.play('jump', 0.6, 1.5); }
        if (f > 14 && m.z <= 0 && f > 20) { m.vx *= 0.6; m.vy *= 0.6; }
        if (f >= 30 && f <= 36) m.hitPlayer(small ? MH.bite : MH.launch, { x0: -30, x1: 30, d: 26, z0: -10, z1: 60 });
      } },
  },
});
defMob('slime', { name: '젤리 슬라임', hitMat: 'magic', bloodCol: ['#1a5a8a', '#80d0ff'], hpMax: 12000, atk: 1400, speed: 1.8, w: 22, h: 64, range: 200 }, slimeSpec(false));
defMob('slimelet', { name: '작은 슬라임', hitMat: 'magic', bloodCol: ['#1a5a8a', '#80d0ff'], hpMax: 4000, atk: 900, speed: 2.4, w: 14, h: 40, range: 200, gold: [1, 2] }, slimeSpec(true));

// ---------- 6. 설인 ----------
defMob('yeti', { name: '설원 설인', hitMat: 'beast', hpMax: 52000, atk: 3600, speed: 1.7, w: 28, d: 16, h: 160, weight: 1.6, range: 130, elite: true, gold: [8, 14] }, {
  pal: { fur: ['#a8b8c8', '#e8f0f8', '#ffffff'], skin: ['#2a3a5a', '#4a6a9a', '#8ab0e0'] },
  draw(ctx, m, P, k) {
    const F = P.fur, walk = k.a === 'walk' ? Math.sin(k.at * 0.12) : 0;
    let armY = -70; if (k.act === 'pound') armY = k.af < 30 ? -170 : -10; if (k.act === 'snowball') armY = k.af < 26 ? -180 : -90;
    DR.cap(ctx, -16, -60, -18 - walk * 10, 0, 16, 12, F[0], 1.8); DR.cap(ctx, 16, -60, 18 + walk * 10, 0, 16, 12, F[1], 1.8);
    DR.ell(ctx, 0, -100, 46, 52, F[1], 0, 2.2);
    DR.ell(ctx, 16, -150, 22, 20, F[1], 0, 1.8);
    DR.ell(ctx, 26, -146, 12, 10, P.skin[1], 0, 1);
    ctx.fillStyle = '#100810'; ctx.fillRect(24, -152, 4, 4); ctx.fillRect(32, -152, 4, 4);
    DR.cap(ctx, 30, -120, 52, armY, 14, 18, F[2], 1.8);
    if (k.act === 'snowball' && k.af < 30) DR.ell(ctx, 52, armY - 24, 22, 22, '#ffffff', 0, 1.6);
  },
  acts: {
    pound: { anim: 'pound', len: 60, counter: 30, armor: [1, 34], cdMin: 80, cdMax: 130, when: (m, p, adx, ady) => adx < 170 && ady < 30,
      update(m, f) { m.vx = 0; if (f === 14) m.glint(); if (f === 32) { const x = m.x + m.facing * 80; BX.blast(m, x, m.y, 110, 40, MH.heavy, '220,240,255', { shake: 6 }); } } },
    snowball: { anim: 'snowball', len: 50, counter: 26, cdMin: 90, cdMax: 150, when: (m, p, adx) => adx > 200 && adx < 520,
      update(m, f) { m.vx = 0; if (f === 30) { const p = Game.player, T = 30, v = BX.arc(m.x, m.y, 170, p.x, p.y, 0, T, 0.5); BX.tele(p.x, p.y, 60, 22, T, '220,240,255'); BX.shot(m, m.x, m.y, 170, v[0], v[1], v[2], { style: 'orb', r: 18, col: '240,250,255', grav: 0.5, hd: MH.heavy, onEnd: s => BX.blast(m, s.x, s.y, 60, 22, MH.heavy, '230,245,255', { style: 'quiet' }) }); Sfx.play('throw', 0.8, 0.6); } } },
  },
});

// ---------- 7. 흡혈 박쥐 ----------
defMob('bat', { name: '흡혈 박쥐', hitMat: 'flesh', hpMax: 7000, atk: 1100, speed: 3.6, w: 14, h: 170, range: 120, gold: [2, 4] }, {
  pal: { wing: ['#1a0a14', '#3a1a2a', '#6a3a4a'] }, fly: true, circle: true, keep: 140,
  draw(ctx, m, P, k) {
    const fl = Math.sin(k.t * 0.6), h = 120 + Math.sin(k.t * 0.09 + m.id) * 20 - (k.act === 'swoop' && k.af > 12 && k.af < 26 ? 80 : 0);
    ctx.translate(0, -h);
    for (const s of [-1, 1]) DR.poly(ctx, [0, -8, -28, -20 - fl * 14, -40, -4, -18, 0], s < 0 ? P.wing[0] : P.wing[1], 1.2);
    DR.ell(ctx, 0, -6, 10, 12, P.wing[1], 0, 1.4);
    ctx.fillStyle = '#ff3040'; ctx.fillRect(3, -12, 3, 3);
  },
  acts: {
    swoop: { anim: 'swoop', len: 40, counter: 10, cdMin: 50, cdMax: 90, when: (m, p, adx, ady) => adx < 160 && ady < 30,
      update(m, f) { if (f === 12) { m.vx = m.facing * 7; Sfx.play('swing', 0.4, 1.8); } if (f >= 12 && f <= 26) m.hitPlayer(MH.bite, { x0: -10, x1: 50, d: 24, z0: 0, z1: 140 }); if (f > 26) m.vx *= 0.8; } },
  },
});

// ---------- 8. 굴착 두더지 ----------
defMob('mole', { name: '굴착 두더지', hitMat: 'beast', hpMax: 14000, atk: 1600, speed: 2.2, w: 20, h: 70, range: 300 }, {
  pal: { fur: ['#3a2a1a', '#6a4a2a', '#a07a50'], claw: ['#c8c0a8', '#e8e0d0', '#ffffff'] },
  onInterrupt(m) { m.under = 0; m.invul = 0; },
  draw(ctx, m, P, k) {
    const u = m.under || 0;
    if (u > 0) { ctx.fillStyle = '#3a2a18'; ctx.beginPath(); ctx.ellipse(0, -2, 30, 10, 0, 0, TAU); ctx.fill(); if (u >= 1) return; }
    ctx.translate(0, u * 70);
    DR.ell(ctx, 0, -34, 34, 30, P.fur[1], 0, 1.8);
    DR.ell(ctx, 26, -38, 14, 11, '#e8a0a0', 0, 1.2);
    ctx.fillStyle = '#100808'; ctx.fillRect(14, -48, 3, 3);
    for (let i = 0; i < 3; i++) DR.poly(ctx, [20, -18 + i * 5, 40, -12 + i * 6, 22, -10 + i * 5], P.claw[1], 1);
  },
  acts: {
    burrow: { anim: 'burrow', len: 110, counter: 0, cdMin: 120, cdMax: 180, when: (m, p, adx) => adx > 100 && adx < 600,
      start(m) { m.invul = 999; },
      update(m, f) {
        m.vx = 0; m.vy = 0;
        const p = Game.player;
        if (f <= 12) m.under = f / 12;
        else if (f < 70) { m.under = 1; m.x += clamp(p.x - m.x, -4, 4); m.y += clamp(p.y - m.y, -2, 2); if (f % 5 === 0) Hitfx.dust(m.x, sy(m.y, 0), 2, 14); }
        if (f === 70) FX.add('ground', new Telegraph(m.x, m.y, 50, 20, 18, { col: '200,160,110' }));
        if (f === 88) { m.under = 0; m.invul = 0; BX.blast(m, m.x, m.y, 54, 22, MH.launch, '200,160,110', { shake: 4 }); }
      },
      cancel(m) { m.under = 0; m.invul = 0; } },
  },
});

// ---------- 9. 사막 전갈 ----------
defMob('scorpion', { name: '사막 전갈', hitMat: 'armor', hpMax: 16000, atk: 1450, speed: 2.2, w: 26, d: 14, h: 80, range: 150 }, {
  pal: { shell: ['#5a3010', '#a8682a', '#e8b060'] },
  draw(ctx, m, P, k) {
    const S = P.shell, walk = k.a === 'walk' ? k.at * 0.4 : 0;
    let tail = Math.sin(k.t * 0.08) * 0.1; if (k.act === 'sting') tail = k.af < 22 ? -0.4 : 1.1;
    for (let i = 0; i < 4; i++) { const x = -24 + i * 14, s = Math.sin(walk + i) * 6; DR.line(ctx, [[x, -20], [x - 8 + s, -10], [x - 12 + s, 0]], S[0], 3); }
    DR.ell(ctx, 0, -24, 32, 14, S[1], 0, 1.8);
    DR.cap(ctx, 30, -26, 48, -30, 6, 5, S[1], 1.4); DR.poly(ctx, [46, -36, 62, -40, 56, -28, 62, -22, 46, -24], S[2], 1.2);   // 집게
    ctx.save(); ctx.translate(-28, -30); ctx.rotate(tail);
    const seg = [[0, 0], [-14, -22], [-8, -46], [12, -62], [34, -60]];
    for (let i = 0; i < seg.length - 1; i++) DR.cap(ctx, seg[i][0], seg[i][1], seg[i + 1][0], seg[i + 1][1], 8 - i, 7 - i, S[1], 1.4);
    DR.poly(ctx, [30, -64, 48, -54, 34, -54], '#2a1a08', 1);
    DR.glow(ctx, 40, -58, 14, '160,255,90', 0.8);
    ctx.restore();
  },
  acts: {
    sting: { anim: 'sting', len: 46, counter: 20, cdMin: 60, cdMax: 110, when: (m, p, adx, ady) => adx < 170 && ady < 22,
      start(m) { m.glint(); },
      update(m, f) { m.vx = 0; if (f === 22) Sfx.play('swing', 0.7, 1.4); if (f >= 22 && f <= 27) m.hitPlayer(MH.heavy, { x0: 0, x1: 160, d: 24, z0: 0, z1: 110 }); } },
  },
});

// ---------- 10. 미라 (붕대로 끌어당김) ----------
defMob('mummy', { name: '저주받은 미라', hitMat: 'bone', hpMax: 17000, atk: 1400, speed: 1.4, w: 16, h: 128, range: 280 }, {
  pal: { wrap: ['#6a5a40', '#c0b090', '#ece0c4'] }, keep: 220,
  draw(ctx, m, P, k) {
    const Wr = P.wrap, walk = k.a === 'walk' ? Math.sin(k.at * 0.12) : 0;
    DR.cap(ctx, -6, -60, -8 - walk * 8, 0, 8, 7, Wr[0], 1.6); DR.cap(ctx, 6, -60, 8 + walk * 8, 0, 8, 7, Wr[1], 1.6);
    DR.cap(ctx, 0, -60, 2, -104, 16, 13, Wr[1], 1.8);
    ctx.strokeStyle = Wr[0]; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-14, -66 - i * 7); ctx.lineTo(16, -70 - i * 7); ctx.stroke(); }
    DR.ell(ctx, 4, -116, 12, 13, Wr[1], 0, 1.6);
    DR.glow(ctx, 10, -118, 10, '120,255,200', 0.9);
    DR.cap(ctx, 10, -96, 40, -94, 6, 5, Wr[2], 1.4);
    if (k.act === 'lash' && k.af >= 20 && k.af < 40) { const L = Math.min(1, (k.af - 20) / 6) * 280; ctx.strokeStyle = Wr[2]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(40, -94); ctx.quadraticCurveTo(40 + L * 0.5, -110, 40 + L, -70); ctx.stroke(); }
  },
  acts: {
    lash: { anim: 'lash', len: 60, counter: 20, cdMin: 90, cdMax: 150, when: (m, p, adx, ady) => adx < 320 && adx > 80 && ady < 22,
      update(m, f) {
        m.vx = 0; const p = Game.player;
        if (f === 6) FX.add('ground', new Telegraph(m.x, m.y, 0, 20, 14, { shape: 'rect', w: 320, dir: m.facing, col: '230,220,180' }));
        if (f === 20 && BX.pl() && (p.x - m.x) * m.facing > 20 && (p.x - m.x) * m.facing < 330 && Math.abs(p.y - m.y) < 24 && p.z < 100) { m.grabbed = true; applyHit(m, p, MH.poison, { dir: -m.facing, noStopAtt: true }); }
        if (m.grabbed && f > 20 && f < 38) { p.x = lerp(p.x, m.x + m.facing * 60, 0.18); p.y = lerp(p.y, m.y, 0.2); }
        if (m.grabbed && f === 40) { applyHit(m, p, MH.heavy, { dir: m.facing, noStopAtt: true }); m.grabbed = false; }
      },
      cancel(m) { m.grabbed = false; } },
  },
});

// ---------- 11. 역병 쥐 (떼로 몰려온다) ----------
defMob('rat', { name: '역병 쥐', hitMat: 'flesh', hpMax: 5000, atk: 900, speed: 3.8, w: 12, h: 36, range: 70, gold: [1, 3] }, {
  pal: { fur: ['#3a3020', '#6a5a40', '#9a8a6a'] }, circle: true, spread: 1,
  draw(ctx, m, P, k) {
    const run = k.a === 'walk' ? Math.sin(k.at * 0.6) * 3 : 0;
    DR.ell(ctx, 0, -14 + run * 0.3, 20, 11, P.fur[1], 0, 1.4);
    DR.ell(ctx, 18, -16, 9, 7, P.fur[1], 0, 1.2);
    ctx.fillStyle = '#ff4040'; ctx.fillRect(20, -19, 2, 2);
    ctx.strokeStyle = '#c08080'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -14); ctx.quadraticCurveTo(-34, -24, -40, -10 + run); ctx.stroke();
    DR.glow(ctx, 0, -14, 22, '140,235,80', 0.2);
  },
  acts: {
    bite: { anim: 'bite', len: 26, counter: 10, cdMin: 30, cdMax: 70, when: (m, p, adx, ady) => adx < 80 && ady < 16,
      update(m, f) { if (f === 8) { m.vx = m.facing * 5; Sfx.play('swing', 0.3, 2); } if (f >= 8 && f <= 13) m.hitPlayer(MH.bite, { x0: 0, x1: 40, d: 16, z0: 0, z1: 40 }); m.vx *= 0.85; } },
  },
});

// ---------- 12. 경비 포탑 (움직이지 않는다) ----------
defMob('turret', { name: '경비 포탑', hitMat: 'metal', hpMax: 20000, atk: 1300, speed: 0, w: 22, d: 14, h: 90, range: 600, weight: 3 }, {
  pal: { steel: ['#2a2e36', '#5a6272', '#9aa2b4'] }, stationary: true,
  draw(ctx, m, P, k) {
    const S = P.steel, aim = k.act === 'burst' ? 1 : 0;
    DR.poly(ctx, [-30, 0, 30, 0, 22, -26, -22, -26], S[0], 1.8);
    DR.cap(ctx, 0, -26, 0, -50, 8, 8, S[1], 1.6);
    DR.ell(ctx, 0, -62, 26, 20, S[1], 0, 1.8);
    DR.poly(ctx, [10, -68, 54, -66, 54, -56, 10, -58], S[0], 1.4);
    ctx.fillStyle = aim ? '#ff4030' : '#802020'; ctx.beginPath(); ctx.arc(-4, -64, 5, 0, TAU); ctx.fill();
    if (aim) DR.glow(ctx, -4, -64, 18, '255,60,40', 0.9);
  },
  acts: {
    burst: { anim: 'burst', len: 60, counter: 0, cdMin: 80, cdMax: 120, when: (m, p, adx) => adx < 640,
      update(m, f) {
        if (f === 4) Sfx.play('warn', 0.5, 1.6);
        if (f === 24 || f === 32 || f === 40) { const p = Game.player, d = Math.hypot(p.x - m.x, p.y - m.y) || 1; BX.shot(m, m.x + m.facing * 50, m.y, 62, (p.x - m.x) / d * 9, (p.y - m.y) / d * 4.5, 0, { style: 'orb', r: 8, col: '255,180,80', hd: MH.shot, floor: true, life: 110 }); Sfx.play('throw', 0.4, 2); }
      } },
  },
});

// ---------- 13. 정찰 드론 ----------
defMob('drone', { name: '정찰 드론', hitMat: 'metal', hpMax: 9000, atk: 1300, speed: 2.8, w: 16, h: 190, range: 400 }, {
  pal: { body: ['#1a1a2a', '#3a3a5a', '#7a7aa0'] }, fly: true, keep: 330,
  draw(ctx, m, P, k) {
    const h = 140 + Math.sin(k.t * 0.07 + m.id) * 12;
    ctx.translate(0, -h);
    DR.ell(ctx, 0, 0, 26, 12, P.body[1], 0, 1.6);
    for (const s of [-1, 1]) { DR.line(ctx, [[s * 20, -6], [s * 30, -16]], P.body[0], 3); DR.ell(ctx, s * 30, -18, 16, 3, `rgba(200,220,255,${0.4 + Math.sin(k.t) * 0.3})`, 0, 0); }
    const c = k.act === 'zap' ? '255,60,80' : m.elem;
    ctx.fillStyle = `rgb(${c})`; ctx.fillRect(10, -2, 10, 4); DR.glow(ctx, 16, 0, 16, c, 0.9);
  },
  init(m) { m.elem = '80,220,255'; },
  acts: {
    zap: { anim: 'zap', len: 50, counter: 0, cdMin: 70, cdMax: 130, when: (m, p, adx) => adx < 520,
      update(m, f) {
        m.vx *= 0.9; m.vy *= 0.9;
        const p = Game.player;
        if (f === 6) { m.zx = p.x; m.zy = p.y; FX.add('ground', new Telegraph(p.x, p.y, 40, 16, 24, { col: '80,220,255' })); }
        if (f === 30) { FX.add('world', new Bolt(m.x + m.facing * 16, sy(m.y, 140), m.zx, sy(m.zy, 0), { col: '80,220,255', life: 8, amp: 10, w: 3 })); BX.hitAt(m, m.zx, m.zy, 42, 18, MH.shot, 200); Sfx.wlayer('elec', 0, false); }
      } },
  },
});

// ---------- 14. 천상의 방패기사 (정면 공격을 막는다) ----------
defMob('aegis', { name: '천상의 방패기사', hitMat: 'metal', hpMax: 46000, atk: 3200, speed: 1.8, w: 22, d: 14, h: 150, weight: 1.5, range: 150, elite: true, gold: [8, 14] }, {
  pal: { armor: ['#8a8070', '#e8e0c8', '#ffffff'], gold: ['#8a6a20', '#e8c060', '#fff4c0'] },
  dmgMul(m, att) {
    if (m.state === 'attack' && m.act && m.act.name === 'charge') return 1;
    if (sign(att.x - m.x) === m.facing && !(m.state === 'down' || m.state === 'air' || m.holdT > 0)) {
      if (Game.frame - (m.blockT || 0) > 12) { m.blockT = Game.frame; FX.add('top', new Label(m.x, sy(m.y, m.h) - 10, 'BLOCK', { col: ['#fff', '#ffd24a'], size: 16 })); Hitfx.sparks(m.x + m.facing * 30, sy(m.y, 80), -m.facing, 6, { col: '255,240,170' }); }
      return 0.35;
    }
    return 1;
  },
  draw(ctx, m, P, k) {
    const A = P.armor, walk = k.a === 'walk' ? Math.sin(k.at * 0.15) : 0;
    DR.cap(ctx, -8, -70, -10 - walk * 10, 0, 9, 8, A[0], 1.6); DR.cap(ctx, 8, -70, 10 + walk * 10, 0, 9, 8, A[1], 1.6);
    DR.poly(ctx, [-20, -70, 20, -70, 24, -126, -24, -126], A[1], 1.8);
    for (const s of [-1, 1]) DR.poly(ctx, [0, -110, -40, -150 - s * 0, -50, -100], P.armor[2], 1.2);
    DR.ell(ctx, 2, -140, 14, 16, A[1], 0, 1.6);
    ctx.fillStyle = '#100808'; ctx.fillRect(4, -144, 12, 3);
    DR.poly(ctx, [-6, -156, 2, -172, 10, -156], P.gold[1], 1);
    const lx = k.act === 'charge' && k.af > 20 ? 60 : 30;
    DR.poly(ctx, [lx - 10, -110, 160 + lx, -104, lx - 10, -98], P.gold[1], 1.2);
    DR.poly(ctx, [24, -140, 46, -134, 46, -70, 24, -60], P.gold[1], 1.8);                          // 방패
    ctx.fillStyle = P.armor[2]; ctx.fillRect(32, -124, 6, 40);
  },
  acts: {
    charge: { anim: 'charge', len: 60, counter: 18, cdMin: 80, cdMax: 140, when: (m, p, adx, ady) => adx < 300 && ady < 22,
      start(m) { m.glint(); },
      update(m, f) { if (f < 20) m.vx = 0; if (f === 20) { m.vx = m.facing * 10; Sfx.play('dash', 0.7, 0.9); m.swing = newSwing(); } if (f >= 20 && f <= 34) m.hitPlayer(MH.heavy, { x0: 0, x1: 190, d: 26, z0: 0, z1: 160 }); if (f > 34) m.vx *= 0.8; } },
  },
});

// ---------- 15. 원혼 (흐려졌다 나타났다) ----------
defMob('wisp', { name: '떠도는 원혼', hitMat: 'magic', hpMax: 10000, atk: 1400, speed: 2.4, w: 16, h: 130, range: 360 }, {
  pal: { ghost: ['#2a6a5a', '#7ad8c0', '#e0fff4'] }, fly: true, keep: 300,
  tick(m) { m.phase = (m.phase || 0) + 1; const v = (m.phase % 300) > 240; m.alpha = v ? 0.25 : 1; if (v && m.state !== 'dying') m.invul = Math.max(m.invul, 2); },
  draw(ctx, m, P, k) {
    const h = 50 + Math.sin(k.t * 0.06 + m.id) * 10;
    ctx.translate(0, -h);
    ctx.fillStyle = `rgba(122,216,192,0.75)`; ctx.beginPath(); ctx.moveTo(-22, -40);
    ctx.quadraticCurveTo(0, -100, 22, -40); for (let i = 0; i <= 6; i++) ctx.lineTo(22 - i * 44 / 6, 20 + Math.sin(k.t * 0.2 + i) * 8 * (i % 2 ? 1 : -1));
    ctx.closePath(); ctx.fill();
    DR.glow(ctx, 0, -30, 50, '120,255,210', 0.5);
    ctx.fillStyle = '#04120e'; ctx.beginPath(); ctx.ellipse(-6, -50, 4, 6, 0, 0, TAU); ctx.ellipse(8, -50, 4, 6, 0, 0, TAU); ctx.ellipse(1, -34, 5, 7, 0, 0, TAU); ctx.fill();
  },
  acts: {
    curse: { anim: 'curse', len: 50, counter: 20, cdMin: 90, cdMax: 150, when: (m, p, adx) => adx < 500 && m.alpha > 0.5,
      update(m, f) { m.vx = 0; m.vy = 0; if (f === 28) { const p = Game.player, a = Math.atan2(p.y - m.y, p.x - m.x); BX.shot(m, m.x, m.y, 90, Math.cos(a) * 3.2, Math.sin(a) * 1.6, 0, { style: 'orb', r: 13, col: '120,255,210', home: 0.05, homeT: 90, hd: MH.shot, floor: true, life: 200 }); Sfx.play('magic', 0.5, 1.4); } } },
  },
});

// ---------- 16. 떠다니는 눈알 ----------
defMob('eye', { name: '심연의 눈', hitMat: 'magic', hpMax: 11000, atk: 1500, speed: 1.9, w: 18, h: 180, range: 420 }, {
  pal: { flesh: ['#4a1a3a', '#8a3a6a', '#c870a0'] }, fly: true, keep: 340,
  draw(ctx, m, P, k) {
    const h = 130 + Math.sin(k.t * 0.05 + m.id) * 14;
    ctx.translate(0, -h);
    ctx.strokeStyle = P.flesh[0]; ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 6, 20); ctx.quadraticCurveTo(-14 + i * 8 + Math.sin(k.t * 0.1 + i) * 8, 50, -6 + i * 6, 70); ctx.stroke(); }
    DR.ell(ctx, 0, 0, 30, 30, '#f0e8e0', 0, 2);
    const c = k.act === 'beam' ? '#ff2040' : '#a03080';
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(10, 0, 13, 0, TAU); ctx.fill();
    ctx.fillStyle = '#100410'; ctx.beginPath(); ctx.arc(12, 0, 6, 0, TAU); ctx.fill();
    if (k.act === 'beam') DR.glow(ctx, 12, 0, 30, '255,40,80', 0.9);
  },
  acts: {
    beam: { anim: 'beam', len: 66, counter: 0, cdMin: 90, cdMax: 150, when: (m, p, adx, ady) => adx < 460 && ady < 40,
      update(m, f) {
        m.vx = 0; m.vy = 0;
        if (f === 6) { m.by = m.y; FX.add('ground', new Telegraph(m.x, m.y, 0, 22, 30, { shape: 'rect', w: 440, dir: m.facing, col: '255,40,80' })); }
        if (f === 36) { FX.add('world', new BBeam(m.x, m.by, m.x + m.facing * 440, m.by, 18, '255,40,80', 18)); const pl = BX.pl(); if (pl && Math.abs(pl.y - m.by) < 26 && (pl.x - m.x) * m.facing > 0 && (pl.x - m.x) * m.facing < 440 && pl.z < 60) applyHit(m, pl, MH.heavy, { dir: m.facing, noStopAtt: true }); Sfx.play('flash', 0.4, 1.4); }
      } },
  },
});

// ---------- 17. 화염 임프 ----------
defMob('imp', { name: '화염 임프', hitMat: 'beast', hpMax: 9000, atk: 1400, speed: 3.0, w: 14, h: 150, range: 360 }, {
  pal: { skin: ['#5a1008', '#c03a1a', '#ff8a40'] }, fly: true, keep: 300, circle: true,
  draw(ctx, m, P, k) {
    const h = 90 + Math.sin(k.t * 0.1 + m.id) * 12, fl = Math.sin(k.t * 0.7);
    ctx.translate(0, -h);
    for (const s of [-1, 1]) DR.poly(ctx, [-4, -24, -26, -40 - fl * 8 * s, -30, -14], P.skin[0], 1.2);
    DR.ell(ctx, 0, -20, 14, 18, P.skin[1], 0, 1.6);
    DR.ell(ctx, 4, -44, 11, 10, P.skin[1], 0, 1.4);
    DR.poly(ctx, [-2, -52, -6, -64, 4, -52], '#2a0a04', 1); DR.poly(ctx, [8, -52, 12, -64, 14, -50], '#2a0a04', 1);
    ctx.fillStyle = '#ffe040'; ctx.fillRect(6, -46, 4, 3);
    ctx.strokeStyle = P.skin[0]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(-24, 10, -14, 24); ctx.stroke();
    if (k.act === 'fireball' && k.af < 26) DR.glow(ctx, 16, -30, 10 + k.af, '255,140,40', 0.9);
  },
  acts: {
    fireball: { anim: 'fireball', len: 44, counter: 20, cdMin: 70, cdMax: 120, when: (m, p, adx) => adx > 120 && adx < 480,
      update(m, f) { m.vx *= 0.8; m.vy *= 0.8; if (f === 26) { const p = Game.player, T = 28, v = BX.arc(m.x, m.y, 110, p.x, p.y, 0, T, 0.4); BX.shot(m, m.x, m.y, 110, v[0], v[1], v[2], { style: 'orb', r: 12, col: '255,140,40', grav: 0.4, hd: MH.shot, onEnd: s => { BX.blast(m, s.x, s.y, 50, 20, MH.shot, '255,140,40', { style: 'quiet' }); FX.add('world', new Flash(s.x, sy(s.y, 6), 8, 60, 12, '255,150,60', 0.8)); BX.zone(m, s.x, s.y, { rx: 40, ry: 16, life: 90, every: 30, col: '255,130,40', hd: MH.poison }); } }); Sfx.play('throw', 0.5, 1.3); } } },
  },
});

// ---------- 18. 어인 창병 ----------
defMob('fishman', { name: '심해 어인', hitMat: 'flesh', bloodCol: ['#1e5a7a', '#58b8d8'], hpMax: 16000, atk: 1800, speed: 2.4, w: 16, h: 124, range: 140 }, {
  pal: { scale: ['#0a3a4a', '#1e7a8a', '#6ac8d0'], fin: ['#2a5a8a', '#4a8ac0', '#8ac0f0'] },
  draw(ctx, m, P, k) {
    const S = P.scale, walk = k.a === 'walk' ? Math.sin(k.at * 0.18) : 0, thrust = k.act === 'thrust' && k.af > 18 && k.af < 28 ? 40 : 0;
    DR.cap(ctx, -6, -56, -10 - walk * 10, 0, 8, 7, S[0], 1.6); DR.cap(ctx, 6, -56, 10 + walk * 10, 0, 8, 7, S[1], 1.6);
    DR.cap(ctx, 0, -56, 4, -100, 16, 13, S[1], 1.8);
    DR.poly(ctx, [-10, -100, -26, -80, -12, -64], P.fin[1], 1.2);
    DR.ell(ctx, 12, -112, 16, 12, S[1], 0, 1.6);
    ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(18, -116, 3, 0, TAU); ctx.fill();
    DR.poly(ctx, [0, -124, 6, -136, 16, -124], P.fin[2], 1);
    DR.poly(ctx, [-30 + thrust, -92, 120 + thrust, -90, -30 + thrust, -86], '#8a7a5a', 1);
    DR.poly(ctx, [112 + thrust, -98, 134 + thrust, -90, 112 + thrust, -82], '#c8d0d8', 1.2);
  },
  acts: {
    thrust: { anim: 'thrust', len: 40, counter: 18, cdMin: 50, cdMax: 100, when: (m, p, adx, ady) => adx < 160 && ady < 18,
      start(m) { m.glint(); },
      update(m, f) { if (f === 18) { m.vx = m.facing * 4; Sfx.play('swing', 0.6, 1.1); m.swing = newSwing(); } if (f >= 18 && f <= 24) m.hitPlayer(MH.bite, { x0: 0, x1: 160, d: 20, z0: 20, z1: 110 }); if (f > 24) m.vx *= 0.8; } },
    leap: { anim: 'leap', len: 60, counter: 16, cdMin: 90, cdMax: 150, when: (m, p, adx) => adx > 180 && adx < 360,
      update(m, f) {
        const p = Game.player;
        if (f === 14) { FX.add('ground', new Telegraph(p.x, p.y, 60, 22, 22, { col: '100,200,240' })); m.vx = clamp((p.x - m.x) / 22, -12, 12); m.vy = clamp((p.y - m.y) / 22, -3, 3); m.vz = 9; Sfx.play('jump', 0.6); }
        if (f > 30 && m.z <= 0) { m.vx *= 0.7; m.vy *= 0.7; if (!m.landHit) { m.landHit = true; BX.blast(m, m.x, m.y, 64, 24, MH.launch, '120,210,240', { shake: 3 }); } }
        if (f === 1) m.landHit = false;
      } },
  },
});

// ---------- 19. 씨앗 꼬투리 (뿌리박힘) ----------
defMob('pod', { name: '가시 꼬투리', hitMat: 'flesh', bloodCol: ['#3a6a1a', '#90d050'], hpMax: 14000, atk: 1300, speed: 0, w: 20, h: 90, range: 520, weight: 3 }, {
  pal: { leaf: ['#1a4a10', '#3a8a2a', '#8ad048'], bulb: ['#6a2a5a', '#b04a9a', '#e890d0'] }, stationary: true,
  draw(ctx, m, P, k) {
    const sw = Math.sin(k.t * 0.06) * 0.1, sq = k.act === 'spit' ? (k.af < 24 ? k.af / 24 * 0.3 : -0.1) : 0;
    for (const a of [-2.5, -0.6]) { ctx.save(); ctx.rotate(a + sw); DR.poly(ctx, [0, 0, 26, -10, 54, 0, 26, 8], P.leaf[1], 1.2); ctx.restore(); }
    DR.cap(ctx, 0, 0, 4, -50, 7, 6, P.leaf[0], 1.4);
    ctx.save(); ctx.translate(6, -66); ctx.scale(1 + sq, 1 - sq);
    DR.ell(ctx, 0, 0, 24, 22, P.bulb[1], 0, 1.8);
    ctx.fillStyle = P.bulb[2]; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.3) * 12, Math.sin(i * 1.3) * 10, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1a0410'; ctx.beginPath(); ctx.ellipse(18, -2, 6, 8, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  acts: {
    spit: { anim: 'spit', len: 50, counter: 0, cdMin: 70, cdMax: 120, when: (m, p, adx) => adx < 560,
      update(m, f) { if (f === 26) { const p = Game.player; for (let i = 0; i < 2; i++) { const tx = p.x + (i ? 60 : -60) * Math.random(), ty = clamp(p.y + rand(-30, 30), 0, DEPTH), T = 32, v = BX.arc(m.x, m.y, 70, tx, ty, 0, T, 0.45); BX.tele(tx, ty, 40, 16, T, '140,230,80'); BX.shot(m, m.x, m.y, 70, v[0], v[1], v[2], { style: 'seed', r: 10, grav: 0.45, hd: MH.shot, onEnd: s => BX.blast(m, s.x, s.y, 44, 18, MH.shot, '140,230,80', { style: 'quiet' }) }); } Sfx.play('throw', 0.5, 1.6); } } },
  },
});

// ---------- 20. 수정 정령 ----------
defMob('crystalling', { name: '수정 정령', hitMat: 'ice', hpMax: 15000, atk: 1600, speed: 2.0, w: 18, h: 110, range: 300 }, {
  pal: { cr: ['#4a3a90', '#9a80e0', '#e8e0ff'] }, keep: 260,
  draw(ctx, m, P, k) {
    const C = P.cr, bob = Math.sin(k.t * 0.08 + m.id) * 5;
    ctx.translate(0, bob);
    DR.poly(ctx, [-16, -10, 0, -110, 16, -10, 0, 0], C[1], 1.8);
    ctx.fillStyle = C[2]; ctx.beginPath(); polyPath(ctx, [0, -106, 14, -12, 2, -14]); ctx.fill();
    for (const s of [-1, 1]) { const a = k.t * 0.05 * s; DR.poly(ctx, [s * 30 + Math.cos(a) * 4, -70, s * 38, -50, s * 30, -30, s * 22, -50], C[0], 1.2); }
    DR.glow(ctx, 0, -60, 40, '190,170,255', 0.5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(4, -76, 6, 3);
  },
  acts: {
    spikes: { anim: 'spikes', len: 66, counter: 24, cdMin: 90, cdMax: 150, when: (m, p, adx, ady) => adx < 360 && ady < 50,
      update(m, f) {
        m.vx = 0; m.vy = 0;
        for (let i = 0; i < 4; i++) if (f === 20 + i * 6) {
          const x = m.x + m.facing * (60 + i * 70);
          FX.add('ground', new Telegraph(x, m.y, 36, 14, 12, { col: '190,170,255', onEnd: tg => { FX.add('world', new WSpike(tg.x, tg.y, 90, ['#c8b8ff', '#9a80e0', '#ffffff'])); BX.hitAt(m, tg.x, tg.y, 40, 18, MH.launch, 100); } }));
        }
      } },
  },
});

// Room.spawnWave 에서 종류에 맞는 클래스로 만든다
function makeEnemy(k, x, y) { return ENEMY_TYPES[k] && ENEMY_TYPES[k].mob ? new CMob(k, x, y) : new Enemy(k, x, y); }
