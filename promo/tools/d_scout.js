// 스카우트 2 : 점수(이펙트 수 + 흔들림 + 섬광)가 높은 순간 4장만 골라 큰 축소판으로
(() => {
  const V = window.__V;
  V.scout2 = async (items, o = {}) => {
    const cols = o.cols || 4, tw = 1920 / cols, th = tw * 9 / 16, lab = 26, every = o.every || 12, first = o.first ?? 24, last = o.last || 300, sep = o.sep || 30;
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = items.length * (th + lab);
    const g = cv.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, cv.height);
    const info = [];
    for (let ii = 0; ii < items.length; ii++) {
      const it = items[ii], y0 = ii * (th + lab);
      V.rng = V.mul(it.seed || 77); Math.random = V.mul((it.seed || 77) + 1000);
      V.gt = 0; V.acc = 0;
      V.setup(it.dun, it.w, it.a || 'a0', { last: it.last, n: it.n ?? 8, tank: it.tank ?? 3000, gap: it.gap });
      for (let k = 0; k < (it.warm || 10); k++) { V.pilot({ idle: true }); V.tick(); }
      const key = it.key || 's6';
      V.cast(key);
      const cand = [];
      let cutinSeen = 0;
      for (let u = 1; u <= last; u++) {
        if (it.keys2 && it.keys2[u]) V.cast(it.keys2[u]);
        V.pilot({ close: it.close || 110, noAtk: it.noAtk });
        if (Game.cutin) { cutinSeen = 1; Game.cutin = null; }
        V.tick(); Game.flash *= 0.86;
        if (!o.keepPick) Game.pickups.length = 0;
        if (!it.last && u % 30 === 0) V.fill(it.n ?? 8);
        if (u >= first && (u - first) % every === 0) {
          V.camTo({ on: it.on || 'mid', z: it.z || 1.25, oy: -20 }, true); V.world({ combo: true, bossBar: true });
          const c = document.createElement('canvas'); c.width = tw; c.height = th; c.getContext('2d').drawImage(Game.canvas, 0, 0, tw, th);
          cand.push({ u, c, s: FX.world.length + FX.ground.length + FX.top.length * 0.3 + Game.shakeA * 4 + Game.flash * 60 + Game.projectiles.length * 2 });
        }
      }
      const pick = [];
      for (const c of cand.slice().sort((a, b) => b.s - a.s)) { if (pick.length < cols && pick.every(q => Math.abs(q.u - c.u) >= sep)) pick.push(c); }
      pick.sort((a, b) => a.u - b.u);
      pick.forEach((c, i) => {
        g.drawImage(c.c, i * tw, y0 + lab);
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(i * tw, y0 + lab, 110, 22); g.fillStyle = '#fff'; g.font = '700 16px sans-serif'; g.textBaseline = 'top'; g.fillText('u' + c.u + ' s' + Math.round(c.s), i * tw + 4, y0 + lab + 3);
      });
      const wdef = WEAPON_BY_ID[it.w], sk = wdef.skills && wdef.skills[key];
      g.fillStyle = '#ffd24a'; g.font = '700 18px sans-serif'; g.textBaseline = 'top';
      g.fillText(`${it.w} ${wdef.name} · ${key} ${sk ? sk.name : ''} · ${it.dun}${it.last ? ' (boss)' : ''} · cutin:${cutinSeen} · max ${Math.round(Math.max(...cand.map(c => c.s)))}`, 8, y0 + 4);
      info.push([it.w, key, sk && sk.name, it.dun, pick.map(c => c.u + ':' + Math.round(c.s)).join(' ')].join(' '));
    }
    await V.post('scout/' + (o.name || 'sheet') + '.jpg', await V.blob(cv, 0.86));
    return info;
  };
})();
'scout ok';
