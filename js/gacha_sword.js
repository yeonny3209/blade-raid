'use strict';
// ============================================================
//  한정 검 : 성화검 여명  (소환 전용 · 상점에서는 팔지 않는다)  — 일반 검보다 한 단계 위의 검
//   - 외형 : 흰 금빛 대검 · 성스러운 날개 가드 · 칼날을 도는 태양 고리 · 타오르는 성화 · 머리 위 후광
//   - 능력 : 공격력 x2.4(최고 일반 검 x1.62) · 치명타율 +18% · 치명 피해 x2.2 · 이동 +10%
//   - 패시브 「성화 각인」 : 적중마다 각인(+5% 피해, 최대 5) → 5번째에 성화 폭발(범위 220%) + 불기둥 셋
//       · 불타는 적에게 피해 +25%  · 치명타는 근처 적 둘에게 성화 번개 · 처치하면 폭발 + 체력 회복
//   - G 성화 낙하 : 다섯 줄기 불기둥이 적을 쓸어가고, 마지막에 거대한 기둥이 모든 것을 불태운다
//   - R 일출 : 태양이 떠올라 화면 전체를 심판 → 15초 동안 「성화 강림」(대천사의 날개 · 피해 +40% · 성화 참격)
//   - 돌파 : 같은 검이 또 나오면 돌파(최대 5) — 공격력 +6% · 치명타율 +1% 씩 (Gacha 의 setGear 덧씌움)
// ============================================================
const SF = '255,214,120', SF2 = '255,246,214', SFR = '255,150,60';

BLADE_STYLE.wL1 = {
  w: 7.4, taper: 0.06, tip: 'clip', tipL: 40, r: 0.5, n: 30,
  mod: (u, i) => [i % 5 === 2 ? 2.2 : 0, i % 5 === 3 ? 2.2 : 0],
  core: 1, runes: 5, guard: 'sun', grip: 'wrap', pommel: 'gem', fx: 'holy',
  sunEtch: 1, etch: { u0: 0.06, u1: 0.7 }, gems: [0.08, 0.3], edgeGlow: { a: 0.8 }, flameLick: 1, stardust: 1,
  holyWings: { n: 7, L: 26 }, sunRing: { u: 0.55, r: 12 },
};

// 적중 : 십자 섬광 · 퍼지는 고리 · 떠오르는 성화 깃털
PART.sacred = function (x, y, z, d, pw, b) {
  const X = x, Y = sy(y, z);
  Hitfx.sparks(X, Y, d, Math.round((5 + pw * 3) * b), { col: SF, spread: 1.6 });
  for (let i = 0; i < Math.round((4 + pw * 2) * b); i++) FX.add('world', new Mote(X + rand(-10, 10), Y + rand(-8, 8), rand(-1, 1), rand(-4, -1.4), { col: choose([SF, SF2, SFR]), life: 42, r: rand(5, 11), grav: 0 }));
  FX.add('world', new Flash(X, Y, 10, 70 + pw * 16, 14, SF, 0.7));
  FX.add('world', new CutLine(X, Y, 0, 90 + pw * 20, 3, SF2, 9)); FX.add('world', new CutLine(X, Y, Math.PI / 2, 70 + pw * 16, 3, SF2, 9));   // 십자 섬광
  if (pw >= 2) FX.add('ground', new FRing(X, sy(y, 0), 10, 120 + pw * 20, 14, { col: SF, w: 6 }));
};

FTRAIL.wL1 = { k: 'myth', c1: SF, c2: SF2, dk: '70,28,6', w: 2.0, p: 'ember', pc: '255,226,150', pr: 1.0 };

// 휘두를 때 : 칼날 뒤로 금빛 깃털과 빛가루가 흩날린다
{
  const _utaS = Player.prototype.updateTrailAfter;
  Player.prototype.updateTrailAfter = function () {
    _utaS.call(this);
    if (!this.wdef || this.wdef.id !== 'wL1' || !this.trailOn || !this.trail.length) return;
    const q = this.trail[this.trail.length - 1], u = rand(0.2, 1), x = lerp(q.bx, q.tx, u), y = lerp(q.by, q.ty, u);
    FX.add('world', new FP(x, y, { kind: 'glow', col: choose([SF, SF2]), vx: rand(-1.2, 1.2) - this.facing * 1.4, vy: rand(-2.4, -0.4), grav: -0.02, life: randi(26, 44), r: rand(3, 6), drag: 0.95 }));
    if (Game.frame % 3 === 0) FX.add('world', new FP(q.tx, q.ty, { kind: 'spark', col: SF2, vx: rand(-2, 2), vy: rand(-2, 2), r: 3, life: 12 }));
  };
}

const WEAPON_SUNFLAME = {
  id: 'wL1', gacha: true, name: '성화검 여명', sub: '밤의 끝에서 타오르는 성스러운 불', price: 0, map: 1,
  atk: 2.4, crit: 0.18, critDmg: 2.2, stop: 1.4, shake: 1.6, kx: 1.2, move: 1.1, col: SF, snd: 'myth', part: 'sacred', pitch: 1.0, swingPitch: 1.05,
  feel: '맑은 종소리와 타오르는 불꽃 소리',
  desc: '한정 검 : 공격력이 가장 높은 일반 검의 1.5배. 적중마다 「성화 각인」이 쌓이고(+5% 피해, 최대 5) 5번째 적중에 성화가 폭발해 220% 피해 + 화상, 불기둥 셋이 내린다. 불타는 적에게 피해 +25%, 치명타는 근처 적 둘에게 성화 번개가 튄다. 처치하면 폭발하며 체력을 되찾는다. 치명타율 +18%, 치명타 피해 x2.2, 이동속도 +10%.',
  look: { c: ['#5a3a14', '#f0c860', '#fffbe8'], hw: 7.4, L: 1.3, guard: 'sun', glow: SF, rune: '255,236,170', trim: ['#7a3c10', '#f4b43c', '#fff2b0'], taper: 0.06 },
  amb: ['ember', SF, 0.4],
  mod(p, t) { return (1 + 0.05 * Math.min(5, p.sfN || 0) + (p.sfT > 0 ? 0.4 : 0)) * (t && t.st && t.st.burn && t.st.burn.t > 0 ? 1.25 : 1); },
  hit(p, t, dmg, o) {
    if (Game.frame - (p.sfF || -999) > 180) p.sfN = 0;
    p.sfF = Game.frame; p.sfN = (p.sfN || 0) + 1;
    Status.add(t, 'burn', { t: 150, d: dmg * (p.sfT > 0 ? 0.2 : 0.12) });
    const X = t.x, Y = sy(t.y, t.z + t.h * 0.5);
    if (t.hp <= 0) {                                                                // 처치 : 성화 폭발 + 회복
      FX.add('ground', new FRing(X, sy(t.y, 0), 10, 180, 16, { col: SF, w: 8 }));
      FX.add('world', new FBeam(X, t.y, 44, 20, { col: SF, core: SF2, h: 440 }));
      FF.spray('flame', X, Y, 10, { col: SFR, ang: -Math.PI / 2, spread: 1.2, v0: 3, v1: 9, l0: 18, l1: 28 });
      Gear.heal(p, p.hpMax * 0.012, true);
    }
    if (o && o.crit) {                                                              // 치명타 : 성화 번개
      for (const e of Gear.near(p, t, 360, 2)) { Gear.bolt(t, e, SF); Gear.proc(p, e, 0.8, { quiet: true }); Status.add(e, 'burn', { t: 120, d: p.atk * 0.15 }); }
    }
    if (p.sfT > 0 && p.sfN % 3 === 0) {                                             // 성화 강림 : 성화 참격
      for (const e of Gear.near(p, t, 420, 2)) {
        FX.add('world', new FBeam(e.x, e.y, 44, 18, { col: SF, core: SF2, h: 480 })); FF.impact(e.x, sy(e.y, e.z + e.h * 0.5), SF, 1, { burst: SF2 });
        Gear.proc(p, e, 0.9, { quiet: true });
      }
    }
    if (p.sfN >= 5) {                                                               // 성화 폭발
      p.sfN = 0;
      FX.add('world', new FBeam(X, t.y, 90, 24, { col: SF, core: SF2, h: 600 }));
      FX.add('ground', new FRing(X, sy(t.y, 0), 20, 260, 20, { col: SF, w: 12 })); FX.add('ground', new FRing(X, sy(t.y, 0), 20, 180, 16, { col: SF2, w: 6, delay: 3 }));
      FF.impact(X, Y, SF, 1.8, { burst: SF2 });
      Sfx.play('explode', 0.5, 1.3); Sfx.wlayer('myth', 2, true); Game.addShake(8);
      for (const e of [t, ...Gear.near(p, t, 280)]) {
        Status.add(e, 'burn', { t: 200, d: p.atk * 0.25 });
        if (e !== t) FX.add('world', new FBeam(e.x, e.y, 40, 16, { col: SF, core: SF2, h: 420, delay: randi(2, 8) }));
        Gear.proc(p, e, e === t ? 2.2 : 1.4, { quiet: true });
      }
      FX.add('top', new Label(X, sy(t.y, t.z + t.hurtH()) - 54, '성화 폭발', { col: ['#fffbe8', '#ffb43c'], size: 24 }));
    }
  },
};
WEAPONS.push(WEAPON_SUNFLAME);
WEAPON_BY_ID[WEAPON_SUNFLAME.id] = WEAPON_SUNFLAME;

// ---------- 타격 정의 ----------
WH.sfPillar = WS.hd({ dmg: 7, kx: 2, kz: 12, airKz: 10, stun: 50, stop: 8, shake: 8, fx: 'blunt', power: 1.8 });
WH.sfPillarEnd = WS.hd({ dmg: 16, kx: 6, kz: 10, airKz: 10, stun: 70, stop: 14, shake: 16, fx: 'heavy', power: 2.4 });
WH.sfSun = WS.hd({ dmg: 22, kx: 7, kz: 16, airKz: 14, stun: 90, stop: 18, shake: 26, fx: 'heavy', power: 2.6 });

// ---------- 일출 : 떠오르는 태양 (화면 효과) ----------
class FSunrise {
  constructor(p) { this.p = p; this.t = 0; this.add = true; }
  update() { return ++this.t < 190; }
  draw(ctx) {
    const t = this.t, up = E.out3(Math.min(1, t / 70)), fade = t < 150 ? 1 : 1 - (t - 150) / 40;
    const cx = this.p.x, cy = sy(this.p.y, 0) - 120 - up * 300 - Math.sin(t * 0.05) * 6, R = 80 + up * 90 + (t > 70 ? Math.min(60, (t - 70) * 0.9) : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade;
    for (let i = 0; i < 26; i++) {                                                  // 후광 · 빛살
      const a = i / 26 * TAU + t * 0.012 * (i % 2 ? 1 : -1), L = R * (2.4 + (i % 4) * 0.8 + up * 1.2), w = 0.04 + (i % 3) * 0.02;
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      g.addColorStop(0, `rgba(${SF},0.55)`); g.addColorStop(1, `rgba(${SF},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - w) * L, cy + Math.sin(a - w) * L); ctx.lineTo(cx + Math.cos(a + w) * L, cy + Math.sin(a + w) * L); ctx.fill();
    }
    const g2 = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 3.4);
    g2.addColorStop(0, 'rgba(255,250,230,0.95)'); g2.addColorStop(0.25, `rgba(${SF},0.65)`); g2.addColorStop(1, `rgba(${SFR},0)`);
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx, cy, R * 3.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(${SF2},0.8)`; ctx.lineWidth = 3;
    for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * (1.0 + k * 0.4) + Math.sin(t * 0.1 + k) * 4, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,252,240,0.98)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// 한정 검을 든 동안 늘 : 머리 위 후광 + 검 주위를 도는 불씨 / 성화 강림 중에는 크게
class FSunAura {
  constructor(p) { this.p = p; this.t = 0; this.add = true; }
  update() {
    this.t++; const p = this.p; if (!p.wdef || p.wdef.id !== 'wL1' || p.hp <= 0) return false;
    if (this.t % (p.sfT > 0 ? 3 : 9) === 0) FX.add('world', new Mote(p.x + rand(-30, 30), sy(p.y, rand(0, 150)), rand(-0.3, 0.3), rand(-2.4, -1), { col: choose([SF, SF2, SFR]), life: 36, r: rand(3, 7), grav: 0 }));
    return true;
  }
  draw(ctx) {
    const p = this.p, on = p.sfT > 0, k = on ? 1 : 0.5, fade = Math.min(1, this.t / 20), cx = p.x, cy = sy(p.y, p.z + 90), T = this.t;
    if (!p.visible) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade * (on ? Math.min(1, p.sfT / 40) : 1);
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 130 * (on ? 1 : 0.7)); g.addColorStop(0, `rgba(${SF},${0.3 * k})`); g.addColorStop(1, `rgba(${SF},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 130, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(${SF2},${0.55 + 0.25 * k})`; ctx.lineWidth = on ? 3.4 : 2.4; ctx.beginPath(); ctx.ellipse(cx, cy - 104, 36, 9, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(${SF},0.5)`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy - 104, 46, 12, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < (on ? 10 : 5); i++) { const a = i / (on ? 10 : 5) * TAU + T * 0.035; ctx.fillStyle = `rgba(${SF2},0.9)`; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 38, cy - 104 + Math.sin(a) * 9.5, 2.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
{
  const _tick = WS.tick;
  WS.tick = function () {
    _tick.call(this); const p = Game.player;
    if (!p) return;
    if (p.wdef && p.wdef.id === 'wL1' && !(p._sfA && FX.world.includes(p._sfA))) p._sfA = FX.add('world', new FSunAura(p));
    if (p.sfT > 0 && Game.frame % 30 === 0) Gear.heal(p, p.hpMax * 0.006, true);                  // 성화 강림 : 체력 서서히 회복
  };
}

// ---------- 스킬 ----------
forgeDef('wL1', {
  name: '성화 낙하', mp: 150, cd: 8, ico: ['sunpillar', SF],
  desc: '검을 하늘로 치켜들면 다섯 줄기 성화의 불기둥이 적을 차례로 쓸어가고, 마지막으로 거대한 기둥이 내려 모든 것을 불태운다. 기둥에 맞은 적은 떠오르며 화상을 입는다. 적이 없으면 앞쪽에 내린다.',
  act: {
    anim: 'a3', len: 78, cancel: 66, atkCancel: 60,
    start(p) { p.vx = 0; p.bladeGlow = 2.5; p.invul = Math.max(p.invul, 60); Sfx.wlayer('myth', 2, false); Sfx.play('ring', 0.6, 1.2); FF.screen({ kind: 'lines', col: '255,236,180', a: 0.18, life: 24, fin: 2, fout: 10 }); },
    update(p, f) {
      p.vx *= 0.6;
      if (f < 10) { FF.spray('glow', p.x, sy(p.y, 70 + f * 9), 4, { col: SF, v0: 1, v1: 4 }); if (f === 2) FX.add('ground', new FCircle(p.x, sy(p.y, 0), 200, 40, { col: SF })); }
      if (f === 10) {
        const d = p.facing, near = WS.nearest(p.x, p.y, 5, 700), spots = [];
        for (let i = 0; i < 5; i++) spots.push(near[i % Math.max(1, near.length)] && near.length ? { x: near[i % near.length].x + (i >= near.length ? rand(-90, 90) : 0), y: near[i % near.length].y } : { x: p.x + d * (150 + i * 120), y: p.y });
        spots.forEach((s, i) => Gear.later(i * 7, () => {
          const X = clamp(s.x, Game.room.minX, Game.room.maxX);
          FX.add('ground', new FCircle(X, sy(s.y, 0), 120, 14, { col: SF }));
          Gear.later(5, () => {
            FX.add('world', new FBeam(X, s.y, 120, 28, { col: SF, core: SF2, h: 760 }));
            FX.add('ground', new FRing(X, sy(s.y, 0), 10, 260, 20, { col: SF, w: 12 }));
            FF.impact(X, sy(s.y, 40), SF, 1.9, { burst: SF2 });
            FF.spray('flame', X, sy(s.y, 10), 16, { col: SFR, ang: -Math.PI / 2, spread: 1.1, v0: 4, v1: 11, l0: 22, l1: 34 });
            Sfx.play('explode', 0.5, 1.3); Sfx.wlayer('myth', 3, true); Game.addShake(8); Game.freeze(2);
            WS.area(p, X, s.y, 180, 140, WH.sfPillar, { hmax: 320, each: e => Status.add(e, 'burn', { t: 220, d: p.atk * 0.25 }) });
          });
        }));
      }
      if (f === 52) {                                                               // 마지막 : 거대한 기둥
        const near = WS.nearest(p.x, p.y, 1, 800)[0], X = clamp(near ? near.x : p.x + p.facing * 300, Game.room.minX, Game.room.maxX), Y = near ? near.y : p.y;
        FX.add('ground', new FCircle(X, sy(Y, 0), 260, 20, { col: SF }));
        Game.dimTo(0.35, 6);
        Gear.later(14, () => {
          FX.add('world', new FBeam(X, Y, 300, 42, { col: SF, core: SF2, h: 900 }));
          FX.add('world', new FBeam(X, Y, 150, 36, { col: SF2, core: '255,255,255', h: 900, delay: 2 }));
          FX.add('ground', new FRing(X, sy(Y, 0), 20, 620, 28, { col: SF, w: 22 })); FX.add('ground', new FRing(X, sy(Y, 0), 20, 420, 22, { col: SF2, w: 10, delay: 4 }));
          FX.add('ground', new FDecal(X, Y, 230, 220, { kind: 'scorch', col: '255,190,70' }));
          FF.impact(X, sy(Y, 50), SF, 2.6, { burst: SF2 });
          FF.spray('flame', X, sy(Y, 10), 30, { col: SFR, ang: -Math.PI / 2, spread: 1.3, v0: 5, v1: 14, l0: 26, l1: 42 });
          Sfx.play('explode', 0.9, 0.8); Sfx.wlayer('myth', 3, true); Game.addShake(22); Game.flashScreen(0.5, '255,244,205'); Game.freeze(8); forgeUndim(18);
          WS.area(p, X, Y, 420, 200, WH.sfPillarEnd, { hmax: 400, each: e => Status.add(e, 'burn', { t: 300, d: p.atk * 0.4 }) });
        });
      }
    },
  },
}, {
  name: '일출', mp: 520, cd: 38, ico: ['sunrise', SF],
  desc: '검을 높이 들면 등 뒤로 거대한 태양이 떠오르고, 눈부신 빛이 화면의 모든 적을 심판해 불태운다. 이어 15초 동안 「성화 강림」 : 대천사의 날개가 돋고 피해 +40%, 모든 공격이 강한 화상을 입히며, 3번 적중할 때마다 성화 참격이 근처 적을 벤다. 체력이 서서히 회복된다.',
  act: {
    anim: 'a1', len: 170, cancel: 999, atkCancel: 999,
    start(p) { forgeCine(p, '일 출', '日 出', SF, { bars: 170, dim: 0.55 }); p.invul = 200; p.vx = 0; FX.add('world', new FSunrise(p)); Sfx.play('roar', 0.5, 1.6); Sfx.play('ring', 0.7, 0.8); },
    update(p, f) {
      p.vx = 0; p.vy = 0;
      if (f < 70 && f % 2 === 0) FF.spray('glow', p.x + rand(-70, 70), sy(p.y, rand(0, 170)), 2, { col: SF, v0: 1, v1: 5 });
      if (f === 20) FX.add('ground', new FCircle(p.x, sy(p.y, 0), 320, 120, { col: SF }));
      if (f === 70) {
        p.bladeGlow = 3; Sfx.play('explode', 1, 0.7); Sfx.wlayer('myth', 3, true); Game.slowmo(0.2, 46); Game.zoomPunch(1.14);
        Game.flashScreen(0.9, '255,246,214'); Game.addShake(34); Game.freeze(12);
        for (const [r, c, w, d] of [[1100, SF, 26, 0], [760, SF2, 14, 5], [480, SFR, 10, 10]]) FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, r, 38, { col: c, w, delay: d }));
        const list = WS.onScreen();
        list.forEach((e, i) => {
          FX.add('world', new FBeam(e.x, e.y, 70, 34, { col: SF, core: SF2, h: 700, delay: randi(0, 10) }));
          FF.impact(e.x, sy(e.y, e.z + e.h * 0.5), SF, 1.6, { burst: SF2 });
          Gear.later(i % 4, () => { if (!e.hittable()) return; applyHit(p, e, WH.sfSun, { noStopAtt: true, dir: sign(e.x - p.x) || p.facing, hz: 80 }); Status.add(e, 'burn', { t: 360, d: p.atk * 0.4 }); });
        });
      }
      if (f === 96) {
        p.sfT = 900; p.hasteT = Math.max(p.hasteT || 0, 240); p.bladeGlow = 2.5;
        FX.add('world', new FWings(p, () => p.sfT > 0, { big: true, s: 1.15 }));
        FX.add('top', new Label(p.x, sy(p.y, p.z) - 240, '성화 강림', { col: ['#fffbe8', '#ffb43c'], size: 36, life: 80 }));
        FX.add('ground', new FRing(p.x, sy(p.y, 0), 20, 420, 26, { col: SF, w: 16 }));
        FF.spray('flame', p.x, sy(p.y, 20), 34, { col: SFR, ang: -Math.PI / 2, spread: 1.4, v0: 4, v1: 13, l0: 24, l1: 40 });
        Sfx.play('roar', 0.8, 0.9); Game.addShake(12);
        forgeUndim(28); p.actDone = true;
      }
    },
  },
});

// ---------- 아이콘 ----------
{
  const g4 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => { g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke(); g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'sunpillar':
        for (const x of [10, 17, 24, 31, 38]) line(() => { g.moveTo(x, x === 24 ? 2 : 8); g.lineTo(x, 36); }, x === 24 ? 3.4 : 2);
        line(() => { g.moveTo(6, 42); g.lineTo(42, 42); }, 2.4); break;
      case 'sunrise':
        g.fillStyle = C(1); g.beginPath(); g.arc(24, 34, 11, Math.PI, 0); g.fill();
        for (let i = 0; i < 7; i++) { const a = Math.PI + i / 6 * Math.PI; line(() => { g.moveTo(24 + Math.cos(a) * 15, 34 + Math.sin(a) * 15); g.lineTo(24 + Math.cos(a) * 22, 34 + Math.sin(a) * 22); }, 2.2); }
        line(() => { g.moveTo(4, 38); g.lineTo(44, 38); }, 2.4); break;
      default: g4.call(this, g, kind, col);
    }
  };
}
