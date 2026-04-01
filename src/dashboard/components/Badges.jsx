import { useMemo } from 'react';

const BADGE_DEFS = [
    { icon: 'fa-check-double', label: 'Completador',    desc: '10+ tareas completadas',     check: d => (d.completedTasks ?? 0) >= 10 },
    { icon: 'fa-chart-line',   label: 'Efectivo',        desc: 'IEL ≥ 80%',                  check: d => ((d.iel ?? d.effectiveness) ?? 0) >= 80 },
    { icon: 'fa-clock',        label: 'Puntual',         desc: 'Cumplimiento ≥ 90%',          check: d => (d.completionRate ?? 0) >= 90 },
    { icon: 'fa-brain',        label: 'Deep Worker',     desc: '20h+ de trabajo profundo',    check: d => (d.deepWorkHours ?? 0) >= 20 },
    { icon: 'fa-crosshairs',   label: 'Predecible',      desc: 'Previsibilidad ≥ 75%',        check: d => (d.predictability ?? 0) >= 75 },
    { icon: 'fa-flag-checkered', label: 'Cierre rápido', desc: 'SLA ≤ 3 días',                check: d => d.slaAvgDays != null && d.slaAvgDays <= 3 },
    { icon: 'fa-seedling',     label: 'En crecimiento',  desc: 'Progresando en skills',       check: d => (d.skills?.length ?? 0) > 0 },
    { icon: 'fa-medal',        label: 'Top performer',   desc: 'Percentil ≥ 75 en el equipo', check: d => (d.teamPercentile ?? 0) >= 75 },
];

export default function Badges({ data }) {
    const { earned, locked } = useMemo(() => ({
        earned: BADGE_DEFS.filter(b => b.check(data)),
        locked: BADGE_DEFS.filter(b => !b.check(data)),
    }), [data]);

    return (
        <>
            <div className="badges-grid">
                {earned.map(b => (
                    <div key={b.label} className="badge-card badge-earned" title={b.desc}>
                        <div className="badge-icon earned"><i className={`fas ${b.icon}`} /></div>
                        <div className="badge-name">{b.label}</div>
                    </div>
                ))}
                {locked.map(b => (
                    <div key={b.label} className="badge-card badge-locked" title={b.desc}>
                        <div className="badge-icon locked"><i className={`fas ${b.icon}`} /></div>
                        <div className="badge-name">{b.label}</div>
                    </div>
                ))}
            </div>
            <p className="badges-summary">
                <strong>{earned.length}</strong> / {BADGE_DEFS.length} logros desbloqueados
            </p>
        </>
    );
}
