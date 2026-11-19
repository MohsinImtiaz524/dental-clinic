import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { resetIsValid } from "@/lib/auth-service";
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <AuthShell>{token && await resetIsValid(token) ? <AuthForm mode="reset" token={token} /> : <><h2 className="text-2xl font-semibold text-[#173b35]">This link is no longer valid</h2><p className="my-4 text-sm leading-6 text-muted-foreground">Password reset links expire after 15 minutes and can only be used once.</p><Link href="/forgot-password" className="text-sm font-medium text-[#176452] underline">Request a new reset link</Link></>}</AuthShell>;
}
