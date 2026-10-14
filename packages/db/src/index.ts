import { PrismaClient } from "@prisma/client";

export { PrismaClient, Prisma, Role, PlanKind, ContentType, ContentStatus, SavedKind, ModerationStatus, PrayerCategory } from "@prisma/client";
export type * from "@prisma/client";

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
