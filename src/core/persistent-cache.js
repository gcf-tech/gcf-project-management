/**
 * Persistent cache wrapper around IndexedDB.
 *
 * Used by the weekly views to keep blocks/preferences/business-hours across
 * sessions so a warm reload renders without waiting for the network.
 *
 * Falls back silently to an in-memory Map when IndexedDB is unavailable
 * (Safari private mode, opt-in disabled, blocked by ITP, etc.).
 *
 * Schema: { key (keyPath), value, expiresAt }
 */

const DB_NAME    = 'gcf-app-cache';
const DB_VERSION = 1;
const STORE_NAME = 'weekly-cache';

let _dbPromise   = null;
let _idbWorks    = true;
const _memStore  = new Map(); // key → { value, expiresAt }

// ── Internal helpers ─────────────────────────────────────────────────────────

function _hasIDB() {
    try {
        return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
        return false;
    }
}

function _openDb() {
    if (_dbPromise) return _dbPromise;
    if (!_hasIDB()) {
        _idbWorks  = false;
        _dbPromise = Promise.resolve(null);
        return _dbPromise;
    }

    _dbPromise = new Promise((resolve) => {
        let req;
        try {
            req = indexedDB.open(DB_NAME, DB_VERSION);
        } catch (e) {
            console.warn('[pcache] indexedDB.open threw, using memory fallback:', e);
            _idbWorks = false;
            resolve(null);
            return;
        }

        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => {
            console.warn('[pcache] indexedDB.open failed, using memory fallback:', req.error);
            _idbWorks = false;
            resolve(null);
        };
        req.onblocked = () => {
            console.warn('[pcache] indexedDB.open blocked, using memory fallback');
            _idbWorks = false;
            resolve(null);
        };
    });

    return _dbPromise;
}

function _txPromise(mode, fn) {
    return _openDb().then(db => {
        if (!db) return null;
        return new Promise((resolve, reject) => {
            let outcome;
            try {
                const tx    = db.transaction(STORE_NAME, mode);
                const store = tx.objectStore(STORE_NAME);
                outcome     = fn(store);
                tx.oncomplete = () => resolve(outcome?.value);
                tx.onerror    = () => reject(tx.error);
                tx.onabort    = () => reject(tx.error || new Error('tx aborted'));
            } catch (e) {
                reject(e);
            }
        });
    });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Read a value from the cache.
 * @returns the stored value, or null if the entry is missing or expired.
 */
export async function pcGet(key) {
    if (!_idbWorks) {
        const entry = _memStore.get(key);
        if (!entry) return null;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            _memStore.delete(key);
            return null;
        }
        return entry.value;
    }

    try {
        const out = { value: undefined };
        await _txPromise('readonly', store => {
            const req = store.get(key);
            req.onsuccess = () => { out.value = req.result; };
            return out;
        });
        const entry = out.value;
        if (!entry) return null;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            pcDelete(key).catch(() => {});
            return null;
        }
        return entry.value;
    } catch (e) {
        console.warn('[pcache] pcGet failed:', e);
        return null;
    }
}

/** Store a value with an absolute expiration timestamp computed from `ttlMs`. */
export async function pcSet(key, value, ttlMs) {
    const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;

    if (!_idbWorks) {
        _memStore.set(key, { value, expiresAt });
        return;
    }

    try {
        await _txPromise('readwrite', store => {
            store.put({ key, value, expiresAt });
            return { value: undefined };
        });
    } catch (e) {
        console.warn('[pcache] pcSet failed, falling back to memory:', e);
        _memStore.set(key, { value, expiresAt });
    }
}

/** Delete a single entry. */
export async function pcDelete(key) {
    if (!_idbWorks) {
        _memStore.delete(key);
        return;
    }
    try {
        await _txPromise('readwrite', store => {
            store.delete(key);
            return { value: undefined };
        });
    } catch (e) {
        console.warn('[pcache] pcDelete failed:', e);
    }
}

/** Delete every entry whose key starts with `prefix`. */
export async function pcClear(prefix) {
    if (!_idbWorks) {
        for (const k of [..._memStore.keys()]) {
            if (k.startsWith(prefix)) _memStore.delete(k);
        }
        return;
    }
    try {
        await _txPromise('readwrite', store => {
            const req = store.openCursor();
            req.onsuccess = ev => {
                const cursor = ev.target.result;
                if (!cursor) return;
                if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
                    cursor.delete();
                }
                cursor.continue();
            };
            return { value: undefined };
        });
    } catch (e) {
        console.warn('[pcache] pcClear failed:', e);
    }
}
