// 오프라인 캐시 : 한 번 실행하면 인터넷 없이도 플레이 가능
const CACHE = 'blade-raid-v6';
const BUILD = '20260920d';
const ASSETS = [
  './', './index.html', './manifest.json',
  './js/util.js?v=' + BUILD, './js/input.js?v=' + BUILD, './js/audio.js?v=' + BUILD, './js/rig.js?v=' + BUILD, './js/characters.js?v=' + BUILD,
  './js/anims.js?v=' + BUILD, './js/fx.js?v=' + BUILD, './js/entity.js?v=' + BUILD, './js/player.js?v=' + BUILD, './js/enemies.js?v=' + BUILD,
  './js/boss.js?v=' + BUILD, './js/themes.js?v=' + BUILD, './js/stage.js?v=' + BUILD, './js/dungeons.js?v=' + BUILD,
  './js/ui.js?v=' + BUILD, './js/touch.js?v=' + BUILD, './js/lobby.js?v=' + BUILD, './js/game.js?v=' + BUILD,
  './fonts/BlackHanSans-Regular.ttf',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/icon-180.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // HTTP 캐시를 건너뛰고 항상 새로 받아 저장
    await Promise.all(ASSETS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => { })));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 문서는 네트워크 우선 : 새 버전이 나오면 바로 반영되게
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const c = await caches.open(CACHE); c.put('./index.html', res.clone()).catch(() => { });
        return res;
      } catch (err) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  // 나머지는 캐시 우선 (주소에 ?v= 버전이 붙으므로 정확히 일치할 때만 재사용)
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const c = await caches.open(CACHE);
        c.put(req, res.clone()).catch(() => { });
      }
      return res;
    } catch (err) {
      return (await caches.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
