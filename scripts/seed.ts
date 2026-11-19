import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { db } from "../lib/db";
import { hashPassword, passwordIsValid } from "../lib/password";
import { issueReset } from "../lib/auth-service";

async function writeSetupLink(userId: string) {
  if (process.env.NODE_ENV === "production") throw new Error("Use password reset email in production");
  const token = await issueReset(userId);
  await mkdir(".local", { recursive: true });
  const url = new URL(`/reset-password?token=${token}`, process.env.APP_URL || "http://localhost:3000");
  await writeFile(".local/setup-link.txt", `Open this single-use link to choose your administrator password (expires in 15 minutes):\n\n${url}\n`, { mode: 0o600 });
  console.log("Choose your password using the private link in .local/setup-link.txt. It expires in 15 minutes.");
}

async function main() {
  const existing = await db.user.findFirst();
  if (existing) {
    if (process.argv.includes("--setup-link")) await writeSetupLink(existing.id);
    else console.log("Administrator already exists. No credentials were changed.");
    return;
  }
  const email = (process.env.ADMIN_EMAIL || "admin@rashidclinic.local").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ADMIN_EMAIL must be a valid email address");
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_EMAIL) throw new Error("Set ADMIN_EMAIL before production setup");
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) throw new Error("Set ADMIN_PASSWORD before production setup");
  const password = process.env.ADMIN_PASSWORD || randomBytes(24).toString("base64url");
  if (!passwordIsValid(password)) throw new Error("ADMIN_PASSWORD must contain 12–128 characters");
  const user = await db.user.create({ data: { email, name: process.env.ADMIN_NAME || "Clinic Administrator", passwordHash: await hashPassword(password) } });
  if (!process.env.ADMIN_PASSWORD) {
    await writeSetupLink(user.id);
  } else console.log("Administrator created using the supplied credentials.");
}
main().catch(error => {
  const message = error instanceof Error ? error.message.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, "postgresql://***@") : "Unknown setup error";
  console.error(`Administrator setup failed: ${message}`);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
