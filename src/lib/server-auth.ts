import { NextRequest } from "next/server";

export interface RequestUserContext {
  userId: string;
  username: string;
  role: string;
  isAdmin: boolean;
}

export function getUserContext(request: NextRequest): RequestUserContext {
  const { searchParams } = new URL(request.url);
  const userId =
    request.headers.get("x-user-id") ||
    request.cookies.get("affiliatepost_user_id")?.value ||
    searchParams.get("userId") ||
    "usr_admin_kenzie";
  const username =
    request.headers.get("x-user-username") ||
    request.cookies.get("affiliatepost_username")?.value ||
    searchParams.get("username") ||
    "kenzieganteng";
  const role =
    request.headers.get("x-user-role") ||
    request.cookies.get("affiliatepost_role")?.value ||
    searchParams.get("role") ||
    (userId === "usr_admin_kenzie" || username.toLowerCase() === "kenzieganteng" ? "ADMIN" : "MEMBER");

  return {
    userId,
    username,
    role,
    isAdmin: role === "ADMIN",
  };
}
