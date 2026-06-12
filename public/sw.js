// Service worker minimal : requis par certains navigateurs (Chrome/Android)
// pour considérer l'application comme "installable" (bouton d'ajout à
// l'écran d'accueil). Ne met rien en cache, laisse passer toutes les requêtes.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => {});
