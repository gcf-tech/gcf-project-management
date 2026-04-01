/** Vista: Panel de administración – leaders y admins. */

import {
    fetchMyTeam, fetchAdminUsers, updateAdminUser,
    fetchTeams, createTeam, updateTeam, deleteTeam,
    addTeamMember, removeTeamMember, setUserRole,
} from '../dashboard/dashApi.js';

let _user = null;

export async function renderAdmin(container, user) {
    _user = user;
    const isAdmin = user.role === 'admin';

    const tabs = [
        { id: 'my-team', label: '<i class="fas fa-users"></i> Mi Equipo' },
        ...(isAdmin ? [
            { id: 'teams',    label: '<i class="fas fa-sitemap"></i> Equipos' },
            { id: 'users',    label: '<i class="fas fa-user-cog"></i> Usuarios' },
        ] : []),
    ];

    container.innerHTML = `
        <div class="view-header">
            <h2 class="view-title"><i class="fas fa-cog"></i> Administración</h2>
        </div>
        <div class="skills-tabs">
            ${tabs.map((t, i) => `
                <button class="skills-tab${i === 0 ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>
            `).join('')}
        </div>
        <div id="adminContent">
            <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>
        </div>`;

    container.querySelectorAll('.skills-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.skills-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            _loadTab(container, tab.dataset.tab, isAdmin);
        });
    });

    await _loadTab(container, 'my-team', isAdmin);
}

async function _loadTab(container, tab, isAdmin) {
    switch (tab) {
        case 'my-team': return _loadMyTeam(container);
        case 'teams':   return _loadTeams(container);
        case 'users':   return _loadUsers(container, isAdmin);
    }
}

// ─── My Team ────────────────────────────────────────────────────────────────

async function _loadMyTeam(container) {
    const content = container.querySelector('#adminContent');
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>';
    try {
        const [team, allUsers] = await Promise.all([
            fetchMyTeam(),
            fetchAdminUsers().catch(() => []),
        ]);

        if (!team) {
            content.innerHTML = '<div class="empty-state">No estás asignado a ningún equipo.</div>';
            return;
        }

        const members = team.members ?? [];
        const nonMembers = (allUsers ?? []).filter(u => !members.find(m => (m.id ?? m.userId) === (u.id ?? u.userId)));

        content.innerHTML = `
            <div class="section-card">
                <div class="section-title-row">
                    <h3 class="section-title"><i class="fas fa-users"></i> ${_esc(team.name)}</h3>
                    <button class="btn btn-primary btn-sm" id="btnShowAddMember">
                        <i class="fas fa-user-plus"></i> Añadir miembro
                    </button>
                </div>

                ${nonMembers.length ? `
                <div id="addMemberRow" class="add-member-row" style="display:none">
                    <select class="form-select form-select-sm" id="selectAddUser">
                        <option value="">— Selecciona usuario —</option>
                        ${nonMembers.map(u => `<option value="${_esc(u.id ?? u.userId)}">${_esc(u.displayname || u.id)}</option>`).join('')}
                    </select>
                    <button class="btn btn-success btn-sm" id="btnConfirmAdd">Añadir</button>
                    <button class="btn btn-secondary btn-sm" id="btnCancelAdd">Cancelar</button>
                </div>` : ''}

                <div class="table-wrapper">
                    <table class="data-table" id="teamMembersTable">
                        <thead><tr>
                            <th>Miembro</th>
                            <th>Job Title</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            ${members.map(m => _memberRow(m, team.id)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        _bindMyTeamEvents(content, team.id, container);
    } catch (err) {
        content.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i> ${_esc(err.message)}</div>`;
    }
}

function _memberRow(m, teamId) {
    const uid  = _esc(m.id ?? m.userId ?? '');
    const name = _esc(m.displayname || m.id || m.userId || '');
    const job  = m.jobTitle ?? '';
    const role = m.role ?? 'member';
    return `
        <tr id="row_${uid}">
            <td><div class="member-cell">
                <div class="member-avatar">${_initials(m.displayname || m.id)}</div>
                <span>${name}</span>
            </div></td>
            <td>
                <input type="text" class="form-input form-input-sm job-title-input"
                    value="${_esc(job)}" data-uid="${uid}" data-team-id="${teamId}"
                    placeholder="Ej. Frontend Dev">
            </td>
            <td><span class="role-badge role-${role}">${role}</span></td>
            <td>
                <button class="btn btn-danger btn-sm btn-icon" title="Remover del equipo"
                    data-action="remove-member" data-uid="${uid}" data-team-id="${teamId}">
                    <i class="fas fa-user-minus"></i>
                </button>
            </td>
        </tr>`;
}

function _bindMyTeamEvents(content, teamId, container) {
    // Toggle add member row
    content.querySelector('#btnShowAddMember')?.addEventListener('click', () => {
        const row = content.querySelector('#addMemberRow');
        if (row) row.style.display = row.style.display === 'none' ? 'flex' : 'none';
    });
    content.querySelector('#btnCancelAdd')?.addEventListener('click', () => {
        const row = content.querySelector('#addMemberRow');
        if (row) row.style.display = 'none';
    });
    content.querySelector('#btnConfirmAdd')?.addEventListener('click', async () => {
        const sel = content.querySelector('#selectAddUser');
        const uid = sel?.value;
        if (!uid) return;
        try {
            await addTeamMember(teamId, uid);
            _loadMyTeam(container);
        } catch (err) { alert('Error: ' + err.message); }
    });

    // Save job titles on blur
    content.querySelectorAll('.job-title-input').forEach(input => {
        input.addEventListener('change', async () => {
            try {
                await updateAdminUser(input.dataset.uid, { jobTitle: input.value.trim() });
            } catch (err) { alert('Error: ' + err.message); }
        });
    });

    // Remove member
    content.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('¿Remover a este miembro del equipo?')) return;
            try {
                await removeTeamMember(btn.dataset.teamId, btn.dataset.uid);
                _loadMyTeam(container);
            } catch (err) { alert('Error: ' + err.message); }
        });
    });
}

// ─── Teams (admin only) ──────────────────────────────────────────────────────

async function _loadTeams(container) {
    const content = container.querySelector('#adminContent');
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>';
    try {
        const teams = await fetchTeams();
        content.innerHTML = `
            <div class="section-card">
                <div class="section-title-row">
                    <h3 class="section-title"><i class="fas fa-sitemap"></i> Equipos</h3>
                    <button class="btn btn-primary btn-sm" id="btnNewTeam">
                        <i class="fas fa-plus"></i> Nuevo equipo
                    </button>
                </div>
                <div id="newTeamForm" class="inline-form" style="display:none">
                    <input type="text" class="form-input form-input-sm" id="newTeamName" placeholder="Nombre del equipo">
                    <label class="form-check-label">
                        <input type="checkbox" id="newTeamIsTech"> Tech team
                    </label>
                    <button class="btn btn-success btn-sm" id="btnSaveNewTeam">Crear</button>
                    <button class="btn btn-secondary btn-sm" id="btnCancelNewTeam">Cancelar</button>
                </div>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead><tr>
                            <th>Nombre</th>
                            <th>Tech team</th>
                            <th>Miembros</th>
                            <th>Acciones</th>
                        </tr></thead>
                        <tbody>
                            ${(teams ?? []).map(t => `
                            <tr id="teamRow_${t.id}">
                                <td>
                                    <input type="text" class="form-input form-input-sm team-name-input"
                                        value="${_esc(t.name)}" data-team-id="${t.id}">
                                </td>
                                <td>
                                    <input type="checkbox" class="team-tech-input" data-team-id="${t.id}"
                                        ${t.isTechTeam ? 'checked' : ''}>
                                </td>
                                <td>${(t.members ?? t.memberCount ?? 0)}</td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" data-action="save-team" data-team-id="${t.id}">
                                        <i class="fas fa-save"></i>
                                    </button>
                                    <button class="btn btn-danger btn-sm" data-action="delete-team" data-team-id="${t.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        // New team form
        content.querySelector('#btnNewTeam').addEventListener('click', () => {
            content.querySelector('#newTeamForm').style.display = 'flex';
        });
        content.querySelector('#btnCancelNewTeam').addEventListener('click', () => {
            content.querySelector('#newTeamForm').style.display = 'none';
        });
        content.querySelector('#btnSaveNewTeam').addEventListener('click', async () => {
            const name = content.querySelector('#newTeamName').value.trim();
            if (!name) return;
            const isTechTeam = content.querySelector('#newTeamIsTech').checked;
            try {
                await createTeam({ name, isTechTeam });
                _loadTeams(container);
            } catch (err) { alert('Error: ' + err.message); }
        });

        // Save / delete
        content.querySelectorAll('[data-action="save-team"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tid  = btn.dataset.teamId;
                const name = content.querySelector(`.team-name-input[data-team-id="${tid}"]`)?.value.trim();
                const tech = content.querySelector(`.team-tech-input[data-team-id="${tid}"]`)?.checked;
                try { await updateTeam(tid, { name, isTechTeam: tech }); }
                catch (err) { alert('Error: ' + err.message); }
            });
        });
        content.querySelectorAll('[data-action="delete-team"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('¿Eliminar este equipo?')) return;
                try { await deleteTeam(btn.dataset.teamId); _loadTeams(container); }
                catch (err) { alert('Error: ' + err.message); }
            });
        });

    } catch (err) {
        content.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i> ${_esc(err.message)}</div>`;
    }
}

// ─── Users (admin only) ──────────────────────────────────────────────────────

async function _loadUsers(container, isAdmin) {
    const content = container.querySelector('#adminContent');
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>';
    try {
        const [users, teams] = await Promise.all([fetchAdminUsers(), fetchTeams()]);
        const teamMap = {};
        (teams ?? []).forEach(t => { teamMap[t.id] = t.name; });

        content.innerHTML = `
            <div class="section-card">
                <h3 class="section-title"><i class="fas fa-user-cog"></i> Usuarios</h3>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead><tr>
                            <th>Usuario</th>
                            <th>Equipo</th>
                            <th>Job Title</th>
                            <th>Rol</th>
                            ${isAdmin ? '<th>Acciones</th>' : ''}
                        </tr></thead>
                        <tbody>
                            ${(users ?? []).map(u => {
                                const uid  = _esc(u.id ?? u.userId ?? '');
                                const name = _esc(u.displayname || u.id || '');
                                const team = teamMap[u.teamId] ? _esc(teamMap[u.teamId]) : '—';
                                const role = u.role ?? 'member';
                                return `
                                <tr>
                                    <td><div class="member-cell">
                                        <div class="member-avatar sm">${_initials(u.displayname || u.id)}</div>
                                        <div>
                                            <div class="member-name">${name}</div>
                                            <div class="member-role text-muted">${_esc(u.email ?? '')}</div>
                                        </div>
                                    </div></td>
                                    <td>${team}</td>
                                    <td>
                                        <input type="text" class="form-input form-input-sm job-title-input"
                                            value="${_esc(u.jobTitle ?? '')}" data-uid="${uid}" placeholder="Job title">
                                    </td>
                                    <td><span class="role-badge role-${role}">${role}</span></td>
                                    ${isAdmin ? `
                                    <td>
                                        <select class="form-select form-select-sm role-select" data-uid="${uid}">
                                            <option value="member"  ${role==='member'  ?'selected':''}>member</option>
                                            <option value="leader"  ${role==='leader'  ?'selected':''}>leader</option>
                                            <option value="admin"   ${role==='admin'   ?'selected':''}>admin</option>
                                        </select>
                                    </td>` : ''}
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        content.querySelectorAll('.job-title-input').forEach(input => {
            input.addEventListener('change', async () => {
                try { await updateAdminUser(input.dataset.uid, { jobTitle: input.value.trim() }); }
                catch (err) { alert('Error: ' + err.message); }
            });
        });

        if (isAdmin) {
            content.querySelectorAll('.role-select').forEach(sel => {
                sel.addEventListener('change', async () => {
                    if (!confirm(`¿Cambiar rol a "${sel.value}"?`)) { return; }
                    try { await setUserRole(sel.dataset.uid, sel.value); }
                    catch (err) { alert('Error: ' + err.message); }
                });
            });
        }

    } catch (err) {
        content.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i> ${_esc(err.message)}</div>`;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function _esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
