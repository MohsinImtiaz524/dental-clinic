import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatClinicDate } from "@/lib/clinic-time";
import { PrintButton } from "@/components/print-button";
import { medicineSchedule } from "@/lib/prescriptions";

type Snapshot = {
  clinic?: { clinicName?: string; logoDataUrl?: string | null; address?: string | null; phone?: string | null; whatsapp?: string | null; email?: string | null; openingDays?: string | null; openingHours?: string | null; openingTime?: string | null; closingTime?: string | null; phcRegistrationNumber?: string | null; phcLicenseNumber?: string | null; appointmentContact?: string | null; emergencyContact?: string | null; facilities?: string | null } | null;
  doctor?: { title?: string; fullName?: string; qualifications?: string | null; specialization?: string | null; experiences?: string | null; pmdcNumber?: string | null; designation?: string | null } | null;
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
  const printImages = [rx.image1DataUrl, rx.image2DataUrl, rx.image3DataUrl].filter((image): image is string => Boolean(image));
  const imageWidth = Math.min(70, Math.max(15, rx.imageWidthMm));
  const imageHeight = Math.min(120, Math.max(15, rx.imageHeightMm));

  return <>
    <div className="rx-toolbar mx-auto mb-4 flex max-w-[210mm] justify-between print:hidden"><Link href={`/patients/${rx.patientId}`} className="rounded-lg border px-4 py-2 text-sm">Patient history</Link><div className="flex gap-2"><span className="rounded-full bg-muted px-3 py-2 text-xs font-semibold">{rx.status}</span><PrintButton /></div></div>
    <article className="prescription-print rx-page">
      <header className="rx-header">
        <div className="rx-doctor"><h1>{d.title} {d.fullName || "Doctor"}</h1><p>{[d.qualifications, d.specialization].filter(Boolean).join(" · ")}</p><p>{d.designation}</p>{experiences.map((experience, index) => <p key={index}>{experience}</p>)}</div>
        <div className="rx-logo-center">{c.logoDataUrl && <Image unoptimized src={c.logoDataUrl} alt="Clinic logo" width={120} height={120} className="rx-logo" />}</div>
        <div className="rx-clinic"><h2>{c.clinicName || "Clinic"}</h2><p>{[c.phone, c.whatsapp && `WhatsApp ${c.whatsapp}`].filter(Boolean).join(" · ")}</p>{c.openingDays && <p>{c.openingDays}</p>}{timing && <p>{timing}</p>}</div>
        <div className="rx-registrations"><span>{d.pmdcNumber ? `PMDC: ${d.pmdcNumber}` : "PMDC: —"}</span><span>{c.phcRegistrationNumber ? `PHC Registration: ${c.phcRegistrationNumber}` : "PHC Registration: —"}</span><span>{c.phcLicenseNumber ? `PHC License: ${c.phcLicenseNumber}` : "PHC License: —"}</span></div>
      </header>
      <section className="rx-patient">
        <div><span>Patient</span><b>{rx.patient.name}</b></div><div><span>Patient ID</span><b>{rx.patient.id.slice(-8).toUpperCase()}</b></div><div><span>Age / Gender</span><b>{rx.patient.age ?? "—"} / {rx.patient.gender || "—"}</b></div><div><span>Weight</span><b>{rx.patient.weightKg ? `${rx.patient.weightKg} kg` : "—"}</b></div><div><span>Contact</span><b>{rx.patient.phone || "—"}</b></div><div><span>Address</span><b>{rx.patient.address || "—"}</b></div><div><span>Date</span><b>{formatClinicDate(rx.createdAt)}</b></div><div><span>Visit</span><b>{formatClinicDate(rx.appointment.startsAt)}</b></div>
      </section>
      <section className="rx-history"><Section title="Presenting complaints" value={consultation?.presentingComplaints} /><Section title="History" value={consultation?.medicalHistory} /><Section title="Allergies" value={consultation?.allergies} /><Section title="Clinical findings" value={consultation?.clinicalFindings} /><Section title="Diagnosis" value={consultation?.diagnosis} /><Section title="Treatment / procedure" value={consultation?.procedures} /><Section title="Patient consent" value={consultation?.patientConsent ? ["Consent recorded", consultation.consentNotes].filter(Boolean).join("\n") : "Not recorded"} /><Section title="Referral" value={[consultation?.referralSpecialist, consultation?.referralReason, consultation?.referralInstructions].filter(Boolean).join("\n")} /></section>
      <main className="rx-columns" style={{gridTemplateColumns:printImages.length?`${imageWidth}mm minmax(0,1fr)`:"1fr"}}>
        {printImages.length > 0 && <aside className="rx-sidebar rx-image-sidebar">{printImages.map((src,index)=><Image key={index} unoptimized src={src} alt={`Prescription reference ${index+1}`} width={Math.round(imageWidth*3.78)} height={Math.round(imageHeight*3.78)} style={{width:`${imageWidth}mm`,height:`${imageHeight}mm`}} />)}</aside>}
        <section className="rx-main"><h2 className="rx-mark">Rx</h2>{rx.items.map((item, index) => { const urdu = medicineSchedule(item.timing)?.urdu || item.frequency; return <section className="rx-medicine" key={item.id}><h3>{index + 1}. {item.medicine} <span>{item.strength}</span></h3><dl><div><dt>Dose</dt><dd>{item.dosage}</dd></div><div><dt>Schedule</dt><dd><b>{item.timing}</b>{urdu && ` — ${urdu}`}</dd></div><div><dt>Duration</dt><dd>{item.duration}</dd></div></dl><p><b>Instructions:</b> {item.instructions}</p></section>; })}</section>
      </main>
      <footer className="rx-footer"><div className="rx-follow-up"><b>Follow-up</b><p>{rx.followUpDate ? formatClinicDate(rx.followUpDate) : "As advised"}</p>{c.emergencyContact && <p>Emergency: {c.emergencyContact}</p>}</div><div className="rx-address"><b>Clinic address</b><p>{c.address || "—"}</p></div>{c.facilities && <p className="rx-facilities"><b>Facilities:</b> {c.facilities}</p>}<p className="rx-electronic">This is an electronically generated prescription and does not require a signature.</p></footer>
    </article>
  </>;
}
