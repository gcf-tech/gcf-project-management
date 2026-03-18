/** Modales: nueva tarea/actividad, importar Deck, detalle de tarea. */

import { STATE }                        from './state.js';
import { createTask, fetchDeckCards }   from './api.js';
import { save }                         from './storage.js';
import { renderBoard }                  from './render.js';
import { formatTime, formatDate, isOverdue, generateId } from './utils.js';

let _deckCards = [];

export function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

function _openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

export function openNewTaskModal(type) {
    STATE.currentTaskType = type;

    document.getElementById('modalNewTaskTitle').textContent    = type === 'activity' ? 'New Activity' : 'New Task';
    document.getElementById('activityTypeGroup').style.display  = type === 'activity' ? 'block' : 'none';
    document.getElementById('subtasksGroup').style.display      = type === 'activity' ? 'none'  : 'block';

    document.getElementById('inputTaskName').value     = '';
    document.getElementById('inputStartDate').value    = new Date().toISOString().split('T')[0];
    document.getElementById('inputDeadline').value     = '';
    document.getElementById('inputPriority').value     = 'medium';
    document.getElementById('inputDescription').value  = '';
    document.getElementById('subtasksContainer').innerHTML = '';

    _openModal('modalNewTask');
}

export function addSubtaskInput() {
    const container = document.getElementById('subtasksContainer');
    const index     = container.children.length;
    const div       = document.createElement('div');

    div.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
    div.innerHTML = `
        <input type="text" class="form-input subtask-input" placeholder="Subtask ${index + 1}...">
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>`;

    container.appendChild(div);
}

export async function submitNewTask() {
    const name = document.getElementById('inputTaskName').value.trim();
    if (!name) {
        alert('Name is required.');
        return;
    }

    const subtasks = Array.from(document.querySelectorAll('.subtask-input'))
        .map(input => ({ raw: input.value.trim() }))
        .filter(({ raw }) => raw)
        .map(({ raw }) => ({
            id:        generateId('sub'),
            text:      raw,
            completed: false,
            timeSpent: 0
        }));

    await createTask({
        title:        name,
        description:  document.getElementById('inputDescription').value.trim(),
        column:       STATE.currentTaskType === 'activity' ? 'activities' : 'actively-working',
        type:         STATE.currentTaskType,
        priority:     document.getElementById('inputPriority').value,
        startDate:    document.getElementById('inputStartDate').value,
        deadline:     document.getElementById('inputDeadline').value || null,
        activityType: STATE.currentTaskType === 'activity'
            ? document.getElementById('inputActivityType').value
            : null,
        subtasks
    });

    closeModal('modalNewTask');
    renderBoard();
}

export async function openImportDeckModal() {
    STATE.selectedDeckCards.clear();
    _deckCards = [];

    const listEl = document.getElementById('deckList');
    listEl.innerHTML = '<p class="text-center text-muted">Loading cards from Deck...</p>';
    _openModal('modalImportDeck');

    try {
        _deckCards = await fetchDeckCards();

        if (_deckCards.length === 0) {
            listEl.innerHTML = `
                <p class="text-center text-muted">
                    No cards available.<br>
                    Configure <code>NEXTCLOUD_URL</code> and <code>NEXTCLOUD_BOARD_ID</code> in <code>js/config.js</code>.
                </p>`;
            return;
        }

        listEl.innerHTML = _deckCards.map(card => `
            <div class="deck-item" data-deck-id="${card.id}" onclick="toggleDeckSelection('${card.id}')">
                <div class="deck-item-checkbox">
                    <i class="fas fa-check" style="display:none;"></i>
                </div>
                <div class="deck-item-content">
                    <div class="deck-item-title">${card.title}</div>
                    <div class="deck-item-meta">
                        ${card.duedate ? `Due: ${formatDate(card.duedate.split('T')[0])}` : 'No deadline'}
                    </div>
                </div>
            </div>`).join('');

    } catch (err) {
        listEl.innerHTML = `<p class="text-center text-danger">Error: ${err.message}</p>`;
    }
}

export function toggleDeckSelection(deckId) {
    const item = document.querySelector(`[data-deck-id="${deckId}"]`);
    if (!item) return;

    if (STATE.selectedDeckCards.has(deckId)) {
        STATE.selectedDeckCards.delete(deckId);
        item.classList.remove('selected');
        item.querySelector('.fa-check').style.display = 'none';
    } else {
        STATE.selectedDeckCards.add(deckId);
        item.classList.add('selected');
        item.querySelector('.fa-check').style.display = 'block';
    }
}

export async function importSelectedDeckCards() {
    if (STATE.selectedDeckCards.size === 0) {
        alert('Please select at least one card to import.');
        return;
    }

    for (const deckId of STATE.selectedDeckCards) {
        const card = _deckCards.find(c => String(c.id) === String(deckId));
        if (!card) continue;

        await createTask({
            title:       card.title,
            description: card.description ?? '',
            column:      'actively-working',
            type:        'project',
            priority:    'medium',
            startDate:   new Date().toISOString().split('T')[0],
            deadline:    card.duedate ? card.duedate.split('T')[0] : null,
            subtasks:    []
        });
    }

    const count = STATE.selectedDeckCards.size;
    closeModal('modalImportDeck');
    renderBoard();
    alert(`${count} card(s) imported successfully!`);
}

export function openTaskDetail(taskId) {
    const task = STATE.tasks.find(t => t.id === taskId);
    if (!task) return;

    const isComplete = task.progress === 100;

    document.getElementById('modalDetailTitle').textContent = task.title;

    document.getElementById('modalDetailBody').innerHTML = `
        <div class="mb-2">
            <p class="text-muted">${task.description || 'No description.'}</p>
        </div>
        <div class="form-row mb-2">
            <div>
                <span class="form-label">Start</span>
                <p>${formatDate(task.startDate)}</p>
            </div>
            <div>
                <span class="form-label">Deadline</span>
                <p class="${isOverdue(task.deadline) && !isComplete ? 'text-danger' : ''} ${isComplete ? 'text-success' : ''}">
                    ${formatDate(task.deadline)}
                </p>
            </div>
        </div>
        <div class="mb-2">
            <span class="form-label">Time invested</span>
            <p style="font-size:1.5rem; font-weight:600; color:var(--color-primary);">
                ${formatTime(task.timeSpent)}
            </p>
        </div>
        ${task.subtasks.length > 0 ? `
            <div class="mb-2">
                <span class="form-label">
                    Subtasks (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length})
                </span>
                <div class="subtasks-list mt-1">
                    ${task.subtasks.map(sub => `
                        <div class="subtask-item ${sub.completed ? 'completed' : ''}"
                             onclick="toggleSubtask('${task.id}', '${sub.id}')">
                            <div class="subtask-checkbox">
                                ${sub.completed ? '<i class="fas fa-check"></i>' : ''}
                            </div>
                            <span class="subtask-text">${sub.text}</span>
                            <span class="subtask-time">${formatTime(sub.timeSpent)}</span>
                        </div>`).join('')}
                </div>
            </div>` : ''}
        ${task.observations.length > 0 ? `
            <div class="mb-2">
                <span class="form-label">Observations</span>
                <div class="mt-1">
                    ${task.observations.map(obs => {
                        const text = typeof obs === 'string' ? obs : obs.text;
                        const date = typeof obs === 'string' ? '' : new Date(obs.date).toLocaleString('en-US');
                        return `
                            <div style="padding:.5rem; background:var(--color-secondary-light);
                                        border-radius:var(--radius-sm); margin-bottom:.5rem;">
                                ${date ? `<small class="text-muted">${date}</small>` : ''}
                                <p style="margin-top:.25rem;">${text}</p>
                            </div>`;
                    }).join('')}
                </div>
            </div>` : ''}`;

    document.getElementById('modalDetailFooter').innerHTML = `
        <button class="btn btn-secondary" onclick="closeModal('modalTaskDetail')">Close</button>`;

    _openModal('modalTaskDetail');
}

export function toggleSubtask(taskId, subtaskId) {
    const task    = STATE.tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    subtask.completed = !subtask.completed;
    task.progress = Math.round(
        (task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100
    );

    save();
    openTaskDetail(taskId);
    renderBoard();
}
