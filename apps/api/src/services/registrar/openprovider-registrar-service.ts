import { env } from "@/config/env";
import type { SettingsRepository } from "@/repositories/settings-repository";

import type { CredentialValidationResult, RegistrarService, RegistrationRequest, RegistrationResult } from "./types";

type OpenproviderSecrets = {
  username: string;
  password: string;
};

type OpenproviderServiceOptions = {
  fetchFn?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  externalDeliveryEnabled?: boolean;
};

type DomainParts = {
  name: string;
  extension: string;
};

type CheckDomainResult = {
  domain: string;
  status: string;
  reason?: string;
  price?: number;
};

class OpenproviderApiError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly responseCode?: string,
  ) {
    super(message);
  }
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function decodeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function extractFirstTag(xml: string, tagName: string) {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match?.[1] ? decodeXml(match[1].trim()) : undefined;
}

function extractTagWithin(xml: string, tagName: string) {
  return extractFirstTag(xml, tagName);
}

function parseReplyMeta(xml: string) {
  const codeText = extractFirstTag(xml, "code");
  const code = codeText ? Number(codeText) : Number.NaN;
  const description = extractFirstTag(xml, "desc") ?? "Openprovider gaf geen foutbeschrijving terug.";

  if (!Number.isFinite(code)) {
    throw new OpenproviderApiError("Openprovider gaf geen geldige reply-code terug.", undefined, "OP-INVALID-REPLY");
  }

  return {
    code,
    description,
    dataXml: extractFirstTag(xml, "data") ?? "",
  };
}

function splitDomain(fqdn: string): DomainParts {
  if (fqdn.endsWith(".co.uk")) {
    return {
      name: fqdn.slice(0, -".co.uk".length),
      extension: "co.uk",
    };
  }

  const labels = fqdn.split(".");

  if (labels.length < 2) {
    throw new OpenproviderApiError(`Ongeldige domeinnaam voor registratie: ${fqdn}.`, undefined, "OP-INVALID-FQDN");
  }

  return {
    name: labels.slice(0, -1).join("."),
    extension: labels.at(-1) ?? "",
  };
}

function parseCheckDomainResults(dataXml: string): CheckDomainResult[] {
  const itemMatches = [...dataXml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return itemMatches.map((match) => {
    const itemXml = match[1];
    const priceText = extractTagWithin(itemXml, "price");

    return {
      domain: extractTagWithin(itemXml, "domain") ?? "",
      status: extractTagWithin(itemXml, "status") ?? "unknown",
      reason: extractTagWithin(itemXml, "reason"),
      price: priceText ? Number(priceText) : undefined,
    };
  });
}

function buildCredentialsXml(secrets: OpenproviderSecrets) {
  return [
    "<credentials>",
    `<username>${escapeXml(secrets.username)}</username>`,
    `<password>${escapeXml(secrets.password)}</password>`,
    "</credentials>",
  ].join("");
}

export class OpenproviderRegistrarService implements RegistrarService {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly externalDeliveryEnabled: boolean;

  constructor(
    private readonly settingsRepository: SettingsRepository,
    options: OpenproviderServiceOptions = {},
  ) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.baseUrl = (options.baseUrl ?? env.OPENPROVIDER_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? env.OPENPROVIDER_TIMEOUT_MS;
    this.externalDeliveryEnabled = options.externalDeliveryEnabled ?? env.ENABLE_EXTERNAL_DELIVERY;
  }

  async registerDomain(request: RegistrationRequest): Promise<RegistrationResult> {
    const [settings, secrets] = await Promise.all([this.settingsRepository.get(), this.settingsRepository.getOpenproviderSecrets()]);

    if (!settings.openprovider.enabled || !secrets) {
      return {
        status: "failed",
        provider: "openprovider-registrar",
        detail: "Openprovider-inloggegevens zijn niet geconfigureerd.",
        metadataSummary: "Registratie geblokkeerd vóór de provideraanroep.",
        responseCode: "OP-NOT-CONFIGURED",
      };
    }

    const profileError = this.getProfileValidationError(settings.openprovider);

    if (profileError) {
      return {
        status: "failed",
        provider: "openprovider-registrar",
        detail: profileError,
        metadataSummary: "Registratie geblokkeerd omdat het Openprovider-profiel onvolledig is.",
        responseCode: "OP-INCOMPLETE-PROFILE",
      };
    }

    try {
      const preflight = await this.checkAvailability(request.fqdn, secrets);

      if (preflight.price && preflight.price > 0) {
        return {
          status: "failed",
          provider: "openprovider-registrar",
          detail: `${request.fqdn} is een premium domein volgens Openprovider en vereist handmatige goedkeuring.`,
          metadataSummary: `Openprovider gaf status ${preflight.status} en premiumprijs ${preflight.price} terug.`,
          responseCode: "OP-PREMIUM-DOMAIN",
        };
      }

      if (preflight.status !== "free") {
        return {
          status: "failed",
          provider: "openprovider-registrar",
          detail: `${request.fqdn} is volgens Openprovider niet beschikbaar voor nieuwe registratie.`,
          metadataSummary: `Openprovider checkDomainRequest gaf status ${preflight.status}${preflight.reason ? ` (${preflight.reason})` : ""} terug.`,
          responseCode: "OP-NOT-AVAILABLE",
        };
      }

      if (!this.externalDeliveryEnabled || settings.openprovider.testMode) {
        return {
          status: "submitted",
          provider: "openprovider-registrar",
          detail: "Openprovider-preflight is geslaagd; live registratie is niet gestart omdat testmodus of externe levering uitstaat.",
          metadataSummary: `checkDomainRequest bevestigde ${request.fqdn} als free; idempotentiesleutel ${request.idempotencyKey}.`,
          responseCode: settings.openprovider.testMode ? "OP-TEST-MODE" : "OP-DELIVERY-DISABLED",
        };
      }

      const createStatus = await this.createDomain(request.fqdn, secrets, settings.openprovider);

      return {
        status: "success",
        provider: "openprovider-registrar",
        detail: `Openprovider heeft de registratie voor ${request.fqdn} geaccepteerd.`,
        metadataSummary: `createDomainRequest is succesvol afgerond met status ${createStatus}.`,
        responseCode: "OP-200",
      };
    } catch (error) {
      const mapped = this.mapError(error);
      return {
        status: "failed",
        provider: "openprovider-registrar",
        detail: mapped.detail,
        metadataSummary: mapped.metadataSummary ?? "Openprovider-registratie mislukte zonder aanvullende metadata.",
        responseCode: mapped.responseCode,
      };
    }
  }

  async validateCredentials(): Promise<CredentialValidationResult> {
    const [settings, secrets] = await Promise.all([this.settingsRepository.get(), this.settingsRepository.getOpenproviderSecrets()]);

    if (!secrets) {
      return {
        ok: false,
        detail: "Er zijn geen Openprovider-inloggegevens geconfigureerd.",
        responseCode: "OP-NOT-CONFIGURED",
      };
    }

    const profileError = this.getProfileValidationError(settings.openprovider);

    if (profileError) {
      return {
        ok: false,
        detail: profileError,
        metadataSummary: "Het registratieprofiel moet compleet zijn voordat live registraties veilig kunnen starten.",
        responseCode: "OP-INCOMPLETE-PROFILE",
      };
    }

    try {
      const resellerName = await this.retrieveReseller(secrets);
      await this.retrieveNsGroup(secrets, settings.openprovider.nsGroup);
      await Promise.all([
        this.retrieveCustomer(secrets, settings.openprovider.ownerHandle),
        this.retrieveCustomer(secrets, settings.openprovider.adminHandle),
        this.retrieveCustomer(secrets, settings.openprovider.techHandle),
        this.retrieveCustomer(secrets, settings.openprovider.billingHandle),
      ]);

      return {
        ok: true,
        detail: "Openprovider-authenticatie, NS-group en contacthandles zijn gevalideerd.",
        metadataSummary: `Resellerprofiel "${resellerName}" reageerde correct op retrieveResellerRequest.`,
        responseCode: "OP-VALID",
      };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private getProfileValidationError(settings: Awaited<ReturnType<SettingsRepository["get"]>>["openprovider"]) {
    if (!settings.ownerHandle || !settings.adminHandle || !settings.techHandle || !settings.billingHandle || !settings.nsGroup) {
      return "Openprovider owner/admin/tech/billing handles en NS-group zijn verplicht.";
    }

    return null;
  }

  private async retrieveReseller(secrets: OpenproviderSecrets) {
    const dataXml = await this.request(secrets, "<retrieveResellerRequest/>");
    return extractTagWithin(dataXml, "companyName") ?? extractTagWithin(dataXml, "name") ?? "Openprovider reseller";
  }

  private async retrieveCustomer(secrets: OpenproviderSecrets, handle: string) {
    const body = [
      "<retrieveCustomerRequest>",
      `<handle>${escapeXml(handle)}</handle>`,
      "</retrieveCustomerRequest>",
    ].join("");

    await this.request(secrets, body);
  }

  private async retrieveNsGroup(secrets: OpenproviderSecrets, name: string) {
    const body = [
      "<retrieveNsGroupRequest>",
      `<name>${escapeXml(name)}</name>`,
      "</retrieveNsGroupRequest>",
    ].join("");

    await this.request(secrets, body);
  }

  private async checkAvailability(fqdn: string, secrets: OpenproviderSecrets) {
    const domain = splitDomain(fqdn);
    const body = [
      "<checkDomainRequest>",
      "<domains>",
      "<item>",
      "<domain>",
      `<name>${escapeXml(domain.name)}</name>`,
      `<extension>${escapeXml(domain.extension)}</extension>`,
      "</domain>",
      "</item>",
      "</domains>",
      "</checkDomainRequest>",
    ].join("");

    const dataXml = await this.request(secrets, body);
    const result = parseCheckDomainResults(dataXml).find((item) => item.domain === fqdn) ?? parseCheckDomainResults(dataXml)[0];

    if (!result) {
      throw new OpenproviderApiError(`Openprovider gaf geen checkresultaat terug voor ${fqdn}.`, undefined, "OP-EMPTY-CHECK");
    }

    return result;
  }

  private async createDomain(
    fqdn: string,
    secrets: OpenproviderSecrets,
    settings: Awaited<ReturnType<SettingsRepository["get"]>>["openprovider"],
  ) {
    const domain = splitDomain(fqdn);
    const body = [
      "<createDomainRequest>",
      "<domain>",
      `<name>${escapeXml(domain.name)}</name>`,
      `<extension>${escapeXml(domain.extension)}</extension>`,
      "</domain>",
      "<period>1</period>",
      `<ownerHandle>${escapeXml(settings.ownerHandle)}</ownerHandle>`,
      `<adminHandle>${escapeXml(settings.adminHandle)}</adminHandle>`,
      `<techHandle>${escapeXml(settings.techHandle)}</techHandle>`,
      `<billingHandle>${escapeXml(settings.billingHandle)}</billingHandle>`,
      `<nsGroup>${escapeXml(settings.nsGroup)}</nsGroup>`,
      "</createDomainRequest>",
    ].join("");

    const dataXml = await this.request(secrets, body);
    return extractTagWithin(dataXml, "status") ?? "ACT";
  }

  private async request(secrets: OpenproviderSecrets, commandXml: string) {
    const body = `<?xml version="1.0" encoding="UTF-8"?><openXML>${buildCredentialsXml(secrets)}${commandXml}</openXML>`;
    const response = await this.fetchFn(this.baseUrl, {
      method: "POST",
      headers: {
        Accept: "application/xml",
        "Content-Type": "application/xml; charset=utf-8",
      },
      body,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new OpenproviderApiError(
        `Openprovider HTTP-fout ${response.status}.`,
        response.status,
        `OP-HTTP-${response.status}`,
      );
    }

    const reply = parseReplyMeta(responseText);

    if (reply.code !== 0) {
      throw new OpenproviderApiError(reply.description, reply.code, `OP-${reply.code}`);
    }

    return reply.dataXml;
  }

  private mapError(error: unknown): CredentialValidationResult {
    if (error instanceof OpenproviderApiError) {
      return {
        ok: false,
        detail: "Openprovider-validatie is mislukt.",
        metadataSummary: error.message,
        responseCode: error.responseCode ?? "OP-REQUEST-FAILED",
      };
    }

    return {
      ok: false,
      detail: "Openprovider-validatie kon niet worden voltooid.",
      metadataSummary: error instanceof Error ? error.message : "Onbekende fout",
      responseCode: "OP-REQUEST-FAILED",
    };
  }
}
