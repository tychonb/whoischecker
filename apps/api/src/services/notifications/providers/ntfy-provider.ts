import { env } from "@/config/env";
import { assertSafeExternalUrl } from "@/utils/safe-external-url";

import type { NtfyNotificationPayload, ProviderDeliveryResult } from "../types";

export class NtfyProvider {
  async send(payload: NtfyNotificationPayload): Promise<ProviderDeliveryResult> {
    if (!env.ENABLE_EXTERNAL_DELIVERY) {
      return {
        status: "sent",
        detail: `Mock-ntfy-aflevering in wachtrij geplaatst naar ${payload.serverUrl}/${payload.topic}.`,
      };
    }

    const serverUrl = await assertSafeExternalUrl(payload.serverUrl);
    const endpoint = new URL(`${serverUrl.pathname.replace(/\/$/, "")}/${encodeURIComponent(payload.topic)}`, serverUrl.origin);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Title: payload.title,
        Tags: payload.tags.join(","),
        Priority: payload.priority,
        ...(payload.authToken ? { Authorization: `Bearer ${payload.authToken}` } : {}),
      },
      body: payload.body,
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        status: "failed",
        statusCode: response.status,
        detail: `ntfy-aanvraag mislukt met status ${response.status}.`,
      };
    }

    return {
      status: "sent",
      statusCode: response.status,
      detail: "Notificatie afgeleverd bij ntfy.",
    };
  }
}
