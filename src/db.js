// src/db.js
const DB_NAME = 'CacuyDB';
const DB_VERSION = 2;

const STORE = {
  settings: { keyPath: 'key' },
  routines: { keyPath: 'id' },
  logs: { keyPath: 'id' },
  mood: { keyPath: 'id' },
  cycle: { keyPath: 'id' },
  syncQueue: { keyPath: 'id' },
  metadata: { keyPath: 'key' },
  state: { keyPath: 'key' }, // legacy migration only
};

const META_KEY = 'app';
const LEGACY_KEY = 'cacuy_v3';

const DEFAULT_SETTINGS = {
  key: META_KEY,
  theme: 'light',
  activeTab: 'home',
  syncEnabled: false,
  googleCalendar: { enabled: false, calendarId: '', lastSyncAt: null },
  health: { enabled: false, provider: 'samsung-health', lastSyncAt: null },
  updatedAt: null,
};

const DEFAULT_METADATA = {
  key: META_KEY,
  schemaVersion: DB_VERSION,
  createdAt: null,
  updatedAt: null,
  migratedFromLegacy: false,
  lastBackupAt: null,
  lastImportAt: null,
};

const STORE_KEYS = {
  settings: 'key',
  metadata: 'key',
  routines: 'id',
  logs: 'id',
  mood: 'id',
  cycle: 'id',
  syncQueue: 'id',
  state: 'key',
};

let _db = null;
let _openPromise = null;
let _ready = false;
let _flushTimer = null;
const _writeQueue = [];
const _waiters = [];

const nowISO = () => new Date().toISOString();
const uid = () =>
  (crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
  });
}

function ensureRecord(storeName, value = {}, key) {
  const v = clone(value);

  if (storeName === 'settings' || storeName === 'metadata' || storeName === 'state') {
    v.key = key ?? v.key ?? META_KEY;
    if (!v.createdAt) v.createdAt = nowISO();
    v.updatedAt = nowISO();
    return v;
  }

  v.id = key ?? v.id ?? uid();
  if (!v.createdAt) v.createdAt = nowISO();
  v.updatedAt = nowISO();
  return v;
}

function normalizeImportedPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  if (payload.stores && typeof payload.stores === 'object') return payload;

  // Legacy single-object export from the old app
  const legacy = payload;
  return {
    version: DB_VERSION,
    exportedAt: nowISO(),
    stores: {
      settings: [
        ensureRecord('settings', {
          ...DEFAULT_SETTINGS,
          xp: legacy.xp ?? 0,
          skincare: legacy.skincare ?? {},
          exercise: legacy.exercise ?? {},
          belajar: legacy.belajar ?? {},
          theme: legacy.theme ?? 'light',
        }, META_KEY),
      ],
      routines: [
        ...(Array.isArray(legacy.products) ? legacy.products.map((p) => ensureRecord('routines', {
          type: 'product',
          ...p,
        })) : []),
        ...(legacy.customRoutine ? [ensureRecord('routines', {
          type: 'customRoutine',
          morning: legacy.customRoutine.morning ?? [],
          evening: legacy.customRoutine.evening ?? [],
          routineChecks: legacy.routineChecks ?? {},
        }, 'custom-routine')] : []),
      ],
      logs: [
        ...(Array.isArray(legacy.skinLogs) ? legacy.skinLogs.map((x) => ensureRecord('logs', { type: 'skin', ...x })) : []),
        ...(Array.isArray(legacy.notes) ? legacy.notes.map((x) => ensureRecord('logs', { type: 'note', ...x })) : []),
      ],
      mood: Array.isArray(legacy.moodLogs) ? legacy.moodLogs.map((x) => ensureRecord('mood', x)) : [],
      cycle: Array.isArray(legacy.periodLogs) ? legacy.periodLogs.map((x) => ensureRecord('cycle', x)) : [],
      syncQueue: Array.isArray(legacy.syncQueue) ? legacy.syncQueue.map((x) => ensureRecord('syncQueue', x)) : [],
      metadata: [ensureRecord('metadata', {
        ...DEFAULT_METADATA,
        migratedFromLegacy: true,
        lastImportAt: nowISO(),
      }, META_KEY)],
    },
  };
}

function createStoreSchema(db) {
  const make = (name, opts = {}) => {
    if (db.objectStoreNames.contains(name)) return db.transaction ? db.transaction(name, 'readonly').objectStore(name) : null;
    const store = db.createObjectStore(name, { keyPath: STORE[name]?.keyPath || opts.keyPath || 'id' });
    return store;
  };

  const settings = make('settings', { keyPath: 'key' });
  const routines = make('routines', { keyPath: 'id' });
  const logs = make('logs', { keyPath: 'id' });
  const mood = make('mood', { keyPath: 'id' });
  const cycle = make('cycle', { keyPath: 'id' });
  const syncQueue = make('syncQueue', { keyPath: 'id' });
  const metadata = make('metadata', { keyPath: 'key' });

  // Legacy store retained only for migration compatibility.
  if (!db.objectStoreNames.contains('state')) db.createObjectStore('state', { keyPath: 'key' });

  if (routines) {
    routines.createIndex('type', 'type', { unique: false });
    routines.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
  if (logs) {
    logs.createIndex('type', 'type', { unique: false });
    logs.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
  if (mood) {
    mood.createIndex('date', 'date', { unique: false });
    mood.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
  if (cycle) {
    cycle.createIndex('date', 'date', { unique: false });
    cycle.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
  if (syncQueue) {
    syncQueue.createIndex('status', 'status', { unique: false });
    syncQueue.createIndex('createdAt', 'createdAt', { unique: false });
  }
  if (metadata) {
    metadata.createIndex('updatedAt', 'updatedAt', { unique: false });
  }
}

async function open() {
  if (_db) return _db;
  if (_openPromise) return _openPromise;

  _openPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      createStoreSchema(db);

      const tx = ev.target.transaction;
      const metaStore = tx.objectStore('metadata');
      metaStore.put({
        ...DEFAULT_METADATA,
        key: META_KEY,
        schemaVersion: DB_VERSION,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      });

      // Legacy migration from the previous single-blob app.
      if (db.objectStoreNames.contains('state')) {
        try {
          const legacyStore = tx.objectStore('state');
          legacyStore.get(LEGACY_KEY).onsuccess = (e) => {
            const raw = e.target.result;
            if (!raw) return;
            let parsed = null;
            try {
              parsed = typeof raw.value === 'string' ? JSON.parse(raw.value) : (typeof raw === 'string' ? JSON.parse(raw) : raw.value ?? raw);
            } catch {
              parsed = null;
            }
            if (!parsed) return;

            const legacy = normalizeImportedPayload(parsed);
            if (!legacy) return;

            const write = (storeName, rows) => {
              if (!rows || !rows.length) return;
              const os = tx.objectStore(storeName);
              rows.forEach((row) => os.put(row));
            };

            write('settings', legacy.stores.settings);
            write('routines', legacy.stores.routines);
            write('logs', legacy.stores.logs);
            write('mood', legacy.stores.mood);
            write('cycle', legacy.stores.cycle);
            write('syncQueue', legacy.stores.syncQueue);
            write('metadata', legacy.stores.metadata);

            metaStore.put({
              ...DEFAULT_METADATA,
              key: META_KEY,
              schemaVersion: DB_VERSION,
              migratedFromLegacy: true,
              updatedAt: nowISO(),
            });
          };
        } catch {
          // Ignore migration errors; init will continue with empty stores.
        }
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      _db.onversionchange = () => {
        _db.close();
        _db = null;
        _openPromise = null;
      };
      _ready = true;
      resolve(_db);
    };

    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'));
  });

  return _openPromise;
}

function scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = Promise.resolve().then(flushQueue);
}

async function flushQueue() {
  _flushTimer = null;
  if (!_writeQueue.length) return;

  const ops = _writeQueue.splice(0, _writeQueue.length);
  const db = await open();
  const stores = [...new Set(ops.map((x) => x.store))];
  const tx = db.transaction(stores, 'readwrite');

  for (const op of ops) {
    const os = tx.objectStore(op.store);
    if (op.type === 'put') os.put(op.value);
    else if (op.type === 'delete') os.delete(op.key);
    else if (op.type === 'clear') os.clear();
  }

  try {
    await txDone(tx);
    ops.forEach((op) => op.resolve(op.value ?? true));
  } catch (err) {
    ops.forEach((op) => op.reject(err));
  }
}

function enqueueWrite(type, store, payload = {}) {
  return new Promise((resolve, reject) => {
    _writeQueue.push({ type, store, ...payload, resolve, reject });
    scheduleFlush();
  });
}

async function getStore(storeName, mode = 'readonly') {
  const db = await open();
  return db.transaction(storeName, mode).objectStore(storeName);
}

async function get(storeName, key = undefined) {
  const os = await getStore(storeName, 'readonly');
  const k = key ?? STORE_KEYS[storeName] ?? META_KEY;
  return reqToPromise(os.get(k));
}

async function getAll(storeName) {
  const os = await getStore(storeName, 'readonly');
  return reqToPromise(os.getAll());
}

async function save(storeName, value, key = undefined) {
  const record = ensureRecord(storeName, value, key);
  return enqueueWrite('put', storeName, { value: record });
}

async function update(storeName, key, patch = {}) {
  const current = await get(storeName, key);
  const merged = ensureRecord(storeName, { ...(current || {}), ...patch }, key);
  return enqueueWrite('put', storeName, { value: merged });
}

async function remove(storeName, key = undefined) {
  const k = key ?? STORE_KEYS[storeName] ?? META_KEY;
  return enqueueWrite('delete', storeName, { key: k });
}

async function bulkInsert(storeName, items = []) {
  if (!Array.isArray(items) || !items.length) return [];
  const db = await open();
  const tx = db.transaction(storeName, 'readwrite');
  const os = tx.objectStore(storeName);
  const out = [];

  for (const item of items) {
    const row = ensureRecord(storeName, item);
    os.put(row);
    out.push(row);
  }

  await txDone(tx);
  return out;
}

async function clearStore(storeName) {
  return enqueueWrite('clear', storeName);
}

async function ensureDefaults() {
  await open();
  const meta = await get('metadata', META_KEY).catch(() => null);
  if (!meta) {
    await save('metadata', { ...DEFAULT_METADATA, key: META_KEY, createdAt: nowISO(), updatedAt: nowISO() }, META_KEY);
  }
  const settings = await get('settings', META_KEY).catch(() => null);
  if (!settings) {
    await save('settings', { ...DEFAULT_SETTINGS, key: META_KEY, createdAt: nowISO(), updatedAt: nowISO() }, META_KEY);
  }
}

async function exportJSON() {
  await open();
  const stores = {};
  for (const name of ['settings', 'routines', 'logs', 'mood', 'cycle', 'syncQueue', 'metadata']) {
    stores[name] = await getAll(name);
  }
  return {
    version: DB_VERSION,
    exportedAt: nowISO(),
    stores,
  };
}

async function downloadBackup(filename = `cacuy_backup_${new Date().toISOString().slice(0, 10)}.json`) {
  const data = await exportJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return filename;
}

async function restoreJSON(input, { replace = true } = {}) {
  await open();

  const payload =
    typeof input === 'string'
      ? JSON.parse(input)
      : input instanceof File
        ? JSON.parse(await input.text())
        : input;

  const normalized = normalizeImportedPayload(payload);
  if (!normalized) throw new Error('Invalid backup payload');

  if (replace) {
    for (const name of ['settings', 'routines', 'logs', 'mood', 'cycle', 'syncQueue', 'metadata']) {
      await clearStore(name);
    }
  }

  const { stores } = normalized;
  await bulkInsert('settings', stores.settings || []);
  await bulkInsert('routines', stores.routines || []);
  await bulkInsert('logs', stores.logs || []);
  await bulkInsert('mood', stores.mood || []);
  await bulkInsert('cycle', stores.cycle || []);
  await bulkInsert('syncQueue', stores.syncQueue || []);
  await bulkInsert('metadata', [
    ...(stores.metadata || []),
    { ...DEFAULT_METADATA, key: META_KEY, lastImportAt: nowISO(), updatedAt: nowISO() },
  ]);

  return normalized;
}

async function importFromFile(file, opts) {
  return restoreJSON(file, opts);
}

async function migrateLegacyStateIfPresent() {
  await open();
  const legacy = await get('state', LEGACY_KEY).catch(() => null);
  if (!legacy) return false;

  let parsed = null;
  try {
    parsed = typeof legacy.value === 'string' ? JSON.parse(legacy.value) : legacy.value ?? legacy;
  } catch {
    return false;
  }

  const normalized = normalizeImportedPayload(parsed);
  if (!normalized) return false;

  await restoreJSON(normalized, { replace: true });
  await save('metadata', {
    ...(await get('metadata', META_KEY)),
    migratedFromLegacy: true,
    updatedAt: nowISO(),
  }, META_KEY);

  return true;
}

async function init() {
  await open();
  await ensureDefaults();
  await migrateLegacyStateIfPresent().catch(() => false);
  return api;
}

const api = {
  DB_NAME,
  DB_VERSION,
  init,
  open,
  save,
  update,
  delete: remove,
  get,
  getAll,
  bulkInsert,
  clearStore,
  exportJSON,
  downloadBackup,
  restoreJSON,
  importFromFile,
  ensureDefaults,
  migrateLegacyStateIfPresent,
  ready: () => _ready,
};

if (typeof window !== 'undefined') window.CacuyDB = api;
export default api;
export {
  DB_NAME,
  DB_VERSION,
  init,
  open,
  save,
  update,
  remove as deleteRecord,
  get,
  getAll,
  bulkInsert,
  clearStore,
  exportJSON,
  downloadBackup,
  restoreJSON,
  importFromFile,
};
