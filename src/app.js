import { registerPWA, promptInstall } from './pwa.js';

async function boot() {
  // your existing init flow
  // await DB.init();
  // renderApp();

  await registerPWA({
    onInstallAvailable() {
      const btn = document.getElementById('installBtn');
      if (btn) btn.hidden = false;
    },
    onUpdate() {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Update ready. Reload to apply.';
        toast.classList.add('show');
      }
    }
  });

  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      const accepted = await promptInstall();
      if (!accepted) return;
      installBtn.hidden = true;
    });
  }
}

boot();
(function bootstrap(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
  const start = () => { if (typeof init === 'function') init(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
