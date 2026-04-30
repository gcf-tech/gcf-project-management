import { describe, it, expect } from 'vitest';
import { expandBlocks, formStateToRRule } from '../../calendar/recurrence/rrule-expander.js';

function master(overrides = {}) {
    return {
        id: 1,
        rrule_string: 'FREQ=WEEKLY;BYDAY=MO,TU,WE',
        dtstart: '2026-04-27T00:00:00',
        week_start: '2026-04-27',
        day: 1,
        exception_dates: [],
        start_time: '09:00',
        end_time: '10:00',
        block_type: 'personal',
        title: 'Test',
        color: null,
        is_master: true,
        is_virtual: false,
        series_id: null,
        ...overrides,
    };
}

// Range helpers — use local Date constructor to avoid the UTC-parse shift
const APR27 = () => new Date(2026, 3, 27); // Monday
const MAY01 = () => new Date(2026, 4, 1);  // Friday
const MAY04 = () => new Date(2026, 4, 4);  // Monday +1 week
const MAY08 = () => new Date(2026, 4, 8);  // Friday +1 week

describe('expandBlocks', () => {
    it('expands BYDAY=MO,TU,WE into 3 occurrences for week Apr 27', () => {
        const result = expandBlocks([master()], APR27(), MAY01());
        expect(result.length).toBe(3);
        expect(result.map(v => v.day).sort()).toEqual([1, 2, 3]);
    });

    it('produces the same 3 days on the following week (May 4)', () => {
        const result = expandBlocks([master()], MAY04(), MAY08());
        expect(result.length).toBe(3);
        expect(result.map(v => v.day).sort()).toEqual([1, 2, 3]);
    });

    it('virtual block ids are composite <masterId>:<isoDate>', () => {
        const result = expandBlocks([master()], APR27(), MAY01());
        for (const v of result) {
            expect(v.id).toMatch(/^1:2026-04-\d{2}$/);
            expect(v.is_virtual).toBe(true);
            expect(v.is_master).toBe(false);
        }
    });

    it('respects UNTIL — no occurrences when range is past until date', () => {
        const m = master({ rrule_string: 'FREQ=WEEKLY;BYDAY=MO,TU,WE;UNTIL=20260424T000000Z' });
        expect(expandBlocks([m], APR27(), MAY01()).length).toBe(0);
    });

    it('FREQ=DAILY produces one virtual per day in a 5-day range', () => {
        const m = master({ rrule_string: 'FREQ=DAILY' });
        const result = expandBlocks([m], APR27(), MAY01());
        expect(result.length).toBe(5);
    });

    it('returns empty array for empty masterBlocks input', () => {
        expect(expandBlocks([], APR27(), MAY01())).toEqual([]);
    });

    it('skips exception dates', () => {
        const m = master({ exception_dates: ['2026-04-27'] }); // exclude Monday
        const result = expandBlocks([m], APR27(), MAY01());
        expect(result.length).toBe(2);
        expect(result.every(v => v.day !== 1)).toBe(true);
    });

    it('FREQ=MONTHLY;BYDAY=4MO matches the 4th Monday only', () => {
        // April 2026: 4th Monday = April 27
        const m = master({ rrule_string: 'FREQ=MONTHLY;BYDAY=4MO' });
        const result = expandBlocks([m], APR27(), MAY01());
        expect(result.length).toBe(1);
        expect(result[0].day).toBe(1);
    });

    it('virtual block inherits master fields (title, color, start_time)', () => {
        const m = master({ title: 'Standup', color: '#ff0000', start_time: '10:00', end_time: '10:30' });
        const result = expandBlocks([m], APR27(), MAY01());
        expect(result[0].title).toBe('Standup');
        expect(result[0].color).toBe('#ff0000');
        expect(result[0].start_time).toBe('10:00');
    });
});

describe('formStateToRRule', () => {
    it('returns null for freq=none', () => {
        expect(formStateToRRule({ freq: 'none' })).toBeNull();
    });

    it('returns null for missing freq', () => {
        expect(formStateToRRule({})).toBeNull();
    });

    it('simple weekly', () => {
        expect(formStateToRRule({ freq: 'weekly' })).toBe('FREQ=WEEKLY');
    });

    it('custom weekly with BYDAY', () => {
        const r = formStateToRRule({ freq: 'custom', unit: 'weekly', interval: 1, days: ['MO', 'WE'] });
        expect(r).toBe('FREQ=WEEKLY;BYDAY=MO,WE');
    });

    it('daily with until', () => {
        expect(formStateToRRule({ freq: 'daily', until: '2026-12-31' })).toBe('FREQ=DAILY;UNTIL=20261231T000000Z');
    });

    it('weekly with interval > 1', () => {
        const r = formStateToRRule({ freq: 'custom', unit: 'weekly', interval: 2, days: ['FR'] });
        expect(r).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=FR');
    });

    it('monthly', () => {
        expect(formStateToRRule({ freq: 'monthly' })).toBe('FREQ=MONTHLY');
    });
});
