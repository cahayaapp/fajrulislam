/*
 * CAHAYA APP — PENGATURAN MODUL KEUANGAN
 * Pengaturan operasional ini sengaja dipisahkan dari White-Label.
 * Sumber aktif: cahaya_app/keuangan/pengaturan_modul
 */
(function (global) {
  'use strict';

  const PATH = 'cahaya_app/keuangan/pengaturan_modul';
  const CACHE_KEY = 'cahayaFinanceModuleSettings';
  const CACHE_TTL = 15 * 60 * 1000;
  const DEFAULTS = {
    version: '2026.08-finance-module-v1',
    spp: { enabled: true, scope: 'all' },
    savings: { enabled: true, scope: 'all' },
    walletCashier: { enabled: true, scope: 'all' },
    updatedAt: '',
    updatedBy: null
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const merge = (base, extra) => {
    const out = { ...base };
    Object.keys(extra || {}).forEach(key => {
      const value = extra[key];
      out[key] = value && typeof value === 'object' && !Array.isArray(value)
        ? merge(base?.[key] || {}, value)
        : value;
    });
    return out;
  };

  function normalizeScope(scope) {
    return ['all', 'putra', 'putri'].includes(String(scope || '').toLowerCase())
      ? String(scope).toLowerCase()
      : 'all';
  }

  function normalize(config) {
    const merged = merge(DEFAULTS, config || {});
    ['spp', 'savings', 'walletCashier'].forEach(key => {
      merged[key] = {
        enabled: merged[key]?.enabled !== false,
        scope: normalizeScope(merged[key]?.scope)
      };
    });
    return merged;
  }

  function readCache() {
    try {
      const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!raw || !raw.data) return null;
      return { data: normalize(raw.data), savedAt: Number(raw.savedAt) || 0 };
    } catch (_) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: normalize(data), savedAt: Date.now() }));
    } catch (_) {}
  }

  let cached = readCache();
  let current = cached?.data || normalize(DEFAULTS);
  let pending = null;

  function notify(source = 'cache') {
    global.CAHAYA_FINANCE_SETTINGS = clone(current);
    global.dispatchEvent(new CustomEvent('cahaya:finance-settings', {
      detail: { settings: clone(current), source }
    }));
  }

  function ensureFirebase() {
    if (!global.firebase?.database) return null;
    if (!firebase.apps.length) {
      const cfg = global.CAHAYA_CONFIG?.firebase;
      if (!cfg?.databaseURL) return null;
      firebase.initializeApp(cfg);
    }
    return firebase.database();
  }

  function normalizeGender(value) {
    const text = String(value || '').trim().toLowerCase();
    if (/putri|perempuan|wanita|female|akhwat/.test(text)) return 'putri';
    if (/putra|laki|pria|male|ikhwan/.test(text)) return 'putra';
    return '';
  }

  function detectGender(source) {
    if (typeof source === 'string') return normalizeGender(source);
    const row = source || {};
    return normalizeGender(
      row.jenisKelamin || row.gender || row.kelamin || row.kelas ||
      row.className || row.namaKelas || row.unit || ''
    );
  }

  function feature(key) {
    const modules = global.CAHAYA_CONFIG?.modules || {};
    if (modules.finance === false) return { enabled: false, scope: 'all' };
    if (key === 'walletCashier' && modules.cashier === false) return { enabled: false, scope: 'all' };
    const row = current[key] || DEFAULTS[key] || { enabled: false, scope: 'all' };
    return { enabled: row.enabled !== false, scope: normalizeScope(row.scope) };
  }

  function enabled(key) {
    return feature(key).enabled;
  }

  function allowed(key, source) {
    const row = feature(key);
    if (!row.enabled) return false;
    if (row.scope === 'all') return true;
    const gender = detectGender(source);
    return Boolean(gender) && gender === row.scope;
  }

  function anyEnabled() {
    return ['spp', 'savings', 'walletCashier'].some(enabled);
  }

  function get() {
    return clone(current);
  }

  function setLocal(config, source = 'local') {
    current = normalize(config);
    writeCache(current);
    notify(source);
    return get();
  }

  async function load(options = {}) {
    const force = options === true || options?.force === true;
    const cache = readCache();
    if (!force && cache && Date.now() - cache.savedAt < CACHE_TTL) {
      current = cache.data;
      notify('cache');
      return get();
    }
    if (pending) return pending;
    const db = ensureFirebase();
    if (!db) return get();
    pending = db.ref(PATH).once('value')
      .then(snapshot => {
        const remote = snapshot.val();
        if (remote) current = normalize(remote);
        else current = normalize(DEFAULTS);
        writeCache(current);
        notify(remote ? 'firebase' : 'default');
        return get();
      })
      .catch(error => {
        console.warn('Pengaturan keuangan tidak dapat dimuat:', error);
        notify('fallback');
        return get();
      })
      .finally(() => { pending = null; });
    return pending;
  }

  function currentActor() {
    try {
      const user = JSON.parse(localStorage.getItem('cahayaCurrentUser') || '{}');
      return {
        uid: user.uid || '',
        username: user.username || user.email || '',
        nama: user.label || user.nama || user.username || 'Administrator'
      };
    } catch (_) {
      return { uid: '', username: '', nama: 'Administrator' };
    }
  }

  async function save(config) {
    const db = ensureFirebase();
    if (!db) throw new Error('Firebase belum siap. Muat ulang halaman lalu coba kembali.');
    const payload = normalize({
      ...config,
      version: '2026.08-finance-module-v1',
      updatedAt: new Date().toISOString(),
      updatedBy: currentActor()
    });
    await db.ref(PATH).set(payload);
    return setLocal(payload, 'saved');
  }

  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    cached = null;
  }

  function bootstrap(attempt = 0) {
    if (ensureFirebase()) {
      load().catch(() => {});
      return;
    }
    if (attempt < 20) setTimeout(() => bootstrap(attempt + 1), 400);
  }

  global.CahayaFinanceSettings = {
    PATH, DEFAULTS: clone(DEFAULTS), get, load, save, setLocal, clearCache,
    feature, enabled, allowed, anyEnabled, normalizeGender, detectGender
  };
  global.CAHAYA_FINANCE_SETTINGS = clone(current);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap());
  } else {
    bootstrap();
  }
})(window);
