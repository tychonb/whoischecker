import { supportedTlds, type SupportedTld } from "@whoischecker/shared";

import { RdapLookupClient, WhoisLookupClient } from "./live-clients";
import type { AvailabilityCheckRequest, AvailabilityCheckResult, AvailabilityChecker } from "./types";

const nonNlTlds = supportedTlds.filter((tld) => tld !== ".nl") as SupportedTld[];

export class NlWhoisChecker implements AvailabilityChecker {
  constructor(private readonly rdapClient = new RdapLookupClient()) {}

  supports(tld: SupportedTld) {
    return tld === ".nl";
  }

  check(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    return this.rdapClient.lookup(request);
  }
}

export class GenericWhoisChecker implements AvailabilityChecker {
  constructor(private readonly rdapClient = new RdapLookupClient()) {}

  supports(tld: SupportedTld) {
    return nonNlTlds.includes(tld);
  }

  check(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    return this.rdapClient.lookup(request);
  }
}

export class FallbackWhoisChecker implements AvailabilityChecker {
  constructor(private readonly whoisClient = new WhoisLookupClient()) {}

  supports() {
    return true;
  }

  check(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    return this.whoisClient.lookup(request);
  }
}
