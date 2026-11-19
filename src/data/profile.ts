// Single source of truth. Every fact on the site comes from this file.
// All numbers are taken from Rahil's resumes - nothing here is invented.

export const identity = {
  name: 'Netipattu Rahil',
  short: 'Rahil',
  role: 'Flutter + Backend Engineer',
  service: 'netipattu-rahil',
  region: 'gwalior, IN',
  build: "B.Tech CSE '27 @ ABV-IIITM",
  status: 'open to SWE roles',
  email: 'netipatturahil@gmail.com',
  photo: '/rahil.webp',
  resume: '/Netipattu_Rahil_Resume.pdf',
  links: {
    github: 'https://github.com/nrahil',
    linkedin: 'https://linkedin.com/in/netipattu-rahil-6477b729a',
    leetcode: 'https://leetcode.com/u/nrahil',
  },
}

export const education = {
  school: 'Atal Bihari Vajpayee Indian Institute of Information Technology and Management, Gwalior',
  shortSchool: 'ABV-IIITM Gwalior',
  degree: 'B.Tech in Computer Science',
  cgpa: '7.88 / 10',
  from: '2023-08',
  to: '2027-06',
  coursework: ['Data Structures & Algorithms', 'Operating Systems', 'Computer Networks', 'DBMS', 'Distributed Systems', 'OOP', 'Probability & Statistics'],
}

export const stats = [
  { value: 800, suffix: '+', label: 'DSA problems solved', note: 'across platforms' },
  { value: 1925, suffix: '', label: 'LeetCode rating', note: 'Knight · top 1.96% globally' },
  { value: 99.17, suffix: '', decimals: 2, label: 'JEE Main percentile', note: 'AIR 9,833' },
  { value: 5, suffix: '', label: 'systems built', note: 'storage · payments · mobile · AI · OOD' },
]

export type Experience = {
  id: string
  org: string
  orgNote?: string
  role: string
  from: string // YYYY-MM
  to: string
  stack: string[]
  points: string[]
}

export const experience: Experience[] = [
  {
    id: 'coinsanchay',
    org: 'CoinSanchay',
    orgNote: 'Meshram Advisors',
    role: 'Software Engineering Intern',
    from: '2026-04',
    to: '2026-07',
    stack: ['Flutter', 'Firebase', 'Node.js', 'Cloud Functions', 'Binance API', 'CoinGecko', 'Razorpay', 'OpenAI API', 'PDFKit'],
    points: [
      'Architected the entire cross-platform VDA fund-management app in Flutter - 188 Dart files, 59 backend services - with reactive RTDB stream syncing for live portfolio tracking, biometric session timeouts and real-time FCM push alerts.',
      'Built an automated trading & rebalancing engine on the Binance API: twice-daily cron jobs (9 AM / 9 PM) scan for >5% portfolio drift across batches of 10 concurrent users, with 12-hour alert cooldowns.',
      'Secured exchange API keys with AES-256-CBC (16-byte IVs); automated Razorpay subscription billing with idempotent payment handling and atomic 1-credit deduction gates.',
      'Engineered a PDFKit pipeline that generates 5-section branded financial statements.',
      'Deployed a GPT-4o / GPT-4o-mini multimodal chart-analysis pipeline on Cloud Functions v2: 5-phase prompt chain (temp 0, 6K token budget), 3-tier retries with 1.5s backoff, <4MB in-memory guardrails, parsing 10+ indicators into validated JSON.',
    ],
  },
  {
    id: 'worldquant',
    org: 'WorldQuant BRAIN',
    role: 'Quantitative Researcher (Expert)',
    from: '2025-12',
    to: '2026-08',
    stack: ['Statistics', 'Backtesting', 'Alpha research', 'Financial data'],
    points: [
      'Developed and evaluated alpha factors on the WorldQuant BRAIN platform, using statistical analysis of financial data to design predictive trading signals.',
      'Optimized alpha models against Sharpe Ratio, Fitness and Turnover metrics.',
      'Ran extensive backtesting and iterative refinement to improve alpha performance under platform constraints.',
    ],
  },
]

export type SystemSlug = 'blob-cloud' | 'paycore' | 'shoplon' | 'ada' | 'library'

export type System = {
  slug: SystemSlug
  index: string
  name: string
  kind: string
  oneLiner: string
  stack: string[]
  github?: string
  live?: string
  problem: string
  decisions: { title: string; body: string }[]
  challenges: { title: string; body: string }[]
  results: { value: string; label: string }[]
}

export const systems: System[] = [
  {
    slug: 'blob-cloud',
    index: '01',
    name: 'Blob-Cloud',
    kind: 'Distributed cloud storage',
    oneLiner: 'A Dropbox-style storage platform that never stores the same bytes twice.',
    stack: ['Go', 'React', 'TypeScript', 'PostgreSQL', 'Redis', 'AWS S3', 'AWS EC2', 'AWS SQS', 'AWS Lambda', 'WebSockets', 'Docker'],
    github: 'https://github.com/nrahil/Blob-Cloud',
    live: 'https://blobcloud.dev/',
    problem:
      'Naive file storage re-uploads and re-stores a whole file every time a single byte changes, trusts whatever the client sends, and falls over on flaky networks with large files. Blob-Cloud attacks all three: storage cost, integrity, and upload resilience - while keeping every device in sync in real time.',
    decisions: [
      {
        title: 'Content-defined chunking (FastCDC), not fixed blocks',
        body: 'Files are split in the browser with FastCDC (1-8 MB chunks) inside Web Workers. Boundaries depend on content, so inserting bytes early in a file only changes nearby chunks instead of shifting every block after it.',
      },
      {
        title: 'Content-addressable storage',
        body: 'Each chunk is addressed by its SHA-256 hash. A chunk that already exists is never uploaded or stored again - new revisions only cost the chunks that actually changed.',
      },
      {
        title: 'Zero-trust ingest',
        body: 'Clients upload via presigned S3 URLs into a quarantine area. The server re-hashes every chunk with streaming SHA-256 in constant memory and only then promotes it atomically under PostgreSQL advisory locks - a forged hash can never become a real chunk.',
      },
      {
        title: 'Change journal + fan-out for sync',
        body: 'Every mutation is appended to an append-only change journal, broadcast over Redis Pub/Sub, pushed to devices over WebSockets, with SQS/Lambda workflows handling asynchronous work.',
      },
    ],
    challenges: [
      {
        title: 'Large uploads on unreliable networks',
        body: 'Resumable multipart uploads plus an AIMD adaptive-concurrency controller (1-8 parallel streams): add a stream while things succeed, halve on failure - the same idea TCP uses for congestion control.',
      },
      {
        title: 'Concurrent promotion of identical chunks',
        body: 'Two users can upload the same chunk at the same moment. PostgreSQL advisory locks keyed on the hash serialize promotion so the chunk is verified and recorded exactly once.',
      },
    ],
    results: [
      { value: '96%+', label: 'reduction in revision storage via dedup' },
      { value: '1-8 MB', label: 'content-defined chunk window' },
      { value: '1-8', label: 'adaptive parallel upload streams (AIMD)' },
    ],
  },
  {
    slug: 'paycore',
    index: '02',
    name: 'PayCore Ledger',
    kind: 'Payment orchestration & double-entry ledger',
    oneLiner: 'Payments where every cent is accounted for twice - and every event is delivered at least once.',
    stack: ['Java 21', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Debezium', 'Protobuf', 'Docker', 'Prometheus', 'k6', 'Go'],
    github: 'https://github.com/nrahil/Paycore-Ledger',
    problem:
      'Payment systems fail in boring, expensive ways: a client retries and gets charged twice, a service writes to the database but crashes before publishing the event, or balances silently drift. PayCore is built so that none of those can happen without being visible.',
    decisions: [
      {
        title: 'Double-entry ledger as the source of truth',
        body: 'Authorization, capture, refunds and payouts are REST APIs backed by PostgreSQL transactions. Every money movement writes balanced debit and credit entries, so the ledger always sums to zero.',
      },
      {
        title: 'Idempotency keys on every mutating call',
        body: 'Retrying a request with the same idempotency key returns the original result instead of moving money again.',
      },
      {
        title: 'Transactional outbox → Debezium → Kafka',
        body: 'Events are written to an outbox table in the same transaction as the ledger entries. Debezium streams the outbox into Kafka as Protobuf messages - no dual-write, no lost events.',
      },
      {
        title: 'CQRS read model',
        body: 'An ordered projection consumes the Kafka stream to build the read side, with dead-letter storage and replay for projections that fail.',
      },
    ],
    challenges: [
      {
        title: 'Proving correctness under load',
        body: 'The payment flow was load-tested through a Go gateway with k6, then the ledger was checked for drift after the run.',
      },
      {
        title: 'Failed projections',
        body: 'A poison event must not block the stream. Failed projections go to dead-letter storage and can be replayed once fixed.',
      },
    ],
    results: [
      { value: '4,241', label: 'payment flows in 2 min (10 VUs, k6)' },
      { value: '0%', label: 'request failures' },
      { value: '330.8 ms', label: 'p95 capture latency' },
      { value: '0', label: 'ledger drift after the run' },
    ],
  },
  {
    slug: 'shoplon',
    index: '03',
    name: 'ShopLon',
    kind: 'Cross-platform e-commerce app',
    oneLiner: 'A Flutter shop where state flows one way and streams clean up after themselves.',
    stack: ['Flutter', 'Dart', 'Firebase Auth', 'Cloud Firestore', 'Provider', 'Dart Streams'],
    github: 'https://github.com/nrahil',
    problem:
      'Shopping apps look simple until state gets messy: carts that go stale after logout, listeners that leak, rebuilds that cascade through the whole widget tree, and carts that silently change price. ShopLon is an exercise in getting the architecture right across 18 screens - onboarding to checkout - on Android and iOS.',
    decisions: [
      {
        title: 'Unidirectional data flow',
        body: 'Firebase → Provider → UI. Five ChangeNotifier-based providers implement the Observer pattern, so widgets rebuild only where their slice of state changes.',
      },
      {
        title: 'Auth-scoped stream lifecycle',
        body: 'Firestore snapshots() streams subscribe on login and cancel on logout via authStateChanges() - no memory leaks, no previous user\'s cart flashing on screen.',
      },
      {
        title: 'Denormalized cart documents',
        body: 'Cart items store a full product snapshot, so the cart reflects what the user actually added even when catalog prices change.',
      },
      {
        title: 'O(1) wishlist lookups',
        body: 'The product ID is the wishlist document key, so "is this wishlisted?" is a direct key lookup instead of a query.',
      },
    ],
    challenges: [
      {
        title: 'Stale data after logout',
        body: 'Solved by tying every stream subscription to the auth state rather than to widget lifetimes.',
      },
      {
        title: 'Rebuild storms',
        body: 'Scoped providers keep rebuilds local to the widgets that consume each piece of state.',
      },
    ],
    results: [
      { value: '18', label: 'screens, onboarding → checkout' },
      { value: '5', label: 'ChangeNotifier providers' },
      { value: '2', label: 'platforms - Android & iOS' },
    ],
  },
  {
    slug: 'ada',
    index: '04',
    name: 'Ada',
    kind: 'Multi-agent deep research engine',
    oneLiner: 'Research agents that argue with each other before they answer you.',
    stack: ['Python', 'LangGraph', 'FastAPI', 'Qdrant', 'Celery', 'Redis', 'LiteLLM', 'Langfuse', 'Next.js', 'Docker'],
    github: 'https://github.com/nrahil/Ada-Research-Agent',
    live: 'http://ada-agent.duckdns.org',
    problem:
      'A single LLM call produces fluent, confident, unverifiable text. Ada treats research as a pipeline: plan it, research in parallel, attack the draft, and verify every claim and citation before anything reaches the user.',
    decisions: [
      {
        title: 'Planner-driven decomposition',
        body: 'A planner breaks a question into sub-queries that run as bounded parallel research tracks.',
      },
      {
        title: 'Adversarial critic + arbiter loop',
        body: 'A critic challenges each section; an arbiter decides whether to accept or send it back - before section synthesis.',
      },
      {
        title: 'Evidence-grounded RAG',
        body: 'Combines web search with user-scoped private retrieval from Qdrant, so answers can cite both public sources and a user\'s own documents.',
      },
      {
        title: 'Shared LiteLLM gateway',
        body: 'One gateway for dynamic model routing, fallback, rate limiting and output validation across every agent.',
      },
    ],
    challenges: [
      {
        title: 'Measuring, not guessing',
        body: 'LLM evaluation and Langfuse tracing on every run. Prompt calibration was driven by a claim-verification benchmark rather than intuition.',
      },
    ],
    results: [
      { value: '70.8% → 79.2%', label: 'claim-verification accuracy' },
      { value: '0.639 → 0.769', label: 'macro-F1' },
      { value: '24', label: 'claim benchmark' },
    ],
  },
  {
    slug: 'library',
    index: '05',
    name: 'Library Management System',
    kind: 'Object-oriented design in C++',
    oneLiner: 'A console app used as a proving ground for SOLID and design patterns.',
    stack: ['C++', 'OOP', 'SOLID', 'GoF Design Patterns'],
    github: 'https://github.com/nrahil',
    problem:
      'Small systems rot fastest when every new feature means editing old classes. This project is built so new item types and features are added, not patched in.',
    decisions: [
      { title: 'All five SOLID principles', body: 'Dependency-injected repositories, strategy-based pricing and a Facade service layer.' },
      { title: 'Four GoF patterns', body: 'Factory for polymorphic item creation, Singleton for a global event bus, Observer for event-driven notifications, State for item lifecycle.' },
      { title: 'Generic Repository abstraction', body: 'Business logic is decoupled from storage, so persistence backends can be swapped without touching services.' },
    ],
    challenges: [
      { title: 'Extending without modifying', body: 'DVD and Magazine item types, issue/return tracking and low-balance alerts were added through Open/Closed extensions with minimal changes to existing classes.' },
    ],
    results: [
      { value: '5', label: 'SOLID principles applied' },
      { value: '4', label: 'GoF patterns' },
      { value: '2', label: 'roles - Admin & Student' },
    ],
  },
]

// Skills grouped by layer. `usedIn` links a skill to evidence (systems / roles).
export type Skill = { name: string; usedIn: string[] }
export type SkillLayer = { layer: string; skills: Skill[] }

export const skillLayers: SkillLayer[] = [
  {
    layer: 'Languages',
    skills: [
      { name: 'Java', usedIn: ['paycore'] },
      { name: 'Go', usedIn: ['blob-cloud', 'paycore'] },
      { name: 'Dart', usedIn: ['shoplon', 'coinsanchay'] },
      { name: 'Python', usedIn: ['ada', 'worldquant'] },
      { name: 'TypeScript', usedIn: ['blob-cloud', 'ada'] },
      { name: 'JavaScript', usedIn: ['coinsanchay'] },
      { name: 'C++', usedIn: ['library'] },
      { name: 'SQL', usedIn: ['blob-cloud', 'paycore'] },
    ],
  },
  {
    layer: 'Mobile & Frontend',
    skills: [
      { name: 'Flutter', usedIn: ['shoplon', 'coinsanchay'] },
      { name: 'Provider', usedIn: ['shoplon'] },
      { name: 'Riverpod', usedIn: [] },
      { name: 'BLoC', usedIn: [] },
      { name: 'React', usedIn: ['blob-cloud'] },
      { name: 'Next.js', usedIn: ['ada'] },
    ],
  },
  {
    layer: 'Backend',
    skills: [
      { name: 'Spring Boot', usedIn: ['paycore'] },
      { name: 'Node.js', usedIn: ['coinsanchay'] },
      { name: 'FastAPI', usedIn: ['ada'] },
      { name: 'REST APIs', usedIn: ['paycore', 'blob-cloud', 'ada'] },
      { name: 'WebSockets', usedIn: ['blob-cloud'] },
      { name: 'Idempotency', usedIn: ['paycore', 'coinsanchay'] },
      { name: 'Rate Limiting', usedIn: ['ada'] },
      { name: 'Microservices', usedIn: ['paycore'] },
    ],
  },
  {
    layer: 'Data & Messaging',
    skills: [
      { name: 'PostgreSQL', usedIn: ['blob-cloud', 'paycore'] },
      { name: 'Redis', usedIn: ['blob-cloud', 'paycore', 'ada'] },
      { name: 'Kafka', usedIn: ['paycore'] },
      { name: 'Debezium', usedIn: ['paycore'] },
      { name: 'Protobuf', usedIn: ['paycore'] },
      { name: 'Firestore', usedIn: ['shoplon'] },
      { name: 'Firebase RTDB', usedIn: ['coinsanchay'] },
      { name: 'Qdrant', usedIn: ['ada'] },
      { name: 'pgvector', usedIn: [] },
      { name: 'MySQL', usedIn: [] },
      { name: 'MongoDB', usedIn: [] },
    ],
  },
  {
    layer: 'Patterns',
    skills: [
      { name: 'Transactional Outbox', usedIn: ['paycore'] },
      { name: 'CQRS', usedIn: ['paycore'] },
      { name: 'Event-driven', usedIn: ['paycore', 'blob-cloud', 'library'] },
      { name: 'Content-addressable storage', usedIn: ['blob-cloud'] },
      { name: 'SOLID / GoF', usedIn: ['library', 'shoplon'] },
    ],
  },
  {
    layer: 'Cloud & Infra',
    skills: [
      { name: 'AWS S3', usedIn: ['blob-cloud'] },
      { name: 'AWS SQS', usedIn: ['blob-cloud'] },
      { name: 'AWS Lambda', usedIn: ['blob-cloud'] },
      { name: 'AWS EC2', usedIn: ['blob-cloud'] },
      { name: 'Docker', usedIn: ['blob-cloud', 'paycore', 'ada'] },
      { name: 'Kubernetes', usedIn: [] },
      { name: 'Firebase', usedIn: ['shoplon', 'coinsanchay'] },
      { name: 'Cloud Functions', usedIn: ['coinsanchay'] },
      { name: 'GitHub Actions', usedIn: [] },
    ],
  },
  {
    layer: 'AI',
    skills: [
      { name: 'LangGraph', usedIn: ['ada'] },
      { name: 'RAG', usedIn: ['ada'] },
      { name: 'LiteLLM', usedIn: ['ada'] },
      { name: 'OpenAI API', usedIn: ['coinsanchay'] },
      { name: 'Celery', usedIn: ['ada'] },
    ],
  },
  {
    layer: 'Testing & Observability',
    skills: [
      { name: 'k6', usedIn: ['paycore'] },
      { name: 'Prometheus', usedIn: ['paycore'] },
      { name: 'Langfuse', usedIn: ['ada'] },
      { name: 'Testcontainers', usedIn: [] },
      { name: 'Grafana', usedIn: [] },
      { name: 'Jaeger', usedIn: [] },
    ],
  },
]

export const nodeLabels: Record<string, string> = {
  'blob-cloud': 'Blob-Cloud',
  paycore: 'PayCore',
  shoplon: 'ShopLon',
  ada: 'Ada',
  library: 'Library MS',
  coinsanchay: 'CoinSanchay',
  worldquant: 'WorldQuant',
}

export const record = [
  { level: 'INFO', key: 'leetcode', msg: 'Knight · rating 1,925 · top 1.96% globally', href: 'https://leetcode.com/u/nrahil' },
  { level: 'INFO', key: 'dsa', msg: '800+ problems solved across platforms' },
  { level: 'INFO', key: 'jee_main', msg: 'AIR 9,833 · 99.17 percentile' },
  { level: 'LEAD', key: 'student_council', msg: 'Executive Member, Student Activity Council - represented 1,000+ students; coordinated with administration and ran campus-wide initiatives' },
  { level: 'LEAD', key: 'aurora_fest', msg: 'Core Team Lead, Aurora Annual Cultural Festival - directed 50+ volunteers; secured sponsor partnerships' },
]

export const sections = [
  { id: 'whoami', label: 'whoami', tag: 'span.kind=intro' },
  { id: 'experience', label: 'experience', tag: 'span.kind=roles · items=2' },
  { id: 'systems', label: 'systems', tag: 'span.kind=projects · items=5' },
  { id: 'stack', label: 'stack', tag: 'span.kind=skills · layers=8' },
  { id: 'record', label: 'record', tag: 'span.kind=log' },
  { id: 'contact', label: 'contact', tag: 'status=200' },
] as const
