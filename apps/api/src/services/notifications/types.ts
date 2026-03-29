export interface NtfyNotificationPayload {
  serverUrl: string;
  topic: string;
  title: string;
  body: string;
  tags: string[];
  priority: "default" | "high" | "urgent";
  authToken?: string;
}

export interface ProviderDeliveryResult {
  status: "sent" | "failed";
  statusCode?: number;
  detail: string;
}
