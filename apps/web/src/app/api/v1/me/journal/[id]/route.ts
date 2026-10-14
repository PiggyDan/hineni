import { prisma } from "@cp/db";
import { journalEntryUpdateSchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";
import { encryptForUser } from "@/lib/crypto";
import { encryptRefs, serializeJournalEntry } from "@/lib/journal";

async function ownedEntry(id: string, userId: string) {
  const entry = await prisma.journalEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) throw new ApiError(404, "not_found");
  return entry;
}

export const PATCH = handler<{ id: string }>({ auth: true }, async ({ req, params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  await ownedEntry(params.id, user.id);
  const data = await body(req, journalEntryUpdateSchema);
  const updated = await prisma.journalEntry.update({
    where: { id: params.id },
    data: {
      ...(data.title !== undefined ? { titleCipher: encryptForUser(user.id, data.title) } : {}),
      ...(data.body !== undefined ? { bodyCipher: encryptForUser(user.id, data.body) } : {}),
      ...(data.refs !== undefined ? { refsCipher: encryptRefs(user.id, data.refs) } : {}),
    },
  });
  return serializeJournalEntry(user.id, updated);
});

export const DELETE = handler<{ id: string }>({ auth: true }, async ({ params, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  await ownedEntry(params.id, user.id);
  await prisma.journalEntry.delete({ where: { id: params.id } });
  return { ok: true };
});
