'use strict';
// ============================================================
//  주인공 몸을 그림 AI 로 만든 부품 그림으로 그린다
//   - 부품 : img/hero/*.webp (머리 · 몸통 · 골반 · 위팔 · 아래팔 · 손 · 허벅지 · 정강이 · 발 · 망토)
//     자르는 도구 : tools/cut_hero.py   /  관절 위치 : img/hero/meta.json
//   - 관절 계산(리그) · 애니메이션은 그대로 쓰고, 부품을 관절에 붙여 회전시킨다
//   - 칼은 기존 코드 그림(blades.js)을 그대로 쓴다
//   - 그림이 아직 안 불러와졌거나, 복장 스킨을 입은 경우에는 기존 코드 그림을 쓴다
// ============================================================
const HA = (() => {
  const T = { ready: false, on: true };
  const NAMES = ['head', 'torso', 'pelvis', 'uarm', 'farm', 'hand', 'thigh', 'shin', 'foot', 'cape', 'sword'];
  const IMG = {}, CV = {};
  let M = null, g = 0.3, capR = 5.6;
  const BASE = 'img/hero/';
  const V = typeof BUILD !== 'undefined' ? BUILD : '1';

  // 부품 · 관절에 맞추는 기준점 (파일 픽셀)  [x, y] — 값은 meta.json 의 w · h · top · bot 로 계산
  const A = {};
  const calc = () => {
    const P = M.parts, F = M.F; capR = 28 * F;
    const span = n => P[n].h - capR * 1.6;
    g = (RIG_PLAYER.thigh + RIG_PLAYER.shin) / (span('thigh') + span('shin'));
    A.thigh = [P.thigh.top, capR]; A.shin = [P.shin.top, capR];
    A.uarm = [P.uarm.top, capR]; A.farm = [P.farm.top, capR]; A.hand = [P.hand.top, capR * 0.8];
    A.foot = [P.foot.top, capR];
    A.head = [P.head.bot, P.head.h * 0.97];
    A.torso = [P.torso.bot, P.torso.h * 0.89];
    A.pelvis = [P.pelvis.top, P.pelvis.h * 0.1];
    A.cape = [P.cape.top, P.cape.h * 0.06];
    const sw = M.sword; swordK = RIG_PLAYER.wlen * 0.97 / sw.py;          // 칼 : 쥐는 곳에서 칼끝까지가 기존 칼 길이가 되게
  };
  let swordK = 0.45;

  // 변형 그림 : dark(뒤쪽 부품) · white(피격 번쩍임)
  const variant = (nm, kind) => {
    const key = nm + ':' + kind; if (CV[key]) return CV[key];
    const im = IMG[nm], c = makeCanvas(im.naturalWidth, im.naturalHeight), x = c.getContext('2d');
    x.drawImage(im, 0, 0); x.globalCompositeOperation = 'source-atop';
    x.fillStyle = kind === 'white' ? 'rgba(255,255,255,0.92)' : 'rgba(8,6,18,0.42)'; x.fillRect(0, 0, c.width, c.height);
    return (CV[key] = c);
  };
  const put = (ctx, nm, x, y, th, kind, k = 1) => {
    const a = A[nm] || [0, 0], im = kind ? variant(nm, kind) : IMG[nm];
    ctx.save(); ctx.translate(x, y); ctx.rotate(th); ctx.scale(g * k, g * k);
    ctx.drawImage(im, -a[0], -a[1]); ctx.restore();
  };
  // 기본 무기(부러진 검)만 그림으로, 나머지 무기는 기존 코드 그림
  const artSword = ent => { const w = ent.wdef; return !w || w.id === 'w0'; };
  const blade = (ctx, J, pal, ent, opt) => {
    if (!artSword(ent)) return drawPlayerBlade(ctx, J, pal, ent, opt);
    const sw = M.sword, im = opt.flash ? variant('sword', 'white') : IMG.sword;
    weaponFrame(ctx, J.hand1, J.wAng);
    ctx.rotate(Math.PI / 2); ctx.scale(swordK, swordK);
    ctx.drawImage(im, -sw.px, -sw.py);
    ctx.scale(1 / swordK, 1 / swordK);
    const gl = ent.bladeGlow || 0;
    if (gl > 0 && !opt.flash) {                                            // 기 발산
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, gl) * 0.8;
      for (let i = 0; i < 4; i++) drawGlow(ctx, 0, -(14 + i * 15) * 1.1, 17, '120,190,255', 0.35);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  };
  const down = (p, q) => -Math.atan2(q.x - p.x, q.y - p.y);                 // 아래를 향한 부품이 p→q 방향을 보게 하는 회전

  T.load = () => {
    fetch(BASE + 'meta.json?v=' + V).then(r => r.json()).then(m => {
      M = m; calc(); let n = 0;
      for (const nm of NAMES) { const im = IMG[nm] = new Image(); im.onload = () => { if (++n === NAMES.length) T.ready = true; }; im.src = BASE + nm + '.webp?v=' + V; }
    }).catch(() => { });
  };

  // 그릴 수 있는 상태인가 (복장 스킨을 입었으면 기존 그림)
  T.can = (ent, opt) => {
    if (!T.ready || !T.on || opt.ghost) return false;
    const look = ent.adef && ent.adef.look;
    return !(look && look.coat);
  };

  T.draw = (ctx, J, pal, ent, opt) => {
    const fl = opt.flash ? 'white' : null, bk = opt.flash ? 'white' : 'dark';
    const tr = torsoFrame(J);
    // 몸통이 보는 방향 : 엉덩이 → 가슴 (위쪽을 향한 부품)
    const thT = Math.PI - Math.atan2(J.chest.x - J.hip.x, J.chest.y - J.hip.y);
    if (J.wb) blade(ctx, J, pal, ent, opt);
    // 망토 : 어깨에 달려 꼬리 사슬을 따라 흔들린다
    let thC = 0.06;
    if (ent.tail && ent.tail.p && ent.tail.p.length > 2) {
      const s = ent.scale * ent.facing, sc = ent.scale, p0 = ent.tail.p[0], p1 = ent.tail.p[ent.tail.p.length - 1];
      const dx = (p1.x - p0.x) / s, dy = (p1.y - p0.y) / sc;
      thC = clamp(-Math.atan2(dx, dy) * 0.9 - 0.12, -1.3, 1.1);
    }
    put(ctx, 'cape', J.chest.x - tr.fx * 8 + tr.ux * 3, J.chest.y - tr.fy * 8 + tr.uy * 3, thC + 0.22 + thT * 0.5, bk, 1.5);
    // 뒷팔 : 어둡게 · 귀수의 기운이 솟을 때는 붉게 번진다
    const gg = ent.ghostGlow || 0;
    put(ctx, 'uarm', J.sh2.x, J.sh2.y, down(J.sh2, J.elbow2), bk);
    put(ctx, 'farm', J.elbow2.x, J.elbow2.y, down(J.elbow2, J.hand2), bk);
    put(ctx, 'hand', J.hand2.x, J.hand2.y, down(J.elbow2, J.hand2), bk);
    if (gg > 0.05 && !opt.flash) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, J.hand2.x, J.hand2.y, 16 + gg * 18, '255,40,30', 0.35 + Math.min(0.4, gg * 0.4)); ctx.restore(); }
    // 뒷다리 · 앞다리
    for (const [h, k, f, b] of [[J.hip, J.knee2, J.foot2, bk], [J.hip, J.knee1, J.foot1, fl]]) {
      put(ctx, 'thigh', h.x, h.y, down(h, k), b); put(ctx, 'shin', k.x, k.y, down(k, f), b); put(ctx, 'foot', f.x, f.y, down(k, f), b);
    }
    // 골반(치마) · 몸통
    const thP = (down(J.hip, J.knee1) + down(J.hip, J.knee2)) * 0.25 + thT * 0.5;
    put(ctx, 'pelvis', J.hip.x, J.hip.y, thP, fl);
    put(ctx, 'torso', J.hip.x, J.hip.y, thT, fl);
    // 머리
    // 머리 : 몸통 그림의 윗끝(목 밑)에 맞춘다 — 리그의 목 위치와 그림의 몸통 길이가 다르므로
    const top = A.torso[1] * g - 3, nx = J.hip.x + tr.ux * top, ny = J.hip.y + tr.uy * top;
    put(ctx, 'head', nx, ny, J.headRot, fl);
    if (!J.wb) blade(ctx, J, pal, ent, opt);
    // 앞팔
    put(ctx, 'uarm', J.sh1.x, J.sh1.y, down(J.sh1, J.elbow1), fl);
    put(ctx, 'farm', J.elbow1.x, J.elbow1.y, down(J.elbow1, J.hand1), fl);
    put(ctx, 'hand', J.hand1.x, J.hand1.y, down(J.elbow1, J.hand1), fl);
  };

  // 주인공의 그리기 함수를 감싼다
  const orig = RIG_PLAYER.draw;
  RIG_PLAYER.draw = (ctx, J, pal, ent, opt) => { if (T.can(ent, opt)) T.draw(ctx, J, pal, ent, opt); else orig(ctx, J, pal, ent, opt); };
  T.load();
  return T;
})();
