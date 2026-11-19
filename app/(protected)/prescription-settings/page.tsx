import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/clinic-ui";
import { Card,CardContent } from "@/components/ui/card";
import { PrescriptionSettingsForm } from "@/components/prescription-settings-form";
export default async function Settings({searchParams}:{searchParams:Promise<{saved?:string}>}) { await requireUser(); const {saved}=await searchParams; const [clinic,doctor]=await Promise.all([db.clinicSettings.findUnique({where:{singleton:"clinic"}}),db.doctorProfile.findUnique({where:{singleton:"doctor"}})]); return <><PageHeading eyebrow="Prescription designer" title="Clinic & doctor settings" description="These details appear on new prescriptions. Finalized prescriptions keep their original snapshot."/>{saved&&<p role="status" className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Prescription settings saved.</p>}<Card className="max-w-4xl"><CardContent className="p-6"><PrescriptionSettingsForm clinic={clinic} doctor={doctor}/></CardContent></Card></>;}
