export type Role = "admin" | "ceo" | "manager" | "employee";

export interface User {
  username: string;     // legacy username (e.g. "admin")
  email: string;        // new email-style login (e.g. "admin@eaios.com")
  password: string;
  role: Role;
  name: string;
  domain?: string;
}

// Demo credentials — NEVER use in production.
// Every user accepts EITHER username or email format as login identifier.
export const USERS: User[] = [
  { username: "admin",        email: "admin@eaios.com",     password: "admin123", role: "admin", name: "System Admin" },
  { username: "ceo",          email: "ceo@eaios.com",       password: "ceo123",   role: "ceo",   name: "Sarah Chen (CEO)" },

  { username: "manager_mfg",   email: "mfg@eaios.com",      password: "mfg123",     role: "manager", domain: "manufacturing",      name: "David Kumar" },
  { username: "manager_scm",   email: "scm@eaios.com",      password: "scm123",     role: "manager", domain: "supply-chain",       name: "Emma Rossi" },
  { username: "manager_trade", email: "trading@eaios.com",  password: "trading123", role: "manager", domain: "commercial-trading", name: "James Miller" },
  { username: "manager_hr",    email: "hr@eaios.com",       password: "hr123",      role: "manager", domain: "hr-safety",          name: "Priya Nair" },
  { username: "manager_it",    email: "it@eaios.com",       password: "it123",      role: "manager", domain: "it-cybersecurity",   name: "Amir Hassan" },
  { username: "manager_fin",   email: "finance@eaios.com",  password: "finance123", role: "manager", domain: "finance",            name: "Lucia Fernandez" },

  { username: "employee_mfg",     email: "emp_mfg@eaios.com",     password: "emp123", role: "employee", domain: "manufacturing",      name: "Tom Wilson" },
  { username: "employee_scm",     email: "emp_scm@eaios.com",     password: "emp123", role: "employee", domain: "supply-chain",       name: "Olivia Park" },
  { username: "employee_trade",   email: "emp_trading@eaios.com", password: "emp123", role: "employee", domain: "commercial-trading", name: "Marco Bianchi" },
  { username: "employee_hr",      email: "emp_hr@eaios.com",      password: "emp123", role: "employee", domain: "hr-safety",          name: "Anna Lee" },
  { username: "employee_it",      email: "emp_it@eaios.com",      password: "emp123", role: "employee", domain: "it-cybersecurity",   name: "Noah Kim" },
  { username: "employee_fin",     email: "emp_finance@eaios.com", password: "emp123", role: "employee", domain: "finance",            name: "Mia Torres" },
];

/**
 * Accepts either `username` OR `email` as the identifier. Backward-compat with
 * older cookies/forms that sent `username`.
 */
export function authenticate(identifier: string, password: string): User | null {
  const id = identifier.trim().toLowerCase();
  const u = USERS.find(
    (x) =>
      (x.username.toLowerCase() === id || x.email.toLowerCase() === id) &&
      x.password === password,
  );
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
