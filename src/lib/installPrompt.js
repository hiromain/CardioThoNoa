// Gestion de l'installation PWA (ajout à l'écran d'accueil).
// Capte l'évènement `beforeinstallprompt` (Chrome/Android/desktop) dès qu'il
// est émis par le navigateur, pour pouvoir déclencher la fenêtre native
// d'installation depuis un bouton de l'app.

let deferredEvent = null;
const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb());
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredEvent = e;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredEvent = null;
  notify();
});

export function canPromptInstall() {
  return !!deferredEvent;
}

export function subscribeInstallPrompt(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall() {
  if (!deferredEvent) return null;
  deferredEvent.prompt();
  const choice = await deferredEvent.userChoice;
  deferredEvent = null;
  notify();
  return choice;
}

export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
