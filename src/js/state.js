/** Estado global compartido: tareas, timer activo, tipo en modal, selección Deck. */

export const STATE = {
    tasks: [],
    activeTimer: null,
    currentTaskType: 'project',
    selectedDeckCards: new Set()
};
