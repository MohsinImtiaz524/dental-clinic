"use client";
import { useActionState } from "react";
import type { ClinicSettings, DoctorProfile } from "@/lib/generated/prisma/client";
import { savePrescriptionSettingsAction } from "@/app/actions/prescription-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Field({label,name,value,required=false}:{label:string;name:string;value?:string|null;required?:boolean}) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} defaultValue={value||""} required={required}/></div>; }

export function PrescriptionSettingsForm({clinic,doctor}:{clinic:ClinicSettings|null;doctor:DoctorProfile|null}) {
  const [state,action,pending]=useActionState(savePrescriptionSettingsAction,{});
  return <form action={action} className="space-y-8">
    <section><h2 className="mb-4 font-semibold">Doctor information</h2><div className="grid gap-4 md:grid-cols-2">
      <Field label="Title" name="title" value={doctor?.title||"Dr."}/><Field label="Doctor's full name" name="fullName" value={doctor?.fullName} required/><Field label="Qualifications" name="qualifications" value={doctor?.qualifications}/><Field label="Specialization" name="specialization" value={doctor?.specialization}/><Field label="PMDC registration number" name="pmdcNumber" value={doctor?.pmdcNumber}/><Field label="Professional designation" name="designation" value={doctor?.designation}/><div className="space-y-2 md:col-span-2"><Label htmlFor="signature">Signature image (PNG/JPG/WebP, max 1 MB)</Label><Input id="signature" name="signature" type="file" accept="image/png,image/jpeg,image/webp"/></div>
    </div></section>
    <section><h2 className="mb-4 font-semibold">Clinic information</h2><div className="grid gap-4 md:grid-cols-2">
      <Field label="Clinic name" name="clinicName" value={clinic?.clinicName} required/><Field label="Phone" name="phone" value={clinic?.phone}/><Field label="WhatsApp" name="whatsapp" value={clinic?.whatsapp}/><Field label="Email" name="email" value={clinic?.email}/><Field label="Opening days" name="openingDays" value={clinic?.openingDays}/><Field label="Opening hours" name="openingHours" value={clinic?.openingHours}/><Field label="Break timings" name="breakTimings" value={clinic?.breakTimings}/><Field label="Appointment contact" name="appointmentContact" value={clinic?.appointmentContact}/><Field label="Emergency contact" name="emergencyContact" value={clinic?.emergencyContact}/><div className="space-y-2"><Label htmlFor="logo">Clinic logo (PNG/JPG/WebP, max 1 MB)</Label><Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp"/></div><div className="space-y-2 md:col-span-2"><Label htmlFor="address">Complete clinic address</Label><textarea id="address" name="address" defaultValue={clinic?.address||""} rows={3} className="w-full rounded-lg border p-3 text-sm"/></div>
    </div></section>
    {state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}<Button type="submit" disabled={pending}>{pending?"Saving…":"Save prescription settings"}</Button>
  </form>;
}
