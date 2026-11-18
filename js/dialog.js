'use strict';
// ============================================================
//  스토리 연출 : 대화창 · 일러스트 컷신 · 장 제목 · 말풍선 · 등장인물(액터) · 요정 리엔
//   대본(스크립트)은 명령 배열이다.  Cine.run(대본, 끝나면) 으로 실행.
//     ['t', '누구:표정', '대사']      대화창 (연속된 줄은 한 번에 묶인다)
//     ['n', '내레이션']               초상화 없는 해설
//     ['say', 누구, '말풍선', 프레임]   전투를 멈추지 않는 짧은 대사
//     ['wait', 프레임]  ['cam', x | null]  ['actor', id, 종류, x, y, 옵션]  ['walk', id, x, y?, 속도?]
//     ['face', id, 1|-1]  ['del', id]  ['lien', 'show'|'hide']  ['shake', 세기]  ['flash', 세기, 'r,g,b']
//     ['fade', 'out'|'in', 프레임]  ['cg', 번호, [자막…]]  ['title', 큰글씨, 작은글씨]  ['name']
//     ['music', 이름|null]  ['sfx', 이름]  ['bars', 1|0]  ['mem', 1|0]  ['fn', 함수]  ['choice', [보기…], 고른뒤(i)]
// ============================================================
const heroName = () => (Save.data && Save.data.nick) || '카엘';
const fillName = s => String(s).replace(/\{name\}/g, heroName());

// ---------- 등장인물 ----------
//   side : 대화창에서 초상화가 놓이는 쪽,  col : 이름표 · 초상화 색
const CAST = {
  hero: { name: () => heroName(), side: 0, col: '#8fb4ff' },
  lien: { name: '리엔', side: 0, col: '#9fefff' },
  seric: { name: '세릭', side: 1, col: '#c9d4e8', look: 'a18', w: 'w5' },
  ella: { name: '엘라', side: 1, col: '#c8a8ff', look: 'a20', w: 'w4' },
  orben: { name: '오르벤', side: 1, col: '#b89aff', look: 'a6', w: 'w6' },
  knight: { name: '검은 기사', side: 1, col: '#9a8ac8' },
  morgrain: { name: '모르그레인', side: 1, col: '#ff70c8' },
  volk: { name: '볼크', side: 1, col: '#ffd08a', look: 'a14' },
  hanna: { name: '한나', side: 1, col: '#ffb070', look: 'a15' },
  theo: { name: '테오', side: 1, col: '#c8e0a0', look: 'a20' },
  fio: { name: '피오', side: 1, col: '#ffe0a0', look: 'a16', scale: 0.72 },
  granny: { name: '할머니', side: 1, col: '#e0c8b0', look: 'a21', scale: 0.9 },
  villager: { name: '마을 사람', side: 1, col: '#d0c0a0', look: 'a1' },
  captain: { name: '망령 선장', side: 1, col: '#9fd8c8' },
  harghan: { name: '하르간', side: 1, col: '#ff9a60' },
  varkas: { name: '바르카스', side: 1, col: '#ff7050' },
  boss: { name: '???', side: 1, col: '#ff8070' },
  voice: { name: '???', side: 1, col: '#c0c0d0' },
  young: { name: () => '어린 ' + heroName(), side: 0, col: '#8fb4ff' },
  younglien: { name: '어린 리엔', side: 1, col: '#ffd8a0', look: 'a16', scale: 0.66 },
  youngseric: { name: '견습 기사 세릭', side: 1, col: '#c9d4e8', look: 'a2', w: 'w1' },
  youngella: { name: '엘라', side: 1, col: '#c8a8ff', look: 'a4', w: 'w4' },
};
const castName = who => { const c = CAST[who] || CAST.voice; return typeof c.name === 'function' ? c.name() : c.name; };
const armorDef = id => ARMORS.find(a => a.id === id) || ARMORS[0];
const weaponDef = id => WEAPONS.find(w => w.id === id) || WEAPONS[0];

// ---------- 초상화 : 그림(img/story/portrait/누구_표정.webp)이 있으면 그것, 없으면 코드로 그린 자리표시 ----------
const Por = {
  imgs: {}, cache: {},
  img(who, face) {
    const k = who + '_' + (face || 'base');
    let s = this.imgs[k];
    if (!s) {
      s = this.imgs[k] = { ok: false, img: new Image() };
      s.img.onload = () => { s.ok = true; };
      s.img.onerror = () => { s.bad = true; };
      s.img.src = 'img/story/portrait/' + k + '.webp?v=' + (typeof BUILD !== 'undefined' ? BUILD : '1');
    }
    return s;
  },
  // 자리표시 : 인물 색의 둥근 판 + 실루엣 (주인공 · 리엔은 실제 모습)
  draw(ctx, who, face, x, y, r, flip) {
    const s = this.img(who, face);
    if (!s.ok && !s.bad && face) { const b = this.img(who, null); if (b.ok) return this.drawImg(ctx, b.img, x, y, r, flip); }
    if (s.ok) return this.drawImg(ctx, s.img, x, y, r, flip);
    const key = who + (face || '');
    const c = this.cache[key] || (this.cache[key] = this.make(who, face));
    ctx.drawImage(c, x - r, y - r, r * 2, r * 2);
  },
  drawImg(ctx, img, x, y, r, flip) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const s = (r * 2.2) / Math.max(img.width, img.height);
    ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -img.width * s / 2, -img.height * s * 0.42, img.width * s, img.height * s);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,230,170,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  },
  make(who, face) {
    const S = 2, R = 64, c = makeCanvas(R * 2 * S, R * 2 * S), g = c.getContext('2d');
    g.scale(S, S);
    const C = CAST[who] || CAST.voice, col = C.col;
    g.save(); g.beginPath(); g.arc(R, R, R - 2, 0, TAU); g.clip();
    const bg = g.createRadialGradient(R, R * 0.7, 4, R, R, R * 1.2);
    bg.addColorStop(0, mixHex(col, '#ffffff', 0.15)); bg.addColorStop(0.55, mixHex(col, '#101422', 0.6)); bg.addColorStop(1, '#06080e');
    g.fillStyle = bg; g.fillRect(0, 0, R * 2, R * 2);
    if (who === 'hero' || who === 'young') {
      g.translate(R + 4, R + 16); g.scale(3.6, 3.6);
      drawPlayerHead(g, UI.pJ, RIG_PLAYER.pal, 1.7, {});
    } else if (who === 'lien') {
      Lien.drawBody(g, R, R + 6, 2.6, 0, face === 'sad' ? 0.6 : 1);
    } else {
      // 실루엣 : 머리 + 어깨
      g.fillStyle = mixHex(col, '#000000', 0.72);
      g.beginPath(); g.ellipse(R, R * 2.05, R * 0.95, R * 0.7, 0, 0, TAU); g.fill();
      g.beginPath(); g.arc(R, R * 0.92, R * 0.38, 0, TAU); g.fill();
      g.fillStyle = mixHex(col, '#ffffff', 0.25); g.globalAlpha = 0.85;
      const nm = castName(who); g.font = `${R * 0.5}px ${FONT_T}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(nm.replace(/^(어린|견습 기사) /, '').slice(0, 1), R, R * 0.95);
      g.globalAlpha = 1;
    }
    g.restore();
    g.strokeStyle = 'rgba(255,230,170,0.85)'; g.lineWidth = 3; g.beginPath(); g.arc(R, R, R - 2, 0, TAU); g.stroke();
    return c;
  },
};

// ---------- 요정 리엔 : 늘 주인공 곁을 날아다닌다 ----------
const Lien = {
  on: false, x: 0, y: 0, z: 150, t: 0, glow: 0,
  reset() { const p = Game.player; this.x = p ? p.x - 50 : 0; this.y = p ? p.y : 100; this.z = 150; },
  update() {
    if (!this.on) return;
    this.t++;
    const p = Game.player; if (!p) return;
    const tx = p.x - p.facing * 46, ty = p.y - 6, tz = 150 + Math.sin(this.t * 0.05) * 10;
    this.x = lerp(this.x, tx, 0.06); this.y = lerp(this.y, ty, 0.08); this.z = lerp(this.z, tz, 0.08);
    this.glow = Math.max(0, this.glow - 0.02);
    if (this.t % 7 === 0) FX.add('world', new Mote(this.x + rand(-6, 6), sy(this.y, this.z) + rand(-4, 4), rand(-0.3, 0.3), rand(0.2, 0.6), { col: '170,240,255', life: 30, r: 3.5 }));
  },
  // 몸 : 빛나는 핵 + 날개 네 장 (k : 크기, br : 밝기)
  drawBody(ctx, x, y, k, t, br = 1) {
    const flap = Math.sin(t * 0.45) * 0.35;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 0, 0, 30, '120,220,255', 0.35 * br);
    for (const s of [-1, 1]) for (const [a, L, wd] of [[-0.5, 15, 6], [0.35, 11, 4.5]]) {
      ctx.save(); ctx.rotate(s * (Math.PI / 2 + a + flap * (a < 0 ? 1 : 0.6)));
      const g = ctx.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, `rgba(200,250,255,${0.7 * br})`); g.addColorStop(1, 'rgba(140,210,255,0.05)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -L / 2, wd, L / 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    const cg = ctx.createRadialGradient(-1, -1.5, 0.5, 0, 0, 5.5);
    cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.6, `rgba(190,245,255,${br})`); cg.addColorStop(1, 'rgba(110,200,255,0.4)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, TAU); ctx.fill();
    ctx.restore();
  },
  draw(ctx) {
    if (!this.on) return;
    const X = this.x, Y = sy(this.y, this.z);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(X, sy(this.y, 0), 10, 3, 0, 0, TAU); ctx.fill();
    if (this.glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, Y, 60 + this.glow * 60, '150,240,255', this.glow * 0.5); ctx.restore(); }
    this.drawBody(ctx, X, Y, 1.25, this.t);
  },
};

// ---------- 액터 : 대본으로 움직이는 인물 (주인공과 같은 뼈대에 옷만 다르게) ----------
class Actor {
  constructor(id, kind, x, y, o = {}) {
    this.id = id; this.kind = kind; this.x = x; this.y = y; this.z = 0; this.facing = o.facing || -1;
    this.tx = null; this.spd = 3; this.o = o; this.alpha = 1; this.isActor = true;
    const C = CAST[kind] || {};
    if (o.enemy) {                                            // 몬스터 모습 (대본용 : 움직이지 않는다)
      this.body = makeEnemy(o.enemy, x, y); this.body.state = 'idle'; this.body.alpha = 1; this.body.aiWait = 1e9;
    } else {
      const b = this.body = new Player();
      b.setGear(weaponDef(o.w || C.w || 'w0'), armorDef(o.look || C.look || 'a0'));
      b.scale = o.scale || C.scale || 1; b.isPlayer = false;
      b.reset(x, y); b.setState('cine'); b.facing = this.facing;
      if (NPC_DEFS[kind]) b.npc = NPC_DEFS[kind];                                // 인물 도감에 있으면 고유한 얼굴 · 옷으로 그린다
    }
    this.body.x = x; this.body.y = y;
  }
  update() {
    const b = this.body;
    b.px = b.x; b.pz = b.z;
    let moving = false;
    if (this.tx != null) {
      const dx = this.tx - this.x, dy = (this.ty ?? this.y) - this.y, L = Math.hypot(dx, dy);
      if (L < this.spd + 0.5) { this.x = this.tx; this.y = this.ty ?? this.y; this.tx = null; }
      else { this.x += dx / L * this.spd; this.y += dy / L * this.spd; this.facing = dx > 0.5 ? 1 : dx < -0.5 ? -1 : this.facing; moving = true; }
    }
    b.x = this.x; b.y = this.y; b.facing = this.facing; b.alpha = this.alpha;
    if (this.o.enemy) { b.play(moving ? 'walk' : 'idle', 6); b.stepAnim(); return; }
    if (this.anim && !moving) b.play(this.anim, 4); else b.play(moving ? (this.spd > 3.5 ? 'run' : 'walk') : 'idle', 5);
    b.stepAnim(); if (b.updateChains) b.updateChains();
  }
  drawShadow(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(this.x, sy(this.y, 0), 26 * (this.body.scale || 1), 8, 0, 0, TAU); ctx.fill(); }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha *= this.alpha;
    if (this.o.ghost) { ctx.globalAlpha *= 0.55; }
    this.body.draw(ctx);
    ctx.restore();
  }
  headY() { return sy(this.y, (this.body.h || 134) * (this.body.scale || 1) + 26); }
}

// ---------- 말풍선 ----------
const Bubbles = {
  list: [],
  add(who, text, life = 150) {
    this.list = this.list.filter(b => b.who !== who);
    this.list.push({ who, text: fillName(text), t: 0, life });
  },
  anchor(who) {
    if (who === 'hero') { const p = Game.player; return p ? [p.x, sy(p.y, p.z + 160)] : null; }
    if (who === 'lien') return Lien.on ? [Lien.x, sy(Lien.y, Lien.z + 22)] : null;
    const a = Cine.actors[who]; if (a) return [a.x, a.headY()];
    const e = Game.enemies.find(e => e.storyId === who); if (e) return [e.x, sy(e.y, e.z + e.hurtH() + 20)];
    return null;
  },
  update() { for (const b of this.list) b.t++; this.list = this.list.filter(b => b.t < b.life); },
  draw(ctx) {
    for (const b of this.list) {
      const at = this.anchor(b.who); if (!at) continue;
      const a = Math.min(1, b.t / 8, (b.life - b.t) / 12);
      ctx.save(); ctx.globalAlpha = a;
      ctx.font = `700 17px ${FONT_B}`;
      const w = Math.min(420, ctx.measureText(b.text).width + 28), h = 36, x = at[0] - w / 2, y = at[1] - h - 12 - (1 - Math.min(1, b.t / 8)) * 8;
      ctx.fillStyle = b.who === 'lien' ? 'rgba(10,30,44,0.9)' : 'rgba(12,12,18,0.9)'; roundRect(ctx, x, y, w, h, 12); ctx.fill();
      ctx.strokeStyle = (CAST[b.who] || CAST.voice).col; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(at[0] - 8, y + h - 1); ctx.lineTo(at[0], y + h + 10); ctx.lineTo(at[0] + 8, y + h - 1); ctx.closePath(); ctx.fill();
      UI.text(ctx, b.text, at[0], y + h / 2 + 1, { size: 17, align: 'center', font: FONT_B, weight: 700, fill: '#fff', base: 'middle' });
      ctx.restore();
    }
  },
};

// ---------- 대화창 (+ 일러스트 자막) ----------
const Talk = {
  on: false, lines: null, i: 0, shown: 0, t: 0, auto: false, autoT: 0, done: null, mode: 'talk', cg: null, log: [],
  SKIP: { x: W - 168, y: 20, w: 148, h: 38 }, AUTO: { x: W - 290, y: 20, w: 110, h: 38 },
  open(lines, done, cg) {
    this.on = true; this.lines = lines; this.i = 0; this.shown = 0; this.t = 0; this.autoT = 0; this.done = done;
    this.mode = cg ? 'cg' : 'talk'; this.cg = cg || null;
    this.prevState = Game.state === 'talk' ? this.prevState : Game.state;
    Game.state = 'talk';
    Touch.release(); Input.clear();
    this.logLine();
  },
  cur() { return this.lines[this.i]; },
  logLine() { const L = this.cur(); if (L) { this.log.push([L.who, fillName(L.text)]); if (this.log.length > 80) this.log.shift(); } },
  close() {
    this.on = false; Game.state = this.prevState || 'play';
    if (Game.state === 'talk') Game.state = 'play';
    Input.clear();
    const d = this.done; this.done = null; if (d) d();
  },
  next() {
    const L = this.cur(), full = fillName(L.text).length;
    if (this.shown < full) { this.shown = full; return; }
    this.i++; this.shown = 0; this.autoT = 0;
    if (this.i >= this.lines.length) { this.close(); return; }
    this.logLine();
    Sfx.play('ui', 0.35, 1.3);
  },
  skipAll() { Sfx.play('ui', 0.5, 0.8); this.close(); Cine.skipping = true; },
  update() {
    this.t++;
    if (this.cg) this.cg.t++;
    const L = this.cur(); if (!L) { this.close(); return; }
    const full = fillName(L.text).length;
    if (this.shown < full) { this.shown = Math.min(full, this.shown + (this.mode === 'cg' ? 0.9 : 1.4)); if ((this.t & 3) === 0 && this.mode === 'talk') Sfx.play('ui', 0.12, 1.9 + Math.random() * 0.3); }
    else if (this.auto && ++this.autoT > 70 + full * 1.2) this.next();
    if (this.t < 8) { Input.clear(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') { this.next(); if (!this.on) return; }
      else if (q.a === 'back') { this.auto = !this.auto; Sfx.play('ui', 0.5); }
    }
    if (Input.take('pause')) this.skipAll();
  },
  // 포인터 (마우스 · 터치)
  pDown(x, y) {
    if (inR(x, y, this.SKIP)) { this.skipAll(); return; }
    if (inR(x, y, this.AUTO)) { this.auto = !this.auto; Sfx.play('ui', 0.5); return; }
    if (this.t >= 8) this.next();
  },
  wrap(ctx, str, maxW) {
    const out = []; let line = '';
    for (const ch of str) {
      if (ch === '\n') { out.push(line); line = ''; continue; }
      if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch === ' ' ? '' : ch; } else line += ch;
    }
    out.push(line); return out;
  },
  draw(ctx) {
    const L = this.cur(); if (!L) return;
    if (this.mode === 'cg') { CG.draw(ctx, this.cg); this.drawCaption(ctx, L); this.drawButtons(ctx); return; }
    const C = CAST[L.who], narr = L.who === 'narr', side = C ? C.side : 0;
    const bx = 70, by = H - 178, bw = W - 140, bh = 156, a = Math.min(1, this.t / 8);
    ctx.save(); ctx.globalAlpha = a;
    // 위아래 검은 띠
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 64 * a);
    const gr = ctx.createLinearGradient(0, by - 30, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = gr; ctx.fillRect(0, by - 30, W, H - by + 30);
    // 창
    const pg = ctx.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, 'rgba(22,24,38,0.94)'); pg.addColorStop(1, 'rgba(8,9,16,0.96)');
    ctx.fillStyle = pg; roundRect(ctx, bx, by, bw, bh, 16); ctx.fill();
    ctx.strokeStyle = narr ? 'rgba(200,200,220,0.35)' : 'rgba(201,165,92,0.75)'; ctx.lineWidth = 2; ctx.stroke();
    let tx = bx + 34, tw = bw - 68;
    if (!narr && C) {
      const px = side ? bx + bw - 96 : bx + 96, py = by + bh / 2 - 4;
      Por.draw(ctx, L.who, L.face, px, py, 62, side === 1);
      if (side) { tx = bx + 34; tw = bw - 230; } else { tx = bx + 190; tw = bw - 230; }
      // 이름표
      const nm = castName(L.who);
      ctx.font = `20px ${FONT_T}`; const nw = ctx.measureText(nm).width + 34, nx = side ? bx + bw - 190 - nw : tx - 6;
      ctx.fillStyle = 'rgba(10,10,16,0.95)'; roundRect(ctx, nx, by - 18, nw, 34, 10); ctx.fill();
      ctx.strokeStyle = C.col; ctx.lineWidth = 2; ctx.stroke();
      UI.text(ctx, nm, nx + nw / 2, by - 1, { size: 20, align: 'center', fill: C.col, stroke: 3 });
    }
    // 본문 (타자기)
    const full = fillName(L.text), str = Array.from(full).slice(0, Math.floor(this.shown)).join('');
    ctx.font = `700 ${narr ? 21 : 22}px ${FONT_B}`;
    const lines = this.wrap(ctx, str, tw);
    lines.slice(0, 4).forEach((ln, i) => UI.text(ctx, ln, narr ? W / 2 : tx, by + 42 + i * 34, { size: narr ? 21 : 22, align: narr ? 'center' : 'left', font: FONT_B, weight: 700, fill: narr ? '#d8dcec' : '#f4f1ea', italic: narr }));
    if (this.shown >= full.length && this.t % 40 < 26) UI.text(ctx, '▼', bx + bw - (side && !narr ? 210 : 34), by + bh - 22, { size: 16, align: 'center', fill: '#ffd87a' });
    ctx.restore();
    this.drawButtons(ctx);
  },
  drawCaption(ctx, L) {
    const full = fillName(L.text), str = Array.from(full).slice(0, Math.floor(this.shown)).join('');
    const gr = ctx.createLinearGradient(0, H - 200, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = gr; ctx.fillRect(0, H - 200, W, 200);
    ctx.font = `700 24px ${FONT_B}`;
    const lines = this.wrap(ctx, str, W - 240);
    const who = L.who !== 'narr' && CAST[L.who] ? castName(L.who) : null;
    if (who) UI.text(ctx, who, W / 2, H - 132, { size: 19, align: 'center', fill: CAST[L.who].col, stroke: 3 });
    lines.slice(0, 3).forEach((ln, i) => UI.text(ctx, ln, W / 2, H - 98 + i * 34, { size: 24, align: 'center', font: FONT_B, weight: 700, fill: '#f4f1ea', stroke: 4 }));
  },
  drawButtons(ctx) {
    for (const [r, lab, on] of [[this.AUTO, '자동', this.auto], [this.SKIP, Touch.on ? '건너뛰기 ▶▶' : `건너뛰기 [${Input.padActive ? 'START' : 'ESC'}]`, false]]) {
      ctx.fillStyle = on ? 'rgba(60,46,14,0.92)' : 'rgba(10,10,16,0.75)'; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
      ctx.strokeStyle = on ? '#ffd24a' : 'rgba(200,200,220,0.4)'; ctx.lineWidth = 1.6; ctx.stroke();
      UI.text(ctx, lab, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 15, align: 'center', fill: on ? '#ffe9a6' : '#c8cce0', stroke: 3 });
    }
    if (!Touch.on && this.mode === 'talk') UI.text(ctx, Input.padActive ? 'A 다음   B 자동' : '클릭 · J · Enter 다음   Z 자동', W - 80, H - 12, { size: 12, align: 'right', font: FONT_B, weight: 700, fill: 'rgba(200,205,225,0.6)' });
  },
};

// ---------- 일러스트 : img/story/cg/번호.webp  (없으면 색과 글자로 대신 그린다) ----------
const CG = {
  imgs: {},
  img(n) {
    let s = this.imgs[n];
    if (!s) { s = this.imgs[n] = { ok: false, img: new Image() }; s.img.onload = () => { s.ok = true; }; s.img.onerror = () => { s.bad = true; }; s.img.src = 'img/story/cg/' + n + '.webp?v=' + (typeof BUILD !== 'undefined' ? BUILD : '1'); }
    return s;
  },
  // 그림이 없을 때의 대체 화면 : 번호별 색과 상징
  FALLBACK: {
    1: ['#0a1420', '#2a4256', '비 오는 해안'], 2: ['#1a0806', '#5a2410', '불탄 마을'], 3: ['#2a0a04', '#ff7a30', '축제의 밤'],
    4: ['#141a2a', '#c9b48a', '서임식'], 5: ['#0d1a30', '#ffd070', '멈춘 시계탑'], 6: ['#200404', '#ff5a30', '불타는 왕도'],
    7: ['#0a0a14', '#8a70c0', '비 오는 밤'], 8: ['#03202a', '#7ae0ff', '봉인의 원형'], 9: ['#1a1a2a', '#ffffff', '봉인 의식'],
    10: ['#100818', '#c8a8ff', '오르벤'], 11: ['#0a0414', '#ff60c0', '망각의 왕좌'], 12: ['#0a1420', '#9fc4d8', '다시, 해안'],
    13: ['#0a0414', '#ffd070', '옥좌'], 14: ['#0a1420', '#9fefff', '작별'], 15: ['#000000', '#ffffff', '소멸'], 16: ['#1a0c06', '#ffb060', '축제'],
  },
  draw(ctx, c) {
    const s = this.img(c.n), t = c.t, z = 1.04 + t * 0.00012;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (s.ok) {
      const im = s.img, sc = Math.max(W / im.width, H / im.height) * z;
      ctx.drawImage(im, W / 2 - im.width * sc / 2 - t * 0.04, H / 2 - im.height * sc / 2, im.width * sc, im.height * sc);
    } else {
      const F = this.FALLBACK[c.n] || ['#000', '#888', ''];
      const g = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.5, W * 0.7);
      g.addColorStop(0, mixHex(F[1], F[0], 0.55)); g.addColorStop(1, F[0]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 40; i++) { const px = (i * 173.3 + t * (0.2 + (i % 5) * 0.05)) % W, py = (i * 97.1 + Math.sin(t * 0.01 + i) * 20) % (H - 200); drawGlow(ctx, px, py, 3 + (i % 4), '255,255,255', 0.12); }
      ctx.restore();
      UI.text(ctx, F[2], W / 2, H * 0.4, { size: 64, align: 'center', fill: mixHex(F[1], '#ffffff', 0.3), stroke: 6, italic: true });
      UI.text(ctx, '(일러스트 자리)', W / 2, H * 0.4 + 52, { size: 15, align: 'center', font: FONT_B, weight: 700, fill: 'rgba(255,255,255,0.35)' });
    }
    ctx.drawImage(UI.vignette, 0, 0);
  },
};

// ---------- 장 제목 · 화면 효과 ----------
const Scr = {
  title: null, bars: 0, barsT: 0, mem: 0, memT: 0, fadeA: 0, fadeT: 0, fadeV: 0,
  update() {
    if (this.title) { this.title.t++; if (this.title.t > this.title.life) this.title = null; }
    this.bars = approach(this.bars, this.barsT, 0.06);
    this.mem = approach(this.mem, this.memT, 0.02);
    if (this.fadeV) { this.fadeA = clamp(this.fadeA + this.fadeV, 0, 1); if (this.fadeA <= 0 || this.fadeA >= 1) this.fadeV = 0; }
  },
  reset() { this.title = null; this.bars = this.barsT = 0; this.fadeA = 0; this.fadeV = 0; },
  // 기억 속 화면 : 색을 빼고 금빛을 얹는다
  drawMem(ctx) {
    if (this.mem < 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = this.mem * 0.85; ctx.fillStyle = 'hsl(0,0%,50%)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = this.mem * 0.55; ctx.fillStyle = '#e8b860'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = this.mem * 0.5;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(1, 'rgba(255,230,170,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 금 간 유리
    ctx.strokeStyle = 'rgba(255,225,150,0.5)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, r0 = 260 + (i % 3) * 60; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * 0.6); ctx.lineTo(W / 2 + Math.cos(a + 0.12) * (r0 + 200), H / 2 + Math.sin(a + 0.2) * (r0 + 200) * 0.6); ctx.lineTo(W / 2 + Math.cos(a - 0.05) * (r0 + 420), H / 2 + Math.sin(a + 0.1) * (r0 + 420) * 0.6); ctx.stroke(); }
    ctx.restore();
  },
  draw(ctx) {
    if (this.bars > 0.01) { const h = 72 * E.out3(this.bars); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
    if (this.fadeA > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0, 0, W, H); }                      // 암전 위에도 제목은 보인다 (엔딩)
    if (this.title) {
      const T = this.title, t = T.t, a = Math.min(1, t / 30, (T.life - t) / 30);
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, H / 2 - 90, W, 180);
      const lw = 520 * E.out3(Math.min(1, t / 40));
      const gl = ctx.createLinearGradient(W / 2 - lw, 0, W / 2 + lw, 0); gl.addColorStop(0, 'rgba(255,220,150,0)'); gl.addColorStop(0.5, 'rgba(255,220,150,0.9)'); gl.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = gl; ctx.fillRect(W / 2 - lw, H / 2 + 34, lw * 2, 2); ctx.fillRect(W / 2 - lw, H / 2 - 62, lw * 2, 1);
      if (T.small) UI.text(ctx, T.small, W / 2, H / 2 - 36, { size: 22, align: 'center', fill: '#e8d6b0', stroke: 4 });
      UI.text(ctx, T.big, W / 2, H / 2 + 6, { size: 58, align: 'center', fill: '#fff6dc', stroke: 7, italic: true });
      ctx.restore();
    }
  },
};

// ---------- 선택지 (엔딩 분기) ----------
const Choice = {
  on: false, opts: null, sel: 0, cb: null, t: 0,
  open(opts, cb) { this.on = true; this.opts = opts; this.sel = 0; this.cb = cb; this.t = 0; this.prev = Game.state; Game.state = 'talk'; Input.clear(); },
  rect(i) { const n = this.opts.length; return { x: W / 2 - 300, y: H / 2 - n * 40 + i * 80, w: 600, h: 62 }; },
  pick(i) { this.on = false; Game.state = this.prev === 'talk' ? 'play' : this.prev; Sfx.play('select'); const cb = this.cb; this.cb = null; Input.clear(); cb(i); },
  update() {
    this.t++;
    if (this.t < 20) { Input.clear(); return; }
    for (const q of Input.drain()) {
      if (q.a === 'up' || q.a === 'left') { this.sel = (this.sel + this.opts.length - 1) % this.opts.length; Sfx.play('ui', 0.6); }
      else if (q.a === 'down' || q.a === 'right') { this.sel = (this.sel + 1) % this.opts.length; Sfx.play('ui', 0.6); }
      else if (q.a === 'attack' || q.a === 'confirm' || q.a === 'jump') { this.pick(this.sel); return; }
    }
  },
  pDown(x, y) { if (this.t < 20) return; for (let i = 0; i < this.opts.length; i++) if (inR(x, y, this.rect(i))) { if (this.sel === i) this.pick(i); else this.sel = i; return; } },
  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    this.opts.forEach((o, i) => {
      const r = this.rect(i), on = i === this.sel, k = 0.5 + Math.sin(Game.time * 0.1) * 0.5;
      ctx.fillStyle = on ? 'rgba(50,38,14,0.95)' : 'rgba(12,12,20,0.9)'; roundRect(ctx, r.x, r.y, r.w, r.h, 14); ctx.fill();
      ctx.strokeStyle = on ? `rgba(255,${200 + k * 40 | 0},100,1)` : 'rgba(200,200,220,0.35)'; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      UI.text(ctx, o, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 24, align: 'center', fill: on ? '#ffe9a6' : '#c8cce0', stroke: 4 });
    });
  },
};

// ============================================================
//  대본 실행기
// ============================================================
// 대본 좌표 : 숫자는 월드 x, '+300' 같은 문자열은 주인공 기준
const rx = v => (typeof v === 'string' ? (Game.player ? Game.player.x : 0) + parseFloat(v) : v);
const Cine = {
  q: null, i: 0, wait: 0, block: null, done: null, actors: {}, camX: null, skipping: false, running: false,

  reset() { this.q = null; this.running = false; this.actors = {}; this.camX = null; this.block = null; Bubbles.list = []; Scr.reset(); Talk.on = false; Choice.on = false; },
  run(cmds, done) {
    if (!cmds || !cmds.length) { if (done) done(); return; }
    this.q = cmds.slice();                                          // 복사본 : 실행 중에 끼워 넣는 명령이 원본 대본을 바꾸지 않게
    this.i = 0; this.wait = 0; this.block = null; this.done = done || null; this.skipping = false; this.running = true;
    this.prevState = Game.state === 'cine' || Game.state === 'talk' ? 'play' : Game.state;
    if (Game.player && Game.state !== 'smap') Game.player.setState('cine');
    Game.state = 'cine';
    this.step();
  },
  finish() {
    this.running = false; this.q = null; this.camX = null; Scr.barsT = 0;
    if (Game.state === 'cine') Game.state = this.prevState || 'play';
    const p = Game.player; if (p && p.state === 'cine' && Game.state === 'play') { p.setState('ground'); p.vx = 0; }
    const d = this.done; this.done = null; if (d) d();
  },
  // 명령을 하나씩 처리한다. 기다려야 하는 명령을 만나면 멈춘다.
  step() {
    while (this.running && this.i < this.q.length && !this.block && this.wait <= 0) {
      const c = this.q[this.i++];
      this.exec(c);
    }
    if (this.running && this.i >= this.q.length && !this.block && this.wait <= 0) this.finish();
  },
  exec(c) {
    const k = c[0], sk = this.skipping;
    switch (k) {
      case 't': case 'n': {                                   // 이어진 대사를 한 번에 묶는다
        const lines = [];
        let j = this.i - 1;
        while (j < this.q.length && (this.q[j][0] === 't' || this.q[j][0] === 'n')) {
          const q = this.q[j];
          if (q[0] === 'n') lines.push({ who: 'narr', text: q[1] });
          else { const [who, face] = q[1].split(':'); lines.push({ who, face, text: q[2] }); }
          j++;
        }
        this.i = j;
        if (sk) break;
        this.block = 'talk';
        Talk.open(lines, () => { this.block = null; Game.state = 'cine'; });
        break;
      }
      case 'cg': {
        if (sk) break;
        const lines = (c[2] || ['']).map(s => (typeof s === 'string' ? { who: 'narr', text: s } : { who: s[0], text: s[1] }));
        this.block = 'talk';
        Talk.open(lines, () => { this.block = null; Game.state = 'cine'; }, { n: c[1], t: 0 });
        break;
      }
      case 'say': if (!sk) Bubbles.add(c[1], c[2], c[3] || 150); break;
      case 'wait': if (!sk) this.wait = c[1]; break;
      case 'cam': this.camX = c[1] == null ? null : rx(c[1]); break;
      case 'actor': { const a = this.actors[c[1]] = new Actor(c[1], c[2], rx(c[3]), c[4], c[5] || {}); if (c[5] && c[5].alpha != null) a.alpha = c[5].alpha; break; }
      case 'walk': {
        const a = c[1] === 'hero' ? null : this.actors[c[1]];
        if (c[1] === 'hero') { this.heroT = rx(c[2]); this.heroSpd = c[4] || 3.2; if (sk) { Game.player.x = this.heroT; this.heroT = null; } else this.block = c[5] === false ? null : 'hero'; }
        else if (a) { a.tx = rx(c[2]); a.ty = c[3] ?? a.y; a.spd = c[4] || 3; if (sk) { a.x = a.tx; a.y = a.ty; a.tx = null; } else if (c[5] !== false) this.block = 'walk:' + c[1]; }
        break;
      }
      case 'face': if (c[1] === 'hero') Game.player.facing = c[2]; else if (this.actors[c[1]]) this.actors[c[1]].facing = c[2]; break;
      case 'anim': if (this.actors[c[1]]) this.actors[c[1]].anim = c[2]; else if (c[1] === 'hero') Game.player.play(c[2], 4, 1, true); break;
      case 'fadeActor': if (this.actors[c[1]]) this.actors[c[1]].fadeTo = c[2]; break;
      case 'del': delete this.actors[c[1]]; break;
      case 'lien': if (c[1] === 'show') { if (!Lien.on) { Lien.on = true; Lien.reset(); } Lien.glow = 1; } else if (c[1] === 'hide') Lien.on = false; else if (c[1] === 'glow') Lien.glow = 1; break;
      case 'shake': if (!sk) Game.addShake(c[1]); break;
      case 'flash': if (!sk) Game.flashScreen(c[1], c[2]); break;
      case 'fade': Scr.fadeV = c[1] === 'out' ? 1 / (c[2] || 30) : -1 / (c[2] || 30); if (sk) Scr.fadeA = c[1] === 'out' ? 1 : 0; else this.wait = c[2] || 30; break;
      case 'title': if (!sk) { Scr.title = { big: c[1], small: c[2], t: 0, life: c[3] || 170 }; this.wait = c[4] ?? 120; } break;
      case 'name': this.block = 'name'; this.askName(); break;
      case 'music': if (c[1]) Music.play(c[1]); else Music.stop(); break;
      case 'sfx': if (!sk) Sfx.play(c[1], c[2] || 1, c[3] || 1); break;
      case 'bars': Scr.barsT = c[1] ? 1 : 0; break;
      case 'mem': Scr.memT = c[1] ? 1 : 0; if (sk || c[2]) Scr.mem = Scr.memT; break;
      case 'fn': c[1](); break;
      case 'choice': this.block = 'choice'; Choice.open(c[1], i => { this.block = null; Game.state = 'cine'; c[2](i); }); break;
      case 'notice': Game.notice(fillName(c[1])); break;
      case 'big': if (!sk) Game.bigText(fillName(c[1]), c[2] || '#fff8d0', c[3] || '#ffb020', c[4] || 250, c[5] || 56); break;
    }
  },
  askName() {
    const h = document.getElementById('nbTitle'), p = h && h.nextElementSibling, old = [h && h.textContent, p && p.textContent];
    if (h) h.textContent = '이름'; if (p) p.textContent = '기억나는 단 하나의 것. 이야기 속에서 불릴 이름이에요. (최대 12자)';
    Nick.ask();
    this.nameWait = () => { if (Nick.open) return false; if (!Save.data.nick) { Save.data.nick = '카엘'; Save.save(); } if (h) h.textContent = old[0]; if (p) p.textContent = old[1]; return true; };
  },
  // 매 프레임 (월드가 도는 중에)
  tick() {
    Bubbles.update(); Scr.update();
    for (const id in this.actors) { const a = this.actors[id]; if (a.fadeTo != null) { a.alpha = approach(a.alpha, a.fadeTo, 0.03); } a.update(); }
    if (!this.running) return;
    if (Game.state === 'cine' && Input.take('pause')) this.skip();
    const p = Game.player;
    if (this.heroT != null && p) {                                   // 주인공 걷기
      const dx = this.heroT - p.x;
      if (Math.abs(dx) < this.heroSpd + 1) { p.x = this.heroT; p.vx = 0; this.heroT = null; p.play('idle', 6); if (this.block === 'hero') this.block = null; }
      else { p.vx = sign(dx) * this.heroSpd; p.facing = sign(dx); p.play(this.heroSpd > 4 ? 'run' : 'walk', 4); }
    }
    if (this.block && this.block.startsWith('walk:')) { const a = this.actors[this.block.slice(5)]; if (!a || a.tx == null) this.block = null; }
    if (this.block === 'name' && this.nameWait && this.nameWait()) { this.block = null; this.nameWait = null; }
    if (this.wait > 0) this.wait--;
    if (!this.block && this.wait <= 0) this.step();
  },
  skip() {
    this.skipping = true; this.wait = 0;
    Bubbles.list = []; Scr.title = null;
    if (this.block && this.block.startsWith('walk:')) { const a = this.actors[this.block.slice(5)]; if (a && a.tx != null) { a.x = a.tx; a.y = a.ty; a.tx = null; } this.block = null; }
    if (this.block === 'hero') { Game.player.x = this.heroT; this.heroT = null; this.block = null; }
    for (const id in this.actors) { const a = this.actors[id]; if (a.tx != null) { a.x = a.tx; a.y = a.ty; a.tx = null; } }
    if (!this.block) this.step();
  },
  drawWorld(ctx) {                                                 // 월드 좌표 (깊이 정렬은 Story 쪽)
    Bubbles.draw(ctx);
  },
  list() { return Object.values(this.actors); },
  // 포인터 : 건너뛰기 버튼
  pDown(x, y) { if (inR(x, y, Talk.SKIP)) this.skip(); },
  drawSkip(ctx) {
    if (!this.running || Game.state !== 'cine') return;
    const r = Talk.SKIP;
    ctx.fillStyle = 'rgba(10,10,16,0.7)'; roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(200,200,220,0.35)'; ctx.lineWidth = 1.4; ctx.stroke();
    UI.text(ctx, Touch.on ? '건너뛰기 ▶▶' : `건너뛰기 [${Input.padActive ? 'START' : 'ESC'}]`, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 15, align: 'center', fill: '#c8cce0', stroke: 3 });
  },
};
