export const SUPER_AUTH_KEY = "sa.super.auth";

export type SuperAuth = {
  email: string;
  name: string;
  role: "super_admin";
  loggedAt: string;
};

export function getSuperAuth(): SuperAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SUPER_AUTH_KEY);
    return raw ? (JSON.parse(raw) as SuperAuth) : null;
  } catch {
    return null;
  }
}

export function setSuperAuth(email: string) {
  if (typeof window === "undefined") return;
  const auth: SuperAuth = {
    email,
    name: email.split("@")[0] || "Super Admin",
    role: "super_admin",
    loggedAt: new Date().toISOString(),
  };
  localStorage.setItem(SUPER_AUTH_KEY, JSON.stringify(auth));
}

export function clearSuperAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SUPER_AUTH_KEY);
}
