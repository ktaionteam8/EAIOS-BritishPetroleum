/**
 * Module-scoped in-memory stores. Persists across requests within a
 * single Next.js dev/runtime process. For production, swap with Postgres/Redis.
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

export type TaskStatus = "open" | "in_progress" | "done";
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

// ---- globals (preserved across hot reloads in dev) ----
declare global {
  // eslint-disable-next-line no-var
  var __eaios_store: {
    jobs: Job[];
    tasks: Task[];
    notifications: Notification[];
    screenings: ResumeScreeningResult[];
  } | undefined;
}

function init() {
  if (!globalThis.__eaios_store) {
    globalThis.__eaios_store = {
      jobs: seedJobs(),
      tasks: seedTasks(),
      notifications: seedNotifications(),
      screenings: [],
    };
  }
  return globalThis.__eaios_store;
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
      status: "open",
      priority: "high",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      created_by: "manager_mfg",
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

// ---- Accessors ----
export const store = {
  jobs: {
    list: () => init().jobs,
    listOpen: () => init().jobs.filter((j) => j.status === "open"),
    get: (id: string) => init().jobs.find((j) => j.id === id),
    create: (job: Omit<Job, "id" | "created_at" | "applications" | "status">): Job => {
      const s = init();
      const id = `JOB-${String(s.jobs.length + 1).padStart(3, "0")}`;
      const full: Job = { ...job, id, created_at: new Date().toISOString(), applications: 0, status: "open" };
      s.jobs.unshift(full);
      store.notifications.add({
        title: `New job posted: ${full.title}`,
        detail: `${full.location} · ${full.domain}`,
        severity: "info",
      });
      return full;
    },
  },
  tasks: {
    list: () => init().tasks,
    forUser: (username: string) => init().tasks.filter((t) => t.assignee === username),
    create: (task: Omit<Task, "id" | "created_at" | "status">): Task => {
      const s = init();
      const id = `TSK-${String(s.tasks.length + 1).padStart(3, "0")}`;
      const full: Task = { ...task, id, status: "open", created_at: new Date().toISOString() };
      s.tasks.unshift(full);
      store.notifications.add({
        title: `Task assigned: ${full.title}`,
        detail: `Assigned to ${full.assignee} · priority ${full.priority}`,
        severity: full.priority === "critical" ? "critical" : "info",
      });
      return full;
    },
    updateStatus: (id: string, status: TaskStatus) => {
      const s = init();
      const t = s.tasks.find((x) => x.id === id);
      if (t) t.status = status;
      return t;
    },
  },
  notifications: {
    list: () => init().notifications.slice(0, 25),
    unreadCount: () => init().notifications.filter((n) => !n.read).length,
    add: (n: Omit<Notification, "id" | "created_at" | "read">): Notification => {
      const s = init();
      const id = `NOT-${String(s.notifications.length + 1).padStart(3, "0")}`;
      const full: Notification = { ...n, id, created_at: new Date().toISOString(), read: false };
      s.notifications.unshift(full);
      if (s.notifications.length > 100) s.notifications.pop();
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
      const id = `SCR-${String(s.screenings.length + 1).padStart(3, "0")}`;
      const full: ResumeScreeningResult = { ...r, id, created_at: new Date().toISOString() };
      s.screenings.unshift(full);
      store.notifications.add({
        title: `Resume screened: ${r.candidate}`,
        detail: `${r.decision} · score ${r.score}/100 for ${r.job_title}`,
        severity: r.decision === "SELECTED" ? "info" : r.decision === "REJECTED" ? "warning" : "info",
        target_domain: "hr-safety",
      });
      return full;
    },
  },
};
