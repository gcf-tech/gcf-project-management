import { useState, useMemo, useEffect } from 'react';
import { useDateRange } from '../hooks/useDateRange.js';
import { fetchTeams, fetchTeamMetrics } from '../dashApi.js';
import PeriodSelector from './PeriodSelector.jsx';
import KpiCard from './KpiCard.jsx';
import { LineChart, DoughnutChart } from './Charts.jsx';
import CapacityHeatmap from './CapacityHeatmap.jsx';

function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function RateBadge({ rate }) {
    if (rate == null) return <span>—</span>;
    const rounded = Math.round(rate);
    let cls = 'badge-success';
    let icon = 'fa-check-circle';
    if (rounded < 80)      { cls = 'badge-danger';  icon = 'fa-exclamation-circle'; }
    else if (rounded < 90) { cls = 'badge-warning'; icon = 'fa-clock'; }
    return (
        <span className={`badge ${cls}`}>
            <i className={`fas ${icon}`} style={{ marginRight: '4px' }} />
            {rounded}%
        </span>
    );
}

/** Resolves initial filter state and lock rules from the user's role. */
function resolveRoleConstraints(user) {
    const role = user?.role ?? 'member';
    if (role === 'admin') {
        return { defaultTeam: 'all', defaultMember: 'all', lockTeam: false, lockMember: false };
    }
    if (role === 'leader') {
        // Leaders default to 'all' but are locked to their own team scope
        return { defaultTeam: 'all', defaultMember: 'all', lockTeam: false, lockMember: false };
    }
    // Members only see their own team
    return { defaultTeam: user?.teamId ?? 'all', defaultMember: user?.id ?? 'all', lockTeam: true, lockMember: true };
}

/** Merges tasksByMonth arrays from multiple members, summing counts per month. */
function mergeTasksByMonth(members) {
    const map = {};
    for (const m of members) {
        for (const entry of (m.tasksByMonth ?? [])) {
            map[entry.month] = (map[entry.month] ?? 0) + (entry.count ?? 0);
        }
    }
    return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
}

/** Converts a tasksByMonth array to { labels, datasets } for LineChart. */
function toTrendChart(tasksByMonth, label) {
    const sorted = [...(tasksByMonth ?? [])].sort((a, b) => a.month.localeCompare(b.month));
    return {
        labels:   sorted.map(e => e.month),
        datasets: [{ label, data: sorted.map(e => e.count ?? 0) }],
    };
}

export default function TeamDashboardView({ user }) {
    const dr = useDateRange('month');
    const constraints = useMemo(() => resolveRoleConstraints(user), [user]);

    const [selectedTeam, setSelectedTeam]     = useState(constraints.defaultTeam);
    const [selectedMember, setSelectedMember] = useState(constraints.defaultMember);
    const [teams, setTeams]                   = useState([]);
    const [teamData, setTeamData]             = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(false);

    useEffect(() => {
        fetchTeams().then(data => setTeams(data ?? [])).catch(() => {});
    }, []);

    // Fetch real metrics when team selection or date range changes.
    // When 'all' is selected, fetch every team in parallel and combine memberMetrics.
    useEffect(() => {
        if (selectedTeam === 'all') {
            if (!teams.length) return; // wait for teams list to arrive
            setMetricsLoading(true);
            Promise.all(
                teams.map(t =>
                    fetchTeamMetrics(t.id, dr.range.start, dr.range.end).catch(() => null)
                )
            )
                .then(results => {
                    const combined = results.flatMap(r => r?.memberMetrics ?? []);
                    setTeamData(combined.length ? { memberMetrics: combined } : null);
                })
                .finally(() => setMetricsLoading(false));
            return;
        }

        setMetricsLoading(true);
        fetchTeamMetrics(selectedTeam, dr.range.start, dr.range.end)
            .then(data => setTeamData(data ?? null))
            .catch(() => setTeamData(null))
            .finally(() => setMetricsLoading(false));
    }, [selectedTeam, dr.range.start, dr.range.end, teams]);

    const memberMetrics = teamData?.memberMetrics ?? [];

    // Filter memberMetrics by selected member
    const filteredMetrics = useMemo(() => {
        if (selectedMember === 'all') return memberMetrics;
        return memberMetrics.filter(m => String(m.userId) === String(selectedMember));
    }, [memberMetrics, selectedMember]);

    // KPIs — member case untouched; team case aggregated from memberMetrics[]
    const kpis = useMemo(() => {
        if (!teamData) return { total: 0, completionRate: 0, hoursWorked: 0, avgIel: 0 };

        if (selectedMember !== 'all' && filteredMetrics.length > 0) {
            const m = filteredMetrics[0];
            return {
                total:          m.completedTasks ?? 0,
                completionRate: m.completionRate ?? 0,
                hoursWorked:    m.hoursWorked ?? 0,
                avgIel:         m.iel ?? 0,
            };
        }

        const src = memberMetrics;
        return {
            total:          src.reduce((s, m) => s + (m.completedTasks ?? 0), 0),
            completionRate: src.length ? src.reduce((s, m) => s + (m.completionRate ?? 0), 0) / src.length : 0,
            hoursWorked:    src.reduce((s, m) => s + (m.hoursWorked ?? 0), 0),
            avgIel:         src.length ? src.reduce((s, m) => s + (m.iel ?? 0), 0) / src.length : 0,
        };
    }, [teamData, memberMetrics, filteredMetrics, selectedMember]);

    // 'all' with loaded teams is also a valid state that shows real data
    const hasData = !metricsLoading && teamData !== null;

    // Trend charts built from tasksByMonth
    const teamTrendChart = useMemo(() => {
        if (!memberMetrics.length) return { labels: [], datasets: [] };
        return toTrendChart(mergeTasksByMonth(memberMetrics), 'Tareas completadas');
    }, [memberMetrics]);

    const individualTrendChart = useMemo(() => {
        if (selectedMember !== 'all' && filteredMetrics.length > 0) {
            return toTrendChart(filteredMetrics[0].tasksByMonth, filteredMetrics[0].displayName);
        }
        return teamTrendChart;
    }, [selectedMember, filteredMetrics, teamTrendChart]);

    const statusChart = useMemo(() => ({ labels: [], data: [] }), []);

    // Build capacity heatmap data from deepWorkByDay: { userId: { 'Lun': hours, ... } }
    const capacity = useMemo(() => {
        const DAY_MAP = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie' };
        const result = {};
        for (const m of memberMetrics) {
            const accum = {};
            for (const [dateStr, seconds] of Object.entries(m.deepWorkByDay ?? {})) {
                const dayName = DAY_MAP[new Date(`${dateStr}T12:00:00`).getDay()];
                if (!dayName) continue; // skip weekends
                accum[dayName] = (accum[dayName] ?? 0) + seconds;
            }
            result[m.userId] = Object.fromEntries(
                Object.entries(accum).map(([day, secs]) => [day, Math.round((secs / 3600) * 10) / 10])
            );
        }
        return result;
    }, [memberMetrics]);

    const handleTeamChange = (val) => {
        if (constraints.lockTeam) return;
        setSelectedTeam(val);
        if (!constraints.lockMember) setSelectedMember('all');
    };

    const handleMemberChange = (val) => {
        if (constraints.lockMember) return;
        setSelectedMember(val);
    };

    return (
        <>
            {/* Header + Period */}
            <div className="view-header">
                <h2 className="view-title">
                    <i className="fas fa-tachometer-alt" /> Dashboard del Equipo
                </h2>
                <PeriodSelector
                    period={dr.period}
                    onPeriodChange={dr.setPeriod}
                    customStart={dr.customStart}
                    onCustomStartChange={dr.setCustomStart}
                    customEnd={dr.customEnd}
                    onCustomEndChange={dr.setCustomEnd}
                    showCustom={false}
                />
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">
                        <i className="fas fa-layer-group" /> Equipo
                    </label>
                    <select
                        className="form-select-sm"
                        value={selectedTeam}
                        disabled={constraints.lockTeam}
                        onChange={e => handleTeamChange(e.target.value)}
                    >
                        {!constraints.lockTeam && (
                            <option value="all">Todos los equipos</option>
                        )}
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="filter-group">
                    <label className="filter-label">
                        <i className="fas fa-user" /> Miembro
                    </label>
                    <select
                        className="form-select-sm"
                        value={selectedMember}
                        disabled={constraints.lockMember}
                        onChange={e => handleMemberChange(e.target.value)}
                    >
                        {!constraints.lockMember && <option value="all">Todos los miembros</option>}
                        {memberMetrics.map(m => (
                            <option key={m.userId} value={m.userId}>{m.displayName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 1 – KPIs */}
            <div className="metrics-grid">
                <KpiCard color="primary" icon="fa-tasks"
                    value={hasData && !metricsLoading ? kpis.total : '—'}
                    label="Tareas Completadas"
                />
                <KpiCard color="success" icon="fa-clock"
                    value={hasData && !metricsLoading ? `${Math.round(kpis.completionRate)}%` : '—'}
                    label="Tasa de Cumplimiento"
                />
                <KpiCard color="warning" icon="fa-hourglass-half"
                    value={hasData && !metricsLoading ? `${kpis.hoursWorked}h` : '—'}
                    label="Horas Trabajadas"
                />
                <KpiCard color="purple" icon="fa-bolt"
                    value={hasData && !metricsLoading ? kpis.avgIel.toFixed(1) : '—'}
                    label="Efectividad Promedio (IEL)"
                />
            </div>

            {/* Row 2 – Area charts */}
            <div className="charts-grid mx">
                <div className="chart-card">
                    <h3 className="chart-title">
                        <i className="fas fa-chart-line" /> Tendencia – Equipo
                    </h3>
                    <p className="text-muted text-sm" style={{ marginBottom: '0.5rem' }}>
                        Tareas completadas por mes, sumando todos los miembros del equipo.
                    </p>
                    <LineChart labels={teamTrendChart.labels} datasets={teamTrendChart.datasets} />
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">
                        <i className="fas fa-chart-line" /> Tendencia – Individual
                    </h3>
                    <p className="text-muted text-sm" style={{ marginBottom: '0.5rem' }}>
                        {selectedMember !== 'all'
                            ? `Tareas completadas por mes — ${filteredMetrics[0]?.displayName ?? 'miembro seleccionado'}`
                            : 'Total de tareas completadas por mes del equipo'}
                    </p>
                    <LineChart labels={individualTrendChart.labels} datasets={individualTrendChart.datasets} />
                </div>
            </div>

            {/* Row 3 – Doughnut + Heatmap */}
            <div className="charts-grid mx" style={{ gridTemplateColumns: '2fr 3fr' }}>
                <div className="chart-card">
                    <h3 className="chart-title">
                        <i className="fas fa-chart-pie" /> Distribución por Estado
                    </h3>
                    <DoughnutChart labels={statusChart.labels} data={statusChart.data} />
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">
                        <i className="fas fa-fire" /> Mapa de Calor – Capacidad Semanal
                    </h3>
                    <p className="text-muted text-sm" style={{ marginTop: '-0.25rem', marginBottom: '0.75rem' }}>
                        Horas trabajadas por día. Asigna tareas urgentes a quien tenga menor carga.
                    </p>
                    <CapacityHeatmap
                        members={filteredMetrics}
                        capacity={capacity}
                    />
                </div>
            </div>

            {/* Row 4 – Member detail table */}
            <div className="section-card mx">
                <h3 className="section-title">
                    <i className="fas fa-users" /> Detalle por Miembro
                </h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Miembro</th>
                                <th>Tareas Completadas</th>
                                <th>Tasa de Cumplimiento</th>
                                <th>Horas Trabajadas</th>
                                <th>IEL</th>
                                <th>SLA Prom. (días)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricsLoading && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />
                                        Cargando métricas...
                                    </td>
                                </tr>
                            )}
                            {!metricsLoading && !hasData && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                        {teams.length === 0
                                            ? 'Cargando equipos...'
                                            : 'No hay datos para el período seleccionado.'}
                                    </td>
                                </tr>
                            )}
                            {!metricsLoading && hasData && filteredMetrics.map(m => (
                                <tr key={m.userId}>
                                    <td>
                                        <div className="member-cell">
                                            <div className="member-avatar">{initials(m.displayName)}</div>
                                            <div className="member-name">{m.displayName}</div>
                                        </div>
                                    </td>
                                    <td>{m.completedTasks ?? 0}</td>
                                    <td><RateBadge rate={m.completionRate} /></td>
                                    <td>{m.hoursWorked != null ? `${m.hoursWorked}h` : '—'}</td>
                                    <td>{m.iel != null ? m.iel.toFixed(1) : '—'}</td>
                                    <td>{m.slaAvgDays != null ? m.slaAvgDays.toFixed(1) : '—'}</td>
                                </tr>
                            ))}
                            {!metricsLoading && hasData && filteredMetrics.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                        Sin datos para los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
