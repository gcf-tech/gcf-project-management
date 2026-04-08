import { useMemo } from 'react';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function levelClass(hours) {
    if (!hours || hours === 0) return 'cap-level-0';
    if (hours <= 4)  return 'cap-level-1';
    if (hours <= 6)  return 'cap-level-2';
    if (hours <= 7)  return 'cap-level-3';
    return 'cap-level-4'; // ≥ 8 → sobrecarga
}

function levelLabel(hours) {
    if (!hours) return 'Sin datos';
    if (hours <= 4) return `${hours}h · Baja carga`;
    if (hours <= 6) return `${hours}h · Carga moderada`;
    if (hours <= 7) return `${hours}h · Carga alta`;
    return `${hours}h · Sobrecarga`;
}

/**
 * Calendar-style heatmap showing workload per member per day.
 * @param {{ members: Array<{userId, displayname}>, capacity: Object }} props
 */
export default function CapacityHeatmap({ members = [], capacity = {} }) {
    const rows = useMemo(() =>
        members.map(m => ({
            ...m,
            days: DAYS.map(day => {
                const hours = capacity[m.userId]?.[day] ?? 0;
                return { day, hours, cls: levelClass(hours), label: levelLabel(hours) };
            }),
        })),
    [members, capacity]);

    if (!rows.length) return null;

    return (
        <div className="capacity-heatmap">
            <table className="data-table capacity-table">
                <thead>
                    <tr>
                        <th>Miembro</th>
                        {DAYS.map(d => <th key={d} className="cap-day-th">{d}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.userId}>
                            <td>
                                <div className="member-cell">
                                    <div className="member-avatar sm">{initials(row.displayname)}</div>
                                    <span className="member-name">{row.displayname}</span>
                                </div>
                            </td>
                            {row.days.map(cell => (
                                <td key={cell.day} className="cap-cell-td">
                                    <div className={`cap-cell ${cell.cls}`} title={cell.label}>
                                        {cell.hours ? `${cell.hours}h` : '—'}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="cap-legend">
                <span className="text-muted text-sm">Baja</span>
                <div className="cap-cell cap-level-1 cap-legend-cell" />
                <div className="cap-cell cap-level-2 cap-legend-cell" />
                <div className="cap-cell cap-level-3 cap-legend-cell" />
                <div className="cap-cell cap-level-4 cap-legend-cell" />
                <span className="text-muted text-sm">Sobrecarga</span>
            </div>
        </div>
    );
}
