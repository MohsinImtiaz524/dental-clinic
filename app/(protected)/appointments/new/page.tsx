import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinicDateKey } from "@/lib/clinic-time";
import { AppointmentForm } from "@/components/clinic-forms";
import { EmptyState, PageHeading } from "@/components/clinic-ui";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewAppointmentPage({ searchParams }: { searchParams: Promise<{ patient?: string }> }) {
  await requireUser();
  const { patient } = await searchParams;
  const patients = await db.patient.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } });
  return <><PageHeading eyebrow="Daily schedule" title="Book an appointment" description="Make space for your patient's next visit." /><Card className="max-w-xl rounded-2xl py-7 ring-[#e5ebe7]"><CardContent className="px-7">{patients.length ? <AppointmentForm patients={patients} defaultPatientId={patients.some(item => item.id === patient) ? patient : ""} today={clinicDateKey()} /> : <EmptyState icon={Users} title="Add a patient first" description="An appointment needs a patient record. Register your first patient, then book their visit." href="/patients/new" action="Register a patient" />}</CardContent></Card></>;
}
