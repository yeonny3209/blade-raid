'use strict';
// ============================================================
//  게임 루프 / 씬 관리 / 카메라 / 연출
// ============================================================
const Game = {
  canvas: null, ctx: null, ps: 1, bgScale: 1.5,
  state: 'title', frame: 0, time: 0,
  player: null, enemies: [], projectiles: [], pickups: [], room: null, roomIdx: 0, boss: null,
  cam: { x: 0 }, camLook: 0, shakeA: 0, shx: 0, shy: 0, zoom: 1, kickX: 0, kickY: 0, freezeT: 0, rumbleT: 0,
  slowScale: 1, slowMs: 0, dim: 0, dimTarget: 0, dimSpeed: 0.05,
  flash: 0, flashCol: '255,255,255', hurtA: 0, speedT: 0, speedDir: 1,
  combo: { n: 0, t: 0, dmg: 0, pop: 0 },
  stats: null, target: null, targetT: 0, tokenMax: 2,
  notices: [], big: null, cutin: null, fade: 0, fadeDir: 0,
  debug: false, debugBoxes: [], coins: 3, bgCache: {}, dungeon: null,

  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    addEventListener('resize', () => this.resize());
    Input.init();
    UI.init();
    Touch.init();
    Save.load();
    this.bgScale = clamp(this.ps, 1, IS_MOBILE ? 1 : 2);
    this.stats = this.newStats();
    this.dungeon = buildDungeon(DUNGEONS[0]);
    this.titleRoom = new Room(0);
    const tp = this.titleP = new Player();
    tp.scale = 2.5; tp.x = 930; tp.y = 600 - GROUND_Y; tp.facing = -1;
    tp.play('idle', 0);
    const start = () => {
      this.last = performance.now(); this.acc = 0;
      requestAnimationFrame(t => this.loop(t));
    };
    if (document.fonts && document.fonts.load) {
      Promise.race([
        Promise.all([document.fonts.load(`40px 'Black Han Sans'`), document.fonts.load(`700 16px 'Noto Sans KR'`)]),
        new Promise(r => setTimeout(r, 1500)),
      ]).then(start, start);
    } else start();
  },

  resize() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    const dpr = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
    this.canvas.style.width = Math.floor(W * s) + 'px';
    this.canvas.style.height = Math.floor(H * s) + 'px';
    this.canvas.width = Math.round(W * s * dpr);
    this.canvas.height = Math.round(H * s * dpr);
    this.ps = this.canvas.width / W;
  },

  newStats() { return { time: 0, maxCombo: 0, hitsTaken: 0, kills: 0, gold: 0, dmg: 0, skills: 0 }; },

  // ---------------- 루프 ----------------
  loop(ts) {
    requestAnimationFrame(t => this.loop(t));
    const dt = Math.min(100, ts - this.last); this.last = ts;
    if (this.slowMs > 0) { this.slowMs -= dt; if (this.slowMs <= 0) this.slowScale = 1; }
    const sc = this.slowMs > 0 ? lerp(this.slowScale, 1, clamp(1 - this.slowMs / 300, 0, 1) * (this.slowMs < 300 ? 1 : 0)) : 1;
    this.acc += dt * sc;
    const step = 1000 / 60;
    let n = 0;
    while (this.acc >= step && n < 4) { this.update(); this.acc -= step; n++; }
    if (n >= 4) this.acc = 0;
    // 실시간 연출 감쇠
    const k = dt / step;
    this.flash *= Math.pow(0.86, k);
    this.hurtA *= Math.pow(0.9, k);
    this.render();
    Music.update();
  },

  update() {
    this.frame++; this.time++;
    if (Input.take('mute')) Sfx.toggleMute();
    if (Input.take('debug')) this.debug = !this.debug;
    switch (this.state) {
      case 'title': this.updateTitle(); break;
      case 'lobby': Lobby.update(); break;
      case 'paused': if (Input.take('pause')) { this.state = this.pausedFrom; Sfx.play('ui'); } Input.queue = Input.queue.filter(q => q.a === 'pause'); break;
      case 'result': this.resT++; if (this.resT > 100 && (Input.take('confirm') || Input.take('attack'))) { Sfx.play('select'); this.toLobby(); } Input.clear(); break;
      case 'gameover': if (Input.take('confirm') || Input.take('attack')) { Sfx.play('select'); this.coins = 3; this.toLobby(); } Input.clear(); break;
      case 'continue': this.updateContinue(); break;
      default:
        if (Input.take('pause') && !this.cutin && this.state === 'play') { this.pausedFrom = this.state; this.state = 'paused'; Sfx.play('ui'); return; }
        this.updateWorld();
    }
  },

  updateTitle() {
    const tp = this.titleP;
    tp.px = tp.x; tp.pz = tp.z;
    tp.stepAnim(); tp.updateChains();
    tp.bladeGlow = 0.5 + Math.sin(this.time * 0.05) * 0.3;
    this.titleRoom.updateAmbient();
    if (Input.queue.length) {
      Input.clear();
      Sfx.init();
      Sfx.play('select');
      this.coins = 3;
      this.toLobby();
    }
  },

  // 로비로 (던전 선택 화면)
  toLobby() {
    this.state = 'lobby';
    if (!this.player) this.player = new Player();
    this.enemies = []; this.projectiles = []; this.pickups = [];
    this.boss = null; this.target = null; this.cutin = null; this.clearSeq = null;
    this.fade = 0; this.fadeDir = 0; this.dim = 0; this.dimTarget = 0; this.zoom = 1;
    this.hurtA = 0; this.flash = 0; this.speedT = 0; this.kickX = 0; this.kickY = 0; this.freezeT = 0;
    FX.clear(); Touch.release(); Input.clear();
    Lobby.enter();
  },

  startDungeon(id) {
    const d = DUNGEON_BY_ID[id] || DUNGEONS[0];
    this.dungeon = buildDungeon(d);
    this.bgCache = {};                      // 던전마다 배경이 다르므로 캐시 초기화
    this.stats = this.newStats();
    this.player = new Player();
    this.combo = { n: 0, t: 0, dmg: 0, pop: 0 };
    this.coins = 3;
    this.loadRoom(0);
  },

  loadRoom(i) {
    this.roomIdx = i;
    this.room = new Room(i);
    this.enemies = []; this.projectiles = []; this.pickups = [];
    FX.clear();
    this.boss = null; this.target = null; this.targetT = 0; this.cutin = null;
    this.player.reset(110, DEPTH / 2);
    Touch.release();
    this.cam.x = 0; this.dim = 0; this.dimTarget = 0; this.zoom = 1; this.hurtA = 0; this.flash = 0; this.speedT = 0; this.kickX = 0; this.kickY = 0; this.freezeT = 0;
    this.tokenMax = i >= 2 ? 3 : 2;
    this.room.spawnWave(0, true);
    this.fade = 1; this.fadeDir = -1;
    if (this.room.def.boss) {
      this.boss = this.enemies.find(e => e.isBoss);
      this.state = 'intro'; this.introT = 0;
      this.player.setState('cine');
      Music.stop();
    } else {
      this.state = 'play';
      Music.play('dungeon');
    }
    this.clearSeq = null;
  },

  // ---------------- 월드 ----------------
  updateWorld() {
    this.debugBoxes.length = 0;
    // 페이드
    if (this.fadeDir) {
      this.fade = clamp(this.fade + this.fadeDir * 0.045, 0, 1);
      if (this.fadeDir > 0 && this.fade >= 1) { this.fadeDir = 0; this.loadRoom(this.roomIdx + 1); return; }
      if (this.fadeDir < 0 && this.fade <= 0) this.fadeDir = 0;
    }
    if (this.cutin) {
      this.cutin.t++;
      if (this.cutin.t >= this.cutin.dur) this.cutin = null;
      return;
    }
    if (this.state === 'intro') this.updateIntro();
    if (this.state === 'play' && !this.clearSeq) this.stats.time++;

    const p = this.player;
    if (this.freezeT > 0) {
      this.freezeT--;                 // 강타 순간 : 세상이 멈추고 이펙트만 살아있음
    } else {
      p.update();
      for (const e of this.enemies) e.update();
      this.enemies = this.enemies.filter(e => !e.dead);
      this.projectiles = this.projectiles.filter(pr => pr.update() !== false);
      this.pickups = this.pickups.filter(it => it.update(p) !== false);
      this.room.update();
    }
    FX.update();

    // 콤보
    if (this.combo.t > 0) { this.combo.t--; if (this.combo.t <= 0) { this.combo.n = 0; this.combo.dmg = 0; } }
    if (this.targetT > 0) this.targetT--;
    // 알림
    for (const n of this.notices) n.t++;
    this.notices = this.notices.filter(n => n.t < n.life);
    if (this.big) { this.big.t++; if (this.big.t >= this.big.life) this.big = null; }
    // 연출 값
    this.dim = approach(this.dim, this.dimTarget, this.dimSpeed);
    this.shakeA *= 0.85; if (this.shakeA < 0.2) this.shakeA = 0;
    this.kickX *= 0.78; this.kickY *= 0.78;
    this.shx = (Math.random() - 0.5) * 2 * this.shakeA + this.kickX;
    this.shy = (Math.random() - 0.5) * 1.4 * this.shakeA + this.kickY;
    this.zoom = lerp(this.zoom, 1, 0.07);
    if (this.speedT > 0) this.speedT--;
    this.updateCamera();

    // 방 이동
    const r = this.room;
    if (r.cleared && !r.def.boss && p.x > r.width - 80 && this.fadeDir === 0 && this.state === 'play' && p.hp > 0) {
      this.fadeDir = 1; this.state = 'transition'; p.setState('cine'); p.vx = 5; p.play('run', 4);
      Sfx.play('door');
    }
    if (this.state === 'transition') { p.vx = 5; p.play('run', 4); }

    // 사망 처리
    if (this.deadT !== undefined && this.deadT >= 0) {
      this.deadT++;
      if (this.deadT > 70) { this.deadT = -1; this.state = 'continue'; this.cont = { t: 600 }; }
    }
    // 클리어 연출
    if (this.clearSeq) {
      const c = this.clearSeq; c.t++;
      if (c.t === 110) {
        this.bigText('DUNGEON CLEAR', '#fff8d0', '#ffb020', 320, 64);
        Sfx.play('clear'); Music.play('clear');
        if (p.hp > 0) { if (p.act) p.endAct(); p.setState('cine'); p.play('win', 6, 1, true); p.bladeGlow = 1; }
        for (const it of this.pickups) it.magnet = true;
      }
      if (c.t === 300) this.showResult();
    }
  },

  updateCamera() {
    const p = this.player, r = this.room;
    let tx;
    if (this.state === 'intro' && this.introT < 175 && this.boss) tx = this.boss.x - W / 2 + 60;
    else {
      this.camLook = lerp(this.camLook, p.facing * 80, 0.03);
      tx = p.x - W / 2 + this.camLook;
    }
    tx = clamp(tx, 0, Math.max(0, r.width - W));
    this.cam.x = lerp(this.cam.x, tx, this.state === 'intro' ? 0.05 : 0.12);
  },

  updateIntro() {
    const t = ++this.introT, b = this.boss, p = this.player;
    if (t === 60) { b.play('roar', 6, 1, true); }
    if (t === 74) { Sfx.play('roar', 1.4, 0.9); this.addShake(16); FX.add('ground', new Ring(b.x, sy(b.y, 0), 30, 500, 40, { col: '255,80,40', w: 20 })); }
    if (t > 74 && t < 130 && t % 5 === 0) this.addShake(5);
    if (t === 150) b.play('idle', 10, 1, true);
    if (t >= 205) {
      this.state = 'play'; b.setState('idle'); b.aiWait = 30;
      p.setState('ground');
      Music.play('boss');
    }
  },

  updateContinue() {
    const c = this.cont;
    c.t--;
    if ((Input.take('attack') || Input.take('confirm')) && this.coins > 0) {
      this.coins--; this.state = 'play'; this.player.revive(); Input.clear(); return;
    }
    Input.clear();
    if (c.t <= 0 || this.coins <= 0 && c.t < 480) { this.state = 'gameover'; Music.stop(); }
  },

  // ---------------- 전투 이벤트 ----------------
  tokensUsed() { let n = 0; for (const e of this.enemies) if (e.hasToken) n++; return n; },
  takeToken(e) {
    if (e.hasToken) return true;
    if (this.tokensUsed() < this.tokenMax) { e.hasToken = true; return true; }
    return false;
  },
  releaseToken(e) { e.hasToken = false; },

  setTarget(e) { this.target = e; this.targetT = 200; },

  onPlayerHit(dmg, tgt) {
    const c = this.combo;
    c.n++; c.t = 150; c.dmg += dmg; c.pop = 1;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, c.n);
    this.stats.dmg += dmg;
  },
  onPlayerDamaged() {
    this.stats.hitsTaken++;
    this.hurtA = 1;
    this.combo.t = Math.min(this.combo.t, 40);
  },
  onPlayerDead() { this.deadT = 0; Music.stop(); },

  onEnemyKilled(e) {
    this.stats.kills++;
    const n = randi(e.gold[0], e.gold[1]);
    for (let i = 0; i < n; i++) this.pickups.push(new Pickup('gold', e.x, e.y, e.z + 40 * e.scale, randi(40, 120) * (e.elite ? 2 : 1) * (e.isBoss ? 5 : 1)));
    if (chance(e.elite ? 0.5 : 0.12)) this.pickups.push(new Pickup('hp', e.x, e.y, e.z + 40, 0));
    const r = this.room;
    const others = this.enemies.some(o => o !== e && !o.dying && !o.dead);
    if (!others && !e.isBoss && r.wave >= r.def.waves.length - 1) {
      this.slowmo(0.25, 50); this.zoomPunch(1.06);
      this.flashScreen(0.25, '255,255,255');
    }
  },

  onBossKilled(b) {
    this.slowmo(0.12, 140); this.zoomPunch(1.14); this.flashScreen(1, '255,255,255');
    this.addShake(20);
    Sfx.play('explode', 1.2, 0.8); Sfx.play('roar', 0.8, 0.7);
    Music.stop();
    for (const e of this.enemies) if (!e.isBoss && !e.dying) e.die({ kx: 5, kz: 8 }, sign(e.x - b.x));
    this.clearSeq = { t: 0 };
    for (let i = 0; i < 4; i++) this.pickups.push(new Pickup('hp', b.x, b.y, 80, 0));
  },

  onRoomClear() {
    if (this.room.def.boss) return;
    Sfx.play('clear', 0.6);
    this.bigText('ROOM CLEAR', '#e8f6ff', '#4ac2ff', 250, 46);
    for (const it of this.pickups) it.magnet = true;
    const p = this.player;
    if (p.hp > 0) { p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.1); p.mp = Math.min(p.mpMax, p.mp + p.mpMax * 0.2); }
  },

  showResult() {
    const s = this.stats, sec = s.time / 60 | 0;
    const dun = this.dungeon.def;
    let score = 0;
    score += clamp(100 - Math.max(0, sec - 180) / 3, 20, 100) * 40;
    score += Math.min(s.maxCombo, 150) * 20;
    score += Math.max(0, 40 - s.hitsTaken) * 50;
    score += s.kills * 30;
    const rank = score >= 9000 ? 'SSS' : score >= 7800 ? 'SS' : score >= 6500 ? 'S' : score >= 5000 ? 'A' : score >= 3500 ? 'B' : 'C';
    this.result = {
      timeStr: `${String(sec / 60 | 0).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`,
      maxCombo: s.maxCombo, kills: s.kills, hits: s.hitsTaken, dmg: s.dmg, gold: s.gold, score: Math.round(score * 10), rank,
    };
    this.result.dungeon = dun.name;
    Save.record(dun.id, rank, this.result.score, s.gold);
    this.result.unlockedNew = Save.data.unlocked;
    this.state = 'result'; this.resT = 0;
    Input.clear();
  },

  // ---------------- 연출 API ----------------
  addShake(a) { this.shakeA = Math.min(24, Math.max(this.shakeA, a) + a * 0.25); },
  // 타격 방향으로 카메라가 한 번 밀렸다 돌아옴 (무작위 흔들림과 달리 방향이 읽힘)
  kick(x, y) { this.kickX = clamp(this.kickX + x, -16, 16); this.kickY = clamp(this.kickY + y, -10, 10); },
  freeze(f) { this.freezeT = Math.max(this.freezeT, f); },
  rumble(strength, ms) {
    const now = performance.now();
    if (now - this.rumbleT < 40) return;
    this.rumbleT = now;
    try {
      const gp = navigator.getGamepads && navigator.getGamepads()[0];
      const act = gp && (gp.vibrationActuator || (gp.hapticActuators && gp.hapticActuators[0]));
      if (act && act.playEffect) act.playEffect('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.5 }).catch(() => {});
    } catch (e) { }
  },
  slowmo(scale, frames) { this.slowScale = Math.min(this.slowMs > 0 ? this.slowScale : 1, scale); this.slowMs = Math.max(this.slowMs, frames * 16.7); },
  zoomPunch(z) { this.zoom = Math.max(this.zoom, z); },
  flashScreen(a, col) { this.flash = Math.max(this.flash, a); this.flashCol = col || '255,255,255'; },
  dimTo(v, frames) { this.dimTarget = v; this.dimSpeed = Math.max(0.01, Math.abs(v - this.dim) / Math.max(1, frames)); },
  speedLines(dir, frames) { this.speedDir = dir; this.speedT = frames; },
  notice(text) {
    if (this.notices.some(n => n.text === text && n.t < 30)) return;
    this.notices = this.notices.filter(n => n.text !== text);
    this.notices.push({ text, t: 0, life: 70 });
  },
  bigText(text, c1, c2, y = 250, size = 72) { this.big = { text, c1, c2, t: 0, life: 110, y, size }; },
  startCutin() { this.cutin = { t: 0, dur: 84 }; Sfx.play('cutin'); },

  // ---------------- 렌더 ----------------
  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.ps, 0, 0, this.ps, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (this.state === 'title') { UI.drawTitle(ctx); return; }
    if (this.state === 'lobby') { Lobby.draw(ctx); Touch.draw(ctx); if (Touch.on && innerHeight > innerWidth) Touch.drawRotate(ctx); return; }
    const r = this.room, p = this.player, camX = Math.round(this.cam.x * 2) / 2;

    ctx.save();
    // 줌 (플레이어 중심)
    if (this.zoom > 1.001) {
      const fx = clamp(p.x - camX, 200, W - 200), fy = clamp(sy(p.y, p.z) - 60, 200, H - 200);
      ctx.translate(fx, fy); ctx.scale(this.zoom, this.zoom); ctx.translate(-fx, -fy);
    }
    ctx.translate(this.shx, this.shy);
    r.drawBack(ctx, camX);
    if (this.dim > 0.01) { ctx.fillStyle = `rgba(0,0,0,${this.dim})`; ctx.fillRect(-40, -40, W + 80, H + 80); }

    ctx.save();
    ctx.translate(-camX, 0);
    FX.draw(ctx, 'ground');
    r.drawDoor(ctx);
    // 그림자
    p.drawShadow(ctx);
    for (const e of this.enemies) e.drawShadow(ctx);
    for (const pr of this.projectiles) pr.drawShadow(ctx);
    // 깊이 정렬
    const list = [p, ...this.enemies, ...this.projectiles, ...this.pickups];
    list.sort((a, b) => (a.y - b.y) || ((a.isPlayer ? 1 : 0) - (b.isPlayer ? 1 : 0)));
    for (const o of list) o.draw(ctx);
    for (const e of this.enemies) if (e.trail.length) e.drawTrail(ctx);
    p.drawTrail(ctx);
    FX.draw(ctx, 'world');
    r.drawAmbient(ctx);
    FX.draw(ctx, 'top');
    if (this.debug) this.drawDebug(ctx);
    ctx.restore();

    r.drawFront(ctx, camX);
    ctx.restore();

    // 화면 효과
    if (this.speedT > 0) this.drawSpeedLines(ctx);
    ctx.drawImage(UI.vignette, 0, 0);
    if (p.hp > 0 && p.hp / p.hpMax < 0.25) { ctx.globalAlpha = 0.25 + Math.sin(this.time * 0.12) * 0.15; ctx.drawImage(UI.hurtVig, 0, 0); ctx.globalAlpha = 1; }
    if (this.hurtA > 0.02) { ctx.globalAlpha = this.hurtA * 0.8; ctx.drawImage(UI.hurtVig, 0, 0); ctx.globalAlpha = 1; }
    if (this.flash > 0.01) { ctx.fillStyle = `rgba(${this.flashCol},${Math.min(1, this.flash)})`; ctx.fillRect(0, 0, W, H); }

    // UI
    if (this.state === 'intro') UI.drawBossIntro(ctx, this.introT);
    if (this.state !== 'intro' && this.state !== 'result' && !this.cutin) UI.drawHUD(ctx);
    UI.drawNotices(ctx);
    if (this.cutin) UI.drawCutin(ctx, this.cutin);
    if (this.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    if (this.state === 'paused') UI.drawPause(ctx);
    if (this.state === 'result') UI.drawResult(ctx);
    if (this.state === 'continue') UI.drawContinue(ctx);
    if (this.state === 'gameover') UI.drawGameOver(ctx);
    if (Sfx.muted) UI.text(ctx, '음소거', W - 20, 104, { size: 13, align: 'right', fill: '#aaa', stroke: 3 });
    Touch.draw(ctx);
    if (Touch.on && innerHeight > innerWidth) Touch.drawRotate(ctx);
  },

  drawSpeedLines(ctx) {
    const a = Math.min(1, this.speedT / 10);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) {
      const y = rand(80, H - 100), len = rand(120, 380), x = this.speedDir > 0 ? rand(-100, W * 0.35) : rand(W * 0.65, W + 100);
      ctx.fillStyle = `rgba(200,230,255,${rand(0.05, 0.22) * a})`;
      ctx.fillRect(x, y, len * (this.speedDir > 0 ? 1 : -1), rand(1, 2.5));
    }
    ctx.restore();
  },

  drawDebug(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,0,0,0.9)'; ctx.lineWidth = 1;
    for (const b of this.debugBoxes) ctx.strokeRect(b.x0, sy(b.y0, b.z1), b.x1 - b.x0, (b.z1 - b.z0));
    ctx.strokeStyle = 'rgba(0,255,0,0.8)';
    for (const e of [this.player, ...this.enemies]) ctx.strokeRect(e.x - e.w, sy(e.y, e.z + e.hurtH()), e.w * 2, e.hurtH());
    ctx.restore();
    UI.text(ctx, `enemies ${this.enemies.length}  fx ${FX.world.length + FX.ground.length + FX.top.length}`, this.cam.x + 20, 120, { size: 14, stroke: 3 });
  },
};

window.addEventListener('load', () => Game.init());
