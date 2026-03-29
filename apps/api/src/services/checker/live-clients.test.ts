import { AvailabilityEngine } from "./availability-engine";
import { IanaRdapBootstrapService, RdapLookupClient, WhoisLookupClient, mapRdapPayloadToResult, parseWhoisResponse } from "./live-clients";
import type { AvailabilityChecker } from "./types";
import { whoisProviderConfigs } from "./provider-config";

describe("checker clients", () => {
  it("maps a found RDAP payload to a registered result", () => {
    const result = mapRdapPayloadToResult(
      {
        ldhName: "example.com",
        status: ["active"],
      },
      {
        fqdn: "example.com",
        sourceProvider: "rdap:example.test",
        latencyMs: 120,
        retryCount: 0,
      },
    );

    expect(result.status).toBe("registered");
    expect(result.rawSummary).toContain("example.com");
  });

  it("returns available when WHOIS reports no match", () => {
    const config = whoisProviderConfigs[".com"];

    expect(config).toBeDefined();
    const result = parseWhoisResponse("example.com", config!, "No match for \"EXAMPLE.COM\"", 85, 1);

    expect(result.status).toBe("available");
  });

  it("returns registered when WHOIS reports an active domain record", () => {
    const config = whoisProviderConfigs[".nl"];

    expect(config).toBeDefined();
    const result = parseWhoisResponse("voorbeeld.nl", config!, "Domain name: voorbeeld.nl", 92, 1);

    expect(result.status).toBe("registered");
  });

  it("uses RDAP bootstrap metadata to resolve provider URLs", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          services: [[["com"], ["https://rdap.example.test/"]]],
        }),
        { status: 200 },
      ),
    );

    const bootstrap = new IanaRdapBootstrapService(fetchFn as typeof fetch, "https://bootstrap.test");
    const urls = await bootstrap.getServiceUrls(".com");

    expect(urls).toEqual(["https://rdap.example.test/"]);
  });

  it("maps RDAP 404 to available", async () => {
    const bootstrapResolver = {
      getServiceUrls: vi.fn().mockResolvedValue(["https://rdap.example.test/"]),
    };
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    const client = new RdapLookupClient(bootstrapResolver, fetchFn as typeof fetch, 1000);

    const result = await client.lookup({
      fqdn: "example.com",
      tld: ".com",
      currentStatus: "unknown",
    });

    expect(result.status).toBe("available");
  });

  it("falls back to WHOIS when the primary checker returns a provider error", async () => {
    const primary: AvailabilityChecker = {
      supports: () => true,
      check: vi.fn().mockResolvedValue({
        status: "provider_error",
        rawSummary: "primary failed",
        latencyMs: 10,
        sourceProvider: "rdap:test",
        retryCount: 1,
      }),
    };
    const fallback: AvailabilityChecker = {
      supports: () => true,
      check: vi.fn().mockResolvedValue({
        status: "registered",
        rawSummary: "fallback succeeded",
        latencyMs: 20,
        sourceProvider: "whois:test",
        retryCount: 1,
      }),
    };
    const engine = new AvailabilityEngine([primary], fallback);

    const result = await engine.check({
      fqdn: "example.com",
      tld: ".com",
      currentStatus: "unknown",
    });

    expect(result.status).toBe("registered");
    expect(fallback.check).toHaveBeenCalledOnce();
  });

  it("returns provider_error when WHOIS transport fails", async () => {
    const transport = {
      query: vi.fn().mockRejectedValue(new Error("socket hang up")),
    };
    const client = new WhoisLookupClient(transport, 1000);

    const result = await client.lookup({
      fqdn: "example.org",
      tld: ".org",
      currentStatus: "unknown",
    });

    expect(result.status).toBe("provider_error");
  });
});
