/** Business hours: fetches config from backend and converts to user's local TZ via Intl. */

import { CONFIG } from '../core/config.js';
import { pcGet, pcSet } from '../core/persistent-cache.js';

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_KEY    = 'weekly:biz-hours';

let _cache    = null;
let _cacheAt  = 0;
let _inFlight = null;

export async function fetchBusinessHours() {
    if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) {
        console.debug('[biz-hours] cache hit (memory)');
        return _cache;
    }
    if (_inFlight) {
        console.debug('[biz-hours] cache hit (in-flight dedup)');
        return _inFlight;
    }

    _inFlight = (async () => {
        // 1) IndexedDB hit (cross-session warm load)
        const idbHit = await pcGet(CACHE_KEY);
        if (idbHit) {
            console.debug('[biz-hours] cache hit (IndexedDB)');
            _cache   = idbHit;
            _cacheAt = Date.now();
            return idbHit;
        }

        // 2) Cold — fetch from backend
        console.debug('[biz-hours] cache miss → network');
        try {
            const res = await fetch(`${CONFIG.BACKEND_BASE_URL}/config/business-hours`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            _cache = await res.json();
        } catch (e) {
            console.error('[business-hours] fetch failed, using defaults:', e);
            _cache = { timezone: 'America/New_York', start_hour: 8, end_hour: 17 };
        }
        _cacheAt = Date.now();
        pcSet(CACHE_KEY, _cache, CACHE_TTL_MS).catch(() => {});
        return _cache;
    })().finally(() => { _inFlight = null; });

    return _inFlight;
}

/**
 * Convert business hours for a given date from business TZ → user's local TZ.
 *
 * @param {{ timezone: string, start_hour: number, end_hour: number }} config
 * @param {string} isoDate  - 'YYYY-MM-DD' reference day
 * @param {string} [userTz] - IANA TZ override; defaults to browser TZ (pass for testing)
 * @returns {{ localStartHour: number, localEndHour: number, businessTz: string, userTz: string }}
 *   Hours are fractional (e.g. 17.5 = 5:30 pm). localEndHour < localStartHour means cross-midnight.
 */
export function getBusinessHoursForDate(config, isoDate, userTz) {
    const tz = userTz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [year, month, day] = isoDate.split('-').map(Number);

    const startUtcMs = _wallClockToUtcMs(year, month - 1, day, config.start_hour, 0, config.timezone);
    const endUtcMs   = _wallClockToUtcMs(year, month - 1, day, config.end_hour,   0, config.timezone);

    return {
        localStartHour: _utcMsToHourInTz(startUtcMs, tz),
        localEndHour:   _utcMsToHourInTz(endUtcMs,   tz),
        businessTz:     config.timezone,
        userTz:         tz,
    };
}

/**
 * Format a fractional hour (0–23.99) as 12-hour am/pm string.
 * 7 → '7am', 16 → '4pm', 17.5 → '5:30pm', 0 → '12am'
 */
export function formatLocalHour(h) {
    const totalMin = Math.round(h * 60);
    const intH     = Math.floor(totalMin / 60) % 24;
    const mins     = totalMin % 60;
    const period   = intH < 12 ? 'am' : 'pm';
    const disp     = intH === 0 ? 12 : intH > 12 ? intH - 12 : intH;
    return mins > 0
        ? `${disp}:${String(mins).padStart(2, '0')}${period}`
        : `${disp}${period}`;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _wallClockToUtcMs(year, month0, day, hour, min, tz) {
    const naive  = Date.UTC(year, month0, day, hour, min, 0);
    const offset = _tzOffsetAtUtcMs(naive, tz);
    return naive - offset;
}

function _tzOffsetAtUtcMs(utcMs, tz) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    }).formatToParts(new Date(utcMs));
    const p          = type => parseInt(parts.find(x => x.type === type)?.value ?? '0', 10);
    const h          = p('hour') % 24;
    const localAsUtc = Date.UTC(p('year'), p('month') - 1, p('day'), h, p('minute'), p('second'));
    return localAsUtc - utcMs;
}

function _utcMsToHourInTz(utcMs, tz) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit', minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date(utcMs));
    const h = parseInt(parts.find(p => p.type === 'hour')?.value  ?? '0', 10) % 24;
    const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
    return h + m / 60;
}
