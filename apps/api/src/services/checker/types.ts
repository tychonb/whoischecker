import type { AvailabilityStatus, SupportedTld } from "@whoischecker/shared";

export interface AvailabilityCheckRequest {
  fqdn: string;
  tld: SupportedTld;
  currentStatus: AvailabilityStatus;
}

export interface AvailabilityCheckResult {
  status: AvailabilityStatus;
  rawSummary: string;
  latencyMs: number;
  sourceProvider: string;
  retryCount: number;
}

export interface AvailabilityChecker {
  supports(tld: SupportedTld): boolean;
  check(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult>;
}
