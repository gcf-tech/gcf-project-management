import { useState, useEffect, useCallback } from 'react';
import { fetchMyTeam, fetchTeamMetrics } from '../dashApi.js';
import { useDateRange } from '../hooks/useDateRange.js';
import PeriodSelector from './PeriodSelector.jsx';
import KpiCard from './KpiCard.jsx';
import { LineChart, BarChart, DoughnutChart } from './Charts.jsx';

function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function CompletionBar({ rate }) {
    const pct   = rate != null ? Math.min(100, Math.max(0, Math.round(rate))) : 0;
    const label = rate != null ? pct + '%' : '—';
    return (
        <div className="completion-wrap">
            <div className="completion-track">
                <div className="completion-bar" style={{ width: `${pct}%` }} />
            </div>
            <span className="completion-label">{label}</span>
        </div>
    );
}

export default function TeamDashboardView() {
    const dr = useDateRange('month');
    const [team, setTeam]         = useState(null);
    const [metrics, setMetrics]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [teamErr, setTeamErr]   = useState(null);

    useEffect(() => {
        fetchMyTeam()
            .then(t => setTeam(t))
            .catch(() => setTeamErr('No se pudo cargar el equipo.'))
            .finally(() => setLoading(false));
    }, []);

    const loadMetrics = useCallback((teamId, start, end) => {
        setMetrics(null);
        fetchTeamMetrics(teamId, start, end)
            .then(d => setMetrics(d))
            .catch(err => setMetrics({ _error: err.message }));
    }, []);

    useEffect(() => {
        if (!team?.id) return;
        loadMetrics(team.id, dr.range.start, dr.range.end);
    }, [team?.id, dr.range.start, dr.range.end, loadMetrics]);

    if (loading) {
        return (
            <>
                <Header dr={dr} />
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin" /> Cargando equipo…
                </div>
            </>
        );
    }

    if (teamErr) {
        return (
            <>
                <Header dr={dr} />
                <div className="error-state">
                    <i className="fas fa-exclamation-circle" /> {teamErr}
                </div>
            </>
        );
    }

    if (!team) {
        return (
            <>
                <Header dr={dr} />
                <div className="empty-state">
                    <i className="fas fa-users-slash" /> No estás asignado a ningún equipo.
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                dr={dr}
                onPeriod={key => dr.setPeriod(key)}
            />
            <MetricsContent metrics={metrics} />
        </>
    );
}

function Header({ dr, onPeriod }) {
    return (
        <div className="view-header">
            <h2 className="view-title">
                <i className="fas fa-tachometer-alt" /> Dashboard del Equipo
            </h2>
            {onPeriod && (
                <PeriodSelector
                    period={dr.period}
                    onPeriodChange={onPeriod}
                    customStart={dr.customStart}
                    onCustomStartChange={dr.setCustomStart}
                    customEnd={dr.customEnd}
                    onCustomEndChange={dr.setCustomEnd}
                    showCustom={false}
                />
            )}
        </div>
    );
}

function MetricsContent({ metrics }) {
    if (!metrics) {
        return (
            <div className="loading-state">
                <i className="fas fa-spinner fa-spin" /> Cargando métricas…
            </div>
        );
    }

    if (metrics._error) {
        return (
            <div className="error-state">
                <i className="fas fa-exclamation-circle" /> {metrics._error}
            </div>
        );
    }

    const members = metrics.members ?? [];

    return (
        <>
            {/* KPIs */}
            <div className="metrics-grid">
                <KpiCard
                    color="primary" icon="fa-tasks"
                    value={`${metrics.completedTasks ?? 0} / ${metrics.totalTasks ?? 0}`}
                    label="Completadas / Total"
                />
                <KpiCard
                    color="success" icon="fa-percentage"
                    value={metrics.completionRate != null ? Math.round(metrics.completionRate) + '%' : '—'}
                    label="Tasa de cumplimiento"
                />
                <KpiCard
                    color="warning" icon="fa-clock"
                    value={metrics.totalHours != null ? Math.round(metrics.totalHours) + 'h' : '0h'}
                    label="Horas totales"
                />
                <KpiCard
                    color="danger" icon="fa-bolt"
                    value={metrics.avgProductivity != null ? Math.round(metrics.avgProductivity) : '—'}
                    label="Productividad prom."
                />
            </div>

            {/* Members table */}
            {members.length > 0 && (
                <div className="section-card">
                    <h3 className="section-title">
                        <i className="fas fa-users" /> Miembros del equipo
                    </h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Miembro</th>
                                    <th>Completadas</th>
                                    <th>Cumplimiento</th>
                                    <th>Horas</th>
                                    <th>Productividad</th>
                                    <th>Dificultad prom.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((m, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="member-cell">
                                                <div className="member-avatar">
                                                    {initials(m.displayname || m.userId)}
                                                </div>
                                                <div>
                                                    <div className="member-name">
                                                        {esc(m.displayname || m.userId)}
                                                    </div>
                                                    {m.jobTitle && (
                                                        <div className="member-role">{esc(m.jobTitle)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>{m.completedTasks ?? 0}</td>
                                        <td><CompletionBar rate={m.completionRate} /></td>
                                        <td>
                                            {m.hoursWorked != null
                                                ? (Math.round(m.hoursWorked * 10) / 10) + 'h'
                                                : '—'}
                                        </td>
                                        <td>{m.productivity != null ? Math.round(m.productivity) : '—'}</td>
                                        <td>
                                            {m.avgDifficulty != null
                                                ? Math.round(m.avgDifficulty * 10) / 10
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="charts-grid">
                {metrics.tasksByMonth?.length > 0 && (
                    <div className="chart-card">
                        <h3 className="chart-title">Tareas por mes</h3>
                        <LineChart
                            labels={metrics.tasksByMonth.map(m => m.month)}
                            datasets={[{ label: 'Tareas', data: metrics.tasksByMonth.map(m => m.count ?? 0) }]}
                        />
                    </div>
                )}

                {members.length > 1 && (
                    <div className="chart-card">
                        <h3 className="chart-title">Comparativa de miembros</h3>
                        <BarChart
                            labels={members.map(m => m.displayname || m.userId)}
                            datasets={[
                                { label: 'Completadas', data: members.map(m => m.completedTasks ?? 0) },
                                { label: 'Horas', data: members.map(m => Math.round((m.hoursWorked ?? 0) * 10) / 10) },
                            ]}
                        />
                    </div>
                )}

                {metrics.tasksByStatus && (
                    <div className="chart-card chart-card-sm">
                        <h3 className="chart-title">Distribución por estado</h3>
                        <DoughnutChart
                            labels={Object.keys(metrics.tasksByStatus)}
                            data={Object.values(metrics.tasksByStatus)}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
