import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { initials } from "@/lib/clinic-time";
import { PageHeading } from "@/components/clinic-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await requireUser();
  return <><PageHeading eyebrow="Workspace settings" title="My account" description="Your profile and workspace access." /><Card className="max-w-xl rounded-2xl py-7 ring-[#e5ebe7]"><CardContent className="space-y-7 px-7"><div className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-full bg-[#edf1e8] text-lg font-medium text-[#71915a]">{initials(user.name)}</span><div><h2 className="font-semibold">{user.name}</h2><p className="mt-1 text-xs text-muted-foreground">Clinic administrator</p></div></div><dl className="space-y-5 text-sm"><div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 break-all">{user.email}</dd></div><div><dt className="text-xs text-muted-foreground">Clinic timezone</dt><dd className="mt-1">Asia/Karachi (Pakistan Standard Time)</dd></div></dl><p className="flex items-center gap-2 rounded-xl bg-[#f1f6ef] p-4 text-xs text-[#638468]"><ShieldCheck className="size-4 shrink-0" />Your account has administrator access to this private workspace.</p><p className="text-xs leading-6 text-muted-foreground">To change a forgotten password, sign out and select &quot;Forgot password?&quot; on the sign-in page.</p><form action={logoutAction}><Button type="submit" variant="outline">Sign out of your account</Button></form></CardContent></Card></>;
}
