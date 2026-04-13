/**
 * Module-scoped in-memory stores.
 *
 * Design:
 *  - Singleton via globalThis so state survives HMR in dev
 *  - Append-only audit log for admin observability
 *  - Task workflow: CREATED → APPROVED → IN_PROGRESS → COMPLETED / REJECTED
 *  - Jobs + Applications shared by HR dashboard and public Careers page
 *
 * For production: replace with Postgres + Redis. Interface already abstracts
 * the consumers from the storage layer.
 */

export type JobStatus = "open" | "closed";
export interface Job {
  id: string;
  title: string;
  domain: string;
  location: string;
  description: string;
  skills: string[];
  created_at: string;
  status: JobStatus;
  applications: number;
}

export type TaskStatus = "created" | "approved" | "in_progress" | "completed" | "rejected";
export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  domain: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
}

export type NotificationSeverity = "info" | "warning" | "critical";
export interface Notification {
  id: string;
  title: string;
  detail: string;
  severity: NotificationSeverity;
  created_at: string;
  read: boolean;
  target_role?: string;
  target_domain?: string;
  target_user?: string;
}

export type ApplicationStatus = "APPLIED" | "SCREENING" | "SHORTLISTED" | "REJECTED";
export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  candidate_name: string;
  candidate_email: string;
  resume_text: string;
  status: ApplicationStatus;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  gemini_reason: string;
  ai_source: "gemini" | "fallback";
  ai_failure?: string;
  created_at: string;
}

export interface ResumeScreeningResult {
  id: string;
  candidate: string;
  job_id: string;
  job_title: string;
  decision: "SELECTED" | "REJECTED" | "MAYBE";
  score: number;
  reason: string;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  detail?: string;
  timestamp: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __eaios_store: {
    jobs: Job[];
    tasks: Task[];
    notifications: Notification[];
    screenings: ResumeScreeningResult[];
    applications: Application[];
    audit: AuditEntry[];
  } | undefined;
}

function init() {
  const existing: any = globalThis.__eaios_store;
  if (!existing) {
    globalThis.__eaios_store = {
      jobs: seedJobs(),
      tasks: seedTasks(),
      notifications: seedNotifications(),
      screenings: [],
      applications: [],
      audit: [],
    };
  } else {
    // Forward-compat migration for HMR-preserved globals
    if (!existing.jobs) existing.jobs = seedJobs();
    if (!existing.tasks) existing.tasks = seedTasks();
    if (!existing.notifications) existing.notifications = seedNotifications();
    if (!existing.screenings) existing.screenings = [];
    if (!existing.applications) existing.applications = [];
    if (!existing.audit) existing.audit = [];
  }
  return globalThis.__eaios_store!;
}

function seedJobs(): Job[] {
  return [
    {
      id: "JOB-001",
      title: "Process Safety Engineer",
      domain: "hr-safety",
      location: "Aberdeen, UK",
      description: "Lead process safety reviews across upstream platforms and ensure IEC 61511 compliance.",
      skills: ["HAZOP", "SIL Assessment", "IEC 61511", "Process Engineering"],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: "open",
      applications: 12,
    },
    {
      id: "JOB-002",
      title: "Hydrogen Systems Engineer",
      domain: "manufacturing",
      location: "Rotterdam, NL",
      description: "Design and commission green hydrogen production systems for low-carbon fuel pathways.",
      skills: ["Electrolysis", "PEM", "Process Simulation", "Energy Transition"],
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: "open",
      applications: 5,
    },
    {
      id: "JOB-003",
      title: "Quantitative Trader (Crude)",
      domain: "commercial-trading",
      location: "London, UK",
      description: "Develop and execute crude trading strategies across Brent/WTI/Dubai benchmarks.",
      skills: ["Python", "Time Series", "Risk Modeling", "Commodities"],
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      status: "open",
      applications: 24,
    },
  ];
}

function seedTasks(): Task[] {
  return [
    {
      id: "TSK-001",
      title: "Inspect Pump P-101",
      description: "Vibration sensor flagged anomaly — perform on-site inspection",
      assignee: "employee_mfg",
      domain: "manufacturing",
      status: "approved",
      priority: "high",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      created_by: "manager_mfg",
      approved_by: "manager_mfg",
      approved_at: new Date(Date.now() - 3500000).toISOString(),
    },
  ];
}

function seedNotifications(): Notification[] {
  return [
    {
      id: "NOT-001",
      title: "System initialized",
      detail: "All 36 microservices registered with master orchestrator",
      severity: "info",
      created_at: new Date(Date.now() - 600000).toISOString(),
      read: false,
    },
  ];
}

function nextId(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

export const store = {
  jobs: {
    list: () => init().jobs,
    listOpen: () => init().jobs.filter((j) => j.status === "open"),
    get: (id: string) => init().jobs.find((j) => j.id === id),
    create: (job: Omit<Job, "id" | "created_at" | "applications" | "status">): Job => {
      const s = init();
      const full: Job = {
        ...job,
        id: nextId("JOB", s.jobs.length),
        created_at: new Date().toISOString(),
        applications: 0,
        status: "open",
      };
      s.jobs.unshift(full);
      store.notifications.add({
        title: `New job posted: ${full.title}`,
        detail: `${full.location} · ${full.domain}`,
        severity: "info",
        target_domain: "hr-safety",
      });
      return full;
    },
    incrementApplications: (id: string) => {
      const job = init().jobs.find((j) => j.id === id);
      if (job) job.applications++;
    },
  },

  tasks: {
    list: () => init().tasks,
    forUser: (username: string) => init().tasks.filter((t) => t.assignee === username),
    byDomain: (domain: string) => init().tasks.filter((t) => t.domain === domain),
    create: (task: Omit<Task, "id" | "created_at" | "status">): Task => {
      const s = init();
      const full: Task = {
        ...task,
        id: nextId("TSK", s.tasks.length),
        status: "created",
        created_at: new Date().toISOString(),
      };
      s.tasks.unshift(full);
      store.notifications.add({
        title: `Task awaiting approval: ${full.title}`,
        detail: `For ${full.assignee} · priority ${full.priority}`,
        severity: full.priority === "critical" ? "critical" : "info",
        target_user: full.assignee,
      });
      return full;
    },
    approve: (id: string, approver: string): Task | undefined => {
      const t = init().tasks.find((x) => x.id === id);
      if (!t) return undefined;
      t.status = "approved";
      t.approved_by = approver;
      t.approved_at = new Date().toISOString();
      store.notifications.add({
        title: `Task approved: ${t.title}`,
        detail: `${approver} approved assignment to ${t.assignee}`,
        severity: "info",
        target_user: t.assignee,
      });
      return t;
    },
    updateStatus: (id: string, status: TaskStatus): Task | undefined => {
      const t = init().tasks.find((x) => x.id === id);
      if (!t) return undefined;
      t.status = status;
      if (status === "completed") {
        store.notifications.add({
          title: `Task completed: ${t.title}`,
          detail: `By ${t.assignee}`,
          severity: "info",
          target_role: "manager",
          target_domain: t.domain,
        });
      }
      return t;
    },
  },

  notifications: {
    list: () => init().notifications.slice(0, 25),
    forUser: (username: string, role?: string, domain?: string) => {
      return init().notifications
        .filter((n) => {
          if (n.target_user && n.target_user === username) return true;
          if (n.target_role && n.target_role === role) return true;
          if (n.target_domain && n.target_domain === domain) return true;
          return !n.target_user && !n.target_role && !n.target_domain;
        })
        .slice(0, 25);
    },
    unreadCount: () => init().notifications.filter((n) => !n.read).length,
    add: (n: Omit<Notification, "id" | "created_at" | "read">): Notification => {
      const s = init();
      const full: Notification = {
        ...n,
        id: nextId("NOT", s.notifications.length),
        created_at: new Date().toISOString(),
        read: false,
      };
      s.notifications.unshift(full);
      if (s.notifications.length > 200) s.notifications.length = 200;
      return full;
    },
    markAllRead: () => {
      init().notifications.forEach((n) => (n.read = true));
    },
  },

  screenings: {
    list: () => init().screenings,
    add: (r: Omit<ResumeScreeningResult, "id" | "created_at">): ResumeScreeningResult => {
      const s = init();
      const full: ResumeScreeningResult = {
        ...r,
        id: nextId("SCR", s.screenings.length),
        created_at: new Date().toISOString(),
      };
      s.screenings.unshift(full);
      return full;
    },
  },

  applications: {
    list: () => init().applications,
    forJob: (jobId: string) => init().applications.filter((a) => a.job_id === jobId),
    add: (a: Omit<Application, "id" | "created_at">): Application => {
      const s = init();
      const full: Application = {
        ...a,
        id: nextId("APP", s.applications.length),
        created_at: new Date().toISOString(),
      };
      s.applications.unshift(full);
      store.jobs.incrementApplications(a.job_id);
      return full;
    },
  },

  audit: {
    list: (limit = 100) => init().audit.slice(0, limit),
    add: (e: Omit<AuditEntry, "id" | "timestamp">): AuditEntry => {
      const s = init();
      const full: AuditEntry = {
        ...e,
        id: nextId("AUD", s.audit.length),
        timestamp: new Date().toISOString(),
      };
      s.audit.unshift(full);
      if (s.audit.length > 500) s.audit.length = 500;
      return full;
    },
  },
};
