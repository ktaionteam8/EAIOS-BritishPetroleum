export type Role = "admin" | "ceo" | "manager" | "employee";

export interface User {
  username: string;
  password: string;
  role: Role;
  name: string;
  domain?: string;
}

// Demo credentials — NEVER use in production
export const USERS: User[] = [
  { username: "admin", password: "admin123", role: "admin", name: "System Admin" },
  { username: "ceo", password: "ceo123", role: "ceo", name: "Sarah Chen (CEO)" },
  { username: "manager_mfg", password: "mfg123", role: "manager", domain: "manufacturing", name: "David Kumar" },
  { username: "manager_scm", password: "scm123", role: "manager", domain: "supply-chain", name: "Emma Rossi" },
  { username: "manager_trade", password: "trade123", role: "manager", domain: "commercial-trading", name: "James Miller" },
  { username: "manager_hr", password: "hr123", role: "manager", domain: "hr-safety", name: "Priya Nair" },
  { username: "manager_it", password: "it123", role: "manager", domain: "it-cybersecurity", name: "Amir Hassan" },
  { username: "manager_fin", password: "fin123", role: "manager", domain: "finance", name: "Lucia Fernandez" },
  { username: "employee_mfg", password: "emp123", role: "employee", domain: "manufacturing", name: "Tom Wilson" },
  { username: "employee_hr", password: "emp123", role: "employee", domain: "hr-safety", name: "Anna Lee" },
];

export function authenticate(username: string, password: string): User | null {
  const u = USERS.find((x) => x.username === username && x.password === password);
  return u || null;
}

export function canAccessDomain(role: Role, userDomain: string | undefined, targetDomain: string): boolean {
  if (role === "admin" || role === "ceo") return true;
  if (role === "manager") return userDomain === targetDomain;
  if (role === "employee") return userDomain === targetDomain;
  return false;
}

export function canSeeMasterDecision(role: Role): boolean {
  return role === "admin" || role === "ceo";
}

export function canManageHR(role: Role, userDomain?: string): boolean {
  return role === "admin" || (role === "manager" && userDomain === "hr-safety");
}
