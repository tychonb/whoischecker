import { z } from "zod";

import {
  frequencySchema,
  monitorActionSchema,
  prioritySchema,
  roleSchema,
  supportedTlds,
} from "./types";

const httpsUrlSchema = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    context.addIssue({ code: "custom", message: "Gebruik een HTTPS-URL zonder credentials of afwijkende poort." });
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    context.addIssue({ code: "custom", message: "Lokale hosts zijn niet toegestaan." });
  }
});

const ntfyTopicSchema = z.string().min(3).max(120).regex(/^[a-zA-Z0-9_-]+$/, "Gebruik alleen letters, cijfers, _ en -.");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "Gebruik minimaal 12 tekens."),
});

export const domainWatchFormBaseSchema = z.object({
  rootName: z
    .string()
    .min(2, "Voer minimaal 2 tekens in.")
    .max(63, "Gebruik maximaal 63 tekens.")
    .regex(/^[a-z0-9-]+$/i, "Gebruik alleen letters, cijfers en koppeltekens."),
  selectedTlds: z
    .array(z.enum(supportedTlds))
    .min(1, "Kies minimaal één extensie.")
    .max(supportedTlds.length),
  frequency: frequencySchema,
  customSchedule: z.string().optional(),
  actionMode: monitorActionSchema,
  priority: prioritySchema,
  tags: z.array(z.string().min(1).max(24)).max(8),
  notes: z.string().max(400).optional(),
  ownerId: z.string().min(1),
  teamId: z.string().optional(),
  ntfyEnabled: z.boolean(),
  ntfyTopic: ntfyTopicSchema.optional(),
  autoRegisterEnabled: z.boolean(),
});

export const domainWatchFormSchema = domainWatchFormBaseSchema.superRefine((value, ctx) => {
    if (value.frequency === "custom" && !value.customSchedule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customSchedule"],
        message: "Voer een cron-achtig schema in voor custom frequenties.",
      });
    }

    if (value.actionMode === "AUTO_REGISTER" && !value.autoRegisterEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autoRegisterEnabled"],
        message: "Auto-register moet ingeschakeld zijn voor deze actie.",
      });
    }
  });

export const domainWatchPartialSchema = domainWatchFormBaseSchema.partial().superRefine((value, ctx) => {
  if (value.frequency === "custom" && "frequency" in value && !value.customSchedule) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customSchedule"],
      message: "Voer een cron-achtig schema in voor custom frequenties.",
    });
  }

  if (value.actionMode === "AUTO_REGISTER" && value.autoRegisterEnabled === false) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["autoRegisterEnabled"],
      message: "Auto-register moet ingeschakeld zijn voor deze actie.",
    });
  }
});

export const notificationSettingsSchema = z.object({
  ntfyEnabled: z.boolean(),
  ntfyServerUrl: httpsUrlSchema,
  ntfyTopic: ntfyTopicSchema,
  ntfyAuthToken: z.string().max(255).optional(),
  webhookEnabled: z.boolean(),
  webhookUrl: httpsUrlSchema.optional().or(z.literal("")),
  emailEnabled: z.boolean(),
});

export const openproviderSettingsSchema = z.object({
  enabled: z.boolean(),
  username: z.string().max(255).optional().or(z.literal("")),
  password: z.string().max(255).optional().or(z.literal("")),
  ownerHandle: z.string().min(1, "Owner handle is verplicht."),
  adminHandle: z.string().min(1, "Admin handle is verplicht."),
  techHandle: z.string().min(1, "Tech handle is verplicht."),
  billingHandle: z.string().min(1, "Billing handle is verplicht."),
  nsGroup: z.string().min(1, "NS-group is verplicht."),
  testMode: z.boolean(),
});

export const roleAssignmentSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type DomainWatchFormValues = z.infer<typeof domainWatchFormSchema>;
export type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;
export type OpenproviderSettingsValues = z.infer<typeof openproviderSettingsSchema>;
export type RoleAssignmentValues = z.infer<typeof roleAssignmentSchema>;
