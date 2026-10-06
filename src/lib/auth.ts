export const AUTH_CREDENTIALS = {
  username: "Beruangmadu",
  password: "Beruang4321_",
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
    id: "usr_admin_default",
    username: "Beruangmadu",
    name: "Beruang Madu",
    role: "ADMIN",
  };
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
}
