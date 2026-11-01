/**
 * SPY PARTY - Service Worker
 * Hỗ trợ offline 100% bằng cách lưu trữ toàn bộ tài nguyên cục bộ
 */

const CACHE_NAME = 'spy-party-v1.0.0';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/components.css',
  './css/home.css',
  './css/game.css',
  './css/responsive.css',
  './js/storage.js',
  './js/audio.js',
  './js/wordBank.js',
  './js/roles.js',
  './js/player.js',
  './js/voting.js',
  './js/scoring.js',
  './js/game.js',
  './js/app.js',
  './data/words.json',
  './data/wordPairs.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// Cài đặt Service Worker và lưu cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Đang tải tài nguyên vào bộ nhớ đệm...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Xóa cache cũ:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Phản hồi yêu cầu mạng: Ưu tiên Cache -> Fallback Network (Offline First)
self.addEventListener('fetch', (event) => {
  // Chỉ xử lý các yêu cầu GET trong phạm vi
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Trả về từ cache ngay lập tức
        return cachedResponse;
      }

      // Nếu chưa có, tải từ mạng và cập nhật vào cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Nếu không có mạng và là trang HTML, fallback về trang chủ index.html
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

