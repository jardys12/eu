const CACHE_NAME = 'flokite-v2';
const ASSETS = [
  './index.html',
  './js/firebase-config.js',
  './js/firestore-service.js',
  './assets/flokite-logo.jpeg',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore-compat.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  // Network first for API/Firebase, Cache first for assets
  if (e.request.url.includes('firestore.googleapis.com')) {
    return; // Let Firebase SDK handle it
  }
  
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).then(res => {
        return caches.open(CACHE_NAME).then(cache => {
            // Optional: cache new requests
            return res;
        });
      });
    })
  );
});
