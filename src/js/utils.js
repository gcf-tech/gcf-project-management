/** Utilidades: formato de tiempo/fecha, IDs, efectividad, etiquetas de actividad. */

export function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const hrs  = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

export function isOverdue(deadline) {
    if (!deadline) return false;
    return new Date(`${deadline}T23:59:59`) < new Date();
}

export function calculateEffectiveness(tasks) {
    const done = tasks.filter(t => t.deadline && t.progress === 100);
    if (done.length === 0) return 0;
    const onTime = done.filter(t => !isOverdue(t.deadline)).length;
    return Math.round((onTime / done.length) * 100);
}

export function generateId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getActivityTypeLabel(type) {
    const labels = {
        meeting:  'Meeting',
        training: 'Training',
        event:    'Event',
        other:    'Other'
    };
    return labels[type] ?? type;
}
