import { useMemo } from 'react';

const TREEMAP_PALETTE = [
    '#3b82f6', '#f97316', '#10b981', '#8b5cf6',
    '#f59e0b', '#ec4899', '#ef4444', '#64748b',
];

function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function Treemap({ data = [] }) {
    const { total, items } = useMemo(() => {
        const t = data.reduce((s, d) => s + (d.hours ?? d.value ?? 0), 0);
        return {
            total: t,
            items: data.map((item, i) => {
                const val = item.hours ?? item.value ?? 0;
                const pct = t > 0 ? (val / t * 100).toFixed(1) : 0;
                const color = item.color ?? TREEMAP_PALETTE[i % TREEMAP_PALETTE.length];
                return { ...item, val, pct: Number(pct), color };
            }),
        };
    }, [data]);

    if (!total) return null;

    return (
        <>
            <div className="treemap-container">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="treemap-block"
                        style={{ flex: item.pct, background: item.color }}
                        title={`${item.category}: ${item.pct}%`}
                    >
                        {item.pct > 8 && (
                            <span className="treemap-label">{esc(item.category)}</span>
                        )}
                        {item.pct > 5 && (
                            <span className="treemap-pct">{item.pct}%</span>
                        )}
                    </div>
                ))}
            </div>
            <div className="treemap-legend">
                {items.map((item, i) => (
                    <div key={i} className="legend-item">
                        <div className="legend-dot" style={{ background: item.color }} />
                        <span>{esc(item.category)}</span>
                    </div>
                ))}
            </div>
        </>
    );
}
