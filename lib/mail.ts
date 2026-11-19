import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function sendResetEmail(email: string, token: string) {
  const origin = process.env.APP_URL || "http://localhost:3000";
  const url = new URL(`/reset-password?token=${token}`, origin).toString();
  const text = `Reset your Rashid Clinic password\n\n${url}\n\nThis link expires in 15 minutes and can only be used once. If you did not request this, ignore this email.`;
  if (process.env.MAIL_DELIVERY === "file" && process.env.NODE_ENV !== "production") {
    const folder = path.join(process.cwd(), ".local", "mail");
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, "password-reset.txt"), `To: ${email}\n\n${text}`, { mode: 0o600 });
    return;
  }
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !process.env.APP_URL) throw new Error("Email delivery is not configured");
  if (process.env.NODE_ENV === "production" && new URL(origin).protocol !== "https:") throw new Error("APP_URL must use HTTPS");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [email], subject: "Reset your Rashid Clinic password", text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Reset email delivery failed");
}
