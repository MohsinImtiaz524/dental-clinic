"use client";
import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, CheckCircle2 } from "lucide-react";
import { loginAction, forgotPasswordAction, resetPasswordAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const subscribe = () => () => {};

export function AuthForm({ mode, token, resetSuccess, localDirectReset = false }: { mode: "login" | "forgot" | "reset"; token?: string; resetSuccess?: boolean; localDirectReset?: boolean }) {
  const [visible, setVisible] = useState(false);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const action = mode === "login" ? loginAction : mode === "forgot" ? forgotPasswordAction : resetPasswordAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const title = mode === "login" ? "Welcome back" : mode === "forgot" ? "Forgot your password?" : "Set a new password";
  return <><p className="mb-3 text-xs font-semibold tracking-[0.16em] text-[#387365]">YOUR CLINIC, CONNECTED</p><h2 className="text-3xl font-semibold tracking-tight text-[#173b35]">{title}</h2><p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">{mode === "login" ? "Sign in to your workspace to get started." : mode === "forgot" ? localDirectReset ? "Enter your administrator email to choose a new password on this local development app." : "Enter your account email. We’ll send you a secure link to reset your password." : "Choose a strong password to secure your workspace."}</p>
    {resetSuccess && <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Password updated. Sign in with your new password.</p>}
    {state.success ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900"><CheckCircle2 className="mb-3 size-6" />{state.success}</div> : <form action={formAction}><fieldset className="space-y-5" disabled={!hydrated || pending}>
      {mode !== "reset" && <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input className="h-11 bg-white" id="email" name="email" type="email" placeholder="you@clinic.com" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} /></div>}
      {mode !== "forgot" && <><div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">{mode === "reset" ? "New password" : "Password"}</Label>{mode === "login" && <Link href="/forgot-password" className="text-xs font-medium text-[#387365] hover:underline">Forgot password?</Link>}</div><div className="relative"><Input className="h-11 bg-white pr-12" id="password" name="password" value={password} onChange={event => setPassword(event.target.value)} type={visible ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "reset" ? 12 : 1} maxLength={128} placeholder={mode === "reset" ? "At least 12 characters" : "Enter your password"} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="absolute inset-y-0 right-0 px-3 text-muted-foreground focus-visible:outline-2">{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>{mode === "reset" && <><input type="hidden" name="token" value={token} /><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm new password</Label><Input className="h-11 bg-white" id="confirmPassword" name="confirmPassword" value={confirmation} onChange={event => setConfirmation(event.target.value)} type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></div><p className="text-xs text-muted-foreground">Use 12–128 characters. A long, unique passphrase works well.</p></>}</>}
      {state.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-11 w-full bg-[#176452] text-white hover:bg-[#103f3b]">{pending ? <><LoaderCircle className="size-4 animate-spin" /> Please wait…</> : <>{mode === "login" ? "Sign in to workspace" : mode === "forgot" ? localDirectReset ? "Continue to change password" : "Send reset link" : "Update password"}<ArrowRight className="size-4" /></>}</Button>
    </fieldset></form>}
    <div className="mt-7 border-t pt-6 text-center text-xs leading-6 text-muted-foreground">{mode === "login" ? "This workspace is for authorized clinic staff only." : <Link href="/login" className="font-medium text-[#387365] hover:underline">← Back to sign in</Link>}</div>
  </>;
}

