// ─── STRUCTURE ACADÉMIQUE ────────────────────────────────────
// L1 → S1/S2 | L2 → S3/S4 | L3 → S5/S6

export const FACULTIES = [
  {
    id: 'fac-sci',
    name: 'Faculté des Sciences',
    icon: 'fa-flask',
    sub: 'Informatique, Maths, Physique',
  },
  {
    id: 'fac-dro',
    name: 'Faculté de Droit',
    icon: 'fa-scale-balanced',
    sub: 'Droit civil, Droit des affaires',
  },
  {
    id: 'fac-med',
    name: 'Faculté de Médecine',
    icon: 'fa-stethoscope',
    sub: 'Médecine générale, Pharmacie',
  },
  {
    id: 'fac-com',
    name: 'École de Commerce',
    icon: 'fa-briefcase',
    sub: 'Finance, Marketing, RH',
  },
  {
    id: 'fac-let',
    name: 'Faculté des Lettres',
    icon: 'fa-book',
    sub: 'Philosophie, Langues, Histoire',
  },
];

export const PROGRAMS: Record<string, any[]> = {
  'fac-sci': [
    { id: 'prog-info', name: 'Informatique', icon: 'fa-laptop-code' },
    { id: 'prog-math', name: 'Mathématiques', icon: 'fa-square-root-variable' },
    { id: 'prog-phys', name: 'Physique-Chimie', icon: 'fa-atom' },
  ],
  'fac-dro': [
    { id: 'prog-dci', name: 'Droit civil', icon: 'fa-gavel' },
    { id: 'prog-daff', name: 'Droit des affaires', icon: 'fa-handshake' },
  ],
  'fac-med': [
    { id: 'prog-mgen', name: 'Médecine générale', icon: 'fa-heart-pulse' },
    { id: 'prog-phar', name: 'Pharmacie', icon: 'fa-pills' },
  ],
  'fac-com': [
    { id: 'prog-fin', name: 'Finance', icon: 'fa-chart-line' },
    { id: 'prog-mkt', name: 'Marketing', icon: 'fa-bullhorn' },
  ],
  'fac-let': [
    { id: 'prog-phi', name: 'Philosophie', icon: 'fa-brain' },
    { id: 'prog-ang', name: 'Anglais', icon: 'fa-language' },
  ],
};

export const LEVELS = [
  { id: 'L1', name: 'Licence 1', sub: 'Semestres 1 et 2' },
  { id: 'L2', name: 'Licence 2', sub: 'Semestres 3 et 4' },
  { id: 'L3', name: 'Licence 3', sub: 'Semestres 5 et 6' },
];

export const SEMESTERS_BY_LEVEL: Record<string, any[]> = {
  L1: [
    { id: 'S1', num: 1, label: 'Semestre 1', range: 'Oct → Jan' },
    { id: 'S2', num: 2, label: 'Semestre 2', range: 'Fév → Juin' },
  ],
  L2: [
    { id: 'S3', num: 3, label: 'Semestre 3', range: 'Oct → Jan' },
    { id: 'S4', num: 4, label: 'Semestre 4', range: 'Fév → Juin' },
  ],
  L3: [
    { id: 'S5', num: 5, label: 'Semestre 5', range: 'Oct → Jan' },
    { id: 'S6', num: 6, label: 'Semestre 6', range: 'Fév → Juin' },
  ],
};

export const SUBJECTS: Record<string, any[]> = {
  'prog-info_S3': [
    {
      id: 'sub-algo',
      name: 'Algorithmique',
      icon: 'fa-diagram-project',
      questionCount: 240,
    },
    {
      id: 'sub-math',
      name: 'Mathématiques discrètes',
      icon: 'fa-infinity',
      questionCount: 185,
    },
    {
      id: 'sub-so',
      name: "Systèmes d'exploitation",
      icon: 'fa-gears',
      questionCount: 160,
    },
    {
      id: 'sub-res',
      name: 'Réseaux informatiques',
      icon: 'fa-network-wired',
      questionCount: 120,
    },
  ],
  'prog-info_S4': [
    {
      id: 'sub-bdd',
      name: 'Bases de données',
      icon: 'fa-database',
      questionCount: 200,
    },
    {
      id: 'sub-web',
      name: 'Développement web',
      icon: 'fa-globe',
      questionCount: 150,
    },
  ],
};

export const QUESTIONS: Record<string, any[]> = {
  'sub-algo': [
    {
      id: 'q1',
      subjectId: 'sub-algo',
      text: 'Quelle est la complexité dans le pire cas du tri rapide (Quicksort) ?',
      options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
      correct: 1,
      explanation:
        'Dans le pire cas (tableau déjà trié, mauvais pivot), Quicksort effectue n² comparaisons.',
      source: 'course',
    },
    {
      id: 'q2',
      subjectId: 'sub-algo',
      text: 'Quelle structure de données utilise le principe LIFO ?',
      options: [
        'File (Queue)',
        'Liste chaînée',
        'Pile (Stack)',
        'Arbre binaire',
      ],
      correct: 2,
      explanation:
        'La pile suit le principe LIFO : dernier entré, premier sorti.',
      source: 'course',
    },
    {
      id: 'q3',
      subjectId: 'sub-algo',
      text: 'La recherche dichotomique nécessite que le tableau soit :',
      options: [
        'Trié',
        'De taille paire',
        'Sans doublons',
        'Alloué dynamiquement',
      ],
      correct: 0,
      explanation:
        "La recherche binaire divise l'espace de recherche en deux — possible seulement sur un tableau trié.",
      source: 'exam',
    },
    {
      id: 'q4',
      subjectId: 'sub-algo',
      text: "Complexité spatiale d'un algorithme récursif de profondeur n ?",
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      correct: 2,
      explanation:
        "Chaque appel récursif empile un cadre. Pour une profondeur n → O(n) d'espace mémoire.",
      source: 'course',
    },
    {
      id: 'q5',
      subjectId: 'sub-algo',
      text: 'Quel tri a une complexité O(n log n) dans tous les cas ?',
      options: [
        'Tri à bulles',
        'Tri par insertion',
        'Tri fusion (Merge Sort)',
        'Tri rapide',
      ],
      correct: 2,
      explanation:
        'Le tri fusion garantit O(n log n) dans tous les cas grâce à sa stratégie diviser-pour-régner.',
      source: 'course',
    },
  ],
  'sub-math': [
    {
      id: 'qm1',
      subjectId: 'sub-math',
      text: 'Combien y a-t-il de sommets dans un graphe complet K₅ ?',
      options: ['4', '5', '10', '20'],
      correct: 1,
      explanation: 'Kₙ est un graphe complet à n sommets. K₅ a donc 5 sommets.',
      source: 'course',
    },
  ],
};

export const DEMO_USER = {
  id: 'user-001',
  name: 'Aliou Konaté',
  initials: 'AK',
  email: 'aliou.konate@etud.uac.bj',
  faculty: 'Faculté des Sciences',
  program: 'Informatique',
  level: 'L2',
  semester: 'S3',
  stats: {
    averageScore: 14.2,
    totalQuizzes: 47,
    successRate: 71,
    streakDays: 5,
    streakHistory: [true, true, true, true, true, false, false],
  },
};

export const DEMO_HISTORY = [
  {
    id: 'h1',
    subject: 'Algorithmique',
    icon: 'fa-diagram-project',
    date: "Aujourd'hui",
    questions: 20,
    score: 16,
  },
  {
    id: 'h2',
    subject: "Systèmes d'exploitation",
    icon: 'fa-gears',
    date: 'Hier',
    questions: 20,
    score: 11,
  },
  {
    id: 'h3',
    subject: 'Mathématiques discrètes',
    icon: 'fa-infinity',
    date: 'Mer.',
    questions: 20,
    score: 18,
  },
  {
    id: 'h4',
    subject: 'Réseaux informatiques',
    icon: 'fa-network-wired',
    date: 'Mar.',
    questions: 20,
    score: 8,
  },
];

export const DEMO_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'Nouveaux examens Algorithmique 2024 disponibles',
    source: 'Faculté des Sciences',
    time: 'Il y a 2h',
    color: 'blue',
  },
  {
    id: 'a2',
    title: 'Résultats partiels session 1 publiés',
    source: 'Scolarité',
    time: 'Hier',
    color: 'green',
  },
  {
    id: 'a3',
    title: 'Maintenance prévue samedi de 2h à 4h du matin',
    source: 'Administration',
    time: 'Il y a 3j',
    color: 'amber',
  },
];

export const DEMO_LEADERBOARD: Record<string, any[]> = {
  'sub-algo': [
    { rank: 1, name: 'Oumar D.', initials: 'OD', avgScore: 19.1, quizCount: 8 },
    {
      rank: 2,
      name: 'Mariama K.',
      initials: 'MK',
      avgScore: 17.8,
      quizCount: 6,
    },
    { rank: 3, name: 'Fatou L.', initials: 'FL', avgScore: 16.5, quizCount: 5 },
    {
      rank: 4,
      name: 'Aliou K.',
      initials: 'AK',
      avgScore: 14.2,
      quizCount: 5,
      isMe: true,
    },
    {
      rank: 5,
      name: 'Ibrahim S.',
      initials: 'IS',
      avgScore: 13.8,
      quizCount: 3,
    },
    {
      rank: 6,
      name: 'Aissatou C.',
      initials: 'AC',
      avgScore: 13.1,
      quizCount: 7,
    },
    {
      rank: 7,
      name: 'Moussa B.',
      initials: 'MB',
      avgScore: 12.5,
      quizCount: 2,
    },
  ],
  'sub-math': [
    {
      rank: 1,
      name: 'Mariama K.',
      initials: 'MK',
      avgScore: 18.2,
      quizCount: 4,
    },
    {
      rank: 2,
      name: 'Aliou K.',
      initials: 'AK',
      avgScore: 15.5,
      quizCount: 3,
      isMe: true,
    },
    {
      rank: 3,
      name: 'Ibrahim S.',
      initials: 'IS',
      avgScore: 14.0,
      quizCount: 5,
    },
  ],
};

export const ADMIN_USERS = [
  {
    id: 'u1',
    name: 'Aliou Konaté',
    initials: 'AK',
    email: 'aliou@etud.uac.bj',
    program: 'Informatique',
    level: 'L2',
    joinDate: '12 jan. 2026',
    lastActive: "Aujourd'hui",
    status: 'active',
  },
  {
    id: 'u2',
    name: 'Mariama Kouyaté',
    initials: 'MK',
    email: 'm.kouyate@etud.uac.bj',
    program: 'Informatique',
    level: 'L2',
    joinDate: '08 jan. 2026',
    lastActive: 'Hier',
    status: 'active',
  },
  {
    id: 'u3',
    name: 'Oumar Diallo',
    initials: 'OD',
    email: 'o.diallo@etud.uac.bj',
    program: 'Informatique',
    level: 'L2',
    joinDate: '03 jan. 2026',
    lastActive: 'Il y a 2j',
    status: 'active',
  },
  {
    id: 'u4',
    name: 'Binta Soumaré',
    initials: 'BS',
    email: 'b.soumare@etud.uac.bj',
    program: 'Droit',
    level: 'L1',
    joinDate: '15 déc. 2025',
    lastActive: 'Il y a 5j',
    status: 'suspended',
  },
  {
    id: 'u5',
    name: 'Kofi Tetteh',
    initials: 'KT',
    email: 'k.tetteh@etud.uac.bj',
    program: 'Commerce',
    level: 'L3',
    joinDate: '02 nov. 2025',
    lastActive: 'Il y a 30j',
    status: 'blocked',
  },
  {
    id: 'u6',
    name: 'Fatoumata Ndiaye',
    initials: 'FN',
    email: 'f.ndiaye@etud.uac.bj',
    program: 'Médecine',
    level: 'L1',
    joinDate: '20 jan. 2026',
    lastActive: "Aujourd'hui",
    status: 'active',
  },
];

export const QUIZ_CONFIG = {
  questionsPerQuiz: 20,
  timerPerQuestion: 30,
  timerWarning: 15,
  timerDanger: 8,
};
