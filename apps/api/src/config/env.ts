import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanish = z.preprocess((value) => {
  if (typeof value === "string") {
    return value === "true";
  }

  return value;
}, z.boolean());

const envSchema = z
  .object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32).default("development-only-jwt-secret-change-me"),
  SECRET_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  COOKIE_SECURE: booleanish.default(false),
  ENABLE_EXTERNAL_DELIVERY: booleanish.default(false),
  ENABLE_WORKERS: booleanish.default(false),
  ENABLE_SCHEDULER: booleanish.default(false),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RDAP_BOOTSTRAP_URL: z.string().url().default("https://data.iana.org/rdap/dns.json"),
  RDAP_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  WHOIS_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  OPENPROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  OPENPROVIDER_BASE_URL: z.string().url().default("https://api.openprovider.eu"),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(0),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== "production") {
      return;
    }

    if (value.JWT_SECRET === "development-only-jwt-secret-change-me") {
      context.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "JWT_SECRET must be configured in production." });
    }

    if (value.SECRET_ENCRYPTION_KEY === "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef") {
      context.addIssue({
        code: "custom",
        path: ["SECRET_ENCRYPTION_KEY"],
        message: "SECRET_ENCRYPTION_KEY must be configured in production.",
      });
    }

    if (!value.COOKIE_SECURE) {
      context.addIssue({ code: "custom", path: ["COOKIE_SECURE"], message: "Secure cookies are required in production." });
    }

    if (!value.FRONTEND_ORIGIN.startsWith("https://")) {
      context.addIssue({ code: "custom", path: ["FRONTEND_ORIGIN"], message: "FRONTEND_ORIGIN must use HTTPS in production." });
    }
  });

export const env = envSchema.parse(process.env);
