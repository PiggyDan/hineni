import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { brandName, branding, localeSchema, passwordSchema, registerSchema } from "@cp/shared";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "@cp/db";
import { env } from "./env";
import { sendEmail } from "./email";
import { audit } from "./audit";

const e = env();

const mn = (locale: unknown) => locale === "mn";

export const auth = betterAuth({
  appName: branding.name.en,
  baseURL: e.BETTER_AUTH_URL ?? e.APP_URL,
  secret: e.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET ? {
    google: { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET },
  } : {},
  account: { encryptOAuthTokens: true },
  trustedOrigins: [
    e.APP_URL,
    `${branding.appScheme}://`,
    ...branding.legacyAppSchemes.map((scheme) => `${scheme}://`),
    ...e.TRUSTED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  ],
  user: {
    additionalFields: {
      // Never accepted from client input; changed only by admins server-side.
      role: { type: "string", input: false, defaultValue: "USER" },
      locale: { type: "string", input: true, defaultValue: "en", required: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: e.NODE_ENV === "production",
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      const l = (user as { locale?: string }).locale;
      await sendEmail({
        to: user.email,
        subject: mn(l) ? `${brandName("mn")}: нууц үг сэргээх` : `${brandName("en")}: reset your password`,
        text: mn(l)
          ? `Нууц үгээ сэргээхийн тулд дараах холбоосоор орно уу (1 цагийн дотор):\n${url}\n\nХэрэв та хүсэлт гаргаагүй бол энэ захидлыг үл тоомсорлоно уу.`
          : `Use this link to reset your password (valid for 1 hour):\n${url}\n\nIf you didn't request this, you can ignore this email.`,
      });
    },
    async onPasswordReset({ user }) {
      await audit({ actorId: user.id, action: "auth.password.reset", entityType: "user", entityId: user.id });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      const l = (user as { locale?: string }).locale;
      await sendEmail({
        to: user.email,
        subject: mn(l) ? `${brandName("mn")}: и-мэйлээ баталгаажуулна уу` : `${brandName("en")}: verify your email`,
        text: mn(l)
          ? `И-мэйл хаягаа баталгаажуулахын тулд дараах холбоосоор орно уу:\n${url}`
          : `Confirm your email address by opening this link:\n${url}`,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: e.NODE_ENV !== "test",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
      "/send-verification-email": { window: 300, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: e.APP_URL.startsWith("https://"),
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  telemetry: { enabled: false },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const parsed = registerSchema.safeParse(ctx.body);
        const locale = localeSchema.safeParse(ctx.body?.locale ?? "en");
        if (!parsed.success || !locale.success) throw new APIError("BAD_REQUEST", { code: "INVALID_REGISTRATION", message: "Invalid registration" });
        ctx.body = { ...ctx.body, ...parsed.data, locale: locale.data };
      }
      if (ctx.path === "/update-user" && ctx.body?.name !== undefined && !registerSchema.shape.name.safeParse(ctx.body.name).success) {
        throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Invalid name" });
      }
      if ((ctx.path === "/reset-password" || ctx.path === "/change-password") && !passwordSchema.safeParse(ctx.body?.newPassword).success) {
        throw new APIError("BAD_REQUEST", { code: "WEAK_PASSWORD", message: "Use at least 10 characters with letters and numbers" });
      }
    }),
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
