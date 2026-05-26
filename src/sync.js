// ╔══════════════════════════════════════════════════╗
// ║  SYNC (stubs for later)                          ║
// ╚══════════════════════════════════════════════════╝

function connectGoogleCalendar(){showToast('Sync belum diaktifkan');}
function disconnectGoogleCalendar(){showToast('Sync belum diaktifkan');}
function queueSync(){return Promise.resolve([]);}
function flushSyncQueue(){return Promise.resolve(true);}
function reconcileRemote(){return Promise.resolve(true);}
