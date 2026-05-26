// ╔══════════════════════════════════════════════════╗
// ║  APP BOOTSTRAP                                   ║
// ╚══════════════════════════════════════════════════╝

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
