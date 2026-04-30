import { describe, it, expect } from 'vitest';
import { getBusinessHoursForDate, formatLocalHour } from '../business-hours.js';

const BIZ = { timezone: 'America/New_York', start_hour: 8, end_hour: 17 };

// ── getBusinessHoursForDate ───────────────────────────────────────────────────

describe('getBusinessHoursForDate', () => {
    it('Bogotá during NY EDT: 8am NY → 7am Bogotá, 5pm NY → 4pm Bogotá', () => {
        // April 29 2026: NY is in EDT (UTC-4); Bogotá is UTC-5 year-round
        // 8am EDT = 12:00 UTC = 7:00 Bogotá
        // 5pm EDT = 21:00 UTC = 16:00 Bogotá
        const r = getBusinessHoursForDate(BIZ, '2026-04-29', 'America/Bogota');
        expect(r.localStartHour).toBe(7);
        expect(r.localEndHour).toBe(16);
    });

    it('Bogotá during NY EST: 8am NY → 8am Bogotá, 5pm NY → 5pm Bogotá', () => {
        // January 15 2026: NY is in EST (UTC-5); Bogotá is UTC-5 → same offset
        // 8am EST = 13:00 UTC = 8:00 Bogotá
        // 5pm EST = 22:00 UTC = 17:00 Bogotá
        const r = getBusinessHoursForDate(BIZ, '2026-01-15', 'America/Bogota');
        expect(r.localStartHour).toBe(8);
        expect(r.localEndHour).toBe(17);
    });

    it('Tokyo during NY EDT: 8am NY → 9pm Tokyo (cross-midnight end → 6am)', () => {
        // April 29 2026: NY is in EDT (UTC-4); Tokyo is UTC+9
        // 8am EDT = 12:00 UTC = 21:00 JST
        // 5pm EDT = 21:00 UTC = next day 06:00 JST
        const r = getBusinessHoursForDate(BIZ, '2026-04-29', 'Asia/Tokyo');
        expect(r.localStartHour).toBe(21);
        expect(r.localEndHour).toBe(6);
    });

    it('returns correct timezone identifiers', () => {
        const r = getBusinessHoursForDate(BIZ, '2026-04-29', 'America/Bogota');
        expect(r.businessTz).toBe('America/New_York');
        expect(r.userTz).toBe('America/Bogota');
    });

    it('same TZ as NY: start=8, end=17', () => {
        const r = getBusinessHoursForDate(BIZ, '2026-04-29', 'America/New_York');
        expect(r.localStartHour).toBe(8);
        expect(r.localEndHour).toBe(17);
    });

    it('DST change reflected: same wall-clock in Bogotá shifts when NY changes offset', () => {
        const edt = getBusinessHoursForDate(BIZ, '2026-04-29', 'America/Bogota'); // NY=EDT
        const est = getBusinessHoursForDate(BIZ, '2026-01-15', 'America/Bogota'); // NY=EST
        // One hour difference in Bogotá start hour depending on NY DST state
        expect(est.localStartHour - edt.localStartHour).toBe(1);
    });
});

// ── formatLocalHour ───────────────────────────────────────────────────────────

describe('formatLocalHour', () => {
    it('formats morning hours', () => {
        expect(formatLocalHour(7)).toBe('7am');
        expect(formatLocalHour(8)).toBe('8am');
        expect(formatLocalHour(0)).toBe('12am');
    });

    it('formats afternoon/evening hours', () => {
        expect(formatLocalHour(12)).toBe('12pm');
        expect(formatLocalHour(16)).toBe('4pm');
        expect(formatLocalHour(17)).toBe('5pm');
        expect(formatLocalHour(21)).toBe('9pm');
    });

    it('formats fractional half-hour offsets (e.g. India UTC+5:30)', () => {
        expect(formatLocalHour(17.5)).toBe('5:30pm');
        expect(formatLocalHour(8.5)).toBe('8:30am');
    });

    it('handles cross-midnight end hour (Tokyo case: 6am)', () => {
        expect(formatLocalHour(6)).toBe('6am');
    });
});
