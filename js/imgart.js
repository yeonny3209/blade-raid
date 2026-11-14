'use strict';
// ============================================================
//  그림 AI 로 만든 보스 · 몹 그림을 게임에 입힌다
//   - 그림은 img/art/boss|mob/*.webp (투명 배경으로 오려 낸 한 장짜리)
//   - 그림이 아직 안 불러와졌거나 없는 종류는 기존 코드 그림을 그대로 쓴다
//   - 움직임(숨쉬기 · 걷기 · 공격 예비동작 · 피격 · 분노)은 코드가 만들어 준다
//   - 판정은 건드리지 않는다 : 그림은 몸 크기(h)에 맞춰 그려질 뿐이다
// ============================================================
const IA = (() => {
  const T = {};
  const cache = {};
  const BASE = 'img/art/';

  T.get = key => {
    let s = cache[key];
    if (s) return s;
    s = cache[key] = { ok: false, w: 1, h: 1, img: new Image(), tint: {} };
    s.img.onload = () => { s.ok = true; s.w = s.img.naturalWidth; s.h = s.img.naturalHeight; };
    s.img.src = BASE + key + '.webp?v=' + (typeof BUILD !== 'undefined' ? BUILD : '1');
    return s;
  };
  // 한 가지 색으로 칠한 실루엣 (피격 번쩍임 · 분노 빛)
  T.sil = (s, col) => {
    let c = s.tint[col];
    if (c) return c;
    c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
    const g = c.getContext('2d');
    g.drawImage(s.img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, s.w, s.h);
    return (s.tint[col] = c);
  };

  // 공통 움직임 : 상태에서 변형 값을 만든다
  //  k : { t, a(애니), act(공격이름), u(공격 진행 0~1), st(상태) }
  T.motion = (k, lift, strong) => {
    const t = k.t || 0, u = k.u || 0;
    let ox = 0, oy = 0, rot = 0, sx = 1, sy = 1;
    const br = Math.sin(t * 0.06);
    oy = -br * (lift ? 5 : 1.2); sy = 1 + br * 0.012; sx = 1 - br * 0.008;
    if (k.a === 'walk' || k.a === 'run') {
      const w = Math.sin(t * 0.26);
      oy -= Math.abs(w) * (lift ? 3 : 5); rot += w * 0.018; sy *= 1 + Math.abs(w) * 0.01;
    }
    if (k.act === 'roar') {
      const e = Math.sin(Math.min(1, u) * Math.PI);
      sx *= 1 + e * 0.06; sy *= 1 + e * 0.06; rot += Math.sin(t * 1.4) * 0.012 * e; ox -= e * 6;
    } else if (k.act) {
      const m = strong ? 1.25 : 1;
      if (u < 0.4) { const e = u / 0.4; rot -= 0.09 * e * m; sy *= 1 - 0.05 * e; sx *= 1 + 0.03 * e; ox -= 10 * e * m; }
      else if (u < 0.66) { const e = (u - 0.4) / 0.26; rot += (-0.09 + 0.27 * e) * m; ox += (-10 + 48 * e) * m; sy *= 0.95 + 0.04 * e; sx *= 1.03 - 0.03 * e; }
      else { const e = Math.min(1, (u - 0.66) / 0.34); rot += 0.18 * (1 - e) * m; ox += 38 * (1 - e) * m; }
    }
    if (k.st === 'hurt') { rot -= 0.07; ox -= 6; sx *= 1.03; sy *= 0.97; }
    else if (k.st === 'break') { rot += 0.06 + Math.sin(t * 0.5) * 0.01; sy *= 0.96; }
    return { ox, oy, rot, sx, sy };
  };

  // 한 장 그리기 : 발 중앙(0,0) 기준, 위로 H 높이
  //   o : { H, maxW, dir(그림이 보는 쪽 -1 왼쪽/ 1 오른쪽), lift, cy(날아다니는 몸의 중심 높이), flash, rage }
  T.paint = (ctx, s, o, k, mo) => {
    const sc = Math.min(o.H / s.h, (o.maxW || 1e9) / s.w), w = s.w * sc, h = s.h * sc;
    ctx.save();
    ctx.translate(mo.ox, -(o.lift || 0) + mo.oy);
    if (o.cy != null) ctx.translate(0, -o.cy + h * 0.5);       // 날아다니는 몹 : 몸 중심을 기준으로 놓는다
    ctx.rotate(mo.rot); ctx.scale(mo.sx * (o.dir || -1), mo.sy);
    const y0 = o.cy != null ? -h : -h + 3;
    ctx.drawImage(s.img, -w / 2, y0, w, h);
    if (o.flash) { const g = ctx.globalAlpha; ctx.globalAlpha = g * 0.82; ctx.drawImage(T.sil(s, '#ffffff'), -w / 2, y0, w, h); ctx.globalAlpha = g; }
    else if (o.rage) {
      const g = ctx.globalAlpha, g2 = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = g * (0.16 + 0.1 * Math.sin((k.t || 0) * 0.2));
      ctx.drawImage(T.sil(s, '#ff3a1e'), -w / 2, y0, w, h);
      ctx.globalCompositeOperation = g2; ctx.globalAlpha = g;
    }
    ctx.restore();
  };

  // ---------- 보스 ----------
  // body : CREATURES 종류   o : { hs(몸높이 비율), mw(최대폭 비율), dir, lift, strong }
  T.boss = (body, o = {}) => {
    const C = CREATURES[body]; if (!C) return;
    const old = C.draw, sp = T.get('boss/' + body);
    C.draw = function (ctx, b, P, k) {
      if (!sp.ok) return old.call(this, ctx, b, P, k);
      const H = C.h * (o.hs || 0.95);
      const mo = T.motion(k, o.lift, o.strong);
      T.paint(ctx, sp, { H, maxW: C.h * (o.mw || 1.45), dir: o.dir || -1, lift: o.lift, flash: P === b.fpal, rage: k.en }, k, mo);
    };
    C.art = 'img';
  };

  // ---------- 몹 (CMob) ----------
  // o : { H, dir, cy(날아다니는 높이) , hs }
  T.mob = (id, file, o = {}) => {
    const M = MOBS[id]; if (!M) return;
    const old = M.draw, sp = T.get('mob/' + file);
    M.draw = function (ctx, m, P, k) {
      if (!sp.ok) return old.call(this, ctx, m, P, k);
      const a = m.act, kk = { t: k.t, a: k.a, act: k.act, u: a && a.len ? clamp(k.af / a.len, 0, 1) : 0, st: k.st };
      const fly = o.cy != null, mo = T.motion(kk, fly, false);
      let cy = o.cy;
      if (fly) { cy += Math.sin(k.t * 0.07 + (m.id || 0)) * 8; if (k.act === 'swoop' && k.af > 12 && k.af < 26) cy -= 70; }
      T.paint(ctx, sp, { H: o.H, maxW: o.maxW, dir: o.dir || -1, cy, flash: P === m.fpal }, kk, mo);
    };
    M.art = 'img';
  };

  // ---------- 리그 몹 (고블린 · 오크 · 술사) ----------
  // 리그의 draw 를 그림 한 장으로 바꾼다. 관절(J)·판정은 그대로 계산된다.
  T.rig = (R, file, o = {}) => {
    const old = R.draw, map = typeof file === 'string' ? { _: file } : file, sps = {};
    for (const k in map) sps[k] = T.get('mob/' + map[k]);
    R.draw = function (ctx, J, pal, ent, opt) {
      const sp = ent && (sps[ent.kind] || sps._);
      if (!sp || !sp.ok) return old.call(this, ctx, J, pal, ent, opt);
      const st = ent.state, a = ent.act;
      const mv = Math.abs(ent.vx || 0) + Math.abs(ent.vy || 0);
      const kk = { t: (typeof Game !== 'undefined' ? Game.time : 0) + (ent.id || 0) * 13, a: mv > 0.6 && st !== 'attack' ? 'walk' : 'idle', act: st === 'attack' && a ? a.name : null, u: st === 'attack' && a && a.len ? clamp(ent.af / a.len, 0, 1) : 0, st };
      const mo = T.motion(kk, false, false);
      const H = (ent.h || 92) / (ent.scale || 1) * (o.hs || 1.04);
      ctx.save();
      const lying = st === 'down' || (st === 'dying' && ent.z < 5 && ent.stT > 5);
      if (lying) { ctx.translate(0, -6); ctx.rotate(-1.35); ctx.translate(H * 0.25, 0); }
      else if (st === 'air' || st === 'dying') ctx.rotate(-0.35);
      T.paint(ctx, sp, { H, maxW: H * 1.25, dir: o.dir || -1, flash: !!opt.flash }, kk, mo);
      ctx.restore();
    };
    R.art = 'img';
  };

  return T;
})();

// ---- 보스 : 그림이 있는 것만 바꾼다 (없는 보스는 코드 그림 그대로) ----
IA.boss('wyrm', { dir: -1 });
IA.boss('golem', { dir: -1, strong: true });
IA.boss('toad', { dir: -1 });
IA.boss('spider', { dir: -1 });
IA.boss('seraph', { dir: -1, lift: 22 });
IA.boss('furnace', { dir: -1, strong: true });
IA.boss('dragon', { dir: -1, mw: 1.55 });
IA.boss('vampire', { dir: -1 });
IA.boss('maw', { dir: -1 });
IA.boss('crystal', { dir: -1, lift: 30 });
IA.boss('oni', { dir: -1 });
IA.boss('clock', { dir: -1 });
IA.boss('cosmic', { dir: -1, lift: 18 });
IA.boss('chaos', { dir: -1 });

// ---- 몹 ----
IA.mob('wolf', 'wolf', { H: 84, maxW: 150 });
IA.mob('mushroom', 'mushroom', { H: 76, maxW: 110 });
IA.mob('slime', 'slime', { H: 70, maxW: 120 });
IA.mob('slimelet', 'slime', { H: 42, maxW: 72 });
IA.mob('yeti', 'yeti', { H: 176, maxW: 190 });
IA.mob('bat', 'bat', { H: 74, maxW: 110, cy: 125 });
IA.mob('aegis', 'aegis', { H: 158, maxW: 160 });
IA.mob('rat', 'rat', { H: 46, maxW: 80 });
IA.mob('mummy', 'mummy', { H: 138, maxW: 130 });
IA.mob('drone', 'drone', { H: 52, maxW: 96, cy: 140, dir: 1 });
IA.mob('imp', 'imp', { H: 90, maxW: 110, cy: 100 });
IA.mob('pod', 'pod', { H: 100, maxW: 76 });
IA.mob('wisp', 'wisp', { H: 96, maxW: 90, cy: 90 });

// ---- 리그 몹 ----
IA.rig(RIG_GOBLIN, { goblin: 'goblin', thrower: 'thrower' }, { dir: -1 });
IA.rig(RIG_ORC, 'orc', { dir: -1, hs: 1.02 });
IA.rig(RIG_MAGE, 'mage', { dir: -1 });
