import { notFound } from "next/navigation";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeading, StatusBadge } from "@/components/clinic-ui";
import { ConsultationPanelForm } from "@/components/treatment-forms";
import { ConsultationSavePopup } from "@/components/consultation-save-popup";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function ConsultationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string}>}) {
  await requireUser(); const {id}=await params; const {saved}=await searchParams;
  const [appointment,treatments]=await Promise.all([
    db.appointment.findUnique({where:{id},include:{patient:true,consultation:true,treatmentRecords:{include:{treatment:true},orderBy:{createdAt:"desc"}},prescriptions:{include:{_count:{select:{items:true}}},orderBy:{createdAt:"desc"}}}}),
    db.treatmentCatalog.findMany({where:{active:true},orderBy:{name:"asc"},select:{id:true,name:true}})
  ]);
  if(!appointment) notFound(); const printable=appointment.prescriptions.find(item=>item._count.items>0);
  return <>{saved&&<ConsultationSavePopup appointmentId={id} prescriptionId={printable?.id}/>}<PageHeading title={appointment.patient.name} description=""><Link href={`/patients/${appointment.patientId}`} className={buttonVariants({variant:"outline"})}><UserRound/>Patient profile</Link><StatusBadge status={appointment.status}/></PageHeading><Card className="max-w-5xl"><CardContent className="p-6"><ConsultationPanelForm appointmentId={id} consultation={appointment.consultation} treatments={treatments}/></CardContent></Card><div className="mt-6 grid gap-6 md:grid-cols-2"><Card><CardContent className="p-6"><h2 className="font-semibold">Treatment history</h2>{appointment.treatmentRecords.length?appointment.treatmentRecords.map(item=><div key={item.id} className="border-b py-3 text-sm"><b>{item.treatment.name}</b>{item.notes&&<p className="text-muted-foreground">{item.notes}</p>}</div>):<p className="mt-3 text-sm text-muted-foreground">No treatments saved.</p>}</CardContent></Card><Card><CardContent className="p-6"><h2 className="font-semibold">Saved prescriptions</h2>{appointment.prescriptions.length?appointment.prescriptions.map(item=><div key={item.id} className="mt-3 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"><Link href={`/prescriptions/${item.id}`}>{item.status==="DRAFT"?"Draft":"Finalized"} · {item._count.items} medicine(s)</Link>{item._count.items>0&&<Link className="font-semibold text-[#176452] underline" href={`/prescriptions/${item.id}?print=1`}>Print again</Link>}</div>):<p className="mt-3 text-sm text-muted-foreground">No prescription saved.</p>}</CardContent></Card></div></>;
}
