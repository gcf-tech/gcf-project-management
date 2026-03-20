/** Punto de entrada: OAuth, carga de datos, funciones en window para onclick. */

import { STATE }           from './state.js';
import { load }            from './storage.js';
import { fetchTasks }      from './api.js';
import { renderBoard }     from './render.js';
import { setupDragAndDrop } from './dragDrop.js';
import { initAuth }        from './auth.js';
import { CONFIG }          from './config.js';

import {
    openNewTaskModal,
    openImportDeckModal,
    openTaskDetail,
    closeModal,
    addSubtaskInput,
    submitNewTask,
    toggleSubtask,
    toggleDeckSelection,
    importSelectedDeckCards,
    selectDeckBoard,
} from './modals.js';

import {
    startTimer,
    pauseTimer,
    stopTimer,
    cancelPause,
    confirmPause,
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
    selectDeckBoard,
    startTimer,
    pauseTimer,
    stopTimer,
    cancelPause,
    confirmPause,
});

async function init() {
    const user = await initAuth();

    if (!user) {
        if (!CONFIG.NEXTCLOUD_OAUTH_CLIENT_ID) {
            document.getElementById('userAvatar').textContent = '?';
            document.getElementById('userName').textContent   = 'User';
        }
        if (CONFIG.NEXTCLOUD_OAUTH_CLIENT_ID) return;
    } else {
        document.getElementById('userAvatar').textContent = user.initials  || '?';
        document.getElementById('userName').textContent   = user.displayname || user.id || 'User';
    }

    load();

    if (CONFIG.BACKEND_URL) {
        try {
            const fetched = await fetchTasks();
            if (Array.isArray(fetched) && fetched.length > 0) {
                STATE.tasks = fetched;
            }
        } catch (err) {
            console.error('[init] Error al cargar tareas del backend:', err);
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
