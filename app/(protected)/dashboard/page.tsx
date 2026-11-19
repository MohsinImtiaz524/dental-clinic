import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCheck, Clock3, HeartPulse, UserPlus, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { formatClinicDate, formatClinicTime, initials } from "@/lib/clinic-time";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionLink, EmptyState, PageHeading, StatusBadge } from "@/components/clinic-ui";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const data = await getDashboardData(now);
  const metrics = [
    { label: "Total patients", value: data.patients, note: "Registered at your clinic", icon: Users, color: "bg-[#edf2e8] text-[#71915a]" },
    { label: "Today's appointments", value: data.appointments, note: "All bookings, including cancelled", icon: CalendarDays, color: "bg-[#e9f0f5] text-[#7097b0]" },
    { label: "Scheduled today", value: data.scheduled, note: "Awaiting consultation", icon: Clock3, color: "bg-[#fbf3e3] text-[#b6974d]" },
    { label: "Completed today", value: data.completed, note: "Consultations completed", icon: CheckCheck, color: "bg-[#edf4ed] text-[#6d9d7a]" },
  ];

  return <>
    <PageHeading eyebrow={formatClinicDate(now, true)} title={`Welcome, ${user.name}.`} description="Here's a little clarity for your day of care.">
      <ActionLink href="/patients/new">Add patient</ActionLink>
      <ActionLink href="/appointments/new" secondary>Book appointment</ActionLink>
    </PageHeading>

    <section aria-label="Dashboard statistics" className="mb-7 grid grid-cols-2 gap-4 2xl:grid-cols-4 lg:grid-cols-4">
      {metrics.map(({ label, value, note, icon: Icon, color }) => <Card key={label} className="rounded-2xl py-5 shadow-none ring-[#e5ebe7]">
        <CardContent className="px-4 sm:px-5"><div className="flex items-center justify-between gap-2"><p className="text-xs text-[#809086]">{label}</p><span className={`shrink-0 rounded-lg p-2 ${color}`}><Icon className="size-4" /></span></div><p data-testid={`metric-${label}`} className="mt-4 text-3xl font-semibold tracking-tight text-[#274736]">{value.toLocaleString("en")}</p><p className="mt-2 text-[10px] leading-5 text-[#99a49d]">{note}</p></CardContent>
      </Card>)}
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[1.8fr_1fr]">
      <section aria-labelledby="today-heading" className="min-w-0">
        <Card className="gap-0 rounded-2xl py-0 shadow-none ring-[#e5ebe7]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ed] px-6 py-5"><div><h2 id="today-heading" className="text-sm font-semibold">Today&apos;s appointments <span className="ml-2 rounded-md bg-[#f0f4ef] px-2 py-0.5 text-[10px] text-[#729078]">{data.appointments}</span></h2><p className="mt-1.5 text-[11px] text-[#98a49b]">Your schedule, at a glance · Pakistan time</p></div><Link href="/appointments" className="flex items-center gap-1 text-[11px] font-medium text-[#638468]">View schedule <ArrowRight className="size-3" /></Link></div>
          {data.todayAppointments.length ? <div className="px-3 pb-2"><Table><TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-3 text-[10px] font-normal text-[#9aa69d]">PATIENT</TableHead><TableHead className="text-[10px] font-normal text-[#9aa69d]">TIME</TableHead><TableHead className="text-[10px] font-normal text-[#9aa69d]">VISIT</TableHead><TableHead className="text-right text-[10px] font-normal text-[#9aa69d]">STATUS</TableHead></TableRow></TableHeader><TableBody>
            {data.todayAppointments.map(appointment => <TableRow key={appointment.id} className="border-[#edf0ed]"><TableCell className="py-4 pl-3"><Link href={`/patients/${appointment.patientId}`} className="flex items-center gap-3 hover:underline"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf1e8] text-[10px] font-medium text-[#71915a]">{initials(appointment.patient.name)}</span><span className="text-xs font-medium">{appointment.patient.name}</span></Link></TableCell><TableCell className="text-xs text-[#7f8e83]">{formatClinicTime(appointment.startsAt)}</TableCell><TableCell className="max-w-48 truncate text-xs text-[#7f8e83]" title={appointment.reason}>{appointment.reason}</TableCell><TableCell className="text-right"><StatusBadge status={appointment.status} /></TableCell></TableRow>)}
          </TableBody></Table></div> : <EmptyState icon={CalendarDays} title="A little room in your day" description="No appointments are booked for today. Add a booking to see your schedule here." href="/appointments/new" action="Book an appointment" />}
          {data.appointments > 6 && <Link href="/appointments" className="border-t px-6 py-3 text-center text-xs text-[#638468]">View all {data.appointments} appointments →</Link>}
        </Card>
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#e2ebe0] bg-[#edf3e9] px-6 py-5"><span className="rounded-xl bg-white/70 p-2.5 text-[#7c9b6f]"><HeartPulse className="size-5" /></span><div><p className="text-xs font-medium text-[#5e7b52]">Small moments. Meaningful care.</p><p className="mt-1 text-[11px] leading-5 text-[#8b9c80]">A clear workspace gives you more room to focus on your patients.</p></div></div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
        <section aria-labelledby="recent-heading" className="min-w-0"><Card className="gap-0 rounded-2xl py-0 shadow-none ring-[#e5ebe7]"><div className="flex items-center justify-between border-b border-[#edf0ed] px-6 py-5"><h2 id="recent-heading" className="text-sm font-semibold">Recent patients</h2><Link href="/patients" className="text-[11px] text-[#638468]">View all →</Link></div>
          {data.recentPatients.length ? <ul className="divide-y divide-[#f0f3ef] px-6">{data.recentPatients.map(patient => <li key={patient.id}><Link href={`/patients/${patient.id}`} aria-label={`Open ${patient.name} patient profile`} className="flex items-center gap-3 py-4 hover:opacity-70"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1eee5] text-[11px] font-medium text-[#a99a6d]">{initials(patient.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{patient.name}</p><p className="mt-1 text-[10px] text-[#9aa69c]">Added {formatClinicDate(patient.createdAt)}</p></div><span className="text-[10px] font-semibold text-[#638468]">Patient profile</span></Link></li>)}</ul> : <EmptyState icon={Users} title="Your first patient starts here" description="Registered patients will appear here, with the newest additions first." href="/patients/new" action="Add your first patient" />}
        </Card></section>
        <section aria-labelledby="quick-heading"><Card className="rounded-2xl py-5 shadow-none ring-[#e5ebe7]"><CardContent className="px-6"><h2 id="quick-heading" className="mb-4 text-sm font-semibold">Quick actions</h2><div className="space-y-2">{[{ href: "/patients/new", label: "Register a patient", description: "Start a new patient record", icon: UserPlus }, { href: "/appointments/new", label: "Book an appointment", description: "Make time for the next visit", icon: CalendarDays }, { href: "/appointments", label: "Open today's schedule", description: "See and manage your bookings", icon: Clock3 }].map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-[#edf1eb] p-3 transition-colors hover:bg-[#f5f8f3]"><span className="rounded-lg bg-[#f0f4eb] p-2 text-[#86a077]"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-medium">{label}</p><p className="mt-1 text-[10px] leading-4 text-[#9aa69c]">{description}</p></div><ArrowRight className="size-3 shrink-0 text-[#a4b0a4]" /></Link>)}</div></CardContent></Card></section>
      </div>
    </div>
  </>;
}

