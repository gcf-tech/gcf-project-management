/** API calls for dashboard, metrics, skills, and admin endpoints. */

import { getToken, logout } from '../auth/auth.js';
import { CONFIG } from '../core/config.js';

async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(`${CONFIG.BACKEND_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// --- Metrics ---
export const fetchMyMetrics = (start, end) =>
    apiFetch(`/api/dashboard/my-metrics?start_date=${start}&end_date=${end}`);

export const fetchMyTeam = () =>
    apiFetch('/api/dashboard/my-team');

export const fetchTeamMetrics = (teamId, start, end) =>
    apiFetch(`/api/dashboard/team/${teamId}/metrics?start_date=${start}&end_date=${end}`);

export const fetchCompare = () =>
    apiFetch('/api/dashboard/compare');

export const fetchSkillsComparison = () =>
    apiFetch('/api/dashboard/skills-comparison');

// --- Skills ---
export const fetchSkills = () =>
    apiFetch('/api/skills');

export const fetchUserSkills = (userId) =>
    apiFetch(`/api/users/${userId}/skills`);

export const updateMySkills = (skills) =>
    apiFetch('/api/users/me/skills', { method: 'POST', body: JSON.stringify(skills) });

export const endorseSkill = (userId, skillId, score, comment) =>
    apiFetch(`/api/users/${userId}/skills/${skillId}/endorse`, {
        method: 'POST',
        body: JSON.stringify({ score, comment }),
    });

// --- Admin ---
export const fetchAdminUsers = () =>
    apiFetch('/api/admin/users');

export const updateAdminUser = (userId, data) =>
    apiFetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const fetchTeams = () =>
    apiFetch('/api/teams');

export const createTeam = (data) =>
    apiFetch('/api/admin/teams', { method: 'POST', body: JSON.stringify(data) });

export const updateTeam = (teamId, data) =>
    apiFetch(`/api/admin/teams/${teamId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTeam = (teamId) =>
    apiFetch(`/api/admin/teams/${teamId}`, { method: 'DELETE' });

export const addTeamMember = (teamId, userId) =>
    apiFetch(`/api/admin/teams/${teamId}/add-member?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });

export const removeTeamMember = (teamId, userId) =>
    apiFetch(`/api/admin/teams/${teamId}/remove-member?user_id=${encodeURIComponent(userId)}`, { method: 'POST' });

export const setUserRole = (userId, role) =>
    apiFetch(`/api/admin/users/${userId}/set-role?role=${encodeURIComponent(role)}`, { method: 'POST' });
