// BLADE RAID promo v3 : 2D 합성 도우미 (자막 / 파티클 / 전환 / 프레임 루프)
(() => {
  'use strict';
  const V = window.__V, FW = 1920, FH = 1080, lerp = V.lerp, clamp = V.clamp, sat = V.sat, E = V.E;
  const mk = () => { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; };
  const PRE = V.PRE = V.PRE || mk(), PREV = V.PREV = V.PREV || mk(), OUT = V.OUT = V.OUT || mk(), TMP = V.TMP = V.TMP || mk();
  const pc = V.pc = PRE.getContext('2d'), oc = V.oc = OUT.getContext('2d'), tc = V.tc = TMP.getContext('2d');
  const TXT = V.TXT = V.TXT || mk(), xc = V.xc = TXT.getContext('2d');
  V.preF = -1; V.ev = V.ev || {};
  const FT = () => FONT_T, FB = () => FONT_B;
  const rgba = (c, a) => `rgba(${c},${a})`;
  V.rgbf = c => c.split(',').map(v => +v / 255);

  // ---------- 숫자 떼 줄이기 ----------
  if (!DmgText.prototype.__v3) {
    const _dd = DmgText.prototype.draw;
    DmgText.prototype.draw = function (ctx) {
      if (this.__hide) return;
      const s = V.dmgScale || 1;
      if (s !== 1) { ctx.save(); ctx.translate(this.x, this.y); ctx.scale(s, s); ctx.translate(-this.x, -this.y); _dd.call(this, ctx); ctx.restore(); } else _dd.call(this, ctx);
    };
    DmgText.prototype.__v3 = true;
  }
  if (!Label.prototype.__v3) { const _ld = Label.prototype.draw; Label.prototype.draw = function (ctx) { if (/HIT!?$/.test(String(this.str))) return; _ld.call(this, ctx); }; Label.prototype.__v3 = true; }
  const MC = document.createElement('canvas'); MC.width = 240; MC.height = 135; const mg = MC.getContext('2d', { willReadFrequently: true });
  const MC2 = document.createElement('canvas'); MC2.width = 32; MC2.height = 18; const mg2 = MC2.getContext('2d', { willReadFrequently: true });
  V.meter = () => { mg.drawImage(V.PRE, 0, 0, 240, 135); mg2.drawImage(MC, 0, 0, 32, 18); const d = mg2.getImageData(0, 0, 32, 18).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722) / 255; return s / 576; };
  V.capDmg = n => {
    const ds = FX.top.filter(e => e instanceof DmgText);
    let vis = 0; for (const d of ds) if (d.__dec && !d.__hide) vis++;
    const fresh = ds.filter(d => !d.__dec).sort((a, b) => b.val - a.val);
    for (const d of fresh) { d.__dec = 1; d.__hide = vis >= n; if (!d.__hide) vis++; }
  };

  // ---------- 글자 ----------
  V.T = (ctx, str, x, y, o = {}) => {
    ctx.save();
    ctx.font = `${o.italic === false ? '' : 'italic '}${o.weight || ''} ${o.size || 40}px ${o.font || FT()}`;
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    try { ctx.letterSpacing = (o.ls || 0) + 'px'; } catch (e) {}
    if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(str, x + (o.sx ?? 6), y + (o.sy ?? 6)); if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.shadow; ctx.strokeText(str, x + (o.sx ?? 6), y + (o.sy ?? 6)); } }
    if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.sc || '#05060a'; ctx.strokeText(str, x, y); }
    if (o.fill !== null) { ctx.fillStyle = o.fill || '#fff'; ctx.fillText(str, x, y); }
    ctx.restore();
  };
  V.grad = (ctx, y0, y1, cols) => { const g = ctx.createLinearGradient(0, y0, 0, y1); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c)); return g; };
  V.tw = (ctx, str, size, font, ls) => { ctx.save(); ctx.font = `italic ${size}px ${font || FT()}`; try { ctx.letterSpacing = (ls || 0) + 'px'; } catch (e) {} const w = ctx.measureText(str).width; ctx.restore(); return w; };
  // 기울어진 띠
  V.para = (ctx, x, y, w, h, sk, fill) => { ctx.beginPath(); ctx.moveTo(x + sk, y); ctx.lineTo(x + w + sk, y); ctx.lineTo(x + w - sk, y + h); ctx.lineTo(x - sk, y + h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };

  // 큰 슬램 자막 : 커다랗게 떨어져 박힌다 + 잔상 외곽선
  V.slam = (ctx, str, age, o = {}) => {
    const dur = o.dur || 60; if (age < 0 || age >= dur) return;
    const e = E.out5(sat(age / (o.inF || 8))), tout = sat((dur - age) / (o.outF || 7));
    const s = lerp(o.pop || 2.4, 1, e) * (1 + 0.0009 * age), a = Math.min(1, 0.35 + age / 3) * tout;
    const size = o.size || 150, col = o.col || '255,210,90';
    ctx.save(); ctx.translate(o.x ?? 960, o.y ?? 540); ctx.rotate(o.rot ?? -0.04); ctx.scale(s, s);
    for (let k = 1; k <= 3; k++) {                       // 잔상 외곽선
      const ea = age - k * 2; if (ea < 0 || ea > 16) continue;
      const es = 1 + ea * 0.035 * k; ctx.save(); ctx.scale(es, es); ctx.globalAlpha = a * (1 - ea / 16) * 0.55;
      V.T(ctx, str, 0, 0, { size, fill: null, stroke: 3, sc: rgba(col, 1), ls: o.ls }); ctx.restore();
    }
    ctx.globalAlpha = a;
    const fill = o.fill || V.grad(ctx, -size * 0.5, size * 0.45, ['#ffffff', '#ffffff', rgba(col, 1)]);
    V.T(ctx, str, 0, 0, { size, fill, stroke: Math.max(8, size * 0.085), sc: '#07080d', shadow: rgba(col, 0.9), sx: size * 0.045, sy: size * 0.05, ls: o.ls });
    if (age < 5) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - age / 5) * 0.9; V.T(ctx, str, 0, 0, { size, fill: '#fff', ls: o.ls }); }
    ctx.restore();
  };
  // 통계 자막 : 큰 숫자 + 한글 단위 + 영문 캡션 (왼쪽/오른쪽 정렬)
  V.stat = (ctx, age, o) => {
    const dur = o.dur || 90; if (age < 0 || age >= dur) return;
    const e = E.out5(sat(age / 9)), tout = E.out3(sat((dur - age) / 7)), col = o.col || '255,210,90', R = o.right;
    const x = o.x ?? (R ? 1810 : 110), y = o.y ?? 200, dir = R ? -1 : 1;
    const num = String(o.count ? Math.round(lerp(0, o.num, E.out3(sat(age / 16)))) : o.num) + (o.plus && age > 14 ? '+' : '');
    ctx.save(); ctx.globalAlpha = tout; ctx.translate(x + dir * (1 - e) * -260, y); ctx.rotate(-0.05);
    const nw = V.tw(ctx, num, 250), uw = V.tw(ctx, o.unit, 96);
    const tot = nw + 18 + uw;
    // 띠
    ctx.save(); ctx.globalAlpha = tout * 0.92; const bw = (tot + 150) * E.out5(sat(age / 7));
    V.para(ctx, R ? -bw + 60 : -60, 34, bw, 62, 16, rgba(col, 1));
    V.para(ctx, R ? -bw * 0.7 + 60 : -60, 104, bw * 0.7, 8, 4, '#ffffff'); ctx.restore();
    const nx = R ? -tot : 0;
    const sc = lerp(1.9, 1, e);
    ctx.save(); ctx.translate(nx + nw / 2, -40); ctx.scale(sc, sc);
    V.T(ctx, num, 0, 0, { size: 250, fill: V.grad(ctx, -120, 110, ['#ffffff', '#fff6d8', rgba(col, 1)]), stroke: 20, sc: '#06070c', shadow: rgba(col, 0.85), sx: 10, sy: 11 });
    ctx.restore();
    V.T(ctx, o.unit, nx + nw + 18, -6, { size: 96, align: 'left', fill: '#ffffff', stroke: 13, sc: '#06070c' });
    V.T(ctx, o.en, R ? -6 : 6, 66, { size: 34, align: R ? 'right' : 'left', fill: '#0a0b10', ls: 7, font: FT() });
    if (age < 5) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - age / 5) * 0.8; V.T(ctx, num, nx + nw / 2, -40, { size: 250, fill: '#fff' }); }
    ctx.restore();
  };
  // 스킬 이름표 (아래쪽)
  V.tag = (ctx, age, dur, o) => {
    if (age < 0 || age >= dur) return;
    const e = E.out5(sat(age / 8)), tout = E.out3(sat((dur - age) / 5)), col = o.col || '255,210,90', R = o.right;
    const w1 = V.tw(ctx, o.name, 62), w2 = V.tw(ctx, o.sub || '', 30, FB());
    const w = Math.max(w1, w2 + 40) + 90, x0 = R ? FW - 90 - w : 90, y = o.y ?? 905;
    ctx.save(); ctx.globalAlpha = tout; ctx.translate((R ? 1 : -1) * (1 - e) * 220, 0);
    if (o.scale) { const px = R ? FW - 90 : 90; ctx.translate(px, y + 60); ctx.scale(o.scale, o.scale); ctx.translate(-px, -(y + 60)); }
    ctx.save(); ctx.globalAlpha = tout * 0.82; V.para(ctx, x0 - 24, y - 44, w * e, 104, 18, 'rgba(6,7,12,0.92)'); ctx.restore();
    V.para(ctx, R ? x0 + w - 26 : x0 - 30, y - 44, 14, 104, 18, rgba(col, 1));
    V.para(ctx, R ? x0 + w - 48 : x0 - 8, y - 44, 5, 104, 18, '#ffffff');
    const tx = R ? x0 + w - 70 : x0 + 30;
    V.T(ctx, o.name, tx, y - 6, { size: 62, align: R ? 'right' : 'left', fill: V.grad(ctx, y - 40, y + 24, ['#ffffff', '#ffffff', rgba(col, 1)]), stroke: 9, sc: '#05060a' });
    if (o.sub) V.T(ctx, o.sub, tx + (R ? -4 : 4), y + 40, { size: 28, align: R ? 'right' : 'left', italic: false, weight: 700, font: FB(), fill: rgba(col, 1), stroke: 5, sc: '#05060a', ls: 2 });
    if (o.kick) V.T(ctx, o.kick, tx + (R ? -4 : 4), y - 62, { size: 24, align: R ? 'right' : 'left', fill: '#ffffff', stroke: 5, sc: '#05060a', ls: 6 });
    ctx.restore();
  };

  // ---------- 파티클 / 빛 ----------
  const HP = []; { const r = V.mul(4242); for (let i = 0; i < 260; i++) HP.push([r(), r(), r(), r(), r(), r()]); }
  // 불티 : 프레임만으로 위치가 정해진다 (상태 없음)
  V.embers = (ctx, F, o = {}) => {
    const n = o.n || 90, col = o.col || '255,170,80', a0 = o.a ?? 0.8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const h = HP[i % HP.length], sp = (0.6 + h[2] * 1.8) * (o.speed || 1), ph = (F * sp * 0.0042 + h[1] * 7) % 1;
      const x = ((h[0] * FW + Math.sin(F * 0.02 + h[3] * 30) * 60 + F * (o.wind || 0.6) * (0.4 + h[4])) % (FW + 200)) - 100, y = FH + 40 - ph * (FH + 120);
      const r = (1.6 + h[4] * 5) * (o.size || 1), al = a0 * Math.sin(ph * Math.PI) * (0.35 + 0.65 * h[5]);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, rgba(i % 5 === 0 ? '255,255,255' : col, al)); g.addColorStop(0.3, rgba(col, al * 0.5)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    }
    ctx.restore();
  };
  // 큰 보케
  V.bokeh = (ctx, F, o = {}) => {
    const n = o.n || 14, col = o.col || '255,200,120';
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const h = HP[(i * 7 + 13) % HP.length], x = (h[0] * 2400 + F * (0.4 + h[2] * 1.2) * (i % 2 ? 1 : -1) + 4800) % 2400 - 240, y = h[1] * FH + Math.sin(F * 0.013 + h[3] * 9) * 50, r = 40 + h[4] * 110, al = (o.a ?? 0.1) * (0.4 + 0.6 * Math.sin(F * 0.03 + h[5] * 20) ** 2);
      const g = ctx.createRadialGradient(x, y, r * 0.55, x, y, r); g.addColorStop(0, rgba(col, al)); g.addColorStop(0.85, rgba(col, al * 1.25)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  };
  // 빛샘 (모서리 색 번짐)
  V.leak = (ctx, F, col, a = 0.3, seed = 0) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const h = HP[(seed * 3 + i * 11) % HP.length], ang = F * 0.006 * (i % 2 ? 1 : -1) + h[0] * 6.283;
      const x = 960 + Math.cos(ang) * 1150, y = 540 + Math.sin(ang) * 700, r = 620 + h[1] * 300;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a * (0.6 + 0.4 * Math.sin(F * 0.05 + i)))); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
    }
    ctx.restore();
  };
  // 방사 집중선
  V.speed = (ctx, cx, cy, amt, F, col = '255,255,255', n = 70) => {
    if (amt <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy);
    const r = V.mul(1000 + F * 7);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.283, r0 = 330 + r() * 420, r1 = 1500, w = (0.004 + r() * 0.012) * (0.6 + amt);
      ctx.fillStyle = rgba(col, (0.12 + r() * 0.5) * amt);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a - w) * r1, Math.sin(a - w) * r1); ctx.lineTo(Math.cos(a + w) * r1, Math.sin(a + w) * r1); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  // 회전 광선
  V.rays = (ctx, cx, cy, F, col, a = 0.2, n = 14, R = 1500) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, cy);
    for (let i = 0; i < n; i++) {
      const ang = i / n * 6.283 + F * 0.004 + Math.sin(i * 12.9) * 0.2, w = 0.05 + 0.07 * Math.abs(Math.sin(i * 7.7));
      const g = ctx.createRadialGradient(0, 0, 60, 0, 0, R); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, ang - w, ang + w); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  // 렌즈 플레어 (가로 줄기 + 중심광)
  V.flare = (ctx, x, y, size, col, a = 1) => {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(x, y, 0, x, y, size); g.addColorStop(0, rgba('255,255,255', a)); g.addColorStop(0.25, rgba(col, a * 0.6)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - size, y - size, size * 2, size * 2);
    ctx.translate(x, y); ctx.scale(1, 0.035);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 5); g.addColorStop(0, rgba('255,255,255', a)); g.addColorStop(0.3, rgba(col, a * 0.7)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(-size * 5, -size * 5, size * 10, size * 10);
    ctx.restore();
  };
  V.ring = (ctx, x, y, r, w, col, a) => { if (a <= 0.01 || r <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.42, 0, 0, 6.283); ctx.stroke(); ctx.restore(); };
  V.dark = (ctx, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, FW, FH); ctx.restore(); };

  // ---------- 전환 ----------
  // 지금 PRE 에는 새 장면이 그려져 있다. 이전 컷의 마지막 화면(PREV)을 섞는다.
  V.TR = {
    slash: { n: 9, f(c, sf, L, o) {
      const t = E.out3((sf + 1) / 9), ang = o.ang ?? -1.02, dir = o.dir || 1, col = o.col || '255,255,255';
      const nx = Math.cos(ang), ny = Math.sin(ang), span = 1250, d = lerp(-span, span, t) * dir;      // 경계선 : 법선 방향으로 이동
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.clearRect(0, 0, FW, FH);
      tc.save(); tc.translate(960 + nx * d, 540 + ny * d); tc.rotate(ang);
      tc.beginPath(); tc.rect(dir > 0 ? 0 : -3000, -3000, 3000, 6000); tc.restore(); tc.save(); tc.clip();        // 아직 안 베인 쪽 = 이전 화면
      const push = (1 - t) * 0 + t * 60 * dir; tc.drawImage(PREV, nx * push, ny * push); tc.restore();
      pc.drawImage(TMP, 0, 0);
      pc.save(); pc.globalCompositeOperation = 'lighter'; pc.translate(960 + nx * d, 540 + ny * d); pc.rotate(ang);
      const a = Math.sin(Math.min(1, (sf + 1) / 9) * Math.PI) * 0.9 + 0.1;
      let g = pc.createLinearGradient(-90, 0, 90, 0); g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, 0.75 * a)); g.addColorStop(1, rgba(col, 0)); pc.fillStyle = g; pc.fillRect(-90, -2000, 180, 4000);
      pc.fillStyle = rgba('255,255,255', a); pc.fillRect(-7, -2000, 14, 4000); pc.restore();
      L.ca += 9 * (1 - t); L.rblur += 0.03 * (1 - t);
    } },
    whip: { n: 8, f(c, sf, L, o) {
      const t = E.io((sf + 1) / 8), dir = o.dir || 1, off = (1 - t) * FW * dir;
      tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.drawImage(PRE, 0, 0);
      pc.fillStyle = '#000'; pc.fillRect(0, 0, FW, FH);
      const v = Math.sin((sf + 1) / 8 * Math.PI);
      for (let k = 6; k >= 0; k--) {
        const o2 = off + dir * k * 46 * v; pc.globalAlpha = k === 0 ? 1 : 0.22;
        pc.drawImage(PREV, o2 - FW * dir, 0); pc.drawImage(TMP, o2, 0);
      }
      pc.globalAlpha = 1; L.ca += 12 * v; L.dist += 0.05 * v;
    } },
    zoom: { n: 9, f(c, sf, L, o) {
      const t = (sf + 1) / 9, e = E.out3(t);
      pc.save(); pc.globalAlpha = (1 - e) * 0.85; pc.translate(960, 540); const s = 1 + e * 1.3; pc.scale(s, s); pc.drawImage(PREV, -960, -540); pc.restore();
      L.rblur += 0.22 * (1 - e); L.zoom *= 1 + 0.16 * (1 - e); L.ca += 10 * (1 - e); L.flash += 0.22 * (1 - t) ** 2;
    } },
    flash: { n: 7, f(c, sf, L, o) { const t = (sf + 1) / 7; L.flash += 0.75 * (1 - t) ** 2; L.bloom += 1.2 * (1 - t); L.zoom *= 1 + 0.07 * (1 - E.out3(t)); L.ca += 8 * (1 - t); if (o.col) L.flashCol = V.rgbf(o.col); } },
    glitch: { n: 8, f(c, sf, L, o) {
      const t = (sf + 1) / 8, r = V.mul(c.f0 * 13 + sf);
      for (let k = 0; k < 9; k++) { if (r() < t) continue; const y = (r() * FH) | 0, h = 20 + (r() * 110) | 0, dx = (r() - 0.5) * 300 * (1 - t); pc.drawImage(PREV, 0, y, FW, h, dx, y, FW, h); }
      L.glitch += 1 - t; L.ca += 14 * (1 - t); L.scan += 0.25 * (1 - t);
    } },
    cut: { n: 5, f(c, sf, L, o) { const t = (sf + 1) / 5; L.zoom *= 1 + 0.05 * (1 - E.out3(t)); L.ca += 6 * (1 - t); L.bloom += 0.5 * (1 - t); } },
  };
  V.applyTrans = (c, sf, L) => {
    const tr = c.trans; if (!tr) return;
    const o = typeof tr === 'string' ? { type: tr } : tr, T = V.TR[o.type];
    if (!T || sf >= T.n) return;
    if (!V.prevOk && o.type !== 'flash' && o.type !== 'cut') { V.TR.flash.f(c, sf, L, o); return; }
    T.f(c, sf, L, o);
  };

  // ---------- 자동 렌즈 (게임 속 타격/섬광에 반응) ----------
  V.impT = 0; V.impLast = -999;
  V.autoLens = (c, sf, L) => {
    if (c.noAuto) return;
    const sh = Math.min(26, Math.max(Game.shakeA || 0, V.shPk || 0)), fl = Math.min(1, Game.flash || 0);
    L.rblur += Math.min(0.05, sh * 0.0018); L.ca += sh * 0.3; L.bloom += fl * 1.3 + sh * 0.012; L.expo += fl * 0.3;
    if (fl > 0.03) { L.flashCol = V.rgbf(Game.flashCol || '255,255,255'); L.flash += fl * 0.2; }
    if (c.impact && V.F - V.impLast > (c.impGap || 40) && sf > 3 && ((Game.freezeT || 0) >= (c.impFreeze || 6) || sh > (c.impShake || 15))) { V.impT = c.impLen || 4; V.impLast = V.F; V.note('impact', sh); }
    if (V.impT > 0) {
      const k = V.impT / (c.impLen || 4);
      L.impact = k > 0.5 ? 1 : 0.55; L.impA = c.impA || [0.03, 0.02, 0.07]; L.impB = c.impB || [1, 1, 1];
      L.rblur += 0.07 * k; L.ca += 9 * k; L.zoom *= 1 + 0.035 * k; L.grain += 0.05;
      V.impT--;
    }
  };
  V.note = (k, v) => { (V.ev[V.F] = V.ev[V.F] || []).push([k, v === undefined ? 0 : Math.round(v * 100) / 100]); };

  // ---------- 타임라인 ----------
  V.cutAt = F => { const C = V.CUTS; for (let i = C.length - 1; i >= 0; i--) if (F >= C[i].f0) return C[i]; return C[0]; };
  V.loadImg = src => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('img ' + src)); im.src = src; });
  V.frameName = F => 'f' + String(F).padStart(4, '0') + '.jpg';
  V.enterCut = async (c, F) => {
    // 이전 컷의 마지막 화면 확보
    V.prevOk = false;
    if (c.f0 > 0) {
      if (V.preF === c.f0 - 1) { PREV.getContext('2d').drawImage(PRE, 0, 0); V.prevOk = true; }
      else { try { const im = await V.loadImg(V.HOST + '/' + V.DIR + '/' + V.frameName(c.f0 - 1) + '?t=' + Date.now()); PREV.getContext('2d').drawImage(im, 0, 0, FW, FH); V.prevOk = true; } catch (e) {} }
    }
    V.cut = c; V.impT = 0; V.impLast = -999; V.dmgScale = 1;
    V.setRes(c.res || 1.5); if (!c.noPrep) V.prep();
    V.rng = V.mul(c.seed || (c.f0 * 7 + 11)); V.simRnd = V.mul((c.seed || c.f0) * 3 + 101); V.drawRnd = V.mul((c.seed || c.f0) * 5 + 303);
    Math.random = V.simRnd; V.gt = 0; V.acc = 0; V.st = {};
    for (let f = c.f0; f < c.f1; f++) delete V.ev[f];
    V.F = c.f0; V.note('cut', 0);
    if (c.enter) await c.enter(c);
  };
  V.DIR = 'frames3';
  V.frame = async (F, dry) => {
    const c = V.cutAt(F);
    if (c !== V.cut || F === c.f0) await V.enterCut(c, F);
    const sf = F - c.f0; V.F = F; V.sf = sf;
    Math.random = V.simRnd;
    V.shPk = 0;
    if (c.step) c.step(c, sf);
    if (c.camF) V.camTo(c.camF(c, sf), sf === 0);
    if (dry) return;
    Math.random = V.drawRnd;
    pc.setTransform(1, 0, 0, 1, 0, 0); pc.globalAlpha = 1; pc.globalCompositeOperation = 'source-over'; pc.imageSmoothingEnabled = true; pc.imageSmoothingQuality = 'high';
    const L = Object.assign({}, V.L0, { time: F / 60 });
    for (const k of ['streakTint', 'center', 'shake', 'tint', 'lift', 'impA', 'impB', 'flashCol']) L[k] = V.L0[k].slice();
    if (c.render) c.render(c, sf, pc, L);
    else { V.world(c.wo || {}); pc.drawImage(Game.canvas, 0, 0, FW, FH); }
    V.applyTrans(c, sf, L);
    if (c.over) c.over(c, sf, pc, L);
    if (c.text) c.text(c, sf, pc, L);
    if (V.gText) V.gText(F, pc, c, sf);
    if (c.over2) c.over2(c, sf, pc, L);
    if (V.gOver) V.gOver(F, pc, L, c, sf);
    V.autoLens(c, sf, L);
    if (c.lens) c.lens(c, sf, L);
    if (!c.noAE) {
      const m = V.meter(); V.lum = (sf === 0 || V.lum === undefined) ? m : lerp(V.lum, m, 0.4);
      const k = sat((V.lum - 0.3) / 0.38);
      L.thr = lerp(L.thr, 0.88, k); L.bloom *= lerp(1, 0.36, k); L.expo *= lerp(1, 0.93, k); L.streak *= lerp(1, 0.35, k); L.flash *= lerp(1, 0.45, k);
    }
    if (V.gLens) V.gLens(F, L);
    V.preF = F;
    V.lensRender(PRE, L);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1; oc.globalCompositeOperation = 'source-over'; oc.drawImage(V.glcv, 0, 0);
    const pa = sat(1 - L.flash * 1.3) * (1 - L.fade) * (L.impact > 0.5 ? 0 : 1) * (c.postA ? c.postA(c, sf) : 1);
    if (pa > 0.02 && (c.text || V.gText) && !c.noPostText) {
      xc.setTransform(1, 0, 0, 1, 0, 0); xc.globalAlpha = 1; xc.globalCompositeOperation = 'source-over'; xc.clearRect(0, 0, FW, FH);
      if (c.text) c.text(c, sf, xc, L, true);
      if (V.gText) V.gText(F, xc, c, sf, true);
      xc.setTransform(1, 0, 0, 1, 0, 0); xc.globalAlpha = 1; xc.globalCompositeOperation = 'source-over';
      oc.save(); oc.globalAlpha = pa; oc.translate(960 - L.shake[0] * L.zoom, 540 - L.shake[1] * L.zoom); oc.rotate(L.roll); oc.scale(L.zoom, L.zoom); oc.translate(-960, -540); oc.drawImage(TXT, 0, 0); oc.restore();
      if (L.bars > 0.001) { oc.fillStyle = '#000'; oc.fillRect(0, 0, FW, Math.ceil(L.bars * FH)); oc.fillRect(0, FH - Math.ceil(L.bars * FH), FW, Math.ceil(L.bars * FH)); }
    }
    if (c.post) c.post(c, sf, oc);
    if (V.gPost) V.gPost(F, oc, c, sf);
    Math.random = V.simRnd;
    if (V.noUpload) return;
    await V.post(V.DIR + '/' + V.frameName(F), OUT.toDataURL('image/jpeg', V.Q || 0.93));
  };
  V.run = async (f0, f1) => {
    if (V.busy) return 'busy';
    V.busy = true; V.err = null; V.stop = false; V.t0 = performance.now();
    try {
      const c0 = V.cutAt(f0); V.cut = null;
      for (let F = c0.f0; F < f1 && !V.stop; F++) { await V.frame(F, F < f0); V.done = F; }
    } catch (e) { V.err = String(e && e.stack || e); }
    V.busy = false; V.ms = Math.round(performance.now() - V.t0);
    return [V.done, V.err, V.ms];
  };
  // 한 장만 뽑아 보기 (컷 시작부터 건조 실행 후 그 프레임만 렌더, 업로드 경로 지정)
  V.still = async (F, name) => {
    const c0 = V.cutAt(F); V.cut = null; V.noUpload = true;
    try { for (let f = c0.f0; f <= F; f++) await V.frame(f, f < F); } finally { V.noUpload = false; }
    await V.post('test/' + (name || ('s' + F)) + '.jpg', OUT.toDataURL('image/jpeg', 0.9));
  };
  // 여러 프레임을 한 장의 시트로 (가로 cols 칸)
  V.sheet = async (frames, name, cols = 4) => {
    const tw = FW / cols, th = tw * 9 / 16, rows = Math.ceil(frames.length / cols);
    const cv = document.createElement('canvas'); cv.width = FW; cv.height = rows * th; const g = cv.getContext('2d');
    V.noUpload = true; V.cut = null;
    try {
      const sorted = frames.slice().sort((a, b) => a - b); let cur = -1;
      for (let i = 0; i < sorted.length; i++) {
        const F = sorted[i], c0 = V.cutAt(F);
        let start = (V.cut === c0 && cur >= c0.f0 && cur < F) ? cur + 1 : c0.f0;
        if (start === c0.f0) V.cut = null;
        for (let f = start; f <= F; f++) await V.frame(f, f < F);
        cur = F;
        const x = (i % cols) * tw, y = Math.floor(i / cols) * th;
        g.drawImage(OUT, x, y, tw, th);
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x, y, 150, 24); g.fillStyle = '#fff'; g.font = '700 17px sans-serif'; g.textBaseline = 'top'; g.fillText('F' + F + ' ' + c0.id + '+' + (F - c0.f0), x + 4, y + 3);
      }
    } finally { V.noUpload = false; }
    await V.post('test/' + name + '.jpg', await new Promise(r => r(cv.toDataURL('image/jpeg', 0.86))));
    return frames.length;
  };
})();
'fx ok';
