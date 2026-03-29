import type { RegistrationStatus, SupportedTld } from "@whoischecker/shared";

export interface RegistrationRequest {
  domainWatchId: string;
  fqdn: string;
  tld: SupportedTld;
  idempotencyKey: string;
}

export interface RegistrationResult {
  status: Exclude<RegistrationStatus, "pending">;
  provider: string;
  detail: string;
  metadataSummary: string;
  responseCode?: string;
}

export interface CredentialValidationResult {
  ok: boolean;
  detail: string;
  metadataSummary?: string;
  responseCode?: string;
}

export interface RegistrarService {
  registerDomain(request: RegistrationRequest): Promise<RegistrationResult>;
  validateCredentials(): Promise<CredentialValidationResult>;
}
