import Link from "next/link";
import { Activity, ArrowUpRight, HeartPulse, ShieldCheck } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen bg-[#f7f9f9] lg:grid-cols-[1fr_1.05fr]">
    <aside className="relative hidden overflow-hidden bg-[#103f3b] p-12 text-white lg:flex lg:flex-col xl:p-16">
      <Link href="/" className="flex items-center gap-3 text-xl font-semibold tracking-tight"><span className="rounded-xl bg-white/10 p-2.5"><HeartPulse className="size-6" /></span> Rashid Clinic<span className="ml-1 text-xs font-normal text-emerald-200/70">WORKSPACE</span></Link>
      <div className="relative z-10 my-auto max-w-lg py-20"><span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-emerald-100"><span className="size-1.5 rounded-full bg-emerald-300" /> Care starts with connection</span><h1 className="text-5xl font-medium leading-[1.15] tracking-tight xl:text-6xl">More time for<br />what matters.<br /><span className="text-[#a8d6bf]">Your patients.</span></h1><p className="mt-6 max-w-sm text-base leading-7 text-emerald-50/65">A calmer, simpler way to manage your clinic. Everything you need, in one thoughtful workspace.</p>
        <div className="mt-12 rounded-2xl border border-white/15 bg-white/[0.06] p-5"><div className="flex items-center justify-between"><span className="rounded-lg bg-[#b8dec8] p-2 text-[#103f3b]"><Activity className="size-5" /></span><ArrowUpRight className="size-4 text-emerald-100/60" /></div><p className="mt-5 text-lg font-medium">Built around your everyday</p><p className="mt-2 text-sm leading-6 text-emerald-50/60">One place to begin each day with clarity, confidence, and care.</p></div>
      </div>
      <p className="flex items-center gap-2 text-xs text-emerald-50/60"><ShieldCheck className="size-4" /> Private workspace. Secure access.</p><div className="pointer-events-none absolute -right-48 top-1/3 size-[600px] rounded-full border border-white/[0.04]" />
    </aside>
    <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12"><Link href="/" className="flex items-center gap-2 font-semibold text-[#103f3b] lg:hidden"><HeartPulse className="size-6" /> Rashid Clinic</Link><div className="m-auto w-full max-w-[400px] py-12">{children}</div><p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Rashid Clinic. All rights reserved.</p></section>
  </main>;
}
