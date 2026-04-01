/**
 * Imperative Chart.js helpers for non-React consumers (e.g. skills.js).
 * React components should use components/Charts.jsx instead.
 */

const PALETTE = [
    '#f97316', '#3b82f6', '#10b981', '#8b5cf6',
    '#f59e0b', '#ec4899', '#ef4444', '#64748b',
];

function destroy(id) {
    const existing = window.Chart?.getChart(id);
    if (existing) existing.destroy();
}

export function renderRadarChart(canvasId, labels, datasets) {
    destroy(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    new window.Chart(ctx, {
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
    });
}
