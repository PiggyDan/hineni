import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  TRUSTED_ORIGINS: z.string().default(""),
  PERSONAL_DATA_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "PERSONAL_DATA_KEY must be 32 bytes base64"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default("no-reply@example.org"),
  UPLOAD_DIR: z.string().default("./uploads"),
  GEOCODER_URL: z.url().default("https://nominatim.openstreetmap.org"),
  GEOCODER_EMAIL: z.string().optional(),
});

type Env = z.infer<typeof schema>;
let cached: Env | undefined;

/** Validated server environment. Throws with a clear message on misconfiguration. */
export function env(): Env {
  if (cached) return cached;
  // `next build` loads route modules to collect page data but never serves requests, so it must not
  // require production secrets. These inert placeholders never reach a running server (separate process).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return schema.parse({
      DATABASE_URL: "postgresql://build:build@localhost:5432/build",
      BETTER_AUTH_SECRET: "build-phase-placeholder-not-used-at-runtime",
      PERSONAL_DATA_KEY: Buffer.alloc(32).toString("base64"),
      ...process.env,
    });
  }
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid environment configuration:\n  ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
