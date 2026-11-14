// BLADE RAID promo v3 : director core (takeover / world render / pilot / stepping / upload / scout)
(() => {
  'use strict';
  const V = window.__V = window.__V || {};
  V.ver = 3; V.FW = 1920; V.FH = 1080; V.FPS = 60; V.FPB = 24; V.TOTAL = 1800;
  V.bf = k => Math.round(k * V.FPB);
  V.HOST = 'http://127.0.0.1:8766';
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  V.lerp = lerp; V.clamp = clamp;
  V.mul = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  V.E = { out3: t => 1 - Math.pow(1 - t, 3), out5: t => 1 - Math.pow(1 - t, 5), in2: t => t * t, in3: t => t * t * t, io: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, back: t => { const c = 2.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, elastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2.0944) + 1 };
  V.sat = t => clamp(t, 0, 1);

  // ---------- 게임 장악 : 루프 정지 / 저장 차단 / 음소거 / 실제 입력 차단 ----------
  V.takeover = () => {
    if (V.taken) return 'already';
    V.taken = true;
    Game.loop = () => {};
    Game.resize = () => {};
    Save.save = () => {};
    Sfx.muted = true; try { if (Sfx.master) Sfx.master.gain.value = 0; } catch (e) {}
    try { Music.stop(); } catch (e) {}
    Music.play = () => {}; Music.update = () => {};
    for (const t of ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'wheel', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'contextmenu'])
      window.addEventListener(t, e => { e.stopImmediatePropagation(); e.preventDefault && t !== 'wheel' && t !== 'touchmove' && e.cancelable && e.preventDefault(); }, true);
    const b = document.createElement('div');
    b.textContent = '🎬 홍보 영상 촬영 중 — 이 화면은 건드리지 말아 주세요';
    b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#b3261e;color:#fff;font:700 22px sans-serif;text-align:center;padding:14px';
    document.body.appendChild(b); V.banner = b;
    const dl = document.getElementById('dlbar'); if (dl) dl.style.display = 'none';
    Game.updateDlBar = () => {};
    V.setRes(1.5);
    return 'ok';
  };
  V.setRes = s => { Game.canvas.width = Math.round(W * s); Game.canvas.height = Math.round(H * s); Game.ps = s; };
  V.prep = () => {
    const d = Save.data;
    d.lv = 100; d.xp = 0; d.tree = {}; for (const n of TREE) while (Prog.check(n).ok) Prog.learn(n);
    d.gold = 9e8; d.owned = { w: WEAPONS.map(w => w.id), a: ARMORS.map(a => a.id) };
    d.cleared = Object.fromEntries(DUNGEONS.map(x => [x.id, 1])); d.unlocked = 20; d.nick = ''; d.diff = 'normal';
  };

  // ---------- 입력 대행 ----------
  V.cast = k => Input.queue.push({ a: k, t: performance.now() });
  V.pilot = (o = {}) => {
    const p = Game.player; if (!p || p.hp <= 0) return;
    p.invul = Math.max(p.invul, 60); p.hp = p.hpMax; p.mp = p.mpMax;
    if (!Input.held) Input.held = {};
    Input.held.left = Input.held.right = Input.held.up = Input.held.down = false;
    if (Game.state !== 'play' || o.idle) return;
    const t = Game.enemies.filter(e => e.hittable()).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (!t) return;
    const dx = t.x - p.x, dy = t.y - p.y, close = o.close || 95;
    if (Math.abs(dx) > close) { if (dx > 0) Input.held.right = true; else Input.held.left = true; }
    if (Math.abs(dy) > 22) { if (dy > 0) Input.held.down = true; else Input.held.up = true; }
    if (!o.noAtk && Math.abs(dx) < close * 1.7 && (V.gt % 8) < 1) V.cast('attack');
  };
  V.kinds = dun => { const d = DUNGEON_BY_ID[dun]; const k = (d && d.pool || []).map(x => Array.isArray(x) ? x[0] : String(x).split(',')[0]).filter(x => ENEMY_TYPES[x]); return k.length ? k : ['goblin', 'orc', 'wolf', 'skeleton']; };
  V.spawn = (kind, x, y, tank) => { const e = makeEnemy(kind, x, y); e.spawnIn(0); if (tank) { e.hpMax *= tank; e.hp = e.hpMax; } Game.enemies.push(e); return e; };
  // 화면에 적이 n 마리가 되도록 채운다 (플레이어 앞쪽)
  V.fill = (n, o = {}) => {
    const p = Game.player, kinds = o.kinds || V.curKinds || ['goblin', 'orc', 'wolf'], rng = V.rng;
    let alive = Game.enemies.filter(e => !e.dead && !e.dying && !e.isBoss).length;
    for (let i = 0; alive < n && i < 40; i++, alive++) {
      const side = o.both && rng() < 0.4 ? -1 : 1;
      const x = clamp(p.x + side * (140 + rng() * (o.spread || 420)), Game.room.minX + 20, Game.room.maxX - 20);
      const e = V.spawn(kinds[(rng() * kinds.length) | 0], x, clamp(p.y + (rng() - 0.5) * 150, 30, DEPTH - 30), o.tank || V.tank);
      e.aiWait = 20 + (rng() * 30 | 0);
    }
  };
  V.setup = (dun, w, a, o = {}) => {
    Save.data.eq = { w, a: a || 'a0' };
    Game.startDungeon(dun, o.from);
    if (o.last) Game.loadRoom(Game.dungeon.rooms.length - 1);
    for (let i = 0; i < 900 && Game.state !== 'play'; i++) { if (Game.state === 'intro' && !o.keepIntro) Game.introT += 4; if (o.keepIntro && Game.state === 'intro') break; Game.update(); }
    Game.fade = 0; Game.fadeDir = 0;
    const p = Game.player; p.mp = p.mpMax; p.hp = p.hpMax; Input.queue.length = 0;
    V.curKinds = V.kinds(dun); V.tank = o.tank || 0; V.boss = null;
    if (o.last || o.boss) {
      const b = Game.enemies.find(e => e.isBoss); V.boss = b;
      if (b && !o.keepIntro) { p.x = p.px = clamp(b.x - (o.gap || 430), Game.room.minX, Game.room.maxX); p.y = b.y; }
    } else {
      Game.enemies.length = 0;
      if (o.px) p.x = p.px = o.px;
      const n = o.n ?? 8, rng = V.rng, kinds = V.curKinds;
      for (let i = 0; i < n; i++) {
        const e = V.spawn(kinds[i % kinds.length], p.x + (o.x0 || 150) + i * (o.dx || 58) + rng() * 40, clamp(p.y + ((i % 3) - 1) * 50 + (rng() - 0.5) * 20, 30, DEPTH - 30), V.tank);
        e.aiWait = 40;
      }
    }
    Game.cam.x = clamp(p.x - (o.camOff || 360), 0, Math.max(0, Game.room.width - W));
    Game.shakeA = 0; Game.flash = 0; Game.zoom = 1;
  };

  // ---------- 시간 진행 (rate : 출력 1프레임당 게임 업데이트 수) ----------
  V.gt = 0; V.acc = 0;
  V.tick = () => { Game.update(); V.gt++; };
  V.adv = (rate = 1) => {
    V.acc += rate; let n = 0;
    while (V.acc >= 1 - 1e-6) { V.tick(); V.acc -= 1; n++; }
    Game.flash *= 0.86; Game.hurtA *= 0.9;
    return n;
  };
  V.skipCutin = () => { if (Game.cutin) Game.cutin = null; };

  // ---------- 월드 렌더 (자유 카메라, HUD 선택) ----------
  V.camS = { fx: 640, fy: 360, z: 1, roll: 0 };
  V.focusOf = on => {
    const G = Game, p = G.player, camX = Math.round(G.cam.x * 2) / 2;
    if (on && typeof on === 'object') return { x: on.x, y: on.y };
    const px = p.x - camX, py = sy(p.y, p.z) - 60;
    if (on === 'boss' && V.boss) return { x: V.boss.x - camX, y: sy(V.boss.y, V.boss.z) - (V.boss.h || 120) * 0.5 };
    if (on === 'mid') {
      const es = G.enemies.filter(e => !e.dead && e.x > camX - 40 && e.x < camX + W + 40);
      if (es.length) { let sx = 0, syy = 0; for (const e of es) { sx += e.x - camX; syy += sy(e.y, e.z) - 50; } return { x: (px + sx / es.length) / 2, y: (py + syy / es.length) / 2 }; }
    }
    if (on === 'center') return { x: W / 2, y: H / 2 };
    return { x: px, y: py };
  };
  V.camTo = (t, snap) => {
    const c = V.camS, f = V.focusOf(t.on);
    const tx = f.x + (t.ox || 0), ty = f.y + (t.oy || 0), k = snap ? 1 : (t.k || 0.14);
    c.fx = lerp(c.fx, tx, k); c.fy = lerp(c.fy, ty, k);
    c.z = snap ? (t.z || 1) : lerp(c.z, t.z || 1, t.kz || 0.2); c.roll = snap ? (t.roll || 0) : lerp(c.roll, t.roll || 0, 0.2);
  };
  V.world = (o = {}) => {
    const G = Game, ctx = G.ctx, r = G.room, p = G.player, camX = Math.round(G.cam.x * 2) / 2, c = V.camS;
    ctx.setTransform(G.ps, 0, 0, G.ps, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const roll = c.roll || 0, cs = Math.abs(Math.cos(roll)), sn = Math.abs(Math.sin(roll));
    const zmin = Math.max(cs + (W / H) * sn, (H / W) * sn + cs) * 1.012;
    const z = Math.max(zmin, c.z * G.zoom);
    const hw = (W * cs + H * sn) / (2 * z), hh = (W * sn + H * cs) / (2 * z);
    const fx = clamp(c.fx, hw + 14, W - hw - 14), fy = clamp(c.fy, hh + 10, H - hh - 10);
    V.view = { z, fx, fy, roll, camX };
    ctx.save();
    ctx.translate(W / 2, H / 2); if (roll) ctx.rotate(roll); ctx.scale(z, z); ctx.translate(-fx, -fy);
    ctx.translate(G.shx * (o.shk ?? 1), G.shy * (o.shk ?? 1));
    r.drawBack(ctx, camX);
    if (G.dim > 0.01) { ctx.fillStyle = `rgba(0,0,0,${G.dim})`; ctx.fillRect(-40, -40, W + 80, H + 80); }
    ctx.save();
    ctx.translate(-camX, 0);
    FX.draw(ctx, 'ground');
    if (!o.noDoor) r.drawDoor(ctx);
    p.drawShadow(ctx);
    for (const e of G.enemies) e.drawShadow(ctx);
    for (const pr of G.projectiles) pr.drawShadow(ctx);
    const list = [p, ...G.enemies, ...G.projectiles, ...G.pickups];
    list.sort((a, b) => (a.y - b.y) || ((a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0)));
    for (const e of list) e.draw(ctx);
    for (const e of G.enemies) if (e.trail.length) e.drawTrail(ctx);
    p.drawTrail(ctx);
    FX.draw(ctx, 'world');
    r.drawAmbient(ctx);
    FX.draw(ctx, 'top');
    ctx.restore();
    r.drawFront(ctx, camX);
    WS.overlay(ctx);
    ctx.restore();
    ctx.setTransform(G.ps, 0, 0, G.ps, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (G.speedT > 0) G.drawSpeedLines(ctx);
    if (o.hud) UI.drawHUD(ctx);
    else {
      if (o.bossBar && G.boss && !G.boss.dead && G.state !== 'intro') UI.drawBossBar(ctx, G.boss);
      if (o.combo) UI.drawCombo(ctx);
    }
    if (G.state === 'intro' && o.bossIntro) UI.drawBossIntro(ctx, G.introT);
    if (G.cutin && o.cutin !== false) UI.drawCutin(ctx, G.cutin);
    ctx.setTransform(G.ps, 0, 0, G.ps, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };
  // 월드 좌표 -> 최종 프레임(1920x1080) 좌표
  V.toScreen = (wx, wyScreen) => {
    const v = V.view; if (!v) return { x: 0, y: 0 };
    const x0 = wx - v.camX - v.fx, y0 = wyScreen - v.fy, cs = Math.cos(v.roll), sn = Math.sin(v.roll);
    return { x: (W / 2 + (x0 * cs - y0 * sn) * v.z) * 1.5, y: (H / 2 + (x0 * sn + y0 * cs) * v.z) * 1.5 };
  };

  // ---------- 업로드 ----------
  V.post = async (path, blob) => {
    for (let k = 0; k < 8; k++) {
      try { const r = await fetch(V.HOST + '/' + path, { method: 'POST', body: blob }); if (r.ok) return true; } catch (e) { await new Promise(r => setTimeout(r, 120 + k * 80)); }
    }
    throw new Error('upload failed ' + path);
  };
  V.blob = (cv, q = 0.92) => new Promise(res => cv.toBlob(res, 'image/jpeg', q));

  // ---------- 스카우트 : 스킬이 어떻게 보이는지 축소판 시트로 확인 ----------
  V.scout = async (items, o = {}) => {
    const cols = o.cols || 6, tw = 320, th = 180, per = o.per || 12, every = o.every || 25, first = o.first ?? 20;
    const rowsPer = Math.ceil(per / cols), lab = 26;
    const cv = document.createElement('canvas'); cv.width = cols * tw; cv.height = items.length * (rowsPer * th + lab);
    const g = cv.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, cv.height);
    const info = [];
    for (let ii = 0; ii < items.length; ii++) {
      const it = items[ii], y0 = ii * (rowsPer * th + lab);
      V.rng = V.mul(it.seed || 77); Math.random = V.mul((it.seed || 77) + 1000);
      V.gt = 0; V.acc = 0;
      V.setup(it.dun, it.w, it.a || 'a0', { last: it.last, n: it.n ?? 8, tank: it.tank ?? 60, gap: it.gap });
      for (let k = 0; k < (it.warm || 10); k++) { V.pilot({ idle: true }); V.tick(); }
      const keys = [].concat(it.key || 's6');
      V.cast(keys[0]);
      const ev = [];
      let done = 0, u = 0;
      const total = first + every * (per - 1);
      while (done < per) {
        if (it.keys2 && it.keys2[u]) V.cast(it.keys2[u]);
        V.pilot({ close: it.close || 110, noAtk: it.noAtk });
        V.tick(); V.skipCutin(); Game.flash *= 0.86; u++;
        if (!it.last && u % 30 === 0) V.fill(it.n ?? 8);
        if (Game.shakeA > 8 || Game.flash > 0.4 || Game.freezeT > 5) ev.push(u);
        if (u === first + every * done) {
          V.camTo({ on: 'center', z: 1 }, true); V.world({ combo: true, bossBar: true });
          const x = (done % cols) * tw, y = y0 + lab + Math.floor(done / cols) * th;
          g.drawImage(Game.canvas, x, y, tw, th);
          g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y, 52, 20); g.fillStyle = '#fff'; g.font = '700 15px sans-serif'; g.textBaseline = 'top'; g.fillText('u' + u, x + 4, y + 2);
          done++;
        }
        if (u > total + 5) break;
      }
      const wdef = WEAPON_BY_ID[it.w], sk = wdef.skills && wdef.skills[keys[0]];
      g.fillStyle = '#ffd24a'; g.font = '700 18px sans-serif'; g.textBaseline = 'top';
      g.fillText(`${it.w} ${wdef.name} · ${keys[0]} ${sk ? sk.name : ''} · ${it.dun}${it.last ? ' (boss)' : ''}   ev:${ev.filter((v, i) => i === 0 || v - ev[i - 1] > 3).slice(0, 14).join(',')}`, 8, y0 + 4);
      info.push([it.w, keys[0], sk && sk.name, it.dun]);
    }
    await V.post('scout/' + (o.name || 'sheet') + '.jpg', await V.blob(cv, 0.86));
    return info;
  };
})();
'core ok';
