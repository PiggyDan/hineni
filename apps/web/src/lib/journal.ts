import "server-only";
import type { JournalEntry } from "@cp/db";
import { decryptForUser, encryptForUser } from "./crypto";

export interface JournalEntryView {
  id: string;
  title: string;
  body: string;
  refs: string[];
  createdAt: string;
  updatedAt: string;
}

export const encryptRefs = (userId: string, refs: string[]) => (refs.length ? encryptForUser(userId, JSON.stringify(refs)) : null);

function decryptRefs(userId: string, cipher: string | null): string[] {
  if (!cipher) return [];
  try {
    const value = JSON.parse(decryptForUser(userId, cipher)) as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/** Decrypts one entry. Callers must have already checked that `entry.userId` is the current user. */
export const serializeJournalEntry = (userId: string, entry: JournalEntry): JournalEntryView => ({
  id: entry.id,
  title: decryptForUser(userId, entry.titleCipher),
  body: decryptForUser(userId, entry.bodyCipher),
  refs: decryptRefs(userId, entry.refsCipher),
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString(),
});
