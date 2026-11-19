import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatClinicDate, formatClinicTime } from "@/lib/clinic-time";
import { ActionLink, EmptyState, PageHeading, StatusBadge } from "@/components/clinic-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function PatientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ existing?: string }> }) {
  await requireUser();
  const { id } = await params;
  const { existing } = await searchParams;
  const patient = await db.patient.findUnique({ where: { id }, include: {
    appointments: { orderBy: { startsAt: "desc" }, take: 50 },
    treatmentRecords: { take: 20, orderBy: { createdAt: "desc" }, include: { treatment: true, appointment: true } },
    prescriptions: { take: 20, orderBy: { createdAt: "desc" }, include: { appointment: true, _count: { select: { items: true } } } },
    _count: { select: { appointments: true, treatmentRecords: true, prescriptions: true } },
  } });
  if (!patient) notFound();

  return <>
    {existing === "1" && <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">This patient already exists, so their record was opened.</p>}
    <PageHeading eyebrow="Patient record" title={patient.name} description={`Registered ${formatClinicDate(patient.createdAt)}`}><ActionLink href={`/appointments/new?patient=${id}`} secondary>Book appointment</ActionLink></PageHeading>
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_2fr]">
      <Card><CardContent className="space-y-5 p-6"><h2 className="font-semibold">Patient details</h2><dl className="space-y-4 text-sm">
        <div><dt className="text-xs text-muted-foreground">Contact</dt><dd>{patient.phone || "Not provided"}</dd></div>
        <div className="grid grid-cols-2 gap-4"><div><dt className="text-xs text-muted-foreground">Age</dt><dd>{patient.age ?? "Not provided"}</dd></div><div><dt className="text-xs text-muted-foreground">Weight</dt><dd>{patient.weightKg ? `${patient.weightKg} kg` : "Not provided"}</dd></div></div>
        <div><dt className="text-xs text-muted-foreground">Gender</dt><dd>{patient.gender || "Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Address</dt><dd className="whitespace-pre-wrap">{patient.address || "Not provided"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Appointments</dt><dd>{patient._count.appointments}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Treatments</dt><dd>{patient._count.treatmentRecords}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Prescriptions</dt><dd>{patient._count.prescriptions}</dd></div>
      </dl></CardContent></Card>
      <Card className="min-w-0"><CardContent className="p-6"><h2 className="font-semibold">Appointments</h2>{patient.appointments.length ? <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Visit</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{patient.appointments.map(item => <TableRow key={item.id}><TableCell>{formatClinicDate(item.startsAt)}<small className="block text-muted-foreground">{formatClinicTime(item.startsAt)}</small></TableCell><TableCell>{item.reason}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell><Link className="text-[#176452] underline" href={`/appointments/${item.id}/consultation`}>Consultation</Link></TableCell></TableRow>)}</TableBody></Table> : <EmptyState icon={CalendarDays} title="No appointments yet" description="Book the patient's first visit." href={`/appointments/new?patient=${id}`} action="Book appointment" />}</CardContent></Card>
    </div>
    <Card className="mt-6"><CardContent className="p-6"><h2 className="text-lg font-semibold">Patient history</h2><div className="mt-5 grid gap-8 lg:grid-cols-2">
      <section><h3 className="text-sm font-semibold">Treatment history</h3>{patient.treatmentRecords.length ? <ul className="mt-3 divide-y">{patient.treatmentRecords.map(item => <li key={item.id} className="py-3 text-sm"><b>{item.treatment.name}</b><p className="text-xs text-muted-foreground">{formatClinicDate(item.appointment.startsAt)} · {item.appointment.reason}</p>{item.notes && <p className="mt-1 text-muted-foreground">{item.notes}</p>}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No treatments recorded.</p>}</section>
      <section><h3 className="text-sm font-semibold">Prescription history</h3>{patient.prescriptions.length ? <ul className="mt-3 divide-y">{patient.prescriptions.map(item => <li key={item.id} className="flex justify-between gap-3 py-3 text-sm"><div><b>{formatClinicDate(item.createdAt)}</b><p className="text-xs text-muted-foreground">{item._count.items} medicine(s) · {item.appointment.reason}</p></div><Link className="text-[#176452] underline" href={`/prescriptions/${item.id}`}>View</Link></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No prescriptions recorded.</p>}</section>
    </div></CardContent></Card>
  </>;
}
