import Link from "next/link";
import { Search, UserRound, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatClinicDate, initials } from "@/lib/clinic-time";
import { ActionLink, EmptyState, PageHeading } from "@/components/clinic-ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function PatientsPage({searchParams}:{searchParams:Promise<{search?:string;page?:string}>}) {
  await requireUser(); const params=await searchParams; const search=(params.search||"").trim().slice(0,100); const page=Math.max(1,Number.parseInt(params.page||"1",10)||1);
  const where=search?{OR:[{name:{contains:search}},{phone:{contains:search}}]}:{};
  const [count,patients]=await db.$transaction([db.patient.count({where}),db.patient.findMany({where,orderBy:[{createdAt:"desc"},{id:"desc"}],take:20,skip:(page-1)*20,include:{_count:{select:{appointments:true,prescriptions:true,treatmentRecords:true}}}})]);
  const pageHref=(number:number)=>`/patients?${new URLSearchParams({search,page:String(number)})}`;
  return <><PageHeading title="Patients" description=""><ActionLink href="/patients/new">Add patient</ActionLink></PageHeading><Card className="gap-0 py-0"><div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-5"><h2 className="text-sm font-semibold">{count} {search?"matching":"registered"} {count===1?"patient":"patients"}</h2><form action="/patients" className="flex w-full gap-2 sm:w-auto"><Input className="h-9 bg-white sm:w-64" name="search" aria-label="Search patients" defaultValue={search} maxLength={100} placeholder="Search name or phone…"/><Button type="submit" variant="outline" className="h-9"><Search/><span className="sr-only">Search</span></Button>{search&&<Link href="/patients" className="self-center text-xs text-[#638468]">Clear</Link>}</form></div>
    {patients.length?<div className="overflow-x-auto px-4"><Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Phone</TableHead><TableHead>Registered</TableHead><TableHead>Activity</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{patients.map(patient=><TableRow key={patient.id}><TableCell className="py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#edf1e8] text-xs text-[#71915a]">{initials(patient.name)}</span><div><p className="font-medium">{patient.name}</p><p className="text-xs text-muted-foreground">ID {patient.id.slice(-8).toUpperCase()}</p></div></div></TableCell><TableCell className="text-muted-foreground">{patient.phone||"Not provided"}</TableCell><TableCell className="text-muted-foreground">{formatClinicDate(patient.createdAt)}</TableCell><TableCell><p className="text-xs">{patient._count.appointments} visits</p><p className="text-xs text-muted-foreground">{patient._count.treatmentRecords} treatments · {patient._count.prescriptions} Rx</p></TableCell><TableCell className="text-right"><Link href={`/patients/${patient.id}`} aria-label={`Open ${patient.name} patient profile`} className={buttonVariants({variant:"outline",size:"sm"})}><UserRound/>Patient profile</Link></TableCell></TableRow>)}</TableBody></Table></div>:<EmptyState icon={Users} title={search?"No matching patients":"No patients yet"} description={search?"Try another name or phone number.":"Register your first patient."} href={search?"/patients":"/patients/new"} action={search?"Clear search":"Add your first patient"}/>} 
    {count>20&&<div className="flex justify-between border-t px-6 py-4 text-xs"><span>Page {page} of {Math.ceil(count/20)}</span><div className="flex gap-4">{page>1&&<Link href={pageHref(page-1)}>Previous</Link>}{page*20<count&&<Link href={pageHref(page+1)}>Next</Link>}</div></div>}
  </Card></>;
}
