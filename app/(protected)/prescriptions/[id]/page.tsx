import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatClinicDate } from "@/lib/clinic-time";
import { PrintButton } from "@/components/print-button";

type Snapshot = {
  clinic?: { clinicName?: string; logoDataUrl?: string | null; address?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null; openingDays?: string | null; openingHours?: string | null; openingTime?: string | null; closingTime?: string | null; phcRegistrationNumber?: string | null; phcLicenseNumber?: string | null; appointmentContact?: string | null; emergencyContact?: string | null } | null;
  doctor?: { title?: string; fullName?: string; qualifications?: string | null; specialization?: string | null; experiences?: string | null; pmdcNumber?: string | null; designation?: string | null; signatureDataUrl?: string | null } | null;
};

const Section = ({ title, value }: { title: string; value?: string | null }) => <section className="rx-side-section"><h3>{title}</h3><p>{value?.trim() || "—"}</p></section>;

export default async function PrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const rx = await db.prescription.findUnique({ where: { id }, include: { patient: true, appointment: { include: { consultation: true } }, items: { orderBy: { sortOrder: "asc" } } } });
  if (!rx) notFound();
  let snapshot: Snapshot = {};
  try { snapshot = JSON.parse(rx.profileSnapshot || "{}"); } catch {}
  const c = snapshot.clinic || {};
  const d = snapshot.doctor || {};
  const experiences = d.experiences?.split(/\r?\n/).map(item => item.trim()).filter(Boolean) || [];
  const timing = [c.openingTime && `Opening: ${c.openingTime}`, c.closingTime && `Closing: ${c.closingTime}`].filter(Boolean).join(" · ") || c.openingHours;
  const consultation = rx.appointment.consultation;

  return <>
    <div className="rx-toolbar mx-auto mb-4 flex max-w-[210mm] justify-between print:hidden"><Link href={`/patients/${rx.patientId}`} className="rounded-lg border px-4 py-2 text-sm">Patient history</Link><div className="flex gap-2"><span className="rounded-full bg-muted px-3 py-2 text-xs font-semibold">{rx.status}</span><PrintButton /></div></div>
    <article className="prescription-print rx-page">
      <header className="rx-header">
        {c.logoDataUrl && <Image unoptimized src={c.logoDataUrl} alt="Clinic logo" width={78} height={78} className="rx-logo" />}
        <div className="rx-doctor"><h1>{d.title} {d.fullName || "Doctor"}</h1><p>{[d.qualifications, d.specialization].filter(Boolean).join(" · ")}</p><p>{d.designation}</p>{experiences.map((experience, index) => <p key={index}>{experience}</p>)}</div>
        <div className="rx-clinic"><h2>{c.clinicName || "Clinic"}</h2><p>{c.address}</p><p>{[c.phone, c.whatsapp && `WhatsApp ${c.whatsapp}`].filter(Boolean).join(" · ")}</p><p>{[d.pmdcNumber && `PMDC: ${d.pmdcNumber}`, c.phcRegistrationNumber && `PHC Registration: ${c.phcRegistrationNumber}`, c.phcLicenseNumber && `PHC License: ${c.phcLicenseNumber}`].filter(Boolean).join(" · ")}</p><p>{[c.openingDays, timing].filter(Boolean).join(" · ")}</p></div>
      </header>
      <section className="rx-patient">
        <div><span>Patient</span><b>{rx.patient.name}</b></div><div><span>Patient ID</span><b>{rx.patient.id.slice(-8).toUpperCase()}</b></div><div><span>Age / Gender</span><b>{rx.patient.age ?? "—"} / {rx.patient.gender || "—"}</b></div><div><span>Weight</span><b>{rx.patient.weightKg ? `${rx.patient.weightKg} kg` : "—"}</b></div><div><span>Contact</span><b>{rx.patient.phone || "—"}</b></div><div><span>Address</span><b>{rx.patient.address || "—"}</b></div><div><span>Date</span><b>{formatClinicDate(rx.createdAt)}</b></div><div><span>Visit</span><b>{formatClinicDate(rx.appointment.startsAt)}</b></div>
      </section>
      <main className="rx-columns">
        <aside className="rx-sidebar"><Section title="Medical history" value={consultation?.medicalHistory} /><Section title="Allergies" value={consultation?.allergies} /><Section title="Current medications" value={consultation?.currentMedications} /><Section title="Dental history" value={consultation?.dentalHistory} /><Section title="Clinical findings" value={consultation?.clinicalFindings} /><Section title="Tooth numbers" value={consultation?.toothNumbers} /><Section title="Diagnosis" value={consultation?.diagnosis} /><Section title="Treatment / procedure" value={consultation?.procedures} /><Section title="Patient consent" value={consultation?.patientConsent ? ["Consent recorded", consultation.consentNotes].filter(Boolean).join("\n") : "Not recorded"} /><Section title="Referral" value={[consultation?.referralSpecialist, consultation?.referralReason, consultation?.referralInstructions].filter(Boolean).join("\n")} /></aside>
        <section className="rx-main"><h2 className="rx-mark">Rx</h2>{rx.items.map((item, index) => <section className="rx-medicine" key={item.id}><h3>{index + 1}. {item.medicine} <span>{item.strength}</span></h3><dl><div><dt>Dosage</dt><dd>{item.dosage}</dd></div><div><dt>Route</dt><dd>{item.route}</dd></div><div><dt>Frequency</dt><dd>{item.frequency}</dd></div><div><dt>Timing</dt><dd>{item.timing}</dd></div><div><dt>Duration</dt><dd>{item.duration}</dd></div><div><dt>Quantity</dt><dd>{item.quantity}</dd></div></dl><p><b>Instructions:</b> {item.instructions}</p></section>)}{rx.notes && <section className="rx-notes"><h3>Doctor&apos;s notes</h3><p>{rx.notes}</p></section>}</section>
      </main>
      <footer className="rx-footer"><div><b>Follow-up</b><p>{rx.followUpDate ? formatClinicDate(rx.followUpDate) : "As advised"}</p>{c.emergencyContact && <p>Emergency: {c.emergencyContact}</p>}</div><div className="rx-signature">{d.signatureDataUrl && <Image unoptimized src={d.signatureDataUrl} alt="Doctor signature" width={140} height={48} />}<span>{d.title} {d.fullName}</span><small>{d.qualifications}</small></div></footer>
    </article>
  </>;
}
