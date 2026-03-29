import type { SupportedTld } from "@whoischecker/shared";

export interface WhoisProviderConfig {
  sourceProvider: string;
  server: string;
  port?: number;
  buildQuery?: (fqdn: string) => string;
  availablePatterns: RegExp[];
  registeredPatterns: RegExp[];
  rateLimitedPatterns: RegExp[];
}

const sharedRateLimitedPatterns = [
  /limit exceeded/i,
  /too many requests/i,
  /query rate limit exceeded/i,
  /exceeded the maximum allowable number of queries/i,
  /access denied/i,
  /temporarily unavailable/i,
];

export const whoisProviderConfigs: Partial<Record<SupportedTld, WhoisProviderConfig>> = {
  ".nl": {
    sourceProvider: "sidn-whois",
    server: "whois.domain-registry.nl",
    availablePatterns: [/is free/i],
    registeredPatterns: [/^domain name:/im, /^status:\s+active/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".com": {
    sourceProvider: "verisign-whois",
    server: "whois.verisign-grs.com",
    availablePatterns: [/no match for/i],
    registeredPatterns: [/^domain name:/im, /^registry domain id:/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".net": {
    sourceProvider: "verisign-whois",
    server: "whois.verisign-grs.com",
    availablePatterns: [/no match for/i],
    registeredPatterns: [/^domain name:/im, /^registry domain id:/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".org": {
    sourceProvider: "pir-whois",
    server: "whois.pir.org",
    availablePatterns: [/not found/i, /no match/i],
    registeredPatterns: [/^domain name:/im, /^registry domain id:/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".io": {
    sourceProvider: "nic-io-whois",
    server: "whois.nic.io",
    availablePatterns: [/is available for registration/i, /domain not found/i, /not found/i],
    registeredPatterns: [/^domain name:/im, /^registry domain id:/im, /^registrar:/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".eu": {
    sourceProvider: "eurid-whois",
    server: "whois.eu",
    availablePatterns: [/status:\s+available/i, /not found/i],
    registeredPatterns: [/domain:/i, /registrant:/i, /status:\s+(?!available)/i],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".be": {
    sourceProvider: "dns-belgium-whois",
    server: "whois.dns.be",
    availablePatterns: [/status:\s+available/i, /no such domain/i, /not found/i],
    registeredPatterns: [/domain:\s+/i, /status:\s+(?!available)/i],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".de": {
    sourceProvider: "denic-whois",
    server: "whois.denic.de",
    buildQuery: (fqdn) => `-T dn,ace ${fqdn}`,
    availablePatterns: [/status:\s+free/i],
    registeredPatterns: [/status:\s+(?!free)/i, /^domain:/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".fr": {
    sourceProvider: "afnic-whois",
    server: "whois.nic.fr",
    availablePatterns: [/no entries found/i, /not found/i],
    registeredPatterns: [/domain:\s+/i, /registrar:/i],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
  ".co.uk": {
    sourceProvider: "nominet-whois",
    server: "whois.nic.uk",
    availablePatterns: [/no match for/i, /not registered/i],
    registeredPatterns: [/registered on:/i, /^domain name:/im, /^registrar:/im],
    rateLimitedPatterns: sharedRateLimitedPatterns,
  },
};

export function getWhoisProviderConfig(tld: SupportedTld) {
  return whoisProviderConfigs[tld];
}
