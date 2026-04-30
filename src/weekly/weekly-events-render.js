/**
 * Render helpers for Nextcloud calendar events inside the Weekly view.
 *
 * Calendar events live in a SEPARATE visual track on the left edge of each
 * day column — they never collide with user-owned weekly blocks, can't be
 * dragged or resized, and click-through to a read-only modal. The visual
 * style (dotted border + opacity 0.85) communicates "this is not yours,
 * just informational".
 *
 * The merge layer the prompt asks for stays here — `weekly-data.js` keeps
 * delivering blocks unchanged and never sees calendar events.
 */

import { format } from 'date-fns';

// Must match the constants in weekly.js — only px-per-hour and the
// HOUR_START / HOUR_END window are needed for vertical positioning.
const HOUR_START  = 6;
const HOUR_END    = 23;
const PX_PER_HOUR = 60;
const DAY_TOTAL_MIN = (HOUR_END - HOUR_START + 1) * 60;

/**
 * Return a Map<dayOfWeek, CalendarEvent[]> where each event is included on
 * every day in `weekDays` whose 24-hour window overlaps the event range.
 * Multi-day events therefore appear on every day they touch.
 */
export function bucketEventsByDay(events, weekDays) {
    const byDow = new Map(weekDays.map(d => [d.getDay(), []]));
    if (!events?.length) return byDow;

    for (const ev of events) {
        const evStart = new Date(ev.start_utc);
        const evEnd   = new Date(ev.end_utc);
        if (Number.isNaN(evStart.getTime()) || Number.isNaN(evEnd.getTime())) continue;

        for (const d of weekDays) {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
            const dayEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
            if (evEnd > dayStart && evStart < dayEnd) {
                byDow.get(d.getDay())?.push(ev);
            }
        }
    }
    return byDow;
}

/**
 * Return the HTML fragment for the event track of a single day column.
 * The track is positioned absolutely on the left side of the column; chips
 * inside it stack vertically, mapped to the same hour grid as the blocks.
 */
export function renderEventTrack(events, refDate) {
    if (!events?.length) return '';
    const chips = events
        .map(ev => _renderEventChip(ev, refDate))
        .filter(Boolean)
        .join('');
    if (!chips) return '';
    return `<div class="weekly-event-track" aria-label="Eventos de calendario">${chips}</div>`;
}

// ── internals ──────────────────────────────────────────────────────────────

function _renderEventChip(ev, refDate) {
    const start = new Date(ev.start_utc);
    const end   = new Date(ev.end_utc);
    const dayStartMin = HOUR_START * 60;
    const dayEndMin   = (HOUR_END + 1) * 60;

    // Compute the event's start/end in local minutes-since-midnight,
    // clamped to the day pointed at by `refDate`.
    const startMinAbs = _minutesIntoDay(start, refDate);
    const endMinAbs   = _minutesIntoDay(end, refDate);

    // All-day or events that span the whole visible window: pin to full height.
    if (ev.all_day || (startMinAbs <= dayStartMin && endMinAbs >= dayEndMin)) {
        return _chipHtml({
            ev,
            top: 0,
            height: DAY_TOTAL_MIN / 60 * PX_PER_HOUR,
            timeLabel: ev.all_day ? 'Todo el día' : `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
            extraClass: 'weekly-event--allday',
        });
    }

    const visibleStart = Math.max(startMinAbs, dayStartMin);
    const visibleEnd   = Math.min(endMinAbs,   dayEndMin);
    if (visibleEnd <= visibleStart) return '';

    const top    = ((visibleStart - dayStartMin) / 60) * PX_PER_HOUR;
    const height = Math.max(20, ((visibleEnd - visibleStart) / 60) * PX_PER_HOUR);

    return _chipHtml({
        ev,
        top,
        height,
        timeLabel: `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
        extraClass: '',
    });
}

function _chipHtml({ ev, top, height, timeLabel, extraClass }) {
    const title = _esc(ev.title || 'Evento');
    const color = ev.color || 'var(--cal-event-color, #6366f1)';
    const tip = [
        ev.title || 'Evento',
        timeLabel,
        ev.location ? `📍 ${ev.location}` : null,
        ev.calendar_name ? `${ev.calendar_name}` : null,
    ].filter(Boolean).join('\n');

    return `
        <div class="weekly-event ${extraClass}"
             role="button" tabindex="0"
             data-action="weekly-event-detail"
             data-event-id="${_esc(ev.id)}"
             style="top:${top}px;height:${height}px;border-color:${color};color:${color}"
             title="${_esc(tip)}">
            <i class="fas fa-calendar-alt weekly-event-icon" aria-hidden="true"></i>
            <span class="weekly-event-title">${title}</span>
        </div>`;
}

function _minutesIntoDay(date, refDate) {
    // Same-day fast path: just hours*60 + minutes in local time.
    if (
        date.getFullYear() === refDate.getFullYear() &&
        date.getMonth()    === refDate.getMonth() &&
        date.getDate()     === refDate.getDate()
    ) {
        return date.getHours() * 60 + date.getMinutes();
    }
    const ref0  = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
    const diffMs = date.getTime() - ref0;
    return Math.round(diffMs / 60000);
}

function _esc(s) {
    return String(s ?? '').replace(/[<>&"]/g, c => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;',
    }[c]));
}
