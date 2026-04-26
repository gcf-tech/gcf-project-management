/** Helpers para abrir/cerrar modales por ID. */

// modalId → () => boolean  — returns true when modal has unsaved changes
const _dirtyChecks = new Map();

/**
 * Register a dirty-check callback for a modal.
 * Registering also disables backdrop-click close for that modal.
 */
export function registerDirtyCheck(modalId, fn) {
    _dirtyChecks.set(modalId, fn);
}

/** True if this modal has a registered dirty check (backdrop is disabled). */
export function hasDirtyCheck(modalId) {
    return _dirtyChecks.has(modalId);
}

/** True if the modal currently has unsaved changes. */
export function isDirty(modalId) {
    return !!(_dirtyChecks.get(modalId)?.());
}

export function openModal(id) {
    document.getElementById(id)?.classList.add('active');
}

export function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
}

/**
 * Close with dirty-state check — used by Cancel / X buttons.
 * Shows a native confirm if the modal has unsaved changes.
 * Returns true if the modal was closed, false if the user chose to keep editing.
 */
export function closeModalSafe(id) {
    if (isDirty(id)) {
        const discard = confirm(
            '¿Descartar cambios?\n\nTienes cambios sin guardar que se perderán.'
        );
        if (!discard) return false;
    }
    closeModal(id);
    return true;
}
