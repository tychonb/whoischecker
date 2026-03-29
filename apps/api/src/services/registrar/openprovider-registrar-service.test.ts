import type { SettingsRepository } from "@/repositories/settings-repository";

import { OpenproviderRegistrarService } from "./openprovider-registrar-service";

function createSettingsRepository(
  overrides?: Partial<Pick<SettingsRepository, "get" | "getOpenproviderSecrets">>,
): SettingsRepository {
  return {
    get: vi.fn().mockResolvedValue({
      openprovider: {
        enabled: true,
        usernameConfigured: true,
        passwordConfigured: true,
        ownerHandle: "CP000000-NL",
        adminHandle: "CP000000-NL",
        techHandle: "CP000000-NL",
        billingHandle: "CP000000-NL",
        nsGroup: "op-default",
        defaultRegistrar: "Openprovider",
        testMode: false,
      },
    }),
    getOpenproviderSecrets: vi.fn().mockResolvedValue({
      username: "demo-openprovider",
      password: "demo-password",
    }),
    ...overrides,
  } as unknown as SettingsRepository;
}

function xmlReply(data = "", code = 0, description = "") {
  return `<?xml version="1.0" encoding="UTF-8"?><openXML><reply><code>${code}</code><desc>${description}</desc><data>${data}</data></reply></openXML>`;
}

describe("OpenproviderRegistrarService", () => {
  it("valideert reseller-auth, ns-group en handles", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(xmlReply("<companyName>Demo Reseller</companyName>"), { status: 200 }))
      .mockResolvedValueOnce(new Response(xmlReply("<name>op-default</name>"), { status: 200 }))
      .mockImplementation(async () => new Response(xmlReply("<handle>CP000000-NL</handle>"), { status: 200 }));

    const service = new OpenproviderRegistrarService(createSettingsRepository(), {
      fetchFn,
      timeoutMs: 1000,
    });

    const result = await service.validateCredentials();

    expect(result.ok).toBe(true);
    expect(result.responseCode).toBe("OP-VALID");
    expect(fetchFn).toHaveBeenCalledTimes(6);
  });

  it("geeft submitted terug in testmodus na een free availability-check", async () => {
    const settingsRepository = createSettingsRepository({
      get: vi.fn().mockResolvedValue({
        openprovider: {
          enabled: true,
          usernameConfigured: true,
          passwordConfigured: true,
          ownerHandle: "CP000000-NL",
          adminHandle: "CP000000-NL",
          techHandle: "CP000000-NL",
          billingHandle: "CP000000-NL",
          nsGroup: "op-default",
          defaultRegistrar: "Openprovider",
          testMode: true,
        },
      }),
    });
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(xmlReply("<item><domain>example.com</domain><status>free</status></item>"), { status: 200 }),
    );

    const service = new OpenproviderRegistrarService(settingsRepository, {
      fetchFn,
      timeoutMs: 1000,
      externalDeliveryEnabled: true,
    });

    const result = await service.registerDomain({
      domainWatchId: "watch-1",
      fqdn: "example.com",
      tld: ".com",
      idempotencyKey: "idem-1",
    });

    expect(result.status).toBe("submitted");
    expect(result.responseCode).toBe("OP-TEST-MODE");
  });

  it("registreert live via createDomainRequest wanneer externe levering actief is", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(xmlReply("<item><domain>example.com</domain><status>free</status></item>"), { status: 200 }))
      .mockResolvedValueOnce(new Response(xmlReply("<status>ACT</status>"), { status: 200 }));

    const service = new OpenproviderRegistrarService(createSettingsRepository(), {
      fetchFn,
      timeoutMs: 1000,
      externalDeliveryEnabled: true,
    });

    const result = await service.registerDomain({
      domainWatchId: "watch-1",
      fqdn: "example.com",
      tld: ".com",
      idempotencyKey: "idem-2",
    });

    expect(result.status).toBe("success");
    expect(result.responseCode).toBe("OP-200");
  });
});
