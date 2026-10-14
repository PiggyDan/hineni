import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./env", () => ({ env: () => ({ PERSONAL_DATA_KEY: Buffer.alloc(32, 7).toString("base64") }) }));
import { decryptForUser, encryptForUser } from "./crypto";

describe("private notes and prayers", () => {
  it("round-trips Unicode while hiding plaintext and using fresh ciphertext", () => {
    const text = "Миний хувийн залбирал"; const encrypted = encryptForUser("alice", text);
    expect(encrypted).not.toContain(text); expect(decryptForUser("alice", encrypted)).toBe(text);
    expect(encryptForUser("alice", text)).not.toBe(encrypted);
  });
  it("rejects another user's key and altered ciphertext", () => {
    const encrypted = encryptForUser("alice", "private note");
    expect(() => decryptForUser("bob", encrypted)).toThrow();
    const bytes = Buffer.from(encrypted.slice(3), "base64"); bytes[bytes.length - 1] = bytes[bytes.length - 1]! ^ 1;
    expect(() => decryptForUser("alice", `v1:${bytes.toString("base64")}`)).toThrow();
  });
});
