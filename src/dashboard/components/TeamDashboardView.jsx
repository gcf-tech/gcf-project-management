import { useState, useMemo } from 'react';
import { useDateRange } from '../hooks/useDateRange.js';
import {
    USE_MOCK, MOCK_TEAMS, MOCK_MEMBERS, MOCK_METRICS,
    MOCK_TREND_DATA, MOCK_STATUS_DATA, MOCK_CAPACITY,
} from '../mockData.js';
import PeriodSelector from './PeriodSelector.jsx';
import KpiCard from './KpiCard.jsx';
import { LineChart, BarChart, DoughnutChart } from './Charts.jsx';
import CapacityHeatmap from './CapacityHeatmap.jsx';

function initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function OnTimeBadge({ rate }) {
    if (rate == null) return <span>—</span>;
    const rounded = Math.round(rate);
    let cls = 'badge-success';
    let icon = 'fa-check-circle';
    if (rounded < 80)       { cls = 'badge-danger';  icon = 'fa-exclamation-circle'; }
    else if (rounded < 90)  { cls = 'badge-warning'; icon = 'fa-clock'; }

    return (
        <span className={`badge ${cls}`}>
            <i className={`fas ${icon}`} style={{ marginRight: '4px' }} />
            {rounded}%
        </span>
    );
}

export default function TeamDashboardView() {
    const dr = useDateRange('month');
    const [selectedTeam, setSelectedTeam]     = useState('all');
    const [selectedMember, setSelectedMember] = useState('all');

    // --- Mock data (swap for API when backend is ready) ---
    const teams   = USE_MOCK ? MOCK_TEAMS : [];
    const allMembers = USE_MOCK ? MOCK_MEMBERS : [];

    const visibleMembers = useMemo(() => {
        let list = allMembers;
        if (selectedTeam !== 'all') list = list.filter(m => m.teamId === selectedTeam);
        return list;
    }, [allMembers, selectedTeam]);

    const filteredMembers = useMemo(() => {
        let list = visibleMembers;
        if (selectedMember !== 'all') list = list.filter(m => m.userId === selectedMember);
        return list.map(m => ({ ...m, ...(MOCK_METRICS[m.userId] ?? {}) }));
    }, [visibleMembers, selectedMember]);

    // --- KPIs ---
    const kpis = useMemo(() => {
        const total     = filteredMembers.reduce((s, m) => s + (m.completedTasks ?? 0), 0);
        const avgOnTime = filteredMembers.length
            ? (filteredMembers.reduce((s, m) => s + (m.onTimeRate ?? 0), 0) / filteredMembers.length)
            : 0;
        const totalHrs  = filteredMembers.reduce((s, m) => s + (m.hoursWorked ?? 0), 0);
        const avgEff    = filteredMembers.length
            ? (filteredMembers.reduce((s, m) => s + (m.effectivenessIndex ?? 0), 0) / filteredMembers.length)
            : 0;
        return { total, avgOnTime, totalHrs, avgEff };
    }, [filteredMembers]);

    // --- Trend data filtered by team ---
    const trendChart = useMemo(() => {
        const teamNames = selectedTeam === 'all'
            ? teams.map(t => t.name)
            : [teams.find(t => t.id === selectedTeam)?.name].filter(Boolean);

        return {
            labels: MOCK_TREND_DATA.map(d => d.month),
            datasets: teamNames.map(name => ({
                label: name,
                data: MOCK_TREND_DATA.map(d => d[name] ?? 0),
            })),
        };
    }, [selectedTeam, teams]);

    // --- Member comparison ---
    const comparisonChart = useMemo(() => ({
        labels:   filteredMembers.map(m => m.displayname),
        datasets: [
            { label: 'Tareas Completadas', data: filteredMembers.map(m => m.completedTasks ?? 0) },
            { label: 'Horas Trabajadas',   data: filteredMembers.map(m => m.hoursWorked ?? 0) },
        ],
    }), [filteredMembers]);

    // --- Status distribution ---
    const statusChart = useMemo(() => ({
        labels: Object.keys(MOCK_STATUS_DATA),
        data:   Object.values(MOCK_STATUS_DATA),
    }), []);

    // --- Handlers ---
    const handleTeamChange = (val) => {
        setSelectedTeam(val);
        setSelectedMember('all');
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
                        onChange={e => handleTeamChange(e.target.value)}
                    >
                        <option value="all">Todos los equipos</option>
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
                        onChange={e => setSelectedMember(e.target.value)}
                    >
                        <option value="all">Todos los miembros</option>
                        {visibleMembers.map(m => (
                            <option key={m.userId} value={m.userId}>{m.displayname}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPIs */}
            <div className="metrics-grid">
                <KpiCard color="primary" icon="fa-tasks"
                    value={kpis.total}
                    label="Tareas Completadas"
                />
                <KpiCard color="success" icon="fa-clock"
                    value={`${Math.round(kpis.avgOnTime)}%`}
                    label="Entrega a Tiempo (prom.)"
                />
                <KpiCard color="warning" icon="fa-hourglass-half"
                    value={`${kpis.totalHrs}h`}
                    label="Horas Trabajadas"
                />
                <KpiCard color="purple" icon="fa-bolt"
                    value={kpis.avgEff.toFixed(1)}
                    label="Efectividad Promedio"
                />
            </div>

            {/* Member Table */}
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
                                <th>Entrega a Tiempo</th>
                                <th>Rendimiento</th>
                                <th>Horas Trabajadas</th>
                                <th>Índ. Efectividad</th>
                                <th>Dificultad Prom.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(m => (
                                <tr key={m.userId}>
                                    <td>
                                        <div className="member-cell">
                                            <div className="member-avatar">
                                                {initials(m.displayname)}
                                            </div>
                                            <div>
                                                <div className="member-name">{m.displayname}</div>
                                                {m.jobTitle && (
                                                    <div className="member-role">{m.jobTitle}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{m.completedTasks ?? 0}</td>
                                    <td><OnTimeBadge rate={m.onTimeRate} /></td>
                                    <td>{m.performance ?? '—'} <span className="text-muted text-sm">tareas/periodo</span></td>
                                    <td>{m.hoursWorked != null ? `${m.hoursWorked}h` : '—'}</td>
                                    <td>
                                        <span className="eff-score">{m.effectivenessIndex ?? '—'}</span>
                                    </td>
                                    <td>{m.avgDifficulty != null ? m.avgDifficulty.toFixed(1) : '—'}</td>
                                </tr>
                            ))}
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        Sin datos para los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid mx">
                {/* 1. Tendencia */}
                <div className="chart-card">
                    <h3 className="chart-title">
                        <i className="fas fa-chart-line" /> Tendencia de Tareas
                    </h3>
                    <LineChart
                        labels={trendChart.labels}
                        datasets={trendChart.datasets}
                    />
                </div>

                {/* 3. Comparativa de Miembros */}
                {filteredMembers.length > 1 && (
                    <div className="chart-card">
                        <h3 className="chart-title">
                            <i className="fas fa-chart-bar" /> Comparativa de Miembros
                        </h3>
                        <BarChart
                            labels={comparisonChart.labels}
                            datasets={comparisonChart.datasets}
                        />
                    </div>
                )}

                {/* 4. Distribución por Estado */}
                <div className="chart-card chart-card-sm">
                    <h3 className="chart-title">
                        <i className="fas fa-chart-pie" /> Distribución por Estado
                    </h3>
                    <DoughnutChart
                        labels={statusChart.labels}
                        data={statusChart.data}
                    />
                </div>
            </div>

            {/* 2. Heatmap de Capacidad */}
            <div className="section-card mx">
                <h3 className="section-title">
                    <i className="fas fa-fire" /> Mapa de Calor – Capacidad Semanal
                </h3>
                <p className="text-muted text-sm" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    Visualiza la carga de trabajo diaria. Asigna tareas urgentes a quien tenga menor carga.
                </p>
                <CapacityHeatmap
                    members={selectedMember !== 'all'
                        ? visibleMembers.filter(m => m.userId === selectedMember)
                        : visibleMembers}
                    capacity={MOCK_CAPACITY}
                />
            </div>
        </>
    );
}
