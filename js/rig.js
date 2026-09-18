'use strict';
// ============================================================
//  스켈레탈 리그 : 포즈 → 관절 계산 → 셀 셰이딩 드로잉
//  각도 규약(오른쪽을 바라볼 때): 0 = 아래, 90 = 앞, 180 = 위, -90 = 뒤
// ============================================================
const PK = ['bx', 'by', 't', 'h', 'ua1', 'fa1', 'ua2', 'fa2', 'th1', 'sh1', 'th2', 'sh2', 'w', 'w2', 'rot'];
const POSE_ZERO = { bx: 0, by: 0, t: 0, h: 0, ua1: 0, fa1: 0, ua2: 0, fa2: 0, th1: 0, sh1: 0, th2: 0, sh2: 0, w: 0, w2: 0, rot: 0, wb: 0 };

function P(o, base) { return Object.assign({}, base || POSE_ZERO, o); }
function copyPose(src, out) { for (const k of PK) out[k] = src[k]; out.wb = src.wb; return out; }
function lerpPose(a, b, u, out) {
  for (const k of PK) out[k] = a[k] + (b[k] - a[k]) * u;
  out.wb = u < 0.5 ? a.wb : b.wb;
  return out;
}

// 키프레임 애니메이션 : keys = [[frame, pose, ease], ...]
function A(keys, opt) { return Object.assign({ keys, len: keys[keys.length - 1][0] }, opt || {}); }
// 절차적 애니메이션
function AF(fn, opt) { return Object.assign({ fn }, opt || {}); }

function sampleAnim(an, t, out, ent) {
  if (an.fn) return copyPose(an.fn(t, ent), out);
  const k = an.keys;
  if (an.loop) t = t % an.len;
  if (t <= k[0][0]) return copyPose(k[0][1], out);
  for (let i = 1; i < k.length; i++) {
    if (t < k[i][0]) {
      const u = (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return lerpPose(k[i - 1][1], k[i][1], (k[i][2] || Ease.inOut)(u), out);
    }
  }
  return copyPose(k[k.length - 1][1], out);
}

const JOINTS = ['hip', 'knee1', 'foot1', 'knee2', 'foot2', 'chest', 'neck', 'head', 'sh1', 'sh2', 'elbow1', 'hand1', 'elbow2', 'hand2'];
function newJ() { const J = { wAng: 0, wAng2: 0, headRot: 0 }; for (const k of JOINTS) J[k] = { x: 0, y: 0 }; return J; }
function copyJ(src) { const J = newJ(); for (const k of JOINTS) { J[k].x = src[k].x; J[k].y = src[k].y; } J.wAng = src.wAng; J.wAng2 = src.wAng2; J.headRot = src.headRot; J.wb = src.wb; return J; }

function _at(o, a, L, q) { const r = a * DEG; q.x = o.x + Math.sin(r) * L; q.y = o.y + Math.cos(r) * L; return q; }

function solveRig(R, p, J, grounded) {
  const H0 = R.thigh + R.shin;
  J.hip.x = p.bx; J.hip.y = -H0 + p.by;
  _at(J.hip, p.th1, R.thigh, J.knee1); _at(J.knee1, p.th1 + p.sh1, R.shin, J.foot1);
  _at(J.hip, p.th2, R.thigh, J.knee2); _at(J.knee2, p.th2 + p.sh2, R.shin, J.foot2);
  const ta = 180 - p.t;
  _at(J.hip, ta, R.torso, J.chest);
  _at(J.chest, ta, R.neck, J.neck);
  _at(J.neck, ta - p.h, R.headR, J.head);
  // 어깨 : 가슴에서 약간 아래 + 앞/뒤
  _at(J.chest, ta - 180, R.shDrop, J.sh1); _at(J.sh1, ta - 90, R.shOff, J.sh1);
  _at(J.chest, ta - 180, R.shDrop, J.sh2); _at(J.sh2, ta + 90, R.shOff * 0.6, J.sh2);
  _at(J.sh1, p.ua1, R.uArm, J.elbow1); _at(J.elbow1, p.ua1 + p.fa1, R.fArm, J.hand1);
  _at(J.sh2, p.ua2, R.uArm, J.elbow2); _at(J.elbow2, p.ua2 + p.fa2, R.fArm, J.hand2);
  J.wAng = p.ua1 + p.fa1 + p.w;
  J.wAng2 = p.ua2 + p.fa2 + p.w2;
  J.headRot = (p.t + p.h) * DEG;
  J.wb = p.wb;
  if (p.rot) {
    const r = p.rot * DEG, c = Math.cos(r), s = Math.sin(r), hx = J.hip.x, hy = J.hip.y;
    for (const k of JOINTS) {
      const q = J[k], dx = q.x - hx, dy = q.y - hy;
      q.x = hx + dx * c - dy * s; q.y = hy + dx * s + dy * c;
    }
    J.wAng -= p.rot; J.wAng2 -= p.rot; J.headRot += r;
  }
  if (grounded) {
    const fh = R.footH || 3;
    let m = Math.max(J.foot1.y + fh, J.foot2.y + fh);
    if (p.rot || R.lieCheck) {
      m = Math.max(m, J.hip.y + R.wWaist * 0.8, J.chest.y + R.wChest * 0.7, J.head.y + R.headR * 0.9, J.knee1.y + 4, J.knee2.y + 4);
    }
    for (const k of JOINTS) J[k].y -= m;
  }
  return J;
}

// ------------------------------------------------------------
//  드로잉 프리미티브
// ------------------------------------------------------------
function capsulePath(ctx, a, b, r0, r1) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L < 0.5) { ctx.moveTo(a.x + Math.max(r0, r1), a.y); ctx.arc(a.x, a.y, Math.max(r0, r1), 0, TAU); return; }
  const ang = Math.atan2(dy, dx);
  ctx.moveTo(a.x + Math.cos(ang + Math.PI / 2) * r0, a.y + Math.sin(ang + Math.PI / 2) * r0);
  ctx.arc(a.x, a.y, r0, ang + Math.PI / 2, ang + Math.PI * 1.5);
  ctx.arc(b.x, b.y, r1, ang - Math.PI / 2, ang + Math.PI / 2);
  ctx.closePath();
}

// 재질 m = [어두운, 기본, 밝은]
function shadedSeg(ctx, a, b, r0, r1, m) {
  ctx.fillStyle = m[0];
  ctx.beginPath(); capsulePath(ctx, a, b, r0, r1); ctx.fill();
  if (m[0] === m[1]) return; // 잔상 등 단색 팔레트
  // 빛 방향(위쪽) 오프셋
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const o0 = r0 * 0.28, o1 = r1 * 0.28;
  ctx.fillStyle = m[1];
  ctx.beginPath();
  capsulePath(ctx, { x: a.x + nx * o0, y: a.y + ny * o0 }, { x: b.x + nx * o1, y: b.y + ny * o1 }, r0 * 0.72, r1 * 0.72);
  ctx.fill();
  if (m[2]) {
    ctx.fillStyle = m[2];
    ctx.beginPath();
    capsulePath(ctx, { x: a.x + nx * r0 * 0.55, y: a.y + ny * r0 * 0.55 }, { x: b.x + nx * r1 * 0.55, y: b.y + ny * r1 * 0.55 }, r0 * 0.22, r1 * 0.22);
    ctx.fill();
  }
}

// 2관절 사지 : 외곽선 먼저, 그다음 채색
function limb(ctx, a, b, c, r0, r1, r2, m1, m2, ol, ow) {
  ctx.fillStyle = ol;
  ctx.beginPath(); capsulePath(ctx, a, b, r0 + ow, r1 + ow); capsulePath(ctx, b, c, r1 + ow, r2 + ow); ctx.fill();
  shadedSeg(ctx, a, b, r0, r1, m1);
  shadedSeg(ctx, b, c, r1 * 0.95, r2, m2);
}

function polyPath(ctx, pts) {
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

// 외곽선 + 채움 폴리곤
function olPoly(ctx, pts, fill, ol, ow) {
  ctx.beginPath(); polyPath(ctx, pts);
  ctx.lineJoin = 'round';
  if (ow) { ctx.strokeStyle = ol; ctx.lineWidth = ow * 2; ctx.stroke(); }
  ctx.fillStyle = fill; ctx.fill();
}

// 몸통 좌표계 도우미 : hip→chest 기준 로컬 (u=위, f=앞)
function torsoFrame(J) {
  const dx = J.chest.x - J.hip.x, dy = J.chest.y - J.hip.y, L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  return { ux, uy, fx: -uy, fy: ux, L };
}
// 로컬(앞 f, 위 u) 점 → 좌표
function tp(o, F, f, u) { return [o.x + F.fx * f + F.ux * u, o.y + F.fy * f + F.uy * u]; }

// 팔레트 변환
function mapPal(pal, fn) {
  const o = {};
  for (const k in pal) { const v = pal[k]; o[k] = Array.isArray(v) ? v.map(fn) : fn(v); }
  return o;
}

// 체인 (머리띠, 코트 자락 등 2차 모션) - 월드 좌표에서 시뮬레이션
class Chain {
  constructor(n, seg, grav = 0.35, damp = 0.86) {
    this.n = n; this.seg = seg; this.grav = grav; this.damp = damp;
    this.p = []; for (let i = 0; i < n; i++) this.p.push({ x: 0, y: 0, px: 0, py: 0 });
    this.init = false;
  }
  update(ax, ay, wind) {
    const p = this.p;
    if (!this.init) { for (let i = 0; i < this.n; i++) { p[i].x = p[i].px = ax - i * this.seg * 0.7; p[i].y = p[i].py = ay + i * this.seg * 0.7; } this.init = true; }
    p[0].x = ax; p[0].y = ay;
    for (let i = 1; i < this.n; i++) {
      const q = p[i];
      const vx = (q.x - q.px) * this.damp, vy = (q.y - q.py) * this.damp;
      q.px = q.x; q.py = q.y;
      q.x += vx + wind; q.y += vy + this.grav;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < this.n; i++) {
        const a = p[i - 1], b = p[i];
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 0.001;
        const k = (L - this.seg) / L;
        b.x -= dx * k; b.y -= dy * k;
      }
    }
  }
  reset() { this.init = false; }
}

// 체인을 엔티티 로컬 좌표로 변환하여 리본 형태로 그림
function drawRibbon(ctx, ent, ch, w0, w1, fill, ol, ow) {
  const ex = ent.x, ey = sy(ent.y, ent.z), s = ent.scale * ent.facing, sc = ent.scale;
  const pts = ch.p.map(q => ({ x: (q.x - ex) / s, y: (q.y - ey) / sc }));
  const L = [], Rr = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w = lerp(w0, w1, i / (pts.length - 1));
    L.push(pts[i].x + nx * w, pts[i].y + ny * w);
    Rr.push(pts[i].x - nx * w, pts[i].y - ny * w);
  }
  const poly = L.slice();
  for (let i = Rr.length - 2; i >= 0; i -= 2) poly.push(Rr[i], Rr[i + 1]);
  olPoly(ctx, poly, fill, ol, ow);
}
