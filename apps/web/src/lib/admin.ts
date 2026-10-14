import "server-only";
import { Prisma } from "@cp/db";
import type { Role } from "@cp/shared";
import { ApiError } from "./api";
import { getCurrentUser, hasRole } from "./session";

/** Page-level guard. API routes enforce roles separately through `handler({ roles })`. */
export async function staffUser(roles: Role[]) {
  const user = await getCurrentUser();
  return { user, allowed: hasRole(user, roles) };
}

/** Maps unique-constraint violations to a readable 409 instead of a 500. */
export async function uniqueOr409<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ApiError(409, "slug_taken");
    throw error;
  }
}
