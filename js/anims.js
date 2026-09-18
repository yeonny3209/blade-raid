'use strict';
// ============================================================
//  애니메이션 라이브러리 (포즈 키프레임)
// ============================================================
const E = Ease;

// ---------------- 플레이어 ----------------
const PS = P({ t: 12, h: -4, th1: 28, sh1: -34, th2: -22, sh2: -14, ua1: 25, fa1: 70, w: 30, ua2: -12, fa2: 45 });

const PP = {
  crouch: P({ t: 28, h: -6, th1: 70, sh1: -110, th2: -5, sh2: -95, ua1: 35, fa1: 70, w: 25, ua2: -20, fa2: 50 }),
  jumpUp: P({ t: 8, h: -6, th1: 75, sh1: -105, th2: 15, sh2: -75, ua1: 60, fa1: 70, w: 40, ua2: -40, fa2: 60 }),
  jumpDown: P({ t: 10, h: 0, th1: 35, sh1: -45, th2: -15, sh2: -35, ua1: 40, fa1: 70, w: 30, ua2: -30, fa2: 50 }),
  a1w: P({ t: -2, h: -8, th1: 20, sh1: -25, th2: -25, sh2: -15, ua1: 165, fa1: 35, w: 10, ua2: -25, fa2: 40 }),
  a1s: P({ t: 32, h: 6, th1: 58, sh1: -62, th2: -38, sh2: -6, ua1: 75, fa1: 5, w: -25, ua2: -55, fa2: 25 }),
  a1f: P({ t: 30, h: 6, th1: 58, sh1: -62, th2: -38, sh2: -6, ua1: 60, fa1: 5, w: -32, ua2: -55, fa2: 25 }),
  a2w: P({ t: 30, h: 6, th1: 50, sh1: -60, th2: -35, sh2: -8, ua1: 30, fa1: -10, w: -55, ua2: -40, fa2: 30 }),
  a2s: P({ t: -8, h: -10, th1: 30, sh1: -30, th2: -28, sh2: -12, ua1: 160, fa1: 15, w: 5, ua2: -60, fa2: 20 }),
  a2f: P({ t: -10, h: -10, th1: 30, sh1: -30, th2: -28, sh2: -12, ua1: 170, fa1: 20, w: 12, ua2: -60, fa2: 20 }),
  a3w: P({ t: 5, h: -4, th1: 25, sh1: -40, th2: -20, sh2: -20, ua1: -40, fa1: 110, w: 25, ua2: 10, fa2: 60 }),
  a3s: P({ t: 36, h: 10, th1: 72, sh1: -35, th2: -55, sh2: 0, ua1: 88, fa1: 2, w: 5, ua2: -70, fa2: 10 }),
  a4w: P({ t: -12, h: -12, th1: 15, sh1: -20, th2: -30, sh2: -10, ua1: 180, fa1: 30, w: 25, ua2: -10, fa2: 80 }),
  a4s: P({ t: 44, h: 12, th1: 78, sh1: -88, th2: -45, sh2: -12, ua1: 70, fa1: -5, w: -45, ua2: -60, fa2: 20 }),
  daw: P({ t: 35, h: 5, th1: 60, sh1: -40, th2: -50, sh2: -10, ua1: -50, fa1: 20, w: -50, ua2: 30, fa2: 40 }),
  das: P({ t: 15, h: -8, th1: 55, sh1: -55, th2: -40, sh2: -10, ua1: 140, fa1: 20, w: 10, ua2: -60, fa2: 20 }),
  jaw: P({ t: -5, h: -8, th1: 50, sh1: -80, th2: 10, sh2: -60, ua1: 160, fa1: 40, w: 10, ua2: -30, fa2: 50 }),
  jas: P({ t: 30, h: 10, th1: 40, sh1: -50, th2: -20, sh2: -30, ua1: 60, fa1: 0, w: -30, ua2: -50, fa2: 30 }),
  upC: P({ t: 40, h: 10, th1: 80, sh1: -110, th2: -20, sh2: -90, ua1: 20, fa1: -10, w: 10, ua2: -40, fa2: 40 }),
  upS: P({ t: -15, h: -15, th1: 20, sh1: -20, th2: -15, sh2: -10, ua1: 165, fa1: 20, w: 10, ua2: -60, fa2: 30 }),
  rushW: P({ t: 22, h: 4, th1: 45, sh1: -70, th2: -30, sh2: -35, ua1: -50, fa1: 90, w: 50, ua2: 30, fa2: 40 }),
  rushT: P({ t: 46, h: 16, th1: 82, sh1: -25, th2: -65, sh2: 5, ua1: 88, fa1: 0, w: 3, ua2: -80, fa2: 10 }),
  bigW: P({ t: -10, h: -12, th1: 25, sh1: -30, th2: -30, sh2: -10, ua1: 182, fa1: 30, w: 25, ua2: -20, fa2: 70 }),
  bigS: P({ t: 42, h: 12, th1: 76, sh1: -80, th2: -48, sh2: -8, ua1: 72, fa1: -5, w: -48, ua2: -65, fa2: 20 }),
  drawR: P({ t: 42, h: 16, th1: 88, sh1: -112, th2: -42, sh2: -68, ua1: -30, fa1: 60, w: -112, ua2: 60, fa2: 55 }),
  drawF: P({ t: 26, h: 0, th1: 76, sh1: -30, th2: -62, sh2: 0, ua1: 100, fa1: 10, w: -5, ua2: -70, fa2: 20 }),
  ebC: P({ t: 32, h: 6, th1: 72, sh1: -105, th2: -20, sh2: -82, ua1: -30, fa1: 40, w: -40, ua2: -30, fa2: 40 }),
  ebR: P({ t: -10, h: -10, th1: 70, sh1: -110, th2: 30, sh2: -90, ua1: 175, fa1: 25, w: 15, ua2: -20, fa2: 60 }),
  ebP: P({ t: 25, h: 10, th1: 30, sh1: -40, th2: -20, sh2: -30, ua1: 40, fa1: -10, w: -25, ua2: -60, fa2: 30 }),
  ebI: P({ t: 52, h: 16, th1: 88, sh1: -102, th2: -46, sh2: -72, ua1: 32, fa1: -15, w: -2, ua2: -70, fa2: 30 }),
  ultUp: P({ t: -12, h: -16, th1: 70, sh1: -100, th2: 20, sh2: -80, ua1: 178, fa1: 8, w: 4, ua2: -40, fa2: 60 }),
  ultDn: P({ t: 44, h: 12, th1: 70, sh1: -60, th2: -40, sh2: -20, ua1: 68, fa1: -6, w: -44, ua2: -65, fa2: 20 }),
  back: P({ t: -18, h: -10, th1: 30, sh1: -70, th2: -30, sh2: -60, ua1: -20, fa1: 60, w: -10, ua2: -50, fa2: 40 }),
  hurt1: P({ t: -22, h: -20, th1: 20, sh1: -20, th2: -25, sh2: -25, ua1: -20, fa1: 50, w: 30, ua2: -45, fa2: 30 }),
  hurt2: P({ t: 25, h: 25, th1: 30, sh1: -50, th2: -20, sh2: -30, ua1: 40, fa1: 40, w: 20, ua2: 10, fa2: 30 }),
  fall: P({ t: -30, h: -25, th1: 50, sh1: -60, th2: 10, sh2: -40, ua1: 150, fa1: 20, w: 20, ua2: 120, fa2: 30, rot: -25 }),
  down: P({ t: 0, h: -10, th1: 10, sh1: -20, th2: -5, sh2: -10, ua1: 100, fa1: 30, w: 0, ua2: 80, fa2: 20, rot: -90 }),
  kneel: P({ t: 35, h: 10, th1: 90, sh1: -100, th2: -10, sh2: -105, ua1: 30, fa1: 40, w: 40, ua2: 20, fa2: 30 }),
  win: P({ t: 2, h: -8, th1: 12, sh1: -8, th2: -14, sh2: -6, ua1: 45, fa1: 25, w: -55, ua2: -8, fa2: 30 }),
  hero: P({ t: -4, h: -10, th1: 30, sh1: -30, th2: -24, sh2: -10, ua1: 160, fa1: 25, w: 5, ua2: 60, fa2: 60 }),
};

const ANIM_P = {
  idle: AF(t => {
    const b = Math.sin(t * 0.07);
    return P({ t: 12 + b * 1.5, h: -4 - b, ua1: 25 + b * 2, fa1: 70 - b * 2, w: 30 + b * 3, ua2: -12 - b * 3, fa2: 45 + b * 4, th1: 28, sh1: -34 - b * 3, th2: -22, sh2: -14 - b * 2 });
  }),
  walk: AF(t => {
    const f = t * 0.2, s = Math.sin(f), c = Math.cos(f);
    return P({ t: 14, h: -4, th1: 8 + 27 * s, sh1: -12 - 40 * Math.max(0, c), th2: 8 - 27 * s, sh2: -12 - 40 * Math.max(0, -c), ua1: 25 + 4 * s, fa1: 70, w: 30, ua2: -10 - 22 * s, fa2: 40 });
  }),
  run: AF(t => {
    const f = t * 0.32, s = Math.sin(f), c = Math.cos(f);
    return P({ t: 30, h: -10, th1: 18 + 48 * s, sh1: -22 - 82 * Math.max(0, c), th2: 18 - 48 * s, sh2: -22 - 82 * Math.max(0, -c), ua1: -45 + 6 * s, fa1: 35, w: -65, ua2: 25 - 40 * s, fa2: 65 });
  }),
  air: AF((t, e) => lerpPose(PP.jumpDown, PP.jumpUp, clamp((e.vz + 3) / 10, 0, 1), {})),
  land: A([[0, PP.crouch], [7, PS, E.out]]),
  a1: A([[0, PP.a1w], [3, PP.a1w], [6, PP.a1s, E.out3], [10, PP.a1f, E.out], [20, PS]]),
  a2: A([[0, PP.a2w], [3, PP.a2w], [7, PP.a2s, E.out3], [11, PP.a2f, E.out], [22, PS]]),
  a3: A([[0, PP.a3w], [4, PP.a3w], [6, PP.a3s, E.out5], [13, PP.a3s], [24, PS]]),
  a4: A([[0, PP.a4w], [6, PP.a4w], [9, PP.a4s, E.out3], [19, PP.a4s], [36, PS]]),
  dashAtk: A([[0, PP.daw], [3, PP.daw], [7, PP.das, E.out3], [14, PP.das], [30, PS]]),
  jumpAtk: A([[0, PP.jaw], [2, PP.jaw], [5, PP.jas, E.out3], [10, PP.jas], [18, PP.jumpDown]]),
  upper: A([[0, PP.upC], [5, PP.upC], [9, PP.upS, E.out3], [18, PP.upS], [32, PS]]),
  rush: A([[0, PP.rushW], [8, PP.rushW], [10, PP.rushT, E.out], [24, PP.rushT], [26, PP.a2w, E.out], [30, PP.a2s, E.out3], [36, PP.a2f], [46, PS]]),
  triple: A([[0, PP.a1w], [3, PP.a1w], [7, PP.a1s, E.out3], [18, PP.a1f], [21, PP.a2w, E.out], [25, PP.a2s, E.out3], [36, PP.a2f], [39, PP.bigW, E.out], [43, PP.bigS, E.out3], [54, PP.bigS], [64, PS]]),
  drawReady: A([[0, PP.drawR], [20, PP.drawR]]),
  drawFollow: A([[0, PP.drawF], [26, PP.drawF], [40, PS, E.inOut]]),
  ebCrouch: A([[0, PP.ebC], [6, PP.ebC]]),
  ebRise: A([[0, PP.ebR], [30, PP.ebR]]),
  ebPlunge: A([[0, PP.ebR], [4, PP.ebP, E.out3], [40, PP.ebP]]),
  ebImpact: A([[0, PP.ebI], [22, PP.ebI], [36, PS]]),
  ultUp: A([[0, PP.ultUp], [20, PP.ultUp]]),
  ultDn: A([[0, PP.ultUp], [4, PP.ultDn, E.out5], [30, PP.ultDn], [44, PS]]),
  back: A([[0, PP.back], [14, PP.back], [20, PS]]),
  hurt1: A([[0, PP.hurt1], [14, PP.hurt1], [24, PS]]),
  hurt2: A([[0, PP.hurt2], [14, PP.hurt2], [24, PS]]),
  fall: AF((t, e) => P({}, PP.fall)),
  down: A([[0, PP.down], [2, PP.down]]),
  getup: A([[0, PP.down], [8, PP.kneel, E.out], [18, PS, E.inOut]]),
  win: A([[0, PS], [14, PP.win, E.out3], [30, PP.win]]),
  hero: A([[0, PP.hero], [2, PP.hero]]),
};

// ---------------- 일반 몬스터 (고블린/오크 공용 골격 포즈) ----------------
const EP = {
  idle: P({ t: 15, h: -5, th1: 25, sh1: -40, th2: -20, sh2: -20, ua1: 35, fa1: 60, w: 50, ua2: -20, fa2: 40 }),
  wind: P({ t: -15, h: -12, th1: 15, sh1: -20, th2: -25, sh2: -15, ua1: 175, fa1: 30, w: 20, ua2: -30, fa2: 30 }),
  strike: P({ t: 38, h: 10, th1: 58, sh1: -62, th2: -35, sh2: -10, ua1: 70, fa1: 0, w: -30, ua2: -50, fa2: 30 }),
  hurt1: P({ t: -24, h: -22, th1: 20, sh1: -24, th2: -24, sh2: -26, ua1: -30, fa1: 40, w: 40, ua2: -50, fa2: 30 }),
  hurt2: P({ t: 30, h: 28, th1: 34, sh1: -54, th2: -22, sh2: -30, ua1: 30, fa1: 40, w: 30, ua2: 5, fa2: 30 }),
  air: P({ t: -34, h: -28, th1: 45, sh1: -60, th2: 5, sh2: -35, ua1: 150, fa1: 25, w: 30, ua2: 125, fa2: 30 }),
  down: P({ t: 0, h: -12, th1: 12, sh1: -24, th2: -4, sh2: -12, ua1: 105, fa1: 30, w: 10, ua2: 80, fa2: 20, rot: -90 }),
  kneel: P({ t: 38, h: 12, th1: 90, sh1: -100, th2: -10, sh2: -105, ua1: 30, fa1: 40, w: 40, ua2: 20, fa2: 30 }),
  throwW: P({ t: -18, h: -10, th1: 20, sh1: -30, th2: -30, sh2: -15, ua1: -130, fa1: 40, w: 0, ua2: 40, fa2: 40 }),
  throwS: P({ t: 30, h: 8, th1: 50, sh1: -55, th2: -35, sh2: -10, ua1: 125, fa1: 5, w: 0, ua2: -40, fa2: 30 }),
  lungeW: P({ t: 30, h: 5, th1: 70, sh1: -105, th2: -15, sh2: -90, ua1: -40, fa1: 40, w: -30, ua2: 20, fa2: 40 }),
  roar: P({ t: -28, h: -32, th1: 30, sh1: -30, th2: -30, sh2: -20, ua1: 135, fa1: 40, w: 40, ua2: 125, fa2: 40 }),
};

function mkEnemyAnims(o) {
  const idle = o.idle || EP.idle;
  const sp = o.walkSpeed || 0.22, amp = o.walkAmp || 28;
  return {
    idle: AF(t => {
      const b = Math.sin(t * 0.08);
      return P({ t: idle.t + b * 2, h: idle.h - b * 2, ua1: idle.ua1 + b * 3, fa1: idle.fa1, w: idle.w, ua2: idle.ua2 - b * 3, fa2: idle.fa2, th1: idle.th1, sh1: idle.sh1 - b * 3, th2: idle.th2, sh2: idle.sh2 - b * 2 });
    }),
    walk: AF(t => {
      const f = t * sp, s = Math.sin(f), c = Math.cos(f);
      return P({ t: idle.t + 4, h: idle.h, th1: 8 + amp * s, sh1: -14 - 44 * Math.max(0, c), th2: 8 - amp * s, sh2: -14 - 44 * Math.max(0, -c), ua1: idle.ua1 + 6 * s, fa1: idle.fa1, w: idle.w, ua2: idle.ua2 - 25 * s, fa2: idle.fa2 });
    }),
    run: AF(t => {
      const f = t * sp * 1.6, s = Math.sin(f), c = Math.cos(f);
      return P({ t: 36, h: -14, th1: 18 + 46 * s, sh1: -22 - 80 * Math.max(0, c), th2: 18 - 46 * s, sh2: -22 - 80 * Math.max(0, -c), ua1: -40 + 8 * s, fa1: 35, w: -40, ua2: 20 - 40 * s, fa2: 60 });
    }),
    hurt1: A([[0, EP.hurt1], [12, EP.hurt1], [22, idle]]),
    hurt2: A([[0, EP.hurt2], [12, EP.hurt2], [22, idle]]),
    air: AF((t, e) => P({ rot: clamp(-15 - (t * 3), -80, -15) * (e.vz > 0 ? 0.6 : 1) }, EP.air)),
    down: A([[0, EP.down], [2, EP.down]]),
    getup: A([[0, EP.down], [10, EP.kneel, E.out], [22, idle, E.inOut]]),
  };
}

const ANIM_GOB = Object.assign(mkEnemyAnims({ walkSpeed: 0.26 }), {
  atk: A([[0, EP.idle], [14, EP.wind, E.out], [22, EP.wind], [25, EP.strike, E.out3], [34, EP.strike], [46, EP.idle]]),
  lunge: A([[0, EP.lungeW], [16, EP.lungeW], [20, EP.strike, E.out3], [32, EP.strike], [44, EP.idle]]),
  throw: A([[0, EP.idle], [14, EP.throwW, E.out], [24, EP.throwW], [27, EP.throwS, E.out3], [38, EP.throwS], [48, EP.idle]]),
});

const ORC_IDLE = P({ t: 12, h: -5, th1: 25, sh1: -35, th2: -25, sh2: -15, ua1: 20, fa1: 70, w: 60, ua2: -15, fa2: 50 });
const ANIM_ORC = Object.assign(mkEnemyAnims({ idle: ORC_IDLE, walkSpeed: 0.17, walkAmp: 24 }), {
  smash: A([[0, ORC_IDLE], [18, P({ t: -20, h: -16, th1: 15, sh1: -20, th2: -30, sh2: -12, ua1: 182, fa1: 20, w: 30, ua2: 150, fa2: 30 }), E.out],
    [34, P({ t: -24, h: -18, th1: 15, sh1: -20, th2: -30, sh2: -12, ua1: 186, fa1: 20, w: 34, ua2: 155, fa2: 30 })],
    [38, P({ t: 46, h: 12, th1: 70, sh1: -90, th2: -40, sh2: -10, ua1: 65, fa1: -5, w: -48, ua2: 40, fa2: 10 }), E.out3],
    [56, P({ t: 46, h: 12, th1: 70, sh1: -90, th2: -40, sh2: -10, ua1: 65, fa1: -5, w: -48, ua2: 40, fa2: 10 })], [72, ORC_IDLE]]),
  roar: A([[0, ORC_IDLE], [8, EP.roar, E.out], [26, EP.roar], [30, ORC_IDLE]]),
  chargeEnd: A([[0, P({ t: 20, h: 0, th1: 60, sh1: -70, th2: -40, sh2: -20, ua1: 120, fa1: 20, w: 20, ua2: -30, fa2: 30 })], [6, P({ t: 40, h: 10, th1: 60, sh1: -70, th2: -40, sh2: -20, ua1: 70, fa1: 0, w: -30, ua2: -30, fa2: 30 }), E.out3], [26, ORC_IDLE]]),
});

const MAGE_IDLE = P({ t: 5, h: 0, th1: 10, sh1: -12, th2: -10, sh2: -10, ua1: 30, fa1: 50, w: 100, ua2: 10, fa2: 60 });
const MAGE_CAST = P({ t: -12, h: -10, th1: 12, sh1: -12, th2: -14, sh2: -10, ua1: 135, fa1: 20, w: 25, ua2: 70, fa2: 30 });
const MAGE_SHOOT = P({ t: 18, h: 6, th1: 20, sh1: -20, th2: -16, sh2: -10, ua1: 60, fa1: 30, w: 90, ua2: 90, fa2: 0 });
const ANIM_MAGE = Object.assign(mkEnemyAnims({ idle: MAGE_IDLE, walkSpeed: 0.18, walkAmp: 18 }), {
  cast: A([[0, MAGE_IDLE], [14, MAGE_CAST, E.out], [30, MAGE_CAST], [34, MAGE_SHOOT, E.out3], [46, MAGE_SHOOT], [58, MAGE_IDLE]]),
  summon: A([[0, MAGE_IDLE], [16, MAGE_CAST, E.out], [44, MAGE_CAST], [60, MAGE_IDLE]]),
});

// ---------------- 보스 ----------------
const BOSS_IDLE = P({ t: 10, h: -5, th1: 25, sh1: -35, th2: -25, sh2: -15, ua1: 30, fa1: 60, w: 70, ua2: -20, fa2: 40 });
const BP = {
  w1: P({ t: -18, h: -16, th1: 15, sh1: -20, th2: -30, sh2: -12, ua1: 185, fa1: 25, w: 35, ua2: 150, fa2: 30 }),
  s1: P({ t: 42, h: 12, th1: 70, sh1: -85, th2: -40, sh2: -10, ua1: 68, fa1: -5, w: -40, ua2: 30, fa2: 20 }),
  w2: P({ t: 30, h: 6, th1: 55, sh1: -70, th2: -35, sh2: -10, ua1: 20, fa1: -15, w: -60, ua2: -20, fa2: 30 }),
  s2: P({ t: -10, h: -12, th1: 30, sh1: -30, th2: -30, sh2: -10, ua1: 160, fa1: 15, w: 10, ua2: -60, fa2: 20 }),
  crouch: P({ t: 35, h: 10, th1: 80, sh1: -110, th2: -20, sh2: -90, ua1: -20, fa1: 60, w: 20, ua2: -30, fa2: 40 }),
  leap: P({ t: -5, h: -10, th1: 80, sh1: -110, th2: 20, sh2: -80, ua1: 180, fa1: 20, w: 30, ua2: 160, fa2: 20 }),
  slam: P({ t: 50, h: 16, th1: 85, sh1: -100, th2: -45, sh2: -70, ua1: 60, fa1: -10, w: -45, ua2: 40, fa2: 10 }),
  cast: P({ t: -20, h: -25, th1: 25, sh1: -25, th2: -30, sh2: -15, ua1: 170, fa1: 5, w: 5, ua2: 120, fa2: 40 }),
  kneel: P({ t: 48, h: 30, th1: 92, sh1: -100, th2: -10, sh2: -110, ua1: 20, fa1: 20, w: 40, ua2: 0, fa2: 20 }),
};
const ANIM_BOSS = Object.assign(mkEnemyAnims({ idle: BOSS_IDLE, walkSpeed: 0.13, walkAmp: 22 }), {
  swing1: A([[0, BOSS_IDLE], [22, BP.w1, E.out], [30, BP.w1], [34, BP.s1, E.out3], [48, BP.s1], [56, BP.s1]]),
  swing2: A([[0, BP.s1], [10, BP.w2, E.out], [16, BP.w2], [20, BP.s2, E.out3], [32, BP.s2], [48, BOSS_IDLE]]),
  roar: A([[0, BOSS_IDLE], [14, EP.roar, E.out], [70, EP.roar], [84, BOSS_IDLE]]),
  crouch: A([[0, BOSS_IDLE], [18, BP.crouch, E.out], [24, BP.crouch]]),
  leap: A([[0, BP.leap], [4, BP.leap]]),
  slam: A([[0, BP.leap], [4, BP.slam, E.out3], [30, BP.slam], [46, BOSS_IDLE]]),
  cast: A([[0, BOSS_IDLE], [20, BP.cast, E.out], [60, BP.cast], [70, BP.s1, E.out3], [90, BOSS_IDLE]]),
  kneel: A([[0, BP.kneel], [4, BP.kneel]]),
  chargeEnd: ANIM_ORC.chargeEnd,
});
