/** Cronómetro por tarea; pausa guarda progreso y observación. */

import { STATE }                    from './state.js';
import { saveTime, completeTask }   from './api.js';
import { renderBoard }              from './render.js';
import { closeModal }               from './modals.js';
import { formatTime }               from './utils.js';

export function startTimer(taskId) {
    if (STATE.activeTimer && STATE.activeTimer.taskId !== taskId) {
        alert('You already have an active timer. Pause or stop it first.');
        return;
    }

    const task = STATE.tasks.find(t => t.id === taskId);
    if (!task) return;

    const selectEl = document.getElementById(`subtask-select-${taskId}`);

    STATE.activeTimer = {
        taskId,
        subtaskId:   selectEl?.value ?? 'none',
        startTime:   Date.now(),
        accumulated: task.timeSpent ?? 0,
        intervalId:  setInterval(() => _tick(taskId), 1000)
    };

    renderBoard();
}

export function pauseTimer(taskId) {
    if (!STATE.activeTimer || STATE.activeTimer.taskId !== taskId) return;

    clearInterval(STATE.activeTimer.intervalId);
    const elapsed = _elapsed();
    _openPauseFeedbackModal(taskId, elapsed);
}

export async function stopTimer(taskId) {
    if (!STATE.activeTimer || STATE.activeTimer.taskId !== taskId) return;

    clearInterval(STATE.activeTimer.intervalId);
    const elapsed   = _elapsed();
    const subtaskId = STATE.activeTimer.subtaskId;
    STATE.activeTimer = null;

    await saveTime(taskId, elapsed, subtaskId, { progress: 100 });
    await completeTask(taskId);
    renderBoard();
}

export function cancelPause(taskId) {
    const task = STATE.tasks.find(t => t.id === taskId);
    if (task) {
        STATE.activeTimer = {
            taskId,
            subtaskId:   null,
            startTime:   Date.now(),
            accumulated: task.timeSpent ?? 0,
            intervalId:  setInterval(() => _tick(taskId), 1000)
        };
    }
    closeModal('modalTaskDetail');
    renderBoard();
}

export async function confirmPause(taskId, elapsedTime) {
    const progress    = parseInt(document.getElementById('pauseProgress').value, 10);
    const observation = document.getElementById('pauseObservation').value.trim();
    const subtaskId   = STATE.activeTimer?.subtaskId ?? null;

    await saveTime(taskId, elapsedTime, subtaskId, {
        progress,
        observation: observation || null
    });

    STATE.activeTimer = null;
    closeModal('modalTaskDetail');
    renderBoard();
}

function _elapsed() {
    return Math.floor((Date.now() - STATE.activeTimer.startTime) / 1000);
}

function _tick(taskId) {
    const el = document.getElementById(`timer-${taskId}`);
    if (el && STATE.activeTimer) {
        el.textContent = formatTime(STATE.activeTimer.accumulated + _elapsed());
    }
}

function _openPauseFeedbackModal(taskId, elapsedTime) {
    const task = STATE.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('modalDetailTitle').textContent = 'Record Progress';

    document.getElementById('modalDetailBody').innerHTML = `
        <div class="pause-feedback">
            <div class="pause-feedback-title">
                <i class="fas fa-pause-circle"></i>
                Time recorded: ${formatTime(elapsedTime)}
            </div>
            <div class="form-group">
                <label class="form-label">Progress percentage</label>
                <div class="progress-input-group">
                    <input type="range" id="pauseProgress" min="0" max="100" value="${task.progress}"
                           oninput="document.getElementById('pauseProgressValue').textContent = this.value + '%'">
                    <span id="pauseProgressValue">${task.progress}%</span>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Progress notes</label>
                <textarea class="form-textarea" id="pauseObservation"
                          placeholder="Briefly describe what you accomplished..."></textarea>
            </div>
        </div>`;

    document.getElementById('modalDetailFooter').innerHTML = `
        <button class="btn btn-secondary" onclick="cancelPause('${taskId}')">Cancel</button>
        <button class="btn btn-primary"   onclick="confirmPause('${taskId}', ${elapsedTime})">
            <i class="fas fa-save"></i> Save &amp; Pause
        </button>`;

    document.getElementById('modalTaskDetail').classList.add('active');
}
