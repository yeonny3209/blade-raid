'use strict';
// ============================================================
//  UI : HUD, 스킬 아이콘, 보스 HP, 콤보, 미니맵, 각종 화면
// ============================================================
const LINE_COLS = ['#d8322a', '#e8762a', '#e8c02a', '#74c83a', '#2ab4c8', '#3a6ae8', '#8a4ae8', '#d24ab8'];

const UI = {
  icons: {}, lagHp: new Map(), comboPop: 0,

  init() {
    for (const s of SKILLS) this.icons[s.icon] = this.makeIcon(s.icon);
    this.icons.hpPot = this.makeIcon('hpPot');
    this.icons.mpPot = this.makeIcon('mpPot');
    this.vignette = makeCanvas(W, H);
    const g = this.vignette.getContext('2d');
    const rg = g.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.48, H * 0.95);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.72)');
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    this.hurtVig = makeCanvas(W, H);
    const h = this.hurtVig.getContext('2d');
    const hg = h.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    hg.addColorStop(0, 'rgba(255,0,0,0)'); hg.addColorStop(1, 'rgba(220,0,0,0.75)');
    h.fillStyle = hg; h.fillRect(0, 0, W, H);
    this.pJ = { head: { x: 0, y: 0 }, headRot: 0 };
  },

  // 정적 그래픽 캐시 (2배 해상도)
  cache: {},
  cached(key, w, h, fn) {
    let c = this.cache[key];
    if (!c) {
      c = this.cache[key] = makeCanvas(w * 2, h * 2);
      const g = c.getContext('2d'); g.scale(2, 2); fn(g);
    }
    return c;
  },

  // ---------- 스킬 아이콘 ----------
  makeIcon(kind) {
    const S = 2, c = makeCanvas(48 * S, 48 * S), g = c.getContext('2d');
    g.scale(S, S);
    const bgc = {
      upper: ['#1d3a6a', '#0a1428'], rush: ['#1d4a6a', '#08182a'], triple: ['#3a2a6a', '#120a28'],
      draw: ['#20506a', '#061420'], quake: ['#6a4a1d', '#281808'], ult: ['#7a1414', '#200404'],
      hpPot: ['#3a1010', '#120404'], mpPot: ['#101a3a', '#040812'],
    }[kind];
    const gr = g.createLinearGradient(0, 0, 48, 48);
    gr.addColorStop(0, bgc[0]); gr.addColorStop(1, bgc[1]);
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    const rg = g.createRadialGradient(24, 24, 2, 24, 24, 30);
    rg.addColorStop(0, 'rgba(255,255,255,0.15)'); rg.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.fillStyle = rg; g.fillRect(0, 0, 48, 48);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const glowLine = (fn, col, w) => {
      g.strokeStyle = col.replace('A', '0.35'); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke();
      g.strokeStyle = col.replace('A', '1'); g.lineWidth = w; g.beginPath(); fn(); g.stroke();
      g.strokeStyle = '#ffffff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke();
    };
    const blue = 'rgba(120,200,255,A)', red = 'rgba(255,90,70,A)';
    if (kind === 'upper') {
      glowLine(() => { g.arc(30, 30, 18, Math.PI * 0.6, Math.PI * 1.55); }, blue, 3.5);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(28, 4); g.lineTo(38, 14); g.lineTo(25, 15); g.closePath(); g.fill();
    } else if (kind === 'rush') {
      for (let i = 0; i < 4; i++) glowLine(() => { g.moveTo(6, 14 + i * 7); g.lineTo(22 + i * 2, 14 + i * 7); }, blue, 1.5);
      glowLine(() => { g.moveTo(14, 24); g.lineTo(42, 24); }, blue, 3.5);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(44, 24); g.lineTo(34, 18); g.lineTo(34, 30); g.closePath(); g.fill();
    } else if (kind === 'triple') {
      for (let i = 0; i < 3; i++) glowLine(() => { g.moveTo(8 + i * 11, 40); g.lineTo(20 + i * 11, 8); }, 'rgba(190,150,255,A)', 2.6);
    } else if (kind === 'draw') {
      glowLine(() => { g.moveTo(4, 26); g.lineTo(44, 22); }, blue, 3);
      g.fillStyle = '#c9a55c'; g.fillRect(9, 17, 4, 16);
      g.fillStyle = '#2e2016'; g.fillRect(2, 23, 8, 5);
    } else if (kind === 'quake') {
      g.strokeStyle = '#ffb060'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(24, 36); g.lineTo(10, 44); g.moveTo(24, 36); g.lineTo(38, 45); g.moveTo(24, 36); g.lineTo(18, 47); g.moveTo(24, 36); g.lineTo(31, 47); g.stroke();
      glowLine(() => { g.moveTo(24, 4); g.lineTo(24, 36); }, 'rgba(255,190,110,A)', 3.5);
      g.fillStyle = '#c9a55c'; g.fillRect(17, 9, 14, 3);
    } else if (kind === 'ult') {
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; glowLine(() => { g.moveTo(24 + Math.cos(a) * 6, 24 + Math.sin(a) * 6); g.lineTo(24 + Math.cos(a) * 20, 24 + Math.sin(a) * 20); }, red, 1.6); }
      g.fillStyle = '#ffdddd'; g.beginPath(); g.ellipse(24, 24, 10, 4.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#c01010'; g.beginPath(); g.ellipse(24, 24, 3, 4.5, 0, 0, TAU); g.fill();
    } else if (kind === 'hpPot' || kind === 'mpPot') {
      const col = kind === 'hpPot' ? ['#ff4a4a', '#a00', '#ffc0c0'] : ['#4a8aff', '#1030a0', '#c0d8ff'];
      g.fillStyle = '#d9d0c0'; g.fillRect(19, 8, 10, 10);
      g.fillStyle = '#8a6a3a'; g.fillRect(18, 5, 12, 5);
      g.fillStyle = col[1]; g.beginPath(); g.arc(24, 29, 13, 0, TAU); g.fill();
      g.fillStyle = col[0]; g.beginPath(); g.arc(24, 30, 10.5, 0, TAU); g.fill();
      g.fillStyle = col[2]; g.beginPath(); g.arc(19, 25, 3.5, 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 2; g.strokeRect(1, 1, 46, 46);
    return c;
  },

  text(ctx, str, x, y, o = {}) {
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || ''} ${o.size || 16}px ${o.font || FONT_T}`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.sc || 'rgba(0,0,0,0.85)'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = o.fill || '#fff'; ctx.fillText(str, x, y);
  },

  // ---------- HUD ----------
  drawHUD(ctx) {
    const p = Game.player;
    if (!p) return;
    this.drawTopLeft(ctx, p);
    this.drawMinimap(ctx);
    if (Game.boss && !Game.boss.dead && Game.state !== 'intro') this.drawBossBar(ctx, Game.boss);
    else if (Game.target && Game.targetT > 0 && !Game.target.isBoss) this.drawTargetBar(ctx, Game.target);
    this.drawCombo(ctx);
    this.drawBottom(ctx, p);
    this.drawGo(ctx);
  },

  drawTopLeft(ctx, p) {
    const x = 50, y = 50;
    ctx.save();
    ctx.fillStyle = 'rgba(8,8,14,0.72)';
    roundRect(ctx, 14, 12, 280, 78, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,92,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    // 초상화
    ctx.drawImage(this.cached('portrait', 68, 68, g => {
      g.beginPath(); g.arc(34, 34, 31, 0, TAU); g.fillStyle = '#1a1f30'; g.fill();
      g.save(); g.beginPath(); g.arc(34, 34, 29, 0, TAU); g.clip();
      const rg = g.createRadialGradient(34, 24, 2, 34, 34, 30); rg.addColorStop(0, '#3a4a70'); rg.addColorStop(1, '#10131e');
      g.fillStyle = rg; g.fillRect(4, 4, 60, 60);
      g.translate(36, 40); g.scale(2.1, 2.1);
      drawPlayerHead(g, this.pJ, RIG_PLAYER.pal, 1.7, {});
      g.restore();
      g.strokeStyle = '#c9a55c'; g.lineWidth = 2.5; g.beginPath(); g.arc(34, 34, 31, 0, TAU); g.stroke();
    }), x - 34, y - 34, 68, 68);
    this.text(ctx, 'Lv.70', 92, 30, { size: 15, fill: '#ffd87a', stroke: 3 });
    this.text(ctx, '검귀 카엘', 140, 30, { size: 18, stroke: 3 });
    // 골드
    ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.arc(100, 58, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(98, 56, 2.5, 0, TAU); ctx.fill();
    this.text(ctx, fmt(Game.stats.gold), 113, 58, { size: 16, fill: '#ffe9a6', stroke: 3 });
    // 시간
    const sec = Game.stats.time / 60 | 0;
    this.text(ctx, `${String(sec / 60 | 0).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`, 282, 58, { size: 16, align: 'right', fill: '#cfd8ff', stroke: 3 });
    this.text(ctx, Game.room ? Game.room.def.name : '', 92, 78, { size: 12, font: FONT_B, weight: 700, fill: '#9aa4c0' });
    ctx.restore();
  },

  drawMinimap(ctx) {
    const rooms = DUNGEON.rooms, n = rooms.length, cw = 30, ch = 22, gap = 10;
    const tw = n * cw + (n - 1) * gap, x0 = W - 20 - tw, y0 = 22;
    ctx.save();
    ctx.fillStyle = 'rgba(8,8,14,0.72)'; roundRect(ctx, x0 - 12, y0 - 10, tw + 24, ch + 38, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(201,165,92,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (cw + gap);
      if (i < n - 1) { ctx.fillStyle = i < Game.roomIdx ? '#8aa0c8' : '#3a3f50'; ctx.fillRect(x + cw, y0 + ch / 2 - 2, gap, 4); }
      const cur = i === Game.roomIdx, done = i < Game.roomIdx || (cur && Game.room && Game.room.cleared);
      ctx.fillStyle = cur ? (Game.frame % 40 < 20 ? '#ffd24a' : '#c99a2a') : done ? '#5a6a90' : '#22252f';
      if (rooms[i].boss && !cur) ctx.fillStyle = '#6a1414';
      ctx.fillRect(x, y0, cw, ch);
      ctx.strokeStyle = cur ? '#fff6c0' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 0.5, y0 + 0.5, cw - 1, ch - 1);
      if (rooms[i].boss) {
        ctx.fillStyle = '#ffdddd'; ctx.beginPath(); ctx.arc(x + cw / 2, y0 + ch / 2 - 1, 6, 0, TAU); ctx.fill(); ctx.fillRect(x + cw / 2 - 3.5, y0 + ch / 2 + 2, 7, 4);
        ctx.fillStyle = '#300'; ctx.beginPath(); ctx.arc(x + cw / 2 - 2.2, y0 + ch / 2 - 1, 1.6, 0, TAU); ctx.arc(x + cw / 2 + 2.2, y0 + ch / 2 - 1, 1.6, 0, TAU); ctx.fill();
      }
    }
    this.text(ctx, DUNGEON.name, x0 + tw / 2, y0 + ch + 14, { size: 12, align: 'center', font: FONT_B, weight: 700, fill: '#c9b48a' });
    ctx.restore();
  },

  lineBar(ctx, x, y, w, h, ent, lines) {
    const per = ent.hpMax / lines, hp = Math.max(0, ent.hp);
    let lag = this.lagHp.get(ent);
    if (lag === undefined || lag < hp) lag = hp;
    lag = lag - (lag - hp) * 0.06 - 0.0005 * ent.hpMax;
    if (lag < hp) lag = hp;
    this.lagHp.set(ent, lag);
    const idx = Math.max(1, Math.ceil(hp / per - 1e-9));
    const cur = hp - (idx - 1) * per, frac = clamp(cur / per, 0, 1);
    const col = LINE_COLS[(idx - 1) % LINE_COLS.length], nxt = idx > 1 ? LINE_COLS[(idx - 2) % LINE_COLS.length] : '#1a0c0c';
    ctx.fillStyle = '#0a0606'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = nxt; ctx.fillRect(x, y, w, h);
    if (idx > 1) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y, w, h); }
    // 잔상 게이지
    const lagIdx = Math.ceil(lag / per - 1e-9);
    const lagFrac = lagIdx > idx ? 1 : clamp((lag - (idx - 1) * per) / per, 0, 1);
    ctx.fillStyle = '#fff4c0'; ctx.fillRect(x, y, w * lagFrac, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, w * frac, h);
    const sh = ctx.createLinearGradient(0, y, 0, y + h);
    sh.addColorStop(0, 'rgba(255,255,255,0.35)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.05)'); sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    return idx;
  },

  drawTargetBar(ctx, e) {
    const w = 400, x = W / 2 - w / 2 + 20, y = 30;
    const a = Math.min(1, Game.targetT / 20);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,8,14,0.7)'; roundRect(ctx, x - 58, y - 22, w + 74, 50, 8); ctx.fill();
    // 초상화
    ctx.drawImage(this.cached('tp_' + e.kind, 48, 48, g => {
      g.save(); g.beginPath(); g.arc(24, 24, 20, 0, TAU); g.fillStyle = '#1a1414'; g.fill(); g.clip();
      g.translate(26, 28); g.scale(1.2, 1.2);
      const pal = e.rig.pal, opt = {};
      if (e.kind === 'goblin' || e.kind === 'thrower') goblinHead(g, this.pJ, pal, 1.5, e, opt);
      else if (e.kind === 'orc') orcHead(g, this.pJ, pal, 1.5, e, opt);
      else if (e.kind === 'mage') mageHead(g, this.pJ, pal, 1.5, e, opt);
      g.restore();
      g.strokeStyle = e.elite ? '#e0b040' : '#8a8a9a'; g.lineWidth = 2; g.beginPath(); g.arc(24, 24, 20, 0, TAU); g.stroke();
    }), x - 54, y - 22, 48, 48);
    this.text(ctx, `Lv.${e.lv}`, x, y - 9, { size: 13, fill: '#ffd87a', stroke: 3 });
    this.text(ctx, e.name, x + 42, y - 9, { size: 15, fill: e.elite ? '#ffd24a' : '#ffffff', stroke: 3 });
    const idx = this.lineBar(ctx, x, y + 3, w, 13, e, e.lines);
    if (e.lines > 1) this.text(ctx, `x${idx}`, x + w + 4, y - 9, { size: 16, align: 'right', fill: '#fff', stroke: 3, italic: true });
    ctx.restore();
  },

  drawBossBar(ctx, b) {
    const w = 600, x = W / 2 - w / 2 + 30, y = 34;
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,4,0.78)'; roundRect(ctx, x - 78, y - 26, w + 96, 66, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(200,60,40,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.drawImage(this.cached('bp_' + !!b.enraged, 64, 64, g => {
      g.save(); g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.fillStyle = '#200606'; g.fill(); g.clip();
      g.translate(24, 39); g.scale(0.95, 0.95);
      bossHead(g, this.pJ, RIG_BOSS.pal, 1.6, b, {});
      g.restore();
      g.strokeStyle = '#c03020'; g.lineWidth = 2.5; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.stroke();
    }), x - 74, y - 25, 64, 64);
    this.text(ctx, `Lv.${b.lv}`, x, y - 11, { size: 14, fill: '#ffd87a', stroke: 3 });
    this.text(ctx, b.name, x + 46, y - 11, { size: 17, fill: '#ff8a70', stroke: 3 });
    const idx = this.lineBar(ctx, x, y + 2, w, 18, b, b.lines);
    this.text(ctx, `x${idx}`, x + w, y - 11, { size: 22, align: 'right', fill: '#fff', stroke: 4, italic: true });
    // 무력화 게이지
    const by = y + 26, bw = w;
    ctx.fillStyle = '#0a0606'; ctx.fillRect(x - 1, by - 1, bw + 2, 8);
    if (b.state === 'break') {
      const u = b.breakT / 300;
      ctx.fillStyle = Game.frame % 10 < 5 ? '#ffe070' : '#ffb030'; ctx.fillRect(x, by, bw * u, 6);
      this.text(ctx, 'BREAK', x + bw / 2, by + 3, { size: 11, align: 'center', fill: '#fff', stroke: 3 });
    } else {
      const g = ctx.createLinearGradient(x, 0, x + bw, 0); g.addColorStop(0, '#b06010'); g.addColorStop(1, '#ffc040');
      ctx.fillStyle = g; ctx.fillRect(x, by, bw * b.brk / b.brkMax, 6);
    }
    ctx.restore();
  },

  drawCombo(ctx) {
    const c = Game.combo;
    if (c.n < 2 || c.t <= 0) return;
    const a = Math.min(1, c.t / 25);
    const pop = c.pop; c.pop *= 0.82;
    const x = W - 60, y = 238;
    ctx.save(); ctx.globalAlpha = a;
    const col = c.n >= 100 ? ['#fff', '#ff4ad8'] : c.n >= 50 ? ['#fff', '#ff5a3a'] : c.n >= 20 ? ['#fffbe0', '#ffb020'] : ['#ffffff', '#7fd4ff'];
    ctx.translate(x, y); ctx.scale(1 + pop * 0.45, 1 + pop * 0.45);
    ctx.font = `italic 64px ${FONT_T}`; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(c.n, 0, 0);
    const g = ctx.createLinearGradient(0, -52, 0, 0); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    ctx.fillStyle = g; ctx.fillText(c.n, 0, 0);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    this.text(ctx, 'COMBO', x, y + 18, { size: 22, align: 'right', italic: true, fill: col[1], stroke: 4 });
    this.text(ctx, fmt(c.dmg), x, y + 44, { size: 17, align: 'right', italic: true, fill: '#fff3c8', stroke: 4 });
    ctx.restore();
  },

  globe(ctx, x, y, r, frac, cols, label, val) {
    const R = r + 8, key = cols[0];
    ctx.drawImage(this.cached('gframe' + r, R * 2, R * 2, g => {
      g.beginPath(); g.arc(R, R, r + 7, 0, TAU);
      const fr = g.createLinearGradient(0, R - r, 0, R + r); fr.addColorStop(0, '#6a5230'); fr.addColorStop(0.5, '#c9a55c'); fr.addColorStop(1, '#4a3820');
      g.fillStyle = fr; g.fill();
      g.beginPath(); g.arc(R, R, r, 0, TAU); g.fillStyle = '#07070a'; g.fill();
    }), x - R, y - R, R * 2, R * 2);
    const liq = this.cached('gliq' + key, r * 2, r * 2, g => {
      g.beginPath(); g.arc(r, r, r - 1, 0, TAU);
      const lg = g.createLinearGradient(0, 0, 0, r * 2); lg.addColorStop(0, cols[0]); lg.addColorStop(1, cols[1]);
      g.fillStyle = lg; g.fill();
    });
    const f = clamp(frac, 0, 1), top = (1 - f) * r * 2;
    if (f > 0.005) {
      ctx.drawImage(liq, 0, top * 2, liq.width, liq.height - top * 2, x - r, y - r + top, r * 2, r * 2 - top);
      const hy = top - r, cw = Math.sqrt(Math.max(0, (r - 1) * (r - 1) - hy * hy));
      if (cw > 2) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(${cols[2]},0.55)`;
        ctx.beginPath(); ctx.ellipse(x, y - r + top + 1, cw * 0.96, 2 + Math.sin(Game.time * 0.1) * 0.8, 0, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.drawImage(this.cached('gglass' + r, r * 2, r * 2, g => {
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(r - r * 0.3, r - r * 0.45, r * 0.45, r * 0.25, -0.5, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(r - r * 0.42, r - r * 0.5, r * 0.12, r * 0.06, -0.6, 0, TAU); g.fill();
    }), x - r, y - r, r * 2, r * 2);
    this.text(ctx, label, x, y - 8, { size: 13, align: 'center', fill: '#fff', stroke: 3 });
    this.text(ctx, val, x, y + 10, { size: 13, align: 'center', fill: '#fff', stroke: 3 });
  },

  drawBottom(ctx, p) {
    const y0 = 646;
    ctx.save();
    // 패널
    ctx.drawImage(this.cached('panel', 700, H - y0 + 2, g => {
      const pg = g.createLinearGradient(0, 0, 0, H - y0);
      pg.addColorStop(0, 'rgba(26,24,32,0.95)'); pg.addColorStop(1, 'rgba(8,8,14,0.98)');
      g.fillStyle = pg;
      g.beginPath(); g.moveTo(10, 9); g.lineTo(30, 1); g.lineTo(670, 1); g.lineTo(690, 9); g.lineTo(690, H); g.lineTo(10, H); g.closePath(); g.fill();
      g.strokeStyle = '#8a7045'; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = 'rgba(201,165,92,0.3)'; g.beginPath(); g.moveTo(32, 5); g.lineTo(668, 5); g.stroke();
    }), 290, y0 - 1, 700, H - y0 + 2);
    // HP / MP 구슬
    if (p.hp / p.hpMax < 0.3 && Game.frame % 30 < 15) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 262, 664, 90, '255,40,30', 0.5); ctx.globalCompositeOperation = 'source-over'; }
    this.globe(ctx, 262, 664, 48, p.hp / p.hpMax, ['#ff5a4a', '#8a0c0c', '255,120,100'], 'HP', fmt(p.hp));
    this.globe(ctx, 1018, 664, 48, p.mp / p.mpMax, ['#5aa0ff', '#0c2a8a', '120,170,255'], 'MP', fmt(p.mp));
    // 스킬 슬롯
    const sx = 404, sz = 50, gap = 8, sy0 = 656;
    SKILLS.forEach((s, i) => {
      const x = sx + i * (sz + gap);
      this.slot(ctx, x, sy0, sz, this.icons[s.icon], s.key.replace('s', ''), SKILL_KEY_LABELS[i], p.cd[s.key], s.cd, p.mp < s.mp);
    });
    const px = sx + 6 * (sz + gap) + 16;
    this.slot(ctx, px, sy0 + 3, 44, this.icons.hpPot, '', '1', p.potCd / 60, 0.5, p.pots.hp <= 0, p.pots.hp);
    this.slot(ctx, px + 52, sy0 + 3, 44, this.icons.mpPot, '', '2', p.potCd / 60, 0.5, p.pots.mp <= 0, p.pots.mp);
    ctx.restore();
  },

  slot(ctx, x, y, sz, icon, _, key, cd, cdMax, dim, count) {
    ctx.fillStyle = '#050508'; ctx.fillRect(x - 2, y - 2, sz + 4, sz + 4);
    ctx.drawImage(icon, x, y, sz, sz);
    if (dim) { ctx.fillStyle = 'rgba(10,20,70,0.6)'; ctx.fillRect(x, y, sz, sz); }
    if (cd > 0) {
      const u = cd / cdMax;
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.beginPath(); ctx.moveTo(x + sz / 2, y + sz / 2); ctx.arc(x + sz / 2, y + sz / 2, sz, -Math.PI / 2, -Math.PI / 2 + u * TAU); ctx.closePath();
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, sz, sz); ctx.clip();
      ctx.beginPath(); ctx.moveTo(x + sz / 2, y + sz / 2); ctx.arc(x + sz / 2, y + sz / 2, sz, -Math.PI / 2, -Math.PI / 2 + u * TAU); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (cdMax > 1) this.text(ctx, cd >= 1 ? Math.ceil(cd) : cd.toFixed(1), x + sz / 2, y + sz / 2 + 1, { size: 17, align: 'center', stroke: 3 });
    }
    ctx.strokeStyle = cd > 0 ? '#3a3a44' : '#b89a5c'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 0.5, y - 0.5, sz + 1, sz + 1);
    ctx.font = `11px ${FONT_T}`;
    const kw = Math.max(14, ctx.measureText(key).width + 6);
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(x, y, kw, 13);
    this.text(ctx, key, x + kw / 2, y + 7, { size: 11, align: 'center', fill: '#ffe9a6' });
    if (count !== undefined) this.text(ctx, count, x + sz - 3, y + sz - 8, { size: 13, align: 'right', stroke: 3 });
  },

  drawGo(ctx) {
    const r = Game.room;
    if (!r || !r.cleared || r.def.boss || Game.state !== 'play') return;
    const t = Game.frame, a = 0.6 + Math.sin(t * 0.2) * 0.4;
    const x = W - 90 + Math.sin(t * 0.2) * 8, y = 330;
    ctx.save(); ctx.globalAlpha = a;
    this.text(ctx, 'GO', x - 30, y, { size: 40, align: 'right', italic: true, fill: '#ffe070', stroke: 6 });
    ctx.fillStyle = '#ffe070'; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 20, y - 22); ctx.lineTo(x + 18, y); ctx.lineTo(x - 20, y + 22); ctx.lineTo(x - 12, y); ctx.closePath(); ctx.stroke(); ctx.fill();
    ctx.restore();
  },

  // ---------- 알림 ----------
  drawNotices(ctx) {
    for (const n of Game.notices) {
      const a = Math.min(1, n.t / 10, (n.life - n.t) / 15);
      ctx.save(); ctx.globalAlpha = a;
      this.text(ctx, n.text, W / 2, 590, { size: 18, align: 'center', font: FONT_B, weight: 900, fill: '#ffd0a0', stroke: 4 });
      ctx.restore();
    }
    const b = Game.big;
    if (b) {
      const t = b.t, s = t < 8 ? lerp(2.6, 1, E.out3(t / 8)) : 1 + (t - 8) * 0.0015, a = Math.min(1, (b.life - t) / 20);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, b.y); ctx.scale(s, s);
      ctx.font = `italic ${b.size}px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(b.text, 0, 0);
      const g = ctx.createLinearGradient(0, -b.size / 2, 0, b.size / 2); g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
      ctx.fillStyle = g; ctx.fillText(b.text, 0, 0);
      if (t < 10) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - t / 10); ctx.fillStyle = '#fff'; ctx.fillText(b.text, 0, 0); }
      ctx.restore();
    }
  },

  // ---------- 각성기 컷인 ----------
  drawCutin(ctx, c) {
    const t = c.t, dur = c.dur;
    const inU = E.out3(clamp(t / 10, 0, 1)), outU = E.in(clamp((t - (dur - 12)) / 12, 0, 1));
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.72 * (1 - outU)})`; ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2); ctx.rotate(-0.1);
    const bh = 250 * (1 - outU) * inU;
    const bg = ctx.createLinearGradient(0, -bh / 2, 0, bh / 2);
    bg.addColorStop(0, '#2a0204'); bg.addColorStop(0.5, '#8a0a0e'); bg.addColorStop(1, '#2a0204');
    ctx.fillStyle = bg; ctx.fillRect(-W, -bh / 2, W * 2, bh);
    ctx.save(); ctx.beginPath(); ctx.rect(-W, -bh / 2, W * 2, bh); ctx.clip();
    // 집중선
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const yy = ((i * 37 + t * 3) % 250) - 125, xx = ((i * 211 + t * 60) % (W * 2)) - W;
      ctx.fillStyle = `rgba(255,${120 + (i * 13) % 100},90,0.25)`; ctx.fillRect(xx, yy, 260 + (i % 5) * 60, 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    // 캐릭터
    if (!this.cutJ) { this.cutJ = newJ(); solveRig(RIG_PLAYER, PP.hero, this.cutJ, true); }
    ctx.save();
    ctx.translate(-330 + t * 0.9 - (1 - inU) * 300, 190); ctx.scale(3.6, 3.6);
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, -70, 90, '255,60,40', 0.45); ctx.globalCompositeOperation = 'source-over';
    drawPlayer(ctx, this.cutJ, RIG_PLAYER.pal, { bladeGlow: 2, ghostGlow: 1.5 }, {});
    ctx.restore();
    // 기술명
    const tx = 150 + (1 - inU) * 500 - t * 0.5;
    ctx.font = `110px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.strokeText('극 귀신참', tx, -14);
    const tg = ctx.createLinearGradient(0, -70, 0, 40); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.5, '#ffd0c0'); tg.addColorStop(1, '#ff3a2a');
    ctx.fillStyle = tg; ctx.fillText('극 귀신참', tx, -14);
    ctx.font = `28px ${FONT_B}`; ctx.lineWidth = 5; ctx.strokeText('極 · 鬼 神 斬', tx + 40, 66); ctx.fillStyle = '#ffb0a0'; ctx.fillText('極 · 鬼 神 斬', tx + 40, 66);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,200,180,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-W, -bh / 2); ctx.lineTo(W, -bh / 2); ctx.moveTo(-W, bh / 2); ctx.lineTo(W, bh / 2); ctx.stroke();
    ctx.restore();
    if (t > dur - 6) { ctx.fillStyle = `rgba(255,255,255,${(t - (dur - 6)) / 6})`; ctx.fillRect(0, 0, W, H); }
  },

  // ---------- 타이틀 ----------
  drawTitle(ctx) {
    const t = Game.time, tp = Game.titleP, r = Game.titleRoom;
    const camX = (Math.sin(t * 0.002) * 0.5 + 0.5) * (r.width - W);
    r.drawBack(ctx, camX);
    ctx.save(); ctx.translate(-camX, 0); r.drawAmbient(ctx); ctx.restore();
    r.drawFront(ctx, camX);
    const gr = ctx.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.vignette, 0, 0);
    // 캐릭터
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(tp.x, sy(tp.y, 0), 90, 20, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, tp.x, 360, 260, '80,120,255', 0.18); ctx.restore();
    tp.draw(ctx);
    // 로고
    const ly = 190, lx = 110;
    ctx.save();
    ctx.font = `italic 118px ${FONT_T}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.strokeText('BLADE', lx, ly); ctx.strokeText('RAID', lx + 60, ly + 104);
    const lg = ctx.createLinearGradient(0, ly - 100, 0, ly + 110);
    lg.addColorStop(0, '#ffffff'); lg.addColorStop(0.45, '#b8c8e8'); lg.addColorStop(0.5, '#6a7fa8'); lg.addColorStop(1, '#dfe8ff');
    ctx.fillStyle = lg; ctx.fillText('BLADE', lx, ly); ctx.fillText('RAID', lx + 60, ly + 104);
    // 붉은 검흔
    const sw = clamp((t % 240) / 16, 0, 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,60,40,0.9)';
    ctx.beginPath(); ctx.moveTo(lx - 20, ly + 70); ctx.lineTo(lx - 20 + 520 * sw, ly + 70 - 150 * sw); ctx.lineTo(lx - 20 + 520 * sw, ly + 62 - 150 * sw); ctx.closePath(); ctx.fill();
    drawGlow(ctx, lx + 240, ly + 10, 260, '255,50,30', 0.18);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    this.text(ctx, '블레이드 레이드  :  바르카스의 둥지', lx + 6, ly + 150, { size: 26, fill: '#e8d6b0', stroke: 5 });
    // 안내
    if (t % 70 < 50) this.text(ctx, 'PRESS ANY KEY', lx + 6, 470, { size: 30, fill: '#ffe070', stroke: 5, italic: true });
    const keys = [
      ['W A S D', '이동  ( AA / DD 대시 )'], ['좌클릭', '기본 공격 (연타 콤보)'], ['K', '점프 / 다운 중 퀵 리바운드'], ['L', '백스텝 (무적)'],
      ['U I O P H', '스킬      Space : 각성기'], ['1 · 2', 'HP / MP 물약'], ['ESC', '일시정지    M : 음소거'],
    ];
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; roundRect(ctx, lx - 4, 510, 470, 190, 10); ctx.fill();
    keys.forEach(([k, d], i) => {
      this.text(ctx, k, lx + 14, 534 + i * 25, { size: 16, fill: '#ffd87a' });
      this.text(ctx, d, lx + 150, 534 + i * 25, { size: 15, font: FONT_B, weight: 700, fill: '#e0e4f0' });
    });
    ctx.restore();
  },

  // ---------- 일시정지 ----------
  drawPause(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
    this.text(ctx, 'PAUSE', W / 2, 200, { size: 64, align: 'center', italic: true, fill: '#fff', stroke: 8 });
    const lines = [
      ['W A S D', '이동, 같은 방향 2번 → 대시  (방향키 + X C Z 도 가능)'], ['좌클릭 / K / L', '공격 / 점프 / 백스텝  (J 도 공격 가능)'],
      ['U', '어퍼 슬래시 - 적을 띄움 (공중 사용 가능)'], ['I', '돌진참 - 적을 끌고 돌진'], ['O', '삼단베기 - 3연속 돌진 베기 (방향 전환 가능)'],
      ['P', '발도 : 섬 - 순간 이동 베기'], ['H', '지진검 - 공중에서도 사용 가능'], ['Space', '극 귀신참 - 각성기'],
      ['콤보', '평타 ↔ 스킬 서로 캔슬 가능 : 클릭 ×2 → U → 클릭 ×3 → I → 클릭 ...'],
      ['팁', '띄운 적은 평타로 계속 저글 · 적 공격 준비 중 타격 시 COUNTER'],
    ];
    lines.forEach(([a, b], i) => {
      this.text(ctx, a, 330, 270 + i * 31, { size: 17, fill: '#ffd87a', stroke: 3 });
      this.text(ctx, b, 450, 270 + i * 31, { size: 16, font: FONT_B, weight: 700, fill: '#e8ecf8', stroke: 3 });
    });
    this.text(ctx, 'ESC 를 눌러 계속', W / 2, 620, { size: 20, align: 'center', fill: '#aab4d0', stroke: 3 });
  },

  // ---------- 결과 ----------
  drawResult(ctx) {
    const R = Game.result, t = Game.resT;
    const a = Math.min(1, t / 30);
    ctx.fillStyle = `rgba(0,0,0,${0.7 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = a;
    const pg = ctx.createLinearGradient(0, 140, 0, 600);
    pg.addColorStop(0, 'rgba(30,26,40,0.95)'); pg.addColorStop(1, 'rgba(10,8,14,0.95)');
    ctx.fillStyle = pg; roundRect(ctx, 290, 110, 700, 510, 14); ctx.fill();
    ctx.strokeStyle = '#c9a55c'; ctx.lineWidth = 2; ctx.stroke();
    this.text(ctx, 'DUNGEON CLEAR', W / 2, 160, { size: 46, align: 'center', italic: true, fill: '#ffe9a6', stroke: 6 });
    this.text(ctx, DUNGEON.name, W / 2, 202, { size: 18, align: 'center', font: FONT_B, weight: 700, fill: '#b8a888' });
    const rows = [
      ['클리어 타임', R.timeStr], ['최대 콤보', fmt(R.maxCombo)], ['처치한 몬스터', fmt(R.kills)],
      ['피격 횟수', fmt(R.hits)], ['누적 데미지', fmt(R.dmg)], ['획득 골드', fmt(R.gold)],
    ];
    rows.forEach(([k, v], i) => {
      const show = t > 30 + i * 10;
      if (!show) return;
      this.text(ctx, k, 350, 260 + i * 44, { size: 20, fill: '#c8cce0', stroke: 3 });
      this.text(ctx, v, 690, 260 + i * 44, { size: 22, align: 'right', fill: '#fff', stroke: 3, italic: true });
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(350, 280 + i * 44, 340, 1);
    });
    if (t > 110) {
      const s = t < 124 ? lerp(3, 1, E.out3((t - 110) / 14)) : 1;
      ctx.save(); ctx.translate(835, 350); ctx.scale(s, s);
      const col = { SSS: ['#fff', '#ff4ad8'], SS: ['#fff8d0', '#ffb020'], S: ['#fff8d0', '#ffd24a'], A: ['#e0f7ff', '#4ac2ff'], B: ['#e0ffe0', '#4adf6a'], C: ['#eee', '#999'] }[R.rank];
      ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, 150, '255,200,90', 0.35 + Math.sin(t * 0.1) * 0.1); ctx.globalCompositeOperation = 'source-over';
      ctx.font = `italic ${R.rank.length > 2 ? 110 : 150}px ${FONT_T}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.strokeText(R.rank, 0, 0);
      const g = ctx.createLinearGradient(0, -70, 0, 70); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
      ctx.fillStyle = g; ctx.fillText(R.rank, 0, 0);
      ctx.restore();
      this.text(ctx, `SCORE ${fmt(R.score)}`, 835, 460, { size: 22, align: 'center', fill: '#ffe9a6', stroke: 4, italic: true });
    }
    if (t > 140 && t % 60 < 44) this.text(ctx, 'Enter : 다시 도전', W / 2, 580, { size: 20, align: 'center', fill: '#ffd87a', stroke: 4 });
    ctx.restore();
  },

  drawContinue(ctx) {
    const c = Game.cont;
    ctx.fillStyle = 'rgba(40,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
    this.text(ctx, 'CONTINUE ?', W / 2, 250, { size: 64, align: 'center', italic: true, fill: '#ffd0c0', stroke: 8 });
    const n = Math.ceil(c.t / 60);
    const s = 1 + (c.t % 60) / 60 * 0.4;
    ctx.save(); ctx.translate(W / 2, 360); ctx.scale(s, s);
    this.text(ctx, String(n), 0, 0, { size: 90, align: 'center', italic: true, fill: '#fff', stroke: 8 });
    ctx.restore();
    this.text(ctx, `좌클릭 : 부활  (남은 코인 ${Game.coins})`, W / 2, 470, { size: 24, align: 'center', fill: '#ffe070', stroke: 4 });
  },

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    this.text(ctx, 'GAME OVER', W / 2, 300, { size: 80, align: 'center', italic: true, fill: '#ff5a4a', stroke: 8 });
    if (Game.frame % 60 < 44) this.text(ctx, 'Enter : 처음부터 다시', W / 2, 420, { size: 22, align: 'center', fill: '#ffd87a', stroke: 4 });
  },

  drawBossIntro(ctx, t) {
    const bars = E.out3(clamp(t / 20, 0, 1)) * (1 - E.in(clamp((t - 170) / 24, 0, 1)));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 90 * bars); ctx.fillRect(0, H - 90 * bars, W, 90 * bars);
    if (t > 70 && t < 185) {
      const u = t - 70, a = Math.min(1, u / 12, (115 - u) / 15);
      ctx.save(); ctx.globalAlpha = a;
      const x = 150 + (1 - E.out3(Math.min(1, u / 18))) * -200;
      ctx.fillStyle = 'rgba(120,10,10,0.6)'; ctx.fillRect(0, 420, W * 0.7 * E.out3(Math.min(1, u / 14)), 4);
      this.text(ctx, '뿔의 군주', x, 460, { size: 30, fill: '#ffb0a0', stroke: 5 });
      this.text(ctx, '바르카스', x, 520, { size: 72, fill: '#fff', stroke: 8, italic: true });
      this.text(ctx, 'Lv.70  네임드 보스', x + 6, 572, { size: 18, fill: '#e0c080', stroke: 4 });
      ctx.restore();
    }
  },
};
