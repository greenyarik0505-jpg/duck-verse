/**
 * Duck Academy — Engineering Governance, Learning Roadmap & Tech Radar (SCRUM-70)
 * 
 * Rules and models for long-term engineering growth:
 * - Quarterly roadmap, themes, dependencies and team capacity
 * - Risk register with probability, impact, owner, and mitigation
 * - Tech radar for tools, patterns, and deprecations (Adopt, Trial, Assess, Hold)
 * - Graduation gates & unified rubric for 3 team members / learners
 * - Workload fairness & story points distribution
 */

export const TEAM_MEMBERS = Object.freeze({
  YARIK: {
    id: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    name: 'Yarik0505',
    email: 'greenyarik0505@gmail.com',
    role: 'Team Lead & Core Architect',
    focus: ['Next.js App Router', 'UI/UX Hub', 'Deployments & Governance', 'Design System'],
    maxCapacitySp: 50
  },
  DMYTRO: {
    id: '712020:78105bfe-a055-429c-b519-d1b35998b9af',
    name: 'Степаненко Дмитро',
    email: 'stepanenko.d@duckverse.dev',
    role: 'Physics & Gameplay Lead',
    focus: ['Cube Physics & Hitboxes', 'Obstacles & Level Mechanics', 'Arcade Engines (Flappy)', 'Collision Testing'],
    maxCapacitySp: 50
  },
  KYRYL: {
    id: '712020:23aa804c-99cb-4863-9cda-ee2bfa879882',
    name: 'Кирил Пушкарук',
    email: 'pushkaruk.k@duckverse.dev',
    role: 'Audio, Backend & Security Lead',
    focus: ['Web Audio API (130 BPM)', 'Security & Anti-abuse', 'Neon Hacker Puzzle', 'APIs & Data Integrity'],
    maxCapacitySp: 50
  }
});

export const QUARTERLY_ROADMAP = Object.freeze([
  {
    quarter: 'Q1',
    year: 2026,
    theme: 'Core Engine, Hub Architecture & Vercel Launch',
    status: 'COMPLETED',
    allocatedSp: 110,
    milestones: [
      { id: 'M-1.1', title: 'Next.js 15 Hub Setup with Tailwind CSS', owner: 'Yarik0505', completed: true },
      { id: 'M-1.2', title: 'Geometry Dash Neon Physics (60 FPS, Jump & Gravity)', owner: 'Степаненко Дмитро', completed: true },
      { id: 'M-1.3', title: '130 BPM Synthesizer Audio Engine', owner: 'Кирил Пушкарук', completed: true },
      { id: 'M-1.4', title: 'Production Vercel Deployment & Live Badge', owner: 'Степаненко Дмитро', completed: true }
    ]
  },
  {
    quarter: 'Q2',
    year: 2026,
    theme: 'Academy Curriculum L0-L4 & Player Identity',
    status: 'IN_PROGRESS',
    allocatedSp: 115,
    milestones: [
      { id: 'M-2.1', title: 'Curriculum DAG Registry & Validation (L0-L4)', owner: 'Yarik0505', completed: true },
      { id: 'M-2.2', title: 'Auth, Sessions & COPPA Parental Consent', owner: 'Кирил Пушкарук', completed: true },
      { id: 'M-2.3', title: 'Scores Storage & Anti-Abuse Rate Limiting', owner: 'Кирил Пушкарук', completed: true },
      { id: 'M-2.4', title: 'Flappy Duck & Invaders Game Contract Compliance', owner: 'Степаненко Дмитро', completed: false }
    ]
  },
  {
    quarter: 'Q3',
    year: 2026,
    theme: 'Advanced Labs (L5-L7), SLO Observability & Mentorship',
    status: 'PLANNED',
    allocatedSp: 120,
    milestones: [
      { id: 'M-3.1', title: 'Architecture Decision Records (ADRs) & Reviews', owner: 'Yarik0505', completed: true },
      { id: 'M-3.2', title: 'Physics Engine Optimization & Canvas 60 FPS', owner: 'Степаненко Дмитро', completed: false },
      { id: 'M-3.3', title: 'Mentor Code Review Rubric & Dashboard', owner: 'Yarik0505', completed: true },
      { id: 'M-3.4', title: 'Security & Dependency Audit Lab', owner: 'Кирил Пушкарук', completed: false }
    ]
  },
  {
    quarter: 'Q4',
    year: 2026,
    theme: 'Senior Labs (L8-L9), Chaos Engineering & Graduation Release',
    status: 'PLANNED',
    allocatedSp: 120,
    milestones: [
      { id: 'M-4.1', title: 'Engineering Governance & Multi-Year Roadmap', owner: 'Yarik0505', completed: true },
      { id: 'M-4.2', title: 'Multi-level Obstacles & Hitbox Regression Suite', owner: 'Степаненко Дмитро', completed: false },
      { id: 'M-4.3', title: 'Load Testing & Resilience Chaos Day', owner: 'Кирил Пушкарук', completed: false },
      { id: 'M-4.4', title: 'Capstone Verification & Final Graduation Release', owner: 'Кирил Пушкарук', completed: true }
    ]
  }
]);

export const RISK_REGISTER = Object.freeze([
  {
    id: 'RISK-001',
    title: 'Client-side DOM Wipeout / React Virtual DOM Crash',
    category: 'Architecture',
    probability: 'MEDIUM',
    impact: 'CRITICAL',
    score: 12,
    owner: 'Yarik0505',
    mitigation: 'Strict prohibition of innerHTML = "" in AGENTS.md; declarative JSX rendering and replaceChildren() cleanup.',
    status: 'MITIGATED'
  },
  {
    id: 'RISK-002',
    title: 'Secret Credential Leakage in Client Bundles or Tests',
    category: 'Security',
    probability: 'LOW',
    impact: 'CRITICAL',
    score: 8,
    owner: 'Кирил Пушкарук',
    mitigation: 'Environment Doctor audits, .env in .gitignore, zero secrets in client builds, automated token rotation.',
    status: 'MONITORING'
  },
  {
    id: 'RISK-003',
    title: 'Direct Push to Main / Broken Production Branch',
    category: 'Process',
    probability: 'MEDIUM',
    impact: 'HIGH',
    score: 9,
    owner: 'Yarik0505',
    mitigation: 'Protected main branch with minimum 2 approving reviews, GitHub Actions CI blocking regressions.',
    status: 'MITIGATED'
  },
  {
    id: 'RISK-004',
    title: 'Flaky Physics / Frame Drop below 60 FPS on Mobile',
    category: 'Performance',
    probability: 'MEDIUM',
    impact: 'HIGH',
    score: 9,
    owner: 'Степаненко Дмитро',
    mitigation: 'Time-delta physics step, requestAnimationFrame clamp, FPS counter HUD, canvas responsive downsampling.',
    status: 'MONITORING'
  },
  {
    id: 'RISK-005',
    title: 'Under-13 Learner Privacy Violation (COPPA/GDPR-K Non-compliance)',
    category: 'Compliance',
    probability: 'LOW',
    impact: 'CRITICAL',
    score: 8,
    owner: 'Yarik0505',
    mitigation: 'Mandatory parental consent checkbox for age < 13, zero PII storage, HMAC guest tokens.',
    status: 'MITIGATED'
  }
]);

export const TECH_RADAR = Object.freeze({
  ADOPT: [
    { name: 'Next.js 15 (App Router)', quadrant: 'Languages & Frameworks', rationale: 'Server Components, dynamic routes, fast serverless response' },
    { name: 'React 19', quadrant: 'Languages & Frameworks', rationale: 'Modern concurrent features, declarative hooks' },
    { name: 'Tailwind CSS 3', quadrant: 'Languages & Frameworks', rationale: 'Utility-first cyberpunk styling without bundle bloat' },
    { name: 'Node.js Native Test Runner (node:test)', quadrant: 'Tools', rationale: 'Zero-dependency instant test execution (<200ms for entire suite)' },
    { name: 'ESLint CLI', quadrant: 'Tools', rationale: 'Direct static linting without interactive prompts or Next 16 deprecation warnings' },
    { name: 'Web Audio API', quadrant: 'Platforms', rationale: 'Synthesized 130 BPM low-latency audio without external audio asset bandwidth' },
    { name: 'HTML5 Canvas 2D', quadrant: 'Platforms', rationale: 'Deterministic 60 FPS rendering for arcade physics' }
  ],
  TRIAL: [
    { name: 'Vercel KV / Upstash Redis', quadrant: 'Platforms', rationale: 'Distributed persistent leaderboard storage with fallback' },
    { name: 'Web Vitals Telemetry', quadrant: 'Techniques', rationale: 'Privacy-first performance metrics (LCP, INP, CLS)' },
    { name: 'HMAC-SHA256 Signed Tokens', quadrant: 'Techniques', rationale: 'Stateless anti-tampering verification for certificates and guest progress' }
  ],
  ASSESS: [
    { name: 'Playwright E2E Test Matrix', quadrant: 'Tools', rationale: 'Headless multi-browser testing across Chrome, Firefox, and WebKit' },
    { name: 'WebAssembly (Wasm) Physics Engine', quadrant: 'Languages & Frameworks', rationale: 'Evaluation for ultra-complex projectile math in Galactic Invaders' }
  ],
  HOLD: [
    { name: 'innerHTML = "" in React Containers', quadrant: 'Techniques', rationale: 'Forbidden: breaks React virtual DOM hierarchy causing fatal crash' },
    { name: 'Direct Git Push to main', quadrant: 'Techniques', rationale: 'Forbidden: all changes must flow through Jira-tagged Pull Requests' },
    { name: 'Raw console.error with User PII', quadrant: 'Techniques', rationale: 'Forbidden: violates COPPA and clean audit logging' }
  ]
});

export const GRADUATION_GATES = Object.freeze({
  MINIMUM_PASSING_SCORE: 80, // percentage
  MAX_SCORE_PER_DIMENSION: 5,
  DIMENSIONS: [
    { key: 'architecture', name: 'Architecture & Clean Boundaries', weight: 0.20 },
    { key: 'testing', name: 'Automated Tests & Regression Proof', weight: 0.25 },
    { key: 'security', name: 'Security, Privacy & Zero PII', weight: 0.20 },
    { key: 'performance', name: '60 FPS & Responsive Budgets', weight: 0.15 },
    { key: 'documentation', name: 'ADRs & Technical Writing', weight: 0.10 },
    { key: 'teamwork', name: 'Jira/PR Collaboration & Git Hygiene', weight: 0.10 }
  ],
  PASSING_LEVELS: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']
});

/**
 * Calculates workload fairness and story points distribution across team members.
 */
export function calculateWorkloadFairness(tasks = []) {
  const memberStats = {
    'Yarik0505': { totalTasks: 0, completedTasks: 0, totalSp: 0, levels: new Set() },
    'Степаненко Дмитро': { totalTasks: 0, completedTasks: 0, totalSp: 0, levels: new Set() },
    'Кирил Пушкарук': { totalTasks: 0, completedTasks: 0, totalSp: 0, levels: new Set() }
  };

  // If no external tasks passed, calculate based on quarterly roadmap
  QUARTERLY_ROADMAP.forEach(q => {
    q.milestones.forEach(m => {
      const owner = m.owner || 'Yarik0505';
      if (!memberStats[owner]) {
        memberStats[owner] = { totalTasks: 0, completedTasks: 0, totalSp: 0, levels: new Set() };
      }
      memberStats[owner].totalTasks += 1;
      if (m.completed) memberStats[owner].completedTasks += 1;
      memberStats[owner].totalSp += Math.round(q.allocatedSp / q.milestones.length);
    });
  });

  const membersArray = Object.entries(memberStats).map(([name, data]) => {
    const config = Object.values(TEAM_MEMBERS).find(m => m.name === name) || { maxCapacitySp: 40 };
    return {
      name,
      role: config.role,
      totalTasks: data.totalTasks,
      completedTasks: data.completedTasks,
      completionRate: data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0,
      assignedSp: data.totalSp,
      capacitySp: config.maxCapacitySp,
      isOverloaded: data.totalSp > config.maxCapacitySp * 4 // over 4 quarters
    };
  });

  const totalAssignedSp = membersArray.reduce((acc, m) => acc + m.assignedSp, 0);
  const fairAverageSp = Math.round(totalAssignedSp / membersArray.length);

  return {
    members: membersArray,
    totalAssignedSp,
    fairAverageSp,
    isFairlyDistributed: membersArray.every(m => Math.abs(m.assignedSp - fairAverageSp) <= 45),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Triages a new proposed task against engineering governance rules.
 */
export function triageNewTask(task) {
  const errors = [];
  if (!task || typeof task !== 'object') {
    return { valid: false, errors: ['Task payload must be a non-empty object'] };
  }

  if (!task.title || typeof task.title !== 'string' || task.title.trim().length < 5) {
    errors.push('Task title must be at least 5 characters');
  }

  if (!task.owner || !Object.values(TEAM_MEMBERS).some(m => m.name === task.owner || m.id === task.owner)) {
    errors.push('Task owner must be one of the registered team members (Yarik0505, Степаненко Дмитро, Кирил Пушкарук)');
  }

  if (!task.level || !GRADUATION_GATES.PASSING_LEVELS.includes(task.level)) {
    errors.push(`Task level must be one of: ${GRADUATION_GATES.PASSING_LEVELS.join(', ')}`);
  }

  if (typeof task.storyPoints !== 'number' || task.storyPoints <= 0 || task.storyPoints > 21) {
    errors.push('Task storyPoints must be a Fibonacci number between 1 and 21');
  }

  if (!task.acceptanceCriteria || !Array.isArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
    errors.push('Task must contain at least one verifiable acceptance criterion');
  }

  return {
    valid: errors.length === 0,
    errors,
    triagedTask: errors.length === 0 ? {
      ...task,
      triageStatus: 'ACCEPTED',
      triagedAt: new Date().toISOString()
    } : null
  };
}

/**
 * Validates the entire Governance Model integrity.
 */
export function validateGovernanceModel() {
  const issues = [];

  if (!Array.isArray(QUARTERLY_ROADMAP) || QUARTERLY_ROADMAP.length !== 4) {
    issues.push('Quarterly roadmap must cover 4 quarters (Q1-Q4)');
  }

  if (!Array.isArray(RISK_REGISTER) || RISK_REGISTER.length === 0) {
    issues.push('Risk register must contain at least one risk entry');
  }

  RISK_REGISTER.forEach(r => {
    if (!r.id || !r.title || !r.mitigation || !r.owner) {
      issues.push(`Risk item ${r.id || 'unknown'} is missing required metadata`);
    }
  });

  const radarRings = ['ADOPT', 'TRIAL', 'ASSESS', 'HOLD'];
  radarRings.forEach(ring => {
    if (!TECH_RADAR[ring] || !Array.isArray(TECH_RADAR[ring])) {
      issues.push(`Tech Radar missing ring category: ${ring}`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    summary: {
      quarters: QUARTERLY_ROADMAP.length,
      risks: RISK_REGISTER.length,
      techRadarItems: Object.values(TECH_RADAR).flat().length,
      teamMembers: Object.keys(TEAM_MEMBERS).length
    }
  };
}
