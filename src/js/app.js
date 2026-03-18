/** Punto de entrada: init, carga de datos y funciones expuestas en window para onclick. */

import { CONFIG }          from './config.js';
import { STATE }           from './state.js';
import { load }            from './storage.js';
import { fetchTasks }      from './api.js';
import { renderBoard }     from './render.js';
import { setupDragAndDrop } from './dragDrop.js';

import {
    openNewTaskModal,
    openImportDeckModal,
    openTaskDetail,
    closeModal,
    addSubtaskInput,
    submitNewTask,
    toggleSubtask,
    toggleDeckSelection,
    importSelectedDeckCards
} from './modals.js';

import {
    startTimer,
    pauseTimer,
    stopTimer,
    cancelPause,
    confirmPause
} from './timer.js';

Object.assign(window, {
    openNewTaskModal,
    openImportDeckModal,
    openTaskDetail,
    closeModal,
    addSubtaskInput,
    submitNewTask,
    toggleSubtask,
    toggleDeckSelection,
    importSelectedDeckCards,
    startTimer,
    pauseTimer,
    stopTimer,
    cancelPause,
    confirmPause
});

async function init() {
    const { name, initials } = CONFIG.USER;
    document.getElementById('userAvatar').textContent = initials || '?';
    document.getElementById('userName').textContent   = name     || 'User';

    load();

    if (STATE.tasks.length === 0 && CONFIG.BACKEND_URL) {
        try {
            STATE.tasks = await fetchTasks();
        } catch (err) {
            console.error('[init] Failed to fetch tasks from backend:', err);
        }
    }

    renderBoard();
    setupDragAndDrop();

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active')
                .forEach(m => m.classList.remove('active'));
        }
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
