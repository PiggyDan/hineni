import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { Role } from "@cp/shared";
import { auth } from "./auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: Role;
  locale: string;
}

/** Session for the current request (cookie for web, bearer/cookie for mobile). Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: string; locale?: string };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    role: (u.role as Role) ?? "USER",
    locale: u.locale ?? "en",
  };
});

const rank: Record<Role, number> = { USER: 0, EDITOR: 1, MODERATOR: 1, ADMIN: 2 };

/** Role check. EDITOR and MODERATOR are separate capabilities; ADMIN has both. */
export function hasRole(user: Pick<CurrentUser, "role"> | null, required: Role | Role[]): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((r) => (r === "USER" ? rank[user.role] >= 0 : user.role === r));
}
