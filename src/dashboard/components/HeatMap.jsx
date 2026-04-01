import { useMemo } from 'react';

export default function HeatMap({ byDay = {} }) {
    const cells = useMemo(() => {
        const today  = new Date();
        const DAYS   = 84; // 12 weeks × 7
        const anchor = new Date(today);
        anchor.setDate(today.getDate() - DAYS + 1);
        const dow = (anchor.getDay() + 6) % 7;
        anchor.setDate(anchor.getDate() - dow);

        const values = Object.values(byDay).filter(v => v > 0);
        const maxVal = values.length ? Math.max(...values) : 4;

        const result = [];
        const cursor = new Date(anchor);
        while (cursor <= today) {
            const key   = cursor.toISOString().split('T')[0];
            const hours = byDay[key] ?? 0;
            const level = hours === 0 ? 0 : Math.min(4, Math.ceil((hours / maxVal) * 4));
            result.push({ key, hours, level });
            cursor.setDate(cursor.getDate() + 1);
        }
        return result;
    }, [byDay]);

    return (
        <>
            <div className="heatmap-dow-labels">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d}>{d}</span>
                ))}
            </div>
            <div className="heatmap-grid">
                {cells.map(c => (
                    <div
                        key={c.key}
                        className={`heatmap-cell heatmap-level-${c.level}`}
                        title={`${c.key}: ${c.hours}h deep work`}
                    />
                ))}
            </div>
            <div className="heatmap-legend">
                <span className="text-muted text-sm">Menos</span>
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className={`heatmap-cell heatmap-level-${i}`} />
                ))}
                <span className="text-muted text-sm">Más</span>
            </div>
        </>
    );
}
