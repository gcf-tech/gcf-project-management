/**
 * Mock data for dashboard visualization while backend is unavailable.
 * Set USE_MOCK = false once the API is connected.
 *
 * Data shapes mirror the expected backend responses so the switch is seamless.
 */

export const USE_MOCK = true;

export const MOCK_TEAMS = [
    { id: 'tech',      name: 'Tech' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'ventas',    name: 'Ventas' },
];

export const MOCK_MEMBERS = [
    { userId: 'u1', displayname: 'Ana Silva',      jobTitle: 'Frontend Dev',         teamId: 'tech' },
    { userId: 'u2', displayname: 'Carlos Ruiz',    jobTitle: 'Backend Dev',          teamId: 'tech' },
    { userId: 'u3', displayname: 'Laura Gómez',    jobTitle: 'Content Manager',      teamId: 'marketing' },
    { userId: 'u4', displayname: 'Pedro Díaz',     jobTitle: 'Social Media',         teamId: 'marketing' },
    { userId: 'u5', displayname: 'Sofía Vega',     jobTitle: 'Ejecutiva de Ventas',  teamId: 'ventas' },
    { userId: 'u6', displayname: 'Diego Torres',   jobTitle: 'Full Stack Dev',       teamId: 'tech' },
];

export const MOCK_METRICS = {
    u1: { completedTasks: 45, onTimeRate: 95, performance: 12, hoursWorked: 160, effectivenessIndex: 8.5, avgDifficulty: 3.2 },
    u2: { completedTasks: 38, onTimeRate: 78, performance: 10, hoursWorked: 150, effectivenessIndex: 7.8, avgDifficulty: 4.1 },
    u3: { completedTasks: 52, onTimeRate: 98, performance: 14, hoursWorked: 155, effectivenessIndex: 9.1, avgDifficulty: 2.5 },
    u4: { completedTasks: 30, onTimeRate: 72, performance: 8,  hoursWorked: 140, effectivenessIndex: 6.5, avgDifficulty: 2.8 },
    u5: { completedTasks: 60, onTimeRate: 92, performance: 15, hoursWorked: 165, effectivenessIndex: 8.8, avgDifficulty: 2.1 },
    u6: { completedTasks: 42, onTimeRate: 88, performance: 11, hoursWorked: 148, effectivenessIndex: 8.0, avgDifficulty: 3.8 },
};

export const MOCK_TREND_DATA = [
    { month: 'Ene', Tech: 40, Marketing: 30, Ventas: 50 },
    { month: 'Feb', Tech: 45, Marketing: 35, Ventas: 48 },
    { month: 'Mar', Tech: 55, Marketing: 40, Ventas: 60 },
    { month: 'Abr', Tech: 50, Marketing: 45, Ventas: 55 },
    { month: 'May', Tech: 62, Marketing: 50, Ventas: 58 },
    { month: 'Jun', Tech: 58, Marketing: 48, Ventas: 65 },
];

export const MOCK_STATUS_DATA = {
    Completadas:  120,
    'En Progreso': 45,
    Retrasadas:    15,
    Bloqueadas:    10,
};

// ─── MyMetrics mock data ────────────────────────────────────────────────────

export const MOCK_MY_METRICS = {
    completedTasks: 45,
    totalTasks:     52,
    completionRate: 86.5,
    hoursWorked:    148.5,
    iel:            92,
    slaAvgDays:     4.2,
    teamPercentile: 78,
    tasksByMonth: [
        { month: 'Ene', count: 6 },
        { month: 'Feb', count: 8 },
        { month: 'Mar', count: 10 },
        { month: 'Abr', count: 7 },
        { month: 'May', count: 9 },
        { month: 'Jun', count: 5 },
    ],
    predictabilityByTask: [
        { title: 'Rediseño dashboard', estimated: 8,  actual: 10 },
        { title: 'API integración',    estimated: 12, actual: 11 },
        { title: 'Testing E2E',        estimated: 6,  actual: 9  },
        { title: 'Deploy staging',     estimated: 3,  actual: 3  },
        { title: 'Code review',        estimated: 4,  actual: 5  },
    ],
    deepWorkByDay: {
        Lun: 7, Mar: 5, Mié: 8, Jue: 6, Vie: 4,
    },
    tasksByCategory: [
        { name: 'Frontend',  value: 18 },
        { name: 'Backend',   value: 12 },
        { name: 'Reuniones', value: 8  },
        { name: 'Testing',   value: 7  },
    ],
    difficultTasks: [
        { title: 'Migración auth a OAuth2', difficulty: 9, reason: 'Integración compleja con Nextcloud' },
        { title: 'Optimización queries',    difficulty: 7, reason: 'Queries lentas en producción' },
    ],
    skills: [],  // radar comes from MOCK_MY_SKILLS
};

// ─── Skills mock data ───────────────────────────────────────────────────────

export const MOCK_SKILLS = [
    { id: 's1', name: 'JavaScript',   category: 'Frontend' },
    { id: 's2', name: 'React',        category: 'Frontend' },
    { id: 's3', name: 'Node.js',      category: 'Backend'  },
    { id: 's4', name: 'Python',       category: 'Backend'  },
    { id: 's5', name: 'CSS / Design', category: 'Frontend' },
    { id: 's6', name: 'SQL',          category: 'Backend'  },
    { id: 's7', name: 'Git / DevOps', category: 'DevOps'   },
    { id: 's8', name: 'Comunicación', category: 'Soft'     },
];

// My skills (logged-in user = u1, Ana Silva)
export const MOCK_MY_SKILLS = [
    { skillId: 's1', score: 9, endorsements: [{ score: 8, comment: 'Muy sólida' }, { score: 9 }] },
    { skillId: 's2', score: 8, endorsements: [{ score: 7 }] },
    { skillId: 's3', score: 5, endorsements: [] },
    { skillId: 's4', score: 4, endorsements: [] },
    { skillId: 's5', score: 8, endorsements: [{ score: 9, comment: '¡Excelente ojo para el diseño!' }] },
    { skillId: 's6', score: 6, endorsements: [] },
    { skillId: 's7', score: 7, endorsements: [{ score: 7 }] },
    { skillId: 's8', score: 8, endorsements: [{ score: 8 }, { score: 9 }] },
];

// Radar: me vs team average (scores 1-10)
export const MOCK_RADAR = {
    labels:   ['JavaScript', 'React', 'Node.js', 'Python', 'CSS', 'SQL', 'Git', 'Comunicación'],
    myScores: [9, 8, 5, 4, 8, 6, 7, 8],
    teamAvg:  [7, 6, 7, 6, 5, 7, 8, 7],
};

// Team skills comparison (all tech members)
export const MOCK_SKILLS_COMPARISON = {
    skills: MOCK_SKILLS,
    members: [
        {
            userId: 'u1', displayname: 'Ana Silva',
            skills: {
                s1: { score: 9 }, s2: { score: 8 }, s3: { score: 5 }, s4: { score: 4 },
                s5: { score: 8 }, s6: { score: 6 }, s7: { score: 7 }, s8: { score: 8 },
            },
        },
        {
            userId: 'u2', displayname: 'Carlos Ruiz',
            skills: {
                s1: { score: 7 }, s2: { score: 5 }, s3: { score: 9 }, s4: { score: 8 },
                s5: { score: 4 }, s6: { score: 8 }, s7: { score: 8 }, s8: { score: 6 },
            },
        },
        {
            userId: 'u6', displayname: 'Diego Torres',
            skills: {
                s1: { score: 8 }, s2: { score: 7 }, s3: { score: 8 }, s4: { score: 6 },
                s5: { score: 6 }, s6: { score: 7 }, s7: { score: 9 }, s8: { score: 7 },
            },
        },
    ],
};

// Hours per day per member (capacity heatmap)
export const MOCK_CAPACITY = {
    u1: { Lun: 8, Mar: 7, Mié: 9, Jue: 6, Vie: 5 },
    u2: { Lun: 6, Mar: 8, Mié: 5, Jue: 9, Vie: 7 },
    u3: { Lun: 4, Mar: 5, Mié: 6, Jue: 8, Vie: 7 },
    u4: { Lun: 9, Mar: 8, Mié: 7, Jue: 6, Vie: 5 },
    u5: { Lun: 7, Mar: 6, Mié: 8, Jue: 7, Vie: 9 },
    u6: { Lun: 5, Mar: 9, Mié: 8, Jue: 7, Vie: 6 },
};
