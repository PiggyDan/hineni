import "server-only";
import nodemailer from "nodemailer";
import { env } from "./env";

export interface Email {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends transactional email over SMTP. Without SMTP configuration, development
 * builds log the message to the server console; production refuses to pretend.
 */
export async function sendEmail(message: Email): Promise<void> {
  const e = env();
  if (!e.SMTP_HOST) {
    if (e.NODE_ENV === "production") throw new Error("SMTP is not configured; cannot send email.");
    console.info(`\n[email:dev] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_PORT === 465,
    auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
  });
  await transport.sendMail({ from: e.EMAIL_FROM, ...message });
}
