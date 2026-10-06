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
    searchParams.get("userId") ||
    "usr_admin_kenzie";
  const username =
    request.headers.get("x-user-username") ||
    searchParams.get("username") ||
    "kenzieganteng";
  const role =
    request.headers.get("x-user-role") ||
    searchParams.get("role") ||
    (userId === "usr_admin_kenzie" || username === "kenzieganteng" ? "ADMIN" : "MEMBER");

  return {
    userId,
    username,
    role,
    isAdmin: role === "ADMIN",
  };
}
