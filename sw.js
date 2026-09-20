// 오프라인 캐시 : 한 번 실행하면 인터넷 없이도 플레이 가능
const CACHE = 'blade-raid-v3';
const ASSETS = [
  './', './index.html', './manifest.json',
  './js/util.js', './js/input.js', './js/audio.js', './js/rig.js', './js/characters.js',
  './js/anims.js', './js/fx.js', './js/entity.js', './js/player.js', './js/enemies.js',
  './js/boss.js', './js/stage.js', './js/ui.js', './js/touch.js', './js/game.js',
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
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      // 폰트 등 외부 자원도 받아두면 다음부터 오프라인에서 뜸
      if (res && (res.ok || res.type === 'opaque')) {
        const c = await caches.open(CACHE);
        c.put(req, res.clone()).catch(() => { });
      }
      return res;
    } catch (err) {
      return caches.match('./index.html');
    }
  })());
});
