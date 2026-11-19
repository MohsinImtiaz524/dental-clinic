import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinicDateKey, clinicLocalInput } from "@/lib/clinic-time";
import { AppointmentForm } from "@/components/clinic-forms";
import { PageHeading } from "@/components/clinic-ui";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [appointment, patients] = await Promise.all([
    db.appointment.findUnique({ where: { id }, include: { patient: true } }),
    db.patient.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
  ]);
  if (!appointment) notFound();
  return <><PageHeading eyebrow="Appointment management" title="Reschedule appointment" description={`Update the visit for ${appointment.patient.name}.`} /><Card className="max-w-2xl rounded-2xl py-7 ring-[#e5ebe7]"><CardContent className="px-7"><AppointmentForm patients={patients} today={clinicDateKey()} appointment={{ id: appointment.id, patientId: appointment.patientId, startsAt: clinicLocalInput(appointment.startsAt), durationMinutes: appointment.durationMinutes, reason: appointment.reason }} /></CardContent></Card></>;
}
