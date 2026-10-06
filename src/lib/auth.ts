export const AUTH_CREDENTIALS = {
  username: "kenzieganteng",
  password: "AmeeraKenzie190613",
};

const AUTH_KEY = "affiliatepost_auth_session";
const AUTH_USER_KEY = "affiliatepost_auth_user";

export interface LoggedInUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export function checkAuth(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "authenticated";
}

export function setAuthSession(user?: LoggedInUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, "authenticated");
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      try {
        document.cookie = `affiliatepost_user_id=${encodeURIComponent(user.id)}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `affiliatepost_username=${encodeURIComponent(user.username)}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `affiliatepost_role=${encodeURIComponent(user.role)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    }
  }
}

export function getCurrentUser(): LoggedInUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return {
    id: "usr_admin_kenzie",
    username: "kenzieganteng",
    name: "Kenzie Ganteng",
    role: "ADMIN",
  };
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    try {
      document.cookie = "affiliatepost_user_id=; path=/; max-age=0";
      document.cookie = "affiliatepost_username=; path=/; max-age=0";
      document.cookie = "affiliatepost_role=; path=/; max-age=0";
    } catch {}
  }
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const user = getCurrentUser();
  if (!user) return {};
  return {
    "x-user-id": user.id || "usr_admin_kenzie",
    "x-user-username": user.username || "kenzieganteng",
    "x-user-role": user.role || "ADMIN",
  };
}
