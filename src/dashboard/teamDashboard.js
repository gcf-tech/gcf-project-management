/**
 * Bridge: mounts the React TeamDashboardView into a vanilla-JS container.
 * Keeps the same export signature so app.js doesn't need changes.
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import TeamDashboardView from './components/TeamDashboardView.jsx';

const roots = new WeakMap();

export function renderTeamDashboard(container, user) {
    let root = roots.get(container);
    if (!root) {
        container.innerHTML = '';
        root = createRoot(container);
        roots.set(container, root);
    }
    root.render(createElement(TeamDashboardView, { user }));
}
