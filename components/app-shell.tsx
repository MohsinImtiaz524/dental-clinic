"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardPlus, HeartPulse, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck, SlidersHorizontal, Users, X } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";
import { initials } from "@/lib/clinic-time";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/treatments", label: "Treatments", icon: ClipboardPlus },
  { href: "/prescription-settings", label: "Rx settings", icon: SlidersHorizontal },
  { href: "/profile", label: "My account", icon: Settings2 },
];

function Navigation({ pathname, onNavigate, mobile = false }: { pathname: string; onNavigate: () => void; mobile?: boolean }) {
    return <nav aria-label={mobile ? "Mobile navigation" : "Main navigation"} className="space-y-2">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return <Link key={href} href={href} title={label} aria-label={label} onClick={onNavigate} aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${active ? "bg-[#e5efe9] text-[#176452]" : "text-[#6b7d76] hover:bg-[#f1f5f2] hover:text-[#176452]"}`}>
          <Icon className="size-[19px] shrink-0" /><span className={mobile ? "" : "md:hidden xl:inline"}>{label}</span>
        </Link>;
      })}
    </nav>;
}

export function AppShell({ user, children }: {
  user: { name: string; email: string }; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = navigation.find(item => pathname.startsWith(item.href));

  return <Dialog.Root open={open} onOpenChange={setOpen}><div className="min-h-screen bg-[#f6f8f7] text-[#193c33]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-[#e5ebe7] bg-white px-4 py-7 md:flex xl:w-60 xl:px-6">
      <Link href="/dashboard" title="Rashid Clinic home" className="mb-12 flex items-center gap-3 font-semibold tracking-tight"><span className="rounded-xl bg-[#164f40] p-2.5 text-white"><HeartPulse className="size-5" /></span><span className="hidden xl:inline">Rashid Clinic<span className="mt-1 block text-[9px] font-medium tracking-[0.2em] text-[#81958a]">CLINIC WORKSPACE</span></span></Link>
      <p className="mb-4 hidden px-3 text-[10px] font-semibold tracking-[0.16em] text-[#95a39c] xl:block">WORKSPACE</p>
      <Navigation pathname={pathname} onNavigate={() => setOpen(false)} />
      <div className="mt-auto"><div className="mb-6 hidden rounded-xl border border-[#e7eee8] bg-[#f7faf8] p-4 xl:block"><ShieldCheck className="mb-3 size-5 text-[#4d8065]" /><p className="text-xs font-semibold">A little more peace of mind.</p><p className="mt-2 text-xs leading-5 text-[#7c8d82]">Your clinic, connected in one private workspace.</p></div><form action={logoutAction}><Button variant="ghost" type="submit" aria-label="Sign out" className="w-full justify-start text-[#6b7d76]"><LogOut className="size-4" /><span className="hidden xl:inline">Sign out</span></Button></form></div>
    </aside>
    <Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-40 bg-black/30" /><Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-6 text-[#193c33] shadow-xl"><div className="mb-8 flex items-center justify-between"><Dialog.Title className="font-semibold">Rashid Clinic</Dialog.Title><Dialog.Close render={<Button variant="ghost" size="icon" aria-label="Close navigation" />}><X /></Dialog.Close></div><Dialog.Description className="sr-only">Navigate your clinic workspace.</Dialog.Description><Navigation pathname={pathname} onNavigate={() => setOpen(false)} mobile /><form className="mt-auto" action={logoutAction}><Button type="submit" variant="outline"><LogOut />Sign out</Button></form></Dialog.Popup></Dialog.Portal>
    <div className="md:pl-20 xl:pl-60">
      <header className="flex min-h-20 items-center justify-between gap-3 border-b border-[#e5ebe7] bg-white px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3"><Dialog.Trigger render={<Button className="md:hidden" variant="ghost" size="icon" aria-label="Open navigation" />}><Menu /></Dialog.Trigger><span className="text-sm text-[#8b9b91]">Workspace <span className="mx-2 text-[#c8d1cc]">/</span><span className="font-medium text-[#304d3e]">{current?.label || "Dashboard"}</span></span></div>
        <Link href="/profile" className="flex min-w-0 items-center gap-3 rounded-xl p-1.5 hover:bg-[#f6f8f7]" aria-label="Open your profile"><div className="hidden text-right sm:block"><p className="max-w-48 truncate text-xs font-semibold">{user.name}</p><p className="mt-1 text-[10px] text-[#8b9b91]">Administrator</p></div><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9efe4] text-xs font-semibold text-[#52744d]">{initials(user.name)}</span></Link>
      </header>
      <main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      <footer className="mx-5 flex flex-wrap justify-between gap-2 border-t border-[#e5ebe7] py-5 text-[10px] text-[#91a096] sm:mx-8 lg:mx-10"><span>© {new Date().getFullYear()} Rashid Clinic</span><span>Thoughtful care. Every day.</span></footer>
    </div>
  </div></Dialog.Root>;
}
