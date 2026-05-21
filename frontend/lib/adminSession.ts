const ADMIN_SESSION_KEY = "nhb_admin_session";

export function isAdminSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

export function activateAdminSession(): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
