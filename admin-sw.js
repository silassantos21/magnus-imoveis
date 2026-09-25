const CACHE = 'magnus-admin-v4';
const SHELL = [
  '/admin.html',
  '/js/dados.js',
  '/js/admin.js',
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

  // Shell local: rede primeiro, ignorando qualquer cache HTTP no caminho
  // (cache: 'no-store' evita depender só do Cache-Control do Vercel —
  // se algum dia um header de cache ficar errado de novo, isso não trava
  // o admin numa versão antiga). Cache do service worker só como fallback offline.
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
