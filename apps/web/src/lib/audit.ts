import "server-only";
import { prisma, type Prisma } from "@cp/db";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}

/** Append-only audit trail. Never include private content (prayers, notes) in metadata. */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}
