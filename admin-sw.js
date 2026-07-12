const CACHE = 'magnus-admin-v1';
const SHELL = [
  '/admin.html',
  '/js/dados.js',
  '/js/admin.js',
  '/images/logo-icone.png',
  '/images/logo.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Supabase, Cloudinary e CDNs externos: sempre via rede
  if (
    url.includes('supabase.co') ||
    url.includes('cloudinary.com') ||
    url.includes('googleapis.com') ||
    url.includes('jsdelivr.net') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('flatpickr')
  ) return;

  // Shell local: cache first, rede como fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
