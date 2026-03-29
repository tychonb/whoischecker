import net from "node:net";

import { supportedTlds, type SupportedTld } from "@whoischecker/shared";

import { env } from "@/config/env";

import type { AvailabilityCheckRequest, AvailabilityCheckResult } from "./types";
import { getWhoisProviderConfig, type WhoisProviderConfig } from "./provider-config";

interface RdapBootstrapDocument {
  publication?: string;
  services: Array<[string[], string[]]>;
}

interface RdapBootstrapResolver {
  getServiceUrls(tld: SupportedTld): Promise<string[]>;
}

interface WhoisTransport {
  query(server: string, query: string, timeoutMs: number, port?: number): Promise<string>;
}

const FALLBACK_SUMMARY_MAX_LENGTH = 180;
const BOOTSTRAP_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function normalizeTld(tld: string) {
  return tld.replace(/^\./, "").toLowerCase();
}

function withTrailingSlash(input: string) {
  return input.endsWith("/") ? input : `${input}/`;
}

function joinDomainPath(baseUrl: string, fqdn: string) {
  return new URL(`domain/${encodeURIComponent(fqdn)}`, withTrailingSlash(baseUrl)).toString();
}

function isSupportedTld(tld: string): tld is SupportedTld {
  return supportedTlds.includes(tld as SupportedTld);
}

function summarizeTextBlock(raw: string) {
  const firstUsefulLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("%") && !line.startsWith("#"));

  if (!firstUsefulLine) {
    return "Provider gaf geen bruikbare respons terug.";
  }

  return firstUsefulLine.length > FALLBACK_SUMMARY_MAX_LENGTH
    ? `${firstUsefulLine.slice(0, FALLBACK_SUMMARY_MAX_LENGTH - 1)}…`
    : firstUsefulLine;
}

export class IanaRdapBootstrapService implements RdapBootstrapResolver {
  private cachedUrls?: Record<string, string[]>;
  private cachedAt?: number;

  constructor(
    private readonly fetchFn: typeof fetch = fetch,
    private readonly bootstrapUrl = env.RDAP_BOOTSTRAP_URL,
    private readonly cacheTtlMs = BOOTSTRAP_CACHE_TTL_MS,
  ) {}

  async getServiceUrls(tld: SupportedTld): Promise<string[]> {
    const cache = await this.readCache();
    return cache[normalizeTld(tld)] ?? [];
  }

  private async readCache() {
    if (this.cachedUrls && this.cachedAt && Date.now() - this.cachedAt < this.cacheTtlMs) {
      return this.cachedUrls;
    }

    const response = await this.fetchFn(this.bootstrapUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(env.RDAP_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`RDAP bootstrap mislukt met status ${response.status}.`);
    }

    const document = (await response.json()) as RdapBootstrapDocument;
    const cache = document.services.reduce<Record<string, string[]>>((accumulator, [tlds, urls]) => {
      const httpsUrls = urls.filter((url) => url.startsWith("https://"));

      for (const tld of tlds) {
        accumulator[tld.toLowerCase()] = httpsUrls.length > 0 ? httpsUrls : urls;
      }

      return accumulator;
    }, {});

    this.cachedUrls = cache;
    this.cachedAt = Date.now();
    return cache;
  }
}

export function mapRdapPayloadToResult(
  payload: unknown,
  context: { fqdn: string; sourceProvider: string; latencyMs: number; retryCount: number },
): AvailabilityCheckResult {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const statuses = Array.isArray(record.status) ? record.status.filter((value): value is string => typeof value === "string") : [];
  const ldhName = typeof record.ldhName === "string" ? record.ldhName : context.fqdn;
  const summary =
    statuses.length > 0
      ? `RDAP-record gevonden voor ${ldhName} met status ${statuses.join(", ")}.`
      : `RDAP-record gevonden voor ${ldhName}.`;

  return {
    status: "registered",
    rawSummary: summary,
    latencyMs: context.latencyMs,
    sourceProvider: context.sourceProvider,
    retryCount: context.retryCount,
  };
}

export class RdapLookupClient {
  constructor(
    private readonly bootstrapResolver: RdapBootstrapResolver = new IanaRdapBootstrapService(),
    private readonly fetchFn: typeof fetch = fetch,
    private readonly timeoutMs = env.RDAP_TIMEOUT_MS,
  ) {}

  async lookup(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    const urls = await this.bootstrapResolver.getServiceUrls(request.tld);

    if (urls.length === 0) {
      throw new Error(`Geen RDAP-service gevonden voor ${request.tld}.`);
    }

    let lastFailure: AvailabilityCheckResult | undefined;

    for (const baseUrl of urls) {
      const startedAt = Date.now();
      const sourceProvider = `rdap:${new URL(baseUrl).host}`;

      try {
        const response = await this.fetchFn(joinDomainPath(baseUrl, request.fqdn), {
          headers: {
            Accept: "application/rdap+json, application/json",
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        const latencyMs = Date.now() - startedAt;

        if (response.status === 404) {
          return {
            status: "available",
            rawSummary: `RDAP meldt geen registratie voor ${request.fqdn}.`,
            latencyMs,
            sourceProvider,
            retryCount: 0,
          };
        }

        if (response.status === 429) {
          return {
            status: "rate_limited",
            rawSummary: `RDAP rate limit bereikt bij ${sourceProvider}.`,
            latencyMs,
            sourceProvider,
            retryCount: 1,
          };
        }

        if (!response.ok) {
          lastFailure = {
            status: "provider_error",
            rawSummary: `RDAP-provider ${sourceProvider} reageerde met status ${response.status}.`,
            latencyMs,
            sourceProvider,
            retryCount: 1,
          };
          continue;
        }

        const payload = (await response.json()) as unknown;
        return mapRdapPayloadToResult(payload, {
          fqdn: request.fqdn,
          sourceProvider,
          latencyMs,
          retryCount: 0,
        });
      } catch (error) {
        const latencyMs = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : "Onbekende RDAP-fout";
        lastFailure = {
          status: "provider_error",
          rawSummary: `RDAP-aanvraag naar ${sourceProvider} mislukte: ${message}.`,
          latencyMs,
          sourceProvider,
          retryCount: 1,
        };
      }
    }

    return (
      lastFailure ?? {
        status: "provider_error",
        rawSummary: `Geen bruikbare RDAP-respons voor ${request.fqdn}.`,
        latencyMs: 0,
        sourceProvider: "rdap:none",
        retryCount: 1,
      }
    );
  }
}

export class TcpWhoisTransport implements WhoisTransport {
  query(server: string, query: string, timeoutMs: number, port = 43): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let settled = false;
      const socket = net.createConnection({ host: server, port });

      const finish = (callback: () => void) => {
        if (settled) {
          return;
        }

        settled = true;
        socket.destroy();
        callback();
      };

      socket.setTimeout(timeoutMs);
      socket.on("connect", () => {
        socket.write(`${query}\r\n`);
      });
      socket.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      socket.on("timeout", () => {
        finish(() => reject(new Error(`WHOIS-time-out bij ${server}.`)));
      });
      socket.on("error", (error) => {
        finish(() => reject(error));
      });
      socket.on("end", () => {
        finish(() => resolve(Buffer.concat(chunks).toString("utf8")));
      });
      socket.on("close", (hadError) => {
        if (!hadError && !settled) {
          finish(() => resolve(Buffer.concat(chunks).toString("utf8")));
        }
      });
    });
  }
}

export function parseWhoisResponse(
  fqdn: string,
  config: WhoisProviderConfig,
  response: string,
  latencyMs: number,
  retryCount: number,
): AvailabilityCheckResult {
  if (config.rateLimitedPatterns.some((pattern) => pattern.test(response))) {
    return {
      status: "rate_limited",
      rawSummary: `WHOIS-provider ${config.sourceProvider} heeft de rate limit bereikt.`,
      latencyMs,
      sourceProvider: config.sourceProvider,
      retryCount,
    };
  }

  if (config.availablePatterns.some((pattern) => pattern.test(response))) {
    return {
      status: "available",
      rawSummary: summarizeTextBlock(response) || `WHOIS meldt ${fqdn} als beschikbaar.`,
      latencyMs,
      sourceProvider: config.sourceProvider,
      retryCount,
    };
  }

  if (config.registeredPatterns.some((pattern) => pattern.test(response))) {
    return {
      status: "registered",
      rawSummary: summarizeTextBlock(response) || `WHOIS meldt ${fqdn} als geregistreerd.`,
      latencyMs,
      sourceProvider: config.sourceProvider,
      retryCount,
    };
  }

  return {
    status: "unknown",
    rawSummary: summarizeTextBlock(response),
    latencyMs,
    sourceProvider: config.sourceProvider,
    retryCount,
  };
}

export class WhoisLookupClient {
  constructor(
    private readonly transport: WhoisTransport = new TcpWhoisTransport(),
    private readonly timeoutMs = env.WHOIS_TIMEOUT_MS,
  ) {}

  async lookup(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    const config = getWhoisProviderConfig(request.tld);

    if (!config) {
      return {
        status: isSupportedTld(request.tld) ? "unknown" : "unsupported_tld",
        rawSummary: `Geen WHOIS-configuratie gevonden voor ${request.tld}.`,
        latencyMs: 0,
        sourceProvider: "whois:none",
        retryCount: 0,
      };
    }

    const startedAt = Date.now();

    try {
      const response = await this.transport.query(
        config.server,
        config.buildQuery ? config.buildQuery(request.fqdn) : request.fqdn,
        this.timeoutMs,
        config.port,
      );

      return parseWhoisResponse(request.fqdn, config, response, Date.now() - startedAt, 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Onbekende WHOIS-fout";

      return {
        status: "provider_error",
        rawSummary: `WHOIS-aanvraag via ${config.sourceProvider} mislukte: ${message}.`,
        latencyMs: Date.now() - startedAt,
        sourceProvider: config.sourceProvider,
        retryCount: 1,
      };
    }
  }
}
