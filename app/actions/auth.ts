"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authenticate, changePassword, consumeLimit, createSession, issueReset, SESSION_SECONDS } from "@/lib/auth-service";
import { SESSION_COOKIE } from "@/lib/auth";
import { passwordIsValid, tokenHash } from "@/lib/password";
import { sendResetEmail } from "@/lib/mail";

export type AuthState = { error?: string; success?: string };
const field = (form: FormData, name: string) => String(form.get(name) ?? "");
const validEmail = (email: string) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim().toLowerCase();
  const password = field(form, "password");
  if (!validEmail(email) || !password || password.length > 128) return { error: "Enter a valid email and password." };
  let token: string;
  try {
    if (!await consumeLimit(`login:${email}`, 10)) return { error: "Too many attempts. Please try again in 15 minutes." };
    const user = await authenticate(email, password);
    if (!user) return { error: "The email or password is incorrect." };
    token = await createSession(user.id);
  } catch { return { error: "Unable to sign in right now. Please try again." }; }
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
  redirect("/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function forgotPasswordAction(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email").trim().toLowerCase();
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  let localResetToken: string | undefined;
  try {
    if (await consumeLimit(`reset:${email}`, 3)) {
      const user = await db.user.findUnique({ where: { email } });
      if (user) {
        const token = await issueReset(user.id);
        if (process.env.NODE_ENV !== "production") localResetToken = token;
        else {
          try { await sendResetEmail(email, token); }
          catch {
            await db.passwordReset.deleteMany({ where: { tokenHash: tokenHash(token) } });
            console.error("Password reset email could not be delivered. Check mail configuration.");
          }
        }
      }
    }
  } catch { return { error: "Unable to process your request. Please try again shortly." }; }
  if (localResetToken) redirect(`/reset-password?token=${localResetToken}`);
  return { success: "If this email belongs to your account, a password reset link has been sent. Check your inbox and spam folder." };
}

export async function resetPasswordAction(_: AuthState, form: FormData): Promise<AuthState> {
  const password = field(form, "password");
  const token = field(form, "token");
  if (!passwordIsValid(password)) return { error: "Use between 12 and 128 characters for your password." };
  if (password !== field(form, "confirmPassword")) return { error: "Your passwords do not match." };
  try {
    if (!await consumeLimit(`reset-token:${token.slice(0, 128)}`, 10)) return { error: "Too many attempts. Please request a new reset link." };
    if (!await changePassword(token, password)) return { error: "This link is invalid or has expired. Please request a new one." };
  } catch { return { error: "Unable to change your password. Please try again." }; }
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?reset=success");
}
