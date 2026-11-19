import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
export default function ForgotPasswordPage() { return <AuthShell><AuthForm mode="forgot" localDirectReset={process.env.NODE_ENV !== "production"} /></AuthShell>; }
