import type { SessionUser } from "@whoischecker/shared";

import { assertSafeExternalUrl } from "./safe-external-url";
import { domainWatchScope } from "./authorization-scope";

function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user-1",
    name: "Gebruiker",
    email: "user@example.com",
    role: "VIEWER",
    teamId: "team-1",
    lastLoginAt: new Date(0).toISOString(),
    ntfyEnabled: false,
    ...overrides,
  };
}

describe("security hardening", () => {
  it("beperkt niet-beheerders tot eigen of teamdomeinen", () => {
    expect(domainWatchScope(sessionUser())).toEqual({
      OR: [{ ownerId: "user-1" }, { teamId: "team-1" }],
    });
    expect(domainWatchScope(sessionUser({ role: "ADMIN" }))).toEqual({});
  });

  it.each([
    "http://ntfy.sh",
    "https://localhost",
    "https://127.0.0.1",
    "https://169.254.169.254",
    "https://10.0.0.1",
    "https://user:password@example.com",
  ])("blokkeert onveilige outbound URL %s", async (url) => {
    await expect(assertSafeExternalUrl(url)).rejects.toThrow();
  });

  it("accepteert een publiek HTTPS-adres", async () => {
    await expect(assertSafeExternalUrl("https://1.1.1.1")).resolves.toBeInstanceOf(URL);
  });
});
