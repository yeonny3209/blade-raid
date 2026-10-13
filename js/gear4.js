'use strict';
// ============================================================
//  신화급 검 : 라그나로크 (3,300,000G · 가장 비싼 검)
// ============================================================
PART.myth = function (x, y, z, d, pw, b, W) { PART.fire(x, y, z, d, pw, b * 0.7, W); PART.elec(x, y, z, d, pw, b * 0.7, W); };

// 궁니르 : 앞으로 날아가며 꿰뚫는 번개의 창
class WSpear {
  constructor(p, x, y, dir) { Object.assign(this, { p, x, y, dir, t: 0, life: 46, hits: new Map(), add: true }); }
  update() {
    this.t++; this.x += this.dir * 27; const p = this.p, r = Game.room;
    for (const e of Game.enemies) {
      if (!e.hittable() || Math.abs(e.x - this.x) > 90 + e.w || Math.abs(e.y - this.y) > 70) continue;
      if (this.t - (this.hits.get(e) || -99) < 5) continue;
      this.hits.set(e, this.t);
      applyHit(p, e, WH.spear, { noStopAtt: true, dir: this.dir, hz: 80 });
      Status.add(e, 'shock', { t: 14 });
    }
    if (this.t % 2 === 0) FX.add('world', new Bolt(this.x - this.dir * rand(80, 260), sy(this.y, 80) + rand(-30, 30), this.x - this.dir * rand(0, 60), sy(this.y, 80), { life: 6, amp: 10, w: 2.6, col: '255,230,140' }));
    if (this.t >= this.life || this.x < r.minX - 100 || this.x > r.maxX + 100) {
      const gy = sy(this.y, 0);
      FX.add('world', new Bolt(this.x, sy(0, 640), this.x, gy, { life: 12, amp: 26, w: 6 })); FX.add('world', new Flash(this.x, gy - 40, 20, 300, 20, '255,230,140', 1)); FX.add('ground', new Ring(this.x, gy, 20, 320, 24, { col: '255,225,130', w: 14 }));
      Sfx.wlayer('myth', 3, true); Sfx.play('explode', 0.9); Game.addShake(14); Game.flashScreen(0.3, '255,245,200');
      WS.area(p, this.x, this.y, 300, 120, WH.spearBoom);
      return false;
    }
    return true;
  }
  draw(ctx) {
    const d = this.dir, X = this.x, Y = sy(this.y, 80);
    ctx.save(); ctx.translate(X, Y); ctx.scale(d, 1);
    drawGlow(ctx, -60, 0, 150, '255,225,120', 0.5, 1.6, 0.5);
    ctx.fillStyle = '#7a4a10'; ctx.fillRect(-170, -4, 170, 8); ctx.fillStyle = '#ffe9a0'; ctx.fillRect(-170, -1.5, 170, 3);
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(0, -15); ctx.lineTo(-8, 0); ctx.lineTo(0, 15); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d8a030'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  }
}
Object.assign(WH, {
  spear: WS.hd({ dmg: 2.4, kx: 3, kz: 2, airKz: 3, stun: 24, stop: 3, shake: 3, fx: 'pierce', power: 1.4 }),
  spearBoom: WS.hd({ dmg: 11, kx: 9, kz: 11, airKz: 10, stun: 60, stop: 12, shake: 12, fx: 'heavy', power: 2.1 }),
  ragFire: WS.hd({ dmg: 4, kx: 3, kz: 9, airKz: 8, stun: 50, stop: 6, shake: 6, fx: 'none', sfx: 'heavy', power2: 2 }),
  ragSword: WS.hd({ dmg: 34, kx: 10, kz: 14, airKz: 12, stun: 80, stop: 20, shake: 20, fx: 'heavy', power: 2.8 }),
});

const WEAPON_MYTH = {
  id: 'w34', name: '신화의 대검 라그나로크', sub: '신들의 황혼을 끝낸 마지막 검', price: 3300000, map: 2,
  atk: 1.62, crit: 0.12, critDmg: 1.9, stop: 1.3, shake: 1.5, kx: 1.3, col: '255,205,120', snd: 'myth', part: 'myth', pitch: 0.85, swingPitch: 0.88,
  feel: '천둥 같은 저음과 황금빛 종소리', desc: '7번째 적중마다 신화의 일격 : 하늘의 번개 · 불기둥 · 서리가 동시에 내리쳐 대상과 주변 적에게 110% 피해 + 화상 + 둔화. 치명타율 +12%, 치명타 피해 x1.9.',
  look: { c: ['#3a0e0e', '#d8a030', '#fff4c0'], hw: 7.6, L: 1.16, edge: 'crystal', tip: 'cleave', guard: 'wing', glow: '255,205,120', rune: '255,225,140', trim: ['#6a1a10', '#e8b030', '#fff0a0'], taper: 0.02 },
  amb: ['star', '255,210,130', 0.3],
  hit(p, t, dmg) {
    if (_n(p, 'rg') % 7 !== 0) return;
    const X = t.x, gy = sy(t.y, 0);
    FX.add('world', new Bolt(X + rand(-40, 40), sy(0, 640), X, sy(t.y, t.z + t.h * 0.5), { life: 14, amp: 34, w: 6 }));
    FX.add('world', new Pillar(X, t.y, 60, 480, 26, '255,120,30', '255,235,170')); FX.add('ground', new Ring(X, gy, 20, 300, 22, { col: '170,225,255', w: 12 }));
    FX.add('world', new Flash(X, gy - 40, 20, 240, 20, '255,225,140', 0.95));
    FX.add('top', new Label(X, sy(t.y, t.z + t.hurtH()) - 58, 'RAGNAROK', { col: ['#fff6d0', '#ff9a30'], size: 26, life: 60 }));
    Sfx.wlayer('myth', 3, true); Game.addShake(9); Game.flashScreen(0.2, '255,240,200');
    for (const e of [t, ...Gear.near(p, t, 300)]) { Gear.proc(p, e, 1.1, { quiet: true, crit: true, hit: { dmg: 1, kx: 5, kz: 7, stun: 40 } }); Status.add(e, 'burn', { t: 150, d: dmg * 0.1 }); Status.add(e, 'slow', { t: 120, m: 0.55 }); }
  },
};

WSK.w34 = ws({
  name: '궁니르', mp: 170, cd: 9, ico: ['spear', '255,225,130'], desc: '번개를 두른 황금 창을 앞으로 던진다. 창은 길을 막는 모든 적을 꿰뚫으며 날아가고, 끝에 닿는 곳에 벼락과 함께 폭발한다.',
  act: {
    anim: 'a2', len: 30, cancel: 16, atkCancel: 14,
    update(p, f) {
      p.vx *= 0.5;
      if (f === 6) { Sfx.pplay('swingBig'); Sfx.wlayer('myth', 3, false); Game.flashScreen(0.15, '255,245,200'); p.bladeGlow = 2; FX.add('world', new WSpear(p, p.x + p.facing * 60, p.y, p.facing)); }
    },
  },
}, {
  name: '라그나로크', mp: 520, cd: 46, ico: ['ragnarok', '255,205,120'], desc: '신들의 황혼을 불러낸다. 먹구름에서 낙뢰가 쏟아지고, 적마다 발밑에서 불기둥이 솟고, 마지막에는 하늘에서 거대한 신검이 떨어져 모든 것을 끝낸다.',
  act: {
    anim: 'ultUp', len: 60, cancel: 46, atkCancel: 40,
    start(p) { WS.cutin(p, '라그나로크', '神 들 의 黃 昏', '255,205,120'); p.invul = 260; p.vx = 0; },
    update(p, f) {
      if (f !== 10) return;
      p.bladeGlow = 3; Game.flashScreen(0.5, '255,230,170'); Sfx.wlayer('myth', 3, true); Game.addShake(12);
      FX.add('world', new WStorm(p));
      for (let k = 0; k < 6; k++) Gear.later(20 + k * 14, () => {
        const list = WS.onScreen(); if (!list.length) return;
        const e = choose(list);
        FX.add('world', new Pillar(e.x, e.y, 56, 520, 24, '255,120,30', '255,235,170')); FX.add('ground', new Ring(e.x, sy(e.y, 0), 20, 230, 20, { col: '255,170,70', w: 10 }));
        Sfx.wlayer('myth', 2, false); Game.addShake(5);
        WS.area(p, e.x, e.y, 200, 90, WH.ragFire, { each: e2 => Status.add(e2, 'burn', { t: 150, d: p.atk * 0.2 }) });
      });
      Gear.later(170, () => {
        const list = WS.onScreen();
        let best = null, bn = -1;
        for (const e of list) { const n = list.filter(o => Math.abs(o.x - e.x) < 320).length; if (n > bn) { bn = n; best = e; } }
        const x = best ? best.x : p.x + p.facing * 300, y = best ? best.y : p.y;
        Sfx.play('charge');
        FX.add('world', new WBigBlade(x, y, {
          kind: 'sword', dur: 40, onImpact: b => {
            const gy = sy(b.y, 0);
            FX.add('world', new Flash(b.x, gy - 60, 60, 640, 34, '255,235,170', 1)); FX.add('world', new Pillar(b.x, b.y, 150, 700, 40, '255,200,100', '255,255,240'));
            FX.add('ground', new Ring(b.x, gy, 40, 660, 34, { col: '255,225,140', w: 26 }));
            Sfx.play('explode', 1.2); Sfx.wlayer('myth', 3, true); Game.addShake(26); Game.flashScreen(0.8, '255,250,225'); Game.zoomPunch(1.1);
            for (const e of WS.onScreen()) applyHit(p, e, WH.ragSword, { noStopAtt: true, dir: sign(e.x - b.x) || 1 });
          },
        }));
      });
    },
  },
});

// ---------- 스킬 아이콘 ----------
{
  const g2 = WS.glyph;
  WS.glyph = function (g, kind, col) {
    const C = a => `rgba(${col},${a})`;
    const line = (fn, w = 3) => { g.strokeStyle = C(0.35); g.lineWidth = w * 3; g.beginPath(); fn(); g.stroke(); g.strokeStyle = C(1); g.lineWidth = w; g.beginPath(); fn(); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = w * 0.4; g.beginPath(); fn(); g.stroke(); };
    const fill = (fn, a = 1) => { g.fillStyle = C(a); g.beginPath(); fn(); g.fill(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    switch (kind) {
      case 'spear': line(() => { g.moveTo(4, 40); g.lineTo(38, 10); }, 3); fill(() => { g.moveTo(44, 6); g.lineTo(32, 10); g.lineTo(38, 18); }); line(() => { g.moveTo(8, 30); g.lineTo(18, 26); g.lineTo(14, 34); g.lineTo(26, 28); }, 1.4); break;
      case 'ragnarok': fill(() => { g.moveTo(24, 44); g.lineTo(18, 32); g.lineTo(18, 8); g.lineTo(30, 8); g.lineTo(30, 32); }); fill(() => g.rect(10, 6, 28, 4), 0.8); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; line(() => { g.moveTo(24 + Math.cos(a) * 14, 22 + Math.sin(a) * 14); g.lineTo(24 + Math.cos(a) * 20, 22 + Math.sin(a) * 20); }, 1.6); } break;
      default: g2.call(this, g, kind, col);
    }
  };
}

// ---------- 등록 ----------
WEAPONS.push(WEAPON_MYTH);
WEAPONS.sort(_byPrice);
WEAPON_BY_ID[WEAPON_MYTH.id] = WEAPON_MYTH;
{
  const W0 = WEAPON_MYTH; W0.skills = WSK.w34;
  for (const k of ['s5', 's6']) { const s = W0.skills[k]; s.icon = 'ws_w34_' + k; s.act.isSkill = true; s.act.name = 'w34' + k; }
}
