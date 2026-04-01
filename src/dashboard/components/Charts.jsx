import { useChart } from '../hooks/useChart.js';

const PALETTE = [
    '#f97316', '#3b82f6', '#10b981', '#8b5cf6',
    '#f59e0b', '#ec4899', '#ef4444', '#64748b',
];

export function LineChart({ labels, datasets }) {
    const ref = useChart(() => ({
        type: 'line',
        data: {
            labels,
            datasets: datasets.map((d, i) => ({
                label: d.label,
                data: d.data,
                borderColor: PALETTE[i % PALETTE.length],
                backgroundColor: PALETTE[i % PALETTE.length] + '22',
                tension: 0.35,
                fill: true,
                pointRadius: 4,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } },
        },
    }), [labels, datasets]);

    return <div className="chart-container"><canvas ref={ref} /></div>;
}

export function BarChart({ labels, datasets }) {
    const ref = useChart(() => ({
        type: 'bar',
        data: {
            labels,
            datasets: datasets.map((d, i) => ({
                label: d.label,
                data: d.data,
                backgroundColor: PALETTE[i % PALETTE.length] + 'cc',
                borderColor: PALETTE[i % PALETTE.length],
                borderWidth: 1,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } },
        },
    }), [labels, datasets]);

    return <div className="chart-container"><canvas ref={ref} /></div>;
}

export function DoughnutChart({ labels, data }) {
    const ref = useChart(() => ({
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: PALETTE.slice(0, data.length).map(c => c + 'cc'),
                borderColor: PALETTE.slice(0, data.length),
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
        },
    }), [labels, data]);

    return <div className="chart-container"><canvas ref={ref} /></div>;
}

export function GaugeChart({ value, max, colorStops }) {
    const ref = useChart(() => {
        const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
        let fillColor = PALETTE[2];
        if (colorStops) {
            for (const stop of [...colorStops].sort((a, b) => a.pct - b.pct)) {
                if (pct <= stop.pct) { fillColor = stop.color; break; }
            }
        }
        return {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [pct, 100 - pct],
                    backgroundColor: [fillColor, '#e2e8f0'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: -90,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
            },
        };
    }, [value, max, colorStops]);

    return <canvas ref={ref} />;
}

export function BellChart({ percentile }) {
    const ref = useChart(() => {
        const mean = 50, std = 15;
        const pdf = x => Math.exp(-0.5 * ((x - mean) / std) ** 2) / (std * Math.sqrt(2 * Math.PI));
        const xs = Array.from({ length: 101 }, (_, i) => i);
        const curve = xs.map(pdf);
        const p = Math.min(100, Math.max(0, Math.round(percentile)));
        const userY = pdf(p);

        return {
            type: 'line',
            data: {
                labels: xs,
                datasets: [
                    {
                        label: 'Equipo',
                        data: curve,
                        borderColor: '#94a3b8',
                        backgroundColor: '#94a3b820',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                    {
                        label: `Tú (P${p})`,
                        data: xs.map(x => (x === p ? userY : null)),
                        borderColor: '#f97316',
                        backgroundColor: '#f97316',
                        pointRadius: xs.map(x => (x === p ? 8 : 0)),
                        pointBackgroundColor: '#f97316',
                        showLine: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' }, tooltip: { enabled: false } },
                scales: {
                    x: { title: { display: true, text: 'Percentil' }, ticks: { stepSize: 10 } },
                    y: { display: false },
                },
            },
        };
    }, [percentile]);

    return <div className="chart-container"><canvas ref={ref} /></div>;
}

export function RadarChart({ labels, datasets }) {
    const ref = useChart(() => ({
        type: 'radar',
        data: {
            labels,
            datasets: datasets.map((d, i) => ({
                label: d.label,
                data: d.data,
                borderColor: PALETTE[i % PALETTE.length],
                backgroundColor: PALETTE[i % PALETTE.length] + '33',
                pointBackgroundColor: PALETTE[i % PALETTE.length],
                pointRadius: 4,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { r: { beginAtZero: true, min: 0, max: 10, ticks: { stepSize: 2 } } },
        },
    }), [labels, datasets]);

    return <div className="chart-container"><canvas ref={ref} /></div>;
}
