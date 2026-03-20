/** Estado global compartido: tareas, timer activo, tipo en modal, selección Deck. */

export const STATE = {
    tasks: [],
    timers: { project: null, activity: null },
    currentTaskType: 'project',
    editingTaskId: null,
    selectedDeckCards: new Set()
};
