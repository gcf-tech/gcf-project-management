/** KPIs: tareas activas, tiempo total, efectividad, completadas. */

import { STATE } from './state.js';
import { formatTime, calculateEffectiveness } from './utils.js';

export function updateKPIs() {
    const activeTasks    = STATE.tasks.filter(t => t.type === 'project' && t.progress < 100);
    const completedTasks = STATE.tasks.filter(t => t.progress === 100);
    const totalTime      = STATE.tasks.reduce((acc, t) => acc + (t.timeSpent ?? 0), 0);
    const effectiveness  = calculateEffectiveness(STATE.tasks);

    document.getElementById('kpiTareasActivas').textContent  = activeTasks.length;
    document.getElementById('kpiTiempoTotal').textContent    = formatTime(totalTime);
    document.getElementById('kpiEfectividad').textContent    = `${effectiveness}%`;
    document.getElementById('kpiCompletadas').textContent    = completedTasks.length;
}
