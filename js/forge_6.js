'use strict';
// ============================================================
//  검의 대장간 6 : w29 헥스 · w30 프리즘 · w31 사이버 · w32 드라고닉 팽 · w33 레퀴엠
// ============================================================

// ============================================================
//  저주검 헥스 : 낙인 문양 · 저주 폭발
// ============================================================
const HEX = '170,70,220';
function drawSigil(ctx, x, y, R, rot, a, lv) {
  //  저주 낙인 : 원 · 칠각 별 · 가운데 눈
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
  ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, 0, 0, R * 1.8, HEX, 0.5 + lv * 0.06); ctx.globalCompositeOperation = 'source-over';
  ctx.rotate(rot); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(225,170,255,0.95)';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R * 0.86, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i <= 7; i++) { const g = (i * 3) / 7 * TAU - Math.PI / 2; i ? ctx.lineTo(Math.cos(g) * R * 0.86, Math.sin(g) * R * 0.86) : ctx.moveTo(Math.cos(g) * R * 0.86, Math.sin(g) * R * 0.86); } ctx.stroke();
  for (let i = 0; i < Math.min(5, lv); i++) { const g = i / 5 * TAU - Math.PI / 2; ctx.fillStyle = '#f0c8ff'; ctx.beginPath(); ctx.arc(Math.cos(g) * R * 1.18, Math.sin(g) * R * 1.18, 2.6, 0, TAU); ctx.fill(); }
  ctx.rotate(-rot);
  ctx.fillStyle = '#1a0624'; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.42, R * 0.22, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e080ff'; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.1, R * 0.2, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
class FHexBrand {
  //  적 머리 위에 떠 있는 낙인 + 발밑에서 감아 오르는 그림자 사슬 (저주가 남아 있는 동안)
  constructor(e) { Object.assign(this, { e, t: 0, add: false }); }
  update() {
    this.t++; const e = this.e;
    if (!e.hittable() || !(e.curse > 0)) return false;
    if (this.t % 7 === 0) FX.add('world', new FP(e.x + rand(-e.w, e.w), sy(e.y, e.z + rand(0, e.h)), { kind: 'smoke', col: '60,10,80', vy: -1, r: rand(8, 12), grow: 0.3, life: 30 }));
    return true;
  }
  draw(ctx) {
    const e = this.e; if (!e.hittable()) return;
    const T = this.t, a = Math.min(1, T / 8), lv = Math.min(5, e.curse || 0), X = e.x, gy = sy(e.y, 0), top = sy(e.y, e.z + e.hurtH()) - 44 + Math.sin(T * 0.1) * 3;
    ctx.save(); ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(40,6,56,0.75)'; ctx.lineWidth = 3;                     // 사슬
    for (let s = 0; s < 2; s++) { ctx.beginPath(); for (let k = 0; k <= 12; k++) { const q = k / 12, ang = s * Math.PI + q * 7 + T * 0.05; ctx.lineTo(X + Math.cos(ang) * (e.w + 8), gy - q * e.hurtH() * Math.min(1, T / 12) + Math.sin(ang) * 4); } ctx.stroke(); }
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${HEX},0.25)`; ctx.beginPath(); ctx.ellipse(X, gy, e.w + 30, 10, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    drawSigil(ctx, X, top, 14 + lv * 2, T * 0.04, 1, lv);
    ctx.restore();
  }
}
function hexBrand(e) { if (!FX.world.some(f => f instanceof FHexBrand && f.e === e)) FX.add('world', new FHexBrand(e)); }

// ============================================================
//  수정검 프리즘 : 삼각 프리즘의 굴절 · 다면 수정 감옥
// ============================================================
const PRISM = '200,235,255', RAINBOW = ['255,80,90', '255,160,60', '255,235,90', '100,255,140', '90,200,255', '120,120,255', '200,110,255'];
class FPrismRay {
  //  칼끝 → 프리즘 → 세 갈래 무지개 광선
  constructor(p) { Object.assign(this, { p, t: 0, life: 26, add: true, d: p.facing, x: p.x, y: p.y }); }
  update() { return ++this.t < this.life; }
  draw(ctx) {
    const T = this.t, d = this.d, a = Math.min(1, T / 3, (this.life - T) / 10), Y = sy(this.y, 80), px = this.x + d * 150, X0 = this.x + d * 40, on = E.out3(Math.min(1, T / 5));
    ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(X0, Y); ctx.lineTo(px, Y); ctx.stroke();      // 들어오는 흰 빛
    drawGlow(ctx, (X0 + px) / 2, Y, 60, '255,255,255', 0.5, 1, 0.4);
    [-70, 0, 70].forEach((off, i) => {
      const ly = sy(clamp(this.y + off, 0, DEPTH), 80), ex = px + d * 1000 * on;
      for (let k = 0; k < 3; k++) {                                              // 광선마다 색이 번진 띠
        const c = RAINBOW[(i * 2 + k) % 7], o = (k - 1) * 4;
        ctx.strokeStyle = `rgba(${c},0.75)`; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(px, Y + o * 0.5); ctx.lineTo(ex, ly + o); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px, Y); ctx.lineTo(ex, ly); ctx.stroke();
    });
    ctx.save(); ctx.translate(px, Y); ctx.rotate(T * 0.12);                       // 프리즘
    ctx.globalCompositeOperation = 'source-over';
    const R = 34; ctx.beginPath(); for (let i = 0; i < 3; i++) { const g = i / 3 * TAU - Math.PI / 2; ctx.lineTo(Math.cos(g) * R, Math.sin(g) * R); } ctx.closePath();
    const g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(170,220,255,0.55)'); g.addColorStop(1, 'rgba(220,180,255,0.8)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -R); ctx.lineTo(0, R * 0.5); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, px, Y, 90, PRISM, 0.8);
    ctx.restore();
  }
}
class FCrystalCage {
  //  적을 둘러싸고 솟는 다면 수정 기둥 묶음. 무지갯빛 반사가 훑고 지나가다가 부서진다
  constructor(p, e) {
    Object.assign(this, { p, e, t: 0, life: 150, add: false });
    const R = mulberry(randi(1, 9999)); this.sp = [];
    for (let i = 0; i < 7; i++) this.sp.push({ ox: (i - 3) * 0.32 + (R() - 0.5) * 0.1, h: i === 3 ? 1.2 : 0.55 + R() * 0.45, w: 0.32 + R() * 0.16, lean: (i - 3) * 0.08 + (R() - 0.5) * 0.1 });
  }
  update() {
    this.t++; const e = this.e, p = this.p;
    if (!e.hittable()) return false;
    if (e.isBoss) Status.add(e, 'slow', { t: 20, m: 0.5 }); else { e.holdT = Math.max(e.holdT || 0, 6); e.holdKind = 'shock'; e.vx = e.vy = 0; }
    if (this.t === 1) { FF.spray('shard', e.x, sy(e.y, 10), 10, { col: PRISM, ang: -Math.PI / 2, spread: 1.2, v0: 3, v1: 8, grav: 0.3 }); Sfx.play('break', 0.4, 1.6); }
    if (this.t % 30 === 0 && this.t < this.life) { applyHit(p, e, WH.prTick, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); Sfx.wlayer('prism', 1, false); FF.spray('star', e.x, sy(e.y, e.z + e.h * 0.6), 4, { col: choose(RAINBOW), v0: 1, v1: 4, l0: 16, l1: 26 }); }
    if (this.t === this.life) {
      const X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
      Sfx.wlayer('prism', 3, true); Sfx.play('break', 0.8, 1.3); Game.addShake(7); Game.freeze(3);
      FF.impact(X, Y, '255,255,255', 1.3);
      for (let i = 0; i < 12; i++) FX.add('world', new FSlash(X + Math.cos(i / 12 * TAU) * 50, Y + Math.sin(i / 12 * TAU) * 50, i / 12 * TAU, 46, { col: RAINBOW[i % 7], th: 5, bend: 0, life: 14, sparks: false }));
      for (const c of RAINBOW) FF.spray('shard', X, Y, 4, { col: c, v0: 5, v1: 13, grav: 0.35, l0: 24, l1: 40, r0: 4, r1: 8 });
      applyHit(p, e, WH.prShatter, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
      return false;
    }
    return true;
  }
  draw(ctx) {
    const e = this.e; if (!e.hittable()) return;
    const T = this.t, g = E.out3(Math.min(1, T / 9)), X = e.x, gy = sy(e.y, e.z), H = (e.hurtH() + 30) * g, Wd = (e.w + 20) * 2.2, sweep = ((T * 0.02) % 1.4) - 0.2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X, gy - H * 0.5, H, PRISM, 0.35); ctx.globalCompositeOperation = 'source-over';
    for (const s of this.sp.slice().sort((a, b) => b.h - a.h)) {
      const bx = X + s.ox * Wd, h = H * s.h, w = Wd * s.w * 0.5, tx = bx + s.lean * h;
      const L = [bx - w, gy], M = [bx, gy + 6], Rr = [bx + w, gy], T0 = [tx, gy - h], sh = [tx - w * 0.5, gy - h * 0.82], sh2 = [tx + w * 0.5, gy - h * 0.82];
      const face = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
      face([L, M, [tx, gy - h * 0.82], sh], 'rgba(200,235,255,0.55)');
      face([M, Rr, sh2, [tx, gy - h * 0.82]], 'rgba(120,170,230,0.6)');
      face([sh, [tx, gy - h * 0.82], sh2, T0], 'rgba(240,250,255,0.75)');
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(sh[0], sh[1]); ctx.lineTo(T0[0], T0[1]); ctx.lineTo(sh2[0], sh2[1]); ctx.lineTo(Rr[0], Rr[1]); ctx.moveTo(M[0], M[1]); ctx.lineTo(tx, gy - h * 0.82); ctx.lineTo(T0[0], T0[1]); ctx.stroke();
    }
    ctx.save(); ctx.beginPath(); ctx.rect(X - Wd, gy - H * 1.3, Wd * 2, H * 1.3 + 8); ctx.clip();          // 무지개 반사띠
    ctx.globalCompositeOperation = 'lighter';
    const by = gy - H * 1.2 * sweep, gr = ctx.createLinearGradient(X - Wd, by - 30, X + Wd, by + 30);
    RAINBOW.forEach((c, i) => gr.addColorStop(i / 6, `rgba(${c},0.35)`));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(X - Wd, by - 10); ctx.lineTo(X + Wd, by - 40); ctx.lineTo(X + Wd, by - 10); ctx.lineTo(X - Wd, by + 20); ctx.fill();
    ctx.restore();
    if (T % 20 < 3) { ctx.globalCompositeOperation = 'lighter'; drawGlow(ctx, X + (FF.h(T, 1) - 0.5) * Wd, gy - H * FF.h(T, 2), 20, '255,255,255', 0.9); }
    ctx.restore();
  }
}

// ============================================================
//  사이버 레이저블레이드 : 전투 드론 · 궤도 레이저 조준 HUD
// ============================================================
const CYB = '90,255,230';
class FDrone {
  constructor(p, slot) { Object.assign(this, { p, slot, t: 0, life: 320, add: false, aim: 0, fire: 0 }); }
  pos() { const p = this.p, a = this.t * 0.06 + this.slot * Math.PI; return [p.x + Math.cos(a) * 80, p.y + Math.sin(a) * 26, 140 + Math.sin(this.t * 0.2 + this.slot) * 8, Math.sin(a) > 0]; }
  update() {
    this.t++; const p = this.p; if (p.hp <= 0) return false; if (this.fire > 0) this.fire--;
    const [px, py, pz] = this.pos(), e = WS.nearest(px, py, 1, 900)[0];
    this.tg = e; if (e) this.aim = Math.atan2(sy(e.y, e.z + e.h * 0.5) - sy(py, pz), e.x - px);
    if (this.t === 1) { FF.spray('spark', px, sy(py, pz), 10, { col: CYB, v0: 2, v1: 6 }); }
    if (this.t % 14 === (this.slot ? 7 : 0) && e && this.t < this.life - 6) {
      const X1 = px, Y1 = sy(py, pz), X2 = e.x, Y2 = sy(e.y, e.z + e.h * 0.5); this.fire = 6;
      FX.add('world', new FRun(7, () => { }, { draw: (ctx, r) => { const a = 1 - r.t / 7; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; for (const [w, c] of [[10, `rgba(${CYB},${0.3 * a})`], [4, `rgba(${CYB},${0.9 * a})`], [1.5, `rgba(255,255,255,${a})`]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke(); } ctx.restore(); } }));
      FF.impact(X2, Y2, CYB, 0.45, { ring: false }); FF.spray('spark', X2, Y2, 5, { col: CYB, v0: 2, v1: 6, l0: 8, l1: 14, r0: 2, r1: 3 });
      Sfx.wlayer('cyber', 1, false);
      applyHit(p, e, WH.cyDrone, { noStopAtt: true, dir: sign(e.x - px) || 1, hz: 70 });
    }
    return this.t < this.life;
  }
  draw(ctx) {
    const [px, py, pz] = this.pos(), X = px, Y = sy(py, pz), a = Math.min(1, this.t / 8, (this.life - this.t) / 10), T = this.t;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(X, sy(py, 0), 18, 5, 0, 0, TAU); ctx.fill();
    if (this.tg) {                                                                   // 조준 홀로그램 원뿔
      const e = this.tg, ex = e.x, ey = sy(e.y, e.z + e.h * 0.5);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${CYB},0.07)`; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(ex - 6, ey - 26); ctx.lineTo(ex + 6, ey + 26); ctx.fill();
      ctx.strokeStyle = `rgba(${CYB},0.7)`; ctx.lineWidth = 1.5; const s = 18 + Math.sin(T * 0.3) * 3;
      for (const [sx, sy2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(ex + sx * s, ey + sy2 * (s - 8)); ctx.lineTo(ex + sx * s, ey + sy2 * s); ctx.lineTo(ex + sx * (s - 8), ey + sy2 * s); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.translate(X, Y);
    for (const s of [-1, 1]) {                                                       // 로터
      ctx.fillStyle = '#16323a'; ctx.fillRect(s * 14 - 2, -4, 4, 6);
      ctx.save(); ctx.translate(s * 22, -9); ctx.scale(1, 0.25); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${CYB},0.25)`; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(200,255,250,0.8)`; ctx.lineWidth = 2; ctx.beginPath(); const r = T * 1.3 * s; ctx.moveTo(Math.cos(r) * 14, Math.sin(r) * 14); ctx.lineTo(-Math.cos(r) * 14, -Math.sin(r) * 14); ctx.stroke(); ctx.restore();
    }
    const g = ctx.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, '#3a6a72'); g.addColorStop(1, '#0a1c22');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(-8, -10); ctx.lineTo(8, -10); ctx.lineTo(16, -4); ctx.lineTo(12, 8); ctx.lineTo(-12, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${CYB},0.9)`; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.rotate(this.aim * 0.2); ctx.fillStyle = '#0a1c22'; ctx.fillRect(-3, 6, 6, 10); ctx.restore();
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = this.fire > 0 ? '#ffffff' : `rgba(${CYB},1)`; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); ctx.fill();
    drawGlow(ctx, 0, 0, this.fire > 0 ? 40 : 22, CYB, 0.8);
    ctx.restore();
  }
}
class FOrbitalStrike {
  //  궤도 레이저 : 회전하는 조준 괄호 + LOCK 표시 → 하늘에서 떨어지는 굵은 광선 + 육각 그을음
  constructor(p, x, y, delay) { Object.assign(this, { p, x, y, t: -delay, dur: 40, add: true }); }
  update() {
    this.t++;
    if (this.t === 1) Sfx.pplay('swing', 0.25, 2.4);
    if (this.t === this.dur) {
      const gy = sy(this.y, 0);
      FX.add('world', new FBeam(this.x, this.y, 64, 26, { col: CYB, core: '240,255,252', h: 800 }));
      FF.impact(this.x, gy - 20, CYB, 1.5, { burst: '220,255,250' });
      FX.add('ground', new FRing(this.x, gy, 20, 280, 22, { col: CYB, w: 12 }));
      FX.add('ground', new FCircle(this.x, this.y, 110, 60, { kind: 'hex', col: CYB, col2: '220,255,250', spin: 0.04 }));
      FX.add('ground', new FDecal(this.x, this.y, 100, 200, { kind: 'scorch', col: CYB }));
      FF.spray('spark', this.x, gy - 10, 20, { col: CYB, ang: -Math.PI / 2, spread: 1.4, v0: 4, v1: 12, grav: 0.3, l0: 14, l1: 26 });
      Sfx.wlayer('cyber', 3, true); Sfx.play('explode', 0.7); Game.addShake(9);
      WS.area(this.p, this.x, DEPTH / 2, 80, DEPTH, WH.cyOrbital, { hmax: 400 });
    }
    return this.t < this.dur + 2;
  }
  draw(ctx) {
    if (this.t < 0 || this.t >= this.dur) return;
    const u = this.t / this.dur, gy = sy(this.y, 0), s = 70 - u * 30, rot = u * Math.PI, lock = u > 0.6;
    ctx.save();
    ctx.strokeStyle = `rgba(${CYB},${0.25 + u * 0.5})`; ctx.lineWidth = 1 + u * 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -this.t * 3;
    ctx.beginPath(); ctx.moveTo(this.x, -20); ctx.lineTo(this.x, gy); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${CYB},${0.1 + u * 0.15})`; ctx.beginPath(); ctx.ellipse(this.x, gy, s * 1.3, s * 0.42, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(this.x, gy); ctx.scale(1, 0.34); ctx.rotate(rot);
    ctx.strokeStyle = lock ? 'rgba(255,90,90,0.95)' : `rgba(${CYB},0.95)`; ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.arc(0, 0, s * 1.3, -0.4, 0.4); ctx.stroke(); }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, TAU); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = lock ? '#ff6060' : `rgb(${CYB})`; ctx.font = `14px ${FONT_T}`; ctx.textAlign = 'center';
    if (lock ? this.t % 6 < 4 : true) ctx.fillText(lock ? 'LOCK' : `${(u * 100) | 0}%`, this.x, gy - s * 0.42 - 12);
    ctx.restore();
  }
}

// ============================================================
//  용아검 드라고닉 팽 : 화염 용머리의 숨결 · 몸을 휘감는 화룡
// ============================================================
const DRG = '255,140,50';
function drawDragonHead(ctx, x, y, s, d, jaw, a) {
  //  불꽃으로 이루어진 용 머리 (윤곽 + 뿔 + 이빨 + 눈)
  ctx.save(); ctx.translate(x, y); ctx.scale(d * s, s); ctx.globalAlpha *= a;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, 20, 0, 120, DRG, 0.5);
  ctx.fillStyle = 'rgba(255,120,40,0.55)'; ctx.strokeStyle = 'rgba(255,220,140,0.95)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-50, -30); ctx.quadraticCurveTo(10, -56, 70, -24); ctx.lineTo(96, -12); ctx.lineTo(70, -4); ctx.lineTo(10, 0); ctx.quadraticCurveTo(-30, 0, -50, -30); ctx.fill(); ctx.stroke();   // 윗턱
  ctx.save(); ctx.rotate(jaw); ctx.beginPath(); ctx.moveTo(-40, 6); ctx.lineTo(10, 8); ctx.lineTo(80, 14); ctx.lineTo(66, 26); ctx.quadraticCurveTo(0, 30, -40, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,250,220,0.95)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(14 + k * 10, 10); ctx.lineTo(18 + k * 10, 2); ctx.lineTo(22 + k * 10, 11); ctx.fill(); } ctx.restore();
  ctx.fillStyle = 'rgba(255,250,220,0.95)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(14 + k * 10, -4); ctx.lineTo(18 + k * 10, 6); ctx.lineTo(22 + k * 10, -4); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,170,70,0.7)';
  for (const [hx, l] of [[-30, 1], [-14, 0.7]]) { ctx.beginPath(); ctx.moveTo(hx, -34); ctx.quadraticCurveTo(hx - 40 * l, -70 * l, hx - 76 * l, -66 * l); ctx.quadraticCurveTo(hx - 36 * l, -52 * l, hx + 12, -30); ctx.fill(); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-50 - k * 10, -26 + k * 6); ctx.lineTo(-74 - k * 12, -34 + k * 10); ctx.lineTo(-52 - k * 10, -18 + k * 6); ctx.fill(); }   // 갈기
  ctx.fillStyle = '#fff8c0'; ctx.beginPath(); ctx.ellipse(28, -26, 9, 4, -0.2, 0, TAU); ctx.fill(); drawGlow(ctx, 28, -26, 24, '255,240,160', 1);
  ctx.restore();
}
class FDragonBreath {
  constructor(p) { Object.assign(this, { p, t: 0, life: 40, add: true, d: p.facing }); }
  update() {
    this.t++; const p = this.p, d = this.d;
    if (this.t % 3 === 0) { WS.area(p, p.x + d * 290, p.y, 300, 90, WH.dgBreath, { hmax: 220, each: e => Status.add(e, 'burn', { t: 120, d: p.atk * 0.14 }) }); Game.addShake(2); }
    for (let i = 0; i < FF.n(5); i++) {                                               // 소용돌이치는 화염 입자
      const sp = rand(12, 20), spread = rand(-0.22, 0.22);
      FX.add('world', new FP(p.x + d * 90, sy(p.y, 85) + rand(-6, 6), { kind: 'flame', col: choose(['255,140,40', '255,200,80', '255,90,30', '255,240,180']), vx: d * sp * Math.cos(spread), vy: sp * Math.sin(spread) * 0.6, drag: 0.94, grow: 0.06, r: rand(10, 18), life: randi(20, 30) }));
    }
    if (this.t % 4 === 0) FX.add('ground', new FDecal(p.x + d * rand(120, 560), clamp(p.y + rand(-60, 60), 0, DEPTH), rand(30, 50), 120, { kind: 'scorch', col: '255,140,50' }));
    return this.t < this.life && p.hp > 0;
  }
  draw(ctx) {
    const p = this.p, d = this.d, X0 = p.x + d * 60, Y = sy(p.y, 85), T = this.t, a = Math.min(1, T / 4, (this.life - T) / 6);
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(X0, 0, X0 + d * 640, 0); g.addColorStop(0, 'rgba(255,240,190,0.85)'); g.addColorStop(0.4, 'rgba(255,140,40,0.5)'); g.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, Y - 10);
    for (let i = 1; i <= 16; i++) { const q = i / 16; ctx.lineTo(X0 + d * q * 640, Y - 10 - q * 100 + Math.sin(T * 0.7 + i * 1.3) * 14 * q); }
    for (let i = 16; i >= 1; i--) { const q = i / 16; ctx.lineTo(X0 + d * q * 640, Y + 10 + q * 100 + Math.sin(T * 0.7 + i * 1.7 + 2) * 14 * q); }
    ctx.lineTo(X0, Y + 10); ctx.fill();
    ctx.restore();
    drawDragonHead(ctx, p.x + d * 40, Y - 6, 0.9, d, 0.25 + Math.sin(T * 0.5) * 0.05, a * 0.9);
  }
}
class FDragonSpirit {
  //  용의 분노 : 몸을 휘감아 도는 화룡 (머리 + 비늘 몸통 + 꼬리 불꽃)
  constructor(p) { Object.assign(this, { p, t: 0, add: true }); }
  update() {
    this.t++; const p = this.p; if (!(p.rageT > 0) || p.hp <= 0) return false;
    if (this.t % 3 === 0) FX.add('world', new FP(p.x + rand(-50, 50), sy(p.y, rand(0, 40)), { kind: 'flame', col: '255,130,40', vy: rand(-3, -1.5), r: rand(8, 14), life: 22 }));
    return true;
  }
  seg(i) { const p = this.p, a = this.t * 0.09 - i * 0.28; return [p.x + Math.cos(a) * 95, sy(p.y + Math.sin(a) * 30, p.z + 30 + i * 6 + Math.sin(this.t * 0.1 + i * 0.4) * 10), Math.sin(a) > 0, a]; }
  draw(ctx) {
    const p = this.p, T = this.t, fade = Math.min(1, T / 12, p.rageT / 20), N = 22;
    ctx.save(); ctx.globalAlpha = fade;
    drawGlow(ctx, p.x, sy(p.y, p.z + 70), 160, DRG, 0.25, 1, 1.1);
    for (let i = N - 1; i >= 0; i--) {
      const [x, y, front] = this.seg(i), r = 15 * (1 - i / N * 0.75);
      ctx.fillStyle = `rgba(255,${110 + (front ? 60 : 0)},40,${front ? 0.85 : 0.4})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      if (i % 2 === 0) { ctx.fillStyle = `rgba(255,230,150,${front ? 0.8 : 0.3})`; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.5); ctx.lineTo(x, y - r * 1.6); ctx.lineTo(x + r * 0.6, y - r * 0.5); ctx.fill(); }
    }
    const [hx, hy, , ha] = this.seg(0), dir = -Math.sin(ha) >= 0 ? 1 : -1;
    drawDragonHead(ctx, hx, hy, 0.42, dir, 0.15 + Math.sin(T * 0.3) * 0.1, 1);
    ctx.restore();
  }
}

// ============================================================
//  레퀴엠 바이올린검 : 오선 음파 · 4악장 교향곡
// ============================================================
const REQ = '210,180,255', NOTE_COLS = ['210,180,255', '255,230,150', '255,255,255'];
class FStaffWave {
  //  다섯 줄 오선이 부채꼴로 휘어 퍼지고, 그 위에 음표가 실려 날아간다
  constructor(p) { Object.assign(this, { p, t: 0, life: 30, add: true, d: p.facing, x: p.x, y: p.y }); }
  update() { this.t++; if (this.t % 2 === 0 && this.t < 18) { const R = 60 + this.t * 24, g = rand(-0.5, 0.5); FX.add('world', new FP(this.x + this.d * Math.cos(g) * R, sy(this.y, 80) + Math.sin(g) * R * 0.5, { kind: 'note', col: choose(NOTE_COLS), vx: this.d * 3, vy: rand(-1.5, -0.4), r: rand(8, 12), life: 34 })); } return this.t < this.life; }
  draw(ctx) {
    const T = this.t, u = T / this.life, d = this.d, X = this.x, Y = sy(this.y, 80), R = 60 + E.out3(u) * 460, a = 1 - u;
    ctx.save(); ctx.lineCap = 'round';
    for (let w = 0; w < 3; w++) {
      const rr = R - w * 70; if (rr < 40) continue;
      for (let l = 0; l < 5; l++) {
        const off = (l - 2) * 7; ctx.strokeStyle = `rgba(${REQ},${(0.85 - w * 0.25) * a})`; ctx.lineWidth = l === 2 ? 2.5 : 1.5;
        ctx.beginPath(); ctx.ellipse(X, Y + off, rr + off, (rr + off) * 0.55, 0, d > 0 ? -0.75 : Math.PI - 0.75, d > 0 ? 0.75 : Math.PI + 0.75); ctx.stroke();
      }
    }
    drawGlow(ctx, X + d * R * 0.9, Y, 120, REQ, 0.5 * a, 1, 0.6);
    ctx.restore();
  }
}
const MOVES = ['I. Lento', 'II. Agitato', 'III. Cantabile', 'IV. Finale'];
class FSymphony {
  //  화면 위를 가로지르는 오선지 + 악장 이름 + 지휘봉의 궤적. 악장마다 색과 연출이 바뀐다
  constructor(p) { Object.assign(this, { p, t: 0, life: 250, add: false, notes: [] }); }
  update() {
    this.t++; const p = this.p, t = this.t;
    if (p.hp <= 0) return false;
    const mv = t <= 60 ? 0 : t <= 120 ? 1 : t <= 180 ? 2 : 3;
    if (t % (mv === 3 ? 3 : 6) === 0) this.notes.push({ x: W + 20, line: randi(0, 8), kind: randi(0, 2), c: choose(NOTE_COLS) });
    for (const n of this.notes) n.x -= 5 + mv * 1.5;
    this.notes = this.notes.filter(n => n.x > -20);
    if (t % 4 === 0) FX.add('world', new FP(Game.cam.x + rand(40, W - 40), sy(rand(0, DEPTH), rand(20, 200)), { kind: 'note', col: choose(NOTE_COLS), vx: rand(-0.5, 0.5), vy: rand(-2, -0.8), r: rand(8, 12), life: 50 }));
    if ([1, 61, 121, 181].includes(t)) { FX.add('top', new Label(p.x, sy(p.y, p.z) - 230, MOVES[mv], { col: ['#ffffff', '#c8a8ff'], size: 26, life: 50 })); Sfx.wlayer('requiem', 2, true); }
    if (t <= 60) { if (t % 10 === 0) for (const e of WS.onScreen()) { Status.add(e, 'slow', { t: 40, m: 0.35 }); if (t % 30 === 0) FX.add('world', new FP(e.x, sy(e.y, e.z + e.hurtH() + 20), { kind: 'note', col: '150,170,255', vy: -0.5, r: 12, life: 30 })); } }
    else if (t <= 120) { if (t % 15 === 0) { Sfx.wlayer('requiem', 2, false); FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 520, 22, { col: REQ, w: 10 })); FX.add('world', new FStaffWave(p)); for (const e of WS.onScreen()) applyHit(p, e, WH.rqMove, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); } }
    else if (t <= 180) { if (t % 10 === 0) { Gear.heal(p, p.hpMax * 0.035, true); p.mp = Math.min(p.mpMax, p.mp + 60); FX.add('ground', new FRing(p.x, sy(p.y, 0), 10, 170, 16, { col: '150,255,190', w: 6 })); FF.spray('note', p.x, sy(p.y, 80), 3, { col: '150,255,190', ang: -Math.PI / 2, spread: 1, v0: 1, v1: 3, l0: 30, l1: 40, r0: 8, r1: 11 }); } }
    else if (t < 240) {
      if (t % 8 === 0) {
        Sfx.wlayer('requiem', 3, true); Game.addShake(5);
        for (const e of WS.onScreen()) { FX.add('world', new FSlash(e.x, sy(e.y, e.z + e.h * 0.5), rand(-0.8, 0.8), 70, { col: REQ, th: 6, life: 12, sparks: false })); applyHit(p, e, WH.rqCresc, { noStopAtt: true, dir: sign(e.x - p.x) || 1 }); }
      }
    } else if (t === 240) {
      Game.flashScreen(0.8, '240,230,255'); Game.addShake(20); Game.zoomPunch(1.07); Game.slowmo(0.4, 18); Sfx.play('explode', 1); Sfx.wlayer('requiem', 3, true);
      for (const e of WS.onScreen()) {
        FX.add('world', new FBeam(e.x, e.y, 56, 30, { col: REQ, core: '255,250,255', h: 800 }));
        FF.spray('note', e.x, sy(e.y, e.z + e.h * 0.5), 6, { col: choose(NOTE_COLS), v0: 3, v1: 8, l0: 30, l1: 46, r0: 9, r1: 13 });
        applyHit(p, e, WH.rqFinale, { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
      }
    }
    return t < this.life;
  }
  draw() { }
  hud(ctx) {
    const t = this.t, a = Math.min(1, t / 12, (this.life - t) / 12), Y0 = 128, mv = t <= 60 ? 0 : t <= 120 ? 1 : t <= 180 ? 2 : 3, col = ['150,170,255', '210,180,255', '150,255,190', '255,220,150'][mv];
    ctx.save(); ctx.globalAlpha = a;
    const bg = ctx.createLinearGradient(0, Y0 - 30, 0, Y0 + 60); bg.addColorStop(0, 'rgba(10,6,20,0)'); bg.addColorStop(0.5, 'rgba(10,6,20,0.45)'); bg.addColorStop(1, 'rgba(10,6,20,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, Y0 - 30, W, 90);
    ctx.strokeStyle = `rgba(${col},1)`; ctx.lineWidth = 2;
    for (let l = 0; l < 5; l++) { ctx.beginPath(); ctx.moveTo(0, Y0 + l * 7); ctx.lineTo(W, Y0 + l * 7); ctx.stroke(); }
    ctx.fillStyle = `rgba(${col},1)`; ctx.font = `46px serif`; ctx.textBaseline = 'middle'; ctx.fillText('𝄞', 14, Y0 + 12);
    for (const n of this.notes) {
      const y = Y0 + 28 - n.line * 3.5; ctx.fillStyle = `rgba(${n.c},1)`; ctx.strokeStyle = `rgba(${n.c},1)`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(n.x, y, 5, 3.6, -0.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(n.x + 4.5, y); ctx.lineTo(n.x + 4.5, y - 20); if (n.kind) ctx.quadraticCurveTo(n.x + 12, y - 14, n.x + 10, y - 8); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter'; const bx = W * ((t * 0.013) % 1); drawGlow(ctx, bx, Y0 + 14, 40, col, 0.6);
    ctx.restore();
  }
}
{
  const ov = WS.overlay;
  WS.overlay = function (ctx) { ov.call(this, ctx); for (const f of FX.top) if (f instanceof FSymphony) f.hud(ctx); };
}

Object.assign(WH, {
  prRay: WS.hd({ dmg: 3.4, kx: 3, airKz: 4, stun: 30, stop: 4, shake: 3, fx: 'pierce', power: 1.3 }),
  prTick: WS.hd({ dmg: 2.4, kx: 0, airKz: 0.5, stun: 20, stop: 2, shake: 2, fx: 'none', sfx: 'none' }),
  prShatter: WS.hd({ dmg: 14, kx: 6, kz: 11, airKz: 10, stun: 60, stop: 10, shake: 10, fx: 'heavy', power: 1.8 }),
  cyDrone: WS.hd({ dmg: 1.3, kx: 1, airKz: 1, stun: 12, stop: 1, shake: 1, fx: 'none', sfx: 'light' }),
  cyOrbital: WS.hd({ dmg: 12, kx: 6, kz: 13, airKz: 12, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2 }),
  dgBreath: WS.hd({ dmg: 0.95, kx: 3, airKz: 1, stun: 14, stop: 1, shake: 1.5, fx: 'none', sfx: 'none' }),
  rqWave: WS.hd({ dmg: 3.4, kx: 15, kz: 3, airKz: 4, stun: 60, stop: 6, shake: 6, fx: 'blunt', power: 1.5 }),
  rqMove: WS.hd({ dmg: 2.6, kx: 5, airKz: 4, stun: 30, stop: 3, shake: 3, fx: 'none', power2: 1 }),
  rqCresc: WS.hd({ dmg: 1.8, kx: 2, airKz: 3, stun: 22, stop: 2, shake: 3, fx: 'slash' }),
  rqFinale: WS.hd({ dmg: 24, kx: 9, kz: 14, airKz: 12, stun: 70, stop: 18, shake: 18, fx: 'heavy', power: 2.6 }),
});

// ============================================================
//  스킬 정의
// ============================================================
forgeDef('w29', {
  name: '저주 낙인', mp: 110, cd: 8, ico: ['curse', HEX],
  desc: '검을 들어 올리면 앞쪽 넓은 범위에 어둠이 번지고, 그 안의 적 머리 위에 저주 낙인이 새겨지며 그림자 사슬이 몸을 감는다. 저주가 세 단계씩 쌓이고 적은 느려진다. 저주가 깊을수록 받는 피해가 커진다.',
  act: {
    anim: 'win', len: 34, cancel: 22, atkCancel: 18,
    update(p, f) {
      p.vx *= 0.5;
      if (f === 2) FX.add('world', new FCircle(p.x, p.y, 70, 30, { kind: 'star', col: HEX, up: 170, ry: 1, grow: 6, spin: -0.05 }));
      if (f === 8) {
        const d = p.facing;
        Sfx.wlayer('curse', 3, true); Game.addShake(4); FF.screen({ kind: 'vig', col: '30,0,40', a: 0.4, life: 30, fin: 2, fout: 4 });
        FX.add('ground', new FRing(p.x + d * 220, sy(p.y, 0), 20, 460, 24, { col: HEX, w: 10 }));
        FX.add('ground', new FDecal(p.x + d * 260, p.y, 300, 90, { kind: 'pool', col: '60,10,80' }));
        for (let i = 0; i < 10; i++) FX.add('world', new FP(p.x + d * rand(40, 600), sy(p.y + rand(-100, 100), 4), { kind: 'smoke', col: '50,8,70', vx: d * rand(1, 3), vy: -0.5, r: rand(30, 50), grow: 0.4, life: 40 }));
        for (const e of Game.enemies) {
          if (!e.hittable() || (e.x - p.x) * d < -60 || Math.abs(e.x - p.x) > 620) continue;
          e.curse = Math.min(6, (e.curse || 0) + 3); Status.add(e, 'slow', { t: 150, m: 0.6 });
          hexBrand(e);
          FX.add('top', new Label(e.x, sy(e.y, e.z + e.hurtH()) - 80, `CURSE x${Math.min(5, e.curse)}`, { col: ['#f0d8ff', '#a050e0'], size: 20 }));
          FF.spray('glow', e.x, sy(e.y, e.z + e.h * 0.5), 6, { col: HEX, v0: 1, v1: 3 });
        }
      }
    },
  },
}, {
  name: '저주 폭발', mp: 480, cd: 42, ico: ['hexburst', HEX],
  desc: '화면이 어두워지고 내 검에서 뻗은 어둠의 촉수가 모든 적의 낙인과 이어진다. 한순간에 저주가 터지며 적마다 검보라 불기둥이 솟는다. 저주가 깊은 적일수록 큰 피해를 입고, 터진 저주는 이웃한 적에게 번진다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '저주 폭발', '詛 咒 爆 發', HEX, { bars: 60, dim: 0.5 }); p.invul = 100; p.vx = 0; },
    update(p, f) {
      if (f === 4) for (const e of WS.onScreen()) { e.curse = Math.max(e.curse || 0, 0); hexBrand(e); }
      if (f === 6) for (const e of WS.onScreen()) FX.add('world', new FLightning(p.x, sy(p.y, 110), e.x, sy(e.y, e.z + e.hurtH()) - 44, { w: 4, col: '190,110,255', life: 26, amp: 0.12, br: 2 }));
      if (f === 6 || f === 14) Sfx.wlayer('curse', 2, false);
      if (f === 24) {
        Game.flashScreen(0.5, '210,150,255'); Game.addShake(14); Game.freeze(4); Sfx.wlayer('curse', 3, true); Sfx.play('explode', 0.8); p.bladeGlow = 2;
        for (const e of WS.onScreen()) {
          const st = Math.max(2, Math.min(5, e.curse || 0)), mul = 0.8 + st * 1.5, X = e.x, Y = sy(e.y, e.z + e.h * 0.5);
          FX.add('world', new FBeam(e.x, e.y, 40 + st * 6, 34, { col: '150,50,200', core: '240,200,255', h: 640 }));
          FF.impact(X, Y, HEX, 0.8 + st * 0.15, { burst: '240,200,255' });
          FF.spray('smoke', X, Y, 6, { col: '40,6,60', v0: 1, v1: 4, r0: 20, r1: 34, l0: 30, l1: 50, grow: 0.4 });
          FF.spray('flame', X, sy(e.y, 0), 8 + st, { col: '170,70,220', ang: -Math.PI / 2, spread: 0.4, v0: 4, v1: 10, l0: 20, l1: 34 });
          FX.add('top', new Label(X, sy(e.y, e.z + e.hurtH()) - 70, `HEX x${st}`, { col: ['#ffffff', '#c070ff'], size: 22 }));
          applyHit(p, e, WS.hd({ dmg: 4 * mul, kx: 5, kz: 9, airKz: 8, stun: 60, stop: 8 + st, shake: 8, fx: 'none', power2: 2 }), { noStopAtt: true, dir: sign(e.x - p.x) || 1 });
          for (const o of WS.nearest(e.x, e.y, 3, 300, e)) { o.curse = Math.min(5, (o.curse || 0) + 1); hexBrand(o); }
          e.curse = 0;
        }
        forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w30', {
  name: '빛 굴절', mp: 130, cd: 8, ico: ['prismray', PRISM],
  desc: '칼끝 앞에 삼각 프리즘을 띄우고 흰 빛을 쏜다. 빛이 프리즘을 지나 무지갯빛 세 갈래 광선으로 갈라져 앞의 적들을 꿰뚫는다.',
  act: {
    anim: 'a3', len: 34, cancel: 22, atkCancel: 18,
    update(p, f) {
      p.vx *= 0.5;
      if (f < 8) { p.bladeGlow = 0.6 + f * 0.15; if (f % 2 === 0) FX.add('world', new FP(p.x + rand(-80, 80), sy(p.y, rand(20, 150)), { kind: 'glow', col: choose(RAINBOW), tx: p.x + p.facing * 40, ty: sy(p.y, 80), pull: 0.1, r: 3, life: 14 })); }
      if (f === 8) {
        const d = p.facing;
        Sfx.pplay('swingBig'); Sfx.wlayer('prism', 3, true); Game.flashScreen(0.15, '240,250,255'); p.bladeGlow = 2;
        FX.add('world', new FPrismRay(p));
        [-70, 0, 70].forEach(off => WS.area(p, p.x + d * 560, clamp(p.y + off, 0, DEPTH), 440, 44, WH.prRay, { hmax: 240, each: e => FF.spray('star', e.x, sy(e.y, e.z + e.h * 0.5), 3, { col: choose(RAINBOW), v0: 2, v1: 5, l0: 14, l1: 22 }) }));
      }
    },
  },
}, {
  name: '수정 감옥', mp: 480, cd: 42, ico: ['crystalcage', PRISM],
  desc: '가까운 적 최대 6명의 발밑에서 다면 수정 기둥이 솟아 가둔다. 무지갯빛 반사가 수정을 훑고 지나가는 2.5초 동안 갇힌 적은 움직이지 못하고 계속 베이다가, 수정이 부서지며 일곱 빛깔로 폭발한다. (보스는 느려진다)',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { forgeCine(p, '수정 감옥', '水 晶 監 獄', PRISM, { bars: 60, dim: 0.35 }); p.invul = 100; p.vx = 0; },
    update(p, f) {
      if (f === 12) {
        Sfx.wlayer('prism', 3, true); Game.flashScreen(0.3, '230,248,255'); Game.addShake(8); p.bladeGlow = 2;
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 500, 26, { col: PRISM, w: 10 }));
        WS.nearest(p.x, p.y, 6, 760).forEach((e, i) => Gear.later(i * 3, () => { if (e.hittable()) FX.add('world', new FCrystalCage(p, e)); }));
        forgeUndim(24);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w31', {
  name: '드론 호출', mp: 130, cd: 9, ico: ['drone', CYB],
  desc: '로터가 달린 전투 드론 두 대를 호출한다. 드론은 5초 동안 내 곁을 돌며 홀로그램으로 가장 가까운 적을 조준하고 레이저를 쏜다.',
  act: {
    anim: 'win', len: 30, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.5;
      if (f === 6) {
        Sfx.wlayer('cyber', 3, true); Game.flashScreen(0.12, '180,255,245');
        FX.add('world', new FDrone(p, 0)); FX.add('world', new FDrone(p, 1));
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 160, 16, { col: CYB, w: 6 }));
        FX.add('ground', new FCircle(p.x, p.y, 90, 30, { kind: 'hex', col: CYB, spin: 0.06 }));
      }
    },
  },
}, {
  name: '궤도 레이저', mp: 480, cd: 42, ico: ['orbital', CYB],
  desc: '위성에 좌표를 보낸다. 적이 있는 곳에 조준 괄호가 회전하며 좁혀들고 LOCK 이 뜨면, 하늘에서 굵은 광선이 차례로 내리꽂혀 세로줄 전체를 불태운다.',
  act: {
    anim: 'ultUp', len: 80, cancel: 66, atkCancel: 56,
    start(p) { forgeCine(p, '궤도 레이저', 'O R B I T A L', CYB, { bars: 80, dim: 0.35 }); p.invul = 150; p.vx = 0; },
    update(p, f) {
      if (f === 10) {
        p.bladeGlow = 2; Sfx.wlayer('cyber', 3, false);
        FF.screen({ kind: 'lines', col: '120,255,235', a: 0.12, life: 100, fin: 10, fout: 6 });
        const xs = WS.onScreen().map(e => [e.x, e.y]).sort(() => Math.random() - 0.5).slice(0, 6), r = Game.room;
        while (xs.length < 6) xs.push([clamp(p.x + p.facing * rand(120, 700), r.minX + 60, r.maxX - 60), rand(40, DEPTH - 40)]);
        xs.forEach(([x, y], i) => FX.add('world', new FOrbitalStrike(p, x, y, i * 8)));
      }
      if (f === 60) forgeUndim(20);
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w32', {
  name: '용의 숨결', mp: 150, cd: 9, ico: ['breath', DRG],
  desc: '숨을 들이마시면 불꽃으로 된 용의 머리가 앞에 나타나 입을 벌리고, 소용돌이치는 거대한 불길을 내뿜는다. 부채꼴로 퍼진 불길이 닿은 적을 계속 태우고 땅을 그을린다.',
  act: {
    anim: 'a3', len: 60, cancel: 52, atkCancel: 52,
    start(p) { p.vx = 0; Sfx.wlayer('dragon', 1, false); },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      if (f < 10) { p.bladeGlow = 0.6 + f * 0.1; FX.add('world', new FP(p.x + p.facing * rand(60, 260), sy(p.y, rand(20, 160)), { kind: 'ember', col: DRG, tx: p.x + p.facing * 40, ty: sy(p.y, 85), pull: 0.12, r: 4, life: 14 })); }
      if (f === 10) { swingT(p, 'a3', 1.2); FX.add('world', new FDragonBreath(p)); Sfx.wlayer('dragon', 3, true); Sfx.play('roar', 0.6, 0.8); Game.flashScreen(0.15, '255,200,120'); }
      if (f > 10 && f < 50) p.bladeGlow = 2;
    },
  },
}, {
  name: '용의 분노', mp: 480, cd: 42, ico: ['dragonrage', DRG],
  desc: '6초 동안 화룡의 혼이 몸을 휘감아 돈다. 내 피해가 50% 늘고 동작이 빨라지며, 적을 벨 때마다 불덩이가 주변 적에게 튀어 불태운다.',
  act: {
    anim: 'ultUp', len: 50, cancel: 36, atkCancel: 30,
    start(p) { forgeCine(p, '용의 분노', '龍 의 怒', DRG, { bars: 50, dim: 0.35 }); p.invul = 90; p.vx = 0; },
    update(p, f) {
      if (f === 10) {
        p.rageT = 360; p.hasteT = Math.max(p.hasteT || 0, 360); p.bladeGlow = 2.5;
        Sfx.play('roar', 1, 0.7); Sfx.wlayer('dragon', 3, true); Game.addShake(12); Game.flashScreen(0.35, '255,170,90'); Game.zoomPunch(1.04);
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 340, 24, { col: DRG, w: 14 }));
        FX.add('ground', new FDecal(p.x, p.y, 200, 200, { kind: 'scorch', col: DRG }));
        FF.spray('flame', p.x, sy(p.y, 20), 30, { col: DRG, ang: -Math.PI / 2, spread: 1.4, v0: 4, v1: 12, l0: 20, l1: 36, r0: 10, r1: 18 });
        FX.add('world', new FDragonSpirit(p));
        forgeUndim(20);
      }
    },
    end() { forgeUndim(10); },
  },
});

forgeDef('w33', {
  name: '음파 충격', mp: 120, cd: 8, ico: ['soundwave', REQ],
  desc: '검을 활처럼 켜면 다섯 줄 오선이 부채꼴로 휘어 퍼지고 그 위에 음표가 실려 날아간다. 앞의 모든 적이 크게 밀려나고 잠시 기절한다.',
  act: {
    anim: 'a2', len: 36, cancel: 22, atkCancel: 18,
    update(p, f) {
      p.vx *= 0.5;
      if (f === 8) {
        const d = p.facing; Sfx.pplay('swingBig'); Sfx.wlayer('requiem', 3, true); Game.addShake(7);
        FX.add('world', new FStaffWave(p));
        FX.add('ground', new FRing(p.x + d * 80, sy(p.y, 0), 20, 300, 20, { col: REQ, w: 8 }));
        WS.area(p, p.x + d * 260, p.y, 300, 100, WH.rqWave, { each: e => { Status.add(e, 'shock', { t: 40 }); FX.add('world', new FP(e.x, sy(e.y, e.z + e.hurtH() + 16), { kind: 'note', col: '255,230,150', vy: -1, r: 12, life: 30 })); } });
      }
    },
  },
}, {
  name: '교향곡', mp: 480, cd: 42, ico: ['symphony', REQ],
  desc: '화면 위에 오선지가 펼쳐지고 4악장이 연주된다. 1악장 적이 느려지고, 2악장 오선 음파가 적을 때리고, 3악장 HP · MP가 차오르고, 4악장 점점 격렬해지다 마지막 한 음에 모든 적 위로 빛기둥이 내린다.',
  act: {
    anim: 'ultUp', len: 50, cancel: 40, atkCancel: 34,
    start(p) { forgeCine(p, '교향곡', 'S Y M P H O N Y', REQ, { bars: 40, dim: 0.3 }); p.invul = 90; p.vx = 0; },
    update(p, f) {
      if (f === 10) { p.bladeGlow = 2; Sfx.wlayer('requiem', 3, false); FX.add('top', new FSymphony(p)); FX.add('ground', new FCircle(p.x, p.y, 130, 250, { kind: 'star', col: REQ, follow: p, spin: 0.015 })); forgeUndim(20); }
    },
    end() { forgeUndim(10); },
  },
});
