import { decryptSecret, encryptSecret, hashPassword, verifyPassword } from "./crypto";

describe("crypto utilities", () => {
  it("hashes and verifies passwords", () => {
    const hash = hashPassword("ChangeMe!123");

    expect(verifyPassword("ChangeMe!123", hash)).toBe(true);
    expect(verifyPassword("WrongPassword!123", hash)).toBe(false);
  });

  it("encrypts and decrypts provider secrets", () => {
    const encrypted = encryptSecret("secret-token-value");

    expect(decryptSecret(encrypted)).toBe("secret-token-value");
  });
});
