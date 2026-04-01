/** Vista: Skills – solo tech team. Auto-evaluación, radar, endorsements. */

import { fetchSkills, fetchUserSkills, updateMySkills, fetchSkillsComparison, fetchCompare, endorseSkill } from '../dashboard/dashApi.js';

// Estado local del módulo
let _currentUser = null;
let _pendingEndorse = null; // { userId, skillId, userName, skillName }

export async function renderSkills(container, user) {
    _currentUser = user;
    container.innerHTML = `
        <div class="view-header">
            <h2 class="view-title"><i class="fas fa-star"></i> Skills</h2>
        </div>
        <div class="skills-tabs">
            <button class="skills-tab active" data-tab="my-skills">Mis Skills</button>
            <button class="skills-tab" data-tab="comparison">Comparativa del equipo</button>
        </div>
        <div id="skillsContent">
            <div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>
        </div>`;

    container.querySelectorAll('.skills-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.skills-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'my-skills') _loadMySkills(container);
            else _loadComparison(container);
        });
    });

    await _loadMySkills(container);
}

async function _loadMySkills(container) {
    const content = container.querySelector('#skillsContent');
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando skills…</div>';
    try {
        const [allSkills, mySkills] = await Promise.all([
            fetchSkills(),
            fetchUserSkills(_currentUser.id),
        ]);

        if (!allSkills?.length) {
            content.innerHTML = '<div class="empty-state">No hay skills configuradas.</div>';
            return;
        }

        const myMap = {};
        (mySkills ?? []).forEach(s => { myMap[s.skillId ?? s.id] = s; });

        content.innerHTML = `
            <div class="section-card">
                <div class="section-title-row">
                    <h3 class="section-title"><i class="fas fa-sliders-h"></i> Mi auto-evaluación</h3>
                    <button class="btn btn-primary btn-sm" id="btnSaveSkills">
                        <i class="fas fa-save"></i> Guardar cambios
                    </button>
                </div>
                <div class="skills-grid" id="mySkillsGrid">
                    ${allSkills.map(skill => {
                        const sid = skill.id;
                        const entry = myMap[sid];
                        const score = entry?.score ?? 5;
                        const endorsements = entry?.endorsements ?? [];
                        return `
                        <div class="skill-card" data-skill-id="${sid}">
                            <div class="skill-header">
                                <div class="skill-name">${_esc(skill.name)}</div>
                                ${skill.category ? `<span class="skill-category">${_esc(skill.category)}</span>` : ''}
                            </div>
                            <div class="skill-score-row">
                                <input type="range" class="skill-range" min="1" max="10" value="${score}"
                                    data-skill-id="${sid}" id="range_${sid}">
                                <span class="skill-score-val" id="scoreVal_${sid}">${score}</span>
                            </div>
                            ${endorsements.length ? `
                            <div class="endorsements-summary">
                                <i class="fas fa-thumbs-up"></i>
                                ${endorsements.length} endorsement${endorsements.length !== 1 ? 's' : ''}
                                – prom. ${(endorsements.reduce((s,e) => s + (e.score ?? 0), 0) / endorsements.length).toFixed(1)}
                            </div>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>`;

        // Live update score display
        content.querySelectorAll('.skill-range').forEach(input => {
            input.addEventListener('input', () => {
                document.getElementById(`scoreVal_${input.dataset.skillId}`).textContent = input.value;
            });
        });

        content.querySelector('#btnSaveSkills').addEventListener('click', async () => {
            const skills = [...content.querySelectorAll('.skill-range')].map(inp => ({
                skillId: inp.dataset.skillId,
                score: parseInt(inp.value, 10),
            }));
            const btn = content.querySelector('#btnSaveSkills');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando…';
            try {
                await updateMySkills(skills);
                btn.innerHTML = '<i class="fas fa-check"></i> Guardado';
                setTimeout(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar cambios'; }, 2000);
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
                alert('Error al guardar: ' + err.message);
            }
        });

    } catch (err) {
        content.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i> ${_esc(err.message)}</div>`;
    }
}

async function _loadComparison(container) {
    const content = container.querySelector('#skillsContent');
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Cargando comparativa…</div>';
    try {
        const [comparison, radarData] = await Promise.all([
            fetchSkillsComparison(),
            fetchCompare(),
        ]);

        if (!comparison && !radarData) {
            content.innerHTML = '<div class="empty-state">Sin datos de comparativa.</div>';
            return;
        }

        // Radar chart section
        let radarHTML = '';
        if (radarData?.labels?.length) {
            radarHTML = `
                <div class="chart-card chart-card-radar">
                    <h3 class="chart-title">Tú vs. promedio del equipo</h3>
                    <div class="chart-container"><canvas id="chartSkillsRadar"></canvas></div>
                </div>`;
        }

        // Skills comparison table
        let tableHTML = '';
        if (comparison?.skills?.length && comparison?.members?.length) {
            const skills = comparison.skills;
            const members = comparison.members;
            tableHTML = `
                <div class="section-card">
                    <h3 class="section-title"><i class="fas fa-table"></i> Skills por miembro</h3>
                    <div class="table-wrapper">
                        <table class="data-table skills-table">
                            <thead>
                                <tr>
                                    <th>Skill</th>
                                    ${members.map(m => `
                                        <th>
                                            <div class="member-th">
                                                <div class="member-avatar sm">${_initials(m.displayname || m.userId)}</div>
                                                <span>${_esc(m.displayname || m.userId)}</span>
                                            </div>
                                        </th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${skills.map(skill => `
                                <tr>
                                    <td class="skill-name-cell">${_esc(skill.name)}</td>
                                    ${members.map(m => {
                                        const score = m.skills?.[skill.id]?.score;
                                        const isMe = m.userId === _currentUser?.id;
                                        return `
                                        <td class="${isMe ? 'my-score-cell' : ''}">
                                            <div class="score-cell-inner">
                                                <span class="score-pill score-${_scoreLevel(score)}">${score ?? '—'}</span>
                                                ${!isMe ? `
                                                <button class="btn-endorse" title="Endorsar"
                                                    data-action="open-endorse"
                                                    data-user-id="${m.userId}"
                                                    data-skill-id="${skill.id}"
                                                    data-user-name="${_esc(m.displayname || m.userId)}"
                                                    data-skill-name="${_esc(skill.name)}">
                                                    <i class="fas fa-thumbs-up"></i>
                                                </button>` : ''}
                                            </div>
                                        </td>`;
                                    }).join('')}
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }

        content.innerHTML = `
            <div class="charts-grid single">${radarHTML}</div>
            ${tableHTML}`;

        if (radarData?.labels?.length) {
            const { renderRadarChart } = await import('../dashboard/chartUtils.js');
            const datasets = [];
            if (radarData.myScores) datasets.push({ label: 'Yo', data: radarData.myScores });
            if (radarData.teamAvg) datasets.push({ label: 'Promedio equipo', data: radarData.teamAvg });
            renderRadarChart('chartSkillsRadar', radarData.labels, datasets);
        }

        // Bind endorse buttons
        content.querySelectorAll('[data-action="open-endorse"]').forEach(btn => {
            btn.addEventListener('click', () => {
                _pendingEndorse = {
                    userId:    btn.dataset.userId,
                    skillId:   btn.dataset.skillId,
                    userName:  btn.dataset.userName,
                    skillName: btn.dataset.skillName,
                };
                _openEndorseModal();
            });
        });

    } catch (err) {
        content.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-circle"></i> ${_esc(err.message)}</div>`;
    }
}

function _openEndorseModal() {
    const modal = document.getElementById('modalEndorse');
    if (!modal || !_pendingEndorse) return;
    modal.querySelector('#endorseTitle').textContent =
        `Endorsar "${_pendingEndorse.skillName}" de ${_pendingEndorse.userName}`;
    const scoreInput = modal.querySelector('#endorseScore');
    const scoreVal   = modal.querySelector('#endorseScoreValue');
    scoreInput.value = 5;
    scoreVal.textContent = 5;
    modal.querySelector('#endorseComment').value = '';
    modal.classList.add('active');

    scoreInput.oninput = () => { scoreVal.textContent = scoreInput.value; };
}

export async function submitEndorse() {
    if (!_pendingEndorse) return;
    const modal = document.getElementById('modalEndorse');
    const score   = parseInt(modal.querySelector('#endorseScore').value, 10);
    const comment = modal.querySelector('#endorseComment').value.trim() || null;
    const btn = document.getElementById('btnSubmitEndorse');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando…';
    try {
        await endorseSkill(_pendingEndorse.userId, _pendingEndorse.skillId, score, comment);
        modal.classList.remove('active');
        _pendingEndorse = null;
    } catch (err) {
        alert('Error al endorsar: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-star"></i> Endorsar';
    }
}

function _scoreLevel(score) {
    if (score == null) return 'none';
    if (score >= 8) return 'high';
    if (score >= 5) return 'mid';
    return 'low';
}

function _initials(name) {
    return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function _esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
