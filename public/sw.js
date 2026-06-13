// Service worker minimal : requis par certains navigateurs (Chrome/Android)
// pour considérer l'application comme "installable" (bouton d'ajout à
// l'écran d'accueil). Ne met rien en cache, ne gère pas fetch (pas de no-op
// handler) pour éviter le surcoût d'interception et l'interruption des
// requêtes en cours au premier chargement.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
