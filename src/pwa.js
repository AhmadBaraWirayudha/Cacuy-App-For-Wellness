const pwaState = {
  registration: null,
  deferredPrompt: null
};

export async function registerPWA({ onUpdate, onInstallAvailable } = {}) {
  if (!('serviceWorker' in navigator)) return null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pwaState.deferredPrompt = event;
    if (typeof onInstallAvailable === 'function') onInstallAvailable();
  });

  window.addEventListener('appinstalled', () => {
    pwaState.deferredPrompt = null;
  });

  const registration = await navigator.serviceWorker.register('/service-worker.js', {
    scope: '/'
  });

  pwaState.registration = registration;

  registration.addEventListener('updatefound', () => {
    const sw = registration.installing;
    if (!sw) return;

    sw.addEventListener('statechange', () => {
      if (sw.state === 'installed' && navigator.serviceWorker.controller) {
        if (typeof onUpdate === 'function') onUpdate(registration);
      }
    });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  registration.update();

  return registration;
}

export async function promptInstall() {
  const prompt = pwaState.deferredPrompt;
  if (!prompt) return false;

  prompt.prompt();
  const result = await prompt.userChoice;
  pwaState.deferredPrompt = null;
  return result.outcome === 'accepted';
}

export function canInstallPWA() {
  return !!pwaState.deferredPrompt;
}

export function getPWARegistration() {
  return pwaState.registration;
}
