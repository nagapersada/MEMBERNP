// SAYA GANTI CACHE JADI v99 SUPAYA HP ANDA DIPAKSA DOWNLOAD ULANG
const CACHE = 'dvteam-v99-force-update';
const ASSETS = [
    './',
    'index.html',
    'dashboard.html',
    'list.html',
    'network.html',
    'style.css',
    'script.js',
    'icon.png'
];

self.addEventListener('install', e => {
    self.skipWaiting(); // Paksa SW baru aktif detik ini juga
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
    // HAPUS SEMUA CACHE LAMA YANG BIKIN ERROR
    e.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => {
                // Hapus apa saja yang bukan versi v99 ini
                if (k !== CACHE) {
                    return caches.delete(k);
                }
            })
        ))
    );
    self.clients.claim();
});

// Strategi Network First: Coba ambil dari internet dulu, kalau gagal baru cache
// Ini biar kalau ada update, user langsung dapat yang baru
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request)
            .catch(() => caches.match(e.request))
    );
});
