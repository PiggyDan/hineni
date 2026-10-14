import { prisma } from "@cp/db";
import { journalEntrySchema } from "@cp/shared";
import { ApiError, body, handler } from "@/lib/api";
import { encryptForUser } from "@/lib/crypto";
import { encryptRefs, serializeJournalEntry } from "@/lib/journal";

export const GET = handler({ auth: true }, async ({ user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const rows = await prisma.journalEntry.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 500 });
  return rows.map((row) => serializeJournalEntry(user.id, row));
});

export const POST = handler({ auth: true }, async ({ req, user }) => {
  if (!user) throw new ApiError(401, "unauthorized");
  const data = await body(req, journalEntrySchema);
  const created = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      titleCipher: encryptForUser(user.id, data.title),
      bodyCipher: encryptForUser(user.id, data.body),
      refsCipher: encryptRefs(user.id, data.refs),
    },
  });
  return serializeJournalEntry(user.id, created);
});
