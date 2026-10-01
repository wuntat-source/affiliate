export const AUTH_CREDENTIALS = {
  username: "Beruangmadu",
  password: "Beruang4321_",
};

const AUTH_KEY = "affiliatepost_auth_session";

export function checkAuth(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "authenticated";
}

export function setAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_KEY, "authenticated");
  }
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}
