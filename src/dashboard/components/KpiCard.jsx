export default function KpiCard({ color, icon, value, label, subtext }) {
    return (
        <div className="metric-card">
            <div className={`metric-icon ${color}`}>
                <i className={`fas ${icon}`} />
            </div>
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
            {subtext && <div className="kpi-subtext">{subtext}</div>}
        </div>
    );
}
