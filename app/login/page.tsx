import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getUser()) redirect("/dashboard");
  const { reset } = await searchParams;
  return <AuthShell><AuthForm mode="login" resetSuccess={reset === "success"} /></AuthShell>;
}
