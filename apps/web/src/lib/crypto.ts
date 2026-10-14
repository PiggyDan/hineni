import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { env } from "./env";

/**
 * Application-level encryption for private user content (prayers, notes).
 * AES-256-GCM with a per-user key derived via HKDF from PERSONAL_DATA_KEY, so
 * database access alone (backups, admin SQL consoles) never reveals plaintext.
 * Format: "v1:" + base64(iv[12] | tag[16] | ciphertext)
 */
const VERSION = "v1";
const keys = new Map<string, Buffer>();

function userKey(userId: string): Buffer {
  let key = keys.get(userId);
  if (!key) {
    const master = Buffer.from(env().PERSONAL_DATA_KEY, "base64");
    key = Buffer.from(hkdfSync("sha256", master, Buffer.from(userId), "personal-data:v1", 32));
    if (keys.size > 1000) keys.clear();
    keys.set(userId, key);
  }
  return key;
}

export function encryptForUser(userId: string, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", userKey(userId), iv);
  cipher.setAAD(Buffer.from(userId));
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64")}`;
}

export function decryptForUser(userId: string, payload: string): string {
  const [version, data] = payload.split(":", 2);
  if (version !== VERSION || !data) throw new Error("Unsupported ciphertext format");
  const buf = Buffer.from(data, "base64");
  const decipher = createDecipheriv("aes-256-gcm", userKey(userId), buf.subarray(0, 12));
  decipher.setAAD(Buffer.from(userId));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}
