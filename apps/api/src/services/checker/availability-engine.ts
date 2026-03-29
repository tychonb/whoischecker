import { supportedTlds } from "@whoischecker/shared";

import type { AvailabilityCheckRequest, AvailabilityCheckResult, AvailabilityChecker } from "./types";

export class AvailabilityEngine {
  constructor(
    private readonly primaryCheckers: AvailabilityChecker[],
    private readonly fallbackChecker: AvailabilityChecker,
  ) {}

  async check(request: AvailabilityCheckRequest): Promise<AvailabilityCheckResult> {
    if (!supportedTlds.includes(request.tld)) {
      return {
        status: "unsupported_tld",
        rawSummary: `Geen checker geconfigureerd voor ${request.tld}.`,
        latencyMs: 0,
        sourceProvider: "none",
        retryCount: 0,
      };
    }

    const checker = this.primaryCheckers.find((candidate) => candidate.supports(request.tld));

    if (!checker) {
      return this.fallbackChecker.check(request);
    }

    try {
      const result = await checker.check(request);

      if (checker !== this.fallbackChecker && (result.status === "provider_error" || result.status === "unknown")) {
        return this.fallbackChecker.check(request);
      }

      return result;
    } catch {
      return this.fallbackChecker.check(request);
    }
  }
}
